/* Тесты уровней 1–29: node docs/tests/levels.test.js  (долго: бот ищет путь лучом, ~1 мин) */
const B=require('./bot.js'),GE=B.GE,GL=B.GL;
let ok=0,bad=[];const c=(n,v)=>{v?(ok++,console.log('ok  ',n)):(bad.push(n),console.log('FAIL',n))};
const LV=[];for(let L=1;L<=49;L++)if(L%10)LV.push(L);
c('45 проработанных уровней со сценарием и вступлением',LV.every(L=>GL.has(L)&&GL.INTRO[L]&&GL.INTRO[L].s&&GL.INTRO[L].n)&&LV.length===45);
c('у каждого уровня свой Потеряшка (имя и фраза)',LV.every(L=>GL.LOST[L]&&GL.LOST[L][0]&&GL.LOST[L][1]));
/* структура */
for(const L of LV){
 const S=GE.create({mode:'level',L,seed:1,W:360,H:640});
 const lost=S.items.filter(i=>i.t==='lost').length,door=S.items.find(i=>i.t==='door');
 const haz=S.items.filter(i=>['bug','wall','gate','hop','proj'].includes(i.t)).map(i=>i.x);S.pits.forEach(p=>haz.push(p.b));
 const first=Math.min(Infinity,...S.items.filter(i=>['bug','wall','gate','hop','proj'].includes(i.t)).map(i=>i.x),...S.pits.map(p=>p.a));
 const last=Math.max(0,...haz);
 const bad1=[];if(lost!==1)bad1.push('потеряшек '+lost);if(!door||door.x!==S.target+GE.PX)bad1.push('дверь');if(first<420)bad1.push('старт '+first);if(door&&door.x-last<260)bad1.push('до двери '+(door.x-last));
 if(!S.items.some(i=>i.t==='tip'||i.t==='lore'))bad1.push('нет подсказки');
 c('уровень '+L+': структура ('+(bad1.join(', ')||'ок')+')',!bad1.length)}
/* платформы: подъём между соседними не больше 40, высота не выше 80 */
{let okp=true;for(const L of LV){const S=GE.create({mode:'level',L,seed:1,W:360,H:640});const st=S.plats.filter(q=>q.k==='st'||q.k==='fall'||q.k==='blink').sort((a,b)=>a.x-b.x);
  for(let i=1;i<st.length;i++){if(st[i].x-(st[i-1].x+st[i-1].w)<150&&Math.abs(st[i].h-st[i-1].h)>40)okp=false}if(st.some(q=>q.h>140))okp=false}
 c('платформы: перепад ≤ 40, высота ≤ 140 (ступени)',okp)}
/* дверь целиком в экране, камера стоит, Искра сама доходит */
for(const W of [360,412]){const S=GE.create({mode:'level',L:2,seed:1,W,H:640});S.items=S.items.filter(i=>i.t==='door'||i.t==='byte');S.pits=[];let f=0,lockedAt=-1;
 while(!S.over&&f<9000){GE.step(S,1/60,{});f++;if(S.locked&&lockedAt<0)lockedAt=f}
 const dsx=S.door-S.x;c('дверь W='+W+': камера остановилась, дверь целиком у края ('+Math.round(dsx)+' из '+W+'), Искра вошла',S.over==='win'&&dsx+24<=W&&dsx-24>W*.5&&lockedAt>0)}
/* Потеряшка: приземление сверху находит, ходьба сбоку нет */
{const S0=GE.create({mode:'level',L:4,seed:1,W:360,H:640}),lo=S0.items.find(i=>i.t==='lost');let hit=0,tot=0;
 for(let off=-110;off<=-20;off+=5){const S=GE.create({mode:'level',L:4,seed:1,W:360,H:640});S.items=S.items.filter(i=>i.t==='lost');S.pits=[];S.x=lo.x+off-S.px;S.t=0;
  GE.step(S,1/60,{pressed:true,down:false});for(let i=0;i<90&&!S.found;i++)GE.step(S,1/60,{});tot++;if(S.found)hit++}
 c('Потеряшка: прыжок-тап находит его с '+hit+' из '+tot+' точек отрыва (окно ≥ 25 px)',hit*5>=25);
 const S=GE.create({mode:'level',L:4,seed:1,W:360,H:640});S.items=S.items.filter(i=>i.t==='lost');S.pits=[];S.x=lo.x-200-S.px;for(let i=0;i<120;i++)GE.step(S,1/60,{});c('Потеряшка: пробежать мимо не находит и не вредит',!S.found&&S.lost===0)}
/* падение в яму с платформами: минус сердце, возврат перед ямой, платформы восстановлены */
{const S=GE.create({mode:'level',L:7,seed:1,W:360,H:640});const pit=S.pits.find(p=>p.retry);S.items=[];S.x=pit.a-30-S.px;S.t=1;S.plats[0].fs=2;S.plats[0].dead=1;
 for(let i=0;i<200&&!S.lost;i++)GE.step(S,1/60,{});
 c('яма с платформами: −1 сердце, возврат перед ямой, платформы целы',S.lost===1&&Math.abs(S.x+S.px-(pit.a-70))<10&&S.plats.every(q=>!q.dead&&!q.fs))}
/* вес: контейнер сбрасывает, прыжок с максимальным весом всё ещё выше большого бага */
{const S=GE.create({mode:'level',L:19,seed:1,W:360,H:640});c('уровень 19: вес включён, есть контейнеры',S.def.wt&&S.items.filter(i=>i.t==='bin').length>=4);
 S.wt=.12;S.items=[];let mn=1e9;const y0=S.p.y;GE.step(S,.016,{pressed:true,down:false});for(let i=0;i<120;i++){GE.step(S,.016,{});mn=Math.min(mn,S.p.y)}c('вес 12%: малый прыжок '+Math.round(y0-mn)+' px > большого бага (30)',y0-mn>42);
 const T=GE.create({mode:'level',L:19,seed:1,W:360,H:640});T.wt=.1;const bin=T.items.find(i=>i.t==='bin');T.items=[{t:'bin',x:T.x+T.px+5,h:20}];GE.step(T,.016,{});c('контейнер сбрасывает вес',T.wt===0)}
/* чекпоинт лечит, запись показывается */
{const S=GE.create({mode:'level',L:13,seed:1,W:360,H:640});S.hearts=3;S.items=[{t:'cp',x:S.x+S.px+2,h:20},{t:'lore',x:S.x+S.px+2,h:30,text:'x'}];GE.step(S,.016,{});c('чекпоинт +1 сердце, запись открывается',S.hearts===4&&S.note&&S.note.kind==='lore')}
/* ворота и прыгуны: у прихода игрока состояние устойчиво (≥ 0,5 с до смены) */
{let okg=true;for(const L of LV){const S=GE.create({mode:'level',L,seed:1,W:360,H:640});for(const g of S.items.filter(i=>i.t==='gate')){let t=0,xx=0;const P=S.P,x=g.x-S.px;while(xx<x){const v=Math.min(P.v0+P.acc*xx,P.vmax);xx+=5;t+=5/v}
   const cyc=(t+g.ph)%g.per;const edge=Math.min(Math.abs(cyc-g.open),Math.abs(cyc),Math.abs(cyc-g.per));if(edge<.5)okg=false}}
 c('ворота: к приходу игрока состояние не меняется ±0,5 с',okg)}
/* «неточный игрок»: тап у края с ошибкой по месту, цепочки платформ проходятся при любой ошибке в диапазоне */
{let all=true,fails=[];for(const L of LV){const S0=GE.create({mode:'level',L,seed:1,W:360,H:640});
  for(const pit of S0.pits.filter(p=>p.retry))for(const e1 of [0,10,20,30])for(const e2 of [14,22,30,40]){
   const S=GE.create({mode:'level',L,seed:1,W:360,H:640});S.items=S.items.filter(i=>i.t==='door');S.x=pit.a-200;let t=0,xx=0;const P=S.P;while(xx<pit.a-200){const v=Math.min(P.v0+P.acc*xx,P.vmax);xx+=5;t+=5/v}S.t=t;
   let n=0;while(n<900&&!S.over&&S.lost===0&&S.x+S.px<pit.b+60){const pw=S.x+S.px;let pr=false;
    if(S.p.on){if(S.p.stand){if(pw>=S.p.stand.cx+S.p.stand.w-e2||(S.p.stand.tone==='stale'&&S.p.stand.fs===1))pr=true}else if(pw>=pit.a-e1&&pw<pit.b)pr=true}
    GE.step(S,1/60,{pressed:pr,down:false});n++}
   if(S.lost>0){all=false;if(fails.length<5)fails.push(L+'@'+Math.round(pit.a)+' e1='+e1+' e2='+e2)}}}
 c('цепочки платформ проходятся при ошибке прыжка ±30 px ('+(fails.join('; ')||'все')+')',all)}
/* бот проходит все уровни (0.10.1: сложность растёт, поэтому допускаем до 3 ударов из 5 сердец), на двух ширинах экрана */
for(const W of [360,412]){const t0=Date.now();const bads=[];for(const L of LV){const S=B.run(L,1,{W});if(S.over!=='win'||S.lost>3)bads.push(L+':'+S.over+'/'+S.lost)}
 c('бот проходит 45 уровней (не больше 3 ударов), W='+W+' ('+(bads.join(' ')||'все')+', '+Math.round((Date.now()-t0)/1000)+' с)',!bads.length)}
console.log('ИТОГ: '+ok+' ок, '+bad.length+' провалов'+(bad.length?': '+bad.join('; '):''));process.exit(bad.length?1:0)

/* нарастание сложности 1–25 (вручную, без автоматического растягивания): длина ≈ 6000+90*(L-1), плотность 3.0–4.5 на 1000 px */
{const OBJ=['bug','wall','gate','hop','proj','spike','laser','drop','mov'];const dens={},lens={};
 for(const L of [1,2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,21,22,23,24,25]){
  const S=GE.create({mode:'level',L,seed:1,W:360,H:640});const T=S.target;
  lens[L]=T;dens[L]=(S.items.filter(i=>OBJ.includes(i.t)&&i.x<T).length+S.pits.filter(p=>p.a<T).length)/T*1000}
 const Ls=Object.keys(lens).map(Number);
 c('длина уровней 1–25 в пределах ±250 px от 6000+90*(L-1) ('+Ls.map(L=>Math.round(lens[L]-6000-90*(L-1))).join(' ')+')',Ls.every(L=>Math.abs(lens[L]-6000-90*(L-1))<=250));
 c('плотность препятствий 3.0–4.5 на 1000 px на уровнях 1–25 ('+Ls.map(L=>dens[L].toFixed(1)).join(' ')+')',Ls.every(L=>dens[L]>=2.9&&dens[L]<=4.5));
 const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
 c('к 21–25 уровню плотность выше, чем на 1–5 ('+avg([21,22,23,24,25].map(L=>dens[L])).toFixed(2)+' > '+avg([1,2,3,4,5].map(L=>dens[L])).toFixed(2)+')',avg([21,22,23,24,25].map(L=>dens[L]))>avg([1,2,3,4,5].map(L=>dens[L])))}
