# Engine Core 整体架构

## 0. 文档目标

本文定义 Ark Code `engine-core` 的整体架构。

本文回答四个问题：

- `engine-core` 在 Ark Code 中承担什么职责
- `engine-core` 的主干骨架由哪几块组成
- `engine-core` 对外提供什么接口、要求宿主注入什么 port
- `engine-core` 的推荐模块目录如何分配

本文是当前实现目标的正式设计基线。后续 `packages/engine-core` 的工程落地、`bridge` 协议设计、`server-host` 对接，都应以本文为准。

---

## 1. 定位与边界

Ark Code 的总体边界是：

- `engine-core` 负责一个 session 在内部完成完整工作的执行闭环
- `server-host` 负责 CLI / Web / provider / persistence / UI / 托管
- `bridge` 负责 `engine-core` 和 `server-host` 之间的协议映射

对于 `engine-core`，边界进一步收敛为：

- 自己拥有 session state
- 自己拥有 turn 执行主循环
- 自己拥有 tool runtime / task runtime / agent runtime
- 自己拥有 continuation / compact / approval / recovery / transcript / file-history / attribution 语义
- 通过公共 API 被宿主调用
- 通过 port 接口向宿主请求外部能力

不放入 `engine-core` 的内容：

- CLI / Web / TUI 壳
- provider transport 细节
- OAuth / token 获取
- MCP 配置发现与外部认证
- session server / remote bridge 托管
- 外部事件消费与通知落地

因此，`engine-core` 是一个可编程调用的 session 执行内核，不是 CLI 壳，也不是 provider SDK。

---

## 2. 整体骨架

`engine-core` 的主干骨架分为 6 块：

1. Session Engine
2. Context Assembly
3. Query Loop
4. Tool Runtime
5. Task / Agent Runtime
6. State / Persistence / Event Projection

运行时关系如下：

```text
submitInput(session, input)
  -> Session Engine
     -> Context Assembly
     -> Query Loop
        -> Tool Runtime
           -> Task / Agent Runtime
        -> continuation / compact / approval
     -> State / Persistence / Event Projection
  -> EngineEvent stream / EngineTurnResult
```

这 6 块不是并列散点模块，而是一条稳定主链：

- `Session Engine` 是会话外层 orchestrator
- `Context Assembly` 为本轮执行准备上下文
- `Query Loop` 驱动模型与工具主循环
- `Tool Runtime` 提供模型可调度能力面
- `Task / Agent Runtime` 提供异步执行与后台运行能力
- `State / Persistence / Event Projection` 保证状态推进、恢复和外部投影语义完整

---

## 3. 六大骨架的职责与边界

### 3.1 Session Engine

职责：

- 创建 session
- 恢复 session
- 管理 turn 生命周期
- 管理 session 级 mutable state
- 暴露 turn 输入入口
- 暴露终止、销毁、快照、恢复接口

这一层是 `engine-core` 唯一的统一入口。

它持有的核心 session 状态至少包括：

- message history
- abort controller
- read-file cache / file state cache
- permission / approval 相关累计状态
- usage / budget 统计
- task registry / agent registry
- MCP client 可见集
- file-history / attribution / transcript 关联状态

### 3.2 Context Assembly

职责：

- 组装 system prompt
- 组装 user context
- 组装 system context
- 注入 git 状态、日期、CLAUDE.md、memory、cwd 等上下文
- 组装本轮工具集合、agent 定义、MCP 可见信息
- 生成本轮 query 可直接消费的上下文对象

这一层不对宿主直接暴露。宿主只能通过 `submitInput()` 间接使用。

### 3.3 Query Loop

职责：

- 执行模型调用
- 处理流式输出
- 识别 tool use / tool result
- 执行 continuation
- 处理 compact / context collapse / snip
- 检查 turn budget / task budget / max turns / max budget
- 管理 stop reason
- 形成最终 turn result

这一层是 engine-core 的模型语义核心。它不关心 CLI 如何展示，也不关心 provider transport 如何实现；它只关心 session 语义是否完整推进。

### 3.4 Tool Runtime

职责：

- 组装 builtin tools、synthetic tools、MCP tools、skill tools
- 暴露统一 tool schema
- 查找工具、校验输入、执行工具调用
- 管理工具权限与 approval 过程
- 组装 tool use context
- 刷新工具池与可见资源

这一层是模型可调用能力的统一平面。

Ark Code 第一阶段至少需要在这里保留：

- shell / bash
- read / edit / write
- glob / grep
- task 系列
- plan / ask-user / skill
- MCP resource 读取

### 3.5 Task / Agent Runtime

职责：

- 管理后台任务模型
- 管理 shell task 生命周期
- 管理 local agent / remote agent 生命周期
- 管理 foreground / background 切换
- 提供任务输出读取
- 提供 stop / resume / send-message 等控制能力

这块属于 `engine-core`，不属于 `server-host`。因为它是 session 内执行语义的一部分，不只是操作系统进程托管。

### 3.6 State / Persistence / Event Projection

职责：

- 管理 transcript 记录
- 管理 flush / resume / restore
- 管理 file-history snapshot / rewind
- 管理 attribution 状态
- 管理 compact boundary 之后的状态裁剪
- 管理内部事件到 SDK / bridge / host event 的投影
- 管理 result / notification / progress 的统一出流

这块必须和 Query Loop 一起设计，不能被视为“附属存储层”。

因为对于 code agent，resume、rewind、compact、task notification、tool progress 都是核心执行语义，不是可选增强项。

---

## 4. 对外正式边界

`engine-core` 的正式边界由两部分组成：

1. 对外调用接口
2. 宿主注入 port

### 4.1 对外调用接口

#### 4.1.1 Session 生命周期

- `createSessionEngine(config) -> EngineSession`
- `resumeSessionEngine(config, restoredState) -> EngineSession`
- `destroySession(session) -> Promise<void>`
- `forkSession(session, options) -> EngineSession`
- `snapshotSession(session) -> EngineSessionSnapshot`
- `restoreSession(snapshot, config) -> EngineSession`
- `getSessionState(session) -> EngineSessionState`

#### 4.1.2 Turn 执行控制

- `submitInput(session, input, options) -> AsyncGenerator<EngineEvent, EngineTurnResult>`
- `abortTurn(session, reason?) -> Promise<void>`

#### 4.1.3 Task / Agent 控制

- `listTasks(session) -> EngineTask[]`
- `getTask(session, taskId) -> EngineTask | undefined`
- `readTaskOutput(session, taskId, options) -> Promise<TaskOutputResult>`
- `killTask(session, taskId) -> Promise<void>`
- `listAvailableAgents(session) -> AgentDefinition[]`
- `spawnAgent(session, request) -> Promise<AgentSpawnResult>`
- `resumeAgent(session, agentId, request) -> Promise<AgentResumeResult>`
- `sendAgentMessage(session, toAgent, prompt) -> Promise<void>`

#### 4.1.4 MCP / Resume / Rewind

- `attachMcpClients(session, clients) -> void`
- `detachMcpClient(session, clientName) -> void`
- `listMcpClients(session) -> MCPServerConnection[]`
- `listMcpResources(session) -> Record<string, ServerResource[]>`
- `refreshMcpResources(session) -> Promise<void>`
- `readMcpResource(session, request) -> Promise<McpResourceResult>`
- `loadConversationForResume(locator, sourceFile?) -> Promise<ResumeLoadResult>`
- `rewindFiles(session, userMessageId, options) -> Promise<RewindResult>`
- `canRewindFiles(session, userMessageId) -> boolean`
- `getRewindDiffStats(session, userMessageId) -> Promise<DiffStats | null>`

### 4.2 宿主注入 Port

#### 4.2.1 Model Port

- `ModelPort.callModel(request) -> AsyncGenerator<ModelStreamEvent, ModelResult>`

#### 4.2.2 Permission Port

- `PermissionPort.canUseTool(request) -> Promise<PermissionDecision>`
- `PermissionPort.requestPrompt(request) -> Promise<PromptResponse>`
- `PermissionPort.handleElicitation(request) -> Promise<ElicitResult>`

#### 4.2.3 Session Store Port

- `SessionStorePort.recordTranscript(request) -> Promise<void>`
- `SessionStorePort.flush(request) -> Promise<void>`
- `SessionStorePort.loadConversationForResume(request) -> Promise<ResumeLoadResult>`
- `SessionStorePort.processResumedConversation?(request) -> Promise<ProcessedResume>`

#### 4.2.4 File System Port

- `FileSystemPort.readFileState(request) -> Promise<FileState>`
- `FileSystemPort.snapshotFileState(request) -> Promise<FileSnapshotResult>`

#### 4.2.5 Event / Notification Port

- `EventSinkPort.emit(event) -> Promise<void> | void`
- `NotificationPort.enqueue(notification) -> void`

#### 4.2.6 MCP Runtime Port

- `McpRuntimePort.listClients() -> MCPServerConnection[]`
- `McpRuntimePort.listResources() -> Record<string, ServerResource[]>`

#### 4.2.7 Host State / Infra Port

- `HostStatePort.getAppState() -> EngineHostState`
- `HostStatePort.setAppState(updater) -> void`
- `ClockPort.now() -> number`
- `IdPort.uuid() -> string`

---

## 5. 内部能力分层

为了让对外边界稳定，`engine-core` 内部按下面 5 层组织：

### 5.1 API Layer

职责：

- 对外导出稳定 API
- 做 session 实例与内部模块的组装
- 不承载复杂业务逻辑

对应能力：

- session create / restore / destroy
- submit / abort
- task / agent / mcp 的外部控制入口

### 5.2 Orchestration Layer

职责：

- 管理 turn 级编排
- 串联 context assembly、query loop、tool runtime、event projection
- 维护 session 内部状态推进规则

对应能力：

- Session Engine
- Query Loop orchestration
- compact / continuation / stop conditions

### 5.3 Runtime Layer

职责：

- 承载工具运行时
- 承载 task / agent 运行时
- 承载 MCP runtime / skill runtime
- 承载 permission / approval / hook 编排

对应能力：

- tools
- tasks
- agents
- hooks
- mcp
- skills

### 5.4 State Layer

职责：

- 承载 session state 数据模型
- 承载 transcript / file-history / attribution / snapshot / restore 数据结构
- 承载 event / result / notification 的内部表示

### 5.5 Port Adapter Layer

职责：

- 定义宿主能力接口
- 将 query loop / runtime 对外部依赖的调用统一收口到 ports
- 保证 `engine-core` 不直接依赖 CLI / provider / storage 的具体实现

---

## 6. 模块目录分配

`packages/engine-core` 推荐按下面目录落地。

```text
packages/engine-core/
  README.md
  package.json
  tsconfig.json
  src/
    index.ts

    api/
      session.ts
      task.ts
      agent.ts
      mcp.ts
      rewind.ts

    session/
      engine.ts
      engine-factory.ts
      session-state.ts
      snapshot.ts
      restore.ts
      fork.ts

    context/
      system-context.ts
      user-context.ts
      prompt-builder.ts
      context-assembly.ts
      claude-md.ts
      memory.ts
      git-status.ts

    query/
      run-turn.ts
      query-loop.ts
      model-step.ts
      continuation.ts
      compact.ts
      snip.ts
      budget.ts
      stop-reason.ts

    runtime/
      tools/
        registry.ts
        execute-tool.ts
        validate-input.ts
        tool-context.ts
        refresh-tools.ts
        builtins/
        synthetic/
      tasks/
        registry.ts
        task-state.ts
        spawn-shell-task.ts
        stop-task.ts
        read-task-output.ts
      agents/
        registry.ts
        spawn-agent.ts
        resume-agent.ts
        send-agent-message.ts
        subagent-context.ts
      mcp/
        runtime.ts
        resources.ts
        clients.ts
      skills/
        runtime.ts
        discovery.ts
      hooks/
        runtime.ts
        session-hooks.ts
      permission/
        can-use-tool.ts
        request-prompt.ts
        elicitation.ts
        approval-state.ts

    state/
      messages/
        message-model.ts
        message-normalization.ts
      transcript/
        transcript-store.ts
        transcript-events.ts
      file-history/
        snapshot.ts
        rewind.ts
        diff-stats.ts
      attribution/
        attribution-state.ts
      events/
        engine-event.ts
        event-projection.ts
      result/
        turn-result.ts
      app-state/
        host-state.ts
        engine-state.ts

    ports/
      model-port.ts
      permission-port.ts
      session-store-port.ts
      filesystem-port.ts
      event-sink-port.ts
      notification-port.ts
      mcp-runtime-port.ts
      host-state-port.ts
      clock-port.ts
      id-port.ts

    types/
      public.ts
      internal.ts

    utils/
      abort.ts
      ids.ts
      time.ts
      errors.ts
```

### 6.1 api/

职责：

- 对外导出正式公共接口
- 只做参数校验、对象组装、调用分发
- 不直接包含 query loop 细节

要求：

- 外部调用 `engine-core` 时，只能经由这里暴露的 API
- `server-host` 与 `bridge` 不应直接 import `runtime/` 或 `query/` 内部实现

### 6.2 session/

职责：

- 管理 session 实例
- 维护 session 级 mutable state
- 承担 create / resume / fork / snapshot / restore 主逻辑

这是外层 orchestrator 所在目录。

### 6.3 context/

职责：

- 组装本轮 query 需要的上下文
- 管理 prompt 构建
- 汇总 CLAUDE.md、memory、git status、日期等来源

### 6.4 query/

职责：

- 管理 turn 主循环
- 管理 continuation / compact / snip / token budget
- 管理模型步进语义

这部分是 engine-core 的执行中枢。

### 6.5 runtime/

职责：

- 承载工具、任务、agent、MCP、skill、hook、permission 等运行时子系统

约束：

- `runtime/tools` 不直接依赖 `server-host` 具体实现，只依赖 `ports`
- `runtime/tasks` 与 `runtime/agents` 保持统一任务状态模型
- `runtime/mcp` 只处理 session 内可见 client / resource 语义，不负责外部发现和认证

### 6.6 state/

职责：

- 承载 message、event、result、transcript、file-history、attribution 等核心状态模型
- 承载对 rewind / resume / projection 必须保留的结构

### 6.7 ports/

职责：

- 定义全部外部依赖接口
- 保证 engine-core 的纯边界

约束：

- 任何涉及 provider、存储、通知、宿主状态的调用，必须先抽象成 port
- 不允许 query loop 直接依赖具体 CLI、Web、数据库、provider SDK

### 6.8 types/

职责：

- 统一管理公共类型和内部类型
- 区分稳定对外类型与内部实现类型

---

## 7. 模块依赖规则

目录之间必须遵守下面依赖方向：

```text
api -> session -> context/query/runtime/state/ports
query -> runtime/state/ports
runtime -> state/ports/types/utils
state -> types/utils
ports -> types
```

补充约束：

- `api` 可以依赖所有内部模块，但只有它负责对外导出
- `query` 不允许反向依赖 `api`
- `runtime` 不允许依赖 `server-host` 或 `bridge`
- `state` 不允许依赖 `runtime`
- `ports` 只定义边界，不实现宿主逻辑

这样做的目的有两个：

1. 保证 `engine-core` 可以被独立测试和独立嵌入
2. 保证 `bridge` 与 `server-host` 只能通过正式边界接入，不会侵入内部执行面

---

## 8. 与 OpenCC 的来源映射

Ark Code `engine-core` 的设计直接对齐 OpenCC 主干，不另发明一套执行逻辑。

### 8.1 OpenCC 来源主干

- Session Engine：`opencc/src/QueryEngine.ts`
- Context Assembly：`opencc/src/context.ts`
- Query Loop：`opencc/src/query.ts`
- Tool Runtime：`opencc/src/Tool.ts`、`opencc/src/tools.ts`、`opencc/src/tools/*`
- Task / Agent Runtime：`opencc/src/Task.ts`、`opencc/src/tasks.ts`、`opencc/src/tasks/*`、`opencc/src/tools/AgentTool/*`
- State / Persistence / Event Projection：`QueryEngine` 内 transcript / compact / result 处理，以及 `fileHistory`、`sessionRestore`、`conversationRecovery` 等相关实现

### 8.2 对 Ark Code 的直接约束

- Ark Code 必须保留 OpenCC 的 session 内执行闭环语义
- 可以改变工程分层和目录位置
- 不能改变核心执行链条的实际逻辑顺序
- 不能因为拆模块而削弱 continuation / compact / rewind / transcript / approval / agent runtime 语义

允许变化的是：

- 工程拆分方式
- port 注入方式
- bridge 协议形态
- 宿主状态承载位置

不允许变化的是：

- session 内 query loop 的核心语义
- tool runtime 的统一调度语义
- task / agent 的生命周期语义
- resume / rewind / transcript / compact 的状态语义
