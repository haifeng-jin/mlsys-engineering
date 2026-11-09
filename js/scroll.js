const topBar = document.getElementById('top-bar');

// Add scrolled class for sticky header border effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
        topBar.classList.add('scrolled');
    } else {
        topBar.classList.remove('scrolled');
    }
});
