# OpenCC engine-core 盘点：会话状态、编排与恢复

## 1. Query 主循环 / Session State Machine

### 负责什么

- 是 OpenCC 会话执行的核心状态机
- 负责单轮内的消息构建、模型调用、tool round、compact/retry/recovery、附件注入与下一轮判定
- continuation reason 与 terminal result 都在这一层编码

### 关键代码路径

- `opencc/src/query.ts`
- `opencc/src/query/config.ts`
- `opencc/src/query/deps.ts`
- `opencc/src/query/stopHooks.ts`
- `opencc/src/query/tokenBudget.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/runner/`
- `packages/engine-core/model-loop/`
- `packages/engine-core/state/`
- `packages/engine-core/results/`

## 2. Model Loop / 模型调用与流式协议层

### 负责什么

- 真正与模型服务交互
- 组装 API request：system prompt、messages、tools schema、thinking config、cache headers、betas、budget 等
- 处理 streaming、usage、retry、fallback 与 cache 行为

### 关键代码路径

- `opencc/src/services/api/claude.ts`
- `opencc/src/query/deps.ts`
- `opencc/src/query.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/model-loop/`
- `packages/engine-core/prompt/`
- `packages/bridge/model_port.ts`

## 3. Tool Runner / Tool Orchestration

### 负责什么

- 把 assistant 产生的 `tool_use` 变成实际执行
- 控制串行/并行、安全并发、abort、错误扩散、context modifier 合并
- 是 OpenCC 中最接近 runner 的部分

### 关键代码路径

- `opencc/src/services/tools/toolOrchestration.ts`
- `opencc/src/services/tools/StreamingToolExecutor.ts`
- `opencc/src/query.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/runner/`
- `packages/engine-core/events/`
- `packages/engine-core/approval/`

## 4. Context Assembly / Prompt Compiler

### 负责什么

- 组装模型真正看到的 system/user context
- 组合默认 prompt、自定义 prompt、agent prompt、append prompt
- 构造 cache-safe prompt 前缀
- 处理消息标准化、tool_result 配对、API 发送前转换

### 关键代码路径

- `opencc/src/context.ts`
- `opencc/src/utils/queryContext.ts`
- `opencc/src/utils/systemPrompt.ts`
- `opencc/src/constants/prompts.ts`
- `opencc/src/utils/messages.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/context/`
- `packages/engine-core/prompt/`

## 5. 附件注入 / Context Delta / Recall Assembly

### 负责什么

- 把 memory recall、hook 响应、queued command、IDE/file/task 提示、agent listing 等增量信息注入上下文
- 实际上承担了 OpenCC 的 context 增量层

### 关键代码路径

- `opencc/src/utils/attachments.ts`
- `opencc/src/query.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/context/`
- `packages/engine-core/memory/`
- `packages/engine-core/results/`

## 6. Context Compaction / Overflow Recovery / Session Memory

### 负责什么

- 处理上下文超长与恢复
- 包括 snip、microcompact、autocompact、reactive compact、manual compact、session memory 驱动 compact、context collapse

### 关键代码路径

- `opencc/src/services/compact/autoCompact.ts`
- `opencc/src/services/compact/microCompact.ts`
- `opencc/src/services/compact/compact.ts`
- `opencc/src/services/SessionMemory/sessionMemory.ts`
- `opencc/src/commands/compact/compact.ts`
- `opencc/src/services/contextCollapse/index.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/context/`
- `packages/engine-core/memory/`
- `packages/engine-core/results/`

## 7. Agent / Subagent / Fork / Handoff 框架

### 负责什么

- 支持 subagent、fork child、background agent、resumed agent、per-agent MCP、per-agent transcript
- handoff 通过 task notification + SendMessage 语义实现

### 关键代码路径

- `opencc/src/tools/AgentTool/AgentTool.tsx`
- `opencc/src/tools/AgentTool/runAgent.ts`
- `opencc/src/tools/AgentTool/forkSubagent.ts`
- `opencc/src/tools/AgentTool/resumeAgent.ts`
- `opencc/src/tools/AgentTool/prompt.ts`
- `opencc/src/utils/forkedAgent.ts`
- `opencc/src/tasks/LocalAgentTask/LocalAgentTask.js`
- `opencc/src/tasks/RemoteAgentTask/RemoteAgentTask.js`
- `opencc/src/tools/shared/spawnMultiAgent.js`
- `opencc/src/context/mailbox.tsx`
- `opencc/src/hooks/useMailboxBridge.ts`
- `opencc/src/utils/teammate.js`
- `opencc/src/tools/SendMessageTool/*`
- `opencc/src/utils/worktree.js`
- `opencc/src/tools/AgentTool/worktreeIsolationVisibility.js`

### 对应 Ark Code 包建议

- `packages/engine-core/subagent/`
- `packages/engine-core/runner/`
- `packages/engine-core/mcp/`

## 8. Coordinator Mode / Planner-Orchestrator 语义层

### 负责什么

- 让主 agent 以 coordinator 方式工作
- 通过 prompt 和 context 规则实现 orchestration policy
- 管理 resume 时 coordinator/normal mode 匹配

### 关键代码路径

- `opencc/src/coordinator/coordinatorMode.ts`
- `opencc/src/tools/AgentTool/prompt.ts`
- `opencc/src/QueryEngine.ts`
- `opencc/src/query.ts`
- `opencc/src/tools/shared/spawnMultiAgent.js`
- `opencc/src/context/mailbox.tsx`

### 对应 Ark Code 包建议

- `packages/engine-core/planner/`
- `packages/engine-core/runner/`
- `packages/engine-core/subagent/`

### 备注

OpenCC 的 planner 更像 prompt-level planner，而不是显式 planner engine。

## 9. Runtime Session State / Bootstrap / AppState

### 负责什么

- 保存 sessionId、cwd/projectRoot、model、prompt cache、telemetry state、invoked skills、tasks、permissions、MCP、notifications 等运行态
- 是 runtime session register 与 UI/runtime 共享状态模型的组合

### 关键代码路径

- `opencc/src/bootstrap/state.ts`
- `opencc/src/state/AppStateStore.ts`
- `opencc/src/screens/REPL.tsx`

### 对应 Ark Code 包建议

- `packages/engine-core/state/`
- `packages/engine-core/events/`
- `packages/engine-core/results/`

## 10. Transcript / History / Continuation / Resume / Recovery

### 负责什么

- 管理历史记录、session transcript、resume、conversation recovery
- 覆盖 main session 与 subagent sidechain 两类持久化
- 恢复 interrupted turn、worktree、todo、file history、attribution、context collapse snapshot

### 关键代码路径

- `opencc/src/history.ts`
- `opencc/src/utils/sessionStorage.ts`
- `opencc/src/utils/conversationRecovery.ts`
- `opencc/src/utils/sessionRestore.ts`
- `opencc/src/assistant/sessionHistory.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/state/`
- `packages/engine-core/results/`
- `packages/engine-core/subagent/`
- `packages/bridge/host_port.ts`

## 11. Main / REPL / QueryEngine / Commands 入口编排层

### 负责什么

- 把 CLI、REPL、headless SDK、local command 都挂到同一套核心运行时上
- 实现 `/resume`、`/compact`、`/context`、`/clear` 等会话动作

### 关键代码路径

- `opencc/src/main.tsx`
- `opencc/src/screens/REPL.tsx`
- `opencc/src/QueryEngine.ts`
- `opencc/src/commands.ts`
- `opencc/src/commands/resume/index.ts`
- `opencc/src/commands/compact/compact.ts`
- `opencc/src/commands/context/context.tsx`
- `opencc/src/commands/clear/conversation.ts`
- `opencc/src/main.tsx` 中的 `--worktree` / `--tmux` / teammate 启动路径

### 对应 Ark Code 包建议

- `packages/engine-core/api/`
- `packages/server-host/runtime/`
- `apps/cli/`

## 12. Hooks 生命周期与 Stop / Continuation Gate

### 负责什么

- 管理 hook 配置、trust gating、命令执行、JSON output 解析
- 承接 SessionStart / SessionEnd / PreToolUse / PostToolUse / Stop / SubagentStart / SubagentStop 等生命周期
- stop hook 直接参与下一 turn 是否继续的判定

### 关键代码路径

- `opencc/src/utils/hooks.ts`
- `opencc/src/query/stopHooks.ts`
- `opencc/src/commands/hooks/index.ts`
- `opencc/src/jobs/classifier.js`
- `opencc/src/services/tools/toolExecution.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/approval/`
- `packages/engine-core/events/`
- `packages/engine-core/results/`

## 13. Remote / Bridge / 结果适配 / 远程 continuation

### 负责什么

- 处理远程 session 的创建、连接、事件桥接、permission 转发、结果适配与远程 continuation
- 是 results / continuation / remote resume 的另一条链路

### 关键代码路径

- `opencc/src/remote/RemoteSessionManager.ts`
- `opencc/src/remote/sdkMessageAdapter.ts`
- `opencc/src/bridge/createSession.ts`
- `opencc/src/bridge/sessionRunner.ts`

### 对应 Ark Code 包建议

- `packages/bridge/`
- `packages/server-host/runtime/`
- `packages/server-host/ui/`

## 14. 本文档的关键判断

### 明显应纳入 Ark Code engine-core 的主轴

- query loop / continuation / recovery
- model request/streaming/retry/fallback
- context assembly / prompt compiler / message normalization
- compaction / overflow recovery / session memory
- subagent / fork / resume / handoff
- transcript / recovery / resume
- stop hooks 这种运行门控能力

### 需要谨慎分边界的部分

- `AppStateStore.ts` 同时承载了 UI/runtime 状态，不宜原样进入 engine-core
- `main.tsx` / `REPL.tsx` 更像宿主入口壳层
- `remote/*` 与 `bridge/*` 应在 Ark Code 里更多落到 `bridge` 与 `server-host`，而不是 core 内部
