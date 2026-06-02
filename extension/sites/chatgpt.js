class ChatGPTSite extends BaseSite {
    async findPromptInput() {
        const localSelectors = [
            '#prompt-textarea.ProseMirror[contenteditable="true"]',
            'div.ProseMirror#prompt-textarea[contenteditable="true"]',
            'textarea[name="prompt-textarea"]'
        ];

        for (const selector of localSelectors) {
            const el = window.DOM.querySelectorShadowDom(selector);
            if (el) return el;
        }

        const remoteSelector = await this.getRemoteSelector('chatgpt', 'promptInput');
        if (!remoteSelector) return null;

        const remoteSelectors = remoteSelector.split(',').map(s => s.trim()).filter(Boolean);
        for (const selector of remoteSelectors) {
            const el = window.DOM.querySelectorShadowDom(selector);
            if (el) return el;
        }

        return null;
    }

    async findTargetButton() {
        return this.findElement(
            'chatgpt',
            'insertButton',
            'button[data-testid="composer-plus-btn"], button#composer-plus-btn'
        );
    }

    async insertPrompt(promptData) {
        const promptText = typeof promptData === 'string' ? promptData : promptData.prompt;
        const referenceImages = typeof promptData === 'object' ? promptData.referenceImages : null;
        const el = await this.findPromptInput();
        if (!el || !this.isEditableElement(el)) {
            console.log('Banana: ChatGPT insertPrompt debug', {
                foundElement: false,
                tagName: el?.tagName || null,
                isContentEditable: !!el?.isContentEditable
            });
            return;
        }

        console.log('Banana: ChatGPT insertPrompt debug', {
            foundElement: true,
            tagName: el.tagName,
            id: el.id || null,
            className: el.className || null,
            isContentEditable: !!el.isContentEditable,
            textLength: promptText?.length || 0,
            referenceImageCount: referenceImages?.length || 0
        });

        if (!el.isContentEditable) {
            console.log('Banana: ChatGPT insertPrompt path', 'textarea-fallback');
            await super.insertPrompt(promptData);
            return;
        }

        if (referenceImages && referenceImages.length > 0) {
            await this.insertImages(referenceImages);
            await new Promise(r => setTimeout(r, 800));
        }

        el.focus();

        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);

        let inserted = false;
        if (typeof document.execCommand === 'function') {
            inserted = document.execCommand('insertText', false, promptText);
        }
        console.log('Banana: ChatGPT insertPrompt execCommand', inserted);

        if (!inserted) {
            console.log('Banana: ChatGPT insertPrompt path', 'innerHTML-fallback');
            el.innerHTML = promptText.split('\n').map(line => {
                const escaped = line
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                return `<p>${escaped || '<br>'}</p>`;
            }).join('');

            range.selectNodeContents(el);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            console.log('Banana: ChatGPT insertPrompt path', 'execCommand');
        }

        const inputEvent = typeof InputEvent === 'function'
            ? new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                composed: true,
                inputType: 'insertText',
                data: promptText
            })
            : new Event('input', { bubbles: true });
        el.dispatchEvent(inputEvent);
        console.log('Banana: ChatGPT insertPrompt dispatched', {
            inputType: inputEvent.inputType || 'plain-input',
            dataLength: inputEvent.data?.length || 0,
            finalInnerHTML: el.innerHTML
        });

        if (typeof promptData === 'object') {
            await this.store?.recordPromptUsage(promptData);
        }

        if (this.modal) {
            this.modal.hide();
        }
    }

    getCurrentTheme() {
        return document.documentElement.classList.contains('dark') ||
            document.body.classList.contains('dark') ||
            document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    insertButton(btn, target) {
        if (document.getElementById('banana-btn')) return true;

        const triggerWrapper = target.closest('span[data-state]');
        const container = triggerWrapper?.parentElement || target.parentElement;
        if (!container) return false;

        container.style.display = 'flex';
        container.style.alignItems = 'center';

        (triggerWrapper || target).insertAdjacentElement('afterend', btn);
        return true;
    }

    syncButtonMode(btn) {
        if (!btn) return;

        const isImageMode = this.isImageMode();
        const existingLabel = btn.querySelector?.('span');

        if (isImageMode && !existingLabel) {
            const label = window.DOM.create('span', {
                textContent: this.getButtonLabel(),
                'aria-hidden': 'true'
            });

            label.style.cssText = `
                font-size: 14px;
                font-weight: 500;
                line-height: 1;
                white-space: nowrap;
                pointer-events: none;
            `;

            btn.appendChild(label);
        }

        if (!isImageMode && existingLabel?.remove) {
            existingLabel.remove();
        }

        const promptButtonLabel = this.getButtonLabel();
        btn.className = 'composer-btn banana-prompt-button';
        btn.setAttribute('aria-label', promptButtonLabel);
        btn.setAttribute('title', promptButtonLabel);
        btn.style.cssText = isImageMode
            ? `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                height: 36px;
                min-height: 36px;
                margin-left: 6px;
                margin-right: 0;
                border: none;
                border-radius: 9999px;
                background: transparent;
                cursor: pointer;
                line-height: 1;
                transition: background-color 0.2s ease;
                padding: 0 12px;
                white-space: nowrap;
                flex-shrink: 0;
            `
            : `
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
                line-height: 1;
                transition: background-color 0.2s ease;
                padding: 0;
            `;
    }

    isImageMode() {
        const footerActions = window.DOM.querySelectorShadowDom('[data-testid="composer-footer-actions"]');
        if (footerActions) return true;

        const modeButton = window.DOM.querySelectorShadowDom('button[aria-label="Choose image aspect ratio"]');
        if (modeButton) return true;

        const promptInput = window.DOM.querySelectorShadowDom('#prompt-textarea.ProseMirror[contenteditable="true"]')
            || window.DOM.querySelectorShadowDom('div.ProseMirror#prompt-textarea[contenteditable="true"]')
            || window.DOM.querySelectorShadowDom('textarea[name="prompt-textarea"]');
        const placeholder = promptInput?.querySelector?.('p.placeholder')?.dataset?.placeholder
            || promptInput?.querySelector?.('p.placeholder')?.getAttribute?.('data-placeholder')
            || promptInput?.getAttribute?.('data-placeholder')
            || promptInput?.placeholder
            || '';

        return /describe or edit an image/i.test(placeholder);
    }

    getButtonLabel() {
        return window.I18n ? window.I18n.t('site.button.promptPill', 'prompts') : 'prompts';
    }

    refreshButtonI18n() {
        const btn = window.DOM.querySelectorShadowDom('#banana-btn');
        if (btn) {
            this.syncButtonMode(btn);
        }
    }

    createButton() {
        const logo = window.DOM.create('img', {
            src: chrome.runtime.getURL('icon16.png'),
            alt: '',
            'aria-hidden': 'true'
        });

        logo.style.cssText = `
            width: 18px;
            height: 18px;
            display: block;
            object-fit: contain;
            pointer-events: none;
            flex-shrink: 0;
        `;

        const btn = window.DOM.create('button', {
            id: 'banana-btn',
            className: 'composer-btn banana-prompt-button',
            'aria-label': this.getButtonLabel(),
            title: this.getButtonLabel(),
            type: 'button',
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
        }, [logo]);

        this.syncButtonMode(btn);
        return btn;
    }

    async _handleMutation() {
        await super._handleMutation();
        const btn = window.DOM.querySelectorShadowDom('#banana-btn');
        if (btn) {
            this.syncButtonMode(btn);
        }
    }
}
