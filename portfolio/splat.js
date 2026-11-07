/* ─────────────────────────────────────────────
   Gaussian splats for the picture pages.

   Each illustration is rasterised, then rebuilt from thousands of soft,
   anisotropic 3D gaussians (the same maths as 3D Gaussian Splatting:
   3D covariance → projected 2D ellipse → alpha-blended back to front).
   They swirl in when the page opens, tilt with the pointer, and part
   around the cursor.
   ───────────────────────────────────────────── */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || location.search.includes('splats=off')) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'splat-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return;
  document.documentElement.classList.add('has-splats');

  // ───────── Shaders ─────────
  const VERT = `#version 300 es
  precision highp float;
  precision highp int;
  layout(location=0) in vec2 a_quad;
  layout(location=1) in uint a_index;
  uniform highp sampler2D u_data;
  uniform mat3 u_rot;
  uniform float u_dist, u_focal, u_prog, u_time;
  uniform vec2 u_viewport, u_mouse;
  uniform float u_mouseOn;
  out vec2 v_pos;
  out vec4 v_color;

  vec4 fetch(int i) { return texelFetch(u_data, ivec2(i % 2000, i / 2000), 0); }
  mat3 quatToMat(vec4 q) {
    float x=q.x, y=q.y, z=q.z, w=q.w;
    return mat3(
      1.-2.*(y*y+z*z), 2.*(x*y+w*z),    2.*(x*z-w*y),
      2.*(x*y-w*z),    1.-2.*(x*x+z*z), 2.*(y*z+w*x),
      2.*(x*z+w*y),    2.*(y*z-w*x),    1.-2.*(x*x+y*y));
  }

  void main() {
    int b = int(a_index) * 5;
    vec4 t0 = fetch(b), t1 = fetch(b + 1), t2 = fetch(b + 2), t3 = fetch(b + 3), t4 = fetch(b + 4);
    vec3 center = t0.xyz; float delay = t0.w;
    vec3 start = t1.xyz;  float phase = t1.w;

    // Arrive: each splat leaves its scattered start, staggered left to right.
    float s = clamp((u_prog - delay * .55) / .45, 0., 1.);
    float e = 1. - pow(1. - s, 3.);
    vec3 swirl = vec3(sin(phase * 6.283 + u_prog * 4.) , cos(phase * 6.283 + u_prog * 4.), 0.) * 40. * (1. - e);
    vec3 p = mix(start, center, e) + swirl;

    // Breathe.
    p += vec3(sin(u_time * 1.3 + phase * 40.), cos(u_time * 1.1 + phase * 70.), sin(u_time * .9 + phase * 20.)) * .6 * e;

    // Part around the cursor like a hand through paint.
    vec2 d = p.xy - u_mouse;
    float f = exp(-dot(d, d) / (2. * 38. * 38.)) * 22. * u_mouseOn * e;
    p.xy += normalize(d + 1e-4) * f;
    p.z  -= f * 1.4;

    vec3 t = u_rot * p + vec3(0., 0., u_dist);
    if (t.z < 1.) { gl_Position = vec4(0., 0., 2., 1.); return; }

    // 3D covariance from scale + rotation, rotated into view space.
    mat3 R = quatToMat(t4);
    vec3 sc = t3.xyz * mix(.25, 1., e);
    mat3 M = R * mat3(sc.x, 0., 0., 0., sc.y, 0., 0., 0., sc.z);
    mat3 Sv = u_rot * (M * transpose(M)) * transpose(u_rot);

    // Project with the perspective Jacobian (pixel space, y down).
    float iz = 1. / t.z;
    vec3 j0 = vec3(u_focal * iz, 0., -u_focal * t.x * iz * iz);
    vec3 j1 = vec3(0., u_focal * iz, -u_focal * t.y * iz * iz);
    float a = dot(j0, Sv * j0) + .3;
    float bb = dot(j0, Sv * j1);
    float c = dot(j1, Sv * j1) + .3;

    float mid = .5 * (a + c);
    float rad = length(vec2(.5 * (a - c), bb));
    float l1 = mid + rad, l2 = max(mid - rad, .1);
    vec2 dir = normalize(vec2(bb, l1 - a) + vec2(1e-6, 0.));
    vec2 major = min(sqrt(2. * l1), 512.) * dir;
    vec2 minor = min(sqrt(2. * l2), 512.) * vec2(dir.y, -dir.x);

    vec2 px = vec2(u_focal * t.x * iz, u_focal * t.y * iz) + a_quad.x * major + a_quad.y * minor;
    gl_Position = vec4(px.x * 2. / u_viewport.x, -px.y * 2. / u_viewport.y, 0., 1.);
    v_pos = a_quad;
    v_color = vec4(t2.rgb, t2.a * smoothstep(0., .35, s));
  }`;

  const FRAG = `#version 300 es
  precision highp float;
  in vec2 v_pos;
  in vec4 v_color;
  out vec4 o;
  void main() {
    float A = -dot(v_pos, v_pos);
    if (A < -4.) discard;
    float B = exp(A) * v_color.a;
    o = vec4(v_color.rgb * B, B);
  }`;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  try {
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) {
    console.warn('Splats disabled:', err);
    document.documentElement.classList.remove('has-splats');
    return;
  }
  gl.useProgram(prog);
  const U = n => gl.getUniformLocation(prog, n);
  const u = { data: U('u_data'), rot: U('u_rot'), dist: U('u_dist'), focal: U('u_focal'), prog: U('u_prog'),
              time: U('u_time'), viewport: U('u_viewport'), mouse: U('u_mouse'), mouseOn: U('u_mouseOn') };

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-2, -2, 2, -2, -2, 2, 2, 2]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, 0, 0);
  gl.vertexAttribDivisor(1, 1);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // premultiplied, back to front

  // ───────── Turning an SVG into splats ─────────
  const cache = new Map();
  const rand = (a, b) => a + Math.random() * (b - a);

  const parseViewBox = svg => {
    const [x, y, w, h] = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
    return { x, y, w, h };
  };

  async function buildScene(svg) {
    if (cache.has(svg)) return cache.get(svg);
    const vb = parseViewBox(svg);
    const m = Math.max(vb.w, vb.h) * .1;               // breathing room around the picture
    const box = { x: vb.x - m, y: vb.y - m, w: vb.w + 2 * m, h: vb.h + 2 * m };
    const K = 2;                                        // raster pixels per SVG unit
    const W = Math.round(box.w * K), H = Math.round(box.h * K);

    // Clone with every computed colour baked in; text is drawn separately with the real web font.
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')];
    const dst = [clone, ...clone.querySelectorAll('*')];
    const texts = [];
    const order = new Map();
    src.forEach((el, i) => {
      const c = dst[i];
      const cs = getComputedStyle(el);
      order.set(c, i / src.length);
      if (el.tagName === 'text') {
        texts.push({ el, cs, x: +el.getAttribute('x'), y: +el.getAttribute('y'), anchor: el.getAttribute('text-anchor') });
      }
      c.removeAttribute('class'); c.removeAttribute('style'); c.removeAttribute('role'); c.removeAttribute('aria-label');
      if (cs.fill) c.setAttribute('fill', cs.fill);
      if (cs.stroke) c.setAttribute('stroke', cs.stroke);
    });
    clone.querySelectorAll('text').forEach(t => t.remove());
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
    clone.setAttribute('width', W); clone.setAttribute('height', H);

    // Rasterise each top-level layer on its own so it can sit at its own depth.
    const layers = [...clone.children];
    const rasters = [];
    for (let li = 0; li < layers.length; li++) {
      const solo = clone.cloneNode(false);
      solo.appendChild(layers[li].cloneNode(true));
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(solo));
      await img.decode();
      const cv = new OffscreenCanvas(W, H);
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0);
      rasters.push({ data: cx.getImageData(0, 0, W, H).data, depth: li / Math.max(1, layers.length - 1), small: false });
    }
    if (texts.length) {
      const cv = new OffscreenCanvas(W, H);
      const cx = cv.getContext('2d', { willReadFrequently: true });
      texts.forEach(({ el, cs, x, y, anchor }) => {
        cx.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * K}px ${cs.fontFamily}`;
        cx.fillStyle = cs.fill;
        cx.textAlign = anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left';
        cx.fillText(el.textContent, (x - box.x) * K, (y - box.y) * K);
      });
      rasters.push({ data: cx.getImageData(0, 0, W, H).data, depth: 1.45, small: true });
    }

    // Collect opaque pixels per layer, split into edges (thin lines, outlines, lettering) and interiors.
    // Interiors get big soft brush splats; edges get many tiny ones, so silhouettes and text stay crisp.
    const EDGE = 8;                                   // raster px (4 SVG units)
    const pools = rasters.map(r => {
      const inner = [], edge = [];
      const A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : r.data[(y * W + x) * 4 + 3];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (r.data[(y * W + x) * 4 + 3] <= 24) continue;
        const thin = A(x - EDGE, y) < 24 || A(x + EDGE, y) < 24 || A(x, y - EDGE) < 24 || A(x, y + EDGE) < 24;
        (thin || r.small ? edge : inner).push(y * W + x);
      }
      return { ...r, inner, edge };
    });

    const splats = [];
    const depthSpan = Math.max(box.w, box.h) * .16;
    const add = (pool, p, fine) => {
      const px = p % W, py = (p / W) | 0;
      const o = p * 4, d = pool.data;
      const a = d[o + 3] / 255;
      const x = box.x + (px + Math.random()) / K - (box.x + box.w / 2);
      const y = box.y + (py + Math.random()) / K - (box.y + box.h / 2);
      const z = -(pool.depth - .5) * depthSpan + rand(-2, 2);
      const shade = fine ? 1 : rand(.92, 1.07);
      const col = [Math.min(1, d[o] / 255 * shade), Math.min(1, d[o + 1] / 255 * shade), Math.min(1, d[o + 2] / 255 * shade),
                   Math.min(1, a * (fine ? rand(.85, 1) : rand(.6, .9)))];
      const big = fine ? rand(.32, .55) : rand(1.3, 2.8);
      const scale = [big, big * rand(.4, .85), rand(.5, 1.2)];
      const ang = rand(0, Math.PI), tilt = fine ? 0 : rand(-.35, .35);
      const qz = [0, 0, Math.sin(ang / 2), Math.cos(ang / 2)];
      const qx = [Math.sin(tilt / 2), 0, 0, Math.cos(tilt / 2)];
      const q = [
        qz[3] * qx[0] + qz[0] * qx[3] + qz[1] * qx[2] - qz[2] * qx[1],
        qz[3] * qx[1] - qz[0] * qx[2] + qz[1] * qx[3] + qz[2] * qx[0],
        qz[3] * qx[2] + qz[0] * qx[1] - qz[1] * qx[0] + qz[2] * qx[3],
        qz[3] * qx[3] - qz[0] * qx[0] - qz[1] * qx[1] - qz[2] * qx[2],
      ];
      const r = rand(140, 360), th = rand(0, Math.PI * 2);
      const start = [x * .3 + Math.cos(th) * r, y * .3 + Math.sin(th) * r, rand(-320, -120)];
      const delay = Math.min(1, Math.max(0, (x / box.w + .5) * .7 + rand(0, .3)));
      splats.push({ x, y, z, col, scale, q, start, delay, phase: Math.random() });
    };

    // Budget: interiors ~1 splat per 14 raster px, edges ~1 per 2.2 (lettering 1 per 1.2), capped for slower GPUs.
    const innerTotal = pools.reduce((s, p) => s + p.inner.length, 0);
    // Edges get first call on the budget (they carry the drawing); soft interiors take what's left.
    const cap = matchMedia('(pointer: coarse)').matches ? 22000 : 36000;
    const edgeWant = pools.reduce((s, p) => s + p.edge.length / (p.small ? 1.2 : 2.2), 0);
    const fe = Math.min(1, cap * .7 / Math.max(1, edgeWant));
    const fi = Math.min(1, (cap - Math.min(cap * .7, edgeWant)) / Math.max(1, innerTotal / 14));
    pools.forEach(pool => {
      const ni = Math.round(pool.inner.length / 14 * fi), ne = Math.round(pool.edge.length / (pool.small ? 1.2 : 2.2) * fe);
      for (let k = 0; k < ni; k++) add(pool, pool.inner[(Math.random() * pool.inner.length) | 0], false);
      for (let k = 0; k < ne; k++) add(pool, pool.edge[(Math.random() * pool.edge.length) | 0], true);
    });

    // Pack: 5 RGBA32F texels per splat, 400 splats per texture row.
    const n = splats.length;
    const rows = Math.ceil(n / 400);
    const buf = new Float32Array(2000 * rows * 4);
    const centers = new Float32Array(n * 3);
    splats.forEach((s, i) => {
      const b = i * 20;
      buf.set([s.x, s.y, s.z, s.delay, ...s.start, s.phase, ...s.col, ...s.scale, 0, ...s.q], b);
      centers.set([s.x, s.y, s.z], i * 3);
    });
    const scene = { n, rows, buf, centers, box, order: new Uint32Array(n) };
    cache.set(svg, scene);
    return scene;
  }

  // ───────── Sorting (back to front) ─────────
  const sortScene = (scene, rot) => {
    const { n, centers, order } = scene;
    const r2 = [rot[2], rot[5], rot[8]];                       // third row of the column-major rotation
    const depth = new Float32Array(n);
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) {
      const z = r2[0] * centers[i * 3] + r2[1] * centers[i * 3 + 1] + r2[2] * centers[i * 3 + 2];
      depth[i] = z; if (z < lo) lo = z; if (z > hi) hi = z;
    }
    const B = 1024, counts = new Uint32Array(B + 1);
    const k = (B - 1) / Math.max(1e-6, hi - lo);
    const bucket = new Uint16Array(n);
    for (let i = 0; i < n; i++) { bucket[i] = (B - 1) - ((depth[i] - lo) * k | 0); counts[bucket[i] + 1]++; } // far first
    for (let i = 0; i < B; i++) counts[i + 1] += counts[i];
    for (let i = 0; i < n; i++) order[counts[bucket[i]]++] = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ARRAY_BUFFER, order, gl.DYNAMIC_DRAW);
  };

  // ───────── Attaching to the open page ─────────
  let scene = null, host = null, svgEl = null;
  let born = 0, yaw = 0, pitch = 0, tYaw = 0, tPitch = 0, lastSort = [9, 9];
  let mouse = [0, 0], mouseOn = 0, tMouseOn = 0;
  let raf = 0, token = 0;
  let dprCap = 2, slow = 0, lastFrame = 0, disabled = false;

  const rotation = () => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    // R = Ry(yaw) * Rx(pitch), column-major.
    return new Float32Array([cy, 0, -sy, sy * sp, cp, cy * sp, sy * cp, -sp, cy * cp]);
  };

  const freeze = () => {
    // Leave a still of the splats behind on the page we're leaving, so it turns away looking the same.
    if (!host || !svgEl || !scene) return;
    const still = document.createElement('canvas');
    still.className = 'splat-still';
    still.width = canvas.width; still.height = canvas.height;
    draw(performance.now());
    still.getContext('2d').drawImage(canvas, 0, 0);
    still.style.cssText = canvas.style.cssText;
    host.appendChild(still);
  };

  const place = () => {
    if (!host || !svgEl || !scene) return;
    const fr = host.getBoundingClientRect(), sr = svgEl.getBoundingClientRect();
    const vb = parseViewBox(svgEl);
    const sx = sr.width / vb.w, sy = sr.height / vb.h;
    const left = sr.left - fr.left - (vb.x - scene.box.x) * sx;
    const top = sr.top - fr.top - (vb.y - scene.box.y) * sy;
    const w = scene.box.w * sx, h = scene.box.h * sy;
    canvas.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px`;
    const dpr = Math.min(devicePixelRatio || 1, dprCap);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  };

  async function attach(face) {
    if (disabled) return;
    const my = ++token;
    const svg = face && face.querySelector('svg.art');
    if (host && host !== face) { freeze(); host.querySelector('svg.art')?.classList.remove('is-splatted'); }
    if (!svg) { canvas.remove(); host = null; scene = null; return; }

    // Measure only once the page is lying flat.
    const leaf = face.closest('.leaf');
    if (leaf.classList.contains('is-turning')) await new Promise(r => setTimeout(r, 1150));
    if (my !== token) return;
    await document.fonts.ready;
    const sc = await buildScene(svg);
    if (my !== token) return;

    host = face; svgEl = svg; scene = sc;
    face.querySelectorAll('.splat-still').forEach(s => s.remove());
    face.appendChild(canvas);
    place();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 2000, sc.rows, 0, gl.RGBA, gl.FLOAT, sc.buf);
    sortScene(sc, rotation()); lastSort = [yaw, pitch];
    born = performance.now();
    svg.classList.add('is-splatted');
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function draw(now) {
    if (!scene) return;
    const t = (now - born) / 1000;
    yaw += (tYaw + Math.sin(now / 2600) * .05 - yaw) * .06;
    pitch += (tPitch + Math.cos(now / 3100) * .03 - pitch) * .06;
    mouseOn += (tMouseOn - mouseOn) * .1;
    const rot = rotation();
    if (Math.abs(yaw - lastSort[0]) + Math.abs(pitch - lastSort[1]) > .02) { sortScene(scene, rot); lastSort = [yaw, pitch]; }

    const dist = Math.max(scene.box.w, scene.box.h) * 2.4;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix3fv(u.rot, false, rot);
    gl.uniform1f(u.dist, dist);
    gl.uniform1f(u.focal, canvas.width * dist / scene.box.w);
    gl.uniform1f(u.prog, Math.min(1.2, Math.max(0, (t - .25) / 1.9)));
    gl.uniform1f(u.time, t);
    gl.uniform2f(u.viewport, canvas.width, canvas.height);
    gl.uniform2f(u.mouse, mouse[0], mouse[1]);
    gl.uniform1f(u.mouseOn, mouseOn);
    gl.uniform1i(u.data, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.bindVertexArray(vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, scene.n);
  }

  // If this machine can't keep up, drop resolution first, then fall back to the flat drawings.
  const watchSpeed = now => {
    const dt = lastFrame ? now - lastFrame : 16;
    lastFrame = now;
    slow = dt > 45 ? slow + 1 : Math.max(0, slow - 1);
    if (slow < 20 || location.search.includes('splats=force')) return;
    slow = 0;
    if (dprCap > 1) { dprCap = 1; place(); return; }
    disabled = true;
    canvas.remove();
    document.querySelectorAll('.splat-still').forEach(s => s.remove());
    document.documentElement.classList.remove('has-splats');
    scene = null;
  };

  function frame(now) {
    raf = 0;
    if (!scene || document.hidden || disabled) return;
    draw(now);
    if (now - born > 600) watchSpeed(now); else lastFrame = now;
    raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && scene && !raf) raf = requestAnimationFrame(frame); });

  // Pointer: tilt the whole sculpture, and push splats apart under the cursor.
  addEventListener('pointermove', e => {
    tYaw = (e.clientX / innerWidth - .5) * .5;
    tPitch = -(e.clientY / innerHeight - .5) * .35;
    if (!scene) return;
    const r = canvas.getBoundingClientRect();
    const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
    tMouseOn = inside ? 1 : 0;
    mouse = [((e.clientX - r.left) / r.width - .5) * scene.box.w, ((e.clientY - r.top) / r.height - .5) * scene.box.h];
  }, { passive: true });
  addEventListener('pointerleave', () => { tMouseOn = 0; });
  addEventListener('resize', () => { place(); });

  document.addEventListener('spread', e => {
    const art = e.detail.faces.find(f => f.querySelector('svg.art'));
    attach(art || null);
  });
  if (window.__currentFaces) attach(window.__currentFaces.find(f => f.querySelector('svg.art')) || null);
})();
