# 示例项目

`apps/examples/.generated/` 专门用于存放本地 smoke 验证生成物。

从仓库根目录运行 linked CLI smoke：

```bash
pnpm smoke:examples
```

该 smoke 会 link 本地 `create-yume` 包，生成代表性的 React 与 Vue preset 项目，安装依赖，并构建生成后的项目。
