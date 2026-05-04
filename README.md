# Avnac Vue

[![Deploy Demo](https://github.com/VenMail/avnac-vue/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/VenMail/avnac-vue/actions/workflows/deploy-pages.yml)
[![npm](https://img.shields.io/npm/v/avnac-vue)](https://www.npmjs.com/package/avnac-vue)

Avnac Vue is a **Vue 3 + Fabric.js** clone and adaptation of the original React [Avnac](https://github.com/akinloluwami/avnac) editor.

It keeps the browser-first canvas editing model while exposing Vue single-file components (SFCs) that can be embedded in VenSuite, Venmail, and other Vue 3 applications. It includes slide editing, text and shape tools, image search/upload flows, AI-assisted slide generation, charts, diagrams, infographics, PPTX import/export, animation, present mode, and local document serialization.

---

## 🌐 Try It Online (Live Demo)

**[https://venmail.github.io/avnac-vue/](https://venmail.github.io/avnac-vue/)**

The demo loads the full editor in the browser — no install needed. You can try:
- Slide editing with canvas objects (text, shapes, images)
- AI-assisted slide generation
- Image search and file uploads
- Charts, diagrams, and infographic blocks
- Present mode and animations
- PPTX import/export
- Cross-canvas copy/paste from the system clipboard

> The demo is auto-deployed from the `main` branch on every push via GitHub Actions.

---

## Screenshots

> _Screenshots will be added once the live demo is deployed. Run `npm run dev` locally to capture them, then place them in `public/screenshots/` and update the paths below._

**Editor Overview**
![Editor overview](https://venmail.github.io/avnac-vue/screenshots/editor-overview.png)

**AI Slide Generation**
![AI slide generation panel](https://venmail.github.io/avnac-vue/screenshots/ai-panel.png)

**Image Search & Uploads**
![Image tools panel](https://venmail.github.io/avnac-vue/screenshots/image-panel.png)

**Charts, Diagrams & Infographics**
![Charts and diagrams](https://venmail.github.io/avnac-vue/screenshots/chart-editor.png)

**Present Mode**
![Present mode](https://venmail.github.io/avnac-vue/screenshots/present-mode.png)

---

## What’s New vs the Original Avnac (React)

The original [Avnac](https://github.com/akinloluwami/avnac) is a React + Vite presentation editor. Avnac Vue is a ground-up Vue 3 adaptation with additional features built for production embedding in Venmail products.

### Feature Comparison

| Area | Original Avnac (React) | Avnac Vue |
|---|---|---|
| **Framework** | React + Vite + TypeScript | Vue 3 + Vite + TypeScript |
| **Integration** | React component library | Vue SFCs — embeds into VenSuite & Venmail |
| **AI slide generation** | React-based panels | Vue floating panels, improved error/loading states |
| **Images & uploads** | Image uploads + Unsplash search | Vue panels with refined layout, dark-mode contrast & sizing fixes |
| **Clipboard** | Basic clipboard support | Paste **plain text and images** from system clipboard into canvas |
| **Cross-canvas copy/paste** | Not available | Full cross-canvas copy/paste via system clipboard |
| **Animations** | Not available | `motion.dev` animation runtime, timeline panel, PPTX anim export |
| **Present mode** | Not available | Full fullscreen present mode with slide navigation |
| **Charts & diagrams** | Basic chart rendering | Chart data dialog, chart kind sync, diagram & infographic rendering |
| **PPTX import/export** | Basic PPTX support | Improved PPTX import (images, lines, charts), corrected animation XML export |
| **Flat-group architecture** | Standard canvas groups | Flat-group model for easier text editing within groups |
| **Smart objects** | Standard shape editing | Smart object editor with polish — stroke width sync, background popover |
| **Dark mode** | Standard contrast | Editor dark mode contrast fixes tuned for Vue build |
| **Line endings** | Standard text behavior | Multiple line-ending types in the editor |
| **Panels UX** | Floating panels (React) | Escape/close behavior, focus handling, improved panel positioning |
| **Packaging** | React component library build | Ships Vue SFCs for host-app compilation |

### New Feature Highlights in Avnac Vue

- **Vue 3 SFC API** — embed the editor in any Vue 3 / VenSuite / Venmail app with minimal setup.
- **System clipboard integration** — paste plain text and images from the OS clipboard directly onto the canvas (`feat: paste plain text and images from system clipboard`).
- **Cross-canvas copy/paste** — copy objects and paste them between separate editor instances or browser tabs via the system clipboard.
- **motion.dev animation runtime** — per-slide and per-object animations with a timeline panel; animations export correctly to PPTX.
- **Full present mode** — fullscreen slide presentation with keyboard and click navigation.
- **Chart data dialog** — dedicated UI for editing chart datasets, chart kind selection, and live sync to the canvas.
- **Diagrams and infographics** — rendering pipeline for diagram and infographic slide blocks.
- **Improved PPTX pipeline** — corrected animation XML structure, shape ID tracking, chart kind sync, and better image/line import.
- **Flat-group architecture** — custom canvas group model that allows direct text editing inside grouped objects without ungrouping.
- **Smart object editor polish** — stroke width sync, background popover positioning, and visual alignment improvements.
- **Dark mode contrast** — targeted fixes for the editor UI in dark environments.
- **Resilient AI and network handling** — AI endpoint fixes, improved error recovery so panels don’t break on failed requests.

---

## Installation

```bash
npm install avnac-vue
```

The package ships Vue SFCs. Your host app’s Vite/webpack build compiles them.

---

## Development

```bash
npm install
npm run dev

# Type checking
npm run typecheck

# Tests
npm test
```

Local dev runs at `http://localhost:5173` with the API proxy forwarding `/api` calls to `http://localhost:3001`.

---

## CI / CD

| Workflow | Trigger | Result |
|---|---|---|
| `publish.yml` | Push a version tag | Publishes to npm |
| `deploy-pages.yml` | Push to `main` | Deploys live demo to GitHub Pages |

---

## Keywords

avnac, avnac-vue, vue clone, vue presentation editor, vue slide editor, vue canvas editor, fabric.js editor, browser design editor, AI slide generator, presentation builder, PPTX editor, Venmail, VenSuite, image upload editor, Unsplash image search, diagram editor, infographic editor, animation editor, present mode, motion.dev, clipboard paste, cross-canvas copy paste.
