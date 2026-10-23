/* Story cards between levels. Each page draws a small living scene,
   shows a subtitle and reads it aloud. With the voice on, pages turn
   by themselves after the line is read; "how to play" pages wait for
   Enter. Enter / Space / click turns the page, S skips the story. */

const STORY_BGS = {
  charan:  { sky: 'sky_day',     layers: [['far_desert', 380]], ground: 'ground_desert', town: true },
  desert:  { sky: 'sky_day',     layers: [['far_desert', 350], ['near_desert', 410]], ground: 'ground_desert' },
  canaan:  { sky: 'sky_day',     layers: [['far_pasture', 350], ['near_green', 410]], ground: 'ground_green' },
  pasture: { sky: 'sky_pasture', layers: [['far_pasture', 350], ['near_pasture', 410]], ground: 'ground_green' },
  dusk:    { sky: 'sky_dusk',    layers: [['far_dusk', 350], ['near_dusk', 410]], ground: 'ground_camp' },
  night:   { sky: 'sky_night',   layers: [['far_night', 400]], ground: 'ground_night' },
};
const FEET = 400, SS = 4; // story sprites stand on y=400 at 4x

class Story extends Phaser.Scene {
  constructor() { super('Story'); }

  init(data) { this.def = STORY[data.id]; this.storyId = data.id; this.page = -1; this.lastTurn = -1e9; this.leaving = false; }

  create() {
    Music.setSour(false);
    Music.play(this.def.music || 'story');
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.stage = this.add.container(0, 0);
    this.scrollers = [];
    this.subPanel = UI.panel(this, 40, 428, W - 80, 100).setDepth(500);
    this.sub = UI.text(this, W / 2, 478, '', 24, CREAM, { wrap: W - 140, strokeThickness: 0 }).setDepth(501);
    this.badge = UI.text(this, 64, 426, '', 18, INK, { ox: 0, strokeThickness: 0, weight: '700', style: { backgroundColor: '#f2c14e', padding: { x: 10, y: 4 } } }).setDepth(502);
    this.prompt = UI.text(this, W - 60, 516, 'Enter ▶', 18, GOLD, { ox: 1, strokeThickness: 4 }).setDepth(502);
    this.tweens.add({ targets: this.prompt, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 });
    UI.text(this, W - 20, 20, 'S = skip story', 15, CREAM, { ox: 1, oy: 0, strokeThickness: 4 }).setDepth(502).setAlpha(0.8);
    this.dots = this.add.container(W / 2, 418).setDepth(502);
    soundIcon(this, 28, 28);

    const k = this.input.keyboard;
    k.on('keydown-ENTER', () => this.next());
    k.on('keydown-SPACE', () => this.next());
    k.on('keydown-RIGHT', () => this.next());
    k.on('keydown-S', () => this.finish());
    k.on('keydown-ESC', () => { Narrator.stop(); this.scene.start('Menu'); });
    this.input.on('pointerdown', (p, objs) => { if (!objs.length) this.next(); });
    this.events.once('shutdown', () => Narrator.stop());
    this.next();
  }

  update(t, dt) { for (const s of this.scrollers) s.obj.tilePositionX += dt * s.speed; }

  next() {
    if (this.leaving) return;
    if (this.time.now - (this.lastTurn || 0) < 250) return;
    this.lastTurn = this.time.now;
    this.page++;
    if (this.page >= this.def.pages.length) return this.finish();
    if (this.autoTimer) this.autoTimer.remove();
    Sfx.click();
    this.showPage(this.def.pages[this.page]);
  }

  finish() {
    if (this.leaving) return;
    this.leaving = true;
    Narrator.stop();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.def.next.scene, this.def.next.data || {}));
  }

  showPage(pg) {
    this.tweens.killTweensOf(this.stage.list);
    this.time.removeAllEvents();
    this.stage.removeAll(true);
    this.scrollers = [];
    this.buildBg(STORY_BGS[pg.bg]);
    (STAGES[pg.stage] || (() => {}))(this, pg);

    this.sub.setText(pg.text);
    this.badge.setText(pg.badge || '').setVisible(!!pg.badge);
    this.prompt.setText(pg.wait ? 'Press Enter to start! ▶' : 'Enter ▶');
    this.dots.removeAll(true);
    const n = this.def.pages.length;
    for (let i = 0; i < n; i++) this.dots.add(this.add.circle((i - (n - 1) / 2) * 18, 0, 5, i === this.page ? 0xf2c14e : 0xf3ead6, i === this.page ? 1 : 0.5));

    const myPage = this.page;
    Narrator.say(pg.say || pg.text, () => {
      if (pg.wait || !Save.data.voice || this.page !== myPage || this.leaving) return;
      this.autoTimer = this.time.delayedCall(1300, () => { if (this.page === myPage) this.next(); });
    });
  }

  buildBg(bg) {
    const s = this.stage;
    s.add(this.add.image(0, 0, bg.sky).setOrigin(0, 0));
    for (const [key, y] of bg.layers) s.add(this.add.tileSprite(0, y, W, 300, key).setOrigin(0, 1).setTileScale(PX));
    if (bg.town) {
      s.add(this.add.image(760, FEET + 4, 'ziggurat').setOrigin(0.5, 1).setScale(PX).setAlpha(0.9));
      s.add(this.add.image(110, FEET + 4, 'house_b').setOrigin(0.5, 1).setScale(PX));
      s.add(this.add.image(900, FEET + 4, 'house_a').setOrigin(0.5, 1).setScale(PX));
    }
    const g = this.add.tileSprite(0, FEET, W, 160, bg.ground).setOrigin(0, 0).setTileScale(PX);
    s.add(g);
    this.groundStrip = g;
  }

  /* helpers used by STAGES */
  person(who, x, flip = false, walk = false) {
    const p = this.add.sprite(x, FEET, who + '_idle').setOrigin(0.5, 1).setScale(SS).setFlipX(flip);
    if (walk) p.anims.play(who + '_walk');
    this.stage.add(p);
    return p;
  }
  sheep(x, flip = false, mode = 'graze', lot = false) {
    const pre = lot ? 'lsheep' : 'sheep';
    const sh = this.add.sprite(x, FEET + 2, pre + '_0').setOrigin(0.5, 1).setScale(PX).setFlipX(flip);
    if (mode === 'walk') sh.anims.play(pre + '_walk');
    else if (mode === 'graze') { sh.anims.play('sheep_graze'); sh.anims.msPerFrame = 400 + Math.random() * 500; }
    this.stage.add(sh);
    return sh;
  }
  img(key, x, y, scale = PX, ox = 0.5, oy = 1) {
    const i = this.add.image(x, y, key).setOrigin(ox, oy).setScale(scale);
    this.stage.add(i);
    return i;
  }
  rays(x) {
    const r = this.img('rays', x, -20, 1, 0.5, 0).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: r, alpha: 0.4, yoyo: true, repeat: -1, duration: 1400 });
    return r;
  }
  sparkles(x, y, w, h, key = 'tiny', n = 14) {
    for (let i = 0; i < n; i++) {
      const s = this.img(key, x + Math.random() * w, y + Math.random() * h, PX, 0.5, 0.5).setAlpha(0);
      this.tweens.add({ targets: s, alpha: 1, yoyo: true, repeat: -1, duration: 600 + Math.random() * 900, delay: Math.random() * 1500 });
    }
  }
  say(x, y, str, delay = 300) {
    this.time.delayedCall(delay, () => { if (this.stage.active) this.stage.add(UI.bubble(this, x, y, str, 0)); });
  }
  scroll(speedGround = 0.08) {
    this.scrollers.push({ obj: this.groundStrip, speed: speedGround });
    this.stage.list.filter(o => o.type === 'TileSprite' && o !== this.groundStrip).forEach((o, i) => this.scrollers.push({ obj: o, speed: speedGround * (i ? 0.4 : 0.15) }));
  }
}

const STAGES = {
  family(s) {
    s.img('tent', 210, FEET + 4);
    s.person('av', 420); s.person('sarai', 500, true); s.person('lot', 590, true);
    s.sheep(700); s.sheep(770, true); s.sheep(840);
  },
  calling(s) {
    STAGES.family(s);
    s.rays(430);
    s.sparkles(300, 40, 260, 220);
  },
  idols(s) {
    const av = s.person('av', 260);
    const xs = [420, 520, 620, 720];
    const idols = xs.map((x, i) => s.img(i % 2 ? 'idol_gold' : 'idol', x, FEET + 2, SS));
    s.img('rubble', 820, FEET + 2, PX * 2); s.img('rubble', 840, FEET + 2, PX * 1.5); s.img('goldrubble', 860, FEET + 2, PX * 2);
    s.time.addEvent({ delay: 800, loop: true, callback: () => {
      if (!av.active) return;
      av.setTexture(av.texture.key === 'av_attack' ? 'av_idle' : 'av_attack');
      if (av.texture.key === 'av_attack') s.tweens.add({ targets: idols[0], angle: { from: -4, to: 4 }, yoyo: true, duration: 80, repeat: 1 });
    } });
  },
  walking(s) {
    s.sheep(180, false, 'walk'); s.sheep(240, false, 'walk');
    s.person('sarai', 330, false, true); s.person('av', 420, false, true); s.person('lot', 510, false, true);
    s.scroll(0.06);
  },
  flock(s) {
    s.person('av', 260); s.person('lot', 700, true);
    [340, 400, 460, 380].forEach((x, i) => s.sheep(x, i % 2 === 1));
    [600, 780, 840, 900].forEach((x, i) => s.sheep(x, i % 2 === 0, 'graze', true));
  },
  argue(s) {
    s.person('shep', 330); s.person('lotshep', 520, true);
    [700, 760, 820, 880].forEach((x) => s.img('wheat', x, FEET + 2, SS));
    s.sheep(740, false, 'graze', true); s.sheep(850, true, 'graze', true);
    s.say(600, FEET - 104, 'Our sheep can eat anywhere!', 200);
    s.say(280, FEET - 150, 'That field isn’t yours!', 1800);
  },
  careful(s) {
    s.img('fence', 640, FEET + 2, SS); s.img('fence', 700, FEET + 2, SS);
    [760, 820, 880].forEach((x) => s.img('wheat', x, FEET + 2, SS));
    s.person('shep', 470, true);
    s.sheep(380, true); s.sheep(300, true, 'walk'); s.sheep(230, true);
    s.say(470, FEET - 100, 'This way, little sheep!', 400);
  },
  talk(s) {
    s.person('av', 400); s.person('lot', 560, true);
    s.sheep(200); s.sheep(760, true, 'graze', true);
    s.say(400, FEET - 100, 'Let’s not fight!', 400);
  },
  lotLeaves(s) {
    s.person('av', 200);
    const lot = s.person('lot', 470, false, true);
    const sh = [s.sheep(400, false, 'walk', true), s.sheep(340, false, 'walk', true)];
    s.tweens.add({ targets: [lot, ...sh], x: '+=480', duration: 7000 });
  },
  promise(s) {
    s.person('av', 480);
    s.rays(480);
    s.sparkles(60, 200, 840, 160, 'tiny', 18);
  },
  captured(s) {
    s.img('tent_enemy', 780, FEET + 4); s.stage.add(s.add.sprite(880, FEET + 2, 'fire0').setOrigin(0.5, 1).setScale(PX).play('fire'));
    s.person('guard', 360); s.person('lot', 460, true); s.person('guard', 560, true);
    s.say(460, FEET - 100, 'Help!', 400);
  },
  army(s) {
    s.person('av', 600, false, true);
    [510, 430, 350, 270, 190].forEach((x) => s.person('shep', x, false, true));
    s.scroll(0.08);
  },
  home(s) {
    s.img('tent', 160, FEET + 4);
    s.person('sarai', 300); s.person('av', 390); s.person('lot', 480, true);
    s.sheep(620); s.sheep(700, true); s.sheep(780, false, 'graze', true);
    s.sparkles(250, 220, 300, 80, 'tiny', 8);
  },
  worried(s) {
    s.img('tent', 280, FEET + 4);
    s.person('av', 470, true);
    s.say(470, FEET - 100, 'Who will carry on my family?', 400);
  },
  starsky(s) {
    s.person('av', 480);
    for (let i = 0; i < 26; i++) {
      const big = i < 6;
      const st = s.img(big ? 'star_big' : 'star', 40 + Math.random() * 880, 30 + Math.random() * 230, big ? 2 : PX, 0.5, 0.5).setAlpha(0.2);
      s.tweens.add({ targets: st, alpha: 1, yoyo: true, repeat: -1, duration: 700 + Math.random() * 1200, delay: Math.random() * 1200 });
    }
  },
  names(s) {
    s.person('av', 400); s.person('sarai', 520, true);
    s.sparkles(300, 220, 340, 120, 'tiny', 12);
    const a = UI.text(s, W / 2, 110, 'Avram  →  Avraham', 44, GOLD, { display: true, strokeThickness: 9 });
    const b = UI.text(s, W / 2, 168, 'Sarai  →  Sarah', 38, CREAM, { display: true, strokeThickness: 8 });
    s.stage.add([a, b]);
    a.setScale(0); b.setScale(0);
    s.tweens.add({ targets: a, scale: 1, duration: 500, ease: 'Back.easeOut', delay: 300 });
    s.tweens.add({ targets: b, scale: 1, duration: 500, ease: 'Back.easeOut', delay: 1200 });
  },
  baby(s) {
    s.img('tent', 300, FEET + 4);
    s.person('av', 480); s.person('sarai', 560, true);
    for (let i = 0; i < 8; i++) {
      const h = s.img('heart', 450 + Math.random() * 140, FEET - 90, 2, 0.5, 0.5);
      s.tweens.add({ targets: h, y: FEET - 220 - Math.random() * 60, alpha: 0, duration: 2200, repeat: -1, delay: i * 300 });
    }
  },
  howto(s, pg) {
    const box = UI.panel(s, 150, 60, 660, 300, 0x2b1b17, 0.88);
    s.stage.add(box);
    s.stage.add(UI.text(s, W / 2, 98, 'How to play', 36, GOLD, { display: true }));
    s.stage.add(UI.controls(s, 200, 160, HOWTO[pg.howto]));
    s.stage.add(UI.text(s, W / 2, 334, 'P = pause    M = sound on / off', 17, CREAM, { strokeThickness: 0 }).setAlpha(0.85));
    const demo = {
      journey() { s.person('av', 660).setY(300).setScale(PX); s.img('idol', 730, 300, PX); },
      shepherds() { s.person('shep', 640).setY(300).setScale(PX); s.img('wool', 690, 200, PX); s.sheep(730, true).setY(190); },
      rescue() { const a = s.person('av', 640).setY(300).setScale(PX); a.setTexture('av_attack'); s.person('guard', 730, true).setY(300).setScale(PX); },
      stars() { s.person('av', 690).setY(300).setScale(PX); s.img('basket', 690, 232, PX); s.img('star_big', 700, 170, 2.5, 0.5, 0.5); },
    };
    demo[pg.howto]();
  },
};
