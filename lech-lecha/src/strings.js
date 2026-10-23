/* All words the game shows or speaks live here, so a Hebrew version
   only needs a second copy of this file. Each story page has `text`
   (subtitle), an optional `say` (spoken form), a `bg` and a `stage`
   (which little scene to draw behind the words). */

const LEVELS = [
  { n: 1, key: 'Journey',   story: 'intro',     name: 'Lech Lecha',     medal: 'trust', medalName: 'Trust Medal' },
  { n: 2, key: 'Shepherds', story: 'shepherds', name: 'The Shepherds',  medal: 'peace', medalName: 'Peacemaker Medal' },
  { n: 3, key: 'Rescue',    story: 'rescue',    name: 'Rescue Lot',     medal: 'brave', medalName: 'Bravery Medal' },
  { n: 4, key: 'Stars',     story: 'stars',     name: 'Count the Stars', medal: 'stars', medalName: 'Star Medal' },
];

const STORY = {
  intro: {
    music: 'story',
    next: { scene: 'Journey' },
    pages: [
      { bg: 'charan', stage: 'family',
        text: 'Long ago, in the city of Charan, lived a man named Avram, his wife Sarai, and his nephew Lot.' },
      { bg: 'charan', stage: 'calling',
        text: 'One day, Hashem spoke to Avram: “Lech Lecha! Go from your land and your home, to the land that I will show you.”' },
      { bg: 'charan', stage: 'idols', badge: 'From the Midrash',
        text: 'The Midrash tells us that Avram knew idols were only stone. They cannot see, hear, or help anyone!' },
      { bg: 'desert', stage: 'walking',
        text: 'Avram trusted Hashem, even without knowing where the road would lead. Help Avram travel to the land of Canaan!' },
      { bg: 'desert', stage: 'howto', howto: 'journey', wait: true,
        text: 'Break all 5 idols to open the city gate. Then follow the golden arrow to Canaan!' },
    ],
  },
  shepherds: {
    music: 'story',
    next: { scene: 'Shepherds' },
    pages: [
      { bg: 'pasture', stage: 'flock',
        text: 'In Canaan, Avram and Lot had so many sheep, goats and cows that the land was too crowded for everyone.' },
      { bg: 'pasture', stage: 'argue',
        text: 'Lot’s shepherds let their sheep eat in other people’s fields. That isn’t fair! Avram’s shepherds told them to stop, and they began to argue.' },
      { bg: 'pasture', stage: 'careful',
        text: 'Avram’s shepherds were careful. Their sheep only ate where they were allowed.' },
      { bg: 'pasture', stage: 'howto', howto: 'shepherds', wait: true,
        text: 'You are one of Avram’s shepherds! Keep the sheep out of the neighbors’ fields.' },
    ],
  },
  rescue: {
    music: 'story',
    next: { scene: 'Rescue' },
    pages: [
      { bg: 'canaan', stage: 'talk',
        text: 'Avram said to Lot: “Please, let’s not fight. We are family! You choose where to live, and I will go the other way.”' },
      { bg: 'pasture', stage: 'lotLeaves',
        text: 'Lot saw the green, watered land near the city of Sedom, and he chose to live there.' },
      { bg: 'canaan', stage: 'promise',
        text: 'Hashem told Avram: “Look all around you. All of this land I will give to you and your children, forever.”' },
      { bg: 'dusk', stage: 'captured',
        text: 'Then a war broke out between kings. The kings captured Lot and took him far away!' },
      { bg: 'dusk', stage: 'army',
        text: 'When Avram heard, he gathered 318 brave men from his household and set out at night to rescue Lot.',
        say: 'When Avram heard, he gathered three hundred and eighteen brave men from his household, and set out at night to rescue Lot.' },
      { bg: 'dusk', stage: 'howto', howto: 'rescue', wait: true,
        text: 'Get past the guards, open the camp gate, find the key, and set Lot free!' },
    ],
  },
  stars: {
    music: 'story',
    next: { scene: 'Stars' },
    pages: [
      { bg: 'canaan', stage: 'home',
        text: 'Avram rescued Lot and brought everyone home safely. Hooray!' },
      { bg: 'night', stage: 'worried',
        text: 'But Avram was worried. “Hashem, I have no children. Who will carry on my family?”' },
      { bg: 'night', stage: 'starsky',
        text: 'Hashem took Avram outside: “Look up at the sky and count the stars, if you can. That is how many children you will have!”' },
      { bg: 'night', stage: 'howto', howto: 'stars', wait: true,
        text: 'Help Avram count the stars! Catch 30 stars in the basket.' },
    ],
  },
  ending: {
    music: 'stars',
    next: { scene: 'Victory' },
    pages: [
      { bg: 'night', stage: 'starsky',
        text: 'Avram believed Hashem’s promise, even though he could not see how it would come true.' },
      { bg: 'canaan', stage: 'names',
        text: 'Later, Hashem gave Avram a new name: Avraham, because he would be the father of many nations. And Sarai became Sarah.' },
      { bg: 'canaan', stage: 'baby',
        text: 'Hashem promised that Sarah would have a baby boy named Yitzchak. That story comes next week, in Parshat Vayera!' },
    ],
  },
};

const HOWTO = {
  journey: [
    { keys: ['←', '→'], label: 'Walk' },
    { keys: ['Space'], label: 'Jump' },
    { keys: ['X'], label: 'Break idols' },
  ],
  shepherds: [
    { keys: ['←', '→'], label: 'Move' },
    { keys: ['X'], label: 'Toss a wool ball' },
  ],
  rescue: [
    { keys: ['←', '→'], label: 'Walk' },
    { keys: ['Space'], label: 'Jump' },
    { keys: ['X'], label: 'Swing staff' },
  ],
  stars: [
    { keys: ['←', '→'], label: 'Move the basket' },
  ],
};

/* In-level lines. Short, so they can be spoken during play. */
const LINES = {
  journeyStart: 'Break the 5 idols to open the city gate!',
  idolLeft: (n) => n === 1 ? 'One more idol!' : `${n} idols left!`,
  gateOpen: 'The gate is open! Lech Lecha, go!',
  midrash: 'From the Midrash: Avram knew idols were only stone.',
  wrongWay: 'Oops! Wrong way. Turn around!',
  rightWay: 'That’s the way!',
  checkpoint: (label) => label,
  arrived: 'Avram arrived in Canaan! Hashem said: I will give this land to your children.',
  tryAgain: 'Let’s try again!',

  waveIntro: ['Here come the sheep! Toss wool to send them back.',
              'Now they come from the sides, and faster!',
              'A big flock! Be quick!'],
  ate: 'Oh no, a sheep ate the crops!',
  waveRetry: 'The sheep ate too much. Let’s try this wave again!',
  peace1: 'Let’s not fight. We are family!',
  peace2: 'You are right, uncle Avram.',

  rocks: 'Watch out for falling rocks!',
  gateGuards: 'Defeat the gate guards to open the gate!',
  campGate: 'The gate is open!',
  needKey: 'The cage is locked. Find the key!',
  gotKey: 'You found the key!',
  freed: 'Uncle Avram! You came for me!',
  freedNarr: 'You found Lot! Now lead him back to safety.',
  needLot: 'We can’t leave without Lot!',
  safe: 'Lot is safe! Avram’s men cheer.',

  starsStart: 'Catch the falling stars!',
  starsMid: ['So many stars!', 'Keep counting!', 'Almost there!'],
  starsDone: 'Hashem promised Avram that his family would be as many as the stars. Avram trusted Hashem.',
};

/* Spoken spellings for the browser voice. */
const SPEAK_FIX = [
  [/Lech Lecha/g, 'Lekh Lekha'],
  [/Hashem/g, 'Hah-shem'],
  [/Charan/g, 'Haran'],
  [/Sarai/g, 'Sah-rye'],
  [/Yitzchak/g, 'Yitz-hock'],
  [/Vayera/g, 'Vah-yeh-rah'],
  [/Parshat/g, 'Par-shot'],
  [/Sedom/g, 'Seh-dome'],
  [/Avram/g, 'Av-rahm'],
  [/Avraham/g, 'Av-rah-hahm'],
  [/[“”]/g, ''],
];
