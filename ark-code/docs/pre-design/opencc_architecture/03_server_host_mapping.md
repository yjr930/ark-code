# OpenCC 到 server-host 的映射

## 文档目标

本文件回答两个问题：

- 哪些 OpenCC 代码应留在 Ark Code 的 `server-host`
- `server-host` 和 `engine core` 的边界应如何切

这里的判断标准只看一件事：**哪些能力负责承载用户、承载 provider、承载外部系统，而不负责 session 内部执行语义**。

## 1. 划入 server-host 的边界规则

满足下面任一条件的代码，应留在 `server-host`：

1. 它负责用户入口、子命令、UI、会话托管
2. 它负责 provider / auth / transport / storage / session service
3. 它负责把外部系统接入会话，而不是定义会话内部推理循环
4. 它可以在不改变 tool/task/query 语义的前提下被替换

据此，`server-host` 应承接 OpenCC 的入口壳、交互壳、provider 接入壳、配置治理壳、session 托管壳。

## 2. 应留在 server-host 的代码块

## 2.1 CLI 与命令承载层

关键代码：

- `opencc/src/entrypoints/cli.tsx:49`
- `opencc/src/main.tsx:590`
- `opencc/src/main.tsx:942`
- `opencc/src/commands.ts:483`
- `opencc/src/commands/*`

职责：

- 进程启动
- 子命令注册
- CLI 参数解析
- slash command / command catalog 暴露
- 把不同入口归并到具体会话类型

留在 `server-host` 的原因：

- 这些代码决定用户如何进入系统
- 它们负责产品形态和操作方式
- 它们不定义一次 turn 的执行语义

## 2.2 交互式 UI 承载层

关键代码：

- `opencc/src/replLauncher.tsx:12`
- `opencc/src/components/App.tsx:19`
- `opencc/src/state/AppState.tsx:37`
- `opencc/src/interactiveHelpers.tsx:104`
- `opencc/src/components/*`
- `opencc/src/context/*`
- `opencc/src/ink/*`

职责：

- 提供 REPL / TUI 承载
- 维护 AppState
- 渲染消息、面板、通知、状态线、对话框
- 处理 trust、onboarding、invalid settings 等交互

留在 `server-host` 的原因：

- 这些是宿主呈现层
- Ark Code 后续可以继续使用 CLI、Web、桌面或其它 UI 形态
- `engine core` 需要在没有 React / Ink 的情况下运行

## 2.3 非交互 / SDK 承载层

关键代码：

- `opencc/src/cli/print.ts:456`
- `opencc/src/entrypoints/mcp.ts:35`

职责：

- structured IO
- stream-json 输出
- SDK control protocol
- MCP server entrypoint
- sandbox / auth status / stdout guard 等运行壳逻辑

留在 `server-host` 的原因：

- 这些是外部调用协议
- 它们定义调用方如何和系统对接
- 核心执行逻辑应被封装成被这些协议调用的接口

## 2.4 Provider / Model / Transport / Auth 层

关键代码：

- `opencc/src/services/api/claude.ts`
- `opencc/src/services/api/openai-adapter.ts:1`
- `opencc/src/services/api/client.ts`
- `opencc/src/services/oauth/openaiChatgpt.ts:1`
- `opencc/src/services/oauth/*`
- `opencc/src/utils/model/providers.ts:6`
- `opencc/src/utils/model/*`
- `opencc/src/utils/inferencePreferences.ts:18`

职责：

- provider 判定
- model 选择与能力差异处理
- OpenAI-compatible backend 管理
- OAuth / token refresh / secure storage
- 请求 transport 与错误重试

留在 `server-host` 的原因：

- 这些是 model port 的实现
- `engine core` 只应依赖抽象模型接口
- 未来更换 provider 实现，不应影响 tool/task/query 语义

## 2.5 MCP 配置与治理层

关键代码：

- `opencc/src/services/mcp/config.ts:62`
- `opencc/src/services/mcp/config.ts:202`
- `opencc/src/services/mcp/claudeai.ts`
- `opencc/src/services/mcp/auth.ts`
- `opencc/src/services/mcp/officialRegistry.ts`
- `opencc/src/services/mcp/xaa.ts`
- `opencc/src/services/mcp/useManageMCPConnections.ts`

职责：

- 读取 `.mcp.json`、managed mcp、plugin mcp、claude.ai connectors
- 做配置合并、去重、签名比较、治理与认证
- 管理连接生命周期与宿主态下的资源更新

留在 `server-host` 的原因：

- 这些是外部连接准备工作
- `engine core` 只需要已连好的 MCP client / tool / resource 抽象
- 配置发现、鉴权、治理属于宿主责任

## 2.6 插件、IDE、LSP 等宿主集成层

关键代码：

- `opencc/src/services/lsp/manager.ts:145`
- `opencc/src/utils/plugins/*`
- `opencc/src/commands/plugin/*`
- `opencc/src/commands/ide/*`

职责：

- 插件安装、发现、启停
- IDE 连接
- LSP server 生命周期管理
- 插件带来的命令、技能、MCP、LSP 注入

留在 `server-host` 的原因：

- 这些是宿主扩展能力
- 它们提供附加能力来源，不应定义核心执行循环

## 2.7 Session 托管与本地服务层

关键代码：

- `opencc/src/server/server.ts:76`
- `opencc/src/server/sessionManager.ts`
- `opencc/src/server/indexStore.ts`
- `opencc/src/server/connectHeadless.ts`
- `opencc/src/server/client.ts`
- `opencc/src/server/parseConnectUrl.ts`

职责：

- 本地 HTTP / WebSocket session service
- session create / attach / interrupt / stop / delete
- direct connect
- connect URL 解析
- session index 与本地服务状态

留在 `server-host` 的原因：

- 这些负责把 session 作为服务暴露出去
- 它们属于托管与接入层
- 其中与跨边界协议直接相关的部分，后续可再下沉到 `bridge`

## 3. 当前需要拆开的混合文件

## 3.1 `opencc/src/main.tsx`

这个文件同时包含：

- Commander / CLI 壳
- setup / trust / onboarding / session 类型选择
- REPL / headless 启动
- engine core 调用前的运行装配

证据：

- `opencc/src/main.tsx:590`
- `opencc/src/main.tsx:942`
- `opencc/src/main.tsx:2279`
- `opencc/src/main.tsx:2895`

拆分后 `server-host` 应保留：

- Commander 注册
- setup screens
- remote / assistant / ssh / attach / resume 的入口路由
- 对 `engine core` 的调用壳

## 3.2 `opencc/src/screens/REPL.tsx`

这个文件同时包含：

- 输入框、焦点、消息列表、overlay、通知等 UI
- turn 执行路径
- 直接调用 `query()`

证据：

- `opencc/src/screens/REPL.tsx:2516`
- `opencc/src/screens/REPL.tsx:2858`
- `opencc/src/screens/REPL.tsx:2905`

拆分后 `server-host` 应保留：

- 输入与渲染
- AppState 到 UI 的投影
- 本地快捷操作和界面交互

turn 执行本身应通过 `engine core` 接口完成。

## 3.3 `opencc/src/cli/print.ts`

这个文件同时包含：

- StructuredIO / SDK protocol
- headless session 托管
- 调用 `ask()` 进入核心 loop

证据：

- `opencc/src/cli/print.ts:456`
- `opencc/src/cli/print.ts:2155`

拆分后 `server-host` 应保留：

- 外部协议
- stream 输出
- control request / response
- sandboxes、auth status、hooks forwarding 等宿主职责

## 4. server-host 不应承接的内容

下面这些能力虽然会被 `server-host` 调用，但不应留在 `server-host` 内部实现：

- `opencc/src/QueryEngine.ts:176`
- `opencc/src/query.ts:219`
- `opencc/src/Tool.ts:158`
- `opencc/src/tools.ts:271`
- `opencc/src/Task.ts:6`
- `opencc/src/tasks.ts:22`
- `opencc/src/utils/processUserInput/processUserInput.ts:160`

原因：

- 这些定义的是 session 内部执行语义
- `server-host` 只能调用它们，不能重新实现它们
- 否则 Ark Code 很快会出现两套 turn 语义

## 5. Ark Code 中 server-host 的职责建议

结合当前 OpenCC 结构，Ark Code 的 `server-host` 应承担以下职责：

### 5.1 用户侧承载

- CLI
- Web UI
- 任何桌面或远程 UI
- 用户输入、输出、历史、会话列表、调试面板

### 5.2 provider 侧承载

- provider registry
- model / backend 配置
- auth 与 transport
- endpoint capability handling

### 5.3 会话托管与外部服务承载

- session create / attach / resume / interrupt / stop
- checkpoint / transcript / artifact / event 的外部存储
- replay / observability / evaluation

### 5.4 扩展系统承载

- MCP 配置治理与连接管理
- plugin / IDE / LSP 生命周期
- 与 `bridge`、`engine core` 的组装

## 6. 当前结论

Ark Code 的 `server-host` 应承接 OpenCC 中所有“对外承载”和“外部系统接入”的能力，核心范围可以压缩成下面这组：

```text
CLI / command shell
UI shell
headless / SDK protocol shell
provider / auth / transport
MCP config / plugin / IDE / LSP hosting
session service / persistence / external serving
```

这些能力负责把用户和外部系统带到会话入口，再把请求交给 `engine core`。