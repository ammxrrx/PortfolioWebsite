// =============================================
//  AMMAR.DAW — Portfolio Script
// =============================================

// --- AUDIO PLAYER STATE ---
const tracks = [
  { title: "track1.mp3", src: "/music/track1.mp3" },
  { title: "track2.wav", src: "/music/track2.wav" }
];
let currentTrack = 0;
let audio = null;
let isPlaying = false;
let clockInterval = null;
let timeStart = null;
let elapsed = 0;

// --- AUDIO FUNCTIONS ---

function initAudio() {
  if (!audio) {
    audio = new Audio();
    audio.volume = 0.7;
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('error', () => {
      document.getElementById('now-playing').textContent =
        '⚠ Add your MP3/WAV files to /music/ to enable playback';
    });
  }
  audio.src = tracks[currentTrack].src;
  document.getElementById('now-playing').textContent = '▷ ' + tracks[currentTrack].title;
}

function loadAudio() {
  initAudio();
  const p = audio.play();
  if (p !== undefined) {
    p.then(() => {
      isPlaying = true;
      startClock();
      document.getElementById('eq-mini').style.display = 'flex';
      document.getElementById('audio-msg').style.display = 'none';
    }).catch(() => {
      document.getElementById('audio-msg').style.display = 'block';
    });
  }
}

function togglePlay(btn) {
  if (!audio) { loadAudio(); return; }
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    btn.textContent = '▶';
    btn.classList.remove('active');
    stopClock();
    document.getElementById('eq-mini').style.display = 'none';
  } else {
    audio.play();
    isPlaying = true;
    btn.textContent = '⏸';
    btn.classList.add('active');
    startClock();
    document.getElementById('eq-mini').style.display = 'flex';
  }
}

function stopPlayer() {
  if (audio) { audio.pause(); audio.currentTime = 0; }
  isPlaying = false;
  const pb = document.getElementById('btn-play');
  pb.textContent = '▶';
  pb.classList.remove('active');
  stopClock();
  document.getElementById('eq-mini').style.display = 'none';
  document.getElementById('mini-prog-fill').style.width = '0%';
  document.getElementById('time-display').textContent = '00:00:00';
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
    document.getElementById('footer-time').textContent = timeStr;
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

function sendForm() {
  document.getElementById('contact-form').style.display = 'none';
  document.getElementById('send-success').style.display = 'block';
  setTimeout(() => {
    document.getElementById('contact-form').style.display = 'flex';
    document.getElementById('send-success').style.display = 'none';
  }, 3000);
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

// --- WAVEFORM CANVAS ---

const wc = document.getElementById('waveform-canvas');
if (wc) {
  const ctx2 = wc.getContext('2d');
  let wt = 0;
  function drawWave() {
    wc.width = wc.offsetWidth;
    wc.height = wc.offsetHeight;
    ctx2.clearRect(0, 0, wc.width, wc.height);
    ctx2.strokeStyle = 'rgba(0,229,255,0.6)';
    ctx2.lineWidth = 1.5;
    ctx2.beginPath();
    for (let x = 0; x < wc.width; x++) {
      const freq1 = Math.sin((x / wc.width) * Math.PI * 8 + wt) * 18;
      const freq2 = Math.sin((x / wc.width) * Math.PI * 20 + wt * 1.3) * 8;
      const freq3 = Math.sin((x / wc.width) * Math.PI * 3 + wt * 0.7) * 30;
      const y = wc.height / 2 + freq1 + freq2 + freq3;
      x === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
    }
    ctx2.stroke();
    wt += 0.02;
    requestAnimationFrame(drawWave);
  }
  drawWave();
}

// --- FOOTER CLOCK (static init) ---

const now = new Date();
const fmt = n => String(n).padStart(2, '0');
document.getElementById('footer-time').textContent =
  fmt(now.getHours()) + ':' + fmt(now.getMinutes()) + ':' + fmt(now.getSeconds());
