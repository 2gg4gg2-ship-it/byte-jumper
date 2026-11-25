/* ===== РИСОВАНИЕ БОССОВ 1–2 (боссы 404 и Колосс): только canvas, без логики. Логика — boss12.js.
   Вызывается из game.js (drawArena) при S.b12. Экран шахты прокручивается по S.cam, башня стоит. ===== */
const GameBoss12View=(()=>{
 const E=GameEngine,TAU=6.2832;
 function draw(ctx,S,o){ 
  const W=S.W,H=S.H,t=S.t,col=o.col,p=S.p,B=S.boss;
  /* фон */
  if(S.bid===1){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1d1712');g.addColorStop(1,'#09090b');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  else{const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1c1131');g.addColorStop(1,'#07050d');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  /* мировой слой: для шахты экран едет вниз, башня стоит */
  ctx.save();ctx.translate(0,-(S.bid===1?S.cam:0));
  if(S.bid===1){
   /* ржавые стены шахты */
   ctx.fillStyle='#24201b';ctx.fillRect(0,S.cam,10,H);ctx.fillRect(W-10,S.cam,10,H);
   ctx.font='600 10px monospace';ctx.fillStyle=col.tx2;ctx.globalAlpha=.14;
   for(let i=0;i<8;i++){ctx.fillText('File not found',(i*61)%(W-70),S.cam+((t*40+i*83)%(H+20))-10)}ctx.globalAlpha=1;
   for(const q of S.pl){if(q.st==='gone')continue;const sh=q.st==='warn'&&Math.sin(t*30)>0?2:0;
    GameArt.plat(ctx,q.x+sh,q.y,q.w,q.floor?H*3-q.y:10,q.st==='warn'?'warn':'')}
   /* рамка на груди Стража: пустая, мигает */
   const fx=B.x-16,fy=B.y+8,st=S.fr?S.fr.st:'wait';ctx.lineWidth=2;ctx.strokeStyle=st==='open'?'#f1f2f4':st==='warn'?(Math.sin(t*24)>0?'#e0262b':'rgba(224,38,43,.3)'):'rgba(241,242,244,.25)';ctx.strokeRect(fx,fy,32,22);if(st==='open'){ctx.fillStyle='rgba(241,242,244,.12)';ctx.fillRect(fx,fy,32,22)}
  } else {
   ctx.fillStyle='#0c0817';ctx.fillRect(0,0,W,H);
   ctx.font='600 9px monospace';ctx.fillStyle=col.tx2;ctx.globalAlpha=.12;
   for(let i=0;i<10;i++)ctx.fillText('fn()',8,20+i*46+(t*8)%46);ctx.globalAlpha=1;
   for(const q of S.pl){if(q.st==='gone')continue;const sh=q.st==='warn'&&Math.sin(t*30)>0?2:0;
    if(q.pop){ctx.fillStyle='#6b4fa6';ctx.fillRect(q.x+sh,q.y,q.w,20);ctx.fillStyle='#7dffa8';ctx.fillRect(q.x+sh+2,q.y+2,q.w-4,4)}
    else GameArt.plat(ctx,q.x+sh,q.y,q.w,q.floor?H-q.y:10,q.st==='warn'?'warn':'')}
   for(const r of S.rail){ctx.fillStyle='#55506a';ctx.fillRect(W-12,0,2,H);ctx.fillStyle='#8a7bbd';ctx.fillRect(W-22,r.y,22,22);ctx.fillStyle='#2a2140';ctx.fillRect(W-17,r.y+6,12,10)}
   for(const w of S.waves){ctx.fillStyle='#3a2a5a';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.strokeStyle=col.err;ctx.lineWidth=2;ctx.strokeRect(w.x,w.y,w.w,w.h)}
   for(const c of S.cols){ctx.fillStyle='#8a7bbd';ctx.fillRect(c.x-13,c.y,26,26);ctx.strokeStyle='#c9b6ff';ctx.strokeRect(c.x-13,c.y,26,26)}
   for(const f of S.frags){ctx.fillStyle='#c9b6ff';ctx.beginPath();ctx.arc(f.x,f.y,8,0,TAU);ctx.fill();ctx.fillStyle='#0a0712';ctx.fillRect(f.x-4,f.y-2,3,3);ctx.fillRect(f.x+1,f.y-2,3,3)}
   for(const f of S.fly){ctx.globalAlpha=1-f.t/.5;ctx.fillStyle='#7dffa8';const k=f.t/.5;ctx.fillRect(f.x+(W-40-f.x)*k-4,f.y+(B.y-f.y)*k-4,8,8);ctx.globalAlpha=1}
  }
  /* угрозы-метки */
  for(const a of S.tel){ctx.globalAlpha=.4+.4*Math.abs(Math.sin(t*14));ctx.fillStyle=col.err;
   if(a.k==='bm'){ctx.beginPath();ctx.arc(a.x,B.y+30,14+(1-a.t/.8)*10,0,TAU);ctx.fill()}
   else if(a.k==='edge'){const q=S.pl.find(t=>t.tier===a.tier);if(q){const even=a.tier%2===0;ctx.fillRect(even?q.x-4:q.x+q.w-2,q.y-80,6,80)}}
   else if(a.k==='col'){ctx.fillRect(a.x-1,0,2,H)}
   else if(a.k==='frag'){ctx.fillRect(a.x-6,a.y-6,12,12)}
   ctx.globalAlpha=1}
  /* диски и блоки-колонны */
  for(const d of S.sh){if(d.k==='disc'){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(t*6);ctx.fillStyle='#8a6a4a';ctx.beginPath();ctx.arc(0,0,d.r,0,TAU);ctx.fill();ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();ctx.restore()}
   else{ctx.fillStyle='#8a7bbd';ctx.fillRect(d.x-13,d.y,26,26)}}
  for(const s of S.sheets){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.sin(s.ph)*.15);ctx.fillStyle='#d9d6cc';ctx.fillRect(-7,-9,14,18);ctx.fillStyle='#8a8d93';ctx.fillRect(-4,-4,8,1.5);ctx.fillRect(-4,1,6,1.5);ctx.restore()}
  /* босс */
  ctx.save();ctx.translate(B.x,B.y);GameBossArt.draw(ctx,S,t);ctx.restore();
  ctx.restore();
  /* тёмный слой облака (только шахта) */
  if(S.bid===1&&S.cloud>0){const a=Math.min(1,S.cloud/.3)*.82;ctx.fillStyle='rgba(60,62,68,'+a.toFixed(2)+')';ctx.fillRect(0,0,W,H/3);ctx.fillStyle='rgba(241,242,244,'+(a*.5).toFixed(2)+')';ctx.font='700 14px monospace';ctx.textAlign='center';ctx.fillText('404',W/2,H/6)}
  /* герой */
  {const bl=p.inv>0&&Math.floor(t*14)%2;if(!bl){ctx.save();const py=p.y+E.PH/2-(S.bid===1?S.cam:0);ctx.translate(p.x,py);
    if(!GameSpark.draw(ctx,S,t,'arena',E)){ctx.fillStyle=col.tx;ctx.beginPath();ctx.roundRect?ctx.roundRect(-12,-12,24,24,7):ctx.rect(-12,-12,24,24);ctx.fill();ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(-4.5,-2,3,0,7);ctx.arc(4.5,-2,3,0,7);ctx.fill()}
    ctx.restore()}}
  /* речь Стража и Колосса */
  if(S.say){ctx.textAlign='center';ctx.font='600 12px '+(o.font||'sans-serif');const w=Math.min(W-24,ctx.measureText(S.say.txt).width+20);
   const by=Math.max(44,B.y-(S.bid===1?S.cam:0)+44);ctx.fillStyle='rgba(8,8,10,.85)';ctx.fillRect(W/2-w/2,by-16,w,24);ctx.fillStyle=col.tx;ctx.fillText(S.say.txt,W/2,by)}
  /* экран: HUD, управление */
  GameArt.arenaHud(ctx,S,W,H,t,{font:o.font,name:GameStory.bosses[S.bid-1].name,frac:B.hp/B.max});
  GameArt.joy(ctx,o.stk?o.stk.ox:62,o.stk?o.stk.oy:H-62,o.ax,!!o.stk);GameArt.jump(ctx,W-62,H-62,o.down);
  if(o.fx)o.fx()}


 return{draw}})();
