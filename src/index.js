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
    var defaultOpen = (getAttr(root, "default-open") || "first").toLowerCase();

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

    this.items = Array.from(this.root.querySelectorAll(this.conf.item));
    this.valid = this.items.length > 0;
    if (!this.valid) return;

    this.accordionId = assignUID(this.root, "id");
    this.bindings = [];
    this.ro = null;
    this._roTicking = false;
  }

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

  Accordion.prototype.initItems = function () {
    var self = this;

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
      var openInitially =
        forcedOpen ||
        self.conf.defaultOpen === "all" ||
        (self.conf.defaultOpen === "first" && index === 0);

      self.setItemOpen(item, triggerEl, contentEl, openInitially, true);
    });
  };

  Accordion.prototype.onResize = function () {
    var self = this;
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

  Accordion.prototype.bindEvents = function () {
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

    if (typeof ResizeObserver !== "undefined") {
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
    }
  };

  Accordion.prototype.init = function () {
    this.initItems();
    this.bindEvents();
  };

  Accordion.prototype.destroy = function () {
    if (this._onClick) this.root.removeEventListener("click", this._onClick);
    if (this._onKeydown)
      this.root.removeEventListener("keydown", this._onKeydown);

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
  };

  var state = {
    instances: {},
    order: [],
  };

  function init() {
    var roots = document.querySelectorAll(
      "[data-rt-accordion], [rt-accordion]",
    );
    var autoCount = 0;

    for (var i = 0; i < roots.length; i++) {
      var root = roots[i];
      var id = getAttr(root, "id");

      if (!id) {
        autoCount++;
        id = "accordion-" + autoCount;
        root.setAttribute("data-rt-accordion-id", id);
      }

      if (state.instances[id]) continue;

      var inst = new Accordion(root, id);
      if (inst.valid) {
        state.instances[id] = inst;
        state.order.push(id);
        inst.init();
      }
    }
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
      refresh: function () {
        var keys = state.order;
        for (var i = 0; i < keys.length; i++) {
          var inst = state.instances[keys[i]];
          if (inst) inst.onResize();
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
        for (var i = 0; i < state.order.length; i++) {
          var k = state.order[i];
          if (state.instances[k]) state.instances[k].destroy();
        }
        state.instances = {};
        state.order = [];
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window[RT_NS] = makeApi();
})();
