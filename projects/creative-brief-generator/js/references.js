const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

let refIdCounter = 0;
function nextRefId() { return `ref-${Date.now()}-${refIdCounter++}`; }

function countImages() {
  return AppState.data.references.items.filter(i => i.kind === 'image').length;
}

function handleImageFiles(fileList) {
  const files = Array.from(fileList);
  const remainingSlots = MAX_IMAGES - countImages();
  if (remainingSlots <= 0) {
    showToast(`Maximum of ${MAX_IMAGES} images reached.`);
    return;
  }

  files.slice(0, remainingSlots).forEach(file => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast(`"${file.name}" isn't a supported image type.`);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast(`"${file.name}" is over the 5MB limit.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      AppState.data.references.items.push({
        id: nextRefId(),
        kind: 'image',
        filename: file.name,
        mime_type: file.type,
        base64: reader.result.split(',')[1],
        caption: ''
      });
      renderReferenceGrid();
      scheduleAutosave();
    };
    reader.readAsDataURL(file);
  });

  if (files.length > remainingSlots) {
    showToast(`Only added ${remainingSlots} image(s) — 10 image max.`);
  }
}

function addUrlReference(url) {
  const trimmed = url.trim();
  if (!trimmed) return;
  AppState.data.references.items.push({
    id: nextRefId(),
    kind: 'url',
    url: trimmed,
    caption: ''
  });
  renderReferenceGrid();
  scheduleAutosave();
}

function faviconUrlFor(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) {
    return '';
  }
}

function renderReferenceGrid() {
  const grid = document.getElementById('referenceGrid');
  grid.innerHTML = '';
  AppState.data.references.items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'reference-card';
    card.draggable = true;
    card.dataset.id = item.id;

    if (item.kind === 'image') {
      card.innerHTML = `<img class="reference-thumb" src="data:${item.mime_type};base64,${item.base64}" alt="${item.filename}" loading="lazy" />`;
      card.querySelector('.reference-thumb').addEventListener('click', () => {
        openLightbox(`data:${item.mime_type};base64,${item.base64}`, item.filename);
      });
    } else {
      let domain = item.url;
      try { domain = new URL(item.url).hostname; } catch (e) { /* not a valid absolute URL, show raw */ }
      const favicon = faviconUrlFor(item.url);
      card.innerHTML = `<div class="reference-link-thumb">${favicon ? `<img src="${favicon}" alt="" onerror="this.style.display='none'" />` : ''}<span>${domain}</span></div>`;
    }

    const body = document.createElement('div');
    body.className = 'reference-card-body';
    body.innerHTML = `
      <input class="reference-caption" type="text" placeholder="Add a caption…" value="${item.caption ? item.caption.replace(/"/g, '&quot;') : ''}" />
      <div class="reference-card-footer">
        <span class="field-hint" style="margin:0">${item.kind === 'image' ? 'Image' : 'URL'}</span>
        <button type="button" class="reference-remove">Remove</button>
      </div>`;
    card.appendChild(body);

    body.querySelector('.reference-caption').addEventListener('input', (e) => {
      item.caption = e.target.value;
      scheduleAutosave();
    });
    body.querySelector('.reference-remove').addEventListener('click', () => {
      AppState.data.references.items = AppState.data.references.items.filter(i => i.id !== item.id);
      renderReferenceGrid();
      scheduleAutosave();
    });

    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      scheduleAutosave();
    });

    grid.appendChild(card);
  });
}

function initReferenceDragReorder() {
  const grid = document.getElementById('referenceGrid');
  grid.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = grid.querySelector('.dragging');
    if (!dragging) return;
    const afterEl = getDragAfterElement(grid, e.clientX, e.clientY);
    if (afterEl == null) grid.appendChild(dragging);
    else grid.insertBefore(dragging, afterEl);
  });
  grid.addEventListener('drop', () => {
    const orderedIds = Array.from(grid.children).map(c => c.dataset.id);
    AppState.data.references.items.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
    scheduleAutosave();
  });
}

function getDragAfterElement(container, x, y) {
  const cards = Array.from(container.querySelectorAll('.reference-card:not(.dragging)'));
  return cards.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function initReferences() {
  document.getElementById('imageUploadInput').addEventListener('change', (e) => {
    handleImageFiles(e.target.files);
    e.target.value = '';
  });
  document.getElementById('urlAddBtn').addEventListener('click', () => {
    const input = document.getElementById('urlAddInput');
    addUrlReference(input.value);
    input.value = '';
  });
  document.getElementById('urlAddInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('urlAddBtn').click();
    }
  });
  initReferenceDragReorder();
  renderReferenceGrid();
}
