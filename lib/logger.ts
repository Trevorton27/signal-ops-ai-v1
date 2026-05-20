type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  [key: string]: unknown;
}

function log(level: LogLevel, service: string, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...meta,
  };
  const output = JSON.stringify(entry);
  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export function createLogger(service: string) {
  return {
    debug: (message: string, meta?: Record<string, unknown>) => log("debug", service, message, meta),
    info: (message: string, meta?: Record<string, unknown>) => log("info", service, message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => log("warn", service, message, meta),
    error: (message: string, meta?: Record<string, unknown>) => log("error", service, message, meta),
  };
}
