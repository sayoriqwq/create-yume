# Create Yume 技术概览

> 这份文档描述的是当前仓库已经落地的实现，不引用历史计划口径。目标是让新贡献者能快速看懂 CLI 入口、模板渲染链路、测试覆盖面和已知边界。

## 1. 项目定位

`create-yume` 是一个基于 Effect 的脚手架 CLI，目前只支持两类前端项目模板：

- React
- Vue

当前主路径是“新建项目并生成完整初始文件”，不覆盖以下范围：

- Node 项目脚手架
- 远程模板
- 模板插件系统
- 对已有项目做增量更新

## 2. 主执行链路

CLI 入口在 [`apps/cli/src/index.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/index.ts)。

整体流程如下：

1. 解析 CLI 参数，构建 `CliContext`。
2. 如果缺少 `--preset` 或 `--name`，进入交互模式：
   - 显示欢迎信息
   - 通过 questions 流程收集配置
3. 如果同时提供了 `--preset` 和 `--name`，走非交互 preset 生成。
4. 生成 `ProjectConfig` 后展示配置摘要。
5. 调用 `generateProject` 进入 Orchestrator：
   - 注册 Handlebars helper
   - 注册 partial
   - 根据模板注册表构建 DSL
   - 由 planner 生成并执行计划
6. 调用 `finishProject` 执行生成后的命令，例如安装依赖或初始化 Git（是否执行由配置决定）。

## 3. 分层结构

```text
┌──────────────────────────────────────────────┐
│ CLI Entry / Questions                        │ 参数解析、交互提问、配置汇总
├──────────────────────────────────────────────┤
│ Orchestrator                                 │ 组织 helper / partial / registry / planner
├──────────────────────────────────────────────┤
│ Planner + DSL                                │ 把“要生成什么”描述成可执行计划
├──────────────────────────────────────────────┤
│ Template Engine                              │ Handlebars 运行时、helper 与 partial 注册
├──────────────────────────────────────────────┤
│ Fs / Command Services                        │ 文件系统与命令执行的 Effect Service 封装
├──────────────────────────────────────────────┤
│ Observability / Runtime Config               │ tracing、logger、并发配置
├──────────────────────────────────────────────┤
│ Effect Runtime / Layers                      │ 依赖注入、错误传播、资源生命周期
└──────────────────────────────────────────────┘
```

## 4. 核心模块

| 模块 | 位置 | 作用 |
| --- | --- | --- |
| CLI 入口 | [`apps/cli/src/index.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/index.ts) | 拼装 Layer、解析参数、启动主流程 |
| 问题收集 | [`apps/cli/src/core/questions/compose.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/questions/compose.ts) | 交互模式与 preset 模式统一产出 `ProjectConfig` |
| Orchestrator | [`apps/cli/src/core/services/orchestrator.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/orchestrator.ts) | 注册 helper/partial，组装 DSL，再调用 planner |
| Planner | [`apps/cli/src/core/services/planner.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/planner.ts) | 把 DSL 构建为计划并执行落盘 |
| Template Engine | [`apps/cli/src/core/services/template-engine.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/template-engine.ts) | 包装 Handlebars 渲染时环境 |
| Template Helpers | [`apps/cli/src/core/services/template-helpers.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/template-helpers.ts) | 当前只注册 `eq`、`or`、`withHash` |
| 模板注册表 | [`apps/cli/src/core/template-registry/`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/template-registry) | 决定哪些模板在什么条件下渲染到什么目标路径 |
| 组合修改器 | [`apps/cli/src/core/modifier/package-json.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/modifier/package-json.ts) | 生成并修改组合型文件，例如 `package.json` |

## 5. 模板系统现状

模板相关目录约定如下：

```text
apps/cli/templates
├── fragments/   # 可直接渲染的模板片段
├── partials/    # Handlebars partial
└── assets/      # 直接复制的静态资源
```

当前模板系统的几个关键点：

- registry 中记录的模板路径相对于 `apps/cli/templates/`。
- partial 按命名空间注册，当前有 `react`、`vue`、`global` 三类目录。
- 模板渲染时会把项目配置放到 `@config`。
- 当前没有接入 `handlebars-helpers` 第三方包，只使用仓库内手写 helper。
- Handlebars 原型访问默认关闭：`allowProtoPropertiesByDefault = false`、`allowProtoMethodsByDefault = false`。

## 6. DSL 与执行模型

当前 DSL 主要覆盖四类任务：

- `render`：渲染 `.hbs` 模板后写入目标文件
- `copy`：复制静态资源
- `json`：读取、合成并回写 JSON 文件
- `text`：读取、变换并回写文本文件

设计目的有两个：

- 把“生成什么”与“如何落盘”拆开，方便做 plan 级测试
- 把模板渲染、文件写入、命令执行统一放进 Effect 的错误与生命周期模型里

## 7. 运行时与配置

运行时配置定义在 [`apps/cli/src/config/app-config.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/config/app-config.ts)。

当前内建的运行时项包括：

- `LOG_LEVEL`
- `DEFAULT_CONCURRENCY`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `DEBUG`

其中 `DEFAULT_CONCURRENCY` 默认值是 `8`，用于控制部分并发文件操作。

## 8. 当前测试覆盖

当前 `apps/cli/tests/` 已有以下几类测试：

- planner snapshot：验证不同配置下的计划结构是否稳定
- template render snapshot：验证关键模板渲染输出
- planner rollback：验证生成失败后的回滚行为
- project config schema：验证配置 decode 合同
- test clock / support runtime：验证运行时测试基础设施
- generated project smoke：实际生成 React / Vue 项目，安装依赖并执行构建

另外还有：

- [`apps/cli/src/core/services/template-helpers.test.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/template-helpers.test.ts)：覆盖 `eq`、`or`、`withHash`
- [`apps/cli/src/core/services/template-engine.test.ts`](/Users/sayori/Desktop/create-yume/apps/cli/src/core/services/template-engine.test.ts)：覆盖模板引擎核心行为

最低验证要求以 [`docs/verification-matrix.md`](/Users/sayori/Desktop/create-yume/docs/verification-matrix.md) 为准。

## 9. 目录速览

```text
apps/cli
├── src
│   ├── brand/
│   ├── config/
│   ├── constants/
│   ├── core/
│   │   ├── adapters/
│   │   ├── commands/
│   │   ├── modifier/
│   │   ├── questions/
│   │   ├── services/
│   │   └── template-registry/
│   ├── schema/
│   ├── types/
│   ├── utils/
│   └── index.ts
├── templates/
├── tests/
└── dist/
```

## 10. 当前边界与注意事项

- Effect 是本项目的核心依赖；日常参考优先查看 `docs/effect/` 及其 `code-style/` 指南，涉及 freshness 或最新 API 核对时再 fetch 官方文档。

- 当前仓库只支持 React 和 Vue 两套 scaffold。
- CLI 构建产物固定为 `apps/cli/dist/index.js`，`apps/cli/package.json` 的 `main` 与 `bin.create-yume` 也都指向它。
- 模板引擎与 planner 属于高风险区域，修改后必须按验证矩阵做针对性验证。
- 历史 planning / review / legacy workflow 文档已在仓库清理中移除；当前应以根级 README、`docs/` 中保留的稳定文档，以及 `.gsd/` 中的项目事实/决策/需求为准。
