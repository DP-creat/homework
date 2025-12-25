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

// 1. Отрисовка кристаллической снежинки
function drawSnowflakeShape(x, y, size, angle, color, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1.2;
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
        // Начальная позиция формирует контур сердца
        const t = Math.random() * Math.PI * 2;
        const heartScale = 1.5; 
        const heartX = 16 * Math.pow(Math.sin(t), 3);
        const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

        this.x = x + heartX * heartScale;
        this.y = y + heartY * heartScale;
        this.colorRGB = colorRGB;

        // ЭНЕРГИЧНЫЙ ВЗРЫВ: Высокая начальная скорость
        const randomAngle = Math.random() * Math.PI * 2;
        const force = Math.random() * 12 + 5; // Быстрый старт
        this.vx = Math.cos(randomAngle) * force;
        this.vy = Math.sin(randomAngle) * force;

        this.size = Math.random() * 4 + 3;
        this.life = 1.0;
        this.decay = Math.random() * 0.015 + 0.01; // Постепенное затухание
        this.angle = Math.random() * Math.PI;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Физика фейерверка: сильное сопротивление воздуха и гравитация
        this.vx *= 0.92; // Быстрое замедление (эффект вспышки)
        this.vy *= 0.92;
        this.vy += 0.15; // Сила тяжести тянет вниз после взрыва

        this.life -= this.decay;
        this.angle += this.vx * 0.1;
        
    }

    draw() {
        if (this.life <= 0) return;
        
        // Мягкое мерцающее свечение (ореол затухания)
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 5);
        gradient.addColorStop(0, `rgba(${this.colorRGB}, ${this.life * 0.5})`);
        gradient.addColorStop(1, `rgba(${this.colorRGB}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
        ctx.fill();

        drawSnowflakeShape(this.x, this.y, this.size, this.angle, `rgb(${this.colorRGB})`, this.life);
    }
}

// 4. Подготовка
for (let i = 0; i < 60; i++) snowflakes.push(new Snowflake());

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    snowflakes.forEach(s => { s.update(); s.draw(); });
    
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });

    requestAnimationFrame(animate);
}
animate();

// 5. Клик
window.addEventListener('click', (e) => {
    const colors = ['255, 215, 0', '255, 255, 255', '0, 242, 255', '255, 77, 182', '180, 100, 255'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Создаем взрыв из 60 снежинок
    for (let i = 0; i < 60; i++) {
        particles.push(new FireworkSnowflake(e.clientX, e.clientY, color));
    }

    clickCount++;
    const magicWorld = document.getElementById('magic-world');
    if (magicWorld) {
        magicWorld.classList.add('magic-bg-fade');
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