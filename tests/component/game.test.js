import { describe, it, expect, vi } from 'vitest';
import {
    createLM, createCSM, createGameController,
    CSM_ORBIT_Y, CSM_SPEED, CANVAS_WIDTH, GROUND_Y, CRASH_VEL_THRESHOLD,
    GRAVITY, MAIN_THRUST, FUEL_MAIN_COST, RCS_THRUST, TARGET_FPS,
    createDefaultCampaign, loadCampaign, saveCampaign, resetCampaign,
    selectCampaignModifier, createMissionConfigFromCampaign, resolveCampaignDay,
    appendMissionLog, CAMPAIGN_MODIFIERS, CAMPAIGN_MAX_SUPPLIES,
    CAMPAIGN_MIN_FUEL_BUDGET, CAMPAIGN_VERSION,
    loadAchievements,
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
        ctrl.startDay(); // advance from campaign_start to playing
        ctrl.togglePause();
        expect(ctrl.getGameState()).toBe('paused');
        ctrl.togglePause();
        expect(ctrl.getGameState()).toBe('playing');
    });

    it('resets game state', () => {
        const ctrl = createGameController();
        ctrl.init();
        ctrl.startDay();
        ctrl.togglePause();
        ctrl.resetGame();
        expect(ctrl.getGameState()).toBe('campaign_start');
    });

    it('starts without poisoning game state with NaN values', async () => {
        const ctrl = createGameController();
        ctrl.init();
        ctrl.startDay();
        ctrl.start();

        await new Promise((resolve) => setTimeout(resolve, 5));

        const lm = ctrl.getLM();
        const csm = ctrl.getCSM();
        expect(Number.isFinite(lm.x)).toBe(true);
        expect(Number.isFinite(lm.y)).toBe(true);
        expect(Number.isFinite(csm.x)).toBe(true);
        expect(Number.isFinite(csm.y)).toBe(true);
    });

    it('initializes in campaign_start state', () => {
        const ctrl = createGameController();
        ctrl.init();
        expect(ctrl.getGameState()).toBe('campaign_start');
    });

    it('transitions from campaign_start to playing on startDay', () => {
        const ctrl = createGameController();
        ctrl.init();
        expect(ctrl.getGameState()).toBe('campaign_start');
        ctrl.startDay();
        expect(ctrl.getGameState()).toBe('playing');
    });

    it('exposes campaign and mission config', () => {
        const ctrl = createGameController();
        ctrl.init();
        const campaign = ctrl.getCampaign();
        expect(campaign).toBeTruthy();
        expect(campaign.day).toBe(1);
        const config = ctrl.getMissionConfig();
        expect(config).toBeTruthy();
        expect(config.startingFuel).toBeDefined();
    });

    it('starts new campaign and resets to day 1', () => {
        const ctrl = createGameController();
        ctrl.init();
        ctrl.newCampaign();
        expect(ctrl.getCampaign().day).toBe(1);
        expect(ctrl.getGameState()).toBe('campaign_start');
    });

    it('configures LM and CSM from campaign on startDay', () => {
        const ctrl = createGameController();
        ctrl.init();
        ctrl.startDay();
        const lm = ctrl.getLM();
        const csm = ctrl.getCSM();
        expect(lm.fuel).toBeDefined();
        expect(csm.speed).toBeDefined();
    });

    it('keeps achievement and campaign saves separate', () => {
        localStorage.removeItem('apolloAchievements');
        localStorage.removeItem('apolloCampaign');
        const c = createDefaultCampaign();
        c.day = 7;
        saveCampaign(c);
        const achievements = loadAchievements();
        expect(achievements.totalDockings).toBe(0);
        const campaign = loadCampaign();
        expect(campaign.day).toBe(7);
    });
});
