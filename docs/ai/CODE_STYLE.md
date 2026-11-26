# CODE_STYLE — no spaghetti (owner: "like Terraria's code is what we avoid")
## Shape
- Layers: 0 core.js · 1 logic (engine, levels, arena, boss12, story, flags, abilities; NO DOM, runs in node) · 2 drawing (art, bossart, boss12view, levelview, spark, fx; reads `S`, decides nothing) · 3 screens (game.js, storyui.js). Lower layers never call higher ones. `check_arch.py` fails the build on violations.
- One concept = one place. Before writing, `grep` for an existing helper (`aim`, `hit`, `lose`, `arc`, `row`, `glowDot`, `cham`, `grad`). Duplicate logic is a bug.
- Data over code: levels are token strings, bosses are kits of small functions, scenes are rows in tables (`SC`, `LOST`, `INTRO`). To add content, add a row/branch, not a new system.
- Functions ≤ ~25 lines, files ≤ 450 lines (script warns). If a file grows, split by responsibility (`sound.js` out of game.js etc.), add `<script>` in `index.html` BEFORE game.js, add the file to `MOD` in `docs/tools/check_arch.py` and to the layer table in `docs/ARCHITECTURE.md`, regenerate MAP.
- Names: short but meaningful; comments in Russian are fine in existing files (keep style), new `docs/ai` is English. A comment explains WHY / numbers' units (px, s), not WHAT.
- No globals except the module objects (`GameEngine`, …). State lives in `S` (clonable plain data: bots clone it). No `Math.random()` in logic (use `S.rnd()`), no `Date.now()` in logic.
- Performance: no allocation in per-frame hot paths where avoidable; respect `GameCore.perf.q` for particles; cap arrays (shots ≤ 20).
- Never: network, libraries, emoji, `innerHTML` with user text, renaming `features/game/*` paths.
## Changing existing code
Smallest diff that fixes the cause (not the symptom). Add a regression test that FAILS on the old code (verify by temporarily reverting the fix — a test that passes on old code is worthless). Do not refactor unrelated code in a feature delivery.
## Before delivery checklist
tests for the touched layer · `check_arch.py` 0 violations · `make_map.py` + `--check` · version ×3 (`app/build.gradle.kts` `versionCode = N` / `versionName = "X.Y.Z"` lines with `=`, README "Текущая версия", CHANGELOG top line) · STATUS.md · full zip.
