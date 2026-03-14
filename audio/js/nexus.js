const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

let snowflakes = [];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function drawSnowflakeShape(x, y, size, angle, color, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        ctx.moveTo(0, 0);
        ctx.lineTo(0, size);
        ctx.rotate(Math.PI / 3);
    }
    ctx.stroke();
    ctx.restore();
}

class Snowflake {
    constructor() { this.reset(); this.y = Math.random() * canvas.height; }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 0.5 + 0.2;
        this.angle = Math.random() * Math.PI;
        this.spin = Math.random() * 0.02 - 0.01;
    }
    update() {
        this.y += this.speed;
        this.angle += this.spin;
        if (this.y > canvas.height) this.reset();
    }
    draw() {
        drawSnowflakeShape(this.x, this.y, this.size, this.angle, '#ffffff', 0.2);
    }
}

// Заполняем массив
for(let i=0; i<120; i++) snowflakes.push(new Snowflake());

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snowflakes.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(animate);
}
animate();

// Кинетический параллакс (меню следит за мышью)
document.addEventListener('mousemove', (e) => {
    const nav = document.querySelector('.void-nav');
    const x = (e.clientX - window.innerWidth / 2) / 50;
    const y = (e.clientY - window.innerHeight / 2) / 50;
    nav.style.transform = `translate(${x}px, ${y}px)`;
});
document.addEventListener('DOMContentLoaded', () => {
  const hintDisplay = document.getElementById('nexus-hint');
  const nodes = document.querySelectorAll('.nexus-node');
  const dayFill = document.getElementById('day-fill');

  // 1. Динамические подсказки
  nodes.forEach(node => {
    node.addEventListener('mouseenter', () => {
      hintDisplay.innerText = node.getAttribute('data-hint');
      hintDisplay.style.color = '#fff';
    });
    node.addEventListener('mouseleave', () => {
      hintDisplay.innerText = 'SYSTEM READY';
      hintDisplay.style.color = 'var(--sky-primary)';
    });
  });

  // 2. Часы и Ресурс дня
  setInterval(() => {
    const now = new Date();
    document.getElementById('digital-clock').innerText = now.toLocaleTimeString();

    // Обновляем прогресс-бар дня (7:00 - 23:00)
    const start = new Date().setHours(7, 0, 0, 0);
    const end = new Date().setHours(23, 0, 0, 0);
    const total = end - start;
    const current = now - start;
    const percent = Math.max(0, Math.min(100, (current / total) * 100));
    dayFill.style.width = (100 - percent) + '%';
  }, 1000);
});
document.addEventListener('mousemove', (e) => {
  const links = document.querySelectorAll('.zen-link');
  const x = (e.clientX - window.innerWidth / 2) / 50;
  const y = (e.clientY - window.innerHeight / 2) / 50;

  links.forEach((link, index) => {
    const speed = (index + 1) * 0.2;
    link.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
  });
});

// Обновление ресурса дня в углу
setInterval(() => {
  // Твоя функция getDayResource()
  document.getElementById('res-val').innerText = getDayResource();
}, 60000);
document.addEventListener('mousemove', (e) => {
  const nav = document.querySelector('.void-nav');
  const x = (e.clientX - window.innerWidth / 2) / 80;
  const y = (e.clientY - window.innerHeight / 2) / 80;

  // Плавное следование за мышкой с инерцией
  nav.style.transform = `translate(${x}px, ${y}px)`;
});

// Обновление ресурса дня
setInterval(() => {
  document.getElementById('day-res').innerText = getDayResource();
}, 60000);
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
let snowflakes = [];
let particles = [];
let sparkles = [];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// 1. Отрисовка геометрии (та самая снежинка)
function drawSnowflakeShape(x, y, size, angle, color, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, size);
        ctx.stroke();
        ctx.rotate(Math.PI / 3);
    }
    ctx.restore();
}

// 2. Класс снега (Фон)
class Snowflake {
    constructor() { this.reset(); this.y = Math.random() * canvas.height; }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 0.5 + 0.2;
        this.angle = Math.random() * Math.PI;
        this.spin = Math.random() * 0.02 - 0.01;
    }
    update() {
        this.y += this.speed;
        this.angle += this.spin;
        if (this.y > canvas.height) this.reset();
    }
    draw() {
        drawSnowflakeShape(this.x, this.y, this.size, this.angle, '#ffffff', 0.3);
    }
}

// Инициализация
for(let i=0; i<100; i++) snowflakes.push(new Snowflake());

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snowflakes.forEach(s => { s.update(); s.draw(); });
    // Тут можно добавить апдейт частиц салюта, если нужно
    requestAnimationFrame(animate);
}
animate();

// 3. Интерактив (Магнитное покачивание)
document.addEventListener('mousemove', (e) => {
    const nav = document.querySelector('.void-nav');
    const x = (e.clientX - window.innerWidth / 2) / 100;
    const y = (e.clientY - window.innerHeight / 2) / 100;
    nav.style.transform = `translate(${x}px, ${y}px)`;
});
