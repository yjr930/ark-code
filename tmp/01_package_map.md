# engine-core 包地图

## 1. `core/` 骨架层

- `api/`：对外程序化调用面
- `session/`：transcript、resume、continuation、recovery
- `state/`：运行中状态与状态迁移

## 2. `assembly/` 推理装配层

- `context/`：动态上下文与 attachments
- `prompt/`：system prompt 与 request compile
- `model-loop/`：流式响应解释与动作提取

## 3. `execution/` 执行编排层

- `runner/`：query loop、tool round、scheduler、recovery
- `planner/`：coordinator、delegation、verification policy
- `workbench/shell/`
- `workbench/files/`
- `workbench/patch/`
- `workbench/search/`
- `workbench/process/`
- `workbench/snapshot/`

## 4. `domains/` 高级能力域层

- `subagent/`：fork、resume、handoff、mailbox、task bridge
- `skills/`：skill discovery、activation、listing、runtime
- `mcp/`：config、auth、session、discovery、invoke、resources、prompts、roots、channels、elicitation、recovery

## 5. `semantics/` 横切共享语义层

- `approval/`：permission、classifier、waiting queues、remote approval
- `hooks/`：hook registration/runtime/async/stop gate
- `memory/`：working/session/nested memory 与 retrieval
- `artifacts/`：binary/blob/output file、large result
- `results/`：task notification、output handoff、resumable surface
- `events/`：typed domain events

## 6. 说明

- 这份地图表达的是目标层级，不是简单的物理平铺目录
- 当前仓库仍保留平铺实现目录，同时新增 `core/assembly/execution/domains/semantics` 作为目标结构表达
- 后续实现应严格按这 5 层约束依赖方向
