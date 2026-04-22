# Phase 6 — 文档对齐

← [Lead](../../plan/lead.md) · 前置：Phase 1-5 全部完成

## 目的

让 `README.md` / `docs/overview.md` / `docs/archive/status.md` 三方口径一致，与清理后的代码匹配。

> **注意**：docs 已在基建阶段迁到仓库根 `docs/`（不再是 `apps/docs/`）。本阶段所有路径都以 `docs/` 为准。

## Checklist

### `README.md`

- [x] "快速开始" 段显式强调先 `pnpm install`（verifyDepsBeforeRun=error 会挡）
- [x] "使用方法" 段补非交互示例（Phase 4-A）：
  ```bash
  create-yume --preset react-app --name my-app --yes --install
  ```
- [x] 若 Phase 1 移除了 Node 项目类型，更新"主要特性"里"多项目类型支持"的描述
- [x] 确认致谢段链接仍有效
- [x] `bin` / 运行示例的产物文件名与 Infra 3 选型对齐（`.js` 或 `.mjs`）

### `docs/overview.md`

- [x] §8 目录结构图：
  - 若 Phase 2-B 新增 `templates/partials/global/` → 更新
  - 若 Phase 5 新增 `apps/cli/tests/` → 更新
- [x] §10 限制表：把 Phase 4-A / 4-B / Phase 5 已完成项删除或改为 ✅；剩余项与 Infra / Code Tier 对齐
- [x] §11 演进路线：把已完成项标注 ✅ 或移除，把未完成项按新优先级重排

### `docs/archive/status.md`

- 当前已加 snapshot banner。本阶段 **不修改 status.md 正文**（它是历史档案）。
- [x] 仅确认 banner 指向 `plan/lead.md` 仍然有效。

### `docs/archive/agent-foundation-assessment.md`

- [x] 确认状态头指向 `plan/infra-3-agent-contract.md` 仍然有效
- [x] 若 Infra 3 的 `AGENTS.md` 已落地，把 §5.1 A 标 ✅

### 本计划文档自身

- [x] 把每个 phase sub-doc 结尾补 "Done at commit `<sha>`" 行
- [x] `lead.md` 的阶段索引表最后加一列"状态"（done / in-progress / planned）

### `AGENTS.md`（Infra 3 的产物）

- [x] 若 Infra 3 已落地，确认 `AGENTS.md` 里"支持的项目类型"与 Phase 1 删除 Node 后的状态一致

## 验证

- [x] 所有文档里的 file path / 行号若还准确一并更新；可用 `rg '\.ts:\d+' docs/` 扫一遍
- [x] 所有跨文档链接可用（相对路径对）
- [x] 从零读 `lead.md → infra-*.md → phase-*.md → overview.md` 能形成一致心智模型
- [x] 人工 review 通过（当前仓库没有 `pnpm verify:docs`）

## 注意事项

- 本阶段 **零代码改动**，纯文档
- 合并顺序：先 Phase 5 合入、snapshot 稳定 → 再本阶段，确保文档描述与代码一致

Done at commit `12eec7b`.
