// Generates one recording script per family member from src/data.js.
const fs = require('fs'), path = require('path');
require('./src/data.js');
const { COLORS, GUIDES, GENERIC, SHARED, LOCATIONS } = globalThis.MW_DATA;
const outDir = path.join(__dirname, 'dist', 'voice-scripts');
fs.mkdirSync(outDir, { recursive: true });

function linesFor(L) {
  const sec = [];
  const P = L.prompts;
  if (L.id === 'house') {
    sec.push(['Find things', L.items.map(P.find)]);
    sec.push(['What is it for?', L.items.filter(i => i.use).map(P.use)]);
    sec.push(['Colours', L.items.filter(i => i.colorable).flatMap(it => L.colors.map(c => P.color(it, c)))]);
    sec.push(['When Mari taps another one', [...L.items.map(it => GENERIC.thats(it, it.id)), ...L.items.filter(i => i.colorable).flatMap(it => L.colors.map(c => GENERIC.thats({ en: `${COLORS[c].en} ${it.en}`, pt: `${it.pt} ${COLORS[c].pt[it.g]}`, g: it.g }, `${it.id}.${c}`)))]]);
  }
  if (L.id === 'farm') {
    sec.push(['Find the animals', L.items.map(P.find)]);
    sec.push(['Animal sounds', L.items.map(P.sound)]);
    sec.push(['The animals talk (say it like the animal!)', L.items.map(P.animal)]);
    sec.push(['When Mari taps another one', L.items.map(it => GENERIC.thats(it, it.id))]);
  }
  if (L.id === 'market') {
    sec.push(['Find the fruit', L.items.map(P.find)]);
    sec.push(['Count along', L.items.map(P.along)]);
    sec.push(['Finished counting', L.items.flatMap(it => [2, 3, 4, 5].map(n => P.alongDone(it, n)))]);
    sec.push(['Which basket?', L.items.flatMap(it => [1, 2, 3, 4, 5].map(n => P.count(it, n)))]);
    sec.push(['When Mari taps another basket', L.items.flatMap(it => [1, 2, 3, 4, 5].map(n => P.countHint(it, n)))]);
    sec.push(['When Mari taps another fruit', L.items.map(it => GENERIC.thats(it, it.id))]);
    sec.push(['Counting numbers', SHARED.count]);
  }
  if (L.id === 'library') {
    sec.push(["Mari's name", [L.nameIntro, ...'MARI'.split('').map(P.name), L.nameDone]]);
    sec.push(['Find the letter', L.letters.map(P.find)]);
    sec.push(['When Mari taps another letter', L.letters.map(x => GENERIC.thats(L.letterName(x), x))]);
  }
  if (L.id === 'park') {
    sec.push(['Pop the balloon', L.colors.map(P.color)]);
    sec.push(['Big and little', ['big', 'little'].map(P.size)]);
    sec.push(['When Mari taps another balloon', L.colors.map(c => GENERIC.thats({ en: `${COLORS[c].en} balloon`, pt: `balão ${COLORS[c].pt.m}`, g: 'm' }, `balloon.${c}`))]);
  }
  if (L.id === 'garden') {
    sec.push(['Shapes', L.shapes.map(P.shape)]);
    sec.push(['Little bugs', L.bugs.map(P.bug)]);
    sec.push(['When Mari taps another one', [...L.shapes, ...L.bugs].map(it => GENERIC.thats(it, it.id))]);
  }
  return sec;
}

const esc = s => String(s).replace(/\|/g, '\\|');
const table = (rows, who) => '| # | File name | English | Português |\n| --- | --- | --- | --- |\n' +
  rows.map((r, i) => `| ${i + 1} | \`${who}/${r.id}\` | ${esc(r.en)} | ${esc(r.pt)} |`).join('\n') + '\n';

let index = "# Mari's World: voice scripts\n\nOne script per family member. Each line has an English and a Portuguese version; record whichever languages you speak. The game uses the computer voice for anything not recorded yet.\n\n## How to record\n\n- Use the iPhone Voice Memos app in a quiet room, phone about 20 cm from your mouth.\n- Say each line with a big smile and lots of energy, a little slower than normal. Toddlers love excitement!\n- Leave a one-second pause between lines. One long recording per section is fine; it will be cut into pieces later.\n- Say the file name before each line (for example \"house greet, English\") so the pieces are easy to match.\n- Send the recordings back and they get added to the game, replacing the computer voice for that person.\n\n## Scripts\n\n";
let total = 0;
for (const [gid, G] of Object.entries(GUIDES)) {
  if (gid === 'mari') continue;
  const locs = Object.values(LOCATIONS).filter(L => L.guides.includes(gid));
  let md = `# ${G.name.en}'s lines for Mari's World\n\n`;
  let count = 0;
  for (const L of locs) {
    const shared = L.guides.length > 1;
    md += `## ${L.name.en} (${L.name.pt})\n\n`;
    if (shared) md += `${L.guides.map(g => GUIDES[g].name.en).join(' and ')} host this place together. Story lines marked for you are yours; the question lines can be recorded by either of you (the game takes turns).\n\n`;
    const story = [...L.greet, ...L.setup, ...L.end].filter(x => !x.who || x.who === gid);
    md += '### Story\n\n' + table(story, gid) + '\n'; count += story.length;
    for (const [title, rows] of linesFor(L)) { md += `### ${title}\n\n` + table(rows, gid) + '\n'; count += rows.length; }
  }
  const common = [...GENERIC.praise, GENERIC.tryAgain, GENERIC.here, ...GENERIC.guideTap, GENERIC.sticker, GENERIC.bye];
  md += '## Cheers and hints (used everywhere)\n\n' + table(common, gid) + '\n'; count += common.length;
  if (gid === 'mommy' || gid === 'daddy') {
    const sh = [SHARED.welcome, SHARED.where, SHARED.stickers, SHARED.bedtime, ...Object.values(LOCATIONS).map(L => Object.assign({ id: `map.go.${L.id}` }, L.to))];
    md += "## Map and menus (Mommy or Daddy)\n\nThese are spoken on the title screen, the map and the sticker book. Either parent can record them.\n\n" + table(sh, gid) + '\n'; count += sh.length;
  }
  md = md.replace('\n\n', `\n\n${count} lines. Start with the Story and Cheers sections; they are heard most often.\n\n`);
  const file = `${gid}-${G.name.en.toLowerCase().replace(/\s+/g, '-')}.md`;
  fs.writeFileSync(path.join(outDir, file), md);
  index += `- [${G.name.en}](${file}): ${locs.map(l => l.name.en).join(', ')}, ${count} lines\n`;
  total += count;
}
fs.writeFileSync(path.join(outDir, 'README.md'), index);
console.log('scripts written, total lines', total);
