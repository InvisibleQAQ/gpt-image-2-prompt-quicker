document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelector('.slides');
    const dots = document.querySelectorAll('.dot');
    const btnNext = document.getElementById('btn-next');
    // const btnSkip = document.getElementById('btn-skip');

    let currentSlide = 0;
    const totalSlides = 2;

    function updateSlide(index) {
        currentSlide = index;

        // Update transform
        slides.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });

        // Update buttons
        if (currentSlide === totalSlides - 1) {
            btnNext.textContent = '开始使用';
            // btnSkip.style.display = 'none';
        } else {
            btnNext.textContent = '下一步';
            // btnSkip.style.display = 'block';
        }
    }

    // Event Listeners
    btnNext.addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) {
            updateSlide(currentSlide + 1);
        } else {
            // Last slide action: Close tab or redirect
            // Ideally we just let them click the platform links, 
            // but if they click "Get Started", we can default to Gemini
            window.open('https://gemini.google.com/', '_blank');
            // Optional: Close onboarding tab after delay?
            // window.close(); 
        }
    });

    // btnSkip.addEventListener('click', () => {
    //     updateSlide(totalSlides - 1);
    // });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            updateSlide(index);
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            if (currentSlide < totalSlides - 1) updateSlide(currentSlide + 1);
        } else if (e.key === 'ArrowLeft') {
            if (currentSlide > 0) updateSlide(currentSlide - 1);
        }
    });
});
