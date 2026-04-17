# state/result 模块设计

## 职责

- 定义 turn 最终结果模型
- 定义 success/error subtype 与 stop reason 关联结构

## 文件规划

- `turn-result.ts`：定义 `EngineTurnResult`、success/error result、usage、stop reason 字段

## OpenCC 参照

- `opencc/src/QueryEngine.ts`
- `opencc/src/query.ts`
