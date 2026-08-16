# 开发环境规范

## 目标运行环境

- 服务端优先运行在 Linux 环境。
- 产品当前以 Web 端优先，桌面端与手机端后续再处理。

## 本地开发环境

本地开发优先使用 WSL，目录收敛在本工作目录。Windows 路径 `D:\workspace\arkcode\app` 在 WSL 内对应 `/mnt/d/workspace/arkcode/app`。

## WSL 安装与检查

当前本机可能尚未安装 WSL 发行版。安装步骤：

1. 在 Windows 终端运行 `wsl --install`。
2. 如果需要指定发行版，运行 `wsl --install -d Ubuntu`。
3. 重启后运行 `wsl -l -v` 检查是否安装成功。

安装完成后，应尽量在 WSL 内执行 `git`、`npm` 和项目启动命令，而不是在 Windows 原生环境中执行。

## 工具链

- Node.js 与 npm：版本在项目初始化后写入 `package.json` 的 `engines` 字段。
- Git：用于版本管理。
- Docker：后续用于服务端实例、容器化部署和 AI 工具沙箱。

## 目录映射

| Windows 路径 | WSL 路径 |
|---|---|
| `D:\workspace\arkcode\app` | `/mnt/d/workspace/arkcode/app` |
| `D:\workspace\arkcode\research` | `/mnt/d/workspace/arkcode/research` |

## 启动流程

项目初始化阶段先完成依赖安装和 Web 前端启动。正式启动命令在代码落地后写入项目脚本，并在此文档中补充。

## 密钥与配置

- API 密钥等敏感配置写入 `.env` 文件。
- `.env` 已通过 `.gitignore` 忽略，不得提交。
