import {
  createSanitizationMiddleware,
  NodeHTMLProcessor,
  processServerHTML,
  processServerHTMLWithMetadata,
  ShadowRootProcessor,
  validateHTML,
} from "../src/node";
import { setHTML, setHTMLUnsafe } from "../src/sanitizer";

// Example 1: Basic server-side HTML processing
export function basicServerExample() {
  const dangerousHTML = '<p>Hello <script>alert("xss")</script> World</p>';

  // Simple sanitization
  const sanitized = processServerHTML(dangerousHTML);
  console.log("Sanitized HTML:", sanitized);

  // With metadata
  const result = processServerHTMLWithMetadata(dangerousHTML);
  console.log("Result:", result);
}

// Example 2: Custom sanitizer configuration (MDN-compatible)
export function customSanitizerExample() {
  const html = "<p>Hello <em>italic</em> <strong>bold</strong></p>";

  // MDN-compatible configuration
  const mdnConfig = {
    elements: ["p", "strong"],
    removeElements: ["em", "script"],
  };

  // Legacy configuration (still supported)
  const _legacyConfig = {
    allowedElements: ["p", "strong"],
    disallowedElements: ["em", "script"],
    allowedAttributes: ["class"],
  };

  const processor = new NodeHTMLProcessor(mdnConfig);
  const sanitized = processor.processHTML(html);

  console.log("MDN-compatible sanitized:", sanitized);
}

// Example 3: HTML validation
export function htmlValidationExample() {
  const validHTML = "<p>Hello <strong>World</strong></p>";
  const invalidHTML = "<p>Hello <strong>World</p>"; // Missing closing tag

  const validResult = validateHTML(validHTML);
  const invalidResult = validateHTML(invalidHTML);

  console.log("Valid HTML result:", validResult);
  console.log("Invalid HTML result:", invalidResult);
}

// Example 4: Express.js middleware usage
export function expressMiddlewareExample() {
  // This would be used in an Express.js app
  const app = require("express")();

  // Create middleware with custom configuration
  const sanitizationMiddleware = createSanitizationMiddleware({
    allowedElements: ["p", "div", "span", "strong", "em"],
    disallowedElements: ["script", "style", "iframe"],
    allowedAttributes: ["class", "id", "href", "src"],
    stripComments: true,
  });

  // Apply middleware
  app.use(sanitizationMiddleware);

  app.get("/", (_req: unknown, res: { send: (data: string) => void }) => {
    const html = '<p>Hello <script>alert("xss")</script> World</p>';
    res.send(html); // Will be automatically sanitized
  });

  return app;
}

// Example 5: Batch processing
export function batchProcessingExample() {
  const htmlStrings = [
    "<p>Safe content</p>",
    '<p>Content with <script>alert("xss")</script></p>',
    "<div onclick=\"alert('xss')\">Click me</div>",
    "<a href=\"javascript:alert('xss')\">Dangerous link</a>",
  ];

  const processor = new NodeHTMLProcessor();

  const results = htmlStrings.map((html) => ({
    original: html,
    sanitized: processor.processHTML(html),
    metadata: processor.processHTMLWithMetadata(html),
  }));

  console.log("Batch processing results:", results);
  return results;
}

// Example 6: Content management system integration
export class ContentManager {
  private processor: NodeHTMLProcessor;

  constructor() {
    this.processor = new NodeHTMLProcessor({
      allowedElements: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "pre",
        "code",
        "a",
        "img",
      ],
      allowedAttributes: ["href", "src", "alt", "title", "class", "id"],
      allowedProtocols: ["http:", "https:", "mailto:"],
      stripComments: true,
    });
  }

  processContent(content: string): {
    sanitizedContent: string;
    wasModified: boolean;
    removedElements: string[];
    removedAttributes: string[];
  } {
    return this.processor.processHTMLWithMetadata(content);
  }

  validateContent(content: string): boolean {
    const validation = this.processor.validateHTMLStructure(content);
    return validation.isValid;
  }
}

// Example usage of ContentManager
export function contentManagerExample() {
  const manager = new ContentManager();

  const userContent = `
    <h2>My Blog Post</h2>
    <p>This is my content with <strong>bold text</strong>.</p>
    <script>alert("malicious code")</script>
    <p>More content here.</p>
  `;

  const result = manager.processContent(userContent);
  console.log("Processed content:", result);

  const isValid = manager.validateContent(result.sanitizedContent);
  console.log("Is valid HTML:", isValid);

  return result;
}

// Example 7: ShadowRoot-like processing
export function shadowRootExample() {
  const shadowRoot = new ShadowRootProcessor({
    elements: ["p", "strong", "em"],
    removeElements: ["script"],
  });

  const html = '<p>Hello <strong>World</strong> <script>alert("xss")</script></p>';

  // Safe processing
  shadowRoot.setHTML(html);
  console.log("Safe ShadowRoot content:", shadowRoot.getHTML());

  // Unsafe processing (allows more content)
  shadowRoot.setHTMLUnsafe("<p>Hello <em>italic</em></p>");
  console.log("Unsafe ShadowRoot content:", shadowRoot.getHTML());

  return shadowRoot;
}

// Example 8: Native setHTML API usage
export function nativeSetHTMLExample() {
  // Mock HTMLElement for demonstration
  const mockElement = {
    innerHTML: "",
  } as HTMLElement;

  const dangerousHTML = '<p>Hello <script>alert("xss")</script> World</p>';

  // Safe setHTML
  setHTML(mockElement, dangerousHTML);
  console.log("Safe setHTML result:", mockElement.innerHTML);

  // Unsafe setHTMLUnsafe
  setHTMLUnsafe(mockElement, "<p>Hello <em>italic</em></p>");
  console.log("Unsafe setHTMLUnsafe result:", mockElement.innerHTML);

  return mockElement;
}
