# docs/runtime-loop-inventory

基于运行时闭环方法的 OpenCC engine-core 盘点文档集合。

## 目标

- 不再按目录模块做静态盘点，而是按运行时闭环重构 OpenCC engine-core 能力图谱
- 记录每类能力如何进入系统、如何被筛选、如何被装配、如何执行、如何等待、如何 continuation、如何回流
- 为 Ark Code 后续完整实现与验证提供更可靠的防漏底稿

## 子目录

- `opencc-runtime-loop/`：基于 OpenCC 的运行时闭环盘点

## 当前文档

- `opencc-runtime-loop/00_method.md`：运行时闭环盘点法说明
- `opencc-runtime-loop/01_entry_and_activation.md`：入口、发现、筛选、激活
- `opencc-runtime-loop/02_context_and_request_assembly.md`：上下文、prompt、attachments、最终请求装配
- `opencc-runtime-loop/03_execution_and_tool_round.md`：模型循环、tool round、workbench 执行
- `opencc-runtime-loop/04_waiting_background_continuation.md`：等待态、后台任务、continuation、恢复、回流
- `opencc-runtime-loop/99_verification_matrix.md`：闭环核对矩阵

## 使用方式

建议按执行时间顺序阅读：

1. `00_method.md`
2. `01_entry_and_activation.md`
3. `02_context_and_request_assembly.md`
4. `03_execution_and_tool_round.md`
5. `04_waiting_background_continuation.md`
6. `99_verification_matrix.md`
