function slugify(name) {
  return (name || 'untitled-brief')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'untitled-brief';
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadBrief() {
  const brief = AppState.data.generatedBrief;
  if (!brief) return;
  const slug = slugify(AppState.data.project.name);
  downloadFile(`${slug}.brief`, JSON.stringify(brief, null, 2), 'application/json');
}

function downloadMarkdown() {
  const brief = AppState.data.generatedBrief;
  if (!brief) return;
  const slug = slugify(AppState.data.project.name);
  downloadFile(`${slug}.md`, brief.markdown_brief, 'text/markdown');
}

function copySystemPrompt() {
  const brief = AppState.data.generatedBrief;
  if (!brief) return;
  navigator.clipboard.writeText(brief.ai_context.system_prompt)
    .then(() => showToast('System prompt copied to clipboard.'))
    .catch(() => showToast('Could not copy — please copy manually from the preview.'));
}

function initExport() {
  document.getElementById('generateBriefBtn').addEventListener('click', () => {
    if (!validateForm()) {
      showToast('Please fill in the required fields before generating.');
      return;
    }
    const brief = buildBrief();
    document.getElementById('previewSystemPrompt').value = brief.ai_context.system_prompt;
    const kwEl = document.getElementById('previewStyleKeywords');
    kwEl.innerHTML = brief.ai_context.style_keywords.map(k => `<span class="tag-pill"><span>${k}</span></span>`).join('');
    document.getElementById('downloadBriefBtn').disabled = false;
    document.getElementById('downloadMdBtn').disabled = false;
    document.getElementById('copyPromptBtn').disabled = false;
    document.getElementById('statusLabel').textContent = 'Brief generated.';
    scheduleAutosave();
  });

  document.getElementById('downloadBriefBtn').addEventListener('click', downloadBrief);
  document.getElementById('downloadMdBtn').addEventListener('click', downloadMarkdown);
  document.getElementById('copyPromptBtn').addEventListener('click', copySystemPrompt);
}
