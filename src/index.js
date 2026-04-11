(function () {
  var RT_NS = "rtAccordion";
  if (window[RT_NS] && window[RT_NS].__initialized) return;

  var SPEED_OPEN_PX_PER_S = 1200;
  var SPEED_CLOSE_PX_PER_S = 900;
  var DURATION_MIN_MS = 600;
  var DURATION_MAX_MS = 2400;
  var EASE = "cubic-bezier(0.19, 1, 0.22, 1)";

  function uid() {
    return "a" + Math.random().toString(36).slice(2);
  }

  function getAttr(el, suffix) {
    var dVal = el.getAttribute("data-rt-accordion-" + suffix);
    if (dVal !== null) return dVal;
    return el.getAttribute("rt-accordion-" + suffix);
  }

  function hasAttr(el, suffix) {
    return (
      el.hasAttribute("data-rt-accordion-" + suffix) ||
      el.hasAttribute("rt-accordion-" + suffix)
    );
  }

  function assignUID(el, suffix) {
    var existing = getAttr(el, suffix);
    if (existing) return existing;
    var newUid = uid();
    el.setAttribute("data-rt-accordion-" + suffix, newUid);
    return newUid;
  }

  function getConf(root) {
    var mode = (getAttr(root, "mode") || "single").toLowerCase();
    var defaultOpen = (getAttr(root, "default-open") || "1").toLowerCase();

    return {
      item: "[data-rt-accordion-item], [rt-accordion-item]",
      trigger: "[data-rt-accordion-trigger], [rt-accordion-trigger]",
      content: "[data-rt-accordion-content], [rt-accordion-content]",
      mode: mode,
      defaultOpen: defaultOpen,
    };
  }

  function Accordion(root, id) {
    this.root = root;
    this.id = id;
    this.conf = getConf(root);
    this.items = [];
    this.valid = false;
    this.accordionId = assignUID(this.root, "id");
    this.bindings = [];
    this.ro = null;
    this._roTicking = false;
    this._bound = false;
    this.collectItems();
  }

  Accordion.prototype.collectItems = function () {
    this.conf = getConf(this.root);
    this.items = Array.from(this.root.querySelectorAll(this.conf.item));
    this.valid = this.items.length > 0;
  };

  Accordion.prototype.computeExpandedHeight = function (triggerEl, contentEl) {
    var t = triggerEl ? triggerEl.offsetHeight : 0;
    var c = contentEl ? contentEl.offsetHeight : 0;
    return t + c;
  };

  Accordion.prototype.computeDurationMs = function (
    currentPx,
    targetPx,
    opening,
  ) {
    var delta = Math.abs(targetPx - currentPx);
    var speed = opening ? SPEED_OPEN_PX_PER_S : SPEED_CLOSE_PX_PER_S;
    var ms = (delta / Math.max(1, speed)) * 1000;
    return Math.max(DURATION_MIN_MS, Math.min(DURATION_MAX_MS, ms));
  };

  Accordion.prototype.updateExpandedText = function (item, open) {
    var nodes = Array.from(
      item.querySelectorAll(
        "[data-rt-accordion-expanded-text], [rt-accordion-expanded-text]",
      ),
    );
    if (!nodes.length) return;

    nodes.forEach(function (el) {
      if (!hasAttr(el, "original-text")) {
        el.setAttribute(
          "data-rt-accordion-original-text",
          el.textContent || "",
        );
      }
      var expanded = getAttr(el, "expanded-text");
      var original = getAttr(el, "original-text");
      el.textContent = open ? expanded : original;
    });
  };

  Accordion.prototype.setItemOpen = function (
    item,
    triggerEl,
    contentEl,
    open,
    immediate,
  ) {
    if (!item) return;

    var current = item.offsetHeight || 0;
    var target = open
      ? this.computeExpandedHeight(triggerEl, contentEl)
      : triggerEl
        ? triggerEl.offsetHeight
        : 0;

    var durationMs = immediate
      ? 0
      : this.computeDurationMs(current, target, open);

    item.style.transition = immediate
      ? "none"
      : "height " + durationMs + "ms " + EASE;
    item.style.height = target + "px";

    item.setAttribute("data-rt-accordion-is-open", open ? "true" : "false");
    item.setAttribute("rt-accordion-is-open", open ? "true" : "false");

    if (triggerEl) {
      triggerEl.setAttribute("aria-expanded", open ? "true" : "false");
    }

    if (contentEl) {
      contentEl.setAttribute("aria-hidden", open ? "false" : "true");
    }

    this.updateExpandedText(item, open);
  };

  Accordion.prototype.closeSiblingsSingleMode = function (currentItem) {
    if (this.conf.mode !== "single") return;

    var self = this;
    this.items.forEach(function (item) {
      if (item !== currentItem && getAttr(item, "is-open") === "true") {
        var t = item.querySelector(self.conf.trigger);
        var c = item.querySelector(self.conf.content);
        self.setItemOpen(item, t, c, false, false);
      }
    });
  };

  Accordion.prototype.handleToggle = function (triggerEl) {
    this.collectItems();

    var item = triggerEl.closest(this.conf.item);
    if (!item) return;

    var contentEl = item.querySelector(this.conf.content);
    var isOpen = getAttr(item, "is-open") === "true";

    if (isOpen) {
      this.setItemOpen(item, triggerEl, contentEl, false, false);
    } else {
      this.closeSiblingsSingleMode(item);
      this.setItemOpen(item, triggerEl, contentEl, true, false);
    }
  };

  Accordion.prototype.getTargetIndices = function () {
    var targetIndices = [];

    if (this.conf.defaultOpen !== "all" && this.conf.defaultOpen !== "none") {
      var parts = this.conf.defaultOpen.split(",");
      for (var i = 0; i < parts.length; i++) {
        var num = parseInt(parts[i].trim(), 10);
        if (!isNaN(num)) {
          targetIndices.push(num - 1);
        }
      }
    }

    return targetIndices;
  };

  Accordion.prototype.syncItems = function (immediate, preserveState) {
    this.collectItems();
    if (!this.valid) return;

    var self = this;
    var targetIndices = this.getTargetIndices();

    this.items.forEach(function (item, index) {
      var triggerEl = item.querySelector(self.conf.trigger);
      var contentEl = item.querySelector(self.conf.content);
      if (!triggerEl || !contentEl) return;

      item.style.overflow = "hidden";
      item.style.willChange = "height";

      triggerEl.setAttribute("role", "button");
      triggerEl.setAttribute("tabindex", "0");
      contentEl.setAttribute("role", "region");

      if (!triggerEl.id) {
        triggerEl.id = "rt-acc-trig-" + uid();
      }
      if (!contentEl.id) {
        contentEl.id = "rt-acc-cont-" + uid();
      }

      triggerEl.setAttribute("aria-controls", contentEl.id);
      contentEl.setAttribute("aria-labelledby", triggerEl.id);

      var forcedOpen = hasAttr(item, "open");
      var isTargetIndex = targetIndices.indexOf(index) > -1;
      var currentState = getAttr(item, "is-open") === "true";

      var openInitially = preserveState
        ? currentState
        : forcedOpen || self.conf.defaultOpen === "all" || isTargetIndex;

      self.setItemOpen(item, triggerEl, contentEl, openInitially, immediate);
    });

    if (this.conf.mode === "single") {
      var openItems = [];
      this.items.forEach(function (item) {
        if (getAttr(item, "is-open") === "true") {
          openItems.push(item);
        }
      });

      if (openItems.length > 1) {
        for (var i = 1; i < openItems.length; i++) {
          var t = openItems[i].querySelector(self.conf.trigger);
          var c = openItems[i].querySelector(self.conf.content);
          self.setItemOpen(openItems[i], t, c, false, true);
        }
      }
    }
  };

  Accordion.prototype.observeResizeTargets = function () {
    var self = this;

    if (this.ro) {
      this.ro.disconnect();
      this.ro = null;
    }

    if (typeof ResizeObserver === "undefined") return;

    this.ro = new ResizeObserver(function () {
      if (self._roTicking) return;
      self._roTicking = true;
      requestAnimationFrame(function () {
        self._roTicking = false;
        self.onResize();
      });
    });

    this.items.forEach(function (item) {
      var content = item.querySelector(self.conf.content);
      var trigger = item.querySelector(self.conf.trigger);
      if (content) self.ro.observe(content);
      if (trigger) self.ro.observe(trigger);
    });
  };

  Accordion.prototype.initItems = function () {
    this.syncItems(true, false);
    this.observeResizeTargets();
  };

  Accordion.prototype.onResize = function () {
    var self = this;
    this.collectItems();

    this.items.forEach(function (item) {
      var t = item.querySelector(self.conf.trigger);
      var c = item.querySelector(self.conf.content);
      if (!t || !c) return;

      var isOpen = getAttr(item, "is-open") === "true";
      var target = isOpen ? self.computeExpandedHeight(t, c) : t.offsetHeight;

      item.style.transition = "none";
      item.style.height = target + "px";
    });
  };

  Accordion.prototype.rebuild = function () {
    this.syncItems(true, true);
    this.observeResizeTargets();
    this.onResize();
  };

  Accordion.prototype.bindEvents = function () {
    if (this._bound) return;

    var self = this;

    this._onClick = function (e) {
      var trigger = e.target.closest(self.conf.trigger);
      if (!trigger) return;
      var item = trigger.closest(self.conf.item);
      if (!item || !self.root.contains(item)) return;

      e.preventDefault();
      self.handleToggle(trigger);
    };

    this._onKeydown = function (e) {
      var isTrigger = e.target && e.target.matches(self.conf.trigger);
      if (!isTrigger) return;
      if (!self.root.contains(e.target)) return;

      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        self.handleToggle(e.target);
        return;
      }

      self.collectItems();

      var triggers = [];
      for (var i = 0; i < self.items.length; i++) {
        var t = self.items[i].querySelector(self.conf.trigger);
        if (t) triggers.push(t);
      }
      var idx = triggers.indexOf(e.target);

      if (idx > -1) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          var next = triggers[idx + 1] || triggers[0];
          next.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          var prev = triggers[idx - 1] || triggers[triggers.length - 1];
          prev.focus();
        } else if (e.key === "Home") {
          e.preventDefault();
          triggers[0].focus();
        } else if (e.key === "End") {
          e.preventDefault();
          triggers[triggers.length - 1].focus();
        }
      }
    };

    this.root.addEventListener("click", this._onClick);
    this.root.addEventListener("keydown", this._onKeydown);
    this._bound = true;
  };

  Accordion.prototype.init = function () {
    this.collectItems();
    if (!this.valid) return;
    this.initItems();
    this.bindEvents();
  };

  Accordion.prototype.destroy = function () {
    if (this._onClick) this.root.removeEventListener("click", this._onClick);
    if (this._onKeydown)
      this.root.removeEventListener("keydown", this._onKeydown);

    this._bound = false;

    if (this.ro) {
      this.ro.disconnect();
      this.ro = null;
    }

    var self = this;
    this.items.forEach(function (item) {
      item.style.height = "";
      item.style.transition = "";
      item.style.overflow = "";
      item.style.willChange = "";
      item.removeAttribute("data-rt-accordion-is-open");
      item.removeAttribute("rt-accordion-is-open");

      var triggerEl = item.querySelector(self.conf.trigger);
      if (triggerEl) {
        triggerEl.removeAttribute("aria-expanded");
        triggerEl.removeAttribute("aria-controls");
        triggerEl.removeAttribute("role");
        triggerEl.removeAttribute("tabindex");
      }

      var contentEl = item.querySelector(self.conf.content);
      if (contentEl) {
        contentEl.removeAttribute("role");
        contentEl.removeAttribute("aria-labelledby");
        contentEl.removeAttribute("aria-hidden");
      }
    });

    this.collectItems();
  };

  var state = {
    instances: {},
    order: [],
    mo: null,
    moTicking: false,
  };

  function ensureInstance(root) {
    var id = getAttr(root, "id");

    if (!id) {
      id = "accordion-" + (state.order.length + 1);
      root.setAttribute("data-rt-accordion-id", id);
    }

    var inst = state.instances[id];

    if (!inst) {
      inst = new Accordion(root, id);
      if (!inst.valid) return null;
      state.instances[id] = inst;
      state.order.push(id);
      inst.init();
      return inst;
    }

    inst.rebuild();
    return inst;
  }

  function removeDetachedInstances() {
    var nextOrder = [];

    for (var i = 0; i < state.order.length; i++) {
      var id = state.order[i];
      var inst = state.instances[id];
      if (!inst) continue;

      if (!document.documentElement.contains(inst.root)) {
        inst.destroy();
        delete state.instances[id];
        continue;
      }

      nextOrder.push(id);
    }

    state.order = nextOrder;
  }

  function init() {
    var roots = document.querySelectorAll(
      "[data-rt-accordion], [rt-accordion]",
    );

    for (var i = 0; i < roots.length; i++) {
      ensureInstance(roots[i]);
    }

    removeDetachedInstances();
  }

  function scheduleInit() {
    if (state.moTicking) return;
    state.moTicking = true;

    requestAnimationFrame(function () {
      state.moTicking = false;
      init();
    });
  }

  function watchDom() {
    if (state.mo || typeof MutationObserver === "undefined") return;

    state.mo = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];

        if (m.type === "childList") {
          if (m.addedNodes.length || m.removedNodes.length) {
            scheduleInit();
            return;
          }
        }

        if (m.type === "attributes") {
          var target = m.target;
          if (
            target &&
            target.nodeType === 1 &&
            (target.matches("[data-rt-accordion], [rt-accordion]") ||
              target.closest("[data-rt-accordion], [rt-accordion]"))
          ) {
            scheduleInit();
            return;
          }
        }
      }
    });

    state.mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-rt-accordion",
        "rt-accordion",
        "data-rt-accordion-item",
        "rt-accordion-item",
        "data-rt-accordion-trigger",
        "rt-accordion-trigger",
        "data-rt-accordion-content",
        "rt-accordion-content",
        "data-rt-accordion-default-open",
        "rt-accordion-default-open",
        "data-rt-accordion-mode",
        "rt-accordion-mode",
        "data-rt-accordion-open",
        "rt-accordion-open",
      ],
    });
  }

  function makeApi() {
    return {
      __initialized: true,
      ids: function () {
        return state.order.slice();
      },
      get: function (id) {
        return state.instances[id] || null;
      },
      refresh: function (id) {
        if (typeof id === "string") {
          var inst = state.instances[id];
          if (inst) inst.rebuild();
          return;
        }

        init();

        var keys = state.order.slice();
        for (var i = 0; i < keys.length; i++) {
          var instance = state.instances[keys[i]];
          if (instance) instance.rebuild();
        }
      },
      destroy: function (id) {
        if (typeof id === "string") {
          var inst = state.instances[id];
          if (inst) {
            inst.destroy();
            delete state.instances[id];
            var idx = state.order.indexOf(id);
            if (idx > -1) state.order.splice(idx, 1);
          }
          return;
        }

        if (state.mo) {
          state.mo.disconnect();
          state.mo = null;
        }

        for (var i = 0; i < state.order.length; i++) {
          var k = state.order[i];
          if (state.instances[k]) state.instances[k].destroy();
        }

        state.instances = {};
        state.order = [];
        state.moTicking = false;
      },
      init: function () {
        init();
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
      watchDom();
    });
  } else {
    init();
    watchDom();
  }

  window[RT_NS] = makeApi();
})();
