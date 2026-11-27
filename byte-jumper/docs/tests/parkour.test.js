/* Тест новых паркур-блоков (батут, хрупкий блок, провод, магнитная стена, портал-инвертор, потолочные шипы, ускоритель)
   без браузера: node docs/tests/parkour.test.js. Каждый блок проверяется в маленьком мире: своя полоса предметов, без генератора. */
const fs=require('fs'),path=require('path');const D=path.join(__dirname,'../../app/src/main/assets/features/game/');
const src=['engine.js','levels.js'].map(f=>fs.readFileSync(D+f,'utf8')).join('\n;\n');
const GE=new Function(src+';return GameEngine')();
const DT=1/60;let ok=0,bad=[];const c=(n,v)=>{v?(ok++,console.log('ok  ',n)):(bad.push(n),console.log('FAIL',n))};
/* мир: игрок в точке PX, предметы задаёт тест; генератор и ямы выключены */
/* frozen: мир почти не едет (для позиционных проверок), иначе едет с обычной скоростью */
function world(items,frozen){
 const S=GE.create({mode:'level',L:1,seed:1,W:360,H:640});
 S.items=items.map(o=>Object.assign({},o));S.pits=[];S.plats=[];S.genX=Infinity;S.x=0;S.locked=false;S.hearts=9;S.maxHearts=9;
 if(frozen){S.P.v0=1e-6;S.P.vmax=1e-6;S.P.acc=0}
 return S}
const pw=S=>S.x+S.px;
function run(S,n,inpAt){for(let i=0;i<n&&!S.over;i++){const inp=inpAt?inpAt(i):{};GE.step(S,DT,inp);S.ev.length=0}return S}
const gy=world([]).gy,PH=GE.PH,CEIL=GE.CEIL,PADV=GE.PADV;
/* 1. батут: падение на плиту подбрасывает примерно на 160 px */
{const S=world([{t:'pad',x:80,h:0,w:44}],true);S.p.y=gy-PH-100;S.p.vy=0;let minY=S.p.y;
 for(let i=0;i<90;i++){GE.step(S,DT,{});S.ev.length=0;minY=Math.min(minY,S.p.y)}
 const rise=(gy-PH)-minY;
 c('батут: подбрасывает на 140–180 px ('+Math.round(rise)+' px)',rise>=140&&rise<=180);
 c('батут: сердца не теряются',S.lost===0);}
/* 2. хрупкий блок сбоку: удар (сердце теряется), блок цел */
{const fr={t:'frag',x:120,h:0};const S=world([fr]);run(S,120);
 c('хрупкий блок сбоку: удар, сердце потеряно',S.lost>=1);
 c('хрупкий блок сбоку: блок не разбит',!fr.dead)}
/* 3. хрупкий блок снизу (прыжок головой): разбивается без урона */
{const S=world([{t:'frag',x:80,h:60}],true);let pressed=false;
 run(S,90,()=>{if(!pressed){pressed=true;return{pressed:true}}return{}});
 c('хрупкий блок снизу: разбит',!S.items.some(it=>it.t==='frag'));
 c('хрупкий блок снизу: без урона',S.lost===0)}
/* 4. хрупкий блок сверху (падение на куб): разбивается без урона */
{const S=world([{t:'frag',x:80,h:0}],true);S.p.y=gy-PH-150;S.p.vy=0;run(S,60);
 c('хрупкий блок сверху: разбит',!S.items.some(it=>it.t==='frag'));
 c('хрупкий блок сверху: без урона',S.lost===0)}
/* 5. световой провод: падая сверху, цепляется; скорость +25%; отцепляется на конце */
{const Yl=gy-90;const S=world([{t:'line',x:70,w:300,h:90}]);S.p.y=Yl-PH-60;S.p.vy=0;let attached=false,ratio=0,detached=false,rideN=0;
 for(let i=0;i<300;i++){const base=Math.min(S.P.v0+S.P.acc*S.x,S.P.vmax);GE.step(S,DT,{});S.ev.length=0;
  if(S.p.zip&&!attached){attached=true;continue}
  if(attached&&S.p.zip&&!ratio){ratio=S.speed/base}
  if(attached&&!S.p.zip){detached=true;break}}
 c('провод: цепляется, падая сверху',attached);
 c('провод: скорость +25% ('+ratio.toFixed(2)+')',ratio>1.2&&ratio<1.3);
 c('провод: отцепляется на конце',detached);
 c('провод: сердца не теряются',S.lost===0)}
/* 6. магнитная стена: в прыжке цепляется и сползает 1,2 с; стена потом пропадает */
{const S=world([{t:'mg',x:120,h:40}]);let cling=false;
 for(let i=0;i<150;i++){GE.step(S,DT,i===0?{pressed:true}:{});S.ev.length=0;if(S.p.cling>0)cling=true}
 c('магн. стена: цепляется в прыжке',cling);
 c('магн. стена: без урона при зацепе',S.lost===0);
 c('магн. стена: после сползания стена пропадает',!S.items.some(it=>it.t==='mg'))}
/* 7. портал-инвертор: касание переворачивает гравитацию; по потолку; потолочный шип бьёт, пол — нет */
{const S=world([{t:'inv',x:120,h:40,len:500,used:0},{t:'bug',x:330,h:0,big:false},{t:'spike',x:440,h:0,ceil:1}]);
 let flipped=false,onCeil=false,floorBugPassedLost=null;
 for(let i=0;i<600&&!S.over;i++){GE.step(S,DT,i===0?{pressed:true}:{});S.ev.length=0;
  if(S.p.flip)flipped=true;
  if(flipped&&S.p.flip&&S.p.y<=CEIL+1)onCeil=true;
  if(floorBugPassedLost===null&&pw(S)>=330+15)floorBugPassedLost=S.lost;
  if(!S.p.flip&&flipped)break}
 c('портал: переворачивает гравитацию',flipped);
 c('портал: Искра доходит до потолка',onCeil);
 c('портал: пол не бьёт, когда идёт по потолку',floorBugPassedLost===0);
 c('портал: потолочный шип бьёт',S.lost>=1)}
/* 8. ускоритель: по плите +40% к скорости и выше прыжок на 1,5 с */
{const S=world([{t:'bo',x:80,h:0,w:90}]);let boosted=false,ratio=0;
 for(let i=0;i<4;i++){GE.step(S,DT,{});S.ev.length=0;if(S.boost>0)boosted=true}
 const base=Math.min(S.P.v0+S.P.acc*S.x,S.P.vmax);GE.step(S,DT,{});S.ev.length=0;ratio=S.speed/base;
 c('ускоритель: включается при посадке',boosted);
 c('ускоритель: скорость +40% ('+ratio.toFixed(2)+')',ratio>1.35&&ratio<1.45);
 const S2=world([{t:'bo',x:80,h:0,w:90}]);let rise2=0;
 for(let i=0;i<4;i++){GE.step(S2,DT,{});S2.ev.length=0}
 let minY=S2.p.y;GE.step(S2,DT,{pressed:true});S2.ev.length=0;
 for(let i=0;i<90;i++){GE.step(S2,DT,{});S2.ev.length=0;minY=Math.min(minY,S2.p.y)}
 rise2=(gy-PH)-minY;
 const S3=world([]);let minY3=S3.p.y;GE.step(S3,DT,{pressed:true});S3.ev.length=0;
 for(let i=0;i<90;i++){GE.step(S3,DT,{});S3.ev.length=0;minY3=Math.min(minY3,S3.p.y)}
 const rise3=(gy-PH)-minY3;
 c('ускоритель: прыжок выше обычного ('+Math.round(rise2)+' против '+Math.round(rise3)+' px)',rise2>rise3*1.3)}
/* быстрое падение не пробивает пол */
{const S=world([],true);const gy=S.gy,PH=GE.PH;let hurt=0;
 for(const v of [900,1500,2500])for(const off of [0,7,15,23,31,39]){S.p.y=gy-PH-300-off;S.p.vy=v;S.p.on=false;S.p.stand=null;S.hearts=9;const h0=S.hearts;
  let sunk=0;for(let i=0;i<40;i++){GE.step(S,DT,{});if(S.ev.includes('fall'))sunk=1;if(S.p.y>gy-PH+2)sunk=1;S.ev.length=0}
  c('падение со скоростью '+v+' (сдвиг '+off+'): стоит на полу, не телепортирован, без урона',S.p.on&&Math.abs(S.p.y-(gy-PH))<1&&S.hearts===h0&&!sunk)}}
console.log('\nИТОГ: '+ok+' ок, '+bad.length+' провалов'+(bad.length?': '+bad.join('; '):''));
if(bad.length)process.exitCode=1;
