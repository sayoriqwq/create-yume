# 代码设计哲学 Review

## 审核来源

- 外部基线：`software-design-philosophy-skill/SKILL.md`，基于 John Ousterhout 的《A Philosophy of Software Design》。
- 本地约束：`docs/agent/constraint/architecture.md`。
- 审核对象：`apps/cli/src/` 当前 CLI 架构与主要执行路径。

## 审核结论

当前代码已经从早期的 stage-oriented planning 走向 ownership-oriented architecture，整体方向符合“用深模块管理复杂度”的目标。`PlanService`、`TemplateEngineService`、`FsService`、`PlanSpec` 和 Schema 边界都在承担明确的复杂度吸收职责，不建议重写稳定核心。

主要风险不在“没有抽象”，而在少数抽象边界继续混入了跨层知识：共享前端模板与 workspace bootstrap、计划 DSL 与计划执行、交互式问题流程与 preset 派生逻辑。这些点会增加后续扩展 React / Vue 能力时的 change amplification 与 cognitive load。

## 设计质量观察

### 正向信号

1. **稳定核心是深模块，而不是浅包装。**
   - `PlanService` 对外只暴露 `build` 与 `apply`，内部吸收 DSL 收集、冲突检测、文件写入、rollback 与并发执行。
   - `TemplateEngineService` 对外隐藏 Handlebars runtime、partial 注册与 compile/render 错误映射。
   - `FsService` 把平台文件错误统一映射为 `FileIOError`，降低调用方对 `@effect/platform` 细节的依赖。

2. **边界 contract 正在收敛。**
   - `schema/project-config.ts`、`schema/plan-spec.ts`、`schema/cli-args.ts` 将外部输入与可序列化计划集中建模。
   - `brand/*` 已经为 `ProjectName`、`TargetDir`、`TemplatePath`、`CommandName`、`PackageName` 建立语义边界。

3. **ownership-oriented architecture 已经有可见结构。**
   - `core/ownership/model.ts` 定义了 `PreservedCore`、`ScaffoldFamily`、`WorkspaceBootstrap`、`Capability`。
   - `core/owners/router.ts` 与 `core/owners/state-management.ts` 已把 capability owner 从 React / Vue 家族模板中抽出。

## 主要问题

### P1. `frontend-app.ts` 仍混合 Shared Frontend 与 Workspace Bootstrap 信息

证据：

- `apps/cli/src/core/template-registry/frontend-app.ts:70` 定义 `sharedFrontendTemplates`。
- `apps/cli/src/core/template-registry/frontend-app.ts:127` 同文件定义 `workspaceBootstrapTemplates`。
- `apps/cli/src/core/template-registry/frontend-app.ts:197` 的 `assembleFrontendFamilyTemplates` 同时拼接 shared frontend、workspace bootstrap 与 family-local templates。
- `apps/cli/src/core/template-registry/frontend-app.ts:126` 仍保留注释：`Explicitly left in place for F2 so shared frontend policy stops leaking through one mixed bag.`

设计哲学判断：这是 **information leakage / special-general mixture**。Shared frontend scaffold 与 workspace bootstrap 是不同设计决策：前者关心 Vite、HTML、TS config、CSS；后者关心 Git、ESLint、Husky、commitlint。把它们放在同一 registry assembly 中，会让每个前端家族模板天然继承 workspace bootstrap 知识。

影响：

- 新增 frontend family 时，调用方必须理解 workspace bootstrap entry 也被自动拼进去。
- 调整 Git / lint / code-quality 时，会触碰 frontend scaffold 文件。
- `assembleFrontendFamilyTemplates` 的名字不能完整表达它实际组装了 workspace bootstrap。

建议：

- 保留 public behavior，先做内部拆分：
  - `core/template-registry/frontend-app.ts` 只保留 shared frontend family entries。
  - 新增 `core/template-registry/workspace-bootstrap.ts` 承载 workspace bootstrap templates。
  - 新增一个更明确的组合函数，例如 `assembleProjectTemplates(...)`，由 Orchestrator 或更高层组合 shared frontend、workspace bootstrap、family local entries。
- 不要改变 `PlanService` 或 template task 语义；这属于 registry ownership 重组，不是执行核心重写。

### P2. `PlanService` 是深模块，但内部 cognitive load 过高

证据：

- `apps/cli/src/core/services/planner.ts` 当前约 549 行。
- `apps/cli/src/core/services/planner.ts:104` `toPlanSpec` 处理 plan serialization。
- `apps/cli/src/core/services/planner.ts:190` `build` 内联 DSL builder。
- `apps/cli/src/core/services/planner.ts:392` `registerRollbackFinalizer` 管理 scoped rollback。
- `apps/cli/src/core/services/planner.ts:413` `runTask` 执行 copy/render/json/text。
- `apps/cli/src/core/services/planner.ts:523` / `:524` 按任务类别拆分并发执行。

设计哲学判断：`PlanService` 的 public interface 是深的，但实现内部混合了四类设计决策：DSL 构造、PlanSpec 投影、文件系统写入策略、rollback 生命周期。这不一定要求拆 public module，但已经让维护者阅读一个变更时必须吸收过多上下文。

影响：

- 修改 `toPlanSpec` 的 serialization 需要在同一文件面对执行路径与 rollback 细节。
- 修改 rollback 行为时容易误触任务执行或 DSL builder。
- 后续新增 task kind 时，需要同时理解 serialization、execution、conflict、cleanup 四个区域。

建议：

- 保持 `PlanService` 的 `build/apply` 接口不变，只做内部文件拆分：
  - `planner/spec.ts`：`toPlanSpec`、operation metadata。
  - `planner/dsl.ts`：DSL builder 与 `annotateOperation`。
  - `planner/apply.ts`：`runTask`、duplicate target detection、apply ordering。
  - `planner/rollback.ts`：created paths/directories tracking 与 finalizer。
- 拆分时不要改变 snapshot 输出；先用现有 planner tests 锁住行为。

### P3. 闭合集合仍依赖 runtime defect 兜底

证据：

- `apps/cli/src/core/questions/compose.ts:135` 对 unsupported project type 使用 `Effect.dieMessage`。
- `apps/cli/src/core/questions/compose.ts:173` 对 unsupported preset 使用 `Effect.dieMessage`。
- `apps/cli/src/core/questions/compose.ts:191` 对 unsupported create mode 使用 `Effect.dieMessage`。

设计哲学判断：这是 **unknown unknowns** 的小型来源。项目当前只支持 React / Vue、preset 也只有 `react-app` / `vue-app`，这些都是封闭集合。对封闭集合使用 runtime defect 会把“新增 case 时必须处理”的知识留给运行时，而不是编译器。

影响：

- 新增 scaffold type 或 preset 时，编译器不能稳定指出所有遗漏的分支。
- `Effect.dieMessage` 代表 defect，不适合表达可建模的 contract 分支。

建议：

- 对封闭 union 使用显式 `never` exhaustiveness helper，或使用 `Match.exhaustive`。
- 如果外部输入可能非法，应在 Schema decode 边界失败，而不是进入业务分支后 defect。

### P4. Workspace bootstrap 的 hook 写入通过 shell 字符串表达，接口不够深

证据：

- `apps/cli/src/core/workspace-bootstrap.ts:107` 起生成 post-generate commands。
- `apps/cli/src/core/workspace-bootstrap.ts:121`、`:128`、`:135` 使用 `sh -c echo ... > .husky/...` 写 hook 文件。
- `apps/cli/src/core/commands/index.ts:59` 将这些 specs 直接转成 `CommandService.make(...)`。

设计哲学判断：这把“写 hook 文件”的设计决策编码成 shell command 字符串，属于 **implementation detail contaminates interface**。调用方看到的是 command specs，但真实语义是创建或覆盖若干文件并设置权限。

影响：

- hook 内容、文件权限、跨平台 shell 行为都藏在字符串里。
- 如果之后需要 Windows 支持、dry run、计划预览、rollback 或更细诊断，shell 字符串会放大变更范围。
- `PlanSpec` 能表达 text mutation，但 hook 文件写入绕过了计划层。

建议：

- 近期可先把 hook command rendering 封装成专门函数，并为每个 hook spec 增加结构化字段。
- 更好的方向是把 Husky hook 写入建模为 plan text tasks，`pnpm exec husky init` 只负责初始化必要目录或完全被定义出错条件替代。
- 这样可以把文件写入、rollback、trace、snapshot 都收回 `PlanService`。

### P5. `TemplateEngineService` 的注册顺序泄漏给调用方

证据：

- `apps/cli/src/core/services/template-engine.ts:18` / `:19` 暴露 `registerHelpers` 与 `registerPartials`。
- `apps/cli/src/core/services/orchestrator.ts:40` 起必须按 helpers → partials → build plan → apply 的顺序调用。
- `apps/cli/src/core/services/template-engine.ts:39` 内部维护单例 Handlebars runtime。

设计哲学判断：这是轻度 **conjoined methods / temporal decomposition**。调用方必须知道 template engine 在 render 前需要先注册 helpers 与 partials，而不是只告诉它“用这些 partial roots 渲染”。

影响：

- 新增 render 调用入口时容易漏掉初始化步骤。
- Orchestrator 承担了 template engine 生命周期知识。

建议：

- 可以保留当前 shape，但下一步应考虑让 TemplateEngine 提供一个更深的接口，例如 `prepare(partialEntries)` 或 `renderWithRegistry(...)`。
- 如果注册必须独立暴露，至少把初始化顺序写成 interface comment，并在 Orchestrator 中收敛为单一 helper。

## 优先级建议

1. **先拆 `frontend-app.ts` 的 workspace bootstrap registry。** 这是最明显的信息泄漏，且不需要触碰执行核心。
2. **给封闭 union 分支补编译期穷尽性。** 改动小，风险低，能减少 future case 漏处理。
3. **把 Husky hook 写入从 shell 字符串逐步结构化。** 这是后续可观测性、rollback 与跨平台能力的关键前置。
4. **最后再做 `PlanService` 内部拆分。** 它是稳定核心，必须在测试与 snapshot 保护下做纯内部重组。

## 非问题 / 不建议重议

- 不建议重写 `PlanService`、`PlanSpec`、`TemplateEngineService`、`FsService` 的存在价值；这些仍是当前有效的深模块。
- 不建议回到单纯 stage-oriented planning；当前 owner / contribution unit 模型更符合信息隐藏方向。
- 不建议引入远程模板、插件系统或 Node 项目脚手架；它们仍在产品边界之外。
