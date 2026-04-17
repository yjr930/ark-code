# state 模块设计

## 0. 模块定位

`state/` 是 `engine-core` 的核心状态模型层。

这里定义的不是 UI 状态，而是 engine-core 自己的消息、事件、结果、transcript、file-history、attribution、host/app-state 投影结构。

---

## 1. 职责与要求

### 职责

- 定义 message 模型
- 定义 transcript 记录结构
- 定义 file-history / rewind 结构
- 定义 attribution 状态
- 定义 event / result 模型
- 定义 engine 内部与 host 可交换的状态结构

### 要求

- `state/` 只定义模型与纯状态变换，不依赖 runtime 执行逻辑
- `state/` 要支持 resume / rewind / compact / projection 这些核心语义
- `state/` 是 `query/`、`runtime/`、`session/` 的共同数据基础

---

## 2. 子目录职责

### 2.1 messages/

定义消息模型、消息归一化、消息到 API/tool/result 的映射基础。

OpenCC 参照：

- `opencc/src/utils/messages.ts`
- `opencc/src/types/*`
- `opencc/src/QueryEngine.ts`

### 2.2 transcript/

定义 transcript 存储结构和 transcript 事件。

OpenCC 参照：

- `opencc/src/utils/sessionStorage.ts`
- `opencc/src/types/logs.ts`

### 2.3 file-history/

定义文件快照、rewind、diff stats 结构。

OpenCC 参照：

- `opencc/src/utils/fileHistory.ts`

### 2.4 attribution/

定义 attribution 状态。

OpenCC 参照：

- `opencc/src/QueryEngine.ts`
- attribution 相关 state 更新点

### 2.5 events/

定义 `EngineEvent` 和内部事件投影。

OpenCC 参照：

- `opencc/src/QueryEngine.ts`
- `opencc/src/utils/sdkEventQueue.js`
- `opencc/src/utils/messages/systemInit.ts`

### 2.6 result/

定义 turn result、error result、success result。

OpenCC 参照：

- `opencc/src/QueryEngine.ts`

### 2.7 app-state/

定义 engine state 与 host state 的边界结构。

OpenCC 参照：

- `opencc/src/state/AppStateStore.ts`
- `opencc/src/Tool.ts`
- `opencc/src/QueryEngine.ts`

---

## 3. 继续下钻目录

`state/` 下继续按子目录各写一个文档：

- `messages/README.md`
- `transcript/README.md`
- `file-history/README.md`
- `attribution/README.md`
- `events/README.md`
- `result/README.md`
- `app-state/README.md`
