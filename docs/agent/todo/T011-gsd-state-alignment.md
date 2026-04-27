# T011 GSD State Alignment

## 层级

协作维护。

## 状态

小型整理候选。

## 背景

当前 `.gsd` 记录显示所有 milestone 已完成，但状态摘要和 requirements 摘要之间可能出现过短暂不一致。未来如果继续用 GSD 管理执行计划，需要确保 state、requirements、decision register 和 docs todo 的入口一致。

## 目标

让 GSD 当前状态、requirements 覆盖摘要和文档 TODO 入口保持一致，避免未来执行者误判是否还有未映射工作。

## 非目标

- 不把 `docs/agent/todo` 直接当成 active milestone。
- 不重写历史 milestone。
- 不删除 append-only decision 记录。

## 建议方向

1. 明确 `docs/agent/todo` 是 backlog，不是 active milestone。
2. 如果某个 TODO 被选中执行，再生成 milestone / slice。
3. 检查 state summary 与 requirements coverage summary 是否一致。
4. 新增重大架构 TODO 时，视情况补充 decision register。

## 触发条件

- 准备从 TODO 升级为 GSD milestone。
- requirements 状态发生变化。
- decision register 新增架构决策。

## 验证重点

- state 中的 next action 与 requirements summary 不矛盾。
- todo roadmap 能从执行文档入口发现。
- active milestone 与 backlog 边界清楚。

