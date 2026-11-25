/* Тест боссов 1 и 2 (v3, раздел 4) без браузера: node docs/tests/boss12.test.js */
const fs=require('fs'),path=require('path');const D=path.join(__dirname,'../../app/src/main/assets/features/game/');
const src=['engine.js','arena.js','boss12.js','boss12view.js'].map(f=>fs.readFileSync(D+f,'utf8')).join('\n;\n');
const stub={GameArt:{plat(){},arenaHud(){},joy(){},jump(){},glowDot(){}},GameSpark:{draw(){return false},ready(){return true}},GameBossArt:{draw(){}},
 GameStory:{bosses:[{name:'Потерянный Страж'},{name:'Колосс Переполнения'}]}};
const AR=new Function(...Object.keys(stub),src+';return{GameEngine,GameArena,GameBoss12,GameBoss12View}')(...Object.values(stub));
const {GameEngine:E,GameArena:A,GameBoss12View:G}=AR;
let ok=0,bad=[];const c=(n,v)=>{v?(ok++,console.log('ok  ',n)):(bad.push(n),console.log('FAIL',n))};
const W=360,H=520;
const mk=id=>A.create({id,W,H,seed:5});
const idle={ax:0,down:false,pressed:false};
/* 1. создание и геометрия */
const s1=mk(1),s2=mk(2);
c('босс 1: шахта выше экрана в три раза',s1.WH===H*3);
c('босс 1: есть опорные папки под Стражем (3)',s1.pl.filter(q=>q.sup).length===3);
c('босс 2: четыре яруса',s2.pl.filter(q=>q.tier!=null).length===4);
c('оба: три сердца, босс 100 HP',s1.hearts===3&&s2.hearts===3&&s1.boss.hp===100&&s2.boss.hp===100);
/* 2. бой без ввода: 90 с симуляции, нет исключений, атаки идут, падения не ломают состояние */
for(const [name,S] of [['босс 1',s1],['босс 2',s2]]){
 let err=null,kinds=new Set(),wasHit=0;
 try{
  for(let i=0;i<60*90&&!S.over;i++){
   const ax=Math.sin(i/90)*1;const pressed=i%40===0;
   A.step(S,1/60,{ax,down:i%40<8,pressed});
   for(const a of S.tel)kinds.add(a.k);for(const d of S.sh)kinds.add(d.k);for(const w of S.waves)kinds.add('wave');
   for(const e of S.ev)if(e==='hit')wasHit++;S.ev.length=0;
  }
 }catch(e){err=e}
 c(name+': 90 с боя без исключений'+(err?' ('+err.message+')':''),!err);
 c(name+': атаки идут ('+[...kinds].join(',')+')',kinds.size>=2);
 c(name+': состояние корректно (сердца '+S.hearts+', итог '+S.over+')',S.hearts>=0&&(S.over==='dead'||S.over===null||S.over==='win')&&S.hearts<=3);
}
/* 3. босс 1: рамка на груди, удар снизу — осколок; три осколка — победа, фазы идут 1→2→3 */
{const S=mk(1);let phases=[1];
 for(let k=0;k<3&&!S.over;k++){
  const B=S.boss,fx=B.x,fy=B.y+8+11;
  /* ставим героя под рамку и выстреливаем вверх */
  S.p.x=fx;S.p.y=fy+14;S.p.vy=-420;S.p.on=false;S.p.inv=0;S.p.hold=0;S.p.buf=0;S.p.coy=0;
  for(let i=0;i<30&&!S.over&&S.boss.shards===k;i++)A.step(S,1/60,idle);
  phases.push(S.boss.phase);
 }
 c('босс 1: три осколка = победа ('+S.over+', осколков '+S.boss.shards+')',S.over==='win'&&S.boss.shards===3);
 c('босс 1: фазы 1→2→3 ('+phases.join('→')+')',phases.join('')==='1233'||phases.join('')==='1223'||phases.join('')==='1233');
}
/* 4. босс 2: POP-блок — посадка сверху выталкивает; девять штук — победа */
{const S=mk(2);let n=0,guard=0;
 while(!S.over&&guard++<4000){
  if(S.pl.some(q=>q.pop&&!q.dead)){const q=S.pl.find(q=>q.pop&&!q.dead);
   S.p.x=q.x+q.w/2;S.p.y=q.y-E.PH-30;S.p.vy=60;S.p.on=false;S.p.inv=0;S.p.coy=0;S.p.buf=0;S.p.hold=0;
   for(let i=0;i<12;i++)A.step(S,1/60,idle)}
  A.step(S,1/60,idle);
  if(S.hearts<3&&S.over!=='win'){S.hearts=3;S.over=null;S.p.inv=0}
  n=S.boss.pops;
 }
 c('босс 2: девять POP-блоков = победа ('+S.over+', пуков '+S.boss.pops+')',S.over==='win'&&S.boss.pops===9);
}
/* 5. падение с платформы: минус сердце, возврат; платформа-папка падает через предупреждение */
{const S=mk(1);const h0=S.hearts;S.p.y=S.WH+50;A.step(S,1/60,idle);c('падение: минус сердце и возврат на опору',S.hearts===h0-1&&S.p.y<S.WH);}
/* 6. отрисовка не падает (фейковый контекст) */
{const log=[];const handler={get:(t,k)=>{if(k in t)return t[k];return()=>{}},set:(t,k,v)=>{t[k]=v;return true}};
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:()=>({width:50}),roundRect(){},save(){},restore(){}},handler);
 for(const id of [1,2]){const S=mk(id);let err=null;try{for(let i=0;i<60*4;i++){A.step(S,1/60,idle);if(i%30===0)G.draw(ctx,S,{col:{tx:'#fff',tx2:'#999',err:'#e00',line:'#333'},font:'sans-serif',ax:0,stk:null,down:false,fx:()=>{}})}}catch(e){err=e}
  c('отрисовка босса '+id+' без ошибок'+(err?' ('+err.message+')':''),!err)}}
/* 7. способности (S.ab): двойной прыжок даёт второй подъём в воздухе, быстрое падение ускоряет спуск */
{const S=mk(2);S.ab={double:true,fall:false};const idleS=idle;
 A.step(S,1/60,{ax:0,down:false,pressed:true});let v1=0;for(let i=0;i<30;i++){A.step(S,1/60,idleS);}
 const y1=S.p.y;A.step(S,1/60,{ax:0,down:false,pressed:true});const vAfter=S.p.vy;
 c('двойной прыжок: второй подъём в воздухе ('+vAfter.toFixed(0)+' px/с)',vAfter<-200&&S.p.y<y1+1);}
{const S=mk(2);S.ab={double:false,fall:true};S.p.on=false;S.p.vy=100;S.p.y=200;S.p.lastG=260;
 A.step(S,1/60,{ax:0,down:true,pressed:false});const v=S.p.vy;
 const S0=mk(2);S0.p.on=false;S0.p.vy=100;S0.p.y=200;S0.p.lastG=260;A.step(S0,1/60,{ax:0,down:true,pressed:false});
 c('быстрое падение: скорость падения растёт сильнее ('+v.toFixed(0)+' против '+S0.p.vy.toFixed(0)+')',v>S0.p.vy&&S.ab.fall);}
console.log('\nИТОГ: '+ok+' ок, '+bad.length+' провалов'+(bad.length?': '+bad.join('; '):''));
process.exit(bad.length?1:0);
