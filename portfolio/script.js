(() => {
  const book = document.getElementById('book');
  const leaves = [...book.querySelectorAll('.leaf')];
  const N = leaves.length;                 // spreads run 0 (closed cover) … N (closed back cover)
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const where = document.getElementById('where');
  const progress = document.getElementById('progress');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const pad = matchMedia('(max-width: 760px) and (orientation: portrait)');
  const TURN = () => (reduce.matches ? 0 : 1100);
  const STAGGER = 110;

  let state = 0;                           // how many leaves have been turned
  const turning = new Set();

  // ── Split each big sentence into words so they can arrive one at a time.
  document.querySelectorAll('.say').forEach(el => {
    let i = 0;
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.setAttribute('aria-hidden', 'true');
            w.style.setProperty('--i', i++);
            w.textContent = part;
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
  });

  const front = i => leaves[i]?.querySelector('.face--front');
  const back = i => leaves[i]?.querySelector('.face--back');
  const visibleFaces = s => [back(s - 1), front(s)].filter(Boolean);

  // Unturned leaves stack with the lowest index on top; turned ones with the highest on top.
  const restack = () => leaves.forEach((leaf, i) => {
    if (!turning.has(leaf)) leaf.style.zIndex = i < state ? i + 1 : N - i;
  });

  const label = s => s === 0 ? 'Cover' : s === N ? 'Back cover' : `pp. ${2 * s - 1}–${2 * s}`;

  const render = () => {
    book.dataset.state = state === 0 ? 'closed' : state === N ? 'end' : 'open';
    prevBtn.disabled = state === 0;
    nextBtn.disabled = state === N;
    where.textContent = label(state);
    progress.style.setProperty('--p', state / N);
    book.style.setProperty('--p', state / N);

    const current = visibleFaces(state);
    leaves.forEach(leaf => leaf.querySelectorAll('.face').forEach(face => {
      const on = current.includes(face);
      face.classList.toggle('is-current', on);
      face.inert = !on;
      if (on) face.classList.add('is-in');
    }));

    window.__currentFaces = current;
    window.__spread = state;
    document.dispatchEvent(new CustomEvent('spread', { detail: { faces: current, state } }));

    const hash = state === 0 ? '#cover' : state === N ? '#end' : `#p${state}`;
    try { if (location.hash !== hash) history.replaceState(null, '', hash); } catch (_) { /* sandboxed frames */ }
  };

  let swish = () => {};

  const goTo = target => {
    target = Math.max(0, Math.min(N, target));
    if (target === state) return;
    const forward = target > state;
    const order = forward
      ? leaves.slice(state, target)                 // turn these to the left, first one first
      : leaves.slice(target, state).reverse();      // turn these back to the right, last one first
    const was = visibleFaces(state);
    state = target;

    order.forEach((leaf, j) => {
      setTimeout(() => {
        turning.add(leaf);
        leaf.style.zIndex = N + 10 + j;
        leaf.classList.add('is-turning');
        leaf.classList.toggle('is-flipped', forward);
        if (j < 3) swish();
        setTimeout(() => {
          turning.delete(leaf);
          leaf.classList.remove('is-turning');
          restack();
        }, TURN() + 30);
      }, reduce.matches ? 0 : j * STAGGER);
    });

    render();
    // Let pages that just went out of view replay their pictures next time they're opened.
    setTimeout(() => {
      was.forEach(face => { if (!face.classList.contains('is-current')) face.classList.remove('is-in'); });
    }, TURN() + order.length * STAGGER);
  };

  const next = () => goTo(state + 1);
  const prev = () => goTo(state - 1);

  // ── Start wherever the link says (#p5, #end …).
  const fromHash = () => {
    const h = location.hash;
    if (h === '#end') return N;
    const m = h.match(/^#p(\d+)$/);
    return m ? Math.min(N, Math.max(0, +m[1])) : 0;
  };
  state = fromHash();
  leaves.forEach((leaf, i) => leaf.classList.toggle('is-flipped', i < state));
  restack();
  render();

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // ── Click the right-hand (or lower) page to go on, the left-hand (or upper) page to go back.
  let swiped = false;
  book.addEventListener('click', e => {
    if (swiped) { swiped = false; return; }
    if (e.target.closest('a, button, summary')) return;
    const face = e.target.closest('.face.is-current');
    if (!face) return;
    face.classList.contains('face--front') ? next() : prev();
  });

  // ── Grab a page and turn it by hand: it follows the pointer, and finishes turning past a third.
  let drag = null;
  // The outer edge of the open pages (where the corner curls) always turns; the rest of a picture page spins its scene.
  const inEdge = (face, e) => {
    const r = face.getBoundingClientRect(), fwd = face.classList.contains('face--front');
    return pad.matches
      ? (fwd ? e.clientY > r.bottom - r.height * .2 : e.clientY < r.top + r.height * .2)
      : (fwd ? e.clientX > r.right - r.width * .16 : e.clientX < r.left + r.width * .16);
  };
  book.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('a, button')) return;
    const face = e.target.closest('.face.is-current');
    if (!face) return;
    const edge = inEdge(face, e);
    if (!edge && e.target.closest('.diorama')) return;
    const fwd = face.classList.contains('face--front');
    const leaf = leaves[fwd ? state : state - 1];
    if (!leaf || turning.has(leaf)) return;
    if (edge) e.stopPropagation();            // don't let the scene underneath start spinning
    drag = { x: e.clientX, y: e.clientY, fwd, leaf, live: false, p: 0, id: e.pointerId, edge };
  }, true);
  addEventListener('pointermove', e => {
    if (!drag) return;
    const d = pad.matches ? e.clientY - drag.y : e.clientX - drag.x;
    if (!drag.live) {
      if (Math.abs(d) < 8) return;
      drag.live = true;
      try { book.setPointerCapture(drag.id); } catch (_) {}
      drag.leaf.classList.add('is-dragging');
      drag.leaf.style.zIndex = N + 20;
      book.classList.add('is-dragging');
    }
    const span = (pad.matches ? book.clientHeight : book.clientWidth) / 2 * 1.1;
    drag.p = Math.max(0, Math.min(1, (drag.fwd ? -d : d) / span));
    const deg = 180 * (drag.fwd ? drag.p : 1 - drag.p);
    drag.leaf.style.transform = pad.matches ? `rotateX(${deg}deg)` : `rotateY(${-deg}deg)`;
  });
  const drop = () => {
    if (!drag) return;
    const g = drag; drag = null;
    if (!g.live) {
      if (g.edge) { swiped = true; setTimeout(() => { swiped = false; }, 60); g.fwd ? next() : prev(); }
      return;
    }
    swiped = true; setTimeout(() => { swiped = false; }, 60);
    book.classList.remove('is-dragging');
    g.leaf.classList.remove('is-dragging');
    requestAnimationFrame(() => {
      g.leaf.style.transform = '';
      if (g.p > .3) g.fwd ? next() : prev();
      else setTimeout(restack, TURN());
    });
  };
  addEventListener('pointerup', drop);
  addEventListener('pointercancel', drop);

  // ── A soft paper swish when a page turns (synthesised, no audio files). Mute in the top bar.
  const soundBtn = document.getElementById('sound');
  let soundOn = true;
  try { soundOn = localStorage.getItem('book-sound') !== 'off'; } catch (_) {}
  const setSound = on => { soundOn = on; soundBtn?.setAttribute('aria-pressed', on); try { localStorage.setItem('book-sound', on ? 'on' : 'off'); } catch (_) {} };
  setSound(soundOn);
  soundBtn?.addEventListener('click', () => setSound(!soundOn));
  let actx = null;
  swish = () => {
    if (!soundOn || reduce.matches) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const dur = .42, n = Math.floor(actx.sampleRate * dur);
      const buf = actx.createBuffer(1, n, actx.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = actx.createBufferSource(); src.buffer = buf;
      const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .7;
      const t = actx.currentTime;
      bp.frequency.setValueAtTime(2800, t); bp.frequency.exponentialRampToValueAtTime(650, t + dur);
      const g = actx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.14, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      src.connect(bp).connect(g).connect(actx.destination);
      src.start(t); src.stop(t + dur);
    } catch (_) {}
  };

  // ── Keyboard.
  addEventListener('keydown', e => {
    if (sheet.open || !toc.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest('input, textarea')) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'Home') { e.preventDefault(); goTo(0); }
    else if (k === 'End') { e.preventDefault(); goTo(N); }
    else if (k === ' ' && !e.target.closest('button, a')) { e.preventDefault(); e.shiftKey ? prev() : next(); }
  });

  // ── "The grown-up version" opens as a card over the book.
  const sheet = document.getElementById('sheet');
  const sheetBody = document.getElementById('sheetBody');
  document.querySelectorAll('.grown').forEach(btn => btn.addEventListener('click', () => {
    const tpl = document.getElementById(btn.dataset.note);
    sheetBody.replaceChildren(tpl.content.cloneNode(true));
    sheet.dataset.theme = btn.closest('.face').dataset.theme;
    sheet.showModal();
  }));
  document.getElementById('sheetClose').addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });

  // ── Contents.
  const toc = document.getElementById('toc');
  const openBtn = document.getElementById('tocOpen');
  const setToc = open => {
    openBtn.setAttribute('aria-expanded', open);
    if (open) {
      toc.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => toc.classList.add('is-open')));
      toc.querySelector('a').focus({ preventScroll: true });
    } else {
      toc.classList.remove('is-open');
      setTimeout(() => { if (!toc.classList.contains('is-open')) toc.hidden = true; }, 700);
      openBtn.focus({ preventScroll: true });
    }
  };
  openBtn.addEventListener('click', () => setToc(true));
  document.getElementById('tocClose').addEventListener('click', () => setToc(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !toc.hidden) setToc(false); });

  document.querySelectorAll('[data-goto]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    const target = +el.dataset.goto;
    if (!toc.hidden) { setToc(false); setTimeout(() => goTo(target), 350); }
    else goTo(target);
  }));

  addEventListener('hashchange', () => goTo(fromHash()));
})();
