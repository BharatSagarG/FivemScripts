let grid, tiles = [];
let startPos, endPos;
let timerInterval;
let running = false;

window.addEventListener('message', (event) => {
    if (event.data.action === 'start') {
        startGame(event.data.params);
    }
});

function startGame(p) {
    running = true;
    document.getElementById('overlay').style.display = 'flex';
    let gridElement = document.getElementById('grid');
    gridElement.style.gridTemplateColumns = `repeat(${p.cols}, 64px)`;
    buildGrid(p.rows, p.cols);
    startTimer(p.timeLimit);
}

function startTimer(seconds) {
    let timerEl = document.getElementById('timer');
    timerEl.textContent = seconds;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds--;
        timerEl.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(timerInterval);
            closeGame(false);
        }
    }, 1000);
}

function buildGrid(rows, cols) {
    grid = document.getElementById('grid');
    grid.innerHTML = '';
    tiles = [];

    startPos = { r: 0, c: 0 };
    endPos = { r: rows - 1, c: cols - 1 };

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let div = document.createElement('div');
            div.className = 'tile';
            div.dataset.r = r;
            div.dataset.c = c;

            if (r === startPos.r && c === startPos.c) {
                div.classList.add('start-tile');
                div.dataset.type = 'start';
            } else if (r === endPos.r && c === endPos.c) {
                div.classList.add('end-tile');
                div.dataset.type = 'end';
            } else {
                let type = Math.random() < 0.5 ? 'straight' : 'L';
                let rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
                div.dataset.type = 'pipe';
                div.dataset.pipeShape = type;
                div.dataset.rotation = rotation;
                div.style.transform = `rotate(${rotation}deg)`;

                if (type === 'straight') {
                    div.classList.add('pipe-straight');
                } else {
                    div.classList.add('pipe-L');
                }

                div.addEventListener('click', () => rotatePipe(div));
            }

            grid.appendChild(div);
            tiles.push(div);
        }
    }
}

function rotatePipe(tile) {
    let currentRotation = parseInt(tile.dataset.rotation) || 0;
    currentRotation = (currentRotation + 90) % 360;
    tile.dataset.rotation = currentRotation;
    tile.style.transform = `rotate(${currentRotation}deg)`;
}

function closeGame(success) {
    running = false;
    document.getElementById('overlay').style.display = 'none';
    fetch(`https://${GetParentResourceName()}/finished`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: success, timeRemaining: 0 })
    });
}
