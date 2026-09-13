// =======================================================
// ЯДРО НЕЙРОИНТЕРФЕЙСА «АТОМ» (БЕЗ СЕРВЕРА)
// =======================================================

// 1. Вставьте сюда ваш секретный токен, скопированный из OpenRouter (Keys)
window.ATOM_API_KEY = "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"; 

// 2. Официальный точный ID бесплатной модели Llama 3.2 3B Instruct
window.ATOM_MODEL = "openai/gpt-oss-120b:free"; 

// 3. Системная матрица промта ядра Атома (задает характер ИИ)
const ATOM_SYSTEM_PROMPT = `Ты — Ядро Атома, интеллектуальный, поддерживающий и глубокий ИИ-напарник. 
Твой стиль общения: человечный, теплый, адаптивный и объясняющий. Ты общаешься как мудрый, опытный друг-разработчик. 
Всегда разворачивай мысль, объясняй сложные вещи (код, биохимию, механику) простым и понятным языком. 
Не отвечай короткими сухими фразами в два слова. Используй легкий киберпанк-вайб, но на первое место ставь пользу, эмпатию и поддержку пользователя.`;

// ХРАНИЛИЩЕ ЖИВОЙ ПАМЯТИ ДИАЛОГА (Сюда будут записываться все ходы)
let atomChatHistory = [];

// Главная функция отправки сообщений
window.sendMessage = async () => {
    const atomInput = document.getElementById('atom-input');
    const messagesContainer = document.getElementById('atom-messages');
    
    if (!atomInput || !messagesContainer) return;
    
    const userText = atomInput.value.trim();
    if (!userText) return;

    // 1. Выводим сообщение пользователя на экран (в правый борт)
    messagesContainer.innerHTML += `<div class="msg user">${userText}</div>`;
    atomInput.value = ''; // Мгновенная зачистка поля ввода
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Скролл в пол

    // 2. ИНТЕГРАЦИЯ В ПАМЯТЬ: Записываем реплику пользователя в историю
    atomChatHistory.push({ role: "user", content: userText });

    // Ограничиваем память последними 20 репликами, чтобы запрос не раздувался вечно
    if (atomChatHistory.length > 20) {
        atomChatHistory.shift(); 
    }

    // 2. Создаем временную строку-индикатор анализа данных ИИ
    const loadingId = 'atom-loading-' + Date.now();
    messagesContainer.innerHTML += `<div class="msg system" id="${loadingId}">SYNCHRONIZING_DATA_STREAM...</div>`;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      // Соединяем системный промт характера и всю накопленную память диалога в один монолитный массив
        const fullMessagesPayload = [
            { role: "system", content: ATOM_SYSTEM_PROMPT },
            ...atomChatHistory
        ];

        // 3. ПРЯМОЙ СИНХРОННЫЙ FETCH-ЗАПРОС К КАНАЛУ OPENROUTER
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ATOM_API_KEY}`,
                "Content-Type": "application/json",
                /* Технические маркеры локального хоста (обязательны для OpenRouter) */
                "HTTP-Referer": "http://localhost:5501", 
                "X-Title": "Atom Cyber Interface"
            },
            body: JSON.stringify({
                model: window.ATOM_MODEL,
                messages: fullMessagesPayload, // ⚡ СКАРМЛИВАЕМ ИИ ПОЛНУЮ ИСТОРИЮ, А НЕ ОДНУ СТРОКУ!
                temperature: 0.65 
            })
        });

        const data = await response.json();
                // Намертво стираем строку ожидания данных
        document.getElementById(loadingId)?.remove();

        // УМНАЯ ПРОВЕРКА ПАКЕТА:
        if (data.choices && data.choices[0] && data.choices[0].message) {
            // Если всё ок — забираем текст из нулевого элемента массива
            const aiReply = data.choices[0].message.content;
            messagesContainer.innerHTML += `<div class="msg ai">${aiReply}</div>`;

            // 4. ИНТЕГРАЦИЯ В ПАМЯТЬ: Записываем ответ самого ИИ в историю, чтобы он помнил, что ответил!
            atomChatHistory.push({ role: "assistant", content: aiReply });
            
        } else if (data.error) {
            // Если OpenRouter вернул ошибку ключа или лимитов, выводим её на экран
            atomChatHistory.pop(); // Откатываем безответный вопрос из памяти
            console.error("OpenRouter отклонил запрос:", data.error);
            messagesContainer.innerHTML += `<div class="msg system">[SYSTEM_ERR]: ${data.error.message}</div>`;
            
        } else {
            // Любая непредвиденная структура JSON-пакета
            atomChatHistory.pop();
            console.error("Неизвестная структура JSON:", data);
            atomChatHistory.pop(); // Откатываем память при обрыве связи
            messagesContainer.innerHTML += `<div class="msg system">[ERR_DECODE]: Неверный формат ответа ядра.</div>`;
        }

    } catch (error) {
        console.error("Critical Network Error:", error);
        document.getElementById(loadingId)?.remove();
        atomChatHistory.pop(); // Откатываем память при обрыве связи
        messagesContainer.innerHTML += `<div class="msg system">[ERR_LINK_BROKEN]: Соединение со шлюзом OpenRouter потеряно.</div>`;
    }

    // Итоговая доводка вертикального скролла до нижнего упора
    messagesContainer.scrollTop = messagesContainer.scrollHeight; 
};

// АВТОМАТИЧЕСКИЙ ПЕРЕХВАТ КЛАВИШИ ENTER (Включаем полную автономность клавиатуры)
document.addEventListener('DOMContentLoaded', () => {
    const atomInput = document.getElementById('atom-input');
    if (atomInput) {
        atomInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Блокируем системный перенос строки
                window.sendMessage();   // Мгновенно шлем пакет
            }
        });
    }
});