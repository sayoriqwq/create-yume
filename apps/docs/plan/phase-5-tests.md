# Phase 5 — 测试基建

← [Lead](./lead.md) · 前置：[Phase 1](./phase-1-cleanup.md)-[Phase 4](./phase-4-features.md)

## 目的

最小 ROI 的两类 snapshot 测试，避免后续刷版本 / 改模板误伤。不追求覆盖率。

## 模块 A · 测试运行器选型

### 候选

| 选项                       | 优点                              | 缺点                          |
| -------------------------- | --------------------------------- | ----------------------------- |
| **vitest**（推荐）         | TS 开箱、snapshot 好用、生态成熟  | 增加一份 dev dep              |
| node --test                | 零依赖                            | snapshot 需 `t.snapshot` 较新；ESM 兼容偶有坑 |

**推荐 vitest**：`apps/cli/package.json` 加 `"vitest": "^x.y.z"` 到 devDeps。

- [ ] 定版后写入 `apps/cli/package.json`
- [ ] `apps/cli/vitest.config.ts`（或复用 `tsdown.config.ts` 里的 alias）
  - `resolve.alias`：对齐 tsconfig 的 `@/*` 和 `~/*`
  - `test.environment: 'node'`
  - `test.globals: true`（可选）
- [ ] `apps/cli/package.json scripts.test: "vitest run"`、`scripts.test:watch: "vitest"`
- [ ] `turbo.json` 已有 `test` task（无 cache outputs 除 coverage）—— 确认 inputs 覆盖 `tests/**`

## 模块 B · Planner snapshot

### 测试对象

`planner.build(program)` 是纯函数（`Effect.sync`），给定 config → 确定的 `Plan.tasks`。

### 4 组固定 fixture

- [ ] `tests/fixtures/config.ts` 导出：
  - `reactPreset`：对应 `preset react-app` 的完整 config
  - `vuePreset`：对应 `preset vue-app`
  - `reactCustom`：`create` 模式典型组合（ts + tailwind + tanstack-router + jotai）
  - `vueCustom`：`create` 模式典型组合（ts + sass + router: true + pinia: true）

### 测试脚本

- [ ] `apps/cli/tests/planner.spec.ts`：
  ```ts
  it.each(fixtures)('builds deterministic plan for %s', async (name, config) => {
    const plan = await Effect.runPromise(buildPlanFromConfig(config))
    expect(plan.tasks.map(normalizeTask)).toMatchSnapshot()
  })
  ```
  - `normalizeTask`：只保留 `kind / path / src`（剥离函数闭包如 `reducers` / `transforms` / `base` —— 这些是 `Function` 无法稳定 snapshot）
- [ ] 首次跑生成快照，人工 review 后入库 `__snapshots__/`

### 故意破坏测试

- [ ] 跑一次后手改 `template-registry/react.ts` 加一个新的 entry，确认 snapshot diff 准确报出新增路径

## 模块 C · Template render snapshot

### 测试对象

`TemplateEngineService.render` 针对关键模板的渲染输出。

### 覆盖清单

- [ ] `fragments/react/main.tsx.hbs`（router 分支 × 3：none / react-router / tanstack-router）
- [ ] `fragments/common/vite.config.ts.hbs`（plugin 组合：vue、react、tailwind）
- [ ] `fragments/common/linter/eslint.config.mjs.hbs`（react vs vue）
- [ ] `fragments/vue/App.vue.hbs`（router / stateManagement 开关）

### 测试脚本

- [ ] `apps/cli/tests/template-render.spec.ts`：
  ```ts
  const rendered = await Effect.runPromise(
    program.pipe(Effect.provide(TestLayer))
  )
  expect(rendered).toMatchSnapshot()
  ```
- [ ] `TestLayer` 用 `TemplateEngineLive` + `FsLive` + `NodeFileSystem.layer`；不需要 Orchestrator / Planner

## 验证

- [ ] `pnpm test`（在 `apps/cli` 或仓库根）通过
- [ ] `pnpm turbo run test` 通过
- [ ] 故意改 `modifier/package-json.ts` 里一个版本号 → 跑 test → planner snapshot 不应变（版本号在 reducer 闭包里，被 normalizeTask 剥离了）
- [ ] 故意改 `fragments/react/main.tsx.hbs` → render snapshot 必须报出 diff

## 注意事项

- snapshot 文件入 git，但 **review 必须仔细**：一个被意外"接受"的 bad snapshot 就废了
- 不要对 `apply` 做集成测试（涉及真实 fs、易 flaky）；planner.build 才是可重复的纯函数
- 如果 Phase 4 的 rollback 引入了新的执行逻辑，本阶段可追加一个最小 rollback 集成测试（tmpdir 里跑）
