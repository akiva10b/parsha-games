/* Scenes drawn on top of a level: the pause menu and the medal award. */

class Pause extends Phaser.Scene {
  constructor() { super('Pause'); }
  init(data) { this.from = data.from; }
  create() {
    this.add.rectangle(0, 0, W, H, 0x140e24, 0.7).setOrigin(0, 0);
    UI.panel(this, W / 2 - 220, 110, 440, 320);
    UI.text(this, W / 2, 160, 'Paused', 48, GOLD, { display: true });
    const items = [
      UI.button(this, W / 2, 240, 'Keep playing', () => this.resume(), 320),
      UI.button(this, W / 2, 308, 'Restart level', () => this.restart(), 320),
      UI.button(this, W / 2, 376, 'Main menu', () => this.menu(), 320),
    ];
    let f = 0;
    const draw = () => items.forEach((b, i) => b.draw(i === f));
    items.forEach((b, i) => b.on('pointerover', () => { f = i; draw(); }));
    draw();
    const k = this.input.keyboard;
    k.on('keydown-UP', () => { f = (f + 2) % 3; draw(); });
    k.on('keydown-DOWN', () => { f = (f + 1) % 3; draw(); });
    k.on('keydown-ENTER', () => items[f].emit('pointerdown'));
    k.on('keydown-P', () => this.resume());
    k.on('keydown-ESC', () => this.resume());
    k.on('keydown-R', () => this.restart());
  }
  resume() { this.scene.resume(this.from); this.scene.stop(); }
  restart() { const lvl = this.scene.get(this.from); this.scene.stop(); lvl.scene.restart(); }
  menu() { this.scene.stop(this.from); this.scene.start('Menu'); }
}

class MedalPop extends Phaser.Scene {
  constructor() { super('MedalPop'); }
  init(data) { this.d = data; }
  create() {
    const d = this.d;
    Music.stop(); Sfx.win();
    this.add.rectangle(0, 0, W, H, 0x140e24, 0.55).setOrigin(0, 0);
    UI.panel(this, W / 2 - 240, 90, 480, 360);
    UI.text(this, W / 2, 138, 'Level complete!', 44, GOLD, { display: true });
    const m = this.add.image(W / 2, 260, 'medal_' + d.medal).setScale(0);
    this.tweens.add({ targets: m, scale: PX * 2, angle: 360, duration: 800, ease: 'Back.easeOut' });
    UI.text(this, W / 2, 360, 'You earned the ' + d.name + '!', 28, CREAM);
    UI.text(this, W / 2, 398, 'Score ' + d.score, 22, GOLD);
    const go = UI.text(this, W / 2, 430, 'Press Enter to continue', 18, CREAM, { strokeThickness: 4 });
    this.tweens.add({ targets: go, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 });
    UI.burst(this, W / 2, 260, 'spark', 40, { speed: { min: 150, max: 420 }, gravityY: 200 });
    this.time.delayedCall(700, () => Narrator.say(LINES.medal(d.name)));
    let done = false; const t0 = this.time.now;
    const cont = () => {
      if (done || this.time.now - t0 < 900) return; done = true;
      Narrator.stop();
      this.scene.stop(d.from);
      this.scene.start(d.next.scene, d.next.data);
    };
    this.input.keyboard.on('keydown-ENTER', cont);
    this.input.keyboard.on('keydown-SPACE', cont);
    this.input.on('pointerdown', cont);
  }
}
