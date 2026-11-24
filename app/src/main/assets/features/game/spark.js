/* ===== ИСКРА: утверждённая графика героя (атлас spark/spark.png, чёрно-белая) и выбор кадра по состоянию =====
   Кадры из утверждённых листов автора: idle, r0–r7 (бег), e0–e3 (эволюции), m0–m5 (эмоции), d0–d2 (урон), front (вид спереди, бой с боссом).
   Добавлены скриптом docs/tools/make_spark_atlas.py: те же фигуры с другими глазами (моргание idle_b, front_b; радость front_h; решимость front_a;
   «> <» front_x и r0_x..r7_x; грусть front_s). Тело не меняется, меняются только глаза, поэтому эмоции не дают скачков вида и позы.
   Выбор кадра: бег по пройденному пути (один кадр на 10 px, ноги не скользят), прыжок: подъём r5, вершина r6, падение и касание r0, без вращения и растяжения.
   Урон: на текущей позе меняются глаза («> <») и вылетают белые осколки; падения и отбрасывания нет. В бою всегда фронтальный вид.
   Чего нет в материалах, и как обходится: отдельных кадров прыжка и приземления нет, берутся позы бега; ходьбы спереди нет, в бою при движении и в воздухе показываются позы бега
   (3/4, отражённые по направлению), а стоя фронтальный вид; у эволюций (e1–e3) нет бега и эмоций, форма показывается одним кадром.
   Хитбокс героя не менялся (20×24). Если картинка не загрузилась, game.js рисует прежнего героя: игра остаётся рабочей офлайн. Сеть не используется. */
const GameSpark=(()=>{
 const ATL={"th": 128, "f": {"idle": [0, 0, 118, 128, 61.1], "r0": [120, 0, 124, 129, 65.0, 73.0, 99.0], "r1": [246, 0, 120, 129, 63.7, 72.2, 98.0], "r2": [368, 0, 120, 131, 62.7, 72.8, 97.0], "r3": [490, 0, 115, 124, 55.2, 69.0, 93.5], "r4": [607, 0, 128, 128, 65.3, 71.2, 105.8], "r5": [737, 0, 119, 121, 58.7, 73.0, 96.2], "r6": [858, 0, 122, 124, 65.0, 72.5, 100.2], "r7": [0, 133, 121, 126, 65.5, 73.5, 98.5], "e0": [123, 133, 119, 128, 62.6], "e1": [244, 133, 127, 135, 67.2], "e2": [373, 133, 136, 144, 70.3], "e3": [511, 133, 152, 153, 84.2], "m0": [665, 133, 120, 128, 63.0], "m1": [787, 133, 134, 125, 67.0], "m2": [0, 288, 133, 118, 60.3], "m3": [135, 288, 113, 106, 59.7], "m4": [250, 288, 123, 114, 64.2], "m5": [375, 288, 131, 134, 62.2], "d0": [508, 288, 121, 128, 65.0], "d1": [631, 288, 159, 128, 60.7], "d2": [792, 288, 164, 128, 60.7], "front": [0, 424, 127, 128, 65.2], "idle_b": [0, 558, 118, 128, 61.1], "front_b": [122, 558, 127, 128, 65.2], "front_h": [253, 558, 127, 128, 65.2], "front_a": [384, 558, 127, 128, 65.2], "front_x": [515, 558, 127, 128, 65.2], "front_s": [646, 558, 127, 128, 65.2], "r0_x": [777, 558, 124, 129, 65.0, 73.0, 99.0], "r1_x": [0, 691, 120, 129, 63.7, 72.2, 98.0], "r2_x": [124, 691, 120, 131, 62.7, 72.8, 97.0], "r3_x": [248, 691, 115, 124, 55.2, 69.0, 93.5], "r4_x": [367, 691, 128, 128, 65.3, 71.2, 105.8], "r5_x": [499, 691, 119, 121, 58.7, 73.0, 96.2], "r6_x": [622, 691, 122, 124, 65.0, 72.5, 100.2], "r7_x": [748, 691, 121, 126, 65.5, 73.5, 98.5]}};
 const DH=36;/* высота героя на экране, логических px (кадры нормированы к 128 px) */
 let ok=false,form=0;
 if(typeof Image!=='undefined'){const im=new Image();im.onload=()=>{ok=true};im.onerror=()=>{ok=false};im.src='features/game/spark/spark.png';GameSpark_img=im}
 var GameSpark_img;
 const has=n=>!!ATL.f[n];
 /* рисует кадр: начало координат = ступни героя; sx,sy = сжатие/растяжение, fx = -1 отражает по горизонтали */
 const EYEX=35,HEAD=57,BOB=[0,0,.5,1,.5,2.5,3,2];/* стандартная высота глаз над землёй и подъём корпуса по кадрам бега (в единицах кадра 128 px) */
 function put(ctx,n,fx,sx,sy,al){const f=ATL.f[n];if(!f||!ok)return false;const k=DH/ATL.th;ctx.save();if(al!=null)ctx.globalAlpha*=al;ctx.scale((fx||1)*k*(sx||1),k*(sy||1));
  if(f.length>6){const i=+n[1],dx=-(f[6]-EYEX),dy=-(HEAD+BOB[i])-f[5];ctx.drawImage(GameSpark_img,f[0],f[1],f[2],f[3],dx,dy,f[2],f[3])}/* бег: голова в одной точке, плавный подъём */
  else ctx.drawImage(GameSpark_img,f[0],f[1],f[2],f[3],-f[4],-f[3],f[2],f[3]);ctx.restore();return true}
 function state(S){return S._sp||(S._sp={hearts:S.hearts,bytes:S.bytes,tel:0,ph:1,on:true,landT:-9,hurtT:-9,emo:null,emoT:-9,parts:[],face:1,t0:S.t,after:null})}
 /* частицы урона: светлые осколки разлетаются от героя на 0,5 с; героя они не двигают */
 function burst(m){for(let i=0;i<10;i++){const a=-1.2+i*.26+Math.random()*.2;m.parts.push({x:6,y:-16,vx:Math.cos(a)*(40+Math.random()*50),vy:Math.sin(a)*(40+Math.random()*50)-10,l:.5})}}
 function emo(m,n,t,len){m.emo=n;m.emoT=t+len}
 /* выбор кадра и рисование. Вызывать после translate в центр хитбокса. mode: 'level' | 'arena' */
 const STRIDE=10;/* px пути на один кадр бега */
 function runPose(run,p,m,t){
  if(p.on){const land=t-m.landT;return(land>=0&&land<.08)?'r0':'r'+(((Math.floor(run/STRIDE))%8+8)%8)}
  return p.vy<-150?'r5':p.vy>150?'r0':'r6'}
 function draw(ctx,S,t,mode,E){
  if(!ok)return false;const p=S.p,m=state(S),dt=Math.max(0,Math.min(.1,S.t-m.t0));m.t0=S.t;
  const arena=mode==='arena',win=S.over==='win';
  if(S.hearts<m.hearts){m.hurtT=t;burst(m);m.after=S.hearts===1?'sad':null}m.hearts=S.hearts;
  if(S.bytes>m.bytes&&(arena||S.bytes%10===0))emo(m,'h',t,.55);m.bytes=S.bytes;
  if(arena&&S.boss.phase>m.ph)emo(m,'a',t,.8);if(arena)m.ph=S.boss.phase;
  if(p.on&&!m.on)m.landT=t;m.on=p.on;
  if(Math.abs(p.vx||0)>1)m.face=p.vx>0?1:-1;
  if(win&&!m.won){m.won=1;emo(m,'h',t,99)}
  const hurt=t-m.hurtT,hit=hurt>=0&&hurt<.45;let name,fx=1;
  const foot=E.PH/2+1;ctx.translate(0,foot);
  if(form>0&&has('e'+form)){name='e'+form;fx=arena?m.face:1}/* эволюция: один кадр */
  else{
   const dist=arena?Math.abs(p.vx||0)*dt:S.speed*dt;m.run=(m.run||0)+dist;
   if(arena&&Math.abs(p.vx||0)>25)m.mvT=t;
   const moving=!arena||!p.on||t-(m.mvT==null?-9:m.mvT)<.12;
   if(arena)fx=moving?m.face:1;
   if(!moving){/* стоит в бою: фронтальный вид, моргание и выражения на нём */
    const e=hit?'x':(hurt>=.45&&hurt<.8&&m.after==='sad')?'s':(m.emo&&t<m.emoT)?m.emo:((t+1.3)%3.7<.12?'b':'');
    name=e&&has('front_'+e)?'front_'+e:'front'}
   else{name=win&&p.on&&!arena?'m1':runPose(m.run,p,m,t);if(hit)name=has(name+'_x')?name+'_x':'d1'}}
  if(hurt>=0&&hurt<.8)ctx.globalAlpha=1;/* выражение урона видно чётко, мерцание неуязвимости не гасит его */
  const drawn=put(ctx,name,fx,1,1,null);
  if(m.parts.length){ctx.fillStyle='#e6e8eb';for(const q of m.parts){q.l-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=120*dt;if(q.l>0){ctx.globalAlpha=Math.min(1,q.l*3);ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.l*9);ctx.fillRect(-1,-2,2,4);ctx.restore()}}ctx.globalAlpha=1;m.parts=m.parts.filter(q=>q.l>0)}
  ctx.translate(0,-foot);
  return drawn}
 /* маленький портрет для меню: основная Искра */
 function portrait(cv){const c=cv.getContext('2d');if(!ok){return false}c.clearRect(0,0,cv.width,cv.height);const f=ATL.f.idle,k=Math.min(cv.width/f[2],cv.height/f[3])*.96;c.save();c.translate(cv.width/2,cv.height-2);c.scale(k,k);c.drawImage(GameSpark_img,f[0],f[1],f[2],f[3],-f[4],-f[3],f[2],f[3]);c.restore();return true}
 /* значок для интерфейса: основной кадр, ступни в (x,y), высота h */
 function icon(ctx,x,y,h){if(!ok)return false;const f=ATL.f.idle,k=h/f[3];ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.drawImage(GameSpark_img,f[0],f[1],f[2],f[3],-f[4],-f[3],f[2],f[3]);ctx.restore();return true}
 const whenReady=fn=>{if(ok)return fn();if(typeof Image==='undefined')return;const i=GameSpark_img;if(i)i.addEventListener('load',fn)};
 return{draw,portrait,icon,whenReady,ready:()=>ok,form:v=>{if(v!=null)form=Math.max(0,Math.min(3,v|0));return form},ATL}})();
