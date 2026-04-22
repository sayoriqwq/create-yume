# Effect Review - Architecture Analysis

## Summary

现有三条 review 方向并不冲突，而是在描述同一个事实的不同层次。`lead.md` 认为当前 Effect 用法总体健康、问题主要是增量优化而非重写；`modernization.md` 聚焦服务边界和 runtime 装配清理；`architecture-philosophy.md` 则进一步指出，真正的架构问题是“按执行阶段拆分”导致设计决策没有单点归属。`docs/review/effect/lead.md:19-32`, `docs/review/effect/modernization.md:5-27`, `docs/review/effect/architecture-philosophy.md:15-20`

我的结论是：当前 CLI 的主流程是可工作的，测试也证明了这一点，但它的稳定更多来自“当前支持面很窄且组合受控”，而不是来自架构本身已经把复杂度压进深模块。下一阶段应该优先重切“决策所有权”，而不是继续做零散的 stage-local cleanup。`apps/cli/src/index.ts:110-125`, `apps/cli/tests/generated-projects.smoke.ts:30-90`

## Analysis

现有 review 的第一条主线是“Effect 使用总体没偏航”。这点成立：入口使用 `NodeRuntime.runMain`，主要能力通过 `Effect.Service` 暴露，CLI 上下文保留在 `Context.GenericTag`，planner 的 rollback 也建立在 `Effect.scoped` 和 finalizer 之上。`docs/review/effect/lead.md:19-29`, `apps/cli/src/index.ts:123-128`, `apps/cli/src/core/cli-context.ts:9-12`, `apps/cli/src/core/services/planner.ts:359-378`

第二条主线是“局部边界不够深”，其中 `CommandService` 是最明确的例子。它名义上是服务，但 `execute` 仍然把 `CommandExecutor` 暴露给调用方，因此消费者仍然知道平台执行器存在，这说明 abstraction 已经建了，但依赖并未真正被吸收。这个判断与 `modernization.md` 和 `findings.md` 一致。`docs/review/effect/modernization.md:5-27`, `docs/review/effect/findings.md:18-59`, `apps/cli/src/core/services/command.ts:9-12`, `apps/cli/src/core/services/command.ts:23-52`

第三条主线才是根因层：系统的主要分解方式是按执行顺序，而不是按设计决策。入口主链路严格按 `questions -> generateProject -> finishProject` 串起，`core/services/compose.ts` 中的几个函数也主要承担转发和编排，而不是隐藏某个稳定决策域。`docs/review/effect/architecture-philosophy.md:178-200`, `apps/cli/src/index.ts:117-120`, `apps/cli/src/core/services/compose.ts:22-36`, `apps/cli/src/core/services/compose.ts:49-94`

这个 stage-oriented 结构直接带来了决策泄漏。以 `router` / `stateManagement` 为例，同一个业务决策同时散落在 schema、question flow、template registry、`package.json` 组合逻辑里：schema 先把它们塞进看似共享的 `BaseFrontendAppConfig`，再在 React/Vue 具体 schema 中收窄；questions 再根据项目类型分别采集；registry 决定渲染哪些文件；`package-json.ts` 决定依赖。任何一个能力扩展都需要横跨这些位置同步修改。`apps/cli/src/schema/project-config.ts:54-60`, `apps/cli/src/schema/project-config.ts:72-80`, `apps/cli/src/schema/project-config.ts:92-106`, `apps/cli/src/core/questions/compose.ts:99-126`, `apps/cli/src/core/template-registry/react.ts:14-48`, `apps/cli/src/core/template-registry/vue.ts:26-48`, `apps/cli/src/core/modifier/package-json.ts:45-63`

`codeQuality` / `git` 也是同样的问题。questions 决定是否采集 code quality，`package-json.ts` 增加依赖与 scripts，`core/commands/index.ts` 再拼出 husky / commit hook 的具体 shell 命令。这里没有一个“代码质量引导策略”的单一 owner，只有跨阶段知识链。`apps/cli/src/core/questions/compose.ts:73-79`, `apps/cli/src/core/modifier/package-json.ts:29-33`, `apps/cli/src/core/commands/index.ts:17-57`

模板系统方向是“有深度，但还没完全吃掉复杂度”。`TemplateEngineService` 已经把 Handlebars runtime、安全默认值、helpers、partials 和 render/compile 边界集中起来，这部分是正向的；但 orchestrator 仍然需要自己解析模板根目录、手工收集 partial namespace，再逐个注册，这意味着 partial layout 约定没有真正被模板层吸收。`apps/cli/src/core/services/template-engine.ts:31-111`, `apps/cli/src/core/services/orchestrator.ts:33-47`

Planner 也是类似情况。它已经把 DSL 构建、PlanSpec 投影和 rollback 做成了较强的边界，测试也覆盖了 snapshot 与 failure rollback；但执行阶段仍然只按 task kind 分组并发，而没有显式校验 target path ownership。这在当前 feature 集合下没出问题，是因为 `package.json` 等关键路径暂时只有单一 builder 负责，而不是因为 planner 自身定义了安全约束。`apps/cli/src/core/services/planner.ts:84-139`, `apps/cli/src/core/services/planner.ts:161-253`, `apps/cli/src/core/services/planner.ts:471-496`, `apps/cli/src/schema/plan-spec.ts:26-92`, `apps/cli/tests/planner.spec.ts:33-56`, `apps/cli/tests/planner-rollback.test.ts:12-160`

## Root Cause

根因不是 “Effect 用错了”，而是 “设计决策没有 owner”。当前系统把知识主要分散在输入采集、模板注册、包配置修改、命令构建、orchestrator 编排这些阶段模块里，所以复杂度是横向扩散的。`docs/review/effect/architecture-philosophy.md:260-284`, `apps/cli/src/core/questions/compose.ts:69-190`, `apps/cli/src/core/modifier/package-json.ts:23-66`, `apps/cli/src/core/commands/index.ts:10-59`, `apps/cli/src/core/services/orchestrator.ts:38-64`

## Recommendations

1. 以“能力/决策 owner”而不是“执行阶段”重切架构。优先抽出最容易放大变更面的能力域：`router`、`stateManagement`、`codeQuality`。每个 owner 同时负责 questions、template contributions、JSON/text mutations、post-generate actions。高投入，高收益。`apps/cli/src/core/questions/compose.ts:99-126`, `apps/cli/src/core/template-registry/react.ts:14-48`, `apps/cli/src/core/modifier/package-json.ts:45-63`, `apps/cli/src/core/commands/index.ts:21-52`
2. 缩小真正共享的 config surface。`BaseFrontendAppConfig` 不应该直接承载 React string union 和 Vue boolean 语义混杂的 `router` / `stateManagement`；共享层只保留语义一致字段，其余放回 framework-specific config，再派生粗粒度 capability。中投入，高收益。`apps/cli/src/schema/project-config.ts:54-60`, `apps/cli/src/schema/project-config.ts:72-80`, `apps/cli/src/schema/project-config.ts:92-106`, `apps/cli/src/core/template-registry/frontend-app.ts:5-80`
3. 让模板环境准备成为更深的模块。把 template root、partial discovery、namespace convention 吃进 template catalog/runtime preparer，orchestrator 只表达“按这个 config 准备模板环境”。中投入，中高收益。`apps/cli/src/core/services/orchestrator.ts:33-47`, `apps/cli/src/core/services/template-engine.ts:17-29`, `apps/cli/src/core/services/template-engine.ts:54-78`
4. 在 planner 中显式建立 path ownership guardrail。至少在 build 或 apply 前检测重复 target path，对同一路径的 mutation 串行化，只对独立路径保留并发。中投入，中收益。`apps/cli/src/core/services/planner.ts:161-253`, `apps/cli/src/core/services/planner.ts:471-496`
5. 把 `CommandService` 先修成真正的服务边界，再考虑抽 `AppLayer` / runtime builder。前者是架构债，后者主要是可读性债；顺序不应颠倒。低到中投入，中收益。`apps/cli/src/core/services/command.ts:9-12`, `apps/cli/src/core/services/command.ts:23-52`, `apps/cli/src/index.ts:55-80`

## Trade-offs

| Option | Pros | Cons |
|--------|------|------|
| 继续保持 stage-oriented 结构，只做 `CommandService`、`runSync`、`dieMessage` 之类的局部修补 | 改动小，风险低，短期见效快 | 根因不动，新增 scaffold 能力时仍会继续横向扩散 |
| 按 capability owner 做渐进式重切，只先处理 `router` / `stateManagement` / `codeQuality` | 直接降低 change amplification，保留现有主链路与测试资产 | 需要先定义 contribution contract，短期内会有迁移成本 |
| 直接全面重写为插件化模板/feature system | 最彻底地统一 owner model | 当前仓库只支持 React/Vue，两套 scaffold 还不足以证明需要这么重的机制，容易过度设计 |

## Consensus Addendum

- **Antithesis (steelman):** 现有仓库只支持 React 和 Vue 两套脚手架，stage-oriented 结构让主流程非常直观，`generated-projects.smoke.ts` 也说明端到端质量并未失控；过早引入 capability owner 体系可能把一个小 CLI 变成“为扩展而扩展”的框架。`apps/cli/tests/generated-projects.smoke.ts:17-90`
- **Tradeoff tension:** 更深的模块能降低未来扩展成本，但也会提高当前抽象成本；如果 owner 划分过细，会把“简单脚手架”变成“伪插件系统”。
- **Synthesis (if viable):** 不做插件化重写，只做两步渐进式架构收敛。第一步先收敛 config 语义和服务边界，把 `router` / `stateManagement` 从假共享模型中抽出去，并让 `CommandService` 真正闭包平台依赖；第二步只对重复最严重的能力域建立 contributor/owner 机制，保留现有 planner、template engine、rollback 这些已经健康的深模块。`apps/cli/src/schema/project-config.ts:72-80`, `apps/cli/src/core/services/command.ts:9-12`, `apps/cli/src/core/services/planner.ts:327-378`

## References

- `docs/review/effect/lead.md:19-32` - 当前 Effect 使用总体健康，问题主要是架构性的
- `docs/review/effect/modernization.md:5-27` - `CommandService` 边界应该继续加深
- `docs/review/effect/modernization.md:56-76` - `AppLayer`/runtime builder 属于可读性优化，不是第一优先级
- `docs/review/effect/architecture-philosophy.md:15-20` - 现有主要问题是按阶段拆分导致决策泄漏
- `apps/cli/src/index.ts:110-125` - 主流程按 questions/generate/finish 串联
- `apps/cli/src/core/services/compose.ts:22-36` - `buildTemplates` 更像 forwarding than ownership
- `apps/cli/src/core/services/orchestrator.ts:33-64` - orchestrator 仍显式掌握模板目录、partials、package 组合等细节
- `apps/cli/src/schema/project-config.ts:54-60` - `router` / `stateManagement` 以混合语义进入共享 schema
- `apps/cli/src/schema/project-config.ts:72-80` - 假共享字段被放入 `BaseFrontendAppConfig`
- `apps/cli/src/schema/project-config.ts:92-106` - React/Vue schema 再次收窄同一批字段
- `apps/cli/src/core/questions/compose.ts:99-126` - framework-specific 决策在 question 层重复分发
- `apps/cli/src/core/template-registry/react.ts:14-48` - React registry 基于 router/state 决定文件产物
- `apps/cli/src/core/template-registry/vue.ts:26-48` - Vue registry 基于 router/state 决定文件产物
- `apps/cli/src/core/modifier/package-json.ts:45-63` - 依赖组合再次承载同样决策
- `apps/cli/src/core/commands/index.ts:17-57` - git/codeQuality bootstrap 继续重复这些决策
- `apps/cli/src/core/services/command.ts:9-12` - `CommandService` 仍泄漏平台 requirement
- `apps/cli/src/core/services/template-engine.ts:31-111` - 模板引擎本身是值得保留的深模块
- `apps/cli/src/core/services/planner.ts:84-139` - `PlanSpec` 投影是有效边界
- `apps/cli/src/core/services/planner.ts:471-496` - planner apply 仍只按 task kind 分组
- `apps/cli/tests/planner.spec.ts:33-56` - 当前 planner 有稳定 snapshot 保护
- `apps/cli/tests/planner-rollback.test.ts:12-160` - rollback 语义已有测试锁定
