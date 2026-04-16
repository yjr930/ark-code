# packages: workbench

## 1. 目标

提供 session 在真实工作区里完成工作的全部执行能力。

## 2. 子包

### `workbench/shell/`

#### 职责

- shell exec
- progress streaming
- foreground / background
- timeout / auto-background
- sandbox
- cwd / env / shell session
- stall watchdog

#### 建议文件

```text
shell/
  exec.ts
  session.ts
  progress.ts
  background.ts
  sandbox.ts
  validation.ts
  stall_watchdog.ts
```

### `workbench/files/`

#### 职责

- read text/image/pdf/notebook
- write
- stat/list
- path normalization
- read/write permission surface

#### 建议文件

```text
files/
  read.ts
  write.ts
  stat.ts
  list.ts
  path.ts
  permissions.ts
```

### `workbench/patch/`

#### 职责

- old/new string patch
- diff generation
- apply patch
- patch validation
- conflict detection

#### 建议文件

```text
patch/
  edit.ts
  apply_patch.ts
  diff.ts
  validation.ts
```

### `workbench/search/`

#### 职责

- grep
- glob
- code search
- truncation / pagination
- permission-aware observation

#### 建议文件

```text
search/
  grep.ts
  glob.ts
  code_search.ts
  limits.ts
```

### `workbench/process/`

#### 职责

- task registry
- local_bash / local_agent / remote_agent lifecycle
- output file
- task notification
- task output retrieval
- kill / cleanup
- summary / progress aggregation

#### 建议文件

```text
process/
  task_registry.ts
  shell_task.ts
  agent_task.ts
  remote_task.ts
  notifications.ts
  output.ts
  summary.ts
```

### `workbench/snapshot/`

#### 职责

- worktree create / cleanup / dirty check
- worktree visibility
- workspace snapshot

#### 建议文件

```text
snapshot/
  worktree.ts
  visibility.ts
  workspace_snapshot.ts
```

## 3. 设计要求

- shell、files、patch、search、process 必须独立建模
- 后台 bash 与 output handoff 必须是一等能力
- patch runtime 不能散在 files 或 bash 中
- process 层负责任务态与通知态，shell 层不直接承担全部任务生命周期
