import { chooseStoryResponse } from "./story-domain";
import type { StoryState } from "./types";

/** Only Monogatari's original function-action cycle is integrated. Its menus,
 * keyboard manager, storage, timers and service workers are not in this bundle.
 * React renders the novel; the server independently replays the pure domain.
 */
export async function createNovelRuntime() {
  const source = "/vendor/monogatari/function-action-2.6.0.mjs";
  const { default: MonogatariFunction } = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ source
  )) as typeof import("@monogatari/core/src/actions/Function.js");
  class VgFunctionAction extends MonogatariFunction {
    static override engine = {
      global() {
        /* The headless adapter has no global playback state. */
      },
      state() {
        return "V&G relationship story";
      },
    };
  }
  let disposed = false;
  return {
    async choose(state: StoryState, choiceId: string) {
      if (disposed) throw new Error("This story session has closed.");
      const outcome: { result?: ReturnType<typeof chooseStoryResponse> } = {};
      let failure: unknown;
      const action = new VgFunctionAction({
        Function: {
          Apply: () => {
            if (!disposed) {
              try {
                outcome.result = chooseStoryResponse(state, choiceId);
              } catch (error) {
                failure = error;
              }
            }
            return false;
          },
          Revert: () => false,
        },
      });
      await action.willApply();
      await action.apply();
      await action.didApply();
      if (failure) throw failure;
      if (!outcome.result || disposed)
        throw new Error("This story session has closed.");
      return outcome.result;
    },
    dispose() {
      disposed = true;
    },
  };
}
