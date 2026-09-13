document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('global-spark-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isSystemActive = true;
    window.toggleSystemEffects = () => {
        isSystemActive = !isSystemActive;
        if (!isSystemActive) {
            ctx.clearRect(0, 0, w, h);
        } else {
            lastTime = performance.now();
            animate(lastTime);
        }
    };
    let w, h;
    const resize = () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    let mouse = { x: w / 2, y: h / 2, targetbbbl: null };
    let sparks = [];
    let particles = [];
    let lastTime = 0;
    class Sparkle {
        constructor(x, y, color) {
            this.x = x; this.y = y;
            this.size = Math.random() * 2 + 0.5;
            this.vx = (Math.random() - 0.5) * 5;
            this.vy = (Math.random() - 0.5) * 5;
            this.life = 1.0;
            this.decay = Math.random() * 0.02 + 0.01;
            this.color = color;
        }        
        update(dt) {
            const f = dt / 16.6;
            this.x += this.vx * f;
            this.y += this.vy * f;
            this.vx *= Math.pow(0.95, f);
            this.vy *= Math.pow(0.95, f);
            this.life -= this.decay * f;
        }
        draw(ctx) {
            ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    class Spark {
        constructor(id) {
            this.id = id;
            this.targetPartner = null;
            this.isAttacking = false;
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.progress = Math.random();
            this.speed = 0.0005 + Math.random() * 0.0005; // Сделали медленнее
            const rainbowNeon = [
                '255, 0, 85', '255, 135, 0', '255, 255, 0',
                '0, 255, 120', '0, 242, 255', '122, 53, 255', '255, 0, 255'
            ];
            this.color = rainbowNeon[id % rainbowNeon.length];
        }
        update(dt) {
            const f = dt / 16.6;
            if (this.isAttacking && this.targetPartner) {
                const targetX = (this.x + this.targetPartner.x) / 2;
                const targetY = (this.y + this.targetPartner.y) / 2;
                this.x += (targetX - this.x) * 0.05 * f;
                this.y += (targetY - this.y) * 0.05 * f;
                if (Math.hypot(this.x - this.targetPartner.x, this.y - this.targetPartner.y) < 10) {
                    for (let i = 0; i < 40; i++) {
                        const mixColor = (i % 2 === 0) ? this.color : this.targetPartner.color;
                        particles.push(new Sparkle(this.x, this.y, mixColor));
                    }
                    this.respawn();
                    this.targetPartner.respawn();
                    this.targetPartner.isAttacking = false;
                    this.targetPartner.targetPartner = null;
                    this.isAttacking = false;
                    this.targetPartner = null;
                }
            } else {
                if (mouse.targetbbbl) {
                    const rect = mouse.targetbbbl.getBoundingClientRect();
                    const perimeter = (rect.width + rect.height) * 2;
                    this.progress += this.speed * (this.id % 2 === 0 ? 1 : -1) * f;
                    let p = ((this.progress % 1) + 1) % 1 * perimeter;

                    if (p < rect.width) { this.targetX = rect.left + p; this.targetY = rect.top; }
                    else if (p < rect.width + rect.height) { this.targetX = rect.left + rect.width; this.targetY = rect.top + (p - rect.width); }
                    else if (p < rect.width * 2 + rect.height) { this.targetX = rect.left + rect.width - (p - rect.width - rect.height); this.targetY = rect.top + rect.height; }
                    else { this.targetX = rect.left; this.targetY = rect.top + rect.height - (p - rect.width * 2 - rect.height); }
                    this.x += (this.targetX - this.x) * 0.03 * f;
                    this.y += (this.targetY - this.y) * 0.03 * f;
                } else {
                    const time = Date.now() * 0.0005;
                    const noiseX = Math.sin(time + this.id * 30) * 50;
                    const noiseY = Math.cos(time * 0.90 + this.id * 20) * 50;

                    this.targetX = mouse.x + noiseX;
                    this.targetY = mouse.y + noiseY;
                    this.x += (this.targetX - this.x) * 0.03 * f;
                    this.y += (this.targetY - this.y) * 0.03 * f;
                }
            }
        }
        respawn() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
        }
        draw() {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            ctx.imageSmoothingEnabled = false; 
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${this.color}, 0.05)`;
            ctx.lineWidth = 0.5; 
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = `rgba(${this.color}, 0.4)`;
            ctx.lineWidth = 0.5;
            ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    for (let i = 0; i < 7; i++) sparks.push(new Spark(i));
    const triggerExplosion = () => {
        let available = [...sparks.filter(s => !s.isAttacking)];
        while (available.length > 1) {
            let s1 = available.pop();
            let closestIdx = -1;
            let minDist = Infinity;
            for (let i = 0; i < available.length; i++) {
                let d = Math.hypot(s1.x - available[i].x, s1.y - available[i].y);
                if (d < minDist) { minDist = d; closestIdx = i; }
            }
            if (closestIdx !== -1) {
                let s2 = available.splice(closestIdx, 1)[0];
                s1.targetPartner = s2; s2.targetPartner = s1;
                s1.isAttacking = true; s2.isAttacking = true;
            }
        }
    };
    window.addEventListener('mousemove', (e) => {
        if (window.innerWidth > 992) {
            mouse.x = e.clientX; mouse.y = e.clientY;
            mouse.targetbbbl = e.target.closest('.bbbl');
        }
    });
    window.addEventListener('touchmove', (e) => {
        mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchstart', (e) => {
        mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
        triggerExplosion();
    }, { passive: true });
    window.addEventListener('mousedown', triggerExplosion);
    const animate = (timestamp) => {
        if (!isSystemActive) return;
        if (!lastTime) lastTime = timestamp;
        const dt = timestamp - lastTime;
        lastTime = timestamp;
        ctx.fillStyle = 'rgba(2, 4, 10, 0.2)';
        ctx.clearRect(0, 0, w, h);
        if (window.innerWidth <= 992) {
            const bbbls = document.querySelectorAll('.bbbl');
            let closest = null; let minDistance = Infinity;
            const vCenter = window.innerHeight / 2;
            bbbls.forEach(bbbl => {
                const rect = bbbl.getBoundingClientRect();
                const bbblCenter = rect.top + rect.height / 2;
                const distance = Math.abs(vCenter - bbblCenter);
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    if (distance < minDistance) { minDistance = distance; closest = bbbl; }
                }
            });
            mouse.targetbbbl = closest;
        }
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => { p.update(dt); p.draw(ctx); });
        sparks.forEach(s => { s.update(dt); s.draw(); });
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
});
