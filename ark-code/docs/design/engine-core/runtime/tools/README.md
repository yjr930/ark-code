# runtime/tools 模块设计

## 0. 模块定位

`runtime/tools/` 是 `engine-core` 的统一工具平面。

它负责把 builtin tools、synthetic tools、task tools、agent tools、MCP resource tools、skill tools 统一组织成模型可调用能力集合。

---

## 1. 职责与要求

### 职责

- 注册工具
- 过滤工具可见性
- 生成工具 schema
- 查找工具
- 校验工具输入
- 执行工具调用
- 组装 `ToolUseContext`
- 刷新工具池

### 要求

- 所有工具都通过统一 registry 暴露
- 工具执行前必须走 permission 判定
- 工具执行上下文必须统一，不允许每个工具私自定义宿主访问方式
- `tools/` 本身不直接依赖宿主实现，只依赖 `ports/`

---

## 2. 下属文件规划

```text
tools/
  registry.ts
  execute-tool.ts
  validate-input.ts
  tool-context.ts
  refresh-tools.ts
  builtins/
  synthetic/
```

### 2.1 registry.ts

职责：

- 注册和暴露工具集合

定义内容：

- `getBuiltinTools()`
- `assembleToolPool()`
- `findToolByName()`
- `filterVisibleTools()`
- `getToolSchemas()`

逻辑要求：

- registry 是工具平面的唯一真源
- 要支持 builtin、MCP、skill、synthetic 工具混编

OpenCC 参照代码：

- `opencc/src/tools.ts`
- `opencc/src/Tool.ts`

### 2.2 execute-tool.ts

职责：

- 执行单个或批量工具调用

定义内容：

- `executeToolCall()`
- `runToolBatch()`
- `normalizeToolResult()`
- `emitToolProgress()`

逻辑要求：

- 执行前做 permission 检查
- 执行后输出统一 tool result 表示
- 与 query-loop 的 tool use / tool result 语义对齐

OpenCC 参照代码：

- `opencc/src/query.ts`
- `opencc/src/Tool.ts`
- `opencc/src/tools/*`

### 2.3 validate-input.ts

职责：

- 校验工具输入

定义内容：

- `validateToolInput()`
- `coerceToolInputIfNeeded()`
- `buildValidationError()`

逻辑要求：

- 校验逻辑统一收口，不分散在 query-loop 中

OpenCC 参照代码：

- `opencc/src/Tool.ts`
- 各工具目录内 schema 定义

### 2.4 tool-context.ts

职责：

- 定义和构造工具上下文

定义内容：

- `type EngineToolUseContext`
- `createToolUseContext(session, turnContext)`
- `createSubagentToolUseContext()`

逻辑要求：

- 统一提供 appState、abort、readFileState、MCP、prompt、notifications、file-history、attribution 能力

OpenCC 参照代码：

- `opencc/src/Tool.ts`
- `opencc/src/QueryEngine.ts`

### 2.5 refresh-tools.ts

职责：

- 刷新工具池与动态可见资源

定义内容：

- `refreshToolPool()`
- `refreshMcpBackedTools()`
- `refreshAgentBackedTools()`

逻辑要求：

- 用于处理 MCP mid-session 连接变化、动态技能变化等情况

OpenCC 参照代码：

- `opencc/src/tools.ts`
- `opencc/src/services/mcp/client.ts`
- `opencc/src/QueryEngine.ts`

### 2.6 builtins/

职责：

- 放 Ark Code 内建工具的适配与注册说明

定义内容：

- Bash / Read / Edit / Write / Glob / Grep / Task* / AskUser / Plan / Skill 等工具封装

OpenCC 参照代码：

- `opencc/src/tools/BashTool/*`
- `opencc/src/tools/FileReadTool/*`
- `opencc/src/tools/FileEditTool/*`
- `opencc/src/tools/FileWriteTool/*`
- `opencc/src/tools/GlobTool/*`
- `opencc/src/tools/GrepTool/*`
- `opencc/src/tools/Task*Tool/*`
- `opencc/src/tools/AskUserQuestionTool/*`
- `opencc/src/tools/EnterPlanModeTool/*`

### 2.7 synthetic/

职责：

- 放 runtime 注入的合成工具

定义内容：

- structured output tool
- output enforcement tool
- 其他仅在特定模式下存在的 synthetic tool

OpenCC 参照代码：

- `opencc/src/tools/SyntheticOutputTool/*`
- `opencc/src/QueryEngine.ts`

---

## 3. 对 OpenCC 的对齐要求

Ark Code `runtime/tools` 要对齐 OpenCC `Tool.ts + tools.ts + tools/*` 的统一调度语义，而不是只对齐某一个工具实现。

必须保留：

- 工具统一 registry
- 工具统一上下文
- 工具统一 permission 检查
- 工具执行结果统一回填语义
