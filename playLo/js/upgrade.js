  const numRays = 1023;
  for (let i = 0; i < numRays; i++) {
    let specIdx = i;
    if (i > floor(numRays / 2)) specIdx = (numRays - 1) - i;

    let angle = map(i, 0, numRays - 1, 0, TWO_PI);
    let specVal = spectrum[specIdx];
    let hue = (map(i, 0, numRays, 0, 360) + frameCount * 0.5) % 360;

    // 1. ПЕРЕНОСИМ ФОРМУ СЕРДЦА СЮДА (Умножаем синус угла для вытянутости по вертикали)
    // Коэффициент 1.4 регулирует удлинение половинок. Подбери под свой вкус!
    let heartShape = map(abs(sin(angle)), 0, 1, 1.0, 1.4); 

    // Базовая длина луча + частоты, умноженные на форму сердца
    let targetR = (60 + (specVal * 1.6) + (bass * 0.2)) * heartShape;
    
    smoothR[i] = lerp(smoothR[i], targetR, 0.12);
    let wave = sin(frameCount * 0.01 + i) * map(treble, 0, 255, 0, 15);
    let finalR = smoothR[i] + wave;

    let x = finalR * cos(angle);
    let y = finalR * sin(angle);

    // 2. ИДЕАЛЬНОЕ КРУГЛОЕ ЯДРО (Радиус 50 вместо эллипса 46х110)
    // Теперь все лучи стартуют из ровного кольца, и гребень физически исчезает!
    stroke(hue, 90, 100, map(specVal, 0, 255, 40, 100));
    strokeWeight(map(specVal, 0, 255, 1, 4));
    line(cos(angle) * 50, sin(angle) * 50, x, y);

    // Кислотные вспышки
    if (specVal > 130) {
      let flashHue = (hue + 90) % 360;
      noStroke();
      fill(flashHue, 80, 100, 100);
      ellipse(x, y, map(specVal, 0, 255, 3, 10));
      fill(flashHue, 100, 100, 25);
      ellipse(x, y, map(specVal, 0, 255, 8, 25));
    }
  }
