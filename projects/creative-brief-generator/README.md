# Creative Brief Generator

A browser-based tool for building a portable, AI-ready creative brief — structured inputs, a tone slider, a visual reference board, and an export that's as useful to an AI tool as it is to a human. No account, no backend, no build step.

## What is a `.brief` file?

A `.brief` file is a UTF-8 JSON file (just a renamed `.json`) with a defined structure covering project info, strategy, execution, references, and an `ai_context` block. Any tool can open it as plain JSON — but the real point is the `ai_context` block: a ready-to-paste system prompt, style keywords, do/don't guardrails, and per-tool instruction strings, all generated automatically from the brief fields. It's a creative context layer you can hand to an AI tool once and reuse across every asset in a project.

## Using a `.brief` file with AI tools

- **Claude / ChatGPT** — open the `.brief` file, copy the `ai_context.system_prompt` value (or use the "Copy System Prompt" button in the tool) and paste it as a system prompt or custom instruction before asking for creative work.
- **Midjourney** — use `ai_context.tool_instructions.midjourney` as a prefix for your `/imagine` prompts; it already includes style keywords and mood.
- **Adobe Firefly** — paste `ai_context.tool_instructions.firefly` into the style/preset description field.
- **Figma AI** — paste `ai_context.tool_instructions.figma_ai` into the AI generate panel's style description.
- **Any other LLM** — the `markdown_brief` field is a full human-readable Markdown version of the brief, useful as general context or for sharing with a human collaborator.

## Features

- Clean, light, card-based layout: Project, Strategy, Execution, References, AI Context — jump between them with the top nav
- Only essential fields show by default; secondary detail lives behind "+ Add more" toggles, and References/AI Context stay collapsed until you need them — so the form reads short even though nothing was cut
- Two ways to fill it in: structured Form, or a one-shot Paste & Import that heuristically sorts free text into fields (both fully local — no API calls, no network requests)
- Dual-axis tone slider (Formal↔Playful, Minimal↔Bold) that auto-generates a tone label and descriptors
- Deliverables checklist plus custom tag builder
- Do/Don't guardrail builder with common presets
- Visual reference board — upload images (stored as base64) or paste URLs, drag to reorder, caption each, click any image for a full-size lightbox preview
- Photo-illustrated selection cards for project type, deliverables, and tone/mood (via [LoremFlickr](https://loremflickr.com), a free keyless photo service) — if a photo fails to load, the card gracefully falls back to a plain text tile
- Named saves to `localStorage`, plus autosave of the current draft
- Export: download the `.brief` file, download a standalone `.md`, or copy the system prompt straight to your clipboard

## Usage

Open `index.html` in any browser. Everything works offline, including as a local `file://` page, **except** the photo thumbnails on selection cards — those need an internet connection to load from LoremFlickr; without one they fall back to plain text cards automatically. Fill in the sections from the top nav, generate the brief from the bottom bar, then export.

## Stack

Vanilla HTML, CSS, and JavaScript only. No dependencies, no API keys, no server.

## Part of

[The Lab](https://work.akintilo.com) — tools and experiments by Ayodeji Akintilo, part of [Forge HQ](https://theforgehq.com).
