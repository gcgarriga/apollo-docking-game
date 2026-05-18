/**
 * Test setup file for Apollo Docking Game
 * Sets up mocks for browser APIs and DOM
 */

import { vi, beforeEach, afterEach } from 'vitest';

// ===== localStorage Mock =====
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = String(value);
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index) => {
            const keys = Object.keys(store);
            return keys[index] || null;
        }),
        // Helper for tests to access store directly
        _getStore: () => store,
        _setStore: (newStore) => { store = newStore; }
    };
})();

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true
});

// ===== Canvas Context Mock =====
export function createCanvasContextMock() {
    return {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        clearRect: vi.fn(),
        setLineDash: vi.fn(),
        getLineDash: vi.fn(() => []),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 10 })),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({
            data: new Uint8ClampedArray(4)
        })),
        putImageData: vi.fn(),
        createImageData: vi.fn(),
        // Properties
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        shadowBlur: 0,
        shadowColor: 'transparent',
        shadowOffsetX: 0,
        shadowOffsetY: 0
    };
}

// ===== Audio Context Mock =====
export function createAudioContextMock() {
    const oscillatorMock = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        type: 'sine',
        frequency: {
            value: 440,
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn()
        },
        detune: {
            value: 0,
            setValueAtTime: vi.fn()
        }
    };

    const gainNodeMock = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        gain: {
            value: 1,
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn()
        }
    };

    return {
        state: 'running',
        currentTime: 0,
        destination: {},
        sampleRate: 44100,
        resume: vi.fn(() => Promise.resolve()),
        suspend: vi.fn(() => Promise.resolve()),
        close: vi.fn(() => Promise.resolve()),
        createOscillator: vi.fn(() => ({ ...oscillatorMock })),
        createGain: vi.fn(() => ({ ...gainNodeMock })),
        createBiquadFilter: vi.fn(),
        createAnalyser: vi.fn(),
        createBufferSource: vi.fn(),
        decodeAudioData: vi.fn()
    };
}

// Global AudioContext mock. Use a regular function (not arrow) so callers can
// invoke it with `new` — vitest 4's vi.fn no longer wraps arrow impls as constructors.
globalThis.AudioContext = vi.fn(function AudioContextMock() { return createAudioContextMock(); });
globalThis.webkitAudioContext = globalThis.AudioContext;

// ===== requestAnimationFrame Mock =====
let rafId = 0;
globalThis.requestAnimationFrame = vi.fn((callback) => {
    rafId++;
    setTimeout(() => callback(performance.now()), 0);
    return rafId;
});

globalThis.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
});

// ===== DOM Setup =====
export function setupDOM() {
    document.body.innerHTML = `
        <div id="game-container">
            <canvas id="gameCanvas" width="800" height="600"></canvas>

            <div id="ui-layer">
                <div class="stat-line">Altitude: <span id="altitude">0</span> m</div>
                <div class="stat-line">Vertical Vel: <span id="v-vel">0.0</span> m/s</div>
                <div class="stat-line">Horizontal Vel: <span id="h-vel">0.0</span> m/s</div>
                <div class="stat-line">Fuel: <span id="fuel">100</span>%</div>
                <div class="stat-line">
                    <div>Distance to CSM: <span id="distance-csm">-</span> m</div>
                    <div>Rel Vel X: <span id="rel-vx">0.0</span> m/s <span id="vx-hint"></span></div>
                    <div>Rel Vel Y: <span id="rel-vy">0.0</span> m/s <span id="vy-hint"></span></div>
                </div>
            </div>

            <div id="message-overlay" style="display: none;">
                <h1 id="msg-title">Mission Status</h1>
                <p id="msg-detail">Details here</p>
                <p class="instructions">Press SPACE to Restart</p>
            </div>

            <div id="pause-overlay" style="display: none;">
                <h1>PAUSED</h1>
                <p>Press P or ESC to Resume</p>
            </div>

            <div id="tutorial-overlay" style="display: none;">
                <h1>Apollo Docking Simulator</h1>
                <p class="instructions">Press any key to start</p>
            </div>

            <div id="touch-controls" style="display: none;">
                <div class="touch-dpad">
                    <button class="touch-btn touch-up" data-key="ArrowUp">↑</button>
                    <button class="touch-btn touch-left" data-key="ArrowLeft">←</button>
                    <button class="touch-btn touch-down" data-key="ArrowDown">↓</button>
                    <button class="touch-btn touch-right" data-key="ArrowRight">→</button>
                </div>
            </div>

            <div id="achievement-notification" style="display: none;">
                <div class="achievement-header">Achievement Unlocked!</div>
                <div class="achievement-title" id="achievement-name"></div>
                <div class="achievement-desc" id="achievement-desc"></div>
            </div>

            <div id="trophy-overlay" style="display: none;">
                <div class="trophy-title">Trophy Room</div>
                <div class="trophy-grid" id="trophy-grid"></div>
                <div class="trophy-stats" id="trophy-stats"></div>
                <div class="trophy-close">Press T or ESC to close</div>
            </div>
        </div>
    `;

    // Mock canvas getContext
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.getContext = vi.fn(() => createCanvasContextMock());
    }
}

// ===== Utility Functions for Tests =====

/**
 * Create a mock LM object for testing
 */
export function createMockLM(overrides = {}) {
    return {
        x: 400,
        y: 520,
        vx: 0,
        vy: 0,
        width: 30,
        height: 30,
        fuel: 100,
        ...overrides
    };
}

/**
 * Create a mock CSM object for testing
 */
export function createMockCSM(overrides = {}) {
    return {
        x: 100,
        y: 100,
        width: 50,
        height: 20,
        ...overrides
    };
}

/**
 * Reset all mocks between tests
 */
export function resetMocks() {
    vi.clearAllMocks();
    localStorage.clear();
}

// ===== Global Test Lifecycle =====
let originalConsoleError;

beforeEach(() => {
    resetMocks();
    setupDOM();
    // Suppress expected "Failed to initialize DOM elements" noise from createGameController
    originalConsoleError = console.error;
    console.error = vi.fn((...args) => {
        if (typeof args[0] === 'string' && args[0].includes('Failed to initialize DOM elements')) return;
        originalConsoleError.call(console, ...args);
    });
});

afterEach(() => {
    vi.clearAllTimers();
    console.error = originalConsoleError;
});
