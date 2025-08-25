const X_CLASS = 'x';
const CIRCLE_CLASS = 'circle';
const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const cellElements = document.querySelectorAll('[data-cell]');
const board = document.getElementById('game-board');
const winningMessageElement = document.getElementById('winning-message');
const restartButton = document.getElementById('restartButton');
const winningMessageTextElement = document.querySelector('[data-winning-message-text]');
const emailForm = document.getElementById('email-form');
let circleTurn;

startGame();

restartButton.addEventListener('click', startGame);

function startGame() {
    circleTurn = false;
    cellElements.forEach(cell => {
        cell.classList.remove(X_CLASS);
        cell.classList.remove(CIRCLE_CLASS);
        cell.removeEventListener('click', handleClick);
        cell.addEventListener('click', handleClick, { once: true });
    });
    setBoardHoverClass();
    winningMessageElement.style.display = 'none';
    emailForm.style.display = 'none';
}

function handleClick(e) {
    const cell = e.target;
    const currentClass = circleTurn ? CIRCLE_CLASS : X_CLASS;
    placeMark(cell, currentClass);
    if (checkWin(currentClass)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        setBoardHoverClass();
        // AI's turn with a delay for better user experience
        setTimeout(aiMove, 500);
    }
}

function endGame(draw) {
    let message;
    if (draw) {
        message = 'Draw!';
    } else {
        message = `${circleTurn ? "O's" : "X's"} Wins!`;
    }
    winningMessageTextElement.innerText = message;
    winningMessageElement.style.display = 'flex';
    emailForm.style.display = 'block';
}

function isDraw() {
    return [...cellElements].every(cell => {
        return cell.classList.contains(X_CLASS) || cell.classList.contains(CIRCLE_CLASS);
    });
}

function placeMark(cell, currentClass) {
    cell.classList.add(currentClass);
}

function swapTurns() {
    circleTurn = !circleTurn;
}

function setBoardHoverClass() {
    board.classList.remove(X_CLASS);
    board.classList.remove(CIRCLE_CLASS);
    if (circleTurn) {
        board.classList.add(CIRCLE_CLASS);
    } else {
        board.classList.add(X_CLASS);
    }
}

function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return cellElements[index].classList.contains(currentClass);
        });
    });
}

// AI Logic with Minimax
function aiMove() {
    const bestMove = minimax(getBoardState(), CIRCLE_CLASS);
    const cellToMark = cellElements[bestMove.index];
    placeMark(cellToMark, CIRCLE_CLASS);
    if (checkWin(CIRCLE_CLASS)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        setBoardHoverClass();
    }
}

function getBoardState() {
    const boardState = [];
    cellElements.forEach((cell, index) => {
        if (cell.classList.contains(X_CLASS)) {
            boardState[index] = X_CLASS;
        } else if (cell.classList.contains(CIRCLE_CLASS)) {
            boardState[index] = CIRCLE_CLASS;
        } else {
            boardState[index] = null;
        }
    });
    return boardState;
}

function minimax(newBoard, player) {
    const availSpots = emptySquares(newBoard);

    if (checkWin(X_CLASS, newBoard)) {
        return { score: -10 };
    } else if (checkWin(CIRCLE_CLASS, newBoard)) {
        return { score: 10 };
    } else if (availSpots.length === 0) {
        return { score: 0 };
    }

    const moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === CIRCLE_CLASS) {
            const result = minimax(newBoard, X_CLASS);
            move.score = result.score;
        } else {
            const result = minimax(newBoard, CIRCLE_CLASS);
            move.score = result.score;
        }

        newBoard[availSpots[i]] = null;
        moves.push(move);
    }

    let bestMove;
    if (player === CIRCLE_CLASS) {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }
    return moves[bestMove];
}

function emptySquares(board) {
    const empty = [];
    board.forEach((cell, index) => {
        if (cell === null) {
            empty.push(index);
        }
    });
    return empty;
}

// Helper for minimax checkWin
function checkWin(player, board) {
    for (const combination of WINNING_COMBINATIONS) {
        if (combination.every(index => board[index] === player)) {
            return true;
        }
    }
    return false;
}
