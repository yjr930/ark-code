# OpenCC engine-core 盘点：后台任务、等待态、continuation 与输出接力

这份文档专门记录 OpenCC 中“运行时闭环”相关的横切机制，重点关注：

- 后台 bash / agent 如何进入后台执行
- 完成通知如何回到主线程
- 输出如何以文件、task output、attachment 等形式继续被消费
- 等待态（approval / elicitation / capacity wait / stall）如何阻塞或恢复流程
- continuation / reconnect / wake 机制如何驱动长生命周期运行

## 1. 后台 Bash 的入口判定与后台化路径

### 负责什么

- 决定 BashTool 是否允许后台执行
- 决定是用户显式后台化，还是 assistant 自动后台化
- 决定后台执行后如何把任务状态和输出暴露给后续流程

### 关键代码路径

- `opencc/src/tools/BashTool/BashTool.tsx`
- `opencc/src/tools/BashTool/prompt.ts`
- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`

### 关键闭环

1. `BashTool` 输入 schema 暴露 `run_in_background`
2. `validateInput()` 会阻止某些阻塞式 sleep/polling 用法，并提示改用后台执行或 Monitor
3. 执行路径里区分：
   - 用户显式 `run_in_background: true`
   - assistant 自动后台化（超出 blocking budget）
4. 真正后台化通过 `spawnShellTask(...)` 与 `shellCommand.background(taskId)` 落地
5. 任务完成后通过 `<task-notification>` 与 output file path 回流给主线程

### 对应 Ark Code 包建议

- `packages/engine-core/workbench/shell/`
- `packages/engine-core/workbench/process/`
- `packages/engine-core/results/`

## 2. LocalShellTask：后台命令的任务态与通知态

### 负责什么

- 把后台 shell 命令注册成 task
- 维护 task state、output file、cleanup、completion notification
- 在命令卡住交互 prompt 时发 stall notification

### 关键代码路径

- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`
- `opencc/src/Task.ts`
- `opencc/src/utils/task/diskOutput.js`
- `opencc/src/utils/messageQueueManager.js`

### 关键闭环

1. `createTaskStateBase(...)` 先分配 taskId 与 outputFile
2. `spawnShellTask(...)` 注册 `local_bash` task
3. 输出自动流入 task output file
4. 完成时 `enqueueShellNotification(...)` 生成 `<task-notification>`
5. 若长时间无输出增长且尾部看起来像交互提示，则 `startStallWatchdog(...)` 发提醒
6. 任务结束后输出可被 Read / TaskOutputTool / 后续 attachment 消费

### 对应 Ark Code 包建议

- `packages/engine-core/workbench/process/`
- `packages/engine-core/events/`
- `packages/engine-core/results/`

## 3. TaskOutput / output file 作为 continuation surface

### 负责什么

- 后台任务不直接把最终结果塞回当前 turn，而是通过 output file 与 task retrieval surface 提供后续消费能力
- 这是一种显式“输出接力”机制

### 关键代码路径

- `opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx`
- `opencc/src/utils/task/diskOutput.js`
- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`
- `opencc/src/tasks/LocalAgentTask/LocalAgentTask.tsx`

### 关键闭环

1. 每个任务有独立 output file path
2. `<task-notification>` 中会携带 output file path
3. `TaskOutputTool` 能阻塞等待任务完成或读取当前输出
4. 当前实现更推荐直接用 Read 读取 task output file
5. local_agent 还会把 transcript symlink 到 task output，形成 sidechain 输出消费面

### 对应 Ark Code 包建议

- `packages/engine-core/results/`
- `packages/engine-core/workbench/process/`
- `packages/bridge/result_projection.ts`

## 4. LocalAgentTask：后台 subagent 的 completion / pending message / output 接力

### 负责什么

- 管理 background agent 的注册、pending messages、结果通知、transcript symlink
- 让 subagent 的最终结果通过 task-notification 与 transcript/output file 回到主线程

### 关键代码路径

- `opencc/src/tasks/LocalAgentTask/LocalAgentTask.tsx`
- `opencc/src/utils/sessionStorage.js`
- `opencc/src/utils/task/diskOutput.js`

### 关键闭环

1. async agent 注册为 `local_agent` task
2. sidechain transcript 持续写盘
3. `initTaskOutputAsSymlink(...)` 让 task output 指向 transcript
4. `drainPendingMessages(...)` 允许主线程在后续 turn 中取回 pending result / notifications
5. agent 完成时发送 `<task-notification>`，并带 output path

### 对应 Ark Code 包建议

- `packages/engine-core/subagent/`
- `packages/engine-core/results/`
- `packages/engine-core/events/`

## 5. task-notification 作为统一回流协议

### 负责什么

- 把后台 shell / subagent / remote agent 的完成、失败、停止、输出路径统一编码成可被主线程消费的通知格式
- 是后台运行与主线程继续对话之间的桥梁

### 关键代码路径

- `opencc/src/constants/xml.ts`
- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`
- `opencc/src/tasks/LocalAgentTask/LocalAgentTask.tsx`
- `opencc/src/query.ts`
- `opencc/src/utils/attachments.ts`

### 关键闭环

1. 后台任务生成 `<task-notification>` XML
2. 通知进入 pending queue
3. query loop 只会 drain 当前 agent 应消费的 task-notifications
4. 这些通知再被转成 attachment / queued command / user-role internal message，进入后续推理

### 对应 Ark Code 包建议

- `packages/engine-core/events/`
- `packages/engine-core/results/`
- `packages/bridge/core_event_to_bus_event.ts`

## 6. 等待态：permission / elicitation / worker sandbox / prompt queue

### 负责什么

- OpenCC 不是只有一个“等待用户”状态，而是有多种等待态并存
- 包括：
  - tool permission
  - sandbox permission
  - worker sandbox permission
  - prompt queue
  - MCP elicitation queue

### 关键代码路径

- `opencc/src/screens/REPL.tsx`
- `opencc/src/state/AppStateStore.ts`
- `opencc/src/services/mcp/elicitationHandler.ts`
- `opencc/src/hooks/toolPermission/handlers/interactiveHandler.ts`

### 关键闭环

1. 等待态统一投影到 AppState queue
2. REPL 用 focused dialog / active prompt 逻辑选择当前阻塞面
3. 用户响应后对应 queue 出队
4. 结果通过 permission / elicitation response 继续推进 query loop 或 MCP tool invoke

### 对应 Ark Code 包建议

- `packages/engine-core/approval/`
- `packages/engine-core/state/`
- `packages/server-host/ui/`

## 7. MCP URL elicitation：显式等待 + completion notification

### 负责什么

- 支持 MCP tool 触发 URL-mode elicitation
- 要求用户打开 URL，等待 server 确认完成，再继续重试 tool
- 是典型的多阶段 continuation/waiting 状态机

### 关键代码路径

- `opencc/src/services/mcp/client.ts`
- `opencc/src/services/mcp/elicitationHandler.ts`
- `opencc/src/cli/print.ts`
- `opencc/src/screens/REPL.tsx`

### 关键闭环

1. MCP tool 返回 `-32042` + elicitation payload
2. hook 可先尝试接管
3. 否则进入 `elicitation.queue`
4. 用户处理后回传 elicitation response
5. 若是 URL mode，还会等待 `elicitation_complete` notification
6. 完成后重新 retry tool call

### 对应 Ark Code 包建议

- `packages/engine-core/mcp/`
- `packages/engine-core/approval/`
- `packages/engine-core/results/`

## 8. capacity wait / wake：bridge 的安全等待态

### 负责什么

- 当 bridge / remote runtime 处于 at-capacity 状态时，不继续拉新工作，而是进入安全等待态
- 等条件变化时，再通过 wake 机制恢复 poll loop

### 关键代码路径

- `opencc/src/bridge/capacityWake.ts`
- `opencc/src/bridge/bridgeMain.ts`
- `opencc/src/bridge/replBridge.ts`

### 关键闭环

1. poll loop 发现 capacity 已满
2. 进入等待 signal
3. 外部事件触发 `wake()`
4. 重新进入 poll / heartbeat / dispatch 流程

### 对应 Ark Code 包建议

- `packages/bridge/`
- `packages/server-host/runtime/`
- `packages/engine-core/results/`

## 9. reconnect / continuation：remote 会话的长生命周期恢复

### 负责什么

- 管理 WebSocket transient drop、retry budget、reconnect scheduling、session-not-found 分支
- 让 remote session 不因临时断线直接失败

### 关键代码路径

- `opencc/src/remote/SessionsWebSocket.ts`
- `opencc/src/remote/RemoteSessionManager.ts`
- `opencc/src/bridge/bridgeMain.ts`

### 关键闭环

1. transient close 触发 reconnect 计划
2. 超过 retry budget 时停止重连
3. reconnect 成功后恢复会话流
4. permanent close / fatal branch 则显式终止 continuation

### 对应 Ark Code 包建议

- `packages/bridge/`
- `packages/server-host/runtime/`
- `packages/engine-core/results/`

## 10. 这一轮补的关键认识

相比前几轮“模块盘点”，这一轮补的是运行时闭环：

- 后台任务不是一个 flag，而是一整条 task/output/notification/readback 链
- waiting state 不是一个弹窗，而是多种 queue 并存的阻塞模型
- continuation 不只是 resume，会出现在：
  - background bash
  - background agent
  - MCP elicitation
  - capacity wait
  - remote reconnect
- output handoff 是 OpenCC 的一级机制：很多长生命周期结果不是直接回当前 turn，而是经由 output file、task-notification、attachment、Read 再次进入后续推理

如果 Ark Code 要完整复刻 engine-core 能力，这条运行时闭环必须显式建模，而不能只做“模块本体 + 调用关系”。
