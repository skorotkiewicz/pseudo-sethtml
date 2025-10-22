# Pseudo setHTML

A TypeScript library providing safe HTML parsing and sanitization for React and Node.js applications. This library implements a pseudo version of the native `Element.setHTML()` method with enhanced security features and cross-platform compatibility.

## Features

- 🛡️ **XSS Protection** - Automatically removes dangerous HTML elements and attributes
- ⚛️ **React Integration** - Components and hooks for safe HTML rendering
- 🖥️ **Node.js Support** - Server-side HTML processing utilities
- 🔧 **Configurable** - Customizable sanitization rules
- 📦 **TypeScript** - Full type safety and IntelliSense support
- 🧪 **Tested** - Comprehensive test suite included
- 🌐 **MDN Compatible** - API compatible with native `Element.setHTML()` and `ShadowRoot.setHTML()`
- 🔄 **Legacy Support** - Backward compatible with existing configurations

## Installation

```bash
npm install pseudo-sethtml
```

## Quick Start

### React Usage

```tsx
import React from 'react';
import { SafeHTML, useSafeHTML } from 'pseudo-sethtml';

function App() {
  const dangerousHTML = '<p>Hello <script>alert("xss")</script> World</p>';
  
  return (
    <div>
      {/* Using SafeHTML component */}
      <SafeHTML html={dangerousHTML} />
      
      {/* Using hook */}
      <HookExample html={dangerousHTML} />
    </div>
  );
}

function HookExample({ html }: { html: string }) {
  const { sanitizedHTML, wasModified } = useSafeHTML(html);
  
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
      {wasModified && <p>⚠️ Content was sanitized</p>}
    </div>
  );
}
```

### Node.js Usage

```typescript
import { processServerHTML, NodeHTMLProcessor, setHTML, setHTMLUnsafe } from 'pseudo-sethtml';

// Simple sanitization
const dangerousHTML = '<p>Hello <script>alert("xss")</script> World</p>';
const sanitized = processServerHTML(dangerousHTML);
console.log(sanitized); // <p>Hello  World</p>

// Advanced processing with metadata
const processor = new NodeHTMLProcessor();
const result = processor.processHTMLWithMetadata(dangerousHTML);
console.log(result);
// {
//   sanitizedHTML: '<p>Hello  World</p>',
//   wasModified: true,
//   removedElements: ['script'],
//   removedAttributes: []
// }

// Native setHTML API (MDN compatible)
const element = document.getElementById('target');
setHTML(element, dangerousHTML); // Safe sanitization
setHTMLUnsafe(element, '<p>Hello <em>italic</em></p>'); // Less restrictive
```

## API Reference

### Sanitizer

The core sanitization engine with configurable options.

```typescript
import { Sanitizer, SanitizerConfig } from 'pseudo-sethtml';

// MDN-compatible configuration
const config: SanitizerConfig = {
  elements: ['p', 'strong', 'em'],        // MDN format
  removeElements: ['script', 'style'],    // MDN format
  allowedAttributes: ['class', 'id'],     // Legacy format (still supported)
  disallowedAttributes: ['onclick', 'onload'],
  allowedProtocols: ['http:', 'https:'],
  allowDataUrls: false,
  stripComments: true,
  stripDoctype: true
};

const sanitizer = new Sanitizer(config);
const cleanHTML = sanitizer.sanitize(dangerousHTML);
```

### React Components

#### SafeHTML

A React component for safely rendering HTML content.

```tsx
<SafeHTML
  html={dangerousHTML}
  sanitizerConfig={customConfig}
  className="safe-content"
  style={{ color: 'blue' }}
  tag="section"
  showSanitizationWarning={true}
  onSanitize={(sanitized) => console.log('Sanitized:', sanitized)}
/>
```

#### useSafeHTML Hook

A React hook for safe HTML processing.

```tsx
const { sanitizedHTML, wasModified, sanitizer } = useSafeHTML(html, config);
```

#### withSafeHTML HOC

Higher-order component for safe HTML rendering.

```tsx
const SafeDiv = withSafeHTML('div');
<SafeDiv html={dangerousHTML} />
```

### Node.js Utilities

#### NodeHTMLProcessor

Server-side HTML processing with validation and metadata.

```typescript
const processor = new NodeHTMLProcessor(config);

// Basic processing
const sanitized = processor.processHTML(html);

// With metadata
const result = processor.processHTMLWithMetadata(html);

// HTML validation
const validation = processor.validateHTMLStructure(html);
```

#### Express Middleware

```typescript
import { createSanitizationMiddleware } from 'pseudo-sethtml';

const app = express();
app.use(createSanitizationMiddleware(config));
```

#### ShadowRoot-like Processing

```typescript
import { ShadowRootProcessor } from 'pseudo-sethtml';

const shadowRoot = new ShadowRootProcessor({
  elements: ['p', 'strong', 'em'],
  removeElements: ['script']
});

// Safe processing (MDN compatible)
shadowRoot.setHTML('<p>Hello <script>alert("xss")</script> World</p>');
console.log(shadowRoot.getHTML()); // <p>Hello  World</p>

// Unsafe processing (allows more content)
shadowRoot.setHTMLUnsafe('<p>Hello <em>italic</em></p>');
console.log(shadowRoot.getHTML()); // <p>Hello <em>italic</em></p>
```

#### Native setHTML API

```typescript
import { setHTML, setHTMLUnsafe } from 'pseudo-sethtml';

const element = document.getElementById('target');

// Safe sanitization (always removes unsafe content)
setHTML(element, '<p>Hello <script>alert("xss")</script> World</p>');

// Less restrictive sanitization
setHTMLUnsafe(element, '<p>Hello <em>italic</em></p>');
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `elements` | `string[]` | See below | HTML elements to allow (MDN format) |
| `removeElements` | `string[]` | `['script', 'style', ...]` | HTML elements to remove (MDN format) |
| `allowedElements` | `string[]` | See below | HTML elements to allow (legacy format) |
| `disallowedElements` | `string[]` | `['script', 'style', ...]` | HTML elements to remove (legacy format) |
| `allowedAttributes` | `string[]` | See below | HTML attributes to allow |
| `disallowedAttributes` | `string[]` | `['onclick', 'onload', ...]` | HTML attributes to remove |
| `allowedProtocols` | `string[]` | `['http:', 'https:', ...]` | URL protocols to allow |
| `allowDataUrls` | `boolean` | `false` | Whether to allow data URLs |
| `stripComments` | `boolean` | `true` | Whether to remove HTML comments |
| `stripDoctype` | `boolean` | `true` | Whether to remove DOCTYPE |

### Default Allowed Elements

```typescript
[
  'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
]
```

### Default Allowed Attributes

```typescript
[
  'href', 'src', 'alt', 'title', 'class', 'id', 'style',
  'width', 'height', 'colspan', 'rowspan', 'target'
]
```

## Examples

### Content Management System

```typescript
class ContentManager {
  private processor: NodeHTMLProcessor;
  
  constructor() {
    this.processor = new NodeHTMLProcessor({
      allowedElements: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3'],
      allowedAttributes: ['class', 'id'],
      stripComments: true
    });
  }
  
  processContent(content: string) {
    return this.processor.processHTMLWithMetadata(content);
  }
}
```

### Blog Post Rendering

```tsx
function BlogPost({ content }: { content: string }) {
  const { sanitizedHTML, wasModified } = useSafeHTML(content, {
    allowedElements: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'a', 'img'],
    allowedAttributes: ['href', 'src', 'alt', 'title'],
    allowedProtocols: ['http:', 'https:']
  });
  
  return (
    <article>
      <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
      {wasModified && (
        <div className="sanitization-warning">
          Content was sanitized for security
        </div>
      )}
    </article>
  );
}
```

### API Endpoint

```typescript
app.post('/api/content', (req, res) => {
  const { html } = req.body;
  
  const result = processServerHTMLWithMetadata(html);
  
  res.json({
    sanitizedContent: result.sanitizedHTML,
    wasModified: result.wasModified,
    removedElements: result.removedElements,
    removedAttributes: result.removedAttributes
  });
});
```

## Security Considerations

- **Always sanitize user input** before rendering HTML
- **Use HTTPS** for external resources
- **Validate URLs** before allowing them in content
- **Regularly update** sanitization rules based on new threats
- **Test thoroughly** with various HTML inputs

## Browser Compatibility

This library works in all modern browsers and Node.js environments. It doesn't rely on the native `Element.setHTML()` method, making it compatible with older browsers.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.2.0
- ✅ **MDN Compatibility** - Added support for native `Element.setHTML()` and `ShadowRoot.setHTML()` APIs
- ✅ **Enhanced Configuration** - Support for MDN-compatible `elements` and `removeElements` options
- ✅ **New Methods** - Added `setHTML()`, `setHTMLUnsafe()`, and `removeUnsafe()` methods
- ✅ **ShadowRoot Support** - Added `ShadowRootProcessor` for server-side Shadow DOM-like processing
- ✅ **Legacy Support** - Backward compatible with existing `allowedElements`/`disallowedElements` configuration
- ✅ **Improved Tests** - Comprehensive test coverage for new features

### v1.0.0
- Initial release
- React components and hooks
- Node.js utilities
- Comprehensive sanitization
- TypeScript support
- Test suite
