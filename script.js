document.addEventListener('DOMContentLoaded', function () {
    const hero = document.querySelector('.hero');
    const scrollableContent = document.querySelector('.scrollable-content');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            hero.classList.add('fade-out');
        } else {
            hero.classList.remove('fade-out');
        }
    });
});
