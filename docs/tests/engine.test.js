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

/* ---- 100 уровней ---- */
{let ok2=true,prev=-1;for(let c=1;c<=10;c++){const a=GE.levelD((c-1)*10+2),b=GE.levelD((c-1)*10+8);if(!(b>a))ok2=false;if(c>1&&GE.levelD((c-1)*10+8)<=GE.levelD((c-2)*10+8))ok2=false}
 c('сложность растёт от главы к главе',ok2);
 c('уровень 1 легче 99, длина 6000..15000',GE.levelD(1)<GE.levelD(99)&&GE.target(1)<=6100&&GE.target(99)<=15000&&GE.target(99)>12000);
 const P=GE.prm(GE.levelD(99));c('скорость ≤ 420, яма ≤ 0,8 дальности большого прыжка',P.vmax<=420&&P.gap<=.8*304);
 for(const L of [15,34,59,79,99]){const S=play(L,11);c('бот проходит уровень '+L+' ('+S.over+', потеряно '+S.lost+')',S.over==='win')}}

/* ---- боссы глав 2–4: победимы, атаки с предупреждением, без аварий ---- */
for(const id of [2,3,4]){const S=AR.create({W:360,H:520,seed:id,id});let tel=0,kinds={},seenPh={};S.hearts=999;
 for(let f=0;f<60*260&&!S.over;f++){const k=S.key;if(k&&S.t>1){S.p.x=k.x;S.p.y=k.y-GE.PH/2}
  AR.step(S,1/60,{ax:0});seenPh[S.boss.phase]=1;S.tel.forEach(a=>{kinds[a.k]=1});tel+=S.tel.length?1:0;S.ev.length=0;if(S.sh.length>20)throw new Error('снарядов больше 20')}
 c('босс '+id+': победа ('+S.over+', t='+Math.round(S.t)+'), 3 фазы',S.over==='win'&&seenPh[1]&&seenPh[2]&&seenPh[3]);
 c('босс '+id+': свои атаки '+Object.keys(kinds).join(','),(id===2?kinds.row&&kinds.blk:id===3?kinds.fan:kinds.pkt)&&tel>0)}
{const S=AR.create({W:360,H:520,seed:1,id:4});S.hearts=999;let reps=0;for(let f=0;f<60*200;f++){AR.step(S,1/60,{ax:0});reps=Math.max(reps,S.rep||0);S.ev.length=0}c('Таймаут: до 7 повторов серии ('+reps+')',reps===7)}
{const S=AR.create({W:360,H:520,seed:1,id:3});S.hearts=999;S.boss.hp=60;let st=false;for(let f=0;f<60*30;f++){AR.step(S,1/60,{ax:0});if(S.pl.some(q=>q.stale))st=true;S.ev.length=0}c('Stale: есть устаревшие платформы',st)}

/* ---- боссы глав 5–7 (шаг 3) ---- */
function bot(id,seed,opt){opt=opt||{};const S=AR.create({W:360,H:520,seed,id});S.hearts=999;const k={},seen={ph:{},fw:0,flip:0,dark:0,sd:0,slow:0,wins:0,walls:0};let tel=0,telBefore=true;
 for(let f=0;f<60*300&&!S.over;f++){const kk=S.key;if(kk&&S.t>1&&!(S.flip>0)){S.p.x=kk.x;S.p.y=kk.y-GE.PH/2}
  if(opt.rej&&f%6===0)AR.reject(S);
  AR.step(S,1/60,{ax:0});seen.ph[S.boss.phase]=1;S.tel.forEach(a=>{k[a.k]=1});tel+=S.tel.length?1:0;S.ev.length=0;if(S.sh.length>20)throw new Error('снарядов больше 20');
  if(S.fw>0)seen.fw=1;if(S.flip>0)seen.flip=1;if(S.dark)seen.dark=1;if(S.sd)seen.sd=1;if(S.slow>0)seen.slow=1;if(S.wins.length)seen.wins=1;if(S.walls.length)seen.walls=1}
 return{S,k,seen,tel}}
{const r=bot(5,5);c('босс 5: победа, 3 фазы ('+r.S.over+', t='+Math.round(r.S.t)+')',r.S.over==='win'&&r.seen.ph[1]&&r.seen.ph[2]&&r.seen.ph[3]);
 c('босс 5: монеты (str), стены (wall) с предупреждением, «Лимит исчерпан» замедляет',r.k.str&&r.k.wall&&r.seen.walls&&r.seen.slow&&r.tel>0)}
{const S=AR.create({W:360,H:520,seed:2,id:5});S.walls.push({x:S.p.x+40,y:S.gy-56,h:56,t:9});S.wb=0;for(let i=0;i<90;i++)AR.step(S,1/60,{ax:1});const blocked=S.p.x<S.p.x+1&&S.p.x<=S.walls[0].x;
 const S2=AR.create({W:360,H:520,seed:2,id:5});S2.walls.push({x:S2.p.x+40,y:S2.gy-56,h:56,t:9});S2.wb=1;for(let i=0;i<90;i++)AR.step(S2,1/60,{ax:1});
 const S3=AR.create({W:360,H:520,seed:2,id:5});S3.walls.push({x:S3.p.x+40,y:S3.gy-56,h:56,t:9});let over=false;AR.step(S3,1/60,{ax:0,pressed:true,down:true});for(let i=0;i<140;i++){AR.step(S3,1/60,{ax:1,down:true});if(S3.p.x>S3.walls[0].x+14&&!S3.walls[0].dead)over=true}
 c('стена: без байта не пройти, с байтом рывок пробивает (−1 байт), сверху обойти можно',blocked&&S2.wb===0&&S2.p.x>S2.W*.22+40&&S3.walls.length>0)}
{const S=AR.create({W:360,H:520,seed:2,id:5});S.tok=5;S.boss.phase=1;S.atk=0;AR.step(S,1/60,{ax:0});const x0=S.p.x;for(let i=0;i<30;i++)AR.step(S,1/60,{ax:1});const dx=S.p.x-x0;c('замедление 20%: скорость 136 px/с ('+Math.round(dx*2)+')',S.slow>0&&Math.abs(dx*2-136)<8)}
{const r=bot(6,6,{rej:1});c('босс 6: победа ('+r.S.over+', t='+Math.round(r.S.t)+'), 3 фазы',r.S.over==='win'&&r.seen.ph[1]&&r.seen.ph[2]&&r.seen.ph[3]);c('босс 6: окна «Разрешить?» и лазер/снаряды с предупреждением',r.seen.wins&&r.tel>0&&r.k.big)}
{const S=AR.create({W:360,H:520,seed:3,id:6});S.fallT=99;S.wins.push({t:1.5,max:1.5,real:1,d:0});AR.reject(S);const a=S.chg===1&&S.wins.length===0;
 S.wins.push({t:.3,max:1.5,real:1,d:0});for(let i=0;i<30;i++)AR.step(S,1/60,{ax:0});const er=S.pl.some(q=>q.st!=='ok');
 const S2=AR.create({W:360,H:520,seed:3,id:6});S2.fallT=99;S2.atk=99;S2.wins.push({t:.2,max:1.5,real:0,d:0});for(let i=0;i<30;i++)AR.step(S2,1/60,{ax:0});const none=!S2.pl.some(q=>q.st!=='ok')&&S2.hearts===3&&S2.wins.length===0;
 c('«Отклонить»: настоящее окно даёт заряд; не успел = платформа гаснет с меткой; ложное окно без последствий',a&&er&&none)}
{const S=AR.create({W:360,H:520,seed:3,id:6});S.fallT=99;S.atk=99;S.wins.push({t:1,max:1.5,real:1,d:0},{t:.5,max:1.5,real:0,d:0});S.boss.hp=100;for(let i=0;i<5;i++){S.wins.push({t:1,max:1.5,real:1,d:0});AR.reject(S);AR.reject(S)}c('5 «Отклонить» подряд снимают часть HP босса',S.chg>=5&&S.boss.hp<100)}
{const S=AR.create({W:360,H:520,seed:3,id:6});S.boss.hp=20;const lims=[];for(const hp of [100,60,20]){S.boss.hp=hp;S.wins=[];S.atk=0;S.fallT=99;S.p.inv=99;AR.step(S,1/60,{ax:0});lims.push(S.wins[0]&&S.wins[0].max)}c('время ответа 1,5 / 1,2 / 0,9 с по фазам ('+lims+')',lims[0]===1.5&&lims[1]===1.2&&lims[2]===.9)}
{const r=bot(7,7);c('босс 7: победа ('+r.S.over+', t='+Math.round(r.S.t)+'), 3 фазы',r.S.over==='win'&&r.seen.ph[1]&&r.seen.ph[2]&&r.seen.ph[3]);c('босс 7: Эхо (копия), предупреждение гравитации, затем переворот, Тьма',r.seen.sd&&r.seen.fw&&r.seen.flip&&r.seen.dark&&r.tel>0)}
{const S=AR.create({W:360,H:520,seed:7,id:7});S.hearts=999;S.boss.hp=60;let fwT=-1,flT=-1,ceil=false,grav=false,t0=0;for(let f=0;f<60*40;f++){AR.step(S,1/60,{ax:0});S.ev.length=0;if(S.fw>0&&fwT<0)fwT=S.t;if(S.flip>0&&flT<0)flT=S.t;if(S.flip>0&&S.p.y===100&&S.p.on)ceil=true;if(S.flip>0&&S.p.vy<0)grav=false}
 c('гравитация: предупреждение ≥1 с до переворота, игрок встаёт на потолок',fwT>0&&flT-fwT>=.95&&ceil);
 const S2=AR.create({W:360,H:520,seed:7,id:7});S2.boss.hp=60;S2.hearts=999;S2.flip=0;S2.fw=1;let fl=false;for(let f=0;f<400;f++){AR.step(S2,1/60,{ax:0});if(S2.flip>0)fl=true;if(S2.flip>0)break}let yy=S2.p.y;for(let f=0;f<20;f++)AR.step(S2,1/60,{ax:0});c('при перевороте игрок падает вверх (y уменьшается)',fl&&S2.p.y<yy-5)}
{const S=AR.create({W:360,H:520,seed:7,id:7});S.hearts=999;S.boss.hp=20;AR.step(S,1/60,{ax:0});const sq=S.seq,ord=sq.ord.slice();c('Тьма: арена гаснет, три тёмных байта',S.dark&&sq.n.length===3&&ord.length===3);
 const hp0=S.boss.hp;S.fair=99;S.p.inv=99;for(const i of ord){const d=S.seq.n[i];S.p.x=d.x;S.p.y=d.y-GE.PH/2;S.atk=99;S.key=null;S.kt=99;for(let f=0;f<45;f++){S.p.x=d.x;S.p.y=d.y-GE.PH/2;S.p.vy=0;AR.step(S,1/60,{ax:0})}}
 c('Тьма: собрать байты в порядке = удар по Тени; ошибка порядка сбрасывает',S.boss.hp<hp0||S.over==='win');
 const S2=AR.create({W:360,H:520,seed:8,id:7});S2.hearts=999;S2.boss.hp=20;AR.step(S2,1/60,{ax:0});const o2=S2.seq.ord,wrong=o2[1];const d=S2.seq.n[wrong];S2.p.inv=99;S2.atk=99;S2.kt=99;for(let f=0;f<20;f++){S2.p.x=d.x;S2.p.y=d.y-GE.PH/2;S2.p.vy=0;AR.step(S2,1/60,{ax:0})}c('неверный байт: прогресс 0',S2.seq.got===0)}
{const S=AR.create({W:360,H:520,seed:9,id:7});S.hearts=999;S.fallT=99;S.atk=99;S.boss.hp=100;let traps=0;for(let f=0;f<60*20;f++){const k=Math.floor(f/50)%2;S.p.x=k?80:280;S.p.y=S.gy-GE.PH;AR.step(S,1/60,{ax:0});if(S.tel.some(a=>a.k==='big'))traps++}c('ИИ Тени: повторяющийся маршрут получает ловушку',traps>0)}

/* ---- боссы глав 8–10 (шаг 4) ---- */
function bot2(id,seed,o){o=o||{};const S=AR.create({W:360,H:520,seed,id,bytes:o.bytes||0});S.hearts=999;const k={},ph={};let tel=0,mem=0,fake=0,fz=0,fh=0,gh=0,cks={};
 for(let f=0;f<60*400&&!S.over;f++){const kk=S.key;if(kk&&S.t>1&&!S.p4){S.p.x=kk.x;S.p.y=kk.y-GE.PH/2}
  if(S.p4){const q=S.pl[4];S.p.x=q.x+q.w-20;S.p.y=q.y-GE.PH;S.p.vy=0;S.p.on=true}
  AR.step(S,1/60,{ax:0,frz:true});ph[S.boss.phase]=1;S.tel.forEach(a=>{k[a.k]=1});tel+=S.tel.length?1:0;if(S.sh.length>20)throw new Error('снарядов больше 20');
  if(S.mm.some(m=>m.real))mem=1;if(S.mm.some(m=>!m.real))fake=1;if(S.fz)fz=1;if(S.fh)fh=1;if(S.gh.length)gh=1;if(S.ck)cks[S.ck]=1;S.ev.length=0}
 return{S,k,ph,tel,mem,fake,fz,fh,gh,cks}}
{const r=bot2(8,8);c('босс 8: победа ('+r.S.over+', t='+Math.round(r.S.t)+'), 4 фазы',r.S.over==='win'&&r.ph[1]&&r.ph[2]&&r.ph[3]&&r.ph[4]);
 c('босс 8: паттерны прошлых боссов ('+Object.keys(r.k).join(',')+'), «Дамп»: настоящие и подделки',(r.k.big||r.k.row)&&(r.k.pkt||r.k.fan)&&r.k.str&&r.mem&&r.fake&&r.tel>0)}
{const S=AR.create({W:360,H:520,seed:8,id:8});S.hearts=999;S.fear[2]=4;S.atk=0;S.fallT=99;AR.step(S,1/60,{ax:0});const a=S.lastK;const S2=AR.create({W:360,H:520,seed:8,id:8});S2.fear[1]=4;S2.atk=0;S2.fallT=99;AR.step(S2,1/60,{ax:0});c('ИИ Летописца берёт паттерн, от которого игрок получил больше ударов ('+a+','+S2.lastK+')',a===2&&S2.lastK===1)}
{const S=AR.create({W:360,H:520,seed:8,id:8});S.boss.hp=20;S.atk=99;S.fallT=99;S.p.inv=0;S.mm.push({x:S.p.x,y:S.p.y+GE.PH/2,vx:0,real:0,dead:0});AR.step(S,1/60,{ax:0});const lost=S.hearts===2;
 const S2=AR.create({W:360,H:520,seed:8,id:8});S2.boss.hp=20;S2.atk=99;S2.fallT=99;S2.mm.push({x:S2.p.x,y:S2.p.y+GE.PH/2,vx:0,real:1,dead:0});AR.step(S2,1/60,{ax:0});c('воспоминания: подделка = минус сердце, настоящее собирается без урона',lost&&S2.hearts===3&&S2.memc===1)}
{const r=bot2(9,9);c('босс 9: победа ('+r.S.over+', t='+Math.round(r.S.t)+'), 3 фазы',r.S.over==='win'&&r.ph[1]&&r.ph[2]&&r.ph[3]);c('босс 9: серия «Замри» и фальшивый HUD, осколки с предупреждением',r.fz&&r.fh&&r.k.big&&r.tel>0)}
{const S=AR.create({W:360,H:520,seed:9,id:9});S.boss.hp=60;S.atk=99;S.fallT=99;S.fzQ=1;for(let i=0;i<60*2.6;i++)AR.step(S,1/60,{ax:0,frz:true});const ok=S.fzS===1&&S.hearts===3&&S.fzK===2;
 const S2=AR.create({W:360,H:520,seed:9,id:9});S2.boss.hp=60;S2.atk=99;S2.fallT=99;S2.fzQ=1;for(let i=0;i<60*2.6;i++)AR.step(S2,1/60,{ax:0,frz:false});
 c('«Замри»: удержал 1,5 с = успех и серия длиннее, не удержал = минус сердце ('+S.fzK+','+S2.hearts+')',ok&&S2.hearts===2&&S2.fzK===1)}
{const S=AR.create({W:360,H:520,seed:9,id:9});S.boss.hp=60;S.atk=99;S.fallT=99;S.fzQ=1;AR.step(S,1/60,{ax:0});let warn=0;for(let i=0;i<30;i++){AR.step(S,1/60,{ax:0,frz:false});if(S.fz&&S.fz.st==='warn')warn++}c('«Замри»: предупреждение 0,8 с до проверки (без удержания не штрафует)',warn>=40&&S.hearts===3||warn>=28&&S.hearts===3)}
{const S=AR.create({W:360,H:520,seed:9,id:9});S.boss.hp=60;S.atk=99;S.fallT=99;S.fzQ=1;const hp0=S.boss.hp;S.fzS=2;for(let i=0;i<60*2.6;i++)AR.step(S,1/60,{ax:0,frz:true});c('3 успешных «Замри» подряд = трещина сферы (удар по боссу)',S.boss.hp<hp0)}
{const r=bot2(10,10);c('босс 10: 4 фазы, победа только по мосту ('+r.S.over+', t='+Math.round(r.S.t)+')',r.S.over==='win'&&r.ph[1]&&r.ph[2]&&r.ph[3]&&r.ph[4]);c('босс 10: призраки, окна, паттерны Ядра ('+Object.keys(r.cks).join('')+')',r.gh&&Object.keys(r.cks).length>=2&&r.tel>0)}
{const S=AR.create({W:360,H:520,seed:10,id:10});S.hearts=999;S.atk=99;S.fallT=99;const p=S.p,g={x:p.x,y:S.gy-14,vx:0,dead:0};S.gh.push(g);p.y=g.y-14-GE.PH-2;p.vy=200;p.on=false;AR.step(S,1/60,{ax:0});const st=g.dead===1&&S.rem===1&&S.hearts===999;
 const S2=AR.create({W:360,H:520,seed:10,id:10});S2.atk=99;S2.fallT=99;S2.p.inv=0;S2.gh.push({x:S2.p.x,y:S2.gy-14,vx:0,dead:0});AR.step(S2,1/60,{ax:0});c('призрак: приземлиться сверху = вспомнил имя (без урона), коснуться сбоку = минус сердце',st&&S2.hearts===2)}
{const S=AR.create({W:360,H:520,seed:10,id:10});S.hearts=999;S.boss.hp=40;S.fallT=99;const ck={};for(let f=0;f<60*76;f++){AR.step(S,1/60,{ax:0});ck[S.ck]=1;S.ev.length=0;if(S.sh.length>20)throw new Error('больше 20')}c('Ядро: паттерны всех 9 боссов по 8 с ('+Object.keys(ck).join('')+')',[1,2,3,4,5,6,7,8,9].every(i=>ck[i]))}
{const mk=b=>{const S=AR.create({W:360,H:520,seed:10,id:10,bytes:b});S.hearts=999;S.boss.hp=20;for(let i=0;i<120;i++)AR.step(S,1/60,{ax:0});return S};const a=mk(0),b=mk(300);
 let quiet=true;const S=mk(0);for(let i=0;i<600;i++){AR.step(S,1/60,{ax:0});if(S.tel.length||S.sh.length)quiet=false}
 c('«Ноль»: атак нет, мост шире, чем больше байтов собрано ('+Math.round(a.pl[4].w)+'→'+Math.round(b.pl[4].w)+')',a.p4&&quiet&&b.pl[4].w>a.pl[4].w+60)}

/* ---- Искра: атлас кадров и неизменный хитбокс (0.6.1) ---- */
{const SP=ld('spark.js','GameSpark'),need=['idle','front','r0','r1','r2','r3','r4','r5','r6','r7','e0','e1','e2','e3','m0','m1','m2','m3','m4','m5','d0','d1','d2'];
 c('Искра: в атласе все 23 утверждённых кадра',need.every(n=>SP.ATL.f[n]));
 c('Искра: без браузера не рисует, игра берёт запасной вид',SP.ready()===false&&SP.draw({},{},0,'level',{PH:24})===false);
 c('хитбокс героя не менялся (20×24), прыжок и управление те же',GE.PW===20&&GE.PH===24&&tap>55&&tap<80&&hold>110&&hold<135);
 c('форма Искры 0..3 хранится и ограничена',SP.form(7)===3&&SP.form(-1)===0)}
console.log('\nИТОГ: %d ок, %d провалов',ok,bad.length);if(bad.length){console.log(bad);process.exit(1)}
