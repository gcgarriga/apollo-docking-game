/**
 * Unit tests for the scoring system
 */

import { describe, it, expect } from 'vitest';
import { calculateScore } from '../../game.js';

describe('calculateScore', () => {
    describe('fuel bonus', () => {
        it('should give maximum fuel bonus (1000) for 100% fuel', () => {
            const score = calculateScore(100, 0, 0, 0);
            // fuel=100 -> 1000, time=0 -> 500, precision=(2-0-0)*250=500
            expect(score).toBe(2000);
        });

        it('should give no fuel bonus for 0% fuel', () => {
            const score = calculateScore(0, 0, 0, 0);
            // fuel=0 -> 0, time=0 -> 500, precision=(2-0-0)*250=500
            expect(score).toBe(1000);
        });

        it('should give partial fuel bonus for 50% fuel', () => {
            const score = calculateScore(50, 0, 0, 0);
            // fuel=50 -> 500, time=0 -> 500, precision=(2-0-0)*250=500
            expect(score).toBe(1500);
        });
    });

    describe('time bonus', () => {
        it('should give maximum time bonus (500) for instant completion', () => {
            const score = calculateScore(0, 0, 0, 0);
            expect(score).toBe(1000); // 0 + 500 + 500
        });

        it('should give no time bonus for very slow completion', () => {
            const score = calculateScore(0, 50000, 0, 0);
            // fuel=0 -> 0, time=50000 -> 500 - 500 = 0, precision=500
            expect(score).toBe(500);
        });

        it('should give partial time bonus for moderate time', () => {
            const score = calculateScore(0, 25000, 0, 0);
            // fuel=0 -> 0, time=25000 -> 500 - 250 = 250, precision=500
            expect(score).toBe(750);
        });

        it('should not allow negative time bonus', () => {
            const score = calculateScore(0, 100000, 0, 0);
            // fuel=0, time bonus would be negative but clamped to 0, precision=500
            expect(score).toBe(500);
        });
    });

    describe('precision bonus', () => {
        it('should give maximum precision bonus (500) for perfect approach', () => {
            const score = calculateScore(0, 50000, 0, 0);
            // fuel=0, time=0, precision=(2-0-0)*250=500
            expect(score).toBe(500);
        });

        it('should reduce precision bonus for higher velocities', () => {
            const perfectScore = calculateScore(0, 50000, 0, 0);
            const fastScore = calculateScore(0, 50000, 1, 1);
            // precision for fast: (2-1-1)*250 = 0
            expect(fastScore).toBeLessThan(perfectScore);
        });

        it('should handle high velocity penalty', () => {
            const score = calculateScore(50, 1000, 2, 2);
            // fuel=500, time~=490, precision=(2-2-2)*250=-500 (clamped in total)
            // The formula: fuelScore=500, timeBonus=490, precisionBonus=-500
            // Total = max(0, 500 + 490 - 500) = 490
            expect(score).toBeLessThanOrEqual(500);
        });
    });

    describe('edge cases', () => {
        it('should never return negative score', () => {
            const score = calculateScore(0, 100000, 5, 5);
            expect(score).toBeGreaterThanOrEqual(0);
        });

        it('should handle fractional fuel values', () => {
            const score = calculateScore(33.33, 0, 0, 0);
            // fuel=333, time=500, precision=500
            expect(score).toBe(1333);
        });

        it('should handle very small velocities', () => {
            const score = calculateScore(100, 0, 0.1, 0.1);
            // precision = (2-0.1-0.1)*250 = 450
            expect(score).toBe(1950);
        });
    });

    describe('realistic scenarios', () => {
        it('should give good score for efficient docking', () => {
            // Fast time, good fuel, good precision
            const score = calculateScore(75, 15000, 0.3, 0.3);
            // fuel=750, time=350, precision=(2-0.6)*250=350
            expect(score).toBe(1450);
        });

        it('should give low score for sloppy docking', () => {
            // Slow time, low fuel, high velocity
            const score = calculateScore(20, 45000, 1.2, 0.8);
            // fuel=200, time=50, precision=(2-2)*250=0
            expect(score).toBe(250);
        });
    });
});
