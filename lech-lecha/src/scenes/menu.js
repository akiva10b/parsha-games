/* Main menu: play, pick a level, and voice / sound switches.
   Arrow keys + Enter or the mouse both work. */
class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    Narrator.stop();
    this.panel = null; // scene objects are reused between visits
    Music.setSour(false);
    Music.play('story');
    this.add.image(0, 0, 'sky_day').setOrigin(0, 0);
    this.far = this.add.tileSprite(0, 420, W, 300, 'far_desert').setOrigin(0, 1).setTileScale(PX);
    this.near = this.add.tileSprite(0, 470, W, 300, 'near_desert').setOrigin(0, 1).setTileScale(PX);
    this.ground = this.add.tileSprite(0, 448, W, 100, 'ground_desert').setOrigin(0, 0).setTileScale(PX);

    const walkers = [['sheep', 150, 430], ['sheep', 215, 428], ['av', 330, 412], ['sarai', 410, 412], ['lot', 490, 412], ['sheep', 590, 430]];
    for (const [who, x, y] of walkers) {
      const s = this.add.sprite(x, y, who === 'sheep' ? 'sheep_0' : who + '_idle').setScale(PX);
      s.anims.play(who === 'sheep' ? 'sheep_walk' : who + '_walk');
    }

    UI.text(this, W / 2, 62, 'Lech Lecha', 76, GOLD, { display: true, strokeThickness: 12 });
    UI.text(this, W / 2 - 185, 124, 'לֶךְ לְךָ', 30, GOLD, { strokeThickness: 6 });
    UI.text(this, W / 2 + 40, 124, 'The Journey of Avraham', 26, CREAM, { strokeThickness: 6 });

    const d = Save.data;
    const playLabel = d.finished ? 'Play again' : (d.unlocked > 1 ? `Continue: Level ${d.unlocked}` : 'Play');
    this.items = [
      UI.button(this, W / 2, 200, playLabel, () => this.play(d.finished ? 1 : d.unlocked), 380),
      UI.button(this, W / 2, 264, 'Choose a level', () => this.openLevels(), 380),
      UI.button(this, W / 2 - 96, 328, '', () => this.toggleVoice(), 184),
      UI.button(this, W / 2 + 96, 328, '', () => this.toggleSoundBtn(), 184),
    ];
    this.refreshToggles();
    this.focus = 0;
    this.items.forEach((b, i) => b.on('pointerover', () => this.setFocus(i)));
    this.setFocus(0);

    UI.text(this, W / 2, 520, 'Grown-ups: the idol-breaking part comes from the Midrash, not the Torah’s text.', 15, CREAM, { strokeThickness: 4 }).setAlpha(0.9);

    const k = this.input.keyboard;
    k.on('keydown-UP', () => this.move(-1));
    k.on('keydown-DOWN', () => this.move(1));
    k.on('keydown-LEFT', () => { if (this.focus >= 2) this.setFocus(2); else if (this.panel) this.move(-1); });
    k.on('keydown-RIGHT', () => { if (this.focus >= 2) this.setFocus(3); else if (this.panel) this.move(1); });
    k.on('keydown-ENTER', () => this.activate());
    k.on('keydown-SPACE', () => this.activate());
    k.on('keydown-ESC', () => this.closeLevels());
  }

  update(time, dt) {
    this.far.tilePositionX += dt * 0.004;
    this.near.tilePositionX += dt * 0.012;
    this.ground.tilePositionX += dt * 0.03;
  }

  refreshToggles() {
    this.items[2].label.setText(Save.data.voice ? 'Voice: On' : 'Voice: Off');
    this.items[3].label.setText(Save.data.sound ? 'Sound: On' : 'Sound: Off');
  }
  toggleVoice() {
    Narrator.setVoice(!Save.data.voice); this.refreshToggles();
    if (Save.data.voice) Narrator.say('Hello! I will read the story to you.');
  }
  toggleSoundBtn() { Snd.setSound(!Save.data.sound); this.refreshToggles(); }

  list() { return this.panel ? this.levelItems : this.items; }
  setFocus(i) {
    const l = this.list();
    this.focus = Phaser.Math.Clamp(i, 0, l.length - 1);
    l.forEach((b, j) => b.draw(j === this.focus));
  }
  move(dir) {
    let i = this.focus + dir;
    if (!this.panel && this.focus === 3 && dir < 0) i = 1;
    if (!this.panel && this.focus === 2 && dir > 0) i = 3;
    this.setFocus(Phaser.Math.Wrap(i, 0, this.list().length));
    Sfx.click();
  }
  activate() { const b = this.list()[this.focus]; if (b) b.emit('pointerdown'); }

  play(n) {
    const lvl = LEVELS[n - 1];
    Narrator.stop();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Story', { id: lvl.story }));
  }

  openLevels() {
    if (this.panel) return;
    const c = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(0, 0, W, H, 0x140e24, 0.75).setOrigin(0, 0).setInteractive();
    c.add(shade);
    c.add(UI.panel(this, 60, 80, W - 120, 400));
    c.add(UI.text(this, W / 2, 120, 'Choose a level', 40, GOLD, { display: true }));
    this.levelItems = [];
    LEVELS.forEach((lvl, i) => {
      const x = 180 + i * 200, y = 290;
      const open = lvl.n <= Save.data.unlocked;
      const b = UI.button(this, x, y, '', () => { if (open) this.play(lvl.n); else { Sfx.wrong(); } }, 170);
      b.setSize(170, 220); b.input.hitArea.setSize(170, 220);
      b.draw = (focused) => {
        b.g.clear();
        b.g.fillStyle(focused ? 0xf2c14e : 0x3a2a22, 1); b.g.fillRoundedRect(-85, -110, 170, 220, 14);
        b.g.lineStyle(3, focused ? 0xffffff : 0xf2c14e, 1); b.g.strokeRoundedRect(-85, -110, 170, 220, 14);
        b.num.setColor(focused ? INK : GOLD); b.nm.setColor(focused ? INK : CREAM);
      };
      b.num = UI.text(this, 0, -78, String(lvl.n), 40, GOLD, { display: true, strokeThickness: 0 });
      b.nm = UI.text(this, 0, 74, lvl.name, 20, CREAM, { strokeThickness: 0, wrap: 150, weight: '700' });
      const medal = this.add.image(0, -4, open ? (Save.data.medals[lvl.medal] ? 'medal_' + lvl.medal : 'medal_' + lvl.medal + '_off') : 'lock').setScale(open ? PX : PX * 1.4);
      b.add([b.num, b.nm, medal]);
      b.on('pointerover', () => this.setFocus(i));
      c.add(b);
      this.levelItems.push(b);
    });
    const back = UI.button(this, W / 2, 444, 'Back', () => this.closeLevels(), 180);
    back.on('pointerover', () => this.setFocus(4));
    c.add(back);
    this.levelItems.push(back);
    this.panel = c;
    this.setFocus(0);
  }
  closeLevels() {
    if (!this.panel) return;
    this.panel.destroy(); this.panel = null;
    this.setFocus(1);
  }
}
