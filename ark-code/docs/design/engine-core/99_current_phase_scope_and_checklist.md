# 当前阶段范围与核对清单

## 1. 当前阶段目标

当前阶段要把 `engine-core` 的主链能力设计完整，并服务第一条工程闭环：

```text
CLI -> server-host -> bridge -> engine-core -> workbench -> result
```

当前阶段优先支撑 `mock provider`。完整目标蓝图中的其他能力，需要保留位置与边界。

## 2. 当前阶段必落

### 2.1 骨架与装配

- [ ] `src/core/api/`：session 启动、恢复、step、snapshot 的统一调用面
- [ ] `src/core/session/`：session identity 与生命周期
- [ ] `src/core/state/`：turn state、queued items、continuation reason、terminal result
- [ ] `src/assembly/context/`：context assembly 与 attachment 注入位
- [ ] `src/assembly/prompt/`：system prompt 编译与优先级链
- [ ] `src/assembly/model-loop/`：request / streaming / retry / fallback 结构

### 2.2 执行与 workbench

- [ ] `src/execution/runner/`：tool orchestration 与 follow-up turn 推进
- [ ] `src/execution/workbench/shell/`
- [ ] `src/execution/workbench/files/`
- [ ] `src/execution/workbench/patch/`
- [ ] `src/execution/workbench/search/`
- [ ] `src/execution/workbench/process/`

### 2.3 横切语义

- [ ] `src/semantics/approval/`：waiting state 与 permission 基础模型
- [ ] `src/semantics/results/`：result handoff、queued result、continuation surface
- [ ] `src/semantics/events/`：typed event 与 task-notification 事件模型

## 3. 当前阶段保留接口

- [ ] `src/execution/planner/`：coordinator / orchestration policy 接入位
- [ ] `src/execution/workbench/snapshot/`：workspace snapshot / worktree 视图
- [ ] `src/domains/subagent/`：subagent lifecycle 与 sidechain transcript 接入位
- [ ] `src/domains/skills/`：skill registry、listing、activation 接入位
- [ ] `src/domains/mcp/`：config / auth / session / discovery / invoke / elicitation / recovery 子域结构
- [ ] `src/semantics/memory/`：memory recall / session memory / compaction 接口
- [ ] `src/semantics/artifacts/`：artifact 语义与持久化接口
- [ ] `src/semantics/hooks/`：hook registration 与 stop gate 接入位

## 4. 当前明确不展开

- [ ] full MCP runtime 细节实现
- [ ] background subagent 全链路
- [ ] long-term memory 完整体系
- [ ] eval dashboard
- [ ] 宿主层 UI、provider transport、存储与回放实现

## 5. 核对清单

### 5.1 结构核对

- [ ] `docs/design/README.md` 已导航到 `docs/design/engine-core/README.md`
- [ ] `docs/design/engine-core/README.md` 已导航全部分文档
- [ ] 五层结构在文档集内部保持一致

### 5.2 语义核对

- [ ] `patch` 已单独成域
- [ ] `events` 已单独成域
- [ ] `results` 已覆盖 output handoff
- [ ] `approval` 已覆盖 waiting state
- [ ] `context` 已覆盖 attachment 装配

### 5.3 边界核对

- [ ] `server-host` 与 `bridge` 的宿主职责没有写入 `engine-core`
- [ ] `subagent`、`skills`、`mcp` 作为能力域保留目标位置
- [ ] 当前阶段未展开能力已明确标注为保留接口或暂不展开

### 5.4 闭环核对

- [ ] 每类关键能力都能回答：如何进入系统、如何被装配、如何执行、如何等待、如何 continuation、如何回流
- [ ] 文档已覆盖 `99_gap_checklist.md` 的主要能力组
- [ ] 文档已覆盖 `99_verification_matrix.md` 的运行时闭环视角

## 6. 参考输入

- `ark-code/docs/pre-design/engine-core/engine-core-inventory/opencc-engine-core/99_gap_checklist.md`
- `ark-code/docs/pre-design/engine-core/runtime-loop-inventory/opencc-runtime-loop/99_verification_matrix.md`
- `ark-code/docs/pre-design/overall_design_base.md`
