# Phase 1 — 清理（零行为变更）

← [Lead](./lead.md) · 前置：[Phase 0](./phase-0-baseline.md)

## 目的

删死代码、消冗余、修掉 TS 噪音。**所有改动保持 preset 产物字节相等**。

> **与 Infra 的关系**：Phase 1 只做"删 / 改口径"类清理。新增 Schema / Brand / AppConfig 属于 Infra Tier，不在本阶段。

## 模块 A · Types

### `apps/cli/src/types/config.ts`

- [ ] 从 `ProjectConfig` union 移除 `NodeProjectConfig`
- [ ] `apps/cli/src/types/project.ts` 同步删除仅 Node 变体使用的 `NodeRuntime` / `PackageManager` / `NodeFramework`
- [ ] `apps/cli/src/core/compose.ts` 的 `formatConfigSummary` 里 `config.type === 'node'` 分支删除
- [ ] 复查 `apps/cli/src/utils/type-guard.ts` 是否有 `isNodeProject` 未被引用 → 删
- [ ] **注**：若 Infra 0 已将 `ProjectConfig` 迁到 Schema，本清理改为同步更新 Schema union

### `apps/cli/src/types/task.ts`

- [ ] `readExisting: boolean | undefined` → `readExisting?: boolean`
- [ ] `sortKeys: boolean | undefined` → `sortKeys?: boolean`
- [ ] 删除 "需要显示指定才不报错，是bug？" 注释

## 模块 B · Services

### `apps/cli/src/core/services/template-engine.ts`

- [ ] 删除 `registerTemplates` 方法（接口定义 + 实现）—— 仅 `core/services/compose.ts` 的 `buildTemplates` 在用，死 API
- [ ] 删除 `cache: Map<string, Handlebars.TemplateDelegate>` 及 `compile` 中的 `cache.get/set` —— 单次 CLI 进程中每模板最多编译一次，缓存无收益
- [ ] 接口定义同步更新

### `apps/cli/src/core/services/fs.ts`

- [ ] **不动**。commit `8107d8d` 已决定保留每个方法尾部的 `.pipe(Effect.provideService(FileSystem.FileSystem, platformFs))` 以维持类型安全；历史 status 里的"可删"结论作废。

### `apps/cli/src/core/services/planner.ts`

- [ ] `task.finalize!(d)` 处改为：
  ```ts
  const finalize = task.finalize
  if (finalize) {
    draft = produce(draft, (d) => { finalize(d) })
  }
  ```
- [ ] 删除"这里是 bug 吗"注释

## 模块 C · tsconfig

### `apps/cli/tsconfig.json`

- [ ] Path alias 精简（`compilerOptions.paths`）
  - 保留：`@/*` → `src/*`
  - 决定保留还是删除 `~/*`（指向 `src/core/services/*`）：
    - 若保留 → 在 `docs/overview.md §8` 补一句"`~/*` 是 services 短路径"
    - 若删除 → 全仓库 replace `~/fs` / `~/template-engine` / `~/planner` 等引用为 `@/core/services/...`
  - 删除：`@/types/*` / `@/utils/*` / `@/core/*` / `@/templates/*`（均可由 `@/*` 覆盖）
- [ ] 同步 `apps/cli/tsconfig.build.json` 与 `tsconfig.runtime.json`（若各自覆写了 paths）

## 验证

- [ ] `pnpm --filter create-yume build` 通过
- [ ] `pnpm --filter create-yume typecheck` 通过
- [ ] 生成 `phase1-react` 与 `phase1-vue`
- [ ] `diff -r baseline-react phase1-react` 应无差异
- [ ] `diff -r baseline-vue phase1-vue` 同上
- [ ] `pnpm lint` 告警数 ≤ Phase 0 记录值

## 注意事项

- 凡是 `docs/overview.md §8` 目录结构图里还提到 Node 的话，留到 Phase 6 一起更
- alias 二选一的决定建议记录在提交信息里，后来人 bisect 时能看到原因
