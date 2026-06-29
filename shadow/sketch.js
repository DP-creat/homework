let isHolding = false;
let score = 0;
let centerX, centerY;
let shadows = [];
let gameOver = false;
let centerRadius = 25; // Размер точки под фалангу
let grabRadius = 60;   // Чуть больший радиус для удержания
let highScore = 0;
let isRestored = false; 

function setup() {
    createCanvas(windowWidth, windowHeight);
    centerX = width / 2;
    centerY = height / 2;
    noStroke();

    // Загружаем рекорд из памяти браузера при старте игры
    let savedScore = localStorage.getItem('shadow_perimeter_highscore');
    if (savedScore !== null) {
        highScore = parseInt(savedScore);
    }

    // Загружаем текущие очки (на чем остановился игрок)
    let savedCurrentScore = localStorage.getItem('shadow_perimeter_currentscore');
    if (savedCurrentScore !== null) {
        score = parseInt(savedCurrentScore);
        if (score > 0) {
            isRestored = true; 
            let infoText = document.getElementById('info-text');
            if (infoText) {
                infoText.innerText = "ПРОДОЛЖАЙ УДЕРЖАНИЕ!";
                infoText.style.color = "blue";
            }
        }
    }

    // Сразу отображаем актуальный рекорд
    updateScoreUI();
}

function updateScoreUI() {
    let scoreText = document.getElementById('score-text');
    if (scoreText) {
        scoreText.innerText = `Очки: ${score} | Рекорд: ${highScore}`;
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

    // Отрисовка зоны захвата
    if (isHolding) {
        fill(30, 30, 30, 30);
        ellipse(centerX, centerY, centerRadius * 3, centerRadius * 3);
    } else {
        fill(200, 200, 200, 40);
        ellipse(centerX, centerY, centerRadius * 3, centerRadius * 3);
    }
    fill(0);
    ellipse(centerX, centerY, centerRadius * 2, centerRadius * 2);

    // Мониторинг тач-событий
    checkTouch();

    // Тени спавнятся и очки идут ТОЛЬКО при удержании пальца
    if (isHolding) {
        if (random(1) < 0.04 && shadows.length < 5) {
            shadows.push(new Shadow());
        }
        
        if (frameCount % 60 === 0) {
            score++;
            updateScoreUI();
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
    let infoText = document.getElementById('info-text');
    if (infoText) infoText.style.opacity = '1';

    let someoneIsAttacking = shadows.some(s => s.isAttacking);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('shadow_perimeter_highscore', highScore);
    }

    if (someoneIsAttacking) {
        localStorage.setItem('shadow_perimeter_currentscore', score);
        if (infoText) {
            infoText.innerText = "УСПЕЛ! ДЕРЖИ СНОВА";
            infoText.style.color = "green";
        }
    } else {
        score = 0;
        localStorage.setItem('shadow_perimeter_currentscore', 0);
        updateScoreUI();
        if (infoText) {
            if (shadows.length === 0) {
                infoText.innerText = "ТУТ НИКОГО НЕТ! ЗАЖМИ ЦЕНТР";
                infoText.style.color = "#1a1a1a";
            } else {
                infoText.innerText = "РАНО УБРАЛ! СБРОС ОЧКОВ";
                infoText.style.color = "orange";
            }
        }
    }

    shadows.forEach(s => s.triggerFlee());
}

function triggerGameOver() {
    gameOver = true;
    isHolding = false;
    isRestored = false;
    shadows = [];
    background(0); 
    
    let infoText = document.getElementById('info-text');
    if (infoText) {
        infoText.style.opacity = '1';
        infoText.innerText = "ПОЙМАН!";
        infoText.style.color = "red";
    }
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('shadow_perimeter_highscore', highScore);
    }

    score = 0;
    localStorage.setItem('shadow_perimeter_currentscore', 0);
    
    setTimeout(() => {
        gameOver = false;
        updateScoreUI();
        if (infoText) {
            infoText.innerText = "ЗАЖМИ ПАЛЕЦ В ЦЕНТРЕ";
            infoText.style.color = "#1a1a1a";
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
        
        this.patrolSpeed = random(0.004, 0.010) * (random(1) > 0.5 ? 1 : -1);
        this.breatheSpeed = random(0.09, 0.15);
        this.breatheAmp = random(3, 8);
        
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

            if (frameCount > this.attackTimer && isHolding && !shadows.some(s => s.isAttacking)) {
                this.isAttacking = true;
            }
        } else {
            this.attackProgress += random(0.02, 0.04); 
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
