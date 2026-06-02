const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadPromptUtils({ browserLocale = 'en-US' } = {}) {
  const i18nPath = path.join(__dirname, '..', 'lib', 'i18n.js');
  const promptUtilsPath = path.join(__dirname, '..', 'lib', 'prompt_utils.js');

  const context = {
    chrome: {
      i18n: {
        getUILanguage: () => browserLocale
      },
      storage: {
        local: {
          async get() {
            return {};
          },
          async set() {}
        }
      }
    },
    navigator: {
      language: browserLocale
    },
    window: {},
    globalThis: null
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(i18nPath, 'utf8'), context);
  vm.runInContext(fs.readFileSync(promptUtilsPath, 'utf8'), context);
  return context.PromptUtils;
}

test('getPromptDisplayTitle prefers localized title for current locale', () => {
  const PromptUtils = loadPromptUtils({ browserLocale: 'zh-CN' });
  const prompt = {
    title: 'Legacy title',
    localized_titles: {
      'zh-CN': '中文标题',
      en: 'English title'
    }
  };

  assert.equal(PromptUtils.getPromptDisplayTitle(prompt, 'zh-CN'), '中文标题');
  assert.equal(PromptUtils.getPromptDisplayTitle(prompt, 'en'), 'English title');
});

test('getPromptDisplayTitle falls back to title string when localized title is absent', () => {
  const PromptUtils = loadPromptUtils();
  const prompt = { title: 'Legacy title' };

  assert.equal(PromptUtils.getPromptDisplayTitle(prompt, 'en'), 'Legacy title');
});

test('getPromptId falls back to legacy key when id is absent', () => {
  const PromptUtils = loadPromptUtils();
  const prompt = { title: 'Legacy title', author: '@demo' };

  assert.equal(PromptUtils.getPromptId(prompt), 'Legacy title-@demo');
});

test('favoriteMatchesPrompt accepts canonical id and legacy key', () => {
  const PromptUtils = loadPromptUtils();
  const prompt = { id: 'prompt-1', title: 'Legacy title', author: '@demo' };

  assert.equal(PromptUtils.favoriteMatchesPrompt(prompt, ['prompt-1']), true);
  assert.equal(PromptUtils.favoriteMatchesPrompt(prompt, ['Legacy title-@demo']), true);
  assert.equal(PromptUtils.favoriteMatchesPrompt(prompt, ['other']), false);
});

test('getPromptSearchTexts includes title variants and searchable fields', () => {
  const PromptUtils = loadPromptUtils();
  const prompt = {
    title: 'Legacy title',
    localized_titles: {
      'zh-CN': '中文标题',
      en: 'English title'
    },
    author: '@demo',
    prompt: 'Prompt body',
    sub_category: 'Category'
  };

  const texts = PromptUtils.getPromptSearchTexts(prompt, 'zh-CN');
  assert.deepEqual(texts, ['中文标题', 'Legacy title', 'English title', 'Prompt body', '@demo', 'Category']);
});
