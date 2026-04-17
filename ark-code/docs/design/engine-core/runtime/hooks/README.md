# runtime/hooks 模块设计

## 0. 模块定位

`runtime/hooks/` 负责 engine-core 在执行过程中的 hooks 语义。

这些 hooks 是 session 内部执行流程的一部分，不是宿主随意调用的普通函数集合。

---

## 1. 职责与要求

### 职责

- 注册 session hooks
- 在固定执行点触发 hooks
- 管理 hook 生命周期清理
- 把 hook 结果反馈回 query / tool runtime

### 要求

- hook 触发点必须稳定
- hook 结果必须可影响执行流程
- hooks 自身不能破坏 transcript / task / result 语义

---

## 2. 下属文件规划

```text
hooks/
  runtime.ts
  session-hooks.ts
```

### 2.1 runtime.ts

职责：

- 执行 hook 触发逻辑

定义内容：

- `runSetupHooks()`
- `runSessionStartHooks()`
- `runUserPromptSubmitHooks()`
- `runPreToolUseHooks()`
- `runPostToolUseHooks()`
- `runStopHooks()`

OpenCC 参照代码：

- `opencc/src/query.ts`
- `opencc/src/hooks/*`

### 2.2 session-hooks.ts

职责：

- 管理 session 级 hook 注册与清理

定义内容：

- `registerSessionHooks()`
- `clearSessionHooks()`
- `getSessionHooks()`

OpenCC 参照代码：

- `opencc/src/QueryEngine.ts`
- `opencc/src/hooks/*`

---

## 3. 对 OpenCC 的对齐要求

Ark Code `runtime/hooks` 要对齐 OpenCC 中 hooks 作为 query/tool 执行流程内嵌阶段的语义，不能把 hook 降级成独立外围插件系统。
