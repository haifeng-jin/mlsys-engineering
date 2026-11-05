// Folds/expands chapter section lists in the sidebar TOC on hover, letting
// an in-progress expand finish before a 1s hold + collapse ever starts.
const EXPAND_MS = 800;
const HOLD_MS = 1000;

document.querySelectorAll('#toc li.toc-chapter').forEach((li) => {
    let openedAt = null;
    let closeTimer = null;

    function open() {
        clearTimeout(closeTimer);
        closeTimer = null;
        if (openedAt === null) {
            openedAt = performance.now();
        }
        li.classList.add('toc-open');
    }

    function close() {
        clearTimeout(closeTimer);
        const elapsed = openedAt === null ? EXPAND_MS : performance.now() - openedAt;
        const remainingExpand = Math.max(0, EXPAND_MS - elapsed);
        closeTimer = setTimeout(() => {
            li.classList.remove('toc-open');
            openedAt = null;
        }, remainingExpand + HOLD_MS);
    }

    li.addEventListener('mouseenter', open);
    li.addEventListener('mouseleave', close);
});
