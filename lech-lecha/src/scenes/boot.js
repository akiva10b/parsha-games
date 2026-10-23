/* Draws every texture, waits briefly for the web fonts, then asks for
   one click or key press: browsers only allow sound after a gesture. */
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    Art.generate(this);
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
    const fonts = (document.fonts && document.fonts.load)
      ? Promise.all([document.fonts.load('32px "Lilita One"'), document.fonts.load('600 24px "Fredoka"'), document.fonts.load('700 24px "Fredoka"')])
      : Promise.resolve();
    const timeout = new Promise((r) => setTimeout(r, 2500));
    Promise.race([fonts, timeout]).then(() => this.showStart(), () => this.showStart());
  }

  showStart() {
    this.add.image(0, 0, 'sky_day').setOrigin(0, 0);
    this.add.tileSprite(0, 420, W, 300, 'far_desert').setOrigin(0, 1).setTileScale(PX);
    this.add.tileSprite(0, 470, W, 300, 'near_desert').setOrigin(0, 1).setTileScale(PX);
    this.add.tileSprite(0, 448, W, 100, 'ground_desert').setOrigin(0, 0).setTileScale(PX);
    const av = this.add.sprite(W / 2, 412, 'av_idle').setScale(PX * 1.5);
    av.anims.play('av_walk');
    UI.text(this, W / 2, 150, 'Lech Lecha', 84, GOLD, { display: true, strokeThickness: 12 });
    UI.text(this, W / 2, 222, 'The Journey of Avraham', 34, CREAM, { display: true, strokeThickness: 8 });
    const go = UI.text(this, W / 2, 300, 'Click or press any key to start', 30, CREAM, { strokeThickness: 7 });
    this.tweens.add({ targets: go, alpha: 0.35, yoyo: true, repeat: -1, duration: 700 });

    let started = false;
    const start = () => {
      if (started) return; started = true;
      Snd.ensure(); Narrator.init();
      Sfx.click();
      this.scene.start('Menu');
    };
    this.input.keyboard.once('keydown', start);
    this.input.once('pointerdown', start);
  }
}
