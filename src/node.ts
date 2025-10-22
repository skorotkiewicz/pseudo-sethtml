import type { NextFunction, Request, Response } from "express";
import { Sanitizer, type SanitizerConfig, type SetHTMLOptions } from "./sanitizer";

/**
 * Node.js specific HTML processing utilities
 */
export class NodeHTMLProcessor {
  private sanitizer: Sanitizer;

  constructor(sanitizerConfig?: SanitizerConfig) {
    this.sanitizer = new Sanitizer(sanitizerConfig);
  }

  /**
   * Process HTML string for server-side rendering
   */
  processHTML(html: string): string {
    return this.sanitizer.sanitize(html);
  }

  /**
   * Process HTML and return metadata about the sanitization
   */
  processHTMLWithMetadata(html: string): {
    sanitizedHTML: string;
    wasModified: boolean;
    removedElements: string[];
    removedAttributes: string[];
  } {
    const originalHTML = html;
    const sanitizedHTML = this.sanitizer.sanitize(html);
    const wasModified = sanitizedHTML !== originalHTML;

    // Extract information about what was removed
    const removedElements = this.extractRemovedElements(originalHTML, sanitizedHTML);
    const removedAttributes = this.extractRemovedAttributes(originalHTML, sanitizedHTML);

    return {
      sanitizedHTML,
      wasModified,
      removedElements,
      removedAttributes,
    };
  }

  /**
   * Extract elements that were removed during sanitization
   */
  private extractRemovedElements(original: string, sanitized: string): string[] {
    const removed: string[] = [];

    if ((this.sanitizer as any).config.disallowedElements) {
      (this.sanitizer as any).config.disallowedElements.forEach((tag: string) => {
        const regex = new RegExp(`<\\/?${tag}[^>]*>`, "gi");
        if (regex.test(original) && !regex.test(sanitized)) {
          removed.push(tag);
        }
      });
    }

    return removed;
  }

  /**
   * Extract attributes that were removed during sanitization
   */
  private extractRemovedAttributes(original: string, sanitized: string): string[] {
    const removed: string[] = [];

    if ((this.sanitizer as any).config.disallowedAttributes) {
      (this.sanitizer as any).config.disallowedAttributes.forEach((attr: string) => {
        const regex = new RegExp(`\\s+${attr}\\s*=\\s*["'][^"']*["']`, "gi");
        if (regex.test(original) && !regex.test(sanitized)) {
          removed.push(attr);
        }
      });
    }

    return removed;
  }

  /**
   * Validate HTML structure
   */
  validateHTMLStructure(html: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for unclosed tags
    const tagRegex = /<(\w+)[^>]*>/g;
    const closingTagRegex = /<\/(\w+)>/g;
    const openTags: string[] = [];
    const closeTags: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(html)) !== null) {
      const tagName = match[1].toLowerCase();
      if (!this.isSelfClosingTag(tagName)) {
        openTags.push(tagName);
      }
    }

    while ((match = closingTagRegex.exec(html)) !== null) {
      closeTags.push(match[1].toLowerCase());
    }

    // Check for mismatched tags
    const stack: string[] = [];
    for (const tag of openTags) {
      if (this.isSelfClosingTag(tag)) continue;
      stack.push(tag);
    }

    for (const tag of closeTags) {
      if (stack.length === 0) {
        errors.push(`Closing tag '${tag}' without matching opening tag`);
      } else {
        const lastTag = stack.pop();
        if (lastTag !== tag) {
          errors.push(`Mismatched tags: expected '${lastTag}', found '${tag}'`);
        }
      }
    }

    // Check for unclosed tags
    if (stack.length > 0) {
      warnings.push(`Unclosed tags: ${stack.join(", ")}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if a tag is self-closing
   */
  private isSelfClosingTag(tagName: string): boolean {
    const selfClosingTags = [
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ];
    return selfClosingTags.includes(tagName.toLowerCase());
  }
}

/**
 * Express.js middleware for HTML sanitization
 */
export function createSanitizationMiddleware(sanitizerConfig?: SanitizerConfig) {
  const processor = new NodeHTMLProcessor(sanitizerConfig);

  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data: any) {
      if (typeof data === "string" && req.headers["content-type"]?.includes("text/html")) {
        data = processor.processHTML(data);
      }
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Utility function for server-side HTML processing
 */
export function processServerHTML(html: string, sanitizerConfig?: SanitizerConfig): string {
  const processor = new NodeHTMLProcessor(sanitizerConfig);
  return processor.processHTML(html);
}

/**
 * Utility function for processing HTML with detailed metadata
 */
export function processServerHTMLWithMetadata(
  html: string,
  sanitizerConfig?: SanitizerConfig
): {
  sanitizedHTML: string;
  wasModified: boolean;
  removedElements: string[];
  removedAttributes: string[];
} {
  const processor = new NodeHTMLProcessor(sanitizerConfig);
  return processor.processHTMLWithMetadata(html);
}

/**
 * Utility function for validating HTML structure
 */
export function validateHTML(
  html: string,
  sanitizerConfig?: SanitizerConfig
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const processor = new NodeHTMLProcessor(sanitizerConfig);
  return processor.validateHTMLStructure(html);
}

/**
 * ShadowRoot-like interface for server-side HTML processing
 * Provides setHTML() and setHTMLUnsafe() methods compatible with native ShadowRoot API
 */
export class ShadowRootProcessor {
  private content: string = "";
  private sanitizer: Sanitizer;

  constructor(sanitizerConfig?: SanitizerConfig) {
    this.sanitizer = new Sanitizer(sanitizerConfig);
  }

  /**
   * Set HTML content safely (ShadowRoot.setHTML() compatible)
   */
  setHTML(input: string, options?: SetHTMLOptions): void {
    if (typeof input !== "string") {
      return;
    }

    let sanitizer: Sanitizer;

    if (options?.sanitizer === "default" || !options?.sanitizer) {
      sanitizer = this.sanitizer;
    } else if (options.sanitizer instanceof Sanitizer) {
      sanitizer = options.sanitizer;
    } else {
      sanitizer = new Sanitizer(options.sanitizer);
    }

    // Always apply removeUnsafe() as per MDN spec
    this.content = sanitizer.removeUnsafe(input);
  }

  /**
   * Set HTML content unsafely (ShadowRoot.setHTMLUnsafe() compatible)
   */
  setHTMLUnsafe(input: string, options?: SetHTMLOptions): void {
    if (typeof input !== "string") {
      return;
    }

    let sanitizer: Sanitizer;

    if (options?.sanitizer === "default" || !options?.sanitizer) {
      sanitizer = this.sanitizer;
    } else if (options.sanitizer instanceof Sanitizer) {
      sanitizer = options.sanitizer;
    } else {
      sanitizer = new Sanitizer(options.sanitizer);
    }

    // Apply only basic sanitization, allowing more content
    this.content = sanitizer.sanitize(input);
  }

  /**
   * Get current HTML content
   */
  getHTML(): string {
    return this.content;
  }

  /**
   * Clear content
   */
  clear(): void {
    this.content = "";
  }
}
