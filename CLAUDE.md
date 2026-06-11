# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file React app: `matematica-cnlg.jsx`. It is a Romanian-language math
practice app ("caietul meu de pregătire") for a 4th-grader preparing for the
admission/departajare test at Colegiul Național Gheorghe Lazăr (CNGL), Sibiu.
The default export is the `MatePentruLazar` component.

There is **no build tooling** — no `package.json`, bundler, linter, or test
setup. The file is meant to be dropped into a React host that provides `React`
and an optional `window.storage` API (an artifact/sandbox-style environment).
All persistence is best-effort and silently no-ops when `window.storage` is
absent. To run it, paste/import the component into a React sandbox; there are no
local build/lint/test commands to run.

**All user-facing strings are Romanian.** Keep new copy in Romanian and match
the existing diacritics and tone (`var(--ink)`, handwritten "caiet" styling).

## Architecture (single file, in order)

1. **Utilities** — `ri` (random int), `pick`, `fmt` (ro-RO grouping), `toRoman`,
   `normalize` + `checkAnswer`. **Answer checking is normalized**: uppercased,
   spaces/dots stripped, commas removed — so `"1.234"`, `"1234"`, `"iv"` and
   `"IV"` all match. Honor this when adding question types.

2. **Per-topic generators** `genXxx(l)` — one per topic, `l` is the level
   `1|2|3` (1 = încălzire, 2 = clasa a IV-a, 3 = ca la examen). Each returns a
   **question object** `{ q, a, expl }`, optionally with `choices: [...]` for
   multiple-choice. `a` is always a string compared via `checkAnswer`. Level 3
   branches usually delegate to the shared exam builders below.

3. **Exam-item builders** — `makeDivExpr`, `makeNested`, `makeEq2Step`,
   `makeConsecutive`, `makeComparatie`, `makeMersInvers`, `makePerspicacitate`.
   These model the real CNGL 2025 test's subject types. `makeVarianta()`
   assembles them into the **6-subject exam structure**: an array of subjects
   `{ nr, puncte, titlu, parts }`, where each `part` is
   `{ key, label, text, points, a, expl, inputLabel? }`. Grading is
   `nota = punctaj / 10` with **10 puncte din oficiu** added to the base.

4. **`TOPICS` / `LEVELS`** — `TOPICS` (11 entries) is the registry binding an
   `id`, display fields, and the `gen` function. To add a practice chapter, add
   a generator and one `TOPICS` entry; everything else (home grid, quick sim,
   progress tracking) is driven off this array.

5. **Storage** — `emptyProgress`, `loadProgress`, `saveProgress` against
   `window.storage` under key `mate-progres-v1`. Progress shape:
   `{ perTopic: { [id]: {ok,total} }, stars, examHistory: [...], level }`.
   `examHistory` is capped at the last 40 entries.

6. **CSS** — one template-literal string injected via `<style>`; CSS variables
   in `:root`. No external stylesheet.

7. **Components** — `Verdict`, `Stars`, `QuestionCard` (reused by both practice
   and quick-sim screens; `hideExpl` suppresses the explanation box).

8. **Main component `MatePentruLazar`** — a screen state machine via the
   `screen` state: `home → practice | quick | varianta`, each with its result
   screen (`quickResult`, `variantaResult`). Three modes:
   - **Antrenament**: endless single-topic practice at the chosen level.
   - **Simulare rapidă**: `QUICK_QUESTIONS` (9) random topics, `QUICK_SECONDS`
     (20 min) timer.
   - **Variantă tip examen**: full `makeVarianta()` exam, `VARIANTA_SECONDS`
     (60 min) timer, auto-submits on timeout.

## Conventions worth keeping

- Timers and the latest answers/score are mirrored into refs
  (`quickOkRef`, `varAnswersRef`) so the `setInterval` callbacks read current
  values without resetting on every render — preserve this pattern when
  touching timer logic.
- All progress writes go through `updateProgress(fn)`, which deep-clones,
  applies `fn`, and persists. Don't mutate `progress` directly.
- `inputMode` is `"text"` only for the `romane` and `fractii` topics (answers
  contain letters/`/`); everything else uses `"numeric"`.
- Generators must keep `q`/`text`, `a`, and `expl` internally consistent —
  `expl` shows the worked solution, so update it whenever you change the math.
