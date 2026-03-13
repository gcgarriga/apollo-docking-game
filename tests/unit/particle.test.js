import { describe, it, expect } from 'vitest';
import {
    Particle,
    spawnExhaust,
    spawnCelebration,
    updateCelebrationParticles,
    PARTICLE_COUNT_PER_THRUST,
    PARTICLE_MIN_LIFE,
    PARTICLE_MAX_LIFE,
    PARTICLE_ALPHA_DIVISOR
} from '../../game.js';
import { createCanvasContextMock } from '../setup.js';

describe('Particle class', () => {
    it('constructor sets all properties', () => {
        const p = new Particle(10, 20, 1, 2, 30, '#ff0000');
        expect(p.x).toBe(10);
        expect(p.y).toBe(20);
        expect(p.vx).toBe(1);
        expect(p.vy).toBe(2);
        expect(p.life).toBe(30);
        expect(p.color).toBe('#ff0000');
    });

    it('update() moves position by velocity', () => {
        const p = new Particle(10, 20, 3, -2, 30, '#ff0000');
        p.update();
        expect(p.x).toBe(13);
        expect(p.y).toBe(18);
    });

    it('update() decrements life', () => {
        const p = new Particle(0, 0, 0, 0, 30, '#ff0000');
        p.update();
        expect(p.life).toBe(29);
    });

    it('multiple update() calls accumulate', () => {
        const p = new Particle(0, 0, 2, 3, 30, '#ff0000');
        p.update();
        p.update();
        p.update();
        expect(p.x).toBe(6);
        expect(p.y).toBe(9);
        expect(p.life).toBe(27);
    });

    it('draw() sets fillStyle to particle color', () => {
        const ctx = createCanvasContextMock();
        const p = new Particle(5, 10, 0, 0, 15, '#abcdef');
        p.draw(ctx);
        expect(ctx.fillStyle).toBe('#abcdef');
    });

    it('draw() sets globalAlpha based on life/PARTICLE_ALPHA_DIVISOR', () => {
        const ctx = createCanvasContextMock();
        const life = 15;
        const p = new Particle(0, 0, 0, 0, life, '#fff');
        // Capture the globalAlpha set before fillRect
        let alphaAtDraw;
        ctx.fillRect = (...args) => { alphaAtDraw = ctx.globalAlpha; };
        p.draw(ctx);
        expect(alphaAtDraw).toBe(life / PARTICLE_ALPHA_DIVISOR);
    });

    it('draw() calls fillRect at particle position', () => {
        const ctx = createCanvasContextMock();
        const p = new Particle(7, 13, 0, 0, 20, '#fff');
        p.draw(ctx);
        expect(ctx.fillRect).toHaveBeenCalledWith(7, 13, 2, 2);
    });

    it('draw() resets globalAlpha to 1.0', () => {
        const ctx = createCanvasContextMock();
        const p = new Particle(0, 0, 0, 0, 15, '#fff');
        p.draw(ctx);
        expect(ctx.globalAlpha).toBe(1.0);
    });
});

describe('spawnExhaust', () => {
    it('spawns PARTICLE_COUNT_PER_THRUST particles', () => {
        const arr = [];
        spawnExhaust(100, 200, 'down', arr);
        expect(arr.length).toBe(PARTICLE_COUNT_PER_THRUST);
    });

    it('direction "down": particles have positive vy bias and #ffcc00 color', () => {
        const arr = [];
        for (let i = 0; i < 20; i++) spawnExhaust(0, 0, 'down', arr);
        const avgVy = arr.reduce((sum, p) => sum + p.vy, 0) / arr.length;
        expect(avgVy).toBeGreaterThan(1);
        arr.forEach(p => expect(p.color).toBe('#ffcc00'));
    });

    it('direction "up": particles have negative vy bias', () => {
        const arr = [];
        for (let i = 0; i < 20; i++) spawnExhaust(0, 0, 'up', arr);
        const avgVy = arr.reduce((sum, p) => sum + p.vy, 0) / arr.length;
        expect(avgVy).toBeLessThan(0);
    });

    it('direction "left": particles have negative vx bias', () => {
        const arr = [];
        for (let i = 0; i < 20; i++) spawnExhaust(0, 0, 'left', arr);
        const avgVx = arr.reduce((sum, p) => sum + p.vx, 0) / arr.length;
        expect(avgVx).toBeLessThan(0);
    });

    it('direction "right": particles have positive vx bias', () => {
        const arr = [];
        for (let i = 0; i < 20; i++) spawnExhaust(0, 0, 'right', arr);
        const avgVx = arr.reduce((sum, p) => sum + p.vx, 0) / arr.length;
        expect(avgVx).toBeGreaterThan(0);
    });

    it('particles are Particle instances', () => {
        const arr = [];
        spawnExhaust(0, 0, 'down', arr);
        arr.forEach(p => expect(p).toBeInstanceOf(Particle));
    });

    it('particles have life within [PARTICLE_MIN_LIFE, PARTICLE_MAX_LIFE]', () => {
        const arr = [];
        for (let i = 0; i < 50; i++) spawnExhaust(0, 0, 'down', arr);
        arr.forEach(p => {
            expect(p.life).toBeGreaterThanOrEqual(PARTICLE_MIN_LIFE);
            expect(p.life).toBeLessThanOrEqual(PARTICLE_MAX_LIFE);
        });
    });

    it('uses custom particleArray when provided', () => {
        const custom = [];
        spawnExhaust(0, 0, 'down', custom);
        expect(custom.length).toBe(PARTICLE_COUNT_PER_THRUST);
    });
});

describe('spawnCelebration', () => {
    const validColors = ['#ff0', '#0f0', '#0ff', '#f0f', '#f90', '#fff'];

    it('spawns exactly 50 particles', () => {
        const arr = [];
        spawnCelebration(100, 200, arr);
        expect(arr.length).toBe(50);
    });

    it('all particles start at (x, y)', () => {
        const arr = [];
        spawnCelebration(42, 99, arr);
        arr.forEach(p => {
            expect(p.x).toBe(42);
            expect(p.y).toBe(99);
        });
    });

    it('particles have valid color from predefined set', () => {
        const arr = [];
        spawnCelebration(0, 0, arr);
        arr.forEach(p => expect(validColors).toContain(p.color));
    });

    it('particles have life in range [60, 100)', () => {
        const arr = [];
        spawnCelebration(0, 0, arr);
        arr.forEach(p => {
            expect(p.life).toBeGreaterThanOrEqual(60);
            expect(p.life).toBeLessThan(100);
        });
    });

    it('particles have size in range [2, 5)', () => {
        const arr = [];
        spawnCelebration(0, 0, arr);
        arr.forEach(p => {
            expect(p.size).toBeGreaterThanOrEqual(2);
            expect(p.size).toBeLessThan(5);
        });
    });

    it('uses custom targetArray when provided', () => {
        const custom = [];
        spawnCelebration(0, 0, custom);
        expect(custom.length).toBe(50);
    });
});

describe('updateCelebrationParticles', () => {
    it('updates particle positions', () => {
        const arr = [{ x: 10, y: 20, vx: 3, vy: -1, life: 50, color: '#fff', size: 3 }];
        updateCelebrationParticles(arr);
        expect(arr[0].x).toBe(13);
        expect(arr[0].y).toBe(19);
    });

    it('applies gravity (vy increases by 0.05)', () => {
        const arr = [{ x: 0, y: 0, vx: 0, vy: 1, life: 50, color: '#fff', size: 2 }];
        updateCelebrationParticles(arr);
        expect(arr[0].vy).toBeCloseTo(1.05);
    });

    it('decrements life', () => {
        const arr = [{ x: 0, y: 0, vx: 0, vy: 0, life: 50, color: '#fff', size: 2 }];
        updateCelebrationParticles(arr);
        expect(arr[0].life).toBe(49);
    });

    it('removes dead particles (life <= 0)', () => {
        const arr = [
            { x: 0, y: 0, vx: 0, vy: 0, life: 1, color: '#fff', size: 2 },
            { x: 0, y: 0, vx: 0, vy: 0, life: 50, color: '#fff', size: 2 }
        ];
        updateCelebrationParticles(arr);
        expect(arr.length).toBe(1);
        expect(arr[0].life).toBe(49);
    });

    it('handles empty array gracefully', () => {
        const arr = [];
        updateCelebrationParticles(arr);
        expect(arr.length).toBe(0);
    });
});
