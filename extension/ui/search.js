(function () {
    const { h } = window.DOM;

    window.UI = window.UI || {};
    window.UI.Search = class SearchComponent {
        constructor(props) {
            this.props = props;
            this.state = {
                keyword: '',
                selectedCategory: props.selectedCategory || 'all',
                activeFilters: props.activeFilters || new Set(),
                sortMode: props.sortMode || 'recommend',
                nsfwEnabled: props.nsfwEnabled !== undefined ? props.nsfwEnabled : true,
                recentWeekEnabled: props.recentWeekEnabled || false,
                locale: props.locale || (window.I18n ? window.I18n.getLocale() : 'en'),
                openDropdown: null
            };
            this.element = null;
            this.refs = {
                filterButtons: {}
            };
            this.handleDocumentClick = this.handleDocumentClick.bind(this);
            document.addEventListener('click', this.handleDocumentClick);
        }

        t(key, fallback) {
            return window.I18n ? window.I18n.t(key, fallback) : (fallback || key);
        }

        destroy() {
            document.removeEventListener('click', this.handleDocumentClick);
            if (this.element) {
                this.element.remove();
            }
        }

        handleDocumentClick(e) {
            if (!this.state.openDropdown) return;
            const activeDropdown = this.refs.dropdowns?.[this.state.openDropdown];
            if (activeDropdown && !activeDropdown.container.contains(e.target)) {
                this.updateState({ openDropdown: null });
            }
        }

        updateState(newState) {
            this.state = { ...this.state, ...newState };
            this.updateView();
        }

        syncFromProps() {
            this.state.selectedCategory = this.props.selectedCategory || 'all';
            this.state.activeFilters = this.props.activeFilters || new Set();
            this.state.sortMode = this.props.sortMode || 'recommend';
            this.state.nsfwEnabled = this.props.nsfwEnabled !== undefined ? this.props.nsfwEnabled : true;
            this.state.recentWeekEnabled = this.props.recentWeekEnabled || false;
            this.state.locale = this.props.locale || this.state.locale;
        }

        getCategoryOptions() {
            const categories = Array.from(this.props.categories || []).sort((a, b) => a.localeCompare(b));
            return [
                { value: 'all', label: this.t('search.category.all', 'All') },
                ...categories.map(category => ({ value: category, label: category }))
            ];
        }

        getLocaleOptions() {
            return window.I18n
                ? window.I18n.getLanguageOptions()
                : [
                    { value: 'zh-CN', label: '简体中文' },
                    { value: 'en', label: 'English' }
                ];
        }

        getOptionLabel(options, value) {
            const option = options.find(item => item.value === value);
            return option ? option.label : '';
        }

        renderDropdownOptions(name, options, selectedValue) {
            const dropdown = this.refs.dropdowns?.[name];
            if (!dropdown) return;

            dropdown.optionsContainer.innerHTML = '';

            if (options.length === 0) {
                dropdown.optionsContainer.appendChild(h('div', {
                    style: `padding: 10px 16px; font-size: 14px; color: ${this.props.colors.textSecondary};`
                }, this.t('search.category.none', 'No categories')));
                return;
            }

            options.forEach(optionItem => {
                const isSelected = optionItem.value === selectedValue;
                const option = h('div', {
                    style: `padding: 10px 16px; cursor: pointer; transition: all 0.2s; font-size: 14px; background: ${isSelected ? `${this.props.colors.primary}15` : 'transparent'}; color: ${isSelected ? this.props.colors.primary : this.props.colors.text}; font-weight: ${isSelected ? 600 : 400};`,
                    onmouseenter: () => {
                        if (!isSelected) {
                            option.style.background = this.props.colors.surfaceHover;
                        }
                        option.style.boxShadow = `0 2px 8px ${this.props.colors.shadow}`;
                    },
                    onmouseleave: () => {
                        option.style.background = isSelected ? `${this.props.colors.primary}15` : 'transparent';
                        option.style.boxShadow = 'none';
                    },
                    onclick: (e) => {
                        e.stopPropagation();
                        dropdown.onSelect(optionItem.value);
                    }
                }, optionItem.label);
                dropdown.optionsContainer.appendChild(option);
            });
        }

        updateDropdown(name, options, selectedValue) {
            const dropdown = this.refs.dropdowns?.[name];
            if (!dropdown) return;

            dropdown.triggerText.textContent = this.getOptionLabel(options, selectedValue);
            dropdown.optionsContainer.style.display = this.state.openDropdown === name ? 'flex' : 'none';
            dropdown.optionsContainer.setAttribute('data-visible', this.state.openDropdown === name);
            dropdown.arrowIcon.style.transform = this.state.openDropdown === name ? 'rotate(180deg)' : 'rotate(0deg)';
            this.renderDropdownOptions(name, options, selectedValue);
        }

        createDropdown(name, options) {
            const { colors, isMobile } = this.props;

            const triggerText = h('span', {
                style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; text-align: center;'
            }, '');

            const arrowIcon = h('span', {
                style: 'display: flex; align-items: center; transition: transform 0.2s; opacity: 0.6;',
                innerHTML: `<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1L5 5L9 1"/></svg>`
            });

            const trigger = h('div', {
                style: `padding: ${isMobile ? '10px 14px' : '8px 12px'}; border: 1px solid ${colors.border}; border-radius: 16px; background: ${colors.surface}; color: ${colors.text}; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s; min-width: ${options.minWidth || '90px'}; justify-content: space-between; user-select: none;`,
                onclick: (e) => {
                    e.stopPropagation();
                    this.updateState({ openDropdown: this.state.openDropdown === name ? null : name });
                },
                onmouseenter: !isMobile ? (e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 2px 8px ${colors.shadow}`;
                } : null,
                onmouseleave: !isMobile ? (e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.boxShadow = 'none';
                } : null
            }, [triggerText, arrowIcon]);

            const optionsContainer = h('div', {
                style: `position: absolute; top: 100%; left: 0; margin-top: 8px; width: 100%; background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 16px; box-shadow: 0 10px 40px ${colors.shadow}; display: none; flex-direction: column; overflow: hidden; backdrop-filter: blur(20px); max-height: 300px; overflow-y: auto; z-index: 9999;`
            });
            optionsContainer.setAttribute('data-visible', 'false');

            const container = h('div', {
                style: 'position: relative; z-index: 1000;'
            }, [trigger, optionsContainer]);

            this.refs.dropdowns = this.refs.dropdowns || {};
            this.refs.dropdowns[name] = {
                container,
                triggerText,
                arrowIcon,
                optionsContainer,
                onSelect: options.onSelect
            };

            return container;
        }

        updateView() {
            if (!this.element) return;
            this.syncFromProps();

            if (this.refs.searchInput) {
                this.refs.searchInput.placeholder = this.t('search.placeholder', 'Search...');
            }

            if (this.refs.sortTooltip) {
                this.refs.sortTooltip.textContent = this.state.sortMode === 'recommend'
                    ? this.t('search.sort.switchToRandom', 'Switch to random refresh')
                    : this.t('search.sort.switchToRecommend', 'Switch to recommended order');
            }

            if (this.refs.nsfwTooltip) {
                this.refs.nsfwTooltip.textContent = this.state.nsfwEnabled
                    ? this.t('search.nsfw.disable', 'Hide NSFW')
                    : this.t('search.nsfw.enable', 'Show NSFW');
            }

            if (this.refs.recentWeekBtn) {
                this.refs.recentWeekBtn.textContent = this.t('search.filters.recentWeek', 'Recent week');
            }

            if (this.refs.addBtn) {
                this.refs.addBtn.title = this.t('search.addPromptTitle', 'Add custom prompt');
            }

            if (this.refs.filterButtons.favorite) this.refs.filterButtons.favorite.textContent = this.t('search.filters.favorite', 'Favorites');
            if (this.refs.filterButtons.custom) this.refs.filterButtons.custom.textContent = this.t('search.filters.custom', 'Custom');
            if (this.refs.filterButtons.generate) this.refs.filterButtons.generate.textContent = this.t('search.filters.generate', 'Generate');
            if (this.refs.filterButtons.edit) this.refs.filterButtons.edit.textContent = this.t('search.filters.edit', 'Edit');

            const sortBtn = this.element.querySelector('#sort-mode-btn');
            if (sortBtn) {
                sortBtn.innerHTML = this.state.sortMode === 'recommend'
                    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
                    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
            }

            const nsfwBtn = this.element.querySelector('#nsfw-toggle-btn');
            if (nsfwBtn) {
                nsfwBtn.innerHTML = this.state.nsfwEnabled
                    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
                    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
            }

            const { colors, isMobile } = this.props;
            ['favorite', 'custom', 'generate', 'edit'].forEach(key => {
                const btn = this.refs.filterButtons[key];
                if (!btn) return;
                const isActive = this.state.activeFilters.has(key);
                btn.style.cssText = isActive
                    ? `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.primary}; border-radius: 20px; background: ${colors.primary}; color: white; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; touch-action: manipulation; box-shadow: 0 2px 8px ${colors.shadow};`
                    : `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.border}; border-radius: 20px; background: ${colors.surface}; color: ${colors.text}; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; touch-action: manipulation;`;
            });

            if (this.refs.recentWeekBtn) {
                const isActive = this.state.recentWeekEnabled;
                this.refs.recentWeekBtn.style.cssText = isActive
                    ? `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.primary}; border-radius: 20px; background: ${colors.primary}; color: white; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; touch-action: manipulation; box-shadow: 0 2px 8px ${colors.shadow};`
                    : `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.border}; border-radius: 20px; background: ${colors.surface}; color: ${colors.text}; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; touch-action: manipulation;`;
            }

            this.updateDropdown('category', this.getCategoryOptions(), this.state.selectedCategory);
            this.updateDropdown('locale', this.getLocaleOptions(), this.state.locale);
        }

        render() {
            const { colors, isMobile } = this.props;

            const searchInput = h('input', {
                type: 'text',
                id: 'prompt-search',
                placeholder: this.t('search.placeholder', 'Search...'),
                style: `flex: 1; padding: ${isMobile ? '14px 20px' : '12px 18px'}; border: 1px solid ${colors.inputBorder}; border-radius: 16px; outline: none; font-size: ${isMobile ? '16px' : '14px'}; background: ${colors.inputBg}; color: ${colors.text}; box-sizing: border-box; transition: all 0.2s;`,
                oninput: (e) => {
                    this.state.keyword = e.target.value;
                    if (this.props.onSearch) this.props.onSearch(e.target.value);
                },
                onfocus: (e) => e.target.style.borderColor = colors.primary,
                onblur: (e) => e.target.style.borderColor = colors.inputBorder
            });
            this.refs.searchInput = searchInput;

            const sortBtn = h('button', {
                id: 'sort-mode-btn',
                style: `padding: ${isMobile ? '10px' : '8px'}; border: none; background: transparent; color: ${colors.textSecondary}; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 8px;`,
                onclick: () => {
                    const newMode = this.state.sortMode === 'recommend' ? 'random' : 'recommend';
                    this.updateState({ sortMode: newMode });
                    if (this.props.onSortChange) this.props.onSortChange(newMode);
                },
                onmouseenter: !isMobile ? (e) => {
                    e.currentTarget.style.color = colors.primary;
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = `${colors.primary}10`;
                    if (this.refs.sortTooltip) this.refs.sortTooltip.style.opacity = '1';
                } : null,
                onmouseleave: !isMobile ? (e) => {
                    e.currentTarget.style.color = colors.textSecondary;
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'transparent';
                    if (this.refs.sortTooltip) this.refs.sortTooltip.style.opacity = '0';
                } : null
            });

            const tooltip = h('div', {
                id: 'sort-tooltip',
                style: `position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%); background: ${colors.surface}; color: ${colors.text}; padding: 6px 12px; border-radius: 8px; font-size: 12px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; box-shadow: 0 4px 12px ${colors.shadow}; border: 1px solid ${colors.border}; z-index: 1000;`
            });
            this.refs.sortTooltip = tooltip;

            const sortBtnContainer = h('div', {
                style: 'position: relative; display: flex; align-items: center;'
            }, [sortBtn, tooltip]);

            const categoryDropdown = this.createDropdown('category', {
                minWidth: '90px',
                onSelect: (value) => {
                    this.updateState({ selectedCategory: value, openDropdown: null });
                    if (this.props.onCategoryChange) this.props.onCategoryChange(value);
                }
            });

            const localeDropdown = this.createDropdown('locale', {
                minWidth: '110px',
                onSelect: (value) => {
                    this.updateState({ locale: value, openDropdown: null });
                    if (this.props.onLocaleChange) this.props.onLocaleChange(value);
                }
            });

            const buttonsContainer = h('div', {
                style: `display: flex; gap: 8px; ${isMobile ? 'flex: 1; justify-content: flex-end; flex-wrap: wrap;' : 'flex-wrap: wrap;'}`
            });

            const recentWeekBtn = h('button', {
                id: 'filter-recent-week',
                style: '',
                onclick: () => {
                    const newValue = !this.state.recentWeekEnabled;
                    this.updateState({ recentWeekEnabled: newValue });
                    if (this.props.onRecentWeekChange) this.props.onRecentWeekChange(newValue);
                },
                onmouseenter: !isMobile ? (e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = this.state.recentWeekEnabled ? `0 4px 12px ${colors.shadow}` : `0 2px 8px ${colors.shadow}`;
                } : null,
                onmouseleave: !isMobile ? (e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = this.state.recentWeekEnabled ? `0 2px 8px ${colors.shadow}` : 'none';
                } : null
            }, this.t('search.filters.recentWeek', 'Recent week'));
            this.refs.recentWeekBtn = recentWeekBtn;
            buttonsContainer.appendChild(recentWeekBtn);

            const filters = [
                { key: 'favorite', labelKey: 'search.filters.favorite', fallback: 'Favorites' },
                { key: 'custom', labelKey: 'search.filters.custom', fallback: 'Custom' },
                { key: 'generate', labelKey: 'search.filters.generate', fallback: 'Generate' },
                { key: 'edit', labelKey: 'search.filters.edit', fallback: 'Edit' }
            ];

            filters.forEach(filter => {
                const btn = h('button', {
                    id: `filter-${filter.key}`,
                    style: '',
                    onclick: () => {
                        const nextFilters = new Set(this.state.activeFilters);
                        if (nextFilters.has(filter.key)) {
                            nextFilters.delete(filter.key);
                        } else {
                            if (filter.key === 'generate' && nextFilters.has('edit')) nextFilters.delete('edit');
                            if (filter.key === 'edit' && nextFilters.has('generate')) nextFilters.delete('generate');
                            nextFilters.add(filter.key);
                        }
                        this.updateState({ activeFilters: nextFilters });
                        if (this.props.onFilterChange) this.props.onFilterChange(nextFilters);
                    },
                    onmouseenter: !isMobile ? (e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = this.state.activeFilters.has(filter.key) ? `0 4px 12px ${colors.shadow}` : `0 2px 8px ${colors.shadow}`;
                    } : null,
                    onmouseleave: !isMobile ? (e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = this.state.activeFilters.has(filter.key) ? `0 2px 8px ${colors.shadow}` : 'none';
                    } : null
                }, this.t(filter.labelKey, filter.fallback));
                this.refs.filterButtons[filter.key] = btn;
                buttonsContainer.appendChild(btn);
            });

            const addBtn = h('button', {
                title: this.t('search.addPromptTitle', 'Add custom prompt'),
                style: `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.primary}; border-radius: 20px; background: ${colors.primary}; color: white; font-size: ${isMobile ? '18px' : '16px'}; font-weight: 600; cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; line-height: 1; box-shadow: 0 2px 8px ${colors.shadow};`,
                onclick: () => {
                    if (this.props.onAddPrompt) this.props.onAddPrompt();
                }
            }, '+');
            this.refs.addBtn = addBtn;
            buttonsContainer.appendChild(addBtn);

            const nsfwBtn = h('button', {
                id: 'nsfw-toggle-btn',
                style: `padding: ${isMobile ? '10px' : '8px'}; border: none; background: transparent; color: ${colors.textSecondary}; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 8px;`,
                onclick: () => {
                    const newValue = !this.state.nsfwEnabled;
                    this.updateState({ nsfwEnabled: newValue });
                    if (this.props.onNsfwChange) this.props.onNsfwChange(newValue);
                },
                onmouseenter: !isMobile ? (e) => {
                    e.currentTarget.style.color = colors.primary;
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = `${colors.primary}10`;
                    if (this.refs.nsfwTooltip) this.refs.nsfwTooltip.style.opacity = '1';
                } : null,
                onmouseleave: !isMobile ? (e) => {
                    e.currentTarget.style.color = colors.textSecondary;
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'transparent';
                    if (this.refs.nsfwTooltip) this.refs.nsfwTooltip.style.opacity = '0';
                } : null
            });

            const nsfwTooltip = h('div', {
                id: 'nsfw-tooltip',
                style: `position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%); background: ${colors.surface}; color: ${colors.text}; padding: 6px 12px; border-radius: 8px; font-size: 12px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; box-shadow: 0 4px 12px ${colors.shadow}; border: 1px solid ${colors.border}; z-index: 1000;`
            });
            this.refs.nsfwTooltip = nsfwTooltip;

            const nsfwBtnContainer = h('div', {
                style: 'position: relative; display: flex; align-items: center; margin-left: 8px;'
            }, [nsfwBtn, nsfwTooltip]);
            sortBtnContainer.appendChild(nsfwBtnContainer);

            const filterContainer = h('div', {
                style: `display: flex; gap: 8px; align-items: center; ${isMobile ? 'justify-content: space-between; flex-wrap: wrap;' : 'flex-wrap: wrap;'} position: relative; z-index: 101;`
            }, [categoryDropdown, localeDropdown, buttonsContainer]);

            const searchContainer = h('div', {
                style: `${isMobile ? 'width: 100%;' : 'flex: 1;'} display: flex; align-items: center; gap: 8px; position: relative;`
            }, [searchInput, sortBtnContainer]);

            this.element = h('div', {
                style: `padding: ${isMobile ? '16px' : '20px 24px'}; border-bottom: 1px solid ${colors.border}; display: flex; ${isMobile ? 'flex-direction: column; gap: 12px;' : 'align-items: center; gap: 16px;'} overflow: visible; z-index: 100; position: relative;`
            }, [searchContainer, filterContainer]);

            this.updateView();
            return this.element;
        }
    }
})();
