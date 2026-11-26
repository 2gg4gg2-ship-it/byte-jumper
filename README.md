# Байт-прыгун

Офлайн-игра для Android (один тап прыгает, держишь, прыгаешь выше): 10 уровней, босс «Ошибка 404», бесконечный режим, байты и звёзды. Без сети, без рекламы и без разрешений (нужна только вибрация).

Игра родилась внутри приложения **Kairema** (`features/game`). Здесь она живёт отдельно, пока её доделывают. Когда будет готова, папку `features/game` копируют обратно в Kairema (см. `docs/RETURN_TO_KAIREMA.md`).

Текущая версия: 0.15.0

## Устройство

```
app/src/main/assets/
  index.html              точка входа: подключает заглушку и игру
  shim/shim.js, shim.css  маленькие версии функций ядра Kairema ($, el, page, toast, Hooks, ...). Только для отдельной игры
  features/game/          сама игра. Путь такой же, как в Kairema: папку можно копировать как есть
    engine.js             физика, уровни, босс (без DOM)
    game.js               экраны, canvas, звук, сохранение
    game.css
    spark.js, spark/       Искра: атлас кадров (spark/spark.png) и состояния героя
    art.js                 графика: 4 сцены фона на уровни 1–20 (смена раз в 5 уровней), земля, предметы, интерфейс, частицы
    bossart.js             рисунки 10 боссов (серый металл, красное око)
app/src/main/java/com/bytejumper/app/MainActivity.kt   оболочка: WebView + кнопка «Назад»
```

Прогресс (уровни, звёзды, рекорд, звук) лежит в `localStorage` под ключом `kairema.game.v1` на телефоне. Сети нет.

## Сборка

Как у Kairema: заливаешь `byte-jumper.zip` в корень репозитория, GitHub Actions распаковывает его, собирает APK и кладёт в раздел **Releases** (`ByteJumper-<версия>.apk`).

**Архив всегда полный** (`app/`, `docs/`, `README.md`, `settings.gradle.kts`, `.gitignore`, без `.github/`): перед распаковкой workflow удаляет `app/` и `settings.gradle.kts`.

Файл `.github/workflows/build.yml` в архив не кладут: его один раз создают вручную на сайте GitHub.

## Правила изменений

- Игру правим только в `features/game/`. Заглушку `shim/` трогаем, только если игре понадобилась новая функция ядра (тогда её же нужно проверить в Kairema).
- Версия в двух местах: `app/build.gradle.kts` (`versionName`, `versionCode`) и строка «Текущая версия» в этом файле. Запись в `docs/CHANGELOG.md`.
- Тест в браузере: `python3 -I docs/tests/standalone.test.py` (нужны Python и Playwright с Chromium).


## Для Клаудов
Начни с `docs/CLAUDE_GUIDE.md`, затем `docs/ARCHITECTURE.md` (слои) и `docs/MAP.md` (карта кода). После правок: `python3 docs/tools/make_map.py`.
