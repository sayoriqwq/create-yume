# Phase 1 — 清理（零行为变更）

← [Lead](./lead.md) · 前置：[Phase 0](./phase-0-baseline.md)

## 目的

删死代码、消冗余、修掉 TS 噪音。**所有改动保持 preset 产物字节相等**。

## 模块 A · Types

### `src/types/config.ts`

- [ ] 从 `ProjectConfig` union 移除 `NodeProjectConfig`（第 51-56、58 行）
- [ ] `src/types/project.ts` 同步删除仅它使用的 `NodeRuntime` / `PackageManager` / `NodeFramework`
- [ ] `src/core/compose.ts:46` 的 `formatConfigSummary` 里 `config.type === 'node'` 分支一并删掉
- [ ] 复查 `utils/type-guard.ts` 是否有 `isNodeProject` 未被引用 → 删

### `src/types/task.ts`

- [ ] `readExisting: boolean | undefined` → `readExisting?: boolean`（第 22、32 行）
- [ ] `sortKeys: boolean | undefined` → `sortKeys?: boolean`（第 23 行）
- [ ] 删除"bug?"注释

## 模块 B · Services

### `src/core/services/template-engine.ts`

- [ ] 删除 `registerTemplates` 方法（接口 + 实现，位于第 20、87-96 行）—— 仅 `core/services/compose.ts:16 buildTemplates` 在用，死 API
- [ ] 删除 `cache: Map<string, Handlebars.TemplateDelegate>`（第 43 行）及 `compile` 中的 `cache.get/set` —— 单次 CLI 进程中每模板最多编译一次，缓存无收益
- [ ] 接口定义同步更新

### `src/core/services/fs.ts`

- [ ] 移除每个方法尾部的 `.pipe(Effect.provideService(FileSystem.FileSystem, platformFs))`（第 42-70 行共 9 处）
- [ ] `platformFs` 已是解包实例，`provide` 多余；保留 `mapError` 即可

### `src/core/services/planner.ts`

- [ ] 第 158-160 行 `task.finalize!(d)` 改成：
  ```ts
  const finalize = task.finalize
  if (finalize) {
    draft = produce(draft, (d) => { finalize(d) })
  }
  ```
- [ ] 删除"这里是 bug 吗"注释

## 模块 C · tsconfig

### `apps/cli/tsconfig.json`

- [ ] Path alias 精简（第 16-22 行）
  - 保留：`@/*` → `src/*`
  - 决定保留还是删除 `~/*`（指向 `src/core/services/*`）：
    - 若保留 → 在本阶段末给 `apps/docs/overview.md §8` 补一句"`~/*` 是 services 短路径"
    - 若删除 → 全仓库 replace `~/fs` `~/template-engine` `~/planner` 等引用为 `@/core/services/...`
  - 删除：`@/types/*` `@/utils/*` `@/core/*` `@/templates/*`（均可由 `@/*` 覆盖）
- [ ] 同步 `apps/cli/tsconfig.build.json` 与 `tsconfig.runtime.json`（若各自覆写了 paths）

## 验证

- [ ] `pnpm build` 通过
- [ ] 生成 `phase1-react` 与 `phase1-vue`
- [ ] `diff -r baseline-react phase1-react` 应无差异（除非时间戳类字段）
- [ ] `diff -r baseline-vue phase1-vue` 同上
- [ ] `pnpm lint` 告警数 ≤ Phase 0 记录值

## 注意事项

- 凡是 `overview.md §8` 目录结构图里还提到 Node 的话，留到 Phase 6 一起更
- alias 二选一的决定建议记录在提交信息里，后来人 bisect 时能看到原因
