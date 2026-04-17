# OpenCC 运行主链路

## 文档目标

本文件只回答一件事：

- OpenCC 从进程启动到一轮 session 执行完成，主链路如何展开

这里不讨论模块归属，只描述运行顺序和代码落点。

## 1. 总览

OpenCC 当前有两条主要运行路径：

- 交互式 TUI 路径
- 非交互 / SDK 路径

两条路径共享同一套核心执行语义，差别主要在入口壳、I/O 形态和事件投影。

```text
entrypoints/cli.tsx
  -> main.tsx
     -> run() 注册 CLI
     -> 默认 action 做 setup / tools / commands / MCP / trust / plugins
        -> interactive: launchRepl() -> REPL -> query()
        -> headless: runHeadless() -> ask() -> QueryEngine.submitMessage() -> query()
```

## 2. 共同启动阶段

### 2.1 bootstrap 入口

- `opencc/src/entrypoints/cli.tsx:49`
  - 最外层 `main()`
  - 先处理快速路径：`--version`、bridge、daemon、background session、special MCP / runner 等
  - 非快速路径再进入完整 CLI

### 2.2 主入口预处理

- `opencc/src/main.tsx:590`
  - 主进程入口 `main()`
  - 在真正进入 Commander 之前，先处理 attach、`cc://` URL、deep link、assistant、ssh 等特殊启动形态
  - 这些分支的目标是把不同入口统一改写到同一套主命令路径

### 2.3 Commander 注册

- `opencc/src/main.tsx:942`
  - `run()` 创建 Commander 程序并注册默认 action 与所有子命令
- `opencc/src/commands.ts:483`
  - `getCommands(cwd)` 装配当前可用命令
  - 命令集来源包括：skills、workflow、plugin commands、builtin commands

### 2.4 默认 action 的启动装配

默认 action 是真正的运行起点。它在进入 REPL 或 headless 执行之前完成下面几类工作：

- `opencc/src/main.tsx:1930`
  - 装配当前可用 built-in tools
- `opencc/src/main.tsx:1990`
  - 并行加载 commands 和 agent definitions
- `opencc/src/setup.ts:56`
  - 统一执行 setup：cwd、hooks、worktree、tmux、session、环境准备
- `opencc/src/main.tsx:2446`
  - 解析 MCP 配置并区分 regular MCP / SDK MCP
- `opencc/src/main.tsx:2488`
  - 启动 MCP 连接预取
- `opencc/src/main.tsx:2386`
  - trust 建立后初始化 LSP manager
- `opencc/src/main.tsx:2610`
  - 初始化 versioned plugins、orphan cleanup 等宿主侧准备工作

到这里为止，系统完成了“进入一次会话运行前”的统一装配。

## 3. 交互式 TUI 路径

### 3.1 创建 UI 根与 setup screens

- `opencc/src/main.tsx:2279`
  - 创建 Ink root
- `opencc/src/interactiveHelpers.tsx:104`
  - `showSetupScreens()` 负责 trust、onboarding、invalid settings 等交互式前置屏幕

这一步之后，系统才进入真正的 REPL 会话。

### 3.2 构造初始状态并启动 REPL

- `opencc/src/main.tsx:2992`
  - 构造 `initialState: AppState`
  - 其中包含：toolPermissionContext、agentDefinitions、mcp 状态、notifications、fileHistory、promptSuggestion、teamContext 等
- `opencc/src/replLauncher.tsx:12`
  - `launchRepl()` 渲染：`<App><REPL /></App>`
- `opencc/src/components/App.tsx:19`
  - 顶层注入 AppState / Stats / FPS 等上下文

### 3.3 REPL 侧的 turn 入口

REPL 收到一次输入后，先区分输入类型，再决定是否进入模型循环。

#### 本地 bash / 本地命令路径

- `opencc/src/screens/REPL.tsx:3543`
  - 直接调用 `processUserInput()`
  - 如果这次输入被解释为 bash、本地 slash command 或其它本地动作，就在本地完成，不进入 `query()`

#### 普通 prompt 路径

- `opencc/src/screens/REPL.tsx:2516`
  - `computeTools()` 从最新 AppState 计算本轮工具池
  - 工具池会合并 built-in tools 与已连上的 MCP tools
- `opencc/src/screens/REPL.tsx:2858`
  - 为本轮构建 `toolUseContext`
- `opencc/src/screens/REPL.tsx:2880`
  - 加载 system prompt、user context、system context
- `opencc/src/screens/REPL.tsx:2893`
  - 生成最终 `systemPrompt`
- `opencc/src/screens/REPL.tsx:2905`
  - 调用 `query()`，进入真正的模型循环

### 3.4 query() 内部循环

- `opencc/src/query.ts:219`
  - `query()` 是对外暴露的 generator
- `opencc/src/query.ts:241`
  - `queryLoop()` 负责真正的多轮执行

这一层会完成：

- 裁剪与投影消息历史
- auto compact / microcompact / snip / context collapse
- 发起模型请求
- 处理 tool use 与 tool result
- 处理 stop hook、budget、continuation
- 产生 assistant / user / system / progress 事件

REPL 侧通过 `onQueryEvent` 消费这些事件，并把状态投到 UI。

## 4. 非交互 / SDK 路径

### 4.1 main.tsx 进入 headless 分支

- `opencc/src/main.tsx:2895`
  - 调用 `runHeadless(...)`

此时 UI 不再参与，输入输出改为 structured I/O 或普通文本流。

### 4.2 runHeadless 准备运行环境

- `opencc/src/cli/print.ts:456`
  - `runHeadless()` 是 headless 主入口
  - 它负责：
    - 初始化 StructuredIO
    - 应用 headless settings 变更
    - sandbox 初始化
    - 载入初始 messages / resume 状态
    - 连接 print-mode MCP
    - 维护输出流与 control protocol

### 4.3 ask() 作为 headless turn 执行壳

- `opencc/src/cli/print.ts:2155`
  - 在命令队列 drain 过程中调用 `ask()`
- `opencc/src/QueryEngine.ts:1186`
  - `ask()` 是对 `QueryEngine` 的 headless 包装
- `opencc/src/QueryEngine.ts:1249`
  - `ask()` 内部创建 `new QueryEngine(...)`
- `opencc/src/QueryEngine.ts:1288`
  - 调用 `engine.submitMessage(...)`

### 4.4 QueryEngine 处理单轮消息

- `opencc/src/QueryEngine.ts:209`
  - `submitMessage()` 是 headless / SDK 单轮提交入口
- `opencc/src/QueryEngine.ts:416`
  - 先调用 `processUserInput()`，把输入归一化成消息、附件、命令结果和 allowedTools
- `opencc/src/QueryEngine.ts:540`
  - 先发一条 system init message 给 SDK / structured consumer
- `opencc/src/QueryEngine.ts:675`
  - 再进入 `query()`

因此 headless 路径的执行链是：

```text
runHeadless()
  -> ask()
     -> QueryEngine.submitMessage()
        -> processUserInput()
        -> build system init message
        -> query()
```

### 4.5 输出回写

headless 路径中的 `query()` 事件不会投到 Ink UI，而是投到：

- structured IO 输出流
- SDK 控制协议
- bridge 转发通道
- transcript / session storage

对应代码主要在：

- `opencc/src/cli/print.ts:2146`
- `opencc/src/cli/print.ts:2218`
- `opencc/src/QueryEngine.ts:687`

## 5. 贯穿两条路径的公共执行部件

### 5.1 Tools

- `opencc/src/tools.ts:271`
  - `getTools(permissionContext)` 计算 built-in tools
- `opencc/src/tools.ts:345`
  - `assembleToolPool(...)` 负责 built-in + MCP tools 合并
- `opencc/src/Tool.ts:158`
  - `ToolUseContext` 定义工具执行时可访问的运行时上下文

### 5.2 Tasks

- `opencc/src/Task.ts:6`
  - task 抽象定义
- `opencc/src/tasks.ts:22`
  - task 注册中心
- `opencc/src/tasks/LocalMainSessionTask.ts:94`
  - 主会话后台 task 注册
- `opencc/src/tasks/LocalMainSessionTask.ts:383`
  - 主会话后台 task 直接复用 `query()` 路径

### 5.3 输入处理

- `opencc/src/utils/processUserInput/processUserInput.ts:160`
  - prompt / bash / slash command / hook / attachment 的统一输入归一化入口

### 5.4 Provider API 调用

- `opencc/src/services/api/claude.ts`
  - query loop 最终通过这层发起模型请求

### 5.5 MCP 配置与接入

- `opencc/src/services/mcp/config.ts:62`
  - 负责 MCP 配置文件和配置合并规则
- `opencc/src/main.tsx:2446`
  - session 启动阶段解析 MCP 配置
- `opencc/src/main.tsx:2795`
  - headless 路径等待 MCP 接入完成

## 6. 对 Ark Code 的直接约束

从运行链路看，Ark Code 后续拆分时至少要保留下面这条稳定关系：

```text
宿主入口
  -> 会话装配
  -> 输入归一化
  -> query loop
  -> tool / task 执行
  -> 事件投影
```

其中：

- 入口壳可以换
- I/O 形态可以换
- provider transport 可以换
- query loop、tool/task 语义、输入归一化语义需要保持与 OpenCC 一致

后续拆 `engine core` 时，实际要保住的是这条执行主链，而不是某个单独文件。