const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let snowflakes = [];
let clickCount = 0;


function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();


// Создаем отдельный массив для искр, чтобы не мешать основным частицам
let sparkles = [];
// 1. Отрисовка кристаллической снежинки
function drawSnowflakeShape(x, y, size, angle, color, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1.2;
    // ctx.lineCap = 'round';
    // ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, size);
        ctx.moveTo(0, size * 0.5);
        ctx.lineTo(size * 0.3, size * 0.8);
        ctx.moveTo(0, size * 0.5);
        ctx.lineTo(-size * 0.3, size * 0.8);
        ctx.stroke();
        ctx.rotate(Math.PI / 3);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
}
function drawLaserSnowflake(x, y, size, angle, colorRGB, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = opacity;
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';

    const drawGeometry = (lineWidth, strokeColor) => {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, size);
            ctx.moveTo(0, size * 0.5);
            ctx.lineTo(size * 0.3, size * 0.8);
            ctx.moveTo(0, size * 0.5);
            ctx.lineTo(-size * 0.3, size * 0.8);
            ctx.stroke();
            ctx.rotate(Math.PI / 3);
        }
    };

    // 1. Неоновое свечение (аура)
    drawGeometry(3.5, `rgba(${colorRGB}, 0.3)`);
    // 2. Яркий лазер
    drawGeometry(1.5, `rgba(${colorRGB}, 0.8)`);
    // 3. Белое ядро (лазерный центр)
    drawGeometry(0.6, '#ffffff');

    ctx.restore();
}
class Spark {
    constructor(x, y, colorRGB) {
        this.x = x;
        this.y = y;
        this.colorRGB = colorRGB;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.03; // Чуть медленнее, чтобы рассмотреть форму
        this.size = Math.random() * 1.5 + 1;      // Совсем крошечные
        this.angle = Math.random() * Math.PI;    // Случайный поворот
    }
    update() {
        this.life -= this.decay;
        this.y += 0.2; // Искры-снежинки очень медленно оседают
    }
    draw() {
        if (this.life <= 0) return;
        // Используем твою функцию отрисовки снежинки
        drawSnowflakeShape(
            this.x,
            this.y,
            this.size,
            this.angle,
            `rgb(${this.colorRGB})`,
            this.life * 0.7 // Делаем их чуть прозрачнее основных
        );
    }
}

// 2. Фоновый снег
class Snowflake {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = Math.random() * 4 + 2;
        // БЫЛО: Math.random() * 0.5 + 0.3
        // СТАЛО: (медленнее и нежнее)
        this.speed = Math.random() * 0.25 + 0.15;

        this.angle = 0;
        this.spin = Math.random() * 0.01 - 0.005; // Вращение тоже можно замедлить
        this.opacity = 0.9;
    }
    update() {
        this.y += this.speed;
        this.angle += this.spin;
        if (this.y > canvas.height) this.reset();
    }
    draw() {
        ctx.save();

        // Эффект тени (text-shadow) для Canvas:
        // 1. Золотистое свечение
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';

        // 2. Второе (белое) свечение имитируем через отрисовку самой формы
        // Мы вызываем общую функцию отрисовки, передавая белый цвет 0.9 прозрачности
        drawSnowflakeShape(
            this.x,
            this.y,
            this.size,
            this.angle,
            `rgba(255, 255, 255, ${this.opacity})`,
            this.opacity
        );

        ctx.restore();
    }
}

// 3. Салют-снежинки с физикой взрыва
class FireworkSnowflake {
    constructor(x, y, colorRGB) {
        const t = Math.random() * Math.PI * 2;
        const heartScale = 2.0;
        const heartX = 16 * Math.pow(Math.sin(t), 3);
        const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

        this.x = x + heartX * heartScale;
        this.y = y + heartY * heartScale;
        this.colorRGB = colorRGB;

        const randomAngle = Math.random() * Math.PI * 2;
        const force = Math.random() * 12 + 6; 
        this.vx = Math.cos(randomAngle) * force;
        this.vy = Math.sin(randomAngle) * force;

        // ФИКСАЦИЯ РАЗМЕРА: Делаем их мелкими и изящными
        this.size = (Math.random() * 4 + 3) / 1.1; 
        this.life = 1.0;
        this.decay = 0.012; // Чуть дольше живут, чтобы насладиться ореолом
        this.angle = Math.random() * Math.PI;
    }

    update() {
        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.91; this.vy *= 0.91;
        this.vy += 0.08;
        this.life -= this.decay;
        this.angle += this.vx * 0.1;

        if (Math.random() > 0.82 && this.life > 0.2) {
            sparkles.push(new Spark(this.x, this.y, this.colorRGB));
        }
    }

    draw() {
        if (this.life <= 0) return;

        // ТОТ САМЫЙ ОРЕОЛ (Bloom)
        // Увеличиваем радиус градиента, чтобы он был виден
        const glowSize = this.size * 6; 
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        gradient.addColorStop(0, `rgba(${this.colorRGB}, ${this.life * 0.4})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Рисуем саму неоновую снежинку
        drawLaserSnowflake(this.x, this.y, this.size, this.angle, this.colorRGB, this.life * 0.9);
    }
}
// 4. Подготовка
for (let i = 0; i < 60; i++) snowflakes.push(new Snowflake());

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Сначала рисуем фоновый снег
    snowflakes.forEach(s => { s.update(); s.draw(); });

    // Рисуем искры (они должны быть под основными снежинками-салютами)
    sparkles = sparkles.filter(s => s.life > 0);
    sparkles.forEach(s => { s.update(); s.draw(); });

    // Рисуем основные снежинки салюта
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });

    requestAnimationFrame(animate);
}

animate();

// 5. Клик
window.addEventListener('click', (e) => {
    const colors = [
        '0, 255, 150',
        '0, 255, 255',
        '255, 0, 255',
        '255, 255, 0', '50, 255, 50', '255, 110, 0', '150, 0, 255', '255, 255, 255',
        '255, 50, 50'];
        
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Создаем взрыв из 60 снежинок
    for (let i = 0; i < 60; i++) {
        particles.push(new FireworkSnowflake(e.clientX, e.clientY, color));
    }

    clickCount++;
    const magicWorld = document.getElementById('magic-world');
    if (magicWorld) {
        // Убеждаемся, что старый fade-out (если был) удален, и включаем огонь
        magicWorld.classList.remove('magic-bg-fade');
        magicWorld.classList.add('fire-active');
        magicWorld.style.background = `radial-gradient(circle at bottom center, 
            rgba(${color}, 0.25) 0%,   
            rgba(1, 2, 8, 0.5) 40%,    
            rgb(1, 2, 8) 100%)`;
    }

    // 2. Активируем сияние (оно проявится поверх черного фона body)
    document.getElementById('main-container').classList.add('aurora-active');

    // 3. Логика подсказок и желаний
    const wishes = document.getElementById('wishes');
    const hint = document.querySelector('.interaction-hint');

    if (hint) hint.style.opacity = '0';
    if (clickCount === 2) wishes.classList.add('show');
    if (clickCount === 5) wishes.classList.remove('show');
});

// 6. Звезды
document.addEventListener('DOMContentLoaded', () => {
    const starsLayer = document.getElementById('stars-layer');
    if (!starsLayer) return;
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = star.style.height = Math.random() * 2 + 1 + 'px';
        star.style.top = Math.random() * 100 + 'vh';
        star.style.left = Math.random() * 100 + 'vw';
        star.style.setProperty('--duration', Math.random() * 2 + 1 + 's');
        star.style.animationDelay = Math.random() * 0.5 + 's';
        starsLayer.appendChild(star);
    }
});