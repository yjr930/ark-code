# OpenCC engine-core 盘点：执行闭环与 workbench

## 1. 执行主循环 / Query Runner

### 负责什么

- 负责 turn 级执行循环
- 负责模型调用与 tool round
- 负责压缩、恢复、token budget、follow-up turn、终止原因判断
- `QueryEngine` 还提供更接近可程序化调用的 headless 入口

### 关键代码路径

- `opencc/src/query.ts`
- `opencc/src/QueryEngine.ts`
- `opencc/src/query/config.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/model-loop/`
- `packages/engine-core/runner/`
- `packages/engine-core/api/`

## 2. Tool 协议与工具池

### 负责什么

- 定义统一 Tool 抽象
- 定义输入 schema、权限检查、并发安全、只读/破坏性标记、UI 渲染能力
- 负责内置工具注册、MCP 工具并入、工具池组装与 feature gate 控制

### 关键代码路径

- `opencc/src/Tool.ts`
- `opencc/src/tools.ts`
- `opencc/src/tools/ToolSearchTool/prompt.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/workbench/` 下的 tool contract 层
- `packages/engine-core/mcp/discovery/`

## 3. Tool 执行编排

### 负责什么

- 把模型产出的 tool use 变成真正执行
- 管理串行/并发批次、streaming tool execution、tool result pairing
- 注入 hook、permission、telemetry、progress 等运行时行为

### 关键代码路径

- `opencc/src/services/tools/toolOrchestration.ts`
- `opencc/src/services/tools/toolExecution.ts`
- `opencc/src/services/tools/StreamingToolExecutor.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/runner/`
- `packages/engine-core/events/`
- `packages/engine-core/approval/`

## 4. Workbench / Shell Runtime

### 负责什么

- 提供本地 shell 执行能力
- 涵盖命令执行、sandbox、危险命令校验、前后台切换、CWD/reset、卡住检测、输出持久化

### 关键代码路径

- `opencc/src/tools/BashTool/BashTool.tsx`
- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`
- `opencc/src/utils/shell/shellProvider.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/workbench/shell/`
- `packages/engine-core/workbench/process/`
- `packages/engine-core/approval/`

## 5. Workbench / Files Runtime

### 负责什么

- 提供文件读写能力
- 支持文本、图片、PDF、notebook 等读取
- 同时处理路径规范化、读取限制、权限检查、文件读事件

### 关键代码路径

- `opencc/src/tools/FileReadTool/FileReadTool.ts`
- `opencc/src/tools/FileEditTool/FileEditTool.ts`
- `opencc/src/tools/FileWriteTool/FileWriteTool.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/workbench/files/`

## 6. Workbench / Patch-Edit Runtime

### 负责什么

- 承接 old/new string 编辑、diff/patch、sed 编辑预览等 patch 语义
- 当前能力存在，但还没有被抽成独立 runtime

### 关键代码路径

- `opencc/src/tools/FileEditTool/utils.ts`
- `opencc/src/tools/FileEditTool/types.ts`
- `opencc/src/tools/BashTool/sedEditParser.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/workbench/patch/`

### 备注

Ark Code 后续应主动把这部分拆成独立 patch 层，避免继续散落在 edit/bash 工具里。

## 7. Workbench / Search Runtime

### 负责什么

- 提供文件名搜索、文件内容搜索
- 负责搜索结果截断、分页、权限与只读判定

### 关键代码路径

- `opencc/src/tools/GrepTool/GrepTool.ts`
- `opencc/src/tools/GlobTool/GlobTool.ts`
- `opencc/src/utils/ripgrep.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/workbench/search/`

## 8. Task / Background Process Runtime

### 负责什么

- 统一任务 ID、状态机、输出文件、通知、kill/cleanup
- 管理本地 shell task、本地 agent task、remote agent task 等长生命周期作业

### 关键代码路径

- `opencc/src/Task.ts`
- `opencc/src/tasks.ts`
- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`
- `opencc/src/tasks/LocalAgentTask/LocalAgentTask.js`
- `opencc/src/tasks/RemoteAgentTask/RemoteAgentTask.js`

### 对应 Ark Code 包建议

- `packages/engine-core/workbench/process/`
- agent 类 task 再接 `packages/engine-core/subagent/`

## 9. Subagent / Coordinator / Worktree Isolation

### 负责什么

- 负责 agent spawn、子代理运行、前后台切换、worktree/remote 隔离、teammate/coordinator 模式
- 承载多代理协同与任务拆解接力

### 关键代码路径

- `opencc/src/tools/AgentTool/AgentTool.tsx`
- `opencc/src/tools/AgentTool/runAgent.ts`
- `opencc/src/tools/AgentTool/forkSubagent.ts`
- `opencc/src/tasks/LocalAgentTask/LocalAgentTask.js`
- `opencc/src/tasks/RemoteAgentTask/RemoteAgentTask.js`
- `opencc/src/tools/shared/spawnMultiAgent.js`
- `opencc/src/utils/worktree.js`
- `opencc/src/tools/AgentTool/worktreeIsolationVisibility.js`

### 对应 Ark Code 包建议

- `packages/engine-core/subagent/`
- `packages/engine-core/runner/`
- `packages/engine-core/workbench/snapshot/`

## 10. Context Assembly / Prompt Context

### 负责什么

- 把 git status、CLAUDE.md、日期等上下文注入模型请求
- 是 history、memory、workspace state 进入 prompt 的入口

### 关键代码路径

- `opencc/src/context.ts`
- `opencc/src/query.ts`
- `opencc/src/utils/queryContext.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/context/`
- `packages/engine-core/prompt/`

## 11. Runtime State / Session State

### 负责什么

- 保存 sessionId、cwd/projectRoot、cost/usage、turn budget、plan/auto mode、invoked skills、session flags 等执行态
- 是最接近 run/session state machine 的落点

### 关键代码路径

- `opencc/src/bootstrap/state.ts`
- `opencc/src/query.ts`
- `opencc/src/QueryEngine.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/state/`

## 12. MCP Runtime

### 负责什么

- 承接 MCP 工具、资源、server 连接状态、tool surface 合并与调用辅助
- 当前由 `services/mcp` 与 MCP tools 组合完成

### 关键代码路径

- `opencc/src/services/mcp/client.ts`
- `opencc/src/services/mcp/utils.ts`
- `opencc/src/tools/ListMcpResourcesTool/ListMcpResourcesTool.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/mcp/session/`
- `packages/engine-core/mcp/discovery/`
- `packages/engine-core/mcp/invoke/`
- `packages/engine-core/mcp/resources/`

## 13. Events / Progress / Notification Plane

### 负责什么

- 承接执行过程中的事件表达：tool progress、task 完成通知、SDK event、终端/输入事件、telemetry 事件
- 当前是多种事件机制并存，没有单一 core event model

### 关键代码路径

- `opencc/src/ink/events/event.ts`
- `opencc/src/services/tools/toolExecution.ts`
- `opencc/src/utils/sdkEventQueue.ts`
- `opencc/src/tasks/LocalAgentTask/LocalAgentTask.js`
- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`
- `opencc/src/remote/sdkMessageAdapter.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/events/`

### 备注

Ark Code 后续应将这部分收口成 typed domain events，再经由 bridge/server-host 投影到 UI/SDK/trace。

## 14. 不建议直接纳入 engine-core 的相关模块

以下模块虽和执行过程有关，但更适合作为宿主或桥接层：

### 14.1 Interactive Runtime / REPL / User Input Pipeline

- 负责文本 prompt、slash command、bash-mode 输入等交互壳层
- 代表代码：
  - `opencc/src/utils/processUserInput/processUserInput.ts`
  - `opencc/src/utils/processUserInput/processSlashCommand.tsx`
  - `opencc/src/tools/REPLTool/REPLTool.ts`
- 更适合放：`packages/server-host/runtime/`

### 14.2 Bridge / Remote Execution Adapter

- 负责本地 UI/CLI 与远端会话、child CLI、权限确认之间的桥接
- 代表代码：
  - `opencc/src/bridge/sessionRunner.ts`
  - `opencc/src/remote/remotePermissionBridge.ts`
  - `opencc/src/bridge/bridgeMain.ts`
- 更适合放：`packages/bridge/`

### 14.3 Server Hosting / Direct Connect / Session Hosting

- 负责 HTTP/WS session 生命周期和宿主 API
- 代表代码：
  - `opencc/src/server/server.ts`
  - `opencc/src/server/sessionManager.ts`
  - `opencc/src/server/backends/dangerousBackend.ts`
- 更适合放：`packages/server-host/runtime/`

### 14.4 React AppState / Context 投影层

- 负责 UI 状态投影，不是 core 执行态本身
- 代表代码：
  - `opencc/src/state/AppState.tsx`
  - `opencc/src/state/AppStateStore.ts`
  - `opencc/src/context/mailbox.tsx`
- 更适合放：`packages/server-host/ui/`
