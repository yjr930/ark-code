# core 与 assembly 设计

## 1. 范围

本篇覆盖两层：

- `core`
- `assembly`

对应目录：

- `packages/engine-core/src/core/`
- `packages/engine-core/src/api/`
- `packages/engine-core/src/session/`
- `packages/engine-core/src/state/`
- `packages/engine-core/src/assembly/`
- `packages/engine-core/src/context/`
- `packages/engine-core/src/prompt/`
- `packages/engine-core/src/model-loop/`

## 2. core 层

### 2.1 职责

`core` 负责定义一个 session 的基础运行骨架：

- 可程序化调用入口
- session identity
- run / step / resume 句柄
- turn state、budget、queued items
- transcript / snapshot / restore 的基础状态模型

### 2.2 子域职责

#### `api/`

负责对外可调用入口：

- `startSession`
- `resumeSession`
- `step`
- `cancel`
- `snapshot`

这层是 `engine-core` 被 CLI、server-host、测试运行器直接调用的统一入口。

#### `session/`

负责 session 级生命周期：

- session 创建
- session identity
- session mode
- session 句柄与恢复入口

#### `state/`

负责运行态状态模型：

- turn state
- in-progress tool ids
- queued commands / notifications
- continuation reason
- terminal result
- usage / budget / flags

#### `core/`

承接共享基础类型与主状态对象装配。

### 2.3 边界

`core` 不负责：

- prompt 拼装
- model request 组装
- tool 调度
- workbench 实际执行

`core` 只定义运行时骨架与状态约束。

## 3. assembly 层

### 3.1 职责

`assembly` 负责把当前轮的可见能力、上下文与请求语义编译成模型请求：

- context assembly
- prompt compilation
- attachments 注入
- final request assembly
- model streaming / retry / fallback

### 3.2 子域职责

#### `context/`

负责当前轮上下文构建：

- user context
- system context
- workspace / environment context
- CLAUDE.md / project instructions 注入
- attachment 统一装配

这层要承接盘点中的 `attachments.ts`、memory recall、hook response、task reminder、skill listing、agent listing、deferred tools、MCP instructions delta 等增量装配能力。

#### `prompt/`

负责 system prompt 与 prompt section 编译：

- default prompt
- coordinator prompt
- agent prompt
- custom prompt
- append prompt
- effective system prompt 优先级链

这层要显式保留 OpenCC 的优先级编译语义，避免把 system prompt 拼接散在多个模块。

#### `model-loop/`

负责模型交互协议：

- provider-neutral request 结构
- streaming chunk 处理
- usage 聚合
- retry / fallback
- prompt caching 行为
- 请求级 budget 与 recover 入口

#### `assembly/`

承接最终 request builder，把 `context`、`prompt`、`attachments`、`messages`、`tool surface` 编译成统一请求。

### 3.3 边界

`assembly` 不负责：

- 具体 shell/file 工具怎么执行
- 任务状态怎么写盘
- subagent / MCP 的完整长生命周期管理

它只负责编译“模型当前应看到什么”和“本轮请求该怎么发”。

## 4. core -> assembly 的主链

```text
session/session-handle
  -> state snapshot
  -> context assembly
  -> prompt compilation
  -> attachment injection
  -> message normalization
  -> final request assembly
  -> model-loop
```

这条主链对应 pre-design 中的：

- `02_session_orchestration.md`
- `04_selection_and_assembly.md`
- `runtime-loop/02_context_and_request_assembly.md`

## 5. 关键能力归位

### 5.1 必须在 `core` 建模的能力

- query / session state machine 的基础状态对象
- continuation reason
- terminal result
- transcript / history 的基础索引
- interrupted turn detection 所需状态
- queued items 与 next-turn consumption 的基础寄存面

### 5.2 必须在 `assembly` 建模的能力

- user context / system context
- CLAUDE.md 注入
- prompt section 组装
- effective system prompt 优先级链
- attachment 增量注入
- deferred tools / MCP delta 注入
- final request assembly pipeline
- message normalize / pairing 修复
- model request / streaming / retry / fallback

## 6. 当前阶段要求

当前阶段需要把 `core + assembly` 的主链能力设计完整：

- session/state 基础骨架
- context / prompt / model-loop 主链
- attachments 注入机制
- request/result 结构，能直接服务 `mock provider`

当前阶段不展开完整实现，但要保留位置和接口的能力：

- compaction 完整链
- long-term memory
- full MCP delta 完整体系
- coordinator / agent prompt 的完整变体体系

## 7. 参考输入

- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/02_session_orchestration.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/04_selection_and_assembly.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/99_gap_checklist.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/02_context_and_request_assembly.md`
