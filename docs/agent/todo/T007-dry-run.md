# T007 Dry Run

## 层级

用户可见能力候选。

## 状态

未来功能。需要先补足 plan visibility 边界。

## 背景

当前 CLI 主路径会收集配置、生成文件，然后执行可选后置命令。dry run 可以帮助用户在写入前确认将要生成什么，也可以帮助维护者验证 plan composition。

## 目标

提供不写入文件、不执行外部命令的 dry run 模式，只生成并展示计划结果。

## 非目标

- 不执行依赖安装。
- 不初始化 Git。
- 不创建目标目录。
- 不把范围扩展到远程模板、插件系统或已有项目增量更新。

## 建议方向

1. dry run 复用正常的 config collection 与 plan build。
2. dry run 输出应基于 `PlanSpec`，而不是重新扫描模板 registry。
3. 对 post-generate command 只展示 command spec，不执行。
4. 如果 hook 文件仍在 command 中写入，dry run 只能展示命令，不能展示 hook 文件内容；这会影响功能完整度。

## 依赖

- T001 Structured Target Contribution。
- T005 Post-Generate File Tasks，若 dry run 需要完整展示 hook 文件产物。
- T006 Project-Relative Path Boundary。

## 验证重点

- dry run 不创建文件和目录。
- dry run 不执行外部命令。
- dry run 与真实生成使用同一份 plan build 逻辑。
- 非交互 preset 模式可稳定输出 plan summary。

