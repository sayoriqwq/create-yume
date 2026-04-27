# Effect 分支与穷尽性基线

来源基线：

- 官方 Effect 关于 pattern matching 的指导
- 官方 Effect 关于控制流的指导

## 官方基线

- 对封闭 union 和已知 case 集合，优先使用穷尽式分支。
- 当 pattern matching 能提升清晰度或安全性时，使用 `Match.exhaustive`。
- 当写法更简单且仍能保留穷尽性时，带显式 `never` 检查的 `switch` 也是可接受的。
- 当编译器可以强制完整性时，不要依赖 runtime defect 或所谓“不可能发生”的默认分支。
- 简单的局部分支使用普通 `if` / `switch` 即可；当分支更具结构性，或 `Match` 明显提升可读性时，再使用 `Match`。

## 适用场景

当你在做下面这些判断时，使用这份基线：

- 对 literal union 做分支
- 对 `_tag` 做分支
- 扩展一个封闭的 mode 集合
- 审查某个分支是否应该具备编译期穷尽性

## 偏离规则

如果当前代码在处理封闭 case 集合时依赖 runtime fallback 分支，而不是编译期穷尽性，应把它视为重构信号。
