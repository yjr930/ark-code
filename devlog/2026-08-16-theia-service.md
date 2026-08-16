# Theia service 部署记录

日期：2026-08-16

## 目标

获取 Theia 相关代码，在 WSL 中部署 Theia service，并通过本机 Web UI 访问。

## 环境

- 操作系统：Ubuntu 26.04 LTS，WSL 2
- Node.js：v24.19.0
- npm：11.17.0
- Theia：v1.74.0

## 步骤

1. 使用 nvm 安装 Node.js LTS。
2. 使用 root 权限安装编译依赖：`build-essential`、`pkg-config`、`python3`、`libx11-dev`、`libxkbfile-dev`、`libsecret-1-dev`、`libkrb5-dev`。
3. 浅克隆 Theia v1.74.0 到 WSL 用户目录 `~/theia`。
4. 使用 `npm ci` 安装依赖；设置 `PUPPETEER_SKIP_DOWNLOAD=1` 和 `PUPPETEER_SKIP_CHROME_DOWNLOAD=1`，跳过浏览器下载。
5. 使用 `npm run build:browser` 构建浏览器示例。
6. 使用 `npm run start -- --hostname=0.0.0.0` 启动服务。
7. 在 Windows 用户目录创建 `.wslconfig`，设置 `networkingMode=mirrored`，并执行 `wsl --shutdown` 后重新启动 WSL。
8. 通过 Windows 访问 `http://192.168.31.48:3000/`，返回 HTTP 200。

## 结果

- Theia service 监听 `0.0.0.0:3000`。
- WSL 内访问正常。
- Windows 通过本机局域网地址 `192.168.31.48:3000` 访问正常。

## 问题与决策

- 在 `/mnt/d` 下克隆 Theia 时出现 chmod 权限错误，因此把 Theia 代码放在 WSL 用户目录 `~/theia`。
- Puppeteer 安装时下载浏览器失败，通过环境变量跳过浏览器下载。
- Windows 无法通过 `127.0.0.1:3000` 访问，使用 WSL 的镜像网络模式后，通过本机局域网地址访问成功。

## 后续行动

- 确认 Theia service 的稳定启动方式。
- 验证 Web UI 的基础面板功能。
- 规划如何接入 pi agent。
