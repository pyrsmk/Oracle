fetch('icons.svg').then(r => r.text()).then(svg => { document.body.insertAdjacentHTML('afterbegin', svg); });

/* ── Canvas étoilé ── */
(function initStars() {
  const canvas = document.getElementById('canvas-stars');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 8000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() < 0.1 ? 1.4 : Math.random() < 0.3 ? 0.9 : 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2
      });
    }
  }

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.01;
    for (const s of stars) {
      const alpha = 0.15 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); createStars(); });
  resize(); createStars(); draw();
})();

window.addEventListener('DOMContentLoaded', loadProfiles);

function getDateFr() {
  return new Date().toLocaleDateString('fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Profils ── */
function loadProfiles() {
  const profiles = JSON.parse(localStorage.getItem('oracle_profiles') || '{}');
  const sel = document.getElementById('profile-select');
  const current = sel.value;
  sel.innerHTML = '<option value="">— Sélectionner un profil —</option>';
  Object.keys(profiles).sort().forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (name === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

function saveProfile() {
  const key = document.getElementById('prenom').value.trim();
  if (!key) return;
  const profiles = JSON.parse(localStorage.getItem('oracle_profiles') || '{}');
  profiles[key] = {
    prenom:          document.getElementById('prenom').value.trim(),
    dateNaissance:   document.getElementById('date-naissance').value,
    heureNaissance:  document.getElementById('heure-naissance').value,
    lieuNaissance:   document.getElementById('lieu-naissance').value.trim(),
  };
  localStorage.setItem('oracle_profiles', JSON.stringify(profiles));
  loadProfiles();
  document.getElementById('profile-select').value = key;
}

function loadSelectedProfile() {
  const key = document.getElementById('profile-select').value;
  if (!key) return;
  const profiles = JSON.parse(localStorage.getItem('oracle_profiles') || '{}');
  const p = profiles[key];
  if (!p) return;
  document.getElementById('prenom').value           = p.prenom || '';
  document.getElementById('date-naissance').value   = p.dateNaissance || '';
  document.getElementById('heure-naissance').value  = p.heureNaissance || '';
  document.getElementById('lieu-naissance').value   = p.lieuNaissance || '';
}

function deleteSelectedProfile() {
  const key = document.getElementById('profile-select').value;
  if (!key) return;
  if (!confirm(`Supprimer le profil « ${key} » ?`)) return;
  const profiles = JSON.parse(localStorage.getItem('oracle_profiles') || '{}');
  delete profiles[key];
  localStorage.setItem('oracle_profiles', JSON.stringify(profiles));
  loadProfiles();
}

/* ── Helpers ── */
function svgUse(id, cls, size) {
  const c = cls ? ` class="${cls}"` : '';
  const s = size || 24;
  return `<svg width="${s}" height="${s}"${c} aria-hidden="true"><use href="#${id}"/></svg>`;
}

/* ── Oracle ── */
let lastFormData = null;

function oracleCacheKey({ prenom, dateNaissance, lieuNaissance }) {
  const today = new Date().toISOString().slice(0, 10);
  return `oracle:${prenom}:${dateNaissance}:${lieuNaissance}:${today}`;
}

function oracleCacheGet(formData) {
  return localStorage.getItem(oracleCacheKey(formData)) || null;
}

function oracleCacheSave(formData, text) {
  localStorage.setItem(oracleCacheKey(formData), text);
}

async function consulterOracle() {
  const prenom          = document.getElementById('prenom').value.trim();
  const dateNaissance   = document.getElementById('date-naissance').value;
  const heureNaissance  = document.getElementById('heure-naissance').value || null;
  const lieuNaissance   = document.getElementById('lieu-naissance').value.trim();
  lastFormData = { prenom, dateNaissance, heureNaissance, lieuNaissance };

  if (!prenom || !dateNaissance || !lieuNaissance) {
    alert('Veuillez renseigner votre prénom, votre date de naissance et votre lieu de naissance.');
    return;
  }

  const btn = document.getElementById('btn-oracle');
  btn.disabled = true;

  document.getElementById('form-panel').style.display = 'none';
  const rp = document.getElementById('result-panel');
  rp.classList.add('show');

  document.getElementById('sigils-grid').innerHTML = '';
  document.getElementById('btn-reset').style.display = 'none';
  document.getElementById('synthese-container').innerHTML =
    '<div class="synthese synthese-loading"></div>';
  document.getElementById('transits-container').innerHTML = `
    <div class="prophecy-wrap">
      <div class="loading">
        <div class="orb"></div>
        <div class="loading-msg">Calcul du thème natal en cours…</div>
      </div>
    </div>
  `;

  try {
    const cachedOracle = oracleCacheGet(lastFormData);
    const res = await fetch('/api/horoscope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prenom, dateNaissance, heureNaissance, lieuNaissance, skipOracle: !!cachedOracle })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erreur || 'Erreur inconnue');
    if (cachedOracle) data.oracle = cachedOracle;
    renderHoroscope(data);
  } catch (e) {
    document.getElementById('synthese-container').innerHTML = '';
    document.getElementById('transits-container').innerHTML = `
      <div class="prophecy-wrap">
        <div class="error-box">
          Les astres sont troublés… L'Oracle ne peut se manifester.<br>
          <small style="opacity:0.65;font-size:0.85em">${e.message}</small>
        </div>
      </div>
    `;
  }

  btn.disabled = false;
}

function renderHoroscope(data) {
  const { natal, transits, lune, synthese, oracle } = data;

  // Sigils : Soleil natal | Lune natale | Ascendant
  const sigils = document.getElementById('sigils-grid');
  const ascNote = natal.heureInconnue ? '<div class="sigil-sub">~midi</div>' : '';
  sigils.innerHTML = `
    <div class="sigil">
      <span class="sigil-icon">${svgUse('sign-' + natal.soleil.signeKey, '', 32)}</span>
      <div class="sigil-label">Soleil natal</div>
      <div class="sigil-value">${natal.soleil.signe}</div>
      <div class="sigil-sub">${natal.soleil.degres}</div>
    </div>
    <div class="sigil">
      <span class="sigil-icon">${svgUse('sign-' + natal.lune.signeKey, '', 32)}</span>
      <div class="sigil-label">Lune natale</div>
      <div class="sigil-value">${natal.lune.signe}</div>
      <div class="sigil-sub">${natal.lune.degres}</div>
    </div>
    <div class="sigil">
      <span class="sigil-icon">${svgUse('sign-' + natal.ascendant.signeKey, '', 32)}</span>
      <div class="sigil-label">Ascendant</div>
      <div class="sigil-value">${natal.ascendant.signe}</div>
      ${ascNote || `<div class="sigil-sub">${natal.ascendant.degres}</div>`}
    </div>
  `;

  if (oracle) oracleCacheSave(lastFormData, oracle);
  renderOracleSection(oracle, data.oracleError, data.oracleRetryDelay);

  // Synthèse dans son propre bloc
  document.getElementById('synthese-container').innerHTML =
    `<div class="synthese">${synthese}</div>`;

  // Afficher le bouton reset
  document.getElementById('btn-reset').style.display = '';

  const noticeHtml = natal.heureInconnue
    ? `<div class="notice">Ascendant et maisons calculés pour midi — peu fiables sans heure exacte de naissance.</div>`
    : '';

  const moonHtml = `
    <div class="moon-card">
      ${svgUse('moon-' + lune.phaseKey, 'icon-moon', 40)}
      <div class="moon-info">
        <div class="moon-title">Lune du jour · ${Math.round(lune.illumination * 100)}% d'illumination</div>
        <div class="moon-phase">${lune.phase} en ${lune.signe}</div>
        <div class="moon-interp">${lune.interpretation}</div>
      </div>
    </div>
  `;

  const transitsInnerHtml = transits.length ? `
    <div class="transit-section">
      ${transits.map(t => `
        <div class="transit-card" data-tonalite="${t.tonalite}">
          <div class="transit-planets">
            ${svgUse('planet-' + t.planeteTransCle, '', 22)}→${svgUse('planet-' + t.planeteNataleCle, '', 22)}
          </div>
          <div class="transit-body">
            <span class="transit-aspect-badge">${t.aspectNom}</span>
            <div class="transit-text">${t.interpretation}</div>
          </div>
          <div class="transit-orbe">${t.orbe}°</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  document.getElementById('transits-container').innerHTML = `
    <div class="prophecy-wrap">
      ${noticeHtml}
      <details class="transit-collapsible">
        <summary>${svgUse('icon-chevron', 'chevron', 16)} Thème astral (avancé)</summary>
        <div class="astral-theme">
          ${moonHtml}
          ${transitsInnerHtml}
        </div>
      </details>
    </div>
  `;
}

function renderOracleSection(oracle, oracleError, oracleRetryDelay) {
  const dateFr = getDateFr();
  const container = document.getElementById('oracle-container');
  if (oracle) {
    container.innerHTML = `
      <div class="oracle-reading">
        <div class="oracle-reading-label">✦ &nbsp; Parole de l'Oracle du ${dateFr} &nbsp; ✦</div>
        <div class="oracle-reading-text">${oracle}</div>
      </div>`;
  } else if (oracleError) {
    const delay = oracleRetryDelay ? ` dans ${oracleRetryDelay}` : ' plus tard';
    const msg = oracleError === 'rate_limit'
      ? `Trop de requêtes IA. Veuillez réessayer${delay}.`
      : 'La lecture oraculaire est indisponible pour le moment.';
    container.innerHTML = `
      <div class="oracle-reading">
        <div class="oracle-reading-label">✦ &nbsp; Parole de l'Oracle du ${dateFr} &nbsp; ✦</div>
        <div class="oracle-error">${msg}</div>
        <button class="btn-oracle-retry" onclick="retryOracle(this)">↻ &nbsp; Réessayer</button>
      </div>`;
  } else {
    container.innerHTML = '';
  }
}

async function retryOracle(btn) {
  if (!lastFormData) return;
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const res = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lastFormData)
    });
    const data = await res.json();
    if (data.oracle) oracleCacheSave(lastFormData, data.oracle);
    renderOracleSection(data.oracle, data.oracleError, data.oracleRetryDelay);
  } catch {
    btn.disabled = false;
    btn.textContent = '↻   Réessayer';
  }
}

function resetOracle() {
  document.getElementById('form-panel').style.display = 'flex';
  document.getElementById('result-panel').classList.remove('show');
  setTimeout(() => {
    document.getElementById('result-panel').style.display = '';
  }, 10);
}
