// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ (доступны для p5.js и других скриптов)
let fft;
let starElements = []; 
let smoothR = new Array(1023).fill(0);
let lightning = [];

// 1. СОЗДАНИЕ ЗВЕЗД (выполняется один раз при загрузке страницы)
document.addEventListener('DOMContentLoaded', () => {
    const starsLayer = document.getElementById('stars-layer');
    if (!starsLayer) return;

    starsLayer.innerHTML = '';
    starElements = [];

    // --- ЛОГИКА КОЛИЧЕСТВА ЗВЕЗД ---
    let starCount = 150; // По умолчанию (десктоп)
    if (window.innerWidth < 480) {
        starCount = 50;  // Мобилки
    } else if (window.innerWidth < 1024) {
        starCount = 100; // Планшеты
    }

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        let size = Math.random() * 2 + 1;
        
        // Используем cssText — это продуктивнее
        star.style.cssText = `
            width: ${size}px; 
            height: ${size}px; 
            top: ${Math.random() * 100}vh; 
            left: ${Math.random() * 100}vw;
            position: absolute;
            background-color: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            pointer-events: none; 
        `;
        
        starsLayer.appendChild(star);
        starElements.push(star);
    }
});

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent('play-panel');
    
    // starElements = Array.from(document.querySelectorAll('.star'));
    fft = new p5.FFT(0.1, 512);
    colorMode(HSB, 360, 100, 100, 100);
    
    let ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
}

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent('play-panel');
    
    // starElements = Array.from(document.querySelectorAll('.star'));
    fft = new p5.FFT(0.1, 512);
    colorMode(HSB, 360, 100, 100, 100);
    
    let ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
}

function draw() {
  // 1. Сначала просим аудио-движок обновить свои цифры
  if (window.updateAudioUI) window.updateAudioUI();

  // 2. РИСОВАНИЕ
  background(1, 2, 8, 35); // Шлейф "Черной дыры"
  colorMode(HSB, 360, 100, 100, 100); 
  
  let spectrum = fft.analyze(); 
  let bass = fft.getEnergy("bass");
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  // --- БЛОК 3. УНИВЕРСАЛЬНЫЕ БРИЛЛИАНТОВЫЕ ЗВЕЗДЫ ---
  if (starElements.length > 0) {
    let trb = fft.getEnergy("treble");
    let bass = fft.getEnergy("bass");
    let mid = fft.getEnergy("mid");

    let globalHue = (frameCount * 0.4) % 360;

    starElements.forEach((star, i) => {
      let isGiant = star.classList.contains('star--giant');

      let h = (globalHue + i * 5) % 360;

      // На высоких частотах крупные звезды становятся кристально-белыми
      let saturation = isGiant ? map(trb, 100, 255, 60, 0) : 80;
      let brightness = isGiant ? map(trb, 100, 255, 80, 100) : 75;

      // Острое "бриллиантовое" мерцание
      let flicker = sin(frameCount * (isGiant ? 0.3 : 0.1) + i) * 0.4;
      let finalOp = constrain(0.4 + flicker + map(trb, 0, 255, 0, 0.5), 0.1, 1.0);

      // ДЕТАЛИЗАЦИЯ СВЕЧЕНИЯ
      let glowSize = isGiant ? map(trb, 120, 255, 5, 25) : map(trb, 150, 255, 0, 8);

      star.style.backgroundColor = `hsl(${h}, ${saturation}%, ${brightness}%)`;
      star.style.opacity = finalOp;

      // Для крупных звезд делаем "звездный" ореол через drop-shadow
      if (isGiant) {
        star.style.filter = `drop-shadow(0 0 ${glowSize / 2}px hsl(${h}, 100%, 70%))`;
        star.style.boxShadow = 'none'; // Отключаем обычную тень для формы ромба
      } else {
        star.style.boxShadow = `0 0 ${glowSize}px hsl(${h}, 100%, 50%)`;
        star.style.filter = 'none';
      }

      // Бас-бочка толкает крупные звезды сильнее (эффект приближения)
      let bassBoost = isGiant ? map(bass, 190, 255, 0, 1.5) : map(bass, 200, 255, 0, 0.3);
      let s = (isGiant ? 1.0 : 0.8) + bassBoost + map(mid, 0, 255, 0, 0.2);

      star.style.transform = `scale(${s})`;
    });
  }

  // --- ГРИБНИЦА 8.0 // RAINBOW_HYPER_FLOW ---
  translate(width / 2, height / 2);
  rotate(-11);

  const numRays = 1023;
  for (let i = 0; i < numRays; i++) {
    let specIdx = i;
    if (i > numRays / 2) specIdx = numRays - i;

    let angle = map(i, 0, numRays, 0, TWO_PI);
    let specVal = spectrum[specIdx];
    let hue = (map(i, 0, numRays, 0, 360) + frameCount * 0.5) % 360;

// 2. ДИНАМИКА ДЛИНЫ (Наслаиваем частоты)
    let targetR = 60 + (specVal * 1.6) + (bass * 0.2);
    // Плавность хода (Lerp)
    smoothR[i] = lerp(smoothR[i], targetR, 0.12);
// 3. АМПЛИТУДНОЕ "ТУДА-СЮДА" (Вибрация кончиков)
    let wave = sin(frameCount * 0.01 + i) * map(treble, 0, 255, 0, 15);
    let finalR = smoothR[i] + wave;

    let x = finalR * cos(angle);
    let y = finalR * sin(angle);

    // 4. ОТРИСОВКА (Градиентный эффект)
    // Рисуем основной луч
    stroke(hue, 90, 100, map(specVal, 0, 255, 40, 100));
    strokeWeight(map(specVal, 0, 255, 1, 4));
    line(cos(angle) * 46, sin(angle) * 110, x, y);
// 5. КИСЛОТНЫЕ ВСПЫШКИ (Нейроны)
    if (specVal > 130) {
      // Вспышка контрастного цвета
      let flashHue = (hue + 90) % 360;
      noStroke();
      fill(flashHue, 80, 100, 100);
      ellipse(x, y, map(specVal, 0, 255, 3, 10));
      fill(flashHue, 100, 100, 25);
      ellipse(x, y, map(specVal, 0, 255, 8, 25));
    }
  }

  // --- МОЛНИИ ---
  let ringR = (100 + bass / 5) / 2;
  noFill();
  stroke((frameCount) % 360, 80, 100, 30);
  strokeWeight(2);
  ellipse(0, 0, ringR * 2, ringR * 2);

  if (bass > 200 && frameCount % 2 === 0) {
    let randomAngle = random(TWO_PI);
    lightning.push(new Bolt(0, 0, ringR * cos(randomAngle), ringR * sin(randomAngle), (frameCount) % 360));
  }

  let shouldStrike = false;
  let synthHue = (frameCount) % 360;

  // КЛЮЧЕВАЯ ЗАМЕНА: window.playerData.song
  if (window.playerData.song && window.playerData.song.isPlaying()) {
    if (mid > 200 && frameCount % 4 === 0) {
      shouldStrike = true;
      synthHue = (map(treble, 0, 255, 0, 100) + frameCount) % 360;
    }
  } else {
    if (random(1) < 0.01) {
      shouldStrike = true;
      synthHue = (frameCount * 0.5) % 360;
    }
  }

  if (shouldStrike) {
    let angle = random(TWO_PI);
    lightning.push(new Bolt(0, 0, ringR * cos(angle), ringR * sin(angle), synthHue));
  }

  for (let i = lightning.length - 1; i >= 0; i--) {
    lightning[i].update();
    lightning[i].draw();
    if (lightning[i].life <= 0) lightning.splice(i, 1);
  }
}

// КЛАСС МОЛНИИ (Bolt)
class Bolt {
  constructor(startX, startY, endX, endY, hue) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.hue = hue;
    this.life = 100;
    this.points = [];

    // Больше изломов для "электрического" вида мелодии
    let steps = 6;
    for (let i = 0; i <= steps; i++) {
      let t = i / steps;
      let px = lerp(this.startX, this.endX, t);
      let py = lerp(this.startY, this.endY, t);
      if (i > 0 && i < steps) {
        // Микро-отклонения для эффекта тока
        px += random(-8, 8);
        py += random(-8, 8);
      }
      this.points.push({ x: px, y: py });
    }
  }

  update() {
    // Исчезает мгновенно (за 0.1 сек), как настоящий разряд
    this.life -= 20;
  }

  draw() {
    if (this.life <= 0) return;

    // --- ФИШКА 1: МНОГОСЛОЙНОЕ СВЕЧЕНИЕ ---
    // 1. Внешний мягкий ореол (Bloom)
    stroke(this.hue, 100, 100, this.life * 0.2);
    strokeWeight(4);
    this.renderLine();

    // 2. Основной цветной заряд
    stroke(this.hue, 80, 100, this.life);
    strokeWeight(1.5);
    this.renderLine();

    // 3. Белое ядро (Раскаленная нить)
    stroke(0, 0, 100, this.life);
    strokeWeight(0.5);
    this.renderLine();

    // --- ФИШКА 2: СЛУЧАЙНОЕ ОТВЕТВЛЕНИЕ ---
    if (this.life > 70 && random(1) < 0.2) {
      this.drawBranch();
    }
  }

  // Выносим отрисовку линии в отдельный метод для удобства
  renderLine() {
    noFill();
    beginShape();
    for (let p of this.points) vertex(p.x, p.y); // Коротко и ясно
    endShape();
  }

  drawBranch() {
    let midP = this.points[floor(this.points.length / 2)];
    stroke(this.hue, 100, 100, this.life * 0.6); // Ярче!
    strokeWeight(1);
    line(midP.x, midP.y, midP.x + random(-20, 20), midP.y + random(-20, 20)); // Размашистей!
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
