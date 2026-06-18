
document.addEventListener('DOMContentLoaded', () => {
  // --- 1. CONFIG & CORE ---

  const RADIUS = 60; // Соответствует r="60" в твоем SVG

  const logContainer = document.getElementById('exercise-log');

  const batteryGroup = document.querySelector('.battery-group');

  // Фикс для кнопок сброса и удаления (чтобы не работали в режиме сна)
  const originalReset = window.resetSingleHardware;
  const originalDelete = window.deleteCell;

  let HARDWARE_CONFIG = JSON.parse(localStorage.getItem('mcc_config')) || { 'Hugs': 5 };
  let trainingLogs = JSON.parse(localStorage.getItem('mcc_training')) || [];


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

    // Как только большая ячейка упала в DOM, 
    // отправляем имя этой батарейки на штамповку мини-иконки
    if (typeof renderHeaderIcon === 'function') {
      renderHeaderIcon(name);
    }
  }

  window.focusOnHardware = (name) => {
    const originCell = document.getElementById(`container-${name}`);
    const windowDisplay = document.getElementById('focused-node-display');
    const placeholder = document.querySelector('.window-placeholder');

    if (!originCell || !windowDisplay) return;

    // Подсветка иконки в ленте
    document.querySelectorAll('.header-anchor').forEach(el => el.classList.remove('active-node'));
    document.querySelector(`.header-icon-${name}`)?.classList.add('active-node');

    if (placeholder) placeholder.style.display = 'none';
    windowDisplay.style.display = 'block';

    // Функция-рендерер копии, которую мы вызываем при ЛЮБОМ апдейте
    window.renderFocusedWindowHTML = () => {
      // Забираем свежие актуальные данные
      const currentCount = parseInt(localStorage.getItem(`count_${name}`)) || 0;
      const currentLimit = HARDWARE_CONFIG[name] || 1;
      const progress = currentCount / currentLimit;
      const offset = 377 - (Math.min(progress, 1) * 377);

      windowDisplay.innerHTML = `
            <div class="battery-cell awake active-focused-node" onclick="window.incrementHardware('${name}'); window.renderFocusedWindowHTML();">
                <!-- УШКО 1: Сброс счетчика -->
                <div class="mini-reset x-icon" onclick="window.resetSingleHardware(event, '${name}'); window.renderFocusedWindowHTML();" title="RESET COUNT">
                    <div class="m-line-v"></div><div class="m-line-h"></div>
                </div>
                <!-- УШКО 2: Полное удаление -->
                <div class="delete-unit x-icon" onclick="window.deleteCell(event, '${name}')" title="DELETE UNIT">
                    <div class="d-line-v"></div><div class="d-line-h"></div>
                </div>
                <div class="circle-wrapper">
                    <svg class="cell-svg" width="140" height="140">
                        <circle class="circle-bg" cx="70" cy="70" r="60"></circle>
                        <circle class="circle-progress" cx="70" cy="70" r="60" 
                                style="stroke-dashoffset: ${offset}; stroke: ${progress >= 1 ? 'var(--red-2)' : 'var(--glass-border2)'};">
                        </circle>
                    </svg>
                    <!-- Вшиваем точки прямо внутрь циферблата копии -->
                    <div class="log-clock active" id="focused-clock-${name}"></div>
                </div>
                <div class="cell-header">
                    <div class="cell-label">${name}</div>
                    <div class="cell-val">${currentCount}</div>
                </div>
            </div>
        `;

      // Находим и рендерим точки часов внутри копии-двойника
      const focusedClock = document.getElementById(`focused-clock-${name}`);
      if (focusedClock) {
        const stamps = JSON.parse(localStorage.getItem(`stamps_${name}`)) || [];
        stamps.forEach((time, index) => {
          const [h, m] = time.split(':').map(Number);
          const angle = ((h % 12) * 30) + (m * 0.5);
          const dot = document.createElement('div');
          dot.className = 'time-dot';

          // КРИТИЧНО: Даем двойнику его личный уникальный ID
          const dotId = `dot-focused-${name}-${index}-${time.replace(':', '-')}`;
          dot.id = dotId;
          dot.setAttribute('data-time', time);

          const x = Math.sin(angle * Math.PI / 180) * 60;
          const y = -Math.cos(angle * Math.PI / 180) * 60;
          dot.style.transform = `translate(${x}px, ${y}px)`;

          // Делаем прозрачной подложкой, как в оригинале
          dot.style.background = 'transparent';
          dot.style.boxShadow = 'none';
          focusedClock.appendChild(dot);
        });
      }
    };

    // Первый запуск прорисовки окна
    window.renderFocusedWindowHTML();
  };

  // --- 2. UI UPDATER ---
  const CIRCUMFERENCE = 377;

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
        circle.style.stroke = progress >= 1 ? 'var(--red-2)' : 'var(--glass-border2)';
      }
    });

  };
  // HARDWARE_CONFIG и trainingLogs станут стейтами (State) кликера, инициализируемыми через функцию-колбэк из localStorage.Массив Object.keys(HARDWARE_CONFIG) уйдёт из императивного forEach и превратится в декларативный .map() прямо внутри JSX-разметки для рендеринга списка компонентов <BatteryCell />.Расчет offset длины окружности (\(377\)) [stem-calculative-problem-solving] переедет в чистую функцию или хук useMemo, избавляя нас от ручного дерганья style.strokeDashoffset.Функция renderHeaderIcon(name) будет заменена на единый стейт выбранного ID (или массив иконок) в общем родительском компоненте.
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

        // Гасим спарки у остальных засыпающих карточек
        const otherName = c.id.replace('container-', '');
        if (typeof window.toggleSparkVisibilityByClock === 'function') {
          window.toggleSparkVisibilityByClock(otherName, false);
        }
      });

      cell.classList.add('awake');
      window.toggleStamps(null, item);

      // ВКЛЮЧАЕМ СПАРКИ ДЛЯ ТОЙ КАРТОЧКИ, КОТОРУЮ ТОЛЬКО ЧТО РАЗБУДИЛИ!
      if (typeof window.toggleSparkVisibilityByClock === 'function') {
        window.toggleSparkVisibilityByClock(item, true);
      }
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

    // === ВСТАВЛЯЙ СЮДА ===
    // Если на экране сейчас открыто мини-окно, принудительно 
    // заставляем его перерисовать новые цифры и точки
    if (typeof window.renderFocusedWindowHTML === 'function') {
      window.renderFocusedWindowHTML();
    }
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

      // КРИТИЧЕСКИЙ ФИКС: Вместо refreshClockDots вызываем toggleStamps!
      // Это просто перерисует оставшиеся HTML-мишени без добавления ложных точек
      window.toggleStamps(null, item);

      window.updateUI();
      window.renderLogs();

      if (typeof window.renderFocusedWindowHTML === 'function') {
        window.renderFocusedWindowHTML();
      }
    }
    const deletedIndex = stamps.length; // Индекс точки, которую мы только что удалили через stamps.pop() [stem-calculative-problem-solving]
    const targetDotId = `dot-main-${item}-${deletedIndex}-${timeStr.replace(':', '-')}`;

    if (typeof window.removeSparkByDotId === 'function') {
      window.removeSparkByDotId(targetDotId);
    }
  };

  window.deleteCell = (event, name) => {
    if (event) event.stopPropagation();
    if (confirm(`DELETE UNIT: ${name}?`)) {
      delete HARDWARE_CONFIG[name];
      localStorage.setItem('mcc_config', JSON.stringify(HARDWARE_CONFIG));
      localStorage.removeItem(`count_${name}`);
      localStorage.removeItem(`stamps_${name}`);

      // Чистим DOM на лету вместо перезагрузки
      document.getElementById(`container-${name}`)?.remove();
      document.querySelector(`.header-icon-${name}`)?.remove();

      // Очищаем центральное окно, если удалили текущий активный кликер
      document.getElementById('focused-node-display').innerHTML = '';
      document.querySelector('.window-placeholder').style.display = 'block';

      window.updateUI();
    }
  };


  // --- 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
  window.toggleStamps = (event, item) => {
    if (event) event.stopPropagation();
    const clock = document.getElementById(`clock-${item}`);
    if (!clock) return;
    const stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];
    clock.innerHTML = '';
    clock.classList.add('active');

    stamps.forEach((time, index) => {
      const [h, m] = time.split(':').map(Number);
      const angle = ((h % 12) * 30) + (m * 0.5);
      const dot = document.createElement('div');
      dot.className = 'time-dot';

      // Генерируем уникальный маркер точки
      const dotId = `dot-main-${item}-${index}-${time.replace(':', '-')}`;
      dot.id = dotId;
      dot.setAttribute('data-time', time);

      const x = Math.sin(angle * Math.PI / 180) * RADIUS;
      const y = -Math.cos(angle * Math.PI / 180) * RADIUS;
      dot.style.transform = `translate(${x}px, ${y}px)`;

      // ВАЖНО: Делаем саму HTML точку невидимым контейнером-мишенью, 
      // потому что вместо неё на этих координатах будет светиться вбитый Спарк!
      dot.style.background = 'transparent';
      dot.style.boxShadow = 'none';
      clock.appendChild(dot);
    });
  };

  window.createNewCell = () => {
    const name = document.getElementById('cell-name').value.trim();
    const limit = parseInt(document.getElementById('cell-limit').value);
    if (!name || !limit) return alert("DATA REQUIRED");

    if (name.length > 8) {
      name = name.substring(0, 8);
    }

    HARDWARE_CONFIG[name] = limit;

    localStorage.setItem('mcc_config', JSON.stringify(HARDWARE_CONFIG));
    renderCellHTML(name, limit);
    window.updateUI();
    document.getElementById('cell-name').value = '';
    document.getElementById('cell-limit').value = '';
  };

  window.hardResetAll = () => {
    if (confirm("NUCLEAR RESET?")) {
      localStorage.clear();

      // Очищаем локальные массивы данных в памяти
      HARDWARE_CONFIG = {};
      trainingLogs = [];

      // В один кадр очищаем весь интерфейс без моргания экрана
      if (batteryGroup) batteryGroup.innerHTML = '';
      const headerDock = document.querySelector('.status-dock');
      if (headerDock) headerDock.innerHTML = '';

      window.updateUI();
      window.renderLogs();
    }
  };

  window.deepResetCounters = () => {
    if (confirm("START NEW DAY CYCLE?")) {
      Object.keys(HARDWARE_CONFIG).forEach(item => {
        localStorage.removeItem(`count_${item}`);
        localStorage.removeItem(`stamps_${item}`);

        // Гасим точки и усыпляем оригиналы на заводе
        const clock = document.getElementById(`clock-${item}`);
        if (clock) { clock.innerHTML = ''; clock.classList.remove('active'); }
        const cell = document.getElementById(`container-${item}`);
        if (cell) cell.classList.remove('awake');
      });

      // Мгновенно обнуляем копию в центральном окне, если она открыта
      const focusedDisplay = document.getElementById('focused-node-display');
      if (focusedDisplay) focusedDisplay.innerHTML = '';
      const placeholder = document.querySelector('.window-placeholder');
      if (placeholder) placeholder.style.display = 'block';

      window.updateUI();
    }
  };
  // *************************************************************
  // *************************************************************
  // *************************************************************
  // *************************************************************
  // *************************************************************
  // *************************************************************
  const exInput = document.getElementById('ex-input');
  if (exInput) {
    // Слушаем нажатие клавиш внутри текстового поля
    exInput.addEventListener('keydown', (event) => {
      // Проверяем, что нажата именно клавиша Enter
      if (event.key === 'Enter') {
        event.preventDefault(); // Запрещаем дефолтный перенос строки (если это был не обычный input)
        window.logExercise();   // Запускаем вашу функцию отправки лога
      }
    });
  }

  ['cell-name', 'cell-limit'].forEach(id => {
    const inputEl = document.getElementById(id);
    if (inputEl) {
      inputEl.addEventListener('keydown', (event) => {
        // Проверяем нажатие клавиши Enter
        if (event.key === 'Enter') {
          event.preventDefault(); // Запрещаем обновление страницы/переносы
          window.createNewCell();  // Вызываем твою функцию создания ячейки
        }
      });
    }
  });

  window.logExercise = () => {
    const task = exInput.value.trim();
    if (!task) return;
    const now = new Date();
    trainingLogs.unshift({
      date: now.toLocaleDateString('ru-RU'),

      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      task: task,
      type: 'kinetic'
    });
    localStorage.setItem('mcc_training', JSON.stringify(trainingLogs));
    exInput.value = '';
    window.renderLogs();
  };
  // *************************************************************
  // *************************************************************
  // *************************************************************
  // *************************************************************
  // *************************************************************
  // *************************************************************
  // *************************************************************
  // *************************************************************
  // *************************************************************
  // *************************************************************
  window.renderLogs = () => {
    if (!logContainer) return;
    logContainer.innerHTML = trainingLogs.map(l => `
            <div class="log-entry"><span style="opacity:0.4;">${l.date}</span> [${l.time}] > ${l.task}</div>
        `).join('');
  };

  window.refreshClockDots = (item) => {
    const clock = document.getElementById(`clock-${item}`);
    const focusedClock = document.getElementById(`focused-clock-${item}`);

    if (!clock && !focusedClock) return;

    const stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];
    if (stamps.length === 0) return;

    const lastIndex = stamps.length - 1;
    const time = stamps[lastIndex];

    const [h, m] = time.split(':').map(Number);
    const angle = ((h % 12) * 30) + (m * 0.5);

    // 1. ТОЧКА ДЛЯ ОРИГИНАЛЬНОЙ КАРТОЧКИ
    if (clock && clock.classList.contains('active')) {
      const dot = document.createElement('div');
      dot.className = 'time-dot';
      const dotId = `dot-main-${item}-${lastIndex}-${time.replace(':', '-')}`;
      dot.id = dotId;
      dot.setAttribute('data-time', time);

      const x = Math.sin(angle * Math.PI / 180) * RADIUS;
      const y = -Math.cos(angle * Math.PI / 180) * RADIUS;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      dot.style.background = 'transparent';
      dot.style.boxShadow = 'none';
      clock.appendChild(dot);

      // МАТЕМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ С КАДРОМ БРАУЗЕРА
      requestAnimationFrame(() => {
        const rect = dot.getBoundingClientRect();
        // Если браузер еще не выдал координаты, делаем микро-шаг, защищая от (0,0)
        if (rect.left === 0 && rect.top === 0) return;

        if (typeof window.launchSparkToDot === 'function') {
          window.launchSparkToDot(dotId, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      });
    }

    // 2. ТОЧКА ДЛЯ ОКНА-ДВОЙНИКА
    if (focusedClock) {
      const fDot = document.createElement('div');
      fDot.className = 'time-dot';
      const fDotId = `dot-focused-${item}-${lastIndex}-${time.replace(':', '-')}`;
      fDot.id = fDotId;
      fDot.setAttribute('data-time', time);

      const fx = Math.sin(angle * Math.PI / 180) * 60;
      const fy = -Math.cos(angle * Math.PI / 180) * 60;
      fDot.style.transform = `translate(${fx}px, ${fy}px)`;
      fDot.style.background = 'transparent';
      fDot.style.boxShadow = 'none';
      focusedClock.appendChild(fDot);

      // МАТЕМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ С КАДРОМ БРАУЗЕРА
      requestAnimationFrame(() => {
        const rect = fDot.getBoundingClientRect();
        // Полный блок ложных нулей
        if (rect.left === 0 && rect.top === 0) return;

        if (typeof window.launchSparkToDot === 'function') {
          window.launchSparkToDot(fDotId, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      });
    }
  };


  // ИНИЦИАЛИЗАЦИЯ МАТРИЦЫ ПРИ СТАРТЕ M.A.S.C.
  Object.keys(HARDWARE_CONFIG).forEach(name => {
    renderCellHTML(name, HARDWARE_CONFIG[name]);

    // КРИТИЧЕСКИЙ ФИКС: Генерируем HTML-точки в фоне для каждого кликера сразу! [stem-calculative-problem-solving]
    // Это не разбудит часы визуально, но создаст скрытые мишени в DOM для холста спарков.
    const clock = document.getElementById(`clock-${name}`);
    if (clock) {
      const stamps = JSON.parse(localStorage.getItem(`stamps_${name}`)) || [];
      stamps.forEach((time, index) => {
        const [h, m] = time.split(':').map(Number);
        const angle = ((h % 12) * 30) + (m * 0.5);
        const dot = document.createElement('div');
        dot.className = 'time-dot';
        dot.id = `dot-main-${name}-${index}-${time.replace(':', '-')}`;
        dot.setAttribute('data-time', time);
        const x = Math.sin(angle * Math.PI / 180) * RADIUS;
        const y = -Math.cos(angle * Math.PI / 180) * RADIUS;
        dot.style.transform = `translate(${x}px, ${y}px)`;
        dot.style.background = 'transparent';
        dot.style.boxShadow = 'none';
        clock.appendChild(dot);
      });
    }
  });
  window.updateUI();
  window.renderLogs();

  document.addEventListener('click', (e) => {

    // 1. Проверяем, пришелся ли клик на саму карточку-кликер
    const isClickOnCell = e.target.closest('.battery-cell');

    // 2. Проверяем, пришелся ли клик на ЛЮБОЙ инпут или ЛЮБУЮ кнопку на сайте
    // (Это автоматически защищает пульт крафта, ползунки, кнопки FixIt и любые новые поля)
    const isClickOnControl = e.target.closest('input') || e.target.closest('button');

    // Если кликнули мимо карточек И мимо элементов управления (то есть в чистую пустоту)
    if (!isClickOnCell && !isClickOnControl) {

      // Усыпляем все кликеры
      document.querySelectorAll('.battery-cell').forEach(cell => {
        cell.classList.remove('awake');

        const name = cell.id.replace('container-', '');
        const clock = document.getElementById(`clock-${name}`);
        if (clock) clock.classList.remove('active');

        // Синхронизация со скрытием спарков на холсте
        if (typeof window.toggleSparkVisibilityByClock === 'function') {
          window.toggleSparkVisibilityByClock(name, false);
        }
      });
    }
  });

  Object.keys(HARDWARE_CONFIG).forEach(name => {
    // Рендерим, только если на странице есть куда рендерить (battery-group)
    if (document.querySelector('.battery-group')) {
      renderCellHTML(name, HARDWARE_CONFIG[name]);
    }
  });

  // СКРОЛЛ-КОНТРОЛЛЕР ДЛЯ ЦИФРОВОГО ИНПУТА
  const cellLimitInput = document.getElementById('cell-limit');
  if (cellLimitInput) {
    // 1. БЛОКИРОВКА ПРИ ПЕЧАТИ РУКАМИ (Инкубатор лимита 999)
    cellLimitInput.addEventListener('input', () => {
      let val = parseInt(cellLimitInput.value);
      if (val > 999) {
        cellLimitInput.value = 999; // Обрезаем на 999
      } else if (val < 1) {
        cellLimitInput.value = 1;   // Не даем уйти в ноль или минус
      }
    });

    // 2. БЛОКИРОВКА ПРИ СКРОЛЛЕ КОЛЕСИКОМ
    cellLimitInput.addEventListener('wheel', (event) => {
      event.preventDefault();
      let currentVal = parseInt(cellLimitInput.value) || 0;

      if (event.deltaY < 0) {
        // Крутим вверх, но не выше 999
        currentVal = Math.min(999, currentVal + 1);
      } else {
        // Крутим вниз, но не ниже 1
        currentVal = Math.max(1, currentVal - 1);
      }

      cellLimitInput.value = currentVal;
    }, { passive: false });
  }


  // Даем микро-задержку, чтобы кликер успел считать localStorage и построить HTML-точки [stem-calculative-problem-solving]
  setTimeout(() => {
    if (typeof window.restoreMascMatrix === 'function') {
      window.restoreMascMatrix();
    }
  }, 200);
});