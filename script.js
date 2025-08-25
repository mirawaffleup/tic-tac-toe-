// Game state
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X'; // Player is always X
let gameActive = false;
let gameStats = {
    playerWins: 0,
    aiWins: 0,
    draws: 0
};

// Configuration - Replace with your actual keys
const CONFIG = {
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE', // Replace with your Gemini API key
    EMAILJS_SERVICE_ID: 'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
    EMAILJS_TEMPLATE_ID: 'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
    EMAILJS_PUBLIC_KEY: 'YOUR_PUBLIC_KEY' // Replace with your EmailJS public key
};

// Initialize EmailJS
if (typeof emailjs !== 'undefined') {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
}

// Load stats from localStorage
function loadStats() {
    const savedStats = localStorage.getItem('ticTacToeStats');
    if (savedStats) {
        gameStats = JSON.parse(savedStats);
        updateStatsDisplay();
    }
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('ticTacToeStats', JSON.stringify(gameStats));
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('playerWins').textContent = gameStats.playerWins;
    document.getElementById('aiWins').textContent = gameStats.aiWins;
    document.getElementById('draws').textContent = gameStats.draws;
}

// Winning combinations
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// Initialize game
function init() {
    loadStats();
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
}

// Handle cell click
function handleCellClick(e) {
    const index = parseInt(e.target.dataset.index);
    
    if (!gameActive || board[index] !== '' || currentPlayer !== 'X') {
        return;
    }

    makeMove(index, 'X');
    
    if (checkWinner() || board.every(cell => cell !== '')) {
        endGame();
    } else {
        currentPlayer = 'O';
        document.getElementById('status').textContent = 'AI is thinking...';
        makeAIMove();
    }
}

// Make a move
function makeMove(index, player) {
    board[index] = player;
    document.querySelector(`[data-index="${index}"]`).textContent = player;
}

// Check for winner
function checkWinner() {
    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        return board[a] && board[a] === board[b] && board[a] === board[c];
    });
}

// Get winner
function getWinner() {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// End game
function endGame() {
    gameActive = false;
    const winner = getWinner();
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.add('disabled'));

    let message = '';
    if (winner === 'X') {
        message = '🎉 You won!';
        gameStats.playerWins++;
    } else if (winner === 'O') {
        message = '🤖 AI won!';
        gameStats.aiWins++;
    } else {
        message = '🤝 It\'s a draw!';
        gameStats.draws++;
    }

    document.getElementById('status').textContent = message;
    saveStats();
    updateStatsDisplay();
    
    // Show email section after game ends
    document.getElementById('emailSection').classList.add('show');
}

// Start new game
function startNewGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;

    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('disabled');
    });

    document.getElementById('status').textContent = 'Your turn! You are X';
    document.getElementById('emailSection').classList.remove('show');
}

// Reset stats
function resetStats() {
    gameStats = { playerWins: 0, aiWins: 0, draws: 0 };
    saveStats();
    updateStatsDisplay();
}

// Make AI move using Gemini API
async function makeAIMove() {
    const loading = document.getElementById('loading');
    loading.classList.add('show');

    try {
        // First try to use Gemini API
        const aiMove = await getAIMoveFromGemini();
        
        setTimeout(() => {
            loading.classList.remove('show');
            
            if (aiMove !== -1 && board[aiMove] === '') {
                makeMove(aiMove, 'O');
                
                if (checkWinner() || board.every(cell => cell !== '')) {
                    endGame();
                } else {
                    currentPlayer = 'X';
                    document.getElementById('status').textContent = 'Your turn!';
                }
            } else {
                // Fallback to local AI if API fails
                makeLocalAIMove();
            }
        }, 1000); // Add delay for better UX
        
    } catch (error) {
        console.log('Gemini API failed, using local AI:', error);
        loading.classList.remove('show');
        makeLocalAIMove();
    }
}

// Get AI move from Gemini API
async function getAIMoveFromGemini() {
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Gemini API key not configured');
    }

    const boardString = board.map((cell, index) => 
        cell === '' ? index.toString() : cell
    ).join('');

    const prompt = `You are playing Tic Tac Toe. You are 'O' and the human is 'X'. 
    Current board state: ${boardString} (where numbers represent empty positions 0-8).
    Board layout:
    0|1|2
    3|4|5  
    6|7|8
    
    Current board: ${board[0]||'0'}|${board[1]||'1'}|${board[2]||'2'}
                  ${board[3]||'3'}|${board[4]||'4'}|${board[5]||'5'}
                  ${board[6]||'6'}|${board[7]||'7'}|${board[8]||'8'}

    Your goal is to WIN. Priority order:
    1. If you can win in one move, do it
    2. If opponent can win next turn, block them
    3. Otherwise, make the best strategic move
    
    Respond with only the position number (0-8) where you want to place your 'O'.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 10,
            }
        })
    });

    if (!response.ok) {
        throw new Error('Gemini API request failed');
    }

    const data = await response.json();
    const move = parseInt(data.candidates[0].content.parts[0].text.trim());
    
    return (move >= 0 && move <= 8) ? move : -1;
}

// Local AI fallback (minimax algorithm)
function makeLocalAIMove() {
    const bestMove = getBestMove();
    makeMove(bestMove, 'O');
    
    if (checkWinner() || board.every(cell => cell !== '')) {
        endGame();
    } else {
        currentPlayer = 'X';
        document.getElementById('status').textContent = 'Your turn!';
    }
}

// Minimax algorithm for local AI
function getBestMove() {
    // Check if AI can win
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            if (checkWinner()) {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }

    // Check if need to block player
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'X';
            if (checkWinner()) {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }

    // Take center if available
    if (board[4] === '') return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => board[i] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any available side
    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(i => board[i] === '');
    if (availableSides.length > 0) {
        return availableSides[Math.floor(Math.random() * availableSides.length)];
    }

    return -1;
}

// Send email with results
async function sendEmail() {
    const email = document.getElementById('emailInput').value;
    if (!email || !email.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }

    // Check if EmailJS is configured
    if (typeof emailjs === 'undefined') {
        alert('EmailJS not loaded. Please refresh the page and try again.');
        return;
    }

    if (CONFIG.EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' || 
        CONFIG.EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID' || 
        CONFIG.EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        alert('EmailJS not configured. Please update your API keys in script.js');
        return;
    }

    const totalGames = gameStats.playerWins + gameStats.aiWins + gameStats.draws;
    const winRate = totalGames > 0 ? ((gameStats.playerWins / totalGames) * 100).toFixed(1) : 0;

    // Simple template parameters that match EmailJS expectations
    const templateParams = {
        to_email: email,
        to_name: 'Player',
        from_name: 'Tic Tac Toe Game',
        subject: 'Your Tic Tac Toe Game Results',
        message: `Here are your game results:

Your Wins: ${gameStats.playerWins}
AI Wins: ${gameStats.aiWins}
Draws: ${gameStats.draws}
Total Games: ${totalGames}
Win Rate: ${winRate}%

Thanks for playing!`,
        player_wins: gameStats.playerWins,
        ai_wins: gameStats.aiWins,
        draws: gameStats.draws,
        total_games: totalGames,
        win_rate: winRate
    };

    try {
        console.log('Sending email with params:', templateParams);
        
        const response = await emailjs.send(
            CONFIG.EMAILJS_SERVICE_ID,
            CONFIG.EMAILJS_TEMPLATE_ID,
            templateParams,
            CONFIG.EMAILJS_PUBLIC_KEY
        );
        
        console.log('Email sent successfully:', response);
        alert('Results sent to your email successfully! 📧');
        
    } catch (error) {
        console.error('Email error details:', error);
        
        // More specific error handling
        if (error.status === 422) {
            alert('Configuration error: Please check your EmailJS template and service settings.');
        } else if (error.status === 400) {
            alert('Bad request: Please check your EmailJS configuration.');
        } else {
            alert(`Failed to send email (Error ${error.status}): ${error.text || 'Unknown error'}`);
        }
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', init);
