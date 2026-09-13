(function () {
  let chronoInterval = null;
  let chronoSeconds = 0;

  // 1. Твой оригинальный алгоритм расчета ресурса дня (7:00 - 23:00)
  const getDayResource = () => {
    const now = new Date();
    const nowMs = now.getTime();
    const startMs = new Date(now).setHours(7, 0, 0, 0);
    const endMs = new Date(now).setHours(23, 0, 0, 0);

    if (nowMs < startMs) return "100%";
    if (nowMs > endMs) return "0%";

    const totalMs = endMs - startMs;
    const remainingMs = endMs - nowMs;

    const percent = Math.round((remainingMs / totalMs) * 100);
    return `${percent}%`;
  };

  // 2. Функция обновления дефолтного состояния (Ресурс дня)
  window.updateScannerDisplay = () => {
    const scanner = document.querySelector('.core-scanner');
    if (!scanner) return;

    // Обновляем только если секундомер НЕ запущен и НЕ в режиме готовности
    if (!scanner.classList.contains('active') && !scanner.classList.contains('running')) {
      const valEl = scanner.querySelector('.core-value');
      const labEl = scanner.querySelector('.core-label');

      if (valEl) valEl.innerText = getDayResource();
      if (labEl) labEl.innerText = "RESOURCE";

      // Затухание таймера в шапке, когда система спит (опционально)
      const headerChrono = document.getElementById('core-value');
      if (headerChrono) headerChrono.innerText = "00:00";
    }
  };

  // 3. Твоя трехступенчатая система toggleChrono
  window.toggleChrono = () => {
    const scanner = document.querySelector('.core-scanner');
    if (!scanner) return;

    const ring = scanner.querySelector('.scan-ring');
    const label = scanner.querySelector('.core-label');
    const value = scanner.querySelector('.core-value');
    const headerChrono = document.getElementById('core-value'); // Табло в шапке

    // --- СОСТОЯНИЕ 1 ➔ СОСТОЯНИЕ 2 (Включение режима READY) ---
    if (!scanner.classList.contains('active')) {
      scanner.classList.add('active');
      if (ring) ring.style.boxShadow = "0 0 20px var(--cyan)";
      if (label) label.innerText = "STATUS";
      if (value) value.innerText = "00:00";
      return;
    }

    // --- СОСТОЯНИЕ 2 ➔ СОСТОЯНИЕ 3 (Запуск вращения и таймера в шапке) ---
    if (!scanner.classList.contains('running')) {
      scanner.classList.add('running');
      if (ring) ring.style.animationPlayState = "running";
      if (label) label.innerText = "TIMING";
      if (label) label.innerText = "";

      // Запускаем интервал, который штампует секунды в ХЕДЕР
      chronoInterval = setInterval(() => {
        chronoSeconds++;
        const mins = Math.floor(chronoSeconds / 60).toString().padStart(2, '0');
        const secs = (chronoSeconds % 60).toString().padStart(2, '0');

        // Выводим время ТУДА, КУДА НАДО — в шапку хедера!
        if (value) value.innerText = `${mins}:${secs}`;
      }, 1000);
    }
    // --- СОСТОЯНИЕ 3 ➔ СБРОС В ДЕФОЛТ (Выключение) ---
    else {
      // 1. МГНОВЕННО очищаем интервал времени
      clearInterval(chronoInterval);
      chronoInterval = null;
      chronoSeconds = 0;

      // 2. СНАЧАЛА принудительно гасим и схлопываем кольцо, убирая классы
      scanner.classList.remove('running', 'active');
      if (ring) {
        ring.style.animationPlayState = "paused";
        ring.style.boxShadow = "none";
      }

      // 3. ФИКС АНИМАЦИИ: Возвращаем текст процентов только после того,
      // как кольцо полностью исчезло с экрана (через 400мс, время твоей CSS-анимации)
      setTimeout(() => {
        // Проверяем, не включил ли пользователь сканер заново за эти 400мс
        if (!scanner.classList.contains('active') && !scanner.classList.contains('running')) {
          window.updateScannerDisplay();
        }
      }, 150); // 400мс идеально совпадает с переходом в твоем CSS (transition 0.4s)
    }
  };

  // Автоматический старт трекера ресурса при загрузке страницы
  document.addEventListener('DOMContentLoaded', () => {
    window.updateScannerDisplay();
    setInterval(window.updateScannerDisplay, 60000); // Апдейт ресурса раз в минуту
  });
})();