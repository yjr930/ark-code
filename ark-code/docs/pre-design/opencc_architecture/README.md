# OpenCC 主体架构

## 目录职责

本目录用于沉淀 OpenCC 源码的主体架构事实，作为 Ark Code 后续拆分 `engine core`、`server-host`、`bridge` 的输入。

当前文件提供第一层总览，回答两个问题：

- OpenCC 的主体执行框架是什么
- 每个主体块落在哪些代码

## 当前文件

- `README.md`
  - 目录总览与主体框架摘要
- `01_runtime_flow.md`
  - 从启动到一轮 query 完成的主链路
- `02_engine_core_mapping.md`
  - OpenCC 到 `engine core` 的代码映射
- `03_server_host_mapping.md`
  - OpenCC 到 `server-host` 的代码映射

## 主体框架总览

OpenCC 的主体仍然是 Claude Code 风格的会话执行框架。它的主干可以压缩成下面这条链路：

```text
entrypoints/cli.tsx
  -> main.tsx
     -> setup.ts
     -> commands.ts / commands/*
     -> QueryEngine.ts
        -> query.ts
        -> context.ts
        -> Tool.ts / tools.ts / tools/*
        -> Task.ts / tasks.ts / tasks/*
        -> state/AppState.tsx / components/* / context/* / ink/*
     -> services/api/* / utils/model/* / services/oauth/*
     -> services/mcp/*
     -> bridge/* / server/*
```

其中：

- `CLI` 负责启动、参数解析、命令分流
- `QueryEngine + query` 负责单个 session 的模型循环
- `Tool + Task` 负责能力执行与后台任务管理
- `AppState + Ink + components` 负责交互式终端状态与 UI
- `Provider / OAuth / MCP / Bridge / Server` 负责推理接入、远程接入与外部扩展

## 分层与代码映射

### 1. 启动与入口层

职责：

- 进程启动
- 快速路径分流
- 交互模式与非交互模式切换
- 特殊入口分派

关键代码：

- `opencc/src/entrypoints/cli.tsx`
  - 最外层 bootstrap 入口
  - 处理 `--version`、bridge、daemon、bg session、特殊 MCP/runner 模式
- `opencc/src/main.tsx`
  - 主入口
  - 处理 attach、`cc://`、deep link、assistant、ssh 等启动形式
  - 负责 Commander 注册与默认 action
- `opencc/src/setup.ts`
  - 会话启动前统一初始化
  - 包括 cwd、hooks、worktree、tmux、session、环境准备
- `opencc/src/entrypoints/mcp.ts`
  - 以 MCP server 形式暴露工具的入口

### 2. CLI 命令层

职责：

- 管理 CLI 子命令
- 管理 slash command
- 管理技能、插件、辅助命令的装配

关键代码：

- `opencc/src/commands.ts`
  - 命令注册中心
- `opencc/src/commands/*`
  - 具体命令实现
  - 代表性目录与文件：
    - `opencc/src/commands/provider/`
    - `opencc/src/commands/model/`
    - `opencc/src/commands/mcp/`
    - `opencc/src/commands/review.ts`
    - `opencc/src/commands/commit.ts`
    - `opencc/src/commands/statusline.tsx`
    - `opencc/src/commands/init.ts`
    - `opencc/src/commands/version.ts`

### 3. 会话执行引擎层

职责：

- 管理一个 session 的完整生命周期
- 拼装 system prompt / user context
- 驱动模型调用
- 执行 tool use
- 处理 continuation、compact、token budget、stop hooks
- 维护 session 内状态

关键代码：

- `opencc/src/QueryEngine.ts`
  - 单个 conversation 的外层 orchestrator
  - 管理消息、usage、权限、memory、工具上下文
- `opencc/src/query.ts`
  - 底层 query loop
  - 管理 streaming、tool result 回填、自动继续、compact、停止条件
- `opencc/src/context.ts`
  - 组装 system context 和 user context
  - 包括 git status、CLAUDE.md、memory、日期等
- `opencc/src/services/api/claude.ts`
  - 连接执行引擎和底层模型 API

### 4. Tool / Task 执行层

职责：

- 定义模型可调用能力
- 校验工具输入输出
- 做权限控制
- 管理异步任务、后台任务、子 agent 任务

关键代码：

#### Tool 核心

- `opencc/src/Tool.ts`
  - 工具抽象、schema、权限上下文、ToolUseContext
- `opencc/src/tools.ts`
  - 工具注册中心
  - 装配 `Agent`、`Bash`、`Read`、`Edit`、`Write`、`Glob`、`Grep`、`Skill`、`Task*` 等能力

#### 代表性工具

- `opencc/src/tools/AgentTool/`
- `opencc/src/tools/BashTool/`
- `opencc/src/tools/FileReadTool/`
- `opencc/src/tools/FileEditTool/`
- `opencc/src/tools/FileWriteTool/`
- `opencc/src/tools/GlobTool/`
- `opencc/src/tools/GrepTool/`
- `opencc/src/tools/MCPTool/`
- `opencc/src/tools/SkillTool/`
- `opencc/src/tools/TaskCreateTool/`
- `opencc/src/tools/TaskUpdateTool/`
- `opencc/src/tools/TaskListTool/`

#### Task 核心

- `opencc/src/Task.ts`
  - task type、status、task state、task id 生成
- `opencc/src/tasks.ts`
  - 任务注册中心
- `opencc/src/tasks/LocalMainSessionTask.ts`
  - 主会话 task 管理
- 其他任务实现：
  - `opencc/src/tasks/LocalShellTask/`
  - `opencc/src/tasks/LocalAgentTask/`
  - `opencc/src/tasks/RemoteAgentTask/`
  - `opencc/src/tasks/MonitorMcpTask/`

### 5. 交互状态与 UI 层

职责：

- 维护 REPL / TUI 的共享状态
- 渲染交互界面
- 提供消息、通知、覆盖层、统计等上下文

关键代码：

- `opencc/src/state/AppState.tsx`
  - AppState Provider
- `opencc/src/state/AppStateStore.ts`
  - AppState 数据结构与默认状态
- `opencc/src/components/App.tsx`
  - 交互式 session 顶层包裹组件
- `opencc/src/components/*`
  - 交互式终端主要组件
- `opencc/src/context/*`
  - mailbox、notifications、stats、fps、voice 等上下文
- `opencc/src/ink/*`
  - Ink 渲染运行时封装

### 6. 推理接入与扩展层

这一层是 OpenCC 相比原始 Claude Code 需要重点标注的扩展块。

#### 6.1 Provider / Backend / Model 抽象

职责：

- 统一推理 provider 判定
- 管理 OpenAI-compatible backend
- 管理模型默认值、别名和能力差异

关键代码：

- `opencc/src/utils/model/providers.ts`
- `opencc/src/utils/model/*`
- `opencc/src/utils/inferencePreferences.ts`

#### 6.2 API 适配层

职责：

- 把执行引擎发出的请求送到实际模型后端
- 在 Anthropic 和 OpenAI-compatible 协议之间做适配

关键代码：

- `opencc/src/services/api/claude.ts`
- `opencc/src/services/api/openai-adapter.ts`
- `opencc/src/services/api/client.ts`
- `opencc/src/services/api/errors.ts`
- `opencc/src/services/api/withRetry.ts`

#### 6.3 OAuth 与认证扩展

职责：

- 管理 Anthropic 之外的认证链路
- 支持 ChatGPT / Codex OAuth

关键代码：

- `opencc/src/services/oauth/openaiChatgpt.ts`
- `opencc/src/services/oauth/openaiChatgptModels.ts`
- `opencc/src/services/oauth/client.ts`
- `opencc/src/services/oauth/auth-code-listener.ts`

#### 6.4 MCP 集成层

职责：

- 管理 MCP 配置、连接、授权和资源
- 把 MCP 暴露到 tool system 和 command system

关键代码：

- `opencc/src/services/mcp/MCPConnectionManager.tsx`
- `opencc/src/services/mcp/useManageMCPConnections.ts`
- `opencc/src/services/mcp/config.ts`
- `opencc/src/services/mcp/client.ts`
- `opencc/src/services/mcp/auth.ts`
- `opencc/src/services/mcp/types.ts`
- `opencc/src/entrypoints/mcp.ts`
- `opencc/src/tools/MCPTool/`

#### 6.5 Bridge / Remote / Session Server

职责：

- 管理远程控制
- 管理本地 session server
- 管理 attach / resume / open / remote-control 的接入路径

关键代码：

- `opencc/src/bridge/*`
  - 尤其是 `opencc/src/bridge/bridgeMain.ts`
- `opencc/src/server/*`
  - 尤其是 `opencc/src/server/server.ts`
  - 以及 `sessionManager.ts`、`indexStore.ts`、`connectHeadless.ts`、`client.ts`

## 对 Ark Code 的直接约束

基于当前源码结构，后续 Ark Code 拆分时应先遵守下面这组边界。

### 应优先归入 engine core 的部分

这些部分构成了 OpenCC 在单个 session 内完成完整工作的执行闭环：

- `opencc/src/QueryEngine.ts`
- `opencc/src/query.ts`
- `opencc/src/context.ts`
- `opencc/src/Tool.ts`
- `opencc/src/tools.ts`
- `opencc/src/tools/*`
- `opencc/src/Task.ts`
- `opencc/src/tasks.ts`
- `opencc/src/tasks/*`
- 与 workbench、permission、continuation、memory、tool orchestration 直接相关的运行时

### 应优先归入 server-host 的部分

这些部分主要负责对外承载、provider 接入、认证和会话服务：

- `opencc/src/entrypoints/cli.tsx`
- `opencc/src/main.tsx` 中偏 CLI 壳、command 注册、对外接入的部分
- `opencc/src/commands/*`
- `opencc/src/services/api/*`
- `opencc/src/services/oauth/*`
- `opencc/src/utils/model/*`
- `opencc/src/utils/inferencePreferences.ts`
- `opencc/src/server/*`

### 应抽出到 bridge 的部分

这些部分承接 engine core 和 server-host 之间的跨边界协议，而不是承担 session 内部推理循环：

- `opencc/src/bridge/*`
- `opencc/src/server/*` 中与连接、attach、session 投影直接相关的协议面
- 后续 Ark Code 中的 model port / user port / host port / event projection / checkpoint mapping

## 当前结论

OpenCC 的主体不是单个大文件，而是一个稳定的执行主干：

- 入口与命令壳
- session 执行引擎
- tool / task 运行时
- 交互状态与 UI
- provider / oauth / mcp / remote 扩展块

后续在本目录继续拆分文档时，应围绕这条主干展开，而不是按零散功能点切分。