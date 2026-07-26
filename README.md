# 星屿 · 仰望星空的博客

一个纯静态、无构建工具的星空主题个人博客。深空渐变背景 + Canvas 三层视差星空（星座连线、流星、星云、星尘）+ 玻璃拟态卡片。

## 特性

- 🌌 Canvas 动态星空：三层视差、真实星座轮流点亮、随机流星、漂移星云、点击星尘爆发
- 🗺 星图页：12 个星座互动图鉴（按真实视星等绘制）
- 🔍 全站搜索（快捷键 `/`）、标签筛选、时间轴归档
- 📖 文章页：阅读进度条、目录、代码高亮 + 复制、图片灯箱、本地留言板「星际信笺」
- 🌠 首页彩蛋「许个愿」、页脚实时月相、访问统计
- 📱 PWA：可安装、可离线（Service Worker 缓存优先）
- ♿ 尊重 `prefers-reduced-motion`，键盘可访问

## 本地预览

纯静态站点，直接用浏览器打开 `index.html` 即可；或起一个本地服务器：

```bash
python -m http.server 8000
# 访问 http://localhost:8000
```

## 目录结构

```
index.html          首页
archive.html        归档
constellations.html 星图
friend.html         友链
about.html          关于
404.html            迷失在星海
posts/              文章
css/style.css       样式
js/                 stars.js（星空引擎+交互）/ posts-data.js（文章索引）/ constellations.js（星图）
images/posts/       文章配图
sw.js               Service Worker
manifest.webmanifest / icon.svg   PWA
feed.xml / sitemap.xml / robots.txt   订阅与 SEO
```

## 新增文章

1. 在 `posts/` 下新建 HTML（复制现有文章改内容即可）；
2. 在 `js/posts-data.js` 顶部按日期倒序加一条；
3. 在 `index.html` 文章网格加一张卡片；
4. 同步 `feed.xml`、`sitemap.xml`，并把新文件加进 `sw.js` 的 `ASSETS`（版本号 +1）。

---

© 2025-2026 星屿 · 朱歌 · 我们都是星尘，终将归于星海
