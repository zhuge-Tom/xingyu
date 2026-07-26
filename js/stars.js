/* ============================================================
   星空引擎 stars.js
   Canvas 三层视差星空：闪烁星星 + 随机流星 + 鼠标视差 + 星云光晕
   ============================================================ */
(function () {
  "use strict";

  const canvas = document.getElementById("sky");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, dpr = 1;
  let stars = [];
  let meteors = [];
  let sparks = [];   // 点击星尘爆发
  let dust = [];     // 鼠标星尘尾迹
  let lastDust = 0;
  let mouseX = 0, mouseY = 0;      // 鼠标偏移（-1 ~ 1）
  let curX = 0, curY = 0;          // 平滑跟随的当前偏移

  const LAYERS = [
    { count: 0.00018, size: [0.4, 0.9], speed: 6,  alpha: [0.3, 0.7] },  // 远景
    { count: 0.00010, size: [0.8, 1.5], speed: 14, alpha: [0.4, 0.9] },  // 中景
    { count: 0.00005, size: [1.4, 2.4], speed: 26, alpha: [0.6, 1.0] },  // 近景
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------------- 背景星座 ---------------- */
  // stars: 图形内部归一化坐标；anchor: 相对屏幕位置；scale: 相对 min(W,H) 的比例
  const CONSTELLATIONS = [
    {
      name: "北斗七星",
      anchor: [0.14, 0.16], scale: 0.20,
      stars: [[0.80, 0.30], [0.76, 0.52], [0.60, 0.56], [0.62, 0.36], [0.46, 0.40], [0.32, 0.46], [0.16, 0.58]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
    },
    {
      name: "仙后座",
      anchor: [0.72, 0.08], scale: 0.14,
      stars: [[0.05, 0.55], [0.28, 0.20], [0.50, 0.50], [0.72, 0.25], [0.95, 0.45]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
    },
    {
      name: "夏季大三角",
      anchor: [0.58, 0.50], scale: 0.26,
      stars: [[0.25, 0.10], [0.85, 0.35], [0.35, 0.90]],
      lines: [[0, 1], [1, 2], [2, 0]],
    },
    {
      name: "猎户座",
      anchor: [0.08, 0.60], scale: 0.20,
      stars: [[0.30, 0.16], [0.66, 0.20], [0.56, 0.48], [0.48, 0.52], [0.40, 0.56], [0.34, 0.86], [0.70, 0.82]],
      lines: [[0, 1], [0, 4], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [5, 6]],
    },
    {
      name: "天蝎座",
      anchor: [0.68, 0.58], scale: 0.20,
      stars: [[0.20, 0.10], [0.34, 0.30], [0.42, 0.48], [0.44, 0.66], [0.54, 0.82], [0.68, 0.86], [0.78, 0.74]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
    },
    {
      name: "天鹅座",
      anchor: [0.40, 0.10], scale: 0.16,
      stars: [[0.50, 0.05], [0.50, 0.50], [0.50, 0.95], [0.14, 0.32], [0.86, 0.62]],
      lines: [[0, 1], [1, 2], [3, 1], [1, 4]],
    },
    {
      name: "南十字座",
      anchor: [0.80, 0.70], scale: 0.10,
      stars: [[0.50, 0.05], [0.50, 0.95], [0.10, 0.45], [0.90, 0.55]],
      lines: [[0, 1], [2, 3]],
    },
  ];
  const CYCLE = 8;     // 每个星座轮流点亮的周期（秒）
  let constPts = [];   // 换算成像素后的各星座坐标

  /* ---------------- 漂移星云 ---------------- */
  const NEBULAE = [
    { x: 0.25, y: 0.30, r: 0.32, hue: 258, drift: 0.05, phase: 0 },
    { x: 0.75, y: 0.18, r: 0.26, hue: 210, drift: 0.04, phase: 2.1 },
    { x: 0.60, y: 0.80, r: 0.30, hue: 320, drift: 0.03, phase: 4.4 },
  ];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
    buildConstellations();
    buildNebulae();
  }

  function buildStars() {
    stars = [];
    LAYERS.forEach(function (layer, li) {
      const n = Math.round(W * H * layer.count);
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: rand(layer.size[0], layer.size[1]),
          baseAlpha: rand(layer.alpha[0], layer.alpha[1]),
          twinkleSpeed: rand(0.5, 2.2),
          twinklePhase: Math.random() * Math.PI * 2,
          layer: li,
          parallax: layer.speed,
          // 少量彩色星星：淡蓝 / 淡金
          hue: Math.random() < 0.08 ? (Math.random() < 0.5 ? 210 : 45) : null,
        });
      }
    });
    window.__starCount = stars.length;  // 供首页统计条读取
  }

  function buildConstellations() {
    const s = Math.min(W, H);
    constPts = CONSTELLATIONS.map(function (c) {
      return c.stars.map(function (p) {
        return [c.anchor[0] * W + p[0] * s * c.scale, c.anchor[1] * H + p[1] * s * c.scale];
      });
    });
  }

  // 星云预渲染成离屏贴图：每帧只做 3 次 drawImage，避免逐帧计算径向渐变
  let nebSprites = [];
  function buildNebulae() {
    nebSprites = NEBULAE.map(function (n) {
      const r = Math.max(2, n.r * Math.min(W, H));
      const c = document.createElement("canvas");
      c.width = c.height = Math.ceil(r * 2);
      const g = c.getContext("2d");
      const grad = g.createRadialGradient(r, r, 0, r, r, r);
      grad.addColorStop(0, "hsla(" + n.hue + ", 70%, 62%, 0.07)");
      grad.addColorStop(1, "hsla(" + n.hue + ", 70%, 62%, 0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, c.width, c.height);
      return { c: c, r: r };
    });
  }

  function drawNebulae() {
    const nt = reduceMotion ? 0 : t;
    for (let i = 0; i < NEBULAE.length; i++) {
      const n = NEBULAE[i], s = nebSprites[i];
      if (!s) continue;
      const cx = n.x * W + Math.sin(nt * n.drift + n.phase) * 40;
      const cy = n.y * H + Math.cos(nt * n.drift * 0.8 + n.phase) * 30;
      ctx.drawImage(s.c, cx - s.r, cy - s.r);
    }
  }

  function drawConstellations() {
    const idx = Math.floor(t / CYCLE) % CONSTELLATIONS.length;
    const glow = reduceMotion ? 0.45 : Math.sin(Math.PI * ((t % CYCLE) / CYCLE));
    CONSTELLATIONS.forEach(function (c, ci) {
      const pts = constPts[ci];
      if (!pts) return;
      const hot = ci === idx;
      const a = hot ? 0.10 + 0.5 * glow : 0.10;
      const px = curX * 14, py = curY * 14;  // 与中景星星同步视差

      ctx.strokeStyle = "rgba(150, 175, 255, " + a + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      c.lines.forEach(function (l) {
        ctx.moveTo(pts[l[0]][0] + px, pts[l[0]][1] + py);
        ctx.lineTo(pts[l[1]][0] + px, pts[l[1]][1] + py);
      });
      ctx.stroke();

      for (let i = 0; i < pts.length; i++) {
        ctx.beginPath();
        ctx.arc(pts[i][0] + px, pts[i][1] + py, hot ? 2.2 : 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(220, 230, 255, " + Math.min(1, a + 0.25) + ")";
        ctx.fill();
      }

      if (hot && glow > 0.15) {
        ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = "rgba(200, 215, 255, " + glow * 0.9 + ")";
        ctx.fillText("✦ " + c.name, pts[0][0] + px + 12, pts[0][1] + py - 12);
      }
    });
  }

  /* ---------------- 流星 ---------------- */
  function spawnMeteor(force) {
    // 后台标签页 rAF 停摆但 setTimeout 仍在跑，避免流星越攒越多
    if (!force && (document.hidden || meteors.length > 8)) return;
    const fromLeft = Math.random() < 0.5;
    meteors.push({
      x: rand(W * 0.1, W * 0.9),
      y: rand(-40, H * 0.25),
      len: rand(120, 240),
      speed: rand(9, 16),
      angle: fromLeft ? rand(Math.PI * 0.15, Math.PI * 0.3)
                      : Math.PI - rand(Math.PI * 0.15, Math.PI * 0.3),
      life: 1,
      decay: rand(0.008, 0.015),
    });
  }

  function scheduleMeteor() {
    if (!reduceMotion) spawnMeteor();
    setTimeout(scheduleMeteor, rand(3000, 9000));
  }

  // 手动触发一场流星雨（供「许个愿」按钮调用）
  window.__meteorShower = function (count) {
    if (reduceMotion) return;
    for (let i = 0; i < (count || 10); i++) {
      setTimeout(function () { spawnMeteor(true); }, i * 240 + Math.random() * 180);
    }
  };

  /* ---------------- 绘制 ---------------- */
  let t = 0;
  function draw() {
    t += 0.016;
    ctx.clearRect(0, 0, W, H);

    // 鼠标视差平滑跟随
    curX += (mouseX - curX) * 0.04;
    curY += (mouseY - curY) * 0.04;

    drawNebulae();
    drawConstellations();

    // 星星
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = reduceMotion ? 1
        : 0.65 + 0.35 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
      const a = s.baseAlpha * tw;
      const px = s.x + curX * s.parallax;
      const py = s.y + curY * s.parallax;

      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.hue !== null
        ? "hsla(" + s.hue + ", 80%, 82%, " + a + ")"
        : "rgba(255,255,255," + a + ")";
      ctx.fill();

      // 近景大星星加一点光晕十字
      if (s.layer === 2 && s.r > 1.9) {
        ctx.strokeStyle = "rgba(255,255,255," + a * 0.35 + ")";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(px - s.r * 3, py); ctx.lineTo(px + s.r * 3, py);
        ctx.moveTo(px, py - s.r * 3); ctx.lineTo(px, py + s.r * 3);
        ctx.stroke();
      }
    }

    // 流星
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      const dx = Math.cos(m.angle) * m.speed;
      const dy = Math.sin(m.angle) * m.speed;
      m.x += dx; m.y += dy;
      m.life -= m.decay;
      if (m.life <= 0 || m.y > H + 50 || m.x < -260 || m.x > W + 260) {
        meteors.splice(i, 1);
        continue;
      }
      const tailX = m.x - Math.cos(m.angle) * m.len;
      const tailY = m.y - Math.sin(m.angle) * m.len;
      const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      grad.addColorStop(0, "rgba(255,255,255," + 0.9 * m.life + ")");
      grad.addColorStop(0.3, "rgba(180,200,255," + 0.4 * m.life + ")");
      grad.addColorStop(1, "rgba(180,200,255,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      // 流星头部亮点
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + m.life + ")";
      ctx.fill();
    }

    // 鼠标星尘尾迹
    for (let i = dust.length - 1; i >= 0; i--) {
      const p = dust[i];
      p.x += p.vx; p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) { dust.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200, 215, 255, " + 0.5 * p.life + ")";
      ctx.fill();
    }

    // 点击星尘爆发
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.02;  // 轻微重力
      p.life -= p.decay;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.hue != null
        ? "hsla(" + p.hue + ", 85%, 75%, " + p.life + ")"
        : "rgba(255,255,255," + p.life + ")";
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  /* ---------------- 事件 ---------------- */
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", function (e) {
    mouseX = (e.clientX / W - 0.5) * -1;  // 反向移动更有纵深感
    mouseY = (e.clientY / H - 0.5) * -1;
    // 稀疏的星尘尾迹（触屏设备不生成）
    const now = performance.now();
    if (finePointer && !reduceMotion && now - lastDust > 70) {
      lastDust = now;
      dust.push({
        x: e.clientX + rand(-4, 4), y: e.clientY + rand(-4, 4),
        vx: rand(-0.3, 0.3), vy: rand(-0.6, -0.1),
        r: rand(0.5, 1.3), life: 1, decay: rand(0.02, 0.04),
      });
      if (dust.length > 80) dust.shift();
    }
  });
  window.addEventListener("click", function (e) {
    if (reduceMotion) return;
    const n = 14;
    for (let i = 0; i < n; i++) {
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const sp = rand(0.8, 3.2);
      sparks.push({
        x: e.clientX, y: e.clientY,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        r: rand(0.8, 1.8), life: 1, decay: rand(0.015, 0.03),
        hue: Math.random() < 0.4 ? 45 : (Math.random() < 0.5 ? 210 : null),
      });
    }
    if (sparks.length > 220) sparks.splice(0, sparks.length - 220);
  });

  resize();
  requestAnimationFrame(draw);
  setTimeout(scheduleMeteor, 1500);
})();

/* ============================================================
   页面通用交互：滚动淡入 + 导航栏滚动态 + 回到顶部
   ============================================================ */
(function () {
  "use strict";

  // 滚动淡入
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        observer.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".fade-in").forEach(function (el) { observer.observe(el); });

  // 导航栏滚动加背景
  const nav = document.querySelector(".navbar");
  const topBtn = document.querySelector(".back-top");
  window.addEventListener("scroll", function () {
    const y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (topBtn) topBtn.classList.toggle("show", y > 500);
  }, { passive: true });

  if (topBtn) {
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // 移动端菜单
  const burger = document.querySelector(".burger");
  const links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      links.classList.toggle("open");
      burger.classList.toggle("active");
    });
    // 点击任意导航链接后自动收起移动端菜单
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        burger.classList.remove("active");
      });
    });
  }

  // Service Worker：仅在 https 环境注册（file:// 本地预览自动跳过）
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    const R = /[\\/]posts[\\/]/.test(location.pathname) ? "../" : "";
    navigator.serviceWorker.register(R + "sw.js").catch(function () {});
  }
})();

/* ============================================================
   页面增强：阅读进度条 + 阅读时长 + 代码复制 + 标签筛选 + 随机星语
   ============================================================ */
(function () {
  "use strict";

  const prose = document.querySelector(".prose");

  // 阅读进度条（文章页 / 关于页）
  if (prose) {
    const bar = document.createElement("div");
    bar.className = "read-progress";
    document.body.appendChild(bar);
    window.addEventListener("scroll", function () {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    }, { passive: true });
  }

  // 预计阅读时长（按中文约 400 字/分钟）
  const meta = prose && prose.querySelector(".post-meta");
  if (meta) {
    const chars = prose.textContent.replace(/\s+/g, "").length;
    const mins = Math.max(1, Math.round(chars / 400));
    const span = document.createElement("span");
    span.textContent = "⏱ 约 " + mins + " 分钟";
    meta.appendChild(span);
  }

  // 代码块复制按钮
  document.querySelectorAll(".prose pre").forEach(function (pre) {
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "复制";
    btn.addEventListener("click", function () {
      const code = pre.querySelector("code");
      const text = (code || pre).innerText;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "已复制 ✓";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = "复制";
          btn.classList.remove("copied");
        }, 1600);
      });
    });
    pre.appendChild(btn);
  });

  // 首页标签筛选
  const filterBar = document.querySelector(".filter-bar");
  if (filterBar) {
    const cards = document.querySelectorAll(".post-card");
    filterBar.addEventListener("click", function (e) {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      filterBar.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      const tag = btn.dataset.tag;
      cards.forEach(function (card) {
        card.classList.toggle("hidden", tag !== "all" && card.dataset.tag !== tag);
      });
    });
  }

  // 随机星语
  const quoteText = document.getElementById("quote-text");
  const quoteFrom = document.getElementById("quote-from");
  if (quoteText && quoteFrom) {
    const quotes = [
      { t: "我们都是星尘。宇宙在我们体内，我们是宇宙认识自己的一种方式。", f: "卡尔·萨根" },
      { t: "两件事物越思考越觉神奇：头顶的星空，与心中的道德律。", f: "康德" },
      { t: "我们都在阴沟里，但仍有人仰望星空。", f: "王尔德" },
      { t: "给时光以生命，而不是给生命以时光。", f: "《三体》" },
      { t: "宇宙很大，生活更大，也许以后还有缘相见。", f: "《三体》" },
      { t: "月亮离我们很远，但它照亮的路很近。", f: "岛主" },
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.textContent = q.t;
    quoteFrom.textContent = "—— " + q.f;
  }
})();

/* ============================================================
   星屿扩展：全站搜索 / 归档渲染 / 统计滚动 / 页脚月相
   / 轻量语法高亮 / 星际信笺（本地留言）
   ============================================================ */
(function () {
  "use strict";

  const posts = window.STAR_POSTS || [];
  // 文章页在 posts/ 子目录下，站内链接需要补 ../ 前缀
  const ROOT = /[\\/]posts[\\/]/.test(location.pathname) ? "../" : "";

  /* ---------------- 全站搜索（快捷键 /） ---------------- */
  const overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "搜索文章");
  overlay.innerHTML =
    '<div class="search-box">' +
    '<input type="text" placeholder="搜索文章：标题、摘要或标签…" aria-label="搜索文章">' +
    '<ul class="search-results"></ul>' +
    '<p class="search-hint">Enter 打开第一条 · Esc 关闭</p>' +
    "</div>";
  document.body.appendChild(overlay);
  const searchInput = overlay.querySelector("input");
  const resultList = overlay.querySelector(".search-results");

  function renderResults(q) {
    q = q.trim().toLowerCase();
    const hits = !q ? posts : posts.filter(function (p) {
      return (p.title + p.excerpt + p.tag).toLowerCase().indexOf(q) !== -1;
    });
    resultList.innerHTML = "";
    if (!hits.length) {
      const li = document.createElement("li");
      li.className = "search-empty";
      li.textContent = "没有找到相关文章，换个关键词试试？";
      resultList.appendChild(li);
      return;
    }
    hits.forEach(function (p) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = ROOT + p.url;
      const date = document.createElement("span");
      date.className = "a-date";
      date.textContent = p.date;
      const title = document.createElement("span");
      title.className = "a-title";
      title.textContent = p.emoji + " " + p.title;
      const tag = document.createElement("span");
      tag.className = "post-tag";
      tag.textContent = p.tag;
      a.appendChild(date); a.appendChild(title); a.appendChild(tag);
      li.appendChild(a);
      resultList.appendChild(li);
    });
  }

  let selIdx = -1;
  function updateSel() {
    const lis = resultList.querySelectorAll("li");
    lis.forEach(function (li, i) { li.classList.toggle("sel", i === selIdx); });
    if (selIdx >= 0 && lis[selIdx]) lis[selIdx].scrollIntoView({ block: "nearest" });
  }

  function openSearch() {
    selIdx = -1;
    renderResults("");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(function () { searchInput.focus(); }, 60);
  }
  function closeSearch() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    searchInput.value = "";
    searchInput.blur();
  }

  document.querySelectorAll(".search-open").forEach(function (btn) {
    btn.addEventListener("click", openSearch);
  });
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeSearch();
  });
  searchInput.addEventListener("input", function () {
    selIdx = -1;
    renderResults(searchInput.value);
  });
  document.addEventListener("keydown", function (e) {
    const el = document.activeElement;
    const typing = el && /INPUT|TEXTAREA/.test(el.tagName) && el !== searchInput;
    const isOpen = overlay.classList.contains("open");
    if (e.key === "/" && !typing && !isOpen) {
      e.preventDefault();
      openSearch();
    } else if (e.key === "Escape") {
      closeSearch();
    } else if (isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const n = resultList.querySelectorAll("li a").length;
      if (!n) return;
      selIdx = e.key === "ArrowDown" ? (selIdx + 1) % n : (selIdx - 1 + n) % n;
      updateSel();
    } else if (e.key === "Enter" && isOpen) {
      const links = resultList.querySelectorAll("a");
      const target = links[selIdx >= 0 ? selIdx : 0];
      if (target) location.href = target.href;
    }
  });

  /* ---------------- 归档页时间轴 ---------------- */
  const archiveMount = document.getElementById("archive-list-mount");
  if (archiveMount && posts.length) {
    const byYear = {};
    posts.forEach(function (p) {
      const y = p.date.slice(0, 4);
      (byYear[y] = byYear[y] || []).push(p);
    });
    Object.keys(byYear).sort().reverse().forEach(function (y) {
      const head = document.createElement("div");
      head.className = "archive-year";
      head.textContent = y + " 年 · " + byYear[y].length + " 篇";
      const ul = document.createElement("ul");
      ul.className = "archive-list";
      byYear[y].forEach(function (p) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "archive-link";
        a.href = ROOT + p.url;
        const d = document.createElement("span");
        d.className = "a-date";
        d.textContent = p.date.slice(5);
        const t = document.createElement("span");
        t.className = "a-title";
        t.textContent = p.title;
        const g = document.createElement("span");
        g.className = "post-tag";
        g.textContent = p.tag;
        a.appendChild(d); a.appendChild(t); a.appendChild(g);
        li.appendChild(a);
        ul.appendChild(li);
      });
      archiveMount.appendChild(head);
      archiveMount.appendChild(ul);
    });
  }

  /* ---------------- 首页统计条（数字滚动） ---------------- */
  const strip = document.querySelector(".stats-strip");
  if (strip) {
    const LAUNCH = new Date("2026-07-05T00:00:00").getTime();
    const values = {
      posts: posts.length,
      tags: new Set(posts.map(function (p) { return p.tag; })).size,
      days: Math.max(1, Math.ceil((Date.now() - LAUNCH) / 86400000)),
      stars: window.__starCount || 0,
    };
    function countUp(el, to) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.textContent = to;
        return;
      }
      const dur = 1400, start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    const io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      strip.querySelectorAll("[data-stat]").forEach(function (el) {
        countUp(el, values[el.dataset.stat] || 0);
      });
    }, { threshold: 0.4 });
    io.observe(strip);
  }

  /* ---------------- 页脚月相 ---------------- */
  const footer = document.querySelector(".footer");
  if (footer) {
    const SYNODIC = 29.53058867;                    // 朔望月长度（天）
    const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);  // 一次已知的新月
    let age = ((Date.now() - NEW_MOON) / 86400000) % SYNODIC;
    if (age < 0) age += SYNODIC;
    const idx = Math.floor((age / SYNODIC) * 8 + 0.5) % 8;
    const emoji = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"][idx];
    const name = ["新月", "娥眉月", "上弦月", "盈凸月", "满月", "亏凸月", "下弦月", "残月"][idx];
    const line = document.createElement("p");
    line.className = "moon-line";
    line.textContent = "今夜月相 " + emoji + " " + name + " · 月龄约 " + Math.round(age) + " 天";
    footer.insertBefore(line, footer.querySelector("p"));
  }

  /* ---------------- 轻量语法高亮（JS / CSS 通用） ---------------- */
  (function () {
    const KW = "const|let|var|function|return|if|else|for|while|do|new|class|extends" +
      "|import|export|from|of|in|typeof|instanceof|switch|case|break|continue" +
      "|try|catch|throw|await|async|null|undefined|true|false|this";
    const RE = new RegExp(
      "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)" +
      "|(\"(?:[^\"\\\\\\n]|\\\\.)*\"|'(?:[^'\\\\\\n]|\\\\.)*'|`(?:[^`\\\\]|\\\\.)*`)" +
      "|\\b(" + KW + ")\\b" +
      "|\\b(\\d+(?:\\.\\d+)?)\\b",
      "g");
    function esc(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    document.querySelectorAll(".prose pre code").forEach(function (code) {
      const src = code.textContent;
      let out = "", last = 0, m;
      RE.lastIndex = 0;
      while ((m = RE.exec(src)) !== null) {
        out += esc(src.slice(last, m.index));
        const cls = m[1] ? "tok-com" : m[2] ? "tok-str" : m[3] ? "tok-kw" : "tok-num";
        out += '<span class="' + cls + '">' + esc(m[0]) + "</span>";
        last = m.index + m[0].length;
      }
      out += esc(src.slice(last));
      code.innerHTML = out;
    });
  })();

  /* ---------------- 星际信笺（localStorage 留言） ---------------- */
  const commentsMount = document.getElementById("comments-mount");
  if (commentsMount) {
    const slug = (location.pathname.split("/").pop() || "page").replace(/\.html?$/, "");
    const KEY = "starisle-letters-" + slug;

    const sec = document.createElement("section");
    sec.className = "comments prose-card";
    sec.innerHTML =
      '<h2 class="comments-title">🛰 星际信笺</h2>' +
      '<p class="comments-tip">信笺只保存在你自己的浏览器里，像一封写给未来自己的信。</p>' +
      '<form class="comment-form">' +
      '<input class="c-name" type="text" maxlength="20" placeholder="署名（可选，默认「旅行者」）">' +
      '<textarea class="c-text" required maxlength="500" placeholder="写点什么，向这颗星球广播…"></textarea>' +
      '<button type="submit" class="comment-send">发射信号 🚀</button>' +
      "</form>" +
      '<ul class="comment-list"></ul>';
    commentsMount.appendChild(sec);

    const form = sec.querySelector(".comment-form");
    const nameInput = sec.querySelector(".c-name");
    const textInput = sec.querySelector(".c-text");
    const list = sec.querySelector(".comment-list");

    function load() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch (e) { return []; }
    }
    function save(items) { localStorage.setItem(KEY, JSON.stringify(items)); }

    function renderComments() {
      const items = load();
      list.innerHTML = "";
      if (!items.length) {
        const li = document.createElement("li");
        li.className = "comment-empty";
        li.textContent = "这里还很安静，来做第一个发射信号的人吧。";
        list.appendChild(li);
        return;
      }
      items.forEach(function (it, i) {
        const li = document.createElement("li");
        li.className = "comment-item";
        const head = document.createElement("div");
        head.className = "comment-head";
        const who = document.createElement("strong");
        who.textContent = it.n || "旅行者";
        const when = document.createElement("span");
        when.textContent = new Date(it.d).toLocaleString("zh-CN", {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit",
        });
        head.appendChild(who); head.appendChild(when);
        const body = document.createElement("p");
        body.textContent = it.t;
        const del = document.createElement("button");
        del.className = "comment-del";
        del.type = "button";
        del.setAttribute("aria-label", "删除这条信笺");
        del.textContent = "✕";
        del.addEventListener("click", function () {
          const arr = load();
          arr.splice(i, 1);
          save(arr);
          renderComments();
        });
        li.appendChild(head); li.appendChild(body); li.appendChild(del);
        list.appendChild(li);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const t = textInput.value.trim();
      if (!t) return;
      const arr = load();
      arr.unshift({
        n: nameInput.value.trim().slice(0, 20),
        t: t.slice(0, 500),
        d: Date.now(),
      });
      save(arr);
      textInput.value = "";
      renderComments();
    });

    renderComments();
  }
})();

/* ============================================================
   阅读体验：宽屏悬浮目录（TOC）+ 文末相关文章推荐
   ============================================================ */
(function () {
  "use strict";

  const posts = window.STAR_POSTS || [];
  const ROOT = /[\\/]posts[\\/]/.test(location.pathname) ? "../" : "";

  /* ---------------- 悬浮目录 ---------------- */
  const article = document.querySelector(".prose-wrap .prose");
  if (article) {
    const heads = article.querySelectorAll("h2");
    if (heads.length >= 2) {
      const toc = document.createElement("nav");
      toc.className = "toc";
      toc.setAttribute("aria-label", "本页目录");
      const title = document.createElement("div");
      title.className = "toc-title";
      title.textContent = "✦ 本页目录";
      toc.appendChild(title);
      heads.forEach(function (h, i) {
        if (!h.id) h.id = "sec-" + (i + 1);
        const a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        toc.appendChild(a);
      });
      document.body.appendChild(toc);

      const links = toc.querySelectorAll("a");
      function syncToc() {
        let idx = 0;
        heads.forEach(function (h, i) {
          if (h.getBoundingClientRect().top < 130) idx = i;
        });
        links.forEach(function (a, i) { a.classList.toggle("current", i === idx); });
      }
      window.addEventListener("scroll", syncToc, { passive: true });
      syncToc();
    }
  }

  /* ---------------- 相关文章推荐 ---------------- */
  const mount = document.getElementById("comments-mount");
  if (mount && posts.length) {
    const file = location.pathname.split("/").pop();
    const cur = posts.find(function (p) { return p.url.split("/").pop() === file; });
    if (cur) {
      // 同标签优先，不足三篇再按时间补齐
      const rel = posts.filter(function (p) { return p !== cur && p.tag === cur.tag; });
      posts.forEach(function (p) {
        if (p !== cur && rel.indexOf(p) === -1) rel.push(p);
      });
      const picks = rel.slice(0, 3);
      if (picks.length) {
        const sec = document.createElement("section");
        sec.className = "related prose-card";
        const h = document.createElement("h2");
        h.className = "comments-title";
        h.textContent = "🧭 继续航行";
        const ul = document.createElement("ul");
        ul.className = "related-list";
        picks.forEach(function (p) {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.className = "archive-link";
          a.href = ROOT + p.url;
          const d = document.createElement("span");
          d.className = "a-date";
          d.textContent = p.date;
          const t = document.createElement("span");
          t.className = "a-title";
          t.textContent = p.emoji + " " + p.title;
          const g = document.createElement("span");
          g.className = "post-tag";
          g.textContent = p.tag;
          a.appendChild(d); a.appendChild(t); a.appendChild(g);
          li.appendChild(a);
          ul.appendChild(li);
        });
        sec.appendChild(h);
        sec.appendChild(ul);
        mount.parentNode.insertBefore(sec, mount);
      }
    }
  }
})();

/* ============================================================
   许愿按钮：手动召唤一场流星雨 + 轻提示
   ============================================================ */
(function () {
  "use strict";
  const btn = document.getElementById("wish-btn");
  if (!btn) return;

  const MSGS = [
    "🌠 流星雨来了，快许愿！",
    "🌠 听说对着流星许的愿，会被宇宙记住",
    "🌠 这一场，只为你落下",
    "🌠 愿望已广播至 25 光年外",
  ];

  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  btn.addEventListener("click", function () {
    if (window.__meteorShower) window.__meteorShower(12);
    toast(MSGS[Math.floor(Math.random() * MSGS.length)]);
  });
})();

/* ============================================================
   文章图片：点击放大灯箱 + 加载失败优雅占位
   ============================================================ */
(function () {
  "use strict";
  const imgs = document.querySelectorAll(".prose img");
  if (!imgs.length) return;

  // 灯箱（延迟创建，全站共用一个）
  let box = null;
  function ensureBox() {
    if (box) return box;
    box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = '<button class="lightbox-close" aria-label="关闭">✕</button><img alt="">';
    document.body.appendChild(box);
    const close = function () {
      box.classList.remove("open");
      document.body.style.overflow = "";
    };
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.classList.contains("lightbox-close")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("open")) close();
    });
    return box;
  }

  function makeError(img) {
    const div = document.createElement("div");
    div.className = "img-error";
    div.innerHTML = '<span class="ie-icon">🛰</span><span>图片信号丢失…</span>';
    const cap = document.createElement("span");
    cap.textContent = img.getAttribute("alt") || "";
    if (cap.textContent) div.appendChild(cap);
    if (img.parentNode) img.parentNode.replaceChild(div, img);
  }

  imgs.forEach(function (img) {
    // 加载失败 → 占位
    img.addEventListener("error", function () { makeError(img); });
    if (img.complete && img.naturalWidth === 0) makeError(img);  // 已失败
    // 点击放大
    img.addEventListener("click", function () {
      const b = ensureBox();
      b.querySelector("img").src = img.currentSrc || img.src;
      b.querySelector("img").alt = img.alt || "";
      b.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });
})();
