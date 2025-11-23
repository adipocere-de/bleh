/*
 * mittens.js (The Controller)
 * Loads the WASM engine and injects the Grinder personality
 */

// 1. Import the library we uploaded
importScripts('stockfish.js');

// 2. Initialize the WASM Engine
// Stockfish() is a factory function from the file we uploaded
Stockfish().then(function(sf) {
    
    // Add listener for engine messages
    sf.addMessageListener(function(line) {
        // Intercept "uciok" to apply personality
        if (line === 'uciok') {
            applyMittensPersonality(sf);
        }
        
        // Forward everything to the website
        postMessage(line);
    });

    // Listen for messages FROM the website
    self.onmessage = function(event) {
        sf.postMessage(event.data);
    };

    // Tell the website we are alive
    // (WASM takes a split second to compile, so we wait for the promise)
    postMessage('readyok');
});

function applyMittensPersonality(engine) {
    // --- THE GRINDER SETTINGS (WASM EDITION) ---
    
    // 1. MEMORY (HASH)
    // WASM allows us to use large memory! 
    // This makes it remember evaluations instantly.
    engine.postMessage('setoption name Hash value 64');

    // 2. CONTEMPT (100 = MAX)
    engine.postMessage('setoption name Contempt value 100');

    // 3. THREADS
    // Use 1 thread for maximum stability on mobile Safari
    engine.postMessage('setoption name Threads value 1');

    // 4. AGGRESSION
    engine.postMessage('setoption name Skill Level value 20');
    engine.postMessage('setoption name Ponder value true');
    engine.postMessage('setoption name MultiPV value 3');
}
