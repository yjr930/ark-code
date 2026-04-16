# execution 与 workbench 设计

## 1. 范围

本篇覆盖：

- `packages/engine-core/src/execution/`
- `packages/engine-core/src/runner/`
- `packages/engine-core/src/planner/`
- `packages/engine-core/src/workbench/`

以及 `workbench` 下的子域：

- `shell/`
- `files/`
- `patch/`
- `search/`
- `process/`
- `snapshot/`

## 2. execution 层职责

`execution` 负责把模型输出推进成真实执行：

- query loop
- tool round 调度
- tool orchestration
- planner policy
- workbench 调用
- follow-up turn 判定

## 3. runner

### 3.1 职责

`runner` 是执行编排中心，负责：

- 收集 `tool_use`
- 安排串行 / 并行批次
- 维护 in-progress tool ids
- 回放 context modifier
- 合并 tool results
- 处理 interrupt、synthetic result、error recovery

### 3.2 目录边界

`runner` 负责调度，不直接承载具体工具实现。

- shell 执行落在 `workbench/shell`
- 文件读写落在 `workbench/files`
- patch 落在 `workbench/patch`
- task 生命周期落在 `workbench/process`

## 4. planner

### 4.1 职责

`planner` 在 `engine-core` 中是策略层，不是重型独立执行器。

它负责：

- turn 级推进策略
- coordinator policy 接入位
- subagent / delegated execution 的策略边界
- 与 prompt policy 对齐的 orchestration 决策

### 4.2 边界

- 不重复实现 query loop
- 不替代 runner
- 不把执行逻辑搬出 `runner`

## 5. workbench

### 5.1 定位

`workbench` 是执行原语层，提供对工作区的真实操作面。

### 5.2 `shell/`

负责：

- shell exec
- cwd / env / sandbox
- dangerous command gating
- foreground / background command
- stdout / stderr 持久化
- stall watchdog

### 5.3 `files/`

负责：

- read text
- read image
- read pdf
- read notebook
- write
- edit
- 路径规范化与读取边界

### 5.4 `patch/`

负责：

- old/new string patch
- diff / edit 语义
- sed-style patch 兼容或替代

这一层必须独立成域。原因是 pre-design 已明确指出 patch 是高风险漏项，继续散在 file edit/bash 中会让后续设计与验证都失焦。

### 5.5 `search/`

负责：

- grep
- glob
- ripgrep 封装
- 搜索结果截断、分页、只读边界

### 5.6 `process/`

负责：

- task id / task status
- background shell task
- local agent task
- remote agent task 接入位
- output file / offset
- kill / cleanup / notification
- agent summary / progress aggregation

### 5.7 `snapshot/`

负责：

- worktree / workspace execution snapshot
- 与 subagent / recovery / continuation 共享的工作区状态视图

## 6. execution 主链

```text
query loop
  -> tool round
  -> runner batching
  -> workbench execution
  -> task / output / notification
  -> result handoff
  -> needsFollowUp ? next turn : terminal result
```

对应 pre-design 中的：

- `01_execution_and_workbench.md`
- `05_runtime_waiting_and_continuation.md`
- `runtime-loop/03_execution_and_tool_round.md`
- `runtime-loop/04_waiting_background_continuation.md`

## 7. 关键能力归位

### 7.1 必须在 `runner` 建模的能力

- tool pool 执行编排
- concurrency-safe batching
- streaming tool execution 接入
- synthetic tool results
- sibling error / abort 传播
- contextModifier 顺序回放

### 7.2 必须在 `workbench` 建模的能力

- shell / files / patch / search 原语
- task / process 生命周期
- output file continuation surface
- background shell 与 background task output handoff

### 7.3 与 `domains` 的边界

- `subagent` 虽然也是任务型执行，但其生命周期和 transcript 语义在 `domains/subagent`
- `runner` 只负责把 subagent 作为一种执行域接入当前 turn

## 8. 当前阶段要求

当前阶段必落：

- `runner`
- `workbench/shell`
- `workbench/files`
- `workbench/patch`
- `workbench/search`
- `workbench/process`

当前阶段可先保留接口：

- `snapshot`
- 完整 coordinator policy
- remote agent task 全链路

## 9. 参考输入

- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/01_execution_and_workbench.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/05_runtime_waiting_and_continuation.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/99_gap_checklist.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/03_execution_and_tool_round.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/04_waiting_background_continuation.md`
