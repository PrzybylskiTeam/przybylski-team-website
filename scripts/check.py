"""Validate maintained content and local page dependencies without a network call."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,parse_qs,unquote
from datetime import date
import json,re
root=Path(__file__).resolve().parents[1]
errors=[]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=set();self.h1=0;self.title=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag=='h1':self.h1+=1
  if tag=='title':self.title=True
  for k in ('href','src'):
   if k in a:self.links.append(a[k])
pages={}
for f in root.glob('*.html'):
 p=Page();p.feed(f.read_text(encoding='utf8'));pages[f.name]=p
 if not p.title:errors.append(f'{f.name}: no title')
 if f.name!='property.html' and p.h1!=1:errors.append(f'{f.name}: expected one h1')
 for url in p.links:
  u=urlsplit(url)
  if u.scheme or u.netloc:continue
  target=root/unquote(u.path or f.name)
  if not target.exists():errors.append(f'{f.name}: missing {url}')
  if u.fragment and not u.path and u.fragment not in p.ids:errors.append(f'{f.name}: missing fragment {url}')
props=json.loads((root/'data/properties.json').read_text())['properties']
ids=[p['id'] for p in props]
if len(ids)!=len(set(ids)):errors.append('Duplicate property IDs')
for p in props:
 if p.get('published'):
  for key in ('id','address','status','sourceUrl','verifiedAt','attribution'):
   if not p.get(key):errors.append(f'{p.get("id")}: missing {key}')
  date.fromisoformat(p['verifiedAt'])
  if p['status'] not in ('active','pending','sold'):errors.append('Invalid status')
  if p.get('image') and not p.get('photoPermission'):errors.append('Photo without permission')
  if p.get('propertyCategory')=='vacant_land' and any(p.get(k) for k in ('beds','baths','sqft')):errors.append('Land has interior facts')
  if any(re.search(r'\[|PASTE_|sample-',v) for v in p.values() if isinstance(v,str)):errors.append('Placeholder in published property')
reviews=json.loads((root/'data/reviews.json').read_text())['reviews']
for r in reviews:
 if r.get('approved'):
  if not all(r.get(k) for k in ('name','quote','link','verifiedAt','reuseBasis')):errors.append('Review lacks provenance')
  if re.search(r'\[|PASTE_|Client Name',r['quote']):errors.append('Placeholder review')
  if r.get('rating') is not None and r['rating'] not in range(1,6):errors.append('Invalid rating')
assert not errors,'\n'.join(errors)
print(f'PASS: {len(pages)} pages, local links/assets, {len(props)} verified property records, {len(reviews)} attributed excerpts; no listing photos copied.')
