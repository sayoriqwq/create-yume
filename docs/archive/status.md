# Create Yume 现状文档

> **状态**：本文件是 2026-04-21 的**静态盘点快照**，部分结论（无测试、无 `node_modules`、effect 旧版本、锁定 antfu 等）已被后续基建推翻。
> 执行性内容已被 [docs/plan/lead.md](../plan/lead.md) 取代；新 agent 请从 lead 进入。
>
> 下文保留作为历史档案，用于理解"这轮改动从哪里开始"。

---

> 基于 2026-04-21 对 `main` 分支的一次静态盘点，用于指导下一轮清理与升级。

## 一、现状描述

### 1. 架构与流水线

入口 `apps/cli/src/index.ts:16` 用 `pipe` 串起：

```
showWelcome → collectQuestions → showConfigSummary → generateProject → finishProject
```

Layer 装配顺序（`index.ts:25`）为 Orchestrator → Plan → TemplateEngine → Command → Fs → Node\*，与 `overview.md` 一致。

分层职责清晰：

- **Orchestrator**（`core/services/orchestrator.ts:36`）：聚合 helpers/partials 注册 + 组装 DSL program。
- **Planner**（`core/services/planner.ts:39`）：将 DSL program 构建为 `Plan`，再分两批并发 apply（generate 类 → modify 类）。
- **TemplateEngine**（`core/services/template-engine.ts`）：Handlebars 运行时包装、partial 注册、编译缓存。
- **Fs / Command**：统一包装平台错误为领域错误（`FileIOError` / `CommandError`）。

### 2. DSL 与能力

`types/dsl.ts` 四类操作 `render / copy / json / text` 覆盖脚手架常见需求；`json` 通过 `immer` + reducer 链式组合，`modifier/package-json.ts:22` 的写法可读性较好。`utils/file-helper.ts` 提供 `when / setAt / mergeAt / scripts / deps / devDeps` 等 helper，接口统一。

### 3. 当前实际支持

- **已跑通**：Vue、React 两套前端模板（`template-registry/vue.ts`、`template-registry/react.ts` + `frontend-app.ts` 公共段）。
- **已声明未实装**：`NodeProjectConfig`（`types/config.ts:51`）。
- **交互模式**：仅 `preset` 与 `create` 两种 TTY 交互，无 CLI flag 非交互模式。

### 4. 类型严格度

`apps/cli/tsconfig.json` 几乎开满严格选项：`exactOptionalPropertyTypes`、`noUncheckedIndexedAccess`、`verbatimModuleSyntax`、`useUnknownInCatchVariables` 等。

### 5. 构建与发布

- 打包：`tsdown`，`format: 'esm'`、`minify: true`、`external: ['effect', '@clack/prompts', 'handlebars-helpers']`。
- 包结构：`dist` + `templates` 同级发布，Orchestrator 以 `__dirname` 反推模板根目录。

### 6. 测试与质量基线

- 无任何单元 / 集成测试。
- 仓库根提供 eslint（antfu config）、commitlint、husky、lint-staged、changesets，但依赖未安装（无 `node_modules`）。

---

## 二、已发现问题（Checklist）

### A. 清理性修复

- [ ] `types/config.ts:51` 的 `NodeProjectConfig` 未实装 — 从 union 摘掉，或补上 orchestrator / questions 分支。
- [ ] `core/services/template-engine.ts` 的 `registerTemplates` 是死 API — 仅 `compose.ts:16 buildTemplates` 被调用，删除 Service 上那份。
- [ ] `core/services/fs.ts` 每个方法末尾的 `.pipe(Effect.provideService(FileSystem.FileSystem, platformFs))` 是多余包装，`platformFs` 已经是解包实例，移除可降噪。
- [ ] `core/services/planner.ts:159` `task.finalize!(d)` 的 `!` 断言 — 用 `const fn = task.finalize; if (fn) fn(d)` 解决闭包窄化丢失。
- [ ] `core/services/template-engine.ts:43` 的模板编译缓存无实际收益（单次 CLI 进程内每个模板至多编译一次），删除 `Map` 并移除注释中的"似乎并没有意义"说明。
- [ ] `types/task.ts:22` 的 `readExisting: boolean | undefined` — 改成 `readExisting?: boolean`，去掉"bug?"注释。
- [ ] `apps/cli/tsconfig.json` path alias 冗余：`@/types/*`、`@/utils/*`、`@/core/*` 可被 `@/*` 覆盖；`~/*` 指向 `core/services/*` 语义 surprising，统一到 `@/*` 或文档化。

### B. 风格 / 正确性

- [ ] `core/services/compose.ts:61 executeAllCommandsInDir` 用 `process.chdir` 非并发安全；改用 `@effect/platform` 的 `Command.workingDirectory(cmd, dir)`。
- [ ] `collectPartialEntries`（`core/services/compose.ts:33`）把 `partialRoot` 自身作为 `global` 命名空间注册 — 靠 `readDirectory` 只读当层 `.hbs` 避开了子目录，行为正确但隐晦，加注释或显式过滤。

### C. 功能缺口

- [ ] 接入 `mri`（已在 `dependencies` 里但从未 import），实现非交互模式：`--preset react-app --name foo --yes`。
- [ ] 引入失败回滚：记录已写文件，apply 出错时清理。
- [ ] 增加 `planner.build` 的 snapshot 测试（DSL → Plan 是纯函数，ROI 最高）。
- [ ] 补 Handlebars 渲染快照测试（固定 config → 固定输出）。

### D. 依赖与版本刷新

- [ ] `modifier/package-json.ts` 内硬编码版本号是 2025 年夏季快照，整表刷新（tailwind、vite、vue、react、@vitejs/plugin-\*、@commitlint/\*、husky、lint-staged 等）。
- [ ] 根 `package.json` 锁定的 `@antfu/eslint-config@5.2.2`（commit `4b1107e` 标注"等 issue 解掉"）— 复查上游 issue 是否已 close，能升则升。
- [ ] `effect ^3.17.6` / `@effect/platform ^0.90.2` / `@effect/platform-node ^0.95.0` 复查是否与最新 3.x 兼容。

### E. 环境

- [ ] 仓库当前无 `node_modules`，`pnpm lint` 报 "eslint not found" — 首次使用需先 `pnpm install`；可在 README 的"快速开始"里显式强调。
