// =============================================
//  AMMAR.DAW — Portfolio Script
// =============================================

// --- AUDIO PLAYER STATE ---
const tracks = [
  { title: "Autumn - Ammar", src: "music/nice mp3 2.mp3", bpm: 101 },
  { title: "Move - Ammar", src: "music/Ladudi-ProdAmmar.wav", bpm: 100 },
  { title: "Reflections - Ammar", src: "music/oo aa mp3 1.mp3", bpm: 90 },
  { title: "Make Way - Ammar", src: "music/Way-ProdAmmar.mp3", bpm: 140 },
  { title: "Anymore - Ammar", src: "music/ANYMORE-ProdAmmar.mp3", bpm: 115 },
  { title: "Tell You - Ammar", src: "music/guitarshit mp3 1.mp3", bpm: 113 },
  { title: "Think - Ammar", src: "music/jerseyshit.mp3", bpm: 132 }
];
let currentTrack = 0;
let audio = null;
let isPlaying = false;
let clockInterval = null;
let autoplayUnlockListening = false;
let autoplayUnlockTrying = false;
let audioCtx = null;
let audioSourceNode = null;
let analyser = null;
let frequencyData = null;
let currentAudioEnergy = 0;
const mobilePerfQuery = window.matchMedia('(max-width: 768px), (pointer: coarse)');
const isMobilePerf = () => mobilePerfQuery.matches;
const getCanvasDpr = () => Math.min(window.devicePixelRatio || 1, isMobilePerf() ? 1 : 2);

// --- AUDIO FUNCTIONS ---

function initAudio() {
  if (!audio) {
    audio = new Audio();
    audio.volume = 0.7;
    audio.preload = 'auto';
    audio.autoplay = true;
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('error', () => {
      document.getElementById('now-playing').textContent =
        '⚠ Add your MP3/WAV files to /music/ to enable playback';
    });
  }
  const nextSrc = new URL(tracks[currentTrack].src, window.location.href).href;
  if (audio.src !== nextSrc) audio.src = tracks[currentTrack].src;
  document.getElementById('bpm-display').textContent = tracks[currentTrack].bpm;
  document.getElementById('now-playing').textContent = '▷ ' + tracks[currentTrack].title;
}

function setPlayerUi(playing) {
  const btn = document.getElementById('btn-play');
  if (btn) {
    btn.textContent = playing ? '⏸' : '▶';
    btn.classList.toggle('active', playing);
  }
  document.getElementById('eq-mini').style.display = playing ? 'flex' : 'none';
}

function syncThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const isLight = document.body.classList.contains('light-mode');
  btn.textContent = isLight ? '☾' : '☼';
  btn.title = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  syncThemeToggle();
}

function setupAudioAnalysis() {
  return;
}

function resumeAudioAnalysis() {
  setupAudioAnalysis();
}

function loadAudio(showBlockedMessage = true) {
  initAudio();
  const p = audio.play();
  if (p !== undefined) {
    return p.then(() => {
      isPlaying = true;
      setPlayerUi(true);
      startClock();
      document.getElementById('audio-msg').style.display = 'none';
      resumeAudioAnalysis();
      return true;
    }).catch(() => {
      if (showBlockedMessage) document.getElementById('audio-msg').style.display = 'block';
      return false;
    });
  }
  isPlaying = true;
  setPlayerUi(true);
  startClock();
  document.getElementById('audio-msg').style.display = 'none';
  resumeAudioAnalysis();
  return Promise.resolve(true);
}

function togglePlay(btn) {
  if (!audio) { loadAudio(); return; }
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    setPlayerUi(false);
    stopClock();
  } else {
    loadAudio();
  }
}

function stopPlayer() {
  if (audio) { audio.pause(); audio.currentTime = 0; }
  isPlaying = false;
  setPlayerUi(false);
  stopClock();
  resetClock();
}

function removeAutoplayUnlock() {
  ['click', 'pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach(eventName => {
    window.removeEventListener(eventName, unlockAutoplay);
  });
  autoplayUnlockListening = false;
}

function unlockAutoplay() {
  if (isPlaying || autoplayUnlockTrying) return;
  autoplayUnlockTrying = true;
  loadAudio(false).then(started => {
    autoplayUnlockTrying = false;
    if (started) removeAutoplayUnlock();
  });
}

function enableAutoplayUnlock() {
  if (autoplayUnlockListening) return;
  autoplayUnlockListening = true;
  ['click', 'pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach(eventName => {
    window.addEventListener(eventName, unlockAutoplay, { passive: true });
  });
  document.getElementById('audio-msg').style.display = 'block';
}

function startAutoplay() {
  loadAudio(false).then(started => {
    if (!started) enableAutoplayUnlock();
  });
}

function nextTrack() {
  currentTrack = (currentTrack + 1) % tracks.length;
  const wasPlaying = isPlaying;
  resetClock();
  initAudio();
  if (wasPlaying) { audio.play(); startClock(); }
}

function prevTrack() {
  currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
  const wasPlaying = isPlaying;
  resetClock();
  initAudio();
  if (wasPlaying) { audio.play(); startClock(); }
}

function setVolume(v) {
  if (audio) audio.volume = v / 100;
}

function updateProgress() {
  if (!audio) return;
  updateTimeDisplay(audio.currentTime);
  if (audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById('mini-prog-fill').style.width = pct + '%';
  }
}

function seekFromBar(e, bar) {
  if (!audio || !audio.duration) return;
  const rect = bar.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audio.currentTime = pct * audio.duration;
  updateProgress();
}

// --- CLOCK ---

function resetClock() {
  updateTimeDisplay(0);
  document.getElementById('mini-prog-fill').style.width = '0%';
}

function updateTimeDisplay(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const fmt = n => String(n).padStart(2, '0');
  const timeStr = fmt(h) + ':' + fmt(m) + ':' + fmt(s);
  document.getElementById('time-display').textContent = timeStr;
  const footerTime = document.getElementById('footer-time');
  if (footerTime) footerTime.textContent = timeStr;
}

function startClock() {
  if (clockInterval) clearInterval(clockInterval);
  updateProgress();
  clockInterval = setInterval(updateProgress, 250);
}

function stopClock() {
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = null;
}

// --- PROJECT TRACKS ---

function toggleTrack(el) {
  const wasExpanded = el.classList.contains('expanded');
  document.querySelectorAll('.track-lane.expanded').forEach(t => {
    t.classList.remove('expanded');
    t.querySelector('.track-expand').textContent = '▸';
  });
  if (!wasExpanded) {
    el.classList.add('expanded');
    el.querySelector('.track-expand').textContent = '▾';
  }
}

// --- CONTACT FORM ---

async function sendForm(event) {
  event.preventDefault();

  const form = event.target;
  const success = document.getElementById('send-success');
  const submitBtn = form.querySelector('.btn-send');
  const originalText = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = 'SENDING...';

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Message could not be sent.');
    }

    form.reset();
    form.style.display = 'none';
    success.style.display = 'block';
    setTimeout(() => {
      form.style.display = 'flex';
      success.style.display = 'none';
    }, 3000);
  } catch (error) {
    alert(error.message || 'Message could not be sent. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// --- SKILL FADERS (scroll-triggered animation) ---

const faders = document.querySelectorAll('.ch-fader-fill');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const w = e.target.getAttribute('data-width');
      e.target.style.width = w + '%';
    }
  });
}, { threshold: 0.1 });
faders.forEach(f => observer.observe(f));

// --- SCROLL MOTION ---

const revealItems = document.querySelectorAll(
  '.section-header, .about-panel, .channel-strip, .track-lane, .preset-card, .sample-card, .release-window, .export-panel'
);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealGroups = new Map();

revealItems.forEach(el => {
  el.classList.add('reveal-on-scroll', 'reveal-from-down');
  if (el.matches('.track-lane, .channel-strip, .preset-card, .sample-card')) {
    const group = el.closest('.arrangement-view, .mixer-rack, .preset-rack, .sb-content');
    const groupIndex = revealGroups.get(group) || 0;
    revealGroups.set(group, groupIndex + 1);
    el.dataset.revealDelay = Math.min(groupIndex * 0.12, 0.48) + 's';
    el.style.transitionDelay = el.dataset.revealDelay;
  }
});

if (reduceMotion) {
  revealItems.forEach(el => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        entry.target.classList.remove('is-visible');
        const willRevealFromUp = entry.boundingClientRect.top < 0;
        entry.target.classList.toggle('reveal-from-up', willRevealFromUp);
        entry.target.classList.toggle('reveal-from-down', !willRevealFromUp);
        entry.target.style.transitionDelay = willRevealFromUp ? '0s' : (entry.target.dataset.revealDelay || '0s');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  revealItems.forEach(el => revealObserver.observe(el));
}

const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
const sectionSequence = ['hero', 'about', 'skills', 'projects', 'achievements', 'music', 'contact', 'end'];
const rulerMarks = Array.from(document.querySelectorAll('.ruler-mark'));
const activeSections = sectionSequence
  .map(id => id === 'end' ? document.querySelector('footer') : document.getElementById(id))
  .filter(Boolean);

rulerMarks.forEach((mark, index) => {
  mark.dataset.section = sectionSequence[index] || '';
});

function setActiveSection(id) {
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
  });
  activeSections.forEach(section => {
    section.classList.toggle('section-active', section.id === id);
  });

  const activeIndex = sectionSequence.indexOf(id);
  rulerMarks.forEach((mark, index) => {
    mark.classList.toggle('is-active', index === activeIndex);
    mark.classList.toggle('is-past', activeIndex > -1 && index < activeIndex);
  });
}

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.matches('footer') ? 'end' : entry.target.id;
      setActiveSection(id);
    }
  });
}, { threshold: 0.2, rootMargin: '-38% 0px -52% 0px' });

activeSections.forEach(section => navObserver.observe(section));
setActiveSection('hero');

let scrollTicking = false;
function updateScrollProgress() {
  const doc = document.documentElement;
  const maxScroll = doc.scrollHeight - window.innerHeight;
  const pct = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  doc.style.setProperty('--scroll-progress', pct + '%');
  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateScrollProgress);
    scrollTicking = true;
  }
}, { passive: true });
updateScrollProgress();

// --- RELEASE CAROUSEL ---

const releaseSlides = [
  {
    title: 'Love Letter',
    artists: 'Featuring: Omer Khan Niazi & Dan1yal Shah1d',
    image: 'images/Love letter driving artwork spotify.jpg',
    url: 'https://youtu.be/eqFz3zTvnbE?si=ObTjbjQYYdrKTK3R'
  },
  {
    title: 'Chal Paray',
    artists: 'Featuring: Omer Khan Niazi & Dan1yal Shah1d',
    image: 'images/CHAL PARAY.png',
    url: 'https://youtu.be/x1zpjBoFSBc?si=Cq9QYEq-PvwQLgON'
  },
  {
    title: 'Takedown',
    artists: 'Featuring: Omer Khan Niazi',
    image: 'images/takedown final art.png',
    url: 'https://youtu.be/zGNlzSv0XFg?si=7UYSxfa9iM33Me6e'
  },
  {
    title: 'Hydrangea',
    artists: '',
    image: 'images/hydrangea.png',
    url: 'https://youtu.be/l1O0tijAPqk?si=ZhM2tFY0IWu5Qsz0'
  }
];
let releaseIndex = 0;
let releaseTimer = null;

function getReleaseEls() {
  return {
    stage: document.getElementById('release-link'),
    image: document.getElementById('release-image'),
    kicker: document.getElementById('release-kicker'),
    title: document.getElementById('release-title'),
    artists: document.getElementById('release-artists'),
    dots: document.getElementById('release-dots'),
    window: document.querySelector('.release-window')
  };
}

function renderRelease(animate = true) {
  const els = getReleaseEls();
  if (!els.stage || !releaseSlides.length) return;
  const release = releaseSlides[releaseIndex];

  const applyRelease = () => {
    els.stage.href = release.url;
    els.stage.setAttribute('aria-label', 'Open ' + release.title + ' on YouTube');
    els.image.src = release.image;
    els.image.alt = release.title + ' cover';
    els.kicker.textContent = 'RELEASE ' + String(releaseIndex + 1).padStart(2, '0');
    els.title.textContent = release.title;
    els.artists.textContent = release.artists;
    if (els.dots) {
      Array.from(els.dots.children).forEach((dot, index) => {
        dot.classList.toggle('active', index === releaseIndex);
      });
    }
  };

  if (!animate) {
    applyRelease();
    return;
  }

  els.stage.classList.add('is-sliding');
  setTimeout(() => {
    applyRelease();
    els.stage.classList.remove('is-sliding');
  }, 180);
}

function resetReleaseTimer() {
  if (releaseTimer) clearInterval(releaseTimer);
  if (!reduceMotion && releaseSlides.length > 1) {
    releaseTimer = setInterval(nextRelease, 4200);
  }
}

function nextRelease() {
  releaseIndex = (releaseIndex + 1) % releaseSlides.length;
  renderRelease();
  resetReleaseTimer();
}

function prevRelease() {
  releaseIndex = (releaseIndex - 1 + releaseSlides.length) % releaseSlides.length;
  renderRelease();
  resetReleaseTimer();
}

function goToRelease(index) {
  if (index === releaseIndex) return;
  releaseIndex = index;
  renderRelease();
  resetReleaseTimer();
}

function initReleaseCarousel() {
  const els = getReleaseEls();
  if (!els.stage || !els.dots) return;
  els.dots.innerHTML = '';
  releaseSlides.forEach((release, index) => {
    const dot = document.createElement('button');
    dot.className = 'release-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Show ' + release.title);
    dot.addEventListener('click', () => goToRelease(index));
    els.dots.appendChild(dot);
  });
  if (els.window) {
    els.window.addEventListener('mouseenter', () => {
      if (releaseTimer) clearInterval(releaseTimer);
    });
    els.window.addEventListener('mouseleave', resetReleaseTimer);
  }
  renderRelease(false);
  resetReleaseTimer();
}

initReleaseCarousel();

// --- HERO VISUAL SIMULATION ---

const hero = document.getElementById('hero');
const heroName = document.querySelector('.hero-name');
const heroBars = Array.from(document.querySelectorAll('.eq-display .eq-bar'));
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

function getVisualPalette() {
  const light = document.body.classList.contains('light-mode');
  if (light) {
    return {
      playhead: energy => 'rgba(0,96,101,' + (0.12 + energy * 0.18) + ')',
      wave1: 'rgba(0,96,101,0.36)',
      wave2: 'rgba(94,103,74,0.28)',
      wave3: 'rgba(38,116,72,0.20)',
      link: alpha => 'rgba(0,96,101,' + alpha + ')',
      waveform: energy => 'rgba(0,96,101,' + (0.34 + energy * 0.24) + ')'
    };
  }

  return {
    playhead: energy => 'rgba(0,215,215,' + (0.055 + energy * 0.13) + ')',
    wave1: 'rgba(0,215,215,0.26)',
    wave2: 'rgba(143,151,121,0.20)',
    wave3: 'rgba(57,255,138,0.14)',
    link: alpha => 'rgba(0,215,215,' + alpha + ')',
    waveform: energy => 'rgba(0,215,215,' + (0.24 + energy * 0.20) + ')'
  };
}

function readAudioEnergy() {
  let energy = 0;

  if (analyser && frequencyData && isPlaying) {
    analyser.getByteFrequencyData(frequencyData);
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) sum += frequencyData[i];
    energy = sum / (frequencyData.length * 255);
  } else {
    energy = 0.22 + Math.sin(performance.now() * 0.0022) * 0.08;
  }

  currentAudioEnergy += (energy - currentAudioEnergy) * 0.14;
  return currentAudioEnergy;
}

function updateHeroAudioUi(energy) {
  document.documentElement.style.setProperty('--beat', energy.toFixed(3));

  if (heroName) {
    heroName.classList.add('audio-pulse');
    heroName.style.transform = 'scale(' + (1 + energy * 0.025).toFixed(3) + ')';
  }

  heroBars.forEach((bar, index) => {
    const bin = frequencyData ? frequencyData[(index * 5) % frequencyData.length] / 255 : 0;
    const wave = Math.sin(performance.now() * 0.004 + index * 0.75) * 0.5 + 0.5;
    const level = isPlaying && frequencyData ? bin : wave * energy;
    bar.style.height = Math.round(10 + level * 31) + 'px';
  });
}

function initHeroSimulation() {
  if (!hero || reduceMotion) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-sim-canvas';
  hero.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const particles = [];
  let w = 0;
  let h = 0;
  let dpr = 1;
  let playhead = 0;

  function resizeHeroCanvas() {
    dpr = getCanvasDpr();
    w = hero.clientWidth;
    h = hero.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const maxParticles = isMobilePerf() ? 34 : 70;
    const minParticles = isMobilePerf() ? 18 : 32;
    const particleSpacing = isMobilePerf() ? 36 : 22;
    const targetCount = Math.min(maxParticles, Math.max(minParticles, Math.floor(w / particleSpacing)));
    while (particles.length < targetCount) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.35,
        size: 1 + Math.random() * 1.8
      });
    }
    particles.length = targetCount;
  }

  function drawWaveLayer(energy, yBase, color, phase, ampMultiplier) {
    ctx.beginPath();
    const step = isMobilePerf() ? 14 : 8;
    for (let x = 0; x <= w; x += step) {
      const freqIndex = frequencyData ? Math.floor((x / w) * frequencyData.length) : 0;
      const audioLevel = frequencyData ? frequencyData[freqIndex] / 255 : 0.35;
      const sine = Math.sin(x * 0.018 + phase) * 0.45 + Math.sin(x * 0.006 - phase * 0.7) * 0.55;
      const amp = (18 + energy * 80) * ampMultiplier;
      const y = yBase + sine * amp * (0.45 + audioLevel);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4 + energy * 2;
    ctx.shadowBlur = 18 + energy * 22;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  let lastHeroDrawTime = 0;
  function drawHeroSimulation(nowMs) {
    const minFrameMs = isMobilePerf() ? 33 : 0;
    if (nowMs - lastHeroDrawTime < minFrameMs) {
      requestAnimationFrame(drawHeroSimulation);
      return;
    }
    lastHeroDrawTime = nowMs;
    const energy = readAudioEnergy();
    const palette = getVisualPalette();
    updateHeroAudioUi(energy);

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    playhead = (playhead + 0.65 + energy * 4) % Math.max(w, 1);
    ctx.strokeStyle = palette.playhead(energy);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playhead, 0);
    ctx.lineTo(playhead, h);
    ctx.stroke();

    const phase = nowMs * 0.0018;
    drawWaveLayer(energy, h * 0.38, palette.wave1, phase, 1);
    drawWaveLayer(energy, h * 0.49, palette.wave2, phase * 1.25, 0.72);
    drawWaveLayer(energy, h * 0.60, palette.wave3, phase * 0.85, 0.95);

    particles.forEach((p, i) => {
      p.x += p.vx * (1 + energy * 2.4);
      p.y += p.vy * (1 + energy * 1.8);
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j];
        const dx = p.x - other.x;
        const dy = p.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const reach = 105 + energy * 80;
        if (dist < reach) {
          ctx.strokeStyle = palette.link((1 - dist / reach) * (0.045 + energy * 0.08));
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = 'rgba(224,224,240,' + (0.24 + energy * 0.5) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + energy * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(drawHeroSimulation);
  }

  resizeHeroCanvas();
  window.addEventListener('resize', resizeHeroCanvas);
  requestAnimationFrame(drawHeroSimulation);
}

function updateCursorEnergy(e) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  document.documentElement.style.setProperty('--cursor-x', pointer.x + 'px');
  document.documentElement.style.setProperty('--cursor-y', pointer.y + 'px');
}

window.addEventListener('pointermove', updateCursorEnergy, { passive: true });
initHeroSimulation();

// --- WAVEFORM CANVAS ---

const wc = document.getElementById('waveform-canvas');
if (wc) {
  const ctx2 = wc.getContext('2d');
  let wt = 0;
  let waveW = 0;
  let waveH = 0;

  function resizeWaveCanvas() {
    const dpr = getCanvasDpr();
    const nextW = Math.max(1, Math.floor(wc.offsetWidth * dpr));
    const nextH = Math.max(1, Math.floor(wc.offsetHeight * dpr));
    if (nextW === waveW && nextH === waveH) return;

    waveW = nextW;
    waveH = nextH;
    wc.width = waveW;
    wc.height = waveH;
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resizeWaveCanvas();
  window.addEventListener('resize', resizeWaveCanvas, { passive: true });

  function drawWave() {
    resizeWaveCanvas();
    const cssW = wc.offsetWidth;
    const cssH = wc.offsetHeight;
    ctx2.clearRect(0, 0, cssW, cssH);
    const energy = Math.max(currentAudioEnergy, 0.16);
    ctx2.strokeStyle = getVisualPalette().waveform(energy);
    ctx2.lineWidth = 1.2 + energy * 2.2;
    ctx2.beginPath();
    const xStep = isMobilePerf() ? 2 : 1;
    for (let x = 0; x < cssW; x += xStep) {
      const bin = frequencyData ? frequencyData[Math.floor((x / cssW) * frequencyData.length)] / 255 : 0.35;
      const freq1 = Math.sin((x / cssW) * Math.PI * 8 + wt) * (14 + energy * 36);
      const freq2 = Math.sin((x / cssW) * Math.PI * 20 + wt * 1.3) * (6 + bin * 20);
      const freq3 = Math.sin((x / cssW) * Math.PI * 3 + wt * 0.7) * (22 + energy * 34);
      const y = cssH / 2 + (freq1 + freq2 + freq3) * (0.72 + bin * 0.5);
      x === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
    }
    ctx2.stroke();
    wt += 0.018 + energy * 0.035;
    requestAnimationFrame(drawWave);
  }
  drawWave();
}

// --- SECTION SPECTROGRAM WATERFALLS ---

function getSpectrogramColor(level) {
  const light = document.body.classList.contains('light-mode');
  const stops = light
    ? [
      [0, [244, 241, 231]],
      [0.28, [143, 151, 121]],
      [0.55, [0, 127, 131]],
      [0.78, [79, 141, 95]],
      [1, [156, 122, 36]]
    ]
    : [
      [0, [9, 12, 8]],
      [0.25, [29, 36, 26]],
      [0.5, [0, 215, 215]],
      [0.76, [57, 255, 138]],
      [1, [198, 177, 119]]
    ];

  let left = stops[0];
  let right = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (level >= stops[i][0] && level <= stops[i + 1][0]) {
      left = stops[i];
      right = stops[i + 1];
      break;
    }
  }

  const range = Math.max(right[0] - left[0], 0.001);
  const t = Math.max(0, Math.min(1, (level - left[0]) / range));
  const rgb = left[1].map((channel, i) => Math.round(channel + (right[1][i] - channel) * t));
  const alpha = light ? 0.18 + level * 0.54 : 0.22 + level * 0.62;
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha.toFixed(3) + ')';
}

function initSectionSpectrograms() {
  const canvases = Array.from(document.querySelectorAll('.section-spectrogram'));
  if (!canvases.length || reduceMotion) return;

  const seed = 4.2;
  const targets = canvases.map(canvas => ({
    canvas,
    ctx: canvas.getContext('2d', { alpha: true }),
    container: canvas.parentElement,
    active: true,
    cssWidth: 0,
    cssHeight: 0,
    dpr: 1
  }));

  function readBandLevel(index, total, x, nowMs) {
    if (frequencyData && isPlaying) {
      const dataIndex = Math.floor((1 - index / Math.max(total - 1, 1)) * (frequencyData.length - 1));
      return frequencyData[dataIndex] / 255;
    }

    const bassBias = 1 - index / Math.max(total - 1, 1);
    const drift = nowMs * 0.001;
    const waveA = Math.sin(x * 0.010 + drift * 1.6 + index * 0.34 + seed) * 0.5 + 0.5;
    const waveB = Math.sin(x * 0.024 - drift * 0.95 - index * 0.19 + seed * 1.7) * 0.5 + 0.5;
    const ridge = Math.sin(x * 0.006 + index * 0.11 + drift * 2.1 + seed * 0.4) * 0.5 + 0.5;
    const energy = Math.max(currentAudioEnergy, 0.16);
    return Math.max(0, Math.min(1, 0.08 + waveA * 0.28 + waveB * 0.18 + ridge * 0.18 + bassBias * energy * 0.42));
  }

  function resizeSpectrogram(target) {
    target.dpr = getCanvasDpr();
    target.cssWidth = Math.max(1, target.container.clientWidth);
    target.cssHeight = Math.max(1, target.container.clientHeight);
    target.canvas.width = Math.floor(target.cssWidth * target.dpr);
    target.canvas.height = Math.floor(target.cssHeight * target.dpr);
    target.ctx.setTransform(target.dpr, 0, 0, target.dpr, 0, 0);
    target.ctx.imageSmoothingEnabled = true;
  }

  function drawBand(target, band, bands, nowMs, energy) {
    const ctx = target.ctx;
    const w = target.cssWidth;
    const h = target.cssHeight;
    const bandGap = h / bands;
    const yBase = bandGap * (band + 0.5);
    const xStep = Math.max(8, Math.min(18, w / 42));
    const flow = nowMs * (0.030 + band * 0.0018);
    const thickness = bandGap * (0.54 + energy * 0.32);
    const amp = Math.min(44, Math.max(10, bandGap * 0.48 + energy * 34));
    const top = [];
    const bottom = [];

    for (let x = 0; x <= w + xStep; x += xStep) {
      const phaseX = x + flow;
      const level = readBandLevel(band, bands, phaseX, nowMs);
      const smooth =
        Math.sin(phaseX * 0.012 + band * 0.67 + seed) * 0.58 +
        Math.sin(phaseX * 0.026 - band * 0.31 + seed * 1.9) * 0.28 +
        Math.sin(phaseX * 0.006 + nowMs * 0.00042 + band) * 0.22;
      const lift = (level - 0.5) * amp;
      const y = yBase + smooth * amp * 0.36 + lift;
      const half = thickness * (0.34 + level * 0.48);
      top.push([x, y - half]);
      bottom.push([x, y + half]);
    }

    const centerLevel = readBandLevel(band, bands, flow + w * 0.45, nowMs);
    const grad = ctx.createLinearGradient(0, yBase - bandGap, 0, yBase + bandGap);
    grad.addColorStop(0, getSpectrogramColor(Math.max(0, centerLevel - 0.22)));
    grad.addColorStop(0.48, getSpectrogramColor(Math.min(1, centerLevel + 0.18)));
    grad.addColorStop(1, getSpectrogramColor(Math.max(0, centerLevel - 0.26)));

    ctx.beginPath();
    top.forEach((point, index) => {
      index === 0 ? ctx.moveTo(point[0], point[1]) : ctx.lineTo(point[0], point[1]);
    });
    for (let i = bottom.length - 1; i >= 0; i--) {
      ctx.lineTo(bottom[i][0], bottom[i][1]);
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    top.forEach((point, index) => {
      const y = (point[1] + bottom[index][1]) * 0.5;
      index === 0 ? ctx.moveTo(point[0], y) : ctx.lineTo(point[0], y);
    });
    ctx.strokeStyle = getSpectrogramColor(Math.min(1, centerLevel + 0.26));
    ctx.lineWidth = 0.55 + energy * 1.1;
    ctx.globalAlpha = 0.34;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawTarget(target, nowMs, energy) {
    const ctx = target.ctx;
    const w = target.cssWidth;
    const h = target.cssHeight;
    const light = document.body.classList.contains('light-mode');
    const bands = Math.max(16, Math.min(34, Math.floor(h / 34)));

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = light ? 'multiply' : 'screen';

    for (let i = 0; i < bands; i++) {
      drawBand(target, i, bands, nowMs, energy);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  let lastDrawTime = 0;
  function draw(nowMs) {
    const minFrameMs = isMobilePerf() ? 50 : 0;
    if (nowMs - lastDrawTime < minFrameMs) {
      requestAnimationFrame(draw);
      return;
    }
    lastDrawTime = nowMs;
    const energy = Math.max(currentAudioEnergy, 0.16);

    targets.forEach(target => {
      if (!target.active || target.cssWidth <= 1 || target.cssHeight <= 1) return;
      drawTarget(target, nowMs, energy);
    });

    requestAnimationFrame(draw);
  }

  targets.forEach(target => resizeSpectrogram(target));

  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const target = targets.find(item => item.container === entry.target);
        if (target) resizeSpectrogram(target);
      });
    });
    targets.forEach(target => resizeObserver.observe(target.container));
  } else {
    window.addEventListener('resize', () => {
      targets.forEach(target => resizeSpectrogram(target));
    }, { passive: true });
  }

  if (window.IntersectionObserver) {
    const visibilityObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const target = targets.find(item => item.container === entry.target);
        if (target) target.active = entry.isIntersecting;
      });
    }, { rootMargin: '160px 0px' });
    targets.forEach(target => visibilityObserver.observe(target.container));
  }

  requestAnimationFrame(draw);
}

initSectionSpectrograms();

// --- LIGHT SECTION AMBIENCE ---

function getAmbientPalette() {
  const light = document.body.classList.contains('light-mode');
  if (light) {
    return {
      cyan: 'rgba(0,127,131,',
      green: 'rgba(79,141,95,',
      amber: 'rgba(156,122,36,',
      purple: 'rgba(109,95,127,',
      text: 'rgba(24,32,21,'
    };
  }

  return {
    cyan: 'rgba(0,215,215,',
    green: 'rgba(57,255,138,',
    amber: 'rgba(198,177,119,',
    purple: 'rgba(139,130,150,',
    text: 'rgba(224,224,240,'
  };
}

function ambientRgba(base, alpha) {
  return base + alpha.toFixed(3) + ')';
}

function seededNoise(index, seed) {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function initSectionAmbience() {
  const canvases = Array.from(document.querySelectorAll('.section-ambient'));
  if (!canvases.length || reduceMotion) return;

  const targets = canvases.map((canvas, index) => ({
    canvas,
    ctx: canvas.getContext('2d', { alpha: true }),
    container: canvas.parentElement,
    type: canvas.dataset.ambient || 'mixer',
    seed: 7.5 + index * 23.1,
    active: true,
    cssWidth: 0,
    cssHeight: 0,
    dpr: 1,
    nodes: []
  }));

  function rebuildNodes(target) {
    const count = Math.max(20, Math.min(58, Math.floor(target.cssWidth / 24)));
    target.nodes = Array.from({ length: count }, (_, i) => ({
      x: seededNoise(i * 2, target.seed) * target.cssWidth,
      y: seededNoise(i * 2 + 1, target.seed) * target.cssHeight,
      size: 1.2 + seededNoise(i * 3 + 2, target.seed) * 2.8,
      phase: seededNoise(i * 5 + 3, target.seed) * Math.PI * 2,
      speed: 0.25 + seededNoise(i * 7 + 4, target.seed) * 0.75
    }));
  }

  function resizeAmbient(target) {
    target.dpr = getCanvasDpr();
    target.cssWidth = Math.max(1, target.container.clientWidth);
    target.cssHeight = Math.max(1, target.container.clientHeight);
    target.canvas.width = Math.floor(target.cssWidth * target.dpr);
    target.canvas.height = Math.floor(target.cssHeight * target.dpr);
    target.ctx.setTransform(target.dpr, 0, 0, target.dpr, 0, 0);
    target.ctx.imageSmoothingEnabled = true;
    rebuildNodes(target);
  }

  function drawMidiBlocks(target, nowMs, energy, palette) {
    const ctx = target.ctx;
    const w = target.cssWidth;
    const h = target.cssHeight;
    const rows = Math.max(3, Math.min(5, Math.floor(h / 130)));
    const lanes = Math.max(4, Math.min(8, Math.floor(w / 185)));
    const t = nowMs * 0.00018;

    for (let row = 0; row < rows; row++) {
      const y = ((row + 0.55) / rows) * h;
      for (let col = 0; col < lanes; col++) {
        const noise = seededNoise(row * 47 + col * 13, target.seed);
        const drift = Math.sin(t * 9 + row * 0.8 + noise * 4) * 18;
        const x = ((col + noise * 0.55) / lanes) * w + drift;
        const blockW = 46 + noise * 120;
        const blockH = 10 + noise * 18;
        const pulse = Math.sin(nowMs * 0.0011 + col * 0.7 + row) * 0.5 + 0.5;
        const color = [palette.cyan, palette.green, palette.amber, palette.purple][(row + col) % 4];

        ctx.fillStyle = ambientRgba(color, 0.22 + pulse * 0.18 + energy * 0.12);
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, blockW, blockH, 3);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, blockW, blockH);
        }
      }
    }
  }

  function drawConstellation(target, nowMs, energy, palette) {
    const ctx = target.ctx;
    const time = nowMs * 0.00045;
    const points = target.nodes.map((node, i) => ({
      x: node.x + Math.sin(time * node.speed + node.phase) * 24,
      y: node.y + Math.cos(time * node.speed * 0.9 + node.phase + i) * 18,
      size: node.size
    }));

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const reach = 86 + energy * 42;
        if (dist < reach) {
          ctx.strokeStyle = ambientRgba(palette.cyan, (1 - dist / reach) * 0.48);
          ctx.lineWidth = 1.7;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }

    points.forEach((point, i) => {
      const color = i % 3 === 0 ? palette.green : i % 3 === 1 ? palette.cyan : palette.amber;
      ctx.fillStyle = ambientRgba(color, 0.42 + energy * 0.18);
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawContactRings(target, nowMs, energy, palette) {
    const ctx = target.ctx;
    const w = target.cssWidth;
    const h = target.cssHeight;
    const cx = w * 0.76;
    const cy = h * 0.44;
    const time = nowMs * 0.00055;
    const maxRadius = Math.max(w, h) * 0.58;

    for (let i = 0; i < 8; i++) {
      const radius = (maxRadius * (i + 1)) / 9 + Math.sin(time * 2 + i) * 8;
      const start = time * (0.7 + i * 0.08) + i * 0.6;
      const arc = Math.PI * (0.72 + Math.sin(time + i) * 0.18);
      ctx.strokeStyle = ambientRgba(i % 2 ? palette.cyan : palette.green, 0.30 + energy * 0.18);
      ctx.lineWidth = 2.3 + energy * 2.4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + arc);
      ctx.stroke();
    }

    target.nodes.slice(0, 20).forEach((node, i) => {
      const angle = time * (0.9 + node.speed * 0.25) + node.phase;
      const radius = 44 + seededNoise(i, target.seed) * Math.min(w, h) * 0.42;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle * 0.82) * radius * 0.58;
      ctx.fillStyle = ambientRgba(i % 2 ? palette.amber : palette.cyan, 0.42);
      ctx.beginPath();
      ctx.arc(x, y, node.size * 0.85, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawReleaseOrbit(target, nowMs, energy, palette) {
    const ctx = target.ctx;
    const w = target.cssWidth;
    const h = target.cssHeight;
    const cx = w * 0.5;
    const cy = h * 0.52;
    const time = nowMs * 0.00055;
    const baseRadius = Math.min(w, h) * 0.44;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.18 + Math.sin(time * 0.7) * 0.05);
    for (let i = 0; i < 10; i++) {
      const radius = baseRadius * (0.26 + i * 0.078) + Math.sin(time * 1.6 + i) * 5;
      const start = time * (0.55 + i * 0.03) + i * 0.52;
      const arc = Math.PI * (0.86 + Math.sin(time + i * 0.8) * 0.2);
      const color = i % 3 === 0 ? palette.cyan : i % 3 === 1 ? palette.amber : palette.green;
      ctx.strokeStyle = ambientRgba(color, 0.18 + energy * 0.12);
      ctx.lineWidth = 1.4 + energy * 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.34, radius * 0.43, 0, start, start + arc);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < 7; i++) {
      const x = ((i + 0.5) / 7) * w + Math.sin(time * 1.2 + i) * 20;
      const y1 = h * 0.18 + Math.cos(time + i) * 12;
      const y2 = h * 0.86 + Math.sin(time * 0.9 + i) * 14;
      ctx.strokeStyle = ambientRgba(i % 2 ? palette.cyan : palette.purple, 0.10 + energy * 0.08);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 34, y1);
      ctx.lineTo(x + 34, y2);
      ctx.stroke();
    }

    target.nodes.slice(0, 28).forEach((node, i) => {
      const angle = node.phase + time * (0.82 + node.speed * 0.28);
      const radius = Math.min(w, h) * (0.14 + seededNoise(i + 11, target.seed) * 0.46);
      const x = cx + Math.cos(angle) * radius * 1.48;
      const y = cy + Math.sin(angle * 0.82) * radius * 0.58;
      const size = 3 + node.size * 1.5 + energy * 3;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 4);
      ctx.fillStyle = ambientRgba(i % 3 === 0 ? palette.amber : palette.cyan, 0.30 + energy * 0.12);
      ctx.fillRect(-size * 0.5, -size * 0.5, size, size);
      ctx.restore();
    });
  }

  function drawAmbientTarget(target, nowMs, energy) {
    const ctx = target.ctx;
    const palette = getAmbientPalette();
    const light = document.body.classList.contains('light-mode');

    ctx.clearRect(0, 0, target.cssWidth, target.cssHeight);
    ctx.globalCompositeOperation = light ? 'multiply' : 'screen';

    if (target.type === 'constellation') {
      drawConstellation(target, nowMs, energy, palette);
    } else if (target.type === 'rings') {
      drawContactRings(target, nowMs, energy, palette);
    } else if (target.type === 'release') {
      drawReleaseOrbit(target, nowMs, energy, palette);
    } else {
      drawMidiBlocks(target, nowMs, energy, palette);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  let lastDrawTime = 0;
  function draw(nowMs) {
    const minFrameMs = isMobilePerf() ? 66 : 0;
    if (nowMs - lastDrawTime < minFrameMs) {
      requestAnimationFrame(draw);
      return;
    }
    lastDrawTime = nowMs;
    const energy = Math.max(currentAudioEnergy, 0.12);
    targets.forEach(target => {
      if (target.active) drawAmbientTarget(target, nowMs, energy);
    });
    requestAnimationFrame(draw);
  }

  targets.forEach(target => resizeAmbient(target));

  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const target = targets.find(item => item.container === entry.target);
        if (target) resizeAmbient(target);
      });
    });
    targets.forEach(target => resizeObserver.observe(target.container));
  } else {
    window.addEventListener('resize', () => {
      targets.forEach(target => resizeAmbient(target));
    }, { passive: true });
  }

  if (window.IntersectionObserver) {
    const visibilityObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const target = targets.find(item => item.container === entry.target);
        if (target) target.active = entry.isIntersecting;
      });
    }, { rootMargin: '160px 0px' });
    targets.forEach(target => visibilityObserver.observe(target.container));
  }

  requestAnimationFrame(draw);
}

initSectionAmbience();

// --- FOOTER CLOCK (static init) ---

const now = new Date();
const fmt = n => String(n).padStart(2, '0');
const footerTime = document.getElementById('footer-time');
if (footerTime) {
  footerTime.textContent =
    fmt(now.getHours()) + ':' + fmt(now.getMinutes()) + ':' + fmt(now.getSeconds());
}

document.addEventListener('DOMContentLoaded', startAutoplay);
window.addEventListener('load', startAutoplay);
syncThemeToggle();
