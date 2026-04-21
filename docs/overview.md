# Create Yume 技术架构总览

> 本文提供对当前版本（main 分支最新提交）`Create Yume` CLI 的技术架构、执行流程、核心抽象与演进方向的全局视图，便于新贡献者快速建立心智模型。

## 1. 总体目标

- 以 **Effect** 为核心的函数式、可组合 CLI 项目脚手架。
- 通过 **分层 + DSL + 模板注册表** 的方式，将“收集配置 → 规划任务 → 渲染 / 组合文件 → 输出”流水线化。
- 使增量支持新框架 / 新特性时，主要改动局限在独立 registry / feature 模块中，避免散落逻辑。

## 2. 分层结构（逻辑视角）

```
┌──────────────────────────────────────────────┐
│ Presentation (questions / prompts)          │ 终端交互：收集用户意图
├──────────────────────────────────────────────┤
│ Orchestration (orchestrator)                │ 组装 DSL + 调用 planner + 模板注册
├──────────────────────────────────────────────┤
│ Planning (planner + DSL)                    │ 以不可执行描述记录所有生成/修改任务
├──────────────────────────────────────────────┤
│ Template Engine (handlebars + helpers)      │ 模板编译 / 渲染 / partial & helper 注册
├──────────────────────────────────────────────┤
│ File System (FsService)                     │ 封装平台 FS，统一领域错误类型
├──────────────────────────────────────────────┤
│ Effect Runtime / Layers                     │ 提供依赖注入、日志、并发、错误模型
└──────────────────────────────────────────────┘
```

## 3. 主执行流程（自顶向下）

1. `src/index.ts` 入口：构建 `main` Effect，依次执行：
   - `showWelcome` → `collectQuestions` → `showConfigSummary` → `generateProject` → `finishProject`。
2. `collectQuestions`：以 Effect 循环 / 分支收集配置（支持 *preset* 与 *create* 两种模式），返回 `ProjectConfig`（React / Vue 具体变体）。
3. `generateProject`：调用 `OrchestratorService.execute(baseDir, config)`。
4. `Orchestrator.execute`：
   - 注册 helpers、partials（按框架命名空间 + 全局）。
   - 构造一个纯函数 `program(dsl)`：
     - 条件性注册 `root.svg`、`package.json` 组合逻辑（`buildRootSvg` / `buildPackageJson`）。
     - 根据 config 框架类型调用 `buildTemplates` 将 registry 中命中的模板（`ReactTemplates` / `VueTemplates`）转换为 DSL `render()` 任务。
   - `planner.build(program)` 产出一个 `Plan{ tasks }`。
   - `planner.apply(plan, baseDir, config)` 并发执行：
     - 生成类（copy / render）
     - 修改 / 组合类（json / text）
5. 任务执行：
   - `render`：读取 `.hbs`，Handlebars 编译 + 渲染注入 `@config`。
   - `json`：可选读取旧文件 → base() → reducers (merge/modify) → finalize() → 排序 → 写出。
   - `text`：可选读取旧文件 / base() → transform() 队列。

## 4. 核心抽象

| 抽象                      | 位置                                 | 作用                                          | 说明                             |
| ------------------------- | ------------------------------------ | --------------------------------------------- | -------------------------------- |
| DSL (`ComposeDSL`)      | `types/dsl.ts`                     | 统一声明任务的构建 API                        | render / copy / json / text 四类 |
| `PlanService`           | `core/services/planner.ts`         | 将 DSL program 转换为可执行计划，并执行       | 分离“描述”与“执行”           |
| `OrchestratorService`   | `core/services/orchestrator.ts`    | 绑定模板根路径 + partial + program 组装       | 聚合注册点                       |
| `TemplateEngineService` | `core/services/template-engine.ts` | Handlebars 运行时包装 + helpers/partials 注册 | 缓存编译结果                     |
| `FsService`             | `core/services/fs.ts`              | 抽象文件系统并映射领域错误                    | 方便测试 / mock                  |
| 交互问题模块              | `core/questions/*`                 | 将一次 CLI 交互拆成独立问题                   | 支持 preset / 自定义分支         |
| 模板注册表                | `core/template-registry/*`         | 数据驱动：条件 + 目标路径 + 模板源            | 降低模板散落判断逻辑             |

## 5. 任务 DSL 设计要点

- `json(path)`：生成一个可变 draft（通过 immer produce 包装），分阶段：readExisting/base → reducers → finalize → sortKeys → write。
- `text(path)`：串行传递 string，transform 为纯函数，保证可组合性与测试性。
- `render(src, target)`：不持久化中间 AST，直接 defer 到执行阶段读取源模板；保证 registry 变更只需重新 build plan。
- 不在执行阶段携带 config 快照（除渲染时），避免 DSL 构建后被意外突变导致非确定性；依赖 config 的逻辑集中在 program 构建阶段。

## 6. 并发与安全

- `DEFAULT_CONCURRENCY` 控制 `Effect.forEach` 并发写文件，避免同时打开过多 fd；当前简单值即可。
- 写文件前确保目标目录 `ensureDir`，重复 copy 时若已存在则跳过（幂等性）。
- Handlebars 禁用原型访问（`allowProto* = false`）。
- 错误模型：
  - 领域 FS 错误统一 `FileIOError`（带操作名 + 路径）。
  - 模板编译/渲染错误统一 `TemplateError`（阶段 compile / render + 模板路径）。

## 7. 可扩展点（添加新框架示例）

1. 在 `template-registry/` 新增 `svelte.ts`：导出 `SvelteTemplates: TemplateRegistry<SvelteProjectConfig>`。
2. 在 `types/config.ts` 增加 `SvelteProjectConfig` 类型并更新 `ProjectConfig` union。
3. 在 `utils/type-guard.ts` 添加 `isSvelteProject`。
4. 在问题收集流程中加入 `askSvelteXxx`（或 preset）。
5. 在 `buildTemplates` 中接入：`if (isSvelteProject(config)) register(SvelteTemplates)`。
6. 若有特定组合文件逻辑（如 `package.json`）：在 `core/modifier` 下添加对应构造函数并在 orchestrator program 中调用。

## 8. 目录结构速览（与架构映射）

```
apps/cli/src
├── core
│   ├── adapters/              # 外部库适配（prompts/json）
│   ├── services/              # Orchestrator / Planner / TemplateEngine / Fs
│   ├── questions/             # 交互式问题（分 common / vue / react）
│   ├── template-registry/     # 模板注册表（vue / react / root-svg）
│   ├── modifier/              # 组合文件（package-json 等）
│   └── compose.ts             # 欢迎语 / 总结输出辅助
├── templates/                 # Handlebars 模板、partials、片段
├── types/                     # DSL、错误、配置、模板类型
├── utils/                     # 轻量工具 & type guards
└── index.ts                   # CLI 入口，提供 Layer 装配
```

## 9. 架构权衡与选择

| 议题       | 选择             | 原因                                | 替代方案                  |
| ---------- | ---------------- | ----------------------------------- | ------------------------- |
| 模板引擎   | Handlebars       | 生态成熟、partials + helpers 易扩展 | EJS / Eta / 自研 AST 组合 |
| 状态与错误 | Effect           | 统一 IO / 错误 / 并发抽象           | RxJS + 自定义错误包       |
| JSON 组合  | DSL + immer      | 可读性 + 不可变 reducer             | 直接对象拼接 / AST diff   |
| 任务计划   | 分离 build/apply | 便于测试（对 plan 断言）            | 直接即时执行（难测试）    |
| 并发模型   | Effect.forEach   | 受控并发，取消/错误传播一致         | Promise.all + 手写限流    |
| 模板选择   | Registry 条件    | 数据驱动，可静态审查                | if/else 散落逻辑          |

## 10. 当前限制 / 改进方向

| 类别     | 问题                          | 改进建议                                     |
| -------- | ----------------------------- | -------------------------------------------- |
| 配置读取 | 不支持 CLI flags / 非交互模式 | 增加参数解析（mri 已存在，可复用）           |
| 回滚     | 失败时缺乏清理策略            | 引入简易事务：记录已写文件，出错回滚删除     |
| 测试     | 缺单元 / 集成测试             | 对 planner.build 输出、模板渲染建立快照测试  |
| 模板数据 | 仅注入 `@config`            | 提供上下文 helper（例如 date、versions map） |
| 缓存     | 模板编译缓存未做失效策略      | 依据文件 mtime 或 hash 判定失效              |
| 日志     | 使用默认 pretty logger        | 分级 & 可选 JSON 输出（CI 友好）             |

## 11. 演进路线（架构层）

- 短期：补充测试层、拆分错误等级（expected/unexpected），加强 DSL 断言。
- 中期：插件化（注册新 DSL 操作 / 新模板集合）、支持多阶段生成（pre / generate / post）。
- 长期：远程模板拉取 + 缓存、增量更新（对现有项目 diff 并 apply）、可视化配置界面。
