# Phase 0 — 准备 & 基线

← [Lead](./lead.md) · 前置：Infra Tier 全部完成

## 目的

Code Tier 后续阶段都声称"与当前产物字节相等"或"仅 diff 在 X"。没有基线就没法验证。

## Checklist

- [x] 在仓库根 `pnpm install`（verifyDepsBeforeRun=error，manifest 与 lockfile 必须同步）
- [x] `pnpm build:cli`（= `pnpm --filter create-yume build`），确认 `apps/cli/dist/index.js` 产物存在
- [x] 直接 `node apps/cli/dist/index.js` 冒烟
- [x] 手跑一次 `preset react-app`（项目名固定：`baseline-react`）
- [x] 手跑一次 `preset vue-app`（项目名固定：`baseline-vue`）
- [x] 把 `baseline-react/` 与 `baseline-vue/` 归档到 **仓库以外** 的目录，作为后续 diff 对照
- [x] `pnpm lint` 跑一次，记录当前告警数量到本文件"基线备注"段
- [x] 记录一次 `pnpm --filter create-yume list --depth=0`，保留实际解析版本快照（catalog 是声明来源，锁定产物才是基线事实）

## 涉及文件

原计划只读；执行 smoke 时发现 `@effect/opentelemetry/NodeSdk` 需要已安装的
`@opentelemetry/sdk-trace-node` peer，已补齐 CLI manifest/catalog/lockfile 后继续基线。

## 验证

- `apps/cli/dist/` 入口文件存在且 > 0 bytes
- `baseline-react/package.json` 与 `baseline-vue/package.json` 可打开，结构正常

## 基线备注（执行时填）

```
执行日期：2026-04-22
baseline 归档目录：/Users/sayori/Desktop/create-yume-phase0-baseline-20260422
pnpm install 耗时：初始 install 通过；补齐 OTel peer 后 lockfile refresh 约 4s
pnpm build 耗时：tsdown reported 16ms；命令总耗时约 0.4s
pnpm lint 告警数：0
effect 实际解析版本：3.21.1
@antfu/eslint-config 实际解析版本：8.2.0（repo root）；baseline 产物模板解析为 5.2.2
CLI 实际入口文件名（dist/index.js 或 .mjs）：dist/index.js
CLI 入口大小：27324 bytes
baseline-react/package.json：1259 bytes
baseline-vue/package.json：1051 bytes
```

## 注意事项

- baseline 产物一定要归档到 **仓库以外** 的目录，避免下一阶段 git 误清
- 若 Infra 3 的入口选型还未落地，记录实际为 `dist/index.mjs`；不要在本阶段改源
- `pnpm link`（内建）与 `pnpm run link`（脚本）是两回事；基线步骤始终用后者或显式 `link:global`
