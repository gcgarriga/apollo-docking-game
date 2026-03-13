/**
 * Apollo Ascent & Docking Simulator
 *
 * Physics Model:
 * - Gravity: Constant downward acceleration of 1.62 m/s² (scaled for gameplay).
 * - Inertia: Newtons First Law. Objects keep moving unless acted upon by a force.
 * - Thrust: Adds acceleration vectors to velocity. Main engine is stronger than RCS.
 * - Screen Wrap: Horizontal position wraps around 0-800 to simulate orbit.
 */

// ===== Configuration Constants =====

// Physics Constants (per-second values, multiplied by dt each frame)
export const TARGET_FPS = 60;
export const GRAVITY = 0.05 * TARGET_FPS;           // Downward acceleration per second
export const MAIN_THRUST = 0.15 * TARGET_FPS;       // Up arrow force per second
export const RCS_THRUST = 0.08 * TARGET_FPS;        // RCS force per second
export const FUEL_MAIN_COST = 0.2 * TARGET_FPS;     // Fuel cost per second for main engine
export const FUEL_RCS_COST = 0.05 * TARGET_FPS;     // Fuel cost per second for RCS

// Canvas & World Constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const GROUND_Y = 550;         // Surface level
export const CSM_ORBIT_Y = 100;      // Height of CSM orbit
export const CSM_SPEED = 0.7;        // Orbital speed of CSM (pixels per frame at 60fps, same unit as lm velocity)

// Threshold Constants
export const DOCKING_VEL_THRESHOLD_X = 1.5;    // Max horizontal relative velocity for successful docking (increased)
export const DOCKING_VEL_THRESHOLD_Y = 1.5;    // Max vertical relative velocity for successful docking (increased)
export const CRASH_VEL_THRESHOLD = 2.0;        // Vertical velocity threshold for crash on landing
export const FUEL_WARNING_THRESHOLD = 20;      // Fuel percentage to display warning color
export const FUEL_CRITICAL_THRESHOLD = 10;     // Fuel percentage considered critical
export const LANDING_FRICTION = 0.9;           // Friction multiplier on landing
export const FUEL_DEPLETION_ALTITUDE_THRESHOLD = 50;  // Min altitude to trigger fuel depletion failure

// Rendering Constants
export const PARTICLE_COUNT_PER_THRUST = 3;    // Number of particles spawned per thrust frame
export const PARTICLE_MIN_LIFE = 20;           // Minimum particle lifespan in frames
export const PARTICLE_MAX_LIFE = 40;           // Maximum particle lifespan in frames
export const PARTICLE_ALPHA_DIVISOR = 30;      // Alpha calculation divisor for particle fade
export const STAR_COUNT = 100;                 // Number of background stars
export const LM_GHOST_THRESHOLD = 30;          // Distance from edge to show ghost LM (screen wrap)
export const DOCKING_AIDS_RANGE = 400;         // Distance at which docking aids become visible
export const TRAJECTORY_PREDICTION_STEPS = 60; // Number of frames to predict trajectory

// ===== Game State =====
// Note: Game state is managed locally within createGameController().
// These module-level variables exist only as default parameter values for createLM/createCSM.
export const particles = [];

// ===== Scoring System =====
export function calculateScore(fuelRemaining, timeElapsed, relVx, relVy) {
    const fuelScore = Math.floor(fuelRemaining * 10);  // Max 1000
    const timeBonus = Math.max(0, 500 - Math.floor(timeElapsed / 100)); // Faster = more points
    const precisionBonus = Math.floor((2 - relVx - relVy) * 250); // Max 500 for perfect approach
    return Math.max(0, fuelScore + timeBonus + precisionBonus);
}

// ===== Achievement System =====
export const ACHIEVEMENTS = {
    first_dock: {
        id: 'first_dock',
        name: 'First Contact',
        description: 'Complete your first successful docking',
        icon: '🚀',
        check: (stats) => stats.totalDockings >= 1
    },
    perfect_dock: {
        id: 'perfect_dock',
        name: 'Perfect Docking',
        description: 'Dock with relative velocity under 0.5 m/s',
        icon: '🎯',
        check: (stats) => stats.relVx < 0.5 && stats.relVy < 0.5
    },
    fuel_miser: {
        id: 'fuel_miser',
        name: 'Fuel Miser',
        description: 'Complete docking with 60%+ fuel remaining',
        icon: '⛽',
        check: (stats) => stats.fuelRemaining >= 60
    },
    speed_runner: {
        id: 'speed_runner',
        name: 'Speed Runner',
        description: 'Dock in under 30 seconds',
        icon: '⚡',
        check: (stats) => stats.timeElapsed < 30000
    },
    close_call: {
        id: 'close_call',
        name: 'Close Call',
        description: 'Dock with less than 5% fuel remaining',
        icon: '😰',
        check: (stats) => stats.fuelRemaining < 5 && stats.fuelRemaining > 0
    },
    veteran: {
        id: 'veteran',
        name: 'Veteran Pilot',
        description: 'Complete 5 successful dockings',
        icon: '🎖️',
        check: (stats) => stats.totalDockings >= 5
    },
    ace: {
        id: 'ace',
        name: 'Ace Pilot',
        description: 'Complete 10 successful dockings',
        icon: '👨‍🚀',
        check: (stats) => stats.totalDockings >= 10
    },
    high_scorer: {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Achieve a score of 1500 or higher',
        icon: '🏆',
        check: (stats) => stats.score >= 1500
    }
};

// Load achievements from localStorage
export function loadAchievements() {
    const defaults = {
        unlocked: {},
        totalDockings: 0,
        bestScore: 0,
        bestTime: Infinity
    };
    if (typeof localStorage === 'undefined') {
        return defaults;
    }
    try {
        const saved = localStorage.getItem('apolloAchievements');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        // Corrupt data — clear it and start fresh
        localStorage.removeItem('apolloAchievements');
    }
    return defaults;
}

// Save achievements to localStorage
export function saveAchievements(data) {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('apolloAchievements', JSON.stringify(data));
    }
}

// Achievement state is managed locally within createGameController().
// checkAchievements() accepts achievement data as a parameter.

// Check and unlock achievements
export function checkAchievements(stats, currentAchievementData) {
    const newlyUnlocked = [];

    for (const key in ACHIEVEMENTS) {
        const achievement = ACHIEVEMENTS[key];
        if (!currentAchievementData.unlocked[achievement.id] && achievement.check(stats)) {
            currentAchievementData.unlocked[achievement.id] = {
                unlockedAt: Date.now()
            };
            newlyUnlocked.push(achievement);
        }
    }

    if (newlyUnlocked.length > 0) {
        saveAchievements(currentAchievementData);
    }

    return newlyUnlocked;
}

// ===== Particle System =====
export class Particle {
    constructor(x, y, vx, vy, life, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / PARTICLE_ALPHA_DIVISOR;
        ctx.fillRect(this.x, this.y, 2, 2);
        ctx.globalAlpha = 1.0;
    }
}

export function spawnExhaust(x, y, direction, particleArray = particles) {
    // direction: 'down' (main), 'up' (rcs-down), 'left' (rcs-right), 'right' (rcs-left)
    for(let i=0; i<PARTICLE_COUNT_PER_THRUST; i++) {
        let vx = (Math.random() - 0.5) * 1;
        let vy = (Math.random() - 0.5) * 1;
        let color = '#ffaa00'; // orange

        if (direction === 'down') {
            vy += 2;
            color = '#ffcc00'; // brighter for main
        } else if (direction === 'up') vy -= 1;
        else if (direction === 'left') vx -= 1;
        else if (direction === 'right') vx += 1;

        particleArray.push(new Particle(x, y, vx, vy, PARTICLE_MIN_LIFE + Math.random()*(PARTICLE_MAX_LIFE-PARTICLE_MIN_LIFE), color));
    }
}

// ===== Physics Utilities =====
export function calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function calculateRelativeVelocityX(lmVx) {
    return lmVx - CSM_SPEED;
}

export function calculateRelativeVelocityY(lmVy) {
    return Math.abs(lmVy);
}

export function calculateAltitude(lmY) {
    return GROUND_Y - (lmY + 15);
}

export function applyScreenWrap(x) {
    if (x > CANVAS_WIDTH) return x - CANVAS_WIDTH;
    if (x < 0) return x + CANVAS_WIDTH;
    return x;
}

// ===== Get approach status color based on relative velocity =====
export function getApproachStatus(relVx, relVy) {
    // Green: Both velocities safe for docking
    if (relVx < 0.5 && relVy < 0.5) return '#44ff44'; // Green
    // Yellow: At least one velocity in caution range
    if (relVx < DOCKING_VEL_THRESHOLD_X && relVy < DOCKING_VEL_THRESHOLD_Y) return '#ffff44'; // Yellow
    // Red: Too fast for docking
    return '#ff4444'; // Red
}

// ===== LM Factory =====
export function createLM(initialState = {}) {
    return {
        x: initialState.x ?? CANVAS_WIDTH / 2,
        y: initialState.y ?? GROUND_Y - 30,
        vx: initialState.vx ?? 0,
        vy: initialState.vy ?? 0,
        width: 30,
        height: 30,
        fuel: initialState.fuel ?? 100,

        update: function(currentKeys = {}, currentGameState = 'playing', callbacks = {}, dt = 1 / TARGET_FPS) {
            if (currentGameState !== 'playing') return;

            // Gravity
            this.vy += GRAVITY * dt;

            // Apply Thrust
            if (this.fuel > 0) {
                // Main Engine (Up Arrow -> Force Up)
                if (currentKeys['ArrowUp']) {
                    this.vy -= MAIN_THRUST * dt;
                    this.fuel -= FUEL_MAIN_COST * dt;
                    if (callbacks.onMainThrust) callbacks.onMainThrust(this.x, this.y + this.height/2);
                }
                // RCS Down (Down Arrow -> Force Down)
                if (currentKeys['ArrowDown']) {
                    this.vy += RCS_THRUST * dt;
                    this.fuel -= FUEL_RCS_COST * dt;
                    if (callbacks.onRcsThrust) callbacks.onRcsThrust(this.x, this.y - this.height/2, 'up');
                }
                // RCS Left (Left Arrow -> Force Left)
                if (currentKeys['ArrowLeft']) {
                    this.vx -= RCS_THRUST * dt;
                    this.fuel -= FUEL_RCS_COST * dt;
                    if (callbacks.onRcsThrust) callbacks.onRcsThrust(this.x + this.width/2, this.y, 'right');
                }
                // RCS Right (Right Arrow -> Force Right)
                if (currentKeys['ArrowRight']) {
                    this.vx += RCS_THRUST * dt;
                    this.fuel -= FUEL_RCS_COST * dt;
                    if (callbacks.onRcsThrust) callbacks.onRcsThrust(this.x - this.width/2, this.y, 'left');
                }
            }

            // Clamp fuel
            if (this.fuel < 0) this.fuel = 0;

            // Low fuel alarm
            if (this.fuel > 0 && this.fuel < FUEL_WARNING_THRESHOLD) {
                if (callbacks.onLowFuel) callbacks.onLowFuel();
            }

            // Apply movement
            this.x += this.vx * dt * TARGET_FPS;
            this.y += this.vy * dt * TARGET_FPS;

            // Screen Wrap
            this.x = applyScreenWrap(this.x);

            // Ground Collision
            if (this.y + this.height/2 >= GROUND_Y) {
                // Check impact speed
                if (this.vy > CRASH_VEL_THRESHOLD) {
                    if (callbacks.onCrash) callbacks.onCrash("Crashed into lunar surface!");
                    return 'crashed';
                } else {
                    // Landed safely (or waiting to launch)
                    this.y = GROUND_Y - this.height/2;
                    this.vy = 0;
                    this.vx *= LANDING_FRICTION;
                    return 'landed';
                }
            }

            // Fuel Depletion Check
            if (this.fuel <= 0) {
                const altitude = GROUND_Y - (this.y + 15);
                if (altitude > FUEL_DEPLETION_ALTITUDE_THRESHOLD) {
                    if (callbacks.onFuelDepleted) callbacks.onFuelDepleted();
                    return 'fuel_depleted';
                }
            }

            return 'flying';
        },

        draw: function(ctx) {
            drawLMAtPosition(ctx, this.x, this.y);
        }
    };
}

// ===== CSM Factory =====
export function createCSM(initialState = {}) {
    return {
        x: initialState.x ?? Math.random() * CANVAS_WIDTH,
        y: initialState.y ?? CSM_ORBIT_Y,
        width: 50,
        height: 20,

        update: function(dt = 1 / TARGET_FPS) {
            this.x += CSM_SPEED * dt * TARGET_FPS;
            this.x = applyScreenWrap(this.x);
        },

        draw: function(ctx) {
            drawCSMAtPosition(ctx, this.x, this.y);
        }
    };
}

// ===== Collision Detection =====
export function checkDockingCollision(lm, csm) {
    // LM bounds
    const lmLeft = lm.x - 15;
    const lmRight = lm.x + 15;
    const lmTop = lm.y - 15;
    const lmBottom = lm.y + 15;

    // CSM docking port zone (top of CSM, centered horizontally)
    const dockingZoneLeft = csm.x - 15;
    const dockingZoneRight = csm.x + 15;
    const dockingZoneTop = csm.y - 25;
    const dockingZoneBottom = csm.y - 5;

    // Check if LM is in docking zone (approaching from below)
    const inDockingZone = (lmRight > dockingZoneLeft && lmLeft < dockingZoneRight &&
                          lmBottom > dockingZoneTop && lmTop < dockingZoneBottom);

    // General CSM collision bounds (for crash detection)
    const csmLeft = csm.x - 20;
    const csmRight = csm.x + 25;
    const csmTop = csm.y - 10;
    const csmBottom = csm.y + 10;

    const generalCollision = (lmRight > csmLeft && lmLeft < csmRight &&
                             lmBottom > csmTop && lmTop < csmBottom);

    if (inDockingZone) {
        const relVx = Math.abs(lm.vx - CSM_SPEED);
        const relVy = Math.abs(lm.vy);

        if (relVx < DOCKING_VEL_THRESHOLD_X && relVy < DOCKING_VEL_THRESHOLD_Y) {
            return { type: 'docking_success', relVx, relVy };
        } else {
            return { type: 'docking_failed_velocity', relVx, relVy };
        }
    } else if (generalCollision) {
        return { type: 'collision_wrong_angle' };
    }

    return { type: 'none' };
}

// ===== Rendering Functions =====
export function drawLMAtPosition(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Draw LM (Simple Polygon - Ascent Stage Shape)
    ctx.fillStyle = '#D4AF37'; // Gold
    ctx.beginPath();
    // Body
    ctx.moveTo(-15, 15);
    ctx.lineTo(15, 15);
    ctx.lineTo(15, -5);
    ctx.lineTo(10, -15);
    ctx.lineTo(-10, -15);
    ctx.lineTo(-15, -5);
    ctx.closePath();
    ctx.fill();

    // Stroke
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Window
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(0, -10);
    ctx.lineTo(5, -5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

export function drawCSMAtPosition(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Service Module (Cylinder)
    ctx.fillStyle = '#ccc';
    ctx.fillRect(-20, -10, 30, 20);

    // Command Module (Cone) - pointing right (direction of travel)
    ctx.fillStyle = '#eee';
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.lineTo(25, 0);
    ctx.lineTo(10, 10);
    ctx.closePath();
    ctx.fill();

    // Engine Bell (back/left side)
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(-20, -5);
    ctx.lineTo(-28, -8);
    ctx.lineTo(-28, 8);
    ctx.lineTo(-20, 5);
    ctx.closePath();
    ctx.fill();

    // DOCKING PORT - clearly marked on top of CSM
    ctx.fillStyle = '#888';
    ctx.fillRect(-5, -15, 10, 5);

    // Docking port opening
    ctx.fillStyle = '#333';
    ctx.fillRect(-3, -14, 6, 3);

    ctx.restore();
}

// ===== Celebration Effects =====
export function spawnCelebration(x, y, targetArray = celebrationParticles) {
    const colors = ['#ff0', '#0f0', '#0ff', '#f0f', '#f90', '#fff'];
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        targetArray.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 60 + Math.random() * 40,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 2 + Math.random() * 3
        });
    }
}

export function updateCelebrationParticles(targetArray = celebrationParticles) {
    for (let i = targetArray.length - 1; i >= 0; i--) {
        const p = targetArray[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // Gravity
        p.life--;
        if (p.life <= 0) targetArray.splice(i, 1);
    }
}

// ===== Audio System (Web Audio API) =====
let audioCtx = null;

export function initAudio() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

export function getAudioContext() {
    return audioCtx;
}

export function setAudioContext(ctx) {
    audioCtx = ctx;
}

export function playSound(type) {
    try {
        const ctx = initAudio();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        switch(type) {
            case 'thrust':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(80, now);
                oscillator.frequency.exponentialRampToValueAtTime(60, now + 0.1);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;

            case 'rcs':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(200, now);
                gainNode.gain.setValueAtTime(0.03, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                oscillator.start(now);
                oscillator.stop(now + 0.05);
                break;

            case 'dock_success':
                // Play a nice chord
                [523, 659, 784].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(0.15, now + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8 + i * 0.1);
                    osc.start(now + i * 0.1);
                    osc.stop(now + 1 + i * 0.1);
                });
                return;

            case 'collision':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.3);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;

            case 'alarm':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(440, now);
                oscillator.frequency.setValueAtTime(880, now + 0.15);
                oscillator.frequency.setValueAtTime(440, now + 0.3);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.setValueAtTime(0.1, now + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
                oscillator.start(now);
                oscillator.stop(now + 0.45);
                break;
        }
    } catch(e) {
        // Audio not supported, fail silently
    }
}

export function playAchievementSound() {
    try {
        const ctx = initAudio();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;

        // Play ascending arpeggio
        [880, 1100, 1320, 1760].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            gain.gain.setValueAtTime(0.1, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3 + i * 0.08);
            osc.start(now + i * 0.08);
            osc.stop(now + 0.4 + i * 0.08);
        });
    } catch(e) {
        // Audio not supported
    }
}

// Sound throttling
let lastThrustSound = 0;
let lastRcsSound = 0;
let lastAlarmSound = 0;

export function playThrustSound() {
    const now = Date.now();
    if (now - lastThrustSound > 100) {
        playSound('thrust');
        lastThrustSound = now;
    }
}

export function playRcsSound() {
    const now = Date.now();
    if (now - lastRcsSound > 80) {
        playSound('rcs');
        lastRcsSound = now;
    }
}

export function playAlarmSound() {
    const now = Date.now();
    if (now - lastAlarmSound > 500) {
        playSound('alarm');
        lastAlarmSound = now;
    }
}

// ===== Game Controller =====
export function createGameController(options = {}) {
    // DOM elements - initialized lazily
    let canvas, ctx;
    let uiAltitude, uiVVel, uiHVel, uiFuel;
    let uiDistanceCSM, uiRelVx, uiRelVy, uiVxHint, uiVyHint;
    let msgOverlay, msgTitle, msgDetail;
    let pauseOverlay, tutorialOverlay, trophyOverlay;
    let touchControls, touchButtons;
    let achievementNotification, achievementName, achievementDesc;
    let trophyGrid, trophyStats;

    // Game objects
    let lm = createLM();
    let csm = createCSM();
    let starList = [];
    let localGameState = 'playing';
    let localKeys = {};
    let localGameStartTime = Date.now();
    let localScreenShake = 0;
    let localParticles = [];
    let localCelebrationParticles = [];
    let localAchievementData = loadAchievements();
    let localPendingNotifications = [];
    let localNotificationTimeout = null;

    function initDOM() {
        if (typeof document === 'undefined') return false;

        canvas = document.getElementById('gameCanvas');
        if (!canvas) return false;
        ctx = canvas.getContext('2d');

        uiAltitude = document.getElementById('altitude');
        uiVVel = document.getElementById('v-vel');
        uiHVel = document.getElementById('h-vel');
        uiFuel = document.getElementById('fuel');
        uiDistanceCSM = document.getElementById('distance-csm');
        uiRelVx = document.getElementById('rel-vx');
        uiRelVy = document.getElementById('rel-vy');
        uiVxHint = document.getElementById('vx-hint');
        uiVyHint = document.getElementById('vy-hint');
        msgOverlay = document.getElementById('message-overlay');
        msgTitle = document.getElementById('msg-title');
        msgDetail = document.getElementById('msg-detail');
        pauseOverlay = document.getElementById('pause-overlay');
        tutorialOverlay = document.getElementById('tutorial-overlay');
        trophyOverlay = document.getElementById('trophy-overlay');
        touchControls = document.getElementById('touch-controls');
        touchButtons = document.querySelectorAll('.touch-btn');
        achievementNotification = document.getElementById('achievement-notification');
        achievementName = document.getElementById('achievement-name');
        achievementDesc = document.getElementById('achievement-desc');
        trophyGrid = document.getElementById('trophy-grid');
        trophyStats = document.getElementById('trophy-stats');

        // Generate stars with twinkle properties
        for(let i=0; i<STAR_COUNT; i++) {
            starList.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() * 2,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 2
            });
        }

        return true;
    }

    function initInputHandlers() {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', (e) => {
            localKeys[e.key] = true;

            // Dismiss tutorial on any key
            if (tutorialOverlay && tutorialOverlay.style.display === 'block') {
                tutorialOverlay.style.display = 'none';
                localStorage.setItem('apolloTutorialShown', 'true');
                e.preventDefault();
                return;
            }

            // Toggle help with ?
            if (e.key === '?' && localGameState === 'playing') {
                toggleHelp();
                e.preventDefault();
                return;
            }

            // Toggle trophy room with T
            if ((e.key === 't' || e.key === 'T') && localGameState !== 'won' && localGameState !== 'lost') {
                if (tutorialOverlay) tutorialOverlay.style.display = 'none';
                if (pauseOverlay) pauseOverlay.style.display = 'none';
                toggleTrophyRoom();
                e.preventDefault();
                return;
            }

            // Pause/Resume with P or ESC
            if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && (localGameState === 'playing' || localGameState === 'paused')) {
                if (trophyOverlay && trophyOverlay.style.display === 'block') {
                    toggleTrophyRoom();
                    e.preventDefault();
                    return;
                }
                togglePause();
                e.preventDefault();
            }

            // Restart with SPACE
            if (e.code === 'Space' && (localGameState === 'won' || localGameState === 'lost')) {
                resetGame();
            }
        });

        window.addEventListener('keyup', (e) => {
            localKeys[e.key] = false;
        });

        // Touch controls
        initTouchControls();
    }

    function initTouchControls() {
        if (typeof window === 'undefined' || !touchControls) return;

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            touchControls.style.display = 'block';

            touchButtons.forEach(button => {
                const key = button.getAttribute('data-key');

                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    localKeys[key] = true;
                });

                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    localKeys[key] = false;
                });

                button.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    localKeys[key] = false;
                });
            });
        }
    }

    function showAchievementNotification(achievement) {
        if (!achievementNotification || !achievementName || !achievementDesc) return;

        achievementName.textContent = `${achievement.icon} ${achievement.name}`;
        achievementDesc.textContent = achievement.description;

        achievementNotification.style.display = 'block';
        achievementNotification.style.animation = 'none';
        achievementNotification.offsetHeight;
        achievementNotification.style.animation = 'slideIn 0.5s ease-out, glow 1.5s ease-in-out infinite';

        playAchievementSound();

        if (localNotificationTimeout) clearTimeout(localNotificationTimeout);
        localNotificationTimeout = setTimeout(() => {
            achievementNotification.style.display = 'none';
            if (localPendingNotifications.length > 0) {
                const next = localPendingNotifications.shift();
                setTimeout(() => showAchievementNotification(next), 300);
            }
        }, 3000);
    }

    function queueAchievementNotification(achievement) {
        if (!achievementNotification) return;
        if (achievementNotification.style.display === 'block') {
            localPendingNotifications.push(achievement);
        } else {
            showAchievementNotification(achievement);
        }
    }

    function localCheckAchievements(stats) {
        const newlyUnlocked = [];

        for (const key in ACHIEVEMENTS) {
            const achievement = ACHIEVEMENTS[key];
            if (!localAchievementData.unlocked[achievement.id] && achievement.check(stats)) {
                localAchievementData.unlocked[achievement.id] = {
                    unlockedAt: Date.now()
                };
                newlyUnlocked.push(achievement);
            }
        }

        if (newlyUnlocked.length > 0) {
            saveAchievements(localAchievementData);
            newlyUnlocked.forEach(a => queueAchievementNotification(a));
        }

        return newlyUnlocked;
    }

    function renderTrophyRoom() {
        if (!trophyGrid || !trophyStats) return;

        trophyGrid.innerHTML = '';

        for (const key in ACHIEVEMENTS) {
            const achievement = ACHIEVEMENTS[key];
            const isUnlocked = localAchievementData.unlocked[achievement.id];

            const item = document.createElement('div');
            item.className = `trophy-item ${isUnlocked ? 'unlocked' : 'locked'}`;

            item.innerHTML = `
                <div class="trophy-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
                <div class="trophy-name">${isUnlocked ? achievement.name : '???'}</div>
                <div class="trophy-description">${isUnlocked ? achievement.description : 'Keep playing to unlock'}</div>
            `;

            trophyGrid.appendChild(item);
        }

        const totalAchievements = Object.keys(ACHIEVEMENTS).length;
        const unlockedCount = Object.keys(localAchievementData.unlocked).length;
        const percentage = Math.floor((unlockedCount / totalAchievements) * 100);

        trophyStats.innerHTML = `
            ${unlockedCount}/${totalAchievements} Achievements (${percentage}%)<br>
            Total Dockings: ${localAchievementData.totalDockings} | Best Score: ${localAchievementData.bestScore}
        `;
    }

    function toggleTrophyRoom() {
        if (!trophyOverlay) return;
        if (trophyOverlay.style.display === 'block') {
            trophyOverlay.style.display = 'none';
            if (localGameState === 'paused') {
                localGameState = 'playing';
            }
        } else {
            renderTrophyRoom();
            trophyOverlay.style.display = 'block';
            if (localGameState === 'playing') {
                localGameState = 'paused';
            }
        }
    }

    function togglePause() {
        if (localGameState === 'playing') {
            localGameState = 'paused';
            if (pauseOverlay) pauseOverlay.style.display = 'block';
        } else if (localGameState === 'paused') {
            localGameState = 'playing';
            if (pauseOverlay) pauseOverlay.style.display = 'none';
        }
    }

    function toggleHelp() {
        if (!tutorialOverlay) return;
        if (tutorialOverlay.style.display === 'block') {
            tutorialOverlay.style.display = 'none';
            if (localGameState === 'paused') {
                localGameState = 'playing';
            }
        } else {
            tutorialOverlay.style.display = 'block';
            if (localGameState === 'playing') {
                localGameState = 'paused';
            }
        }
    }

    function showTutorialIfFirstVisit() {
        if (typeof localStorage === 'undefined' || !tutorialOverlay) return;
        const tutorialShown = localStorage.getItem('apolloTutorialShown');
        if (!tutorialShown) {
            tutorialOverlay.style.display = 'block';
        }
    }

    function endGame(success, message) {
        localGameState = success ? 'won' : 'lost';

        if (msgTitle) {
            msgTitle.innerText = success ? "MISSION ACCOMPLISHED" : "MISSION FAILED";
            msgTitle.style.color = success ? "#44ff44" : "#ff4444";
        }
        if (msgDetail) msgDetail.innerText = message;

        if (success) {
            const timeElapsed = Date.now() - localGameStartTime;
            const relVx = Math.abs(lm.vx - CSM_SPEED);
            const relVy = Math.abs(lm.vy);
            const score = calculateScore(lm.fuel, timeElapsed, relVx, relVy);

            localAchievementData.totalDockings++;
            if (score > localAchievementData.bestScore) {
                localAchievementData.bestScore = score;
            }
            if (timeElapsed < localAchievementData.bestTime) {
                localAchievementData.bestTime = timeElapsed;
            }
            saveAchievements(localAchievementData);

            const stats = {
                totalDockings: localAchievementData.totalDockings,
                fuelRemaining: lm.fuel,
                timeElapsed: timeElapsed,
                relVx: relVx,
                relVy: relVy,
                score: score
            };
            const newAchievements = localCheckAchievements(stats);

            if (msgDetail) {
                msgDetail.innerText += `\n\nFuel Remaining: ${Math.floor(lm.fuel)}%`;
                msgDetail.innerText += `\nTime: ${(timeElapsed / 1000).toFixed(1)}s`;
                msgDetail.innerText += `\n\n⭐ SCORE: ${score}`;

                if (newAchievements.length > 0) {
                    msgDetail.innerText += `\n\n🏆 ${newAchievements.length} Achievement${newAchievements.length > 1 ? 's' : ''} Unlocked!`;
                }
            }

            playSound('dock_success');
            spawnCelebration(lm.x, lm.y, localCelebrationParticles);
        } else {
            playSound('collision');
            localScreenShake = 15;
        }

        if (msgOverlay) msgOverlay.style.display = 'block';
    }

    function resetGame() {
        localGameState = 'playing';
        localGameStartTime = Date.now();
        if (msgOverlay) msgOverlay.style.display = 'none';
        if (pauseOverlay) pauseOverlay.style.display = 'none';

        lm = createLM();
        csm = createCSM();
        localParticles.length = 0;
        localCelebrationParticles.length = 0;
        localScreenShake = 0;
        lastFrameTime = 0;
    }

    function checkCollisions() {
        const result = checkDockingCollision(lm, csm);

        switch (result.type) {
            case 'docking_success':
                endGame(true, "Docking Successful!");
                break;
            case 'docking_failed_velocity':
                endGame(false, "Docking failed! Approach velocity too high.\nTip: Match CSM speed (→) and slow your vertical velocity.");
                break;
            case 'collision_wrong_angle':
                endGame(false, "Collision! Wrong approach angle.\nTip: Approach the docking port from BELOW the CSM.");
                break;
        }
    }

    function updateUI() {
        if (!uiAltitude) return;

        uiAltitude.innerText = Math.max(0, Math.floor(GROUND_Y - (lm.y + 15)));
        uiVVel.innerText = (-lm.vy * 10).toFixed(1);
        uiHVel.innerText = (lm.vx * 10).toFixed(1);
        uiFuel.innerText = Math.floor(lm.fuel);

        const dx = csm.x - lm.x;
        const dy = csm.y - lm.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        uiDistanceCSM.innerText = Math.floor(distance);

        const relVxRaw = lm.vx - CSM_SPEED;
        const relVx = Math.abs(relVxRaw);
        const relVyRaw = lm.vy;
        const relVy = Math.abs(relVyRaw);

        uiRelVx.innerText = (relVx * 10).toFixed(1);
        uiRelVy.innerText = (relVy * 10).toFixed(1);

        if (relVx > 0.5) {
            uiVxHint.innerText = relVxRaw < 0 ? '(press →)' : '(press ←)';
            uiVxHint.style.color = '#ffaa00';
        } else {
            uiVxHint.innerText = '✓';
            uiVxHint.style.color = '#44ff44';
        }

        if (relVy > 0.5) {
            uiVyHint.innerText = relVyRaw > 0 ? '(press ↑)' : '(press ↓)';
            uiVyHint.style.color = '#ffaa00';
        } else {
            uiVyHint.innerText = '✓';
            uiVyHint.style.color = '#44ff44';
        }

        uiRelVx.style.color = relVx < 0.5 ? '#44ff44' : (relVx < DOCKING_VEL_THRESHOLD_X ? '#ffff44' : '#ff4444');
        uiRelVy.style.color = relVy < 0.5 ? '#44ff44' : (relVy < DOCKING_VEL_THRESHOLD_Y ? '#ffff44' : '#ff4444');

        if (lm.fuel < FUEL_WARNING_THRESHOLD) uiFuel.style.color = 'red';
        else uiFuel.style.color = 'white';
    }

    function drawFuelGauge() {
        const barX = CANVAS_WIDTH - 25;
        const barY = 40;
        const barW = 12;
        const barH = 150;
        const fuelPct = Math.max(0, lm.fuel) / 100;

        ctx.save();

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

        // Fuel fill — green to yellow to red
        const fillH = barH * fuelPct;
        const fillY = barY + barH - fillH;
        let r, g;
        if (fuelPct > 0.5) {
            r = Math.floor(255 * (1 - (fuelPct - 0.5) * 2));
            g = 255;
        } else {
            r = 255;
            g = Math.floor(255 * fuelPct * 2);
        }

        // Pulse when below warning threshold
        let alpha = 0.9;
        if (lm.fuel < FUEL_WARNING_THRESHOLD && lm.fuel > 0) {
            alpha = 0.5 + 0.4 * Math.abs(Math.sin(Date.now() / 150));
        }

        ctx.fillStyle = `rgba(${r}, ${g}, 0, ${alpha})`;
        ctx.fillRect(barX, fillY, barW, fillH);

        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = '9px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('FUEL', barX + barW / 2, barY - 6);

        ctx.restore();
    }

    function drawBackground() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const now = Date.now() / 1000;
        starList.forEach(star => {
            const alpha = 0.4 + 0.6 * ((Math.sin(now * star.speed + star.phase) + 1) / 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        ctx.fillStyle = '#555';
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(100, GROUND_Y + 20, 30, 0, Math.PI*2);
        ctx.arc(300, GROUND_Y + 40, 50, 0, Math.PI*2);
        ctx.arc(600, GROUND_Y + 10, 20, 0, Math.PI*2);
        ctx.fill();
    }

    function drawCSMIndicator() {
        let dx = csm.x - lm.x;
        if (Math.abs(dx) > CANVAS_WIDTH / 2) {
            dx = dx > 0 ? dx - CANVAS_WIDTH : dx + CANVAS_WIDTH;
        }
        const dy = csm.y - lm.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const isLeft = dx < 0;

        ctx.save();
        ctx.fillStyle = distance < 150 ? '#44ff44' : '#aaaaaa';
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.8;

        const distText = `CSM: ${Math.floor(distance)}m`;
        ctx.fillText(distText, CANVAS_WIDTH / 2, 20);

        if (Math.abs(dx) > 100) {
            const arrowX = CANVAS_WIDTH / 2 + (isLeft ? -50 : 50);
            ctx.beginPath();
            if (isLeft) {
                ctx.moveTo(arrowX + 8, 17);
                ctx.lineTo(arrowX, 17);
                ctx.lineTo(arrowX + 4, 13);
                ctx.moveTo(arrowX, 17);
                ctx.lineTo(arrowX + 4, 21);
            } else {
                ctx.moveTo(arrowX - 8, 17);
                ctx.lineTo(arrowX, 17);
                ctx.lineTo(arrowX - 4, 13);
                ctx.moveTo(arrowX, 17);
                ctx.lineTo(arrowX - 4, 21);
            }
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();

        const isOffScreen = csm.x < 0 || csm.x > CANVAS_WIDTH;
        if (isOffScreen || Math.abs(dx) > CANVAS_WIDTH / 3) {
            const arrowX = isLeft ? 20 : CANVAS_WIDTH - 20;
            const arrowY = 80;

            ctx.save();
            ctx.fillStyle = distance < 150 ? '#44ff44' : '#aaaaaa';
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 2;

            if (distance < 100) {
                const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
                ctx.globalAlpha = pulse;
            }

            ctx.beginPath();
            if (isLeft) {
                ctx.moveTo(arrowX + 10, arrowY);
                ctx.lineTo(arrowX, arrowY - 8);
                ctx.lineTo(arrowX, arrowY + 8);
            } else {
                ctx.moveTo(arrowX - 10, arrowY);
                ctx.lineTo(arrowX, arrowY - 8);
                ctx.lineTo(arrowX, arrowY + 8);
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    function drawDockingTarget(x, y, isAligned) {
        const flashRate = Math.sin(Date.now() / 200) * 0.5 + 0.5;

        ctx.save();
        ctx.translate(x, y);

        if (isAligned) {
            ctx.strokeStyle = '#44ff44';
            ctx.fillStyle = '#44ff44';
        } else {
            ctx.strokeStyle = '#00aaff';
            ctx.fillStyle = '#00aaff';
        }

        ctx.globalAlpha = 0.4 + flashRate * 0.4;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(0, -40);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-6, -28);
        ctx.lineTo(0, -20);
        ctx.lineTo(6, -28);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -12, 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    function drawTrajectoryPrediction() {
        ctx.save();
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([3, 6]);

        ctx.beginPath();
        ctx.moveTo(lm.x, lm.y);

        let predX = lm.x;
        let predY = lm.y;
        let predVx = lm.vx;
        let predVy = lm.vy;
        const stepDt = 1 / TARGET_FPS;

        for (let i = 0; i < TRAJECTORY_PREDICTION_STEPS; i++) {
            predVy += GRAVITY * stepDt;
            predX += predVx * stepDt * TARGET_FPS;
            predY += predVy * stepDt * TARGET_FPS;

            if (predX > CANVAS_WIDTH) predX -= CANVAS_WIDTH;
            if (predX < 0) predX += CANVAS_WIDTH;

            if (predY > GROUND_Y) {
                ctx.lineTo(predX, GROUND_Y);
                break;
            }

            ctx.lineTo(predX, predY);
        }

        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    function drawDockingAids() {
        const dx = csm.x - lm.x;
        const dy = csm.y - lm.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        ctx.save();
        ctx.strokeStyle = '#336699';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, CSM_ORBIT_Y);
        ctx.lineTo(CANVAS_WIDTH, CSM_ORBIT_Y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#336699';
        ctx.font = '10px "Courier New"';
        ctx.globalAlpha = 0.6;
        ctx.fillText('CSM ORBIT', CANVAS_WIDTH - 70, CSM_ORBIT_Y - 5);
        ctx.restore();

        drawTrajectoryPrediction();

        const relVx = Math.abs(lm.vx - CSM_SPEED);
        const relVy = Math.abs(lm.vy);
        const statusColor = getApproachStatus(relVx, relVy);
        const isAligned = (statusColor === '#44ff44');

        drawDockingTarget(csm.x, csm.y, isAligned);

        if (distance < DOCKING_AIDS_RANGE) {
            ctx.save();
            ctx.strokeStyle = isAligned ? '#44ff44' : '#00aaff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.setLineDash([5, 10]);

            ctx.beginPath();
            ctx.moveTo(csm.x - 20, csm.y - 25);
            ctx.lineTo(csm.x - 40, csm.y + 100);
            ctx.moveTo(csm.x + 20, csm.y - 25);
            ctx.lineTo(csm.x + 40, csm.y + 100);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            if (distance < 300) {
                ctx.save();
                ctx.strokeStyle = statusColor;
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.moveTo(lm.x, lm.y);
                ctx.lineTo(csm.x, csm.y - 15);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }

            ctx.save();
            ctx.strokeStyle = '#44ff44';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(csm.x, csm.y - 15, 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#ffff44';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(csm.x, csm.y - 15, 50, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawCelebrationParticles() {
        localCelebrationParticles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 60;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    let lastFrameTime = 0;

    function loop(timestamp) {
        if (!lastFrameTime) lastFrameTime = timestamp;
        const rawDt = (timestamp - lastFrameTime) / 1000;
        // Clamp dt to avoid spiral of death on tab-switch
        const dt = Math.min(rawDt, 0.1);
        lastFrameTime = timestamp;

        if (localGameState === 'playing') {
            const callbacks = {
                onMainThrust: (x, y) => {
                    spawnExhaust(x, y, 'down', localParticles);
                    playThrustSound();
                },
                onRcsThrust: (x, y, dir) => {
                    spawnExhaust(x, y, dir, localParticles);
                    playRcsSound();
                },
                onLowFuel: () => playAlarmSound(),
                onCrash: (msg) => endGame(false, msg),
                onFuelDepleted: () => endGame(false, "Fuel Depleted! Unable to control craft.")
            };

            const status = lm.update(localKeys, localGameState, callbacks, dt);
            csm.update(dt);

            if (status === 'flying') {
                checkCollisions();
            }

            for (let i = localParticles.length - 1; i >= 0; i--) {
                localParticles[i].update();
                if (localParticles[i].life <= 0) localParticles.splice(i, 1);
            }
        }

        updateCelebrationParticles(localCelebrationParticles);

        ctx.save();
        if (localScreenShake > 0) {
            const shakeX = (Math.random() - 0.5) * localScreenShake;
            const shakeY = (Math.random() - 0.5) * localScreenShake;
            ctx.translate(shakeX, shakeY);
            localScreenShake *= 0.9;
            if (localScreenShake < 0.5) localScreenShake = 0;
        }

        drawBackground();
        drawCSMIndicator();
        drawDockingAids();

        localParticles.forEach(p => p.draw(ctx));

        csm.draw(ctx);
        lm.draw(ctx);

        if (lm.x < LM_GHOST_THRESHOLD) {
            drawLMAtPosition(ctx, lm.x + CANVAS_WIDTH, lm.y);
        } else if (lm.x > CANVAS_WIDTH - LM_GHOST_THRESHOLD) {
            drawLMAtPosition(ctx, lm.x - CANVAS_WIDTH, lm.y);
        }

        drawCelebrationParticles();
        drawFuelGauge();

        ctx.restore();

        updateUI();

        requestAnimationFrame(loop);
    }

    // Public API
    return {
        init: function() {
            if (!initDOM()) {
                if (typeof process === 'undefined') {
                    console.error('Failed to initialize DOM elements');
                }
                return false;
            }
            initInputHandlers();
            showTutorialIfFirstVisit();
            return true;
        },
        start: function() {
            loop();
        },
        getLM: () => lm,
        getCSM: () => csm,
        getGameState: () => localGameState,
        setGameState: (state) => { localGameState = state; },
        resetGame,
        togglePause,
        toggleTrophyRoom,
        toggleHelp
    };
}

// ===== Auto-initialization for browser =====
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const game = createGameController();
            if (game.init()) {
                game.start();
            }
        });
    } else {
        // DOM is already ready
        const game = createGameController();
        if (game.init()) {
            game.start();
        }
    }
}
