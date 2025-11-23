/*
 * engine.js
 * A Standalone Web Worker that wraps Stockfish to mimic "Mittens"
 */

// We use Stockfish 10 from a CDN because it is a single file and reliable for mobile web.
// (Newer versions require WASM files which are harder to manage on iOS).
const STOCKFISH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';

// Internal variable to hold the actual Stockfish instance
let stockfish = null;

// 1. Load Stockfish immediately when this worker starts
loadStockfish();

async function loadStockfish() {
    try {
        // Fetch the raw Stockfish code from the CDN
        const response = await fetch(STOCKFISH_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const scriptContent = await response.text();
        
        // Create a "Blob" (a file in memory) from that code
        const blob = new Blob([scriptContent], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        // Initialize the internal Stockfish worker
        stockfish = new Worker(workerUrl);

        // Set up the listener to handle messages FROM Stockfish
        stockfish.onmessage = function(e) {
            const msg = e.data;
            
            // Check if Stockfish is ready, then inject Mittens personality
            if (msg === 'uciok') {
                applyMittensStrategy();
            }

            // Forward everything else back to the main website (index.html)
            self.postMessage(msg);
        };

        // Send an initial signal to the UI that we are alive
        // (Optional, but helps debug)
        console.log("Mittens Proxy: Stockfish loaded internally.");

    } catch (error) {
        self.postMessage("info string Error loading Stockfish: " + error.message);
    }
}

// 2. Listen for messages FROM the website (index.html)
self.onmessage = function(e) {
    if (!stockfish) return;
    
    // Forward the command directly to Stockfish
    stockfish.postMessage(e.data);
};

// 3. The "Mittens" Logic
function applyMittensStrategy() {
    // "Mittens" Persona Configuration:
    
    // High Contempt (50-60): Forces the engine to avoid draws and grind out wins.
    stockfish.postMessage('setoption name Contempt value 55');
    
    // MultiPV 3: As requested, show the top 3 lines.
    stockfish.postMessage('setoption name MultiPV value 3');
    
    // Skill Level: Max (Stockfish 10 doesn't use 20 scale the same as SF15, 
    // but we ensure no limitation is set).
    stockfish.postMessage('setoption name Skill Level value 20');
    
    // Ponder: Think during opponent's time
    stockfish.postMessage('setoption name Ponder value true');
    
    // Send 'uciok' back to the UI so it knows we are ready
    // (Stockfish sent it to us, we intercepted it, applied settings, now we confirm).
    // Note: We don't strictly need to send it manually because we forwarded the original 
    // message in the onmessage handler, but this ensures settings are applied first.
}
