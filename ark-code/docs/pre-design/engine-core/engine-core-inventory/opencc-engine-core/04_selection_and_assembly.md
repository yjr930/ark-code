# OpenCC engine-core 盘点：选择、装配与注入机制

这份文档专门记录 OpenCC 中几类横切机制：

- 功能不是如何“存在”，而是如何“被选中”
- 能力不是如何“实现”，而是如何“被装配进 prompt / runtime surface”
- 哪些内容是静态暴露，哪些是按条件、按预算、按上下文增量注入

## 1. Agent 候选筛选与装配

### 负责什么

- 决定当前主线程可以向模型暴露哪些 agent
- 决定哪些 agent 能作为 subagent 候选
- 决定 agent 列表是直接进入 tool prompt，还是通过 attachment 注入
- 决定 agent 真正运行时能拿到哪些 tools

### 关键代码路径

- `opencc/src/tools/AgentTool/AgentTool.tsx`
- `opencc/src/tools/AgentTool/loadAgentsDir.ts`
- `opencc/src/tools/AgentTool/agentToolUtils.ts`
- `opencc/src/tools/AgentTool/prompt.ts`
- `opencc/src/utils/attachments.ts`

### 关键装配链

1. 先加载 agent definitions
2. 用 `filterAgentsByMcpRequirements(...)` 按 MCP 依赖过滤
3. 用 `filterDeniedAgents(...)` 按 permission 规则过滤
4. 用 `getPrompt(...)` 生成 tool 描述或 agent 列表文案
5. 若启用 message attachment 方案，则通过 `shouldInjectAgentListInMessages()` 与 attachment 注入 agent listing
6. 真正运行 agent 时，再用 `resolveAgentTools(...)` 计算该 agent 最终可用 tools

### 对应 Ark Code 包建议

- `packages/engine-core/subagent/`
- `packages/engine-core/approval/`
- `packages/engine-core/context/`

## 2. Tool Pool 组装与渐进暴露

### 负责什么

- 把 built-in tools 与 MCP tools 合并成实际 tool pool
- 保证 main thread、subagent、resume agent 拿到的 tool surface 一致且可控
- 处理 deferred tools delta 这种“不是一次性全部暴露”的工具增量方案

### 关键代码路径

- `opencc/src/tools.ts`
- `opencc/src/hooks/useMergedTools.ts`
- `opencc/src/tools/AgentTool/agentToolUtils.ts`
- `opencc/src/utils/toolSearch.ts`
- `opencc/src/utils/attachments.ts`

### 关键装配链

1. `assembleToolPool(...)` 合并 built-in + MCP tools
2. `resolveAgentTools(...)` 再按 agent 定义裁剪/重排 tools
3. REPL 路径通过 `useMergedTools(...)` 持续保持 surface 最新
4. 子代理和 resumed agent 重新 resolve tools，避免直接继承过期 surface
5. deferred tools 通过 `getDeferredToolsDelta(...)` 与 attachment 注入给模型，而不是一开始全量暴露

### 对应 Ark Code 包建议

- `packages/engine-core/workbench/`
- `packages/engine-core/context/`
- `packages/engine-core/events/`

## 3. Skills 的选择与预算装配

### 负责什么

- 不是只“加载 skills”，而是决定当前会话该看到哪些 skills
- 管理 unconditional / conditional skills
- 管理本地 skill 与 MCP skill 的合并
- 把候选 skill 以预算可控的方式注入模型上下文

### 关键代码路径

- `opencc/src/skills/loadSkillsDir.ts`
- `opencc/src/commands.ts`
- `opencc/src/tools/SkillTool/prompt.ts`
- `opencc/src/tools/SkillTool/SkillTool.ts`
- `opencc/src/utils/attachments.ts`

### 关键装配链

1. `loadSkillsFromSkillsDir(...)` / `loadSkillsFromCommandsDir(...)` 加载本地技能
2. `getSkillDirCommands(...)` 聚合 managed/user/project/additional/legacy `/commands/`
3. `conditionalSkills` 与 `activatedConditionalSkillNames` 控制按 `paths` frontmatter 激活
4. `getSkillToolCommands(...)` + `getMcpSkillCommands(...)` 汇总当前 skill 候选
5. `formatCommandsWithinBudget(...)` 按 context window 预算裁剪 skill listing
6. `attachments.ts` 生成 `skill_listing` attachment 注入给模型
7. 模型真正调用 SkillTool 后，skill content 通过 `prepareForkedCommandContext(...)` 组装成 forked sub-agent prompt，并交给 `runAgent(...)`

### 对应 Ark Code 包建议

- `packages/engine-core/skills/`
- `packages/engine-core/context/`
- `packages/engine-core/subagent/`

## 4. MCP 能力表面的组装链

### 负责什么

- 不只是连上 MCP server，还要把它装配成会话可见 surface
- 统一维护 `mcp.tools`、`mcp.commands`、`mcp.resources`
- 让这些 surface 进入 REPL、attachments、agent runtime、skill runtime

### 关键代码路径

- `opencc/src/services/mcp/useManageMCPConnections.ts`
- `opencc/src/services/mcp/client.ts`
- `opencc/src/screens/REPL.tsx`
- `opencc/src/main.tsx`
- `opencc/src/cli/print.ts`
- `opencc/src/tools/SkillTool/SkillTool.ts`
- `opencc/src/utils/attachments.ts`

### 关键装配链

1. MCP connection manager 建立/更新连接
2. 拉取 server 的 tools / commands / resources
3. 写入 `appState.mcp.tools` / `appState.mcp.commands` / `appState.mcp.resources`
4. REPL 用 `mergedTools` / `mergedCommands` 把它们并到主会话 surface
5. SkillTool 从 `mcp.commands` 中筛出 MCP skills
6. attachments / context delta 再把 MCP instructions、MCP skill listing、MCP resources 相关信息注入给模型

### 对应 Ark Code 包建议

- `packages/engine-core/mcp/`
- `packages/bridge/mcp_host_port.ts`
- `packages/server-host/runtime/`

## 5. System Prompt / Context / Messages 的最终拼装链

### 负责什么

- 决定最终送给 LLM 的完整请求由哪些部分组成
- 区分 system prompt、user context、system context、attachments、normalized messages
- 处理 coordinator / agent / custom / append prompt 的优先级

### 关键代码路径

- `opencc/src/constants/prompts.ts`
- `opencc/src/utils/systemPrompt.ts`
- `opencc/src/context.ts`
- `opencc/src/utils/queryContext.ts`
- `opencc/src/utils/messages.ts`
- `opencc/src/services/api/claude.ts`
- `opencc/src/query/deps.ts`
- `opencc/src/query.ts`

### 关键装配链

1. `getSystemPrompt(...)` 生成默认系统提示
2. `getUserContext()` / `getSystemContext()` 生成上下文增量
3. `buildEffectiveSystemPrompt(...)` 按 override / coordinator / agent / custom / default / append 规则拼出最终 system prompt
4. `attachments.ts` 生成 skill listing、agent listing、deferred tools、MCP instructions、memory、hook response 等 attachment
5. `normalizeMessages(...)` / `normalizeMessagesForAPI(...)` 把消息整理成最终 API 形态
6. `queryModelWithStreaming(...)` 构建并发送最终模型请求

### 对应 Ark Code 包建议

- `packages/engine-core/context/`
- `packages/engine-core/prompt/`
- `packages/engine-core/model-loop/`
- `packages/bridge/model_port.ts`

## 6. Attachment 作为统一装配层

### 负责什么

- Attachment 不是边角料，而是 OpenCC 把许多横切能力装配给模型的正式通道
- 用来注入：
  - skill listing
  - agent listing
  - deferred tools delta
  - MCP instructions delta
  - relevant memories / nested memory
  - async hook response
  - task / todo reminder
  - teammate mailbox / team context

### 关键代码路径

- `opencc/src/utils/attachments.ts`
- `opencc/src/utils/toolSearch.ts`
- `opencc/src/utils/mcpInstructionsDelta.ts`
- `opencc/src/memdir/findRelevantMemories.ts`
- `opencc/src/utils/hooks/AsyncHookRegistry.ts`

### 关键装配特点

- attachment 是否出现往往受条件控制，不是每轮都全量注入
- 会受 resume / compact / context budget / already-sent 状态影响
- 是 skills、MCP、memory、hooks、teammate 等能力进入上下文的共同装配层

### 对应 Ark Code 包建议

- `packages/engine-core/context/`
- `packages/engine-core/memory/`
- `packages/engine-core/events/`
- `packages/engine-core/results/`

## 7. 条件激活 / 条件暴露机制

### 负责什么

OpenCC 中很多能力不是静态全量暴露，而是按条件逐步开启：

- feature gate
- permission gate
- MCP requirement gate
- context-window budget gate
- compact / resume 状态 gate
- already-sent / already-activated gate

### 关键代码路径

- `opencc/src/skills/loadSkillsDir.ts`
- `opencc/src/tools/AgentTool/prompt.ts`
- `opencc/src/utils/attachments.ts`
- `opencc/src/utils/toolSearch.ts`
- `opencc/src/utils/mcpInstructionsDelta.ts`
- `opencc/src/services/compact/compact.ts`

### 典型例子

- conditional skills 只有命中 `paths` 才激活
- agent listing 可走 prompt 或 attachment 两条路径
- deferred tools delta 只有在差异存在时才注入
- skill listing 会受 token budget 限制
- compact 后某些 listing / delta 会被重新 surfaced
- resume 时会抑制或恢复部分 attachment

### 对应 Ark Code 包建议

- `packages/engine-core/context/`
- `packages/engine-core/approval/`
- `packages/engine-core/mcp/`
- `packages/engine-core/skills/`

## 8. 这份文档补足了什么

相比前几份模块文档，这份文档补的不是“又有哪些功能”，而是：

- 这些功能是如何进入模型视野的
- 这些功能是如何进入 runtime surface 的
- 选择、筛选、预算控制、条件激活和 attachment 注入如何协同工作

如果后续 Ark Code 要完整复刻 OpenCC 的 engine-core 能力，这部分横切装配机制不能漏。否则即便把模块本体都实现了，实际行为也会与 OpenCC 不一致。
