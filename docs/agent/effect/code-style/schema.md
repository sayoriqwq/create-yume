# Effect Schema 基线

来源基线：

- 官方 Effect 关于 Schema 的指导

## 官方基线

- 外部输入与跨层数据应在边界处完成解码，再进入业务逻辑。
- 优先使用显式的基于 Schema 的解码，而不是静默 coercion。
- 将 parse failures 转成具类型且可读的失败。
- Schemas 应聚焦于可序列化的数据 contract。
- 当边界重要时，应使用能提升诊断清晰度的 schema annotations 与结构。

## 适用场景

当你在做下面这些判断时，使用这份基线：

- 接收 CLI、JSON、磁盘或跨层输入
- 定义或扩展某个 contract
- 审查验证是否发生得太晚
- 判断某个值是否不应在系统更深处继续保持未验证状态

## 偏离规则

如果当前代码允许未经验证的外部数据流入业务逻辑，或在应有 contract boundary 的地方依赖静默 coercion，应把它视为重构信号。
