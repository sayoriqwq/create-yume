# T009 Generated Project Smoke Gate

## 层级

验证与发布维护。

## 状态

候选改进。当前已有 smoke 脚本，但完整验证入口默认不包含 generated project smoke。

## 背景

当前测试覆盖 planner、template render、rollback、workspace bootstrap 等内部契约。另有 generated project smoke 脚本可以构建实际生成的 React/Vue 项目。对于模板、依赖版本或 package manifest 变更，真实生成项目的构建结果是很强的回归信号。

## 目标

明确 generated project smoke 的使用边界，并决定它是否进入发布前验证或高风险模板变更验证。

## 非目标

- 不要求每次文档改动都跑 smoke。
- 不把 smoke 当作替代单元测试和 planner snapshot 的手段。
- 不扩大支持范围到 React/Vue 之外。

## 建议方向

1. 保留 smoke 作为重型验证命令。
2. 对依赖版本、package manifest、模板主路径、构建配置变更，要求考虑 smoke。
3. 可新增发布前验证说明，而不是直接塞进默认 `pnpm verify`。
4. 若 CI 时间可接受，再考虑新增单独的 release gate。

## 触发条件

- 修改 package manifest 生成规则。
- 修改 Vite、TypeScript、React、Vue 主模板。
- 升级生成项目依赖版本。
- 准备发布 CLI。

## 验证重点

- React preset 生成项目可以安装并构建。
- Vue preset 生成项目可以安装并构建。
- smoke 输出不出现交互 prompt。

