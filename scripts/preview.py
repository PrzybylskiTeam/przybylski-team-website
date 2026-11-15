"""Package the review site as one local HTML file; never deploys."""
from pathlib import Path
import sys,json,base64,re,mimetypes
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]).resolve()
pages={}
for p in root.glob('*.html'):
 s=p.read_text(encoding='utf8')
 s=re.sub(r'<link rel="stylesheet" href="assets/css/styles.css">','',s)
 s=s.replace('<script type="module" src="assets/js/app.js"></script>','')
 def asset(m):
  f=root/m[1];mime=mimetypes.guess_type(f.name)[0] or 'application/octet-stream'
  return 'src="data:'+mime+';base64,'+base64.b64encode(f.read_bytes()).decode()+'"'
 s=re.sub(r'src="(assets/images/[^"]+)"',asset,s)
 pages[p.name]=s
css=(root/'assets/css/styles.css').read_text(encoding='utf8')
js=(root/'assets/js/app.js').read_text(encoding='utf8')
js=js.replace('window.location.search',"globalThis.__PREVIEW_SEARCH || ''")
js=js.replace("async function json(path) { const response=await fetch(path,{cache:'no-cache'}); if(!response.ok)throw new Error('Content unavailable'); return response.json(); }","async function json(path) { if(!Object.hasOwn(globalThis.__PREVIEW_DATA,path))throw new Error('Content unavailable'); return structuredClone(globalThis.__PREVIEW_DATA[path]); }")
records={str(p.relative_to(root)).replace('\\','/'):json.loads(p.read_text(encoding='utf8')) for p in (root/'data').glob('*.json')}
def safe(obj):return json.dumps(obj,ensure_ascii=True).replace('<','\\u003c')
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Przybylski Team | Design review</title><style>html,body{margin:0;background:#0b203c;height:100%}iframe{border:0;width:100%;height:100dvh;display:block}</style><iframe title="Przybylski Team website preview"></iframe><noscript>Enable JavaScript to explore this preview.</noscript><script>'''
html+='const pages='+safe(pages)+';const styles='+safe(css)+';const behavior='+safe(js)+';const records='+safe(records)+';'
html+='''
const frame=document.querySelector('iframe');
function render(){const route=new URL(location.hash.slice(1)||'index.html','https://preview.local/');const name=route.pathname.split('/').pop();if(!Object.hasOwn(pages,name))return;let html=pages[name];document.title=(html.match(/<title>(.*?)<\\/title>/i)?.[1]||'Przybylski Team')+' | Design review';const nav=`document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(!a||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const href=a.getAttribute('href');if(!href||/^(https?:|mailto:|tel:|sms:|#)/i.test(href))return;event.preventDefault();parent.postMessage({type:'team-preview:navigate',href},'*');});`;const script='globalThis.__PREVIEW_SEARCH='+JSON.stringify(route.search)+';globalThis.__PREVIEW_DATA='+JSON.stringify(records)+';'+behavior+';'+nav;html=html.replace('</head>','<style>'+styles+'</style></head>').replace('</body>','<script type="module">'+script.replace(/<\\/script/gi,'<\\\\/script')+'<\\/script></body>');frame.srcdoc=html;}
window.addEventListener('hashchange',render);window.addEventListener('message',event=>{if(event.source!==frame.contentWindow||event.data?.type!=='team-preview:navigate')return;const route=new URL(event.data.href,'https://preview.local/');if(Object.hasOwn(pages,route.pathname.split('/').pop()))location.hash=route.pathname.slice(1)+route.search;});render();
</script></html>'''
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html,encoding='utf8');print(out)
