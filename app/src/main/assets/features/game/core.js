/* ===== ЯДРО ИГРЫ (слой 0): фиксированный шаг, авто-качество, страж ошибок, безопасное хранилище, статистика кадров =====
   Ядро ничего не знает об игре и не трогает DOM. Всё, что делает игру стабильной на слабых телефонах, живёт здесь. */
const GameCore=(()=>{
 /* Качество подстраивается под телефон: если кадр дольше 24 мс несколько раз подряд, качество падает
    (меньше частиц и помех, ниже плотность холста). Если кадры короткие, поднимается обратно. */
 const perf={q:1,slow:0,fast:0,dpr:2};
 function tick(dtMs){
  if(dtMs>24){perf.slow++;perf.fast=0}else if(dtMs<18){perf.fast++;perf.slow=0}
  if(perf.slow>30&&perf.q>.4){perf.q=Math.max(.4,perf.q-.2);perf.slow=0;return true}
  if(perf.fast>240&&perf.q<1){perf.q=Math.min(1,perf.q+.2);perf.fast=0;return true}
  return false}
 const dprFor=base=>Math.max(1,Math.min(base,perf.q>=.8?2:perf.q>=.6?1.5:1));
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
 return{perf,tick,dprFor,steps,frame,stats:st,guard,fatal,resetErrors,errors,store}})();
