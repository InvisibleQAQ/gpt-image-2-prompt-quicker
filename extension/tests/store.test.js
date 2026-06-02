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

function loadStore({ now = '2026-06-02T12:00:00+08:00', storageData = {} } = {}) {
  const filePath = path.join(__dirname, '..', 'lib', 'store.js');
  const storage = { ...storageData };
  const setCalls = [];
  const context = {
    chrome: {
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
            setCalls.push(values);
            Object.assign(storage, values);
          }
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
  return { Store: context.Store, storage, setCalls };
}

test('recentWeek should keep only prompts used within the last seven days and sort by latest usage', () => {
  const { Store } = loadStore();
  const store = new Store();

  store.state.prompts = [
    {
      id: 'recent-a',
      title: 'Recent A',
      prompt: 'recent-a',
      author: 'tester',
      mode: 'generate',
      created: '2026-06-01T09:40:59+08:00'
    },
    {
      id: 'old-used',
      title: 'Old Used',
      prompt: 'old-used',
      author: 'tester',
      mode: 'generate',
      created: '2026-06-01T09:40:59+08:00'
    },
    {
      id: 'unused-new',
      title: 'Unused New',
      prompt: 'unused-new',
      author: 'tester',
      mode: 'generate',
      created: '2026-06-01T09:40:59+08:00'
    },
    {
      id: 'recent-b',
      title: 'Recent B',
      prompt: 'recent-b',
      author: 'tester',
      mode: 'generate',
      created: '2026-05-01T09:40:59+08:00'
    }
  ];
  store.state.recentWeekEnabled = true;
  store.state.recentPromptUsage = {
    'recent-a': '2026-06-01T12:00:00.000Z',
    'old-used': '2026-05-20T12:00:00.000Z',
    'recent-b': '2026-06-02T02:00:00.000Z'
  };

  const filtered = store.getFilteredPrompts();

  assert.deepEqual(
    Array.from(filtered, (prompt) => prompt.id),
    ['recent-b', 'recent-a']
  );
});

test('recordPromptUsage should persist one canonical timestamp per prompt and prune expired entries', async () => {
  const { Store, storage, setCalls } = loadStore({
    storageData: {
      'banana-recent-prompt-usage': {
        stale: '2026-05-20T12:00:00.000Z'
      }
    }
  });
  const store = new Store();

  await store.loadRecentPromptUsage();
  await store.recordPromptUsage({ id: 'prompt-1', title: 'Prompt 1' });
  await store.recordPromptUsage({ id: 'prompt-1', title: 'Prompt 1' });

  assert.deepEqual(Array.from(Object.keys(store.state.recentPromptUsage)), ['prompt-1']);
  assert.equal(store.state.recentPromptUsage['prompt-1'], '2026-06-02T04:00:00.000Z');
  assert.equal(
    JSON.stringify(storage['banana-recent-prompt-usage']),
    JSON.stringify({
      'prompt-1': '2026-06-02T04:00:00.000Z'
    })
  );
  assert.ok(setCalls.length >= 2);
});
