# rt-accordion

![Platform: Web](https://img.shields.io/badge/platform-web-000000)
![JavaScript](https://img.shields.io/badge/language-JavaScript-F7DF1E?logo=javascript)
[![npm version](https://img.shields.io/npm/v/%40rethink-js%2Frt-accordion.svg)](https://www.npmjs.com/package/@rethink-js/rt-accordion)
[![jsDelivr hits](https://data.jsdelivr.com/v1/package/npm/@rethink-js/rt-accordion/badge)](https://www.jsdelivr.com/package/npm/@rethink-js/rt-accordion)
[![License: MIT](https://img.shields.io/badge/License-MIT-FFD632.svg)](https://opensource.org/licenses/MIT)

`rt-accordion` is a lightweight JavaScript utility that creates accessible, smooth, and fully responsive accordion components with:

- **Zero-config defaults** (works out of the box)
- Attribute-driven configuration (supports both `rt-accordion-*` and `data-rt-accordion-*`)
- Support for **multiple instances**
- A clean global API under `window.rtAccordion`
- Defensive fallbacks to avoid runtime crashes

**Zero dependency** (100% Vanilla JS)

---

# Table of Contents

- [1. Installation](#1-installation)
  - [1.1 CDN (jsDelivr)](#11-cdn-jsdelivr)
  - [1.2 npm](#12-npm)
- [2. Quick Start](#2-quick-start)
- [3. Activation Rules](#3-activation-rules)
- [4. Configuration (HTML Attributes)](#4-configuration-html-attributes)
- [5. Multiple Instances](#5-multiple-instances)
- [6. Global API](#6-global-api)
- [7. Troubleshooting](#7-troubleshooting)
- [8. License](#8-license)

---

## 1. Installation

### 1.1 CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/npm/@rethink-js/rt-accordion@latest/dist/index.min.js"></script>
```

### 1.2 npm

```bash
npm install @rethink-js/rt-accordion
```

Then bundle or load `dist/index.min.js` as appropriate for your build setup.

---

## 2. Quick Start

Add the script to your page. With no configuration provided, `rt-accordion` will:

- Auto-initialize itself when applicable
- Apply safe, accessible defaults (ARIA roles, tab-indexing, keyboard navigation)
- Expose the global API

Example HTML structure:

```html
<div rt-accordion>
  <div rt-accordion-item>
    <button rt-accordion-trigger>Toggle Item</button>
    <div rt-accordion-content>
      <p>Your accordion content goes here.</p>
    </div>
  </div>
</div>
```

> Note: If you do not provide any `rt-accordion-mode` or `rt-accordion-default-open` attributes, the library runs using its internal defaults (`single` mode, `first` item open).

---

## 3. Activation Rules

The library activates automatically when it detects the `rt-accordion` (or `data-rt-accordion`) attribute on a wrapper element in the DOM. If this attribute is not found, the script remains completely dormant to save resources.

---

## 4. Configuration (HTML Attributes)

### Root Activation & Global Options

You can use either standard `rt-accordion-*` attributes or strict HTML5 `data-rt-accordion-*` attributes.

```html
<div rt-accordion rt-accordion-mode="multiple" rt-accordion-default-open="all">
  ...
</div>
```

### Core Wrapper Attributes

| Attribute                   | Description                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `rt-accordion`              | Enables accordion behavior on the wrapper.                          |
| `rt-accordion-id`           | Optional unique identifier (auto-generated if missing).             |
| `rt-accordion-mode`         | Defines toggle behavior. Values: `single` (default) or `multiple`.  |
| `rt-accordion-default-open` | Defines initial state. Values: `first` (default), `all`, or `none`. |

---

### Per-Instance Configuration (Inside the Accordion)

```html
<div rt-accordion-item rt-accordion-open>
  <button rt-accordion-trigger>
    Read More <span rt-accordion-expanded-text="Read Less"></span>
  </button>
  <div rt-accordion-content>...</div>
</div>
```

| Attribute                    | Description                                             |
| ---------------------------- | ------------------------------------------------------- |
| `rt-accordion-item`          | Marks the wrapper for an individual accordion row/item. |
| `rt-accordion-trigger`       | Marks the clickable button that toggles the content.    |
| `rt-accordion-content`       | Marks the collapsible content container.                |
| `rt-accordion-open`          | Forces a specific item to be open on initialization.    |
| `rt-accordion-expanded-text` | Swaps text inside the trigger when the item is open.    |

---

### Advanced JSON Options

```html
<div rt-accordion rt-accordion-options-json='{"key":"value"}'></div>
```

Used for advanced configuration that doesn’t warrant individual attributes. _(Reserved for future extendability)._

---

## 5. Multiple Instances

`rt-accordion` supports multiple independent instances on the same page.

Each instance:

- Has its own configuration (e.g., one can be `single` mode, another `multiple`).
- Is registered internally.
- Can be controlled individually via the API.

---

## 6. Global API

Once initialized, you can interact with the accordions programmatically:

```js
window.rtAccordion;
```

### Common Methods

| Method         | Description                                                           |
| -------------- | --------------------------------------------------------------------- |
| `ids()`        | Returns an array of all active accordion instance IDs.                |
| `get(id)`      | Returns the specific accordion instance object.                       |
| `refresh()`    | Forces a recalculation of all active accordion heights (Resize-safe). |
| `destroy(id?)` | Removes all inline styles, ARIA tags, and event listeners.            |

---

## 7. Troubleshooting

### Feature not activating

- Ensure the correct `rt-accordion` and internal `rt-accordion-item`/`rt-accordion-trigger`/`rt-accordion-content` attributes exist.
- Confirm the script loaded successfully.

### Animations are jittery

- Ensure `rt-accordion-content` elements do not have fixed heights in your CSS.
- The script uses `ResizeObserver` to smoothly handle inner content changes; ensure your CSS isn't forcing conflicting transitions.

### Unexpected behavior

- Check for conflicting scripts.
- Verify attribute spelling (e.g., `rt-accordion-trigger`, not `rt-accordion-btn`).
- Confirm instance isolation if nesting accordions.

---

## 8. License

MIT License

Package: `@rethink-js/rt-accordion` <br>
GitHub: [https://github.com/Rethink-JS/rt-accordion](https://github.com/Rethink-JS/rt-accordion)

---

by **Rethink JS** <br>
[https://github.com/Rethink-JS](https://github.com/Rethink-JS)
