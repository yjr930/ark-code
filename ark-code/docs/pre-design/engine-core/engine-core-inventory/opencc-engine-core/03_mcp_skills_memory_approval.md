# OpenCC engine-core 盘点：MCP、Skills、Memory、Approval 与等待态

## 1. MCP 配置聚合与作用域合并

### 负责什么

- 管理 MCP server 的来源、作用域、配置格式与合并优先级
- 覆盖 `project/user/local/enterprise/claudeai/dynamic` 等作用域
- 处理 `.mcp.json`、settings、环境变量展开、policy 过滤、enabled/disabled 状态

### 关键代码路径

- `opencc/src/services/mcp/config.ts`
- `opencc/src/services/mcp/types.ts`
- `opencc/src/services/mcp/utils.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/mcp/`
- `packages/server-host/connectors/`

## 2. MCP 传输模型与连接对象抽象

### 负责什么

- 定义 transport 类型、连接状态、资源、工具、CLI state 序列化结构
- 为策略过滤、channel gating、连接生命周期提供统一类型系统

### 关键代码路径

- `opencc/src/services/mcp/types.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/mcp/`
- `packages/bridge/mcp_host_port.ts`

## 3. MCP 连接建立、工具 / 命令 / 资源装配

### 负责什么

- 建立连接
- 拉取 tools / prompts / resources / commands
- 处理 needs-auth、session expired、输出截断、二进制落盘、异常归类

### 关键代码路径

- `opencc/src/services/mcp/client.ts`
- `opencc/src/services/mcp/InProcessTransport.ts`
- `opencc/src/services/mcp/SdkControlTransport.ts`
- `opencc/src/services/mcp/useManageMCPConnections.ts`
- `opencc/src/tools/ListMcpResourcesTool/ListMcpResourcesTool.ts`
- `opencc/src/tools/ListMcpPromptsTool/*`
- `opencc/src/screens/REPL.tsx` 中 MCP tools/resources/commands merge 路径

### 对应 Ark Code 包建议

- `packages/engine-core/mcp/`
- `packages/server-host/connectors/`

## 4. MCP 重连、续租、恢复语义

### 负责什么

- 处理 reconnect、backoff、pending reconnect attempt、session expired、fresh client retry、auth cache
- 建模 continuation，而不只是简单断线重连

### 关键代码路径

- `opencc/src/services/mcp/client.ts`
- `opencc/src/services/mcp/useManageMCPConnections.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/mcp/`
- `packages/engine-core/results/`

## 5. MCP 认证：OAuth / Discovery / XAA / needs-auth

### 负责什么

- 处理 OAuth metadata discovery、callback loopback、token refresh、keychain 持久化、needs-auth 缓存
- 处理 XAA / SEP-990 Cross-App Access 与 IdP 复用

### 关键代码路径

- `opencc/src/services/mcp/auth.ts`
- `opencc/src/services/mcp/xaa.ts`
- `opencc/src/services/mcp/xaaIdpLogin.ts`
- `opencc/src/services/mcp/oauthPort.ts`
- `opencc/src/services/mcp/headersHelper.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/mcp/`
- `packages/server-host/connectors/`

## 6. Claude.ai connector、官方 registry、企业策略

### 负责什么

- 管理 MCP 供应源
- 处理 Claude.ai connector、官方 MCP registry、enterprise config、allowlist/denylist/managed-only、去重

### 关键代码路径

- `opencc/src/services/mcp/claudeai.ts`
- `opencc/src/services/mcp/officialRegistry.ts`
- `opencc/src/services/mcp/config.ts`

### 对应 Ark Code 包建议

- `packages/server-host/connectors/`
- `packages/server-host/provider/`

## 7. MCP CLI 管理面与首用审批

### 负责什么

- 提供 `claude mcp`、`mcp add`、`mcp xaa`、`/mcp` 等用户入口
- 处理 project server 首用审批

### 关键代码路径

- `opencc/src/commands/mcp/index.ts`
- `opencc/src/commands/mcp/mcp.tsx`
- `opencc/src/commands/mcp/addCommand.ts`
- `opencc/src/commands/mcp/xaaIdpCommand.ts`
- `opencc/src/services/mcpServerApproval.tsx`

### 对应 Ark Code 包建议

- `packages/server-host/runtime/`
- `apps/cli/`
- `packages/engine-core/approval/`

## 8. MCP Elicitation 与等待态

### 负责什么

- 支持 MCP server 主动向 CLI 发起补充信息/确认交互
- 支持 form / url 两种模式
- URL 模式有 waitingState，具备 dismiss/retry/cancel 语义

### 关键代码路径

- `opencc/src/services/mcp/elicitationHandler.ts`
- `opencc/src/state/AppStateStore.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/approval/`
- `packages/server-host/ui/`

## 9. Skills 注册体系：本地、bundled、MCP 三路统一

### 负责什么

- 统一管理本地 skill、bundled skill、MCP skill
- 最终统一落到 command 模型与 skill registry

### 关键代码路径

- `opencc/src/skills/loadSkillsDir.ts`
- `opencc/src/skills/bundledSkills.ts`
- `opencc/src/skills/mcpSkillBuilders.ts`
- `opencc/src/commands.ts`
- `opencc/src/commands/skills/skills.tsx`
- `opencc/src/skills/loadSkillsDir.ts` 中 legacy `/commands/` loader 路径

### 对应 Ark Code 包建议

- `packages/engine-core/skills/`
- `packages/bridge/skill_store_port.ts`

## 10. Bundled skill 文件抽取与安全写盘

### 负责什么

- 抽取 bundled skill 附带资源到 skill 目录
- 处理 owner-only 权限、防路径穿越、自动补充 skill base directory

### 关键代码路径

- `opencc/src/skills/bundledSkills.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/skills/`
- `packages/server-host/persistence/`

## 11. MCP Skills 接入点

### 负责什么

- 连接成功后拉取 MCP skills
- 把其纳入 `mcp.commands`
- 与普通 MCP prompts 区分命名与装配语义

### 关键代码路径

- `opencc/src/services/mcp/client.ts`
- `opencc/src/services/mcp/useManageMCPConnections.ts`
- `opencc/src/commands.ts`
- `opencc/src/skills/mcpSkillBuilders.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/mcp/`
- `packages/engine-core/skills/`

### 备注

当前 checkout 下未直接看到 `mcpSkills.ts` 的 provider 本体实现，但接入点和职责是清楚的。

## 12. Hook 注册：skill / frontmatter 到 session hook

### 负责什么

- 把 skill/frontmatter 里的 hook 配置注册到 session 生命周期
- 支持 once hook 自动移除
- 支持 `Stop -> SubagentStop` 语义映射

### 关键代码路径

- `opencc/src/utils/hooks/registerSkillHooks.ts`
- `opencc/src/utils/hooks/registerFrontmatterHooks.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/skills/`
- `packages/engine-core/approval/`

## 13. Hook 执行与异步回包 / 等待态

### 负责什么

- 管理异步 hook 注册表、stdout JSON 回包解析、hook progress interval、response attachment sent 标记、session env cache invalidation
- 为异步 hook 结果生成 attachment

### 关键代码路径

- `opencc/src/utils/hooks/AsyncHookRegistry.ts`
- `opencc/src/utils/hooks/execPromptHook.ts`
- `opencc/src/utils/hooks/execHttpHook.ts`
- `opencc/src/utils/hooks/execAgentHook.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/approval/`
- `packages/engine-core/events/`
- `packages/engine-core/results/`

## 14. Permission 上下文与多路审批竞态

### 负责什么

- 协调 hook、classifier、user、bridge、channel、swarm 等多路审批
- 通过 `resolveOnce/claim()` 收敛竞态
- 统一 reject/abort/feedback/contentBlocks 封装

### 关键代码路径

- `opencc/src/hooks/toolPermission/PermissionContext.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/approval/`
- `packages/engine-core/state/`

## 15. 本地交互审批、本地等待态、桥接审批、channel 审批

### 负责什么

- 管理 permission dialog queue、classifier 过程、bridge 远端审批、channel permission relay、recheckPermission 等完整交互审批运行时

### 关键代码路径

- `opencc/src/hooks/toolPermission/handlers/interactiveHandler.ts`
- `opencc/src/bridge/bridgePermissionCallbacks.ts`
- `opencc/src/services/mcp/channelPermissions.ts`
- `opencc/src/services/mcp/channelNotification.ts`
- `opencc/src/jobs/classifier.js`
- `opencc/src/services/tools/toolExecution.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/approval/`
- `packages/bridge/user_port.ts`
- `packages/server-host/ui/`

## 16. Coordinator / Swarm worker 审批分流

### 负责什么

- 区分普通本地 REPL 与 swarm 体系
- worker 把权限请求转发给 leader mailbox
- 在等待 leader 回包期间保持 pendingWorkerRequest 状态

### 关键代码路径

- `opencc/src/hooks/toolPermission/handlers/coordinatorHandler.ts`
- `opencc/src/hooks/toolPermission/handlers/swarmWorkerHandler.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/approval/`
- `packages/engine-core/subagent/`

## 17. 权限规则、持久化、模式切换

### 负责什么

- 管理 allow/deny/ask 规则解析
- 处理 legacy tool name 兼容、多 source 规则加载、managed-only、add/delete rule 持久化、lane mode、auto/dontAsk/acceptEdits/plan 等模式语义

### 关键代码路径

- `opencc/src/utils/permissions/permissions.ts`
- `opencc/src/utils/permissions/permissionSetup.ts`
- `opencc/src/utils/permissions/permissionsLoader.ts`
- `opencc/src/utils/permissions/permissionRuleParser.ts`
- `opencc/src/utils/permissions/laneMode.ts`
- `opencc/src/tools/BashTool/pathValidation.ts`
- `opencc/src/tools/BashTool/sedValidation.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/approval/`
- `packages/server-host/persistence/`

## 18. Channel 作为 MCP 扩展面的消息与审批通道

### 负责什么

- 管理 channel server 推送的 `notifications/claude/channel`
- 管理 `claude/channel/permission`
- 支持 `--channels` 会话 opt-in、source allowlist、managed settings 控制、inbound message 注入

### 关键代码路径

- `opencc/src/services/mcp/channelNotification.ts`
- `opencc/src/services/mcp/channelAllowlist.ts`
- `opencc/src/services/mcp/channelPermissions.ts`
- `opencc/src/services/mcp/useManageMCPConnections.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/mcp/`
- `packages/engine-core/approval/`
- `packages/server-host/ui/`

## 19. Bridge 远端 session 创建、兼容 ID、archive / fetch

### 负责什么

- 处理远端 session 生命周期：create/fetch/archive
- 管理 `cse_* -> session_*` compat surface 与远端元信息建档

### 关键代码路径

- `opencc/src/bridge/createSession.ts`
- `opencc/src/bridge/sessionIdCompat.ts`

### 对应 Ark Code 包建议

- `packages/bridge/`
- `packages/server-host/persistence/`

## 20. Bridge poll loop、worker 注册、capacity wait、安全等待态

### 负责什么

- 管理 poll for work、heartbeat、token refresh、CCR v2 worker 注册、multi-session/single-session/worktree 模式、at-capacity 安全等待、fatal/auth_failed/failed/shutdown 分支、session done 后 stopWork/archive/cleanup

### 关键代码路径

- `opencc/src/bridge/bridgeMain.ts`
- `opencc/src/bridge/capacityWake.ts`
- `opencc/src/bridge/pollConfig.ts`
- `opencc/src/bridge/pollConfigDefaults.ts`
- `opencc/src/bridge/sessionRunner.ts`

### 对应 Ark Code 包建议

- `packages/bridge/`
- `packages/server-host/runtime/`

## 21. Bridge 远端 continuation / 恢复语义

### 负责什么

- 管理远端 session 的 continuation：更新 access token、JWT 过期时 re-dispatch、transport 续租、session done 后决定回 idle 还是 bridge 退出

### 关键代码路径

- `opencc/src/bridge/bridgeMain.ts`
- `opencc/src/bridge/sessionRunner.ts`

### 对应 Ark Code 包建议

- `packages/bridge/`
- `packages/server-host/runtime/`

## 22. Bridge 入站消息与附件解析

### 负责什么

- 解析远端消息中的 file_attachments
- 下载 file_uuid 对应文件
- 规范化 image block
- 跳过 malformed / empty / non-user message

### 关键代码路径

- `opencc/src/bridge/inboundAttachments.ts`
- `opencc/src/bridge/inboundMessages.ts`

### 对应 Ark Code 包建议

- `packages/bridge/`
- `packages/server-host/runtime/`

## 23. AppState 作为 runtime 总状态容器

### 负责什么

- 承载 mcp.clients/tools/commands/resources、elicitation.queue、toolPermissionContext、pendingWorkerRequest、bridge 连接态、channelPermissionCallbacks、tasks/teammates 等运行态
- 说明 OpenCC 的 engine 层是强状态驱动 runtime

### 关键代码路径

- `opencc/src/state/AppStateStore.ts`
- `opencc/src/state/AppState.tsx`
- `opencc/src/state/onChangeAppState.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/state/`
- `packages/server-host/ui/`

## 24. Conversation resume / 恢复语义

### 负责什么

- `/resume` 的恢复语义：枚举 session log、过滤 sidechain/current、支持 session id/custom title、cross-project 检测、same repo worktree 直接恢复、不同目录给出 resume 命令

### 关键代码路径

- `opencc/src/commands/resume/resume.tsx`

### 对应 Ark Code 包建议

- `packages/engine-core/results/`
- `packages/server-host/runtime/`
- `apps/cli/`

## 25. Memory taxonomy 与显式 memory 命令

### 负责什么

- 定义 memory 类型：`user / feedback / project / reference`
- 规定什么不该存 memory
- 提供 memory 文件扫描与 `/memory` 入口

### 关键代码路径

- `opencc/src/memdir/memoryTypes.ts`
- `opencc/src/memdir/memoryScan.ts`
- `opencc/src/commands/memory/memory.tsx`

### 对应 Ark Code 包建议

- `packages/engine-core/memory/`
- `apps/cli/`

## 26. Session Memory 自动提炼

### 负责什么

- 依据 token/tool-call 阈值触发 forked subagent 提炼 session memory
- 与 auto-compact 协同，把当前会话长期上下文沉淀到 markdown 文件

### 关键代码路径

- `opencc/src/services/SessionMemory/sessionMemory.ts`
- `opencc/src/services/SessionMemory/sessionMemoryUtils.ts`
- `opencc/src/services/SessionMemory/prompts.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/memory/`
- `packages/engine-core/subagent/`

## 27. Attachment 框架：memory / plan / auto / hook / MCP delta

### 负责什么

- 统一 attachment 注入系统
- 包括 nested memory、current session memory、queued commands、async hook response、deferred tools delta、MCP instructions delta、plan/auto mode 提醒、teammate mailbox 等

### 关键代码路径

- `opencc/src/utils/attachments.ts`
- `opencc/src/utils/mcpInstructionsDelta.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/memory/`
- `packages/engine-core/results/`
- `packages/engine-core/events/`

## 28. Artifact / Binary blob / 大输出持久化

### 负责什么

- 管理 MCP 输出 token 预算估算、超限截断、binary content 落盘、生成 file-based 继续消费指引
- 属于 artifact runtime 与大输出治理

### 关键代码路径

- `opencc/src/utils/mcpValidation.ts`
- `opencc/src/utils/mcpOutputStorage.ts`
- `opencc/src/services/mcp/client.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/artifacts/`
- `packages/engine-core/mcp/`

## 29. Brief 附件与上传解析

### 负责什么

- 处理用户显式附件/artifact 输入
- 验证附件路径、解析图片与普通文件、bridge 模式下上传并保留 `file_uuid`

### 关键代码路径

- `opencc/src/tools/BriefTool/attachments.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/artifacts/`
- `packages/bridge/`

## 30. 权限日志与审计

### 负责什么

- 记录 approval/reject 来源、等待时长、是否永久化等审批 funnel 数据
- 为可观测性与审计提供基础

### 关键代码路径

- `opencc/src/hooks/toolPermission/permissionLogging.ts`

### 对应 Ark Code 包建议

- `packages/engine-core/approval/`
- `packages/server-host/observability/`

## 31. 本文档的关键判断

### 关键主线

OpenCC 在 MCP / skills / approval / memory 这组能力上，实际上形成了以下 6 条主线：

- MCP runtime：配置、认证、连接、恢复、工具/资源装配
- skills：本地、bundled、MCP skill 三路统一
- permission/approval：规则、hook、classifier、UI、bridge、channel、swarm 多路竞态
- bridge/continuation：远端 session、poll/heartbeat、capacity wait、安全等待态
- memory/artifact：memory taxonomy、session memory、attachment、blob 落盘
- state/resume：AppState、resume、会话恢复

### Ark Code 后续要特别注意的点

- approval 不是单一路径，而是多路竞态模型
- attachment 应作为一级 runtime 组件，而不是零散辅助逻辑
- MCP runtime 包含的不只是 tool invoke，还包括配置治理、认证治理、continuation、artifact 输出治理
