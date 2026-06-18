window.switchModule = (name) => {
    // 1. Если открыта панель — закрываем её, убирая класс .active напрямую, 
    // чтобы она мгновенно уступила место модулю
    const activePanel = document.querySelector('.panel.active');
    if (activePanel) {
        activePanel.classList.remove('active');
    }

    // 2. Ищем модуль, на который хотим переключиться
    const target = document.querySelector(`.${name}-module`);
    if (!target) return; // Защита от дурака

    // 3. Выключаем все остальные модули и включаем нужный
    document.querySelectorAll('.module-view').forEach(mod => mod.classList.remove('active'));
    target.classList.add('active');

    // 4. АВТО-ЗАХВАТ ИМЕНИ 
    const moduleTitle = target.dataset.title || name.toUpperCase();
    const headerTitleEl = document.getElementById('current-module-name');
    if (headerTitleEl) {
        headerTitleEl.innerText = moduleTitle;
    }

    updateButtonState?.(name);
};


