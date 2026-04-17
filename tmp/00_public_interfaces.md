# Engine Core 对外接口总表

## 0. 文档目标

本文件定义 Ark Code `engine-core` 的正式对外边界。

本文件里的“对外接口”只包括两类：

- 宿主、`server-host`、`bridge`、测试桩、调试工具会直接调用的接口
- 宿主必须实现并注入 `engine-core` 的 port 接口

`engine-core` 内部执行拆分所使用的函数，不写入对外接口总表。

要求如下：

- 对外接口与内部能力严格分开
- 每个对外接口都直接带功能说明与 OpenCC 来源
- 接口定义优先保证边界完整，不按当前实现文件拆分方式展开
- 文档服务于 Ark Code 的正式边界设计，不服务于内部函数枚举

---

## 1. 边界原则

Ark Code 的 `engine-core` 负责：

- session 生命周期
- turn 执行主循环
- 输入归一化与消息管理
- prompt 组装
- tool / task / subagent runtime
- continuation / compact / permission / hook / transcript / file-history / attribution 语义
- 已连接 MCP client 在 session 内部的使用语义

宿主层负责：

- CLI / Web / TUI 壳
- provider transport 具体实现
- OAuth / token 获取
- MCP 配置发现与外部认证
- 本地 session server / remote bridge 托管
- 事件消费与外部通知落地

因此，`engine-core` 的正式对外边界应收敛为：

- 少量可直接调用的公共接口
- 一组由宿主实现的注入 port

---

## 2. 对外调用接口

下面只列会被外部直接调用的正式接口。

### 2.1 Session 入口与生命周期

1. `createSessionEngine(config) -> EngineSession`
   - 功能：根据宿主配置创建新 session，并初始化 engine state、runtime 与依赖注入。
   - 来源：`opencc/src/QueryEngine.ts:130`
   - 对齐对象：`QueryEngineConfig` + `QueryEngine` 构造器
2. `resumeSessionEngine(config, restoredState) -> EngineSession`
   - 功能：基于已恢复状态重建 session，并让后续 turn 在恢复上下文上继续执行。
   - 来源：`opencc/src/QueryEngine.ts:130`、`opencc/src/utils/sessionRestore.ts:409`、`opencc/src/utils/conversationRecovery.ts:456`
   - 对齐对象：`QueryEngine` 恢复后继续执行的状态装配
3. `submitInput(session, input, options) -> AsyncGenerator<EngineEvent, EngineTurnResult>`
   - 功能：接收一次输入并驱动完整 turn，流式产出执行事件与最终结果。
   - 来源：`opencc/src/QueryEngine.ts:209`
   - 对齐对象：`submitMessage()`
4. `abortTurn(session, reason?) -> Promise<void>`
   - 功能：中断当前 turn 内的模型、工具、任务等执行流程。
   - 来源：`opencc/src/QueryEngine.ts:203`、`opencc/src/Tool.ts:180`
   - 对齐对象：session 内统一 `AbortController`
5. `destroySession(session) -> Promise<void>`
   - 功能：释放 session 占用的 runtime、hook、任务与外部资源。
   - 来源：`opencc/src/QueryEngine.ts` 生命周期、`opencc/src/tools/AgentTool/runAgent.ts:816`
   - 对齐对象：执行结束后的资源释放语义
6. `forkSession(session, options) -> EngineSession`
   - 功能：复制当前会话状态生成分支 session，用于隔离执行或派生子流程。
   - 来源：`opencc/src/QueryEngine.ts` 的 mutableMessages / readFileState 持有方式、`opencc/src/utils/forkedAgent.ts`
   - 对齐对象：会话状态复制与 fork 执行
7. `snapshotSession(session) -> EngineSessionSnapshot`
   - 功能：导出可持久化、可恢复的 session 快照。
   - 来源：`opencc/src/QueryEngine.ts` 的 mutable state、`opencc/src/utils/sessionStorage.ts`
   - 对齐对象：会话状态快照语义
8. `restoreSession(snapshot, config) -> EngineSession`
   - 功能：根据快照和配置重建 session 实例。
   - 来源：`opencc/src/utils/sessionRestore.ts:409`
   - 对齐对象：恢复后的 session 重建
9. `getSessionState(session) -> EngineSessionState`
   - 功能：读取当前 session 的运行态，用于宿主投影、调试和测试断言。
   - 来源：`opencc/src/QueryEngine.ts:202`、`opencc/src/Tool.ts:182`
   - 对齐对象：`getAppState()`

### 2.2 后台任务与 Agent

10. `listTasks(session) -> EngineTask[]`
    - 功能：列出当前 session 的任务集合。
    - 来源：`AppState.tasks` 与 task list 展示逻辑
    - 对齐对象：任务列表读取
11. `getTask(session, taskId) -> EngineTask | undefined`
    - 功能：读取单个任务状态。
    - 来源：task state 存储在 `AppState.tasks`
    - 对齐对象：单任务读取
12. `readTaskOutput(session, taskId, options) -> Promise<TaskOutputResult>`
    - 功能：按需读取后台任务输出内容。
    - 来源：`opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx:144`
    - 对齐对象：任务输出读取
13. `killTask(session, taskId) -> Promise<void>`
    - 功能：停止指定后台任务。
    - 来源：`opencc/src/tasks/stopTask.ts:38`
    - 对齐对象：通用任务停止
14. `listAvailableAgents(session) -> AgentDefinition[]`
    - 功能：列出当前 session 可用的 agent 定义。
    - 来源：`opencc/src/tools/AgentTool/loadAgentsDir.ts:105`
    - 对齐对象：agent definition 集合
15. `spawnAgent(session, request) -> Promise<AgentSpawnResult>`
    - 功能：创建一次 agent 执行并返回启动结果。
    - 来源：`opencc/src/tools/AgentTool/AgentTool.tsx:245`
    - 对齐对象：Agent tool 调用总入口
16. `resumeAgent(session, agentId, request) -> Promise<AgentResumeResult>`
    - 功能：恢复已存在的后台 agent 执行。
    - 来源：`opencc/src/tools/AgentTool/resumeAgent.ts`
    - 对齐对象：后台 agent 恢复
17. `sendAgentMessage(session, toAgent, prompt) -> Promise<void>`
    - 功能：向已存在 agent 继续发送消息。
    - 来源：当前由 `SendMessageTool` + `agentNameRegistry` 完成，注册点在 `opencc/src/tools/AgentTool/AgentTool.tsx:706`
    - 对齐对象：向已存在 agent 继续发送消息

### 2.3 MCP、恢复与文件回滚

18. `attachMcpClients(session, clients) -> void`
    - 功能：把已连接 MCP client 注入当前 session。
    - 来源：`opencc/src/Tool.ts:166`
    - 对齐对象：`mcpClients` 注入到执行上下文
19. `detachMcpClient(session, clientName) -> void`
    - 功能：从当前 session 移除指定 MCP client。
    - 来源：MCP client 生命周期与 `AppState.mcp.clients` 更新语义
    - 对齐对象：移除指定 client
20. `listMcpClients(session) -> MCPServerConnection[]`
    - 功能：列出当前 session 已连接的 MCP client。
    - 来源：`opencc/src/Tool.ts:166`
    - 对齐对象：已连接 MCP client 列表
21. `listMcpResources(session) -> Record<string, ServerResource[]>`
    - 功能：列出当前 session 可见的 MCP resources。
    - 来源：`opencc/src/Tool.ts:167`
    - 对齐对象：session 当前 MCP resources
22. `refreshMcpResources(session) -> Promise<void>`
    - 功能：刷新 MCP resources 与相关缓存。
    - 来源：`refreshTools` / MCP runtime 刷新语义
    - 对齐对象：资源重拉取
23. `readMcpResource(session, request) -> Promise<McpResourceResult>`
    - 功能：读取指定 MCP resource 内容。
    - 来源：`opencc/src/tools/ListMcpResourcesTool/*`、`opencc/src/tools/ReadMcpResourceTool/*`
    - 对齐对象：MCP resource 读取
24. `loadConversationForResume(locator, sourceFile?) -> Promise<ResumeLoadResult>`
    - 功能：在 resume 前加载历史 conversation 数据。
    - 来源：`opencc/src/utils/conversationRecovery.ts:456`
    - 对齐对象：resume 前加载 conversation
25. `rewindFiles(session, userMessageId, options) -> Promise<RewindResult>`
    - 功能：将文件系统回滚到目标消息对应状态。
    - 来源：`opencc/src/utils/fileHistory.ts:347`
    - 对齐对象：文件回滚
26. `canRewindFiles(session, userMessageId) -> boolean`
    - 功能：检查指定消息点是否允许回滚。
    - 来源：`opencc/src/utils/fileHistory.ts:399`
    - 对齐对象：回滚可行性检查
27. `getRewindDiffStats(session, userMessageId) -> Promise<DiffStats | null>`
    - 功能：计算回滚前后的文件差异统计。
    - 来源：`opencc/src/utils/fileHistory.ts:414`
    - 对齐对象：rewind diff stats

---

## 3. 宿主注入 Port

下面列宿主必须实现并注入 `engine-core` 的外部能力接口。

28. `ModelPort.callModel(request) -> AsyncGenerator<ModelStreamEvent, ModelResult>`
    - 功能：以 port 形式提供模型流式调用能力。
    - 来源：`opencc/src/query/deps.ts:21`、`opencc/src/services/api/claude.ts:752`
    - 对齐对象：模型调用 port
29. `PermissionPort.canUseTool(request) -> Promise<PermissionDecision>`
    - 功能：以 port 形式提供工具权限判定能力。
    - 来源：`opencc/src/hooks/useCanUseTool.tsx:27`
    - 对齐对象：权限判定 port
30. `PermissionPort.requestPrompt(request) -> Promise<PromptResponse>`
    - 功能：以 port 形式提供交互式补充输入能力。
    - 来源：`opencc/src/Tool.ts:270`
    - 对齐对象：交互式 prompt 请求 port
31. `PermissionPort.handleElicitation(request) -> Promise<ElicitResult>`
    - 功能：以 port 形式提供 elicitation 处理能力。
    - 来源：`opencc/src/Tool.ts:198`
    - 对齐对象：elicitation port
32. `SessionStorePort.recordTranscript(request) -> Promise<void>`
    - 功能：以 port 形式提供 transcript 写入能力。
    - 来源：`opencc/src/utils/sessionStorage.ts:1408`
    - 对齐对象：transcript store port
33. `SessionStorePort.flush(request) -> Promise<void>`
    - 功能：以 port 形式提供 session 存储刷盘能力。
    - 来源：`opencc/src/utils/sessionStorage.ts:1583`
    - 对齐对象：storage flush port
34. `SessionStorePort.loadConversationForResume(request) -> Promise<ResumeLoadResult>`
    - 功能：以 port 形式提供 resume 前会话加载能力。
    - 来源：`opencc/src/utils/conversationRecovery.ts:456`
    - 对齐对象：resume load port
35. `SessionStorePort.processResumedConversation?(request) -> Promise<ProcessedResume>`
    - 功能：以 port 形式提供 resume 后状态恢复能力。
    - 来源：`opencc/src/utils/sessionRestore.ts:409`
    - 对齐对象：resume restore port
36. `FileSystemPort.readFileState(request) -> Promise<FileState>`
    - 功能：以 port 形式提供文件状态读取能力。
    - 来源：file tools + file history + read cache 语义
    - 对齐对象：文件状态读取 port
37. `FileSystemPort.snapshotFileState(request) -> Promise<FileSnapshotResult>`
    - 功能：以 port 形式提供文件快照能力。
    - 来源：`opencc/src/utils/fileHistory.ts`
    - 对齐对象：文件快照 port
38. `EventSinkPort.emit(event) -> Promise<void> | void`
    - 功能：以 port 形式提供事件下游消费能力。
    - 来源：当前 SDK 输出、REPL UI、bridge 转发三套事件消费逻辑
    - 对齐对象：事件下游消费 port
39. `NotificationPort.enqueue(notification) -> void`
    - 功能：以 port 形式提供通知入队能力。
    - 来源：notification queue / `addNotification` / OS notification 等能力
    - 对齐对象：通知投递 port
40. `McpRuntimePort.listClients() -> MCPServerConnection[]`
    - 功能：以 port 形式提供 MCP client 列表能力。
    - 来源：`opencc/src/Tool.ts:166`
    - 对齐对象：MCP client 提供 port
41. `McpRuntimePort.listResources() -> Record<string, ServerResource[]>`
    - 功能：以 port 形式提供 MCP resource 列表能力。
    - 来源：`opencc/src/Tool.ts:167`
    - 对齐对象：MCP resource 提供 port
42. `HostStatePort.getAppState() -> EngineHostState`
    - 功能：以 port 形式提供宿主状态读取能力。
    - 来源：`opencc/src/QueryEngine.ts:137`、`opencc/src/Tool.ts:182`
    - 对齐对象：宿主状态读取 port
43. `HostStatePort.setAppState(updater) -> void`
    - 功能：以 port 形式提供宿主状态回写能力。
    - 来源：`opencc/src/QueryEngine.ts:138`、`opencc/src/Tool.ts:183`
    - 对齐对象：宿主状态回写 port
44. `ClockPort.now() -> number`
    - 功能：以 port 形式提供当前时间读取能力。
    - 来源：全局 `Date.now()` 依赖
    - 对齐对象：时钟 port
45. `IdPort.uuid() -> string`
    - 功能：以 port 形式提供唯一 ID 生成能力。
    - 来源：`opencc/src/query/deps.ts:30`
    - 对齐对象：ID 生成 port

---

## 4. 明确属于内部能力的接口族

下面这些能力必须在 `engine-core` 内部存在，但不属于正式对外接口，不要求宿主直接调用：

### 4.1 输入归一化与消息组装

包括：`processInput`、`buildSystemPrompt`、`buildUserContext`、`buildSystemContext`、`appendMessages`、`replaceMessages`、`getMessages`、`normalizeMessages`、`extractReadFileCache`。

这些接口服务于 turn 执行准备阶段，属于内部编排能力。

### 4.2 Query Loop 执行

包括：`runTurn`、`runQueryLoop`、`runModelStep`、`applyMicrocompact`、`applyAutocompact`、`applySnip`、`applyContextCollapse`、`applyToolResultBudget`、`checkTurnBudget`、`shouldContinueTurn`。

这些接口描述的是内部状态推进和上下文压缩过程。

### 4.3 Tool Runtime

包括：`getBuiltinTools`、`assembleToolPool`、`findToolByName`、`validateToolInput`、`executeToolCall`、`runToolBatch`、`createToolUseContext`、`refreshToolPool`、`getToolSchemas`、`registerSyntheticTool`、`unregisterSyntheticTool`。

这些接口属于 `engine-core` 内部的工具编排与执行面。

### 4.4 Permission / Approval 内部编排

包括：`canUseTool`、`requestPermission`、`applyPermissionDecision`、`getPermissionContext`、`updatePermissionContext`、`requestPrompt`、`handleElicitation`、`replayOrphanedPermission`。

正式边界对外暴露的是 `PermissionPort`，不是这些内部编排函数。

### 4.5 Task / Subagent 内部生命周期

包括：`registerTask`、`startTask`、`completeTask`、`failTask`、`foregroundTask`、`backgroundTask`、`resolveAgent`、`runAgent`、`createSubagentContext`、`registerAsyncAgent`、`registerRemoteAgent`、`loadAgentDefinitions`、`filterAgentsByAvailability`、`resolveAgentSystemPrompt`。

对外保留的是任务与 agent 的控制接口，不展开内部状态推进接口。

### 4.6 Hook Runtime

包括：`runSetupHooks`、`runSessionStartHooks`、`runUserPromptSubmitHooks`、`runPreToolUseHooks`、`runPostToolUseHooks`、`runStopHooks`、`registerSessionHooks`、`clearSessionHooks`。

hooks 由 `engine-core` 在执行过程中内部触发，不要求宿主逐个直接调用。

### 4.7 持久化记录、归因与事件投影

包括：`recordTranscript`、`recordSidechainTranscript`、`recordQueueOperation`、`recordContentReplacement`、`recordFileHistorySnapshot`、`recordAttributionSnapshot`、`recordContextCollapseCommit`、`recordContextCollapseSnapshot`、`writeAgentMetadata`、`flushSessionStorage`、`processResumedConversation`、`hydrateRemoteSession`、`removeTranscriptMessage`、`resetSessionFilePointer`、`adoptResumedSessionFile`、`makeFileSnapshot`、`updateAttributionState`、`getAttributionState`、`emitSystemInit`、`emitProgress`、`emitTaskProgress`、`emitTaskNotification`、`emitResult`、`mapToSdkMessage`、`mapToBridgeEvent`、`drainPendingNotifications`、`drainPendingSdkEvents`。

这些能力必须保留语义，但通过公共接口与 port 间接体现，不作为独立公共 API 承诺。

---

## 5. 对 Ark Code 的直接约束

1. 宿主只能通过第 2 节公共接口驱动 `engine-core`，通过第 3 节 port 提供外部能力。
2. 第 4 节内部能力必须存在，但不作为对外 API 稳定承诺。
3. `engine-core` 必须自己拥有 session state、query loop、tool runtime、task runtime、subagent runtime。
4. resume / transcript / file-history / content-replacement / attribution 语义必须完整保留，不能因 API 收敛而被省略。
5. 后续如果某个内部能力需要被宿主直接调用，应先升级为公共接口，再更新本文件。

---

## 6. 当前结论

Ark Code `engine-core` 的正式外部边界由两部分构成：

- 对外调用接口
- 宿主注入 port

输入归一化、query loop、tool 编排、hook 执行、持久化记录、事件投影等内容，保留在 `engine-core` 内部能力层，不写成宿主直接调用接口。
