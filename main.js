/* ─────────────────────────────────────────────
   Kronika tridsiatej jesene
   ───────────────────────────────────────────── */

/* Údaje, ktoré sa môžu meniť – stačí upraviť tu. */
const CONFIG = {
  ballDate: 'január 2027',
  ballPlace: 'Spolkový dům Střelnice, Tábor',
  festDate: '6. – 9. máj 2027',
  festPlace: 'Záhrady Lobkowiczkého zámku, Roudnice nad Labem',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll('[data-field]').forEach(el => {
  const v = CONFIG[el.dataset.field]; if (v) el.textContent = v;
});

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const lerp = (a, b, t) => a + (b - a) * t;

/* ───────── Nebo: Three.js galaxia častíc ───────── */
const sky = (() => {
  if (reduceMotion || typeof THREE === 'undefined') return { setProgress() {}, start() {} };
  const mount = $('#sky');
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setSize(innerWidth, innerHeight);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
  camera.position.set(0, 18, 70);

  // mäkká textúra bodu
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.35, 'rgba(255,255,255,.5)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);

  const palette = [new THREE.Color('#d4a84b'), new THREE.Color('#f0d58a'), new THREE.Color('#9cebdc'), new THREE.Color('#8f7fd8'), new THREE.Color('#f08a3c')];
  const makeCloud = (count, size, opacity, spread, galaxy) => {
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let x, y, z;
      if (galaxy) {
        const arm = i % 3, t = Math.random();
        const r = 6 + Math.pow(t, .7) * spread;
        const ang = t * 5.5 + arm * (Math.PI * 2 / 3) + (Math.random() - .5) * .9 * (1 - t * .5);
        x = Math.cos(ang) * r + (Math.random() - .5) * 4;
        z = Math.sin(ang) * r + (Math.random() - .5) * 4;
        y = (Math.random() - .5) * (3 + (1 - t) * 6);
      } else {
        x = (Math.random() - .5) * spread; y = (Math.random() - .5) * spread; z = (Math.random() - .5) * spread;
      }
      pos.set([x, y, z], i * 3);
      const k = galaxy ? palette[Math.random() < .55 ? 0 : (Math.random() < .5 ? 1 : (Math.random() < .5 ? 2 : (Math.random() < .5 ? 3 : 4)))] : palette[1];
      col.set([k.r, k.g, k.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size, map: tex, vertexColors: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    return new THREE.Points(geo, mat);
  };
  const galaxy = makeCloud(2600, .95, .8, 48, true);
  const dust = makeCloud(800, 2.2, .22, 60, true);
  galaxy.position.y = dust.position.y = -9;
  const stars = makeCloud(700, .9, .6, 260, false);
  scene.add(galaxy, dust, stars);

  let progress = 0, mx = 0, my = 0, tmx = 0, tmy = 0, running = false, t0 = performance.now();
  addEventListener('pointermove', e => { tmx = (e.clientX / innerWidth - .5); tmy = (e.clientY / innerHeight - .5); }, { passive: true });
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = (now - t0) / 1000;
    mx = lerp(mx, tmx, .04); my = lerp(my, tmy, .04);
    galaxy.rotation.y = t * .03 + progress * 2.2;
    dust.rotation.y = t * .02 + progress * 1.6;
    stars.rotation.y = t * .004 + progress * .3;
    galaxy.rotation.x = dust.rotation.x = -.1 + progress * .35;
    camera.position.x = mx * 10;
    camera.position.y = 16 - progress * 10 + my * 4;
    camera.position.z = 70 - progress * 20;
    camera.lookAt(0, -16 + progress * 6, 0);
    renderer.render(scene, camera);
  }
  return {
    setProgress(p) { progress = p; },
    start() { if (!running) { running = true; t0 = performance.now(); requestAnimationFrame(frame); } },
  };
})();

/* ───────── Popol a svetlušky (2D canvas) ───────── */
const embers = (() => {
  if (reduceMotion) return { start() {}, burst() {} };
  const cv = $('#embers'), ctx = cv.getContext('2d');
  let W, H, parts = [], running = false;
  const resize = () => { W = cv.width = innerWidth * Math.min(devicePixelRatio, 1.5); H = cv.height = innerHeight * Math.min(devicePixelRatio, 1.5); };
  resize(); addEventListener('resize', resize);
  const colors = ['#f0d58a', '#d4a84b', '#f08a3c', '#9cebdc'];
  const spawn = (x, y, vx, vy, life, r) => parts.push({ x, y, vx, vy, life, max: life, r, c: colors[Math.random() * colors.length | 0], ph: Math.random() * 6.28 });
  const ambient = () => { if (parts.length < 90) spawn(Math.random() * W, H + 10, (Math.random() - .5) * .4, -(.3 + Math.random() * .7), 400 + Math.random() * 500, 1 + Math.random() * 2.2); };
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    if (document.hidden) return;
    ctx.clearRect(0, 0, W, H);
    ambient(); if (Math.random() < .3) ambient();
    const s = Math.min(devicePixelRatio, 1.5);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life--; p.ph += .05;
      p.x += (p.vx + Math.sin(p.ph) * .25) * s; p.y += p.vy * s; p.vy *= .999; p.vx *= .995;
      if (p.life <= 0 || p.y < -20) { parts.splice(i, 1); continue; }
      const a = Math.min(1, p.life / p.max * 1.6) * (.55 + .45 * Math.sin(p.ph * 2));
      ctx.globalAlpha = a; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * s, 0, 6.28); ctx.fill();
      ctx.globalAlpha = a * .25; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2 * s, 0, 6.28); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  return {
    start() { if (!running) { running = true; requestAnimationFrame(frame); } },
    burst(cx, cy, n = 160) {
      const s = Math.min(devicePixelRatio, 1.5);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28, sp = 1.5 + Math.random() * 5;
        spawn(cx * s, cy * s, Math.cos(a) * sp, Math.sin(a) * sp - 2, 120 + Math.random() * 160, 1 + Math.random() * 2.5);
      }
    },
  };
})();

/* ───────── Víla, ktorá sprevádza kurzor ───────── */
(() => {
  if (reduceMotion || isTouch) return;
  const w = $('#wisp'); let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, shown = false;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; if (!shown) { shown = true; w.style.opacity = 1; } }, { passive: true });
  (function loop() { requestAnimationFrame(loop); x = lerp(x, tx, .08); y = lerp(y, ty, .08); w.style.transform = `translate(${x}px, ${y}px)`; })();
})();

/* ───────── Delenie textu na slová ───────── */
function splitWords(el) {
  const words = [];
  const walk = node => {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(tok => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
        const s = document.createElement('span'); s.className = 'w'; s.textContent = tok; frag.appendChild(s); words.push(s);
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && node.tagName !== 'BR') {
      Array.from(node.childNodes).forEach(walk);
    }
  };
  walk(el);
  return words;
}

/* ───────── Otvorenie listu ───────── */
const cover = $('#cover'), story = $('#story'), openBtn = $('#openBtn');
document.body.classList.add('locked');

function openLetter() {
  openBtn.disabled = true;
  story.hidden = false;
  if (!hasGsap || reduceMotion) {
    cover.remove(); document.body.classList.remove('locked'); sky.start(); embers.start();
    $('#sky').style.opacity = 1; $('#embers').style.opacity = 1;
    initScroll(); return;
  }
  const paper = $('.letter-paper'), hint = $('.letter-hint');
  const r = openBtn.getBoundingClientRect();
  embers.start(); embers.burst(r.left + r.width / 2, r.top + r.height / 2, 90);
  $('#embers').style.opacity = 1;

  const titleWords = $$('.title span');
  const ledeWords = splitWords($('.lede'));
  gsap.set(titleWords, { yPercent: 60, opacity: 0, filter: 'blur(14px)' });
  gsap.set(ledeWords, { opacity: 0, y: 10, filter: 'blur(6px)' });
  gsap.set(['.kicker', '.scroll-cue'], { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  tl.to(openBtn, { scale: 1.25, rotate: -8, duration: .35, ease: 'power2.out' })
    .to(openBtn, { scale: 0, rotate: 40, opacity: 0, duration: .5, ease: 'power3.in' }, '-=.05')
    .to(hint, { opacity: 0, duration: .3 }, '<')
    .to(paper, { rotate: 0, yPercent: -8, duration: .7 }, '-=.3')
    .to(paper, { yPercent: -160, rotate: 6, opacity: 0, duration: 1.1, ease: 'power3.in' })
    .to(cover, { opacity: 0, duration: 1.2, ease: 'power2.inOut', onStart() { sky.start(); } }, '-=.7')
    .to('#sky', { opacity: 1, duration: 2.4, ease: 'power2.out' }, '<')
    .add(() => { cover.remove(); document.body.classList.remove('locked'); initScroll(); }, '-=.6')
    .to(titleWords, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.4, stagger: .18, ease: 'power3.out' }, '-=.9')
    .to('.kicker', { opacity: 1, duration: 1 }, '-=1.2')
    .to(ledeWords, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .8, stagger: .018, ease: 'power2.out' }, '-=.8')
    .to('.scroll-cue', { opacity: 1, duration: 1 }, '-=.2');
}
openBtn.addEventListener('click', openLetter);

/* ───────── Scrollovanie: kapitoly, dar, epilóg ───────── */
function initScroll() {
  const chapters = $$('.chapter');
  const bgs = { ink: '#120f2a', forest: '#0f1f22', dust: '#1f1626', gift: '#0a0818', epilog: '#120f2a' };
  const setBg = c => document.documentElement.style.setProperty('--bg', c);

  // runový navigátor
  const runes = $$('.runes a');
  const markRune = id => runes.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  markRune('prolog');

  if (!hasGsap || reduceMotion) {
    // bez animácií: všetko viditeľné, iba pozadie a navigácia
    $$('.chapter-text, .lede, .kicker, .scroll-cue').forEach(e => e.style.opacity = 1);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { markRune(e.target.id); const b = e.target.dataset.bg; if (b) setBg(bgs[b]); } }), { threshold: .4 });
    $$('#prolog, .chapter, #dar, #epilog').forEach(s => io.observe(s));
    initCandle(); return;
  }

  // progres celej kroniky riadi galaxiu
  ScrollTrigger.create({ trigger: story, start: 'top top', end: 'bottom bottom', onUpdate: s => sky.setProgress(s.progress) });

  ScrollTrigger.create({ trigger: '#prolog', start: 'top center', end: 'bottom center', onToggle: s => { if (s.isActive) { markRune('prolog'); setBg(bgs.ink); } } });

  chapters.forEach(ch => {
    const words = [];
    ch.querySelectorAll('.chapter-text h2, .chapter-text p').forEach(el => words.push(...splitWords(el)));
    gsap.set(words, { opacity: 0, y: 14, filter: 'blur(7px)' });
    ScrollTrigger.create({
      trigger: ch, start: 'top 60%', once: true,
      onEnter: () => gsap.to(words, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .9, stagger: .016, ease: 'power2.out' }),
    });
    ScrollTrigger.create({
      trigger: ch, start: 'top center', end: 'bottom center',
      onToggle: s => { if (s.isActive) { markRune(ch.id); setBg(bgs[ch.dataset.bg] || bgs.ink); } },
    });
  });

  // I. pečať Itery sa otáča
  gsap.to('.art-itera .sigil', { rotate: 120, ease: 'none', scrollTrigger: { trigger: '#stretnutie', start: 'top bottom', end: 'bottom top', scrub: 1 } });

  // II. cesta sa kreslí
  gsap.to('#pathLine', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#cesta', start: 'top 70%', end: 'bottom 60%', scrub: 1.2 } });

  // III. hrad vyrastá a rozsvecuje sa
  gsap.to('.castle-svg', { yPercent: -20, ease: 'none', scrollTrigger: { trigger: '#hrad', start: 'top bottom', end: 'center center', scrub: 1 } });
  gsap.to('.castle-windows rect', { opacity: 1, duration: .5, stagger: { each: .35, from: 'random' }, ease: 'power2.out',
    scrollTrigger: { trigger: '#hrad', start: 'center 65%', once: true } });

  // IV. listina sa odvíja, potom priletia vstupenky
  const gift = gsap.timeline({ scrollTrigger: { trigger: '#dar', start: 'top top', end: 'bottom bottom', scrub: .8,
    onToggle: s => { if (s.isActive) { markRune('dar'); setBg(bgs.gift); } } } });
  gift.to(['.charter-top', '.charter-bottom'], { y: 0, duration: 3, ease: 'power2.inOut' }, 0)
      .to('.charter-body', { clipPath: 'inset(0% 0 0% 0)', duration: 3, ease: 'power2.inOut' }, 0)
      .to({}, { duration: 3 }) // chvíľa na prečítanie
      .to('.charter', { yPercent: -120, scale: .8, opacity: 0, duration: 2.2, ease: 'power3.in' })
      .to('.ticket', { rotateY: 0, opacity: 1, duration: 2.4, stagger: 1, ease: 'back.out(1.4)' }, '-=1.2')
      .to({}, { duration: 2 });

  // V. epilóg
  ScrollTrigger.create({ trigger: '#epilog', start: 'top center', onToggle: s => { if (s.isActive) { markRune('epilog'); setBg(bgs.epilog); } } });

  initTilt();
  initCandle();
  ScrollTrigger.refresh();
}

/* ───────── 3D naklápanie vstupeniek ───────── */
function initTilt() {
  if (isTouch) return;
  $$('[data-tilt]').forEach(card => {
    const shine = document.createElement('div'); shine.className = 'shine'; card.appendChild(shine);
    let raf = 0;
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', px * 100 + '%'); card.style.setProperty('--my', py * 100 + '%');
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => gsap.to(card, { rotateY: (px - .5) * 18, rotateX: (.5 - py) * 14, scale: 1.03, duration: .5, ease: 'power2.out', overwrite: 'auto' }));
    });
    card.addEventListener('pointerleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, scale: 1, duration: .8, ease: 'elastic.out(1, .5)', overwrite: 'auto' }));
  });
}

/* ───────── Sviečka ───────── */
function initCandle() {
  const candle = $('#candle'), epilog = $('#epilog'), wish = $('#wish');
  let done = false;
  candle.addEventListener('click', () => {
    if (done) return; done = true;
    candle.classList.add('out');
    const r = candle.getBoundingClientRect();
    embers.burst(r.left + r.width / 2, r.top + 40, 220);
    epilog.classList.add('done');
    if (hasGsap && !reduceMotion) {
      const words = []; wish.querySelectorAll('h2, p').forEach(el => words.push(...splitWords(el)));
      gsap.set(wish, { opacity: 1 });
      gsap.from(words, { opacity: 0, y: 12, filter: 'blur(8px)', duration: 1, stagger: .03, ease: 'power2.out', delay: 1.1 });
    } else {
      wish.style.opacity = 1;
    }
  });
}
