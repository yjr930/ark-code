# api 模块设计

## 0. 模块定位

`api/` 是 `engine-core` 的正式公共入口层。

它只负责三件事：

- 暴露稳定公共接口
- 做参数校验、对象装配、调用分发
- 把外部调用收敛到 `session/`、`runtime/`、`state/` 的内部能力

它不负责：

- query loop 细节
- tool runtime 细节
- task / agent 生命周期推进细节
- transcript / rewind / compact 的底层实现

对 `server-host` 和 `bridge` 而言，`engine-core` 的可见面就是 `api/`。

---

## 1. 职责与要求

### 职责

- 暴露 session 生命周期接口
- 暴露 turn 执行接口
- 暴露 task / agent 控制接口
- 暴露 MCP / rewind / resume 相关接口
- 统一 public type 的输入输出边界

### 要求

- 外部只能 import `api/` 导出的接口，不能越过 `api/` 直接调用 `query/`、`runtime/`、`state/`
- `api/` 只负责边界组织，不写重复业务逻辑
- `api/` 返回的类型必须来自 `types/public.ts`
- `api/` 不保存长期状态，状态归 `session/` 持有
- `api/` 不直接依赖宿主实现，只依赖 `ports/` 类型

---

## 2. 下属文件规划

```text
api/
  session.ts
  task.ts
  agent.ts
  mcp.ts
  rewind.ts
```

### 2.1 session.ts

职责：

- 定义 session 相关正式 API

定义内容：

- `createSessionEngine(config)`
- `resumeSessionEngine(config, restoredState)`
- `destroySession(session)`
- `forkSession(session, options)`
- `snapshotSession(session)`
- `restoreSession(snapshot, config)`
- `getSessionState(session)`
- `submitInput(session, input, options)`
- `abortTurn(session, reason?)`

逻辑要求：

- 调用 `session/engine-factory.ts` 创建或恢复 session
- 调用 `session/engine.ts` 提交输入和终止 turn
- 只做公共参数与公共返回值适配

OpenCC 参照代码：

- `opencc/src/QueryEngine.ts`
- `opencc/src/utils/sessionRestore.ts`
- `opencc/src/utils/conversationRecovery.ts`
- `opencc/src/utils/forkedAgent.ts`
- `opencc/src/utils/sessionStorage.ts`

### 2.2 task.ts

职责：

- 定义 task 相关正式 API

定义内容：

- `listTasks(session)`
- `getTask(session, taskId)`
- `readTaskOutput(session, taskId, options)`
- `killTask(session, taskId)`

逻辑要求：

- 读取 `session` 持有的 task registry / task state
- 调用 `runtime/tasks` 提供的查询、输出读取、stop 能力
- 不把不同 task type 的细节泄漏给外部

OpenCC 参照代码：

- `opencc/src/Task.ts`
- `opencc/src/tasks.ts`
- `opencc/src/tasks/stopTask.ts`
- `opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx`
- `opencc/src/tools/TaskListTool/*`
- `opencc/src/tools/TaskGetTool/*`
- `opencc/src/tools/TaskStopTool/*`

### 2.3 agent.ts

职责：

- 定义 agent 相关正式 API

定义内容：

- `listAvailableAgents(session)`
- `spawnAgent(session, request)`
- `resumeAgent(session, agentId, request)`
- `sendAgentMessage(session, toAgent, prompt)`

逻辑要求：

- 把 agent 能力保持为 session 内 runtime 的一部分
- 对外暴露的是 agent 控制语义，不是内部 sidechain / transcript / mailbox 细节

OpenCC 参照代码：

- `opencc/src/tools/AgentTool/AgentTool.tsx`
- `opencc/src/tools/AgentTool/runAgent.ts`
- `opencc/src/tools/AgentTool/resumeAgent.ts`
- `opencc/src/tools/AgentTool/loadAgentsDir.ts`
- `opencc/src/utils/forkedAgent.ts`

### 2.4 mcp.ts

职责：

- 定义 session 内 MCP 可见面的正式 API

定义内容：

- `attachMcpClients(session, clients)`
- `detachMcpClient(session, clientName)`
- `listMcpClients(session)`
- `listMcpResources(session)`
- `refreshMcpResources(session)`
- `readMcpResource(session, request)`

逻辑要求：

- 只处理 session 内已连接 client 和已暴露 resource 的使用语义
- 不负责 MCP 配置发现、连接建立和认证

OpenCC 参照代码：

- `opencc/src/Tool.ts`
- `opencc/src/tools/ListMcpResourcesTool/ListMcpResourcesTool.ts`
- `opencc/src/tools/ReadMcpResourceTool/ReadMcpResourceTool.ts`
- `opencc/src/services/mcp/client.ts`

### 2.5 rewind.ts

职责：

- 定义 resume / rewind 相关正式 API

定义内容：

- `loadConversationForResume(locator, sourceFile?)`
- `rewindFiles(session, userMessageId, options)`
- `canRewindFiles(session, userMessageId)`
- `getRewindDiffStats(session, userMessageId)`

逻辑要求：

- 外部只看到 resume / rewind 能力，不看到 transcript 和 file-history 的内部结构
- rewind 逻辑必须通过 `state/file-history` 与 `ports/filesystem` 协同完成

OpenCC 参照代码：

- `opencc/src/utils/conversationRecovery.ts`
- `opencc/src/utils/sessionRestore.ts`
- `opencc/src/utils/fileHistory.ts`
- `opencc/src/cli/print.ts`

---

## 3. 模块内部方法与类的组织原则

`api/` 下不建议定义复杂 class。

推荐做法：

- 以函数为主
- 用少量 facade type 表达公共入口
- 把真正有状态的对象放在 `session/`

建议内容形态：

- `function`：公共 API 入口
- `type/interface`：输入输出 DTO
- `adapter function`：内部状态到公共返回值的映射

不建议内容形态：

- 在 `api/` 中重复定义运行时 manager
- 在 `api/` 中保存内部 registry
- 在 `api/` 中实现 query loop

---

## 4. 对 OpenCC 的对齐要求

Ark Code 的 `api/` 不是要复制 OpenCC 的文件结构，而是要把 OpenCC 原本分散在 `QueryEngine`、tool、task、resume、file-history 里的对外能力，收敛成稳定正式边界。

因此这里要保持两条约束：

- 对外能力集合对齐 OpenCC 的真实语义
- 外部调用方式比 OpenCC 更收敛、更稳定

当前结论：

- `api/` 是 Ark Code `engine-core` 的正式门面
- 任何外部调用都应先在这里定义，再落到底层实现
