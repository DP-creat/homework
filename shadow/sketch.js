let isHolding = false;
let score = 0;
let centerX, centerY;
let shadows = [];
let gameOver = false;
let centerRadius = 25; // Размер точки под фалангу
let grabRadius = 60;   // Чуть больший радиус для удержания (чтобы палец не соскакивал случайно)
let smoothR = []; // Массив для плавного лерпа теней
let highScore = 0;
let isRestored = false; // Флаг: восстановили ли очки из памяти

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
    // Сразу отображаем актуальный рекорд
    updateScoreUI();
}
// Вспомогательная функция для обновления текста на экране
function updateScoreUI() {
    document.getElementById('score-text').innerText = `Очки: ${score} | Рекорд: ${highScore}`;
}

function draw() {
    if (gameOver) {
        background(0);
        return;
    }
    
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

    if (isHolding) {
        if (random(1) < 0.04 && shadows.length < 5) {
            shadows.push(new Shadow());
        }
        
        if (frameCount % 60 === 0) {
            score++;
            updateScoreUI();
        }
    }

    for (let i = shadows.length - 1; i >= 0; i--) {
        shadows[i].update();
        shadows[i].draw();

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
                isRestored = false; // Игрок нажал на экран, статус восстановления снимается
                document.getElementById('info-text').style.opacity = '0';
            }
        } else {
            if (d > grabRadius) {
                playerDroppedFinger();
            }
        }
    } else {
        // Если палец поднят, но мы реально УДЕРЖИВАЛИ его прямо сейчас
        if (isHolding) {
            playerDroppedFinger();
        }
        // Если игра просто запустилась с восстановленными очками, этот блок больше ничего не сбрасывает!
    }
}


function triggerGameOver() {
    gameOver = true;
    isHolding = false;
    isRestored = false;
    shadows = [];
    background(0); 
    document.getElementById('info-text').style.opacity = '1';
    document.getElementById('info-text').innerText = "ПОЙМАН!";
    document.getElementById('info-text').style.color = "red";
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('shadow_perimeter_highscore', highScore);
    }

    score = 0;
    localStorage.setItem('shadow_perimeter_currentscore', 0);
    
    setTimeout(() => {
        gameOver = false;
        updateScoreUI();
        document.getElementById('info-text').innerText = "ЗАЖМИ ПАЛЕЦ В ЦЕНТРЕ";
        document.getElementById('info-text').style.color = "#1a1a1a";
    }, 2000);
}
function playerDroppedFinger() {
    isHolding = false;
    document.getElementById('info-text').style.opacity = '1';

    let someoneIsAttacking = shadows.some(s => s.isAttacking);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('shadow_perimeter_highscore', highScore);
    }

    if (someoneIsAttacking) {
        // Записываем очки в память ТОЛЬКО при успешном уклонении
        localStorage.setItem('shadow_perimeter_currentscore', score);
        document.getElementById('info-text').innerText = "УСПЕЛ! ДЕРЖИ СНОВА";
        document.getElementById('info-text').style.color = "green";
    } else {
        score = 0;
        localStorage.setItem('shadow_perimeter_currentscore', 0);
        updateScoreUI();
        document.getElementById('info-text').innerText = "РАНО УБРАЛ! СБРОС ОЧКОВ";
        document.getElementById('info-text').style.color = "orange";
    }

    shadows.forEach(s => s.triggerFlee());
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

        // ИСПОЛЬЗУЕМ smoothR: Массив для хранения истории позиций головы щупальца
        this.smoothR = [];
        this.maxTrailLength = 8; // Длина физического хвоста
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
        
        return {
            x: centerX + cosA * t,
            y: centerY + sinA * t,
            dist: t
        };
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

        // Записываем текущую координату в историю smoothR для создания изгиба
        this.smoothR.push({ x: this.x, y: this.y });
        
        // Ограничиваем длину массива истории
        if (this.smoothR.length > this.maxTrailLength) {
            this.smoothR.shift();
        }
    }

    draw() {
        if (this.smoothR.length < 2) return;

        // Берем среднюю точку из истории smoothR в качестве контрольной точки изгиба шеи
        let midIndex = floor(this.smoothR.length / 2);
        let controlPoint = this.smoothR[midIndex];

        let perpAngle = this.angle + HALF_PI;
        let baseLeftX = this.edgeX + cos(perpAngle) * (this.baseWidth / 2);
        let baseLeftY = this.edgeY + sin(perpAngle) * (this.baseWidth / 2);
        let baseRightX = this.edgeX - cos(perpAngle) * (this.baseWidth / 2);
        let baseRightY = this.edgeY - sin(perpAngle) * (this.baseWidth / 2);

        let headLeftX = this.x + cos(perpAngle) * (this.headSize / 2);
        let headLeftY = this.y + sin(perpAngle) * (this.headSize / 2);
        let headRightX = this.x - cos(perpAngle) * (this.headSize / 2);
        let headRightY = this.y - sin(perpAngle) * (this.headSize / 2);

        // 1. Мягкий теневой ореол с учетом сглаженной геометрии из smoothR
        fill(10, 10, 10, this.isAttacking ? 70 : 30);
        beginShape();
        vertex(baseLeftX, baseLeftY);
        // Используем controlPoint.x и controlPoint.y для инерционного провисания плоти
        bezierVertex(baseLeftX, baseLeftY, controlPoint.x, controlPoint.y, headLeftX, headLeftY);
        vertex(headRightX, headRightY);
        bezierVertex(headRightX, headRightY, controlPoint.x, controlPoint.y, baseRightX, baseRightY);
        endShape(CLOSE);
        ellipse(this.x, this.y, this.headSize * 1.3, this.headSize * 1.3);

        // 2. Плотное тело щупальца
        fill(5, 5, 5, this.isAttacking ? 165 : 95);
        beginShape();
        vertex(baseLeftX, baseLeftY);
        bezierVertex(baseLeftX, baseLeftY, controlPoint.x, controlPoint.y, headLeftX, headLeftY);
        vertex(headRightX, headRightY);
        bezierVertex(headRightX, headRightY, controlPoint.x, controlPoint.y, baseRightX, baseRightY);
        endShape(CLOSE);
        ellipse(this.x, this.y, this.headSize, this.headSize);
    }

    hasReachedCenter() {
        return dist(this.x, this.y, centerX, centerY) < centerRadius;
    }
}