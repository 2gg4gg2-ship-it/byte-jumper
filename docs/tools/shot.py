"""Скриншот игры для проверки вида: python3 -I docs/tools/shot.py <файл.png> [уровень=1] [секунд_игры=2.5]
Открывает index.html в Chromium 360x780 (DPR 2), запускает нужный уровень, делает снимок. Нужны Playwright и Chromium."""
import os,sys
from playwright.sync_api import sync_playwright
UI=os.path.abspath(os.path.join(os.path.dirname(__file__),'../../app/src/main/assets/index.html'))
out=sys.argv[1];L=int(sys.argv[2]) if len(sys.argv)>2 else 1;sec=float(sys.argv[3]) if len(sys.argv)>3 else 2.5
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':360,'height':780},device_scale_factor=2)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+UI);pg.wait_for_timeout(500)
    pg.evaluate("localStorage.setItem('kairema.game.v1',JSON.stringify({u:%d,st:{},b:0,best:0,boss:false,snd:0,bosses:0,seen:true,gl:true}))"%L)
    pg.reload();pg.wait_for_timeout(900)
    if L==1:pg.evaluate("[...document.querySelectorAll('.gm-b button')].find(x=>x.textContent.startsWith('Играть')).click()")
    else:
        pg.locator('.gm-b .gm-btn').nth(1).click();pg.wait_for_timeout(400)
        pg.evaluate("document.querySelectorAll('button.gm-lv')[%d].click()"%(L-1))
    pg.wait_for_timeout(700)
    if pg.evaluate("!!document.querySelector('.gm-intro')"):pg.locator('.gm-intro .gm-btn').click()
    pg.wait_for_timeout(int(sec*1000));pg.screenshot(path=out);print('ошибки страницы:',errs or 'нет');b.close()
