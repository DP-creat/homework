let starElements = []; // Массив для хранения ссылок на DIVы звезд
let song, fft;
let playlist = [];
let shuffledIndices = [];
let currentIndex = 0;
let isShuffle = false;
let smoothR = new Array(511).fill(0); // Хранилище инерции для 255 лучей


function setup() {
  createCanvas(windowWidth, windowHeight);
  starElements = Array.from(document.querySelectorAll('.star'));
  fft = new p5.FFT(0.1, 256);
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
function renderPlaylist() {
  const container = document.getElementById('playlist');
  container.innerHTML = playlist.map((t, i) =>
    `<div class="track-item ${i === currentIndex ? 'active' : ''}" onclick="playTrack(${i})">${i + 1}. ${t.name}</div>`
  ).join('');
}

function playTrack(index) {
  if (song) song.stop();
  currentIndex = index;

  song = loadSound(playlist[index].url, () => {
    // Устанавливаем громкость из слайдера перед стартом
    let currentVol = document.getElementById('volume-slider').value;
    song.setVolume(parseFloat(currentVol));

    song.play();
    document.getElementById('track-info').innerText = playlist[index].name;
    document.getElementById('play-btn').innerText = "PAUSE";
    renderPlaylist();
  });
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
  document.getElementById('shuffle-btn').innerText = `SHUFFLE: ${isShuffle ? 'ON' : 'OFF'}`;
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

    // --- СИНХРОНИЗАЦИЯ ЗВЕЗД С МУЗЫКОЙ ---
    if (starElements.length > 0 && song && song.isPlaying()) {
      let trb = fft.getEnergy("treble"); // Высокие частоты для искр
      let mid = fft.getEnergy("mid");    // Средние для общей яркости

      // Глобальный сдвиг цвета (такой же, как у лучей твоего Сердца)
      let globalHue = (frameCount * 0.5) % 360;

      starElements.forEach((star, i) => {
        // 1. ЦВЕТ: Каждая звезда имеет свой оттенок, но все они крутятся радугой
        let h = (globalHue + i * 2) % 360;

        // 2. МЕРЦАНИЕ: Базовая яркость от Treble + индивидуальный "пульс"
        // Чем сильнее "цикают" высокие, тем ярче вспыхивают звезды
        let baseOp = map(trb, 0, 255, 0.05, 0.7);
        let pulse = sin(frameCount * 0.15 + i) * 0.25; // Быстрое мерцание
        let finalOp = constrain(baseOp + pulse, 0.05, 1.0);

        // 3. СВЕЧЕНИЕ: На пиках звука звезды раздуваются неоном
        let glowSize = map(trb, 0, 255, 0, 15);

        // Применяем стили напрямую (без задержек CSS)
        star.style.backgroundColor = `hsl(${h}, 90%, 85%)`;
        star.style.opacity = finalOp;
        star.style.boxShadow = `0 0 ${glowSize}px hsl(${h}, 100%, 50%)`;

        // Микро-всплеск размера на сильных частотах
        let scale = map(mid, 0, 255, 0.8, 1.3);
        star.style.transform = `scale(${scale})`;
      });
    }

  }

  // --- ГРИБНИЦА 8.0 // RAINBOW_HYPER_FLOW ---
  
  translate(width / 2, height / 2);
  // Вращение теперь медленное, создает спираль
  rotate(-11);

  const numRays = 511;
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
    let targetR = 70 + (specVal * 1.2) + (bass * 0.2);

    // Плавность хода (Lerp)
    smoothR[i] = lerp(smoothR[i], targetR, 0.12);
    // smoothR[i] = targetR

    // 3. АМПЛИТУДНОЕ "ТУДА-СЮДА" (Вибрация кончиков)
    let wave = sin(frameCount * 0.1 + i) * map(treble, 0, 255, 0, 15);
    let finalR = smoothR[i] + wave;

    let x = finalR * cos(angle);
    let y = finalR * sin(angle);

    // 4. ОТРИСОВКА (Градиентный эффект)
    // Рисуем основной луч
    stroke(hue, 90, 100, map(specVal, 0, 255, 40, 100));
    strokeWeight(map(specVal, 0, 255, 1, 4));

    line(cos(angle) * 60, sin(angle) * 110, x, y);

    // 5. КИСЛОТНЫЕ ВСПЫШКИ (Нейроны)
    if (specVal > 140) {
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

  // Центральное "Очко" теперь тоже живое
  noFill();
  stroke((frameCount) % 360, 80, 100, 30);
  strokeWeight(2);
  ellipse(0, 0, 100 + bass / 5, 100 + bass / 5);
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
    document.getElementById('sync-btn').innerText = "SYSTEM_SYNC: ACTIVE";
    document.getElementById('sync-btn').style.background = "var(--sky)";
    document.getElementById('sync-btn').style.color = "#000";
    document.getElementById('track-info').innerText = "EXTERNAL_AUDIO_STREAM";

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

  // 3. УНИВЕРСАЛЬНЫЕ ЗВЕЗДЫ (Работают ВСЕГДА: Idle, MP3, Browser)
  if (starElements.length > 0) {
    let globalHue = (frameCount * 0.3) % 360; // Медленное радужное переливание

    starElements.forEach((star, i) => {
      // ЦВЕТ: Мягкая радуга (всегда цветные, никогда не серые)
      let h = (globalHue + i * 2) % 360;

      // МЕРЦАНИЕ: 
      // Базовое (успокаивающее) + от высоких частот (искры)
      let idlePulse = sin(frameCount * 0.05 + i) * 0.15; 
      let activePulse = map(treble, 0, 255, 0, 0.6);
      let finalOp = constrain(0.2 + idlePulse + activePulse, 0.1, 1.0);

      // ПУЛЬСАЦИЯ ОТ БАС-БОЧКИ:
      // На ударе баса звезды слегка увеличиваются (эффект дыхания космоса)
      let bassBoost = map(bass, 180, 255, 0, 0.8); 
      let scale = map(mid, 0, 255, 0.9, 1.2) + bassBoost;

      // СВЕЧЕНИЕ (BLOOM):
      let glowSize = map(treble, 0, 255, 2, 12);

      // Применяем стили
      star.style.backgroundColor = `hsl(${h}, 80%, 80%)`;
      star.style.opacity = finalOp;
      star.style.boxShadow = `0 0 ${glowSize}px hsl(${h}, 100%, 50%)`;
      star.style.transform = `scale(${scale})`;
    });
  }



  // --- 3. БЛОК ЗВЕЗД (УНИВЕРСАЛЬНЫЙ РЕЗОНАНС) ---
if (starElements.length > 0) {
    // Получаем энергию (теперь она идет и из браузера, т.к. анализ вверху)
    let trb = fft.getEnergy("treble"); 
    let bass = fft.getEnergy("bass");
    let mid = fft.getEnergy("mid");

    let globalHue = (frameCount * 0.4) % 360; 

    starElements.forEach((star, i) => {
        let h = (globalHue + i * 5) % 360;
        
        // БРИЛЛИАНТОВЫЙ БЛЕСК: на высоких (treble) убираем цвет в белый
        let sat = map(trb, 150, 255, 80, 0); 
        let brt = map(trb, 100, 255, 70, 100);

        // МЕРЦАНИЕ: Быстрый искрящийся синус
        let flicker = sin(frameCount * 0.2 + i) * 0.3;
        // Работает даже если музыка на паузе (0.1), но вспыхивает от звука
        let op = constrain(0.2 + flicker + map(trb, 0, 255, 0, 0.6), 0.1, 1.0);

        // ПУЛЬСАЦИЯ ОТ БОЧКИ (Взрыв на пол-экрана)
        // Если бас мощный (kick), звезды резко увеличиваются
        let bassBoost = map(bass, 190, 255, 1, 1.6); 
        let s = map(mid, 0, 255, 0.8, 1.1) * bassBoost;

        // СВЕЧЕНИЕ (BLOOM)
        let glow = map(trb, 150, 255, 2, 20);

        // ПРИМЕНЯЕМ (Чистый HSL без тормозов CSS)
        star.style.backgroundColor = `hsl(${h}, ${sat}%, ${brt}%)`;
        star.style.opacity = op;
        star.style.boxShadow = `0 0 ${glow}px hsl(${h}, 100%, 70%)`;
        star.style.transform = `scale(${s})`;
    });
}
// --- АВТОНОМНЫЙ КОСМОС (SYNC: ACTIVE) ---
if (starElements.length > 0) {
    let trb = fft.getEnergy("treble"); 
    let bass = fft.getEnergy("bass");
    let mid = fft.getEnergy("mid");

    // Вращение (Частота Curiosity L2-2)
    let globalHue = (frameCount * 0.4) % 360; 

    starElements.forEach((star, i) => {
        let h = (globalHue + i * 5) % 360;
        
        // БРИЛЛИАНТОВЫЙ БЛЕСК (Эффект 2026)
        // На пиках Treble уходим в белый (Saturation 0%)
        let sat = map(trb, 150, 255, 80, 0); 
        let brt = map(trb, 100, 255, 75, 100);

        // ИСКРЕНИЕ (Острое мерцание)
        let flicker = sin(frameCount * 0.3 + i) * 0.4;
        let op = constrain(0.3 + flicker + map(trb, 0, 255, 0, 0.6), 0.1, 1.0);

        // УДАРНАЯ ВОЛНА (Пульсация от Бас-бочки)
        // Звезды "взрываются" вперед на каждом Kick
        let bassBoost = map(bass, 190, 255, 0, 0.7); 
        let s = (map(mid, 0, 255, 0.8, 1.1) + bassBoost);

        // СВЕЧЕНИЕ (BLOOM)
        let glowSize = map(trb, 150, 255, 2, 20);

        // ПРИМЕНЯЕМ СТИЛИ (Direct DOM Injection)
        star.style.backgroundColor = `hsl(${h}, ${sat}%, ${brt}%)`;
        star.style.opacity = op;
        star.style.boxShadow = `0 0 ${glowSize}px hsl(${h}, 100%, 70%)`;
        star.style.transform = `scale(${s})`;
    });
}


if (mid > 150 && frameCount % 2 === 0) {
    let synthEnergy = map(mid, 150, 255, 0, 1);
    
    // Выбираем случайную точку на твоем басовом кольце
    let ringR = (100 + bass / 5) / 2;
    let angle = random(TWO_PI);
    
    // Точка удара на кольце
    let targetX = ringR * cos(angle);
    let targetY = ringR * sin(angle);
    
    // ЦВЕТ: Привязываем цвет молнии к высоте звука (Treble)
    // Чем выше синтезатор, тем холоднее/светлее молния
    let synthHue = (map(treble, 0, 255, 0, 100) + frameCount) % 360;

    // Рождаем молнию (0,0 -> цель на кольце)
    lightning.push(new Bolt(0, 0, targetX, targetY, synthHue));
  }