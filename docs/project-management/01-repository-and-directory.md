# 仓库、目录、分支与提交规范

## 仓库信息

- 远程仓库：`yjr930/ark-code`
- 远程地址：`https://github.com/yjr930/ark-code.git`
- 默认分支：`main`
- 远程名称：`origin`

## 目录边界

本项目的工作根目录是 `D:\workspace\arkcode`。其中：

- `D:\workspace\arkcode\app` 是正式开发目录，也是 Git 仓库根目录。
- `D:\workspace\arkcode\research` 用于存放调研材料、临时记录等非正式内容，不进入 Git。
- `D:\workspace\arkcode\AGENTS.md` 是工作根目录的代理行为说明，不进入 Git。

正式开发目录之外的任何文件不得通过 `git init`、`git add` 或其他方式纳入仓库。正式开发目录内也应避免提交临时文件。

## 临时文件

临时文件应放入 `app/tmp`，该目录已通过 `.gitignore` 忽略。如果临时文件不适合放在仓库目录内，可以放在 `research` 或操作系统临时目录。

## 分支策略

- `main` 是稳定主分支。
- 功能开发使用 `feature/描述` 分支。
- 缺陷修复使用 `fix/描述` 分支。
- 合并回到 `main` 使用拉取请求（pull request），不直接推送提交。

## 提交规范

- 提交信息使用“类型: 描述”的格式，类型包括 `feat`、`fix`、`docs`、`refactor`、`test`、`chore`。
- 每次提交只处理一个逻辑改动。
- 提交前运行项目的本地检查命令，保证没有明显错误。

## 行尾与编码

- 文本文件统一使用 UTF-8 编码。
- 行尾由 `.gitattributes` 统一管理，脚本文件使用 LF。
