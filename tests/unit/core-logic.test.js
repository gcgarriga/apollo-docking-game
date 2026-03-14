import { describe, it, expect } from 'vitest';
import {
    calculateDistance, calculateRelativeVelocityX, calculateRelativeVelocityY,
    calculateAltitude, applyScreenWrap,
    calculateScore,
    ACHIEVEMENTS, loadAchievements, saveAchievements, checkAchievements,
    getApproachStatus,
    checkDockingCollision,
    CANVAS_WIDTH, GROUND_Y, CSM_SPEED, DOCKING_VEL_THRESHOLD_X
} from '../../game.js';

describe('Physics utilities', () => {
    it('calculates euclidean distance', () => {
        expect(calculateDistance(0, 0, 3, 4)).toBe(5);
        expect(calculateDistance(5, 5, 5, 5)).toBe(0);
    });

    it('computes relative velocity X against CSM speed', () => {
        expect(calculateRelativeVelocityX(CSM_SPEED)).toBe(0);
        expect(calculateRelativeVelocityX(0)).toBe(-CSM_SPEED);
    });

    it('computes absolute relative velocity Y', () => {
        expect(calculateRelativeVelocityY(-2)).toBe(2);
        expect(calculateRelativeVelocityY(0)).toBe(0);
    });

    it('computes altitude from LM y-position', () => {
        expect(calculateAltitude(GROUND_Y - 15)).toBe(0);
        expect(calculateAltitude(0)).toBe(GROUND_Y - 15);
    });

    it('wraps positions across screen edges', () => {
        expect(applyScreenWrap(400)).toBe(400);
        expect(applyScreenWrap(CANVAS_WIDTH + 10)).toBe(10);
        expect(applyScreenWrap(-10)).toBe(CANVAS_WIDTH - 10);
    });
});

describe('Scoring', () => {
    it('scores a perfect fast docking high', () => {
        const score = calculateScore(100, 0, 0, 0);
        expect(score).toBeGreaterThan(1500);
    });

    it('scores zero for worst-case docking', () => {
        expect(calculateScore(0, 100000, 5, 5)).toBe(0);
    });

    it('never returns a negative score', () => {
        expect(calculateScore(0, 999999, 10, 10)).toBeGreaterThanOrEqual(0);
    });
});

describe('Achievements', () => {
    it('defines all 8 achievements', () => {
        expect(Object.keys(ACHIEVEMENTS)).toHaveLength(8);
    });

    it('loads default state when no data saved', () => {
        const data = loadAchievements();
        expect(data.totalDockings).toBe(0);
        expect(Object.keys(data.unlocked)).toHaveLength(0);
    });

    it('clears corrupt achievement data and returns defaults', () => {
        localStorage.setItem('apolloAchievements', '{CORRUPT!!!');
        const data = loadAchievements();
        expect(data.totalDockings).toBe(0);
        expect(Object.keys(data.unlocked)).toHaveLength(0);
        expect(localStorage.getItem('apolloAchievements')).toBeNull();
    });

    it('saves and loads round-trip', () => {
        const data = loadAchievements();
        data.totalDockings = 5;
        saveAchievements(data);
        const loaded = loadAchievements();
        expect(loaded.totalDockings).toBe(5);
    });

    it('unlocks matching achievements without double-unlocking', () => {
        const data = loadAchievements();
        const stats = { totalDockings: 1, fuelRemaining: 80, timeElapsed: 20000, relVx: 0.3, relVy: 0.2, score: 1600 };
        const first = checkAchievements(stats, data);
        expect(first.length).toBeGreaterThan(0);
        const second = checkAchievements(stats, data);
        expect(second).toHaveLength(0);
    });
});

describe('Approach status', () => {
    it('returns green for safe velocity', () => {
        expect(getApproachStatus(0.2, 0.3)).toBe('#44ff44');
    });

    it('returns yellow for caution velocity', () => {
        expect(getApproachStatus(1.0, 1.0)).toBe('#ffff44');
    });

    it('returns red for dangerous velocity', () => {
        expect(getApproachStatus(2.0, 2.0)).toBe('#ff4444');
    });
});

describe('Docking collision', () => {
    const csm = { x: 400, y: 100, width: 50, height: 20 };

    it('returns none when LM is far away', () => {
        const lm = { x: 400, y: 500, vx: 0, vy: 0 };
        expect(checkDockingCollision(lm, csm).type).toBe('none');
    });

    it('returns docking_success in docking zone with low velocity', () => {
        const lm = { x: 400, y: 80, vx: CSM_SPEED, vy: 0 };
        const result = checkDockingCollision(lm, csm);
        expect(result.type).toBe('docking_success');
        expect(result.relVx).toBe(0);
    });

    it('returns docking_failed_velocity when too fast', () => {
        const lm = { x: 400, y: 80, vx: CSM_SPEED + 5, vy: 0 };
        expect(checkDockingCollision(lm, csm).type).toBe('docking_failed_velocity');
    });

    it('returns collision_wrong_angle when hitting CSM body from the side', () => {
        // LM at y=110: below docking port (75-95) but inside general body (90-110)
        const lm = { x: 400, y: 110, vx: CSM_SPEED, vy: 0 };
        expect(checkDockingCollision(lm, csm).type).toBe('collision_wrong_angle');
    });

    it('fails at exactly the velocity threshold', () => {
        const lm = { x: 400, y: 80, vx: CSM_SPEED + DOCKING_VEL_THRESHOLD_X, vy: 0 };
        expect(checkDockingCollision(lm, csm).type).toBe('docking_failed_velocity');
    });
});
