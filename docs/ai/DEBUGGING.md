# DEBUGGING — find bugs yourself, headless, cheaply (no phone, no browser unless it is a drawing bug)
Owner reports vague symptoms ("sometimes passes through the floor then returns", "teleports to platform"). Translate → invariant → reproduce → fix cause → regression test that fails on old code.
## 1. Headless harness (copy, ≈10 lines; pattern from `docs/tests/parkour.test.js`)
```js
const fs=require('fs'),D='app/src/main/assets/features/game/';
const GE=new Function(['engine.js','levels.js'].map(f=>fs.readFileSync(D+f,'utf8')).join('\n;\n')+';return GameEngine')();
const S=GE.create({mode:'level',L:1,seed:1,W:360,H:640}); // boss arena: GameArena.create({id:1,W:360,H:520,seed:5}) (needs engine.js+arena.js[+boss12.js])
S.hearts=9; for(let i=0;i<600&&!S.over;i++){GE.step(S,1/60,{pressed:i%40===0,down:i%40<20});S.ev.length=0}
```
Tiny world for one block: `parkour.test.js` `world(items,frozen)`. Full-run bot: `require('./bot.js').run(L,seed)` → `{over,lost,t}`; naive: `simplebot.js`.
## 2. Invariant fuzz (finds "glitch" reports without a repro)
Step with random/bot inputs on all levels and every frame assert: feet never below ground unless over a pit (`p.y+PH <= gy+1` when `!inPit`); |Δp.y| per frame ≤ 60; `hearts` only drops when `S.ev` has 'hit'/'fall'; `S.x` monotonic (level mode); no NaN; `S.sh.length ≤ 20` (arena). On violation print the 10 frames before (`S.x, p.y, p.vy, p.on, p.stand&&p.stand.k, S.boost, S.ev`).
## 3. Known bug classes (check these first)
1. **Tunnelling**: fast fall (height, boost, pad) moves > 14 px/frame past a thin floor test → falls to `S.H+80` → `fall()` respawn = "teleport + heart". Fix = swept test with previous-frame feet (`feet0`). Platforms already swept; ground fixed in 0.13.8.
2. **Respawn/teleport logic**: `engine.js fall()` (pit return: before pit if `retry`, else after) and `arena.js fall()` (no damage, lands under player / nearest by x). Any "returned me" report → read these two first.
3. **Time-phase mismatch**: moving hazards must use `tA(x)`; random phase = unfair spots.
4. **Cloned-state bugs in bots**: new per-item references must be remapped in `bot.js clone()` (zip/cling items), else bot behaves wrongly.
5. **Dead items** `it.dead` still collidable in a new branch → check `!it.dead`.
6. **Boss**: >20 shots, attack without telegraph, `Math.random` in logic (flaky tests).
7. **Layer leaks**: logic reading canvas size; drawing changing `S` (check_arch catches imports, not field writes — grep `S\.` assignments in art files).
8. **Save/flags**: new field without migration in `flags.js` → crash on old saves.
## 4. Reproduce-then-fix protocol
Write the failing test FIRST (assert the invariant), watch it fail, fix, watch it pass, then revert the fix once to confirm the test really fails on old code (sweep over several start offsets/speeds so it is not "lucky": the 0.13.8 test sweeps offsets 0..39 and speeds 900/1500/2500).
## 5. Drawing bugs
`python3 -I docs/tests/standalone.test.py` (Playwright, Chromium 360×780, no page errors). For looks: Playwright screenshot with `deviceScaleFactor:2`, LOOK at it. Do not tune pixel values blindly; change one thing, re-shoot.
## 6. Cheap triage order for "game feels wrong"
numbers in constants (engine.js top) → `levelD/prm` difficulty → the level's `seq` → bots (`levels15.test.js`) → only then touch physics. Never retune physics to fix one level.
