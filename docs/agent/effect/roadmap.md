# Effect 参考路线图

这份路线图写给会在 create-yume 内部修改 Effect 相关实现的执行者或维护者。

如果你读完后只需要完成一件事，那就是：**先进入正确层级的 Effect 参考，再决定是否需要查官方最新资料。**

## 默认进入顺序

### 只想先定位主题

先看：

- `llms.txt`

它适合作为本地语料索引使用。

### 上下文很紧，只需要压缩参考

看：

- `llms-small.txt`

### 需要完整细节或更高把握

看：

- `llms-full.txt`

## 本地代码风格基线

如果你的问题不只是“API 怎么用”，还涉及“仓库里应怎么写”，继续看这些基线：

- `code-style/README.md`
- `code-style/entrypoints.md`
- `code-style/composition.md`
- `code-style/branching.md`
- `code-style/brands.md`
- `code-style/services.md`
- `code-style/config.md`
- `code-style/schema.md`
- `code-style/scope-and-cleanup.md`
- `code-style/testing.md`
- `code-style/observability.md`

## 什么时候再去查官方文档

只有在下面几种场景，再补查官方资料：

- 你怀疑本地语料已经过时
- 你需要确认最新 API 或最新表述
- 本地语料缺少目标主题
- 当前问题对版本新旧非常敏感

## 执行原则

1. 本地优先。
2. 缺失或对时效敏感时再查官方。
3. 当前代码若偏离本地基线，把它视为重构信号。
