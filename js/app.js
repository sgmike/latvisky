// Latvisky — Single-page app
// Hash-based routing, vanilla JS, no framework.

const app = document.getElementById('app');

// ============================================================
// PROFILES (multi-user support, local-only)
// ============================================================

const PROFILES_KEY = 'latvisky.profiles';
const ACTIVE_PROFILE_KEY = 'latvisky.activeProfile';
const LEGACY_STATE_KEY = 'latvisky.state.v1';
const STATE_PREFIX = 'latvisky.state.v1';

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveProfiles(profiles) { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); }
function getActiveProfile() { return localStorage.getItem(ACTIVE_PROFILE_KEY) || null; }
function setActiveProfile(name) {
  if (name) localStorage.setItem(ACTIVE_PROFILE_KEY, name);
  else localStorage.removeItem(ACTIVE_PROFILE_KEY);
}
function profileStateKey(name) { return `${STATE_PREFIX}:${name}`; }

function sanitizeProfileName(s) {
  return String(s || '').trim().slice(0, 24);
}

function createProfile(name) {
  name = sanitizeProfileName(name);
  if (!name) return { ok: false, reason: 'empty' };
  const profiles = loadProfiles();
  if (profiles.includes(name)) return { ok: false, reason: 'exists' };
  profiles.push(name);
  saveProfiles(profiles);
  setActiveProfile(name);
  const fresh = { ...defaultState, startDate: today() };
  localStorage.setItem(profileStateKey(name), JSON.stringify(fresh));
  return { ok: true };
}

function deleteProfile(name) {
  const profiles = loadProfiles().filter(p => p !== name);
  saveProfiles(profiles);
  localStorage.removeItem(profileStateKey(name));
  if (getActiveProfile() === name) setActiveProfile(profiles[0] || null);
}

function migrateLegacyState() {
  const legacy = localStorage.getItem(LEGACY_STATE_KEY);
  if (!legacy) return;
  // Only migrate if it's a JSON object (not the new prefix-style keys)
  let parsed;
  try { parsed = JSON.parse(legacy); } catch (e) { return; }
  if (typeof parsed !== 'object') return;

  const profiles = loadProfiles();
  if (profiles.length === 0) {
    profiles.push('Yo');
    saveProfiles(profiles);
    setActiveProfile('Yo');
    localStorage.setItem(profileStateKey('Yo'), legacy);
  }
  localStorage.removeItem(LEGACY_STATE_KEY);
}

// ============================================================
// STATE & PERSISTENCE
// ============================================================

const defaultState = {
  startDate: null,
  currentDay: 1,
  completedDays: [],
  cardStats: {},
  quizAttempts: {},
  lastStudied: null,
  streak: 0,
  lastStudyDate: null
};

function loadState() {
  const active = getActiveProfile();
  if (!active) return null;
  try {
    const raw = localStorage.getItem(profileStateKey(active));
    if (!raw) return { ...defaultState, startDate: today() };
    const s = JSON.parse(raw);
    return { ...defaultState, ...s };
  } catch (e) {
    return { ...defaultState, startDate: today() };
  }
}
function saveState() {
  const active = getActiveProfile();
  if (active && state) localStorage.setItem(profileStateKey(active), JSON.stringify(state));
}
function today() { return new Date().toISOString().slice(0, 10); }

migrateLegacyState();
let state = loadState();
if (state && !state.startDate) { state.startDate = today(); saveState(); }

// ============================================================
// HELPERS
// ============================================================

function fmtPercent(n) { return Math.round(n) + '%'; }

async function fetchText(path) {
  // Prefer bundled content (offline / standalone)
  if (typeof LATVISKY_CONTENT !== 'undefined' && LATVISKY_CONTENT[path] != null) {
    return LATVISKY_CONTENT[path];
  }
  const res = await fetch(path);
  if (!res.ok) throw new Error('No encontrado: ' + path);
  return await res.text();
}

async function fetchJSON(path) {
  if (typeof LATVISKY_CONTENT !== 'undefined' && LATVISKY_CONTENT[path] != null) {
    return JSON.parse(LATVISKY_CONTENT[path]);
  }
  const res = await fetch(path);
  if (!res.ok) throw new Error('No encontrado: ' + path);
  return await res.json();
}

function downloadBlob(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
}

function parseCSV(text) {
  // Robust simple CSV: ; separator, no escape inside (we control the data)
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift().split(';');
  return lines.map(line => {
    const cells = line.split(';');
    const row = {};
    header.forEach((h, i) => row[h.trim()] = (cells[i] || '').trim());
    return row;
  });
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateStreak() {
  if (!state) return;
  const t = today();
  if (state.lastStudyDate === t) return;
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yKey = yest.toISOString().slice(0, 10);
  if (state.lastStudyDate === yKey) state.streak += 1;
  else if (state.lastStudyDate !== t) state.streak = 1;
  state.lastStudyDate = t;
  saveState();
  renderStreakPill();
}

function renderStreakPill() {
  if (!state) return;
  const el = document.getElementById('streak-count');
  if (el) el.textContent = state.streak || 0;
  const pill = document.getElementById('streak-pill');
  if (pill) pill.classList.toggle('hidden', !(state.streak > 0));
}

function renderProfilePill() {
  const pill = document.getElementById('profile-pill');
  if (!pill) return;
  const active = getActiveProfile();
  if (!active) { pill.classList.add('hidden'); return; }
  pill.classList.remove('hidden');
  pill.classList.add('flex');
  document.getElementById('profile-avatar').textContent = active[0].toUpperCase();
  document.getElementById('profile-name').textContent = active;
}

function speak(text, lang = 'lv-LV') {
  if (!('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) {}
}

function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstChild;
}

function setActiveTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

// ============================================================
// ROUTER
// ============================================================

const routes = [
  { match: /^\/?$/,                       handler: renderHome,           tab: 'home' },
  { match: /^\/days$/,                    handler: renderDaysList,       tab: 'days' },
  { match: /^\/day\/(\d+)$/,              handler: renderDay,            tab: 'days' },
  { match: /^\/cards$/,                   handler: renderDecksList,      tab: 'cards' },
  { match: /^\/cards\/(\d+)$/,            handler: renderDeckStudy,      tab: 'cards' },
  { match: /^\/quiz$/,                    handler: renderQuizzesList,    tab: 'quiz' },
  { match: /^\/quiz\/(\d+)$/,             handler: renderQuiz,           tab: 'quiz' },
  { match: /^\/me$/,                      handler: renderProgress,       tab: 'me' },
  { match: /^\/grammar$/,                 handler: renderGrammarList,    tab: 'days' },
  { match: /^\/grammar\/(\d+)$/,          handler: renderGrammarTopic,   tab: 'days' },
  { match: /^\/exam$/,                    handler: renderExamInfo,       tab: 'me' },
  { match: /^\/conversation$/,            handler: renderConversation,   tab: 'home' },
  { match: /^\/profiles$/,                handler: renderProfilesPage,   tab: 'me' },
  { match: /^\/downloads$/,               handler: renderDownloadsPage,  tab: 'me' }
];

function route() {
  // Profile gate: require a profile before showing anything
  const profiles = loadProfiles();
  if (profiles.length === 0) {
    setActiveTab(null);
    renderFirstProfileSetup();
    return;
  }
  if (!getActiveProfile()) {
    setActiveProfile(profiles[0]);
    state = loadState();
  }
  if (!state) {
    state = loadState() || { ...defaultState, startDate: today() };
  }
  renderProfilePill();

  const hash = (location.hash || '#/').slice(1);
  for (const r of routes) {
    const m = hash.match(r.match);
    if (m) {
      setActiveTab(r.tab);
      window.scrollTo(0, 0);
      try { r.handler(...m.slice(1)); }
      catch (e) { renderError(e); }
      return;
    }
  }
  renderError(new Error('Página no encontrada: ' + hash));
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => { renderStreakPill(); renderProfilePill(); route(); });

function renderError(e) {
  app.innerHTML = `<div class="text-center py-16">
    <div class="text-5xl mb-3">😅</div>
    <div class="text-lg font-semibold mb-2">Algo salió mal</div>
    <div class="text-sm text-slate-400 mb-4">${escapeHtml(e.message)}</div>
    <a href="#/" class="inline-block bg-lvred px-4 py-2 rounded-lg font-medium">Volver al inicio</a>
  </div>`;
}

// ============================================================
// HOME
// ============================================================

function computeCurrentDay() {
  // Day = next not-completed day. Capped at 40.
  const completed = new Set(state.completedDays);
  for (let i = 1; i <= 40; i++) if (!completed.has(i)) return i;
  return 40;
}

function renderHome() {
  const current = computeCurrentDay();
  const todayLesson = CURRICULUM.find(d => d.day === current);
  const progress = (state.completedDays.length / 40) * 100;
  const cardsStudied = Object.keys(state.cardStats).length;
  const cardsMastered = Object.values(state.cardStats).filter(s => (s.known || 0) >= 3).length;
  const quizzesTaken = Object.keys(state.quizAttempts).length;

  app.innerHTML = `
    <div class="fade-in space-y-5">
      <div>
        <h1 class="text-2xl font-bold mb-1">Sveiki! 👋</h1>
        <p class="text-slate-400 text-sm">Hoy ${new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <a href="#/day/${current}" class="block bg-gradient-to-br from-lvred to-lvred-dark rounded-2xl p-5 shadow-xl shadow-lvred/20 active:scale-[0.99] transition">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs uppercase tracking-wider bg-white/15 px-2 py-1 rounded-full">Día ${current} de 40</span>
          ${todayLesson?.tag === 'quiz' ? '<span class="text-xs bg-purple-500/30 px-2 py-1 rounded-full">📝 Quiz</span>' : ''}
          ${todayLesson?.tag === 'mock' ? '<span class="text-xs bg-amber-500/30 px-2 py-1 rounded-full">🎯 Simulacro</span>' : ''}
        </div>
        <div class="text-xl font-bold mb-1">${todayLesson ? mdToInline(todayLesson.title) : 'Curso terminado'}</div>
        <div class="text-sm text-white/80 mb-3">${todayLesson?.topic || '¡Listos para el examen!'}</div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-white/70">Empezar lección →</span>
          <span class="text-xs text-white/70">~45 min</span>
        </div>
      </a>

      <div>
        <div class="flex items-center justify-between mb-2 px-1">
          <span class="text-sm font-semibold text-slate-300">Tu progreso</span>
          <span class="text-xs text-slate-400">${state.completedDays.length}/40 días</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <div class="bg-white/5 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-amber-400">${state.streak || 0}</div>
          <div class="text-[10px] uppercase text-slate-400 mt-0.5">racha 🔥</div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-emerald-400">${cardsMastered}</div>
          <div class="text-[10px] uppercase text-slate-400 mt-0.5">cards 🧠</div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-purple-400">${quizzesTaken}</div>
          <div class="text-[10px] uppercase text-slate-400 mt-0.5">quizzes ✅</div>
        </div>
      </div>

      <div class="space-y-2">
        <h2 class="text-sm font-semibold text-slate-300 px-1">Acciones rápidas</h2>
        <div class="grid grid-cols-2 gap-2">
          <a href="#/cards" class="card-action">
            <div class="text-xl mb-1">🃏</div>
            <div class="font-semibold text-sm">Flashcards</div>
            <div class="text-xs text-slate-400 mt-0.5">Repasa palabras</div>
          </a>
          <a href="#/quiz" class="card-action">
            <div class="text-xl mb-1">📝</div>
            <div class="font-semibold text-sm">Quizzes</div>
            <div class="text-xs text-slate-400 mt-0.5">Mide tu nivel</div>
          </a>
          <a href="#/grammar" class="card-action">
            <div class="text-xl mb-1">📚</div>
            <div class="font-semibold text-sm">Gramática</div>
            <div class="text-xs text-slate-400 mt-0.5">Reglas + errores</div>
          </a>
          <a href="#/conversation" class="card-action">
            <div class="text-xl mb-1">💬</div>
            <div class="font-semibold text-sm">Conversación</div>
            <div class="text-xs text-slate-400 mt-0.5">Modo real</div>
          </a>
          <a href="#/exam" class="card-action col-span-2">
            <div class="flex items-center gap-3">
              <div class="text-2xl">🎯</div>
              <div class="flex-1">
                <div class="font-semibold text-sm">Examen A2 oficial</div>
                <div class="text-xs text-slate-400 mt-0.5">Estructura, criterios, qué evaluan</div>
              </div>
              <div class="text-slate-500">›</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  `;
}

function mdToInline(s) {
  // Minimal inline markdown for italics in titles
  return escapeHtml(s).replace(/\*([^*]+)\*/g, '<em class="italic font-medium">$1</em>');
}

// ============================================================
// DAYS LIST (Calendar)
// ============================================================

function renderDaysList() {
  const completed = new Set(state.completedDays);
  const currentDay = computeCurrentDay();

  const weekBlocks = WEEKS.map(w => {
    const days = CURRICULUM.filter(d => d.week === w.num);
    const cells = days.map(d => {
      const isCompleted = completed.has(d.day);
      const isToday = d.day === currentDay;
      const cls = [
        'day-cell',
        isCompleted ? 'completed' : '',
        !isCompleted && isToday ? 'today' : '',
        !isCompleted && !isToday && d.tag === 'quiz' ? 'quiz' : '',
        !isCompleted && !isToday && d.tag === 'mock' ? 'mock' : ''
      ].filter(Boolean).join(' ');
      return `<a href="#/day/${d.day}" class="${cls}">
        <div class="day-num">${d.day}</div>
        <div class="day-topic">${mdToInline(d.title)}</div>
      </a>`;
    }).join('');

    return `
      <section class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <h2 class="text-sm font-bold tracking-wide uppercase text-slate-300">Semana ${w.num} · ${w.name}</h2>
          <span class="text-[10px] text-slate-500">${days.filter(d => completed.has(d.day)).length}/${days.length}</span>
        </div>
        <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">${cells}</div>
      </section>
    `;
  }).join('');

  app.innerHTML = `
    <div class="fade-in space-y-6">
      <div>
        <h1 class="text-2xl font-bold">Calendario 40 días</h1>
        <p class="text-sm text-slate-400 mt-1">Toca un día para abrir la lección</p>
      </div>
      <div class="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-lvred"></span> Hoy</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-emerald-500/40"></span> Completado</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-purple-500/30"></span> Quiz</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-amber-500/30"></span> Simulacro</span>
      </div>
      ${weekBlocks}
    </div>
  `;
}

// ============================================================
// DAY DETAIL (Lesson)
// ============================================================

async function renderDay(dayStr) {
  const dayNum = parseInt(dayStr, 10);
  const lesson = CURRICULUM.find(d => d.day === dayNum);
  if (!lesson) return renderError(new Error('Día no válido'));

  app.innerHTML = `<div class="text-center py-20 text-slate-500 animate-pulse">Cargando lección…</div>`;

  let body;
  try {
    body = await fetchText(lesson.file);
  } catch (e) {
    body = null;
  }

  const isCompleted = state.completedDays.includes(dayNum);
  const prev = dayNum > 1 ? dayNum - 1 : null;
  const next = dayNum < 40 ? dayNum + 1 : null;

  if (!body) {
    app.innerHTML = `
      <div class="fade-in space-y-4">
        ${renderDayHeader(lesson)}
        <div class="bg-white/5 rounded-2xl p-6 text-center border border-dashed border-white/10">
          <div class="text-4xl mb-3">📝</div>
          <div class="font-semibold mb-2">Esta lección aún no está generada</div>
          <p class="text-sm text-slate-400 mb-4">Pide a Claude en el chat:</p>
          <code class="block bg-ink-900 rounded-lg p-3 text-sm text-amber-300 mb-4">"Dame la lección del día ${dayNum}"</code>
          <p class="text-xs text-slate-500">Cuando esté lista, vuelve aquí. La página se actualiza automáticamente.</p>
        </div>
        ${renderDayNav(prev, next, dayNum, isCompleted)}
      </div>`;
    return;
  }

  const html = marked.parse(body);

  app.innerHTML = `
    <div class="fade-in space-y-4">
      ${renderDayHeader(lesson)}
      <article class="prose-lesson">${html}</article>
      ${renderDayNav(prev, next, dayNum, isCompleted)}
    </div>
  `;

  // Wire up "complete" button
  const completeBtn = document.getElementById('mark-complete');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      const idx = state.completedDays.indexOf(dayNum);
      if (idx >= 0) state.completedDays.splice(idx, 1);
      else state.completedDays.push(dayNum);
      state.completedDays.sort((a,b) => a-b);
      updateStreak();
      saveState();
      renderDay(dayStr);
    });
  }

  const dlBtn = document.getElementById('day-download-btn');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      downloadBlob(`dia-${String(dayNum).padStart(2,'0')}.md`, body, 'text/markdown;charset=utf-8');
    });
  }
}

function renderDayHeader(lesson) {
  const weekInfo = WEEKS.find(w => w.num === lesson.week);
  return `
    <div class="bg-gradient-to-br ${weekInfo.color} rounded-2xl p-5 border border-white/10">
      <div class="flex items-center justify-between text-xs uppercase tracking-wider text-slate-300 mb-2">
        <span>Día ${lesson.day} · Semana ${lesson.week}</span>
        <span>${weekInfo.name}</span>
      </div>
      <h1 class="text-xl font-bold mb-1">${mdToInline(lesson.title)}</h1>
      <p class="text-sm text-slate-300">${lesson.topic}</p>
      ${lesson.tag === 'quiz' ? `<a href="#/quiz/${lesson.quizId}" class="inline-block mt-3 text-xs bg-purple-500/30 px-3 py-1.5 rounded-full">📝 Hacer Quiz Semana ${lesson.week}</a>` : ''}
    </div>
  `;
}

function renderDayNav(prev, next, current, isCompleted) {
  return `
    <div class="space-y-3">
      <button id="mark-complete" class="w-full ${isCompleted ? 'bg-emerald-600/30 border border-emerald-500/40' : 'bg-lvred'} py-3 rounded-xl font-semibold transition">
        ${isCompleted ? '✓ Día completado (toca para desmarcar)' : 'Marcar como completado'}
      </button>
      <div class="grid grid-cols-2 gap-2">
        <a href="${prev ? '#/day/' + prev : '#/days'}" class="bg-white/5 rounded-xl py-2.5 text-center text-sm font-medium ${!prev ? 'opacity-40 pointer-events-none' : ''}">
          ← Día ${prev || ''}
        </a>
        <a href="${next ? '#/day/' + next : '#/days'}" class="bg-white/5 rounded-xl py-2.5 text-center text-sm font-medium ${!next ? 'opacity-40 pointer-events-none' : ''}">
          Día ${next || ''} →
        </a>
      </div>
      <button id="day-download-btn" class="w-full bg-white/5 hover:bg-white/10 rounded-xl py-2.5 text-sm text-slate-300">
        ⬇ Descargar esta lección (.md)
      </button>
    </div>
  `;
}

// ============================================================
// FLASHCARDS — DECK LIST
// ============================================================

function renderDecksList() {
  const decksHtml = DECKS.map(d => {
    const stats = computeDeckStats(d.id);
    return `
      <a href="#/cards/${d.id}" class="card-action block">
        <div class="flex items-start gap-3">
          <div class="text-3xl">🃏</div>
          <div class="flex-1">
            <div class="font-semibold">${d.name}</div>
            <div class="text-xs text-slate-400 mt-1">${d.topic}</div>
            <div class="mt-2 text-xs text-slate-300">
              <span class="text-emerald-400 font-medium">${stats.known}</span> dominadas /
              <span class="text-amber-400 font-medium">${stats.seen}</span> vistas
              ${stats.total ? `· ${stats.total} totales` : ''}
            </div>
          </div>
        </div>
      </a>
    `;
  }).join('');

  const upcoming = WEEKS.filter(w => !DECKS.find(d => d.week === w.num)).map(w => `
    <div class="card-action opacity-50 cursor-not-allowed">
      <div class="flex items-start gap-3">
        <div class="text-3xl grayscale">🃏</div>
        <div class="flex-1">
          <div class="font-semibold">Semana ${w.num} — ${w.name}</div>
          <div class="text-xs text-slate-400 mt-1">Aún no generada. Pídela a Claude.</div>
        </div>
      </div>
    </div>
  `).join('');

  app.innerHTML = `
    <div class="fade-in space-y-4">
      <div>
        <h1 class="text-2xl font-bold">Flashcards</h1>
        <p class="text-sm text-slate-400 mt-1">Mazo por semana, las más usadas primero</p>
      </div>
      <div class="space-y-2">${decksHtml}${upcoming}</div>
    </div>
  `;
}

const deckCache = new Map();
async function loadDeck(deckId) {
  if (deckCache.has(deckId)) return deckCache.get(deckId);
  const deck = DECKS.find(d => d.id === deckId);
  const text = await fetchText(deck.file);
  const cards = parseCSV(text);
  deckCache.set(deckId, { deck, cards });
  return { deck, cards };
}

function computeDeckStats(deckId) {
  const cache = deckCache.get(deckId);
  if (!cache) {
    // lazy load in background; return blank counts
    loadDeck(deckId).then(() => route());
    return { known: 0, seen: 0, total: 0 };
  }
  const { cards } = cache;
  let known = 0, seen = 0;
  cards.forEach(c => {
    const s = state.cardStats[c.letón];
    if (s) {
      seen++;
      if ((s.known || 0) >= 3) known++;
    }
  });
  return { known, seen, total: cards.length };
}

// ============================================================
// FLASHCARDS — STUDY MODE
// ============================================================

let studySession = null;

async function renderDeckStudy(deckIdStr) {
  const deckId = parseInt(deckIdStr, 10);
  app.innerHTML = `<div class="text-center py-20 text-slate-500 animate-pulse">Cargando mazo…</div>`;
  const { deck, cards } = await loadDeck(deckId);

  // Build session: shuffle, prioritize unseen + unknown
  const ordered = [...cards].sort((a, b) => {
    const sa = state.cardStats[a.letón] || { known: 0 };
    const sb = state.cardStats[b.letón] || { known: 0 };
    return (sa.known || 0) - (sb.known || 0);
  });
  studySession = {
    deckId,
    cards: shuffle(ordered.slice(0, 30)), // first session of up to 30
    index: 0,
    flipped: false,
    correct: 0,
    wrong: 0
  };
  renderCard();
}

function renderCard() {
  if (!studySession) return;
  const s = studySession;
  if (s.index >= s.cards.length) return renderStudyDone();

  const card = s.cards[s.index];
  const total = s.cards.length;
  const progress = (s.index / total) * 100;

  app.innerHTML = `
    <div class="fade-in space-y-5">
      <div class="flex items-center justify-between">
        <a href="#/cards" class="text-sm text-slate-400">← Volver</a>
        <div class="text-xs text-slate-400">${s.index + 1} / ${total}</div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>

      <div class="flashcard ${s.flipped ? 'flipped' : ''}" id="flashcard">
        <div class="flashcard-inner">
          <div class="flashcard-face front">
            <div class="text-3xl font-bold mb-2" lang="lv">${escapeHtml(card.letón)}</div>
            <button id="speak-btn" class="text-sm text-white/70 bg-white/10 px-3 py-1 rounded-full">🔊 Escuchar</button>
            <div class="absolute bottom-4 text-[11px] text-white/40">Toca la card para girarla</div>
          </div>
          <div class="flashcard-face back">
            <div class="text-xs uppercase tracking-widest text-white/70 mb-1">Español</div>
            <div class="text-xl font-bold mb-3">${escapeHtml(card.español)}</div>
            <div class="border-t border-white/20 pt-3 w-full">
              <div class="text-xs text-white/70 mb-1">Ejemplo</div>
              <div class="text-sm italic mb-1" lang="lv">${escapeHtml(card.ejemplo_letón || '')}</div>
              <div class="text-xs text-white/80">${escapeHtml(card.ejemplo_español || '')}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button id="btn-wrong" class="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 rounded-xl py-3 font-semibold">
          😕 No la sé
        </button>
        <button id="btn-right" class="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl py-3 font-semibold">
          😎 Me la sé
        </button>
      </div>
      <div class="text-center text-[11px] text-slate-500">Tip: pulsa la card para girar · ←/→ para navegar</div>
    </div>
  `;

  document.getElementById('flashcard').addEventListener('click', (e) => {
    if (e.target.id === 'speak-btn') return;
    s.flipped = !s.flipped;
    document.getElementById('flashcard').classList.toggle('flipped');
  });
  document.getElementById('speak-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    speak(card.letón);
  });
  document.getElementById('btn-wrong').addEventListener('click', () => answerCard(false));
  document.getElementById('btn-right').addEventListener('click', () => answerCard(true));
}

function answerCard(right) {
  const s = studySession;
  const card = s.cards[s.index];
  const stat = state.cardStats[card.letón] || { seen: 0, known: 0 };
  stat.seen = (stat.seen || 0) + 1;
  if (right) { stat.known = (stat.known || 0) + 1; s.correct++; }
  else { stat.known = Math.max(0, (stat.known || 0) - 1); s.wrong++; }
  state.cardStats[card.letón] = stat;
  saveState();
  updateStreak();
  s.index++;
  s.flipped = false;
  renderCard();
}

function renderStudyDone() {
  const s = studySession;
  const total = s.correct + s.wrong;
  const accuracy = total ? Math.round((s.correct / total) * 100) : 0;
  app.innerHTML = `
    <div class="fade-in text-center space-y-6 py-8">
      <div class="text-6xl">${accuracy >= 80 ? '🎉' : accuracy >= 50 ? '👍' : '💪'}</div>
      <div>
        <h1 class="text-2xl font-bold">¡Sesión terminada!</h1>
        <p class="text-sm text-slate-400 mt-1">${total} cards revisadas</p>
      </div>
      <div class="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        <div class="bg-emerald-500/15 rounded-xl p-3">
          <div class="text-2xl font-bold text-emerald-400">${s.correct}</div>
          <div class="text-[10px] uppercase text-slate-400 mt-0.5">aciertos</div>
        </div>
        <div class="bg-red-500/15 rounded-xl p-3">
          <div class="text-2xl font-bold text-red-400">${s.wrong}</div>
          <div class="text-[10px] uppercase text-slate-400 mt-0.5">fallos</div>
        </div>
        <div class="bg-lvred/20 rounded-xl p-3">
          <div class="text-2xl font-bold">${accuracy}%</div>
          <div class="text-[10px] uppercase text-slate-400 mt-0.5">acierto</div>
        </div>
      </div>
      <div class="space-y-2 max-w-xs mx-auto">
        <a href="#/cards/${s.deckId}" class="block bg-lvred py-3 rounded-xl font-semibold">🔁 Otra ronda</a>
        <a href="#/cards" class="block bg-white/5 py-2.5 rounded-xl text-sm">Volver a mazos</a>
      </div>
    </div>
  `;
  studySession = null;
}

// Keyboard nav
window.addEventListener('keydown', e => {
  if (!studySession) return;
  if (e.key === ' ' || e.key === 'Enter') {
    studySession.flipped = !studySession.flipped;
    document.getElementById('flashcard')?.classList.toggle('flipped');
  }
  if (e.key === 'ArrowLeft') answerCard(false);
  if (e.key === 'ArrowRight') answerCard(true);
});

// ============================================================
// QUIZZES
// ============================================================

function renderQuizzesList() {
  const items = QUIZZES.map(q => {
    const attempts = state.quizAttempts[q.id] || [];
    const best = attempts.reduce((m, a) => Math.max(m, a.score / a.total), 0);
    return `
      <a href="#/quiz/${q.id}" class="card-action block">
        <div class="flex items-start gap-3">
          <div class="text-3xl">📝</div>
          <div class="flex-1">
            <div class="font-semibold">${q.name}</div>
            <div class="text-xs text-slate-400 mt-1">10 preguntas · ~15 min</div>
            <div class="mt-2 text-xs">
              ${attempts.length ? `<span class="text-emerald-400">Mejor: ${fmtPercent(best * 100)}</span> · ${attempts.length} intento(s)` : '<span class="text-slate-500">Aún no lo has hecho</span>'}
            </div>
          </div>
        </div>
      </a>
    `;
  }).join('');

  const upcoming = WEEKS.filter(w => !QUIZZES.find(q => q.week === w.num)).map(w => `
    <div class="card-action opacity-50 cursor-not-allowed">
      <div class="flex items-start gap-3">
        <div class="text-3xl grayscale">📝</div>
        <div class="flex-1">
          <div class="font-semibold">Quiz Semana ${w.num}</div>
          <div class="text-xs text-slate-400 mt-1">Aún no generado.</div>
        </div>
      </div>
    </div>
  `).join('');

  app.innerHTML = `
    <div class="fade-in space-y-4">
      <div>
        <h1 class="text-2xl font-bold">Quizzes semanales</h1>
        <p class="text-sm text-slate-400 mt-1">10 preguntas cada uno, corrección automática</p>
      </div>
      <div class="space-y-2">${items}${upcoming}</div>
    </div>
  `;
}

let quizState = null;

async function renderQuiz(quizIdStr) {
  const quizId = parseInt(quizIdStr, 10);
  const meta = QUIZZES.find(q => q.id === quizId);
  if (!meta) return renderError(new Error('Quiz no encontrado'));
  app.innerHTML = `<div class="text-center py-20 text-slate-500 animate-pulse">Cargando quiz…</div>`;

  let data;
  try { data = await fetchJSON(meta.file); }
  catch (e) { return renderError(new Error('No se pudo cargar el quiz: ' + e.message)); }

  quizState = {
    quizId,
    data,
    index: 0,
    answers: new Array(data.questions.length).fill(null),
    submitted: false
  };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const s = quizState;
  const q = s.data.questions[s.index];
  const total = s.data.questions.length;

  let inputHtml = '';
  if (q.type === 'multiple_choice') {
    inputHtml = q.options.map((opt, i) => {
      const selected = s.answers[s.index] === i ? 'selected' : '';
      return `<button class="quiz-option ${selected}" data-i="${i}">${escapeHtml(opt)}</button>`;
    }).join('');
  } else if (q.type === 'fill_blank' || q.type === 'translate' || q.type === 'short_answer') {
    const val = s.answers[s.index] ?? '';
    inputHtml = `<input type="text" id="q-input" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-lvred" placeholder="Tu respuesta…" value="${escapeHtml(val)}" autocapitalize="off" autocorrect="off" />`;
  } else if (q.type === 'true_false') {
    const a = s.answers[s.index];
    inputHtml = `
      <div class="grid grid-cols-2 gap-2">
        <button class="quiz-option ${a === true ? 'selected' : ''}" data-tf="true">✅ Verdadero</button>
        <button class="quiz-option ${a === false ? 'selected' : ''}" data-tf="false">❌ Falso</button>
      </div>
    `;
  }

  const progress = ((s.index + 1) / total) * 100;
  const isLast = s.index === total - 1;

  app.innerHTML = `
    <div class="fade-in space-y-5">
      <div class="flex items-center justify-between">
        <a href="#/quiz" class="text-sm text-slate-400">← Salir</a>
        <div class="text-xs text-slate-400">Pregunta ${s.index + 1} de ${total}</div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>

      <div class="bg-white/5 rounded-2xl p-5 border border-white/10">
        ${q.context ? `<div class="text-xs uppercase tracking-wider text-slate-400 mb-2">${escapeHtml(q.context)}</div>` : ''}
        <div class="text-lg font-semibold mb-4 leading-snug">${escapeHtml(q.question)}</div>
        <div class="space-y-2">${inputHtml}</div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button id="q-prev" class="bg-white/5 rounded-xl py-3 font-medium ${s.index === 0 ? 'opacity-40 pointer-events-none' : ''}">← Anterior</button>
        ${isLast
          ? `<button id="q-submit" class="bg-lvred rounded-xl py-3 font-semibold">Enviar respuestas</button>`
          : `<button id="q-next" class="bg-lvred rounded-xl py-3 font-semibold">Siguiente →</button>`}
      </div>
    </div>
  `;

  // Wire up answer inputs
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.i !== undefined) s.answers[s.index] = parseInt(btn.dataset.i);
      if (btn.dataset.tf !== undefined) s.answers[s.index] = btn.dataset.tf === 'true';
      renderQuizQuestion();
    });
  });
  const input = document.getElementById('q-input');
  if (input) input.addEventListener('input', e => s.answers[s.index] = e.target.value);

  document.getElementById('q-prev')?.addEventListener('click', () => { s.index--; renderQuizQuestion(); });
  document.getElementById('q-next')?.addEventListener('click', () => { s.index++; renderQuizQuestion(); });
  document.getElementById('q-submit')?.addEventListener('click', submitQuiz);
}

function submitQuiz() {
  const s = quizState;
  let score = 0;
  const results = s.data.questions.map((q, i) => {
    const given = s.answers[i];
    let correct = false;
    if (q.type === 'multiple_choice') correct = given === q.answer;
    else if (q.type === 'true_false') correct = given === q.answer;
    else if (q.type === 'fill_blank' || q.type === 'translate' || q.type === 'short_answer') {
      const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
      correct = accepted.some(a => normalize(String(given || '')) === normalize(String(a)));
    }
    if (correct) score++;
    return { correct, given, expected: q.answer, q };
  });

  const attempt = {
    date: new Date().toISOString(),
    score,
    total: s.data.questions.length,
    answers: results.map(r => ({ given: r.given, correct: r.correct }))
  };
  state.quizAttempts[s.quizId] = state.quizAttempts[s.quizId] || [];
  state.quizAttempts[s.quizId].push(attempt);
  updateStreak();
  saveState();

  renderQuizResults(results, score);
}

function normalize(s) {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?]$/g, '');
}

function renderQuizResults(results, score) {
  const total = results.length;
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 60;

  const breakdown = results.map((r, i) => {
    const q = r.q;
    let givenStr = r.given;
    let expectedStr = '';
    if (q.type === 'multiple_choice') {
      givenStr = (r.given !== null && q.options[r.given]) || '— (sin responder)';
      expectedStr = q.options[q.answer];
    } else if (q.type === 'true_false') {
      givenStr = r.given === true ? 'Verdadero' : r.given === false ? 'Falso' : '— (sin responder)';
      expectedStr = q.answer ? 'Verdadero' : 'Falso';
    } else {
      expectedStr = Array.isArray(q.answer) ? q.answer.join(' / ') : q.answer;
      givenStr = givenStr || '— (sin responder)';
    }
    return `
      <div class="bg-white/5 rounded-xl p-4 border ${r.correct ? 'border-emerald-500/30' : 'border-red-500/30'}">
        <div class="flex items-start gap-2 mb-2">
          <span class="text-xl">${r.correct ? '✅' : '❌'}</span>
          <div class="flex-1">
            <div class="text-xs uppercase text-slate-400 mb-1">Pregunta ${i + 1}</div>
            <div class="font-medium text-sm">${escapeHtml(q.question)}</div>
          </div>
        </div>
        <div class="text-xs space-y-1 pl-7">
          <div><span class="text-slate-400">Tu respuesta:</span> <span class="${r.correct ? 'text-emerald-300' : 'text-red-300'}">${escapeHtml(String(givenStr))}</span></div>
          ${!r.correct ? `<div><span class="text-slate-400">Correcta:</span> <span class="text-emerald-300">${escapeHtml(String(expectedStr))}</span></div>` : ''}
          ${q.explanation ? `<div class="mt-1 text-slate-300 italic">💡 ${escapeHtml(q.explanation)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  app.innerHTML = `
    <div class="fade-in space-y-6">
      <div class="text-center py-6">
        <div class="text-6xl mb-3">${passed ? '🎉' : '💪'}</div>
        <div class="text-3xl font-bold">${score}/${total}</div>
        <div class="text-lg text-slate-300 mt-1">${pct}% · ${passed ? 'Aprobado A2' : 'Sigue practicando'}</div>
        <div class="text-xs text-slate-500 mt-2">Necesitas ≥60% en cada parte del examen real</div>
      </div>

      <div>
        <h2 class="text-sm uppercase tracking-wider text-slate-300 mb-2 px-1">Resultados pregunta por pregunta</h2>
        <div class="space-y-2">${breakdown}</div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <a href="#/quiz/${quizState.quizId}" class="bg-white/5 py-3 rounded-xl text-center text-sm font-medium">🔁 Repetir</a>
        <a href="#/quiz" class="bg-lvred py-3 rounded-xl text-center text-sm font-semibold">Volver a quizzes</a>
      </div>
    </div>
  `;
  quizState = null;
}

// ============================================================
// PROGRESS (Me)
// ============================================================

function renderProgress() {
  const completed = state.completedDays.length;
  const pct = (completed / 40) * 100;
  const cardsTotal = Object.keys(state.cardStats).length;
  const cardsMastered = Object.values(state.cardStats).filter(s => (s.known || 0) >= 3).length;
  const quizCount = Object.values(state.quizAttempts).reduce((a, arr) => a + arr.length, 0);

  // Heatmap-style 40-day grid
  const completedSet = new Set(state.completedDays);
  const cells = CURRICULUM.map(d => {
    const done = completedSet.has(d.day);
    return `<a href="#/day/${d.day}" title="Día ${d.day}: ${escapeHtml(d.title)}" class="aspect-square rounded ${done ? 'bg-emerald-500/70' : 'bg-white/5'} hover:opacity-80"></a>`;
  }).join('');

  app.innerHTML = `
    <div class="fade-in space-y-6">
      <h1 class="text-2xl font-bold">Mi progreso</h1>

      <div class="bg-gradient-to-br from-lvred to-lvred-dark rounded-2xl p-5">
        <div class="text-xs uppercase tracking-wider text-white/70 mb-2">Avance global</div>
        <div class="text-4xl font-bold mb-2">${fmtPercent(pct)}</div>
        <div class="progress-track bg-white/20"><div class="progress-fill bg-white" style="width:${pct}%"></div></div>
        <div class="flex justify-between text-xs text-white/80 mt-2">
          <span>${completed} días</span>
          <span>${40 - completed} restantes</span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <div class="bg-white/5 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-amber-400">${state.streak || 0}</div>
          <div class="text-[10px] uppercase text-slate-400 mt-0.5">racha actual</div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-emerald-400">${cardsMastered}</div>
          <div class="text-[10px] uppercase text-slate-400 mt-0.5">cards dominadas</div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-purple-400">${quizCount}</div>
          <div class="text-[10px] uppercase text-slate-400 mt-0.5">quizzes hechos</div>
        </div>
      </div>

      <div>
        <h2 class="text-sm uppercase tracking-wider text-slate-300 mb-2 px-1">Calendario 40 días</h2>
        <div class="grid grid-cols-10 gap-1.5">${cells}</div>
      </div>

      <div>
        <h2 class="text-sm uppercase tracking-wider text-slate-300 mb-2 px-1">Historial de quizzes</h2>
        ${renderQuizHistory()}
      </div>

      <div class="space-y-2">
        <h2 class="text-sm uppercase tracking-wider text-slate-300 px-1">Herramientas</h2>
        <a href="#/exam" class="card-action block">🎯 Estructura del examen A2</a>
        <a href="#/downloads" class="card-action block">⬇ Descargar lecciones y flashcards</a>
        <a href="#/profiles" class="card-action block">👥 Perfiles (cambiar / crear / borrar)</a>
        <button id="reset-btn" class="card-action w-full text-left text-red-300">⚠️ Reiniciar todo mi progreso</button>
      </div>
    </div>
  `;

  document.getElementById('reset-btn').addEventListener('click', () => {
    const active = getActiveProfile();
    if (!active) return;
    if (confirm(`¿Seguro que quieres borrar el progreso del perfil "${active}"? Esta acción no se puede deshacer.`)) {
      localStorage.removeItem(profileStateKey(active));
      state = loadState();
      route();
    }
  });
}

function renderQuizHistory() {
  const all = Object.entries(state.quizAttempts).flatMap(([qid, attempts]) =>
    attempts.map(a => ({ ...a, qid }))
  ).sort((a, b) => b.date.localeCompare(a.date));

  if (!all.length) return `<div class="text-sm text-slate-500 italic px-1">Aún no has hecho ningún quiz.</div>`;

  return `<div class="space-y-2">${all.slice(0, 10).map(a => {
    const q = QUIZZES.find(qz => qz.id == a.qid);
    const pct = Math.round((a.score / a.total) * 100);
    const passed = pct >= 60;
    return `
      <div class="bg-white/5 rounded-xl p-3 flex items-center justify-between">
        <div>
          <div class="font-medium text-sm">${q?.name || 'Quiz'}</div>
          <div class="text-[11px] text-slate-400">${new Date(a.date).toLocaleString('es')}</div>
        </div>
        <div class="text-right">
          <div class="font-bold text-lg ${passed ? 'text-emerald-400' : 'text-amber-400'}">${pct}%</div>
          <div class="text-[10px] text-slate-400">${a.score}/${a.total}</div>
        </div>
      </div>
    `;
  }).join('')}</div>`;
}

// ============================================================
// GRAMMAR
// ============================================================

function renderGrammarList() {
  const items = GRAMMAR_TOPICS.map(t => `
    <a href="#/grammar/${t.id}" class="card-action block">
      <div class="flex items-center gap-3">
        <div class="text-3xl">${t.emoji}</div>
        <div class="flex-1">
          <div class="font-semibold">${escapeHtml(t.title)}</div>
        </div>
        <div class="text-slate-500">›</div>
      </div>
    </a>
  `).join('');

  app.innerHTML = `
    <div class="fade-in space-y-4">
      <div>
        <h1 class="text-2xl font-bold">Gramática · referencia</h1>
        <p class="text-sm text-slate-400 mt-1">Reglas, ejercicios y errores comunes de hispanohablantes</p>
      </div>
      <div class="space-y-2">${items}</div>
      <p class="text-xs text-slate-500 px-1 mt-4">Se agregan temas conforme avanzas en las lecciones.</p>
    </div>
  `;
}

async function renderGrammarTopic(idStr) {
  const id = parseInt(idStr, 10);
  const t = GRAMMAR_TOPICS.find(x => x.id === id);
  if (!t) return renderError(new Error('Tema no encontrado'));
  app.innerHTML = `<div class="text-center py-20 text-slate-500 animate-pulse">Cargando…</div>`;
  try {
    const body = await fetchText(t.file);
    app.innerHTML = `
      <div class="fade-in space-y-4">
        <a href="#/grammar" class="text-sm text-slate-400">← Gramática</a>
        <article class="prose-lesson">${marked.parse(body)}</article>
      </div>`;
  } catch (e) { renderError(e); }
}

// ============================================================
// EXAM INFO
// ============================================================

async function renderExamInfo() {
  app.innerHTML = `<div class="text-center py-20 text-slate-500 animate-pulse">Cargando…</div>`;
  try {
    const body = await fetchText('examen/estructura-A2.md');
    app.innerHTML = `
      <div class="fade-in space-y-4">
        <a href="#/me" class="text-sm text-slate-400">← Atrás</a>
        <article class="prose-lesson">${marked.parse(body)}</article>
      </div>`;
  } catch (e) { renderError(e); }
}

// ============================================================
// CONVERSATION MODE INFO
// ============================================================

async function renderConversation() {
  app.innerHTML = `<div class="text-center py-20 text-slate-500 animate-pulse">Cargando…</div>`;
  try {
    const body = await fetchText('conversacion/instrucciones.md');
    app.innerHTML = `
      <div class="fade-in space-y-4">
        <a href="#/" class="text-sm text-slate-400">← Inicio</a>
        <div class="bg-gradient-to-br from-purple-600/30 to-purple-900/30 rounded-2xl p-5 border border-purple-500/30">
          <div class="text-xl font-bold mb-2">💬 Modo conversación real</div>
          <p class="text-sm text-slate-200">Para hablar conmigo en letón, abre el chat de Claude y escribe:</p>
          <code class="block bg-ink-900 rounded-lg p-3 text-sm text-amber-300 mt-3">"Modo conversación día N"</code>
          <p class="text-xs text-slate-400 mt-3">Yo te respondo SOLO en letón. Al terminar te paso reporte de errores.</p>
        </div>
        <article class="prose-lesson">${marked.parse(body)}</article>
      </div>`;
  } catch (e) { renderError(e); }
}

// ============================================================
// PROFILE SETUP & MANAGEMENT
// ============================================================

function renderFirstProfileSetup() {
  app.innerHTML = `
    <div class="fade-in max-w-md mx-auto py-10 space-y-6">
      <div class="text-center">
        <div class="text-6xl mb-3">👋</div>
        <h1 class="text-2xl font-bold mb-2">Sveiki! Bienvenido a Latvisky</h1>
        <p class="text-sm text-slate-400">Crea tu perfil para empezar a rastrear tu progreso.</p>
      </div>
      <div class="space-y-3">
        <input type="text" id="new-profile-name" placeholder="Tu nombre (ej. Pedro)"
          class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-lvred"
          maxlength="24" autocomplete="off" />
        <button id="create-profile-btn" class="w-full bg-lvred py-3 rounded-xl font-semibold">
          Crear mi perfil
        </button>
      </div>
      <div class="bg-white/5 rounded-xl p-3 text-xs text-slate-400 space-y-1">
        <p><strong class="text-slate-200">📱 Local:</strong> tu progreso se guarda solo en este navegador (no hay servidor ni cuenta).</p>
        <p><strong class="text-slate-200">👥 Compartido:</strong> en el mismo dispositivo, varias personas pueden crear sus perfiles separados.</p>
        <p><strong class="text-slate-200">🔒 Privado:</strong> nadie más ve tus datos.</p>
      </div>
    </div>`;
  const input = document.getElementById('new-profile-name');
  input.focus();
  const submit = () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const r = createProfile(name);
    if (!r.ok) {
      if (r.reason === 'exists') alert('Ese nombre ya existe');
      else if (r.reason === 'empty') alert('Pon un nombre');
      return;
    }
    state = loadState();
    location.hash = '#/';
    route();
  };
  document.getElementById('create-profile-btn').addEventListener('click', submit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
}

function renderProfilesPage() {
  const profiles = loadProfiles();
  const active = getActiveProfile();

  app.innerHTML = `
    <div class="fade-in space-y-5">
      <div>
        <h1 class="text-2xl font-bold">Perfiles</h1>
        <p class="text-sm text-slate-400 mt-1">Cada perfil tiene su propio progreso. Todos viven en este navegador.</p>
      </div>

      <div class="space-y-2">
        ${profiles.map(p => `
          <div class="card-action ${p === active ? 'border-lvred/60 bg-lvred/10' : ''}">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-full bg-gradient-to-br from-lvred to-lvred-dark flex items-center justify-center font-bold text-white text-lg">
                ${escapeHtml(p[0].toUpperCase())}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">${escapeHtml(p)}</div>
                <div class="text-xs ${p === active ? 'text-lvred font-medium' : 'text-slate-500'}">
                  ${p === active ? '● Activo' : 'Inactivo'}
                </div>
              </div>
              <div class="flex gap-1.5">
                ${p !== active ? `<button data-action="switch" data-name="${escapeHtml(p)}" class="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">Cambiar a</button>` : ''}
                <button data-action="delete" data-name="${escapeHtml(p)}" class="text-xs bg-red-500/15 hover:bg-red-500/25 text-red-300 px-3 py-1.5 rounded-lg" title="Borrar perfil">✕</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="bg-white/5 rounded-xl p-4 space-y-3">
        <div class="text-sm font-semibold">+ Crear nuevo perfil</div>
        <div class="flex gap-2">
          <input type="text" id="new-profile-input" placeholder="Nombre"
            class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-lvred"
            maxlength="24" />
          <button id="create-new-profile-btn" class="bg-lvred px-4 py-2 rounded-lg font-medium text-sm">
            Crear
          </button>
        </div>
      </div>

      <div class="text-xs text-slate-500 space-y-1 px-1">
        <p>💡 ¿Quieres compartir Latvisky? Simplemente comparte la URL. Cada persona que entre desde su dispositivo tendrá sus propios perfiles y progreso.</p>
        <p>⚠️ Borrar un perfil elimina su progreso para siempre.</p>
      </div>
    </div>`;

  app.querySelectorAll('[data-action="switch"]').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveProfile(btn.dataset.name);
      state = loadState();
      renderProfilePill();
      renderStreakPill();
      location.hash = '#/';
      route();
    });
  });
  app.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      if (!confirm(`¿Borrar el perfil "${name}"? Su progreso se perderá para siempre.`)) return;
      deleteProfile(name);
      const remaining = loadProfiles();
      if (remaining.length === 0) {
        state = null;
        location.hash = '#/';
        route();
      } else {
        state = loadState();
        renderProfilePill();
        renderProfilesPage();
      }
    });
  });
  const input = document.getElementById('new-profile-input');
  document.getElementById('create-new-profile-btn').addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) return;
    const r = createProfile(name);
    if (!r.ok) {
      if (r.reason === 'exists') alert('Ese nombre ya existe');
      return;
    }
    state = loadState();
    renderProfilePill();
    location.hash = '#/';
    route();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('create-new-profile-btn').click();
  });
}

// ============================================================
// DOWNLOADS PAGE
// ============================================================

function renderDownloadsPage() {
  const lessonItems = CURRICULUM.map(d => `
    <button data-download="${d.file}" data-name="dia-${String(d.day).padStart(2,'0')}.md" class="card-action w-full text-left">
      <div class="flex items-center gap-3">
        <div class="text-xl">📄</div>
        <div class="flex-1">
          <div class="font-semibold text-sm">Día ${d.day} · ${mdToInline(d.title)}</div>
          <div class="text-xs text-slate-400">${d.topic}</div>
        </div>
        <div class="text-slate-500">⬇</div>
      </div>
    </button>
  `).join('');

  const deckItems = DECKS.map(d => `
    <button data-download="${d.file}" data-name="${d.file.split('/').pop()}" class="card-action w-full text-left">
      <div class="flex items-center gap-3">
        <div class="text-xl">🃏</div>
        <div class="flex-1">
          <div class="font-semibold text-sm">${escapeHtml(d.name)}</div>
          <div class="text-xs text-slate-400">CSV listo para Anki / Quizlet</div>
        </div>
        <div class="text-slate-500">⬇</div>
      </div>
    </button>
  `).join('');

  const grammarItems = GRAMMAR_TOPICS.map(g => `
    <button data-download="${g.file}" data-name="${g.file.split('/').pop()}" class="card-action w-full text-left">
      <div class="flex items-center gap-3">
        <div class="text-xl">${g.emoji}</div>
        <div class="flex-1">
          <div class="font-semibold text-sm">${escapeHtml(g.title)}</div>
        </div>
        <div class="text-slate-500">⬇</div>
      </div>
    </button>
  `).join('');

  app.innerHTML = `
    <div class="fade-in space-y-6">
      <div>
        <h1 class="text-2xl font-bold">Descargas</h1>
        <p class="text-sm text-slate-400 mt-1">Guarda cualquier lección, mazo o referencia en tu dispositivo. Útil para imprimir, compartir o leer offline.</p>
      </div>

      <div class="space-y-2">
        <button id="dl-all-btn" class="w-full bg-lvred py-3 rounded-xl font-semibold">📦 Descargar TODO el curso (un archivo .md unificado)</button>
        <button id="dl-all-anki-btn" class="w-full bg-white/10 py-3 rounded-xl font-medium">🃏 Descargar todas las flashcards (CSV combinado para Anki)</button>
      </div>

      <section>
        <h2 class="text-sm uppercase tracking-wider text-slate-300 mb-2 px-1">Lecciones (40)</h2>
        <div class="space-y-2">${lessonItems}</div>
      </section>

      <section>
        <h2 class="text-sm uppercase tracking-wider text-slate-300 mb-2 px-1">Flashcards</h2>
        <div class="space-y-2">${deckItems}</div>
      </section>

      <section>
        <h2 class="text-sm uppercase tracking-wider text-slate-300 mb-2 px-1">Referencias gramaticales</h2>
        <div class="space-y-2">${grammarItems}</div>
      </section>
    </div>`;

  app.querySelectorAll('[data-download]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        const text = await fetchText(btn.dataset.download);
        const mime = btn.dataset.download.endsWith('.csv') ? 'text/csv;charset=utf-8' : 'text/markdown;charset=utf-8';
        downloadBlob(btn.dataset.name, text, mime);
      } catch (e) { alert('Error al descargar: ' + e.message); }
    });
  });

  document.getElementById('dl-all-btn').addEventListener('click', async () => {
    const parts = [];
    parts.push('# Latvisky — Curso completo (40 días)\n\n---\n\n');
    for (const d of CURRICULUM) {
      try {
        const text = await fetchText(d.file);
        parts.push(`\n\n# ═══ DÍA ${d.day} ═══\n\n${text}\n\n`);
      } catch (e) { /* skip missing */ }
    }
    downloadBlob('latvisky-curso-completo.md', parts.join(''), 'text/markdown;charset=utf-8');
  });

  document.getElementById('dl-all-anki-btn').addEventListener('click', async () => {
    const parts = ['letón;español;ejemplo_letón;ejemplo_español'];
    for (const d of DECKS) {
      try {
        const text = await fetchText(d.file);
        const lines = text.trim().split(/\r?\n/);
        lines.shift(); // drop header
        parts.push(...lines);
      } catch (e) { /* skip */ }
    }
    downloadBlob('latvisky-flashcards-todas.csv', parts.join('\n'), 'text/csv;charset=utf-8');
  });
}
