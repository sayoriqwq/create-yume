# Effect Testing 基线

来源基线：

- 官方 Effect 关于测试的指导，尤其是 `TestClock`
- 官方 Effect 关于通过 Effect 原生 seams 测试，而不是依赖环境 mutation 的风格指导

## 官方基线

- 优先使用 Effect 原生测试 seams，而不是全局 mutation。
- 对时间敏感行为，优先使用 `TestClock` 这类确定性时间控制，而不是依赖真实睡眠。
- 在 contract 被解码或提供的边界处测试它们。
- 优先使用显式 mock 或显式提供的依赖，而不是隐藏的环境行为。

## 适用场景

当你在做下面这些判断时，使用这份基线：

- 测试时间敏感的 Effects
- 测试受配置驱动的行为
- 测试依赖 service 的逻辑
- 审查那些依赖真实时间或环境全局状态而导致缓慢、脆弱的测试

## 偏离规则

如果当前测试依赖真实 sleep、环境级 process mutation，或隐藏的依赖耦合，而 Effect 原生测试 seams 本可以让它们变得确定，应把它视为重构信号。
