# rt-accordion

![Platform: Web](https://img.shields.io/badge/platform-web-000000)
![JavaScript](https://img.shields.io/badge/language-JavaScript-F7DF1E?logo=javascript)
[![npm version](https://img.shields.io/npm/v/%40rethink-js%2Frt-accordion.svg)](https://www.npmjs.com/package/@rethink-js/rt-accordion)
[![jsDelivr hits](https://data.jsdelivr.com/v1/package/npm/@rethink-js/rt-accordion/badge)](https://www.jsdelivr.com/package/npm/@rethink-js/rt-accordion)
[![License: MIT](https://img.shields.io/badge/License-MIT-FFD632.svg)](https://opensource.org/licenses/MIT)

`rt-accordion` is a lightweight JavaScript utility for building accessible, smooth, and fully responsive accordion components with:

- **Zero-config defaults** that work out of the box
- Attribute-driven configuration using both `rt-accordion-*` and `data-rt-accordion-*`
- Support for **multiple independent instances**
- A clean global API under `window.rtAccordion`
- Automatic handling for **late-rendered, injected, or CMS-loaded accordion markup**
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
- [6. Late-Rendered / CMS-Loaded Content](#6-late-rendered--cms-loaded-content)
- [7. Global API](#7-global-api)
- [8. Accessibility & Keyboard Support](#8-accessibility--keyboard-support)
- [9. Troubleshooting](#9-troubleshooting)
- [10. License](#10-license)

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

Add the script to your page. With no extra configuration provided, `rt-accordion` will:

- Auto-initialize itself when applicable
- Apply safe, accessible defaults
- Add ARIA relationships and keyboard navigation
- Expose the global API
- Watch the DOM for future accordion roots or accordion items added later

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

By default, if you do not provide any configuration, the library runs with:

- `single` mode
- `1` as the default open item

That means the first accordion item opens automatically unless you explicitly set a different initial state.

Example with explicit defaults:

```html
<div rt-accordion rt-accordion-mode="single" rt-accordion-default-open="none">
  <div rt-accordion-item>
    <button rt-accordion-trigger>Question 1</button>
    <div rt-accordion-content>Answer 1</div>
  </div>

  <div rt-accordion-item>
    <button rt-accordion-trigger>Question 2</button>
    <div rt-accordion-content>Answer 2</div>
  </div>
</div>
```

---

## 3. Activation Rules

The library activates automatically when it detects the `rt-accordion` or `data-rt-accordion` attribute on a wrapper element in the DOM.

If no accordion root is found, the script stays dormant.

As of **v1.2.1**, activation is no longer limited to the first DOM pass. The package also watches for:

- accordion roots added later
- accordion items added later inside an existing root
- relevant accordion attribute changes on existing markup

This makes it much more reliable with CMS-loaded lists, AJAX-rendered content, tabs, filters, and delayed DOM injection.

---

## 4. Configuration (HTML Attributes)

### Root Activation & Global Options

You can use either standard `rt-accordion-*` attributes or strict HTML5 `data-rt-accordion-*` attributes.

```html
<div rt-accordion rt-accordion-mode="multiple" rt-accordion-default-open="all">
  ...
</div>
```

### Core Root Attributes

| Attribute                   | Description                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `rt-accordion`              | Enables accordion behavior on the wrapper.                                                                                            |
| `rt-accordion-id`           | Optional unique identifier. Auto-generated if missing.                                                                                |
| `rt-accordion-mode`         | Defines toggle behavior. Values: `single` (default) or `multiple`.                                                                    |
| `rt-accordion-default-open` | Defines initial state. Values: `1` (default), `all`, `none`, a specific number such as `3`, or comma-separated numbers such as `2,4`. |

### Per-Item Attributes

```html
<div rt-accordion-item rt-accordion-open>
  <button rt-accordion-trigger>
    Read More
    <span rt-accordion-expanded-text="Read Less">Read More</span>
  </button>
  <div rt-accordion-content>...</div>
</div>
```

| Attribute                    | Description                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| `rt-accordion-item`          | Marks the wrapper for an individual accordion row or item.               |
| `rt-accordion-trigger`       | Marks the clickable control that toggles the content.                    |
| `rt-accordion-content`       | Marks the collapsible content container.                                 |
| `rt-accordion-open`          | Forces that item to be open on initialization or rebuild.                |
| `rt-accordion-expanded-text` | Replaces the node text when the item is open.                            |
| `rt-accordion-original-text` | Stores the original text internally. Usually auto-managed by the script. |

### Notes on `default-open`

`rt-accordion-default-open` uses **1-based indexing**.

Examples:

```html
<div rt-accordion rt-accordion-default-open="1"></div>
<div rt-accordion rt-accordion-default-open="none"></div>
<div rt-accordion rt-accordion-default-open="all"></div>
<div rt-accordion rt-accordion-default-open="2"></div>
<div rt-accordion rt-accordion-default-open="2,4"></div>
```

So:

- `1` means first item
- `2` means second item
- `2,4` means second and fourth items

In `single` mode, if multiple items end up open after sync or rebuild, the package collapses extras and keeps the first open item it encounters.

---

## 5. Multiple Instances

`rt-accordion` supports multiple independent instances on the same page.

Each instance:

- has its own configuration
- is registered internally
- can be controlled individually through the global API
- can be rebuilt independently if needed

Example:

```html
<div
  rt-accordion
  rt-accordion-id="faq-accordion"
  rt-accordion-default-open="none"
>
  ...
</div>

<div
  rt-accordion
  rt-accordion-id="downloads-accordion"
  rt-accordion-mode="single"
>
  ...
</div>
```

---

## 6. Late-Rendered / CMS-Loaded Content

As of **v1.2.1**, `rt-accordion` is designed to handle content that appears after the initial page load.

This includes scenarios such as:

- Webflow CMS content injected later
- Finsweet CMS Load
- tab panels that render after interaction
- AJAX-loaded sections
- filters that replace or append accordion items
- delayed DOM injection from other scripts

### What happens automatically

The package now watches the DOM and will:

- initialize newly added accordion roots
- rebuild existing accordion instances when new items appear inside them
- re-sync ARIA attributes, heights, and state
- rebind resize observation safely

In most cases, no manual re-initialization is needed.

### Manual refresh

If you still want to force a rebuild manually, you can do:

```js
window.rtAccordion.refresh();
```

Or rebuild a specific instance:

```js
window.rtAccordion.refresh("faq-accordion");
```

You can also force a scan for new roots with:

```js
window.rtAccordion.init();
```

---

## 7. Global API

Once initialized, you can interact with the accordions programmatically:

```js
window.rtAccordion;
```

### Common Methods

| Method        | Description                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `ids()`       | Returns an array of all active accordion instance IDs.                                         |
| `get(id)`     | Returns the specific accordion instance object, or `null` if not found.                        |
| `refresh()`   | Rebuilds all active accordion instances and re-syncs heights, items, and observers.            |
| `refresh(id)` | Rebuilds a specific accordion instance by ID.                                                  |
| `destroy(id)` | Destroys a specific accordion instance and removes its listeners, styles, and ARIA attributes. |
| `destroy()`   | Destroys all accordion instances and stops the DOM observer.                                   |
| `init()`      | Forces a scan for accordion roots and initializes or rebuilds them.                            |

### Example

```js
window.rtAccordion.ids();
window.rtAccordion.get("accordion-1");
window.rtAccordion.refresh();
window.rtAccordion.refresh("accordion-1");
window.rtAccordion.destroy("accordion-1");
window.rtAccordion.init();
```

### Important API note

`refresh()` in **v1.2.1** is stronger than before.

It no longer only recalculates heights. It now rebuilds accordion instances so newly injected items inside an existing root are properly picked up as well.

---

## 8. Accessibility & Keyboard Support

`rt-accordion` automatically applies accessibility enhancements such as:

- `role="button"` on triggers
- `tabindex="0"` on triggers
- `role="region"` on content areas
- `aria-expanded` on triggers
- `aria-hidden` on content panels
- linked `aria-controls` and `aria-labelledby` values

Keyboard support includes:

- `Enter` to toggle
- `Space` to toggle
- `ArrowDown` to move to the next trigger
- `ArrowUp` to move to the previous trigger
- `Home` to jump to the first trigger
- `End` to jump to the last trigger

---

## 9. Troubleshooting

### Feature not activating

Check the following:

- the root has `rt-accordion` or `data-rt-accordion`
- each item has `rt-accordion-item`
- each item contains one trigger with `rt-accordion-trigger`
- each item contains one content element with `rt-accordion-content`
- the script is loaded successfully

### Accordion exists but clicking does nothing

Likely causes:

- another script is blocking click behavior
- the trigger is missing the correct attribute
- the accordion markup is malformed
- the content is being replaced or removed by another script after init

Try:

```js
window.rtAccordion.ids();
window.rtAccordion.refresh();
```

### CMS or delayed content is not behaving correctly

`v1.2.1` should handle this automatically, but if another script replaces markup aggressively, force a rebuild:

```js
window.rtAccordion.refresh();
```

Or for one instance:

```js
window.rtAccordion.refresh("accordion-1");
```

### Animations are jittery

Check that:

- content areas do not have forced fixed heights
- your CSS is not applying conflicting height transitions
- parent wrappers are not clipping or overriding layout unexpectedly

### Multiple accordion roots are not closing each other

This is expected.

`single` mode only closes sibling items **inside the same accordion root**.

If you want one-open-at-a-time behavior across several visible rows, those rows must all be children of the same accordion root.

### Unexpected behavior in nested accordion setups

If you nest accordions, make sure each nested accordion has its own distinct root element and item structure.

### Duplicate IDs in your HTML

Avoid repeating the same `id` value across multiple elements. While `rt-accordion` auto-generates its own trigger/content IDs when needed, duplicate IDs elsewhere in your markup can still cause invalid HTML and unpredictable behavior.

---

## 10. License

MIT License

Package: `@rethink-js/rt-accordion`  
GitHub: [https://github.com/Rethink-JS/rt-accordion](https://github.com/Rethink-JS/rt-accordion)

---

by **Rethink JS**  
[https://github.com/Rethink-JS](https://github.com/Rethink-JS)
