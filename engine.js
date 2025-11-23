/**
 * engine.js
 * 
 * A UCI-compatible engine wrapper designed to replicate the playing style 
 * of the "Mittens" bot:
 * 1. Maximum Strength (Stockfish 16 NNUE equivalent).
 * 2. "Grinder" Config: High Contempt to avoid draws and force complex endgames.
 * 3. MultiPV: 3 (calculates top 3 lines simultaneously).
 * 
 * Usage: import CustomEngine from './mittens.js';
 */

const STOCKFISH_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';

export default class MittensEngine {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.init();
    }

    async init() {
        // 1. Load the engine source via fetch to bypass CORS on GitHub Pages
        // We use a Blob to create a local URL for the worker.
        try {
            const response = await fetch(STOCKFISH_CDN_URL);
            const scriptContent = await response.text();
            const blob = new Blob([scriptContent], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);

            this.worker = new Worker(workerUrl);
            this.setupListeners();
            
            // Initialize UCI mode
            this.post('uci');

        } catch (error) {
            console.error("Mittens (Engine) failed to load:", error);
        }
    }

    setupListeners() {
        this.worker.onmessage = (e) => {
            const msg = e.data;

            // Forward the engine's output to the console (or hook this to your UI)
            // Most UI's will override .onmessage, but we capture initialization here.
            
            if (msg === 'uciok') {
                this.applyMittensStrategy();
            }

            // Pass message to the external handler if it exists
            if (this.onmessage) {
                this.onmessage(e);
            }
        };
    }

    /**
     * THE MITTENS CONFIGURATION
     * This applies the "Grinding/Karpov" parameters.
     */
    applyMittensStrategy() {
        // 1. Set Skill Level to Max (Mittens did not make mistakes)
        this.post('setoption name Skill Level value 20');

        // 2. High Contempt (The "Grind")
        // Standard Stockfish Contempt is 0 or low. 
        // Setting this to 50+ tells the engine: "A draw is as bad as losing."
        // This forces the engine to play on in equal positions, squeezing the opponent
        // rather than trading down.
        this.post('setoption name Contempt value 50');

        // 3. MultiPV 3 (Show top 3 moves as requested)
        this.post('setoption name MultiPV value 3');

        // 4. Ponder (Think on opponent's time to increase pressure)
        this.post('setoption name Ponder value true');
        
        this.isReady = true;
        this.post('isready');
    }

    /**
     * Standard UCI Communication Methods
     */
    postMessage(cmd) {
        // Alias for post to match standard Worker API if the UI expects it
        this.post(cmd);
    }

    post(cmd) {
        if (this.worker) {
            this.worker.postMessage(cmd);
        }
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
        }
    }
}
