document.addEventListener('DOMContentLoaded', () => {

// SparkCanvas.js*****************************************************
  // *********************************************************************
  const canvas = document.getElementById('global-spark-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h;
  let lastTime = 0;

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    if (window.innerWidth > 992) {
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.targetCard = e.target.closest('.card');
    }
  });

  window.addEventListener('touchmove', (e) => {
    mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
    triggerExplosion();
  }, { passive: true });

  window.addEventListener('mousedown', triggerExplosion);

  for (let i = 0; i < 7; i++) sparks.push(new Spark(i));

  const animate = (timestamp) => {
    if (!isSystemActive) return;

    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    ctx.fillStyle = 'rgba(2, 4, 10, 0.2)';
    ctx.clearRect(0, 0, w, h);

    if (window.innerWidth <= 992) {
      const cards = document.querySelectorAll('.card');
      let closest = null; let minDistance = Infinity;
      const vCenter = window.innerHeight / 2;
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(vCenter - cardCenter);
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          if (distance < minDistance) { minDistance = distance; closest = card; }
        }
      });
      mouse.targetCard = closest;
    }

    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(dt); p.draw(ctx); });
    sparks.forEach(s => { s.update(dt); s.draw(); });

    requestAnimationFrame(animate);
  };

  // SparkLogic.js (Движок и события) *************************************
  // *********************************************************************************************
  let isSystemActive = true;
  let mouse = { x: w / 2, y: h / 2, targetCard: null };
  let sparks = [];
  let particles = [];

  const triggerExplosion = () => {
    let available = [...sparks.filter(s => !s.isAttacking)];
    while (available.length > 1) {
      let s1 = available.pop();
      let closestIdx = -1;
      let minDist = Infinity;
      for (let i = 0; i < available.length; i++) {
        let d = Math.hypot(s1.x - available[i].x, s1.y - available[i].y);
        if (d < minDist) { minDist = d; closestIdx = i; }
      }
      if (closestIdx !== -1) {
        let s2 = available.splice(closestIdx, 1)[0];
        s1.targetPartner = s2; s2.targetPartner = s1;
        s1.isAttacking = true; s2.isAttacking = true;
      }
    }
  };

  window.toggleSystemEffects = () => {
    isSystemActive = !isSystemActive;

    if (!isSystemActive) {
      ctx.clearRect(0, 0, w, h);
      console.log("SYSTEM_EFFECTS: TERMINATED");
    } else {
      lastTime = performance.now();
      animate(lastTime);
      console.log("SYSTEM_EFFECTS: INITIALIZED");
    }
  };
  // ********************************************************************************************
  // SparkModels.js*********************************************************
  // *****************************************************************************************
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
    constructor(id) {
      this.id = id;
      this.targetPartner = null;
      this.isAttacking = false;
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.progress = Math.random();
      this.speed = 0.0005 + Math.random() * 0.0005; // Сделали медленнее

      const rainbowNeon = [
        '255, 0, 85', '255, 135, 0', '255, 255, 0',
        '0, 255, 120', '0, 242, 255', '122, 53, 255', '255, 0, 255'
      ];
      this.color = rainbowNeon[id % rainbowNeon.length];
    }

    // Вставили (dt) в скобки
    update(dt) {
      const f = dt / 16.6;

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
      } else {
        if (mouse.targetCard) {
          const rect = mouse.targetCard.getBoundingClientRect();
          const perimeter = (rect.width + rect.height) * 2;
          this.progress += this.speed * (this.id % 2 === 0 ? 1 : -1) * f;
          let p = ((this.progress % 1) + 1) % 1 * perimeter;

          if (p < rect.width) { this.targetX = rect.left + p; this.targetY = rect.top; }
          else if (p < rect.width + rect.height) { this.targetX = rect.left + rect.width; this.targetY = rect.top + (p - rect.width); }
          else if (p < rect.width * 2 + rect.height) { this.targetX = rect.left + rect.width - (p - rect.width - rect.height); this.targetY = rect.top + rect.height; }
          else { this.targetX = rect.left; this.targetY = rect.top + rect.height - (p - rect.width * 2 - rect.height); }

          // Замедление здесь (0.03 вместо 0.08)
          this.x += (this.targetX - this.x) * 0.03 * f;
          this.y += (this.targetY - this.y) * 0.03 * f;
        } else {
          const time = Date.now() * 0.0005;
          const noiseX = Math.sin(time + this.id * 30) * 50;
          const noiseY = Math.cos(time * 0.90 + this.id * 20) * 50;

          this.targetX = mouse.x + noiseX;
          this.targetY = mouse.y + noiseY;

          // Замедление здесь (0.03 вместо 0.15)
          this.x += (this.targetX - this.x) * 0.03 * f;
          this.y += (this.targetY - this.y) * 0.03 * f;
        }
      }
    }

    respawn() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
    }

    draw() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(${this.color}, 0.8)`;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  // ******************************************************************************************
  requestAnimationFrame(animate);
  // *******************************************************************************************
  // 1. SparkModels.js (Классы)Коммент для React: «Чистая логика. Оставить как есть».Где будет лежать: В папке src/utils/ или src/services/.Что с ним делать: В Реакте мы просто будем импортировать эти классы в основной компонент. Они не меняются, потому что не знают про HTML.2. SparkLogic.js (Данные и Взрывы)Коммент для React: «Будущий State (состояние) или Ref».Где будет лежать: Логика функций (triggerExplosion) уедет в src/hooks/ или останется в utils.Что с ним делать:let mouse превратится в Ref (useRef), чтобы координаты обновлялись мгновенно без перерисовки всего экрана.isSystemActive станет полноценным State (useState), чтобы при клике на кнопку «Выкл» Реакт понимал, что нужно скрыть канвас.3. SparkCanvas.js (Интерфейс и Анимация)Коммент для React: «Это тело компонента (JSX)».Где будет лежать: Станет файлом GlobalSparks.jsx в папке src/components/.Что с ним делать:document.getElementById заменяем на canvasRef.window.addEventListener пихаем в useEffect.Критично: Код if (!canvas) return; в Реакте превратится в проверку внутри useEffect, так как Реакт должен сначала «отрендерить» тег, а потом мы сможем к нему прикоснуться.Функция animate станет внутренней функцией внутри useEffect.Краткая шпаргалка-инструкция (приклей к коду):Классы — это «Рабочие». Им всё равно, в каком здании (проекте) работать.Логика/Данные — это «Рация». Она связывает рабочих и говорит им, куда бежать.Канвас/Анимация — это «Здание». Оно дает рабочим место (холст) и свет (таймер).


});