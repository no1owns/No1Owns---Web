const FIELD_BINDINGS = [
  ['f-project-name', 'project.name'],
  ['f-project-client', 'project.client'],
  ['f-project-budget', 'project.budget_range'],
  ['f-project-lead', 'project.lead'],
  ['f-strategy-bizobj', 'strategy.business_objective'],
  ['f-strategy-creativeobj', 'strategy.creative_objective'],
  ['f-strategy-audience-primary', 'strategy.audience_primary'],
  ['f-strategy-audience-secondary', 'strategy.audience_secondary'],
  ['f-strategy-keymessage', 'strategy.key_message'],
  ['f-strategy-positioning', 'strategy.brand_positioning'],
  ['f-strategy-tone-notes', 'strategy.tone_notes'],
  ['f-execution-timeline', 'execution.timeline'],
  ['f-execution-constraints', 'execution.constraints'],
  ['f-execution-metrics', 'execution.success_metrics'],
  ['f-references-notes', 'references.inspiration_notes']
];

const REQUIRED_FIELDS = ['f-project-name', 'f-strategy-audience-primary', 'f-strategy-keymessage'];

function initFieldBindings() {
  FIELD_BINDINGS.forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = getByPath(AppState.data, path) || '';
    el.addEventListener('input', () => {
      setByPath(AppState.data, path, el.value);
      clearFieldError(id);
      scheduleAutosave();
    });
  });
}

function clearFieldError(id) {
  const errEl = document.querySelector(`[data-error-for="${id}"]`);
  if (errEl) errEl.textContent = '';
  const inputEl = document.getElementById(id);
  if (inputEl) inputEl.style.borderColor = '';
}

function validateForm() {
  let valid = true;
  REQUIRED_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    const errEl = document.querySelector(`[data-error-for="${id}"]`);
    if (!el.value.trim()) {
      valid = false;
      if (errEl) errEl.textContent = 'This field is required.';
      el.style.borderColor = 'var(--danger)';
    } else {
      clearFieldError(id);
    }
  });
  return valid;
}

function initQuickAdd() {
  document.querySelectorAll('.quick-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fieldId = btn.dataset.field;
      const existingBox = btn.closest('.field').querySelector('.quick-add-box');
      if (existingBox) { existingBox.remove(); return; }

      const box = document.createElement('div');
      box.className = 'quick-add-box';
      box.innerHTML = `
        <textarea class="input textarea" rows="2" placeholder="Type freely — we'll tidy it up"></textarea>
        <div class="quick-add-box-actions">
          <button type="button" class="btn btn-accent btn-sm">Add</button>
          <button type="button" class="btn btn-ghost btn-sm">Cancel</button>
        </div>`;
      btn.closest('.field').appendChild(box);

      const textarea = box.querySelector('textarea');
      textarea.focus();
      box.querySelector('.btn-accent').addEventListener('click', () => {
        const target = document.getElementById(fieldId);
        const cleaned = quickCaptureClean(textarea.value);
        if (cleaned) {
          target.value = target.value ? `${target.value} ${cleaned}` : cleaned;
          target.dispatchEvent(new Event('input'));
        }
        box.remove();
      });
      box.querySelector('.btn-ghost').addEventListener('click', () => box.remove());
    });
  });
}

function handlePhotoError(img) {
  const card = img.closest('.photo-card');
  if (card) card.classList.add('photo-failed');
}

function renderDeliverablesChecklist() {
  const container = document.getElementById('deliverablesChecklist');
  container.innerHTML = '';
  DELIVERABLE_PRESETS.forEach(item => {
    const label = document.createElement('label');
    label.className = 'checklist-item photo-card';
    const checked = AppState.data.execution.deliverables_preset.includes(item.label);
    label.innerHTML = `
      <img class="checklist-photo" src="${loremFlickrUrl(item.keyword, 96, 72, item.lock)}" alt="" loading="lazy" onerror="handlePhotoError(this)" />
      <input type="checkbox" ${checked ? 'checked' : ''} />
      <span>${item.label}</span>`;
    label.querySelector('input').addEventListener('change', (e) => {
      const arr = AppState.data.execution.deliverables_preset;
      if (e.target.checked) { if (!arr.includes(item.label)) arr.push(item.label); }
      else { AppState.data.execution.deliverables_preset = arr.filter(x => x !== item.label); }
      scheduleAutosave();
    });
    container.appendChild(label);
  });
}

function renderProjectTypeGrid() {
  const container = document.getElementById('projectTypeGrid');
  container.innerHTML = '';
  PROJECT_TYPES.forEach(type => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'type-card photo-card';
    const selected = AppState.data.project.type === type.value;
    if (selected) card.classList.add('selected');
    card.innerHTML = `
      <img class="type-card-photo" src="${loremFlickrUrl(type.keyword, 160, 100, type.lock)}" alt="" loading="lazy" onerror="handlePhotoError(this)" />
      <span class="type-card-label">${type.value}</span>`;
    card.addEventListener('click', () => {
      const alreadySelected = AppState.data.project.type === type.value;
      AppState.data.project.type = alreadySelected ? '' : type.value;
      renderProjectTypeGrid();
      scheduleAutosave();
    });
    container.appendChild(card);
  });
}

function initTagBuilder(inputId, listId, getArray, setArray) {
  const input = document.getElementById(inputId);
  const listEl = document.getElementById(listId);

  function render() {
    listEl.innerHTML = '';
    getArray().forEach((tag, idx) => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.innerHTML = `<span></span><button type="button" class="tag-pill-remove" aria-label="Remove">×</button>`;
      pill.querySelector('span').textContent = tag;
      pill.querySelector('button').addEventListener('click', () => {
        const arr = getArray().slice();
        arr.splice(idx, 1);
        setArray(arr);
        render();
        scheduleAutosave();
      });
      listEl.appendChild(pill);
    });
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = input.value.trim().replace(/,$/, '');
      if (value) {
        const arr = getArray().slice();
        if (!arr.includes(value)) arr.push(value);
        setArray(arr);
        input.value = '';
        render();
        scheduleAutosave();
      }
    }
  });

  render();
  return render;
}

function renderPresetChips(rowId, presets, getArray, setArray, rerenderTags) {
  const row = document.getElementById(rowId);
  row.innerHTML = '';
  presets.forEach(preset => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'preset-chip';
    chip.textContent = '+ ' + preset;
    chip.addEventListener('click', () => {
      const arr = getArray().slice();
      if (!arr.includes(preset)) {
        arr.push(preset);
        setArray(arr);
        rerenderTags();
        scheduleAutosave();
      }
    });
    row.appendChild(chip);
  });
}

function initTonesSliders() {
  const formalSlider = document.getElementById('tone-formal-playful');
  const boldSlider = document.getElementById('tone-minimal-bold');
  const labelEl = document.getElementById('tonePreviewLabel');
  const tagsEl = document.getElementById('tonePreviewDescriptors');
  const photoEl = document.getElementById('tonePreviewPhoto');

  function render() {
    const fp = Number(formalSlider.value);
    const mb = Number(boldSlider.value);
    AppState.data.strategy.tone_axes.formalPlayful = fp;
    AppState.data.strategy.tone_axes.minimalBold = mb;
    const entry = getToneMatrixEntry(fp, mb);
    labelEl.textContent = entry.label;
    tagsEl.innerHTML = entry.descriptors.map(d => `<span>${d}</span>`).join('');
    photoEl.closest('.photo-card').classList.remove('photo-failed');
    photoEl.src = loremFlickrUrl(entry.keyword, 300, 160, entry.lock);
  }

  formalSlider.value = AppState.data.strategy.tone_axes.formalPlayful;
  boldSlider.value = AppState.data.strategy.tone_axes.minimalBold;
  formalSlider.addEventListener('input', () => { render(); scheduleAutosave(); });
  boldSlider.addEventListener('input', () => { render(); scheduleAutosave(); });
  render();
}

function initAiContextBuilders() {
  const doRerender = initTagBuilder('doTagInput', 'doTagList',
    () => AppState.data.ai_context.do_items,
    (arr) => AppState.data.ai_context.do_items = arr);
  renderPresetChips('doPresetRow', DO_PRESETS,
    () => AppState.data.ai_context.do_items,
    (arr) => AppState.data.ai_context.do_items = arr,
    doRerender);

  const dontRerender = initTagBuilder('dontTagInput', 'dontTagList',
    () => AppState.data.ai_context.dont_items,
    (arr) => AppState.data.ai_context.dont_items = arr);
  renderPresetChips('dontPresetRow', DONT_PRESETS,
    () => AppState.data.ai_context.dont_items,
    (arr) => AppState.data.ai_context.dont_items = arr,
    dontRerender);
}

function initDeliverablesTagBuilder() {
  initTagBuilder('deliverablesTagInput', 'deliverablesTagList',
    () => AppState.data.execution.deliverables_custom,
    (arr) => AppState.data.execution.deliverables_custom = arr);
}

function refreshFormFromState() {
  FIELD_BINDINGS.forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (el) el.value = getByPath(AppState.data, path) || '';
  });
  renderProjectTypeGrid();
  renderDeliverablesChecklist();
  initDeliverablesTagBuilder();
  initAiContextBuilders();
  initTonesSliders();
  renderReferenceGrid();
  autoExpandFilledSections();
}

function initForm() {
  initFieldBindings();
  initQuickAdd();
  renderProjectTypeGrid();
  renderDeliverablesChecklist();
  initDeliverablesTagBuilder();
  initAiContextBuilders();
  initTonesSliders();
}
