# inventory 覆盖核对

本文件用于对照以下两份 pre-design 清单，检查 `06_inventory_mapping.md` 的覆盖程度：

- `engine-core-inventory/opencc-engine-core/99_gap_checklist.md`
- `runtime-loop-inventory/opencc-runtime-loop/99_verification_matrix.md`

覆盖状态分为三类：

- **已覆盖**：`06_inventory_mapping.md` 中已有明确功能组，且能定位到对应 Ark Code 目录与 OpenCC 路径
- **部分覆盖**：`06_inventory_mapping.md` 已覆盖所属主能力组，但没有拆到该条清单的细粒度要求
- **未覆盖**：`06_inventory_mapping.md` 中找不到对应条目，或当前仍无法定位到明确功能组

## 1. 对 `99_gap_checklist.md` 的核对

### 1.1 已覆盖

- query / session state machine
- model request / streaming / retry / fallback
- context assembly
- prompt compiler
- attachment 注入
- selection / assembly / injection
- tool pool / deferred tools
- tool orchestration
- shell runtime
- files runtime
- patch runtime
- search runtime
- process / task runtime
- subagent lifecycle
- worktree isolation
- skills registry 主体
- MCP config / auth / session / discovery / invoke
- approval / permission
- waiting queues
- memory recall / session memory 接口
- artifacts / binary output
- results / continuation result / handoff
- typed events / notifications
- hooks / stop gate
- background bash / task-notification / output handoff
- background agent completion 回流
- remote reconnect / continuation

这些条目在 `06_inventory_mapping.md` 中都已经有明确功能组、目标目录和 OpenCC 关键代码路径。

### 1.2 部分覆盖

以下条目已经纳入主能力组，但还没有在 `06_inventory_mapping.md` 中逐条细化：

#### query / session state machine 细项
- max turns / token budget continuation
- prompt-too-long recovery
- max_output_tokens recovery

#### context / prompt 细项
- system context 注入
- user context 注入
- CLAUDE.md 注入
- prompt section 组装
- message normalize / pairing
- final LLM request assembly pipeline

#### selection / assembly / injection 细项
- agent 候选筛选（MCP requirements + permission deny）
- agent listing 注入路径（prompt vs attachment）
- skill conditional activation
- skill listing 预算裁剪
- SkillTool forked prompt 组装
- MCP tools / commands / resources merge 链
- 条件激活 / 条件暴露机制

#### workbench / process 细项
- read image / pdf / notebook
- agent summary / progress aggregation
- bash path validation
- sed validation
- filesystem boundary by permission mode

#### subagent / orchestration 细项
- resumed subagent
- handoff / SendMessage 语义
- per-agent MCP
- teammate / mailbox 支撑链
- multi-agent spawn surface
- subagent task registration
- LocalAgentTask / RemoteAgentTask / spawnMultiAgent / teammate utils / mailbox bridge / SendMessageTool / worktree create-cleanup-dirty check / partial result extraction

#### transcript / history / resume / recovery 细项
- interrupted turn detection
- file history restore
- attribution restore
- todo restore
- context collapse state restore

#### hooks / gates 细项
- skill hook
- frontmatter hook
- async hook registry
- hook response attachment

#### MCP runtime 细项
- scope / policy filter
- transport model
- tools / prompts / resources load 的各子类拆分
- MCP commands merge / resources merge / prompts merge
- OAuth / XAA auth 分项
- official registry / Claude.ai connector / enterprise policy
- channel notification / channel permission
- large output / binary artifact handling
- useManageMCPConnections integration surface
- REPL/runtime merge surface

#### skills 细项
- bundled skills
- MCP skills
- legacy `/commands/` as skills
- command adapter
- skill resource extraction

#### approval / permission 细项
- resolveOnce / claim 多路竞态
- rules loader / parser
- mode 切换
- local interactive approval
- bridge remote approval
- channel approval relay
- coordinator / swarm worker approval
- classifier path
- speculative classifier with tool execution
- permission audit logging

#### memory / attachments / artifacts 细项
- memory taxonomy
- memory scan / memory command
- session memory extraction
- nested memory injection
- current session memory injection
- hook attachment
- queued command attachment
- user attachment ingest

#### events / observability 细项
- SDK event queue
- approval event
- MCP event
- subagent event
- compact boundary event
- result projection event

#### runtime waiting / continuation / output handoff 细项
- user-triggered backgrounding
- assistant auto-backgrounding
- stall watchdog / interactive prompt detection
- TaskOutputTool / Read handoff surface
- LocalAgentTask transcript symlink output
- pending message drain for subagents
- elicitation queue / response / completion flow
- permission waiting queues
- capacity wait / wake
- remote reconnect / retry budget
- output handoff into later turns

### 1.3 未覆盖

当前仍可视为未在 `06_inventory_mapping.md` 中明确落条目的主要是：

- `bridge/*` 应更多沉到 `packages/bridge/`
- `server/*` 应更多沉到 `packages/server-host/`
- `state/AppStateStore.ts` 需要拆 UI/runtime 混合态
- `main.tsx` / `REPL.tsx` 作为宿主入口壳层处理
- `tools/REPLTool/*` 与 `utils/processUserInput/*` 保持在交互层

这些内容目前在 `06_inventory_mapping.md` 中只通过“host boundary / 非 core 宿主壳层”做了聚合，还没有拆成独立排除条目。

## 2. 对 `99_verification_matrix.md` 的核对

### 2.1 已覆盖

以下主问题已在 `06_inventory_mapping.md` 中具备对应功能组：

- 入口 / 发现 / 筛选 / 激活
- 上下文 / Prompt / Request 装配
- 单轮执行 / Tool Round / Workbench
- 等待态 / 后台任务 / Continuation / 回流
- 横切机制核对
- Ark Code 实现验收标准中的模块本体 / 运行时闭环 / 结果回流

也就是说，从“主闭环阶段”角度，`06_inventory_mapping.md` 已经覆盖了 runtime-loop 的核心结构。

### 2.2 部分覆盖

以下条目已经有主能力组，但没有细化到 runtime-loop 的逐条检查粒度：

#### 入口 / 发现 / 筛选 / 激活
- prompt 输入进入 `processUserInput`
- slash command 输入进入 `processSlashCommand`
- bridge / remote 来源输入区分
- meta prompt 与普通 prompt 区分
- user prompt submit hooks 在 query 前拦截
- commands 候选集合的各类来源拆分
- skills 按文件 identity 去重
- activated skills 刷新 command caches
- allowedAgentTypes 裁剪 agent pool
- required MCP servers 未真正有 tools 时阻止 agent 进入运行
- MCP disabled / failed / pending / connected 状态影响 surface

#### 上下文 / Prompt / Request 装配
- default / coordinator / agent / custom / append system prompt 的每个子规则
- cache-safe prefix 相关 userContext/systemContext 语义
- skill listing / agent listing / deferred tools / MCP instructions 作为 attachment 的逐项规则
- compact / resume 后 listing / delta resurfaced 的细粒度行为
- assistant / user / attachment 在 normalize 阶段的细节
- tool-search / caller / advisor / media 等 API 后处理细项

#### 单轮执行 / Tool Round / Workbench
- assistant streaming 与 tool execution 交错的细粒度语义
- sibling error 中断并行工具
- streaming fallback 时 pending tools discard
- patch/edit 与 history/diagnostics/conditional skills 联动
- subagent / skill / MCP 三类高级执行接入点不降格为同步工具调用的全部细节
- execution error 不破坏后续 turn 一致性的具体恢复策略

#### 等待态 / 后台任务 / Continuation / 回流
- tool permission queue / sandbox queue / worker sandbox queue / prompt queue / elicitation queue 的 UI 聚合细节
- background shell 的 assistant auto-backgrounding 具体入口
- stall watchdog 交互式 prompt 检测细节
- task output 与 transcript / attachment 形成输出接力链的完整判定条件
- URL elicitation 的 `elicitation_complete` 等待链
- reconnect delay / attempt count / force reconnect 路径
- main thread 与 subagent 对通知消费权限的细分规则

### 2.3 未覆盖

当前在 `06_inventory_mapping.md` 中没有被显式拆成独立功能组的 runtime-loop 检查项主要有：

- UI 能根据 queue 决定当前 focus dialog
- shutdown / outer abort 打断 capacity wait
- force reconnect 路径存在
- consumed queued commands 会被清理
- compact / resume 后某些 surfaced 行为的显式状态恢复条件

这些项目现在仍属于“主能力组包含但未拆分验证点”之外，更适合作为下一轮 checklist 级补全文档的对象。

## 3. 当前完整性判断

### 3.1 可以确认的结论

- `06_inventory_mapping.md` 现在已经**没有明显大项遗漏**
- 对两个 inventory 的**主功能组**和**主闭环阶段**已经完成覆盖
- 高风险能力已经显式落位：
  - patch
  - events
  - results / output handoff
  - attachment
  - approval / waiting state

### 3.2 仍不能宣称的结论

当前还不能说：

- “已经与 `99_gap_checklist.md` 逐条完全对齐”
- “已经与 `99_verification_matrix.md` 每个子检查项完全一一对应”

因为：

- 现在完成的是**设计级归位矩阵**
- 还没有完成**清单级逐条映射矩阵**

### 3.3 最准确的状态表述

当前状态应表述为：

> `06_inventory_mapping.md` 已完成主功能组覆盖与主闭环覆盖；尚未完成对 `99_gap_checklist.md` 与 `99_verification_matrix.md` 的逐条清单级一一映射。

## 4. 下一步建议

如果要把这件事继续做实，下一步最合适的是新增一份“逐条映射矩阵”文档，专门列：

- checklist 条目
- 当前状态：已覆盖 / 部分覆盖 / 未覆盖
- 对应的 `06_inventory_mapping.md` 功能组
- 是否需要新增功能组，还是只需补细化说明

这样下一轮核对时，就不需要再从头人工比对。

## 5. 参考输入

- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/99_gap_checklist.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/99_verification_matrix.md`
- `ark-code/docs/design/engine-core/06_inventory_mapping.md`
