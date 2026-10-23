/* Sound: every effect and song is synthesized with WebAudio, so the
   game ships no audio files. Narration uses the browser's own voice. */

const Snd = (() => {
  let ctx = null, master, sfxBus, musicBus;
  let noiseBuf = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = Save.data.sound ? 1 : 0;
      master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.45; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.16; musicBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ type = 'square', f = 440, f2 = null, dur = 0.15, vol = 0.3, t = 0, bus = 'sfx', detune = 0, attack = 0.005 }) {
    const c = ensure(); if (!c) return;
    const start = t || c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, start);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), start + dur);
    o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(bus === 'music' ? musicBus : sfxBus);
    o.start(start); o.stop(start + dur + 0.02);
  }

  function noise({ dur = 0.2, vol = 0.3, t = 0, freq = 1200, q = 0.8, type = 'bandpass', bus = 'sfx' }) {
    const c = ensure(); if (!c) return;
    const start = t || c.currentTime;
    const src = c.createBufferSource(); src.buffer = noiseBuf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(fl); fl.connect(g); g.connect(bus === 'music' ? musicBus : sfxBus);
    src.start(start, Math.random() * 0.5); src.stop(start + dur + 0.02);
  }

  function setSound(on) {
    Save.set('sound', on);
    if (master) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.02);
  }
  function duck(on) {
    if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.05 : 0.16, ctx.currentTime, 0.15);
  }
  return { ensure, tone, noise, setSound, duck, get ctx() { return ctx; } };
})();

const Sfx = {
  jump()   { Snd.tone({ type: 'square', f: 300, f2: 620, dur: 0.14, vol: 0.18 }); },
  land()   { Snd.noise({ dur: 0.06, vol: 0.12, freq: 400 }); },
  swing()  { Snd.noise({ dur: 0.16, vol: 0.22, freq: 1800, q: 1.5 }); },
  smash()  { Snd.noise({ dur: 0.35, vol: 0.5, freq: 600, q: 0.6 }); Snd.tone({ type: 'triangle', f: 160, f2: 50, dur: 0.3, vol: 0.4 }); },
  bonk()   { Snd.tone({ type: 'square', f: 520, f2: 180, dur: 0.12, vol: 0.25 }); Snd.noise({ dur: 0.08, vol: 0.2, freq: 900 }); },
  poof()   { Snd.noise({ dur: 0.4, vol: 0.25, freq: 2500, q: 0.5, type: 'highpass' }); },
  coin()   { const t = Snd.ensure() && Snd.ctx.currentTime; if (!t) return;
             Snd.tone({ type: 'square', f: 988, dur: 0.08, vol: 0.15, t }); Snd.tone({ type: 'square', f: 1319, dur: 0.2, vol: 0.15, t: t + 0.07 }); },
  hurt()   { Snd.tone({ type: 'sawtooth', f: 420, f2: 110, dur: 0.35, vol: 0.25 }); },
  throw()  { Snd.noise({ dur: 0.12, vol: 0.15, freq: 2200, q: 2 }); Snd.tone({ type: 'sine', f: 500, f2: 900, dur: 0.1, vol: 0.1 }); },
  baa()    { const c = Snd.ensure(); if (!c) return; const t = c.currentTime;
             for (let i = 0; i < 5; i++) Snd.tone({ type: 'sawtooth', f: 520 + (i % 2) * 40, dur: 0.09, vol: 0.12, t: t + i * 0.07 }); },
  munch()  { const c = Snd.ensure(); if (!c) return; const t = c.currentTime;
             for (let i = 0; i < 3; i++) Snd.noise({ dur: 0.07, vol: 0.25, freq: 700, t: t + i * 0.12 }); },
  key()    { const c = Snd.ensure(); if (!c) return; const t = c.currentTime;
             [784, 988, 1175, 1568].forEach((f, i) => Snd.tone({ type: 'triangle', f, dur: 0.18, vol: 0.2, t: t + i * 0.08 })); },
  gate()   { Snd.tone({ type: 'sawtooth', f: 70, f2: 40, dur: 1.2, vol: 0.25 }); Snd.noise({ dur: 1.2, vol: 0.15, freq: 200 }); },
  star(big) { const c = Snd.ensure(); if (!c) return; const t = c.currentTime;
             const notes = big ? [1047, 1319, 1568, 2093] : [1568, 2093];
             notes.forEach((f, i) => Snd.tone({ type: 'triangle', f, dur: 0.25, vol: 0.14, t: t + i * 0.05 })); },
  check()  { const c = Snd.ensure(); if (!c) return; const t = c.currentTime;
             [523, 659, 784].forEach((f, i) => Snd.tone({ type: 'square', f, dur: 0.15, vol: 0.14, t: t + i * 0.1 })); },
  wrong()  { Snd.tone({ type: 'square', f: 220, dur: 0.15, vol: 0.12 }); Snd.tone({ type: 'square', f: 208, dur: 0.25, vol: 0.12, t: Snd.ctx && Snd.ctx.currentTime + 0.16 }); },
  win()    { const c = Snd.ensure(); if (!c) return; const t = c.currentTime;
             [523, 659, 784, 1047, 784, 1047].forEach((f, i) => Snd.tone({ type: 'square', f, dur: 0.22, vol: 0.16, t: t + i * 0.12 })); },
  click()  { Snd.tone({ type: 'square', f: 660, dur: 0.05, vol: 0.12 }); },
  rumble() { Snd.noise({ dur: 0.5, vol: 0.3, freq: 150, q: 0.5 }); },
};

/* A tiny step sequencer. Songs are 32 eighth-note steps of MIDI notes.
   Journey music leans on the Hijaz scale for a Near-Eastern colour. */
const Music = (() => {
  const _ = null;
  const SONGS = {
    story: { bpm: 84, wave: 'triangle', vol: 0.5,
      mel: [62,_,63,_, 66,_,67,_, 69,_,_,_, 67,66,63,_, 62,_,63,_, 66,_,63,_, 62,_,_,_, _,_,_,_],
      bass: [50,_,_,_, _,_,_,_, 50,_,_,_, _,_,_,_, 55,_,_,_, _,_,_,_, 50,_,_,_, _,_,_,_],
      drum: 'k.......' },
    journey: { bpm: 112, wave: 'square', vol: 0.32,
      mel: [62,_,63,66, 67,_,66,63, 62,_,_,_, 69,67,66,63, 66,_,67,69, 70,_,69,67, 66,63,62,_, 62,_,_,_],
      bass: [50,_,_,_, 50,_,_,_, 50,_,_,_, 55,_,_,_, 50,_,_,_, 55,_,_,_, 50,_,57,_, 50,_,_,_],
      drum: 'k..sk.s.' },
    pasture: { bpm: 132, wave: 'square', vol: 0.28,
      mel: [67,71,74,71, 76,74,71,_, 67,69,71,74, 71,69,67,_, 72,71,69,67, 69,71,74,_, 76,74,71,69, 67,_,67,_],
      bass: [43,_,50,_, 43,_,50,_, 48,_,55,_, 50,_,57,_, 48,_,55,_, 43,_,50,_, 48,_,50,_, 43,_,_,_],
      drum: 'k.h.s.h.' },
    battle: { bpm: 140, wave: 'square', vol: 0.3,
      mel: [64,_,64,67, 71,_,69,67, 66,_,66,69, 71,_,72,71, 64,_,64,67, 71,_,74,72, 71,69,67,66, 64,_,_,_],
      bass: [40,_,40,_, 40,_,47,_, 38,_,38,_, 38,_,45,_, 40,_,40,_, 40,_,47,_, 47,_,45,_, 40,_,40,_],
      drum: 'k.skk.s.' },
    stars: { bpm: 76, wave: 'triangle', vol: 0.4,
      mel: [72,76,79,83, 79,76,72,_, 74,77,81,84, 81,77,74,_, 71,74,79,83, 79,74,71,_, 72,76,79,84, 79,_,_,_],
      bass: [48,_,_,_, _,_,_,_, 50,_,_,_, _,_,_,_, 43,_,_,_, _,_,_,_, 48,_,_,_, _,_,_,_],
      drum: '........' },
    victory: { bpm: 140, wave: 'square', vol: 0.3,
      mel: [67,71,74,79, 78,74,71,74, 76,72,69,72, 74,71,67,_, 67,71,74,79, 81,79,78,76, 74,76,78,79, 79,_,79,_],
      bass: [43,_,50,_, 43,_,50,_, 45,_,52,_, 50,_,57,_, 43,_,50,_, 48,_,52,_, 50,_,50,_, 43,_,43,_],
      drum: 'k.s.k.ss' },
  };
  let song = null, name = null, timer = null, step = 0, nextT = 0, sour = false;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function play(n) {
    if (name === n && timer) return;
    stop();
    const c = Snd.ensure(); if (!c || !SONGS[n]) return;
    name = n; song = SONGS[n]; step = 0; nextT = c.currentTime + 0.08;
    timer = setInterval(tick, 25);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; name = null; }
  function setSour(on) { sour = on; }

  function tick() {
    const c = Snd.ctx; if (!c || !song) return;
    const dt = 60 / song.bpm / 2;
    while (nextT < c.currentTime + 0.15) {
      const i = step % 32, t = nextT;
      const m = song.mel[i];
      if (m != null) {
        Snd.tone({ type: song.wave, f: hz(sour ? m - 12 : m), detune: sour ? 45 : 0, dur: dt * 1.6, vol: song.vol, t, bus: 'music' });
      }
      const b = song.bass[i];
      if (b != null) Snd.tone({ type: 'triangle', f: hz(b - (sour ? 1 : 0)), dur: dt * 3.5, vol: 0.55, t, bus: 'music' });
      const d = song.drum[step % song.drum.length];
      if (d === 'k') Snd.tone({ type: 'sine', f: 140, f2: 45, dur: 0.18, vol: 0.7, t, bus: 'music' });
      if (d === 's') Snd.noise({ dur: 0.1, vol: 0.35, freq: 3000, q: 0.7, t, bus: 'music' });
      if (d === 'h') Snd.noise({ dur: 0.04, vol: 0.2, freq: 7000, q: 1, type: 'highpass', t, bus: 'music' });
      nextT += dt; step++;
    }
  }
  return { play, stop, setSour, get current() { return name; } };
})();

/* Narrator: plays the recorded voice file for a line when one exists
   (audio/voice/, made by tools/make-voice.mjs), otherwise the browser's
   speech voice reads it. Subtitles always show too. */
const Narrator = (() => {
  let voice = null, speaking = false, token = 0, clip = null;
  const ok = () => typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
  const recorded = (text) => {
    if (typeof VOICE_FILES === 'undefined') return null;
    const id = lineId(text);
    return VOICE_FILES[id] ? 'audio/voice/' + id + '.mp3' : null;
  };

  function pick() {
    if (!ok()) return;
    const vs = window.speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    const prefer = ['Samantha', 'Karen', 'Moira', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Daniel', 'Serena'];
    voice = null;
    for (const p of prefer) { voice = vs.find(v => v.name.indexOf(p) >= 0); if (voice) break; }
    if (!voice) voice = vs.find(v => v.default) || vs[0] || null;
  }
  function init() {
    if (!ok()) return;
    pick();
    try { window.speechSynthesis.onvoiceschanged = pick; } catch (e) { /* ignore */ }
  }
  function speakable(text) {
    let s = text;
    for (const [re, rep] of SPEAK_FIX) s = s.replace(re, rep);
    return s;
  }
  function silence() {
    if (clip) { clip.onended = clip.onerror = null; clip.pause(); clip = null; }
    try { if (ok()) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  }

  /* onEnd fires once, when speech finishes or right away if voice is off. */
  function say(text, onEnd, opts = {}) {
    const my = ++token;
    const done = () => { if (my !== token) return; speaking = false; clip = null; Snd.duck(false); if (onEnd) onEnd(); };
    const src = recorded(text);
    if (!Save.data.voice || (!src && !ok())) { if (onEnd) setTimeout(() => { if (my === token) onEnd(); }, 10); return; }
    if (opts.interrupt !== false) silence();
    speaking = true; Snd.duck(true);
    // If nothing reports the end, move on after a generous reading time.
    setTimeout(() => { if (my === token && speaking) done(); }, 4000 + text.length * 110);
    if (src) {
      const a = new Audio(src);
      clip = a;
      a.onended = done;
      a.onerror = () => { if (my === token) tts(text, done, opts); };
      const p = a.play();
      if (p && p.catch) p.catch(() => { if (my === token && clip === a) tts(text, done, opts); });
    } else tts(text, done, opts);
  }
  function tts(text, done, opts) {
    clip = null;
    if (!ok()) return done();
    try {
      const u = new SpeechSynthesisUtterance(speakable(text));
      if (voice) u.voice = voice;
      u.rate = opts.rate || 0.95; u.pitch = 1.08; u.volume = 1;
      u.onend = done; u.onerror = done;
      window.speechSynthesis.speak(u);
    } catch (e) { done(); }
  }
  function stop() {
    token++; speaking = false;
    if (Snd.ctx) Snd.duck(false);
    silence();
  }
  function setVoice(on) { Save.set('voice', on); if (!on) stop(); }
  return { init, say, stop, setVoice, get speaking() { return speaking; } };
})();
