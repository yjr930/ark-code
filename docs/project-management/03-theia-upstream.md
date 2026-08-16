# Theia 与 pi 上游代码关联规范

## 基本原则

Theia 项目应优先通过 npm 包（npm package）使用官方发布版本，不 fork 核心代码，不把上游仓库整体复制进本仓库。项目通过 Theia 扩展（extension）实现自有能力。

pi 也采用同样原则：通过 npm 包使用 `earendil-works/pi` 的发布版本，必要时用扩展或自定义工具接入。

## 版本固定

- `package.json` 中固定 Theia 与 pi 的精确版本。
- `package-lock.json` 必须提交，作为依赖版本的事实依据。
- 升级上游版本单独提交，并记录兼容性验证结果。

## 上游参考代码

需要阅读或对比 Theia 上游源码时，把上游仓库克隆到仓库外的参考目录，例如 `D:\workspace\arkcode\research\theia-upstream`。参考目录不进入本项目 Git。

命令示例：

```text
git clone https://github.com/eclipse-theia/theia.git research/theia-upstream
```

pi 的参考目录可以放在 `D:\workspace\arkcode\research\pi-upstream`。

## 发布节奏对齐

- Theia 每月发布一个版本，每季度发布一个社区版本。
- 项目应记录当前使用的 Theia 版本，并在升级时参考官方发布说明。
- 本项目当前 Theia 版本待首次安装依赖后记录。

## 需要修改上游时

优先向上游提交贡献。临时补丁按以下顺序处理：

1. 通过 npm 覆盖（override）或补丁工具记录补丁。
2. 把补丁放入仓库内的 `patches` 目录。
3. 在补丁文件顶部写清楚来源、原因和对应的上游问题编号。
4. 尽量避免长期维护自有 fork。

## 版本记录表

| 上游 | 当前版本 | 更新时间 | 备注 |
|---|---|---|---|
| Eclipse Theia | 待定 | 待定 | 首次安装后填写 |
| pi | 待定 | 待定 | 首次安装后填写 |
