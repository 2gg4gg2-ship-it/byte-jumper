"""Возвращает цвет Искре: заменяет пиксели кадров в docs/tools/spark_base.png цветными из исходных листов автора.
Для каждого кадра берётся компонент листа с лучшим совпадением силуэта (IoU). Запуск из корня проекта:
python3 -I docs/tools/colorize_spark_base.py <папка_с_листами_png>   (нужны Pillow, numpy, scipy)
После этого: python3 -I docs/tools/make_spark_atlas.py"""
import sys,re,json,glob,os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
SRC=sys.argv[1];D='app/src/main/assets/features/game/'
src=open(D+'spark.js',encoding='utf-8').read();ATL=json.loads(re.search(r'const ATL=(\{.*?\});\n',src,re.S).group(1))
base=Image.open('docs/tools/spark_base.png').convert('RGBA');B=np.array(base)
cands=[]
for f in sorted(glob.glob(SRC+'/*.png')):
    im=Image.open(f).convert('RGBA');a=np.array(im)[...,3]>40
    lab,k=ndi.label(ndi.binary_dilation(a,iterations=6))
    for i,sl in enumerate(ndi.find_objects(lab),1):
        h=sl[0].stop-sl[0].start;w=sl[1].stop-sl[1].start
        if h<120 or w<120:continue
        cands.append((os.path.basename(f),im.crop((sl[1].start,sl[0].start,sl[1].stop,sl[0].stop))))
print(len(cands),'кандидатов')
GRP={'idle':'e37e4533','front':'4a2cbba0','r':'63a116b5','e':'fe944db4','m':'b891be3a','d':'456e16f6'}
def grp(n):return GRP[n] if n in GRP else GRP[n[0]]
from scipy.optimize import linear_sum_assignment
out=base.copy();rep=0
names=[n for n in ATL['f'] if '_' not in n]
for g in sorted(set(grp(n) for n in names)):
    ns=[n for n in names if grp(n)==g];cs=[c for nm,c in cands if nm.startswith(g)]
    M=np.zeros((len(ns),len(cs)));R={}
    for i,n in enumerate(ns):
        x,y,w,h=ATL['f'][n][:4];ba=B[y:y+h,x:x+w,3]>40
        for j,c in enumerate(cs):
            r=c.resize((w,h),Image.LANCZOS);ra=np.array(r)[...,3]>40
            M[i,j]=(ra&ba).sum()/max(1,(ra|ba).sum());R[i,j]=r
    ri,ci=linear_sum_assignment(-M)
    for i,j in zip(ri,ci):
        n=ns[i];x,y,w,h=ATL['f'][n][:4];print(n,round(M[i,j],3))
        if M[i,j]>.7:
            arr=np.array(out);arr[y:y+h,x:x+w]=np.array(R[i,j]);out=Image.fromarray(arr);rep+=1
out.save('docs/tools/spark_base.png');print('заменено',rep)
