# OpenCC 运行时闭环核对矩阵

本文件用于从运行时闭环角度核对 Ark Code engine-core 是否真正完成了 OpenCC 对应能力。

和按模块目录核对不同，这份矩阵要求每类能力都经过同样的问题检查：

1. 它如何进入系统
2. 它如何被发现与筛选
3. 它如何被装配到当前轮
4. 它如何进入 prompt / runtime surface
5. 它如何执行
6. 它如何进入等待态 / 后台 / continuation
7. 它如何恢复并把结果回流到下一轮

---

## 1. 入口 / 发现 / 筛选 / 激活

### 1.1 用户输入入口

- [ ] prompt 输入进入 `processUserInput`
- [ ] slash command 输入进入 `processSlashCommand`
- [ ] bridge / remote 来源输入可被区分
- [ ] meta prompt 与普通 prompt 可区分
- [ ] user prompt submit hooks 可在 query 前拦截

### 1.2 commands 候选集合

- [ ] built-in commands 被发现
- [ ] skill dir commands 被发现
- [ ] plugin skills 被发现
- [ ] bundled skills 被发现
- [ ] builtin plugin skills 被发现
- [ ] workflow commands 被发现
- [ ] dynamic skills 被并入 command surface
- [ ] availability requirement 会过滤 commands
- [ ] `isCommandEnabled` 会过滤 commands

### 1.3 skills 激活

- [ ] managed / user / project / additional / legacy `/commands/` skills 被发现
- [ ] skills 按文件 identity 去重
- [ ] conditional skills 与 unconditional skills 被分开
- [ ] conditional skills 仅在命中 `paths` 后激活
- [ ] activated skills 会刷新 command caches

### 1.4 agent 候选筛选

- [ ] agent definitions 被加载
- [ ] 按 MCP requirements 过滤 agent
- [ ] 按 permission deny rules 过滤 agent
- [ ] `allowedAgentTypes` 能进一步裁剪 agent pool
- [ ] fork / explicit subagent / coordinator mode 路径可区分
- [ ] required MCP servers 未真正有 tools 时会阻止 agent 进入运行

### 1.5 MCP surface 激活

- [ ] MCP connections 可建立
- [ ] MCP tools 被写入 `mcp.tools`
- [ ] MCP commands 被写入 `mcp.commands`
- [ ] MCP resources 被写入 `mcp.resources`
- [ ] disabled / failed / pending / connected 状态会影响可用 surface

---

## 2. 上下文 / Prompt / Request 装配

### 2.1 system prompt 组装

- [ ] default system prompt 可生成
- [ ] coordinator system prompt 可替换默认 prompt
- [ ] agent system prompt 可替换或追加默认 prompt
- [ ] custom system prompt 可覆盖默认 prompt
- [ ] appendSystemPrompt 可稳定追加在尾部
- [ ] effective system prompt 优先级链被显式建模

### 2.2 userContext / systemContext

- [ ] `getUserContext()` 可生成当前用户上下文
- [ ] `getSystemContext()` 可生成系统上下文
- [ ] 这两者被作为 cache-safe prefix 组成部分

### 2.3 attachment 注入

- [ ] skill listing 可作为 attachment 注入
- [ ] agent listing delta 可作为 attachment 注入
- [ ] deferred tools delta 可作为 attachment 注入
- [ ] MCP instructions delta 可作为 attachment 注入
- [ ] relevant memories / nested memory 可注入
- [ ] async hook response 可注入
- [ ] queued prompt / task notification 可注入
- [ ] teammate mailbox / team context 可注入

### 2.4 预算与条件装配

- [ ] skill listing 会按 context budget 裁剪
- [ ] deferred tools 只在 delta 存在时注入
- [ ] MCP instructions 只在 delta 存在时注入
- [ ] agent listing 支持 prompt / attachment 两种暴露方式
- [ ] compact / resume 后某些 listing/delta 会被重新 surfaced

### 2.5 最终 API request 装配

- [ ] messages 在 API 发送前被 normalize
- [ ] assistant / user / attachment 会按 API 约束重新整理
- [ ] tool_use/tool_result pairing 会被修复
- [ ] tool-search / caller / advisor / media 等模型约束会被后处理
- [ ] 最终 request 在 `queryModelWithStreaming` 层统一构造

---

## 3. 单轮执行 / Tool Round / Workbench

### 3.1 query loop

- [ ] query loop 能推进单轮执行
- [ ] assistant streaming 能持续产生 message
- [ ] tool_use blocks 能被收集
- [ ] tool results 能被合并回本轮结果集
- [ ] `needsFollowUp` 能驱动下一轮

### 3.2 tool orchestration

- [ ] tool calls 会按 concurrency safety 分批
- [ ] concurrency-safe 工具可并行执行
- [ ] 非 concurrency-safe 工具可串行执行
- [ ] contextModifier 可按顺序回放
- [ ] in-progress tool ids 会被正确维护

### 3.3 streaming tool execution

- [ ] tool 可在 assistant streaming 尚未结束时提前执行
- [ ] progress 可先于 final result 发出
- [ ] sibling error 可中断并行工具
- [ ] streaming fallback 时 pending tools 可 discard
- [ ] synthetic tool results 可用于错误/中断恢复

### 3.4 shell / files / patch / search

- [ ] shell exec 可执行并产出 progress/result
- [ ] foreground shell 能流式反馈输出
- [ ] file read/write/edit 可执行
- [ ] patch/edit 不只是 I/O，还会联动 history/diagnostics/conditional skills
- [ ] grep/glob/search 可作为执行期观察原语

### 3.5 高级执行接入点

- [ ] subagent 能启动独立 query loop
- [ ] skill 能转成 forked sub-agent prompt 执行
- [ ] MCP tool 能进入 tool execution 流
- [ ] 这三类能力不会被降格为普通同步工具调用

### 3.6 执行期恢复语义

- [ ] model fallback 后整轮可重试
- [ ] user interrupt 时未闭合 tool_use 可补 synthetic result
- [ ] streaming fallback 时工具状态可清理
- [ ] execution error 不会破坏后续 turn 的一致性

---

## 4. 等待态 / 后台任务 / Continuation / 回流

### 4.1 等待态

- [ ] tool permission queue 存在
- [ ] sandbox permission queue 存在
- [ ] worker sandbox permission queue 存在
- [ ] prompt queue 存在
- [ ] MCP elicitation queue 存在
- [ ] UI 能根据 queue 决定当前 focus dialog

### 4.2 background bash

- [ ] `run_in_background` 入口存在
- [ ] assistant auto-backgrounding 入口存在
- [ ] `LocalShellTask` 能承接后台 shell 生命周期
- [ ] output file 会被写出
- [ ] `<task-notification>` 会在完成时发出
- [ ] stall watchdog 能检测交互式卡住 prompt

### 4.3 background agent

- [ ] async agent 会注册为 `local_agent` task
- [ ] transcript 会持续写盘
- [ ] task output 可指向 transcript symlink
- [ ] pending messages 可在后续 turn drain
- [ ] agent completion notification 会回流主线程

### 4.4 task notification 与 output handoff

- [ ] shell / agent / remote task 都能回流统一 task-notification
- [ ] notification 中包含 output file path
- [ ] 后续可通过 Read 直接消费 output file
- [ ] TaskOutputTool 可阻塞或非阻塞读取任务输出
- [ ] output file / transcript / notification / attachment 能形成输出接力链

### 4.5 MCP elicitation continuation

- [ ] elicitation request 能被注册 handler 接住
- [ ] hook 可先行解决 elicitation
- [ ] 否则进入 `elicitation.queue`
- [ ] 用户响应后可运行 elicitation result hooks
- [ ] URL mode 下可等待 `elicitation_complete`
- [ ] 完成后原 MCP tool call 可继续 retry

### 4.6 capacity wait / wake

- [ ] at-capacity 时 poll loop 能进入等待态
- [ ] `createCapacityWake()` 能生成可中断等待 signal
- [ ] capacity 释放时能通过 `wake()` 恢复 poll loop
- [ ] shutdown / outer abort 可打断等待

### 4.7 remote reconnect / continuation

- [ ] transient close 可触发 reconnect
- [ ] permanent close code 可终止 continuation
- [ ] `4001 session not found` 有独立 retry budget
- [ ] reconnect delay / attempt count 可控
- [ ] force reconnect 路径存在

### 4.8 下一轮回流

- [ ] query loop 能从 queued commands snapshot 中取回可消费项
- [ ] main thread 与 subagent 只消费各自允许的通知
- [ ] consumed queued commands 会被清理
- [ ] 后台结果可并入下一轮 `toolResults`

---

## 5. 横切机制核对

### 5.1 选择 / 装配 / 注入

- [ ] 每类能力都已盘“如何被发现”
- [ ] 每类能力都已盘“如何被筛选”
- [ ] 每类能力都已盘“如何进入当前候选集合”
- [ ] 每类能力都已盘“如何进入 prompt / runtime surface”
- [ ] attachment 作为统一装配层已被显式建模

### 5.2 continuation / recovery / output handoff

- [ ] continuation 不只等于 resume
- [ ] retry / reconnect / background completion / next-turn consumption 都已被纳入 continuation 语义
- [ ] output handoff 已作为一级机制建模

---

## 6. Ark Code 实现验收标准

当 Ark Code 后续实现 `engine-core` 时，只有同时满足下面三条，才算真正完成对 OpenCC 的对应能力复刻：

- [ ] 模块本体存在
- [ ] 运行时闭环存在
- [ ] 结果回流与后续消费链存在

如果只满足第一条，而第二、第三条没有完成，那么行为上仍然不等价于 OpenCC 的 engine-core。
