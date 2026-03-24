let starElements = []; // Массив для хранения ссылок на DIVы звезд
let song, fft;
let playlist = [];
let shuffledIndices = [];
let currentIndex = 0;
let isShuffle = false;
let smoothR = new Array(1024).fill(0); // Хранилище инерции для 255 лучей
let playerState = 0;
let lightning = []; // Массив для молний-червяков
let searchQuery = ""; // Храним текст поиска

function setup() {
  createCanvas(windowWidth, windowHeight);
  starElements = Array.from(document.querySelectorAll('.star'));
  fft = new p5.FFT(0.1, 1024);
  colorMode(HSB, 360, 100, 100, 100);
  let ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
}

// Загрузка папки
function loadFolder(e) {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('audio/'));
  if (files.length === 0) return;

  playlist = files.map(file => ({
    name: file.name.replace(/\.[^/.]+$/, ""),
    url: URL.createObjectURL(file)
  }));

  renderPlaylist();
  playTrack(0);
  if (isShuffle) shufflePlaylist();
}
function updateVolume(val) {
  if (song) {
    song.setVolume(parseFloat(val));
  }
  // Обновляем текстовый процент
  document.getElementById('vol-value').innerText = Math.round(val * 100) + "%";
}
function handleSearch(val) {
  searchQuery = val.toLowerCase();
  renderPlaylist(); // Перерисовываем список при каждом вводе
}
function renderPlaylist() {
  const container = document.getElementById('playlist');
  const searchInput = document.getElementById('playlist-search');
  // Фильтруем плейлист перед выводом
  const filtered = playlist.filter(t => t.name.toLowerCase().includes(searchQuery));
// Если мы ищем, нам нельзя скрывать поиск, даже если активный трек не в списке!
  if (searchQuery.length > 0) {
      searchInput.style.opacity = "1";
      searchInput.style.visibility = "visible";
      searchInput.style.height = "32px";
  }
  
  container.innerHTML = filtered.map((t, i) => {
    // Находим реальный индекс трека в основном массиве
    const originalIndex = playlist.indexOf(t);
    const isActive = originalIndex === currentIndex;

    return `<div class="track-item ${isActive ? 'active' : ''}" 
                 onclick="playTrack(${originalIndex})">
              ${originalIndex + 1}. ${t.name}
            </div>`;
  }).join('');
  // container.innerHTML = playlist.map((t, i) =>
  //   `<div class="track-item ${i === currentIndex ? 'active' : ''}" onclick="playTrack(${i})">${i + 1}. ${t.name}</div>`
  // ).join('');
}

function playTrack(index) {
  if (song) song.stop();
  currentIndex = index;
  renderPlaylist();

  song = loadSound(playlist[index].url, () => {
    // Устанавливаем громкость из слайдера перед стартом
    let currentVol = document.getElementById('volume-slider').value;
    song.setVolume(parseFloat(currentVol));

    song.play();

    document.getElementById('track-info').innerText = playlist[index].name;
    document.getElementById('play-btn').innerText = "PAUSE";
  });
  function updateTrackInfo(name) {
    const info = document.getElementById('track-info');
    if (info) info.innerText = name;
  }
}
function handleMainClick() {
  const layer = document.getElementById('ui-layer');
  const mainBtn = document.querySelector('.main-circle-btn');
  const btnText = document.getElementById('main-btn-text');

  playerState = (playerState + 1) % 3;

  // Сбрасываем классы для анимации в CSS
  layer.classList.remove('state-1', 'state-2');
  if (playerState > 0) layer.classList.add(`state-${playerState}`);

}
function togglePlay() {
  if (!song) return;
  if (song.isPlaying()) {
    song.pause();
    document.getElementById('play-btn').innerText = "PLAY";
  } else {
    song.play();
    document.getElementById('play-btn').innerText = "PAUSE";
  }
}

function nextTrack() {
  if (isShuffle) {
    // Если очередь пуста или мы в конце — перемешиваем
    if (shuffledIndices.length === 0) {
      shufflePlaylist();
    }

    // Берем первый индекс из перемешанной очереди и удаляем его
    let nextIndex = shuffledIndices.shift();

    // Страховка: если выпал тот же трек, что играет сейчас — берем следующий
    if (nextIndex === currentIndex && shuffledIndices.length > 0) {
      shuffledIndices.push(nextIndex); // кидаем в конец
      nextIndex = shuffledIndices.shift();
    }

    playTrack(nextIndex);
  } else {
    // Обычный порядок
    let next = (currentIndex + 1) % playlist.length;
    playTrack(next);
  }
}

function prevTrack() {
  let prev = (currentIndex - 1 + playlist.length) % playlist.length;

  playTrack(prev);
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  if (isShuffle) shufflePlaylist(); // Сразу готовим очередь

  const btn = document.getElementById('shuffle-btn');
  document.getElementById('shuffle-btn').innerText = `shuff: ${isShuffle ? 'on' : 'off'}`;
  document.getElementById('shuffle-btn').classList.toggle('active');
}
function shufflePlaylist() {
  // Создаем массив индексов [0, 1, 2, ...]
  shuffledIndices = playlist.map((_, i) => i);

  // Алгоритм Фишера-Йейтса (честный рандом)
  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
  }
}
function seek(e) {
  if (!song) return;
  const rect = document.getElementById('progress-container').getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  song.jump(song.duration() * percent);
}

function draw() {

  // Эффект "Черной дыры" (шлейф)
  background(1, 2, 8, 35);
  colorMode(HSB, 360, 100, 100, 100); // Переключаем систему на радужный режим
  let spectrum = fft.analyze(); // Анализируем поток (мп3 или браузер)
  let bass = fft.getEnergy("bass");
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  // Обновление прогресс-бара
  if (song && song.isPlaying()) {
    let currentTime = song.currentTime();
    let duration = song.duration();

    // 1. Прогресс-бар
    let p = (song.currentTime() / song.duration()) * 100;
    document.getElementById('progress-bar').style.width = p + '%';

    // 2. Циферблаты
    document.getElementById('current-time').innerText = formatTime(currentTime);
    document.getElementById('remaining-time').innerText = "-" + formatTime(duration - currentTime);

    // 3. Автопереход
    if (song.currentTime() >= song.duration() - 0.1) nextTrack();
  }
  // --- БЛОК 3. УНИВЕРСАЛЬНЫЕ БРИЛЛИАНТОВЫЕ ЗВЕЗДЫ ---
  if (starElements.length > 0) {
    let trb = fft.getEnergy("treble");
    let bass = fft.getEnergy("bass");
    let mid = fft.getEnergy("mid");

    let globalHue = (frameCount * 0.4) % 360;

    starElements.forEach((star, i) => {
      // 1. ЦВЕТ И БЛЕСК
      let h = (globalHue + i * 5) % 360;

      // На пиках Treble уменьшаем насыщенность (делаем белыми и блестящими)
      let saturation = map(trb, 150, 255, 80, 0);
      saturation = constrain(saturation, 0, 80);

      // Яркость: в покое 70%, на пиках 100% (бриллиантовый эффект)
      let brightness = map(trb, 100, 255, 70, 100);

      // 2. ОСТРОЕ МЕРЦАНИЕ
      // Используем быстрый синус для "искрения"
      let flicker = sin(frameCount * 0.2 + i) * 0.3;
      let activeOp = map(trb, 0, 255, 0.1, 0.7);
      let finalOp = constrain(0.3 + flicker + activeOp, 0.1, 1.0);

      // 3. BLOOM (СВЕЧЕНИЕ)
      // На басах звезды "дышат", на высоких - "вспыхивают"
      let glowSize = map(trb, 150, 255, 2, 18);
      let bassPulse = map(bass, 180, 255, 1, 1.5); // Взрыв размера от бочки

      // ПРИМЕНЯЕМ СТИЛИ
      // Используем HSL: Saturation 0% дает идеально белый блеск
      star.style.backgroundColor = `hsl(${h}, ${saturation}%, ${brightness}%)`;
      star.style.opacity = finalOp;
      star.style.boxShadow = `0 0 ${glowSize}px 1px hsl(${h}, 100%, 70%)`;

      // Масштаб: Mid дает объем, Bass дает резкий толчок
      let s = map(mid, 0, 255, 0.8, 1.1) * bassPulse;
      star.style.transform = `scale(${s})`;
    });
  }


  // --- ГРИБНИЦА 8.0 // RAINBOW_HYPER_FLOW ---

  translate(width / 2, height / 2);
  // Вращение теперь медленное, создает спираль
  rotate(11);

  const numRays = 1024;
  for (let i = 0; i < numRays; i++) {
    // Зеркалим индекс, чтобы бас был внизу, а высокие уходили в стороны
    let specIdx = i;
    if (i > numRays / 2) specIdx = numRays - i;

    let angle = map(i, 0, numRays, 0, TWO_PI);
    let specVal = spectrum[specIdx];

    // 1. ЦВЕТ ПО НОТЕ (Вся палитра радуги по кругу)
    // Каждая нить имеет свой оттенок + он смещается от баса
    let hue = map(i, 0, numRays, 0, 360);
    hue = (hue + frameCount * 0.5) % 360; // Плавный перелив всей радуги

    // 2. ДИНАМИКА ДЛИНЫ (Наслаиваем частоты)
    let targetR = 104 + (specVal * 2.0) + (bass * 0.9);

    // Плавность хода (Lerp)
    smoothR[i] = lerp(smoothR[i], targetR, 0.20);
    // smoothR[i] = targetR

    // 3. АМПЛИТУДНОЕ "ТУДА-СЮДА" (Вибрация кончиков)
    let wave = sin(frameCount * 0.01 + i) * map(treble, 0, 255, 0, 10);
    let finalR = smoothR[i] + wave;

    let x = finalR * cos(angle);
    let y = finalR * sin(angle);

    // 4. ОТРИСОВКА (Градиентный эффект)
    // Рисуем основной луч
    stroke(hue, 90, 100, map(specVal, 0, 255, 40, 100));
    strokeWeight(map(specVal, 0, 255, 3, 6));

    line(cos(angle) * 84, sin(angle) * 164, x, y);


    // 5. КИСЛОТНЫЕ ВСПЫШКИ (Нейроны)
    if (specVal > 170) {
      // Вспышка контрастного цвета
      let flashHue = (hue + 90) % 360;
      noStroke();
      fill(flashHue, 80, 100, 100);
      ellipse(x, y, map(specVal, 0, 255, 3, 10));

      // Лазерное свечение
      fill(flashHue, 100, 100, 25);
      ellipse(x, y, map(specVal, 0, 255, 8, 25));


    }
  }

  // Обновляем и рисуем молнии
  for (let i = lightning.length - 1; i >= 0; i--) {
    lightning[i].update();
    lightning[i].draw();
    if (lightning[i].life <= 0) lightning.splice(i, 1);
  }

  // Центральное "Очко" теперь тоже живое

  // ellipse(0, 0, 100 + bass / 5, 100 + bass / 5);
  let ringR = (100 + bass / 5) / 2; // Радиус твоего живого кольца
  noFill();
  stroke((frameCount) % 360, 80, 100, 30);
  strokeWeight(2);
  ellipse(0, 0, ringR * 2, ringR * 2);

  // --- МОЛНИИ В КОЛЬЦО (БЬЮТ ОТ КНОПКИ) ---
  // Если бас пробивает порог — бьем молнией из центра в случайную точку кольца
  if (bass > 200 && frameCount % 2 === 0) {
    let randomAngle = random(TWO_PI);
    let targetX = ringR * cos(randomAngle);
    let targetY = ringR * sin(randomAngle);

    lightning.push(new Bolt(0, 0, targetX, targetY, (frameCount) % 360));
  }


  // --- МЕЛОДИЧЕСКИЕ МОЛНИИ (СИНТЕЗАТОР) ---
  // Триггер: если мелодия (mid) достаточно громкая
  // Порог 140-160 обычно ловит синтезаторы
  // --- УНИВЕРСАЛЬНЫЙ ТРИГГЕР МОЛНИЙ (МУЗЫКА + ПАУЗА) ---
  let shouldStrike = false;
  let synthHue = (frameCount) % 360;

  if (song && song.isPlaying()) {
    // РЕЖИМ МУЗЫКИ: Бьем под синтезатор (mid)
    if (mid > 160 && frameCount % 4 === 0) {
      shouldStrike = true;
      synthHue = (map(treble, 0, 255, 0, 100) + frameCount) % 360;
    }
  } else {
    // РЕЖИМ ПАУЗЫ/СТОПА: Редкие "статические" разряды
    // Шанс примерно раз в 2-3 секунды (при 60 FPS)
    if (random(1) < 0.01) {
      shouldStrike = true;
      synthHue = (frameCount * 0.5) % 360; // Медленная смена цвета в простое
    }
  }

  // Если сработал один из триггеров — стреляем!
  if (shouldStrike) {
    let ringR = (100 + bass / 5) / 2;
    let angle = random(TWO_PI);
    let targetX = ringR * cos(angle);
    let targetY = ringR * sin(angle);

    lightning.push(new Bolt(0, 0, targetX, targetY, synthHue));
  }
  // ОТРИСОВКА МОЛНИЙ
  for (let i = lightning.length - 1; i >= 0; i--) {
    lightning[i].update();
    lightning[i].draw();
    if (lightning[i].life <= 0) lightning.splice(i, 1);
  }
}
function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  return mins.toString().padStart(2, '0') + ":" + secs.toString().padStart(2, '0');
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }


//====================== захвата потока
async function syncSystemAudio() {
  try {
    // 1. Запрашиваем захват экрана с аудио (в окне выбора нужно нажать "Общий доступ к аудио")
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true, // Браузер требует видео для захвата аудио
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    // 2. Инициализируем аудио-контекст p5.js
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // 3. Создаем источник из системного потока
    const source = ctx.createMediaStreamSource(stream);

    // 4. Подключаем этот источник к твоему FFT
    // Теперь твое "Сердце" видит звук из YouTube!
    fft.setInput(source);

    // Визуальное подтверждение
    document.getElementById('sync-btn').innerText = "go";
    document.getElementById('sync-btn').style.textShadow = "0 0 15px var(--cyan)";
    document.getElementById('sync-btn').style.color = "var(--accent)";
    document.getElementById('track-info').innerText = "stream";

  } catch (err) {
    console.error("Ошибка синхронизации:", err);
    alert("Для работы выберите вкладку и поставьте галочку 'Доступ к аудио'");
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const starsLayer = document.getElementById('stars-layer');
  if (!starsLayer) {
    console.error("КРИТИЧНО: Элемент #stars-layer не найден в HTML!");
    return;
  }

  // Очищаем на случай повторного запуска
  starsLayer.innerHTML = '';
  starElements = [];

  for (let i = 0; i < 150; i++) {
    const star = document.createElement('div');
    star.className = 'star';

    let size = Math.random() * 2 + 1;
    star.style.width = size + 'px';
    star.style.height = size + 'px';

    // Раскидываем по экрану
    star.style.top = Math.random() * 100 + 'vh';
    star.style.left = Math.random() * 100 + 'vw';

    // Начальный цвет, чтобы не были невидимыми до старта музыки
    star.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';

    starsLayer.appendChild(star);
    starElements.push(star);
  }
});

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