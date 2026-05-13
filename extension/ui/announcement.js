window.UI = window.UI || {};

window.UI.Announcement = class AnnouncementComponent {
    constructor(colors, mobile) {
        this.colors = colors;
        this.mobile = mobile;
        this.announcements = [];
        this.currentIndex = 0;
        this.rotationTimeout = null;
        this.scrollTimeout = null;
        this.scrollAnimation = null;
        this.isHovered = false;
    }

    async load() {
        if (window.ConfigManager) {
            const config = await window.ConfigManager.get();
            if (config?.announcements?.length > 0) {
                // Weighted random sort: Higher priority = higher chance to be first
                this.announcements = config.announcements
                    .map(item => ({
                        ...item,
                        _sortKey: Math.pow(Math.random(), 1 / (item.priority || 1))
                    }))
                    .sort((a, b) => b._sortKey - a._sortKey);

                this.currentIndex = 0;
                const container = document.getElementById('announcement-container');
                if (container) {
                    this.updateContent(container);
                }
            }
        }
    }

    render() {
        const { h } = window.DOM;
        const containerId = 'announcement-container';

        const container = h('div', {
            id: containerId,
            style: `
                display: none; 
                align-items: center; 
                background: ${this.colors.surface}; 
                border: 1px solid ${this.colors.border}; 
                border-radius: 20px; 
                padding: ${this.mobile ? '8px 12px' : '6px 12px'}; 
                font-size: ${this.mobile ? '13px' : '12px'}; 
                color: ${this.colors.text}; 
                max-width: ${this.mobile ? '100%' : '215px'}; 
                width: ${this.mobile ? '100%' : 'auto'}; 
                box-sizing: border-box; 
                overflow: hidden;
                transition: all 0.3s ease;
                cursor: default;
            `
        });

        // Hover events to pause/resume
        container.addEventListener('mouseenter', () => {
            this.isHovered = true;
            if (this.scrollAnimation) this.scrollAnimation.pause();
            if (this.rotationTimeout) clearTimeout(this.rotationTimeout);
        });

        container.addEventListener('mouseleave', () => {
            this.isHovered = false;
            if (this.scrollAnimation) this.scrollAnimation.play();
            this.scheduleRotation();
        });

        if (this.announcements.length > 0) {
            this.updateContent(container);
        }

        return container;
    }

    updateContent(container) {
        if (!this.announcements.length) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'flex';

        // Clean up previous state
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
        if (this.rotationTimeout) clearTimeout(this.rotationTimeout);
        if (this.scrollAnimation) {
            this.scrollAnimation.cancel();
            this.scrollAnimation = null;
        }

        const item = this.announcements[this.currentIndex];
        const { h } = window.DOM;

        container.innerHTML = ''; // Clear

        const isXhs = item.link && item.link.includes('xiaohongshu.com');
        const icon = h('span', { style: 'margin-right: 8px;' }, isXhs ? '📕' : '📢');

        const textStyle = 'display: inline-block; white-space: nowrap; transition: transform 0.3s;';
        const textContent = isXhs ? `${item.content} ↗` : item.content;
        const text = h('span', { style: textStyle }, textContent);

        if (item.link) {
            text.style.cursor = 'pointer';
            text.style.textDecoration = 'underline';
            text.onclick = () => window.open(item.link, '_blank');
        }

        const wrapper = h('div', {
            style: 'flex: 1; overflow: hidden; white-space: nowrap; position: relative; mask-image: linear-gradient(to right, black 90%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 90%, transparent 100%);'
        }, [text]);

        container.appendChild(icon);
        container.appendChild(wrapper);

        // Scroll logic with 2s delay
        this.scrollTimeout = setTimeout(() => {
            if (text.offsetWidth > wrapper.offsetWidth) {
                const diff = text.offsetWidth - wrapper.offsetWidth;
                // Scroll back and forth
                this.scrollAnimation = text.animate([
                    { transform: 'translateX(0)' },
                    { transform: `translateX(-${diff}px)` },
                    { transform: `translateX(-${diff}px)` }, // pause
                    { transform: 'translateX(0)' }
                ], {
                    duration: 8000,
                    iterations: Infinity
                });

                // If user is already hovering when animation starts
                if (this.isHovered) {
                    this.scrollAnimation.pause();
                }
            }
        }, 2000);

        this.scheduleRotation();
    }

    scheduleRotation() {
        if (this.rotationTimeout) clearTimeout(this.rotationTimeout);
        if (this.isHovered) return; // Don't rotate if hovered

        const item = this.announcements[this.currentIndex];
        const duration = (item.duration || 5) * 1000;

        this.rotationTimeout = setTimeout(() => {
            this.currentIndex = (this.currentIndex + 1) % this.announcements.length;
            const currentContainer = document.getElementById('announcement-container');
            if (currentContainer) {
                this.updateContent(currentContainer);
            }
        }, duration);
    }
};
