/* Level 4: Count the Stars. Avram holds a basket under the night sky;
   catch 30 stars (big sparkly ones count 3). Every catch lights a new
   star in the sky. At 30 the camera pulls back to show a sky too full
   to count. Missing stars costs nothing. */

const STAR_GOAL = 30;

class Stars extends BaseLevel {
  constructor() { super('Stars'); }

  create() {
    this.initBase(4, 'Level 4 · Count the Stars');
    this.milestones = {};
    Music.setSour(false);
    Music.play('stars');
    this.cameras.main.fadeIn(400);
    this.hud.hearts.forEach(h => h.setVisible(false));
    this.hud.score.setY(34);

    // A sky bigger than the screen, for the final pull-back.
    this.add.image(480, 100, 'sky_night_big').setScale(2).setDepth(-100);
    this.bigField = this.add.image(480, 100, 'starfield_big').setScale(2).setDepth(-99).setAlpha(0);
    this.add.tileSprite(-720, 470, 2400, 300, 'far_night').setOrigin(0, 1).setTileScale(PX).setDepth(-90);
    this.add.tileSprite(-720, 470, 2400, 600, 'ground_night').setOrigin(0, 0).setTileScale(PX).setDepth(-80);
    this.add.image(130, 472, 'tent').setOrigin(0.5, 1).setScale(PX).setDepth(-70);
    this.skyStars = this.add.container(0, 0).setDepth(-95);
    for (let i = 0; i < 40; i++) this.addSkyStar();

    this.av = this.add.sprite(W / 2, 472, 'av_throw').setOrigin(0.5, 1).setScale(PX).setDepth(20);
    this.basket = this.add.image(W / 2, 392, 'basket').setScale(PX).setDepth(21);

    this.caught = 0;
    this.falling = [];
    this.spawnT = 800;
    this.counter = UI.text(this, W / 2, 70, `Stars: 0 / ${STAR_GOAL}`, 30, GOLD, { display: true, strokeThickness: 7 }).setScrollFactor(0).setDepth(1500);
    this.bar = this.add.graphics().setScrollFactor(0).setDepth(1500);
    this.drawBar();

    this.time.delayedCall(400, () => this.tell('start', LINES.starsStart, GOLD));
  }

  drawBar() {
    const g = this.bar, x0 = W / 2 - 200, y0 = 96;
    g.clear();
    g.fillStyle(0x2b1b17, 0.8); g.fillRoundedRect(x0 - 4, y0 - 4, 408, 18, 8);
    g.fillStyle(0xf2c14e, 1); g.fillRoundedRect(x0, y0, 400 * Math.min(1, this.caught / STAR_GOAL), 10, 5);
  }

  update(time, dt) {
    if (this.ended) return;
    let dir = 0;
    if (this.dirLeft()) dir -= 1;
    if (this.dirRight()) dir += 1;
    const av = this.av;
    av.x = Phaser.Math.Clamp(av.x + dir * 0.42 * dt, 50, W - 50);
    if (dir) av.setFlipX(dir < 0);
    av.setY(472 - (dir ? Math.abs(Math.sin(time / 90)) * 3 : 0));
    this.basket.setPosition(av.x + (av.flipX ? -6 : 6), av.y - 80);

    const prog = this.caught / STAR_GOAL;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Phaser.Math.Linear(1000, 480, prog) * (0.7 + Math.random() * 0.6);
      this.spawnStar(prog);
    }

    const bx = this.basket.x, by = this.basket.y;
    for (const s of this.falling) {
      s.y += s.vy * dt / 1000;
      s.x += Math.sin(time / 400 + s.phase) * s.sway * dt / 1000;
      s.rotation += s.spin * dt / 1000;
      if (!s.caught && Math.abs(s.x - bx) < 40 && s.y > by - 26 && s.y < by + 10) this.catchStar(s);
      if (!s.caught && s.y > 470) {
        s.caught = true;
        this.tweens.add({ targets: s, alpha: 0, scale: 0.5, duration: 300, onComplete: () => s.destroy() });
      }
    }
    this.falling = this.falling.filter(s => s.active && !s.caught);
  }

  spawnStar(prog) {
    const big = Math.random() < 0.16;
    const s = this.add.image(Phaser.Math.Between(50, W - 50), -20, big ? 'star_big' : 'star').setScale(big ? 3 : PX).setDepth(30);
    s.big = big; s.vy = Phaser.Math.Linear(130, 250, prog) * (big ? 0.85 : 1) + Math.random() * 40;
    s.sway = Math.random() * 40; s.phase = Math.random() * 6; s.spin = (Math.random() - 0.5) * 3;
    if (big) this.tweens.add({ targets: s, scale: 3.6, yoyo: true, repeat: -1, duration: 260 });
    this.falling.push(s);
  }

  catchStar(s) {
    s.caught = true;
    const pts = s.big ? 3 : 1;
    this.caught = Math.min(STAR_GOAL, this.caught + pts);
    Sfx.star(s.big);
    this.addScore(pts * 20);
    UI.floatText(this, s.x, s.y - 20, s.big ? '+3' : '+1', s.big ? '#fff6c8' : GOLD, s.big ? 30 : 22);
    UI.burst(this, s.x, s.y, 'spark', s.big ? 18 : 8, { speed: { min: 60, max: 200 }, gravityY: 100, lifespan: 500 });
    this.tweens.add({ targets: this.basket, scaleY: PX * 0.85, yoyo: true, duration: 80 });
    s.destroy();
    for (let i = 0; i < pts * 2; i++) this.addSkyStar();
    this.counter.setText(`Stars: ${this.caught} / ${STAR_GOAL}`);
    this.drawBar();
    const milestones = [10, 20, 26];
    milestones.forEach((m, i) => { if (this.caught >= m && !this.milestones[m]) { this.milestones[m] = true; this.tell('ms' + m, LINES.starsMid[i], CREAM, 0); } });
    if (this.caught >= STAR_GOAL) this.fullSky();
  }

  addSkyStar(x, y) {
    const t = this.add.image(x === undefined ? Math.random() * W : x, y === undefined ? 20 + Math.random() * 300 : y, Math.random() < 0.2 ? 'star' : 'tiny')
      .setScale(Math.random() < 0.3 ? 2 : 1.4).setAlpha(0);
    this.skyStars.add(t);
    this.tweens.add({ targets: t, alpha: { from: 0, to: 1 }, duration: 500 });
    this.tweens.add({ targets: t, alpha: 0.35, yoyo: true, repeat: -1, duration: 700 + Math.random() * 1400, delay: 500 + Math.random() * 1000 });
  }

  /* The sky fills, the camera pulls back, the promise is spoken. */
  fullSky() {
    this.ended = true;
    for (const s of this.falling) this.tweens.add({ targets: s, alpha: 0, duration: 400, onComplete: () => s.destroy() });
    this.falling = [];
    Sfx.win();
    [this.counter, this.bar, this.hud.title, this.hud.score, this.hud.pauseHint, this.hud.icon].forEach(o => this.tweens.add({ targets: o, alpha: 0, duration: 600 }));
    this.tweens.add({ targets: this.bigField, alpha: 1, duration: 5000 });
    for (let i = 0; i < 160; i++) this.time.delayedCall(i * 25, () => this.addSkyStar(-480 + Math.random() * 1920, -440 + Math.random() * 760));
    const cam = this.cameras.main;
    cam.pan(480, 170, 5000, 'Sine.easeInOut');
    cam.zoomTo(0.5, 5000, 'Sine.easeInOut');
    this.av.anims.stop(); this.av.setTexture('av_throw');
    this.time.delayedCall(2500, () => {
      const t = UI.text(this, 480, -260, 'Count the stars… if you can!', 72, GOLD, { display: true, strokeThickness: 12 }).setAlpha(0).setDepth(2000);
      this.tweens.add({ targets: t, alpha: 1, duration: 1200 });
      let done = false;
      const go = () => { if (!done) { done = true; this.ended = false; this.complete(); } };
      Narrator.say(LINES.starsDone, () => this.time.delayedCall(Save.data.voice ? 1500 : 5000, go));
      this.time.delayedCall(14000, go);
    });
  }
}
