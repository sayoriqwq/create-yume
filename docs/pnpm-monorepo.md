# pnpm Monorepo 约定

这个仓库把 pnpm 作为依赖管理的单一事实来源，Turborepo 只负责任务编排和缓存。

## 已启用的约束

- 所有外部依赖版本统一收口到根目录 `pnpm-workspace.yaml` 的 `catalog`。
- 业务包和工具包的 `package.json` 一律使用 `catalog:`，不直接手写外部依赖版本。
- `verifyDepsBeforeRun: error` 会在 `pnpm run` / `pnpm exec` 前检查 `node_modules` 是否过期，避免 manifest 和安装状态分叉。
- `catalogMode: manual` 继续保留 catalog 作为版本源，同时避免安装时输出 catalog 自动同步相关噪音。
- `cleanupUnusedCatalogs: true` 自动清理没人使用的 catalog 条目。
- `dedupeDirectDeps: true` 与 `optimisticRepeatInstall: true` 用于减少重复链接并加快重复安装。
- `resolvePeersFromWorkspaceRoot: true` 与 `autoInstallPeers: true` 统一 peer 解析策略。
- `trustPolicy: no-downgrade` 开启基础的供应链信任回退保护。
- `updateConfig.ignoreDependencies` 当前用来阻止 `typescript` 在仓库完成 TS 6 迁移前被 `pnpm deps:update:latest` 自动抬升。
- Effect 关键 peer 依赖显式声明在 CLI 包里，避免 pnpm 自动补装一组不兼容的旧 peer 版本。

## 推荐命令

```bash
# 查看整个 workspace 的依赖漂移
pnpm outdated

# 按现有 semver 范围更新所有 workspace 包
pnpm deps

# 升级所有 workspace 包到最新版本
pnpm deps:latest

# 仅构建 CLI
pnpm build:cli

# 给本地全局命令建立 pnpm 链接
pnpm link
```

## 新增外部依赖

推荐顺序：

1. 先在根目录 `pnpm-workspace.yaml` 的 `catalog` 增加版本。
2. 再在目标包里把依赖写成 `catalog:`。
3. 执行 `pnpm install` 更新 lockfile。

如果你希望用命令完成，可以先补 catalog，再执行：

```bash
pnpm add <pkg> --filter create-yume
pnpm add -D <pkg> --filter create-yume
```

这个仓库不依赖 pnpm 自动往 catalog 回填版本；新增依赖时，优先维护 catalog，再更新目标包的 `catalog:` 引用。

## 新增 workspace 内部包依赖

未来如果 `apps/*` 或 `packages/*` 之间互相依赖，统一使用 `workspace:` 协议，而不是裸 semver。

示例：

```json
{
  "dependencies": {
    "@create-yume/shared": "workspace:*"
  }
}
```

这样可以确保依赖只能解析到本地 workspace 包，不会在版本不匹配时悄悄退回 registry。pnpm 官方也明确建议在 monorepo 里用 `workspace:` 来消除这种不确定性。

## 何时用 overrides

只有下面几种场景才在根 `pnpm-workspace.yaml` 里加 `overrides`：

- 必须强制整个 workspace 使用单一的 transitive 版本。
- 上游包声明错误，需要临时修补。
- 需要替换成 fork 或移除无用的 optional 依赖。

不要把 `overrides` 当常规版本管理手段；常规外部依赖版本统一交给 `catalog`。

## 可选但暂未默认启用的策略

- `minimumReleaseAge`
  适合对供应链风险更敏感的仓库，但会改变升级节奏。
- `strictDepBuilds` / `allowBuilds`
  适合把依赖构建脚本审批纳入仓库策略，但需要先盘点当前依赖是否真的需要 postinstall。
- `packageManagerStrictVersion`
  适合全团队都通过 Corepack 或受控环境运行 pnpm 的仓库。
