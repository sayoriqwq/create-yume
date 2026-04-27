# T002 Same-Path Mutation Merge

## 层级

架构层。

## 状态

未来架构特性。应在 T001 之后或同时设计。

## 背景

当前 duplicate target-path conflict 对 fragment render 和 static asset copy 是正确保护；但对 JSON / text mutation 来说，它会迫使多个 owner 回到中心聚合函数。热点文件要扩展，必须允许多个 mutation contribution 指向同一个结构化目标。

## 目标

支持同 path 的 JSON / text mutation 在 plan build 阶段合并成一个可执行 task，同时保留 render/copy 的 duplicate path 冲突保护。

## 非目标

- 不允许多个 render/copy 覆盖同一目标。
- 不改变 rollback 语义。
- 不让同 path merge 变成隐式覆盖。

## 建议方向

1. 在 plan build 或 mutation boundary 区分 file-producing task 与 mutating task。
2. 对 JSON / text mutation 按 target path 聚合。
3. 保持 contribution 顺序可解释，必要时显式定义排序策略。
4. 对 render/copy 继续使用 duplicate target-path hard conflict。

## 触发条件

- owner contribution 模型落地。
- `package.json` 或其他热点文件需要多个 owner 独立注册 mutation。

## 验证重点

- 同 path JSON mutation 被合并而不是冲突。
- render/copy 同 path 仍然失败。
- `PlanSpec` 可以展示合并后的 reducer 列表和 ownership trace。
- rollback 测试保持通过。

