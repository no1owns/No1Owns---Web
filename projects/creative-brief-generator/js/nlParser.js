function quickCaptureClean(text) {
  let t = (text || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += '.';
  return t;
}

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
}

function getByPath(obj, path) {
  return path.split('.').reduce((cur, key) => (cur == null ? cur : cur[key]), obj);
}

const NL_IMPORT_RULES = [
  { field: 'project.client', label: 'Client', patterns: [
    /client is\s+([^.,;]+)/i,
    /client:\s*([^.,;]+)/i,
    /\bfor\s+([A-Z][\w&'-]*(?:\s+[A-Z][\w&'-]*){0,3})/
  ] },
  { field: 'project.budget_range', label: 'Budget', patterns: [/budget(?:\s+is|\s+of|:)?\s+([^.,;]+)/i] },
  { field: 'execution.timeline', label: 'Timeline', patterns: [/(?:timeline|deadline|due)(?:\s+is|:)?\s+([^.,;]+)/i] },
  { field: 'strategy.audience_primary', label: 'Primary audience', patterns: [/(?:audience|targeting)(?:\s+is|\s+of|:)?\s+([^.,;]+)/i] },
  { field: 'strategy.tone_notes', label: 'Tone notes', patterns: [/tone(?:\s+should be|\s+is|:)?\s+([^.,;]+)/i] },
  { field: 'strategy.business_objective', label: 'Business objective', patterns: [/(?:objective|goal)(?:\s+is|:)?\s+([^.,;]+)/i] },
  { field: 'strategy.key_message', label: 'Key message', patterns: [/(?:key message|main message)(?:\s+is|:)?\s+([^.,;]+)/i] },
  { field: 'execution.deliverables_custom', label: 'Deliverables', patterns: [/deliverables?(?:\s+include)?:?\s+([^.]+)/i], isList: true }
];

function parseNlImport(text) {
  const matches = [];
  let remaining = text;

  NL_IMPORT_RULES.forEach(rule => {
    for (const pattern of rule.patterns) {
      const m = remaining.match(pattern);
      if (m && m[1]) {
        const value = m[1].trim();
        if (rule.isList) {
          const items = value.split(/,| and /i).map(s => s.trim()).filter(Boolean);
          matches.push({ field: rule.field, label: rule.label, value: items });
        } else {
          matches.push({ field: rule.field, label: rule.label, value });
        }
        remaining = remaining.replace(m[0], '');
        break;
      }
    }
  });

  const leftover = remaining.replace(/\s+/g, ' ').trim();
  return { matches, leftover };
}

function applyNlMatches(matches) {
  matches.forEach(m => {
    if (m.field === 'execution.deliverables_custom') {
      AppState.data.execution.deliverables_custom.push(...m.value);
    } else {
      setByPath(AppState.data, m.field, m.value);
    }
  });
}
