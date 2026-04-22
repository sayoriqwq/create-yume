# 当前阶段架构计划 - Pilot Router Owner

> 当前阶段只允许一个 pilot owner：`router`。

## 为什么选 `router`

- 它是当前最明确的 cross-cutting leakage 点之一。
- 它横跨 schema、questions、template registry 和 `package.json`。
- 它不依赖 post-generate command 这条更重的 bootstrap 线路，适合作为第一证明面。

## Pilot 范围

### 包含

- router 的输入语义
- router 的 family-specific 取值
- router 对模板产物的影响
- router 对 `package.json` 依赖的影响

### 不包含

- `stateManagement`
- `quality-bootstrap`
- monorepo / setup
- 新 scaffold family

## Router Owner 的责任

- 声明 router 的输入字段和 derived capability。
- 发出 router 相关的 contribution units。
- 明确 React / Vue 的差异被如何限制在 owner 边界内。

## 允许使用的 contribution units

- `Fragment Render`
- `JSON/Text Mutation`
- 如确有必要，可声明 `Partial Namespace`

## 当前阶段默认不使用的 units

- `Post-Generate Command`
- `Static Asset Copy`

## Success Signals

- router 相关逻辑不再同时散落在 questions、template registry、`package-json` modifier 中。
- pilot 不需要发明新的 contribution unit。
- React / Vue 的现有生成行为保持可解释。
- gate 完成后，pilot 对应改动能通过既定验证。

## Rollback Conditions

出现以下任一情况，pilot 应停止并回到计划层重新收敛：

- router owner 需要第二个 owner 同时迁移才能成立。
- router owner 需要新 contribution unit 才能工作。
- planner path guard 还未完成。
- `CommandService` 或 config semantic gate 尚未完成。

## 当前阶段的证明标准

- `router` 是唯一 pilot owner。
- pilot 完成后，才允许评估是否扩到 `stateManagement`。
