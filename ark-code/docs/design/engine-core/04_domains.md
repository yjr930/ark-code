# domains 设计

## 1. 范围

`domains` 承接建立在基础执行层之上的高级能力域：

- `packages/engine-core/src/domains/`
- `packages/engine-core/src/subagent/`
- `packages/engine-core/src/skills/`
- `packages/engine-core/src/mcp/`

这些能力都参与会话执行，但不属于基础骨架、基础装配或基础 workbench 原语。

## 2. subagent

### 2.1 职责

`subagent` 负责：

- agent definition 装载
- subagent spawn / fork / resume
- per-agent tool surface
- sidechain transcript
- pending messages / handoff
- background agent completion 回流
- worktree isolation 接入位

### 2.2 与其他层的关系

- 依赖 `assembly` 提供 prompt / context / attachment 编译
- 依赖 `execution` 提供 runner / task / workbench 接入
- 依赖 `semantics` 提供 results / events / approval / continuation

### 2.3 当前阶段位置

当前阶段不展开完整 subagent 实现，但目录和接口边界要先定下来。后续接入时，subagent 不需要再重拆 `runner` 或 `results`。

## 3. skills

### 3.1 职责

`skills` 负责：

- local / bundled / MCP skills 的统一抽象
- skill registry
- conditional activation
- listing budget control
- skill content 到执行上下文的装配
- skill hook 注册入口

### 3.2 运行时语义

skill 不是静态文本片段。它至少包含两段语义：

1. 发现与筛选
2. 执行时上下文装配

在完整目标蓝图中，skill 应与 `context`、`subagent`、`hooks` 协同，而不是只当成 slash command 文本替换。

### 3.3 当前阶段位置

当前阶段先定义：

- skill 发现边界
- skill listing 装配边界
- skill 执行接入位

完整 skill 体系后续补齐。

## 4. mcp

### 4.1 职责

`mcp` 负责：

- config merge
- auth
- connection / session lifecycle
- discovery
- invoke
- prompts / resources / roots
- channels / elicitation
- recovery

建议继续按子域拆分：

```text
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
```

### 4.2 与其他层的关系

- `mcp` 的可见 surface 进入 `assembly/context`
- `mcp` tool invoke 进入 `execution/runner`
- `mcp` waiting / elicitation / recovery 与 `semantics/approval + results + events` 协同

### 4.3 当前阶段位置

当前阶段不展开 full MCP，但必须写清：

- 目录位置
- 连接生命周期位置
- discovery / invoke / elicitation / recovery 的分层
- 与 `server-host/connectors` 的边界

## 5. domains 的共同边界

### 5.1 共同特征

`subagent`、`skills`、`mcp` 都有三个共同特征：

- 它们不是 workbench 原语
- 它们进入系统前需要 selection / assembly
- 它们执行后都可能进入 waiting / continuation / result handoff

### 5.2 边界要求

- 不把基础工具执行逻辑写回 `domains`
- 不把 approval / results / events 自己做一套
- 不把 context compilation 分散到每个子域内部

`domains` 负责域语义，基础执行仍留在 `assembly + execution + semantics`。

## 6. 当前阶段与完整目标蓝图

### 6.1 当前阶段需要写清的内容

- `subagent` 的目标位置与接口边界
- `skills` 的发现与执行接入位
- `mcp` 的目标子域结构与边界

### 6.2 当前阶段不展开的内容

- background subagent 全流程
- worktree isolation 全流程
- full MCP transport / auth / reconnect / elicitation
- bundled / MCP skills 完整体系

## 7. 参考输入

- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/02_session_orchestration.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/03_mcp_skills_memory_approval.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/04_selection_and_assembly.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/05_runtime_waiting_and_continuation.md`
