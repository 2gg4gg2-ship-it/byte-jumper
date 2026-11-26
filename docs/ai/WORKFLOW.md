# WORKFLOW — one task, start to finish (small model friendly)
1. **Understand** (≤ 1 min): map owner's words via GLOSSARY.md. If the task is ambiguous AND expensive, ask ONE question; else pick the reasonable reading, say it in one line, go.
2. **Get the newest code**: owner zip / `git clone --depth 1`. Check `versionName`. Work in a fresh dir. No push access? (403 is normal) → deliver zip.
3. **Locate** with `docs/MAP.md` + `grep -n`. Read ≤ 60 lines at a time.
4. **Change** minimal; follow CODE_STYLE.md; one concern per delivery.
5. **Verify** (run, do not assume): `node docs/tests/engine.test.js` (logic, ~96 checks), `parkour.test.js` (blocks/physics), `systems.test.js`, `boss12.test.js`, `levels15.test.js` / `levels69.test.js` / `levels1117.test.js` (level ranges with bots), `levels.test.js` (all levels, long, background), `python3 -I docs/tests/standalone.test.py` (browser), `python3 -I docs/tools/check_arch.py`, `python3 -I docs/tools/make_map.py` then `--check`. Pick tests by layer; long ones once, before delivery.
6. **Bookkeeping**: version +1 patch in `app/build.gradle.kts` (`versionCode = N` and `versionName = "X.Y.Z"`; re-`grep` to confirm), README "Текущая версия", CHANGELOG new top line (one line: what/why/how verified), `docs/ai/STATUS.md`, MAP regenerated.
7. **Deliver**: full zip (CLAUDE.md rule 1) attached to the chat; tell owner to upload to repo ROOT (https://github.com/2gg4gg2-ship-it/byte-jumper/upload/main; CI builds APK into Releases `ByteJumper.apk`). Reply in Russian, ≤ 8 lines: what changed, **Проверено** / **Не проверено** (APK build, feel on phone, balance are never verified by you), next step if any.
## Owner interaction rules
He is on a phone with a tight quota: no questions that can be decided, no repeating his message, no walls of text, no unrequested features, no "pending approval" stalls. If he says "stop, only X" do only X. If he attaches new zips, THEY are the truth (diff against yours, merge, never regress).
## Self-update protocol (mandatory, tiny)
- Found a doc line that is wrong, or owner changed a preference ("do it this way from now on") → edit the relevant `docs/ai/*.md` (or CLAUDE.md) in the same delivery; add the owner's wish to STATUS "Owner wishes" if it is a feature.
- Learned a bug class or trap → add ONE line to DEBUGGING.md §3.
- Added/renamed a file or token → MAP regenerates itself; also fix LEVELS.md / MECHANICS.md tables.
- Keep every doc terse; delete obsolete lines instead of appending "update:" notes.
## Quota-saving tricks
Use grep counts (`grep -c`), `sed -n a,bp`, `cut -c1-200` for long lines (this repo has very long lines!); never `cat` big files; test output → `| tail -5` or `| grep -E "FAIL|ИТОГ"`; parallelise independent tool calls; do not re-run green tests after docs-only edits.
