# MECHANICS — add a new block / obstacle / ability without spaghetti
One mechanic = FOUR small touches, each in its own layer, nothing else:
1. **Token** (levels.js, `B` table in `build()`): pushes an item `{t:'kind', x, h, …params}` into `it`, advances cursor. Only data, no behaviour.
2. **Rule** (engine.js, in the item loop of `step`, ~line 185–245; platforms/ground are above it): branch `if(it.t==='kind'){…}`. Rules: use `pw=S.x+S.px` (player world x), `px0/px1/py0/py1` (hitbox), `feet0` (previous-frame feet) for swept tests; hurt only via `hit(S,it)`; set `it.dead=1` when consumed; push events `S.ev.push('name')` for sound/fx; skip passive items in the generic hit loop (line ~214 `if(k==='pad'||k==='bo'||k==='line')continue`).
3. **Look** (levelview.js `item`, one `if(k==='kind'){…}` branch; palette from `GameArt.C`; red = danger only). Never read hitboxes from drawing; draw from item fields.
4. **Test** (`docs/tests/parkour.test.js`: `world([items],frozen)` helper builds a tiny world; assert behaviour, e.g. rise height, hit/no-hit, event).
Then: add to `OBS` regex in levels.js if it is an obstacle; MAP regenerate; STATUS update; ability/unlock mechanics go through `abilities.js` registry (not ad-hoc flags); persistent flags through `flags.js`.
## Player state fields (engine.js) you may touch: `p.y p.vy p.on p.stand p.zip p.cling p.flip p.inv p.hold p.buf p.coy p.dj`, world `S.boost S.speed S.x S.px S.wt`.
## Rules of thumb
- Constants at file top (`G JV HG HMAX PX PW PH PADV`), no magic numbers inline; if you add one, name it.
- Time-based hazards get phase from arrival time (`tA`) — passable by construction.
- Collision against anything that moves > 14 px/frame must be SWEPT (previous-frame position vs current), never "inside this frame only" (this caused the 0.13.8 fall-through bug).
- A mechanic that needs per-frame state keeps it on the item or on `S`, never in module-level globals (bots clone `S`).
