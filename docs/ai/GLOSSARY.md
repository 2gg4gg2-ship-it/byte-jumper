# Glossary: owner's words → meaning (he writes Russian, short, half-sentences)
## People / world
- Искра (Spark) — the hero, white faceted robot, black face, glowing eyes. Atlas `spark/spark.png` + `spark.js`. "Character stays almost the same" is a standing wish.
- Бит (Bit) — companion voice giving hints/lore. Потеряшка (Lost One, `L` token) — small NPC to rescue; 100 planned, 1 per level on many levels; "Архив" = collection screen.
- Kairema — owner's main app; game folder is inserted there (`docs/RETURN_TO_KAIREMA.md`, `docs/tools/sync_to_kairema.py`). Never rename `features/game/*`.
- Босс/босы — bosses on levels 10,20,…; hearts 3. Глава (chapter) = 10 levels. 100 levels planned, now 1–49 playable by chapters (see STATUS).
## Gameplay words
- уровень/лвл — level, 5 hearts (сердца), a hit = lose heart, 1.3 s invulnerable. "Потеря сердца" = hit.
- азарт — excitement: rhythm, combos, near-misses, risk/reward, variety (Red Ball / Geometry Dash / Vector feel). NOT rows of identical spikes.
- "полный бот" = full beam-search bot `docs/tests/bot.js` (plays near-perfectly). "обычный/простой бот" = naive tap bot `simplebot.js`. Owner target: full bot clears levels 1–5 losing ≤1 heart, 6–10(9) ≤2 hearts; simple bot must NOT clear.
- "50% сложнее" = ≥1.5× obstacle count at same or shorter length (tests `levels15.test.js`).
- ускоритель = `Bo` boost pad (+40% speed 1.5 s, jump ×1.18). батут = `Jp` pad. зиплайн/провод = `Zr` light wire. магнитная стена = `Mg`. портал-инвертор = `Pi` (walk on ceiling). хрупкий кэш/блок = `Fr`. Потолочные `cb`/`cx`.
- шипы = `K`, бяка/баг = `U`, стена = `Wl`, яма = `P`, ворота = `g`, лазер = `lz`, залпы договоров = `v`.
- "проваливается через пол", "телепортирует", "возвращает" = collision tunnelling or respawn logic (see DEBUGGING.md §Known classes).
- "не получаю урон от падения" = falling off platforms in boss arenas must not hurt.
## Meta words
- "спагетти" = tangled code. Wanted: each thing in ONE obvious place, easy to add/fix/change (see CODE_STYLE.md).
- "лимит" = his Claude quota is nearly spent: be fast, minimal, no long reads, no chatter.
- "сделай как на фотке/референсе" = match the attached image's look; replicate, don't reinvent.
- "дизайн / графика" = drawing only (layer 2); obstacles keep their positions and hitboxes.
- Шлюз = chapter gateway (story). Дом Золотой Подписки = parody of subscriptions (ch.5). Договор = contract window / volley of contract drones depending on context. Звёзды = stars per level (save `sv.st`). Байты = collectibles (score, level % ).
