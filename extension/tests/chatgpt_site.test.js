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
    window: {
      matchMedia: () => ({ matches: false }),
      DOM: { querySelectorShadowDom: querySelectorShadowDom || (() => null), create: () => ({}) },
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

test('ChatGPT prompt insertion should not upload reference images when inserting a prompt card', async () => {
  const context = loadSites();
  const ChatGPTSite = context.ChatGPTSite;
  const site = new ChatGPTSite();
  const editor = createContentEditableElement();
  let insertImagesCalls = 0;

  site.findPromptInput = async () => editor;
  site.insertImages = async () => {
    insertImagesCalls += 1;
  };

  await site.insertPrompt({
    prompt: 'hello world',
    referenceImages: ['data:image/jpeg;base64,abc']
  });

  assert.equal(insertImagesCalls, 0);
});

test('ChatGPT prompt insertion should dispatch an input event with insertText semantics', async () => {
  const context = loadSites();
  const ChatGPTSite = context.ChatGPTSite;
  const site = new ChatGPTSite();
  const editor = createContentEditableElement();
  const events = [];

  editor.dispatchEvent = (event) => {
    events.push(event);
  };

  site.findPromptInput = async () => editor;
  site.insertImages = async () => {
    throw new Error('should not upload images for ChatGPT prompt insertion');
  };

  await site.insertPrompt({
    prompt: 'line 1\nline 2',
    referenceImages: ['data:image/jpeg;base64,abc']
  });

  assert.equal(editor.focused, true);
  assert.ok(events.some(event => event.type === 'input' && event.inputType === 'insertText' && event.data === 'line 1\nline 2'));
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
