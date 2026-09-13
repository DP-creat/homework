import { QUOTES_DATA } from './quotesData.js';

// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ АНИМАЦИИ
let lastQuoteIndex = -1;
let quoteTimeout = null;
let animationFrameId = null;
let isUserInteracting = false;
let startTime = null;

const minLifetime = 60000; // 15 секунд минимум на цитату
const scrollSpeed = 0.8;   // Скорость движения букв

function getRandomQuoteHtml() {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * QUOTES_DATA.length);
    } while (randomIndex === lastQuoteIndex && QUOTES_DATA.length > 1);

    lastQuoteIndex = randomIndex;
    
    const fullText = QUOTES_DATA[randomIndex].trim(); 

    const colonIndex = fullText.indexOf(':');
    if (colonIndex === -1) return fullText;

    let title = fullText.substring(0, colonIndex + 1);
    let restOfText = fullText.substring(colonIndex + 1).trim();

    const hasEndDot = restOfText.endsWith('.');
    const cleanTextToSearch = hasEndDot ? restOfText.slice(0, -1).trim() : restOfText;
    
    const lastDotIndex = cleanTextToSearch.lastIndexOf('.');

    let body = restOfText;
    let footer = "";

    if (lastDotIndex !== -1) {
        body = restOfText.substring(0, lastDotIndex + 1).trim();
        footer = restOfText.substring(lastDotIndex + 1).trim();
    }

    if (footer === '.' || footer === '') {
        body = restOfText; 
        footer = "";       
    }
    const emptySpaceTail = `<span style="display: inline-block; width: 100vw; height: 1px; pointer-events: none;"></span>`;

    return `<span class="quote-title">${title}</span><br><span class="quote-body">${body}</span>${footer ? `<br><span class="quote-footer">${footer}</span>` : ''}${emptySpaceTail}`;
}


// ГЛАВНЫЙ ЦИКЛ ДВИЖЕНИЯ СТРОКИ
function stepMarquee(quoteBox) {
    if (!isUserInteracting && quoteBox) {
        quoteBox.scrollLeft += scrollSpeed;

        // Финиш наступает только тогда, когда скролл дошел до абсолютного упора паддингов
        const isAtEnd = quoteBox.scrollLeft >= (quoteBox.scrollWidth - quoteBox.clientWidth - 30);

        if (isAtEnd) {
            const timeElapsed = Date.now() - startTime;

            if (timeElapsed < minLifetime) {
                cancelAnimationFrame(animationFrameId);
                const remainingTime = minLifetime - timeElapsed;
                quoteTimeout = setTimeout(() => triggerNextQuote(quoteBox), remainingTime);
                return;
            } else {
                cancelAnimationFrame(animationFrameId);
                triggerNextQuote(quoteBox);
                return;
            }
        }
    }
    animationFrameId = requestAnimationFrame(() => stepMarquee(quoteBox));
}

function triggerNextQuote(quoteBox) {
    const quoteElement = document.getElementById("quote-text");
    if (!quoteElement) return;

    quoteElement.style.opacity = 0;
    clearTimeout(quoteTimeout);
    cancelAnimationFrame(animationFrameId);

    quoteTimeout = setTimeout(() => {
        if (window.refreshQuoteContent) {
            window.refreshQuoteContent();
        }

        // Двойной кадр ожидания: гарантирует, что браузер применил новые паддинги к тексту
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (quoteBox) quoteBox.scrollLeft = 0;
                startTime = Date.now();

                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(() => stepMarquee(quoteBox));
            });
        });
    }, 400);
}

document.addEventListener('DOMContentLoaded', () => {
    const quoteElement = document.getElementById("quote-text");
    const quoteBox = document.querySelector(".quotes-box");

    if (!quoteElement || !quoteBox) return;

    // Функция обновления контента
    window.refreshQuoteContent = () => {
        quoteElement.style.opacity = 0;
        quoteElement.innerHTML = getRandomQuoteHtml();
        requestAnimationFrame(() => {
            quoteElement.style.opacity = 1;
        });
    };

    // НАМЕРТВО СВЯЗЫВАЕМ ТАЧ-СОБЫТИЯ
    quoteBox.addEventListener('touchstart', () => {
        isUserInteracting = true;
        clearTimeout(quoteTimeout);
    }, { passive: true });

    quoteBox.addEventListener('touchend', () => {
        // Как только палец оторвался от экрана, даем 1.5 секунды форы перед возобновлением авто-бега
        quoteTimeout = setTimeout(() => {
            isUserInteracting = false;

            // Замеряем точные координаты: где пользователь оставил строку пальцем
            const isAtEnd = quoteBox.scrollLeft >= (quoteBox.scrollWidth - quoteBox.clientWidth - 30);
            const timeElapsed = Date.now() - startTime;

            if (isAtEnd) {
                // Если пользователь осознанно бросил строку на самом финише в пустоте
                if (timeElapsed < minLifetime) {
                    // Очищаем старые хвосты и ждем остаток от 15 секунд стабильно на месте
                    clearTimeout(quoteTimeout);
                    const remainingTime = minLifetime - timeElapsed;
                    quoteTimeout = setTimeout(() => triggerNextQuote(quoteBox), remainingTime);
                } else {
                    // Если 15 секунд уже прошло — плавно переключаем
                    triggerNextQuote(quoteBox);
                }
            } else {
                // ЖЕЛЕЗНЫЙ ФИКС: Если пользователь отмотал строку НАЗАД (не на финише)
                // Намертво тушим любые взведённые таймеры переключения, которые могли сработать на финише
                clearTimeout(quoteTimeout);

                // Спокойно и плавно запускаем авто-движение дальше с текущего места
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(() => stepMarquee(quoteBox));
            }
        }, 1500);
    }, { passive: true });



    // ИНИЦИАЛИЗАЦИЯ И ОПРЕДЕЛЕНИЕ РЕЖИМА НА ОСНОВЕ РЕАЛЬНОГО CSS
    function initQuoteSystem() {
        clearTimeout(quoteTimeout);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        window.refreshQuoteContent();

        // ЖДЕМ ОДИН КАДР, чтобы CSS из медиазапросов точно применился к DOM-дереву
        requestAnimationFrame(() => {
            // Проверяем: если текст встал в nowrap — значит включился мобильный CSS
            const isMobileMarquee = window.getComputedStyle(quoteBox).whiteSpace === 'nowrap';

            if (isMobileMarquee) {
                startTime = Date.now();
                // Сбрасываем скролл строго в 0 и запускаем бег из пустоты справа
                quoteBox.scrollLeft = 0;
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(() => stepMarquee(quoteBox));
            } else {
                // На десктопе гоняем обычный статический цикл смены текста
                const handleDesktopLoop = () => {
                    quoteElement.style.opacity = 0;
                    quoteTimeout = setTimeout(() => {
                        window.refreshQuoteContent();
                        quoteTimeout = setTimeout(handleDesktopLoop, minLifetime);
                    }, 400);
                };
                quoteTimeout = setTimeout(handleDesktopLoop, minLifetime);
            }
        });
    }

    // Первый старт при загрузке
    initQuoteSystem();

    // Перезапуск при изменении размеров экрана (дебаунс)
    let resizeTimeout = null;

    window.addEventListener('resize', () => {
        // Мгновенно тушим старый анимационный цикл и таймеры при старте поворота,
        // чтобы текст не успел "убежать" или сломать позицию
        clearTimeout(quoteTimeout);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        // Сбрасываем скролл в ноль на время переворота, чтобы зафиксировать текст
        if (quoteBox) quoteBox.scrollLeft = 0;

        // Ждем 200мс, пока мобильный браузер полностью закончит анимацию поворота
        // и применит новые CSS-параметры к сетке
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Запускаем систему заново. Теперь getComputedStyle выдаст 100% верный результат!
            initQuoteSystem();
        }, 200); 
    });
});
