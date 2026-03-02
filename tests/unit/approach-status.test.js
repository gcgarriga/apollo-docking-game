/**
 * Unit tests for the approach status indicator
 */

import { describe, it, expect } from 'vitest';
import {
    getApproachStatus,
    DOCKING_VEL_THRESHOLD_X,
    DOCKING_VEL_THRESHOLD_Y
} from '../../game.js';

describe('getApproachStatus', () => {
    describe('green status (safe for docking)', () => {
        it('should return green for perfect approach (0, 0)', () => {
            expect(getApproachStatus(0, 0)).toBe('#44ff44');
        });

        it('should return green for low velocities (0.2, 0.3)', () => {
            expect(getApproachStatus(0.2, 0.3)).toBe('#44ff44');
        });

        it('should return green at boundary (0.49, 0.49)', () => {
            expect(getApproachStatus(0.49, 0.49)).toBe('#44ff44');
        });

        it('should return green when only vx is near boundary', () => {
            expect(getApproachStatus(0.49, 0.1)).toBe('#44ff44');
        });

        it('should return green when only vy is near boundary', () => {
            expect(getApproachStatus(0.1, 0.49)).toBe('#44ff44');
        });
    });

    describe('yellow status (caution range)', () => {
        it('should return yellow for moderate velocities (1.0, 1.0)', () => {
            expect(getApproachStatus(1.0, 1.0)).toBe('#ffff44');
        });

        it('should return yellow when vx is at 0.5 (crossing green threshold)', () => {
            expect(getApproachStatus(0.5, 0.3)).toBe('#ffff44');
        });

        it('should return yellow when vy is at 0.5', () => {
            expect(getApproachStatus(0.3, 0.5)).toBe('#ffff44');
        });

        it('should return yellow at docking threshold boundary (1.49, 1.49)', () => {
            expect(getApproachStatus(1.49, 1.49)).toBe('#ffff44');
        });

        it('should return yellow for asymmetric caution velocities', () => {
            expect(getApproachStatus(1.0, 0.5)).toBe('#ffff44');
            expect(getApproachStatus(0.5, 1.0)).toBe('#ffff44');
        });
    });

    describe('red status (too fast for docking)', () => {
        it('should return red for high velocities (2.0, 0.5)', () => {
            expect(getApproachStatus(2.0, 0.5)).toBe('#ff4444');
        });

        it('should return red when vx exceeds threshold', () => {
            expect(getApproachStatus(DOCKING_VEL_THRESHOLD_X, 0.5)).toBe('#ff4444');
        });

        it('should return red when vy exceeds threshold', () => {
            expect(getApproachStatus(0.5, DOCKING_VEL_THRESHOLD_Y)).toBe('#ff4444');
        });

        it('should return red when both exceed threshold', () => {
            expect(getApproachStatus(2.0, 2.0)).toBe('#ff4444');
        });

        it('should return red for very high velocities', () => {
            expect(getApproachStatus(5.0, 5.0)).toBe('#ff4444');
        });
    });

    describe('boundary conditions', () => {
        it('should be yellow at exactly 0.5, 0.5', () => {
            expect(getApproachStatus(0.5, 0.5)).toBe('#ffff44');
        });

        it('should be red at exactly threshold values', () => {
            expect(getApproachStatus(DOCKING_VEL_THRESHOLD_X, DOCKING_VEL_THRESHOLD_Y)).toBe('#ff4444');
        });

        it('should handle zero and non-zero combinations', () => {
            expect(getApproachStatus(0, 0.6)).toBe('#ffff44'); // vy in caution
            expect(getApproachStatus(0.6, 0)).toBe('#ffff44'); // vx in caution
            expect(getApproachStatus(0, 2.0)).toBe('#ff4444'); // vy in danger
            expect(getApproachStatus(2.0, 0)).toBe('#ff4444'); // vx in danger
        });
    });

    describe('threshold constants', () => {
        it('should have correct docking velocity thresholds', () => {
            expect(DOCKING_VEL_THRESHOLD_X).toBe(1.5);
            expect(DOCKING_VEL_THRESHOLD_Y).toBe(1.5);
        });
    });

    describe('game scenarios', () => {
        it('should show green during careful approach', () => {
            // Player carefully matching speed and slowing down
            expect(getApproachStatus(0.2, 0.1)).toBe('#44ff44');
        });

        it('should show yellow when approaching fast but controllable', () => {
            // Player still has time to slow down
            expect(getApproachStatus(0.8, 0.7)).toBe('#ffff44');
        });

        it('should show red when player needs to abort', () => {
            // Too fast, docking will fail
            expect(getApproachStatus(1.8, 1.2)).toBe('#ff4444');
        });
    });
});
