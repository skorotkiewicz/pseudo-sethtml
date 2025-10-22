// Jest setup file
import "@testing-library/jest-dom";

// Mock React for testing
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useRef: jest.fn(() => ({ current: null })),
  useState: jest.fn(),
  useMemo: jest.fn(),
  useEffect: jest.fn(),
  forwardRef: jest.fn((component) => component),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
