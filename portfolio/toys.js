/* ─────────────────────────────────────────────
   Two little cube characters who live in the margins.
   Built from CSS 3D cubes. Drag to spin (with momentum), click to say hi,
   and they hop and chat as the pages turn.
   ───────────────────────────────────────────── */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = { cobalt: 'var(--cobalt)', navy: 'var(--navy)', cream: 'var(--cream)', sky: 'var(--sky)', mist: 'var(--mist)' };

  // [x, y, z, w, h, d, colour, extra class]  (px; y points down; origin is the character's middle)
  const BOT = [
    [0, -40, 0, 58, 48, 48, C.cobalt],                   // head
    [-13, -42, 25, 10, 13, 4, C.cream, 'blink'],         // eyes
    [13, -42, 25, 10, 13, 4, C.cream, 'blink'],
    [0, -25, 25, 20, 4, 3, C.navy],                      // mouth
    [0, -71, 0, 4, 14, 4, C.navy],                       // antenna
    [0, -83, 0, 11, 11, 11, C.sky, 'glow'],
    [-31, -40, 0, 5, 14, 14, C.navy],                    // ears
    [31, -40, 0, 5, 14, 14, C.navy],
    [0, 8, 0, 46, 40, 34, C.navy],                       // body
    [0, 4, 18, 13, 13, 3, C.sky, 'glow'],                // chest light
    [-30, 6, 0, 10, 30, 10, C.cobalt],                   // arm
    [30, 6, 0, 10, 30, 10, C.cobalt, 'wave'],            // waving arm
    [-11, 36, 0, 15, 16, 18, C.cobalt],                  // legs
    [11, 36, 0, 15, 16, 18, C.cobalt],
  ];
  const CAT = [
    [0, -30, 10, 54, 44, 44, C.cream],                   // head
    [-18, -58, 6, 13, 13, 10, C.cream],                  // ears
    [18, -58, 6, 13, 13, 10, C.cream],
    [-18, -57, 11.5, 6, 7, 1, C.mist],
    [18, -57, 11.5, 6, 7, 1, C.mist],
    [-12, -32, 33, 8, 11, 3, C.navy, 'blink'],           // eyes
    [12, -32, 33, 8, 11, 3, C.navy, 'blink'],
    [0, -21, 33, 7, 5, 3, C.cobalt],                     // nose
    [-20, -20, 33, 9, 2, 2, C.navy], [20, -20, 33, 9, 2, 2, C.navy],   // whiskers
    [0, 12, -8, 44, 30, 62, C.cobalt],                   // body
    [0, 12, 24, 30, 18, 2, C.mist],                      // bib
    [-14, 32, 14, 11, 12, 11, C.cream], [14, 32, 14, 11, 12, 11, C.cream],     // paws
    [-14, 32, -30, 11, 12, 11, C.cream], [14, 32, -30, 11, 12, 11, C.cream],
    [0, -10, -40, 8, 36, 8, C.navy, 'tail'],             // tail
  ];

  const LINES = {
    bot: ['Try spinning me!', 'I’m made of 14 cubes.', 'Beep. Turn the page →', 'Srikar built me too.'],
    cat: ['Meow. Translation: hire Srikar.', 'Spin me again!', 'I live in the margins.', 'Purr… nice website, right?'],
  };
  // What they say when a spread opens (spread number → [who, line]).
  const CUES = {
    0: ['bot', 'Psst… open the book →'],
    1: ['bot', 'That’s Srikar!'],
    3: ['cat', 'These are real client sites.'],
    5: ['bot', 'I always ask before I do things.'],
    7: ['cat', 'This one matters. Read slowly.'],
    9: ['bot', 'Listen → sketch → build.'],
    10: ['cat', 'Go on, say hello!'],
    11: ['bot', 'Read it again?'],
  };

  const toys = [];
  const build = (name, spec, side, label) => {
    const toy = document.createElement('div');
    toy.className = `toy toy--${side}`;
    toy.tabIndex = 0;
    toy.setAttribute('role', 'button');
    toy.setAttribute('aria-label', `${label}. Drag to spin, press Enter to say hi.`);
    toy.innerHTML = `<p class="toy__bubble" aria-live="polite"></p><div class="toy__hop"><div class="toy__rig"></div></div><span class="toy__shadow"></span>${name === 'bot' ? '<span class="toy__hint">drag me ↻</span>' : ''}`;
    const rig = toy.querySelector('.toy__rig');
    Cubes.build(spec, rig);
    document.body.appendChild(toy);
    const t = { name, el: toy, rig, bubble: toy.querySelector('.toy__bubble'), said: 0, timer: 0 };
    toys.push(t);
    return t;
  };

  const bot = build('bot', BOT, 'left', 'A little cube robot');
  const cat = build('cat', CAT, 'right', 'A little cube cat');

  const say = (t, text) => {
    clearTimeout(t.timer);
    t.bubble.textContent = text;
    t.el.classList.add('is-talking');
    t.timer = setTimeout(() => t.el.classList.remove('is-talking'), 3400);
  };
  const hop = (t, spin = false) => {
    t.el.classList.remove('is-hopping'); void t.el.offsetWidth; t.el.classList.add('is-hopping');
    if (spin && !reduce && t.spin) t.spin.vy += 18;
  };

  // ── Drag to spin (shared engine); a tap makes them hop and talk.
  const chat = t => { hop(t, true); say(t, LINES[t.name][t.said++ % LINES[t.name].length]); };
  toys.forEach(t => {
    t.spin = Cubes.spinner(t.el, t.rig, { base: t.name === 'cat' ? -24 : 24, tilt: -14, sway: 18, phase: t.name === 'cat' ? 2 : 0,
      active: () => t.el.offsetParent !== null, onTap: () => { chat(t); t.el.blur(); } });
    t.el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); chat(t); }
    });
  });

  // ── Hop and chat when pages turn.
  let first = true;
  const onSpread = state => {
    const cue = CUES[state];
    setTimeout(() => {
      toys.forEach((t, i) => setTimeout(() => hop(t), i * 140));
      if (cue) say(cue[0] === 'bot' ? bot : cat, cue[1]);
    }, first ? 1200 : 700);
    first = false;
  };
  document.addEventListener('spread', e => onSpread(e.detail.state));

  // Catch up if the book already opened before we loaded.
  if (typeof window.__spread === 'number') onSpread(window.__spread);
})();
