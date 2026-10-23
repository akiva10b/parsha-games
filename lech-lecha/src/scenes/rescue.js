/* Level 3: Rescue Lot. A night-time action platformer. Avram bonks
   guards with his shepherd's staff (they spin away in a puff of smoke),
   dodges falling rocks, beats the two gate guards to open the camp,
   finds the key, frees Lot and leads him back to Avram's men. */

const RESCUE = {
  width: 6400,
  exitX: 6180,
  ground: [[0, 960], [1088, 1600], [1760, 5248], [5376, 6400]],
  platforms: [[1648, 392, 64], [3900, 384, 96], [4040, 312, 96], [4180, 240, 144], [5560, 380, 96]],
  walls: [[2900, 400, 48, 48], [5750, 384, 64, 64]],
  gateX: 3328,
  guards: [
    { x: 700, min: 480, max: 900 }, { x: 1300, min: 1140, max: 1560 },
    { x: 2350, min: 2250, max: 2560 },
    { x: 3050, min: 2980, max: 3260, gate: true }, { x: 3200, min: 3000, max: 3280, gate: true, hp: 2 },
    { x: 3800, min: 3560, max: 4400 }, { x: 4560, min: 4440, max: 4760, hp: 2 },
    { x: 5600, min: 5420, max: 5720 }, { x: 6000, min: 5860, max: 6100 },
  ],
  rockZone: [2050, 2780],
  keyAt: [4250, 196],
  cageX: 4920,
  checkpoints: [{ x: 1860, label: 'Almost at the camp!' }, { x: 3460, label: 'Inside the camp!' }],
  tents: [3560, 4120, 4520, 5120],
  bushes: [300, 1220, 1900, 2700, 5500, 6000],
};

class Rescue extends BaseLevel {
  constructor() { super('Rescue'); }

  create() {
    const R = RESCUE;
    this.initBase(3, 'Level 3 · Rescue Lot');
    this.gateOpen = false;
    Music.setSour(false);
    Music.play('battle');
    this.physics.world.gravity.y = 1500;
    this.physics.world.setBounds(0, -400, R.width, 1400);
    this.physics.world.setBoundsCollision(true, true, false, false);

    Plat.parallax(this, 'sky_dusk', [['far_dusk', 330, 0.1], ['near_dusk', 420, 0.3]]);
    for (const x of R.tents) this.add.image(x, GROUND_Y, 'tent_enemy').setOrigin(0.5, 1).setScale(PX).setDepth(1);
    for (const x of R.bushes) this.add.image(x, GROUND_Y, 'bush').setOrigin(0.5, 1).setScale(PX).setDepth(2).setTint(0x8a7aa8);
    this.add.sprite(3640, GROUND_Y, 'fire0').setOrigin(0.5, 1).setScale(PX).setDepth(3).play('fire');
    this.add.sprite(4700, GROUND_Y, 'fire0').setOrigin(0.5, 1).setScale(PX).setDepth(3).play('fire');
    this.add.image(2000, GROUND_Y, 'sign').setOrigin(0.5, 1).setScale(PX).setDepth(2);
    UI.text(this, 2000, GROUND_Y - 62, 'Rocks!', 14, CREAM, { strokeThickness: 4 }).setDepth(3);

    this.solids = Plat.build(this, R, { ground: 'camp', plat: 'plat_wood' });

    this.gate = this.physics.add.staticImage(R.gateX, GROUND_Y, 'palisade').setOrigin(0, 1).setScale(PX).refreshBody().setDepth(15);

    // Lot's cage and the key.
    this.lot = this.add.sprite(R.cageX + 42, GROUND_Y, 'lot_idle').setOrigin(0.5, 1).setScale(PX).setDepth(18).setFlipX(true);
    this.cage = this.add.image(R.cageX, GROUND_Y, 'cage').setOrigin(0, 1).setScale(PX).setDepth(19);
    this.key = this.add.image(R.keyAt[0], R.keyAt[1], 'key').setScale(PX).setDepth(20);
    this.tweens.add({ targets: this.key, y: R.keyAt[1] - 8, yoyo: true, repeat: -1, duration: 600 });
    this.keyGlow = this.add.circle(R.keyAt[0], R.keyAt[1], 26, 0xf2c14e, 0.25).setDepth(19);
    this.tweens.add({ targets: this.keyGlow, scale: 1.4, alpha: 0.05, yoyo: true, repeat: -1, duration: 700 });

    // Avram's camp: the way home.
    this.add.sprite(R.exitX + 90, GROUND_Y, 'fire0').setOrigin(0.5, 1).setScale(PX).setDepth(3).play('fire');
    this.friends = [R.exitX + 30, R.exitX + 150, R.exitX + 200].map((x, i) =>
      this.add.sprite(x, GROUND_Y, 'shep_idle').setOrigin(0.5, 1).setScale(PX).setDepth(4).setFlipX(i === 0 ? false : true));
    this.add.image(R.exitX - 20, GROUND_Y, 'flag').setOrigin(0, 1).setScale(PX).setDepth(4).setTint(0xb8f28a);

    this.flags = R.checkpoints.map(cp => Object.assign(this.add.image(cp.x, GROUND_Y, 'flag').setOrigin(0, 1).setScale(PX).setDepth(5), { cp }));

    this.guards = this.physics.add.group();
    for (const gd of R.guards) {
      const g = this.guards.create(gd.x, GROUND_Y - 40, 'guard_idle').setScale(PX).setDepth(40);
      g.body.setSize(10, 22).setOffset(7, 2);
      Object.assign(g, { min: gd.min, max: gd.max, gate: !!gd.gate, hp: gd.hp || 1, dir: -1, stun: 0, alive: true });
      if (g.hp > 1) g.setTint(0xffc0a0);
      g.play('guard_walk');
    }
    this.gateLeft = R.guards.filter(g => g.gate).length;

    this.spawn = { x: 120, y: GROUND_Y - 40 };
    this.p = Plat.makePlayer(this, this.spawn.x, this.spawn.y);
    this.physics.add.collider(this.p, this.solids);
    this.physics.add.collider(this.p, this.gate);
    this.physics.add.collider(this.guards, this.solids);
    this.physics.add.collider(this.guards, this.gate);
    this.physics.add.overlap(this.p, this.guards, (p, g) => {
      if (!g.alive || g.stun > 0) return;
      if (this.hurt()) Plat.knockback(p, g.x);
    });

    this.rocks = [];
    this.rockTimer = 0;
    this.hasKey = false; this.freed = false; this.trail = [];

    const cam = this.cameras.main;
    cam.setBounds(0, 0, R.width, H);
    cam.startFollow(this.p, true, 0.12, 0.12);
    cam.setDeadzone(80, 140);
    cam.fadeIn(300);

    this.arrow = Plat.arrow(this);
    this.keyIcon = this.add.image(170, 34, 'key').setScale(PX).setScrollFactor(0).setDepth(1500).setAlpha(0.25);
    this.time.delayedCall(500, () => this.tell('start', 'Rescue Lot! Press X to swing your staff.', GOLD));
  }

  update(time, dt) {
    if (this.ended) return;
    const p = this.p, R = RESCUE;
    Plat.updatePlayer(this, p, dt);
    if (this.actionPressed()) this.attack(Plat.swing(this, p));

    for (const g of this.guards.getChildren()) this.guardAI(g, dt);

    for (const f of this.flags) {
      if (!f.reached && p.x > f.cp.x) {
        f.reached = true; f.setTexture('flag_on'); Sfx.check();
        this.spawn = { x: f.cp.x + 40, y: GROUND_Y - 40 };
        UI.banner(this, f.cp.label, GOLD, 1500, 44);
      }
    }

    if (p.x > R.rockZone[0] - 100 && p.x < R.rockZone[0]) this.tell('rocks', LINES.rocks, '#ffb38a', 60000);
    if (p.x > R.rockZone[0] && p.x < R.rockZone[1]) {
      this.rockTimer -= dt;
      if (this.rockTimer <= 0) { this.rockTimer = 950; this.dropRock(); }
    }
    this.updateRocks();

    if (!this.gateOpen && p.x > R.gateX - 420) this.tell('gateGuards', LINES.gateGuards, '#ffb38a', 12000);

    if (!this.hasKey && Phaser.Math.Distance.Between(p.x, p.y, this.key.x, this.key.y) < 50) this.takeKey();

    const nearCage = Math.abs(p.x - (R.cageX + 42)) < 70 && p.y > 300;
    if (!this.freed && nearCage) {
      if (this.hasKey) this.freeLot();
      else this.tell('needKey', LINES.needKey, '#ffb38a', 5000);
    }

    if (this.freed) this.followLot();

    if (p.y > 600) { this.invuln = 0; this.hurt(); this.respawn(); }

    if (p.x > R.exitX) {
      if (this.freed) this.reachSafety();
      else this.tell('needLot', LINES.needLot, '#ffb38a', 5000);
    }

    let tx, ty;
    if (!this.gateOpen && p.x < R.gateX) [tx, ty] = [R.gateX - 140, 400];
    else if (!this.hasKey) [tx, ty] = [this.key.x, this.key.y];
    else if (!this.freed) [tx, ty] = [R.cageX + 42, 400];
    else [tx, ty] = [R.exitX + 60, 400];
    this.arrow.point(p, tx, ty, false, time);
  }

  guardAI(g, dt) {
    if (!g.alive) return;
    if (g.stun > 0) { g.stun -= dt; return; }
    const p = this.p;
    const dx = p.x - g.x, dy = Math.abs(p.y - g.y);
    let speed = 60;
    if (Math.abs(dx) < 260 && dy < 90) { g.dir = Math.sign(dx) || g.dir; speed = 100; }
    if (g.x < g.min) g.dir = 1;
    if (g.x > g.max) g.dir = -1;
    g.body.setVelocityX(g.dir * speed);
    g.setFlipX(g.dir < 0);
  }

  attack(rect) {
    if (!rect) return;
    for (const g of this.guards.getChildren()) {
      if (!g.alive || !Phaser.Geom.Rectangle.Overlaps(rect, g.getBounds())) continue;
      g.hp--;
      Sfx.bonk();
      UI.floatText(this, g.x, g.y - 50, 'Bonk!', CREAM, 22);
      if (g.hp > 0) {
        g.stun = 450; g.body.setVelocity(this.p.facing * 300, -260);
        g.setTintFill(0xffffff); this.time.delayedCall(90, () => { if (g.active) { g.clearTint(); g.setTint(0xffc0a0); } });
      } else this.defeat(g);
    }
  }

  defeat(g) {
    g.alive = false;
    g.body.enable = false;
    g.anims.stop();
    this.addScore(100, g.x, g.y - 70);
    this.tweens.add({ targets: g, angle: 720, scale: PX * 0.2, alpha: 0, y: g.y - 40, duration: 600, ease: 'Cubic.easeIn', onComplete: () => {
      UI.burst(this, g.x, g.y, 'puff', 14, { speed: { min: 40, max: 160 }, gravityY: -60 });
      Sfx.poof();
      g.destroy();
    } });
    if (g.gate) {
      this.gateLeft--;
      if (this.gateLeft === 0) this.openGate();
    }
  }

  openGate() {
    this.gateOpen = true;
    Sfx.gate(); this.cameras.main.shake(900, 0.004);
    this.gate.body.enable = false;
    this.tweens.add({ targets: this.gate, y: this.gate.y - 260, duration: 1500, ease: 'Sine.easeIn' });
    UI.banner(this, 'The gate is open!', GOLD, 1600, 48);
    this.tell('campGate', LINES.campGate, GOLD, 0);
  }

  dropRock() {
    const R = RESCUE;
    const x = Phaser.Math.Clamp(this.p.x + Phaser.Math.Between(-60, 260) * this.p.facing, R.rockZone[0], R.rockZone[1]);
    const shadow = this.add.image(x, GROUND_Y + 2, 'shadow').setScale(PX).setDepth(8).setAlpha(0.2);
    this.tweens.add({ targets: shadow, alpha: 0.8, scaleX: PX * 1.3, duration: 700 });
    const rock = this.add.image(x, -40, 'rock').setScale(PX).setDepth(45);
    rock.shadow = shadow; rock.live = true;
    this.rocks.push(rock);
    this.tweens.add({ targets: rock, y: GROUND_Y - 14, angle: 180, duration: 1100, ease: 'Quad.easeIn', onComplete: () => {
      rock.live = false;
      UI.burst(this, rock.x, GROUND_Y - 10, 'rubble', 10, { speed: { min: 80, max: 220 }, gravityY: 900 });
      Sfx.rumble(); this.cameras.main.shake(80, 0.003);
      shadow.destroy(); rock.destroy();
    } });
  }
  updateRocks() {
    const pb = this.p.getBounds();
    this.rocks = this.rocks.filter(r => r.active);
    for (const r of this.rocks) {
      if (!r.live || r.y < 200) continue;
      const rb = new Phaser.Geom.Rectangle(r.x - 12, r.y - 12, 24, 24);
      if (Phaser.Geom.Rectangle.Overlaps(rb, pb) && this.hurt()) Plat.knockback(this.p, r.x);
    }
  }

  takeKey() {
    this.hasKey = true;
    Sfx.key();
    this.tweens.killTweensOf(this.key);
    this.keyGlow.destroy();
    this.tweens.add({ targets: this.key, y: this.key.y - 60, alpha: 0, duration: 500, onComplete: () => this.key.setVisible(false) });
    this.keyIcon.setAlpha(1);
    this.tweens.add({ targets: this.keyIcon, scale: PX * 1.6, yoyo: true, duration: 200 });
    this.tell('key', LINES.gotKey, GOLD, 0);
  }

  freeLot() {
    this.freed = true;
    Sfx.key(); Sfx.win();
    this.keyIcon.setAlpha(0.25);
    this.cage.setTexture('cage_open');
    UI.burst(this, this.cage.x + 42, GROUND_Y - 60, 'spark', 26, { speed: { min: 80, max: 260 }, gravityY: 200 });
    UI.bubble(this, this.lot.x, this.lot.y - 84, LINES.freed, 2600, { follow: this.lot });
    Narrator.say(LINES.freed, () => this.tell('freedNarr', LINES.freedNarr, '#b8f28a', 0));
    this.spawn = { x: RESCUE.cageX + 60, y: GROUND_Y - 40 };
    this.trail = [];
    this.addScore(300);
  }

  followLot() {
    const p = this.p, t = this.trail;
    const last = t[t.length - 1];
    if (!last || Phaser.Math.Distance.Between(last.x, last.y, p.x, p.y) > 4) t.push({ x: p.x, y: p.y + 36 });
    if (t.length > 80) t.shift();
    const lot = this.lot;
    const target = t.length > 16 ? t[t.length - 16] : null;
    if (target) {
      const moved = Math.abs(target.x - lot.x) > 0.5;
      lot.setFlipX(target.x < lot.x);
      lot.setPosition(target.x, target.y);
      if (moved) lot.anims.play('lot_walk', true); else { lot.anims.stop(); lot.setTexture('lot_idle'); }
    } else { lot.anims.stop(); lot.setTexture('lot_idle'); }
  }

  respawn() {
    const p = this.p;
    p.setPosition(this.spawn.x, this.spawn.y);
    p.body.setVelocity(0, 0); p.knock = 0;
    this.invuln = 1200;
    if (this.freed) { this.trail = []; this.lot.setPosition(this.spawn.x - 50, GROUND_Y); }
  }
  outOfHearts() { this.respawn(); }

  reachSafety() {
    this.ended = true;
    this.p.body.setVelocity(0, 0); this.p.anims.stop(); this.p.setTexture('av_idle');
    this.arrow.setVisible(false);
    Music.stop(); Sfx.win();
    for (const f of this.friends) this.tweens.add({ targets: f, y: f.y - 24, yoyo: true, repeat: 5, duration: 220 });
    UI.banner(this, 'Lot is safe!', '#b8f28a', 3000, 56);
    this.addScore(500);
    this.hud.say(LINES.safe, '#b8f28a', 4000);
    let done = false;
    const go = () => { if (!done) { done = true; this.ended = false; this.complete(); } };
    Narrator.say(LINES.safe, () => this.time.delayedCall(Save.data.voice ? 800 : 3500, go));
    this.time.delayedCall(8000, go);
  }
}
