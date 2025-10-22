import React from "react";
import { SafeHTML, useSafeHTML, withSafeHTML } from "../src/react";
import { Sanitizer, sanitizeHTML, setHTML } from "../src/sanitizer";

// Example usage of the SafeHTML component
export const ExampleComponent: React.FC = () => {
  const dangerousHTML = '<p>Hello <strong>World</strong> <script>alert("xss")</script></p>';

  return (
    <div>
      <h2>Safe HTML Rendering Examples</h2>

      {/* Basic usage */}
      <SafeHTML html={dangerousHTML} />

      {/* With custom configuration */}
      <SafeHTML
        html={dangerousHTML}
        sanitizerConfig={{
          allowedElements: ["p", "strong", "em"],
          disallowedElements: ["script", "style"],
        }}
        className="safe-content"
        showSanitizationWarning={true}
      />

      {/* Using hook */}
      <HookExample html={dangerousHTML} />

      {/* Using HOC */}
      <SafeDiv html={dangerousHTML} />
    </div>
  );
};

// Example using the hook
const HookExample: React.FC<{ html: string }> = ({ html }) => {
  const { sanitizedHTML, wasModified } = useSafeHTML(html);

  return (
    <div>
      <h3>Hook Example</h3>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: This is a demo example showing sanitized HTML */}
      <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
      {wasModified && <p style={{ color: "orange" }}>⚠️ Content was sanitized</p>}
    </div>
  );
};

// Example using HOC
const SafeDiv = withSafeHTML("div");

// Example with custom sanitizer
export const CustomSanitizerExample: React.FC = () => {
  const customSanitizer = new Sanitizer({
    allowedElements: ["p", "br", "strong"],
    disallowedElements: ["script", "style", "iframe"],
    allowedAttributes: ["class", "id"],
    stripComments: true,
  });

  const html = '<p class="text">Hello <strong>World</strong> <!-- comment --></p>';

  return <SafeHTML html={html} sanitizer={customSanitizer} className="custom-sanitized" />;
};

// Example for server-side rendering
export const ServerSideExample = () => {
  const html = '<p>Hello <script>alert("xss")</script> World</p>';
  const sanitized = sanitizeHTML(html);

  return (
    <div>
      <h3>Server-side Sanitization</h3>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: This is a demo example showing sanitized HTML */}
      <div dangerouslySetInnerHTML={{ __html: sanitized }} />
    </div>
  );
};

// Example using native setHTML API
export const NativeSetHTMLExample: React.FC = () => {
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (elementRef.current) {
      const dangerousHTML = '<p>Hello <script>alert("xss")</script> World</p>';

      // Using setHTML (safe)
      setHTML(elementRef.current, dangerousHTML);

      // Or using setHTMLUnsafe (less safe)
      // setHTMLUnsafe(elementRef.current, dangerousHTML);
    }
  }, []);

  return (
    <div>
      <h3>Native setHTML API</h3>
      <div ref={elementRef} />
    </div>
  );
};

// Example with MDN-compatible configuration
export const MDNCompatibleExample: React.FC = () => {
  const { sanitizedHTML } = useSafeHTML("<p>Hello <strong>bold</strong> <em>italic</em></p>", {
    elements: ["p", "strong"], // MDN-compatible format
    removeElements: ["em"], // MDN-compatible format
  });

  return (
    <div>
      <h3>MDN-Compatible Configuration</h3>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: This is a demo example showing sanitized HTML */}
      <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
    </div>
  );
};
