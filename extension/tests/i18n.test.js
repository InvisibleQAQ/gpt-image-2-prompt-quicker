const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadI18n({ storedLocale, browserLocale = 'en-US' } = {}) {
  const filePath = path.join(__dirname, '..', 'lib', 'i18n.js');
  const storage = {};
  if (storedLocale) {
    storage['banana-ui-locale'] = storedLocale;
  }

  const context = {
    chrome: {
      i18n: {
        getUILanguage: () => browserLocale
      },
      storage: {
        local: {
          async get(keys) {
            const result = {};
            keys.forEach((key) => {
              result[key] = storage[key];
            });
            return result;
          },
          async set(values) {
            Object.assign(storage, values);
          }
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
  vm.runInContext(fs.readFileSync(filePath, 'utf8'), context);
  return { I18n: context.I18n, storage };
}

test('i18n normalizes browser locale to zh-CN or en', () => {
  const { I18n } = loadI18n({ browserLocale: 'zh-TW' });
  assert.equal(I18n.normalizeLocale('zh-TW'), 'zh-CN');
  assert.equal(I18n.normalizeLocale('zh-CN'), 'zh-CN');
  assert.equal(I18n.normalizeLocale('en-US'), 'en');
  assert.equal(I18n.normalizeLocale('fr-FR'), 'en');
});

test('i18n prefers stored locale over browser locale', async () => {
  const { I18n } = loadI18n({ storedLocale: 'en', browserLocale: 'zh-CN' });
  const locale = await I18n.init();
  assert.equal(locale, 'en');
  assert.equal(I18n.t('search.category.all'), 'All');
  assert.equal(I18n.t('search.category.label'), 'Category');
  assert.equal(I18n.t('search.category.allSelected'), 'All categories');
});

test('i18n falls back to browser locale when no stored locale exists', async () => {
  const { I18n } = loadI18n({ browserLocale: 'zh-CN' });
  const locale = await I18n.init();
  assert.equal(locale, 'zh-CN');
  assert.equal(I18n.t('search.category.all'), '全部');
  assert.equal(I18n.t('search.category.label'), '分类');
  assert.equal(I18n.t('search.category.allSelected'), '全部分类');
});

test('i18n persists locale changes', async () => {
  const { I18n, storage } = loadI18n({ browserLocale: 'en-US' });
  await I18n.setLocale('zh-CN', { persist: true });
  assert.equal(storage['banana-ui-locale'], 'zh-CN');
  assert.equal(I18n.t('pagination.next'), '下一页');
});
