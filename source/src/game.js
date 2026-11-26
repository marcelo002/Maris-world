/* Mari's World: game logic. */
(function () {
  'use strict';
  const D = window.MW_DATA, A = window.MW_ART;
  const { COLORS, GUIDES, GENERIC, SHARED, LOCATIONS } = D;
  const stage = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const INK = '#2d2a32';

  /* ---------- helpers ---------- */
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rnd = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rnd(arr.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickN = (arr, n, exclude = []) => shuffle(arr.filter(x => !exclude.includes(x))).slice(0, n);

  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem('mw_' + k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('mw_' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const settings = Object.assign({ lang: 'both', limit: 0, rate: 0.9 }, store.get('settings', {}));
  const progress = Object.assign({ stickers: {}, level: {}, visits: {} }, store.get('progress', {}));
  const saveSettings = () => store.set('settings', settings);
  const saveProgress = () => store.set('progress', progress);

  /* ---------- sound effects (synthesised, no files) ---------- */
  let actx = null;
  function audioInit() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { actx = null; }
  }
  function tone(f1, f2, dur, type = 'sine', vol = 0.2, delay = 0) {
    if (!actx) return;
    const t = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const SFX = {
    pop() { tone(380, 900, 0.12, 'sine', 0.28); },
    boing() { tone(180, 520, 0.22, 'triangle', 0.22); tone(520, 260, 0.2, 'triangle', 0.14, 0.2); },
    sparkle() { [1200, 1500, 1800, 2300].forEach((f, i) => tone(f, f * 1.05, 0.14, 'sine', 0.08, i * 0.06)); },
    yay() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.2, i * 0.09)); },
    soft() { tone(330, 290, 0.25, 'sine', 0.14); },
    tick(n) { tone(440 + n * 90, 460 + n * 90, 0.14, 'triangle', 0.24); },
    whoosh() { tone(200, 1200, 0.35, 'sawtooth', 0.04); },
  };
  const funSfx = () => pick([SFX.boing, SFX.sparkle, SFX.pop])();

  /* ---------- speech (English, Portuguese or both) ---------- */
  const Speech = (() => {
    const syn = window.speechSynthesis;
    let voices = [], token = 0;
    const load = () => { if (syn) voices = syn.getVoices() || []; };
    if (syn) { load(); if (syn.addEventListener) syn.addEventListener('voiceschanged', load); else syn.onvoiceschanged = load; }
    const norm = l => (l || '').replace('_', '-').toLowerCase();
    function voiceFor(lang) {
      if (!voices.length) load();
      const want = lang === 'en' ? 'en-us' : 'pt-br';
      const all = voices.filter(v => norm(v.lang).startsWith(lang));
      const exact = all.filter(v => norm(v.lang) === want);
      const pool = exact.length ? exact : all;
      return pool.find(v => /enhanced|premium|natural|samantha|luciana|felipe|google/i.test(v.name)) || pool.find(v => v.localService) || pool[0] || null;
    }
    const langs = () => (settings.lang === 'both' ? ['en', 'pt'] : [settings.lang]);
    function speakOne(text, lang, tok) {
      return new Promise(res => {
        if (!syn || tok !== token) return res();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang === 'en' ? 'en-US' : 'pt-BR';
        const v = voiceFor(lang); if (v) u.voice = v;
        u.rate = settings.rate; u.pitch = 1.1;
        let done = false;
        const fin = () => { if (done) return; done = true; clearTimeout(to); res(); };
        const to = setTimeout(fin, 1800 + (text.length * 95) / settings.rate);
        u.onend = fin; u.onerror = fin;
        syn.speak(u);
      });
    }
    function setTalking(who) {
      stage.querySelectorAll('.talking').forEach(el => el.classList.remove('talking'));
      if (who) { const g = stage.querySelector(`[data-guide="${who}"]`); if (g) g.classList.add('talking'); }
    }
    /* lines: one line or an array of {en, pt, who}. Resolves true when finished, false when interrupted. */
    async function say(lines, defaultWho) {
      if (!Array.isArray(lines)) lines = [lines];
      const tok = ++token;
      if (syn) syn.cancel();
      await wait(70);
      for (const L of lines) {
        if (tok !== token) return false;
        setTalking(L.who || defaultWho);
        for (const lg of langs()) {
          if (tok !== token) return false;
          if (L[lg]) await speakOne(L[lg], lg, tok);
        }
      }
      if (tok !== token) return false;
      setTalking(null);
      return true;
    }
    function stop() { token++; if (syn) syn.cancel(); setTalking(null); }
    function unlock() { if (!syn) return; try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; syn.speak(u); } catch (e) { /* ignore */ } }
    return { say, stop, unlock, voiceFor };
  })();

  /* ---------- svg helpers ---------- */
  const hit = (r = 115) => `<circle r="${r}" fill="#fff" fill-opacity="0.001"/>`;
  const place = (x, y, s, inner, attrs = '') => `<g transform="translate(${x} ${y}) scale(${s})"><g class="it" ${attrs}>${inner}</g></g>`;
  function svgPoint(e) {
    const pt = stage.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = stage.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : { x: 700, y: 500 };
  }
  function restart(el, cls) {
    if (!el) return;
    el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 900);
  }
  function fxLayer() { return stage.querySelector('#fx'); }
  function burst(x, y, count = 26, big = true) {
    const fx = fxLayer(); if (!fx) return;
    const cols = ['#E8453C', '#F7C928', '#3A7BE0', '#4CB944', '#9B5DE5', '#F78FB3', '#F58A2A'];
    for (let i = 0; i < count; i++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', big && i % 3 ? 'rect' : 'circle');
      const c = pick(cols);
      if (el.tagName === 'rect') { el.setAttribute('x', x - 8); el.setAttribute('y', y - 5); el.setAttribute('width', 16); el.setAttribute('height', 10); el.setAttribute('rx', 3); }
      else { el.setAttribute('cx', x); el.setAttribute('cy', y); el.setAttribute('r', big ? 8 : 6); }
      el.setAttribute('fill', c);
      fx.appendChild(el);
      const a = Math.random() * Math.PI * 2, d = (big ? 160 : 60) + Math.random() * (big ? 220 : 60);
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d + (big ? 120 : 0);
      if (el.animate) {
        const an = el.animate([{ transform: 'translate(0px,0px) rotate(0deg)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${rnd(720)}deg)`, opacity: 0 }], { duration: big ? 1300 + rnd(500) : 600, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'forwards' });
        an.onfinish = () => el.remove();
      } else setTimeout(() => el.remove(), 800);
    }
  }

  /* ---------- characters ---------- */
  function guideSvg(id, x, y, s, extra = '') {
    return `<g transform="translate(${x} ${y}) scale(${s})"><g class="it guide bob" data-guide="${id}" data-tap="guide:${id}" ${extra}>${hit(150).replace('r="150"', 'r="150" cy="-200"')}${A.person(GUIDES[id].look)}</g></g>`;
  }

  /* ---------- scene chrome ---------- */
  const homeBtn = () => place(90, 90, 1.1, hit(70) + A.home(), 'data-tap="home"');
  const sky = (top = '#8fd8f5', bottom = '#d4f1ff') => `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="1400" height="1000" fill="url(#sky)"/>`;
  const fun = (x, y, s, inner) => place(x, y, s, hit(90) + inner, 'data-tap="fun"');

  const BACKGROUNDS = {
    house: () => `<rect width="1400" height="1000" fill="#dff1ff"/>
      <rect y="0" width="1400" height="700" fill="#cfe8fb"/><path d="M0 120 L1400 120" stroke="#b9dcf5" stroke-width="16"/>
      <rect x="560" y="150" width="280" height="200" rx="14" fill="#9fdcff" stroke="${INK}" stroke-width="6"/><path d="M700 150 L700 350 M560 250 L840 250" stroke="${INK}" stroke-width="6"/>
      <rect y="700" width="1400" height="300" fill="#e6b980"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${i * 220} 700 L${i * 220 - 60} 1000" stroke="#c9975c" stroke-width="5"/>`).join('')}
      <ellipse cx="900" cy="850" rx="420" ry="90" fill="#f5a3c0" opacity=".7"/>
      ${fun(1230, 260, 0.8, `<rect x="-90" y="-110" width="180" height="220" rx="14" fill="#fff6dc" stroke="${INK}" stroke-width="6"/><circle cx="0" cy="0" r="60" fill="#F7C928" stroke="${INK}" stroke-width="5"/><path d="M0 0 L0 -40 M0 0 L28 10" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`)}
      ${fun(1250, 800, 0.8, A.flower('#E8453C'))}`,
    farm: () => `${sky()}${fun(1250, 120, 0.9, A.sun())}${fun(520, 120, 0.8, A.cloud())}${fun(900, 90, 0.6, A.cloud())}
      <path d="M0 520 Q300 420 700 500 Q1100 420 1400 500 L1400 1000 L0 1000Z" fill="#8bd45e"/>
      <path d="M0 600 Q400 540 800 610 Q1100 560 1400 600 L1400 1000 L0 1000Z" fill="#6cc24a"/>
      <g transform="translate(1210 400) scale(1.1)">${A.bBarn()}</g>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<rect x="${380 + i * 70}" y="440" width="18" height="90" rx="4" fill="#fff" stroke="${INK}" stroke-width="4"/>`).join('')}
      <rect x="370" y="460" width="660" height="14" fill="#fff" stroke="${INK}" stroke-width="4"/>`,
    market: () => `<rect width="1400" height="1000" fill="#fff3d1"/>
      ${[0, 1].map(r => `<rect x="420" y="${90 + r * 150}" width="960" height="20" fill="#c9975c" stroke="${INK}" stroke-width="5"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `<rect x="${440 + i * 78}" y="${30 + r * 150}" width="60" height="62" rx="6" fill="${['#E8453C', '#3A7BE0', '#F7C928', '#4CB944', '#9B5DE5', '#F58A2A'][(i + r * 2) % 6]}" stroke="${INK}" stroke-width="4"/>`).join('')).join('')}
      <rect y="760" width="1400" height="240" fill="#f0d6a8"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${i * 200}" y="${760 + (i % 2) * 120}" width="100" height="120" fill="#e8c88f"/>`).join('')}
      ${fun(1290, 880, 0.8, `<rect x="-80" y="-60" width="160" height="110" rx="12" fill="#3A9AD9" stroke="${INK}" stroke-width="6"/><rect x="-60" y="-44" width="120" height="40" rx="6" fill="#bff5c8" stroke="${INK}" stroke-width="4"/><text x="0" y="-15" text-anchor="middle" font-size="30" font-weight="900" fill="${INK}" font-family="sans-serif">123</text>`)}`,
    library: () => `<rect width="1400" height="1000" fill="#efe4ff"/>
      ${[0, 1, 2].map(r => `<rect x="380" y="${40 + r * 120}" width="1000" height="16" fill="#8a5a2b"/>` + Array.from({ length: 22 }, (_, i) => `<rect x="${392 + i * 44}" y="${-40 + r * 120 + (i % 3) * 8}" width="34" height="${80 - (i % 3) * 8}" rx="4" fill="${['#E8453C', '#3A7BE0', '#F7C928', '#4CB944', '#9B5DE5', '#F58A2A', '#F78FB3'][(i + r) % 7]}" stroke="${INK}" stroke-width="3"/>`).join('')).join('')}
      <rect y="780" width="1400" height="220" fill="#c7a7f0"/><ellipse cx="900" cy="880" rx="430" ry="80" fill="#F7C928" opacity=".55"/>
      ${fun(1335, 800, 0.6, A.tree())}`,
    park: () => `${sky('#7fd0f5', '#dcf4ff')}${fun(160, 300, 0.7, A.sun())}${fun(700, 110, 0.7, A.cloud())}${fun(1120, 160, 0.9, A.cloud())}
      <path d="M0 640 Q400 580 700 640 Q1000 590 1400 640 L1400 1000 L0 1000Z" fill="#7fcf5a"/>
      ${fun(1340, 520, 0.75, A.tree())}
      <ellipse cx="880" cy="880" rx="200" ry="40" fill="#5fb9e8" stroke="${INK}" stroke-width="5"/>`,
    garden: () => `${sky('#a8e4ff', '#f0fbff')}${fun(1250, 120, 0.8, A.sun())}${fun(600, 100, 0.6, A.cloud())}
      <path d="M0 560 L1400 560 L1400 1000 L0 1000Z" fill="#8bd45e"/>
      ${Array.from({ length: 17 }, (_, i) => `<path d="M${i * 88} 470 L${i * 88 + 30} 440 L${i * 88 + 60} 470 L${i * 88 + 60} 580 L${i * 88} 580Z" fill="#fff" stroke="${INK}" stroke-width="4"/>`).join('')}
      ${[[480, 960, '#F78FB3'], [620, 980, '#F7C928'], [1180, 970, '#9B5DE5'], [1330, 950, '#E8453C'], [80, 980, '#F58A2A']].map(p => fun(p[0], p[1] - 40, 0.55, A.flower(p[2]))).join('')}`,
  };

  const BG_EDGE = { house: 'linear-gradient(#cfe8fb 50%, #e6b980 50%)', farm: 'linear-gradient(#8fd8f5 50%, #6cc24a 50%)', market: 'linear-gradient(#fff3d1 50%, #f0d6a8 50%)', library: 'linear-gradient(#efe4ff 50%, #c7a7f0 50%)', park: 'linear-gradient(#7fd0f5 50%, #7fcf5a 50%)', garden: 'linear-gradient(#a8e4ff 50%, #8bd45e 50%)' };

  /* ---------- screens ---------- */
  let sceneTok = 0, cur = null, sessionStart = Date.now(), bedtimeShown = false;
  function newScene(html, bg = '#7fd3f0') {
    document.documentElement.style.background = bg; document.body.style.background = bg;
    sceneTok++;
    Speech.stop();
    if (cur && cur.timer) clearTimeout(cur.timer);
    cur = null;
    stage.classList.remove('show'); void stage.getBoundingClientRect();
    stage.innerHTML = html + '<g id="fx"></g>';
    stage.classList.add('show');
    return sceneTok;
  }
  const alive = tok => tok === sceneTok;

  function titleScreen() {
    newScene(`${sky()}<path d="M0 700 Q700 600 1400 700 L1400 1000 L0 1000Z" fill="#8bd45e"/>
      ${fun(1200, 140, 0.9, A.sun())}${fun(250, 150, 0.8, A.cloud())}
      <text x="700" y="230" text-anchor="middle" font-size="128" font-weight="900" fill="#F25F8B" stroke="#fff" stroke-width="14" paint-order="stroke" font-family="ui-rounded, 'Arial Rounded MT Bold', 'Chalkboard SE', sans-serif">Mari's World</text>
      ${guideSvg('mari', 360, 900, 1.5)}
      ${place(800, 600, 1, `<circle r="170" fill="#fff" fill-opacity="0.001"/><circle r="150" fill="#4CB944" stroke="${INK}" stroke-width="8"/><path d="M-40 -70 L80 0 L-40 70Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`, 'data-tap="start" class="it pulse"')}
      ${['mommy', 'daddy', 'maxi', 'nana', 'papa', 'gail', 'spera'].map((g, i) => `<g transform="translate(${1060 + (i % 4) * 90 - (i > 3 ? -45 : 0)} ${i > 3 ? 900 : 790}) scale(.62)">${A.head(GUIDES[g].look)}</g>`).join('')}`, 'linear-gradient(#8fd8f5 50%, #8bd45e 50%)');
  }

  const MAP_SPOTS = {
    house: { x: 700, y: 520, art: 'bHouse', guide: 'mommy', gx: 860, gy: 600 },
    farm: { x: 320, y: 300, art: 'bBarn', guide: 'nana', gx: 470, gy: 380, guide2: 'papa' },
    market: { x: 1080, y: 300, art: 'bMarket', guide: 'daddy', gx: 1230, gy: 380 },
    library: { x: 310, y: 740, art: 'bLibrary', guide: 'gail', gx: 460, gy: 820 },
    park: { x: 1090, y: 740, art: 'bPark', guide: 'maxi', gx: 1240, gy: 830 },
    garden: { x: 700, y: 870, art: 'bGarden', guide: 'spera', gx: 850, gy: 920 },
  };

  function mapScreen() {
    if (timeIsUp()) return bedtimeScreen();
    const tok = newScene(`<rect width="1400" height="1000" fill="#7fd3f0"/>
      ${[[120, 120], [1280, 520], [180, 520], [1300, 930]].map(p => `<path d="M${p[0] - 30} ${p[1]} q15 -12 30 0 q15 12 30 0" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/>`).join('')}
      <path d="M140 200 Q140 90 400 110 Q700 40 1000 110 Q1280 100 1290 240 Q1330 520 1290 820 Q1270 980 1000 960 Q700 1000 400 960 Q120 960 110 800 Q80 520 140 200Z" fill="#f3e3a8"/>
      <path d="M170 220 Q170 130 400 140 Q700 80 1000 140 Q1250 130 1255 250 Q1290 520 1255 800 Q1240 940 1000 925 Q700 960 400 925 Q150 925 145 790 Q120 520 170 220Z" fill="#8bd45e"/>
      <path d="M320 380 Q500 480 700 560 Q900 480 1080 380 M700 560 Q500 650 310 800 M700 560 Q900 650 1090 800 M700 560 L700 880" fill="none" stroke="#f3e3a8" stroke-width="36" stroke-linecap="round"/>
      ${fun(700, 110, 0.55, A.sun())}
      ${Object.entries(MAP_SPOTS).map(([id, m]) => `
        <g transform="translate(${m.x} ${m.y})"><g class="it bldg" data-tap="loc:${id}">${hit(150)}${A[m.art]()}</g></g>
        <g transform="translate(${m.gx} ${m.gy}) scale(.55)"><g class="it bob" data-tap="loc:${id}">${hit(80)}<circle r="72" fill="#fff" stroke="${INK}" stroke-width="5"/>${A.head(GUIDES[m.guide].look)}</g></g>
        ${m.guide2 ? `<g transform="translate(${m.gx - 90} ${m.gy + 40}) scale(.5)"><g class="it bob" data-tap="loc:${id}">${hit(80)}<circle r="72" fill="#fff" stroke="${INK}" stroke-width="5"/>${A.head(GUIDES[m.guide2].look)}</g></g>` : ''}
        ${progress.stickers[id] ? `<g transform="translate(${m.x - 100} ${m.y - 110}) scale(.5)">${A.star('#F7C928')}</g>` : ''}`).join('')}
      ${guideSvg('mari', 560, 650, 0.6)}
      ${place(1320, 900, 0.9, hit(80) + A.stickerBook(), 'data-tap="book"')}
      <g transform="translate(1345 60)"><g class="gear" data-tap="gear">${A.gear()}</g></g>`);
    Speech.say(SHARED.where);
    return tok;
  }

  async function stickerScreen() {
    const ids = Object.keys(LOCATIONS);
    const tok = newScene(`<rect width="1400" height="1000" fill="#f4ecff"/>
      <rect x="140" y="140" width="1120" height="780" rx="40" fill="#fff" stroke="${INK}" stroke-width="8"/>
      ${ids.map((id, i) => {
        const n = progress.stickers[id] || 0, x = 330 + (i % 3) * 370, y = 380 + Math.floor(i / 3) * 330, L = LOCATIONS[id];
        const art = A[L.sticker.art]();
        return `<g transform="translate(${x} ${y})"><g class="it" data-tap="stk:${id}">${hit(140)}
          <circle r="130" fill="${n ? '#fff6c9' : '#eee'}" stroke="${n ? '#F7C928' : '#ccc'}" stroke-width="10" stroke-dasharray="${n ? '0' : '18 12'}"/>
          <g transform="scale(.95)" ${n ? '' : 'opacity=".18" filter="url(#gray)"'}>${art}</g>
          ${n > 1 ? `<circle cx="95" cy="-95" r="38" fill="#F25F8B" stroke="${INK}" stroke-width="5"/><text x="95" y="-82" text-anchor="middle" font-size="40" font-weight="900" fill="#fff" font-family="sans-serif">${n}</text>` : ''}
        </g></g>`;
      }).join('')}
      <defs><filter id="gray"><feColorMatrix type="saturate" values="0"/></filter></defs>
      ${homeBtn()}`, '#f4ecff');
    Speech.say(SHARED.stickers);
    return tok;
  }

  function timeIsUp() { return settings.limit > 0 && Date.now() - sessionStart > settings.limit * 60000; }
  function bedtimeScreen() {
    bedtimeShown = true;
    newScene(`<rect width="1400" height="1000" fill="#1f2a5c"/>
      ${Array.from({ length: 30 }, () => `<circle cx="${rnd(1400)}" cy="${rnd(600)}" r="${2 + rnd(4)}" fill="#fff" opacity=".8"/>`).join('')}
      <g transform="translate(1050 230)"><circle r="110" fill="#ffe9a8"/><circle cx="50" cy="-30" r="100" fill="#1f2a5c"/></g>
      <path d="M0 760 Q700 680 1400 760 L1400 1000 L0 1000Z" fill="#2f6b3a"/>
      <g transform="translate(700 900) scale(1.3)"><g class="it">${A.person(GUIDES.mari.look)}</g></g>
      <g transform="translate(1345 60)"><g class="gear" data-tap="gear">${A.gear()}</g></g>`, 'linear-gradient(#1f2a5c 50%, #2f6b3a 50%)');
    Speech.say(SHARED.bedtime);
  }

  /* ---------- question building ---------- */
  function levelOf(id) { return Math.min(4, Math.max(2, progress.level[id] || 2)); }
  const colorList = ids => ids.map(c => COLORS[c]);
  const choice = (art, name, correct, extra = {}) => Object.assign({ art, name, correct }, extra);

  function slotPositions(n) {
    if (n === 2) return [[720, 600], [1110, 600]];
    if (n === 3) return [[600, 610], [900, 610], [1200, 610]];
    return [[720, 430], [1120, 430], [720, 770], [1120, 770]];
  }

  const ROUNDS = {
    house(n) {
      const L = LOCATIONS.house, items = L.items, out = [];
      const order = shuffle(['find', 'color', 'use', 'color', 'find']);
      const used = [];
      for (const t of order) {
        if (t === 'color') {
          const it = pick(items.filter(i => i.colorable && !used.includes(i)));
          used.push(it);
          const cols = pickN(L.colors, n); const target = cols[0];
          out.push({
            prompt: L.prompts.color(it, target),
            choices: shuffle(cols.map(c => choice(A[it.id](COLORS[c].hex), { en: `${COLORS[c].en} ${it.en}`, pt: `${it.pt} ${COLORS[c].pt[it.g]}`, g: it.g, id: `${it.id}.${c}` }, c === target))),
          });
        } else {
          const pool = t === 'use' ? items.filter(i => i.use) : items;
          const it = pick(pool.filter(i => !used.includes(i)));
          used.push(it);
          const others = pickN(items, n - 1, [it]);
          out.push({
            prompt: t === 'use' ? L.prompts.use(it) : L.prompts.find(it),
            choices: shuffle([it, ...others].map(o => choice(A[o.id](), { en: o.en, pt: o.pt, g: o.g, id: o.id }, o === it))),
          });
        }
      }
      return out;
    },
    farm(n) {
      const L = LOCATIONS.farm, out = [];
      const targets = pickN(L.items, 5);
      ['find', 'find', 'sound', 'find', 'sound'].forEach((t, i) => {
        const it = targets[i], others = pickN(L.items, n - 1, [it]);
        out.push({
          prompt: t === 'sound' ? L.prompts.sound(it) : L.prompts.find(it),
          choices: shuffle([it, ...others].map(o => choice(A[o.id](), { en: o.en, pt: o.pt, g: o.g, id: o.id }, o === it, { says: L.prompts.animal(o) }))),
        });
      });
      return out;
    },
    market(n) {
      const L = LOCATIONS.market, out = [];
      const fr = pickN(L.items, 5);
      const maxN = n <= 2 ? 3 : 5;
      const mkFind = it => ({ prompt: L.prompts.find(it), choices: shuffle([it, ...pickN(L.items, n - 1, [it])].map(o => choice(A[o.id](), { en: o.en, pt: o.pt, g: o.g, id: o.id }, o === it))) });
      const mkCount = it => {
        const nums = pickN([1, 2, 3, 4, 5].filter(k => k <= Math.max(maxN, n)), Math.min(n, 3));
        const target = nums[0];
        return { kind: 'count', item: it, prompt: L.prompts.count(it, target), choices: shuffle(nums.map(k => choice(A.basket(it.id, k), null, k === target, { count: k }))) };
      };
      const mkAlong = it => { const k = 2 + rnd(n <= 2 ? 2 : 4); return { kind: 'along', item: it, n: k, prompt: L.prompts.along(it) }; };
      out.push(mkFind(fr[0]), mkAlong(fr[1]), mkFind(fr[2]), mkCount(fr[3]), mkCount(fr[4]));
      return out;
    },
    library(n) {
      const L = LOCATIONS.library, out = [];
      const cols = ['#E8453C', '#3A7BE0', '#4CB944', '#9B5DE5', '#F58A2A', '#F25F8B', '#2EB8A6'];
      const mk = (T, prompt, extra = {}) => {
        const others = pickN(L.letters, n - 1, [T]);
        const cs = shuffle(cols);
        return Object.assign({ prompt, choices: shuffle([T, ...others]).map((x, i) => choice(A.letter(x, cs[i]), Object.assign({ id: x }, L.letterName(x)), x === T)) }, extra);
      };
      const nameRound = (progress.visits.library || 1) % 2 === 1;
      if (nameRound) {
        'MARI'.split('').forEach((T, i) => out.push(mk(T, L.prompts.name(T), i === 0 ? { intro: L.nameIntro } : i === 3 ? { outro: L.nameDone } : {})));
        out.push(mk(pick(L.letters.filter(x => !'MARI'.includes(x))), L.prompts.find('')));
        out[4].prompt = L.prompts.find(out[4].choices.find(c => c.correct).name.id);
      } else {
        pickN(L.letters, 5).forEach(T => out.push(mk(T, L.prompts.find(T))));
      }
      return out;
    },
    park(n) {
      const L = LOCATIONS.park, out = [];
      ['color', 'size', 'color', 'color', 'size'].forEach(t => {
        if (t === 'size') {
          const s = pick(['big', 'little']), c = COLORS[pick(L.colors)].hex;
          out.push({
            prompt: L.prompts.size(s), kind: 'size',
            choices: shuffle(['big', 'little'].map(k => choice(A.ball(c), Object.assign({ id: k }, L.sizes[k]), k === s, { scale: k === 'big' ? 1.45 : 0.6 }))),
          });
        } else {
          const cols = pickN(L.colors, n), target = cols[0];
          out.push({
            prompt: L.prompts.color(target),
            choices: shuffle(cols.map(c => choice(A.balloon(COLORS[c].hex), { en: `${COLORS[c].en} balloon`, pt: `balão ${COLORS[c].pt.m}`, g: 'm', id: `balloon.${c}` }, c === target, { pop: true }))),
          });
        }
      });
      return out;
    },
    garden(n) {
      const L = LOCATIONS.garden, out = [];
      const cols = ['#E8453C', '#3A7BE0', '#4CB944', '#9B5DE5', '#F58A2A', '#F78FB3', '#F7C928'];
      const sh = pickN(L.shapes, 3), bg = pickN(L.bugs, 2);
      [['shape', sh[0]], ['bug', bg[0]], ['shape', sh[1]], ['bug', bg[1]], ['shape', sh[2]]].forEach(([t, it]) => {
        const pool = t === 'shape' ? L.shapes : L.bugs;
        const cs = shuffle(cols);
        out.push({
          prompt: L.prompts[t](it),
          choices: shuffle([it, ...pickN(pool, n - 1, [it])].map((o, i) => choice(t === 'shape' ? A[o.id](cs[i]) : A[o.id](), { en: o.en, pt: o.pt, g: o.g, id: o.id }, o === it))),
        });
      });
      return out;
    },
  };

  /* ---------- playing a location ---------- */
  async function playLocation(id) {
    const L = LOCATIONS[id];
    progress.visits[id] = (progress.visits[id] || 0) + 1; saveProgress();
    const guides = L.guides;
    const gHtml = guides.length === 1 ? guideSvg(guides[0], 230, 960, 1.45) : guideSvg(guides[0], 170, 960, 1.25) + guideSvg(guides[1], 360, 985, 1.3);
    const tok = newScene(`${BACKGROUNDS[id]()}${gHtml}<g id="choices"></g>${homeBtn()}`, BG_EDGE[id]);
    cur = { id, L, tok, qs: ROUNDS[id](levelOf(id)), i: 0, streak: progress['streak_' + id] || 0 };
    const c = cur;
    if (!(await Speech.say(L.greet, guides[0])) || !alive(tok)) return;
    if (!(await Speech.say(L.setup, guides[0])) || !alive(tok)) return;
    askQuestion(c);
  }

  const speakerFor = c => c.L.guides[c.i % c.L.guides.length];

  async function askQuestion(c) {
    if (!alive(c.tok)) return;
    if (c.i >= c.qs.length) return finishLocation(c);
    const q = c.qs[c.i];
    c.q = q; c.misses = 0; c.locked = false; c.reprompts = 0;
    const layer = stage.querySelector('#choices');
    if (q.kind === 'along') {
      const pos = Array.from({ length: q.n }, (_, k) => [600 + (k * 640) / Math.max(1, q.n - 1), 600 + (k % 2 ? -80 : 60)]);
      if (q.n === 1) pos[0] = [900, 600];
      q.tapped = new Array(q.n).fill(false); q.count = 0;
      layer.innerHTML = pos.map((p, k) => `<g transform="translate(${p[0]} ${p[1]}) scale(.95)"><g class="it choice pop-in" data-tap="cnt${k}" style="animation-delay:${k * 0.08}s">${hit(110)}<circle class="glowc" r="112" fill="#fff59d"/>${A[q.item.id]()}<g class="badge"></g></g></g>`).join('');
    } else {
      const pos = slotPositions(q.choices.length), s = q.choices.length === 4 ? 1.05 : 1.2;
      layer.innerHTML = q.choices.map((ch, k) => `<g transform="translate(${pos[k][0]} ${pos[k][1]}) scale(${s * (ch.scale || 1)})"><g class="it choice pop-in" data-tap="c${k}" style="animation-delay:${k * 0.08}s">${hit(118)}<circle class="glowc" r="120" fill="#fff59d"/>${ch.art}</g></g>`).join('');
    }
    SFX.whoosh();
    if (q.intro) { if (!(await Speech.say(q.intro, speakerFor(c))) || !alive(c.tok)) return; }
    if (c.q !== q) return;
    await Speech.say(q.prompt, speakerFor(c));
    scheduleReprompt(c, q);
  }

  function scheduleReprompt(c, q) {
    clearTimeout(c.timer);
    c.timer = setTimeout(async () => {
      if (!alive(c.tok) || c.q !== q || c.locked || c.reprompts >= 3) return;
      c.reprompts++;
      stage.querySelectorAll('#choices .choice').forEach(el => restart(el, 'wiggle'));
      await Speech.say(q.prompt, speakerFor(c));
      scheduleReprompt(c, q);
    }, 8000);
  }

  function choiceEl(k) { return stage.querySelector(`[data-tap="c${k}"]`); }
  function centerOf(el) {
    const b = el.getBoundingClientRect(); const p = svgPoint({ clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 }); return p;
  }

  async function onChoice(k) {
    const c = cur; if (!c || c.locked) return;
    const q = c.q, ch = q.choices[k], el = choiceEl(k), who = speakerFor(c);
    if (!ch || !el) return;
    scheduleReprompt(c, q);
    if (ch.correct) {
      c.locked = true; clearTimeout(c.timer);
      restart(el, 'yay'); SFX.yay();
      const p = centerOf(el); burst(p.x, p.y);
      if (ch.pop) { setTimeout(() => { el.style.opacity = '0'; SFX.pop(); }, 500); }
      adapt(c, c.misses === 0);
      const lines = [];
      if (ch.says) lines.push(ch.says);
      lines.push(pick(GENERIC.praise));
      if (q.outro) lines.push(q.outro);
      await Speech.say(lines, who);
      if (!alive(c.tok)) return;
      await wait(250);
      c.i++; askQuestion(c);
    } else {
      c.misses++;
      restart(el, 'wiggle'); SFX.soft();
      const right = q.choices.findIndex(x => x.correct);
      const lines = [];
      if (ch.says) lines.push(ch.says);
      if (q.kind === 'count') lines.push(c.L.prompts.countHint(q.item, ch.count));
      else if (q.kind !== 'size') lines.push(GENERIC.thats(ch.name, ch.name.id));
      if (c.misses >= 2) {
        const r = choiceEl(right); if (r) r.classList.add('glow');
        lines.push(GENERIC.here);
      } else {
        lines.push(GENERIC.tryAgain, q.prompt);
      }
      await Speech.say(lines, who);
    }
  }

  async function onCount(k) {
    const c = cur; if (!c || c.locked) return;
    const q = c.q; if (q.kind !== 'along' || q.tapped[k]) return;
    q.tapped[k] = true; q.count++;
    clearTimeout(c.timer);
    const el = stage.querySelector(`[data-tap="cnt${k}"]`);
    restart(el, 'yay'); SFX.tick(q.count);
    const badge = el.querySelector('.badge');
    badge.innerHTML = `<circle cx="70" cy="-75" r="38" fill="#F25F8B" stroke="${INK}" stroke-width="5"/><text x="70" y="-61" text-anchor="middle" font-size="42" font-weight="900" fill="#fff" font-family="sans-serif">${q.count}</text>`;
    const p = centerOf(el); burst(p.x, p.y, 10, false);
    if (q.count >= q.n) {
      c.locked = true;
      adapt(c, true);
      await Speech.say([SHARED.count[q.count - 1], c.L.prompts.alongDone(q.item, q.n), pick(GENERIC.praise)], speakerFor(c));
      if (!alive(c.tok)) return;
      SFX.yay(); burst(900, 500);
      await wait(300);
      c.i++; askQuestion(c);
    } else {
      Speech.say(SHARED.count[q.count - 1], speakerFor(c));
      scheduleReprompt(c, q);
    }
  }

  function adapt(c, firstTry) {
    const id = c.id;
    if (firstTry) {
      c.streak++;
      if (c.streak >= 3) { progress.level[id] = Math.min(4, levelOf(id) + 1); c.streak = 0; }
    } else {
      c.streak = 0;
      if (c.misses >= 2) progress.level[id] = Math.max(2, levelOf(id) - 1);
    }
    progress['streak_' + id] = c.streak;
    saveProgress();
  }

  async function finishLocation(c) {
    const L = c.L;
    progress.stickers[c.id] = (progress.stickers[c.id] || 0) + 1; saveProgress();
    const layer = stage.querySelector('#choices');
    layer.innerHTML = `<g transform="translate(900 560)"><g class="it pop-in" data-tap="home">${hit(200)}
      <circle r="190" fill="#fff6c9" stroke="#F7C928" stroke-width="14"/>${A[L.sticker.art]()}</g></g>`;
    SFX.yay(); burst(900, 560); setTimeout(() => alive(c.tok) && burst(700, 400), 500); setTimeout(() => alive(c.tok) && burst(1100, 400), 900);
    const g = stage.querySelectorAll('.guide'); g.forEach(x => x.classList.add('waving'));
    await Speech.say([...L.end, GENERIC.sticker], L.guides[0]);
    if (!alive(c.tok)) return;
    await Speech.say(GENERIC.bye, L.guides[L.guides.length - 1]);
    if (!alive(c.tok)) return;
    await wait(1200);
    if (alive(c.tok)) mapScreen();
  }

  /* ---------- parent area ---------- */
  let holdTimer = null;
  function startHold(el) {
    el.classList.add('holding');
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { el.classList.remove('holding'); openSettings(); }, 2000);
  }
  function endHold() { clearTimeout(holdTimer); stage.querySelectorAll('.holding').forEach(e => e.classList.remove('holding')); }

  function openSettings() {
    Speech.stop();
    const btn = (group, val, label) => `<button data-set="${group}" data-val="${val}" class="${String(settings[group]) === String(val) ? 'on' : ''}">${label}</button>`;
    overlay.innerHTML = `<div class="panel">
      <h2>Grown-ups</h2>
      <div class="row"><span>Language</span>${btn('lang', 'en', 'English')}${btn('lang', 'pt', 'Português')}${btn('lang', 'both', 'Both / Ambos')}</div>
      <div class="row"><span>Play time</span>${btn('limit', 0, 'No limit')}${btn('limit', 10, '10 min')}${btn('limit', 15, '15 min')}${btn('limit', 20, '20 min')}</div>
      <div class="row"><span>Voice speed</span>${btn('rate', 0.75, 'Slow')}${btn('rate', 0.9, 'Normal')}${btn('rate', 1, 'Fast')}</div>
      <div class="row"><span>Test voice</span><button data-act="test">Play a sample</button></div>
      <p class="note">Stickers earned: ${Object.values(progress.stickers).reduce((a, b) => a + b, 0)}. Choices per question adapt from 2 to 4.<br>
      Tip: on iPad, use Settings &gt; Accessibility &gt; Guided Access to keep Mari inside the game. For nicer voices, download an "Enhanced" English and Portuguese voice in Settings &gt; Accessibility &gt; Spoken Content &gt; Voices.</p>
      <div class="row"><button data-act="reset" class="danger">Reset progress</button><button data-act="close" class="primary">Back to the game</button></div>
    </div>`;
    overlay.classList.add('open');
  }
  overlay.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.set) {
      const g = b.dataset.set, v = b.dataset.val;
      settings[g] = g === 'lang' ? v : Number(v);
      saveSettings();
      if (g === 'limit') { sessionStart = Date.now(); bedtimeShown = false; }
      openSettings();
    } else if (b.dataset.act === 'test') {
      Speech.say(SHARED.welcome);
    } else if (b.dataset.act === 'reset') {
      if (b.dataset.confirm) { progress.stickers = {}; progress.level = {}; progress.visits = {}; Object.keys(progress).filter(k => k.startsWith('streak_')).forEach(k => delete progress[k]); saveProgress(); openSettings(); }
      else { b.dataset.confirm = '1'; b.textContent = 'Tap again to reset'; }
    } else if (b.dataset.act === 'close') {
      overlay.classList.remove('open'); overlay.innerHTML = '';
      sessionStart = bedtimeShown ? Date.now() : sessionStart; bedtimeShown = false;
      mapScreen();
    }
  });

  /* ---------- input ---------- */
  let lastTap = 0;
  stage.addEventListener('pointerdown', e => {
    if (!e.isPrimary) return;
    e.preventDefault();
    audioInit();
    const t = e.target.closest('[data-tap]');
    if (!t) { const p = svgPoint(e); burst(p.x, p.y, 8, false); SFX.sparkle(); return; }
    const key = t.dataset.tap;
    if (key === 'gear') return startHold(t);
    const now = Date.now(); if (now - lastTap < 200) return; lastTap = now;
    handleTap(key, t);
  });
  window.addEventListener('pointerup', endHold);
  window.addEventListener('pointercancel', endHold);
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());

  async function handleTap(key, el) {
    if (key === 'start') {
      Speech.unlock(); SFX.yay();
      const tok = sceneTok;
      await Speech.say(SHARED.welcome);
      if (alive(tok)) mapScreen();
      return;
    }
    if (key.startsWith('loc:')) {
      const id = key.slice(4);
      const tok = sceneTok;
      restart(el, 'yay'); SFX.whoosh();
      const p = centerOf(el); burst(p.x, p.y, 14, false);
      stage.querySelectorAll(`[data-tap="loc:${id}"]`).forEach(x => restart(x, 'yay'));
      await Speech.say(LOCATIONS[id].to);
      if (alive(tok)) playLocation(id);
      return;
    }
    if (key === 'home') { SFX.pop(); return mapScreen(); }
    if (key === 'book') { SFX.sparkle(); return stickerScreen(); }
    if (key === 'fun') { restart(el, 'wiggle'); funSfx(); const p = centerOf(el); burst(p.x, p.y, 8, false); return; }
    if (key.startsWith('guide:')) {
      restart(el, 'yay'); SFX.boing();
      if (!cur) Speech.say(pick(GENERIC.guideTap), key.slice(6));
      return;
    }
    if (key.startsWith('stk:')) {
      const id = key.slice(4); restart(el, 'wiggle'); SFX.sparkle();
      Speech.say(LOCATIONS[id].name);
      return;
    }
    if (key.startsWith('cnt')) return onCount(Number(key.slice(3)));
    if (key.startsWith('c')) return onChoice(Number(key.slice(1)));
  }

  /* expose a tiny API for testing */
  window.MW = { ask: askQuestion, mapScreen, playLocation, stickerScreen, titleScreen, settings, progress, ROUNDS, Speech, state: () => cur };
  titleScreen();
})();
