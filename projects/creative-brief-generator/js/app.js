let autosaveTimer = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  const indicator = document.getElementById('autosaveIndicator');
  if (indicator) indicator.textContent = 'Saving…';
  autosaveTimer = setTimeout(() => {
    AppState.saveDraft();
    if (indicator) indicator.textContent = `Draft saved ${new Date().toLocaleTimeString()}`;
  }, 500);
}

function initModeSwitching() {
  const buttons = document.querySelectorAll('.mode-btn');
  const panels = {
    form: document.getElementById('formModePanel'),
    nlimport: document.getElementById('nlImportModePanel')
  };
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.entries(panels).forEach(([mode, panel]) => {
        panel.classList.toggle('hidden', mode !== btn.dataset.mode);
      });
    });
  });
}

function expandCollapsible(targetId) {
  const body = document.getElementById(targetId);
  const toggle = document.querySelector(`.card-header-toggle[data-target="${targetId}"]`);
  if (body) body.classList.add('expanded');
  if (toggle) toggle.classList.add('expanded');
}

function initCollapsibleSections() {
  document.querySelectorAll('.card-header-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.dataset.target;
      const body = document.getElementById(targetId);
      const expanded = body.classList.toggle('expanded');
      toggle.classList.toggle('expanded', expanded);
    });
  });
}

function initExpanders() {
  document.querySelectorAll('.expander-toggle').forEach(toggle => {
    const baseLabel = toggle.textContent;
    const hideLabel = baseLabel.replace(/^\+/, '−').replace('Add', 'Hide');
    toggle.addEventListener('click', () => {
      const body = document.getElementById(toggle.dataset.target);
      const expanded = body.classList.toggle('expanded');
      toggle.textContent = expanded ? hideLabel : baseLabel;
    });
  });
}

function autoExpandFilledSections() {
  document.querySelectorAll('.expander-body, .collapsible-body').forEach(body => {
    const hasValue = Array.from(body.querySelectorAll('input, textarea')).some(el => el.value && el.value.trim());
    const hasTag = body.querySelectorAll('.tag-pill').length > 0;
    const hasReference = body.querySelectorAll('.reference-card').length > 0;
    if (!hasValue && !hasTag && !hasReference) return;
    body.classList.add('expanded');
    const expanderToggle = document.querySelector(`.expander-toggle[data-target="${body.id}"]`);
    if (expanderToggle) expanderToggle.textContent = expanderToggle.textContent.replace(/^\+/, '−').replace('Add', 'Hide');
    const cardToggle = document.querySelector(`.card-header-toggle[data-target="${body.id}"]`);
    if (cardToggle) cardToggle.classList.add('expanded');
  });
}

function initSectionNav() {
  document.querySelectorAll('.nav-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelector('.mode-btn[data-mode="form"]').click();
      document.querySelectorAll('.nav-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const targetId = chip.dataset.target;
      if (targetId === 'references') expandCollapsible('referencesBody');
      if (targetId === 'ai-context') expandCollapsible('aiContextBody');
      document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function refreshSavedBriefsSelect() {
  const select = document.getElementById('savedBriefsSelect');
  const all = AppState.getAllSaved();
  const current = AppState.data.meta.savedName || '';
  select.innerHTML = '<option value="">New brief</option>' +
    Object.keys(all).map(name => `<option value="${name}">${name}</option>`).join('');
  select.value = current;
}

function initSavedBriefs() {
  refreshSavedBriefsSelect();

  document.getElementById('savedBriefsSelect').addEventListener('change', (e) => {
    if (!e.target.value) {
      AppState.reset();
    } else {
      AppState.loadNamed(e.target.value);
    }
    refreshFormFromState();
    showToast(e.target.value ? `Loaded "${e.target.value}".` : 'Started a new brief.');
  });

  document.getElementById('saveBriefBtn').addEventListener('click', () => {
    const suggested = AppState.data.meta.savedName || AppState.data.project.name || 'Untitled brief';
    const name = window.prompt('Save this brief as:', suggested);
    if (!name) return;
    AppState.saveNamed(name.trim());
    refreshSavedBriefsSelect();
    showToast(`Saved as "${name.trim()}".`);
  });

  document.getElementById('deleteBriefBtn').addEventListener('click', () => {
    const select = document.getElementById('savedBriefsSelect');
    if (!select.value) { showToast('No saved brief selected.'); return; }
    if (!window.confirm(`Delete saved brief "${select.value}"?`)) return;
    AppState.deleteNamed(select.value);
    AppState.reset();
    refreshSavedBriefsSelect();
    refreshFormFromState();
    showToast('Brief deleted.');
  });
}

// ───────── NL Import ─────────
function initNlImport() {
  document.getElementById('nlImportParseBtn').addEventListener('click', () => {
    const text = document.getElementById('nlImportTextarea').value.trim();
    if (!text) { showToast('Write a description first.'); return; }

    const { matches, leftover } = parseNlImport(text);
    applyNlMatches(matches);
    if (leftover) {
      AppState.data.references.inspiration_notes = [AppState.data.references.inspiration_notes, leftover]
        .filter(Boolean).join(' ');
    }
    refreshFormFromState();
    scheduleAutosave();

    const resultBox = document.getElementById('nlImportResult');
    const list = document.getElementById('nlMatchList');
    resultBox.classList.remove('hidden');
    list.innerHTML = matches.length
      ? matches.map(m => `<li><b>${m.label}:</b> ${Array.isArray(m.value) ? m.value.join(', ') : m.value}</li>`).join('')
      : '<li>No fields matched — everything was added to Inspiration Notes for you to sort manually.</li>';

    showToast('Parsed — review matched fields and the form.');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  AppState.loadDraft();
  initForm();
  initReferences();
  initExport();
  initModeSwitching();
  initSectionNav();
  initCollapsibleSections();
  initExpanders();
  initSavedBriefs();
  initNlImport();
  autoExpandFilledSections();
});
