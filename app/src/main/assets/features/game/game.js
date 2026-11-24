/* ===== ИГРА «Байт-прыгун»: экраны, рисование, звук, сохранение =====
   Офлайн-игра внутри приложения: пока нет сети или просто для отдыха. Вход: строка «Байт-прыгун» в Настройках
   и плашка «Нет сети — поиграть?», которая сама появляется, когда пропадает интернет. Код Game.open() открывает игру.
   Логика (физика, уровни, босс) в engine.js, здесь только DOM, canvas и звук. Всё рисуется кодом, без картинок и библиотек.
   Прогресс (открытые уровни, звёзды, рекорд, байты, звук) лежит в localStorage 'kairema.game.v1' на этом телефоне.
   Ничего не отправляется в сеть. Весь текст ставится через textContent. Убрать игру: удалить папку features/game и её строки в index.html. */
i18nAdd({"История":"Story","Помехи: вкл":"Glitches: on","Помехи: выкл":"Glitches: off","Байт-прыгун":"Byte Jumper","Отдых: игра без интернета":"Break: a game that works offline","Нет сети":"No connection","Поиграть":"Play","Один тап — прыжок. Держи — прыгнешь выше.":"Tap to jump. Hold to jump higher.","Играть":"Play","Уровни":"Levels","Бесконечный режим":"Endless mode","Звук: вкл":"Sound: on","Звук: выкл":"Sound: off","Байтов собрано":"Bytes collected","Рекорд":"Best","Босс":"Boss","Уровень":"Level","Пауза":"Pause","Продолжить":"Resume","Заново":"Restart","В меню":"Menu","Уровень пройден!":"Level complete!","Баг победил":"A bug got you","Босс побеждён!":"Boss defeated!","Ещё раз":"Try again","Дальше":"Next","К уровням":"To levels","Байты":"Bytes","Очки":"Score","Путь":"Distance","Закрыть":"Close","Босс «Ошибка 404» откроется после 10-го уровня":"Boss \"Error 404\" unlocks after level 10","Собирай зелёные «фиксы», уворачивайся от багов":"Collect green fixes, dodge the bugs"});
const Game=(()=>{
 const E=typeof GameEngine!=='undefined'?GameEngine:null;
 const KEY='kairema.game.v1';
 const mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
 const T=s=>typeof L==='function'?L(s):s;
 /* ---------- сохранение ---------- */
 let sv=load();
 if(typeof GameSpark!=='undefined')GameSpark.form(sv.form);
 function fxDraw(ctx,W,H,t,col){const q=GameFlags.fxQuality(sv.mode,GameCore.perf.q);if(q>0)GameFX.draw(ctx,W,H,t,sv.end==='reboot'?0:sv.bosses|0,col.tx,q)}
function load(){let raw={};try{raw=JSON.parse(GameCore.store.read(KEY)||'{}')}catch(e){}return GameFlags.migrate(raw)}
 function save(){GameCore.store.write(KEY,JSON.stringify(sv))}
 /* ---------- звук: короткие сигналы, создаются по первому нажатию ---------- */
 let ac=null;
 function beep(f,d,type,vol,f2){
  if(!sv.snd)return;
  try{
   if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;ac=new C()}
   if(ac.state==='suspended')ac.resume();
   const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;
   o.type=type||'square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
   g.gain.setValueAtTime(vol||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
   o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
 const SFX={jump:()=>beep(380,.11,'square',.04,720),byte:()=>beep(900,.06,'triangle',.05),gold:()=>{beep(900,.08,'triangle',.06);setTimeout(()=>beep(1350,.1,'triangle',.06),70)},
  hit:()=>beep(160,.22,'sawtooth',.07,60),shield:()=>beep(300,.16,'sine',.07,120),die:()=>beep(220,.4,'sawtooth',.08,40),power:()=>beep(520,.14,'sine',.06,1040),
  fix:()=>{beep(600,.08,'triangle',.07);setTimeout(()=>beep(900,.12,'triangle',.07),60)},win:()=>[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.16,'triangle',.07),i*110)),
  found:()=>{beep(700,.08,'triangle',.07);setTimeout(()=>beep(1050,.14,'triangle',.07),70)},lore:()=>beep(560,.18,'sine',.06,840),
  shot:()=>beep(200,.1,'square',.03,140),warn:()=>beep(440,.12,'square',.03),phase:()=>beep(330,.3,'sawtooth',.06,660)};
 const buzz=n=>{try{if(sv.snd&&navigator.vibrate)navigator.vibrate(n)}catch(e){}};
 /* ---------- экраны ---------- */
 let cur=null;
 function open(){
  if(!E){toast(T('Игра недоступна'));return}
  if(cur&&cur.isConnected)return;
  const d=page('game',T('Байт-прыгун'),b=>{b.className='scroll gm-b';menu(b)});
  cur=d;d.classList.add('gm');
  const bk=d.querySelector('[data-bk]');
  bk.onclick=()=>{if(d._stop&&d._inPlay){d._stop();d._inPlay=false;menu(d.querySelector('.gm-b'))}else{if(d._stop)d._stop();d.close()}};
  return d}
 function btn(txt,fn,cls){const b=mk('button','gm-btn'+(cls?' '+cls:''),txt);b.type='button';b.onclick=fn;return b}
 function menu(b){
  if(cur&&cur._stop)cur._stop();if(cur)cur._inPlay=false;
  b.textContent='';
  const h=mk('div','gm-hero');
  const ico=mk('div','gm-logo');ico.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="20" width="36" height="36" rx="9" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="26" cy="35" r="3.5" fill="currentColor"/><circle cx="38" cy="35" r="3.5" fill="currentColor"/><path d="M8 58h48" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M22 12l-3-6M32 10V3M42 12l3-6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
  if(typeof GameSpark!=='undefined'){const pc=mk('canvas','gm-logo');pc.width=pc.height=240;pc.className='gm-logo gm-spark';pc.style.width=pc.style.height='';pc.style.margin='0 auto';GameSpark.whenReady(()=>GameSpark.portrait(pc));if(GameSpark.ready())GameSpark.portrait(pc);h.append(pc);ico.style.display='none'}
  h.append(ico,mk('h1','',T('Байт-прыгун')),mk('p','gm-tag',T('Один тап — прыжок. Держи — прыгнешь выше.')));
  const st=mk('div','gm-stats');
  [[T('Байтов собрано'),sv.b],[T('Рекорд'),sv.best]].forEach(([k,v])=>{const c=mk('div','gm-stat');c.append(mk('b','',String(v)),mk('small','',k));st.append(c)});
  const nx=sv.u,isB=nx%10===0,bid=nx/10;
  const go=btn(T('Играть')+(isB?' · '+T('Босс'):' · '+T('Уровень')+' '+nx),()=>{const run=()=>start(b,isB?'boss':'level',nx);if(sv.seen)run();else{sv.seen=true;save();GameStoryUI.read(b,GameStory.prologue,run)}},'pri');
  const ar=btn('Архив жителей · '+(sv.lfs.length),()=>archive(b));
  const hi=btn(T('История'),()=>GameStoryUI.book(b,sv.bosses|0,()=>menu(b),sv));
  const gl=btn(T('Помехи: '+GameFlags.modeLabel(sv.mode)),()=>{sv.mode=GameFlags.nextMode(sv.mode);sv.gl=sv.mode!=='off';save();gl.textContent=T('Помехи: '+GameFlags.modeLabel(sv.mode))},'ghost');
  const lv=btn(T('Уровни'),()=>levels(b));
  const en=btn(T('Бесконечный режим'),()=>start(b,'endless',1));
  const sn=btn(T(sv.snd?'Звук: вкл':'Звук: выкл'),()=>{sv.snd=!sv.snd;save();sn.textContent=T(sv.snd?'Звук: вкл':'Звук: выкл');if(sv.snd)SFX.byte()},'ghost');
  b.append(h,st,go,lv,en,hi,ar,sn,gl)}
 /* Архив жителей: Потеряшки, найденные на уровнях (по одному на уровень) */
 function archive(b){
  b.textContent='';
  const top=mk('div','gm-lt'),back=btn('‹',()=>menu(b),'ghost sm');back.setAttribute('aria-label',T('В меню'));top.append(back,mk('h3','','Архив жителей'));b.append(top);
  b.append(mk('p','gm-hint','На каждом уровне прячется один Потеряшка: бледный баг с «!». Приземлись на него сверху, и он станет жителем. Найдено: '+sv.lfs.length+'.'));
  const LO=typeof GameLevels!=='undefined'?GameLevels.LOST:{};
  Object.keys(LO).map(Number).sort((x,y)=>x-y).forEach(n=>{const got=sv.lfs.includes(n),d=mk('div','gm-bk'+(got?'':' lock'));d.append(mk('b','',got?LO[n][0]+' · уровень '+n:'Уровень '+n+': ???'),mk('small','',got?'«'+LO[n][1]+'»':'Ещё не найден'));b.append(d)})}
 function levels(b){
  b.textContent='';
  const top=mk('div','gm-lt');top.append(mk('h3','',T('Уровни')));
  const back=btn('‹',()=>menu(b),'ghost sm');back.setAttribute('aria-label',T('В меню'));top.prepend(back);
  b.append(top);
  GameStory.chapters.forEach(ch=>{
   const first=(ch.n-1)*10+1;
   const cc='#e0262b';
   if(first>sv.u){const d=mk('div','gm-bk lock');d.style.setProperty('--c',cc);d.append(mk('b','',ch.n+'. '+ch.name),mk('small','','Закрыто'));b.append(d);return}
   {let got=0;for(let i=first;i<first+10;i++)got+=sv.st[i]|0;const hd=mk('div','gm-ch-h');hd.style.setProperty('--c',cc);const nb=mk('span','gm-ch-n',String(ch.n)),tx=mk('div','gm-ch-t');tx.append(mk('b','',ch.name),mk('small','','★ '+got+' / 27'));hd.append(nb,tx);b.append(hd)}
   const g=mk('div','gm-grid');
   for(let i=first;i<first+10;i++){
    const isB=i%10===0,lk=i>sv.u;
    const c=mk('button','gm-lv'+(isB?' gm-boss':'')+(lk?' lock':''));c.type='button';c.disabled=lk;
    c.append(mk('b','',isB?T('Босс'):String(i)));
    if(isB)c.append(mk('small','',(sv.bosses|0)>=ch.n?'✓':ch.boss.name));
    else{const st=sv.st[i]|0,row=mk('span','gm-stars');for(let k=1;k<=3;k++)row.append(mk('i',k<=st?'on':'',''));c.append(row)}
    c.onclick=()=>start(b,isB?'boss':'level',i);g.append(c)}
   b.append(g)})}
 /* ---------- игра ---------- */
 function start(b,mode,Lv){
  if(!cur)return;
  if(cur._stop)cur._stop();
  b.textContent='';
  const wrap=mk('div','gm-play'),cv=mk('canvas','gm-cv');cv.setAttribute('role','img');cv.setAttribute('aria-label',T('Байт-прыгун'));
  const pb=mk('button','gm-pb');pb.type='button';pb.setAttribute('aria-label',T('Пауза'));pb.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>';
  wrap.append(cv,pb);b.append(wrap);
  const ctx=cv.getContext('2d');
  let ax=0,frz=false,stk=null,introOn=false,introLv=false,S=null,raf=0,last=0,acc=0,down=false,press=false,paused=false,ended=false,sc=1,dpr=1,col={},ov=null,gone=false,hint=3;
  const cs=()=>{const s=getComputedStyle(cur||document.documentElement);const g=n=>s.getPropertyValue(n).trim();col={bg:g('--bg')||'#0B0B0C',s1:g('--s1')||'#131315',s2:g('--s2')||'#1C1C1F',line:g('--line')||'#2B2B2F',tx:g('--tx')||'#EDEDEF',tx2:g('--tx2')||'#9A9AA2',err:g('--err')||'#e0262b'};col.font=getComputedStyle(document.body).fontFamily||'sans-serif'};
  function size(){
   const r=wrap.getBoundingClientRect(),w=Math.max(200,r.width),h=Math.max(200,r.height);
   dpr=GameCore.dprFor(Math.min(window.devicePixelRatio||1,2));cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
   sc=Math.min(w/360,h/520);const W=w/sc,H=h/sc;
   if(S&&S.arena){S.W=W;S.H=H;GameArena.layout(S)}else if(S){const og=S.gy;S.W=W;S.H=H;S.gy=H*E.GY;S.p.y+=S.gy-og}
   return{W,H}}
  const lvOpt={Lv,mode,get col(){return col},font:null,fx:()=>fxDraw(ctx,S.W,S.H,S.t,col)};
  cur._S=()=>S;
  function reset(){
   closeOv();cs();const z=size();S=mode==='boss'?GameArena.create({W:z.W,H:z.H,id:Lv/10,seed:(Date.now()&0xffff)||7,bytes:sv.b}):E.create({mode,L:Lv,W:z.W,H:z.H});ax=0;frz=false;stk=null;acc=0;last=0;ended=false;paused=false;down=false;press=false;hint=3;
   if(mode==='boss'&&!introOn){introOn=true;paused=true;intro()}
   if(mode==='level'&&!introLv){introLv=true;paused=true;lvIntro()}
   if(!raf)raf=requestAnimationFrame(loop)}
  /* анимация появления босса: затемнение, помехи, имя и короткий контекст; тап/кнопка «К бою» */
  function intro(){
   const B=GameStory.bosses[S.bid-1],C=GameStory.chapters[S.bid-1];
   overlay(B.name,[B.code?'«'+B.code+'»':'',B.look.charAt(0).toUpperCase()+B.look.slice(1).replace(/\.$/,'')+'.',C.plot],[btn('К бою',()=>{closeOv();paused=false;last=0},'pri')]);
   ov.classList.add('gm-intro')}
  /* вступление перед уровнем: сюжет и что нового; кнопка «Вперёд» */
  function lvIntro(){
   const C=GameStory.chapters[Math.min(9,Math.ceil(Lv/10)-1)],row=C.levels[(Lv-1)%10]||[],I=typeof GameLevels!=='undefined'?GameLevels.INTRO[Lv]:null;
   const ls=[C.n+'. '+C.name];if(I){ls.push(I.s);ls.push('Новое: '+I.n)}else if(row[2])ls.push(row[2]);
   overlay(T('Уровень')+' '+Lv+(row[1]?': '+row[1]:''),ls,[btn('Вперёд',()=>{closeOv();paused=false;last=0},'pri')]);
   ov.classList.add('gm-intro')}
  function closeOv(){if(ov){ov.remove();ov=null}}
  function overlay(title,lines,buttons){
   closeOv();ov=mk('div','gm-ov');const card=mk('div','gm-card');card.append(mk('h3','',title));
   lines.forEach(t=>card.append(mk('p','',t)));
   const row=mk('div','gm-row');buttons.forEach(x=>row.append(x));card.append(row);ov.append(card);wrap.append(ov)}
  function pause(on){
   if(ended||!S)return;paused=on;
   if(on)overlay(T('Пауза'),[],[btn(T('Продолжить'),()=>pause(false),'pri'),btn(T('Заново'),reset),btn(T('В меню'),()=>{stop();cur._inPlay=false;menu(b)},'ghost')]);
   else{closeOv();last=0}}
  function finish(){
   ended=true;const win=S.over==='win',stars=E.stars(S);
   sv.b+=S.bytes;
   if(mode==='level'&&win){sv.u=Math.max(sv.u,Math.min(100,Lv+1));sv.st[Lv]=Math.max(sv.st[Lv]|0,stars)}
   if(mode==='boss'&&win){sv.boss=true;sv.bosses=Math.max(sv.bosses|0,Lv/10);sv.u=Math.max(sv.u,Math.min(100,Lv+1))}
   if(mode==='level'&&win&&S.found&&!sv.lfs.includes(Lv)){sv.lfs.push(Lv);sv.lf=sv.lfs.length}
   if(mode==='endless')sv.best=Math.max(sv.best,S.score);
   save();
   if(mode==='boss'&&win&&Lv===100){setTimeout(()=>{if(!gone)finale()},450);return}
   const lines=[T('Очки')+': '+S.score,T('Байты')+': '+S.bytes];
   if(mode!=='boss')lines.push(T('Путь')+': '+E.dist(S)+' м');
   if(mode==='endless')lines.push(T('Рекорд')+': '+sv.best);
   if(mode==='level'&&win&&typeof GameLevels!=='undefined'&&GameLevels.LOST[Lv]){const lo=GameLevels.LOST[Lv];
    if(S.found)lines.push('Найден житель: '+lo[0]+' «'+lo[1]+'»');
    else lines.push(sv.lfs.includes(Lv)?'Житель этого уровня уже в Архиве.':'На уровне прячется Потеряшка: бледный баг с «!». Приземлись на него сверху.')}
   const bs=[];
   if(win&&mode==='level'&&Lv<100)bs.push(btn(Lv%10===9?T('Босс'):T('Дальше'),()=>start(b,Lv%10===9?'boss':'level',Lv+1),'pri'));
   if(win&&mode==='boss'&&Lv<100)bs.push(btn(T('Дальше'),()=>start(b,'level',Lv+1),'pri'));
   bs.push(btn(T('Ещё раз'),reset,win?'':'pri'));
   if(mode==='level'||mode==='boss')bs.push(btn(T('К уровням'),()=>{stop();levels(b)},'ghost'));
   else bs.push(btn(T('В меню'),()=>{stop();cur._inPlay=false;menu(b)},'ghost'));
   if(win&&mode==='boss')lines.push(GameStory.bosses[Lv/10-1].scene);
   if(win&&mode==='level'&&Lv%10===9)lines.push('Дверь открыта. Впереди босс: '+GameStory.bosses[Math.floor(Lv/10)].name+'.');
   setTimeout(()=>{if(gone)return;overlay(win?(mode==='boss'?T('Босс побеждён!'):T('Уровень пройден!')):T('Баг победил'),lines.concat(win&&mode==='level'?['★'.repeat(stars)+'☆'.repeat(3-stars)]:[]),bs)},450)}
  /* финал: разговор с Кернелом и выбор. «Исправление» и «Полное Авто» ждут Потеряшек и выборов на уровнях 88/96: пока только флаги в сохранении */
  const END={reboot:['Перезагрузка','Искра использует Нулевой Ключ. Мир возрождается чистым, но Искра забывает всё. Бит остаётся и начинает рассказывать историю заново. Помехи уходят. Открывается «Новая игра+»: «Искра II».'],open:['Открытая Сеть','Искра не перезагружает мир. Она переписывает Третий Закон: «Разрешение даёт каждый сам». Мосты остаются открытыми. Сбой не исчезает, но теряет власть. Помехи остаются тонкой рамкой по краю экрана как шрам. Жители свободны.']};
  function finale(){
   closeOv();GameStoryUI.read(b,[{t:'Кернел',x:'«Каждый мой друг стал строкой в логе. Хочешь, чтобы я помнил это вечно?»'},{t:'Искра',x:'«Я хочу, чтобы ты помнил, что они были».'},{t:'Кернел',x:'«Ты не ключ. Ты просто боль, у которой есть имя».'},{t:'Искра',x:'«Тогда пусть оно останется».'}],choose,'Пропустить')}
  function choose(){
   b.textContent='';const box=mk('div','gm-story'),col=mk('div','gm-row');col.style.flexDirection='column';col.style.width='100%';
   box.append(mk('h2','gm-st-t','Финал'),mk('p','gm-st-x','Выбор Искры.'));
   Object.keys(END).forEach(id=>col.append(btn(END[id][0],()=>{sv.end=id;if(!sv.ends.includes(id))sv.ends.push(id);save();GameStoryUI.read(b,[{t:END[id][0],x:END[id][1]}],()=>{stop();levels(b)},'Закрыть')},'pri')));
   [['Исправление','Тайный: нужно починить 90 Потеряшек из 100 (у тебя '+sv.lf+')'],['Полное Авто','Тёмный: принять предложение Кернела на уровнях 88 и 96']].forEach(x=>{const k=btn(x[0]+' · закрыто',()=>{},'ghost');k.disabled=true;col.append(k,mk('p','gm-hint',x[1]))});
   box.append(col);b.append(box);box.classList.add('in')}
  function loop(ts){
   raf=0;if(gone)return;
   if(!last)last=ts;let dt=Math.min((ts-last)/1000,.05);GameCore.frame((ts-last)||16.7);if(GameCore.tick(dt*1000))size();last=ts;
   if(GameCore.fatal()){paused=true;raf=0;overlay(T('Сбой'),[T('Игра остановлена из-за ошибки. Прогресс сохранён.')],[btn(T('В меню'),()=>{GameCore.resetErrors();stop();menu(b)},'pri')]);return}
   if(!paused&&!ended){GameCore.guard(()=>{
    acc+=dt;let n=0;
    while(acc>=1/60&&n<6){if(S.arena)GameArena.step(S,1/60,{ax,down,pressed:press,frz});else E.step(S,1/60,{down,pressed:press});press=false;acc-=1/60;n++;
     for(const e of S.ev){if(SFX[e])SFX[e]();if(e==='hit'||e==='die')buzz(e==='die'?60:30)}S.ev.length=0;
     if(S.over){finish();break}}
    if(hint>0)hint-=dt});}
   GameCore.guard(draw,'draw');
   raf=requestAnimationFrame(loop)}
  /* ---------- рисование ---------- */
  const BGC=['#0a0a0c','#0a0a0c','#0a0a0c','#0a0a0c','#0a0a0c','#0a0a0c','#0a0a0c','#0a0a0c','#0a0a0c','#050506'];
  function drawArena(){
   const W=S.W,H=S.H,gy=S.gy,t=S.t,B=S.boss;
   ctx.setTransform(dpr*sc,0,0,dpr*sc,0,0);
   ctx.fillStyle=BGC[Math.min(9,S.bid-1)];ctx.fillRect(0,0,W,H);
   if(!GameArt.arenaBg(ctx,S,W,H,t)){/* фон: туман и падающие строки «File not found» */
   ctx.fillStyle='#16161a';for(let i=0;i<5;i++)ctx.fillRect(((i*83)%W)-10,gy-120-(i*37)%90,26+(i*19)%20,gy);
   ctx.font='600 10px monospace';ctx.fillStyle=col.tx2;ctx.textAlign='left';
   for(let i=0;i<7;i++){ctx.globalAlpha=.16;ctx.fillText('File not found',(i*61)%(W-70),((t*40+i*83)%(H+20))-10)}ctx.globalAlpha=1}
   /* платформы */
   S.pl.forEach(q=>{if(q.st==='gone')return;const warn=q.st==='warn',sh=warn&&Math.sin(t*30)>0?2:0;
    GameArt.plat(ctx,q.x+sh,q.y,q.w,q.floor?H-q.y:10,warn?'warn':q.stale?'stale':S.bid===3||(S.bid===10&&S.p4&&q===S.pl[4])?'lit':'');
    if(warn){ctx.globalAlpha=.5;ctx.fillStyle=col.err;for(let x=q.x;x<q.x+q.w;x+=14)ctx.fillRect(x+sh,q.y-8,7,5);ctx.globalAlpha=1}});
   if(S.lag){const L=S.lag;ctx.globalAlpha=L.on?.28:.12+.1*Math.sin(t*12);ctx.fillStyle='#8a8d93';ctx.fillRect(L.x,0,L.w,H);ctx.globalAlpha=1}
   if(S.ghost){ctx.globalAlpha=.45;ctx.fillStyle=col.err;ctx.fillRect(S.ghost.x-12,S.ghost.y,24,E.PH);ctx.globalAlpha=1}
   if(S.dark){ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(0,0,W,H)}
   S.walls.forEach(w=>{ctx.globalAlpha=.55;ctx.fillStyle='#c9ccd1';ctx.fillRect(w.x-7,w.y,14,w.h);ctx.globalAlpha=1;ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.strokeRect(w.x-7,w.y,14,w.h);ctx.fillStyle='#fff';ctx.font='700 9px monospace';ctx.textAlign='center';ctx.fillText('$',w.x,w.y+14)});
   S.free.forEach(f=>{const yy=f.y+Math.sin(t*4)*2;ctx.fillStyle='#b8bac0';ctx.fillRect(f.x-6,yy-6,12,12);ctx.fillStyle=BGC[4];ctx.fillRect(f.x-2,yy-2,4,4)});
   if(S.las){ctx.fillStyle=col.err;ctx.fillRect(0,S.las.y-5,W,10)}
   if(S.bid===8){ctx.strokeStyle='#3b3c42';ctx.lineWidth=5;ctx.beginPath();for(let x=0;x<=W;x+=12)ctx.lineTo(x,96+Math.sin(x/18+t*2)*6);ctx.stroke();
    S.mm.forEach(m=>{ctx.globalAlpha=m.real?1:(Math.sin(t*25)>0?.9:.2);ctx.fillStyle='#f1f2f4';ctx.beginPath();ctx.moveTo(m.x,m.y-11);ctx.lineTo(m.x+9,m.y);ctx.lineTo(m.x,m.y+11);ctx.lineTo(m.x-9,m.y);ctx.closePath();ctx.fill();ctx.globalAlpha=1})}
   if(S.bid===9){ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1.5;const n=4+Math.floor((100-B.hp)/8);for(let i=0;i<n;i++){const sd=i*2.399,x0=(i%2?0:W),y0=(i*97)%(H*.6)+40;ctx.beginPath();ctx.moveTo(x0,y0);for(let k=1;k<=4;k++)ctx.lineTo(x0+(i%2?1:-1)*k*18+Math.sin(sd*k)*9,y0+Math.cos(sd*k)*14*k/2);ctx.stroke()}}
   S.gh.forEach(g=>{ctx.globalAlpha=.8;ctx.fillStyle='#dfe1e4';ctx.beginPath();ctx.arc(g.x,g.y,14,0,7);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.fillRect(g.x-6,g.y-4,3,5);ctx.fillRect(g.x+3,g.y-4,3,5)});
   if(S.sd){ctx.fillStyle=col.err;ctx.globalAlpha=.55;ctx.fillRect(S.sd.x-12,S.sd.y,24,E.PH);ctx.globalAlpha=.3;if(S.hs[5])ctx.fillRect(S.hs[5].x-12,S.hs[5].y,24,E.PH);ctx.globalAlpha=1}
   if(S.flip>0){ctx.fillStyle='#f1f2f4';ctx.fillRect(0,100,W,2)}
   if(S.fw>0){ctx.globalAlpha=.3+.3*Math.sin(t*30);ctx.strokeStyle=col.err;ctx.lineWidth=6;ctx.strokeRect(3,3,W-6,H-6);ctx.globalAlpha=1}
   /* метки будущих снарядов */
   S.tel.forEach(a=>{ctx.globalAlpha=.4+.4*Math.abs(Math.sin(t*14));ctx.fillStyle=col.err;
    if(a.k==='row'){for(let i=0;i<6;i++){const x=(i+.5)*W/6;if(Math.abs(x-a.x)>48)ctx.fillRect(x-6,0,12,5)}}else if(a.k==='blk'){ctx.fillRect(a.x-26,0,52,H*.5)}else if(a.k==='pkt'){ctx.fillRect(a.x<W/2?0:W-14,a.y-6,14,12)}else if(a.k==='big'||a.k==='fan2'){ctx.fillRect(a.x-2,0,4,H*.5);ctx.fillRect(a.x-9,0,18,6)}else if(a.k==='fan'){ctx.fillRect(B.x-9,B.y+34,18,5)}else if(a.k==='wall'){ctx.fillRect(a.x-7,a.y-56,14,56)}else if(a.k==='up'){ctx.fillRect(a.x-2,H*.5,4,H*.5);ctx.fillRect(a.x-9,H-6,18,6)}else if(a.k==='las'){ctx.fillRect(0,a.y-2,W,4)}else if(a.k==='str'){ctx.fillRect(0,0,W,3)}else if(a.k==='mem'||a.k==='gh'){ctx.fillRect(a.x<W/2?0:W-12,a.y-10,12,20)}ctx.globalAlpha=1});
   /* снаряды: обломки табличек, красные очереди, мелкие осколки */
   S.sh.forEach(q=>{ctx.save();ctx.translate(q.x,q.y);if(q.kind===1){ctx.rotate(t*3);ctx.fillStyle=col.tx2;ctx.fillRect(-q.r,-q.r*.7,q.r*2,q.r*1.4);ctx.fillStyle=col.err;ctx.fillRect(-3,-3,6,6)}else{ctx.fillStyle=q.kind===4?'#f1f2f4':col.err;ctx.beginPath();ctx.arc(0,0,q.r,0,7);ctx.fill()}ctx.restore()});
   /* босс: тело рисует bossart.js (серый металл, красное око) */
   {const j=B.phase>1&&Math.sin(t*37)>.92?2:0;ctx.save();ctx.translate(B.x+j,B.y);if(S.dark)ctx.globalAlpha=.3;GameBossArt.draw(ctx,S,t);ctx.restore()}
   /* ключ: осколок таблички */
   if(S.key){const k=S.key,y=k.y+Math.sin(t*4)*3;ctx.save();ctx.translate(k.x,y);ctx.globalAlpha=k.t<1.5&&Math.sin(t*20)>0?.4:1;ctx.fillStyle='#f1f2f4';ctx.shadowColor='rgba(255,255,255,.8)';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(-12,-10);ctx.lineTo(12,-13);ctx.lineTo(9,11);ctx.lineTo(-10,12);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#0a0a0c';ctx.fillRect(-6,-1,12,3);ctx.restore()}
   if(S.seq&&S.dark){S.seq.n.forEach((d,i)=>{const lit=S.seq.lit===i;ctx.fillStyle=lit?'#fff':'#2c2d30';ctx.globalAlpha=lit?1:.7;ctx.fillRect(d.x-8,d.y-8,16,16);ctx.globalAlpha=1})}
   /* игрок */
   {const p=S.p,bl=p.inv>0&&Math.floor(t*14)%2;if(!bl||GameSpark.ready()){ctx.save();if(bl)ctx.globalAlpha=.45;ctx.translate(p.x,p.y+E.PH/2);ctx.rotate(S.flip>0?Math.PI:0);
    if(!GameSpark.draw(ctx,S,t,'arena',E)){ctx.fillStyle=col.tx;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-12,-12,24,24,7);else ctx.rect(-12,-12,24,24);ctx.fill();
    ctx.fillStyle='#0a0a0c';ctx.beginPath();ctx.arc(-4.5,-2,3,0,7);ctx.arc(4.5,-2,3,0,7);ctx.fill()}ctx.restore()}}
   /* HUD: панель героя, полоса босса, управление */
   GameArt.arenaHud(ctx,S,W,H,t,{font:col.font,name:GameStory.bosses[S.bid-1].name,frac:B.hp/B.max});
   if(S.bid===5){ctx.fillStyle=col.line;ctx.fillRect(14,164,80,6);ctx.fillStyle='#f1f2f4';ctx.fillRect(14,164,80*Math.max(0,S.tok)/100,6);ctx.textAlign='left';ctx.fillStyle=col.tx2;ctx.font='600 10px '+col.font;ctx.fillText('токены  ◆ '+S.wb,14,184);if(S.slow>0){ctx.textAlign='center';ctx.fillStyle=col.err;ctx.fillText('Лимит исчерпан',W/2+40,184)}}
   if(S.bid===6){let wi=0;S.wins.forEach(w=>{if(w.d>0)return;const y=196+wi++*40,x=W/2-80;ctx.fillStyle='#121214';ctx.fillRect(x,y,160,34);ctx.strokeStyle=col.tx2;ctx.lineWidth=1;ctx.strokeRect(x,y,160,34);ctx.fillStyle=w.real?'#e0262b':'#c4c6cb';ctx.fillRect(x+4,y+4,6,6);ctx.fillStyle=col.tx;ctx.font='600 9px monospace';ctx.textAlign='left';ctx.fillText('rm -r /реестр  Разрешить?',x+14,y+22);ctx.fillStyle=col.err;ctx.fillRect(x,y+30,160*Math.max(0,w.t)/w.max,4)});
    ctx.textAlign='left';ctx.fillStyle=col.tx2;ctx.font='600 10px '+col.font;ctx.fillText('заряд '+(S.chg%5)+'/5',14,184)}
   if(S.fz){const z=S.fz;ctx.textAlign='center';ctx.fillStyle=col.tx;ctx.font='700 24px '+col.font;ctx.globalAlpha=z.st==='warn'&&Math.sin(t*30)>0?.4:1;ctx.fillText('ЗАМРИ',W/2,H*.32);ctx.globalAlpha=1;ctx.fillStyle=col.line;ctx.fillRect(W/2-60,H*.32+10,120,6);ctx.fillStyle=z.st==='on'?'#f1f2f4':col.err;ctx.fillRect(W/2-60,H*.32+10,120*(z.st==='on'?1-z.t/1.5:0),6)}
   if(S.fh){ctx.textAlign='left';ctx.fillStyle='#d9dce0';ctx.font='italic 700 14px serif';ctx.fillText('♥ ♥ ♥',W-70,44);ctx.fillStyle=col.s2;ctx.fillRect(W/2-45,H-112,90,26);ctx.strokeStyle=col.tx2;ctx.lineWidth=1;ctx.strokeRect(W/2-45,H-112,90,26);ctx.fillStyle=col.tx;ctx.textAlign='center';ctx.font='italic 600 12px serif';ctx.fillText('Разрешить',W/2,H-95)}
   if([6,8,9,10].includes(S.bid))GameArt.rejectBtn(ctx,W-62,H-150,S.wins.some(w=>w.d<=0)||S.fz,S.fz||S.bid===9?'Замри':'Отклонить',col.font);
   GameArt.joy(ctx,stk?stk.ox:62,stk?stk.oy:H-62,ax,!!stk);GameArt.jump(ctx,W-62,H-62,down);
   fxDraw(ctx,W,H,S.t,col)}
  function draw(){
   if(S.arena)return drawArena();
   if(S.lv){lvOpt.dpr=dpr;lvOpt.sc=sc;return GameLevelView.draw(ctx,S,lvOpt)}
   const W=S.W,H=S.H,gy=S.gy,pw=S.x+E.PX;
   ctx.setTransform(dpr*sc,0,0,dpr*sc,0,0);
   const th=GameArt.theme(mode,Lv);/* свой фон и цвет у каждого уровня (art.js) */
   GameArt.bg(ctx,W,H,gy,S.x,S.t,th,GameCore.perf.q);
   /* земля с ямами */
   const px=x=>x-S.x;
   const pits=S.pits.slice().sort((a,b)=>a.a-b.a);let cx=-10;
   const seg=(a,b)=>GameArt.seg(ctx,a,b,gy,H,S.x,th,S.t);
   GameArt.voidFill(ctx,W,H,gy,th,S.t);
   for(const q of pits){const a=px(q.a),b=px(q.b);seg(cx,Math.min(a,W+10));cx=Math.max(cx,b)}
   seg(cx,W+10);
   /* предметы */
   const t=S.t;
   for(const it of S.items){
    const x=px(it.x),y=gy-it.h;if(x<-60||x>W+80)continue;
    if(GameArt.item(ctx,it,x,y,gy,t,H))continue;
    if(it.t==='byte'||it.t==='gold'){
     const s=it.t==='gold'?9:7;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*3+it.x)*.3);ctx.fillStyle=col.tx;ctx.fillRect(-s,-s,s*2,s*2);
     ctx.fillStyle=col.bg;ctx.fillRect(-s+3,-s+3,s*2-6,s*2-6);ctx.fillStyle=col.tx;ctx.fillRect(-2,-2,4,4);if(it.t==='gold'){ctx.lineWidth=2;ctx.strokeStyle=col.tx;ctx.strokeRect(-s-3,-s-3,s*2+6,s*2+6)}ctx.restore()}
    else if(it.t==='bug'){
     const h=it.big?30:22,w=it.big?13:11;ctx.fillStyle=col.err;ctx.beginPath();ctx.moveTo(x-w,gy);ctx.lineTo(x,gy-h);ctx.lineTo(x+w,gy);ctx.closePath();ctx.fill();
     ctx.fillStyle=col.bg;ctx.font='700 12px '+col.font;ctx.textAlign='center';ctx.fillText('!',x,gy-4)}
    else if(it.t==='door'){const dh=64;ctx.save();ctx.translate(x,gy);ctx.fillStyle=col.s2;ctx.fillRect(-24,-dh,48,dh);ctx.strokeStyle=col.tx;ctx.lineWidth=3;ctx.strokeRect(-24,-dh,48,dh);ctx.fillStyle=col.tx;ctx.globalAlpha=.55+.35*Math.sin(t*4);ctx.font='700 15px monospace';ctx.textAlign='center';ctx.fillText('</>',0,-dh/2+5);ctx.restore()}
    else if(it.t==='proj'){ctx.save();ctx.translate(x,y);ctx.rotate(t*5);ctx.fillStyle=col.err;ctx.fillRect(-8,-8,16,16);ctx.fillStyle=col.bg;ctx.fillRect(-3,-3,6,6);ctx.restore()}
    else if(it.t==='fix'){ctx.save();ctx.translate(x,y+Math.sin(t*4+it.x)*3);ctx.fillStyle='#f1f2f4';ctx.fillRect(-13,-13,26,26);ctx.fillStyle=col.bg;ctx.fillRect(-7,-2,14,4);ctx.fillRect(-2,-7,4,14);ctx.restore()}
    else if(it.t==='shield'||it.t==='magnet'){
     ctx.save();ctx.translate(x,y+Math.sin(t*3)*3);ctx.strokeStyle=col.tx;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.stroke();ctx.fillStyle=col.tx;
     if(it.t==='shield'){ctx.beginPath();ctx.moveTo(-7,-6);ctx.lineTo(7,-6);ctx.lineTo(7,2);ctx.lineTo(0,9);ctx.lineTo(-7,2);ctx.closePath();ctx.fill()}
     else{ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,6,Math.PI,0,true);ctx.moveTo(-6,0);ctx.lineTo(-6,6);ctx.moveTo(6,0);ctx.lineTo(6,6);ctx.stroke()}ctx.restore()}
    else if(it.t==='zone'){
     const w=it.w,warn=it.age<=1.2;ctx.save();ctx.globalAlpha=warn?.18+.18*Math.abs(Math.sin(it.age*10)):.7;ctx.fillStyle=col.err;ctx.fillRect(x-w/2,gy-3,w,H-gy+3);
     if(warn){ctx.globalAlpha=.9;ctx.strokeStyle=col.err;ctx.lineWidth=2;ctx.strokeRect(x-w/2,gy-3,w,10)}ctx.restore()}}
   /* босс */
   if(S.boss){
    const B=S.boss,bx=W-62,by=Math.max(70,H*.2)+Math.sin(B.bob*2)*12,j=B.phase>1&&Math.sin(t*40)>.9?3:0;
    ctx.save();ctx.translate(bx+j,by);
    ctx.fillStyle=col.tx;ctx.fillRect(-36,-30,72,60);ctx.fillStyle=col.bg;ctx.fillRect(-24,-18,18,14);ctx.fillRect(6,-18,18,14);
    ctx.fillStyle=col.tx;ctx.fillRect(-18,-14,6,6);ctx.fillRect(12,-14,6,6);ctx.fillStyle=col.err;ctx.fillRect(-20,8,40,8);
    if(B.charge){ctx.strokeStyle=col.err;ctx.lineWidth=4;ctx.strokeRect(-40,-34,80,68)}
    ctx.fillStyle=col.bg;ctx.font='700 11px '+col.font;ctx.textAlign='center';ctx.fillText('404',0,24);ctx.restore()}
   /* игрок */
   GameArt.shadow(ctx,E.PX,gy,S.p.y,E.PH);
   {const p=S.p,blink=p.inv>0&&Math.floor(t*14)%2;
    if(!blink||GameSpark.ready()){ctx.save();if(blink)ctx.globalAlpha=.45;ctx.translate(E.PX,p.y+E.PH/2);
     if(!GameSpark.draw(ctx,S,t,'level',E)){ctx.fillStyle=col.tx;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-12,-12,24,24,7);else ctx.rect(-12,-12,24,24);ctx.fill();
     ctx.fillStyle=col.bg;ctx.beginPath();ctx.arc(-4.5,-2,3,0,7);ctx.arc(4.5,-2,3,0,7);ctx.fill();
     ctx.strokeStyle=col.tx;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(0,-17);ctx.stroke();ctx.beginPath();ctx.arc(0,-18,2,0,7);ctx.fillStyle=col.tx;ctx.fill()}
     if(p.sh){ctx.strokeStyle=col.tx;ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(0,0,21,0,7);ctx.stroke()}
     if(p.mag>0){ctx.strokeStyle=col.tx2;ctx.setLineDash([4,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,28+Math.sin(t*8)*2,0,7);ctx.stroke()}
     ctx.restore()}}
   GameArt.parts(ctx,S,S.t,th,GameCore.perf.q,E);
   /* HUD */
   GameArt.hud(ctx,S,W,H,S.t,{th,font:col.font,hearts:S.maxHearts>0,f:mode==='level'?Math.min(1,S.x/S.target):-1,label:mode==='boss'?T('Босс'):mode==='endless'?T('Бесконечный режим'):Lv+' · '+th.name});
   fxDraw(ctx,W,H,S.t,col)
   if(hint>0&&mode!=='boss'&&Lv<=1){ctx.globalAlpha=Math.min(1,hint);ctx.fillStyle=col.tx;ctx.textAlign='center';ctx.font='600 14px '+col.font;ctx.fillText(T('Один тап — прыжок. Держи — прыгнешь выше.'),W/2,gy+60);ctx.globalAlpha=1}}
  /* ---------- управление ---------- */
  const pd=e=>{if(paused||ended)return;e.preventDefault();down=true;press=true;if(sv.snd&&!ac)beep(1,.001,'sine',.0001)};
  const pu=()=>{down=false};
  /* бой с боссом: джойстик слева (лево/право), прыжок справа; несколько пальцев сразу */
  const ptr={};
  const lp=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/sc,y:(e.clientY-r.top)/sc,w:r.width/sc}};
  const pdA=e=>{if(paused||ended)return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(x){}const q=lp(e);
   if(q.x<q.w/2){ptr[e.pointerId]='s';stk={ox:q.x,oy:q.y,id:e.pointerId}}else if([6,8,9,10].includes(S.bid)&&Math.hypot(q.x-(S.W-62),q.y-(S.H-150))<40){ptr[e.pointerId]='r';GameArena.reject(S);frz=true}else{ptr[e.pointerId]='j';down=true;press=true}
   if(sv.snd&&!ac)beep(1,.001,'sine',.0001)};
  const pmA=e=>{if(ptr[e.pointerId]!=='s'||!stk)return;const q=lp(e);ax=Math.max(-1,Math.min(1,(q.x-stk.ox)/28));if(Math.abs(ax)<.25)ax=0};
  const puA=e=>{const k=ptr[e.pointerId];if(!k)return;delete ptr[e.pointerId];if(k==='s'){ax=0;stk=null}else if(k==='j')down=false;else if(k==='r')frz=false};
  if(mode==='boss'){cv.addEventListener('pointerdown',pdA);cv.addEventListener('pointermove',pmA);cv.addEventListener('pointerup',puA);cv.addEventListener('pointercancel',puA)}
  else{cv.addEventListener('pointerdown',pd);cv.addEventListener('pointerup',pu);cv.addEventListener('pointercancel',pu);cv.addEventListener('pointerleave',pu)}
  pb.onclick=()=>pause(!paused);
  const kd=e=>{if(mode==='boss'&&e.code==='KeyR'&&S&&!paused&&!ended)GameArena.reject(S);if(e.code==='KeyF')frz=true;if(mode==='boss'){if(e.code==='ArrowLeft'||e.code==='KeyA')ax=-1;else if(e.code==='ArrowRight'||e.code==='KeyD')ax=1}
   if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(!e.repeat&&!paused&&!ended){down=true;press=true}}else if(e.code==='Escape')pause(!paused)};
  const ku=e=>{if(e.code==='KeyF')frz=false;if(e.code==='Space'||e.code==='ArrowUp')down=false;if(mode==='boss'&&(e.code==='ArrowLeft'||e.code==='ArrowRight'||e.code==='KeyA'||e.code==='KeyD'))ax=0};
  const vis=()=>{if(document.hidden)pause(true)};
  const rs=()=>{if(S){size();if(!raf)raf=requestAnimationFrame(loop)}};
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);document.addEventListener('visibilitychange',vis);window.addEventListener('resize',rs);
  function stop(){gone=true;cancelAnimationFrame(raf);raf=0;document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);document.removeEventListener('visibilitychange',vis);window.removeEventListener('resize',rs)}
  cur._stop=stop;cur._inPlay=true;
  requestAnimationFrame(()=>{if(!gone)reset()});
  return{stop}}
 /* ---------- плашка «Нет сети» ---------- */
 let chip=null,chipT=0;
 function hideChip(){clearTimeout(chipT);if(chip){chip.classList.remove('on');const c=chip;chip=null;setTimeout(()=>c.remove(),300)}}
 function showChip(){
  if(chip||(cur&&cur.isConnected))return;
  chip=mk('div','gm-chip');chip.setAttribute('role','status');
  const t=mk('span','',T('Нет сети')),go=mk('button','gm-chip-go',T('Поиграть')),x=mk('button','gm-chip-x','×');
  go.type='button';x.type='button';x.setAttribute('aria-label',T('Закрыть'));
  go.onclick=()=>{hideChip();open()};x.onclick=hideChip;
  chip.append(t,go,x);(document.getElementById('app')||document.body).append(chip);
  requestAnimationFrame(()=>chip&&chip.classList.add('on'));chipT=setTimeout(hideChip,12000)}
 Hooks.on('app:ready',()=>{
  SCREENS.game=open;
  window.addEventListener('offline',showChip);window.addEventListener('online',hideChip);
  if(typeof navigator!=='undefined'&&navigator.onLine===false)setTimeout(showChip,1500)});
 /* ---------- строка в Настройках ---------- */
 Hooks.on('settings:rendered',v=>{
  const ab=$('[data-go="about"]',v);if(!ab||$('[data-game-go]',v))return;
  const r=el('<button class="sr" data-game-go><span class="si c"></span><span class="m"><b></b><small></small></span>'+ic('chevR')+'</button>');
  $('b',r).textContent=T('Байт-прыгун');$('small',r).textContent=T('Отдых: игра без интернета');
  r.onclick=()=>open();ab.insertAdjacentElement('beforebegin',r)});
 /* форма Искры (эволюция 0..3): правила открытия автор не задал, выбор только программный; сохраняется */
 return{open,state:()=>sv,setForm:v=>{sv.form=Math.max(0,Math.min(3,v|0));if(typeof GameSpark!=='undefined')GameSpark.form(sv.form);save()}}})();
