# ports 模块设计

## 0. 模块定位

`ports/` 定义 `engine-core` 对宿主的全部外部依赖边界。

这里不写实现，只写接口。

---

## 1. 职责与要求

### 职责

- 定义模型调用接口
- 定义 permission / prompt / elicitation 接口
- 定义 session store / filesystem 接口
- 定义 event / notification 接口
- 定义 MCP runtime / host state / clock / id 接口

### 要求

- 任何外部依赖都必须先抽象到 `ports/`
- `ports/` 不能出现具体 CLI / Web / provider SDK 类型
- `ports/` 定义要稳定、窄、完整

---

## 2. 下属文件规划

```text
ports/
  model-port.ts
  permission-port.ts
  session-store-port.ts
  filesystem-port.ts
  event-sink-port.ts
  notification-port.ts
  mcp-runtime-port.ts
  host-state-port.ts
  clock-port.ts
  id-port.ts
```

### 各文件职责

- `model-port.ts`：定义模型流式调用接口；参照 `opencc/src/query/deps.ts`、`opencc/src/services/api/claude.ts`
- `permission-port.ts`：定义 canUseTool / requestPrompt / handleElicitation；参照 `opencc/src/Tool.ts`、`opencc/src/hooks/useCanUseTool.tsx`
- `session-store-port.ts`：定义 transcript / flush / resume 相关接口；参照 `opencc/src/utils/sessionStorage.ts`、`opencc/src/utils/conversationRecovery.ts`、`opencc/src/utils/sessionRestore.ts`
- `filesystem-port.ts`：定义 file state / snapshot 接口；参照 `opencc/src/utils/fileHistory.ts`、文件工具实现
- `event-sink-port.ts`：定义事件下游消费接口；参照 `opencc/src/QueryEngine.ts`
- `notification-port.ts`：定义通知入队接口；参照 `opencc/src/Tool.ts`、通知相关上下文
- `mcp-runtime-port.ts`：定义 MCP client/resource 提供接口；参照 `opencc/src/Tool.ts`、`opencc/src/services/mcp/client.ts`
- `host-state-port.ts`：定义 host state 读写接口；参照 `opencc/src/Tool.ts`、`opencc/src/QueryEngine.ts`
- `clock-port.ts`：定义时间接口；参照 OpenCC 中 `Date.now()` 使用点
- `id-port.ts`：定义 ID 生成接口；参照 `opencc/src/query/deps.ts`

---

## 3. 对 OpenCC 的对齐要求

Ark Code `ports/` 的目的，是把 OpenCC 中混在 `QueryEngine`、`ToolUseContext`、REPL、services 层的外部依赖点，正式抽成宿主能力边界。
