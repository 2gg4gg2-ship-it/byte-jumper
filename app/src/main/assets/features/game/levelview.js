/* ===== РИСОВАНИЕ УРОВНЕЙ (режим «уровень»): новые препятствия, платформы, подсказки =====
   Фон, земля, байты, баги, HUD и герой берутся из GameArt / GameSpark (общий стиль 0.7.x: чёрный, серый, белый, красный только для опасности).
   Здесь только то, чего там нет: платформы уровня, стена, ворота, договоры, прыгуны, записи, чекпоинт, контейнер, Потеряшка, тьма, подсказки.
   Логику не трогает. Правило честности: тьма и фон никогда не скрывают опасности, платформы и края ям. */
const GameLevelView=(()=>{
 const A=()=>GameArt,TAU=6.2832;
 const PE={PH:24,PX:80};/* для GameSpark / GameArt.parts: PX подставляется каждый кадр */
 function lines(ctx,n,maxW){
  if(n.lw===maxW&&n.ln)return n.ln;
  const out=[];let cur='';
  for(const w of String(n.text||'').split(' ')){const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=w}else cur=t}
  if(cur)out.push(cur);n.lw=maxW;n.ln=out;return out}
 const wrapX=(x,W,pad)=>{const m=W+pad*2;return((x%m)+m)%m-pad};
 /* добавка к сценам GameArt для глав 2 и 3 (серые): лента вызовов стека, стеклянные панели и манекены Кэша */
 function extra(ctx,S,W,H,gy,t,ch){
  const X=S.x;
  if(ch===2){ctx.globalAlpha=.2;ctx.fillStyle='#b8bac0';ctx.font='600 9px monospace';ctx.textAlign='left';
   const fn=['main()','render()','push()','update()','pop()','call()','run()','load()'];for(let i=0;i<9;i++)ctx.fillText(fn[i%8],6,((i*40+t*18)%(gy-10))+8);ctx.globalAlpha=1}
  else if(ch===3){
   for(let i=0;i<5;i++){const x=wrapX(i*130-X*.16,W,60);ctx.globalAlpha=.07;ctx.fillStyle='#f1f2f4';ctx.fillRect(x-22,50,44,gy-50);ctx.globalAlpha=.1;ctx.beginPath();ctx.moveTo(x-22,50);ctx.lineTo(x-4,50);ctx.lineTo(x-22,gy-50);ctx.closePath();ctx.fill()}
   ctx.globalAlpha=.55;ctx.fillStyle='#16161a';
   for(let i=0;i<4;i++){const x=wrapX(i*170+40-X*.3,W,50),y=gy-18;ctx.beginPath();ctx.arc(x,y-30,8,0,TAU);ctx.fill();ctx.fillRect(x-8,y-22,16,28);ctx.fillRect(x-10,y+6,6,12);ctx.fillRect(x+4,y+6,6,12);
    const lk=Math.max(-2,Math.min(2,(S.px-x)/60));ctx.fillStyle='#e0262b';ctx.fillRect(x-4+lk,y-32,2,2);ctx.fillRect(x+2+lk,y-32,2,2);ctx.fillStyle='#16161a'}
   ctx.globalAlpha=1}}
 /* ---------- платформы ---------- */
 function dashed(ctx,x,y,w,al){ctx.globalAlpha=al;ctx.strokeStyle='#b8bac0';ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.strokeRect(x+.5,y+.5,w,12);ctx.setLineDash([]);ctx.globalAlpha=1}
 function plat(ctx,S,q,W,gy,t){
  let x=q.cx-S.x;const w=q.w,y=gy-q.cur;if(x>W+60||x+w<-60||q.dead)return;
  if(q.k==='fake'){dashed(ctx,x,y,w,.4);return}
  let st='',al=1,oy=0;
  if(q.k==='blink'){const c=(S.t+q.ph)%q.per;if(c>=q.on){dashed(ctx,x,y,w,.25);return}if(c>q.on-.7){st='warn';if(Math.sin(t*30)>0)al=.4}}
  if(q.rise){const k=Math.max(0,Math.min(1,(S.x+S.px+(W-S.px)-q.x)/70));al=k;oy=(1-k)*46}
  if(q.fs===1){st='warn';x+=Math.sin(t*60)*1.6}
  if(q.fs===2)al=Math.max(0,1-q.drop/160);
  if(q.tone==='stale')st='stale';else if(q.tone==='fresh')st='lit';
  ctx.globalAlpha=al;A().plat(ctx,x,y+oy,w,10,st);
  if(q.k==='lift'||q.k==='mv'){ctx.fillStyle='rgba(241,242,244,.7)';const m=x+w/2;if(q.k==='lift'){ctx.fillRect(m-1,y+oy-9,2,6);ctx.beginPath();ctx.moveTo(m-4,y+oy-8);ctx.lineTo(m,y+oy-13);ctx.lineTo(m+4,y+oy-8);ctx.fill()}else ctx.fillRect(m-9,y+oy-8,18,2)}
  ctx.globalAlpha=1}
 /* ---------- предметы, которых нет в GameArt ---------- */
 function item(ctx,S,it,W,gy,t,font,dark){
  const k=it.t,C=A().C,glow=A().glowDot;let x=it.x-S.x;
  if(k==='proj'&&!it.go){if(it.wn){const y=gy-it.h-7,a=.5+.5*Math.abs(Math.sin(t*14));ctx.globalAlpha=a;glow(ctx,W-18,y,26,C.red,.6);ctx.fillStyle=C.red;ctx.beginPath();ctx.moveTo(W-6,y);ctx.lineTo(W-22,y-9);ctx.lineTo(W-22,y+9);ctx.closePath();ctx.fill();ctx.fillStyle='#f1f2f4';ctx.fillRect(W-36,y-5,9,10);ctx.fillRect(W-38,y-8,13,2);ctx.globalAlpha=1}return}
  if(x<-60||x>W+80)return;
  const y=gy-it.h;
  if(k==='byte'||k==='gold'||k==='bug'||k==='door'||k==='shield'||k==='magnet'){
   if(k==='bug'&&dark)glow(ctx,x,gy-14,34,C.red,.5);
   if(k==='byte'&&dark)glow(ctx,x,y,30,'#ffffff',.35);
   A().item(ctx,it,x,y,gy,t,S.H);
   if(k==='door'&&S.doorOpen>0){const op=S.doorOpen;glow(ctx,x,gy-32,70,'#ffffff',.25+.5*op);ctx.fillStyle='rgba(255,255,255,'+(.2+.6*op)+')';ctx.fillRect(x-20,gy-60,40,56)}
   return}
  if(k==='wall'){const h=it.hh;glow(ctx,x,gy-h/2,h*.8,C.red,dark?.5:.28);ctx.fillStyle=C.red;ctx.fillRect(x-8,gy-h,16,h);ctx.fillStyle='rgba(5,5,6,.55)';for(let j=6;j<h;j+=14){ctx.beginPath();ctx.moveTo(x-8,gy-j);ctx.lineTo(x+8,gy-j-8);ctx.lineTo(x+8,gy-j-3);ctx.lineTo(x-8,gy-j+5);ctx.fill()}ctx.fillStyle='#f1f2f4';ctx.fillRect(x-10,gy-h-3,20,3);return}
  if(k==='proj'){glow(ctx,x,y,24,C.red,.5);ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*9)*.12);ctx.fillStyle='#e8e9ec';ctx.fillRect(-10,-7,20,14);ctx.fillStyle='#5a5c63';ctx.fillRect(-7,-3,11,2);ctx.fillRect(-7,1,8,2);ctx.fillStyle=C.red;ctx.beginPath();ctx.arc(6,3,3,0,TAU);ctx.fill();ctx.restore();return}
  if(k==='hop'){const e=GameEngine.hopE(S,it),by=gy-e;
   ctx.globalAlpha=.3;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,gy+1,10*(1-e/140),3,0,0,TAU);ctx.fill();
   glow(ctx,x,by-12,28,'#ffffff',.2);ctx.globalAlpha=.85;ctx.fillStyle='#d4d6db';ctx.beginPath();ctx.moveTo(x-9,by);ctx.lineTo(x-9,by-14);ctx.quadraticCurveTo(x,by-28,x+9,by-14);ctx.lineTo(x+9,by);ctx.lineTo(x+4,by-4);ctx.lineTo(x,by);ctx.lineTo(x-4,by-4);ctx.closePath();ctx.fill();
   ctx.fillStyle=C.red;ctx.fillRect(x-5,by-15,3,4);ctx.fillRect(x+2,by-15,3,4);ctx.globalAlpha=1;return}
  if(k==='gate'){const st=GameEngine.gateSt(S,it),h=it.hh;
   ctx.fillStyle='#8a8c93';ctx.fillRect(x-12,gy-h-8,5,h+8);ctx.fillRect(x+7,gy-h-8,5,h+8);ctx.fillRect(x-14,gy-h-10,28,3);
   if(st===2){glow(ctx,x,gy-h/2,40,C.red,.45);ctx.fillStyle=C.red;ctx.fillRect(x-7,gy-h,14,h);ctx.fillStyle='rgba(5,5,6,.5)';for(let j=4;j<h;j+=10)ctx.fillRect(x-7,gy-j,14,3)}
   else if(st===1){ctx.globalAlpha=Math.sin(t*32)>0?.85:.15;ctx.fillStyle=C.red;ctx.fillRect(x-7,gy-h,14,h);ctx.globalAlpha=1}
   else{ctx.globalAlpha=.35;ctx.fillStyle='#f1f2f4';ctx.fillRect(x-1,gy-h,2,h);ctx.globalAlpha=1}return}
  if(k==='lore'){const yy=y+Math.sin(t*3)*3;glow(ctx,x,yy,34,'#ffffff',.3+.1*Math.sin(t*5));ctx.fillStyle='#f1f2f4';ctx.fillRect(x-9,yy-12,18,24);ctx.fillStyle='#5a5c63';ctx.fillRect(x-6,yy-7,12,2);ctx.fillRect(x-6,yy-2,12,2);ctx.fillRect(x-6,yy+3,8,2);return}
  if(k==='cp'){glow(ctx,x,y-8,30,'#ffffff',.25);ctx.fillStyle='#8a8c93';ctx.fillRect(x-1,y-26,3,38);ctx.fillStyle='#f1f2f4';ctx.beginPath();ctx.moveTo(x+2,y-26);ctx.lineTo(x+22,y-19+Math.sin(t*5)*2);ctx.lineTo(x+2,y-12);ctx.closePath();ctx.fill();return}
  if(k==='bin'){ctx.strokeStyle='#f1f2f4';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-14,y-18);ctx.lineTo(x-10,y+16);ctx.lineTo(x+10,y+16);ctx.lineTo(x+14,y-18);ctx.stroke();ctx.fillStyle='#f1f2f4';ctx.fillRect(x-17,y-22,34,4);
   ctx.globalAlpha=.6+.4*Math.sin(t*5);ctx.beginPath();ctx.moveTo(x-5,y-8);ctx.lineTo(x+5,y-8);ctx.lineTo(x,y);ctx.closePath();ctx.fill();ctx.globalAlpha=1;return}
  if(k==='lost'){const bl=Math.sin(t*6)>-.3;glow(ctx,x,gy-14,34,'#ffffff',dark?.5:.28);
   ctx.fillStyle='#d4d6db';ctx.beginPath();ctx.moveTo(x-11,gy);ctx.lineTo(x,gy-22);ctx.lineTo(x+11,gy);ctx.closePath();ctx.fill();ctx.fillStyle='#16161a';ctx.fillRect(x-4,gy-15,2,3);ctx.fillRect(x+2,gy-15,2,3);
   ctx.globalAlpha=bl?1:.2;ctx.fillStyle=C.red;ctx.font='700 14px '+font;ctx.textAlign='center';ctx.fillText('!',x,gy-27);ctx.globalAlpha=1}}
 /* ---------- главная функция ---------- */
 function draw(ctx,S,o){
  const W=S.W,H=S.H,gy=S.gy,t=S.t,col=o.col,font=col.font,q=GameCore.perf.q,ch=Math.min(10,Math.ceil(o.Lv/10)),dark=!!(S.def&&S.def.dark);
  const th=GameArt.theme('level',o.Lv),C=GameArt.C;PE.PX=S.px;
  ctx.setTransform(o.dpr*o.sc,0,0,o.dpr*o.sc,0,0);
  GameArt.bg(ctx,W,H,gy,S.x,t,th,q);extra(ctx,S,W,H,gy,t,ch);
  GameArt.voidFill(ctx,W,H,gy,th,t);
  const pits=S.pits.slice().sort((a,b)=>a.a-b.a);let cx=-10;
  for(const p of pits){const a=p.a-S.x,b=p.b-S.x;if(b<-20||a>W+20){cx=Math.max(cx,b);continue}GameArt.seg(ctx,cx,Math.min(a,W+10),gy,H,S.x,th,t);cx=Math.max(cx,b)}
  GameArt.seg(ctx,cx,W+10,gy,H,S.x,th,t);
  if(dark){const p=S.p,g=ctx.createRadialGradient(S.px,p.y+12,30,S.px,p.y+12,200);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.86)');ctx.fillStyle=g;ctx.fillRect(0,0,W,gy);
   for(const p2 of pits){const a=p2.a-S.x,b=p2.b-S.x;ctx.fillStyle=C.red;ctx.fillRect(a-2,gy,3,10);ctx.fillRect(b-1,gy,3,10)}}
  for(const pl of S.plats)plat(ctx,S,pl,W,gy,t);
  for(const it of S.items)if(it.t!=='tip')item(ctx,S,it,W,gy,t,font,dark);
  /* игрок: тень на земле или платформе, герой из spark.js */
  const p=S.p;let sy=gy;for(const pl of S.plats){if(pl.dead||pl.k==='fake'||S.px+8<pl.cx-S.x||S.px-8>pl.cx-S.x+pl.w)continue;const ty=gy-pl.cur;if(ty>=p.y+24-4&&ty<sy)sy=ty}
  GameArt.shadow(ctx,S.px,sy,p.y,24);
  {const bl=p.inv>0&&Math.floor(t*14)%2;
   if(!bl||GameSpark.ready()){ctx.save();if(bl)ctx.globalAlpha=.45;ctx.translate(S.px,p.y+12);
    if(!GameSpark.draw(ctx,S,t,'level',PE)){ctx.fillStyle=col.tx;ctx.fillRect(-12,-12,24,24);ctx.fillStyle=col.bg;ctx.fillRect(-6,-4,4,5);ctx.fillRect(3,-4,4,5)}
    if(p.sh){ctx.strokeStyle=col.tx;ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(0,0,21,0,TAU);ctx.stroke()}
    ctx.restore()}}
  GameArt.parts(ctx,S,t,th,q,PE);
  /* HUD */
  const row=GameStory.chapters[ch-1].levels[(o.Lv-1)%10]||[];
  GameArt.hud(ctx,S,W,H,t,{th,font,hearts:true,f:Math.min(1,(S.x+S.px)/S.door),label:o.Lv+' · '+(row[1]||th.name)});
  ctx.textAlign='left';
  if(S.def&&S.def.wt){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(14,76,80,5);ctx.fillStyle='#f1f2f4';ctx.fillRect(14,76,80*S.wt/.12,5);ctx.fillStyle='#9a9ca3';ctx.font='600 10px '+font;ctx.fillText('вес',100,82)}
  if(S.found){ctx.fillStyle='#d4d6db';ctx.font='700 11px '+font;ctx.textAlign='right';ctx.fillText('житель найден',W-12,22)}
  if(o.fx)o.fx();
  /* подсказка или запись: под названием уровня, не закрывает дорогу */
  const n=S.note;
  if(n){
   ctx.font='600 13px '+font;const ls=lines(ctx,n,W-60),lh=17,bh=ls.length*lh+(n.kind==='lore'?34:18),by=100;
   ctx.globalAlpha=Math.min(1,n.ttl*2.5);GameArt.panel(ctx,14,by,W-28,bh,10);ctx.textAlign='left';
   let y=by+22;if(n.kind==='lore'){ctx.fillStyle=C.red;ctx.font='700 11px '+font;ctx.fillText('ЗАПИСЬ',28,y);y+=18;ctx.font='600 13px '+font}
   ctx.fillStyle='#f1f2f4';for(const l of ls){ctx.fillText(l,28,y);y+=lh}ctx.globalAlpha=1}}
 return{draw}})();
