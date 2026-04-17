# types 模块设计

## 0. 模块定位

`types/` 负责统一管理 `engine-core` 的公共类型与内部类型。

---

## 1. 职责与要求

### 职责

- 定义公共稳定类型
- 定义内部实现类型
- 避免类型散落在各运行时目录

### 要求

- 对外暴露类型放 `public.ts`
- 仅供内部使用的组合类型放 `internal.ts`
- 不把具体宿主实现类型放进 `types/`

---

## 2. 下属文件规划

```text
types/
  public.ts
  internal.ts
```

### 2.1 public.ts

职责：

- 定义外部可见的稳定类型

定义内容：

- `EngineSession`
- `EngineSessionState`
- `EngineSessionSnapshot`
- `EngineEvent`
- `EngineTurnResult`
- `EngineTask`
- `AgentDefinition`
- 各类 API request / response DTO

OpenCC 参照代码：

- `opencc/src/QueryEngine.ts`
- `opencc/src/Task.ts`
- `opencc/src/tools/AgentTool/loadAgentsDir.ts`
- `opencc/src/types/*`

### 2.2 internal.ts

职责：

- 定义内部组合类型

定义内容：

- turn context
- query internal state
- tool execution state
- task registry state
- runtime aggregate state

OpenCC 参照代码：

- `opencc/src/query.ts`
- `opencc/src/Tool.ts`
- `opencc/src/Task.ts`
- `opencc/src/state/AppStateStore.ts`

---

## 3. 对 OpenCC 的对齐要求

Ark Code `types/` 不要求照搬 OpenCC 的类型文件分布，但要求把 OpenCC 中真正构成稳定边界的类型抽出来，把内部执行类型和公共边界类型明确分层。
