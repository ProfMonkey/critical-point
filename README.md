# 临界点 · 公测版 v2.4

卡通连锁爆炸小游戏。29 个关卡、6 种模式、三场 Boss 战、新规则首次自动演示、好友分享和本地进度保存。

## 在线体验
在仓库 Settings → Pages 选择 Deploy from a branch → `pages-v24` / `/(root)` 后，网站才会正式开启。
游戏页面预期地址：`https://profmonkey.github.io/critical-point/`（启用并部署成功后验证）。

## 文件
- `index.html`：正式游戏入口
- `公测数据分析台.html`：测试者自愿分享的 JSON 报告离线汇总工具
- `manifest.webmanifest`：可安装网页应用的清单
- `sw.js`：离线缓存
- `assets/`：原创游戏图标

## 隐私及公测说明
不包含服务器端账号系统、在线排行榜或自动上传分析数据。玩家自行决定是否导出和分享自己的试玩报告。
从 file:// 迁移到 HTTPS 后，本地存档可能无法自动继承；可在旧版使用「进度保险箱」导出 JSON，再到新版导入。

## 发布说明
独立 `pages-v24` 分支用于静态网站部署，不改变 `main` 上的项目源码。
