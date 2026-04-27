# Effect 代码风格 Review

## 审核来源

- 本地入口：`docs/agent/effect/roadmap.md`。
- 代码风格基线：`docs/agent/effect/code-style/*.md`。
- 参考语料：`docs/agent/effect/llms.txt`、`docs/agent/effect/llms-small.txt`。
- 审核对象：`apps/cli/src/` 中 Effect、Schema、Service、Config、Scope、Testing、Observability 的使用方式。

## 审核结论

当前 Effect 使用整体健康：运行时执行集中在入口，service boundary 清楚，配置使用 `Config.*`，外部输入主要通过 Schema 解码，rollback 使用 scoped finalizer，测试中已有 `TestClock` 示例。它不是“把 Promise 包一层 Effect”的浅迁移，而是已经把错误、依赖、配置和资源生命周期纳入 Effect 模型。

需要修正的点主要是风格一致性与边界收紧：封闭 union 分支不应使用 `Effect.dieMessage` 兜底；部分 brand 在 service 接口处退回了 raw string；observability 的 span / taskKind 有一处命名不一致；post-generate command 仍把结构化文件修改藏进 shell 字符串。

## 基线逐项评审

### 1. 入口与运行时边界

状态：基本符合。

证据：

- `apps/cli/src/index.ts:123` 构建 `program`。
- `apps/cli/src/index.ts:128` 使用 `NodeRuntime.runMain(program)` 运行主 Effect。
- `apps/cli/src/index.ts:94` 对 CLI args decode 使用 `Effect.runSync(Effect.either(...))`。

判断：

- 主程序执行停留在最外层边界，符合 `runMain` 基线。
- `parseCliArgs` 是同步 schema decode，`runSync` 可接受。
- `--help` / `--version` 分支在 `apps/cli/src/index.ts:84` / `:90` 直接 `console.log` + `process.exit`，属于外层 CLI 快路径，当前可以接受，但它形成了 Effect runtime 与直接 Node IO 两套入口风格。

建议：

- 若未来需要统一 tracing/logging/exit code，可把 help/version 也收进一个 `main` 分支，由 `NodeRuntime.runMain` 统一处理。
- 现在不必为风格纯度重构入口。

### 2. Effect 组合风格

状态：多数符合。

证据：

- `apps/cli/src/core/questions/compose.ts` 大量使用 `Effect.gen` 表达顺序化交互流程。
- `apps/cli/src/core/services/planner.ts:505` 起使用 `Effect.scoped(Effect.gen(...))` 表达计划应用流程。
- `apps/cli/src/core/services/template-engine.ts:54` 起使用 `Effect.gen` 表达 partial 注册。

判断：

- 有局部变量、分支、循环的 effectful 逻辑基本都使用 `Effect.gen`，符合组合基线。
- 简单 pipeline 如 schema decode 与 error map 也保持可读。

建议：

- 不需要为了函数式风格把清楚的 `Effect.gen` 改成 point-free pipeline。
- `PlanService` 内部可以拆文件，但不应牺牲当前顺序控制流的可读性。

### 3. 分支与穷尽性

状态：需要修正。

证据：

- `apps/cli/src/core/questions/compose.ts:135` 使用 `Effect.dieMessage('Unsupported project type')`。
- `apps/cli/src/core/questions/compose.ts:173` 使用 `Effect.dieMessage('Unsupported preset')`。
- `apps/cli/src/core/questions/compose.ts:191` 使用 `Effect.dieMessage('Unsupported create mode')`。
- `apps/cli/src/schema/project-config.ts:100` `ProjectConfigSchema` 是 `VueProjectConfigSchema | ReactProjectConfigSchema` 的封闭 union。
- `apps/cli/src/schema/preset.ts` 中 preset 与 create mode 也是 literal union。

判断：

- Effect 基线要求封闭集合优先使用编译期穷尽性，不要依赖 runtime defect 或“不可能发生”的 default 分支。
- 这里的 `dieMessage` 是 defect channel，不适合表达已知 literal union 的分支完整性。

建议：

- 对 `projectType`、`preset`、`createMode` 使用显式 `never` exhaustiveness：

```ts
function absurd(value: never): never {
  throw new Error(`Unreachable case: ${String(value)}`)
}
```

- 或使用 `Match.exhaustive`，但只有当它提升可读性时再引入。
- 非法外部输入应由 `decodeProjectConfig` / `decodeCliArgs` 失败，不应进入业务分支后 defect。

### 4. Brand 边界

状态：已有基础，service interface 仍可收紧。

证据：

- `apps/cli/src/brand/project-name.ts`、`target-dir.ts`、`template-path.ts`、`command-name.ts`、`package-name.ts` 使用 `Schema.brand`。
- `apps/cli/src/core/services/compose.ts:73` 从 `projectConfig.name` 构造 `TargetDir`。
- `apps/cli/src/core/services/fs.ts:6` 起 `FsServiceShape` 仍以 raw `string` 表达所有 path。
- `apps/cli/src/core/services/template-engine.ts:19` / `:21` 对 template path 使用 `TemplatePath`，但 namespace 仍是 raw `string`。

判断：

- 对项目名、目标目录、模板路径、命令名的 brand 化是正确方向。
- `FsService` 作为通用文件服务继续接收 raw string 有现实合理性，但它也意味着部分 path category error 无法被类型系统阻止。

建议：

- 不要把 `FsService` 立即改成只接受 brand；它需要服务多类路径。
- 优先在更高层保持 brand：`TemplateEngineService`、`PlanService.apply`、`CommandService.make` 这些语义边界已经适合保留 brand。
- 如果发现真实混用错误，再引入更细的 `GeneratedPath` / `ProjectRelativePath`，不要为类型洁癖预先扩张 brand。

### 5. Service 与 Layer 边界

状态：符合。

证据：

- `apps/cli/src/config/app-config.ts:15` 定义 `AppConfig` service。
- `apps/cli/src/core/services/fs.ts:25` 定义 `FsService`。
- `apps/cli/src/core/services/command.ts:14` 定义 `CommandService`。
- `apps/cli/src/core/services/template-engine.ts:31` 定义 `TemplateEngineService`。
- `apps/cli/src/core/services/planner.ts:184` 定义 `PlanService`。
- `apps/cli/src/core/services/orchestrator.ts:28` 定义 `OrchestratorService`。

判断：

- 这些 service 都代表可复用能力和明确实现边界。
- `CliContext` 使用 `Context.GenericTag` 而不是 `Effect.Service`，符合“动态 context-like 值不要伪装成稳定应用 service”的基线。

建议：

- 保持当前 service 粒度。
- 若后续拆 `PlanService` 内部文件，不要拆成更多 public service；先保持 public layer graph 稳定。

### 6. Config

状态：符合。

证据：

- `apps/cli/src/config/app-config.ts:16` 使用 `Config.all`。
- `apps/cli/src/config/app-config.ts:17` / `:18` / `:20` 使用默认值。
- `apps/cli/src/config/app-config.ts:19` 对 `OTEL_EXPORTER_OTLP_ENDPOINT` 使用 `Config.redacted`。
- 扫描结果显示 `apps/cli/src` 中没有直接 `process.env` 访问。

判断：

- 运行时配置有明确边界。
- 敏感或准敏感 endpoint 使用 redaction，符合基线。

建议：

- 后续新增环境配置时继续进入 `AppConfig`，不要在 service 内临时读环境变量。

### 7. Schema 与 contract boundary

状态：基本符合。

证据：

- `apps/cli/src/schema/cli-args.ts:22` 解码 CLI args。
- `apps/cli/src/schema/project-config.ts:124` 起导出 project config 解码器。
- `apps/cli/src/schema/plan-spec.ts:146` 导出 `decodePlanSpec`。
- `apps/cli/src/core/questions/compose.ts:96` 对收集到的 config 做 decode。
- `apps/cli/src/core/adapters/json.ts` 对 JSON parse 做 Effect + Schema 边界。

判断：

- CLI 输入和 project config 在边界处解码，符合基线。
- `PlanSpec` 作为可序列化 contract 已建模。

建议：

- 如果未来从磁盘或外部 JSON 读取 `PlanSpec`，必须使用 `decodePlanSpec` 后再进入 `PlanService`。
- 当前内部 `toPlanSpec(plan)` 不需要再 decode 一次，避免无意义 runtime 成本。

### 8. Scope 与 Cleanup

状态：符合，且是当前代码的强项。

证据：

- `apps/cli/src/core/services/planner.ts:392` 定义 `registerRollbackFinalizer`。
- `apps/cli/src/core/services/planner.ts:409` 使用 `Scope.addFinalizerExit`。
- `apps/cli/src/core/services/planner.ts:505` 使用 `Effect.scoped(...)` 包裹 `apply`。
- `apps/cli/src/core/services/planner.ts:366` / `:382` cleanup 失败时记录 warning，不遮蔽原始失败。

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
- 多数 service tests 使用 `Layer.succeed` mock service，而不是依赖真实环境。
- 扫描结果显示 `apps/cli/src` 中没有 `setTimeout` / sleep 式业务等待。

判断：

- 当前测试方式符合 Effect 原生 seam 的方向。

建议：

- 新增 service 行为时继续优先通过 Layer/mock 提供依赖。
- 对 rollback、command failure、schema failure 这类 Effect error channel 行为，优先断言 `Exit` 或 typed error，而不是只断言 thrown exception。

### 10. Observability

状态：基本符合，有一处命名不一致。

证据：

- 扫描结果显示 `apps/cli/src` 中有 8 个 `Effect.withSpan`。
- `apps/cli/src/core/services/observability.ts:23` 将 project annotations 统一封装。
- `apps/cli/src/core/services/compose.ts:139` 使用 span `finish.project`。
- `apps/cli/src/core/services/compose.ts:140` 却调用 `withProjectAnnotations(config, 'command.execute', ...)`。
- `apps/cli/src/core/services/command.ts:43` command execution 使用 span `command.execute`，并记录 command / args / cwd。

判断：

- 阶段级 spans 命名总体一致：`questions.collect`、`generate.project`、`orchestrator.execute`、`plan.build`、`plan.apply`、`template.render`、`command.execute`。
- `finishProject` 的 span 是 `finish.project`，annotation 的 taskKind 却是 `command.execute`，会让日志和 trace 查询出现语义错位。

建议：

- 将 `finishProject` 的 annotation taskKind 改为 `finish.project`。
- 保留 command 级 annotation 在 `executePostGenerateCommand` 内部，避免阶段 annotation 与叶子 command annotation 混淆。
- 注意 `CommandService` 当前 log debug 会记录完整 command output；虽然当前命令不处理 secrets，但后续若引入 token 环境或外部 auth，要避免输出敏感内容。

## 优先级建议

1. **修正封闭 union 的 `Effect.dieMessage` 兜底。** 这是最明确的 Effect 风格偏离。
2. **修正 `finishProject` 的 observability taskKind。** 改动极小，能提升 trace 可读性。
3. **保持 Config / Schema / Service / Scope 当前方向。** 这些是当前实现质量较高的区域。
4. **逐步结构化 post-generate hook 写入。** 这既是 Effect cleanup/observability 改进，也是设计哲学上的信息隐藏改进。

## 非问题 / 不建议调整

- 不建议把所有代码改成 pipeline；当前 `Effect.gen` 更适合这些顺序化 CLI 流程。
- 不建议把所有 raw string path 都强行 brand 化；应优先在真实语义边界保留 brand。
- 不建议把内部 helper 都升级为 public service；当前 Layer graph 已经足够清晰。
