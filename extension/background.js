chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: 'pages/onboarding.html' });
    }

    chrome.contextMenus.create({
        id: 'banana-prompt',
        title: 'Insert 🍌 Prompts',
        contexts: ['editable']
    })

    chrome.runtime.setUninstallURL('https://glidea.github.io/banana-prompt-quicker/extension/pages/uninstall.html');
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'banana-prompt') {
        chrome.tabs.sendMessage(tab.id, { action: 'openModal' })
    }
})
