document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('global-spark-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let isSystemActive = localStorage.getItem('masc_sparks_active') !== 'false';
  let w, h;

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  let mouse = { x: w / 2, y: h / 2, targetbbbl: null };
  let sparks = [];
  let particles = [];
  let lastTime = 0;

  // КНОПКА ОТКЛЮЧЕНИЯ: Управляет только фоновым роем
  window.toggleSystemEffects = () => {
    isSystemActive = !isSystemActive;

    // Записываем строковое значение флага в localStorage
    localStorage.setItem('masc_sparks_active', isSystemActive);

    // Синхронизируем положение физического HTML-ползунка на экране
    const toggleInput = document.getElementById('masc-fx-toggle');
    if (toggleInput) {
      toggleInput.checked = isSystemActive;
    }


    if (!isSystemActive) {
      // Удаляем только летающие фоновые спарки, оставляя "вбитые" на часах
      sparks = sparks.filter(s => s.isStationaryTimeDot);
    } else {
      // Добираем рой обратно до 7 штук
      const currentBoundCount = sparks.filter(s => s.isStationaryTimeDot).length;
      for (let i = 0; i < 7; i++) {
        sparks.push(new Spark(currentBoundCount + i));
      }
      lastTime = performance.now();
      animate(lastTime);
    }

  };

  // СИНХРОНИЗАЦИЯ ПОЛЗУНКА ПРИ ЗАГРУЗКЕ
  setTimeout(() => {
    const toggleInput = document.getElementById('masc-fx-toggle');
    if (toggleInput) {
      // Передаем булевое значение активности (true/false) прямо в свойство checked
      toggleInput.checked = isSystemActive;
    }
  }, 50);


  class Sparkle {
    constructor(x, y, color) {
      this.x = x; this.y = y;
      this.size = Math.random() * 2 + 0.5;
      this.vx = (Math.random() - 0.5) * 5;
      this.vy = (Math.random() - 0.5) * 5;
      this.life = 1.0;
      this.decay = Math.random() * 0.02 + 0.01;
      this.color = color;
    }
    update(dt) {
      const f = dt / 16.6;
      this.x += this.vx * f;
      this.y += this.vy * f;
      this.vx *= Math.pow(0.95, f);
      this.vy *= Math.pow(0.95, f);
      this.life -= this.decay * f;
    }
    draw(ctx) {
      ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class Spark {
    constructor(id, fromOutside = false) {
      this.id = id;
      this.targetPartner = null;
      this.isAttacking = false;

      // Новые физические состояния связи с кликерами M.A.S.C.
      this.isBoundToTimeDot = false;   // В полете к точке
      this.isStationaryTimeDot = false; // Намертво вбит в точку
      this.targetDotId = null;
      this.timeDotX = 0;
      this.timeDotY = 0;

      const rainbowNeon = [
        '255, 0, 85', '255, 135, 0', '255, 255, 0',
        '0, 255, 120', '0, 242, 255', '122, 53, 255', '255, 0, 255'
      ];
      this.color = rainbowNeon[id % rainbowNeon.length];

      // Если искра создана при выключенной системе, спавним её строго за экраном
      if (fromOutside) {
        const sides = [
          { x: Math.random() * w, y: -20 },          // Сверху
          { x: Math.random() * w, y: h + 20 },       // Снизу
          { x: -20, y: Math.random() * h },          // Слева
          { x: w + 20, y: Math.random() * h }        // Справа
        ];
        const chosenSide = sides[Math.floor(Math.random() * sides.length)];
        this.x = chosenSide.x;
        this.y = chosenSide.y;
      } else {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
      }

      this.progress = Math.random();
      this.speed = 0.0005 + Math.random() * 0.0005;
    }

    update(dt) {
      const f = dt / 16.6;

      // 1. СОСТОЯНИЕ: ВБИТ В ТОЧКУ
      if (this.isStationaryTimeDot) {
        const targetEl = document.getElementById(this.targetDotId);

        if (!targetEl) {
          // Радар включает счетчик ожидания перерисовки (до 3 кадров)
          this.missingFrames = (this.missingFrames || 0) + 1;

          // Если точки нет на экране дольше 3 кадров — это честное удаление ушком!
          if (this.missingFrames > 3) {
            this.isStationaryTimeDot = false;
            sparks = sparks.filter(s => s !== this); // Стираем спарк-гвоздь начисто
          }
          return;
        }

        // Если точка нашлась — сбрасываем счетчик ожидания
        this.missingFrames = 0;

        // Держим спарк строго на физических координатах точки на экране
        const rect = targetEl.getBoundingClientRect();
        this.x = rect.left + rect.width / 2;
        this.y = rect.top + rect.height / 2;
        return;
      }

      // 2. СОСТОЯНИЕ: ЛЕТИТ НА ВБИВАНИЕ
      if (this.isBoundToTimeDot) {
        const targetEl = document.getElementById(this.targetDotId);
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          this.timeDotX = rect.left + rect.width / 2;
          this.timeDotY = rect.top + rect.height / 2;
        } else {
          this.respawn();
          return;
        }

        // Агрессивный полет по прямой к вычисленной точке на часах
        this.x += (this.timeDotX - this.x) * 0.18 * f;
        this.y += (this.timeDotY - this.y) * 0.18 * f;

        // Точка удара
        if (Math.hypot(this.x - this.timeDotX, this.y - this.timeDotY) < 4) {
          for (let i = 0; i < 30; i++) {
            particles.push(new Sparkle(this.x, this.y, this.color));
          }
          this.isBoundToTimeDot = false;
          this.isStationaryTimeDot = true;
          if (targetEl) targetEl.style.opacity = '1';
        }
        return;
      }

      // 3. СОСТОЯНИЕ: АТАКА КУРСОРНЫХ ЧАСТИЦ
      if (this.isAttacking && this.targetPartner) {
        const targetX = (this.x + this.targetPartner.x) / 2;
        const targetY = (this.y + this.targetPartner.y) / 2;
        this.x += (targetX - this.x) * 0.05 * f;
        this.y += (targetY - this.y) * 0.05 * f;
        if (Math.hypot(this.x - this.targetPartner.x, this.y - this.targetPartner.y) < 10) {
          for (let i = 0; i < 40; i++) {
            const mixColor = (i % 2 === 0) ? this.color : this.targetPartner.color;
            particles.push(new Sparkle(this.x, this.y, mixColor));
          }
          this.respawn();
          this.targetPartner.respawn();
          this.targetPartner.isAttacking = false;
          this.targetPartner.targetPartner = null;
          this.isAttacking = false;
          this.targetPartner = null;
        }
      }
      // 4. СОСТОЯНИЕ: ФОНОВЫЙ ОРБИТАЛЬНЫЙ РЕЖИМ
      else {
        if (mouse.targetbbbl) {
          const rect = mouse.targetbbbl.getBoundingClientRect();
          const perimeter = (rect.width + rect.height) * 2;
          this.progress += this.speed * (this.id % 2 === 0 ? 1 : -1) * f;
          let p = ((this.progress % 1) + 1) % 1 * perimeter;

          if (p < rect.width) { this.targetX = rect.left + p; this.targetY = rect.top; }
          else if (p < rect.width + rect.height) { this.targetX = rect.left + rect.width; this.targetY = rect.top + (p - rect.width); }
          else if (p < rect.width * 2 + rect.height) { this.targetX = rect.left + rect.width - (p - rect.width - rect.height); this.targetY = rect.top + rect.height; }
          else { this.targetX = rect.left; this.targetY = rect.top + rect.height - (p - rect.width * 2 - rect.height); }
          this.x += (this.targetX - this.x) * 0.03 * f;
          this.y += (this.targetY - this.y) * 0.03 * f;
        } else {
          const time = Date.now() * 0.0005;
          const noiseX = Math.sin(time + this.id * 30) * 50;
          const noiseY = Math.cos(time * 0.90 + this.id * 20) * 50;

          this.targetX = mouse.x + noiseX;
          this.targetY = mouse.y + noiseY;
          this.x += (this.targetX - this.x) * 0.03 * f;
          this.y += (this.targetY - this.y) * 0.03 * f;
        }
      }
    }

    respawn() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.isBoundToTimeDot = false;
      this.isStationaryTimeDot = false;
      this.targetDotId = null;
    }

    // ТВОЙ КАСТОМНЫЙ ВИЗУАЛЬНЫЙ СТИЛЬ: ДВА КОЛЬЦА БЕЗ СГЛАЖИВАНИЯ
    draw() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.imageSmoothingEnabled = false;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(${this.color}, 0.05)`;
      ctx.lineWidth = 0.5;
      ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(${this.color}, 0.4)`;
      ctx.lineWidth = 0.5;
      ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Инициализация стартовых 7 штук
  for (let i = 0; i < 7; i++) sparks.push(new Spark(i));

  // --- ГЛОБАЛЬНЫЙ ТРИГГЕР ЗАХВАТА И НАПРАВЛЕНИЯ M.A.S.C. ---
  window.launchSparkToDot = (dotId, screenX, screenY) => {

    // ЗАЩИТНЫЙ КЛАПАН: Если спарк для этой точки уже существует или летит — блокируем дублирование
    if (sparks.some(s => s.targetDotId === dotId)) return;
    // ЖЕСТКИЙ ПРЕДОХРАНИТЕЛЬ: Если координаты отсутствуют, равны 0 или не посчитались — 
    // полностью прерываем выполнение. Искры в левый угол больше не полетят никогда!
    if (!screenX || !screenY || (screenX === 0 && screenY === 0)) return;

    let targetSpark = null;

    // РЕЖИМ А: СИСТЕМА АКТИВНА
    if (isSystemActive) {
      let freeSparks = sparks.filter(s => !s.isBoundToTimeDot && !s.isStationaryTimeDot && !s.isAttacking);
      if (freeSparks.length > 0) {
        let luckySpark = freeSparks[0]; // Забираем конкретный свободный спарк

        targetSpark = new Spark(sparks.length, false);
        targetSpark.x = luckySpark.x;
        targetSpark.y = luckySpark.y;
        targetSpark.color = luckySpark.color;
        sparks.push(targetSpark);

        // Взрываем фоновый рой (только при первом вызове)
        if (freeSparks.length >= 6) {
          freeSparks.forEach(s => {
            for (let i = 0; i < 15; i++) {
              particles.push(new Sparkle(s.x, s.y, s.color));
            }
            s.respawn();
          });
        }
      }
    }

    // РЕЖИМ Б: СИСТЕМА ВЫКЛЮЧЕНА
    if (!targetSpark) {
      const nextId = sparks.length;
      targetSpark = new Spark(nextId, true); // Спавн за экраном
      sparks.push(targetSpark);
    }

    // Запись проверенных экранных координат
    targetSpark.targetDotId = dotId;
    targetSpark.timeDotX = screenX;
    targetSpark.timeDotY = screenY;
    targetSpark.targetX = screenX;
    targetSpark.targetY = screenY;
    targetSpark.isBoundToTimeDot = true; // Спарк пошел на взлет к реальной цели!
  };

  // ХОЛОДНЫЙ СТАРТ M.A.S.C.: Восстановление вбитых искр из памяти при перезагрузке страницы
  window.restoreMascMatrix = () => {
    // КРИТИЧЕСКИЙ СБРОС ПЕРЕПОЛНЕНИЯ: Оставляем в массиве ТОЛЬКО первые 7 базовых спарков
    if (sparks.length > 7) {
      sparks = sparks.slice(0, 7);
    }
    // Забираем текущую конфигурацию, чтобы знать имена всех созданных батареек
    const config = JSON.parse(localStorage.getItem('mcc_config')) || {};

    Object.keys(config).forEach(item => {
      // Подтягиваем сохраненные штампы времени для конкретного кликера
      const stamps = JSON.parse(localStorage.getItem(`stamps_${item}`)) || [];

      stamps.forEach((time, index) => {
        // Воссоздаем точные ID оригинальных точек
        const dotId = `dot-main-${item}-${index}-${time.replace(':', '-')}`;
        const targetEl = document.getElementById(dotId);

        // ПРОВЕРКА НА ДУБЛИКАТЫ: Проверяем, не создан ли уже спарк для этого ID
        const isAlreadyRestored = sparks.some(s => s.targetDotId === dotId);
        // Если HTML-точка уже отрендерилась и существует на экране
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          const nextId = sparks.length;

          // Создаем спарк-гвоздь сразу на физических координатах этой точки [stem-calculative-problem-solving]
          let nailSpark = new Spark(nextId, false);
          nailSpark.x = rect.left + rect.width / 2;
          nailSpark.y = rect.top + rect.height / 2;
          nailSpark.targetDotId = dotId;

          // Переводим его в режим вечного "вбитого" удержания на часах [stem-calculative-problem-solving]
          nailSpark.isStationaryTimeDot = true;
          nailSpark.isBoundToTimeDot = false;

          sparks.push(nailSpark);
        }
      });
    });
    console.log(`M.A.S.C. SAFE MATRIX: ${sparks.filter(s => !s.isStationaryTimeDot).length} FLOWING, ${sparks.filter(s => s.isStationaryTimeDot).length} BOUND`);
  };

  const triggerExplosion = () => {
    // КРИТИЧЕСКИЙ ЗАМОК: Если рой отключен, функция мгновенно прерывается
    if (!isSystemActive) return;

    let available = [...sparks.filter(s => !s.isAttacking && !s.isBoundToTimeDot && !s.isStationaryTimeDot)];
    while (available.length > 1) {
      let s1 = available.pop();
      let closestIdx = -1;
      let minDist = Infinity;
      for (let i = 0; i < available.length; i++) {
        let d = Math.hypot(s1.x - available[i].x, s1.y - available[i].y);
        if (d < minDist) { minDist = d; closestIdx = i; }
      }
      if (closestIdx !== -1) {
        let s2 = available.splice(closestIdx, 1)[0]; // Фикс: добавили, чтобы забирать объект, а не массив
        s1.targetPartner = s2; s2.targetPartner = s1;
        s1.isAttacking = true; s2.isAttacking = true;
      }
    }
  };
  window.addEventListener('mousemove', (e) => {
    if (window.innerWidth > 992 && isSystemActive) {
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.targetbbbl = e.target.closest('.bbbl');
    }
  });
  window.addEventListener('touchmove', (e) => {
    if (isSystemActive) {
      mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });
  window.addEventListener('touchstart', (e) => {
    if (!isSystemActive) return;
    mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
    triggerExplosion();
  }, { passive: true });
  window.addEventListener('mousedown', () => {
    if (isSystemActive) triggerExplosion();
  });
  const animate = (timestamp) => {
    // Заставляем цикл крутиться всегда, чтобы анимировать взрывы Sparkle и "вбитые" точки
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    ctx.clearRect(0, 0, w, h);
    if (isSystemActive && window.innerWidth <= 992) {
      const bbbls = document.querySelectorAll('.bbbl');
      let closest = null; let minDistance = Infinity;
      const vCenter = window.innerHeight / 2;
      bbbls.forEach(bbbl => {
        const rect = bbbl.getBoundingClientRect();
        const bbblCenter = rect.top + rect.height / 2; const distance = Math.abs(vCenter - bbblCenter);
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          if (distance < minDistance) { minDistance = distance; closest = bbbl; }
        }
      }); mouse.targetbbbl = closest;
    }
    window.removeSparkByDotId = (dotId) => {
      // Находим спарк, привязанный к удаленной точке, и полностью удаляем его из массива
      sparks = sparks.filter(s => s.targetDotId !== dotId);
    };
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(dt); p.draw(ctx); });
    // Рисуем ВСЕ спарки (и фоновые, и вбитые)
    // В самом низу функции animate на холсте:
    sparks.forEach(s => {
      s.update(dt);

      // Если искра уже вбита в точку времени
      if (s.isStationaryTimeDot) {
        const targetEl = document.getElementById(s.targetDotId);
        if (targetEl) {
          // Поднимаемся до родительского контейнера часов clock-
          const parentClock = targetEl.parentElement;
          // Рисуем вбитый спарк ТОЛЬКО если его часы сейчас активны (разбужены) [stem-calculative-problem-solving]
          if (parentClock && parentClock.classList.contains('active')) {
            s.draw();
          }
        }
      }
      // Если это обычный фоновый летящий спарк
      else {
        if (isSystemActive || s.isBoundToTimeDot) {
          s.draw();
        }
      }
    });
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);



});
