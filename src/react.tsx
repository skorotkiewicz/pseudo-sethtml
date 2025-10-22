import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sanitizer, type SanitizerConfig, sanitizeHTML } from "./sanitizer";

/**
 * Props for the SafeHTML component
 */
export interface SafeHTMLProps {
  /** HTML string to render */
  html: string;
  /** Sanitizer configuration */
  sanitizerConfig?: SanitizerConfig;
  /** Custom sanitizer instance */
  sanitizer?: Sanitizer;
  /** CSS class name for the wrapper element */
  className?: string;
  /** Inline styles for the wrapper element */
  style?: React.CSSProperties;
  /** HTML tag to use as wrapper (default: 'div') */
  tag?: string;
  /** Callback when HTML is sanitized */
  onSanitize?: (sanitizedHTML: string) => void;
  /** Whether to show a warning if HTML was modified during sanitization */
  showSanitizationWarning?: boolean;
}

/**
 * React component for safely rendering HTML
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({
  html,
  sanitizerConfig,
  sanitizer,
  className,
  style,
  tag: Tag = "div",
  onSanitize,
  showSanitizationWarning = false,
}) => {
  const [sanitizedHTML, setSanitizedHTML] = useState<string>("");
  const [wasModified, setWasModified] = useState<boolean>(false);
  const elementRef = useRef<HTMLElement>(null);

  const sanitizedContent = useMemo(() => {
    const sanitizerInstance = sanitizer || new Sanitizer(sanitizerConfig);
    const sanitized = sanitizerInstance.sanitize(html);
    const modified = sanitized !== html;

    setWasModified(modified);
    onSanitize?.(sanitized);

    return sanitized;
  }, [html, sanitizerConfig, sanitizer, onSanitize]);

  useEffect(() => {
    setSanitizedHTML(sanitizedContent);
  }, [sanitizedContent]);

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.innerHTML = sanitizedHTML;
    }
  }, [sanitizedHTML]);

  return (
    <>
      {React.createElement(Tag, {
        ref: elementRef,
        className: className,
        style: style,
      })}
      {showSanitizationWarning && wasModified && (
        <div
          style={{
            fontSize: "12px",
            color: "#ff6b6b",
            marginTop: "4px",
            fontStyle: "italic",
          }}
        >
          ⚠️ HTML content was sanitized for security
        </div>
      )}
    </>
  );
};

/**
 * React hook for safe HTML rendering
 */
export function useSafeHTML(
  html: string,
  sanitizerConfig?: SanitizerConfig
): {
  sanitizedHTML: string;
  wasModified: boolean;
  sanitizer: Sanitizer;
} {
  const sanitizer = useMemo(() => new Sanitizer(sanitizerConfig), [sanitizerConfig]);

  const sanitizedHTML = useMemo(() => {
    return sanitizer.sanitize(html);
  }, [html, sanitizer]);

  const wasModified = useMemo(() => {
    return sanitizedHTML !== html;
  }, [sanitizedHTML, html]);

  return {
    sanitizedHTML,
    wasModified,
    sanitizer,
  };
}

/**
 * Higher-order component for safe HTML rendering
 * biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe as HTML is sanitized
 */
export function withSafeHTML<P extends object>(
  Component: React.ComponentType<P>,
  defaultSanitizerConfig?: SanitizerConfig
) {
  return React.forwardRef<HTMLElement, P & { html: string; sanitizerConfig?: SanitizerConfig }>(
    (props, ref) => {
      const { html, sanitizerConfig, ...restProps } = props;
      const { sanitizedHTML } = useSafeHTML(html, sanitizerConfig || defaultSanitizerConfig);

      return (
        <Component
          {...(restProps as P)}
          ref={ref}
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
      );
    }
  );
}

/**
 * Utility function to create a safe HTML element
 */
export function createSafeHTMLElement(
  html: string,
  sanitizerConfig?: SanitizerConfig
): HTMLElement {
  const div = document.createElement("div");
  const sanitizedHTML = sanitizeHTML(html, sanitizerConfig);
  div.innerHTML = sanitizedHTML;
  return (div.firstElementChild as HTMLElement) || div;
}
