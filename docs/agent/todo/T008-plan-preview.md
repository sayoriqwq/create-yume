# T008 Plan Preview

## 层级

用户可见能力候选。

## 状态

未来功能。建议在 dry run 之后或与 dry run 同步设计。

## 背景

当前 `PlanSpec` 已经可以序列化 task、target path、template source、JSON reducer 和 post-generate command。计划预览可以把这份结构变成用户或维护者可读的输出。

## 目标

提供可读的 plan preview，展示将生成或修改的目标、owner、contribution unit 和后置命令。

## 非目标

- 不展示完整大文件内容，除非用户明确选择详细模式。
- 不把 preview 做成新的 plan 构建逻辑。
- 不把 preview 输出当作外部稳定 API，除非后续另有决策。

## 建议方向

1. 以 `PlanSpec` 为唯一数据源。
2. 默认展示摘要：目标 path、task kind、owner、unit、post-generate command。
3. 详细模式可展示 JSON reducer input 或 text transform 名称。
4. preview 的输出格式应适合人工阅读，snapshot 应覆盖稳定结构。

## 依赖

- T001 Structured Target Contribution。
- T002 Same-Path Mutation Merge，若 preview 要解释多个 owner 对同一热点文件的贡献。
- T007 Dry Run，若 preview 作为 dry run 的默认输出。

## 验证重点

- preview 输出与 `PlanSpec` 一致。
- owner 信息不丢失。
- same-path mutation 合并后仍能展示各 contribution。
- 不执行 plan apply 和 post-generate command。

