/* ===== ЭКРАНЫ ИСТОРИИ: читалка страниц (пролог, финал) и «Книга истории» из меню ===== */
const GameStoryUI=(()=>{
 const mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
 /* читалка: pages=[{t,x}], по тапу «Дальше»; в конце вызывает done */
 function read(host,pages,done,skipText){
  host.textContent='';
  const box=mk('div','gm-story'),t=mk('h2','gm-st-t'),x=mk('p','gm-st-x'),dots=mk('div','gm-st-d');
  const row=mk('div','gm-row'),nx=mk('button','gm-btn pri'),sk=mk('button','gm-btn ghost',skipText||'Пропустить');
  nx.type=sk.type='button';let i=0;
  const show=()=>{const p=pages[i];t.textContent=p.t;x.textContent='';x.textContent=p.x;
   dots.textContent='';pages.forEach((_,k)=>dots.append(mk('i',k===i?'on':'')));
   nx.textContent=i===pages.length-1?'Дальше':'›';box.classList.remove('in');void box.offsetWidth;box.classList.add('in')};
  nx.onclick=()=>{if(i<pages.length-1){i++;show()}else done()};
  sk.onclick=()=>done();
  row.append(sk,nx);box.append(t,x,dots,row);host.append(box);show()}
 /* книга истории: пролог, боссы (только открытые подробно), финал */
 function book(host,defeated,back){
  host.textContent='';
  const top=mk('div','gm-lt'),b=mk('button','gm-btn ghost sm','‹');b.type='button';b.setAttribute('aria-label','В меню');b.onclick=back;
  top.append(b,mk('h3','','История'));host.append(top);
  const sec=(h)=>host.append(mk('h4','gm-sec',h));
  const card=(h,sub,body)=>{const d=mk('details','gm-bk'),s=mk('summary','');s.append(mk('b','',h));if(sub)s.append(mk('small','',sub));d.append(s,mk('p','',body));host.append(d)};
  const S=GameStory;
  sec('Пролог');card('Мир Кода','Как всё началось',S.prologue.map(p=>p.t+'. '+p.x).join('\n\n'));
  sec('Десять Ошибок');
  S.bosses.forEach(B=>{
   const open=B.id<=defeated+1&&B.built||B.id<=defeated;
   if(B.id<=defeated)card(B.id+'. '+B.name,B.title+' · побеждён',B.story+(B.after?'\n\n'+B.after:''));
   else if(B.built&&B.id===defeated+1)card(B.id+'. '+B.name,B.title,B.story);
   else card(B.id+'. '+(B.id<=defeated+1?B.name:'???'),B.act,B.id<=defeated+1?B.story:'Откроется, когда победишь предыдущего босса.')});
  sec('После победы');card('Дверь «</>»','Финал',S.epilogue.map(p=>p.t+'. '+p.x).join('\n\n'))}
 return{read,book}})();
