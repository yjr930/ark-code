# runtime/mcp 模块设计

## 0. 模块定位

`runtime/mcp/` 负责 session 内部的 MCP 使用语义。

它处理的范围只到：

- 当前 session 可见哪些 client
- 当前 session 可见哪些 resource
- 如何读取这些 resource

它不负责：

- 配置发现
- 建连
- OAuth / auth
- 项目级 server approval

这些都属于 `server-host`。

---

## 1. 职责与要求

### 职责

- 维护 session 可见 MCP client 视图
- 维护 session 可见 resource 视图
- 向 tools/query 提供 MCP 读取能力
- 支持动态刷新

### 要求

- `engine-core` 只看到已连接 client 的抽象视图
- MCP 使用必须走 `McpRuntimePort`
- session 内 client / resource 变化必须能刷新到工具平面

---

## 2. 下属文件规划

```text
mcp/
  runtime.ts
  resources.ts
  clients.ts
```

### 2.1 runtime.ts

职责：

- MCP runtime 总入口

定义内容：

- `createMcpRuntime()`
- `listMcpClients()`
- `listMcpResources()`
- `refreshMcpResources()`
- `readMcpResource()`

OpenCC 参照代码：

- `opencc/src/services/mcp/client.ts`
- `opencc/src/Tool.ts`

### 2.2 resources.ts

职责：

- 处理 MCP resource 视图和读取逻辑

定义内容：

- `buildResourceView()`
- `readResourceByUri()`
- `groupResourcesByServer()`

OpenCC 参照代码：

- `opencc/src/tools/ListMcpResourcesTool/ListMcpResourcesTool.ts`
- `opencc/src/tools/ReadMcpResourceTool/ReadMcpResourceTool.ts`

### 2.3 clients.ts

职责：

- 管理当前 session 可见 client 集合

定义内容：

- `attachMcpClients()`
- `detachMcpClient()`
- `replaceMcpClients()`
- `getVisibleClients()`

OpenCC 参照代码：

- `opencc/src/services/mcp/client.ts`
- `opencc/src/services/mcp/MCPConnectionManager.tsx`
- `opencc/src/services/mcp/useManageMCPConnections.ts`

---

## 3. 对 OpenCC 的对齐要求

Ark Code `runtime/mcp` 应对齐 OpenCC“已连接 MCP server 在 session 内如何被使用”的语义，而不把 OpenCC 完整 MCP 连接管理层整体搬进 engine-core。
