# Infra 2 — 生命周期 + 测试基建

← [Lead](./lead.md) · 前置：[Infra 1](./infra-1-runtime.md)

## 目的

把资源型副作用显式化（Scope / `acquireRelease`），把测试统一到 Effect 语义下（TestClock / ConfigProvider / Arbitrary）。这是 Code Tier 的 Phase 4（回滚）和 Phase 5（snapshot）能安全推进的前置。

> 状态：已完成。以下"当前缺口"保留为立项时快照，当前仓库已具备 scoped rollback、
> `tests/support/`、TestClock / ConfigProvider 示例，以及 Phase 5 直接复用的 fixture。

## 当前缺口（立项时，对照代码）

- `core/services/compose.ts` 的 `executeAllCommandsInDir` 仍用 `process.chdir` + try/finally 切目录。
- `planner.ts` 里没有 Ref/Scope 来追踪写入路径（Code Phase 4-B 的回滚需要）。
- 除 `template-helpers.test.ts` 外，没有其他测试样板；TestClock / ConfigProvider / Arbitrary 都未落。

## 交付物

### A. Scope / Resource 规范

- [ ] 新增 helper：`withWorkingDirectory(dir, command)`。**只能** 基于 `@effect/platform` 的 `Command.workingDirectory(cmd, dir)` 实现，**禁止** 内部回落到 `process.chdir`（否则只是把全局副作用包了一层）。
- [ ] 入参类型为 `Command.Command`（不接受"任意 Effect + 切换 cwd"的语义），强制消费者把需要 cwd 的工作表达成 Command。
- [ ] `planner.apply` 的写入轨迹改为 scoped Ref：`Ref.make<TargetDir[]>` 包在 `Effect.scoped` 里；出错时在释放阶段反向清理（为 Code Phase 4-B 搭好桥）。
- [ ] 临时目录 / 输出目录统一用 `Scope` 管理。

### B. 测试脚手架（`apps/cli/tests/`）

- [ ] 新建 `tests/support/` 目录：
  - `make-app-runtime.ts` — 构造 ManagedRuntime（Infra 3 准备落地前的轻量版）。
  - `fixtures.ts` — 复用的 `ProjectConfig` fixtures（供 Code Phase 5 继续扩）。
  - `clock.ts` — `TestClock` 包装器。
  - `config-provider.ts` — `ConfigProvider.fromMap` 包装器。
- [ ] 给 `FsService` / `TemplateEngineService` 写一组 mock layer（仅用于单测，不放 `src/`）。
- [ ] 至少 1 个 Schema decode 契约测试 + 1 个 TestClock 示例测试入库，作为模板。

### C. 约定文档

- [ ] `docs/conventions/effect-scope.md` — 哪些场景必须 scoped，释放顺序约定。
- [ ] `docs/conventions/effect-testing.md` — 测试目录结构、fixtures 位置、TestClock / ConfigProvider 使用方式。

## 验证

- `pnpm --filter create-yume test` 通过，且含至少 1 个 TestClock 用例和 1 个 ConfigProvider 用例。
- `rg 'process\.chdir' apps/cli/src` 返回 0 条（包括 helper 内部）。
- Code Phase 5 的 planner / render snapshot 可直接复用 `tests/support/fixtures.ts`。

## 非目标

- 不引入 vitest 之外的测试运行器。
- 不追求覆盖率目标；只定模板。
