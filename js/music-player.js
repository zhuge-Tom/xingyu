(function () {
  "use strict";
  var config = window.STAR_MUSIC_CONFIG;
  if (!config || !config.enabled || !config.tracks || !config.tracks.length) return;
  var root = document.createElement("section");
  root.className = "star-music collapsed";
  root.setAttribute("aria-label", "音乐播放器");
  root.innerHTML = '<div class="music-particles" aria-hidden="true"></div><button class="music-star" type="button" aria-label="展开音乐播放器" aria-expanded="false"><span>✦</span></button><div class="music-panel" aria-hidden="true"><button class="music-collapse" type="button" aria-label="收拢为星星">×</button><div class="music-orbit" aria-hidden="true"><i></i><i></i><i></i></div><div class="music-copy"><strong class="music-title"></strong><span class="music-artist"></span></div><div class="music-controls"><button class="music-prev" type="button" aria-label="上一首">‹</button><button class="music-play" type="button" aria-label="播放">▶</button><button class="music-next" type="button" aria-label="下一首">›</button></div><div class="music-progress"><span></span></div></div>';
  document.body.appendChild(root);
  var audio = new Audio(), index = 0, star = root.querySelector(".music-star"), panel = root.querySelector(".music-panel"), title = root.querySelector(".music-title"), artist = root.querySelector(".music-artist"), play = root.querySelector(".music-play"), progress = root.querySelector(".music-progress"), progressFill = progress.querySelector("span");
  audio.preload = "metadata";
  function path(src) { return /^(https?:|data:|\/)/.test(src) || !/\/posts\//.test(location.pathname) ? src : "../" + src; }
  function loadTrack(next) { index = (next + config.tracks.length) % config.tracks.length; var track = config.tracks[index]; title.textContent = track.title || "未命名星轨"; artist.textContent = track.artist || "未知艺术家"; audio.src = path(track.src); audio.load(); progressFill.style.width = "0%"; }
  function togglePlayback() { if (audio.paused) audio.play().catch(function () {}); else audio.pause(); }
  function setPlaying(playing) { root.classList.toggle("playing", playing); play.textContent = playing ? "Ⅱ" : "▶"; play.setAttribute("aria-label", playing ? "暂停" : "播放"); }
  function burst() { var box = root.querySelector(".music-particles"); box.innerHTML = ""; for (var i = 0; i < 24; i++) { var p = document.createElement("b"); p.style.setProperty("--x", (Math.random() * 240 - 120).toFixed(0) + "px"); p.style.setProperty("--y", (Math.random() * 160 - 80).toFixed(0) + "px"); p.style.setProperty("--delay", (Math.random() * .22).toFixed(2) + "s"); p.textContent = i % 3 === 0 ? "✦" : "·"; box.appendChild(p); } }
  function setExpanded(expanded) { root.classList.toggle("collapsed", !expanded); root.classList.toggle("expanded", expanded); star.setAttribute("aria-expanded", String(expanded)); star.setAttribute("aria-label", expanded ? "收起音乐播放器" : "展开音乐播放器"); panel.setAttribute("aria-hidden", String(!expanded)); if (expanded) burst(); }
  star.addEventListener("click", function () { setExpanded(!root.classList.contains("expanded")); }); root.querySelector(".music-collapse").addEventListener("click", function () { burst(); setExpanded(false); }); play.addEventListener("click", togglePlayback);
  root.querySelector(".music-prev").addEventListener("click", function () { loadTrack(index - 1); togglePlayback(); }); root.querySelector(".music-next").addEventListener("click", function () { loadTrack(index + 1); togglePlayback(); });
  progress.addEventListener("click", function (e) { if (audio.duration) audio.currentTime = (e.offsetX / progress.clientWidth) * audio.duration; });
  audio.addEventListener("play", function () { setPlaying(true); }); audio.addEventListener("pause", function () { setPlaying(false); }); audio.addEventListener("ended", function () { loadTrack(index + 1); audio.play().catch(function () {}); }); audio.addEventListener("timeupdate", function () { if (audio.duration) progressFill.style.width = (audio.currentTime / audio.duration * 100) + "%"; }); audio.addEventListener("error", function () { artist.textContent = "请在 js/music-config.js 配置音频"; });
  loadTrack(0); if (config.autoplay) audio.play().catch(function () {});
})();
