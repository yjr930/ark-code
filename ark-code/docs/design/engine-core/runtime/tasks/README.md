# runtime/tasks 模块设计

## 0. 模块定位

`runtime/tasks/` 负责 Ark Code `engine-core` 的后台任务模型。

它描述的不是操作系统进程本身，而是 session 内可被跟踪、读取、终止、通知的异步执行单元。

---

## 1. 职责与要求

### 职责

- 定义 task type / task status
- 维护 task registry
- 启动 shell task 或其他异步任务
- 停止任务
- 读取任务输出
- 向 event / notification 层投影任务状态变化

### 要求

- task 必须有统一 id、状态、输出文件、通知状态
- 所有 task type 都走统一 registry
- task 状态要和 transcript / notification / result 语义兼容

---

## 2. 下属文件规划

```text
tasks/
  registry.ts
  task-state.ts
  spawn-shell-task.ts
  stop-task.ts
  read-task-output.ts
```

### 2.1 registry.ts

职责：

- 注册 task type 到其实现

定义内容：

- `getTaskByType()`
- `registerTaskRuntime()`
- `listTaskRuntimes()`

OpenCC 参照代码：

- `opencc/src/tasks.ts`

### 2.2 task-state.ts

职责：

- 定义任务核心状态模型

定义内容：

- `TaskType`
- `TaskStatus`
- `TaskStateBase`
- `TaskContext`
- `generateTaskId()`
- `isTerminalTaskStatus()`

OpenCC 参照代码：

- `opencc/src/Task.ts`

### 2.3 spawn-shell-task.ts

职责：

- 启动本地 shell task

定义内容：

- `spawnShellTask()`
- `backgroundShellTask()`
- `foregroundShellTask()`

逻辑要求：

- shell task 是第一阶段最重要的任务类型
- 要和 Bash 工具、任务输出、stop-task 语义兼容

OpenCC 参照代码：

- `opencc/src/tasks/LocalShellTask/LocalShellTask.tsx`

### 2.4 stop-task.ts

职责：

- 终止运行中的任务

定义内容：

- `stopTask(taskId, context)`
- `buildStopTaskError()`

逻辑要求：

- 先校验 task 是否存在、是否 running，再 dispatch 到具体 task impl

OpenCC 参照代码：

- `opencc/src/tasks/stopTask.ts`

### 2.5 read-task-output.ts

职责：

- 读取任务输出

定义内容：

- `readTaskOutput(taskId, options)`
- `readTaskOutputRange()`
- `readTaskOutputTail()`

逻辑要求：

- 输出读取必须基于统一 output file / offset 模型

OpenCC 参照代码：

- `opencc/src/tools/TaskOutputTool/TaskOutputTool.tsx`
- `opencc/src/utils/task/diskOutput.js`

---

## 3. 对 OpenCC 的对齐要求

Ark Code 的 task runtime 要对齐 OpenCC `Task.ts`、`tasks.ts`、`LocalShellTask`、`stopTask.ts` 的统一任务模型，不把 task 简化成“一个裸后台进程句柄”。
