class GeminiEnterpriseSite extends BaseSite {
    async findPromptInput() {
        return this.findElement('gemini_enterprise', 'promptInput', '.ProseMirror');
    }

    async findTargetButton() {
        return this.findElement('gemini_enterprise', 'insertButton', '.tools-button-container');
    }

    getCurrentTheme() {
        return document.body.classList.contains('dark-theme') ||
            document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    createButton() {
        const btn = window.DOM.create('button', {
            id: 'banana-btn',
            className: 'banana-prompt-button',
            'aria-label': '🍌 Prompts',
            title: '快捷提示',
            onmouseenter: (e) => {
                const isDark = this.getCurrentTheme() === 'dark';
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(232, 234, 237, 0.08)' : 'rgba(60, 64, 67, 0.08)';
            },
            onmouseleave: (e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            },
            onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.modal) this.modal.show();
            }
        }, [
            window.DOM.create('span', {
                textContent: '🍌',
                style: 'font-size: 18px; line-height: 1;'
            }),
            window.DOM.create('span', {
                textContent: 'Prompts'
            })
        ]);

        const updateButtonTheme = () => {
            const isDark = this.getCurrentTheme() === 'dark';
            btn.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                height: 40px;
                padding: 0 16px;
                margin-left: 8px;
                border: none;
                border-radius: 20px;
                background: transparent;
                color: ${isDark ? '#e3e3e3' : '#1f1f1f'};
                font-family: 'Google Sans', Roboto, Arial, sans-serif;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
                position: relative;
                overflow: hidden;
            `;
        };

        updateButtonTheme();

        return btn;
    }
};
