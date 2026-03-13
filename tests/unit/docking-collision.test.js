/**
 * Unit tests for checkDockingCollision()
 */

import { describe, it, expect } from 'vitest';
import { checkDockingCollision, CSM_SPEED, DOCKING_VEL_THRESHOLD_X, DOCKING_VEL_THRESHOLD_Y } from '../../game.js';

function makeLm(overrides = {}) {
    return { x: 0, y: 0, vx: CSM_SPEED, vy: 0, width: 30, height: 30, ...overrides };
}

function makeCsm(overrides = {}) {
    return { x: 400, y: 100, vx: CSM_SPEED, vy: 0, width: 45, height: 20, ...overrides };
}

describe('checkDockingCollision', () => {
    describe('no collision', () => {
        it('returns none when LM is far from CSM', () => {
            const lm = makeLm({ x: 100, y: 400 });
            const csm = makeCsm();
            const result = checkDockingCollision(lm, csm);
            expect(result).toEqual({ type: 'none' });
        });

        it('returns none when LM is directly below CSM but out of range', () => {
            const csm = makeCsm();
            const lm = makeLm({ x: csm.x, y: csm.y + 50 });
            const result = checkDockingCollision(lm, csm);
            expect(result).toEqual({ type: 'none' });
        });
    });

    describe('docking success', () => {
        it('succeeds when LM is in docking zone with matching velocity', () => {
            const csm = makeCsm();
            // Position LM directly above CSM in docking zone (csm.y - 25 to csm.y - 5)
            const lm = makeLm({ x: csm.x, y: csm.y - 15, vx: CSM_SPEED, vy: 0 });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_success');
            expect(result.relVx).toBe(0);
            expect(result.relVy).toBe(0);
        });

        it('includes relVx and relVy in result', () => {
            const csm = makeCsm();
            const lm = makeLm({ x: csm.x, y: csm.y - 15, vx: CSM_SPEED + 0.5, vy: 0.3 });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_success');
            expect(result.relVx).toBeCloseTo(0.5);
            expect(result.relVy).toBeCloseTo(0.3);
        });
    });

    describe('docking failed velocity', () => {
        it('fails when LM is in docking zone but too fast horizontally', () => {
            const csm = makeCsm();
            const lm = makeLm({ x: csm.x, y: csm.y - 15, vx: CSM_SPEED + 5, vy: 0 });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_failed_velocity');
            expect(result.relVx).toBeCloseTo(5);
        });

        it('fails when LM is in docking zone but too fast vertically', () => {
            const csm = makeCsm();
            const lm = makeLm({ x: csm.x, y: csm.y - 15, vx: CSM_SPEED, vy: 3 });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_failed_velocity');
            expect(result.relVy).toBeCloseTo(3);
        });

        it('fails when both velocity components are too high', () => {
            const csm = makeCsm();
            const lm = makeLm({ x: csm.x, y: csm.y - 15, vx: CSM_SPEED + 3, vy: 3 });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_failed_velocity');
        });
    });

    describe('wrong angle collision', () => {
        it('returns collision_wrong_angle when LM hits CSM body from the side', () => {
            const csm = makeCsm();
            // Docking zone horizontal: csm.x ± 15; general: csm.x-20 to csm.x+25
            // Place LM outside docking zone horizontally but inside general bounds
            // lm.x + 15 <= csm.x - 15 (outside docking) and lm.x + 15 > csm.x - 20 (inside general)
            // Position at y within general collision range (csm.y ± 10)
            const lm = makeLm({ x: csm.x - 34, y: csm.y });
            const result = checkDockingCollision(lm, csm);
            expect(result).toEqual({ type: 'collision_wrong_angle' });
        });

        it('returns collision_wrong_angle when LM hits below docking zone', () => {
            const csm = makeCsm();
            // Docking zone bottom = csm.y - 5; LM top = lm.y - 15
            // Outside docking: lm.y - 15 >= csm.y - 5 → lm.y >= csm.y + 10
            // Inside general: lm.y - 15 < csm.y + 10 → lm.y < csm.y + 25
            const lm = makeLm({ x: csm.x, y: csm.y + 11 });
            const result = checkDockingCollision(lm, csm);
            expect(result).toEqual({ type: 'collision_wrong_angle' });
        });
    });

    describe('boundary: just inside docking zone', () => {
        it('detects docking when LM barely overlaps docking zone from above', () => {
            const csm = makeCsm();
            // Docking zone top = csm.y - 25, LM bottom = lm.y + 15
            // For overlap: lm.y + 15 > csm.y - 25 → lm.y > csm.y - 40
            // Also LM top = lm.y - 15 < dockingZoneBottom = csm.y - 5 → lm.y < csm.y + 10
            // Place LM so bottom just barely enters: lm.y = csm.y - 40 + 0.1
            const lm = makeLm({ x: csm.x, y: csm.y - 39.9, vx: CSM_SPEED, vy: 0 });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_success');
        });

        it('detects docking when LM barely overlaps docking zone horizontally', () => {
            const csm = makeCsm();
            // Docking zone left = csm.x - 15, LM right = lm.x + 15
            // For overlap: lm.x + 15 > csm.x - 15 → lm.x > csm.x - 30
            // Place LM so right edge just enters: lm.x = csm.x - 30 + 0.1
            const lm = makeLm({ x: csm.x - 29.9, y: csm.y - 15, vx: CSM_SPEED, vy: 0 });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_success');
        });
    });

    describe('boundary: just outside docking zone but in general collision', () => {
        it('returns wrong angle when LM is just below docking zone but inside general bounds', () => {
            const csm = makeCsm();
            // Docking zone bottom = csm.y - 5, LM top = lm.y - 15
            // Outside docking zone: lm.y - 15 >= csm.y - 5 → lm.y >= csm.y + 10
            // But inside general collision: lm.y - 15 < csm.y + 10 → lm.y < csm.y + 25
            // Also lm.y + 15 > csm.y - 10 → lm.y > csm.y - 25
            // Pick lm.y = csm.y + 10 (top of LM exactly at docking zone bottom → no overlap)
            // But general collision: lm top = csm.y - 5, lm bottom = csm.y + 25 — overlaps general
            const lm = makeLm({ x: csm.x, y: csm.y + 10, vx: CSM_SPEED, vy: 0 });
            const result = checkDockingCollision(lm, csm);
            expect(result).toEqual({ type: 'collision_wrong_angle' });
        });

        it('returns wrong angle when LM is beside docking zone but inside general bounds', () => {
            const csm = makeCsm();
            // Docking zone right = csm.x + 15, but general collision right = csm.x + 25
            // LM left = lm.x - 15 >= csm.x + 15 → lm.x >= csm.x + 30 (outside docking)
            // LM left = lm.x - 15 < csm.x + 25 → lm.x < csm.x + 40 (inside general)
            // Position at y within general collision range (csm.y - 10 to csm.y + 10)
            const lm = makeLm({ x: csm.x + 30.1, y: csm.y, vx: CSM_SPEED, vy: 0 });
            const result = checkDockingCollision(lm, csm);
            expect(result).toEqual({ type: 'collision_wrong_angle' });
        });
    });

    describe('velocity threshold boundaries', () => {
        it('fails when relVx is exactly at threshold (strict less-than)', () => {
            const csm = makeCsm();
            const lm = makeLm({
                x: csm.x,
                y: csm.y - 15,
                vx: CSM_SPEED + DOCKING_VEL_THRESHOLD_X, // relVx = 1.5
                vy: 0,
            });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_failed_velocity');
            expect(result.relVx).toBeCloseTo(DOCKING_VEL_THRESHOLD_X);
        });

        it('fails when relVy is exactly at threshold (strict less-than)', () => {
            const csm = makeCsm();
            const lm = makeLm({
                x: csm.x,
                y: csm.y - 15,
                vx: CSM_SPEED,
                vy: DOCKING_VEL_THRESHOLD_Y, // relVy = 1.5
            });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_failed_velocity');
            expect(result.relVy).toBeCloseTo(DOCKING_VEL_THRESHOLD_Y);
        });

        it('succeeds when relVx is just below threshold', () => {
            const csm = makeCsm();
            const lm = makeLm({
                x: csm.x,
                y: csm.y - 15,
                vx: CSM_SPEED + 1.49, // relVx = 1.49
                vy: 0,
            });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_success');
            expect(result.relVx).toBeCloseTo(1.49);
        });

        it('succeeds when relVy is just below threshold', () => {
            const csm = makeCsm();
            const lm = makeLm({
                x: csm.x,
                y: csm.y - 15,
                vx: CSM_SPEED,
                vy: 1.49, // relVy = 1.49
            });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_success');
            expect(result.relVy).toBeCloseTo(1.49);
        });
    });

    describe('zero relative velocity', () => {
        it('succeeds with perfect zero relative velocity', () => {
            const csm = makeCsm();
            const lm = makeLm({ x: csm.x, y: csm.y - 15, vx: CSM_SPEED, vy: 0 });
            const result = checkDockingCollision(lm, csm);
            expect(result.type).toBe('docking_success');
            expect(result.relVx).toBe(0);
            expect(result.relVy).toBe(0);
        });
    });

    describe('asymmetric CSM bounds', () => {
        it('detects collision when LM approaches from the right side (wider bound)', () => {
            const csm = makeCsm();
            // General right = csm.x + 25, LM left = lm.x - 15
            // For overlap: lm.x - 15 < csm.x + 25 → lm.x < csm.x + 40
            // And lm.x + 15 > csm.x - 20 → lm.x > csm.x - 35
            // Place LM at right edge where right-side asymmetry matters
            // lm.x = csm.x + 39 → LM left = csm.x + 24, which is < csm.x + 25 ✓
            const lm = makeLm({ x: csm.x + 39, y: csm.y });
            const result = checkDockingCollision(lm, csm);
            expect(result).toEqual({ type: 'collision_wrong_angle' });
        });

        it('returns none when LM is just past the right bound', () => {
            const csm = makeCsm();
            // lm.x - 15 >= csm.x + 25 → lm.x >= csm.x + 40 → no collision
            const lm = makeLm({ x: csm.x + 40, y: csm.y });
            const result = checkDockingCollision(lm, csm);
            expect(result).toEqual({ type: 'none' });
        });

        it('detects collision from the left side (narrower bound)', () => {
            const csm = makeCsm();
            // General left = csm.x - 20, LM right = lm.x + 15
            // For overlap: lm.x + 15 > csm.x - 20 → lm.x > csm.x - 35
            // lm.x = csm.x - 34 → LM right = csm.x - 19, which is > csm.x - 20 ✓
            const lm = makeLm({ x: csm.x - 34, y: csm.y });
            const result = checkDockingCollision(lm, csm);
            expect(result).toEqual({ type: 'collision_wrong_angle' });
        });

        it('returns none when LM is just past the left bound', () => {
            const csm = makeCsm();
            // lm.x + 15 <= csm.x - 20 → lm.x <= csm.x - 35 → no collision
            const lm = makeLm({ x: csm.x - 35, y: csm.y });
            const result = checkDockingCollision(lm, csm);
            expect(result).toEqual({ type: 'none' });
        });
    });
});
