import { logger } from "../shared/logger";

describe("logger", () => {
  const originalEnv = process.env;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.LOG_LEVEL;

    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("JSON formatting and console output", () => {
    test("formats log message cleanly without metadata", () => {
      logger.info("Test log message");

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(output).toMatchObject({
        level: "info",
        message: "Test log message",
      });
      expect(typeof output.timestamp).toBe("string");
      expect(new Date(output.timestamp).toISOString()).toBe(output.timestamp);
    });

    test("formats log message with metadata", () => {
      const meta = { userId: "123", action: "login", success: true };
      logger.warn("User warning", meta);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(output).toMatchObject({
        level: "warn",
        message: "User warning",
        userId: "123",
        action: "login",
        success: true,
      });
    });

    test("calls console.debug for debug log level", () => {
      process.env.LOG_LEVEL = "debug";
      logger.debug("Debug message", { detail: "info" });

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleDebugSpy.mock.calls[0][0]);
      expect(output.level).toBe("debug");
      expect(output.message).toBe("Debug message");
      expect(output.detail).toBe("info");
    });

    test("calls console.error for error log level", () => {
      logger.error("Error message", { errCode: 500 });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.level).toBe("error");
      expect(output.message).toBe("Error message");
      expect(output.errCode).toBe(500);
    });
  });

  describe("log level threshold filtering", () => {
    test("LOG_LEVEL=debug logs all levels", () => {
      process.env.LOG_LEVEL = "debug";

      logger.debug("debug msg");
      logger.info("info msg");
      logger.warn("warn msg");
      logger.error("error msg");

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    test("LOG_LEVEL=info suppresses debug but logs info, warn, error", () => {
      process.env.LOG_LEVEL = "info";

      logger.debug("debug msg");
      logger.info("info msg");
      logger.warn("warn msg");
      logger.error("error msg");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    test("LOG_LEVEL=warn suppresses debug and info, logs warn and error", () => {
      process.env.LOG_LEVEL = "warn";

      logger.debug("debug msg");
      logger.info("info msg");
      logger.warn("warn msg");
      logger.error("error msg");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    test("LOG_LEVEL=error suppresses debug, info, warn and logs error only", () => {
      process.env.LOG_LEVEL = "error";

      logger.debug("debug msg");
      logger.info("info msg");
      logger.warn("warn msg");
      logger.error("error msg");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("environment default and fallback handling", () => {
    test('defaults to "debug" in development (non-production) when LOG_LEVEL is unset', () => {
      delete process.env.LOG_LEVEL;
      process.env.NODE_ENV = "development";

      logger.debug("dev debug log");
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    });

    test('defaults to "info" in production when LOG_LEVEL is unset', () => {
      delete process.env.LOG_LEVEL;
      process.env.NODE_ENV = "production";

      logger.debug("prod debug log");
      logger.info("prod info log");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    test("falls back to environment default when LOG_LEVEL has invalid value", () => {
      process.env.LOG_LEVEL = "invalid_level" as any;
      process.env.NODE_ENV = "development";

      logger.debug("fallback debug log");
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    });
  });
});
