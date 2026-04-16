# semantics 与 continuation 设计

## 1. 范围

本篇覆盖：

- `packages/engine-core/src/semantics/`
- `packages/engine-core/src/approval/`
- `packages/engine-core/src/memory/`
- `packages/engine-core/src/artifacts/`
- `packages/engine-core/src/results/`
- `packages/engine-core/src/events/`
- `packages/engine-core/src/hooks/`

这些目录承接跨层共享的正式运行时语义。

## 2. approval

### 2.1 职责

`approval` 负责运行时等待态与权限推进：

- permission context
- tool permission
- sandbox permission
- worker sandbox permission
- prompt queue
- MCP elicitation wait
- 多路审批竞态收敛

### 2.2 设计要求

approval 不是 UI 回调层，而是执行闭环的一部分。它必须能表达：

- 当前在等什么
- 等待结果如何推进 query loop
- 哪些 waiting state 会进入下一轮

## 3. memory

### 3.1 职责

`memory` 负责：

- memory taxonomy
- recall 接口
- attachment 注入所需的 memory surface
- session memory 与 compaction 的接入位

### 3.2 当前阶段位置

当前阶段不展开 long-term memory 完整体系，但要保留：

- recall surface
- attachment 接口
- compaction 协同边界

## 4. artifacts

### 4.1 职责

`artifacts` 负责中间产物与二进制产物的统一语义：

- binary / blob artifact
- output file
- transcript symlink output
- artifact/result 的持久化语义边界

它与 workbench/process 的关系是：

- `process` 负责任务生命周期
- `artifacts` 负责产物表达与落点语义

## 5. results

### 5.1 职责

`results` 负责：

- terminal result
- continuation result
- output handoff
- queued result consumption
- next-turn result surface

### 5.2 output handoff

`results` 必须显式建模以下链路：

```text
output file / transcript
  -> task-notification
  -> queued message / attachment
  -> next turn consumption
```

这条链路是后台 shell、background agent、MCP continuation 继续被会话消费的统一接口。

## 6. events

### 6.1 职责

`events` 负责统一 typed domain events：

- tool progress event
- task notification event
- approval event
- MCP event
- subagent event
- result projection event

### 6.2 设计要求

pre-design 已指出 events 是高风险漏项。Ark Code 需要把它收口成正式事件模型，再经 `bridge` / `server-host` 做投影。

## 7. hooks

### 7.1 职责

`hooks` 负责：

- hook registration
- skill / frontmatter hook 接入
- async hook registry
- hook response attachment
- stop hook continuation gate

### 7.2 边界

- hooks 的配置来源可以在宿主层
- hooks 的运行时语义必须在 `engine-core` 内，因为它直接影响 turn 推进与停止判断

## 8. continuation

### 8.1 定义

continuation 是 `engine-core` 的正式运行时语义，不只等于 `/resume`。它覆盖：

- background shell completion
- background agent completion
- permission wait 结束后继续执行
- MCP elicitation response / completion 后 retry
- reconnect / retry budget 内恢复
- queued commands / notifications 在下一轮被消费

### 8.2 continuation 需要的基础面

- waiting state model
- continuation reason
- result handoff
- queued item consumption
- transcript / output / attachment 三种回流面

## 9. 当前阶段要求

当前阶段必落：

- approval waiting state 基础模型
- results / events 基础模型
- task-notification 与 output handoff 设计
- hooks 的接入位与 stop gate 语义

当前阶段先保留接口：

- long-term memory 完整体系
- complex compaction 协同
- remote reconnect 完整路径
- MCP URL elicitation 完整状态机

## 10. 参考输入

- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/03_mcp_skills_memory_approval.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/05_runtime_waiting_and_continuation.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/99_gap_checklist.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/04_waiting_background_continuation.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/99_verification_matrix.md`
