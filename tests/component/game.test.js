import { describe, it, expect, vi } from 'vitest';
import {
    createLM, createCSM, createGameController,
    CSM_ORBIT_Y, CSM_SPEED, CANVAS_WIDTH, GROUND_Y, CRASH_VEL_THRESHOLD,
    GRAVITY, MAIN_THRUST, FUEL_MAIN_COST, RCS_THRUST, TARGET_FPS,
    gameState
} from '../../game.js';

const DT = 1 / TARGET_FPS;

describe('CSM (Command Service Module)', () => {
    it('initializes with defaults and moves at orbital speed', () => {
        const csm = createCSM();
        expect(csm.y).toBe(CSM_ORBIT_Y);
        const startX = csm.x;
        csm.update();
        expect(csm.x).toBeCloseTo(startX + CSM_SPEED);
    });

    it('wraps around screen edge', () => {
        const csm = createCSM({ x: CANVAS_WIDTH - 0.1 });
        csm.update();
        expect(csm.x).toBeLessThan(CANVAS_WIDTH);
    });
});

describe('LM (Lunar Module)', () => {
    it('starts at ground level with full fuel', () => {
        const lm = createLM();
        expect(lm.fuel).toBe(100);
        expect(lm.y).toBe(GROUND_Y - 30);
        expect(lm.vx).toBe(0);
    });

    it('applies gravity each frame', () => {
        const lm = createLM({ y: 300 });
        const startVy = lm.vy;
        lm.update({}, 'playing', {});
        expect(lm.vy).toBeCloseTo(startVy + GRAVITY * DT, 5);
    });

    it('thrusts up and consumes fuel on ArrowUp', () => {
        const lm = createLM({ y: 300 });
        const startFuel = lm.fuel;
        lm.update({ ArrowUp: true }, 'playing', {});
        expect(lm.vy).toBeCloseTo((GRAVITY - MAIN_THRUST) * DT, 5);
        expect(lm.fuel).toBeCloseTo(startFuel - FUEL_MAIN_COST * DT, 5);
    });

    it('applies RCS thrusters for lateral and downward control', () => {
        const lm = createLM({ y: 300 });
        lm.update({ ArrowRight: true }, 'playing', {});
        expect(lm.vx).toBeCloseTo(RCS_THRUST * DT, 5);

        const lm2 = createLM({ y: 300 });
        lm2.update({ ArrowLeft: true }, 'playing', {});
        expect(lm2.vx).toBeCloseTo(-RCS_THRUST * DT, 5);
    });

    it('does not thrust without fuel', () => {
        const lm = createLM({ y: 300, fuel: 0 });
        lm.update({ ArrowUp: true }, 'playing', {});
        expect(lm.vy).toBeGreaterThan(0); // only gravity, no thrust
    });

    it('wraps horizontally across screen edges', () => {
        const lm = createLM({ x: CANVAS_WIDTH + 10, y: 300 });
        lm.update({}, 'playing', {});
        expect(lm.x).toBeLessThan(CANVAS_WIDTH);
    });

    it('lands safely at low velocity', () => {
        const lm = createLM({ y: GROUND_Y - 14, vy: 0.5 });
        const status = lm.update({}, 'playing', {});
        expect(status).toBe('landed');
    });

    it('crashes at high velocity', () => {
        const onCrash = vi.fn();
        const lm = createLM({ y: GROUND_Y - 14, vy: CRASH_VEL_THRESHOLD });
        const status = lm.update({}, 'playing', { onCrash });
        expect(status).toBe('crashed');
        expect(onCrash).toHaveBeenCalled();
    });

    it('triggers fuel depletion at altitude', () => {
        const onFuelDepleted = vi.fn();
        const lm = createLM({ y: 200, fuel: 0 });
        const status = lm.update({}, 'playing', { onFuelDepleted });
        expect(status).toBe('fuel_depleted');
    });

    it('does not update when paused', () => {
        const lm = createLM({ y: 300 });
        const startY = lm.y;
        lm.update({ ArrowUp: true }, 'paused', {});
        expect(lm.y).toBe(startY);
    });
});

describe('Game Controller', () => {
    it('creates controller with expected API', () => {
        const ctrl = createGameController();
        expect(typeof ctrl.togglePause).toBe('function');
        expect(typeof ctrl.resetGame).toBe('function');
        expect(typeof ctrl.init).toBe('function');
        expect(typeof ctrl.start).toBe('function');
    });

    it('initializes and toggles pause', () => {
        const ctrl = createGameController();
        ctrl.init();
        ctrl.togglePause();
        expect(gameState).toBe('paused');
        ctrl.togglePause();
        expect(gameState).toBe('playing');
    });

    it('resets game state', () => {
        const ctrl = createGameController();
        ctrl.init();
        ctrl.togglePause();
        ctrl.resetGame();
        expect(gameState).toBe('playing');
    });
});
