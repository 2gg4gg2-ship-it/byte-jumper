/* Искра: визуальный слой. Персонаж собирается из отдельных частей прямо на canvas (вектор, без картинки):
   жёсткие пластины оболочки (спинной плавник, задняя пластина, корпус), тёмная лицевая область,
   глаза-капсулы, две короткие ноги с настоящей сменой опоры.
   Только рисование: физика, хитбокс и управление остаются в engine.js / arena.js.
   Единицы рисования: Искра высотой 128, начало координат — центр низа ног. На экране высота VH. */
var GameSpark=(function(){
 var VH=32;                        /* высота Искры на экране (хитбокс 24 не меняется) */
 var FORMS={base:{open:true},evo1:{open:false},evo2:{open:false},evo3:{open:false}};
 var form='base';
 var st={pain:-99,emo:'',jump:-99,land:-99,was:true,parts:[],seed:7,last:'',air:0,pt:0,fy:0,lastPose:null};
 var rnd=function(){st.seed=(st.seed*1664525+1013904223)>>>0;return st.seed/4294967296};
 var C={w0:'#ffffff',w1:'#eeeef9',w2:'#d3d4ea',w3:'#aeb1d1',w4:'#868ab0',ln:'#23273f',d0:'#262c4c',d1:'#12152a',d2:'#080a15',eye:'#dff8ff',glow:'#7fd8ff'};
 function lerp(a,b,k){return a+(b-a)*k}
 function cl(v,a,b){return v<a?a:v>b?b:v}
 function load(){document.documentElement.setAttribute('data-spark','ok')}
 function reset(){st.pain=-99;st.emo='';st.jump=-99;st.land=-99;st.was=true;st.parts.length=0;st.air=0;st.pt=0}
 function setForm(id){form=FORMS[id]&&FORMS[id].open?id:'base'}
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
   var a=(-1.35+rnd()*1.6);
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
 /* ---------- примитивы ---------- */
 function poly(c,pts,fill,stroke,lw){
  c.beginPath();c.moveTo(pts[0],pts[1]);
  for(var i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);
  c.closePath();
  if(fill){c.fillStyle=fill;c.fill()}
  if(stroke){c.lineWidth=lw||1.4;c.strokeStyle=stroke;c.lineJoin='round';c.stroke()}
 }
 function lin(c,x0,y0,x1,y1,s){var g=c.createLinearGradient(x0,y0,x1,y1);for(var i=0;i<s.length;i+=2)g.addColorStop(s[i],s[i+1]);return g}
 /* нога: ступня-клин + голень от бедра; бедро спрятано под корпусом */
 function leg(c,hx,hy,fx,fy,ang,front){
  c.save();
  c.lineCap='round';
  c.strokeStyle=C.d1;c.lineWidth=17;c.beginPath();c.moveTo(hx,hy);c.lineTo(fx,fy-12);c.stroke();
  c.translate(fx,fy);c.rotate(ang);c.scale(1.12,1.28);
  c.beginPath();
  if(front){c.moveTo(-10,-14);c.bezierCurveTo(-13,-6,-12,0,-6,0);c.lineTo(6,0);c.bezierCurveTo(12,0,13,-6,10,-14);c.closePath()}
  else{c.moveTo(-10,-14);c.bezierCurveTo(-13,-5,-11,0,-4,0);c.lineTo(9,0);c.bezierCurveTo(16,0,16,-5,12,-9);c.bezierCurveTo(8,-14,-2,-16,-10,-14);c.closePath()}
  c.fillStyle=lin(c,-8,-16,8,0,[0,'#2f3658',1,C.d2]);c.fill();c.save();c.clip();poly(c,[-12,-16,0,-15,-3,0,-10,0],'rgba(120,150,230,.16)');poly(c,[2,-15,12,-10,10,0,-3,0],'rgba(0,0,10,.35)');c.restore();
  c.lineWidth=1.1;c.strokeStyle='#05060d';c.stroke();
  c.beginPath();c.moveTo(-7,-11);c.quadraticCurveTo(0,-14,8,-10);c.lineWidth=1.3;c.strokeStyle='rgba(150,190,255,.38)';c.stroke();
  c.restore();
 }
 /* глаза: капсулы / дуги по выражению. cx,cy — центр лица, sp — половина расстояния, p — перспектива правого глаза */
 function eyes(c,ex,cxL,cxR,cy,w,h,blink,lx,ly,pr){
  c.save();c.lineCap='round';c.lineJoin='round';
  var xs=[cxL+lx,cxR+lx*1.1],sc=[1,pr],i,x,k;
  for(i=0;i<2;i++){
   x=xs[i];k=sc[i];var ww=w*k,hh=h*k,y=cy+ly,dir=i?1:-1;
   if(ex==='joy'){arc(c,x,y+3*k,7*k,0)}
   else if(ex==='sad'){
    c.beginPath();c.moveTo(x-7*k,y-1*k);c.quadraticCurveTo(x,y+(5*k),x+7*k,y-1*k);
    c.lineWidth=3.6*k;c.strokeStyle=C.eye;c.shadowColor=C.glow;c.shadowBlur=6;c.stroke();c.shadowBlur=0;
   }
   else if(ex==='pain'){
    var d=i?-1:1;
    c.beginPath();c.moveTo(x-d*7*k,y-8*k);c.lineTo(x+d*5*k,y);c.lineTo(x-d*7*k,y+8*k);
    c.lineWidth=3.8*k;c.strokeStyle=C.eye;c.shadowColor=C.glow;c.shadowBlur=7;c.stroke();c.shadowBlur=0;
   }
   else{
    var rot=0,hs=hh;
    if(ex==='focus'){rot=-dir*.55;hs=hh*.72}
    var bl=ex==='focus'?Math.max(blink,.35):blink;
    c.save();c.translate(x,y);c.rotate(rot);c.scale(1,bl);
    var r=ww/2;
    /* мягкое свечение */
    c.shadowColor=C.glow;c.shadowBlur=9;
    c.fillStyle=lin(c,0,-hs/2,0,hs/2,[0,'#ffffff',1,'#aee9ff']);
    capsule(c,-r,-hs/2,ww,hs);c.fill();
    c.shadowBlur=0;
    c.restore();
   }
  }
  c.restore();
 }
 function capsule(c,x,y,w,h){var r=w/2;c.beginPath();c.moveTo(x+r,y);c.arc(x+r,y+r,r,-Math.PI/2,Math.PI,true);c.lineTo(x,y+h-r);c.arc(x+r,y+h-r,r,Math.PI,0,true);c.lineTo(x+w,y+r);c.arc(x+r,y+r,r,0,-Math.PI/2,true);c.closePath()}
 function arc(c,x,y,r,a){
  c.beginPath();c.moveTo(x-r,y+3);c.quadraticCurveTo(x,y-r*1.15,x+r,y+3);
  c.lineWidth=3.8;c.strokeStyle=C.eye;c.shadowColor=C.glow;c.shadowBlur=7;c.stroke();c.shadowBlur=0;
 }
/* ---------- вид сбоку (бег, прыжок, ожидание) ---------- */
 var FACE_S='M-2 -98C-22 -90 -24 -48 -4 -32C8 -24 34 -26 44 -40C53 -54 50 -80 34 -92C22 -102 10 -102 -2 -98Z';
 function side(c,P,ex,blink){
  var by=P.lift;
  leg(c,-15,-30-by*.2,P.l0[0],P.l0[1],P.l0[2],0);
  c.save();c.translate(0,-by+5);c.rotate(P.lean);
  var egg=function(){c.beginPath();c.moveTo(-6,-108);c.bezierCurveTo(30,-112,56,-90,54,-56);c.bezierCurveTo(52,-30,30,-14,0,-14);c.bezierCurveTo(-30,-14,-52,-34,-52,-62);c.bezierCurveTo(-52,-90,-34,-106,-6,-108);c.closePath()};
  /* тёмная подложка */
  egg();c.fillStyle=lin(c,-50,-100,40,-20,[0,C.d0,1,C.d2]);c.fill();
  /* задний блок-пластина (жёсткий, торчит назад) */
  c.save();c.translate(-52,-52);c.rotate(P.plate);c.translate(52,52);
  poly(c,[-66,-58,-54,-76,-40,-70,-48,-52],C.w0,C.ln,1.3);
  poly(c,[-66,-58,-48,-52,-44,-30,-62,-38],lin(c,-64,-58,-44,-30,[0,C.w2,1,C.w4]),C.ln,1.3);
  poly(c,[-48,-52,-40,-70,-34,-60,-42,-34,-44,-30],'rgba(120,125,180,.55)');
  c.restore();
  /* оболочка-капюшон: всё тело белое, лицо вырезается */
  c.save();egg();c.clip();
  c.fillStyle=lin(c,-48,-108,40,-16,[0,C.w0,.5,C.w1,1,C.w3]);c.fillRect(-70,-120,140,110);
  poly(c,[-48,-70,-34,-104,-6,-110,-8,-84,-20,-62],'rgba(255,255,255,.85)');
  poly(c,[-20,-62,-8,-84,4,-92,-6,-48,-14,-34],'rgba(190,194,228,.6)');
  poly(c,[-46,-36,-14,-30,10,-20,30,-16,-30,-12],'rgba(118,124,176,.4)');
  poly(c,[10,-20,30,-16,52,-34,40,-30],'rgba(140,146,200,.45)');
  c.lineWidth=1;c.strokeStyle='rgba(70,76,128,.55)';c.beginPath();c.moveTo(-8,-84);c.lineTo(-20,-62);c.lineTo(-14,-34);c.moveTo(4,-92);c.lineTo(-6,-48);c.stroke();
  c.restore();
  egg();c.lineWidth=1.7;c.strokeStyle=C.ln;c.stroke();
  /* лицо: D-образная тёмная область */
  c.save();
  var f=new Path2D(FACE_S);
  var g=c.createRadialGradient(22,-76,2,14,-62,48);g.addColorStop(0,'#2b3258');g.addColorStop(.55,C.d1);g.addColorStop(1,C.d2);
  c.fillStyle=g;c.fill(f);c.lineWidth=2;c.strokeStyle='#05060d';c.stroke(f);
  c.clip(f);c.lineWidth=2.4;c.strokeStyle='rgba(175,210,255,.32)';c.stroke(f);
  c.restore();
  /* светлая кромка по нижнему краю лица */
  c.beginPath();c.moveTo(-4,-30);c.bezierCurveTo(8,-22,34,-24,44,-38);c.lineWidth=1.5;c.strokeStyle='rgba(255,255,255,.75)';c.stroke();
  eyes(c,ex,8,32,-60,9,28,blink,P.lx,P.ly,.9);
  /* спинной плавник: двухъярусная жёсткая пластина, шарнир у основания */
  c.save();c.translate(-22,-92);c.rotate(P.fin);c.translate(22,92);
  poly(c,[-42,-86,-38,-108,-12,-132,4,-106,-6,-92,-20,-98],lin(c,-40,-130,4,-90,[0,C.w0,1,C.w2]),C.ln,1.5);
  poly(c,[-38,-108,-12,-132,-4,-120,-26,-104],'rgba(255,255,255,.95)');
  poly(c,[-12,-132,4,-106,0,-100,-4,-120],'rgba(120,126,182,.55)');
  c.restore();
  c.restore();
  leg(c,16,-28-by*.2,P.l1[0],P.l1[1],P.l1[2],0);
 }
 /* ---------- вид спереди (бой с боссом) ---------- */
 function front(c,P,ex,blink){
  var by=P.lift;
  leg(c,-17,-30-by*.2,-17+P.l0[0],P.l0[1],P.l0[2],1);
  leg(c,17,-30-by*.2,17+P.l1[0],P.l1[1],P.l1[2],1);
  c.save();c.translate(0,-by+5);c.rotate(P.lean*.4);
  /* боковые модули */
  for(var s=-1;s<=1;s+=2){
   c.save();c.scale(s,1);
   poly(c,[50,-68,60,-78,66,-52,56,-42],lin(c,50,-78,66,-42,[0,C.w0,1,C.w3]),C.ln,1.3);
   poly(c,[50,-68,56,-42,52,-40,47,-52],'rgba(120,125,175,.5)');
   c.beginPath();c.moveTo(57,-47);c.quadraticCurveTo(61,-45,63,-51);c.lineWidth=2.4;c.lineCap='round';c.strokeStyle='#8fe0ff';c.shadowColor=C.glow;c.shadowBlur=6;c.stroke();c.shadowBlur=0;
   c.restore();
  }
  c.save();
  c.beginPath();c.ellipse(0,-62,50,46,0,0,7);c.clip();
  c.fillStyle=lin(c,-40,-108,30,-18,[0,C.w0,.5,C.w1,1,C.w3]);c.fillRect(-60,-112,120,100);
  poly(c,[-48,-60,-30,-100,-8,-108,-12,-78,-30,-52],'rgba(255,255,255,.7)');
  poly(c,[-50,-34,0,-18,50,-34,50,-44,0,-30,-50,-44],'rgba(112,118,170,.35)');
  c.restore();
  c.beginPath();c.ellipse(0,-62,50,46,0,0,7);c.lineWidth=1.6;c.strokeStyle=C.ln;c.stroke();
  c.save();c.translate(3,-60);
  c.beginPath();c.ellipse(0,0,38,35,0,0,7);
  var g=c.createRadialGradient(8,-12,2,0,0,40);g.addColorStop(0,'#2a3156');g.addColorStop(.55,C.d1);g.addColorStop(1,C.d2);
  c.fillStyle=g;c.fill();c.lineWidth=2;c.strokeStyle='#05060d';c.stroke();
  c.beginPath();c.ellipse(0,0,35.5,32.5,0,Math.PI*.9,Math.PI*1.5);c.lineWidth=1.4;c.strokeStyle='rgba(170,205,255,.35)';c.stroke();
  c.restore();
  eyes(c,ex,-11,17,-60,10,28,blink,P.lx,P.ly,1);
  c.save();c.translate(-16,-100);c.rotate(P.fin);c.translate(16,100);
  poly(c,[-28,-96,-24,-122,-6,-128,-2,-102,-12,-94],lin(c,-28,-128,-2,-94,[0,C.w0,1,C.w2]),C.ln,1.4);
  poly(c,[-24,-122,-6,-128,-1,-118,-16,-112],'rgba(255,255,255,.9)');
  c.restore();
  c.restore();
 }
 /* ---------- поза ---------- */
 function pose(o,t,dt,fr){
  var P={lift:0,lean:0,fin:0,plate:0,lx:0,ly:0,l0:[0,0,0],l1:[0,0,0]};
  var hx0=fr?-17:-12,hx1=fr?17:14;
  var on=!!o.on&&!o.over;
  /* плавный переход земля ↔ воздух; бег продолжает фазу и не обнуляется */
  st.air+=((o.on?0:1)-st.air)*(1-Math.exp(-dt*22));
  var a=st.air;
  var run=[0,0,0],run1=[0,0,0],lift=0,lean=0,fin=0,plate=0;
  if(o.over){
   var br=Math.sin(t*2.2);
   run=[hx0,0,0];run1=[hx1,0,0];lift=.8+br*.8;fin=br*.015;
   if(o.over==='dead'||st.emo==='sad')lift-=1.2;
  }else{
   var ph=t*2.4%1,ph1=(ph+.5)%1,k=fr?.45:1;
   var f=function(p){
    if(p<.5){var u=p/.5;return[lerp(10,-10,u)*k,0,lerp(.12,-.18,u)*k]}
    var v=(p-.5)/.5;return[lerp(-10,10,.5-.5*Math.cos(Math.PI*v))*k,-Math.sin(Math.PI*v)*(fr?4:7),lerp(-.5,.35,v)*k]};
   var f0=f(ph),f1=f(ph1);
   run=[hx0+f0[0],f0[1],f0[2]];run1=[hx1+f1[0],f1[1],f1[2]];
   var c2=Math.cos(4*Math.PI*ph);
   lift=(fr?1.3:2.4)*(.5+.5*c2);lean=fr?0:.05+.012*Math.sin(4*Math.PI*ph);
   fin=-.03+.05*c2;plate=.025*Math.sin(4*Math.PI*ph+1);
  }
  /* воздух: подъём — ноги подтянуты назад, падение — вперёд и вниз; связь с реальной vy */
  var m=cl(.5+o.vy/700,0,1);
  var ar=[hx0-13,-9,-.7],ar1=[hx1-9,-5,-.5];     /* подъём */
  var af=[hx0+5,-2,.25],af1=[hx1+9,-6,.35];       /* падение */
  if(fr){ar=[hx0-2,-8,-.15];ar1=[hx1+2,-8,.15];af=[hx0-1,-3,0];af1=[hx1+1,-3,0]}
  var air0=[lerp(ar[0],af[0],m),lerp(ar[1],af[1],m),lerp(ar[2],af[2],m)];
  var air1=[lerp(ar1[0],af1[0],m),lerp(ar1[1],af1[1],m),lerp(ar1[2],af1[2],m)];
  var i;
  for(i=0;i<3;i++){P.l0[i]=lerp(run[i],air0[i],a);P.l1[i]=lerp(run1[i],air1[i],a)}
  var airLift=lerp(3,0,m);                                   /* ноги тянут корпус вверх при подъёме */
  P.lift=lerp(lift,fr?3:airLift+1,a);
  P.lean=lerp(lean,fr?0:lerp(-.05,.07,m),a);
  P.fin=lerp(fin,lerp(.16,-.12,m),a);                        /* пластина лагает против движения */
  P.plate=lerp(plate,lerp(.05,-.05,m),a);
  /* приземление: короткое приседание корпуса, без смены физики */
  var la=t-st.land;
  if(la>=0&&la<.13&&!o.over){var kk=Math.sin(Math.PI*la/.13);P.lift-=kk*2.4;P.lean+=kk*.015}
  /* взгляд: вверх при подъёме, вниз при падении */
  P.ly=a>.3?lerp(-3.2,3,m)*a:0;P.lx=a>.3?1.2*a:.6;
  return P;
 }
 function draw(ctx,o){
  var ex=expr(o),t=o.t,fr=!!o.front;
  var dt=cl(t-st.pt,0,.05);st.pt=t;
  if(o.on&&!st.was)st.land=t;st.was=o.on;
  var P=pose(o,t,dt,fr);
  var bp=t%3.7,bl=1;if(bp<.13)bl=1-.9*Math.sin(Math.PI*bp/.13);
  var bq=(t+1.9)%6.1;if(bq<.11)bl=Math.min(bl,1-.9*Math.sin(Math.PI*bq/.11));
  /* тень на опоре: от высоты, без постоянного пятна */
  if(o.ground!=null){
   var gh=Math.max(0,o.ground-o.y),kk=Math.max(0,1-gh/170);
   if(kk>0){ctx.save();ctx.globalAlpha=.3*kk;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(o.x-1,o.ground+1.5,12*(.55+.45*kk),3.2*(.6+.4*kk),0,0,7);ctx.fill();ctx.restore()}
  }
  var u=VH/128;
  ctx.save();
  ctx.globalAlpha=o.alpha==null?1:o.alpha;
  ctx.translate(o.x,o.cy);ctx.rotate(o.flip?Math.PI:0);
  ctx.translate(0,o.half);ctx.scale(u,u);
  ctx.lineJoin='round';
  try{if(fr)front(ctx,P,ex,bl);else side(ctx,P,ex,bl)}catch(e){ctx.restore();return false}
  ctx.restore();
  if(o.col){
   if(o.sh){ctx.save();ctx.strokeStyle=o.col.tx;ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(o.x,o.cy,21,0,7);ctx.stroke();ctx.restore()}
   if(o.mag>0){ctx.save();ctx.strokeStyle=o.col.tx2;ctx.setLineDash([4,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(o.x,o.cy,28+Math.sin(t*8)*2,0,7);ctx.stroke();ctx.restore()}
  }
  if(st.parts.length){
   ctx.save();ctx.lineCap='round';
   for(var i=0;i<st.parts.length;i++){
    var q=st.parts[i],a=t-q.b;if(a<0||a>q.ttl)continue;
    var bx=o.x+(fr?q.x*9:11),by=o.cy-6,f=1-a/q.ttl;
    if(q.flash){var g=ctx.createRadialGradient(bx,by,0,bx,by,8*f+2);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(191,230,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(bx,by,8*f+2,0,7);ctx.fill();continue}
    var dx=Math.cos(q.a)*(fr?q.x:1),dy=Math.sin(q.a),px=bx+dx*q.s*a,py=by+dy*q.s*a;
    ctx.globalAlpha=f;ctx.strokeStyle=q.c;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+dx*q.l,py+dy*q.l);ctx.stroke();
   }
   ctx.restore();
  }
  st.last=(fr?'front':'side')+'_'+ex;
  return true;
 }
 function state(){return{ready:true,err:'',sprite:st.last,parts:st.parts.length,form:form,pain:st.pain}}
 load();
 return{load:load,reset:reset,note:note,draw:draw,state:state,setForm:setForm,forms:FORMS,expr:expr};
})();
