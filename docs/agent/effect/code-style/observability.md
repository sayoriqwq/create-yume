# Effect Observability 基线

来源基线：

- 官方 Effect 关于 tracing 的指导

## 官方基线

- 在有意义的运行阶段外围创建 spans，而不是无差别散落 tracing。
- 保持阶段命名有意图且一致。
- 优先在边界层做 annotations，而不是在叶子调用里反复添加零散 metadata。
- 应把 tracing 与相关 metadata 视为运行时理解能力的一部分，而不是事后补上的噪音。

## 适用场景

当你在做下面这些判断时，使用这份基线：

- 新增一个运行阶段
- 选择一个 span 名称
- 判断哪些 metadata 应属于阶段边界
- 审查那些嘈杂或不一致的 observability 代码

## 偏离规则

如果当前代码加入 tracing 时没有清晰的阶段边界、命名不一致，或 metadata 散乱到妨碍运行时理解，应把它视为重构信号。
