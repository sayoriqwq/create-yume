# 验证矩阵

> 这份矩阵用于根据改动范围选择最低验证集。需要更高把握时，可以在最低集之上继续叠加 `pnpm verify`。

| 任务类型 | 涉及文件 | 最低验证命令 | 说明 |
| --- | --- | --- | --- |
| 新增或修改模板片段 / partial | `apps/cli/templates/fragments/**`、`apps/cli/templates/partials/**`，以及可能联动的 `apps/cli/src/core/template-registry/*.ts` | `pnpm --filter create-yume test` | 重点看 planner snapshot 和 template render snapshot 是否只出现预期差异。 |
| 修改 planner 行为 | `apps/cli/src/core/services/planner.ts`、`apps/cli/src/core/template-registry/*.ts` | `pnpm --filter create-yume test` | planner snapshot 应能解释任务列表变化；如果连带入口或构建行为变化，再补 `pnpm --filter create-yume build`。 |
| 修改模板引擎或 helper 注册 | `apps/cli/src/core/services/template-engine.ts`、`apps/cli/src/core/services/template-helpers.ts`、partial 注册相关代码 | `pnpm --filter create-yume test` | 当前 render snapshot 与 helper 测试覆盖了 React、Vue 和共享模板的关键路径。 |
| 修改 `package.json` 组合逻辑 | `apps/cli/src/core/modifier/package-json.ts` | `pnpm --filter create-yume build` | 行为变化时，建议额外生成一个 preset 项目检查产物中的 `package.json`。如果计划形状也变了，再补 `pnpm --filter create-yume test`。 |
| 修改 CLI 构建或入口配置 | `apps/cli/package.json`、根 `package.json`、`apps/cli/tsdown.config.ts` | `pnpm --filter create-yume build` | 需要确认 `apps/cli/dist/index.js` 存在；入口或打包元数据变更时，提交前建议执行 `pnpm verify`。 |
| 只改文档 | `docs/**/*.md`、`README.md`、`AGENTS.md` | 人工校对 | 当前仓库没有单独的文档 lint；以事实核对和评审为主。 |

## 当前仓库的根验证脚本

- `pnpm verify`：当前等价于 `build + test + lint`
- `pnpm verify:code`：当前与 `pnpm verify` 保持一致

如果改动跨越模板、运行时和构建配置，直接跑 `pnpm verify` 更稳妥。
