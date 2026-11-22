# Как вернуть игру в Kairema

Игра лежит в `app/src/main/assets/features/game/` с тем же путём и именами, что и в Kairema (`app/src/main/assets/ui/features/game/`). Заглушка `shim/` в Kairema не нужна: все её функции там уже есть.

## Шаги

1. Возьми свежий Kairema (актуальный `main`, смотри версию в `app/build.gradle.kts`: приложение мог менять другой Клауд).
2. Замени три файла в `app/src/main/assets/ui/features/game/` файлами из этой игры: `engine.js`, `game.js`, `game.css` и (с версии 0.2.0) новые `core.js`, `story.js`, `fx.js`, `storyui.js`. В `index.html` Kairema порядок: core, engine, story, fx, game, storyui.
3. Если игра изменилась больше, чем эти три файла (появились новые файлы, например `levels.js` или картинки), добавь их в ту же папку и в `index.html` Kairema (скрипты после `core/*.js`, как сейчас идут `engine.js` и `game.js`; стиль `game.css` рядом с остальными).
4. Если в игре появились вызовы функций, которых нет в Kairema, а в `shim/shim.js` они есть, перенеси такие функции в ядро Kairema или перепиши вызов. Список функций, которые игра берёт у ядра: `$`, `el`, `ic`, `L`, `i18nAdd`, `Hooks`, `SCREENS`, `toast`, `page`, `esc`.
5. Прогони в Kairema тест игры `docs/tests/game047.test.py` (и общий набор), подними версию в трёх местах, обнови CHANGELOG, NOTES, MAP. Отдай архив Kairema **полным**.

## Что не потеряется

- Ключ сохранения `kairema.game.v1` не меняется: прогресс игрока в Kairema останется как был.
- Строка «Байт-прыгун» в Настройках и плашка «Нет сети — поиграть?» уже есть в `game.js` и `setlayout.js` Kairema, ничего добавлять не надо.

## Важно

Пока игра живёт отдельно, в Kairema её не правят (иначе придётся сливать файлы вручную). Источник правды один: этот репозиторий. Если срочно нужно исправить игру в Kairema, исправь её и здесь тоже.
- 0.2.1: новый файл app/src/main/assets/features/game/look.js (рисование героя и фона), подключён в index.html перед game.js.
