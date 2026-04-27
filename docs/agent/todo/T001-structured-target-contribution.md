# T001 Structured Target Contribution

## 层级

架构层。

## 状态

未来架构特性。尚未进入实现。

## 背景

当前 `package.json` 已经暴露出热点文件特征：多个 owner 都需要贡献内容，但这些贡献不适合放进 Handlebars 模板。未来 `tsconfig`、lint-staged 配置或其他结构化配置也可能变成同类热点。

## 目标

建立通用的 structured target contribution 概念，让 owner 可以声明“我要修改某个结构化目标”，由稳定 workflow 负责收集、合并、排序、追踪和序列化。

## 非目标

- 不把所有模板都改成函数式组合。
- 不为尚未出现复杂度的配置文件提前设计完整 DSL。
- 不引入插件系统或远程模板来源。

## 建议方向

1. 定义通用 contribution 形状，至少包含 target path、mutation kind、ownership 和 apply 函数。
2. 将 JSON / text mutation 视为 structured target contribution 的 materialization strategy。
3. 让 package manifest、TypeScript config 等领域 helper 建在通用 contribution 之上。
4. 保持 `Plan` / `PlanSpec` 是最终执行与解释边界。

## 触发条件

- 第二个热点文件出现。
- 新 capability 需要同时改多个结构化配置文件。
- 新增能力时中心 composer 开始频繁追加 capability-specific 分支。

## 验证重点

- planner snapshot 能解释每个 owner 的贡献。
- 同一 owner 新增 contribution 不需要修改 preserved core。
- 新 contribution 的序列化信息进入 `PlanSpec`。

