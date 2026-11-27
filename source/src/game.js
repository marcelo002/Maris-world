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
    if (!el || !el.classList.contains('it')) return; /* only animate inner groups, never ones placed with a transform */
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

  /* ---------- text helpers ---------- */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const FONT = `font-family="ui-rounded, 'SF Pro Rounded', 'Arial Rounded MT Bold', 'Nunito', system-ui, sans-serif"`;
  const langLines = o => (settings.lang === 'both' ? (o.en === o.pt ? [o.en] : [o.en, o.pt]) : [o[settings.lang]]).filter(Boolean);
  const oneLine = o => langLines(o).join('  ·  ');
  const textW = (s, size) => String(s).length * size * 0.55;
  const darken = A.darken;
  const UI = { en: {}, pt: {} };
  const T = {
    map: { en: 'Map', pt: 'Mapa' },
    stickers: { en: 'Stickers', pt: 'Figurinhas' },
    grownups: { en: 'Grown-ups: hold', pt: 'Adultos: segure' },
    tapPlace: { en: 'Tap a place to play!', pt: 'Toque em um lugar para brincar!' },
    world: { en: "Mari's World", pt: 'Mundo da Mari' },
    play: { en: 'Tap to play', pt: 'Toque para jogar' },
    book: { en: 'Sticker Book', pt: 'Livro de Figurinhas' },
    earned: { en: 'Sticker earned!', pt: 'Você ganhou uma figurinha!' },
    notYet: { en: 'Not yet', pt: 'Ainda não' },
    tapCount: { en: 'Tap each one to count', pt: 'Toque em cada um para contar' },
    rest: { en: 'Time to rest', pt: 'Hora de descansar' },
    hostedBy: (names) => ({ en: 'with ' + names.map(n => n.en).join(' & '), pt: 'com ' + names.map(n => n.pt).join(' e ') }),
  };

  /* a rounded label; first line big, the rest smaller */
  function pill(x, y, lines, o = {}) {
    const size = o.size || 30, bg = o.bg || '#ffffff', fg = o.fg || '#3a2f45', sub = o.sub || '#7a6a8a', pad = o.pad || 22;
    const sizes = lines.map((l, i) => (i ? size * 0.78 : size));
    const w = Math.max(...lines.map((l, i) => textW(l, sizes[i]))) + pad * 2;
    const h = sizes.reduce((a, b) => a + b * 1.12, 0) + 18;
    let ty = -h / 2 + 9;
    const txt = lines.map((l, i) => { ty += sizes[i] * 1.12; return `<text x="0" y="${(ty - sizes[i] * 0.24).toFixed(1)}" text-anchor="middle" font-size="${sizes[i].toFixed(1)}" font-weight="${i ? 700 : 800}" fill="${i ? sub : fg}" ${FONT}>${esc(l)}</text>`; }).join('');
    return `<g transform="translate(${x} ${y})" class="label" ${o.attrs || ''}><rect x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(h / 2, o.rx || 24).toFixed(1)}" fill="${bg}" ${o.stroke ? `stroke="${o.stroke}" stroke-width="4"` : ''} filter="url(#lift)"/>${txt}</g>`;
  }
  /* ribbon title across the top */
  function banner(text, color, x = 720, y = 62, size = 42, maxW = 0) {
    if (maxW) size = Math.min(size, (maxW - 90) / (String(text).length * 0.55));
    const w = Math.max(380, textW(text, size) + 90), d = darken(color, 0.72);
    return `<g transform="translate(${x} ${y})" class="banner">
      <path d="M${-w / 2 + 6} -20 L${-w / 2 - 58} -20 L${-w / 2 - 36} 6 L${-w / 2 - 58} 32 L${-w / 2 + 6} 32Z" fill="${d}"/>
      <path d="M${w / 2 - 6} -20 L${w / 2 + 58} -20 L${w / 2 + 36} 6 L${w / 2 + 58} 32 L${w / 2 - 6} 32Z" fill="${d}"/>
      <rect x="${-w / 2}" y="-38" width="${w}" height="76" rx="18" fill="${color}" filter="url(#lift)"/>
      <rect x="${-w / 2 + 8}" y="-31" width="${w - 16}" height="26" rx="12" fill="#fff" opacity=".18"/>
      <text x="0" y="15" text-anchor="middle" font-size="${size}" font-weight="900" fill="#fff" stroke="${d}" stroke-width="6" paint-order="stroke" ${FONT}>${esc(text)}</text></g>`;
  }
  /* question card with a repeat button */
  function cardSvg(obj, extra) {
    const lines = langLines(obj);
    const maxW = 860;
    const big = Math.min(38, maxW / (Math.max(1, lines[0].length) * 0.55));
    const small = lines[1] ? Math.min(31, maxW / (lines[1].length * 0.55)) : 0;
    const h = 30 + big * 1.15 + (small ? small * 1.2 : 0) + (extra ? 34 : 0);
    let s = `<g transform="translate(345 118)"><rect width="1010" height="${h}" rx="28" fill="#fff" opacity=".97" filter="url(#lift)"/>
      <g transform="translate(58 ${h / 2})" data-tap="repeat"><g class="it">${hit(44)}<circle r="38" fill="#3A7BE0"/><circle r="38" fill="none" stroke="#2c63b8" stroke-width="4"/>
      <path d="M-16 -10 L-6 -10 L8 -22 L8 22 L-6 10 L-16 10Z" fill="#fff"/><path d="M14 -10 Q22 0 14 10 M19 -17 Q32 0 19 17" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g></g>`;
    s += `<text x="118" y="${18 + big}" font-size="${big.toFixed(1)}" font-weight="800" fill="#3a2f45" ${FONT}>${esc(lines[0])}</text>`;
    if (lines[1]) s += `<text x="118" y="${18 + big * 1.15 + small}" font-size="${small.toFixed(1)}" font-weight="700" fill="#8a5fb5" ${FONT}>${esc(lines[1])}</text>`;
    if (extra) s += `<text x="118" y="${h - 16}" font-size="24" font-weight="700" fill="#9a8fa6" ${FONT}>${esc(extra)}</text>`;
    return s + '</g>';
  }
  function setCard(obj, extra) { const c = stage.querySelector('#qcard'); if (c) c.innerHTML = obj ? cardSvg(obj, extra) : ''; }
  function setProgress(done, total) {
    const g = stage.querySelector('#prog'); if (!g) return;
    let s = '';
    for (let i = 0; i < total; i++) s += `<g transform="translate(${i * 46} 0) scale(.24)">${A.star(i < done ? '#F7C928' : '#ffffff')}</g>`;
    g.innerHTML = `<rect x="-30" y="-30" width="${total * 46 + 14}" height="60" rx="30" fill="#fff" opacity=".85" filter="url(#lift)"/>` + s;
  }
  function toast(obj, color = '#4CB944') {
    const fx = fxLayer(); if (!fx) return;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = pill(0, 0, langLines(obj), { size: 46, bg: color, fg: '#fff', sub: '#ffffffd9', rx: 40, pad: 34 });
    g.setAttribute('transform', 'translate(850 320)');
    fx.appendChild(g);
    const inner = g.firstChild;
    if (inner.animate) inner.animate([{ transform: 'translate(0px,0px) scale(.4)', opacity: 0 }, { transform: 'translate(0px,0px) scale(1.08)', opacity: 1, offset: 0.2 }, { transform: 'translate(0px,0px) scale(1)', opacity: 1, offset: 0.75 }, { transform: 'translate(0px,-30px) scale(1)', opacity: 0 }], { duration: 1500, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => g.remove(), 1600);
  }

  /* ---------- shared svg defs ---------- */
  const DEFS = `<defs>
    <filter id="depth" x="-20%" y="-20%" width="140%" height="150%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b"/>
      <feOffset in="b" dx="7" dy="9" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="hm"/>
      <feFlood flood-color="#ffffff" flood-opacity=".42"/><feComposite in2="hm" operator="in" result="hi"/>
      <feOffset in="b" dx="-7" dy="-9" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="sm"/>
      <feFlood flood-color="#2a1640" flood-opacity=".22"/><feComposite in2="sm" operator="in" result="sh"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="db"/><feOffset in="db" dy="10" result="dbo"/>
      <feFlood flood-color="#2a1640" flood-opacity=".22"/><feComposite in2="dbo" operator="in" result="drop"/>
      <feMerge><feMergeNode in="drop"/><feMergeNode in="SourceGraphic"/><feMergeNode in="hi"/><feMergeNode in="sh"/></feMerge>
    </filter>
    <filter id="lift" x="-10%" y="-20%" width="120%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dy="5" result="o"/><feFlood flood-color="#2a1640" flood-opacity=".22"/><feComposite in2="o" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="sunglow"><stop offset="0" stop-color="#fff6b8" stop-opacity=".95"/><stop offset=".5" stop-color="#fff6b8" stop-opacity=".35"/><stop offset="1" stop-color="#fff6b8" stop-opacity="0"/></radialGradient>
    <radialGradient id="vignette" cx=".5" cy=".45" r=".75"><stop offset=".65" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1640" stop-opacity=".16"/></radialGradient>
    <filter id="gray"><feColorMatrix type="saturate" values="0"/></filter>
  </defs>`;
  const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const vignette = `<rect x="-200" y="-200" width="1800" height="1400" fill="url(#vignette)" pointer-events="none"/>`;

  /* ---------- characters ---------- */
  function guideSvg(id, x, y, s, tag = true) {
    const look = GUIDES[id].look, top = (look.kid ? -262 : -322) * s;
    return `<g transform="translate(${x} ${y}) scale(${s})"><g class="it guide" data-guide="${id}" data-tap="guide:${id}"><circle r="150" cy="-200" fill="#fff" fill-opacity="0.001"/><g filter="url(#depth)">${A.person(look)}</g></g></g>` +
      (tag ? pill(x, y + top - 26, [oneLine(GUIDES[id].name)], { size: 26, bg: '#3a2f45', fg: '#fff', pad: 18 }) : '');
  }
  const item = art => `<g filter="url(#depth)">${art}</g>`;

  /* ---------- scene chrome ---------- */
  const homeBtn = () => place(90, 90, 1.1, hit(70) + item(A.home()), 'data-tap="home"') + pill(90, 172, [oneLine(T.map)], { size: 22, pad: 14 });
  const fun = (x, y, s, inner) => place(x, y, s, hit(90) + item(inner), 'data-tap="fun"');
  const sunAt = (x, y, s) => `<circle cx="${x}" cy="${y}" r="${230 * s}" fill="url(#sunglow)"/>` + fun(x, y, s, A.sun());
  const skyRect = (a, b) => `<defs>${lg('skyg', [a, b])}</defs><rect x="-200" y="-300" width="1800" height="1400" fill="url(#skyg)"/>`;
  const tufts = (pts, c) => pts.map(p => `<g transform="translate(${p[0]} ${p[1]}) scale(${p[2] || 1})">${A.tuft(c)}</g>`).join('');
  const cloud = (x, y, s) => fun(x, y, s, A.cloud());

  const BACKGROUNDS = {
    house: () => `<defs>${lg('wall', ['#fff4e8', '#fbe3cf'])}${lg('floor', ['#e9b47c', '#cf9156'])}${lg('glass', ['#a8ddff', '#e3f5ff'])}
        <pattern id="dots" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="5" fill="#f6c7d6"/><circle cx="45" cy="45" r="5" fill="#cfe3f7"/></pattern></defs>
      <rect x="-200" y="-300" width="1800" height="1000" fill="url(#wall)"/><rect x="-200" y="-300" width="1800" height="860" fill="url(#dots)" opacity=".55"/>
      <rect x="-200" y="560" width="1800" height="140" fill="#eadcf5"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${-60 + i * 130}" y="580" width="100" height="100" rx="8" fill="none" stroke="#d7c3ea" stroke-width="5"/>`).join('')}
      <rect x="-200" y="690" width="1800" height="22" fill="#fff"/><rect x="-200" y="710" width="1800" height="400" fill="url(#floor)"/>
      ${[760, 830, 920].map(y => `<path d="M-200 ${y} L1600 ${y}" stroke="#bf8550" stroke-width="4" opacity=".55"/>`).join('')}
      <g transform="translate(700 365) scale(.78)"><rect x="-170" y="-130" width="340" height="250" rx="16" fill="#fff" stroke="#c7b7d6" stroke-width="6"/><rect x="-150" y="-110" width="300" height="210" rx="8" fill="url(#glass)"/>
        <path d="M-150 60 Q-60 10 20 50 Q90 20 150 50 L150 100 L-150 100Z" fill="#8bd45e"/><circle cx="90" cy="-50" r="26" fill="#FFD93B"/><path d="M0 -110 L0 100 M-150 -5 L150 -5" stroke="#fff" stroke-width="10"/>
        <path d="M-200 -150 Q-180 0 -210 140 L-130 140 Q-150 10 -120 -150Z" fill="#F78FB3" stroke="#d6608a" stroke-width="4"/><path d="M200 -150 Q180 0 210 140 L130 140 Q150 10 120 -150Z" fill="#F78FB3" stroke="#d6608a" stroke-width="4"/>
        <rect x="-220" y="-162" width="440" height="20" rx="10" fill="#C77B3A"/></g>
      <g transform="translate(700 860)"><ellipse rx="470" ry="96" fill="#f48fb1"/><ellipse rx="430" ry="78" fill="#f8bbd0"/><ellipse rx="380" ry="60" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="20 14"/></g>
      ${fun(1290, 340, 0.7, A.clock())}${fun(1290, 640, 0.85, A.plant())}`,
    farm: () => `${skyRect('#5fbdf0', '#d6f1ff')}${sunAt(170, 300, 0.7)}${cloud(560, 290, 0.6)}${cloud(1000, 270, 0.75)}
      <defs>${lg('h1', ['#b5e38a', '#93d066'])}${lg('h2', ['#7ccd4f', '#55a93a'])}</defs>
      <path d="M-200 500 Q200 400 600 470 Q1000 390 1600 480 L1600 1200 L-200 1200Z" fill="url(#h1)"/>
      ${[[420, 470, 0.45], [520, 455, 0.55], [640, 470, 0.4], [880, 440, 0.5], [960, 452, 0.42]].map(t => `<g transform="translate(${t[0]} ${t[1]}) scale(${t[2]})" opacity=".85">${A.roundTree('#6dbb4f')}</g>`).join('')}
      <g transform="translate(1210 430) scale(1.15)" filter="url(#depth)">${A.bBarn()}</g>
      <g transform="translate(1350 380)" filter="url(#depth)"><rect x="-38" y="-120" width="76" height="200" rx="10" fill="#cfd8e3" stroke="#8d9bb0" stroke-width="5"/><path d="M-38 -120 Q0 -175 38 -120Z" fill="#E8453C" stroke="#a52f28" stroke-width="5"/></g>
      ${Array.from({ length: 11 }, (_, i) => `<rect x="${360 + i * 66}" y="455" width="18" height="86" rx="5" fill="#fff" stroke="#b9a58c" stroke-width="4"/>`).join('')}
      <rect x="350" y="472" width="690" height="14" rx="5" fill="#fff" stroke="#b9a58c" stroke-width="4"/><rect x="350" y="508" width="690" height="14" rx="5" fill="#fff" stroke="#b9a58c" stroke-width="4"/>
      <path d="M-200 600 Q300 545 800 610 Q1100 570 1600 600 L1600 1200 L-200 1200Z" fill="url(#h2)"/>
      ${tufts([[480, 900], [620, 960, 1.2], [1000, 920], [1180, 975, 1.3], [1320, 880], [820, 870, 0.9]], '#3f8f2c')}${vignette}`,
    market: () => `<defs>${lg('mw', ['#fff8e4', '#ffeec4'])}${lg('mf', ['#f3dcb2', '#e2c08b'])}</defs>
      <rect x="-200" y="-300" width="1800" height="1080" fill="url(#mw)"/>
      ${Array.from({ length: 24 }, (_, i) => `<path d="M${-200 + i * 80} -10 L${-120 + i * 80} -10 L${-120 + i * 80} 18 Q${-160 + i * 80} 52 ${-200 + i * 80} 18Z" fill="${i % 2 ? '#fff' : '#E8453C'}"/>`).join('')}
      ${[440].map((y, r) => `<rect x="430" y="${y}" width="940" height="22" rx="6" fill="#C77B3A"/><rect x="430" y="${y + 22}" width="940" height="10" fill="#a8652c"/>` + Array.from({ length: 13 }, (_, i) => { const c = ['#E8453C', '#3A7BE0', '#F7C928', '#4CB944', '#9B5DE5', '#F58A2A'][(i + r * 3) % 6]; const tall = 52 + ((i * 7 + r * 3) % 3) * 14; return `<g><rect x="${448 + i * 70}" y="${y - tall}" width="54" height="${tall}" rx="8" fill="${c}"/><rect x="${456 + i * 70}" y="${y - tall + 16}" width="38" height="18" rx="4" fill="#fff" opacity=".85"/></g>`; }).join('')).join('')}
      <rect x="-200" y="740" width="1800" height="460" fill="url(#mf)"/>${Array.from({ length: 18 }, (_, i) => `<rect x="${-200 + i * 100}" y="${740 + (i % 2) * 70}" width="100" height="70" fill="#d9b47c" opacity=".55"/><rect x="${-200 + i * 100}" y="${880 + ((i + 1) % 2) * 70}" width="100" height="70" fill="#d9b47c" opacity=".55"/>`).join('')}
      ${fun(1280, 880, 0.8, `<rect x="-90" y="-70" width="180" height="120" rx="16" fill="#3A9AD9" stroke="#2c63b8" stroke-width="5"/><rect x="-66" y="-52" width="132" height="44" rx="8" fill="#c4f5cf"/><text x="0" y="-19" text-anchor="middle" font-size="32" font-weight="900" fill="#2f6b3a" ${FONT}>1 2 3</text><circle cx="-40" cy="22" r="10" fill="#fff"/><circle cx="0" cy="22" r="10" fill="#fff"/><circle cx="40" cy="22" r="10" fill="#fff"/>`)}${vignette}`,
    library: () => `<defs>${lg('lw', ['#f4edff', '#e6dafc'])}${lg('lf', ['#c9a8ef', '#b08cdf'])}</defs>
      <rect x="-200" y="-300" width="1800" height="1100" fill="url(#lw)"/>
      <rect x="380" y="232" width="1000" height="308" rx="10" fill="#a0703f"/><rect x="392" y="244" width="976" height="284" fill="#7d5430"/>
      ${[0, 1].map(r => { let x = 400, s = ''; let i = 0; while (x < 1350) { const w = 30 + ((i * 13 + r * 7) % 4) * 6, h = 92 + ((i * 5 + r) % 3) * 12, c = ['#E8453C', '#3A7BE0', '#F7C928', '#4CB944', '#9B5DE5', '#F58A2A', '#F78FB3', '#2EB8A6'][(i + r * 3) % 8]; s += `<rect x="${x}" y="${376 + r * 142 - h - 8}" width="${w}" height="${h}" rx="4" fill="${c}"/><rect x="${x + 4}" y="${376 + r * 142 - h + 10}" width="${w - 8}" height="8" fill="#fff" opacity=".55"/><rect x="${x + 4}" y="${376 + r * 142 - 34}" width="${w - 8}" height="8" fill="#fff" opacity=".55"/>`; x += w + 4; i++; } return s + `<rect x="392" y="${376 + r * 142 - 8}" width="976" height="14" fill="#a0703f"/>`; }).join('')}
      <rect x="-200" y="790" width="1800" height="400" fill="url(#lf)"/><rect x="-200" y="780" width="1800" height="16" fill="#fff"/>
      <g transform="translate(860 890)"><ellipse rx="440" ry="80" fill="#F7C928" opacity=".85"/><ellipse rx="390" ry="62" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="18 12"/></g>
      <g transform="translate(1300 760) scale(.7)" filter="url(#depth)">${A.armchair('#2EB8A6')}</g>${fun(160, 360, 0.6, A.plant())}${vignette}`,
    park: () => `${skyRect('#62c1f2', '#dcf4ff')}${sunAt(170, 300, 0.7)}${cloud(620, 285, 0.6)}${cloud(1080, 270, 0.8)}
      <defs>${lg('p1', ['#b0e28a', '#90cf68'])}${lg('p2', ['#86d35c', '#5eb042'])}${lg('pond', ['#7fd0f5', '#4aa6dd'])}</defs>
      <path d="M-200 560 Q300 480 800 540 Q1200 480 1600 550 L1600 1200 L-200 1200Z" fill="url(#p1)"/>
      ${[[460, 560, 0.6, '#5aaa45'], [600, 540, 0.75, '#4fae3f'], [1000, 520, 0.7, '#62b84d'], [1150, 545, 0.55, '#4fae3f']].map(t => `<g transform="translate(${t[0]} ${t[1]}) scale(${t[2]})" filter="url(#depth)">${A.roundTree(t[3])}</g>`).join('')}
      <path d="M-200 650 Q400 600 800 650 Q1100 620 1600 650 L1600 1200 L-200 1200Z" fill="url(#p2)"/>
      <path d="M520 1000 Q700 850 640 760 Q620 700 760 660" fill="none" stroke="#f1dfae" stroke-width="80" stroke-linecap="round" opacity=".9"/>
      <g transform="translate(1060 900)"><ellipse rx="230" ry="56" fill="url(#pond)" stroke="#3d8fc2" stroke-width="5"/><ellipse cx="-60" cy="-14" rx="70" ry="10" fill="#fff" opacity=".45"/></g>
      <g transform="translate(1330 720) scale(.6)" filter="url(#depth)">${A.bench()}</g>${fun(1330, 900, 0.6, A.bush('#4fae3f'))}
      ${tufts([[500, 930], [880, 980, 1.2], [1250, 990], [760, 880, 0.8]], '#3f8f2c')}${vignette}`,
    garden: () => `${skyRect('#78cdf5', '#eefaff')}${sunAt(170, 300, 0.7)}${cloud(640, 290, 0.6)}${cloud(1080, 280, 0.7)}
      <defs>${lg('g1', ['#94d86a', '#6dbf4c'])}</defs>
      <g transform="translate(1290 520) scale(.95)" filter="url(#depth)">${A.roundTree('#4fae3f', 1.3)}</g>
      ${Array.from({ length: 21 }, (_, i) => `<path d="M${-180 + i * 84} 500 L${-150 + i * 84} 466 L${-120 + i * 84} 500 L${-120 + i * 84} 610 L${-180 + i * 84} 610Z" fill="#fff" stroke="#c9bfb0" stroke-width="4"/>`).join('')}
      <rect x="-200" y="520" width="1800" height="16" fill="#fff" stroke="#c9bfb0" stroke-width="4"/>
      <path d="M-200 590 L1600 590 L1600 1200 L-200 1200Z" fill="url(#g1)"/>
      <path d="M-200 600 L1600 600 L1600 640 L-200 640Z" fill="#8a5a2b" opacity=".35"/>
      ${Array.from({ length: 16 }, (_, i) => `<g transform="translate(${-120 + i * 100} ${625 + (i % 2) * 6}) scale(.45)">${A.flower(['#F78FB3', '#F7C928', '#E8453C', '#9B5DE5', '#F58A2A'][i % 5])}</g>`).join('')}
      ${[[560, 930, 0.9], [720, 960], [900, 940, 1.1], [1060, 965]].map(p => `<ellipse cx="${p[0]}" cy="${p[1]}" rx="${46 * (p[2] || 1)}" ry="${16 * (p[2] || 1)}" fill="#d8d0c0" stroke="#b5aa95" stroke-width="3"/>`).join('')}
      ${fun(1300, 900, 0.7, A.watering())}${tufts([[470, 980], [1200, 990, 1.2], [820, 880, 0.8]], '#3f8f2c')}${vignette}`,
  };

  const BG_EDGE = { house: 'linear-gradient(#fff4e8 50%, #cf9156 50%)', farm: 'linear-gradient(#5fbdf0 50%, #55a93a 50%)', market: 'linear-gradient(#fff8e4 50%, #e2c08b 50%)', library: 'linear-gradient(#f4edff 50%, #b08cdf 50%)', park: 'linear-gradient(#62c1f2 50%, #5eb042 50%)', garden: 'linear-gradient(#78cdf5 50%, #6dbf4c 50%)' };
  const LOC_COLOR = { house: '#F25F8B', farm: '#E8453C', market: '#3A9AD9', library: '#9B5DE5', park: '#F58A2A', garden: '#3fae4a' };

  /* ---------- screens ---------- */
  let sceneTok = 0, cur = null, sessionStart = Date.now(), bedtimeShown = false;
  function newScene(html, bg = '#7fd3f0') {
    document.documentElement.style.background = bg; document.body.style.background = bg;
    sceneTok++;
    Speech.stop();
    if (cur && cur.timer) clearTimeout(cur.timer);
    cur = null;
    stage.classList.remove('show'); void stage.getBoundingClientRect();
    stage.innerHTML = DEFS + html + '<g id="fx"></g>';
    stage.classList.add('show');
    return sceneTok;
  }
  const alive = tok => tok === sceneTok;

  function titleScreen() {
    const fam = ['mommy', 'daddy', 'maxi', 'nana', 'papa', 'gail', 'spera'];
    newScene(`${skyRect('#5fbdf0', '#d6f1ff')}${sunAt(1230, 300, 0.75)}${cloud(260, 300, 0.7)}${cloud(980, 250, 0.5)}
      <defs>${lg('t1', ['#a4dd78', '#7cc753'])}${lg('t2', ['#7ccd4f', '#55a93a'])}</defs>
      <path d="M-200 640 Q400 540 900 620 Q1200 580 1600 620 L1600 1200 L-200 1200Z" fill="url(#t1)"/>
      <path d="M-200 760 Q500 690 1000 760 Q1300 730 1600 760 L1600 1200 L-200 1200Z" fill="url(#t2)"/>
      ${banner(oneLine(T.world), '#F25F8B', 700, 110, 66)}
      ${guideSvg('mari', 330, 920, 1.55, false)}
      ${place(760, 560, 1, `<circle r="170" fill="#fff" fill-opacity="0.001"/>${(`<circle r="146" cy="8" fill="#2a1640" opacity=".18"/><circle r="140" fill="#4CB944"/><circle r="140" fill="none" stroke="#2f8a3a" stroke-width="7"/><circle r="118" fill="#5fcb57"/><path d="M-38 -66 L76 0 L-38 66Z" fill="#fff" stroke="#2f8a3a" stroke-width="6" stroke-linejoin="round"/>`)}`, 'data-tap="start" class="it pulse"')}
      ${pill(760, 750, langLines(T.play), { size: 36 })}
      ${fam.map((g, i) => { const x = 985 + (i % 4) * 125 + (i > 3 ? 62 : 0), y = i > 3 ? 905 : 770; return `<g transform="translate(${x} ${y}) scale(.6)"><circle r="76" fill="#fff" filter="url(#lift)"/>${A.head(GUIDES[g].look)}</g>${pill(x, y + 60, [GUIDES[g].name[settings.lang === 'pt' ? 'pt' : 'en']], { size: 19, pad: 10 })}`; }).join('')}
      ${vignette}`, 'linear-gradient(#5fbdf0 50%, #55a93a 50%)');
  }

  const MAP_SPOTS = {
    house: { x: 700, y: 500, art: 'bHouse', heads: ['mommy'], hx: 850, hy: 420 },
    farm: { x: 320, y: 290, art: 'bBarn', heads: ['nana', 'papa'], hx: 455, hy: 210 },
    market: { x: 1080, y: 290, art: 'bMarket', heads: ['daddy'], hx: 1215, hy: 210 },
    library: { x: 310, y: 710, art: 'bLibrary', heads: ['gail'], hx: 445, hy: 630 },
    park: { x: 1090, y: 710, art: 'bPark', heads: ['maxi'], hx: 1225, hy: 640 },
    garden: { x: 700, y: 820, art: 'bGarden', heads: ['spera'], hx: 840, hy: 760 },
  };
  function signLines(id) {
    const L = LOCATIONS[id];
    if (settings.lang === 'both') return [L.name.en, L.name.pt];
    const h = T.hostedBy(L.guides.map(g => GUIDES[g].name));
    return [L.name[settings.lang], h[settings.lang]];
  }

  function mapScreen(fromTitle) {
    if (timeIsUp()) return bedtimeScreen();
    const tok = newScene(`<defs>${lg('sea', ['#6fd0f2', '#3fb2e6'])}${lg('isl', ['#9adb6c', '#79c650'])}</defs>
      <rect x="-200" y="-300" width="1800" height="1600" fill="url(#sea)"/>
      ${[[90, 200], [1330, 470], [70, 560], [1340, 820], [640, 985]].map(p => `<path d="M${p[0] - 30} ${p[1]} q15 -12 30 0 q15 12 30 0" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/>`).join('')}
      <path d="M140 210 Q140 110 400 125 Q700 60 1000 125 Q1280 115 1290 250 Q1330 520 1290 820 Q1270 975 1000 958 Q700 995 400 958 Q120 958 110 800 Q80 520 140 210Z" fill="#f3e3a8" filter="url(#lift)"/>
      <path d="M170 230 Q170 145 400 155 Q700 95 1000 155 Q1250 145 1255 260 Q1290 520 1255 800 Q1240 925 1000 912 Q700 945 400 912 Q150 912 145 790 Q120 520 170 230Z" fill="url(#isl)"/>
      <path d="M320 390 Q500 470 700 540 Q900 470 1080 390 M700 540 Q500 630 310 790 M700 540 Q900 630 1090 790 M700 540 L700 800" fill="none" stroke="#f1dfae" stroke-width="38" stroke-linecap="round"/>
      ${tufts([[230, 480], [560, 380], [880, 650], [1180, 520], [460, 880], [960, 880], [600, 700, 0.8], [1200, 350, 0.8]], '#4f9e38')}
      ${[[200, 560, 0.35], [1200, 470, 0.3], [560, 300, 0.28]].map(t => `<g transform="translate(${t[0]} ${t[1]}) scale(${t[2]})" filter="url(#depth)">${A.roundTree()}</g>`).join('')}
      ${fun(70, 90, 0.45, A.sun())}
      ${banner(oneLine(T.world), '#F25F8B', 700, 52, 40)}
      ${Object.entries(MAP_SPOTS).map(([id, m]) => `
        <g transform="translate(${m.x} ${m.y})"><g class="it bldg" data-tap="loc:${id}">${hit(150)}<g filter="url(#depth)">${A[m.art]()}</g></g></g>
        ${m.heads.map((h, k) => `<g transform="translate(${m.hx} ${m.hy + k * 82}) scale(.5)"><g class="it" data-tap="loc:${id}">${hit(80)}<circle r="74" fill="#fff" stroke="${LOC_COLOR[id]}" stroke-width="8" filter="url(#lift)"/>${A.head(GUIDES[h].look)}</g></g>`).join('')}
        ${progress.stickers[id] ? `<g transform="translate(${m.x - 115} ${m.y - 105}) scale(.42)" filter="url(#depth)">${A.star('#F7C928')}</g>` : ''}
        ${pill(m.x, m.y + 122, signLines(id), { size: 25, bg: LOC_COLOR[id], fg: '#fff', sub: '#ffffffdd', attrs: `data-tap="loc:${id}"` })}`).join('')}
      ${guideSvg('mari', 540, 600, 0.55, false)}
      ${place(1320, 905, 0.85, hit(80) + item(A.stickerBook()), 'data-tap="book"')}${pill(1320, 805, langLines(T.stickers), { size: 22, pad: 14 })}
      <g transform="translate(1345 60)"><g class="gear" data-tap="gear">${A.gear()}</g></g>${pill(1345, 128, [T.grownups[settings.lang === 'pt' ? 'pt' : 'en']], { size: 15, pad: 10, bg: '#ffffffcc', fg: '#5a4f66' })}
      ${pill(700, 132, [oneLine(T.tapPlace)], { size: 24, bg: '#ffffffee' })}`, 'linear-gradient(#6fd0f2 50%, #3fb2e6 50%)');
    Speech.say(fromTitle === true ? [SHARED.welcome, SHARED.where] : SHARED.where);
    return tok;
  }

  async function stickerScreen() {
    const ids = Object.keys(LOCATIONS);
    const tok = newScene(`<defs>${lg('sb', ['#f6efff', '#e9dcff'])}</defs><rect x="-200" y="-300" width="1800" height="1600" fill="url(#sb)"/>
      <rect x="140" y="150" width="1120" height="800" rx="40" fill="#fff" filter="url(#lift)"/><rect x="160" y="170" width="1080" height="760" rx="30" fill="none" stroke="#e3d4fb" stroke-width="5" stroke-dasharray="16 12"/>
      ${banner(oneLine(T.book), '#9B5DE5', 700, 70, 44)}
      ${ids.map((id, i) => {
        const n = progress.stickers[id] || 0, x = 330 + (i % 3) * 370, y = 370 + Math.floor(i / 3) * 340, L = LOCATIONS[id];
        const art = A[L.sticker.art]();
        return `<g transform="translate(${x} ${y})"><g class="it" data-tap="stk:${id}">${hit(140)}
          <circle r="125" fill="${n ? '#fff6c9' : '#f2f0f5'}" stroke="${n ? '#F7C928' : '#d5cfdc'}" stroke-width="10" stroke-dasharray="${n ? '0' : '18 12'}"/>
          <g transform="scale(.9)" ${n ? 'filter="url(#depth)"' : 'opacity=".18" filter="url(#gray)"'}>${art}</g>
          ${n > 1 ? `<circle cx="92" cy="-92" r="34" fill="#F25F8B" stroke="#fff" stroke-width="5"/><text x="92" y="-80" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" ${FONT}>×${n}</text>` : ''}
        </g></g>${pill(x, y + 158, n ? langLines(L.name) : [oneLine(T.notYet)], { size: 24, bg: n ? LOC_COLOR[id] : '#ece8f1', fg: n ? '#fff' : '#8a8096', sub: '#ffffffdd' })}`;
      }).join('')}
      ${homeBtn()}`, 'linear-gradient(#f6efff 50%, #e9dcff 50%)');
    Speech.say(SHARED.stickers);
    return tok;
  }

  function timeIsUp() { return settings.limit > 0 && Date.now() - sessionStart > settings.limit * 60000; }
  function bedtimeScreen() {
    bedtimeShown = true;
    newScene(`<defs>${lg('night', ['#141c46', '#2d3b7a'])}</defs><rect x="-200" y="-300" width="1800" height="1600" fill="url(#night)"/>
      ${Array.from({ length: 34 }, () => `<circle cx="${rnd(1400)}" cy="${rnd(600)}" r="${2 + rnd(4)}" fill="#fff" opacity="${0.5 + Math.random() * 0.5}"/>`).join('')}
      <g transform="translate(1050 250)"><circle r="160" fill="#ffe9a8" opacity=".15"/><circle r="110" fill="#ffe9a8"/><circle cx="50" cy="-30" r="100" fill="#1d2758"/></g>
      <path d="M-200 760 Q700 680 1600 760 L1600 1200 L-200 1200Z" fill="#2f6b3a"/>
      ${banner(oneLine(T.rest), '#5a4fcf', 700, 90, 48)}
      <g transform="translate(700 900) scale(1.3)"><g class="it" filter="url(#depth)">${A.person(GUIDES.mari.look)}</g></g>
      <g transform="translate(1345 60)"><g class="gear" data-tap="gear">${A.gear()}</g></g>`, 'linear-gradient(#141c46 50%, #2f6b3a 50%)');
    Speech.say(SHARED.bedtime);
  }

  /* ---------- question building ---------- */
  function levelOf(id) { return Math.min(4, Math.max(2, progress.level[id] || 2)); }
  const colorList = ids => ids.map(c => COLORS[c]);
  const choice = (art, name, correct, extra = {}) => Object.assign({ art, name, correct }, extra);

  function slotPositions(n) {
    if (n === 2) return [[720, 600], [1110, 600]];
    if (n === 3) return [[600, 610], [900, 610], [1200, 610]];
    return [[720, 420], [1120, 420], [720, 735], [1120, 735]];
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
    const gHtml = guides.length === 1 ? guideSvg(guides[0], 220, 965, 1.4) : guideSvg(guides[0], 150, 960, 1.2) + guideSvg(guides[1], 330, 985, 1.25);
    const tok = newScene(`${BACKGROUNDS[id]()}${gHtml}<g id="choices"></g><g id="labels"></g>${homeBtn()}${banner(oneLine(L.name), LOC_COLOR[id], 690, 58, 38, 700)}<g id="prog" transform="translate(1150 60)"></g><g id="qcard"></g>`, BG_EDGE[id]);
    cur = { id, L, tok, qs: ROUNDS[id](levelOf(id)), i: 0, streak: progress['streak_' + id] || 0 };
    const c = cur;
    setProgress(0, c.qs.length);
    for (const line of [...L.greet, ...L.setup]) {
      setCard(line);
      if (!(await Speech.say(line, guides[0])) || !alive(tok)) return;
    }
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
      layer.innerHTML = pos.map((p, k) => `<g transform="translate(${p[0]} ${p[1]}) scale(.95)"><g class="it choice pop-in" data-tap="cnt${k}" style="animation-delay:${k * 0.08}s">${hit(110)}<circle class="glowc" r="112" fill="#fff59d"/>${item(A[q.item.id]())}<g class="badge"></g></g></g>`).join('');
      stage.querySelector('#labels').innerHTML = '';
    } else {
      const pos = slotPositions(q.choices.length), s = q.choices.length === 4 ? 1.05 : 1.2;
      layer.innerHTML = q.choices.map((ch, k) => `<g transform="translate(${pos[k][0]} ${pos[k][1]}) scale(${s * (ch.scale || 1)})"><g class="it choice pop-in" data-tap="c${k}" style="animation-delay:${k * 0.08}s">${hit(118)}<circle class="glowc" r="120" fill="#fff59d"/>${item(ch.art)}</g></g>`).join('');
      stage.querySelector('#labels').innerHTML = q.choices.map((ch, k) => ch.name ? pill(pos[k][0], pos[k][1] + 118 * s * (ch.scale || 1) + 26, langLines(ch.name), { size: q.choices.length === 4 ? 24 : 27, pad: 16, attrs: `data-tap="c${k}"` }) : '').join('');
    }
    setCard(q.prompt);
    SFX.whoosh();
    if (q.intro) { setCard(q.intro); if (!(await Speech.say(q.intro, speakerFor(c))) || !alive(c.tok)) return; setCard(q.prompt); }
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
      setProgress(c.i + 1, c.qs.length);
      const lines = [], pr = pick(GENERIC.praise);
      toast(pr);
      if (ch.says) lines.push(ch.says);
      lines.push(pr);
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
        lines.push(GENERIC.here); toast(GENERIC.here, '#3A7BE0');
      } else {
        lines.push(GENERIC.tryAgain, q.prompt); toast(GENERIC.tryAgain, '#F58A2A');
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
      setProgress(c.i + 1, c.qs.length);
      const done = c.L.prompts.alongDone(q.item, q.n);
      toast(done); setCard(done);
      await Speech.say([SHARED.count[q.count - 1], done, pick(GENERIC.praise)], speakerFor(c));
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
      <circle r="190" fill="#fff6c9" stroke="#F7C928" stroke-width="14" filter="url(#lift)"/>${item(A[L.sticker.art]())}</g></g>${pill(900, 800, langLines(T.earned), { size: 40, bg: '#F7C928', fg: '#5a3d00', sub: '#7a5a10' })}`;
    stage.querySelector('#labels').innerHTML = '';
    setCard(L.end[0]); setProgress(c.qs.length, c.qs.length);
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
  let lastTap = 0, lastKey = '';
  /* size the game to the real visible screen (iPad home-screen apps can report 100vh wrongly) */
  function fit() { stage.style.width = window.innerWidth + 'px'; stage.style.height = window.innerHeight + 'px'; }
  fit(); window.addEventListener('resize', fit); window.addEventListener('orientationchange', () => setTimeout(fit, 300));
  stage.addEventListener('pointerdown', e => {
    if (!e.isPrimary) return;
    e.preventDefault();
    audioInit();
    const t = e.target.closest('[data-tap]');
    if (!t) { const p = svgPoint(e); burst(p.x, p.y, 8, false); SFX.sparkle(); return; }
    const key = t.dataset.tap;
    if (key === 'gear') return startHold(t);
    const now = Date.now(); if (key === lastKey && now - lastTap < 250) return; lastTap = now; lastKey = key;
    handleTap(key, t);
  });
  window.addEventListener('pointerup', endHold);
  window.addEventListener('pointercancel', endHold);
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());

  async function handleTap(key, el) {
    if (key === 'start') {
      Speech.unlock(); SFX.yay();
      mapScreen(true);
      return;
    }
    if (key.startsWith('loc:')) {
      const id = key.slice(4);
      const tok = sceneTok;
      SFX.whoosh();
      const p = centerOf(el); burst(p.x, p.y, 14, false);
      stage.querySelectorAll(`.it[data-tap="loc:${id}"]`).forEach(x => restart(x, 'yay'));
      setTimeout(() => { if (alive(tok)) playLocation(id); }, 280);
      return;
    }
    if (key === 'home') { SFX.pop(); return mapScreen(); }
    if (key === 'repeat') {
      restart(el, 'yay'); SFX.pop();
      if (cur && cur.q && !cur.locked) { stage.querySelectorAll('#choices .choice').forEach(x => restart(x, 'wiggle')); Speech.say(cur.q.prompt, speakerFor(cur)); scheduleReprompt(cur, cur.q); }
      return;
    }
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
