import { describe, it, expect } from 'vitest';
import {
    calculateDistance, calculateRelativeVelocityX, calculateRelativeVelocityY,
    calculateAltitude, applyScreenWrap,
    calculateScore,
    ACHIEVEMENTS, loadAchievements, saveAchievements, checkAchievements,
    getApproachStatus,
    checkDockingCollision,
    CANVAS_WIDTH, GROUND_Y, CSM_SPEED, DOCKING_VEL_THRESHOLD_X,
    DOCKING_VEL_THRESHOLD_Y,
    createDefaultCampaign, loadCampaign, saveCampaign, resetCampaign,
    validateCampaign, selectCampaignModifier, createMissionConfigFromCampaign, resolveCampaignDay,
    appendMissionLog, CAMPAIGN_MODIFIERS, CAMPAIGN_MAX_SUPPLIES,
    CAMPAIGN_MIN_FUEL_BUDGET, CAMPAIGN_MAX_LOG_ENTRIES, CAMPAIGN_VERSION,
    CAMPAIGN_VALID_OUTCOMES
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

    it('respects custom thresholds from missionConfig', () => {
        const lm = { x: 400, y: 80, vx: CSM_SPEED + 1.0, vy: 0 };
        // With default thresholds (1.5), relVx=1.0 should succeed
        expect(checkDockingCollision(lm, csm).type).toBe('docking_success');
        // With tight thresholds (0.5), relVx=1.0 should fail
        const tightConfig = { dockingThresholdX: 0.5, dockingThresholdY: 0.5, csmSpeed: CSM_SPEED };
        expect(checkDockingCollision(lm, csm, tightConfig).type).toBe('docking_failed_velocity');
    });

    it('uses csm.speed for relative velocity when available', () => {
        const fastCsm = { x: 400, y: 100, width: 50, height: 20, speed: 2.0 };
        const lm = { x: 400, y: 80, vx: 2.0, vy: 0 };
        expect(checkDockingCollision(lm, fastCsm).type).toBe('docking_success');
    });
});

describe('Campaign persistence', () => {
    beforeEach(() => {
        localStorage.removeItem('apolloCampaign');
    });

    it('creates default campaign with correct structure', () => {
        const c = createDefaultCampaign();
        expect(c.version).toBe(CAMPAIGN_VERSION);
        expect(c.day).toBe(1);
        expect(c.integrity).toBe(100);
        expect(c.supplies).toBe(3);
        expect(c.fuelBudget).toBe(100);
        expect(c.streak).toBe(0);
        expect(c.lastOutcome).toBeNull();
        expect(c.missionLog).toEqual([]);
    });

    it('loads defaults when no save exists', () => {
        const c = loadCampaign();
        expect(c.day).toBe(1);
        expect(c.integrity).toBe(100);
    });

    it('saves and loads round-trip', () => {
        const c = createDefaultCampaign();
        c.day = 5;
        c.integrity = 80;
        saveCampaign(c);
        const loaded = loadCampaign();
        expect(loaded.day).toBe(5);
        expect(loaded.integrity).toBe(80);
    });

    it('recovers from corrupt save data', () => {
        localStorage.setItem('apolloCampaign', '{CORRUPT!!!');
        const c = loadCampaign();
        expect(c.day).toBe(1);
        expect(localStorage.getItem('apolloCampaign')).toBeNull();
    });

    it('discards save on version mismatch and clears storage', () => {
        localStorage.setItem('apolloCampaign', JSON.stringify({ version: 0, day: 5 }));
        const c = loadCampaign();
        expect(c.day).toBe(1);
        expect(localStorage.getItem('apolloCampaign')).toBeNull();
    });

    it('resets campaign and returns defaults', () => {
        const c = createDefaultCampaign();
        c.day = 10;
        saveCampaign(c);
        const fresh = resetCampaign();
        expect(fresh.day).toBe(1);
        expect(localStorage.getItem('apolloCampaign')).toBeNull();
    });
});

describe('validateCampaign', () => {
    it('returns valid campaign unchanged', () => {
        const c = createDefaultCampaign();
        c.day = 7;
        c.integrity = 80;
        const v = validateCampaign(c);
        expect(v.day).toBe(7);
        expect(v.integrity).toBe(80);
    });

    it('falls back to default day when missing or non-integer', () => {
        expect(validateCampaign({ ...createDefaultCampaign(), day: undefined }).day).toBe(1);
        expect(validateCampaign({ ...createDefaultCampaign(), day: 1.5 }).day).toBe(1);
        expect(validateCampaign({ ...createDefaultCampaign(), day: 0 }).day).toBe(1);
        expect(validateCampaign({ ...createDefaultCampaign(), day: -3 }).day).toBe(1);
        expect(validateCampaign({ ...createDefaultCampaign(), day: 'five' }).day).toBe(1);
    });

    it('clamps integrity to 0–100', () => {
        expect(validateCampaign({ ...createDefaultCampaign(), integrity: -10 }).integrity).toBe(0);
        expect(validateCampaign({ ...createDefaultCampaign(), integrity: 150 }).integrity).toBe(100);
        expect(validateCampaign({ ...createDefaultCampaign(), integrity: NaN }).integrity).toBe(100);
        expect(validateCampaign({ ...createDefaultCampaign(), integrity: 'bad' }).integrity).toBe(100);
    });

    it('clamps supplies to 0–CAMPAIGN_MAX_SUPPLIES', () => {
        expect(validateCampaign({ ...createDefaultCampaign(), supplies: -1 }).supplies).toBe(0);
        expect(validateCampaign({ ...createDefaultCampaign(), supplies: 99 }).supplies).toBe(CAMPAIGN_MAX_SUPPLIES);
        expect(validateCampaign({ ...createDefaultCampaign(), supplies: 2.5 }).supplies).toBe(3);
    });

    it('clamps fuelBudget to CAMPAIGN_MIN_FUEL_BUDGET–100', () => {
        expect(validateCampaign({ ...createDefaultCampaign(), fuelBudget: 0 }).fuelBudget).toBe(CAMPAIGN_MIN_FUEL_BUDGET);
        expect(validateCampaign({ ...createDefaultCampaign(), fuelBudget: 200 }).fuelBudget).toBe(100);
        expect(validateCampaign({ ...createDefaultCampaign(), fuelBudget: NaN }).fuelBudget).toBe(100);
    });

    it('falls back to default streak when invalid', () => {
        expect(validateCampaign({ ...createDefaultCampaign(), streak: -1 }).streak).toBe(0);
        expect(validateCampaign({ ...createDefaultCampaign(), streak: 'many' }).streak).toBe(0);
    });

    it('preserves valid lastOutcome values and rejects unknown ones', () => {
        for (const outcome of CAMPAIGN_VALID_OUTCOMES) {
            expect(validateCampaign({ ...createDefaultCampaign(), lastOutcome: outcome }).lastOutcome).toBe(outcome);
        }
        expect(validateCampaign({ ...createDefaultCampaign(), lastOutcome: null }).lastOutcome).toBeNull();
        expect(validateCampaign({ ...createDefaultCampaign(), lastOutcome: 'hacked' }).lastOutcome).toBeNull();
        expect(validateCampaign({ ...createDefaultCampaign(), lastOutcome: 42 }).lastOutcome).toBeNull();
    });

    it('preserves valid activeModifier and rejects unknown ones', () => {
        const mod = CAMPAIGN_MODIFIERS[0];
        expect(validateCampaign({ ...createDefaultCampaign(), activeModifier: mod }).activeModifier).toEqual(mod);
        expect(validateCampaign({ ...createDefaultCampaign(), activeModifier: null }).activeModifier).toBeNull();
        expect(validateCampaign({ ...createDefaultCampaign(), activeModifier: { id: 'fake-mod' } }).activeModifier).toBeNull();
        expect(validateCampaign({ ...createDefaultCampaign(), activeModifier: 'string' }).activeModifier).toBeNull();
    });

    it('replaces non-array missionLog with empty array', () => {
        expect(validateCampaign({ ...createDefaultCampaign(), missionLog: null }).missionLog).toEqual([]);
        expect(validateCampaign({ ...createDefaultCampaign(), missionLog: 'log' }).missionLog).toEqual([]);
        expect(validateCampaign({ ...createDefaultCampaign(), missionLog: [{ day: 1 }] }).missionLog).toEqual([{ day: 1 }]);
    });

    it('loadCampaign validates a partially corrupt save', () => {
        const partial = { version: CAMPAIGN_VERSION, day: 99, integrity: 9999, supplies: -5, fuelBudget: 0 };
        localStorage.setItem('apolloCampaign', JSON.stringify(partial));
        const c = loadCampaign();
        expect(c.day).toBe(99);
        expect(c.integrity).toBe(100);
        expect(c.supplies).toBe(0);
        expect(c.fuelBudget).toBe(CAMPAIGN_MIN_FUEL_BUDGET);
    });
});

describe('Campaign modifier selection', () => {
    it('returns normal modifier for early days', () => {
        const c = createDefaultCampaign();
        expect(selectCampaignModifier(c).id).toBe('normal');
    });

    it('returns stable-window after severe failure', () => {
        const c = createDefaultCampaign();
        c.day = 10;
        c.lastOutcome = 'severe_failure';
        expect(selectCampaignModifier(c).id).toBe('stable-window');
    });

    it('selects challenging modifier after day 3', () => {
        const c = createDefaultCampaign();
        c.day = 5;
        c.lastOutcome = 'success';
        const mod = selectCampaignModifier(c);
        expect(mod.id).not.toBe('normal');
        expect(mod.id).not.toBe('stable-window');
    });
});

describe('Campaign mission config', () => {
    it('generates config from default campaign', () => {
        const c = createDefaultCampaign();
        c.activeModifier = CAMPAIGN_MODIFIERS.find(m => m.id === 'normal');
        const config = createMissionConfigFromCampaign(c);
        expect(config.startingFuel).toBe(100);
        expect(config.dockingThresholdX).toBeCloseTo(DOCKING_VEL_THRESHOLD_X, 2);
        expect(config.csmSpeed).toBeCloseTo(CSM_SPEED, 5);
        expect(config.rcsScale).toBe(1);
    });

    it('reduces thresholds with low integrity', () => {
        const c = createDefaultCampaign();
        c.integrity = 50;
        c.activeModifier = CAMPAIGN_MODIFIERS.find(m => m.id === 'normal');
        const config = createMissionConfigFromCampaign(c);
        expect(config.dockingThresholdX).toBeLessThan(DOCKING_VEL_THRESHOLD_X);
    });

    it('applies modifier effects', () => {
        const c = createDefaultCampaign();
        c.activeModifier = CAMPAIGN_MODIFIERS.find(m => m.id === 'drift-watch');
        const config = createMissionConfigFromCampaign(c);
        expect(config.csmSpeed).toBeGreaterThan(CSM_SPEED);
    });

    it('clamps fuel budget above minimum', () => {
        const c = createDefaultCampaign();
        c.fuelBudget = 30;
        c.activeModifier = CAMPAIGN_MODIFIERS.find(m => m.id === 'normal');
        const config = createMissionConfigFromCampaign(c);
        expect(config.startingFuel).toBe(CAMPAIGN_MIN_FUEL_BUDGET);
    });
});

describe('Campaign day resolution', () => {
    it('improves state on success', () => {
        const c = createDefaultCampaign();
        c.integrity = 90;
        c.fuelBudget = 90;
        c.supplies = 2;
        c.activeModifier = CAMPAIGN_MODIFIERS.find(m => m.id === 'normal');
        const outcome = { success: true, type: 'docking_success', fuelRemaining: 60 };
        const result = resolveCampaignDay(c, outcome);
        expect(result.campaign.day).toBe(2);
        // integrity: 90 + 5 (success) + 5 (auto-repair) = 100
        expect(result.campaign.integrity).toBe(100);
        expect(result.campaign.fuelBudget).toBeGreaterThan(90);
        // supplies: 2 + 1 (success) - 1 (auto-repair) = 2
        expect(result.campaign.supplies).toBe(2);
        expect(result.campaign.streak).toBe(1);
        expect(result.logEntry.outcome).toBe('success');
        expect(result.logEntry.repairDelta).toBe(5);
    });

    it('does not consume supplies for repair when integrity is full', () => {
        const c = createDefaultCampaign();
        c.integrity = 100;
        c.supplies = 3;
        c.activeModifier = CAMPAIGN_MODIFIERS.find(m => m.id === 'normal');
        const outcome = { success: true, type: 'docking_success', fuelRemaining: 60 };
        const result = resolveCampaignDay(c, outcome);
        // integrity already at 100 + 5 success = capped at 100, no auto-repair triggered
        // supplies: 3 + 1 (success) = 4, no repair consumption
        expect(result.campaign.supplies).toBe(4);
        expect(result.logEntry.repairDelta).toBeUndefined();
    });

    it('applies rough failure penalties', () => {
        const c = createDefaultCampaign();
        c.activeModifier = CAMPAIGN_MODIFIERS.find(m => m.id === 'normal');
        const outcome = { success: false, type: 'docking_failed_velocity', fuelRemaining: 40 };
        const result = resolveCampaignDay(c, outcome);
        expect(result.campaign.day).toBe(2);
        expect(result.campaign.integrity).toBeLessThan(100);
        expect(result.campaign.fuelBudget).toBeLessThan(100);
        expect(result.campaign.streak).toBe(0);
        expect(result.logEntry.outcome).toBe('rough_failure');
    });

    it('applies severe failure penalties', () => {
        const c = createDefaultCampaign();
        c.activeModifier = CAMPAIGN_MODIFIERS.find(m => m.id === 'normal');
        const outcome = { success: false, type: 'crashed', fuelRemaining: 0 };
        const result = resolveCampaignDay(c, outcome);
        expect(result.campaign.integrity).toBeLessThan(100 - 15);
        expect(result.logEntry.outcome).toBe('severe_failure');
    });

    it('clamps integrity and fuel budget at minimums', () => {
        const c = createDefaultCampaign();
        c.integrity = 10;
        c.fuelBudget = 45;
        c.supplies = 0;
        c.activeModifier = CAMPAIGN_MODIFIERS.find(m => m.id === 'normal');
        const outcome = { success: false, type: 'crashed', fuelRemaining: 0 };
        const result = resolveCampaignDay(c, outcome);
        expect(result.campaign.integrity).toBeGreaterThanOrEqual(0);
        expect(result.campaign.fuelBudget).toBeGreaterThanOrEqual(CAMPAIGN_MIN_FUEL_BUDGET);
    });

    it('selects next-day modifier automatically', () => {
        const c = createDefaultCampaign();
        c.activeModifier = CAMPAIGN_MODIFIERS.find(m => m.id === 'normal');
        const outcome = { success: true, type: 'docking_success', fuelRemaining: 80 };
        const result = resolveCampaignDay(c, outcome);
        expect(result.campaign.activeModifier).toBeTruthy();
        expect(result.campaign.activeModifier.id).toBeDefined();
    });
});

describe('Mission log', () => {
    it('appends entries and caps at max length', () => {
        let log = [];
        for (let i = 0; i < CAMPAIGN_MAX_LOG_ENTRIES + 5; i++) {
            log = appendMissionLog(log, { day: i + 1, outcome: 'success' });
        }
        expect(log.length).toBe(CAMPAIGN_MAX_LOG_ENTRIES);
        expect(log[0].day).toBe(6); // first 5 trimmed
    });
});
