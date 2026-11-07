type LogFields = Record<string, unknown>;
type LogLevel = "INFO" | "WARNING" | "ERROR";

// JSON lines preserve Python's timestamp/level/module context and keep fields searchable in Render.
export class LoggerManager {
  public constructor(private readonly module: string) {}

  public info = (message: string, fields: LogFields = {}): void => {
    this.write("INFO", message, fields);
  };

  public warn = (message: string, fields: LogFields = {}): void => {
    this.write("WARNING", message, fields);
  };

  public error = (message: string, fields: LogFields = {}): void => {
    this.write("ERROR", message, fields);
  };

  private write = (level: LogLevel, message: string, fields: LogFields): void => {
    const seen = new WeakSet<object>();
    const line = JSON.stringify(
      { ...fields, timestamp: new Date().toISOString(), level, module: this.module, message },
      (_key, value: unknown) => {
        if (value instanceof Error) {
          return { name: value.name, message: value.message, stack: value.stack };
        }
        if (typeof value === "bigint") {
          return value.toString();
        }

        if (value && typeof value === "object") {
          if (seen.has(value)) {
            return "[Circular]";
          }

          seen.add(value);
        }

        return value;
      },
    );

    if (level === "ERROR") {
      console.error(line);
    } else if (level === "WARNING") {
      console.warn(line);
    } else {
      console.info(line);
    }
  };
}
