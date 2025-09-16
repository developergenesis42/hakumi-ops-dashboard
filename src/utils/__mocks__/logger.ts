// Mock logger for tests
export const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
};

export default logger;
