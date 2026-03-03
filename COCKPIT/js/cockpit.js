document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & CORE ---
    const CIRCUMFERENCE = 377;
    const RADIUS = 60; // Соответствует r="60" в твоем SVG
    const logContainer = document.getElementById('exercise-log');
    const exInput = document.getElementById('ex-input');
    const batteryGroup = document.querySelector('.battery-group');

    let HARDWARE_CONFIG = JSON.parse(localStorage.getItem('mcc_config')) || {'Omega': 3 };
    let trainingLogs = JSON.parse(localStorage.getItem('mcc_training')) || [];

    // --- 2. GENERATION (FACTORY) ---
    function renderCellHTML(name, limit) {
        if (!batteryGroup || document.getElementById(`circle-${name}`)) return;

        const cell = document.createElement('div');
        cell.className = 'battery-cell';
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
                <button class="view-log-btn" onclick="window.toggleStamps(event, '${name}')">VIEW LOGS</button>
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
                circle.style.stroke = progress >= 1 ? 'var(--magenta)' : 'var(--cyan)';
            }
        });

        const syncVal = document.getElementById('sync-percent');
        if (syncVal) syncVal.innerText = "84%"; 
    };

    // --- 4. ACTIONS (GLOBAL) ---
    window.incrementHardware = (item) => {
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
        window.updateUI();
        window.renderLogs();
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
            const idx = trainingLogs.findIndex(l => l.type === item);
            if (idx !== -1) trainingLogs.splice(idx, 1);
            localStorage.setItem('mcc_training', JSON.stringify(trainingLogs));
            window.updateUI();
            window.renderLogs();
        }
    };

    window.deleteCell = (event, name) => {
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

    // --- 5. INITIALIZATION ---
    Object.keys(HARDWARE_CONFIG).forEach(name => renderCellHTML(name, HARDWARE_CONFIG[name]));
    window.updateUI();
    window.renderLogs();
});