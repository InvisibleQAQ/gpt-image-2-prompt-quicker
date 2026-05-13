class ChatGPTSite extends BaseSite {
    async findPromptInput() {
        return this.findElement(
            'chatgpt',
            'promptInput',
            '#prompt-textarea.ProseMirror[contenteditable="true"], div.ProseMirror#prompt-textarea[contenteditable="true"], textarea[name="prompt-textarea"]'
        );
    }

    async findTargetButton() {
        return this.findElement(
            'chatgpt',
            'insertButton',
            'button[data-testid="composer-plus-btn"], button#composer-plus-btn'
        );
    }

    getCurrentTheme() {
        return document.documentElement.classList.contains('dark') ||
            document.body.classList.contains('dark') ||
            document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    createButton() {
        const btn = window.DOM.create('button', {
            id: 'banana-btn',
            className: 'composer-btn banana-prompt-button',
            'aria-label': '🍌 Prompts',
            title: '快捷提示',
            textContent: '🍌',
            onmouseenter: (e) => {
                const isDark = this.getCurrentTheme() === 'dark';
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
            },
            onmouseleave: (e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            },
            onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.modal) this.modal.show();
            }
        });

        btn.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            min-width: 36px;
            min-height: 36px;
            margin-left: 6px;
            margin-right: 0;
            border: none;
            border-radius: 9999px;
            background: transparent;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            transition: background-color 0.2s ease;
        `;

        return btn;
    }
}
