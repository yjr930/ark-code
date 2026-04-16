# Ark Code engine-core 交接文档

## 1. 当前结论

当前工作已形成大量盘点、设计、README 与目录调整，但存在两个问题：

- 文档和结构表达投入过多，真实代码实现不足
- 多处输出语言不符合外层 `CLAUDE.md` 要求

后续工作应立即切换到：

- 清理残余结构
- 继续真实代码实现
- 文档只保留必要总纲与代码目录 README

## 2. 必须遵守的约束

### 2.1 语言约束

外层 `CLAUDE.md` 已明确要求：

- 只写事实、问题、逻辑、结论
- 语言简洁
- 不写过程性表述
- 不写版本感表述
- 不写相对性叙述
- 文档面向未参与对话的阅读者

### 2.2 项目约束

- 当前主要开发目标在 `ark-code/`
- 非用户明确要求时，不要读写 `ark-code/` 之外路径
- `opencc/` 与 `opencode/` 只读参考
- 所有输出继续放在 `ark-code/`
- 开发阶段家目录继续使用 `ark-code/.arkcode-dev/home`

### 2.3 设计约束

- 项目是融合重构，不是重新发明语义
- 执行流程和 prompt 逻辑尽量保持 OpenCC / OpenCode 原语义
- 位置可变，执行逻辑不可随意变化

## 3. 已产生的关键文档

### 3.1 盘点文档

#### 模块视角盘点

- `ark-code/docs/engine-core-inventory/opencc-engine-core/00_overview.md`
- `ark-code/docs/engine-core-inventory/opencc-engine-core/01_execution_and_workbench.md`
- `ark-code/docs/engine-core-inventory/opencc-engine-core/02_session_orchestration.md`
- `ark-code/docs/engine-core-inventory/opencc-engine-core/03_mcp_skills_memory_approval.md`
- `ark-code/docs/engine-core-inventory/opencc-engine-core/04_selection_and_assembly.md`
- `ark-code/docs/engine-core-inventory/opencc-engine-core/05_runtime_waiting_and_continuation.md`
- `ark-code/docs/engine-core-inventory/opencc-engine-core/99_gap_checklist.md`

#### runtime loop 视角盘点

- `ark-code/docs/runtime-loop-inventory/opencc-runtime-loop/00_method.md`
- `ark-code/docs/runtime-loop-inventory/opencc-runtime-loop/01_entry_and_activation.md`
- `ark-code/docs/runtime-loop-inventory/opencc-runtime-loop/02_context_and_request_assembly.md`
- `ark-code/docs/runtime-loop-inventory/opencc-runtime-loop/03_execution_and_tool_round.md`
- `ark-code/docs/runtime-loop-inventory/opencc-runtime-loop/04_waiting_background_continuation.md`
- `ark-code/docs/runtime-loop-inventory/opencc-runtime-loop/99_verification_matrix.md`

### 3.2 设计文档

- `ark-code/docs/design/current_architecture.md`
- `ark-code/docs/design/engine_core_detailed_architecture.md`
- `ark-code/docs/design/engine-core-blueprint/README.md`
- `ark-code/docs/design/engine-core-blueprint/00_overview.md`
- `ark-code/docs/design/engine-core-blueprint/01_package_map.md`

## 4. 当前代码结构状态

### 4.1 `packages/engine-core/src` 当前树

当前已清理掉平铺空目录，保留如下目录：

- `assembly/`
- `core/`
- `domains/`
- `execution/`
- `mcp/`
- `semantics/`
- `workbench/`
- `index.ts`
- `README.md`

### 4.2 当前已有真实代码

#### core

- `packages/engine-core/src/core/api/engine.ts`
- `packages/engine-core/src/core/api/types.ts`
- `packages/engine-core/src/core/state/session_state.ts`
- `packages/engine-core/src/core/state/run_state.ts`
- `packages/engine-core/src/core/state/turn_state.ts`

#### assembly

- `packages/engine-core/src/assembly/context/assembler.ts`
- `packages/engine-core/src/assembly/prompt/compiler.ts`
- `packages/engine-core/src/assembly/model-loop/chunk_reducer.ts`
- `packages/engine-core/src/assembly/model-loop/model_loop.ts`

#### execution

- `packages/engine-core/src/execution/workbench/files/read.ts`
- `packages/engine-core/src/execution/workbench/files/write.ts`
- `packages/engine-core/src/execution/workbench/patch/apply_patch.ts`
- `packages/engine-core/src/execution/workbench/shell/exec.ts`
- `packages/engine-core/src/execution/workbench/shell/session.ts`

#### domains

- `packages/engine-core/src/domains/subagent/runtime.ts`

#### semantics

- `packages/engine-core/src/semantics/events/types.ts`
- `packages/engine-core/src/semantics/results/final_result.ts`

### 4.3 当前仍以 README 为主、尚未实现的目录

#### core

- `packages/engine-core/src/core/session/`

#### assembly

- `packages/engine-core/src/assembly/README.md`

#### execution

- `packages/engine-core/src/execution/README.md`
- `packages/engine-core/src/workbench/*` 下大多数目录仍只有 README

#### domains

- `packages/engine-core/src/domains/README.md`
- `packages/engine-core/src/skills/` 目录已被清掉旧空目录，实际能力未迁入 `domains/skills/`
- `packages/engine-core/src/mcp/` 当前只有 README 树，无真实代码

#### semantics

- `approval/memory/artifacts/results/events/hooks` 的真实代码基本未迁入 `semantics/`

## 5. 当前主要问题

### 5.1 结构问题

当前存在两套表达：

- 真正新层级目录：`core/assembly/execution/domains/semantics`
- 旧文档与 blueprint 中部分仍保留平铺映射叙述

### 5.2 残余问题

`packages/engine-core/src/workbench/` 仍然是 README-only 残余树。

这与当前真实代码目录 `packages/engine-core/src/execution/workbench/` 重复，容易误导。

### 5.3 文档问题

历史文档大量不符合外层 `CLAUDE.md` 的语言要求，尤其是：

- 过程性表述
- 评价性表述
- 相对性表述
- 重复论述

优先问题文档：

- `ark-code/docs/design/engine_core_detailed_architecture.md`
- `ark-code/docs/engine-core-inventory/*`
- `ark-code/docs/runtime-loop-inventory/*`
- 部分 README

### 5.4 实现问题

真实可运行实现仍然只是最小主链，缺少：

- runner/query loop 正式实现
- planner policy 正式实现
- session transcript/resume/recovery
- approval runtime
- subagent 完整实现
- skills runtime
- MCP runtime
- artifacts/results/events/hooks 的正式实现

## 6. 构建状态

最近一次执行：

- `pnpm --dir "/Users/jirong.you/workspace/others/oc-cc-coder/ark-code" build`

结果：

- 构建通过

说明：

- 当前最小迁移代码仍可构建
- 不代表结构已正确收束，也不代表 engine-core 已完整实现

## 7. 后续工作的正确顺序

### 7.1 第一优先级：清理残余结构

应立即处理：

- 删除 `packages/engine-core/src/workbench/` README-only 残余树
- 删除其他仅用于结构表达、但无真实用途的目录
- 保证目录结构和真实代码一致

### 7.2 第二优先级：修正文档总纲

应处理：

- `docs/design/engine_core_detailed_architecture.md` 收缩为总纲
- 目录 README 与真实代码保持一一对应
- `docs/design/` 只保留总览、链接、必要总设计

### 7.3 第三优先级：回到真实实现

应按当前已确定的 5 层结构推进代码：

- `core/`
- `assembly/`
- `execution/`
- `domains/`
- `semantics/`

并优先补齐真正会影响行为的核心部分：

- query loop / runner
- session transcript/resume/recovery
- approval / waiting / queues
- subagent / sidechain transcript / handoff
- MCP runtime
- output handoff / task-notification / result surface
- typed events

## 8. 禁止事项

后续 agent 不应继续：

- 扩张新的文档树
- 继续创造新的结构表达目录但不落真实代码
- 写大量过程性说明
- 用新的抽象逻辑替换 OpenCC/OC 原有执行语义

## 9. 一句话结论

当前工程状态是：

- 盘点完成
- 设计完成
- 文档过多
- 结构有残余
- 代码实现不足

后续 agent 的任务是：

- 清理残余
- 收缩文档
- 完成真实代码
