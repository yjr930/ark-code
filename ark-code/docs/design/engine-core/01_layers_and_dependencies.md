# engine-core 层级与依赖

## 1. 层级结构

`engine-core` 采用五层结构：

```text
src/
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
  semantics/
    approval/
    memory/
    artifacts/
    results/
    events/
    hooks/
```

代码可以分步落位，这个结构是后续实现必须遵守的目标层级。

## 2. 每层职责

### 2.1 `core`

负责运行时骨架与基础状态：

- 对外 API
- session identity
- run handle / step / resume
- turn state / queued items / budget / transcript snapshot

### 2.2 `assembly`

负责把当前轮的执行上下文编译成模型可消费请求：

- context assembly
- prompt compilation
- attachment 注入
- request assembly
- model-loop 协议

### 2.3 `execution`

负责把模型决策推进成真实执行：

- query loop
- tool orchestration
- runner policy
- planner policy
- workbench runtime

### 2.4 `domains`

负责高级能力域的会话内执行语义：

- subagent
- skills
- mcp

### 2.5 `semantics`

负责跨层共享的运行时语义：

- approval / permission
- memory / attachment recall
- artifacts / results / output handoff
- events / notifications
- hooks
- continuation / recovery contract

## 3. 主链与辅助链

### 3.1 主链

```text
core
  -> assembly
  -> execution
  -> semantics(results/events)
```

在运行时展开后，对应：

```text
session/state
  -> context/prompt/model-loop
  -> runner/tool orchestration
  -> workbench
  -> result handoff / events
```

### 3.2 辅助链

- `domains` 建立在 `assembly + execution + semantics` 之上
- `semantics` 通过统一契约被各层消费
- `bridge` 与 `server-host` 只通过接口接入，不反向定义 `engine-core` 内部层级

## 4. 依赖方向

### 4.1 允许的依赖方向

- `assembly -> core`
- `execution -> core + assembly`
- `domains -> core + assembly + execution + semantics`
- `semantics -> core` 的基础类型与状态模型
- `execution` 与 `domains` 可消费 `semantics` 提供的等待态、结果、事件契约

### 4.2 禁止的依赖方向

- `core` 不依赖 `assembly`、`execution`、`domains`
- `assembly` 不依赖 `execution` 的具体工具实现
- `workbench` 不依赖 `subagent`、`skills`、`mcp` 的上层业务语义
- `semantics` 不回收具体执行逻辑到自身目录
- `server-host` / `bridge` 的宿主实现不进入 `engine-core`

## 5. 横切机制

虽然目录是五层，实际运行时还有五条横切机制需要单独建模。

### 5.1 selection

负责候选能力的发现、筛选、暴露：

- agents
- skills
- tool pool
- MCP surfaces
- deferred tools

### 5.2 attachment

负责把增量能力装配进当前轮上下文：

- skill listing
- agent listing
- deferred tools delta
- MCP instructions delta
- memory recall
- hook response
- task notification

### 5.3 approval

负责运行时等待态与权限推进：

- tool permission
- sandbox permission
- worker permission
- elicitation wait
- prompt queue

### 5.4 continuation

负责长生命周期执行的继续推进：

- background shell
- background agent
- MCP elicitation completion
- reconnect / retry
- queued results 进入下一轮

### 5.5 result handoff

负责把执行结果转成后续可消费面：

- output file
- transcript
- task-notification
- queued message
- typed event

## 6. 目录命名建议

- 主层目录统一使用：`core`、`assembly`、`execution`、`domains`、`semantics`
- 子目录沿用已有命名：`context`、`prompt`、`model-loop`、`runner`、`workbench`、`subagent`、`mcp` 等
- `patch` 保持独立子目录，不归并到 `files` 或 `shell`
- `results`、`events`、`approval`、`hooks` 作为单独语义子域保留

## 7. 与 pre-design 的对应关系

- 模块视角主要对应：
  - `engine-core-inventory/opencc-engine-core/00_overview.md`
  - `01_execution_and_workbench.md`
  - `02_session_orchestration.md`
  - `03_mcp_skills_memory_approval.md`
  - `04_selection_and_assembly.md`
  - `05_runtime_waiting_and_continuation.md`
- 运行时闭环视角主要对应：
  - `runtime-loop-inventory/opencc-runtime-loop/01_entry_and_activation.md`
  - `02_context_and_request_assembly.md`
  - `03_execution_and_tool_round.md`
  - `04_waiting_background_continuation.md`
