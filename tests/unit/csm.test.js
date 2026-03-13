import { describe, it, expect } from 'vitest';
import { createCSM, CSM_ORBIT_Y, CSM_SPEED, CANVAS_WIDTH } from '../../game.js';

describe('createCSM', () => {
    describe('default initialization', () => {
        it('should initialize with default values when no initialState is provided', () => {
            const csm = createCSM();
            expect(csm.x).toBe(0);
            expect(csm.y).toBe(CSM_ORBIT_Y);
            expect(csm.width).toBe(50);
            expect(csm.height).toBe(20);
        });

        it('should have y default to CSM_ORBIT_Y (100)', () => {
            const csm = createCSM();
            expect(csm.y).toBe(100);
        });
    });

    describe('custom initialization', () => {
        it('should accept custom x and y via initialState', () => {
            const csm = createCSM({ x: 200, y: 300 });
            expect(csm.x).toBe(200);
            expect(csm.y).toBe(300);
        });

        it('should allow partial override with only x, y defaults to CSM_ORBIT_Y', () => {
            const csm = createCSM({ x: 150 });
            expect(csm.x).toBe(150);
            expect(csm.y).toBe(CSM_ORBIT_Y);
        });

        it('should allow partial override with only y, x defaults to 0', () => {
            const csm = createCSM({ y: 250 });
            expect(csm.x).toBe(0);
            expect(csm.y).toBe(250);
        });
    });

    describe('update method', () => {
        it('should have an update method', () => {
            const csm = createCSM();
            expect(typeof csm.update).toBe('function');
        });

        it('should increase x by CSM_SPEED on each update call', () => {
            const csm = createCSM();
            const initialX = csm.x;
            csm.update();
            expect(csm.x).toBeCloseTo(initialX + CSM_SPEED);
        });

        it('should accumulate position over multiple update calls', () => {
            const csm = createCSM();
            const calls = 10;
            for (let i = 0; i < calls; i++) {
                csm.update();
            }
            expect(csm.x).toBeCloseTo(CSM_SPEED * calls);
        });

        it('should wrap x when it exceeds CANVAS_WIDTH', () => {
            const csm = createCSM({ x: CANVAS_WIDTH - 0.5 });
            csm.update();
            // After update: x = 800 - 0.5 + 0.7 = 800.2, wraps to 0.2
            expect(csm.x).toBeCloseTo(CANVAS_WIDTH - 0.5 + CSM_SPEED - CANVAS_WIDTH);
            expect(csm.x).toBeLessThan(CANVAS_WIDTH);
        });
    });

    describe('draw method', () => {
        it('should have a draw method', () => {
            const csm = createCSM();
            expect(typeof csm.draw).toBe('function');
        });
    });
});
