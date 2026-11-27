/* ===== ФОНЫ АРЕН БОССОВ 1–10 (0.16.6–0.16.7): только canvas, без логики. Шахта файлов, башня-стек, зеркальный зал, конвейер, весы.
   Вызывается из boss12view.js (боссы 1–2) и art.js arenaBg (боссы 3–5). Хитбоксы и платформы не трогает. ===== */
const GameArenaBg=(()=>{
 const TAU=6.2832,hs=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)};
 const glow=(ctx,x,y,r,c,a)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');ctx.save();ctx.globalAlpha=a;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore()};
 const wrap=(v,m)=>((v%m)+m)%m;
 /* босс 1: шахта из файлов. Рисуется в мировых координатах (экран едет вниз): ржавые стенки с рёбрами и шкафами, холодный туман, падающие листы */
 function shaft(ctx,S,W,H,t){
  const c0=S.cam,g=ctx.createLinearGradient(0,c0,0,c0+H);g.addColorStop(0,'#1a2130');g.addColorStop(1,'#0b0f18');ctx.fillStyle=g;ctx.fillRect(0,c0,W,H);
  const y0=Math.floor(c0/96)*96;
  for(let y=y0;y<c0+H+96;y+=96){const r=hs(y*.1);
   for(const side of [0,1]){const x=side?W-34:0;ctx.fillStyle='#2a2119';ctx.fillRect(x,y,34,96);ctx.fillStyle='#3b2c1f';ctx.fillRect(x,y,34,6);ctx.fillStyle='rgba(255,170,100,.18)';ctx.fillRect(side?x:x+33,y,1,96);
    for(let k=0;k<3;k++){ctx.fillStyle=r>.5?'#4a3727':'#33281d';ctx.fillRect(x+4,y+10+k*28,26,22);ctx.strokeStyle='rgba(255,190,130,.28)';ctx.strokeRect(x+4.5,y+10.5+k*28,25,21);ctx.fillStyle='rgba(255,190,130,.4)';ctx.fillRect(x+12,y+18+k*28,10,2)}}
   ctx.fillStyle='rgba(140,170,220,.05)';ctx.fillRect(34,y+90,W-68,2)}
  const fog=ctx.createLinearGradient(0,c0,0,c0+H);fog.addColorStop(0,'rgba(120,160,230,.0)');fog.addColorStop(.5,'rgba(120,160,230,.08)');fog.addColorStop(1,'rgba(120,160,230,.0)');ctx.fillStyle=fog;ctx.fillRect(34,c0,W-68,H);
  glow(ctx,W/2,c0-10,W*.7,'#7fb0ff',.28);
  ctx.font='600 10px monospace';ctx.textAlign='left';
  for(let i=0;i<9;i++){const x=40+hs(i*3)*(W-120),y=c0+wrap(t*(30+i*4)+i*97,H+40)-20;ctx.fillStyle='rgba(190,210,240,'+(.14+hs(i)*.12).toFixed(2)+')';ctx.fillText(i%3?'File not found':'404',x,y);
   if(i%2){ctx.save();ctx.translate(x+70,y-8);ctx.rotate(Math.sin(t+i)*.5);ctx.fillStyle='rgba(215,228,240,.3)';ctx.fillRect(-5,-7,10,14);ctx.restore()}}}
 /* босс 2: башня-стек. Четыре яруса, кирпичи-слои, тёплое окно справа, откуда вылезает Колосс */
 function tower(ctx,S,W,H,t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0d1636');g.addColorStop(1,'#060a1c');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let r=0;r<Math.ceil(H/20);r++){const y=r*20,off=(r%2)*22;for(let x=-off;x<W;x+=44){const q=hs(r*13+x*.07);ctx.fillStyle=q>.7?'#142450':'#0f1b40';ctx.fillRect(x+1,y+1,42,18);if(q>.85){ctx.fillStyle='rgba(143,176,255,.12)';ctx.fillRect(x+4,y+8,18,2)}}}
  const tiers=4,th=H/tiers;for(let i=1;i<tiers;i++){ctx.fillStyle='rgba(143,176,255,.22)';ctx.fillRect(0,i*th-1,W,2);ctx.fillStyle='rgba(255,217,160,.5)';ctx.font='600 8px monospace';ctx.textAlign='left';ctx.fillText('SP+'+(tiers-i),6,i*th-5)}
  const wy=H*.2;glow(ctx,W-6,wy,120,'#ffd9a0',.4+.1*Math.sin(t*3));ctx.fillStyle='#ffd9a0';ctx.fillRect(W-26,wy-26,26,52);ctx.fillStyle='rgba(60,30,0,.5)';ctx.fillRect(W-22,wy-22,18,44);ctx.fillRect(W-13,wy-22,1,44);ctx.fillRect(W-26,wy,26,1);
  ctx.font='600 9px monospace';ctx.fillStyle='rgba(190,215,255,.16)';ctx.textAlign='left';for(let i=0;i<8;i++)ctx.fillText(i%2?'push()':'pop()',46,20+wrap(t*14+i*70,H));}
 /* босс 3: зеркальный зал. Стеклянные панели, бирюзовое свечение, пол отражает платформы */
 function mirror(ctx,S,W,H,t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0a1a20');g.addColorStop(1,'#050b10');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const fl=S.pl.find(q=>q.floor),fy=fl?fl.y:H*.8;
  for(let i=0;i<5;i++){const x=i*W/4.2-30,w=70;const pg=ctx.createLinearGradient(x,0,x+w,fy);pg.addColorStop(0,'rgba(159,242,234,.02)');pg.addColorStop(.5,'rgba(159,242,234,.12)');pg.addColorStop(1,'rgba(159,242,234,.02)');ctx.fillStyle=pg;ctx.beginPath();ctx.moveTo(x+18,0);ctx.lineTo(x+w,0);ctx.lineTo(x+w-22,fy);ctx.lineTo(x,fy);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(200,245,250,.25)';ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.moveTo(x+30+Math.sin(t*.4+i)*6,10);ctx.lineTo(x+10,fy*.55);ctx.stroke()}
  glow(ctx,W*.5,fy*.4,W*.8,'#6fd8ff',.14);
  /* отражение в полу: платформы вверх ногами, бледнее и со сдвигом по времени */
  ctx.save();ctx.beginPath();ctx.rect(0,fy,W,H-fy);ctx.clip();const rg=ctx.createLinearGradient(0,fy,0,H);rg.addColorStop(0,'rgba(120,230,225,.22)');rg.addColorStop(1,'rgba(10,30,40,.9)');ctx.fillStyle=rg;ctx.fillRect(0,fy,W,H-fy);
  ctx.globalAlpha=.22;ctx.fillStyle='#7fe8e0';for(const q of S.pl){if(q.floor||q.st==='gone')continue;ctx.fillRect(q.x,2*fy-q.y-10+Math.sin(t*2+q.x)*1.5,q.w,6)}ctx.restore();
  ctx.fillStyle='rgba(223,244,242,.8)';ctx.fillRect(0,fy,W,1)}
 /* босс 4: конвейер. Три световых рельса, по ним бегут огни пакетов */
 function conveyor(ctx,S,W,H,t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#030a1a');g.addColorStop(1,'#06142a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<6;i++){const x=hs(i*5)*W;ctx.fillStyle='rgba(60,110,200,.07)';ctx.fillRect(x,0,14+hs(i)*20,H)}
  const ys=[H*.3,H*.52,H*.74];
  ys.forEach((y,k)=>{const sp=(k===2?60:110)*(k===1?-1:1);ctx.lineWidth=2;ctx.strokeStyle='rgba(111,216,255,.55)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();ctx.strokeStyle='rgba(111,216,255,.15)';ctx.lineWidth=8;ctx.stroke();
   ctx.fillStyle='rgba(111,216,255,.9)';for(let i=0;i<7;i++){const x=wrap(i*(W/6)+t*sp,W+40)-20;ctx.fillRect(x,y-2,12,4);glow(ctx,x+6,y,16,'#74f0ff',.4)}
   ctx.fillStyle='rgba(125,255,168,.9)';{const x=wrap(W*.3+t*sp*.7+k*60,W+40)-20;ctx.fillRect(x,y-5,8,8)}
   ctx.font='700 8px monospace';ctx.fillStyle='rgba(159,230,255,.5)';ctx.textAlign='left';ctx.fillText('RAIL '+(k+1),6,y-8)});
  ctx.font='600 8px monospace';ctx.fillStyle='rgba(159,230,255,.2)';for(let i=0;i<8;i++)ctx.fillText(['SYN','ACK','RETRY','PING'][i%4],wrap(i*53+t*20,W),20+hs(i)*(H-40))}
 /* босс 5: весы. Золотая балка на колонне, две чаши на цепях, шестерёнка в центре, монеты-блики */
 function scales(ctx,S,W,H,t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a1710');g.addColorStop(1,'#0b0a06');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  glow(ctx,W/2,H*.3,W*.9,'#f5b82e',.18);
  const cx=W/2,py=H*.28,tilt=Math.sin(t*.5)*.1+((S.tok||0)-50)/50*.06,L=W*.4;
  ctx.fillStyle='#2f2815';ctx.fillRect(cx-7,py,14,H);ctx.fillStyle='rgba(245,184,46,.35)';ctx.fillRect(cx-7,py,2,H);
  ctx.save();ctx.translate(cx,py);ctx.rotate(tilt);ctx.fillStyle='#8a6a22';ctx.fillRect(-L,-4,L*2,8);ctx.fillStyle='rgba(255,226,140,.6)';ctx.fillRect(-L,-4,L*2,2);
  for(const sd of [-1,1]){const ex=sd*L;ctx.save();ctx.translate(ex,0);ctx.rotate(-tilt);ctx.strokeStyle='rgba(245,184,46,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-34,H*.2);ctx.moveTo(0,0);ctx.lineTo(34,H*.2);ctx.stroke();
   ctx.fillStyle='#6a5320';ctx.beginPath();ctx.ellipse(0,H*.2+4,40,8,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,226,140,.6)';ctx.stroke();
   for(let i=0;i<4;i++){glow(ctx,-18+i*12,H*.2-2,8,'#f5b82e',.5);ctx.fillStyle='#f5b82e';ctx.beginPath();ctx.ellipse(-18+i*12,H*.2-3,4,3,0,0,TAU);ctx.fill()}ctx.restore()}
  ctx.restore();
  ctx.save();ctx.translate(cx,py);ctx.rotate(t*.4);ctx.fillStyle='#b98f2b';ctx.beginPath();for(let i=0;i<16;i++){const a=i*TAU/16,r=i%2?15:20;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.fillStyle='#1a1710';ctx.beginPath();ctx.arc(0,0,6,0,TAU);ctx.fill();ctx.restore();
  ctx.font='700 9px monospace';ctx.fillStyle='rgba(245,184,46,.28)';ctx.textAlign='left';for(let i=0;i<6;i++)ctx.fillText(['429','LIMIT','$','TOKENS'][i%4],wrap(i*71+t*10,W),30+hs(i*3)*(H-60))}
 /* босс 6: стеллаж. Восемь рядов деревянных полок с карточками, на части красные метки удаления */
 function shelves(ctx,S,W,H,t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2a1c12');g.addColorStop(1,'#120b07');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const rows=8,rh=H/rows;
  for(let r=0;r<rows;r++){const y=r*rh;ctx.fillStyle='#4a3220';ctx.fillRect(0,y+rh-6,W,6);ctx.fillStyle='rgba(255,190,120,.25)';ctx.fillRect(0,y+rh-6,W,1);
   for(let x=6;x<W-10;x+=17){const q=hs(r*17+x*.13);if(q<.12)continue;const h=rh-14-q*8;ctx.fillStyle=q>.6?'#d9c9a8':'#bfae8c';ctx.fillRect(x,y+rh-6-h,13,h);ctx.fillStyle='rgba(60,40,20,.5)';ctx.fillRect(x+2,y+rh-6-h+4,9,1.5);ctx.fillRect(x+2,y+rh-6-h+8,6,1.5);if(q>.86&&Math.sin(t*2+x)>-.3){ctx.fillStyle='#e0262b';ctx.fillRect(x+1,y+rh-6-h-1,11,3)}}}
  glow(ctx,W/2,H*.2,W*.8,'#ffcf8a',.14);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,W,H)}
 /* босс 7: кольцо. Чёрная пустота, светящиеся синие контуры колец, красные глаза вдали, пол и потолок равны */
 function ring(ctx,S,W,H,t){
  ctx.fillStyle='#04050b';ctx.fillRect(0,0,W,H);
  for(let i=0;i<4;i++){const r=W*(.28+i*.16),a=.1+.05*Math.sin(t*.8+i);ctx.strokeStyle='rgba(127,156,255,'+a.toFixed(3)+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(W/2,H/2,r,r*1.5,0,0,TAU);ctx.stroke();
   ctx.strokeStyle='rgba(127,156,255,.35)';ctx.beginPath();ctx.arc(W/2+Math.cos(t*.5+i*1.7)*r,H/2+Math.sin(t*.5+i*1.7)*r*1.5,2.5,0,TAU);ctx.stroke()}
  for(const yy of [10,H-10]){ctx.fillStyle='rgba(127,156,255,.3)';ctx.fillRect(0,yy,W,1)}
  for(let i=0;i<5;i++){const x=hs(i*7)*W,y=hs(i*3+1)*H;if(Math.sin(t*.7+i*2)>.3){glow(ctx,x,y,12,'#ff5a7a',.5);ctx.fillStyle='#ff5a7a';ctx.fillRect(x-5,y,3,2);ctx.fillRect(x+2,y,3,2)}}}
 /* босс 8: лента текста. Чёрный фон, зелёные строки пишутся и стираются, зачёркнутые слова */
 function ribbon(ctx,S,W,H,t){
  ctx.fillStyle='#020503';ctx.fillRect(0,0,W,H);ctx.font='600 10px monospace';ctx.textAlign='left';
  const WD=['помнил','никого','не было','были','история','строка','имя','забыть','писать','память'];
  for(let r=0;r<Math.ceil(H/24);r++){let x=wrap(-r*37+t*(r%2?6:-6),W+120)-100;for(let k=0;k<5;k++){const w=WD[(r*3+k)%WD.length],q=hs(r*9+k),y=r*24+16;ctx.fillStyle='rgba(60,255,122,'+(.08+q*.14).toFixed(3)+')';ctx.fillText(w,x,y);const wd=ctx.measureText(w).width;if(q>.78){ctx.fillRect(x,y-3,wd,1)}x+=wd+14+q*20}}
  const cy=wrap(t*40,H+60)-30;const cg=ctx.createLinearGradient(0,cy-30,0,cy+30);cg.addColorStop(0,'rgba(60,255,122,0)');cg.addColorStop(.5,'rgba(60,255,122,.14)');cg.addColorStop(1,'rgba(60,255,122,0)');ctx.fillStyle=cg;ctx.fillRect(0,cy-30,W,60);
  ctx.fillStyle='rgba(232,245,232,.5)';if(Math.sin(t*6)>0)ctx.fillRect(W*.4,H*.5,6,11)}
 /* босс 9: замёрзший кадр. Синий экран, трещины от краёв к центру, фальшивые окна */
 function frozen(ctx,S,W,H,t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#10306e');g.addColorStop(1,'#0a2150');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(200,225,255,.35)';ctx.lineWidth=1.2;const moved=Math.min(1,(S.pan||0)||.3);
  for(let i=0;i<10;i++){const side=i%4,sx=side===0?0:side===1?W:hs(i)*W,sy=side===2?0:side===3?H:hs(i+3)*H;let x=sx,y=sy;ctx.beginPath();ctx.moveTo(x,y);const L=50+hs(i*5)*110;for(let k=0;k<6;k++){x+=(W/2-x)*.09+(hs(i*9+k)-.5)*26;y+=(H/2-y)*.09+(hs(i*7+k)-.5)*26;ctx.lineTo(x,y)}ctx.stroke()}
  ctx.font='700 64px sans-serif';ctx.fillStyle='rgba(220,235,255,.08)';ctx.textAlign='center';ctx.fillText(':(',W/2,H*.45);
  ctx.font='600 9px monospace';ctx.fillStyle='rgba(142,197,255,.3)';ctx.textAlign='left';for(let i=0;i<4;i++)ctx.fillText(['STOP: 0x0000007B','FREEZE','SIGNAL LOST','3 1 4'][i],10,H*.18+i*20);
  ctx.fillStyle='rgba(255,255,255,.04)';ctx.fillRect(0,wrap(t*20,H),W,3)}
 /* босс 10: пустота с печатями. Белое и чёрное, десять печатей по кругу, золото на переходе */
 function voidSeals(ctx,S,W,H,t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0a0a0b');g.addColorStop(.55,'#161618');g.addColorStop(1,'#d9dade');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  glow(ctx,W/2,H*.4,W*.7,'#f2f2f2',.18);
  const cx=W/2,cy=H*.36,R=W*.4;
  for(let i=0;i<10;i++){const a=i/10*TAU+t*.12,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R*.55,on=(S.p4==null)||i<10-((S.phase||0)*2);ctx.save();ctx.translate(x,y);ctx.globalAlpha=on?.8:.2;ctx.strokeStyle='#f2f2f2';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.stroke();ctx.rotate(t*.5);ctx.beginPath();for(let k=0;k<6;k++){ctx.rotate(1.0472);ctx.moveTo(5,0);ctx.lineTo(9,0)}ctx.stroke();ctx.restore()}
  ctx.fillStyle='rgba(255,212,74,.12)';ctx.fillRect(0,H*.64,W,2);ctx.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<20;i++)ctx.fillRect(hs(i)*W,H*.7+hs(i+4)*H*.3,1.5,1.5)}
 /* id 1..10: true = фон нарисован. Для 1 рисовать внутри мирового слоя шахты (после translate) */
 function draw(ctx,S,W,H,t,id){
  if(id===1)shaft(ctx,S,W,H,t);else if(id===2)tower(ctx,S,W,H,t);else if(id===3)mirror(ctx,S,W,H,t);else if(id===4)conveyor(ctx,S,W,H,t);else if(id===5)scales(ctx,S,W,H,t);else if(id===6)shelves(ctx,S,W,H,t);else if(id===7)ring(ctx,S,W,H,t);else if(id===8)ribbon(ctx,S,W,H,t);else if(id===9)frozen(ctx,S,W,H,t);else if(id===10)voidSeals(ctx,S,W,H,t);else return false;return true}
 return{draw}})();
