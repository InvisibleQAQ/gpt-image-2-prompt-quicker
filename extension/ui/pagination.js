window.UI = window.UI || {};

window.UI.Pagination = class PaginationComponent {
    constructor(options = {}) {
        this.colors = options.colors;
        this.mobile = options.mobile || false;
        this.onPageChange = options.onPageChange;
        this.onSponsorClick = options.onSponsorClick;

        this.currentPage = 1;
        this.totalItems = 0;
        this.pageSize = this.mobile ? 8 : 12;

        this.element = null;
        this.currentQrPopup = null;
    }

    getTotalPages() {
        return Math.ceil(this.totalItems / this.pageSize);
    }

    setTotalItems(total) {
        this.totalItems = total;
        const totalPages = this.getTotalPages();

        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
        }

        this.updateView();
    }

    setCurrentPage(page) {
        const totalPages = this.getTotalPages();
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;

        this.currentPage = page;
        this.updateView();

        if (this.onPageChange) {
            this.onPageChange(this.currentPage);
        }
    }

    changePage(delta) {
        this.setCurrentPage(this.currentPage + delta);
    }

    resetPage() {
        this.setCurrentPage(1);
    }

    updateView() {
        if (!this.element) return;

        const totalPages = this.getTotalPages();
        const paginationControls = this.element.querySelector('#pagination-controls');

        if (!paginationControls) return;

        if (totalPages <= 1) {
            paginationControls.style.display = 'none';
            return;
        }

        paginationControls.style.display = 'flex';

        // Update buttons state
        const prevBtn = paginationControls.querySelector('#prev-page-btn');
        const nextBtn = paginationControls.querySelector('#next-page-btn');
        const pageInfo = paginationControls.querySelector('#page-info');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
            this.updateButtonStyle(prevBtn, this.currentPage === 1);
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages;
            this.updateButtonStyle(nextBtn, this.currentPage === totalPages);
        }

        if (pageInfo) {
            pageInfo.textContent = `${this.currentPage} / ${totalPages}`;
        }
    }

    updateButtonStyle(btn, disabled) {
        const { colors, mobile } = this;
        btn.style.cssText = `padding: ${mobile ? '10px 20px' : '8px 18px'}; border: 1px solid ${colors.border}; border-radius: 12px; background: ${disabled ? colors.surface : colors.primary}; color: ${disabled ? colors.textSecondary : '#fff'}; cursor: ${disabled ? 'not-allowed' : 'pointer'}; font-size: ${mobile ? '14px' : '13px'}; transition: all 0.25s ease; opacity: ${disabled ? 0.5 : 1}; font-weight: 500;`;
    }

    render() {
        const { h } = window.DOM;
        const { colors, mobile } = this;

        // Pagination Controls
        const prevBtn = h('button', {
            id: 'prev-page-btn',
            onclick: () => this.changePage(-1),
            onmouseenter: !mobile ? (e) => {
                if (!e.target.disabled) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = `0 4px 12px ${colors.shadow}`;
                }
            } : null,
            onmouseleave: !mobile ? (e) => {
                if (!e.target.disabled) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                }
            } : null
        }, '上一页');

        const pageInfo = h('span', {
            id: 'page-info',
            style: `color: ${colors.text}; font-size: ${mobile ? '14px' : '13px'}; font-weight: 500;`
        }, `${this.currentPage} / ${this.getTotalPages()}`);

        const nextBtn = h('button', {
            id: 'next-page-btn',
            onclick: () => this.changePage(1),
            onmouseenter: !mobile ? (e) => {
                if (!e.target.disabled) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = `0 4px 12px ${colors.shadow}`;
                }
            } : null,
            onmouseleave: !mobile ? (e) => {
                if (!e.target.disabled) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                }
            } : null
        }, '下一页');

        const controlsWrapper = h('div', {
            id: 'pagination-controls',
            style: 'display: flex; align-items: center; gap: 16px;'
        }, [prevBtn, pageInfo, nextBtn]);

        // Social Links
        const socialContainer = this.createSocialLinks();

        // Announcement
        const announcementContainer = h('div', {
            id: 'pagination-announcement',
            style: 'display: flex; align-items: center;'
        });

        // Layout
        if (mobile) {
            this.element = h('div', {
                style: `padding: 12px; border-top: 1px solid ${colors.border}; display: flex; flex-direction: column; align-items: center; gap: 12px; background: ${colors.surface}; border-radius: 0;`
            }, [controlsWrapper, announcementContainer, socialContainer]);
        } else {
            // Desktop: Controls Absolute Center
            controlsWrapper.style.position = 'absolute';
            controlsWrapper.style.left = '50%';
            controlsWrapper.style.transform = 'translateX(-50%)';

            const leftWrapper = h('div', {
                style: 'display: flex; align-items: center; gap: 16px;'
            }, [announcementContainer]);

            const rightWrapper = h('div', {
                style: 'display: flex; align-items: center; gap: 16px;'
            }, [socialContainer]);

            this.element = h('div', {
                style: `padding: 16px 24px; border-top: 1px solid ${colors.border}; display: flex; justify-content: space-between; align-items: center; background: ${colors.surface}; border-radius: 0 0 20px 20px; position: relative;`
            }, [leftWrapper, controlsWrapper, rightWrapper]);
        }

        this.updateView();
        return this.element;
    }

    createSocialLinks() {
        const { h } = window.DOM;
        const { colors, mobile } = this;

        const socialContainer = h('div', {
            style: `display: flex; align-items: center; gap: ${mobile ? '12px' : '16px'}; justify-content: ${mobile ? 'center' : 'flex-end'}; flex-shrink: 0;`
        });

        // GitHub Link
        const githubLink = h('a', {
            href: 'https://github.com/glidea/banana-prompt-quicker',
            target: '_blank',
            title: 'Star on GitHub',
            innerHTML: `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>`,
            style: `color: ${colors.textSecondary}; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; padding: 8px; border-radius: 50%; cursor: pointer;`
        });

        // Xiaohongshu Link
        const xhsLink = h('a', {
            href: 'https://www.xiaohongshu.com/user/profile/5f7dc54d0000000001004afb',
            target: '_blank',
            title: '关注我的小红书',
            style: `
                color: #FF2442;
                background: rgba(255, 36, 66, 0.08);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 6px 12px;
                border-radius: 20px;
                cursor: pointer;
                text-decoration: none;
                gap: 6px;
                font-weight: 500;
                font-size: ${mobile ? '12px' : '13px'};
                border: 1px solid rgba(255, 36, 66, 0.1);
            `
        }, [
            h('span', {
                style: 'display: flex; align-items: center;',
                innerHTML: `<svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32z m-40 728H184V184h656v656zM312 376h400v80H312z m0 176h400v80H312z" /></svg>`
            }),
            h('span', {}, '关注更新')
        ]);

        if (!mobile) {
            githubLink.onmouseenter = () => {
                githubLink.style.color = colors.text;
                githubLink.style.background = colors.surfaceHover;
                githubLink.style.transform = 'scale(1.1)';
            };
            githubLink.onmouseleave = () => {
                githubLink.style.color = colors.textSecondary;
                githubLink.style.background = 'transparent';
                githubLink.style.transform = 'scale(1)';
            };

            xhsLink.onmouseenter = () => {
                xhsLink.style.background = 'rgba(255, 36, 66, 0.15)';
                xhsLink.style.transform = 'scale(1.05)';
                xhsLink.style.boxShadow = `0 4px 12px ${colors.shadow}`;
            };
            xhsLink.onmouseleave = () => {
                xhsLink.style.background = 'rgba(255, 36, 66, 0.08)';
                xhsLink.style.transform = 'scale(1)';
                xhsLink.style.boxShadow = 'none';
            };
        }

        socialContainer.appendChild(githubLink);
        socialContainer.appendChild(xhsLink);

        return socialContainer;
    }

    cleanup() {
        if (this.currentQrPopup && this.currentQrPopup.parentNode) {
            this.currentQrPopup.parentNode.removeChild(this.currentQrPopup);
            this.currentQrPopup = null;
        }
    }
};
