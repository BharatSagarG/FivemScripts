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
    checkConnection();
}

function checkConnection() {
    const rows = Math.max(...tiles.map(t => parseInt(t.dataset.r))) + 1;
    const cols = Math.max(...tiles.map(t => parseInt(t.dataset.c))) + 1;

    const gridData = Array.from({ length: rows }, () => Array(cols).fill(null));
    tiles.forEach(tile => {
        const r = parseInt(tile.dataset.r);
        const c = parseInt(tile.dataset.c);
        gridData[r][c] = {
            type: tile.dataset.type,
            shape: tile.dataset.pipeShape || '',
            rotation: parseInt(tile.dataset.rotation) || 0
        };
    });

    const start = { r: startPos.r, c: startPos.c };
    const end = { r: endPos.r, c: endPos.c };
    const visited = new Set();
    let success = false;

    function dfs(r, c) {
        if (r === end.r && c === end.c) {
            success = true;
            return;
        }
        visited.add(`${r},${c}`);
        const cell = gridData[r][c];
        if (!cell) return;

        const neighbors = getConnections(cell, r, c);
        neighbors.forEach(([nr, nc]) => {
            if (
                nr >= 0 && nr < rows &&
                nc >= 0 && nc < cols &&
                !visited.has(`${nr},${nc}`) &&
                isConnected(gridData[nr][nc], nr, nc, r, c)
            ) {
                dfs(nr, nc);
            }
        });
    }

    dfs(start.r, start.c);

    if (success) {
        closeGame(true);
    }
}

function getConnections(cell, r, c) {
    if (cell.type === 'start') return [[r, c + 1], [r + 1, c]];
    if (cell.type === 'end') return [[r, c - 1], [r - 1, c]];

    if (cell.type !== 'pipe') return [];

    let conns = [];
    if (cell.shape === 'straight') {
        if (cell.rotation % 180 === 0) { // horizontal
            conns.push([r, c - 1], [r, c + 1]);
        } else { // vertical
            conns.push([r - 1, c], [r + 1, c]);
        }
    } else if (cell.shape === 'L') {
        if (cell.rotation === 0) conns.push([r, c - 1], [r - 1, c]);
        if (cell.rotation === 90) conns.push([r - 1, c], [r, c + 1]);
        if (cell.rotation === 180) conns.push([r, c + 1], [r + 1, c]);
        if (cell.rotation === 270) conns.push([r + 1, c], [r, c - 1]);
    }
    return conns;
}

function isConnected(cell, r, c, fromR, fromC) {
    if (!cell) return false;
    if (cell.type === 'start' || cell.type === 'end') return true;

    const conns = getConnections(cell, r, c);
    return conns.some(([nr, nc]) => nr === fromR && nc === fromC);
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
