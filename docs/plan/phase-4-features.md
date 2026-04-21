# Phase 4 — 功能扩展（非交互模式 + 失败回滚）

← [Lead](./lead.md) · 前置：[Phase 1](./phase-1-cleanup.md)、[Phase 2](./phase-2-style.md)、[Phase 3](./phase-3-deps.md)

## 目的

补上 `docs/overview.md §10` 列出的两个主要缺口：**非交互模式** 和 **失败回滚**。两者独立，可拆两个 PR。

> **与 Infra 的关系**：
> - 模块 A 的 CLI flag 解析输出必须走 [Infra 0](./infra-0-contracts.md) 的 Schema decode。
> - 模块 B 的写入轨迹 Ref 已由 [Infra 2](./infra-2-lifecycle-testing.md) A 铺好 scoped 基础，本阶段只加"记录 + 清理"语义。

## 模块 A · 非交互模式（mri 启用）

`mri` 已在 `apps/cli/package.json` dependencies 里（catalog 声明），但全项目无 import。本阶段激活它。

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

**统一切口（避免漏改）**：本阶段必须先建 **`CliContext` Service**，把"是否非交互、flag 覆盖值"作为整条主流程的唯一来源。`collectQuestions` 之外的入口（`showWelcome` / `finishProject` / `buildCommands`）同样消费它。

- [ ] 新建 `apps/cli/src/core/cli-args.ts`：
  ```ts
  import mri from 'mri'
  export interface RawCliArgs { /* mri 原始输出 */ }
  export function parseArgs(argv: string[]): RawCliArgs { /* mri + 手工 normalize */ }
  ```
- [ ] 解析结果经过 Infra 0 的 `CliArgs` Schema decode 一次；失败直接 `--help` + 非零退出码
- [ ] 新建 `apps/cli/src/core/cli-context.ts`：以 `Context.Tag` 暴露 `CliContext`：
  ```ts
  interface CliContext {
    readonly args: CliArgs         // decode 后结果
    readonly isInteractive: boolean // 由 preset && name 是否齐备推导
  }
  ```
  - `CliContextLive` 在 `index.ts` 层构造，注入主 Layer
- [ ] `apps/cli/src/index.ts`：
  - 顶部解析 + decode，构造 `CliContextLive`
  - **根据 `isInteractive` 分流**：`showWelcome` / `finishProject` 仅在交互模式下跑；非交互模式改走纯 `Effect.log` 简洁输出
- [ ] `apps/cli/src/core/compose.ts`（`showWelcome` / `finishProject`）：消费 `CliContext`，`isInteractive === false` 时不调 `@clack/prompts` 的 `intro / outro / note`
- [ ] `apps/cli/src/core/questions/compose.ts`：
  - `collectQuestions` 消费 `CliContext`
  - `askPreset`：`args.preset` 存在直接返回
  - `askProjectName`：`args.name` 存在且目录不存在直接返回；存在且 `args.yes` 自动 remove；存在且无 `--yes` 走原交互逻辑
- [ ] `apps/cli/src/core/commands/index.ts` 的 `buildCommands` / `askInstallDeps` / `askGitInit`：改为消费 `CliContext`；`args.install` / `args.git` 优先于交互；非交互模式下不触发 prompts
- [ ] `--help` / `-h`：`console.log` 用法摘要，`process.exit(0)`
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

`planner.apply` 跑一半如果某个 render 失败，已写出的文件不会被清理。

### 实现

- [ ] 复用 Infra 2 的 scoped Ref（`tests/support/` 里已有模板）：
  ```ts
  const written = yield* Ref.make<string[]>([])
  const createdDirs = yield* Ref.make<string[]>([])
  ```
  - `writeText` 成功后 `Ref.update(written, a => [path, ...a])`
  - `ensureDir` 创建新目录时追加到 `createdDirs`（用 `fs.exists` 先判）
- [ ] `apply` 的外层 `Effect.onError` / `Effect.catchAll`：
  - 逆序删除 `written` 里的文件（`fs.remove`）
  - 逆序删除 `createdDirs` 里的目录（仅当空）
  - 把原错误 rethrow（不要吞）
- [ ] 复用 `FileIOError`；回滚内部 `fs.remove` 失败时只记 log，不覆盖原错误
- [ ] 添加 `--no-rollback` flag（通过 `cli-args.ts`）便于 debug

### 注意

- 回滚只动 `baseDir` 下的路径，绝不往外写 / 删
- `copy` 任务若目标已存在会 skip，这种 skip 的不记入 `written`
- "已存在 → skip" 和 "本次 apply 创建" 要区分，否则回滚会删用户原有文件

## 验证

- [ ] `pnpm --filter create-yume build`
- [ ] 非交互：`node apps/cli/dist/index.js --preset react-app --name nia-react --yes --install` 一路走完，且整个过程 **没有任何** `@clack/prompts` 输出（`intro / outro / note / prompt` 都不触发）
- [ ] 非交互失败：人为 break 一个模板让 render 报错，确认 `nia-react/` 目录在命令退出后被清空
- [ ] `--help` 和 `--version` 输出正确
- [ ] 交互模式（不带 flag）行为与 Phase 3 结束时完全一致
- [ ] `rg '@clack/prompts' apps/cli/src` 的消费点全部绕过了 `CliContext.isInteractive === false`

## 注意事项

- 非交互模式退出码：成功 0、用户取消 1、脚本错误 2，便于 CI 集成
- 回滚与并发 apply 的顺序：并发写入时 Ref 的 append 顺序不严格 = 写入完成顺序；但对"逆序删文件"足够

Done at commit `f627870`.
