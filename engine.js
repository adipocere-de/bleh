/*
 * engine.js
 * Mittens Personality Wrapper
 */
const STOCKFISH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';

let stockfish = null;

loadStockfish();

async function loadStockfish() {
    try {
        const response = await fetch(STOCKFISH_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        const scriptContent = await response.text();
        const blob = new Blob([scriptContent], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        stockfish = new Worker(workerUrl);

        stockfish.onmessage = function(e) {
            const msg = e.data;
            if (msg === 'uciok') {
                applyMittensStrategy();
            }
            self.postMessage(msg);
        };
    } catch (error) {
        self.postMessage("info string Error loading Stockfish: " + error.message);
    }
}

self.onmessage = function(e) {
    if (!stockfish) return;
    stockfish.postMessage(e.data);
};

function applyMittensStrategy() {
    // 1. "The Grinder" - Contempt set to 60 (Very High).
    // Stockfish usually likes 0. This makes it hate draws and play risky to win.
    stockfish.postMessage('setoption name Contempt value 60');
    
    // 2. Max Strength
    stockfish.postMessage('setoption name Skill Level value 20');
    
    // 3. Aggressive Thinking
    stockfish.postMessage('setoption name MultiPV value 3');
    stockfish.postMessage('setoption name Ponder value true');
    stockfish.postMessage('setoption name Minimum Thinking Time value 50');
}
