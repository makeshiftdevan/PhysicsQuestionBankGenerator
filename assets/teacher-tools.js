/* Teacher Tools page: soft gate + snippet builders. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /* ----- Soft gate -----
     Answer: "parabola" (s vs. t for constant acceleration).
     Change ANSWER below to change it. This is a courtesy lock,
     not security — anything on a static site is public. */
  const ANSWER = "parabola";
  const GATE_KEY = "ska-teacher-ok";

  function unlock() {
    sessionStorage.setItem(GATE_KEY, "1");
    $("gate").hidden = true;
    $("tools").hidden = false;
  }

  function setupGate() {
    if (sessionStorage.getItem(GATE_KEY) === "1") {
      unlock();
      return;
    }
    const tryIt = () => {
      const val = $("gate-input").value.trim().toLowerCase();
      if (val === ANSWER) unlock();
      else $("gate-msg").textContent = "Not quite — think kinematics graphs.";
    };
    $("gate-btn").addEventListener("click", tryIt);
    $("gate-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryIt();
    });
  }

  /* ----- Admin links ----- */

  function renderAdminLinks() {
    const ul = $("admin-links");
    const icons = { doc: "\u{1F4C4}", video: "▶", practice: "✏", sim: "⚙", external: "↗" };
    (SITE_DATA.teacherTools.links || []).forEach((l) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener";
      const icon = document.createElement("span");
      icon.className = "link-icon";
      icon.textContent = icons[l.type] || icons.external;
      const label = document.createElement("span");
      label.textContent = l.label;
      a.append(icon, label);
      li.appendChild(a);
      ul.appendChild(li);
    });
  }

  /* ----- Link Builder ----- */

  const q = (s) => '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';

  function updateLinkBuilder() {
    const label = $("lb-label").value.trim() || "…";
    const url = $("lb-url").value.trim() || "…";
    const type = $("lb-type").value;
    $("lb-out").textContent = `{ label: ${q(label)}, url: ${q(url)}, type: ${q(type)} },`;
  }

  function setupLinkBuilder() {
    ["lb-label", "lb-url", "lb-type"].forEach((id) =>
      $(id).addEventListener("input", updateLinkBuilder)
    );
    $("lb-copy").addEventListener("click", () => copy($("lb-out").textContent, $("lb-copy")));
    updateLinkBuilder();
  }

  /* ----- Puzzle Builder ----- */

  function setupPuzzleBuilder() {
    const wrap = $("pb-groups");
    for (let i = 0; i < 4; i++) {
      const div = document.createElement("div");
      div.className = "form-grid";
      div.style.marginBottom = "0.9rem";

      const f1 = document.createElement("div");
      f1.className = "field";
      f1.style.margin = "0";
      const l1 = document.createElement("label");
      l1.textContent = `Group ${i + 1} name` + (i === 0 ? " (easiest)" : i === 3 ? " (hardest)" : "");
      const name = document.createElement("input");
      name.type = "text";
      name.id = `pb-name-${i}`;
      name.placeholder = "Scalar quantities";
      f1.append(l1, name);

      const f2 = document.createElement("div");
      f2.className = "field";
      f2.style.margin = "0";
      const l2 = document.createElement("label");
      l2.textContent = "Four words (comma-separated)";
      const words = document.createElement("input");
      words.type = "text";
      words.id = `pb-words-${i}`;
      words.placeholder = "Speed, Distance, Mass, Time";
      f2.append(l2, words);

      div.append(f1, f2);
      wrap.appendChild(div);
      name.addEventListener("input", updatePuzzleBuilder);
      words.addEventListener("input", updatePuzzleBuilder);
    }
    $("pb-title").addEventListener("input", updatePuzzleBuilder);
    $("pb-copy").addEventListener("click", () => copy($("pb-out").textContent, $("pb-copy")));
    updatePuzzleBuilder();
  }

  function updatePuzzleBuilder() {
    const title = $("pb-title").value.trim() || "New Puzzle";
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "new-puzzle";

    const groups = [];
    const allWords = [];
    const problems = [];
    for (let i = 0; i < 4; i++) {
      const name = $(`pb-name-${i}`).value.trim() || `Group ${i + 1}`;
      const words = $(`pb-words-${i}`).value.split(",").map((w) => w.trim()).filter(Boolean);
      if (words.length !== 4) problems.push(`Group ${i + 1} has ${words.length} word${words.length === 1 ? "" : "s"} (needs 4).`);
      words.forEach((w) => allWords.push(w.toLowerCase()));
      groups.push({ name, words });
    }
    if (new Set(allWords).size !== allWords.length) problems.push("Some words repeat across groups — every word must be unique.");
    $("pb-warn").textContent = problems.join(" ");
    $("pb-copy").disabled = problems.length > 0;

    const lines = groups.map(
      (g) => `      { name: ${q(g.name)}, words: [${g.words.map(q).join(", ")}] },`
    );
    $("pb-out").textContent =
      `  {\n    id: ${q(id)},\n    title: ${q(title)},\n    groups: [\n${lines.join("\n")}\n    ],\n  },`;
  }

  /* ----- Clipboard ----- */

  async function copy(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      const old = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(() => (btn.textContent = old), 1500);
    } catch {
      /* Clipboard blocked (e.g. http): leave the snippet selectable. */
      btn.textContent = "Select & copy manually";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupGate();
    renderAdminLinks();
    setupLinkBuilder();
    setupPuzzleBuilder();
  });
})();
