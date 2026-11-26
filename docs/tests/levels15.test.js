/* Уровни 1–5 (0.13.1): препятствий не меньше чем в 1,5 раза больше, чем в 0.13.0, длина не больше прежней,
   полный бот проходит с потерей не больше одного сердца, простой бот (simplebot.js) не проходит. */
const B=require('./bot.js'),SB=require('./simplebot.js');const GE=B.GE;
let ok=0,bad=0;const c=(n,v)=>{if(v){ok++;console.log('ok  '+n)}else{bad++;console.log('FAIL '+n)}};
const OLD={1:[4406,12],2:[4534,16],3:[5386,17],4:[5068,17],5:[6060,18]};
const HZ=['bug','wall','gate','hop','proj','spike','laser','drop','mov','saw','frag','mg'];
for(const L of [1,2,3,4,5]){
 const S0=GE.create({mode:'level',L,seed:1,W:360,H:640}),T=S0.target;
 const ob=S0.items.filter(i=>HZ.includes(i.t)&&i.x<T).length+S0.pits.filter(p=>p.a<T).length;
 c('уровень '+L+': длина '+Math.round(T)+' не больше прежней '+OLD[L][0],T<=OLD[L][0]);
 c('уровень '+L+': препятствий '+ob+' не меньше '+Math.ceil(OLD[L][1]*1.5),ob>=Math.ceil(OLD[L][1]*1.5));
 const r=B.run(L,1);c('уровень '+L+': полный бот проходит, потеряно сердец '+r.lost+' (не больше 1)',r.over==='win'&&r.lost<=1);
 const s=SB.run(L,1);c('уровень '+L+': простой бот не проходит ('+(s.over||'не дошёл')+')',s.over!=='win')}
console.log('ИТОГ: '+ok+' ок, '+bad+' провалов');process.exit(bad?1:0);
