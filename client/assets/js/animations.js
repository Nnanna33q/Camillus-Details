window.addEventListener('load', () => {
    try {
        const hero = document.querySelector('#hero-219');
        const heroHeading = document.querySelector('.hero-heading-typewriter');
        heroHeading ? heroHeading.style.minHeight = heroHeading.clientHeight + 'px' : null;
        const { Typewriter, Motion } = window;
        if(!Typewriter) {
            heroHeading && heroHeading.classList.remove('opacity-0');
            throw new Error('Failed to load typewriter animation script');
        }
        if(!Motion) throw new Error('Failed to load motion script');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if(e.isIntersecting && heroHeading) {
                    const heroHeadingTypewriter = new Typewriter(heroHeading, { delay: 20 });
                    heroHeading.classList.remove('opacity-0');
                    heroHeadingTypewriter.typeString('Reliable Detailing Services You Can Trust').start()
                    .callFunction(() => {
                        Motion.animate('.initial-hero-elem-state', {
                            y: 0, opacity: 1
                        }, { duration: 1 });
                    })
                    observer.disconnect();
                }
            })
        }, {})
        hero && observer.observe(hero);
    } catch(error) {
        console.error(error);
    }
})