# Effect Scope 与 Cleanup 基线

来源基线：

- 官方 Effect 关于 resource management、scopes 与 finalization 的指导

## 官方基线

- 当资源或 rollback 行为需要确定性的 cleanup 时，使用 scoped 生命周期控制。
- cleanup 逻辑应附着在资源边界上，而不是散落到各个调用者中。
- 当 cleanup 依赖操作结果时，使用 finalizers。
- 保留原始失败，不要让 cleanup 失败把它遮蔽掉。
- 优先使用显式生命周期建模，而不是临时的可变 cleanup 状态。

## 适用场景

当你在做下面这些判断时，使用这份基线：

- 获取后必须释放的资源
- 写文件或创建路径，且失败时可能需要 rollback
- 审查失败后的 cleanup 路径
- 判断某个可变全局状态是否在掩盖生命周期问题

## 偏离规则

如果当前代码通过临时 mutation、远端调用者或会遮蔽原始失败的 cleanup 行为来管理资源清理，应把它视为重构信号。
