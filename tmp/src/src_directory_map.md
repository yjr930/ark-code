# OpenCC `src/` 目录功能说明

## 1. 说明范围

本文逐个说明 `opencc/src/` 顶层各目录的功能。

`opencc/src/` 顶层目录包括：

- `assistant/`
- `bootstrap/`
- `bridge/`
- `buddy/`
- `cli/`
- `commands/`
- `components/`
- `constants/`
- `context/`
- `coordinator/`
- `entrypoints/`
- `hooks/`
- `ink/`
- `keybindings/`
- `memdir/`
- `migrations/`
- `moreright/`
- `native-ts/`
- `outputStyles/`
- `plugins/`
- `query/`
- `remote/`
- `schemas/`
- `screens/`
- `server/`
- `services/`
- `skills/`
- `state/`
- `tasks/`
- `tools/`
- `types/`
- `upstreamproxy/`
- `utils/`
- `vim/`
- `voice/`

---

## 2. 各目录功能

### 2.1 纳入

#### `bootstrap/`

- 职责：启动阶段的共享运行上下文装配与持久化。
- 关键逻辑：初始化时写入并恢复 session 标识、project root、运行模式；在后续执行单元间提供统一读取入口。
- 链路位置：位于会话启动与主循环前置阶段，向 query、tasks、tools 等执行模块提供基础状态。

#### `coordinator/`

- 职责：协调模式下的多执行体协同控制。
- 关键逻辑：构建 coordinator 提示词、注入 worker 上下文、下发工具约束，保证 coordinator 与 worker 的职责边界和调用规则一致。
- 链路位置：位于 session 运行中，参与任务分派、工具权限约束和跨执行体上下文传递。

#### `memdir/`

- 职责：memory 文件体系的扫描、检索与装配。
- 关键逻辑：按路径约定发现 memory 文件，基于相关性与时效规则筛选条目，并组装 team memory prompt 输入。
- 链路位置：在 prompt 组装与上下文注入阶段生效，向 query/skills 提供可用记忆上下文。

#### `query/`

- 职责：查询主循环的执行编排辅助。
- 关键逻辑：管理 query 配置、依赖注入、stop hooks、token budget；在循环过程中控制继续/停止条件与资源预算。
- 链路位置：承接输入请求，驱动模型调用与工具调用节奏，连接前置上下文与后置结果输出。

#### `skills/`

- 职责：skill 体系的发现、加载、注册与构建。
- 关键逻辑：扫描可用 skill 源，完成 bundled skill 与 MCP skill 的装配，建立可调用清单与运行映射。
- 链路位置：在执行期为命令与工具系统提供 skill 调用入口，并参与 prompt/tool 选择过程。

#### `tasks/`

- 职责：统一任务运行时管理。
- 关键逻辑：调度本地 shell 任务、agent 任务、workflow/monitor 任务；提供任务状态追踪、输出读取、停止控制。
- 链路位置：作为异步执行骨架，承接 query/commands 发起的任务并向上游回传进度与结果。

#### `tools/`

- 职责：工具能力实现与调用分发。
- 关键逻辑：实现 Bash、Read、Edit、Glob、Grep、Agent、Skill、Task 等工具协议、参数校验与执行封装。
- 链路位置：位于模型决策后的动作执行层，向外部系统和本地环境提供统一操作接口。

### 2.2 拆分纳入

#### `commands/`

- 目录职责：定义 slash command、本地命令与子命令行为。
- 执行侧保留：命令语义解析、命令到执行动作的映射、调用控制与参数传递逻辑。
- 执行侧不纳入：仅用于终端展示、交互引导的界面型命令实现。

#### `constants/`

- 目录职责：集中维护品牌、提示词片段、限额、消息文案、输出样式等常量。
- 执行侧保留：系统提示拼装常量、执行限制与预算常量、工具与权限相关固定配置。
- 执行侧不纳入：品牌文案、纯展示文案、输出装饰样式常量。

#### `hooks/`

- 目录职责：提供运行时 hook 机制与各类 hook 实现。
- 执行侧保留：请求控制、权限判断、命令队列与执行流程拦截点。
- 执行侧不纳入：仅服务 UI 交互状态的 hook。

#### `native-ts/`

- 目录职责：承载原生或性能敏感能力的 TypeScript 封装层。
- 执行侧保留：执行链路直接依赖的高性能调用封装与桥接逻辑。
- 执行侧不纳入：与执行主链无直接依赖的性能实验性封装。

#### `plugins/`

- 目录职责：内建插件注册、bundled 插件装载与插件能力接入。
- 执行侧保留：插件能力注入机制，含 skill/hooks/MCP 的执行扩展接线。
- 执行侧不纳入：插件管理界面与展示相关逻辑。

#### `services/`

- 目录职责：聚合 API 调用、compact、memory、MCP、LSP、analytics、通知、摘要等高层服务。
- 执行侧保留：compact、memory、mcp、lsp、tool summary 等直接影响执行链路的服务。
- 执行侧不纳入：provider 接入细节、analytics、通知等非执行核心服务。

#### `state/`

- 目录职责：定义 AppState、store、selector 与状态变化辅助逻辑。
- 执行侧保留：会话运行态、任务态、权限态等执行期必需状态及其读写逻辑。
- 执行侧不纳入：纯界面渲染状态与展示衍生状态。

#### `types/`

- 目录职责：提供 command、permission、hook、id、plugin 等跨模块共享类型。
- 执行侧保留：执行链路接口契约、工具调用结构、权限与任务相关类型定义。
- 执行侧不纳入：仅用于 UI 组件或展示层的数据类型。

#### `utils/`

- 目录职责：提供 shell、cwd、env、auth、provider、permissions、git、sessionStorage、logging、config 等通用能力。
- 执行侧保留：shell/file/cwd/env/process/permissions/sessionStorage 等执行基础支撑。
- 执行侧不纳入：auth/provider/展示相关的非核心支撑模块。

### 2.3 排除

#### `assistant/`

assistant 模式目录，处理会话选择与历史读取，属于用户交互层。

#### `bridge/`

bridge mode 目录，处理远端控制、桥接消息、桥接会话建立与桥接权限回调，属于桥接协议层。

#### `buddy/`

陪伴式界面目录，提供 companion、提示文案、提醒与通知展示，属于用户交互层。

#### `cli/`

命令行交互目录，负责终端输出、结构化输出、远端 I/O 适配与传输实现，属于用户交互层。

#### `components/`

终端 React/Ink 组件目录，存放输入框、弹窗、状态条、提示框、面板等界面组件，属于用户交互层。

#### `context/`

React Context 目录，管理 overlay、modal、notification、mailbox、voice 等界面上下文，属于用户交互层。

#### `entrypoints/`

程序入口目录，提供 CLI、MCP、SDK 等运行入口与初始化接线，属于入口承载层。

#### `ink/`

终端渲染引擎目录，包含布局、渲染、事件、终端适配、组件与相关 hook，属于用户交互层。

#### `keybindings/`

快捷键目录，负责默认键位、用户键位加载、解析、匹配、校验与显示格式化，属于用户交互层。

#### `migrations/`

迁移目录，负责历史配置、设置项和模型相关字段迁移，属于非执行核心支撑。

#### `moreright/`

附加交互能力目录，承载 MoreRight 相关 hook，属于用户交互层。

#### `outputStyles/`

输出风格目录，负责加载和管理 output style 配置，属于用户交互层。

#### `remote/`

远端会话目录，处理远端 session 管理、WebSocket 通信、远端权限桥接和 SDK 消息适配，属于服务托管能力。

#### `schemas/`

schema 目录，存放结构化配置或协议的 schema 定义，属于非执行核心支撑。

#### `screens/`

页面级界面目录，存放 REPL、Doctor、ResumeConversation 等终端页面，属于用户交互层。

#### `server/`

服务端目录，处理 headless/direct connect、session manager、server 入口、回放和服务端日志，属于服务托管能力。

#### `upstreamproxy/`

上游代理目录，处理代理转发与 relay 相关逻辑，属于服务托管能力。

#### `vim/`

Vim 交互目录，处理 motions、operators、text objects、transitions 等编辑模式能力，属于用户交互层。

#### `voice/`

语音模式目录，负责 voice mode 的可用性判断与开关控制，属于用户交互层。

---
