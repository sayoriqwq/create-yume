# T006 Project-Relative Path Boundary

## 层级

架构层。

## 状态

安全硬化候选。建议在修改 planner task model 时一并考虑。

## 背景

当前目标路径来自内置 registry 和 mutation 逻辑，整体可信。但 preserved core 最好明确表达“生成任务只能写入项目目录内”。如果未来支持 plan preview、dry run、外部 PlanSpec 读取或更多生成目标，路径边界需要更硬。

## 目标

引入 project-relative target path 边界，防止生成任务使用绝对路径或通过 `..` 越界写入。

## 非目标

- 不把通用文件服务改成只能接受 branded path。
- 不改变模板根路径或真实 filesystem adapter 的职责。
- 不支持对已有项目做增量式更新。

## 建议方向

1. 在 plan task target path 层定义 project-relative 语义。
2. plan build 或 plan apply 前拒绝绝对路径与越界路径。
3. 保持模板路径和目标路径是不同 brand。
4. 如果未来从外部读取 `PlanSpec`，decode 后仍要执行路径边界校验。

## 触发条件

- 修改 plan task model。
- 引入 dry run / plan preview。
- 支持从磁盘读取 plan spec。

## 验证重点

- 绝对 target path 被拒绝。
- `..` 越界 target path 被拒绝。
- 合法 nested target path 继续工作。
- duplicate path guard 与 rollback 测试继续通过。

