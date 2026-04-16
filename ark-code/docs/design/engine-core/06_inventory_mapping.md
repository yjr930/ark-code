# pre-design 功能归位

## 1. 使用方式

本表把 pre-design 盘点中的主要功能组映射到 Ark Code `engine-core` 的：

- 目标层级
- 目标目录
- OpenCC 参照范围
- OpenCC 关键代码路径
- 对应设计文档
- 当前阶段状态

状态说明：

- **必落**：当前阶段就要完成设计并作为主链能力落位
- **保留接口**：当前阶段写清目录与接口边界，不展开完整实现
- **暂不展开**：当前阶段不做实现展开，但要明确不在范围

## 2. 归位矩阵

| 功能组 | 目标层级 | 目标目录 | OpenCC 参照范围 | OpenCC 关键代码路径 | 对应设计文档 | 当前阶段状态 |
| --- | --- | --- | --- | --- | --- | --- |
| query / session state machine | core | `src/core/session/` `src/core/state/` | 单轮执行主循环、continuation reason、terminal result、token budget、stop hook gate | `opencc/src/query.ts` `opencc/src/query/config.ts` `opencc/src/query/tokenBudget.ts` `opencc/src/query/stopHooks.ts` | `02_core_and_assembly.md` | 必落 |
| API / session handle / step / resume | core | `src/core/api/` `src/core/session/` | 可程序化入口、headless 调用面、会话句柄 | `opencc/src/QueryEngine.ts` `opencc/src/query.ts` `opencc/src/commands/resume/index.ts` | `02_core_and_assembly.md` | 必落 |
| 用户输入入口 / 命令入口 | core + assembly | `src/core/api/` `src/assembly/context/` | prompt 输入、slash command、bridge/remote 输入、meta prompt 区分 | `opencc/src/main.tsx` `opencc/src/screens/REPL.tsx` `opencc/src/commands.ts` `opencc/src/utils/processUserInput/*` | `02_core_and_assembly.md` | 必落 |
| transcript / history / restore 基础模型 | core + semantics | `src/core/state/` `src/semantics/results/` | transcript store、history、resume、conversation recovery、restore | `opencc/src/history.ts` `opencc/src/utils/sessionStorage.ts` `opencc/src/utils/conversationRecovery.ts` `opencc/src/utils/sessionRestore.ts` | `02_core_and_assembly.md` `05_semantics_and_continuation.md` | 必落 |
| restore fine-grained state | core + semantics | `src/core/state/` `src/semantics/results/` `src/semantics/memory/` | interrupted turn、file history、attribution、todo、context collapse state restore | `opencc/src/utils/sessionRestore.ts` `opencc/src/history.ts` `opencc/src/services/contextCollapse/index.ts` | `02_core_and_assembly.md` `05_semantics_and_continuation.md` | 保留接口 |
| query loop / follow-up turn | execution + core | `src/execution/runner/` `src/core/state/` | 单轮执行推进、tool_use 收集、toolResults 回并、needsFollowUp、终止判定 | `opencc/src/query.ts` `opencc/src/QueryEngine.ts` | `03_execution_and_workbench.md` | 必落 |
| continuation budget / output-limit recovery | core + assembly + semantics | `src/core/state/` `src/assembly/model-loop/` `src/semantics/results/` | max turns、token budget、prompt-too-long、max_output_tokens recovery | `opencc/src/query/tokenBudget.ts` `opencc/src/services/compact/compact.ts` `opencc/src/query.ts` | `02_core_and_assembly.md` `05_semantics_and_continuation.md` | 必落 |
| context assembly | assembly | `src/assembly/context/` | user/system context、workspace context、CLAUDE.md 注入、context parts 聚合 | `opencc/src/context.ts` `opencc/src/utils/queryContext.ts` | `02_core_and_assembly.md` | 必落 |
| prompt compiler | assembly | `src/assembly/prompt/` | default/coordinator/agent/custom/append prompt 优先级编译 | `opencc/src/constants/prompts.ts` `opencc/src/utils/systemPrompt.ts` | `02_core_and_assembly.md` | 必落 |
| model request / streaming / retry / fallback | assembly | `src/assembly/model-loop/` | request builder、streaming chunk 处理、usage 聚合、retry / fallback、cache 行为 | `opencc/src/services/api/claude.ts` `opencc/src/query/deps.ts` `opencc/src/query.ts` | `02_core_and_assembly.md` | 必落 |
| message normalize / final API request assembly | assembly | `src/assembly/context/` `src/assembly/model-loop/` | messages normalize、tool_use/tool_result pairing 修复、API request 最终整理 | `opencc/src/utils/messages.ts` `opencc/src/services/api/claude.ts` `opencc/src/query/deps.ts` | `02_core_and_assembly.md` | 必落 |
| context compaction / overflow recovery | assembly + semantics | `src/assembly/context/` `src/semantics/memory/` `src/semantics/results/` | snip、microcompact、autocompact、manual compact、context collapse、session memory 协同 | `opencc/src/services/compact/autoCompact.ts` `opencc/src/services/compact/microCompact.ts` `opencc/src/services/compact/compact.ts` `opencc/src/services/contextCollapse/index.ts` `opencc/src/services/SessionMemory/sessionMemory.ts` | `02_core_and_assembly.md` `05_semantics_and_continuation.md` | 保留接口 |
| attachment 注入 | assembly + semantics | `src/assembly/context/` `src/semantics/memory/` `src/semantics/results/` | memory、hook response、task reminder、agent listing、skill listing、deferred tools、MCP instructions delta 注入 | `opencc/src/utils/attachments.ts` `opencc/src/utils/toolSearch.ts` `opencc/src/utils/mcpInstructionsDelta.ts` `opencc/src/memdir/findRelevantMemories.ts` | `02_core_and_assembly.md` `05_semantics_and_continuation.md` | 必落 |
| memory injection variants | semantics + assembly | `src/semantics/memory/` `src/assembly/context/` `src/semantics/results/` | nested memory、current session memory、queued command attachment | `opencc/src/memdir/findRelevantMemories.ts` `opencc/src/services/SessionMemory/sessionMemory.ts` `opencc/src/utils/attachments.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| prompt / runtime 装配完整性 | assembly + execution + semantics | `src/assembly/context/` `src/assembly/prompt/` `src/assembly/model-loop/` `src/execution/runner/` `src/semantics/results/` | prompt/compiler/attachment/normalize/request/tool round 的完整流水线 | `opencc/src/context.ts` `opencc/src/utils/systemPrompt.ts` `opencc/src/utils/attachments.ts` `opencc/src/utils/messages.ts` `opencc/src/services/api/claude.ts` `opencc/src/query.ts` | `02_core_and_assembly.md` `03_execution_and_workbench.md` `05_semantics_and_continuation.md` | 必落 |
| commands 候选集合 / command surface | assembly + domains | `src/assembly/context/` `src/domains/skills/` `src/domains/subagent/` | built-in commands、skill dir commands、bundled / workflow commands、dynamic skills 并入 command surface | `opencc/src/commands.ts` `opencc/src/skills/loadSkillsDir.ts` `opencc/src/tools/AgentTool/loadAgentsDir.ts` | `04_domains.md` | 保留接口 |
| selection / assembly / injection | assembly + domains | `src/assembly/context/` `src/domains/skills/` `src/domains/subagent/` `src/domains/mcp/` | agent / skill / MCP / deferred tools 的发现、筛选、预算与条件注入 | `opencc/src/tools/AgentTool/prompt.ts` `opencc/src/skills/loadSkillsDir.ts` `opencc/src/utils/attachments.ts` `opencc/src/utils/toolSearch.ts` | `01_layers_and_dependencies.md` `04_domains.md` | 必落 |
| agent listing 暴露路径 / prompt vs attachment | assembly + domains | `src/assembly/context/` `src/domains/subagent/` | agent listing 走 prompt 或 attachment、allowedAgentTypes 裁剪、required MCP server gate | `opencc/src/tools/AgentTool/prompt.ts` `opencc/src/utils/attachments.ts` `opencc/src/tools/AgentTool/agentToolUtils.ts` | `04_domains.md` | 必落 |
| 条件激活 / 条件暴露机制 | assembly + domains + semantics | `src/assembly/context/` `src/domains/skills/` `src/domains/subagent/` `src/domains/mcp/` `src/semantics/approval/` | feature gate、permission gate、MCP requirement gate、context-window budget gate、already-sent gate | `opencc/src/skills/loadSkillsDir.ts` `opencc/src/tools/AgentTool/prompt.ts` `opencc/src/utils/attachments.ts` `opencc/src/utils/toolSearch.ts` `opencc/src/utils/mcpInstructionsDelta.ts` | `01_layers_and_dependencies.md` `04_domains.md` `05_semantics_and_continuation.md` | 必落 |
| tool pool / deferred tools | execution + assembly | `src/execution/runner/` `src/assembly/context/` `src/execution/workbench/` | built-in tools + MCP tools 合并、deferred tools 渐进暴露、agent tool surface resolve | `opencc/src/tools.ts` `opencc/src/hooks/useMergedTools.ts` `opencc/src/tools/AgentTool/agentToolUtils.ts` `opencc/src/utils/toolSearch.ts` | `03_execution_and_workbench.md` | 必落 |
| tool orchestration | execution | `src/execution/runner/` | tool_use 到执行的编排、串并行批次、contextModifier、synthetic result、abort | `opencc/src/services/tools/toolOrchestration.ts` `opencc/src/services/tools/toolExecution.ts` `opencc/src/services/tools/StreamingToolExecutor.ts` | `03_execution_and_workbench.md` | 必落 |
| execution recovery / synthetic result | execution + semantics | `src/execution/runner/` `src/semantics/results/` | interrupt recovery、synthetic tool result、fallback 后状态清理、turn 一致性维持 | `opencc/src/services/tools/toolOrchestration.ts` `opencc/src/services/tools/StreamingToolExecutor.ts` `opencc/src/query.ts` | `03_execution_and_workbench.md` `05_semantics_and_continuation.md` | 必落 |
| shell runtime | execution | `src/execution/workbench/shell/` | shell exec、sandbox、cwd/env、dangerous command gating、前后台切换、输出持久化 | `opencc/src/tools/BashTool/BashTool.tsx` `opencc/src/utils/shell/shellProvider.ts` `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx` | `03_execution_and_workbench.md` | 必落 |
| shell approval surface | execution + semantics | `src/execution/workbench/shell/` `src/semantics/approval/` | bash path validation、sed validation、filesystem boundary by permission mode | `opencc/src/tools/BashTool/BashTool.tsx` `opencc/src/tools/BashTool/sedEditParser.ts` `opencc/src/hooks/toolPermission/handlers/interactiveHandler.ts` | `03_execution_and_workbench.md` `05_semantics_and_continuation.md` | 必落 |
| files runtime | execution | `src/execution/workbench/files/` | 文本/图片/PDF/notebook 读取、write/edit、路径与权限边界 | `opencc/src/tools/FileReadTool/FileReadTool.ts` `opencc/src/tools/FileEditTool/FileEditTool.ts` `opencc/src/tools/FileWriteTool/FileWriteTool.ts` | `03_execution_and_workbench.md` | 必落 |
| media file readers | execution | `src/execution/workbench/files/` | image / pdf / notebook 读取子能力 | `opencc/src/tools/FileReadTool/FileReadTool.ts` | `03_execution_and_workbench.md` | 必落 |
| patch runtime | execution | `src/execution/workbench/patch/` | old/new string patch、diff/edit 语义、sed-style patch 兼容 | `opencc/src/tools/FileEditTool/utils.ts` `opencc/src/tools/FileEditTool/types.ts` `opencc/src/tools/BashTool/sedEditParser.ts` | `03_execution_and_workbench.md` | 必落 |
| search runtime | execution | `src/execution/workbench/search/` | grep、glob、ripgrep 封装、结果截断与分页 | `opencc/src/tools/GrepTool/GrepTool.ts` `opencc/src/tools/GlobTool/GlobTool.ts` `opencc/src/utils/ripgrep.ts` | `03_execution_and_workbench.md` | 必落 |
| search / code-search boundary | execution | `src/execution/workbench/search/` | grep / glob / ripgrep 与 code search 边界、只读边界 | `opencc/src/tools/GrepTool/GrepTool.ts` `opencc/src/tools/GlobTool/GlobTool.ts` `opencc/src/utils/ripgrep.ts` | `03_execution_and_workbench.md` | 必落 |
| process / task runtime | execution | `src/execution/workbench/process/` | task id / task status、background shell / local agent / remote agent、output file、cleanup、notification | `opencc/src/Task.ts` `opencc/src/tasks.ts` `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx` `opencc/src/tasks/LocalAgentTask/LocalAgentTask.js` `opencc/src/tasks/RemoteAgentTask/RemoteAgentTask.js` | `03_execution_and_workbench.md` | 必落 |
| task progress / summary aggregation | execution + semantics | `src/execution/workbench/process/` `src/semantics/events/` `src/semantics/results/` | agent summary、progress aggregation、partial result extraction | `opencc/src/tasks/LocalAgentTask/LocalAgentTask.js` `opencc/src/tasks/RemoteAgentTask/RemoteAgentTask.js` `opencc/src/services/tools/toolExecution.ts` | `03_execution_and_workbench.md` `05_semantics_and_continuation.md` | 必落 |
| background bash / task-notification / output handoff | execution + semantics | `src/execution/workbench/process/` `src/semantics/results/` `src/semantics/events/` | background bash、task-notification、output file continuation、TaskOutput / Read handoff | `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx` `opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx` `opencc/src/utils/task/diskOutput.js` | `03_execution_and_workbench.md` `05_semantics_and_continuation.md` | 必落 |
| backgrounding policy / stall watchdog / TaskOutput handoff | execution + semantics | `src/execution/workbench/process/` `src/execution/workbench/shell/` `src/semantics/results/` | user-triggered backgrounding、assistant auto-backgrounding、stall watchdog、TaskOutputTool / Read handoff | `opencc/src/tools/BashTool/BashTool.tsx` `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx` `opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx` | `03_execution_and_workbench.md` `05_semantics_and_continuation.md` | 必落 |
| task-notification 协议 / next-turn consumption | execution + semantics | `src/execution/workbench/process/` `src/semantics/results/` `src/semantics/events/` | task-notification、queued command snapshot、next-turn result consumption、pending queue drain | `opencc/src/constants/xml.ts` `opencc/src/query.ts` `opencc/src/utils/attachments.ts` `opencc/src/utils/messageQueueManager.js` | `03_execution_and_workbench.md` `05_semantics_and_continuation.md` | 必落 |
| snapshot / worktree 视图 | execution | `src/execution/workbench/snapshot/` | worktree / workspace snapshot、隔离视图、恢复协同 | `opencc/src/utils/worktree.js` `opencc/src/tools/AgentTool/worktreeIsolationVisibility.js` | `03_execution_and_workbench.md` | 保留接口 |
| planner / coordinator policy | execution | `src/execution/planner/` | coordinator mode、prompt-level planner、delegation policy、resume mode 匹配 | `opencc/src/coordinator/coordinatorMode.ts` `opencc/src/tools/AgentTool/prompt.ts` `opencc/src/tools/shared/spawnMultiAgent.js` | `03_execution_and_workbench.md` | 保留接口 |
| subagent lifecycle | domains | `src/domains/subagent/` | agent spawn / fork / resume、per-agent tools、sidechain transcript、handoff | `opencc/src/tools/AgentTool/AgentTool.tsx` `opencc/src/tools/AgentTool/runAgent.ts` `opencc/src/tools/AgentTool/forkSubagent.ts` `opencc/src/tools/AgentTool/resumeAgent.ts` | `04_domains.md` | 保留接口 |
| AgentTool runtime / multi-agent spawn | domains + execution | `src/domains/subagent/` `src/execution/workbench/process/` | AgentTool runtime、RemoteAgentTask、spawnMultiAgent、多代理 surface | `opencc/src/tools/AgentTool/AgentTool.tsx` `opencc/src/tasks/RemoteAgentTask/RemoteAgentTask.js` `opencc/src/tools/shared/spawnMultiAgent.js` | `04_domains.md` | 保留接口 |
| worktree isolation | domains | `src/domains/subagent/` `src/execution/workbench/snapshot/` | worktree create / cleanup / dirty check、隔离可见性、teammate/worktree 协同 | `opencc/src/utils/worktree.js` `opencc/src/tools/AgentTool/worktreeIsolationVisibility.js` `opencc/src/tools/shared/spawnMultiAgent.js` | `04_domains.md` | 保留接口 |
| worktree visibility / per-agent MCP | domains + execution | `src/domains/subagent/` `src/execution/workbench/snapshot/` `src/domains/mcp/` | worktree visibility、prompt exposure、per-agent MCP | `opencc/src/tools/AgentTool/worktreeIsolationVisibility.js` `opencc/src/utils/worktree.js` `opencc/src/tools/AgentTool/runAgent.ts` | `04_domains.md` | 保留接口 |
| mailbox / teammate / handoff supporting surfaces | domains + semantics | `src/domains/subagent/` `src/semantics/results/` | teammate utils、mailbox bridge、SendMessage、partial result extraction、handoff supporting surfaces | `opencc/src/context/mailbox.tsx` `opencc/src/hooks/useMailboxBridge.ts` `opencc/src/utils/teammate.js` `opencc/src/tools/SendMessageTool/*` | `04_domains.md` `05_semantics_and_continuation.md` | 保留接口 |
| local / bundled / MCP skills | domains | `src/domains/skills/` | local / bundled / MCP skills 注册、legacy commands 兼容、skill registry | `opencc/src/skills/loadSkillsDir.ts` `opencc/src/skills/bundledSkills.ts` `opencc/src/skills/mcpSkillBuilders.ts` `opencc/src/commands.ts` | `04_domains.md` | 保留接口 |
| skill listing budget / conditional activation | domains + assembly | `src/domains/skills/` `src/assembly/context/` | conditional skills、listing budget、forked prompt 准备、attachment skill listing | `opencc/src/skills/loadSkillsDir.ts` `opencc/src/tools/SkillTool/prompt.ts` `opencc/src/tools/SkillTool/SkillTool.ts` `opencc/src/utils/attachments.ts` | `04_domains.md` | 保留接口 |
| skill execution adapter / forked prompt | domains + assembly | `src/domains/skills/` `src/assembly/context/` `src/domains/subagent/` | SkillTool forked prompt、command adapter、resource extraction、identity dedupe、cache refresh | `opencc/src/tools/SkillTool/SkillTool.ts` `opencc/src/tools/SkillTool/prompt.ts` `opencc/src/skills/loadSkillsDir.ts` `opencc/src/commands.ts` | `04_domains.md` | 保留接口 |
| MCP config / auth / session / discovery / invoke | domains | `src/domains/mcp/` | config merge、auth、connection lifecycle、tools/resources/prompts/commands load、invoke | `opencc/src/services/mcp/config.ts` `opencc/src/services/mcp/auth.ts` `opencc/src/services/mcp/client.ts` `opencc/src/services/mcp/useManageMCPConnections.ts` | `04_domains.md` | 保留接口 |
| MCP surface state / merge chain | domains | `src/domains/mcp/` | mcp.tools / commands / resources 状态、merge chain、surface state model | `opencc/src/services/mcp/useManageMCPConnections.ts` `opencc/src/services/mcp/client.ts` `opencc/src/screens/REPL.tsx` | `04_domains.md` | 保留接口 |
| MCP policy / transport / auth / registry / runtime merge | domains + semantics | `src/domains/mcp/` `src/semantics/results/` `src/semantics/events/` | scope/policy、transport、OAuth/XAA、official registry、Claude.ai connector、REPL/runtime merge、large output handling | `opencc/src/services/mcp/config.ts` `opencc/src/services/mcp/auth.ts` `opencc/src/services/mcp/xaa.ts` `opencc/src/services/mcp/claudeai.ts` `opencc/src/services/mcp/officialRegistry.ts` | `04_domains.md` `05_semantics_and_continuation.md` | 保留接口 |
| MCP elicitation / recovery | domains + semantics | `src/domains/mcp/` `src/semantics/approval/` `src/semantics/results/` | elicitation queue、URL mode completion、reconnect / backoff / session expired continuation | `opencc/src/services/mcp/elicitationHandler.ts` `opencc/src/services/mcp/client.ts` `opencc/src/services/mcp/useManageMCPConnections.ts` | `04_domains.md` `05_semantics_and_continuation.md` | 保留接口 |
| approval / permission | semantics | `src/semantics/approval/` | permission context、多路审批竞态、resolveOnce/claim、mode 切换、audit | `opencc/src/hooks/toolPermission/handlers/interactiveHandler.ts` `opencc/src/state/AppStateStore.ts` `opencc/src/screens/REPL.tsx` | `05_semantics_and_continuation.md` | 必落 |
| approval arbitration / classifier / audit | semantics | `src/semantics/approval/` `src/semantics/events/` | resolveOnce/claim、多路审批、rules loader、mode 切换、classifier path、speculative classifier、audit logging | `opencc/src/hooks/toolPermission/handlers/interactiveHandler.ts` `opencc/src/state/AppStateStore.ts` `opencc/src/screens/REPL.tsx` | `05_semantics_and_continuation.md` | 必落 |
| waiting queues | semantics | `src/semantics/approval/` `src/core/state/` | tool permission、sandbox permission、worker sandbox、prompt queue、elicitation queue | `opencc/src/state/AppStateStore.ts` `opencc/src/screens/REPL.tsx` `opencc/src/services/mcp/elicitationHandler.ts` | `05_semantics_and_continuation.md` | 必落 |
| memory recall / session memory 接口 | semantics | `src/semantics/memory/` | memory taxonomy、relevant memory recall、session memory、compaction 接口 | `opencc/src/memdir/findRelevantMemories.ts` `opencc/src/services/SessionMemory/sessionMemory.ts` `opencc/src/services/compact/compact.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| memory scan / memory command / user attachment ingest | semantics | `src/semantics/memory/` `src/semantics/artifacts/` | memory command、session memory extraction、binary/blob storage、user attachment ingest 的边界 | `opencc/src/memdir/findRelevantMemories.ts` `opencc/src/services/SessionMemory/sessionMemory.ts` `opencc/src/utils/attachments.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| artifacts / binary output | semantics | `src/semantics/artifacts/` | binary/blob artifact、output file、transcript symlink、artifact store 语义 | `opencc/src/utils/task/diskOutput.js` `opencc/src/tasks/LocalAgentTask/LocalAgentTask.tsx` `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx` | `05_semantics_and_continuation.md` | 保留接口 |
| user attachment ingest | semantics + assembly | `src/assembly/context/` `src/semantics/artifacts/` | user attachment、binary/blob、媒体输入进入上下文与 artifact storage 的边界 | `opencc/src/context.ts` `opencc/src/utils/messages.ts` `opencc/src/services/api/claude.ts` | `02_core_and_assembly.md` `05_semantics_and_continuation.md` | 保留接口 |
| results / continuation result / handoff | semantics | `src/semantics/results/` | terminal result、continuation reason、output handoff、queued result consumption、next-turn result surface | `opencc/src/query.ts` `opencc/src/utils/sessionRestore.ts` `opencc/src/tasks/LocalAgentTask/LocalAgentTask.tsx` `opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx` | `05_semantics_and_continuation.md` | 必落 |
| typed events / notifications | semantics | `src/semantics/events/` | tool progress、task notification、SDK events、MCP events、subagent events、result projection | `opencc/src/ink/events/event.ts` `opencc/src/services/tools/toolExecution.ts` `opencc/src/utils/sdkEventQueue.ts` `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx` | `05_semantics_and_continuation.md` | 必落 |
| typed event subtype projection | semantics | `src/semantics/events/` | approval event、MCP event、subagent event、bridge/remote projection、compact boundary、result projection | `opencc/src/utils/sdkEventQueue.ts` `opencc/src/remote/sdkMessageAdapter.ts` `opencc/src/ink/events/event.ts` | `05_semantics_and_continuation.md` | 必落 |
| bridge / remote event adapter | semantics + bridge | `src/semantics/events/` | core event 到 bus event / remote SDK event 的投影与适配 | `opencc/src/remote/sdkMessageAdapter.ts` `opencc/src/utils/sdkEventQueue.ts` `opencc/src/ink/events/event.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| compact boundary / result projection event | semantics | `src/semantics/events/` `src/semantics/results/` | compact boundary event、result projection event、observability 投影 | `opencc/src/utils/sdkEventQueue.ts` `opencc/src/remote/sdkMessageAdapter.ts` `opencc/src/query.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| hooks / stop gate | semantics | `src/semantics/hooks/` | hook registration、skill/frontmatter hooks、async hook registry、stop gate、hook attachment | `opencc/src/utils/hooks/registerSkillHooks.ts` `opencc/src/utils/hooks/registerFrontmatterHooks.ts` `opencc/src/utils/hooks/AsyncHookRegistry.ts` `opencc/src/query/stopHooks.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| hook subtype registration / response attachment | semantics | `src/semantics/hooks/` `src/semantics/results/` `src/assembly/context/` | skill hook、frontmatter hook、async hook registry、hook response attachment | `opencc/src/utils/hooks/registerSkillHooks.ts` `opencc/src/utils/hooks/registerFrontmatterHooks.ts` `opencc/src/utils/hooks/AsyncHookRegistry.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| background agent completion 回流 | domains + semantics | `src/domains/subagent/` `src/semantics/results/` `src/semantics/events/` | LocalAgentTask transcript symlink、pending messages drain、completion notification 回流 | `opencc/src/tasks/LocalAgentTask/LocalAgentTask.tsx` `opencc/src/utils/sessionStorage.js` `opencc/src/query.ts` | `04_domains.md` `05_semantics_and_continuation.md` | 保留接口 |
| remote reconnect / continuation | semantics + bridge | `src/semantics/results/` `src/semantics/events/` | remote reconnect、retry budget、capacity wake、session-not-found continuation | `opencc/src/remote/SessionsWebSocket.ts` `opencc/src/remote/RemoteSessionManager.ts` `opencc/src/bridge/capacityWake.ts` `opencc/src/bridge/bridgeMain.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| remote reconnect control detail | semantics + bridge | `src/semantics/results/` `src/semantics/events/` | force reconnect、retry budget、delay / attempt control、shutdown / abort 打断等待 | `opencc/src/remote/SessionsWebSocket.ts` `opencc/src/remote/RemoteSessionManager.ts` `opencc/src/bridge/capacityWake.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| capacity wait / wake | semantics + bridge | `src/semantics/results/` `src/semantics/events/` | at-capacity wait、wake signal、poll loop 恢复、outer abort 打断 | `opencc/src/bridge/capacityWake.ts` `opencc/src/bridge/bridgeMain.ts` `opencc/src/bridge/replBridge.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| host / UI queue focus and consumption cleanup | semantics + bridge | `src/semantics/results/` `src/semantics/events/` | focus dialog 选择、consumed queued commands 清理、host-side queue projection | `opencc/src/screens/REPL.tsx` `opencc/src/state/AppStateStore.ts` `opencc/src/query.ts` | `05_semantics_and_continuation.md` | 保留接口 |
| host boundary / 非 core 宿主壳层 | semantics + bridge | `src/semantics/events/` `src/semantics/results/` | REPL/UI/AppState/host boundary，明确哪些不应进入 engine-core | `opencc/src/main.tsx` `opencc/src/screens/REPL.tsx` `opencc/src/state/AppStateStore.ts` | `00_overview.md` `05_semantics_and_continuation.md` | 保留接口 |
| host boundary exclusions | semantics + bridge | `src/semantics/events/` `src/semantics/results/` | `bridge/*`、`server/*`、`AppStateStore`、`REPLTool`、`processUserInput` 的交互层边界排除 | `opencc/src/main.tsx` `opencc/src/screens/REPL.tsx` `opencc/src/state/AppStateStore.ts` `opencc/src/utils/processUserInput/*` | `00_overview.md` `05_semantics_and_continuation.md` | 保留接口 |

## 3. 高风险能力

根据 pre-design 防漏清单，以下能力必须在文档中显式出现：

- `src/execution/workbench/patch/`
- `src/semantics/events/`
- `src/semantics/results/` 下的 continuation / output handoff
- `src/assembly/context/` 下的 attachment 装配
- `src/semantics/approval/` 下的多路 waiting state

这些能力在 OpenCC 中已有明确语义，Ark Code 不能只在实现时顺带处理，必须先在架构文档中定名、定位、定边界。

## 4. 最终对齐结论

当前 `06_inventory_mapping.md` 已经可以承接两个 inventory 的：

- 主功能组
- 主闭环阶段
- checklist 级补充细项

换句话说，现在的状态已经从：

- “主功能组覆盖”

推进到：

- “清单级条目可找到对应功能组与 OpenCC 路径”

后续如果还要继续细化，属于把现有覆盖条目继续拆得更细，而不再属于“有没有覆盖”的问题。

## 5. 参考输入

- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/01_execution_and_workbench.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/02_session_orchestration.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/03_mcp_skills_memory_approval.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/04_selection_and_assembly.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/05_runtime_waiting_and_continuation.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/99_gap_checklist.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/02_context_and_request_assembly.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/99_verification_matrix.md`
