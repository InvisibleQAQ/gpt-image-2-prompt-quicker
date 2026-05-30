const BACKGROUND_MESSAGES = {
    'zh-CN': {
        contextMenu: '插入提示词'
    },
    en: {
        contextMenu: 'Insert Prompts'
    }
};

function normalizeLocale(locale) {
    return locale && locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

async function getBackgroundLocale() {
    try {
        const result = await chrome.storage.local.get(['banana-ui-locale']);
        if (result['banana-ui-locale']) {
            return normalizeLocale(result['banana-ui-locale']);
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
            id: 'banana-prompt',
            title: BACKGROUND_MESSAGES[locale].contextMenu,
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
    if (areaName === 'local' && changes['banana-ui-locale']) {
        createContextMenu();
    }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'banana-prompt') {
        chrome.tabs.sendMessage(tab.id, { action: 'openModal' })
    }
})
