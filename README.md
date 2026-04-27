# Create Yume CLI

> 用于创建 React 与 Vue 项目的现代前端脚手架。

Create Yume 是一个面向前端项目初始化的 CLI。

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
pnpm outdated
pnpm deps
pnpm deps:latest
pnpm verify
```

## 文档入口

- [仓库文档路线图](./roadmap.md)
- [用户文档路线图](./docs/user/roadmap.md)
- [系统总架构](./docs/user/system-architecture.md)
- [执行文档路线图](./docs/agent/roadmap.md)

## 提交流程

```bash
pnpm commit:config
pnpm commit
git commit
```

## 致谢

- [Effect](https://effect.website/)
- [@clack/prompts](https://github.com/natemoo-re/clack)
- [create-better-t-stack](https://github.com/AmanVarshney01/create-better-t-stack)
- [Create Hana](https://github.com/hanaboso/create-hana)
