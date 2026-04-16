# packages: api / session / state

## 1. `api/`

### 目标

定义 `engine-core` 的稳定程序化调用面。

### 职责

- 创建 session run
- 恢复 session run
- 推进一步执行
- 中断当前 run
- 导出 snapshot
- 向宿主暴露稳定错误模型

### 建议文件

```text
api/
  engine.ts
  types.ts
  run_handle.ts
  snapshot.ts
  errors.ts
```

### 关键对象

- `EngineCore`
- `RunHandle`
- `StartSessionInput`
- `ResumeSessionInput`
- `StepInput`
- `StepResult`
- `CoreSnapshot`

## 2. `session/`

### 目标

承接跨 turn、跨等待态、跨恢复的会话语义。

### 职责

- main transcript
- sidechain transcript
- history
- resume
- recovery
- continuation state
- output handoff

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

### 关键对象

- `SessionTranscript`
- `SidechainTranscript`
- `ContinuationReason`
- `RecoveryPlan`
- `OutputHandoffRecord`

## 3. `state/`

### 目标

定义运行中状态模型与状态迁移规则。

### 职责

- session state
- run state
- turn state
- wait state
- approval state
- task state
- mcp state
- state transition rules

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

### 关键对象

- `SessionState`
- `RunState`
- `TurnState`
- `WaitState`
- `ApprovalState`
- `TaskState`
- `McpState`

## 4. 依赖关系

- `api/` 依赖 `session/`、`state/`、`runner/`、`results/`
- `session/` 依赖 `state/`、`results/`、`events/`
- `state/` 不依赖 `ui`、`provider sdk`、`database`

## 5. 设计要求

- `api/` 只暴露稳定接口，不承载具体执行逻辑
- `session/` 管理长期语义，`state/` 管理当前运行态
- transcript、continuation、recovery 必须独立建模，不能散在工具实现中
