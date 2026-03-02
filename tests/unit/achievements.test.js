/**
 * Unit tests for the achievement system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    ACHIEVEMENTS,
    checkAchievements,
    loadAchievements,
    saveAchievements
} from '../../game.js';

describe('ACHIEVEMENTS', () => {
    it('should have all expected achievements defined', () => {
        expect(ACHIEVEMENTS.first_dock).toBeDefined();
        expect(ACHIEVEMENTS.perfect_dock).toBeDefined();
        expect(ACHIEVEMENTS.fuel_miser).toBeDefined();
        expect(ACHIEVEMENTS.speed_runner).toBeDefined();
        expect(ACHIEVEMENTS.close_call).toBeDefined();
        expect(ACHIEVEMENTS.veteran).toBeDefined();
        expect(ACHIEVEMENTS.ace).toBeDefined();
        expect(ACHIEVEMENTS.high_scorer).toBeDefined();
    });

    it('should have 8 total achievements', () => {
        expect(Object.keys(ACHIEVEMENTS).length).toBe(8);
    });

    describe('achievement conditions', () => {
        describe('first_dock', () => {
            it('should unlock on first docking', () => {
                expect(ACHIEVEMENTS.first_dock.check({ totalDockings: 1 })).toBe(true);
            });

            it('should not unlock with 0 dockings', () => {
                expect(ACHIEVEMENTS.first_dock.check({ totalDockings: 0 })).toBe(false);
            });
        });

        describe('perfect_dock', () => {
            it('should unlock with very low relative velocity', () => {
                expect(ACHIEVEMENTS.perfect_dock.check({ relVx: 0.3, relVy: 0.2 })).toBe(true);
            });

            it('should not unlock with high relative velocity', () => {
                expect(ACHIEVEMENTS.perfect_dock.check({ relVx: 0.6, relVy: 0.2 })).toBe(false);
                expect(ACHIEVEMENTS.perfect_dock.check({ relVx: 0.2, relVy: 0.6 })).toBe(false);
            });

            it('should not unlock at exactly 0.5 threshold', () => {
                expect(ACHIEVEMENTS.perfect_dock.check({ relVx: 0.5, relVy: 0.5 })).toBe(false);
            });

            it('should unlock just under threshold', () => {
                expect(ACHIEVEMENTS.perfect_dock.check({ relVx: 0.49, relVy: 0.49 })).toBe(true);
            });
        });

        describe('fuel_miser', () => {
            it('should unlock with 65% fuel remaining', () => {
                expect(ACHIEVEMENTS.fuel_miser.check({ fuelRemaining: 65 })).toBe(true);
            });

            it('should unlock with exactly 60% fuel', () => {
                expect(ACHIEVEMENTS.fuel_miser.check({ fuelRemaining: 60 })).toBe(true);
            });

            it('should not unlock with 59% fuel', () => {
                expect(ACHIEVEMENTS.fuel_miser.check({ fuelRemaining: 59 })).toBe(false);
            });
        });

        describe('speed_runner', () => {
            it('should unlock with 25 seconds', () => {
                expect(ACHIEVEMENTS.speed_runner.check({ timeElapsed: 25000 })).toBe(true);
            });

            it('should unlock just under 30 seconds', () => {
                expect(ACHIEVEMENTS.speed_runner.check({ timeElapsed: 29999 })).toBe(true);
            });

            it('should not unlock at exactly 30 seconds', () => {
                expect(ACHIEVEMENTS.speed_runner.check({ timeElapsed: 30000 })).toBe(false);
            });

            it('should not unlock with slow time', () => {
                expect(ACHIEVEMENTS.speed_runner.check({ timeElapsed: 45000 })).toBe(false);
            });
        });

        describe('close_call', () => {
            it('should unlock with 3% fuel remaining', () => {
                expect(ACHIEVEMENTS.close_call.check({ fuelRemaining: 3 })).toBe(true);
            });

            it('should unlock with 4.9% fuel', () => {
                expect(ACHIEVEMENTS.close_call.check({ fuelRemaining: 4.9 })).toBe(true);
            });

            it('should not unlock with 5% fuel', () => {
                expect(ACHIEVEMENTS.close_call.check({ fuelRemaining: 5 })).toBe(false);
            });

            it('should not unlock with 0% fuel', () => {
                expect(ACHIEVEMENTS.close_call.check({ fuelRemaining: 0 })).toBe(false);
            });

            it('should not unlock with negative fuel', () => {
                expect(ACHIEVEMENTS.close_call.check({ fuelRemaining: -1 })).toBe(false);
            });
        });

        describe('veteran', () => {
            it('should unlock with 5 dockings', () => {
                expect(ACHIEVEMENTS.veteran.check({ totalDockings: 5 })).toBe(true);
            });

            it('should unlock with more than 5 dockings', () => {
                expect(ACHIEVEMENTS.veteran.check({ totalDockings: 10 })).toBe(true);
            });

            it('should not unlock with 4 dockings', () => {
                expect(ACHIEVEMENTS.veteran.check({ totalDockings: 4 })).toBe(false);
            });
        });

        describe('ace', () => {
            it('should unlock with 10 dockings', () => {
                expect(ACHIEVEMENTS.ace.check({ totalDockings: 10 })).toBe(true);
            });

            it('should not unlock with 9 dockings', () => {
                expect(ACHIEVEMENTS.ace.check({ totalDockings: 9 })).toBe(false);
            });
        });

        describe('high_scorer', () => {
            it('should unlock with score of 1600', () => {
                expect(ACHIEVEMENTS.high_scorer.check({ score: 1600 })).toBe(true);
            });

            it('should unlock with exactly 1500', () => {
                expect(ACHIEVEMENTS.high_scorer.check({ score: 1500 })).toBe(true);
            });

            it('should not unlock with 1499', () => {
                expect(ACHIEVEMENTS.high_scorer.check({ score: 1499 })).toBe(false);
            });
        });
    });
});

describe('loadAchievements', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should return default state when no data saved', () => {
        const data = loadAchievements();
        expect(data.unlocked).toEqual({});
        expect(data.totalDockings).toBe(0);
        expect(data.bestScore).toBe(0);
        expect(data.bestTime).toBe(Infinity);
    });

    it('should load saved data from localStorage', () => {
        const savedData = {
            unlocked: { first_dock: { unlockedAt: 123456 } },
            totalDockings: 5,
            bestScore: 1500,
            bestTime: 20000
        };
        localStorage.setItem('apolloAchievements', JSON.stringify(savedData));

        const data = loadAchievements();
        expect(data.unlocked.first_dock).toBeDefined();
        expect(data.totalDockings).toBe(5);
        expect(data.bestScore).toBe(1500);
        expect(data.bestTime).toBe(20000);
    });
});

describe('saveAchievements', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should save data to localStorage', () => {
        const data = {
            unlocked: { first_dock: { unlockedAt: 123456 } },
            totalDockings: 3,
            bestScore: 1200,
            bestTime: 25000
        };

        saveAchievements(data);

        const saved = JSON.parse(localStorage.getItem('apolloAchievements'));
        expect(saved.unlocked.first_dock).toBeDefined();
        expect(saved.totalDockings).toBe(3);
        expect(saved.bestScore).toBe(1200);
    });
});

describe('checkAchievements', () => {
    let achievementData;

    beforeEach(() => {
        localStorage.clear();
        achievementData = {
            unlocked: {},
            totalDockings: 0,
            bestScore: 0,
            bestTime: Infinity
        };
    });

    it('should unlock first_dock achievement', () => {
        const stats = { totalDockings: 1 };
        const unlocked = checkAchievements(stats, achievementData);

        expect(unlocked.length).toBe(1);
        expect(unlocked[0].id).toBe('first_dock');
        expect(achievementData.unlocked.first_dock).toBeDefined();
    });

    it('should unlock multiple achievements at once', () => {
        const stats = {
            totalDockings: 1,
            fuelRemaining: 65,
            timeElapsed: 25000,
            relVx: 0.3,
            relVy: 0.2,
            score: 1600
        };
        const unlocked = checkAchievements(stats, achievementData);

        // Should unlock: first_dock, fuel_miser, speed_runner, perfect_dock, high_scorer
        expect(unlocked.length).toBe(5);
    });

    it('should not double-unlock achievements', () => {
        achievementData.unlocked.first_dock = { unlockedAt: Date.now() };

        const stats = { totalDockings: 2 };
        const unlocked = checkAchievements(stats, achievementData);

        expect(unlocked.find(a => a.id === 'first_dock')).toBeUndefined();
    });

    it('should return empty array when no new achievements', () => {
        // Pre-unlock first_dock
        achievementData.unlocked.first_dock = { unlockedAt: Date.now() };

        const stats = { totalDockings: 1, fuelRemaining: 50, timeElapsed: 45000 };
        const unlocked = checkAchievements(stats, achievementData);

        expect(unlocked.length).toBe(0);
    });

    it('should save achievements after unlocking', () => {
        const stats = { totalDockings: 1 };
        checkAchievements(stats, achievementData);

        const saved = JSON.parse(localStorage.getItem('apolloAchievements'));
        expect(saved.unlocked.first_dock).toBeDefined();
    });
});
