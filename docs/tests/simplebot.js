/* Простой бот (контроль сложности): видит только ближайшую опасность впереди и ставит один тап, когда она ближе 95 px.
   Не держит прыжок, не планирует, не знает про батуты, провода, порталы и потолок. Уровни 1–5 он проходить не должен. */
const fs=require('fs'),path=require('path');
const D=path.join(__dirname,'../../app/src/main/assets/features/game/');
const lib=new Function(fs.readFileSync(D+'engine.js','utf8')+';'+fs.readFileSync(D+'levels.js','utf8')+';return {GE:GameEngine,GL:GameLevels}')();
const GE=lib.GE,DT=1/60,HZ=['bug','spike','wall','gate','frag','mg','hop','proj','laser','drop','mov','saw'];
function run(L,seed,look){
 look=look||95;const S=GE.create({mode:'level',L,seed:seed||1,W:360,H:640});let n=0;
 while(!S.over&&n<9000){
  if(S.locked){GE.step(S,DT,{});S.ev.length=0;n++;continue}
  const pw=S.x+S.px;let near=1e9;
  for(const it of S.items){if(!HZ.includes(it.t)||it.dead)continue;const d=it.x-pw;if(d>-10&&d<near)near=d}
  for(const q of S.pits){const d=q.a-pw;if(d>-10&&d<near)near=d}
  const tap=S.p.on&&near<look;
  GE.step(S,DT,{pressed:tap,down:tap});S.ev.length=0;n++}
 return S}
module.exports={run};
if(require.main===module){for(const L of process.argv.slice(2).map(Number)){const S=run(L,1);console.log('L'+L,S.over||'timeout','lost',S.lost,'x',Math.round(S.x)+'/'+Math.round(S.target))}}
