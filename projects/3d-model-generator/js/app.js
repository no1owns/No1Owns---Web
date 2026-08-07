import { createViewer } from './viewer.js';
import { objects } from './objects/index.js';

const $ = id => document.getElementById(id);
const viewer = createViewer($('stage'));

let currentObject = objects[0];
let values = {};
let lastBuild = null;

function defaultsFor(obj) {
  const v = {};
  obj.params.forEach(p => { v[p.key] = p.default; });
  return v;
}

function rebuild() {
  lastBuild = currentObject.build(values);
  viewer.setObject(lastBuild.object);
}

function populateObjectSelect() {
  const select = $('objectSelect');
  select.innerHTML = '';
  objects.forEach(obj => {
    const opt = document.createElement('option');
    opt.value = obj.id;
    opt.textContent = obj.name;
    select.appendChild(opt);
  });
  select.value = currentObject.id;
  select.addEventListener('change', () => {
    currentObject = objects.find(o => o.id === select.value);
    values = defaultsFor(currentObject);
    renderPresets();
    renderParamPanel();
    renderReferenceLinks();
    rebuild();
  });
}

function renderPresets() {
  const row = $('presetRow');
  row.innerHTML = '';
  (currentObject.presets || []).forEach(preset => {
    const btn = document.createElement('button');
    btn.textContent = preset.label;
    btn.addEventListener('click', () => {
      Object.assign(values, preset.values);
      renderParamPanel();
      rebuild();
    });
    row.appendChild(btn);
  });
}

function renderParamPanel() {
  const panel = $('paramPanel');
  panel.innerHTML = '';
  currentObject.params.forEach(p => {
    const label = document.createElement('label');
    label.textContent = p.label;
    panel.appendChild(label);

    if (p.type === 'range') {
      const row = document.createElement('div');
      row.className = 'row';
      const range = document.createElement('input');
      Object.assign(range, { type: 'range', min: p.min, max: p.max, step: p.step ?? 1, value: values[p.key] });
      const num = document.createElement('input');
      Object.assign(num, { type: 'number', min: p.min, max: p.max, step: p.step ?? 1, value: values[p.key] });
      range.addEventListener('input', () => { num.value = range.value; values[p.key] = +range.value; rebuild(); });
      num.addEventListener('input', () => { range.value = num.value; values[p.key] = +num.value; rebuild(); });
      row.append(range, num);
      panel.appendChild(row);
    } else {
      const input = document.createElement('input');
      Object.assign(input, { type: 'number', min: p.min, max: p.max, step: p.step ?? 1, value: values[p.key] });
      input.addEventListener('input', () => { values[p.key] = +input.value; rebuild(); });
      panel.appendChild(input);
    }
  });
}

function renderReferenceLinks() {
  const el = $('referenceLinks');
  const ref = currentObject.referenceModel;
  el.innerHTML = ref
    ? `Reference model: <a href="${ref.stl}" download>.stl</a> &middot; <a href="${ref.threeMf}" download>.3mf</a>`
    : '';
}

function resetParams() {
  values = defaultsFor(currentObject);
  renderParamPanel();
  rebuild();
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportSTL() {
  if (!lastBuild) return;
  const geometry = lastBuild.exportGeometry.index ? lastBuild.exportGeometry.toNonIndexed() : lastBuild.exportGeometry;
  const pos = geometry.attributes.position;
  let txt = `solid ${currentObject.id}\n`;
  for (let i = 0; i < pos.count; i += 3) {
    txt += 'facet normal 0 0 0\nouter loop\n';
    for (let j = 0; j < 3; j++) {
      txt += `vertex ${pos.getX(i + j)} ${pos.getY(i + j)} ${pos.getZ(i + j)}\n`;
    }
    txt += 'endloop\nendfacet\n';
  }
  txt += `endsolid ${currentObject.id}`;
  downloadBlob(txt, `${currentObject.id}.stl`, 'model/stl');
}

function saveConfig() {
  downloadBlob(JSON.stringify({ object: currentObject.id, ...values }, null, 2), `${currentObject.id}-config.json`, 'application/json');
}

$('resetParamsBtn').addEventListener('click', resetParams);
$('resetViewBtn').addEventListener('click', () => viewer.resetView());
$('exportStlBtn').addEventListener('click', exportSTL);
$('saveConfigBtn').addEventListener('click', saveConfig);

values = defaultsFor(currentObject);
populateObjectSelect();
renderPresets();
renderParamPanel();
renderReferenceLinks();
rebuild();
