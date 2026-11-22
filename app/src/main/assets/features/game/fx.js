/* ===== ЭФФЕКТ «ПОМЕХИ»: с каждым побеждённым боссом на экране больше глюков ===== */
const GameFX=(()=>{
 /* силу даёт число побеждённых боссов: 0 → нет; 1 → еле заметно; 10 → экран почти рассыпается.
    Все кадры одной длины и считаются по времени, без выделения памяти: нагрузка почти нулевая. */
 const strength=n=>Math.max(0,Math.min(1,n/10));
 const BITS='01{}<>/;=#$%'.split('');
 function draw(ctx,W,H,t,n,col,q){
  const k=strength(n);if(k<=0)return;
  const cnt=Math.round((2+26*k*k)*(q||1));
  ctx.save();ctx.font='600 11px monospace';ctx.fillStyle=col;
  for(let i=0;i<cnt;i++){
   /* псевдослучайно, но привязано к времени: символ живёт ~0,4 с */
   const s=Math.floor(t*2.5+i*7.13),h=Math.sin(s*12.9898+i*78.233)*43758.5453,f=h-Math.floor(h);
   const g=Math.sin(s*4.1+i*9.7)*1e4,f2=g-Math.floor(g);
   ctx.globalAlpha=.06+.22*k*(1-((t*2.5+i*7.13)%1));
   ctx.fillText(BITS[Math.floor(f*BITS.length)],f2*W,f*H)}
  /* горизонтальные «рваные» полосы, чем сильнее, тем чаще */
  const bands=Math.floor(k*4*(q||1));
  for(let b=0;b<bands;b++){
   const ph=(t*.7+b*.37)%1;if(ph>.08+.12*k)continue;
   const y=((Math.sin(b*91.7+Math.floor(t*.7+b*.37)*13.1)*.5+.5))*H;
   ctx.globalAlpha=.10+.12*k;ctx.fillRect(0,y,W,2+k*5)}
  ctx.restore()}
 /* лёгкое дрожание холста при сильных помехах: возвращает сдвиг по X */
 const shake=(t,n)=>{const k=strength(n);return k<.5?0:(Math.sin(t*61)>.97?(k-.4)*8:0)};
 return{draw,shake,strength}})();
