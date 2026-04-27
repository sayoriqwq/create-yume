# T010 Command Output Redaction

## 层级

安全与观测维护。

## 状态

观察中。只有在命令可能处理敏感输出时推进。

## 背景

当前 command service 会记录命令执行输出。现有命令主要是依赖安装、Git 初始化和工具初始化，通常不含 secret。未来如果引入需要 token、认证、远程服务或外部 template source 的命令，完整输出日志可能泄漏敏感信息。

## 目标

在命令可能处理敏感内容前，为 command output 日志建立 redaction 或降级策略。

## 非目标

- 不引入远程模板或外部认证。
- 不在当前无敏感输出的命令上过早复杂化。
- 不删除必要的失败诊断信息。

## 建议方向

1. 明确 command output 的日志级别和内容边界。
2. 对已知敏感环境变量、token、URL credential 做 redaction。
3. 对外部命令失败保留 command、args、cwd 和 exit 信息，但避免完整敏感 stdout/stderr。
4. 在引入远程能力前先完成此项。

## 触发条件

- 任何命令开始使用 token、auth、远程 URL 或私有 registry。
- CLI 支持远程模板或外部服务。
- 日志输出被持久化或上传。

## 验证重点

- 普通命令失败仍可诊断。
- 伪造 token 不出现在日志中。
- command owner、unit、phase annotation 保留。

