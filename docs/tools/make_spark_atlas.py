"""Достраивает атлас Искры: кадры с другим выражением глаз на ТОЙ ЖЕ фигуре (моргание, радость, решимость, «> <», грусть).
Зачем: утверждённые эмоции нарисованы в ракурсе 3/4 и в бою дали бы скачок вида и позы. Здесь тело не меняется, меняются только глаза.
Вход: docs/tools/spark_base.png (23 утверждённых кадра, ч/б) и ATL из spark.js. Выход: spark/spark.png и новая строка ATL в spark.js.
Запуск из корня проекта: python3 -I docs/tools/make_spark_atlas.py  (нужны Pillow, numpy, scipy)"""
import json,re,os
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
from scipy import ndimage as ndi
D='app/src/main/assets/features/game/';SJ=D+'spark.js'
src=open(SJ,encoding='utf-8').read();m=re.search(r'const ATL=(\{.*?\});\n',src,re.S);ATL=json.loads(m.group(1))
base=Image.open('docs/tools/spark_base.png').convert('RGBA');A=np.array(base)
BASE={k:v for k,v in ATL['f'].items() if '_' not in k}
def eyes_of(fr):
    lum=fr[...,:3].astype(float).mean(2);al=fr[...,3];lab,k=ndi.label((lum>170)&(al>200));out=[]
    for i in range(1,k+1):
        ys,xs=np.where(lab==i);bw=xs.max()-xs.min()+1;bh=ys.max()-ys.min()+1
        if 50<=len(ys)<=320 and bw<=13 and bh>=14 and xs.min()>25:out.append((xs.min(),xs.max(),ys.min(),ys.max()))
    return sorted(out) if len(out)==2 else None
def erase(fr,eyes):
    lum=fr[...,:3].astype(float).mean(2);al=fr[...,3];mask=np.zeros(lum.shape,bool)
    for a,b,c,d in eyes:mask[c:d+1,a:b+1]=True
    big=ndi.binary_dilation(mask,iterations=6);ring=ndi.binary_dilation(big,iterations=5)&~big&(lum<90)&(al>200)
    col=np.median(fr[...,:3][ring],axis=0) if ring.sum()>20 else np.array([22,22,24])
    out=fr.copy();out[big,:3]=col.astype(np.uint8);return out
def shapes(kind,eyes):
    """список (тип, точки, толщина) для двух глаз"""
    res=[]
    for i,(a,b,c,d) in enumerate(eyes):
        cx,cy,bw,bh=(a+b)/2,(c+d)/2,b-a+1,d-c+1;s=1 if i==0 else -1  # s: левый глаз +1
        w=max(2.5,bw*.45)
        if kind=='b':res.append(('l',[(a,cy),(b,cy)],4))
        elif kind=='h':res.append(('arc',(cx,cy+bh*.1,bw*.8,bh*.34),w*.8))
        elif kind=='a':res.append(('l',[(cx-s*bw*.75,cy-bh*.22),(cx+s*bw*.75,cy+bh*.1)],w))
        elif kind=='x':res.append(('l',[(cx-s*bw*.7,cy-bh*.22),(cx+s*bw*.7,cy),(cx-s*bw*.7,cy+bh*.22)],w*.9))
        elif kind=='s':res.append(('l',[(cx-s*bw*.75,cy+bh*.1),(cx+s*bw*.75,cy-bh*.06)],w))
    return res
def paint(fr,kind):
    eyes=eyes_of(fr)
    if not eyes:return None
    im=Image.fromarray(erase(fr,eyes),'RGBA');lay=Image.new('RGBA',im.size,(0,0,0,0));dr=ImageDraw.Draw(lay)
    for t,p,w in shapes(kind,eyes):
        if t=='l':
            dr.line(p,fill=(240,240,242,255),width=int(round(w)),joint='curve')
            for q in(p[0],p[-1]):r=w/2;dr.ellipse((q[0]-r,q[1]-r,q[0]+r,q[1]+r),fill=(240,240,242,255))
        else:
            cx,cy,rw,rh=p;dr.arc((cx-rw,cy-rh,cx+rw,cy+rh),200,340,fill=(240,240,242,255),width=int(round(w)))
    g=np.array(lay.filter(ImageFilter.GaussianBlur(3))).astype(float);g[...,3]*=.55
    o=Image.alpha_composite(im,Image.fromarray(g.astype(np.uint8),'RGBA'));o=Image.alpha_composite(o,lay)
    oa=np.array(o);oa[...,3]=np.where(fr[...,3]>0,np.maximum(oa[...,3],fr[...,3]),oa[...,3]);return Image.fromarray(oa,'RGBA')
jobs=[('idle','b')]+[('front',k) for k in 'bhaxs']+[('r%d'%i,'x') for i in range(8)]
cells=[];F=dict(BASE)
for n,k in jobs:
    x,y,w,h,ax=BASE[n];img=paint(A[y:y+h,x:x+w].copy(),k)
    if img is None:print('пропуск',n,k);continue
    cells.append((n+'_'+k,img,w,h,ax))
H0=base.size[1];rows=[];cx=0;ry=H0+4;rh=0
for name,img,w,h,ax in cells:
    if cx+w>base.size[0]:cx=0;ry+=rh+4;rh=0
    rows.append((name,img,cx,ry,w,h,ax));cx+=w+4;rh=max(rh,h)
out=Image.new('RGBA',(base.size[0],ry+rh+4),(0,0,0,0));out.paste(base,(0,0))
for name,img,x,y,w,h,ax in rows:out.paste(img,(x,y));F[name]=[x,y,w,h,ax]
# опорные точки бега: для кадров r0..r7 (и r*_x) запоминаем центр глаз [..., ey, ex]. Игра ставит голову на постоянную высоту и в постоянную точку,
# иначе голова «дрожит» (по замеру разброс до ±5 px на кадре 128 px, потому что утверждённые кадры нарисованы без общей линии земли)
for i in range(8):
    x,y,w,h,ax=BASE['r%d'%i];e=eyes_of(A[y:y+h,x:x+w].copy());ey=round(sum((c+d)/2 for a,b,c,d in e)/2,1);ex=round(sum((a+b)/2 for a,b,c,d in e)/2,1)
    for n in('r%d'%i,'r%d_x'%i):
        if n in F:F[n]=F[n][:5]+[ey,ex]
out.save(D+'spark/spark.png',optimize=True);ATL['f']=F
open(SJ,'w',encoding='utf-8').write(src[:m.start(1)]+json.dumps(ATL,ensure_ascii=False)+src[m.end(1):])
print(out.size,len(F),'кадров')
