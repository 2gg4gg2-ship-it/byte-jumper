/* Искра: визуальный слой (спрайты утверждённой внешности, выражения, тень, частицы).
   Только рисование: физика, хитбокс и управление остаются в engine.js / arena.js.
   Ресурсы: spark.png + spark-atlas.js (локально, без сети). */
var GameSpark=(function(){
 var sc=document.currentScript,dir=sc&&sc.src?sc.src.replace(/[^\/]*$/,''):'';
 var A=window.SparkAtlas,img=null,ready=false,err='';
 var VH=32;                       /* высота Искры на экране в логических единицах (хитбокс 24 не меняется) */
 var RUN=['r0','r1','r2','r3','r6','r7'];
 /* Формы. Правила открытия эволюций не заданы: доступна только base. У эволюций в атласе есть лишь стоячий кадр. */
 var FORMS={base:{open:true,idle:'idle',front:'front',run:RUN,rise:'r4',fall:'r5'},
  evo1:{open:false,idle:'evo1_n'},evo2:{open:false,idle:'evo2_n'},evo3:{open:false,idle:'evo3_n'}};
 var form='base';
 var st={pain:-99,emo:'',jump:-99,land:-99,was:true,parts:[],seed:7,last:''};
 var rnd=function(){st.seed=(st.seed*1664525+1013904223)>>>0;return st.seed/4294967296};
 function load(){
  if(img||!A)return;
  img=new Image();
  img.onload=function(){ready=true;document.documentElement.setAttribute('data-spark','ok')};
  img.onerror=function(){err='spark.png не загрузился';document.documentElement.setAttribute('data-spark','error');if(window.console)console.warn('[Искра] '+err+': запасной спрайт')};
  img.src=dir+A.file;
 }
 function reset(){st.pain=-99;st.emo='';st.jump=-99;st.land=-99;st.was=true;st.parts.length=0}
 function setForm(id){form=FORMS[id]&&FORMS[id].open?id:'base'}
 /* события игры: боль = только выражение и частицы, поза и физика не меняются */
 function note(e,S){
  if(e==='hit'){st.pain=S.t;spawn(S.t)}
  else if(e==='jump')st.jump=S.t;
  else if(e==='die')st.emo='sad';
  else if(e==='win')st.emo='joy';
 }
 function spawn(t){
  st.parts=st.parts.filter(function(q){return t-q.b<q.ttl});
  var side=rnd()<.5?-1:1;
  for(var i=0;i<7&&st.parts.length<16;i++){
   var a=(-1.35+rnd()*1.6)+(side<0?Math.PI*0.0:0);
   st.parts.push({a:a,s:26+rnd()*34,l:3+rnd()*4,c:i%2?'#ffffff':'#bfe6ff',b:t,ttl:.42,x:side});
  }
  st.parts.push({flash:1,b:t,ttl:.2,x:side});
 }
 function expr(o){
  var t=o.t;
  if(t>=st.pain&&t-st.pain<.55)return'pain';
  if(o.over==='win'||(o.over&&st.emo==='joy'))return'joy';
  if(o.over==='dead'||(o.over&&st.emo==='sad'))return'sad';
  return o.front?'focus':'n';
 }
 function pick(o){
  var F=FORMS[form]||FORMS.base,b;
  if(o.front&&F.front)b=F.front;
  else if(o.over||!F.run)b=F.idle;
  else if(!o.on)b=o.vy<0?F.rise:F.fall;
  else b=F.run[Math.floor(o.t*12)%F.run.length];
  return b;
 }
 function draw(ctx,o){
  if(!ready||!A)return false;
  var b=pick(o),ex=expr(o),r=A.s[b+'_'+ex]||A.s[b+'_n'];
  if(!r)return false;
  var t=o.t,u=VH/128,sx=1,sy=1;
  if(o.on&&!st.was)st.land=t;st.was=o.on;
  var la=t-st.land;if(la>=0&&la<.14){var k=Math.sin(Math.PI*la/.14);sy-=.05*k;sx+=.04*k}
  var ja=t-st.jump;if(ja>=0&&ja<.16){var k2=Math.sin(Math.PI*ja/.16);sy+=.05*k2;sx-=.04*k2}
  if(o.over)sy+=Math.sin(t*3)*.012;
  var tilt=(o.front||o.on||o.flip)?0:Math.max(-.15,Math.min(.15,o.vy/3200));
  /* тень на опоре */
  if(o.ground!=null){
   var gh=Math.max(0,o.ground-o.y),kk=Math.max(0,1-gh/170);
   if(kk>0){ctx.save();ctx.globalAlpha=.3*kk;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(o.x-1,o.ground+1.5,12*(.55+.45*kk),3.2*(.6+.4*kk),0,0,7);ctx.fill();ctx.restore()}
  }
  ctx.save();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.globalAlpha=o.alpha==null?1:o.alpha;
  ctx.translate(o.x,o.cy);ctx.rotate(o.flip?Math.PI:tilt);
  ctx.translate(0,o.half);ctx.scale(sx,sy);
  ctx.drawImage(img,r[0],r[1],r[2],r[3],-r[4]*u,-r[5]*u,r[2]*u,r[3]*u);
  ctx.restore();
  /* щит и магнит (прежние кольца, вокруг хитбокса) */
  if(o.col){
   if(o.sh){ctx.save();ctx.strokeStyle=o.col.tx;ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(o.x,o.cy,21,0,7);ctx.stroke();ctx.restore()}
   if(o.mag>0){ctx.save();ctx.strokeStyle=o.col.tx2;ctx.setLineDash([4,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(o.x,o.cy,28+Math.sin(t*8)*2,0,7);ctx.stroke();ctx.restore()}
  }
  /* частицы урона: компактный блик и короткие штрихи у лица, без взрыва */
  if(st.parts.length){
   ctx.save();ctx.lineCap='round';
   for(var i=0;i<st.parts.length;i++){
    var q=st.parts[i],a=t-q.b;if(a<0||a>q.ttl)continue;
    var bx=o.x+(o.front?q.x*9:11),by=o.cy-6,f=1-a/q.ttl;
    if(q.flash){var g=ctx.createRadialGradient(bx,by,0,bx,by,8*f+2);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(191,230,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(bx,by,8*f+2,0,7);ctx.fill();continue}
    var dx=Math.cos(q.a)*(o.front?q.x:1),dy=Math.sin(q.a),px=bx+dx*q.s*a,py=by+dy*q.s*a;
    ctx.globalAlpha=f;ctx.strokeStyle=q.c;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+dx*q.l,py+dy*q.l);ctx.stroke();
   }
   ctx.restore();
  }
  st.last=b+'_'+ex;
  return true;
 }
 function state(){return{ready:ready,err:err,sprite:st.last,parts:st.parts.length,form:form,pain:st.pain}}
 load();
 return{load:load,reset:reset,note:note,draw:draw,state:state,setForm:setForm,forms:FORMS,expr:expr};
})();
