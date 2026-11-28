/* ===== АРЕНА БОССА: логика без DOM. Экран не прокручивается; управление: ax (-1..1), прыжок тап/удержание =====
   Боссы 1–10 (наборы атак kit1..kit10). Подробности и числа: docs/BOSSES.md. Предупреждение перед каждой атакой обязательно.
   ИИ босса (aim/habits): целится с упреждением и ошибкой, давит там, где игрок проводит больше времени, и ослабляет прицел после двух ударов подряд. */
const GameArena=(()=>{
 const E=GameEngine,SPD=170,KEYHP=100/9;
 function layout(S){
  if(S.b12){GameBoss12.layout(S,S.W,S.H);return}
  const W=S.W,H=S.H,gy=H*.84;S.gy=gy;
  const P=[[0,gy,W*.44],[W*.56,gy,W*.44],[14,gy-100,W*.3],[W-14-W*.3,gy-100,W*.3],[W*.5-W*.17,gy-200,W*.34]];
  if(!S.pl)S.pl=P.map(()=>({st:'ok',t:0}));
  P.forEach((q,i)=>{const o=S.pl[i];o.x=q[0];o.y=q[1];o.w=q[2];o.floor=i<2})}
 function create(o){
  if(o.id===1||o.id===2)return GameBoss12.create(o);
  const S={bid:o.id||1,arena:true,mode:'boss',W:o.W,H:o.H,rnd:mul(o.seed||7),t:0,over:null,ev:[],score:0,bytes:0,combo:0,hearts:3,maxHearts:3,lost:0,
   boss:{hp:100,max:100,phase:1,x:o.W/2,y:64,conf:0},p:{x:o.W*.22,y:0,vx:0,vy:0,on:false,hold:0,buf:0,coy:0,inv:0},
   tel:[],sh:[],key:null,kt:3,atk:2,aN:0,fallT:8,hab:[0,0,0],idle:0,fair:0,hits:[],pl:null,tok:100,slow:0,wb:0,walls:[],free:[],fk:5,wins:[],chg:0,rj:[],las:null,flip:0,fw:0,fT:10,dark:false,seq:null,hs:[],sd:null,sdA:false,rt:{},cell:-1,trapT:0,fear:{},lastK:0,mm:[],memc:0,fz:null,fzQ:0,fzK:1,fzG:0,fzS:0,fh:false,gh:[],rem:0,p4:0,t3:0,ck:0,tb:o.bytes|0};
  layout(S);const p=S.p;p.y=S.gy-E.PH;p.on=true;
  /* Stale: инвалидация, свежие байты, привычки игрока, пульс, копия */
  S.sb=0;S.sbytes=[];S.sbT=2;S.pt=[0,0,0,0,0];S.pulseT=0;S.invW=0;S.nxt=[];S.inval=8+S.rnd()*2;
  return S}
 function mul(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const band=(S,y)=>y>=S.gy-30?0:y>=S.gy-130?1:2;
 /* прицел с упреждением: куда игрок попадёт через t секунд; ошибка меньше на поздних фазах, больше после ударов */
 function aim(S,t){const p=S.p,amp=S.fair>0?95:S.boss.phase===1?55:S.boss.phase===2?38:26;
  return clamp(p.x+p.vx*t*.8+(S.rnd()-.5)*2*amp,16,S.W-16)}
 function hit(S){const p=S.p;if(p.inv>0||S.over)return;S.hearts--;S.lost++;p.inv=1.3;S.combo=0;S.ev.push('hit');
  if(S.lastK)S.fear[S.lastK]=(S.fear[S.lastK]||0)+1;S.hits.push(S.t);S.hits=S.hits.filter(x=>S.t-x<6);if(S.hits.length>=2)S.fair=6;
  if(S.hearts<=0){S.over='dead';S.ev.push('die')}}
 /* падение вниз: урона нет; игрок сам приземляется на платформу под собой, а если под ним пусто — встаёт на ближайшую по горизонтали целую */
 function fall(S){const p=S.p;p.inv=Math.max(p.inv,1);
  let best=null,bd=1e9;S.pl.forEach(q=>{if(q.st!=='ok')return;const d=Math.abs(q.x+q.w/2-p.x)+(S.gy-q.y)*.2;if(d<bd){bd=d;best=q}});
  best=best||S.pl[4];p.x=clamp(p.x,best.x+E.PW/2,best.x+best.w-E.PW/2);p.y=best.y-E.PH;p.vy=0;p.on=true;S.ev.push('fall')}
 const shot=(S,x,y,vx,vy,r,kind)=>{if(S.sh.length<20)S.sh.push({x,y,vx,vy,r,kind:kind||0})};
 /* --- глава 1: Потерянный Страж: медленные обломки, очереди, веера, «растерянность» 404 --- */
 function kit1(S){
  const B=S.boss,f=B.phase,p=S.p,bx=B.x;S.aN++;
  if(f===1){
   S.tel.push({x:aim(S,1),t:1,k:'big'});if(S.rnd()<.35)S.tel.push({x:aim(S,1)+(S.rnd()<.5?-70:70),t:1.2,k:'big'});S.atk=S.bid===1?1.6:1.7}
  else if(f===2){
   if(S.aN%3===0)S.tel.push({x:aim(S,1),t:1,k:'big'});
   else S.tel.push({x:0,t:.7,k:'str',n:S.bid===1?3:5,iv:.35,c:0});
   S.atk=2.4}
  else{
   if(S.aN%2)S.tel.push({x:bx,t:.5,k:'fan'});else S.tel.push({x:aim(S,1),t:1,k:'big'});
   if(S.idle>1.5)S.tel.push({x:p.x,t:.6,k:'fan2'});
   S.atk=2.0}}
 /* --- глава 2: Колосс Переполнения: ряды шаров с дырой и падающие стек-блоки --- */
 function kit2(S){
  const f=S.boss.phase,W=S.W;S.aN++;
  const row=()=>{const hx=aim(S,1.2);S.tel.push({x:hx,t:.9,k:'row'})};
  if(f===1){row();S.atk=2.2}
  else if(f===2){S.tel.push({x:aim(S,1),t:1,k:'blk'});if(S.aN%2)row();S.atk=2.2}
  else{row();S.tel.push({x:aim(S,1),t:1,k:'blk'});S.tel.push({x:S.boss.x,t:.5,k:'fan'});S.atk=1.9}}
 /* --- глава 3: Stale: веера по 3 (фазы 1–2, раз в 2,5 с); фаза 3: веера и ровные очереди по очереди. Инвалидация, копия и байты: staleTick и step --- */
function kit3(S){
 const f=S.boss.phase;S.aN++;
 if(f<3||S.aN%2)S.tel.push({x:S.boss.x,t:.5,k:'fan',v:340,r:4.5});
 else S.tel.push({x:0,t:.7,k:'str',n:4,iv:.4,c:0,v:200});
 S.atk=f===3?3:2.5}
/* --- глава 4: Таймаут: 7 повторов серии пакетов по рельсам, лаг-зоны --- */
 function kit4(S){
  const f=S.boss.phase;S.rep=S.rep||0;
  if(S.series>0){S.series--;const rows=[S.gy-12,S.gy-112,S.gy-212],y=rows[Math.floor(S.rnd()*3)];S.tel.push({x:S.rnd()<.5?0:S.W,y,t:.8,k:'pkt'});S.atk=.55;if(S.series===0)S.atk=5;return}
  S.rep=Math.min(7,S.rep+1);S.series=1+S.rep;S.ev.push('warn');
  if(f>=2){const x=aim(S,1);S.lag={x:x-45,w:90,t:3,on:0}}
  S.atk=.8}
 /* --- общие помощники боссов 5–7 --- */
 function dmg(S){const B=S.boss;B.hp=Math.max(0,B.hp-(S.bid===3?20:KEYHP));S.combo++;S.score+=100;S.bytes++;S.ev.push('fix');if(B.hp<=0){S.over='win';S.score+=1000;S.ev.push('win');return true}return false}
 function nearPl(S,x){const p=S.p;let best=null,bd=1e9;S.pl.forEach(q=>{if(q.st!=='ok')return;const d=Math.abs(q.x+q.w/2-x)+Math.abs(q.y-(p.y+E.PH))*1.5;if(d<bd){bd=d;best=q}});return best}
 /* --- глава 5: Монарх Лимита: монеты-очереди, стеклянные стены-ценники, баланс токенов --- */
 function wallTel(S){if(S.walls.length+S.tel.filter(a=>a.k==='wall').length>=3)return;const x=aim(S,1),q=nearPl(S,x);if(q)S.tel.push({x:clamp(x,q.x+10,q.x+q.w-10),y:q.y,t:1,k:'wall'})}
 /* --- глава 5: Монарх Лимита: монеты, стеклянные стены-ценники, баланс токенов --- */
 function kit5(S){const f=S.boss.phase,rich=S.wb>=2;S.aN++;S.tok-=f===3?16:10;
  if(S.tok<=0){S.tok=35;S.slow=5;S.ev.push('warn')}
  const coins=(n,iv)=>S.tel.push({x:0,t:.8,k:'str',n,iv,v:200,kind:4,c:0});
  if(f===1){coins(S.wb<1?6:4,.5);S.atk=2.8}
  else if(f===2){if(rich||S.aN%2)wallTel(S);coins(rich?2:4,.5);S.atk=2.4}
  else{wallTel(S);if(rich)wallTel(S);coins(5,.4);if(S.aN%2)S.tel.push({x:aim(S,1),t:1,k:'big'});S.atk=2.1}}
 /* --- глава 6: Стиратель Реестра: окна «Разрешить?», кнопка «Отклонить», ложные окна, лазер --- */
 const WLIM=f=>f===1?1.5:f===2?1.2:.9;
 function addWin(S,real,d){if(S.wins.length>=3)return;const l=WLIM(S.boss.phase);S.wins.push({t:l,max:l,real,d:d||0})}
 function erase(S){const p=S.p;let best=null,bd=1e9;S.pl.forEach((q,i)=>{if(q.st!=='ok'||(i<2&&S.pl[1-i].st!=='ok'))return;const d=Math.abs(q.x+q.w/2-p.x)+Math.abs(q.y-(p.y+E.PH))*1.5;if(d<bd){bd=d;best=q}});if(best){best.st='warn';best.t=.8;S.ev.push('warn')}}
 function reject(S){if(!S||S.over)return;const l=S.wins.filter(w=>w.d<=0).sort((a,b)=>(b.real-a.real)||a.t-b.t);if(!l.length)return;const w=l[0];S.wins=S.wins.filter(x=>x!==w);
  if(w.real){S.chg++;S.rj.push(w.max-w.t);if(S.rj.length>8)S.rj.shift();S.ev.push('shield');if(S.chg%5===0)dmg(S)}}
 /* --- глава 6: Стиратель Реестра: окна «Отклонить» (кнопка), ложные окна, заряд --- */
 function kit6(S){const f=S.boss.phase,r=S.rj,fast=r.length>=3&&r.slice(-3).reduce((a,b)=>a+b,0)/3<WLIM(f)*.45;S.aN++;
  const n=f===3?2+S.aN%2:1;for(let i=0;i<n;i++)addWin(S,1,i*.45);
  if(fast)addWin(S,0,.3);
  if(f>=2)S.tel.push({x:aim(S,1),t:1,k:'big'});
  if(f===3&&S.aN%2===0){const rows=[S.gy-12,S.gy-112,S.gy-212];S.tel.push({x:0,y:rows[band(S,S.p.y+E.PH)],t:1,k:'las'})}
  S.atk=f===2?3:3.4}
 /* --- глава 7: Тень: Эхо (копия с задержкой 0,5 с), Подмена (гравитация), Тьма (порядок тёмных байтов) --- */
 function newSeq(S){const o=[0,1,2];for(let i=2;i>0;i--){const j=Math.floor(S.rnd()*(i+1));[o[i],o[j]]=[o[j],o[i]]}S.seq={n:[2,3,4].map(i=>{const q=S.pl[i];return{x:q.x+q.w/2,y:q.y-14}}),ord:o,got:0,lit:-1,last:-1}}
 /* --- глава 7: Тень: эхо-след, переворот гравитации, «Тьма» с тремя байтами по порядку --- */
 function kit7(S){const f=S.boss.phase,p=S.p;S.aN++;
  if(S.flip>0||S.fw>0){S.tel.push({x:aim(S,1),t:1,k:'up'});S.atk=2.2;return}
  S.tel.push({x:S.boss.x,t:f===1?.7:.6,k:'fan'});
  if(f===1&&S.idle>1.5)S.tel.push({x:p.x,t:.6,k:'fan2'});
  if(f>=2&&S.aN%2)S.tel.push({x:aim(S,1),t:1,k:'big'});
  S.atk=f===1?2.6:2.2}
 /* --- глава 8: Летописец Забвения: паттерны боссов 1–6, ИИ берёт те, от которых игрок страдает больше; фаза 4 «Дамп» --- */
 function kit8(S){const f=S.boss.phase;S.aN++;
  if(f===4){const rows=[S.gy-12,S.gy-112,S.gy-212];S.tel.push({x:S.rnd()<.5?0:S.W,y:rows[Math.floor(S.rnd()*3)],t:.6,k:'mem',real:S.rnd()<.55?1:0});S.atk=1.1;return}
  const pr=[[1,2],[3,4],[5,6]][f-1],a=S.fear[pr[0]]||0,b=S.fear[pr[1]]||0;
  const k=S.series>0?4:a>b?pr[0]:b>a?pr[1]:pr[S.aN%2];S.lastK=k;KITS[k](S);S.atk*=1.1}
 /* --- глава 9: Страж Тишины: осколки, серии «Замри» (длина растёт после успеха), фальшивый HUD --- */
 function kit9(S){const f=S.boss.phase;S.aN++;
  S.tel.push({x:aim(S,1),t:1.1,k:'big'});
  if(f>=2&&!S.fz&&S.fzQ<=0)S.fzQ=S.fzK;
  if(f===3)S.tel.push({x:S.boss.x,t:.6,k:'fan'});
  S.atk=f===1?2.2:f===2?3.2:2.8}
 /* --- глава 10: Кернел: Память (призраки), Терминал (окна и исчезающие платформы), Ядро (паттерны 1–9 по 8 с), Ноль (мост) --- */
 function kit10(S){const f=S.boss.phase,rows=[S.gy,S.gy-100,S.gy-200];S.aN++;
  if(f===4){S.atk=9;return}
  if(f===1){for(let i=0;i<1+(S.aN%2);i++){if(S.gh.length+S.tel.filter(a=>a.k==='gh').length>=4)break;S.tel.push({x:S.rnd()<.5?0:S.W,y:rows[Math.floor(S.rnd()*3)]-14,t:.8,k:'gh'})}S.atk=2.4;return}
  if(f===2){kit6(S);S.atk=3;return}
  if(!S.t3)S.t3=S.t;const k=1+Math.floor((S.t-S.t3)/8)%9;S.ck=k;KITS[k](S)}
 const KITS={1:kit1,2:kit2,3:kit3,4:kit4,5:kit5,6:kit6,7:kit7,8:kit8,9:kit9,10:kit10};
 function attack(S){const k=KITS[S.bid]||kit1;k(S)}
 function dropPlat(S){
  /* ИИ: давит там, где игрок проводит больше всего времени (не чаще раза за период) */
  const p=S.p,tot=S.hab[0]+S.hab[1]+S.hab[2]+.001,b=S.hab.indexOf(Math.max(...S.hab));let idx;
  const near=lst=>lst.filter(i=>S.pl[i].st==='ok').sort((a,c)=>Math.abs(S.pl[a].x+S.pl[a].w/2-p.x)-Math.abs(S.pl[c].x+S.pl[c].w/2-p.x))[0];
  if(S.hab[b]/tot>.45)idx=near(b===0?[0,1]:b===1?[2,3]:[2,3]);else{const l=[0,1,2,3].filter(i=>S.pl[i].st==='ok');idx=l[Math.floor(S.rnd()*l.length)]}
  if(idx==null)return;
  /* не роняем обе половины пола сразу */
  if(idx<2&&S.pl[1-idx].st!=='ok')return;
  S.pl[idx].st='warn';S.pl[idx].t=1.2;S.ev.push('warn')}
 /* --- Stale (глава 3): инвалидация раз в 8–10 с (за 1 с мигают зоны, которые сменятся); поднятые платформы: 1 устаревшая в фазе 1, 2 в фазах 2–3;
   пол всегда свежий; ИИ ставит устаревшую платформу на то место, где игрок стоит дольше всего. Свежий байт появляется только на свежей платформе;
   каждые 5 байтов — пульс (20 % HP). --- */
const STALE_UP=[2,3,4];
function staleTick(S,dt){
 const p=S.p,PW=E.PW,PH=E.PH;
 /* привычки: где игрок стоит (учитываем, пока он на платформе) */
 if(p.on){const i=S.pl.findIndex(q=>q.st!=='gone'&&p.x>q.x&&p.x<q.x+q.w&&Math.abs(p.y+PH-q.y)<3);if(i>=0)S.pt[i]+=dt}
 S.pt=S.pt.map(v=>v*(1-dt*.02));
 S.pulseT=Math.max(0,S.pulseT-dt);
 /* инвалидация: предупреждение за 1 с, потом смена */
 S.inval-=dt;
 if(S.inval<=1&&!S.invW){
  S.invW=1;const n=S.boss.phase===1?1:2,pts=STALE_UP.map(i=>S.pt[i]),mx=Math.max(...pts);
  const first=mx>=1?STALE_UP[pts.indexOf(mx)]:STALE_UP[Math.floor(S.rnd()*3)];
  const pick=[first];if(n>1){const rest=STALE_UP.filter(i=>i!==first);pick.push(rest[Math.floor(S.rnd()*2)])}
  S.nxt=pick;S.pl.forEach((q,i)=>{q.nx=STALE_UP.includes(i)&&pick.includes(i)!==!!q.stale});S.ev.push('warn');
 }
 if(S.inval<=0){S.inval=8+S.rnd()*2;S.invW=0;S.pl.forEach((q,i)=>{if(STALE_UP.includes(i))q.stale=S.nxt.includes(i);q.nx=false})}
 /* свежие байты: на свежих платформах, не больше двух сразу; интервал растёт с фазой (2,8 / 2,4 / 2,0 с) */
 S.sbT-=dt;
 if(S.sbT<=0){S.sbT=[2.8,2.4,2][S.boss.phase-1]+(S.rnd()-.5)*.6;
  const ok=S.pl.filter(q=>q.st==='ok'&&!q.stale);
  if(ok.length&&S.sbytes.length<2){const q=ok[Math.floor(S.rnd()*ok.length)];S.sbytes.push({x:q.x+q.w*(.2+S.rnd()*.6),y:q.y-22,t:5.5})}}
 /* сбор: каждые пять байтов — пульс */
 S.sbytes=S.sbytes.filter(b=>{b.t-=dt;if(b.t<=0)return false;
  if(Math.abs(b.x-p.x)<16&&Math.abs(b.y-(p.y+PH/2))<24){S.sb++;S.ev.push('byte');if(S.sb>=5){S.sb=0;S.pulseT=.6;S.ev.push('fix');dmg(S)}return false}
  return true});
}
function step(S,dt,inp){
  if(S.b12){GameBoss12.step(S,dt,inp);return}
  if(S.over)return;inp=inp||{};const p=S.p,B=S.boss,W=S.W;
  S.t+=dt;S.fair=Math.max(0,S.fair-dt);S.slow=Math.max(0,S.slow-dt);
  B.phase=S.bid===8||S.bid===10?(B.hp>75?1:B.hp>50?2:B.hp>25?3:4):B.hp>70?1:B.hp>35?2:3;
  /* движение босса: медленно плывёт и тянется к игроку (скорость ограничена) */
  const tx=S.bid===10&&S.p4?S.pl[4].x+S.pl[4].w:clamp(p.x*.5+W*.25+Math.sin(S.t*.5)*W*.2,50,W-50);B.x+=clamp(tx-B.x,-60*dt,60*dt);B.y=64+Math.sin(S.t*1.3)*6;
  /* «растерянность»: в фазе 3 раз в 8 с на 2 с ключ появляется ближе */
  B.conf=B.phase===3&&(S.t%8)<2?1:0;
  /* Тень: цикл гравитации (предупреждение 1 с, потом 5 с вверх ногами, потолок безопасен) */
  if(S.bid===7){
   if(B.phase===2&&!S.flip&&!S.fw){S.fT-=dt;if(S.fT<=0){S.fw=1;S.ev.push('warn')}}
   else if(S.fw>0){S.fw-=dt;if(S.fw<=0){S.fw=0;S.flip=5;S.fT=11}}
   else if(S.flip>0){S.flip-=dt;if(S.flip<=0){S.flip=0;S.pl.forEach(q=>{q.st='ok'});const a=S.pl[0],b=S.pl[1];if(S.p.x>a.x+a.w-E.PW/2&&S.p.x<b.x+E.PW/2)S.p.x=S.p.x<W/2?a.x+a.w-E.PW:b.x+E.PW}}}
  /* игрок */
  const gp=S.gy,PW=E.PW,PH=E.PH;p.vx=(inp.ax||0)*SPD*(S.slow>0?.8:1);p.x=clamp(p.x+p.vx*dt,PW/2,W-PW/2);
  for(const w of S.walls)if(p.x+PW/2>w.x-7&&p.x-PW/2<w.x+7&&p.y+PH>w.y&&p.y<w.y+w.h){if(S.wb>0){S.wb--;w.t=0;S.ev.push('shield')}else p.x=p.x<w.x?w.x-7-PW/2:w.x+7+PW/2}
  if(inp.pressed)p.buf=.12;p.coy=p.on?.08:p.coy-dt;p.buf-=dt;
  if(p.buf>0&&p.coy>0){p.vy=-E.JV*(S.flip>0?-1:1);p.on=false;p.coy=0;p.buf=0;p.hold=E.HMAX;S.ev.push('jump')}
  let g=E.G;const sg=S.flip>0?-1:1;if(inp.down&&p.vy*sg<0&&p.hold>0){g=E.G*E.HG;p.hold-=dt}else if(!inp.down)p.hold=0;
  const pb=p.y+PH;p.vy+=g*sg*dt;p.y+=p.vy*dt;let on=false;
  if(S.flip>0){if(p.y<=100){p.y=100;p.vy=0;on=true}}else if(p.vy>=0)for(const q of S.pl){if(q.st==='gone')continue;
   if(pb<=q.y+3&&p.y+PH>=q.y&&p.x+PW/2>q.x&&p.x-PW/2<q.x+q.w){p.y=q.y-PH;p.vy=0;on=true;break}}
  p.on=on;p.inv=Math.max(0,p.inv-dt);
  if(p.y>S.H+30){fall(S);return}
  /* привычки игрока */
  S.hab[band(S,p.y+PH)]+=dt;S.hab=S.hab.map(v=>v*(1-dt*.03));if(on&&Math.abs(p.vx)<1)S.idle+=dt;else S.idle=0;
  /* платформы: метка → падение → возвращение */
  S.fallT-=dt;if(S.fallT<=0&&!(S.flip>0||S.fw>0)&&!S.p4&&S.bid!==3){dropPlat(S);S.fallT=S.bid===1?12:S.bid===10&&B.phase===2?6:B.phase===3?9:12}
  for(const q of S.pl){if(q.st==='warn'){q.t-=dt;if(q.t<=0){q.st='gone';q.t=3}}else if(q.st==='gone'){q.t-=dt;if(q.t<=0)q.st='ok'}}
  /* особенности глав */
  if(S.bid===3){
   staleTick(S,dt);
   for(const q of S.pl)if(q.stale&&q.st==='ok'&&p.on&&p.y+PH>=q.y-1&&p.y+PH<=q.y+3&&p.x+PW/2>q.x&&p.x-PW/2<q.x+q.w){q.sc=(q.sc||0)+dt;if(q.sc>(S.bid===3?.6:.4)){q.st='gone';q.t=3;q.sc=0}}else q.sc=0;
   S.hist=S.hist||[];S.hist.push({x:p.x,y:p.y});if(S.hist.length>180)S.hist.shift();
   if(B.phase>=2&&S.hist.length>=180){const g=S.hist[0];S.ghost=g;if(Math.abs(g.x-p.x)<PW&&Math.abs(g.y-p.y)<PH)hit(S)}else S.ghost=null}
  if(S.lag){const L=S.lag;L.t-=dt;if(L.t<=0)S.lag=null;else if(L.t<2.2){L.on=1;if(Math.abs(p.x-(L.x+L.w/2))<L.w/2+PW/2)p.x-=p.vx*dt*.3}}
  for(const w of S.walls)w.t-=dt;S.walls=S.walls.filter(w=>w.t>0);
  if(S.bid===5){
   S.fk-=dt;if(S.fk<=0&&S.free.length<2){const q=S.pl[2+Math.floor(S.rnd()*3)];S.free.push({x:q.x+q.w*(.2+S.rnd()*.6),y:q.y-14,t:9});S.fk=6}
   for(const f of S.free){f.t-=dt;if(Math.abs(f.x-p.x)<18&&Math.abs(f.y-(p.y+PH/2))<24){f.t=0;S.wb=Math.min(3,S.wb+1);S.tok=Math.min(100,S.tok+25);S.ev.push('byte')}}
   S.free=S.free.filter(f=>f.t>0)}
  if(S.wins.length||S.las){
   for(const w of S.wins){if(w.d>0)w.d-=dt;else w.t-=dt}
   const ex=S.wins.filter(w=>w.d<=0&&w.t<=0);S.wins=S.wins.filter(w=>!(w.d<=0&&w.t<=0));
   for(const w of ex)if(w.real){S.rj.push(w.max);if(S.rj.length>8)S.rj.shift();erase(S)}
   if(S.las){S.las.t-=dt;if(S.las.t<=0)S.las=null;else if(Math.abs(p.y+PH/2-S.las.y)<18)hit(S)}}
  if(S.bid===7){
   S.trapT-=dt;S.hs.push({x:p.x,y:p.y});if(S.hs.length>31)S.hs.shift();
   if(B.phase===1&&S.hs.length>30){const g=S.hs[0];S.sd=g;let pa=0;for(let i=1;i<S.hs.length;i++)pa+=Math.abs(S.hs[i].x-S.hs[i-1].x)+Math.abs(S.hs[i].y-S.hs[i-1].y);S.sdA=pa>50;
    if(S.sdA)for(const q of[g,S.hs[5]])if(Math.abs(q.x-p.x)<PW&&Math.abs(q.y-p.y)<PH){hit(S);break}}else{S.sd=null;S.sdA=false}
   const cell=Math.floor(p.x/60)*3+band(S,p.y+PH);
   if(cell!==S.cell){S.cell=cell;S.rt[cell]=(S.rt[cell]||0)+1;if(S.rt[cell]>=3&&S.trapT<=0&&!(S.flip>0||S.fw>0)){S.rt={};S.trapT=6;S.tel.push({x:clamp(p.x,16,W-16),t:1,k:'big'})}}
   if(B.phase===3){S.dark=true;if(!S.seq)newSeq(S);const sq=S.seq,ph=S.t%4.2,sl=Math.floor(ph/1.4);sq.lit=ph-sl*1.4<1?sq.ord[sl]:-1;
    sq.n.forEach((d,i)=>{const q=S.pl[i+2];d.x=q.x+q.w/2;d.y=q.y-14});
    let tc=-1;sq.n.forEach((d,i)=>{if(Math.abs(d.x-p.x)<16&&Math.abs(d.y-(p.y+PH/2))<24)tc=i});
    if(tc<0)sq.last=-1;else if(tc!==sq.last){sq.last=tc;if(tc===sq.ord[sq.got]){sq.got++;S.ev.push('byte');if(sq.got>=3){dmg(S);newSeq(S)}}else{sq.got=0;S.ev.push('warn')}}}}
  /* «Замри» (Страж Тишины и Ядро Кернела): удерживать кнопку 1,5 с после предупреждения 0,8 с */
  if(S.bid===9)S.fh=B.phase>=2&&(S.t%8)<3;
  if(S.fz){const z=S.fz;z.t-=dt;
   if(z.st==='warn'){if(z.t<=0){z.st='on';z.t=1.5}}
   else if(!inp.frz){hit(S);S.fz=null;S.fzQ=0;S.fzK=1;S.fzS=0}
   else if(z.t<=0){S.fz=null;S.fzS++;S.ev.push('fix');if(S.fzQ<=0)S.fzK=Math.min(4,S.fzK+1);if(S.fzS%3===0)dmg(S)}}
  else if(S.fzQ>0){S.fzG-=dt;if(S.fzG<=0){S.fz={st:'warn',t:.8};S.fzQ--;S.fzG=.6;S.ev.push('warn')}}
  /* Летописец: воспоминания в фазе «Дамп»: настоящие светятся ровно (собрать), подделки мерцают (минус сердце) */
  if(S.bid===8){for(const m of S.mm){m.x+=m.vx*dt;if(Math.abs(m.x-p.x)<16&&Math.abs(m.y-(p.y+PH/2))<20){m.dead=1;if(m.real){S.memc++;S.ev.push('byte');if(S.memc%2===0)dmg(S)}else hit(S)}if(m.x<-30||m.x>W+30)m.dead=1}S.mm=S.mm.filter(m=>!m.dead)}
  /* Кернел: призраки (приземлись сверху) и фаза «Ноль» с мостом */
  if(S.bid===10){
   for(const g of S.gh){g.x+=g.vx*dt;if(Math.abs(g.x-p.x)<14+PW/2){const bot=p.y+PH;
    if(p.vy>0&&bot>g.y-16&&bot<g.y+2){g.dead=1;S.rem++;S.ev.push('fix');p.vy=-E.JV*.6;p.on=false;if(S.rem%3===0)dmg(S)}
    else if(Math.abs(g.y-(p.y+PH/2))<14+PH/2)hit(S)}}
   S.gh=S.gh.filter(g=>!g.dead&&g.x>-30&&g.x<W+30);
   if(B.phase===4){if(!S.p4){S.p4=1;S.tel=[];S.sh=[];S.gh=[];S.wins=[];S.las=null;S.key=null;S.fz=null;S.fzQ=0;S.pl.forEach(q=>{q.st='ok'})}
    const q=S.pl[4],bw=W*(.34+.5*Math.min(1,S.tb/300));q.w=bw;q.x=W/2-bw/2;
    if(p.on&&Math.abs(p.y+PH-q.y)<2&&p.x>q.x+q.w-40){S.over='win';S.score+=1000;S.ev.push('win');return}}}
  /* атаки: сначала предупреждение, потом снаряд */
  S.atk-=dt;if(S.atk<=0)attack(S);
  for(const a of S.tel){a.t-=dt;if(a.t>0)continue;
   if(a.k==='big'){shot(S,a.x,-10,0,140,13,1);a.dead=1}
   else if(a.k==='fan'||a.k==='fan2'){const o=a.k==='fan'?B:{x:a.x,y:0};const ang=Math.atan2(p.y-o.y,p.x-o.x),sp=a.v||330,rr=a.r||5;for(const d of[-.28,0,.28])shot(S,o.x,o.y,Math.cos(ang+d)*sp,Math.sin(ang+d)*sp,rr,2);a.dead=1}
   else if(a.k==='row'){for(let i=0;i<6;i++){const x=(i+.5)*S.W/6;if(Math.abs(x-a.x)>48)shot(S,x,-10,0,130,12,1)}a.dead=1}
   else if(a.k==='blk'){shot(S,a.x,-30,0,300,26,1);a.dead=1}
   else if(a.k==='pkt'){shot(S,a.x,a.y,a.x<S.W/2?360:-360,0,7,2);a.dead=1}
   else if(a.k==='mem'){if(S.mm.length<6)S.mm.push({x:a.x,y:a.y,vx:a.x<S.W/2?90:-90,real:a.real,dead:0});a.dead=1}
   else if(a.k==='gh'){S.gh.push({x:a.x,y:a.y,vx:a.x<S.W/2?90:-90,dead:0});a.dead=1}
   else if(a.k==='wall'){S.walls.push({x:a.x,y:a.y-56,h:56,t:7});a.dead=1}
   else if(a.k==='up'){shot(S,a.x,S.H+10,0,-140,13,1);a.dead=1}
   else if(a.k==='las'){S.las={y:a.y,t:.3};a.dead=1}
   else if(a.k==='str'){const x=aim(S,.8);shot(S,x,-10,0,a.v||220,a.kind===4?9:7,a.kind||3);a.c++;a.t=a.iv;if(a.c>=a.n)a.dead=1}}
  S.tel=S.tel.filter(a=>!a.dead);
  for(const s of S.sh){s.x+=s.vx*dt;s.y+=s.vy*dt;
   if(Math.abs(s.x-p.x)<s.r+PW/2&&Math.abs(s.y-(p.y+PH/2))<s.r+PH/2)hit(S)}
  S.sh=S.sh.filter(s=>s.y<S.H+30&&s.y>-60&&s.x>-30&&s.x<W+30&&!(Math.abs(s.x-p.x)<s.r+PW/2&&Math.abs(s.y-(p.y+PH/2))<s.r+PH/2&&p.inv>0&&0));
  /* ключ на самой высокой платформе (в фазе «растерянности» на средней) */
  if(S.bid===3){}else if(S.flip>0){}else if(S.key){S.key.t-=dt;if(S.key.t<=0)S.key=null;else if(Math.abs(S.key.x-p.x)<16&&Math.abs(S.key.y-(p.y+PH/2))<24){S.key=null;if(dmg(S))return;S.kt=B.phase===1?7:B.phase===2?6:5}}
  else{S.kt-=dt;if(S.kt<=0&&!S.p4){const q=B.conf?S.pl[S.rnd()<.5?2:3]:S.pl[4];S.key={x:q.x+q.w*(.25+S.rnd()*.5),y:q.y-20,t:6}}}}
 return{create,step,layout,reject:S=>{if(S&&S.b12)return;reject(S)},SPD}})();
