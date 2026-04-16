# OpenCC engine-core 防漏清单

本文档用于在 Ark Code 实现 `engine-core` 时做逐项核对，确保 OpenCC 已有的重要能力不会在重构过程中被遗漏。

## 1. query / session state machine

- [ ] Query 主循环
- [ ] continuation reason 建模
- [ ] terminal result 建模
- [ ] max turns / token budget continuation
- [ ] prompt-too-long recovery
- [ ] max_output_tokens recovery
- [ ] stop hook gate

## 2. model loop

- [ ] model request builder
- [ ] streaming chunk 处理
- [ ] usage 聚合
- [ ] retry / fallback
- [ ] cache / prompt caching 行为
- [ ] provider-neutral request / chunk normalization

## 3. context / prompt

- [ ] system context 注入
- [ ] user context 注入
- [ ] CLAUDE.md 注入
- [ ] prompt section 组装
- [ ] effective system prompt 优先级链
- [ ] message normalize / pairing
- [ ] attachment 增量注入
- [ ] deferred tools / MCP delta 注入
- [ ] final LLM request assembly pipeline

## 3.1 selection / assembly / injection

- [ ] agent 候选筛选（MCP requirements + permission deny）
- [ ] agent listing 注入路径（prompt vs attachment）
- [ ] tool pool assemble + resolve
- [ ] deferred tools 渐进暴露
- [ ] skill conditional activation
- [ ] skill listing 预算裁剪
- [ ] SkillTool forked prompt 组装
- [ ] MCP tools / commands / resources merge 链
- [ ] attachment 统一装配层
- [ ] 条件激活 / 条件暴露机制

## 4. workbench

### shell
- [ ] shell exec
- [ ] sandbox / cwd / env
- [ ] dangerous command gating
- [ ] foreground / background command
- [ ] stdout / stderr 持久化

### files
- [ ] read text
- [ ] read image
- [ ] read pdf
- [ ] read notebook
- [ ] write
- [ ] edit

### patch
- [ ] old/new string patch
- [ ] diff / edit 语义
- [ ] sed-style patch 兼容或替代方案

### search
- [ ] grep
- [ ] glob
- [ ] ripgrep 封装
- [ ] code search 边界

### process / task
- [ ] task id / task status
- [ ] background shell task
- [ ] local agent task
- [ ] remote agent task
- [ ] output file / offset
- [ ] kill / cleanup / notification
- [ ] agent summary / progress aggregation

### shell approval surface
- [ ] bash path validation
- [ ] sed validation
- [ ] filesystem boundary by permission mode

## 5. subagent / orchestration

- [ ] Agent tool runtime
- [ ] forked subagent
- [ ] resumed subagent
- [ ] handoff / SendMessage 语义
- [ ] coordinator mode
- [ ] prompt-level planner / delegation policy
- [ ] worktree isolation
- [ ] worktree visibility / prompt exposure
- [ ] per-agent transcript
- [ ] per-agent MCP
- [ ] teammate / mailbox 支撑链
- [ ] multi-agent spawn surface
- [ ] subagent task registration

## 5.1 subagent supporting surfaces

- [ ] LocalAgentTask
- [ ] RemoteAgentTask
- [ ] spawnMultiAgent
- [ ] teammate utils
- [ ] mailbox bridge
- [ ] SendMessageTool
- [ ] worktree create / cleanup / dirty check
- [ ] agent summary / partial result extraction

## 6. transcript / history / resume / recovery

- [ ] transcript store
- [ ] sidechain transcript
- [ ] interrupted turn detection
- [ ] conversation recovery
- [ ] session restore
- [ ] file history restore
- [ ] attribution restore
- [ ] todo restore
- [ ] context collapse state restore

## 7. hooks / gates

- [ ] hook registration
- [ ] skill hook
- [ ] frontmatter hook
- [ ] async hook registry
- [ ] stop hook continuation gate
- [ ] hook response attachment

## 8. MCP runtime

- [ ] MCP config merge
- [ ] scope / policy filter
- [ ] transport model
- [ ] connection lifecycle
- [ ] tools / prompts / resources load
- [ ] MCP commands merge
- [ ] MCP resources merge
- [ ] MCP prompts merge
- [ ] reconnect / backoff / session expired
- [ ] OAuth auth
- [ ] XAA auth
- [ ] official registry / Claude.ai connector / enterprise policy
- [ ] elicitation runtime
- [ ] channel notification
- [ ] channel permission
- [ ] MCP skill 接入
- [ ] large output / binary artifact handling
- [ ] useManageMCPConnections integration surface
- [ ] REPL/runtime merge surface

## 9. skills

- [ ] local skills
- [ ] bundled skills
- [ ] MCP skills
- [ ] legacy `/commands/` as skills
- [ ] skill registry
- [ ] command adapter
- [ ] skill resource extraction

## 10. approval / permission

- [ ] permission context
- [ ] resolveOnce / claim 多路竞态
- [ ] rules loader / parser
- [ ] mode 切换
- [ ] local interactive approval
- [ ] bridge remote approval
- [ ] channel approval relay
- [ ] coordinator / swarm worker approval
- [ ] classifier path
- [ ] speculative classifier with tool execution
- [ ] permission audit logging

## 11. memory / attachments / artifacts

- [ ] memory taxonomy
- [ ] memory scan / memory command
- [ ] session memory extraction
- [ ] nested memory injection
- [ ] current session memory injection
- [ ] hook attachment
- [ ] MCP instructions delta
- [ ] queued command attachment
- [ ] binary/blob artifact storage
- [ ] user attachment ingest

## 12. events / observability

- [ ] tool progress event
- [ ] task notification event
- [ ] SDK event queue
- [ ] approval event
- [ ] MCP event
- [ ] subagent event
- [ ] bridge / remote event adapter
- [ ] compact boundary event
- [ ] result projection event
- [ ] typed domain event 统一模型

## 13. 需要谨慎分边界的部分

这些能力和 engine-core 强相关，但在 Ark Code 中不宜直接照搬进 core：

- [ ] `bridge/*` 应更多沉到 `packages/bridge/`
- [ ] `server/*` 应更多沉到 `packages/server-host/`
- [ ] `state/AppStateStore.ts` 需要拆 UI/runtime 混合态
- [ ] `main.tsx` / `REPL.tsx` 作为宿主入口壳层处理
- [ ] `tools/REPLTool/*` 与 `utils/processUserInput/*` 保持在交互层

## 14. 当前最容易被漏掉的高风险项

优先在 Ark Code 里显式建模以下高风险能力：

- [ ] patch runtime
- [ ] typed events
- [ ] continuation / recovery policy
- [ ] attachment runtime
- [ ] multi-path approval model
- [ ] MCP reconnect / session-expired 语义
- [ ] session memory 与 compaction 协同
- [ ] sidechain transcript / subagent resume

## 15. runtime waiting / continuation / output handoff

- [ ] background bash entry path
- [ ] user-triggered backgrounding
- [ ] assistant auto-backgrounding
- [ ] LocalShellTask background flow
- [ ] stall watchdog / interactive prompt detection
- [ ] task-notification protocol
- [ ] task output file continuation surface
- [ ] TaskOutputTool / Read handoff surface
- [ ] LocalAgentTask transcript symlink output
- [ ] pending message drain for subagents
- [ ] elicitation queue / response / completion flow
- [ ] permission waiting queues
- [ ] capacity wait / wake
- [ ] remote reconnect / retry budget
- [ ] output handoff into later turns

## 16. 文档完整性核对

- [ ] 功能本体已盘点
- [ ] 候选筛选机制已盘点
- [ ] prompt / runtime 装配链已盘点
- [ ] attachment 注入路径已盘点
- [ ] 条件激活 / 条件暴露机制已盘点
- [ ] 后台任务 / waiting state / continuation 已盘点
- [ ] 与 Ark Code 包边界映射已盘点

## 4. workbench

### shell
- [ ] shell exec
- [ ] sandbox / cwd / env
- [ ] dangerous command gating
- [ ] foreground / background command
- [ ] stdout / stderr 持久化

### files
- [ ] read text
- [ ] read image
- [ ] read pdf
- [ ] read notebook
- [ ] write
- [ ] edit

### patch
- [ ] old/new string patch
- [ ] diff / edit 语义
- [ ] sed-style patch 兼容或替代方案

### search
- [ ] grep
- [ ] glob
- [ ] ripgrep 封装
- [ ] code search 边界

### process / task
- [ ] task id / task status
- [ ] background shell task
- [ ] local agent task
- [ ] remote agent task
- [ ] output file / offset
- [ ] kill / cleanup / notification
- [ ] agent summary / progress aggregation

### shell approval surface
- [ ] bash path validation
- [ ] sed validation
- [ ] filesystem boundary by permission mode

## 5. subagent / orchestration

- [ ] Agent tool runtime
- [ ] forked subagent
- [ ] resumed subagent
- [ ] handoff / SendMessage 语义
- [ ] coordinator mode
- [ ] prompt-level planner / delegation policy
- [ ] worktree isolation
- [ ] worktree visibility / prompt exposure
- [ ] per-agent transcript
- [ ] per-agent MCP
- [ ] teammate / mailbox 支撑链
- [ ] multi-agent spawn surface
- [ ] subagent task registration

## 5.1 subagent supporting surfaces

- [ ] LocalAgentTask
- [ ] RemoteAgentTask
- [ ] spawnMultiAgent
- [ ] teammate utils
- [ ] mailbox bridge
- [ ] SendMessageTool
- [ ] worktree create / cleanup / dirty check
- [ ] agent summary / partial result extraction

## 6. transcript / history / resume / recovery

- [ ] transcript store
- [ ] sidechain transcript
- [ ] interrupted turn detection
- [ ] conversation recovery
- [ ] session restore
- [ ] file history restore
- [ ] attribution restore
- [ ] todo restore
- [ ] context collapse state restore

## 7. hooks / gates

- [ ] hook registration
- [ ] skill hook
- [ ] frontmatter hook
- [ ] async hook registry
- [ ] stop hook continuation gate
- [ ] hook response attachment

## 8. MCP runtime

- [ ] MCP config merge
- [ ] scope / policy filter
- [ ] transport model
- [ ] connection lifecycle
- [ ] tools / prompts / resources load
- [ ] MCP commands merge
- [ ] MCP resources merge
- [ ] MCP prompts merge
- [ ] reconnect / backoff / session expired
- [ ] OAuth auth
- [ ] XAA auth
- [ ] official registry / Claude.ai connector / enterprise policy
- [ ] elicitation runtime
- [ ] channel notification
- [ ] channel permission
- [ ] MCP skill 接入
- [ ] large output / binary artifact handling
- [ ] useManageMCPConnections integration surface
- [ ] REPL/runtime merge surface

## 9. skills

- [ ] local skills
- [ ] bundled skills
- [ ] MCP skills
- [ ] legacy `/commands/` as skills
- [ ] skill registry
- [ ] command adapter
- [ ] skill resource extraction

## 9. skills

- [ ] local skills
- [ ] bundled skills
- [ ] MCP skills
- [ ] skill registry
- [ ] command adapter
- [ ] skill resource extraction

## 10. approval / permission

- [ ] permission context
- [ ] resolveOnce / claim 多路竞态
- [ ] rules loader / parser
- [ ] mode 切换
- [ ] local interactive approval
- [ ] bridge remote approval
- [ ] channel approval relay
- [ ] coordinator / swarm worker approval
- [ ] classifier path
- [ ] speculative classifier with tool execution
- [ ] permission audit logging

## 12. events / observability

- [ ] tool progress event
- [ ] task notification event
- [ ] SDK event queue
- [ ] approval event
- [ ] MCP event
- [ ] subagent event
- [ ] bridge / remote event adapter
- [ ] compact boundary event
- [ ] result projection event
- [ ] typed domain event 统一模型

## 11. memory / attachments / artifacts

- [ ] memory taxonomy
- [ ] memory scan / memory command
- [ ] session memory extraction
- [ ] nested memory injection
- [ ] current session memory injection
- [ ] hook attachment
- [ ] MCP instructions delta
- [ ] queued command attachment
- [ ] binary/blob artifact storage
- [ ] user attachment ingest

## 12. events / observability

- [ ] tool progress event
- [ ] task notification event
- [ ] SDK event queue
- [ ] approval event
- [ ] MCP event
- [ ] subagent event
- [ ] result projection event
- [ ] typed domain event 统一模型

## 13. 需要谨慎分边界的部分

这些能力和 engine-core 强相关，但在 Ark Code 中不宜直接照搬进 core：

- [ ] `bridge/*` 应更多沉到 `packages/bridge/`
- [ ] `server/*` 应更多沉到 `packages/server-host/`
- [ ] `state/AppStateStore.ts` 需要拆 UI/runtime 混合态
- [ ] `main.tsx` / `REPL.tsx` 作为宿主入口壳层处理
- [ ] `tools/REPLTool/*` 与 `utils/processUserInput/*` 保持在交互层

## 14. 当前最容易被漏掉的高风险项

优先在 Ark Code 里显式建模以下高风险能力：

- [ ] patch runtime
- [ ] typed events
- [ ] continuation / recovery policy
- [ ] attachment runtime
- [ ] multi-path approval model
- [ ] MCP reconnect / session-expired 语义
- [ ] session memory 与 compaction 协同
- [ ] sidechain transcript / subagent resume
