# T003 Package Manifest Collector

## 层级

架构层。

## 状态

近期可执行候选。建议在 T001 / T002 的设计基础上推进。

## 背景

`package.json` 是当前最明显的热点文件。现状已经避免了 Handlebars 模板，但中心 package manifest 组合逻辑仍然知道过多 framework、workspace bootstrap 和 capability 细节。

## 目标

将 package manifest 生成从“中心函数了解所有规则”改为“中心 collector 收集 owner contribution”。

## 非目标

- 不改变生成出的 package manifest 内容。
- 不新增外部依赖策略。
- 不引入远程版本解析。

## 建议方向

1. 保留 package manifest 的 base shape 作为一个明确 owner 的职责。
2. 让 workspace bootstrap、React/Vue scaffold family、router、state management 各自暴露 package contribution。
3. collector 只负责收集、排序和提交到 JSON mutation。
4. 保持 dependency、devDependency、script 等 helper 作为 package-specific helper。

## 触发条件

- 新 capability 需要新增依赖或 script。
- package manifest 组合函数继续增长。
- structured target contribution 模型准备落地。

## 验证重点

- 现有 package manifest 快照或断言不发生非预期变化。
- 各 owner 的 contribution ownership 能在 `PlanSpec` 中追踪。
- 新 capability 的 package 修改只需要改对应 owner。

