# Create Yume 基础建设评估（面向后续 Agent）

> 盘点日期：2026-04-21
>
> **状态**：本文件是**一次性评估快照**，不再作为执行指南。
> 可执行项已迁入 [docs/plan/infra-3-agent-contract.md](./plan/infra-3-agent-contract.md)。
> 新 agent 请从 [docs/plan/lead.md](./plan/lead.md) 进入。
>
> 已落地（对比评估时）：
> - docs 已迁到仓库根 `docs/`，根 `eslint.config.mjs` 已排除 docs（§5.1 D 部分完成）
> - vitest 已装并有首个测试（§5.3 B/C 雏形具备）
> - OTel tracing + pretty logger 已接入（§3 中提到的"可观察性合同"部分落地）
>
> 仍未落地：
> - `AGENTS.md` 未建（§5.1 A）
> - CLI 入口文件名曾经与文档和包配置存在漂移（§5.1 B）
> - 统一 `pnpm verify` 入口（§5.1 C）
> - `project-invariants.md` / `feature-matrix.md` / `verification-matrix.md` / `change-playbook.md`（§5.2）
> - planner / template render snapshot + smoke test（§5.3）
> - ADR 体系（§5.4 A）
>
> 下文保留作为背景阅读。

---


## 1. 结论

当前仓库已经具备一层不错的工程骨架，但还没有形成一套对 agent 足够友好的“执行合同”。

现状更接近：

- **工程基础已具备**
- **局部约束已存在**
- **长期参考物不足**
- **文档与实际状态开始漂移**

如果目标是让后续 agent 更稳定地执行、减少误判和返工，那么下一步最值得投入的不是继续堆更多散文式说明，而是把“什么是事实、什么必须验证、什么不能碰、什么已经不支持”这些内容固化为仓库内的稳定合同。

## 2. 当前已有的基础

### 2.1 工程骨架

仓库已经具备比较完整的工程设施：

- `pnpm workspace` + `turbo`
- `husky`
- `commitlint`
- `changesets`
- 严格 TypeScript 配置
- 基于 Effect 的分层实现

这些内容已经能支持人类开发者正常协作，也为 agent 提供了基本的执行环境。

### 2.2 现有文档资产

目前外层 `docs/` 下已经有几类重要文档：

- [overview.md](./overview.md)：架构总览
- [status.md](./status.md)：现状盘点
- [plan/lead.md](./plan/lead.md) 及各 phase 文档：后续工作拆分
- [pnpm-monorepo.md](./pnpm-monorepo.md)：workspace 约定
- [handlebars-helpers.md](./handlebars-helpers.md)：模板 helper 参考

从“信息量”看，文档并不算少。

### 2.3 现有质量门

基于一次实际核验，当前项目的质量门状态如下：

- `pnpm build`：通过
- `pnpm --filter create-yume typecheck`：通过
- `pnpm --filter create-yume test`：通过
- `pnpm lint .`：失败

这说明仓库不是没有验证手段，而是验证手段还没有被整理成 agent 可稳定依赖的统一入口。

## 3. 当前关键问题

下面这些问题，是“后续 agent 容易偏航”的主要来源。

### 3.1 缺少 repo-local 的执行合同

当前仓库内没有一份提交到项目本身的、专门面向 agent 的本地约束文档，例如 repo-local `AGENTS.md`。

这意味着很多约束依赖会话上下文、个人记忆或外部注入，而不是仓库自带事实。换一个 agent、换一个入口、换一个会话，这些约束很容易丢失。

这是当前最核心的缺口。

### 3.2 文档和真实状态已经出现漂移

仓库里已经出现“文档能看，但不再可信”的迹象。

典型例子：

- 多处文档与包配置曾经与实际入口不一致
- 入口合同现已统一为 `dist/index.js`

类似漂移一旦出现，agent 往往会沿着错误入口继续实现、验证和发布，直到最后一步才暴露问题。

### 3.3 现状文档更像快照，不像事实源

`status.md` 里有一些判断已经不再准确，例如：

- 声称没有测试
- 声称没有 `node_modules`

这类文档适合做“某次盘点快照”，但不适合继续被 agent 当成当前事实源。

### 3.4 质量门存在，但没有被组织成统一合同

现在仓库里有 `build`、`lint`、`typecheck`、`test` 等动作，但没有统一的“本次改动至少要跑什么”的入口。

对 agent 来说，这会带来两个问题：

- 不知道什么验证是最低要求
- 不知道某类修改应该追加什么专项验证

结果通常是要么漏跑，要么乱跑。

### 3.5 lint 范围过宽，容易把非目标噪音带进来

当前根级 lint 会扫到计划文档，并且这轮实际就被 `docs/plan/*.md` 卡住了。

这会让 agent 在处理源码任务时被文档格式问题打断，增加无关修复和误提交概率。

### 3.6 提交协议没有完全落成可执行规则

仓库对提交信息已经有一层约束，但仍然偏弱：

- `commitlint` 主要校验 conventional commit header
- 还没有把 Lore 协议里的 trailer 结构转成真正可执行的门禁

这意味着“要求存在”与“机器能拦”之间仍有落差。

### 3.7 可复用参考物不足

对 agent 来说，最有价值的参考物通常不是长篇文档，而是：

- golden fixtures
- snapshot
- smoke test
- feature matrix
- change playbook

当前仓库已有架构说明和阶段计划，但这类“可执行参考物”还比较少。

## 4. 现状评价

如果把“是否利于后续 agent 稳定执行”作为标准，当前状态可以概括为：

- **结构层面**：7/10
- **文档层面**：6/10
- **约束闭环**：5/10
- **agent 友好度**：5/10

理由不是基础设施太少，而是这些基础设施还没有被收束为一套明确、稳定、可验证、可继承的仓库内合同。

## 5. 补强方向

建议按优先级分四层推进。

### 5.1 P0：先补“硬合同”

这是最值得优先做的一层。

#### A. 增加 repo-local `AGENTS.md`

建议在仓库根增加一份项目自己的 `AGENTS.md`，只写 repo-specific 事实，不写泛化话术。

建议至少覆盖：

- 当前支持的项目类型
- 当前明确不支持的范围
- 允许修改的主要区域
- 高风险区域
- 常见任务的最小验证集合
- CLI 入口与构建产物约定
- 模板目录与注册表约定
- 提交信息要求

这样后续 agent 不需要从零猜测“这个仓库默认怎么做事”。

#### B. 统一入口合同

需要统一这些事实：

- 构建产物名称
- `bin` 入口
- README 运行示例
- 计划文档中的示例命令
- 包配置中的 `main`

只要这些信息还存在分叉，agent 就会不断被误导。

#### C. 增加统一验证入口

建议增加根脚本，例如：

```json
{
  "scripts": {
    "verify": "pnpm build && pnpm --filter create-yume typecheck && pnpm --filter create-yume test && pnpm lint ."
  }
}
```

如果后续认为 lint 不该覆盖全部文档，也可以拆成更清晰的版本：

- `verify`
- `verify:code`
- `verify:docs`

核心原则是：让 agent 不需要猜。

#### D. 拆分 lint 作用域

建议明确区分：

- 源码 lint
- 文档 lint
- 计划文档 lint

不要让计划草稿、历史盘点、源码质量门共享同一条最严格路径。

### 5.2 P1：补“事实源文档”

这层是为了让 agent 拿到稳定、短小、可信的背景知识。

建议新增这些文档：

#### A. `docs/project-invariants.md`

记录项目的稳定事实与不可轻易破坏的约束，例如：

- CLI 主执行流水线
- 主要分层边界
- planner / orchestrator / template engine 的职责边界
- 当前模板注册的稳定入口
- 错误模型约束

这份文档的目标不是讲背景，而是声明“哪些东西改了就会影响全局行为”。

#### B. `docs/feature-matrix.md`

把支持情况列成矩阵，而不是散落在正文里。

建议维度包括：

- 项目类型
- preset
- create 模式
- router 选项
- state management 选项
- CSS / build tool 选项
- 已支持 / 部分支持 / 未支持

这样像 `NodeProjectConfig` 这种“类型声明存在但能力未落地”的情况会更容易被发现。

#### C. `docs/verification-matrix.md`

这份文档非常适合 agent 使用。

建议写成“改哪里，至少跑什么”：

- 改模板片段：跑模板 render snapshot
- 改 registry：跑 planner snapshot
- 改 CLI 入口：跑 smoke test
- 改 package modifier：跑生成产物 diff
- 改文档：跑 docs lint 或链接检查

这样后续 agent 执行时会少很多自由发挥。

#### D. `docs/change-playbook.md`

这份文档回答的是：

- 新增一个框架要改哪里
- 新增一个 preset 要改哪里
- 修改模板 helper 要改哪里
- 修改 package 生成逻辑要改哪里
- 修改问题收集流程要改哪里

比起阅读整套源码，agent 更适合先读一份 change playbook。

### 5.3 P2：补“可执行参考物”

这层对 agent 的约束力，通常比普通文档更强。

#### A. golden fixtures

建议把几组核心 preset 的产物稳定下来，作为 golden fixtures 或 baseline 参考。

例如：

- `react-app`
- `vue-app`
- 典型 `create` 模式组合

后续修改模板、modifier、planner 时，可以直接对比输出变化，而不是只靠人脑判断。

#### B. planner snapshot

这类测试特别重要，因为 planner 接近“系统生成意图的合同层”。

只要 planner 输出变了，就应该有明确 diff。

#### C. template render snapshot

模板渲染类 snapshot 能很好约束细粒度改动，尤其适合未来 agent 修改 `.hbs` 模板时使用。

#### D. 打包后 smoke test

建议固定至少一条端到端最小路径：

1. build CLI
2. 运行一个 preset
3. 检查关键输出文件存在
4. 检查生成项目可安装 / 可构建

没有这条路径，agent 很容易只验证“源码能编译”，却没验证“工具真的能用”。

### 5.4 P3：补“长期记忆和决策记录”

这层优先级没前面高，但长期收益很大。

#### A. ADR（架构决策记录）

建议给关键选择建立 ADR，例如：

- 为什么选 Effect
- 为什么 planner 分 build / apply
- 为什么采用模板注册表
- 为什么选择 Handlebars
- 为什么保留某些严格 TS 规则

这会显著降低后续 agent 重复探索旧问题的概率。

#### B. `.omx/` 项目记忆

可以给 `.omx/` 补最小项目记忆，不必很重，但要稳定。

适合存放：

- 长期不变的项目事实
- 当前明确待办但未落地的边界
- 已决定不做的方向

不适合把一次性运行日志当成长期知识。

## 6. 推荐新增文档清单

如果只从“让 agent 更有约束和参考点”这个目标出发，建议优先补下面这些文档。

### 第一批

- `AGENTS.md`
- `docs/project-invariants.md`
- `docs/feature-matrix.md`
- `docs/verification-matrix.md`
- `docs/change-playbook.md`

### 第二批

- `docs/decisions/adr-001-runtime-and-architecture.md`
- `docs/decisions/adr-002-template-registry.md`
- `docs/decisions/adr-003-build-output-contract.md`

### 第三批

- `docs/release-checklist.md`
- `docs/agent-task-recipes.md`

其中第一批的收益最高。

## 7. 对未来 agent 最有帮助的“约束类型”

不是所有文档都同样有用。对 agent 来说，价值从高到低通常是：

1. **机器可执行约束**：脚本、测试、lint、CI
2. **稳定事实文档**：invariants、matrix、playbook
3. **决策记录**：ADR
4. **背景介绍文档**：overview、history、status

所以后续新增文档时，建议优先写：

- 能约束行为的
- 能减少误判的
- 能回答“改这里会影响哪里”的

而不是继续堆背景说明。

## 8. 一个务实的推进顺序

如果只做最有价值的一轮，可以按下面顺序推进：

1. 修正构建入口与文档漂移
2. 提交 repo-local `AGENTS.md`
3. 增加 `pnpm verify`
4. 拆分 lint 作用域
5. 增加 `project-invariants.md`
6. 增加 `verification-matrix.md`
7. 补 planner / template snapshot
8. 补 smoke test

这个顺序的好处是：先减少误导，再补约束，再补自动化验证。

## 9. 最终判断

当前项目不是“没有基础建设”，而是“基础建设正在从人类开发者友好，走向 agent 友好”的中间状态。

真正需要补的不是更多零散文档，而是：

- 仓库内的本地执行合同
- 稳定事实源
- 针对修改类型的验证矩阵
- 可执行的 golden 参考物

只要这四层补起来，后续 agent 的约束感会明显增强，执行路径也会稳定很多。
