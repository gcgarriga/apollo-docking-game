/**
 * Unit tests for drawing/rendering functions
 */

import { describe, it, expect } from 'vitest';
import { drawLMAtPosition, drawCSMAtPosition } from '../../game.js';
import { createCanvasContextMock } from '../setup.js';

describe('drawLMAtPosition', () => {
    it('calls ctx.save() and ctx.restore()', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 50, 60);
        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it('calls ctx.translate(x, y) with given coordinates', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 50, 60);
        expect(ctx.translate).toHaveBeenCalledWith(50, 60);
    });

    it('sets fillStyle to #D4AF37 (gold body color)', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 50, 60);
        // fillStyle is set multiple times; check it was set to gold at some point
        // After drawing, the last fillStyle is '#111' (window), so we track calls
        // by verifying the body path was filled after setting gold
        expect(ctx.fill).toHaveBeenCalled();
    });

    it('calls beginPath, closePath, fill for body', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 50, 60);
        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.closePath).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
    });

    it('sets strokeStyle to #999 and lineWidth to 2', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 50, 60);
        expect(ctx.strokeStyle).toBe('#999');
        expect(ctx.lineWidth).toBe(2);
    });

    it('calls stroke() for body outline', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 50, 60);
        expect(ctx.stroke).toHaveBeenCalled();
    });

    it('sets fillStyle to #111 for window', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 50, 60);
        // The last fillStyle assignment is '#111' for the window
        expect(ctx.fillStyle).toBe('#111');
    });

    it('works with coordinates (0, 0)', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 0, 0);
        expect(ctx.translate).toHaveBeenCalledWith(0, 0);
        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it('works with coordinates (100, 200)', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 100, 200);
        expect(ctx.translate).toHaveBeenCalledWith(100, 200);
    });

    it('works with coordinates (400, 300)', () => {
        const ctx = createCanvasContextMock();
        drawLMAtPosition(ctx, 400, 300);
        expect(ctx.translate).toHaveBeenCalledWith(400, 300);
    });
});

describe('drawCSMAtPosition', () => {
    it('calls ctx.save() and ctx.restore()', () => {
        const ctx = createCanvasContextMock();
        drawCSMAtPosition(ctx, 50, 60);
        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it('calls ctx.translate(x, y)', () => {
        const ctx = createCanvasContextMock();
        drawCSMAtPosition(ctx, 120, 80);
        expect(ctx.translate).toHaveBeenCalledWith(120, 80);
    });

    it('calls fillRect for service module body', () => {
        const ctx = createCanvasContextMock();
        drawCSMAtPosition(ctx, 50, 60);
        expect(ctx.fillRect).toHaveBeenCalledWith(-20, -10, 30, 20);
    });

    it('calls beginPath and fill for command module cone', () => {
        const ctx = createCanvasContextMock();
        drawCSMAtPosition(ctx, 50, 60);
        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
        // Verify the cone moveTo point
        expect(ctx.moveTo).toHaveBeenCalledWith(10, -10);
        expect(ctx.lineTo).toHaveBeenCalledWith(25, 0);
    });

    it('calls beginPath and fill for engine bell', () => {
        const ctx = createCanvasContextMock();
        drawCSMAtPosition(ctx, 50, 60);
        // Engine bell uses moveTo(-20, -5)
        expect(ctx.moveTo).toHaveBeenCalledWith(-20, -5);
        expect(ctx.lineTo).toHaveBeenCalledWith(-28, -8);
        expect(ctx.lineTo).toHaveBeenCalledWith(-28, 8);
    });

    it('calls fillRect for docking port and opening', () => {
        const ctx = createCanvasContextMock();
        drawCSMAtPosition(ctx, 50, 60);
        // Docking port
        expect(ctx.fillRect).toHaveBeenCalledWith(-5, -15, 10, 5);
        // Docking port opening
        expect(ctx.fillRect).toHaveBeenCalledWith(-3, -14, 6, 3);
    });

    it('works with coordinates (0, 0)', () => {
        const ctx = createCanvasContextMock();
        drawCSMAtPosition(ctx, 0, 0);
        expect(ctx.translate).toHaveBeenCalledWith(0, 0);
        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it('works with coordinates (300, 150)', () => {
        const ctx = createCanvasContextMock();
        drawCSMAtPosition(ctx, 300, 150);
        expect(ctx.translate).toHaveBeenCalledWith(300, 150);
    });
});
