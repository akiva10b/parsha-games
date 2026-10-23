# Lech Lecha: The Journey of Avraham

A four-level 2D browser game for children (about ages 5–9) that retells Parshat Lech Lecha (Bereishit 12–17).

| Level | Kind of game | What you do |
|---|---|---|
| 1. Lech Lecha | Side-scrolling platformer | Break 5 idols (from the Midrash) to open Charan's gate, then follow the golden arrow to Canaan. If you take a dead-end fork or head back toward Charan, the arrow turns red, the music sours and the map flashes. |
| 2. The Shepherds | Arcade defense | As one of Avram's shepherds, toss soft wool balls to keep Lot's sheep out of the neighbors' fields. 3 waves. |
| 3. Rescue Lot | Action platformer | At night, bonk guards with your shepherd's staff, dodge falling rocks, beat the gate guards, find the key, free Lot and lead him home. |
| 4. Count the Stars | Catching game | Catch 30 falling stars in a basket. Big stars count 3. At the end the sky fills with stars. |

Story pages between the levels are read aloud by the browser's built-in voice, with subtitles. With the voice on, pages turn by themselves; the "How to play" pages wait for Enter.

## Controls

| Key | Action |
|---|---|
| ← → (or A D) | Move |
| Space or ↑ | Jump |
| X | Break idols / swing staff / toss wool |
| Enter | Next page, continue |
| P or Esc | Pause (resume, restart level, main menu) |
| M | Sound and voice on/off |
| S | Skip a story |

You start with 3 hearts and get unlimited tries. Losing all hearts sends you back to the last checkpoint (or the start of the wave in Level 2), never to the start of the game. Unlocked levels and medals are saved in the browser.

## Running it

The game needs no build step and installs nothing. Serve the folder with any static file server:

```bash
cd lech-lecha && python3 -m http.server 8737
```

Then open http://localhost:8737. Opening `index.html` directly from disk also works in most browsers.

To deploy, upload the `lech-lecha` folder as-is to any static host (Netlify drop, Vercel, GitHub Pages, S3).

## How it's built

- **Phaser 3.80.1**, loaded from cdnjs. There are no other dependencies.
- **All art is drawn in code** (`src/art.js`): characters are pixel grids of palette letters, and recoloring gives Sarai, Lot, the shepherds and the guards. Backgrounds, tiles, medals and props are drawn on canvases. There are no image files.
- **All sound is synthesized** with WebAudio (`src/audio.js`): the sound effects and a small step-sequencer for each level's music (the journey tune uses the Hijaz scale). Narration uses the browser's speech voice, with spoken spellings for Hebrew names in `SPEAK_FIX`.
- **All words are in `src/strings.js`**: story pages, how-to rows, in-level lines and level names. A Hebrew version only needs a translated copy of this file.

```
lech-lecha/
├── index.html
└── src/
    ├── strings.js     story text, level list, spoken spellings
    ├── save.js        progress in localStorage (guarded)
    ├── audio.js       sound effects, music sequencer, narrator
    ├── art.js         every texture and animation
    ├── ui.js          HUD, bubbles, banners, keycaps, BaseLevel
    ├── platformer.js  shared player and level-building code
    ├── main.js        Phaser config
    └── scenes/        boot, menu, story, overlays, journey,
                       shepherds, rescue, stars, victory
```

Level layouts are plain data at the top of each level file (`JOURNEY`, `WAVES`, `RESCUE`, `STAR_GOAL`), so they are easy to tune.

## Story notes

- Idol-breaking is labeled in the game as coming from the Midrash, not the Torah's text.
- The game calls him Avram and her Sarai until the ending, where Hashem gives the new names Avraham and Sarah (Bereishit 17).
- The ending says that Yitzchak's birth comes in next week's parsha, Vayera.
