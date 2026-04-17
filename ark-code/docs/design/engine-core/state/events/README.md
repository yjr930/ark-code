# state/events 模块设计

## 职责

- 定义 engine-core 对外事件模型
- 定义内部事件到外部事件的投影规则

## 文件规划

- `engine-event.ts`：定义 `EngineEvent`、进度、通知、task、result 前置事件等类型
- `event-projection.ts`：定义内部 message/progress/attachment 到 `EngineEvent` 的投影函数

## OpenCC 参照

- `opencc/src/QueryEngine.ts`
- `opencc/src/utils/sdkEventQueue.js`
- `opencc/src/utils/messages/systemInit.ts`
