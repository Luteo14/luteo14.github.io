import pandas as pd, numpy as np, re, json, os, zipfile, textwrap
from pathlib import Path
src=Path('activities.csv'); root=Path('.'); data_dir=root/'data'; js=root/'js'; css=root/'css'
for p in [data_dir,js,css]: p.mkdir(parents=True,exist_ok=True)
df=pd.read_csv(src,low_memory=False)
# Parse French dates
months={'janv.':'Jan','févr.':'Feb','mars':'Mar','avr.':'Apr','mai':'May','juin':'Jun','juil.':'Jul','août':'Aug','sept.':'Sep','oct.':'Oct','nov.':'Nov','déc.':'Dec'}
def dt(x):
 s=str(x)
 for a,b in months.items(): s=s.replace(a,b)
 return pd.to_datetime(s,errors='coerce',dayfirst=True)
def num(s): return pd.to_numeric(s.astype(str).str.replace(',','.',regex=False),errors='coerce')
dates=df["Date de l'activité"].map(dt)
dist=num(df['Distance'])
dur=num(df['Durée de déplacement']).fillna(num(df['Temps écoulé']))
elev=num(df['Dénivelé positif']).fillna(0)
hr=num(df['Fréquence cardiaque moyenne'])
raw=df["Type d'activité"].astype(str)
activity_id=pd.to_numeric(df["ID de l'activité"],errors="coerce")
def cat(s):
 l=s.lower()
 if 'course' in l or 'run' in l or 'trail' in l: return 'Course à pied'
 if 'vélo' in l or 'velo' in l or 'ride' in l or 'cycl' in l: return 'Vélo'
 if 'natation' in l or 'swim' in l: return 'Natation'
 if 'marche' in l or 'randonnée' in l or 'randonnee' in l or 'walk' in l or 'hike' in l: return 'Marche / randonnée'
 return 'Autres'
sport=raw.map(cat)
# distance column is km for primary Strava export; check Distance.1 confirms meters.
activities=[]
for i in range(len(df)):
 if pd.isna(dates.iloc[i]): continue
 d=float(dist.iloc[i]) if pd.notna(dist.iloc[i]) else 0
 sec=float(dur.iloc[i]) if pd.notna(dur.iloc[i]) else 0
 aid=int(activity_id.iloc[i]) if pd.notna(activity_id.iloc[i]) else None
 activities.append({'id':aid,'strava_url':f'https://www.strava.com/activities/{aid}' if aid else None,'date':dates.iloc[i].strftime('%Y-%m-%d'),'sport':sport.iloc[i],'distance_km':round(d,3),'duration_s':round(sec),'elevation_m':round(float(elev.iloc[i]) if pd.notna(elev.iloc[i]) else 0),'avg_hr':round(float(hr.iloc[i])) if pd.notna(hr.iloc[i]) else None})
(data_dir/'activities.json').write_text(json.dumps(activities,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
# public CSV
pd.DataFrame(activities).to_csv(data_dir/'activities-public.csv',index=False)
# stats snapshot
adf=pd.DataFrame(activities); adf['date']=pd.to_datetime(adf.date); adf['year']=adf.date.dt.year
run=adf[adf.sport=='Course à pied']
summary=run.groupby('year').agg(seances=('date','count'),km=('distance_km','sum'),heures=('duration_s',lambda x:x.sum()/3600),dplus=('elevation_m','sum')).round(1).reset_index()
print(summary.to_string(index=False))

print('Données publiques mises à jour.')
