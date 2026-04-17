# state/attribution 模块设计

## 职责

- 定义 attribution 状态
- 支撑读写来源、内容替换、上下文裁剪后的归因语义

## 文件规划

- `attribution-state.ts`：定义 attribution state、state updater、快照结构

## OpenCC 参照

- `opencc/src/QueryEngine.ts`
- attribution 相关 state 更新点
