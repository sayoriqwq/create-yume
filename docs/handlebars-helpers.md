# create-yume 当前 Handlebars Helper 说明

> 当前仓库**没有**引入 `handlebars-helpers` 这个第三方包。模板里可用的自定义 helper 只来自 [`apps/cli/src/core/services/template-helpers.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/template-helpers.ts)，目前一共 3 个。

## 当前实现

模板引擎在 [`apps/cli/src/core/services/template-engine.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/template-engine.ts) 中创建独立的 Handlebars 实例，并在渲染前注册 helper。当前自定义 helper 如下：

| Helper | 作用 | 当前语义 |
| --- | --- | --- |
| `eq` | 严格相等判断 | `left === right` |
| `or` | 返回第一个 truthy 值 | 常用于 `#if` 条件或给 `withHash` 生成派生值 |
| `withHash` | 给当前块扩展一个临时作用域 | 会保留父级上下文，再把 `options.hash` 合并进去 |

## 使用约定

- 模板渲染时会把项目配置注入到 `@config`，所以分支判断通常写成 `{{#if (eq @config.xxx 'value')}}...{{/if}}`。
- `or` 不是单纯返回布尔值，而是返回第一个 truthy 操作数；如果都为 falsy，则返回最后一个值。
- `withHash` 适合把重复判断结果提升成局部变量，避免在同一个模板里反复写一长串条件。
- Handlebars 内置语法，例如 `if`、`unless`、`each`、partial 引用，不在这份文档里展开。

## 真实示例

### `eq`

```hbs
{{#if (eq @config.language 'typescript')}}
export type AppConfig = {}
{{else}}
export {}
{{/if}}
```

### `or`

```hbs
{{#if (or (eq @config.router 'react-router') (eq @config.router 'tanstack-router'))}}
router
{{else}}
app
{{/if}}
```

### `withHash`

```hbs
{{#withHash hasRouter=(or (eq @config.router 'react-router') (eq @config.router 'tanstack-router'))}}
  {{#if hasRouter}}
    // render router-specific fragment
  {{/if}}
{{/withHash}}
```

## 不再适用的口径

下面这些说法都不再符合当前仓库现状：

- “本项目精选使用了 `handlebars-helpers` 的一部分能力”
- “还推荐保留一些潜在可用 helper，未来再用”
- “当前模板里可以直接使用 `and`、`not`、`contains`、命名转换等 helper”

如果未来新增 helper，需要同时更新：

- [`apps/cli/src/core/services/template-helpers.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/template-helpers.ts)
- [`apps/cli/src/core/services/template-helpers.test.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/template-helpers.test.ts)
- 本文档
