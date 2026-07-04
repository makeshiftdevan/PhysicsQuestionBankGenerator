/* Skanections — find four groups of four.
   Puzzles live in data/puzzles.js (SKANECTIONS_PUZZLES).

   Improvements over the old version:
   - validated puzzles (bad data is skipped with a console warning, not a broken board)
   - fair Fisher–Yates shuffle
   - tap to deselect; Deselect All and Shuffle buttons
   - repeated wrong guesses don't cost an extra mistake
   - "One away!" feedback
   - solved groups float to the top, shaded by difficulty
   - four-mistake limit with a full answer reveal
   - shareable emoji results (copy to clipboard)
   - puzzle-of-the-day rotation plus a picker for past puzzles
   - keyboard and screen-reader friendly, works on phones
*/
(function () {
  "use strict";

  const MAX_MISTAKES = 4;
  const TIER_EMOJI = ["🟦", "🟩", "🟨", "🟪"]; // easiest → hardest

  /* ----- Puzzle validation ----- */

  function validPuzzle(p) {
    if (!p || !p.id || !p.title || !Array.isArray(p.groups) || p.groups.length !== 4) return false;
    const words = [];
    for (const g of p.groups) {
      if (!g.name || !Array.isArray(g.words) || g.words.length !== 4) return false;
      for (const w of g.words) {
        if (typeof w !== "string" || !w.trim()) return false;
        words.push(w.trim().toLowerCase());
      }
    }
    return new Set(words).size === 16;
  }

  const PUZZLES = (typeof SKANECTIONS_PUZZLES !== "undefined" ? SKANECTIONS_PUZZLES : []).filter(
    (p) => {
      const ok = validPuzzle(p);
      if (!ok) console.warn("Skanections: skipping invalid puzzle", p && p.id);
      return ok;
    }
  );

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function todayIndex() {
    const days = Math.floor(Date.now() / 86400000);
    return days % PUZZLES.length;
  }

  /* ----- Game state ----- */

  let puzzle = null;
  let tiles = [];        // [{ word, tier }]
  let selected = new Set(); // words
  let solvedTiers = [];  // tiers in solve order
  let mistakes = 0;
  let guessed = new Set(); // canonical wrong guesses
  let guessHistory = [];   // arrays of tiers, for the share grid
  let over = false;

  const $ = (id) => document.getElementById(id);

  function tierOf(word) {
    return puzzle.groups.findIndex((g) => g.words.includes(word));
  }

  function startPuzzle(index) {
    puzzle = PUZZLES[index];
    selected = new Set();
    solvedTiers = [];
    mistakes = 0;
    guessed = new Set();
    guessHistory = [];
    over = false;
    tiles = shuffle(puzzle.groups.flatMap((g, tier) => g.words.map((word) => ({ word, tier }))));
    $("ska-picker").value = String(index);
    render();
    setStatus("Find four groups of four.");
  }

  /* ----- Rendering ----- */

  function render() {
    const board = $("ska-board");
    board.innerHTML = "";

    // Solved groups first, in the order they were found.
    solvedTiers.forEach((tier) => {
      const g = puzzle.groups[tier];
      const row = document.createElement("div");
      row.className = "ska-solved-row";
      row.dataset.tier = String(tier);
      row.innerHTML =
        '<div class="g-name"></div><div class="g-words"></div>';
      row.querySelector(".g-name").textContent = g.name;
      row.querySelector(".g-words").textContent = g.words.join(", ");
      board.appendChild(row);
    });

    // Remaining tiles.
    const remaining = tiles.filter((t) => !solvedTiers.includes(t.tier));
    if (remaining.length) {
      const grid = document.createElement("div");
      grid.className = "ska-grid";
      remaining.forEach((t) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ska-tile" + (selected.has(t.word) ? " selected" : "");
        btn.textContent = t.word;
        btn.setAttribute("aria-pressed", String(selected.has(t.word)));
        btn.disabled = over;
        btn.addEventListener("click", () => toggle(t.word));
        grid.appendChild(btn);
      });
      board.appendChild(grid);
    }

    // Mistake dots.
    const dots = $("ska-dots");
    dots.innerHTML = "";
    for (let i = 0; i < MAX_MISTAKES; i++) {
      const d = document.createElement("span");
      d.className = "ska-dot" + (i < mistakes ? " used" : "");
      dots.appendChild(d);
    }

    $("ska-submit").disabled = over || selected.size !== 4;
    $("ska-deselect").disabled = over || selected.size === 0;
    $("ska-shuffle").disabled = over || remaining.length === 0;
  }

  function setStatus(msg) {
    $("ska-status").textContent = msg;
  }

  let toastTimer = null;
  function toast(msg) {
    const t = $("ska-toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ----- Interaction ----- */

  function toggle(word) {
    if (over) return;
    if (selected.has(word)) selected.delete(word);
    else if (selected.size < 4) selected.add(word);
    else toast("Only four at a time — deselect one first.");
    render();
  }

  function shakeSelected() {
    document.querySelectorAll(".ska-tile.selected").forEach((el) => {
      el.classList.add("shake");
      el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
    });
  }

  function submit() {
    if (over || selected.size !== 4) return;

    const words = [...selected];
    const key = words.map((w) => w.toLowerCase()).sort().join("|");
    if (guessed.has(key)) {
      toast("Already guessed that one!");
      shakeSelected();
      return;
    }

    const tiers = words.map(tierOf);
    guessHistory.push([...tiers].sort((a, b) => a - b));

    const counts = {};
    tiers.forEach((t) => (counts[t] = (counts[t] || 0) + 1));
    const best = Math.max(...Object.values(counts));

    if (best === 4) {
      const tier = tiers[0];
      solvedTiers.push(tier);
      selected = new Set();
      render();
      if (solvedTiers.length === 4) {
        finish(true);
      } else {
        setStatus(["Nice!", "Great!", "Keep going!"][Math.floor(Math.random() * 3)]);
      }
      return;
    }

    guessed.add(key);
    mistakes++;
    shakeSelected();
    if (best === 3) toast("One away!");
    else toast("Not a group.");

    if (mistakes >= MAX_MISTAKES) {
      finish(false);
    } else {
      render();
      setStatus(`${MAX_MISTAKES - mistakes} mistake${MAX_MISTAKES - mistakes === 1 ? "" : "s"} remaining.`);
    }
  }

  function finish(won) {
    over = true;
    if (!won) {
      // Reveal the rest, easiest first.
      for (let tier = 0; tier < 4; tier++) {
        if (!solvedTiers.includes(tier)) solvedTiers.push(tier);
      }
    }
    selected = new Set();
    render();
    setStatus("");

    const card = $("ska-endcard");
    card.hidden = false;
    $("ska-end-title").textContent = won
      ? ["Flawless!", "Excellent!", "Solid!", "Phew!"][mistakes]
      : "So close!";
    $("ska-end-sub").textContent = won
      ? `Solved “${puzzle.title}” with ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`
      : `The answers for “${puzzle.title}” are revealed above.`;
    $("ska-share-grid").textContent = shareGrid();
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function shareGrid() {
    return guessHistory
      .map((tiers) => tiers.map((t) => TIER_EMOJI[t]).join(""))
      .join("\n");
  }

  async function share() {
    const text = `Skanections · ${puzzle.title}\n${shareGrid()}`;
    try {
      await navigator.clipboard.writeText(text);
      toast("Results copied — paste anywhere!");
    } catch {
      toast("Couldn't copy automatically — select the grid above.");
    }
  }

  /* ----- Setup ----- */

  document.addEventListener("DOMContentLoaded", () => {
    if (!PUZZLES.length) {
      setStatus("No puzzles found. Add one in data/puzzles.js.");
      return;
    }

    const picker = $("ska-picker");
    PUZZLES.forEach((p, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = (i === todayIndex() ? "★ " : "") + p.title;
      picker.appendChild(opt);
    });
    picker.addEventListener("change", () => startPuzzle(Number(picker.value)));

    $("ska-submit").addEventListener("click", submit);
    $("ska-deselect").addEventListener("click", () => { selected = new Set(); render(); });
    $("ska-shuffle").addEventListener("click", () => { shuffle(tiles); render(); });
    $("ska-again").addEventListener("click", () => {
      $("ska-endcard").hidden = true;
      startPuzzle(Number(picker.value));
    });
    $("ska-share").addEventListener("click", share);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !over && selected.size === 4 && document.activeElement.tagName !== "BUTTON") {
        submit();
      }
    });

    startPuzzle(todayIndex());
  });
})();
