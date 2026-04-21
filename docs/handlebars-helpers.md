# create-yume 模板可用 & 推荐 Handlebars Helpers 速查

> 精选自 `handlebars-helpers` 包（及 Handlebars 内置），只列出在本项目脚手架场景“真正可能用到 / 已使用”的子集，并给出在 React 模板重构中的应用示例。避免 180+ helper 的噪音。

## 1. 比较与逻辑类（核心）
| Helper | 作用 | 典型用法 |
| ------ | ---- | -------- |
| `eq` | 严格相等 | `{{#if (eq config.router 'react-router')}}...{{/if}}` |
| `or` | 多条件或 | `{{or condA condB}}` -> 只要有一个 truthy 返回第一个 truthy 值（用于布尔） |
| `and` | 多条件且 | `{{and condA condB}}` |
| `not` | 取反（falsey 判断） | `{{#if (not config.stateManagement)}}/* no state mgmt */{{/if}}` |
| `contains` | 集合 / 字符串包含 | `{{#if (contains list 'react')}}` |
| `compare` | 自定义操作符 | `{{#compare count ">" 0}}...{{/compare}}`（必要时再用） |
| `unlessEq` | `a !== b` 快捷（块反向） | `{{#unlessEq config.language 'typescript'}}...{{/unlessEq}}` |

> 说明：`is` / `isnt` 是宽松相等，不建议在生成代码的确定性判断里使用；优先 `eq`。

## 2. 上下文与结构辅助
| Helper | 作用 | 示例 |
| ------ | ---- | ---- |
| `withHash` | 构造一个临时上下文（本次重构重点） | `{{#withHash hasRouter=(or (eq a 'x') (eq a 'y'))}} ... {{/withHash}}` |
| `isEmpty` | 判空数组/对象/字符串 | 控制可选片段输出 |
| `option` | 读取 `options.hash` 中的值（一般不直接用） | - |
| `noop` | 空渲染（占位） | - |

## 3. 数组 / 迭代（潜在扩展）
| Helper | 作用 | 可能场景 |
| ------ | ---- | -------- |
| `forEach` | 迭代数组并暴露 `index`、`isFirst`、`isLast` | 批量生成多框架入口、批量依赖声明 |
| `map` / `pluck` | 派生数组 | 复杂派生需求时（当前暂不需要） |
| `some` | 条件存在性 | 未来动态 feature flags 汇总 |

## 4. 字符串（如需命名转换时）
| Helper | 作用 | 示例 |
| ------ | ---- | ---- |
| `camelcase` / `pascalcase` | 命名风格转换 | 组件/变量命名派生 |
| `dashcase` / `snakecase` | 转不同分隔格式 | 包名、文件名生成 |
| `trim` / `replace` | 基础清理替换 | 动态注释内容处理 |
