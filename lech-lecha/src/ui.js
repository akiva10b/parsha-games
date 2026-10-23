/* Shared interface pieces: text styles, the in-level HUD, speech
   bubbles, banners, keycaps, particle bursts and the BaseLevel class
   every playable level extends. */

const W = 960, H = 540;
const FONT = '"Fredoka", "Trebuchet MS", "Arial Rounded MT Bold", sans-serif';
const DISPLAY = '"Lilita One", "Fredoka", "Arial Black", sans-serif';
const INK = '#2b1b17', CREAM = '#f3ead6', GOLD = '#f2c14e';

const UI = {
  text(scene, x, y, str, size = 24, color = CREAM, opts = {}) {
    const t = scene.add.text(x, y, str, Object.assign({
      fontFamily: opts.display ? DISPLAY : FONT,
      fontSize: size + 'px',
      fontStyle: opts.display ? 'normal' : (opts.weight || '600'),
      color,
      stroke: opts.stroke === undefined ? INK : opts.stroke,
      strokeThickness: opts.strokeThickness === undefined ? Math.max(3, Math.round(size / 6)) : opts.strokeThickness,
      align: opts.align || 'center',
      wordWrap: opts.wrap ? { width: opts.wrap, useAdvancedWrap: true } : undefined,
      resolution: 2,
    }, opts.style || {}));
    t.setOrigin(opts.ox === undefined ? 0.5 : opts.ox, opts.oy === undefined ? 0.5 : opts.oy);
    return t;
  },

  panel(scene, x, y, w, h, fill = 0x2b1b17, alpha = 0.82, radius = 14) {
    const g = scene.add.graphics();
    g.fillStyle(fill, alpha); g.fillRoundedRect(x, y, w, h, radius);
    g.lineStyle(3, 0xf2c14e, 0.9); g.strokeRoundedRect(x, y, w, h, radius);
    return g;
  },

  keycap(scene, x, y, label) {
    const w = Math.max(44, 18 + label.length * 15), h = 44;
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0x8a7a6a, 1); g.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 8);
    g.fillStyle(0xf3ead6, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h - 2, 8);
    g.lineStyle(2, 0x2b1b17, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h + 3, 8);
    c.add(g);
    c.add(UI.text(scene, 0, -1, label, 22, INK, { strokeThickness: 0, weight: '700' }));
    c.width = w;
    return c;
  },

  /* Rows like [{keys:['←','→'], label:'Walk'}] drawn as keycaps. */
  controls(scene, x, y, rows) {
    const c = scene.add.container(x, y);
    rows.forEach((row, i) => {
      let cx = 0;
      const yy = i * 58;
      row.keys.forEach((k) => {
        const cap = UI.keycap(scene, 0, yy, k);
        cap.x = cx + cap.width / 2; cx += cap.width + 8;
        c.add(cap);
      });
      c.add(UI.text(scene, 150, yy, row.label, 24, CREAM, { ox: 0 }));
    });
    return c;
  },

  bubble(scene, x, y, str, ms = 2200, opts = {}) {
    const c = scene.add.container(x, y).setDepth(opts.depth || 900);
    const t = UI.text(scene, 0, 0, str, opts.size || 18, INK, { strokeThickness: 0, wrap: 240, weight: '700' });
    const w = t.width + 24, h = t.height + 16;
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.fillTriangle(-8, h / 2 - 1, 8, h / 2 - 1, 0, h / 2 + 10);
    g.lineStyle(2, 0x2b1b17, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    c.add([g, t]);
    c.y -= h / 2 + 10;
    if (opts.follow) {
      const off = c.y - y;
      const ev = () => { if (opts.follow.active) c.setPosition(opts.follow.x, opts.follow.y + off); };
      scene.events.on('update', ev);
      c.once('destroy', () => scene.events.off('update', ev));
    }
    c.setScale(0.4); scene.tweens.add({ targets: c, scale: 1, duration: 180, ease: 'Back.easeOut' });
    if (ms) scene.time.delayedCall(ms, () => scene.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.destroy() }));
    return c;
  },

  banner(scene, str, color = GOLD, ms = 1800, size = 54) {
    const t = UI.text(scene, W / 2, H / 2 - 40, str, size, color, { display: true, strokeThickness: 10 });
    t.setScrollFactor(0).setDepth(2000).setScale(0.2);
    scene.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.easeOut' });
    scene.time.delayedCall(ms, () => scene.tweens.add({ targets: t, alpha: 0, y: t.y - 30, duration: 400, onComplete: () => t.destroy() }));
    return t;
  },

  floatText(scene, x, y, str, color = GOLD, size = 22) {
    const t = UI.text(scene, x, y, str, size, color).setDepth(950);
    scene.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  },

  burst(scene, x, y, key, n = 12, opts = {}) {
    const e = scene.add.particles(x, y, key, Object.assign({
      speed: { min: 80, max: 260 }, angle: { min: 0, max: 360 }, lifespan: { min: 400, max: 800 },
      scale: { start: PX, end: 0 }, gravityY: 300, emitting: false,
    }, opts));
    e.setDepth(opts.depth || 800);
    e.explode(n);
    scene.time.delayedCall(1200, () => e.destroy());
    return e;
  },

  /* Clickable text button; `focus` styling is driven by the menu. */
  button(scene, x, y, label, onClick, w = 300) {
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    const t = UI.text(scene, 0, 0, label, 28, CREAM, { weight: '700' });
    c.add([g, t]); c.label = t; c.g = g; c.w = w;
    c.setSize(w, 56).setInteractive({ useHandCursor: true });
    c.draw = (focused) => {
      g.clear();
      g.fillStyle(focused ? 0xf2c14e : 0x2b1b17, focused ? 1 : 0.7); g.fillRoundedRect(-w / 2, -28, w, 56, 14);
      g.lineStyle(3, focused ? 0xffffff : 0xf2c14e, 1); g.strokeRoundedRect(-w / 2, -28, w, 56, 14);
      t.setColor(focused ? INK : CREAM); t.setStroke(focused ? '#ffe9a0' : INK, focused ? 0 : 5);
    };
    c.draw(false);
    c.on('pointerdown', () => { Sfx.click(); onClick(); });
    return c;
  },
};

function soundIcon(scene, x, y) {
  const img = scene.add.image(x, y, Save.data.sound ? 'sound' : 'mute').setScale(PX).setScrollFactor(0).setDepth(1500).setInteractive({ useHandCursor: true });
  const refresh = () => img.setTexture(Save.data.sound ? 'sound' : 'mute');
  img.on('pointerdown', () => { toggleSound(); refresh(); });
  img.refresh = refresh;
  return img;
}
function toggleSound() {
  const on = !Save.data.sound;
  Snd.setSound(on);
  Narrator.setVoice(on);
}

class Hud {
  constructor(scene, title, opts = {}) {
    this.scene = scene;
    this.maxHearts = opts.hearts || 3;
    this.hearts = [];
    for (let i = 0; i < this.maxHearts; i++) {
      this.hearts.push(scene.add.image(34 + i * 44, 34, 'heart').setScale(4).setScrollFactor(0).setDepth(1500));
    }
    this.title = UI.text(scene, W / 2, 26, title, 26, CREAM, { display: true, strokeThickness: 6 }).setScrollFactor(0).setDepth(1500);
    this.score = UI.text(scene, 24, 68, 'Score 0', 20, GOLD, { ox: 0 }).setScrollFactor(0).setDepth(1500);
    this.icon = soundIcon(scene, W - 28, H - 26);
    this.pauseHint = UI.text(scene, W - 54, H - 26, 'P = pause', 15, CREAM, { ox: 1 }).setScrollFactor(0).setDepth(1500).setAlpha(0.8);
    this.msg = null;
  }
  setHearts(n) { this.hearts.forEach((h, i) => h.setTexture(i < n ? 'heart' : 'heart_empty')); }
  setScore(n) { this.score.setText('Score ' + n); }
  say(str, color = CREAM, ms = 2400) {
    if (this.msg) this.msg.destroy();
    const t = UI.text(this.scene, W / 2, 140, str, 26, color, { strokeThickness: 7, wrap: 760 }).setScrollFactor(0).setDepth(1600);
    this.msg = t;
    t.setAlpha(0); this.scene.tweens.add({ targets: t, alpha: 1, duration: 150 });
    this.scene.time.delayedCall(ms, () => { if (t.active) this.scene.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() }); });
  }
}

class BaseLevel extends Phaser.Scene {
  initBase(levelN, title) {
    this.levelN = levelN;
    this.level = LEVELS[levelN - 1];
    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', space: 'SPACE', x: 'X',
      enter: 'ENTER', p: 'P', m: 'M', esc: 'ESC', a: 'A', d: 'D', w: 'W', z: 'Z',
    });
    this.hp = 3; this.score = 0; this.invuln = 0; this.ended = false;
    this.hud = new Hud(this, title);
    this.keys.p.on('down', () => this.pauseGame());
    this.keys.esc.on('down', () => this.pauseGame());
    this.keys.m.on('down', () => { toggleSound(); this.hud.icon.refresh(); });
    this.game.events.off('blur', this.onBlur, this);
    this.game.events.on('blur', this.onBlur, this);
    this.events.once('shutdown', () => { this.game.events.off('blur', this.onBlur, this); Narrator.stop(); });
    this.lastSpoken = {};
  }
  onBlur() { if (this.scene.isActive() && !this.ended) this.pauseGame(); }
  pauseGame() {
    if (this.ended || !this.scene.isActive()) return;
    Narrator.stop();
    this.scene.launch('Pause', { from: this.scene.key });
    this.scene.pause();
  }
  addScore(n, x, y) {
    this.score += n; this.hud.setScore(this.score);
    if (x !== undefined) UI.floatText(this, x, y, '+' + n);
  }
  /* Speak a line (and show it), at most once per `gap` ms per id. */
  tell(id, str, color, gap = 6000) {
    const now = this.time.now;
    if (this.lastSpoken[id] && now - this.lastSpoken[id] < gap) return;
    this.lastSpoken[id] = now;
    this.hud.say(str, color);
    Narrator.say(str);
  }
  dirLeft() { return this.keys.left.isDown || this.keys.a.isDown; }
  dirRight() { return this.keys.right.isDown || this.keys.d.isDown; }
  jumpHeld() { return this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown || this.keys.z.isDown; }
  jumpPressed() {
    const J = Phaser.Input.Keyboard.JustDown;
    return J(this.keys.space) | J(this.keys.up) | J(this.keys.w) | J(this.keys.z);
  }
  actionPressed() { return Phaser.Input.Keyboard.JustDown(this.keys.x); }

  /* Lose a heart. Returns true if the hit counted. */
  hurt() {
    if (this.invuln > 0 || this.ended) return false;
    this.hp--; this.hud.setHearts(this.hp);
    Sfx.hurt(); this.cameras.main.shake(180, 0.008);
    this.invuln = 1500;
    if (this.hp <= 0) {
      this.hp = 3;
      this.time.delayedCall(350, () => {
        this.hud.setHearts(this.hp);
        UI.banner(this, LINES.tryAgain, CREAM, 1500, 46);
        Narrator.say(LINES.tryAgain);
        this.outOfHearts();
      });
    }
    return true;
  }
  outOfHearts() {}

  complete() {
    if (this.ended) return;
    this.ended = true;
    Save.complete(this.levelN, this.level.medal, this.score);
    const nextLevel = LEVELS[this.levelN];
    const next = nextLevel ? { scene: 'Story', data: { id: nextLevel.story } } : { scene: 'Story', data: { id: 'ending' } };
    this.time.delayedCall(600, () => {
      this.scene.launch('MedalPop', { from: this.scene.key, medal: this.level.medal, name: this.level.medalName, score: this.score, next });
    });
  }
}
