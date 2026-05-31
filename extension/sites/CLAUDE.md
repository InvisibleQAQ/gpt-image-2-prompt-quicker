# CLAUDE.md

## Scope

Applies to files in `extension/sites/`.

## Notes

- Site adapters own host-specific selectors, launcher placement, theme detection, and prompt insertion quirks.
- Keep ChatGPT launcher identifiers aligned with tests and shared code: DOM id `image2-btn`, class `image2-prompt-button`.
- If changing adapter behavior, preserve fallback behavior from `BaseSite` and avoid breaking unsupported hosts that rely on `DynamicSite`.
- When changing selectors or launcher placement for ChatGPT, verify `extension/tests/chatgpt_site.test.js` and update it if needed.
