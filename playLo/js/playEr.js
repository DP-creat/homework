window.playerData = {
  song: null,
  playlist: [],
  shuffledIndices: [],
  currentIndex: 0,
  isShuffle: false,
  playerState: 0, // 0 - стоп, 1 - игра, 2 - пауза
  searchQuery: ""
};
// Загрузка папки
// Загрузка папки
function loadFolder(e) {

  // const loadBtn = document.querySelector('.btnEr');
  // if (loadBtn) loadBtn.innerText = "loadFolder";


  const files = Array.from(e.target.files).filter(f => f.type.startsWith('audio/'));
  if (files.length === 0) return;

  // Записываем список файлов в ОБЩЕЕ хранилище
  window.playerData.playlist = files.map(file => ({
    name: file.name.replace(/\.[^/.]+$/, ""),
    url: URL.createObjectURL(file)
  }));

  renderPlaylist();
  playTrack(0);

  // Проверяем режим перемешивания из ОБЩЕГО хранилища
  if (window.playerData.isShuffle) {
    shufflePlaylist();
  }
}

function updateVolume(val) {
  // Проверяем наличие песни в ОБЩЕМ хранилище
  if (window.playerData.song) {
    window.playerData.song.setVolume(parseFloat(val));
  }
  // Обновляем текстовый процент (визуал)
  const volEl = document.getElementById('vol-value');
  if (volEl) volEl.innerText = Math.round(val * 100) + "%";
}

function handleSearch(val) {
  // Записываем запрос в ОБЩЕЕ хранилище, чтобы фильтрация сработала везде
  window.playerData.searchQuery = val.toLowerCase();

  // Перерисовываем список, который теперь будет опираться на window.playerData.searchQuery
  renderPlaylist();
}

function renderPlaylist() {
  const container = document.getElementById('playlist');
  const searchInput = document.getElementById('playlist-search');
  if (!container) return; // Страховка, если панели нет в DOM

  // 1. Фильтруем, обращаясь к ОБЩЕМУ плейлисту и ОБЩЕМУ поиску
  const filtered = window.playerData.playlist.filter(t =>
    t.name.toLowerCase().includes(window.playerData.searchQuery)
  );

  // 2. Логика видимости поиска через ОБЩИЙ запрос
  if (searchInput && window.playerData.searchQuery.length > 0) {
    searchInput.style.opacity = "1";
    searchInput.style.visibility = "visible";
    searchInput.style.height = "32px";
  }

  // 3. Собираем HTML, сопоставляя индексы с ОБЩЕЙ базой
  container.innerHTML = filtered.map((t, i) => {
    // Находим реальный индекс в ОБЩЕМ массиве
    const originalIndex = window.playerData.playlist.indexOf(t);
    // Сверяем с ОБЩИМ текущим треком
    const isActive = originalIndex === window.playerData.currentIndex;

    return `<div class="track-item ${isActive ? 'active' : ''}" 
                 onclick="playTrack(${originalIndex})">
              ${originalIndex + 1}. ${t.name}
            </div>`;
  }).join('');
}

function playTrack(index) {
  // 1. Останавливаем старую песню из ОБЩЕГО хранилища
  if (window.playerData.song) window.playerData.song.stop();

  // 2. Обновляем текущий индекс в ОБЩЕМ хранилище
  window.playerData.currentIndex = index;
  renderPlaylist();

  // 3. Загружаем новую песню ПРЯМО в ОБЩЕЕ хранилище
  window.playerData.song = loadSound(window.playerData.playlist[index].url, () => {

    // Берем громкость
    let currentVol = document.getElementById('volume-slider').value;

    // Обращаемся к ОБЪЕКТУ для настройки звука
    window.playerData.song.setVolume(parseFloat(currentVol));
    window.playerData.song.play();
    const info = document.getElementById('track-info');
    if (info) {
      info.innerText = window.playerData.playlist[index].name;
      info.classList.add('active'); // КРИТИЧНО: активируем "маяк" для CSS
    }
    // Обновляем текст, беря имя из ОБЩЕГО плейлиста
    document.getElementById('track-info').innerText = window.playerData.playlist[index].name;
    document.getElementById('play-btnEr').innerText = "PAUSE";
  });

  // Внутренняя функция (может остаться такой, она просто меняет текст)
  function updateTrackInfo(name) {
    const info = document.getElementById('track-info');
    if (info) info.innerText = name;
  }
  document.body.classList.add('track-is-playing');
}
// ******************************************
window.togglePlay = () => {
  if (!window.playerData.song) return;

  const info = document.getElementById('track-info');
  
  if (window.playerData.song.isPlaying()) {
    window.playerData.song.pause();
    window.playerData.playerState = 2; // Пауза

    if (info) info.style.opacity = "1";
    // Убираем "играющий" статус с тела, если хочешь, чтобы кнопки возвращались на паузе
    document.body.classList.remove('track-is-playing');
  } else {
    window.playerData.song.play();
    window.playerData.playerState = 1; // Играет
    if (info) {
        info.style.opacity = "1";
        info.classList.add('active'); // Гарантируем наличие класса
    }
    document.body.classList.add('track-is-playing');
  }
};

window.nextTrack = () => {
  if (window.playerData.isShuffle) {
    if (window.playerData.shuffledIndices.length === 0) shufflePlaylist();
    let nextIndex = window.playerData.shuffledIndices.shift();
    if (nextIndex === window.playerData.currentIndex && window.playerData.shuffledIndices.length > 0) {
      window.playerData.shuffledIndices.push(nextIndex);
      nextIndex = window.playerData.shuffledIndices.shift();
    }
    playTrack(nextIndex);
  } else {
    if (window.playerData.playlist.length > 0) {
      let next = (window.playerData.currentIndex + 1) % window.playerData.playlist.length;
      playTrack(next);
    }
  }
};

window.prevTrack = () => {
  if (window.playerData.playlist.length > 0) {
    let prev = (window.playerData.currentIndex - 1 + window.playerData.playlist.length) % window.playerData.playlist.length;
    playTrack(prev);
  }
};

function toggleShuffle() {
  // 1. Меняем значение в общем хранилище
  window.playerData.isShuffle = !window.playerData.isShuffle;

  // 2. Если включили — запускаем перетасовку
  if (window.playerData.isShuffle) shufflePlaylist();

  const btnEr = document.getElementById('shuffle-btnEr');
  if (btnEr) {
    // 3. Обновляем текст, беря данные из хранилища
    btnEr.innerText = `shuff: ${window.playerData.isShuffle ? 'on' : 'off'}`;
    btnEr.classList.toggle('active');
  }
}

function shufflePlaylist() {
  // 1. Проверяем, есть ли что перемешивать в ОБЩЕМ плейлисте
  if (window.playerData.playlist.length === 0) return;

  // 2. Создаем массив индексов [0, 1, 2, ...] в ОБЩЕМ хранилище
  window.playerData.shuffledIndices = window.playerData.playlist.map((_, i) => i);

  // 3. Алгоритм Фишера-Йейтса (честный рандом)
  // Работаем напрямую с window.playerData.shuffledIndices
  for (let i = window.playerData.shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Деструктурирующее присваивание для обмена элементов
    [window.playerData.shuffledIndices[i], window.playerData.shuffledIndices[j]] =
      [window.playerData.shuffledIndices[j], window.playerData.shuffledIndices[i]];
  }
}

function seek(e) {
  // 1. Проверяем наличие песни в ОБЩЕМ хранилище
  if (!window.playerData.song) return;

  const container = document.getElementById('progress-container');
  if (!container) return;

  // 2. Вычисляем процент клика относительно ширины контейнера
  const rect = container.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;

  // 3. Прыгаем в нужный момент времени, используя данные из ОБЩЕГО хранилища
  const jumpTime = window.playerData.song.duration() * percent;
  window.playerData.song.jump(jumpTime);
}



window.updateAudioUI = () => {
  // 1. Проверяем наличие и состояние песни в ОБЩЕМ хранилище
  if (window.playerData.song && window.playerData.song.isPlaying()) {

    let currentTime = window.playerData.song.currentTime();
    let duration = window.playerData.song.duration();

    // 2. ПРОГРЕСС-БАР: считаем процент (p)
    let p = (currentTime / duration) * 100;
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = p + '%';

    // 3. ТАЙМЕРЫ: форматируем и выводим цифры
    const currEl = document.getElementById('current-time');
    const remEl = document.getElementById('remaining-time');

    if (currEl) currEl.innerText = formatTime(currentTime);
    if (remEl) remEl.innerText = "-" + formatTime(duration - currentTime);

    // 4. АВТОПЕРЕХОД: если трек дополз до финала (с запасом 0.1с)
    if (currentTime >= duration - 0.1) {
      nextTrack();
    }
  }
}


function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  return mins.toString().padStart(2, '0') + ":" + secs.toString().padStart(2, '0');
}


//====================== захвата потока
async function syncSystemAudio() {
  try {
    // 1. Захват потока (Браузер попросит выбрать окно/вкладку)
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    // 2. Будим аудио-контекст p5.js
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // 3. Создаем источник и подключаем к FFT (нашему анализатору)
    const source = ctx.createMediaStreamSource(stream);

    // Переключаем "уши" визуализатора на системный поток
    // Важно: переменная fft должна быть доступна в этом файле
    if (typeof fft !== 'undefined') {
      fft.setInput(source);
    }

    // 4. Обновляем статус в window.playerData (чтобы система знала, что мы в режиме стрима)
    window.playerData.playerState = 1;

    // 5. Визуальный фидбек в HUD
    const syncbtnEr = document.getElementById('sync-btnEr');
    // const trackInfo = document.getElementById('track-info');
    const loadBtn = document.getElementById('load-btnEr'); // Находим твой Label

    if (syncbtnEr) {
      syncbtnEr.innerText = "go";
      syncbtnEr.style.textShadow = "0 0 15px var(--cyan)";
      syncbtnEr.style.color = "var(--accent)";
    }
    // if (trackInfo) {
    //   trackInfo.innerText = "stream";
    // }
    // МЕНЯЕМ ТЕКСТ КНОПКИ НА "LF"
    if (loadBtn) {
      loadBtn.innerText = "lf";
    }
  } catch (err) {
    console.error("Sync Error:", err);
    alert("Для синхронизации выберите вкладку и активируйте 'Доступ к аудио'");
  }
  document.body.classList.add('track-is-playing');
}


// **********вешает состояния**********************************
function handleMainClick() {
  const layer = document.getElementById('ui-layer');
  const mainbtnEr = document.querySelector('.main-circle-btnEr');
  const btnErText = document.getElementById('main-btnEr-text');

  // 1. Циклическое переключение (0-1-2) в ОБЩЕМ хранилище
  window.playerData.playerState = (window.playerData.playerState + 1) % 3;

  // 2. Синхронизация визуальных состояний слоя
  if (layer) {
    // Сбрасываем старые классы анимации
    layer.classList.remove('state-1', 'state-2');

    // Если состояние > 0 (READY или RUNNING), добавляем нужный класс
    if (window.playerData.playerState > 0) {
      layer.classList.add(`state-${window.playerData.playerState}`);
    }
  }

  // 3. (Опционально) Обновление текста центральной кнопки
  if (btnErText) {
    const states = ["", "", ""];
    btnErText.innerText = states[window.playerData.playerState];
  }
}


// **************************************************
// **************************************************
// ТАЧ СТАРТ

window.initTrackSlider = () => {
  const wrapper = document.getElementById('track-info-wrapper');
  if (!wrapper) return;

  let startX = 0;

  // --- МЫШЬ (Десктоп) ---
  wrapper.onmousedown = (e) => { startX = e.clientX; };
  wrapper.onmouseup = (e) => { 
    handleFinalLogic(startX - e.clientX); 
  };

  // --- ТАЧ (Мобилки) ---
  wrapper.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: false });

  wrapper.addEventListener('touchend', (e) => {
    // Останавливаем "фантомные" клики и скролл
    if (e.cancelable) e.preventDefault(); 
    e.stopPropagation();

    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    handleFinalLogic(diff);
  }, { passive: false });

  function handleFinalLogic(diff) {
    // Порог свайпа
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        if (window.nextTrack) window.nextTrack();
      } else {
        if (window.prevTrack) window.prevTrack();
      }
    } else {
      // Это ТАП
      console.log("ARC-9: Tap Triggered");
      if (typeof window.togglePlay === 'function') {
        window.togglePlay();
      }
    }
  }
};
// Запуск строго после загрузки DOM
document.addEventListener('DOMContentLoaded', window.initTrackSlider);