import { describe, it, expect, beforeEach } from 'vitest';
import { triggerScreenShake, applyScreenShake, screenShake, resetScreenShake } from '../../game.js';
import { createCanvasContextMock } from '../setup.js';

describe('Screen Effects', () => {
    beforeEach(() => {
        resetScreenShake();
    });

    describe('triggerScreenShake', () => {
        it('sets screenShake to given intensity', () => {
            triggerScreenShake(10);
            expect(screenShake).toBe(10);
        });

        it('overwrites previous value', () => {
            triggerScreenShake(10);
            triggerScreenShake(20);
            expect(screenShake).toBe(20);
        });

        it('works with various intensities', () => {
            triggerScreenShake(5);
            expect(screenShake).toBe(5);

            triggerScreenShake(15);
            expect(screenShake).toBe(15);

            triggerScreenShake(100);
            expect(screenShake).toBe(100);
        });
    });

    describe('applyScreenShake', () => {
        it('calls ctx.translate when screenShake > 0', () => {
            const ctx = createCanvasContextMock();
            triggerScreenShake(10);
            applyScreenShake(ctx);
            expect(ctx.translate).toHaveBeenCalledTimes(1);
        });

        it('does NOT call ctx.translate when screenShake is 0', () => {
            const ctx = createCanvasContextMock();
            applyScreenShake(ctx);
            expect(ctx.translate).not.toHaveBeenCalled();
        });

        it('decays screenShake by multiplying by 0.9', () => {
            triggerScreenShake(10);
            const ctx = createCanvasContextMock();
            applyScreenShake(ctx);
            expect(screenShake).toBeCloseTo(10 * 0.9, 5);
        });

        it('sets screenShake to 0 when it falls below 0.5', () => {
            triggerScreenShake(0.5);
            const ctx = createCanvasContextMock();
            applyScreenShake(ctx);
            // 0.5 * 0.9 = 0.45, which is < 0.5, so it should be set to 0
            expect(screenShake).toBe(0);
        });

        it('shake decays over multiple calls until it reaches 0', () => {
            triggerScreenShake(10);
            const ctx = createCanvasContextMock();

            let prevShake = screenShake;
            let iterations = 0;
            const maxIterations = 200;

            while (screenShake > 0 && iterations < maxIterations) {
                applyScreenShake(ctx);
                expect(screenShake).toBeLessThan(prevShake);
                prevShake = screenShake;
                iterations++;
            }

            expect(screenShake).toBe(0);
            expect(iterations).toBeLessThan(maxIterations);
        });
    });

    describe('resetScreenShake', () => {
        it('resets screenShake to 0', () => {
            triggerScreenShake(10);
            resetScreenShake();
            expect(screenShake).toBe(0);
        });

        it('works after triggerScreenShake was called', () => {
            triggerScreenShake(50);
            expect(screenShake).toBe(50);
            resetScreenShake();
            expect(screenShake).toBe(0);
        });
    });

    describe('Integration', () => {
        it('full cycle: trigger → apply multiple times → reaches 0', () => {
            triggerScreenShake(20);
            expect(screenShake).toBe(20);

            const ctx = createCanvasContextMock();
            let iterations = 0;

            while (screenShake > 0) {
                applyScreenShake(ctx);
                iterations++;
                if (iterations > 500) break;
            }

            expect(screenShake).toBe(0);
            expect(iterations).toBeGreaterThan(1);
            expect(ctx.translate).toHaveBeenCalledTimes(iterations);
        });
    });
});
