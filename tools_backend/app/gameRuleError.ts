// Identifies expected game-rule failures without depending on an API transport.
export class GameRuleError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "GameRuleError";
  }
}
