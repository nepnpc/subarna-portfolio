/* Subarna Katwal — film transport. Zero dependencies.
   The clock owns one number: `time` (0..TOTAL seconds).
   It writes --t onto :root; CSS does the rest. Pause = stop the clock,
   the frozen frame is just the current --t. Scrub = set --t.          */

(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;                          // CSS already shows the static CV

  const TOTAL = 36;                             // must match --total in CSS
  const root = document.documentElement;
  const film = document.getElementById("film");
  const playBtn = document.getElementById("play");
  const backBtn = document.getElementById("back");
  const fwdBtn  = document.getElementById("fwd");
  const speedBtn = document.getElementById("speed");
  const track = document.getElementById("track");
  const fill  = document.getElementById("fill");
  const head  = document.getElementById("head");
  const timeEl = document.getElementById("time");
  const chapWrap = document.getElementById("chapters");
  const chapName = document.getElementById("chapName");
  const hint = document.getElementById("hint");

  const chapters = [
    { t: 0,  name: "Boot" },
    { t: 4,  name: "Who" },
    { t: 11, name: "Shipped" },
    { t: 19, name: "Craft" },
    { t: 25, name: "Path" },
    { t: 32, name: "Hire" },
  ];
  const speeds = [1, 1.5, 2, 0.5];

  let time = 0, playing = false, speed = 1, last = 0, raf = null, hinted = false;

  /* ---- chapter ticks ---- */
  chapters.forEach((c) => {
    if (c.t === 0) return;
    const i = document.createElement("i");
    i.style.left = (c.t / TOTAL * 100) + "%";
    chapWrap.appendChild(i);
  });

  const fmt = (s) => {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };

  function currentChapter() {
    let c = chapters[0];
    for (const ch of chapters) if (time + 0.01 >= ch.t) c = ch; else break;
    return c;
  }

  function render() {
    root.style.setProperty("--t", (-time) + "s");
    const pct = time / TOTAL * 100;
    fill.style.width = pct + "%";
    head.style.left = pct + "%";
    timeEl.innerHTML = fmt(time) + "&nbsp;/&nbsp;" + fmt(TOTAL);
    track.setAttribute("aria-valuenow", Math.round(pct));
    const ch = currentChapter();
    if (chapName.textContent !== ch.name) chapName.textContent = ch.name;
  }

  function tick(now) {
    if (!playing) return;
    const dt = Math.min((now - last) / 1000, 0.05) * speed;
    last = now;
    time += dt;
    if (time >= TOTAL) { time = TOTAL; render(); pause(); film.classList.add("is-ended"); return; }
    render();
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (time >= TOTAL) time = 0;                // replay from start
    playing = true; film.classList.remove("is-ended"); film.classList.add("is-playing");
    playBtn.setAttribute("aria-label", "Pause");
    last = performance.now(); raf = requestAnimationFrame(tick);
    dropHint();
  }
  function pause() {
    playing = false; film.classList.remove("is-playing");
    playBtn.setAttribute("aria-label", "Play");
    if (raf) cancelAnimationFrame(raf), raf = null;
  }
  const toggle = () => (playing ? pause() : play());

  function seek(t, keepPlaying) {
    time = Math.max(0, Math.min(TOTAL, t));
    film.classList.remove("is-ended");
    render();
    if (!keepPlaying && playing) { last = performance.now(); }   // continue smoothly
    dropHint();
  }

  function dropHint() { if (!hinted) { hinted = true; hint && hint.classList.add("hide"); } }

  /* ---- controls ---- */
  playBtn.addEventListener("click", toggle);
  backBtn.addEventListener("click", () => seek(time - 5));
  fwdBtn.addEventListener("click", () => seek(time + 5));
  speedBtn.addEventListener("click", () => {
    speed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    speedBtn.textContent = speed + "×";
  });

  /* ---- scrub (pointer drag on track) ---- */
  let scrubbing = false, wasPlaying = false;
  const pos = (clientX) => {
    const r = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * TOTAL;
  };
  track.addEventListener("pointerdown", (e) => {
    scrubbing = true; wasPlaying = playing; pause();
    track.setPointerCapture(e.pointerId); seek(pos(e.clientX), true);
  });
  track.addEventListener("pointermove", (e) => { if (scrubbing) seek(pos(e.clientX), true); });
  track.addEventListener("pointerup", () => { scrubbing = false; if (wasPlaying) play(); });
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { seek(time + 2); e.preventDefault(); }
    if (e.key === "ArrowLeft")  { seek(time - 2); e.preventDefault(); }
  });

  /* ---- global keyboard ---- */
  addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.code === "Space") { e.preventDefault(); toggle(); }
    else if (e.key === "ArrowRight") seek(time + 5);
    else if (e.key === "ArrowLeft")  seek(time - 5);
    else if (/^[1-6]$/.test(e.key)) seek(chapters[+e.key - 1].t);
  });

  /* ---- boot ---- */
  render();
  // gentle auto-start so it reads like a film; user can pause instantly
  setTimeout(() => { if (!playing && time === 0) play(); }, 650);
})();
