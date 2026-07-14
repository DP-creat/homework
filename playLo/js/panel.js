window.togglePanel = (name, excl = 0) => {
    const target = document.querySelector(`.panel.${name}`);
    if (!target) return;

    // Режим эксклюзивности: закрываем другие активные панели
    if (excl) {
        document.querySelectorAll('.panel.active').forEach(p => {
            if (p !== target) p.classList.remove('active');
        });
    }

    target.classList.toggle('active');
    // КРИТИЧНО для твоей меты:
    if (name === 'playEr') {
        document.body.classList.toggle('panel-open');
    }
    // Блокировка скролла страницы (body)
    const anyActive = document.querySelector('.panel.active');
    document.body.style.overflow = anyActive ? 'hidden' : '';
};
