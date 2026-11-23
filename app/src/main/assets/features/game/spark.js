/* ===== ИСКРА: утверждённая графика героя (атлас spark/spark.png) и её состояния =====
   Кадры (все из утверждённых листов автора): idle (основная), r0–r7 (бег, 8 кадров), e0–e3 (эволюции), m0–m5 (эмоции: спокойный,
   радость, тревога «!», грусть, решимость, удивление «!»), d0–d2 (урон: обычный, «> <» с частицами, снова спокойный), front (вид спереди, бой с боссом).
   Чего нет в материалах автора, и как обходится: отдельных кадров прыжка, падения и приземления нет, поэтому прыжок и падение = кадр бега r4 с наклоном,
   приземление = короткое сжатие холста; ходьбы вперёд-назад в бою нет, поэтому в бою кадр front покачивается и наклоняется по движению;
   у эволюций (e1–e3) нет бега и эмоций: форма показывается одним кадром с качанием; правила открытия форм автор не задал, форма хранится в сохранении (0..3), в меню её пока не выбрать.
   Урон: только смена выражения (d1) и частицы, без падения и отбрасывания. Хитбокс героя не менялся (20×24), картинка больше хитбокса на вид, но попадает только он.
   Если картинка не загрузилась, game.js рисует прежнего героя (квадрат с глазами): игра остаётся рабочей офлайн. Ничего не отправляется в сеть. */
const GameSpark=(()=>{
 const ATL={"th": 128, "f": {"idle": [0, 0, 118, 128, 61.1], "r0": [120, 0, 124, 129, 65.0], "r1": [246, 0, 120, 129, 63.7], "r2": [368, 0, 120, 131, 62.7], "r3": [490, 0, 115, 124, 55.2], "r4": [607, 0, 128, 128, 65.3], "r5": [737, 0, 119, 121, 58.7], "r6": [858, 0, 122, 124, 65.0], "r7": [0, 133, 121, 126, 65.5], "e0": [123, 133, 119, 128, 62.6], "e1": [244, 133, 127, 135, 67.2], "e2": [373, 133, 136, 144, 70.3], "e3": [511, 133, 152, 153, 84.2], "m0": [665, 133, 120, 128, 63.0], "m1": [787, 133, 134, 125, 67.0], "m2": [0, 288, 133, 118, 60.3], "m3": [135, 288, 113, 106, 59.7], "m4": [250, 288, 123, 114, 64.2], "m5": [375, 288, 131, 134, 62.2], "d0": [508, 288, 121, 128, 65.0], "d1": [631, 288, 159, 128, 60.7], "d2": [792, 288, 164, 128, 60.7], "front": [0, 424, 127, 128, 65.2]}};
 const DH=36;/* высота героя на экране, логических px (кадры нормированы к 128 px) */
 let ok=false,form=0;
 if(typeof Image!=='undefined'){const im=new Image();im.onload=()=>{ok=true};im.onerror=()=>{ok=false};im.src='features/game/spark/spark.png';GameSpark_img=im}
 var GameSpark_img;
 const has=n=>!!ATL.f[n];
 /* рисует кадр: начало координат = ступни героя; sx,sy = сжатие/растяжение, fx = -1 отражает по горизонтали */
 function put(ctx,n,fx,sx,sy,al){const f=ATL.f[n];if(!f||!ok)return false;const k=DH/ATL.th;ctx.save();if(al!=null)ctx.globalAlpha*=al;ctx.scale((fx||1)*k*(sx||1),k*(sy||1));ctx.drawImage(GameSpark_img,f[0],f[1],f[2],f[3],-f[4],-f[3],f[2],f[3]);ctx.restore();return true}
 function state(S){return S._sp||(S._sp={hearts:S.hearts,bytes:S.bytes,tel:0,ph:1,on:true,landT:-9,hurtT:-9,emo:null,emoT:-9,parts:[],face:1,t0:S.t,after:null})}
 /* частицы урона: светлые осколки разлетаются от героя на 0,5 с; героя они не двигают */
 function burst(m){for(let i=0;i<10;i++){const a=-1.2+i*.26+Math.random()*.2;m.parts.push({x:6,y:-16,vx:Math.cos(a)*(40+Math.random()*50),vy:Math.sin(a)*(40+Math.random()*50)-10,l:.5})}}
 function emo(m,n,t,len){m.emo=n;m.emoT=t+len}
 /* выбор кадра и рисование. Вызывать после translate в центр хитбокса (и rotate). mode: 'level' | 'arena' */
 function draw(ctx,S,t,mode,E){
  if(!ok)return false;const p=S.p,m=state(S),dt=Math.max(0,Math.min(.1,S.t-m.t0));m.t0=S.t;
  const arena=mode==='arena',win=S.over==='win';
  if(S.hearts<m.hearts){m.hurtT=t;burst(m);m.after=S.hearts===1?'m3':null}m.hearts=S.hearts;
  if(S.bytes>m.bytes&&(arena||S.bytes%10===0))emo(m,'m1',t,.55);m.bytes=S.bytes;
  if(arena){if(S.tel.length>m.tel&&t-m.hurtT>.5)emo(m,'m2',t,.5);m.tel=S.tel.length;if(S.boss.phase>m.ph)emo(m,'m4',t,.8);m.ph=S.boss.phase}
  if(p.on&&!m.on)m.landT=t;m.on=p.on;
  if(Math.abs(p.vx||0)>1)m.face=p.vx>0?1:-1;
  if(win&&!m.won){m.won=1;emo(m,'m1',t,99)}
  const hurt=t-m.hurtT;let name,fx=1,sx=1,sy=1,lean=0;
  const foot=E.PH/2+1;ctx.translate(0,foot);
  const land=t-m.landT;if(land>=0&&land<.12){const q=1-land/.12;sx=1+.12*q;sy=1-.15*q}
  else if(!p.on){const v=Math.max(-1,Math.min(1,p.vy/600));sy=1+.08*Math.abs(v);sx=1-.05*Math.abs(v)}
  const bob=arena&&p.on&&Math.abs(p.vx)>1?Math.sin(t*22)*.05:0;sy*=1+bob;sx*=1-bob;
  if(arena)lean=(p.vx||0)/170*.12;
  if(form>0&&has('e'+form)){/* эволюция: один кадр, без эмоций */
   name='e'+form;fx=arena?m.face:1;if(!arena&&p.on)sy*=1+Math.sin(S.x/14*1.57)*.04}
  else if(hurt>=0&&hurt<.45){name='d1';fx=arena?m.face:1}
  else if(hurt>=.45&&hurt<.8){name=m.after||'d2';fx=arena?m.face:1}
  else if(m.emo&&t<m.emoT){name=m.emo;fx=arena?m.face:1}
  else if(arena){name='front'}
  else name=p.on?'r'+(Math.floor(S.x/14)%8):'r4';
  ctx.rotate(lean);
  if(hurt>=0&&hurt<.8)ctx.globalAlpha=1;/* выражение урона видно чётко, мерцание неуязвимости не гасит его */
  const drawn=put(ctx,name,fx,sx,sy,null);
  /* частицы */
  if(m.parts.length){ctx.fillStyle='#e6e8eb';for(const q of m.parts){q.l-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=120*dt;if(q.l>0){ctx.globalAlpha=Math.min(1,q.l*3);ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.l*9);ctx.fillRect(-1,-2,2,4);ctx.restore()}}ctx.globalAlpha=1;m.parts=m.parts.filter(q=>q.l>0)}
  ctx.rotate(-lean);ctx.translate(0,-foot);
  return drawn}
 /* маленький портрет для меню: основная Искра */
 function portrait(cv){const c=cv.getContext('2d');if(!ok){return false}c.clearRect(0,0,cv.width,cv.height);const f=ATL.f.idle,k=Math.min(cv.width/f[2],cv.height/f[3])*.96;c.save();c.translate(cv.width/2,cv.height-2);c.scale(k,k);c.drawImage(GameSpark_img,f[0],f[1],f[2],f[3],-f[4],-f[3],f[2],f[3]);c.restore();return true}
 /* значок для интерфейса: основной кадр, ступни в (x,y), высота h */
 function icon(ctx,x,y,h){if(!ok)return false;const f=ATL.f.idle,k=h/f[3];ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.drawImage(GameSpark_img,f[0],f[1],f[2],f[3],-f[4],-f[3],f[2],f[3]);ctx.restore();return true}
 const whenReady=fn=>{if(ok)return fn();if(typeof Image==='undefined')return;const i=GameSpark_img;if(i)i.addEventListener('load',fn)};
 return{draw,portrait,icon,whenReady,ready:()=>ok,form:v=>{if(v!=null)form=Math.max(0,Math.min(3,v|0));return form},ATL}})();
