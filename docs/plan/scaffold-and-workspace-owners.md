# 当前阶段架构计划 - Scaffold And Workspace Owners

> 本文定义 capability owner 之上的两层 owner。未来 `node`、monorepo、setup 都先落在这里，而不是直接压到 capability 层。

## 为什么先定义这两层

如果没有这两层，后续 `node` / monorepo / setup 只能继续以“额外分支”形式散落进 questions、registry、modifier 和 commands。

## Scaffold-Family Owner

### 负责什么

- 定义 family 的语义边界。
- 定义该 family 允许哪些 capability。
- 提供 family 默认值和基础贡献。

### 当前实例

- `react`
- `vue`

### 未来实例

- `node`
- CLI app family

### 不负责什么

- git / install / workspace layout
- 通用 bootstrap policy

## Workspace/Bootstrap Owner

### 负责什么

- 项目布局与初始化策略。
- `git`
- install policy
- quality-bootstrap
- 未来的 single-package / monorepo / setup-only 模式

### 为什么 `quality-bootstrap` 在这一层

当前 code quality 不是纯 capability。它跨越：

- 问答条件
- shared templates
- `package.json`
- post-generate commands

所以它应该和 workspace/bootstrap 一起建模，而不是伪装成一个独立功能能力。

## 这两层如何消费 contribution units

### Scaffold-Family Owner 可发出的 units

- `Fragment Render`
- `Partial Namespace`
- `JSON/Text Mutation`
- `Static Asset Copy`

### Workspace/Bootstrap Owner 可发出的 units

- `JSON/Text Mutation`
- `Static Asset Copy`
- `Post-Generate Command`

## 与 Capability Owner 的关系

- Capability Owner 只能在 family + workspace 给出的边界内工作。
- Capability Owner 不得自己定义 workspace policy。
- Scaffold-Family / Workspace owner 不应把局部 feature 语义继续向下泄漏。

## 当前阶段执行约束

- 先把这两层 owner contract 写稳，再定义 `router` pilot owner。
- 在 `router` pilot 成功前，不展开第二个 capability owner。
