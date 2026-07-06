const STORAGE_KEY = 'cbg_saved_briefs_v1';
const DRAFT_KEY = 'cbg_draft_v1';

function loremFlickrUrl(keyword, w, h, lock) {
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(keyword)}?lock=${lock}`;
}

const DELIVERABLE_PRESETS = [
  { label: 'Social posts', keyword: 'socialmedia,phone', lock: 201 },
  { label: 'Landing page', keyword: 'website,laptop', lock: 202 },
  { label: 'Video / motion', keyword: 'videocamera,film', lock: 203 },
  { label: 'Pitch deck', keyword: 'presentation,office', lock: 204 },
  { label: 'Print collateral', keyword: 'print,paper', lock: 205 },
  { label: 'Email campaign', keyword: 'email,mail', lock: 206 },
  { label: 'Paid ad set', keyword: 'advertising,marketing', lock: 207 },
  { label: 'Brand guidelines', keyword: 'design,swatches', lock: 208 },
  { label: 'Website', keyword: 'website,code', lock: 209 },
  { label: 'Packaging', keyword: 'packaging,box', lock: 210 }
];

const PROJECT_TYPES = [
  { value: 'Brand identity', keyword: 'branding,logo', lock: 101 },
  { value: 'Campaign', keyword: 'advertising,billboard', lock: 102 },
  { value: 'Website / digital product', keyword: 'website,laptop', lock: 103 },
  { value: 'Social content', keyword: 'smartphone,socialmedia', lock: 104 },
  { value: 'Video / motion', keyword: 'camera,film', lock: 105 },
  { value: 'Packaging', keyword: 'packaging,product', lock: 106 },
  { value: 'Pitch / deck', keyword: 'presentation,meeting', lock: 107 },
  { value: 'Other', keyword: 'creative,studio', lock: 108 }
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
  'formal-minimal':   { label: 'Refined & Understated', descriptors: ['refined', 'understated', 'precise', 'restrained', 'elegant'], keyword: 'minimalist,architecture', lock: 301 },
  'formal-balanced':  { label: 'Authoritative & Polished', descriptors: ['authoritative', 'polished', 'credible', 'composed', 'professional'], keyword: 'corporate,office', lock: 302 },
  'formal-bold':      { label: 'Commanding & Confident', descriptors: ['commanding', 'confident', 'assertive', 'powerful', 'decisive'], keyword: 'skyscraper,city', lock: 303 },
  'balanced-minimal': { label: 'Clean & Considered', descriptors: ['clean', 'considered', 'clear', 'calm', 'intentional'], keyword: 'interior,scandinavian', lock: 304 },
  'balanced-balanced':{ label: 'Approachable & Grounded', descriptors: ['approachable', 'grounded', 'balanced', 'warm', 'steady'], keyword: 'nature,people', lock: 305 },
  'balanced-bold':    { label: 'Dynamic & Assured', descriptors: ['dynamic', 'assured', 'energetic', 'vivid', 'striking'], keyword: 'sports,energy', lock: 306 },
  'playful-minimal':  { label: 'Light & Witty', descriptors: ['light', 'witty', 'breezy', 'charming', 'easygoing'], keyword: 'pastel,quirky', lock: 307 },
  'playful-balanced': { label: 'Friendly & Spirited', descriptors: ['friendly', 'spirited', 'upbeat', 'playful', 'warm'], keyword: 'friends,colorful', lock: 308 },
  'playful-bold':     { label: 'Bold & Irreverent', descriptors: ['bold', 'irreverent', 'exuberant', 'provocative', 'daring'], keyword: 'neon,streetart', lock: 309 }
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
