import React, { useState, useEffect, useRef } from 'react';
import { QUOTES_DATA } from './quotesData'; // Файл с массивом переедет на 100% без изменений

export const CyberMarquee = () => {
  const [quoteHtml, setQuoteHtml] = useState({ title: '', body: '', footer: '' });
  const quoteBoxRef = useRef(null);
  
  // Храним переменные анимации в useRef, чтобы они не сбрасывались при рендерах
  const stateRef = useRef({
    lastQuoteIndex: -1,
    startTime: null,
    animationFrameId: null,
    isUserInteracting: false,
    minLifetime: 15000,
    scrollSpeed: 0.8
  });

  // Функция парсинга цитаты (Ваш текущий алгоритм один в один!)
  const generateRandomQuote = () => {
    let randomIndex;
    const { lastQuoteIndex } = stateRef.current;
    do {
      randomIndex = Math.floor(Math.random() * QUOTES_DATA.length);
    } while (randomIndex === lastQuoteIndex && QUOTES_DATA.length > 1);

    stateRef.current.lastQuoteIndex = randomIndex;
    const fullText = QUOTES_DATA[randomIndex].trim();

    const colonIndex = fullText.indexOf(':');
    if (colonIndex === -1) return { title: '', body: fullText, footer: '' };

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

    return { title, body, footer };
  };

  // Метод триггера новой цитаты
  const triggerNextQuote = () => {
    if (!quoteBoxRef.current) return;
    cancelAnimationFrame(stateRef.current.animationFrameId);
    
    // Вместо style.opacity работаем через анимации React или плавный стейт
    setTimeout(() => {
      setQuoteHtml(generateRandomQuote());
      quoteBoxRef.current.scrollLeft = 0;
      stateRef.current.startTime = Date.now();
      
      // Перезапуск анимации
      stateRef.current.animationFrameId = requestAnimationFrame(stepMarquee);
    }, 400);
  };

  // Главный цикл движения (Ваш текущий алгоритм stepMarquee один в один!)
  const stepMarquee = () => {
    const box = quoteBoxRef.current;
    const s = stateRef.current;
    if (!box || s.isUserInteracting) return;

    box.scrollLeft += s.scrollSpeed;
    const isAtEnd = box.scrollLeft >= (box.scrollWidth - box.clientWidth - 2);

    if (isAtEnd) {
      const timeElapsed = Date.now() - s.startTime;
      if (timeElapsed < s.minLifetime) {
        cancelAnimationFrame(s.animationFrameId);
        setTimeout(() => triggerNextQuote(), s.minLifetime - timeElapsed);
      } else {
        triggerNextQuote();
      }
      return;
    }
    s.animationFrameId = requestAnimationFrame(stepMarquee);
  };

  // Аналог DOMContentLoaded в React — запускается один раз при старте
  useEffect(() => {
    setQuoteHtml(generateRandomQuote());
    stateRef.current.startTime = Date.now();
    stateRef.current.animationFrameId = requestAnimationFrame(stepMarquee);

    // Железная зачистка памяти при уничтожении компонента (в ванили этого не хватало!)
    return () => cancelAnimationFrame(stateRef.current.animationFrameId);
  }, []);

  return (
    <div 
      className="quotes-box" 
      ref={quoteBoxRef}
      onTouchStart={() => { stateRef.current.isUserInteracting = true; }}
      onTouchEnd={() => {
        setTimeout(() => {
          stateRef.current.isUserInteracting = false;
          // Тут остальная ваша логика проверки touchend
          stateRef.current.animationFrameId = requestAnimationFrame(stepMarquee);
        }, 1500);
      }}
    >
      <p id="quote-text">
        <span className="quote-title">{quoteHtml.title}</span>{' '}
        <span class="quote-body">{quoteHtml.body}</span>
        {quoteHtml.footer && <span className="quote-footer"> {quoteHtml.footer}</span>}
        {/* Наш железный HTML-хвост для пустой зоны в конце */}
        <span style={{ display: 'inline-block', width: '100vw', height: '1px', pointerEvents: 'none' }}></span>
      </p>
    </div>
  );
};
