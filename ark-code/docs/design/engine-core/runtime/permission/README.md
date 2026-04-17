# runtime/permission 模块设计

## 0. 模块定位

`runtime/permission/` 是 `engine-core` 的审批与交互许可编排层。

它负责的不是权限配置存储，而是一次工具调用在 session 内如何被判定、补问、拒绝、继续。

---

## 1. 职责与要求

### 职责

- 判定工具是否允许执行
- 请求补充输入
- 处理 MCP elicitation
- 管理 approval state / denial tracking

### 要求

- 所有工具权限判定统一收口到这里
- interactive prompt 和 elicitation 都视为 execution flow 的一部分
- 运行时状态必须可被 query-loop、tools、agent 共享

---

## 2. 下属文件规划

```text
permission/
  can-use-tool.ts
  request-prompt.ts
  elicitation.ts
  approval-state.ts
```

### 2.1 can-use-tool.ts

职责：

- 统一工具权限判定

定义内容：

- `canUseTool()`
- `applyPermissionDecision()`
- `buildPermissionContext()`

OpenCC 参照代码：

- `opencc/src/Tool.ts`
- `opencc/src/hooks/useCanUseTool.tsx`
- `opencc/src/QueryEngine.ts`

### 2.2 request-prompt.ts

职责：

- 请求用户补充输入

定义内容：

- `requestPrompt()`
- `buildPromptRequest()`
- `normalizePromptResponse()`

OpenCC 参照代码：

- `opencc/src/Tool.ts`
- `opencc/src/screens/REPL.tsx`

### 2.3 elicitation.ts

职责：

- 处理 MCP 或工具调用中的 elicitation

定义内容：

- `handleElicitation()`
- `normalizeElicitRequest()`
- `normalizeElicitResult()`

OpenCC 参照代码：

- `opencc/src/Tool.ts`
- `opencc/src/services/mcp/client.ts`
- `opencc/src/cli/structuredIO.ts`

### 2.4 approval-state.ts

职责：

- 管理运行中的审批状态

定义内容：

- `ApprovalState`
- `DenialTrackingState`
- `updateApprovalState()`
- `replayOrphanedPermission()`

OpenCC 参照代码：

- `opencc/src/Tool.ts`
- `opencc/src/QueryEngine.ts`

---

## 3. 对 OpenCC 的对齐要求

Ark Code `runtime/permission` 要对齐 OpenCC 中“工具调用前后审批与交互”的执行语义，尤其要保留：

- canUseTool
- requestPrompt
- handleElicitation
- denial tracking
- orphaned permission replay
