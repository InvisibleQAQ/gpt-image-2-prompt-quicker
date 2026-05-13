# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

- `extension/` is the actual browser extension loaded into Chrome/Chromium. There is no JS bundler here; the extension runs directly from checked-in files referenced by `extension/manifest.json`.
- Repository root also contains static marketing/docs pages (`index.html`, `privacy.html`) and content data files (`prompts.json`, `config.json`, `images/`).
- There is currently no verified package manager setup (`package.json` is absent) and no checked-in automated lint/test/build pipeline. Do not invent `npm`/`pnpm` commands.

## Common commands

### Load and test the extension manually

- Load unpacked extension in Chrome: open `chrome://extensions/` → enable Developer mode → **Load unpacked** → select `extension/`
- After code changes to extension files, use **Reload** on the extension card in `chrome://extensions/`
- Primary manual test targets from the README: `https://gemini.google.com/`, `https://aistudio.google.com/`, and `https://chatgpt.com/`
- Context-menu path matters too: focus any editable field on any site, right click, and trigger `Insert 🍌 Prompts`

### Repository inspection

- Check root files: `ls -la`
- Check extension contents: `ls -la extension`
- Merge docs markdown: `python3 make/merge_docs.py`

### Image helper scripts

These scripts exist, but they are **macOS-oriented** because they shell out to `sips` and optionally `pbcopy`:

- Download + compress preview image: `node make/download_image.js <image-url> [filename]`
- Compress an existing image in `images/`: `node make/compress_image.js <image-name> [target-size-kb]`

On Linux, expect these scripts to fail unless rewritten to avoid `sips`.

## High-level architecture

### Runtime entrypoints

- `extension/manifest.json` defines a Manifest V3 extension with:
  - background service worker: `extension/background.js`
  - one content-script bundle injected on `<all_urls>`
  - permissions for `storage` and `contextMenus`
  - host access for remote JSON/image fetches from GitHub raw and jsDelivr
- `extension/background.js` handles install-time behavior:
  - opens onboarding page on first install
  - creates the editable-field context menu item
  - forwards context-menu clicks to the active tab via `chrome.tabs.sendMessage`
- `extension/content.js` is the runtime bootstrap inside pages:
  - fetches remote config via `ConfigManager`
  - chooses a site adapter (`AIStudioSite`, `GeminiSite`, `GeminiEnterpriseSite`, `ChatGPTSite`, `DynamicSite`, fallback `BaseSite`)
  - creates a `BananaModal`
  - wires background messages to `modal.show()`

### Content-script load model

`manifest.json` loads many plain JS files in order. They communicate via globals on `window` rather than imports/exports. Load order is therefore part of the architecture, not an implementation detail.

Important global layers:

1. `extension/lib/`
   - `dom.js`: DOM helpers, including Shadow DOM-aware querying
   - `utils.js`: client-side image/url helpers
   - `store.js`: in-memory state container backed by `chrome.storage.local`
2. `extension/services/`
   - `fetcher.js`: shared fetch-with-cache primitive with stale-cache fallback
   - `config.js`: remote `config.json` loader (5 minute cache)
   - `prompts.js`: remote `prompts.json` loader (60 minute cache) plus reference-image preprocessing
3. `extension/sites/`
   - site adapters encapsulate host-specific selector lookup, theme detection, button insertion, and prompt insertion behavior
4. `extension/ui/`
   - modal and its subcomponents render the searchable prompt gallery and custom-prompt editor
5. `extension/content.js`
   - bootstraps everything after the layers above are present

If you change file names or add new dependencies between these files, update `manifest.json` ordering accordingly.

### Data flow

There are two separate data sources with different purposes:

- `config.json` at repo root:
  - operational config fetched remotely at runtime
  - mainly selector definitions and announcements
  - used to hot-fix site selectors without shipping a new extension build
- `prompts.json` at repo root:
  - prompt catalog fetched remotely at runtime
  - merged in the client with user-authored prompts from `chrome.storage.local`

The fetch path is:

`content.js / Store` → `PromptManager` or `ConfigManager` → `Fetcher.fetchWithCache()` → network fetch → `chrome.storage.local` cache

Failure behavior matters: `fetcher.js` falls back to cached data even when expired; if there is no cache it returns an empty array. Be careful not to break that degraded mode.

### State and UI model

- `extension/lib/store.js` is the only real state hub for the modal.
- Store state includes:
  - remote prompts
  - user custom prompts
  - favorites
  - active filters/category/search keyword
  - sort mode
  - NSFW toggle
  - recent-week toggle
- `BananaModal` subscribes to the store and re-renders cards/pagination when state changes.
- Custom prompts, favorites, sort mode, and NSFW setting persist in `chrome.storage.local`.

### Site adapter design

`extension/sites/base.js` contains the shared behavior:

- tracking the last focused editable element
- locating the current prompt input
- polling/mutation-observer logic to keep the Banana button attached
- generic prompt insertion into textareas or contenteditable fields
- theme color helpers

Derived adapters (`gemini.js`, `ai_studio.js`, `gemini_enterprise.js`, `chatgpt.js`, `dynamic.js`) mainly override:

- prompt-input lookup
- target-button lookup
- theme detection
- button rendering/placement when platform-specific UI differs

`DynamicSite` is the escape hatch for unsupported hosts. It reads selectors from remote `config.json`, so selector changes usually belong in `config.json` before code changes.

### Pages outside the extension runtime

- `extension/pages/onboarding.html` + `onboarding.js`: first-install onboarding opened by the background worker
- `extension/pages/uninstall.html`: uninstall feedback page set through `chrome.runtime.setUninstallURL`
- root `index.html`: public landing page / promo site, not part of the extension runtime
- root `privacy.html`: static privacy page
- root `code-reward-models.md`: research note comparing open code reward models, pairwise training, and pairwise-vs-scalar inference
- `docs/`: study-oriented architecture notes for learning this repository and cloning its extension patterns; start at `docs/README.md`

## Project-specific constraints

- This project relies on remote JSON hosted from the repository default branch. Changes to `config.json`, `prompts.json`, or `images/` affect runtime behavior after the cache window expires even if extension code is unchanged.
- `selectors.json` is deprecated; `config.json` is the authoritative selector source.
- The prompt ingestion workflow is documented in `make/add_prompt.mdc`; follow that when adding prompt entries instead of inventing a new schema.
- The codebase currently uses plain browser globals and direct DOM construction. Do not introduce a framework or build step unless the task explicitly requires that migration.

## When editing

- If a host-specific insert button breaks, inspect both the concrete site adapter and the remote selector definitions in `config.json`; many fixes belong in config, not JS.
- If changing prompt data shape, trace all consumers across `services/prompts.js`, `lib/store.js`, `ui/card.js`, and `ui/prompt_form.js`.
- If changing modal behavior, verify both explicit button opening on supported AI sites and background-triggered opening from the context menu.
