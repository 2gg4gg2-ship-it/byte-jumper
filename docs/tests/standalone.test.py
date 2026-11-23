"""Тест отдельной игры: запускается без Kairema, меню, игра, пауза, «Назад», нет ошибок страницы.
Запуск: python3 -I docs/tests/standalone.test.py   (нужны Playwright и Chromium)"""
import os
from playwright.sync_api import sync_playwright
UI = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../app/src/main/assets/index.html'))
OK = 0; BAD = []
def check(n, c, i=''):
    global OK
    if c: OK += 1; print('ok  ', n)
    else: BAD.append(n); print('FAIL', n, i)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 360, 'height': 780})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.goto('file://' + UI); pg.wait_for_timeout(1200)
    check('меню открывается само: заголовок «Байт-прыгун»', pg.evaluate("(document.querySelector('.gm-hero h1')||{}).textContent") == 'Байт-прыгун')
    btns = pg.evaluate("[...document.querySelectorAll('.gm-b button')].map(x=>x.textContent.trim()).filter(Boolean)")
    check('в меню: Играть, Уровни, Бесконечный режим, Звук', len(btns) == 6 and btns[0].startswith('Играть') and btns[1] == 'Уровни' and 'История' in btns, btns)
    pg.locator('.gm-b .gm-btn').first.click(); pg.wait_for_timeout(700)
    check('первый запуск: показан пролог', pg.evaluate("!!document.querySelector('.gm-story')") and 'Сеть Кайрема' in pg.evaluate("document.querySelector('.gm-st-t').textContent"))
    for _ in range(5): pg.locator('.gm-story .gm-btn.pri').click(); pg.wait_for_timeout(120)
    pg.wait_for_timeout(600)
    check('игра идёт: canvas есть, режим игры включён', pg.evaluate("!!document.querySelector('.gm-cv') && !!document.querySelector('.spg.gm')._inPlay"))
    check('5 сердец на уровень', pg.evaluate("document.querySelector('.spg.gm')._S().hearts") == 5)
    check('дверь есть в уровне', pg.evaluate("document.querySelector('.spg.gm')._S().items.some(i=>i.t==='door')"))
    for _ in range(8): pg.mouse.click(180, 400); pg.wait_for_timeout(200)
    check('«Назад» из игры: обработано, вернулись в меню', pg.evaluate("window.__back()") is True and pg.evaluate("!!document.querySelector('.gm-hero')"))
    check('«Назад» в меню: не обработано (оболочка закроет приложение)', pg.evaluate("window.__back()") is False)
    pg.locator('.gm-b .gm-btn').nth(1).click(); pg.wait_for_timeout(500)
    check('экран «Уровни» открывается', pg.evaluate("document.querySelectorAll('.gm-b button').length") >= 5)
    pg.locator(".gm-lt .gm-btn").click(); pg.wait_for_timeout(200)
    pg.evaluate("[...document.querySelectorAll('.gm-b button')].find(x=>x.textContent==='История').click()"); pg.wait_for_timeout(300)
    check('книга истории: 3 вводные, глава 1 и 9 закрытых, помехи и финалы закрыты', pg.evaluate("document.querySelectorAll('.gm-bk').length") == 15 and pg.evaluate("document.querySelectorAll('.gm-bk.lock').length") == 11)
    check('глава 2 закрыта до победы над боссом 1', pg.evaluate("[...document.querySelectorAll('.gm-bk.lock b')].some(b=>b.textContent.startsWith('2. Стек'))"))
    check('пролог больше не показывается второй раз', pg.evaluate("JSON.parse(localStorage.getItem('kairema.game.v1')).seen") is True)
    check('нет внешних запросов и ошибок страницы', not errs, errs)
    b.close()
print('\nИТОГ: %d ок, %d провалов' % (OK, len(BAD)))
if BAD: print('Провалы:', BAD); raise SystemExit(1)
