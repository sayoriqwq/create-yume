# 提交与协作说明

仓库已经接入提交辅助工具和基础校验流程。

## 常用命令

```bash
pnpm commit:config
pnpm commit
git commit
```

## 提交信息约定

仓库使用 conventional commits。

常见类型包括：

- feat
- fix
- docs
- refactor
- test
- chore

如果你不想手写格式，直接使用 `pnpm commit` 会更稳妥。

## 提交前检查

开始提交之前，至少确认三件事：

1. 依赖已经安装完成。
2. 改动范围清楚，知道自己改的是用户层还是实现层。
3. 已准备好与改动范围匹配的验证命令。

## 提交前验证

### 只改文档

以人工校对为主，重点检查：

- 事实是否准确
- 入口是否可发现
- 语言是否符合对应文档类型

### 改了代码或模板

建议至少运行：

```bash
pnpm verify
```

如果你明确知道自己只触及局部区域，也可以按执行文档里的验证矩阵选择最低验证集。

## 相关入口

- [执行文档路线图](../agent/roadmap.md)
- [验证矩阵](../agent/verification-matrix.md)
