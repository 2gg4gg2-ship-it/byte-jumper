#!/usr/bin/env python3
"""Проверка архитектуры игры (docs/ARCHITECTURE.md): слои, зависимости, порядок скриптов, размер файлов.
Запуск из корня: python3 docs/tools/check_arch.py   (код возврата 1, если есть нарушения)"""
import re, sys, pathlib
R = pathlib.Path(__file__).resolve().parents[2]; G = R/'app/src/main/assets/features/game'; A = R/'app/src/main/assets'
# файл -> (слой, глобальное имя). Новый файл игры ОБЯЗАТЕЛЬНО добавь сюда и в docs/ARCHITECTURE.md
MOD = {'core.js': (0, 'GameCore'), 'engine.js': (1, 'GameEngine'), 'levels.js': (1, 'GameLevels'), 'flags.js': (1, 'GameFlags'), 'abilities.js': (1, 'GameAbilities'), 'story.js': (1, 'GameStory'),
       'arena.js': (1, 'GameArena'), 'fx.js': (2, 'GameFX'), 'spark.js': (2, 'GameSpark'), 'art.js': (2, 'GameArt'),
       'bossart.js': (2, 'GameBossArt'), 'boss12.js': (1, 'GameBoss12'), 'boss12view.js': (2, 'GameBoss12View'), 'arenabg.js': (2, 'GameArenaBg'), 'levelview.js': (2, 'GameLevelView'), 'storyui.js': (3, 'GameStoryUI'), 'game.js': (3, 'Game')}
# разрешённые зависимости: слой 1 (логика) знает только слой 0 и логику; слой 2 (рисование) знает 0 и 1 (читает константы/состояние) и своих;
# слой 3 (экраны) знает всё. Слой 0 не знает никого.
OK_LOGIC = {'GameCore', 'GameEngine', 'GameLevels', 'GameStory', 'GameArena', 'GameBoss12'}
DOM = [r'\bdocument\b', r'\bwindow\b', r'\blocalStorage\b', r'\bnew Image\b', r'\bgetContext\b', r'\bAudioContext\b', r'\brequestAnimationFrame\b']
LIMIT = 450
bad = []; warn = []
names = {v[1]: k for k, v in MOD.items()}
for p in sorted(G.glob('*.js')):
    if p.name not in MOD: bad.append(f'{p.name}: нет в таблице MOD (docs/tools/check_arch.py) и в docs/ARCHITECTURE.md'); continue
    layer, me = MOD[p.name]; t = p.read_text(encoding='utf-8'); code = re.sub(r'/\*.*?\*/', '', t, flags=re.S); code = re.sub(r'(?m)^\s*//.*$', '', code)
    n = t.count('\n') + 1
    if n > LIMIT and p.name != 'story.js': warn.append(f'{p.name}: {n} строк (лимит {LIMIT}): режь на части')
    for g, f in names.items():
        if g == me or not re.search(r'\b%s\b' % g, code): continue
        gl = MOD[f][0]
        if layer == 0: bad.append(f'{p.name}: ядро (слой 0) не должно знать {g}')
        elif layer == 1 and g not in OK_LOGIC: bad.append(f'{p.name}: логика (слой 1) не должна знать {g} ({f}): логика не знает про рисование и экраны')
        elif layer == 2 and gl == 3: bad.append(f'{p.name}: рисование (слой 2) не должно знать {g}: экраны вызывают рисование, не наоборот')
    if layer <= 1:
        for d in DOM:
            if p.name == 'core.js' and d == r'\blocalStorage\b': continue  # единственное исключение: безопасное хранилище store (с try/catch и запасом в памяти)
            if re.search(d, code): bad.append(f'{p.name}: логика не должна трогать DOM/браузер ({d})')
# порядок скриптов: зависимость должна загружаться раньше (проверяем прямые упоминания)
order = [pathlib.Path(s).name for s in re.findall(r'<script src="([^"]+)"', (A/'index.html').read_text(encoding='utf-8'))]
idx = {n: i for i, n in enumerate(order)}
for n in MOD:
    if n not in idx: bad.append(f'{n}: не подключён в index.html'); continue
    code = re.sub(r'/\*.*?\*/', '', (G/n).read_text(encoding='utf-8'), flags=re.S)
    for g, f in names.items():
        if f == n or not re.search(r'\b%s\b' % g, code) or f not in idx: continue
        # обращение «внутри функций» допустимо при позднем вызове, но top-level использование требует порядка: предупреждаем только для слоёв 0–1
        if MOD[n][0] <= 1 and idx[f] > idx[n]: warn.append(f'{n}: использует {g}, а {f} подключён позже в index.html (допустимо, только если вызов внутри функции, не при загрузке файла)')
for w in warn: print('ПРЕДУПРЕЖДЕНИЕ:', w)
for b in bad: print('НАРУШЕНИЕ:', b)
print('Архитектура: нарушений %d, предупреждений %d' % (len(bad), len(warn)))
sys.exit(1 if bad else 0)
