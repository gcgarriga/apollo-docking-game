/**
 * Unit tests for physics utility functions
 */

import { describe, it, expect } from 'vitest';
import {
    calculateDistance,
    calculateRelativeVelocityX,
    calculateRelativeVelocityY,
    calculateAltitude,
    applyScreenWrap,
    CANVAS_WIDTH,
    GROUND_Y,
    CSM_SPEED
} from '../../game.js';

describe('calculateDistance', () => {
    it('should return 0 for same point', () => {
        expect(calculateDistance(100, 100, 100, 100)).toBe(0);
    });

    it('should calculate horizontal distance correctly', () => {
        expect(calculateDistance(0, 0, 100, 0)).toBe(100);
    });

    it('should calculate vertical distance correctly', () => {
        expect(calculateDistance(0, 0, 0, 100)).toBe(100);
    });

    it('should calculate diagonal distance correctly (Pythagorean)', () => {
        // 3-4-5 triangle
        expect(calculateDistance(0, 0, 3, 4)).toBe(5);
    });

    it('should handle negative coordinates', () => {
        expect(calculateDistance(-50, -50, 50, 50)).toBeCloseTo(141.42, 1);
    });

    it('should calculate real game scenario distances', () => {
        // LM on ground, CSM in orbit
        const lmX = 400, lmY = 520;
        const csmX = 400, csmY = 100;
        expect(calculateDistance(lmX, lmY, csmX, csmY)).toBe(420);
    });
});

describe('calculateRelativeVelocityX', () => {
    it('should return negative when LM is slower than CSM', () => {
        const relVx = calculateRelativeVelocityX(0);
        expect(relVx).toBe(-CSM_SPEED);
    });

    it('should return 0 when LM matches CSM speed', () => {
        const relVx = calculateRelativeVelocityX(CSM_SPEED);
        expect(relVx).toBe(0);
    });

    it('should return positive when LM is faster than CSM', () => {
        const relVx = calculateRelativeVelocityX(CSM_SPEED + 0.5);
        expect(relVx).toBe(0.5);
    });

    it('should handle negative LM velocity', () => {
        const relVx = calculateRelativeVelocityX(-0.5);
        expect(relVx).toBe(-0.5 - CSM_SPEED);
    });
});

describe('calculateRelativeVelocityY', () => {
    it('should return 0 for stationary LM', () => {
        expect(calculateRelativeVelocityY(0)).toBe(0);
    });

    it('should return positive value for downward velocity', () => {
        expect(calculateRelativeVelocityY(0.5)).toBe(0.5);
    });

    it('should return positive value for upward velocity (absolute)', () => {
        expect(calculateRelativeVelocityY(-0.5)).toBe(0.5);
    });

    it('should handle large velocities', () => {
        expect(calculateRelativeVelocityY(5)).toBe(5);
        expect(calculateRelativeVelocityY(-5)).toBe(5);
    });
});

describe('calculateAltitude', () => {
    it('should return 0 when on ground', () => {
        const lmY = GROUND_Y - 15; // Bottom of LM at ground
        expect(calculateAltitude(lmY)).toBe(0);
    });

    it('should return positive altitude when above ground', () => {
        const lmY = GROUND_Y - 115; // 100m above ground
        expect(calculateAltitude(lmY)).toBe(100);
    });

    it('should return correct altitude at CSM orbit', () => {
        const lmY = 100 - 15; // At CSM orbit level (y=100), adjusted for LM center
        const altitude = calculateAltitude(lmY);
        expect(altitude).toBeCloseTo(GROUND_Y - 100, 0);
    });

    it('should handle starting position', () => {
        const lmY = GROUND_Y - 30; // Initial y position
        const altitude = calculateAltitude(lmY);
        expect(altitude).toBe(GROUND_Y - (lmY + 15));
    });
});

describe('applyScreenWrap', () => {
    it('should not modify position within bounds', () => {
        expect(applyScreenWrap(400)).toBe(400);
        expect(applyScreenWrap(0)).toBe(0);
        expect(applyScreenWrap(CANVAS_WIDTH)).toBe(0); // Wraps at exactly CANVAS_WIDTH
    });

    it('should wrap position when exceeding right edge', () => {
        expect(applyScreenWrap(CANVAS_WIDTH + 1)).toBe(1);
        expect(applyScreenWrap(CANVAS_WIDTH + 50)).toBe(50);
    });

    it('should wrap position when below left edge', () => {
        expect(applyScreenWrap(-1)).toBe(CANVAS_WIDTH - 1);
        expect(applyScreenWrap(-50)).toBe(CANVAS_WIDTH - 50);
    });

    it('should handle edge cases', () => {
        // Exactly at CANVAS_WIDTH should wrap to 0
        expect(applyScreenWrap(800)).toBe(0);
        // Exactly at 0 should stay at 0
        expect(applyScreenWrap(0)).toBe(0);
    });

    it('should handle large offsets', () => {
        // Position way off screen
        expect(applyScreenWrap(CANVAS_WIDTH + 100)).toBe(100);
        expect(applyScreenWrap(-100)).toBe(CANVAS_WIDTH - 100);
    });
});

describe('Physics constants', () => {
    it('should have correct canvas width', () => {
        expect(CANVAS_WIDTH).toBe(800);
    });

    it('should have correct ground level', () => {
        expect(GROUND_Y).toBe(550);
    });

    it('should have correct CSM speed', () => {
        expect(CSM_SPEED).toBe(0.7);
    });
});
