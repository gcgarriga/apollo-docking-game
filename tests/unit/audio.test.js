import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    initAudio,
    getAudioContext,
    setAudioContext,
    playSound,
    playAchievementSound,
    playThrustSound,
    playRcsSound,
    playAlarmSound
} from '../../game.js';
import { createAudioContextMock } from '../setup.js';

describe('Audio System', () => {
    beforeEach(() => {
        setAudioContext(null);
    });

    describe('initAudio', () => {
        it('creates and returns an AudioContext', () => {
            const ctx = initAudio();
            expect(ctx).not.toBeNull();
            expect(ctx).toHaveProperty('createOscillator');
        });

        it('returns same context on subsequent calls (singleton)', () => {
            const ctx1 = initAudio();
            const ctx2 = initAudio();
            expect(ctx1).toBe(ctx2);
        });
    });

    describe('getAudioContext / setAudioContext', () => {
        it('getAudioContext returns null initially after reset', () => {
            expect(getAudioContext()).toBeNull();
        });

        it('setAudioContext sets the context', () => {
            const mock = createAudioContextMock();
            setAudioContext(mock);
            expect(getAudioContext()).toBe(mock);
        });

        it('getAudioContext returns what was set', () => {
            const mock = createAudioContextMock();
            setAudioContext(mock);
            expect(getAudioContext()).toBe(mock);

            const mock2 = createAudioContextMock();
            setAudioContext(mock2);
            expect(getAudioContext()).toBe(mock2);
        });
    });

    describe('playSound', () => {
        let mockCtx;

        beforeEach(() => {
            mockCtx = createAudioContextMock();
            setAudioContext(mockCtx);
        });

        it('thrust creates oscillator with sawtooth type', () => {
            playSound('thrust');
            expect(mockCtx.createOscillator).toHaveBeenCalled();
            expect(mockCtx.createGain).toHaveBeenCalled();
            const osc = mockCtx.createOscillator.mock.results[0].value;
            expect(osc.type).toBe('sawtooth');
        });

        it('rcs creates oscillator with square type', () => {
            playSound('rcs');
            const osc = mockCtx.createOscillator.mock.results[0].value;
            expect(osc.type).toBe('square');
        });

        it('dock_success creates multiple oscillators (chord)', () => {
            playSound('dock_success');
            // 1 initial + 3 chord oscillators
            expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);
        });

        it('collision creates oscillator with sawtooth type', () => {
            playSound('collision');
            const osc = mockCtx.createOscillator.mock.results[0].value;
            expect(osc.type).toBe('sawtooth');
        });

        it('alarm creates oscillator with square type', () => {
            playSound('alarm');
            const osc = mockCtx.createOscillator.mock.results[0].value;
            expect(osc.type).toBe('square');
        });

        it('does not throw when audio context is unavailable', () => {
            setAudioContext(null);
            // Override AudioContext to throw
            const original = globalThis.AudioContext;
            globalThis.AudioContext = vi.fn(() => { throw new Error('not supported'); });
            expect(() => playSound('thrust')).not.toThrow();
            globalThis.AudioContext = original;
        });
    });

    describe('playAchievementSound', () => {
        it('creates multiple oscillators for arpeggio', () => {
            const mockCtx = createAudioContextMock();
            setAudioContext(mockCtx);
            playAchievementSound();
            // 4 notes in the arpeggio [880, 1100, 1320, 1760]
            expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);
            expect(mockCtx.createGain).toHaveBeenCalledTimes(4);
        });

        it('does not throw when audio is unavailable', () => {
            setAudioContext(null);
            const original = globalThis.AudioContext;
            globalThis.AudioContext = vi.fn(() => { throw new Error('not supported'); });
            expect(() => playAchievementSound()).not.toThrow();
            globalThis.AudioContext = original;
        });
    });

    describe('Throttled sounds', () => {
        let mockCtx;

        beforeEach(() => {
            mockCtx = createAudioContextMock();
            setAudioContext(mockCtx);
        });

        it('playThrustSound calls playSound on first call', () => {
            playThrustSound();
            expect(mockCtx.createOscillator).toHaveBeenCalled();
        });

        it('playThrustSound is throttled (second call within 100ms does nothing)', () => {
            playThrustSound();
            const callCount = mockCtx.createOscillator.mock.calls.length;
            playThrustSound();
            expect(mockCtx.createOscillator).toHaveBeenCalledTimes(callCount);
        });

        it('playRcsSound works and is throttled at 80ms', () => {
            playRcsSound();
            expect(mockCtx.createOscillator).toHaveBeenCalled();
            const callCount = mockCtx.createOscillator.mock.calls.length;
            playRcsSound();
            expect(mockCtx.createOscillator).toHaveBeenCalledTimes(callCount);
        });

        it('playAlarmSound works and is throttled at 500ms', () => {
            playAlarmSound();
            expect(mockCtx.createOscillator).toHaveBeenCalled();
            const callCount = mockCtx.createOscillator.mock.calls.length;
            playAlarmSound();
            expect(mockCtx.createOscillator).toHaveBeenCalledTimes(callCount);
        });
    });
});
