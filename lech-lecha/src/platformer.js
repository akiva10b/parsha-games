/* Shared side-scrolling pieces for the Journey and Rescue levels:
   building solid ground from level data, the player character with
   forgiving jumps (coyote time + jump buffer), and parallax layers. */

const GROUND_Y = 448;

const Plat = {
  /* data: { width, ground: [[x0,x1]], platforms: [[x,y,w]], walls: [[x,y,w,h]], water: [[x0,x1]] } */
  build(scene, data, theme) {
    const solids = [];
    const solid = (obj) => { scene.physics.add.existing(obj, true); solids.push(obj); return obj; };
    const groundKey = 'ground_' + theme.ground;
    for (const [x0, x1, k] of data.ground) {
      solid(scene.add.tileSprite(x0, GROUND_Y, x1 - x0, H - GROUND_Y + 60, k ? 'ground_' + k : groundKey).setOrigin(0, 0).setTileScale(PX).setDepth(10));
    }
    for (const [x, y, w] of data.platforms || []) {
      solid(scene.add.tileSprite(x, y, w, 24, theme.plat).setOrigin(0, 0).setTileScale(PX).setDepth(10));
    }
    for (const [x, y, w, h] of data.walls || []) {
      solid(scene.add.tileSprite(x, y, w, h, 'rockwall').setOrigin(0, 0).setTileScale(PX).setDepth(10));
    }
    scene.waterStrips = [];
    for (const [x0, x1] of data.water || []) {
      const wtr = scene.add.tileSprite(x0, GROUND_Y + 40, x1 - x0, H - GROUND_Y, 'water').setOrigin(0, 0).setTileScale(PX).setDepth(9).setAlpha(0.95);
      scene.waterStrips.push(wtr);
    }
    return solids;
  },

  parallax(scene, sky, layers) {
    scene.add.image(0, 0, sky).setOrigin(0, 0).setScrollFactor(0).setDepth(-100);
    const out = [];
    layers.forEach(([key, y, factor], i) => {
      const ts = scene.add.tileSprite(0, y, W, 300, key).setOrigin(0, 1).setScrollFactor(0).setTileScale(PX).setDepth(-90 + i);
      ts.factor = factor;
      out.push(ts);
    });
    scene.events.on('update', () => {
      const sx = scene.cameras.main.scrollX;
      for (const ts of out) ts.tilePositionX = (sx * ts.factor) / PX;
      for (const w of scene.waterStrips || []) w.tilePositionX += 0.15;
    });
    return out;
  },

  makePlayer(scene, x, y, who = 'av') {
    const p = scene.physics.add.sprite(x, y, who + '_idle').setScale(PX).setDepth(50);
    p.body.setSize(10, 22).setOffset(7, 2);
    p.who = who; p.coyote = 0; p.jumpBuf = 0; p.attackT = 0; p.knock = 0; p.swingCd = 0; p.facing = 1; p.wasGround = true;
    return p;
  },

  /* Call every frame. Returns true when the player started a jump. */
  updatePlayer(scene, p, dt, speed = 230) {
    const b = p.body;
    const onGround = b.blocked.down || b.touching.down;
    p.coyote = onGround ? 110 : p.coyote - dt;
    p.jumpBuf = scene.jumpPressed() ? 140 : p.jumpBuf - dt;
    if (p.attackT > 0) p.attackT -= dt;
    if (p.swingCd > 0) p.swingCd -= dt;
    let jumped = false;

    if (p.knock > 0) {
      p.knock -= dt;
    } else {
      let dir = 0;
      if (scene.dirLeft()) dir -= 1;
      if (scene.dirRight()) dir += 1;
      b.setVelocityX(dir * speed);
      if (dir) p.facing = dir;
      if (p.jumpBuf > 0 && p.coyote > 0) {
        b.setVelocityY(-640); p.coyote = 0; p.jumpBuf = 0; jumped = true; Sfx.jump();
      }
    }
    // Short hop when the jump key is let go early.
    if (!scene.jumpHeld() && b.velocity.y < -200) b.velocity.y += 2600 * (dt / 1000);
    if (onGround && !p.wasGround) Sfx.land();
    p.wasGround = onGround;

    p.setFlipX(p.facing < 0);
    const w = p.who;
    if (p.attackT > 0) { p.anims.stop(); p.setTexture(w + '_attack'); }
    else if (!onGround) { p.anims.stop(); p.setTexture(w + '_jump'); }
    else if (Math.abs(b.velocity.x) > 5) p.anims.play(w + '_walk', true);
    else { p.anims.stop(); p.setTexture(w + '_idle'); }

    if (scene.invuln > 0) { scene.invuln -= dt; p.setAlpha(Math.floor(scene.invuln / 90) % 2 ? 0.35 : 1); }
    else p.setAlpha(1);
    return jumped;
  },

  /* Swing the staff; returns the hit rectangle in world space. */
  swing(scene, p) {
    if (p.swingCd > 0) return null;
    p.swingCd = 340; p.attackT = 230;
    Sfx.swing();
    const sw = scene.add.image(p.x + p.facing * 40, p.y - 2, 'swoosh').setScale(PX).setDepth(60).setFlipX(p.facing < 0);
    scene.tweens.add({ targets: sw, alpha: 0, x: sw.x + p.facing * 20, duration: 200, onComplete: () => sw.destroy() });
    const rx = p.facing > 0 ? p.x + 4 : p.x - 84;
    return new Phaser.Geom.Rectangle(rx, p.y - 44, 80, 80);
  },

  knockback(p, fromX) {
    const dir = p.x < fromX ? -1 : 1;
    p.body.setVelocity(dir * 260, -320);
    p.knock = 320;
  },

  arrow(scene) {
    const a = scene.add.image(0, 0, 'arrow').setScale(PX).setDepth(70);
    a.point = (p, tx, ty, wrong, t) => {
      const ang = Phaser.Math.Angle.Between(p.x, p.y - 20, tx, ty);
      a.setPosition(p.x + Math.cos(ang) * 8, p.y - 70 + Math.sin(t / 160) * 4);
      a.setRotation(ang);
      a.setTint(wrong ? 0xff4a3a : 0xffd34d);
      a.setScale(wrong ? PX * 1.25 : PX);
    };
    return a;
  },
};
