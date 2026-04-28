# 代码设计哲学 Review

## 审核来源

- 外部基线：`software-design-philosophy-skill/SKILL.md`，基于 John Ousterhout 的《A Philosophy of Software Design》。
- 本地约束：`docs/agent/constraint/architecture.md`。
- 审核对象：`apps/cli/src/` 当前 CLI 架构与主要执行路径。

## 审核结论

当前代码已经从早期的 stage-oriented planning 走向 ownership-oriented architecture，整体方向符合“用深模块管理复杂度”的目标。`PlanService`、`TemplateEngineService`、`FsService`、`PlanSpec` 和 Schema 边界都在承担明确的复杂度吸收职责，不建议重写稳定核心。

本次复核时，Phase 1 早期指出的多项问题已经收敛：workspace bootstrap registry 已从 `frontend-app.ts` 拆出；`PlanService` public facade 保持稳定，内部 build / apply 已分文件；封闭 union 分支已使用编译期穷尽性；Husky hook 写入已从 shell redirection 改为结构化 hook spec；TemplateEngine 也提供 `prepare(...)` 收敛 helper 与 partial 注册顺序。

当前剩余的主要设计关注点是：post-generate hook 文件仍在 plan apply 之后通过 command 写入，因此还没有共享 plan task 的 snapshot、rollback 与 text mutation 语义。这不是当前必须立即修正的问题，但后续若要增强 dry run、计划预览、跨平台支持或失败恢复，应优先重新评估这条边界。

## 设计质量观察

### 正向信号

1. **稳定核心是深模块，而不是浅包装。**
   - `PlanService` 对外只暴露 `build` 与 `apply`，内部通过 `plan/build.ts` 与 `plan/apply.ts` 吸收 DSL 收集、PlanSpec 投影、冲突检测、文件写入、rollback 与并发执行。
   - `TemplateEngineService` 对外隐藏 Handlebars runtime、helper 注册、partial 注册与 compile/render 错误映射。
   - `FsService` 把平台文件错误统一映射为 `FileIOError`，降低调用方对 `@effect/platform` 细节的依赖。

2. **边界 contract 正在收敛。**
   - `schema/project-config.ts`、`schema/plan-spec.ts`、`schema/cli-args.ts` 将外部输入与可序列化计划集中建模。
   - `brand/*` 已经为 `ProjectName`、`TargetDir`、`TemplatePath`、`CommandName`、`PackageName` 建立语义边界。

3. **ownership-oriented architecture 已经有可见结构。**
   - `core/ownership/model.ts` 定义了 `PreservedCore`、`ScaffoldFamily`、`WorkspaceBootstrap`、`Capability`。
   - `core/owners/router.ts` 与 `core/owners/state-management.ts` 已把 capability owner 从 React / Vue 家族模板中抽出。
   - `core/template-registry/workspace-bootstrap.ts` 承载 workspace-owned fragment render，`core/workspace-bootstrap.ts` 承载 workspace package mutation 与 post-generate command policy。

## 已收敛的 Phase 1 问题

### 1. Shared Frontend 与 Workspace Bootstrap registry 已拆分

当前事实：

- `core/template-registry/frontend-app.ts` 只定义 shared frontend templates 与组装策略。
- `core/template-registry/workspace-bootstrap.ts` 定义 ESLint、`.gitignore`、commitlint、lint-staged 等 workspace bootstrap templates。
- `assembleFrontendFamilyTemplates(...)` 仍会把 shared frontend、workspace bootstrap 与 family-local templates 组合为完整前端项目 registry，但 workspace bootstrap 的条目来源已经独立。

判断：

- 早期的 mixed bag 风险已明显降低。
- 函数名仍偏向 frontend family，而实际产出是完整项目模板集合；如果后续继续扩展 owner 层，可以再考虑改名为更明确的 project-level assembly。

### 2. PlanService public facade 保持稳定，内部 cognitive load 已降低

当前事实：

- `core/services/planner.ts` 保持 `PlanService.build` / `PlanService.apply` facade。
- DSL builder、operation metadata 与 `toPlanSpec` 位于 `core/services/plan/build.ts`。
- duplicate target-path conflict、文件写入、并发执行与 rollback 位于 `core/services/plan/apply.ts`。
- planner snapshot 与 public boundary 测试已经覆盖这个拆分现实。

判断：

- 这是符合深模块原则的拆分：public API 没有变浅，内部文件边界降低了维护者一次性需要吸收的上下文。
- 后续新增 task kind 时，仍要同步考虑 serialization、execution、conflict 和 cleanup 四类影响。

### 3. 闭合集合已使用编译期穷尽性

当前事实：

- `core/questions/compose.ts` 使用 `assertNever(value: never)` 处理理论上的不可达分支。
- Project type 仍只支持 `react` 与 `vue`。
- Preset 仍只支持 React / Vue 的封闭组合集合。

判断：

- 非法外部输入由 Schema decode 处理。
- 新增 scaffold type 或 preset 时，TypeScript 能更稳定地暴露遗漏分支。

### 4. Workspace bootstrap hook 写入已结构化，但仍在 post-generate command 边界

当前事实：

- `core/workspace-bootstrap.ts` 定义 `WorkspaceBootstrapHookSpec`，显式记录 hook path、content 与 executable。
- hook command 渲染集中在 `renderHuskyHookCommandSpec(...)`，当前使用 `node -e` 写文件与设置权限，而不是 `sh -c` redirection。
- `getWorkspaceBootstrapCommandSpecs(...)` 仍把 hook 写入作为 post-generate commands 的一部分，执行发生在 plan apply 之后。

判断：

- shell 字符串隐藏语义的问题已改善，接口能直接表达“写哪个 hook、写什么内容、是否可执行”。
- 但 hook 文件写入仍未进入 plan task，因此不能共享 `PlanSpec` snapshot、plan rollback、text task ownership 等能力。

建议：

- 只有当真实需求需要 dry run、计划预览、失败恢复或跨平台一致性时，再把 hook 文件写入提升为 plan text task。
- 在那之前，保持当前结构化 command policy，不要退回散落的 shell 字符串。

### 5. TemplateEngine 初始化顺序已由 `prepare(...)` 收敛

当前事实：

- `TemplateEngineService.prepare(config, partialRoot)` 负责准备 helpers 与 partials。
- `OrchestratorService` 只需要在 build/apply 前调用一次 `prepare(...)`，不再分别知道 helper 与 partial 的注册细节。

判断：

- 早期 conjoined methods / temporal decomposition 风险已降低。
- 如果未来新增多套 template runtime 或多阶段 render，再考虑把 prepare 与 render 合并成更深接口；当前不需要为风格纯度重构。

## 当前优先级建议

1. **保持稳定核心不变。** 不要重写 `PlanService`、`PlanSpec`、`TemplateEngineService`、`FsService` 的存在价值。
2. **继续维护 owner / contribution unit 事实。** 新增模板、package mutation 或 post-generate command 时必须标注 ownership，并让测试覆盖关键 owner 边界。
3. **谨慎推进 post-generate hook 写入的 plan 化。** 只有在 rollback、preview、dry run 或跨平台需求出现时再做，不要为了抽象洁癖提前复杂化。
4. **保持产品边界。** 不建议引入远程模板、插件系统、Node 项目脚手架或已有项目增量更新；它们仍在当前范围之外。

## 非问题 / 不建议重议

- 不建议回到单纯 stage-oriented planning；当前 owner / contribution unit 模型更符合信息隐藏方向。
- 不建议把内部 helper 全部升级为 public service；当前 Layer graph 已经足够清晰。
- 不建议仅因 `assembleFrontendFamilyTemplates(...)` 会组合 workspace bootstrap 就重写 registry；当前拆分已经足以表达 owner 边界。
