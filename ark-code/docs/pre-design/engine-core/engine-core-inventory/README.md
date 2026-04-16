# docs/engine-core-inventory

OpenCC `engine-core` 能力盘点文档集合。

## 目标

- 按 Ark Code 的 `engine-core` 边界，系统盘点 OpenCC 现有能力
- 形成后续 `engine-core` 全量开发的防漏清单
- 为后续实现、迁移和验证提供模块视角的索引

## 子目录

- `opencc-engine-core/`：基于 OpenCC 代码的功能盘点

## 当前文档

- `opencc-engine-core/00_overview.md`：总览与边界说明
- `opencc-engine-core/01_execution_and_workbench.md`：执行闭环、tool orchestration、workbench、task、process
- `opencc-engine-core/02_session_orchestration.md`：session / planner / context / prompt / model-loop / recovery
- `opencc-engine-core/03_mcp_skills_memory_approval.md`：MCP / skills / memory / approval / continuation
- `opencc-engine-core/04_selection_and_assembly.md`：agent/tool/skill/MCP 的筛选、装配与注入机制
- `opencc-engine-core/05_runtime_waiting_and_continuation.md`：后台任务、等待态、continuation 与输出接力
- `opencc-engine-core/99_gap_checklist.md`：最终防漏清单

## 使用方式

建议阅读顺序：

1. `00_overview.md`
2. `01_execution_and_workbench.md`
3. `02_session_orchestration.md`
4. `03_mcp_skills_memory_approval.md`
5. `04_selection_and_assembly.md`
6. `05_runtime_waiting_and_continuation.md`
7. `99_gap_checklist.md`

## 约定

- 这里只做功能盘点与代码映射，不展开细节实现
- 代码路径只写到文件级，必要时列 1-3 个代表文件
- 文档统一使用中文
