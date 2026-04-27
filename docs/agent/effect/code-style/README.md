# Effect 代码风格基线

这个目录记录了当前仓库采用的 **官方 Effect 代码风格基线**。

## 解释规则

- 官方 Effect 文档是唯一基线。
- 这些文件是给执行者使用的本地提炼版指南，但不能削弱、替代或覆盖官方指导。
- 如果当前代码与这里的指导不一致，应把它视为**重构信号**，而不是反过来修改指导去迎合现状。

## 如何使用这个目录

- 用 `entrypoints.md` 判断运行时执行边界。
- 用 `composition.md` 判断 `Effect.gen`、`pipe` 与 dual API 风格选择。
- 用 `branching.md` 判断穷尽式分支与 `Match` 的使用方式。
- 用 `brands.md` 判断 branded type 的使用边界。
- 用 `services.md` 判断 service 建模方式。
- 用 `config.md` 判断运行时配置边界。
- 用 `schema.md` 判断 contract 解码与 Schema 使用方式。
- 用 `scope-and-cleanup.md` 判断生命周期与 cleanup 边界。
- 用 `testing.md` 判断 Effect 原生测试风格。
- 用 `observability.md` 判断 spans、tracing 与阶段级诊断。

## 来源立场

这些文件必须跟随官方文档，而不是跟随仓库里历史遗留的实现习惯。
