# OpenCC 运行时闭环：上下文、Prompt、Attachment 与请求装配

本篇回答四个问题：

1. 当前轮的 context 从哪里来
2. system prompt 是怎么拼的
3. attachment 是怎么被注入的
4. 最终 LLM request 是怎么组装出来的

## 1. context 不是一个对象，而是多层来源叠加

### 关键代码路径

- `opencc/src/context.ts`
- `opencc/src/utils/queryContext.ts`
- `opencc/src/constants/prompts.ts`
- `opencc/src/utils/systemPrompt.ts`
- `opencc/src/utils/attachments.ts`

### context 的主要来源

当前轮真正进入模型前，会叠加这些来源：

- default system prompt
- coordinator / agent / custom / append system prompt
- userContext
- systemContext
- 现有 message history
- attachment 增量
- tools schema
- MCP instructions / deferred tools / skill listing / agent listing 等动态能力信息

所以 OpenCC 的 context 不是“一个 JSON 对象”，而是一条持续拼装的消息与 prompt 链。

## 2. system prompt 的拼装有明确优先级

### 关键代码路径

- `opencc/src/constants/prompts.ts`
- `opencc/src/utils/systemPrompt.ts`
- `opencc/src/utils/queryContext.ts`

### 关键拼装链

`buildEffectiveSystemPrompt(...)` 的优先级是：

1. override system prompt
2. coordinator system prompt
3. agent system prompt
4. custom system prompt
5. default system prompt
6. appendSystemPrompt 追加在最后

### 运行时意义

这说明 OpenCC 的 system prompt 不是固定字符串，而是按会话模式和 agent 角色动态切换的：

- coordinator mode 会直接换 prompt
- main thread agent 会替换或追加 agent prompt
- custom prompt 会覆盖默认路径
- append prompt 会始终叠加在尾部

## 3. userContext / systemContext 是 cache-safe prefix 的组成部分

### 关键代码路径

- `opencc/src/context.ts`
- `opencc/src/utils/queryContext.ts`

### 关键拼装链

`fetchSystemPromptParts(...)` 会统一取回：

- `defaultSystemPrompt`
- `userContext`
- `systemContext`

这些部分被视为 API cache-key prefix 的核心组成：

- system prompt parts
- user context
- system context

### 运行时意义

这说明上下文不仅影响模型理解，也影响 prompt cache 命中。OpenCC 在这里已经显式把“上下文装配”和“缓存稳定性”绑在一起考虑了。

## 4. attachments 是正式装配层，不是边角料

### 关键代码路径

- `opencc/src/utils/attachments.ts`

### attachment 会装配什么

attachment 会把很多横切能力增量注入到当前轮上下文：

- skill listing
- agent listing delta
- deferred tools delta
- MCP instructions delta
- memory / relevant memories / nested memory
- hook response
- queued command / task reminder / todo reminder
- IDE selection / file snippets / selected lines
- teammate mailbox / team context

### 运行时意义

很多功能不是写死在 system prompt 里的，而是依赖 attachment 在恰当时机进入消息流。也就是说：

> attachment 是 OpenCC 把动态运行时状态注入给模型的正式通道。

## 5. skill listing / agent listing / deferred tools / MCP instructions 都是条件注入

### skill listing

关键链路：

- `getSkillToolCommands(cwd)`
- `getMcpSkillCommands(...)`
- `formatCommandsWithinBudget(...)`
- 生成 `skill_listing` attachment

特点：

- 会合并本地 skills 和 MCP skills
- 会按 context window 预算裁剪描述
- 不是把完整 skill 文件直接注入，而是只给模型一个 discovery 列表

### agent listing delta

关键链路：

- `shouldInjectAgentListInMessages()`
- `filterAgentsByMcpRequirements(...)`
- `filterDeniedAgents(...)`
- 生成 `agent_listing_delta` attachment

特点：

- 会重建“当前已宣布的 agent 集合”
- 只注入新增/移除的 delta
- 避免工具描述变化导致 cache bust

### deferred tools delta

关键链路：

- `isDeferredToolsDeltaEnabled()`
- `getDeferredToolsDelta(...)`
- 生成 `deferred_tools_delta` attachment

特点：

- 不是首次全量暴露所有工具
- 只在 delta 存在时增量通知模型
- 依赖 ToolSearch 能力与模型能力支持

### MCP instructions delta

关键链路：

- `isMcpInstructionsDeltaEnabled()`
- `getMcpInstructionsDelta(...)`
- 生成 `mcp_instructions_delta` attachment

特点：

- 把 MCP client instructions 作为增量注入，而不是反复拼进系统 prompt
- 避免 MCP 晚连接时反复 bust prompt cache

## 6. message normalize 是最终 API request 的最后整理层

### 关键代码路径

- `opencc/src/utils/messages.ts`
- `opencc/src/services/api/claude.ts`

### 关键整理内容

`normalizeMessagesForAPI(...)` 会做的事包括：

- 合并连续 user messages
- 处理 tool_result / tool_use pairing
- strip 不可发送的 tool reference / caller / advisor block
- strip 过量 media
- 修复 resume 后可能出现的 tool_use / tool_result 不匹配
- 处理 attachment message 到 user message 的归并
- 保持 assistant message 的多次 streaming merge

### 运行时意义

这说明“发给模型的 messages”并不是 session 中原始 messages 的直接镜像，而是一个经过 API 约束、模型能力、beta header、resume 修复等多轮整理后的最终版本。

## 7. 最终 LLM request 是在 API 层统一组装出来的

### 关键代码路径

- `opencc/src/query/deps.ts`
- `opencc/src/services/api/claude.ts`
- `opencc/src/query.ts`

### 关键装配链

1. query loop 把 messages、tools、systemPrompt 等交给 `callModel`
2. `queryModelWithStreaming(...)` 负责：
   - tool schema build
   - message normalization
   - tool-search / deferred-tools 相关后处理
   - attribution header / CLI sysprompt prefix 拼接
   - system prompt block build
   - beta headers / cache headers / thinking / effort 等最终 request 细节
3. 最后再把完整 request 发给模型并开始 streaming

### 运行时意义

最终请求的组装，不是 query.ts 自己完成的，而是：

- query 层负责决定“这一轮该发什么”
- API 层负责把这些内容变成“模型真正能接受的 request”

## 8. 这一阶段的关键结论

按运行时闭环看，OpenCC 的 prompt/request 装配不是单步操作，而是一个多层流水线：

1. system prompt 候选确定
2. user/system context 拉取
3. attachment 增量注入
4. skill/agent/MCP/tool surface 以 listing 或 delta 形式进入消息流
5. messages 做 API normalize
6. API 层再按模型能力和 beta/header/caching 规则构造最终 request

也就是说：

> OpenCC 的“prompt compiler”不是某个单文件，而是一条由 `systemPrompt + context + attachments + normalizeMessagesForAPI + queryModelWithStreaming` 共同组成的流水线。

这条流水线后续在 Ark Code 中必须显式建模，否则即便模块都在，也很容易行为不一致。
