// =============================================
//  AMMAR.DAW — Portfolio Script
// =============================================

// --- AUDIO PLAYER STATE ---
const tracks = [
  { title: "MOVE - Ammar", src: "music/Ladudi-ProdAmmar.wav" },
  { title: " MAKE WAY - Ammar", src: "music/Way-ProdAmmar.mp3" },
  { title: "ANYMORE - Ammar", src: "music/ANYMORE-ProdAmmar.mp3" }
];
let currentTrack = 0;
let audio = null;
let isPlaying = false;
let clockInterval = null;
let timeStart = null;
let elapsed = 0;
let autoplayUnlockListening = false;
let autoplayUnlockTrying = false;
let audioCtx = null;
let audioSourceNode = null;
let analyser = null;
let frequencyData = null;
let currentAudioEnergy = 0;

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
  document.getElementById('mini-prog-fill').style.width = '0%';
  document.getElementById('time-display').textContent = '00:00:00';
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
  initAudio();
  if (wasPlaying) { audio.play(); startClock(); }
}

function prevTrack() {
  currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
  const wasPlaying = isPlaying;
  initAudio();
  if (wasPlaying) { audio.play(); startClock(); }
}

function setVolume(v) {
  if (audio) audio.volume = v / 100;
}

function updateProgress() {
  if (!audio || !audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  document.getElementById('mini-prog-fill').style.width = pct + '%';
}

function seekFromBar(e, bar) {
  if (!audio || !audio.duration) return;
  const rect = bar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
}

// --- CLOCK ---

function startClock() {
  if (clockInterval) clearInterval(clockInterval);
  timeStart = Date.now() - elapsed * 1000;
  clockInterval = setInterval(() => {
    elapsed = (Date.now() - timeStart) / 1000;
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = Math.floor(elapsed % 60);
    const fmt = n => String(n).padStart(2, '0');
    const timeStr = fmt(h) + ':' + fmt(m) + ':' + fmt(s);
    document.getElementById('time-display').textContent = timeStr;
    const footerTime = document.getElementById('footer-time');
    if (footerTime) footerTime.textContent = timeStr;
  }, 500);
}

function stopClock() {
  if (clockInterval) clearInterval(clockInterval);
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
  '.section-header, .about-panel, .channel-strip, .track-lane, .preset-card, .sample-card, .export-panel'
);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealGroups = new Map();

revealItems.forEach(el => {
  el.classList.add('reveal-on-scroll');
  if (el.matches('.track-lane, .channel-strip, .preset-card, .sample-card')) {
    const group = el.closest('.arrangement-view, .mixer-rack, .preset-rack, .sb-content');
    const groupIndex = revealGroups.get(group) || 0;
    revealGroups.set(group, groupIndex + 1);
    el.style.transitionDelay = Math.min(groupIndex * 0.12, 0.48) + 's';
  }
});

if (reduceMotion) {
  revealItems.forEach(el => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  revealItems.forEach(el => revealObserver.observe(el));
}

const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
const navSections = Array.from(navLinks)
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function setActiveNav(id) {
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
  });
  navSections.forEach(section => {
    section.classList.toggle('section-active', section.id === id);
  });
}

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setActiveNav(entry.target.id);
    }
  });
}, { threshold: 0.2, rootMargin: '-38% 0px -52% 0px' });

navSections.forEach(section => navObserver.observe(section));

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
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth;
    h = hero.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCount = Math.min(70, Math.max(32, Math.floor(w / 22)));
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
    for (let x = 0; x <= w; x += 8) {
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

  function drawHeroSimulation(nowMs) {
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
  function drawWave() {
    wc.width = wc.offsetWidth;
    wc.height = wc.offsetHeight;
    ctx2.clearRect(0, 0, wc.width, wc.height);
    const energy = Math.max(currentAudioEnergy, 0.16);
    ctx2.strokeStyle = getVisualPalette().waveform(energy);
    ctx2.lineWidth = 1.2 + energy * 2.2;
    ctx2.beginPath();
    for (let x = 0; x < wc.width; x++) {
      const bin = frequencyData ? frequencyData[Math.floor((x / wc.width) * frequencyData.length)] / 255 : 0.35;
      const freq1 = Math.sin((x / wc.width) * Math.PI * 8 + wt) * (14 + energy * 36);
      const freq2 = Math.sin((x / wc.width) * Math.PI * 20 + wt * 1.3) * (6 + bin * 20);
      const freq3 = Math.sin((x / wc.width) * Math.PI * 3 + wt * 0.7) * (22 + energy * 34);
      const y = wc.height / 2 + (freq1 + freq2 + freq3) * (0.72 + bin * 0.5);
      x === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
    }
    ctx2.stroke();
    wt += 0.018 + energy * 0.035;
    requestAnimationFrame(drawWave);
  }
  drawWave();
}

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
