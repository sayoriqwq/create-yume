# Create Yume 当前阶段架构计划（Lead）

> 本文是当前 active lead。上一轮已经完成的历史主线计划已归档到
> [../archive/plan/lead-2026-04-22-completed.md](../archive/plan/lead-2026-04-22-completed.md)。

## 范围

当前阶段只做一件事：把现有“按执行阶段散落的决策”收敛成一套可以长期扩展的 ownership hierarchy，同时保留已经健康的执行内核。

这轮计划服务于以下未来方向：

- `node`
- monorepo / workspace
- CLI setup
- 更强的 traceability
- 更强的 self-maintainability
- 未来 agent-assisted / agent-autonomous template maintenance

## 非目标

- 立即引入插件系统
- 重写 planner / template engine / rollback
- 直接开始实现 `node` / monorepo
- 一次性迁移多个 capability owner

## 当前基线

- 上一轮 Infra / Code Tier 主线已完成并归档，不再重开。
- 当前实现仍以 React / Vue scaffold 为主。
- `fs.ts` / `planner.ts` 中为类型安全保留的 `provideService` 决策，不作为本轮清理目标。
- docs-only 变更继续按 [docs/verification-matrix.md](../verification-matrix.md) 走人工校对。

## 原则

1. 保留 proven core：`PlanService`、`PlanSpec`、`TemplateEngineService`、`FsService`、rollback 不是重写目标。
2. 自上而下建立 ownership：preserved core -> scaffold-family -> workspace/bootstrap -> capability owner。
3. 先定义 contribution units，再定义 owner contract。
4. 先过安全 gate，再开始迁移。
5. 先用一个 pilot owner 证明模型，再决定是否扩展。

## 决策驱动

1. 未来扩展到 `node` / monorepo / setup 时，不能继续放大 cross-cutting edits。
2. 计划、执行、路径归属和 bootstrap 副作用必须更可追溯。
3. 模板 / 依赖 / breaking API 的后续维护必须能局部归属，而不是继续散落。

## 备选方案

| 方案 | 结论 | 优点 | 缺点 |
| --- | --- | --- | --- |
| A. 保持 stage-oriented，只做局部清理 | 不选 | 变更最小 | 根因不动，后续扩展继续横向扩散 |
| B. 在现有 pipeline 上增量引入 layered ownership | 选中 | 解决 root cause，又不推翻现有执行内核 | 有一段 old/new 共存过渡期 |
| C. 立即上完整插件系统 | 不选 | 理论上最强扩展性 | 当前仓库过度设计，验证和迁移成本过高 |

## 选型

选择 **B. layered ownership over existing pipeline**。

执行含义：

- 外层执行链路继续保留。
- 先把 hierarchy、contribution units 和 foundation gates 定死。
- 第一个 proof 只做 `router`。

## Ownership Layer Model

1. Preserved Core
2. Scaffold-Family Owner
3. Workspace/Bootstrap Owner
4. Capability Owner

详细定义见：[ownership-model.md](./ownership-model.md)。

## Hard Pre-Migration Gates

在 docs 和 code 两边，以下三项全部完成前，不允许开始 owner migration：

1. `CommandService.execute` 边界闭包
2. planner path ownership guardrail
3. runtime / config semantic cleanup

详细定义见：[foundation-gates.md](./foundation-gates.md)。

## Named Pilot Owner

当前阶段唯一 pilot owner：`router`

详细说明见：[pilot-router-owner.md](./pilot-router-owner.md)。

## 执行顺序

1. [ownership-model.md](./ownership-model.md)
2. [contribution-units.md](./contribution-units.md)
3. [foundation-gates.md](./foundation-gates.md)
4. [scaffold-and-workspace-owners.md](./scaffold-and-workspace-owners.md)
5. [pilot-router-owner.md](./pilot-router-owner.md)
6. [verification-rollout.md](./verification-rollout.md)

## 全局验收标准

1. active `docs/plan/lead.md` 只保留前瞻性架构计划，历史完成内容只留在 archive。
2. `docs/plan/` 必须包含本轮固定的 7 个文件，不允许为了补结构空洞再发明新的核心计划文档。
3. ownership hierarchy 必须完整出现，不能直接跳到 capability owner。
4. contribution units 必须先于 owner contract 定义。
5. 三个 hard gates 必须有 done 条件，并明确写明“不完成不迁移”。
6. 当前阶段只能有一个 pilot owner：`router`。
7. 验证策略必须绑定现有仓库的验证矩阵，而不是泛泛地写“跑测试”。

## 验证映射

- docs-only：人工校对
- planner / registry 变化：`pnpm --filter create-yume test`
- template engine / helper / partial 变化：`pnpm --filter create-yume test`
- `package-json` 变化：`pnpm --filter create-yume build` + 产物检查
- 混合 runtime / template / config 变化：`pnpm verify`

后续代码执行顺序与 stop/go 条件见：[verification-rollout.md](./verification-rollout.md)。
