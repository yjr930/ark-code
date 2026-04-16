# engine-core 蓝图总览

## 1. 目标

Ark Code `engine-core` 是一个可程序化调用的执行内核，负责在单个 session 内完成完整工作闭环。

它必须同时满足两类约束：

- 工程模块边界完整
- 运行时闭环完整

## 2. 核心原则

- 所有 session 内完整工作能力都属于 `engine-core`
- `engine-core` 只依赖抽象端口，不依赖具体 provider、数据库、HTTP 宿主、UI
- attachment、continuation、output handoff、typed events 必须是一等公民
- patch runtime、approval runtime、subagent runtime、MCP runtime 不能隐含散落在工具实现里

## 3. 目标层级包图

```text
packages/engine-core/src/
  core/
    api/
    session/
    state/
  assembly/
    context/
    prompt/
    model-loop/
  execution/
    runner/
    planner/
    workbench/
  domains/
    subagent/
    skills/
    mcp/
  semantics/
    approval/
    memory/
    artifacts/
    results/
    events/
    hooks/
```

说明：

- `core/`：骨架层
- `assembly/`：推理装配层
- `execution/`：执行编排层
- `domains/`：高级能力域层
- `semantics/`：横切共享语义层

## 4. 运行时主链

```text
入口 / 候选发现
  -> context / prompt / request 装配
  -> model-loop / tool round / workbench 执行
  -> waiting / background / continuation / output handoff
  -> next turn / resume / result surface
```

## 5. 文档导航

- 包设计：见 `packages/`
- 运行时主链：见 `runtime/`
- 状态与协议：见 `contracts/`
