# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file React + TypeScript app: `matematica-cnlg.tsx`. It is a
Romanian-language math practice app ("caietul meu de pregătire") for a 4th-grader
preparing for the admission/departajare test at Colegiul Național Gheorghe Lazăr
(CNGL), Sibiu. The default export is the `MatePentruLazar` component.

The component is bundled by **Vite** and ships as an installable **PWA** (offline
support via a generated service worker). It is still authored as one self-contained
file: `src/main.tsx` only wires up the React root and, in the browser, backs the
optional `window.storage` host API with `localStorage`. All persistence is
best-effort and silently no-ops when `window.storage` is absent.

### Commands

- `npm run dev` — Vite dev server (the PWA/service worker is disabled in dev).
- `npm run build` — `tsc -b` typecheck + `vite build` (emits `dist/`, incl. the
  service worker and `manifest.webmanifest`).
- `npm run preview` — serve the production build locally (use this to exercise
  the installable/offline PWA behaviour).
- `npm run typecheck` — types only (`tsc -b --noEmit`).
- `npm run icons` — regenerate the PWA icon set in `public/` from inline SVG
  (`scripts/generate-icons.mjs`, needs `sharp`). The app's color palette is
  duplicated there — keep it in sync with the CSS variables if colors change.

The site is served from a project subpath (`base: "/exam/"` in `vite.config.ts`),
so the manifest `scope`/`start_url` and all asset URLs are prefixed with `/exam/`.
GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys `dist/` to
GitHub Pages.

### Conventions for TypeScript

Domain types live at the top of `matematica-cnlg.tsx`: `Question` (what every
`genXxx`/`makeXxx` builder returns), `Topic`, the exam shapes (`ExamSubject`,
`ExamPart`, `GradedSubject`, `ExamResult`), and `Progress`. When adding a topic
or exam-item builder, type it against these (generators are typed `Generator =
(l: Level) => Question`) rather than introducing ad-hoc shapes. `window.storage`
is typed in `src/vite-env.d.ts`.

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
   `{ perTopic: { [id]: {ok,total} }, stars, examHistory: [...],
   daily: { [YYYY-MM-DD]: {ok,total,quest?} }, badges: { [id]: YYYY-MM-DD },
   level }`. `examHistory` is capped at the last 40 entries; `loadProgress`
   back-fills missing `daily`/`badges` for older saves.

   **Gamification** (all derived from this Progress, no extra persistence
   beyond `daily.quest` + `badges`): the home screen is a *journey map*
   (`masteryOf` → a chapter is "stăpânit" at `MASTERY_OK` correct answers),
   a *daily quest* (`DAILY_GOAL` exercises/day → `QUEST_REWARD` bonus stars,
   awarded once via the `daily[*].quest` flag), *star ranks* (`RANKS`/`rankOf`)
   and *badges* (`BADGES`/`awardBadges`, called inside every `updateProgress`
   that changes stats). New ranks/badges fire a celebration toast detected by
   a `useEffect` diffing `progress`; correct answers burst `<Confetti/>`.

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
