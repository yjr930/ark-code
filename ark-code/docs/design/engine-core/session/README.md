# session 模块设计

## 0. 模块定位

`session/` 是 `engine-core` 的会话编排层。

它负责把一个 session 作为完整运行单元持有起来，并把一次输入驱动成完整 turn。

这一层是内部 orchestrator，不是对外 API 层。

---

## 1. 职责与要求

### 职责

- 创建 session 实例
- 恢复 session 实例
- 维护 session 级 mutable state
- 驱动一次 turn 的整体执行
- 管理 fork / snapshot / restore
- 暴露内部状态读取能力

### 要求

- session 是 `engine-core` 内部唯一状态根
- query、runtime、state 子系统都通过 session 聚合
- session 负责调用其他模块，不允许其他模块反向主导 session 生命周期
- 所有 turn 级执行都必须以 session 为起点

---

## 2. 下属文件规划

```text
session/
  engine.ts
  engine-factory.ts
  session-state.ts
  snapshot.ts
  restore.ts
  fork.ts
```

### 2.1 engine.ts

职责：

- 定义 `EngineSession` 的核心实现
- 管理 `submitInput()` / `abortTurn()` / `getState()` 等行为

定义内容：

- `class EngineSessionImpl` 或等价 session 对象
- `submitInput()`
- `abortTurn()`
- `destroy()`
- `getState()`
- `getMutableMessages()`
- `getTaskRegistry()`
- `getMcpView()`

逻辑要求：

- 调用 `context/context-assembly.ts` 生成本轮上下文
- 调用 `query/run-turn.ts` 或 `query/query-loop.ts` 推动 turn
- 在 turn 前后维护 transcript、file-history、budget、notifications 的 session 级状态

OpenCC 参照代码：

- `opencc/src/QueryEngine.ts`

### 2.2 engine-factory.ts

职责：

- 统一创建 session 实例
- 统一组装 ports、runtime、初始 state

定义内容：

- `createEngineSession(config)`
- `resumeEngineSession(config, restoredState)`
- session 构造时的依赖装配函数

逻辑要求：

- 把外部 config 转为内部 session 依赖图
- 保证 runtime registry、state 容器、port adapters 一次装好

OpenCC 参照代码：

- `opencc/src/QueryEngine.ts`
- `opencc/src/main.tsx`
- `opencc/src/screens/REPL.tsx`

### 2.3 session-state.ts

职责：

- 定义 session 级内部状态模型

定义内容：

- `EngineSessionState`
- `MutableMessageStore`
- `SessionBudgetState`
- `SessionRuntimeState`
- `SessionMcpState`
- `SessionTaskState`
- `SessionRecoveryState`

逻辑要求：

- 这里定义的是 engine-core 自己的状态，不是宿主 UI state
- 可以保留映射到 `HostStatePort` 的字段，但不能被 host state 反向绑死

OpenCC 参照代码：

- `opencc/src/QueryEngine.ts`
- `opencc/src/state/AppStateStore.ts`
- `opencc/src/Tool.ts`

### 2.4 snapshot.ts

职责：

- 导出可持久化 session 快照

定义内容：

- `snapshotSession(session)`
- `serializeSessionState()`
- `makeSessionSnapshot()`

逻辑要求：

- 快照必须覆盖 resume 所需最小完整语义
- 至少包含 messages、task 状态、file-history、attribution、MCP 可见信息、budget 相关状态

OpenCC 参照代码：

- `opencc/src/utils/sessionStorage.ts`
- `opencc/src/utils/sessionRestore.ts`
- `opencc/src/utils/conversationRecovery.ts`

### 2.5 restore.ts

职责：

- 基于快照恢复 session

定义内容：

- `restoreSessionFromSnapshot()`
- `processRestoredConversation()`
- `rebuildSessionState()`

逻辑要求：

- 恢复后必须能继续 submitInput，而不是只读展示
- 恢复必须包含 transcript、file-history、compact、agent sidechain 等状态语义

OpenCC 参照代码：

- `opencc/src/utils/sessionRestore.ts`
- `opencc/src/utils/conversationRecovery.ts`

### 2.6 fork.ts

职责：

- 创建 session 分支

定义内容：

- `forkSession(session, options)`
- `cloneMutableSessionState()`
- `buildForkedRuntimeView()`

逻辑要求：

- fork 必须明确哪些状态共享、哪些状态复制
- fork 后的 tool / task / agent 执行不能污染主 session 的关键状态

OpenCC 参照代码：

- `opencc/src/utils/forkedAgent.ts`
- `opencc/src/QueryEngine.ts`

---

## 3. 方法/类组织建议

`session/` 推荐以一个核心 session 实体为中心：

- `EngineSessionImpl`：持有状态、依赖、控制方法
- 周边用函数处理 snapshot / restore / fork

原因：

- session 是天然的聚合根
- turn 提交与状态持有需要绑定
- snapshot / restore / fork 是围绕 session 的衍生动作

---

## 4. 对 OpenCC 的对齐要求

Ark Code 的 `session/` 需要承接 OpenCC `QueryEngine` 原本承担的会话外层职责，但要把恢复、快照、fork 等能力从单文件中拆出来。

因此约束是：

- 保留 OpenCC 的 session 驱动语义
- 拆分文件，但不拆断执行主链
- session 仍然是唯一会话入口和状态聚合根
