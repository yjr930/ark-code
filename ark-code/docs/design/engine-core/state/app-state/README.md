# state/app-state 模块设计

## 职责

- 定义 engine 内部状态与 host 可交换状态的边界
- 承载 `HostStatePort` 可读写的结构

## 文件规划

- `host-state.ts`：定义 `EngineHostState` 及其 host-facing 结构
- `engine-state.ts`：定义 engine 内部聚合状态结构

## OpenCC 参照

- `opencc/src/state/AppStateStore.ts`
- `opencc/src/Tool.ts`
- `opencc/src/QueryEngine.ts`
