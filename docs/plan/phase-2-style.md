# Phase 2 — 风格 & 正确性

← [Lead](./lead.md) · 前置：[Phase 1](./phase-1-cleanup.md)

## 目的

修掉 Phase 1 之外的隐性坑。行为上与 Phase 0 产物应一致（partial 路径调整除外）。

> **与 Infra 的关系**：`process.chdir` 替换方案已在 [Infra 2](./infra-2-lifecycle-testing.md) A 里抽成 `withWorkingDirectory` helper；本阶段消费该 helper，不自己再实现一遍。

## 模块 A · `apps/cli/src/core/services/compose.ts`

### `executeAllCommandsInDir`

- [ ] 放弃 `process.chdir`（非并发安全、污染进程状态）。合同硬口径：**整条 Code Tier 禁止任何形式的 `process.chdir`**，包括包一层 helper；唯一允许方式是 `Command.workingDirectory` 或 Infra 2 的 `withWorkingDirectory`（其内部也必须基于 `Command.workingDirectory`）。
- [ ] **优先**：调用 Infra 2 的 `withWorkingDirectory(dir, cmd)` helper
- [ ] **退化方案**（若 Infra 2 尚未合入）：就地使用 `Command.workingDirectory`：
  ```ts
  for (const command of commands) {
    const located = Command.workingDirectory(command, dir)
    yield* commandSvc.execute(located as StandardCommand)
  }
  ```
- [ ] 函数去掉 `previousCwd` 和 `try/finally`，签名保持不变
- [ ] 复查 `CommandService.execute` 的类型参数是否需要放宽

## 模块 B · `apps/cli/templates/partials/` 与 partial 注册

### 当前隐式行为

`core/services/compose.ts` 的 `collectPartialEntries` 把 `partialRoot` 自身当作 global 命名空间注册；`registerPartials` 只读当层 `.hbs`，靠"只读当层"避开 `vue/` `react/` 子目录，行为正确但隐晦。

### 采用方案 B（推荐，与 `vue` / `react` 命名空间同构）

- [ ] 新建 `apps/cli/templates/partials/global/`
- [ ] 移动现有 `apps/cli/templates/partials/` 下的全局 partial 文件（`import-root-css.hbs` 等）到 `global/`
- [ ] `collectPartialEntries` 把最后一条 `partialRoot` + `global` 改成 `path.join(partialRoot, 'global')` + `global`
- [ ] 全仓库 grep `{{> import-root-css}}` → 改为 `{{> global/import-root-css}}`
  - 影响模板：`fragments/**/*.hbs` 里对 global partial 的引用

### 如果选方案 A（备选）

- [ ] `registerPartials` 内用 `fs.stat` 过滤 `.isDirectory()`，显式跳过子目录
- [ ] 不迁移文件，`{{> import-root-css}}` 调用方不变

## 验证

- [ ] `pnpm --filter create-yume build`
- [ ] 生成 `phase2-react` 与 `phase2-vue`
- [ ] 若选方案 B：`diff` 会显示若干 `.hbs` 里的 `{{> ...}}` 变化，手 review
- [ ] 产物项目里 `index.html`、`main.tsx` 等渲染正常（partial 替换正确）
- [ ] 产物内 `pnpm install && pnpm build` 仍能通过

## 注意事项

- 方案 A、B 不要混用
- `Command.workingDirectory` 的类型变化如果让 `CommandService.execute` 要改，拆成独立 commit

Done at commit `ab1702b`.
