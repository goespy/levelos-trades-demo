import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clampTourPanelPosition,
  defaultTourPanelPosition,
  hydrateTourPanelPosition,
  hydrateTourState,
  initialTourState,
  routeMatches,
  tourReducer,
} from "./guided-tour";
describe("guided tour state", () => {
  it("advances deterministically and can be skipped", () => {
    assert.equal(tourReducer(initialTourState, { type: "NEXT" }).step, "clients");
    assert.equal(tourReducer(initialTourState, { type: "SKIP" }).dismissed, true);
  });
  it("completes once, can restart, and guards routes", () => {
    let state = initialTourState;
    for (let index = 0; index < 10; index++) state = tourReducer(state, { type: "NEXT" });
    assert.equal(state.completed, true);
    assert.equal(state.active, false);
    assert.deepEqual(tourReducer(state, { type: "RESTART" }), initialTourState);
    assert.equal(routeMatches("clients", "/clients"), true);
    assert.equal(routeMatches("clients", "/builds"), false);
    assert.equal(routeMatches("template", "/proposals/demo/template"), true);
    assert.equal(routeMatches("contract", "/contracts/demo"), true);
  });
  it("hydrates a valid active mid-tour state and rejects invalid storage", () => {
    const saved = { step: "template", active: true, completed: false, dismissed: false, paused: true } as const;
    assert.deepEqual(tourReducer(initialTourState, { type: "HYDRATE", state: hydrateTourState(saved)! }), saved);
    assert.equal(hydrateTourState({ step: "unknown", active: true }), null);
    assert.equal(hydrateTourState({ step: "template", active: "yes", completed: false, dismissed: false, paused: false }), null);
  });
  it("starts at the reference desktop position and keeps dragged positions on screen", () => {
    assert.deepEqual(
      defaultTourPanelPosition({ width: 2525, height: 1305 }),
      { x: 631, y: 313 },
    );
    assert.deepEqual(
      defaultTourPanelPosition({ width: 390, height: 844 }),
      { x: 16, y: 80 },
    );
    assert.deepEqual(
      clampTourPanelPosition(
        { x: 1400, y: -100 },
        { width: 1440, height: 900 },
        { width: 384, height: 240 },
      ),
      { x: 1040, y: 16 },
    );
    assert.deepEqual(hydrateTourPanelPosition({ x: 360, y: 120 }), {
      x: 360,
      y: 120,
    });
    assert.equal(hydrateTourPanelPosition({ x: "360", y: 120 }), null);
  });
});
