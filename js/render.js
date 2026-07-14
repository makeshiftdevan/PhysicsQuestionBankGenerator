/* Block renderer: turns lesson content blocks into DOM, wires up quizzes,
   fill-in-the-blank exercises, copy buttons, etc. */
(function () {
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- individual block renderers ---------- */

  function renderCode(block) {
    const wrap = el("div", "codeblock");
    const bar = el("div", "codeblock-bar");
    bar.appendChild(el("span", "", block.caption || "Java"));
    const btn = el("button", "copy-btn", "Copy");
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(block.code).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = "Copy"), 1400);
      });
    });
    bar.appendChild(btn);
    wrap.appendChild(bar);
    const pre = el("pre");
    const code = el("code");
    code.innerHTML = window.highlightJava(block.code);
    pre.appendChild(code);
    wrap.appendChild(pre);
    return wrap;
  }

  function renderNote(block) {
    const icons = { tip: "💡", warn: "⚠️", info: "ℹ️", rule: "📏" };
    const wrap = el("div", "note " + (block.style || "info"));
    wrap.appendChild(el("div", "note-icon", icons[block.style] || "ℹ️"));
    wrap.appendChild(el("div", "", block.html));
    return wrap;
  }

  function renderTable(block) {
    const wrap = el("div", "tbl-wrap");
    const t = el("table", "tbl");
    const thead = el("thead");
    const trh = el("tr");
    block.head.forEach(h => trh.appendChild(el("th", "", h)));
    thead.appendChild(trh);
    t.appendChild(thead);
    const tbody = el("tbody");
    block.rows.forEach(r => {
      const tr = el("tr");
      r.forEach(c => tr.appendChild(el("td", "", c)));
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    wrap.appendChild(t);
    return wrap;
  }

  function renderQuiz(block, lessonId, idx) {
    const wrap = el("div", "quiz");
    wrap.appendChild(el("div", "quiz-tag", "✔ Check yourself"));
    wrap.appendChild(el("div", "quiz-q", block.q));

    const explain = el("div", "quiz-explain");
    const letters = ["A", "B", "C", "D", "E"];
    const buttons = [];

    block.opts.forEach((opt, i) => {
      const b = el("button", "quiz-opt");
      b.appendChild(el("span", "opt-letter", letters[i] + "."));
      b.appendChild(el("span", "", opt));
      b.addEventListener("click", () => {
        buttons.forEach(x => (x.disabled = true));
        if (i === block.a) {
          b.classList.add("correct");
          explain.innerHTML =
            '<span class="verdict ok">Correct! </span>' + block.explain;
        } else {
          b.classList.add("wrong");
          buttons[block.a].classList.add("correct");
          explain.innerHTML =
            '<span class="verdict no">Not quite. </span>' + block.explain;
        }
        explain.classList.add("show");
        window.App && window.App.recordQuiz(lessonId, idx, i === block.a);
      });
      buttons.push(b);
      wrap.appendChild(b);
    });

    wrap.appendChild(explain);
    return wrap;
  }

  /* Fill-in-the-blank: block.code contains @@n@@ placeholders,
     block.blanks[n-1] = { answer: "..." | ["...", "alt"], size } */
  function renderFill(block) {
    const wrap = el("div", "fill");
    wrap.appendChild(el("div", "fill-tag", "⌨ Your turn — complete the code"));
    if (block.intro) wrap.appendChild(el("div", "fill-intro", block.intro));

    const pre = el("pre");
    const parts = block.code.split(/@@(\d+)@@/);
    const inputs = [];
    // parts alternate: text, blankIndex, text, blankIndex...
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        const span = document.createElement("span");
        span.innerHTML = window.highlightJava(parts[i]);
        pre.appendChild(span);
      } else {
        const bIdx = parseInt(parts[i], 10) - 1;
        const blank = block.blanks[bIdx];
        const input = document.createElement("input");
        input.className = "blank";
        input.type = "text";
        input.spellcheck = false;
        input.autocomplete = "off";
        input.placeholder = blank.hint || "?";
        if (blank.size) input.style.width = blank.size + "px";
        input.dataset.blank = bIdx;
        inputs.push(input);
        pre.appendChild(input);
      }
    }
    wrap.appendChild(pre);

    const controls = el("div", "fill-controls");
    const check = el("button", "btn small", "Check answers");
    const reveal = el("button", "btn ghost small", "Show solution");
    const result = el("span", "fill-result");

    function norm(s) {
      return s.replace(/\s+/g, " ").replace(/\s*([().,;=*+\-\/<>\[\]])\s*/g, "$1").trim().toLowerCase();
    }
    function answersFor(bIdx) {
      const a = block.blanks[bIdx].answer;
      return Array.isArray(a) ? a : [a];
    }

    check.addEventListener("click", () => {
      let good = 0;
      inputs.forEach(inp => {
        const ok = answersFor(+inp.dataset.blank).some(
          a => norm(a) === norm(inp.value)
        );
        inp.classList.toggle("ok", ok);
        inp.classList.toggle("bad", !ok);
        if (ok) good++;
      });
      if (good === inputs.length) {
        result.textContent = "✔ All " + good + " correct — nice work!";
        result.className = "fill-result ok";
      } else {
        result.textContent = good + " / " + inputs.length + " correct — keep trying!";
        result.className = "fill-result no";
      }
    });

    reveal.addEventListener("click", () => {
      inputs.forEach(inp => {
        inp.value = answersFor(+inp.dataset.blank)[0];
        inp.classList.remove("bad");
        inp.classList.add("ok");
      });
      result.textContent = "Solution shown — try to remember it!";
      result.className = "fill-result";
    });

    controls.appendChild(check);
    controls.appendChild(reveal);
    controls.appendChild(result);
    wrap.appendChild(controls);
    return wrap;
  }

  function renderSim(block) {
    const wrap = el("div", "sim");
    wrap.appendChild(el("div", "sim-tag", "🕹 Interactive lab"));
    if (window.Sims && window.Sims[block.name]) {
      window.Sims[block.name](wrap);
    } else {
      wrap.appendChild(el("p", "", "Simulator not found: " + esc(block.name)));
    }
    return wrap;
  }

  /* ---------- main entry ---------- */
  function renderBlocks(blocks, container, lessonId) {
    let quizIdx = 0;
    blocks.forEach(block => {
      let node = null;
      switch (block.t) {
        case "h2":   node = el("h2", "", block.text); break;
        case "h3":   node = el("h3", "", block.text); break;
        case "p":    node = el("p", "", block.html); break;
        case "ul":   node = el("ul", "", block.items.map(i => "<li>" + i + "</li>").join("")); break;
        case "ol":   node = el("ol", "", block.items.map(i => "<li>" + i + "</li>").join("")); break;
        case "code": node = renderCode(block); break;
        case "note": node = renderNote(block); break;
        case "table": node = renderTable(block); break;
        case "quiz": node = renderQuiz(block, lessonId, quizIdx++); break;
        case "fill": node = renderFill(block); break;
        case "sim":  node = renderSim(block); break;
        default: break;
      }
      if (node) container.appendChild(node);
    });
  }

  window.Render = { renderBlocks, el, esc };
})();
