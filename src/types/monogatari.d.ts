declare module "@monogatari/core/src/actions/Function.js" {
  /** Deliberately narrow: the verified 2.6.0 function-action application cycle. */
  export default class MonogatariFunction {
    static engine: {
      global(key: string, value: unknown): void;
      state(key: string): string;
    };
    constructor(statement: {
      Function: { Apply: () => boolean; Revert: () => boolean };
    });
    willApply(): Promise<void>;
    apply(): Promise<void>;
    didApply(): Promise<{ advance: boolean }>;
  }
}
