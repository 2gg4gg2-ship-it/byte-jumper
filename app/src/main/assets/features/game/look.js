/* Внешний вид игры: герой-кубик, небо, холмы, облака, трава, пыль. Только рисование, логики игры тут нет. */
const GameLook=(()=>{
 const OUT='#2A1A14',BODY='#F28C4A',SHADE='#DE7236',LEG='#C85A27',ARM='#F7A064';
 let hurtW=false,was=true,vy0=0,land=0,spin=0,d2w=false,dust=[],lastX=0,dustT=0,lum=null;
 function reset(){emo='';emoT=0;bytes0=0;bossPh=0;boss0=false;hurtW=false;was=true;vy0=0;land=0;spin=0;d2w=false;dust=[];lastX=0;dustT=0;lum=null}
 /* тёмная ли тема: по цвету фона */
 function dark(col){if(lum===null){const h=(col.bg||'#000').replace('#','');const n=parseInt(h.length===3?h.replace(/./g,'$&$&'):h.slice(0,6),16)||0;lum=((n>>16&255)*.3+(n>>8&255)*.59+(n&255)*.11)/255}return lum<.5}
 function puff(x,y,n,vx){for(let i=0;i<n;i++){if(dust.length>28)dust.shift();dust.push({x,y,vx:vx+(Math.random()-.5)*50,vy:-20-Math.random()*40,r:2+Math.random()*2.5,a:.55})}}
 /* небо, солнце или луна, облака, холмы */
 function bg(ctx,S,col,t){
  const W=S.W,H=S.H,gy=S.gy,dk=dark(col),X=S.x;
  const g=ctx.createLinearGradient(0,0,0,gy);
  g.addColorStop(0,dk?'rgba(70,90,200,.16)':'rgba(120,170,255,.16)');g.addColorStop(1,dk?'rgba(255,140,80,.12)':'rgba(255,170,90,.20)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,gy);
  if(dk){ctx.fillStyle=col.tx;for(let i=0;i<34;i++){const x=(i*83.7)%W,y=(i*41.3)%(gy*.7);ctx.globalAlpha=.25+.35*Math.abs(Math.sin(t*1.3+i));ctx.fillRect(x,y,i%4?1.5:2.5,i%4?1.5:2.5)}ctx.globalAlpha=1}
  /* солнце / луна */
  const sx=W*.78,sy=gy*.26;ctx.save();
  ctx.globalAlpha=.25;ctx.fillStyle=dk?'#BFD0FF':'#FFC46B';ctx.beginPath();ctx.arc(sx,sy,34,0,7);ctx.fill();
  ctx.globalAlpha=.95;ctx.fillStyle=dk?'#E8EEFF':'#FFB84D';ctx.beginPath();ctx.arc(sx,sy,20,0,7);ctx.fill();
  if(dk){ctx.fillStyle='rgba(120,140,200,.45)';ctx.beginPath();ctx.arc(sx-6,sy-4,4,0,7);ctx.arc(sx+7,sy+5,3,0,7);ctx.fill()}
  ctx.restore();
  /* облака */
  ctx.fillStyle=col.tx;ctx.globalAlpha=dk?.07:.09;
  for(let i=0;i<5;i++){const w=W+200,x=((i*173-X*.05-t*6)%w+w)%w-100,y=gy*.12+((i*67)%Math.max(30,gy*.38));
   ctx.beginPath();ctx.arc(x,y,13,0,7);ctx.arc(x+16,y-7,17,0,7);ctx.arc(x+34,y,13,0,7);ctx.rect(x,y,34,13);ctx.fill()}
  ctx.globalAlpha=1;
  /* холмы двух слоёв */
  for(let L=0;L<2;L++){const k=L?.26:.12,amp=L?26:40,base=gy-(L?4:2);
   ctx.fillStyle=col.tx;ctx.globalAlpha=L?(dk?.09:.10):(dk?.05:.06);ctx.beginPath();ctx.moveTo(0,gy);
   for(let x=0;x<=W+10;x+=10){const wx=x+X*k;ctx.lineTo(x,base-amp-Math.sin(wx/(L?55:90)+L*2)*amp*.45-Math.sin(wx/(L?23:37))*amp*.15)}
   ctx.lineTo(W+10,gy);ctx.closePath();ctx.fill()}
  ctx.globalAlpha=1}
 /* трава и цветочки на кромке земли между a и b (в экранных координатах) */
 function grass(ctx,S,a,b){
  if(b<=a)return;const gy=S.gy,X=S.x,s0=Math.floor((X+a)/34),s1=Math.floor((X+b)/34);
  ctx.save();ctx.beginPath();ctx.rect(a,gy-14,b-a,16);ctx.clip();
  for(let k=s0;k<=s1;k++){const r=Math.abs(Math.sin(k*12.9898)*43758.5453)%1,x=k*34+r*24-X;
   if(r<.55){ctx.fillStyle='#5BB662';ctx.beginPath();ctx.moveTo(x-4,gy);ctx.lineTo(x-2,gy-6-r*4);ctx.lineTo(x,gy);ctx.lineTo(x+2,gy-8-r*4);ctx.lineTo(x+4,gy);ctx.closePath();ctx.fill()}
   else if(r>.86){ctx.fillStyle='#5BB662';ctx.fillRect(x-.7,gy-8,1.4,8);ctx.fillStyle=r>.93?'#FFD54A':'#FF8FB1';ctx.beginPath();ctx.arc(x,gy-9,2.6,0,7);ctx.fill()}}
  ctx.restore()}


 /* Герой «Искра» (по референсу владельца): граненый белый комочек, колючий гребень, глаза-капсулы. Минимализм: белое + два оттенка серого. */
 const sparks=[[-28,-30,3.2,1.1],[22,-36,2.6,1.7],[-20,-6,2,2.3],[29,-12,2.4,.4]];
 const PT=[[-12,-5],[-16,-12],[-13,-20],[-6,-25],[3,-27],[11,-24],[16,-17],[15,-9],[9,-3.5],[0,-2.5],[-7,-3]];
 const FA=[.10,.05,0,0,.02,.06,.12,.19,.20,.16,.13],CC=[2,-15];
 let emo='',emoT=0,bytes0=0,bossPh=0,boss0=false;
 /* Эмоции: normal, joy, surprise, angry, sad, damage, stun. Вызов: GameLook.emote('stun',2) (оглушение пока не используется: резерв под боссов с оглушением) */
 function emote(k,sec){emo=k;emoT=sec||1}
 function stageOf(S){if(S.mode==='boss')return 3;if(S.mode==='endless')return 2;const L=S.L||1;return L<=3?0:L<=6?1:L<=9?2:3}
 function face(ctx,k,t,air,up,dk){
  const K='#14161C',ey=-15.5;ctx.fillStyle=K;ctx.strokeStyle=K;ctx.lineWidth=2.4;ctx.lineCap='round';
  const pill=(x,w,h,r)=>{ctx.save();ctx.translate(x,ey);if(r)ctx.rotate(r);ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-w/2,-h/2,w,h,w/2);else ctx.rect(-w/2,-h/2,w,h);ctx.fill();ctx.restore()};
  const X=x=>{ctx.beginPath();ctx.moveTo(x-2.8,ey-2.8);ctx.lineTo(x+2.8,ey+2.8);ctx.moveTo(x+2.8,ey-2.8);ctx.lineTo(x-2.8,ey+2.8);ctx.stroke()};
  if(k==='damage'||k==='dead'){X(4.5);X(12)}
  else if(k==='stun'){ctx.lineWidth=1.6;for(const x of[4.5,12]){ctx.beginPath();ctx.arc(x,ey,4.2,0,7);ctx.stroke();ctx.beginPath();ctx.arc(x,ey,1.9,0,7);ctx.stroke()}}
  else if(k==='joy'){for(const x of[4.5,12]){ctx.beginPath();ctx.moveTo(x-2.3,ey+2);ctx.quadraticCurveTo(x,ey-3.4,x+2.3,ey+2);ctx.stroke()}}
  else if(k==='surprise'){pill(4.5,5.2,12.8);pill(12,5.2,12.8);ctx.beginPath();ctx.rect(15.5,-38,2.4,7);ctx.rect(15.5,-29.6,2.4,2.4);ctx.fill()}
  else if(k==='angry'){ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(1.6,-21.6);ctx.lineTo(7.4,-18.2);ctx.moveTo(15,-21.6);ctx.lineTo(9.2,-18.2);ctx.stroke();ctx.save();ctx.translate(0,2.6);pill(4.6,4.4,6.4,0);pill(12,4.4,6.4,0);ctx.restore()}
  else if(k==='sad'){pill(4.5,4.6,9.5);pill(12,4.6,9.5);ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(1.5,-22.4);ctx.lineTo(7.2,-20.6);ctx.moveTo(15,-22.4);ctx.lineTo(9.4,-20.6);ctx.stroke();ctx.fillStyle='#8FD0FF';ctx.beginPath();ctx.ellipse(13.6,ey+7.4,1.1,1.9,0,0,7);ctx.fill()}
  else if(k==='blink'){ctx.beginPath();ctx.moveTo(2,ey);ctx.lineTo(7,ey);ctx.moveTo(9.5,ey);ctx.lineTo(14.5,ey);ctx.stroke()}
  else if(k==='air'){pill(4.5,5,up?11.8:10.2);pill(12,5,up?11.8:10.2)}
  else{pill(4.5,4.8,9.5);pill(12,4.8,9.5)}}
 function hero(ctx,S,col,t,blink){
  const p=S.p,E=GameLookE,gy=S.gy,dk=dark(col),dt=1/60;
  if(was&&!p.on){puff(E.PX,gy,4,-60)}
  if(!was&&p.on){land=.16;puff(E.PX,gy,7,-90)}
  /* что чувствует герой */
  if(p.inv>1&&!hurtW)emote('damage',.7);hurtW=p.inv>1;
  if(S.bytes>bytes0&&!emoT)emote('joy',.45);bytes0=S.bytes;
  if(S.mode==='boss'){if(!boss0){boss0=true;emote('surprise',1.8)}const ph=S.boss?S.boss.phase:0;if(ph>bossPh&&bossPh){emote('angry',1.4)}bossPh=ph||bossPh}
  if(S.over==='win')emo='joy',emoT=9;
  was=p.on;vy0=p.vy;if(land>0)land-=dt;if(emoT>0){emoT-=dt;if(emoT<=0)emo=''}
  const dead=S.over==='dead',air=!p.on,up=air&&p.vy<0,feet=p.y+E.PH,hgt=Math.max(0,gy-feet);
  if(p.on&&!S.over){dustT+=dt;if(dustT>.12){dustT=0;puff(E.PX-8,gy,1,-70-Math.min(80,(S.speed||0)*.2))}}
  for(let i=dust.length-1;i>=0;i--){const d=dust[i];d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=60*dt;d.a-=dt*1.6;if(d.a<=0)dust.splice(i,1)}
  ctx.save();ctx.fillStyle=dk?'#fff':'#7A7F8C';for(const d of dust){ctx.globalAlpha=Math.max(0,d.a)*.5;ctx.beginPath();ctx.arc(d.x,d.y-d.r,d.r,0,7);ctx.fill()}ctx.restore();
  const sh=Math.max(.3,1-hgt/170);
  ctx.save();ctx.globalAlpha=sh;ctx.fillStyle=dk?'rgba(0,0,0,.65)':'rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(E.PX,gy+3,19*sh,4.2*sh,0,0,7);ctx.fill();
  if(dk){ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;ctx.stroke();ctx.beginPath();ctx.ellipse(E.PX,gy+3,11*sh,2.4*sh,0,0,7);ctx.stroke()}ctx.restore();
  if(blink)return;
  const st=stageOf(S),ph=S.x*.085,bob=air?0:Math.abs(Math.sin(ph))*1.8,cx=E.PX;
  ctx.save();const hy=feet-14*1.3,hg=ctx.createRadialGradient(cx,hy,6,cx,hy,46);
  hg.addColorStop(0,dk?'rgba(255,255,255,.32)':'rgba(255,190,90,.28)');hg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=hg;ctx.fillRect(cx-48,hy-48,96,96);ctx.restore();
  ctx.save();ctx.strokeStyle=dk?'#fff':'#5A6070';ctx.lineCap='round';ctx.lineWidth=1.6;
  if(!air&&!dead){for(let i=0;i<3;i++){const l=14+((t*40+i*11)%12),y=feet-9-i*7*1.3;ctx.globalAlpha=.4-i*.08;ctx.beginPath();ctx.moveTo(cx-26,y);ctx.lineTo(cx-26-l,y);ctx.stroke()}}
  if(air&&!dead&&p.vy<-300){for(let i=0;i<3;i++){ctx.globalAlpha=.35;ctx.beginPath();ctx.moveTo(cx-8+i*8,feet+6);ctx.lineTo(cx-8+i*8,feet+20+i*3);ctx.stroke()}}
  ctx.restore();
  ctx.save();ctx.translate(cx,feet);ctx.scale(1.3,1.3);
  let sx=1,sy=1;if(dead){sx=1.25;sy=.62}else if(land>0){const q=land/.16;sx=1+.28*q;sy=1-.26*q}else if(air){const v=Math.min(1,Math.abs(p.vy)/700);sx=1-.12*v;sy=1+.16*v}
  ctx.scale(sx,sy);
  if(air&&!dead){ctx.translate(0,-12);ctx.rotate(Math.max(-.3,Math.min(.35,p.vy/2200)));ctx.translate(0,12)}
  const OUT=dk?null:'#2B2F3A';ctx.lineJoin='round';ctx.lineCap='round';
  const line=()=>{if(OUT){ctx.strokeStyle=OUT;ctx.lineWidth=1.6;ctx.stroke()}};
  /* ножки */
  const foot=(x,l)=>{ctx.fillStyle='#C3C8D4';ctx.beginPath();ctx.ellipse(x,-2.4-l,4.3,3.3,0,0,7);ctx.fill();line();ctx.fillStyle='rgba(70,80,120,.22)';ctx.beginPath();ctx.ellipse(x+.6,-1.6-l,3.2,1.7,0,0,7);ctx.fill()};
  if(air){foot(-5,3.6);foot(6.5,2.6)}else{foot(-5,Math.max(0,Math.sin(ph))*4.5);foot(6.5,Math.max(0,Math.sin(ph+Math.PI))*4.5)}
  ctx.translate(0,-bob);
  /* кольцо «Пробуждения» вокруг тела */
  if(st>=1&&!dead){ctx.save();ctx.strokeStyle=dk?'rgba(255,255,255,.55)':'rgba(70,80,110,.55)';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,-6,22,4.6,-.08,0,Math.PI);ctx.stroke();ctx.restore()}
  /* граненые осколки гребня: Искра 1 шт, Пробуждение 2, Развитие 3, Совершенство 4 + нимб */
  const shard=(a,b,c)=>{ctx.fillStyle='#F6F8FC';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.closePath();ctx.fill();line();
   ctx.fillStyle='rgba(70,80,120,.16)';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo((a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3);ctx.closePath();ctx.fill()};
  const w=Math.sin(t*3)*.8;
  if(st>=2)shard([-14,-13],[-28+w,-17],[-12,-6]);
  shard([-12,-22],[-21+w,st>=2?-35:-31],[-4,-26]);
  if(st>=1)shard([-4,-26],[-8+w,-39],[5,-27]);
  if(st>=3){shard([5,-27],[13,-40+w],[14,-23]);ctx.save();ctx.strokeStyle=dk?'#fff':'#5A6070';ctx.lineWidth=1.3;ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(0,-37,15,3.4,-.06,0,7);ctx.stroke();ctx.restore()}
  /* тело: белый многоугольник и серые грани */
  const body=()=>{ctx.beginPath();ctx.moveTo(PT[0][0],PT[0][1]);for(let i=1;i<PT.length;i++)ctx.lineTo(PT[i][0],PT[i][1]);ctx.closePath()};
  ctx.fillStyle='#FAFBFE';body();ctx.fill();
  ctx.save();body();ctx.clip();
  for(let i=0;i<PT.length;i++){const q=PT[i],r=PT[(i+1)%PT.length];if(FA[i]){ctx.fillStyle='rgba(70,80,120,'+FA[i]+')';ctx.beginPath();ctx.moveTo(CC[0],CC[1]);ctx.lineTo(q[0],q[1]);ctx.lineTo(r[0],r[1]);ctx.closePath();ctx.fill()}}
  ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.moveTo(-6,-25);ctx.lineTo(3,-27);ctx.lineTo(-2,-20);ctx.closePath();ctx.fill();
  if(emo==='stun'){ctx.fillStyle='rgba(110,115,130,.38)';ctx.fillRect(-20,-30,40,30)}
  ctx.restore();
  body();line();
  /* лицо */
  const k=dead?'dead':emo||(!air&&(p.inv<=0||S.mode!=='level')&&S.hearts===1&&S.maxHearts>1?'sad':air?'air':(Math.floor(t*10)%38)===0?'blink':'normal');
  face(ctx,k,t,air,up,dk);
  /* «Урон»: осколки-корона над головой */
  if(k==='damage'){ctx.fillStyle=dk?'#fff':'#5A6070';for(const x of[-5,2,9]){ctx.beginPath();ctx.moveTo(x-2.5,-28);ctx.lineTo(x,-34-Math.abs(x)*.1);ctx.lineTo(x+2.5,-28);ctx.fill()}}
  ctx.restore();
  /* «Оглушение»: звезда и кружащиеся точки */
  if(emo==='stun'){ctx.save();ctx.fillStyle=dk?'#fff':'#5A6070';for(let i=0;i<3;i++){const a=t*5+i*2.1;ctx.beginPath();ctx.arc(cx+Math.cos(a)*16,feet-44+Math.sin(a)*4,1.8,0,7);ctx.fill()}ctx.restore()}
  /* квадратики-искры */
  ctx.save();ctx.fillStyle=dk?'#fff':'#9AA3B5';for(const q of sparks){const a=t*1.4+q[3],x=cx+q[0]*1.3+Math.sin(a*1.7)*3,y=feet-14*1.3+q[1]*.9+Math.cos(a)*3;ctx.globalAlpha=.35+.45*Math.abs(Math.sin(a*2));ctx.fillRect(x-q[2]/2,y-q[2]/2,q[2],q[2])}ctx.restore();
  if(land>0){const q=land/.16;ctx.save();ctx.fillStyle=dk?'#fff':'#8A90A0';ctx.globalAlpha=q;for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(cx+s*14,gy);ctx.lineTo(cx+s*(32+10*(1-q)),gy-11*q);ctx.lineTo(cx+s*24,gy);ctx.closePath();ctx.fill()}ctx.restore()}
  ctx.save();ctx.translate(cx,p.y+E.PH/2-2);
  if(p.sh){const r=28+Math.sin(t*6),g2=ctx.createRadialGradient(0,0,r*.5,0,0,r);g2.addColorStop(0,'rgba(190,225,255,.05)');g2.addColorStop(1,'rgba(190,225,255,.5)');ctx.fillStyle=g2;ctx.strokeStyle='rgba(210,235,255,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.stroke()}
  if(p.mag>0){ctx.strokeStyle=dk?'rgba(255,255,255,.8)':'rgba(70,80,110,.8)';ctx.lineWidth=1.4;for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(0,0,33+Math.sin(t*8)*2,10,t*2+i*1.5,0,7);ctx.stroke()}}
  ctx.restore()}
 let GameLookE=null;
 return{reset,bg,grass,hero,emote,init(e){GameLookE=e}}})();
