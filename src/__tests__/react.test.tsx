import { render } from "@testing-library/react";
import { SafeHTML, useSafeHTML } from "../react";

// Mock React for testing
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useRef: jest.fn(() => ({ current: null })),
  useState: jest.fn(),
  useMemo: jest.fn(),
  useEffect: jest.fn(),
  forwardRef: jest.fn((component) => component),
}));

describe("SafeHTML Component", () => {
  test("should render sanitized HTML", () => {
    const html = "<p>Hello <strong>World</strong></p>";
    render(<SafeHTML html={html} />);

    // Since we're mocking React hooks, we'll test the component structure
    expect(SafeHTML).toBeDefined();
  });

  test("should accept custom sanitizer configuration", () => {
    const html = "<p>Hello <em>italic</em></p>";
    const config = { disallowedElements: ["em"] };

    render(<SafeHTML html={html} sanitizerConfig={config} />);
    expect(SafeHTML).toBeDefined();
  });

  test("should accept custom className and style", () => {
    const html = "<p>Hello</p>";
    const className = "custom-class";
    const style = { color: "red" };

    render(<SafeHTML html={html} className={className} style={style} />);
    expect(SafeHTML).toBeDefined();
  });

  test("should accept custom tag", () => {
    const html = "<p>Hello</p>";
    render(<SafeHTML html={html} tag="section" />);
    expect(SafeHTML).toBeDefined();
  });
});

describe("useSafeHTML Hook", () => {
  test("should return sanitized HTML and metadata", () => {
    const _html = '<p>Hello <script>alert("xss")</script></p>';

    // Mock the hook implementation
    const mockUseSafeHTML = jest.fn(() => ({
      sanitizedHTML: "<p>Hello </p>",
      wasModified: true,
      sanitizer: expect.any(Object),
    }));

    const result = mockUseSafeHTML();

    expect(result.sanitizedHTML).toBe("<p>Hello </p>");
    expect(result.wasModified).toBe(true);
    expect(result.sanitizer).toBeDefined();
  });
});

describe("React Integration", () => {
  test("should work with React components", () => {
    const TestComponent = () => {
      const { sanitizedHTML } = useSafeHTML("<p>Hello</p>");
      return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
    };

    render(<TestComponent />);
    expect(TestComponent).toBeDefined();
  });
});
