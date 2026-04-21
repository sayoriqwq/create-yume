# Create Yume Effect 基建收口计划

> 本文档只定义计划，不包含实现变更。目标是为后续 agent 和人工协作提供更强的编码边界、统一约束和可验证契约。

## 背景

当前项目已经具备一层 Effect 骨架：

- 入口使用 `NodeRuntime.runMain` 驱动主程序。
- 已有 `Fs / Command / Planner / TemplateEngine / Orchestrator / Tracing` 等 Layer / Service。
- `tsconfig` 已开启 `strict`、`exactOptionalPropertyTypes`、`noUncheckedIndexedAccess` 等高强度静态约束。

但从“约束后续实现”的角度看，当前仍有几个明显缺口：

- 核心领域模型主要停留在 TypeScript 类型，缺少统一的运行时契约。
- 外部输入进入业务流程前，没有统一的 decode / validate 边界。
- Service / Layer 定义方式仍偏手写，后续贡献者容易写出不同风格。
- 配置、日志、测试时钟、资源生命周期，还没有形成统一规范。

这会直接影响后续 agent 的稳定性：即使 prompt 说得对，也容易因为缺少结构化边界而把值传错、漏掉配置校验、写出不可测试的时间逻辑，或者在资源清理上留下隐患。

## 目标

本计划希望建立一套“先约束、后实现”的基础设施，使后续功能开发默认走在正确轨道上。

目标包括：

- 让外部输入在进入核心逻辑前统一经过 `Schema` 边界。
- 让关键标识不再以裸 `string` 横穿系统。
- 让配置、日志、资源、时间、依赖注入都具备可复用的统一模板。
- 让 agent 在新增功能时优先复用现成约束，而不是临时拼装。

## 非目标

以下内容不纳入本轮计划：

- 引入新的重型运行时能力，如 `@effect/cluster`、`@effect/rpc`、`@effect/sql`、`@effect/workflow` 到主路径。
- 重写现有模板体系或 DSL 设计。
- 一次性把整个仓库全面迁移到纯 Effect 风格。
- 为了“更函数式”而额外增加抽象层。

## 规划原则

- 优先引入能直接提升边界清晰度的设施，而不是先扩展能力面。
- 优先为高频改动点建立契约：`ProjectConfig`、`Task`、模板路径、命令执行、环境配置。
- 优先让测试和验证成本下降，避免“写得越多，越难证明正确”。
- 优先小步落地，每一步都应能独立验收。

## 现状判断

结合当前代码结构，最值得优先收口的区域是：

- `apps/cli/src/types/config.ts`
  这里承载了脚手架的核心配置模型，但目前只有静态类型，没有统一的运行时验证入口。
- `apps/cli/src/core/questions/compose.ts`
  交互问答结束后直接拼装配置对象，缺少一次集中 decode。
- `apps/cli/src/core/services/*`
  已经有 Service / Layer 基础，但定义方式还没有规范化。
- `apps/cli/src/core/services/tracing.ts`
  已接入 tracing 入口，但尚未形成统一的 span / annotation 规范。
- `apps/cli/src/core/services/compose.ts`
  承担命令执行、阶段串接和目录切换，后续非常适合作为日志、资源、作用域约束的落点。

## 基建优先级

### P0. Schema-first 契约层

这是本计划的核心。需要把高频领域对象迁移为统一的 `Schema` 来源，而不是只保留 interface / type。

首批对象：

- `ProjectConfig`
- `Preset`
- `CreateMode`
- `Task / Plan`
- 模板注册项输入
- 命令执行请求模型

直接收益：

- 所有外部输入都能先 `decodeUnknown` 再进入业务逻辑。
- 可以复用同一个定义做 encode / validate / pretty error。
- 后续可基于同一份契约生成 `Standard Schema`、`JSON Schema`、测试数据生成器。

### P0. Brand 化关键标识

对容易被误传的字符串做名义类型化，避免结构类型带来的“字符串到处都能传”问题。

首批对象：

- `ProjectName`
- `TargetDir`
- `TemplatePath`
- `PackageName`
- `CommandName`

直接收益：

- agent 无法再轻易把路径、目录名、包名混用。
- 边界更明确，补全和报错也更有指向性。

### P1. AppConfig 统一配置层

把运行时配置统一收口到 `Config` 模块，而不是散落在各处读取环境变量。

首批内容：

- 日志级别
- 默认并发度
- tracing endpoint
- debug / experimental flags
- 后续可能加入的模板源策略开关

要求：

- 敏感值必须使用 `Redacted`
- 测试必须支持 `ConfigProvider.fromMap`
- 业务层不直接读取 `process.env`

### P1. Service / Layer 统一模板

为服务定义方式建立明确规范，优先采用 `Effect.Service`，至少也要形成固定模板。

收口目标：

- Service 命名
- Tag 暴露方式
- Live layer 命名
- mock / test layer 组织方式
- 服务依赖只在 layer 构造阶段暴露，不泄漏到接口签名

直接收益：

- 降低样板噪音。
- 提高后续 agent 在新增服务时的一致性。
- 更容易在测试里替换实现。

### P1. 结构化日志与 tracing 规范

把目前“可记录”升级为“必须按统一上下文记录”。

建议最小规范：

- 每个生成阶段建立命名 span。
- 每条关键日志至少带上：
  - `projectName`
  - `projectType`
  - `taskKind`
  - `targetPath`
- 错误日志必须保留领域错误标签和关键参数。

直接收益：

- agent 出错时能更快定位是哪一步、哪个文件、哪类任务失败。
- 后续 OTEL 可视化才有真正可用的数据。

### P2. Scope / Resource 生命周期规范

把所有资源型副作用显式化，避免清理逻辑继续散落在 `try/finally` 和临时约定里。

优先场景：

- 临时切换工作目录
- 临时文件 / 输出目录
- 后续若出现长生命周期命令执行或 watcher

要求：

- 资源获取与释放必须成对出现。
- 边界层优先使用 `Scope` / `acquireRelease`。

### P2. Testing 基建升级

测试必须围绕 Effect 语义设计，而不是只对字符串输出做黑盒断言。

首批能力：

- `Schema` decode / encode 契约测试
- `ConfigProvider.fromMap` 配置注入测试
- `TestClock` 支撑 timeout / retry / schedule 相关逻辑测试
- `Arbitrary` 或等价生成器支撑属性测试

直接收益：

- 后续引入重试、超时、并发控制后，测试不会依赖真实时间。
- agent 写测试时有固定工具链和结构。

### P3. ManagedRuntime 与程序化复用入口

CLI 主入口仍然保留 `runMain`，但为测试、脚本、未来集成入口准备可复用 runtime。

适用场景：

- 集成测试需要复用完整 app layer
- 非 CLI 方式触发生成流程
- 将来拆出 programmatic API

## 分阶段执行计划

| 阶段 | 名称 | 目标 | 主要产物 | 风险 |
| --- | --- | --- | --- | --- |
| Phase 0 | 契约收口 | 建立 `Schema` 与 `Brand` 基础 | `schema/`、`brand/`、核心模型迁移清单 | 低 |
| Phase 1 | 运行时边界 | 收口 `AppConfig`、Service 模板、日志规范 | `AppConfig`、日志注解规则、服务样板 | 中 |
| Phase 2 | 生命周期与测试 | 引入 `Scope` 规范和测试支架 | scoped helper、TestClock / ConfigProvider 样板 | 中 |
| Phase 3 | 程序化复用 | 建立 `ManagedRuntime` 复用入口 | runtime factory、集成测试入口 | 中 |

## 每阶段建议交付物

### Phase 0 交付物

- `docs/conventions/effect-schema.md`
- `docs/conventions/effect-brand.md`
- 核心模型迁移清单
- “哪些输入必须 decode” 的边界表

### Phase 1 交付物

- `docs/conventions/effect-config.md`
- `docs/conventions/effect-service.md`
- `docs/conventions/effect-observability.md`
- `AppConfig` 字段白名单

### Phase 2 交付物

- `docs/conventions/effect-scope.md`
- `docs/conventions/effect-testing.md`
- 测试目录和命名规范

### Phase 3 交付物

- `docs/conventions/effect-runtime.md`
- runtime 复用场景说明

## 建议落地顺序

1. 先做 `Schema + Brand`，因为这是所有边界的基础。
2. 再做 `AppConfig` 和 Service 模板，避免新代码继续沿用旧风格。
3. 然后补 observability 规范，让改动过程具备可观察性。
4. 接着补 `Scope` 和测试支架，为后续复杂逻辑兜底。
5. 最后才考虑 `ManagedRuntime` 和对外复用入口。

## 对 agent 的约束规则

本计划最终希望沉淀成下面这些项目规则：

- 所有外部输入必须先 decode，再进入业务逻辑。
- 关键领域标识禁止使用裸 `string`。
- 除边界层外，不直接读取环境变量。
- 新服务必须使用统一 Service / Layer 模板。
- 时间相关逻辑必须可由 `TestClock` 驱动验证。
- 资源型副作用必须 `scoped`。
- 只有入口模块可以执行 `runMain` / `runPromise`，其余模块只返回 `Effect`。

## 验收标准

当以下条件成立时，可以认为本计划完成：

- 核心模型都拥有统一的 `Schema` 来源。
- 至少一组关键标识完成 Brand 化，并被主流程消费。
- 环境配置有唯一入口，测试可以注入 mock provider。
- 新增服务不再出现多套定义风格。
- 日志和 tracing 至少在生成主流程具备统一 annotation。
- 时间和配置相关逻辑具备稳定、可重复的测试方式。
- 文档能明确告诉后续 agent “新增功能该沿哪条路径接入”。

## 风险与取舍

- 风险一：一次迁移过大，导致文档和实现脱节。
  处理：按阶段交付，每一步都先明确边界和示例。

- 风险二：为了统一而引入过多抽象。
  处理：优先复用 Effect 官方能力，不额外发明框架。

- 风险三：Schema 推得太深，影响迭代速度。
  处理：先覆盖高频核心模型，再逐步扩展到边缘对象。

## 下一步建议

建议以下一项作为首个执行切口：

- 先定义 `ProjectConfig`、`Preset`、`Task` 的 `Schema` 与 Brand 边界。

这是投入最小、收益最高的一步。它一旦完成，后续问答流、模板注册、计划生成、测试输入都会立刻获得更强约束。
