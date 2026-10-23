/* Level 1: Lech Lecha. A side-scroller from Charan to Canaan.
   Break the 5 idols (Midrash) to open the city gate, then follow the
   golden arrow. Two forks hide dead ends: wander into one, or walk
   back toward Charan, and the arrow turns red, the music sours and the
   journey map flashes. */

const JOURNEY = {
  width: 8640,
  goalX: 8290,
  ground: [[0, 2112], [2240, 2720], [2880, 4416], [4544, 5120], [5280, 7200, 'green'], [7328, 8640, 'green']],
  water: [[2112, 2240], [2720, 2880], [4416, 4544], [5120, 5280], [7200, 7328]],
  platforms: [
    [480, 384, 96], [896, 336, 128],
    [2768, 404, 64],
    [3040, 360, 96], [3200, 280, 96], [3360, 224, 704],
    [5168, 392, 64], [5500, 372, 96], [5680, 300, 96],
    [6080, 330, 64], [6200, 272, 64], [6336, 232, 512],
    [7500, 380, 96], [7700, 320, 128], [7950, 380, 96],
  ],
  walls: [[2464, 384, 64, 64], [3936, 248, 64, 200], [6848, 72, 64, 160], [6528, 384, 64, 64]],
  idols: [[288, 448], [528, 384], [736, 448], [960, 336], [1184, 448]],
  gateX: 1408,
  checkpoints: [{ x: 1640, label: LINES.cpHome }, { x: 4700, label: LINES.cpWild }],
  scorpions: [[3000, 2900, 3150], [3600, 3420, 3880], [4900, 4600, 5080], [5850, 5320, 6000], [6950, 6700, 7150]],
  poms: [[5560, 330], [5610, 330], [5740, 258], [5790, 258], [5900, 410], [6440, 410], [7560, 338], [7760, 278], [7810, 278], [8010, 338]],
  // The right road, in order. The arrow aims at the first one not yet reached.
  path: [[1640, 410], [2060, 410], [2300, 410], [2700, 380], [2950, 410], [3090, 320], [3250, 240], [3500, 185],
         [4020, 185], [4250, 410], [4700, 410], [5200, 350], [5450, 410], [6000, 410], [6450, 410], [7000, 410],
         [7400, 410], [7760, 280], [8290, 410]],
  wrongZones: [[3330, 300, 606, 160], [6180, 0, 720, 290]],
  palms: [2320, 2620, 3520, 3760, 4250, 4950],
  bushes: [5400, 5980, 6300, 6700, 7450, 7900, 8150],
  houses: [[160, 'house_b'], [640, 'house_a'], [1080, 'house_b'], [1300, 'house_a']],
};

class Journey extends BaseLevel {
  constructor() { super('Journey'); }

  create() {
    const J = JOURNEY;
    this.initBase(1, 'Level 1 · Lech Lecha');
    this.arriving = false;
    Music.setSour(false);
    Music.play('journey');
    this.physics.world.gravity.y = 1500;
    this.physics.world.setBounds(0, -400, J.width, 1400);
    this.physics.world.setBoundsCollision(true, true, false, false);

    // Backdrop: desert hills that turn green as Canaan gets close.
    const layers = Plat.parallax(this, 'sky_day', [['far_desert', 330, 0.1], ['near_desert', 420, 0.3], ['near_green', 420, 0.3]]);
    this.greenLayer = layers[2].setAlpha(0);
    this.add.image(820, GROUND_Y, 'ziggurat').setOrigin(0.5, 1).setScale(PX).setScrollFactor(0.55).setDepth(-60).setAlpha(0.95);

    for (const [x, key] of J.houses) this.add.image(x, GROUND_Y, key).setOrigin(0.5, 1).setScale(PX).setDepth(1);
    for (const x of J.palms) this.add.image(x, GROUND_Y, 'palm').setOrigin(0.5, 1).setScale(PX).setDepth(2);
    for (const x of J.bushes) this.add.image(x, GROUND_Y, 'bush').setOrigin(0.5, 1).setScale(PX).setDepth(2);
    this.add.image(60, GROUND_Y, 'sign').setOrigin(0.5, 1).setScale(PX).setDepth(2);
    UI.text(this, 60, GROUND_Y - 62, 'Charan', 14, CREAM, { strokeThickness: 4 }).setDepth(3);
    this.add.image(4780, GROUND_Y, 'sign').setOrigin(0.5, 1).setScale(PX).setDepth(2);
    UI.text(this, 4780, GROUND_Y - 62, 'Canaan →', 14, CREAM, { strokeThickness: 4 }).setDepth(3);
    UI.text(this, 740, 170, 'From the Midrash: Avram knew idols were only stone.', 17, INK,
      { strokeThickness: 0, weight: '700', style: { backgroundColor: '#f2c14e', padding: { x: 10, y: 5 } } }).setDepth(3);
    this.add.image(J.goalX + 40, GROUND_Y, 'oak').setOrigin(0.5, 1).setScale(PX).setDepth(2);
    this.add.image(J.goalX + 190, GROUND_Y, 'altar').setOrigin(0.5, 1).setScale(PX).setDepth(3);

    this.solids = Plat.build(this, J, { ground: 'desert', plat: 'plat_stone' });

    // Idols and the town gate.
    this.idols = J.idols.map(([x, y], i) => this.add.image(x, y, i % 2 ? 'idol_gold' : 'idol').setOrigin(0.5, 1).setScale(PX).setDepth(20));
    this.idolsLeft = this.idols.length;
    this.gate = this.physics.add.staticImage(J.gateX, GROUND_Y, 'gate_town').setOrigin(0, 1).setScale(PX).refreshBody().setDepth(15);
    this.gateOpen = false;

    // Checkpoints, fruit, scorpions.
    this.flags = J.checkpoints.map(cp => Object.assign(this.add.image(cp.x, GROUND_Y, 'flag').setOrigin(0, 1).setScale(PX).setDepth(5), { cp }));
    this.poms = this.physics.add.staticGroup();
    for (const [x, y] of J.poms) {
      const pm = this.poms.create(x, y, 'pom').setScale(PX).refreshBody().setDepth(20);
      this.tweens.add({ targets: pm, y: y - 6, yoyo: true, repeat: -1, duration: 700 + Math.random() * 300 });
    }
    this.scorps = this.physics.add.group();
    for (const [x, min, max] of J.scorpions) {
      const s = this.scorps.create(x, GROUND_Y - 30, 'scorp_0').setScale(PX).setDepth(30);
      s.min = min; s.max = max; s.dir = -1; s.play('scorp_walk');
    }

    this.spawn = { x: 120, y: GROUND_Y - 40 };
    this.p = Plat.makePlayer(this, this.spawn.x, this.spawn.y);
    this.physics.add.collider(this.p, this.solids);
    this.physics.add.collider(this.p, this.gate);
    this.physics.add.collider(this.scorps, this.solids);
    this.physics.add.overlap(this.p, this.poms, (p, pm) => { Sfx.coin(); this.addScore(50, pm.x, pm.y - 20); pm.destroy(); });
    this.physics.add.overlap(this.p, this.scorps, (p, s) => { if (this.hurt()) Plat.knockback(p, s.x); });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, J.width, H);
    cam.startFollow(this.p, true, 0.12, 0.12);
    cam.setDeadzone(80, 140);
    cam.fadeIn(300);

    this.arrow = Plat.arrow(this);
    this.pathIdx = 0; this.prevD = null; this.toward = 0; this.wrongT = 0; this.wrong = false; this.rightT = 0;
    this.buildMap();

    this.time.delayedCall(500, () => this.tell('start', LINES.journeyStart, GOLD));
  }

  buildMap() {
    const x0 = W - 252, y0 = 12;
    const g = this.add.graphics().setScrollFactor(0).setDepth(1500);
    g.fillStyle(0x2b1b17, 1); g.fillRoundedRect(x0 - 3, y0 - 3, 246, 98, 10);
    g.fillStyle(0xe6cf9a, 1); g.fillRoundedRect(x0, y0, 240, 92, 8);
    g.lineStyle(3, 0x5fb3e8, 0.9); g.beginPath(); g.moveTo(x0 + 236, y0 + 4); g.lineTo(x0 + 214, y0 + 30); g.lineTo(x0 + 222, y0 + 60); g.lineTo(x0 + 236, y0 + 88); g.strokePath();
    g.fillStyle(0x5fb3e8, 0.8); g.fillRect(x0, y0 + 20, 14, 72);
    // Route from Charan (north-east) to Canaan (south-west).
    this.route = new Phaser.Curves.Spline([x0 + 200, y0 + 26, x0 + 150, y0 + 36, x0 + 110, y0 + 52, x0 + 70, y0 + 58, x0 + 36, y0 + 72]);
    g.fillStyle(0x8a5a32, 1);
    for (let i = 0; i <= 30; i++) { const pt = this.route.getPoint(i / 30); g.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3); }
    g.fillStyle(0x3b6b25, 1); g.fillCircle(x0 + 36, y0 + 72, 7);
    g.fillStyle(0x8a5a32, 1); g.fillCircle(x0 + 200, y0 + 26, 6);
    UI.text(this, x0 + 200, y0 + 10, 'Charan', 13, INK, { strokeThickness: 0, weight: '700' }).setScrollFactor(0).setDepth(1501);
    UI.text(this, x0 + 44, y0 + 54, 'Canaan', 13, '#3b6b25', { strokeThickness: 0, weight: '700' }).setScrollFactor(0).setDepth(1501);
    UI.text(this, x0 + 120, y0 + 82, 'Great Sea ←   ·   N ↑', 10, INK, { strokeThickness: 0 }).setScrollFactor(0).setDepth(1501).setAlpha(0.7);
    this.mapDot = this.add.circle(0, 0, 6, 0xf2c14e).setStrokeStyle(2, 0x2b1b17).setScrollFactor(0).setDepth(1502);
    this.mapFlash = this.add.graphics().setScrollFactor(0).setDepth(1503);
    this.mapX0 = x0; this.mapY0 = y0;
    this.hud.score.setY(70);
  }

  update(time, dt) {
    if (this.ended || this.arriving) { if (this.arriving) Plat.updatePlayer(this, this.p, dt, 0); return; }
    const p = this.p, J = JOURNEY;
    Plat.updatePlayer(this, p, dt);

    if (this.actionPressed()) this.attack(Plat.swing(this, p));

    for (const s of this.scorps.getChildren()) {
      if (s.x < s.min) s.dir = 1; if (s.x > s.max) s.dir = -1;
      s.body.setVelocityX(s.dir * 55); s.setFlipX(s.dir > 0);
    }

    for (const f of this.flags) {
      if (!f.reached && p.x > f.cp.x) {
        f.reached = true; f.setTexture('flag_on'); Sfx.check();
        this.spawn = { x: f.cp.x + 40, y: GROUND_Y - 40 };
        UI.banner(this, f.cp.label, GOLD, 1600, 44);
        Narrator.say(f.cp.label);
      }
    }

    if (p.y > 600) { this.invuln = 0; this.hurt(); this.respawn(); }

    this.updateGuide(time, dt);

    const t = Phaser.Math.Clamp((p.x - 4400) / 2200, 0, 1);
    this.greenLayer.setAlpha(t);

    if (p.x >= J.goalX) this.arrive();
  }

  attack(rect) {
    if (!rect) return;
    for (const idol of this.idols) {
      if (!idol.active || !Phaser.Geom.Rectangle.Overlaps(rect, idol.getBounds())) continue;
      const gold = idol.texture.key === 'idol_gold';
      UI.burst(this, idol.x, idol.y - 30, gold ? 'goldrubble' : 'rubble', 16, { speed: { min: 120, max: 320 }, gravityY: 900 });
      UI.burst(this, idol.x, idol.y - 30, 'puff', 6, { speed: { min: 30, max: 90 }, gravityY: -40, alpha: { start: 0.8, end: 0 } });
      Sfx.smash(); this.cameras.main.shake(140, 0.006);
      this.addScore(100, idol.x, idol.y - 70);
      idol.destroy();
      this.idolsLeft--;
      if (this.idolsLeft > 0) this.tell('idols' + this.idolsLeft, LINES.idolLeft(this.idolsLeft), CREAM, 0);
      else this.openGate();
    }
    for (const s of this.scorps.getChildren().slice()) {
      if (Phaser.Geom.Rectangle.Overlaps(rect, s.getBounds())) {
        UI.burst(this, s.x, s.y, 'puff', 10, { gravityY: -50 });
        Sfx.poof(); this.addScore(50, s.x, s.y - 30);
        s.destroy();
      }
    }
  }

  openGate() {
    this.gateOpen = true;
    Sfx.gate(); this.cameras.main.shake(900, 0.004);
    this.gate.body.enable = false;
    this.tweens.add({ targets: this.gate, y: this.gate.y - 250, duration: 1500, ease: 'Sine.easeIn' });
    UI.banner(this, 'The gate is open!', GOLD, 1800, 48);
    this.tell('gate', LINES.gateOpen, GOLD, 0);
  }

  respawn() {
    const p = this.p;
    p.setPosition(this.spawn.x, this.spawn.y);
    p.body.setVelocity(0, 0); p.knock = 0;
    this.invuln = 1200;
    this.prevD = null;
    this.pathIdx = Math.max(0, JOURNEY.path.findIndex(([x]) => x > this.spawn.x - 60));
  }
  outOfHearts() { this.respawn(); }

  target() {
    if (!this.gateOpen) {
      let best = null, bd = 1e9;
      for (const i of this.idols) if (i.active) { const d = Math.abs(i.x - this.p.x); if (d < bd) { bd = d; best = i; } }
      return best ? [best.x, best.y - 30] : [JOURNEY.gateX + 30, 380];
    }
    const path = JOURNEY.path, p = this.p;
    while (this.pathIdx < path.length - 1) {
      const [x, y] = path[this.pathIdx];
      const near = Phaser.Math.Distance.Between(p.x, p.y, x, y) < 110;
      const passed = p.x > x + 40 && Math.abs(p.y - y) < 140;
      if (near || passed) { this.pathIdx++; this.prevD = null; } else break;
    }
    return path[this.pathIdx];
  }

  updateGuide(time, dt) {
    const p = this.p;
    const [tx, ty] = this.target();
    const d = Phaser.Math.Distance.Between(p.x, p.y, tx, ty);
    if (this.prevD !== null) {
      const v = (this.prevD - d) / Math.max(1, dt) * 1000;
      this.toward = this.toward * 0.85 + v * 0.15;
    } else this.toward = 0;
    this.prevD = d;

    const inZone = JOURNEY.wrongZones.some(([x, y, w, h]) => p.x > x && p.x < x + w && p.y > y && p.y < y + h);
    const moving = Math.abs(p.body.velocity.x) > 20;
    let bad = false;
    if (this.gateOpen) {
      if (inZone && this.toward < 60) bad = true;
      if (!inZone && moving && this.toward < -80) bad = true;
    }
    this.wrongT = bad ? this.wrongT + dt : 0;
    this.rightT = bad ? 0 : this.rightT + dt;

    if (!this.wrong && this.wrongT > 350) {
      this.wrong = true;
      Music.setSour(true); Sfx.wrong();
      this.tell('wrong', LINES.wrongWay, '#ff8a7a', 6000);
    } else if (this.wrong && this.rightT > 500) {
      this.wrong = false;
      Music.setSour(false);
      this.tell('right', LINES.rightWay, '#b8f28a', 8000);
    }
    this.arrow.point(p, tx, ty, this.wrong, time);

    // Journey map: progress dot along the route.
    const prog = Phaser.Math.Clamp(p.x / JOURNEY.goalX, 0, 1);
    const pt = this.route.getPoint(prog);
    this.mapDot.setPosition(pt.x, pt.y).setFillStyle(this.wrong ? 0xff4a3a : 0xf2c14e);
    this.mapFlash.clear();
    if (this.wrong && Math.floor(time / 250) % 2) {
      this.mapFlash.lineStyle(4, 0xff4a3a, 1); this.mapFlash.strokeRoundedRect(this.mapX0 - 3, this.mapY0 - 3, 246, 98, 10);
    }
  }

  arrive() {
    this.arriving = true;
    Music.setSour(false); Music.stop();
    this.p.body.setVelocityX(0);
    this.arrow.setVisible(false);
    Sfx.win();
    this.greenLayer.setAlpha(1);
    UI.banner(this, 'Welcome to Canaan!', '#b8f28a', 3000, 54);
    UI.burst(this, JOURNEY.goalX + 40, GROUND_Y - 150, 'spark', 40, { speed: { min: 100, max: 360 }, gravityY: 120, lifespan: 1400 });
    this.addScore(500);
    this.hud.say(LINES.arrived, '#b8f28a', 7000);
    let done = false;
    const go = () => { if (!done) { done = true; this.complete(); } };
    Narrator.say(LINES.arrived, () => this.time.delayedCall(Save.data.voice ? 800 : 5000, go));
    this.time.delayedCall(9000, go);
  }
}
