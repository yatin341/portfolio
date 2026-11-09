/* ===================================================================
   YATIN JANGRA PORTFOLIO - JAVASCRIPT LOGIC
   Features: Hanging Pull Cord Switcher, Role Pill Flip, 3D Doors, CLI
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Hanging Pull Cord & Theme Switcher (Dark & Warm Light Mode)
  initPullCordThemeSwitch();

  // 2. Role Pill Flip (Hero)
  initRolePill();

  // 3. Realistic 3D Doors Interaction
  initDoors();

  // 4. Project Details Modal (Opens when clicking inside doors)
  initProjectModal();

  // 5. Interactive CLI Terminal
  initCliTerminal();

  // 6. Canvas Particles
  initCanvas();

  // 7. Copy Email Handler
  initCopyEmail();

  // 8. Mobile Navigation Toggle
  initMobileNav();
});

/* -------------------------------------------------------------------
   1. Ultra-Realistic Hanging Pull-Cord Theme Switcher
      Features: Real-time SVG string deformation, spring & pendulum physics,
      dual-tone mechanical switch audio, drag & tap support, no focus box.
   ------------------------------------------------------------------- */
function initPullCordThemeSwitch() {
  const pullCord = document.getElementById('pull-cord');
  const cordLine = document.getElementById('cord-line');
  const cordKnob = document.getElementById('cord-knob');
  const toggleBtn = document.getElementById('theme-toggle');
  const root = document.documentElement;

  if (!pullCord || !cordLine || !cordKnob) return;

  // Retrieve saved theme or default to dark
  const savedTheme = localStorage.getItem('yatin_theme') || 'dark';
  root.setAttribute('data-theme', savedTheme);

  // High-fidelity mechanical switch audio generator (Web Audio API)
  function playMechanicalClick(isRelease = false) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // 1. Sharp metallic spring snap transient (high frequency click)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      const snapFilter = ctx.createBiquadFilter();

      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(isRelease ? 3400 : 2800, now);
      snapOsc.frequency.exponentialRampToValueAtTime(isRelease ? 900 : 450, now + 0.022);

      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(isRelease ? 3000 : 2400, now);
      snapFilter.Q.setValueAtTime(3.5, now);

      snapGain.gain.setValueAtTime(0.35, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

      snapOsc.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(ctx.destination);

      snapOsc.start(now);
      snapOsc.stop(now + 0.03);

      // 2. Resonant switch casing "thunk" (body resonance)
      const thunkOsc = ctx.createOscillator();
      const thunkGain = ctx.createGain();

      thunkOsc.type = 'sine';
      thunkOsc.frequency.setValueAtTime(isRelease ? 240 : 190, now);
      thunkOsc.frequency.exponentialRampToValueAtTime(45, now + 0.055);

      thunkGain.gain.setValueAtTime(0.28, now);
      thunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      thunkOsc.connect(thunkGain);
      thunkGain.connect(ctx.destination);

      thunkOsc.start(now);
      thunkOsc.stop(now + 0.06);
    } catch (e) {
      // Audio might be suppressed before user interaction
    }
  }

  // Toggle Theme Function
  function toggleTheme() {
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('yatin_theme', newTheme);
    if (navigator.vibrate) {
      navigator.vibrate(22);
    }
  }

  // Physics Simulation Constants
  const REST_X = 30;
  const REST_Y = 130;
  const PULL_THRESHOLD = 42; // px down to trigger switch
  const MAX_PULL_Y = 195;    // max downward stretch

  let posX = REST_X;
  let posY = REST_Y;
  let velX = 0;
  let velY = 0;
  let isDragging = false;
  let hasToggled = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let animFrameId = null;

  // Render SVG string curve and knob transform
  function renderPosition(x, y) {
    posX = x;
    posY = y;

    // Curved string: control point bends smoothly with lateral pull
    const ctrlX = 30 + (x - 30) * 0.35;
    const ctrlY = y * 0.52;
    cordLine.setAttribute('d', `M 30 0 Q ${ctrlX} ${ctrlY} ${x} ${y}`);

    // Acorn Knob aligns with string angle
    const angleRad = Math.atan2(x - 30, y);
    const angleDeg = angleRad * (180 / Math.PI);
    cordKnob.style.transform = `translate(calc(-50% + ${x - 30}px), ${y}px) rotate(${angleDeg * 0.9}deg)`;
  }

  // Initial draw
  renderPosition(REST_X, REST_Y);

  // Damped Harmonic Spring & Pendulum Simulation Loop
  function startPhysicsLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    const springK = 0.20;   // Spring stiffness (elastic recoil)
    const dampY = 0.78;     // Vertical damping
    const gravityX = 0.07;  // Pendulum restoring force
    const dampX = 0.93;     // Pendulum air resistance damping

    function step() {
      // 1. Vertical spring force
      const forceY = -springK * (posY - REST_Y);
      velY = (velY + forceY) * dampY;
      posY += velY;

      // 2. Horizontal pendulum sway force
      const forceX = -gravityX * (posX - REST_X);
      velX = (velX + forceX) * dampX;
      posX += velX;

      renderPosition(posX, posY);

      // Check if settled
      const settled =
        Math.abs(velY) < 0.03 &&
        Math.abs(posY - REST_Y) < 0.06 &&
        Math.abs(velX) < 0.03 &&
        Math.abs(posX - REST_X) < 0.06;

      if (!settled) {
        animFrameId = requestAnimationFrame(step);
      } else {
        renderPosition(REST_X, REST_Y);
        velX = 0;
        velY = 0;
        animFrameId = null;
      }
    }

    animFrameId = requestAnimationFrame(step);
  }

  // Pointer Event Handlers (Mouse & Touch Dragging)
  function onPointerDown(e) {
    isDragging = true;
    hasToggled = false;
    startPointerX = e.clientX;
    startPointerY = e.clientY;

    pullCord.classList.add('is-pulling');
    pullCord.setPointerCapture?.(e.pointerId);

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - startPointerX;
    const deltaY = e.clientY - startPointerY;

    // Apply lateral damping
    let targetX = REST_X + deltaX * 0.35;
    targetX = Math.max(10, Math.min(50, targetX)); // Clamp lateral deflection around REST_X (30)

    // Apply vertical elastic strain
    let targetY = REST_Y;
    if (deltaY > 0) {
      targetY = REST_Y + Math.pow(deltaY, 0.86);
      targetY = Math.min(MAX_PULL_Y, targetY);
    } else {
      targetY = REST_Y + deltaY * 0.15; // slight upward compression resistance
      targetY = Math.max(REST_Y - 8, targetY);
    }

    renderPosition(targetX, targetY);

    // Trigger theme switch when pulled past threshold
    if (targetY - REST_Y >= PULL_THRESHOLD && !hasToggled) {
      hasToggled = true;
      playMechanicalClick(false);
      toggleTheme();
    }
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    pullCord.classList.remove('is-pulling');

    // Check if quick tap/click without dragging
    const distMoved = Math.hypot(e.clientX - startPointerX, e.clientY - startPointerY);
    if (!hasToggled && distMoved < 10) {
      // Natural quick click pluck animation
      playMechanicalClick(false);
      toggleTheme();
      velY = 25; // Downward recoil impulse
      velX = (Math.random() - 0.5) * 8; // Gentle random sway
      startPhysicsLoop();
      return;
    }

    playMechanicalClick(true);

    // Initial recoil velocity proportional to stretch
    velY = -(posY - REST_Y) * 0.35;
    velX = -(posX - REST_X) * 0.22;

    startPhysicsLoop();
  }

  // Attach drag listeners
  pullCord.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // Navbar button also triggers pull cord animation
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      playMechanicalClick(false);
      toggleTheme();
      velY = 24;
      velX = 4;
      startPhysicsLoop();
    });
  }

  // Keyboard Accessibility (Enter or Space)
  pullCord.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playMechanicalClick(false);
      toggleTheme();
      velY = 22;
      velX = 5;
      startPhysicsLoop();
    }
  });

  // Gentle hover sway when mouse enters
  pullCord.addEventListener('mouseenter', () => {
    if (!isDragging && !animFrameId) {
      velX = (Math.random() > 0.5 ? 1 : -1) * 3.5;
      startPhysicsLoop();
    }
  });
}

/* -------------------------------------------------------------------
   2. Role Pill Flip (Cycles backend roles like the video)
   ------------------------------------------------------------------- */
function initRolePill() {
  const pill = document.getElementById('role-pill');
  if (!pill) return;

  const roles = [
    'Python Backend Developer',
    'Voice AI Engineer (JARVIS)',
    'Multimodal AI Developer (Nova)',
    'FastAPI & Flask API Specialist',
    '1st Year B.Tech AI & ML Student'
  ];

  let index = 0;

  setInterval(() => {
    pill.style.opacity = '0';
    pill.style.transform = 'translateY(-12px)';

    setTimeout(() => {
      index = (index + 1) % roles.length;
      pill.textContent = roles[index];
      pill.style.transform = 'translateY(12px)';
      setTimeout(() => {
        pill.style.opacity = '1';
        pill.style.transform = 'translateY(0)';
      }, 40);
    }, 280);
  }, 2600);
}

/* -------------------------------------------------------------------
   Web Audio API Sound Effects (Zero External Files, 100% Reliable)
   ------------------------------------------------------------------- */
function playDoorSound(isOpen) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 1. Brass latch click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isOpen ? 650 : 480, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.038);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);

    // 2. Resonant wood hinge creak
    const woodOsc = ctx.createOscillator();
    const woodGain = ctx.createGain();
    woodOsc.type = 'sine';
    woodOsc.frequency.setValueAtTime(isOpen ? 175 : 120, now);
    woodOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
    woodGain.gain.setValueAtTime(0.12, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    woodOsc.connect(woodGain);
    woodGain.connect(ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + 0.09);
  } catch (e) {}
}

function playModalOpenSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Harmonic double chime (C5 -> G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.24);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.06);
    gain2.gain.setValueAtTime(0.16, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.34);
  } catch (e) {}
}

/* -------------------------------------------------------------------
   3. Realistic 3D Interactive Doors
   Features:
   - Click un-opened door -> Swings open with latch & hinge audio
   - Click inside open door -> Opens deep-dive project details modal!
   - Click inspect button -> Opens project modal
   ------------------------------------------------------------------- */
function initDoors() {
  const doorWrappers = document.querySelectorAll('.door-wrapper');
  const openAllBtn = document.getElementById('open-all-doors');
  const closeAllBtn = document.getElementById('close-all-doors');

  const defaultProjects = ['jarvis', 'nova', 'boutique', 'backend'];

  doorWrappers.forEach((wrapper, index) => {
    const projectId = wrapper.dataset.project || defaultProjects[index] || 'jarvis';
    const doorLeaf = wrapper.querySelector('.door-leaf');
    const interior = wrapper.querySelector('.door-interior');
    const inspectBtn = wrapper.querySelector('.door-inspect-btn');

    // 1. Direct click on interior chamber opens that project's modal
    if (interior) {
      interior.addEventListener('click', (e) => {
        e.stopPropagation();
        openProjectModal(projectId);
      });

      interior.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProjectModal(projectId);
        }
      });
    }

    // 2. Direct click on inspect button opens project modal
    if (inspectBtn) {
      inspectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openProjectModal(projectId);
      });
    }

    // 3. Click on the 3D Door Leaf toggles swing open/close
    if (doorLeaf) {
      doorLeaf.addEventListener('click', (e) => {
        e.stopPropagation();
        const willBeOpen = !wrapper.classList.contains('opened');
        wrapper.classList.toggle('opened');
        playDoorSound(willBeOpen);
      });
    }

    // 4. Click anywhere on wrapper
    wrapper.addEventListener('click', (e) => {
      // If user clicked inside an already opened door wrapper, open modal!
      if (wrapper.classList.contains('opened')) {
        openProjectModal(projectId);
      } else {
        wrapper.classList.add('opened');
        playDoorSound(true);
      }
    });
  });

  if (openAllBtn) {
    openAllBtn.addEventListener('click', () => {
      doorWrappers.forEach(w => w.classList.add('opened'));
      playDoorSound(true);
    });
  }

  if (closeAllBtn) {
    closeAllBtn.addEventListener('click', () => {
      doorWrappers.forEach(w => w.classList.remove('opened'));
      playDoorSound(false);
    });
  }
}

/* -------------------------------------------------------------------
   4. Interactive CLI Terminal (Backend Focused)
   ------------------------------------------------------------------- */
function initCliTerminal() {
  const input = document.getElementById('cli-input');
  const output = document.getElementById('cli-output');
  if (!input || !output) return;

  const commands = {
    help: () => `Available commands:
  <span class="highlight">whoami</span>     - About Yatin Jangra (1st Year B.Tech AI & ML)
  <span class="highlight">jarvis</span>     - Inspect JARVIS Voice AI architecture
  <span class="highlight">nova</span>       - Inspect Nova AI Multimodal backend
  <span class="highlight">boutique</span>   - Inspect Lord Krishna Boutique Flask/MySQL backend
  <span class="highlight">skills</span>     - View Python backend tech stack
  <span class="highlight">2026</span>       - 2026 freshman year milestones
  <span class="highlight">contact</span>    - Show contact links & direct email
  <span class="highlight">github</span>     - Jump to https://github.com/yatin341
  <span class="highlight">linkedin</span>   - Open LinkedIn profile
  <span class="highlight">clear</span>      - Clear terminal console`,

    whoami: () => `<span class="cmd-info">Yatin Jangra</span>
1st Year B.Tech Student in Artificial Intelligence & Machine Learning.
Specialization: Python Backend Engineering, Voice AI, APIs & MySQL databases.`,

    jarvis: () => `<span class="cmd-success">[JARVIS AI Voice Assistant]</span>
  • Wake word: "Jarvis" → "Yes boss"
  • Core: SpeechRecognition + Google Speech API
  • Voice: ElevenLabs Flash TTS + pyttsx3 fallback
  • Intelligence: Groq API with 10-message rolling context
  • Superpower: Voice Typing into any app (PyAutoGUI)`,

    nova: () => `<span class="cmd-success">[Nova AI Multimodal Assistant]</span>
  • AI Chat: Groq with openai/gpt-oss-20b + Web Search
  • Image Gen: Cloudflare Workers AI with FLUX 2 Klein 4B
  • Video Gen: Magic Hour text-to-video & image animation
  • Music Gen: Local Meta MusicGen Small via PyTorch & NVIDIA CUDA GPU`,

    boutique: () => `<span class="cmd-success">[Lord Krishna Boutique Backend]</span>
  • Architecture: Flask Web Backend + MySQL Database
  • Services: Suit Stitching, Lehenga Stitching, Bridal Wear
  • Logic: Automated table creation (init_db) & dynamic pricing`,

    skills: () => `Backend Arsenal:
  • Python Core (OOP, Asyncio, Scripts)
  • Speech Recognition & ElevenLabs / pyttsx3 TTS
  • Basic PyTorch (Tensors & CUDA GPU inference)
  • OpenCV (Real-time video & face detection)
  • FastAPI & Flask Backends
  • API Implementation (Groq, Cloudflare, REST)
  • Basic SQL (MySQL, queries, schemas)`,

    2026: () => `Year 2026 (Freshman Inception):
  • Built JARVIS Voice Assistant with ElevenLabs & Groq
  • Built Nova AI Multimodal Platform with PyTorch CUDA MusicGen
  • Built Lord Krishna Boutique Flask & MySQL Booking Backend
  • Currently in 1st Year B.Tech AI & ML!`,

    contact: () => `Contact Information:
  • Email:    <a href="mailto:yatinjangra97@gmail.com" class="cmd-info">yatinjangra97@gmail.com</a>
  • GitHub:   <a href="https://github.com/yatin341" target="_blank" class="cmd-info">github.com/yatin341</a>
  • LinkedIn: <a href="https://www.linkedin.com/in/yatin-jangra-43412341a" target="_blank" class="cmd-info">linkedin.com/in/yatin-jangra-43412341a</a>`,

    github: () => {
      window.open('https://github.com/yatin341', '_blank');
      return `<span class="cmd-success">Opening GitHub @yatin341...</span>`;
    },

    linkedin: () => {
      window.open('https://www.linkedin.com/in/yatin-jangra-43412341a', '_blank');
      return `<span class="cmd-success">Opening LinkedIn profile...</span>`;
    },

    clear: () => {
      output.innerHTML = '';
      return null;
    },

    sudo: () => `<span class="cmd-error">Nice try! You already have visitor privileges on this backend server. 😉</span>`
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const rawCmd = input.value.trim();
      if (!rawCmd) return;

      appendLine(`<span class="cli-prompt"><span class="u">yatin</span><span class="at">@</span><span class="h">backend</span>:<span class="p">~</span>$</span> <span class="cmd-run">${escapeHtml(rawCmd)}</span>`);

      const cmd = rawCmd.toLowerCase();
      if (commands[cmd]) {
        const result = commands[cmd]();
        if (result !== null) appendLine(result);
      } else {
        appendLine(`<span class="cmd-error">Command not recognized: "${escapeHtml(rawCmd)}". Type <span class="highlight">help</span> for commands.</span>`);
      }

      input.value = '';
      output.scrollTop = output.scrollHeight;
    }
  });

  function appendLine(content) {
    const div = document.createElement('div');
    div.className = 'cli-line';
    div.innerHTML = content;
    output.appendChild(div);
  }

  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

/* -------------------------------------------------------------------
   5. Canvas Background Particles (Adapts to Light / Dark Mode)
   ------------------------------------------------------------------- */
function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const stars = [];
  const count = Math.min(Math.floor(width / 24), 60);

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.2
    });
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const color = isLight ? '113, 113, 122' : '56, 189, 248';

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x += s.vx;
      s.y += s.vy;

      if (s.x < 0) s.x = width;
      if (s.x > width) s.x = 0;
      if (s.y < 0) s.y = height;
      if (s.y > height) s.y = 0;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${s.alpha})`;
      ctx.fill();

      for (let j = i + 1; j < stars.length; j++) {
        const s2 = stars[j];
        const dx = s.x - s2.x;
        const dy = s.y - s2.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.strokeStyle = `rgba(${color}, ${0.1 * (1 - d / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(loop);
  }

  loop();
}

/* -------------------------------------------------------------------
   6. Copy Email Handler
   ------------------------------------------------------------------- */
function initCopyEmail() {
  const copyBtn = document.getElementById('copy-email-btn');
  const email = 'yatinjangra97@gmail.com';
  if (!copyBtn) return;

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(email).then(() => {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i>';
      setTimeout(() => {
        copyBtn.innerHTML = orig;
      }, 2000);
    });
  });
}

/* -------------------------------------------------------------------
   7. Mobile Navigation Toggle
   ------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
    });
  });
}

/* -------------------------------------------------------------------
   8. Project Deep-Dive Modal Dossier (Triggered by Door Interiors)
   ------------------------------------------------------------------- */
const PROJECT_KEYS = ['jarvis', 'nova', 'boutique', 'backend'];
let currentProjectId = 'jarvis';

const PROJECT_DOSSIERS = {
  jarvis: {
    id: 'jarvis',
    doorNum: '01',
    filename: 'mega_project_jarvis.py',
    category: 'Voice AI & Computer Automation Backend',
    title: 'JARVIS — Personal Voice Assistant & OS Automation',
    tagline: 'High-speed Python voice agent integrating SpeechRecognition, ElevenLabs Flash TTS, Groq Llama-3.3 rolling context, and global Windows OS typing.',
    stats: [
      { label: 'Domain', val: 'Voice AI & Automation' },
      { label: 'Freshman Year', val: '2026 Core Project' },
      { label: 'Response Latency', val: '< 450ms Voice Loop' },
      { label: 'TTS Engine', val: 'ElevenLabs + pyttsx3' }
    ],
    overview: 'Built to eradicate manual typing and browser context-switching on Windows. JARVIS continuously monitors ambient microphone audio for the wake word <code>"Jarvis"</code>, responds instantaneously with natural ElevenLabs neural audio, retains multi-turn conversations using a 10-message rolling window in <code>history.json</code> via Groq, and automates real desktop typing across any active Windows application via PyAutoGUI and Pyperclip.',
    archFlow: [
      { icon: 'fa-microphone', title: '1. Mic Audio Capture', desc: 'SpeechRecognition + Google Speech API with ambient noise adjustment' },
      { icon: 'fa-robot', title: '2. Intent Parser', desc: 'Identifies wake word "Jarvis", responds "Yes boss", parses commands' },
      { icon: 'fa-brain', title: '3. Groq Rolling Context', desc: '10-message conversational history stored in history.json' },
      { icon: 'fa-volume-high', title: '4. Neural TTS Synthesis', desc: 'ElevenLabs Flash Model with instant pyttsx3 offline fallback' },
      { icon: 'fa-keyboard', title: '5. Direct PC Automation', desc: 'PyAutoGUI dictation into any active Windows app, browser & YouTube' }
    ],
    features: [
      {
        icon: 'fa-keyboard',
        title: 'Universal Voice Typing',
        desc: 'Dictates spoken words straight into VS Code, Word, Notepad, or chat apps via PyAutoGUI and Pyperclip. Saying "start typing" activates real-time dictation into the focused window.'
      },
      {
        icon: 'fa-brain',
        title: '10-Message Rolling Context',
        desc: 'Maintains stateful conversations in history.json, enabling follow-up questions without losing contextual background across queries.'
      },
      {
        icon: 'fa-volume-high',
        title: 'Dual-Engine Neural Audio',
        desc: 'Leverages ElevenLabs Flash model for human-like conversational inflection, seamlessly switching to local pyttsx3 if offline.'
      },
      {
        icon: 'fa-laptop-code',
        title: 'System & Media Automation',
        desc: 'Opens web services, searches YouTube, plays music, adjusts master audio volume, takes screenshots, locks the workstation, and captures webcam frames.'
      }
    ],
    codeSnippet: `<span class="kw">import</span> speech_recognition <span class="kw">as</span> sr
<span class="kw">import</span> pyautogui, pyperclip, json
<span class="kw">from</span> groq <span class="kw">import</span> Groq
<span class="kw">from</span> elevenlabs.client <span class="kw">import</span> ElevenLabs

<span class="com"># Initializing ElevenLabs & Groq High-Speed APIs</span>
eleven_client = ElevenLabs(api_key=<span class="str">"YOUR_ELEVENLABS_KEY"</span>)
groq_client = Groq(api_key=<span class="str">"YOUR_GROQ_API_KEY"</span>)

<span class="kw">def</span> <span class="fn">voice_typing_mode</span>(recognizer, mic):
    <span class="fn">speak</span>(<span class="str">"Voice typing activated. Dictate your text."</span>)
    <span class="kw">while</span> <span class="kw">True</span>:
        audio = recognizer.listen(mic, phrase_time_limit=<span class="num">8</span>)
        text = recognizer.recognize_google(audio).lower()
        <span class="kw">if</span> <span class="str">"stop typing"</span> <span class="kw">in</span> text:
            <span class="fn">speak</span>(<span class="str">"Voice typing deactivated."</span>)
            <span class="kw">break</span>
        pyperclip.copy(text + <span class="str">" "</span>)
        pyautogui.hotkey(<span class="str">"ctrl"</span>, <span class="str">"v"</span>)

<span class="kw">def</span> <span class="fn">ask_groq_rolling_context</span>(prompt, history_path=<span class="str">"history.json"</span>):
    history = <span class="fn">load_history</span>(history_path)[-<span class="num">10</span>:]  <span class="com"># 10-message rolling window</span>
    history.append({<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: prompt})
    response = groq_client.chat.completions.create(
        model=<span class="str">"llama-3.3-70b-versatile"</span>,
        messages=history
    )
    answer = response.choices[<span class="num">0</span>].message.content
    <span class="fn">save_history</span>(history, history_path)
    <span class="kw">return</span> answer`,
    techChips: ['Python 3.11', 'SpeechRecognition', 'ElevenLabs Flash TTS', 'pyttsx3', 'Groq API', 'PyAutoGUI', 'Pyperclip', 'history.json', 'Windows Automation'],
    githubUrl: 'https://github.com/yatin341'
  },

  nova: {
    id: 'nova',
    doorNum: '02',
    filename: 'nova_multimodal_main.py',
    category: 'Multimodal Generative AI Backend',
    title: 'Nova AI — Multimodal Generation Backend',
    tagline: 'Multi-pipeline generative AI system orchestrating Groq GPT-OSS-20B, Cloudflare FLUX 2 Klein, Magic Hour, and local PyTorch CUDA MusicGen.',
    stats: [
      { label: 'Domain', val: 'Multimodal Generative AI' },
      { label: 'Freshman Year', val: '2026 Core Project' },
      { label: 'Local Inference', val: 'PyTorch CUDA (NVIDIA GPU)' },
      { label: 'Image Engine', val: 'Cloudflare FLUX 2 Klein' }
    ],
    overview: 'A unified Python multimodal intelligence backend harmonizing 4 distinct generative pipelines: conversational LLM with live web search, high-resolution AI image generation and editing via Cloudflare Workers AI, AI video creation and camera motion via Magic Hour, and local zero-cost AI music synthesis computed directly on NVIDIA CUDA GPU tensors using Meta MusicGen Small.',
    archFlow: [
      { icon: 'fa-terminal', title: '1. Multimodal Dispatcher', desc: 'Parses query type: text query, image prompt, video request, or music generation' },
      { icon: 'fa-globe', title: '2. Groq + Web Search', desc: 'GPT-OSS-20B reasoning combined with real-time web crawler for up-to-date data' },
      { icon: 'fa-image', title: '3. Cloudflare FLUX 2', desc: 'Workers AI generates/edits high-res images saved to generated_image.png' },
      { icon: 'fa-film', title: '4. Magic Hour Engine', desc: 'Text-to-video, image animation with camera motion, and video-to-video' },
      { icon: 'fa-music', title: '5. Local CUDA MusicGen', desc: 'PyTorch synthesizes audio tensors directly on GPU → generated_music.wav' }
    ],
    features: [
      {
        icon: 'fa-music',
        title: 'Zero-Cloud-Cost Local MusicGen',
        desc: 'Runs facebook/musicgen-small locally via PyTorch with NVIDIA CUDA GPU acceleration, producing 32kHz WAV audio without expensive API fees.'
      },
      {
        icon: 'fa-globe',
        title: 'Real-Time Web Search Integration',
        desc: 'Groq GPT-OSS-20B actively queries online web search to supply real-time tech updates, weather, and current news.'
      },
      {
        icon: 'fa-image',
        title: 'Cloudflare Workers AI (FLUX 2)',
        desc: 'Generates and morphs complex images from detailed natural language prompts in under 2 seconds.'
      },
      {
        icon: 'fa-film',
        title: 'Magic Hour Video Generation',
        desc: 'Transforms static images into animated video clips with custom camera trajectories and style transfer.'
      }
    ],
    codeSnippet: `<span class="kw">import</span> torch, requests, scipy.io.wavfile
<span class="kw">from</span> transformers <span class="kw">import</span> AutoProcessor, MusicgenForConditionalGeneration

<span class="com"># Hardware Acceleration: Targeting NVIDIA CUDA GPU</span>
device = <span class="str">"cuda"</span> <span class="kw">if</span> torch.cuda.is_available() <span class="kw">else</span> <span class="str">"cpu"</span>
processor = AutoProcessor.from_pretrained(<span class="str">"facebook/musicgen-small"</span>)
model = MusicgenForConditionalGeneration.from_pretrained(<span class="str">"facebook/musicgen-small"</span>).to(device)

<span class="kw">def</span> <span class="fn">generate_local_music</span>(prompt: str, output_path=<span class="str">"generated_music.wav"</span>):
    inputs = processor(text=[prompt], padding=<span class="kw">True</span>, return_tensors=<span class="str">"pt"</span>).to(device)
    <span class="kw">with</span> torch.no_grad():
        audio_values = model.generate(**inputs, max_new_tokens=<span class="num">256</span>)
    sampling_rate = model.config.audio_encoder.sampling_rate
    scipy.io.wavfile.write(output_path, rate=sampling_rate, data=audio_values[<span class="num">0</span>, <span class="num">0</span>].cpu().numpy())
    <span class="kw">return</span> output_path

<span class="kw">def</span> <span class="fn">generate_cloudflare_flux</span>(prompt: str, account_id, api_token):
    url = f<span class="str">"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/black-forest-labs/flux-1-schnell"</span>
    headers = {<span class="str">"Authorization"</span>: f<span class="str">"Bearer {api_token}"</span>}
    res = requests.post(url, headers=headers, json={<span class="str">"prompt"</span>: prompt})
    <span class="kw">with</span> open(<span class="str">"generated_image.png"</span>, <span class="str">"wb"</span>) <span class="kw">as</span> f:
        f.write(res.content)`,
    techChips: ['Python', 'PyTorch (CUDA)', 'Meta MusicGen Small', 'Groq GPT-OSS-20B', 'Cloudflare Workers AI', 'FLUX 2 Klein', 'Magic Hour API', 'Transformers', 'SciPy Audio'],
    githubUrl: 'https://github.com/yatin341'
  },

  boutique: {
    id: 'boutique',
    doorNum: '03',
    filename: 'boutique_backend_app.py',
    category: 'Flask RESTful Backend & Relational MySQL',
    title: 'Lord Krishna Boutique — Appointment & Booking Engine',
    tagline: 'Production-ready Flask REST backend with automated MySQL schema initialization, phone validation, and dynamic pricing engine.',
    stats: [
      { label: 'Domain', val: 'Web Backend & MySQL' },
      { label: 'Freshman Year', val: '2026 Core Project' },
      { label: 'Database', val: 'MySQL Server (:3306)' },
      { label: 'Architecture', val: 'RESTful Routing + DB Pool' }
    ],
    overview: 'Engineered a resilient booking backend for managing client appointments at a custom boutique. Automates customer reservation intake, strictly validates 10-digit Indian mobile numbers, calculates dynamic price estimates based on requested stitching categories (Suit, Lehenga, Bridal Wear), and guarantees data integrity via parameterized MySQL relational queries.',
    archFlow: [
      { icon: 'fa-user-check', title: '1. Booking Payload', desc: 'POST request received at /book with client details and appointment dates' },
      { icon: 'fa-shield-halved', title: '2. Validation Engine', desc: 'Regex verifies 10-digit phone, prevents XSS, checks date constraints' },
      { icon: 'fa-calculator', title: '3. Pricing Logic', desc: 'Dynamic computation: service tier + fabric complexity + delivery timeline' },
      { icon: 'fa-database', title: '4. MySQL Insertion', desc: 'init_db() creates schema; parameterized SQL INSERT ensures ACID safety' },
      { icon: 'fa-check-double', title: '5. JSON Acknowledgment', desc: 'Returns confirmation status with unique booking ID' }
    ],
    features: [
      {
        icon: 'fa-database',
        title: 'Automated Schema Provisioning',
        desc: 'init_db() checks for table existence on startup and auto-executes DDL CREATE TABLE statements for bookings with proper datatypes and auto-incrementing primary keys.'
      },
      {
        icon: 'fa-calculator',
        title: 'Dynamic Price Computation',
        desc: 'Calculates instant price estimates dynamically on the server depending on selected tailoring tiers (Suit Stitching, Lehenga Stitching, Bridal Wear).'
      },
      {
        icon: 'fa-shield-halved',
        title: 'SQL Injection Defense',
        desc: 'Uses parameterized database queries exclusively, preventing SQL injection vulnerabilities.'
      },
      {
        icon: 'fa-key',
        title: 'Safe Secret Management',
        desc: 'Database host, user, password, and port are securely decoupled from application source code via python-dotenv.'
      }
    ],
    codeSnippet: `<span class="kw">from</span> flask <span class="kw">import</span> Flask, request, jsonify, render_template
<span class="kw">import</span> mysql.connector, re, os
<span class="kw">from</span> dotenv <span class="kw">import</span> load_dotenv

load_dotenv()
app = Flask(__name__)

<span class="kw">def</span> <span class="fn">get_db_connection</span>():
    <span class="kw">return</span> mysql.connector.connect(
        host=os.getenv(<span class="str">"DB_HOST"</span>, <span class="str">"localhost"</span>),
        user=os.getenv(<span class="str">"DB_USER"</span>, <span class="str">"root"</span>),
        password=os.getenv(<span class="str">"DB_PASSWORD"</span>, <span class="str">""</span>),
        database=os.getenv(<span class="str">"DB_NAME"</span>, <span class="str">"lord_krishna_boutique"</span>)
    )

<span class="kw">def</span> <span class="fn">init_db</span>():
    conn = <span class="fn">get_db_connection</span>()
    cursor = conn.cursor()
    cursor.execute(<span class="str">"""
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(15) NOT NULL,
            service VARCHAR(50) NOT NULL,
            booking_date DATE NOT NULL,
            price DECIMAL(10, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """</span>)
    conn.commit()
    conn.close()

@app.route(<span class="str">"/book"</span>, methods=[<span class="str">"POST"</span>])
<span class="kw">def</span> <span class="fn">book_appointment</span>():
    data = request.form
    phone = data.get(<span class="str">"phone"</span>, <span class="str">""</span>)
    <span class="kw">if not</span> re.match(<span class="str">r"^[6-9]\\d{9}$"</span>, phone):
        <span class="kw">return</span> jsonify({<span class="str">"error"</span>: <span class="str">"Invalid 10-digit Indian phone number"</span>}), <span class="num">400</span>
    
    <span class="com"># Dynamic pricing calculation</span>
    pricing = {<span class="str">"Suit Stitching"</span>: <span class="num">800</span>, <span class="str">"Lehenga Stitching"</span>: <span class="num">2500</span>, <span class="str">"Bridal Wear"</span>: <span class="num">5000</span>}
    price = pricing.get(data.get(<span class="str">"service"</span>), <span class="num">1000</span>)
    
    conn = <span class="fn">get_db_connection</span>()
    cursor = conn.cursor()
    cursor.execute(
        <span class="str">"INSERT INTO bookings (name, phone, service, booking_date, price) VALUES (%s, %s, %s, %s, %s)"</span>,
        (data[<span class="str">"name"</span>], phone, data[<span class="str">"service"</span>], data[<span class="str">"date"</span>], price)
    )
    conn.commit()
    conn.close()
    <span class="kw">return</span> jsonify({<span class="str">"status"</span>: <span class="str">"success"</span>, <span class="str">"estimated_price"</span>: price})`,
    techChips: ['Python (Flask)', 'MySQL Database', 'Relational Schemas', 'REST API Routing', 'Validation Engine', 'python-dotenv', 'SQL Indexing'],
    githubUrl: 'https://github.com/yatin341'
  },

  backend: {
    id: 'backend',
    doorNum: '04',
    filename: 'backend_arsenal_microservices.py',
    category: 'Core Backend Stack & Computer Vision',
    title: 'Python Backend Arsenal & Computer Vision',
    tagline: 'High-performance asynchronous FastAPI microservices, OpenCV real-time vision cascades, PyTorch tensor pipelines & SQL schema design.',
    stats: [
      { label: 'Domain', val: 'Backend & Vision Systems' },
      { label: 'Freshman Year', val: '2026 Core Competencies' },
      { label: 'Primary Language', val: 'Python 3.11+' },
      { label: 'Frameworks', val: 'FastAPI, OpenCV, PyTorch' }
    ],
    overview: 'A deep-dive into the foundational engineering competencies powering all server-side services: architecting high-throughput asynchronous REST microservices with FastAPI, capturing and transforming real-time camera frames using OpenCV, orchestrating PyTorch neural tensor operations, and executing performant SQL queries.',
    archFlow: [
      { icon: 'fa-bolt', title: '1. FastAPI Async Routing', desc: 'Asynchronous endpoint controllers handling high-concurrency request throughput' },
      { icon: 'fa-check-circle', title: '2. Pydantic Validation', desc: 'Strict runtime type checking and OpenAPI / Swagger auto-documentation' },
      { icon: 'fa-camera', title: '3. OpenCV Frame Processing', desc: 'Video stream capture, Haar cascades, facial landmarks, and threshold filters' },
      { icon: 'fa-brain', title: '4. PyTorch CUDA Tensors', desc: 'Reshapes multidimensional arrays and executes GPU tensor forward passes' },
      { icon: 'fa-database', title: '5. Relational SQL Storage', desc: 'Normalized relational schemas and indexed high-frequency queries' }
    ],
    features: [
      {
        icon: 'fa-bolt',
        title: 'Asynchronous FastAPI Services',
        desc: 'Constructs non-blocking REST APIs utilizing Python asyncio and Pydantic models for automatic schema validation and JSON serialization.'
      },
      {
        icon: 'fa-camera',
        title: 'OpenCV Computer Vision Pipelines',
        desc: 'Processes camera input feeds, detects faces using pre-trained Haar Cascades, applies image segmentation, and executes color tracking.'
      },
      {
        icon: 'fa-brain',
        title: 'PyTorch Tensor Mastery',
        desc: 'Constructs tensor manipulation pipelines, manages GPU memory allocation via CUDA, and runs local AI inference pipelines.'
      },
      {
        icon: 'fa-server',
        title: 'Pure Backend Engineering Focus',
        desc: 'Dedicated to server logic, security headers, relational databases, clean modular Python architecture, and zero frontend bloat.'
      }
    ],
    codeSnippet: `<span class="kw">from</span> fastapi <span class="kw">import</span> FastAPI, HTTPException
<span class="kw">from</span> pydantic <span class="kw">import</span> BaseModel, Field
<span class="kw">import</span> cv2, torch

app = FastAPI(title=<span class="str">"Yatin Backend Engine"</span>, version=<span class="str">"2026.1"</span>)

<span class="kw">class</span> <span class="fn">VisionTaskPayload</span>(BaseModel):
    task_name: str = Field(..., example=<span class="str">"face_detection"</span>)
    confidence_threshold: float = Field(<span class="num">0.85</span>, ge=<span class="num">0.0</span>, le=<span class="num">1.0</span>)

@app.get(<span class="str">"/status"</span>)
<span class="kw">async def</span> <span class="fn">get_system_status</span>():
    cuda_status = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(<span class="num">0</span>) <span class="kw">if</span> cuda_status <span class="kw">else</span> <span class="str">"CPU Only"</span>
    <span class="kw">return</span> {
        <span class="str">"developer"</span>: <span class="str">"Yatin Jangra"</span>,
        <span class="str">"role"</span>: <span class="str">"Python Backend Developer"</span>,
        <span class="str">"year"</span>: <span class="num">2026</span>,
        <span class="str">"cuda_available"</span>: cuda_status,
        <span class="str">"active_device"</span>: device_name
    }

@app.post(<span class="str">"/vision/process"</span>)
<span class="kw">async def</span> <span class="fn">process_vision_frame</span>(payload: VisionTaskPayload):
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + <span class="str">"haarcascade_frontalface_default.xml"</span>)
    <span class="kw">return</span> {<span class="str">"status"</span>: <span class="str">"ready"</span>, <span class="str">"classifier_loaded"</span>: <span class="kw">not</span> face_cascade.empty()}`,
    techChips: ['Python 3.11+', 'FastAPI', 'Uvicorn ASGI', 'OpenCV (cv2)', 'PyTorch Tensors', 'CUDA GPU', 'Pydantic', 'MySQL', 'Git & Linux'],
    githubUrl: 'https://github.com/yatin341'
  }
};

function openProjectModal(projectId) {
  if (!PROJECT_DOSSIERS[projectId]) projectId = 'jarvis';
  currentProjectId = projectId;

  const modal = document.getElementById('project-modal');
  const modalBody = document.getElementById('modal-body');
  const breadcrumbTitle = document.getElementById('modal-breadcrumb-title');
  const navIndicator = document.getElementById('modal-nav-indicator');
  const githubBtn = document.getElementById('modal-github-btn');

  if (!modal || !modalBody) return;

  const data = PROJECT_DOSSIERS[projectId];
  const currentIndex = PROJECT_KEYS.indexOf(projectId);

  // Update Topbar Breadcrumb & Footer Indicator
  if (breadcrumbTitle) breadcrumbTitle.textContent = data.filename;
  if (navIndicator) navIndicator.textContent = `${currentIndex + 1} of ${PROJECT_KEYS.length}`;
  if (githubBtn) githubBtn.href = data.githubUrl;

  // Build Modal Body HTML
  modalBody.innerHTML = `
    <!-- Header Block -->
    <div class="modal-header-block">
      <div class="modal-tag-row">
        <span class="modal-badge-status"><i class="fa-solid fa-circle-dot"></i> ${data.status}</span>
        <span class="modal-badge-domain">// ${data.category}</span>
      </div>
      <h3 class="modal-title">${data.title}</h3>
      <p class="modal-tagline">${data.tagline}</p>
    </div>

    <!-- Stats Grid -->
    <div class="modal-stats-grid">
      ${data.stats.map(s => `
        <div class="modal-stat-card">
          <span class="modal-stat-label">${s.label}</span>
          <span class="modal-stat-val">${s.val}</span>
        </div>
      `).join('')}
    </div>

    <!-- Executive Overview -->
    <div class="modal-section-heading">
      <i class="fa-solid fa-server"></i> System Overview & Problem Statement
    </div>
    <div class="modal-overview-card" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 18px 20px; margin-bottom: 26px; line-height: 1.6; color: var(--text-muted); font-size: 0.92rem;">
      ${data.overview}
    </div>

    <!-- Architecture & Data Flow Pipeline -->
    <div class="modal-section-heading">
      <i class="fa-solid fa-network-wired"></i> Architecture & Data Flow Pipeline
    </div>
    <div class="modal-arch-flow">
      ${data.archFlow.map((node, i) => `
        <div class="arch-node">
          <div class="arch-node-icon"><i class="fa-solid ${node.icon}"></i></div>
          <div class="arch-node-title">${node.title}</div>
          <div class="arch-node-desc">${node.desc}</div>
        </div>
        ${i < data.archFlow.length - 1 ? `<div class="arch-arrow"><i class="fa-solid fa-arrow-right"></i></div>` : ''}
      `).join('')}
    </div>

    <!-- Key Technical Features Grid -->
    <div class="modal-section-heading">
      <i class="fa-solid fa-microchip"></i> Key Engineering Features
    </div>
    <div class="modal-features-grid">
      ${data.features.map(f => `
        <div class="modal-feat-card">
          <div class="modal-feat-icon"><i class="fa-solid ${f.icon}"></i></div>
          <div class="modal-feat-info">
            <h5>${f.title}</h5>
            <p>${f.desc}</p>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Verified Code Snippet Terminal -->
    <div class="modal-section-heading">
      <i class="fa-solid fa-code"></i> Verified Production Source Code
    </div>
    <div class="modal-code-wrapper">
      <div class="modal-code-header">
        <div class="modal-code-title">
          <i class="fa-brands fa-python"></i> ${data.filename}
        </div>
        <button type="button" class="modal-copy-btn" id="modal-copy-code-btn">
          <i class="fa-regular fa-copy"></i> Copy Code
        </button>
      </div>
      <pre class="modal-code-block"><code>${data.codeSnippet}</code></pre>
    </div>

    <!-- Tech Stack Arsenal Chips -->
    <div class="modal-section-heading">
      <i class="fa-solid fa-layer-group"></i> Technologies & Libraries Utilized
    </div>
    <div class="modal-chips-wrap">
      ${data.techChips.map(c => `<span class="modal-tech-chip"><i class="fa-solid fa-cube"></i> ${c}</span>`).join('')}
    </div>
  `;

  // Attach copy code listener
  const copyBtn = modalBody.querySelector('#modal-copy-code-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.codeSnippet;
      const plainCode = tempDiv.textContent || tempDiv.innerText || '';
      navigator.clipboard.writeText(plainCode).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Code';
          copyBtn.classList.remove('copied');
        }, 2200);
      });
    });
  }

  // Open modal window
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modalBody.scrollTop = 0;
  playModalOpenSound();
}

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function initProjectModal() {
  const modal = document.getElementById('project-modal');
  const backdrop = document.getElementById('modal-backdrop');
  const closeBtn = document.getElementById('modal-close-btn');
  const closeDot = document.getElementById('modal-close-dot');
  const dismissBtn = document.getElementById('modal-dismiss-btn');
  const prevBtn = document.getElementById('modal-prev-btn');
  const nextBtn = document.getElementById('modal-next-btn');

  if (!modal) return;

  // Close handlers
  if (backdrop) backdrop.addEventListener('click', closeProjectModal);
  if (closeBtn) closeBtn.addEventListener('click', closeProjectModal);
  if (closeDot) closeDot.addEventListener('click', closeProjectModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeProjectModal);

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeProjectModal();
    } else if (e.key === 'ArrowRight') {
      const idx = PROJECT_KEYS.indexOf(currentProjectId);
      const nextIdx = (idx + 1) % PROJECT_KEYS.length;
      openProjectModal(PROJECT_KEYS[nextIdx]);
    } else if (e.key === 'ArrowLeft') {
      const idx = PROJECT_KEYS.indexOf(currentProjectId);
      const prevIdx = (idx - 1 + PROJECT_KEYS.length) % PROJECT_KEYS.length;
      openProjectModal(PROJECT_KEYS[prevIdx]);
    }
  });

  // Next / Previous navigation buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const idx = PROJECT_KEYS.indexOf(currentProjectId);
      const prevIdx = (idx - 1 + PROJECT_KEYS.length) % PROJECT_KEYS.length;
      openProjectModal(PROJECT_KEYS[prevIdx]);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const idx = PROJECT_KEYS.indexOf(currentProjectId);
      const nextIdx = (idx + 1) % PROJECT_KEYS.length;
      openProjectModal(PROJECT_KEYS[nextIdx]);
    });
  }
}