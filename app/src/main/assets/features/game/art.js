/* ===== ГРАФИКА «БАЙТ-ПРЫГУНА» (0.7.1): строгая палитра чёрный / серый / белый, красный только для опасности и акцентов =====
   Всё рисуется кодом на canvas, картинок нет, сеть не нужна. Фонов четыре, а не по одному на уровень: каждые 5 уровней сцена меняется
   (1–5 «Свалка», 6–10 «Руины», 11–15 «Башни», 16–20 «Тьма»; на уровнях 10 и 20 бои с боссами). Уровни 21+ берут те же сцены по кругу.
   Внутри сцены уровни различаются расстановкой силуэтов (зерно от номера уровня). Слои сдвигаются от S.x (параллакс), число частиц
   растёт и падает вместе с GameCore.perf.q. Игровая логика (хитбоксы, физика) здесь не меняется: только то, как нарисовано. */
const GameArt=(()=>{
 const TAU=6.2832;
 const hs=n=>{n=Math.imul(n^(n>>>15),2246822519);n=Math.imul(n^(n>>>13),3266489917);return((n^(n>>>16))>>>0)/4294967296};
 /* единая палитра игры: другие файлы берут цвета отсюда (GameArt.C) */
 const C={ink:'#060910',k1:'#080c17',k2:'#0d1321',k3:'#121a2c',k4:'#1c273f',g1:'#283652',g2:'#42506c',g3:'#728099',g4:'#a2aec3',w:'#ebf1f8',red:'#e0262b',red2:'#8f1519',red3:'#3a0709',gold:'#f5b82e',gold2:'#8a5a12',green:'#37d67a',blue:'#3d7bff',navy:'#141d42'};
 /* сцены: [верх неба, низ неба, свет, дальний слой, ближний слой, мотив, название] */
 const SC=[
  ['#0a0f14','#1f2d2c','#dfe8e4','#101a1c','#081012','ruins','Свалка'],
  ['#0a1016','#2a3a38','#dfe8e4','#131f22','#091416','city','Ночная свалка'],
  ['#060a16','#121b3c','#dfe8fb','#0b1330','#060b1c','rings','Башни'],
  ['#05060c','#15182a','#e0262b','#0c0e1c','#06070e','dark','Тьма'],
  ['#070c1e','#16224a','#dfe8fb','#0e1a3a','#070e24','stack','Стек'],
  ['#05070f','#0f1530','#e0262b','#0a0e20','#050812','stack','Стек: подвал'],
  ['#0b1216','#2b3f46','#dff4f2','#14242b','#0a1418','mirror','Витрина'],
  ['#061016','#143a44','#9ff2ea','#0d2630','#071a20','mirror','Отражение'],
  ['#03060e','#0a1a36','#6fd8ff','#071026','#040a18','fiber','Порт 80'],
  ['#020409','#0c1426','#ffd27a','#060c1c','#03070f','fiber','Рельсы']];
 const NAMES=['Пробуждение','Первая память','Архивариус','Потеряшка','Мусорный ветер','Дверь без таблички','Потерянные иконки','Ржавый лифт','Тихая дверь','Страж',
  'Нижний слой','Push','Мастер Правок','Подвал стека','Первый Шлюз','Спор Домов','Рекурсия','Сломанный лифт','Тяжёлая память','Колосс','Витрина','Копия копии','Горячее и холодное','Лавка забытых вещей','Эхо шагов','Первый спор','Инвалидация','Гость из Дома','Свежее имя','Босс','Порт 80','Рукопожатие','Потерянные пакеты','Шторм задержек','Мост наружу','Вопрос из-за экрана','Обрыв','Повторы','Тихая линия','Босс'];
 /* TH[i] = [верх, низ, свет, дальний, ближний, мотив, название]: 20 уровней, 4 сцены */
 /* блоки по 5 уровней → сцена. Главы: 1–10 свалка (сцены 0,1), 11–20 стек (4,5), 21–30 зеркала (6,7), 31–40 оптоволокно (8,9) */
 const SCBLK=[0,1,4,5,6,7,8,9];
 const TH=NAMES.map((n,i)=>{const s=SC[SCBLK[Math.floor(i/5)]];return[s[0],s[1],s[2],s[3],s[4],s[5],n]});
 const idx=(mode,L)=>mode==='endless'?11:Math.max(0,((L|0)-1)%40);
 /* alt: высота камеры 0..1. Уровни 1–10 — подъём от свалки внизу (0) к воздуху над ней (1); остальные уровни и арены — 0 */
 const theme=(mode,L)=>{const i=idx(mode,L),t=TH[i],sc=SCBLK[Math.floor(i/5)],alt=mode==='level'&&L>=1&&L<=10?((L|0)-1)/9:0;return{i,sc,seed:(L|0)%5+sc*7,top:t[0],bot:t[1],ac:t[2],far:t[3],near:t[4],m:t[5],name:t[6],act:sc>1?1:0,alt,tex:Math.floor(i/10),red:sc===3||sc===5}};
 const mixHex=(a,b,k)=>{const p=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];const A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('')};
 const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')'};
 /* ---- кэш: статичное рисуется один раз в невидимый холст, потом одной командой drawImage (раньше фон пересчитывался каждый кадр) ---- */
 const cache=new Map();
 const hasDoc=()=>typeof document!=='undefined';
 const kOf=ctx=>{const m=ctx.getTransform&&ctx.getTransform();return m&&m.a>0?Math.round(m.a*50)/50:1};
 function layer(key,w,h,k,paint){
  const kk=key+'|'+w+'x'+h+'@'+k;let c=cache.get(kk);
  if(!c){c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));const x=c.getContext('2d');x.scale(k,k);paint(x);cache.set(kk,c);if(cache.size>60)cache.delete(cache.keys().next().value)}
  return c}
 /* рисует кэшированный слой в (x,y); paint рисует в локальных координатах 0..w, 0..h; без document (тесты в node) рисует напрямую */
 function blit(ctx,key,x,y,w,h,paint){
  if(!hasDoc()){if(paint){ctx.save();ctx.translate(x,y);paint(ctx);ctx.restore()}return}
  const c=paint?layer(key,w,h,kOf(ctx),paint):cache.get(key+'|'+w+'x'+h+'@'+kOf(ctx));if(c)ctx.drawImage(c,x,y,w,h)}
 const blobs={};
 function blob(c){let b=blobs[c];if(!b){b=document.createElement('canvas');b.width=b.height=64;const x=b.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,rgba(c,1));g.addColorStop(1,rgba(c,0));x.fillStyle=g;x.fillRect(0,0,64,64);blobs[c]=b}return b}
 /* мягкое пятно света: готовый спрайт с прозрачностью вместо нового градиента на каждый вызов */
 function glowDot(ctx,x,y,r,c,a){
  if(!hasDoc()){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);return}
  const o=ctx.globalAlpha;ctx.globalAlpha=o*a;ctx.drawImage(blob(c),x-r,y-r,r*2,r*2);ctx.globalAlpha=o}
 /* скошенная рамка (углы срезаны), как у панелей интерфейса */
 function cham(ctx,x,y,w,h,c){c=Math.min(c,w/2,h/2);ctx.beginPath();ctx.moveTo(x+c,y);ctx.lineTo(x+w-c,y);ctx.lineTo(x+w,y+c);ctx.lineTo(x+w,y+h-c);ctx.lineTo(x+w-c,y+h);ctx.lineTo(x+c,y+h);ctx.lineTo(x,y+h-c);ctx.lineTo(x,y+c);ctx.closePath()}
 /* полоса разрушенных башен рисуется один раз в длинный холст ровно на N башен и склеивается по кругу: прокрутка без швов.
    Маяки (красные огни) пульсируют, поэтому они вынесены и рисуются каждый кадр отдельно (их единицы). */
 function paintTowers(x,per,N,seed,color,hMin,hMax,win,beacon,hh,bl){
  const gy=hh-2;x.fillStyle=color;
  for(let i=-2;i<N+2;i++){
   const gi=((i%N)+N)%N,r=hs(gi+seed*31),w=per*(.6+r*.85),h=hMin+hs(gi*7+seed)*(hMax-hMin),xx=i*per;
   x.fillStyle=color;x.beginPath();x.moveTo(xx,gy+2);
   const n=3+(r>.5?1:0);for(let j=0;j<=n;j++){const q=h*(j===0?.82+.18*hs(gi+j):.55+.45*hs(gi*3+j+seed));x.lineTo(xx+w*j/n,gy-q)}
   x.lineTo(xx+w,gy+2);x.closePath();x.fill();
   if(r>.72)x.fillRect(xx+w*.45,gy-h-16,2,16);
   if(win>0&&w>per*.8){x.fillStyle=rgba('#f1f2f4',win*.75);for(let wy=gy-h*.7;wy<gy-8;wy+=12)for(let wx=xx+6;wx<xx+w-8;wx+=10)if(hs(gi*131+(wy|0)*3+(wx|0))>.78)x.fillRect(wx,wy,3,4)}
   if(beacon&&r>.8&&i>=0&&i<N)bl.push([xx+w*.45+1,gy-h-16,gi])}}
 const strips={};
 function towers(ctx,W,gy,sx,k,seed,color,hMin,hMax,per,win,beacon,t){
  const N=Math.max(14,Math.ceil((W+per*2)/per)),span=N*per,hh=Math.ceil(hMax+30),off=((sx*k)%span+span)%span,key='tw|'+seed+color+per+hMin+hMax+win+beacon+'|'+N;
  const bl=strips[key]||(strips[key]=[]);
  if(!hasDoc()){ctx.save();ctx.translate(-off,gy-hh+2);paintTowers(ctx,per,N,seed,color,hMin,hMax,win,beacon,hh,[]);ctx.translate(span,0);paintTowers(ctx,per,N,seed,color,hMin,hMax,win,beacon,hh,[]);ctx.restore();return}
  if(!cache.has(key+'|'+span+'x'+hh+'@'+kOf(ctx))){bl.length=0}
  const c=layer(key,span,hh,kOf(ctx),x=>{bl.length=0;paintTowers(x,per,N,seed,color,hMin,hMax,win,beacon,hh,bl)});
  const y0=gy-hh+2;ctx.drawImage(c,-off,y0,span,hh);if(span-off<W)ctx.drawImage(c,span-off,y0,span,hh);
  for(const b of bl){for(let rep=0;rep<2;rep++){const bx=b[0]-off+rep*span;if(bx<-24||bx>W+24)continue;const pul=.35+.65*Math.max(0,Math.sin(t*2+b[2]));glowDot(ctx,bx,y0+b[1],16,C.red,.55*pul);ctx.fillStyle=rgba('#ff5a5e',.5+.5*pul);ctx.fillRect(bx-2,y0+b[1]-2,4,4)}}}
 /* огромное кольцо вдали: две тонкие окружности (штриховое вращающееся кольцо убрано: оно было самой дорогой частью фона и почти не видно) */
 function ring(ctx,cx,cy,r,a,t,w){
  ctx.save();ctx.strokeStyle=rgba('#f1f2f4',a);ctx.lineWidth=w||8;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
  ctx.lineWidth=1.5;ctx.strokeStyle=rgba('#f1f2f4',a*1.6);ctx.beginPath();ctx.arc(cx,cy,r-12,0,TAU);ctx.stroke();ctx.restore()}
 /* полоса тумана: одна плитка шириной W (градиент по вертикали и три мягких пятна) в кэше, плывёт как картинка */
 function fog(ctx,W,y0,h,a,t,ph){
  const dx=((t*9+ph*130)%W+W)%W;
  blit(ctx,'fog|'+a+'|'+ph%3,-dx,y0,W,h,x=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(150,152,160,0)');g.addColorStop(.5,'rgba(150,152,160,'+a+')');g.addColorStop(1,'rgba(150,152,160,0)');x.fillStyle=g;x.fillRect(0,0,W,h);
   for(let i=0;i<3;i++){const px=(i*W/3+ph*40)%W;for(const o of[-W,0,W])glowDot(x,px+o,h*.5,110,'#9a9ca3',a*.8)}});
  blit(ctx,'fog|'+a+'|'+ph%3,W-dx,y0,W,h,null)}
 /* фон уровня: небо и свет в кэше, слои руин (кэш), туман, пылинки; сверху один кэшированный слой «развёртки + виньетка» */
 function bg(ctx,W,H,gy,sx,t,th,q){
  const sc=th.sc,red=th.red,sd=th.seed,al=th.alt||0;gy=Math.round(gy);
  /* при подъёме небо синеет к ночному (#070b18 → #141d42), а свалка уходит вниз, под камеру */
  const top=al?mixHex(th.top,'#070b18',al):th.top,bot=al?mixHex(th.bot,'#141d42',al):th.bot,gA=gy+al*H*.35;
  blit(ctx,'back|'+sc+top+bot,0,0,W,H,x=>{const g=x.createLinearGradient(0,0,0,gy);g.addColorStop(0,top);g.addColorStop(1,bot);x.fillStyle=g;x.fillRect(0,0,W,H);
   glowDot(x,W*.55,gy*.62,W*.9,red?'#e0262b':'#3d7bff',red?.07:.09);
   /* вертикальные световые колонки и фоновый код (статичны, поэтому в кэше слоя) */
   for(let i=0;i<5;i++){const cxl=hs(i+sd*3)*W,gw=18+hs(i*9+sd)*30;const cg=x.createLinearGradient(cxl-gw,0,cxl+gw,0);cg.addColorStop(0,'rgba(90,140,255,0)');cg.addColorStop(.5,'rgba(90,140,255,.07)');cg.addColorStop(1,'rgba(90,140,255,0)');x.fillStyle=cg;x.fillRect(cxl-gw,0,gw*2,gy)}
   x.font='500 9px monospace';x.textAlign='left';const CL=['code {','  echo()','  if (ok) {','  return;','}','  stack.push()','/* error */','  load(0x404)'];
   for(let i=0;i<22;i++){x.fillStyle=i%5===0?'rgba(224,38,43,.09)':'rgba(120,160,230,'+(.05+hs(i+sd*5)*.07).toFixed(3)+')';x.fillText(CL[(i+sd)%CL.length],hs(i*3+sd)*W,hs(i*7+sd*2)*gy)}
   if(red){const h=x.createLinearGradient(0,gy-170,0,gy);h.addColorStop(0,'rgba(224,38,43,0)');h.addColorStop(1,'rgba(224,38,43,.22)');x.fillStyle=h;x.fillRect(0,gy-170,W,170)}});
  if(sc>=4)newMid(ctx,W,H,gy,gA,sx,t,th,sd);else{
  if(sc===0||sc===2||sc===3)ring(ctx,W*.58+Math.sin(sx*.0015)*18,gy*.5,sc===2?gy*.46:gy*.38,sc===3?.05:.07,t,sc===2?10:7);
  if(sc===2){ring(ctx,W*.22,gy*.32,gy*.2,.045,-t,5);ctx.fillStyle=rgba('#f1f2f4',.035);for(let i=0;i<4;i++)ctx.fillRect(W*(.1+i*.25)-6,0,12,gy)}
  towers(ctx,W,gA,sx,.04,3+sd,th.far,60,sc===2?230:170,sc===2?46:72,sc===1?.16:0,sc===1||red,t);
  errPops(ctx,W,gy,sx,t,sd,3+Math.round(al*3));
  fog(ctx,W,gy-130,120,.1,t,sd);
  towers(ctx,W,gA,sx,.09,11+sd,sc===2?'#101013':th.near,34,sc===0?130:100,56,0,false,t);
  if(sc===0||sc===1)dumpExtra(ctx,W,gA,sx,t,sd,sc);
  else if(sc===3)for(let i=0;i<5;i++){const x=((i*86+20-sx*.12)%(W+120)+W+120)%(W+120)-30,h=30+hs(i+sd)*60;ctx.fillStyle=th.near;ctx.beginPath();ctx.moveTo(x,gy+2);ctx.lineTo(x+9,gy-h);ctx.lineTo(x+18,gy+2);ctx.fill()}
  towers(ctx,W,gA,sx,.16,29+sd,th.near,22,70,50,0,false,t);
  fog(ctx,W,gy-56,60,.13,t,sd+2);
  }
  const n=Math.round(16*q),o=ctx.globalAlpha;
  for(let i=0;i<n;i++){const r=hs(i+500),x=((r*W-sx*(.2+r*.35)-t*(5+r*7))%(W+20)+W+20)%(W+20)-10,y=hs(i+90)*gy+Math.sin(t*.6+i)*7,s=1+(i%3);ctx.fillStyle=(red&&i%4===0)?'#e0262b':'#f1f2f4';ctx.globalAlpha=o*((red&&i%4===0)?.45:.1+.25*r);ctx.fillRect(x,y,s,s)}
  ctx.globalAlpha=o;
  blit(ctx,'over',0,0,W,H,x=>{const v=x.createRadialGradient(W/2,H*.45,Math.min(W,H)*.3,W/2,H*.5,Math.max(W,H)*.8);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.6)');x.fillStyle=v;x.fillRect(0,0,W,H)})}
 /* главы 2–4 (уровни 11–40): стек из слоёв блоков, витрина зеркал, оптоволокно и рельсы света. Руин здесь нет */
 function newMid(ctx,W,H,gy,gA,sx,t,th,sd){
  const tx=th.tex,dim=(th.sc===5||th.sc===7||th.sc===9)?.5:1;
  if(tx===1)stackStrip(ctx,W,gA,sx,th.far,.8*dim,sd,false);
  else if(tx===2){towers(ctx,W,gA,sx,.05,21+sd,th.far,60,150,60,0,false,t);
   const a0=ctx.globalAlpha;
   for(let i=0;i<5;i++){const x=((i*W/5-sx*.1+t*2)%W+W)%W;ctx.fillStyle=th.ac;ctx.globalAlpha=.05;ctx.fillRect(x,gy*.18,10,gy*.5);ctx.globalAlpha=.16;ctx.fillRect(x,gy*.18,1,gy*.5)}
   ctx.globalAlpha=a0}
  else{towers(ctx,W,gA,sx,.05,31+sd,th.far,50,130,60,0,false,t);packets(ctx,W,gy,t,sd,th.sc===9);rails(ctx,W,gy,t,th.sc===9)}
  errPops(ctx,W,gy,sx,t,sd,3);
  fog(ctx,W,gy-130,120,.1,t,sd);
  if(tx===1)stackStrip(ctx,W,gA,sx,th.near,dim,sd,true);else towers(ctx,W,gA,sx,.09,11+sd,th.near,34,90,56,0,false,t);
  fog(ctx,W,gy-56,60,.13,t,sd+2);
 }
 /* ряды блоков-слоёв: кэшированная полоса, склеивается по кругу как башни */
 function stackStrip(ctx,W,gy,sx,color,dim,sd,near){
  const G=Math.round(gy),per=near?64:48,N=Math.ceil(W/per)+3,span=N*per,off=((sx*(near?.12:.06))%span+span)%span,key='stk|'+(near?1:0)+color+dim.toFixed(2)+'|'+sd+'|'+N;
  const paint=q=>{q.globalAlpha=dim;for(let i=0;i<N;i++){const r=hs(i*7+sd+(near?50:0)),h=(near?70:110)+r*(near?90:150),x=i*per+(r>.5?2:0),w=per*(near?.84:.7),top=G-h;
    q.fillStyle=color;for(let y=G-6;y>top;y-=near?18:22)q.fillRect(x,y-(near?16:20),w,near?16:20);q.fillStyle='rgba(143,176,255,.14)';q.fillRect(x,top,w,1)}q.globalAlpha=1};
  blit(ctx,key,-off,0,span,G,paint);blit(ctx,key,span-off,0,span,G,paint)}
 /* оптоволокно: световые пакеты по диагонали; рельсы — две линии над землёй */
 function packets(ctx,W,gy,t,sd,gold){
  ctx.lineWidth=2;for(let i=0;i<12;i++){const sp=40+hs(i+sd)*90,x=(W+200)-((t*sp+i*97)%(W+200))-100,y=hs(i*13+sd)*gy*.7+(i%3)*4;
   const g=ctx.createLinearGradient(x,y,x+46,y+10),c=gold&&i%3===0?'245,184,46':'111,216,255';g.addColorStop(0,'rgba('+c+',0)');g.addColorStop(1,'rgba('+c+',.55)');ctx.strokeStyle=g;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+46,y+10);ctx.stroke()}ctx.lineWidth=1}
 function rails(ctx,W,gy,t,gold){const y1=gy-34,y2=gy-26;ctx.lineWidth=1;ctx.strokeStyle='rgba(111,216,255,.22)';ctx.beginPath();ctx.moveTo(0,y1);ctx.lineTo(W,y1);ctx.stroke();
  ctx.strokeStyle=gold?'rgba(245,184,46,.18)':'rgba(111,216,255,.12)';ctx.beginPath();ctx.moveTo(0,y2);ctx.lineTo(W,y2);ctx.stroke();
  ctx.fillStyle=gold?'rgba(245,184,46,.6)':'rgba(111,216,255,.6)';for(let i=0;i<6;i++){const x=((i*97-t*90)%W+W)%W;ctx.fillRect(x,y1-1,8,2)}}
 /* «Свалка» (глава 1 «Корзина», уровни 1–10 по библии): папки-горы, перечёркнутые иконки, падающие строки File not found.
    v=0 — свалка днём, v=1 — ночная свалка (больше тумана, меньше папок) */
 function dumpExtra(ctx,W,gy,sx,t,sd,v){
  const wx=(x,p)=>{const m=W+p*2;return((x%m)+m)%m-p};
  const nF=v?3:4;
  for(let i=0;i<nF;i++){const x=wx(i*(W/nF)+sd*37-sx*(.14+v*.03),80),h=34+hs(i*11+sd+v)*30,w=60+hs(i*5+sd)*34,y=gy-h+4;
   ctx.fillStyle=v?'#0b1517':'#0e1a1c';ctx.fillRect(x,y,w,h);ctx.fillRect(x,y-6,w*.38,6);
   ctx.strokeStyle='rgba(190,214,204,'+(v?.08:.12)+')';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
   ctx.fillStyle='rgba(190,214,204,.06)';ctx.fillRect(x+6,y+8,w-12,2)}
  for(let i=0;i<5;i++){const x=((hs(i*13+sd+v*7)*W-sx*.05)%W+W)%W,y=gy-18-hs(i*3+sd)*40;ctx.strokeStyle='rgba(190,214,204,.12)';ctx.lineWidth=1;ctx.strokeRect(x,y,14,14);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+14,y+14);ctx.moveTo(x+14,y);ctx.lineTo(x,y+14);ctx.stroke()}
  ctx.font='500 9px monospace';ctx.textAlign='left';
  for(let i=0;i<6;i++){const x=(hs(i*17+sd+v)*W+W)%W,y=(t*(18+i*3)+i*71+v*40)%gy;ctx.fillStyle='rgba(190,214,204,'+(.1+hs(i+sd)*.08).toFixed(3)+')';ctx.fillText(i%3?'File not found':'404',x,y)}
 }
 /* пустота ям (опасность: красное свечение снизу) и земля */
 function voidFill(ctx,W,H,gy,th,t){
  gy=Math.round(gy);blit(ctx,'void',0,gy,W,H-gy+4,x=>{const g=x.createLinearGradient(0,0,0,H-gy);g.addColorStop(0,'#050506');g.addColorStop(.55,'#08080a');g.addColorStop(1,'rgba(143,21,25,.55)');x.fillStyle=g;x.fillRect(0,0,W,H-gy+4)});
  ctx.fillStyle=rgba('#e0262b',.35+.15*Math.sin(t*3));ctx.fillRect(0,gy+1,W,2)}
 /* земля: плитка шириной 960 px (кратна шагам швов 96, щелей 64 и 80) лежит в кэше и укладывается по миру; кромки ям рисуются поверх */
 const TILE=960;
 function paintGround(x,Hg,tex){
  if(tex===1){const g=x.createLinearGradient(0,0,0,Hg);g.addColorStop(0,'#24386e');g.addColorStop(.08,'#141f40');g.addColorStop(1,'#050914');x.fillStyle=g;x.fillRect(0,0,TILE,Hg);x.fillStyle='#8fb0ff';x.fillRect(0,0,TILE,2);
   for(let r=0,y=18;y<Hg;r++,y+=18){x.fillStyle='rgba(0,0,0,.45)';x.fillRect(0,y,TILE,2);const off=(r%2)*48;for(let X=off;X<TILE;X+=96){x.fillStyle='rgba(0,0,0,.45)';x.fillRect(X,y,2,18);x.fillStyle='rgba(143,176,255,.07)';x.fillRect(X+2,y+2,1,14)}}return}
  if(tex===2){const g=x.createLinearGradient(0,0,0,Hg);g.addColorStop(0,'#6e8089');g.addColorStop(.05,'#3a4850');g.addColorStop(.35,'#14202a');g.addColorStop(1,'#060b10');x.fillStyle=g;x.fillRect(0,0,TILE,Hg);x.fillStyle='#dff4f2';x.fillRect(0,0,TILE,2);
   x.strokeStyle='rgba(223,244,242,.16)';x.lineWidth=2;for(let X=-40;X<TILE+40;X+=120){x.beginPath();x.moveTo(X,0);x.lineTo(X+60,Math.min(Hg,80));x.stroke()}x.lineWidth=1;for(let y=30;y<Hg;y+=30){x.fillStyle='rgba(159,242,234,.06)';x.fillRect(0,y,TILE,1)}return}
  if(tex===3){const g=x.createLinearGradient(0,0,0,Hg);g.addColorStop(0,'#0a1424');g.addColorStop(.1,'#070d1a');g.addColorStop(1,'#020408');x.fillStyle=g;x.fillRect(0,0,TILE,Hg);x.fillStyle='rgba(111,216,255,.7)';x.fillRect(0,4,TILE,2);x.fillStyle='rgba(111,216,255,.25)';x.fillRect(0,12,TILE,1);for(let X=0;X<TILE;X+=80){x.fillStyle='rgba(245,184,46,.7)';x.fillRect(X+8,6,6,2)}return}
  const g=x.createLinearGradient(0,0,0,Hg);g.addColorStop(0,'#2a3556');g.addColorStop(.06,'#1a2440');g.addColorStop(.3,'#0c1227');g.addColorStop(1,'#04060d');x.fillStyle=g;x.fillRect(0,0,TILE,Hg);
  x.fillStyle='#7f9cd0';x.fillRect(0,0,TILE,2);
  for(let X=0;X<TILE;X+=96){x.fillStyle='rgba(0,0,0,.55)';x.fillRect(X,3,2,40);x.fillStyle='rgba(255,255,255,.06)';x.fillRect(X+2,3,1,40)}
  for(let X=20;X<TILE;X+=64){x.fillStyle='rgba(241,242,244,.16)';x.fillRect(X-3,10,30,7);x.fillStyle='rgba(241,242,244,.85)';x.fillRect(X,12,24,3)}
  for(let r=0,y=34;y<Hg;r++,y+=34){x.fillStyle='rgba(255,255,255,'+Math.max(.012,.06-r*.006)+')';x.fillRect(0,y,TILE,1);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,y+1,TILE,2);
   for(let X=0;X<TILE;X+=80){const q=hs((X/80)*13+r*7);if(q>.5){x.fillStyle='rgba(241,242,244,'+Math.max(.04,.2-r*.02)+')';x.fillRect(X,y+10,18+q*26,2)}if(q<.18){x.fillStyle='rgba(0,0,0,.4)';x.fillRect(X+8,y+3,3,30)}}}}
 function seg(ctx,a,b,gy,H,sx,th,t){
  if(b<=a)return;gy=Math.round(gy);const Hg=Math.ceil(H-gy+4);
  ctx.save();ctx.beginPath();ctx.rect(a,gy,b-a,Hg);ctx.clip();
  for(let X=Math.floor((a+sx)/TILE)*TILE-sx;X<b;X+=TILE)blit(ctx,'ground|'+th.tex,X,gy,TILE,Hg,x=>paintGround(x,Hg,th.tex));
  ctx.restore();
  ctx.fillStyle='#c9ccd1';ctx.fillRect(a,gy,3,9);ctx.fillRect(b-3,gy,3,9)}
 /* предметы; true = нарисовано */
 const crystal=(ctx,r)=>{ctx.beginPath();ctx.moveTo(0,-r*1.25);ctx.lineTo(r*.9,-r*.2);ctx.lineTo(r*.55,r*.95);ctx.lineTo(-r*.55,r*.95);ctx.lineTo(-r*.9,-r*.2);ctx.closePath()};
 function item(ctx,it,x,y,gy,t,H,th){
  const k=it.t;
  if(k==='byte'||k==='gold'){const gd=k==='gold',r=gd?10:8;glowDot(ctx,x,y,gd?32:22,C.gold,gd?.42:.3);
   ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2.4+it.x)*.18);const g=ctx.createLinearGradient(-r,-r*1.25,r,r*.95);g.addColorStop(0,'#fff3c4');g.addColorStop(.45,C.gold);g.addColorStop(1,C.gold2);ctx.fillStyle=g;ctx.beginPath();crystal(ctx,r);ctx.fill();
   ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.moveTo(0,-r*1.25);ctx.lineTo(r*.9,-r*.2);ctx.lineTo(0,r*.1);ctx.lineTo(-r*.9,-r*.2);ctx.closePath();ctx.fill();
   ctx.fillStyle='rgba(60,30,0,.35)';ctx.beginPath();ctx.moveTo(0,r*.1);ctx.lineTo(r*.9,-r*.2);ctx.lineTo(r*.55,r*.95);ctx.lineTo(0,r*.95);ctx.closePath();ctx.fill();
   ctx.beginPath();crystal(ctx,r);ctx.strokeStyle='rgba(255,236,170,.75)';ctx.lineWidth=1;ctx.stroke();
   if(gd){ctx.strokeStyle='rgba(245,184,46,'+(.35+.3*Math.sin(t*5))+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r+7+Math.sin(t*5)*1.5,0,TAU);ctx.stroke()}ctx.restore();return true}
  /* баг: тёмная колючая сфера с красной неоновой обводкой и глитч-частицами */
  if(k==='bug'){const R=it.big?13:10,cy=gy-R-1,j=Math.sin(t*14+it.x)*1;glowDot(ctx,x+j,cy,R*2.4,C.red,.32);
   ctx.save();ctx.translate(x+j,cy);ctx.fillStyle='#0c0e16';ctx.beginPath();for(let i=0;i<8;i++){const a1=i*TAU/8,a2=a1+TAU/16;ctx.lineTo(Math.cos(a1)*(R+5),Math.sin(a1)*(R+5));ctx.lineTo(Math.cos(a2)*(R-1),Math.sin(a2)*(R-1))}ctx.closePath();ctx.fill();
   const g=ctx.createRadialGradient(-R*.3,-R*.35,1,0,0,R);g.addColorStop(0,'#2a2e3c');g.addColorStop(1,'#04050a');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
   ctx.strokeStyle=C.red;ctx.lineWidth=1.5;ctx.stroke();
   ctx.fillStyle=C.red;ctx.fillRect(-R*.45,-R*.2,R*.3,R*.22);ctx.fillRect(R*.15,-R*.2,R*.3,R*.22);
   for(let i=0;i<3;i++){const ph=t*9+i*2.1+it.x,px=Math.sin(ph)*(R+7),py=Math.cos(ph*1.3)*(R+5);ctx.fillStyle=i%2?'#ffffff':C.red;ctx.globalAlpha=.45+.55*Math.abs(Math.sin(ph));ctx.fillRect(px,py,2,2)}
   ctx.globalAlpha=1;ctx.restore();return true}
  if(k==='door'){const dh=64,pulse=.5+.5*Math.sin(t*3);glowDot(ctx,x,gy-dh/2,84,'#ffffff',.12+.1*pulse);ctx.save();ctx.translate(x,gy);
   ctx.fillStyle='#08080a';ctx.fillRect(-24,-dh,48,dh);const g=ctx.createLinearGradient(0,-dh,0,0);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,.04)');ctx.fillStyle=g;ctx.fillRect(-20,-dh+4,40,dh-4);
   ctx.strokeStyle='#f1f2f4';ctx.lineWidth=3;ctx.strokeRect(-24,-dh,48,dh);ctx.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<3;i++)ctx.fillRect(-14+i*12,-dh+8,2,dh-14);
   ctx.fillStyle='#fff';ctx.globalAlpha=.6+.35*Math.sin(t*4);ctx.font='700 14px monospace';ctx.textAlign='center';ctx.fillText('</>',0,-dh/2+5);ctx.restore();return true}
  if(k==='proj'){glowDot(ctx,x,y,22,C.red,.5);ctx.save();ctx.translate(x,y);ctx.rotate(t*5);ctx.fillStyle=C.red;ctx.fillRect(-8,-8,16,16);ctx.fillStyle='#fff';ctx.fillRect(-3,-3,6,6);ctx.restore();return true}
  if(k==='fix'){const yy=y+Math.sin(t*4+it.x)*3;glowDot(ctx,x,yy,28,'#ffffff',.3);ctx.save();ctx.translate(x,yy);cham(ctx,-13,-13,26,26,5);ctx.fillStyle='#0b0b0d';ctx.fill();ctx.strokeStyle='#f1f2f4';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#f1f2f4';ctx.fillRect(-7,-2,14,4);ctx.fillRect(-2,-7,4,14);ctx.restore();return true}
  if(k==='shield'||k==='magnet'){const yy=y+Math.sin(t*3)*3;glowDot(ctx,x,yy,30,'#ffffff',.22);ctx.save();ctx.translate(x,yy);ctx.fillStyle='rgba(8,8,10,.85)';ctx.beginPath();ctx.arc(0,0,15,0,TAU);ctx.fill();ctx.strokeStyle='#f1f2f4';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#f1f2f4';
   if(k==='shield'){ctx.beginPath();ctx.moveTo(-7,-6);ctx.lineTo(7,-6);ctx.lineTo(7,2);ctx.lineTo(0,9);ctx.lineTo(-7,2);ctx.closePath();ctx.fill()}else{ctx.strokeStyle='#f1f2f4';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,6,Math.PI,0,true);ctx.moveTo(-6,0);ctx.lineTo(-6,6);ctx.moveTo(6,0);ctx.lineTo(6,6);ctx.stroke()}ctx.restore();return true}
  if(k==='zone'){const w=it.w,warn=it.age<=1.2;ctx.save();ctx.globalAlpha=warn?.2+.2*Math.abs(Math.sin(it.age*10)):.85;const g=ctx.createLinearGradient(0,gy-3,0,H);g.addColorStop(0,C.red);g.addColorStop(1,C.red3);ctx.fillStyle=g;ctx.fillRect(x-w/2,gy-3,w,H-gy+3);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=2;for(let i=-H;i<w;i+=16){ctx.beginPath();ctx.moveTo(x-w/2+i,gy);ctx.lineTo(x-w/2+i+H,gy+H);ctx.stroke()}
   if(warn){ctx.globalAlpha=.95;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x-w/2,gy-3,w,10)}ctx.restore();return true}
  return false}
 /* тень героя на земле: меньше и бледнее, когда он в прыжке */
 function shadow(ctx,x,gy,py,ph){const h=Math.max(0,gy-(py+ph)),s=Math.max(.35,1-h/160);ctx.fillStyle='rgba(0,0,0,'+(.45*s)+')';ctx.beginPath();ctx.ellipse(x,gy+3,15*s,3.5*s,0,0,TAU);ctx.fill()}
 /* частицы: пыль от бега, всплеск при приземлении, осколки при сборе байта */
 function parts(ctx,S,t,th,q,E){
  const a=S._art||(S._art={p:[],lt:S.t,on:true,by:S.bytes,rt:0});const dt=Math.max(0,Math.min(.1,S.t-a.lt));a.lt=S.t;const p=S.p,x=E.PX,fy=p.y+E.PH;
  if(p.on&&!a.on&&a.p.length<40*q)for(let i=0;i<7;i++)a.p.push({x:x+(i-3)*3,y:fy,vx:(i-3)*22,vy:-30-Math.random()*26,l:.45,c:'#b8bac0'});
  a.on=p.on;a.rt-=dt;if(p.on&&a.rt<=0&&a.p.length<40*q){a.rt=.07/Math.max(.4,q);a.p.push({x:x-6,y:fy-1,vx:-50-Math.random()*40,vy:-10-Math.random()*16,l:.3,c:'#8a8c93'})}
  if(S.bytes>a.by&&a.p.length<44*q)for(let i=0;i<5;i++){const g=-1.3+i*.65;a.p.push({x:x+18,y:p.y+2,vx:Math.cos(g)*60,vy:Math.sin(g)*60,l:.28,c:'#ffffff'})}a.by=S.bytes;
  for(const o of a.p){o.l-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vy+=160*dt;if(o.l>0){ctx.fillStyle=rgba(o.c,Math.min(.85,o.l*2.4));ctx.fillRect(o.x-1.5,o.y-1.5,3,3)}}a.p=a.p.filter(o=>o.l>0)}
 /* ---------- интерфейс: скошенные тёмные панели, белые сердца, кристалл байтов ---------- */
 const heart=(ctx,x,y,s)=>{ctx.beginPath();ctx.moveTo(x,y+s*.9);ctx.bezierCurveTo(x-s*1.3,y+s*.1,x-s*.7,y-s*.8,x,y-s*.3);ctx.bezierCurveTo(x+s*.7,y-s*.8,x+s*1.3,y+s*.1,x,y+s*.9);ctx.closePath()};
 function panel(ctx,x,y,w,h,c){c=c||9;blit(ctx,'panel|'+w+'|'+h+'|'+c,x-2,y-2,w+4,h+4,q=>{cham(q,2,2,w,h,c);q.fillStyle='rgba(8,8,10,.74)';q.fill();q.strokeStyle='rgba(184,186,192,.5)';q.lineWidth=1.2;q.stroke()})}
 function hearts(ctx,x,y,S,t){
  for(let i=0;i<S.maxHearts;i++){const hx=x+i*19,on=i<S.hearts,low=S.hearts===1&&on;heart(ctx,hx,y,6.4);
   if(on){ctx.fillStyle=low?(Math.sin(t*8)>0?C.red:'#a81a1f'):'#f1f2f4';ctx.fill()}else{ctx.strokeStyle='rgba(241,242,244,.3)';ctx.lineWidth=1.3;ctx.stroke()}}}
 function icon(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.fillStyle='#f1f2f4';crystal(ctx,s);ctx.fill();ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.moveTo(0,s*.1);ctx.lineTo(s*.9,-s*.2);ctx.lineTo(s*.55,s*.95);ctx.lineTo(0,s*.95);ctx.closePath();ctx.fill();ctx.restore()}
 /* герой в рамке: основной кадр Искры, если картинка уже загрузилась */
 function face(ctx,x,y,s){if(typeof GameSpark!=='undefined'&&GameSpark.icon&&GameSpark.icon(ctx,x,y,s))return;ctx.fillStyle='#f1f2f4';ctx.fillRect(x-s*.3,y-s*.8,s*.6,s*.6)}
 function hud(ctx,S,W,H,t,o){
  const f=o.f;ctx.save();
  panel(ctx,8,8,o.hearts?168:112,60,11);
  face(ctx,30,56,40);
  ctx.textAlign='left';
  if(o.hearts)hearts(ctx,60,26,S,t);
  icon(ctx,o.hearts?66:34,50,7);ctx.fillStyle='#f1f2f4';ctx.font='700 15px '+o.font;ctx.fillText(String(S.bytes),o.hearts?78:46,55);
  ctx.fillStyle='#9a9ca3';ctx.font='600 11px '+o.font;ctx.textAlign='right';ctx.fillText(String(S.score),o.hearts?166:106,54);
  if(S.combo>=10){cham(ctx,118,38,30,16,5);ctx.fillStyle=C.red;ctx.fill();ctx.fillStyle='#fff';ctx.font='800 11px '+o.font;ctx.textAlign='center';ctx.fillText('×2',133,50)}
  /* название уровня по центру под верхним рядом */
  ctx.textAlign='center';ctx.font='700 11px '+o.font;ctx.fillStyle='rgba(241,242,244,.8)';ctx.fillText(String(o.label).toUpperCase(),W/2,86);
  ctx.fillStyle='rgba(241,242,244,.25)';const tw=Math.min(W*.4,String(o.label).length*3.6+6);ctx.fillRect(W/2-tw-70,82,70,1);ctx.fillRect(W/2+tw,82,70,1);
  /* полоса пути: тонкая линия сверху */
  if(f>=0){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,0,W,3);ctx.fillStyle='#f1f2f4';ctx.fillRect(0,0,W*f,3);glowDot(ctx,W*f,1.5,10,'#ffffff',.7)}
  ctx.restore()}
 /* арена: панель героя и полоса босса по центру (имя сверху, 3 фазы метками) */
 function arenaHud(ctx,S,W,H,t,o){
  ctx.save();panel(ctx,8,8,120,60,11);face(ctx,30,56,40);hearts(ctx,60,26,S,t);ctx.textAlign='left';icon(ctx,66,50,7);ctx.fillStyle='#f1f2f4';ctx.font='700 14px '+o.font;ctx.fillText(String(S.bytes||0),77,55);
  ctx.fillStyle='#9a9ca3';ctx.font='600 10px '+o.font;ctx.textAlign='right';ctx.fillText(String(S.score),118,54);
  const x0=W*.12,bw=W*.76,fr=Math.max(0,Math.min(1,o.frac)),by=142;
  ctx.textAlign='center';ctx.fillStyle='#f1f2f4';ctx.font='700 13px '+o.font;ctx.fillText(o.name,W/2,by-8);
  cham(ctx,x0,by,bw,12,5);ctx.fillStyle='rgba(8,8,10,.8)';ctx.fill();ctx.strokeStyle='rgba(184,186,192,.55)';ctx.lineWidth=1.2;ctx.stroke();
  if(fr>0){cham(ctx,x0+2,by+2,Math.max(8,(bw-4)*fr),8,3);ctx.fillStyle=fr<.25?C.red:'#f1f2f4';ctx.fill()}
  ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x0+bw/3,by,1.5,12);ctx.fillRect(x0+bw*2/3,by,1.5,12);ctx.restore()}
 /* кнопки управления: тонкие кольца как на макете */
 function joy(ctx,bx,by,ax,on){
  ctx.save();ctx.globalAlpha=on?.95:.5;ctx.strokeStyle='rgba(241,242,244,.6)';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(bx,by,36,0,TAU);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.04)';ctx.fill();
  ctx.fillStyle='rgba(241,242,244,.55)';ctx.beginPath();ctx.moveTo(bx-28,by);ctx.lineTo(bx-22,by-5);ctx.lineTo(bx-22,by+5);ctx.fill();ctx.beginPath();ctx.moveTo(bx+28,by);ctx.lineTo(bx+22,by-5);ctx.lineTo(bx+22,by+5);ctx.fill();
  const g=ctx.createRadialGradient(bx+ax*26-3,by-4,2,bx+ax*26,by,15);g.addColorStop(0,'rgba(241,242,244,.55)');g.addColorStop(1,'rgba(120,122,130,.5)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(bx+ax*26,by,14,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;ctx.stroke();ctx.restore()}
 function jump(ctx,jx,jy,on){
  ctx.save();ctx.globalAlpha=on?1:.6;ctx.strokeStyle='rgba(241,242,244,.7)';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(jx,jy,36,0,TAU);ctx.stroke();ctx.fillStyle=on?'rgba(255,255,255,.14)':'rgba(255,255,255,.04)';ctx.fill();
  ctx.fillStyle='#e6e8eb';ctx.beginPath();ctx.moveTo(jx,jy-13);ctx.lineTo(jx+15,jy+10);ctx.lineTo(jx-15,jy+10);ctx.closePath();ctx.fill();ctx.restore()}
 function rejectBtn(ctx,rx,ry,on,label,font){
  ctx.save();ctx.globalAlpha=on?1:.45;ctx.fillStyle=on?'rgba(224,38,43,.22)':'rgba(8,8,10,.6)';ctx.strokeStyle=C.red;ctx.lineWidth=2;ctx.beginPath();ctx.arc(rx,ry,30,0,TAU);ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='700 10px '+font;ctx.fillText(label,rx,ry+4);ctx.restore()}
 /* ---------- арены боссов: тот же мир, что и на уровнях, но фон плывёт сам ---------- */
 const ASC=[0,2,4,6,0,3,1,2,3,3];
 function arenaBg(ctx,S,W,H,t){
  const id=Math.max(1,Math.min(10,S.bid|0||1)),sc=ASC[id-1],th=theme('arena',sc*5+1+(id%5)),gy=Math.max(S.gy||H*.8,H*.8);
  if(id===1)th.alt=1;/* Страж (уровень 10): уже в воздухе над свалкой */
  bg(ctx,W,H,H*.9,t*14,t,th,GameArtQ());
  if(id===1){ctx.font='600 10px monospace';ctx.textAlign='left';for(let i=0;i<7;i++){ctx.fillStyle='rgba(241,242,244,.12)';ctx.fillText(i%3?'File not found':'404',hs(i+2)*(W-70),((t*34+i*83)%(H+20))-10)}}
  else if(id===2){ctx.font='600 10px monospace';ctx.textAlign='left';const fn=['push()','pop()','call()','return','main()','stack'];for(let i=0;i<6;i++){ctx.fillStyle='rgba(241,242,244,.12)';ctx.fillText(fn[i],8,((t*24+i*90)%(H+20)))}}
  return true}
 const GameArtQ=()=>(typeof GameCore!=='undefined'&&GameCore.perf&&GameCore.perf.q)||1;
 /* ---------- платформа = окно редактора (0.14.0): тёмное окно с полоской заголовка, □ × справа, строками кода,
    под окном неоновые линии ERROR (красная) и WARN (зелёная). Верхняя кромка (y) — хитбокс; остальное только картинка.
    Окно кэшируется по ширине и состоянию. st: '' | 'warn' | 'stale' | 'lit' */
 const WH=42;
 const CODE=[[['code ','#8fb6ff'],['{','#f5b82e']],[['  echo','#e8eefc'],['("','#5c6f93'],['ok','#f5b82e'],['")','#5c6f93']]];
 function winPaint(q,wr,st){
  const warn=st==='warn',lit=st==='lit',stale=st==='stale';
  q.fillStyle='rgba(6,10,22,.92)';q.fillRect(0,2,wr,26);
  q.fillStyle=stale?'#101828':'#1a2a4c';q.fillRect(0,2,wr,7);
  q.strokeStyle='rgba(111,160,230,.45)';q.lineWidth=1;q.strokeRect(.5,2.5,wr-1,25);
  if(wr>=60){q.strokeStyle='#8fa6cc';q.strokeRect(wr-17.5,3.5,6,5);q.beginPath();q.moveTo(wr-9.5,3.5);q.lineTo(wr-4.5,8.5);q.moveTo(wr-4.5,3.5);q.lineTo(wr-9.5,8.5);q.stroke()}
  if(wr>=90){q.fillStyle='#8fa6cc';q.font='600 6px monospace';q.textAlign='left';q.fillText('main.js',4,8)}
  if(wr>=70){q.font='600 7px monospace';q.textAlign='left';for(let i=0;i<CODE.length;i++){let cx=6;for(const [s,c] of CODE[i]){q.fillStyle=c;q.fillText(s,cx,16.5+i*6);cx+=s.length*4.2}}}
  const surf=warn?C.red:lit?'#e8f4ff':stale?'#4a5a78':'#7fb0ff';
  if(warn||lit){q.fillStyle=warn?'rgba(224,38,43,.3)':'rgba(232,244,255,.22)';q.fillRect(0,-1,wr,4)}
  q.fillStyle=surf;q.fillRect(0,0,wr,2);
  q.fillStyle=C.red;q.globalAlpha=warn?1:.7;q.fillRect(0,31,wr,1.5);q.fillStyle='rgba(224,38,43,.2)';q.fillRect(0,29.5,wr,4.5);
  q.fillStyle=C.green;q.globalAlpha=.85;q.fillRect(0,38,wr,1.5);q.fillStyle='rgba(55,214,122,.18)';q.fillRect(0,36.5,wr,4.5);q.globalAlpha=1;
  if(wr>=70){q.font='700 5.5px monospace';q.textAlign='left';q.fillStyle=C.red;q.fillText('ERROR',4,30);q.fillStyle=C.green;q.fillText('WARN',4,44)}
 }
 function plat(ctx,x,y,w,h,st){const wr=Math.max(4,Math.round(w));blit(ctx,'win|'+wr+'|'+(st||''),x,y,wr,WH,q=>winPaint(q,wr,st||''))}
 /* всплывающие окна «System Error» вдали: готовые спрайты, плывут медленнее переднего плана */
 function errWin(q,k){
  q.fillStyle='rgba(12,18,38,.94)';q.fillRect(0,0,116,46);q.fillStyle='#23406f';q.fillRect(0,0,116,13);
  q.strokeStyle='rgba(143,182,255,.55)';q.lineWidth=1;q.strokeRect(.5,.5,115,45);
  q.fillStyle='#e8eefc';q.font='600 7px sans-serif';q.textAlign='left';q.fillText('System Error',5,9.5);
  q.strokeStyle='#e8eefc';q.strokeRect(104.5,3.5,6,6);
  q.fillStyle=C.red;q.beginPath();q.arc(17,30,7,0,TAU);q.fill();q.fillStyle='#fff';q.fillRect(14,29,6,2);
  q.fillStyle='#e8eefc';q.font='700 13px sans-serif';q.fillText(k?'0x404':'ALLOW?',30,35);
  q.strokeStyle='#8fb6ff';q.strokeRect(81.5,36.5,26,8);q.font='600 6px sans-serif';q.textAlign='center';q.fillText('OK',94.5,43)}
 function errPops(ctx,W,gy,sx,t,sd,n){
  for(let i=0;i<n;i++){const k=(i+sd)%2,span=W+240,x=(((i*197+sd*61)-sx*.2+t*6)%span+span)%span-120,y=gy*(.12+.2*hs(i*5+sd))+Math.sin(t*.8+i)*2;
   glowDot(ctx,x+58,y+23,64,'#3d7bff',.09);blit(ctx,'err|'+k,x,y,116,46,q=>errWin(q,k))}}
 return{theme,bg,voidFill,seg,item,shadow,parts,hud,arenaHud,arenaBg,plat,joy,jump,rejectBtn,glowDot,cham,panel,rgba,hs,TH,C,SC,WH}})();
