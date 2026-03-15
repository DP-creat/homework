let song, fft;
    let playlist = [];
    let shuffledIndices = [];
    let currentIndex = 0;
    let isShuffle = false;
    let smoothR = new Array(511).fill(0); // Хранилище инерции для 255 лучей


    function setup() {
      createCanvas(windowWidth, windowHeight);
      fft = new p5.FFT(0.8, 256);
      colorMode(HSB, 360, 100, 100, 100);
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

      // --- ГРИБНИЦА 8.0 // RAINBOW_HYPER_FLOW ---
    let spectrum = fft.analyze();
    let bass = fft.getEnergy("bass");
    let mid = fft.getEnergy("mid");
    let treble = fft.getEnergy("treble");

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
        let targetR = 60 + (specVal * 1.2) + (bass * 0.3);
        
        // Плавность хода (Lerp)
        smoothR[i] = lerp(smoothR[i], targetR, 0.12);

        // 3. АМПЛИТУДНОЕ "ТУДА-СЮДА" (Вибрация кончиков)
        let wave = sin(frameCount * 0.1 + i) * map(treble, 0, 255, 0, 15);
        let finalR = smoothR[i] + wave;

        let x = finalR * cos(angle);
        let y = finalR * sin(angle);

        // 4. ОТРИСОВКА (Градиентный эффект)
        // Рисуем основной луч
        stroke(hue, 90, 100, map(specVal, 0, 255, 40, 100));
        strokeWeight(map(specVal, 0, 255, 1, 4));
        
        line(cos(angle) * 6, sin(angle) * 6, x, y);

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
    ellipse(0, 0, 100 + bass/5, 100 + bass/5);
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