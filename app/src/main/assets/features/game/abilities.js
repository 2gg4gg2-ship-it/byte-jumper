/* ===== СПОСОБНОСТИ ГЕРОЯ (слой 1, логика): реестр-таблица, без DOM и без эффектов =====
   Способность открывается, когда побеждён нужный босс (поле boss). Тратится один раз за забег (abSpent).
   Новая способность — это строка LIST. Эффект в физике подключается отдельно (engine.js / arena.js). */
const GameAbilities=(()=>{
 const LIST=[
  {id:'fall',name:'Быстрое падение',boss:1},
  {id:'double',name:'Двойной прыжок',boss:2},
  {id:'think',name:'Замедление «Think» на 2 с',boss:3},
  {id:'shield',name:'Щит сети на один удар',boss:4},
  {id:'owner',name:'Ключ Владельца: +20% байтов',boss:5},
  {id:'cancel',name:'«Отмена» одного удара',boss:6},
  {id:'echo',name:'Эхо-прыжок',boss:7},
  {id:'magnet',name:'Магнит памяти',boss:8},
  {id:'calm',name:'«Спокойствие»',boss:9}];
 const byId=id=>LIST.find(a=>a.id===id)||null;
 /* открытые способности по числу побеждённых боссов */
 const opened=defeated=>LIST.filter(a=>a.boss<=(defeated|0)).map(a=>a.id);
 /* доступные сейчас: открыты и не потрачены в этом забеге */
 const available=sv=>opened(sv.bosses).filter(id=>!(sv.abSpent||[]).includes(id));
 /* потратить на забег; false, если способность не открыта, неизвестна или уже потрачена */
 function spend(sv,id){
  if(!byId(id)||!opened(sv.bosses).includes(id)||(sv.abSpent||[]).includes(id))return false;
  sv.abSpent=(sv.abSpent||[]).concat(id);return true;
 }
 function newRun(sv){sv.abSpent=[]}
 return{LIST,byId,opened,available,spend,newRun};
})();
