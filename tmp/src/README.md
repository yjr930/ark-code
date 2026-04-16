# engine-core/src

engine-core 源码根目录。

## 设计目标

这一层是可程序化调用、状态驱动、支持 continuation/recovery 的执行内核。

## 当前结构

### 1. `core/`

- 职责：程序化调用面与运行状态
- 当前目录：`api/`、`state/`

### 2. `assembly/`

- 职责：上下文装配、prompt 编译、model loop
- 当前目录：`context/`、`prompt/`、`model-loop/`

### 3. `execution/`

- 职责：执行编排与本地工作区能力
- 当前目录：`workbench/`

### 4. `domains/`

- 职责：高级能力域
- 当前目录：`subagent/`

### 5. `semantics/`

- 职责：横切共享语义
- 当前目录：`events/`、`results/`

## 结构要求

- `planner` 是 policy 层，不能被做成与 `runner` 对称的重型模块
- `approval/memory/artifacts/results/events/hooks` 属于共享语义层
- `subagent/skills/mcp` 属于高级能力域
- 目录说明必须与真实代码位置一致

## 约定

- 各子目录 README 记录职责与当前状态
- 真实实现变化后同步更新 README
- attachment、continuation、output handoff、typed events 不能下沉为隐含逻辑
