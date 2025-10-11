const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score');
const correctPopsDisplay = document.getElementById('correct-pops');
const mistakesDisplay = document.getElementById('mistakes');
const timerDisplay = document.getElementById('timer');
const correctPopsPercentage = document.getElementById('correct-pops-percentage');
let score = 0;
let correctPops = 0;
let mistakes = 0;
let balloons = [];
let currentLetters = new Set();

// Read options from URL params
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
const params = new URLSearchParams(window.location.search);
const opt = {
  lower: true, // lowercase is mandatory
  upper: params.get('upper') === 'true',
  numbers: params.get('numbers') === 'true',
  symbols: params.get('symbols') === 'true',
  min: clamp(parseInt(params.get('min')) || 3, 3, 20),
  max: clamp(parseInt(params.get('max')) || 10, 3, 20)
};
if (opt.max < opt.min) opt.max = opt.min;

const maxBalloons = opt.max;
const minBalloons = opt.min;

// Character pools
const CHARS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: "~`!@#$%^&*()_+-=[]{}|;:',.<>/?\"\\"
};

// Weighted selection: lowercase baseline 1.0; others 0.1 each if enabled
function pickWeightedType() {
    const weights = [
        { key: 'lower', w: 1.0, enabled: true },
        { key: 'upper', w: opt.upper ? 0.1 : 0, enabled: opt.upper },
        { key: 'numbers', w: opt.numbers ? 0.1 : 0, enabled: opt.numbers },
        { key: 'symbols', w: opt.symbols ? 0.1 : 0, enabled: opt.symbols },
    ];
    // Filter out types that currently have no available characters (all in use)
    const candidates = weights
        .filter(t => t.enabled && t.w > 0)
        .map(t => {
            const pool = CHARS[t.key];
            const available = [];
            for (let i = 0; i < pool.length; i++) {
                const ch = pool[i];
                if (!currentLetters.has(ch)) available.push(ch);
            }
            return { key: t.key, w: t.w, available };
        })
        .filter(t => t.available.length > 0);

    if (candidates.length === 0) {
        // All characters are taken; clear and fallback to lowercase as mandatory
        currentLetters.clear();
        return { key: 'lower', w: 1.0, available: CHARS.lower.split('') };
    }

    const total = candidates.reduce((s, c) => s + c.w, 0);
    let r = Math.random() * total;
    for (const c of candidates) {
        if ((r -= c.w) <= 0) return c;
    }
    return candidates[candidates.length - 1];
}

function randomUniqueChar() {
    const t = pickWeightedType();
    const arr = t.available;
    const ch = arr[Math.floor(Math.random() * arr.length)];
    currentLetters.add(ch);
    return ch;
}

// Function to create a balloon
function createBalloon() {
    const balloon = document.createElement('div');
    balloon.classList.add('balloon');
    balloon.textContent = randomUniqueChar();
    balloon.style.left = `${Math.random() * (gameArea.offsetWidth - 50)}px`;
    balloon.style.bottom = '0px';

    const speed = Math.random() * 3 + 1; // Adjusted to ensure higher max speed
    balloon.dataset.speed = speed;
    setBalloonColor(balloon, speed);

    balloons.push(balloon);
    gameArea.appendChild(balloon);
    animateBalloon(balloon);
}

// Function to set balloon color based on speed
function setBalloonColor(balloon, speed) {
    if (speed <= 1.5) {
        balloon.style.backgroundColor = 'blue';
        balloon.style.color = 'white';
    } else if (speed <= 2) {
        balloon.style.backgroundColor = 'green';
        balloon.style.color = 'white';
    } else if (speed <= 2.5) {
        balloon.style.backgroundColor = 'yellow';
        balloon.style.color = 'black'; // Ensure text is visible on yellow background
    } else if (speed <= 3) {
        balloon.style.backgroundColor = 'orange';
        balloon.style.color = 'white';
    } else {
        balloon.style.backgroundColor = 'red';
        balloon.style.color = 'white';
    }
}

// Function to animate balloons
function animateBalloon(balloon) {
    const speed = parseFloat(balloon.dataset.speed);
    let position = parseInt(balloon.style.bottom);

    function move() {
        if (position > gameArea.offsetHeight) {
            // Balloon reached the top, missed
            gameArea.removeChild(balloon);
            balloons = balloons.filter(b => b !== balloon);
            currentLetters.delete(balloon.textContent);
            score -= 50;  // Deduct points when balloon reaches the top
            mistakes += 1;  // Increment the missed counter
            scoreDisplay.textContent = `Score: ${score}`;
            mistakesDisplay.textContent = `Mistakes/Missed: ${mistakes}`;  // Update mistakes counter
        } else {
            position += speed;
            balloon.style.bottom = `${position}px`;
            requestAnimationFrame(move);
        }
    }

    move();
}

// Function to handle key press
function handleKeyPress(event) {
    const key = event.key;
    if (!key || key.length !== 1) return; // ignore control keys

    let popped = false;

    balloons.forEach(balloon => {
        if (balloon.textContent === key) {
            gameArea.removeChild(balloon);
            balloons = balloons.filter(b => b !== balloon);
            currentLetters.delete(balloon.textContent);
            score += 100;
            correctPops += 1;  // Increment the correct pops counter
            popped = true;
        }
    });

    if (!popped) {
        score -= 25;  // Deduct points for wrong key press
        mistakes += 1;  // Increment the mistakes counter
    }

    scoreDisplay.textContent = `Score: ${score}`;
    correctPopsDisplay.textContent = `Correct Pops: ${correctPops}`;  // Update correct pops counter
    mistakesDisplay.textContent = `Mistakes/Missed: ${mistakes}`;  // Update mistakes counter
}

// Set up the game timer that counts elapse time in mm:ss format

let time = 0;
let timer = setInterval(function() {
    time += 1;
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;
    if (seconds < 10) {
        seconds = `0${seconds}`;
    }
    document.getElementById('timer').textContent = `Time: ${minutes}:${seconds}`;
}, 1000);

// Calculate percentage of correct pops

let correctPopsPercentageValue = 0;
let correctPopsPercentageTimer = setInterval(function() {
    if (correctPops + mistakes > 0) {
        correctPopsPercentageValue = Math.round((correctPops / (correctPops + mistakes)) * 100);
    }
    document.getElementById('correct-pops-percentage').textContent = `Correct Pops Percentage: ${correctPopsPercentageValue}%`;
}, 1000);


// Set up the game loop
function gameLoop() {
    while (balloons.length < minBalloons) {
        createBalloon();
    }
    if (balloons.length < maxBalloons) {
        createBalloon();
    }

    setTimeout(gameLoop, 1000);
}

document.addEventListener('keydown', handleKeyPress);
gameLoop();

// Support New Game action: reset stats, stop timers, and go back to setup
function resetGame() {
    // Stop timers
    if (timer) clearInterval(timer);
    if (correctPopsPercentageTimer) clearInterval(correctPopsPercentageTimer);

    // Remove balloons from DOM
    balloons.forEach(b => { if (b.parentNode) b.parentNode.removeChild(b); });
    balloons = [];
    currentLetters.clear();

    // Reset counters
    score = 0;
    correctPops = 0;
    mistakes = 0;
    time = 0;
    correctPopsPercentageValue = 0;

    // Update UI
    if (scoreDisplay) scoreDisplay.textContent = 'Score: 0';
    if (correctPopsDisplay) correctPopsDisplay.textContent = 'Correct Pops: 0';
    if (mistakesDisplay) mistakesDisplay.textContent = 'Mistakes/Missed: 0';
    if (timerDisplay) timerDisplay.textContent = 'Time: 0:00';
    const cpp = document.getElementById('correct-pops-percentage');
    if (cpp) cpp.textContent = 'Correct Pops Percentage: 0%';

    // Detach handlers just in case
    document.removeEventListener('keydown', handleKeyPress);
}

const newGameBtn = document.getElementById('new-game-btn');
if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
        resetGame();
        window.location.href = 'index.html';
    });
}
