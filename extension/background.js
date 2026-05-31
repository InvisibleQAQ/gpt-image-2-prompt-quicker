const STORAGE_KEY = 'banana-ui-locale';

function normalizeLocale(locale) {
    return locale && locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

function getContextMenuTitle(locale) {
    return normalizeLocale(locale) === 'zh-CN' ? '插入提示词' : 'Insert Prompts';
}

async function getBackgroundLocale() {
    try {
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        if (result[STORAGE_KEY]) {
            return normalizeLocale(result[STORAGE_KEY]);
        }
    } catch (error) {
    }

    try {
        if (chrome.i18n?.getUILanguage) {
            return normalizeLocale(chrome.i18n.getUILanguage());
        }
    } catch (error) {
    }

    return 'en';
}

async function createContextMenu() {
    const locale = await getBackgroundLocale();
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'image2-prompt',
            title: getContextMenuTitle(locale),
            contexts: ['editable']
        });
    });
}

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: 'pages/onboarding.html' });
    }

    await createContextMenu();

    chrome.runtime.setUninstallURL('https://glidea.github.io/banana-prompt-quicker/extension/pages/uninstall.html');
})

chrome.runtime.onStartup?.addListener(() => {
    createContextMenu();
});

chrome.storage.onChanged?.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEY]) {
        createContextMenu();
    }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'image2-prompt') {
        chrome.tabs.sendMessage(tab.id, { action: 'openModal' })
    }
})
