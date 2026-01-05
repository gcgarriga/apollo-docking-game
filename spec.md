# Apollo Ascent & Docking Simulator - Project Specification

## Overview

**Apollo Ascent & Docking Simulator** is a browser-based educational space simulation game that recreates the challenging Apollo Lunar Module ascent and docking procedure. Players control the LM (Lunar Module) as it launches from the lunar surface and attempts to dock with the orbiting Command/Service Module (CSM).

### Key Features
- Realistic physics simulation (gravity, inertia, thrust vectors)
- Fuel management system
- Particle effects for engine exhaust
- AABB collision detection for docking
- Screen wrapping to simulate orbital mechanics
- Retro-aesthetic UI with real-time telemetry

### Current State
Single HTML file (482 lines) with embedded CSS and vanilla JavaScript. Clean, educational codebase undergoing improvements to enhance gameplay, usability, and code quality.

---

## Requirements

### Functional Requirements

**FR1: Bug Fixes**
- Fix ghost rendering implementation for screen-wrap visualization
- Complete fuel depletion end-game logic
- Ensure stable rendering across all edge cases

**FR2: Gameplay Control**
- Implement pause/resume functionality (P key or ESC)
- Maintain game state during pause
- Display pause overlay with controls reminder

**FR3: Enhanced Docking Feedback**
- Display relative velocity to CSM (Δv) in UI
- Show distance to CSM target
- Color-coded velocity indicator (green=safe, yellow=caution, red=too fast)
- Visual alignment aid for docking approach

**FR4: Player Onboarding**
- Initial tutorial overlay before first game
- Help toggle (? key) during gameplay
- Clear control instructions and strategy tips
- Dismissible with any key press

**FR5: Code Organization**
- Extract all magic numbers to named constants
- Group constants logically by domain (physics, thresholds, rendering)
- Improve code maintainability and tunability

**FR6: CSM Tracking**
- Visual indicator when CSM is off-screen
- Arrow at screen edge pointing toward CSM
- Distance display in indicator

**FR7: Mobile Support**
- Touch-based virtual controls overlay
- Responsive layout for mobile viewports
- On-screen thrust buttons (main, RCS up/down/left/right)

**FR8: General Code Quality**
- Remove commented-out code
- Improve function documentation
- Ensure consistent code style

### Non-Functional Requirements

**NFR1: Performance**
- Maintain 60 FPS on modern browsers
- Minimal memory footprint

**NFR2: Compatibility**
- Support modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile Safari and Chrome support

**NFR3: Maintainability**
- Clear separation of concerns
- Self-documenting code with meaningful names
- Modular architecture for future enhancements

**NFR4: User Experience**
- Intuitive controls
- Clear visual feedback
- Responsive UI updates

---

## Tech Stack

### Core Technologies
- **HTML5** - Document structure and Canvas API
- **CSS3** - Styling, flexbox layout, overlays, responsive design
- **Vanilla JavaScript (ES6+)** - Game logic, no frameworks

### Key APIs & Features Used
- **Canvas 2D Context** - All rendering and graphics
- **requestAnimationFrame** - 60 FPS game loop
- **Event Listeners** - Keyboard and touch input
- **CSS Transforms** - UI positioning and overlays

### Architecture Pattern
- Object literal pattern for game entities (LM, CSM)
- Procedural rendering pipeline
- Class-based particle system
- State machine for game states (playing, paused, won, lost)

### No External Dependencies
- Zero npm packages
- No build tools required
- Single self-contained HTML file
- Can be opened directly in browser

---

## Design Guidelines

### Code Style
1. **Constants**: UPPER_SNAKE_CASE for configuration values
2. **Variables**: camelCase for state and objects
3. **Functions**: camelCase, verb-noun naming
4. **Comments**: JSDoc style for complex functions, inline for clarity

### Game Design Principles
1. **Realistic Physics** - Maintain Newton's laws simulation
2. **Fair Challenge** - Difficult but learnable with practice
3. **Clear Feedback** - Players should always know their status
4. **Retro Aesthetic** - Monospace fonts, simple shapes, space theme
5. **Educational Value** - Teach orbital mechanics concepts

### UI/UX Guidelines
1. **Minimalist HUD** - Essential info only, no clutter
2. **High Contrast** - White text on dark background for readability
3. **Color Coding** - Red=danger, Yellow=caution, Green=good
4. **Immediate Feedback** - Visual/state response to every action
5. **Mobile-First Touch** - Large touch targets (min 44px), clear buttons

### Performance Guidelines
1. **Efficient Rendering** - Only clear/redraw what's needed
2. **Particle Limits** - Cap particle count to prevent slowdown
3. **No Memory Leaks** - Clean up arrays, event listeners
4. **Smooth Animation** - Consistent frame timing

### Architecture Guidelines
1. **Single File Constraint** - Keep as one HTML file for portability
2. **Separation of Concerns** - Distinct sections for config, state, logic, rendering
3. **Pure Functions** - Where possible, avoid side effects
4. **Event-Driven Input** - Centralized input handling

---

## Milestones

### Milestone 1: Critical Bug Fixes
**Goal:** Fix existing issues that cause incorrect behavior

**Tasks:**
1. Fix ghost rendering (apollo_docking.html:463-469)
   - Remove mock context object approach
   - Create `drawLMAtPosition(ctx, x, y)` helper function
   - Call helper for both main LM and ghost instances

2. Complete fuel depletion logic (apollo_docking.html:243-249)
   - Define end-game condition for running out of fuel in space
   - Add "Fuel Depleted" mission failure state
   - Trigger failure if fuel=0 and altitude > 50m

3. Code cleanup
   - Remove commented ceiling collision code (lines 238-239)
   - Remove TODO comments after implementing fuel logic

**Acceptance Criteria:**
- Ghost LM renders correctly near screen edges
- Fuel depletion triggers appropriate game over
- No console errors during gameplay

### Milestone 2: Pause Functionality
**Goal:** Allow players to pause and resume the game

**Tasks:**
1. Extend gameState to include 'paused'
2. Create pause overlay UI
3. Handle P key and ESC key for pause/resume
4. Freeze all updates during pause

**Acceptance Criteria:**
- P or ESC key pauses/resumes game
- All physics/movement stops during pause
- Clear visual indication of pause state

### Milestone 3: Improved Constants Organization
**Goal:** Extract magic numbers to named constants for maintainability

**Tasks:**
1. Create threshold constants section
2. Create rendering constants section
3. Update all references throughout code

**Acceptance Criteria:**
- All magic numbers converted to named constants
- Constants grouped by category with comments
- Easy to tune game parameters

### Milestone 4: Enhanced Docking Feedback System
**Goal:** Provide clear visual feedback for docking approach

**Tasks:**
1. Add relative velocity display (Δvx, Δvy)
2. Add distance to CSM display
3. Implement color-coded velocity indicator
4. Draw visual alignment aids (dashed line, safe zones)

**Acceptance Criteria:**
- Relative velocities displayed and color-coded
- Distance to CSM visible in UI
- Visual aids help player judge approach
- Colors match velocity thresholds

### Milestone 5: Tutorial and Help System
**Goal:** Teach new players how to play effectively

**Tasks:**
1. Create tutorial overlay (shown on first load)
2. Add tutorial content (controls, objective, tips)
3. Implement help toggle (? key)
4. Use localStorage to track tutorial shown status

**Acceptance Criteria:**
- Tutorial appears on first game load
- Help accessible via ? key during game
- Clear, concise instructions
- Dismissible with any key

### Milestone 6: CSM Position Indicator
**Goal:** Help players track CSM when off-screen

**Tasks:**
1. Create `isCSMOffScreen()` detection function
2. Draw direction arrow at screen edge
3. Display distance in indicator
4. Style with pulsing animation when close

**Acceptance Criteria:**
- Arrow appears when CSM off-screen
- Points in correct direction
- Distance value accurate
- Helps player locate CSM quickly

### Milestone 7: Mobile Touch Controls
**Goal:** Make game playable on mobile devices

**Tasks:**
1. Ensure responsive layout
2. Create virtual button overlay (d-pad + main engine)
3. Implement touch event handling
4. Show controls only on touch devices

**Acceptance Criteria:**
- Game playable on mobile browsers
- Touch buttons responsive and well-sized
- Keyboard still works on desktop
- UI scales appropriately

### Milestone 8: Code Refactoring and Documentation
**Goal:** Improve code quality and maintainability

**Tasks:**
1. Extract rendering functions (drawLM, drawCSM)
2. Add JSDoc comments to major functions
3. Improve variable names
4. Add clear section dividers

**Acceptance Criteria:**
- Code is self-documenting
- Functions have clear responsibilities
- Easy to understand for future modifications
- Consistent style throughout

---

## Implementation Strategy

### Development Approach
1. **Incremental Development** - Implement one milestone at a time
2. **Test After Each Change** - Verify functionality before moving on
3. **Maintain Single File** - Keep all code in apollo_docking.html
4. **Backward Compatibility** - Don't break existing gameplay

### Testing Strategy
- Manual testing in Chrome, Firefox, Safari
- Test on mobile device (iOS Safari, Chrome Android)
- Verify edge cases:
  - Screen wrap with ghost rendering
  - Fuel depletion at various altitudes
  - Pause during different game states
  - Touch controls on mobile
  - Docking at various velocities

### Success Metrics
- All 8 milestones completed
- No console errors during gameplay
- Maintains 60 FPS performance
- Positive playability on mobile and desktop

---

## File Structure

```
apollo-docking-game/
├── apollo_docking.html    # Main game file (all code)
├── spec.md                # This specification document
└── README.md              # (Optional) Project readme
```

---

## Game Controls

### Desktop (Keyboard)
- **↑ Arrow Up** - Main Engine (thrust upward)
- **↓ Arrow Down** - RCS Down (thrust downward)
- **← Arrow Left** - RCS Left (thrust left)
- **→ Arrow Right** - RCS Right (thrust right)
- **P or ESC** - Pause/Resume
- **? (Question Mark)** - Toggle Help
- **SPACE** - Restart (after game over)

### Mobile (Touch)
- On-screen virtual buttons for all thrust controls
- Same functionality as keyboard controls

---

## Physics Model

### Gravity
- Constant downward acceleration: 0.05 units/frame
- Simulates lunar gravity (scaled for gameplay)

### Thrust Systems
- **Main Engine**: 0.15 units/frame upward force
- **RCS Thrusters**: 0.05 units/frame directional force

### Fuel Consumption
- Main Engine: 0.5% per frame
- RCS Thrusters: 0.1% per frame

### Docking Criteria
- Relative horizontal velocity < 1.0 units/sec
- Relative vertical velocity < 1.0 units/sec
- Must be in contact with CSM

### Crash Criteria
- Impact lunar surface with vertical velocity > 2.0 units/sec
- Collide with CSM at excessive speed

---

## Visual Design

### Color Palette
- **Background**: #0b0b15 (dark space blue)
- **Moon Surface**: #555 (gray)
- **LM**: #D4AF37 (gold)
- **CSM**: #ccc, #eee (silver/white)
- **Stars**: white
- **Exhaust**: #ffaa00 (orange), #ffcc00 (bright yellow for main)
- **UI Text**: white, red (warnings), green (success), yellow (caution)

### Typography
- **Font Family**: 'Courier New', Courier, monospace
- **UI Size**: 14px
- **Title Size**: 24px

### Canvas Dimensions
- Width: 800px
- Height: 600px
- Responsive scaling for mobile

---

## Future Enhancements (Not in Current Scope)

- Sound effects and background music
- Score tracking and leaderboards
- Multiple difficulty levels
- Rotation controls for advanced realism
- Additional mission scenarios
- Earth and stars animation in background
- Multiplayer competitive mode

---

## Version History

- **v1.0** - Initial release (Dec 31, 2025)
- **v2.0** - Planned improvements (8 milestones) - In Progress

---

## License & Credits

Educational project demonstrating physics simulation and game development with vanilla JavaScript.

**Created by:** gcgarriga
**Last Updated:** January 4, 2026
