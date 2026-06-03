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
    removeEventListener() {},
    remove() {},
    setAttribute(name, value) {
      this[name] = value;
    },
    contains(target) {
      if (this === target) return true;
      return this.children.some((child) => child && typeof child.contains === 'function' && child.contains(target));
    },
    querySelector(selector) {
      if (!selector.startsWith('#')) return null;
      const targetId = selector.slice(1);
      if (this.id === targetId) return this;
      for (const child of this.children) {
        if (!child || typeof child.querySelector !== 'function') continue;
        const match = child.querySelector(selector);
        if (match) return match;
      }
      return null;
    }
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
    if (typeof child === 'string') {
      node.appendChild({ textContent: child });
      return;
    }
    node.appendChild(child);
  });

  return node;
}

function collectIds(node, ids = []) {
  if (!node || typeof node !== 'object') return ids;
  if (node.id) ids.push(node.id);
  if (Array.isArray(node.children)) {
    node.children.forEach((child) => collectIds(child, ids));
  }
  return ids;
}

function loadSearchComponent() {
  const searchPath = path.join(__dirname, '..', 'ui', 'search.js');
  const promptUtilsPath = path.join(__dirname, '..', 'lib', 'prompt_utils.js');
  const context = {
    window: {
      DOM: { h: createDomNode },
      UI: {},
      I18n: {
        t: (key, fallback) => fallback || key,
        getLocale: () => 'en',
        getLanguageOptions: () => [
          { value: 'zh-CN', label: '简体中文' },
          { value: 'en', label: 'English' }
        ]
      }
    },
    navigator: {
      language: 'en-US'
    },
    document: {
      addEventListener() {},
      removeEventListener() {}
    },
    console,
    globalThis: null
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(promptUtilsPath, 'utf8'), context);
  vm.runInContext(fs.readFileSync(searchPath, 'utf8'), context);

  return context.window.UI.Search;
}

test('search quick filters should not include generate or edit chips', () => {
  const SearchComponent = loadSearchComponent();
  const component = new SearchComponent({
    colors: {
      text: '#111',
      textSecondary: '#666',
      primary: '#000',
      border: '#ddd',
      inputBorder: '#ddd',
      inputBg: '#fff',
      surface: '#fff',
      surfaceHover: '#f5f5f5',
      shadow: 'rgba(0,0,0,0.1)'
    },
    isMobile: false,
    categories: new Set(['Portrait']),
    selectedCategory: 'all',
    activeFilters: new Set(),
    sortMode: 'recommend',
    nsfwEnabled: true,
    recentWeekEnabled: false,
    locale: 'en'
  });

  const root = component.render();
  const ids = collectIds(root);

  assert.ok(ids.includes('filter-recent-week'));
  assert.ok(ids.includes('filter-favorite'));
  assert.ok(ids.includes('filter-custom'));
  assert.ok(!ids.includes('filter-generate'));
  assert.ok(!ids.includes('filter-edit'));
});

test('category dropdown should show an explicit filter label in default state', () => {
  const SearchComponent = loadSearchComponent();
  const component = new SearchComponent({
    colors: {
      text: '#111',
      textSecondary: '#666',
      primary: '#000',
      border: '#ddd',
      inputBorder: '#ddd',
      inputBg: '#fff',
      surface: '#fff',
      surfaceHover: '#f5f5f5',
      shadow: 'rgba(0,0,0,0.1)'
    },
    isMobile: false,
    categories: new Set(['Portrait']),
    selectedCategory: 'all',
    activeFilters: new Set(),
    sortMode: 'recommend',
    nsfwEnabled: true,
    recentWeekEnabled: false,
    locale: 'en'
  });

  component.render();

  assert.equal(component.refs.dropdowns.category.triggerText.textContent, 'Category · All categories');
  assert.equal(component.refs.dropdowns.locale.triggerText.textContent, 'English');
});

test('category dropdown should show selected category with explicit label', () => {
  const SearchComponent = loadSearchComponent();
  const component = new SearchComponent({
    colors: {
      text: '#111',
      textSecondary: '#666',
      primary: '#000',
      border: '#ddd',
      inputBorder: '#ddd',
      inputBg: '#fff',
      surface: '#fff',
      surfaceHover: '#f5f5f5',
      shadow: 'rgba(0,0,0,0.1)'
    },
    isMobile: false,
    categories: new Set(['Portrait']),
    selectedCategory: 'Portrait',
    activeFilters: new Set(),
    sortMode: 'recommend',
    nsfwEnabled: true,
    recentWeekEnabled: false,
    locale: 'en'
  });

  component.render();

  assert.equal(component.refs.dropdowns.category.triggerText.textContent, 'Category · Portrait');
});

test('category dropdown should localize chinese category values in english mode', () => {
  const SearchComponent = loadSearchComponent();
  const component = new SearchComponent({
    colors: {
      text: '#111',
      textSecondary: '#666',
      primary: '#000',
      border: '#ddd',
      inputBorder: '#ddd',
      inputBg: '#fff',
      surface: '#fff',
      surfaceHover: '#f5f5f5',
      shadow: 'rgba(0,0,0,0.1)'
    },
    isMobile: false,
    categories: new Set(['摄影', '海报']),
    selectedCategory: '摄影',
    activeFilters: new Set(),
    sortMode: 'recommend',
    nsfwEnabled: true,
    recentWeekEnabled: false,
    locale: 'en'
  });

  component.render();

  assert.equal(component.refs.dropdowns.category.triggerText.textContent, 'Category · Photography');
});
