# OpenCC engine-core 盘点总览

## 1. 盘点目的

本文档集合用于按 Ark Code 的 `engine-core` 边界，系统梳理 OpenCC 中已经存在的全部核心执行能力，作为后续 `engine-core` 全量开发与验证的防漏清单。

本轮盘点关注的是：

- session 内完成完整工作的能力
- 与执行闭环强相关的状态、上下文、模型循环、工具运行时
- 与工具闭环协同的 task / process / subagent / MCP / approval / recovery 能力

不在本轮核心范围内的，是纯宿主/UI/桥接侧能力，例如：

- `bridge/*`
- `server/*`
- React / Ink 投影状态
- 交互式 REPL 输入壳层

## 2. 当前结论

### 2.1 OpenCC 的 engine-core 主干

当前最接近 Ark Code `engine-core` 主干的执行链路是：

```text
query
  -> tool orchestration
  -> tool / workbench / task runtimes
  -> state / progress / result / continuation
```

其中：

- `query.ts` 与 `QueryEngine.ts` 是最接近可程序化核心入口的位置
- `Tool.ts` 与 `services/tools/*` 构成工具协议与执行编排中心
- `BashTool`、文件工具、搜索工具、任务系统构成 workbench 主体

### 2.2 当前最容易漏项的能力

有两个模块特别容易在 Ark Code 重构时漏掉：

1. `patch` 能力
   - 当前并不是独立 runtime
   - 主要散在 `FileEditTool` 和 `BashTool` 的 sed 编辑能力里
2. `events` 能力
   - 当前分散在 query 消息流、task notification、Ink 事件、SDK event、telemetry 中
   - 后续在 Ark Code 中应显式一等公民化

## 3. 文档组织方式

本目录按模块视角拆成几组文档：

- 执行闭环与 workbench
- session / orchestration / context / prompt / model-loop
- MCP / skills / memory / approval / recovery
- 选择、装配与注入机制
- 后台任务、等待态、continuation 与输出接力
- 最终防漏清单

每个功能条目统一包含：

- 功能模块名
- 负责什么
- 关键代码路径
- 与 Ark Code `engine-core` 的对应包建议

## 4. 当前边界判断

### 明确应优先纳入 `engine-core` 的

- `query.ts`
- `QueryEngine.ts`
- `Tool.ts`
- `services/tools/*`
- `tools/BashTool/*`
- `tools/FileReadTool/*`
- `tools/FileEditTool/*`
- `tools/GrepTool/*`
- `tools/GlobTool/*`
- `Task.ts`
- `tasks/LocalShellTask/*`
- `tasks/LocalAgentTask/*`
- `tools/AgentTool/*`
- `bootstrap/state.ts`
- `context.ts`
- `services/mcp/*`

### 明确不应直接纳入 `engine-core` 的

- `bridge/*`
- `server/*`
- `remote/*`
- `state/AppState.tsx`
- `state/AppStateStore.ts`
- `context/*.tsx`
- `utils/processUserInput/*`
- `tools/REPLTool/*`

## 5. 当前进度

- `01_execution_and_workbench.md`：执行闭环与 workbench 盘点
- `02_session_orchestration.md`：会话状态、编排与恢复盘点
- `03_mcp_skills_memory_approval.md`：MCP、Skills、Memory、Approval 与等待态盘点
- `04_selection_and_assembly.md`：选择、装配与注入机制盘点
- `05_runtime_waiting_and_continuation.md`：后台任务、等待态、continuation 与输出接力盘点
- `99_gap_checklist.md`：Ark Code engine-core 防漏清单
