# Create Yume CLI - 基于 Effect 的现代化项目脚手架工具

> 现代 TypeScript + Effect 函数式编程实践的项目脚手架

## 📋 项目概述

Create Yume 是一个基于 Effect 函数式编程框架的现代化 CLI 工具，
用于快速搭建 React 与 Vue 前端项目。
该项目展示了如何使用严格的类型安全、函数式编程范式和分层架构设计，
来构建可维护、可扩展的命令行应用程序。

## ✨ 主要特性

- 🎯 **Effect 函数式架构** - 统一的异步操作和错误处理
- 🔒 **严格类型安全** - 编译时错误检查，运行时类型保证
- 🧩 **依赖注入系统** - 松耦合架构，易于测试和扩展
- 🎨 **现代化 UI** - 基于 @clack/prompts 的美观交互界面
- 📦 **多项目类型支持** - React、Vue 项目模板
- 🛠 **开发体验优化** - 热重载、零配置构建
- 🧱 **可组合文件机制** - 通过函数式 modifier 组合生成 package.json 等动态文件

## 🚀 快速开始

### 安装和构建

```bash
# 克隆项目
git clone <repository-url>
cd create-yume

# 先安装依赖；未安装时构建、测试和 CLI 运行都不会通过
pnpm install

# 查看整个 workspace 的过时依赖
pnpm outdated

# 按现有 semver 范围更新整个 workspace
pnpm deps

# 或升级整个 workspace 到最新版本范围
pnpm deps:latest

# 构建全部
pnpm build

# 或仅构建 CLI 子包
cd apps/cli
pnpm build

# 本地全局链接（可选）
pnpm link
```

### 使用方法

```bash
# 在源码包内直接运行（交互模式）
node apps/cli/dist/index.js

# 非交互 preset 模式
node apps/cli/dist/index.js --preset react-app --name my-app --yes --install

# 失败时保留现场，方便排错
node apps/cli/dist/index.js --preset vue-app --name my-app --yes --no-rollback

# 或全局安装 / link 后
create-yume
```

### Git 提交流程

仓库已集成 `lobe-commit`、`husky` 和 `commitlint`：

```bash
# 首次配置 lobe-commit（OpenAI / GitHub token 等）
pnpm commit:config

# 交互式生成提交信息
pnpm commit

# 或继续使用 git commit，普通场景会自动走 lobe-commit hook
git commit
```

`commitlint` 已兼容 `✨ feat: ...` 和 `feat: ...` 两种 header。`prepare-commit-msg` 只会接管普通 `git commit`，不会覆盖 `git commit -m`、merge、squash、amend 等 Git 自带消息来源。

### 📚 文档 & 参考

| 文档                    | 说明                               | 链接                                                 |
| ----------------------- | ---------------------------------- | ---------------------------------------------------- |
| 技术架构总览            | 全局分层、执行流水线、DSL 与扩展点 | [概述](./docs/overview.md)                           |
| Handlebars Helpers 速查 | 模板可用/推荐 helpers 子集         | [handlebars-helpers](./docs/handlebars-helpers.md)   |
| pnpm Monorepo 约定      | 依赖管理、catalog、workspace 协议  | [pnpm-monorepo](./docs/pnpm-monorepo.md)             |

## 🙏 致谢

感谢以下项目的启发和支持：

- [Effect](https://effect.website/) - 优雅的函数式编程框架
- [@clack/prompts](https://github.com/natemoo-re/clack) - 现代化 CLI 交互界面
- [create-better-t-stack](https://github.com/AmanVarshney01/create-better-t-stack) - CLI 工具设计规范
- [Create Hana](https://github.com/hanaboso/create-hana) - CLI 工具设计灵感
