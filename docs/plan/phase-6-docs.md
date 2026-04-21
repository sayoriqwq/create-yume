# Phase 6 — 文档对齐

← [Lead](./lead.md) · 前置：Phase 1-5 全部完成

## 目的

让 `README.md` / `apps/docs/overview.md` / `apps/docs/status.md` 三方口径一致，与清理后的代码匹配。

## Checklist

### `README.md`

- [ ] "快速开始" 段显式强调先 `pnpm install`（Phase 0 的惨痛教训）
- [ ] "使用方法" 段补非交互示例（Phase 4-A）：
  ```bash
  create-yume --preset react-app --name my-app --yes --install
  ```
- [ ] 若 Phase 1 移除了 Node 项目类型，更新"主要特性"里"多项目类型支持"的描述
- [ ] 确认致谢段链接仍有效

### `apps/docs/overview.md`

- [ ] §8 目录结构图：
  - 若 Phase 2-B 新增 `templates/partials/global/` → 更新
  - 若 Phase 5 新增 `apps/cli/tests/` → 更新
- [ ] §10 "当前限制 / 改进方向"：
  - "不支持 CLI flags / 非交互模式" → 删除（Phase 4-A 完成）
  - "失败时缺乏清理策略" → 删除（Phase 4-B 完成）
  - "缺单元 / 集成测试" → 改成"已覆盖 planner build 与 template render"
  - "模板编译缓存未做失效策略" → 删除（Phase 1 已经移除缓存本身）
- [ ] §11 演进路线：把已完成项标注 ✅ 或移除，把未完成项按新优先级重排

### `apps/docs/status.md`

两种选择，任选其一记录在提交信息里：

- **选择 A · 保留作为历史档案**：在文件顶部加一段"本文件是 2026-04-21 盘点快照，已被 plan/ 系列跟进，见 [lead.md](./plan/lead.md)"，后续只作只读
- **选择 B · 改为 Changelog**：逐条勾掉已完成项，变成"本轮清理已做的事"对照表

### 本计划文档自身

- [ ] 把每个 phase sub-doc 结尾补"Done at commit `<sha>`"行
- [ ] `lead.md` 的阶段索引表最后加一列"状态"（done / in-progress / planned）

### `CLAUDE.md`（如存在）

- [ ] 未发现；若后续为项目添加，考虑把"preset 对应的固定配置"、"新增框架的步骤（overview §7）"写进去便于复用

## 验证

- [ ] 所有文档里的 file path / 行号若还准确一并更新；可用 `rg '\.ts:\d+' apps/docs/` 扫一遍
- [ ] 所有跨文档链接可用（相对路径对）
- [ ] 团队 / AI 从零读 lead.md → overview.md → status.md 能形成一致心智模型

## 注意事项

- 本阶段 **零代码改动**，纯文档
- 合并顺序：先 Phase 5 合入、snapshot 稳定 → 再本阶段，确保文档描述与代码一致
