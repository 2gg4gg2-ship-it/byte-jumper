# CLAUDE.md — Byte Jumper («Байт-прыгун»). READ THIS FIRST, THEN STOP READING UNTIL YOU HAVE A TASK.

Android WebView game, pure JS + canvas, offline. Owner writes Russian from a phone, short/vague messages ("с полслова"). Answer in Russian, short, honest. Repo: github.com/2gg4gg2-ship-it/byte-jumper. Game code: `app/src/main/assets/features/game/` (paths FIXED: the folder is later copied into the Kairema app).

## 0. Hard rules (break one = wasted owner limit)
1. You usually have NO push access. Deliver a FULL zip: `cd <project root> && zip -qr ../byte-jumper-X.Y.Z.zip app docs README.md CLAUDE.md settings.gradle.kts .gitignore` (never `.github/`, keys, video). A partial zip wipes the app (CI does `rm -rf app settings.gradle.kts`).
2. Always start from the NEWEST repo state the owner gives (zip/clone). Check `versionName` in `app/build.gradle.kts` before editing. Never overwrite newer owner changes with your older copy.
3. Layers (checked by script): logic (no DOM) / drawing (no logic) / screens. Never mix. See `docs/ai/CODE_STYLE.md`.
4. Gameplay numbers (hitboxes, jump, speed) are changed ONLY if the task says so. Visual tasks never touch hitboxes.
5. Do not invent. Unknown = read the file or ask ONE short question. Never claim "tested" for what you did not run.
6. Every delivery: tests green, `python3 -I docs/tools/check_arch.py`, `python3 -I docs/tools/make_map.py` (then `--check`), version bump in 3 places, CHANGELOG line, update `docs/ai/STATUS.md`.
7. Do not rewrite story text (`docs/STORY_BIBLE.md` is the source; `story.js` is generated). No emoji, no network, no libraries, DOM text only via `textContent`.

## 1. Token economy (you are probably a small model on a limited quota)
- Do NOT read whole files. Use `docs/MAP.md` ("want to change X → file/function") and `grep -n`; then `Read` with offset/limit ≤ 60 lines.
- Do NOT read `docs/CHANGELOG.md`, `docs/STORY_BIBLE.md` (61 KB), `docs/BOSSES.md` (21 KB) unless the task is exactly about them; use `grep`.
- One focused change per turn. Plan in ≤ 5 lines, edit, run the 1–2 relevant tests, deliver. No essays, no re-reading what you just wrote.
- Run long tests (`levels.test.js` ≈ 3–8 min) in background with output to a file, only before delivery.
- Reuse: bots in `docs/tests/bot.js` / `simplebot.js`, harness patterns in `docs/ai/DEBUGGING.md`. Do not write new infrastructure.

## 2. Which doc for which task (read ONLY the one you need)
| Task | Read |
|---|---|
| owner slang / unclear word | `docs/ai/GLOSSARY.md` |
| session procedure, delivery, self-update | `docs/ai/WORKFLOW.md` |
| make/rebuild a level | `docs/ai/LEVELS.md` |
| make a boss / boss attack | `docs/ai/BOSSES_HOWTO.md` |
| new mechanic / block / obstacle / ability | `docs/ai/MECHANICS.md` |
| clean code, file size, where code goes | `docs/ai/CODE_STYLE.md` |
| a bug, "glitch", "teleports", "falls through" | `docs/ai/DEBUGGING.md` |
| graphics / art direction | `docs/ai/ART.md` |
| what is done / planned / owner wishes | `docs/ai/STATUS.md` |
| progression/monetization ideas (not built) | `docs/ai/IDEAS.md` |
| where is code for X | `docs/MAP.md` |
| layers, rules | `docs/ARCHITECTURE.md` |

## 2b. Common owner requests → action
"сделай уровень/лвл N интереснее/сложнее" → LEVELS.md (rebuild seq, run bots). "баг/глюк/проваливается/телепорт" → DEBUGGING.md (repro test first). "босс слишком сложный/лёгкий" → BOSSES_HOWTO.md (change numbers in kitN, keep telegraphs). "добавь блок" → MECHANICS.md. "сделай красиво/как на фотке" → ART.md. "что у нас уже есть" → STATUS.md (verify by grep, then fix it). "лимит" → be minimal.

## 3. Self-maintenance (mandatory)
These docs are LIVE. If the owner changes how he wants things done, or you find a doc line that is wrong/outdated, fix the doc in the same delivery (smallest edit, keep it terse, English). Move items in `docs/ai/STATUS.md` between DONE / IN PROGRESS / PLANNED when reality changes. If a rule here costs more than it saves, propose a shorter rule to the owner instead of silently ignoring it. Keep this file ≤ 90 lines.
