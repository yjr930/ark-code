# Ark Code engine-core 详细架构规划

## 1. 文档目的

本文档基于两套盘点输入：

- `docs/engine-core-inventory/`：工程模块视角盘点
- `docs/runtime-loop-inventory/`：运行时闭环视角盘点

目标不是给出“先做什么”，而是定义 Ark Code `engine-core` 的完整目标架构：

- 每个包负责什么
- 每个子组件负责什么
- 各层之间如何协作
- 哪些功能必须显式建模，不能只靠临时 glue code 拼出来

本文档默认 `engine-core` 是一个**可程序化调用的、状态驱动的、带完整 continuation/recovery 语义的执行内核**。

---

## 2. 设计原则

### 2.1 engine-core 的边界

凡是一个 session 在本地工作区里完成完整工作的能力，都放在 `engine-core`。

包括：

- query loop / run state machine
- context assembly / prompt compilation / request assembly
- tool orchestration
- workbench runtime
- subagent / handoff / sidechain transcript
- skill runtime
- MCP runtime 的会话内语义
- approval / waiting / continuation / recovery
- memory / artifact / result / event semantics

不放在 `engine-core` 的包括：

- HTTP / SSE / WS / Web UI
- provider SDK / transport 接入
- MCP server process / socket / secret 托管
- session / message / artifact / checkpoint 的底层存储实现
- UI 状态投影与 React/Ink 宿主逻辑

### 2.2 两套视角同时约束架构

模块视角保证：

- 包边界清晰
- 代码组织稳定
- 依赖方向可控

运行时闭环视角保证：

- 入口、筛选、装配、执行、等待、continuation、回流语义完整
- 不因为只“把模块搬齐”而丢掉真实行为

因此 Ark Code 的 `engine-core` 设计必须同时满足：

- **包边界完整**
- **运行时闭环完整**

### 2.3 一等公民化的高风险能力

以下能力必须在设计里作为一级组件显式建模：

- patch runtime
- typed events
- attachment runtime
- continuation / recovery policy
- multi-path approval model
- session memory 与 compaction 协同
- output handoff
- sidechain transcript / subagent resume
- MCP reconnect / session-expired 语义

---

## 3. 目标层级结构

`engine-core/src/` 下的目录不应被理解为 18 个完全并列的功能包。目标结构应表达为 5 层：

```text
packages/engine-core/src/
  core/
    api/
    session/
    state/
  assembly/
    context/
    prompt/
    model-loop/
  execution/
    runner/
    planner/
    workbench/
      shell/
      files/
      patch/
      search/
      process/
      snapshot/
  domains/
    subagent/
    skills/
    mcp/
      config/
      auth/
      session/
      discovery/
      invoke/
      resources/
      prompts/
      roots/
      channels/
      elicitation/
      recovery/
  semantics/
    approval/
    memory/
    artifacts/
    results/
    events/
    hooks/
```

### 3.1 分层说明

- `core/`：会话骨架层，定义 programmatic API、session 长期语义、运行状态模型
- `assembly/`：推理装配层，负责 context、prompt、request、model-loop
- `execution/`：执行编排层，负责 query loop、tool round、scheduler 与本地 workbench
- `domains/`：高级能力域层，负责 subagent、skills、MCP 这类复杂执行域
- `semantics/`：横切语义层，负责 approval、memory、artifacts、results、events、hooks

### 3.2 结构判断

- `planner` 不是和 `runner` 对称的重型执行器，而是 execution 层中的 policy 组件
- `subagent/skills/mcp` 不属于骨架层，它们是 execution 之上调度的高级能力域
- `approval/memory/artifacts/results/events/hooks` 不应被理解成普通业务功能包，而是跨阶段共享语义

### 3.3 当前目录与目标层级的映射

当前仓库中的最小骨架仍是平铺目录。目标层级映射如下：

- `api/session/state` → `core/`
- `context/prompt/model-loop` → `assembly/`
- `runner/planner/workbench` → `execution/`
- `subagent/skills/mcp` → `domains/`
- `approval/memory/artifacts/results/events/hooks` → `semantics/`

后续真实实现即使暂时保留平铺目录，也必须严格遵守这 5 层依赖方向，不能按“18 个并列模块”理解或编码。

### 3.4 当前各包职责

- `session/`：负责 transcript、resume、recovery、continuation 相关的长期会话语义
- `state/`：负责运行中状态模型与状态变换
- `context/`：负责所有进入模型前的动态上下文与 attachment 组装
- `prompt/`：负责 system prompt、request shape 与模型请求编译
- `model-loop/`：负责模型流式响应解释与 turn-level loop semantics
- `runner/`：负责 tool round、scheduler、并发、安全执行和 follow-up
- `planner/`：负责 coordinator/prompt-level planning、delegation policy、verification policy
- `workbench/`：负责真实工作区执行能力
- `subagent/`：负责 agent runtime、fork、handoff、resume、teammate 支撑链
- `skills/`：负责技能注册、解析、注入、执行
- `mcp/`：负责 MCP 会话内语义，不负责外部宿主托管
- `approval/`：负责 permission / waiting / queue / interactive gating
- `memory/`：负责 working memory、session memory、nested memory、retrieval policy
- `artifacts/`：负责 binary/blob/output file/intermediate artifacts
- `results/`：负责 result surface、output handoff、next-turn surface
- `events/`：负责 typed domain events 与 event emission
- `hooks/`：负责 hook registration/runtime/lifecycle/gates

---

## 4. 依赖方向

### 4.1 核心依赖原则

- `api/` 依赖 `session/`、`state/`、`runner/`、`results/`
- `runner/` 依赖 `context/`、`prompt/`、`model-loop/`、`workbench/`、`approval/`、`results/`、`events/`
- `model-loop/` 不依赖 `workbench/`，它只解释模型输出并产出动作/finish reason
- `workbench/` 不依赖 `prompt/`、`context/`，避免执行原语被推理层反向污染
- `subagent/` 依赖 `runner/`、`session/`、`state/`、`mcp/`、`results/`
- `skills/` 依赖 `subagent/`、`context/`、`prompt/`
- `mcp/` 依赖 `approval/`、`results/`、`events/`
- `approval/` 不依赖 `ui`，只依赖抽象 `user_port`
- `results/` 负责把内部运行结果转换成可供桥接层投影的 surface

### 4.2 桥接依赖

`engine-core` 只依赖抽象端口：

- `model_port`
- `user_port`
- `host_port`
- `mcp_host_port`
- `skill_store_port`

不依赖：

- 具体 provider SDK
- 具体数据库
- 具体 HTTP server
- 具体 React/Ink UI

---

## 5. 各包详细设计

## 5.1 `api/`

### 目标

提供 engine-core 的可程序化调用面。

### 负责内容

- 创建 / 恢复 session run
- 推进 step
- 中断当前 run
- 获取 snapshot
- 对外暴露统一 typed API

### 建议文件

```text
api/
  engine.ts
  types.ts
  run_handle.ts
  snapshot.ts
  errors.ts
```

### 关键职责

- `engine.ts`
  - 对外暴露 `startSession` / `resumeSession` / `step` / `cancel` / `snapshot`
- `types.ts`
  - StartSessionInput、ResumeSessionInput、StepInput、StepResult、RunHandle
- `run_handle.ts`
  - 运行句柄、sessionId/runId/agent lineage/abort token 关系
- `snapshot.ts`
  - 对外 snapshot 视图
- `errors.ts`
  - API 层稳定错误模型

### 不负责

- 真正执行 query loop
- 存储实现
- UI 投影

---

## 5.2 `session/`

### 目标

承接长期会话语义，而不是单轮运行状态。

### 负责内容

- transcript
- sidechain transcript
- history store
- resume
- conversation recovery
- continuation state
- interrupted turn 恢复
- output handoff 的跨 turn 组织

### 建议文件

```text
session/
  transcript.ts
  transcript_store.ts
  sidechain.ts
  history.ts
  resume.ts
  recovery.ts
  continuation.ts
  output_handoff.ts
```

### 关键职责

- `transcript.ts`
  - main transcript 结构
- `transcript_store.ts`
  - transcript append/read abstraction
- `sidechain.ts`
  - subagent transcript 与 metadata
- `history.ts`
  - user input history / prior turn record
- `resume.ts`
  - resume surface 与恢复前校验
- `recovery.ts`
  - interrupted tool/result pairing 修复、continuation message 注入
- `continuation.ts`
  - token-budget / max-output / prompt-too-long continuation reason 模型
- `output_handoff.ts`
  - output file / task notification / next-turn injection surface

---

## 5.3 `state/`

### 目标

承接运行中状态与状态变换。

### 负责内容

- session state
- run state
- turn state
- wait state
- approval state
- task state
- mcp state
- bridge-related transient state（仅 core 关心的部分）

### 建议文件

```text
state/
  session_state.ts
  run_state.ts
  turn_state.ts
  wait_state.ts
  approval_state.ts
  task_state.ts
  mcp_state.ts
  state_machine.ts
```

### 关键职责

- `session_state.ts`
  - 当前 session 的稳定运行属性
- `run_state.ts`
  - 一次 run 的活跃状态
- `turn_state.ts`
  - 当前 turn 的 streaming/tool round/attachments/use counts
- `wait_state.ts`
  - 等待态统一建模
- `approval_state.ts`
  - permission / queue / current decision state
- `task_state.ts`
  - background shell / local agent / remote agent 统一任务态
- `mcp_state.ts`
  - mcp.clients / commands / resources 的 core-side抽象视图
- `state_machine.ts`
  - 合法状态迁移规则

---

## 5.4 `context/`

### 目标

负责 query 前所有“动态上下文”的收集、筛选、注入与预算控制。

### 负责内容

- userContext / systemContext
- attachment assembly
- queued command to attachment conversion
- memory selection
- IDE / file / task / mailbox 注入
- agent listing / skill listing / deferred tools / MCP instructions delta
- compaction / overflow recovery 支撑信息

### 建议文件

```text
context/
  assembler.ts
  system_context.ts
  user_context.ts
  attachments.ts
  queues.ts
  skill_listing.ts
  agent_listing.ts
  deferred_tools.ts
  mcp_instructions.ts
  memory_context.ts
  compaction.ts
  collapse.ts
  compaction_context.ts
```

### 关键职责

- `assembler.ts`
  - 组织本轮完整上下文输入
- `system_context.ts`
  - git status、workspace hints、date 等
- `user_context.ts`
  - CLAUDE.md、memory files、user-specific context
- `attachments.ts`
  - attachment message 构造与统一调度
- `queues.ts`
  - prompt queue / task-notification queue 的输入面
- `skill_listing.ts`
  - skill discovery 列表与 budget 裁剪
- `agent_listing.ts`
  - agent listing delta
- `deferred_tools.ts`
  - deferred tools delta
- `mcp_instructions.ts`
  - MCP instructions delta
- `memory_context.ts`
  - relevant memories / nested memory / session memory 注入
- `compaction.ts`
  - auto / micro / reactive compact 语义与 compact 入口
- `collapse.ts`
  - context collapse 接口与恢复支撑
- `compaction_context.ts`
  - compact 后需要 re-surface 的 context 信息

### 特别要求

attachment 视为一级运行时组件，不得隐藏在 utils 里。

---

## 5.5 `prompt/`

### 目标

负责 system prompt 组装与模型请求编译。

### 负责内容

- default system prompt sections
- coordinator / agent / custom / append prompt 组合
- request shape 编译
- cache-safe prompt prefix 建模
- tool / command / capability 面向模型的展示文本

### 建议文件

```text
prompt/
  compiler.ts
  system_prompt.ts
  prompt_sections.ts
  request_shape.ts
  cache_prefix.ts
```

### 关键职责

- `compiler.ts`
  - 把 context + messages + tools 编译为 provider-neutral request
- `system_prompt.ts`
  - effective system prompt 优先级链
- `prompt_sections.ts`
  - 各 section 的结构化生成
- `request_shape.ts`
  - normalized request 类型
- `cache_prefix.ts`
  - cache-safe prefix 计算与稳定性约束

---

## 5.6 `model-loop/`

### 目标

负责解释流式模型响应，并将其变成 turn-level 可执行信号。

### 负责内容

- stream chunk reduce
- assistant text delta
- tool_use extraction
- finish reason
- usage aggregation
- fallback / retry signal
- synthetic result 恢复辅助

### 建议文件

```text
model-loop/
  model_loop.ts
  chunk_reducer.ts
  action_extractor.ts
  finish_reason.ts
  usage.ts
  fallback.ts
```

### 关键职责

- `model_loop.ts`
  - 主循环中对 model_port stream 的消费
- `chunk_reducer.ts`
  - 合并 text/tool_use/usage/error
- `action_extractor.ts`
  - 抽取 actions 与 tool round 触发条件
- `finish_reason.ts`
  - standardized finish reason
- `usage.ts`
  - usage merge
- `fallback.ts`
  - model fallback / retry 信号

---

## 5.7 `runner/`

### 目标

负责 turn 内执行编排，是 engine-core 的总协调器。

### 负责内容

- query loop
- tool round
- follow-up / next-turn
- tool scheduler
- tool concurrency
- contextModifier 应用
- interrupt / abort / synthetic result recovery

### 建议文件

```text
runner/
  query_loop.ts
  turn_runner.ts
  tool_round.ts
  tool_scheduler.ts
  concurrency.ts
  context_modifiers.ts
  recovery.ts
```

### 关键职责

- `query_loop.ts`
  - 单轮循环与跨轮推进
- `turn_runner.ts`
  - 本轮执行协调
- `tool_round.ts`
  - tool_use → tool_result 的中间调度层
- `tool_scheduler.ts`
  - concurrency-safe / serial batch 调度
- `concurrency.ts`
  - 批次与执行约束
- `context_modifiers.ts`
  - tool results 对上下文的修改回放
- `recovery.ts`
  - interrupt / fallback / synthetic tool_result 处理

---

## 5.8 `planner/`

### 目标

承接 OpenCC 中 prompt-level planner / coordinator / delegation policy，而不是做一个假想的重型 planner。

### 负责内容

- coordinator mode
- delegation policy
- verification policy
- task decomposition prompt policy
- agent selection policy

### 建议文件

```text
planner/
  coordinator.ts
  delegation.ts
  verification.ts
  planning_policy.ts
  selection_policy.ts
```

### 关键职责

- `coordinator.ts`
  - coordinator mode prompt 与约束
- `delegation.ts`
  - 何时起 subagent / 何时本线程做
- `verification.ts`
  - 验证优先级与完成判定支撑
- `planning_policy.ts`
  - prompt-level plan 约束
- `selection_policy.ts`
  - command/skill/agent 候选选择策略

---

## 5.9 `workbench/`

### 目标

提供 session 在工作区完成真实工作的全部执行原语与生命周期。

### 5.9.1 `workbench/shell/`

#### 负责内容

- shell exec
- progress streaming
- foreground/background 切换
- timeout / auto-background
- shell sandbox
- cwd / env / shell session

#### 建议文件

```text
shell/
  exec.ts
  session.ts
  progress.ts
  background.ts
  sandbox.ts
  validation.ts
```

#### 特别要求

- 后台 bash 必须是一等能力
- auto-backgrounding 与 explicit backgrounding 必须分开建模
- stall watchdog 需要显式建模

### 5.9.2 `workbench/files/`

#### 负责内容

- read text/image/pdf/notebook
- write
- stat/list
- path normalization
- read/write permission surface

#### 建议文件

```text
files/
  read.ts
  write.ts
  stat.ts
  list.ts
  path.ts
  permissions.ts
```

### 5.9.3 `workbench/patch/`

#### 负责内容

- old/new string edit
- patch generation
- diff capture
- sed-style patch semantics 替代层
- patch validation / conflict detection

#### 建议文件

```text
patch/
  edit.ts
  apply_patch.ts
  diff.ts
  validation.ts
```

#### 特别要求

patch runtime 必须独立存在，不得散在 files 或 bash 工具内部。

### 5.9.4 `workbench/search/`

#### 负责内容

- grep
- glob
- code search
- result truncation / pagination
- permission-aware observation

#### 建议文件

```text
search/
  grep.ts
  glob.ts
  code_search.ts
  limits.ts
```

### 5.9.5 `workbench/process/`

#### 负责内容

- task state
- local_bash / local_agent / remote_agent 生命周期
- output file
- task notification
- task output retrieval
- kill / cleanup
- summary / progress aggregation

#### 建议文件

```text
process/
  task_registry.ts
  shell_task.ts
  agent_task.ts
  remote_task.ts
  notifications.ts
  output.ts
  summary.ts
```

### 5.9.6 `workbench/snapshot/`

#### 负责内容

- worktree isolation
- workspace snapshot
- worktree create / cleanup / dirty check
- worktree visibility hints

#### 建议文件

```text
snapshot/
  worktree.ts
  visibility.ts
  workspace_snapshot.ts
```

---

## 5.10 `subagent/`

### 目标

负责 agent runtime、fork、resume、handoff、teammate 支撑链。

### 负责内容

- AgentTool runtime
- forked subagent
- resumed subagent
- handoff / SendMessage semantics
- per-agent MCP
- per-agent tools
- sidechain transcript
- LocalAgentTask / RemoteAgentTask 对接
- mailbox / teammate 支撑链

### 建议文件

```text
subagent/
  runtime.ts
  fork.ts
  resume.ts
  handoff.ts
  context.ts
  transcript.ts
  mailbox.ts
  task_bridge.ts
```

### 关键职责

- `runtime.ts`
  - runAgent 等核心 agent loop 调用
- `fork.ts`
  - fork path、cache-safe forked messages
- `resume.ts`
  - resumed agent reconstruction
- `handoff.ts`
  - task-notification / SendMessage 语义
- `context.ts`
  - subagent context isolation / exact tools / cwd override
- `transcript.ts`
  - sidechain transcript
- `mailbox.ts`
  - teammate / mailbox 支撑链
- `task_bridge.ts`
  - LocalAgentTask / RemoteAgentTask 对接

---

## 5.11 `skills/`

### 目标

负责 skill 的发现、激活、装配、执行与资源管理。

### 负责内容

- managed/user/project/additional/legacy skills
- bundled skills
- MCP skills
- conditional skill activation
- skill listing budget
- SkillTool execution
- skill resource extraction
- skill hooks registration

### 建议文件

```text
skills/
  registry.ts
  loader.ts
  activation.ts
  listing.ts
  runtime.ts
  bundled.ts
  mcp_skills.ts
  hooks.ts
```

### 关键职责

- `registry.ts`
  - skill index
- `loader.ts`
  - loadSkillsFromSkillsDir / commands dir
- `activation.ts`
  - conditional skills / dynamic skills
- `listing.ts`
  - format within budget / visibility
- `runtime.ts`
  - SkillTool 调用与 forked execution
- `bundled.ts`
  - bundled skill extraction
- `mcp_skills.ts`
  - MCP skills surface
- `hooks.ts`
  - skill hook registration

---

## 5.12 `mcp/`

### 目标

负责 MCP 的会话内语义，而不负责 server process/secret 的宿主托管。

### 子包结构

```text
mcp/
  config/
  session/
  discovery/
  invoke/
  resources/
  prompts/
  channels/
  elicitation/
  recovery/
```

### 5.12.1 `config/`

- config merge
- scope / policy filter
- runtime config model

### 5.12.2 `auth/`

- OAuth
- XAA
- token / auth state surface
- needs-auth / session expired auth continuation

### 5.12.3 `session/`

- client state
- tools / commands / resources surface
- appState.mcp 对应的 core 内抽象

### 5.12.4 `discovery/`

- tools / prompts / resources load
- MCP capability reload
- command / resource projection support

### 5.12.5 `invoke/`

- tool invoke
- output truncation
- binary/blob handoff
- session expired / retry hooks

### 5.12.6 `resources/`

- resources surface
- resources-to-context integration

### 5.12.7 `prompts/`

- MCP prompt / command surface
- mcp.commands merge 逻辑支撑

### 5.12.8 `roots/`

- roots surface
- roots manager
- roots-to-resource scope integration

### 5.12.9 `channels/`

- channel notification
- channel permission relay
- allowlist / marketplace gating

### 5.12.10 `elicitation/`

- elicitation queue
- request / response / completion flow
- URL mode waiting state

### 5.12.11 `recovery/`

- reconnect
- backoff
- session expired
- retry budget

---

## 5.13 `approval/`

### 目标

统一 permission / waiting / decision / queue / classifier / channel / remote approval 语义。

### 负责内容

- permission context
- rules loader/parser
- mode 切换
- local interactive approval
- classifier path
- bridge remote approval
- channel relay
- swarm/coordinator approval 分流
- waiting queues
- audit logging

### 建议文件

```text
approval/
  context.ts
  rules.ts
  modes.ts
  interactive.ts
  classifier.ts
  remote.ts
  channels.ts
  queues.ts
  audit.ts
```

### 特别要求

approval 必须按多路径竞态模型设计，而不是单一路径确认框模型。

---

## 5.14 `memory/`

### 目标

负责 working memory、session memory、nested memory、retrieval policy。

### 负责内容

- memory taxonomy
- memory scan
- session memory extraction
- relevant memory lookup
- nested memory injection
- current session memory injection
- compaction 协同

### 建议文件

```text
memory/
  taxonomy.ts
  storage.ts
  scan.ts
  session_memory.ts
  retrieval.ts
  nested.ts
  injection.ts
```

---

## 5.15 `artifacts/`

### 目标

负责长输出、二进制、大结果、output file、blob 持久化语义。

### 负责内容

- binary/blob artifact storage
- MCP large output storage
- task output file
- transcript symlink output
- user attachment ingest

### 建议文件

```text
artifacts/
  store.ts
  binary.ts
  task_output.ts
  upload.ts
  large_result.ts
```

---

## 5.16 `results/`

### 目标

负责把内部运行结果组织成稳定的回流面。

### 负责内容

- final result object
- next-turn surface
- task-notification surface
- output handoff
- resumable surface
- synthetic error/result surface

### 建议文件

```text
results/
  final_result.ts
  notification.ts
  handoff.ts
  resumable.ts
  synthetic.ts
```

### 特别要求

结果不只是一段文本，必须包括：

- 当前轮结果
- 后续可消费结果
- 后台任务结果
- 需要下一轮继续处理的 continuation surface

---

## 5.17 `events/`

### 目标

统一 typed domain events，避免 OpenCC 那种事件分散状态。

### 负责内容

- tool progress
- task notification
- approval events
- MCP events
- subagent events
- compact boundary
- result projection events
- bridge/remote event adapter input model

### 建议文件

```text
events/
  types.ts
  emitter.ts
  tool_events.ts
  task_events.ts
  approval_events.ts
  mcp_events.ts
  subagent_events.ts
  compact_events.ts
```

### 特别要求

events 必须 first-class 化，不能继续散落在 UI、SDK queue、telemetry、task notification 各处。

---

## 5.18 `hooks/`

### 目标

负责 hooks 的注册、执行、异步回包与生命周期 gate。

### 负责内容

- hook registration
- skill hooks
- frontmatter hooks
- async hook registry
- stop hook gate
- hook response attachment
- hook-triggered continuation/rejection

### 建议文件

```text
hooks/
  registration.ts
  runtime.ts
  async_registry.ts
  lifecycle.ts
  stop_gate.ts
  attachments.ts
```

---

## 6. 运行时主链映射

## 6.1 入口到候选集合

```text
user input
  -> api / session
  -> context discovery
  -> skills / commands / agents / mcp surface discovery
  -> approval / policy filtering
  -> active candidate sets
```

涉及包：

- `api/`
- `session/`
- `context/`
- `skills/`
- `subagent/`
- `mcp/`
- `approval/`

## 6.2 候选集合到模型请求

```text
active candidate sets
  -> prompt/system prompt assembly
  -> attachments
  -> message normalization
  -> request shape compile
  -> model_port request
```

涉及包：

- `context/`
- `prompt/`
- `model-loop/`
- `results/`

## 6.3 单轮执行

```text
model stream
  -> model-loop
  -> runner/tool round
  -> workbench / subagent / skills / mcp invoke
  -> context modifiers / tool results
  -> next turn or finish
```

涉及包：

- `model-loop/`
- `runner/`
- `workbench/`
- `subagent/`
- `skills/`
- `mcp/`
- `events/`

## 6.4 等待与 continuation

```text
execution
  -> approval wait / elicitation / background task / capacity wait / reconnect
  -> queues / task state / recovery state
  -> notification / output handoff / resume
  -> next turn consumption
```

涉及包：

- `approval/`
- `workbench/process/`
- `session/`
- `results/`
- `mcp/recovery/`
- `events/`

---

## 7. 与桥接层的协议要求

为支持上述 engine-core 设计，bridge 至少需要稳定提供：

- `model_port`
  - provider-neutral request/stream
- `user_port`
  - approval / prompt / elicitation / notification 出入口
- `host_port`
  - session snapshot / checkpoint / event append / artifact store
- `mcp_host_port`
  - MCP 连接托管接口
- `skill_store_port`
  - skills 的外部存储与枚举接口（如需要）

同时需要明确：

- engine-core 不管理真实数据库 schema
- engine-core 不管理 MCP server process
- engine-core 不管理 Web/CLI UI queue

---

## 8. 覆盖性巡视

本节用于审视是否遗漏两套盘点中的功能。

### 8.1 模块视角核对

本文档已经覆盖：

- query / session state machine
- model loop
- context / prompt / request assembly
- tool orchestration
- shell / files / patch / search / process
- subagent / handoff / worktree isolation / teammate
- transcript / history / resume / recovery
- hooks / stop gate
- MCP runtime
- skills runtime
- approval / permission
- memory / artifacts / results
- events

### 8.2 runtime loop 视角核对

本文档已经覆盖：

- 入口
- 发现
- 筛选
- 装配
- 注入
- 执行
- 等待
- continuation
- 恢复
- 回流

### 8.3 高风险漏项核对

已显式纳入：

- patch runtime
- typed events
- attachment runtime
- skill conditional activation
- skill listing budget
- agent listing delta
- deferred tools delta
- MCP instructions delta
- background bash
- LocalShellTask / LocalAgentTask / RemoteAgentTask
- output handoff
- stall watchdog
- elicitation queue / completion
- capacity wait / wake
- remote reconnect / retry budget
- sidechain transcript / subagent resume
- classifier path / speculative classifier

### 8.4 仍需注意的边界

以下内容虽被文档提及，但应留在 engine-core 外：

- `server/*` 的 HTTP / SSE / WS / Web / CLI 宿主逻辑
- `bridge/*` 的真实 transport 与 worker/CCR 托管
- `state/AppStateStore.ts` 的 UI-specific 部分
- `tools/REPLTool/*` 与 `processUserInput/*` 中纯交互壳层部分

---

## 9. 文档结论

Ark Code `engine-core` 的正确目标，不是简单照着 OpenCC 建一个 `query.ts + tools/ + tasks/` 的翻版，而是建立一个：

- 有稳定包边界
- 有明确 typed state
- 有正式 attachment/runtime continuation 模型
- 有统一 output handoff/result surface
- 有 first-class events
- 有多路径 approval/waiting 语义
- 可通过 bridge 与 server-host 托管协作的执行内核

只要缺少上述任一大块，最终产物在行为上都无法等价于 OpenCC 的 session 内完整执行能力。
