const RECENT_PROMPT_USAGE_KEY = 'banana-recent-prompt-usage';
const RECENT_PROMPT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function getRecentPromptUsageCutoff() {
    return Date.now() - RECENT_PROMPT_WINDOW_MS;
}

function pruneRecentPromptUsageMap(usageMap) {
    if (!usageMap || typeof usageMap !== 'object' || Array.isArray(usageMap)) {
        return {};
    }

    const cutoff = getRecentPromptUsageCutoff();
    const pruned = {};

    Object.entries(usageMap).forEach(([promptId, usedAt]) => {
        if (typeof promptId !== 'string' || !promptId.trim() || typeof usedAt !== 'string') {
            return;
        }

        const timestamp = new Date(usedAt).getTime();
        if (Number.isNaN(timestamp) || timestamp < cutoff) {
            return;
        }

        pruned[promptId] = new Date(timestamp).toISOString();
    });

    return pruned;
}

class Store {
    constructor() {
        this.state = {
            prompts: [],
            customPrompts: [],
            favorites: [],
            activeFilters: new Set(),
            selectedCategory: 'all',
            sortMode: 'recommend',
            locale: 'en',
            keyword: '',
            categories: new Set(),
            randomMap: new Map(),
            nsfwEnabled: true,
            recentWeekEnabled: false,
            recentPromptUsage: {}
        };
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    async init() {
        await this.loadLocale();
        await Promise.all([
            this.loadPrompts(),
            this.loadFavorites(),
            this.loadRecentPromptUsage(),
            this.loadSortMode(),
            this.loadNsfwSetting()
        ]);
        this.notify();
    }

    async loadPrompts() {
        let staticPrompts = [];
        if (window.PromptManager) {
            staticPrompts = await window.PromptManager.get();
        }
        const customPrompts = await this.getCustomPrompts();
        this.state.customPrompts = customPrompts;
        this.state.prompts = [...customPrompts, ...staticPrompts];

        this.updateCategories();
        this.ensureRandomValues();
    }

    async getCustomPrompts() {
        const result = await chrome.storage.local.get(['banana-custom-prompts']);
        return result['banana-custom-prompts'] || [];
    }

    async saveCustomPrompts(prompts) {
        await chrome.storage.local.set({ 'banana-custom-prompts': prompts });
        this.state.customPrompts = prompts;
        await this.loadPrompts();
        this.notify();
    }

    async addCustomPrompt(prompt) {
        const newPrompts = [prompt, ...this.state.customPrompts];
        await this.saveCustomPrompts(newPrompts);
    }

    async updateCustomPrompt(updatedPrompt) {
        const newPrompts = this.state.customPrompts.map(p =>
            p.id === updatedPrompt.id ? updatedPrompt : p
        );
        await this.saveCustomPrompts(newPrompts);
    }

    async deleteCustomPrompt(id) {
        const newPrompts = this.state.customPrompts.filter(p => p.id !== id);
        await this.saveCustomPrompts(newPrompts);
    }

    async loadFavorites() {
        const result = await chrome.storage.local.get(['banana-favorites']);
        this.state.favorites = result['banana-favorites'] || [];
    }

    async toggleFavorite(promptId, legacyPromptKey = null) {
        const favorites = new Set(this.state.favorites);
        const hasCanonical = favorites.has(promptId);
        const hasLegacy = legacyPromptKey ? favorites.has(legacyPromptKey) : false;

        if (hasCanonical || hasLegacy) {
            favorites.delete(promptId);
            if (legacyPromptKey) {
                favorites.delete(legacyPromptKey);
            }
        } else {
            favorites.add(promptId);
            if (legacyPromptKey) {
                favorites.delete(legacyPromptKey);
            }
        }

        this.state.favorites = Array.from(favorites);
        await chrome.storage.local.set({ 'banana-favorites': this.state.favorites });
        this.notify();
    }

    async loadRecentPromptUsage() {
        const result = await chrome.storage.local.get([RECENT_PROMPT_USAGE_KEY]);
        const storedUsage = pruneRecentPromptUsageMap(result[RECENT_PROMPT_USAGE_KEY]);
        this.state.recentPromptUsage = storedUsage;
        await chrome.storage.local.set({ [RECENT_PROMPT_USAGE_KEY]: storedUsage });
    }

    async recordPromptUsage(prompt) {
        if (!prompt || typeof prompt !== 'object' || !window.PromptUtils?.getPromptId) {
            return;
        }

        const promptId = window.PromptUtils.getPromptId(prompt);
        if (typeof promptId !== 'string' || !promptId.trim()) {
            return;
        }

        const nextUsage = pruneRecentPromptUsageMap({
            ...this.state.recentPromptUsage,
            [promptId]: new Date().toISOString()
        });

        this.state.recentPromptUsage = nextUsage;
        await chrome.storage.local.set({ [RECENT_PROMPT_USAGE_KEY]: nextUsage });
        this.notify();
    }

    async loadSortMode() {
        const result = await chrome.storage.local.get(['banana-sort-mode']);
        this.state.sortMode = result['banana-sort-mode'] || 'recommend';
    }

    async setSortMode(mode) {
        this.state.sortMode = mode;
        await chrome.storage.local.set({ 'banana-sort-mode': mode });
        if (mode === 'random') {
            this.state.randomMap.clear();
            this.ensureRandomValues();
        }
        this.notify();
    }

    async loadLocale() {
        if (window.I18n) {
            const locale = await window.I18n.init();
            this.state.locale = locale;
            return;
        }

        const result = await chrome.storage.local.get(['banana-ui-locale']);
        this.state.locale = result['banana-ui-locale'] || 'en';
    }

    async setLocale(locale) {
        const normalizedLocale = window.I18n ? window.I18n.normalizeLocale(locale) : locale;
        this.state.locale = normalizedLocale;
        if (window.I18n) {
            await window.I18n.setLocale(normalizedLocale, { persist: true });
        } else {
            await chrome.storage.local.set({ 'banana-ui-locale': normalizedLocale });
        }
        this.notify();
    }

    async loadNsfwSetting() {
        const result = await chrome.storage.local.get(['banana-nsfw-enabled']);
        this.state.nsfwEnabled = result['banana-nsfw-enabled'] ?? true;
    }

    async setNsfwEnabled(enabled) {
        this.state.nsfwEnabled = enabled;
        await chrome.storage.local.set({ 'banana-nsfw-enabled': enabled });

        if (!enabled && this.state.selectedCategory === 'NSFW') {
            this.state.selectedCategory = 'all';
        }

        this.updateCategories();
        this.notify();
    }

    updateCategories() {
        this.state.categories = new Set();
        this.state.prompts.forEach(p => {
            if (p.category) {
                if (!this.state.nsfwEnabled && p.category === 'NSFW') {
                    return;
                }
                this.state.categories.add(p.category);
            }
        });
    }

    ensureRandomValues() {
        this.state.prompts.forEach(p => {
            const key = window.PromptUtils.getPromptId(p);
            if (!this.state.randomMap.has(key)) {
                this.state.randomMap.set(key, Math.random());
            }
            p._randomVal = this.state.randomMap.get(key);
        });
    }

    setSearchKeyword(keyword) {
        this.state.keyword = keyword.toLowerCase();
        this.notify();
    }

    setCategory(category) {
        this.state.selectedCategory = category;
        this.notify();
    }

    setFilters(filters) {
        this.state.activeFilters = filters;
        this.notify();
    }

    setRecentWeekEnabled(enabled) {
        this.state.recentWeekEnabled = enabled;
        this.notify();
    }

    getFilteredPrompts() {
        const {
            prompts,
            keyword,
            selectedCategory,
            activeFilters,
            favorites,
            sortMode,
            nsfwEnabled,
            recentWeekEnabled,
            recentPromptUsage,
            locale
        } = this.state;

        const FLASH_MODE_PROMPT = {
            id: '__flash_mode__',
            title: window.I18n ? window.I18n.t('flashMode.title', 'Flash mode') : 'Flash mode',
            preview: 'https://cdn.jsdelivr.net/gh/InvisibleQAQ/gpt-image-2-prompt-quicker@main/images/flash_mode.png',
            prompt: `你现在进入【灵光模式: 有灵感就够了】。请按照以下步骤辅助我完成创作：
1. 需求理解：分析我输入的粗略的想法描述（可能会包含图片）
2. 需求澄清：要求我做出细节澄清，提出 3 个你认为最重要的选择题（A/B/C/D），以明确我的生图或修图需求（例如风格、构图、光影、具体相关细节等）。请一次性列出这三个问题
3. 最终执行：等待我回答选择题后，根据我的原始描述和选择结果调用绘图工具生成图片（如果有附图，请务必作为参数传递给绘图工具，以保证一致性）

---

OK，我想要：`,
            link: 'https://www.xiaohongshu.com/user/profile/5f7dc54d0000000001004afb',
            author: 'Official@glidea',
            isFlash: true
        };

        const recentUsageCutoff = getRecentPromptUsageCutoff();
        const promptsToFilter = recentWeekEnabled ? [...prompts, FLASH_MODE_PROMPT] : prompts;

        let filtered = promptsToFilter.filter(prompt => {
            const searchTexts = window.PromptUtils.getPromptSearchTexts(prompt, locale).map(text => text.toLowerCase());
            const matchesSearch = !keyword || searchTexts.some(text => text.includes(keyword));

            if (!matchesSearch) return false;

            if (selectedCategory !== 'all' && prompt.category !== selectedCategory) {
                return false;
            }

            if (!nsfwEnabled && prompt.category === 'NSFW') {
                return false;
            }

            if (recentWeekEnabled) {
                const promptId = window.PromptUtils.getPromptId(prompt);
                const usedAt = recentPromptUsage[promptId];
                const usedAtTimestamp = usedAt ? new Date(usedAt).getTime() : NaN;
                if (Number.isNaN(usedAtTimestamp) || usedAtTimestamp < recentUsageCutoff) {
                    return false;
                }
            }

            if (activeFilters.size === 0) return true;

            const isFavorite = window.PromptUtils.favoriteMatchesPrompt(prompt, favorites);

            return Array.from(activeFilters).every(filter => {
                if (filter === 'favorite') return isFavorite;
                if (filter === 'custom') return prompt.isCustom;
                return false;
            });
        });

        if (recentWeekEnabled) {
            filtered.sort((a, b) => {
                const promptIdA = window.PromptUtils.getPromptId(a);
                const promptIdB = window.PromptUtils.getPromptId(b);
                const dateA = recentPromptUsage[promptIdA] ? new Date(recentPromptUsage[promptIdA]).getTime() : 0;
                const dateB = recentPromptUsage[promptIdB] ? new Date(recentPromptUsage[promptIdB]).getTime() : 0;
                return dateB - dateA;
            });
            return filtered;
        }

        const favoriteItems = [];
        const customItems = [];
        const normalItems = [];

        filtered.forEach(item => {
            const isFavorite = window.PromptUtils.favoriteMatchesPrompt(item, favorites);

            if (isFavorite) {
                favoriteItems.push(item);
            } else if (item.isCustom) {
                customItems.push(item);
            } else {
                normalItems.push(item);
            }
        });

        if (sortMode === 'random') {
            normalItems.sort((a, b) => a._randomVal - b._randomVal);
        }

        filtered = [...favoriteItems, ...customItems, ...normalItems];
        filtered.unshift(FLASH_MODE_PROMPT);

        return filtered;
    }
};
