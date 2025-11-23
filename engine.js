/*
 * engine.js
 * "The Grinder" - Mittens/Komodo Personality Replica
 */

// We stick to Stockfish 10 because it is the strongest engine 
// that runs as a single stable file on iOS Safari.
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
                applyMittensPersonality();
            }
            
            // Forward output to main app
            self.postMessage(msg);
        };

    } catch (error) {
        self.postMessage("info string Error loading Engine: " + error.message);
    }
}

self.onmessage = function(e) {
    if (!stockfish) return;
    stockfish.postMessage(e.data);
};

function applyMittensPersonality() {
    // --- THE MITTENS / KOMODO CONFIGURATION ---

    // 1. MAX CONTEMPT (100)
    // This is the secret sauce. It tells the engine: "A draw is -1.00 (a loss)."
    // It will reject 3-fold repetitions and avoid simplifying into drawn endgames.
    stockfish.postMessage('setoption name Contempt value 100');

    // 2. PONDER (Psychological Pressure)
    // Allows the engine to think during your turn, so it often moves instantly
    // after you move, which is very intimidating (a classic Mittens trait).
    stockfish.postMessage('setoption name Ponder value true');

    // 3. AGGRESSIVENESS
    // Stockfish 10 doesn't have a "style" slider, but we can force it to
    // calculate deeper on specific lines rather than pruning too early.
    // (Standard settings are usually fine here, Contempt does the heavy lifting).
    
    // 4. THREADS
    // Single thread for stability on mobile, but max skill.
    stockfish.postMessage('setoption name Skill Level value 20');
    
    // 5. MULTIPV
    // Keep looking for 3 lines so we can see the alternatives.
    stockfish.postMessage('setoption name MultiPV value 3');
}
