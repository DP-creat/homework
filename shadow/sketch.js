let isHolding = false;
let score = 0;
let centerX, centerY;
let shadows = [];
let gameOver = false;
let centerRadius = 25; // Размер точки под фалангу
let grabRadius = 60;   // Чуть больший радиус для удержания
let highScore = 0;
let isRestored = false;
let holdFrames = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  centerX = width / 2;
  centerY = height / 2;
  noStroke();

  let savedScoreLS = localStorage.getItem('shadow_perimeter_highscore');
  if (savedScoreLS !== null) highScore = parseInt(savedScoreLS);

  let savedCurrentScore = localStorage.getItem('shadow_perimeter_currentscore');
  if (savedCurrentScore !== null) {
    score = parseInt(savedCurrentScore);
    savedScore = score; // ИСПРАВЛЕНО: Создаем точку отката на базе загруженных очков
    if (score > 0) {
      isRestored = true;
      let infoText = document.getElementById('info-text');
      if (infoText) {
        infoText.innerText = "hold center";
      }
    }
  }

  updateScoreUI();
}


function updateScoreUI() {
  let scoreText = document.getElementById('score-text');
  if (scoreText) {
    scoreText.innerText = `score: ${score} | best: ${highScore}`;
  }
}

// ОРИГИНАЛЬНЫЙ ЦИКЛ ИГРЫ (МЕХАНИКА ПОЛНОСТЬЮ ВОССТАНОВЛЕНА)
function draw() {
  if (gameOver) {
    background(0);
    return;
  }

  // Эффект легкого шлейфа на самом экране за счет прозрачности фона
  background(255, 255, 255, 40);

  // 1. СТАТИЧЕСКАЯ ПОСТОЯННАЯ ТЕНЬ (Всегда на фоне, мягкая и полупрозрачная)
  let staticShadowRadius = centerRadius * 1.8;
  let staticGrad = drawingContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, staticShadowRadius);
  staticGrad.addColorStop(0, 'rgba(0, 0, 0, 0.25)');   // Мягкое темное основание
  staticGrad.addColorStop(0.2, 'rgba(0, 0, 0, 0.12)'); // Постепенное рассеивание
  staticGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');      // Уход в полную прозрачность

  drawingContext.fillStyle = staticGrad;
  drawingContext.beginPath();
  drawingContext.arc(centerX, centerY, staticShadowRadius, 0, TWO_PI);
  drawingContext.fill();

  // Разветвление режимов: Активный (Удержание) или Ожидание
  if (isHolding) {
    // 2А. АКТИВНЫЙ РЕЖИМ — РАСХОДЯЩИЕСЯ ТЕМНЫЕ ВОЛНЫ
    // Создаем три круговые волны, которые циклически бегут из центра наружу
    for (let w = 0; w < 3; w++) {
      // Каждая волна сдвинута по времени
      let waveProgress = ((frameCount * 0.8) + (w * centerRadius * 1.5)) % (centerRadius * 3.5);

      // Чем дальше волна от центра, тем она прозрачнее
      let waveAlpha = map(waveProgress, 0, centerRadius * 3.5, 0.4, 0);

      let waveGrad = drawingContext.createRadialGradient(centerX, centerY, waveProgress * 0.5, centerX, centerY, waveProgress);
      waveGrad.addColorStop(0, `rgba(0, 0, 0, 0)`);
      waveGrad.addColorStop(0.7, `rgba(15, 15, 15, ${waveAlpha})`); // Плотный гребень волны
      waveGrad.addColorStop(1, `rgba(0, 0, 0, 0)`);

      drawingContext.fillStyle = waveGrad;
      drawingContext.beginPath();
      drawingContext.arc(centerX, centerY, waveProgress, 0, TWO_PI);
      drawingContext.fill();
    }

    // Центральная плотная кнопка в зажатом состоянии (втягивает тьму)
    let activeCoreGrad = drawingContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, centerRadius);
    activeCoreGrad.addColorStop(0, 'rgba(5, 5, 5, 0.1)');
    activeCoreGrad.addColorStop(0.8, 'rgba(20, 20, 20, 0.2)');
    activeCoreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    drawingContext.fillStyle = activeCoreGrad;
    drawingContext.beginPath();
    drawingContext.arc(centerX, centerY, centerRadius, 0, TWO_PI);
    drawingContext.fill();

  } else {
    // 2Б. РЕЖИМ ОЖИДАНИЯ — МЕДЛЕННАЯ ПУЛЬСАЦИЯ
    // Синусоида для очень плавного «дыхания» портала
    let slowPulse = sin(frameCount * 0.04) * 2;
    let currentPortalRadius = centerRadius * 1.3 + slowPulse;

    let waitingGrad = drawingContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, currentPortalRadius);
    // Мягкое дымчатое ядро, которое медленно расширяется и сужается
    waitingGrad.addColorStop(0, 'rgba(10, 10, 10, 0.65)');
    waitingGrad.addColorStop(0.2, 'rgba(15, 15, 15, 0.2)');
    waitingGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    drawingContext.fillStyle = waitingGrad;
    drawingContext.beginPath();
    drawingContext.arc(centerX, centerY, currentPortalRadius, 0, TWO_PI);
    drawingContext.fill();

    // Сверхплотная маленькая точка-ориентир в самом центре
    fill(10, 10, 10, 180);
    ellipse(centerX, centerY, centerRadius * 0.2);
  }








  // Мониторинг тач-событий
  checkTouch();

  // Тени спавнятся и очки идут ТОЛЬКО при удержании пальца
  if (isHolding) {
    // Динамический лимит теней под адаптированную сложность
    let maxShadows = 1;
    if (highScore >= 15) maxShadows = 2; // Порог для продвинутых детей
    if (highScore >= 40) maxShadows = 3; // Порог для взрослых
    if (highScore >= 65) maxShadows = 4; // Экстремальный порог

    // Шанс спавна увеличивается для взрослых, создавая плотный поток врагов
    let spawnChance = highScore <= 15 ? 0.02 : 0.04;

    if (random(1) < spawnChance && shadows.length < maxShadows) {
      shadows.push(new Shadow());
    }

    holdFrames++;
    if (holdFrames >= 60) { // Прошла ровно 1 секунда чистого удержания
      score++;
      updateScoreUI(); // Просто обновляем текст на экране (это быстро)
      holdFrames = 0;
      // ИСПРАВЛЕНО: Строку localStorage.setItem отсюда полностью УДАЛИЛИ
    }
  }

  // Обновление и отрисовка теней
  for (let i = shadows.length - 1; i >= 0; i--) {
    shadows[i].update();
    shadows[i].draw(); // Вызывает новый градиентный draw внутри класса

    if (isHolding && shadows[i].hasReachedCenter()) {
      triggerGameOver();
      return;
    }

    if (shadows[i].isDead) {
      shadows.splice(i, 1);
    }
  }
}

function checkTouch() {
  let checkX, checkY, isDown;

  if (touches.length > 0) {
    checkX = touches[0].x;
    checkY = touches[0].y;
    isDown = true;
  } else {
    checkX = mouseX;
    checkY = mouseY;
    isDown = mouseIsPressed;
  }

  if (isDown) {
    let d = dist(checkX, checkY, centerX, centerY);
    if (!isHolding) {
      if (d < centerRadius * 2 && !gameOver) {
        isHolding = true;
        isRestored = false;
        document.body.classList.add('game-active');
        let infoText = document.getElementById('info-text');
        if (infoText) infoText.style.opacity = '0';
      }
    } else {
      if (d > grabRadius) {
        playerDroppedFinger();
      }
    }
  } else {
    if (isHolding) {
      playerDroppedFinger();
    }
  }
}

function playerDroppedFinger() {
  isHolding = false;
  document.body.classList.remove('game-active');
  let infoText = document.getElementById('info-text');
  if (infoText) infoText.style.opacity = '1';

  let someoneIsAttacking = shadows.some(s => s.isAttacking);

  if (someoneIsAttacking) {
    // 1. УСПЕШНОЕ УКЛОНЕНИЕ: Фиксируем очки и создаем чекпоинт
    savedScore = score; // Обновляем точку отката до текущего счета
    localStorage.setItem('shadow_perimeter_currentscore', score);

    // Проверяем и обновляем рекорд
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('shadow_perimeter_highscore', highScore);
    }

    updateScoreUI();

    if (infoText) {
      infoText.innerText = "SAFE! HOLD AGAIN";
      infoText.style.color = "#00aa44"; // Красивый зеленый
      infoText.style.textShadow = "0 0 12px rgba(0, 170, 68, 0.4), 0 0 25px rgba(0, 170, 68, 0.15)";
    }
  } else {
    // 2. РАННЕЕ ОТПУСКАНИЕ: Сбрасываем счет назад к последнему чекпоинту
    score = savedScore; // Откатываем очки назад
    updateScoreUI();

    if (infoText) {
      if (shadows.length === 0) {
        infoText.innerText = "ALL CLEAR! HOLD CENTER";
        infoText.style.color = "#1a1a1a";
        infoText.style.textShadow = "0 2px 8px rgba(0, 0, 0, 0.1), 0 0 20px rgba(0, 0, 0, 0.05)";
      } else {
        infoText.innerText = "too early";
        infoText.style.color = "orange";
        infoText.style.textShadow = "0 0 12px rgba(255, 119, 0, 0.3), 0 0 25px rgba(255, 119, 0, 0.1)";
      }
    }
  }

  // Пугаем тени, и они разлетаются
  shadows.forEach(s => s.triggerFlee());
}


function triggerGameOver() {
  gameOver = true;
  isHolding = false;
  isRestored = false;
  shadows = [];
  background(0);

  document.body.classList.remove('game-active');
  document.body.classList.add('game-over');

  let infoText = document.getElementById('info-text');
  if (infoText) {
    infoText.style.opacity = '1';
    infoText.innerText = "OOPS!";
    infoText.style.color = "#ff2222";
    infoText.style.textShadow = "0 0 15px rgba(255, 34, 34, 0.8), 0 0 30px rgba(255, 34, 34, 0.5), 0 0 60px rgba(255, 34, 34, 0.2)";
  }

  // СБРОС ВСЕГО
  score = 0;
  savedScore = 0; // Обнуляем точку отката
  localStorage.setItem('shadow_perimeter_currentscore', 0);
  updateScoreUI();

  setTimeout(() => {
    gameOver = false;
    updateScoreUI();
    document.body.classList.remove('game-over');

    if (infoText) {
      infoText.innerText = "hold center";
      infoText.style.color = "#1a1a1a";
      infoText.style.textShadow = "0 2px 8px rgba(0, 0, 0, 0.1), 0 0 20px rgba(0, 0, 0, 0.05)";
    }
  }, 2000);
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  centerX = width / 2;
  centerY = height / 2;
}
class Shadow {
  constructor() {
    this.angle = random(TWO_PI);
    this.headSize = random(35, 50);
    this.baseWidth = this.headSize * 1.8;
    this.spawnSpeed = random(0.02, 0.06);
    this.currentPeek = 0;
    this.maxPeek = this.headSize / 2;

    this.isAttacking = false;
    this.isFleeing = false;
    this.isDead = false;
    this.attackProgress = 0;

    this.lifeTimer = frameCount + floor(random(180, 480));
    if (random(1) < 0.15) {
      this.attackTimer = frameCount + floor(random(10, 40));
    } else {
      this.attackTimer = frameCount + floor(random(120, 360));
    }
    // --- ДИНАМИЧЕСКАЯ СЛОЖНОСТЬ ОТ РЕКОРДА ---
    // --- ГИБРИДНАЯ МАТЕМАТИЧЕСКАЯ СЛОЖНОСТЬ (ДЕТИ -> ВЗРОСЛЫЕ) ---
    let difficultyFactor = 1.0;

    if (highScore <= 15) {
      // Детская фаза: очень медленный линейный рост от 0.65 до 0.80
      difficultyFactor = 0.65 + (highScore / 15) * 0.15;
    } else {
      // Взрослая фаза: степенной разгон после 15 очков. Лимит скорости х2.8
      difficultyFactor = 0.80 + Math.pow((highScore - 15) / 20, 1.3) * 0.5;
      difficultyFactor = min(difficultyFactor, 2.8);
    }


    // Применяем множитель сложности к скорости патрулирования и дыхания
    this.patrolSpeed = random(0.004, 0.010) * (random(1) > 0.5 ? 1 : -1) * difficultyFactor;

    // let breatheFactor = 1.0 + (highScore / 10) * 0.05;
    // this.breatheSpeed = random(0.09, 0.15) * min(breatheFactor, 1.3);
    // this.breatheAmp = random(3, 8);

    // Мягкое дыхание (для взрослых ускоряем, но не даем ему ломать визуал)
    this.breatheSpeed = random(0.05, 0.09) * min(difficultyFactor, 1.5);
    this.breatheAmp = random(2, 5);

    // Шаг прироста атаки (тоже увеличивается от рекорда)
    // let attackFactor = min(difficultyFactor, 1.4);
    // this.attackStepMin = 0.02 * attackFactor;
    // this.attackStepMax = 0.04 * attackFactor;

    // Замедленный рывок к центру: теперь даже с разгоном от рекорда 
    // у ребенка будет достаточно времени, чтобы комфортно убрать палец
    // let attackFactor = min(difficultyFactor, 1.4);
    this.attackStepMin = 0.012 * difficultyFactor;
    this.attackStepMax = 0.022 * difficultyFactor;

    this.x = 0;
    this.y = 0;
    this.edgeX = 0;
    this.edgeY = 0;

    // Массив для хранения истории позиций шариков (для плавного следа)
    this.smoothR = [];
    this.maxTrailLength = 10; // Увеличено для более густого шлейфа градиентов
  }

  triggerFlee() {
    this.isAttacking = false;
    this.isFleeing = true;
  }

  getEdgePoint(angle) {
    let cosA = cos(angle);
    let sinA = sin(angle);
    let tMaxX = cosA > 0 ? (width - centerX) / cosA : (-centerX) / cosA;
    let tMaxY = sinA > 0 ? (height - centerY) / sinA : (-centerY) / sinA;
    let t = min(tMaxX, tMaxY);
    return { x: centerX + cosA * t, y: centerY + sinA * t, dist: t };
  }

  update() {
    let edge = this.getEdgePoint(this.angle);
    this.edgeX = edge.x;
    this.edgeY = edge.y;

    if (this.isFleeing) {
      this.attackProgress = lerp(this.attackProgress, 0, 0.15);
      this.currentPeek = lerp(this.currentPeek, -20, 0.1);
      let currentDist = edge.dist - this.currentPeek;
      let d = lerp(currentDist, centerRadius, this.attackProgress);
      if (this.attackProgress < 0.05) d = edge.dist - this.currentPeek;
      this.x = centerX + cos(this.angle) * d;
      this.y = centerY + sin(this.angle) * d;
      if (this.attackProgress <= 0.01 && this.currentPeek <= 0) {
        this.isDead = true;
      }
    } else if (!this.isAttacking) {
      if (this.currentPeek < this.maxPeek - 1) {
        this.currentPeek = lerp(this.currentPeek, this.maxPeek, this.spawnSpeed);
      } else {
        this.angle += this.patrolSpeed;
        if (frameCount > this.lifeTimer && !shadows.some(s => s.isAttacking)) {
          this.isFleeing = true;
        }
      }
      let pulse = sin(frameCount * this.breatheSpeed) * this.breatheAmp;
      let currentAmbushDist = edge.dist - (this.currentPeek + pulse);
      this.x = centerX + cos(this.angle) * currentAmbushDist;
      this.y = centerY + sin(this.angle) * currentAmbushDist;

      // if (frameCount > this.attackTimer && isHolding && !shadows.some(s => s.isAttacking)) {
      //   this.isAttacking = true;
      // }

      // Проверка на атаку
      // Проверка на переход в атаку с элементом СЛУЧАЙНОСТИ (Рандом)
      if (frameCount > this.attackTimer && isHolding) {
        // Считаем, сколько теней уже атакуют прямо сейчас
        let currentAttackers = shadows.filter(s => s.isAttacking).length;

        // Определяем абсолютный потолок одновременных атак в зависимости от рекорда
        let maxSimultaneousAttacks = 1;
        if (highScore >= 40) maxSimultaneousAttacks = 2; // После 40 очков могут напасть вдвоем
        if (highScore >= 65) maxSimultaneousAttacks = 3; // После 65 очков — втроем!

        // Если лимит еще не превышен, бросаем кубик на рандомную атаку
        if (currentAttackers < maxSimultaneousAttacks) {
          // Шанс 4% в каждом кадре, что тень решится на рывок.
          // Это создает естественные непредсказуемые паузы между атаками
          if (random(1) < 0.04) {
            this.isAttacking = true;
          }
        }
      }


    } else {
      this.attackProgress += random(this.attackStepMin, this.attackStepMax);
      let startDist = edge.dist - this.maxPeek;
      let currentDist = lerp(startDist, 0, this.attackProgress);
      this.x = centerX + cos(this.angle) * currentDist;
      this.y = centerY + sin(this.angle) * currentDist;
      if (this.attackProgress >= 1.0) {
        this.isDead = true;
      }
    }

    // Запись истории позиций для красивого эффекта затухания шариков
    this.smoothR.push({ x: this.x, y: this.y });
    if (this.smoothR.length > this.maxTrailLength) {
      this.smoothR.shift();
    }
  }

  draw() {
    // 1. ОТРИСОВКА ШЛЕЙФА (ГУСТОЙ ДЫМНЫЙ СЛЕД)
    for (let i = 0; i < this.smoothR.length; i++) {
      let pos = this.smoothR[i];
      let alpha = map(i, 0, this.smoothR.length, 0.03, 0.28);
      let trailRadius = (this.headSize * 1.4) / 2;

      let trailGrad = drawingContext.createRadialGradient(
        pos.x, pos.y, 0,
        pos.x, pos.y, trailRadius
      );
      trailGrad.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
      trailGrad.addColorStop(0.5, `rgba(0, 0, 0, ${alpha * 0.4})`);
      trailGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      drawingContext.fillStyle = trailGrad;
      drawingContext.beginPath();
      drawingContext.arc(pos.x, pos.y, trailRadius, 0, TWO_PI);
      drawingContext.fill();
    }

    // 2. РЕАЛИСТИЧНАЯ ЖИВАЯ ТЕНЬ (УГОЛЬНО-ЧЕРНАЯ ПЛОТНОСТЬ)
    let wave = sin(frameCount * 0.2 + this.angle * 10) * 3;
    let currentRadius = (this.headSize + wave) / 2;

    // В покое — 0.75 (очень плотная), при атаке — 1.0 (абсолютная непрозрачная тьма)
    let baseAlpha = this.isAttacking ? 1.0 : 0.75;

    let shadowGradRadius = currentRadius * 1.8;
    let shadowGrad = drawingContext.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, shadowGradRadius
    );

    shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${baseAlpha})`);
    shadowGrad.addColorStop(0.2, `rgba(0, 0, 0, ${baseAlpha * 0.85})`);
    shadowGrad.addColorStop(0.6, `rgba(0, 0, 0, ${baseAlpha * 0.4})`);
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    drawingContext.fillStyle = shadowGrad;
    drawingContext.beginPath();
    drawingContext.arc(this.x, this.y, shadowGradRadius, 0, TWO_PI);
    drawingContext.fill();

    // 3. ДОПОЛНИТЕЛЬНЫЙ ЭФФЕКТ: СВЕРХПЛОТНОЕ ЯДРО
    let coreRadius = currentRadius * 0.7;
    let coreGrad = drawingContext.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, coreRadius
    );
    coreGrad.addColorStop(0, `rgba(0, 0, 0, ${baseAlpha * 0.95})`);
    coreGrad.addColorStop(0.5, `rgba(0, 0, 0, ${baseAlpha * 0.5})`);
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    drawingContext.fillStyle = coreGrad;
    drawingContext.beginPath();
    drawingContext.arc(this.x, this.y, coreRadius, 0, TWO_PI);
    drawingContext.fill();
  }

  hasReachedCenter() {
    return dist(this.x, this.y, centerX, centerY) < centerRadius;
  }
}

function resetAllData() {
  // Подтверждение сброса, чтобы игрок не удалил рекорд случайно
  let confirmReset = confirm("Are you sure you want to clear your progress and best score?");
  if (!confirmReset) return;

  // 1. Полностью стираем записи из памяти браузера
  localStorage.removeItem('shadow_perimeter_highscore');
  localStorage.removeItem('shadow_perimeter_currentscore');

  // 2. Обнуляем переменные в самом коде
  savedScore = 0;
  score = 0;
  highScore = 0;
  isHolding = false;
  isRestored = false;
  shadows = []; // Удаляем текущих врагов с экрана

  // 3. Обновляем интерфейс
  updateScoreUI();

  let infoText = document.getElementById('info-text');
  if (infoText) {
    infoText.innerText = "hold center";
    infoText.style.color = "#1a1a1a";
    infoText.style.opacity = '1';
  }
}
