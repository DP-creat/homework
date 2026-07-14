
// Твой Скафандр (ноут) может начать тупить и греться из-за нескольких системных избыточностей в коде. Давай их пофиксим.Баг №1: Дублирование переменных (Мусор в оперативе)В самом начале блока 3 ты заново объявляешь trb, bass и mid. Но bass, mid и treble уже объявлены строками выше! Мозг тратит ресурсы на переназначение.Фикс: Удалить повторные let bass, let mid. Использовать уже созданную переменную treble вместо trb.
// Баг №2: Ловушка window.updateAudioUI()Эта функция вызывается каждый кадр внутри draw() (60 раз в секунду). Если внутри нее идет тяжелый рендеринг интерфейса (DOM-манипуляции), вкладка браузера гарантированно упадет через 10 минут из-за утечки памяти.Фикс: Оптимизировать updateAudioUI, чтобы она обновляла DOM только по таймеру (например, раз в 5 кадров), а не каждый тик.
// Баг №3: Ловушка цвета в HSL/HSBВ начале ты включаешь colorMode(HSB). Это глобальный режим для функций stroke() и fill(). Но внутри цикла звезд ты пишешь:
// javascriptstar.style.backgroundColor = `hsl(${h}, ${saturation}%, ${brightness}%)`;
// Для CSS-стилей это сработает, но если ты захочешь использовать эти переменные внутри p5.js, начнется путаница.

function draw() {
  // 1. Обновление UI аудио-движка (Оптимизируй внутри, чтобы не вешать DOM)
  if (window.updateAudioUI) window.updateAudioUI();

  // 2. РИСОВАНИЕ И НАСТРОЙКА ХОЛСТА
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
      // 1. ЦВЕТ И БЛЕСК (Используем общую переменную treble)
      let h = (globalHue + i * 5) % 360;

      // На пиках Treble уменьшаем насыщенность (делаем белыми и блестящими)
      let saturation = constrain(map(treble, 150, 255, 80, 0), 0, 80);

      // Яркость: в покое 70%, на пиках 100% (бриллиантовый эффект)
      let brightness = map(treble, 100, 255, 70, 100);

      // 2. ОСТРОЕ МЕРЦАНИЕ
      let flicker = sin(frameCount * 0.2 + i) * 0.3;
      let activeOp = map(treble, 0, 255, 0.1, 0.7);
      let finalOp = constrain(0.3 + flicker + activeOp, 0.1, 1.0);

      // 3. BLOOM (СВЕЧЕНИЕ)
      let glowSize = map(treble, 150, 255, 2, 18);
      let bassPulse = map(bass, 180, 255, 1, 1.5); // Взрыв размера от бочки

      // ПРИМЕНЯЕМ СТИЛИ В CSS КОНТУР
      star.style.backgroundColor = `hsl(${h}, ${saturation}%, ${brightness}%)`;
      star.style.opacity = finalOp;
      star.style.boxShadow = `0 0 ${glowSize}px 1px hsl(${h}, 100%, 70%)`;

      // Масштаб: Mid дает объем, Bass дает резкий толчок
      let s = map(mid, 0, 255, 0.8, 1.1) * bassPulse;
      star.style.transform = `scale(${s})`;
    });
  }

  // --- ГРИБНИЦА 8.1 // RAINBOW_HYPER_FLOW ---
  translate(width / 2, height / 2);
  rotate(11); // Тот самый разворот, который уложил Око горизонтально

  const numRays = 1024;
  for (let i = 0; i < numRays; i++) {
    let specIdx = i;
    if (i > numRays / 2) specIdx = numRays - i;

    let angle = map(i, 0, numRays, 0, TWO_PI);
    let specVal = spectrum[specIdx];
    let hue = (map(i, 0, numRays, 0, 360) + frameCount * 0.5) % 360;

    // Сглаживание радиуса через lerp (работает идеально ровно)
    let targetR = 104 + (specVal * 2.0) + (bass * 0.9);
    smoothR[i] = lerp(smoothR[i], targetR, 0.20);
    let wave = sin(frameCount * 0.01 + i) * map(treble, 0, 255, 0, 10);
    let finalR = smoothR[i] + wave;

    let x = finalR * cos(angle);
    let y = finalR * sin(angle);

    // Гениальная геометрия Ока (84 на 164)
    stroke(hue, 90, 100, map(specVal, 0, 255, 40, 100));
    strokeWeight(map(specVal, 0, 255, 3, 6));
    line(cos(angle) * 84, sin(angle) * 164, x, y);

    // Вспышки спор мицелия на пиках частот
    if (specVal > 170) {
      let flashHue = (hue + 90) % 360;
      noStroke();
      fill(flashHue, 80, 100, 100);
      ellipse(x, y, map(specVal, 0, 255, 3, 10));
      fill(flashHue, 100, 100, 25);
      ellipse(x, y, map(specVal, 0, 255, 8, 25));
    }
  }

  // --- МОЛНИИ ВНУТРИ ЗРАЧКА ---
  let ringR = (100 + bass / 5) / 2;
  noFill();
  stroke((frameCount) % 360, 80, 100, 30);
  strokeWeight(2);
  ellipse(0, 0, ringR * 2, ringR * 2);

  // Статические разряды от баса
  if (bass > 200 && frameCount % 2 === 0) {
    let randomAngle = random(TWO_PI);
    lightning.push(new Bolt(0, 0, ringR * cos(randomAngle), ringR * sin(randomAngle), (frameCount) % 360));
  }

  let shouldStrike = false;
  let synthHue = (frameCount) % 360;

  // Интеллектуальный триггер молний под трек
  if (window.playerData.song && window.playerData.song.isPlaying()) {
    if (mid > 160 && frameCount % 4 === 0) {
      shouldStrike = true;
      synthHue = (map(treble, 0, 255, 0, 100) + frameCount) % 360;
    }
  } else {
    // Фоновое искрение в простое плеера
    if (random(1) < 0.01) {
      shouldStrike = true;
      synthHue = (frameCount * 0.5) % 360;
    }
  }

  if (shouldStrike) {
    let angle = random(TWO_PI);
    lightning.push(new Bolt(0, 0, ringR * cos(angle), ringR * sin(angle), synthHue));
  }

  // Рендеринг и очистка массива молний (защита от переполнения памяти)
  for (let i = lightning.length - 1; i >= 0; i--) {
    lightning[i].update();
    lightning[i].draw();
    if (lightning[i].life <= 0) lightning.splice(i, 1);
  }
}


// **********ПРЕДЛЖЕНИЯ******************************
// Чтобы молнии оставляли за собой фрактальный след, нам нужно, чтобы при их обновлении в пространство вылетали микро-частицы (искры), которые медленно гаснут и плавно расширяются.Добавь в глобальную зону видимости массив для шлейфа:

let sparks = []; // Массив для фрактальных искр

// А теперь пропиши логику внутри класса Bolt (в метод update или draw там, где генерируются изломы молнии). Каждый раз, когда молния бьет, она должна пушить искры в массив:

// Класс частицы шлейфа (Искры)
class Spark {
  constructor(x, y, hue) {
    this.x = x;
    this.y = y;
    this.hue = hue;
    this.size = random(2, 6);
    this.life = 1.0; // Энергия искры (от 1.0 до 0)
    this.decay = random(0.02, 0.05); // Скорость угасания
    // Искры плавно разлетаются от центра
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
  }

  update(midValue) {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;

    // ГЛУБИНА: Средние частоты заставляют искры "дышать" и расширяться
    this.size += map(midValue, 0, 255, 0, 0.4);
  }

  draw() {
    noStroke();
    // Прозрачность падает вместе с жизнью искры
    fill(this.hue, 90, 100, this.life * 100);
    ellipse(this.x, this.y, this.size, this.size);
  }
}


// Шаг 2. Интеграция Детектора Дропа и Шлейфа в draw()Теперь пересобираем твою основную функцию. Мы добавляем туда математический триггер дропа и обработчик искр. Посмотри, как красиво теперь будет работать цвет.Вставь этот обновленный кусок кода:

// Добавь эти переменные на самый верх файла, вне draw():
let lastBass = 0;
let currentPaletteOffset = 0;

function draw() {
  if (window.updateAudioUI) window.updateAudioUI();

  background(1, 2, 8, 35); // Шлейф "Черной дыры"
  colorMode(HSB, 360, 100, 100, 100); 
  
  let spectrum = fft.analyze(); 
  let bass = fft.getEnergy("bass");
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  // --- ИНТЕЛЛЕКТУАЛЬНЫЙ ДЕТЕКТОР ДРОПА ---
  // Считаем производную (резкость удара баса)
  let bassDelta = bass - lastBass;
  lastBass = bass;

  // Если яма (бас тихий), уводим палитру в холодный космос
  let baseHue = (frameCount * 0.5) % 360;
  if (bass < 100) {
    currentPaletteOffset = lerp(currentPaletteOffset, 180, 0.05); // Плавный уход в синеву
  }

  // КВАНТОВЫЙ СКАЧОК: Если произошел резкий удар бочки на ДРОПЕ
  if (bass > 230 && bassDelta > 35) {
    currentPaletteOffset = (currentPaletteOffset + 120) % 360; // Мгновенный взрыв цвета!
    
    // Генерируем мощный выброс искр прямо из центра Ока на дропе
    for(let k = 0; k < 20; k++) {
      let sparkHue = (baseHue + currentPaletteOffset) % 360;
      sparks.push(new Spark(0, 0, sparkHue));
    }
  }
  
  // Возвращаем палитру к балансу
  currentPaletteOffset = lerp(currentPaletteOffset, 0, 0.02);
  let globalHue = (baseHue + currentPaletteOffset) % 360;

  // --- БЛОК 3. УНИВЕРСАЛЬНЫЕ БРИЛЛИАНТОВЫЕ ЗВЕЗДЫ ---
  if (starElements.length > 0) {
    starElements.forEach((star, i) => {
      let isGiant = star.classList.contains('star--giant');
      let h = (globalHue + i * 5) % 360;

      let saturation = isGiant ? map(treble, 100, 255, 60, 0) : 80;
      let brightness = isGiant ? map(treble, 100, 255, 80, 100) : 75;
      let flicker = sin(frameCount * (isGiant ? 0.3 : 0.1) + i) * 0.4;
      let finalOp = constrain(0.4 + flicker + map(treble, 0, 255, 0, 0.5), 0.1, 1.0);
      let glowSize = isGiant ? map(treble, 120, 255, 5, 25) : map(treble, 150, 255, 0, 8);

      star.style.backgroundColor = `hsl(${h}, ${saturation}%, ${brightness}%)`;
      star.style.opacity = finalOp;

      if (isGiant) {
        star.style.filter = `drop-shadow(0 0 ${glowSize / 2}px hsl(${h}, 100%, 70%))`;
        star.style.boxShadow = 'none';
      } else {
        star.style.boxShadow = `0 0 ${glowSize}px hsl(${h}, 100%, 50%)`;
        star.style.filter = 'none';
      }

      let bassBoost = isGiant ? map(bass, 190, 255, 0, 1.5) : map(bass, 200, 255, 0, 0.3);
      let s = (isGiant ? 1.0 : 0.8) + bassBoost + map(mid, 0, 255, 0, 0.2);
      star.style.transform = `scale(${s})`;
    });
  }

  // --- ГРИБНИЦА 8.2 // HYPER_DROP_FLOW ---
  translate(width / 2, height / 2);
  rotate(11);

  const numRays = 1024;
  for (let i = 0; i < numRays; i++) {
    let specIdx = i;
    if (i > numRays / 2) specIdx = numRays - i;

    let angle = map(i, 0, numRays, 0, TWO_PI);
    let specVal = spectrum[specIdx];
    
    // Накладываем наш динамический оффсет цвета
    let hue = (map(i, 0, numRays, 0, 360) + globalHue) % 360;

    let targetR = 104 + (specVal * 2.0) + (bass * 0.9);
    smoothR[i] = lerp(smoothR[i], targetR, 0.20);
    let wave = sin(frameCount * 0.01 + i) * map(treble, 0, 255, 0, 10);
    let finalR = smoothR[i] + wave;

    let x = finalR * cos(angle);
    let y = finalR * sin(angle);

    stroke(hue, 90, 100, map(specVal, 0, 255, 40, 100));
    strokeWeight(map(specVal, 0, 255, 3, 6));
    line(cos(angle) * 84, sin(angle) * 164, x, y);

    if (specVal > 170) {
      let flashHue = (hue + 90) % 360;
      noStroke();
      fill(flashHue, 80, 100, 100);
      ellipse(x, y, map(specVal, 0, 255, 3, 10));
      
      // ГЛУБИНА: При взрыве спор на концах лучей, пушим искры в шлейф!
      if (frameCount % 2 === 0) {
        sparks.push(new Spark(x, y, flashHue));
      }
    }
  }

  // --- РЕНДЕРИНГ ФРАКТАЛЬНОГО ШЛЕЙФА ---
  // Обрабатываем искры от молний и спор
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].update(mid);
    sparks[i].draw();
    if (sparks[i].life <= 0) {
      sparks.splice(i, 1); // Чистим память, чтобы не висло
    }
  }

  // --- МОЛНИИ ВНУТРИ ЗРАЧКА ---
  let ringR = (100 + bass / 5) / 2;
  noFill();
  stroke(globalHue, 80, 100, 30);
  strokeWeight(2);
  ellipse(0, 0, ringR * 2, ringR * 2);

  if (bass > 200 && frameCount % 2 === 0) {
    let randomAngle = random(TWO_PI);
    let bx = ringR * cos(randomAngle);
    let by = ringR * sin(randomAngle);
    lightning.push(new Bolt(0, 0, bx, by, globalHue));
    
    // Каждая молния оставляет искру в точке удара
    sparks.push(new Spark(bx, by, globalHue));
  }

  let shouldStrike = false;
  if (window.playerData.song && window.playerData.song.isPlaying()) {
    if (mid > 160 && frameCount % 4 === 0) {
      shouldStrike = true;
    }
  } else {
    if (random(1) < 0.01) shouldStrike = true;
  }

  if (shouldStrike) {
    let angle = random(TWO_PI);
    let bx = ringR * cos(angle);
    let by = ringR * sin(angle);
    lightning.push(new Bolt(0, 0, bx, by, globalHue));
    sparks.push(new Spark(bx, by, (globalHue + 180) % 360));
  }

  for (let i = lightning.length - 1; i >= 0; i--) {
    lightning[i].update();
    lightning[i].draw();
    if (lightning[i].life <= 0) lightning.splice(i, 1);
  }
}

// Что ты получишь на экране после деплоя этого кода:Ямы трека станут гипнотическими: Когда музыка затихает, Око плавно застывает в глубоких фиолетово-синих тонах.Взрыв на Дропе: В момент удара жирной бочки вся палитра совершает резкий квантовый скачок, а из центра Ока вылетает облако светящихся неоновых искр.Объемный шлейф: Кожа твоего мицелия и точки ударов молний теперь будут «сочить» искрами, которые плавно расширяются под действием вокала (mid) и мягко тают в темноте. Вкладка не упадет — сборщик мусора (sparks.splice) зачищает мертвые частицы каждый кадр.