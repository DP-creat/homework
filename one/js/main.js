document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const canvas = card.querySelector('.card-canvas');
        const ctx = canvas.getContext('2d');

        // ВСЕ переменные объявляем СРАЗУ в начале цикла для каждой карточки
        let particles = [];
        let animationId = null;
        let isExploded = false;
        let prog1 = 0, prog2 = 0, prog3 = 0, prog4 = 0;

        const resize = () => {
            const rect = card.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        resize();
        window.addEventListener('resize', resize);

        class Sparkle {
            constructor(x, y, color) {
                this.x = x; this.y = y;
                this.size = Math.random() * 2 + 0.5;
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = (Math.random() - 0.5) * 6;
                this.life = 1.0;
                this.color = color;
            }
            update() { this.x += this.vx; this.y += this.vy; this.life -= 0.035; }
            draw() {
                ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
            }
        }

        const drawLaserSpark = (x, y, size, colorRGB, opacity) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.globalAlpha = opacity;
            ctx.globalCompositeOperation = 'lighter';
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(${colorRGB}, 0.8)`;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(${colorRGB}, 0.5)`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        };

        const getPathPos = (progress, width, height) => {
            const perimeter = (width + height) * 2;
            let p = ((progress % 1) + 1) % 1 * perimeter;
            if (p < width) return { x: p, y: 0 };
            if (p < width + height) return { x: width, y: p - width };
            if (p < width * 2 + height) return { x: width - (p - width - height), y: height };
            return { x: 0, y: height - (p - width * 2 - height) };
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const w = canvas.width;
            const h = canvas.height;

            if (!isExploded) {
                prog1 += 0.025; prog2 -= 0.025;
                prog3 += 0.025; prog4 -= 0.025;

                const p1 = getPathPos(prog1, w, h);
                const p2 = getPathPos(prog2, w, h);
                const p3 = getPathPos(prog3, w, h);
                const p4 = getPathPos(prog4, w, h);

                drawLaserSpark(p1.x, p1.y, 4, '0, 230, 118', 1);
                drawLaserSpark(p2.x, p2.y, 4, '255, 0, 128', 1);
                drawLaserSpark(p3.x, p3.y, 4, '255, 215, 0', 1);
                drawLaserSpark(p4.x, p4.y, 4, '0, 242, 255', 1);

                const distTop = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                const distBottom = Math.hypot(p3.x - p4.x, p3.y - p4.y);

                if (distTop < 15 || distBottom < 15) {
                    isExploded = true;
                    card.classList.add('active');
                    [p1, p3].forEach(point => {
                        for (let i = 0; i < 40; i++) {
                            const colors = ['0, 230, 118', '255, 0, 128', '255, 215, 0', '0, 242, 255'];
                            particles.push(new Sparkle(point.x, point.y, colors[Math.floor(Math.random() * 4)]));
                        }
                    });
                }
                animationId = requestAnimationFrame(animate);
            } else if (particles.length > 0) {
                particles = particles.filter(p => p.life > 0);
                particles.forEach(p => { p.update(); p.draw(); });
                animationId = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        };

        card.addEventListener('mouseenter', () => {
            if (animationId) cancelAnimationFrame(animationId);
            resize();
            isExploded = false;
            particles = [];

            // ГЕНЕРАЦИЯ СЛУЧАЙНОГО СТАРТА
            // Math.random() дает число от 0 до 1
            const offsetTop = Math.random();    // Рандом для верхней пары
            const offsetBottom = Math.random(); // Рандом для нижней пары

            prog1 = offsetTop;          // Искра 1
            prog2 = offsetTop + 0.5;    // Искра 2 (напротив первой)

            prog3 = offsetBottom;       // Искра 3
            prog4 = offsetBottom + 0.5; // Искра 4 (напротив третьей)

            card.classList.remove('active');
            animate();
        });

        card.addEventListener('mouseleave', () => {
            if (!isExploded) {
                cancelAnimationFrame(animationId);
                animationId = null;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            card.classList.remove('active');
        });
    });
});