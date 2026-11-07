# VibeOne 插件

四个可独立安装、更新和停用的工作区插件。运行时代码在各自目录，桌面不静态导入这些实现。

| 目录 | 插件 ID | 功能 |
| --- | --- | --- |
| `files` | `dev.vibeone.files` | 目录树、代码预览、保存文本产物 |
| `changes` | `dev.vibeone.changes` | Git 差异与变更树 |
| `terminal` | `dev.vibeone.terminal` | 交互 Shell |
| `browser` | `dev.vibeone.browser` | 独立 Chromium 网页预览 |

## 安装

在支持独立工作区插件的 VibeOne 中打开「设置 → 插件」，输入本仓库地址及上表中的目录，例如 `files`。点击「下载并检查」，选择授权工作目录并信任后安装。四个目录需要分别安装。

`dist/app.mjs` 已提交，下载安装不需要 npm、编译插件或重新构建桌面；下载使用 Git。私有仓库可使用本机已配置的 Git SSH 认证。插件作为可信本机 JS 运行，请只安装信任的代码。

每个包使用相同 `plugin.json`、Host prepare/commit 和 AppRuntime 加载机制。更新时重新下载同一仓库目录并检查；成功提交后切换代次，失败保留旧代次。设置的开关直接停用/启用已授权安装版本。

## 开发

需要 Node.js 22+：

```sh
npm ci
npm run build
# 仅构建一个插件
node scripts/build.mjs files
```

修改插件版本后提交对应源码、清单及 `dist/app.mjs`。ESM 包内自带 UI、CSS 和第三方依赖，React 由宿主共享以保证 Hooks 一致。包没有从 VibeOne 桌面源码导入实现。`scripts/build.mjs` 只用于构建，不参与运行。

## SDK 接口

- `app.panel` + `surface: workspace.tool` 注册面板，生命周期由 `ctx.scope` 管理。
- `ctx.services.workbench.snapshot/subscribe/request`：订阅授权会话、读取目录/代码/变更、保存文本产物。
- `ctx.services.desktop`：声明并授权后使用 PTY 或浏览器原语。Electron 主进程继续持有原生资源。
- `AppPanelProps` 提供 `sessionId`、`workspaceId`、文件目标、可见状态和标题回调，不注入 Host token 或内部 React 组件。

独立插件更新无需重建桌面；新增 SDK 原生能力仍需要更新宿主版本。文件/差异和文件树使用 `@pierre/diffs`、`@pierre/trees`；终端使用 xterm。构建包保留第三方许可证注释。
