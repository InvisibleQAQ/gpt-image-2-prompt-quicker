(function (globalScope) {
    function normalizeLocale(locale) {
        if (globalScope.I18n?.normalizeLocale) {
            return globalScope.I18n.normalizeLocale(locale)
        }
        if (!locale || typeof locale !== 'string') return 'en'
        return locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
    }

    function getCurrentLocale(locale) {
        if (locale) return normalizeLocale(locale)
        if (globalScope.I18n?.getLocale) {
            return globalScope.I18n.getLocale()
        }
        if (globalScope.navigator?.language) {
            return normalizeLocale(globalScope.navigator.language)
        }
        return 'en'
    }

    function getLocalizedTitleMap(prompt) {
        if (!prompt || typeof prompt !== 'object') return null
        const titles = prompt.localized_titles
        return titles && typeof titles === 'object' ? titles : null
    }

    function getPromptDisplayTitle(prompt, locale) {
        const resolvedLocale = getCurrentLocale(locale)
        const localizedTitles = getLocalizedTitleMap(prompt)
        if (localizedTitles) {
            const localizedValue = localizedTitles[resolvedLocale]
            if (typeof localizedValue === 'string' && localizedValue.trim()) {
                return localizedValue.trim()
            }
        }

        if (typeof prompt?.title === 'string' && prompt.title.trim()) {
            return prompt.title.trim()
        }

        if (localizedTitles) {
            const fallbackTitle = Object.values(localizedTitles).find(value => typeof value === 'string' && value.trim())
            if (fallbackTitle) {
                return fallbackTitle.trim()
            }
        }

        return ''
    }

    function getLegacyPromptKey(prompt) {
        const title = typeof prompt?.title === 'string' ? prompt.title : getPromptDisplayTitle(prompt, 'en')
        const author = typeof prompt?.author === 'string' ? prompt.author : ''
        return `${title}-${author}`
    }

    function getPromptId(prompt) {
        if (typeof prompt?.id === 'string' && prompt.id.trim()) {
            return prompt.id.trim()
        }
        return getLegacyPromptKey(prompt)
    }

    function getPromptSearchTexts(prompt, locale) {
        const values = []
        const pushValue = (value) => {
            if (typeof value !== 'string') return
            const trimmed = value.trim()
            if (!trimmed || values.includes(trimmed)) return
            values.push(trimmed)
        }

        pushValue(getPromptDisplayTitle(prompt, locale))
        pushValue(typeof prompt?.title === 'string' ? prompt.title : '')

        const localizedTitles = getLocalizedTitleMap(prompt)
        if (localizedTitles) {
            Object.values(localizedTitles).forEach(pushValue)
        }

        pushValue(typeof prompt?.prompt === 'string' ? prompt.prompt : '')
        pushValue(typeof prompt?.author === 'string' ? prompt.author : '')
        pushValue(typeof prompt?.sub_category === 'string' ? prompt.sub_category : '')

        return values
    }

    function favoriteMatchesPrompt(prompt, favorites) {
        if (!Array.isArray(favorites)) return false
        const promptId = getPromptId(prompt)
        const legacyKey = getLegacyPromptKey(prompt)
        return favorites.includes(promptId) || favorites.includes(legacyKey)
    }

    globalScope.PromptUtils = {
        getPromptDisplayTitle,
        getPromptId,
        getLegacyPromptKey,
        getPromptSearchTexts,
        favoriteMatchesPrompt,
        normalizeLocale,
        getCurrentLocale
    }

    if (globalScope.window) {
        globalScope.window.PromptUtils = globalScope.PromptUtils
    }
})(typeof globalThis !== 'undefined' ? globalThis : this)
