document.addEventListener('DOMContentLoaded', () => {
    const logContainer = document.getElementById('exercise-log');
    const exInput = document.getElementById('ex-input');

    const HARDWARE_CONFIG = { 'Tyrosine': 2, 'Creatine': 1, 'Omega': 3 };
    let trainingLogs = JSON.parse(localStorage.getItem('mcc_training')) || [];

    const renderLogs = () => {
        if (!logContainer) return;
        logContainer.innerHTML = trainingLogs.map(log => `
            <div class="log-entry">
                <span style="opacity:0.4; font-size:10px;">${log.date || ''}</span> 
                <span style="color:var(--cyan)">[${log.time}]</span> > ${log.task}
            </div>
        `).join('');
    };

    const checkDailyReset = () => {
        const lastReset = localStorage.getItem('last_reset_day');
        const now = new Date();
        const currentDay = now.getDate();
        if (lastReset != currentDay && now.getHours() >= 1) {
            ['Tyrosine', 'Creatine', 'Omega'].forEach(item => {
                localStorage.setItem(`count_${item}`, 0);
                localStorage.setItem(`stamps_${item}`, JSON.stringify([]));
            });
            localStorage.setItem('last_reset_day', currentDay);
            location.reload();
        }
    };

    window.incrementHardware = (item) => {
        let count = parseInt(localStorage.getItem(`count_${item}`)) || 0;
        let stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];
        
        count++;
        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        stamps.push(timeStr);
        localStorage.setItem(`count_${item}`, count);
        localStorage.setItem(`stamps_${item}`, JSON.stringify(stamps));

        // ФИКС: Записываем и время, и дату в объект
        trainingLogs.unshift({
            date: dateStr,
            time: timeStr,
            task: `DEPLOYED: ${item} (#${count})`,
            type: item
        });

        localStorage.setItem('mcc_training', JSON.stringify(trainingLogs));
        updateUI();
        renderLogs();
    };

    window.logExercise = () => {
        const task = exInput.value.trim();
        if (!task) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // ФИКС: Добавляем запись в массив (этого не было!)
        trainingLogs.unshift({
            date: dateStr,
            time: timeStr,
            task: task,
            type: 'kinetic'
        });

        localStorage.setItem('mcc_training', JSON.stringify(trainingLogs));
        exInput.value = '';
        renderLogs();
    };

    window.resetSingleHardware = (event, item) => {
        event.stopPropagation();
        let count = parseInt(localStorage.getItem(`count_${item}`)) || 0;
        let stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];
        if (count > 0) {
            count--;
            stamps.pop();
            localStorage.setItem(`count_${item}`, count);
            localStorage.setItem(`stamps_${item}`, JSON.stringify(stamps));
            const logIndex = trainingLogs.findIndex(log => log.type === item);
            if (logIndex !== -1) {
                trainingLogs.splice(logIndex, 1);
                localStorage.setItem('mcc_training', JSON.stringify(trainingLogs));
            }
            updateUI();
            renderLogs();
        }
    };

    window.toggleStamps = (event, item) => {
        event.stopPropagation();
        const el = document.getElementById(`stamps-${item}`);
        if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
    };

    const updateUI = () => {
        ['Tyrosine', 'Creatine', 'Omega'].forEach(item => {
            const count = localStorage.getItem(`count_${item}`) || 0;
            const stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];
            const elCount = document.getElementById(`count-${item}`);
            const bar = document.getElementById(`bar-${item}`);
            const stampContainer = document.getElementById(`stamps-${item}`);
            if (elCount) elCount.innerText = count;
            if (bar) {
                const limit = HARDWARE_CONFIG[item] || 10;
                bar.style.width = Math.min((count / limit) * 100, 100) + '%';
            }
            if (stampContainer) {
                stampContainer.innerHTML = stamps.map(s => `<span class="stamp">${s}</span>`).join('');
            }
        });
    };

    window.deepResetCounters = () => {
        if (confirm("START NEW DAY CYCLE?")) {
            ['Tyrosine', 'Creatine', 'Omega'].forEach(item => {
                localStorage.removeItem(`count_${item}`);
                localStorage.removeItem(`stamps_${item}`);
            });
            updateUI();
        }
    };

    window.hardResetAll = () => {
        if (confirm("WARNING: NUCLEAR RESET?")) {
            localStorage.clear();
            location.reload();
        }
    };

    checkDailyReset();
    updateUI();
    renderLogs();
});

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

//  09.03 обновляю
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

    let HARDWARE_CONFIG = JSON.parse(localStorage.getItem('mcc_config')) || { 'Omega': 3 };
    let trainingLogs = JSON.parse(localStorage.getItem('mcc_training')) || [];

    // --- 2. GENERATION (FACTORY) ---
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

    // --- 3. UI UPDATER ---
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

        const syncVal = document.getElementById('sync-percent');
        if (syncVal) syncVal.innerText = "84%";
    };

    // --- 4. ACTIONS (GLOBAL) ---
    window.incrementHardware = (item) => {

        const cell = document.getElementById(`container-${item}`);
        // ПЕРВЫЙ КЛИК: Пробуждение
        if (!cell.classList.contains('awake')) {
            // Усыпляем все остальные, если хочешь режим одного активного окна
            document.querySelectorAll('.battery-cell').forEach(c => c.classList.remove('awake'));

            cell.classList.add('awake');
            window.toggleStamps(null, item); // Включаем часы/логи автоматически
            return; // Выходим, не прибавляя цифру
        }

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
        const cell = document.getElementById(`container-${item}`);
        if (!cell.classList.contains('awake')) return event.stopPropagation();
        originalReset(event, item);

        event.stopPropagation();
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

            const clock = document.getElementById(`clock-${item}`);
            if (clock && clock.classList.contains('active')) {
                // Вызываем повторный рендер точек, чтобы лишняя исчезла
                clock.classList.remove('active');
                window.toggleStamps(event, item);
            }

            window.refreshClockDots(item);
            window.updateUI();
            window.renderLogs();
        }
    };

    window.deleteCell = (event, name) => {
        const cell = document.getElementById(`container-${item}`);
        if (!cell.classList.contains('awake')) return event.stopPropagation();
        originalDelete(event, item);

        event.stopPropagation();
        if (confirm(`DELETE UNIT: ${name}?`)) {
            delete HARDWARE_CONFIG[name];
            localStorage.setItem('mcc_config', JSON.stringify(HARDWARE_CONFIG));
            localStorage.removeItem(`count_${name}`);
            localStorage.removeItem(`stamps_${name}`);
            location.reload();
        }
    };

    window.toggleStamps = (event, item) => {
        event.stopPropagation();
        const clock = document.getElementById(`clock-${item}`);
        if (!clock) return;
        const stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];
        clock.innerHTML = '';
        clock.classList.toggle('active');

        if (clock.classList.contains('active')) {
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
        }
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
        if (!clock || !clock.classList.contains('active')) return;
        if (clock && clock.classList.contains('active')) {
            // Если часы открыты, перерисовываем точки
            clock.classList.remove('active');
            window.toggleStamps({ stopPropagation: () => { } }, item);
        }

        const stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];
        clock.innerHTML = ''; // Очищаем старые точки

        stamps.forEach(time => {
            const [h, m] = time.split(':').map(Number);
            const angle = ((h % 12) * 30) + (m * 0.5);
            const dot = document.createElement('div');
            dot.className = 'time-dot';
            dot.setAttribute('data-time', time);

            // RADIUS у нас 60
            const x = Math.sin(angle * Math.PI / 180) * 60;
            const y = -Math.cos(angle * Math.PI / 180) * 60;

            dot.style.transform = `translate(${x}px, ${y}px)`;
            clock.appendChild(dot);
        });
    };
    window.togglePanel = (type) => {
        // Если это лог (отдельный ID и класс)
        if (type === 'log') {
            const logWindow = document.getElementById('exercise-log');
            if (logWindow) {
                logWindow.classList.toggle('active');
                // При открытии скроллим вверх к самым свежим записям
                if (logWindow.classList.contains('active')) {
                    logWindow.scrollTop = 0;
                }
            }
        } else {
            // Для всех остальных панелей (.clicker, .kinetic и т.д.)
            const panel = document.querySelector(`.hud-panel.${type}`);
            if (panel) {
                panel.classList.toggle('active');
            }
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
            // 1. Если кликнули по тексту записи (или по дочерним элементам записи) — НИЧЕГО НЕ ДЕЛАЕМ
            if (e.target.closest('.log-entry')) {
                return;
            }
            // 2. Если кликнули по самому тексту записи в открытом окне — НИЧЕГО НЕ ДЕЛАЕМ (даем начать выделение)
            if (logEl.classList.contains('active') && e.target.closest('.log-entry')) {
                return;
            }
            // Если кликнули по тексту в РАЗВЕРНУТОМ виде — ничего не делаем (даем копировать)
            if (logEl.classList.contains('active') && e.target.closest('.log-entry')) {
                return;
            }
            // 2. Если кликнули по самому фону окна или по пустому месту — переключаем панель
            window.togglePanel('log');
        });
    }
    Object.keys(HARDWARE_CONFIG).forEach(name => renderCellHTML(name, HARDWARE_CONFIG[name]));
    window.updateUI();
    window.renderLogs();
});

















// !!"№;;№!;№;"№;"№;!№%;!;!№;!№;!№;!;№!;!;!;"
document.addEventListener('DOMContentLoaded', () => {

    const CIRCUMFERENCE = 377;
    const RADIUS = 60;
    const logContainer = document.getElementById('exercise-log');
    const exInput = document.getElementById('ex-input');
    const batteryGroup = document.querySelector('.battery-group');

    let HARDWARE_CONFIG = JSON.parse(localStorage.getItem('mcc_config')) || { 'Omega': 3 };
    let trainingLogs = JSON.parse(localStorage.getItem('mcc_training')) || [];

    // --- 1. РЕНДЕР ---
    function renderCellHTML(name, limit) {
        if (!batteryGroup || document.getElementById(`circle-${name}`)) return;
        const cell = document.createElement('div');
        cell.className = 'battery-cell';
        cell.id = `container-${name}`;
        cell.onclick = () => window.incrementHardware(name);
        cell.innerHTML = `
            <div class="mini-reset x-icon" onclick="window.resetSingleHardware(event, '${name}')"><div class="m-line-v"></div><div class="m-line-h"></div></div>
            <div class="delete-unit x-icon" onclick="window.deleteCell(event, '${name}')"><div class="d-line-v"></div><div class="d-line-h"></div></div>
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

    // --- 2. ЛОГИКА AWAKE + ИНКРЕМЕНТ ---
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
        window.refreshClockDots(item);
        window.updateUI();
        window.renderLogs();
    };

    // --- 3. СБРОС И УДАЛЕНИЕ ---
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

    window.refreshClockDots = (item) => {
        const clock = document.getElementById(`clock-${item}`);
        if (clock && clock.classList.contains('active')) {
            window.toggleStamps(null, item);
        }
    };

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
                circle.style.stroke = progress >= 1 ? 'var(--bg-cos)' : 'var(--cyan)';
            }
        });
        const syncVal = document.getElementById('sync-percent');
        if (syncVal) syncVal.innerText = "84%";
    };

    window.renderLogs = () => {
        if (!logContainer) return;
        logContainer.innerHTML = trainingLogs.map(l => `
            <div class="log-entry"><span style="opacity:0.4;">${l.date}</span> [${l.time}] > ${l.task}</div>
        `).join('');
    };

    // Органы управления
    window.createNewCell = () => {
        const n = document.getElementById('cell-name').value.trim();
        const l = parseInt(document.getElementById('cell-limit').value);
        if (!n || !l) return;
        HARDWARE_CONFIG[n] = l;
        localStorage.setItem('mcc_config', JSON.stringify(HARDWARE_CONFIG));
        renderCellHTML(n, l);
        window.updateUI();
    };

    window.hardResetAll = () => { if (confirm("NUCLEAR RESET?")) { localStorage.clear(); location.reload(); } };
    window.deepResetCounters = () => {
        if (confirm("START NEW DAY CYCLE?")) {
            Object.keys(HARDWARE_CONFIG).forEach(i => {
                localStorage.removeItem(`count_${i}`);
                localStorage.removeItem(`stamps_${i}`);
            });
            location.reload();
        }
    };

    // --- 5. INITIALIZATION ---
    
    // Обработка «умного» клика по логу (разворот/копирование)
    const logEl = document.getElementById('exercise-log');
    if (logEl) {
        logEl.addEventListener('click', (e) => {
            const selection = window.getSelection().toString();
            
            // 1. Если текст выделен — не закрываем (даем скопировать)
            if (logEl.classList.contains('active') && selection.length > 0) {
                return;
            }
            
            // 2. Если кликнули прямо по строке лога — не закрываем (даем начать выделение)
            if (e.target.closest('.log-entry')) {
                return;
            }
            
            // 3. В остальных случаях (клик по полоске или пустому фону) — переключаем
            window.togglePanel('log');
        });
    }

    // Отрисовка всех ячеек из конфига (включая сохраненные)
    const savedConfig = JSON.parse(localStorage.getItem('mcc_config'));
    if (savedConfig) {
        Object.keys(savedConfig).forEach(name => {
            HARDWARE_CONFIG[name] = savedConfig[name];
        });
    }

    // Рендерим все юниты и обновляем данные
    Object.keys(HARDWARE_CONFIG).forEach(name => {
        renderCellHTML(name, HARDWARE_CONFIG[name]);
    });

    window.updateUI();
    window.renderLogs();
});