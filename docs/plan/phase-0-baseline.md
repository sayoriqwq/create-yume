# Phase 0 — 准备 & 基线

← [Lead](./lead.md) · 前置：Infra Tier 全部完成

## 目的

Code Tier 后续阶段都声称"与当前产物字节相等"或"仅 diff 在 X"。没有基线就没法验证。

## Checklist

- [ ] 在仓库根 `pnpm install`（verifyDepsBeforeRun=error，manifest 与 lockfile 必须同步）
- [ ] `pnpm build:cli`（= `pnpm --filter create-yume build`），确认 `apps/cli/dist/index.mjs` 产物存在（当前 tsdown 产物为 `.mjs`；若 Infra 3 B 已切 `.js`，则改为 `.js`）
- [ ] 直接 `node apps/cli/dist/index.mjs` 冒烟；或 `pnpm --filter create-yume link:global` 后在任意目录 `create-yume`（**不要** 用裸 `pnpm link`，根脚本 `link` 是 `pnpm --filter create-yume link --global` 的别名，`pnpm link` 是 pnpm 内建命令，语义不同）
- [ ] 手跑一次 `preset react-app`（项目名固定：`baseline-react`）
- [ ] 手跑一次 `preset vue-app`（项目名固定：`baseline-vue`）
- [ ] 把 `baseline-react/` 与 `baseline-vue/` 归档到 **仓库以外** 的目录，作为后续 diff 对照
- [ ] `pnpm lint` 跑一次，记录当前告警数量到本文件"基线备注"段
- [ ] 记录一次 `pnpm --filter create-yume list --depth=0`，保留实际解析版本快照（catalog 是声明来源，锁定产物才是基线事实）

## 涉及文件

只读；不改任何源文件。

## 验证

- `apps/cli/dist/` 入口文件存在且 > 0 bytes
- `baseline-react/package.json` 与 `baseline-vue/package.json` 可打开，结构正常

## 基线备注（执行时填）

```
pnpm install 耗时：
pnpm build 耗时：
pnpm lint 告警数：
effect 实际解析版本：
@antfu/eslint-config 实际解析版本：
CLI 实际入口文件名（dist/index.js 或 .mjs）：
```

## 注意事项

- baseline 产物一定要归档到 **仓库以外** 的目录，避免下一阶段 git 误清
- 若 Infra 3 的入口选型还未落地，记录实际为 `dist/index.mjs`；不要在本阶段改源
- `pnpm link`（内建）与 `pnpm run link`（脚本）是两回事；基线步骤始终用后者或显式 `link:global`
