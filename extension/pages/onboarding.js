document.addEventListener('DOMContentLoaded', async () => {
    if (window.I18n) {
        await window.I18n.init();
        document.documentElement.lang = window.I18n.getLocale();
        document.title = window.I18n.t('onboarding.pageTitle', document.title);
        document.querySelectorAll('[data-i18n]').forEach((node) => {
            node.textContent = window.I18n.t(node.dataset.i18n, node.textContent);
        });
        document.querySelectorAll('[data-i18n-alt]').forEach((node) => {
            node.alt = window.I18n.t(node.dataset.i18nAlt, node.alt);
        });
    }

    const slides = document.querySelector('.slides');
    const dots = document.querySelectorAll('.dot');
    const btnNext = document.getElementById('btn-next');

    let currentSlide = 0;
    const totalSlides = 2;

    function updateButtonLabel() {
        if (currentSlide === totalSlides - 1) {
            btnNext.textContent = window.I18n
                ? window.I18n.t('onboarding.getStarted', 'Get started')
                : 'Get started';
        } else {
            btnNext.textContent = window.I18n
                ? window.I18n.t('onboarding.next', 'Next')
                : 'Next';
        }
    }

    function updateSlide(index) {
        currentSlide = index;
        slides.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
        updateButtonLabel();
    }

    btnNext.addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) {
            updateSlide(currentSlide + 1);
        } else {
            window.open('https://chatgpt.com/', '_blank');
        }
    });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            updateSlide(index);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            if (currentSlide < totalSlides - 1) updateSlide(currentSlide + 1);
        } else if (e.key === 'ArrowLeft') {
            if (currentSlide > 0) updateSlide(currentSlide - 1);
        }
    });

    updateButtonLabel();
});
