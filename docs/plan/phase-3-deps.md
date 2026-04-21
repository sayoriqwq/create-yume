# Phase 3 — 模板版本刷新

← [Lead](./lead.md) · 前置：[Phase 1](./phase-1-cleanup.md)

## 目的

把 `apps/cli/src/core/modifier/package-json.ts` 里生成模板使用的 2025 年夏季版本快照推到当前。与 Phase 2 无代码依赖，可并行。

> **与当前状态的关系**：
> - 仓库根依赖已经走 pnpm catalog（`pnpm-workspace.yaml`），effect / `@antfu/eslint-config` / tsdown / vitest 都已是当前主版本 —— **这些不在本阶段改**。
> - 本阶段只改"生成产物里写进 `package.json` 的版本号"这一部分模板，**不触碰 catalog**。

## 模块 A · `modifier/package-json.ts` 整表刷新

> 建议按 section 分别 commit 便于 bisect。

### 通用

- [ ] `typescript`
- [ ] `@antfu/eslint-config` + `eslint`
- [ ] `husky`
- [ ] `lint-staged`
- [ ] `@commitlint/cli`、`@commitlint/config-conventional`

### 前端通用

- [ ] `vite`
- [ ] `sass`
- [ ] `less`
- [ ] `tailwindcss` + `@tailwindcss/vite`

### Vue

- [ ] `@vue/tsconfig`
- [ ] `@vitejs/plugin-vue` + `@vue/compiler-sfc`
- [ ] `vue`
- [ ] `vue-router`
- [ ] `pinia`

### React

- [ ] `react` + `react-dom`
- [ ] `@vitejs/plugin-react`
- [ ] `@eslint-react/eslint-plugin` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- [ ] `react-router` + `react-router-dom`
- [ ] `@tanstack/react-router`
- [ ] `@types/react` + `@types/react-dom`
- [ ] `zustand`
- [ ] `jotai`

## 刷新策略

- [ ] 在临时目录跑 `pnpm dlx npm-check-updates -u -t minor` 取 latest，再手抄到 `package-json.ts`；或逐个 `pnpm view <pkg> version`
- [ ] 检查主版本跨越是否需要模板代码跟进（React 若有 breaking API，`fragments/react/*.hbs` 要同步；tailwind v4 / vite v7 若有 breaking，`fragments/common/vite.config.ts.hbs` 要同步）
- [ ] 所有硬编码版本字符串统一用 `^x.y.z`

## 验证

- [ ] `pnpm --filter create-yume build`
- [ ] 生成 `phase3-react`、`phase3-vue`
- [ ] 进入生成目录：`pnpm install && pnpm build && pnpm lint`
- [ ] 对比 `baseline-react/package.json` 与 `phase3-react/package.json`：**只应 `dependencies` / `devDependencies` 版本号变化**，脚本和顶层结构无变化
- [ ] 跑一次 `phase3-react/`（vite dev）验证 tailwind + vite plugin 仍能启动

## 注意事项

- 本阶段 **不**动仓库根 catalog / 不动 `pnpm-workspace.yaml`
- 任何跨主版本升级单独 commit，便于回滚
- 若 Infra 1 已经把"模板版本"抽成 `AppConfig.templateVersions`，本阶段改成更新该数据源
