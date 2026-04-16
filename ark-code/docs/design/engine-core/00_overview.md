# engine-core 总览

## 1. 定位

Ark Code 由三部分组成：

- `packages/engine-core/`：session 内完成完整工作的执行核心
- `packages/server-host/`：用户交互、provider 交互、托管与持久化
- `packages/bridge/`：`engine-core` 与 `server-host` 之间的协议层

`engine-core` 承接的是会话内部的完整工作闭环，范围与 `ark-code/docs/pre-design/overall_design_base.md` 一致。

## 2. engine-core 负责的能力

`engine-core` 负责以下运行时主链：

- session / run state machine
- context assembly / prompt compilation / request assembly
- model-loop semantics
- runner / tool orchestration
- workbench runtime
  - shell
  - files
  - patch
  - search
  - process
- approval / waiting / continuation / recovery semantics
- memory / artifacts / results / events / hooks semantics
- subagent / skills / MCP 的会话内执行语义

这些能力共同构成一个 session 在仓库内完成工作的执行闭环。

## 3. engine-core 不负责的能力

以下能力留在 `server-host` 或 `bridge`：

- CLI / Web UI / HTTP / SSE / WS 承载
- provider registry / auth / transport
- 宿主侧存储、回放、观测、评测
- bridge 的协议映射、状态序列化、事件投影
- 交互壳层、UI 投影层、远端宿主编排层

文档中如出现这些能力，只用于说明边界与接口。

## 4. 设计目标

`engine-core` 架构设计要满足四个目标：

1. **层级清晰**
   - 能力按骨架、装配、执行、能力域、横切语义组织
   - 避免把 state、prompt、runner、workbench、waiting、results 混在同一目录

2. **运行时闭环完整**
   - 每类能力都要说明如何进入系统、如何装配、如何执行、如何等待、如何 continuation、如何回流

3. **与 OpenCC 语义对齐**
   - 盘点文档已经给出 OpenCC 的功能边界和执行主链
   - Ark Code 在目录结构上可以重构，在执行语义上应保持一致

4. **兼容当前阶段与完整蓝图**
   - 当前阶段先把主链能力设计完整
   - 未展开的能力要写清目标位置和接口边界，避免后续再拆一次结构

## 5. 主运行链

`engine-core` 的主运行链定义为：

```text
session/state
  -> context/prompt/model-loop
  -> runner/tool orchestration
  -> workbench runtime
  -> waiting/continuation/result handoff
  -> results/events
```

这条主链表达的是运行时责任，不等于代码目录的平铺顺序。

## 6. 文档集组织方式

本目录按五层结构和横切主链组织：

- `01_layers_and_dependencies.md`：定义层级与依赖
- `02_core_and_assembly.md`：定义骨架与装配
- `03_execution_and_workbench.md`：定义执行与 workbench
- `04_domains.md`：定义 `subagent`、`skills`、`mcp`
- `05_semantics_and_continuation.md`：定义 waiting、continuation、results、events 等横切语义
- `06_inventory_mapping.md`：把盘点能力逐项归位
- `99_current_phase_scope_and_checklist.md`：收束当前阶段范围

## 7. 参考输入

本目录设计直接建立在以下输入之上：

- 总边界：`ark-code/docs/pre-design/overall_design_base.md`
- 模块盘点：`ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/`
- 运行时闭环盘点：`ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/`
