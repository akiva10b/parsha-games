/* Code-drawn pixel art. Everything is drawn in "texels" and shown at
   PX times size, so sprites, tiles and backgrounds share one pixel grid.
   Sprites are grids of palette letters; '.' is transparent. */

const PX = 3;

const PAL = {
  k: '#2b1b17', s: '#e2ac7f', S: '#b97c55', e: '#1b1010',
  w: '#f3ead6', W: '#c9bc9c', h: '#ddd6c8', H: '#a39885',
  b: '#8c4a2b', B: '#5c2f1a', r: '#c4452f', R: '#7a2420', q: '#9a3328',
  y: '#f2c14e', Y: '#c48a1f', a: '#ffe9a0',
  o: '#a8743c', O: '#6b4521', d: '#3a2a22',
  g: '#5e9e3c', G: '#3b6b25', l: '#8fd14f',
  c: '#3f72b8', C: '#2a4b82', u: '#5fb3e8', U: '#2f7fbf',
  m: '#9b968e', M: '#68645e', n: '#cdc8bf',
  p: '#7b4c9c', P: '#4f2f6b',
  t: '#e6cf9a', T: '#b89c62',
  x: '#151515', f: '#ffffff',
};

const Art = (() => {
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const norm = (rows, w) => {
    w = w || Math.max(...rows.map(r => r.length));
    return rows.map(r => (r + '.'.repeat(w)).slice(0, w));
  };

  function pix(scene, key, rows, swap) {
    if (scene.textures.exists(key)) return;
    rows = norm(rows);
    const h = rows.length, w = rows[0].length;
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let ch = rows[y][x];
      if (swap && swap[ch] !== undefined) ch = swap[ch];
      if (ch === '.' || !PAL[ch]) continue;
      ctx.fillStyle = PAL[ch]; ctx.fillRect(x, y, 1, 1);
    }
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  function canvas(scene, key, w, h, draw, nearest = true) {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    draw(ctx, w, h);
    tex.refresh();
    if (nearest) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  const R = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

  /* ---------------- people ---------------- */
  const HEAD = [
    '..........kkkk..........',
    '.........kwwwwk.........',
    '........kwwwwwwk........',
    '.......kwwwsssssk.......',
    '.......kwwssssesk.......',
    '.......kwwsssssssk......',
    '.......kwwssssSsk.......',
    '........kwhhhhhhk.......',
    '........khhhhhhhk.......',
    '.........khhhhhk........',
  ];
  const BODY = [
    '........kbbhhhhbk..o....',
    '.......kbbbbhhbbbk.o....',
    '.......kbrbbbbbbssko....',
    '.......kbrbbbbbbbk.o....',
    '.......kbrbbbbbbbk.o....',
    '.......kbrbyyyybbk.o....',
    '.......kbrbbbbbbbk.o....',
    '.......kbbbbbbbbbk.o....',
    '........kbbbbbbbk..o....',
  ];
  const LEGS = {
    idle: [
      '........kbbbbbbbk..o....',
      '........kbbbbbbbk..o....',
      '.........kSk.kSk...o....',
      '.........ksk.ksk...o....',
      '........kkkk.kkkk..O....',
    ],
    walk1: [
      '........kbbbbbbbk..o....',
      '.......kbbbk.kbbbk.o....',
      '......kSk.....kSk..o....',
      '......ksk.....ksk..o....',
      '.....kkkk.....kkkk.O....',
    ],
    walk2: [
      '........kbbbbbbbk..o....',
      '........kbbbkbbbk..o....',
      '..........kSkSk....o....',
      '..........ksksk....o....',
      '.........kkkkkkk...O....',
    ],
    jump: [
      '........kbbbbbbbk..o....',
      '.......kbbbbbbbbbk.o....',
      '.......kSk....kSk..o....',
      '.......kkk....kkk..O....',
      '........................',
    ],
  };
  function personFrames() {
    const f = {};
    for (const k of Object.keys(LEGS)) f[k] = norm(HEAD.concat(BODY, LEGS[k]), 24);
    const grid = (rows) => rows.map(r => r.split(''));
    const join = (g) => g.map(r => r.join(''));
    // Staff swung forward, held level.
    const a = grid(f.idle);
    for (const row of a) for (let x = 18; x < 24; x++) if (row[x] === 'o' || row[x] === 'O') row[x] = '.';
    for (let x = 18; x < 24; x++) a[12][x] = x === 23 ? 'O' : 'o';
    f.attack = join(a);
    // Arm raised to toss.
    const t = grid(f.idle);
    for (const row of t) for (let x = 18; x < 24; x++) if (row[x] === 'o' || row[x] === 'O') row[x] = '.';
    t[12][16] = 'b'; t[12][17] = 'k'; t[12][18] = '.';
    for (let y = 6; y <= 11; y++) { t[y][18] = 's'; t[y][19] = 'k'; }
    t[5][18] = 'k';
    f.throw = join(t);
    return f;
  }
  const PEOPLE = {
    av: {},
    sarai: { o: '.', O: '.', w: 'c', W: 'C', h: 'c', H: 'C', b: 'r', B: 'R', r: 'y' },
    lot: { h: 'O', H: 'O', b: 'p', B: 'P', r: 'y', o: '.', O: '.' },
    shep: { w: 't', W: 'T', h: 'd', H: 'd', b: 'g', B: 'G', r: 'y' },
    lotshep: { w: 't', W: 'T', h: 'x', H: 'x', b: 'p', B: 'P', r: 'y' },
    guard: { w: 'm', W: 'M', h: 'x', H: 'x', b: 'q', B: 'R', r: 'M', y: 'n', o: 'M', O: 'M' },
  };

  /* ---------------- animals & objects ---------------- */
  const SHEEP = {
    0: ['.....wwwww......', '...wwwwwwwwwkk..', '..wwwwwwwwwkkkk.', '.wwwwwwwwwwkekkk',
        'wwwwwwwwwwwkkkk.', 'wWwwwwwwwwwwkk..', 'wwwwwwwwwwwww...', '.wWwwwwWwwwww...',
        '..WwwwwwwwwW....', '...kk.kk.kk.k...', '...kk.kk.kk.k...', '...k..k..k..k...'],
    1: ['.....wwwww......', '...wwwwwwwwwkk..', '..wwwwwwwwwkkkk.', '.wwwwwwwwwwkekkk',
        'wwwwwwwwwwwkkkk.', 'wWwwwwwwwwwwkk..', 'wwwwwwwwwwwww...', '.wWwwwwWwwwww...',
        '..WwwwwwwwwW....', '..kk..kk.kk..k..', '..k...k...k..k..', '..k....k..k...k.'],
    eat: ['................', '.....wwwww......', '...wwwwwwwwww...', '..wwwwwwwwwwww..',
        '.wwwwwwwwwwwwwk.', 'wwwwwwwwwwwwwkkk', 'wWwwwwwwwwwwkkek', 'wwwwwwwwwwwwwkkk',
        '.wWwwwwWwwwww.k.', '...kk.kk.kk.k...', '...kk.kk.kk.k...', '...k..k..k..k...'],
  };
  const SCORP = {
    0: ['...........kk.', '..........kYk.', '..........kYk.', '.kk......kYk..',
        'kYYk.kkkkYk...', '.kYYkYYYYYk...', '..kYYYYYYYYk..', '..k.k.k.k.k...'],
    1: ['..........kk..', '..........kYk.', '...........kYk', 'kk.......kYk..',
        'kYYk.kkkkYk...', '.kYYkYYYYYk...', '..kYYYYYYYYk..', '...k.k.k.k.k..'],
  };
  const IDOL = [
    '...kkkkkk...', '..kmmmmmmk..', '..kmeMMemk..', '..kmmmmmmk..', '..kmMmmMmk..',
    '...kmmmmk...', '..kyyyyyyk..', '.kmmmmmmmmk.', 'kmmkmmmmkmmk', 'kmk.kmmk.kmk',
    'kmk.kmmk.kmk', 'kk..kmmk..kk', '....kmmk....', '...kmmmmk...', '...kmMMmk...',
    '..kmmmmmmk..', '..kmmmmmmk..', '.kMMMMMMMMk.', '.kMMMMMMMMk.', 'kkkkkkkkkkkk',
  ];
  const SMALL = {
    heart: ['.kk...kk.', 'krrk.krrk', 'krfrkrrrk', 'krrrrrrrk', '.krrrrrk.', '..krrrk..', '...krk...', '....k....'],
    heart_empty: ['.kk...kk.', 'kMMk.kMMk', 'kMMMkMMMk', 'kMMMMMMMk', '.kMMMMMk.', '..kMMMk..', '...kMk...', '....k....'],
    star: ['...y...', '...y...', 'yyyayyy', '.yaaay.', '..yay..', '.yy.yy.', 'y.....y'],
    tiny: ['.a.', 'afa', '.a.'],
    pom: ['...kGk...', '..krrrk..', '.krrrrrk.', 'krrfrrrrk', 'krrrrrrrk', 'krrrrrrRk', '.krrrrRk.', '..kkkkk..'],
    key: ['.kkkk.......', 'kyyyyk......', 'kyaykkkkkkkk', 'kyyyyyyyyyyk', 'kyyyykkykkyk', '.kkkk..k..k.'],
    wool: ['..kkk..', '.kwwwk.', 'kwwfwwk', 'kwwwwWk', 'kwWwwWk', '.kWWWk.', '..kkk..'],
    rock: ['...kkkk...', '..kmmnmk..', '.kmnmmmMk.', 'kmmmmmMMMk', 'kmMmmmmMMk', 'kmmmMmmmMk', '.kMMmmMMk.', '..kkMMkk..', '....kk....'],
    arrow: ['....kk...', '....kfk..', 'kkkkkffk.', 'kfffffffk', 'kkkkkffk.', '....kfk..', '....kk...'],
    rubble: ['kmk', 'mnM', 'kMk'],
    goldrubble: ['kyk', 'yaY', 'kYk'],
    puff: ['.ff.', 'ffff', 'ffff', '.ff.'],
    spark: ['aa', 'aa'],
    dot: ['f'],
    fluff: ['.f.', 'fff', '.f.'],
    lock: ['..kkkk..', '.k....k.', '.k....k.', 'kkkkkkkk', 'kyyyyyyk', 'kyyYYyyk', 'kyyYYyyk', 'kyyyyyyk', 'kkkkkkkk'],
    sound: ['....k.....', '...kk..k..', 'kkkfk...k.', 'kfffk.k.k.', 'kfffk.k.k.', 'kkkfk...k.', '...kk..k..', '....k.....'],
    mute: ['....k.....', '...kk.....', 'kkkfk.r..r', 'kfffk..rr.', 'kfffk..rr.', 'kkkfk.r..r', '...kk.....', '....k.....'],
    flag: ['kk........', 'kkrrrrrrr.', 'kkrryyrrrr', 'kkrryyrrr.', 'kkrrrrrrr.', 'kk........',
           'kk', 'kk', 'kk', 'kk', 'kk', 'kk', 'kk', 'kk', 'kk', 'kk', 'kk', 'kk', 'kk', 'kk', 'kkkk', 'kkkk'],
    wheat: ['.y..y..y', '.Yy.Yy.Y', 'y.yy.yy.', '.y.Y.y.Y', '.Y..Y..Y', '..Y..Y.Y', '..Y..Y.Y', '..G..G.G',
            '.G..G..G', '.G..G..G', 'G..G..G.', 'G..G..G.'],
    wheat_eaten: ['........', '........', '........', '........', '........', '........', '........', '........',
                  '.G...G..', '.G..G..G', 'G..G..G.', 'G..G..G.'],
    veg: ['........', '........', '........', '........', '..g..g..', '.gGggGg.', 'gGllgGlg', 'gglgglgg',
          '.kGGGGk.', '.kGkkGk.', '..G..G..', '.G..G..G'],
    veg_eaten: ['........', '........', '........', '........', '........', '........', '........', '........',
                '...G....', '..G..G..', '..G..G..', '.G..G..G'],
  };

  /* ---------------- tiles & scenery (canvas drawn) ---------------- */
  function groundTex(scene, key, top, mid, deep, spk, grass) {
    canvas(scene, key, 16, 34, (c) => {
      const r = rng(key.length * 97);
      R(c, mid, 0, 0, 16, 34);
      R(c, deep, 0, 20, 16, 14);
      for (let i = 0; i < 22; i++) R(c, spk, Math.floor(r() * 16), 5 + Math.floor(r() * 28), 1 + Math.floor(r() * 2), 1);
      if (grass) {
        R(c, grass[1], 0, 0, 16, 4);
        R(c, grass[0], 0, 0, 16, 2);
        for (let x = 0; x < 16; x += 2) R(c, grass[1], x, 4, 1, 1 + ((x * 7) % 3));
      } else {
        R(c, top[1], 0, 0, 16, 3);
        R(c, top[0], 0, 0, 16, 1);
        for (let x = 0; x < 16; x += 3) R(c, top[1], x, 3, 2, 1);
      }
    });
  }

  function ridgeStrip(scene, key, color, base, waves, opts = {}) {
    canvas(scene, key, 320, 100, (c, w, h) => {
      const r = rng(key.length * 31 + base);
      for (let x = 0; x < w; x++) {
        let y = base;
        for (const [a, k, p] of waves) y += a * Math.sin((2 * Math.PI * k * x) / w + (p || 0));
        y = Math.round(y);
        R(c, color, x, y, 1, h - y);
        if (opts.lip) R(c, opts.lip, x, y, 1, 2);
        if (opts.shade) R(c, opts.shade, x, Math.min(h, y + 14), 1, h);
      }
      if (opts.trees) {
        for (let i = 0; i < opts.trees; i++) {
          const tx = Math.floor((i + r() * 0.6) * (w / opts.trees));
          let y = base;
          for (const [a, k, p] of waves) y += a * Math.sin((2 * Math.PI * k * tx) / w + (p || 0));
          y = Math.round(y) + 2;
          R(c, opts.treeColor, tx - 3, y - 7, 7, 5);
          R(c, opts.treeColor, tx - 2, y - 9, 5, 2);
          R(c, opts.trunk || '#4a3020', tx, y - 2, 1, 3);
        }
      }
      if (opts.tents) {
        for (let i = 0; i < opts.tents; i++) {
          const tx = 20 + i * Math.floor(w / opts.tents);
          const ty = base + 6;
          for (let j = 0; j < 8; j++) R(c, opts.tentColor, tx - j, ty - 8 + j, j * 2 + 1, 1);
          R(c, opts.fire || '#f2a03a', tx, ty - 1, 1, 1);
        }
      }
    });
  }

  function sky(scene, key, w, h, top, bottom, extra) {
    canvas(scene, key, w, h, (c) => {
      const bands = 18;
      const A = Phaser.Display.Color.HexStringToColor(top), B = Phaser.Display.Color.HexStringToColor(bottom);
      for (let i = 0; i < bands; i++) {
        const col = Phaser.Display.Color.Interpolate.ColorWithColor(A, B, bands - 1, i);
        R(c, Phaser.Display.Color.RGBToString(col.r, col.g, col.b), 0, Math.floor((i * h) / bands), w, Math.ceil(h / bands) + 1);
      }
      if (extra) extra(c, w, h);
    }, false);
  }
  const blockCircle = (c, col, cx, cy, rad, s) => {
    for (let y = -rad; y <= rad; y += s) for (let x = -rad; x <= rad; x += s)
      if (x * x + y * y <= rad * rad) R(c, col, cx + x, cy + y, s, s);
  };
  const cloud = (c, x, y, s) => {
    R(c, '#ffffff', x, y, 60 * s, 12 * s);
    R(c, '#ffffff', x + 12 * s, y - 9 * s, 30 * s, 10 * s);
    R(c, '#ffffff', x + 30 * s, y - 15 * s, 18 * s, 8 * s);
    R(c, '#e3f1fb', x, y + 9 * s, 60 * s, 3 * s);
  };
  const starDots = (c, w, h, n, seed, maxY) => {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const b = r();
      c.fillStyle = b > 0.9 ? '#fff6c8' : b > 0.5 ? '#c9d4ff' : '#7c88c0';
      const s = b > 0.95 ? 3 : b > 0.7 ? 2 : 1;
      c.fillRect(Math.floor(r() * w), Math.floor(r() * (maxY || h)), s, s);
    }
  };

  function scenery(scene) {
    canvas(scene, 'house_a', 32, 28, (c) => {
      R(c, '#2b1b17', 0, 3, 32, 25); R(c, '#d9b47c', 1, 4, 30, 23); R(c, '#b88f5a', 22, 4, 9, 23);
      R(c, '#8c6a40', 0, 2, 32, 3); R(c, '#6b4521', 2, 0, 3, 3); R(c, '#6b4521', 26, 0, 3, 3);
      R(c, '#5c3a1e', 12, 15, 7, 12); R(c, '#3a2414', 13, 16, 5, 11);
      R(c, '#3a2414', 4, 9, 4, 4); R(c, '#3a2414', 24, 9, 4, 4);
    });
    canvas(scene, 'house_b', 40, 38, (c) => {
      R(c, '#2b1b17', 4, 0, 24, 14); R(c, '#e0c08a', 5, 1, 22, 13); R(c, '#3a2414', 9, 5, 4, 4); R(c, '#3a2414', 19, 5, 4, 4);
      R(c, '#2b1b17', 0, 12, 40, 26); R(c, '#cfa76f', 1, 13, 38, 25); R(c, '#a8834f', 30, 13, 9, 25);
      R(c, '#8c6a40', 0, 11, 40, 3); R(c, '#5c3a1e', 16, 24, 8, 14); R(c, '#3a2414', 4, 19, 5, 5); R(c, '#3a2414', 31, 19, 5, 5);
      R(c, '#c4452f', 0, 14, 40, 1);
    });
    canvas(scene, 'ziggurat', 90, 60, (c) => {
      const tiers = [[0, 44, 90, 16], [10, 30, 70, 14], [22, 18, 46, 12], [32, 8, 26, 10], [40, 0, 10, 8]];
      for (const [x, y, w, h] of tiers) { R(c, '#a78a6e', x, y, w, h); R(c, '#c9a98a', x, y, w, 2); R(c, '#8a7058', x + w - 6, y, 6, h); }
      R(c, '#7a6048', 41, 18, 8, 42);
      for (let i = 0; i < 6; i++) R(c, '#c9a98a', 41, 20 + i * 7, 8, 1);
    });
    canvas(scene, 'palm', 20, 36, (c) => {
      for (let y = 10; y < 36; y += 3) { R(c, '#8a5a32', 9 + Math.floor((36 - y) / 12), y, 3, 2); R(c, '#6b4521', 9 + Math.floor((36 - y) / 12), y + 2, 3, 1); }
      const g = '#4f8a35', l = '#7cc04a';
      R(c, g, 1, 6, 9, 2); R(c, g, 0, 8, 3, 3); R(c, g, 12, 6, 8, 2); R(c, g, 17, 8, 3, 3);
      R(c, l, 4, 3, 12, 3); R(c, g, 6, 1, 8, 2); R(c, l, 2, 5, 5, 1); R(c, l, 13, 5, 5, 1);
      R(c, '#6b4521', 9, 8, 3, 2);
    });
    canvas(scene, 'bush', 16, 9, (c) => {
      R(c, '#3b6b25', 1, 3, 14, 6); R(c, '#5e9e3c', 3, 1, 10, 6); R(c, '#8fd14f', 5, 2, 3, 2); R(c, '#8fd14f', 10, 3, 2, 1);
    });
    canvas(scene, 'tent', 40, 26, (c) => {
      for (let y = 0; y < 20; y++) R(c, '#4a3020', 20 - y - 2, 4 + y, y * 2 + 4, 1);
      for (let y = 0; y < 20; y += 4) R(c, '#7a5a3a', 0, 4 + y, 40, 1);
      R(c, '#2b1b17', 0, 24, 40, 2);
      R(c, '#1a100c', 16, 12, 8, 12);
      R(c, '#6b4521', 19, 0, 2, 5);
    });
    canvas(scene, 'tent_enemy', 44, 28, (c) => {
      for (let y = 0; y < 22; y++) {
        const w = y * 2 + 2;
        for (let x = 0; x < w; x++) R(c, Math.floor(x / 4) % 2 ? '#e6cf9a' : '#9a3328', 22 - y - 1 + x, 4 + y, 1, 1);
      }
      R(c, '#1a100c', 18, 14, 8, 12); R(c, '#2b1b17', 0, 26, 44, 2); R(c, '#68645e', 21, 0, 2, 5);
    });
    canvas(scene, 'oak', 64, 66, (c) => {
      R(c, '#5c3a1e', 28, 36, 9, 30); R(c, '#3a2414', 33, 36, 4, 30); R(c, '#5c3a1e', 22, 40, 7, 3); R(c, '#5c3a1e', 36, 44, 9, 3);
      const blobs = [[32, 24, 22, '#3b6b25'], [16, 30, 13, '#3b6b25'], [48, 30, 13, '#3b6b25'], [30, 18, 17, '#5e9e3c'], [18, 24, 10, '#5e9e3c'], [44, 22, 11, '#5e9e3c'], [26, 12, 8, '#8fd14f'], [40, 14, 6, '#8fd14f']];
      for (const [x, y, r, col] of blobs) blockCircle(c, col, x, y, r, 2);
      for (const [x, y] of [[20, 28], [40, 32], [30, 36], [48, 24], [14, 34]]) R(c, '#c4452f', x, y, 2, 2);
    });
    canvas(scene, 'altar', 16, 11, (c) => {
      const st = [[1, 6, 6, 5], [8, 6, 7, 5], [3, 1, 10, 5]];
      for (const [x, y, w, h] of st) { R(c, '#2b1b17', x, y, w, h); R(c, '#9b968e', x + 1, y + 1, w - 2, h - 2); R(c, '#cdc8bf', x + 1, y + 1, w - 2, 1); }
      R(c, '#f2a03a', 6, 0, 4, 1);
    });
    canvas(scene, 'gate_town', 22, 84, (c) => {
      R(c, '#2b1b17', 0, 0, 22, 84); R(c, '#9b968e', 1, 1, 20, 10);
      for (let x = 1; x < 21; x += 5) R(c, '#cdc8bf', x, 1, 3, 3);
      R(c, '#8a5a32', 2, 11, 18, 73);
      for (let x = 2; x < 20; x += 4) R(c, '#6b4521', x + 3, 11, 1, 73);
      for (const y of [20, 46, 72]) R(c, '#c48a1f', 2, y, 18, 2);
      R(c, '#f2c14e', 15, 44, 2, 4);
    });
    canvas(scene, 'palisade', 22, 88, (c) => {
      for (let x = 0; x < 22; x += 5) {
        R(c, '#2b1b17', x, 4, 5, 84); R(c, '#7a5030', x + 1, 5, 3, 83); R(c, '#9a6a40', x + 1, 5, 1, 83);
        R(c, '#2b1b17', x + 1, 1, 3, 3); R(c, '#7a5030', x + 2, 2, 1, 2); R(c, '#2b1b17', x + 2, 0, 1, 1);
      }
      for (const y of [24, 60]) R(c, '#4a3020', 0, y, 22, 3);
    });
    canvas(scene, 'cage', 28, 32, (c) => {
      R(c, '#2b1b17', 0, 0, 28, 4); R(c, '#6b4521', 1, 1, 26, 2);
      R(c, '#2b1b17', 0, 28, 28, 4); R(c, '#6b4521', 1, 29, 26, 2);
      for (let x = 1; x < 28; x += 4) { R(c, '#2b1b17', x, 4, 2, 24); R(c, '#8a5a32', x, 4, 1, 24); }
      R(c, '#c48a1f', 12, 14, 4, 5); R(c, '#2b1b17', 13, 16, 2, 2);
    });
    canvas(scene, 'cage_open', 28, 32, (c) => {
      R(c, '#2b1b17', 0, 28, 28, 4); R(c, '#6b4521', 1, 29, 26, 2);
      R(c, '#2b1b17', 0, 0, 2, 28); R(c, '#2b1b17', 26, 0, 2, 28);
    });
    for (let i = 0; i < 2; i++) {
      canvas(scene, 'fire' + i, 14, 14, (c) => {
        R(c, '#5c3a1e', 1, 11, 12, 2); R(c, '#3a2414', 3, 12, 8, 2);
        R(c, '#c4452f', 3, 4 + i, 8, 7 - i); R(c, '#f2a03a', 4, 6, 6, 5); R(c, '#ffe9a0', 6, 8 - i, 2, 3);
        R(c, '#f2a03a', i ? 8 : 5, 2, 2, 3);
      });
    }
    canvas(scene, 'sign', 18, 16, (c) => {
      R(c, '#2b1b17', 0, 0, 18, 9); R(c, '#c49a55', 1, 1, 16, 7); R(c, '#8a5a32', 2, 3, 12, 1); R(c, '#8a5a32', 2, 5, 9, 1);
      R(c, '#2b1b17', 8, 9, 3, 7); R(c, '#8a5a32', 9, 9, 1, 7);
    });
    canvas(scene, 'fence', 16, 10, (c) => {
      R(c, '#6b4521', 0, 3, 16, 2); R(c, '#6b4521', 0, 7, 16, 2);
      R(c, '#2b1b17', 2, 0, 3, 10); R(c, '#a8743c', 3, 1, 1, 9);
    });
    canvas(scene, 'swoosh', 16, 16, (c) => {
      c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(2, 8, 12, -1.1, 1.1); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 8, 11, -1.0, 1.0); c.stroke();
    });
    canvas(scene, 'shadow', 14, 4, (c) => {
      R(c, 'rgba(0,0,0,0.45)', 2, 0, 10, 4); R(c, 'rgba(0,0,0,0.45)', 0, 1, 14, 2);
    });
    canvas(scene, 'star_big', 15, 15, (c) => {
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.2 : 7.4; pts.push([7.5 + r * Math.cos(a), 7.5 + r * Math.sin(a)]); }
      c.fillStyle = '#c48a1f'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x + 0.6, y + 0.6) : c.moveTo(x + 0.6, y + 0.6)); c.fill();
      c.fillStyle = '#f2c14e'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.fill();
      R(c, '#ffe9a0', 6, 5, 3, 4); R(c, '#ffffff', 7, 6, 1, 2);
    });
    canvas(scene, 'basket', 22, 10, (c) => {
      R(c, '#2b1b17', 0, 0, 22, 2); R(c, '#c49a55', 1, 0, 20, 1);
      for (let y = 2; y < 9; y++) {
        const inset = Math.floor((y - 2) / 3);
        R(c, '#2b1b17', inset, y, 22 - inset * 2, 1);
        for (let x = inset + 1; x < 21 - inset; x++) R(c, (x + y) % 2 ? '#c49a55' : '#8a5a32', x, y, 1, 1);
      }
      R(c, '#2b1b17', 3, 9, 16, 1);
    });
    canvas(scene, 'rays', 300, 420, (c, w, h) => {
      for (let i = 0; i < 7; i++) {
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(255,233,160,0.55)'); g.addColorStop(1, 'rgba(255,233,160,0)');
        c.fillStyle = g; c.beginPath();
        const x0 = w / 2 + (i - 3) * 12, spread = (i - 3) * 40;
        c.moveTo(x0 - 8, 0); c.lineTo(x0 + 8, 0); c.lineTo(x0 + spread + 30, h); c.lineTo(x0 + spread - 30, h); c.fill();
      }
    }, false);
  }

  function medals(scene) {
    const icons = {
      trust: ['.....kk.', '.....kfk', 'kkkkkkffk', 'kffffffffk', 'kkkkkkffk', '.....kfk', '.....kk.'],
      peace: ['..ffff....', '.ffffffkk.', 'fffffffkek', 'ffffffkkkk', '.fffffff..', '..k.k.k...'],
      brave: ['........f', '.......f.', '......f..', '.....f...', '....f....', '...f.....', '..f......', '.f.......', 'f........'],
      stars: ['....f....', '...fff...', 'fffffffff', '.fffffff.', '..fffff..', '.ff...ff.', 'f.......f'],
    };
    const ribbons = { trust: ['#3f72b8', '#2a4b82'], peace: ['#5e9e3c', '#3b6b25'], brave: ['#c4452f', '#7a2420'], stars: ['#7b4c9c', '#4f2f6b'] };
    for (const k of Object.keys(icons)) {
      for (const lockedV of [false, true]) {
        const key = 'medal_' + k + (lockedV ? '_off' : '');
        canvas(scene, key, 26, 34, (c) => {
          const [r1, r2] = lockedV ? ['#68645e', '#4a4744'] : ribbons[k];
          for (let y = 0; y < 12; y++) { R(c, r1, 4 + Math.floor(y / 3), y, 6, 1); R(c, r2, 16 - Math.floor(y / 3), y, 6, 1); }
          const gold = lockedV ? '#8a8680' : '#f2c14e', dark = lockedV ? '#5a5652' : '#c48a1f', lite = lockedV ? '#aaa69f' : '#ffe9a0';
          blockCircle(c, '#2b1b17', 13, 22, 11, 1); blockCircle(c, dark, 13, 22, 10, 1); blockCircle(c, gold, 13, 21, 8, 1);
          R(c, lite, 8, 15, 4, 2);
          const ic = norm(icons[k]); const ox = 13 - Math.floor(ic[0].length / 2), oy = 21 - Math.floor(ic.length / 2);
          for (let y = 0; y < ic.length; y++) for (let x = 0; x < ic[y].length; x++) {
            const ch = ic[y][x]; if (ch === '.') continue;
            R(c, ch === 'f' ? (lockedV ? '#5a5652' : '#8a4b2a') : ch === 'e' ? '#f2c14e' : '#2b1b17', ox + x, oy + y, 1, 1);
          }
        });
      }
    }
  }

  function backgrounds(scene) {
    sky(scene, 'sky_day', 960, 540, '#5d9bd6', '#f7d8a8', (c) => { blockCircle(c, '#fff3c2', 780, 110, 42, 6); blockCircle(c, '#fffbe6', 780, 110, 30, 6); cloud(c, 120, 90, 2); cloud(c, 480, 150, 1.5); });
    sky(scene, 'sky_pasture', 960, 540, '#6ab8ec', '#e8f7ff', (c) => { cloud(c, 80, 70, 2); cloud(c, 520, 50, 1.6); cloud(c, 760, 120, 1.2); blockCircle(c, '#fff8d0', 880, 60, 30, 6); });
    sky(scene, 'sky_dusk', 960, 540, '#1b143c', '#b0567a', (c) => { starDots(c, 960, 540, 120, 7, 260); blockCircle(c, '#f3ead6', 160, 90, 26, 4); blockCircle(c, '#1b143c', 172, 82, 22, 4); });
    sky(scene, 'sky_night', 960, 540, '#050820', '#1d2a5c', (c) => { starDots(c, 960, 540, 260, 11, 380); });
    sky(scene, 'sky_night_big', 1200, 700, '#03051a', '#1d2a5c');
    canvas(scene, 'starfield_big', 1200, 700, (c, w, h) => { starDots(c, w, h, 2600, 99, h * 0.78); }, true);

    ridgeStrip(scene, 'far_desert', '#c7a0b4', 52, [[10, 2, 0.5], [6, 5, 1.2], [3, 11, 2]], { lip: '#d8b8c6' });
    ridgeStrip(scene, 'near_desert', '#e0b56e', 70, [[8, 3, 0], [4, 7, 1.7]], { lip: '#f0cf8e', shade: '#cfa05c' });
    ridgeStrip(scene, 'near_green', '#6fae48', 66, [[10, 3, 0.3], [5, 8, 2]], { lip: '#8fd14f', shade: '#5a9a3a', trees: 9, treeColor: '#3b6b25' });
    ridgeStrip(scene, 'far_pasture', '#9cc97a', 48, [[9, 2, 0], [5, 6, 1]], { lip: '#b8e09a' });
    ridgeStrip(scene, 'near_pasture', '#74b84e', 70, [[6, 3, 1], [3, 9, 0]], { lip: '#8fd14f', trees: 6, treeColor: '#4f8a35' });
    ridgeStrip(scene, 'far_dusk', '#4a2f6a', 50, [[12, 2, 0], [6, 5, 1]], { lip: '#5c3d80' });
    ridgeStrip(scene, 'near_dusk', '#2e1f45', 70, [[6, 3, 2], [3, 8, 0]], { tents: 5, tentColor: '#1d1430', fire: '#f2a03a' });
    ridgeStrip(scene, 'far_night', '#141a3c', 58, [[10, 2, 0.4], [5, 6, 1.3]], { lip: '#1e2650' });

    groundTex(scene, 'ground_desert', ['#f6e2a8', '#ecd08a'], '#d2a960', '#b08548', '#a87c3f');
    groundTex(scene, 'ground_green', null, '#8a5a32', '#6b4521', '#5c3a1e', ['#8fd14f', '#5e9e3c']);
    groundTex(scene, 'ground_camp', ['#b29aa6', '#8a7484'], '#5e4658', '#46333f', '#3a2a36');
    groundTex(scene, 'ground_night', ['#3a4266', '#2a3050'], '#1c2038', '#141729', '#232846');

    canvas(scene, 'plat_stone', 16, 8, (c) => {
      R(c, '#2b1b17', 0, 0, 16, 8); R(c, '#9b968e', 0, 1, 16, 6); R(c, '#cdc8bf', 0, 1, 16, 1); R(c, '#68645e', 0, 6, 16, 1);
      R(c, '#2b1b17', 0, 1, 1, 6); R(c, '#68645e', 8, 2, 1, 4);
    });
    canvas(scene, 'plat_wood', 16, 8, (c) => {
      R(c, '#2b1b17', 0, 0, 16, 8); R(c, '#a8743c', 0, 1, 16, 6); R(c, '#c49a55', 0, 1, 16, 1); R(c, '#6b4521', 0, 4, 16, 1);
      R(c, '#2b1b17', 0, 1, 1, 6); R(c, '#6b4521', 3, 2, 1, 1); R(c, '#6b4521', 12, 5, 1, 1);
    });
    canvas(scene, 'rockwall', 16, 16, (c) => {
      R(c, '#2b1b17', 0, 0, 16, 16); R(c, '#8a7a6a', 0, 0, 15, 7); R(c, '#8a7a6a', 0, 8, 7, 8); R(c, '#8a7a6a', 8, 8, 8, 8);
      R(c, '#a8988a', 0, 0, 15, 1); R(c, '#a8988a', 0, 8, 7, 1); R(c, '#a8988a', 8, 8, 8, 1);
    });
    canvas(scene, 'water', 16, 8, (c) => {
      R(c, '#2f7fbf', 0, 0, 16, 8); R(c, '#5fb3e8', 0, 0, 16, 3); R(c, '#bfe6ff', 2, 0, 4, 1); R(c, '#bfe6ff', 10, 1, 3, 1);
    });
  }

  function generate(scene) {
    const frames = personFrames();
    for (const [name, swap] of Object.entries(PEOPLE)) {
      for (const [fk, rows] of Object.entries(frames)) {
        let r = rows;
        if (name === 'guard') {
          r = rows.map(s => s.split(''));
          if (fk !== 'attack' && fk !== 'throw') { r[8][19] = 'o'; r[9][19] = 'o'; r[7][19] = 'f'; r[6][19] = 'f'; }
          r = r.map(s => s.join(''));
        }
        pix(scene, `${name}_${fk}`, r, swap);
      }
    }
    for (const [k, rows] of Object.entries(SHEEP)) pix(scene, 'sheep_' + k, rows);
    for (const [k, rows] of Object.entries(SHEEP)) pix(scene, 'lsheep_' + k, rows, { w: 'n', W: 'm' });
    for (const [k, rows] of Object.entries(SCORP)) pix(scene, 'scorp_' + k, rows);
    pix(scene, 'idol', IDOL);
    pix(scene, 'idol_gold', IDOL, { m: 'y', M: 'Y', n: 'a', y: 'r' });
    for (const [k, rows] of Object.entries(SMALL)) pix(scene, k, rows);
    pix(scene, 'flag_on', SMALL.flag, { r: 'g', y: 'a' });
    backgrounds(scene);
    scenery(scene);
    medals(scene);

    const A = scene.anims;
    for (const name of Object.keys(PEOPLE)) {
      if (!A.exists(name + '_walk')) A.create({ key: name + '_walk', frames: [{ key: name + '_walk1' }, { key: name + '_idle' }, { key: name + '_walk2' }, { key: name + '_idle' }], frameRate: 9, repeat: -1 });
    }
    if (!A.exists('sheep_walk')) A.create({ key: 'sheep_walk', frames: [{ key: 'sheep_0' }, { key: 'sheep_1' }], frameRate: 6, repeat: -1 });
    if (!A.exists('lsheep_walk')) A.create({ key: 'lsheep_walk', frames: [{ key: 'lsheep_0' }, { key: 'lsheep_1' }], frameRate: 6, repeat: -1 });
    if (!A.exists('sheep_graze')) A.create({ key: 'sheep_graze', frames: [{ key: 'sheep_0' }, { key: 'sheep_eat' }], frameRate: 2, repeat: -1 });
    if (!A.exists('scorp_walk')) A.create({ key: 'scorp_walk', frames: [{ key: 'scorp_0' }, { key: 'scorp_1' }], frameRate: 6, repeat: -1 });
    if (!A.exists('fire')) A.create({ key: 'fire', frames: [{ key: 'fire0' }, { key: 'fire1' }], frameRate: 6, repeat: -1 });
  }

  return { generate, rng };
})();
