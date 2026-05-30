(function (globalScope) {
    const STORAGE_KEY = 'banana-ui-locale'

    const MESSAGES = {
        'zh-CN': {
            languages: {
                'zh-CN': '简体中文',
                en: 'English'
            },
            search: {
                placeholder: '搜索...',
                sort: {
                    switchToRandom: '切换到随机焕新',
                    switchToRecommend: '切换到推荐排序'
                },
                nsfw: {
                    disable: '屏蔽 NSFW',
                    enable: '开启 NSFW'
                },
                category: {
                    all: '全部',
                    none: '无分类'
                },
                locale: {
                    label: '语言'
                },
                filters: {
                    recentWeek: '最近一周',
                    favorite: '收藏',
                    custom: '自定义',
                    generate: '文生图',
                    edit: '编辑'
                },
                addPromptTitle: '添加自定义 Prompt'
            },
            card: {
                authorLinkTitle: '点击查看原贴',
                customAuthor: '我',
                mode: {
                    flash: '万能',
                    generate: '文生图',
                    edit: '编辑'
                },
                actions: {
                    edit: '编辑',
                    delete: '删除'
                },
                deleteConfirm: '确定要删除这个 Prompt 吗？'
            },
            modal: {
                empty: '没有找到相关提示词'
            },
            pagination: {
                prev: '上一页',
                next: '下一页',
                githubTitle: '在 GitHub 上 Star'
            },
            promptForm: {
                title: {
                    edit: '编辑 Prompt',
                    create: '新建 Prompt'
                },
                subtitle: '填写详细信息以自定义您的提示词',
                placeholders: {
                    title: '给它起个名字...',
                    subCategory: '子分类 (可选)',
                    prompt: '在此输入 Prompt 内容...',
                    category: '选择分类'
                },
                labels: {
                    coverImage: '封面图 (可选)',
                    referenceImages: '参考图 (可选)'
                },
                mode: {
                    generate: '文生图',
                    edit: '编辑'
                },
                buttons: {
                    cancel: '取消',
                    save: '保存',
                    processing: '处理中...'
                },
                validation: {
                    required: '请填写标题和内容'
                },
                errors: {
                    imageProcessingFailed: '图片处理失败，将使用默认图标'
                },
                categoryNone: '暂无分类'
            },
            site: {
                button: {
                    shortcut: '快捷提示',
                    promptPill: '提示词'
                }
            },
            background: {
                contextMenu: '插入提示词'
            },
            onboarding: {
                pageTitle: '欢迎使用 Banana Prompt Quicker',
                heroTitle: '提示词从未如此优雅',
                guideAlt: 'Banana Prompt Quicker 使用指南',
                choosePlatform: '选择平台，即刻开始',
                anySite: '任意网站，右键插入',
                next: '下一步',
                getStarted: '开始使用'
            },
            uninstall: {
                pageTitle: '很遗憾看到您离开 - Banana Prompt Quicker',
                heading: '很遗憾看到您离开',
                subtitle: '您的反馈对我们至关重要，能告诉我们原因吗？',
                placeholder: '请输入您的建议或卸载原因...',
                submit: '帮助改进',
                githubLink: '在 GitHub 上反馈问题',
                subject: 'Banana Prompt Quicker 卸载反馈'
            }
        },
        en: {
            languages: {
                'zh-CN': '简体中文',
                en: 'English'
            },
            search: {
                placeholder: 'Search...',
                sort: {
                    switchToRandom: 'Switch to random refresh',
                    switchToRecommend: 'Switch to recommended order'
                },
                nsfw: {
                    disable: 'Hide NSFW',
                    enable: 'Show NSFW'
                },
                category: {
                    all: 'All',
                    none: 'No categories'
                },
                locale: {
                    label: 'Language'
                },
                filters: {
                    recentWeek: 'Recent week',
                    favorite: 'Favorites',
                    custom: 'Custom',
                    generate: 'Generate',
                    edit: 'Edit'
                },
                addPromptTitle: 'Add custom prompt'
            },
            card: {
                authorLinkTitle: 'View original post',
                customAuthor: 'Me',
                mode: {
                    flash: 'Universal',
                    generate: 'Generate',
                    edit: 'Edit'
                },
                actions: {
                    edit: 'Edit',
                    delete: 'Delete'
                },
                deleteConfirm: 'Delete this prompt?'
            },
            modal: {
                empty: 'No prompts found'
            },
            pagination: {
                prev: 'Previous',
                next: 'Next',
                githubTitle: 'Star on GitHub'
            },
            promptForm: {
                title: {
                    edit: 'Edit prompt',
                    create: 'New prompt'
                },
                subtitle: 'Fill in the details to customize your prompt',
                placeholders: {
                    title: 'Give it a name...',
                    subCategory: 'Sub-category (optional)',
                    prompt: 'Enter prompt content here...',
                    category: 'Select a category'
                },
                labels: {
                    coverImage: 'Cover image (optional)',
                    referenceImages: 'Reference images (optional)'
                },
                mode: {
                    generate: 'Generate',
                    edit: 'Edit'
                },
                buttons: {
                    cancel: 'Cancel',
                    save: 'Save',
                    processing: 'Processing...'
                },
                validation: {
                    required: 'Please enter both a title and prompt content'
                },
                errors: {
                    imageProcessingFailed: 'Image processing failed. The default icon will be used.'
                },
                categoryNone: 'No categories yet'
            },
            site: {
                button: {
                    shortcut: 'Quick prompts',
                    promptPill: 'prompts'
                }
            },
            background: {
                contextMenu: 'Insert Prompts'
            },
            onboarding: {
                pageTitle: 'Welcome to Banana Prompt Quicker',
                heroTitle: 'Prompts have never felt this elegant',
                guideAlt: 'Banana Prompt Quicker guide',
                choosePlatform: 'Choose a platform to get started',
                anySite: 'Any website, insert from the context menu',
                next: 'Next',
                getStarted: 'Get started'
            },
            uninstall: {
                pageTitle: 'Sorry to see you go - Banana Prompt Quicker',
                heading: 'Sorry to see you go',
                subtitle: 'Your feedback matters. Could you tell us why?',
                placeholder: 'Share your feedback or why you uninstalled...',
                submit: 'Help us improve',
                githubLink: 'Report an issue on GitHub',
                subject: 'Banana Prompt Quicker uninstall feedback'
            }
        }
    }

    let currentLocale = 'en'
    let initialized = false

    function normalizeLocale(locale) {
        if (!locale || typeof locale !== 'string') return 'en'
        return locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
    }

    function getMessage(locale, key) {
        return key.split('.').reduce((value, part) => value && value[part], MESSAGES[locale])
    }

    function detectBrowserLocale() {
        try {
            if (globalScope.chrome?.i18n?.getUILanguage) {
                return normalizeLocale(globalScope.chrome.i18n.getUILanguage())
            }
        } catch (error) {
        }

        try {
            if (globalScope.navigator?.language) {
                return normalizeLocale(globalScope.navigator.language)
            }
        } catch (error) {
        }

        return 'en'
    }

    async function readStoredLocale(storageKey = STORAGE_KEY) {
        try {
            if (!globalScope.chrome?.storage?.local?.get) return null
            const result = await globalScope.chrome.storage.local.get([storageKey])
            if (!result[storageKey]) return null
            return normalizeLocale(result[storageKey])
        } catch (error) {
            return null
        }
    }

    async function writeStoredLocale(locale, storageKey = STORAGE_KEY) {
        try {
            if (!globalScope.chrome?.storage?.local?.set) return
            await globalScope.chrome.storage.local.set({ [storageKey]: normalizeLocale(locale) })
        } catch (error) {
        }
    }

    async function init(options = {}) {
        const storageKey = options.storageKey || STORAGE_KEY

        if (options.locale) {
            currentLocale = normalizeLocale(options.locale)
            initialized = true
            if (options.persist) {
                await writeStoredLocale(currentLocale, storageKey)
            }
            return currentLocale
        }

        const storedLocale = options.skipStorage ? null : await readStoredLocale(storageKey)
        currentLocale = storedLocale || detectBrowserLocale()
        initialized = true
        return currentLocale
    }

    async function setLocale(locale, options = {}) {
        const storageKey = options.storageKey || STORAGE_KEY
        currentLocale = normalizeLocale(locale)
        initialized = true

        if (options.persist) {
            await writeStoredLocale(currentLocale, storageKey)
        }

        return currentLocale
    }

    function getLocale() {
        if (!initialized) {
            currentLocale = detectBrowserLocale()
            initialized = true
        }
        return currentLocale
    }

    function t(key, fallback) {
        const locale = getLocale()
        return getMessage(locale, key) || getMessage('en', key) || fallback || key
    }

    function getLanguageOptions() {
        return [
            { value: 'zh-CN', label: MESSAGES['zh-CN'].languages['zh-CN'] },
            { value: 'en', label: MESSAGES.en.languages.en }
        ]
    }

    const api = {
        STORAGE_KEY,
        MESSAGES,
        normalizeLocale,
        detectBrowserLocale,
        readStoredLocale,
        writeStoredLocale,
        init,
        setLocale,
        getLocale,
        getLanguageOptions,
        t
    }

    globalScope.I18n = api
    if (globalScope.window) {
        globalScope.window.I18n = api
    }
})(typeof globalThis !== 'undefined' ? globalThis : this)
