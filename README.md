# Create Yume CLI

> 用于创建 React 与 Vue 项目的现代前端脚手架。

Create Yume 是一个面向前端项目初始化的 CLI。

如果你第一次来到这个仓库，先记住两件事：

1. 当前只支持 React 和 Vue 项目脚手架。
2. 根 README 是用户入口；内部实现与执行约束请进入执行文档路线图。

## 这是什么

Create Yume 用来帮助你快速生成一个新的前端项目骨架，并带上仓库当前采用的基础工程约定。

它适合的场景是：

- 想快速开始一个 React 项目
- 想快速开始一个 Vue 项目
- 想基于现有模板和工程约定继续开发

## 当前支持范围

- React 项目脚手架
- Vue 项目脚手架

## 当前不支持的范围

- Node 项目脚手架
- 远程模板
- 插件化模板来源
- 对已有项目做增量式改造

## 快速开始

### 安装依赖并构建

```bash
git clone <repository-url>
cd create-yume
pnpm install
pnpm build
```

### 运行 CLI

```bash
# 交互模式
node apps/cli/dist/index.js

# 非交互 preset 模式
node apps/cli/dist/index.js --preset react-app --name my-app --yes --install

# 失败时保留现场，方便排错
node apps/cli/dist/index.js --preset vue-app --name my-app --yes --no-rollback
```

### 可选：建立全局链接

```bash
pnpm link
create-yume
```

## 常用仓库命令

```bash
# 查看整个 workspace 的过时依赖
pnpm outdated

# 按现有 semver 范围更新整个 workspace
pnpm deps

# 升级整个 workspace 到最新版本范围
pnpm deps:latest

# 运行完整验证
pnpm verify
```

## 文档入口

### 从根级路线图开始

- [仓库文档路线图](./roadmap.md)

### 用户文档

如果你的目标是使用项目、理解支持范围或按约定协作，请从这里开始：

- [用户文档路线图](./docs/user/roadmap.md)
- [系统总架构](./docs/user/system-architecture.md)
- [pnpm Monorepo 约定](./docs/user/pnpm-monorepo.md)
- [提交与协作说明](./docs/user/contributing.md)

### 执行与维护文档

如果你的目标是修改脚手架实现、模板系统或验证策略，请从这里开始：

- [执行文档路线图](./docs/agent/roadmap.md)
- [文档编写范式](./docs/agent/documentation-style-guide.md)
- [验证矩阵](./docs/agent/verification-matrix.md)
- [Handlebars Helper 说明](./docs/agent/handlebars-helpers.md)
- [Effect 参考路线图](./docs/agent/effect/roadmap.md)

## 提交流程

仓库已集成 `lobe-commit`、`husky` 和 `commitlint`。

```bash
# 首次配置提交助手
pnpm commit:config

# 交互式生成提交信息
pnpm commit

# 或继续使用 git commit
git commit
```

如果你准备修改代码或模板，提交前建议执行：

```bash
pnpm verify
```

## 致谢

- [Effect](https://effect.website/)
- [@clack/prompts](https://github.com/natemoo-re/clack)
- [create-better-t-stack](https://github.com/AmanVarshney01/create-better-t-stack)
- [Create Hana](https://github.com/hanaboso/create-hana)
