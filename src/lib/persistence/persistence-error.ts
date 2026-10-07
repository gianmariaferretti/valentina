import "server-only";

export class PersistenceError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PersistenceError";
  }
}

export function reportPersistenceFailure(
  operation: string,
  error: unknown,
): void {
  const detail = (error instanceof Error ? error.message : "Unknown error")
    .replace(/[\r\n]+/g, " ")
    .trim();
  process.stderr.write(`[persistence] ${operation}: ${detail}\n`);
}

export function persistenceFailureMessage(action: string): string {
  return `${action} could not be saved right now. Please try again in a moment.`;
}
