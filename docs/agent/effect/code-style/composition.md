# Effect 组合基线

来源基线：

- 官方 Effect 关于 generators 的指导
- 官方 Effect 关于 pipelines 的指导
- 官方 Effect 关于 dual APIs 的指导
- 官方 Effect 关于避免因 tacit 风格损伤可读性的代码风格指导

## 官方基线

- 顺序化的 effectful 逻辑，尤其是涉及局部变量、分支或结构化控制流时，优先使用 `Effect.gen`。
- 可读的变换流水线优先使用 `pipe(...)` 配合 data-last operators。
- 当只有一个操作且 `pipe` 只会增加噪音时，data-first 风格是可以接受的。
- 不要在 tacit / point-free 风格会降低控制流可读性时继续使用它。
- 选择最能让数据流和 effects 流向清楚可读的风格。

## 适用场景

当你在做下面这些判断时，使用这份基线：

- 在 `Effect.gen` 和 pipeline 之间做选择
- 在 dual API 的 data-first 与 data-last 形式之间做选择
- 重构嵌套的 effectful 逻辑
- 审查那些为了简洁而牺牲可读性的代码

## 偏离规则

如果当前代码因为过度 tacit、过度嵌套，或选择了更难读的 API 形式而变得难以理解，应把它视为重构信号。
