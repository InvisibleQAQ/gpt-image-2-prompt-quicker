class DynamicSite extends BaseSite {
    constructor(config) {
        super();
        this.config = config;
    }

    async findPromptInput() {
        if (this.config.promptInput) {
            const el = window.DOM.querySelectorShadowDom(this.config.promptInput);
            if (el) return el;
        }
        return super.findPromptInput();
    }

    async findTargetButton() {
        if (this.config.insertButton) {
            return window.DOM.querySelectorShadowDom(this.config.insertButton);
        }
        return null;
    }
}
