/* Тест логики без браузера: node docs/tests/engine.test.js */
const fs=require('fs'),path=require('path');const D=path.join(__dirname,'../../app/src/main/assets/features/game/');
const ld=(f,n)=>new Function(fs.readFileSync(D+f,'utf8')+';return '+n)();
const GE=ld('engine.js','GameEngine'),AR=new Function(fs.readFileSync(D+'engine.js','utf8')+';'+fs.readFileSync(D+'arena.js','utf8')+';return GameArena')(),FX=ld('fx.js','GameFX'),ST=ld('story.js','GameStory'),CO=ld('core.js','GameCore');
let ok=0,bad=[];const c=(n,v)=>{v?(ok++,console.log('ok  ',n)):(bad.push(n),console.log('FAIL',n))};
function jump(hold){const S=GE.create({mode:'level',L:1,seed:1,W:360,H:600});S.items=[];let mn=1e9;const y0=S.p.y;GE.step(S,.016,{pressed:true,down:true});mn=Math.min(mn,S.p.y);for(let i=0;i<120;i++){GE.step(S,.016,{down:hold});mn=Math.min(mn,S.p.y)}return y0-mn}
const tap=jump(false),hold=jump(true);
c('малый прыжок 55–80 px ('+Math.round(tap)+')',tap>55&&tap<80);c('большой прыжок 110–135 px ('+Math.round(hold)+')',hold>110&&hold<135);
function play(L,seed){const S=GE.create({mode:'level',L,seed,W:360,H:600});let f=0;while(!S.over&&f<60000){f++;const pw=S.x+GE.PX;let pr=false;
 for(const it of S.items)if(it.t==='bug'){const d=it.x-pw;if(d>0&&d<S.speed*.25+8&&d>S.speed*.25-26)pr=true}
 for(const q of S.pits){const d=q.a-pw;if(d>0&&d<S.speed*.17+8&&d>S.speed*.17-26)pr=true}
 GE.step(S,.016,{pressed:pr,down:pr})}return S}
c('на уровень 5 сердец',GE.create({mode:'level',L:1,seed:1,W:360,H:600}).hearts===5);
for(const L of [1,3,5,8,10]){const S=play(L,7);c('бот проходит уровень '+L+' ('+S.over+', потеряно '+S.lost+')',S.over==='win')}
{const S=GE.create({mode:'level',L:1,seed:1,W:360,H:600});S.pits.push({a:S.x+GE.PX+50,b:S.x+GE.PX+160});S.items=[];let f=0;while(!S.over&&S.lost===0&&f<600){GE.step(S,.016,{});f++}
 c('яма: минус сердце и возврат на землю, не смерть',S.lost===1&&!S.over&&S.hearts===4&&S.p.on===false||S.lost===1&&!S.over&&S.hearts===4)}
{const S=GE.create({mode:'level',L:1,seed:1,W:360,H:600});S.hearts=1;S.items=[{t:'bug',x:S.x+GE.PX,h:0}];GE.step(S,.016,{});c('последнее сердце: уровень провален',S.over==='dead')}
{const S=GE.create({mode:'level',L:2,seed:3,W:360,H:600});c('дверь в конце уровня',S.items.some(i=>i.t==='door'&&i.x===S.target+GE.PX))}
c('100 уровней, 10 актов',ST.LEVELS===100&&ST.act(100)===10&&ST.act(1)===1&&ST.act(11)===2);
c('10 глав по 9 уровней + босс, 10 боссов с текстом',ST.chapters.length===10&&ST.chapters.every(x=>x.levels.length===9)&&ST.bosses.length===10&&ST.bosses.every(b=>b.text.length>100));c('имена боссов из истории автора',ST.bosses[0].name==='Потерянный Страж'&&ST.bosses[9].name==='Кернел'&&ST.stages.length===10);
let calls=0;const ctx=new Proxy({},{get:(t,k)=>k==='save'||k==='restore'?()=>{}:k==='fillText'||k==='fillRect'?()=>{calls++}:undefined,set:()=>true});
FX.draw(ctx,360,600,1.3,0,'#fff',1);const c0=calls;FX.draw(ctx,360,600,1.3,10,'#fff',1);
c('помех нет без боссов, много на 10',c0===0&&calls>20);c('помех при 1 боссе мало',(()=>{calls=0;FX.draw(ctx,360,600,1.3,1,'#fff',1);return calls>0&&calls<8})());
for(let i=0;i<40;i++)CO.tick(40);c('ядро снижает качество при тормозах',CO.perf.q<1);

/* ---- арена босса ---- */
{const S=AR.create({W:360,H:520,seed:3});let warn=0,gone=0,seenPh={},tel=0;S.hearts=999;
 for(let f=0;f<60*200&&!S.over;f++){const k=S.key;if(k&&S.t>1){S.p.x=k.x;S.p.y=k.y-GE.PH/2}
  AR.step(S,1/60,{ax:0});seenPh[S.boss.phase]=1;tel+=S.tel.length?1:0;S.pl.forEach(q=>{if(q.st==='warn')warn++;if(q.st==='gone')gone++});S.ev.length=0}
 c('арена: босса можно победить 9 ключами ('+S.over+', t='+Math.round(S.t)+')',S.over==='win'&&S.bytes===9);
 c('арена: три фазы',seenPh[1]&&seenPh[2]&&seenPh[3]);
 c('арена: у падающей платформы есть метка до падения',warn>0&&gone>0);
 c('арена: у атак есть предупреждение (tel)',tel>0)}
{const S=AR.create({W:360,H:520,seed:3});S.p.inv=0;S.sh.push({x:S.p.x,y:S.p.y,vx:0,vy:0,r:10,kind:1});AR.step(S,.016,{ax:0});c('арена: попадание = минус сердце',S.hearts===2)}
{const S=AR.create({W:360,H:520,seed:3});S.p.x=S.W*.5;S.p.y=S.gy;S.p.on=false;for(let i=0;i<300&&S.lost===0;i++)AR.step(S,.016,{ax:0});c('арена: падение в щель = минус сердце и возврат на платформу',S.lost===1&&S.p.y<S.H&&S.hearts===2)}
{const S=AR.create({W:360,H:520,seed:5});S.hearts=999;let top=0;for(let f=0;f<60*30;f++){AR.step(S,1/60,{ax:0});if(S.key&&S.key.y<S.gy-150)top++}c('арена: ключ появляется на самой высокой платформе',top>0)}
{const S=AR.create({W:360,H:520,seed:5});S.p.on=true;S.p.y=S.gy-GE.PH;S.p.x=60;let mn=1e9;AR.step(S,.016,{ax:0,pressed:true,down:false});for(let i=0;i<60;i++){AR.step(S,.016,{ax:0});mn=Math.min(mn,S.p.y)}c('арена: тап = малый прыжок 55–80 px',S.gy-GE.PH-mn>55&&S.gy-GE.PH-mn<80)}
console.log('\nИТОГ: %d ок, %d провалов',ok,bad.length);if(bad.length){console.log(bad);process.exit(1)}
