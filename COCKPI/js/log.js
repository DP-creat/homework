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