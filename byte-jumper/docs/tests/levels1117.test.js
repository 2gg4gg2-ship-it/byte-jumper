/* Уровни 11–17 (0.13.7): «азартные» сценарии. Условия: препятствий не меньше чем в 1,5 раза больше, чем в 0.13.6, длина не больше прежней;
   полный бот проходит 11–13 с потерей не больше 2 сердец, 14–17 не больше 3 (и идеальный, и с задержкой ввода 2 кадра ≈ 33 мс, и на ширине 412);
   простой бот (simplebot.js) не проходит вообще. */
const B=require('./bot.js'),SB=require('./simplebot.js');const GE=B.GE,GL=B.GL;
let ok=0,bad=0;const c=(n,v)=>{if(v){ok++;console.log('ok  '+n)}else{bad++;console.log('FAIL '+n)}};
const OLD={11:[6134,14],12:[5158,13],13:[5840,15],14:[5064,15],15:[5350,15],16:[6738,21],17:[7256,34]};
const HZ=['bug','wall','gate','hop','proj','spike','laser','drop','mov','saw','frag','mg'];
const cap=L=>L<=13?2:3;
for(const L of [11,12,13,14,15,16,17]){
 const S0=GE.create({mode:'level',L,seed:1,W:360,H:640}),T=S0.target;
 const ob=S0.items.filter(i=>HZ.includes(i.t)&&i.x<T).length+S0.pits.filter(p=>p.a<T).length;
 c('уровень '+L+': длина '+Math.round(T)+' не больше прежней '+OLD[L][0],T<=OLD[L][0]);
 c('уровень '+L+': препятствий '+ob+' не меньше '+Math.ceil(OLD[L][1]*1.5),ob>=Math.ceil(OLD[L][1]*1.5));
 c('уровень '+L+': есть вступление и подсказка',!!(GL.INTRO[L]&&GL.INTRO[L].s&&GL.INTRO[L].n&&GL.DEF[L].txt&&GL.DEF[L].txt.a));
 const r=B.run(L,1);c('уровень '+L+': полный бот проходит, потеряно '+r.lost+' (не больше '+cap(L)+')',r.over==='win'&&r.lost<=cap(L));
 const w=B.run(L,1,{W:412});c('уровень '+L+': то же на ширине 412, потеряно '+w.lost,w.over==='win'&&w.lost<=cap(L));
 const g=B.run(L,1,{lag:2});c('уровень '+L+': бот с задержкой ввода 33 мс проходит, потеряно '+g.lost+' (не больше '+cap(L)+')',g.over==='win'&&g.lost<=cap(L));
 const s=SB.run(L,1);c('уровень '+L+': простой бот не проходит ('+(s.over||'не дошёл')+')',s.over!=='win')}
console.log('ИТОГ: '+ok+' ок, '+bad+' провалов');process.exit(bad?1:0);
