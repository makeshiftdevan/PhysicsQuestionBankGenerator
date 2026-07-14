/* App shell: hash router, sidebar, home page, lesson pages, progress tracking. */
(function () {
  const { renderBlocks, el } = window.Render;
  const COURSE = window.COURSE || [];
  const LS_KEY = "ftc-java-academy-progress";

  /* ---------- progress ---------- */
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  }
  let progress = loadProgress();

  function isDone(lessonId) { return !!progress[lessonId]; }
  function setDone(lessonId, done) {
    if (done) progress[lessonId] = true;
    else delete progress[lessonId];
    saveProgress(progress);
    updateGlobalProgress();
    buildSidebar();
  }
  function recordQuiz() { /* hook for future stats */ }

  /* ---------- flat lesson list ---------- */
  const FLAT = [];
  COURSE.forEach((mod, mi) => {
    mod.lessons.forEach((les, li) => {
      FLAT.push({ mod, mi, les, li });
    });
  });
  function findLesson(id) {
    return FLAT.find(f => f.les.id === id) || null;
  }

  /* ---------- global progress ---------- */
  function updateGlobalProgress() {
    const total = FLAT.length;
    const done = FLAT.filter(f => isDone(f.les.id)).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById("global-progress-fill").style.width = pct + "%";
    document.getElementById("global-progress-text").textContent = pct + "%";
  }

  /* ---------- sidebar ---------- */
  function buildSidebar() {
    const host = document.getElementById("sidebar-content");
    host.innerHTML = "";

    const home = el("a", "side-home", "🏠 Course home");
    home.href = "#home";
    if (!currentLessonId()) home.classList.add("active");
    host.appendChild(home);

    const curId = currentLessonId();

    COURSE.forEach((mod, mi) => {
      const wrap = el("div", "side-module");
      const allDone = mod.lessons.every(l => isDone(l.id));
      if (allDone) wrap.classList.add("done");
      const containsCurrent = mod.lessons.some(l => l.id === curId);
      if (containsCurrent || (mi === 0 && !curId)) wrap.classList.add("open");

      const header = el("button", "side-module-header");
      header.appendChild(el("span", "mod-num", allDone ? "✔ " + mi : String(mi)));
      header.appendChild(el("span", "", mod.title));
      header.appendChild(el("span", "chev", "▶"));
      header.addEventListener("click", () => wrap.classList.toggle("open"));
      wrap.appendChild(header);

      const list = el("div", "side-lessons");
      mod.lessons.forEach(les => {
        const a = el("a", "side-lesson");
        a.href = "#" + les.id;
        if (isDone(les.id)) a.classList.add("done");
        if (les.id === curId) a.classList.add("active");
        a.appendChild(el("span", "tick", "✔"));
        a.appendChild(el("span", "", les.title));
        list.appendChild(a);
      });
      wrap.appendChild(list);
      host.appendChild(wrap);
    });
  }

  /* ---------- home page ---------- */
  function renderHome() {
    const c = document.getElementById("content");
    c.innerHTML = "";

    const hero = el("div", "hero");
    hero.appendChild(el("h1", "",
      'Learn <span class="hl">Java</span> for <span class="hl">FTC Robotics</span>'));
    hero.appendChild(el("p", "sub",
      "An interactive, zero-to-hero course for FIRST Tech Challenge programmers. " +
      "Start with no coding experience; finish writing autonomous routines with advanced " +
      "path following and Limelight vision."));
    const firstIncomplete = FLAT.find(f => !isDone(f.les.id)) || FLAT[0];
    const cta = el("a", "cta",
      Object.keys(progress).length ? "▶ Continue learning" : "▶ Start the course");
    cta.href = "#" + firstIncomplete.les.id;
    hero.appendChild(cta);
    c.appendChild(hero);

    const feats = el("div", "feature-row");
    [
      ["🧩", "Zero assumptions", "Starts from “what is code?” — every concept is explained with FTC robot examples, never abstract ones."],
      ["🕹", "Interactive labs", "Drive a virtual mecanum robot, tune a PID controller, build spline paths, and lock onto AprilTags — in your browser."],
      ["✔", "Check-yourself quizzes", "Every lesson has quick quizzes and fill-in-the-code exercises with instant feedback and explanations."],
      ["🏆", "Competition-ready", "Ends at the real deal: Road Runner & Pedro Pathing trajectories, PID, state machines, and Limelight 3A vision."]
    ].forEach(([icon, title, text]) => {
      const f = el("div", "feature");
      f.appendChild(el("div", "f-icon", icon));
      f.appendChild(el("h3", "", title));
      f.appendChild(el("p", "", text));
      feats.appendChild(f);
    });
    c.appendChild(feats);

    c.appendChild(el("h2", "", "Curriculum"));
    const grid = el("div", "module-grid");
    COURSE.forEach((mod, mi) => {
      const card = el("a", "module-card");
      card.href = "#" + mod.lessons[0].id;
      const top = el("div", "mc-top");
      top.appendChild(el("span", "mc-num", "Module " + mi));
      top.appendChild(el("h3", "", mod.title));
      card.appendChild(top);
      card.appendChild(el("p", "", mod.desc));
      const done = mod.lessons.filter(l => isDone(l.id)).length;
      const meta = el("div", "mc-meta");
      meta.appendChild(el("span", "mc-badge " + mod.level, mod.level));
      meta.appendChild(el("span", "", mod.lessons.length + " lessons"));
      const bar = el("div", "mc-bar");
      const fill = el("div", "mc-bar-fill");
      fill.style.width = (done / mod.lessons.length) * 100 + "%";
      bar.appendChild(fill);
      meta.appendChild(bar);
      meta.appendChild(el("span", "", done + "/" + mod.lessons.length));
      card.appendChild(meta);
      grid.appendChild(card);
    });
    c.appendChild(grid);
  }

  /* ---------- lesson page ---------- */
  function renderLesson(entry) {
    const { mod, mi, les } = entry;
    const c = document.getElementById("content");
    c.innerHTML = "";

    const crumbs = el("div", "crumbs");
    crumbs.innerHTML = '<a href="#home">Home</a> / Module ' + mi + ": " + mod.title;
    c.appendChild(crumbs);

    c.appendChild(el("h1", "lesson-title", les.title));
    if (les.sub) c.appendChild(el("p", "lesson-sub", les.sub));

    if (les.objectives && les.objectives.length) {
      const obj = el("div", "objectives");
      obj.appendChild(el("div", "obj-title", "In this lesson you'll learn"));
      obj.appendChild(el("ul", "", les.objectives.map(o => "<li>" + o + "</li>").join("")));
      c.appendChild(obj);
    }

    renderBlocks(les.blocks, c, les.id);

    /* footer nav */
    const idx = FLAT.indexOf(entry);
    const nav = el("div", "lesson-nav");

    if (idx > 0) {
      const prev = FLAT[idx - 1];
      const a = el("a", "lnav-btn");
      a.href = "#" + prev.les.id;
      a.appendChild(el("span", "dir", "← Previous"));
      a.appendChild(el("span", "ttl", prev.les.title));
      nav.appendChild(a);
    }

    nav.appendChild(el("div", "spacer"));

    const doneBtn = el("button", "complete-btn");
    function refreshDone() {
      const d = isDone(les.id);
      doneBtn.textContent = d ? "✔ Completed" : "Mark as complete";
      doneBtn.classList.toggle("done", d);
    }
    doneBtn.addEventListener("click", () => {
      setDone(les.id, !isDone(les.id));
      refreshDone();
    });
    refreshDone();
    nav.appendChild(doneBtn);

    if (idx < FLAT.length - 1) {
      const next = FLAT[idx + 1];
      const a = el("a", "lnav-btn");
      a.href = "#" + next.les.id;
      a.style.textAlign = "right";
      a.appendChild(el("span", "dir", "Next →"));
      a.appendChild(el("span", "ttl", next.les.title));
      a.addEventListener("click", () => setDone(les.id, true));
      nav.appendChild(a);
    }

    c.appendChild(nav);
  }

  /* ---------- router ---------- */
  function currentLessonId() {
    const h = location.hash.replace(/^#/, "");
    if (!h || h === "home") return null;
    return findLesson(h) ? h : null;
  }

  function route() {
    const id = currentLessonId();
    if (id) renderLesson(findLesson(id));
    else renderHome();
    buildSidebar();
    updateGlobalProgress();
    document.getElementById("content").scrollTop = 0;
    window.scrollTo(0, 0);
    closeSidebar();
  }

  /* ---------- mobile sidebar ---------- */
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  function closeSidebar() {
    sidebar.classList.remove("open");
    backdrop.classList.remove("show");
  }
  document.getElementById("nav-toggle").addEventListener("click", () => {
    sidebar.classList.toggle("open");
    backdrop.classList.toggle("show", sidebar.classList.contains("open"));
  });
  backdrop.addEventListener("click", closeSidebar);

  window.addEventListener("hashchange", route);
  window.App = { recordQuiz };
  route();
})();
