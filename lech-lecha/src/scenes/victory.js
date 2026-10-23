/* Final screen: the four medals, the score and the three lessons. */
class Victory extends Phaser.Scene {
  constructor() { super('Victory'); }

  create() {
    Music.setSour(false);
    Music.play('victory');
    this.cameras.main.fadeIn(500);
    this.add.image(0, 0, 'sky_night').setOrigin(0, 0);
    this.add.tileSprite(0, 540, W, 300, 'far_night').setOrigin(0, 1).setTileScale(PX);
    for (let i = 0; i < 40; i++) {
      const s = this.add.image(Math.random() * W, Math.random() * 300, 'tiny').setScale(2).setAlpha(0.3);
      this.tweens.add({ targets: s, alpha: 1, yoyo: true, repeat: -1, duration: 600 + Math.random() * 1200, delay: Math.random() * 1000 });
    }

    UI.text(this, W / 2, 58, 'You finished the journey!', 52, GOLD, { display: true, strokeThickness: 10 });
    UI.text(this, W / 2, 106, 'Avraham trusted Hashem all the way.', 24, CREAM);

    const total = Object.values(Save.data.best).reduce((a, b) => a + b, 0);
    LEVELS.forEach((lvl, i) => {
      const x = 180 + i * 200, have = !!Save.data.medals[lvl.medal];
      const m = this.add.image(x, 210, 'medal_' + lvl.medal + (have ? '' : '_off')).setScale(0);
      this.tweens.add({ targets: m, scale: PX * 1.6, angle: 360, duration: 700, delay: 300 + i * 350, ease: 'Back.easeOut', onStart: () => have && Sfx.coin() });
      UI.text(this, x, 290, lvl.medalName, 19, have ? CREAM : '#8a8680', { weight: '700' });
    });
    UI.text(this, W / 2, 330, 'Total score ' + total, 24, GOLD);

    UI.panel(this, 150, 356, 660, 124, 0x2b1b17, 0.8);
    UI.text(this, W / 2, 380, 'What Avraham teaches us', 22, GOLD, { display: true, strokeThickness: 5 });
    const lessons = ['Trust Hashem, even when you don’t know what comes next.', 'Choose peace, like Avraham did with Lot.', 'Help others, like Avraham rescued Lot.'];
    lessons.forEach((l, i) => UI.text(this, W / 2, 410 + i * 24, l, 19, CREAM, { strokeThickness: 0 }));

    const prompt = UI.text(this, W / 2, 512, 'Press Enter for the menu', 20, CREAM, { strokeThickness: 5 });
    this.tweens.add({ targets: prompt, alpha: 0.3, yoyo: true, repeat: -1, duration: 700 });

    const colors = [0xf2c14e, 0xc4452f, 0x5fb3e8, 0x8fd14f, 0x7b4c9c, 0xffffff];
    this.time.addEvent({ delay: 500, repeat: 8, callback: () => {
      UI.burst(this, Phaser.Math.Between(100, W - 100), Phaser.Math.Between(60, 200), 'spark', 24, {
        speed: { min: 120, max: 320 }, gravityY: 260, lifespan: 1200, tint: colors,
      });
    } });

    this.time.delayedCall(1800, () => Narrator.say('You finished the journey! Avraham trusted Hashem all the way. Trust Hashem, choose peace, and help others.'));
    const t0 = this.time.now;
    const back = () => { if (this.time.now - t0 > 1000) { Narrator.stop(); this.scene.start('Menu'); } };
    this.input.keyboard.on('keydown-ENTER', back);
    this.input.on('pointerdown', back);
  }
}
