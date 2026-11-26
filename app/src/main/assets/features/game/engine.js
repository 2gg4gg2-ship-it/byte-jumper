/* ===== ИГРА «Байт-прыгун»: движок (чистая логика, без DOM) =====
   Тут физика, уровни, генератор участков, баги, бонусы и босс «Ошибка 404». Ничего не рисует и не трогает страницу,
   поэтому его можно проверять в node (docs/tests/game047.test.js: бот проходит 10 уровней и босса).
   Уровни 1–29 собирает levels.js (платформы, ворота, дроны-договоры, прыгуны, лор), камера у двери останавливается.
   Координаты: мир идёт слева направо, S.x — сколько пробежали; игрок всегда на экране в точке PX.
   Высоты предметов хранятся как «высота над землёй» (h), поэтому поворот экрана ничего не ломает.
   Вызов: S=GameEngine.create({mode:'level'|'boss'|'endless',L:1..10,W,H,seed}); потом каждые 1/60 с GameEngine.step(S,dt,{down,pressed}).
   События для звука лежат в S.ev (очищает тот, кто рисует). Убрать игру: удалить папку features/game и её строки в index.html. */
const GameEngine=(()=>{
 /* Прыжок: тап ≈ 66 px (малый), удержание ≈ 124 px (большой) */
 const G=1900,JV=500,HG=.42,HMAX=.25,PX=80,PW=20,PH=24,FOOT=8,GY=.68;
 /* новые блоки: CEIL — низ потолка (для портала-инвертора), PADV — скорость батута (≈160 px вверх) */
 const CEIL=70,PADV=780;
 const mul=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 /* сложность d от 0 (уровень 1) до 1 (уровень 10): растёт плавно, размер героя, высота прыжка и управление не меняются */
 const prm=d=>({v0:200+126*d,vmax:270+126*d,acc:.012,bug:.3+.35*d,pit:d<.05?0:.18+.3*d,mov:d>.5?.6*(d-.5):0,gap:80+130*d,two:d>.3?.35:0,pow:.25});
 /* 100 уровней = 10 глав по 10 (10-й уровень главы = босс). Сложность d растёт по всей игре (0..1),
    в 1-м уровне главы чуть легче, в 9-м чётных глав передышка. Подробности: docs/BOSSES.md */
 const levelD=L=>{const c=Math.ceil(L/10),k=((L-1)%10)+1,i=(c-1)*9+Math.min(k,9)-1;let d=i/89;if(k===1)d-=.05;if(k===9&&c%2===0)d-=.12;return clamp(d,0,1)};
 const target=L=>6000+Math.round(9000*levelD(L));
 function create(o){
  const S={mode:o.mode||'level',L:o.L||1,W:o.W||360,H:o.H||640,rnd:mul(o.seed==null?(Math.random()*1e9)|0:o.seed),
   x:0,speed:0,t:0,items:[],pits:[],genX:420,rest:0,score:0,bytes:0,spawned:0,combo:0,boost:0,flipEnd:0,usedShield:false,ev:[],over:null,
   hearts:0,maxHearts:0,lost:0,boss:null,seg:0,last:'flat',px:PX,plats:[],wt:0,locked:false,door:0,doorOpen:0,note:null,found:false,lv:false,def:null};
  S.hearts=S.maxHearts=S.mode==='level'?5:3;
  S.gy=S.H*GY;S.d=S.mode==='endless'?.25:levelD(S.L);S.P=prm(S.d);
  S.p={y:S.gy-PH,vy:0,on:true,hold:0,buf:0,coy:.1,sh:false,mag:0,inv:0,stand:null,flip:0,cling:0,zip:null,clingIt:null};
  if(S.mode==='boss')S.boss={hp:100,max:100,phase:1,atk:2.2,zone:7,fix:1.6,bob:0};
  else for(let i=0;i<5;i++)byte(S,200+i*40,0);
  S.target=S.mode==='level'?target(S.L):0;
  /* дверь «</>» в конце уровня: уровни 1–29 собирает levels.js по сценарию, остальные идут по старому генератору */
  if(S.mode==='level'){
   if(typeof GameLevels!=='undefined'&&GameLevels.has(S.L))GameLevels.build(S);
   else{S.door=S.target+PX;S.items.push({t:'door',x:S.door,h:0})}
   S.lv=true}
  return S}
 function byte(S,x,h,gold){S.items.push({t:gold?'gold':'byte',x,h});S.spawned++}
 const place=(S,x,h,t,e)=>{const it=Object.assign({t,x,h},e||{});S.items.push(it);return it};
 /* ---------- генератор: блоки «старт → препятствие → передышка» ---------- */
 function gen(S){
  const P=S.P,r=S.rnd,lim=S.x+S.W+500;
  while(S.genX<lim){
   let x=S.genX,len;
   if(S.mode==='level'&&x>S.target+PX+300){S.genX=Infinity;return}
   const calm=S.mode==='level'&&x>S.target-420;
   if(S.rest>0||S.last!=='flat'){
    /* передышка после опасного места: всегда не короче, чем нужно для спокойного прыжка */
    len=320+r()*70;const n=3+((r()*4)|0);for(let i=0;i<n;i++)byte(S,x+60+i*(len-120)/n,0,r()<.06);
    S.rest=0;S.last='flat'}
   else{
    const w=calm?1:r(),pit=P.pit,bug=P.bug,pw=!calm&&r()<P.pow&&S.seg>1;
    if(w<pit){
     const g=40+r()*(P.gap-40);len=g+280;S.pits.push({a:x+120,b:x+120+g});
     for(let i=0;i<5;i++)byte(S,x+120+g*(i+.5)/5,Math.sin((i+.5)/5*Math.PI)*(70+g*.3));S.last='pit'}
    else if(w<pit+bug){
     const two=r()<P.two,sp2=P.vmax*.82+r()*50;len=two?130+sp2+300:300;
     const arc=bx=>{for(let i=0;i<5;i++)byte(S,bx-80+i*40,50+Math.sin(i/4*Math.PI)*70)};
     place(S,x+130,0,'bug',{big:r()<.35,vx:r()<P.mov?-70:0});arc(x+130);
     if(two){const b2=x+130+sp2;place(S,b2,0,'bug',{big:false,vx:0});arc(b2)}
     S.last='bug'}
    else{len=240+r()*60;const n=4+((r()*3)|0);for(let i=0;i<n;i++)byte(S,x+50+i*(len-100)/n,0,r()<.07);S.last='flat'}
    if(pw)place(S,x+len*.5,90,r()<.5?'shield':'magnet')}
   S.seg++;S.genX=x+len}}
 /* ---------- столкновения ---------- */
 const inPit=(S,x)=>S.pits.some(p=>x>=p.a&&x<=p.b);
 const solid=(S,pw)=>!inPit(S,pw-FOOT)||!inPit(S,pw+FOOT);
 function hit(S,it){
  const p=S.p;
  if(p.inv>0)return;
  if(S.mode!=='boss'&&p.sh){p.sh=false;p.inv=.9;S.usedShield=true;S.combo=0;S.ev.push('shield');if(it)it.dead=1;return}
  lose(S)}
 /* потеря сердца: неуязвимость 1,3 с; сердец нет → уровень провален */
 function lose(S){S.hearts--;S.lost++;S.p.inv=1.3;S.combo=0;S.ev.push('hit');if(S.hearts<=0){S.over='dead';S.ev.push('die')}}
 /* падение в яму: минус сердце и возврат на землю за ямой */
 function fall(S){
  const p=S.p,pw=S.x+S.px;lose(S);if(S.over)return;
  const q=S.pits.find(q=>pw>=q.a-40&&pw<=q.b+40);
  /* яма с цепочкой платформ (retry): возврат перед ямой, чтобы пройти цепочку заново; обычная яма: возврат за ней */
  S.px=PX;S.locked=false;
  S.x=(q?(q.retry?q.a-70:q.b+50):pw+120)-PX;p.y=S.gy-PH;p.vy=0;p.on=true;p.stand=null;p.buf=0;p.inv=1.8;
  for(const k of S.plats)if(k.fs||k.dead){k.fs=0;k.drop=0;k.dv=0;k.dead=0}
  p.flip=0;p.zip=null;p.cling=0;p.clingIt=null;S.ev.push('fall')}
 const pts=(S,v)=>{S.score+=v*(S.combo>=10?2:1)};
 /* ---------- босс «Ошибка 404» ---------- */
 function bossStep(S,dt){
  const B=S.boss,gy=S.gy;B.bob+=dt;
  const ph=B.hp>70?1:B.hp>35?2:3;if(ph>B.phase){B.phase=ph;if(S.hearts<3)S.hearts++;S.ev.push('phase')}
  B.atk-=dt;B.fix-=dt;B.zone-=dt;B.charge=B.atk<.6;
  if(B.atk<=0){
   B.atk=[2.7,2.3,2.0][B.phase-1]+S.rnd()*.4;
   const hi=B.phase>1&&S.rnd()<.45;
   place(S,S.x+S.W+30,hi?62:0,'proj',{vx:-70-B.phase*15,hi});
   S.ev.push('shot')}
  if(B.phase>1&&B.zone<=0){B.zone=B.phase===2?7.5:6;place(S,S.x+PX+420,0,'zone',{w:90,age:0});S.ev.push('warn')}
  if(B.fix<=0){B.fix=B.phase===3?2.3:2.6;place(S,S.x+S.W+20,72+S.rnd()*48,'fix')}}
 /* ---------- платформы, ворота, прыгуны: состояние по времени ---------- */
 const pOn=(S,q)=>!(q.k==='fake'||q.dead||q.fs===2)&&(q.k!=='blink'||(S.t+q.ph)%q.per<q.on);
 /* ворота: 0 открыты, 1 скоро закроются (мигают), 2 закрыты */
 const gateSt=(S,g)=>{const c=(S.t+g.ph)%g.per;return c>=g.open?2:c>=g.open-.6?1:0};
 /* прыгун-призрак: высота над землёй (0 = на земле) */
 const hopE=(S,h)=>h.amp*Math.abs(Math.sin(Math.PI*(S.t+h.ph)/h.per));
 function platStep(S,dt){
  for(const q of S.plats){
   q.p0=q.cur;
   if(q.fs===1){q.ft+=dt;if(q.ft>=q.dl){q.fs=2;q.dv=0}}
   else if(q.fs===2){q.dv+=1100*dt;q.drop+=q.dv*dt;if(q.drop>320)q.dead=1}
   q.cur=q.k==='lift'?q.h+q.amp*Math.sin(S.t*q.sp+q.ph):q.h-q.drop;
   q.cx=q.k==='mv'?q.x+q.amp*Math.sin(S.t*q.sp+q.ph):q.x}}
 /* ---------- шаг ---------- */
 /* эхо шагов (уровень 25): после прыжка на земле через 3 секунды появляется копия-баг; не ставится рядом с ямой или платформой */
function echoSpawn(S){
 const x=S.x+PX+3*Math.max(150,S.speed||200);
 if(S.pits.some(q=>x>q.a-50&&x<q.b+50))return;
 if(S.plats.some(q=>!q.dead&&x>q.cx-30&&x<q.cx+q.w+30))return;
 S.items.push({t:'bug',x,h:0,big:false,echo:1})}
function step(S,dt,inp){
  if(S.over)return;
  const p=S.p,gy=S.gy,boss=S.mode==='boss',lv=S.mode==='level';
  S.t+=dt;
  S.speed=boss?250:S.mode==='endless'?Math.min(230+S.x*.012,420):Math.min(S.P.v0+S.P.acc*S.x,S.P.vmax);
  if(p.zip)S.speed*=1.25;if(S.boost>0)S.speed*=1.4;S.boost=Math.max(0,(S.boost||0)-dt);
  /* конец уровня: камера останавливается, когда дверь целиком в правом углу экрана, и Искра сама идёт к двери */
  if(lv){
   if(!S.locked){S.x+=S.speed*dt;const endX=S.door-(S.W-58);if(S.x>=endX){S.x=endX;S.locked=true}}
   else S.px+=S.speed*.8*dt}
  else S.x+=S.speed*dt;
  if(S.mode==='endless')S.d=clamp(.25+S.x/20000,.25,1),S.P=prm(S.d);
  if(!boss)gen(S);else bossStep(S,dt);
  const pw=S.x+S.px;
  if(p.flip&&S.x>=S.flipEnd){p.flip=0;p.on=false;p.vy=0;S.ev.push('flipoff')}
  if(S.plats.length)platStep(S,dt);
  if(S.note){S.note.ttl-=dt;if(S.note.ttl<=0)S.note=null}
  /* прыжок: буфер нажатия и «койот»: нажал чуть раньше или чуть позже края — всё равно прыгнет. Вес (уровень 19) делает прыжок ниже */
  const sg=p.flip?-1:1;
  const jv=JV*(1-S.wt)*(S.boost>0?1.18:1);
  if(inp&&inp.pressed)p.buf=.12;
  p.coy=p.on?.08:p.coy-dt;p.buf-=dt;
  if(p.buf>0&&p.coy>0){p.vy=-jv*sg;p.on=false;p.stand=null;p.coy=0;p.buf=0;p.hold=HMAX;S.ev.push('jump');if(S.def&&S.def.echo)echoSpawn(S)}
  /* способности боссов (S.ab): двойной прыжок — один раз в воздухе */
  else if(p.buf>0&&S.ab&&S.ab.double&&!p.on&&!p.dj&&!p.zip&&p.cling<=0){p.vy=-jv*.9*sg;p.dj=1;p.buf=0;S.ev.push('jump')}
  /* прыжок с провода или со стены: отпускает */
  else if(p.buf>0&&(p.cling>0||p.zip)){
   if(p.cling>0){p.cling=0;if(p.clingIt){p.clingIt.dead=1;p.clingIt=null}}
   p.zip=null;p.vy=-jv*sg;p.on=false;p.stand=null;p.buf=0;p.hold=HMAX;S.ev.push('jump')}
  const feet0=p.y+PH;
  let g=G*sg;
  if(inp&&inp.down&&p.vy*sg<0&&p.hold>0){g=G*HG*sg;p.hold-=dt}else if(!(inp&&inp.down))p.hold=0;
  /* быстрое падение (S.ab.fall): удержание в падении тянет втрое сильнее */
  if(S.ab&&S.ab.fall&&inp&&inp.down&&!p.on&&p.vy*sg>0)g=G*3*sg;
  /* провод: съехал с конца — отцепился */
  if(p.zip&&pw>p.zip.x+p.zip.w+PW/2)p.zip=null;
  if(p.zip){p.y=gy-p.zip.h-PH;p.vy=0}
  else if(p.cling>0){
   /* магнитная стена: медленно сползаем 1,2 с, стена едет вместе с Искрой */
   p.cling-=dt;p.vy=90;p.y+=90*dt;
   if(p.clingIt)p.clingIt.x=pw+PW/2+7;
   if(p.y+PH>=gy){p.y=gy-PH;p.cling=0}
   if(p.cling<=0){p.cling=0;if(p.clingIt){p.clingIt.dead=1;p.clingIt=null}}}
  else{p.vy+=g*dt;p.y+=p.vy*dt}
  /* опора: платформа (держит и носит игрока) или земля */
  let on=false;
  if(p.stand){const q=p.stand;if(p.vy*sg<0||!pOn(S,q)||pw+14<q.cx||pw-14>q.cx+q.w)p.stand=null;else{p.y=gy-q.cur-PH;p.vy=0;on=true}}
  /* провод: ноги пересекли линию сверху — цепляемся */
  if(!on&&!p.zip&&!p.flip&&p.cling<=0&&p.vy>0){
   for(const z of S.items){if(z.t!=='line'||z.dead||pw<z.x||pw>z.x+z.w)continue;const Yl=gy-z.h;
    if(feet0<=Yl+2&&p.y+PH>=Yl){p.zip=z;p.y=Yl-PH;p.vy=0;p.stand=null;S.ev.push('zip');break}}}
  if(!on&&!p.zip&&p.cling<=0&&p.vy*sg>=0){
   const f=p.y+PH;
   if(p.flip){if(p.y<=CEIL){p.y=CEIL;p.vy=0;on=true}}
   else if(f>=gy&&solid(S,pw)&&f<gy+14){
    /* батут: при посадке подбрасывает на ≈160 px, обычная земля — останавливает */
    const pd=S.items.find(it=>it.t==='pad'&&!it.dead&&Math.abs(it.x-pw)<=it.w/2+PW/2);
    p.y=gy-PH;
    if(pd&&p.vy>0){p.vy=-PADV;S.ev.push('pad')}
    else{p.vy=0;on=true;if(S.items.some(it=>it.t==='bo'&&!it.dead&&Math.abs(it.x-pw)<=it.w/2+PW/2)){S.boost=1.5;S.ev.push('boost')}}}
   else if(!p.flip)for(const q of S.plats){
    if(!pOn(S,q))continue;
    if(pw+14>=q.cx&&pw-14<=q.cx+q.w&&f>=gy-q.cur&&feet0<=gy-q.p0+9){p.y=gy-q.cur-PH;p.vy=0;on=true;p.stand=q;if(q.k==='fall'&&!q.fs){q.fs=1;q.ft=0}break}}}
  p.on=on;if(on)p.dj=0;
  if(!p.flip&&!p.on&&p.y+PH>gy+14&&inPit(S,pw)){fall(S);return}
  if(p.y>S.H+80){fall(S);return}
  p.inv=Math.max(0,p.inv-dt);p.mag=Math.max(0,p.mag-dt);
  /* предметы */
  const px0=pw-PW/2,px1=pw+PW/2,py0=p.y,py1=p.y+PH,wtOn=S.def&&S.def.wt;
  for(const it of S.items){
    if(it.decoy)continue;/* ложный блок: только картинка, не бьёт */
   const k=it.t;
   /* потолочные баги и шипы (после портала-инвертора): бьют, только когда Искра идёт по потолку */
   if(it.ceil){if(p.flip){const hh=k==='spike'?12:22,w=k==='spike'?7:9;if(px1>it.x-w&&px0<it.x+w&&py0<CEIL+hh&&py1>CEIL)hit(S,it)}continue}
   /* хрупкий блок: сверху или снизу разбивается (без урона), сбоку — удар */
   if(k==='frag'){
    if(it.dead)continue;
    const top=gy-it.h-40,bot=gy-it.h;
    if(px1>it.x-20&&px0<it.x+20&&py1>top&&py0<bot){
     if(p.vy>=0&&feet0<=top+8){it.dead=1;p.vy=-PADV*.4;pts(S,20);S.ev.push('shatter')}
     else if(p.vy<0&&py0>=bot-16){it.dead=1;pts(S,20);S.ev.push('shatter')}
     else hit(S,it)}
    continue}
   /* магнитная стена: в прыжке упёрлась — цепляется 1,2 с; на земле — удар */
   if(k==='mg'){
    if(it.dead)continue;
    const base=gy-it.h,topY=base-110,gap=it.x-(pw+PW/2);
    if(!p.zip&&p.cling<=0&&py1>topY&&py0<base&&gap<8&&gap>-30){
     if(!p.on){p.cling=1.2;p.clingIt=it;it.x=pw+PW/2+7;p.vy=0;S.ev.push('cling')}
     else hit(S,it)}
    continue}
   /* портал-инвертор: касание рамки переворачивает гравитацию до конца отрезка */
   if(k==='inv'){
    if(!it.used&&!p.flip&&px1>it.x-16&&px0<it.x+16&&py1>gy-it.h-90&&py0<gy-it.h){
     it.used=1;p.flip=1;p.on=false;p.stand=null;p.vy=0;S.flipEnd=it.x+it.len;S.ev.push('flip')}
    continue}
   /* батут, ускоритель и провод: их действие уже учтено выше, здесь только не мешают */
   if(k==='pad'||k==='bo'||k==='line')continue;
   if(k==='tip'){if(!it.dead&&pw>=it.x){it.dead=1;S.note={text:it.text,ttl:4.2,kind:'tip'}}continue}
   if(k==='proj'&&!it.go&&it.at!=null){
    if(pw>=it.at-170)it.wn=1;
    if(pw>=it.at){it.go=1;it.wn=0;it.x=S.x+S.W+30;it.vx=-it.sp;S.ev.push('shot')}
    continue}
   /* блок-рельс едет по ровной земле туда-сюда (уровни 31+) */
  if(k==='mov')it.x=it.bx+it.amp*Math.sin(S.t*it.sp+it.ph);
  /* лазер: луч поперёк уровня, предупреждение 1,1 с, потом вспышка 0,45 с; падающий блок: метка на земле, падает, лежит и исчезает */
  if(k==='laser'){const ph=((S.t+it.ph)%it.per+it.per)%it.per;it.act=ph>=1.1&&ph<1.55;it.warn=ph<1.1}
  if(k==='drop'){const wn=it.fast?.5:.8,ph=((S.t+it.ph)%it.per+it.per)%it.per,tf=ph-wn,g=it.fast?1700:1100;it.act=ph>=wn&&ph<wn+1.3;it.warn=ph<wn;it.yy=tf>=0?Math.max(0,240-.5*g*tf*tf):240}
  if(it.vx)it.x+=it.vx*dt;
   if(k==='zone'){it.age+=dt;continue}
   const y=gy-it.h;
   if((k==='byte'||k==='gold')&&p.mag>0){const dx=pw-it.x,dy=(p.y+PH/2)-y,d=Math.hypot(dx,dy);if(d<170&&d>1){it.x+=dx/d*620*dt;it.h-=dy/d*620*dt}}
   const Y=gy-it.h;
   if(k==='byte'||k==='gold'||k==='fix'||k==='shield'||k==='magnet'||k==='lore'||k==='cp'||k==='bin'){
    const r=k==='byte'?15:(k==='lore'||k==='cp'||k==='bin')?24:18;
    if(Math.abs(it.x-pw)<r+PW/2&&Math.abs(Y-(p.y+PH/2))<r+PH/2){
     it.dead=1;
     if(k==='byte'||k==='gold'){S.bytes+=k==='gold'?5:1;S.combo++;pts(S,k==='gold'?50:10);S.ev.push(k==='gold'?'gold':'byte');if(wtOn)S.wt=Math.min(.12,S.wt+(k==='gold'?.03:.012))}
     else if(k==='fix'){S.boss.hp=Math.max(0,S.boss.hp-12);S.combo++;pts(S,100);S.ev.push('fix');if(S.boss.hp<=0){S.over='win';S.score+=1000;S.ev.push('win');return}}
     else if(k==='shield'){p.sh=true;S.ev.push('power')}
     else if(k==='magnet'){p.mag=6;S.ev.push('power')}
     else if(k==='lore'){S.note={text:it.text,ttl:7,kind:'lore'};S.ev.push('lore')}
     else if(k==='cp'){if(S.hearts<S.maxHearts)S.hearts++;S.note={text:'Точка отката: +1 сердце',ttl:3,kind:'tip'};S.ev.push('power')}
     else{S.wt=0;S.note={text:'Лишнее сброшено: прыжок снова лёгкий',ttl:3,kind:'tip'};S.ev.push('power')}}}
   else if(k==='lost'){
    /* Потеряшка: безопасен, превращается в жителя, если приземлиться на него сверху */
    if(Math.abs(it.x-pw)<10+PW/2&&py1>Y-22&&py0<Y&&p.vy>0&&feet0<=Y-12){
     it.dead=1;S.found=true;p.vy=-340;p.on=false;p.stand=null;S.score+=200;S.ev.push('found');S.note={text:'Потеряшка стал жителем!',ttl:3,kind:'tip'}}}
   else if(k==='bug'||k==='proj'||k==='wall'||k==='hop'||k==='gate'||k==='spike'||k==='mov'||k==='laser'||k==='drop'||k==='saw'){
    let w=8,h=14,Yb=Y;
    if(k==='bug'){w=it.big?11:9;h=it.big?30:22}
    else if(k==='spike'){w=7;h=12}
    else if(k==='mov'){w=10;h=30}
    else if(k==='laser'){if(!it.act)continue;w=it.w;h=18;Yb=gy-it.h}
    else if(k==='drop'){if(!it.act)continue;w=it.fast?16:13;h=it.fast?30:26;Yb=gy-it.yy}
    else if(k==='saw'){w=11;h=12}
    else if(k==='wall'){h=it.hh}
    else if(k==='hop'){w=9;h=22;Yb=gy-hopE(S,it)}
    else if(k==='gate'){if(gateSt(S,it)!==2)continue;h=it.hh}
    if(px1>it.x-w&&px0<it.x+w&&py1>Yb-h&&py0<Yb)hit(S,it)}}
  /* зоны босса: красная полоса на земле, жжёт только когда горит */
  for(const it of S.items)if(it.t==='zone'&&it.age>1.2&&it.age<2.4&&p.y+PH>=gy-6&&Math.abs(it.x-pw)<it.w/2+PW/2)hit(S,it);
  S.items=S.items.filter(it=>!it.dead&&it.x>S.x-80&&!(it.t==='zone'&&it.age>2.6));
  S.pits=S.pits.filter(q=>q.b>S.x-80);
  if(lv&&S.locked&&!S.over){
   const dx=S.door-S.x;S.doorOpen=Math.max(0,Math.min(1,1-(dx-S.px-24)/150));
   if(S.px>=dx-16){S.over='win';S.ev.push('win')}}}
 const stars=S=>{if(S.over!=='win'||S.mode!=='level')return S.over==='win'?3:0;const pc=S.bytes/Math.max(1,S.spawned);return 1+(pc>=.7?1:0)+(pc>=.9&&S.lost<=1?1:0)};
 const dist=S=>Math.floor(S.x/10);
 return{create,step,stars,dist,target,prm,levelD,PX,PW,PH,GY,G,JV,HMAX,HG,solid,inPit,gateSt,hopE,CEIL,PADV}})();
