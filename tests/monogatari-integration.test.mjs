import assert from "node:assert/strict";
import test from "node:test";
import MonogatariFunction from "../public/vendor/monogatari/function-action-2.6.0.mjs";
import {
  createStoryState,
  chooseStoryResponse,
} from "../src/features/games/visual-novel/story-domain.ts";

test("the actual Monogatari action cycle executes V&G transitions without a DOM or auto-advance", async () => {
  assert.equal(typeof globalThis.window, "undefined");
  class NovelAction extends MonogatariFunction {
    static engine = {
      global() {},
      state() {
        return "V&G test";
      },
    };
  }
  const previous = createStoryState();
  let next;
  const action = new NovelAction({
    Function: {
      Apply() {
        next = chooseStoryResponse(previous, "coffee:1").state;
        return false;
      },
      Revert() {
        return false;
      },
    },
  });
  await action.willApply();
  await action.apply();
  assert.deepEqual(await action.didApply(), { advance: false });
  assert.deepEqual(next.choices, ["coffee:1"]);
  assert.ok(next.metrics.trust > previous.metrics.trust);
});
