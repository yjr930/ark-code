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
