# T005 Post-Generate File Tasks

## 层级

架构层。

## 状态

延后候选。只有在 dry run、计划预览、失败恢复或跨平台一致性成为真实需求时再推进。

## 背景

Husky hook 写入已经从 shell redirection 收敛为结构化 hook spec 和集中渲染命令，但它仍发生在 plan apply 之后。因此 hook 文件目前不共享 plan snapshot、rollback 与 text mutation 语义。

## 目标

把 post-generate 阶段中的文件写入类行为提升为 plan-visible task，让文件产物进入同一套 `PlanSpec`、rollback 和 ownership 机制。

## 非目标

- 不把所有 post-generate command 都 plan 化。
- 不替代真正需要外部工具执行的命令，例如依赖安装和 Git 初始化。
- 不为了抽象纯度提前改变当前稳定行为。

## 建议方向

1. 先区分 post-generate file task 与 external command。
2. hook 文件这类稳定文件写入应优先进入 text mutation 或 text render。
3. 外部命令继续保留 command phase，并保留 ownership trace。
4. 明确 command 失败是否触发额外恢复策略。

## 触发条件

- 需要 dry run 或计划预览展示 hook 文件。
- 需要失败后回滚 hook 文件。
- 需要降低跨平台命令差异。

## 验证重点

- hook 文件进入 `PlanSpec`。
- rollback 失败路径覆盖 hook 文件。
- post-generate command 测试仍证明依赖安装和 Git 初始化顺序稳定。

