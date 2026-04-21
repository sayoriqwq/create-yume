# Infra 0 — Schema + Brand 契约层

← [Lead](./lead.md)

## 目的

让所有外部输入（CLI flags、JSON 读入、问答结果）进入业务逻辑前先 `Schema.decodeUnknown`，关键标识禁止裸 `string`。这是后续所有 Infra / Code 阶段的基础。

## 当前缺口（对照代码）

- `apps/cli/src/types/config.ts` 只有 interface，无运行时 Schema。
- `apps/cli/src/core/questions/compose.ts` 问答结束直接拼装 `ProjectConfig`，没有集中 decode。
- 路径 / 目录名 / 包名在 `planner.ts`、`template-engine.ts`、`compose.ts` 的签名里都是裸 `string`。

## 交付物

### A. Schema 定义（新建 `apps/cli/src/schema/`）

仅覆盖 **纯数据** 对象；含闭包字段的不做 Schema（见 B/C）。

- [ ] `project-config.ts` — `ProjectConfig` / `VueProjectConfig` / `ReactProjectConfig` / `BaseProjectConfig`
- [ ] `preset.ts` — `Preset`（`'react-app' | 'vue-app'`）、`CreateMode`
- [ ] `cli-args.ts` — CLI flag 解析结果（供 Phase 4-A decode）
- [ ] `template-registry.ts` — registry 条目的 **声明部分**（`condition` / `target` / `template` 路径），`condition` 函数字段保持 TS type，不纳入 Schema
- [ ] `plan-spec.ts` — 新引入的 **可序列化** 计划描述（见 B）

每个 Schema 导出：`Type`、`decode`、`encode`（可省）、pretty error（`TreeFormatter`）。
`types/config.ts`、`types/project.ts` 等纯数据 interface 改为 `Schema.Schema.Type<typeof X>` 派生。
`types/task.ts` / `types/dsl.ts` **保留为 TS type**（含闭包，无法 Schema 化）。

### B. Task / Plan 的定位修正

当前 `Task` 含 `reducers / transforms / base / finalize` 等闭包（见 `apps/cli/src/types/task.ts`、`apps/cli/src/core/services/planner.ts` 的 `build`），不能直接做 Schema。处理方式：

- [ ] 保留 `Task` / `Plan` 为执行期的 TS type，不 Schema 化
- [ ] 新增 **`PlanSpec`**：只保留可序列化字段（`kind`、`path`、`src`、`data` 字面量）；`json` / `text` 任务记录"reducer 名称 + 输入字面量"而不是函数本体
- [ ] `PlanSpec` 纳入 Schema，作为 Phase 5 planner snapshot 的稳定断言对象（替换旧计划里 "`normalizeTask` 手剥闭包" 的做法）
- [ ] `Plan` → `PlanSpec` 的派生函数（`toPlanSpec(plan: Plan): PlanSpec`）作为边界
- [ ] 不要求 `PlanSpec → Plan` 可逆；闭包侧永远在 `build` 里重建

### C. Brand 类型（新建 `apps/cli/src/brand/`）

- [ ] `ProjectName`、`TargetDir`、`TemplatePath`、`PackageName`、`CommandName`

每个 Brand 通过 `Schema.brand(...)` 工厂生成，业务层只能通过工厂拿到实例。

### D. 边界消费点

- [ ] `core/questions/compose.ts` 出口接一次 `ProjectConfig.decode`；失败直接中止。
- [ ] `core/services/planner.ts` 的 `path` 字段类型换成 `TargetDir`。
- [ ] `core/services/template-engine.ts` 的 `src` / `templatePath` 换成 `TemplatePath`。

## 约定文档

- [ ] `docs/conventions/effect-schema.md` — 哪些输入必须 decode、decode 失败如何处理。
- [ ] `docs/conventions/effect-brand.md` — Brand 工厂位置、消费点、禁止裸 string 的边界。

## 验证

- `pnpm --filter create-yume typecheck` 通过。
- `pnpm --filter create-yume test` 含至少一组 Schema decode 契约测试。
- 人为往 `collectQuestions` 注入非法 preset → 看到结构化错误，不是运行时 crash。

## 非目标

- 不覆盖错误体 / fs 内部类型等边缘对象。
- 不引入 zod 等 Effect 之外的 validator。
- 不追求 `Task` / `Plan` 可序列化；只保证 `PlanSpec` 可序列化。
