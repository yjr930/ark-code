# OpenCC 到 engine core 的映射

## 文档目标

本文件回答两个问题：

- 哪些 OpenCC 代码必须进入 Ark Code 的 `engine core`
- 这些代码进入 `engine core` 的依据是什么

这里的判断标准只看一件事：**一个 session 在真实仓库内完成完整工作，离不开哪些执行语义**。

## 1. 划入 engine core 的边界规则

满足下面任一条件的代码，应进入 `engine core`：

1. 接到用户输入后，直接参与一次 turn 的执行闭环
2. 改变它会改变 session 内部语义，而不是仅改变宿主交互形式
3. 去掉它，AI 无法在仓库里继续完成“读代码、改代码、跑验证、继续推理”
4. 它应能被程序直接调用，而不依赖 Commander、Ink、HTTP server、OAuth 页面等宿主设施

据此，`engine core` 应承接 OpenCC 的会话执行主干、tool/task runtime、workbench runtime、continuation 语义。

## 2. 必须进入 engine core 的代码块

## 2.1 会话执行主循环

这是 `engine core` 的中心。

关键代码：

- `opencc/src/QueryEngine.ts:176`
  - `QueryEngine` 持有 conversation 级状态
- `opencc/src/QueryEngine.ts:209`
  - `submitMessage()` 处理单轮提交
- `opencc/src/QueryEngine.ts:1186`
  - `ask()` 是 headless 对 QueryEngine 的包装
- `opencc/src/query.ts:219`
  - `query()` 对外暴露 generator
- `opencc/src/query.ts:241`
  - `queryLoop()` 负责真实的 agentic loop
- `opencc/src/query/*`
  - token budget、deps、transition、config 等子模块

归入原因：

- 这里定义了 turn 的真实执行顺序
- 这里定义了 tool use / tool result / continuation / compact / stop 条件
- 这是 OpenCC 最核心的执行语义来源

## 2.2 输入归一化与消息组装

关键代码：

- `opencc/src/utils/processUserInput/processUserInput.ts:160`
  - 输入统一处理入口
- `opencc/src/context.ts:116`
  - `getSystemContext()`
- `opencc/src/context.ts:155`
  - `getUserContext()`
- `opencc/src/utils/queryContext.ts`
- `opencc/src/utils/messages/*`
- `opencc/src/constants/prompts.ts`

归入原因：

- 这些代码决定模型在每轮到底看到什么消息
- 包括 slash command 扩展结果、attachments、hook additional context、CLAUDE.md、memory、git status 等
- 这些属于 session 内部语义，不属于宿主壳

## 2.3 Tool runtime

关键代码：

- `opencc/src/Tool.ts:158`
  - `ToolUseContext`、权限上下文、tool schema
- `opencc/src/tools.ts:271`
  - `getTools()`
- `opencc/src/tools.ts:345`
  - `assembleToolPool()`
- `opencc/src/tools/*`
  - Agent、Bash、Read、Edit、Write、Glob、Grep、Skill、Task 系列工具
- `opencc/src/services/tools/*`
  - tool orchestration、streaming executor 等

归入原因：

- tools 是模型可调用能力的主体
- tool 的输入、输出、权限、执行、副作用边界都属于 session 内部执行语义
- 没有这一层，OpenCC 只剩聊天能力，无法完成 code agent 工作

## 2.4 Task runtime

关键代码：

- `opencc/src/Task.ts:6`
  - task 抽象、task status、task state
- `opencc/src/tasks.ts:22`
  - task 注册中心
- `opencc/src/tasks/LocalMainSessionTask.ts:94`
  - 主会话后台 task 注册
- `opencc/src/tasks/LocalMainSessionTask.ts:383`
  - 后台主会话直接复用 `query()`
- `opencc/src/tasks/*`
  - LocalShellTask、LocalAgentTask、RemoteAgentTask 等任务实现

归入原因：

- OpenCC 的 agent 不是单线程线性执行器
- background tasks、subagents、foreground/background 切换、task output，都直接改变 session 执行语义
- 这些不应留在宿主层临时拼装

## 2.5 Workbench runtime 与本地执行语义

关键代码范围：

- `opencc/src/tools/BashTool/*`
- `opencc/src/tools/FileReadTool/*`
- `opencc/src/tools/FileEditTool/*`
- `opencc/src/tools/FileWriteTool/*`
- `opencc/src/tools/GlobTool/*`
- `opencc/src/tools/GrepTool/*`
- `opencc/src/utils/cwd.js`
- `opencc/src/utils/Shell.js`
- `opencc/src/utils/permissions/*`
- `opencc/src/utils/fileHistory.js`
- `opencc/src/utils/toolResultStorage.js`

归入原因：

- 这些代码构成了 session 在真实仓库里工作的 workbench
- 包括 cwd、文件系统、shell、权限、结果裁剪、文件快照等实际执行语义
- Ark Code 的 `engine core` 如果要保留 OpenCC 的执行方式，这一层必须一起迁入

## 2.6 会话内 agent 语义

关键代码：

- `opencc/src/tools/AgentTool/AgentTool.tsx:202`
- `opencc/src/tools/AgentTool/runAgent.ts`
- `opencc/src/tools/AgentTool/loadAgentsDir.ts`
- `opencc/src/utils/forkedAgent.ts`

归入原因：

- agent / subagent / forked agent 是 session 内的执行机制
- 它定义的是如何把一项工作交给另一个执行单元继续完成
- 这属于 engine core 的 planner / runner / handoff 语义

这里需要做进一步拆分：

- **agent 语义** 进入 `engine core`
- **worktree 创建、remote launch、tmux/remote 环境提供** 应通过宿主注入 port 完成

## 2.7 会话内 MCP 运行时

必须进入 `engine core` 的范围只包括 session 使用 MCP 的那部分语义。

关键落点：

- `opencc/src/Tool.ts:165`
  - `ToolUseContext` 持有 `mcpClients`
- `opencc/src/tools/MCPTool/*`
- `opencc/src/tools/ListMcpResourcesTool/*`
- `opencc/src/services/mcp/types.ts`

归入原因：

- 一旦 MCP client 已经准备好，session 如何把它当作 tool / resource 使用，是 engine core 语义
- 这部分和工具调用、消息循环、权限决策直接耦合

不应整体搬入 `engine core` 的部分见第 4 节。

## 3. 进入 engine core 前必须拆分的混合文件

## 3.1 `opencc/src/screens/REPL.tsx`

这个文件同时包含：

- UI 渲染与交互状态
- 本轮 tools 计算
- system/user context 装配
- 直接调用 `query()` 的 turn 执行逻辑

证据：

- `opencc/src/screens/REPL.tsx:2516`
- `opencc/src/screens/REPL.tsx:2858`
- `opencc/src/screens/REPL.tsx:2905`

拆分建议：

- REPL 输入框、面板、焦点、消息展示保留在宿主
- turn 执行函数抽成 `engine core` 可直接调用接口

## 3.2 `opencc/src/cli/print.ts`

这个文件同时包含：

- structured IO / SDK 控制协议
- sandbox / stream-json / auth status 等宿主侧逻辑
- 调用 `ask()` 进入核心执行

证据：

- `opencc/src/cli/print.ts:456`
- `opencc/src/cli/print.ts:2155`

拆分建议：

- `runHeadless()` 作为 server-host 壳保留
- `ask()` / `QueryEngine` / `query` 作为 engine core 接口保留

## 3.3 `opencc/src/main.tsx`

这个文件同时承担：

- Commander 壳
- 启动前 setup / trust / onboarding
- session 类型选择
- REPL / headless 启动分支

证据：

- `opencc/src/main.tsx:590`
- `opencc/src/main.tsx:942`
- `opencc/src/main.tsx:2279`
- `opencc/src/main.tsx:2895`

拆分建议：

- Commander、startup screen、session 选择保留宿主
- 真正 turn 执行入口通过 port 调用 `engine core`

## 4. 不应直接进入 engine core 的代码

下面这些代码当前在 opencc 中和核心执行主干相邻，但按职责不应直接进入 `engine core`。

### 4.1 CLI 与命令壳

- `opencc/src/entrypoints/cli.tsx:49`
- `opencc/src/main.tsx:942`
- `opencc/src/commands.ts:483`
- `opencc/src/commands/*`

原因：

- 这些负责用户入口、命令发现、子命令装配
- 它们决定“如何进入会话”，不决定“会话如何执行”

### 4.2 Provider / transport / auth

- `opencc/src/services/api/*`
- `opencc/src/services/oauth/*`
- `opencc/src/utils/model/*`
- `opencc/src/utils/inferencePreferences.ts:18`

原因：

- 这些是 model port 的实现层
- engine core 需要依赖抽象接口，不应直接绑死在 Anthropic / OpenAI-compatible / OAuth 实现上

### 4.3 UI 与宿主状态层

- `opencc/src/components/*`
- `opencc/src/context/*`
- `opencc/src/ink/*`
- `opencc/src/state/AppState.tsx:37`

原因：

- 这些负责 TUI 呈现和宿主共享状态
- engine core 应能在没有 Ink/React 的情况下直接运行

### 4.4 MCP 配置与治理层

- `opencc/src/services/mcp/config.ts:62`
- `opencc/src/services/mcp/claudeai.ts`
- `opencc/src/services/mcp/auth.ts`
- `opencc/src/services/mcp/officialRegistry.ts`
- `opencc/src/services/mcp/xaa.ts`

原因：

- 这些负责配置来源、远端发现、认证、注册表治理
- 它们属于宿主准备阶段
- engine core 只需要“已经连好的 MCP client 抽象”

### 4.5 本地 session server / remote shell

- `opencc/src/server/*`
- `opencc/src/bridge/*`

原因：

- 这些负责 session 对外暴露与远程接入
- 它们不属于 session 内部推理循环

## 5. 推荐的 engine core 提取顺序

建议按下面顺序提取，以保证迁移时语义连续：

1. `QueryEngine.ts` + `query.ts` + `query/*`
2. `Tool.ts` + `tools.ts` + `tools/*`
3. `Task.ts` + `tasks.ts` + `tasks/*`
4. `processUserInput` + context / prompt / message 组装
5. workbench runtime 与 permission / file history / tool result storage
6. agent runtime 与 session 内 MCP runtime

这个顺序的好处是：

- 先保住核心 loop
- 再保住能执行工作的工具层
- 再补齐后台任务和上下文语义
- 最后再把宿主壳替换成 Ark Code 自己的结构

## 6. 当前结论

Ark Code 的 `engine core` 至少应承接 OpenCC 的下面这条主干：

```text
processUserInput
  -> QueryEngine / query loop
  -> Tool runtime
  -> Task runtime
  -> workbench runtime
  -> session 内 MCP / agent 语义
```

这条主干之外的 CLI、UI、provider、OAuth、session server、remote bridge，均应通过宿主层或 bridge 层接入。