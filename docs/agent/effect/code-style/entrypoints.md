# Effect 入口与运行时基线

来源基线：

- 官方 Effect 关于 `runMain` 的代码风格指导
- 官方 Effect 关于运行 Effect 的指导

## 官方基线

- `runMain` 是在 Node.js 中运行 Effect 应用的主要入口。
- 运行时执行应停留在应用最外层边界。
- 大多数内部模块应返回 `Effect` 值，而不是提前执行它们。
- `runSync` 只应用于明确且可证明是同步的工作。
- 如果执行边界可能是异步的，应优先使用异步 runner，而不是强行使用同步 runner。

## 适用场景

当你在做下面这些判断时，使用这份基线：

- 定义主应用入口
- 判断 Effects 应该在哪里真正执行
- 审查是否有 helper 过早执行 Effect
- 在 `runMain`、`runPromise` 与 `runSync` 之间做选择

## 偏离规则

如果当前代码把 Effects 执行放在外层边界之外，或把并不明确同步的工作放进 sync runner，应把它视为重构信号。
