document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.hub-card');

    cards.forEach(card => {
        const canvas = card.querySelector('.card-canvas');
        const ctx = canvas.getContext('2d');
        let cardParticles = [];
        let animationId;

        // Синхронизация размера холста с карточкой
        const resize = () => {
            canvas.width = card.offsetWidth;
            canvas.height = card.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Твой класс Spark (адаптированный)
        class CardSpark {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.life = 1.0;
                this.decay = Math.random() * 0.03 + 0.02;
                this.size = Math.random() * 2 + 1;
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.color = '255, 215, 0'; // Золото заката
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= this.decay;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
                ctx.fill();
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cardParticles = cardParticles.filter(p => p.life > 0);
            cardParticles.forEach(p => { p.update(); p.draw(); });
            animationId = requestAnimationFrame(animate);
        };

        // Активация при движении мыши по карточке
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Генерируем 3 искры за каждое движение
            for(let i=0; i<3; i++) {
                cardParticles.push(new CardSpark(x, y));
            }
        });

        card.addEventListener('mouseenter', () => animate());
        card.addEventListener('mouseleave', () => {
            cancelAnimationFrame(animationId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    });
});

// ------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.hub-card');

    cards.forEach(card => {
        const canvas = card.querySelector('.card-canvas');
        if (!canvas) return; // Предохранитель
        
        const ctx = canvas.getContext('2d');
        let cardParticles = [];
        let animationId = null;

        const resize = () => {
            canvas.width = card.offsetWidth;
            canvas.height = card.offsetHeight;
        };
        
        // Один листенер на карточку, а не на окно (лучше для производительности)
        const ro = new ResizeObserver(() => resize());
        ro.observe(card);

        class CardSpark {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.life = 1.0;
                this.decay = Math.random() * 0.05 + 0.03; // Чуть быстрее затухание для карточек
                this.size = Math.random() * 2 + 0.5;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 0.5) * 2;
                this.color = '0, 230, 118'; // Твой акцентный зеленый (--accent)
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= this.decay;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
                ctx.fill();
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (cardParticles.length > 0) {
                cardParticles = cardParticles.filter(p => p.life > 0);
                cardParticles.forEach(p => { p.update(); p.draw(); });
                animationId = requestAnimationFrame(animate);
            } else {
                // Если частиц нет, стопаем цикл для экономии CPU
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        };

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            for(let i=0; i<2; i++) {
                cardParticles.push(new CardSpark(x, y));
            }
            
            // Запускаем анимацию только если она еще не крутится
            if (!animationId) animate();
        });

        card.addEventListener('mouseleave', () => {
            // Мягкое затухание: не чистим сразу, даем искрам дожить
            // Но новые не создаются, и animate сам остановится
        });
    });
});












card.addEventListener('mouseenter', () => {
    cancelAnimationFrame(animationId); // Чистим старый цикл
    isExploded = false; 
    prog1 = 0; 
    prog2 = 0.5;
    particles = []; // Сброс старых искр
    card.classList.remove('active');
    animate();
});

const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width; const h = canvas.height;

    if (!isExploded) {
        prog1 += 0.015; 
        prog2 -= 0.025; 
        const p1 = getPathPos(prog1, w, h);
        const p2 = getPathPos(prog2, w, h);

        [p1, p2].forEach(p => {
            ctx.shadowBlur = 15; ctx.shadowColor = "#fff";
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
        });

        if (Math.hypot(p1.x - p2.x, p1.y - p2.y) < 15) {
            isExploded = true;
            card.classList.add('active'); 
            for(let i=0; i<40; i++) particles.push(new Sparkle(p1.x, p1.y, '255, 255, 255'));
        }
        animationId = requestAnimationFrame(animate);
    } else if (particles.length > 0) {
        // Дорисовываем взрыв и только потом стопаем
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => { p.update(); p.draw(); });
        animationId = requestAnimationFrame(animate);
    } else {
        cancelAnimationFrame(animationId);
    }
};