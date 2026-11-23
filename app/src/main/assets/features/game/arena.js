/* ===== АРЕНА БОССА: логика без DOM. Экран не прокручивается; управление: ax (-1..1), прыжок тап/удержание =====
   Босс 1 «Потерянный Страж» («Ошибка 404»). Подробности и числа: docs/BOSSES.md. Предупреждение перед каждой атакой обязательно.
   ИИ босса (aim/habits): целится с упреждением и ошибкой, давит там, где игрок проводит больше времени, и ослабляет прицел после двух ударов подряд. */
const GameArena=(()=>{
 const E=GameEngine,SPD=170,KEYHP=100/9;
 function layout(S){
  const W=S.W,H=S.H,gy=H*.84;S.gy=gy;
  const P=[[0,gy,W*.44],[W*.56,gy,W*.44],[14,gy-100,W*.3],[W-14-W*.3,gy-100,W*.3],[W*.5-W*.17,gy-200,W*.34]];
  if(!S.pl)S.pl=P.map(()=>({st:'ok',t:0}));
  P.forEach((q,i)=>{const o=S.pl[i];o.x=q[0];o.y=q[1];o.w=q[2];o.floor=i<2})}
 function create(o){
  const S={arena:true,mode:'boss',W:o.W,H:o.H,rnd:mul(o.seed||7),t:0,over:null,ev:[],score:0,bytes:0,combo:0,hearts:3,maxHearts:3,lost:0,
   boss:{hp:100,max:100,phase:1,x:o.W/2,y:64,conf:0},p:{x:o.W*.22,y:0,vx:0,vy:0,on:false,hold:0,buf:0,coy:0,inv:0},
   tel:[],sh:[],key:null,kt:3,atk:2,aN:0,fallT:8,hab:[0,0,0],idle:0,fair:0,hits:[],pl:null};
  layout(S);const p=S.p;p.y=S.gy-E.PH;p.on=true;return S}
 function mul(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const band=(S,y)=>y>=S.gy-30?0:y>=S.gy-130?1:2;
 /* прицел с упреждением: куда игрок попадёт через t секунд; ошибка меньше на поздних фазах, больше после ударов */
 function aim(S,t){const p=S.p,amp=S.fair>0?95:S.boss.phase===1?55:S.boss.phase===2?38:26;
  return clamp(p.x+p.vx*t*.8+(S.rnd()-.5)*2*amp,16,S.W-16)}
 function hit(S){const p=S.p;if(p.inv>0||S.over)return;S.hearts--;S.lost++;p.inv=1.3;S.combo=0;S.ev.push('hit');
  S.hits.push(S.t);S.hits=S.hits.filter(x=>S.t-x<6);if(S.hits.length>=2)S.fair=6;
  if(S.hearts<=0){S.over='dead';S.ev.push('die')}}
 /* падение вниз: минус сердце, возврат на ближайшую целую платформу */
 function fall(S){const p=S.p;hit(S);if(S.over)return;p.inv=1.8;
  let best=null,bd=1e9;S.pl.forEach(q=>{if(q.st!=='ok')return;const d=Math.abs(q.x+q.w/2-p.x)+(S.gy-q.y)*1.5;if(d<bd){bd=d;best=q}});
  best=best||S.pl[4];p.x=best.x+best.w/2;p.y=best.y-E.PH;p.vy=0;p.on=true;S.ev.push('fall')}
 const shot=(S,x,y,vx,vy,r,kind)=>{if(S.sh.length<20)S.sh.push({x,y,vx,vy,r,kind:kind||0})};
 function attack(S){
  const B=S.boss,f=B.phase,p=S.p,bx=B.x;S.aN++;
  if(f===1){
   S.tel.push({x:aim(S,1),t:1,k:'big'});if(S.rnd()<.35)S.tel.push({x:aim(S,1)+(S.rnd()<.5?-70:70),t:1.2,k:'big'});S.atk=1.7}
  else if(f===2){
   if(S.aN%3===0)S.tel.push({x:aim(S,1),t:1,k:'big'});
   else S.tel.push({x:0,t:.7,k:'str',n:5,iv:.35,c:0});
   S.atk=2.4}
  else{
   if(S.aN%2)S.tel.push({x:bx,t:.5,k:'fan'});else S.tel.push({x:aim(S,1),t:1,k:'big'});
   if(S.idle>1.5)S.tel.push({x:p.x,t:.6,k:'fan2'});
   S.atk=2.0}}
 function dropPlat(S){
  /* ИИ: давит там, где игрок проводит больше всего времени (не чаще раза за период) */
  const p=S.p,tot=S.hab[0]+S.hab[1]+S.hab[2]+.001,b=S.hab.indexOf(Math.max(...S.hab));let idx;
  const near=lst=>lst.filter(i=>S.pl[i].st==='ok').sort((a,c)=>Math.abs(S.pl[a].x+S.pl[a].w/2-p.x)-Math.abs(S.pl[c].x+S.pl[c].w/2-p.x))[0];
  if(S.hab[b]/tot>.45)idx=near(b===0?[0,1]:b===1?[2,3]:[2,3]);else{const l=[0,1,2,3].filter(i=>S.pl[i].st==='ok');idx=l[Math.floor(S.rnd()*l.length)]}
  if(idx==null)return;
  /* не роняем обе половины пола сразу */
  if(idx<2&&S.pl[1-idx].st!=='ok')return;
  S.pl[idx].st='warn';S.pl[idx].t=1.2;S.ev.push('warn')}
 function step(S,dt,inp){
  if(S.over)return;inp=inp||{};const p=S.p,B=S.boss,W=S.W;
  S.t+=dt;S.fair=Math.max(0,S.fair-dt);
  B.phase=B.hp>70?1:B.hp>35?2:3;
  /* движение босса: медленно плывёт и тянется к игроку (скорость ограничена) */
  const tx=clamp(p.x*.5+W*.25+Math.sin(S.t*.5)*W*.2,50,W-50);B.x+=clamp(tx-B.x,-60*dt,60*dt);B.y=64+Math.sin(S.t*1.3)*6;
  /* «растерянность»: в фазе 3 раз в 8 с на 2 с ключ появляется ближе */
  B.conf=B.phase===3&&(S.t%8)<2?1:0;
  /* игрок */
  const gp=S.gy,PW=E.PW,PH=E.PH;p.vx=(inp.ax||0)*SPD;p.x=clamp(p.x+p.vx*dt,PW/2,W-PW/2);
  if(inp.pressed)p.buf=.12;p.coy=p.on?.08:p.coy-dt;p.buf-=dt;
  if(p.buf>0&&p.coy>0){p.vy=-E.JV;p.on=false;p.coy=0;p.buf=0;p.hold=E.HMAX;S.ev.push('jump')}
  let g=E.G;if(inp.down&&p.vy<0&&p.hold>0){g=E.G*E.HG;p.hold-=dt}else if(!inp.down)p.hold=0;
  const pb=p.y+PH;p.vy+=g*dt;p.y+=p.vy*dt;let on=false;
  if(p.vy>=0)for(const q of S.pl){if(q.st==='gone')continue;
   if(pb<=q.y+3&&p.y+PH>=q.y&&p.x+PW/2>q.x&&p.x-PW/2<q.x+q.w){p.y=q.y-PH;p.vy=0;on=true;break}}
  p.on=on;p.inv=Math.max(0,p.inv-dt);
  if(p.y>S.H+30){fall(S);return}
  /* привычки игрока */
  S.hab[band(S,p.y+PH)]+=dt;S.hab=S.hab.map(v=>v*(1-dt*.03));if(on&&Math.abs(p.vx)<1)S.idle+=dt;else S.idle=0;
  /* платформы: метка → падение → возвращение */
  S.fallT-=dt;if(S.fallT<=0){dropPlat(S);S.fallT=B.phase===3?9:12}
  for(const q of S.pl){if(q.st==='warn'){q.t-=dt;if(q.t<=0){q.st='gone';q.t=3}}else if(q.st==='gone'){q.t-=dt;if(q.t<=0)q.st='ok'}}
  /* атаки: сначала предупреждение, потом снаряд */
  S.atk-=dt;if(S.atk<=0)attack(S);
  for(const a of S.tel){a.t-=dt;if(a.t>0)continue;
   if(a.k==='big'){shot(S,a.x,-10,0,140,13,1);a.dead=1}
   else if(a.k==='fan'||a.k==='fan2'){const o=a.k==='fan'?B:{x:a.x,y:0};const ang=Math.atan2(p.y-o.y,p.x-o.x);for(const d of[-.28,0,.28])shot(S,o.x,o.y,Math.cos(ang+d)*330,Math.sin(ang+d)*330,5,2);a.dead=1}
   else if(a.k==='str'){const x=aim(S,.8);shot(S,x,-10,0,220,7,3);a.c++;a.t=a.iv;if(a.c>=a.n)a.dead=1}}
  S.tel=S.tel.filter(a=>!a.dead);
  for(const s of S.sh){s.x+=s.vx*dt;s.y+=s.vy*dt;
   if(Math.abs(s.x-p.x)<s.r+PW/2&&Math.abs(s.y-(p.y+PH/2))<s.r+PH/2)hit(S)}
  S.sh=S.sh.filter(s=>s.y<S.H+30&&s.x>-30&&s.x<W+30&&!(Math.abs(s.x-p.x)<s.r+PW/2&&Math.abs(s.y-(p.y+PH/2))<s.r+PH/2&&p.inv>0&&0));
  /* ключ на самой высокой платформе (в фазе «растерянности» на средней) */
  if(S.key){S.key.t-=dt;if(S.key.t<=0)S.key=null;else if(Math.abs(S.key.x-p.x)<16&&Math.abs(S.key.y-(p.y+PH/2))<24){S.key=null;B.hp=Math.max(0,B.hp-KEYHP);S.combo++;S.score+=100;S.bytes++;S.ev.push('fix');if(B.hp<=0){S.over='win';S.score+=1000;S.ev.push('win');return}S.kt=B.phase===1?7:B.phase===2?6:5}}
  else{S.kt-=dt;if(S.kt<=0){const q=B.conf?S.pl[S.rnd()<.5?2:3]:S.pl[4];S.key={x:q.x+q.w*(.25+S.rnd()*.5),y:q.y-20,t:6}}}}
 return{create,step,layout,SPD}})();
