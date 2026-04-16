# packages: context / prompt / model-loop

## 1. `context/`

### 目标

组织进入当前轮的全部动态上下文。

### 职责

- system context
- user context
- attachment assembly
- queued prompt / task-notification 输入面
- skill listing
- agent listing delta
- deferred tools delta
- MCP instructions delta
- memory injection
- compaction / collapse 相关上下文

### 建议文件

```text
context/
  assembler.ts
  system_context.ts
  user_context.ts
  attachments.ts
  queues.ts
  skill_listing.ts
  agent_listing.ts
  deferred_tools.ts
  mcp_instructions.ts
  memory_context.ts
  compaction.ts
  collapse.ts
  compaction_context.ts
```

## 2. `prompt/`

### 目标

把当前轮上下文编译成 provider-neutral request。

### 职责

- default system prompt sections
- effective system prompt priority
- request shape
- cache-safe prefix
- model-facing capability text

### 建议文件

```text
prompt/
  compiler.ts
  system_prompt.ts
  prompt_sections.ts
  request_shape.ts
  cache_prefix.ts
```

## 3. `model-loop/`

### 目标

解释流式模型响应，并把响应转成 turn-level 行为。

### 职责

- text delta 聚合
- tool_use 提取
- finish reason
- usage 聚合
- fallback / retry 信号
- synthetic result 辅助信息

### 建议文件

```text
model-loop/
  model_loop.ts
  chunk_reducer.ts
  action_extractor.ts
  finish_reason.ts
  usage.ts
  fallback.ts
```

## 4. 关键关系

- `context/` 负责收集和筛选输入
- `prompt/` 负责结构化编译
- `model-loop/` 负责解释输出

## 5. 设计要求

- attachment 必须是一等公民
- prompt 组装必须显式表达优先级链
- final request assembly 必须可独立测试
- normalize 之后的 request 与原始 message history 必须区分
