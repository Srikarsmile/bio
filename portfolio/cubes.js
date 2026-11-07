/* ─────────────────────────────────────────────
   One cube world.
   A tiny CSS-3D engine (cubes, groups, drag-to-spin with momentum) and the
   ten dioramas that illustrate the book. The margin characters in toys.js
   use the same engine.
   ───────────────────────────────────────────── */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Colour tokens: d1–d4 follow the page's theme (see styles.css); the rest are fixed inks.
  const INK = { d1: 'var(--d1)', d2: 'var(--d2)', d3: 'var(--d3)', d4: 'var(--d4)',
                cream: 'var(--cream)', navy: 'var(--navy)', cobalt: 'var(--cobalt)', sky: 'var(--sky)', mist: 'var(--mist)' };
  const ink = c => INK[c] || c;

  const FACES = '<i class="f f--front"></i><i class="f f--back"></i><i class="f f--right"></i><i class="f f--left"></i><i class="f f--top"></i><i class="f f--bottom"></i>';

  /* A cube: [x, y, z, w, h, d, colour, extra]
     extra: 'class names' or { cls, text, fs, tc, rx, ry, rz }
     Units are scene units (scaled by --su). y points down. */
  function cube([x, y, z, w, h, d, c, extra]) {
    const o = typeof extra === 'string' ? { cls: extra } : (extra || {});
    const el = document.createElement('div');
    el.className = 'cube' + (o.cls ? ' ' + o.cls : '');
    el.style.cssText = `--x:${x};--y:${y};--z:${z};--w:${w};--h:${h};--d:${d};--c:${ink(c)};` +
      (o.rx ? `--crx:${o.rx}deg;` : '') + (o.ry ? `--cry:${o.ry}deg;` : '') + (o.rz ? `--crz:${o.rz}deg;` : '');
    el.innerHTML = FACES;
    if (o.text) {
      const t = document.createElement('span');
      t.className = 'cube__text';
      t.textContent = o.text;
      t.style.cssText = `--fs:${o.fs || 14};color:${ink(o.tc || 'cream')}`;
      el.querySelector('.f--front').appendChild(t);
    }
    return el;
  }

  /* A group: { group: [...items], x, y, z, cls } — moves/animates its children together. */
  function build(items, parent) {
    items.forEach((it, i) => {
      if (it && it.group) {
        const g = document.createElement('div');
        g.className = 'cube-group' + (it.cls ? ' ' + it.cls : '');
        g.style.cssText = `--x:${it.x || 0};--y:${it.y || 0};--z:${it.z || 0};` + (it.delay ? `--gd:${it.delay}s;` : '');
        build(it.group, g);
        parent.appendChild(g);
      } else if (it) {
        const c = cube(it);
        c.style.setProperty('--i', parent.childElementCount);
        parent.appendChild(c);
      }
    });
    return parent;
  }

  /* ───────── Spinning ───────── */
  const spinners = [];
  function spinner(el, rig, opts = {}) {
    const s = {
      el, rig,
      base: opts.base ?? -26, tilt: opts.tilt ?? -16, sway: opts.sway ?? 16, phase: opts.phase ?? Math.random() * 6,
      rx: opts.tilt ?? -16, ry: opts.base ?? -26, vy: 0, drag: null,
      active: opts.active || (() => true),
      onTap: opts.onTap || null,
    };
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      s.drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-grabbed');
    });
    el.addEventListener('pointermove', e => {
      if (!s.drag) return;
      const dx = e.clientX - s.drag.x, dy = e.clientY - s.drag.y;
      s.drag.x = e.clientX; s.drag.y = e.clientY;
      s.ry += dx * .7; s.rx = Math.max(-75, Math.min(40, s.rx - dy * .5));
      s.vy = dx * .7;
    });
    const end = () => {
      if (!s.drag) return;
      const moved = Math.hypot(s.drag.x - s.drag.sx, s.drag.y - s.drag.sy);
      s.drag = null;
      el.classList.remove('is-grabbed');
      document.documentElement.classList.add('toys-touched');
      if (moved < 5 && s.onTap) s.onTap();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    // Keep clicks inside a diorama from turning the page.
    el.addEventListener('click', e => e.stopPropagation());
    spinners.push(s);
    return s;
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(50, now - last) / 16.67; last = now;
    for (const s of spinners) {
      if (!s.active()) continue;
      if (!s.drag) {
        s.ry += s.vy * dt;
        s.vy *= Math.pow(.94, dt);
        if (Math.abs(s.vy) < 1.2) {
          const base = s.base + (reduce ? 0 : Math.sin(now / 1700 + s.phase) * s.sway);
          const target = base + 360 * Math.round((s.ry - base) / 360);
          s.ry += (target - s.ry) * .05 * dt;
        }
        s.rx += (s.tilt - s.rx) * .04 * dt;
      }
      s.rig.style.transform = `rotateX(${s.rx}deg) rotateY(${s.ry}deg)`;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.Cubes = { cube, build, spinner };

  /* ───────── The dioramas ─────────
     Every scene sits on a plinth whose top is at y = 50.
     on(x, z, w, h, d, colour, extra, lift) rests a box on the plinth (or `lift` above it). */
  const TOP = 50;
  const on = (x, z, w, h, d, c, extra, lift = 0) => [x, TOP - lift - h / 2, z, w, h, d, c, extra];
  const plinth = text => [0, TOP + 8, 0, 236, 16, 150, 'd4', text ? { text, fs: 8.5, tc: 'd1', cls: 'plinth' } : 'plinth'];
  const bubble = (x, y, z, w, text, c, tc, fs = 13, delay = 0) => ({
    group: [[0, 0, 0, w, 26, 10, c, { text, tc, fs }], [-(w / 2) + 14, 15, 0, 8, 8, 8, c]],
    x, y, z, cls: 'bob', delay,
  });
  const person = (x, z, body, head) => ({
    group: [on(-4, 0, 7, 12, 8, 'd1'), on(4, 0, 7, 12, 8, 'd1'), on(0, 0, 18, 18, 10, body, '', 12), on(0, 0, 15, 15, 15, head, '', 30)],
    x, z, cls: 'walk',
  });

  const SCENES = {
    // 1 · Hi. I'm Srikar.
    1: () => [
      plinth(),
      on(-11, 0, 16, 26, 18, 'd1'), on(11, 0, 16, 26, 18, 'd1'),
      on(0, 0, 54, 50, 30, 'd2', '', 26),
      [-35, -2, 0, 12, 42, 12, 'd1'],
      [35, -22, 0, 12, 42, 12, 'd1', 'wave'],
      on(0, 0, 48, 46, 46, 'd1', '', 76),
      [-11, -52, 24, 8, 10, 3, 'cream', 'blink'], [11, -52, 24, 8, 10, 3, 'cream', 'blink'],
      [0, -38, 24, 18, 4, 3, 'cream'],
      bubble(70, -104, 10, 54, 'hi!', 'd2', 'cream', 20),
      { group: [[0, 0, 0, 10, 10, 10, 'd3']], x: -88, y: -70, z: -30, cls: 'bob', delay: .4 },
      { group: [[0, 0, 0, 7, 7, 7, 'd2']], x: -70, y: -110, z: 30, cls: 'bob', delay: .9 },
      { group: [[0, 0, 0, 8, 8, 8, 'd3']], x: 92, y: -30, z: -40, cls: 'bob', delay: 1.3 },
    ],

    // 2 · websites, apps, and the occasional robot
    2: () => [
      plinth(),
      on(-50, -20, 12, 18, 10, 'd1'), on(-50, -20, 44, 4, 26, 'd1'),
      [-50, -18, -20, 104, 68, 10, 'd1'],
      [-50, -18, -14.5, 90, 54, 1, 'd3'],
      [-64, -30, -13.5, 52, 12, 1, 'd2'],
      [-58, -10, -13.5, 64, 5, 1, 'cream'], [-64, 0, -13.5, 52, 5, 1, 'cream'],
      on(66, 10, 34, 64, 8, 'd1'),
      [66, 14, 14.5, 26, 46, 1, 'd2'],
      { group: [
          on(-5, 0, 8, 10, 10, 'd1'), on(5, 0, 8, 10, 10, 'd1'),
          on(0, 0, 26, 22, 18, 'd2', '', 10),
          on(0, 0, 30, 24, 22, 'd1', '', 32),
          [-6, 4, 11.5, 5, 6, 2, 'd3', 'blink'], [6, 4, 11.5, 5, 6, 2, 'd3', 'blink'],
          [0, -12, 0, 3, 8, 3, 'd1'], [0, -19, 0, 7, 7, 7, 'd3', 'glow'],
        ], x: 10, z: 46 },
    ],

    // 3 · a roofer, a kitchen maker and a car rental company…
    3: () => {
      const awning = [];
      for (let i = 0; i < 6; i++) awning.push([-25 + i * 10, -18, 24, 10, 10, 10, i % 2 ? 'd3' : 'd2']);
      return [
        plinth(),
        on(-74, 0, 46, 52, 40, 'd2'),
        [-74, 37, 20.5, 12, 24, 1, 'd1'], [-74, 12, 20.5, 16, 12, 1, 'd3'],
        [-74, -7, 0, 56, 10, 46, 'd1'], [-74, -17, 0, 42, 10, 38, 'd1'], [-74, -27, 0, 26, 10, 28, 'd1'],
        [-60, -30, -8, 8, 16, 8, 'd1'],
        on(0, 0, 54, 66, 40, 'd1'),
        ...awning,
        [0, 10, 20.5, 34, 22, 1, 'd3'], [0, -40, 0, 44, 10, 12, 'd2', { text: 'KITCHENS', fs: 5.5, tc: 'd1' }],
        { group: [
            on(0, 0, 58, 16, 30, 'd2', '', 8), on(-2, 0, 32, 14, 26, 'd2', '', 24),
            [-2, 19, 13.5, 26, 9, 1, 'd3'],
            [-18, 44, 15, 12, 12, 6, 'd1'], [18, 44, 15, 12, 12, 6, 'd1'], [-18, 44, -15, 12, 12, 6, 'd1'], [18, 44, -15, 12, 12, 6, 'd1'],
            [29.5, 32, 8, 2, 5, 8, 'd3'],
          ], x: 74, z: 10, cls: 'drive' },
      ];
    },

    // 4 · …and walk out with a website that brings in customers
    4: () => [
      plinth(),
      [-22, -6, -34, 150, 100, 8, 'd2'],
      [-22, -51, -34, 150, 10, 10, 'd1'],
      [-90, -51, -28.5, 5, 5, 1, 'd3'], [-82, -51, -28.5, 5, 5, 1, 'cream'],
      on(-70, 18, 18, 24, 18, 'd3', 'grow'), on(-44, 18, 18, 42, 18, 'd3', 'grow'),
      on(-18, 18, 18, 62, 18, 'd3', 'grow'), on(8, 18, 18, 86, 18, 'd1', 'grow'),
      person(70, 30, 'd1', 'd2'), person(94, -6, 'd2', 'd1'),
    ],

    // 5 · Clydra: asks before touching anything important
    5: () => {
      const rows = [];
      for (let i = 0; i < 3; i++) {
        rows.push([-58, -20 + i * 18, -27.5, 10, 10, 2, i < 2 ? 'd2' : 'd1']);
        rows.push([-14, -20 + i * 18, -28, 64 - i * 10, 4, 1, 'd3']);
      }
      return [
        plinth(),
        on(-10, 6, 124, 6, 78, 'd1'),
        [-10, 4, -34, 124, 80, 6, 'd1'],
        [-10, 2, -30.5, 110, 64, 1, 'cream'],
        ...rows,
        { group: [[0, 0, 0, 64, 42, 10, 'd2', { text: 'OK?', fs: 18, tc: 'cream' }],
                  [12, 14, 5.5, 18, 8, 1, 'cream'], [-12, 14, 5.5, 18, 8, 1, 'd3']], x: 74, y: -46, z: 40, cls: 'bob' },
      ];
    },

    // 6 · MiraRelay: picks up the phone in any language
    6: () => [
      plinth(),
      on(-6, 0, 44, 86, 10, 'd1'),
      [-6, 2, 5.5, 34, 64, 1, 'd2'],
      [-6, 40, 5.5, 8, 4, 1, 'd3'],
      on(36, 0, 6, 14, 6, 'd3', 'signal'), on(46, 0, 6, 24, 6, 'd3', 'signal'), on(56, 0, 6, 34, 6, 'd2', 'signal'),
      bubble(-66, -64, 14, 66, 'hello', 'd1', 'cream', 13, 0),
      bubble(62, -88, -14, 82, 'namaste', 'd2', 'cream', 13, .5),
      bubble(-62, -6, 40, 84, 'vanakkam', 'd3', 'navy', 11.5, 1),
    ],

    // 7 · every minute counts
    7: () => [
      plinth(),
      on(-38, 0, 14, 9, 16, 'd2'), on(38, 0, 14, 9, 16, 'd2'),
      [0, -15, 0, 112, 112, 20, 'd2'],
      [0, -15, 10.5, 92, 92, 1, 'd1'],
      [0, -54, 11.5, 4, 10, 1, 'navy'], [0, 24, 11.5, 4, 10, 1, 'navy'], [-39, -15, 11.5, 10, 4, 1, 'navy'], [39, -15, 11.5, 10, 4, 1, 'navy'],
      [0, -15 - 18, 12.5, 4, 36, 2, 'navy', 'hand'],
      [0, -15 - 12, 13.5, 6, 24, 2, 'd2', 'hand hand--slow'],
      [0, -15, 15, 9, 9, 3, 'd3'],
      [0, -78, 0, 10, 10, 10, 'd2'], [0, -86, 0, 24, 8, 14, 'd2'],
    ],

    // 8 · StrokeSense: reads the notes, spots the signs
    8: () => {
      const items = [plinth(), on(0, 0, 14, 40, 14, 'd2')];
      const S = 15, inside = (x, y, z) => (x / 70) ** 2 + ((y + 34) / 42) ** 2 + (z / 40) ** 2 < 1 && Math.abs(x) > 4;
      for (let x = -60; x <= 60; x += S) for (let y = -75; y <= 5; y += S) for (let z = -30; z <= 30; z += S) {
        if (!inside(x, y, z)) continue;
        const buried = [[S,0,0],[-S,0,0],[0,S,0],[0,-S,0],[0,0,S],[0,0,-S]].every(([a, b, c]) => inside(x + a, y + b, z + c));
        if (buried) continue;
        items.push([x, y, z, S, S, S, ((x * 7 + y * 3 + z * 5) % 4 === 0) ? 'd3' : 'd2']);
      }
      const pts = [[-104, -30], [-34, -30], [-24, -54], [-12, -4], [0, -78], [12, -18], [22, -30], [104, -30]];
      const pulse = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 7));
        for (let k = 0; k < n; k++) pulse.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n, 42, 6, 6, 6, 'd1', 'pulse']);
      }
      items.push({ group: pulse, x: 0, y: 0, z: 0, cls: 'pulse-line' });
      items.push({ group: [[0, 0, 0, 74, 24, 8, 'd1', { text: 'risk: high', fs: 11, tc: 'navy' }]], x: 70, y: 28, z: 44, cls: 'bob' });
      return items;
    },

    // 9 · listen, sketch, build
    9: () => [
      plinth('LISTEN          SKETCH          BUILD'),
      { group: [[0, 0, 0, 52, 34, 12, 'd1', { text: '···', fs: 22, tc: 'cream' }], [-14, 20, 0, 9, 9, 9, 'd1']], x: -74, y: -6, z: 0, cls: 'bob' },
      on(2, 14, 62, 2, 46, 'cream'),
      on(-6, 4, 30, 1, 3, 'd3', '', 2), on(4, 18, 40, 1, 3, 'd3', '', 2), on(-2, 30, 26, 1, 3, 'd2', '', 2),
      on(10, 24, 72, 7, 7, 'd2', { ry: 32 }, 3),
      on(40, -2, 10, 7, 7, 'd3', { ry: 32 }, 3),
      on(78, 0, 44, 16, 40, 'd1', 'drop'),
      on(78, 0, 34, 16, 32, 'd2', 'drop', 16),
      on(78, 0, 24, 16, 24, 'd3', 'drop', 32),
      on(78, 0, 14, 14, 14, 'd1', 'drop', 48),
    ],

    // 10 · the end: let's write the next chapter
    10: () => {
      const heart = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
      const hc = [];
      heart.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'X') hc.push([(c - 3) * 9, r * 9, 0, 9, 9, 9, 'd1']); }));
      const flap = [];
      for (let i = 0; i <= 8; i++) {
        flap.push([-56 + i * 7, -30 + i * 4.5, 7.5, 8, 8, 2, 'd1']);
        flap.push([56 - i * 7, -30 + i * 4.5, 7.5, 8, 8, 2, 'd1']);
      }
      return [
        plinth(),
        on(0, 0, 124, 80, 14, 'd2'),
        ...flap,
        { group: hc, x: 0, y: -104, z: 10, cls: 'beat' },
      ];
    },
  };

  /* ───────── Put a diorama on every picture page ───────── */
  const book = document.getElementById('book');
  if (!book) return;
  const artFaces = [...book.querySelectorAll('.face--art')];
  artFaces.forEach((face, i) => {
    const n = i + 1;
    const scene = SCENES[n];
    const svg = face.querySelector('svg.art');
    if (!scene || !svg) return;
    const d = document.createElement('div');
    d.className = 'diorama';
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', (svg.getAttribute('aria-label') || 'Illustration') + ' (3D, drag to spin)');
    d.innerHTML = '<div class="diorama__rig"></div><span class="diorama__hint">drag to spin ↻</span>';
    build(scene(), d.querySelector('.diorama__rig'));
    svg.replaceWith(d);
    spinner(d, d.querySelector('.diorama__rig'), {
      base: n % 2 ? -24 : 24, tilt: -18, sway: 14, phase: n,
      active: () => face.classList.contains('is-current'),
    });
  });
  document.documentElement.classList.add('has-dioramas');
})();
