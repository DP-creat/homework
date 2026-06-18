
document.addEventListener('DOMContentLoaded', () => {

  // Проверяем, что функция switchModule жива и доступна
  if (typeof window.switchModule === 'function') {
    window.switchModule('chat');
  }

  const panel = document.querySelector('.central-main');
  if (!panel || window.innerWidth <= 992) return;


  // Слушаем движение мыши по ВСЕМУ экрану, а не по прыгающей панели!
  window.addEventListener('mousemove', (e) => {
    const isMouseInsideSafeZone = (
      e.clientX > 50 &&
      e.clientX < window.innerWidth - 50 &&
      e.clientY > 50 &&
      e.clientY < window.innerHeight - 50
    );

    if (isMouseInsideSafeZone) {
      // (примерно последние 200px высоты, где и живет твой monolith-footer),
      // мы просто останавливаем пересчет наклона, чтобы не мешать ховерам кнопок!
      // if (e.clientY > window.innerHeight - 200) return;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const x = e.clientX - centerX;
      const y = e.clientY - centerY;

      // РАСЧЕТ ИСПРАВЛЕНИЯ ВИБРАЦИИ (Плавный демпфер у футера):
      // Если мышь заходит в нижние 200px экрана, мы плавно гасим силу наклона до 0,
      // вместо того чтобы грубо обрывать код через return!
      let footerDampener = 1;
      const footerZoneStart = window.innerHeight - 200;

      if (e.clientY > footerZoneStart) {
        // Вычисляем коэфициент затухания от 1 до 0 по мере приближения к самому низу
        footerDampener = 1 - ((e.clientY - footerZoneStart) / 200);
        if (footerDampener < 0) footerDampener = 0;
      }

      // Умножаем углы наклона на наш сглаживающий коэффициент footerDampener
      const degX = (-(y / centerY) * 0.3 + 1) * footerDampener;
      const degY = ((x / centerX) * 0.3) * footerDampener;

      // const degX = -(y / centerY) * 0.3 + 1;
      // const degY = (x / centerX) * 0.3;

      panel.style.transform = `rotateX(${degX}deg) rotateY(${degY}deg)`;
    }
  });

  // Когда мышка уходит — плавно возвращаем железный 1 градус
  panel.addEventListener('mouseleave', () => {
    panel.style.transform = 'rotateX(1deg) rotateY(0deg)';
  });

    // =================================================================
    // УНИВЕРСАЛЬНЫЙ ИНЕРЦИОННЫЙ ДВИЖОК СЛАЙДЕРОВ M.A.S.C. (SCROLL ENGINE)
    // =================================================================
    window.initMascDynamicSlider = (selector) => {
        const slider = document.querySelector(selector);
        if (!slider) return;

        let isDown = false;
        let startPos = 0;
        let scrollStart = 0;
        let velocity = 0;
        let animationFrameId = null;
        let lastEventPagePos = 0;
        let lastEventTime = 0;

        // Внутренний радар: проверяет, скроллится ли конкретный блок сейчас по вертикали
        // .status-dock при малом экране идет по Y, а .battery-group — по X. Этот флаг считает всё на лету!
        const checkIsVerticalNow = () => {
            const isShortScreen = window.innerHeight <= 490;
            if (selector === '.status-dock') return isShortScreen;
            if (selector === '.battery-group') return !isShortScreen;
            // Фолбэк по умолчанию: сверяем по преобладающему CSS-скроллу элемента
            return window.getComputedStyle(slider).overflowY === 'auto' || window.getComputedStyle(slider).overflowY === 'scroll';
        };

        const smoothScrollUpdate = () => {
            if (isDown) return;

            velocity *= 0.92; // Коэффициент упругого затухания
            const isVertical = checkIsVerticalNow();

            if (isVertical) {
                slider.scrollTop += velocity;
            } else {
                slider.scrollLeft += velocity;
            }

            if (Math.abs(velocity) > 0.5) {
                animationFrameId = requestAnimationFrame(smoothScrollUpdate);
            } else {
                // Инерция затихла — мягко защелкиваем CSS-магнит Snap обратно
                slider.style.scrollSnapType = isVertical ? 'y mandatory' : 'x mandatory';
            }
        };

        // Зажатие клика
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('grabbing');
            slider.style.scrollSnapType = 'none'; // Гасим магнит на время перетаскивания
            cancelAnimationFrame(animationFrameId);

            const isVertical = checkIsVerticalNow();
            startPos = isVertical ? (e.pageY - slider.offsetTop) : (e.pageX - slider.offsetLeft);
            scrollStart = isVertical ? slider.scrollTop : slider.scrollLeft;

            lastEventPagePos = isVertical ? e.pageY : e.pageX;
            lastEventTime = performance.now();
        });

        // Движение мыши
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();

            const isVertical = checkIsVerticalNow();
            const currentPos = isVertical ? (e.pageY - slider.offsetTop) : (e.pageX - slider.offsetLeft);
            const currentGlobalPos = isVertical ? e.pageY : e.pageX;

            // Коэффициент 1.3 дает идеальную тактильную отзывчивость (хват пальца/курсора)
            const walk = (currentPos - startPos) * 1.3;

            if (isVertical) {
                slider.scrollTop = scrollStart - walk;
            } else {
                slider.scrollLeft = scrollStart - walk;
            }

            const now = performance.now();
            const timeDiff = now - lastEventTime;
            if (timeDiff > 0) {
                velocity = -(currentGlobalPos - lastEventPagePos) / timeDiff * 15;
                lastEventPagePos = currentGlobalPos;
                lastEventTime = now;
            }
        });

        // Глобальный фикс прилипания: отпускание по всему окну браузера
        window.addEventListener('mouseup', () => {
            if (!isDown) return;
            isDown = false;
            slider.classList.remove('grabbing');
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(smoothScrollUpdate);
        });

        slider.addEventListener('mouseleave', () => {
            slider.classList.remove('grabbing');
        });

        // Мягкая обработка колесика мыши для любого направления
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            slider.style.scrollSnapType = 'none';

            velocity += e.deltaY * 0.15;

            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(smoothScrollUpdate);
        }, { passive: false });
    };

    // АВТО-ЗАПУСК СЛУЖБЫ НА ВСЕ СЛАЙДЕРЫ САЙТА
    window.initMascDynamicSlider('.status-dock');
    window.initMascDynamicSlider('.battery-group');



  // ДВИЖОК ИНТЕРАКТИВНОГО СЛАЙДЕРА ИКОНОК КЛИКЕРОВ (Drag-to-Scroll)
  const slider = document.querySelector('.status-dock');

  if (slider) {
    let isDown = false;
    let startX;
    let scrollLeft;

    // Переменные для расчета инерции (плавного доезда)
    let velocity = 0;
    let animationFrameId = null;
    let lastEventPageX = 0;
    let lastEventTime = 0;

    // Функция плавного затухания инерции и включения CSS-магнита
    const smoothScrollUpdate = () => {
      if (isDown) return;

      velocity *= 0.92;

      // ФИКС: Проверяем, вертикальный ли сейчас скролл
      const isVertical = window.innerHeight <= 490;
      if (isVertical) {
        slider.scrollTop += velocity; // Двигаем по вертикали
      } else {
        slider.scrollLeft += velocity; // Двигаем по горизонтали
      }

      if (Math.abs(velocity) > 0.5) {
        animationFrameId = requestAnimationFrame(smoothScrollUpdate);
      } else {
        // Возвращаем нужный тип магнита в зависимости от режима
        slider.style.scrollSnapType = isVertical ? 'y mandatory' : 'x mandatory';
      }
    };

    // Зажатие мышки
    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      slider.classList.add('grabbing');
      slider.style.scrollSnapType = 'none';
      cancelAnimationFrame(animationFrameId);

      // ФИКС: учитываем как X, так и Y координаты в зависимости от экрана
      const isVertical = window.innerHeight <= 490;
      startX = isVertical ? (e.pageY - slider.offsetTop) : (e.pageX - slider.offsetLeft);
      scrollLeft = isVertical ? slider.scrollTop : slider.scrollLeft;

      lastEventPageX = isVertical ? e.pageY : e.pageX;
      lastEventTime = performance.now();
    });

    // Перемещение мыши
    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();

      const isVertical = window.innerHeight <= 490;

      // Вычисляем текущую координату относительно направления скролла
      const currentPos = isVertical ? (e.pageY - slider.offsetTop) : (e.pageX - slider.offsetLeft);
      const lastPos = isVertical ? e.pageY : e.pageX;

      const walk = (currentPos - startX) * 1.2;

      if (isVertical) {
        slider.scrollTop = scrollLeft - walk;
      } else {
        slider.scrollLeft = scrollLeft - walk;
      }

      const now = performance.now();
      const timeDiff = now - lastEventTime;
      if (timeDiff > 0) {
        velocity = -(lastPos - lastEventPageX) / timeDiff * 15;
        lastEventPageX = lastPos;
        lastEventTime = now;
      }
    });

    
    // === КРИТИЧЕСКИЙ ФИКС ПРИЛИПАНИЯ ===
    // Слушаем отпускание кнопки мыши по ВСЕМУ экрану window!
    // Теперь, куда бы ты ни увёл руку, слайдер гарантированно разжмётся!
    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      slider.classList.remove('grabbing');

      // Запускаем плавный инерционный доезд кнопок
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(smoothScrollUpdate);
    });

    // Если мышь просто ушла за край слайдера БЕЗ отпускания кнопки — 
    // мы НЕ сбрасываем флаг свайпа, позволяя пользователю продолжить тащить ленту снаружи!
    slider.addEventListener('mouseleave', () => {
      // Убираем только визуальный класс кулака
      slider.classList.remove('grabbing');
    });

    // Мягкое колесико мыши с инерционным гашением прыжков
    // Мягкое колесико мыши
    slider.addEventListener('wheel', (e) => {
      e.preventDefault();
      slider.style.scrollSnapType = 'none';

      // Для вертикального слайдера колесико крутит стандартно, 
      // для горизонтального мы переводили Y в горизонтальную скорость.
      // Теперь это работает нативно в обоих режимах!
      velocity += e.deltaY * 0.15;

      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(smoothScrollUpdate);
    }, { passive: false });
  }


  
  // Слушатель Enter для чата Атом
  const atomInput = document.getElementById('atom-input');
  if (atomInput) {
    atomInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault(); // Запрещаем браузеру делать перенос строки
        window.sendMessage();   // Мгновенно активируем отправку пакета к Llama
      }
    });
  }

});
