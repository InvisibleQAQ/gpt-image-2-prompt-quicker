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
                nsfwEnabled: props.nsfwEnabled || true,
                recentWeekEnabled: props.recentWeekEnabled || false,
                isDropdownOpen: false
            };
            this.element = null;
            this.dropdownContainer = null;
            this.optionsContainer = null;
            this.arrowIcon = null;
            this.triggerText = null;

            this.handleDocumentClick = this.handleDocumentClick.bind(this);
            document.addEventListener('click', this.handleDocumentClick);
        }

        destroy() {
            document.removeEventListener('click', this.handleDocumentClick);
            if (this.element) {
                this.element.remove();
            }
        }

        handleDocumentClick(e) {
            if (this.state.isDropdownOpen && this.dropdownContainer && !this.dropdownContainer.contains(e.target)) {
                this.closeDropdown();
            }
        }

        updateState(newState) {
            this.state = { ...this.state, ...newState };
            this.updateView();
        }

        updateView() {
            if (!this.element) return;

            // Update Sort Button
            const sortBtn = this.element.querySelector('#sort-mode-btn');
            if (sortBtn) {
                const currentModeText = this.state.sortMode === 'recommend' ? '随机焕新' : '推荐排序';
                sortBtn.innerHTML = this.state.sortMode === 'recommend'
                    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
                    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';

                const tooltip = this.element.querySelector('#sort-tooltip');
                if (tooltip) tooltip.textContent = `切换${currentModeText}`;
            }

            // Update NSFW Toggle
            const nsfwBtn = this.element.querySelector('#nsfw-toggle-btn');
            if (nsfwBtn) {
                const isEnabled = this.state.nsfwEnabled;
                // Update icon based on state
                nsfwBtn.innerHTML = isEnabled
                    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
                    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

                const nsfwTooltip = this.element.querySelector('#nsfw-tooltip');
                if (nsfwTooltip) {
                    nsfwTooltip.textContent = isEnabled ? '屏蔽 NSFW' : '开启 NSFW';
                }
            }

            // Update Category Dropdown
            if (this.triggerText) {
                this.triggerText.textContent = this.state.selectedCategory === 'all' ? '全部' : this.state.selectedCategory;
            }
            if (this.optionsContainer) {
                this.optionsContainer.style.display = this.state.isDropdownOpen ? 'flex' : 'none';
                this.optionsContainer.setAttribute('data-visible', this.state.isDropdownOpen);
            }
            if (this.arrowIcon) {
                this.arrowIcon.style.transform = this.state.isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            }

            this.renderCategoryOptions();

            // Update Filters
            const { colors, isMobile } = this.props;
            ['favorite', 'custom', 'generate', 'edit'].forEach(key => {
                const btn = this.element.querySelector(`#filter-${key}`);
                if (btn) {
                    const isActive = this.state.activeFilters.has(key);
                    if (isActive) {
                        btn.style.cssText = `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.primary}; border-radius: 20px; background: ${colors.primary}; color: white; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; touch-action: manipulation; box-shadow: 0 2px 8px ${colors.shadow};`;
                    } else {
                        btn.style.cssText = `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.border}; border-radius: 20px; background: ${colors.surface}; color: ${colors.text}; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; touch-action: manipulation;`;
                    }
                }
            });

            // Update Recent Week Button
            const recentWeekBtn = this.element.querySelector('#filter-recent-week');
            if (recentWeekBtn) {
                const isActive = this.state.recentWeekEnabled;
                if (isActive) {
                    recentWeekBtn.style.cssText = `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.primary}; border-radius: 20px; background: ${colors.primary}; color: white; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; touch-action: manipulation; box-shadow: 0 2px 8px ${colors.shadow};`;
                } else {
                    recentWeekBtn.style.cssText = `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.border}; border-radius: 20px; background: ${colors.surface}; color: ${colors.text}; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; touch-action: manipulation;`;
                }
            }
        }

        renderCategoryOptions() {
            if (!this.optionsContainer) return;

            const { categories, colors } = this.props;
            const { selectedCategory } = this.state;

            this.optionsContainer.innerHTML = '';

            const sortedCategories = Array.from(categories).sort((a, b) => {
                if (a === '全部') return -1;
                if (b === '全部') return 1;
                return a.localeCompare(b);
            });

            if (sortedCategories.length === 0) {
                this.optionsContainer.appendChild(h('div', {
                    style: `padding: 10px 16px; font-size: 14px; color: ${colors.textSecondary};`
                }, '无分类'));
                return;
            }

            sortedCategories.forEach(cat => {
                const currentLabel = selectedCategory === 'all' ? '全部' : selectedCategory;
                const isSelected = cat === currentLabel;

                const baseStyle = `padding: 10px 16px; cursor: pointer; transition: all 0.2s; font-size: 14px;`;
                const selectedStyle = isSelected
                    ? `background: ${colors.primary}15; color: ${colors.primary}; font-weight: 600;`
                    : `background: transparent; color: ${colors.text};`;

                const option = h('div', {
                    style: baseStyle + selectedStyle,
                    onmouseenter: () => {
                        if (!isSelected) {
                            option.style.background = colors.surfaceHover;
                        }
                        option.style.boxShadow = `0 2px 8px ${colors.shadow}`;
                    },
                    onmouseleave: () => {
                        if (!isSelected) {
                            option.style.background = 'transparent';
                        } else {
                            option.style.background = `${colors.primary}15`;
                        }
                        option.style.boxShadow = 'none';
                    },
                    onclick: (e) => {
                        e.stopPropagation();
                        this.selectCategory(cat);
                    }
                }, cat);

                this.optionsContainer.appendChild(option);
            });
        }

        selectCategory(cat) {
            const category = cat === '全部' ? 'all' : cat;
            this.updateState({ selectedCategory: category, isDropdownOpen: false });
            if (this.props.onCategoryChange) {
                this.props.onCategoryChange(category);
            }
        }

        closeDropdown() {
            this.updateState({ isDropdownOpen: false });
        }

        render() {
            const { colors, isMobile } = this.props;

            // Search Input
            const searchInput = h('input', {
                type: 'text',
                id: 'prompt-search',
                placeholder: '搜索...',
                style: `flex: 1; padding: ${isMobile ? '14px 20px' : '12px 18px'}; border: 1px solid ${colors.inputBorder}; border-radius: 16px; outline: none; font-size: ${isMobile ? '16px' : '14px'}; background: ${colors.inputBg}; color: ${colors.text}; box-sizing: border-box; transition: all 0.2s;`,
                oninput: (e) => {
                    this.state.keyword = e.target.value;
                    if (this.props.onSearch) this.props.onSearch(e.target.value);
                },
                onfocus: (e) => e.target.style.borderColor = colors.primary,
                onblur: (e) => e.target.style.borderColor = colors.inputBorder
            });

            // Sort Button
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
                    const tooltip = this.element.querySelector('#sort-tooltip');
                    if (tooltip) tooltip.style.opacity = '1';
                } : null,
                onmouseleave: !isMobile ? (e) => {
                    e.currentTarget.style.color = colors.textSecondary;
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'transparent';
                    const tooltip = this.element.querySelector('#sort-tooltip');
                    if (tooltip) tooltip.style.opacity = '0';
                } : null
            });

            const tooltip = h('div', {
                id: 'sort-tooltip',
                style: `position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%); background: ${colors.surface}; color: ${colors.text}; padding: 6px 12px; border-radius: 8px; font-size: 12px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; box-shadow: 0 4px 12px ${colors.shadow}; border: 1px solid ${colors.border}; z-index: 1000;`
            });

            const sortBtnContainer = h('div', {
                style: 'position: relative; display: flex; align-items: center;'
            }, [sortBtn, tooltip]);


            // Category Dropdown
            this.triggerText = h('span', {
                id: 'category-trigger-text',
                style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; text-align: center;'
            }, '全部');

            this.arrowIcon = h('span', {
                style: `display: flex; align-items: center; transition: transform 0.2s; opacity: 0.6;`,
                innerHTML: `<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1L5 5L9 1"/></svg>`
            });

            const dropdownTrigger = h('div', {
                id: 'category-dropdown-trigger',
                style: `padding: ${isMobile ? '10px 14px' : '8px 12px'}; border: 1px solid ${colors.border}; border-radius: 16px; background: ${colors.surface}; color: ${colors.text}; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s; min-width: 70px; justify-content: space-between; user-select: none;`,
                onclick: (e) => {
                    e.stopPropagation();
                    this.updateState({ isDropdownOpen: !this.state.isDropdownOpen });
                },
                onmouseenter: !isMobile ? (e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 2px 8px ${colors.shadow}`;
                } : null,
                onmouseleave: !isMobile ? (e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.boxShadow = 'none';
                } : null
            }, [this.triggerText, this.arrowIcon]);

            this.optionsContainer = h('div', {
                id: 'category-options-container',
                style: `position: absolute; top: 100%; left: 0; margin-top: 8px; width: 100%; background: ${colors.surface}; border: 1px solid ${colors.border}; border-radius: 16px; box-shadow: 0 10px 40px ${colors.shadow}; display: none; flex-direction: column; overflow: hidden; backdrop-filter: blur(20px); max-height: 300px; overflow-y: auto; z-index: 9999;`
            });
            this.optionsContainer.setAttribute('data-visible', 'false');

            this.dropdownContainer = h('div', {
                style: `position: relative; z-index: 1000;`
            }, [dropdownTrigger, this.optionsContainer]);


            // Filter Buttons
            const buttonsContainer = h('div', {
                style: `display: flex; gap: 8px; ${isMobile ? 'flex: 1; justify-content: flex-end;' : ''}`
            });

            // Recent Week Button
            const recentWeekBtn = h('button', {
                id: 'filter-recent-week',
                style: `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.border}; border-radius: 20px; background: ${colors.surface}; color: ${colors.text}; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; touch-action: manipulation;`,
                onclick: () => {
                    const newValue = !this.state.recentWeekEnabled;
                    this.updateState({ recentWeekEnabled: newValue });
                    if (this.props.onRecentWeekChange) this.props.onRecentWeekChange(newValue);
                },
                onmouseenter: !isMobile ? (e) => {
                    if (!this.state.recentWeekEnabled) {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = `0 2px 8px ${colors.shadow}`;
                    } else {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = `0 4px 12px ${colors.shadow}`;
                    }
                } : null,
                onmouseleave: !isMobile ? (e) => {
                    e.target.style.transform = 'scale(1)';
                    if (!this.state.recentWeekEnabled) {
                        e.target.style.boxShadow = 'none';
                    } else {
                        e.target.style.boxShadow = `0 2px 8px ${colors.shadow}`;
                    }
                } : null
            }, '最近一周');
            buttonsContainer.appendChild(recentWeekBtn);

            const filters = [
                { key: 'favorite', label: '收藏' },
                { key: 'custom', label: '自定义' },
                { key: 'generate', label: '文生图' },
                { key: 'edit', label: '编辑' }
            ];

            filters.forEach(filter => {
                const btn = h('button', {
                    id: `filter-${filter.key}`,
                    style: `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.border}; border-radius: 20px; background: ${colors.surface}; color: ${colors.text}; font-size: ${isMobile ? '14px' : '13px'}; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; touch-action: manipulation;`,
                    onclick: () => {
                        const key = filter.key;
                        const filters = new Set(this.state.activeFilters);
                        if (filters.has(key)) {
                            filters.delete(key);
                        } else {
                            if (key === 'generate' && filters.has('edit')) filters.delete('edit');
                            if (key === 'edit' && filters.has('generate')) filters.delete('generate');
                            filters.add(key);
                        }
                        this.updateState({ activeFilters: filters });
                        if (this.props.onFilterChange) this.props.onFilterChange(filters);
                    },
                    onmouseenter: !isMobile ? (e) => {
                        if (!this.state.activeFilters.has(filter.key)) {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = `0 2px 8px ${colors.shadow}`;
                        } else {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = `0 4px 12px ${colors.shadow}`;
                        }
                    } : null,
                    onmouseleave: !isMobile ? (e) => {
                        e.target.style.transform = 'scale(1)';
                        if (!this.state.activeFilters.has(filter.key)) {
                            e.target.style.boxShadow = 'none';
                        } else {
                            e.target.style.boxShadow = `0 2px 8px ${colors.shadow}`;
                        }
                    } : null
                }, filter.label);
                buttonsContainer.appendChild(btn);
            });

            // Add Prompt Button
            const addBtn = h('button', {
                title: '添加自定义 Prompt',
                style: `padding: ${isMobile ? '10px 18px' : '8px 18px'}; border: 1px solid ${colors.primary}; border-radius: 20px; background: ${colors.primary}; color: white; font-size: ${isMobile ? '18px' : '16px'}; font-weight: 600; cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; line-height: 1; box-shadow: 0 2px 8px ${colors.shadow};`,
                onclick: () => {
                    if (this.props.onAddPrompt) this.props.onAddPrompt();
                }
            }, '+');
            buttonsContainer.appendChild(addBtn);

            // NSFW Toggle
            const nsfwBtn = h('button', {
                id: 'nsfw-toggle-btn',
                style: `padding: ${isMobile ? '10px' : '8px'}; border: none; background: transparent; color: ${colors.textSecondary}; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border-radius: 8px;`,
                innerHTML: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
                onclick: () => {
                    const newValue = !this.state.nsfwEnabled;
                    this.updateState({ nsfwEnabled: newValue });
                    if (this.props.onNsfwChange) this.props.onNsfwChange(newValue);
                },
                onmouseenter: !isMobile ? (e) => {
                    e.currentTarget.style.color = colors.primary;
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = `${colors.primary}10`;
                    const tooltip = this.element.querySelector('#nsfw-tooltip');
                    if (tooltip) tooltip.style.opacity = '1';
                } : null,
                onmouseleave: !isMobile ? (e) => {
                    e.currentTarget.style.color = colors.textSecondary;
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'transparent';
                    const tooltip = this.element.querySelector('#nsfw-tooltip');
                    if (tooltip) tooltip.style.opacity = '0';
                } : null
            });

            const nsfwTooltip = h('div', {
                id: 'nsfw-tooltip',
                style: `position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%); background: ${colors.surface}; color: ${colors.text}; padding: 6px 12px; border-radius: 8px; font-size: 12px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; box-shadow: 0 4px 12px ${colors.shadow}; border: 1px solid ${colors.border}; z-index: 1000;`
            });

            const nsfwBtnContainer = h('div', {
                style: 'position: relative; display: flex; align-items: center; margin-left: 8px;'
            }, [nsfwBtn, nsfwTooltip]);

            // Add NSFW button to search container instead of filter container for better layout
            // searchContainer.appendChild(nsfwBtn); 
            // Actually, let's put it next to the sort button
            sortBtnContainer.appendChild(nsfwBtnContainer);

            const filterContainer = h('div', {
                style: `display: flex; gap: 8px; align-items: center; ${isMobile ? 'justify-content: space-between; flex-wrap: wrap;' : ''}; position: relative; z-index: 101;`
            }, [this.dropdownContainer, buttonsContainer]);

            const searchContainer = h('div', {
                style: `${isMobile ? 'width: 100%;' : 'flex: 1;'} display: flex; align-items: center; gap: 8px; position: relative;`
            }, [searchInput, sortBtnContainer]);

            this.element = h('div', {
                style: `padding: ${isMobile ? '16px' : '20px 24px'}; border-bottom: 1px solid ${colors.border}; display: flex; ${isMobile ? 'flex-direction: column; gap: 12px;' : 'align-items: center; gap: 16px;'}; overflow: visible; z-index: 100; position: relative;`
            }, [searchContainer, filterContainer]);

            this.updateView(); // Initial view update
            return this.element;
        }
    }
})();
