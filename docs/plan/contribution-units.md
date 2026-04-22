# 当前阶段架构计划 - Contribution Units

> 本文定义 owner 可以使用的 contribution unit。owner contract 只能组合这些 unit，不能临时发明新类型。

## 原则

- 贡献单位必须能映射回现有实现。
- 贡献单位必须能被验证和追溯。
- 同一路径的贡献必须受 planner path guard 保护。

## Unit 1: Fragment Render

**定义**

- 渲染一个模板片段到一个目标文件。

**当前实现映射**

- `dsl.render(...)`
- template registry 条目
- `TemplateEngineService.render(...)`

**适用场景**

- `App.tsx`
- `router.ts`
- `README.md`
- 其他 `.hbs` 产物

**约束**

- 必须声明 target path。
- 必须声明来自哪个 owner。
- 不允许静默覆盖另一个 owner 的 target path。

## Unit 2: Partial Namespace

**定义**

- 为模板运行时声明一组 partial 及其 namespace。

**当前实现映射**

- `collectPartialEntries(...)`
- `TemplateEngineService.registerPartials(...)`

**适用场景**

- `react/*`
- `vue/*`
- `global/*`

**约束**

- namespace 必须唯一。
- owner 只能声明自己需要的 namespace，不直接接管 runtime 全局约定。
- partial discovery 规则必须先在计划里固定，再允许 owner 使用。

## Unit 3: JSON/Text Mutation

**定义**

- 对已有或 base 文件做结构化变换。

**当前实现映射**

- `dsl.json(...)`
- `dsl.text(...)`
- `buildPackageJson(...)`

**适用场景**

- `package.json`
- 未来的文本配置文件和 JSON 配置文件

**约束**

- 必须声明目标文件。
- 必须声明 reducer/transform 的责任范围。
- 同一路径的多个 mutation 只能在 planner 明确允许时组合。

## Unit 4: Static Asset Copy

**定义**

- 复制静态资产到目标路径。

**当前实现映射**

- `dsl.copy(...)`
- planner `copy` task

**适用场景**

- 根级静态资源
- 未来 family/workspace 的固定资产文件

**当前阶段说明**

- 该 unit 被纳入模型，但不作为 `router` pilot 的主要证明面。

## Unit 5: Post-Generate Command

**定义**

- 在 plan apply 完成后执行的初始化命令。

**当前实现映射**

- `buildCommands(...)`
- `finishProject(...)`
- `CommandService.execute(...)`

**适用场景**

- `pnpm install`
- `git init`
- husky / commit hook setup

**约束**

- 必须声明所属 owner。
- 必须声明执行时机在 plan apply 之后。
- 不能把 family-specific 语义塞进 unrelated bootstrap command。

## 组合规则

1. 一个 owner 可以发出多个 contribution units。
2. 一个 contribution unit 只能有一个明确 owner。
3. 同一路径冲突必须被 planner path guard 拦截或串行化。
4. `Partial Namespace` 是模板准备单元，不等于文件落盘单元。
5. `Post-Generate Command` 不能替代 JSON/Text Mutation。

## 追溯要求

每个 owner 在计划文档里都必须写明：

- 输入字段
- 发出的 contribution units
- 影响的文件/路径
- 影响的 `package.json` 变更
- 影响的 post-generate commands
- 预期的验证证据

## 当前阶段非目标

- 插件式 unit 注册。
- 在 pilot 阶段新增第六种 contribution unit。
