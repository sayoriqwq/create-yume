# Infra 1 — Runtime 合同（AppConfig / Service / 可观测性）

← [Lead](./lead.md) · 前置：[Infra 0](./infra-0-contracts.md)

## 目的

让运行时配置只有一个入口（`AppConfig`）、Service 定义只有一种写法、日志和 tracing 有统一的 annotation。避免新加功能时各写一套。

## 当前缺口（对照代码）

- 没有 `AppConfig`。`OTEL_EXPORTER_OTLP_ENDPOINT` 目前直接在 `core/services/tracing.ts` 里读，没有统一白名单。
- Service 都是手写 `class X extends Context.Tag('X')<X, T>() {}` + `Layer.effect(...)`；没有采用 `Effect.Service` / 统一模板。
- tracing layer 接上了（`core/services/tracing.ts`），但没有 span 命名和 annotation 规范。

## 交付物

### A. `AppConfig`（新建 `apps/cli/src/config/app-config.ts`）

- [ ] 字段白名单（首批）：
  - `logLevel`: `LogLevel`
  - `defaultConcurrency`: `number`
  - `tracingEndpoint`: `Option<Redacted<string>>`
  - `debug`: `boolean`
- [ ] 所有字段通过 `Config.*` 组合读取；敏感值必须 `Config.redacted`。
- [ ] `tracing.ts` 改从 `AppConfig` 拿 `tracingEndpoint`。
- [ ] `constants/effect.ts` 的 `DEFAULT_CONCURRENCY` 改由 `AppConfig.defaultConcurrency` 提供（边界层外不再直接 import）。
- [ ] 测试通过 `ConfigProvider.fromMap` 注入 mock。

### B. Service 统一模板

- [ ] 选定 `Effect.Service` 作为默认写法（对比 `Context.Tag + Layer.effect`）。
- [ ] 逐个迁移现有服务：`Fs`、`Command`、`Plan`、`TemplateEngine`、`Orchestrator`。迁移顺序建议：Fs → Command → TemplateEngine → Plan → Orchestrator。
- [ ] 依赖关系只在 layer 构造期声明，不泄漏到服务接口签名。

### C. 可观测性约定

- [ ] 每个生成阶段一个命名 span：`questions.collect`、`plan.build`、`plan.apply`、`template.render`、`command.execute`。
- [ ] 每条关键日志至少带：`projectName`、`projectType`、`taskKind`、`targetPath`。
- [ ] 错误日志保留领域错误 tag（`FileIOError` / `TemplateError` / `CommandError`）和关键参数。

## 约定文档

- [ ] `docs/conventions/effect-config.md` — `AppConfig` 字段白名单、测试注入方式。
- [ ] `docs/conventions/effect-service.md` — Service 模板、命名、层次。
- [ ] `docs/conventions/effect-observability.md` — span 名称、log annotation、错误模型。

## 验证

- `pnpm --filter create-yume build` 通过。
- 本地带 `OTEL_EXPORTER_OTLP_ENDPOINT` 跑一次 `react-app`，span 在 collector 可见且符合命名约定。
- 至少一组测试使用 `ConfigProvider.fromMap` 替换 `AppConfig`。
- `process.env` 直接读取在业务层 grep 不到（只允许边界层）。

## 非目标

- 不引入 `@effect/cluster` / `@effect/rpc` 等到主路径。
- 不新增日志 sink；继续用 `Logger.pretty` + OTel。
