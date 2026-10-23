/* Game entry point. 960×540 logical pixels, scaled to fit the window. */
const SCENES = ['Boot', 'Menu', 'Story', 'Journey', 'Shepherds', 'Rescue', 'Stars', 'Victory', 'Pause', 'MedalPop']
  .map((n) => { try { return eval(n); } catch (e) { return null; } }) // top-level classes are not window properties
  .filter(Boolean);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#140e24',
  render: { antialias: true, roundPixels: true },
  physics: { default: 'arcade', arcade: { gravity: { y: 1500 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { keyboard: { target: window } },
  scene: SCENES,
});
window.LLGame = game;
