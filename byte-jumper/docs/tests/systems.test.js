/* Системы «движка 2.0»: сохранение и миграции, флаги выборов, режимы помех, реестр способностей.
   Запуск: node docs/tests/systems.test.js (без браузера, ~1 с) */
const fs=require('fs'),path=require('path');
const D=path.join(__dirname,'../../app/src/main/assets/features/game/');
const F=new Function(fs.readFileSync(D+'flags.js','utf8')+';return GameFlags')();
const A=new Function(fs.readFileSync(D+'abilities.js','utf8')+';return GameAbilities')();
let ok=0,bad=[];const c=(n,v)=>{v?(ok++,console.log('ok  ',n)):(bad.push(n),console.log('FAIL',n))};
const clone=x=>JSON.parse(JSON.stringify(x));

/* --- сохранение: миграция версии 1 → 2 --- */
const d=F.migrate({});
c('пустой профиль: версия 2, уровень 1, звук и помехи включены',d.v===2&&d.u===1&&d.snd===true&&d.mode==='full'&&d.gl===true&&d.lfs.length===0);
c('старый профиль (без v) сохраняет все прежние поля',(()=>{const o=F.migrate({u:12,b:340,best:900,bosses:3,lfs:[2,5],end:'open',ends:['open'],tr:1,form:2,st:{'1':3}});return o.u===12&&o.b===340&&o.best===900&&o.bosses===3&&o.lfs.join()==='2,5'&&o.lf===2&&o.end==='open'&&o.ends[0]==='open'&&o.tr===1&&o.form===2&&o.st['1']===3})());
c('неизвестные поля сохраняются (будущие версии и онлайн)',F.migrate({keep:{a:1},u:5,x:'y'}).keep.a===1&&F.migrate({x:'y'}).x==='y');
c('баг: сохранённые «помехи выкл» и «звук выкл» больше не превращаются в «вкл»',(()=>{const o=F.migrate(JSON.parse(JSON.stringify({gl:false,snd:false})));return o.mode==='off'&&o.gl===false&&o.snd===false})());
c('миграция идемпотентна',(()=>{const x={u:7,lfs:[9,3,3],gl:0,fl:{trust:'yes'}};return JSON.stringify(F.migrate(F.migrate(x)))===JSON.stringify(F.migrate(x))})());
c('мусор не падает: null, массив, строка, сломанные поля',(()=>{try{const a=F.migrate(null),b=F.migrate([1,2]),e=F.migrate('x'),g=F.migrate({u:'много',lfs:'нет',st:[],fl:5,bosses:99,form:9});return a.u===1&&b.u===1&&e.u===1&&g.u===1&&F.migrate({u:999}).u===100&&g.lfs.length===0&&g.bosses===10&&g.form===3&&g.st&&!Array.isArray(g.st)}catch(err){return false}})());
c('список Потеряшек: без дублей, без мусора, только 1–100, счётчик = список',(()=>{const o=F.migrate({lfs:[3,3,0,101,'x',7,-2,100]});return o.lfs.join()==='3,7,100'&&o.lf===3})());

/* --- флаги выборов --- */
{const sv=F.migrate({});c('выбор 36 (trust): допустимое значение сохраняется',F.choose(sv,'trust','yes')===true&&sv.fl.trust==='yes');
 c('выбор: недопустимое значение отклоняется и ничего не меняет',F.choose(sv,'trust','maybe')===false&&sv.fl.trust==='yes');
 c('выбор: неизвестный ключ отклоняется',F.choose(sv,'nope','yes')===false);
 c('выборы 88/96 принимают только accept/decline',F.choose(sv,'offer88','accept')&&F.choose(sv,'offer96','decline')&&!F.choose(sv,'offer96','yes'));
 const back=F.migrate(clone(sv));c('выбор переживает сохранение и загрузку',back.fl.trust==='yes'&&back.fl.offer96==='decline');}
c('мусор в выборах сбрасывается на пустое значение',F.migrate({fl:{trust:'hack',refused:'no'}}).fl.trust===''&&F.migrate({fl:{trust:'hack',refused:'no'}}).fl.refused==='no');
c('«Исправление» открыто с 90 Потеряшками, закрыто с 89',F.fixable({lfs:Array.from({length:90},(_,i)=>i+1)})&&!F.fixable({lfs:Array.from({length:89},(_,i)=>i+1)}));

/* --- режимы помех --- */
c('режимы по кругу: полные → мягкие → выкл → полные',F.nextMode('full')==='soft'&&F.nextMode('soft')==='off'&&F.nextMode('off')==='full');
c('подписи режимов',F.modeLabel('full')==='полные'&&F.modeLabel('soft')==='мягкие'&&F.modeLabel('off')==='выкл');
c('эффекты: выкл = 0 (не рисовать), мягкие — меньше полных, полные — как есть',F.fxQuality('off',1)===0&&F.fxQuality('soft',1)>0&&F.fxQuality('soft',1)<F.fxQuality('full',1)&&F.fxQuality('full',.8)===.8);

/* --- способности: реестр --- */
c('9 способностей, по одной на босса 1–9, id уникальны',A.LIST.length===9&&A.LIST.every((a,i)=>a.boss===i+1)&&new Set(A.LIST.map(a=>a.id)).size===9);
c('открытие по боссам: после 1-го — быстрое падение, после 2-го — двойной прыжок',A.opened(0).length===0&&A.opened(1).join()==='fall'&&A.opened(2).join()==='fall,double');
{const sv=F.migrate({bosses:4});c('потрачена за забег: второй раз уже нельзя',A.spend(sv,'fall')===true&&A.spend(sv,'fall')===false);
 c('нельзя потратить неоткрытую способность',A.spend(sv,'calm')===false);
 c('нельзя потратить неизвестную способность',A.spend(sv,'fly')===false);
 c('доступные: открытые минус потраченные в этом забеге',A.available(sv).join()==='double,think,shield');
 A.newRun(sv);c('новый забег: потраченные сбрасываются',sv.abSpent.length===0&&A.available(sv).includes('fall'));
 c('потраченные переживают сохранение внутри забега',(()=>{A.spend(sv,'think');return F.migrate(clone(sv)).abSpent.join()==='think'})());}

console.log('\nИТОГ: '+ok+' ок, '+bad.length+' провалов'+(bad.length?'\nПровалы: '+JSON.stringify(bad):''));
if(bad.length)process.exit(1);
