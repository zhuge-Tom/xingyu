/* ============================================================
   星座图鉴 constellations.js
   每张卡片一块小 Canvas：星点按亮度定大小、随机闪烁；
   悬停（或触屏点击）点亮连线并标注最亮星。
   仅在 constellations.html 上生效（找不到挂载点直接退出）。
   ============================================================ */
(function () {
  "use strict";

  const grid = document.getElementById("constellation-grid");
  if (!grid) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // stars: 归一化坐标 [x, y]；mags: 视星等（越小越亮）；brightIdx: 最亮星下标
  const DATA = [
    {
      name: "北斗七星",
      latin: "Big Dipper",
      season: "🕐 四季可见 · 北天",
      brightName: "玉衡（Alioth）",
      brightIdx: 4,
      color: "#a8c2ff",
      story: "勺口两颗星的连线向外延长五倍，就是北极星——人类最古老的导航仪。斗柄的指向还是天然的季节表：斗柄东指，天下皆春。",
      stars: [[0.80, 0.30], [0.76, 0.52], [0.60, 0.56], [0.62, 0.36], [0.46, 0.40], [0.32, 0.46], [0.16, 0.58]],
      mags: [1.8, 2.4, 2.4, 3.3, 1.8, 2.2, 1.9],
      lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
    },
    {
      name: "仙后座",
      latin: "Cassiopeia",
      season: "🕐 秋季最佳 · 北天",
      brightName: "王良四（Schedar）",
      brightIdx: 1,
      color: "#ffd9a8",
      story: "五颗星排成一个大大的 W，与北斗隔着北极星遥遥相望。北斗沉到地平线下的秋夜，就轮到它来为你指出北极星。",
      stars: [[0.05, 0.55], [0.28, 0.20], [0.50, 0.50], [0.72, 0.25], [0.95, 0.45]],
      mags: [2.3, 2.2, 2.2, 2.7, 3.4],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
    },
    {
      name: "猎户座",
      latin: "Orion",
      season: "🕐 冬季 · 天赤道",
      brightName: "参宿七（Rigel）",
      brightIdx: 6,
      color: "#9fc4ff",
      story: "冬夜最容易认出的星座：腰带三星一字排开。左肩的参宿四是一颗随时可能超新星爆发的红超巨星——也许明晚，也许十万年后。",
      stars: [[0.30, 0.16], [0.66, 0.20], [0.56, 0.48], [0.48, 0.52], [0.40, 0.56], [0.34, 0.86], [0.70, 0.82]],
      mags: [0.5, 1.6, 2.2, 1.7, 1.8, 2.1, 0.1],
      lines: [[0, 1], [0, 4], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [5, 6]],
    },
    {
      name: "天鹅座",
      latin: "Cygnus",
      season: "🕐 夏秋 · 银河之上",
      brightName: "天津四（Deneb）",
      brightIdx: 0,
      color: "#cfe0ff",
      story: "一只沿银河展翅的天鹅，主体是漂亮的「北十字」。喙上的辇道增七是全天最美的双星之一——一颗金黄，一颗湛蓝。",
      stars: [[0.50, 0.10], [0.50, 0.44], [0.50, 0.90], [0.26, 0.30], [0.74, 0.58], [0.08, 0.20], [0.92, 0.70]],
      mags: [1.3, 2.2, 3.1, 2.9, 2.5, 3.8, 3.2],
      lines: [[0, 1], [1, 2], [3, 1], [1, 4], [5, 3], [4, 6]],
    },
    {
      name: "天琴座",
      latin: "Lyra",
      season: "🕐 夏季 · 头顶天顶",
      brightName: "织女一（Vega）",
      brightIdx: 0,
      color: "#bfe3ff",
      story: "织女星是北半球夏夜最亮的恒星，距离我们 25 光年。因为地轴缓慢摆动，一万两千年后它将再次成为北极星。",
      stars: [[0.30, 0.15], [0.44, 0.30], [0.64, 0.36], [0.58, 0.72], [0.38, 0.66]],
      mags: [0.03, 4.3, 4.3, 3.2, 3.5],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]],
    },
    {
      name: "天蝎座",
      latin: "Scorpius",
      season: "🕐 夏季 · 南方低空",
      brightName: "心宿二（Antares）",
      brightIdx: 3,
      color: "#ff9a7a",
      story: "整条蝎子的弧线在夏夜南天清晰可辨。心口那颗泛红的心宿二，中国古称「大火」——《诗经》里的「七月流火」，说的就是它向西沉落。",
      stars: [
        [0.30, 0.12], [0.22, 0.20], [0.16, 0.30], [0.34, 0.34], [0.40, 0.46],
        [0.42, 0.58], [0.40, 0.70], [0.42, 0.82], [0.52, 0.90], [0.64, 0.92],
        [0.72, 0.86], [0.78, 0.76], [0.72, 0.66],
      ],
      mags: [2.6, 2.3, 2.9, 1.1, 2.8, 2.3, 3.0, 3.6, 3.3, 1.9, 3.0, 2.4, 1.6],
      lines: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12]],
    },
    {
      name: "大熊座",
      latin: "Ursa Major",
      season: "🕐 四季可见 · 北天",
      brightName: "玉衡（Alioth）",
      brightIdx: 4,
      color: "#bcd0ff",
      story: "北斗七星只是大熊座的尾巴与后半身。把视野放大，还能补出熊的头和四条腿——全天第三大的星座，古希腊人把它想象成被变成熊的仙女卡利斯托。",
      stars: [[0.86, 0.28], [0.82, 0.46], [0.66, 0.50], [0.68, 0.32], [0.50, 0.36], [0.34, 0.42], [0.16, 0.52], [0.60, 0.66], [0.52, 0.80], [0.40, 0.70]],
      mags: [1.8, 2.4, 2.4, 3.3, 1.8, 2.2, 1.9, 3.1, 3.5, 3.0],
      lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6], [2, 7], [7, 8], [8, 9], [9, 2]],
    },
    {
      name: "小熊座",
      latin: "Ursa Minor",
      season: "🕐 四季可见 · 拱极",
      brightName: "北极星（Polaris）",
      brightIdx: 0,
      color: "#fff0c0",
      story: "勺柄末端那颗最亮的就是北极星——它几乎不动，整片星空绕着它旋转，是千百年来最可靠的方向标。找到它，就找到了正北。",
      stars: [[0.20, 0.14], [0.30, 0.34], [0.44, 0.52], [0.60, 0.66], [0.78, 0.56], [0.80, 0.74], [0.62, 0.84]],
      mags: [2.0, 4.4, 4.3, 3.0, 2.1, 4.9, 4.3],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
    },
    {
      name: "仙女座",
      latin: "Andromeda",
      season: "🕐 秋季 · 头顶偏北",
      brightName: "壁宿二（Alpheratz）",
      brightIdx: 0,
      color: "#cbb8ff",
      story: "从这条星链旁的一小团朦胧光斑，就是仙女座星系 M31——肉眼可见最远的天体，254 万光年外。你看到的那点光，出发时地球上还没有人类。",
      stars: [[0.16, 0.30], [0.36, 0.42], [0.56, 0.52], [0.76, 0.60], [0.50, 0.24], [0.66, 0.16]],
      mags: [2.1, 2.1, 2.3, 3.8, 3.6, 4.1],
      lines: [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5]],
    },
    {
      name: "金牛座",
      latin: "Taurus",
      season: "🕐 冬季 · 猎户西北",
      brightName: "毕宿五（Aldebaran）",
      brightIdx: 0,
      color: "#ffb37a",
      story: "红橙色的毕宿五是牛的眼睛，旁边 V 字形的毕星团是牛脸。牛肩上还挑着一团小小的昴星团（七姐妹），是冬夜里最容易一眼认出的「小勺子」。",
      stars: [[0.40, 0.60], [0.30, 0.52], [0.22, 0.46], [0.50, 0.54], [0.60, 0.48], [0.78, 0.30], [0.72, 0.72], [0.16, 0.20]],
      mags: [0.9, 3.5, 3.8, 3.4, 3.0, 1.7, 3.0, 2.9],
      lines: [[2, 1], [1, 0], [0, 3], [3, 4], [4, 5], [0, 6], [3, 7]],
    },
    {
      name: "狮子座",
      latin: "Leo",
      season: "🕐 春季 · 头顶高挂",
      brightName: "轩辕十四（Regulus）",
      brightIdx: 0,
      color: "#ffe08a",
      story: "狮子头部像一把反写的问号（也叫「镰刀」），钩住底端的轩辕十四。它几乎正卧在黄道上，是春夜最堂皇的星座，也是狮子座流星雨的辐射点。",
      stars: [[0.18, 0.72], [0.22, 0.56], [0.30, 0.42], [0.42, 0.36], [0.40, 0.52], [0.58, 0.58], [0.80, 0.50], [0.84, 0.70]],
      mags: [1.4, 3.5, 3.0, 2.0, 2.6, 3.3, 2.1, 3.3],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [5, 6], [6, 7], [7, 5]],
    },
  ];

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cards = [];

  DATA.forEach(function (c) {
    const card = document.createElement("article");
    card.className = "const-card fade-in";

    const cv = document.createElement("canvas");
    cv.className = "const-canvas";
    card.appendChild(cv);

    const body = document.createElement("div");
    body.className = "const-body";
    const h3 = document.createElement("h3");
    h3.textContent = c.name + " ";
    const latin = document.createElement("span");
    latin.className = "const-latin";
    latin.textContent = c.latin;
    h3.appendChild(latin);
    const meta = document.createElement("div");
    meta.className = "const-meta";
    const s1 = document.createElement("span");
    s1.textContent = c.season;
    const s2 = document.createElement("span");
    s2.textContent = "✨ 最亮星：" + c.brightName;
    meta.appendChild(s1); meta.appendChild(s2);
    const p = document.createElement("p");
    p.textContent = c.story;
    body.appendChild(h3); body.appendChild(meta); body.appendChild(p);
    card.appendChild(body);
    grid.appendChild(card);

    const state = {
      c: c,
      cv: cv,
      g: cv.getContext("2d"),
      w: 0, h: 0,
      hover: false,
      glow: 0.35,
      tw: c.stars.map(function () {
        return { sp: 0.6 + Math.random() * 1.8, ph: Math.random() * Math.PI * 2 };
      }),
    };
    card.addEventListener("mouseenter", function () { state.hover = true; });
    card.addEventListener("mouseleave", function () { state.hover = false; });
    card.addEventListener("click", function () { state.hover = !state.hover; }); // 触屏切换
    cards.push(state);
  });

  function sizeAll() {
    cards.forEach(function (k) {
      const w = k.cv.clientWidth || 300;
      const h = 190;
      k.w = w; k.h = h;
      k.cv.width = w * dpr;
      k.cv.height = h * dpr;
      k.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  function draw(ts) {
    const t = ts / 1000;
    cards.forEach(function (k) {
      const g = k.g, w = k.w, h = k.h, c = k.c;
      if (!w) return;
      g.clearRect(0, 0, w, h);
      k.glow += ((k.hover ? 1 : 0.35) - k.glow) * 0.08;

      // 连线
      g.strokeStyle = "rgba(150, 175, 255, " + 0.55 * k.glow + ")";
      g.lineWidth = 1;
      g.beginPath();
      c.lines.forEach(function (l) {
        g.moveTo(c.stars[l[0]][0] * w, c.stars[l[0]][1] * h);
        g.lineTo(c.stars[l[1]][0] * w, c.stars[l[1]][1] * h);
      });
      g.stroke();

      // 星点
      c.stars.forEach(function (pos, i) {
        const x = pos[0] * w, y = pos[1] * h;
        const tw = reduceMotion ? 1 : 0.7 + 0.3 * Math.sin(t * k.tw[i].sp + k.tw[i].ph);
        const mag = Math.min(c.mags[i], 4.5);
        const r = Math.max(1, (4.6 - mag) * 0.75);
        const bright = i === c.brightIdx;

        g.beginPath();
        g.arc(x, y, bright ? r + 0.6 : r, 0, Math.PI * 2);
        g.fillStyle = bright ? c.color : "rgba(221, 230, 255, " + (0.55 + 0.45 * tw) * Math.min(1, 0.5 + k.glow) + ")";
        g.globalAlpha = bright ? 0.75 + 0.25 * tw : 1;
        g.fill();
        g.globalAlpha = 1;

        // 最亮星：十字光晕 + 悬停标注
        if (bright) {
          g.strokeStyle = "rgba(255, 255, 255, " + 0.4 * tw * k.glow + ")";
          g.lineWidth = 0.7;
          g.beginPath();
          g.moveTo(x - r * 3.2, y); g.lineTo(x + r * 3.2, y);
          g.moveTo(x, y - r * 3.2); g.lineTo(x, y + r * 3.2);
          g.stroke();
          if (k.glow > 0.6) {
            g.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
            g.fillStyle = "rgba(230, 238, 255, " + (k.glow - 0.6) * 2.5 + ")";
            const tx = x > w * 0.6 ? x - g.measureText(c.brightName).width - 10 : x + 10;
            g.fillText(c.brightName, tx, y - 8);
          }
        }
      });
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", sizeAll);
  sizeAll();
  // 布局稳定后再量一次，避免首帧宽度为 0
  setTimeout(sizeAll, 100);
  requestAnimationFrame(draw);
})();
