export class RequestError extends Error {
  public constructor(
    public readonly status: number,
    public readonly detail: string | object[],
  ) {
    super(typeof detail === "string" ? detail : "Request validation failed");
  }
}
