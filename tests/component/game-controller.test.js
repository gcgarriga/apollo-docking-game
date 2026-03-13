/**
 * Component tests for createGameController
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameController, gameState, setGameState } from '../../game.js';

describe('createGameController', () => {
    let controller;

    beforeEach(() => {
        setGameState('playing');
        localStorage.setItem('apolloTutorialShown', 'true');
        controller = createGameController();
        controller.init();
    });

    describe('factory', () => {
        it('returns object with expected methods', () => {
            const ctrl = createGameController();
            expect(ctrl).toHaveProperty('togglePause');
            expect(ctrl).toHaveProperty('toggleHelp');
            expect(ctrl).toHaveProperty('toggleTrophyRoom');
            expect(ctrl).toHaveProperty('resetGame');
            expect(ctrl).toHaveProperty('start');
            expect(typeof ctrl.togglePause).toBe('function');
            expect(typeof ctrl.toggleHelp).toBe('function');
            expect(typeof ctrl.toggleTrophyRoom).toBe('function');
            expect(typeof ctrl.resetGame).toBe('function');
            expect(typeof ctrl.start).toBe('function');
        });

        it('start() initializes without errors when DOM is present', () => {
            expect(() => controller.start()).not.toThrow();
        });
    });

    describe('togglePause', () => {
        it('pauses a playing game', () => {
            controller.setGameState('playing');
            controller.togglePause();
            expect(controller.getGameState()).toBe('paused');
        });

        it('resumes a paused game', () => {
            controller.setGameState('playing');
            controller.togglePause();
            controller.togglePause();
            expect(controller.getGameState()).toBe('playing');
        });

        it('shows pause overlay when pausing', () => {
            controller.setGameState('playing');
            controller.togglePause();
            const pauseOverlay = document.getElementById('pause-overlay');
            expect(pauseOverlay.style.display).toBe('block');
        });

        it('hides pause overlay when resuming', () => {
            controller.setGameState('playing');
            controller.togglePause();
            controller.togglePause();
            const pauseOverlay = document.getElementById('pause-overlay');
            expect(pauseOverlay.style.display).toBe('none');
        });
    });

    describe('toggleHelp', () => {
        it('shows tutorial overlay', () => {
            const tutorialOverlay = document.getElementById('tutorial-overlay');
            tutorialOverlay.style.display = 'none';
            controller.toggleHelp();
            expect(tutorialOverlay.style.display).toBe('block');
        });

        it('hides tutorial overlay', () => {
            controller.toggleHelp(); // show
            controller.toggleHelp(); // hide
            const tutorialOverlay = document.getElementById('tutorial-overlay');
            expect(tutorialOverlay.style.display).toBe('none');
        });

        it('pauses game when showing help', () => {
            controller.setGameState('playing');
            controller.toggleHelp();
            expect(controller.getGameState()).toBe('paused');
        });

        it('resumes game when hiding help', () => {
            controller.setGameState('playing');
            controller.toggleHelp(); // show → paused
            controller.toggleHelp(); // hide → playing
            expect(controller.getGameState()).toBe('playing');
        });
    });

    describe('toggleTrophyRoom', () => {
        it('shows trophy overlay', () => {
            const trophyOverlay = document.getElementById('trophy-overlay');
            trophyOverlay.style.display = 'none';
            controller.toggleTrophyRoom();
            expect(trophyOverlay.style.display).toBe('block');
        });

        it('hides trophy overlay', () => {
            controller.toggleTrophyRoom(); // show
            controller.toggleTrophyRoom(); // hide
            const trophyOverlay = document.getElementById('trophy-overlay');
            expect(trophyOverlay.style.display).toBe('none');
        });

        it('pauses game when showing trophies', () => {
            controller.setGameState('playing');
            controller.toggleTrophyRoom();
            expect(controller.getGameState()).toBe('paused');
        });
    });

    describe('reset', () => {
        it('sets gameState back to playing', () => {
            controller.setGameState('lost');
            controller.resetGame();
            expect(controller.getGameState()).toBe('playing');
            expect(gameState).toBe('playing');
        });

        it('hides message overlay', () => {
            const msgOverlay = document.getElementById('message-overlay');
            msgOverlay.style.display = 'block';
            controller.resetGame();
            expect(msgOverlay.style.display).toBe('none');
        });

        it('hides pause overlay', () => {
            const pauseOverlay = document.getElementById('pause-overlay');
            pauseOverlay.style.display = 'block';
            controller.resetGame();
            expect(pauseOverlay.style.display).toBe('none');
        });
    });

    describe('integration', () => {
        it('full cycle: start → pause → resume works correctly', () => {
            controller.start();

            // Should start in playing state
            expect(controller.getGameState()).toBe('playing');

            // Pause
            controller.togglePause();
            expect(controller.getGameState()).toBe('paused');
            expect(gameState).toBe('paused');
            expect(document.getElementById('pause-overlay').style.display).toBe('block');

            // Resume
            controller.togglePause();
            expect(controller.getGameState()).toBe('playing');
            expect(gameState).toBe('playing');
            expect(document.getElementById('pause-overlay').style.display).toBe('none');
        });
    });
});
