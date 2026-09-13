window.togglePanel = (name, options = {}) => {

    const {
        isExclusive = false,
        resetScroll = false,
        checkSelection = false
    } = options;

    const target = document.querySelector(`.panel.${name}`);
    if (!target) return;

    // 1. Защита от выделения текста (для логов)
    if (checkSelection) {
        const selection = window.getSelection().toString();
        if (target.classList.contains('active') && selection.length > 0) {
            return;
        }
    }

    // 2. Режим эксклюзивности (Умный аккордеон без привязки к имени 'clickers')
    if (isExclusive) {
        document.querySelectorAll('.panel.active').forEach(p => {
            // ФИКС ВЛОЖЕННОСТИ: Закрываем чужую панель, только если она НЕ является 
            // родителем или ребенком для текущей панели (матрешки не трогаем)
            if (p !== target && !p.contains(target) && !target.contains(p)) {
                p.classList.remove('active');
                p.removeAttribute('data-just-opened');

                // Снимаем подсветку с кнопки закрываемой панели
                const panelName = p.dataset.name || p.className.split(' ')[1];
                if (panelName) {
                    const btn = document.querySelector(`[onclick*="'${panelName}'"]`) ||
                                document.querySelector(`[data-name="${panelName}"]`);
                    if (btn) btn.classList.remove('active');
                }
            }
        });
    }

    // 3. ВОЗВРАЩЕНО: Переключаем физическое состояние шторки в DOM
    const isActive = target.classList.toggle('active');

    // 4. ИСПРАВЛЕНО И ИНТЕГРИРОВАНО С УНИВЕРСАЛЬНЫМ КЛАССОМ:
    const panelBtn = document.querySelector(`[onclick*="'${name}'"]`) ||
                     document.querySelector(`[data-name="${name}"]`);

    if (panelBtn) {
        if (isActive) {
            // Если панель открылась — зажигаем ЕЁ кнопку точечно.
            // Мы НЕ вызываем updateButtonState, поэтому кнопка Main НЕ тухнет!
            panelBtn.classList.add('active'); 
        } else {
            // Если панель закрылась — просто тушим её кнопку
            panelBtn.classList.remove('active');
        }
    }

    // 5. Прокрутка в начало (для логов)
    if (isActive && resetScroll) {
        target.scrollTop = 0;
    }
    // Если панель закрывается, принудительно удаляем маркер первого клика
    if (!isActive) {
        target.removeAttribute('data-just-opened');
    }
    // 6. Блокировка скролла всей страницы
    const anyActive = document.querySelector('.panel.active');
    document.body.style.overflow = anyActive ? 'hidden' : '';
};



document.addEventListener('click', (e) => {
    // 1. Пропускаем клик по кнопкам-открывашкам в футере
    if (e.target.closest('[data-panel-trigger]')) return;

    // 2. ФИКС ОТКРЫТИЯ СВЕРНУТОЙ ШТОРКИ КЛИКОМ НА СЕБЯ:
    // Ищем, не кликнули ли мы по панели, которая сейчас ЗАКРЫТА
    const closedPanel = e.target.closest('.panel:not(.active)');
    if (closedPanel) {
        const name = closedPanel.dataset.name;
        // Если кликнули по свернутому логу (close-inside) — плавно открываем его
        if (closedPanel.classList.contains('close-inside') && name) {
            window.togglePanel(name);
            return; // Останавливаем код, чтобы не триггерить закрытие в ту же микросекунду
        }
    }

    // 3. ЛОГИКА ДЛЯ ЭЛЕМЕНТОВ, КОТОРЫЕ УЖЕ АКТИВНЫ НА МОМЕНТ КЛИКА
    const activePanels = document.querySelectorAll('.panel.active');
    if (activePanels.length === 0) return;

    activePanels.forEach(panel => {
        const name = panel.dataset.name;
        const isCloseInside = panel.classList.contains('close-inside');
        const isClickInside = panel.contains(e.target);

        // ЛОГИКА 1: Клик ВНУТРИ открытой панели типа "Логи" (Схлопывание)
        if (isCloseInside && isClickInside) {
            // Твоя база: если выделяем текст — не закрываем панель
            if (window.getSelection().toString().length === 0) {
                window.togglePanel(name, { checkSelection: true });
            }
        }

        // ЛОГИКА 2: Клик ВНЕ панели
        else if (!isClickInside) {
            const clickedOnOverlay = e.target.closest('.info-overlay') || e.target.closest('.info-layer');

            if (clickedOnOverlay) {
                if (name === 'info-master') {
                    window.togglePanel(name);
                    window.hideModuleInfo?.();
                }
            } else {
                window.togglePanel(name);
            }
        }
    });
});


// Вспомогательная функция для покраски кнопок
const updateButtonState = (activeName) => {
    if (!activeName) return;

    // 1. Снимаем active со всех кнопок-открывашек
    document.querySelectorAll('[data-panel-trigger]').forEach(btn => {
        btn.classList.remove('active');
    });

    // 2. Ищем кнопку, которая открывает текущую панель/модуль
    const activeBtn = document.querySelector(`[onclick*="'${activeName}'"]`) ||
        document.querySelector(`[data-name="${activeName}"]`);

    if (activeBtn) {
        activeBtn.classList.add('active');
    }
};
// <!-- Мы явно пишем имя в data-name -->
// <div class="panel close-inside" data-name="log"> ... </div> */
// <div class="panel" data-name="clicker"> ... </div>
// <!-- Кнопка -->
// <button data-panel-trigger onclick="togglePanel('log')">Логи</button>
// <!-- Панель (всего 3 класса: системный, имя, фишка) -->
// <div class="panel log close-inside"> ... </div>
//
//
//
//
//
//
// 