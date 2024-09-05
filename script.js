const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score');
const correctPopsDisplay = document.getElementById('correct-pops');  // Display for correct pops
const mistakesDisplay = document.getElementById('mistakes');  // Display for mistakes
const timerDisplay = document.getElementById('timer');  // Display for timer
const correctPopsPercentage = document.getElementById('correct-pops-percentage');  // Display for correct pops percentage
let score = 0;
let correctPops = 0;
let mistakes = 0;
const maxBalloons = 10;
const minBalloons = 3;
let balloons = [];
let currentLetters = new Set();

// Function to generate a unique random letter with 1:10 ratio for capital letters
function randomUniqueLetter() {
    const smallLetters = 'abcdefghijklmnopqrstuvwxyz';
    const capitalLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let letter;
    do {
        if (Math.random() < 0.1) {
            letter = capitalLetters.charAt(Math.floor(Math.random() * capitalLetters.length));
        } else {
            letter = smallLetters.charAt(Math.floor(Math.random() * smallLetters.length));
        }
    } while (currentLetters.has(letter));
    currentLetters.add(letter);
    return letter;
}

// Function to create a balloon
function createBalloon() {
    const balloon = document.createElement('div');
    balloon.classList.add('balloon');
    balloon.textContent = randomUniqueLetter();
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
    // Ignore non-letter keys
    if (!/^[a-zA-Z]$/.test(key)) {
        return;
    }

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
