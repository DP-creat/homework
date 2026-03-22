document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('global-spark-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h;
    const resize = () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    let mouse = { x: w / 2, y: h / 2, targetCard: null };
    let sparks = [];
    let particles = [];

    class Sparkle {
        constructor(x, y, color) {
            this.x = x; this.y = y;
            this.size = Math.random() * 2.5 + 0.5; // Размер от мелкой пыли до искры
            this.vx = (Math.random() - 0.5) * 10;  // Скорость разлета (сделал мощнее)
            this.vy = (Math.random() - 0.5) * 10;
            this.life = 1.0;
            this.decay = Math.random() * 0.02 + 0.02; // Время жизни
            this.color = color;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.95; // Сопротивление воздуха (плавное замедление)
            this.vy *= 0.95;
            this.life -= this.decay;
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
            this.pairId = id % 2 === 0 ? id + 1 : id - 1; // ID напарника (0-1, 2-3 и т.д.)
            this.targetPartner = null; // Ссылка на того, с кем будем биться
            this.isAttacking = false;
            // ... твои остальные параметры (x, y, speed, color) ...
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.progress = Math.random();
            this.speed = 0.001 + Math.random() * 0.001;
            const colors = ['0, 230, 118', '255, 0, 128', '255, 215, 0', '0, 242, 255'];
            this.color = colors[id % colors.length];
        }
        update() {
            if (this.isAttacking && this.targetPartner) {
                // ЛЕТИМ ДРУГ В ДРУГА (без изменений)
                const targetX = (this.x + this.targetPartner.x) / 2;
                const targetY = (this.y + this.targetPartner.y) / 2;
                this.x += (targetX - this.x) * 0.25;
                this.y += (targetY - this.y) * 0.25;

                if (Math.hypot(this.x - this.targetPartner.x, this.y - this.targetPartner.y) < 10) {
                    for (let i = 0; i < 30; i++) {
                        particles.push(new Sparkle(this.x, this.y, this.color));
                    }
                    this.respawn();
                    this.targetPartner.respawn();
                    this.isAttacking = false;
                    this.targetPartner.isAttacking = false;
                    this.targetPartner = null;
                }
            } else {
                if (mouse.targetCard) {
                    // РЕЖИМ 1: БОК (без изменений)
                    const rect = mouse.targetCard.getBoundingClientRect();
                    const perimeter = (rect.width + rect.height) * 2;
                    this.progress += this.speed * (this.id % 2 === 0 ? 1 : -1);
                    let p = ((this.progress % 1) + 1) % 1 * perimeter;

                    if (p < rect.width) { this.targetX = rect.left + p; this.targetY = rect.top; }
                    else if (p < rect.width + rect.height) { this.targetX = rect.left + rect.width; this.targetY = rect.top + (p - rect.width); }
                    else if (p < rect.width * 2 + rect.height) { this.targetX = rect.left + rect.width - (p - rect.width - rect.height); this.targetY = rect.top + rect.height; }
                    else { this.targetX = rect.left; this.targetY = rect.top + rect.height - (p - rect.width * 2 - rect.height); }

                    // Двигаемся к бордеру
                    this.x += (this.targetX - this.x) * 0.08;
                    this.y += (this.targetY - this.y) * 0.08;

                } else {
                    // РЕЖИМ 2: АГРЕССИВНЫЙ РОЙ (МУХИ/ОСЫ)

                    // 1. Создаем хаотичное дрожание (jitter)
                    // Оно меняется очень быстро и дает эффект "жужжания"
                    const jitterX = (Math.random() - 0.5) * 15;
                    const jitterY = (Math.random() - 0.5) * 15;

                    // 2. Создаем широкое блуждание (drift)
                    // Чтобы они летали не в одной точке, а облаком
                    const time = Date.now() * 0.0005;
                    const noiseX = Math.sin(time + this.id * 30) * 90;
                    const noiseY = Math.cos(time * 0.90 + this.id * 20) * 90;

                    // Итоговая цель: мышь + кружение + резкое дрожание
                    this.targetX = mouse.x + noiseX + jitterX;
                    this.targetY = mouse.y + noiseY + jitterY;

                    // 3. ФИЗИКА НАСЕКОМОГО: 
                    // Вместо плавной доводки (0.08) делаем резкий "прыжок" (0.15)
                    // Это уберет эффект спирали и добавит эффект "перелетов"
                    this.x += (this.targetX - this.x) * 0.15;
                    this.y += (this.targetY - this.y) * 0.15;
                }
            }
        }

        // Вспомогательный метод (если его еще нет в классе)
        respawn() {
            const sides = [
                { x: Math.random() * w, y: -50 },
                { x: Math.random() * w, y: h + 50 },
                { x: -50, y: Math.random() * h },
                { x: w + 50, y: Math.random() * h }
            ];
            const s = sides[Math.floor(Math.random() * 4)];
            this.x = s.x; this.y = s.y;
        }

        draw() {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(${this.color}, 0.8)`;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Создаем 4? искры
    for (let i = 0; i < 7; i++) sparks.push(new Spark(i));

    const animate = () => {
        ctx.clearRect(0, 0, w, h);

        // Искры (теперь они могут быть новыми)
        sparks.forEach(s => {
            s.update();
            s.draw();
        });

        // ЧАСТИЦЫ ВЗРЫВА (Используем методы класса Sparkle для красоты)
        if (particles.length > 0) {
            particles = particles.filter(p => p.life > 0);
            particles.forEach(p => {
                // Если p — это объект класса Sparkle, вызываем его методы
                if (p instanceof Sparkle) {
                    p.update();
                    p.draw(ctx);
                } else {
                    // Старая простая логика (на случай, если остались простые объекты)
                    p.x += p.vx; p.y += p.vy; p.life -= 0.02;
                    ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
                    ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
                }
            });
        }

        requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        // Проверяем, наведены ли мы на карточку
        mouse.targetCard = e.target.closest('.card');
    });

    // ВЗРЫВ ПРИ КЛИКЕ
    window.addEventListener('mousedown', () => {
        let available = [...sparks.filter(s => !s.isAttacking)]; // Берем только свободных

        while (available.length > 1) {
            let s1 = available.pop();
            let closestIdx = -1;
            let minDist = Infinity;

            for (let i = 0; i < available.length; i++) {
                let d = Math.hypot(s1.x - available[i].x, s1.y - available[i].y);
                if (d < minDist) {
                    minDist = d;
                    closestIdx = i;
                }
            }

            if (closestIdx !== -1) {
                let s2 = available.splice(closestIdx, 1)[0];
                s1.targetPartner = s2;
                s2.targetPartner = s1;
                s1.isAttacking = true;
                s2.isAttacking = true;
            }
        }
    });

    animate();
});