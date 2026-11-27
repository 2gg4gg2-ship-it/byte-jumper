/* Тест-бот для уровней: поиск лучом по макро-действиям (отпустить / нажать / держать), шаг 5 кадров, горизонт 0,75 с.
   Не знает сценария, видит только состояние движка. Если бот проходит без урона, уровень проходим тапом и удержанием. */
const fs=require('fs'),path=require('path');
const D=path.join(__dirname,'../../app/src/main/assets/features/game/');
const lib=new Function(fs.readFileSync(D+'engine.js','utf8')+';'+fs.readFileSync(D+'levels.js','utf8')+';return {GE:GameEngine,GL:GameLevels}')();
const GE=lib.GE,GL=lib.GL,DT=1/60;
function clone(S){
 const o=Object.assign({},S);o.p=Object.assign({},S.p);
 const mp=new Map();o.items=S.items.filter(i=>i.x<S.x+1100).map(i=>{const c=Object.assign({},i);mp.set(i,c);return c});o.p.zip=S.p.zip?(mp.get(S.p.zip)||null):null;o.p.clingIt=S.p.clingIt?(mp.get(S.p.clingIt)||null):null;
 o.plats=S.plats.map(q=>Object.assign({},q));
 if(S.p.stand)o.p.stand=o.plats[S.plats.indexOf(S.p.stand)]||null;
 o.ev=[];o.note=S.note?Object.assign({},S.note):null;return o}
function slice(S,a){for(let f=0;f<5&&!S.over;f++){GE.step(S,DT,{pressed:a===1&&f===0,down:a>0});S.ev.length=0}}
function score(S){return(S.over==='win'?1e6:0)-S.lost*1e4-(S.over==='dead'?1e7:0)+S.x+S.bytes*.2+(S.p.on?30:0)+(S.found?500:0)}
function key(S){return[Math.round(S.p.y/2),Math.round(S.p.vy/40),S.p.on?1:0,S.lost,S.p.hold>0?1:0].join()}
function pick(S0,depth,width){
 let beam=[{S:S0,first:[]}];
 for(let d=0;d<depth;d++){const next=[],seen=new Set();
  for(const b of beam){
   if(b.S.over){next.push(b);continue}
   for(const a of [0,1,2]){
    if(a===2&&!(b.S.p.vy<0)&&d>0)continue;
    const T=clone(b.S);slice(T,a);const k=key(T)+','+(b.first[0]|0);
    if(seen.has(k))continue;seen.add(k);next.push({S:T,first:b.first.concat(a)})}}
  next.sort((x,y)=>score(y.S)-score(x.S));beam=next.slice(0,width)}
 return beam[0]}
function run(L,seed,opt){
 opt=opt||{};const N=opt.lag|0,S=GE.create({mode:'level',L,seed:seed||1,W:opt.W||360,H:opt.H||640}),q=[];let n=0;
 /* opt.look и opt.wide — глубина (в шагах по 5 кадров) и ширина луча: «дальше видеть»; по умолчанию 11 и 10. opt.lag — задержка ввода в кадрах (2 кадра ≈ 33 мс): бот планирует без неё, а нажатия доходят позже, как у живого игрока */
 const real=(pr,dn)=>{q.push({pressed:pr,down:dn});const a=q.length>N?q.shift():{pressed:false,down:false};GE.step(S,DT,a);S.ev.length=0};
 while(!S.over&&n<6000){
  if(S.locked){if(N)real(false,false);else{GE.step(S,DT,{});S.ev.length=0}n++;continue}
  const b=pick(S,opt.look||11,opt.wide||10);
  if(N){for(let i=0;i<3&&!S.over;i++){const a=b.first[i]||0;for(let f=0;f<5&&!S.over;f++)real(a===1&&f===0,a>0)}}
  else for(let i=0;i<3&&!S.over;i++){slice(S,b.first[i]||0)}
  n++}
 return S}
module.exports={run,GE,GL,clone,slice};
if(require.main===module){const Ls=process.argv.slice(2).map(Number);for(const L of Ls){const t=Date.now(),S=run(L,1);console.log('L'+L,S.over,'lost',S.lost,'hearts',S.hearts,'bytes',S.bytes+'/'+S.spawned,'lostfound',S.found,'t',Math.round(S.t)+'s','calc',Date.now()-t+'ms')}}
