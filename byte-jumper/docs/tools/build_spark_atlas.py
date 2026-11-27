"""Сборка атласа Искры из утверждённых PNG (альфа-канал настоящий).
Запуск: python3 docs/tools/build_spark_atlas.py <папка_с_png> <app/src/main/assets/features/game>
Для каждой базовой позы запекаются выражения глаз (боль/радость/грусть/сосредоточенность):
глаза берутся с утверждённых листов эмоций и урона, геометрия позы не меняется."""
import sys,json,numpy as np
from PIL import Image,ImageFilter
from scipy import ndimage as ndi
SRC,OUT=sys.argv[1],sys.argv[2]
L=lambda n:Image.open(f'{SRC}/{n}.png').convert('RGBA')
def crop(im,b):x,y,w,h=b;return im.crop((x,y,x+w,y+h))
RUN=[(5,3,243,251),(439,4,234,252),(868,3,235,256),(1299,1,225,243),(1,409,250,250),(443,411,233,237),(869,419,238,242),(1303,414,236,247)]
EVO=[(0,56,259,278),(402,42,276,293),(817,23,295,312),(1239,1,331,333)]
EMO={'joy':('20350',(518,0,347,322)),'sad':('20350',(8,564,293,274)),'focus':('20350',(529,544,317,294)),'pain':('20349',(592,0,413,392),(195,175,345,262))}
def eyes(im,roi=None):
    a=np.asarray(im).astype(np.float32);rgb=a[:,:,:3];al=a[:,:,3]>60;lum=rgb.mean(2)
    dark=(lum<90)&al;face=ndi.binary_fill_holes(dark)
    core=((rgb[:,:,1]-rgb[:,:,0])>18)&(rgb[:,:,2]>170)&(lum>110)&face&~dark
    if roi:
        x0,y0,x1,y1=roi;r=np.zeros_like(core);r[y0:y1,x0:x1]=True
        core=(lum>120)&(rgb[:,:,2]>150)&~dark&r&((rgb[:,:,1]-rgb[:,:,0])>12)
    lab,n=ndi.label(ndi.binary_dilation(core,iterations=3));h=im.height;res=[]
    for i in range(1,n+1):
        m=(lab==i)&core;ar=m.sum()
        if ar<h*h*0.0004:continue
        ys,xs=np.nonzero(m);res.append((ar,xs.mean(),ys.mean(),lab==i))
    res=sorted(res,key=lambda r:-r[0])[:2]
    if len(res)<2:return None
    res.sort(key=lambda r:r[1]);(a1,x1,y1,m1),(a2,x2,y2,m2)=res
    mask=ndi.binary_dilation(m1|m2,iterations=4)&(al if roi else face)
    return dict(mask=mask,face=face,mid=((x1+x2)/2,(y1+y2)/2),d=float(np.hypot(x2-x1,y2-y1)),ang=float(np.degrees(np.arctan2(y2-y1,x2-x1))),lum=lum,rgb=rgb,dark=dark)
def patch(srcim,roi=None):
    e=eyes(srcim,roi);assert e,'нет глаз в источнике'
    m=e['mask'].astype(np.float32)
    al=np.clip((e['lum']-55)/100,0,1)*m
    p=np.dstack([e['rgb'],al*255]).astype(np.uint8)
    ys,xs=np.nonzero(m>0);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    return Image.fromarray(p).crop((x0,y0,x1,y1)),(e['mid'][0]-x0,e['mid'][1]-y0),e['d'],e['ang']
def apply(base,pt):
    e=eyes(base)
    if not e:return None
    P,(ax,ay),ds,angs=pt;d=e['d'];s=d/ds
    fe=ndi.binary_erosion(e['face'],iterations=2)
    # цвет лица: медиана тёмных пикселей возле глаз
    mx,my=e['mid'];r=int(d*1.2);y0,y1,x0,x1=max(0,int(my-r)),int(my+r),max(0,int(mx-r)),int(mx+r)
    sel=(e['dark']&~ndi.binary_dilation(e['mask'],iterations=6))[y0:y1,x0:x1]
    col=np.median(e['rgb'][y0:y1,x0:x1][sel],axis=0) if sel.sum()>20 else np.array([20,22,40])
    cov=ndi.binary_dilation(e['mask'],iterations=max(3,int(d*.12)))&fe
    cm=Image.fromarray((cov*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(1,d*.04)))
    out=base.copy();out.paste(Image.new('RGBA',base.size,tuple(int(c) for c in col)+(255,)),(0,0),cm)
    Q=P.resize((max(1,round(P.width*s)),max(1,round(P.height*s))),Image.LANCZOS).rotate(-(e['ang']-angs),expand=True,resample=Image.BICUBIC)
    # центр после поворота
    qx,qy=Q.width/2,Q.height/2
    fm=Image.fromarray((fe*255).astype(np.uint8))
    layer=Image.new('RGBA',base.size,(0,0,0,0));layer.paste(Q,(int(round(mx-qx)),int(round(my-qy))),Q)
    la=np.asarray(layer).copy();la[:,:,3]=(la[:,:,3]*(np.asarray(fm)>0)).astype(np.uint8)
    out.alpha_composite(Image.fromarray(la));return out
bases={}
bases['idle']=(crop(L('20354'),(0,0,789,855)),855)
sh=L('20352');rh=float(np.median([b[3] for b in RUN]))
for i,b in enumerate(RUN):bases[f'r{i}']=(crop(sh,b),rh)
bases['front']=(crop(L('20348'),(0,0,651,654)),654)
pts={k:patch(crop(L(v[0]),v[1]),v[2] if len(v)>2 else None) for k,v in EMO.items()}
ev=L('20351');eh=float(np.median([b[3] for b in EVO]))
sprites={}   # name -> (PIL, ref_h)
for k,(im,rf) in bases.items():
    sprites[k+'_n']=(im,rf)
    for ex,pt in pts.items():
        r=apply(im,pt)
        if r is None:print('!! нет глаз',k);r=im
        sprites[f'{k}_{ex}']=(r,rf)
for i,b in enumerate(EVO):sprites[f'evo{i}_n']=(crop(ev,b),eh)
H=128;meta={};rows=[];X=Y=RH=0;W=1024;PAD=2;items=[]
for n,(im,rf) in sprites.items():
    s=H/rf;im2=im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
    a=np.asarray(im2)[:,:,3]>40;ys,xs=np.nonzero(a);px=float((xs*1.0).mean())
    items.append((n,im2,px,float(ys.max()+1)))
items.sort(key=lambda t:-t[1].height)
pos=[];x=y=rh=0
for n,im2,px,py in items:
    if x+im2.width+PAD>W:x=0;y+=rh+PAD;rh=0
    pos.append((n,im2,x,y,px,py));x+=im2.width+PAD;rh=max(rh,im2.height)
AH=y+rh+PAD;atlas=Image.new('RGBA',(W,AH),(0,0,0,0))
for n,im2,x,y,px,py in pos:
    atlas.paste(im2,(x,y));meta[n]=[x,y,im2.width,im2.height,round(px,1),round(py,1)]
atlas.save(f'{OUT}/spark.png',optimize=True)
js='/* Атлас Искры (сгенерирован docs/tools/build_spark_atlas.py). Формат: имя:[x,y,w,h,опора_x,опора_y(низ ног)] */\nwindow.SparkAtlas='+json.dumps({'file':'spark.png','w':W,'h':AH,'unit':36/H,'s':meta},ensure_ascii=False,separators=(',',':'))+';\n'
open(f'{OUT}/spark-atlas.js','w',encoding='utf8').write(js)
print('atlas',W,AH,len(meta),'sprites')
