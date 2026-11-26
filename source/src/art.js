/* Mari's World: original cartoon art, drawn as SVG.
   Every item is centred on 0,0 and fits roughly inside a 200 x 200 box. */
(function (G) {
  const INK = '#2d2a32';
  const S = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
  const eyes = (dx, y, r = 9) =>
    `<circle cx="${-dx}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${dx}" cy="${y}" r="${r}" fill="${INK}"/>` +
    `<circle cx="${-dx + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff"/><circle cx="${dx + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff"/>`;
  const whiteEyes = (dx, y) =>
    `<circle cx="${-dx}" cy="${y}" r="13" fill="#fff"/><circle cx="${dx}" cy="${y}" r="13" fill="#fff"/>` + eyes(dx, y + 1, 7);
  const smile = (y, w, col = INK) => `<path d="M${-w} ${y} Q0 ${y + w * 0.9} ${w} ${y}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
  const cheeks = (dx, y) => `<ellipse cx="${-dx}" cy="${y}" rx="11" ry="7" fill="#ff8fa3" opacity=".55"/><ellipse cx="${dx}" cy="${y}" rx="11" ry="7" fill="#ff8fa3" opacity=".55"/>`;
  const darken = (hex, f = 0.75) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  };

  const A = {};

  /* ---------- farm animals ---------- */
  A.cow = () => `
    <path d="M-48 -62 Q-70 -92 -52 -104" fill="none" stroke="#e9d9ae" stroke-width="13" stroke-linecap="round"/>
    <path d="M48 -62 Q70 -92 52 -104" fill="none" stroke="#e9d9ae" stroke-width="13" stroke-linecap="round"/>
    <ellipse cx="-78" cy="-38" rx="30" ry="15" transform="rotate(-25 -78 -38)" fill="#fff" ${S}/>
    <ellipse cx="78" cy="-38" rx="30" ry="15" transform="rotate(25 78 -38)" fill="#fff" ${S}/>
    <ellipse cx="0" cy="-8" rx="64" ry="72" fill="#fff" ${S}/>
    <path d="M-40 -62 Q-10 -70 -18 -40 Q-30 -20 -50 -30 Q-62 -50 -40 -62Z" fill="${INK}"/>
    <path d="M30 -10 Q55 -15 58 5 Q50 20 35 12Z" fill="${INK}"/>
    ${eyes(24, -22)}
    <ellipse cx="0" cy="38" rx="50" ry="32" fill="#f6b8c4" ${S}/>
    <ellipse cx="-18" cy="36" rx="7" ry="10" fill="#c97a8a"/><ellipse cx="18" cy="36" rx="7" ry="10" fill="#c97a8a"/>`;
  A.pig = () => `
    <path d="M-60 -50 L-72 -98 L-25 -68Z" fill="#f7a8c0" ${S}/><path d="M60 -50 L72 -98 L25 -68Z" fill="#f7a8c0" ${S}/>
    <circle cx="0" cy="0" r="76" fill="#f7a8c0" ${S}/>
    ${eyes(28, -18)}${cheeks(50, 12)}
    <ellipse cx="0" cy="24" rx="34" ry="25" fill="#f283a8" ${S}/>
    <ellipse cx="-12" cy="24" rx="6" ry="10" fill="#b8506f"/><ellipse cx="12" cy="24" rx="6" ry="10" fill="#b8506f"/>
    ${smile(58, 16)}`;
  A.sheep = () => {
    let wool = '';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      wool += `<circle cx="${(Math.cos(a) * 66).toFixed(1)}" cy="${(Math.sin(a) * 62).toFixed(1)}" r="32" fill="#fff" ${S}/>`;
    }
    return `${wool}<circle cx="0" cy="0" r="66" fill="#fff"/>
      <ellipse cx="-50" cy="-5" rx="22" ry="11" fill="#4a3f45" transform="rotate(-20 -50 -5)"/>
      <ellipse cx="50" cy="-5" rx="22" ry="11" fill="#4a3f45" transform="rotate(20 50 -5)"/>
      <ellipse cx="0" cy="12" rx="40" ry="50" fill="#4a3f45" ${S}/>
      <circle cx="-14" cy="-38" r="14" fill="#fff"/><circle cx="10" cy="-42" r="15" fill="#fff"/>
      ${whiteEyes(15, 5)}${smile(38, 12, '#fff')}`;
  };
  A.chick = () => `
    <path d="M-25 70 L-25 92 M-35 92 L-15 92 M25 70 L25 92 M15 92 L35 92" stroke="#f58a2a" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="-70" cy="15" rx="22" ry="34" fill="#ffd93b" transform="rotate(25 -70 15)" ${S}/>
    <ellipse cx="70" cy="15" rx="22" ry="34" fill="#ffd93b" transform="rotate(-25 70 15)" ${S}/>
    <circle cx="0" cy="0" r="72" fill="#ffe14d" ${S}/>
    <path d="M-8 -70 Q-5 -95 8 -88 M2 -72 Q10 -98 22 -84" fill="none" stroke="#f2b705" stroke-width="7" stroke-linecap="round"/>
    ${eyes(24, -14)}${cheeks(44, 12)}
    <path d="M-16 8 L16 8 L0 30Z" fill="#f58a2a" ${S}/>`;
  A.horse = () => `
    <path d="M-34 -78 L-44 -112 L-14 -88Z" fill="#b07445" ${S}/><path d="M34 -78 L44 -112 L14 -88Z" fill="#b07445" ${S}/>
    <ellipse cx="0" cy="-5" rx="54" ry="84" fill="#b07445" ${S}/>
    <path d="M-30 -84 Q0 -110 30 -84 Q20 -60 0 -58 Q-20 -60 -30 -84Z" fill="#5a3a22"/>
    <path d="M-8 -60 L-2 -40 L4 -60" fill="#fff"/>
    ${eyes(24, -18)}
    <ellipse cx="0" cy="48" rx="44" ry="32" fill="#e0b088" ${S}/>
    <ellipse cx="-16" cy="44" rx="6" ry="9" fill="#7a4b2c"/><ellipse cx="16" cy="44" rx="6" ry="9" fill="#7a4b2c"/>
    ${smile(62, 14)}`;
  A.duck = () => `
    <ellipse cx="18" cy="38" rx="78" ry="46" fill="#fff" ${S}/>
    <path d="M40 20 Q75 30 60 60 Q35 55 30 30Z" fill="#eef4f7" ${S}/>
    <circle cx="-30" cy="-34" r="44" fill="#fff" ${S}/>
    <ellipse cx="-78" cy="-24" rx="30" ry="13" fill="#f58a2a" ${S}/>
    <circle cx="-38" cy="-46" r="9" fill="${INK}"/><circle cx="-35" cy="-49" r="3" fill="#fff"/>
    <ellipse cx="-18" cy="-22" rx="10" ry="6" fill="#ff8fa3" opacity=".55"/>
    <path d="M-20 -78 Q-14 -98 -2 -86" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  A.dog = () => `
    <ellipse cx="-66" cy="0" rx="24" ry="48" fill="#8a5a2b" transform="rotate(18 -66 0)" ${S}/>
    <ellipse cx="66" cy="0" rx="24" ry="48" fill="#8a5a2b" transform="rotate(-18 66 0)" ${S}/>
    <circle cx="0" cy="-6" r="68" fill="#d9a066" ${S}/>
    <ellipse cx="26" cy="-30" rx="20" ry="18" fill="#f3d9b5"/>
    ${eyes(24, -24)}
    <ellipse cx="0" cy="28" rx="38" ry="28" fill="#f3d9b5" ${S}/>
    <ellipse cx="0" cy="12" rx="14" ry="10" fill="${INK}"/>
    <path d="M-14 34 Q0 44 14 34" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M-7 40 Q0 64 7 40Z" fill="#f2607a" ${S}/>`;
  A.cat = () => `
    <path d="M-62 -30 L-58 -94 L-18 -62Z" fill="#9aa0a8" ${S}/><path d="M62 -30 L58 -94 L18 -62Z" fill="#9aa0a8" ${S}/>
    <path d="M-52 -46 L-52 -78 L-30 -60Z" fill="#f7a8c0"/><path d="M52 -46 L52 -78 L30 -60Z" fill="#f7a8c0"/>
    <ellipse cx="0" cy="0" rx="74" ry="64" fill="#9aa0a8" ${S}/>
    <path d="M-20 -62 L-14 -40 M0 -64 L0 -40 M20 -62 L14 -40" stroke="#6e737a" stroke-width="6" stroke-linecap="round"/>
    ${eyes(28, -10, 10)}${cheeks(46, 16)}
    <path d="M-9 10 L9 10 L0 20Z" fill="#f283a8"/>
    <path d="M0 20 Q-10 32 -20 26 M0 20 Q10 32 20 26" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M-30 16 L-80 6 M-30 24 L-80 30 M30 16 L80 6 M30 24 L80 30" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;

  /* ---------- fruit ---------- */
  A.apple = (c = '#E8453C') => `
    <path d="M0 -50 C-40 -82 -92 -44 -82 8 C-74 66 -32 88 0 72 C32 88 74 66 82 8 C92 -44 40 -82 0 -50Z" fill="${c}" ${S}/>
    <path d="M0 -50 Q4 -76 14 -88" fill="none" stroke="#6b4226" stroke-width="8" stroke-linecap="round"/>
    <path d="M10 -70 Q40 -100 62 -78 Q40 -56 10 -70Z" fill="#4CB944" ${S}/>
    <ellipse cx="-44" cy="-14" rx="12" ry="22" fill="#fff" opacity=".45" transform="rotate(20 -44 -14)"/>`;
  A.banana = () => `
    <path d="M-84 -44 Q-70 70 72 42 Q90 34 82 22 Q-12 40 -54 -54 Q-70 -62 -84 -44Z" fill="#F7D530" ${S}/>
    <path d="M-62 -38 Q-28 30 60 30" fill="none" stroke="#e0b81e" stroke-width="5" stroke-linecap="round"/>
    <path d="M-84 -44 L-80 -62 L-62 -58Z" fill="#6b4226" ${S}/>`;
  A.orange = () => `
    <circle cx="0" cy="8" r="74" fill="#F58A2A" ${S}/>
    <circle cx="-25" cy="-10" r="3" fill="#d96f12"/><circle cx="20" cy="20" r="3" fill="#d96f12"/><circle cx="30" cy="-20" r="3" fill="#d96f12"/><circle cx="-10" cy="40" r="3" fill="#d96f12"/>
    <path d="M0 -64 Q30 -96 54 -70 Q30 -50 0 -64Z" fill="#4CB944" ${S}/>
    <ellipse cx="-38" cy="-20" rx="11" ry="20" fill="#fff" opacity=".4" transform="rotate(25 -38 -20)"/>`;
  A.strawberry = () => `
    <path d="M0 88 C-40 70 -80 20 -74 -24 C-70 -54 -30 -60 0 -48 C30 -60 70 -54 74 -24 C80 20 40 70 0 88Z" fill="#E8453C" ${S}/>
    ${[[-40, -20], [-10, -10], [25, -25], [45, 5], [-35, 20], [0, 20], [25, 35], [-10, 50], [10, 65]].map(p => `<ellipse cx="${p[0]}" cy="${p[1]}" rx="4" ry="6" fill="#ffe14d"/>`).join('')}
    <path d="M-40 -50 L-20 -46 L-30 -74 L0 -52 L30 -74 L20 -46 L40 -50 L0 -36Z" fill="#4CB944" ${S}/>`;
  A.pear = () => `
    <path d="M0 -60 C-30 -60 -30 -20 -44 6 C-70 40 -50 88 0 88 C50 88 70 40 44 6 C30 -20 30 -60 0 -60Z" fill="#C9D84A" ${S}/>
    <path d="M0 -60 Q2 -82 12 -92" fill="none" stroke="#6b4226" stroke-width="8" stroke-linecap="round"/>
    <path d="M8 -78 Q36 -102 54 -82 Q34 -64 8 -78Z" fill="#4CB944" ${S}/>
    <ellipse cx="-24" cy="30" rx="10" ry="20" fill="#fff" opacity=".4"/>`;
  A.watermelon = () => `
    <path d="M-90 -30 A90 90 0 0 0 90 -30Z" fill="#4CB944" ${S}/>
    <path d="M-76 -30 A76 76 0 0 0 76 -30Z" fill="#c8f2a6"/>
    <path d="M-68 -30 A68 68 0 0 0 68 -30Z" fill="#F2545B"/>
    ${[[-40, -10], [-10, 5], [20, -8], [45, -14], [5, 25], [-25, 18], [30, 15]].map(p => `<ellipse cx="${p[0]}" cy="${p[1]}" rx="4" ry="7" fill="${INK}"/>`).join('')}
    <path d="M-90 -30 L90 -30" stroke="${INK}" stroke-width="5"/>`;

  /* ---------- house things ---------- */
  A.hairbrush = (c = '#F78FB3') => `
    <g transform="rotate(-30)">
      <rect x="-14" y="10" width="28" height="92" rx="14" fill="${c}" ${S}/>
      <ellipse cx="0" cy="-40" rx="52" ry="62" fill="${c}" ${S}/>
      <ellipse cx="0" cy="-40" rx="38" ry="48" fill="#fff" opacity=".85"/>
      ${[-24, -8, 8, 24].map(x => [-70, -54, -38, -22, -8].map(y => (Math.abs(x) > 16 && (y < -64 || y > -14)) ? '' : `<circle cx="${x}" cy="${y}" r="4" fill="${darken(c)}"/>`).join('')).join('')}
    </g>`;
  A.cup = (c = '#3A7BE0') => `
    <path d="M52 -30 Q98 -30 92 10 Q86 46 46 42" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
    <path d="M52 -30 Q98 -30 92 10 Q86 46 46 42" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>
    <path d="M-62 -70 L62 -70 L48 78 Q0 92 -48 78Z" fill="${c}" ${S}/>
    <ellipse cx="0" cy="-70" rx="62" ry="14" fill="${darken(c, 0.8)}" ${S}/>
    <rect x="-40" y="-40" width="14" height="80" rx="7" fill="#fff" opacity=".4"/>`;
  A.sock = (c = '#4CB944') => `
    <path d="M-40 -90 L30 -90 L30 20 Q30 40 50 50 L70 58 Q96 70 84 92 Q74 106 40 96 L-20 72 Q-48 60 -44 30Z" fill="${c}" ${S}/>
    <rect x="-42" y="-92" width="74" height="28" rx="6" fill="#fff" ${S}/>
    <path d="M-42 -30 L30 -30 M-43 0 L30 0" stroke="#fff" stroke-width="10" opacity=".85"/>
    <path d="M60 58 Q90 64 84 92 Q70 104 46 96Z" fill="#fff" opacity=".85"/>`;
  A.ball = (c = '#E8453C') => `
    <circle cx="0" cy="0" r="80" fill="${c}" ${S}/>
    <path d="M-78 -12 Q0 30 78 -12" fill="none" stroke="#fff" stroke-width="16"/>
    <path d="M-20 -78 Q20 0 -20 78" fill="none" stroke="#fff" stroke-width="12" opacity=".8"/>
    <circle cx="0" cy="0" r="80" fill="none" ${S}/>
    <ellipse cx="-36" cy="-40" rx="14" ry="22" fill="#fff" opacity=".45" transform="rotate(35 -36 -40)"/>`;
  A.shoe = (c = '#9B5DE5') => `
    <path d="M-88 30 L-84 -40 Q-80 -56 -60 -56 L-20 -56 Q-10 -20 30 -8 L70 4 Q96 12 94 40 L94 50 L-88 50Z" fill="${c}" ${S}/>
    <path d="M-90 40 L96 40 L96 56 Q96 70 80 70 L-76 70 Q-92 70 -90 56Z" fill="#fff" ${S}/>
    <path d="M-30 -40 L-6 -30 M-24 -24 L0 -14 M-14 -8 L10 2" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    <circle cx="-60" cy="-10" r="12" fill="#fff" opacity=".6"/>`;
  A.hat = (c = '#F7C928') => `
    <ellipse cx="0" cy="40" rx="100" ry="30" fill="${c}" ${S}/>
    <path d="M-60 40 Q-62 -60 0 -62 Q62 -60 60 40Z" fill="${c}" ${S}/>
    <path d="M-60 16 Q0 34 60 16 L60 36 Q0 54 -60 36Z" fill="#E8453C" ${S}/>
    <circle cx="30" cy="-20" r="12" fill="#fff" opacity=".5"/>`;
  A.teddy = () => `
    <circle cx="-52" cy="-60" r="24" fill="#b07445" ${S}/><circle cx="52" cy="-60" r="24" fill="#b07445" ${S}/>
    <circle cx="-52" cy="-60" r="11" fill="#e0b088"/><circle cx="52" cy="-60" r="11" fill="#e0b088"/>
    <ellipse cx="0" cy="58" rx="56" ry="42" fill="#b07445" ${S}/>
    <ellipse cx="0" cy="62" rx="30" ry="24" fill="#e0b088"/>
    <circle cx="-56" cy="40" r="20" fill="#b07445" ${S}/><circle cx="56" cy="40" r="20" fill="#b07445" ${S}/>
    <circle cx="0" cy="-26" r="58" fill="#b07445" ${S}/>
    ${eyes(22, -36)}
    <ellipse cx="0" cy="-6" rx="24" ry="18" fill="#e0b088"/>
    <ellipse cx="0" cy="-14" rx="9" ry="7" fill="${INK}"/>
    ${smile(-2, 10)}
    <path d="M-20 18 L0 30 L20 18 L20 34 L0 26 L-20 34Z" fill="#E8453C" ${S}/>`;
  A.spoon = () => `
    <g transform="rotate(30)">
      <rect x="-11" y="-6" width="22" height="104" rx="11" fill="#c9d1d9" ${S}/>
      <ellipse cx="0" cy="-48" rx="40" ry="54" fill="#dfe5ea" ${S}/>
      <ellipse cx="-12" cy="-56" rx="10" ry="24" fill="#fff" opacity=".8"/>
    </g>`;
  A.toothbrush = (c = '#2EB8A6') => `
    <g transform="rotate(-35)">
      <rect x="-14" y="-40" width="28" height="140" rx="14" fill="${c}" ${S}/>
      <rect x="-14" y="-96" width="28" height="60" rx="8" fill="${c}" ${S}/>
      <rect x="-50" y="-94" width="36" height="54" rx="6" fill="#fff" ${S}/>
      <path d="M-44 -86 L-20 -86 M-44 -74 L-20 -74 M-44 -62 L-20 -62 M-44 -50 L-20 -50" stroke="#7fc8f8" stroke-width="5"/>
    </g>`;
  A.book = (c = '#3A7BE0') => `
    <path d="M-80 -70 L80 -70 L80 80 L-80 80Z" fill="#fff" ${S}/>
    <rect x="-86" y="-82" width="160" height="152" rx="10" fill="${c}" ${S}/>
    <rect x="-70" y="-82" width="16" height="152" fill="${darken(c)}"/>
    <rect x="-40" y="-50" width="94" height="40" rx="8" fill="#fff" opacity=".9"/>
    <path d="M-10 20 L4 34 L22 4" fill="none" stroke="#fff" stroke-width="0"/>
    <path d="M10 6 l8 16 18 2 -13 12 4 18 -17 -9 -17 9 4 -18 -13 -12 18 -2z" fill="#F7C928" ${S}/>`;

  /* ---------- park ---------- */
  A.balloon = (c = '#E8453C') => `
    <path d="M0 70 Q-18 96 6 118 Q22 140 0 160" fill="none" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="0" cy="-10" rx="66" ry="78" fill="${c}" ${S}/>
    <path d="M-10 66 L10 66 L6 76 L-6 76Z" fill="${c}" ${S}/>
    <ellipse cx="-26" cy="-40" rx="12" ry="24" fill="#fff" opacity=".5" transform="rotate(25 -26 -40)"/>`;

  /* ---------- garden ---------- */
  const shapeFace = (y = 0) => `${eyes(18, y - 6, 8)}${smile(y + 14, 12)}`;
  A.circle = (c = '#3A7BE0') => `<circle r="80" fill="${c}" ${S}/>${shapeFace()}`;
  A.square = (c = '#E8453C') => `<rect x="-76" y="-76" width="152" height="152" rx="14" fill="${c}" ${S}/>${shapeFace()}`;
  A.triangle = (c = '#4CB944') => `<path d="M0 -88 L92 74 L-92 74Z" fill="${c}" ${S}/>${shapeFace(24)}`;
  A.star = (c = '#F7C928') => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 40 : 92, a = -Math.PI / 2 + (i * Math.PI) / 5;
      d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r + 8).toFixed(1);
    }
    return `<path d="${d}Z" fill="${c}" ${S}/>${shapeFace(10)}`;
  };
  A.heart = (c = '#F78FB3') => `<path d="M0 84 C-40 56 -94 20 -90 -30 C-86 -70 -36 -82 0 -44 C36 -82 86 -70 90 -30 C94 20 40 56 0 84Z" fill="${c}" ${S}/>${shapeFace(-4)}`;
  A.butterfly = () => `
    <ellipse cx="-46" cy="-30" rx="44" ry="50" fill="#9B5DE5" ${S} transform="rotate(-20 -46 -30)"/>
    <ellipse cx="46" cy="-30" rx="44" ry="50" fill="#9B5DE5" ${S} transform="rotate(20 46 -30)"/>
    <ellipse cx="-38" cy="40" rx="32" ry="36" fill="#F78FB3" ${S}/>
    <ellipse cx="38" cy="40" rx="32" ry="36" fill="#F78FB3" ${S}/>
    <circle cx="-50" cy="-34" r="14" fill="#F7C928"/><circle cx="50" cy="-34" r="14" fill="#F7C928"/>
    <ellipse cx="0" cy="10" rx="14" ry="66" fill="${INK}"/>
    <path d="M-4 -52 Q-20 -86 -34 -88 M4 -52 Q20 -86 34 -88" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-34" cy="-88" r="6" fill="${INK}"/><circle cx="34" cy="-88" r="6" fill="${INK}"/>`;
  A.ladybug = () => `
    <circle cx="0" cy="-60" r="34" fill="${INK}"/>
    <circle cx="-13" cy="-66" r="8" fill="#fff"/><circle cx="13" cy="-66" r="8" fill="#fff"/>
    <circle cx="-13" cy="-66" r="4" fill="${INK}"/><circle cx="13" cy="-66" r="4" fill="${INK}"/>
    <circle cx="0" cy="12" r="78" fill="#E8453C" ${S}/>
    <path d="M0 -66 L0 90" stroke="${INK}" stroke-width="5"/>
    <circle cx="-38" cy="-12" r="14" fill="${INK}"/><circle cx="38" cy="-12" r="14" fill="${INK}"/>
    <circle cx="-44" cy="36" r="12" fill="${INK}"/><circle cx="44" cy="36" r="12" fill="${INK}"/>
    <circle cx="-18" cy="66" r="10" fill="${INK}"/><circle cx="18" cy="66" r="10" fill="${INK}"/>`;
  A.bee = () => `
    <ellipse cx="-22" cy="-56" rx="30" ry="40" fill="#e7f6ff" ${S} opacity=".9" transform="rotate(-25 -22 -56)"/>
    <ellipse cx="26" cy="-56" rx="30" ry="40" fill="#e7f6ff" ${S} opacity=".9" transform="rotate(25 26 -56)"/>
    <ellipse cx="0" cy="10" rx="86" ry="60" fill="#F7D530" ${S}/>
    <path d="M-30 -46 Q-40 10 -30 66 L-6 70 Q-16 10 -6 -50Z M18 -50 Q8 10 18 70 L40 64 Q30 10 40 -44Z" fill="${INK}"/>
    <path d="M86 10 L104 10" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="-56" cy="-2" r="9" fill="${INK}"/><circle cx="-53" cy="-5" r="3" fill="#fff"/>
    <path d="M-70 16 Q-62 28 -52 18" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  A.snail = () => `
    <path d="M-96 70 Q-100 30 -70 26 L60 26 Q96 30 96 70Z" fill="#9fd36a" ${S}/>
    <path d="M-80 30 L-90 -14 M-62 28 L-64 -18" stroke="#9fd36a" stroke-width="9" stroke-linecap="round"/>
    <circle cx="-90" cy="-18" r="9" fill="${INK}"/><circle cx="-64" cy="-22" r="9" fill="${INK}"/>
    <circle cx="20" cy="-10" r="70" fill="#F58A2A" ${S}/>
    <path d="M20 -10 m0 -10 a10 10 0 1 1 -10 14 a26 26 0 1 1 30 22 a44 44 0 1 1 -54 -40" fill="none" stroke="#b8571a" stroke-width="7" stroke-linecap="round"/>
    <path d="M-86 44 Q-76 56 -66 46" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;

  /* ---------- letters, baskets, misc ---------- */
  A.letter = (L, c = '#3A7BE0') => `
    <rect x="-80" y="-88" width="160" height="176" rx="22" fill="${c}" ${S}/>
    <rect x="-66" y="-74" width="132" height="148" rx="14" fill="#fff" opacity=".22"/>
    <text x="0" y="8" text-anchor="middle" dominant-baseline="middle" font-size="140" font-weight="900" fill="#fff" stroke="${INK}" stroke-width="5" paint-order="stroke" font-family="ui-rounded, 'Arial Rounded MT Bold', 'Chalkboard SE', 'Comic Sans MS', sans-serif">${L}</text>`;
  A.letterM = () => A.letter('M', '#9B5DE5');
  A.basket = (fruit, n) => {
    const rows = n <= 3 ? [n] : [3, n - 3];
    const pos = [];
    rows.forEach((k, r) => { for (let i = 0; i < k; i++) pos.push([(i - (k - 1) / 2) * 66, -48 - r * 62]); });
    const f = pos.map(p => `<g transform="translate(${p[0]} ${p[1]}) scale(.33)">${A[fruit]()}</g>`).join('');
    return `${f}
      <path d="M-96 -16 L96 -16 L76 84 Q0 98 -76 84Z" fill="#d99a4e" ${S}/>
      <path d="M-86 16 L86 16 M-80 48 L80 48 M-40 -16 L-34 90 M0 -16 L0 94 M40 -16 L34 90" stroke="#b5762f" stroke-width="5"/>
      <rect x="-104" y="-26" width="208" height="22" rx="10" fill="#e8b36a" ${S}/>`;
  };
  A.sun = () => {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays += `<path d="M${(Math.cos(a) * 70).toFixed(1)} ${(Math.sin(a) * 70).toFixed(1)} L${(Math.cos(a) * 98).toFixed(1)} ${(Math.sin(a) * 98).toFixed(1)}" stroke="#F7C928" stroke-width="12" stroke-linecap="round"/>`;
    }
    return `${rays}<circle r="60" fill="#FFD93B" stroke="#f2b705" stroke-width="5"/>${eyes(20, -8, 7)}${cheeks(34, 14)}${smile(14, 16)}`;
  };
  A.cloud = () => `<path d="M-90 30 Q-110 -10 -70 -20 Q-60 -60 -16 -50 Q10 -80 50 -56 Q90 -60 92 -20 Q120 -4 100 30Z" fill="#fff" stroke="#d5e9f5" stroke-width="5"/>`;
  A.flower = (c = '#F78FB3') => {
    let p = '';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      p += `<circle cx="${(Math.cos(a) * 26).toFixed(1)}" cy="${(Math.sin(a) * 26 - 60).toFixed(1)}" r="20" fill="${c}" stroke="${darken(c)}" stroke-width="3"/>`;
    }
    return `<path d="M0 -40 Q-6 20 0 70" stroke="#3a9a3a" stroke-width="8" fill="none"/><ellipse cx="-18" cy="20" rx="18" ry="8" fill="#4CB944" transform="rotate(-30 -18 20)"/>${p}<circle cx="0" cy="-60" r="16" fill="#F7C928"/>`;
  };
  A.tree = () => `
    <rect x="-24" y="0" width="48" height="120" rx="10" fill="#8a5a2b" ${S}/>
    <circle cx="0" cy="-40" r="90" fill="#4CB944" ${S}/><circle cx="-60" cy="0" r="56" fill="#4CB944" ${S}/><circle cx="60" cy="0" r="56" fill="#4CB944" ${S}/>
    <circle cx="0" cy="-20" r="80" fill="#4CB944"/><circle cx="-30" cy="-60" r="14" fill="#E8453C"/><circle cx="40" cy="-30" r="14" fill="#E8453C"/><circle cx="-10" cy="10" r="14" fill="#E8453C"/>`;
  A.home = () => `
    <circle r="56" fill="#fff" stroke="${INK}" stroke-width="6"/>
    <path d="M-32 0 L0 -30 L32 0 L32 30 L-32 30Z" fill="#F25F8B" ${S}/>
    <rect x="-9" y="8" width="18" height="22" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <path d="M-42 4 L0 -40 L42 4" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
  A.stickerBook = () => `
    <rect x="-60" y="-64" width="120" height="128" rx="14" fill="#9B5DE5" ${S}/>
    <rect x="-46" y="-64" width="10" height="128" fill="#7a3fc4"/>
    <g transform="translate(8 0) scale(.45)">${A.star('#F7C928')}</g>`;
  A.gear = () => `
    <circle r="40" fill="#fff" fill-opacity=".7" stroke="#8899aa" stroke-width="4"/>
    <circle class="ring" r="46" fill="none" stroke="#F25F8B" stroke-width="8" stroke-dasharray="290" stroke-dashoffset="290" transform="rotate(-90)"/>
    <path d="M0 -26 L6 -18 L16 -20 L18 -10 L26 -6 L22 4 L26 12 L18 18 L16 26 L6 24 L0 30 L-6 24 L-16 26 L-18 18 L-26 12 L-22 4 L-26 -6 L-18 -10 L-16 -20 L-6 -18Z" fill="#8899aa"/>
    <circle r="9" fill="#fff"/>`;

  /* ---------- people ---------- */
  function hairBack(p, H, R) {
    const c = p.hair;
    if (p.style === 'long') return `<path d="M${-R - 8} ${H} Q${-R - 12} ${H - R - 16} 0 ${H - R - 12} Q${R + 12} ${H - R - 16} ${R + 8} ${H} L${R + 16} ${H + R + 40} Q0 ${H + R + 54} ${-R - 16} ${H + R + 40}Z" fill="${c}" ${S}/>`;
    if (p.style === 'wavy') return `<path d="M${-R - 10} ${H + 10} Q${-R - 14} ${H - R - 14} 0 ${H - R - 12} Q${R + 14} ${H - R - 14} ${R + 10} ${H + 10} Q${R + 20} ${H + 30} ${R + 4} ${H + 46} Q${-R - 4} ${H + 52} ${-R - 4} ${H + 46} Q${-R - 22} ${H + 30} ${-R - 10} ${H + 10}Z" fill="${c}" ${S}/>`;
    if (p.style === 'bun') return `<circle cx="0" cy="${H - R - 14}" r="26" fill="${c}" ${S}/>`;
    if (p.style === 'pigtails') return `<circle cx="${-R - 14}" cy="${H - 6}" r="22" fill="${c}" ${S}/><circle cx="${R + 14}" cy="${H - 6}" r="22" fill="${c}" ${S}/>
      <circle cx="${-R - 2}" cy="${H - 22}" r="9" fill="#F25F8B" ${S}/><circle cx="${R + 2}" cy="${H - 22}" r="9" fill="#F25F8B" ${S}/>`;
    if (p.style === 'curly') {
      let s = '';
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        s += `<circle cx="${(Math.cos(a) * (R + 4)).toFixed(1)}" cy="${(H + Math.sin(a) * (R + 4) + 8).toFixed(1)}" r="20" fill="${c}" ${S}/>`;
      }
      return s;
    }
    return '';
  }
  function hairFront(p, H, R) {
    const c = p.hair;
    if (p.style === 'thin') return `<ellipse cx="${-R + 4}" cy="${H - 8}" rx="12" ry="22" fill="${c}"/><ellipse cx="${R - 4}" cy="${H - 8}" rx="12" ry="22" fill="${c}"/>`;
    if (p.style === 'curly') {
      let s = '';
      for (let i = 0; i < 5; i++) s += `<circle cx="${-R * 0.7 + i * R * 0.35}" cy="${H - R * 0.78}" r="17" fill="${c}"/>`;
      return s;
    }
    return `<path d="M${-R - 2} ${H + 4} Q${-R - 4} ${H - R * 1.2} 0 ${H - R - 4} Q${R + 4} ${H - R * 1.2} ${R + 2} ${H + 4} Q${R * 0.7} ${H - R * 0.55} ${R * 0.15} ${H - R * 0.62} Q${-R * 0.5} ${H - R * 0.45} ${-R - 2} ${H + 4}Z" fill="${c}" ${S}/>`;
  }
  function face(p, H, R) {
    let s = `<circle cx="0" cy="${H}" r="${R}" fill="${p.skin}" ${S}/>`;
    s += `<ellipse cx="${-R - 2}" cy="${H + 4}" rx="9" ry="13" fill="${p.skin}" ${S}/><ellipse cx="${R + 2}" cy="${H + 4}" rx="9" ry="13" fill="${p.skin}" ${S}/>`;
    s += `<circle cx="0" cy="${H}" r="${R - 2.5}" fill="${p.skin}"/>`;
    s += eyes(R * 0.36, H - 2, R * 0.13) + cheeks(R * 0.55, H + R * 0.3);
    if (p.beard) s += `<path d="M${-R + 4} ${H + 6} Q${-R + 6} ${H + R + 14} 0 ${H + R + 16} Q${R - 6} ${H + R + 14} ${R - 4} ${H + 6} Q${R * 0.5} ${H + R * 0.6} 0 ${H + R * 0.55} Q${-R * 0.5} ${H + R * 0.6} ${-R + 4} ${H + 6}Z" fill="${p.hair}" opacity=".9"/>`;
    s += `<g class="mouth"><path d="M${-R * 0.3} ${H + R * 0.38} Q0 ${H + R * 0.78} ${R * 0.3} ${H + R * 0.38}Z" fill="#b23a48" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></g>`;
    if (p.glasses) s += `<circle cx="${-R * 0.36}" cy="${H - 2}" r="${R * 0.28}" fill="#fff" fill-opacity=".25" stroke="${INK}" stroke-width="4"/><circle cx="${R * 0.36}" cy="${H - 2}" r="${R * 0.28}" fill="#fff" fill-opacity=".25" stroke="${INK}" stroke-width="4"/><path d="M${-R * 0.08} ${H - 4} L${R * 0.08} ${H - 4}" stroke="${INK}" stroke-width="4"/>`;
    return s;
  }
  A.head = (p) => {
    const R = 58;
    return hairBack(p, 0, R) + face(p, 0, R) + hairFront(p, 0, R);
  };
  A.person = (p) => {
    const kid = !!p.kid;
    const R = kid ? 60 : 56, L = kid ? -64 : -96, T = kid ? -142 : -204, Hc = T - R + 6;
    const bw = kid ? 46 : 52;
    let s = '';
    s += `<ellipse cx="0" cy="6" rx="${bw + 20}" ry="12" fill="#000" opacity=".12"/>`;
    s += `<rect x="${-bw + 6}" y="${L - 6}" width="${bw - 10}" height="${-L}" rx="12" fill="${p.pants}" ${S}/><rect x="4" y="${L - 6}" width="${bw - 10}" height="${-L}" rx="12" fill="${p.pants}" ${S}/>`;
    s += `<ellipse cx="${-bw / 2 - 2}" cy="0" rx="26" ry="12" fill="${INK}"/><ellipse cx="${bw / 2 + 2}" cy="0" rx="26" ry="12" fill="${INK}"/>`;
    s += `<path d="M${-bw} ${L + 4} L${-bw} ${T + 26} Q${-bw} ${T} ${-bw + 26} ${T} L${bw - 26} ${T} Q${bw} ${T} ${bw} ${T + 26} L${bw} ${L + 4}Z" fill="${p.shirt}" ${S}/>`;
    s += `<path d="M${-bw + 6} ${T + 18} L${-bw - 18} ${L - 10}" stroke="${INK}" stroke-width="30" stroke-linecap="round"/><path d="M${-bw + 6} ${T + 18} L${-bw - 18} ${L - 10}" stroke="${p.shirt}" stroke-width="21" stroke-linecap="round"/><circle cx="${-bw - 18}" cy="${L - 4}" r="15" fill="${p.skin}" ${S}/>`;
    s += `<g class="arm"><path d="M${bw - 6} ${T + 18} L${bw + 18} ${L - 10}" stroke="${INK}" stroke-width="30" stroke-linecap="round"/><path d="M${bw - 6} ${T + 18} L${bw + 18} ${L - 10}" stroke="${p.shirt}" stroke-width="21" stroke-linecap="round"/><circle cx="${bw + 18}" cy="${L - 4}" r="15" fill="${p.skin}" ${S}/></g>`;
    s += `<rect x="-12" y="${T - 16}" width="24" height="22" fill="${p.skin}" ${S}/>`;
    s += hairBack(p, Hc, R) + face(p, Hc, R) + hairFront(p, Hc, R);
    return s;
  };

  /* ---------- map buildings ---------- */
  A.bHouse = () => `
    <rect x="-110" y="-60" width="220" height="140" rx="8" fill="#FFE8C2" ${S}/>
    <path d="M-135 -50 L0 -150 L135 -50Z" fill="#F25F8B" ${S}/>
    <rect x="50" y="-150" width="30" height="60" fill="#c0392b" ${S}/>
    <rect x="-26" y="10" width="52" height="70" rx="26" fill="#9B5DE5" ${S}/><circle cx="14" cy="46" r="5" fill="#F7C928"/>
    <rect x="-90" y="-30" width="48" height="44" rx="6" fill="#bfe7ff" ${S}/><rect x="42" y="-30" width="48" height="44" rx="6" fill="#bfe7ff" ${S}/>
    <path d="M-66 -30 L-66 14 M-90 -8 L-42 -8 M66 -30 L66 14 M42 -8 L90 -8" stroke="${INK}" stroke-width="4"/>
    <path d="M-18 -100 C-30 -116 -48 -98 -18 -80 C12 -98 -6 -116 -18 -100Z" fill="#fff" transform="translate(18 0)"/>`;
  A.bBarn = () => `
    <path d="M-110 80 L-110 -40 L-60 -110 L60 -110 L110 -40 L110 80Z" fill="#E8453C" ${S}/>
    <path d="M-124 -30 L-60 -124 L60 -124 L124 -30" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="-46" y="0" width="92" height="80" fill="#fff" ${S}/>
    <path d="M-46 0 L46 80 M46 0 L-46 80" stroke="#E8453C" stroke-width="8"/>
    <circle cx="0" cy="-60" r="22" fill="#fff" ${S}/>`;
  A.bMarket = () => `
    <rect x="-110" y="-50" width="220" height="130" rx="6" fill="#fff6dc" ${S}/>
    <rect x="-118" y="-110" width="236" height="44" rx="10" fill="#3A9AD9" ${S}/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${-118 + i * 39.3} -66 q19.6 30 39.3 0" fill="${i % 2 ? '#fff' : '#E8453C'}" ${S}/>`).join('')}
    <rect x="-90" y="-10" width="90" height="60" rx="6" fill="#bfe7ff" ${S}/>
    <circle cx="-66" cy="34" r="12" fill="#E8453C"/><circle cx="-40" cy="36" r="12" fill="#F58A2A"/><circle cx="-18" cy="34" r="12" fill="#4CB944"/>
    <rect x="22" y="0" width="56" height="80" rx="6" fill="#4CB944" ${S}/>`;
  A.bLibrary = () => `
    <rect x="-22" y="-10" width="44" height="90" fill="#8a5a2b" ${S}/>
    <circle cx="0" cy="-70" r="80" fill="#4CB944" ${S}/><circle cx="-80" cy="-30" r="50" fill="#4CB944" ${S}/><circle cx="80" cy="-30" r="50" fill="#4CB944" ${S}/>
    <circle cx="0" cy="-50" r="72" fill="#4CB944"/>
    <rect x="-70" y="-60" width="26" height="38" rx="4" fill="#E8453C" ${S}/><rect x="-40" y="-70" width="26" height="48" rx="4" fill="#F7C928" ${S}/>
    <rect x="14" y="-66" width="26" height="44" rx="4" fill="#3A7BE0" ${S}/><rect x="44" y="-58" width="26" height="36" rx="4" fill="#9B5DE5" ${S}/>
    <path d="M-40 60 L-6 40 L-6 80 L-40 90Z M40 60 L6 40 L6 80 L40 90Z" fill="#fff" ${S}/>`;
  A.bPark = () => `
    <path d="M-100 80 L-60 -60 L-40 -60 L-80 80Z" fill="#F7C928" ${S}/>
    <path d="M-60 -60 L40 80" stroke="#F58A2A" stroke-width="22" stroke-linecap="round"/>
    <path d="M-110 80 L120 80" stroke="${INK}" stroke-width="5"/>
    <g transform="translate(60 -30) scale(.45)">${A.balloon('#E8453C')}</g>
    <g transform="translate(100 -50) scale(.4)">${A.balloon('#3A7BE0')}</g>
    <g transform="translate(20 -60) scale(.38)">${A.balloon('#F7C928')}</g>`;
  A.bGarden = () => `
    <path d="M-100 80 L-100 -30 Q0 -150 100 -30 L100 80" fill="none" stroke="#4CB944" stroke-width="22" stroke-linecap="round"/>
    <path d="M-100 80 L-100 -30 Q0 -150 100 -30 L100 80" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="4 14"/>
    ${[[-100, -20, '#F78FB3'], [-70, -80, '#F7C928'], [0, -110, '#E8453C'], [70, -80, '#9B5DE5'], [100, -20, '#F78FB3']].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="16" fill="${p[2]}" ${S}/>`).join('')}
    <g transform="translate(-40 40) scale(.5)">${A.flower('#F78FB3')}</g><g transform="translate(40 40) scale(.5)">${A.flower('#F7C928')}</g>
    <g transform="translate(0 0) scale(.4)">${A.butterfly()}</g>`;

  A.darken = darken;
  G.MW_ART = A;
})(typeof window !== 'undefined' ? window : globalThis);
