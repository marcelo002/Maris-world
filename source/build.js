// Builds dist/web (installable, offline) and dist/maris-world.html (one self-contained file).
const fs = require('fs'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const tpl = src('index.html');
const fill = (extraHead, extraBody) => tpl
  .replace('/*CSS*/', () => src('style.css'))
  .replace('/*DATA*/', () => src('data.js'))
  .replace('/*ART*/', () => src('art.js'))
  .replace('/*GAME*/', () => src('game.js'))
  .replace('<!--MANIFEST-->', () => extraHead)
  .replace('<!--SW-->', () => extraBody);

const out = path.join(__dirname, 'dist'), web = path.join(out, 'web');
fs.mkdirSync(web, { recursive: true });
const version = 'mw-' + Date.now();

fs.writeFileSync(path.join(out, 'maris-world.html'), fill('', '').replace(', viewport-fit=cover', ''));
fs.writeFileSync(path.join(web, 'index.html'), fill(
  '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-180.png">\n<link rel="icon" href="icon-512.png">',
  `<script>if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function(){});</script>`));
fs.writeFileSync(path.join(web, 'manifest.webmanifest'), JSON.stringify({
  name: "Mari's World", short_name: "Mari's World", start_url: './', display: 'fullscreen', orientation: 'landscape',
  background_color: '#7fd3f0', theme_color: '#7fd3f0',
  icons: [{ src: 'icon-180.png', sizes: '180x180', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 2));
fs.writeFileSync(path.join(web, 'sw.js'), `const C='${version}';const F=['./','index.html','manifest.webmanifest','icon-180.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{if(r&&r.ok&&new URL(e.request.url).origin===location.origin){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));}return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
`);
console.log('built', version);
