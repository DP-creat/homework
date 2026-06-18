// =======================================================
// МОДУЛЬ: НЕЙРОХИМИЧЕСКИЙ ОПРОСНИК MONOLITH (VANILLA JS)
// =======================================================

// 1. База вопросов по гормонам
const CHEMICAL_QUESTIONS = [
  { id: 1, biomarker: 'dopamine', text: 'Уровень мотивации и фокуса прямо сейчас?', answers: [{ t: 'Вялость / Прокрастинация', v: 1 }, { t: 'Норма / Ровно', v: 3 }, { t: 'Азарт / Готовы горы свернуть', v: 5 }] },
  { id: 2, biomarker: 'cortisol', text: 'Уровень внутреннего напряжения / стресса?', answers: [{ t: 'Абсолютное спокойствие', v: 5 }, { t: 'Легкий мандраж / Мысли скачут', v: 3 }, { t: 'Паника / Давление в груди', v: 1 }] },
  { id: 3, biomarker: 'serotonin', text: 'Общий фон настроения за последние часы?', answers: [{ t: 'Тоска / Раздражение', v: 1 }, { t: 'Нейтрально', v: 3 }, { t: 'Удовлетворение / Спокойная радость', v: 5 }] },
  { id: 4, biomarker: 'oxytocin', text: 'Чувство одиночества или изоляции?', answers: [{ t: 'Отрезан от всех / Одиноко', v: 1 }, { t: 'В норме', v: 3 }, { t: 'Чувствую поддержку / На связи с миром', v: 5 }] }
];

// Состояние опросника
let currentQuestionIndex = 0;
let chemicalScores = { dopamine: 0, cortisol: 0, serotonin: 0, oxytocin: 0 };

// 1. ФУНКЦИЯ СТАРТА ОПРОСА
window.startChemicalAssessment = () => {
  const wizardContainer = document.getElementById('survey-wizard');
  // Находим ваш контейнер чата, чтобы временно скрыть его
  const chatContainer = document.querySelector('.chat-inner-container');

  if (wizardContainer) wizardContainer.classList.add('active');
  if (chatContainer) chatContainer.style.display = 'none'; // Временно тушим чат

  currentQuestionIndex = 0;
  chemicalScores = { dopamine: 0, cortisol: 0, serotonin: 0, oxytocin: 0 };
  renderQuestion();
};


// Отрисовка текущего вопроса
function renderQuestion() {
  const wizardContainer = document.getElementById('survey-wizard'); // Контейнер опросника в HTML
  if (!wizardContainer) return;

  if (currentQuestionIndex >= CHEMICAL_QUESTIONS.length) {
    // Если вопросы кончились — запускаем генерацию патча-состояния
    renderChemicalProtocol(wizardContainer);
    return;
  }

  const q = CHEMICAL_QUESTIONS[currentQuestionIndex];

  wizardContainer.innerHTML = `
        <div class="chem-survey-box">
            <div class="chem-progress">АНАЛИЗ БИОМАРКЕРОВ: Шаг ${currentQuestionIndex + 1} из ${CHEMICAL_QUESTIONS.length}</div>
            <div class="chem-question neon-text">${q.text}</div>
            <div class="chem-answers-list">
                ${q.answers.map((ans, idx) => `
                    <button class="btn-tool footer-btn chem-ans-btn" onclick="selectChemicalAnswer('${q.biomarker}', ${ans.v})">
                        ${ans.t}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// Запись ответа и переход к следующему вопросу
window.selectChemicalAnswer = (biomarker, value) => {
  chemicalScores[biomarker] = value;
  currentQuestionIndex++;
  renderQuestion();
};

// ГЕНЕРАЦИЯ ФИНАЛЬНОГО РЕЗУЛЬТАТА И ПАТЧА ВОЗВРАТА В НАСТРОЕНИЕ
// ОБНОВЛЕННАЯ ФУНКЦИЯ: ТЕПЕРЬ ПОДСЧЕТ И КОРРЕКЦИЮ ДЕЛАЕТ НАСТОЯЩИЙ ИИ
function renderChemicalProtocol(container) {
  // 1. Отрендерим окно ожидания с исправленным неоновым таймером
  container.innerHTML = `
        <div class="oxytocin-patch-overlay">
            <div class="timer-title">ИНИЦИАЛИЗАЦИЯ НЕЙРО-АНАЛИЗА ЯДРА</div>
            <div class="timer-subtitle">Шлюз отправки биомаркеров активен...</div>
            <div class="timer-circle-wrap">
                <svg class="timer-svg" viewBox="0 0 100 100">
                    <circle class="timer-bg" cx="50" cy="50" r="45"></circle>
                    <circle class="timer-bar" cx="50" cy="50" r="45" id="js-timer-bar"></circle>
                </svg>
                <div class="timer-countdown" id="js-timer-count">3</div>
            </div>
            <div class="timer-status">ЯДРО АТОМА СЧИТЫВАЕТ КОНТУР ХИМИИ...</div>
        </div>
    `;

  let timeLeft = 3;
  const interval = setInterval(async () => {
    timeLeft--;
    const countEl = document.getElementById('js-timer-count');
    const barEl = document.getElementById('js-timer-bar');

    if (countEl) countEl.innerText = timeLeft;
    if (barEl) barEl.style.strokeDashoffset = ((3 - timeLeft) / 3) * 282.7;

    if (timeLeft <= 0) {
      clearInterval(interval);

      // ПЕРЕКЛЮЧАЕМ СТАТУС НА СТРАНИЦЕ НА ЗАГРУЗКУ ИЗ СЕТИ
      if (countEl) countEl.parentNode.innerHTML = `<div class="msg system">DECODING_AI_RESPONSE...</div>`;

      try {
        // 2. ФОРМИРУЕМ ПАКЕТ ДАННЫХ ДЛЯ ИИ
        const promptForAi = `Сделай биохимический анализ и выдай протокол коррекции. 
                Мои показатели (по шкале от 1 до 5):
                Дофамин (фокус/мотивация): ${chemicalScores.dopamine} из 5.
                Кортизол (уровень стресса): ${chemicalScores.cortisol} из 5.
                Серотонин (фон настроения): ${chemicalScores.serotonin} out of 5.
                Окситоцин (социальный контакт): ${chemicalScores.oxytocin} из 5.
                
                Напиши персональный лаконичный хакерский протокол "возврата в настроение". 
                Выдели 2 главных шага, основанных на просевших гормонах. Текст должен быть коротким (до 4 предложений), жестким и технологичным.`;

        // 3. ОТПРАВЛЯЕМ БИО-СРЕЗ НА СЕРВЕРА OPENROUTER
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            // Указываем точный путь к глобальному ключу из объекта window
            "Authorization": `Bearer ${window.ATOM_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5501",
            "X-Title": "Atom Chemical Core"
          },
          body: JSON.stringify({
            // Указываем путь к глобальной модели
            model: window.ATOM_MODEL,
            messages: [
              {
                role: "system",
                content: `Ты — эмпатичный, мудрый и поддерживающий ИИ-наставник. Твоя цель — расшифровать биохимический срез пользователя и помочь ему вернуться в идеальное рабочее настроение. 
        Общайся на понятном русском языке, тепло, но профессионально — как заботливый старший коллега. Избегай сухого инопланетного или чисто машинного сленга. 
        Разбери его показатели (дофамин, кортизол, серотонин, окситоцин), объясни простыми словами, почему он может чувствовать себя вялым или напряженным.
        Дай 2 конкретных, мягких, но эффективных бытовых совета по биохакингу (например, про дыхание, воду, орехи, разминку, отдых для глаз). Твой ответ должен быть вдохновляющим, развернутым, но емким (около 1-1.5 абзацев).`
              },
              { role: "user", content: promptForAi }
            ],
            temperature: 0.7
          })
        });

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
          const aiProtocol = data.choices[0].message.content;

          // 4. ВЫВОДИМ ЖИВОЙ ОТВЕТ НЕЙРОСЕТИ НА ЭКРАН!
          container.innerHTML = `
                        <div class="chem-results-box">
                            <h3 class="neon-text-magenta" style="margin-bottom:15px; letter-spacing:1px;">▲ ИИ-ПАТЧ КОРРЕКЦИИ ХИМИИ</h3>
                            <div class="chem-scores-summary">
                                DOP: ${chemicalScores.dopamine} | CRT: ${chemicalScores.cortisol} | SER: ${chemicalScores.serotonin} | OXY: ${chemicalScores.oxytocin}
                            </div>
                            <div class="chem-recommendations-list">
                                <p class="log-entry" style="text-align:left; font-size:13px; line-height:1.4; color:#fff;">${aiProtocol}</p>
                            </div>
                            <button class="lava-btn" style="margin-top:15px; width:100%;" onclick="closeChemicalAssessment()">ИНТЕГРИРОВАТЬ И СТАРТОВАТЬ ЧАТ</button>
                        </div>
                    `;

          // Дублируем этот отчет в ваше основное окно чата Атома, чтобы история не терялась!
          const atomMessages = document.getElementById('atom-messages');
          if (atomMessages) {
            atomMessages.innerHTML += `<div class="msg system">[SYSTEM]: Загружен био-срез пользователя.</div>`;
            atomMessages.innerHTML += `<div class="msg ai">[ЯДРО АТОМА]: Анализ завершен. Мой вердикт: ${aiProtocol}</div>`;
          }

        } else {
          throw new Error("Неверный ответ от API");
        }

      } catch (error) {
        console.error("Сбой ИИ при подсчете химии:", error);
        container.innerHTML = `
                    <div class="chem-results-box">
                        <div class="msg system">[ERR_AI_OFFLINE]: Ядро Атома не смогло расшифровать био-срез. Переход на аварийный локальный протокол.</div>
                        <button class="lava-btn" style="margin-top:15px; width:100%;" onclick="closeChemicalAssessment()">ОК</button>
                    </div>
                `;
      }
    }
  }, 1000);
}
// 2. ФУНКЦИЯ ФИНАЛА И ВОЗВРАТА В ЧАТ
window.closeChemicalAssessment = () => {
  const wizardContainer = document.getElementById('survey-wizard');
  const chatContainer = document.querySelector('.chat-inner-container');

  if (wizardContainer) {
    wizardContainer.classList.remove('active');
    // Возвращаем стартовую кнопку запуска
    wizardContainer.innerHTML = `<button class="lava-btn" onclick="startChemicalAssessment()">ЗАПУСТИТЬ СИНХРОНИЗАЦИЮ ХИМИИ</button>`;
  }

  if (chatContainer) {
    chatContainer.style.display = 'flex'; // Красиво возвращаем работающий чат ИИ
  }
};