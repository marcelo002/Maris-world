/* Mari's World: all words, people and places.
   Edit this file to change names, looks, lines or items. */
(function (G) {
  const art = g => (g === 'f' ? 'a' : 'o');
  const na = g => (g === 'f' ? 'na' : 'no');
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const NUM = {
    en: ['zero', 'one', 'two', 'three', 'four', 'five'],
    m: ['zero', 'um', 'dois', 'três', 'quatro', 'cinco'],
    f: ['zero', 'uma', 'duas', 'três', 'quatro', 'cinco'],
  };

  const COLORS = {
    red: { hex: '#E8453C', en: 'red', pt: { m: 'vermelho', f: 'vermelha' } },
    blue: { hex: '#3A7BE0', en: 'blue', pt: { m: 'azul', f: 'azul' } },
    yellow: { hex: '#F7C928', en: 'yellow', pt: { m: 'amarelo', f: 'amarela' } },
    green: { hex: '#4CB944', en: 'green', pt: { m: 'verde', f: 'verde' } },
    orange: { hex: '#F58A2A', en: 'orange', pt: { m: 'laranja', f: 'laranja' } },
    purple: { hex: '#9B5DE5', en: 'purple', pt: { m: 'roxo', f: 'roxa' } },
    pink: { hex: '#F78FB3', en: 'pink', pt: { m: 'rosa', f: 'rosa' } },
  };

  /* Looks: skin, hair colour, hair style (short, long, bun, curly, pigtails, thin, wavy),
     shirt, pants, glasses, beard, kid. Change these to match the real family. */
  const GUIDES = {
    mommy: { name: { en: 'Mommy', pt: 'Mamãe' }, g: 'f', look: { skin: '#F2C9A0', hair: '#6B4226', style: 'long', shirt: '#F25F8B', pants: '#3D5A99' } },
    daddy: { name: { en: 'Daddy', pt: 'Papai' }, g: 'm', look: { skin: '#E8B98E', hair: '#3B2A20', style: 'short', shirt: '#3A9AD9', pants: '#45474F', beard: true } },
    maxi: { name: { en: 'Maxi', pt: 'Maxi' }, g: 'm', look: { skin: '#F2C9A0', hair: '#8A5A2B', style: 'short', shirt: '#4CB944', pants: '#3D5A99', kid: true } },
    nana: { name: { en: 'Nana', pt: 'Nana' }, g: 'f', look: { skin: '#F2C9A0', hair: '#C9C3BE', style: 'bun', shirt: '#9B5DE5', pants: '#5C4B73' } },
    papa: { name: { en: 'Papa', pt: 'Papa' }, g: 'm', look: { skin: '#E8B98E', hair: '#D9D4CF', style: 'thin', shirt: '#E8453C', pants: '#6B5B45', glasses: true } },
    gail: { name: { en: 'Nana Gail', pt: 'Nana Gail' }, g: 'f', look: { skin: '#F6D2B4', hair: '#EDE6DF', style: 'curly', shirt: '#2EB8A6', pants: '#3E5C76', glasses: true } },
    spera: { name: { en: 'Nana Spera', pt: 'Nana Spera' }, g: 'f', look: { skin: '#E9BE95', hair: '#8F8A86', style: 'wavy', shirt: '#F58A2A', pants: '#6B4E3D' } },
    mari: { name: { en: 'Mari', pt: 'Mari' }, g: 'f', look: { skin: '#F4CDA8', hair: '#7A4B2A', style: 'pigtails', shirt: '#F7C928', pants: '#F78FB3', kid: true } },
  };

  const GENERIC = {
    praise: [
      { id: 'praise.1', en: 'Yay!', pt: 'Eba!' },
      { id: 'praise.2', en: 'Great job, Mari!', pt: 'Muito bem, Mari!' },
      { id: 'praise.3', en: 'You did it!', pt: 'Você conseguiu!' },
      { id: 'praise.4', en: "Wow, you're so smart!", pt: 'Uau, que esperta!' },
      { id: 'praise.5', en: 'Hooray!', pt: 'Viva!' },
    ],
    tryAgain: { id: 'hint.again', en: "Let's try again!", pt: 'Vamos tentar de novo!' },
    here: { id: 'hint.here', en: 'Look, here it is!', pt: 'Olha, está aqui!' },
    thats: (nm, id) => ({ id: 'hint.that.' + id, en: `That's the ${nm.en}!`, pt: `${nm.g === 'f' ? 'Essa é a' : 'Esse é o'} ${nm.pt}!` }),
    guideTap: [
      { id: 'tap.hi', en: 'Hi Mari!', pt: 'Oi Mari!' },
      { id: 'tap.love', en: 'I love you, Mari!', pt: 'Eu te amo, Mari!' },
      { id: 'tap.fun', en: 'This is fun!', pt: 'Que divertido!' },
    ],
    sticker: { id: 'sticker.got', en: 'You got a sticker!', pt: 'Você ganhou uma figurinha!' },
    bye: { id: 'bye', en: 'Bye bye! See you soon!', pt: 'Tchau tchau! Até logo!' },
  };

  const SHARED = {
    welcome: { id: 'title.welcome', en: "Welcome to Mari's World!", pt: 'Bem-vinda ao Mundo da Mari!' },
    where: { id: 'map.where', en: 'Where do you want to go?', pt: 'Aonde você quer ir?' },
    stickers: { id: 'book.look', en: 'Look at all your stickers!', pt: 'Olha todas as suas figurinhas!' },
    bedtime: { id: 'bedtime', en: 'Time for a rest, Mari. Bye bye!', pt: 'Hora de descansar, Mari. Tchau tchau!' },
    count: [1, 2, 3, 4, 5].map(n => ({ id: 'count.' + n, en: cap(NUM.en[n]) + '!', pt: cap(NUM.m[n]) + '!' })),
  };

  const LOCATIONS = {
    house: {
      id: 'house', name: { en: "Mari's House", pt: 'Casa da Mari' }, to: { en: "Let's go home!", pt: 'Vamos para casa!' },
      guides: ['mommy'], sticker: { art: 'teddy' },
      greet: [{ id: 'house.greet', en: "Hi Mari! It's Mommy!", pt: 'Oi Mari! É a mamãe!' }],
      setup: [{ id: 'house.setup', en: "Let's get ready to go out and play. Can you help me find some things?", pt: 'Vamos nos arrumar para brincar lá fora. Você me ajuda a achar algumas coisas?' }],
      end: [{ id: 'house.end', en: 'We are all ready! Thank you for helping, Mari!', pt: 'Estamos prontas! Obrigada pela ajuda, Mari!' }],
      colors: ['red', 'blue', 'yellow', 'green', 'pink', 'purple'],
      items: [
        { id: 'hairbrush', en: 'hairbrush', pt: 'escova de cabelo', g: 'f', colorable: true, use: { en: 'Which one do we brush our hair with?', pt: 'Com qual a gente penteia o cabelo?' } },
        { id: 'cup', en: 'cup', pt: 'copo', g: 'm', colorable: true, use: { en: 'Which one do we drink from?', pt: 'Em qual a gente bebe?' } },
        { id: 'sock', en: 'sock', pt: 'meia', g: 'f', colorable: true },
        { id: 'ball', en: 'ball', pt: 'bola', g: 'f', colorable: true, use: { en: 'Which one do we kick and throw?', pt: 'Qual a gente chuta e joga?' } },
        { id: 'shoe', en: 'shoe', pt: 'sapato', g: 'm', colorable: true, use: { en: 'What do we wear on our feet?', pt: 'O que a gente usa nos pés?' } },
        { id: 'hat', en: 'hat', pt: 'chapéu', g: 'm', colorable: true, use: { en: 'What do we wear on our head?', pt: 'O que a gente usa na cabeça?' } },
        { id: 'teddy', en: 'teddy bear', pt: 'ursinho', g: 'm', use: { en: 'Which one do we hug at bedtime?', pt: 'Qual a gente abraça na hora de dormir?' } },
        { id: 'spoon', en: 'spoon', pt: 'colher', g: 'f', use: { en: 'Which one do we eat with?', pt: 'Com qual a gente come?' } },
        { id: 'toothbrush', en: 'toothbrush', pt: 'escova de dentes', g: 'f', use: { en: 'Which one do we brush our teeth with?', pt: 'Com qual a gente escova os dentes?' } },
        { id: 'book', en: 'book', pt: 'livro', g: 'm', use: { en: 'Which one do we read?', pt: 'Qual a gente lê?' } },
      ],
      prompts: {
        find: it => ({ id: `house.find.${it.id}`, en: `Can you find the ${it.en}?`, pt: `Você acha ${art(it.g)} ${it.pt}?` }),
        color: (it, c) => ({ id: `house.color.${it.id}.${c}`, en: `Tap the ${COLORS[c].en} ${it.en}!`, pt: `Toque ${na(it.g)} ${it.pt} ${COLORS[c].pt[it.g]}!` }),
        use: it => ({ id: `house.use.${it.id}`, en: it.use.en, pt: it.use.pt }),
      },
    },

    farm: {
      id: 'farm', name: { en: 'Sunny Farm', pt: 'Fazenda do Sol' }, to: { en: "Let's go to the farm!", pt: 'Vamos para a fazenda!' },
      guides: ['nana', 'papa'], sticker: { art: 'cow' },
      greet: [
        { id: 'farm.greet.nana', who: 'nana', en: "Hi Mari! It's Nana!", pt: 'Oi Mari! É a Nana!' },
        { id: 'farm.greet.papa', who: 'papa', en: 'And Papa! Welcome to the farm!', pt: 'E o Papa! Bem-vinda à fazenda!' },
      ],
      setup: [{ id: 'farm.setup', who: 'nana', en: "The animals are playing hide and seek. Let's find them!", pt: 'Os bichinhos estão brincando de esconde-esconde. Vamos achar eles!' }],
      end: [{ id: 'farm.end', who: 'papa', en: 'You found all the animals! Time for their dinner.', pt: 'Você achou todos os bichinhos! Hora do jantar deles.' }],
      items: [
        { id: 'cow', en: 'cow', pt: 'vaca', g: 'f', sound: { en: 'moo', pt: 'muuu' } },
        { id: 'pig', en: 'pig', pt: 'porco', g: 'm', sound: { en: 'oink oink', pt: 'óinc óinc' } },
        { id: 'sheep', en: 'sheep', pt: 'ovelha', g: 'f', sound: { en: 'baa', pt: 'méé' } },
        { id: 'chick', en: 'chick', pt: 'pintinho', g: 'm', sound: { en: 'peep peep', pt: 'piu piu' } },
        { id: 'horse', en: 'horse', pt: 'cavalo', g: 'm', sound: { en: 'neigh', pt: 'hiiinn' } },
        { id: 'duck', en: 'duck', pt: 'pato', g: 'm', sound: { en: 'quack quack', pt: 'quá quá' } },
        { id: 'dog', en: 'dog', pt: 'cachorro', g: 'm', sound: { en: 'woof woof', pt: 'au au' } },
        { id: 'cat', en: 'cat', pt: 'gato', g: 'm', sound: { en: 'meow', pt: 'miau' } },
      ],
      prompts: {
        find: it => ({ id: `farm.find.${it.id}`, en: `Where is the ${it.en}?`, pt: `Cadê ${art(it.g)} ${it.pt}?` }),
        sound: it => ({ id: `farm.sound.${it.id}`, en: `Who says ${it.sound.en}?`, pt: `Quem faz ${it.sound.pt}?` }),
        animal: it => ({ id: `farm.says.${it.id}`, en: cap(it.sound.en) + '!', pt: cap(it.sound.pt) + '!' }),
      },
    },

    market: {
      id: 'market', name: { en: 'Corner Market', pt: 'Mercadinho' }, to: { en: "Let's go to the market!", pt: 'Vamos para o mercadinho!' },
      guides: ['daddy'], sticker: { art: 'apple' },
      greet: [{ id: 'market.greet', en: "Hi Mari! It's Daddy!", pt: 'Oi Mari! É o papai!' }],
      setup: [{ id: 'market.setup', en: "Let's go shopping for a yummy fruit salad!", pt: 'Vamos fazer compras para uma salada de frutas gostosa!' }],
      end: [{ id: 'market.end', en: 'Our basket is full! Yummy fruit salad! Thank you, Mari!', pt: 'A cesta está cheia! Que salada de frutas gostosa! Obrigado, Mari!' }],
      items: [
        { id: 'apple', en: 'apple', enPl: 'apples', pt: 'maçã', ptPl: 'maçãs', g: 'f' },
        { id: 'banana', en: 'banana', enPl: 'bananas', pt: 'banana', ptPl: 'bananas', g: 'f' },
        { id: 'orange', en: 'orange', enPl: 'oranges', pt: 'laranja', ptPl: 'laranjas', g: 'f' },
        { id: 'strawberry', en: 'strawberry', enPl: 'strawberries', pt: 'morango', ptPl: 'morangos', g: 'm' },
        { id: 'pear', en: 'pear', enPl: 'pears', pt: 'pera', ptPl: 'peras', g: 'f' },
        { id: 'watermelon', en: 'watermelon', enPl: 'watermelons', pt: 'melancia', ptPl: 'melancias', g: 'f' },
      ],
      prompts: {
        find: it => ({ id: `market.find.${it.id}`, en: `Can you tap the ${it.en}?`, pt: `Toque ${na(it.g)} ${it.pt}!` }),
        count: (it, n) => ({ id: `market.count.${it.id}.${n}`, en: `Which basket has ${NUM.en[n]} ${n === 1 ? it.en : it.enPl}?`, pt: `Qual cestinha tem ${NUM[it.g][n]} ${n === 1 ? it.pt : it.ptPl}?` }),
        countHint: (it, n) => ({ id: `market.has.${it.id}.${n}`, en: `That one has ${NUM.en[n]}!`, pt: `Essa tem ${NUM[it.g][n]}!` }),
        along: it => ({ id: `market.along.${it.id}`, en: `Let's count the ${it.enPl}! Tap each one.`, pt: `Vamos contar ${it.g === 'f' ? 'as' : 'os'} ${it.ptPl}! Toque em cada ${it.g === 'f' ? 'uma' : 'um'}.` }),
        alongDone: (it, n) => ({ id: `market.counted.${it.id}.${n}`, en: `${cap(NUM.en[n])} ${it.enPl}! Great counting!`, pt: `${cap(NUM[it.g][n])} ${it.ptPl}! Muito bem contado!` }),
      },
    },

    library: {
      id: 'library', name: { en: 'Story Tree Library', pt: 'Biblioteca da Árvore' }, to: { en: "Let's go to the library!", pt: 'Vamos para a biblioteca!' },
      guides: ['gail'], sticker: { art: 'letterM' },
      greet: [{ id: 'library.greet', en: "Hi Mari! It's Nana Gail!", pt: 'Oi Mari! É a Nana Gail!' }],
      setup: [{ id: 'library.setup', en: "Oh no, the letters fell out of the storybook! Let's put them back.", pt: 'Ah não, as letras caíram do livro de histórias! Vamos colocar de volta.' }],
      end: [{ id: 'library.end', en: 'All the letters are back! Now we can read the story. Thank you, Mari!', pt: 'As letras voltaram! Agora podemos ler a história. Obrigada, Mari!' }],
      letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
      nameIntro: { id: 'library.name.intro', en: "Let's find the letters in your name. M, A, R, I!", pt: 'Vamos achar as letras do seu nome. M, A, R, I!' },
      nameDone: { id: 'library.name.done', en: 'M, A, R, I. That spells Mari!', pt: 'M, A, R, I. Isso é Mari!' },
      letterName: L => ({ en: `letter ${L}`, pt: `letra ${L}`, g: 'f' }),
      prompts: {
        find: L => ({ id: `library.find.${L}`, en: `Find the letter ${L}!`, pt: `Encontre a letra ${L}!` }),
        name: L => ({ id: `library.name.${L}`, en: `Find the ${L} for Mari!`, pt: `Ache o ${L} de Mari!` }),
      },
    },

    park: {
      id: 'park', name: { en: 'Balloon Park', pt: 'Parque dos Balões' }, to: { en: "Let's go to the park!", pt: 'Vamos para o parque!' },
      guides: ['maxi'], sticker: { art: 'balloon' },
      greet: [{ id: 'park.greet', en: "Hi Mari! It's Maxi!", pt: 'Oi Mari! Sou eu, o Maxi!' }],
      setup: [{ id: 'park.setup', en: "The balloons are flying away. Let's catch them!", pt: 'Os balões estão voando. Vamos pegar eles!' }],
      end: [{ id: 'park.end', en: 'We caught all the balloons! Hooray!', pt: 'Pegamos todos os balões! Viva!' }],
      colors: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink'],
      balloon: { id: 'balloon', en: 'balloon', pt: 'balão', g: 'm' },
      ball: { id: 'ball', en: 'ball', pt: 'bola', g: 'f' },
      sizes: {
        big: { en: 'big ball', pt: 'bola grande', g: 'f' },
        little: { en: 'little ball', pt: 'bola pequena', g: 'f' },
      },
      prompts: {
        color: c => ({ id: `park.color.${c}`, en: `Pop the ${COLORS[c].en} balloon!`, pt: `Estoure o balão ${COLORS[c].pt.m}!` }),
        size: s => ({ id: `park.size.${s}`, en: `Find the ${s} ball!`, pt: s === 'big' ? 'Ache a bola grande!' : 'Ache a bola pequena!' }),
      },
    },

    garden: {
      id: 'garden', name: { en: "Nana Spera's Garden", pt: 'Jardim da Nana Spera' }, to: { en: "Let's go to Nana Spera's garden!", pt: 'Vamos para o jardim da Nana Spera!' },
      guides: ['spera'], sticker: { art: 'butterfly' },
      greet: [{ id: 'garden.greet', en: "Hi Mari! It's Nana Spera! Welcome to my garden.", pt: 'Oi Mari! É a Nana Spera! Bem-vinda ao meu jardim.' }],
      setup: [{ id: 'garden.setup', en: "Let's look for shapes and little bugs!", pt: 'Vamos procurar formas e bichinhos!' }],
      end: [{ id: 'garden.end', en: 'What a beautiful garden! Thank you, Mari!', pt: 'Que jardim lindo! Obrigada, Mari!' }],
      shapes: [
        { id: 'circle', en: 'circle', pt: 'círculo', g: 'm' },
        { id: 'square', en: 'square', pt: 'quadrado', g: 'm' },
        { id: 'triangle', en: 'triangle', pt: 'triângulo', g: 'm' },
        { id: 'star', en: 'star', pt: 'estrela', g: 'f' },
        { id: 'heart', en: 'heart', pt: 'coração', g: 'm' },
      ],
      bugs: [
        { id: 'butterfly', en: 'butterfly', pt: 'borboleta', g: 'f' },
        { id: 'ladybug', en: 'ladybug', pt: 'joaninha', g: 'f' },
        { id: 'bee', en: 'bee', pt: 'abelha', g: 'f' },
        { id: 'snail', en: 'snail', pt: 'caracol', g: 'm' },
      ],
      prompts: {
        shape: it => ({ id: `garden.shape.${it.id}`, en: `Find the ${it.en}!`, pt: `Ache ${art(it.g)} ${it.pt}!` }),
        bug: it => ({ id: `garden.bug.${it.id}`, en: `Where is the ${it.en}?`, pt: `Cadê ${art(it.g)} ${it.pt}?` }),
      },
    },
  };

  G.MW_DATA = { COLORS, GUIDES, GENERIC, SHARED, LOCATIONS, NUM, cap };
})(typeof window !== 'undefined' ? window : globalThis);
