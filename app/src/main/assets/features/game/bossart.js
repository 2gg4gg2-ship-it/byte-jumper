/* ===== РИСУНКИ БОССОВ (0.7.1): десять тел в одной палитре: серый металл, красное око, белые блики =====
   Только рисование (canvas), без логики и DOM. Вызывается из game.js: GameBossArt.draw(ctx,S,t). Начало координат уже в центре босса.
   Хитбоксов у тел нет: боссов не бьют, их «исправляют» ключами, поэтому внешний вид свободный. */
const GameBossArt=(()=>{
 const TAU=6.2832,RED='#e0262b',W='#f1f2f4';
 /* объёмный блок: тело, светлая грань сверху, тёмная снизу, контур */
 function box(ctx,x,y,w,h,base,top){
  ctx.fillStyle=base;ctx.fillRect(x,y,w,h);ctx.fillStyle=top||'rgba(255,255,255,.2)';ctx.fillRect(x,y,w,Math.max(2,h*.08));ctx.fillRect(x,y,2,h);
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x,y+h-Math.max(2,h*.08),w,Math.max(2,h*.08));ctx.fillRect(x+w-2,y,2,h);
  ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1)}
 const grad=(ctx,y0,y1,a,b)=>{const g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g};
 function glow(ctx,x,y,r,c,a){GameArt.glowDot(ctx,x,y,r,c.indexOf('224')>0?'#e0262b':'#f1f2f4',a)}
 const eyeGlow=(ctx,x,y,r,eye)=>glow(ctx,x,y,r,eye===RED?'rgba(224,38,43,1)':'rgba(241,242,244,1)',.5);
 function slit(ctx,x,y,w,h,eye){ctx.fillStyle='#050506';ctx.fillRect(x-w-3,y-3,w*2+6,h+6);eyeGlow(ctx,x,y+h/2,26,eye);ctx.fillStyle=eye;ctx.fillRect(x-w/2,y,w,h)}
 function draw(ctx,S,t){
  const B=S.boss,id=S.bid,eye=B.conf?W:RED;
  if(id===1){/* Потерянный Страж: ржавая дверь-арка, красное око, на груди рамка «404», кулаки парят отдельно, снизу сыплются пиксели */
   const tilt=Math.sin(t*1.3)*.05;ctx.save();ctx.rotate(tilt);
   box(ctx,-34,-42,68,80,grad(ctx,-42,38,'#6b6d74','#2b2c31'),'rgba(255,255,255,.28)');
   ctx.fillStyle='#08080a';ctx.fillRect(-21,-34,42,46);ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1.5;ctx.strokeRect(-21,-34,42,46);
   slit(ctx,0,-26,5,26,eye);
   ctx.fillStyle='#1a1a1e';ctx.fillRect(-20,16,40,16);ctx.fillStyle='rgba(241,242,244,.85)';ctx.font='700 12px monospace';ctx.textAlign='center';ctx.fillText('404',0,28);
   ctx.restore();
   for(let s=-1;s<=1;s+=2){const fy=4+Math.sin(t*2+s)*5;ctx.save();ctx.translate(s*52,fy);ctx.rotate(s*.15);box(ctx,-10,-10,20,20,'#4c4e55');ctx.fillStyle='#17171a';ctx.fillRect(-4,-4,8,8);ctx.restore();
    ctx.fillStyle='rgba(138,140,147,.4)';for(let k=0;k<3;k++)ctx.fillRect(s*(34+k*5),fy-2+k*3,3,3)}
   ctx.fillStyle='rgba(224,38,43,.9)';ctx.beginPath();ctx.moveTo(-14,38);ctx.lineTo(14,38);ctx.lineTo(8,48+Math.sin(t*20)*3);ctx.lineTo(0,42);ctx.lineTo(-8,50+Math.cos(t*17)*3);ctx.closePath();ctx.fill();
   for(let i=0;i<7;i++){const k=(t*1.4+i*.31)%1;ctx.fillStyle='rgba(241,242,244,'+(.7*(1-k))+')';ctx.fillRect(-30+i*10+Math.sin(i*5)*6,40+k*50,3,3)}}
  else if(id===2){/* Колосс Переполнения: стопка окон, на «лице» окно «Подождите» */
   for(let i=0;i<4;i++){const x=-40+i*4,y=-38+i*19,w=80-i*8;box(ctx,x,y,w,17,i%2?'#3a3b41':'#2b2c31');ctx.fillStyle='#8a8c93';ctx.fillRect(x+2,y+2,w-4,4);ctx.fillStyle='#050506';ctx.fillRect(x+4,y+3,2,2);ctx.fillRect(x+8,y+3,2,2)}
   ctx.fillStyle='#050506';ctx.fillRect(-20,-8,40,24);ctx.strokeStyle='rgba(241,242,244,.5)';ctx.lineWidth=1;ctx.strokeRect(-20,-8,40,24);
   eyeGlow(ctx,0,4,28,eye);ctx.fillStyle=eye;for(let i=0;i<3;i++){const a=(Math.sin(t*5-i)>0)?1:.25;ctx.globalAlpha=a;ctx.fillRect(-9+i*9,5,5,5)}ctx.globalAlpha=1}
  else if(id===3){/* Хозяин Кэша: высокий силуэт из миниатюр старых кадров */
   box(ctx,-24,-40,48,90,'#26272b');
   for(let r=0;r<6;r++)for(let c=0;c<2;c++){const k=(r*2+c)%3;ctx.fillStyle=['#5a5c63','#3b3c42','#8a8c93'][k];ctx.globalAlpha=.55+.3*Math.sin(t*3+r*2+c);ctx.fillRect(-20+c*22,-36+r*14,18,11)}ctx.globalAlpha=1;
   ctx.fillStyle='#050506';ctx.fillRect(-14,-34,28,20);slit(ctx,0,-28,14,4,eye);ctx.fillStyle='rgba(241,242,244,.7)';ctx.fillRect(-10,-20,20,2)}
  else if(id===5){/* Монарх Лимита: трон с короной-счётчиком, на лице табло «429» */
   box(ctx,-32,-6,64,56,grad(ctx,-6,50,'#3b3c42','#16161a'));box(ctx,-38,-4,8,54,'#2b2c31');box(ctx,30,-4,8,54,'#2b2c31');
   ctx.fillStyle='#d9dce0';ctx.beginPath();ctx.moveTo(-26,-8);ctx.lineTo(-26,-32);ctx.lineTo(-13,-17);ctx.lineTo(0,-38);ctx.lineTo(13,-17);ctx.lineTo(26,-32);ctx.lineTo(26,-8);ctx.closePath();ctx.fill();
   ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(-26,-14,52,6);ctx.fillStyle='#050506';ctx.fillRect(-21,8,42,24);eyeGlow(ctx,0,20,30,eye);ctx.fillStyle=eye;ctx.font='700 15px monospace';ctx.textAlign='center';ctx.fillText('429',0,26)}
  else if(id===6){/* Стиратель Реестра: терминал с красной шапкой и табличкой «ВЫ УВЕРЕНЫ?» */
   box(ctx,-38,-28,76,66,'#26272b');ctx.fillStyle=RED;ctx.fillRect(-38,-28,76,11);ctx.fillStyle='#fff';ctx.fillRect(-34,-24,4,4);ctx.fillRect(-28,-24,4,4);
   ctx.fillStyle='#050506';ctx.fillRect(-32,-13,64,46);ctx.fillStyle=eye;ctx.font='700 11px monospace';ctx.textAlign='center';ctx.fillText('rm -r',0,4);ctx.fillText('/*',0,19);ctx.fillRect(-4+Math.sin(t*4)*14,26,8,3);
   ctx.save();ctx.translate(44,6);ctx.rotate(-.35+Math.sin(t*2)*.1);box(ctx,-6,-4,14,26,'#d9dce0','rgba(255,255,255,.5)');ctx.fillStyle=RED;ctx.fillRect(-6,-4,14,6);ctx.restore()}
  else if(id===7){/* Тень: чёрная копия Искры с красными глазами и шлейфом помех */
   for(let i=3;i>0;i--){ctx.globalAlpha=.12*i/3;ctx.fillStyle='#0b0b0d';ctx.beginPath();ctx.ellipse(-i*5,2,26,24,0,0,TAU);ctx.fill()}ctx.globalAlpha=1;
   ctx.fillStyle='#000';ctx.strokeStyle='rgba(184,186,192,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,28,26,0,0,TAU);ctx.fill();ctx.stroke();
   ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(-6,-24);ctx.lineTo(4,-40);ctx.lineTo(12,-22);ctx.closePath();ctx.fill();ctx.stroke();
   eyeGlow(ctx,0,-4,34,RED);ctx.fillStyle=RED;ctx.beginPath();ctx.ellipse(-9,-4,3.5,7,0,0,TAU);ctx.ellipse(9,-4,3.5,7,0,0,TAU);ctx.fill();
   if(Math.sin(t*9)>.75){ctx.fillStyle='rgba(241,242,244,.5)';ctx.fillRect(-30,Math.sin(t*3)*14,60,2)}}
  else if(id===8){/* Летописец Забвения: змея из лент памяти и маска из страниц */
   ctx.strokeStyle='#3b3c42';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();for(let i=0;i<=12;i++){const a=i/12*3.2-1.2,x=Math.sin(i*.8+t*2)*8-i*4+20,y=i*5-6;ctx[i?'lineTo':'moveTo'](x,y+30)}ctx.stroke();ctx.lineCap='butt';
   box(ctx,-26,-34,52,64,'#d0d2d7','rgba(255,255,255,.6)');ctx.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<5;i++)ctx.fillRect(-19,-26+i*8,38-(i%2)*10,2);
   ctx.fillStyle='#050506';ctx.fillRect(-17,-12,34,16);slit(ctx,0,-9,14,4,eye);
   ctx.fillStyle='rgba(138,140,147,.8)';ctx.font='600 8px monospace';ctx.textAlign='center';ctx.fillText('0x'+((t*9|0)%256).toString(16).toUpperCase(),0,24)}
  else if(id===9){/* Страж Тишины: треснувшая сфера из осколков кадров */
   const hp=Math.max(0,B.hp||0),n=Math.floor((100-hp)/12);
   const g=ctx.createRadialGradient(-8,-10,4,0,0,32);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#7b7e86');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,30,0,TAU);ctx.fill();
   ctx.strokeStyle='#050506';ctx.lineWidth=2;for(let i=0;i<n;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(i*2.1)*30,Math.sin(i*2.1)*30);ctx.stroke()}
   ctx.fillStyle='#050506';ctx.fillRect(-12,-8,24,10);slit(ctx,0,-6,16,4,eye);
   for(let i=0;i<5;i++){const a=t*.6+i*1.26;ctx.save();ctx.translate(Math.cos(a)*44,Math.sin(a)*34);ctx.rotate(a*2);ctx.fillStyle='rgba(184,186,192,.8)';ctx.fillRect(-4,-3,8,6);ctx.restore()}}
  else if(id===10){/* Кернел: плащ из кода, лицо из логов, десять Печатей по кругу гаснут */
   ctx.fillStyle=grad(ctx,-32,52,'#2b2c31','#08080a');ctx.beginPath();ctx.moveTo(-14,-30);ctx.lineTo(14,-30);ctx.lineTo(26,52);ctx.lineTo(-26,52);ctx.closePath();ctx.fill();
   ctx.fillStyle='rgba(241,242,244,.22)';ctx.font='600 7px monospace';ctx.textAlign='center';for(let i=0;i<7;i++)ctx.fillText(((i*37+(t*6|0))%2)?'01':'10',(i%2?-6:6),-8+i*8);
   ctx.fillStyle='#050506';ctx.fillRect(-14,-34,28,22);ctx.strokeStyle='rgba(184,186,192,.6)';ctx.lineWidth=1;ctx.strokeRect(-14,-34,28,22);
   eyeGlow(ctx,0,-24,26,RED);ctx.fillStyle=RED;ctx.fillRect(-9,-26,5,5);ctx.fillRect(4,-26,5,5);
   const lit=Math.ceil(B.hp/10);for(let i=0;i<10;i++){const a=i*.628+t*.3;ctx.fillStyle=i<lit?W:'#2b2c31';ctx.beginPath();ctx.arc(Math.cos(a)*58,Math.sin(a)*40,4,0,TAU);ctx.fill()}}
  else{/* Пакетный Шторм: медуза из кабелей, в центре индикатор «…» */
   ctx.fillStyle=grad(ctx,-36,6,'#5a5c63','#26272b');ctx.beginPath();ctx.arc(0,0,36,Math.PI,0);ctx.fill();ctx.fillRect(-36,0,72,6);
   ctx.strokeStyle='rgba(184,186,192,.85)';ctx.lineWidth=3;for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*10,6);ctx.quadraticCurveTo(i*10+Math.sin(t*3+i)*9,26,i*10+Math.sin(t*2+i)*6,44);ctx.stroke()}
   ctx.globalAlpha=Math.sin(t*6)>0?1:.3;eyeGlow(ctx,0,-8,24,eye);ctx.fillStyle=eye;ctx.beginPath();ctx.arc(0,-8,7,0,TAU);ctx.fill();ctx.globalAlpha=1}
  if(B.conf&&id===1){ctx.fillStyle=W;ctx.font='700 10px monospace';ctx.textAlign='center';ctx.fillText('404',0,-52)}}
 return{draw}})();
