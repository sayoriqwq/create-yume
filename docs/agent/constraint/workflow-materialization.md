# Workflow Materialization 约束

## 目的

本约束用于定义 CLI workflow 中不同生成策略的使用边界。

当前系统不应被理解为“Handlebars 模板渲染”和“函数式组合”两条 workflow。当前系统只有一条稳定 workflow：

1. 收敛 `ProjectConfig`。
2. owner 贡献 generation units。
3. 构建 `Plan` / `PlanSpec`。
4. 应用 plan。
5. 执行 post-generate command。

Handlebars fragment render、JSON / text mutation、static asset copy、post-generate command 只是同一条 workflow 下的不同 materialization strategy。

## 读者与行动

本文档面向修改 CLI workflow、模板注册、组合型文件生成或 capability owner 的执行者。

读完后，应能判断一个生成目标应该使用哪种 materialization strategy，并知道热点文件应如何演进。

## 核心原则

1. 单一 workflow 优先于统一渲染技术。
2. `Plan` / `PlanSpec` 是稳定执行边界。
3. materialization strategy 是内部实现选择，不应泄漏成调用方需要记忆的双模式。
4. owner 应拥有自己的规则，中心 composer 只应收集和排序贡献。
5. 对热点文件，不应为了“所有文件都走模板”而把结构化决策塞进 Handlebars。

## Strategy 选择规则

### Fragment Render

当目标文件主要是固定形状的人类可读源码或配置片段时，使用 fragment render。

适用情况：

- 文件内容整体像一个完整文件。
- 条件分支少，并且只影响局部文本。
- 读模板时可以直接理解输出结构。
- owner 贡献的是“渲染一个文件”。

不适用情况：

- 模板中需要表达大量跨 owner 的策略判断。
- 多个 capability 都需要修改同一个目标文件。
- 输出需要结构化合并、排序、去重或冲突检查。
- 模板 helper 开始承载 package policy、dependency policy 或 workflow policy。

### JSON / Text Mutation

当目标文件是多方决策汇合点时，使用 JSON / text mutation。

适用情况：

- 文件是结构化数据，或可被稳定地视为结构化内容。
- 多个 owner 需要向同一目标贡献片段。
- 输出需要确定性排序、合并、去重或 snapshot。
- 每个贡献都需要保留 ownership trace。
- 新 capability 不应该迫使中心 composer 学会该 capability 的内部规则。

`package.json` 是当前最典型的 JSON mutation 目标。它不应退回 Handlebars 模板。

### Static Asset Copy

当目标文件不需要配置参与，也不需要渲染时，使用 static asset copy。

适用情况：

- 文件内容固定。
- 文件不需要读取 `ProjectConfig`。
- 文件不需要 owner 间合并。

### Post-Generate Command

当行为必须在文件生成后由外部命令完成时，使用 post-generate command。

适用情况：

- 行为依赖包管理器、Git、工具 CLI 或平台命令。
- 行为不适合被表示为文件写入。
- 命令可以被明确归属到 owner 与 phase。

post-generate command 不应隐藏文件生成规则。能稳定表示为 plan task 的文件产物，应优先进入 plan。

## 热点文件约束

热点文件是指多个 owner 都天然需要贡献内容的同一目标文件。

热点文件不应由大型 Handlebars 模板承载策略分支。热点文件也不应长期依赖一个越来越了解所有 owner 细节的中心函数。

热点文件应按以下方向演进：

1. 一个 owner 负责 base shape。
2. 各 capability owner 暴露自己的 contribution。
3. contribution 必须携带 ownership trace。
4. 中心 composer 只负责收集、排序和提交 contribution。
5. merge、sort、dedupe、conflict policy 应下沉到 plan / mutation boundary。

当前 planner 已在 plan application 前拒绝 duplicate target-path conflicts。这个契约对 fragment render 和 static asset copy 仍然有效。

当未来需要支持多个 JSON / text mutation 指向同一热点文件时，应把它设计为同 path mutation 合并语义，而不是让每个 owner 回到中心聚合函数。

## `package.json` 约束

`package.json` 是结构化决策汇合点，不是文本模板。

对 `package.json` 的新增规则应优先满足以下要求：

1. dependency、script、devDependency、engine 等规则用 JSON mutation 表达。
2. capability 相关依赖由 capability owner 贡献。
3. workspace bootstrap 相关依赖与 script 由 workspace bootstrap owner 贡献。
4. framework family 相关依赖由对应 scaffold-family owner 贡献。
5. mutation 必须可序列化为可解释的 `PlanSpec`。
6. 不应通过 Handlebars helper 编码 dependency policy。

如果新增 capability 时必须直接修改中心 `package.json` 聚合函数，说明 owner contribution 边界还不够深，应优先考虑抽出 contribution 接口。

## 反模式

以下做法应避免：

- 为了统一技术栈，把 `package.json` 改成 Handlebars 模板。
- 在 Handlebars helper 中隐藏 package policy。
- 在中心 composer 中持续追加 capability-specific 分支。
- 让调用方记住某个 path 到底应该走模板、mutation 还是命令。
- 让同一设计决策同时出现在模板、package mutation 和 post-generate command 中。
- 为了短期省事，把 owner 的私有规则泄漏到 preserved core。

## 检查点

新增或修改生成目标时，先回答以下问题：

1. 这个目标像完整文件，还是像多方决策汇合点？
2. 是否会有多个 owner 修改同一个目标？
3. 是否需要 merge、sort、dedupe、conflict policy？
4. 新 capability 是否只需要新增自己的 contribution，而不需要改中心 composer？
5. 这个规则是否能在 `PlanSpec` 中被解释？
6. 如果用 Handlebars，模板是否会变成策略表？

如果答案显示目标是热点文件，应选择函数式 contribution / mutation 方向，而不是 fragment render。

