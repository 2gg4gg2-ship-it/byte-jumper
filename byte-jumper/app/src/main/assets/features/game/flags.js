/* ===== СОХРАНЕНИЕ, ФЛАГИ И РЕЖИМ ПОМЕХ (слой 1, логика): только данные, без DOM, без localStorage =====
   Версия сохранения 2. Старые сохранения (без поля v) мигрируют без потерь: неизвестные поля копируются как есть.
   Миграция идемпотентна: migrate(migrate(x)) совпадает с migrate(x). Онлайн позже ляжет на то же поле v. */
const GameFlags=(()=>{
 const VERSION=2;
 const MODES=['full','soft','off'];
 const MODE_LABEL={full:'полные',soft:'мягкие',off:'выкл'};
 /* выборы из дизайн-документа: 36 (trust), 45 (refused), 88 и 96 (offer). Значения — только из списка */
 const CHOICES={trust:['yes','no'],refused:['yes','no'],offer88:['accept','decline'],offer96:['accept','decline']};
 const FIXABLE_MIN=90;   /* «Исправление»: починить не меньше 90 из 100 Потеряшек */
 const isObj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const uniqInts=(arr,a,b)=>[...new Set(arr.filter(x=>Number.isInteger(x)&&x>=a&&x<=b))];
 /* помехи: новое поле mode; старое gl (true/false/0) переводится так, чтобы «выкл» сохранялось */
 function glitchMode(j){
  if(MODES.includes(j.mode))return j.mode;
  return(j.gl===false||j.gl===0)?'off':'full';
 }
 function migrate(raw){
  const j=isObj(raw)?raw:{};
  const out=Object.assign({},j);                 /* неизвестные поля сохраняем */
  const lfs=Array.isArray(j.lfs)?uniqInts(j.lfs,1,100).slice(0,100):[];
  const fl={};
  for(const k of Object.keys(CHOICES)){const v=isObj(j.fl)?j.fl[k]:'';fl[k]=CHOICES[k].includes(v)?v:''}
  out.v=VERSION;
  out.u=Math.min(100,Math.max(1,(j.u|0)||1));
  out.st=isObj(j.st)?j.st:{};
  out.b=j.b|0;out.best=j.best|0;
  out.boss=!!j.boss;
  out.snd=j.snd!==false&&j.snd!==0;              /* по умолчанию звук включён; сохранённое false остаётся false */
  out.bosses=Math.min(10,(j.bosses|0)||(j.boss?1:0));
  out.seen=!!j.seen;
  out.mode=glitchMode(j);
  out.gl=out.mode!=='off';                       /* совместимость со старыми читателями */
  out.end=typeof j.end==='string'?j.end:'';
  out.ends=Array.isArray(j.ends)?j.ends.filter(x=>typeof x==='string').slice(0,4):[];
  out.lfs=lfs;out.lf=lfs.length;                 /* счётчик всегда равен списку */
  out.tr=j.tr|0;
  out.form=Math.max(0,Math.min(3,j.form|0));
  out.fl=fl;
  out.abSpent=Array.isArray(j.abSpent)?[...new Set(j.abSpent.filter(x=>typeof x==='string'))]:[];
  return out;
 }
 /* выбор игрока: только разрешённые значения; неверный возвращает false и не меняет сохранение */
 function choose(sv,key,value){
  if(!CHOICES[key]||!CHOICES[key].includes(value))return false;
  sv.fl=Object.assign({},sv.fl,{[key]:value});return true;
 }
 function fixable(sv){return(sv.lfs||[]).length>=FIXABLE_MIN}
 function nextMode(m){const i=MODES.indexOf(m);return MODES[(i<0?0:i+1)%MODES.length]}
 /* качество эффектов помех: полные — как есть, мягкие — 35 %, выкл — 0 (не рисовать) */
 function fxQuality(mode,q){return mode==='off'?0:mode==='soft'?q*.35:q}
 return{VERSION,MODES,MODE_LABEL,CHOICES,FIXABLE_MIN,migrate,choose,fixable,nextMode,
  modeLabel:m=>MODE_LABEL[m]||MODE_LABEL.full,fxQuality};
})();
