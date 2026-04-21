# Phase 2 — 风格 & 正确性

← [Lead](./lead.md) · 前置：[Phase 1](./phase-1-cleanup.md)

## 目的

修掉 Phase 1 之外的隐性坑。行为上与 Phase 0 产物应一致（partial 路径调整除外）。

## 模块 A · `core/services/compose.ts`

### `executeAllCommandsInDir`（第 61-74 行）

- [ ] 放弃 `process.chdir` 方案（非并发安全、污染进程状态）
- [ ] 改用 `@effect/platform` 的 `Command.workingDirectory(cmd, dir)`：
  ```ts
  for (const command of commands) {
    const located = Command.workingDirectory(command, dir)
    yield * commandSvc.execute(located as StandardCommand)
  }
  ```
- [ ] 函数去掉 `previousCwd` 和 `try/finally`，签名保持不变
- [ ] 复查 `CommandService.execute` 的类型参数是否要放宽（`Command.workingDirectory` 可能返回非 `StandardCommand`）

## 模块 B · `templates/partials/` & partial 注册

### 当前隐式行为

`core/services/compose.ts:33 collectPartialEntries` 把 `partialRoot` 自身当作 global 命名空间注册；`registerPartials` 只读当层 `.hbs`，靠"只读当层"避开 `vue/` `react/` 子目录，行为正确但隐晦。

### 采用方案 B（推荐，与 `vue` / `react` 命名空间同构）

- [ ] 新建 `apps/cli/templates/partials/global/`
- [ ] 移动现有 `apps/cli/templates/partials/` 下的全局 partial 文件（当前有 `import-root-css.hbs` 等）到 `global/`
- [ ] `core/services/compose.ts:33 collectPartialEntries` 把最后一条 `partialRoot` + `global` 改成 `path.join(partialRoot, 'global')` + `global`
- [ ] 全仓库 grep `{{> import-root-css}}` → 改为 `{{> global/import-root-css}}`
  - 影响模板：所有 `fragments/**/*.hbs` 里对 global partial 的引用
- [ ] 如果模板少、改引用麻烦 → 保留 `global` 命名空间 + 在注册时同时 alias 一份无前缀的（次选，不推荐）

### 如果选方案 A（备选）

- [ ] `registerPartials` 内用 `fs.stat` 过滤 `.isDirectory()`，显式跳过子目录
- [ ] 不迁移文件，`{{> import-root-css}}` 调用方不变

## 验证

- [ ] `pnpm build`
- [ ] 生成 `phase2-react` 与 `phase2-vue`
- [ ] 若选方案 B：`diff` 会显示若干 `.hbs` 里的 `{{> ...}}` 变化，手 review
- [ ] 产物项目里 `index.html`、`main.tsx` 等渲染正常（partial 替换正确）
- [ ] 产物内 `pnpm install && pnpm build` 仍能通过

## 注意事项

- 方案 A、B 不要混用；承担风险是分散的
- `Command.workingDirectory` 的类型变化如果让 `CommandService.execute` 要改，拆成独立 commit
