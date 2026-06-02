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
- Primary manual test target from the README: `https://chatgpt.com/`
- Context-menu path matters too: focus any editable field on any site, right click, and trigger `Insert Prompts`

### Repository inspection

- Check root files: `ls -la`
- Check extension contents: `ls -la extension`
- Merge docs markdown: `python3 make/merge_docs.py`
- Package the extension directory into a ZIP from WSL2/Linux: `bash make/zip_extension.sh`

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
  - branding migration note: if site URL / uninstall URL / Chrome Web Store URL / Firefox Gecko ID are still unknown, do not invent replacements; document placeholders in `BRAND_PLACEHOLDERS.md`, and keep old uninstall URL / Gecko ID until real values exist because clearing them breaks functionality or packaging
- `extension/background.js` handles install-time behavior:
  - opens onboarding page on first install
  - creates the editable-field context menu item
  - forwards context-menu clicks to the active tab via `chrome.tabs.sendMessage`
- `extension/content.js` is the runtime bootstrap inside pages:
  - fetches remote config via `ConfigManager`
  - chooses a site adapter (`ChatGPTSite`, `DynamicSite`, fallback `BaseSite`)
  - creates a `BananaModal`
  - wires background messages to `modal.show()`

### Content-script load model

`manifest.json` loads many plain JS files in order. They communicate via globals on `window` rather than imports/exports. Load order is therefore part of the architecture, not an implementation detail.

Important global layers:

1. `extension/lib/`
   - `dom.js`: DOM helpers, including Shadow DOM-aware querying
   - `utils.js`: client-side image/url helpers
   - `i18n.js`: lightweight runtime locale helper; it owns the `banana-ui-locale` storage key and must load before scripts that call `window.I18n`
   - `prompt_utils.js`: prompt-domain helpers for locale-aware title resolution, stable prompt IDs, and cross-locale search text generation; it must load before `store.js`, `ui/*`, and any page script that consumes prompt metadata
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

If you change file names or add new dependencies between these files, update `manifest.json` ordering accordingly. In particular, `extension/lib/i18n.js` must stay before scripts that call `window.I18n`, and `extension/lib/prompt_utils.js` must stay before consumers that resolve prompt titles or IDs. Prompt title localization is schema-aware: keep `title` as the backward-compatible string field, and add optional `id` plus `localized_titles` when a prompt needs locale-specific display text.

### Data flow

There are two separate data sources with different purposes:

- `config.json` at repo root:
  - operational config fetched remotely at runtime
  - mainly selector definitions and announcements
  - used to hot-fix site selectors without shipping a new extension build
- `prompts.json` at repo root:
  - prompt catalog fetched remotely at runtime
  - merged in the client with user-authored prompts from `chrome.storage.local`
  - `reference_image_urls` entries are fetched and precompressed client-side; invalid or non-image URLs are skipped per entry rather than aborting the whole prompt list
  - `created` is prompt metadata only; store it as an ISO timestamp with timezone offset, for example `2026-05-28T09:40:59+08:00`

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
  - recent prompt usage history persisted in `chrome.storage.local` (`banana-recent-prompt-usage`) for the `最近使用` / `Recently used` filter
- Quick filters in the modal are `最近使用` / `Recently used`, `收藏` / `Favorites`, and `自定义` / `Custom`; do not reintroduce separate `文生图` / `Generate` or `编辑` / `Edit` quick-filter chips unless the product requirement changes.
- The category selector in the modal toolbar is an emphasized filter entry point: keep it visually more prominent than the locale selector and keep its closed-state label self-describing (for example `分类 · 全部分类` / `Category · All categories`) so users can discover category filtering without opening the dropdown.
- `BananaModal` subscribes to the store and re-renders cards/pagination when state changes.
- Locale changes are live: the modal updates shell text in place, refreshes the launcher button label/tooltip, and reopens the custom prompt form so translated field labels/buttons are rebuilt from current store locale; changing locale must not reset the current pagination page, though page count may still clamp if the filtered result set shrinks.
- `extension/ui/pagination.js` renders the footer pagination controls plus a GitHub link; keep footer social actions minimal and update this note if they change.
- Custom prompts, favorites, sort mode, and NSFW setting persist in `chrome.storage.local`; note that the NSFW toggle defaults with nullish coalescing, so an explicit stored `false` must remain false.

### Site adapter design

`extension/sites/base.js` contains the shared behavior:

- tracking the last focused editable element
- locating the current prompt input
- polling/mutation-observer logic to keep the prompt launcher button attached
- generic prompt insertion into textareas or contenteditable fields
- theme color helpers

Derived adapters (`chatgpt.js`, `dynamic.js`) mainly override:

- prompt-input lookup
- target-button lookup
- theme detection
- button rendering/placement when platform-specific UI differs
- `ChatGPTSite` renders the launcher button with the packaged extension icon via `chrome.runtime.getURL('icon16.png')`; keep icon asset references in sync with `manifest.json` web-accessible resources
- `ChatGPTSite` must insert the launcher after the native plus button's outer trigger wrapper rather than inside it; otherwise ChatGPT's own plus-button tooltip (`Add files and more`) captures hover for the extension icon. Launcher tooltip/accessibility text is controlled in `extension/sites/chatgpt.js`, while the native plus button keeps ChatGPT's own `aria-label`
- `ChatGPTSite` keeps the launcher icon-only in the default composer, but switches to an icon + `prompts` pill in image mode when the composer exposes image-footer controls such as `composer-footer-actions` / aspect-ratio controls
- host-specific prompt insertion quirks (for example, ChatGPT uses a ProseMirror editor, pastes reference images first when present, then inserts text through its custom editor path)

`DynamicSite` is the escape hatch for unsupported hosts. It reads selectors from remote `config.json`, so selector changes usually belong in `config.json` before code changes.

### Tests

- Minimal regression tests live in `extension/tests/` and use Node's built-in `node:test` runner.
- Run a focused regression with `node --test extension/tests/<file>.test.js`.

### Pages outside the extension runtime

- `extension/pages/onboarding.html` + `onboarding.js`: first-install onboarding opened by the background worker; the welcome heading uses the packaged extension icon asset (`extension/icon48.png`) rather than an inline emoji/remote icon, and locale init should also sync `document.documentElement.lang`
- `extension/pages/uninstall.html`: uninstall feedback page set through `chrome.runtime.setUninstallURL`; the logo uses the packaged extension icon asset (`extension/icon128.png`), and locale init should also sync `document.documentElement.lang`; if the new uninstall URL is unknown during rebranding, keep the existing uninstall URL instead of clearing it
- root `index.html`: public landing page / promo site, not part of the extension runtime; it fetches the same remote `prompts.json` / `config.json` as the extension, uses packaged extension icons for favicon/header branding, and must bind card actions with DOM listeners rather than inline event-handler strings because prompt text can contain quotes
- root `privacy.html`: static privacy page
- root `code-reward-models.md`: research note comparing open code reward models, pairwise training, and pairwise-vs-scalar inference
- `docs/`: study-oriented architecture notes for learning this repository and cloning its extension patterns; start at `docs/README.md`

## Project-specific constraints

- This project relies on remote JSON hosted from the repository default branch. Changes to `config.json`, `prompts.json`, or `images/` affect runtime behavior after the cache window expires even if extension code is unchanged.
- Brand migration placeholders live in `BRAND_PLACEHOLDERS.md`; use that file for unresolved public URLs/IDs instead of guessing values in code or docs.
- `selectors.json` is deprecated; `config.json` is the authoritative selector source.
- The prompt ingestion workflow is documented in `make/add_prompt.mdc`; follow that when adding prompt entries instead of inventing a new schema.
- The codebase currently uses plain browser globals and direct DOM construction. Do not introduce a framework or build step unless the task explicitly requires that migration.

## When editing

- If a host-specific insert button breaks, inspect both the concrete site adapter and the remote selector definitions in `config.json`; many fixes belong in config, not JS.
- If changing prompt data shape, trace all consumers across `services/prompts.js`, `lib/store.js`, `ui/card.js`, and `ui/prompt_form.js`.
- If changing modal behavior, verify both explicit button opening on supported AI sites and background-triggered opening from the context menu.
