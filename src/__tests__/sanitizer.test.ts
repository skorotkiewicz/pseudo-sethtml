import { NodeHTMLProcessor, processServerHTML, ShadowRootProcessor, validateHTML } from "../node";
import { Sanitizer, sanitizeHTML, setHTML, setHTMLUnsafe } from "../sanitizer";

describe("Sanitizer", () => {
  let sanitizer: Sanitizer;

  beforeEach(() => {
    sanitizer = new Sanitizer();
  });

  test("should remove script tags", () => {
    const html = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    const result = sanitizer.sanitize(html);
    expect(result).toBe("<p>Hello</p><p>World</p>");
  });

  test("should remove dangerous attributes", () => {
    const html = '<div onclick="alert(\'xss\')" class="safe">Content</div>';
    const result = sanitizer.sanitize(html);
    expect(result).toBe('<div class="safe">Content</div>');
  });

  test("should sanitize URLs", () => {
    const html = "<a href=\"javascript:alert('xss')\">Link</a>";
    const result = sanitizer.sanitize(html);
    expect(result).toBe('<a href="#">Link</a>');
  });

  test("should allow safe URLs", () => {
    const html = '<a href="https://example.com">Safe Link</a>';
    const result = sanitizer.sanitize(html);
    expect(result).toBe('<a href="https://example.com">Safe Link</a>');
  });

  test("should remove comments", () => {
    const html = "<p>Hello</p><!-- comment --><p>World</p>";
    const result = sanitizer.sanitize(html);
    expect(result).toBe("<p>Hello</p><p>World</p>");
  });

  test("should handle empty input", () => {
    expect(sanitizer.sanitize("")).toBe("");
    expect(sanitizer.sanitize(null as unknown as string)).toBe("");
    expect(sanitizer.sanitize(undefined as unknown as string)).toBe("");
  });

  test("should work with custom configuration", () => {
    const customConfig = {
      allowedElements: ["p", "strong"],
      disallowedElements: ["em"],
    };
    const customSanitizer = new Sanitizer(customConfig);
    const html = "<p>Hello <strong>bold</strong> <em>italic</em></p>";
    const result = customSanitizer.sanitize(html);
    expect(result).toBe("<p>Hello <strong>bold</strong> </p>");
  });
});

describe("sanitizeHTML function", () => {
  test("should work as standalone function", () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHTML(html);
    expect(result).toBe("<p>Hello</p>");
  });

  test("should accept custom configuration", () => {
    const html = "<p>Hello <em>italic</em></p>";
    const result = sanitizeHTML(html, { disallowedElements: ["em"] });
    expect(result).toBe("<p>Hello </p>");
  });
});

describe("NodeHTMLProcessor", () => {
  let processor: NodeHTMLProcessor;

  beforeEach(() => {
    processor = new NodeHTMLProcessor();
  });

  test("should process HTML with metadata", () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    const result = processor.processHTMLWithMetadata(html);

    expect(result.sanitizedHTML).toBe("<p>Hello</p>");
    expect(result.wasModified).toBe(true);
    expect(result.removedElements).toContain("script");
  });

  test("should validate HTML structure", () => {
    const validHTML = "<p>Hello</p>";
    const invalidHTML = "<p>Hello</div>";

    const validResult = processor.validateHTMLStructure(validHTML);
    const invalidResult = processor.validateHTMLStructure(invalidHTML);

    expect(validResult.isValid).toBe(true);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });
});

describe("processServerHTML function", () => {
  test("should process HTML for server-side use", () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    const result = processServerHTML(html);
    expect(result).toBe("<p>Hello</p>");
  });
});

describe("validateHTML function", () => {
  test("should validate HTML structure", () => {
    const html = "<p>Hello</p>";
    const result = validateHTML(html);
    expect(result.isValid).toBe(true);
  });
});

describe("setHTML and setHTMLUnsafe functions", () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    // Mock HTMLElement
    mockElement = {
      innerHTML: "",
    } as HTMLElement;
  });

  test("setHTML should sanitize content safely", () => {
    const dangerousHTML = '<p>Hello <script>alert("xss")</script> World</p>';
    setHTML(mockElement, dangerousHTML);
    expect(mockElement.innerHTML).toBe("<p>Hello  World</p>");
  });

  test("setHTMLUnsafe should allow more content", () => {
    const html = "<p>Hello <em>italic</em></p>";
    setHTMLUnsafe(mockElement, html);
    expect(mockElement.innerHTML).toBe("<p>Hello <em>italic</em></p>");
  });

  test("setHTML should work with custom sanitizer", () => {
    const html = '<p>Hello <script>alert("xss")</script></p>';
    const customSanitizer = new Sanitizer({ elements: ["p"] });
    setHTML(mockElement, html, { sanitizer: customSanitizer });
    expect(mockElement.innerHTML).toBe("<p>Hello </p>");
  });
});

describe("MDN-compatible configuration", () => {
  test("should support elements and removeElements", () => {
    const config = {
      elements: ["p", "strong"],
      removeElements: ["em"],
    };
    const sanitizer = new Sanitizer(config);
    const html = "<p>Hello <strong>bold</strong> <em>italic</em></p>";
    const result = sanitizer.sanitize(html);
    expect(result).toBe("<p>Hello <strong>bold</strong> </p>");
  });

  test("should support legacy allowedElements and disallowedElements", () => {
    const config = {
      allowedElements: ["p", "strong"],
      disallowedElements: ["em"],
    };
    const sanitizer = new Sanitizer(config);
    const html = "<p>Hello <strong>bold</strong> <em>italic</em></p>";
    const result = sanitizer.sanitize(html);
    expect(result).toBe("<p>Hello <strong>bold</strong> </p>");
  });
});

describe("removeUnsafe method", () => {
  test("should always remove unsafe content", () => {
    const sanitizer = new Sanitizer();
    const html = '<p>Hello <script>alert("xss")</script> <div onclick="alert()">Click</div></p>';
    const result = sanitizer.removeUnsafe(html);
    expect(result).toBe("<p>Hello  <div>Click</div></p>");
  });
});

describe("ShadowRootProcessor", () => {
  let shadowRoot: ShadowRootProcessor;

  beforeEach(() => {
    shadowRoot = new ShadowRootProcessor();
  });

  test("should set HTML safely", () => {
    const html = '<p>Hello <script>alert("xss")</script> World</p>';
    shadowRoot.setHTML(html);
    expect(shadowRoot.getHTML()).toBe("<p>Hello  World</p>");
  });

  test("should set HTML unsafely", () => {
    const html = "<p>Hello <em>italic</em></p>";
    shadowRoot.setHTMLUnsafe(html);
    expect(shadowRoot.getHTML()).toBe("<p>Hello <em>italic</em></p>");
  });

  test("should clear content", () => {
    shadowRoot.setHTML("<p>Hello</p>");
    expect(shadowRoot.getHTML()).toBe("<p>Hello</p>");
    shadowRoot.clear();
    expect(shadowRoot.getHTML()).toBe("");
  });
});
