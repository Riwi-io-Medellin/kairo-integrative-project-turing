/**
 * assets/js/profile.js
 * Coder Profile Session — dynamic data loading, edit & CV download.
 */

const API = 'http://localhost:3000/api';

/* ── State ── */
let profileData = null;
let _csrfToken = null;

/* ─────────────────────────────────────────
   CSRF TOKEN HELPER
───────────────────────────────────────── */
async function getCsrfToken() {
  if (_csrfToken) return _csrfToken;
  try {
    const res = await fetch(`${API}/csrf-token`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      _csrfToken = data.csrfToken;
    }
  } catch {
    // If CSRF endpoint is unreachable, proceed without token (dev fallback)
    console.warn('[CSRF] Could not fetch CSRF token');
  }
  return _csrfToken || '';
}

/* ─────────────────────────────────────────
   BOOT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  setupTheme();
  setupLogout();
});

/* ─────────────────────────────────────────
   LOAD PROFILE
───────────────────────────────────────── */
async function loadProfile() {
  showLoading(true);
  hideError();

  try {
    const res = await fetch(`${API}/coder/profile`, { credentials: 'include' });

    if (res.status === 401) {
      window.location.href = '../auth/login.html';
      return;
    }
    if (res.status === 403) {
      window.location.href = './onboarding.html';
      return;
    }
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    profileData = data.profile;
    renderProfile(profileData);
    showLoading(false);
    document.getElementById('profile-content').classList.remove('hidden');
  } catch (err) {
    console.error('[loadProfile]', err);
    showLoading(false);
    showError(err.message);
  }
}

/* ─────────────────────────────────────────
   RENDER
───────────────────────────────────────── */
function renderProfile(p) {
  // Header info
  setText('profile-name', p.fullName || '—');
  setText('profile-jobtitle', p.jobTitle || 'Full-Stack Developer in Training');
  setText('profile-clan', p.clan ? `Clan ${p.clan}` : 'Sin clan');
  setText('val-email', p.email || '—');
  setText('val-module', p.moduleName || '—');

  if (p.phone) {
    setText('val-phone', p.phone);
    show('contact-phone');
  }
  if (p.location) {
    setText('val-location', p.location);
    show('contact-location');
  }

  // Avatar
  if (p.avatarUrl && /^https?:\/\//i.test(p.avatarUrl)) {
    const circle = document.getElementById('avatar-circle');
    const img = document.createElement('img');
    img.src = p.avatarUrl;
    img.alt = 'Avatar';
    img.className = 'avatar-img';
    circle.innerHTML = '';
    circle.appendChild(img);
  }

  // Bio
  setText('bio-text', p.bio || 'Sin descripción personal todavía. ¡Edita tu perfil para agregar una!');

  // Social links
  renderSocialLinks(p.socialLinks || {});

  // Soft skills
  if (p.softSkills) {
    renderSoftSkills(p.softSkills);
  }

  // Technical skills
  renderTechSkills(p.technicalSkills || []);

  // Experience
  renderExperience(p.experience || []);

  // Education
  renderEducation(p.education || []);
}

function renderSocialLinks(links) {
  const iconMap = {
    github:   { icon: 'fa-brands fa-github',   label: 'GitHub' },
    linkedin: { icon: 'fa-brands fa-linkedin',  label: 'LinkedIn' },
    twitter:  { icon: 'fa-brands fa-x-twitter', label: 'X/Twitter' },
    discord:  { icon: 'fa-brands fa-discord',   label: 'Discord' },
    portfolio:{ icon: 'fa-solid fa-globe',      label: 'Portfolio' },
  };

  const container = document.getElementById('social-links');
  const items = Object.entries(links).filter(([, v]) => v);

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-state-small">Sin redes sociales.</p>';
    return;
  }

  container.innerHTML = items.map(([key, url]) => {
    const meta = iconMap[key] || { icon: 'fa-solid fa-link', label: key };
    const isSafeLink = /^https?:\/\//i.test(url);
    if (!isSafeLink) return ''; // skip unsafe URLs
    const safeHref = encodeURI(url);
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="social-btn" title="${meta.label}">
      <i class="${meta.icon}"></i>
    </a>`;
  }).join('');
}

function renderSoftSkills(ss) {
  if (ss.average !== null && ss.average !== undefined) {
    setText('softskills-avg', `${ss.average} / 5`);
  }

  if (ss.learningStyle) {
    setText('ls-value', ss.learningStyle);
    show('learning-style-block');
  }

  const skills = [
    { label: 'Autonomía',          value: ss.autonomy },
    { label: 'Gestión del tiempo', value: ss.timeManagement },
    { label: 'Resolución de problemas', value: ss.problemSolving },
    { label: 'Comunicación',       value: ss.communication },
    { label: 'Trabajo en equipo',  value: ss.teamwork },
  ];

  const grid = document.getElementById('soft-skills-grid');
  grid.innerHTML = skills.map(s => {
    const pct = s.value !== null ? (s.value / 5) * 100 : 0;
    const color = pct >= 70 ? 'green' : pct >= 40 ? 'amber' : 'red';
    return `
      <div class="skill-item">
        <div class="skill-label">
          <span>${s.label}</span>
          <span class="skill-val">${s.value ?? '—'}/5</span>
        </div>
        <div class="skill-bar-bg">
          <div class="skill-bar-fill ${color}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function renderTechSkills(skills) {
  const container = document.getElementById('tech-skills-list');
  if (!skills.length) {
    container.innerHTML = '<p class="empty-state">No hay habilidades técnicas registradas aún.</p>';
    return;
  }
  const levelIcons = { beginner: '●○○', intermediate: '●●○', advanced: '●●●' };
  container.innerHTML = `<div class="tech-tags">${
    skills.map(s => `
      <div class="tech-tag">
        <span class="tech-name">${s.name}</span>
        <span class="tech-level">${levelIcons[s.level] || ''}</span>
        ${s.category ? `<span class="tech-cat">${s.category}</span>` : ''}
      </div>`).join('')
  }</div>`;
}

function renderExperience(exp) {
  const container = document.getElementById('experience-list');
  if (!exp.length) {
    container.innerHTML = '<p class="empty-state">No hay experiencia registrada aún.</p>';
    return;
  }
  container.innerHTML = exp.map(e => `
    <div class="timeline-entry">
      <div class="timeline-dot"></div>
      <div class="timeline-body">
        <div class="timeline-header">
          <strong>${e.role}</strong>
          <span class="timeline-date">${e.startDate} – ${e.endDate || 'Presente'}</span>
        </div>
        <p class="timeline-company">${e.company}</p>
        ${e.description ? `<p class="timeline-desc">${e.description}</p>` : ''}
      </div>
    </div>`).join('');
}

function renderEducation(edu) {
  const container = document.getElementById('education-list');
  if (!edu.length) {
    // Always show Riwi as default education
    container.innerHTML = `
      <div class="timeline-entry">
        <div class="timeline-dot"></div>
        <div class="timeline-body">
          <div class="timeline-header">
            <strong>Bootcamp Full-Stack</strong>
            <span class="timeline-date">${new Date().getFullYear()}</span>
          </div>
          <p class="timeline-company">Riwi</p>
        </div>
      </div>`;
    return;
  }
  container.innerHTML = edu.map(e => `
    <div class="timeline-entry">
      <div class="timeline-dot"></div>
      <div class="timeline-body">
        <div class="timeline-header">
          <strong>${e.degree} – ${e.field}</strong>
          <span class="timeline-date">${e.startYear} – ${e.endYear || 'Presente'}</span>
        </div>
        <p class="timeline-company">${e.institution}</p>
      </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────
   EDIT MODAL
───────────────────────────────────────── */
function toggleEditMode() {
  if (!profileData) return;
  openEditModal();
}

function openEditModal() {
  const p = profileData;
  const modal = document.getElementById('edit-modal');

  // Pre-fill form
  setValue('edit-jobtitle', p.jobTitle || '');
  setValue('edit-bio', p.bio || '');
  setValue('edit-phone', p.phone || '');
  setValue('edit-location', p.location || '');
  setValue('edit-github', p.socialLinks?.github || '');
  setValue('edit-linkedin', p.socialLinks?.linkedin || '');
  setValue('edit-discord', p.socialLinks?.discord || '');
  setValue('edit-portfolio', p.socialLinks?.portfolio || '');

  // Tech skills editor
  renderTechSkillsEditor(p.technicalSkills || []);

  // Char count for bio
  const bioEl = document.getElementById('edit-bio');
  updateCharCount(bioEl);
  bioEl.addEventListener('input', () => updateCharCount(bioEl));

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function renderTechSkillsEditor(skills) {
  const container = document.getElementById('tech-skills-editor');
  container.innerHTML = '';
  skills.forEach((s, i) => addTechSkillRow(s, i));
}

function addTechSkillRow(skill = {}, index = Date.now()) {
  const container = document.getElementById('tech-skills-editor');
  const row = document.createElement('div');
  row.className = 'tech-skill-row';
  row.dataset.index = index;
  row.innerHTML = `
    <input type="text" class="ts-name" placeholder="Nombre (ej. JavaScript)" value="${skill.name || ''}" />
    <select class="ts-level">
      <option value="beginner" ${skill.level === 'beginner' ? 'selected' : ''}>Básico</option>
      <option value="intermediate" ${skill.level === 'intermediate' ? 'selected' : ''}>Intermedio</option>
      <option value="advanced" ${skill.level === 'advanced' ? 'selected' : ''}>Avanzado</option>
    </select>
    <input type="text" class="ts-cat" placeholder="Categoría (ej. Frontend)" value="${skill.category || ''}" />
    <button type="button" class="btn-remove-skill" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-trash"></i>
    </button>`;
  container.appendChild(row);
}

async function saveProfile(event) {
  event.preventDefault();
  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando…';

  try {
    // Collect tech skills from editor
    const techSkills = Array.from(document.querySelectorAll('.tech-skill-row'))
      .map(row => ({
        name:     row.querySelector('.ts-name').value.trim(),
        level:    row.querySelector('.ts-level').value,
        category: row.querySelector('.ts-cat').value.trim(),
      }))
      .filter(s => s.name);

    const payload = {
      jobTitle:   document.getElementById('edit-jobtitle').value.trim(),
      bio:        document.getElementById('edit-bio').value.trim(),
      phone:      document.getElementById('edit-phone').value.trim(),
      location:   document.getElementById('edit-location').value.trim(),
      socialLinks: {
        github:   document.getElementById('edit-github').value.trim(),
        linkedin: document.getElementById('edit-linkedin').value.trim(),
        discord:  document.getElementById('edit-discord').value.trim(),
        portfolio:document.getElementById('edit-portfolio').value.trim(),
      },
      technicalSkills: techSkills,
    };

    const csrfToken = await getCsrfToken();
    const res = await fetch(`${API}/coder/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar');
    }

    closeEditModal();
    showToast('Perfil actualizado ✓', 'success');
    await loadProfile(); // Reload to show updated data
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
  }
}

/* ─────────────────────────────────────────
   CV DOWNLOAD
───────────────────────────────────────── */
async function downloadCV() {
  const btn = document.getElementById('btn-cv');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando…';

  try {
    const res = await fetch(`${API}/coder/profile/cv`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error al generar CV');

    const html = await res.text();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open in new tab for print-to-PDF
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback: download directly
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_${profileData?.fullName?.replace(/\s+/g, '_') || 'coder'}.html`;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast('CV generado. Usa Ctrl+P / Cmd+P para imprimir como PDF.', 'success');
  } catch (err) {
    showToast('Error al generar CV: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Descargar CV';
  }
}

/* ─────────────────────────────────────────
   THEME
───────────────────────────────────────── */
function setupTheme() {
  const btn = document.getElementById('btn-theme');
  const moon = document.getElementById('icon-moon');
  const sun  = document.getElementById('icon-sun');
  const html = document.documentElement;

  const saved = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', saved);
  updateThemeIcons(saved === 'light');

  btn.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcons(next === 'light');
  });

  function updateThemeIcons(isLight) {
    moon.style.display = isLight ? 'none' : 'block';
    sun.style.display  = isLight ? 'block' : 'none';
  }
}

/* ─────────────────────────────────────────
   LOGOUT
───────────────────────────────────────── */
function setupLogout() {
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    try {
      const csrfToken = await getCsrfToken();
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-csrf-token': csrfToken },
      });
    } finally {
      window.location.href = '../auth/login.html';
    }
  });
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}

function showLoading(visible) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.className = visible ? 'loading-overlay' : 'loading-overlay hidden';
}

function hideError() {
  document.getElementById('error-banner')?.classList.add('hidden');
}

function showError(msg) {
  const banner = document.getElementById('error-banner');
  const msgEl  = document.getElementById('error-msg');
  if (banner) banner.classList.remove('hidden');
  if (msgEl)  msgEl.textContent = msg;
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const icon  = document.getElementById('toast-icon');
  const msgEl = document.getElementById('toast-msg');
  if (!toast) return;

  icon.className = type === 'success'
    ? 'fa-solid fa-circle-check'
    : 'fa-solid fa-circle-exclamation';
  toast.className = `toast-coder toast-${type}`;
  msgEl.textContent = msg;

  setTimeout(() => { toast.className = 'toast-coder hidden'; }, 3500);
}

function updateCharCount(textarea) {
  const counter = document.getElementById('bio-chars');
  if (counter) counter.textContent = `${textarea.value.length}/500`;
}

// Expose to HTML onclick handlers
window.downloadCV = downloadCV;
window.toggleEditMode = toggleEditMode;
window.closeEditModal = closeEditModal;
window.saveProfile = saveProfile;
window.addTechSkillRow = addTechSkillRow;
window.addTechSkill = () => openEditModal();
window.addExperience = () => openEditModal();
window.loadProfile = loadProfile;
