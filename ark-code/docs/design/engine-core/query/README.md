# query 模块设计

## 0. 模块定位

`query/` 是 `engine-core` 的 turn 执行中枢。

它负责把一次输入推进成完整的模型循环，包括：

- 模型调用
- 工具执行
- continuation
- compact
- 终止条件检查
- 最终 result 形成

---

## 1. 职责与要求

### 职责

- 执行 turn 主循环
- 协调 model step 与 tool runtime
- 处理 stream event
- 执行 compact / snip / context collapse
- 执行 budget / turn-limit 检查
- 生成 stop reason 与最终结果

### 要求

- `query/` 是 session 语义核心，不能变成仅仅“发一个模型请求”
- `query/` 只依赖 `runtime/`、`state/`、`ports/`
- `query/` 不直接依赖 UI 或 provider SDK 实现
- continuation / compact / tool result budget 必须保留完整语义

---

## 2. 下属文件规划

```text
query/
  run-turn.ts
  query-loop.ts
  model-step.ts
  continuation.ts
  compact.ts
  snip.ts
  budget.ts
  stop-reason.ts
```

### 2.1 run-turn.ts

职责：

- 作为 query 层总入口，驱动一轮 turn

定义内容：

- `runTurn(session, turnContext)`
- `executeTurn()`
- `emitTurnEvents()`

逻辑要求：

- 接收 `context/` 产物
- 初始化 query-loop 所需状态
- 把输出归一为 `EngineEvent` / `EngineTurnResult`

OpenCC 参照代码：

- `opencc/src/QueryEngine.ts`
- `opencc/src/query.ts`

### 2.2 query-loop.ts

职责：

- 定义真正的循环推进逻辑

定义内容：

- `queryLoop(state, deps)`
- `advanceLoopIteration()`
- `handleAssistantMessage()`
- `handleToolUseBlocks()`
- `handleToolResults()`

逻辑要求：

- 这是 query 语义核心文件
- 要保留 assistant -> tool -> user/tool_result -> continue 的原始主链

OpenCC 参照代码：

- `opencc/src/query.ts`

### 2.3 model-step.ts

职责：

- 执行单次模型调用及其 streaming 处理

定义内容：

- `runModelStep()`
- `consumeModelStream()`
- `accumulateUsage()`
- `extractStopReasonFromStream()`

逻辑要求：

- 通过 `ModelPort` 调用模型
- 不直接关心 tool registry 以外的 runtime 细节

OpenCC 参照代码：

- `opencc/src/query.ts`
- `opencc/src/services/api/claude.ts`

### 2.4 continuation.ts

职责：

- 处理继续执行条件

定义内容：

- `shouldContinueTurn()`
- `buildContinuationInput()`
- `applyContinuationPolicy()`

逻辑要求：

- continuation 必须基于真实 stop reason、tool result、budget 状态判断
- 不能简化成“有工具调用就继续”这种弱逻辑

OpenCC 参照代码：

- `opencc/src/query.ts`

### 2.5 compact.ts

职责：

- 处理 compact / context collapse / tool result budget

定义内容：

- `applyMicrocompact()`
- `applyAutocompact()`
- `applyContextCollapse()`
- `applyToolResultBudget()`
- `emitCompactBoundary()`

逻辑要求：

- compact 必须同时更新 messages 和 transcript / projection 语义
- compact 后仍然可 resume、可 rewind、可继续 turn

OpenCC 参照代码：

- `opencc/src/query.ts`
- `opencc/src/services/compact/*`
- `opencc/src/utils/toolResultStorage.ts`

### 2.6 snip.ts

职责：

- 处理消息裁剪与 snip replay

定义内容：

- `applySnip()`
- `replaySnippedMessages()`
- `pruneMessageWindow()`

逻辑要求：

- snip 需要和 compact、resume、transcript 协同

OpenCC 参照代码：

- `opencc/src/query.ts`
- `opencc/src/tools/SnipTool/*`

### 2.7 budget.ts

职责：

- 处理各类预算与限制

定义内容：

- `checkTurnBudget()`
- `checkTaskBudget()`
- `checkMaxTurns()`
- `checkMaxBudgetUsd()`
- `checkStructuredOutputRetryLimit()`

逻辑要求：

- budget 检查是 query-loop 的一部分，不是外围装饰

OpenCC 参照代码：

- `opencc/src/query.ts`
- `opencc/src/bootstrap/state.ts`

### 2.8 stop-reason.ts

职责：

- 统一 stop reason 与终态判断

定义内容：

- `resolveStopReason()`
- `isSuccessfulTerminalState()`
- `buildErrorResult()`
- `buildSuccessResult()`

逻辑要求：

- 统一 result subtype 和 stop reason 解释规则

OpenCC 参照代码：

- `opencc/src/QueryEngine.ts`
- `opencc/src/query.ts`

---

## 3. 方法/类组织建议

`query/` 以函数为主，状态由 `session/` 注入或由 query-loop 局部持有。

建议：

- `query-loop.ts` 放循环主语义
- 其他文件只拆辅助子语义
- 不把 query 逻辑散落进 `api/`、`runtime/` 或 `state/`

---

## 4. 对 OpenCC 的对齐要求

Ark Code `query/` 的对齐对象是 OpenCC `opencc/src/query.ts` 的实际运行语义，不是它的单文件形态。

必须保留：

- tool use / tool result 的循环语义
- continuation 语义
- compact / snip / budget 语义
- turn 终态判断语义
