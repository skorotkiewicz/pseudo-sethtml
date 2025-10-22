/**
 * Configuration options for HTML sanitization
 * Compatible with native SanitizerConfig API
 */
export interface SanitizerConfig {
  /** Allowed HTML elements (MDN compatible) */
  elements?: string[];
  /** Disallowed HTML elements (MDN compatible) */
  removeElements?: string[];
  /** Allowed HTML elements (legacy support) */
  allowedElements?: string[];
  /** Disallowed HTML elements (legacy support) */
  disallowedElements?: string[];
  /** Allowed HTML attributes */
  allowedAttributes?: string[];
  /** Disallowed HTML attributes */
  disallowedAttributes?: string[];
  /** Allowed protocols for URLs */
  allowedProtocols?: string[];
  /** Whether to allow data URLs */
  allowDataUrls?: boolean;
  /** Whether to strip comments */
  stripComments?: boolean;
  /** Whether to strip DOCTYPE declarations */
  stripDoctype?: boolean;
}

/**
 * Default sanitizer configuration
 * Compatible with native Sanitizer API
 */
export const DEFAULT_SANITIZER_CONFIG: SanitizerConfig = {
  elements: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "b",
    "i",
    "span",
    "div",
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
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  removeElements: [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "textarea",
    "button",
    "select",
    "option",
  ],
  // Legacy support
  allowedElements: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "b",
    "i",
    "span",
    "div",
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
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  disallowedElements: [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "textarea",
    "button",
    "select",
    "option",
  ],
  allowedAttributes: [
    "href",
    "src",
    "alt",
    "title",
    "class",
    "id",
    "style",
    "width",
    "height",
    "colspan",
    "rowspan",
    "target",
  ],
  disallowedAttributes: [
    "onclick",
    "onload",
    "onerror",
    "onmouseover",
    "onmouseout",
    "onfocus",
    "onblur",
    "onchange",
    "onsubmit",
  ],
  allowedProtocols: ["http:", "https:", "mailto:", "tel:"],
  allowDataUrls: false,
  stripComments: true,
  stripDoctype: true,
};

/**
 * HTML Sanitizer class
 */
export class Sanitizer {
  private config: SanitizerConfig;

  constructor(config: SanitizerConfig = DEFAULT_SANITIZER_CONFIG) {
    this.config = { ...DEFAULT_SANITIZER_CONFIG };
    this.normalizeConfig();
    // Apply user config after normalization, but preserve user's disallowedElements and removeElements
    const userDisallowedElements = config.disallowedElements;
    const userRemoveElements = config.removeElements;
    this.config = { ...this.config, ...config };
    if (userDisallowedElements) {
      this.config.disallowedElements = userDisallowedElements;
    }
    if (userRemoveElements) {
      this.config.disallowedElements = userRemoveElements;
    }
  }

  /**
   * Normalize configuration to support both MDN-compatible and legacy formats
   */
  private normalizeConfig(): void {
    // Support MDN-compatible format
    if (this.config.elements) {
      this.config.allowedElements = this.config.elements;
    }
    if (this.config.removeElements) {
      this.config.disallowedElements = this.config.removeElements;
    }

    // If user provided disallowedElements directly, use it
    if (this.config.disallowedElements && this.config.disallowedElements.length > 0) {
      // Keep user's disallowedElements
    }
  }

  /**
   * Sanitize HTML string
   */
  sanitize(html: string): string {
    if (!html || typeof html !== "string") {
      return "";
    }

    let sanitized = html;

    // Strip DOCTYPE if configured
    if (this.config.stripDoctype) {
      sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, "");
    }

    // Strip comments if configured
    if (this.config.stripComments) {
      sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, "");
    }

    // Remove disallowed elements (including content)
    if (this.config.disallowedElements) {
      this.config.disallowedElements.forEach((tag) => {
        // Remove opening and closing tags with content
        const regex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
        sanitized = sanitized.replace(regex, "");
        // Remove self-closing tags
        const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
        sanitized = sanitized.replace(selfClosingRegex, "");
      });
    }

    // Remove disallowed attributes
    if (this.config.disallowedAttributes) {
      this.config.disallowedAttributes.forEach((attr) => {
        // Match attribute with single quotes
        const singleQuoteRegex = new RegExp(`\\s+${attr}\\s*=\\s*'[^']*'`, "gi");
        sanitized = sanitized.replace(singleQuoteRegex, "");
        // Match attribute with double quotes
        const doubleQuoteRegex = new RegExp(`\\s+${attr}\\s*=\\s*"[^"]*"`, "gi");
        sanitized = sanitized.replace(doubleQuoteRegex, "");
      });
    }

    // Validate URLs in href and src attributes
    sanitized = this.sanitizeUrls(sanitized);

    // Clean up any empty tags
    sanitized = this.cleanupEmptyTags(sanitized);

    return sanitized.trim();
  }

  /**
   * Sanitize URLs in href and src attributes
   */
  private sanitizeUrls(html: string): string {
    // Handle single quotes
    html = html.replace(/(href|src)\s*=\s*'([^']+)'/gi, (match, attr, url) => {
      try {
        const urlObj = new URL(url);

        // Check if protocol is allowed
        if (
          this.config.allowedProtocols &&
          !this.config.allowedProtocols.includes(urlObj.protocol)
        ) {
          return `${attr}="#"`;
        }

        // Check data URLs
        if (urlObj.protocol === "data:" && !this.config.allowDataUrls) {
          return `${attr}="#"`;
        }

        return match;
      } catch {
        // Invalid URL, replace with safe default
        return `${attr}="#"`;
      }
    });

    // Handle double quotes
    html = html.replace(/(href|src)\s*=\s*"([^"]+)"/gi, (match, attr, url) => {
      try {
        const urlObj = new URL(url);

        // Check if protocol is allowed
        if (
          this.config.allowedProtocols &&
          !this.config.allowedProtocols.includes(urlObj.protocol)
        ) {
          return `${attr}="#"`;
        }

        // Check data URLs
        if (urlObj.protocol === "data:" && !this.config.allowDataUrls) {
          return `${attr}="#"`;
        }

        return match;
      } catch {
        // Invalid URL, replace with safe default
        return `${attr}="#"`;
      }
    });

    return html;
  }

  /**
   * Clean up empty tags
   */
  private cleanupEmptyTags(html: string): string {
    // Remove empty tags
    html = html.replace(/<(\w+)[^>]*>\s*<\/\1>/gi, "");

    // Remove tags with only whitespace
    html = html.replace(/<(\w+)[^>]*>\s+<\/\1>/gi, "");

    return html;
  }

  /**
   * Check if an element is allowed
   */
  isElementAllowed(tagName: string): boolean {
    if (this.config.disallowedElements?.includes(tagName.toLowerCase())) {
      return false;
    }

    if (this.config.allowedElements) {
      return this.config.allowedElements.includes(tagName.toLowerCase());
    }

    return true;
  }

  /**
   * Check if an attribute is allowed
   */
  isAttributeAllowed(attributeName: string): boolean {
    if (this.config.disallowedAttributes?.includes(attributeName.toLowerCase())) {
      return false;
    }

    if (this.config.allowedAttributes) {
      return this.config.allowedAttributes.includes(attributeName.toLowerCase());
    }

    return true;
  }

  /**
   * Remove unsafe elements and attributes (MDN compatible)
   * This method always removes XSS-unsafe content regardless of configuration
   */
  removeUnsafe(html: string): string {
    let sanitized = html;

    // Always remove script tags and dangerous attributes
    const unsafeElements = ["script", "style", "iframe", "object", "embed"];
    const unsafeAttributes = [
      "onclick",
      "onload",
      "onerror",
      "onmouseover",
      "onmouseout",
      "onfocus",
      "onblur",
      "onchange",
      "onsubmit",
      "onkeydown",
      "onkeyup",
    ];

    // Remove unsafe elements (including content)
    unsafeElements.forEach((tag) => {
      // Remove opening and closing tags with content
      const regex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
      sanitized = sanitized.replace(regex, "");
      // Remove self-closing tags
      const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
      sanitized = sanitized.replace(selfClosingRegex, "");
    });

    // Remove unsafe attributes
    unsafeAttributes.forEach((attr) => {
      // Match attribute with single quotes
      const singleQuoteRegex = new RegExp(`\\s+${attr}\\s*=\\s*'[^']*'`, "gi");
      sanitized = sanitized.replace(singleQuoteRegex, "");
      // Match attribute with double quotes
      const doubleQuoteRegex = new RegExp(`\\s+${attr}\\s*=\\s*"[^"]*"`, "gi");
      sanitized = sanitized.replace(doubleQuoteRegex, "");
    });

    // Sanitize dangerous URLs
    sanitized = sanitized.replace(/(href|src)\s*=\s*["']javascript:[^"']*["']/gi, '$1="#"');
    sanitized = sanitized.replace(/(href|src)\s*=\s*["']data:[^"']*["']/gi, '$1="#"');

    return sanitized.trim();
  }
}

/**
 * Create a new sanitizer instance
 */
export function createSanitizer(config?: SanitizerConfig): Sanitizer {
  return new Sanitizer(config);
}

/**
 * Sanitize HTML string with default configuration
 */
export function sanitizeHTML(html: string, config?: SanitizerConfig): string {
  const sanitizer = new Sanitizer(config);
  return sanitizer.sanitize(html);
}

/**
 * Options for setHTML method (MDN compatible)
 */
export interface SetHTMLOptions {
  sanitizer?: Sanitizer | SanitizerConfig | "default";
}

/**
 * Set HTML content safely (MDN compatible API)
 * This method provides XSS-safe HTML insertion similar to native Element.setHTML()
 */
export function setHTML(element: HTMLElement, input: string, options?: SetHTMLOptions): void {
  if (!element || typeof input !== "string") {
    return;
  }

  let sanitizer: Sanitizer;

  if (options?.sanitizer === "default" || !options?.sanitizer) {
    sanitizer = new Sanitizer();
  } else if (options.sanitizer instanceof Sanitizer) {
    sanitizer = options.sanitizer;
  } else {
    sanitizer = new Sanitizer(options.sanitizer);
  }

  // Always apply removeUnsafe() as per MDN spec
  const sanitizedHTML = sanitizer.removeUnsafe(input);

  element.innerHTML = sanitizedHTML;
}

/**
 * Set HTML content unsafely (MDN compatible API)
 * This method allows potentially unsafe content - use with extreme caution
 */
export function setHTMLUnsafe(element: HTMLElement, input: string, options?: SetHTMLOptions): void {
  if (!element || typeof input !== "string") {
    return;
  }

  let sanitizer: Sanitizer;

  if (options?.sanitizer === "default" || !options?.sanitizer) {
    sanitizer = new Sanitizer();
  } else if (options.sanitizer instanceof Sanitizer) {
    sanitizer = options.sanitizer;
  } else {
    sanitizer = new Sanitizer(options.sanitizer);
  }

  // Apply only basic sanitization, allowing more content
  const sanitizedHTML = sanitizer.sanitize(input);

  element.innerHTML = sanitizedHTML;
}
