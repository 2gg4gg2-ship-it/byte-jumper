/* ===== ГРАФИКА «БАЙТ-ПРЫГУНА» (0.7.1): строгая палитра чёрный / серый / белый, красный только для опасности и акцентов =====
   Всё рисуется кодом на canvas, картинок нет, сеть не нужна. Фонов четыре, а не по одному на уровень: каждые 5 уровней сцена меняется
   (1–5 «Свалка», 6–10 «Руины», 11–15 «Башни», 16–20 «Тьма»; на уровнях 10 и 20 бои с боссами). Уровни 21+ берут те же сцены по кругу.
   Внутри сцены уровни различаются расстановкой силуэтов (зерно от номера уровня). Слои сдвигаются от S.x (параллакс), число частиц
   растёт и падает вместе с GameCore.perf.q. Игровая логика (хитбоксы, физика) здесь не меняется: только то, как нарисовано. */
const GameArt=(()=>{
 const TAU=6.2832;
 const hs=n=>{n=Math.imul(n^(n>>>15),2246822519);n=Math.imul(n^(n>>>13),3266489917);return((n^(n>>>16))>>>0)/4294967296};
 /* единая палитра игры: другие файлы берут цвета отсюда (GameArt.C) */
 const C={ink:'#050506',k1:'#0b0b0d',k2:'#131316',k3:'#1c1c20',k4:'#2a2b30',g1:'#3b3c42',g2:'#5a5c63',g3:'#8a8c93',g4:'#b8bac0',w:'#f1f2f4',red:'#e0262b',red2:'#8f1519',red3:'#3a0709'};
 /* сцены: [верх неба, низ неба, свет, дальний слой, ближний слой, мотив, название] */
 const SC=[
  ['#08080a','#383940','#e8eaee','#18181c','#0d0d10','ruins','Свалка'],
  ['#09090b','#2f3035','#e8eaee','#16161a','#0b0b0e','city','Руины'],
  ['#07070a','#2a2b30','#dfe1e5','#131316','#09090c','rings','Башни'],
  ['#050506','#241618','#e0262b','#100b0c','#070506','dark','Тьма']];
 const NAMES=['Пробуждение','Первая память','Архивариус','Потеряшка','Мусорный ветер','Дверь без таблички','Потерянные иконки','Ржавый лифт','Тихая дверь','Страж',
  'Нижний слой','Push','Мастер Правок','Подвал стека','Первый Шлюз','Спор Домов','Рекурсия','Сломанный лифт','Тяжёлая память','Колосс'];
 /* TH[i] = [верх, низ, свет, дальний, ближний, мотив, название]: 20 уровней, 4 сцены */
 const TH=NAMES.map((n,i)=>{const s=SC[Math.floor(i/5)];return[s[0],s[1],s[2],s[3],s[4],s[5],n]});
 const idx=(mode,L)=>mode==='endless'?11:Math.max(0,((L|0)-1)%20);
 const theme=(mode,L)=>{const i=idx(mode,L),t=TH[i],sc=Math.floor(i/5);return{i,sc,seed:(L|0)%5+sc*7,top:t[0],bot:t[1],ac:t[2],far:t[3],near:t[4],m:t[5],name:t[6],act:sc>1?1:0}};
 const rgba=(hex,a)=>{const n=parseInt(hex.slice(1),16);return'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')'};
 /* ---- кэш: статичное рисуется один раз в невидимый холст, потом одной командой drawImage (раньше фон пересчитывался каждый кадр) ---- */
 const cache=new Map();
 const hasDoc=()=>typeof document!=='undefined';
 const kOf=ctx=>{const m=ctx.getTransform&&ctx.getTransform();return m&&m.a>0?Math.round(m.a*50)/50:1};
 function layer(key,w,h,k,paint){
  const kk=key+'|'+w+'x'+h+'@'+k;let c=cache.get(kk);
  if(!c){c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));const x=c.getContext('2d');x.scale(k,k);paint(x);cache.set(kk,c);if(cache.size>18)cache.delete(cache.keys().next().value)}
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
  const sc=th.sc,red=sc===3,sd=th.seed;gy=Math.round(gy);
  blit(ctx,'back|'+sc+th.top+th.bot,0,0,W,H,x=>{const g=x.createLinearGradient(0,0,0,gy);g.addColorStop(0,th.top);g.addColorStop(1,th.bot);x.fillStyle=g;x.fillRect(0,0,W,H);
   glowDot(x,W*.55,gy*.62,W*.9,red?'#e0262b':'#ffffff',red?.07:.05);
   if(red){const h=x.createLinearGradient(0,gy-170,0,gy);h.addColorStop(0,'rgba(224,38,43,0)');h.addColorStop(1,'rgba(224,38,43,.22)');x.fillStyle=h;x.fillRect(0,gy-170,W,170)}});
  if(sc===0||sc===2||sc===3)ring(ctx,W*.58+Math.sin(sx*.0015)*18,gy*.5,sc===2?gy*.46:gy*.38,sc===3?.05:.07,t,sc===2?10:7);
  if(sc===2){ring(ctx,W*.22,gy*.32,gy*.2,.045,-t,5);ctx.fillStyle=rgba('#f1f2f4',.035);for(let i=0;i<4;i++)ctx.fillRect(W*(.1+i*.25)-6,0,12,gy)}
  towers(ctx,W,gy,sx,.04,3+sd,th.far,60,sc===2?230:170,sc===2?46:72,sc===1?.16:0,sc===1||red,t);
  fog(ctx,W,gy-130,120,.1,t,sd);
  towers(ctx,W,gy,sx,.09,11+sd,sc===2?'#101013':th.near,34,sc===0?130:100,56,0,false,t);
  if(sc===0)ruinsExtra(ctx,W,gy,sx,t,th,q);
  else if(sc===1)for(let i=0;i<3;i++){const x=((i*170+50-sx*.1)%(W+200)+W+200)%(W+200)-70;ctx.fillStyle=th.near;ctx.fillRect(x,gy-84,3,84);ctx.fillRect(x-20,gy-88,44,10);ctx.fillStyle=rgba('#f1f2f4',.25);ctx.fillRect(x-17,gy-85,38,2)}
  else if(sc===3)for(let i=0;i<5;i++){const x=((i*86+20-sx*.12)%(W+120)+W+120)%(W+120)-30,h=30+hs(i+sd)*60;ctx.fillStyle=th.near;ctx.beginPath();ctx.moveTo(x,gy+2);ctx.lineTo(x+9,gy-h);ctx.lineTo(x+18,gy+2);ctx.fill()}
  towers(ctx,W,gy,sx,.16,29+sd,th.near,22,70,50,0,false,t);
  fog(ctx,W,gy-56,60,.13,t,sd+2);
  const n=Math.round(16*q),o=ctx.globalAlpha;
  for(let i=0;i<n;i++){const r=hs(i+500),x=((r*W-sx*(.2+r*.35)-t*(5+r*7))%(W+20)+W+20)%(W+20)-10,y=hs(i+90)*gy+Math.sin(t*.6+i)*7,s=1+(i%3);ctx.fillStyle=(red&&i%4===0)?'#e0262b':'#f1f2f4';ctx.globalAlpha=o*((red&&i%4===0)?.45:.1+.25*r);ctx.fillRect(x,y,s,s)}
  ctx.globalAlpha=o;
  blit(ctx,'over',0,0,W,H,x=>{const v=x.createRadialGradient(W/2,H*.45,Math.min(W,H)*.3,W/2,H*.5,Math.max(W,H)*.8);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.6)');x.fillStyle=v;x.fillRect(0,0,W,H)})}
 /* «Свалка»: обломки табличек и каркас арки на горизонте */
 function ruinsExtra(ctx,W,gy,sx,t,th,q){
  for(let i=0;i<3;i++){const x=((i*150+60-sx*.12)%(W+180)+W+180)%(W+180)-50;ctx.fillStyle=th.near;ctx.fillRect(x,gy-70,5,70);ctx.fillRect(x+34,gy-58,5,58);ctx.fillRect(x-4,gy-76,48,7);ctx.strokeStyle=rgba('#f1f2f4',.12);ctx.lineWidth=1;ctx.strokeRect(x+8,gy-64,22,40)}}
 /* пустота ям (опасность: красное свечение снизу) и земля */
 function voidFill(ctx,W,H,gy,th,t){
  gy=Math.round(gy);blit(ctx,'void',0,gy,W,H-gy+4,x=>{const g=x.createLinearGradient(0,0,0,H-gy);g.addColorStop(0,'#050506');g.addColorStop(.55,'#08080a');g.addColorStop(1,'rgba(143,21,25,.55)');x.fillStyle=g;x.fillRect(0,0,W,H-gy+4)});
  ctx.fillStyle=rgba('#e0262b',.35+.15*Math.sin(t*3));ctx.fillRect(0,gy+1,W,2)}
 /* земля: плитка шириной 960 px (кратна шагам швов 96, щелей 64 и 80) лежит в кэше и укладывается по миру; кромки ям рисуются поверх */
 const TILE=960;
 function paintGround(x,Hg){
  const g=x.createLinearGradient(0,0,0,Hg);g.addColorStop(0,'#3a3b41');g.addColorStop(.06,'#25262a');g.addColorStop(.3,'#141417');g.addColorStop(1,'#050506');x.fillStyle=g;x.fillRect(0,0,TILE,Hg);
  x.fillStyle='#9a9ca3';x.fillRect(0,0,TILE,2);
  for(let X=0;X<TILE;X+=96){x.fillStyle='rgba(0,0,0,.55)';x.fillRect(X,3,2,40);x.fillStyle='rgba(255,255,255,.06)';x.fillRect(X+2,3,1,40)}
  for(let X=20;X<TILE;X+=64){x.fillStyle='rgba(241,242,244,.16)';x.fillRect(X-3,10,30,7);x.fillStyle='rgba(241,242,244,.85)';x.fillRect(X,12,24,3)}
  for(let r=0,y=34;y<Hg;r++,y+=34){x.fillStyle='rgba(255,255,255,'+Math.max(.012,.06-r*.006)+')';x.fillRect(0,y,TILE,1);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,y+1,TILE,2);
   for(let X=0;X<TILE;X+=80){const q=hs((X/80)*13+r*7);if(q>.5){x.fillStyle='rgba(241,242,244,'+Math.max(.04,.2-r*.02)+')';x.fillRect(X,y+10,18+q*26,2)}if(q<.18){x.fillStyle='rgba(0,0,0,.4)';x.fillRect(X+8,y+3,3,30)}}}}
 function seg(ctx,a,b,gy,H,sx,th,t){
  if(b<=a)return;gy=Math.round(gy);const Hg=Math.ceil(H-gy+4);
  ctx.save();ctx.beginPath();ctx.rect(a,gy,b-a,Hg);ctx.clip();
  for(let X=Math.floor((a+sx)/TILE)*TILE-sx;X<b;X+=TILE)blit(ctx,'ground',X,gy,TILE,Hg,x=>paintGround(x,Hg));
  ctx.restore();
  ctx.fillStyle='#c9ccd1';ctx.fillRect(a,gy,3,9);ctx.fillRect(b-3,gy,3,9)}
 /* предметы; true = нарисовано */
 const crystal=(ctx,r)=>{ctx.beginPath();ctx.moveTo(0,-r*1.25);ctx.lineTo(r*.9,-r*.2);ctx.lineTo(r*.55,r*.95);ctx.lineTo(-r*.55,r*.95);ctx.lineTo(-r*.9,-r*.2);ctx.closePath()};
 function item(ctx,it,x,y,gy,t,H,th){
  const k=it.t;
  if(k==='byte'||k==='gold'){const gd=k==='gold',r=gd?10:8;glowDot(ctx,x,y,gd?30:21,'#ffffff',gd?.4:.3);
   ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2.4+it.x)*.18);const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#ffffff');g.addColorStop(1,gd?'#a8abb2':'#7b7e86');ctx.fillStyle=g;crystal(ctx,r);ctx.fill();
   ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.moveTo(0,-r*1.25);ctx.lineTo(r*.9,-r*.2);ctx.lineTo(0,r*.1);ctx.lineTo(-r*.9,-r*.2);ctx.closePath();ctx.fill();
   ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.moveTo(0,r*.1);ctx.lineTo(r*.9,-r*.2);ctx.lineTo(r*.55,r*.95);ctx.lineTo(0,r*.95);ctx.closePath();ctx.fill();
   if(gd){ctx.strokeStyle='rgba(255,255,255,'+(.35+.3*Math.sin(t*5))+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r+7+Math.sin(t*5)*1.5,0,TAU);ctx.stroke()}ctx.restore();return true}
  if(k==='bug'){const h=it.big?30:22,w=it.big?13:11,j=Math.sin(t*14+it.x)*1;glowDot(ctx,x,gy-h*.4,h*1.1,C.red,.28);
   ctx.save();ctx.translate(x+j,gy);const g=ctx.createLinearGradient(0,-h,0,0);g.addColorStop(0,'#55565c');g.addColorStop(1,'#16161a');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-w,0);ctx.lineTo(-w*.55,-h*.45);ctx.lineTo(-w*.3,-h*.4);ctx.lineTo(0,-h);ctx.lineTo(w*.3,-h*.4);ctx.lineTo(w*.55,-h*.45);ctx.lineTo(w,0);ctx.closePath();ctx.fill();
   ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;ctx.stroke();
   ctx.fillStyle='#050506';ctx.fillRect(-w*.5,-h*.42,w,w*.5);ctx.fillStyle=C.red;ctx.fillRect(-w*.34,-h*.38,w*.18,w*.38);ctx.fillRect(w*.16,-h*.38,w*.18,w*.38);ctx.restore();return true}
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
 const ASC=[0,2,1,3,0,3,1,2,3,3];
 function arenaBg(ctx,S,W,H,t){
  const id=Math.max(1,Math.min(10,S.bid|0||1)),sc=ASC[id-1],th=theme('level',sc*5+1+(id%5)),gy=Math.max(S.gy||H*.8,H*.8);
  bg(ctx,W,H,H*.9,t*14,t,th,GameArtQ());
  if(id===1){ctx.font='600 10px monospace';ctx.textAlign='left';for(let i=0;i<7;i++){ctx.fillStyle='rgba(241,242,244,.12)';ctx.fillText(i%3?'File not found':'404',hs(i+2)*(W-70),((t*34+i*83)%(H+20))-10)}}
  else if(id===2){ctx.font='600 10px monospace';ctx.textAlign='left';const fn=['push()','pop()','call()','return','main()','stack'];for(let i=0;i<6;i++){ctx.fillStyle='rgba(241,242,244,.12)';ctx.fillText(fn[i],8,((t*24+i*90)%(H+20)))}}
  return true}
 const GameArtQ=()=>(typeof GameCore!=='undefined'&&GameCore.perf&&GameCore.perf.q)||1;
 /* платформа арены: летающий диск со световыми щелями по ободу; верхняя кромка = хитбокс. st: '' | 'warn' | 'stale' | 'lit' */
 function plat(ctx,x,y,w,h,st){
  const cx=x+w/2,rx=w/2,sl=Math.max(2,Math.round(w/44));
  const warn=st==='warn',lit=st==='lit',stale=st==='stale';
  const g=ctx.createLinearGradient(0,y,0,y+18);g.addColorStop(0,stale?'#3d3e44':'#4a4b52');g.addColorStop(1,'#0b0b0d');
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,y+1);ctx.lineTo(x+w,y+1);ctx.lineTo(x+w-w*.1,y+14);ctx.lineTo(x+w*.78,y+19);ctx.lineTo(x+w*.22,y+19);ctx.lineTo(x+w*.1,y+14);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w*.1,y+14);ctx.lineTo(x+w*.9,y+14);ctx.stroke();
  for(let i=0;i<sl;i++){const lx=x+w*(i+.5)/sl-w*.05;ctx.fillStyle=warn?'rgba(224,38,43,.9)':lit?'rgba(255,255,255,1)':stale?'rgba(184,186,192,.35)':'rgba(241,242,244,.85)';ctx.fillRect(lx,y+8,w*.1,3);if(!stale){ctx.fillStyle=warn?'rgba(224,38,43,.18)':'rgba(255,255,255,.12)';ctx.fillRect(lx-3,y+6,w*.1+6,7)}}
  const tg=ctx.createLinearGradient(0,y-5,0,y+7);tg.addColorStop(0,stale?'#6a6c73':'#9a9ca3');tg.addColorStop(1,'#3b3c42');ctx.fillStyle=tg;ctx.beginPath();ctx.ellipse(cx,y+1,rx,5,0,0,TAU);ctx.fill();
  ctx.strokeStyle=warn?C.red:lit?'#ffffff':'rgba(255,255,255,.45)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(cx,y+1,rx,5,0,Math.PI*1.02,Math.PI*1.98);ctx.stroke();
  ctx.strokeStyle='rgba(8,8,10,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+w*.3,y+19);ctx.lineTo(x+w*.27,y+27);ctx.moveTo(x+w*.68,y+19);ctx.lineTo(x+w*.7,y+25);ctx.stroke();
  if(stale){ctx.strokeStyle='rgba(184,186,192,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w*.3,y+2);ctx.lineTo(x+w*.36,y+6);ctx.lineTo(x+w*.33,y+10);ctx.moveTo(x+w*.7,y+1);ctx.lineTo(x+w*.66,y+5);ctx.stroke()}}
 return{theme,bg,voidFill,seg,item,shadow,parts,hud,arenaHud,arenaBg,plat,joy,jump,rejectBtn,glowDot,cham,panel,rgba,hs,TH,C,SC}})();
