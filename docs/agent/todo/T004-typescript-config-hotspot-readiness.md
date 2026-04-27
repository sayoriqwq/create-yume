# T004 TypeScript Config Hotspot Readiness

## 层级

架构层。

## 状态

观察中。不要在复杂度出现前提前重构。

## 背景

当前 TypeScript config 仍适合 fragment render，因为内容相对固定，主要由 frontend scaffold family 决定。未来如果 router、state management、workspace bootstrap 或其他 capability 需要共同修改 `compilerOptions`、`references`、`paths`、`types` 等字段，它会变成新的结构化热点文件。

## 目标

当 TypeScript config 真的成为热点文件时，将其接入 structured target contribution，而不是把复杂条件塞进模板。

## 非目标

- 不立即把现有 TypeScript config 模板改成 JSON mutation。
- 不提前设计完整 tsconfig DSL。
- 不为单一 owner 的固定配置增加抽象。

## 建议方向

1. 继续用 fragment render 处理当前固定 TypeScript config。
2. 一旦出现第二个 owner 贡献，再设计 TypeScript config helper。
3. helper 可以围绕 compiler options、include、references、paths、types 等稳定语义展开。
4. 底层仍复用 structured target contribution 与 same-path mutation merge。

## 触发条件

- 多个 owner 修改同一个 TypeScript config。
- 模板中出现大量 capability-specific 条件。
- 新能力需要向 TypeScript config 追加 paths、references 或 plugin 配置。

## 验证重点

- 现有 React/Vue TypeScript 输出保持稳定。
- TypeScript config contribution 能被 `PlanSpec` 解释。
- generated project smoke 能覆盖至少一个复杂 TypeScript config 组合。

