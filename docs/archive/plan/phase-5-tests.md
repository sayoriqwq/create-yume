# Phase 5 — 测试 fixture / snapshot

← [Lead](../../plan/lead.md) · 前置：[Phase 1](./phase-1-cleanup.md)-[Phase 4](./phase-4-features.md)，[Infra 2](./infra-2-lifecycle-testing.md)

## 目的

最小 ROI 的两类 snapshot 测试，避免后续刷版本 / 改模板误伤。不追求覆盖率。

> **与当前状态的关系**：
> - vitest 已装（catalog `vitest ^4.1.5`），`apps/cli/package.json` 已有 `"test": "vitest run"`。
> - 立项时 `apps/cli/src/core/services/template-helpers.test.ts` 是首个测试；当前 planner / render snapshot 已落地在 `apps/cli/tests/`。
> - `tests/support/` 下的 fixtures / mock layer 已由 Infra 2 B 铺好，本阶段直接复用。

## 模块 A · 运行器 & 目录

- [x] 新建 `apps/cli/tests/` 目录；spec 文件命名 `*.spec.ts`
- [x] 可选：`apps/cli/vitest.config.ts` 对齐 tsconfig 的 `@/*` / `~/*` alias（当前依赖默认行为可能已够）
- [x] 确认 `turbo.json` 的 `test` task inputs 覆盖 `tests/**`

## 模块 B · Planner snapshot

### 测试对象

`planner.build(program)` 是纯函数（`Effect.sync`），给定 config → 确定的 `Plan.tasks`。

### 4 组固定 fixture

- [x] `tests/support/fixtures.ts`（Infra 2 已有雏形）导出：
  - `reactPreset` — 对应 `preset react-app` 的完整 config
  - `vuePreset` — 对应 `preset vue-app`
  - `reactCustom` — `create` 模式典型组合（ts + tailwind + tanstack-router + jotai）
  - `vueCustom` — `create` 模式典型组合（ts + sass + router: true + pinia: true）

### 测试脚本

- [x] `apps/cli/tests/planner.spec.ts`：
  ```ts
  it.each(fixtures)('builds deterministic plan for %s', async (name, config) => {
    const plan = await Effect.runPromise(buildPlanFromConfig(config))
    expect(plan.tasks.map(normalizeTask)).toMatchSnapshot()
  })
  ```
  - 使用 Infra 0 的 `toPlanSpec(plan)` 做断言对象（不再手写 `normalizeTask`）
- [x] 首次跑生成快照，人工 review 后入库 `__snapshots__/`

### 故意破坏测试

- [x] 跑一次后手改 `template-registry/react.ts` 加一个新 entry，确认 snapshot diff 准确报出新增路径

## 模块 C · Template render snapshot

### 测试对象

`TemplateEngineService.render` 对关键模板的渲染输出。

### 覆盖清单

- [x] `fragments/react/main.tsx.hbs`（router 分支 × 3：none / react-router / tanstack-router）
- [x] `fragments/common/vite.config.ts.hbs`（plugin 组合：vue、react、tailwind）
- [x] `fragments/common/linter/eslint.config.mjs.hbs`（react vs vue）
- [x] `fragments/vue/App.vue.hbs`（router / stateManagement 开关）

### 测试脚本

- [x] `apps/cli/tests/template-render.spec.ts`：
  ```ts
  const rendered = await Effect.runPromise(
    program.pipe(Effect.provide(TestLayer))
  )
  expect(rendered).toMatchSnapshot()
  ```
- [x] `TestLayer` 复用 Infra 2 B 提供的组合（`TemplateEngineLive` + `FsLive` + `NodeFileSystem.layer`）

## 模块 D · 回滚 smoke（可选，Phase 4 已做则加）

- [x] 在 tmpdir 跑一次 `planner.apply` + 人为注入 render 失败，断言：
  - 写入过的文件不存在
  - 创建过的目录不存在
  - 原错误被透传

## 验证

- [x] `pnpm --filter create-yume test` 通过
- [x] `pnpm turbo run test` 通过
- [x] 故意改 `modifier/package-json.ts` 里一个版本号 → 跑 test → planner snapshot 不应变（版本号在 reducer 闭包里，`PlanSpec` 层不体现）
- [x] 故意改 `fragments/react/main.tsx.hbs` → render snapshot 必须报出 diff
- [x] `pnpm verify`（Infra 3 定义）一次性跑通

## 注意事项

- snapshot 文件入 git，但 **review 必须仔细**：一个被意外"接受"的 bad snapshot 就废了
- 不要对 `apply` 做全量集成测试（涉及真实 fs、易 flaky）；planner.build 才是可重复的纯函数

Done at commit `9c43a5c`.
