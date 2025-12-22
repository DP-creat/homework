document.addEventListener('DOMContentLoaded', () => {
    const starsLayer = document.getElementById('stars-layer');
    const container = document.querySelector('.galaxy-container');

    // 1. Создаем 150 звезд
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Случайный размер и позиция
        const size = Math.random() * 2 + 1 + 'px';
        star.style.width = size;
        star.style.height = size;
        star.style.top = Math.random() * 100 + 'vh';
        star.style.left = Math.random() * 100 + 'vw';
        
        // Случайная задержка анимации мерцания
        star.style.setProperty('--duration', Math.random() * 3 + 2 + 's');
        star.style.animationDelay = Math.random() * 5 + 's';
        
        starsLayer.appendChild(star);
    }

    // 2. Включаем сияние по клику
    container.addEventListener('click', () => {
        container.classList.add('aurora-active');
        
        // Скрываем подсказку
        const hint = document.querySelector('.click-hint');
        hint.style.opacity = '0';
        setTimeout(() => { hint.style.display = 'none'; }, 1000);

        // Показываем личное сообщение через 3 секунды
        const message = document.getElementById('personal-message');
        setTimeout(() => {
            message.classList.add('show-message');
        }, 3000); 
    });
    container.addEventListener('click', () => {
        // 1. Включаем сияние
        container.classList.add('aurora-active');
        
        // 2. Убираем подсказку "Коснись неба"
        const hint = document.querySelector('.click-hint');
        hint.style.opacity = '0';

        // 3. Работаем с сообщением
        const message = document.getElementById('personal-message');
        
        // Через 3 секунды плавно ПОКАЗЫВАЕМ
        setTimeout(() => {
            message.classList.add('show-message');
        }, 3000);

        // Через 13 секунд (3с появления + 10с чтения) плавно СКРЫВАЕМ
        setTimeout(() => {
            message.classList.remove('show-message');
            message.classList.add('fade-out');
        }, 13000); 
    });
});