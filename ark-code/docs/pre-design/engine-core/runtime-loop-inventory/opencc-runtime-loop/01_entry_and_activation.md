# OpenCC 运行时闭环：入口、发现、筛选、激活

本篇回答四个问题：

1. 用户输入、命令、skill、agent、MCP 能力从哪里进入系统
2. 它们如何被发现
3. 它们如何被筛选
4. 最终哪些能力会进入当前会话的候选集合

## 1. 用户输入是第一入口

### 入口位置

- `opencc/src/utils/processUserInput/processUserInput.ts`
- `opencc/src/utils/processUserInput/processSlashCommand.tsx`
- `opencc/src/screens/REPL.tsx`

### 入口职责

用户输入进入系统后，并不会直接发给模型，而是先分流：

- 普通 prompt
- slash command
- bridge/remote 来源输入
- meta prompt（系统生成但模型可见）
- 带附件/图片/IDE selection 的输入

### 关键激活逻辑

`processUserInput(...)` 里会先：

1. 清洗 transport 噪音
2. 区分 prompt mode 与 command mode
3. 决定是否跳过 slash command 解析
4. 调用 `processUserInputBase(...)`
5. 若需要 query，再继续跑 user prompt submit hooks

所以“进入系统”的第一步，其实已经开始做：

- 输入分类
- 是否命令化
- 是否继续进入模型主循环

## 2. command 不是静态常量，而是多来源发现后的候选集合

### 关键代码路径

- `opencc/src/commands.ts`
- `opencc/src/skills/loadSkillsDir.ts`

### 来源

`getCommands(cwd)` 最终会合并：

- built-in commands
- skill directory commands
- plugin skills
- bundled skills
- builtin plugin skills
- plugin commands
- workflow commands
- dynamic skills

### 发现与聚合链

1. `loadAllCommands(cwd)` 并行加载多个来源
2. `getSkills(cwd)` 聚合 skill 相关来源
3. `getCommands(cwd)` 再按 availability / enabled 过滤
4. dynamic skills 插入到最终 command 列表中

### 筛选机制

- `meetsAvailabilityRequirement(cmd)`：按 auth/provider 条件过滤
- `isCommandEnabled(cmd)`：按 feature / runtime 状态过滤
- dynamic skills 还会做去重与插入位置控制

这说明 command 的候选集合是 **动态构建** 的，而不是静态列表。

## 3. skill 的发现与激活是分阶段的

### 关键代码路径

- `opencc/src/skills/loadSkillsDir.ts`
- `opencc/src/commands.ts`

### 发现来源

`getSkillDirCommands(cwd)` 会扫描：

- managed skills
- user skills
- project skills
- additional dirs (`--add-dir`)
- legacy `/commands/`

### 筛选与激活链

1. 按 settings source / bare mode / plugin-only policy 决定哪些目录参与扫描
2. 合并所有 skill 候选
3. 按文件 identity 去重
4. 把 skills 分成：
   - unconditional skills
   - conditional skills（带 `paths` frontmatter）
5. conditional skills 先进入 `conditionalSkills` 池，等匹配文件被触达时再激活
6. activated skills 进入动态技能集合，并清 command memoization cache

### 运行时意义

这说明 skill 不是“启动时全量加载后就不变”——它有：

- 静态发现
- 条件激活
- 动态注入

## 4. Agent 候选也会被动态筛选

### 关键代码路径

- `opencc/src/tools/AgentTool/AgentTool.tsx`
- `opencc/src/tools/AgentTool/loadAgentsDir.ts`
- `opencc/src/tools/AgentTool/prompt.ts`

### 筛选链

AgentTool 在生成 prompt 时会先：

1. 从当前 tool surface 中提取已连接且有工具的 MCP servers
2. `filterAgentsByMcpRequirements(...)`：按 agent 所需 MCP 能力过滤
3. `filterDeniedAgents(...)`：按 permission rule 过滤
4. `getPrompt(...)`：为剩余 agent 生成模型可见说明

### 运行时选择链

实际调用 AgentTool 时，还会：

1. 根据 `subagent_type` / fork feature gate 决定走 explicit subagent 还是 fork 路径
2. 再次校验 deny rule
3. 校验 required MCP servers 是否已真正有 tools
4. 最终才选定 `selectedAgent`

这说明 agent 也不是“注册了就一定能用”，而是一个 **按 MCP + permission + runtime state 实时裁剪** 的候选集。

## 5. MCP 能力不是单独存在，而是被装配成三类 surface

### 关键代码路径

- `opencc/src/services/mcp/useManageMCPConnections.ts`
- `opencc/src/services/mcp/client.ts`
- `opencc/src/screens/REPL.tsx`

### 发现与写入链

`useManageMCPConnections(...)` 会：

1. 建立 / 更新 MCP 连接
2. 拉取 tools / commands / resources
3. 批量写入 `appState.mcp`：
   - `mcp.tools`
   - `mcp.commands`
   - `mcp.resources`

### 激活意义

这意味着 MCP 能力进入系统后，不是一个整体，而是分成三类候选面：

- 工具候选面
- 命令/skill 候选面
- 资源候选面

这些 surface 之后还会继续参与：

- merged tools
- merged commands
- skill listing
- agent MCP requirements
- attachment 注入

## 6. 被发现不等于被暴露：候选集合之后还有二次筛选

在入口/激活阶段，一个能力至少可能经历下面几层筛选：

### commands / skills

- availability
- isEnabled
- source policy
- plugin-only restriction
- bare mode
- conditional path activation

### agents
n
- allowedAgentTypes
- MCP requirements
- permission deny rules
- required MCP servers 是否真正有 tools
- fork feature gate / coordinator mode

### MCP

- config source
- transport state
- auth state
- connected / pending / failed / disabled
- tools/commands/resources 是否真正可用

所以“发现”只是第一步；真正重要的是：

> **当前这一轮、当前这个会话、当前这个权限模式下，到底哪些候选还活着。**

## 7. 本阶段的关键结论

按运行时闭环看，OpenCC 的“入口、发现、筛选、激活”不是单点逻辑，而是几条并行链：

- 用户输入分流链
- command/skill 聚合链
- agent 筛选链
- MCP surface 更新链
- conditional activation 链

这些链的共同特点是：

- 先发现，再筛选
- 不是一次性固定，而是会随着会话状态变化重新计算
- 结果不是直接发给模型，而是先形成“当前轮的候选集合”

这正是后续 `context / prompt / attachment / request assembly` 的输入前提。
