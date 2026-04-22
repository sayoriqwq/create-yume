# pnpm Monorepo 约定

> 当前仓库以 pnpm 作为依赖管理的单一事实来源，Turborepo 负责任务编排和缓存。当前活跃的业务包主路径是 `apps/cli`，`packages/*` 仍保留为后续扩展位。

## 当前工作区现状

- 所有外部依赖版本统一收口在根目录 [`pnpm-workspace.yaml`](/Users/sayori/Desktop/create-yume/pnpm-workspace.yaml) 的 `catalog`。
- workspace 包里的外部依赖统一写成 `catalog:`，不直接手写 semver 版本。
- 当前根脚本 `pnpm verify` 与 `pnpm verify:code` 都会执行 `build + test + lint`。
- `create-yume` CLI 的运行时依赖也遵守同一套 catalog 口径，包括当前 tracing 相关依赖。

## 已启用的约束

- `verifyDepsBeforeRun: error`
  在 `pnpm run` / `pnpm exec` 前检查安装状态，避免 manifest 与 `node_modules` 漂移。
- `catalogMode: manual`
  保持 catalog 作为版本真源，同时避免安装时自动改写 catalog。
- `cleanupUnusedCatalogs: true`
  自动清理未被任何 workspace 使用的 catalog 条目。
- `dedupeDirectDeps: true`
  尽量减少重复直接依赖链接。
- `optimisticRepeatInstall: true`
  优化重复安装体验。
- `resolvePeersFromWorkspaceRoot: true`
  从 workspace 根统一解析 peer 依赖。
- `autoInstallPeers: true`
  在需要时自动补装 peer 依赖。
- `trustPolicy: no-downgrade`
  启用基础的供应链回退保护。
- `updateConfig.ignoreDependencies`
  当前用于阻止 `typescript` 在仓库完成 TS 6 迁移前被 `pnpm deps:latest` 自动抬升。

## 推荐命令

```bash
# 查看整个 workspace 的依赖漂移
pnpm outdated

# 按现有 semver 范围更新 workspace 依赖
pnpm deps

# 升级 workspace 依赖到最新版本
pnpm deps:latest

# 仅构建 CLI
pnpm build:cli

# 给 create-yume 建立全局链接
pnpm link
```

## 新增外部依赖

推荐顺序：

1. 先在根目录 `pnpm-workspace.yaml` 的 `catalog` 增加版本。
2. 再在目标包的 `package.json` 里把依赖写成 `catalog:`。
3. 执行 `pnpm install` 更新 lockfile。

如果用命令完成，仍然建议先补 catalog，再执行：

```bash
pnpm add <pkg> --filter create-yume
pnpm add -D <pkg> --filter create-yume
```

这个仓库不依赖 pnpm 自动回填 catalog；新增依赖时，优先维护 catalog，再更新目标包引用。

## 新增 workspace 内部依赖

如果未来 `apps/*` 或 `packages/*` 之间互相依赖，统一使用 `workspace:` 协议，而不是裸 semver。

示例：

```json
{
  "dependencies": {
    "@create-yume/shared": "workspace:*"
  }
}
```

这样可以保证依赖只会解析到本地 workspace 包，不会在版本不匹配时悄悄回退到 registry。

## 何时使用 overrides

只有下面几类场景才应该在根 `pnpm-workspace.yaml` 里增加 `overrides`：

- 必须强制整个 workspace 使用单一的 transitive 版本
- 上游包版本声明错误，需要临时修补
- 需要替换成 fork，或者移除无用的 optional 依赖

不要把 `overrides` 当常规版本管理手段；常规外部依赖版本统一交给 `catalog`。

## 暂未默认启用，但可按需评估的策略

- `minimumReleaseAge`
  更适合供应链风险要求更高的仓库，但会改变升级节奏。
- `strictDepBuilds` / `allowBuilds`
  适合把依赖构建脚本纳入审批策略，但要先盘点当前依赖是否真的需要 postinstall。
- `packageManagerStrictVersion`
  适合全团队都通过 Corepack 或受控环境运行 pnpm 的场景。
