# OpenCC 对齐疑问与无法直接对齐项

本文件用于记录 `engine-core` 重新开始实现前，已经发现的无法直接对齐、仍有疑问、或需要进一步确认的部分。

## 使用规则

出现以下情况时，必须先记录到本文件，再决定是否继续实现：

- OpenCC 中有多条候选路径，无法判断应对齐哪一条
- 盘点文档描述了模块职责，但还不能唯一确定真实执行顺序
- Ark Code 的包边界与 OpenCC 现有文件分布不一致，拆分时存在歧义
- 任何 prompt、approval、continuation、result handoff 相关逻辑，如果实现者想先写一个“简单版”

每条记录至少包含：

- 功能名
- Ark Code 目标目录
- OpenCC 候选代码路径
- 当前疑问点
- 为什么现在不能直接实现
- 后续处理方式

---

## 1. prompt compiler / effective system prompt

- 功能名：prompt compiler / effective system prompt
- Ark Code 目标目录：`src/assembly/prompt/` `src/assembly/context/` `src/assembly/model-loop/`
- OpenCC 候选代码路径：
  - `opencc/src/constants/prompts.ts`
  - `opencc/src/utils/systemPrompt.ts`
  - `opencc/src/context.ts`
  - `opencc/src/utils/queryContext.ts`
  - `opencc/src/utils/messages.ts`
  - `opencc/src/services/api/claude.ts`
- 当前疑问点：
  - default / coordinator / agent / custom / append prompt 的真实输入边界分别来自哪里
  - 哪些部分属于 prompt compiler，哪些属于 API request normalize
  - 哪些动态信息应走 attachment，而不是直接拼入 prompt
- 为什么现在不能直接实现：
  - 如果不先理清这条链，就会再次写出无来源的默认 prompt 或错误的优先级链
- 后续处理方式：
  - 先按 `02_context_and_request_assembly.md` 逐段核清 system prompt 与 attachments 的真实拼装顺序，再进入实现

## 2. results / output handoff / continuation

- 功能名：results / output handoff / continuation
- Ark Code 目标目录：`src/semantics/results/` `src/semantics/events/` `src/execution/workbench/process/`
- OpenCC 候选代码路径：
  - `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`
  - `opencc/src/tasks/LocalAgentTask/LocalAgentTask.tsx`
  - `opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx`
  - `opencc/src/utils/task/diskOutput.js`
  - `opencc/src/query.ts`
  - `opencc/src/utils/attachments.ts`
  - `opencc/src/constants/xml.ts`
- 当前疑问点：
  - output file、task-notification、queued message、attachment 四者的正式主链是什么
  - 哪些结果应直接进入当前 turn，哪些必须延迟到下一轮消费
- 为什么现在不能直接实现：
  - 如果回流链先写错，后续 background shell / subagent / MCP continuation 都会一起返工
- 后续处理方式：
  - 先把 `05_runtime_waiting_and_continuation.md` 和 `04_waiting_background_continuation.md` 里列出的回流链画清，再进入实现

## 3. approval / waiting state

- 功能名：approval / waiting state
- Ark Code 目标目录：`src/semantics/approval/` `src/core/state/`
- OpenCC 候选代码路径：
  - `opencc/src/state/AppStateStore.ts`
  - `opencc/src/screens/REPL.tsx`
  - `opencc/src/hooks/toolPermission/handlers/interactiveHandler.ts`
  - `opencc/src/services/mcp/elicitationHandler.ts`
- 当前疑问点：
  - 各类 waiting queue 如何建模成统一状态
  - tool permission、sandbox permission、worker sandbox、prompt queue、elicitation queue 的最小公共抽象是什么
- 为什么现在不能直接实现：
  - 如果先拍一个统一 waitingState，会丢失 OpenCC 中多路等待态的差异语义
- 后续处理方式：
  - 先基于盘点文档列出完整 waiting state 枚举，再决定最小实现子集

## 4. runner / tool orchestration

- 功能名：runner / tool orchestration
- Ark Code 目标目录：`src/execution/runner/`
- OpenCC 候选代码路径：
  - `opencc/src/services/tools/toolOrchestration.ts`
  - `opencc/src/services/tools/toolExecution.ts`
  - `opencc/src/services/tools/StreamingToolExecutor.ts`
- 当前疑问点：
  - 当前阶段是否允许只做同步 round，还是必须从第一版就把 streaming tool execution 结构预留完整
  - contextModifier 的回放位置应该落在 runner 还是结果层
- 为什么现在不能直接实现：
  - 如果先做一个“能跑”的串行 runner，后面接 streaming / contextModifier 很可能整体推倒
- 后续处理方式：
  - 先把 OpenCC 的串并行批次、streaming、error / synthetic result 流程图整理清楚

## 5. attachment 注入边界

- 功能名：attachment 注入边界
- Ark Code 目标目录：`src/assembly/context/` `src/semantics/memory/` `src/semantics/results/`
- OpenCC 候选代码路径：
  - `opencc/src/utils/attachments.ts`
  - `opencc/src/utils/toolSearch.ts`
  - `opencc/src/utils/mcpInstructionsDelta.ts`
  - `opencc/src/utils/hooks/AsyncHookRegistry.ts`
- 当前疑问点：
  - 哪些 attachment 属于当前阶段必须落的最小集合
  - 哪些 attachment 可以只留接口，不进入第一轮实现
- 为什么现在不能直接实现：
  - 如果不分清 attachment 子类，就会重复上一轮“先写简单 prompt / context，再回头补 attachment”的错误
- 后续处理方式：
  - 先从 `06_inventory_mapping.md` 里筛出“当前阶段必落”的 attachment 子类，再实现最小集合

## 6. 当前结论

当前已知的高风险疑问集中在：

- prompt compiler
- results / output handoff
- approval / waiting state
- runner / tool orchestration
- attachment 注入边界

在这些问题澄清前，不进入新的代码实现。
