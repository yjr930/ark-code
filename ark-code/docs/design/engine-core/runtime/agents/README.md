# runtime/agents 模块设计

## 0. 模块定位

`runtime/agents/` 负责 session 内 agent 执行语义。

它处理的不是单个工具调用，而是一个可持续交互、可恢复、可继续发送消息的 agent 生命周期。

---

## 1. 职责与要求

### 职责

- 发现 agent 定义
- 启动 agent
- 恢复 agent
- 向 agent 发送消息
- 构造 subagent 上下文
- 把 agent 纳入 task / transcript / notification 体系

### 要求

- agent 必须作为 session 内 runtime 存在，不能降级成外部黑盒服务
- agent 要和 task state、tool context、permission、transcript 协同
- spawn / resume / send-message 语义必须统一

---

## 2. 下属文件规划

```text
agents/
  registry.ts
  spawn-agent.ts
  resume-agent.ts
  send-agent-message.ts
  subagent-context.ts
```

### 2.1 registry.ts

职责：

- 管理 agent 定义集合

定义内容：

- `loadAgentDefinitions()`
- `listAvailableAgents()`
- `filterAgentsByAvailability()`
- `resolveAgentDefinition()`

OpenCC 参照代码：

- `opencc/src/tools/AgentTool/loadAgentsDir.ts`

### 2.2 spawn-agent.ts

职责：

- 启动新 agent

定义内容：

- `spawnAgent(session, request)`
- `runAgentForeground()`
- `runAgentBackground()`

OpenCC 参照代码：

- `opencc/src/tools/AgentTool/AgentTool.tsx`
- `opencc/src/tools/AgentTool/runAgent.ts`

### 2.3 resume-agent.ts

职责：

- 恢复既有 agent

定义内容：

- `resumeAgent(session, agentId, request)`
- `resumeBackgroundAgent()`
- `rehydrateAgentState()`

OpenCC 参照代码：

- `opencc/src/tools/AgentTool/resumeAgent.ts`
- `opencc/src/utils/sessionRestore.ts`

### 2.4 send-agent-message.ts

职责：

- 向已存在 agent 发送新消息

定义内容：

- `sendAgentMessage(session, toAgent, prompt)`
- `resolveTargetAgent()`
- `enqueueAgentMessage()`

OpenCC 参照代码：

- `opencc/src/tools/SendMessageTool/*`
- `opencc/src/tools/AgentTool/AgentTool.tsx`
- `opencc/src/remote/RemoteSessionManager.ts`

### 2.5 subagent-context.ts

职责：

- 构造 agent / subagent 执行上下文

定义内容：

- `createSubagentContext()`
- `cloneParentContextForAgent()`
- `buildAgentToolUseContext()`

逻辑要求：

- 明确哪些 state 共享、哪些复制、哪些隔离

OpenCC 参照代码：

- `opencc/src/tools/AgentTool/runAgent.ts`
- `opencc/src/utils/forkedAgent.ts`
- `opencc/src/Tool.ts`

---

## 3. 对 OpenCC 的对齐要求

Ark Code `runtime/agents` 要对齐 OpenCC AgentTool 体系的完整生命周期语义，包括：

- 定义发现
- 前台/后台运行
- resume
- 继续发送消息
- 与 task / transcript / context 的协同
