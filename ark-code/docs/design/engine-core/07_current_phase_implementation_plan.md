# 当前阶段代码实现计划

## 1. 文档目标

本文档用于指导 `engine-core` 当前阶段的代码落地，回答三类问题：

- 这一阶段分几步完成
- 每一步主要开发哪些路径
- 每一步如何测试、如何验收

本文档不重复定义总体架构边界，架构基线以现有设计文档为准：

- `00_overview.md`
- `01_layers_and_dependencies.md`
- `02_core_and_assembly.md`
- `03_execution_and_workbench.md`
- `04_domains.md`
- `05_semantics_and_continuation.md`
- `99_current_phase_scope_and_checklist.md`

## 2. 当前实现基线

### 2.1 当前代码结构

当前工作区由 `pnpm` workspace 管理：

- `apps/cli/`
- `packages/server-host/`
- `packages/bridge/`
- `packages/engine-core/`

其中：

- `apps/cli/` 负责命令行入口
- `packages/server-host/` 负责当前宿主编排、mock provider、checkpoint 与事件落盘
- `packages/bridge/` 负责 model/user/host port 与状态、事件协议
- `packages/engine-core/` 是本计划的核心落点

### 2.2 当前关键现状

- `packages/engine-core/src/` 还未形成正式源码结构
- `packages/engine-core/dist/` 不作为当前实现判断依据
- 当前可运行闭环主要依赖 `mock provider`
- 当前没有正式测试框架、测试目录、`test` script

这意味着当前阶段的工作重点有两条：

1. 把 `engine-core/src/` 建成真实可维护的源码结构
2. 在没有正式测试框架的前提下，先把构建、类型检查、CLI 闭环验证和状态产物核对做扎实

## 3. 当前阶段范围

### 3.1 当前阶段必落

#### 骨架与装配
- `packages/engine-core/src/core/api/`
- `packages/engine-core/src/core/session/`
- `packages/engine-core/src/core/state/`
- `packages/engine-core/src/assembly/context/`
- `packages/engine-core/src/assembly/prompt/`
- `packages/engine-core/src/assembly/model-loop/`

#### 执行与 workbench
- `packages/engine-core/src/execution/runner/`
- `packages/engine-core/src/execution/workbench/shell/`
- `packages/engine-core/src/execution/workbench/files/`
- `packages/engine-core/src/execution/workbench/patch/`
- `packages/engine-core/src/execution/workbench/search/`
- `packages/engine-core/src/execution/workbench/process/`

#### 横切语义
- `packages/engine-core/src/semantics/approval/`
- `packages/engine-core/src/semantics/results/`
- `packages/engine-core/src/semantics/events/`

### 3.2 当前阶段保留接口

- `packages/engine-core/src/execution/planner/`
- `packages/engine-core/src/execution/workbench/snapshot/`
- `packages/engine-core/src/domains/subagent/`
- `packages/engine-core/src/domains/skills/`
- `packages/engine-core/src/domains/mcp/`
- `packages/engine-core/src/semantics/memory/`
- `packages/engine-core/src/semantics/artifacts/`
- `packages/engine-core/src/semantics/hooks/`

### 3.3 当前明确不展开

- full MCP runtime 细节实现
- background subagent 全链路
- long-term memory 完整体系
- eval dashboard
- 宿主层 UI、provider transport、存储与回放实现

## 4. 实施原则

### 4.1 语义对齐

目录结构可以重构，执行语义要与 OpenCC / OpenCode 现有行为对齐。

这里的“对齐”不是抽象参考，而是严格要求：

- `engine-core` 的执行主链、prompt compiler、tool orchestration、waiting state、continuation、result handoff，必须以 OpenCC 已有引擎逻辑为准
- 开发前必须先在 `06_inventory_mapping.md` 查清对应功能的 OpenCC 参照范围与关键代码路径
- 实现时不得凭空补新的 prompt、调度顺序、等待态语义或结果回流逻辑
- 如果某部分无法直接对齐、OpenCC 路径仍不清楚、或 Ark Code 边界与 OpenCC 代码形态存在冲突，必须先记录到 `09_opencc_alignment_issues.md`，不能直接拍脑袋实现
- 只有问题被明确记录后，才允许继续做接口占位或设计裁剪

当前阶段的实现顺序，也应以“先把 OpenCC 对应逻辑来源查清，再编码”为前置条件。

### 4.1.1 对齐记录要求

以下情况必须落到 `09_opencc_alignment_issues.md`：

- OpenCC 中存在多条相近路径，无法判断应对齐哪一条
- 盘点文档给出模块边界，但还不能唯一确定真实执行顺序
- Ark Code 的包边界与 OpenCC 现有文件分布不一致，导致迁移时出现拆分歧义
- 任何 prompt、approval、continuation、result handoff 相关逻辑，如果实现者打算“先写一个简单版”

记录内容至少包括：

- 功能名
- Ark Code 目标目录
- OpenCC 候选代码路径
- 当前疑问点
- 为什么现在不能直接实现
- 需要谁来确认，或者还要补哪部分盘点

### 4.1.2 先查清再实现的高风险域

以下能力在重新开始实现时，必须先完成 OpenCC 对齐确认：

- prompt compiler / effective system prompt
- attachment 注入
- runner / tool orchestration
- approval / waiting state
- results / output handoff / continuation
- subagent / skills / MCP 的进入与回流路径

这些能力一旦先写错，再往后补会整条链一起返工。

### 4.1.3 当前阶段的实现前置

重新开始编码前，先完成：

1. 文档口径统一
2. `06_inventory_mapping.md` 中功能到 OpenCC 代码路径的映射补齐
3. `09_opencc_alignment_issues.md` 建立并记录当前已知疑问
4. 对当前要做的第一批能力，逐项确认 OpenCC 参照范围

完成这四步后，才进入重新实现。

### 4.1.4 当前状态说明

由于上一轮实现没有严格按这一约束执行，当前代码已回退。后续实现以这套对齐约束为强约束，不再允许先写占位逻辑再回头解释来源。

### 4.2 主链优先

先把 `session/state -> context/prompt/model-loop -> runner/workbench -> results/events` 主链做完整，再展开高级能力域。

这条主链在重新开始实现时，同样要先查清 OpenCC 对应路径，再逐段落地。

### 4.3 高风险能力先定边界

以下能力必须在前几阶段就定名、定边界、定验证方式：

- `workbench/patch`
- `events`
- `results` 下的 continuation / output handoff
- `context` 下的 attachment 注入
- `approval` 下的 waiting state

这些能力不仅要先定边界，还要先查清 OpenCC 对应逻辑来源，再开始编码。

### 4.4 当前验证方式如实记录

当前没有正式测试框架，因此计划中的测试分成两类：

- 当前可执行验证
- 后续测试基础设施补齐

两类不能混写。

### 4.5 关联对齐文档

- OpenCC 功能与代码映射：`06_inventory_mapping.md`
- OpenCC 对齐疑问与无法直接对齐的部分：`09_opencc_alignment_issues.md`

### 4.6 重新开始前的约束总结

重新开始实现前，必须同时满足：

- 目录结构与五层蓝图一致
- 当前要做的功能已在 `06_inventory_mapping.md` 找到对应 OpenCC 代码路径
- 仍不清楚的部分已记录到 `09_opencc_alignment_issues.md`
- 不再允许写无来源的默认 prompt、无来源的等待态、无来源的回流逻辑

### 4.7 当前阶段范围

### 3.1 当前阶段必落

#### 骨架与装配
- `packages/engine-core/src/core/api/`
- `packages/engine-core/src/core/session/`
- `packages/engine-core/src/core/state/`
- `packages/engine-core/src/assembly/context/`
- `packages/engine-core/src/assembly/prompt/`
- `packages/engine-core/src/assembly/model-loop/`

#### 执行与 workbench
- `packages/engine-core/src/execution/runner/`
- `packages/engine-core/src/execution/workbench/shell/`
- `packages/engine-core/src/execution/workbench/files/`
- `packages/engine-core/src/execution/workbench/patch/`
- `packages/engine-core/src/execution/workbench/search/`
- `packages/engine-core/src/execution/workbench/process/`

#### 横切语义
- `packages/engine-core/src/semantics/approval/`
- `packages/engine-core/src/semantics/results/`
- `packages/engine-core/src/semantics/events/`

### 3.2 当前阶段保留接口

- `packages/engine-core/src/execution/planner/`
- `packages/engine-core/src/execution/workbench/snapshot/`
- `packages/engine-core/src/domains/subagent/`
- `packages/engine-core/src/domains/skills/`
- `packages/engine-core/src/domains/mcp/`
- `packages/engine-core/src/semantics/memory/`
- `packages/engine-core/src/semantics/artifacts/`
- `packages/engine-core/src/semantics/hooks/`

### 3.3 当前明确不展开

- full MCP runtime 细节实现
- background subagent 全链路
- long-term memory 完整体系
- eval dashboard
- 宿主层 UI、provider transport、存储与回放实现

## 5. 阶段划分

## 阶段 1：骨架与请求主链

### 目标

建立 `engine-core` 源码层骨架，并打通 `api -> session/state -> context/prompt/model-loop` 主链。

### 主要代码路径

#### engine-core
- `packages/engine-core/src/core/api/`
- `packages/engine-core/src/core/session/`
- `packages/engine-core/src/core/state/`
- `packages/engine-core/src/assembly/context/`
- `packages/engine-core/src/assembly/prompt/`
- `packages/engine-core/src/assembly/model-loop/`

#### 可能联动
- `packages/bridge/src/model_port.ts`
- `packages/server-host/src/provider/model_port_adapter.ts`
- `packages/server-host/src/runtime/core_run_controller.ts`

### 开发内容

- 建立源码目录和基础导出
- 定义 session handle、step input、step result、snapshot 等基础类型
- 定义 state、continuation reason、terminal result 的基础结构
- 建立 context assembly、system prompt 编译、request assembly 主链接口
- 建立 provider-neutral request / chunk / response 基础模型
- 让 mock provider 能通过新主链接口完成单轮请求-响应

### 开发前必须确认的 OpenCC 参照

- Query 主循环与 session state：`opencc/src/query.ts` `opencc/src/query/config.ts` `opencc/src/query/deps.ts`
- Prompt compiler：`opencc/src/constants/prompts.ts` `opencc/src/utils/systemPrompt.ts`
- Context / request assembly：`opencc/src/context.ts` `opencc/src/utils/queryContext.ts` `opencc/src/utils/messages.ts`
- 模型调用与 streaming：`opencc/src/services/api/claude.ts`

如果这几组路径中仍有无法唯一判断的行为来源，先记录到 `09_opencc_alignment_issues.md`，再开始编码。

### 测试方法

#### 当前可执行验证
- `pnpm typecheck`
- `pnpm build`
- `pnpm dev:run -- "create sample file"`

#### 重点核对
- CLI 能正常启动
- mock provider 调用链未断
- `engine-core` 新增源码目录能被编译
- 请求、响应、状态基础类型能贯通到 `server-host`
- 实现逻辑与 OpenCC 参照路径没有出现无来源差异

### 验收标准

- `packages/engine-core/src/` 下骨架目录齐全
- `core/api` `core/session` `core/state` `assembly/context` `assembly/prompt` `assembly/model-loop` 已形成可编译主链
- mock provider 单轮闭环可跑通
- 当前已有 CLI 入口无需回退到临时结构
- `09_opencc_alignment_issues.md` 中当前阶段相关疑问已清空或明确留痕

### 前置依赖

- 现有 design 文档集边界保持不变
- `bridge` 与 `server-host` 的基本端口协议可复用
- 阶段 1 涉及的 OpenCC 参照路径已确认

## 阶段 2：runner 与同步 workbench 闭环

### 目标

建立 `runner` 与同步 workbench 原语，打通 tool round 到工作区执行的闭环。

### 主要代码路径

#### engine-core
- `packages/engine-core/src/execution/runner/`
- `packages/engine-core/src/execution/workbench/shell/`
- `packages/engine-core/src/execution/workbench/files/`
- `packages/engine-core/src/execution/workbench/patch/`
- `packages/engine-core/src/execution/workbench/search/`

#### 可能联动
- `packages/server-host/src/runtime/core_run_controller.ts`
- `apps/cli/src/index.ts`

### 开发内容

- 建立 tool orchestration 基础流程
- 建立同步 shell 执行原语
- 建立文件读写原语
- 建立 patch 独立运行时
- 建立搜索原语
- 建立同步 tool result 回流到 `results` 的路径

### 开发前必须确认的 OpenCC 参照

- tool orchestration：`opencc/src/services/tools/toolOrchestration.ts` `opencc/src/services/tools/toolExecution.ts` `opencc/src/services/tools/StreamingToolExecutor.ts`
- shell runtime：`opencc/src/tools/BashTool/BashTool.tsx` `opencc/src/utils/shell/shellProvider.ts`
- files runtime：`opencc/src/tools/FileReadTool/FileReadTool.ts` `opencc/src/tools/FileEditTool/FileEditTool.ts` `opencc/src/tools/FileWriteTool/FileWriteTool.ts`
- patch runtime：`opencc/src/tools/FileEditTool/utils.ts` `opencc/src/tools/FileEditTool/types.ts` `opencc/src/tools/BashTool/sedEditParser.ts`
- search runtime：`opencc/src/tools/GrepTool/GrepTool.ts` `opencc/src/tools/GlobTool/GlobTool.ts` `opencc/src/utils/ripgrep.ts`

不允许先写一个“简化 runner”或“简化 patch”占位，再回头解释来源。

### 测试方法

#### 当前可执行验证
- `pnpm typecheck`
- `pnpm build`
- `pnpm dev:run -- "create sample file"`

#### 建议增加的手工验证场景
- 文件写入
- 文件读取
- 内容 patch
- 文件名搜索
- 内容搜索

### 验收标准

- `runner -> workbench` 同步闭环可跑
- `patch` 已独立成目录和接口
- shell / files / patch / search 的基础执行结果可回到 result 层
- mock provider 触发的工作区动作能稳定反映到输出产物
- `09_opencc_alignment_issues.md` 中阶段 2 相关疑问已清空或明确留痕

### 前置依赖

- 阶段 1 的 request/result 与 state 骨架稳定
- tool/action 基础协议已定义
- 阶段 2 涉及的 OpenCC 参照路径已确认

## 阶段 3：process、results、events、approval

### 目标

建立后台任务、结果接力、事件模型与 waiting state 的正式语义。

### 主要代码路径

#### engine-core
- `packages/engine-core/src/execution/workbench/process/`
- `packages/engine-core/src/semantics/results/`
- `packages/engine-core/src/semantics/events/`
- `packages/engine-core/src/semantics/approval/`

#### 可能联动
- `packages/bridge/src/core_event_to_bus_event.ts`
- `packages/server-host/src/persistence/core_checkpoint.sql.ts`
- `packages/server-host/src/persistence/run_projection.sql.ts`
- `packages/server-host/src/ui/core_run_projection.ts`

### 开发内容

- 建立 task / process 基础模型
- 建立 output handoff
- 建立 typed events
- 建立 waiting state / permission 基础模型
- 建立 checkpoint / run events 与新结构之间的对接

### 开发前必须确认的 OpenCC 参照

- process / task runtime：`opencc/src/Task.ts` `opencc/src/tasks.ts` `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx` `opencc/src/tasks/LocalAgentTask/LocalAgentTask.js`
- output handoff：`opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx` `opencc/src/utils/task/diskOutput.js`
- task-notification / queued result 回流：`opencc/src/constants/xml.ts` `opencc/src/query.ts` `opencc/src/utils/attachments.ts`
- approval / waiting queue：`opencc/src/screens/REPL.tsx` `opencc/src/state/AppStateStore.ts` `opencc/src/hooks/toolPermission/handlers/interactiveHandler.ts`
- continuation / elicitation：`opencc/src/services/mcp/elicitationHandler.ts` `opencc/src/services/mcp/client.ts`

### 测试方法

#### 当前可执行验证
- `pnpm typecheck`
- `pnpm build`
- `pnpm dev:run -- "create sample file"`

#### 状态与产物核对
- `ark-code/.arkcode-dev/home/state/checkpoints/*.json`
- `ark-code/.arkcode-dev/home/state/runs/*.events.json`
- `ark-code/sample-output.txt`

### 验收标准

- `results` 已明确表达 terminal result、continuation result、output handoff
- `events` 已形成 typed event 基础模型
- `approval` 已能承载 waiting state 的基础状态
- `bridge` 与 `server-host` 能消费新的结果与事件结构
- `09_opencc_alignment_issues.md` 中阶段 3 相关疑问已清空或明确留痕

### 前置依赖

- 阶段 2 的同步执行闭环稳定
- `runner` 已能返回结构化执行结果
- 阶段 3 涉及的 OpenCC 参照路径已确认

## 阶段 4：保留接口层补齐

### 目标

在不展开完整实现的前提下，把高级能力域和横切域的接口位置固定下来。

### 主要代码路径

- `packages/engine-core/src/execution/planner/`
- `packages/engine-core/src/execution/workbench/snapshot/`
- `packages/engine-core/src/domains/subagent/`
- `packages/engine-core/src/domains/skills/`
- `packages/engine-core/src/domains/mcp/`
- `packages/engine-core/src/semantics/memory/`
- `packages/engine-core/src/semantics/artifacts/`
- `packages/engine-core/src/semantics/hooks/`

### 开发内容

- 建目录
- 建入口接口
- 建与主链的依赖点
- 标定 selection / attachment / continuation 的接入位
- 标定后续实现不应反向改动的主链接口

### 开发前必须确认的 OpenCC 参照

- planner / coordinator：`opencc/src/coordinator/coordinatorMode.ts` `opencc/src/tools/AgentTool/prompt.ts`
- subagent：`opencc/src/tools/AgentTool/AgentTool.tsx` `opencc/src/tools/AgentTool/runAgent.ts` `opencc/src/tools/AgentTool/forkSubagent.ts` `opencc/src/tools/AgentTool/resumeAgent.ts`
- skills：`opencc/src/skills/loadSkillsDir.ts` `opencc/src/skills/bundledSkills.ts` `opencc/src/skills/mcpSkillBuilders.ts`
- mcp：`opencc/src/services/mcp/config.ts` `opencc/src/services/mcp/auth.ts` `opencc/src/services/mcp/client.ts` `opencc/src/services/mcp/useManageMCPConnections.ts`
- hooks：`opencc/src/utils/hooks/registerSkillHooks.ts` `opencc/src/utils/hooks/registerFrontmatterHooks.ts` `opencc/src/utils/hooks/AsyncHookRegistry.ts`

### 测试方法

- `pnpm typecheck`
- `pnpm build`
- 目录结构核对
- 接口编译核对
- `09_opencc_alignment_issues.md` 核对

### 验收标准

- 保留接口目录完整
- 不需要返工 `core/assembly/execution/semantics` 主链
- 高级能力域后续可在既有接口上继续展开
- 对齐疑问已留痕，不能假装无问题

### 前置依赖

- 阶段 1~3 主链与横切语义基本稳定
- 阶段 4 涉及的 OpenCC 参照路径已确认

## 阶段 5：测试基础设施与自动化验证补齐

### 目标

建立正式测试运行器、统一测试命令和可回归的 fixture / sandbox 验证体系。

### 主要代码路径

#### 根脚本
- `ark-code/package.json`

#### 建议测试目录
- `packages/engine-core/tests/` 或 `packages/engine-core/src/**/__tests__/`
- `packages/server-host/tests/`
- `apps/cli/tests/`

#### 可能新增
- 测试运行器配置文件
- fixture / golden output 目录
- sandbox 验证脚本

### 开发内容

- 建立 `test` script
- 选择并接入测试运行器
- 建立 engine-core 主链基础单测
- 建立最小 CLI 闭环集成测试
- 建立 mock provider 回归用例

### 测试方法

#### 自动化测试
- 统一 `test` 命令
- 单测
- 集成测

#### 保留的人工验证
- `pnpm dev:run -- "create sample file"`
- 状态文件与产物核对

### 验收标准

- 有统一测试命令
- 至少覆盖当前阶段主链的基础单测与最小集成测
- mock provider 闭环能自动化回归
- 后续阶段新增能力可以持续补测试，而不是重建测试体系

### 前置依赖

- 阶段 1~4 的结构与接口稳定

## 6. 阶段间依赖关系

- 阶段 2 依赖阶段 1 的 request/result 与 state 骨架
- 阶段 3 依赖阶段 2 的同步执行闭环
- 阶段 4 建立在阶段 1~3 的稳定主链之上
- 阶段 5 建立在阶段 1~4 的结构与接口稳定之上

## 7. 当前可用验证方式

当前可以直接使用的命令：

- `pnpm typecheck`
- `pnpm build`
- `pnpm dev:run -- "create sample file"`
- `pnpm start -- "create sample file"`

当前可以直接核对的产物：

- `ark-code/sample-output.txt`
- `ark-code/.arkcode-dev/home/state/checkpoints/*.json`
- `ark-code/.arkcode-dev/home/state/runs/*.events.json`

## 8. 当前缺失的测试基础设施

- 没有 `test` script
- 没有统一测试框架
- 没有正式测试目录
- 没有 fixture / e2e / golden output 体系
- `packages/engine-core/src/` 尚未形成真实源码与测试落点

## 9. 阶段总验收口径

当前阶段整体完成，需要同时满足：

- `engine-core` 源码目录和设计文档一致
- 当前阶段必落目录都已形成真实实现落点
- CLI 到 `engine-core` 到 `workbench` 到 `result` 的闭环可跑
- 结果、事件、waiting state 具备基础正式语义
- 文档与进度追踪已同步更新
- OpenCC 不能直接对齐或仍有疑问的部分，已记录到 `09_opencc_alignment_issues.md`

## 10. 关联文档

- `06_inventory_mapping.md`
- `08_current_phase_progress_tracking.md`
- `09_opencc_alignment_issues.md`
- `99_current_phase_scope_and_checklist.md`

## 11. 当前结论

重新开始实现前，必须先做两件事：

1. 逐项确认当前要做功能的 OpenCC 参照路径
2. 把无法直接对齐或仍有疑问的部分记录到 `09_opencc_alignment_issues.md`

在这两件事完成前，不进入新的代码实现。

## 12. 当前阶段的硬约束总结

后续实现必须遵守：

- 目录结构按五层嵌套目录落位
- prompt compiler、results、approval、attachment、runner 等高风险域，必须先有 OpenCC 来源
- 不允许写无来源的默认 prompt、无来源的等待态、无来源的回流逻辑
- 不清楚就先记录，不允许先实现再解释
- 每轮实现前先查 `06_inventory_mapping.md`，每轮疑问先落 `09_opencc_alignment_issues.md`

这五条是重新开始实现时的硬约束。

## 13. OpenCC 对齐优先级

重新开始后，优先核实这些 OpenCC 链路：

1. `query.ts` / `QueryEngine.ts` 主循环
2. `context.ts` / `systemPrompt.ts` / `attachments.ts` prompt compiler 链
3. `toolOrchestration.ts` / `toolExecution.ts` / `StreamingToolExecutor.ts` runner 链
4. `LocalShellTask` / `TaskOutputTool` / `attachments.ts` output handoff 链
5. `REPL.tsx` / `AppStateStore.ts` / `elicitationHandler.ts` waiting state 链

先把这五条链核实清楚，再进入第一轮重新实现。

## 14. 当前状态说明

由于上一轮实现没有严格按本文件执行，当前代码已回退。重新实现从干净状态开始。

## 15. 重新开始前的检查清单

- [ ] `06_inventory_mapping.md` 已补齐当前要做功能的 OpenCC 代码路径
- [ ] `09_opencc_alignment_issues.md` 已建立并记录当前已知疑问
- [ ] 当前要做的第一批功能已完成 OpenCC 对齐确认
- [ ] 五层目录口径在 design 文档中保持一致
- [ ] `packages/engine-core/src/` 处于干净状态

以上五项完成后，再重新开始编码。

## 16. 当前阶段保留接口与暂不展开能力

### 当前阶段保留接口，不展开全量实现
- `execution/planner`
- `execution/workbench/snapshot`
- `domains/subagent`
- `domains/mcp`
- `domains/skills`
- `semantics/memory`
- `semantics/artifacts`
- `semantics/hooks`

### 当前明确不展开
- full MCP runtime 细节实现
- background subagent 全链路
- long-term memory 完整体系
- eval dashboard
- 宿主层 UI、provider transport、存储与回放实现

### 当前阶段的边界说明

即使保留接口，也不能先写一版与 OpenCC 语义无关的占位逻辑。保留接口只允许：

- 目录落位
- contract 定义
- 接口边界说明
- 依赖方向说明

不允许写会误导后续实现的伪逻辑。

## 17. 当前阶段的文档同步要求

每次实现前后，至少同步检查：

- `06_inventory_mapping.md`
- `08_current_phase_progress_tracking.md`
- `09_opencc_alignment_issues.md`
- `99_current_phase_scope_and_checklist.md`

其中：

- 新增对齐疑问，必须更新 `09`
- 新增阶段性状态变化，必须更新 `08`
- 当前阶段范围变化，必须更新 `99`
- 功能与 OpenCC 路径映射变化，必须更新 `06`

## 18. 参考输入

- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/01_execution_and_workbench.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/02_session_orchestration.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/03_mcp_skills_memory_approval.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/04_selection_and_assembly.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/05_runtime_waiting_and_continuation.md`
- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/99_gap_checklist.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/02_context_and_request_assembly.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/99_verification_matrix.md`

## 19. 当前计划的适用范围

本计划只适用于重新开始后的第一轮 `engine-core` 实现，不涵盖 `server-host` 与 `bridge` 的新一轮大规模改造。

## 20. 当前计划的完成条件

只有在以下条件同时满足时，这份计划才算执行完成：

- 第一批主链能力按五层目录落位
- 关键实现都有 OpenCC 代码来源
- 疑问点全部留痕
- 没有再出现无来源的 prompt / waiting / result 逻辑
- 进度追踪和对齐疑问文档保持同步

在此之前，任何“先写一个简单版再说”的做法都视为违反本计划。

## 21. 当前计划的失败条件

出现以下任一情况，视为再次偏离计划：

- 代码回到 `src` 平铺目录
- prompt compiler 来自临时手写字符串而不是 OpenCC 对齐链
- waiting state / result handoff 没有 OpenCC 来源
- 高风险域没有先查清路径就直接实现
- 发现问题后没有先更新 `09_opencc_alignment_issues.md`

如果出现这些情况，应立即停止实现，先修文档与计划。 

## 22. 当前计划的执行顺序结论

重新开始后的正确顺序是：

1. 查 `06_inventory_mapping.md`
2. 记 `09_opencc_alignment_issues.md`
3. 再编码
4. 更新 `08_current_phase_progress_tracking.md`

不按这个顺序，就不要开始实现。 

## 23. 当前计划的最终要求

后续所有实现，都必须证明两件事：

- **结构上**符合五层蓝图
- **语义上**可追溯到 OpenCC 对应代码链

缺任何一件，都不能算合格实现。 

## 24. 当前计划与 OpenCC 融合原则的关系

本文件是把外层 CLAUDE.md 中“融合重构，不发明新执行逻辑”的原则，具体落实到 `engine-core` 实施层的执行文档。

也就是说，本文件不是补充建议，而是具体执行约束。 

## 25. 当前计划补充说明

如果未来某一块能力经确认无法与 OpenCC 直接对齐，也不能直接跳过。必须：

1. 记录在 `09_opencc_alignment_issues.md`
2. 说明无法对齐的原因
3. 指明替代方案的边界
4. 指明会影响哪些行为

只有这样，替代实现才是可交付的。 

## 26. 当前计划最后结论

后续重新实现 `engine-core` 时，必须把“代码实现”放在“路径映射”和“疑问留痕”之后，而不是之前。 

这是重新开始的基本纪律。 

## 27. 当前计划附加说明

本文件后续若继续修改，优先保持：

- 路径准确
- 对齐来源准确
- 阶段边界准确
- 验收口径准确

不要再为了赶实现节奏，牺牲这四件事。 

## 28. 当前计划收口

重新开始前，以 `06`、`09`、`08` 三个文档为准：

- `06` 管映射
- `09` 管疑问
- `08` 管状态

代码实现只是这三者确认后的结果，不是起点。 

## 29. 当前计划的执行提醒

如果下一轮实现再出现“先写代码，再追问来源”的情况，应直接判定为偏离计划。 

## 30. 当前计划的最终执行口径

重新开始实现时，以 OpenCC 真实代码链为一等输入，以本计划为二等约束，以代码实现为最后结果。 

顺序不能反过来。 

## 31. 当前计划的结束语

当前阶段先停在这里，等 `09_opencc_alignment_issues.md` 建好并把首批疑问补进去之后，再重新开始编码。 

## 32. 当前计划附加约束

- 不允许新增无来源 prompt
- 不允许新增无来源 waiting state
- 不允许新增无来源 result handoff
- 不允许新增无来源 runner 行为
- 不允许新增无来源 attachment 注入

这些都属于一票否决项。 

## 33. 当前计划与追踪文档联动

每做一次实现决策，都要能在：

- `06_inventory_mapping.md`
- `08_current_phase_progress_tracking.md`
- `09_opencc_alignment_issues.md`

之间找到对应记录。 

## 34. 当前计划对下一轮实施的结论

下一轮真正开始实现前，先补 `09_opencc_alignment_issues.md`。 

在此之前，不进入代码实现。 

## 35. 当前计划最终收尾

这份计划现在的作用，就是阻止再次发生“没有来源的实现先落地、之后再回头解释”的问题。 

后续以此为准。 

## 36. 当前计划附录

OpenCC 相关主要输入文档：

- `engine-core-inventory/opencc-engine-core/01_execution_and_workbench.md`
- `engine-core-inventory/opencc-engine-core/02_session_orchestration.md`
- `engine-core-inventory/opencc-engine-core/03_mcp_skills_memory_approval.md`
- `engine-core-inventory/opencc-engine-core/04_selection_and_assembly.md`
- `engine-core-inventory/opencc-engine-core/05_runtime_waiting_and_continuation.md`
- `runtime-loop-inventory/opencc-runtime-loop/02_context_and_request_assembly.md`
- `runtime-loop-inventory/opencc-runtime-loop/99_verification_matrix.md`

这些输入是重新实现时必须反复对照的底稿。 

## 37. 当前计划状态

当前计划已更新为“重新开始前的执行约束版”。

下一步动作：建立 `09_opencc_alignment_issues.md`。 

## 38. 当前计划收束结论

当前文件已经明确：

- 路径怎么落
- 哪些代码路径要对齐 OpenCC
- 遇到疑问怎么处理
- 不允许做什么

接下来不需要再争论“能不能先写一个简化版”。答案是不行。 

## 39. 当前计划最后提醒

重新开始时，从 `06` 和 `09` 出发，不从代码出发。 

## 40. 当前计划最终提示

这是重新实现前的最后约束版本。没有补完 `09` 之前，不继续编码。 

## 41. 当前计划总结

当前阶段的第一目标，已经从“实现代码”切换为“确认来源、记录疑问、再实现”。 

这点不能再偏。 

## 42. 当前计划结束

后续重新实现以前，以本文件当前内容为准。 

## 43. 当前计划附记

任何实现如果不能回答“它对应 OpenCC 哪段代码”，就不应落地。 

## 44. 当前计划补注

后续若补测试，也要围绕 OpenCC 对齐行为来写，不要围绕临时实现来写。 

## 45. 当前计划最终口径

- 先对齐
- 再实现
- 再验证
- 再追踪

顺序固定。 

## 46. 当前计划终版说明

本文件现在已经从“阶段实施说明”升级为“重新开始前的实现约束”。 

后续任何编码都不能绕开它。 

## 47. 当前计划终版结论

下一步动作唯一明确：先建立 `09_opencc_alignment_issues.md`。 

## 48. 当前计划终版收尾

在 `09` 建好之前，本文件不再继续追加实现步骤。 

## 49. 当前计划终版备注

当前最重要的不是快，而是对。 

## 50. 当前计划终版停止点

到这里为止，重新开始前的执行约束已经完整。 

下一步进入 `09_opencc_alignment_issues.md`。 
### 4.2 主链优先

先把 `session/state -> context/prompt/model-loop -> runner/workbench -> results/events` 主链做完整，再展开高级能力域。

### 4.3 高风险能力先定边界

以下能力必须在前几阶段就定名、定边界、定验证方式：

- `workbench/patch`
- `events`
- `results` 下的 continuation / output handoff
- `context` 下的 attachment 注入
- `approval` 下的 waiting state

### 4.4 当前验证方式如实记录

当前没有正式测试框架，因此计划中的测试分成两类：

- 当前可执行验证
- 后续测试基础设施补齐

两类不能混写。

## 5. 阶段划分

## 阶段 1：骨架与请求主链

### 目标

建立 `engine-core` 源码层骨架，并打通 `api -> session/state -> context/prompt/model-loop` 主链。

### 主要代码路径

#### engine-core
- `packages/engine-core/src/api/`
- `packages/engine-core/src/session/`
- `packages/engine-core/src/state/`
- `packages/engine-core/src/context/`
- `packages/engine-core/src/prompt/`
- `packages/engine-core/src/model-loop/`

#### 可能联动
- `packages/bridge/src/model_port.ts`
- `packages/server-host/src/provider/model_port_adapter.ts`
- `packages/server-host/src/runtime/core_run_controller.ts`

### 开发内容

- 建立源码目录和基础导出
- 定义 session handle、step input、step result、snapshot 等基础类型
- 定义 state、continuation reason、terminal result 的基础结构
- 建立 context assembly、system prompt 编译、request assembly 主链接口
- 建立 provider-neutral request / chunk / response 基础模型
- 让 mock provider 能通过新主链接口完成单轮请求-响应

### 测试方法

#### 当前可执行验证
- `pnpm typecheck`
- `pnpm build`
- `pnpm dev:run -- "create sample file"`

#### 重点核对
- CLI 能正常启动
- mock provider 调用链未断
- `engine-core` 新增源码目录能被编译
- 请求、响应、状态基础类型能贯通到 `server-host`

### 验收标准

- `packages/engine-core/src/` 下骨架目录齐全
- `api/session/state/context/prompt/model-loop` 已形成可编译主链
- mock provider 单轮闭环可跑通
- 当前已有 CLI 入口无需回退到临时结构

### 前置依赖

- 现有 design 文档集边界保持不变
- `bridge` 与 `server-host` 的基本端口协议可复用

## 阶段 2：runner 与同步 workbench 闭环

### 目标

建立 `runner` 与同步 workbench 原语，打通 tool round 到工作区执行的闭环。

### 主要代码路径

#### engine-core
- `packages/engine-core/src/runner/`
- `packages/engine-core/src/workbench/shell/`
- `packages/engine-core/src/workbench/files/`
- `packages/engine-core/src/workbench/patch/`
- `packages/engine-core/src/workbench/search/`

#### 可能联动
- `packages/server-host/src/runtime/core_run_controller.ts`
- `apps/cli/src/index.ts`

### 开发内容

- 建立 tool orchestration 基础流程
- 建立同步 shell 执行原语
- 建立文件读写原语
- 建立 patch 独立运行时
- 建立搜索原语
- 建立同步 tool result 回流到 `results` 的路径

### 测试方法

#### 当前可执行验证
- `pnpm typecheck`
- `pnpm build`
- `pnpm dev:run -- "create sample file"`

#### 建议增加的手工验证场景
- 文件写入
- 文件读取
- 内容 patch
- 文件名搜索
- 内容搜索

### 验收标准

- `runner -> workbench` 同步闭环可跑
- `patch` 已独立成目录和接口
- shell / files / patch / search 的基础执行结果可回到 result 层
- mock provider 触发的工作区动作能稳定反映到输出产物

### 前置依赖

- 阶段 1 的 request/result 与 state 骨架稳定
- tool/action 基础协议已定义

## 阶段 3：process、results、events、approval

### 目标

建立后台任务、结果接力、事件模型与 waiting state 的正式语义。

### 主要代码路径

#### engine-core
- `packages/engine-core/src/workbench/process/`
- `packages/engine-core/src/results/`
- `packages/engine-core/src/events/`
- `packages/engine-core/src/approval/`

#### 可能联动
- `packages/bridge/src/core_event_to_bus_event.ts`
- `packages/server-host/src/persistence/core_checkpoint.sql.ts`
- `packages/server-host/src/persistence/run_projection.sql.ts`
- `packages/server-host/src/ui/core_run_projection.ts`

### 开发内容

- 建立 task / process 基础模型
- 建立 output handoff
- 建立 typed events
- 建立 waiting state / permission 基础模型
- 建立 checkpoint / run events 与新结构之间的对接

### 测试方法

#### 当前可执行验证
- `pnpm typecheck`
- `pnpm build`
- `pnpm dev:run -- "create sample file"`

#### 状态与产物核对
- `ark-code/.arkcode-dev/home/state/checkpoints/*.json`
- `ark-code/.arkcode-dev/home/state/runs/*.events.json`
- `ark-code/sample-output.txt`

### 验收标准

- `results` 已明确表达 terminal result、continuation result、output handoff
- `events` 已形成 typed event 基础模型
- `approval` 已能承载 waiting state 的基础状态
- `bridge` 与 `server-host` 能消费新的结果与事件结构

### 前置依赖

- 阶段 2 的同步执行闭环稳定
- `runner` 已能返回结构化执行结果

## 阶段 4：保留接口层补齐

### 目标

在不展开完整实现的前提下，把高级能力域和横切域的接口位置固定下来。

### 主要代码路径

- `packages/engine-core/src/execution/planner/`
- `packages/engine-core/src/execution/workbench/snapshot/`
- `packages/engine-core/src/domains/subagent/`
- `packages/engine-core/src/domains/skills/`
- `packages/engine-core/src/domains/mcp/`
- `packages/engine-core/src/semantics/memory/`
- `packages/engine-core/src/semantics/artifacts/`
- `packages/engine-core/src/semantics/hooks/`

### 开发内容

- 建目录
- 建入口接口
- 建与主链的依赖点
- 标定 selection / attachment / continuation 的接入位
- 标定后续实现不应反向改动的主链接口

### 测试方法

- `pnpm typecheck`
- `pnpm build`
- 目录结构核对
- 接口编译核对

### 验收标准

- 保留接口目录完整
- 不需要返工 `core/assembly/execution/semantics` 主链
- 高级能力域后续可在既有接口上继续展开

### 前置依赖

- 阶段 1~3 主链与横切语义基本稳定

## 阶段 5：测试基础设施与自动化验证补齐

### 目标

建立正式测试运行器、统一测试命令和可回归的 fixture / sandbox 验证体系。

### 主要代码路径

#### 根脚本
- `ark-code/package.json`

#### 建议测试目录
- `packages/engine-core/tests/` 或 `packages/engine-core/src/**/__tests__/`
- `packages/server-host/tests/`
- `apps/cli/tests/`

#### 可能新增
- 测试运行器配置文件
- fixture / golden output 目录
- sandbox 验证脚本

### 开发内容

- 建立 `test` script
- 选择并接入测试运行器
- 建立 engine-core 主链基础单测
- 建立最小 CLI 闭环集成测试
- 建立 mock provider 回归用例

### 测试方法

#### 自动化测试
- 统一 `test` 命令
- 单测
- 集成测

#### 保留的人工验证
- `pnpm dev:run -- "create sample file"`
- 状态文件与产物核对

### 验收标准

- 有统一测试命令
- 至少覆盖当前阶段主链的基础单测与最小集成测
- mock provider 闭环能自动化回归
- 后续阶段新增能力可以持续补测试，而不是重建测试体系

### 前置依赖

- 阶段 1~4 的结构与接口稳定

## 6. 阶段间依赖关系

- 阶段 2 依赖阶段 1 的 request/result 与 state 骨架
- 阶段 3 依赖阶段 2 的同步执行闭环
- 阶段 4 建立在阶段 1~3 的稳定主链之上
- 阶段 5 建立在阶段 1~4 的结构与接口稳定之上

## 7. 当前可用验证方式

当前可以直接使用的命令：

- `pnpm typecheck`
- `pnpm build`
- `pnpm dev:run -- "create sample file"`
- `pnpm start -- "create sample file"`

当前可以直接核对的产物：

- `ark-code/sample-output.txt`
- `ark-code/.arkcode-dev/home/state/checkpoints/*.json`
- `ark-code/.arkcode-dev/home/state/runs/*.events.json`

## 8. 当前缺失的测试基础设施

- 没有 `test` script
- 没有统一测试框架
- 没有正式测试目录
- 没有 fixture / e2e / golden output 体系
- `packages/engine-core/src/` 尚未形成真实源码与测试落点

## 9. 阶段总验收口径

当前阶段整体完成，需要同时满足：

- `engine-core` 源码目录和设计文档一致
- 当前阶段必落目录都已形成真实实现落点
- CLI 到 `engine-core` 到 `workbench` 到 `result` 的闭环可跑
- 结果、事件、waiting state 具备基础正式语义
- 文档与进度追踪已同步更新

## 10. 关联文档

- `99_current_phase_scope_and_checklist.md`
- `08_current_phase_progress_tracking.md`
