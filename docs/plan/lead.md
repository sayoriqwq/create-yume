# Create Yume 计划总览

> 本仓库后续工作分两层：**Infra Tier（基建，blocking）** 必须全部落地后再进入 **Code Tier（代码）**。
> 新 agent 只看本页就能决定从哪一份 sub-doc 开始，不用再翻历史盘点。

## 现状快照（2026-04-21）

已落地、无需再写进计划：

- pnpm catalog 作为全仓库版本单一来源（`pnpm-workspace.yaml`）
- Effect 3.21 / `@effect/platform` 0.96 / `@effect/platform-node` 0.106
- OTel tracing layer + DevTools + pretty logger（`apps/cli/src/core/services/tracing.ts`、`apps/cli/src/index.ts`）
- vitest 已装；首个测试 `apps/cli/src/core/services/template-helpers.test.ts`
- docs 已迁到仓库根 `docs/`；根 `eslint.config.mjs` 已排除 docs
- `@antfu/eslint-config` 解锁至 8.2.0
- lobe-commit 集成（`pnpm commit`）
- `fs.ts` / `planner.ts` 的 `provideService` 作者已决定**保留**以保证类型安全（commit `8107d8d`），不再视为清理项

追加快照（2026-04-22）：

- Infra 1 / Infra 2 已在本地 `main` 后续提交中落地。
- Code Tier Phase 0 基线已完成，归档目录：
  `/Users/sayori/Desktop/create-yume-phase0-baseline-20260422`。
- Phase 0 smoke 发现 OTel Node SDK 缺少运行时 peer，已补齐
  `@opentelemetry/sdk-trace-node` 的 catalog / CLI dependency / lockfile。
- Phase 1 清理已完成，产物对比目录：
  `/Users/sayori/Desktop/create-yume-phase1-output-20260422`。
- 下一轮从 [Phase 2 — 风格 & 正确性](./phase-2-style.md) 或
  [Phase 3 — 模板版本刷新](./phase-3-deps.md) 开始（二者可并行）。

下面是剩余工作。

## Infra Tier（blocking，先全部完成）

| 阶段    | 名称                        | Sub-doc                                                        | 依赖         |
| ------- | --------------------------- | -------------------------------------------------------------- | ------------ |
| Infra 0 | Schema + Brand 契约层       | [infra-0-contracts.md](./infra-0-contracts.md)                 | —            |
| Infra 1 | Runtime 合同（Config/Service/Obs） | [infra-1-runtime.md](./infra-1-runtime.md)              | Infra 0      |
| Infra 2 | 生命周期 + 测试基建          | [infra-2-lifecycle-testing.md](./infra-2-lifecycle-testing.md) | Infra 1      |
| Infra 3 | Agent 执行合同（AGENTS/verify）| [infra-3-agent-contract.md](./infra-3-agent-contract.md)    | 可并行       |

> `effect-foundation-plan.md` 原单文件计划已拆为上列 sub-doc，文件保留为指针。

## Code Tier（blocked on Infra Tier）

| 阶段    | 名称                   | 风险 | Sub-doc                                      |
| ------- | ---------------------- | ---- | -------------------------------------------- |
| Phase 0 | 准备 & 基线            | 无   | [phase-0-baseline.md](./phase-0-baseline.md) |
| Phase 1 | 清理（零行为变更）     | 低   | [phase-1-cleanup.md](./phase-1-cleanup.md)   |
| Phase 2 | 风格 & 正确性          | 低   | [phase-2-style.md](./phase-2-style.md)       |
| Phase 3 | 模板版本刷新           | 中   | [phase-3-deps.md](./phase-3-deps.md)         |
| Phase 4 | 功能扩展（mri + 回滚） | 中   | [phase-4-features.md](./phase-4-features.md) |
| Phase 5 | 测试 fixture / snapshot | 中   | [phase-5-tests.md](./phase-5-tests.md)       |
| Phase 6 | 文档对齐               | 无   | [phase-6-docs.md](./phase-6-docs.md)         |

Code 阶段内部依赖：Phase 0 → 1 → (2 ∥ 3) → 4 → 5 → 6。

## 贯穿两层的一致性约束

- 所有新增 Effect Service 必须走 Infra 1 的模板，不再手写 `Context.Tag + Layer.effect`。
- 所有外部输入（CLI flags、JSON 读入、问答结果）必须走 Infra 0 的 Schema decode。
- 关键标识（`ProjectName` / `TargetDir` / `TemplatePath` / `PackageName` / `CommandName`）禁止裸 `string`。
- 资源型副作用必须 scoped（Infra 2）。
- 只有入口模块可以 `runMain` / `runPromise`，其余只返回 `Effect`。
- 改代码走 `pnpm verify`；改 docs 不做自动检查，只人工 review（[infra-3-agent-contract.md](./infra-3-agent-contract.md) C 节选 C）。

## 端到端验证模板（Code Tier 每阶段执行）

```bash
pnpm --filter create-yume build
# 当前 tsdown 产物实际是 apps/cli/dist/index.js（入口一致性见 Infra 3 B）
node apps/cli/dist/index.js
# 分别手跑 preset react-app / vue-app，产物归档到仓库外作为 diff 基线
```

Phase 5 之后额外：`pnpm verify`。
Phase 6 结束时对比 Phase 0 的 baseline 产物：**除依赖版本和 partial 路径外，其余应无 diff**。

## 非目标

以下不纳入本轮计划，如需后续单独立项：

- 远程模板拉取 / 模板版本化
- 插件化 DSL 操作注册
- 对已有项目做增量 diff 更新
- 可视化配置界面
- 引入 `@effect/cluster` / `@effect/rpc` / `@effect/sql` / `@effect/workflow` 到主路径
