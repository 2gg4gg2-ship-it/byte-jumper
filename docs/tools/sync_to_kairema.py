#!/usr/bin/env python3
"""Переносит игру в Kairema одной командой: копирует features/game (все файлы и папку spark/) в ui/features/game Kairema
и переписывает в ui/index.html блок строк <script src="features/game/..."> и <link ... game.css> в порядке из index.html этой игры.
Запуск: python3 docs/tools/sync_to_kairema.py <путь_к_корню_kairema-app>          (по умолчанию показывает, что изменится)
        python3 docs/tools/sync_to_kairema.py <путь> --apply                       (применить)
Не трогает: версию Kairema, CHANGELOG, NOTES, MAP (их обновляет Клауд Kairema вручную после проверки), shim/."""
import re, sys, shutil, pathlib
R = pathlib.Path(__file__).resolve().parents[2]
SRC = R/'app/src/main/assets/features/game'; IDX = R/'app/src/main/assets/index.html'
if len(sys.argv) < 2: sys.exit(__doc__)
K = pathlib.Path(sys.argv[1]); apply = '--apply' in sys.argv
DST = K/'app/src/main/assets/ui/features/game'; KIDX = K/'app/src/main/assets/ui/index.html'
if not KIDX.exists(): sys.exit(f'Не найден {KIDX}: укажи корень репозитория Kairema')
mine = [s for s in re.findall(r'<script src="(features/game/[^"]+)"', IDX.read_text(encoding='utf-8'))]
kt = KIDX.read_text(encoding='utf-8')
old = re.findall(r'<script src="(features/game/[^"]+)"></script>', kt)
if not old: sys.exit('В index.html Kairema нет строк <script src="features/game/...">: добавь их вручную один раз')
first = kt.index(f'<script src="{old[0]}"></script>'); last_tag = f'<script src="{old[-1]}"></script>'; last = kt.index(last_tag)+len(last_tag)
between = kt[first:last]
if re.findall(r'<script src="(?!features/game/)', between): sys.exit('Между игровыми <script> в Kairema есть чужие скрипты: блок надо менять вручную')
new_block = '\n'.join(f'<script src="{s}"></script>' for s in mine)
files = [p for p in SRC.rglob('*') if p.is_file()]
print('Копируется файлов:', len(files), '→', DST)
print('Скрипты Kairema (было → станет):'); print(' ', old); print(' ', mine)
if not (DST/'game.css').exists(): print('ВНИМАНИЕ: game.css в Kairema не найден (должна быть строка <link rel="stylesheet" href="features/game/game.css">)')
if apply:
    DST.mkdir(parents=True, exist_ok=True)
    for p in files:
        t = DST/p.relative_to(SRC); t.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(p, t)
    KIDX.write_text(kt[:first]+new_block+kt[last:], encoding='utf-8'); print('Применено. Дальше: тесты Kairema, версия в 3 местах, CHANGELOG/NOTES/MAP (см. docs/RETURN_TO_KAIREMA.md).')
else: print('Это пробный запуск. Для применения добавь --apply')
