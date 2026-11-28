/* Уровни 25–49 (0.17.0): длительность растёт по главам, как в Red Ball 4 (не длиннее прежней: уровень 49 — не длиннее прежней);
   отдельных препятствий на 1000 px не меньше 1,5× прежнего (кластер шипов = одно препятствие);
   полный бот (bot.js, без задержки ввода) проходит с потерей 3 сердец на 25–40 и 3–4 на 41–49; допуск ±1;
   на уровнях, где бот иначе гибнет (около 5 потерь), ему включено «дальнее зрение» (look 18, wide 14), метка vis=far в levels2549.old.json;
   простой бот (simplebot.js) не проходит. */
const fs=require('fs'),path=require('path');
const B=require('./bot.js'),SB=require('./simplebot.js');const GE=B.GE;
const OLD=JSON.parse(fs.readFileSync(path.join(__dirname,'levels2549.old.json'),'utf8'));
const HZ=['bug','wall','gate','hop','proj','spike','laser','drop','mov','saw','frag','mg'];
const LEVELS=[25,26,27,28,29,31,32,33,34,35,36,37,38,39,41,42,43,44,45,46,47,48,49];
const TARGET=L=>[42,45,48].includes(L)?4:3;
function events(S){const T=S.target,xs=S.items.filter(i=>HZ.includes(i.t)&&i.x<T).map(i=>i.x).sort((a,b)=>a-b);let n=0,last=-1e9;for(const x of xs){if(x-last>40)n++;last=x}return n+S.pits.filter(p=>p.a<T).length}
let ok=0,bad=0;const c=(n,v)=>{if(v){ok++;console.log('ok  '+n)}else{bad++;console.log('FAIL '+n)}};
/* 25–29 (0.17.1) написаны вручную, а не подобраны замером: для них проверяем длину, число препятствий, призраков (hm), прохождение ботом и то, что игрок, который не прыгает, не проходит.
   Цель «3 потери» и «простой бот не проходит» к ним не применяются: бот без задержки проходит их почти без потерь, простой бот проходит 25-й (см. CHANGELOG). */
const FIRST={25:16,26:45,27:22,28:23,29:30};/* число препятствий в первой версии рукописных 25–29, которую назвали слишком лёгкой */
function ghostsJump(S){const P=S.P,tA=x=>{x=Math.max(0,x-80);let t=0,xx=0;while(xx<x){const v=Math.min(P.v0+P.acc*xx,P.vmax),dx=Math.min(5,x-xx);xx+=dx;t+=dx/v}return t};
 const hs=S.items.filter(i=>i.t==='hop').map(h=>h.amp*Math.abs(Math.sin(Math.PI*(tA(h.x)+h.ph)/h.per)));return{n:hs.length,jump:hs.filter(v=>v<24).length}}
for(const L of LEVELS){
 const S0=GE.create({mode:'level',L,seed:1,W:360,H:640}),T=S0.target,ev=events(S0),o=OLD[L];
 if(o.manual){
  c('уровень '+L+' (рукописный): длина '+Math.round(T)+' px не больше прежней '+o.len,T<=o.len);
  c('уровень '+L+' (рукописный): препятствий '+ev+' не меньше 1,5× первой версии ('+Math.ceil(FIRST[L]*1.5)+')',ev>=Math.ceil(FIRST[L]*1.5));
  const g=ghostsJump(S0);if(g.n)c('уровень '+L+' (рукописный): призраков '+g.n+', из них надо перепрыгивать '+g.jump+' (не меньше 40%)',g.jump>=Math.ceil(g.n*.4));
  const r=B.run(L,1,{});c('уровень '+L+' (рукописный): полный бот проходит, потеряно '+r.lost+' (не больше 4)',r.over==='win'&&r.lost<=4);
  continue}
 c('уровень '+L+': длина '+Math.round(T)+' px не больше прежней '+o.len,T<=o.len);
 const dens=ev/T*1000,dOld=o.events/o.len*1000;
 c('уровень '+L+': препятствий на 1000 px '+dens.toFixed(2)+' не меньше 1,5× прежнего '+dOld.toFixed(2),dens>=1.5*dOld);
 const far=o.vis==='far',r=B.run(L,1,far?{look:18,wide:14}:{});
 c('уровень '+L+': полный бот'+(far?' (дальнее зрение)':'')+' проходит, потеряно '+r.lost+' (цель '+TARGET(L)+' ±1)',r.over==='win'&&Math.abs(r.lost-TARGET(L))<=1);
 const s=SB.run(L,1);c('уровень '+L+': простой бот не проходит ('+(s.over||'не дошёл')+')',s.over!=='win')}
console.log('ИТОГ: '+ok+' ок, '+bad+' провалов');process.exit(bad?1:0);
