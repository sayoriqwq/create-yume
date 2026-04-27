# 提交与协作说明

仓库使用 conventional commits，并通过 commitlint 基础配置校验提交信息。

## 常用提交方式

当前仓库没有 `pnpm commit` 或 `pnpm commit:config` 辅助脚本。提交时请直接使用 `git commit`，并手写符合 conventional commits 的提交信息。

```bash
git status --short
git add <需要提交的文件>
git commit -m "docs: align project documentation"
```

## 提交信息约定

仓库使用 conventional commits。

常见类型包括：

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

提交信息应与实际改动范围匹配。示例：

```bash
git commit -m "fix: keep husky hook writes portable"
git commit -m "docs: update workspace bootstrap boundaries"
```

## 提交前检查

开始提交之前，至少确认三件事：

1. 依赖已经安装完成。
2. 改动范围清楚，知道自己改的是用户层、执行文档、模板还是运行时代码。
3. 已执行与改动范围匹配的验证命令，或完成只改文档时的人工冷读与事实核对。

## 提交前验证

### 只改文档

以人工校对为主，重点检查：

- 事实是否准确
- 入口是否可发现
- 语言是否符合对应文档类型
- 是否仍然符合当前代码边界，而不是旧计划或旧审查结论

### 改了代码或模板

建议至少运行：

```bash
pnpm verify
```

如果你明确知道自己只触及局部区域，也可以按执行文档里的验证矩阵选择最低验证集。

## 相关入口

- [执行文档路线图](../agent/roadmap.md)
- [验证矩阵](../agent/verification-matrix.md)
