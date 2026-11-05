const menuToggle = document.getElementById('menu-toggle');
const body = document.body;

menuToggle.addEventListener('click', () => {
    body.classList.toggle('sidebar-open');
});
