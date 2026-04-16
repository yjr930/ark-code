# Ark Code 总体设计

## 0. 项目说明

### 目标

把 **OpenCC** (CC) 和 **OpenCode** (OC) 融合成一个新的 code agent。

这个新 agent 的目标是：

- 保留 **OpenCC** 在 session 内完成完整工作的执行能力
- 保留 **OpenCode** 在用户交互、LLM provider 接入、服务托管方面的成熟能力

### 核心原则

融合时遵循下面这条边界：

- **凡是一个 session 完成完整工作所需要的能力，都放进 engine core，采用 OpenCC 的方案**
- **凡是用户交互、LLM provider 交互、以及承载这些交互的 server 能力，都放进 server，采用 OpenCode 的方案**

### 融合后的总体结构

系统分成三部分：

#### 1. engine core
采用 OpenCC 的方案，负责 session 内的完整工作闭环。

它应当包含：

- run / session state machine
- planner / runner / subagent / handoff
- context assembly
- prompt compiler
- model-loop semantics
- workbench runtime
  - shell / command execution
  - file read / write
  - patch / edit
  - grep / glob / code search
  - cwd / env / process state
- MCP runtime
- skill runtime
- memory / artifact / result semantics
- approval / continuation semantics
- recovery semantics
- execution events

engine core 必须可以被程序直接调用，并支持 AI 在真实仓库里一边修改代码、一边运行验证。

#### 2. server
采用 OpenCode 的方案，负责所有对外承载与交互。

它应当包含：

- CLI
- Web UI
- HTTP / SSE / WS runtime
- provider registry
- model/provider auth 与 transport
- endpoint capability handling
- session / message / event / checkpoint / artifact storage
- replay / observability / evaluation
- connector hosting
- secrets / config management

#### 3. bridge
这是新增部分，负责 engine core 和 server 之间的协议层。

它应当包含：

- model_port
- user_port
- host_port
- core state serialization
- checkpoint mapping
- event projection
- artifact/result projection

#### 4. 配置与品牌
本项目作为独立项目，不继承opencc 或 opencode 的配置文件目录体系，不能因为继承了他们的代码就用他们的目录配置。

但是，要符合的Agent配置标准，例如SKILL.md、AGENTS.md、mcp的取法等等。

---

## 1. 总体结构

```text
apps/
  cli/                           # OC
  web/                           # OC

packages/
  engine-core/                   # CC
  server-host/                   # OC
  bridge/                        # New
```

职责如下：

* `engine-core/`：session 内部完成完整工作的执行核心
* `server-host/`：用户交互、provider 交互、存储、托管、UI
* `bridge/`：core 和 server 的协议层

### 1.1 运行时关系

```text
User (CLI/Web)
  -> server-host/runtime
  -> bridge
  -> engine-core
       -> workbench runtime
       -> mcp runtime
       -> skill runtime
       -> planner / runner
       -> model-loop
  -> bridge
  -> server-host/provider / persistence / ui
```

---

## 2. 目录与包级拆分

## 2.1 `packages/engine-core/`

> 这一层按 OpenCC 的重构方向来建。下面的目录名是建议的新包名，用来承接你认可的 OpenCC engine core 边界。

```text
packages/engine-core/
  api/
  state/
  planner/
  runner/
  subagent/
  context/
  prompt/
  model-loop/
  workbench/
    shell/
    files/
    patch/
    search/
    process/
    snapshot/
  mcp/
    session/
    discovery/
    invoke/
    resources/
    prompts/
    roots/
    recovery/
  skills/
  memory/
  artifacts/
  approval/
  results/
  events/
```

## 2.2 `packages/server-host/`

> 这一层优先复用 OpenCode 现有服务骨架。OpenCode 当前已有 Hono server、control/instance/ui routes、projectors、provider、session SQL schema、tool registry 等。([GitHub][1])

```text
packages/server-host/
  runtime/
  provider/
  persistence/
  connectors/
  ui/
  replay/
  observability/
  evaluation/
```

## 2.3 `packages/bridge/`

```text
packages/bridge/
  model_port.ts
  user_port.ts
  host_port.ts
  core_state_codec.ts
  checkpoint_mapper.ts
  provider_chunk_normalizer.ts
  core_event_to_bus_event.ts
  result_projection.ts
  artifact_store_port.ts
  mcp_host_port.ts
  skill_store_port.ts
```

---

## 3. 模块归属矩阵

| 能力                                   | 归属          | 方案来源     | 说明                                |
| ------------------------------------ | ----------- | -------- | --------------------------------- |
| run/session state machine            | engine-core | CC       | session 内执行主权                     |
| planner / runner / orchestration     | engine-core | CC       | 任务拆解、推进、结束条件                      |
| subagent / handoff                   | engine-core | CC       | 子代理与接力                            |
| context assembly                     | engine-core | CC       | history、memory、workspace 状态注入     |
| prompt compiler                      | engine-core | CC       | provider-neutral request          |
| model-loop semantics                 | engine-core | CC       | 解释 chunk、推进下一步                    |
| workbench runtime                    | engine-core | CC       | shell、files、patch、search、process  |
| MCP runtime                          | engine-core | CC       | MCP 语义与调用生命周期                     |
| skill runtime                        | engine-core | CC       | skill resolve/bind/inject/control |
| memory semantics                     | engine-core | CC       | working memory / retrieval policy |
| artifact semantics                   | engine-core | CC       | 中间产物 / 最终结果                       |
| approval / safety semantics          | engine-core | CC       | 自动审批也需要等待态语义                      |
| provider registry / auth / transport | server-host | OC       | provider 交互只在 server              |
| HTTP / SSE / WS / CLI / Web          | server-host | OC       | 用户交互和托管                           |
| session / message / event storage    | server-host | OC       | 复用现有 schema 与 store               |
| checkpoint / projection / replay     | server-host | OC + New | schema 可复用，core checkpoint 需新增    |
| connector / secret / hosting         | server-host | OC       | MCP server 托管、secret 管理           |
| UI projection / trace viewer         | server-host | OC + New | 复用 projector/bus，新增 core 事件投影     |
| core ↔ server 协议                     | bridge      | New      | 统一端口与序列化                          |

---

## 4. `engine-core` 细粒度设计

## 4.1 `api/`

### 目标

定义 core 的可程序化调用面。

### 组件来源

* **CC**：核心运行语义
* **New**：标准化 API 形态

### 文件建议

```text
engine-core/api/
  engine.ts
  types.ts
  run_handle.ts
  snapshot.ts
```

### 关键接口

```ts
export type EngineCore = {
  startSession(input: StartSessionInput): Promise<RunHandle>
  resumeSession(input: ResumeSessionInput): Promise<RunHandle>
  step(handle: RunHandle, input?: StepInput): Promise<StepResult>
  cancel(handle: RunHandle): Promise<void>
  snapshot(handle: RunHandle): Promise<CoreSnapshot>
}
```

### 说明

这层要保证 core 可以被：

* server 托管调用
* 测试 harness 调用
* agent 自举开发流程直接调用

---

## 4.2 `state/`

### 目标

表达 session 内部完整执行状态。

### 组件来源

* **CC**

### 文件建议

```text
engine-core/state/
  session_state.ts
  run_state.ts
  turn_state.ts
  wait_state.ts
  continuation_state.ts
  result_state.ts
```

### 状态范围

* 当前目标
* 当前步骤
* 当前 planner 阶段
* 当前 workbench 状态
* 当前 MCP 调用状态
* 当前 skill 状态
* 当前等待态
* 当前结果面

### 说明

这是整个 core 的中心。OpenCode 的 session 表继续保存会话和消息；`engine-core/state` 保存执行主状态。OpenCode 现有 `session.sql.ts` 已经有 `session`、`message`、`part`、summary、revert、permission、workspace/project 关系，这很适合继续承接会话和消息层存储。([GitHub][2])

---

## 4.3 `planner/` 与 `runner/`

### 目标

承担任务拆解、步骤推进、完成判定。

### 组件来源

* **CC**

### 文件建议

```text
engine-core/planner/
  planner.ts
  plan_state.ts
  decomposition.ts

engine-core/runner/
  runner.ts
  step_scheduler.ts
  completion_policy.ts
```

### 负责内容

* 任务拆解
* 子目标推进
* planner 输出转 action
* 失败恢复
* 长任务收敛判定

---

## 4.4 `subagent/`

### 目标

让 core 内部具备多 agent / handoff 能力。

### 组件来源

* **CC**
* **New**：和 server session 的映射桥

### 文件建议

```text
engine-core/subagent/
  subagent_runtime.ts
  handoff.ts
  subagent_state.ts
```

### 说明

子代理状态归 core；server 只做存储与展示。需要在 `bridge/` 增加 subagent 对 session projection 的映射。

---

## 4.5 `context/` 与 `prompt/`

### 目标

把 session 状态、memory、workspace 状态、skills、MCP/action surface 组织成模型输入。

### 组件来源

* **CC**：主逻辑
* **OC**：现有 prompt/system 素材、provider transform 知识可复用

OpenCode 现有 `session/prompt.ts` 已经把 prompt 生成和 `ProviderTransform`、`ToolRegistry`、MCP 绑定在一起，适合作为素材与兼容逻辑来源。([GitHub][3])

### 文件建议

```text
engine-core/context/
  context_assembler.ts
  history_window.ts
  memory_selector.ts
  workspace_surface.ts

engine-core/prompt/
  prompt_compiler.ts
  prompt_assets.ts
  request_shape.ts
```

### 输出

生成统一的 `normalized_model_request`，交给 `bridge/model_port.ts`。

---

## 4.6 `model-loop/`

### 目标

解释 provider 归一化后的 chunk，驱动下一步动作。

### 组件来源

* **CC**
* **New**：chunk 标准协议

### 文件建议

```text
engine-core/model-loop/
  model_loop.ts
  chunk_reducer.ts
  action_extractor.ts
  continue_policy.ts
```

### 输入

来自 `model_port.stream(req)` 的 `model_chunk` 流。

### 输出

* assistant text delta
* action call
* finish reason
* usage
* error

### 说明

provider transport 不在 core；provider 解释语义在 core。

---

## 4.7 `workbench/`

### 目标

提供 session 在工作区完成真实工作的全部本地执行能力。

### 组件来源

* **CC**：控制权与状态机
* **OC**：现有 Bash/Edit/Read/Write/Grep/Glob/CodeSearch 可以作为实现参考或底层 adapter

OpenCode 的 tool registry 当前确实把 `TaskTool`、`QuestionTool`、`PlanExitTool`、`BashTool`、`CodeSearchTool`、`GlobTool`、`WriteTool`、`EditTool`、`GrepTool` 等集中注册起来了。([GitHub][4])

### 文件建议

```text
engine-core/workbench/shell/
  session.ts
  exec.ts
  stream.ts
  interrupt.ts

engine-core/workbench/files/
  read.ts
  write.ts
  stat.ts
  list.ts

engine-core/workbench/patch/
  apply_patch.ts
  edit.ts
  diff.ts

engine-core/workbench/search/
  grep.ts
  glob.ts
  code_search.ts

engine-core/workbench/process/
  process_table.ts
  background_job.ts

engine-core/workbench/snapshot/
  workspace_snapshot.ts
```

### 说明

这层包含：

* shell session
* 文件读写
* patch/edit
* 搜索与观察
* process/job 生命周期
* workspace snapshot

### 核心约束

workbench 在 core 内闭环运行，不经 server 再做一次“工具调度”。

---

## 4.8 `mcp/`

### 目标

把 MCP 放进 core 的执行闭环。

### 组件来源

* **CC**：调用语义、生命周期、结果注入
* **OC**：连接与 secret 托管
* **New**：host port

### 文件建议

```text
engine-core/mcp/session/
  session_manager.ts

engine-core/mcp/discovery/
  tools.ts
  resources.ts
  prompts.ts

engine-core/mcp/invoke/
  invoker.ts
  pending_call.ts

engine-core/mcp/resources/
  resource_surface.ts

engine-core/mcp/prompts/
  prompt_surface.ts

engine-core/mcp/roots/
  roots_manager.ts

engine-core/mcp/recovery/
  reconnect.ts
  state.ts
```

### 说明

* MCP 调用语义在 core
* MCP server process / socket / secrets 托管在 server
* 通过 `bridge/mcp_host_port.ts` 连接

---

## 4.9 `skills/`

### 目标

让 skill 作为 core 的高层工作编排能力。

### 组件来源

* **CC**：resolve / bind / inject / controller
* **OC**：skill 文件、分发、配置入口
* **New**：skill store port

OpenCode 当前 CLI `run.ts` 与 tool surface 已经有 `SkillTool` 展示与调用逻辑，可作为 skill store / UI 侧素材。([GitHub][5])

### 文件建议

```text
engine-core/skills/
  resolver.ts
  binder.ts
  injector.ts
  controller.ts
  skill_state.ts
```

---

## 4.10 `memory/`、`artifacts/`、`results/`

### 目标

表达长期工作所需的记忆、产物和结果对象。

### 组件来源

* **CC**：语义
* **OC**：存储
* **New**：artifact/result projection

### 文件建议

```text
engine-core/memory/
  working_memory.ts
  retrieval_policy.ts
  memory_surface.ts

engine-core/artifacts/
  artifact_semantics.ts
  intermediate_artifacts.ts

engine-core/results/
  final_result.ts
  resumable_surface.ts
  next_turn_surface.ts
```

### 说明

这里要输出给 server 的不是一段文本，而是：

* final result object
* intermediate artifacts
* resumable surface
* next-turn surface

---

## 4.11 `approval/`

### 目标

保留自动审批条件下的等待态语义与恢复能力。

### 组件来源

* **CC**：何时请求、收到结果后如何恢复
* **OC**：用户输入/权限通道
* **New**：统一 user port

OpenCode 现有 CLI run 流里已经有 `permission.asked` 事件处理和 reply 流程，可复用到自动/半自动审批通道。([GitHub][5])

### 文件建议

```text
engine-core/approval/
  policy.ts
  wait_state.ts
  resume.ts
  credential_request.ts
```

### 当前策略

第一阶段可配置成：

* `auto_approve = true`
* `auto_credential = false`

---

## 4.12 `events/`

### 目标

定义 core 的语义事件。

### 组件来源

* **CC**
* **New**：投影到 OpenCode bus/projector

### 文件建议

```text
engine-core/events/
  types.ts
  emitter.ts
  trace_event.ts
```

### 事件类型

* run events
* planner events
* subagent events
* workbench events
* MCP events
* skill events
* approval events
* result events

---

## 5. `server-host` 细粒度设计

## 5.1 `runtime/`

### 目标

托管 HTTP / SSE / WS / CLI / Web，并把请求转发给 core。

### 组件来源

* **OC**：主骨架
* **New**：core controller

OpenCode 现有 `server.ts` 已经是 Hono server，初始化了 projectors，并注册了 `ControlPlaneRoutes()`、`InstanceRoutes()`、`UIRoutes()`，非常适合继续作为 server-host 的骨架。([GitHub][1])

### 复用代码

* `packages/opencode/src/server/server.ts`
* `packages/opencode/src/server/control/*`
* `packages/opencode/src/server/instance/*`
* `packages/opencode/src/server/ui/*`
* `packages/opencode/src/cli/*`

### 新文件

```text
server-host/runtime/
  core_run_controller.ts
  core_session_controller.ts
  routes/
    approval.ts
    replay.ts
```

---

## 5.2 `provider/`

### 目标

把具体 provider 能力收口成 `model_port`。

### 组件来源

* **OC**：provider registry / transform / schema / transport
* **New**：对 core 的统一 adapter

OpenCode 现有 provider 层已经具备 provider-agnostic 骨架和 transform/schema 能力，可以直接复用。([GitHub][1])

### 复用代码

* `packages/opencode/src/provider/provider.ts`
* `packages/opencode/src/provider/transform.ts`
* `packages/opencode/src/provider/schema.ts`

### 新文件

```text
server-host/provider/
  model_port_adapter.ts
  provider_chunk_normalizer.ts
  capability_map.ts
  replay_provider.ts
  mock_provider.ts
```

### 开发流程要求

provider 层支持四种模式：

* `mock`
* `record/replay`
* `live`
* `batch-eval`

---

## 5.3 `persistence/`

### 目标

继续使用 OpenCode 的 session/message/part 存储，并补上 core checkpoint、projection、artifact。

### 组件来源

* **OC**：session store/schema
* **New**：core 执行态专用表

OpenCode 现有 `session.sql.ts` 已经有 `SessionTable`、`MessageTable`、`PartTable`，并覆盖 summary、revert、permission、workspace/project 等字段。([GitHub][2])

### 复用代码

* `packages/opencode/src/session/session.sql.ts`
* `packages/opencode/src/session/schema.ts`
* `packages/opencode/src/session/message-v2.ts`

### 新文件

```text
server-host/persistence/
  core_checkpoint.sql.ts
  run_projection.sql.ts
  artifact.sql.ts
  trace.sql.ts
```

### 新表建议

* `core_checkpoint`
* `run_projection`
* `artifact`
* `trace_event`

---

## 5.4 `connectors/`

### 目标

托管 MCP server process、network 连接、credentials、secrets。

### 组件来源

* **OC**
* **New**：MCP host service

### 新文件

```text
server-host/connectors/
  mcp_host_service.ts
  credential_broker.ts
  secret_store_adapter.ts
```

### 说明

* MCP 的执行语义在 core
* MCP 的连接、secret、托管在 server

---

## 5.5 `ui/`

### 目标

展示 run、workbench、MCP、subagent、artifact、result。

### 组件来源

* **OC**：现有 CLI/Web 展示骨架、bus、projector
* **New**：core 事件投影

OpenCode 现有 server 启动时会 `initProjectors()`；CLI `run.ts` 已经能展示文本、thinking、bash、skill 等输出，这些都能复用为新的 projection 宿主。([GitHub][1])

### 新文件

```text
server-host/ui/
  core_run_projection.ts
  workbench_projection.ts
  mcp_projection.ts
  subagent_projection.ts
  artifact_projection.ts
```

---

## 5.6 `observability/` 与 `evaluation/`

### 目标

把 core events 存下来并提供回放、inspect、评估入口。

### 组件来源

* **OC**：bus/projector/现有 server 面
* **New**：trace schema 与 eval runner

### 新文件

```text
server-host/observability/
  trace_collector.ts
  run_inspector.ts

server-host/evaluation/
  replay_suite.ts
  live_suite.ts
  regression_runner.ts
```

---

## 6. `bridge` 细粒度设计

## 6.1 `model_port.ts`

```ts
export type ModelPort = {
  stream(req: NormalizedModelRequest): AsyncIterable<ModelChunk>
}
```

用途：

* core 调 provider
* server 注入 live/mock/replay 实现

## 6.2 `user_port.ts`

```ts
export type UserPort = {
  requestApproval(req: ApprovalRequest): Promise<ApprovalResponse>
  requestInput(req: UserInputRequest): Promise<UserInputResponse>
  publish(events: CoreEvent[]): Promise<void>
}
```

用途：

* 自动审批和人工审批都走同一口子
* CLI / Web UI 反馈统一进入 core

## 6.3 `host_port.ts`

```ts
export type HostPort = {
  loadSession(id: string): Promise<SessionSnapshot>
  saveCheckpoint(runID: string, state: CoreState): Promise<void>
  appendEvents(runID: string, events: CoreEvent[]): Promise<void>
  storeArtifact(artifact: ArtifactRef): Promise<void>
}
```

用途：

* core 完全不碰数据库实现
* server 保持存储主权

## 6.4 其他桥接文件

```text
bridge/
  core_state_codec.ts
  checkpoint_mapper.ts
  provider_chunk_normalizer.ts
  core_event_to_bus_event.ts
  result_projection.ts
  artifact_store_port.ts
  mcp_host_port.ts
  skill_store_port.ts
```

---

## 7. LLM provider 集成到开发流程

## 7.1 规则

provider 只通过 `model_port` 进入 core。
core 不直接依赖任何具体 provider SDK。

## 7.2 开发模式

### mock mode

用于：

* 单元测试
* planner / workbench / MCP / skill 状态机测试

### record/replay mode

用于：

* 回归测试
* 稳定复现某次 run

### live mode

用于：

* AI 边写边验证
* 改代码、跑测试、读输出、再修改

### batch-eval mode

用于：

* 对比不同 core 版本
* 对比不同 provider / model / prompt

## 7.3 第一阶段策略

建议先实现：

1. `mock_provider`
2. `replay_provider`
3. `live_provider_adapter`

---

## 8. 程序化调用能力

`engine-core` 必须默认可程序化调用。

### 目标

让 AI 能直接在真实工作台里：

* 读写文件
* 打 patch
* 跑测试
* 读取 stdout/stderr
* 再修改
* 直到收敛

### 对外 API

见 `engine-core/api/engine.ts`。

### 对内 workbench 原语

```ts
type Workbench = {
  read(path: string): Promise<FileReadResult>
  write(path: string, content: string): Promise<FileWriteResult>
  patch(req: PatchRequest): Promise<PatchResult>
  exec(req: ExecRequest): AsyncIterable<ExecEvent>
  search(req: SearchRequest): Promise<SearchResult>
  snapshot(): Promise<WorkspaceSnapshot>
}
```

---

## 9. 第一阶段可开发的最小闭环

## 9.1 目标

先跑通以下链路：

```text
user request
  -> server runtime
  -> core startSession
  -> core context/prompt/model-loop
  -> model_port
  -> core action
  -> workbench.exec / files / patch
  -> core result
  -> server persistence + ui projection
```

## 9.2 第一阶段范围

### 进 core

* `api`
* `state`
* `context`
* `prompt`
* `model-loop`
* `workbench/shell`
* `workbench/files`
* `workbench/patch`
* `results`
* `events`

### 进 server

* `runtime`
* `provider/mock`
* `provider/replay`
* `provider/live`
* `persistence/core_checkpoint`
* `ui/core_run_projection`

### 暂缓

* subagent
* full MCP runtime
* full skill runtime
* long-term memory
* eval dashboard

---

## 10. 第一批建议创建的文件

## 10.1 `engine-core`

```text
engine-core/api/engine.ts
engine-core/api/types.ts

engine-core/state/session_state.ts
engine-core/state/run_state.ts
engine-core/state/turn_state.ts

engine-core/context/context_assembler.ts
engine-core/prompt/prompt_compiler.ts

engine-core/model-loop/model_loop.ts
engine-core/model-loop/chunk_reducer.ts

engine-core/workbench/shell/session.ts
engine-core/workbench/shell/exec.ts
engine-core/workbench/files/read.ts
engine-core/workbench/files/write.ts
engine-core/workbench/patch/apply_patch.ts

engine-core/results/final_result.ts
engine-core/events/types.ts
```

## 10.2 `server-host`

```text
server-host/runtime/core_run_controller.ts

server-host/provider/model_port_adapter.ts
server-host/provider/mock_provider.ts
server-host/provider/replay_provider.ts
server-host/provider/live_provider.ts

server-host/persistence/core_checkpoint.sql.ts
server-host/persistence/run_projection.sql.ts

server-host/ui/core_run_projection.ts
```

## 10.3 `bridge`

```text
bridge/model_port.ts
bridge/user_port.ts
bridge/host_port.ts
bridge/core_state_codec.ts
bridge/provider_chunk_normalizer.ts
bridge/core_event_to_bus_event.ts
```

---

[1]: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/server/server.ts "opencode/packages/opencode/src/server/server.ts at dev · anomalyco/opencode · GitHub"
[2]: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/session/session.sql.ts "opencode/packages/opencode/src/session/session.sql.ts at dev · anomalyco/opencode · GitHub"
[3]: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/session/prompt.ts "opencode/packages/opencode/src/session/prompt.ts at dev · anomalyco/opencode · GitHub"
[4]: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/tool/registry.ts "opencode/packages/opencode/src/tool/registry.ts at dev · anomalyco/opencode · GitHub"
[5]: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/cli/cmd/run.ts "opencode/packages/opencode/src/cli/cmd/run.ts at dev · anomalyco/opencode · GitHub"
