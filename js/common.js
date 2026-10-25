(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;

  /* scroll progress */
  const prog = document.getElementById('prog');
  const onScroll = () => { const h = document.documentElement; prog.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`; };
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  if (document.getElementById('blobs')) {
  /* gradient blobs */
  const cv = document.getElementById('blobs'), ctx = cv.getContext('2d');
  const cols = ['47,196,173','255,210,63','255,59,118','122,77,255'];
  let W = 0, H = 0, blobs = [], mx = .7, my = .4, running = true;
  function size(){
    const r = cv.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
    if (w === W && Math.abs(h - H) < 2) return;
    W = w; H = h; const d = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d,0,0,d,0,0);
    if (!blobs.length) blobs = cols.map((c,i) => ({c, x:Math.random(), y:Math.random(), a:Math.random()*6, s:.00025 + i*.00008, r:.28 + Math.random()*.14}));
  }
  function draw(t){
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';
    blobs.forEach((b,i) => {
      const x = (b.x + Math.sin(t*b.s + b.a)*.18 + (mx-.5)*.06*(i%2?1:-1)) * W;
      const y = (b.y + Math.cos(t*b.s*1.3 + b.a)*.18 + (my-.5)*.06) * H;
      const R = b.r * Math.max(W, H);
      const g = ctx.createRadialGradient(x,y,0,x,y,R);
      g.addColorStop(0, `rgba(${b.c},.22)`); g.addColorStop(1, `rgba(${b.c},0)`);
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    });
    ctx.globalCompositeOperation = 'source-over';
    if (!reduce && running) requestAnimationFrame(draw);
  }
  size(); draw(0);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); if (reduce) draw(0); }, 150); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was && !reduce) requestAnimationFrame(draw); }).observe(cv);
  document.querySelector('.hero').addEventListener('pointermove', e => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; });

  }

  if (document.getElementById('blobs')) {
  /* 3D photo tilt + sheen */
  const card = document.getElementById('card'), frame = document.getElementById('frame');
  if (!reduce) {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      frame.style.transform = `rotateY(${(x-.5)*18}deg) rotateX(${(.5-y)*18}deg) rotate(0deg) scale(1.02)`;
      frame.style.setProperty('--sx', x*100 + '%'); frame.style.setProperty('--sy', y*100 + '%');
    });
    card.addEventListener('pointerleave', () => { frame.style.transform = ''; });
  }

  }

  /* magnetic buttons */
  if (fine && !reduce) document.querySelectorAll('.mag').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width/2)*.25}px,${(e.clientY - r.top - r.height/2)*.35}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  if (document.getElementById('blobs')) {
  /* rotating word */
  const words = ['Web Developer','Software Developer','AI Builder','Game Developer','Graphic Designer','Photographer','Videographer','Video Editor','Director','Production Manager','Streamer'];
  const rot = document.getElementById('rot'); let wi = 0;
  if (!reduce) setInterval(() => {
    wi = (wi + 1) % words.length; const w = words[wi]; let i = 0;
    const t = setInterval(() => { rot.textContent = w.slice(0, ++i); if (i >= w.length) clearInterval(t); }, 40);
  }, 2400);

  }

  /* counters (final value already rendered; replay on load) */
  if (!reduce) document.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || ''; const t0 = performance.now();
    const step = now => { const p = Math.min(1, (now - t0) / 1400), v = Math.round(end * (1 - Math.pow(1 - p, 3))); el.textContent = v + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });

  /* email: copy address on click */
  const mail = document.querySelector('.mail');
  if (mail) mail.addEventListener('click', e => {
    const addr = 'zadeedhuq2018@gmail.com';
    if (navigator.clipboard) {
      e.preventDefault();
      navigator.clipboard.writeText(addr).then(() => {
        const t = document.getElementById('copied'); t.hidden = false;
        clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, 1800);
      }, () => { location.href = 'mailto:' + addr; });
    }
  });
  /* per-letter solid colour cycle */
  document.querySelectorAll('.big .s, .mail').forEach(el => {
    let i = 0;
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        [...c.textContent].forEach(ch => { const s = document.createElement('span'); s.className = 'cl'; s.textContent = ch; s.style.setProperty('--i', i++); f.appendChild(s); });
        c.replaceWith(f);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
    });
    walk(el);
  });
  /* heading hover: smooth letter wave */
  document.querySelectorAll('.scr').forEach(h => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); i++; return; }
            const w = document.createElement('span'); w.className = 'wd'; w.setAttribute('aria-hidden', 'true');
            [...part].forEach(c => { const sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = c; sp.style.setProperty('--i', i++); w.appendChild(sp); });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    h.setAttribute('aria-label', h.textContent);
    walk(h);
  });

  /* case study dialogs */
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
    const d = document.getElementById(b.dataset.open);
    d && d.querySelectorAll('iframe[data-src]').forEach(f => { if (!f.src) f.src = f.dataset.src; });
  }));

  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
    const d = document.getElementById(b.dataset.open); if (d && d.showModal) d.showModal();
  }));
  document.querySelectorAll('dialog.case').forEach(d => {
    d.querySelectorAll('[data-close]').forEach(x => x.addEventListener('click', () => d.close()));
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  });
  document.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => {
    setTimeout(() => document.getElementById(b.dataset.jump)?.scrollIntoView({behavior:'smooth', block:'start'}), 80);
  }));
  /* 60 grid */
  const vg = document.getElementById('vgrid'), q = ['var(--teal)','var(--mag)','var(--sun)'];
  if (vg) for (let i = 0; i < 60; i++) { const c = document.createElement('i'); c.style.setProperty('--q', q[i < 20 ? 0 : i < 40 ? 1 : 2]); c.style.animationDelay = (i * 0.05) + 's'; vg.appendChild(c); }

  /* spotlight on skill cards */
  document.querySelectorAll('.skc').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));
})();

/* ---- button micro-architecture: wrap trailing glyphs in their own circle ---- */
(() => {
  const GLYPH = /\s*([↗↓→])\s*$/;
  document.querySelectorAll('.btn').forEach(b => {
    if (b.querySelector('.bic')) return;
    for (let i = b.childNodes.length - 1; i >= 0; i--) {
      const n = b.childNodes[i];
      if (n.nodeType !== 3) continue;
      const m = n.nodeValue.match(GLYPH);
      if (!m) continue;
      n.nodeValue = n.nodeValue.replace(GLYPH, '');
      const ic = document.createElement('i');
      ic.className = 'bic'; ic.setAttribute('aria-hidden', 'true'); ic.textContent = m[1];
      b.appendChild(ic);
      break;
    }
  });
})();

(function () {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const coarse = matchMedia('(pointer:coarse)').matches;
  /* 3D lives in the hero only: project-card and contact scenes are switched off */
  root.classList.add('flat3d');

  /* cards: a small 3D tilt that follows the pointer (hero scene itself ignores the mouse) */
  if (!coarse && !reduce) {
    const sel = '.role,.it,.proj,.skc,.rig,.hcard,.reel,.capture,.debug,.mini div,.cbox,.hero .hats div,.stream';
    document.querySelectorAll(sel).forEach(el => {
      const max = el.matches('.proj.feat,.cbox,.reel,.stream') ? 2.2 : 5;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.classList.add('tilting');
        el.style.transform = 'perspective(1000px) rotateX(' + (-y * max).toFixed(2) + 'deg) rotateY(' + (x * max).toFixed(2) + 'deg) translateY(-4px)';
      }, { passive: true });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; el.classList.remove('tilting'); }, { passive: true });
    });
  }
})();
