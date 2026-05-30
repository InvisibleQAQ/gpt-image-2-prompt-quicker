const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createTextareaElement() {
  return {
    tagName: 'TEXTAREA',
    isContentEditable: false,
    className: 'wcDTda_fallbackTextarea',
    value: '',
    dispatchEvent() {},
    focus() {},
    setSelectionRange() {}
  };
}

function createContentEditableElement() {
  return {
    tagName: 'DIV',
    isContentEditable: true,
    innerHTML: 'existing',
    focused: false,
    dispatchEvent() {},
    contains() { return false; },
    focus() {
      this.focused = true;
    }
  };
}

function createDomNode(tag, props = {}, children = []) {
  const listeners = {};
  const attributes = {};
  const styleState = { cssText: '' };
  const node = {
    tagName: String(tag).toUpperCase(),
    children: [],
    listeners,
    attributes,
    style: styleState,
    className: '',
    textContent: '',
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      attributes[name] = value;
      this[name] = value;
    }
  };

  Object.entries(props || {}).forEach(([key, value]) => {
    if (key === 'className') {
      node.className = value;
      return;
    }
    if (key === 'textContent') {
      node.textContent = value;
      return;
    }
    if (key === 'style') {
      if (typeof value === 'string') {
        node.style.cssText = value;
      } else {
        Object.assign(node.style, value);
      }
      return;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.toLowerCase().substring(2), value);
      return;
    }
    node.setAttribute(key, value);
  });

  const normalizedChildren = Array.isArray(children) ? children : [children];
  normalizedChildren.forEach((child) => {
    if (child === null || child === undefined) return;
    if (typeof child === 'string' || typeof child === 'number') {
      node.appendChild({ nodeType: 3, textContent: String(child) });
      return;
    }
    node.appendChild(child);
  });

  return node;
}

function loadSites({ querySelectorShadowDom } = {}) {
  const logs = [];
  const baseSitePath = path.join(__dirname, '..', 'sites', 'base.js');
  const chatgptSitePath = path.join(__dirname, '..', 'sites', 'chatgpt.js');
  const context = {
    console: {
      ...console,
      log: (...args) => logs.push(args)
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Event: class Event {
      constructor(type, init = {}) {
        this.type = type;
        this.bubbles = !!init.bubbles;
      }
    },
    InputEvent: class InputEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.bubbles = !!init.bubbles;
        this.cancelable = !!init.cancelable;
        this.composed = !!init.composed;
        this.inputType = init.inputType;
        this.data = init.data;
      }
    },
    ClipboardEvent: class ClipboardEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.bubbles = !!init.bubbles;
        this.cancelable = !!init.cancelable;
        this.clipboardData = init.clipboardData;
      }
    },
    DataTransfer: class DataTransfer {
      constructor() {
        this.items = {
          _items: [],
          add: (file) => this.items._items.push(file)
        };
      }
    },
    MutationObserver: class MutationObserver {
      observe() {}
      disconnect() {}
    },
    chrome: {
      runtime: {
        getURL: (path) => `chrome-extension://${path}`
      }
    },
    window: {
      matchMedia: () => ({ matches: false }),
      DOM: { querySelectorShadowDom: querySelectorShadowDom || (() => null), create: createDomNode },
      ConfigManager: { get: async () => ({ selectors: {} }) },
      Utils: {
        urlToFile: async (url, filename) => ({ url, filename }),
        base64ToFile: (data, filename) => ({ data, filename })
      },
      getSelection: () => ({
        rangeCount: 0,
        removeAllRanges() {},
        addRange() {}
      }),
      addEventListener() {},
      removeEventListener() {}
    },
    document: {
      addEventListener() {},
      body: { classList: { contains: () => false } },
      documentElement: {
        classList: { contains: () => false },
        getAttribute: () => null
      },
      activeElement: null,
      getElementById: () => null,
      createRange: () => ({
        selectNodeContents() {},
        collapse() {}
      })
    }
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(baseSitePath, 'utf8'), context);
  vm.runInContext('this.BaseSite = BaseSite;', context);
  vm.runInContext(fs.readFileSync(chatgptSitePath, 'utf8'), context);
  vm.runInContext('this.ChatGPTSite = ChatGPTSite;', context);
  context.__logs = logs;
  return context;
}

test('ChatGPT prompt input lookup should prefer the visible ProseMirror editor over the hidden fallback textarea', async () => {
  const textarea = createTextareaElement();
  const proseMirror = createContentEditableElement();
  proseMirror.id = 'prompt-textarea';
  proseMirror.className = 'ProseMirror';

  const context = loadSites({
    querySelectorShadowDom: (selector) => {
      if (selector === 'div.ProseMirror#prompt-textarea[contenteditable="true"]') return proseMirror;
      if (selector === '#prompt-textarea.ProseMirror[contenteditable="true"]') return proseMirror;
      if (selector === 'textarea[name="prompt-textarea"]') return textarea;
      if (selector.includes(',')) return textarea;
      return null;
    }
  });
  const ChatGPTSite = context.ChatGPTSite;
  const site = new ChatGPTSite();

  const result = await site.findPromptInput();

  assert.equal(result, proseMirror);
});

test('ChatGPT prompt insertion should upload reference images before inserting text', async () => {
  const context = loadSites();
  const ChatGPTSite = context.ChatGPTSite;
  const site = new ChatGPTSite();
  const editor = createContentEditableElement();
  const imagePayload = ['data:image/jpeg;base64,abc'];
  const insertImagesCalls = [];

  site.findPromptInput = async () => editor;
  site.insertImages = async (images) => {
    insertImagesCalls.push(images);
  };

  await site.insertPrompt({
    prompt: 'hello world',
    referenceImages: imagePayload
  });

  assert.deepEqual(insertImagesCalls, [imagePayload]);
});

test('ChatGPT prompt insertion should dispatch an input event with insertText semantics after uploading images', async () => {
  const context = loadSites();
  const ChatGPTSite = context.ChatGPTSite;
  const site = new ChatGPTSite();
  const editor = createContentEditableElement();
  const events = [];
  let insertImagesCalls = 0;

  editor.dispatchEvent = (event) => {
    events.push(event);
  };

  site.findPromptInput = async () => editor;
  site.insertImages = async () => {
    insertImagesCalls += 1;
  };

  await site.insertPrompt({
    prompt: 'line 1\nline 2',
    referenceImages: ['data:image/jpeg;base64,abc']
  });

  assert.equal(insertImagesCalls, 1);
  assert.equal(editor.focused, true);
  assert.ok(events.some(event => event.type === 'input' && event.inputType === 'insertText' && event.data === 'line 1\nline 2'));
});

test('ChatGPT prompt insertion should pass the full prompt payload to textarea fallback', async () => {
  const context = loadSites();
  const ChatGPTSite = context.ChatGPTSite;
  const BaseSite = context.BaseSite;
  const site = new ChatGPTSite();
  const textarea = createTextareaElement();
  const payload = {
    prompt: 'fallback text',
    referenceImages: ['data:image/jpeg;base64,abc']
  };
  let forwardedPayload = null;

  site.findPromptInput = async () => textarea;
  BaseSite.prototype.insertPrompt = async function(promptData) {
    forwardedPayload = promptData;
  };

  await site.insertPrompt(payload);

  assert.equal(forwardedPayload, payload);
});

test('ChatGPT prompt insertion should emit debug logs for the chosen input path', async () => {
  const context = loadSites();
  const ChatGPTSite = context.ChatGPTSite;
  const site = new ChatGPTSite();
  const editor = createContentEditableElement();

  site.findPromptInput = async () => editor;
  await site.insertPrompt({ prompt: 'debug me' });

  assert.ok(context.__logs.some(args => args[0] === 'Banana: ChatGPT insertPrompt debug'));
});

test('ChatGPT button should stay icon-only outside image mode', () => {
  const context = loadSites();
  const ChatGPTSite = context.ChatGPTSite;
  const site = new ChatGPTSite();

  const button = site.createButton();

  assert.equal(button.tagName, 'BUTTON');
  assert.equal(button.className, 'composer-btn banana-prompt-button');
  assert.equal(button.children.length, 1);
  assert.equal(button.children[0].tagName, 'IMG');
  assert.match(button.style.cssText, /width:\s*36px/);
  assert.match(button.style.cssText, /padding:\s*0/);
});

test('ChatGPT button should show prompts text in image mode', () => {
  const imageEditor = createContentEditableElement();
  imageEditor.querySelector = (selector) => {
    if (selector === 'p.placeholder') {
      return {
        dataset: { placeholder: 'Describe or edit an image' },
        getAttribute: () => 'Describe or edit an image'
      };
    }
    return null;
  };

  const context = loadSites({
    querySelectorShadowDom: (selector) => {
      if (selector === '[data-testid="composer-footer-actions"]') return { tagName: 'DIV' };
      if (selector === '#prompt-textarea.ProseMirror[contenteditable="true"]') return imageEditor;
      return null;
    }
  });
  const ChatGPTSite = context.ChatGPTSite;
  const site = new ChatGPTSite();

  const button = site.createButton();

  assert.equal(button.tagName, 'BUTTON');
  assert.equal(button.className, 'composer-btn banana-prompt-button');
  assert.equal(button['aria-label'], 'prompts');
  assert.equal(button.title, 'prompts');
  assert.equal(button.children.length, 2);
  assert.equal(button.children[0].tagName, 'IMG');
  assert.equal(button.children[1].tagName, 'SPAN');
  assert.equal(button.children[1].textContent, 'prompts');
  assert.match(button.style.cssText, /gap:\s*6px/);
  assert.match(button.style.cssText, /padding:\s*0 12px/);
  assert.doesNotMatch(button.style.cssText, /width:\s*36px/);
});

test('ChatGPT button should upgrade to prompts pill after switching into image mode', async () => {
  const defaultEditor = createContentEditableElement();
  defaultEditor.querySelector = () => ({
    dataset: { placeholder: 'Ask anything' },
    getAttribute: () => 'Ask anything'
  });

  const imageEditor = createContentEditableElement();
  imageEditor.querySelector = () => ({
    dataset: { placeholder: 'Describe or edit an image' },
    getAttribute: () => 'Describe or edit an image'
  });

  const triggerWrapper = {
    parentElement: { style: {} },
    insertAdjacentElement(position, element) {
      this.inserted = { position, element };
    }
  };

  const target = {
    parentElement: triggerWrapper.parentElement,
    closest: () => triggerWrapper
  };

  let currentButton = null;
  let imageMode = false;
  const context = loadSites({
    querySelectorShadowDom: (selector) => {
      if (selector === '#banana-btn') return currentButton;
      if (selector === 'button[data-testid="composer-plus-btn"], button#composer-plus-btn') return target;
      if (selector === '[data-testid="composer-footer-actions"]') return imageMode ? { tagName: 'DIV' } : null;
      if (selector === '#prompt-textarea.ProseMirror[contenteditable="true"]') return imageMode ? imageEditor : defaultEditor;
      return null;
    }
  });
  const ChatGPTSite = context.ChatGPTSite;
  const site = new ChatGPTSite();

  await site._insertButtonIfNotExists();
  currentButton = triggerWrapper.inserted.element;
  assert.equal(currentButton.children.length, 1);

  imageMode = true;
  await site._handleMutation();

  assert.equal(currentButton.children.length, 2);
  assert.equal(currentButton.children[1].textContent, 'prompts');
  assert.match(currentButton.style.cssText, /padding:\s*0 12px/);
});
