# Ark Code 当前工程架构

## 1. 文档目的

本文档记录 `ark-code/` 当前已经实际落地的工程结构，用于和 `docs/pre-design/overall_design_base.md` 的前置设计对应。

当前实现遵循一个原则：

- 先落第一阶段最小闭环
- 先把 core / host / bridge 的边界搭出来
- 先保证所有开发期配置、状态、沙盒、调试输出都收敛在 `ark-code/` 内

## 2. 当前目录结构

```text
ark-code/
  CLAUDE.md
  README.md
  apps/
    README.md
    cli/
      README.md
      src/
        index.ts
  docs/
    README.md
    pre-design/
      overall_design_base.md
    design/
      current_architecture.md
  packages/
    README.md
    bridge/
      README.md
      src/
        README.md
        index.ts
        model_port.ts
        user_port.ts
        host_port.ts
        core_state_codec.ts
        provider_chunk_normalizer.ts
        core_event_to_bus_event.ts
    engine-core/
      README.md
      src/
        README.md
        index.ts
        api/
          engine.ts
          types.ts
        state/
          session_state.ts
          run_state.ts
          turn_state.ts
        context/
          context_assembler.ts
        prompt/
          prompt_compiler.ts
        model-loop/
          model_loop.ts
          chunk_reducer.ts
        workbench/
          README.md
          shell/
            session.ts
            exec.ts
          files/
            read.ts
            write.ts
          patch/
            apply_patch.ts
        results/
          final_result.ts
        events/
          types.ts
    server-host/
      README.md
      src/
        README.md
        index.ts
        runtime/
          core_run_controller.ts
        provider/
          model_port_adapter.ts
          mock_provider.ts
          replay_provider.ts
          live_provider.ts
        persistence/
          core_checkpoint.sql.ts
          run_projection.sql.ts
        ui/
          core_run_projection.ts
```

## 3. 已落地的模块职责

### 3.1 `packages/bridge`

当前负责定义 core 与 host 之间的最小协议边界：

- `model_port.ts`：统一模型输入输出协议
- `user_port.ts`：审批、输入、事件发布协议
- `host_port.ts`：session/load/checkpoint/event/artifact 协议
- `core_state_codec.ts`：core 状态编解码
- `core_event_to_bus_event.ts`：core event 投影

当前状态：

- 仅实现第一阶段所需最小类型
- 尚未细化 checkpoint mapping / artifact projection / MCP host port / skill store port

### 3.2 `packages/engine-core`

当前负责 session 内单次执行闭环：

- `api/engine.ts`：`startSession` / `resumeSession` / `step` / `snapshot` / `cancel`
- `state/`：session/run/turn 状态对象
- `context/context_assembler.ts`：把 session 状态与目录信息组装成模型请求
- `prompt/prompt_compiler.ts`：当前先保持 passthrough
- `model-loop/`：归约 provider chunk，提取文本与 action
- `workbench/`：执行文件读写、简单 patch、shell 命令
- `results/`：生成最终结果对象

当前状态：

- 已支持内存态 session 与单次 step
- 已支持 `read-file` / `write-file` / `apply-patch` / `exec-command`
- 尚未加入 planner、runner、subagent、MCP、skills、memory

### 3.3 `packages/server-host`

当前负责宿主能力：

- `runtime/core_run_controller.ts`：
  - 建立开发期 workspace layout
  - 解析 Ark home 目录
  - 托管 `HostPort` / `UserPort`
  - 调用 `engine-core`
- `provider/`：
  - `model_port_adapter.ts` 选择 provider mode
  - `mock_provider.ts` 提供第一阶段最小模型输出
  - `replay_provider.ts` 预留回放能力
  - `live_provider.ts` 预留真实 provider 能力
- `persistence/`：
  - 把 checkpoint 与 run events 落盘到本地文件
- `ui/core_run_projection.ts`：
  - 把执行结果渲染为 CLI 输出文本

当前状态：

- 已支持 `mock` provider 模式
- 还未接 HTTP/SSE/WS runtime、provider registry、正式数据库存储

### 3.4 `apps/cli`

当前负责：

- 读取命令行消息
- 读取 `ARKCODE_HOME`
- 读取 `ARKCODE_PROVIDER_MODE`
- 触发一次最小 run
- 把结果打印到 stdout

## 4. 开发阶段目录策略

Ark Code 的家目录语义保留为可配置目录，默认目标语义是未来的 `~/.arkcode`，但当前开发阶段不使用工作目录外路径。

当前默认布局：

```text
ark-code/.arkcode-dev/home/
  config/
  sandbox/
  artifacts/
  debug/
  state/
```

对应实现位置：

- `packages/server-host/src/runtime/core_run_controller.ts`

当前规则：

- 默认家目录：`ark-code/.arkcode-dev/home`
- 可通过 `ARKCODE_HOME` 覆盖
- 该目录覆盖配置、沙盒、产物、调试、状态输出

## 5. 与前置设计的对应关系

### 已落地

- `apps/cli`
- `packages/bridge`
- `packages/engine-core` 的最小骨架
- `packages/server-host` 的最小骨架
- 开发阶段家目录与状态目录策略

### 暂未落地

- planner / runner
- subagent / handoff
- full MCP runtime
- full skill runtime
- long-term memory
- replay / observability / evaluation 完整体系
- Web / HTTP / SSE / WS runtime

## 6. 当前最小闭环

当前已跑通的预期链路是：

```text
CLI input
  -> server-host runtime
  -> engine-core startSession
  -> context assembly
  -> model-loop (mock provider)
  -> workbench action execution
  -> checkpoint/event persistence
  -> CLI projection output
```

mock provider 当前可根据 prompt 中是否包含 `create sample file` 决定是否触发 `write-file` action。

## 7. 下一步建议

下一步优先顺序建议：

1. 为 workbench 增加路径边界约束，确保默认不写出 `ark-code/` 工作区
2. 将 `exec-command` 的运行目录与 sandbox 目录关联起来
3. 为 checkpoint / event persistence 增加更清晰的 schema 抽象
4. 补 `replay provider` 的文件化回放入口
5. 开始拆分更正式的 planner / runner 边界
