const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createDomNode(tag, props = {}, children = []) {
  const node = {
    tagName: String(tag).toUpperCase(),
    children: [],
    style: { cssText: '' },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener() {},
    remove() {}
  };

  Object.entries(props || {}).forEach(([key, value]) => {
    if (key === 'style') {
      node.style.cssText = value;
      return;
    }
    node[key] = value;
  });

  const normalizedChildren = Array.isArray(children) ? children : [children];
  normalizedChildren.forEach((child) => {
    if (child === null || child === undefined) return;
    node.appendChild(child);
  });

  return node;
}

function loadModal() {
  const filePath = path.join(__dirname, '..', 'ui', 'modal.js');
  let capturedSearchProps = null;

  class SearchStub {
    constructor(props) {
      capturedSearchProps = props;
      this.props = props;
    }

    render() {
      return createDomNode('div');
    }

    updateView() {}

    destroy() {}
  }

  const context = {
    window: {
      innerWidth: 1280,
      DOM: { h: createDomNode },
      UI: {
        Search: SearchStub,
        Pagination: class {},
        Announcement: class {},
        Card: { create() {} },
        PromptForm: class {}
      },
      I18n: {
        t: (key, fallback) => fallback || key
      }
    },
    document: {
      addEventListener() {},
      removeEventListener() {},
      getElementById() { return null; },
      body: { appendChild() {} }
    },
    console,
    Store: class {},
    globalThis: null
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, 'utf8'), context);
  vm.runInContext('this.BananaModal = BananaModal;', context);

  return {
    BananaModal: context.BananaModal,
    getCapturedSearchProps: () => capturedSearchProps
  };
}

test('locale change should preserve current pagination page', async () => {
  const { BananaModal, getCapturedSearchProps } = loadModal();
  const modal = new BananaModal({
    getThemeColors() {
      return { background: '#fff', border: '#ddd' };
    }
  });

  let setLocaleCalls = 0;
  let resetPageCalls = 0;

  modal.store = {
    state: {
      categories: new Set(),
      selectedCategory: 'all',
      activeFilters: new Set(),
      sortMode: 'recommend',
      nsfwEnabled: true,
      recentWeekEnabled: false,
      locale: 'en'
    },
    async setLocale(locale) {
      setLocaleCalls += 1;
      this.state.locale = locale;
    }
  };
  modal.paginationComponent = {
    currentPage: 9,
    resetPage() {
      resetPageCalls += 1;
      this.currentPage = 1;
    }
  };

  modal.createSearchSection();
  const searchProps = getCapturedSearchProps();

  await searchProps.onLocaleChange('zh-CN');

  assert.equal(setLocaleCalls, 1);
  assert.equal(modal.paginationComponent.currentPage, 9);
  assert.equal(resetPageCalls, 0);
});

test('search section should expose only recent, favorite, and custom quick filters', () => {
  const { BananaModal, getCapturedSearchProps } = loadModal();
  const modal = new BananaModal({
    getThemeColors() {
      return { background: '#fff', border: '#ddd' };
    }
  });

  modal.store = {
    state: {
      categories: new Set(),
      selectedCategory: 'all',
      activeFilters: new Set(),
      sortMode: 'recommend',
      nsfwEnabled: true,
      recentWeekEnabled: false,
      locale: 'en'
    },
    async setLocale() {}
  };
  modal.paginationComponent = {
    currentPage: 1,
    resetPage() {}
  };

  modal.createSearchSection();
  const searchProps = getCapturedSearchProps();

  assert.deepEqual(Array.from(searchProps.activeFilters), []);
  assert.equal(typeof searchProps.onFilterChange, 'function');
});
