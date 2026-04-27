# Effect Service 基线

来源基线：

- 官方 Effect 关于管理 services 的指导

## 官方基线

- 当某个能力代表可复用依赖，且具有明确的实现边界时，应把它建模为 service。
- 优先使用把依赖留在 service 边界内部的构造模式，不要通过 public API 把底层依赖泄漏出去。
- 对于动态的 context-like 值，应使用 contextual tags，而不是把它伪装成稳定的应用 service。
- service 接口应明确且足够小，能够清楚表达能力边界。

## 适用场景

当你在做下面这些判断时，使用这份基线：

- 判断某个东西是否应该建模为 service
- 判断某个东西其实是 contextual input，而不是 service
- 审查 public API 是否泄漏了底层基础设施细节

## 偏离规则

如果当前代码通过本应隐藏底层细节的 service 边界暴露了基础设施依赖，或把动态 context 当成稳定 service 建模，应把它视为重构信号。
