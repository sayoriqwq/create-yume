# 当前阶段架构计划 - Foundation Gates

> 本文定义哪些基础边界必须保留，以及 capability-owner migration 开始前必须完成的 gates。

## 必须保留的基础边界

- `PlanService` 的 `build/apply` 分离。
- `PlanSpec` 的可序列化边界。
- `TemplateEngineService` 对 Handlebars runtime 的集中管理。
- `FsService` 的 repo-local 错误边界。
- rollback 语义。
- 既有 `fs.ts` / `planner.ts` 中为类型安全保留的 `provideService` 决策，不作为本轮清理目标。

## Gate 1：`CommandService.execute` 边界闭包

### 问题

当前 `CommandService.execute` 仍把平台 executor requirement 暴露给调用方。

### Done 条件

- 调用方只依赖 `CommandService`。
- `execute` 的公开签名不再泄漏平台 executor requirement。
- 命令执行行为有回归覆盖。

### 最低验证

- 命令相关测试或等效覆盖
- 相关构建通过

## Gate 2：Planner Path Ownership Guardrail

### 问题

当前 planner apply 仍按 task kind 并发，不按显式 path ownership 管控冲突。

### Done 条件

- planner 在 build 或 apply 前能拒绝重复 target path 冲突，或有明确定义的安全串行规则。
- 规则被记录在代码和计划文档里。
- 重复路径行为有测试覆盖。

### 最低验证

- `pnpm --filter create-yume test`

## Gate 3：Runtime / Config 语义边界清理

### 问题

当前 shared config 里仍混入 React/Vue 语义不同的字段，文档与代码都不够诚实。

### Done 条件

- shared config 只保留真正语义共享的字段。
- framework-specific 字段不再被描述为 shared。
- 计划文档与代码中的 boundary 一致。

### 最低验证

- 相关 schema / config / runtime 改动的构建与测试通过
- 跨越 runtime + template + config 时直接跑 `pnpm verify`

## 启动规则

- 在 docs 和 code 两边，三个 gate 都完成前，不允许开始 capability-owner migration。
- `router` pilot 也不例外。

## 当前阶段非目标

- 在 gate 未完成时先做 owner 迁移再回头补安全边界。
- 用“文档先写了”替代代码里的实际 gate 完成。
