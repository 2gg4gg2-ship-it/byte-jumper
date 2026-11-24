/* Баланс уровней: node docs/tests/balance.js [L1,L2,...]
   Два бота с одинаковым поиском, но разными кнопками:
   - полный: тап и удержание (как бот в bot.js);
   - короткий: только тап (удержание запрещено).
   Если короткий бот проходит уровень, значит длинный прыжок там не нужен: уровень слишком лёгкий.
   Также считаются: окна без прыжка дольше 1,8 с (скука), число коротких/длинных прыжков, места, где короткий бот умирает (узкие места). */
const B=require('./bot.js'),GE=B.GE,GL=B.GL,DT=1/60;
function slice(S,a,allowHold){for(let f=0;f<5&&!S.over;f++){GE.step(S,DT,{pressed:a===1&&f===0,down:allowHold&&a>0});if(S.ev.includes('jump'))S.jn=(S.jn||0)+1;S.ev.length=0}}
function score(S){return(S.over==='win'?1e6:0)-S.lost*1e4-(S.over==='dead'?1e7:0)+S.x+S.bytes*.2+(S.p.on?30:0)+(S.found?500:0)}
function key(S){return[Math.round(S.p.y/2),Math.round(S.p.vy/40),S.p.on?1:0,S.lost,S.p.hold>0?1:0].join()}
function pick(S0,depth,width,allowHold){
 let beam=[{S:S0,first:[]}];
 for(let d=0;d<depth;d++){const next=[],seen=new Set();
  for(const b of beam){
   if(b.S.over){next.push(b);continue}
   for(const a of (allowHold?[0,1,2]:[0,1])){
    if(a===2&&!(b.S.p.vy<0)&&d>0)continue;
    const T=B.clone(b.S);slice(T,a,allowHold);const k=key(T)+','+(b.first[0]|0);
    if(seen.has(k))continue;seen.add(k);next.push({S:T,first:b.first.concat(a)})}}
  next.sort((x,y)=>score(y.S)-score(x.S));beam=next.slice(0,width)}
 return beam[0]}
function run(L,allowHold){
 const S=GE.create({mode:'level',L,seed:1,W:360,H:640});let n=0,jumps=[],lastJump=0,idle=0,dead=null;
 while(!S.over&&n<6000){
  if(S.locked){GE.step(S,DT,{});S.ev.length=0;n++;continue}
  const b=pick(S,11,10,allowHold);
  for(let i=0;i<3&&!S.over;i++){const j0=S.jn||0,x0=S.x;slice(S,b.first[i]||0,allowHold);for(let k=j0;k<(S.jn||0);k++)jumps.push({x:Math.round(x0),hold:(b.first[i]|0)>0&&allowHold})}
  n++}
 return {S,jumps}}
const Ls=(process.argv[2]||'31,32,33,34,35,36,37,38,39,41,42,43,44,45,46,47,48,49').split(',').map(Number);
const rows=[];
for(const L of Ls){
 const full=run(L,true);const tap=run(L,false);
 const idle=[];let lastT=0;
 // окна без прыжка: по времени между соседними прыжками полного бота
 const J=full.jumps;for(let i=1;i<J.length;i++){const dx=J[i].x-J[i-1].x;if(dx>0)idle.push(dx)}
 const maxGap=idle.length?Math.max(...idle):0;
 const F=GE.create({mode:'level',L,seed:1,W:360,H:640});const hz=F.items.filter(i=>['bug','wall','gate','hop','proj','zone'].includes(i.t)).length+F.pits.length;
 rows.push({L,full:full.S.over+'/'+full.S.lost,tap:tap.S.over+'/'+tap.S.lost,tapDiedAt:tap.S.over==='dead'||tap.S.lost>0?Math.round(tap.S.x):'-',hz,jumps:J.length,maxGapPx:Math.round(maxGap),tapOk:tap.S.over==='win'&&tap.S.lost===0,tapLost:tap.S.lost})}
for(const r of rows)console.log(r.L,'полный',r.full,'| короткий',r.tap,'на x',r.tapDiedAt,'| препятствий',r.hz,'| прыжков',r.jumps,'| макс. путь без прыжка',r.maxGapPx,'px',r.tapOk?'  ← ЛЁГКИЙ (короткий проходит)':'');
console.log('короткий бот проходит: '+rows.filter(r=>r.tapOk).length+' из '+rows.length);
if(process.argv.includes('--json'))console.log(JSON.stringify(rows));
