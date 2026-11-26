# ART — graphics rules (layer 2 only; hitboxes untouched)
All drawn by code on canvas (`art.js` backgrounds/HUD/ground, `levelview.js` obstacles/platforms, `bossart.js`, `spark.js` hero atlas, `fx.js`). Palette `GameArt.C` (currently strict black/grey/white + red for danger, 0.7.1). Backgrounds: 4 scenes `SC` rows, each 5 levels, parallax from `S.x`, particles scale with `GameCore.perf.q`.
## Owner's current art wishes (not yet done unless STATUS says so)
- Hero: keep as is, but restore ORIGINAL COLOUR (white/lavender shell, black face, cyan eyes, amber gem) — the atlas was made grey at owner's earlier request; he now wants colour back. Source sheets are the owner's PNGs (RGBA); tool plan: `docs/tools/colorize_spark_base.py` (maps coloured sheet frames onto `docs/tools/spark_base.png` by silhouette IoU; script overwrites `spark_base.png` in place: run it on a COPY (original B/W base is in git history); frames d1,d2 (damage) did not match >0.7, redo by hand), then `make_spark_atlas.py` rebuilds `spark/spark.png` + `ATL` in spark.js.
- Scene: "space"/digital-void look from owner's reference (dark navy server towers, falling code text, floating "System Error / ALLOW? / 0x404" windows, platforms = code windows with title bar, ERROR (red) / WARN (green) glowing lines, gold crystal byte counter, white hearts). Obstacles keep positions and hitboxes; only their look changes.
- Work in steps: hero colour → chapter-1 background + window platforms → obstacles restyle → other chapters (chapter = own tint). Show owner a screenshot after step 1–2 before continuing.
## Rules
- Do not read hitboxes from drawing code; draw from item/platform fields. Do not add logic to art files.
- Offline: assets only inside `app/src/main/assets`; keep atlas small (<300 KB total new art); prefer procedural gradients/glow (`glowDot`, `grad`, `cham`) over PNG for backgrounds.
- Cache static layers (art.js already caches layer canvases); no per-frame gradient creation for big areas.
- Reference images come from owner chat only; never download/copy third-party art.
