/* ===== ЯДРО ИГРЫ (слой 0): фиксированный шаг, авто-качество, страж ошибок, безопасное хранилище, статистика кадров =====
   Ядро ничего не знает об игре и не трогает DOM. Всё, что делает игру стабильной на слабых телефонах, живёт здесь. */
const GameCore=(()=>{
 /* Качество подстраивается под телефон по скользящему среднему времени кадра (не по числу подряд медленных кадров, как раньше: при кадрах 20–23 мс
    старый счётчик не срабатывал вовсе, хотя игра шла на 45 fps). Четыре ступени: холст 2× → 1,5× → 1,25× → 1× от экрана, вместе с ними падает q (частицы, помехи).
    Среднее выше 19,5 мс держится 24 кадра подряд (0,4 с) — ступень вниз; одиночный провал кадра (сборка мусора, кэш) не считается (кадр режется до 100 мс, дольше 400 мс — пауза, не считается).
    После смены ступени и после старта уровня (settle) 45–60 кадров не оцениваются: перерисовка холста и кэша слоёв даёт разовый скачок.
    Вверх — только если среднее ниже 15,5 мс 600 кадров (10 с); если сразу после подъёма снова тормозит, выше этой ступени больше не поднимаемся (cap). */
 const LV=[{q:1,k:1},{q:.8,k:.75},{q:.6,k:.625},{q:.4,k:.5}];
 const perf={q:1,slow:0,fast:0,dpr:2,lv:0,cap:0,avg:16.7,grace:0,drops:0,ups:0,since:0,upAt:null};
 function level(i){perf.lv=i;perf.q=LV[i].q;perf.slow=0;perf.fast=0;perf.avg=17;perf.grace=45}
 function settle(){perf.avg=16.7;perf.slow=0;perf.fast=0;perf.grace=60}
 function tick(dtMs){
  if(!(dtMs>0)||dtMs>400)return false;
  perf.since++;perf.avg+=(Math.min(dtMs,100)-perf.avg)*.1;
  if(perf.grace>0){perf.grace--;return false}
  if(perf.avg>19.5){perf.slow++;perf.fast=0}else if(perf.avg<15.5){perf.fast++;perf.slow=0}else perf.slow=0;
  if(perf.slow>=24&&perf.lv<LV.length-1){
   if(perf.upAt!=null&&perf.since-perf.upAt<600)perf.cap=perf.lv+1;
   perf.drops++;level(perf.lv+1);return true}
  if(perf.fast>=600&&perf.lv>perf.cap&&perf.ups<3){perf.ups++;perf.upAt=perf.since;level(perf.lv-1);return true}
  return false}
 const dprFor=base=>Math.max(1,Math.round(base*LV[perf.lv].k*100)/100);
 /* фиксированный шаг 1/60 с: возвращает, сколько шагов выполнить (не больше 6) */
 function steps(acc,dt){acc+=dt;let n=0;while(acc>=1/60&&n<6){acc-=1/60;n++}return{acc:n>=6?0:acc,n}}
 /* --- статистика кадров: скользящее среднее и худший кадр за последние 120 кадров (для отладки и авто-качества) --- */
 const st={avg:16.7,worst:0,n:0,w:0};
 function frame(dtMs){st.avg+=(dtMs-st.avg)*.05;st.w=Math.max(st.w,dtMs);if(++st.n%120===0){st.worst=st.w;st.w=0}}
 /* --- страж ошибок: исключение в кадре не останавливает игру навсегда; журнал последних 20 ошибок; 5 подряд = fatal --- */
 const errors=[];let streak=0;
 function guard(fn,label){
  try{const r=fn();streak=0;return r}
  catch(e){streak++;errors.push({l:label||'',m:String(e&&e.message||e),t:Date.now()});if(errors.length>20)errors.shift();return undefined}}
 const fatal=()=>streak>=5;
 const resetErrors=()=>{streak=0};
 /* --- безопасное хранилище: если localStorage недоступен или переполнен, данные живут в памяти до закрытия --- */
 const mem={};
 const store={
  read(k){try{const v=localStorage.getItem(k);if(v!=null)return v}catch(e){}return mem[k]==null?null:mem[k]},
  write(k,v){mem[k]=v;try{localStorage.setItem(k,v);return true}catch(e){return false}},
  json(k,def){try{const v=store.read(k);return v==null?def:JSON.parse(v)}catch(e){return def}}};
 return{perf,tick,settle,dprFor,steps,frame,stats:st,guard,fatal,resetErrors,errors,store}})();
