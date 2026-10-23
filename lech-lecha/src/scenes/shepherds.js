/* Level 2: The Shepherds. You are one of Avram's shepherds, walking the
   path between the pasture and the neighbors' fields. Sheep wander down
   toward the crops; toss soft wool balls to turn them back. Three waves,
   three hearts; running out of hearts replays the current wave. */

const WAVES = [
  { count: 3, speed: [38, 46], gap: 2600, sides: false, zig: 0 },
  { count: 6, speed: [52, 64], gap: 2000, sides: true, zig: 0 },
  { count: 10, speed: [62, 80], gap: 1250, sides: true, zig: 0.5 },
];
const PATH_Y = 412, CROP_Y = 470;

class Shepherds extends BaseLevel {
  constructor() { super('Shepherds'); }

  create() {
    this.initBase(2, 'Level 2 · The Shepherds');
    this.finished = false; this.waveActive = false; this.spawner = null;
    Music.setSour(false);
    Music.play('pasture');
    this.physics.world.gravity.y = 0;
    this.cameras.main.fadeIn(300);

    this.add.image(0, 0, 'sky_pasture').setOrigin(0, 0).setDepth(-100);
    this.add.tileSprite(0, 190, W, 300, 'far_pasture').setOrigin(0, 1).setTileScale(PX).setDepth(-90);
    this.add.tileSprite(0, 230, W, 300, 'near_pasture').setOrigin(0, 1).setTileScale(PX).setDepth(-89);
    // Pasture, path, fence and the neighbors' field.
    const g = this.add.graphics().setDepth(-80);
    g.fillStyle(0x74b84e, 1); g.fillRect(0, 226, W, 170);
    g.fillStyle(0x8fd14f, 1);
    const r = Art.rng(5);
    for (let i = 0; i < 120; i++) g.fillRect(Math.floor(r() * W / 3) * 3, 230 + Math.floor(r() * 54) * 3, 3, 6);
    g.fillStyle(0xd9b46a, 1); g.fillRect(0, 392, W, 52);
    g.fillStyle(0xecd08a, 1); g.fillRect(0, 392, W, 6);
    g.fillStyle(0x8a5a32, 1); g.fillRect(0, 456, W, 84);
    g.fillStyle(0x6b4521, 1); for (let y = 468; y < 540; y += 24) g.fillRect(0, y, W, 3);
    for (let x = 0; x < W; x += 48) this.add.image(x, 456, 'fence').setOrigin(0, 1).setScale(PX).setDepth(-70);
    this.add.image(W - 70, 456, 'sign').setOrigin(0.5, 1).setScale(PX).setDepth(-69);
    UI.text(this, W - 70, 400, 'Neighbors’\nfield', 13, CREAM, { strokeThickness: 4 }).setDepth(-68);

    this.crops = [];
    for (let x = 36, i = 0; x < W - 100; x += 46, i++) {
      const veg = i % 3 === 1;
      const c = this.add.image(x, CROP_Y + 34 + (i % 2) * 10, veg ? 'veg' : 'wheat').setOrigin(0.5, 1).setScale(PX).setDepth(5 + (i % 2));
      c.kind = veg ? 'veg' : 'wheat'; c.eaten = false;
      this.crops.push(c);
    }

    // Lot's shepherd up on the hill, grumbling.
    this.lotShep = this.add.sprite(860, 236, 'lotshep_idle').setOrigin(0.5, 1).setScale(PX).setFlipX(true).setDepth(2);
    this.time.addEvent({ delay: 9000, loop: true, startAt: 3000, callback: () => {
      if (this.ended) return;
      const lines = ['Let them eat anywhere!', 'Grass is grass!', 'Who cares whose field?'];
      UI.bubble(this, this.lotShep.x - 30, this.lotShep.y - 74, Phaser.Utils.Array.GetRandom(lines), 2400);
    } });

    this.p = this.physics.add.sprite(W / 2, PATH_Y, 'shep_idle').setOrigin(0.5, 1).setScale(PX).setDepth(30);
    this.p.body.setSize(12, 22).setOffset(6, 2);
    this.p.throwT = 0; this.p.cool = 0;

    this.sheep = this.physics.add.group();
    this.balls = this.physics.add.group();
    this.physics.add.overlap(this.balls, this.sheep, (b, s) => this.hitSheep(b, s));

    this.waveN = 0;
    this.time.delayedCall(600, () => this.startWave(0));
  }

  startWave(n) {
    this.waveN = n;
    const wv = WAVES[n];
    this.spawned = 0; this.resolved = 0; this.waveActive = true;
    UI.banner(this, 'Wave ' + (n + 1), GOLD, 1500, 56);
    this.tell('wave' + n, LINES.waveIntro[n], CREAM, 0);
    if (this.spawner) this.spawner.remove();
    this.spawner = this.time.addEvent({ delay: wv.gap, startAt: wv.gap - 1600, loop: true, callback: () => {
      if (this.spawned >= wv.count) { this.spawner.remove(); return; }
      this.spawnSheep(wv);
    } });
  }

  spawnSheep(wv) {
    this.spawned++;
    let x, y;
    if (wv.sides && this.spawned % 2 === 0) { x = Math.random() < 0.5 ? -30 : W + 30; y = 250 + Math.random() * 60; }
    else { x = 80 + Math.random() * (W - 260); y = 220; }
    // Side sheep aim across the field so they always walk into reach.
    const side = x < 0 || x > W;
    let targets = this.crops.filter(c => !c.eaten && (!side || Math.abs(c.x - x) > 320));
    if (!targets.length) targets = this.crops.filter(c => !side || Math.abs(c.x - x) > 320);
    const crop = Phaser.Utils.Array.GetRandom(targets.length ? targets : this.crops);
    const s = this.sheep.create(x, y, 'lsheep_0').setOrigin(0.5, 1).setScale(PX).setDepth(20);
    s.body.setSize(18, 14).setOffset(-1, -1);
    s.play('lsheep_walk');
    s.state = 'walk'; s.crop = crop;
    s.speed = Phaser.Math.Between(wv.speed[0], wv.speed[1]);
    s.zig = wv.zig * (Math.random() < 0.5 ? 1 : -1); s.phase = Math.random() * 6;
    s.setAlpha(0); this.tweens.add({ targets: s, alpha: 1, duration: 300 });
    if (Math.random() < 0.5) Sfx.baa();
  }

  hitSheep(ball, s) {
    if (s.state !== 'walk') return;
    ball.destroy();
    s.state = 'flee';
    Sfx.baa(); this.addScore(100, s.x, s.y - 50);
    UI.burst(this, s.x, s.y - 20, 'fluff', 10, { speed: { min: 60, max: 180 }, gravityY: 200 });
    UI.bubble(this, s.x, s.y - 40, 'Baa!', 900, { size: 16 });
    s.body.setVelocity((s.x < W / 2 ? -1 : 1) * 40, -150);
    s.setFlipX(s.body.velocity.x < 0);
    this.tweens.add({ targets: s, angle: { from: -12, to: 12 }, yoyo: true, repeat: 3, duration: 90 });
  }

  update(time, dt) {
    if (this.ended) return;
    if (this.invuln > 0) this.invuln -= dt;
    const p = this.p;
    let dir = 0;
    if (this.dirLeft()) dir -= 1;
    if (this.dirRight()) dir += 1;
    p.body.setVelocityX(dir * 320);
    p.x = Phaser.Math.Clamp(p.x, 30, W - 30);
    if (dir) p.setFlipX(dir < 0);
    p.cool -= dt; p.throwT -= dt;
    if (this.actionPressed() && p.cool <= 0) this.throwBall();
    if (p.throwT > 0) { p.anims.stop(); p.setTexture('shep_throw'); }
    else if (dir) p.anims.play('shep_walk', true);
    else { p.anims.stop(); p.setTexture('shep_idle'); }

    for (const b of this.balls.getChildren().slice()) {
      b.rotation += dt * 0.01;
      if (b.y < 150 || b.x < -20 || b.x > W + 20) b.destroy();
    }

    for (const s of this.sheep.getChildren().slice()) this.moveSheep(s, time, dt);

    if (this.waveActive && this.spawned >= WAVES[this.waveN].count && this.sheep.countActive() === 0) this.waveDone();
  }

  moveSheep(s, time, dt) {
    if (s.state === 'walk') {
      const tx = s.crop.x + Math.sin(time / 600 + s.phase) * 60 * s.zig;
      const ang = Phaser.Math.Angle.Between(s.x, s.y, tx, CROP_Y);
      s.body.setVelocity(Math.cos(ang) * s.speed, Math.sin(ang) * s.speed);
      s.setFlipX(s.body.velocity.x < -5);
      s.setDepth(20 + s.y / 100);
      if (s.y >= CROP_Y - 4) this.eat(s);
    } else if (s.state === 'flee') {
      if (s.y < 210 || s.x < -40 || s.x > W + 40) {
        this.tweens.add({ targets: s, alpha: 0, duration: 250, onComplete: () => s.destroy() });
        s.state = 'gone';
      }
    } else if (s.state === 'leave') {
      if (s.x < -40 || s.x > W + 40) s.destroy();
    }
  }

  eat(s) {
    s.state = 'eat';
    s.body.setVelocity(0, 0);
    s.play('sheep_graze');
    Sfx.munch();
    const crop = this.nearestCrop(s.x);
    if (crop && !crop.eaten) { crop.eaten = true; crop.setTexture(crop.kind + '_eaten'); }
    this.tell('ate', LINES.ate, '#ff8a7a', 5000);
    this.hurt();
    this.time.delayedCall(1100, () => {
      if (!s.active) return;
      s.state = 'leave'; s.play('lsheep_walk');
      const left = s.x < W / 2;
      s.body.setVelocity(left ? -120 : 120, 0); s.setFlipX(left);
    });
  }

  nearestCrop(x) {
    let best = null, bd = 1e9;
    for (const c of this.crops) { const d = Math.abs(c.x - x) + (c.eaten ? 200 : 0); if (d < bd) { bd = d; best = c; } }
    return best;
  }

  throwBall() {
    const p = this.p;
    p.cool = 300; p.throwT = 220;
    Sfx.throw();
    const b = this.balls.create(p.x + (p.flipX ? -10 : 10), p.y - 70, 'wool').setScale(PX).setDepth(40);
    b.body.setCircle(4, -0.5, -0.5);
    b.body.setVelocity(p.body.velocity.x * 0.25, -520);
    b.body.setAccelerationY(260);
  }

  outOfHearts() {
    this.waveActive = false;
    if (this.spawner) this.spawner.remove();
    UI.banner(this, 'Try the wave again!', CREAM, 1800, 44);
    this.tell('retry', LINES.waveRetry, CREAM, 0);
    for (const s of this.sheep.getChildren().slice()) this.tweens.add({ targets: s, alpha: 0, duration: 400, onComplete: () => s.destroy() });
    this.time.delayedCall(2400, () => {
      for (const c of this.crops) { c.eaten = false; c.setTexture(c.kind); }
      this.startWave(this.waveN);
    });
  }

  waveDone() {
    this.waveActive = false;
    if (this.waveN < WAVES.length - 1) {
      Sfx.check();
      UI.banner(this, 'Great shepherding!', '#b8f28a', 1600, 46);
      this.time.delayedCall(2200, () => this.startWave(this.waveN + 1));
    } else this.peace();
  }

  /* Avram and Lot meet in the middle and choose peace. */
  peace() {
    this.ended = true;
    this.p.body.setVelocity(0, 0); this.p.anims.stop(); this.p.setTexture('shep_idle');
    if (this.spawner) this.spawner.remove();
    Music.play('story');
    const av = this.add.sprite(-40, PATH_Y, 'av_idle').setOrigin(0.5, 1).setScale(PX).setDepth(31).play('av_walk');
    const lot = this.add.sprite(W + 40, PATH_Y, 'lot_idle').setOrigin(0.5, 1).setScale(PX).setDepth(31).setFlipX(true).play('lot_walk');
    this.tweens.add({ targets: this.p, x: 160, duration: 900 });
    this.tweens.add({ targets: av, x: 400, duration: 2200, onComplete: () => { av.anims.stop(); av.setTexture('av_idle'); } });
    this.tweens.add({ targets: lot, x: 560, duration: 2200, onComplete: () => { lot.anims.stop(); lot.setTexture('lot_idle'); } });
    this.time.delayedCall(2400, () => {
      UI.bubble(this, av.x, av.y - 84, LINES.peace1, 3600);
      Narrator.say(LINES.peace1, () => this.time.delayedCall(Save.data.voice ? 300 : 2200, () => {
        UI.bubble(this, lot.x, lot.y - 84, LINES.peace2, 3000);
        Narrator.say(LINES.peace2, () => this.time.delayedCall(Save.data.voice ? 900 : 2600, () => this.finishLevel()));
      }));
    });
  }
  finishLevel() {
    if (this.finished) return; this.finished = true;
    this.ended = false; this.complete();
  }
}
