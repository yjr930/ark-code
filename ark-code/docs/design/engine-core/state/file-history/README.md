# state/file-history 模块设计

## 职责

- 定义 file-history 状态与快照
- 定义 rewind 与 diff stats 结构
- 支撑 resume 后文件回滚语义

## 文件规划

- `snapshot.ts`：定义文件快照结构、快照记录函数签名
- `rewind.ts`：定义 rewind 请求/结果、restore 判定结构
- `diff-stats.ts`：定义 diff stats 结构

## OpenCC 参照

- `opencc/src/utils/fileHistory.ts`
- `opencc/src/QueryEngine.ts`
- `opencc/src/cli/print.ts`
