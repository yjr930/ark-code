# 项目管理规范

## 目录

- [开发测试环境](#开发测试环境)
- [核心上游依赖管理](#核心上游依赖管理)

## 开发测试环境

项目当前阶段以桌面端为主，初步阶段先不开发 Web UI。

桌面端需要同时支持 Windows 和 macOS，优先验证 Windows 环境。

共享代码的开发和检查可以在 WSL 中进行。

Windows 桌面端的构建和验证在本机 Windows 环境中进行。

macOS 桌面端的构建和验证需要在单独的 macOS 主机上进行，本阶段不在本机执行。

## 核心上游依赖管理

### 管理原则

- 优先不改动上游项目的代码。
- 上游项目的版本先冻结（freeze），后续再单独设计依赖更新流程。
- 每个上游依赖都需要记录仓库地址、冻结版本、依赖形式和首次冻结时间。

### 上游依赖清单

| 上游项目 | 仓库地址 | 冻结版本 | 依赖形式 |
|---|---|---|---|
| theia | https://github.com/eclipse-theia/theia | 1.74.0 | npm 包（`@theia/*`） |
| pi | https://github.com/earendil-works/pi | 0.83.0 | npm 包（`@earendil-works/pi-coding-agent` 等） |

### 版本冻结与更新规则

- 冻结版本写入 `package.json` 和 `package-lock.json`。
- `package-lock.json` 必须提交到 Git。
- 升级前先验证兼容性，再单独提交升级记录。
- 升级记录需要包含：上游项目、升级前版本、升级后版本、升级原因、验证结果。
