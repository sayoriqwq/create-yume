# Infra 3 — Agent 执行合同

← [Lead](../../plan/lead.md) · 前置：可与 Infra 0-2 并行，但必须在 Code Tier 开始前完成

## 目的

让后续 agent 不需要猜"这个仓库默认怎么做事"。把执行合同、统一验证入口、产物 / 入口一致性固化为仓库自带事实。

> 状态：已完成。当前执行合同以仓库根 `AGENTS.md`、`package.json`、
> `README.md` 和 `docs/verification-matrix.md` 为准。

## 已落地结果

- repo-local `AGENTS.md` 已建，支持范围、允许修改区域和最小验证集合已固化。
- `package.json` 的 `bin` / `main` 与 `tsdown` 产物统一为 `dist/index.js`。
- 根 `package.json` 已提供 `pnpm verify` 与 `pnpm verify:code`。
- docs-only 改动当前走人工 review；仓库内没有 `pnpm verify:docs`。

## 交付物

### A. `AGENTS.md`（仓库根）

至少覆盖：

- [x] 当前支持的项目类型（react / vue）。
- [x] 当前明确不支持的范围（远程模板、插件化、CLI 增量更新）。
- [x] 允许修改的主要区域（`apps/cli/src`、`apps/cli/templates`、`docs/`）。
- [x] 高风险区域（`core/services/planner.ts`、`core/services/template-engine.ts`、`modifier/package-json.ts`）。
- [x] 常见任务的最小验证集合（见 D）。
- [x] CLI 入口 / 构建产物约定（见 B）。
- [x] 模板目录与注册表约定。
- [x] 提交信息要求（conventional + lobe-commit）。

### B. 入口 / 产物一致性

- [x] 二选一并落地：
  - **选 A**（推荐）：`tsdown.config.ts` 输出 `dist/index.js`，更新 README 和 `package.json` `bin` / `main` 对齐。
  - **选 B**：`package.json` `bin` / `main` 改为 `dist/index.mjs`，README 示例改成 `.mjs`。
- [x] 扫 `rg 'dist/index\.(js|mjs)' .` 确认仓库内无残留的反向引用。

### C. 统一验证入口

根 `package.json` 新增：

```json
{
  "scripts": {
    "verify": "pnpm build && pnpm --filter create-yume typecheck && pnpm --filter create-yume test && pnpm lint",
    "verify:code": "pnpm --filter create-yume typecheck && pnpm --filter create-yume test && pnpm lint",
    "verify:docs": "<选型，见下>"
  }
}
```

- [x] `verify` 作为 agent 默认的"能不能提交"门。
- [x] `verify:code` 作为"只改代码"时的轻量版。
- [x] docs-only 改动按人工 review 执行；不再要求 `verify:docs` 脚本。
- [x] 同步更新 [lead.md](../../plan/lead.md) 与 `AGENTS.md` 里的 docs 验证口径。

### D. 验证矩阵（新建 `docs/verification-matrix.md`）

把"改哪里，至少跑什么"列成表，例如：

| 修改范围                          | 必跑                                         |
| --------------------------------- | -------------------------------------------- |
| `apps/cli/templates/fragments/**` | `pnpm --filter create-yume test`（render snapshot） |
| `apps/cli/src/core/template-registry/**` | `pnpm --filter create-yume test`（planner snapshot） |
| `apps/cli/src/index.ts`           | `pnpm build` + 手跑一次 preset             |
| `apps/cli/src/core/modifier/package-json.ts` | 生成产物 diff                    |
| `docs/**`                         | 人工 review                                 |

- [x] 该表需要和 Code Phase 5 的 snapshot 覆盖清单保持一致。

## 验证

- `AGENTS.md` 从冷启动读完能回答："改模板该跑什么？"、"提交信息格式？"、"哪些区域改起来要小心？"。
- `pnpm verify` 在干净 workspace 上一次性跑通。
- `dist/` 下实际产物和 `package.json.bin` / README 示例完全一致。

## 非目标

- 不新增 CI workflow；只把本地合同固化。
- 不引入 ADR 体系（留给后续）。
