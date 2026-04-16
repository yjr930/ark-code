# docs/design/engine-core

Ark Code `engine-core` 正式架构文档集。

## 职责

- 定义 `engine-core` 的主体架构、层级边界、依赖方向与运行时主链
- 说明 OpenCC 盘点能力在 Ark Code `engine-core` 中的归位方式
- 区分完整目标蓝图与当前阶段范围

## 阅读顺序

1. `00_overview.md`
2. `01_layers_and_dependencies.md`
3. `02_core_and_assembly.md`
4. `03_execution_and_workbench.md`
5. `04_domains.md`
6. `05_semantics_and_continuation.md`
7. `06_inventory_mapping.md`
8. `07_current_phase_implementation_plan.md`
9. `08_current_phase_progress_tracking.md`
10. `09_opencc_alignment_issues.md`
11. `10_inventory_coverage_audit.md`
12. `11_inventory_checklist_mapping.md`
13. `99_current_phase_scope_and_checklist.md`

## 文档分工

- `00_overview.md`：`engine-core` 在 Ark Code 总体架构中的位置与边界
- `01_layers_and_dependencies.md`：五层结构、依赖方向、横切机制
- `02_core_and_assembly.md`：`core` 与 `assembly` 两层设计
- `03_execution_and_workbench.md`：`execution` 与 `workbench` 设计
- `04_domains.md`：`subagent`、`skills`、`mcp` 三个能力域
- `05_semantics_and_continuation.md`：`approval`、`memory`、`results`、`events`、`hooks` 与 continuation
- `06_inventory_mapping.md`：pre-design 功能归位矩阵
- `07_current_phase_implementation_plan.md`：当前阶段代码实现计划
- `08_current_phase_progress_tracking.md`：当前阶段进度追踪
- `09_opencc_alignment_issues.md`：OpenCC 对齐疑问与无法直接对齐项
- `10_inventory_coverage_audit.md`：inventory 覆盖核对与缺项结论
- `11_inventory_checklist_mapping.md`：inventory 清单级逐条映射
- `99_current_phase_scope_and_checklist.md`：当前阶段范围与核对清单

## 对应关系

- 总体边界来自：`ark-code/docs/pre-design/overall_design_base.md`
- 功能输入来自：
  - `ark-code/docs/pre-design/engine-core/engine-core-inventory/`
  - `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/`

## 当前约定

- 文档只讨论 `engine-core` 内部职责，不展开 `server-host` 与 `bridge` 的宿主实现
- 目录命名、层级命名、运行时语义以现有 pre-design 盘点结论为准
- 当前阶段未展开的能力，也要在目标结构中写清楚位置、接口边界与后续承接点
