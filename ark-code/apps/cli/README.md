# apps/cli

Ark Code 的第一阶段 CLI 入口。

## 职责

- 解析命令行输入
- 解析运行目录与 `ARKCODE_HOME`
- 调用 `server-host` 发起一次最小 run
- 把结果打印到终端

## 主要文件

- `src/index.ts`：CLI 启动入口

## 当前状态

- 已支持 mock provider 模式启动最小闭环
- 暂未接入完整命令系统、交互式 UI、会话恢复
