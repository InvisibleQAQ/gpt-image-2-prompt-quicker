class GeminiSite extends BaseSite {
    async findPromptInput() {
        return this.findElement('gemini', 'promptInput', 'div.ql-editor[contenteditable="true"]');
    }

    async findTargetButton() {
        return this.findElement('gemini', 'insertButton', 'button.toolbox-drawer-item-deselect-button:has(mat-icon[fonticon="photo_prints"])');
    }

    getCurrentTheme() {
        return document.body.classList.contains('dark-theme') ||
            document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    createButton() {
        const isMobile = window.innerWidth <= 768;

        const btn = window.DOM.create('button', {
            id: 'banana-btn',
            className: 'mat-mdc-button mat-mdc-button-base mat-unthemed',
            title: '快捷提示',
            innerHTML: isMobile ?
                '<span style="font-size: 18px;">🍌</span>' :
                '<span style="font-size: 16px;">🍌</span><span>Prompts</span>',
            onmouseenter: (e) => {
                e.currentTarget.style.background = this.getThemeColors().hover;
            },
            onmouseleave: (e) => {
                e.currentTarget.style.background = 'transparent';
            },
            onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.modal) this.modal.show();
            }
        });

        const updateButtonTheme = () => {
            const colors = this.getThemeColors();
            const mobile = window.innerWidth <= 768;
            btn.style.cssText = `
                height: 40px;
                ${mobile ? 'width: 40px;' : ''}
                border-radius: ${mobile ? '50%' : '20px'};
                border: none;
                background: transparent;
                color: ${colors.text};
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-family: 'Google Sans', Roboto, Arial, sans-serif;
                margin-left: 4px;
                transition: background-color 0.2s;
                padding: ${mobile ? '0' : '0 16px'};
                gap: ${mobile ? '0' : '8px'};
            `;
        };

        updateButtonTheme();

        return btn;
    }
};
