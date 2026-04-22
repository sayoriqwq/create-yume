# 当前阶段架构计划 - Ownership Model

> 本文定义当前阶段的 ownership hierarchy。后续所有 sub-doc 都必须服从这里的分层。

## 目标

把当前“按执行阶段散落的决策”改成“按 ownership hierarchy 归属的决策”，但不重写现有执行内核。

## 分层

| 层级 | 负责什么 | 典型输入 | 典型输出 | 不负责什么 |
| --- | --- | --- | --- | --- |
| Preserved Core | 稳定执行内核与安全边界 | `ProjectConfig`、DSL、文件与模板服务 | `Plan`、`PlanSpec`、render/copy/json/text apply、rollback | 不直接承载业务能力决策 |
| Scaffold-Family Owner | 某类脚手架的语义边界 | family 级 schema、preset、可用能力集 | family 默认值、允许的 capability surface、family 基础贡献 | 不处理 workspace/bootstrap 语义 |
| Workspace/Bootstrap Owner | 项目布局与初始化语义 | git、install、workspace mode、quality/bootstrap 选项 | workspace 布局、bootstrap 命令、quality-bootstrap 贡献 | 不处理 family 内部功能语义 |
| Capability Owner | 单一能力的局部决策 | family + workspace 给出的能力 surface | contribution units 的具体实例 | 不定义新的顶层 family / workspace 规则 |

## 当前阶段的实际映射

- Preserved Core：
  - `PlanService`
  - `PlanSpec`
  - `TemplateEngineService`
  - `FsService`
  - rollback 语义
- Scaffold-Family Owner：
  - 当前只有 `react`、`vue`
  - 未来扩到 `node`、CLI app 等 family
- Workspace/Bootstrap Owner：
  - 当前默认是 single-package
  - `git`、安装、commit hooks、quality-bootstrap 归这一层
  - 未来扩到 monorepo / setup-only
- Capability Owner：
  - 当前阶段只允许定义一个 pilot：`router`
  - 未来才扩到 `stateManagement` 等

## 决策流向

1. Lead 先确定分层和 gates。
2. Scaffold-Family Owner 先定义某个 family 的能力表面和约束。
3. Workspace/Bootstrap Owner 再定义布局、初始化和 quality-bootstrap。
4. Capability Owner 只能在前两层给出的边界内发出 contributions。
5. Preserved Core 负责把 contributions 收敛为 plan 并安全执行。

## 约束

- Capability Owner 不能绕过前两层直接改 global contract。
- Workspace/Bootstrap Owner 不能偷渡 family-specific 业务语义。
- Scaffold-Family Owner 不能自行发明新的 contribution unit。
- 新增 family 前，必须先通过当前阶段的 pilot proof。

## 当前阶段非目标

- 直接上插件系统。
- 把 orchestrator、planner、template engine 推翻重写。
- 在没有 ownership hierarchy 的前提下直接扩 `node` / monorepo。
