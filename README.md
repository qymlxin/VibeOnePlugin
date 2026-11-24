# VibeOne 插件

四个可独立安装、更新和停用的工作区插件。运行时代码在各自目录，桌面不静态导入这些实现。

| 目录 | 插件 ID | 功能 | 配置项（`configSchema`） |
| --- | --- | --- | --- |
| `files` | `dev.vibeone.files` | 目录树、代码预览、保存文本产物 | 默认展开路径、默认显示目录树 |
| `changes` | `dev.vibeone.changes` | Git 差异与变更树 | 默认显示变更文件列表 |
| `terminal` | `dev.vibeone.terminal` | 交互 Shell | 字号、历史回滚行数、光标闪烁 |
| `browser` | `dev.vibeone.browser` | 独立 Chromium 网页预览 | 默认首页地址 |

## 安装

在支持独立工作区插件的 VibeOne 中打开「设置 → 插件 → 发现插件」，输入本仓库地址并点击「解析仓库」。桌面自动列出四个插件，勾选所需插件、确认权限和授权工作目录后，可一次批量安装或更新；若在「本地安装」检查单独插件目录，宿主的插件中心会根据各插件的 `configSchema` 自动渲染表单配置项。

`dist/app.mjs` 已提交，下载安装不需要 npm、编译插件或重新构建桌面；下载使用 Git。私有仓库可使用本机已配置的 Git SSH 认证。插件作为可信本机 JS 运行，请只安装信任的代码。

## 开发与校验

需要 Node.js 22+：

```sh
npm ci
npm run build
# 仅构建一个插件
node scripts/build.mjs files
```

构建后可使用 VibeOne 主仓库的清单校验脚本检查所有插件包的合法性与产物完整性：

```sh
node /path/to/VibeOne/scripts/validate-plugin.mjs ./files ./changes ./terminal ./browser
```

修改插件版本后提交对应源码、`plugin.json` 及自包含构建产物 `dist/app.mjs`。ESM 包内自带 UI、CSS 和第三方依赖，React 与 `@vibeone/plugin-sdk` 由宿主共享，不会与桌面端 React Context 冲突。

## SDK 接口

- `app.panel` + `surface: workspace.tool` 注册面板，生命周期由 `ctx.scope` 管理。
- `ctx.config`：读取用户通过 `configSchema` 表单或 JSON 保存的插件配置。
- `ctx.services.workbench.snapshot/subscribe/request`：订阅授权会话、读取目录/代码/变更、保存文本产物。
- `ctx.services.ui` / `ctx.services.composer`：可选宿主交互能力（通知提示、切换扩展面板、获取主题、插入对话输入框）。
- `ctx.services.desktop`：声明并授权后使用 PTY 或浏览器原语。Electron 主进程继续持有原生资源。
- `AppPanelProps` 提供 `sessionId`、`workspaceId`、`theme`、`params`、`fileTarget`、`visible`、`onTitle` 与 `onNavigate` 等属性。
