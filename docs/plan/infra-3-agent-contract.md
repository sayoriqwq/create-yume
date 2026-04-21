# Infra 3 — Agent 执行合同

← [Lead](./lead.md) · 前置：可与 Infra 0-2 并行，但必须在 Code Tier 开始前完成

## 目的

让后续 agent 不需要猜"这个仓库默认怎么做事"。把执行合同、统一验证入口、产物 / 入口一致性固化为仓库自带事实。

## 当前缺口

- 没有 repo-local `AGENTS.md`。
- `package.json` 的 `bin` / `main` 声明为 `dist/index.js`，但 `tsdown` 实际产物是 `dist/index.mjs`（仓库内入口仍有漂移）。
- 根 `package.json` 没有 `pnpm verify` 之类的统一验证入口。
- lint 作用域已在根 eslint 里排除 docs（`eslint.config.mjs`），但规则没写到 `AGENTS.md` 供 agent 参考。

## 交付物

### A. `AGENTS.md`（仓库根）

至少覆盖：

- [ ] 当前支持的项目类型（react / vue；node 声明但未实装）。
- [ ] 当前明确不支持的范围（远程模板、插件化、CLI 增量更新）。
- [ ] 允许修改的主要区域（`apps/cli/src`、`apps/cli/templates`、`docs/`）。
- [ ] 高风险区域（`core/services/planner.ts`、`core/services/template-engine.ts`、`modifier/package-json.ts`）。
- [ ] 常见任务的最小验证集合（见 D）。
- [ ] CLI 入口 / 构建产物约定（见 B）。
- [ ] 模板目录与注册表约定。
- [ ] 提交信息要求（conventional + lobe-commit）。

### B. 入口 / 产物一致性

- [ ] 二选一并落地：
  - **选 A**（推荐）：`tsdown.config.ts` 输出 `dist/index.js`，更新 README 和 `package.json` `bin` / `main` 对齐。
  - **选 B**：`package.json` `bin` / `main` 改为 `dist/index.mjs`，README 示例改成 `.mjs`。
- [ ] 扫 `rg 'dist/index\.(js|mjs)' .` 确认仓库内无残留的反向引用。

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

- [ ] `verify` 作为 agent 默认的"能不能提交"门。
- [ ] `verify:code` 作为"只改代码"时的轻量版。
- [ ] `verify:docs` 必须真的能跑。当前 `eslint.config.mjs` 已把 `docs/**` 全局 ignore（跑 `pnpm lint docs` 会 exit 2：all files ignored）。**三选一并落地**：
  - **选 A（推荐）**：docs 不用 eslint。`verify:docs` 改为其他检查，如 `pnpm markdownlint-cli2 "docs/**/*.md"`（新增 devDep）或相对链接检查脚本。
  - **选 B**：放开 docs 的 eslint ignore，但仅对 `docs/**/*.md` 启用受限规则（不扫 `docs/llms/**`），并把 `.lintstagedrc.json` 对应打开。
  - **选 C**：不做 docs lint，删掉 `verify:docs`，在 `AGENTS.md` 里直接说"docs 只人工 review"。
- [ ] 选型落地后，同步更新 [lead.md](./lead.md) "贯穿两层的一致性约束" 一段里对 `verify:docs` 的提法。

### D. 验证矩阵（新建 `docs/verification-matrix.md`）

把"改哪里，至少跑什么"列成表，例如：

| 修改范围                          | 必跑                                         |
| --------------------------------- | -------------------------------------------- |
| `apps/cli/templates/fragments/**` | `pnpm --filter create-yume test`（render snapshot） |
| `apps/cli/src/core/template-registry/**` | `pnpm --filter create-yume test`（planner snapshot） |
| `apps/cli/src/index.ts`           | `pnpm build` + 手跑一次 preset             |
| `apps/cli/src/core/modifier/package-json.ts` | 生成产物 diff                    |
| `docs/**`                         | `pnpm verify:docs`（以 C 节选型为准）        |

- [ ] 该表需要和 Code Phase 5 的 snapshot 覆盖清单保持一致。

## 验证

- `AGENTS.md` 从冷启动读完能回答："改模板该跑什么？"、"提交信息格式？"、"哪些区域改起来要小心？"。
- `pnpm verify` 在干净 workspace 上一次性跑通。
- `dist/` 下实际产物和 `package.json.bin` / README 示例完全一致。

## 非目标

- 不新增 CI workflow；只把本地合同固化。
- 不引入 ADR 体系（留给后续）。
