const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'were',
  'have', 'has', 'will', 'our', 'their', 'they', 'them', 'about', 'into', 'your', 'you', 'who', 'what',
  'when', 'where', 'which', 'while', 'over', 'under', 'than', 'then', 'also', 'more', 'most', 'some',
  'such', 'these', 'those', 'been', 'being', 'not', 'but', 'can', 'all', 'any', 'its', 'a', 'an', 'to',
  'of', 'in', 'on', 'is', 'it', 'as', 'be', 'or', 'we', 'at', 'by']);

function extractKeywordsFromText(text, limit) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
    .filter((w, idx, arr) => arr.indexOf(w) === idx)
    .slice(0, limit);
}

function buildDeliverables() {
  const d = AppState.data.execution;
  return [...d.deliverables_preset, ...d.deliverables_custom];
}

function buildDoNot() {
  return {
    do: AppState.data.ai_context.do_items.slice(),
    dont: AppState.data.ai_context.dont_items.slice()
  };
}

function buildStyleKeywords() {
  const { strategy } = AppState.data;
  const entry = getToneMatrixEntry(strategy.tone_axes.formalPlayful, strategy.tone_axes.minimalBold);
  const fromAudience = extractKeywordsFromText(strategy.audience_primary + ' ' + strategy.key_message, 6);
  const combined = [...entry.descriptors, ...fromAudience];
  return combined.filter((w, idx) => combined.indexOf(w) === idx).slice(0, 10);
}

function joinOr(arr, fallback) {
  return arr && arr.length ? arr.join(', ') : fallback;
}

function buildSystemPrompt() {
  const { project, strategy } = AppState.data;
  const { do: doItems, dont: dontItems } = buildDoNot();
  const deliverables = buildDeliverables();
  const entry = getToneMatrixEntry(strategy.tone_axes.formalPlayful, strategy.tone_axes.minimalBold);

  const parts = [];
  parts.push(`You are a creative assistant working on ${project.name || 'this project'}${project.client ? ` for ${project.client}` : ''}.`);
  if (strategy.creative_objective) parts.push(`The objective is ${strategy.creative_objective}.`);
  if (strategy.audience_primary) parts.push(`The target audience is ${strategy.audience_primary}.`);
  if (strategy.key_message) parts.push(`The key message is ${strategy.key_message}.`);
  parts.push(`Tone: ${entry.label} — ${entry.descriptors.join(', ')}${strategy.tone_notes ? `. ${strategy.tone_notes}` : '.'}`);
  if (doItems.length) parts.push(`Always maintain: ${doItems.join('; ')}.`);
  if (dontItems.length) parts.push(`Never: ${dontItems.join('; ')}.`);
  if (deliverables.length) parts.push(`Deliverables include: ${deliverables.join(', ')}.`);
  return parts.join(' ');
}

function buildToolInstructions(systemPrompt, styleKeywords) {
  const { strategy } = AppState.data;
  const { dont: dontItems } = buildDoNot();
  const entry = getToneMatrixEntry(strategy.tone_axes.formalPlayful, strategy.tone_axes.minimalBold);

  return {
    claude: systemPrompt,
    chatgpt: `As ChatGPT, follow these custom instructions for all responses related to this project: ${systemPrompt}`,
    midjourney: `/imagine prompt: ${styleKeywords.join(', ')}, ${entry.label.toLowerCase()} mood${dontItems.length ? `, avoid ${dontItems.slice(0, 3).join(', ')}` : ''} --ar 16:9 --style raw`,
    figma_ai: `Style: ${styleKeywords.join(', ')}. Mood: ${entry.label}. Keep designs ${entry.descriptors.slice(0, 3).join(', ')}.`,
    firefly: `Style preset: ${styleKeywords.slice(0, 5).join(', ')}. Tone: ${entry.label}.`
  };
}

function buildMarkdownBrief() {
  const { project, strategy, execution, references } = AppState.data;
  const { do: doItems, dont: dontItems } = buildDoNot();
  const deliverables = buildDeliverables();
  const entry = getToneMatrixEntry(strategy.tone_axes.formalPlayful, strategy.tone_axes.minimalBold);
  const urls = references.items.filter(i => i.kind === 'url');

  return `# ${project.name || 'Untitled Project'} Creative Brief

**Client:** ${project.client || '—'}
**Type:** ${project.type || '—'}
**Budget:** ${project.budget_range || '—'}
**Lead:** ${project.lead || '—'}

## Strategy
**Business objective:** ${strategy.business_objective || '—'}
**Creative objective:** ${strategy.creative_objective || '—'}
**Primary audience:** ${strategy.audience_primary || '—'}
**Secondary audience:** ${strategy.audience_secondary || '—'}
**Key message:** ${strategy.key_message || '—'}
**Brand positioning:** ${strategy.brand_positioning || '—'}
**Tone/voice:** ${entry.label} (${entry.descriptors.join(', ')})${strategy.tone_notes ? `\n**Tone notes:** ${strategy.tone_notes}` : ''}

## Execution
**Deliverables:** ${joinOr(deliverables, '—')}
**Timeline:** ${execution.timeline || '—'}
**Constraints:** ${execution.constraints || '—'}
**Success metrics:** ${execution.success_metrics || '—'}

## References
${references.inspiration_notes ? `${references.inspiration_notes}\n` : ''}${urls.length ? urls.map(u => `- ${u.url}${u.caption ? ` — ${u.caption}` : ''}`).join('\n') : '_No linked references._'}

## AI Context
**Always maintain:** ${joinOr(doItems, '—')}
**Never:** ${joinOr(dontItems, '—')}
`;
}

function buildBrief() {
  const { project, strategy, execution, references } = AppState.data;
  const images = references.items.filter(i => i.kind === 'image').map(i => ({
    filename: i.filename, mime_type: i.mime_type, base64: i.base64, caption: i.caption
  }));
  const urls = references.items.filter(i => i.kind === 'url').map(i => i.url);

  const styleKeywords = buildStyleKeywords();
  const systemPrompt = buildSystemPrompt();
  const toolInstructions = buildToolInstructions(systemPrompt, styleKeywords);
  const { do: doItems, dont: dontItems } = buildDoNot();

  const brief = {
    brief_version: '1.0',
    generated_by: 'Forge HQ Creative Brief Generator',
    generated_at: new Date().toISOString(),
    tool_url: 'https://no1owns.github.io/ForgeHQ/projects/creative-brief-generator/',
    project: {
      name: project.name, client: project.client, type: project.type,
      budget_range: project.budget_range, lead: project.lead
    },
    strategy: {
      business_objective: strategy.business_objective,
      creative_objective: strategy.creative_objective,
      audience_primary: strategy.audience_primary,
      audience_secondary: strategy.audience_secondary,
      key_message: strategy.key_message,
      tone_voice: getToneMatrixEntry(strategy.tone_axes.formalPlayful, strategy.tone_axes.minimalBold).label,
      tone_descriptors: getToneMatrixEntry(strategy.tone_axes.formalPlayful, strategy.tone_axes.minimalBold).descriptors,
      brand_positioning: strategy.brand_positioning
    },
    execution: {
      deliverables: buildDeliverables(),
      timeline: execution.timeline,
      constraints: execution.constraints,
      success_metrics: execution.success_metrics
    },
    references: {
      inspiration_notes: references.inspiration_notes,
      urls, images
    },
    ai_context: {
      system_prompt: systemPrompt,
      style_keywords: styleKeywords,
      do: doItems,
      do_not: dontItems,
      tool_instructions: toolInstructions
    },
    markdown_brief: buildMarkdownBrief()
  };

  AppState.data.generatedBrief = brief;
  return brief;
}
