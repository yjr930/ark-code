# OpenCC 运行时闭环：等待态、后台任务、Continuation、恢复与回流

本篇回答五个问题：

1. 哪些执行路径会进入等待态
2. 后台 bash / background agent 是如何脱离当前 turn 的
3. continuation / reconnect / retry 如何继续推进运行
4. 输出结果如何通过 notification / output file / attachment 回流
5. 为什么这些能力必须被视为 engine-core 的一部分

## 1. OpenCC 有多种等待态，而不是单一“等用户”状态

### 关键代码路径

- `opencc/src/screens/REPL.tsx`
- `opencc/src/state/AppStateStore.ts`
- `opencc/src/hooks/toolPermission/handlers/interactiveHandler.ts`
- `opencc/src/services/mcp/elicitationHandler.ts`

### 当前存在的等待态

OpenCC 在运行时并行维护多类 queue / waiting state：

- tool permission queue
- sandbox permission queue
- worker sandbox permission queue
- prompt queue
- MCP elicitation queue
- 某些 bridge / remote waiting state

### 运行时意义

等待态不是 UI 层的附属品，而是 query loop 是否继续推进的真实运行时条件。Ark Code 后续如果只建一个 approval wait state，会丢掉 OpenCC 的一部分行为语义。

## 2. 背景 Bash：当前 turn 脱离与后续回流

### 关键代码路径

- `opencc/src/tools/BashTool/BashTool.tsx`
- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`
- `opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx`

### 后台化链路

1. `BashTool` 暴露 `run_in_background`
2. 显式 `run_in_background: true` 时直接走 background task 路径
3. 在 assistant mode 下，前台命令超出 blocking budget 时也可能自动后台化
4. 真正后台化通过 `spawnShellTask(...)` 与 `shellCommand.background(taskId)` 完成
5. 后台任务写 output file，并在完成时发 `<task-notification>`

### 回流链路

- `<task-notification>` 提供 task id / output file / status / summary
- 后续可通过 Read 直接读取 output file
- 或通过 `TaskOutputTool` 获取任务输出
- query loop 后续 turn 会把 task-notification 作为 queued command 消费并转换为 attachment / internal message

### 运行时意义

后台 bash 不是一个 tool flag，而是一整条：

- tool entry
- task registration
- output persistence
- completion notification
- result handoff

闭环链路。

## 3. background agent：subagent 的脱离、pending message 与 transcript 回流

### 关键代码路径

- `opencc/src/tasks/LocalAgentTask/LocalAgentTask.tsx`
- `opencc/src/tools/AgentTool/resumeAgent.ts`
- `opencc/src/query.ts`

### 背景 agent 的运行链

1. async agent 被注册为 `local_agent` task
2. 独立 sidechain transcript 持续写盘
3. task output 可初始化为 transcript symlink
4. 背景 agent 完成后发送 `<task-notification>`
5. 主线程后续 turn 可以通过 `drainPendingMessages(...)` 取回待处理消息

### 回流语义

- 主线程不会在任意时刻消费所有子代理消息
- `query.ts` 明确区分：
  - main thread 只消费自己的 prompt / task-notification 队列
  - subagent 只消费发给自己 `agentId` 的 task-notification

这说明 background agent 的 continuation 与回流是 **按 agent 身份隔离** 的。

## 4. task-notification 是统一回流协议

### 关键代码路径

- `opencc/src/constants/xml.ts`
- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`
- `opencc/src/tasks/LocalAgentTask/LocalAgentTask.tsx`
- `opencc/src/query.ts`

### 统一结构

后台 shell、后台 agent 等长生命周期任务完成后，都会通过统一的 `<task-notification>` 回流，包含：

- task id
- tool use id（可选）
- output file path
- status
- summary
- result / usage / worktree 等附加字段（按任务类型存在）

### 运行时意义

`task-notification` 不是 UI convenience，而是后台执行与后续推理之间的协议层。Ark Code 后续应显式把它建模为 event / attachment / result surface，而不是只当一条字符串消息处理。

## 5. stall watchdog：后台任务卡住时的特殊等待态

### 关键代码路径

- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`

### 机制

后台 shell 任务如果长时间没有输出增长，并且输出尾部看起来像交互式 prompt：

- 会触发 stall watchdog
- 发送特殊 task-notification
- 提醒模型或上层逻辑：这个任务可能被交互提示卡住了

### 运行时意义

这是一种非常具体的 waiting state：

- 不是用户审批
- 不是 MCP elicitation
- 而是 shell 任务进入“假死但仍在运行”的交互等待态

这类状态如果不显式建模，很容易在 Ark Code 中被忽略。

## 6. MCP elicitation：多阶段等待与恢复

### 关键代码路径

- `opencc/src/services/mcp/elicitationHandler.ts`
- `opencc/src/services/mcp/client.ts`
- `opencc/src/screens/REPL.tsx`

### 闭环链路

1. MCP client 注册 elicitation request handler
2. MCP tool 运行过程中若需要用户补充输入，会触发 elicitation request
3. hook 可先行处理
4. 否则事件被压入 `elicitation.queue`
5. 用户响应后，再跑 elicitation result hooks
6. URL mode 下还会等待 `elicitation_complete` notification
7. 最后 retry 原始 tool call 或结束

### 运行时意义

MCP elicitation 不是单步确认弹窗，而是：

- request
- queue
- response
- completion notification
- retry

构成的一条 continuation 链。

## 7. capacity wait / wake：bridge poll loop 的安全等待

### 关键代码路径

- `opencc/src/bridge/capacityWake.ts`
- `opencc/src/bridge/bridgeMain.ts`
- `opencc/src/bridge/replBridge.ts`

### 闭环链路

1. poll loop 检测到当前 at-capacity
2. 使用 `createCapacityWake(...)` 进入可中断等待
3. 外部事件（session done / transport lost / shutdown）触发 `wake()` 或 outer abort
4. poll loop 被唤醒，重新检查是否继续 dispatch work

### 运行时意义

这不是简单 sleep，而是一个显式的、带 wake signal 的 capacity gate。Ark Code 后续如果要保留远程/桥接执行语义，这类等待态必须抽成正式 runtime 组件。

## 8. remote reconnect：transient failure 的 continuation 语义

### 关键代码路径

- `opencc/src/remote/SessionsWebSocket.ts`
- `opencc/src/remote/RemoteSessionManager.ts`

### 闭环链路

1. WebSocket close 发生
2. 若是 permanent close code，则直接终止
3. 若是 `4001 session not found`，按专门 retry budget 处理
4. 否则在普通 reconnect budget 内调度重连
5. 通过 `scheduleReconnect(...)` 延迟重连
6. 必要时可 `force reconnect`

### 运行时意义

remote continuation 不是“断了就失败”，而是有：

- close code 分类
- retry budget
- delay schedule
- reconnect trigger

这套恢复逻辑本身就是 engine 的一部分，而不只是 transport 附件。

## 9. query loop 如何在后续 turn 消费后台结果

### 关键代码路径

- `opencc/src/query.ts`
- `opencc/src/utils/attachments.ts`

### 消费链路

在 turn 间隙，query loop 会：

1. 读取 queued commands snapshot
2. 过滤出当前线程或当前 agent 应消费的 prompt / task-notification
3. 把这些 queued items 转成 attachments / messages
4. 再把它们并入本轮 `toolResults`
5. 移除已消费的 queued commands

### 运行时意义

这说明 background result 并不是“凭空回到模型里”，而是：

- queue
- filter
- attachment/message conversion
- toolResults merge

逐步进入下一轮。这是 continuation 的真正回流机制。

## 10. 输出接力：output file / transcript / attachment / next turn

### 关键代码路径

- `opencc/src/utils/task/diskOutput.js`
- `opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx`
- `opencc/src/tasks/LocalAgentTask/LocalAgentTask.tsx`
- `opencc/src/query.ts`

### 输出接力链

OpenCC 中，长生命周期任务的输出通常不会直接成为当前轮 assistant 文本，而是先落到：

- output file
- transcript symlink
- task-notification
- attachment / queued command
- 下一轮 turn 的 messages / toolResults

### 运行时意义

这说明“输出接力”是一级机制。Ark Code 后续如果只做即时返回，而不做 output handoff，会丢掉 OpenCC 很多后台与长任务语义。

## 11. 本阶段的关键结论

按运行时闭环看，OpenCC 的等待与 continuation 机制有四类核心特征：

1. **等待态是多路并存的**
   - permission / sandbox / elicitation / capacity / stall
2. **后台任务靠统一 task 协议与 notification 回流**
   - background bash / background agent 都遵循 task + output file + notification
3. **continuation 不是只有 resume**
   - 它体现在 retry、reconnect、wake、next turn consumption、sidechain 回流中
4. **输出接力是一级机制**
   - output file、transcript、attachment、queued command 一起构成后续消费面

这也是之前按模块目录盘点最容易漏掉的一层：

> 很多 OpenCC 的关键能力不是“实现在哪里”，而是“结果如何继续活下去”。
