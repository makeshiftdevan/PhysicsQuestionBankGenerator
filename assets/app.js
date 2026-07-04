/* SkaPhysics shared rendering. Reads SITE_DATA from data/site-data.js. */
(function () {
  "use strict";

  const ICONS = {
    doc: "\u{1F4C4}",      // page
    video: "▶",       // play
    practice: "✏",    // pencil
    sim: "⚙",         // gear
    external: "↗",    // arrow
  };

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else node.setAttribute(k, v);
      }
    }
    (children || []).forEach((c) => node.appendChild(c));
    return node;
  }

  function linkItem(link) {
    const icon = ICONS[link.type] || ICONS.external;
    const a = el("a", { href: link.url, target: "_blank", rel: "noopener" });
    a.appendChild(el("span", { class: "link-icon", text: icon, "aria-hidden": "true" }));
    a.appendChild(el("span", { text: link.label }));
    return el("li", null, [a]);
  }

  /* ----- Header / nav ----- */

  function renderHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;

    const page = document.body.dataset.page || "";
    const navItems = [
      { id: "home", label: "Home", href: "index.html" },
      ...SITE_DATA.classes.map((c) => ({ id: c.id, label: c.name, href: c.id + ".html" })),
      { id: "skanections", label: "Skanections", href: "skanections.html" },
    ];

    const nav = el("nav", { class: "site-nav", id: "site-nav", "aria-label": "Main" });
    navItems.forEach((item) => {
      const a = el("a", { href: item.href, text: item.label });
      if (item.id === page) a.setAttribute("aria-current", "page");
      nav.appendChild(a);
    });

    const brand = el("a", { class: "brand", href: "index.html" });
    brand.appendChild(el("span", { class: "brand-mark", text: "Σ " }));
    brand.appendChild(document.createTextNode(SITE_DATA.siteName));

    const toggle = el("button", {
      class: "nav-toggle",
      "aria-label": "Menu",
      "aria-expanded": "false",
      text: "☰",
    });
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    const container = el("div", { class: "container" }, [brand, toggle, nav]);
    mount.appendChild(container);
  }

  /* ----- Footer (with the quiet Σ door to Teacher Tools) ----- */

  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;

    const container = el("div", { class: "container" });
    container.appendChild(
      el("span", { text: "© " + new Date().getFullYear() + " " + SITE_DATA.siteName })
    );

    // Unlabeled sigma: click it to reach Teacher Tools. Students see decoration.
    container.appendChild(el("a", { class: "sigma-door", href: "teacher-tools.html", "aria-label": "Sigma", text: "Σ" }));

    const nav = el("nav", { "aria-label": "Social" });
    (SITE_DATA.social || []).forEach((s) => {
      nav.appendChild(el("a", { href: s.url, target: "_blank", rel: "noopener", text: s.label }));
    });
    container.appendChild(nav);
    mount.appendChild(container);
  }

  /* ----- Home page ----- */

  function renderHome() {
    const grid = document.getElementById("class-cards");
    if (grid) {
      SITE_DATA.classes.forEach((c) => {
        const card = el("a", { class: "card", href: c.id + ".html" });
        card.appendChild(el("h3", { text: c.name }));
        card.appendChild(el("p", { text: c.blurb }));
        card.appendChild(el("span", { class: "card-cta", text: "Open course →" }));
        grid.appendChild(card);
      });

      const game = el("a", { class: "card", href: "skanections.html" });
      game.appendChild(el("h3", { text: "Skanections" }));
      game.appendChild(el("p", { text: "The daily physics word-grouping game. Find four groups of four." }));
      game.appendChild(el("span", { class: "card-cta", text: "Play →" }));
      grid.appendChild(game);
    }

    const quick = document.getElementById("quick-links");
    if (quick) {
      (SITE_DATA.quickLinks || []).forEach((l) => quick.appendChild(linkItem(l)));
    }
  }

  /* ----- Class pages ----- */

  function renderClassPage() {
    const mount = document.getElementById("units");
    if (!mount) return;

    const cls = SITE_DATA.classes.find((c) => c.id === document.body.dataset.page);
    if (!cls) return;

    const title = document.getElementById("class-title");
    const blurb = document.getElementById("class-blurb");
    if (title) title.textContent = cls.name;
    if (blurb) blurb.textContent = cls.blurb;
    document.title = cls.name + " · " + SITE_DATA.siteName;

    const legacy = document.getElementById("legacy-link");
    if (legacy && cls.legacyUrl) {
      legacy.href = cls.legacyUrl;
    } else if (legacy) {
      legacy.remove();
    }

    cls.units.forEach((unit, i) => {
      const details = el("details", { class: "unit" });
      if (i === 0) details.setAttribute("open", "");

      const summary = el("summary");
      summary.appendChild(el("span", { class: "unit-title", text: unit.title }));
      if (unit.description) summary.appendChild(el("span", { class: "unit-desc", text: unit.description }));
      summary.appendChild(el("span", { class: "chevron", "aria-hidden": "true", text: "›" }));
      details.appendChild(summary);

      const body = el("div", { class: "unit-body" });
      if (unit.links && unit.links.length) {
        const ul = el("ul", { class: "link-list" });
        unit.links.forEach((l) => ul.appendChild(linkItem(l)));
        body.appendChild(ul);
      } else {
        body.appendChild(el("p", { class: "empty-note", text: "Resources coming soon." }));
      }
      details.appendChild(body);
      mount.appendChild(details);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    renderHome();
    renderClassPage();
  });
})();
