# OpenCC 运行时闭环：模型循环、Tool Round 与 Workbench 执行

本篇回答四个问题：

1. 一轮 query 是怎么推进的
2. model streaming 与 tool round 如何交替发生
3. tool orchestration 如何调度并发与串行执行
4. workbench shell/files/patch/search/process 如何在执行阶段落地

## 1. query loop 是单轮执行的主轴

### 关键代码路径

- `opencc/src/query.ts`
- `opencc/src/query/deps.ts`

### 单轮推进方式

在 query loop 中，一轮执行大致按下面顺序推进：

1. 把当前 messages / systemPrompt / context / tools 交给 `callModel`
2. 开始处理 streaming 响应
3. assistant message 流式进入
4. 若产生 `tool_use`，则收集到 `toolUseBlocks`
5. 若启用了 streaming tool execution，则工具在模型还没完全结束时就可提前进入执行
6. tool results 再被归并为新的 user/tool_result messages
7. 若本轮有 tool uses，则标记 `needsFollowUp = true`
8. 决定是否进入下一轮 turn

### 运行时意义

OpenCC 的一轮不是“模型输出完再统一执行工具”，而是支持边 streaming 边开始工具调度。query loop 本身就是 turn 级的协调器。

## 2. model streaming 和 tool round 是交织的

### 关键代码路径

- `opencc/src/query.ts`
- `opencc/src/services/tools/StreamingToolExecutor.ts`

### 关键执行链

在 `query.ts` 中：

1. assistant streaming 期间，新的 `tool_use` block 被不断累积
2. `streamingToolExecutor.addTool(...)` 会立即把这些工具加入执行队列
3. `streamingToolExecutor.getCompletedResults()` 会在模型 streaming 过程中不断吐出已完成的 tool results
4. 这些结果再被 `normalizeMessagesForAPI(...)` 归入 user/tool_result messages

### 运行时意义

tool round 不是严格的“assistant 完 -> tools 完 -> assistant 再来”三段式，而是：

- assistant streaming
- tool execute
- tool_result 回流

三者可以部分重叠。这是 OpenCC execution feel 的一个关键特征。

## 3. Tool orchestration 先分批，再决定并发或串行

### 关键代码路径

- `opencc/src/services/tools/toolOrchestration.ts`

### 核心机制

`runTools(...)` 会先：

1. 对 tool calls 做 `partitionToolCalls(...)`
2. 根据 `isConcurrencySafe(...)` 把工具分成：
   - 可并发安全执行的一批
   - 必须串行执行的单个或单批
3. 并发安全批次走 `runToolsConcurrently(...)`
4. 非并发安全批次走 `runToolsSerially(...)`

### 运行时意义

OpenCC 的 tool orchestration 不是简单 `Promise.all`。它显式建模了：

- 哪些工具可以并发
- 哪些工具必须独占执行
- 工具完成后如何逐步修改 context

这部分是 Ark Code 后续 runner 设计的重要依据。

## 4. StreamingToolExecutor 是“边流边跑工具”的执行器

### 关键代码路径

- `opencc/src/services/tools/StreamingToolExecutor.ts`

### 关键机制

`StreamingToolExecutor` 会维护一组 tracked tools：

- `queued`
- `executing`
- `completed`
- `yielded`

它负责：

1. 当 tool_use 到达时，把工具加入队列
2. 判断当前是否满足并发条件
3. 让 concurrency-safe 工具并行跑
4. 让非 concurrency-safe 工具独占跑
5. 在 sibling error / user interrupt / streaming fallback 时生成 synthetic error results
6. 把 progress 先行吐出，把最终结果按顺序回流

### 运行时意义

它本质上是 OpenCC 的一个“小型 tool scheduler + buffer + recovery executor”。

## 5. tool execution 不只是执行，还会改变后续 context

### 关键代码路径

- `opencc/src/services/tools/toolExecution.ts`
- `opencc/src/services/tools/toolOrchestration.ts`

### 关键机制

工具执行完后不只是返回 message，还可能带 contextModifier：

- 在串行路径中立即修改 `currentContext`
- 在并发批次中先缓存 modifier，再按工具顺序回放修改

### 运行时意义

这说明工具的运行结果不只是“文本输出”，还可能改变后续 query loop 看到的执行环境与上下文。Ark Code 里如果只把工具做成无状态 RPC，就会丢失这层语义。

## 6. Workbench / Shell：BashTool 负责入口，LocalShellTask 负责后台生命周期

### 关键代码路径

- `opencc/src/tools/BashTool/BashTool.tsx`
- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`

### 执行链

1. `BashTool` 负责：
   - 输入 schema
   - permission / classifier / validation
   - run_in_background
   - foreground progress streaming
2. `exec(...)` 创建 `shellCommand`
3. 前台路径会在 progress loop 中持续 yield progress
4. 若显式或自动后台化，则进入 `LocalShellTask`
5. `LocalShellTask` 管理 background status、output file、stall watchdog、completion notification

### 运行时意义

Bash 执行在 OpenCC 里已经拆成两层：

- tool 入口层
- 任务生命周期层

Ark Code 后续应保留这种分层，而不是把后台逻辑全塞进 shell exec 原语里。

## 7. Workbench / Files 与 Patch：FileEditTool 是执行与副作用汇合点

### 关键代码路径

- `opencc/src/tools/FileEditTool/FileEditTool.ts`
- `opencc/src/tools/FileEditTool/utils.ts`

### 执行链

FileEditTool 在执行阶段不仅做内容替换，还会联动：

- 写权限检查
- lane mode 决策
- team memory secret guard
- file history track
- git diff / patch 生成
- conditional skill discovery / activation
- LSP diagnostics 清理
- VS Code file update 通知

### 运行时意义

这说明 files/patch 不是简单 I/O 原语，而是 workbench 与 diagnostics/history/conditional skill activation 的交汇点。

## 8. Workbench / Search：搜索工具也是执行期观察原语

### 关键代码路径

- `opencc/src/tools/GrepTool/GrepTool.ts`
- `opencc/src/tools/GlobTool/GlobTool.ts`
- `opencc/src/utils/ripgrep.ts`

### 执行特点

搜索工具在 turn 内承担的是“观察工作区状态”的角色：

- 输入会先过 path / permission / ignore pattern 校验
- 输出会按 head_limit / offset / mode 做裁剪
- 结果既用于当前推理，也影响后续 skill 激活和上下文构造

### 运行时意义

search 不是纯辅助工具，而是 query loop 中高频的观察原语。Ark Code 的 workbench/search 需要保留这种“受权限约束的可裁剪观察”语义。

## 9. subagent / skill / MCP tool 都是执行层的特殊接入点

### subagent

关键代码路径：

- `opencc/src/tools/AgentTool/runAgent.ts`

运行时角色：

- 不是普通工具函数，而是启动一个新的 query loop
- 带独立 transcript / MCP / tool surface / context

### skill

关键代码路径：

- `opencc/src/tools/SkillTool/SkillTool.ts`
- `opencc/src/utils/processUserInput/processSlashCommand.tsx`

运行时角色：

- 不是简单字符串替换
- skill content 会被组装成 forked sub-agent prompt，交给 `runAgent(...)`
- 在 assistant mode 下还支持 fire-and-forget 的后台 fork

### MCP tool

关键代码路径：

- `opencc/src/services/mcp/client.ts`

运行时角色：

- 在执行层作为外部 capability invoke 进入
- 但其结果、elicitation、large output、auth/retry 都会继续影响 query loop

### 运行时意义

这三类能力都不是普通“同步工具调用”，而是执行层的高级接入点。Ark Code 后续的 engine-core 要为它们预留专门语义，而不是只靠统一 tool call 硬包一层。

## 10. 中断、fallback、synthetic result 是执行层恢复语义的一部分

### 关键代码路径

- `opencc/src/query.ts`
- `opencc/src/services/tools/StreamingToolExecutor.ts`

### 关键机制

执行阶段里，OpenCC 已经显式处理：

- model fallback 触发后重试整轮请求
- user interrupt 时为未闭合 tool_use 补 synthetic tool_result
- streaming fallback 时 discard pending tool execution
- sibling error 时取消并行为主的一组工具

### 运行时意义

这说明执行阶段本身已经内置恢复语义，而不是失败后全部丢给上层重跑。Ark Code 的 runner/model-loop 设计必须把这部分作为核心能力，而不是异常边角。

## 11. 本阶段的关键结论

按运行时闭环看，OpenCC 的执行阶段有三个核心特征：

1. **query loop 是总协调器**
   - 负责 turn 级推进、streaming、tool round、follow-up
2. **tool orchestration 是显式调度器**
   - 有并发/串行分批、有 contextModifier 回放、有 synthetic recovery
3. **workbench 是分层运行时**
   - shell/files/patch/search/process 不是简单工具库，而是带权限、状态、通知、恢复语义的执行面

这意味着 Ark Code 后续不能只把 OpenCC 抽成“API + 一堆 tools”，而必须保留：

- turn 协调
- tool scheduling
- workbench lifecycle
- 执行中断与恢复

否则行为上就不是同一个 engine-core。
