(() => {
  // Force scroll position strictly to (0, 0)
  function forceScrollTop() {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  forceScrollTop();
  window.addEventListener('load', forceScrollTop);
  window.addEventListener('pageshow', forceScrollTop);

  const html = document.documentElement;
  const body = document.body;
  const loader = document.getElementById('loader');
  const barEl = document.getElementById('bar');
  const countEl = document.getElementById('count');
  const progressEl = document.querySelector('.loader-progress');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = document.getElementById('stage');
  const layerBg = document.querySelector('.layer--bg');
  const layerTitle = document.querySelector('.layer--title');
  const layerStatue = document.querySelector('.layer--statue');
  const statueImg = document.getElementById('statueImg');
  const principleItems = [...document.querySelectorAll('.next li')];

  html.classList.add('is-loading');
  body.classList.add('is-loading');

  /* Assets loader */
  const assets = ['img/loading.jpg', 'img/hero-bg.jpg', 'img/statue.png'];
  const startedAt = performance.now();
  const minDuration = reduceMotion ? 300 : 1800;
  let loaded = 0;
  let progress = 0;
  let finished = false;
  let frameId;
  let frameScheduled = false;

  assets.forEach((src) => {
    const image = new Image();
    image.onload = image.onerror = () => {
      if (image.naturalWidth === 0) console.error(`Gagal memuat aset: ${src}`);
      loaded += 1;
    };
    image.src = src;
  });

  function scheduleTick() {
    if (frameScheduled || finished) return;
    frameScheduled = true;
    frameId = requestAnimationFrame((now) => {
      frameScheduled = false;
      tick(now);
    });
  }

  function tick(now) {
    const timeProgress = Math.min((now - startedAt) / minDuration, 1);
    const assetProgress = assets.length > 0 ? (loaded / assets.length) : 1;
    const target = (timeProgress >= 1) ? 100 : Math.max(timeProgress * 100, assetProgress * 100);
    progress += (target - progress) * 0.15;
    if (progress > 99.2 || (target === 100 && progress > 98)) progress = 100;
    barEl.style.width = `${progress}%`;
    countEl.textContent = Math.round(progress);
    progressEl.setAttribute('aria-valuenow', String(Math.round(progress)));

    if (progress < 100) {
      scheduleTick();
      return;
    }
    finish();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (frameScheduled) cancelAnimationFrame(frameId);
      frameScheduled = false;
      return;
    }
    scheduleTick();
  });
  scheduleTick();

  function finish() {
    if (finished) return;
    finished = true;
    forceScrollTop();
    loader.classList.add('is-done');
    html.classList.add('is-revealing');
    body.classList.add('is-revealing');

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      html.classList.remove('is-loading', 'is-revealing');
      body.classList.remove('is-loading', 'is-revealing');
      body.classList.add('is-ready');
      forceScrollTop();
    };

    setTimeout(reveal, reduceMotion ? 50 : 1200);
  }

  /* 3D CURSOR & GYRO TILT TRACKING WITH IDLE FLOAT FALLBACK */
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let hasUserMovedMouse = false;

  function updateCursorPosition(clientX, clientY) {
    hasUserMovedMouse = true;
    const w = window.innerWidth || document.documentElement.clientWidth || 1000;
    const h = window.innerHeight || document.documentElement.clientHeight || 800;
    targetX = Math.max(-1, Math.min(1, ((clientX / w) - 0.5) * 2));
    targetY = Math.max(-1, Math.min(1, ((clientY / h) - 0.5) * 2));
  }

  window.addEventListener('mousemove', (e) => updateCursorPosition(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointermove', (e) => updateCursorPosition(e.clientX, e.clientY), { passive: true });
  document.addEventListener('mousemove', (e) => updateCursorPosition(e.clientX, e.clientY), { passive: true });
  document.addEventListener('pointermove', (e) => updateCursorPosition(e.clientX, e.clientY), { passive: true });

  /* Gyroscope for Mobile */
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma !== null && e.beta !== null) {
      hasUserMovedMouse = true;
      targetX = Math.max(-1, Math.min(1, e.gamma / 20));
      targetY = Math.max(-1, Math.min(1, (e.beta - 40) / 20));
    }
  }, { passive: true });

  /* Card tilt */
  principleItems.forEach((item) => {
    item.addEventListener('pointermove', (event) => {
      const bounds = item.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
      item.style.setProperty('--card-rx', `${(-y * 8).toFixed(2)}deg`);
      item.style.setProperty('--card-ry', `${(x * 8).toFixed(2)}deg`);
      item.classList.add('is-tilting');
    });
    item.addEventListener('pointerleave', () => {
      item.style.removeProperty('--card-rx');
      item.style.removeProperty('--card-ry');
      item.classList.remove('is-tilting');
    });
  });

  /* 60FPS RAF Render Loop for Subtle 3D Statue Tilt */
  function render3DTilt(timestamp) {
    const time = (timestamp || performance.now()) * 0.0012;

    // Subtle gentle float if user hasn't moved mouse yet
    if (!hasUserMovedMouse) {
      targetX = Math.sin(time) * 0.25;
      targetY = Math.cos(time * 0.8) * 0.15;
    }

    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    // ONLY TILT THE STATUE (No background/title tilt, no zoom)
    if (statueImg) {
      const rotX = (-currentY * 7).toFixed(2);
      const rotY = (currentX * 8).toFixed(2);
      const shiftX = (-currentX * 16).toFixed(2);

      // Apply subtle 3D tilt and horizontal shift to the statue image
      // transform-origin is 'center bottom' in CSS.
      // Zero shiftY and zero rotZ ensure the base stays perfectly grounded with no gaps or downward bleed
      statueImg.style.transform = `translate3d(${shiftX}px, 0px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`;

      // Subtle dynamic drop-shadow reaction
      const shadowX = (-currentX * 20).toFixed(1);
      const shadowY = (22 - currentY * 8).toFixed(1);
      const shadowBlur = (24 + (Math.abs(currentX) + Math.abs(currentY)) * 6).toFixed(1);

      statueImg.style.filter = `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px rgba(35, 5, 5, 0.45))`;
    }

    requestAnimationFrame(render3DTilt);
  }

  render3DTilt();
})();



