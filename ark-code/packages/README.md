# packages

核心包目录。

## 当前子目录

- `bridge/`：core 与 host 之间的协议边界
- `engine-core/`：session 内执行闭环
- `server-host/`：runtime/provider/persistence/ui 宿主层

## 约定

- 核心能力优先在 `packages/` 下沉淀，再由 `apps/` 调用。
- 每个包维护自己的中文 `README.md`。
