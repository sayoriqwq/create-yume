# Phase 0 — 准备 & 基线

← [Lead](./lead.md)

## 目的

后续所有阶段都声称"与当前产物字节相等"或"仅 diff 在 X"。没有基线就没法验证。

## Checklist

- [ ] 在仓库根 `pnpm install`（当前无 `node_modules`）
- [ ] `cd apps/cli && pnpm build`，确认 `apps/cli/dist/index.js` 产出
- [ ] `pnpm link --global` 或直接 `node apps/cli/dist/index.js`
- [ ] 手跑一次 `preset react-app`（名字统一：`baseline-react`）
- [ ] 手跑一次 `preset vue-app`（名字统一：`baseline-vue`）
- [ ] 把 `baseline-react/` 与 `baseline-vue/` 归档到仓库之外（或打 tar），作为后续 diff 对照
- [ ] `pnpm lint` 跑一次，记录当前告警数量到本文件"基线备注"段（允许存在但不修）
- [ ] 记录一次 `pnpm --filter create-yume list --depth=0`，保留依赖版本快照

## 涉及文件

只读；不改任何源文件。

## 验证

- `apps/cli/dist/index.js` 存在且 > 0 bytes
- `baseline-react/package.json` 与 `baseline-vue/package.json` 可打开，结构正常

## 基线备注（执行时填）

```
pnpm install 耗时：
pnpm build 耗时：
pnpm lint 告警数：
effect 实际安装版本：
@antfu/eslint-config 实际安装版本：
```

## 注意事项

- `pnpm link --global` 非必需；如果不 link，直接 `node dist/index.js` 也能跑
- baseline 产物一定要归档到 **仓库以外** 的目录，避免下一阶段 git 误清
