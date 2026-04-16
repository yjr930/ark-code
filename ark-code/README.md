# Ark Code

Ark Code 是一个融合 OpenCC engine core 执行闭环与 OpenCode server/CLI 承载能力的新项目。

当前仓库已完成第一阶段最小骨架：

- `apps/cli`：最小 CLI 入口
- `packages/engine-core`：session 执行主循环与 workbench 骨架
- `packages/server-host`：provider/runtime/persistence/ui 宿主骨架
- `packages/bridge`：core 与 host 之间的协议类型
- `docs/pre-design`：前置设计
- `docs/design`：随工程演进同步更新的实际设计文档

## 开发阶段目录策略

开发阶段所有配置、测试沙盒、调试输出、状态文件都放在仓库内：

- 默认家目录：`ark-code/.arkcode-dev/home`
- 可通过 `ARKCODE_HOME` 覆盖
- 默认 provider 模式：`mock`

## 当前可用命令

```bash
pnpm install
pnpm build
pnpm dev:run -- "create sample file"
```

执行后会在 `.arkcode-dev/home` 下生成状态目录，在工作目录下按 mock provider 行为生成输出文件。
