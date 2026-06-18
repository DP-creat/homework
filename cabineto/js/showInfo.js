window.showModuleInfo = () => {
    // 1. Находим то, что сейчас открыто (модуль или панель)
    const activeView = document.querySelector('.module-view.active, .panel.active');
    if (!activeView) return;
    

     // 2. Ищем "Маяк" (видимый блок с данными). 
    // Находим все якоря и берем тот, который не скрыт (display != none)
    const anchors = Array.from(activeView.querySelectorAll('[data-info-anchor]'));
    const currentAnchor = anchors.find(el => el.offsetWidth > 0 || el.offsetHeight > 0) || activeView;


      // 3. Забираем инфу и цель из этого якоря
    const template = currentAnchor.querySelector('.module-info');
    const target = currentAnchor.querySelector('[data-info-target]') || currentAnchor;

    if (template) {
        document.querySelector('#info-layer .info-content').innerHTML = template.innerHTML;
        
        // Включаем фокус
        target.classList.add('bring-to-front');
        document.body.classList.add('info-focus-mode');
    }
};

window.hideModuleInfo = () => {
    document.body.classList.remove('info-focus-mode');
    // Снимаем приоритет со всех объектов
    document.querySelectorAll('.bring-to-front').forEach(el => {
        el.classList.remove('bring-to-front');
    });
};