# Карта кода «Байт-прыгуна»

Это файл для Клауда: как быстро найти нужный код. Правила слоёв: `docs/ARCHITECTURE.md`. Нижний блок между `AUTO:START` и `AUTO:END` создаётся скриптом: **не правь его руками**, после любых правок кода запускай `python3 docs/tools/make_map.py`, потом `python3 docs/tools/make_map.py --check` (должно быть «MAP.md актуален»).

## Быстрый поиск: «хочу изменить X, куда идти»

| Хочу изменить | Файл и место |
|---|---|
| Высоту прыжка, гравитацию, скорость, размер героя, сердца | `engine.js`, константы в начале (`G, JV, HG, HMAX, PX, PW, PH`), `prm` |
| Сложность 100 уровней, длину уровня | `engine.js`: `levelD`, `target`, `prm` |
| Сценарий конкретного уровня 1–29 (какие препятствия) | `levels.js`: строки блоков (`f b B bb W p c s sb`), `build`, `INTRO` |
| Как рисуются препятствия/платформы уровня | `levelview.js`: `draw`, `plat`, `item` |
| Фон, цвета, HUD, сердца, джойстик, кнопки боя | `art.js` (палитра `TH/C`, `bg`, `hud`, `arenaHud`, `joy`, `jump`, `rejectBtn`) |
| Атаки и ИИ босса, фазы, ключи | `arena.js`: набор `kitN` (N = номер босса), общие `aim`, `hit`, `fall`, `dropPlat`, `step` |
| Как выглядит босс | `bossart.js`: `draw`, ветка `id===N` |
| Героя (кадры, бег, эмоции, урон, эволюции) | `spark.js` (кадры в `spark/spark.png`, таблица `ATL`) |
| Тексты сюжета, имена боссов, финалы | `docs/STORY_BIBLE.md` → `story.js` (генерируется из него, `story.js` руками не правь) |
| Книгу «История», пролог | `storyui.js` |
| Помехи на экране | `fx.js` (сила = число побеждённых боссов) |
| Меню, экран уровней, пауза, звук, сохранение, управление пальцами | `game.js`: `menu`, `levels`, `start`, `loop`, `finish`, `load/save`, обработчики pointer |
| Качество на слабых телефонах | `core.js`: `tick`, `dprFor` |
| Оболочку Android (WebView, кнопка «Назад») | `MainActivity.kt`; мост из JS один: `Android.exit()` |
| Версию приложения | `app/build.gradle.kts` (строки `versionCode = N`, `versionName = "X.Y.Z"` со знаком `=`), `README.md`, `docs/CHANGELOG.md` |
| Что в CI | `.github/workflows/build.yml` (не входит в zip!) |

## Границы между файлами (не нарушай)

- **Логика без DOM:** `engine.js`, `levels.js`, `arena.js`, `core.js`, `story.js`. Их можно проверять в node. Они ничего не рисуют.
- **Рисование без логики:** `art.js`, `bossart.js`, `levelview.js`, `spark.js`, `fx.js`. Они ничего не решают про игру.
- **Экраны, ввод, сохранение, склейка:** `game.js`, `storyui.js`.
- Модули ищут друг друга по глобальным именам (`GameEngine`, `GameArena`, …). Порядок `<script>` в `index.html` важен (он есть в авто-блоке ниже). Новый файл: добавь в `index.html` до `game.js`.
- Пути `app/src/main/assets/features/game/*` нельзя менять: игру позже вернут в Kairema (`docs/RETURN_TO_KAIREMA.md`).

<!-- AUTO:START -->
Версия в сборке: **0.16.1** (versionCode 51). Файл: `app/build.gradle.kts`.

### Индекс файлов игры и оболочки (`app/src/main/assets`)

| Файл | Строк | Что делает (первый комментарий) |
|---|---|---|
| `features/game/abilities.js` | 28 | СПОСОБНОСТИ ГЕРОЯ (слой 1, логика): реестр-таблица, без DOM и без эффектов ===== Способность открывается, когда побеждён нужный босс (поле boss). |
| `features/game/arena.js` | 256 | АРЕНА БОССА: логика без DOM. |
| `features/game/art.js` | 399 | ГРАФИКА «БАЙТ-ПРЫГУНА» (0.7.1): строгая палитра чёрный / серый / белый, красный только для опасности и акцентов ===== Всё рисуется кодом на canvas, картинок нет, сеть не  |
| `features/game/boss12.js` | 227 | БОССЫ 1 и 2 по документу v3 (раздел 4): «404» в шахте из файлов и «Колосс» в башне из ярусов. |
| `features/game/boss12view.js` | 64 | РИСОВАНИЕ БОССОВ 1–2 (боссы 404 и Колосс): только canvas, без логики. |
| `features/game/bossart.js` | 73 | РИСУНКИ БОССОВ (0.7.1): десять тел в одной палитре: серый металл, красное око, белые блики ===== Только рисование (canvas), без логики и DOM. |
| `features/game/core.js` | 32 | ЯДРО ИГРЫ (слой 0): фиксированный шаг, авто-качество, страж ошибок, безопасное хранилище, статистика кадров ===== Ядро ничего не знает об игре и не трогает DOM. |
| `features/game/engine.js` | 267 | ИГРА «Байт-прыгун»: движок (чистая логика, без DOM) ===== Тут физика, уровни, генератор участков, баги, бонусы и босс «Ошибка 404». |
| `features/game/flags.js` | 55 | СОХРАНЕНИЕ, ФЛАГИ И РЕЖИМ ПОМЕХ (слой 1, логика): только данные, без DOM, без localStorage ===== Версия сохранения 2. |
| `features/game/fx.js` | 30 | ЭФФЕКТ «ПОМЕХИ»: с каждым побеждённым боссом на экране больше глюков |
| `features/game/game.css` | 113 | Игра «Байт-прыгун»: меню, уровни, плашка «Нет сети». Цвета только из токенов, поэтому работает в тёмной и светлой теме. |
| `features/game/game.js` | 349 | ИГРА «Байт-прыгун»: экраны, рисование, звук, сохранение ===== Офлайн-игра внутри приложения: пока нет сети или просто для отдыха. |
| `features/game/levels.js` | 258 | УРОВНИ 1–29: сценарии, у каждого уровня своя изюминка (чистая логика, без DOM) ===== Уровень = строка блоков: f плоско, b/B баг, bb два бага, W высокая стена (держи прыжо |
| `features/game/levelview.js` | 180 | РИСОВАНИЕ УРОВНЕЙ (режим «уровень»): новые препятствия, платформы, подсказки ===== Фон, земля, байты, баги, HUD и герой берутся из GameArt / GameSpark (общий стиль 0.7.x: |
| `features/game/spark.js` | 86 | ИСКРА: утверждённая графика героя (атлас spark/spark.png, чёрно-белая) и выбор кадра по состоянию ===== Кадры из утверждённых листов автора: idle, r0–r7 (бег), e0–e3 (эво |
| `features/game/story.js` | 8 | ИСТОРИЯ «Искра: Нулевой Ключ»: только данные, без DOM. Сгенерировано из docs/STORY_BIBLE.md (текст автора) |
| `features/game/storyui.js` | 44 | ЭКРАНЫ ИСТОРИИ: читалка страниц (пролог) и «Книга истории» из меню ===== Спойлеры: главы и боссы, до которых игрок не дошёл, закрыты. |
| `index.html` | 33 |  |
| `shim/shim.css` | 18 | shim.css: тёмная тема и каркас экрана, которые в Kairema даёт core. Для игры в Kairema не нужен. |
| `shim/shim.js` | 25 | shim.js: заглушка ядра Kairema для отдельной игры «Байт-прыгун» ===== Игра (features/game) написана для приложения Kairema и ждёт от него несколько готовых функций: $, el |

### Kotlin (`app/src/main/java`)

| Файл | Строк | Описание |
|---|---|---|
| `com/bytejumper/app/MainActivity.kt` | 64 | Оболочка игры: показывает assets/index.html в WebView. |
| ↳ мосты JS→Kotlin | | `exit` |

### Порядок подключения скриптов (`index.html`): важен, модули ищут друг друга по глобальным именам

`shim/shim.js` → `features/game/core.js` → `features/game/engine.js` → `features/game/levels.js` → `features/game/flags.js` → `features/game/abilities.js` → `features/game/story.js` → `features/game/arena.js` → `features/game/fx.js` → `features/game/spark.js` → `features/game/art.js` → `features/game/bossart.js` → `features/game/boss12.js` → `features/game/boss12view.js` → `features/game/levelview.js` → `features/game/game.js` → `features/game/storyui.js`


### Модули и их API (глобальное имя → что отдаёт наружу)

| Файл | Глобальное имя | Публичный API (`return{...}` в конце модуля) |
|---|---|---|
| `abilities.js` | `GameAbilities` | LIST,byId,opened,available,spend,newRun}; |
| `arena.js` | `GameArena` | create,step,layout,reject:S=>{if(S&&S.b12)return;reject(S)},SPD}})(); |
| `art.js` | `GameArt` | theme,bg,voidFill,seg,item,shadow,parts,hud,arenaHud,arenaBg,plat,joy,jump,rejectBtn,glowDot,cham,panel,rgba,hs,TH,C,SC,WH}})(); |
| `boss12.js` | `GameBoss12` | create,step,layout,reject,SPD}})(); |
| `boss12view.js` | `GameBoss12View` | draw}})(); |
| `bossart.js` | `GameBossArt` | draw}})(); |
| `core.js` | `GameCore` | perf,tick,dprFor,steps,frame,stats:st,guard,fatal,resetErrors,errors,store}})(); |
| `engine.js` | `GameEngine` | create,step,stars,dist,target,prm,levelD,PX,PW,PH,GY,G,JV,HMAX,HG,solid,inPit,gateSt,hopE,CEIL,PADV}})(); |
| `flags.js` | `GameFlags` | VERSION,MODES,MODE_LABEL,CHOICES,FIXABLE_MIN,migrate,choose,fixable,nextMode, |
| `fx.js` | `GameFX` | draw,shake,strength}})(); |
| `game.js` | `Game` | open,state:()=>sv,setForm:v=>{sv.form=Math.max(0,Math.min(3,v\|0));if(typeof GameSpark!=='undefined')GameSpark.form(sv.form);save()}}})(); |
| `levels.js` | `GameLevels` | countObs,has,build,INTRO,LOST,DEF}})(); |
| `levelview.js` | `GameLevelView` | draw}})(); |
| `spark.js` | `GameSpark` | draw,portrait,icon,whenReady,ready:()=>ok,form:v=>{if(v!=null)form=Math.max(0,Math.min(3,v\|0));return form},ATL}})(); |
| `story.js` | `GameStory` | prologue:D.prologue,intro:D.intro,laws:D.laws,world:D.world,chars:D.chars,finals:D.finals,stages:D.stages,chapters:D.chapters, |
| `storyui.js` | `GameStoryUI` | read,book}})(); |
| `shim.js` | `Hooks` |  |

### Где искать функции (имя и номер строки; вложенные функции первого уровня)

Номера строк меняются при правках: после изменений перезапусти `python3 docs/tools/make_map.py`.

- **`abilities.js`**: `byId` L15, `opened` L17, `available` L19, `spend` L21, `newRun` L25
- **`arena.js`**: `layout` L6, `create` L12, `mul` L21, `clamp` L22, `band` L23, `aim` L25, `hit` L27, `fall` L31, `shot` L34, `kit1` L36, `kit2` L49, `row` L51, `kit4` L62, `dmg` L69, `nearPl` L70, `wallTel` L72, `kit5` L74, `coins` L76, `WLIM` L81, `addWin` L82, `erase` L83, `reject` L84, `kit6` L87, `newSeq` L94, `kit7` L96, `kit8` L103, `kit9` L108, `kit10` L114, `attack` L120, `dropPlat` L121, `near` L124
- **`art.js`**: `hs` L8, `idx` L43, `theme` L45, `mixHex` L46, `rgba` L47, `hasDoc` L50, `kOf` L51, `layer` L52, `blit` L57, `blob` L61, `glowDot` L63, `cham` L67, `paintTowers` L70, `towers` L81, `ring` L90, `fog` L94, `bg` L100, `newMid` L128, `stackStrip` L143, `paint` L145, `packets` L149, `rails` L152, `newer` L156, `gridStrip` L169, `paint` L171, `frameStrip` L177, `paint` L179, `logStrip` L183, `paint` L186, `skyBand` L190, `bsodMid` L197, `finaleMid` L209, `cloudBank` L220, `dumpExtra` L225, `wx` L226, `voidFill` L237, `paintGround` L242, `seg` L267, `crystal` L274, `item` L275, `shadow` L303, `parts` L305, `heart` L312, `panel` L313, `hearts` L314, `icon` L317, `face` L319, `hud` L320, `arenaHud` L336, `joy` L345, `jump` L349, `rejectBtn` L352, `arenaBg` L357, `GameArtQ` L364, `winPaint` L370, `plat` L385, `errWin` L387, `errPops` L395
- **`boss12.js`**: `clamp` L7, `rng` L8, `create` L11, `say` L25, `BY` L28, `buildShaft` L29, `buildTower` L45, `hit` L54, `fall` L57, `over` L62, `addWarn` L63, `pushPlayer` L64, `movePlayer` L67, `trackStand` L92, `tickPlats` L96, `bossPos` L102, `shard` L105, `step1` L110, `tierY` L155, `PHASE2` L156, `step2` L157, `popBlock` L212, `step` L218, `layout` L222, `reject` L224
- **`boss12view.js`**: `draw` L5
- **`bossart.js`**: `box` L7, `grad` L11, `glow` L12, `eyeGlow` L13, `slit` L14, `draw` L15
- **`core.js`**: `tick` L7, `dprFor` L12, `steps` L14, `frame` L17, `guard` L20, `fatal` L23, `resetErrors` L24
- **`engine.js`**: `mul` L14, `clamp` L15, `prm` L17, `levelD` L20, `target` L21, `create` L22, `byte` L38, `place` L39, `gen` L41, `inPit` L66, `solid` L67, `hit` L68, `lose` L74, `fall` L76, `pts` L84, `bossStep` L86, `pOn` L98, `gateSt` L100, `hopE` L102, `platStep` L103, `stars` L264, `dist` L265
- **`flags.js`**: `isObj` L11, `uniqInts` L12, `glitchMode` L14, `migrate` L18, `choose` L44, `fixable` L48, `nextMode` L49, `fxQuality` L51
- **`fx.js`**: `strength` L5, `glyph` L9, `draw` L10, `shake` L28
- **`game.js`**: `mk` L11, `T` L12, `fxDraw` L16, `save` L18, `beep` L21, `buzz` L35, `open` L38, `btn` L46, `menu` L47, `archive` L66, `levels` L72, `start` L92, `cs` L101, `size` L102, `reset` L110, `intro` L116, `lvIntro` L121, `closeOv` L126, `overlay` L127, `pause` L131, `finish` L135, `finale` L161, `choose` L163, `loop` L169, `drawCopy` L184, `drawArena` L188, `draw` L244, `pd` L303, `pu` L304, `lp` L307, `pdA` L308, `pmA` L311, `puA` L312, `kd` L316, `ku` L318, `vis` L319, `rs` L320, `stop` L322, `hideChip` L328, `showChip` L329
- **`levels.js`**: `countObs` L137, `has` L138, `num` L139, `build` L140, `tA` L147, `mod` L148, `byte` L149, `row` L150, `arc` L151, `plat` L152
- **`levelview.js`**: `A` L6, `lines` L8, `wrapX` L13, `extra` L15, `dashed` L26, `plat` L27, `item` L39, `juiceBack` L102, `juiceFront` L110, `draw` L139
- **`spark.js`**: `has` L16, `put` L19, `state` L22, `burst` L24, `emo` L25, `trail` L29, `cracks` L39, `runPose` L47, `draw` L50, `portrait` L81, `icon` L83, `whenReady` L84
- **`storyui.js`**: `mk` L4, `read` L5, `show` L10, `book` L17, `sec` L21, `card` L22, `lock` L23

### Боссы: что где (id босса = уровень/10; тексты берутся из `story.js` ← `docs/STORY_BIBLE.md`, механика описана в `docs/BOSSES.md`)

| id | Имя | Набор атак (`arena.js`) | Комментарий к набору | Рисунок (`bossart.js`, ветка `id===N`) |
|---|---|---|---|---|
| 1 | Потерянный Страж | `kit1` L36 | глава 1: Потерянный Страж: медленные обломки, очереди, веера, «растерянность» 404 | L17 |
| 2 | Колосс Переполнения | `kit2` L49 | глава 2: Колосс Переполнения: ряды шаров с дырой и падающие стек-блоки | L28 |
| 3 | Хозяин Устаревшего Кэша | `kit3` L56 | глава 3: Stale: веера по 3 (фазы 1–2, раз в 2,5 с); фаза 3: веера и ровные очереди по очереди. Инвалидация, копия и байты: staleTick и step | L32 |
| 4 | Пакетный Шторм | `kit4` L62 | глава 4: Таймаут: 7 повторов серии пакетов по рельсам, лаг-зоны | ветка else (общий) |
| 5 | Монарх Лимита | `kit5` L74 | глава 5: Монарх Лимита: монеты, стеклянные стены-ценники, баланс токенов | L36 |
| 6 | Стиратель Реестра | `kit6` L87 | глава 6: Стиратель Реестра: окна «Отклонить» (кнопка), ложные окна, заряд | L40 |
| 7 | Тень | `kit7` L96 | глава 7: Тень: эхо-след, переворот гравитации, «Тьма» с тремя байтами по порядку | L44 |
| 8 | Летописец Забвения | `kit8` L103 | глава 8: Летописец Забвения: паттерны боссов 1–6, ИИ берёт те, от которых игрок страдает больше; фаза 4 «Дамп» | L50 |
| 9 | Страж Тишины | `kit9` L108 | глава 9: Страж Тишины: осколки, серии «Замри» (длина растёт после успеха), фальшивый HUD | L55 |
| 10 | Кернел | `kit10` L114 | глава 10: Кернел: Память (призраки), Терминал (окна и исчезающие платформы), Ядро (паттерны 1–9 по 8 с), Ноль (мост) | L61 |

Уровни 1–99: сценарии в `levels.js`, рисование в `levelview.js`, сложность `levelD` в `engine.js`. Фон/палитра: `art.js`. Герой: `spark.js` (кадры в `spark/spark.png`).

### Ключи localStorage

- `kairema.game.v1`: game.js

### Тесты (`docs/tests`)

- `balance.js` (42 строк): Баланс уровней: node docs/tests/balance.js [L1,L2,...] Два бота с одинаковым поиском, но разными кнопками: - полный: тап и удержание (как бот в bot.js); - короткий: тольк
- `boss12.test.js` (83 строк): Тест боссов 1 и 2 (v3, раздел 4) без браузера: node docs/tests/boss12.test.js
- `bot.js` (40 строк): Тест-бот для уровней: поиск лучом по макро-действиям (отпустить / нажать / держать), шаг 5 кадров, горизонт 0,75 с.
- `engine.test.js` (188 строк): Тест логики без браузера: node docs/tests/engine.test.js
- `levels.test.js` (69 строк): Тесты уровней 1–29: node docs/tests/levels.test.js (долго: бот ищет путь лучом, ~1 мин)
- `levels1117.test.js` (20 строк): Уровни 11–17 (0.13.7): «азартные» сценарии.
- `levels15.test.js` (15 строк): Уровни 1–5 (0.13.2): препятствий не меньше чем в 1,5 раза больше, чем в 0.13.0, длина не больше прежней, полный бот проходит с потерей не больше одного сердца, простой бо
- `levels69.test.js` (15 строк): Уровни 6–9 (0.13.3): препятствий не меньше чем в 1,5 раза больше, чем в 0.13.0, длина не больше прежней, полный бот проходит с потерей не больше двух сердец, простой бот 
- `parkour.test.js` (86 строк): Тест новых паркур-блоков (батут, хрупкий блок, провод, магнитная стена, портал-инвертор, потолочные шипы, ускоритель) без браузера: node docs/tests/parkour.test.js.
- `simplebot.js` (19 строк): Простой бот (контроль сложности): видит только ближайшую опасность впереди и ставит один тап, когда она ближе 95 px.
- `standalone.test.py` (131 строк): Тест отдельной игры: запускается без Kairema, меню, игра, пауза, «Назад», нет ошибок страницы.
- `systems.test.js` (46 строк): Системы «движка 2.0»: сохранение и миграции, флаги выборов, режимы помех, реестр способностей.

### Документы (`docs`)

- `ARCHITECTURE.md`: Архитектура «Байт-прыгуна»
- `BOSSES.md`: Боссы и сложность уровней (проект механик)
- `CHANGELOG.md`: История версий
- `CLAUDE_GUIDE.md`: Руководство для Клауда: как работать с «Байт-прыгуном»
- `MAP.md`: Карта кода «Байт-прыгуна»
- `PLAN.md`: План: три части
- `PROMPT_FOR_NEW_CLAUDE.md`: Промпт для нового Клауда (скопируй в начало чата)
- `RETURN_TO_KAIREMA.md`: Как вернуть игру в Kairema
- `STORY.md`: Сюжет
- `STORY_BIBLE.md`: Искра: Нулевой Ключ
<!-- AUTO:END -->
