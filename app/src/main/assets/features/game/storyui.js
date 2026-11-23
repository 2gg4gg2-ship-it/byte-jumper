/* ===== ЭКРАНЫ ИСТОРИИ: читалка страниц (пролог) и «Книга истории» из меню =====
   Спойлеры: главы и боссы, до которых игрок не дошёл, закрыты. Помехи, финалы и тайны открываются после 10 боссов. */
const GameStoryUI=(()=>{
 const mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
 function read(host,pages,done,skipText){
  host.textContent='';
  const box=mk('div','gm-story'),t=mk('h2','gm-st-t'),x=mk('p','gm-st-x'),dots=mk('div','gm-st-d');
  const row=mk('div','gm-row'),nx=mk('button','gm-btn pri'),sk=mk('button','gm-btn ghost',skipText||'Пропустить');
  nx.type=sk.type='button';let i=0;
  const show=()=>{const p=pages[i];t.textContent=p.t;x.textContent=p.x;
   dots.textContent='';pages.forEach((_,k)=>dots.append(mk('i',k===i?'on':'')));
   nx.textContent=i===pages.length-1?'Дальше':'›';box.classList.remove('in');void box.offsetWidth;box.classList.add('in')};
  nx.onclick=()=>{if(i<pages.length-1){i++;show()}else done()};
  sk.onclick=()=>done();
  row.append(sk,nx);box.append(t,x,dots,row);host.append(box);show()}
 /* книга: defeated = сколько боссов побеждено (0–10) */
 function book(host,defeated,back){
  host.textContent='';
  const S=GameStory,top=mk('div','gm-lt'),b=mk('button','gm-btn ghost sm','‹');b.type='button';b.setAttribute('aria-label','В меню');b.onclick=back;
  top.append(b,mk('h3','','История'));host.append(top);
  const sec=h=>host.append(mk('h4','gm-sec',h));
  const card=(h,sub,body)=>{const d=mk('details','gm-bk'),s=mk('summary','');s.append(mk('b','',h));if(sub)s.append(mk('small','',sub));d.append(s,mk('p','',body));host.append(d)};
  const lock=(h,sub,why)=>{const d=mk('div','gm-bk lock');d.append(mk('b','',h));if(sub)d.append(mk('small','',sub));d.append(mk('small','',why));host.append(d)};
  host.append(mk('p','gm-hint','Искра: Нулевой Ключ. Главы открываются, когда ты побеждаешь предыдущего босса.'));
  sec('Начало');card('Суть истории','Сеть Кайрема',S.intro.replace(/^Суть истории\s*/,''));
  card('Мир и законы','Три закона Кайрема',S.world.replace(/^Мир и его законы\s*/,''));
  card('Персонажи','Искра, Бит, Тень и другие',S.chars.replace(/^Персонажи\s*/,''));
  sec('Десять глав');
  S.chapters.forEach(c=>{
   const ttl=c.n+'. '+c.name,sub='Уровни '+c.from_+'–'+c.to;
   if(c.n>defeated+1){lock(ttl,sub,'Закрыто: победи предыдущего босса.');return}
   const lv=c.levels.map(l=>l[0]+'. '+l[1]+(l[2]?' — '+l[2]:'')).join('\n');
   const txt='Фон: '+c.bg+'\n\nСюжет: '+c.plot+'\n\n'+lv+'\n\n'+(c.n<=defeated?'ПОБЕЖДЁН: '+c.boss.name+'\n\n'+c.boss.text:'Босс: '+c.boss.name+(c.boss.code?' («'+c.boss.code+'»)':'')+'\n\nПодробности боя откроются после победы над ним.');
   card(ttl,sub+(c.n<=defeated?' · пройдена':''),txt)});
  sec('Помехи на экране');
  if(defeated<1)lock('Помехи','Сбой','Появятся после первого босса.');
  else card('Как растут помехи','Стадий открыто: '+Math.min(defeated,10),S.stages.filter(s=>s.n<=defeated).map(s=>s.n+' ('+s.boss+'): '+s.screen+' Звук: '+s.sound+' '+s.ui).join('\n\n'));
  sec('Финалы');
  if(defeated<10)lock('Финалы','Четыре исхода','Откроются после победы над десятым боссом.');
  else card('Финалы','Выбор Искры',S.finals.replace(/^Финалы\s*/,''))}
 return{read,book}})();
