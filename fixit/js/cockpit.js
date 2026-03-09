
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & CORE ---
    const CIRCUMFERENCE = 377;
    const RADIUS = 60; // Соответствует r="60" в твоем SVG
    const logContainer = document.getElementById('exercise-log');
    const exInput = document.getElementById('ex-input');
    const batteryGroup = document.querySelector('.battery-group');

    // Фикс для кнопок сброса и удаления (чтобы не работали в режиме сна)
    const originalReset = window.resetSingleHardware;
    const originalDelete = window.deleteCell;

    let HARDWARE_CONFIG = JSON.parse(localStorage.getItem('mcc_config')) || { 'Hugs': 5 };
    let trainingLogs = JSON.parse(localStorage.getItem('mcc_training')) || [];
    
    // Функция расчета ресурса дня (7:00 - 23:00)
    const getDayResource = () => {
        const now = new Date();
        const start = new Date(); start.setHours(7, 0, 0, 0);
        const end = new Date(); end.setHours(23, 0, 0, 0);

        if (now < start) return "100%";
        if (now > end) return "0%";

        const totalMs = end - start;
        const remainingMs = end - now;
        return `${Math.round((remainingMs / totalMs) * 100)}%`;
    };

    // Функция обновления текста сканера
    const updateScannerDisplay = () => {
        const scanner = document.querySelector('.core-scanner');
        if (scanner && !scanner.classList.contains('active') && !scanner.classList.contains('running')) {
            const valEl = document.querySelector('.core-value');
            const labEl = document.querySelector('.core-label');
            if (valEl) valEl.innerText = getDayResource();
            if (labEl) labEl.innerText = "resource";
        }
    };

    let chronoInterval = null;
    let chronoSeconds = 0;

    // --- 1. GENERATION (FACTORY) ---
    function renderCellHTML(name, limit) {
        if (!batteryGroup || document.getElementById(`circle-${name}`)) return;

        const cell = document.createElement('div');
        cell.className = 'battery-cell';
        cell.id = `container-${name}`; // КРИТИЧНО для логики awake
        cell.onclick = () => window.incrementHardware(name);

        cell.innerHTML = `
            <div class="mini-reset x-icon" onclick="window.resetSingleHardware(event, '${name}')" title="RESET COUNT">
                <div class="m-line-v"></div><div class="m-line-h"></div>
            </div>
            <div class="delete-unit x-icon" onclick="window.deleteCell(event, '${name}')" title="DELETE UNIT">
                <div class="d-line-v"></div><div class="d-line-h"></div>
            </div>
            <div class="circle-wrapper">
                <svg class="cell-svg" width="140" height="140">
                    <circle class="circle-bg" cx="70" cy="70" r="${RADIUS}"></circle>
                    <circle id="circle-${name}" class="circle-progress" cx="70" cy="70" r="${RADIUS}"></circle>
                </svg>
                <div id="clock-${name}" class="log-clock"></div>
            </div>
            <div class="cell-header">
                <div class="cell-label">${name}</div>
                <div class="cell-val" id="count-${name}">0</div>
            </div>
        `;
        batteryGroup.appendChild(cell);
    }

    // Функция расчета оставшегося ресурса дня (7:00 - 23:00)
    // const getDayResource = () => {
    //     const now = new Date();
    //     const start = new Date().setHours(7, 0, 0, 0);
    //     const end = new Date().setHours(23, 0, 0, 0);

    //     const totalMs = end - start;
    //     const remainingMs = end - now.getTime();

    //     if (now.getTime() < start) return "100%";
    //     if (now.getTime() > end) return "0%";

    //     const percent = Math.round((remainingMs / totalMs) * 100);
    //     return `${percent}%`;
    // };
    const updateScannerResource = () => {
        const scanner = document.querySelector('.core-scanner');
        const value = document.querySelector('.core-value');
        const label = document.querySelector('.core-label');

        // Обновляем только если секундомер НЕ запущен
        if (scanner && !scanner.classList.contains('running')) {
            label.innerText = "REMAINING RESOURCE";
            value.innerText = getDayResource();
        }
    };
    // --- 2. UI UPDATER ---
    window.updateUI = () => {
        Object.keys(HARDWARE_CONFIG).forEach(item => {
            const count = parseInt(localStorage.getItem(`count_${item}`)) || 0;
            const limit = HARDWARE_CONFIG[item] || 1;
            const elCount = document.getElementById(`count-${item}`);
            const circle = document.getElementById(`circle-${item}`);

            if (elCount) elCount.innerText = count;
            if (circle) {
                const progress = count / limit;
                const offset = CIRCUMFERENCE - (Math.min(progress, 1) * CIRCUMFERENCE);
                circle.style.strokeDashoffset = offset;
                // Magenta при передозе
                circle.style.stroke = progress >= 1 ? 'var(--bg-cos)' : 'var(--cyan)';
            }
        });

        // const syncVal = document.getElementById('sync-percent');
        // if (syncVal) syncVal.innerText = "84%";
    };

    // --- 3. ACTIONS (GLOBAL) ---
    window.incrementHardware = (item) => {
        const cell = document.getElementById(`container-${item}`);

        // КЛИК 1: Пробуждение
        if (!cell.classList.contains('awake')) {
            document.querySelectorAll('.battery-cell').forEach(c => {
                c.classList.remove('awake');
                const clockId = c.id.replace('container-', 'clock-');
                const clockEl = document.getElementById(clockId);
                if (clockEl) clockEl.classList.remove('active');
            });
            cell.classList.add('awake');
            window.toggleStamps(null, item);
            return;
        }

        // КЛИК 2+: Работа
        let count = parseInt(localStorage.getItem(`count_${item}`)) || 0;
        let stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];
        count++;

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        stamps.push(timeStr);

        localStorage.setItem(`count_${item}`, count);
        localStorage.setItem(`stamps_${item}`, JSON.stringify(stamps));

        trainingLogs.unshift({
            date: now.toLocaleDateString('ru-RU'),
            time: timeStr,
            task: `DEPLOYED: ${item} (#${count})`,
            type: item
        });

        localStorage.setItem('mcc_training', JSON.stringify(trainingLogs));
        window.refreshClockDots(item); // ОБНОВЛЯЕМ ТОЧКИ
        window.updateUI();
        window.renderLogs();
    };


    window.resetSingleHardware = (event, item) => {
        if (event) event.stopPropagation();
        const cell = document.getElementById(`container-${item}`);
        if (!cell.classList.contains('awake')) return;

        let count = parseInt(localStorage.getItem(`count_${item}`)) || 0;
        let stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];
        if (count > 0) {
            count--;
            stamps.pop();
            localStorage.setItem(`count_${item}`, count);
            localStorage.setItem(`stamps_${item}`, JSON.stringify(stamps));
            const idx = trainingLogs.findIndex(l => l.type === item);
            if (idx !== -1) trainingLogs.splice(idx, 1);
            localStorage.setItem('mcc_training', JSON.stringify(trainingLogs));
            window.refreshClockDots(item);
            window.updateUI();
            window.renderLogs();
        }
    };

    window.deleteCell = (event, name) => {
        if (event) event.stopPropagation();
        const cell = document.getElementById(`container-${name}`);
        if (!cell.classList.contains('awake')) return;

        if (confirm(`DELETE UNIT: ${name}?`)) {
            delete HARDWARE_CONFIG[name];
            localStorage.setItem('mcc_config', JSON.stringify(HARDWARE_CONFIG));
            localStorage.removeItem(`count_${name}`);
            localStorage.removeItem(`stamps_${name}`);
            location.reload();
        }
    };

    // --- 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    window.toggleStamps = (event, item) => {
        if (event) event.stopPropagation();
        const clock = document.getElementById(`clock-${item}`);
        if (!clock) return;
        const stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];
        clock.innerHTML = '';
        clock.classList.add('active'); // Всегда active при пробуждении

        stamps.forEach(time => {
            const [h, m] = time.split(':').map(Number);
            const angle = ((h % 12) * 30) + (m * 0.5);
            const dot = document.createElement('div');
            dot.className = 'time-dot';
            dot.setAttribute('data-time', time);
            const x = Math.sin(angle * Math.PI / 180) * RADIUS;
            const y = -Math.cos(angle * Math.PI / 180) * RADIUS;
            dot.style.transform = `translate(${x}px, ${y}px)`;
            clock.appendChild(dot);
        });
    };

    window.createNewCell = () => {
        const name = document.getElementById('cell-name').value.trim();
        const limit = parseInt(document.getElementById('cell-limit').value);
        if (!name || !limit) return alert("DATA REQUIRED");
        HARDWARE_CONFIG[name] = limit;
        localStorage.setItem('mcc_config', JSON.stringify(HARDWARE_CONFIG));
        renderCellHTML(name, limit);
        window.updateUI();
        document.getElementById('cell-name').value = '';
        document.getElementById('cell-limit').value = '';
    };

    window.hardResetAll = () => {
        if (confirm("NUCLEAR RESET?")) { localStorage.clear(); location.reload(); }
    };

    window.deepResetCounters = () => {
        if (confirm("START NEW DAY CYCLE?")) {
            Object.keys(HARDWARE_CONFIG).forEach(item => {
                localStorage.removeItem(`count_${item}`);
                localStorage.removeItem(`stamps_${item}`);
            });
            location.reload();
        }
    };

    window.logExercise = () => {
        const task = exInput.value.trim();
        if (!task) return;
        const now = new Date();
        trainingLogs.unshift({
            date: now.toLocaleDateString('ru-RU'),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            task: task.toUpperCase(),
            type: 'kinetic'
        });
        localStorage.setItem('mcc_training', JSON.stringify(trainingLogs));
        exInput.value = '';
        window.renderLogs();
    };

    window.renderLogs = () => {
        if (!logContainer) return;
        logContainer.innerHTML = trainingLogs.map(l => `
            <div class="log-entry"><span style="opacity:0.4;">${l.date}</span> [${l.time}] > ${l.task}</div>
        `).join('');
    };

    window.refreshClockDots = (item) => {
        const clock = document.getElementById(`clock-${item}`);
        if (clock && clock.classList.contains('active')) {
            window.toggleStamps(null, item);
        }
    };;
    // Выносим функцию в глобальный доступ window
    window.togglePanel = (type) => {
        // 1. Логика для логов (index.html)
        if (type === 'log') {
            const logWindow = document.getElementById('exercise-log');
            if (logWindow) {
                logWindow.classList.toggle('active');
                if (logWindow.classList.contains('active')) logWindow.scrollTop = 0;
            }
            return;
        }
        // 3. Логика для стандартных панелей HUD (index.html)
        const hudPanel = document.querySelector(`.hud-panel.${type}`);
        if (hudPanel) {
            hudPanel.classList.toggle('active');
        }
    };
    // =========Хронометр.
    window.toggleChrono = () => {
        const scanner = document.querySelector('.core-scanner');
        if (!scanner) return; // Выход, если мы не на главной

        const ring = document.querySelector('.scan-ring');
        const label = document.querySelector('.core-label');
        const value = document.querySelector('.core-value');

        if (!scanner.classList.contains('active')) {
            scanner.classList.add('active');
            if (ring) ring.style.boxShadow = "0 0 20px var(--cyan)";
            if (label) label.innerText = "CHRONO READY";
            return;
        }

        if (!scanner.classList.contains('running')) {
            scanner.classList.add('running');
            if (ring) ring.style.animationPlayState = "running";
            if (label) label.innerText = "ELAPSED TIME";

            chronoInterval = setInterval(() => {
                chronoSeconds++;
                const mins = Math.floor(chronoSeconds / 60).toString().padStart(2, '0');
                const secs = (chronoSeconds % 60).toString().padStart(2, '0');
                if (value) value.innerText = `${mins}:${secs}`;
            }, 1000);
        } else {
            clearInterval(chronoInterval);
            chronoInterval = null;
            chronoSeconds = 0;
            scanner.classList.remove('running', 'active');
            if (ring) {
                ring.style.animationPlayState = "paused";
                ring.style.boxShadow = "none";
            }
            updateScannerDisplay(); // Теперь безопасно
        }
    };
    window.toggleManual = (type) => {
        // Ищем панель с префиксом m- (manual)
        const target = document.querySelector(`.guide-panel.m-${type}`);

        if (target) {
            // Закрываем другие открытые инструкции на этой странице
            document.querySelectorAll('.guide-panel').forEach(p => {
                if (p !== target) p.classList.remove('active');
            });

            // Переключаем выбранную
            target.classList.toggle('active');
        }
    };
    // --- 5. INITIALIZATION ---
    const logEl = document.getElementById('exercise-log');
    if (logEl) {
        logEl.addEventListener('click', (e) => {
            const selection = window.getSelection().toString();
            if (logEl.classList.contains('active') && selection.length > 0) {
                return;
            }
            window.togglePanel('log');
        });
    }
    Object.keys(HARDWARE_CONFIG).forEach(name => renderCellHTML(name, HARDWARE_CONFIG[name]));
    window.updateUI();
    window.renderLogs();

    // ЗАПУСК ЖИВОГО РЕСУРСА (7:00 - 23:00)
    if (typeof updateScannerDisplay === 'function') {
        updateScannerDisplay(); // Первый запуск
        setInterval(updateScannerDisplay, 60000); // Раз в минуту (60000 мс)
    }

    // Глобальный клик для сброса состояния "Awake"
    document.addEventListener('click', (e) => {
        // 1. Если кликнули ВНЕ любой карточки и ВНЕ кнопок управления
        if (!e.target.closest('.battery-cell') && !e.target.closest('.lava-btn') && !e.target.closest('.creator-form')) {

            // Усыпляем все кликеры
            document.querySelectorAll('.battery-cell').forEach(cell => {
                cell.classList.remove('awake');

                // Гасим часы (dots) при засыпании
                const name = cell.id.replace('container-', '');
                const clock = document.getElementById(`clock-${name}`);
                if (clock) clock.classList.remove('active');
            });
        }
    });

    Object.keys(HARDWARE_CONFIG).forEach(name => {
        // Рендерим, только если на странице есть куда рендерить (battery-group)
        if (document.querySelector('.battery-group')) {
            renderCellHTML(name, HARDWARE_CONFIG[name]);
        }
    });
});