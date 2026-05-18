import { describe, it, expect, vi } from 'vitest';
import { createCanvasContextMock, createAudioContextMock } from '../setup.js';
import {
    Particle, spawnExhaust, spawnCelebration, updateCelebrationParticles,
    initAudio, getAudioContext, setAudioContext, playSound,
    drawLMAtPosition, drawCSMAtPosition,
    PARTICLE_COUNT_PER_THRUST
} from '../../game.js';

describe('Particle system', () => {
    it('creates and updates a particle', () => {
        const p = new Particle(10, 20, 1, 2, 30, '#ff0');
        expect(p.x).toBe(10);
        p.update();
        expect(p.x).toBe(11);
        expect(p.y).toBe(22);
        expect(p.life).toBe(29);
    });

    it('draws a particle with correct alpha', () => {
        const ctx = createCanvasContextMock();
        const p = new Particle(5, 5, 0, 0, 15, '#f00');
        p.draw(ctx);
        expect(ctx.fillStyle).toBe('#f00');
        expect(ctx.fillRect).toHaveBeenCalledWith(5, 5, 2, 2);
        expect(ctx.globalAlpha).toBe(1.0);
    });

    it('spawnExhaust creates correct number of particles per direction', () => {
        for (const dir of ['down', 'up', 'left', 'right']) {
            const arr = [];
            spawnExhaust(100, 100, dir, arr);
            expect(arr).toHaveLength(PARTICLE_COUNT_PER_THRUST);
        }
    });

    it('spawnCelebration creates 50 particles at position', () => {
        const arr = [];
        spawnCelebration(200, 200, arr);
        expect(arr).toHaveLength(50);
        expect(arr[0].x).toBe(200);
    });

    it('updateCelebrationParticles applies gravity and removes dead', () => {
        const arr = [{ x: 0, y: 0, vx: 1, vy: 0, life: 1 }];
        updateCelebrationParticles(arr);
        expect(arr).toHaveLength(0); // life 1 → 0, removed
    });
});

describe('Audio system', () => {
    beforeEach(() => {
        const MockAudioContext = vi.fn(function () { return createAudioContextMock(); });
        // Ensure initAudio can construct an AudioContext in the test environment
        globalThis.AudioContext = MockAudioContext;
        globalThis.webkitAudioContext = MockAudioContext;
        window.AudioContext = MockAudioContext;
        window.webkitAudioContext = MockAudioContext;
        setAudioContext(null);
    });

    it('initializes and returns audio context', () => {
        const ctx = initAudio();
        expect(ctx).toBeTruthy();
        expect(getAudioContext()).toBe(ctx);
    });

    it('plays sound types without throwing', () => {
        initAudio();
        for (const type of ['thrust', 'rcs', 'dock_success', 'collision', 'alarm']) {
            expect(() => playSound(type)).not.toThrow();
        }
    });

    it('handles missing audio context gracefully', () => {
        setAudioContext(null);
        expect(() => playSound('thrust')).not.toThrow();
    });
});

describe('Rendering', () => {
    it('drawLMAtPosition calls save/translate/restore', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 100, 200);
        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.translate).toHaveBeenCalledWith(100, 200);
        expect(ctx.restore).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
    });

    it('drawCSMAtPosition renders all components', () => {
        const ctx = createCanvasContextMock();
        drawCSMAtPosition(ctx, 300, 100);
        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.translate).toHaveBeenCalledWith(300, 100);
        expect(ctx.fillRect).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });
});
