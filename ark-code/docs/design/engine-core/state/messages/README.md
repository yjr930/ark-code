# state/messages 模块设计

## 职责

- 定义 engine-core 内部消息模型
- 定义 assistant/user/system/progress/attachment/tool summary 等消息结构
- 定义消息归一化规则

## 文件规划

- `message-model.ts`：定义 `EngineMessage`、各消息变体、message content block 类型
- `message-normalization.ts`：定义 `normalizeMessage()`、消息裁剪、消息到公共输出的映射

## OpenCC 参照

- `opencc/src/QueryEngine.ts`
- `opencc/src/utils/messages.ts`
- `opencc/src/types/*`
