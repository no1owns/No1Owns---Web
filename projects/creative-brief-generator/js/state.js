const STORAGE_KEY = 'cbg_saved_briefs_v1';
const DRAFT_KEY = 'cbg_draft_v1';

const DELIVERABLE_PRESETS = [
  'Social posts', 'Landing page', 'Video / motion', 'Pitch deck',
  'Print collateral', 'Email campaign', 'Paid ad set', 'Brand guidelines',
  'Website', 'Packaging'
];

const DO_PRESETS = [
  'Maintain consistent brand voice across all assets',
  'Follow accessibility best practices (contrast, alt text, captions)',
  'Use only approved brand fonts and colors',
  'Keep legal/compliance disclaimers visible',
  'Credit sources and licensed assets properly'
];

const DONT_PRESETS = [
  'Use stock-photo clichés or generic imagery',
  'Reference or disparage competitors directly',
  'Introduce unapproved fonts, colors, or logos',
  'Make unsubstantiated claims or promises',
  'Use dark patterns or manipulative CTAs'
];

const TONE_MATRIX = {
  'formal-minimal':   { label: 'Refined & Understated', descriptors: ['refined', 'understated', 'precise', 'restrained', 'elegant'] },
  'formal-balanced':  { label: 'Authoritative & Polished', descriptors: ['authoritative', 'polished', 'credible', 'composed', 'professional'] },
  'formal-bold':      { label: 'Commanding & Confident', descriptors: ['commanding', 'confident', 'assertive', 'powerful', 'decisive'] },
  'balanced-minimal': { label: 'Clean & Considered', descriptors: ['clean', 'considered', 'clear', 'calm', 'intentional'] },
  'balanced-balanced':{ label: 'Approachable & Grounded', descriptors: ['approachable', 'grounded', 'balanced', 'warm', 'steady'] },
  'balanced-bold':    { label: 'Dynamic & Assured', descriptors: ['dynamic', 'assured', 'energetic', 'vivid', 'striking'] },
  'playful-minimal':  { label: 'Light & Witty', descriptors: ['light', 'witty', 'breezy', 'charming', 'easygoing'] },
  'playful-balanced': { label: 'Friendly & Spirited', descriptors: ['friendly', 'spirited', 'upbeat', 'playful', 'warm'] },
  'playful-bold':     { label: 'Bold & Irreverent', descriptors: ['bold', 'irreverent', 'exuberant', 'provocative', 'daring'] }
};

function toneBucket(value) {
  if (value < 34) return 0;
  if (value < 67) return 1;
  return 2;
}

function toneAxisKey(axis, bucket) {
  const labels = axis === 'formalPlayful' ? ['formal', 'balanced', 'playful'] : ['minimal', 'balanced', 'bold'];
  return labels[bucket];
}

function getToneMatrixEntry(formalPlayful, minimalBold) {
  const a = toneAxisKey('formalPlayful', toneBucket(formalPlayful));
  const b = toneAxisKey('minimalBold', toneBucket(minimalBold));
  return TONE_MATRIX[`${a}-${b}`];
}

function createEmptyState() {
  return {
    meta: { savedName: null, lastSaved: null },
    project: { name: '', client: '', type: '', budget_range: '', lead: '' },
    strategy: {
      business_objective: '', creative_objective: '',
      audience_primary: '', audience_secondary: '',
      key_message: '', brand_positioning: '',
      tone_axes: { formalPlayful: 50, minimalBold: 50 },
      tone_notes: ''
    },
    execution: {
      deliverables_preset: [], deliverables_custom: [],
      timeline: '', constraints: '', success_metrics: ''
    },
    references: {
      inspiration_notes: '',
      items: [] // unified ordered list: {kind:'image'|'url', ...}
    },
    ai_context: {
      do_items: [],
      dont_items: []
    },
    generatedBrief: null
  };
}

const AppState = {
  data: createEmptyState(),

  reset() {
    this.data = createEmptyState();
  },

  loadDraft() {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY) || localStorage.getItem(DRAFT_KEY);
      if (raw) this.data = Object.assign(createEmptyState(), JSON.parse(raw));
    } catch (e) { /* corrupt draft, ignore */ }
  },

  saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(this.data));
    } catch (e) { /* storage full or unavailable */ }
  },

  getAllSaved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) { return {}; }
  },

  saveNamed(name) {
    const all = this.getAllSaved();
    this.data.meta.savedName = name;
    this.data.meta.lastSaved = new Date().toISOString();
    all[name] = this.data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  loadNamed(name) {
    const all = this.getAllSaved();
    if (all[name]) this.data = Object.assign(createEmptyState(), all[name]);
  },

  deleteNamed(name) {
    const all = this.getAllSaved();
    delete all[name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
};
