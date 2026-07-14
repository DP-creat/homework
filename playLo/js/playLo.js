// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ (доступны для p5.js и других скриптов)
let fft;
let starElements = [];
let smoothR = new Array(1023).fill(0);
let lightning = [];
let smoothRingR = 40;
let heartImpacts = [];

// --- НАСТРОЙКИ ДЛЯ DRUM & BASS УДАРНЫХ ---
// ПЕРЕМЕННЫЕ ДЛЯ КОНТРОЛЯ DRUM & BASS РИТМА
let prevKickLevel = 0;
let prevSnareLevel = 0;
let prevHatLevel = 0;

// Флаги защиты от залипания (чтобы молния не дублировалась в соседний кадр одного удара)
let kickFrameBlock = false;
let snareFrameBlock = false;
let hatFrameBlock = false;

const flashPointsCache = Array.from({ length: 150 }, () => ({ x: 0, y: 0 }));

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

    let globalHue = (frameCount * 0.4) % 360;

    starElements.forEach((star, i) => {
      let isGiant = star.classList.contains('star--giant');

      let h = (globalHue + i * 5) % 360;

      // На высоких частотах крупные звезды становятся кристально-белыми
      let saturation = isGiant ? map(treble, 100, 255, 60, 0) : 80;
      let brightness = isGiant ? map(treble, 100, 255, 80, 100) : 75;

      // Острое "бриллиантовое" мерцание
      let flicker = sin(frameCount * (isGiant ? 0.3 : 0.1) + i) * 0.4;
      let finalOp = constrain(0.4 + flicker + map(treble, 0, 255, 0, 0.5), 0.1, 1.0);

      // ДЕТАЛИЗАЦИЯ СВЕЧЕНИЯ
      let glowSize = isGiant ? map(treble, 120, 255, 5, 25) : map(treble, 150, 255, 0, 8);

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
  let offsetY = height * 0.15;
  translate(width / 2, (height / 2) - offsetY);
  rotate(-11);

  const numRays = 1023;
  for (let i = 0; i < numRays; i++) {
    let specIdx = i;
    if (i > floor(numRays / 2)) specIdx = (numRays - 1) - i;

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
    stroke(hue, 90, 100, 1);
    strokeWeight(map(specVal, 0, 255, 1, 4));

    // line(cos(angle) * 46, sin(angle) * 110, x, y);

    let startX = finalR * 0.95 * (cos(angle) * 46);
    let topY = finalR * 0.95 * (sin(angle) * 110);

    line(startX, topY, x, y);

    // 5. КИСЛОТНЫЕ ВСПЫШКИ (Нейроны)
    if (specVal > 120) {
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
  let ringR = 48 + (bass * 0.08);
  rotate(11);

  // Оставляем сглаживание в памяти для других модулей, если нужно
  smoothRingR = lerp(smoothRingR, ringR, 0.25);

  // Обновляем время жизни вспышек в памяти (каждый кадр они затухают)
  for (let i = heartImpacts.length - 1; i >= 0; i--) {
    // скорость затухания, чтобы ты успел увидеть расползание    
    heartImpacts[i].life -= 0.3;
    // Коэффициент отвечает за скорость расползания полоски. 
    heartImpacts[i].size += 0.1;
    if (heartImpacts[i].life <= 0) heartImpacts.splice(i, 1);
  }

  noFill();
  stroke(frameCount % 360, 80, 100, 1);
  strokeWeight(1);

  // Рисуем контур сердца через математическую формулу Кардиоиды
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.05) {
    let hx = 16 * Math.pow(Math.sin(a), 3);
    let hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    vertex(hx * (ringR / 15), hy * (ringR / 15));
  }
  endShape(CLOSE); 

  // --- 2. ЛОКАЛЬНАЯ НЕОНОВАЯ ПОДСТВЕТКА (ОТДЕЛЬНЫЙ СЛОЙ) ---
  // Рисуем вспышки только там, куда РЕАЛЬНО прилетела молния
  heartImpacts.forEach(impact => {
    let flashHue = (frameCount) % 360; 
    let pIdx = 0;

    // Шаг 1: Заполняем глобальный кэш без создания новых массивов
    for (let da = -impact.size; da <= impact.size; da += 0.02) {
      if (pIdx >= 150) break; // Защита от переполнения кэша
      
      let flashAngle = impact.angle + da;
      let hx = 16 * pow(sin(flashAngle), 3) * (ringR / 15);
      
      // ТУТ ВСЁ ИСПРАВЛЕНО: строго flashAngle во всех косинусах
      let hy = -(13 * Math.cos(flashAngle) - 5 * Math.cos(2 * flashAngle) - 2 * Math.cos(3 * flashAngle) - Math.cos(4 * flashAngle)) * (ringR / 15);
      
      flashPointsCache[pIdx].x = hx;
      flashPointsCache[pIdx].y = hy;
      pIdx++;
    }

    noFill(); 
    
    // СЛОЙ 1: Внешнее размытое неоновое свечение (Bloom)
    stroke(flashHue, 90, 100, 40 * impact.life); 
    strokeWeight(8); 
    beginShape(); for (let j = 0; j < pIdx; j++) vertex(flashPointsCache[j].x, flashPointsCache[j].y); endShape();

    // СЛОЙ 2: Основной насыщенный заряд
    stroke(flashHue, 70, 100, 90 * impact.life); 
    strokeWeight(4); 
    beginShape(); for (let j = 0; j < pIdx; j++) vertex(flashPointsCache[j].x, flashPointsCache[j].y); endShape();

    // СЛОЙ 3: Раскаленное белое ядро вспышки
    stroke(0, 0, 100, 100 * impact.life); 
    strokeWeight(1.5); 
    beginShape(); for (let j = 0; j < pIdx; j++) vertex(flashPointsCache[j].x, flashPointsCache[j].y); endShape();
  });


  
  // 1. Изолируем ТРИ зоны ударных: Бочка, Снейр, Тарелк 
  let strikeType = "";
  let kickLevel = fft.getEnergy(30, 120);
  let snareLevel = fft.getEnergy(1000, 3200);
  let hatLevel = fft.getEnergy(5000, 12000);

  // 2. Вычисляем мгновенную скорость взлёта звука (атаку)
  let kickAttack = kickLevel - prevKickLevel;
  let snareAttack = snareLevel - prevSnareLevel;
  let hatAttack = hatLevel - prevHatLevel;

  // Обновляем память для следующего кадра (мгновенно)
  prevKickLevel = kickLevel;
  prevSnareLevel = snareLevel;
  prevHatLevel = hatLevel;

  let triggerStrike = false;

  // ЦВЕТ ПОД СИНТЕЗАТОР: Динамический перелив от мелодии
  let dnbHue = (frameCount * 0.4 + map(treble, 0, 255, 0, 200)) % 360;

  // 3. НАСТРОЙКА ЧУВСТВИТЕЛЬНОСТИ К АТАКЕ (ЧЕМ МЕНЬШЕ ЧИСЛО — ТЕМ ЧАЩЕ МОЛНИИ)
  const KICK_ATTACK_THRES = 8; // Снизили, чтобы бочка пробивала любой микс
  const SNARE_ATTACK_THRES = 10;
  const HAT_ATTACK_THRES = 13;  // Порог для хлестких тарелок

  // 4. ПОКАДРОВАЯ ЛОГИКА ТРИГГЕРОВ (Скорость реакции: 16 мс)

  // Проверка БОЧКИ
  if (kickAttack > KICK_ATTACK_THRES && kickLevel > 60) {
    if (!kickFrameBlock) {
      triggerStrike = true;
      kickFrameBlock = true; // Заблокировали дублирование в следующем кадре
    }
  } else {
    kickFrameBlock = false; // Разблокировали, как только волна пошла вниз
  }

  // Проверка СНЕЙРА
  if (snareAttack > SNARE_ATTACK_THRES && snareLevel > 50) {
    if (!snareFrameBlock) {
      triggerStrike = true;
      snareFrameBlock = true;
    }
  } else {
    snareFrameBlock = false;
  }

  // Проверка ТАРЕЛОК
  if (hatAttack > HAT_ATTACK_THRES && hatLevel > 40) {
    if (!hatFrameBlock) {
      triggerStrike = true;
      hatFrameBlock = true;
    }
  } else {
    hatFrameBlock = false;
  }

  // 5. МГНОВЕННЫЙ СПАВН (Удар в уши = Молния на экране)
  if (triggerStrike) {
    let angle = random(TWO_PI);
    let hx = 16 * Math.pow(Math.sin(angle), 3) * (ringR / 15);
    let hy = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) * (ringR / 15);

    spawnBolt(0, 0, hx, hy, dnbHue);
    heartImpacts.push({ angle: angle, life: 1.0, size: 0.02 });
  }


  updateAndDrawLightnings();
}

// КЛАСС МОЛНИИ (Bolt)
// 1. Создаем фиксированный пул молний при загрузке (память выделяется ОДИН раз)
// --- АБСОЛЮТНЫЙ ПУЛ ДЛЯ МОЛНИЙ (ПАМЯТЬ ВЫДЕЛЕНА ОДИН РАЗ) ---
const MAX_LIGHTNING = 30;
const MAX_POINTS_PER_BOLT = 10; // Фиксируем максимум точек в изломах молнии

const lightningPool = Array.from({ length: MAX_LIGHTNING }, () => {
  const points = [];
  for (let i = 0; i < MAX_POINTS_PER_BOLT; i++) {
    points.push({ x: 0, y: 0 }); // Пустые заготовки
  }
  return {
    active: false,
    hue: 0,
    life: 0,
    pointsCount: 0, // Храним реальное количество заполненных точек
    points: points
  };
});
// Кэш для отрисовки вспышек сердца (выделен один раз, чтобы не создавать массивы в draw)



// 2. Функция активации молнии из пула вместо "new Bolt"
function spawnBolt(startX, startY, endX, endY, hue) {
  let bolt = null;

  // Быстрый линейный поиск без создания стрелочных функций
  for (let i = 0; i < MAX_LIGHTNING; i++) {
    if (!lightningPool[i].active) {
      bolt = lightningPool[i];
      break;
    }
  }
  if (!bolt) return;

  bolt.active = true;
  bolt.hue = hue;
  bolt.life = 100;

  let steps = 6;
  bolt.pointsCount = steps + 1; // Записываем точное количество точек

  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let px = lerp(startX, endX, t);
    let py = lerp(startY, endY, t);

    if (i > 0 && i < steps) {
      px += random(-8, 8);
      py += random(-8, 8);
    }

    // Перезаписываем существующие объекты в пуле, вместо .push()
    if (!bolt.points[i]) bolt.points[i] = { x: 0, y: 0 };
    bolt.points[i].x = px;
    bolt.points[i].y = py;
  }
}

// Оптимизированный цикл обновления и отрисовки
function updateAndDrawLightnings() {
  noFill();

  for (let i = 0; i < MAX_LIGHTNING; i++) {
    let b = lightningPool[i];
    if (!b.active) continue;

    b.life -= 20;
    if (b.life <= 0) {
      b.active = false;
      continue;
    }

    let pCount = b.pointsCount;

    // ОПТИМИЗАЦИЯ: Один проход по точкам вместо трех
    // Рисуем Ореол (Мягкое свечение)
    stroke(b.hue, 100, 100, b.life * 0.2);
    strokeWeight(4);
    beginShape();
    for (let j = 0; j < pCount; j++) {
      vertex(b.points[j].x, b.points[j].y);
    }
    endShape();

    // Рисуем Основной цветной заряд
    stroke(b.hue, 80, 100, b.life);
    strokeWeight(1.5);
    beginShape();
    for (let j = 0; j < pCount; j++) {
      vertex(b.points[j].x, b.points[j].y);
    }
    endShape();

    // Рисуем Белое ядро (Раскаленная нить)
    stroke(0, 0, 100, b.life);
    strokeWeight(0.5);
    beginShape();
    for (let j = 0; j < pCount; j++) {
      vertex(b.points[j].x, b.points[j].y);
    }
    endShape();

    // Отрисовка ответвления (вынесена вниз, чтобы не ломать stroke основного ядра)
    if (b.life > 70 && pCount > 3 && random(1) < 0.2) {
      let midP = b.points[3];
      stroke(b.hue, 100, 100, b.life * 0.6);
      strokeWeight(1);
      line(midP.x, midP.y, midP.x + random(-20, 20), midP.y + random(-20, 20));
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
