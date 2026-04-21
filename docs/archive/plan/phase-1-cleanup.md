# Phase 1 — 清理（零行为变更）

← [Lead](../../plan/lead.md) · 前置：[Phase 0](./phase-0-baseline.md)

## 目的

删死代码、消冗余、修掉 TS 噪音。**所有改动保持 preset 产物字节相等**。

> **与 Infra 的关系**：Phase 1 只做"删 / 改口径"类清理。新增 Schema / Brand / AppConfig 属于 Infra Tier，不在本阶段。

## 模块 A · Types

### `apps/cli/src/types/config.ts`

- [x] 从 `ProjectConfig` union 移除 `NodeProjectConfig`（Infra 0 后已无该类型）
- [x] `apps/cli/src/types/project.ts` 同步删除仅 Node 变体使用的 `NodeRuntime` / `PackageManager` / `NodeFramework`（Infra 0 后已无该类型）
- [x] `apps/cli/src/core/compose.ts` 的 `formatConfigSummary` 里 `config.type === 'node'` 分支删除（复查已无该分支）
- [x] 复查 `apps/cli/src/utils/type-guard.ts` 是否有 `isNodeProject` 未被引用 → 删（复查已无该函数）
- [x] **注**：若 Infra 0 已将 `ProjectConfig` 迁到 Schema，本清理改为同步更新 Schema union

### `apps/cli/src/types/task.ts`

- [x] `readExisting: boolean | undefined` → `readExisting?: boolean`
- [x] `sortKeys: boolean | undefined` → `sortKeys?: boolean`
- [x] 删除 "需要显示指定才不报错，是bug？" 注释

## 模块 B · Services

### `apps/cli/src/core/services/template-engine.ts`

- [x] 删除 `registerTemplates` 方法（接口定义 + 实现）—— 仅 `core/services/compose.ts` 的 `buildTemplates` 在用，死 API（复查已无该方法）
- [x] 删除 `cache: Map<string, Handlebars.TemplateDelegate>` 及 `compile` 中的 `cache.get/set` —— 单次 CLI 进程中每模板最多编译一次，缓存无收益
- [x] 接口定义同步更新

### `apps/cli/src/core/services/fs.ts`

- [x] **不动**。commit `8107d8d` 已决定保留每个方法尾部的 `.pipe(Effect.provideService(FileSystem.FileSystem, platformFs))` 以维持类型安全；历史 status 里的"可删"结论作废。

### `apps/cli/src/core/services/planner.ts`

- [x] `task.finalize!(d)` 处改为：
  ```ts
  const finalize = task.finalize
  if (finalize) {
    draft = produce(draft, (d) => { finalize(d) })
  }
  ```
- [x] 删除"这里是 bug 吗"注释

## 模块 C · tsconfig

### `apps/cli/tsconfig.json`

- [x] Path alias 精简（`compilerOptions.paths`）
  - 保留：`@/*` → `src/*`
  - 保留 `~/*`（指向 `src/core/services/*`），并已在 `docs/overview.md §8` 记录
  - 删除：`@/types/*` / `@/utils/*` / `@/core/*` / `@/templates/*`（均可由 `@/*` 覆盖）
- [x] 同步 `apps/cli/tsconfig.build.json` 与 `tsconfig.runtime.json`（二者未覆写 paths，无需改动）

## 验证

- [x] `pnpm --filter create-yume build` 通过
- [x] `pnpm --filter create-yume typecheck` 通过
- [x] 在 `/Users/sayori/Desktop/create-yume-phase1-output-20260422` 生成同名 `baseline-react` 与 `baseline-vue`
- [x] `diff -ru --exclude=.git --exclude=node_modules` 对比 React baseline 无差异
- [x] `diff -ru --exclude=.git --exclude=node_modules` 对比 Vue baseline 无差异
- [x] `pnpm lint` 告警数 ≤ Phase 0 记录值

## 注意事项

- 凡是 `docs/overview.md §8` 目录结构图里还提到 Node 的话，留到 Phase 6 一起更
- alias 二选一的决定建议记录在提交信息里，后来人 bisect 时能看到原因

Done at commit `6f2c80d`.
