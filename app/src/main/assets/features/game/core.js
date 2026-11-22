/* ===== МАЛЕНЬКОЕ ЯДРО ИГРЫ: фиксированный шаг, самонастройка качества, единый ввод ===== */
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
 return{perf,tick,dprFor,steps}})();
