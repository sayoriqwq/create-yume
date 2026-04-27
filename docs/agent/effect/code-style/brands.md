# Effect Brand 基线

来源基线：

- 官方 Effect 关于 branded types 的指导

## 官方基线

- 当多个值共享相同 primitive 表示，但语义上不应互换时，使用 branded types。
- 在领域含义重要、且混用会造成真实错误的边界处引入 brands。
- 在边界处解码或构造 branded 值，不要把未经检查的 casts 散落在业务逻辑中。
- 一旦某个概念已经被 brand 化，应优先跨越边界保留这个 brand，而不是退回原始 primitive。

## 适用场景

当你在做下面这些判断时，使用这份基线：

- 一个 string、number 或 path 值承载了独立的领域意义
- 两个 primitive 形状相同的值不应混用
- 审查某个未经检查的 cast 是否在掩盖缺失的边界类型

## 偏离规则

如果当前代码继续依赖原始 primitive，而 branded boundaries 本可以阻止真实的类别错误，应把它视为重构信号。
