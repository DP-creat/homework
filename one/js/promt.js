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
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.targetX = this.x;
            this.targetY = this.y;
            this.progress = Math.random();
            // --- СКОРОСТЬ (сделай числа меньше, чтобы замедлить) ---
            // this.speed = 0.015 + Math.random() * 0.01;
            this.speed = 0.001 + Math.random() * 0.001;
            const colors = ['0, 230, 118', '255, 0, 128', '255, 215, 0', '0, 242, 255'];
            this.color = colors[id % colors.length];
        }

        update() {
            if (mouse.targetCard) {
                // РЕЖИМ 1: БЕГАЕМ ПО БЛОКУ
                const rect = mouse.targetCard.getBoundingClientRect();
                const perimeter = (rect.width + rect.height) * 2;
                // Четные в одну сторону, нечетные в другую
                this.progress += this.speed * (this.id % 2 === 0 ? 1 : -1);

                let p = ((this.progress % 1) + 1) % 1 * perimeter;

                if (p < rect.width) {
                    this.targetX = rect.left + p;
                    this.targetY = rect.top;
                } else if (p < rect.width + rect.height) {
                    this.targetX = rect.left + rect.width;
                    this.targetY = rect.top + (p - rect.width);
                } else if (p < rect.width * 2 + rect.height) {
                    this.targetX = rect.left + rect.width - (p - rect.width - rect.height);
                    this.targetY = rect.top + rect.height;
                } else {
                    this.targetX = rect.left;
                    this.targetY = rect.top + rect.height - (p - rect.width * 2 - rect.height);
                }
            } else {
                // РЕЖИМ 2: В НАПРЯЖЕНИИ У МЫШКИ (ФИКС: используем this.id)
                const time = Date.now() * 0.003;
                const angle = (this.id * Math.PI * 2) / 16 + time;
                this.targetX = mouse.x + Math.cos(angle) * 25;
                this.targetY = mouse.y + Math.sin(angle) * 25;
            }

            // ПЛАВНЫЙ ПЕРЕЛЕТ (Interpolation)
            this.x += (this.targetX - this.x) * 0.07;
            this.y += (this.targetY - this.y) * 0.07;
        }

        draw() {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(${this.color}, 0.8)`;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Создаем 4? искры
    for (let i = 0; i < 16; i++) sparks.push(new Spark(i));

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
    // 1. Проходим по каждой живой искре
    sparks.forEach(s => {
        // Создаем сочный взрыв на месте искры
        for (let i = 0; i < 30; i++) {
            const colors = ['0, 230, 118', '255, 0, 128', '255, 215, 0', '0, 242, 255'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new Sparkle(s.x, s.y, randomColor));
        }
    });

    // 2. "Взрываем навсегда": Очищаем массив старых искр
    const count = sparks.length;
    sparks = [];

    // 3. Слетаются новые: Создаем столько же новых искр за границами экрана
    for (let i = 0; i < count; i++) {
        let newSpark = new Spark(i);
        
        // Выбираем случайную сторону появления (Top, Bottom, Left, Right)
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { newSpark.x = Math.random() * w; newSpark.y = -50; }      // Сверху
        else if (side === 1) { newSpark.x = Math.random() * w; newSpark.y = h + 50; } // Снизу
        else if (side === 2) { newSpark.x = -50; newSpark.y = Math.random() * h; }     // Слева
        else { newSpark.x = w + 50; newSpark.y = Math.random() * h; }                 // Справа
        
        sparks.push(newSpark);
    }
});

    animate();
});