# STATUS — what exists, what is planned (LIVE document: update every delivery; verify claims with grep before trusting)
Last updated at version 0.16.3 (logic files unchanged since 0.13.8). Story/world source: `docs/STORY_BIBLE.md` («Искра: Нулевой Ключ», 10 chapters × 10 levels = 100 levels, 10 bosses, 4 endings, "помехи" screen glitches grow with bosses beaten).

## DONE (in the game now)
- Engine: fixed-step physics, tap/hold jump, 5 hearts (levels) / 3 (bosses), invulnerability, swept ground landing (0.13.8), pits with retry/return, endless mode, stars/bytes, save v2 with migrations (`flags.js`), ability registry (`abilities.js`), 3-level interference setting.
- Blocks (0.13.0+): pad `Jp/j`, fragile `Fr/fr`, light wire `Zr/zl`, magnet wall `Mg/mg`, inverter portal `Pi/pi` + ceiling `cb/cx`, booster `Bo/bo`; older: spikes, bugs, walls, pits, platform chains, gates, volleys, ghosts, lasers, drops, saw, moving blocks, decoy, Lost One, checkpoint, container.
- Levels with hand-built scenarios (`DEF`): 1–9, 11–19, 21–29, 31–39, 41–49 (boss levels 10,20,30,40,50 are arenas). Reworked "азартно" with exact-placement tokens (bots verified): 1–5 (0.13.2), 6–9 (0.13.4), 11–17 (0.13.7). 18–19, 21–29, 31–49 are older, spike-heavy, same style as the pre-0.13 levels → candidates for rework. Levels 50+ use the old generator in `engine.js` (no `DEF`).
- Bosses 1–10 playable (`kit1..kit10`, art in `bossart.js`; 1–2 extra in `boss12*.js`); boss 1 «Ошибка 404» easier to hit (0.13.6), falling in arenas costs no heart (0.13.8). Finale/endings exist in `game.js` (level 100).
- Hero: Spark atlas in COLOUR (0.13.9), 23 frames + eye variants, dash trail and damage cracks drawn in `spark.js`. Visual layer by concept images: window platforms, ERROR/WARN lines, gold bytes, bugs, Lost Ones (0.14.0); chapter backgrounds for ALL 100 levels (0.14.1–0.16.0, 10 chapters). See ART.md.
- Tools: bots, level tests per range, architecture check, auto map, Kairema sync.

## IN PROGRESS / NEXT (owner asked, not finished)
0. Visual step 1 done in 0.16.2 (readability, ground windows, brighter sky, bigger hero); step 2 done in 0.16.3 (chapter-1 dump scrap, scary bug and spike look). Owner approved order: step 2 chapter-1 dump in detail (folder/file piles, crossed icons, broken monitors, windows in heaps, warm light), step 3 HUD like concept + obstacle restyle only (obstacles may be restyled, not moved), step 4 other chapters.
1. **Visual part 3 + polish to ~90% of the concept images**: HUD (white hearts, "BYTES: 045" + gold diamond, settings button), obstacle polish, echo-dash pose with amber side gem. Start with a screenshot comparison (ART.md). Do not touch hitboxes.
## PLANNED (do NOT start without owner's go)
- Rework levels 18–19, 21–29, 31–49 like 1–17 (sections, combos, new blocks; bots: full bot ≤2 hearts, simple bot fails); then generated 50–99 → hand-built.
- Lost Ones ×100 (only some exist), choices at levels 36/45/88/96 for endings «Исправление»/«Полное Авто», New Game+, abilities from bosses affecting physics, "new run" button, developer tools (skip level, immortality) in hidden mode, shared boss intro storyboard (4.5 s), boss reward/«Think» effect, text inserts by Bit at "off" interference.
- More hero forms (evolutions e1–e3 only have a still frame).
- Boss 2 «Колосс Переполнения» full design (tower, darkness, POP) if not yet matching BOSSES.md; simple AI flag for boss 1.
- Progression/monetization ideas from owner (boss gate by Lost Ones/stars, lore "contracts" with the Golden Subscription House, packets, gateway timers): see `docs/ai/IDEAS.md`. Undecided; monetization model not chosen; real ads impossible under the offline/no-library rule.
## Owner wishes (standing)
- Levels exciting like Red Ball / Geometry Dash / Vector; L1 ≈ 20 s, L5 ≈ 45 s; harmony and balance; not longer than before without ask.
- Code easy to add/fix/change, no spaghetti; cheap-model-friendly instructions (this pack).
- Character stays almost the same; do not break gameplay when changing visuals.
- Fast answers, Russian, honest lists "Проверено / Не проверено".
## Known limits (honest)
No APK build or phone test is possible in the assistant sandbox; feel/balance judged only by bots and numbers. Git push is usually forbidden (403) → zip delivery. `levels.test.js` is slow (minutes).
