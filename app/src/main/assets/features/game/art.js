/* ===== ГРАФИКА «БАЙТ-ПРЫГУНА»: фоны уровней 1–20, земля, предметы, интерфейс, частицы =====
   Всё рисуется кодом на canvas, картинок нет, сеть не нужна. Свой цвет у каждого уровня (1–9 «Корзина», 11–19 «Стек»;
   на уровнях 10 и 20 бои с боссами: их арены рисуют arenaBg и plat). Уровни 21+ берут те же 20 палитр по кругу.
   Плавность: слои сдвигаются от S.x (параллакс), число частиц и звёзд растёт и падает вместе с GameCore.perf.q.
   Игровая логика (хитбоксы, физика) здесь не меняется: только то, как нарисовано. */
const GameArt=(()=>{
 const TAU=6.2832;
 const hs=n=>{n=Math.imul(n^(n>>>15),2246822519);n=Math.imul(n^(n>>>13),3266489917);return((n^(n>>>16))>>>0)/4294967296};
 /* палитра: [верх неба, низ неба, акцент (свет), дальний силуэт, ближний силуэт, мотив, название] */
 const TH=[
  ['#0d1a1f','#2d5650','#6ee7c8','#12302f','#0c2224','dawn','Пробуждение'],
  ['#0b1520','#21465a','#8be9fd','#10293a','#0a1d2b','fly','Первая память'],
  ['#17131f','#3d3050','#f0c27b','#241b30','#17111f','shelf','Архивариус'],
  ['#121722','#363b58','#ff9ec4','#1c2036','#111426','lost','Потеряшка'],
  ['#161a20','#4a5864','#cfe3ff','#232c36','#161d26','wind','Мусорный ветер'],
  ['#1c1517','#58393a','#ffb86b','#2c1d1f','#1d1214','sign','Дверь без таблички'],
  ['#0f1326','#2f3870','#9aa8ff','#1a2146','#10153a','icon','Потерянные иконки'],
  ['#1b130e','#5e3b22','#ff9f5a','#2b1c12','#1a110a','rail','Ржавый лифт'],
  ['#05070d','#131c2f','#e6f1ff','#0a0f1c','#05080f','door','Тихая дверь'],
  ['#0e0c22','#2a2468','#8f7bff','#1b1648','#0f0c30','tower','Нижний слой'],
  ['#0e0b2c','#3a2a8c','#b69cff','#1f1658','#120d3a','tower','Нижний слой'],
  ['#130e30','#392a8e','#b69cff','#211660','#130d3c','push','Push'],
  ['#1a0f30','#52307e','#ffd36e','#2b1648','#190c2e','scaf','Мастер Правок'],
  ['#04040c','#0e0d28','#6ee7ff','#0a0a1e','#05050f','cell','Подвал стека'],
  ['#0d1230','#2b41a0','#74f0ff','#18236a','#0d1448','gate','Первый Шлюз'],
  ['#151232','#3d3278','#ffd166','#231c56','#130f34','house','Спор Домов'],
  ['#100b28','#33207a','#ff7ad9','#1c1250','#0e0a30','nest','Рекурсия'],
  ['#160e24','#482a66','#ff9a5a','#271642','#150b24','brok','Сломанный лифт'],
  ['#0a0d22','#1f2e6c','#7aa2ff','#121b4a','#0a1030','wght','Тяжёлая память'],
  ['#0c0a20','#2e2678','#a08cff','#1a1450','#0d0a30','tower','Колосс']];
 const idx=(mode,L)=>mode==='endless'?11:Math.max(0,((L|0)-1)%20);
 const theme=(mode,L)=>{const i=idx(mode,L),t=TH[i];return{i,top:t[0],bot:t[1],ac:t[2],far:t[3],near:t[4],m:t[5],name:t[6],act:i<10?0:1}};
 const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')'};
 function glowDot(ctx,x,y,r,c,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
 /* силуэт: ряд домов-башен (акт «Стек») или куч мусора (акт «Корзина») */
 function skyline(ctx,W,gy,sx,k,seed,color,hMin,hMax,per,act,lit,t){
  const off=((sx*k)%(per*14)+per*14)%(per*14);ctx.fillStyle=color;
  for(let i=-1;i<Math.ceil(W/per)+2;i++){
   const gi=Math.floor((off/per))+i,x=i*per-(off%per),r=hs(gi+seed),w=per*(.7+r*.9),h=hMin+hs(gi*7+seed)*(hMax-hMin);
   if(act===0){/* куча: холм из папок и обломков */
    ctx.beginPath();ctx.moveTo(x,gy);ctx.quadraticCurveTo(x+w*.5,gy-h*1.5,x+w,gy);ctx.fill();
    ctx.fillRect(x+w*.3,gy-h*.9,w*.18,h*.3);ctx.fillRect(x+w*.55,gy-h*.75,w*.14,h*.22)}
   else{ctx.fillRect(x,gy-h,w,h);if(r>.55)ctx.fillRect(x+w*.2,gy-h-12,w*.6,12);
    if(lit){const c=lit;for(let wy=gy-h+8;wy<gy-6;wy+=11){for(let wx=x+5;wx<x+w-6;wx+=9){const q=hs(gi*131+wy*3+wx);if(q>.62){ctx.fillStyle=rgba(c,.12+.22*(.5+.5*Math.sin(t*1.3+q*20)));ctx.fillRect(wx,wy,4,5)}}}ctx.fillStyle=color}}}}
 /* мотивы: у каждого уровня своя особая деталь фона */
 function motif(ctx,m,W,gy,sx,t,th,q,L){
  const ac=th.ac,n=(a)=>Math.max(1,Math.round(a*q));
  if(m==='dawn'){glowDot(ctx,W*.7,gy-18,150,ac,.38);glowDot(ctx,W*.7,gy-10,70,'#ffffff',.18)}
  else if(m==='fly'||m==='cell'){for(let i=0;i<n(14);i++){const r=hs(i+9),x=((r*W*1.4-sx*.07*(1+r))%(W+40)+W+40)%(W+40)-20,y=gy-30-hs(i+3)*(gy-90)+Math.sin(t*1.2+i)*10;glowDot(ctx,x,y,m==='cell'?10:14,ac,.5+.3*Math.sin(t*2+i))}}
  else if(m==='shelf'){ctx.fillStyle=th.far;for(let i=0;i<5;i++){const x=((i*118-sx*.1)%(W+140)+W+140)%(W+140)-60;ctx.fillRect(x,gy-110,56,110);ctx.fillStyle=rgba(ac,.18);for(let r=0;r<5;r++)ctx.fillRect(x+5,gy-104+r*20,46,3);ctx.fillStyle=th.far}}
  else if(m==='lost'){for(let i=0;i<4;i++){const x=((i*113+40-sx*.09)%(W+100)+W+100)%(W+100)-30,y=gy-14-(i%2)*6;ctx.fillStyle=rgba(ac,.32);ctx.beginPath();ctx.moveTo(x-9,gy);ctx.lineTo(x,y-14);ctx.lineTo(x+9,gy);ctx.fill();if(Math.sin(t*2+i*1.7)>.5){ctx.fillStyle=rgba('#ffffff',.7);ctx.font='700 12px monospace';ctx.textAlign='center';ctx.fillText('!',x,y-18)}}}
  else if(m==='wind'){ctx.strokeStyle=rgba(ac,.22);ctx.lineWidth=1.5;for(let i=0;i<n(12);i++){const r=hs(i+1),x=((r*W-sx*.8-t*160*(.5+r))%(W+160)+W+160)%(W+160)-80,y=30+hs(i+4)*(gy-60);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+40+r*50,y);ctx.stroke()}
   ctx.fillStyle=rgba('#e8f0ff',.35);for(let i=0;i<n(5);i++){const r=hs(i+31),x=((r*W-sx*.5-t*120)%(W+60)+W+60)%(W+60)-30,y=gy-50-hs(i+2)*(gy-110)+Math.sin(t*3+i)*10;ctx.save();ctx.translate(x,y);ctx.rotate(t*2+i);ctx.fillRect(-6,-8,12,16);ctx.restore()}}
  else if(m==='sign'){ctx.fillStyle=th.far;for(let i=0;i<3;i++){const x=((i*170+60-sx*.12)%(W+200)+W+200)%(W+200)-60;ctx.fillRect(x,gy-80,4,80);ctx.fillRect(x-22,gy-84,48,16);ctx.fillStyle=rgba(ac,.5);ctx.fillRect(x-18,gy-80,40,3);ctx.fillStyle=th.far;ctx.strokeStyle=rgba(ac,.3);ctx.lineWidth=2;ctx.strokeRect(x+60,gy-70,26,70);ctx.fillStyle=th.far}}
  else if(m==='icon'){for(let i=0;i<n(9);i++){const r=hs(i+5),x=((r*W*1.2-sx*.1)%(W+60)+W+60)%(W+60)-30,y=40+hs(i+8)*(gy-130)+Math.sin(t+i*2)*8,s=14+r*14;ctx.fillStyle=rgba(ac,.12+.1*r);ctx.fillRect(x,y,s,s);ctx.strokeStyle=rgba(ac,.45);ctx.lineWidth=1.5;ctx.strokeRect(x,y,s,s);ctx.fillStyle=rgba(ac,.5);ctx.fillRect(x+s*.3,y+s*.3,s*.4,s*.4)}}
  else if(m==='rail'||m==='brok'){ctx.strokeStyle=rgba(ac,.28);ctx.lineWidth=3;for(let i=0;i<3;i++){const x=((i*150+40-sx*.1)%(W+120)+W+120)%(W+120)-20;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,m==='brok'?gy-60-(i%2)*40:gy);ctx.moveTo(x+14,0);ctx.lineTo(x+14,m==='brok'?gy-60-(i%2)*40:gy);ctx.stroke();
    const cy=m==='brok'?gy-70:(t*30+i*90)%(gy-30);ctx.fillStyle=rgba(ac,.35);ctx.fillRect(x-4,cy,22,26);if(m==='brok'&&Math.sin(t*9+i*3)>.6){glowDot(ctx,x+7,gy-62-(i%2)*40,18,'#ffe08a',.8)}}}
  else if(m==='door'){const x=W*.74,y=gy-96;glowDot(ctx,x+20,y+48,110,ac,.2);ctx.fillStyle='#0a0f1c';ctx.fillRect(x,y,40,96);ctx.strokeStyle=rgba(ac,.8);ctx.lineWidth=2.5;ctx.strokeRect(x,y,40,96);ctx.fillStyle=rgba(ac,.12+.1*Math.sin(t*1.4));ctx.fillRect(x+3,y+3,34,90)}
  else if(m==='push'){for(let i=0;i<4;i++){const x=((i*120-sx*.1)%(W+100)+W+100)%(W+100)-40;for(let r=0;r<4;r++){const up=Math.floor((t*.8+i*1.7))%5,on=r<=up%5;ctx.fillStyle=rgba(ac,on?.28:.07);ctx.fillRect(x,gy-26-r*28,44,22);ctx.strokeStyle=rgba(ac,on?.5:.12);ctx.lineWidth=1.5;ctx.strokeRect(x,gy-26-r*28,44,22)}}}
  else if(m==='scaf'){ctx.strokeStyle=rgba('#ffd36e',.22);ctx.lineWidth=2;for(let i=0;i<4;i++){const x=((i*110-sx*.1)%(W+100)+W+100)%(W+100)-40;ctx.strokeRect(x,gy-150,60,150);for(let r=1;r<4;r++){ctx.beginPath();ctx.moveTo(x,gy-r*38);ctx.lineTo(x+60,gy-r*38-38);ctx.stroke()}}
   for(let i=0;i<n(10);i++){const r=hs(i+t*3|0);glowDot(ctx,((i*71+t*20)%W),gy-30-r*90,6,'#ffd36e',.9)}}
  else if(m==='gate'){const x=W*.72,w=110,h=150;ctx.fillStyle=th.far;ctx.fillRect(x-w/2,gy-h,18,h);ctx.fillRect(x+w/2-18,gy-h,18,h);ctx.beginPath();ctx.arc(x,gy-h,w/2,Math.PI,0);ctx.fill();const g=ctx.createLinearGradient(0,gy-h-20,0,gy);g.addColorStop(0,rgba(ac,.55));g.addColorStop(1,rgba(ac,.05));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,gy-h,w/2-18,Math.PI,0);ctx.lineTo(x+w/2-18,gy);ctx.lineTo(x-w/2+18,gy);ctx.closePath();ctx.fill()}
  else if(m==='house'){const cs=['#ffd166','#7ef0a8','#7ab8ff'];for(let i=0;i<3;i++){const x=((i*140+40-sx*.08)%(W+160)+W+160)%(W+160)-40,y=gy-120-i*18+Math.sin(t*.9+i)*6;ctx.fillStyle=th.far;ctx.fillRect(x,y,34,gy-y-40);ctx.fillStyle=rgba(cs[i],.7);ctx.fillRect(x-8,y,50,6);ctx.fillStyle=rgba(cs[i],.25);ctx.fillRect(x+9,y+16,16,24);glowDot(ctx,x+17,y+3,24,cs[i],.4)}}
  else if(m==='nest'){const cx=W*.68,cy=gy-96;for(let i=0;i<6;i++){const s=(150-i*22)*(1+.04*Math.sin(t*.8+i)),a=t*.15*(i%2?1:-1);ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.strokeStyle=rgba(ac,.5-i*.07);ctx.lineWidth=2;ctx.strokeRect(-s/2,-s/2,s,s);ctx.restore()}}
  else if(m==='wght'){ctx.strokeStyle=rgba(ac,.3);ctx.lineWidth=2;for(let i=0;i<4;i++){const x=((i*115+20-sx*.1)%(W+100)+W+100)%(W+100)-30,l=60+hs(i)*50,sw=Math.sin(t*1.1+i)*8;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+sw,l);ctx.stroke();ctx.fillStyle=rgba(ac,.3);ctx.fillRect(x+sw-16,l,32,26);ctx.strokeRect(x+sw-16,l,32,26)}}
 }
 /* фон уровня: небо, звёзды, свечение горизонта, два слоя силуэтов, мотив, дымка, пылинки, виньетка */
 function bg(ctx,W,H,gy,sx,t,th,q){
  const g=ctx.createLinearGradient(0,0,0,gy);g.addColorStop(0,th.top);g.addColorStop(1,th.bot);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const night=th.i>=5||th.i===8;
  for(let i=0;i<Math.round(28*q);i++){const x=hs(i+1)*W,y=hs(i+77)*(gy*.7);ctx.fillStyle=rgba('#ffffff',(night?.5:.22)*(.5+.5*Math.sin(t*1.5+i)));ctx.fillRect(x,y,i%4===0?2:1,i%4===0?2:1)}
  glowDot(ctx,W*.5,gy,W*.7,th.ac,.12);
  skyline(ctx,W,gy,sx,.05,3,th.far,50,150,70,th.act,th.act?th.ac:null,t);
  motif(ctx,th.m,W,gy,sx,t,th,q,th.i+1);
  skyline(ctx,W,gy,sx,.14,11,th.near,28,90,56,th.act,null,t);
  const m=ctx.createLinearGradient(0,gy-60,0,gy);m.addColorStop(0,rgba(th.ac,0));m.addColorStop(1,rgba(th.ac,.16));ctx.fillStyle=m;ctx.fillRect(0,gy-60,W,60);
  for(let i=0;i<Math.round(18*q);i++){const r=hs(i+500),x=((r*W-sx*(.25+r*.4)-t*8)%(W+20)+W+20)%(W+20)-10,y=hs(i+90)*gy+Math.sin(t*.7+i)*6;ctx.fillStyle=rgba(th.ac,.16+.2*r);ctx.fillRect(x,y,1.6,1.6)}
  const v=ctx.createRadialGradient(W/2,H*.45,Math.min(W,H)*.35,W/2,H*.5,Math.max(W,H)*.78);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H)}
 /* пустота ям и земля со светящимся краем и «схемой» */
 function voidFill(ctx,W,H,gy,th,t){const g=ctx.createLinearGradient(0,gy,0,H);g.addColorStop(0,rgba(th.ac,.28));g.addColorStop(.35,'#05060c');g.addColorStop(1,'#020208');ctx.fillStyle=g;ctx.fillRect(0,gy,W,H-gy+4);ctx.fillStyle=rgba(th.ac,.5+.2*Math.sin(t*3));ctx.fillRect(0,gy+1,W,2)}
 function seg(ctx,a,b,gy,H,sx,th,t){
  if(b<=a)return;const g=ctx.createLinearGradient(0,gy,0,H);g.addColorStop(0,rgba(th.ac,.22));g.addColorStop(.18,th.near);g.addColorStop(1,'#04050a');ctx.fillStyle=g;ctx.fillRect(a,gy,b-a,H-gy+4);
  ctx.fillStyle=rgba(th.ac,.16);ctx.fillRect(a,gy-3,b-a,6);ctx.fillStyle=th.ac;ctx.fillRect(a,gy,b-a,2);
  ctx.fillStyle=rgba(th.ac,.28);for(let x=Math.ceil((a+sx)/48)*48-sx;x<b;x+=48){ctx.fillRect(x,gy+14,22,2);ctx.fillRect(x+22,gy+14,2,10);ctx.fillRect(x+22,gy+24,14,2);if(((x+sx)/48|0)%3===0)ctx.fillRect(x+34,gy+22,5,5)}
  for(let r=0;r<3;r++){const yy=gy+46+r*34,sp=64+r*20,k=.9-r*.15;ctx.fillStyle=rgba(th.ac,.15-r*.04);for(let x=Math.ceil((a+sx*k)/sp)*sp-sx*k;x<b;x+=sp){ctx.fillRect(x,yy,26,2);ctx.fillRect(x+26,yy,2,12)}}
  ctx.fillStyle=rgba(th.ac,.5);ctx.fillRect(a,gy+1,2,10);ctx.fillRect(b-2,gy+1,2,10)}
 /* предметы; true = нарисовано */
 const hex=(ctx,r)=>{ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/6;ctx[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath()};
 function item(ctx,it,x,y,gy,t,H,th){
  const k=it.t;
  if(k==='byte'||k==='gold'){const gd=k==='gold',r=gd?10:8,c1=gd?'#ffe27a':'#8ff6ff',c2=gd?'#d88a12':'#1f9ed0';glowDot(ctx,x,y,gd?26:19,gd?'#ffd44a':'#4fe3ff',.55);
   ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2.4+it.x)*.28);const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;hex(ctx,r);ctx.fill();ctx.fillStyle='rgba(255,255,255,.55)';hex(ctx,r*.45);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.2;hex(ctx,r);ctx.stroke();
   if(gd){ctx.strokeStyle='rgba(255,226,122,'+(.35+.3*Math.sin(t*5))+')';ctx.lineWidth=1.5;hex(ctx,r+5+Math.sin(t*5)*1.5);ctx.stroke()}ctx.restore();return true}
  if(k==='bug'){const h=it.big?30:22,w=it.big?13:11,cx=x,j=Math.sin(t*14+it.x)*1;glowDot(ctx,cx,gy-h*.4,h*1.1,'#ff3b6b',.4);
   ctx.save();ctx.translate(cx+j,gy);const g=ctx.createLinearGradient(0,-h,0,0);g.addColorStop(0,'#ff6f8f');g.addColorStop(1,'#a3153f');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-w,0);ctx.lineTo(-w*.55,-h*.45);ctx.lineTo(-w*.3,-h*.4);ctx.lineTo(0,-h);ctx.lineTo(w*.3,-h*.4);ctx.lineTo(w*.55,-h*.45);ctx.lineTo(w,0);ctx.closePath();ctx.fill();
   ctx.fillStyle='#fff';ctx.fillRect(-w*.42,-h*.36,w*.3,w*.34);ctx.fillRect(w*.12,-h*.36,w*.3,w*.34);ctx.fillStyle='#1a0510';ctx.fillRect(-w*.3+j,-h*.3,w*.12,w*.2);ctx.fillRect(w*.24+j,-h*.3,w*.12,w*.2);
   ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(-w*.7,-3,w*1.4,2);ctx.restore();return true}
  if(k==='door'){const dh=64,pulse=.5+.5*Math.sin(t*3);glowDot(ctx,x,gy-dh/2,80,'#66f0ff',.25+.15*pulse);ctx.save();ctx.translate(x,gy);const g=ctx.createLinearGradient(0,-dh,0,0);g.addColorStop(0,'rgba(90,220,255,.55)');g.addColorStop(1,'rgba(90,120,255,.15)');ctx.fillStyle=g;ctx.fillRect(-24,-dh,48,dh);ctx.strokeStyle='#8ff6ff';ctx.lineWidth=3;ctx.strokeRect(-24,-dh,48,dh);
   ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(0,-dh/2,6+i*6+((t*14)%6),0,TAU);ctx.stroke()}
   ctx.fillStyle='#fff';ctx.globalAlpha=.6+.35*Math.sin(t*4);ctx.font='700 15px monospace';ctx.textAlign='center';ctx.fillText('</>',0,-dh/2+5);ctx.restore();return true}
  if(k==='proj'){glowDot(ctx,x,y,20,'#ff3b6b',.55);ctx.save();ctx.translate(x,y);ctx.rotate(t*5);ctx.fillStyle='#ff5a7a';ctx.fillRect(-8,-8,16,16);ctx.fillStyle='#ffd0da';ctx.fillRect(-4,-4,8,8);ctx.restore();return true}
  if(k==='fix'){const yy=y+Math.sin(t*4+it.x)*3;glowDot(ctx,x,yy,26,'#4cff8a',.5);ctx.save();ctx.translate(x,yy);const g=ctx.createLinearGradient(-13,-13,13,13);g.addColorStop(0,'#7dffa8');g.addColorStop(1,'#1fae55');ctx.fillStyle=g;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-13,-13,26,26,7);else ctx.rect(-13,-13,26,26);ctx.fill();ctx.fillStyle='#06240f';ctx.fillRect(-7,-2,14,4);ctx.fillRect(-2,-7,4,14);ctx.restore();return true}
  if(k==='shield'||k==='magnet'){const yy=y+Math.sin(t*3)*3,c=k==='shield'?'#7ab8ff':'#ff8fd0';glowDot(ctx,x,yy,28,c,.45);ctx.save();ctx.translate(x,yy);const g=ctx.createRadialGradient(-4,-5,2,0,0,16);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,rgba(c,.18));ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,15,0,TAU);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';
   if(k==='shield'){ctx.beginPath();ctx.moveTo(-7,-6);ctx.lineTo(7,-6);ctx.lineTo(7,2);ctx.lineTo(0,9);ctx.lineTo(-7,2);ctx.closePath();ctx.fill()}else{ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,6,Math.PI,0,true);ctx.moveTo(-6,0);ctx.lineTo(-6,6);ctx.moveTo(6,0);ctx.lineTo(6,6);ctx.stroke()}ctx.restore();return true}
  if(k==='zone'){const w=it.w,warn=it.age<=1.2;ctx.save();ctx.globalAlpha=warn?.2+.2*Math.abs(Math.sin(it.age*10)):.8;const g=ctx.createLinearGradient(0,gy-3,0,H);g.addColorStop(0,'#ff3b6b');g.addColorStop(1,'#5a0a22');ctx.fillStyle=g;ctx.fillRect(x-w/2,gy-3,w,H-gy+3);ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=2;for(let i=-H;i<w;i+=16){ctx.beginPath();ctx.moveTo(x-w/2+i,gy);ctx.lineTo(x-w/2+i+H,gy+H);ctx.stroke()}
   if(warn){ctx.globalAlpha=.95;ctx.strokeStyle='#ff6f8f';ctx.lineWidth=2;ctx.strokeRect(x-w/2,gy-3,w,10)}ctx.restore();return true}
  return false}
 /* тень героя на земле: меньше и бледнее, когда он в прыжке */
 function shadow(ctx,x,gy,py,ph){const h=Math.max(0,gy-(py+ph)),s=Math.max(.35,1-h/160);ctx.fillStyle='rgba(0,0,0,'+(.38*s)+')';ctx.beginPath();ctx.ellipse(x,gy+3,15*s,3.5*s,0,0,TAU);ctx.fill()}
 /* частицы: пыль от бега, всплеск при приземлении, искры при сборе байта */
 function parts(ctx,S,t,th,q,E){
  const a=S._art||(S._art={p:[],lt:S.t,on:true,by:S.bytes,rt:0});const dt=Math.max(0,Math.min(.1,S.t-a.lt));a.lt=S.t;const p=S.p,x=E.PX,fy=p.y+E.PH;
  if(p.on&&!a.on&&a.p.length<40*q)for(let i=0;i<7;i++)a.p.push({x:x+(i-3)*3,y:fy,vx:(i-3)*22,vy:-30-Math.random()*26,l:.45,c:th.ac});
  a.on=p.on;a.rt-=dt;if(p.on&&a.rt<=0&&a.p.length<40*q){a.rt=.07/Math.max(.4,q);a.p.push({x:x-6,y:fy-1,vx:-50-Math.random()*40,vy:-10-Math.random()*16,l:.3,c:th.ac})}
  if(S.bytes>a.by&&a.p.length<44*q)for(let i=0;i<8;i++){const g=i/8*TAU;a.p.push({x:x+10,y:p.y+8,vx:Math.cos(g)*70,vy:Math.sin(g)*70,l:.4,c:'#8ff6ff'})}a.by=S.bytes;
  for(const o of a.p){o.l-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vy+=160*dt;if(o.l>0){ctx.fillStyle=rgba(o.c,Math.min(.8,o.l*2.4));ctx.fillRect(o.x-1.5,o.y-1.5,3,3)}}a.p=a.p.filter(o=>o.l>0)}
 /* интерфейс уровня: стеклянная панель счёта, плашка уровня, сердца, полоса пути с огоньком */
 const heart=(ctx,x,y,s)=>{ctx.beginPath();ctx.moveTo(x,y+s*.9);ctx.bezierCurveTo(x-s*1.3,y+s*.1,x-s*.7,y-s*.8,x,y-s*.3);ctx.bezierCurveTo(x+s*.7,y-s*.8,x+s*1.3,y+s*.1,x,y+s*.9);ctx.closePath()};
 const pill=(ctx,x,y,w,h,r)=>{ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h)};
 function hud(ctx,S,W,H,t,o){
  const th=o.th,ac=th.ac,f=o.f;ctx.save();
  pill(ctx,10,12,118,o.hearts?70:46,14);ctx.fillStyle='rgba(8,12,28,.58)';ctx.fill();ctx.strokeStyle=rgba(ac,.4);ctx.lineWidth=1;ctx.stroke();
  ctx.textAlign='left';ctx.fillStyle='#fff';ctx.font='700 20px '+o.font;ctx.fillText(String(S.score),22,36);
  ctx.save();ctx.translate(28,54);hex(ctx,6);ctx.fillStyle='#4fe3ff';ctx.fill();ctx.restore();ctx.fillStyle='#bfefff';ctx.font='600 13px '+o.font;ctx.fillText(String(S.bytes),40,58);
  if(S.combo>=10){pill(ctx,76,46,44,18,9);ctx.fillStyle=rgba('#ffd44a',.9);ctx.fill();ctx.fillStyle='#3a2600';ctx.font='800 12px '+o.font;ctx.textAlign='center';ctx.fillText('×2',98,59);ctx.textAlign='left'}
  if(S.maxHearts){for(let i=0;i<S.maxHearts;i++){const x=24+i*18,y=71;heart(ctx,x,y,6.2);if(i<S.hearts){const g=ctx.createLinearGradient(0,y-6,0,y+7);g.addColorStop(0,'#ff8fb0');g.addColorStop(1,'#e0245e');ctx.fillStyle=g;ctx.fill()}else{ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=1.3;ctx.stroke()}}}
  /* плашка уровня сверху по центру */
  const lab=o.label,w=Math.max(84,lab.length*7.2+26),lx=Math.min(W-64-w/2,Math.max(W/2,138+w/2));pill(ctx,lx-w/2,12,w,26,13);ctx.fillStyle='rgba(8,12,28,.58)';ctx.fill();ctx.strokeStyle=rgba(ac,.4);ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='700 12px '+o.font;ctx.fillText(lab,lx,29);
  /* полоса пути */
  if(f>=0){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,0,W,5);const g=ctx.createLinearGradient(0,0,W,0);g.addColorStop(0,rgba(ac,.5));g.addColorStop(1,ac);ctx.fillStyle=g;ctx.fillRect(0,0,W*f,5);glowDot(ctx,W*f,2.5,12,ac,.9);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(W*f,2.5,3,0,TAU);ctx.fill()}
  ctx.restore()}
 /* арена босса 1 («404»: ночная свалка) и босса 2 (башня стека); true = нарисовано, иначе рисует игра */
 function arenaBg(ctx,S,W,H,t){
  const id=S.bid,gy=S.gy;if(id!==1&&id!==2)return false;
  if(id===1){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#071014');g.addColorStop(.6,'#143a3a');g.addColorStop(1,'#0a1a1d');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   glowDot(ctx,W*.78,H*.22,110,'#9fffe6',.32);ctx.fillStyle='#d8fff4';ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(W*.78,H*.22,16,0,TAU);ctx.fill();ctx.globalAlpha=1;
   skyline(ctx,W,gy,t*14,.5,3,'#0f2a2b',60,140,64,0,null,t);skyline(ctx,W,gy,t*30,.5,11,'#0a1c1e',30,90,52,0,null,t);
   for(let i=0;i<7;i++){const x=hs(i+2)*W,y=((t*34+i*83)%(H+20))-10;ctx.fillStyle=rgba('#9fffe6',.18);ctx.font='600 10px monospace';ctx.textAlign='left';ctx.fillText(i%3?'File not found':'404',x%(W-70),y)}
   for(let i=0;i<4;i++){const x=W*(.12+i*.26),fl=.6+.4*Math.sin(t*9+i*5)*(i===2?1:.2);ctx.fillStyle='#16282a';ctx.fillRect(x-2,gy-80,4,80);glowDot(ctx,x,gy-82,26,'#ffd9a0',.45*fl)}}
  else{const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0d0a26');g.addColorStop(.7,'#2a2178');g.addColorStop(1,'#120d3c');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   for(let i=0;i<9;i++){const x=i*(W/8),sw=Math.sin(t*.8+i);ctx.fillStyle=rgba('#a08cff',.08+.05*(i%2));ctx.fillRect(x-10,0,22,H);ctx.fillStyle=rgba('#a08cff',.35);for(let r=0;r<10;r++){const y=((t*50*(1+i%3*.3)+r*70+i*37)%(H+40))-20;ctx.fillRect(x-6,y,12,8)}}
   for(let i=0;i<5;i++){const s=240-i*40,x=W*.5,y=H*.38;ctx.strokeStyle=rgba('#b69cff',.18+i*.03);ctx.lineWidth=2;ctx.save();ctx.translate(x,y);ctx.rotate(t*.1*(i%2?1:-1));ctx.strokeRect(-s/2,-s/2,s,s);ctx.restore()}
   ctx.fillStyle=rgba('#b69cff',.22);ctx.font='600 10px monospace';ctx.textAlign='left';const fn=['push()','pop()','call()','return','main()','stack'];for(let i=0;i<6;i++)ctx.fillText(fn[i],8,((t*24+i*90)%(H+20)))}
  const v=ctx.createRadialGradient(W/2,H*.45,Math.min(W,H)*.3,W/2,H*.5,Math.max(W,H)*.8);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.5)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);return true}
 /* платформа арены: градиентное тело (верхнюю кромку по-прежнему красит game.js) */
 function plat(ctx,x,y,w,h){const g=ctx.createLinearGradient(0,y,0,y+Math.min(h,60));g.addColorStop(0,'#2a3566');g.addColorStop(1,'#10152c');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(x,y+3,w,2)}
 return{theme,bg,voidFill,seg,item,shadow,parts,hud,arenaBg,plat,TH}})();
