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
// 1. Как это работает (Процесс)Захват: Функция идет в инпут ex-input, забирает текст и очищает пробелы (trim).Валидация: Если поле пустое — просто выходит (if (!task) return).Форматирование: Ты принудительно делаешь текст заглавными буквами (toUpperCase()), что придает логу строгий «системный» вид.Типизация: Ты помечаешь эти записи типом kinetic. Это очень грамотно — в будущем ты сможешь фильтровать лог, отделяя клики по батарейкам от ручных записей.Стек (LIFO): Используешь unshift, чтобы новая запись всегда была первой в списке (сверху).2. Проблема для «независимости»Здесь те же «болячки», что и в предыдущих функциях, но с акцентом на UI:Жесткая связь с инпутом: Функция обязана знать, что на странице есть exInput. Если ты захочешь сделать два таких поля (одно для «физики», другое для «мыслей»), эта функция не поймет, откуда брать текст.Глобальный рендер: Вызов window.renderLogs() заставляет перерисовываться весь список логов с нуля. Если записей станет 500, каждое добавление будет подтормаживать интерфейс.3. Как сделать это «автономной фишкой»Чтобы этот блок стал независимым модулем «Дневник», его нужно разделить:Чистый логгер: Функция addLog(text, type). Она получает готовый текст и тип, формирует объект с датой и сохраняет его. Ей всё равно, откуда пришел текст.Компонент ввода: Это просто поле и кнопка. При нажатии они вызывают addLog и очищают себя.4. Потенциал для «Апа» (Фишки)Когда логика станет независимой, ты сможешь легко добавить:Быстрые теги: Кнопки под инпутом (например, "STRETCH", "WATER", "MEDITATION"), при нажатии на которые текст сам залетает в лог.Таймштамп-редактор: Возможность кликнуть на время в логе и поправить его, если записал упражнение позже.Авто-тип: Если в тексте есть слово «Бег», тип автоматически меняется с kinetic на cardio.



window.renderLogs = () => {
  if (!logContainer) return;
  logContainer.innerHTML = trainingLogs.map(l => `
            <div class="log-entry"><span style="opacity:0.4;">${l.date}</span> [${l.time}] > ${l.task}</div>
        `).join('');
};
// 1. Как это работает (Механика)map + join(''): Ты берешь массив объектов и превращаешь каждый из них в строку HTML. Это стандартный и быстрый способ для обычного JS.innerHTML: Самый «грязный» момент. Каждый раз, когда добавляется одна новая строчка, браузер вынужден:Снести абсолютно все старые записи из DOM.Заново распарсить гигантскую строку HTML.Заново отрисовать всё дерево логов.Для 10 записей это мгновенно, для 100 — уже заметно, для 1000 — интерфейс «лагает».2. Проблема независимостиЖесткий шаблон: Дизайн строки (opacity: 0.4, квадратные скобки) «зашит» прямо в логику. Если ты захочешь в одном месте показывать логи кратко, а в другом — подробно, тебе придется писать вторую функцию renderLogsShort.Привязка к контейнеру: Она знает только про один logContainer. Ты не можешь вызвать эту функцию, чтобы отрисовать логи в другое место (например, в модальное окно).3. Как сделать это «фишкой»Чтобы лог стал мощным и независимым инструментом, его нужно превратить в Компонент Списка:Слой отображения (Item): Создаем функцию/компонент, которая умеет рисовать одну строчку лога. Она просто принимает объект l и возвращает кусочек интерфейса.Умное обновление (Virtual DOM): В Реакте (куда ты стремишься) при добавлении новой записи не перерисовывается весь список. Система просто добавляет один новый div в начало, а остальные не трогает. Это работает в десятки раз быстрее.4. Потенциал для апа (Фишки):Разделив логику, ты сможешь легко добавить:Фильтрацию: Кнопки «Показать только кликеры» или «Показать только ручные записи».Группировку: Автоматически разделять записи заголовками по датам («Сегодня», «Вчера»).Поиск: Живой поиск по логам.Типы: Раскрашивать записи в зависимости от l.type (например, логи кругляшей — синие, ручные — белые).


window.renderLogs();
// renderLogs(): Выводит историю прошлых тренировок.




// Объект сопоставления типов и текстовых тегов, которые будут лететь в инпут

const LOG_TAGS = {
    kinetic: 'KINETIC: ',
    system: 'SYSTEM: ',
    reward: 'REWARD: ',
    energy: 'ENERGY: ',
    scenario: 'SCENARIO: '
};

let selectedLogType = 'kinetic';

window.setLogType = (type) => {
    const exInput = document.getElementById('ex-input');
    if (!exInput) return;

    const buttons = document.querySelectorAll('.type-switcher .micro-btn');
    const targetButton = document.querySelector(`.type-switcher .btn-${type}`);
    
    // ПРОВЕРКА НА ОТЖАТИЕ: если кнопка уже была активной, значит кликнули второй раз
    if (targetButton && targetButton.classList.contains('active')) {
        // Гасим кнопку
        targetButton.classList.remove('active');
        
        // Удаляем конкретно этот тег из инпута, если он там есть
        const tagToRemove = LOG_TAGS[type];
        if (exInput.value.startsWith(tagToRemove)) {
            exInput.value = exInput.value.replace(tagToRemove, '');
        }
        
        // Сбрасываем тип на дефолтный базовый
        selectedLogType = 'kinetic';
        const kineticBtn = document.querySelector('.type-switcher .btn-kinetic');
        if (kineticBtn) kineticBtn.classList.add('active');
        return;
    }

    // --- ЕСЛИ ЭТО ОБЫЧНОЕ НАЖАТИЕ (ВКЛЮЧЕНИЕ) ---
    selectedLogType = type;

    // 1. Управляем неоновым свечением кнопок
    buttons.forEach(btn => {
        if (btn.classList.contains(`btn-${type}`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 2. Управляем текстом внутри инпута
    let currentText = exInput.value;

    // Сначала очищаем строку от любых старых макрос-тегов, если они там были
    Object.values(LOG_TAGS).forEach(tag => {
        if (currentText.startsWith(tag)) {
            currentText = currentText.replace(tag, '');
        }
    });

    // Вставляем новый тег в самое начало, а старый написанный пользователем текст двигаем вправо
    exInput.value = LOG_TAGS[type] + currentText;

    // Возвращаем фокус в инпут и переносим курсор в самый конец строки, чтобы продолжить писать
    exInput.focus();
    const length = exInput.value.length;
    exInput.setSelectionRange(length, length);
};

// ОБНОВЛЕННАЯ ФУНКЦИЯ КЛИКА ПО FIXIT
window.logExercise = () => {
    const exInput = document.getElementById('ex-input');
    if (!exInput) return;
    
    let task = exInput.value.trim();
    if (!task) return;

    const now = new Date();

    // Чистим финальный текст лога от макрос-тега перед сохранением в историю, 
    // чтобы в списке логов не дублировалось слово "SYSTEM: SYSTEM: текст"
    Object.values(LOG_TAGS).forEach(tag => {
        if (task.startsWith(tag)) {
            task = task.replace(tag, '').trim();
        }
    });

    // Сохраняем чистую мысль с правильным неоновым типом
    trainingLogs.unshift({
        date: now.toLocaleDateString('ru-RU'),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        task: task, 
        type: selectedLogType 
    });

    localStorage.setItem('mcc_training', JSON.stringify(trainingLogs));
    exInput.value = '';
    
    // Сбрасываем пульт в исходное состояние
    window.setLogType('kinetic');
    
    window.renderLogs();
};




<!-- НОВЫЙ БОРТ МИКРОКНОПОК -->
              <div class="log-tag-board">
                <button class="tag-micro-btn b-kinetic active" onclick="setLogType('kinetic')">KINETIC</button>
                <button class="tag-micro-btn b-system" onclick="setLogType('system')">SYSTEM</button>
                <button class="tag-micro-btn b-reward" onclick="setLogType('reward')">REWARD</button>
                <button class="tag-micro-btn b-energy" onclick="setLogType('energy')">ENERGY</button>
                <button class="tag-micro-btn b-scenario" onclick="setLogType('scenario')">SCENARIO</button>
              </div>



/* Контейнер вдоль борта */
.log-tag-board {
    display: flex;
    gap: 6px;
    width: 100%;
    margin-top: 6px;
    box-sizing: border-box;
}

/* Базовый вид вытянутой микрокнопки */
.tag-micro-btn {
    flex: 1;
    background: transparent;
    border: 1px solid var(--glass-border);
    border-radius: 4px;
    color: var(--accent-2); /* Тонкая блекло-белая надпись по умолчанию */
    font-family: var(--font-text);
    font-size: var(--fs-10); /* Микро-шрифт */
    font-weight: 500;
    letter-spacing: 1px;
    padding-block: 3px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-transform: uppercase;
}

/* --- НЕОНОВОЕ СВЕЧЕНИЕ ПРИ АКТИВАЦИИ (.active) --- */

/* Голубой неон */
.tag-micro-btn.b-kinetic.active {
    color: var(--cyan);
    border-color: var(--cyan);
    background: rgba(0, 242, 255, 0.05);
    box-shadow: 0 0 10px rgba(0, 242, 255, 0.3), inset 0 0 5px rgba(0, 242, 255, 0.2);
}

/* Малиновый неон */
.tag-micro-btn.b-system.active {
    color: var(--clr-1);
    border-color: var(--clr-1);
    background: rgba(255, 0, 85, 0.05);
    box-shadow: 0 0 10px rgba(255, 0, 85, 0.3), inset 0 0 5px rgba(255, 0, 85, 0.2);
}

/* Золотой неон */
.tag-micro-btn.b-reward.active {
    color: var(--golden);
    border-color: var(--golden);
    background: rgba(255, 204, 0, 0.05);
    box-shadow: 0 0 10px rgba(255, 204, 0, 0.3), inset 0 0 5px rgba(255, 204, 0, 0.2);
}

/* Электрический скай */
.tag-micro-btn.b-energy.active {
    color: var(--electric-sky);
    border-color: var(--electric-sky);
    background: rgba(0, 229, 255, 0.05);
    box-shadow: 0 0 10px rgba(0, 229, 255, 0.3), inset 0 0 5px rgba(0, 229, 255, 0.2);
}

/* Маджента */
.tag-micro-btn.b-scenario.active {
    color: var(--magenta);
    border-color: var(--magenta);
    background: rgba(255, 0, 255, 0.05);
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.3), inset 0 0 5px rgba(255, 0, 255, 0.2);
}
