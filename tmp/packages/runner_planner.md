# packages: runner / planner

## 1. `runner/`

### 目标

负责 turn 内执行编排，是 `engine-core` 的总协调器。

### 职责

- query loop
- turn runner
- tool round
- tool scheduler
- concurrency control
- contextModifier 回放
- interrupt / fallback / synthetic result recovery

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

### 关键对象

- `QueryLoopState`
- `TurnExecutionPlan`
- `ToolBatch`
- `ToolScheduleDecision`
- `RecoveryDecision`

## 2. `planner/`

### 目标

承接 prompt-level planning、coordinator 与 delegation 语义。

### 职责

- coordinator mode
- delegation policy
- verification policy
- planning policy
- selection policy

### 建议文件

```text
planner/
  coordinator.ts
  delegation.ts
  verification.ts
  planning_policy.ts
  selection_policy.ts
```

### 关键对象

- `CoordinatorModeConfig`
- `DelegationDecision`
- `VerificationPlan`
- `PlanningPolicy`
- `SelectionPolicy`

## 3. 关键关系

- `runner/` 决定一轮怎么跑
- `planner/` 决定哪些工作要派发、验证、继续

## 4. 设计要求

- `runner/` 必须显式建模工具并发与串行批次
- `planner/` 不做假想重型 planner，保留 OpenCC 的 prompt-level orchestration 语义
- tool results 对 context 的修改必须是正式机制，不能靠隐式共享变量
