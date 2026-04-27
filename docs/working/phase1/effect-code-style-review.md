# Effect 代码风格 Review

## 审核来源

- 本地入口：`docs/agent/effect/roadmap.md`。
- 参考语料：`docs/agent/effect/llms.txt`、`docs/agent/effect/llms-small.txt`。
- 审核对象：`apps/cli/src/` 中 Effect、Schema、Service、Config、Scope、Testing、Observability 的使用方式。

## 审核结论

当前 Effect 使用整体健康：运行时执行集中在入口，service boundary 清楚，配置使用 `Config.*`，外部输入主要通过 Schema 解码，rollback 使用 scoped finalizer，测试中已有 `TestClock` 示例。它不是“把 Promise 包一层 Effect”的浅迁移，而是已经把错误、依赖、配置和资源生命周期纳入 Effect 模型。

本次复核时，早期指出的几个小范围偏移已经收敛：封闭 union 分支已使用 `never` 穷尽性辅助函数兜底，`finishProject` 的 span / taskKind 已保持一致，Husky hook 写入也已从 shell redirection 改为结构化 hook spec + `node -e` 写入命令。当前仍值得持续关注的是 brand 边界和 post-generate hook 写入是否需要进一步纳入 plan task / rollback 语义。

## 基线逐项评审

### 1. 入口与运行时边界

状态：基本符合。

证据：

- `apps/cli/src/index.ts` 构建主 `program` 并使用 `NodeRuntime.runMain(program)` 运行。
- CLI args decode 在进入主流程前通过 `parseCliArgs(...)` 与 Schema 边界完成。
- `--help` / `--version` 是外层 CLI 快路径，直接输出并退出。

判断：

- 主程序执行停留在最外层边界，符合 `runMain` 基线。
- `parseCliArgs` 是同步 schema decode，当前边界可接受。
- help / version 快路径形成 Effect runtime 与直接 Node IO 两套入口风格，但当前范围内不值得为风格纯度重构。

### 2. Effect 组合风格

状态：符合。

证据：

- `apps/cli/src/core/questions/compose.ts` 使用 `Effect.gen` 表达顺序化交互流程。
- `apps/cli/src/core/services/plan/apply.ts` 使用 `Effect.scoped(Effect.gen(...))` 表达计划应用与 rollback 生命周期。
- `apps/cli/src/core/services/template-engine.ts` 使用 `Effect.gen` 表达 helper / partial 准备与模板渲染。

判断：

- 有局部变量、分支、循环的 effectful 逻辑基本都使用 `Effect.gen`，符合组合基线。
- 简单 pipeline 如 schema decode 与 error map 也保持可读。
- 不需要为了函数式风格把清楚的 `Effect.gen` 改成 point-free pipeline。

### 3. 分支与穷尽性

状态：已修正。

证据：

- `apps/cli/src/core/questions/compose.ts` 定义 `assertNever(value: never)`。
- `projectType`、`preset`、`createMode` 的分支都在已知 literal union 后回落到 `assertNever(...)`。
- `apps/cli/src/schema/project-config.ts` 中 `ProjectConfigSchema` 仍是 `VueProjectConfigSchema | ReactProjectConfigSchema` 的封闭 union。
- `apps/cli/src/schema/preset.ts` 中 preset 与 create mode 也是 literal union。

判断：

- 当前实现已经把“新增 case 必须处理”的知识交回 TypeScript 编译期。
- 非法外部输入仍由 `decodeProjectConfig` / `decodeCliArgs` 在边界处失败，不需要进入业务分支后再 defect。

建议：

- 后续新增 scaffold type、preset 或 create mode 时，先更新 schema，再让编译器暴露所有未穷尽分支。

### 4. Brand 边界

状态：已有基础，service interface 仍可收紧。

证据：

- `apps/cli/src/brand/` 下为 project name、target dir、template path、command name、package name 建立了 brand。
- `PlanService.apply`、`TemplateEngineService.render`、`CommandService.make` 等语义边界已经使用对应 brand。
- `FsService` 作为通用文件服务仍以 raw `string` 表达 path。

判断：

- 对项目名、目标目录、模板路径、命令名的 brand 化是正确方向。
- `FsService` 需要服务多类路径，继续接收 raw string 有现实合理性。

建议：

- 不要把 `FsService` 立即改成只接受 brand；它需要服务多类路径。
- 优先在更高层保持 brand。
- 如果发现真实混用错误，再引入更细的 `GeneratedPath` / `ProjectRelativePath`，不要为类型洁癖预先扩张 brand。

### 5. Service 与 Layer 边界

状态：符合。

证据：

- `AppConfig`、`FsService`、`CommandService`、`TemplateEngineService`、`PlanService`、`OrchestratorService` 都以 service/layer 边界组织。
- `CliContext` 使用 context tag 承载本次 CLI 调用的动态输入，而不是伪装成稳定应用 service。

判断：

- 这些 service 都代表可复用能力和明确实现边界。
- 当前 public layer graph 已经足够清晰，不建议继续拆成更多 public service。

### 6. Config

状态：符合。

证据：

- `apps/cli/src/config/app-config.ts` 使用 `Config.all` 聚合运行时配置。
- `OTEL_EXPORTER_OTLP_ENDPOINT` 通过 redacted config 读取。
- `apps/cli/src` 中没有把业务配置散落成临时 `process.env` 读取。

判断：

- 运行时配置有明确边界。
- 敏感或准敏感 endpoint 使用 redaction，符合基线。

建议：

- 后续新增环境配置时继续进入 `AppConfig`，不要在 service 内临时读环境变量。

### 7. Schema 与 contract boundary

状态：基本符合。

证据：

- `schema/cli-args.ts` 解码 CLI args。
- `schema/project-config.ts` 导出 project config schema 与解码器。
- `schema/plan-spec.ts` 导出可序列化 `PlanSpec` 与解码器。
- `core/questions/compose.ts` 对交互或 preset 收集到的 config 做 decode。
- `core/adapters/json.ts` 对 JSON parse 做 Effect + Schema 边界。

判断：

- CLI 输入和 project config 在边界处解码，符合基线。
- `PlanSpec` 作为可序列化 contract 已建模。

建议：

- 如果未来从磁盘或外部 JSON 读取 `PlanSpec`，必须使用 `decodePlanSpec` 后再进入 `PlanService`。
- 当前内部 `toPlanSpec(plan)` 不需要再 decode 一次，避免无意义 runtime 成本。

### 8. Scope 与 Cleanup

状态：符合，且是当前代码的强项。

证据：

- `apps/cli/src/core/services/plan/apply.ts` 定义 rollback finalizer。
- plan apply 使用 `Effect.scoped(...)` 与 `Scope.addFinalizerExit` 管理失败清理。
- cleanup 失败时记录 warning，不遮蔽原始失败。

判断：

- rollback 生命周期附着在 plan apply 边界上，而不是散落给调用者。
- cleanup failure 不覆盖原始失败，符合 Effect resource management 基线。

建议：

- 继续保留 scoped cleanup 模型。
- 如果 hook 文件写入改成 plan task，可以自然纳入同一 rollback 机制。

### 9. Testing

状态：有基线示例，整体可继续加强。

证据：

- `apps/cli/tests/test-clock.test.ts` 使用 `TestClock` 控制时间。
- 多数 service tests 使用 Layer/mock 提供依赖，而不是依赖真实环境。
- planner、template render、rollback、workspace bootstrap 都已有针对性测试或 snapshot。

判断：

- 当前测试方式符合 Effect 原生 seam 的方向。

建议：

- 新增 service 行为时继续优先通过 Layer/mock 提供依赖。
- 对 rollback、command failure、schema failure 这类 Effect error channel 行为，优先断言 `Exit` 或 typed error，而不是只断言 thrown exception。

### 10. Observability

状态：符合。

证据：

- 阶段级逻辑使用 `Effect.withSpan`。
- `apps/cli/src/core/services/observability.ts` 将 project annotations 统一封装。
- `finishProject` 使用 span `finish.project`，并以同名 task kind 调用 `withProjectAnnotations`。
- `executePostGenerateCommand` 在 command 级别补充 command owner、contribution unit 与 phase annotation。
- `CommandService` 对 command execution 使用 span `command.execute`，并记录 command / args / cwd。

判断：

- 阶段级 spans 命名总体一致：`questions.collect`、`generate.project`、`orchestrator.execute`、`plan.build`、`plan.apply`、`template.render`、`finish.project`、`command.execute`。
- 阶段 annotation 与叶子 command annotation 已分离，不再把 finish 阶段误标为 command execution。

建议：

- 注意 `CommandService` 当前 log debug 会记录完整 command output；虽然当前命令不处理 secrets，但后续若引入 token 环境或外部 auth，要避免输出敏感内容。

## 优先级建议

1. **保持 Config / Schema / Service / Scope 当前方向。** 这些是当前实现质量较高的区域。
2. **继续用编译期穷尽性守住封闭 union。** 新增分支时不要退回 defect channel。
3. **评估是否把 post-generate hook 写入继续收进 plan task。** 当前已经摆脱 shell redirection，但 hook 文件仍发生在 plan apply 之后，尚未共享 plan rollback。
4. **保持 `finish.project` 与 command 级 observability 分离。** 阶段 span 与叶子 command span 不应混淆。

## 非问题 / 不建议调整

- 不建议把所有代码改成 pipeline；当前 `Effect.gen` 更适合这些顺序化 CLI 流程。
- 不建议把所有 raw string path 都强行 brand 化；应优先在真实语义边界保留 brand。
- 不建议把内部 helper 都升级为 public service；当前 Layer graph 已经足够清晰。
