const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createFrozenDate(nowIso) {
  const RealDate = Date;

  return class FrozenDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(nowIso);
        return;
      }
      super(...args);
    }

    static now() {
      return new RealDate(nowIso).getTime();
    }
  };
}

function loadStore({ now = '2026-06-02T12:00:00+08:00' } = {}) {
  const filePath = path.join(__dirname, '..', 'lib', 'store.js');
  const context = {
    chrome: {
      storage: {
        local: {
          async get() {
            return {};
          },
          async set() {}
        }
      }
    },
    window: {
      I18n: {
        t: (key, fallback) => fallback || key,
        init: async () => 'en',
        setLocale: async () => {},
        normalizeLocale: (locale) => locale
      },
      PromptUtils: {
        getPromptSearchTexts: (prompt) => [prompt.title || '', prompt.prompt || '', prompt.author || ''],
        favoriteMatchesPrompt: () => false,
        getPromptId: (prompt) => prompt.id
      }
    },
    Date: createFrozenDate(now),
    console,
    globalThis: null
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, 'utf8'), context);
  vm.runInContext('this.Store = Store;', context);
  return context.Store;
}

test('recentWeek should keep only prompts created within the last seven days when created uses ISO timestamps', () => {
  const Store = loadStore();
  const store = new Store();

  store.state.prompts = [
    {
      id: 'recent',
      title: 'Recent prompt',
      prompt: 'recent',
      author: 'tester',
      mode: 'generate',
      created: '2026-06-01T09:40:59+08:00'
    },
    {
      id: 'old',
      title: 'Old prompt',
      prompt: 'old',
      author: 'tester',
      mode: 'generate',
      created: '2026-05-20T09:40:59+08:00'
    }
  ];
  store.state.recentWeekEnabled = true;

  const filtered = store.getFilteredPrompts();

  assert.deepEqual(
    filtered.map((prompt) => prompt.id),
    ['__flash_mode__', 'recent']
  );
});
