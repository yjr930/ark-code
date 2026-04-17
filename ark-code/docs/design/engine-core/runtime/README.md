# runtime 模块设计

## 0. 模块定位

`runtime/` 是 `engine-core` 的能力执行层。

它不负责决定“这一轮要不要继续”，那属于 `query/`；它负责提供“query 可以调度哪些能力，以及这些能力如何执行”。

它下分 7 个子模块：

- `tools/`
- `tasks/`
- `agents/`
- `mcp/`
- `skills/`
- `hooks/`
- `permission/`

---

## 1. 职责与要求

### 职责

- 提供统一工具能力面
- 提供后台任务模型
- 提供 agent 运行时
- 提供 session 内 MCP 使用语义
- 提供 skill 发现与执行语义
- 提供 hook 执行语义
- 提供 approval / permission 语义

### 要求

- `runtime/` 不依赖 `server-host` 具体实现
- 所有外部依赖必须走 `ports/`
- `runtime/` 内不同子模块必须通过统一 state 模型协作
- `runtime/` 只提供能力执行，不越权掌握 session 主循环

---

## 2. 子目录职责

### 2.1 tools/

负责统一工具注册、可见性、输入校验、调用执行、tool context 组装。

OpenCC 主要参照：

- `opencc/src/Tool.ts`
- `opencc/src/tools.ts`
- `opencc/src/tools/*`

### 2.2 tasks/

负责后台任务类型、状态模型、启动、停止、输出读取。

OpenCC 主要参照：

- `opencc/src/Task.ts`
- `opencc/src/tasks.ts`
- `opencc/src/tasks/*`
- `opencc/src/tasks/stopTask.ts`

### 2.3 agents/

负责 agent 定义、spawn、resume、send-message、subagent 上下文。

OpenCC 主要参照：

- `opencc/src/tools/AgentTool/*`
- `opencc/src/utils/forkedAgent.ts`

### 2.4 mcp/

负责 session 内 MCP client / resource 的可见视图和读取语义。

OpenCC 主要参照：

- `opencc/src/services/mcp/client.ts`
- `opencc/src/tools/ListMcpResourcesTool/*`
- `opencc/src/tools/ReadMcpResourceTool/*`

### 2.5 skills/

负责 skill 发现、装配、执行入口。

OpenCC 主要参照：

- `opencc/src/tools/SkillTool/*`
- `opencc/src/skills/*`

### 2.6 hooks/

负责会话级 hooks 的注册与触发。

OpenCC 主要参照：

- `opencc/src/hooks/*`
- `opencc/src/query.ts`
- `opencc/src/Tool.ts`

### 2.7 permission/

负责 can-use-tool、request-prompt、elicitation、approval state。

OpenCC 主要参照：

- `opencc/src/Tool.ts`
- `opencc/src/hooks/useCanUseTool.tsx`
- `opencc/src/screens/REPL.tsx`
- `opencc/src/services/mcp/client.ts`

---

## 3. 模块协作关系

```text
query/
  -> runtime/tools
     -> runtime/permission
     -> runtime/tasks
     -> runtime/agents
     -> runtime/mcp
     -> runtime/skills
     -> runtime/hooks
```

说明：

- `query/` 通过 `tools/` 使用统一能力面
- `tools/` 再按调用对象下沉到其他 runtime 子模块
- `permission/` 是横切模块，被 tools、mcp、agent 等共同使用

---

## 4. 当前结论

`runtime/` 不是一个大杂烩目录，而是 engine-core 的统一能力执行层。

其子目录文档必须继续展开，明确每个运行时子系统的职责、文件规划和 OpenCC 映射。
