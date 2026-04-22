# 当前阶段架构计划 - Verification Rollout

> 本文把文档阶段和后续代码阶段串起来，避免“计划通过了，但执行时没有 stop/go 规则”。

## Phase A：Docs Baseline

### 交付物

- 新 `docs/plan/lead.md`
- 6 个 sub-doc
- 历史 lead 归档

### 最低验证

- 人工校对
- 文件集与 lead 索引一致
- archive / replace 是同一变更完成

### Stop / Go

- 只有文档结构完整且无历史/未来混写，才进入代码阶段

## Phase B：Foundation Gates In Code

### 交付物

- Gate 1 完成
- Gate 2 完成
- Gate 3 完成

### 最低验证

- 触及 planner / registry：`pnpm --filter create-yume test`
- 触及 template engine / helper / partial 注册：`pnpm --filter create-yume test`
- 触及 `package-json` / bootstrap：`pnpm --filter create-yume build`，外加生成产物检查
- 混合 runtime / template / config：`pnpm verify`

### Stop / Go

- 任一 gate 未完成，不得开始 `router` pilot

## Phase C：Ownership Scaffolding

### 交付物

- ownership hierarchy 在代码中有可落脚的入口
- contribution units 在代码里有明确映射

### 最低验证

- 根据触及范围套用验证矩阵
- 跨多条线时直接 `pnpm verify`

### Stop / Go

- 如果为了搭脚手架而引入新的隐式 unit，停止并回到计划层

## Phase D：Router Pilot

### 交付物

- 只有 `router` 一个 pilot owner
- router 的输入、贡献、边界和验证都可追溯

### 最低验证

- `pnpm verify`
- 生成产物检查，确认 router 相关文件和依赖变化符合预期

### Stop / Go

- pilot 成功前，不启动第二个 capability owner

## Phase E：Expand / Hold Review

### 只有在以下条件全部满足时，才允许扩展到第二个 owner

- 三个 foundation gates 已在 docs 和 code 两侧完成
- `router` pilot 成功
- 没有新增 ad hoc contribution unit
- 验证结果可解释
- 计划文档无需重写层级结构

## 验证映射

本计划后续所有代码阶段都必须服从现有验证矩阵：

- planner / registry 变化：`pnpm --filter create-yume test`
- template engine / helper / partial 变化：`pnpm --filter create-yume test`
- `package-json` 变化：`pnpm --filter create-yume build` + 产物检查
- 混合 runtime / template / config 变化：`pnpm verify`
