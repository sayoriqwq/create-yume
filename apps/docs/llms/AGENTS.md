## Effect LLM Docs Loading Strategy

适用范围：当前目录下的 `llms.txt`、`llms-small.txt`、`llms-full.txt`。

这些文件的主要用途不是给人类做页面导航，而是给 agent 在 CLI 项目中执行任务时提供决策支持。
目标是让 agent 在进行重构、优化、排错、新功能设计时，能以最小必要加载获得足够上下文，并在必要时升级到更高精度的文档层。

### 文件职责

- `llms.txt`
  - 任务路由层。
  - 用于识别主题域、定位相关章节、缩小加载范围。
  - 不作为主要正文来源。

- `llms-small.txt`
  - 默认工作语料。
  - 用于形成方案、选择路线、识别约束、输出实现建议。
  - 默认优先于 `llms-full.txt`。

- `llms-full.txt`
  - 精确校准层。
  - 仅在需要确认 API 细节、完整示例、原始结构、代码块边界时加载。
  - 不要作为默认入口。

### 默认加载原则

1. 先读 `llms.txt` 做任务路由。
2. 再按任务类型只读取 `llms-small.txt` 的相关主题簇。
3. 仅在实现前校准或 `small` 信息不足时，升级读取 `llms-full.txt` 的对应页。

除非任务明确要求全量研究，否则不要一次性加载 `llms-full.txt`。

### Workflow: Refactor / Cleanup / Deslop

目标：修正结构边界、减少复杂度、收拢依赖、改善组合方式，而不是先堆新抽象。

默认读取：

- `Guidelines`
- `Why Effect?`
- `The Effect Type`
- `Building Pipelines`
- `Using Generators`
- `Managing Services`
- `Managing Layers`
- `Scope`

重点判断：

- 问题是控制流过深，还是依赖边界泄漏
- 应该改成 pipeline / `Effect.gen`，还是下沉到 `Layer`
- 资源获取与释放是否应该显式建模到 `Scope`

升级到 `llms-full.txt` 的条件：

- 需要对照完整示例重写代码
- 需要确认某个 API 写法是否改变语义
- 需要保留原始代码块与段落结构做高精度改造

### Workflow: Performance / Concurrency Optimization

目标：识别性能瓶颈是在并发模型、重复执行、缓存策略、调度策略，还是资源复用层。

默认读取：

- `Introduction to Runtime`
- `Basic Concurrency`
- `Fibers`
- `Cache`
- `Caching Effects`
- `Layer Memoization`
- 视情况补充 `Queue` / `PubSub` / `Semaphore` / `Stream`

重点判断：

- 是否存在不必要的重复 Effect 执行
- 是否需要缓存、批处理、限流、背压或结构化并发
- 是否应该引入更明确的运行时与并发边界

升级到 `llms-full.txt` 的条件：

- 需要核对并发原语或缓存 API 的精确用法
- 需要从完整示例中确认组合方式与失败语义

### Workflow: New Feature / Capability Design

目标：为新功能选对构造方式、边界形式和工程约束，而不是只补出一段能跑的代码。

默认读取：

- `Introduction`
- `Creating Effects`
- `Running Effects`
- `Building Pipelines`
- `Using Generators`
- `Managing Services`
- `Managing Layers`
- `Schema` 相关页面
- `Platform` 相关页面
- `Logging` / `Tracing` 相关页面

重点判断：

- 功能应建模为普通 `Effect`、服务、`Layer`、`Schema` 驱动流程，还是平台能力封装
- 错误通道、依赖注入、资源生命周期、可观测性是否应在首版就设计进去

升级到 `llms-full.txt` 的条件：

- 需要高精度 API/示例来落地实现
- 需要确认 `Schema`、`Platform`、`Layer` 等复杂模块的边界细节

### Workflow: Debug / Failure Analysis

目标：定位失败属于业务失败、缺陷、资源释放问题、并发中断传播问题，还是恢复策略错误。

默认读取：

- `Two Types of Errors`
- `Expected Errors`
- `Unexpected Errors`
- `Fallback`
- `Retrying`
- `Sandboxing`
- `Cause`
- `Exit`
- `Logging`
- `Tracing in Effect`

重点判断：

- 当前错误是否应该进入错误通道而不是 defect
- 是否需要重试、降级、超时、熔断或更细的失败建模
- 是否缺乏可观测性导致问题难以复现

升级到 `llms-full.txt` 的条件：

- 需要核对恢复模式、错误组合、`Cause` 结构、运行行为细节

### Agent Execution Contract

agent 在这个目录中工作时，应把三份文件视为三层决策介质：

- `llms.txt`：任务分类器
- `llms-small.txt`：策略生成器
- `llms-full.txt`：执行校准器

输出应优先包含：

- 推荐路线
- 关键约束
- 风险点
- 是否需要升级到 `llms-full.txt`
- 实施前需要验证的 API 或模式

不要把这里的文档使用方式理解成“先读完整文档再回答”。
正确做法是：先路由，再按任务类型最小化加载，再在必要时精确升级。
