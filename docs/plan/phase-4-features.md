# Phase 4 — 功能扩展

← [Lead](./lead.md) · 前置：[Phase 1](./phase-1-cleanup.md)、[Phase 2](./phase-2-style.md)、[Phase 3](./phase-3-deps.md)

## 目的

补上 `overview.md §10` 列出的两个主要缺口：**非交互模式** 和 **失败回滚**。两者彼此独立，可拆成两个 PR。

## 模块 A · 非交互模式（mri 启用）

`mri@^1.2.0` 已在 `dependencies` 里，但全项目无 import。本阶段激活它。

### 最小可用集

只支持下列 flags，交互模式仍为默认行为：

```
create-yume \
  --preset react-app | vue-app \
  --name <project-name> \
  [--yes]                       # 跳过"目录已存在"这类确认
  [--install | --no-install]    # 覆盖 askInstallDeps
  [--git | --no-git]            # 覆盖 askGit（仅 create 模式下有意义）
```

### 实现步骤

- [ ] 新建 `src/core/cli-args.ts`：
  ```ts
  import mri from 'mri'

  export interface CliArgs {
    preset?: 'react-app' | 'vue-app'
    name?: string
    yes?: boolean
    install?: boolean
    git?: boolean
  }
  export function parseArgs(argv: string[]): CliArgs { /* mri + 手工 normalize */ }
  ```
- [ ] `src/index.ts` 顶部：`const args = parseArgs(process.argv.slice(2))`；通过 `Context.Tag` 或直接作为参数传递给 `collectQuestions`
- [ ] `src/core/questions/compose.ts`：
  - `collectQuestions` 接 `CliArgs`
  - `askPreset` 前：若 `args.preset` 存在，直接返回
  - `askProjectName` 前：若 `args.name` 存在且目录不存在，直接返回；存在且 `args.yes` → 自动 remove；存在且无 `--yes` → 按现在交互逻辑
  - `askInstallDeps`（`core/commands/index.ts`）：`args.install` 优先
  - `askGit` / `askGitInit` 类似
- [ ] 非交互成功路径下不调用 `@clack/prompts` 的 `intro/outro`，改为简洁日志（避免重定向不友好）
- [ ] `--help` / `-h` 输出：`console.log` 一份用法摘要，`process.exit(0)`
- [ ] `--version` / `-v`：读 `package.json.version`

### 用户文档

- [ ] `README.md` "使用方法" 段补非交互示例：
  ```bash
  create-yume --preset react-app --name my-app --yes --install
  ```

### 不做

- `create` 模式下逐项 flag 覆盖（工作量爆炸，ROI 低）；只在 `preset` 下支持
- 配置文件模式（`.yumerc.json`）—— 留给未来

## 模块 B · 失败回滚

### 当前风险

`planner.ts apply` 跑一半如果某个 render 失败，已写出的文件不会被清理，用户要么手删要么 `git clean`。

### 实现

- [ ] 在 `planner.ts` 内维护写入追踪：
  ```ts
  const written = yield * Ref.make<string[]>([])
  const createdDirs = yield * Ref.make<string[]>([])
  ```
  - `writeText` 成功后 `Ref.update(written, a => [path, ...a])`
  - `ensureDir` 创建新目录时追加到 `createdDirs`（用 `fs.exists` 先判）
- [ ] `apply` 的外层 `Effect.onError` / `Effect.catchAll` 里读取两个 Ref：
  - 逆序删除 written 里的文件（`fs.remove`）
  - 逆序删除 createdDirs 里的目录（仅当空）
  - 把原错误 rethrow（不要吞掉）
- [ ] 复用 `FileIOError`，回滚内部 `fs.remove` 失败时只记 log，不覆盖原错误
- [ ] 添加 `--no-rollback` flag（通过 `cli-args.ts`）便于 debug

### 注意

- 回滚只动 `baseDir` 下的路径，绝不往外写 / 删
- `copy` 任务若目标已存在会 skip（`planner.ts:122`），这种 skip 的不记入 written
- "已存在 → skip"和"本次 apply 创建"要区分，否则回滚会删用户原有文件

## 验证

- [ ] `pnpm build`
- [ ] 非交互：`node dist/index.js --preset react-app --name nia-react --yes --install` 一路走完
- [ ] 非交互失败：人为 break 一个模板让 render 报错，确认 `nia-react/` 目录在命令退出后被清空
- [ ] `--help` 和 `--version` 输出正确
- [ ] 交互模式（不带 flag）行为与 Phase 3 结束时完全一致

## 注意事项

- 非交互模式退出码：成功 0、用户取消 1、脚本错误 2，便于 CI 集成
- 回滚与并发 apply 的顺序：并发写入时 Ref 的 append 顺序不严格 = 写入完成顺序；但对"逆序删文件"来说够用
