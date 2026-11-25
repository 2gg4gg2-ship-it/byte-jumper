/* ===== БОССЫ 1 и 2 по документу v3 (раздел 4): «404» в шахте из файлов и «Колосс» в башне из ярусов.
   Логика и отрисовка без DOM. Вызывается из arena.js (create/step/layout) и game.js (draw).
   Сердца, падение, прыжок и ввод такие же, как у остальных арен (см. arena.js и engine.js). Предупреждение есть у каждой атаки.
   Босса не убивают: «исправляют». Числа — стартовые, подтверждать на телефоне. */
const GameBoss12=(()=>{
 const E=GameEngine,SPD=170,TAU=6.2832;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function rng(a){a|=0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

 /* ---------- создание ---------- */
 function create(o){
  const W=o.W,H=o.H,rnd=rng(o.seed||7);
  const S={bid:o.id,arena:true,b12:true,mode:'boss',W,H,WH:o.id===1?H*3:H,cam:0,rnd,t:0,over:null,ev:[],score:0,bytes:0,combo:0,
   hearts:3,maxHearts:3,lost:0,
   boss:{hp:100,max:100,phase:1,x:W/2,y:96,conf:0,shards:0,pops:0},
   p:{x:W*.5,y:0,vx:0,vy:0,on:false,hold:0,buf:0,coy:0,inv:0,stand:null,lastG:0},
   pl:[],sh:[],tel:[],say:null,cloud:0,fly:[],rail:[],frags:[],cols:[],waves:[],sheets:[],
   tPop:3.5,tDrop:7.5,tCloud:11,tBm:2.3,tSheet:1.2,tColl:13,tWave:4,tCol:4,tFrag:3,fT:0,fDone:false,fr:{st:'wait',t:4.5}};
  if(o.id===1)buildShaft(S);else buildTower(S);
  if(o.id===2){S.boss.x=W-40;S.boss.y=tierY(S,2)-70}
  const p=S.p;p.x=W*.5;p.y=S.gy-E.PH;p.on=true;p.stand=S.pl[0];p.lastG=p.y;
  if(o.id===1)say(S,'Д-д-дверь… где дверь?',3.5);
  return S}

 function say(S,txt,t){S.say={txt,t}}

 /* ---------- Босс 1: шахта из файлов, высота три экрана ---------- */
 const BY=p=>96+(p-1)*110;                 /* высота груди Стража по фазе: опускается на одну папку */
 function buildShaft(S){
  const W=S.W,gy=S.WH-36;S.gy=gy;const r=S.rnd;
  S.pl=[{x:0,y:gy,w:W,st:'ok',floor:1,stand:0}];
  /* папки под Стражем: опора для каждой фазы */
  for(let ph=1;ph<=3;ph++){const y=BY(ph)+70;S.pl.push({x:W/2-62,y,w:124,st:'ok',stand:0,sup:1})}
  /* лестница вверх, шаг 100–116 px (прыжок с удержанием достаёт 121) */
  let side=0;
  for(let y=gy-112;y>400;y-=100+r()*16){
   const w=86+r()*24,cx=side===0?16+w/2+r()*W*.22:W-16-w/2-r()*W*.22;side^=1;
   const q={x:cx-w/2,y,w,st:'ok',stand:0};
   if(r()<.35){q.amp=26+r()*16;q.bx=q.x;q.ph=r()*TAU}
   S.pl.push(q)}
  /* ржавые стены шахты */
  S.gy=gy}

 /* ---------- Босс 2: башня из четырёх ярусов ---------- */
 function buildTower(S){
  const W=S.W,H=S.H;S.gy=H*.86;
  for(let i=0;i<4;i++){const y=H*.86-i*104;const even=i%2===0;
   S.pl.push({x:even?16:80,y,w:even?W-16-64-16:W-16-80,st:'ok',stand:0,tier:i})}
  S.pl[0].floor=1;S.gy=H*.86;
 }
 

 /* ---------- вспомогательное ---------- */
 function hit(S){const p=S.p;if(p.inv>0||S.over)return;S.hearts--;S.lost++;p.inv=1.3;S.combo=0;S.ev.push('hit');
  if(S.hearts<=0){S.over='dead';S.ev.push('die')}}
 /* падение: минус сердце и возврат на ближайшую целую платформу */
 function fall(S){const p=S.p;hit(S);if(S.over)return;p.inv=1.8;
  let best=null,bd=1e9;S.pl.forEach(q=>{if(q.st==='gone'||q.dead)return;const d=Math.abs(q.x+q.w/2-p.x)+Math.abs(q.y-p.y)*1.5;if(d<bd){bd=d;best=q}});
  if(!best)best=S.pl[0];
  p.x=clamp(best.x+best.w/2,E.PW/2,S.W-E.PW/2);p.y=best.y-E.PH;p.vy=0;p.on=true;p.stand=best;p.lastG=p.y;S.ev.push('fall')}
 /* прямоугольник героя против прямоугольника (x-центр, низ) */
 const over=(p,x,y,w,h)=>Math.abs(p.x-x)<(E.PW+w)/2&&p.y<y+h&&p.y+E.PH>y;
 function addWarn(S,a){S.tel.push(a)}
 function pushPlayer(S,dx){S.p.x=clamp(S.p.x+dx,E.PW/2,S.W-E.PW/2)}

 /* движение героя: управление, прыжок, гравитация, посадка на платформы (включая качающиеся) */
 function movePlayer(S,dt,inp){
  const p=S.p,PW=E.PW,PH=E.PH;
  /* качающиеся папки уносят героя, если он на них стоит */
  S.pl.forEach(q=>{if(q.amp!=null){const nx=q.bx+Math.sin(S.t*.8+q.ph)*q.amp;q.dx=nx-q.x;q.x=nx}});
  if(p.on&&p.stand&&p.stand.amp!=null)p.x+=p.stand.dx||0;
  p.vx=(inp.ax||0)*SPD;p.x=clamp(p.x+p.vx*dt,PW/2,S.W-PW/2);
  if(inp.pressed)p.buf=.12;p.coy=p.on?.08:p.coy-dt;p.buf-=dt;
  if(p.buf>0&&p.coy>0){p.vy=-E.JV;p.on=false;p.stand=null;p.coy=0;p.buf=0;p.hold=E.HMAX;S.ev.push('jump')}
  else if(p.buf>0&&S.ab&&S.ab.double&&!p.on&&!p.dj){p.vy=-E.JV*.9;p.dj=1;p.buf=0;S.ev.push('jump')}
  let g=E.G;if(inp.down&&p.vy<0&&p.hold>0){g=E.G*E.HG;p.hold-=dt}else if(!inp.down)p.hold=0;
  if(S.ab&&S.ab.fall&&inp.down&&!p.on&&p.vy>0)g=E.G*3;
  const pb=p.y+PH,air=!p.on;p.vy+=g*dt;p.y+=p.vy*dt;let on=false;
  if(p.vy>=0)for(const q of S.pl){if(q.st==='gone'||q.dead)continue;
   if(pb<=q.y+3&&p.y+PH>=q.y&&p.x+PW/2>q.x&&p.x-PW/2<q.x+q.w){
    const fell=air&&p.vy>60;p.y=q.y-PH;p.vy=0;on=true;p.stand=q;
    if(q.pop&&fell)popBlock(S,q);
    break}}
  p.on=on;if(on)p.dj=0;p.inv=Math.max(0,p.inv-dt);
  if(on){p.lastG=p.y}
  /* падение: ниже последней опоры больше 160 px — минус сердце и возврат */
  if(!on&&p.y-p.lastG>160)fall(S);
  if(p.y>S.WH+30){fall(S)}
 }

 /* стойка на платформах: для таймера «папка рушится» */
 function trackStand(S,dt){const p=S.p;if(p.on&&p.stand)p.stand.stand=(p.stand.stand||0)+dt;
  S.pl.forEach(q=>{if(q!==(p.on&&p.stand))q.stand=0})}

 /* платформы: метка → падение → возврат */
 function tickPlats(S,dt){
  for(const q of S.pl){if(q.st==='warn'){q.t-=dt;if(q.t<=0){q.st='gone';q.t=q.back||6}}
   else if(q.st==='gone'&&!q.dead){q.t-=dt;if(q.t<=0)q.st='ok'}}
  S.pl=S.pl.filter(q=>!q.dead)}

 /* ---------- атаки общие ---------- */
 function bossPos(S){return{x:S.boss.x,y:S.boss.y}}

 /* ---------- Босс 1: 404 ---------- */
 function shard(S){const B=S.boss;B.shards++;S.score+=300;S.bytes+=16;S.ev.push('fix');B.phase=Math.min(3,B.shards+1);
  B.hp=Math.max(0,100-B.shards*100/3);
  if(B.shards>=3){S.over='win';S.score+=1000;S.ev.push('win');say(S,'Ты её нашла. Иди.',4);return}
  say(S,B.shards===1?'Я… вспомнил, где дверь.':'Почти. Ещё немного.',2.6)}

 function step1(S,dt,inp){
  const B=S.boss,W=S.W,p=S.p;
  B.phase=Math.min(3,B.shards+1);B.conf=B.phase===3&&(S.t%8)<2?1:0;
  B.y+=(BY(B.phase)-B.y)*Math.min(1,dt*1.5);
  B.x=W/2+Math.sin(S.t*.4)*W*.08;
  /* камера: следит за героем, экран «едет вниз» при подъёме */
  const cT=clamp(p.y-S.H*.62,0,S.WH-S.H);S.cam+=(cT-S.cam)*Math.min(1,dt*6);
  movePlayer(S,dt,inp);
  trackStand(S,dt);
  /* ---- папки: при стоянии больше 2 с — через 10 с падает одна ---- */
  S.tDrop-=dt;
  if(S.tDrop<=0){S.tDrop=7.5;
   const c=S.pl.filter(q=>!q.floor&&!q.sup&&q.st==='ok'&&(q.stand||0)>2);
   if(c.length){const q=c[0];q.st='warn';q.t=1.2;q.back=6;S.ev.push('warn')}}
  /* ---- облако 404: 1,5 с затемняет верхнюю треть ---- */
  S.tCloud-=dt;if(S.tCloud<=0){S.tCloud=11;S.cloud=1.5;S.ev.push('warn')}
  if(S.cloud>0)S.cloud-=dt;
  /* ---- обломки табличек (черновики): медленно падают, покачиваются ---- */
  S.tSheet-=dt;
  if(S.tSheet<=0&&S.sheets.length<10){S.tSheet=1.2;S.sheets.push({x:14+S.rnd()*(W-28),y:S.cam-24,ph:S.rnd()*TAU,bx:0})}
  for(const s of S.sheets){s.y+=40*dt;s.ph+=dt*2;s.x=clamp(s.x+Math.sin(s.ph)*14*dt,10,W-10);
   if(over(p,s.x,s.y,14,18)&&!p.dead)hit(S)}
  S.sheets=S.sheets.filter(s=>s.y<S.WH+30);
  /* ---- диск-табличка: метка 0,8 с, потом бросок; дуга, отражение от стен дважды ---- */
  S.tBm-=dt;
  if(S.tBm<=0){const ph=B.phase;S.tBm=ph===1?2.3:ph===2?1.9:1.6;S.tel.push({k:'bm',x:B.x,t:.8});if(ph>=2)S.tel.push({k:'bm',x:B.x,t:1.3})}
  for(const a of S.tel){a.t-=dt;if(a.t>0)continue;a.dead=1;
   if(a.k==='bm'){const dir=p.x<B.x?-1:1;S.sh.push({k:'disc',x:B.x,y:B.y+30,vx:dir*143,vy:-40,r:14,bn:0,t:0})}}
  S.tel=S.tel.filter(a=>!a.dead);
  for(const d of S.sh){if(d.k!=='disc')continue;d.t+=dt;d.vy+=120*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;
   if(d.x<d.r||d.x>W-d.r){d.vx=-d.vx;d.x=clamp(d.x,d.r,W-d.r);d.bn++;if(d.bn>2)d.dead=1}
   if(d.y>S.WH+40)d.dead=1;
   if(Math.abs(p.x-d.x)<d.r+E.PW/2&&Math.abs(p.y+E.PH/2-d.y)<d.r+E.PH/2)hit(S)}
  S.sh=S.sh.filter(d=>!d.dead);
  /* ---- рамка на груди: открыта только в окне. Ждёт 4,5 с → мигает 1 с (предупреждение) → открыта 2 с → снова ждёт.
     Удар снизу в открытое окно — осколок. Промах: ждать следующего окна. ---- */
  const fr=S.fr;fr.t-=dt;
  if(fr.t<=0){if(fr.st==='wait'){fr.st='warn';fr.t=1}else if(fr.st==='warn'){fr.st='open';fr.t=2;S.ev.push('warn')}else{fr.st='wait';fr.t=4.5}}
  const fx=B.x-16,fy=B.y+8,fw=32,fh=22;
  if(!S.over&&fr.st==='open'&&p.vy<0&&over(p,fx+fw/2,fy,fw,fh)&&p.y+E.PH/2>fy+fh/2){
   S.fDone=true;fr.st='wait';fr.t=4.5;shard(S)}
  if(S.say){S.say.t-=dt;if(S.say.t<=0)S.say=null}
}

 /* ---------- Босс 2: Колосс ---------- */
 const tierY=(S,i)=>S.H*.86-i*104;
 const PHASE2=h=>h>70?1:h>35?2:3;
 function step2(S,dt,inp){
  const B=S.boss,W=S.W,H=S.H,p=S.p;
  B.phase=PHASE2(B.hp);
  movePlayer(S,dt,inp);
  trackStand(S,dt);
  /* ---- ярус внизу отключается раз в 15 с (мигает 1 с, потом рушится вниз) ---- */
  S.tColl-=dt;
  if(S.tColl<=0){S.tColl=13;const q=S.pl.filter(t=>t.tier!=null&&t.tier<3&&t.st==='ok').sort((a,b)=>a.tier-b.tier)[0];
   if(q){q.st='warn';q.t=1;q.back=20;S.ev.push('warn')}}
  /* ---- блоки-кадры: скользят по рельсам вдоль правой стены, 40 px/с; касание отталкивает на 60 px ---- */
  for(const r of S.rail){r.y+=r.dir*48*dt;if(r.y<40||r.y>H-70)r.dir*=-1;r.cd=Math.max(0,(r.cd||0)-dt);
   if(r.cd<=0&&Math.abs(p.x-(W-11))<11+E.PW/2&&p.y<r.y+22&&p.y+E.PH>r.y){pushPlayer(S,-60);r.cd=.6;S.ev.push('shield')}}
  if(B.phase>=1&&S.rail.length===0)S.rail.push({y:70,dir:1,cd:0});
  if(B.phase>=2&&S.rail.length===1)S.rail.push({y:H*.6,dir:-1,cd:0});
  /* ---- пуш-волна: раз в 6 с, метка на краю яруса 1 с ---- */
  S.tWave-=dt;
  if(S.tWave<=0){S.tWave=5;
   const ti=Math.floor(S.rnd()*4);S.tel.push({k:'edge',tier:ti,t:1})}
  /* ---- колонна: фаза 2+, раз в 4 с, тонкая линия 1 с, потом три блока ---- */
  if(B.phase>=2){S.tCol-=dt;if(S.tCol<=0){S.tCol=3.3;S.tel.push({k:'col',x:clamp(p.x+p.vx*.6,20,W-20),t:1})}}
  for(const a of S.tel){a.t-=dt;if(a.t>0)continue;a.dead=1;
   if(a.k==='edge'){const q=S.pl.find(t=>t.tier===a.tier);if(!q)continue;
    const even=a.tier%2===0;S.waves.push({x:even?q.x-34:q.x+q.w,y:q.y-80,w:34,h:80,dir:even?1:-1,v:144,tier:a.tier})}
   if(a.k==='col'){for(let i=0;i<3;i++)S.cols.push({x:a.x,y:-30-i*34,vy:312,dead:0,st:0})}
   if(a.k==='frag'){S.sh.push({k:'blk',x:a.x,y:a.y,vy:200,dead:0})}}
  S.tel=S.tel.filter(a=>!a.dead);
  for(const w of S.waves){w.x+=w.dir*w.v*dt;
   if(over(p,w.x+w.w/2,w.y,w.w,w.h)){pushPlayer(S,w.dir*150*dt)}}
  S.waves=S.waves.filter(w=>w.x>-60&&w.x<W+60);
  for(const c of S.cols){c.y+=c.vy*dt;if(over(p,c.x,c.y,26,26))hit(S)}
  S.cols=S.cols.filter(c=>c.y<H+40);
  /* ---- фаза 3: два осколка прыгают по ярусам и бросают блоки ---- */
  if(B.phase===3&&!S.fDone){S.fDone=true;S.frags=[{x:W*.3,dir:1,ty:1,hop:0,from:1,tt:3},{x:W*.7,dir:-1,ty:2,hop:0,from:2,tt:3.5}];say(S,'push… push…',3)}
  for(const f of S.frags){f.x+=f.dir*72*dt;if(f.x<30||f.x>W-30){f.dir*=-1;f.x=clamp(f.x,30,W-30)}
   f.tt-=dt;if(f.tt<=0){f.tt=2.5;f.from=f.ty;f.ty=clamp(f.ty+(S.rnd()<.5?-1:1),0,3);f.hop=.6;S.tel.push({k:'frag',x:f.x,y:tierY(S,f.ty)-14,t:.6})}
   if(f.hop>0){f.hop-=dt}}
  for(const f of S.frags){const yT=tierY(S,f.ty)-14,yF=tierY(S,f.from)-14,k=f.hop>0?1-f.hop/.6:1;f.y=yF+(yT-yF)*k-Math.sin(Math.PI*k)*18;
   if(Math.abs(p.x-f.x)<8+E.PW/2&&Math.abs(p.y+E.PH/2-f.y)<8+E.PH/2)hit(S)}
  /* блоки от бросков фрагментов: падают вниз, касание — удар */
  for(const d of S.sh){if(d.k!=='blk')continue;d.y+=d.vy*dt;if(over(p,d.x,d.y,26,26))hit(S);if(d.y>H+40)d.dead=1}
  S.sh=S.sh.filter(d=>!d.dead);
  /* ---- POP-блоки: спавн, посадка сверху — выталкивается; через 10 с становится пуш-волной ---- */
  S.tPop-=dt;
  const alive=S.pl.filter(q=>q.pop&&!q.dead).length;
  if(S.tPop<=0&&alive<2&&B.pops<9){S.tPop=3.5;
   const ti=1+Math.floor(S.rnd()*3),q=S.pl.find(t=>t.tier===ti);
   if(q){const x=q.x+10+S.rnd()*(q.w-52);S.pl.push({x,y:q.y-20,w:32,st:'ok',stand:0,pop:1,born:S.t,tier:ti})}}
  for(const q of S.pl){if(q.pop&&!q.dead&&S.t-q.born>8){q.dead=1;const dir=S.rnd()<.5?-1:1;
   S.waves.push({x:dir>0?q.x:q.x+q.w,y:q.y-60,w:34,h:80,dir,v:144,tier:q.tier});S.ev.push('warn')}}
  /* вспышки: блок выталкивается к Колоссу */
  for(const f of S.fly)f.t+=dt;S.fly=S.fly.filter(f=>f.t<.5);
  if(S.say){S.say.t-=dt;if(S.say.t<=0)S.say=null}
  for(const r of S.pl)if(r.dead&&r.pop)r.dead=1;
}

 function popBlock(S,q){if(q.dead||S.over)return;const B=S.boss;B.pops++;q.dead=1;S.score+=100;S.bytes+=8;S.ev.push('fix');
  S.fly.push({x:q.x+q.w/2,y:q.y,t:0});
  B.hp=Math.max(0,100-B.pops*100/9);
  if(B.pops>=9){S.over='win';S.score+=1000;S.ev.push('win');say(S,'Колосс: «Я просто хотел помнить всех».',4)}}

 /* ---------- общий вход ---------- */
 function step(S,dt,inp){
  if(S.over)return;inp=inp||{};S.t+=dt;
  if(S.bid===1)step1(S,dt,inp);else step2(S,dt,inp);
  tickPlats(S,dt)}
 function layout(S,W,H){S.W=W;S.H=H;if(S.bid===1)S.WH=H*3;else S.WH=H;S.gy=S.bid===1?S.WH-36:H*.86;
  S.p.x=clamp(S.p.x,E.PW/2,W-E.PW/2)}
 function reject(){}

  return{create,step,layout,reject,SPD}})();
