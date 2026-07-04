# SkaPhysics — redesigned

A sleek, minimalist rebuild of skaphysics.com. Pure static HTML/CSS/JS — no
build step, no frameworks, no database. Host it anywhere (GitHub Pages works
out of the box).

## Pages

| Page | File | In nav? |
|---|---|---|
| Home | `index.html` | yes |
| Physics 1 Honors | `physics-1-honors.html` | yes |
| AP Physics 1 | `ap-physics-1.html` | yes |
| AP Physics C | `ap-physics-c.html` | yes |
| Skanections (game) | `skanections.html` | yes |
| Teacher Tools | `teacher-tools.html` | **hidden** |

### Teacher Tools (hidden)

Not linked from the nav. Two ways in:

1. Click the small **Σ** next to the copyright line in the footer of any page.
2. Go straight to `teacher-tools.html`.

The page then asks for a passphrase (**parabola** — change `ANSWER` in
`assets/teacher-tools.js`). This is a courtesy lock to keep students out, not
real security — nothing secret should live on a static site.

## Adding / editing links (the common task)

Everything on the site is rendered from **one file: `data/site-data.js`**.

- To add a link to a unit: find the class → unit → `links` list, and add one line:
  `{ label: "Unit 3 Notes", url: "https://...", type: "doc" },`
- To add a whole unit: copy an existing unit block and edit it.
- To add a class: copy a class block, give it a new `id`, and create
  `<new-id>.html` by copying `physics-1-honors.html` and changing its
  `data-page` and `<title>`. The nav updates automatically.

The **Link Builder** on the Teacher Tools page writes these snippets for you.

## Skanections

A "find four groups of four" word game. Puzzles live in **`data/puzzles.js`**;
a ★ puzzle-of-the-day rotates through the list by date, and older puzzles stay
playable from the picker.

To add a puzzle, copy a block in `data/puzzles.js` — or use the **Puzzle
Builder** on the Teacher Tools page, which validates your groups (4×4, no
duplicate words) and writes the snippet.

Gameplay improvements in this version: fair shuffle, tap-to-deselect,
"one away!" hints, repeated wrong guesses don't cost an extra mistake,
four-mistake limit with full answer reveal, difficulty-shaded solved groups,
copyable emoji results, keyboard/screen-reader support, and mobile-friendly
tiles.

## Local preview

Open `index.html` in a browser, or run:

```
python3 -m http.server 8000
```

and visit http://localhost:8000.
