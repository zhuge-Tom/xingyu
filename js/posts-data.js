/* ============================================================
   文章索引 posts-data.js
   全站唯一的文章元数据来源：搜索、归档、统计都读这里。
   新增文章时，按日期倒序在数组里加一条即可。
   url 一律相对于站点根目录。
   ============================================================ */
window.STAR_POSTS = [
  {
    title: "云算力平台(GPU)跑项目",
    date: "2025-12-30",
    tag: "AI",
    emoji: "🖥️",
    url: "posts/cloud-gpu.html",
    excerpt: "用云算力平台(GPU)跑项目——远程连接 / SSH。我使用的是 AutoDL 算力云，先无卡开机比直接开机便宜很多，配合 VS Code Remote-SSH 与 FileZilla 传输项目。",
  },
  {
    title: "博客 hugo 搭建和 github 常用指令",
    date: "2025-12-13",
    tag: "github",
    emoji: "🐙",
    url: "posts/hugo-github.html",
    excerpt: "hugo 使用主题搭建博客的步骤，并介绍了 github 的常见指令和自动部署。超过 100MB 的大文件需要通过 Git LFS 上传，注意默认 1GB 的存储限制。",
  },
  {
    title: "kali 渗透学习经历",
    date: "2025-11-27",
    tag: "linux",
    emoji: "🐉",
    url: "posts/kali-pentest.html",
    excerpt: "Kali Linux 是一个基于 Debian、专为网络安全和渗透测试设计的发行版。本文记录信息搜集阶段的 DNS 侦察、主机枚举、端口扫描、指纹与 WAF 识别常用工具。",
  },
  {
    title: "AI 大模型学习经历",
    date: "2025-11-20",
    tag: "AI",
    emoji: "🧠",
    url: "posts/ai-learning.html",
    excerpt: "致力于为全人类带来欢笑的 AI 主播 Neuro-sama，是多种专家模型集成的产物。从神经网络、超参数、训练核心循环到卷积神经网络的深度学习入门笔记。",
  },
  {
    title: "星空列车与白的旅行",
    date: "2025-11-20",
    tag: "cat",
    emoji: "🚂",
    url: "posts/starlight-train.html",
    excerpt: "黑猫会将迷途之人带向更好的路上去。划破夜空，飞驰在星空之下，美丽的星空在眼前展开，璀璨夺目，犹如熠熠生辉的宝石箱。",
  },
];
