/**
 * Component tests for the Lunar Module (LM)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createLM,
    GRAVITY,
    MAIN_THRUST,
    RCS_THRUST,
    FUEL_MAIN_COST,
    FUEL_RCS_COST,
    CANVAS_WIDTH,
    GROUND_Y,
    CRASH_VEL_THRESHOLD,
    LANDING_FRICTION,
    FUEL_DEPLETION_ALTITUDE_THRESHOLD
} from '../../game.js';

describe('LM (Lunar Module)', () => {
    let lm;

    beforeEach(() => {
        lm = createLM();
    });

    describe('initial state', () => {
        it('should start at center-bottom of canvas', () => {
            expect(lm.x).toBe(CANVAS_WIDTH / 2);
            expect(lm.y).toBe(GROUND_Y - 30);
        });

        it('should start with zero velocity', () => {
            expect(lm.vx).toBe(0);
            expect(lm.vy).toBe(0);
        });

        it('should start with full fuel', () => {
            expect(lm.fuel).toBe(100);
        });

        it('should have correct dimensions', () => {
            expect(lm.width).toBe(30);
            expect(lm.height).toBe(30);
        });
    });

    describe('custom initial state', () => {
        it('should accept custom position', () => {
            const customLM = createLM({ x: 100, y: 200 });
            expect(customLM.x).toBe(100);
            expect(customLM.y).toBe(200);
        });

        it('should accept custom velocity', () => {
            const customLM = createLM({ vx: 1.5, vy: -0.5 });
            expect(customLM.vx).toBe(1.5);
            expect(customLM.vy).toBe(-0.5);
        });

        it('should accept custom fuel', () => {
            const customLM = createLM({ fuel: 50 });
            expect(customLM.fuel).toBe(50);
        });
    });

    describe('gravity', () => {
        it('should apply gravity each update', () => {
            const initialVy = lm.vy;
            lm.update({}, 'playing');
            expect(lm.vy).toBe(initialVy + GRAVITY);
        });

        it('should accumulate gravity over multiple updates', () => {
            lm.update({}, 'playing');
            lm.update({}, 'playing');
            lm.update({}, 'playing');
            expect(lm.vy).toBeCloseTo(GRAVITY * 3, 5);
        });
    });

    describe('main thrust (ArrowUp)', () => {
        it('should reduce vy when ArrowUp pressed with fuel', () => {
            const initialVy = lm.vy;
            lm.update({ ArrowUp: true }, 'playing');
            // Gravity adds GRAVITY, thrust subtracts MAIN_THRUST
            expect(lm.vy).toBe(initialVy + GRAVITY - MAIN_THRUST);
        });

        it('should consume fuel when thrusting', () => {
            const initialFuel = lm.fuel;
            lm.update({ ArrowUp: true }, 'playing');
            expect(lm.fuel).toBe(initialFuel - FUEL_MAIN_COST);
        });

        it('should call onMainThrust callback', () => {
            const callbacks = { onMainThrust: vi.fn() };
            lm.update({ ArrowUp: true }, 'playing', callbacks);
            expect(callbacks.onMainThrust).toHaveBeenCalled();
        });

        it('should not thrust when out of fuel', () => {
            lm.fuel = 0;
            const initialVy = lm.vy;
            lm.update({ ArrowUp: true }, 'playing');
            // Only gravity should apply
            expect(lm.vy).toBe(initialVy + GRAVITY);
        });
    });

    describe('RCS thrusters', () => {
        describe('ArrowDown (RCS down/up thrust)', () => {
            it('should increase vy', () => {
                const initialVy = lm.vy;
                lm.update({ ArrowDown: true }, 'playing');
                expect(lm.vy).toBe(initialVy + GRAVITY + RCS_THRUST);
            });

            it('should consume RCS fuel', () => {
                const initialFuel = lm.fuel;
                lm.update({ ArrowDown: true }, 'playing');
                expect(lm.fuel).toBe(initialFuel - FUEL_RCS_COST);
            });
        });

        describe('ArrowLeft (RCS left)', () => {
            it('should decrease vx', () => {
                const initialVx = lm.vx;
                lm.update({ ArrowLeft: true }, 'playing');
                expect(lm.vx).toBe(initialVx - RCS_THRUST);
            });
        });

        describe('ArrowRight (RCS right)', () => {
            it('should increase vx', () => {
                const initialVx = lm.vx;
                lm.update({ ArrowRight: true }, 'playing');
                expect(lm.vx).toBe(initialVx + RCS_THRUST);
            });
        });

        it('should call onRcsThrust callback', () => {
            const callbacks = { onRcsThrust: vi.fn() };
            lm.update({ ArrowLeft: true }, 'playing', callbacks);
            expect(callbacks.onRcsThrust).toHaveBeenCalled();
        });
    });

    describe('screen wrap', () => {
        it('should wrap from right edge to left', () => {
            lm.x = CANVAS_WIDTH + 1;
            lm.vx = 1;
            lm.update({}, 'playing');
            expect(lm.x).toBeLessThan(50); // Should wrap around
        });

        it('should wrap from left edge to right', () => {
            lm.x = -1;
            lm.vx = -1;
            lm.update({}, 'playing');
            expect(lm.x).toBeGreaterThan(CANVAS_WIDTH - 50); // Should wrap around
        });
    });

    describe('ground collision', () => {
        describe('safe landing', () => {
            it('should land safely with low velocity', () => {
                lm.y = GROUND_Y - 16; // Near ground
                lm.vy = CRASH_VEL_THRESHOLD - 0.5; // Below crash threshold
                const result = lm.update({}, 'playing');
                expect(result).toBe('landed');
                expect(lm.vy).toBe(0);
            });

            it('should set y position to ground level', () => {
                lm.y = GROUND_Y - 16;
                lm.vy = 1.5;
                lm.update({}, 'playing');
                expect(lm.y).toBe(GROUND_Y - lm.height / 2);
            });

            it('should apply friction to horizontal velocity', () => {
                lm.y = GROUND_Y - 16;
                lm.vy = 1.5;
                lm.vx = 2.0;
                lm.update({}, 'playing');
                expect(lm.vx).toBe(2.0 * LANDING_FRICTION);
            });
        });

        describe('crash', () => {
            it('should crash with high velocity', () => {
                lm.y = GROUND_Y - 16;
                lm.vy = CRASH_VEL_THRESHOLD + 0.5;
                const callbacks = { onCrash: vi.fn() };
                const result = lm.update({}, 'playing', callbacks);
                expect(result).toBe('crashed');
                expect(callbacks.onCrash).toHaveBeenCalled();
            });

            it('should crash at exactly threshold velocity', () => {
                lm.y = GROUND_Y - 16;
                lm.vy = CRASH_VEL_THRESHOLD + 0.1;
                const callbacks = { onCrash: vi.fn() };
                const result = lm.update({}, 'playing', callbacks);
                expect(result).toBe('crashed');
            });
        });
    });

    describe('fuel depletion', () => {
        it('should clamp fuel to 0 when negative', () => {
            lm.fuel = -5;
            lm.update({}, 'playing');
            expect(lm.fuel).toBe(0);
        });

        it('should trigger fuel depletion when out of fuel at altitude', () => {
            lm.fuel = 0;
            lm.y = 100; // High altitude
            const callbacks = { onFuelDepleted: vi.fn() };
            const result = lm.update({}, 'playing', callbacks);
            expect(result).toBe('fuel_depleted');
            expect(callbacks.onFuelDepleted).toHaveBeenCalled();
        });

        it('should not trigger depletion near ground', () => {
            lm.fuel = 0;
            lm.y = GROUND_Y - 30; // Near ground
            const callbacks = { onFuelDepleted: vi.fn() };
            lm.update({}, 'playing', callbacks);
            expect(callbacks.onFuelDepleted).not.toHaveBeenCalled();
        });

        it('should trigger low fuel callback', () => {
            lm.fuel = 15; // Below warning threshold
            const callbacks = { onLowFuel: vi.fn() };
            lm.update({}, 'playing', callbacks);
            expect(callbacks.onLowFuel).toHaveBeenCalled();
        });
    });

    describe('paused state', () => {
        it('should not update when paused', () => {
            const initialY = lm.y;
            const initialVy = lm.vy;
            lm.update({ ArrowUp: true }, 'paused');
            expect(lm.y).toBe(initialY);
            expect(lm.vy).toBe(initialVy);
        });

        it('should not consume fuel when paused', () => {
            const initialFuel = lm.fuel;
            lm.update({ ArrowUp: true }, 'paused');
            expect(lm.fuel).toBe(initialFuel);
        });
    });

    describe('flying state', () => {
        it('should return flying status during normal flight', () => {
            lm.y = 300; // Mid-air
            lm.fuel = 50;
            const result = lm.update({}, 'playing');
            expect(result).toBe('flying');
        });
    });
});
