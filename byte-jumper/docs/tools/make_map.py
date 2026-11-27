#!/usr/bin/env python3
"""Обновляет автоматический блок в docs/MAP.md: индекс файлов, функции с номерами строк, API модулей, наборы атак боссов,
ключи сохранения, порядок скриптов, тесты. Ручные разделы MAP.md не трогает: меняется только текст между <!-- AUTO:START --> и <!-- AUTO:END -->.
Запуск из корня репозитория: python3 docs/tools/make_map.py   (проверка без записи: --check; код возврата 1, если карта устарела)"""
import re, sys, pathlib
R = pathlib.Path(__file__).resolve().parents[2]
A = R/'app/src/main/assets'; G = A/'features/game'; KT = R/'app/src/main/java'
def rd(p): return p.read_text(encoding='utf-8', errors='replace')
def first_comment(p):
    t = rd(p)
    m = (re.search(r'/\*+\s*(.*?)\*/', t, re.S) or re.search(r'//\s*(.+)', t)) if p.suffix in ('.js','.css','.kt') else re.search(r'"""(.*?)"""', t, re.S)
    if not m: return ''
    s = re.sub(r'\s+', ' ', m.group(1)).strip(' =*')
    s = re.split(r'(?<=[.!?])\s', s)[0] if len(s) > 150 else s
    return s[:170]
def lines(p): return rd(p).count('\n')+1
def esc(s): return s.replace('|', '\\|')
out = []
ver = re.search(r'versionName\s*=\s*"([^"]+)"', rd(R/'app/build.gradle.kts')); code = re.search(r'versionCode\s*=\s*(\d+)', rd(R/'app/build.gradle.kts'))
out.append(f'Версия в сборке: **{ver.group(1) if ver else "?"}** (versionCode {code.group(1) if code else "?"}). Файл: `app/build.gradle.kts`.\n')
out.append('### Индекс файлов игры и оболочки (`app/src/main/assets`)\n')
out.append('| Файл | Строк | Что делает (первый комментарий) |\n|---|---|---|')
for p in sorted(A.rglob('*')):
    if p.is_file() and p.suffix in ('.js', '.css', '.html'):
        out.append(f'| `{p.relative_to(A)}` | {lines(p)} | {esc(first_comment(p))} |')
out.append('\n### Kotlin (`app/src/main/java`)\n')
out.append('| Файл | Строк | Описание |\n|---|---|---|')
for p in sorted(KT.rglob('*.kt')):
    out.append(f'| `{p.relative_to(KT)}` | {lines(p)} | {esc(first_comment(p))} |')
    ms = re.findall(r'@JavascriptInterface\s+fun\s+(\w+)', rd(p))
    if ms: out.append(f'| ↳ мосты JS→Kotlin | | ' + ', '.join(f'`{m}`' for m in ms) + ' |')
out.append('\n### Порядок подключения скриптов (`index.html`): важен, модули ищут друг друга по глобальным именам\n')
out.append(' → '.join(f'`{s}`' for s in re.findall(r'<script src="([^"]+)"', rd(A/'index.html'))))
out.append('\n\n### Модули и их API (глобальное имя → что отдаёт наружу)\n')
out.append('| Файл | Глобальное имя | Публичный API (`return{...}` в конце модуля) |\n|---|---|---|')
for p in sorted(G.glob('*.js')) + sorted((A/'shim').glob('*.js')):
    t = rd(p); m = re.search(r'^(?:const|var|let)\s+(\w+)\s*=\s*\(\(\)?\s*=>\s*\{', t, re.M)
    if not m: m = re.search(r'^(?:const|var|let)\s+(\w+)\s*=\s*\(', t, re.M)
    r = re.findall(r'\n\s*return\s*\{([^\n]*)', t)
    api = re.sub(r'\s+', ' ', r[-1])[:200] if r else ''
    out.append(f'| `{p.name}` | `{m.group(1) if m else "—"}` | {esc(api)} |')
out.append('\n### Где искать функции (имя и номер строки; вложенные функции первого уровня)\n')
out.append('Номера строк меняются при правках: после изменений перезапусти `python3 docs/tools/make_map.py`.\n')
for p in sorted(G.glob('*.js')):
    if p.name in ('story.js',): continue
    fn = []
    for i, l in enumerate(rd(p).split('\n'), 1):
        m = re.match(r'^( {1,3})(?:async )?function\s+(\w+)\s*\(', l) or re.match(r'^( {1,2})const\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>', l)
        if m: fn.append(f'`{m.group(2)}` L{i}')
    if fn: out.append(f'- **`{p.name}`**: ' + ', '.join(fn))
# боссы
import json
ar = rd(G/'arena.js'); ba = rd(G/'bossart.js'); st = rd(G/'story.js')
try: D = json.loads(re.search(r'const D=(\{.*\});\n', st).group(1)); names = {c['n']: c['boss']['name'] for c in D['chapters']}
except Exception: names = {}
out.append('\n### Боссы: что где (id босса = уровень/10; тексты берутся из `story.js` ← `docs/STORY_BIBLE.md`, механика описана в `docs/BOSSES.md`)\n')
out.append('| id | Имя | Набор атак (`arena.js`) | Комментарий к набору | Рисунок (`bossart.js`, ветка `id===N`) |\n|---|---|---|---|---|')
al = ar.split('\n'); bl = ba.split('\n')
for n in range(1, 11):
    k = next((i for i, l in enumerate(al, 1) if re.match(r'\s*function kit%d\('%n, l)), None)
    cm = ''
    if k:
        j = k-2
        m = re.search(r'/\*\s*-*\s*(.*?)\s*-*\s*\*/', al[j]) if j >= 0 else None
        cm = m.group(1) if m else ''
    d = next((i for i, l in enumerate(bl, 1) if re.search(r'id===%d\)'%n, l)), None)
    out.append(f"| {n} | {esc(names.get(n, ''))} | `kit{n}` L{k or '?'} | {esc(cm)[:150]} | {('L%d' % d) if d else 'ветка else (общий)'} |")
out.append('\nУровни 1–99: сценарии в `levels.js`, рисование в `levelview.js`, сложность `levelD` в `engine.js`. Фон/палитра: `art.js`. Герой: `spark.js` (кадры в `spark/spark.png`).')
# сохранение
ks = {}
for p in list(G.glob('*.js')) + list((A/'shim').glob('*.js')):
    for k in re.findall(r"""['"]([A-Za-z]+\.[\w.-]+\.v\d+|kairema\.[\w.-]+)['"]""", rd(p)): ks.setdefault(k, set()).add(p.name)
out.append('\n### Ключи localStorage\n')
for k in sorted(ks): out.append(f"- `{k}`: {', '.join(sorted(ks[k]))}")
sv = re.search(r'return\{u:[^\n]*', rd(G/'game.js'))
if sv: out.append('\nПоля сохранения (первый `return{u:...}` в `game.js`, функция загрузки): `' + re.sub(r'\s+', ' ', sv.group(0))[:300] + '`')
# тесты
out.append('\n### Тесты (`docs/tests`)\n')
for p in sorted((R/'docs/tests').glob('*')):
    out.append(f'- `{p.name}` ({lines(p)} строк): {esc(first_comment(p))}')
out.append('\n### Документы (`docs`)\n')
for p in sorted((R/'docs').glob('*.md')): out.append(f'- `{p.name}`: {esc(re.sub(chr(10)+".*", "", rd(p).lstrip("# ").split(chr(10))[0]))[:120]}')
block = '\n'.join(out)
mp = R/'docs/MAP.md'
S, E = '<!-- AUTO:START -->', '<!-- AUTO:END -->'
cur = rd(mp) if mp.exists() else f'# Карта кода\n\n{S}\n{E}\n'
new = re.sub(re.escape(S)+r'.*?'+re.escape(E), lambda m: S+'\n'+block+'\n'+E, cur, flags=re.S)
if '--check' in sys.argv:
    if new != cur: print('docs/MAP.md устарел: запусти python3 docs/tools/make_map.py'); sys.exit(1)
    print('MAP.md актуален'); sys.exit(0)
mp.write_text(new, encoding='utf-8'); print('MAP.md обновлён,', len(block.split('\n')), 'строк автоблока')
