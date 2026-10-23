/* Progress is kept in this browser only. Every access is guarded:
   storage can be missing (private windows, previews) and the game
   must still play from the start. */
const Save = (() => {
  const KEY = 'lechlecha.save.v1';
  const fresh = () => ({ unlocked: 1, medals: {}, best: {}, voice: true, sound: true });
  let data = fresh();

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) data = Object.assign(fresh(), JSON.parse(raw));
    } catch (e) { /* play without saving */ }
    return data;
  }
  function write() {
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }
  function complete(levelN, medal, score) {
    data.unlocked = Math.max(data.unlocked, Math.min(4, levelN + 1));
    if (levelN === 4) data.finished = true;
    data.medals[medal] = true;
    data.best[levelN] = Math.max(data.best[levelN] || 0, score || 0);
    write();
  }
  function set(k, v) { data[k] = v; write(); }
  function reset() { data = Object.assign(fresh(), { voice: data.voice, sound: data.sound }); write(); }

  load();
  return { get data() { return data; }, complete, set, reset, write };
})();
