# LEVELS — how to build / rebuild a level (file: `features/game/levels.js`, logic layer, no DOM)
A level = `DEF[N] = {seq:'token token …'}` + intro text `INTRO[N]` + Lost One `LOST[N]`. `build()` walks tokens left→right with cursor `c` (px, world coords, base screen 600 px). Unknown token throws. Levels 10,20,… are bosses (arena, not here). Hearts: 5 per level.

## Physics you design for (px, speed is automatic: player never controls x)
Speed v0→vmax grows with level (≈200→240 px/s L1, 206→276 L5). Tap jump ≈105–110 px long, 66 px high, 0.53 s. Hold jump ≈160 px long, 123 px high, 0.78 s. Boost: ×1.4 speed, jump ×1.18. Because x speed is known, TIME of arrival at any x is known: moving things (lasers, lifts, gates, drops) get phases from it (`tA(x)`), so they are always passable. Never use random phases.

## Tokens (exact-placement set, preferred) — cursor moves by the shown amount
`a:N` gap (may be negative = overlap hazards into one combo) · `K:n` n spikes ×18 px · `U[:1]` bug 30 px (1 = big) · `Wl` wall 24 px, 74 high (hold jump) · `P:g` pit width g · `ba:dx,w,n,h,amp[,g]` byte arc above c+dx (does NOT move c; amp = arc height; g=1 gold) · `br:w,n,h` byte row · `Jp` pad 44 px · `Fr:h` fragile block 40 px (breaks from above/below, side hit hurts) · `Zr:dx,w,h` light wire over c+dx (does not move c; fall onto it, +25% speed) · `Mg:h` magnet wall 14 px (cling 1.2 s in air; hurts on ground) · `Pi:len` inverter portal 40 px (walk on ceiling len px) · `Bo` booster 90 px · `cb` / `cx:n` ceiling bug / spikes (hurt only on ceiling) · `L` Lost One (340 px) · `k` checkpoint (+1 heart) · `i` container (drop weight) · `t:key` tip text · `n` lore.
Legacy "spaced" tokens (with built-in margins, easy but boring): `x:n` spikes, `bb`, `b`, `d` decoy, `W`, `p:g`, `c:` platform chain over pit, `g:pass|jump` gate, `v` volley, `h` ghost hoppers, `lz`, `fb`, `fx`, `sw`, `m`/`mf` moving block, `r:n,gap` rhythm row, `j fr zl mg pi bo` (spaced versions of new blocks). Cost table (px): W 340, x:2 306, x:3 324, bb:120 440, b 300, d 280, p:80 360, g 330, L 340, j 394, bo 440, fr 410, zl 650, mg 424, pi 350.

## Design recipe (this is what the owner calls "азарт")
1. Build in SECTIONS of 800–1000 px; each section = one idea (rhythm of spikes → pad over wall → wire over pit → magnet/ceiling trick). Sections differ; no row of 5 identical spikes twice.
2. Combos: put hazards at distances where one tap-jump or one hold-jump chains into the next (gap ≈ 100–190 px after landing). Use negative `a:` and `ba:` arcs to hint the path (bytes show the jump line).
3. Rhythm: alternate easy beat / hard beat; end each section with a breath (flat 150+ px, `ba` reward), then escalate.
4. Teach then twist: first use of a block alone (with `t:` tip), then combined. New block each ~level, never all at once.
5. Fairness: every gap solvable with tap OR hold; no blind jumps; ≥ 0.5 s warning for timed things (already done by phases).
6. Length: not longer than the old level unless the owner asks (L1 ≈ 20 s, L5 ≈ 45 s are the owner's reference; `levelD`/`target` in `engine.js` set difficulty/length for generated levels).
7. Owner targets: ≥ 1.5× obstacle count vs old; full bot (`bot.js`) clears 1–5 with ≤1 heart lost, 6–9 ≤2; simple bot (`simplebot.js`) must not clear.

## Procedure
1. `grep -n "^  N:{" levels.js` (read only that level's `seq`). Copy one similar level as the base.
2. Edit `seq`. Run `node docs/tests/levels15.test.js` (levels 1–5), `levels69.test.js`, `levels1117.test.js` (whichever range), then background `levels.test.js`.
3. If the full bot loses > allowed hearts: find the spot (print `S.x` at each hit — see DEBUGGING.md), widen that gap by 15–25 px or swap the combo. Do NOT make the bot smarter to hide a hard spot.
4. Update `INTRO[N]` only if a new block is introduced (short: what is new). Update tests' length/obstacle tables if the owner approved a new length.
5. CHANGELOG + STATUS + version + zip (WORKFLOW.md).
## Adding a new token
Add `name(args){it.push({...});c+=width}` in the `B` table of `build()`; width = hazard footprint + margin; add to `OBS` regex if it counts as an obstacle; collision in `engine.js` (MECHANICS.md); drawing in `levelview.js`; a test in `parkour.test.js`.
