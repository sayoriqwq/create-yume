# Create Yume 清理与升级计划 · Lead

> 本次会话 **只输出文档，不改代码**。后续迭代按阶段独立提交。

## 背景

`apps/docs/status.md` 盘点出一组过时项与技术债。这份计划把扁平 checklist 按 **模块重新编组**、切成 **7 个可以独立提交的阶段**，阶段间有明确依赖顺序（清理 → 风格 → 依赖 → 功能 → 测试 → 文档）。

目标：不动整体架构，清掉沉淀的死代码/冗余、刷新依赖快照、补上非交互模式与最小测试基线。

## 阶段索引

| 阶段    | 名称                   | 风险 | 依赖        | Sub-doc                                  |
| ------- | ---------------------- | ---- | ----------- | ---------------------------------------- |
| Phase 0 | 准备 & 基线            | 无   | —           | [phase-0-baseline.md](./phase-0-baseline.md) |
| Phase 1 | 清理（零行为变更）     | 低   | Phase 0     | [phase-1-cleanup.md](./phase-1-cleanup.md)   |
| Phase 2 | 风格 & 正确性          | 低   | Phase 1     | [phase-2-style.md](./phase-2-style.md)       |
| Phase 3 | 依赖刷新               | 中   | Phase 1     | [phase-3-deps.md](./phase-3-deps.md)         |
| Phase 4 | 功能扩展               | 中   | Phase 1,2,3 | [phase-4-features.md](./phase-4-features.md) |
| Phase 5 | 测试基建               | 中   | Phase 1-4   | [phase-5-tests.md](./phase-5-tests.md)       |
| Phase 6 | 文档对齐               | 无   | Phase 1-5   | [phase-6-docs.md](./phase-6-docs.md)         |

## 模块速查（交叉视图）

| 模块                            | 涉及阶段        | 主要动作                              |
| ------------------------------- | --------------- | ------------------------------------- |
| `types/`                        | Phase 1         | 删 `NodeProjectConfig`、修可选语义    |
| `core/services/fs`              | Phase 1         | 去掉冗余 `provideService`             |
| `core/services/planner`         | Phase 1, 4      | 修 `finalize!` 断言；新增 rollback    |
| `core/services/template-engine` | Phase 1         | 删死 API `registerTemplates` + 缓存   |
| `core/services/compose`         | Phase 2         | `chdir` → `Command.workingDirectory`  |
| `core/services/command`         | —               | 无改动                                |
| `core/modifier/`                | Phase 3         | 版本号整表刷新                        |
| `core/questions/`               | Phase 4         | 接入 `mri` 非交互模式                 |
| `templates/partials/`           | Phase 2         | 全局 partial 移入 `global/` 子目录    |
| 根 `package.json`               | Phase 3         | `@antfu/eslint-config` 解锁、effect 升级 |
| `apps/cli/tsconfig.json`        | Phase 1         | path alias 精简                       |
| `apps/cli/tests/`               | Phase 5（新建） | planner / render snapshot             |
| docs (`README/overview/status`) | Phase 6         | 对齐清理后的状态                      |

## 端到端验证模板

每阶段结束执行：

```bash
cd apps/cli
pnpm build
node dist/index.js   # 走 preset react-app 与 preset vue-app 各一次
cd <generated>
pnpm install
pnpm build
```

Phase 5 之后额外：`pnpm test`。

最后一次（Phase 6 完成后）对比 Phase 0 留下的 preset 产物：**除依赖版本和 partial 路径外，其余应无 diff**。

## 关键复用点（贯穿所有阶段）

- `src/utils/file-helper.ts` 的 `when / scripts / deps / devDeps / mergeAt` —— Phase 3 刷版本时仍是主要 API
- `Data.TaggedError` 现有三类错误（`FileIOError / TemplateError / CommandError`）—— Phase 4 rollback 复用 `FileIOError`，不新增
- `Effect.forEach(..., { concurrency: DEFAULT_CONCURRENCY })` —— 新增并发点沿用

## 非目标

以下不纳入本计划，如需后续单独立项：

- 远程模板拉取 / 模板版本化
- 插件化 DSL 操作注册
- 对已有项目做增量 diff 更新
- 可视化配置界面
