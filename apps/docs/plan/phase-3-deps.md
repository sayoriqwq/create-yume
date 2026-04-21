# Phase 3 — 依赖刷新

← [Lead](./lead.md) · 前置：[Phase 1](./phase-1-cleanup.md)

## 目的

把 2025 年夏季的版本快照推到当前。与 Phase 2 无代码依赖，可并行推进或先做。

## 模块 A · 仓库根 `package.json`

### `@antfu/eslint-config`

- [ ] 当前锁死 `5.2.2`（commit `4b1107e` 标注"等 issue 解掉"）
- [ ] 查上游 https://github.com/antfu/eslint-config 的 issue tracker，确认当初的阻塞是否 close
- [ ] 能升：恢复 `"^5.2.2"` 或升到最新 5.x
- [ ] 不能升：本文件记录 issue 链接和阻塞原因，保留锁定

### Effect 家族

- [ ] `apps/cli/package.json`：
  - `effect ^3.17.6`
  - `@effect/platform ^0.90.2`
  - `@effect/platform-node ^0.95.0`
- [ ] 升到当前 3.x latest 后，快速扫一遍以下 API 是否有破坏性变更：
  - `Context.Tag`（`fs.ts`、`planner.ts`、`orchestrator.ts`、`template-engine.ts`、`command.ts` 都用到）
  - `Layer.effect`、`Effect.gen`、`Effect.forEach`、`Effect.try`
  - `Data.TaggedError`（`types/error.ts`）
  - `Command.make`、`Command.string`、`Command.workingDirectory`（Phase 2 新引入）
- [ ] 运行 `pnpm build` 确认无 TS 报错

## 模块 B · 模板生成版本（`src/core/modifier/package-json.ts`）

整表刷新。建议按 section 分别 commit 便于 bisect。

### 通用

- [ ] `typescript`（第 26 行 `^5.9.2`）
- [ ] `@antfu/eslint-config`（第 27 行 `5.2.2` + `eslint ^9.34.0`）—— 与模块 A 决定同步
- [ ] `husky ^9.1.7`（第 29 行）
- [ ] `lint-staged ^16.1.6`（第 30 行）
- [ ] `@commitlint/cli ^19.8.1`、`@commitlint/config-conventional ^19.8.1`（第 31 行）

### 前端通用

- [ ] `vite ^7.1.3`（第 35 行）
- [ ] `sass ^1.91.0`（第 38 行）
- [ ] `less ^4.4.1`（第 39 行）
- [ ] `tailwindcss ^4.1.12` + `@tailwindcss/vite ^4.1.12`（第 41 行）

### Vue

- [ ] `@vue/tsconfig ^0.8.1`（第 45 行）
- [ ] `@vitejs/plugin-vue ^6.0.1` + `@vue/compiler-sfc ^3.5.20`（第 46 行）
- [ ] `vue ^3.5.20`（第 47 行）
- [ ] `vue-router ^4.5.1`（第 48 行）
- [ ] `pinia ^3.0.3`（第 49 行）

### React

- [ ] `react ^19.1.1` + `react-dom ^19.1.1`（第 53 行）
- [ ] `@vitejs/plugin-react ^5.0.2`（第 54 行）
- [ ] `@eslint-react/eslint-plugin ^1.53.0` + `eslint-plugin-react-hooks ^5.2.0` + `eslint-plugin-react-refresh ^0.4.20`（第 55 行）
- [ ] `react-router ^7.8.2` + `react-router-dom ^7.8.2`（第 56 行）
- [ ] `@tanstack/react-router ^1.131.35`（第 57 行）
- [ ] `@types/react ^19.1.12` + `@types/react-dom ^19.1.9`（第 58 行）
- [ ] `zustand ^5.0.8`（第 59 行）
- [ ] `jotai ^2.13.1`（第 60 行）

### 刷新策略

- [ ] 跑 `pnpm dlx npm-check-updates -u -t minor` 在一个临时项目里取 latest，再手抄到 `package-json.ts`
  - 或逐个 `pnpm view <pkg> version`
- [ ] React 19 → 20？Vue 3.5 → 3.6？确认主版本跨越是否需要对应调整模板代码（例如 React 若有 breaking API，`fragments/react/*.hbs` 也要跟进）
- [ ] 所有硬编码版本字符串统一用 `^x.y.z`

## 验证

- [ ] `pnpm build`（CLI 自身）
- [ ] 生成 `phase3-react`、`phase3-vue`
- [ ] 进入生成目录：`pnpm install && pnpm build && pnpm lint`
- [ ] 对比 `baseline-react/package.json` 与 `phase3-react/package.json`：**只应 `dependencies` / `devDependencies` 版本号变化**，脚本和顶层结构无变化
- [ ] 跑一次 `phase3-react/`（vite dev）验证 tailwind v4 + vite plugin 仍能启动

## 注意事项

- 如果 tailwind v4 或 vite v7 有 breaking change 影响 `fragments/common/vite.config.ts.hbs` 的写法，本阶段要一并修正模板，不要留给 Phase 6
- 任何版本跨主版本升级建议单独 commit，便于回滚
- React 19 → 20 跨越若涉及 `main.tsx.hbs` 里 `createRoot` / `StrictMode` 用法变更，模板也要改
