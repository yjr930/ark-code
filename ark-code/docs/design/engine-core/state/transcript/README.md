# state/transcript 模块设计

## 职责

- 定义 transcript 持久化结构
- 定义 transcript 记录事件
- 为 resume / compact / sidechain 提供统一日志模型

## 文件规划

- `transcript-store.ts`：定义 transcript entry、写入批次、flush 请求结构
- `transcript-events.ts`：定义 recordTranscript/compact-boundary/queue-operation/content-replacement 等记录事件

## OpenCC 参照

- `opencc/src/utils/sessionStorage.ts`
- `opencc/src/types/logs.ts`
- `opencc/src/QueryEngine.ts`
