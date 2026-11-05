const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlElement = document.documentElement;

const MODES = ['light', 'dark', 'system'];
const ICONS = {
    light: '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>',
    dark: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>',
    system: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>',
};

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
let mode = localStorage.getItem('theme') || 'system';

function applyTheme() {
    const effective = mode === 'system' ? (prefersDark.matches ? 'dark' : 'light') : mode;
    if (effective === 'light') {
        htmlElement.setAttribute('data-theme', 'light');
    } else {
        htmlElement.removeAttribute('data-theme');
    }
    themeIcon.innerHTML = ICONS[mode];
    themeToggle.title = 'Theme: ' + mode[0].toUpperCase() + mode.slice(1);
}

// Initial dark/light attribute is applied by a blocking inline script in
// <head>, before first paint, to avoid a dark-then-light flash. This syncs
// the icon/tooltip to match and handles clicks + live OS theme changes.
applyTheme();

themeToggle.addEventListener('click', () => {
    mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    localStorage.setItem('theme', mode);
    applyTheme();
});

prefersDark.addEventListener('change', () => {
    if (mode === 'system') {
        applyTheme();
    }
});
