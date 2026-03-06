const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = innerWidth
canvas.height = innerHeight

let lastTime = 0
let score = 0
let combo = 0
let comboTimer = 0

const bullets = []
const enemies = []
const enemyBullets = []
const particles = []
const powerups = []

const mouse = { x: canvas.width / 2 }

let bgY = 0
let shake = 0

// GLOBAL HP
let globalHp = 10;

// ==========================================
// ADD YOUR SPRITE FILE PATHS HERE
// ==========================================
const playerImages = ["p1.png", "p2.png", "p3.png", "p4.png", "p5.png", "p6.png", "p7.png"].map(src => {
    let img = new Image();
    img.src = src;
    return img;
});

const enemyImages = ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png", "11.png", "12.png", "13.png", "14.png"].map(src => {
    let img = new Image();
    img.src = src;
    return img;
});

const bossImages = ["boss1.png", "boss2.png"].map(src => {
    let img = new Image();
    img.src = src;
    return img;
});

const backgroundImg = new Image();
backgroundImg.src = "background.png"; // Add your scrolling background here
// ==========================================

let boss = null
let nextBossScore = 50; // Boss will spawn every 50 points
let isGameOver = false;
let isGameStarted = false;

document.getElementById("start-btn").addEventListener("click", () => {
    isGameStarted = true;
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("game-hud").classList.remove("hidden");
});

class Player {

    constructor() {

        this.x = canvas.width / 2
        this.y = canvas.height - 80
        this.size = 170

        this.sprite = playerImages[Math.floor(Math.random() * playerImages.length)];

        this.cooldown = 0

        this.weapon = "normal"
        this.weaponTimer = 0
        this.weaponLevel = 1
        this.targetX = this.x

    }

    update(dt) {

        this.x += (this.targetX - this.x) * 15 * dt

        this.cooldown -= dt

        if (this.weaponTimer > 0) {

            this.weaponTimer -= dt

            if (this.weaponTimer <= 0) {
                this.weapon = "normal"
            }

        }

        if (this.cooldown <= 0) {

            if (this.weapon == "normal") {

                bullets.push(new Bullet(this.x, this.y))

            }

            else if (this.weapon == "triple") {
                let c = 2 + this.weaponLevel;
                for (let i = 0; i < c; i++) bullets.push(new Bullet(this.x + (i - (c - 1) / 2) * 15, this.y));
            }

            else if (this.weapon == "laser") {
                let s = 1 + this.weaponLevel;
                for (let i = -s; i <= s; i++) bullets.push(new Bullet(this.x + i * 8, this.y));
            }

            this.cooldown = 0.2

        }

    }

    draw() {

        if (this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.drawImage(this.sprite, this.x - this.size / 2, this.y, this.size, this.size)
        } else {
            ctx.fillStyle = "cyan"
            ctx.fillRect(this.x - this.size / 2, this.y, this.size, this.size)
        }

    }

}

class Bullet {

    constructor(x, y) {

        this.x = x
        this.y = y

        this.speed = 700

    }

    update(dt) {

        this.y -= this.speed * dt

    }

    draw() {

        ctx.fillStyle = "yellow"
        ctx.fillRect(this.x, this.y, 4, 12)

    }

}

class Enemy {

    constructor() {

        this.x = Math.random() * canvas.width
        this.y = -70
        this.startX = this.x

        this.size = 180 // Made enemies much bigger!

        this.speed = 120 + Math.random() * 80 + score * 2 // Dynamic diff

        this.maxHp = 3 + Math.floor(score / 30) // Dynamic diff
        this.hp = this.maxHp

        this.type = Math.random() < 0.33 ? "zigzag" : (Math.random() < 0.5 ? "dive" : "normal")
        this.sprite = enemyImages[Math.floor(Math.random() * enemyImages.length)];

    }

    update(dt) {

        if (this.type == "zigzag") this.x = this.startX + Math.sin(this.y / 50) * 100;
        if (this.type == "dive") this.speed += 200 * dt;
        this.y += this.speed * dt

    }

    draw() {
        if (this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.save()
            ctx.translate(this.x + this.size / 2, this.y + this.size / 2)
            ctx.rotate(Math.PI) // Turn them 180 degrees
            ctx.drawImage(this.sprite, -this.size / 2, -this.size / 2, this.size, this.size)
            ctx.restore()
        } else {
            ctx.fillStyle = "red"
            ctx.fillRect(this.x, this.y, this.size, this.size)
        }

        ctx.fillStyle = "black"
        ctx.fillRect(this.x, this.y - 8, this.size, 5)

        ctx.fillStyle = "lime"
        ctx.fillRect(this.x, this.y - 8, this.size * (this.hp / this.maxHp), 5)
    }

}

class EnemyBullet {

    constructor(x, y, dx, dy) {

        this.x = x
        this.y = y

        this.dx = dx
        this.dy = dy

        this.speed = 200

    }

    update(dt) {

        this.x += this.dx * this.speed * dt
        this.y += this.dy * this.speed * dt

    }

    draw() {

        ctx.fillStyle = "orange"
        ctx.fillRect(this.x, this.y, 6, 6)

    }

}

class Boss {

    constructor() {

        this.x = canvas.width / 2 - 200
        this.y = -300

        this.size = 350

        this.maxHp = 50
        this.hp = this.maxHp

        this.speed = 60

        this.shootTimer = 0

        this.sprite = bossImages[Math.floor(Math.random() * bossImages.length)];

    }

    update(dt) {

        if (this.y < 80) {

            this.y += this.speed * dt

        }

        this.shootTimer -= dt
        this.angle = (this.angle || 0) + 0.3;

        if (this.shootTimer <= 0) {

            let phase2 = this.hp <= this.maxHp / 2;
            let ways = phase2 ? 16 : 12;

            for (let i = 0; i < ways; i++) {

                let angle = (Math.PI * 2 / ways) * i + (phase2 ? this.angle : 0)

                enemyBullets.push(
                    new EnemyBullet(
                        this.x + this.size / 2,
                        this.y + this.size / 2,
                        Math.cos(angle),
                        Math.sin(angle)
                    )
                )

            }

            this.shootTimer = phase2 ? 0.3 : 2

        }

    }

    draw() {

        if (this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.save()
            ctx.translate(this.x + this.size / 2, this.y + this.size / 2)
            ctx.rotate(Math.PI)
            ctx.drawImage(this.sprite, -this.size / 2, -this.size / 2, this.size, this.size)
            ctx.restore()
        } else {
            ctx.fillStyle = "purple"
            ctx.fillRect(this.x, this.y, this.size, this.size)
        }

    }

}

class Particle {

    constructor(x, y) {

        this.x = x
        this.y = y

        this.vx = (Math.random() - 0.5) * 300
        this.vy = (Math.random() - 0.5) * 300

        this.life = 1

    }

    update(dt) {

        this.x += this.vx * dt
        this.y += this.vy * dt

        this.life -= dt

    }

    draw() {

        ctx.fillStyle = "orange"
        ctx.fillRect(this.x, this.y, 4, 4)

    }

}

class Powerup {

    constructor(x, y, type) {

        this.x = x
        this.y = y

        this.type = type

        this.size = 20
        this.speed = 100

    }

    update(dt) {

        this.y += this.speed * dt

    }

    draw() {

        ctx.fillStyle = this.type == "clone" ? "white" : (this.type == "triple" ? "blue" : "pink")

        ctx.fillRect(this.x, this.y, this.size, this.size)

    }

}

let players = [new Player()]

canvas.addEventListener("mousemove", e => {
    mouse.x = e.clientX
})

canvas.addEventListener("touchmove", e => {

    let touch = e.touches[0]

    mouse.x = touch.clientX

})

let spawnTimer = 0

function spawnEnemies(dt) {

    if (boss) return

    spawnTimer -= dt

    if (spawnTimer <= 0) {

        enemies.push(new Enemy())

        spawnTimer = Math.max(0.2, 1 - score * 0.005)

    }

    if (score >= nextBossScore && !boss) {

        boss = new Boss()

        nextBossScore += 100; // Next boss is +100 points away

    }

}

function explode(x, y) {

    shake = 10

    for (let i = 0; i < 20; i++) {

        particles.push(new Particle(x, y))

    }

}

function collisions() {

    bullets.forEach((b, bi) => {

        enemies.forEach((e, ei) => {

            if (
                b.x < e.x + e.size &&
                b.x > e.x &&
                b.y < e.y + e.size &&
                b.y > e.y
            ) {

                bullets.splice(bi, 1)

                e.hp--

                if (e.hp <= 0) {

                    explode(e.x, e.y)

                    if (Math.random() < 0.4) {

                        let type = Math.random() < 0.6 ? "clone" : (Math.random() < 0.5 ? "triple" : "laser")

                        powerups.push(new Powerup(e.x, e.y, type))

                    }

                    enemies.splice(ei, 1)

                    combo++
                    comboTimer = 2
                    score += 1 * combo

                }

            }

        })

        if (boss) {

            if (
                b.x > boss.x &&
                b.x < boss.x + boss.size &&
                b.y > boss.y &&
                b.y < boss.y + boss.size
            ) {

                bullets.splice(bi, 1)

                boss.hp--

                explode(b.x, b.y)

                if (boss.hp <= 0) {

                    explode(boss.x, boss.y)

                    score += 50

                    boss = null

                }

            }

        }

    })

    enemyBullets.forEach((b, i) => {
        for (let pi = players.length - 1; pi >= 0; pi--) {
            let p = players[pi];
            if (b.x > p.x - p.size / 2 && b.x < p.x + p.size / 2 && b.y > p.y && b.y < p.y + p.size) {
                enemyBullets.splice(i, 1)
                explode(b.x, b.y)
                globalHp--
                if (players.length > 1) players.splice(pi, 1);
                break;
            }
        }
    })

    powerups.forEach((p, i) => {
        for (let pi = players.length - 1; pi >= 0; pi--) {
            let pl = players[pi];
            if (pl.x - pl.size / 2 < p.x + p.size && pl.x + pl.size / 2 > p.x && pl.y < p.y + p.size && pl.y + pl.size > p.y) {
                if (p.type === "clone") {
                    let newP = new Player();
                    newP.x = pl.x;
                    players.push(newP);
                } else {
                    if (pl.weapon === p.type) pl.weaponLevel++
                    else { pl.weapon = p.type; pl.weaponLevel = 1 }
                    pl.weaponTimer = 10
                }
                powerups.splice(i, 1)
                break;
            }
        }
    })

    enemies.forEach((e, ei) => {
        for (let pi = players.length - 1; pi >= 0; pi--) {
            let p = players[pi];
            if (p.x - p.size / 2 < e.x + e.size && p.x + p.size / 2 > e.x && p.y < e.y + e.size && p.y + p.size > e.y) {
                explode(e.x, e.y)
                enemies.splice(ei, 1)
                globalHp--
                if (players.length > 1) players.splice(pi, 1);
                break;
            }
        }
    })

}

function update(dt) {

    if (!isGameStarted || isGameOver) return;

    bgY += 200 * dt

    if (bgY > canvas.height) {
        bgY = 0
    }

    comboTimer -= dt
    if (comboTimer <= 0) combo = 0

    players.forEach((p, i) => {
        let offset = (i - (players.length - 1) / 2) * 45;
        p.targetX = mouse.x + offset;
        p.update(dt)
    });

    bullets.forEach((b, i) => {

        b.update(dt)

        if (b.y < 0) {
            bullets.splice(i, 1)
        }

    })

    enemyBullets.forEach((b, i) => {

        b.update(dt)

        if (
            b.y > canvas.height ||
            b.y < 0 ||
            b.x < 0 ||
            b.x > canvas.width
        ) {
            enemyBullets.splice(i, 1)
        }

    })

    enemies.forEach((e, i) => {

        e.update(dt)

        if (e.y > canvas.height) {
            enemies.splice(i, 1)
        }

    })

    particles.forEach((p, i) => {

        p.update(dt)

        if (p.life <= 0) {
            particles.splice(i, 1)
        }

    })

    powerups.forEach((p, i) => {

        p.update(dt)

        if (p.y > canvas.height) {
            powerups.splice(i, 1)
        }

    })

    if (boss) {
        boss.update(dt)
    }

    spawnEnemies(dt)

    collisions()

    // UI Updates
    document.getElementById("score-display").innerText = "SCORE: " + score;
    document.getElementById("hp-display").innerText = "GLOBAL HP: " + globalHp + " (" + players.length + " Planes)";

    if (combo > 1) {
        document.getElementById("combo-display").innerText = "x" + combo + " COMBO! (" + Math.ceil(comboTimer * 10) / 10 + "s)";
    } else {
        document.getElementById("combo-display").innerText = "";
    }

    if (globalHp <= 0) {
        isGameOver = true;
        document.getElementById("final-score").innerText = "SCORE: " + score;
        document.getElementById("game-over").classList.remove("hidden");
    }

}

function draw() {

    ctx.save()

    if (shake > 0) {

        let dx = (Math.random() - 0.5) * shake
        let dy = (Math.random() - 0.5) * shake

        ctx.translate(dx, dy)

        shake *= 0.9

    }

    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (backgroundImg.complete && backgroundImg.naturalWidth > 0) {
        let imgAspect = backgroundImg.width / backgroundImg.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.width / imgAspect;

        let bgScroll = bgY % drawHeight;

        ctx.drawImage(backgroundImg, 0, bgScroll, drawWidth, drawHeight);
        ctx.drawImage(backgroundImg, 0, bgScroll - drawHeight, drawWidth, drawHeight);
    } else {
        ctx.fillStyle = "#111"
        ctx.fillRect(0, bgY, canvas.width, canvas.height)
        ctx.fillRect(0, bgY - canvas.height, canvas.width, canvas.height)
    }

    players.forEach(p => p.draw())

    bullets.forEach(b => b.draw())

    enemyBullets.forEach(b => b.draw())

    enemies.forEach(e => e.draw())

    particles.forEach(p => p.draw())

    powerups.forEach(p => p.draw())

    if (boss) {

        boss.draw()

        ctx.fillStyle = "black"
        ctx.fillRect(canvas.width / 2 - 200, 20, 400, 20)

        ctx.fillStyle = "purple"
        ctx.fillRect(canvas.width / 2 - 200, 20, 400 * (boss.hp / boss.maxHp), 20)

    }

    ctx.restore()

}

function loop(time) {

    const dt = (time - lastTime) / 1000

    lastTime = time

    update(dt)
    draw()

    requestAnimationFrame(loop)

}

requestAnimationFrame(loop)