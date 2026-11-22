/* ===== shim.js: заглушка ядра Kairema для отдельной игры «Байт-прыгун» =====
   Игра (features/game) написана для приложения Kairema и ждёт от него несколько готовых функций:
   $, el, ic, esc, L, i18nAdd, Hooks, SCREENS, toast, page. Здесь их маленькие версии, чтобы игра запускалась сама.
   Когда игру вернут в Kairema, этот файл НЕ нужен: там те же функции уже есть (core/base.js, core/app.js). */
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const el=h=>{const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const raf=requestAnimationFrame;
const P={back:'<path d="M15 5l-7 7 7 7"/>',chevR:'<path d="M9 5l7 7-7 7"/>',close:'<path d="M6 6l12 12M18 6L6 18"/>'};
const ic=n=>`<svg class="i" viewBox="0 0 24 24">${P[n]||''}</svg>`;
const L=s=>s;
const i18nAdd=()=>{};
const Hooks=(()=>{const h={};return{on:(e,f)=>{(h[e]=h[e]||[]).push(f)},run:(e,...a)=>(h[e]||[]).forEach(f=>f(...a))}})();
const SCREENS={};
const app=document.getElementById('app');
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2200)}
function sub(){const d=el('<div class="spg"></div>');app.append(d);raf(()=>d.classList.add('on'));d.close=()=>{d.classList.remove('on');setTimeout(()=>d.remove(),300);
  /* закрыли главный экран игры: в приложении выходим, в браузере открываем снова */
  if(window.Android&&Android.exit)Android.exit();else setTimeout(()=>SCREENS.game&&SCREENS.game(),350)};return d}
function page(name,title,render){const d=sub();d.dataset.screen=name;d.innerHTML=`<div class="top"><button class="ib" data-bk aria-label="Назад">${ic('back')}</button><h2>${esc(title)}</h2></div><div class="scroll"></div>`;$('[data-bk]',d).onclick=d.close;render($('.scroll',d));return d}
/* Кнопка «Назад» в Android: если идёт игра, вернуть в меню и сказать «обработано» */
window.__back=()=>{const d=$('.spg.on.gm');if(d&&d._inPlay){$('[data-bk]',d).click();return true}return false};
/* Запуск: как в Kairema после загрузки, затем сразу открываем игру */
addEventListener('DOMContentLoaded',()=>{Hooks.run('app:ready');if(SCREENS.game)SCREENS.game()});
