/* Внешний вид игры: герой-кубик, небо, холмы, облака, трава, пыль. Только рисование, логики игры тут нет. */
const GameLook=(()=>{
 const OUT='#2A1A14',BODY='#F28C4A',SHADE='#DE7236',LEG='#C85A27',ARM='#F7A064';
 let was=true,vy0=0,land=0,spin=0,d2w=false,dust=[],lastX=0,dustT=0,lum=null;
 function reset(){was=true;vy0=0;land=0;spin=0;d2w=false;dust=[];lastX=0;dustT=0;lum=null}
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
 function hero(ctx,S,col,t,blink){
  const p=S.p,E=GameLookE,gy=S.gy,dk=dark(col);
  /* события для анимации: прыжок, посадка, второй прыжок */
  if(was&&!p.on){puff(E.PX,gy,4,-60)}
  if(!was&&p.on){land=.14;puff(E.PX,gy,7,-90)}
  if(p.d2&&!d2w){spin=.42}
  d2w=!!p.d2;was=p.on;vy0=p.vy;
  const dt=1/60;if(land>0)land-=dt;if(spin>0)spin-=dt;
  /* пыль от бега */
  if(p.on&&!S.over){dustT+=dt;if(dustT>.11){dustT=0;puff(E.PX-8,gy,1,-70-Math.min(80,S.speed*.2||0))}}
  for(let i=dust.length-1;i>=0;i--){const d=dust[i];d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=60*dt;d.a-=dt*1.6;if(d.a<=0)dust.splice(i,1)}
  ctx.save();ctx.fillStyle=dk?col.tx:'#7A6A5A';for(const d of dust){ctx.globalAlpha=Math.max(0,d.a)*.6;ctx.beginPath();ctx.arc(d.x,d.y-d.r,d.r,0,7);ctx.fill()}ctx.restore();
  /* тень на земле */
  const feet=p.y+E.PH,hgt=Math.max(0,gy-feet),sh=Math.max(.25,1-hgt/170);
  ctx.save();ctx.globalAlpha=(dk?.22:.28)*sh;ctx.fillStyle=dk?col.tx:'#000';ctx.beginPath();ctx.ellipse(E.PX,gy+2,15*sh,3.5*sh,0,0,7);ctx.fill();ctx.restore();
  if(blink)return;
  const air=!p.on,up=air&&p.vy<0,ph=S.x*.09;
  const bob=air?0:Math.abs(Math.sin(ph))*1.6,dead=S.over==='dead';
  ctx.save();ctx.translate(E.PX,feet);ctx.scale(1.3,1.3);
  /* растяжение в прыжке, сплющивание при посадке */
  let sx=1,sy=1;if(land>0){const q=land/.14;sx=1+.22*q;sy=1-.2*q}else if(air){const v=Math.max(-1,Math.min(1,p.vy/700));sx=1-.1*Math.abs(v);sy=1+.14*Math.abs(v)}
  ctx.scale(sx,sy);
  if(spin>0){ctx.translate(0,-12);ctx.rotate((1-spin/.42)*Math.PI*2);ctx.translate(0,12)}
  else if(air){ctx.translate(0,-12);ctx.rotate(Math.max(-.25,Math.min(.3,p.vy/2500)));ctx.translate(0,12)}
  ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=2;ctx.strokeStyle=OUT;
  const lift=i=>air?2.5:Math.max(0,Math.sin(ph+(i%2?Math.PI:0)))*4.5;
  /* задние ножки, потом тело, потом передние */
  const legs=[-10,-3.5,3.5,10];
  legs.forEach((lx,i)=>{if(i%2)return;const l=lift(i);ctx.fillStyle=LEG;ctx.beginPath();ctx.rect(lx-2.2,-8,4.4,8-l);ctx.fill();ctx.stroke()});
  /* руки: на земле машут, в воздухе подняты */
  const arm=(sd)=>{ctx.save();ctx.translate(sd*13,-15);ctx.rotate(air?-sd*(up?2.3:1.9):-sd*.35+Math.sin(ph+(sd>0?0:Math.PI))*.6);
   ctx.fillStyle=ARM;ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-2.2,-1,4.4,10,2);else ctx.rect(-2.2,-1,4.4,10);ctx.fill();ctx.stroke();ctx.restore()};
  /* тело */
  ctx.translate(0,-bob-2);
  ctx.fillStyle=BODY;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-14,-26,28,22,5);else ctx.rect(-14,-26,28,22);ctx.fill();
  ctx.save();ctx.clip();ctx.fillStyle=SHADE;ctx.fillRect(-14,-10,28,6);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(-12,-24,10,3);ctx.restore();
  ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-14,-26,28,22,5);else ctx.rect(-14,-26,28,22);ctx.stroke();
  arm(-1);arm(1);
  /* лицо */
  const blinkEye=(Math.floor(t*10)%34)===0&&!air;
  ctx.strokeStyle=OUT;ctx.fillStyle=OUT;ctx.lineWidth=2.2;
  const ey=-17,ex=5.8;
  if(dead){for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(s*ex-2.5,ey-2.5);ctx.lineTo(s*ex+2.5,ey+2.5);ctx.moveTo(s*ex+2.5,ey-2.5);ctx.lineTo(s*ex-2.5,ey+2.5);ctx.stroke()}}
  else if(air){for(const s of[-1,1]){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s*ex,ey,3.4,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=OUT;ctx.beginPath();ctx.arc(s*ex+.6,ey+(up?-1:1),1.5,0,7);ctx.fill()}}
  else if(blinkEye){for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(s*ex-3,ey);ctx.lineTo(s*ex+3,ey);ctx.stroke()}}
  else{for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(s*ex-3.2,ey+2);ctx.quadraticCurveTo(s*ex,ey-3.6,s*ex+3.2,ey+2);ctx.stroke()}}
  /* румянец и рот */
  ctx.fillStyle='rgba(255,110,120,.45)';ctx.beginPath();ctx.arc(-9.5,-12.5,2.2,0,7);ctx.arc(9.5,-12.5,2.2,0,7);ctx.fill();
  ctx.strokeStyle=OUT;ctx.fillStyle=OUT;ctx.lineWidth=2;
  if(dead){ctx.beginPath();ctx.moveTo(-3,-9);ctx.quadraticCurveTo(0,-12,3,-9);ctx.stroke()}
  else if(air){ctx.beginPath();ctx.ellipse(0,-9.5,2.4,up?3:2,0,0,7);ctx.fill()}
  else{ctx.beginPath();ctx.moveTo(-3.5,-11);ctx.quadraticCurveTo(0,-7,3.5,-11);ctx.stroke()}
  ctx.translate(0,bob+2);
  /* передние ножки поверх тела */
  legs.forEach((lx,i)=>{if(!(i%2))return;const l=lift(i);ctx.fillStyle=LEG;ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.beginPath();ctx.rect(lx-2.2,-8,4.4,8-l);ctx.fill();ctx.stroke()});
  ctx.restore();
  /* щит и магнит */
  ctx.save();ctx.translate(E.PX,p.y+E.PH/2);
  if(p.sh){const g=ctx.createRadialGradient(0,0,10,0,0,24);g.addColorStop(0,'rgba(120,200,255,.05)');g.addColorStop(1,'rgba(120,200,255,.45)');ctx.fillStyle=g;ctx.strokeStyle='rgba(150,215,255,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-2,23+Math.sin(t*6)*1,0,7);ctx.fill();ctx.stroke()}
  if(p.mag>0){ctx.strokeStyle=col.tx2;ctx.setLineDash([4,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,30+Math.sin(t*8)*2,0,7);ctx.stroke();ctx.setLineDash([])}
  ctx.restore()}
 let GameLookE=null;
 return{reset,bg,grass,hero,init(e){GameLookE=e}}})();
