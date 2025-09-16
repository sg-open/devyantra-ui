import {
  script as script2
} from "./chunk-RJOZ6C5W.js";
import {
  Ripple
} from "./chunk-YPOWLM62.js";
import "./chunk-JC6L2VEG.js";
import "./chunk-FMM4ZAHG.js";
import {
  script
} from "./chunk-NGZOCDJP.js";
import "./chunk-EOSUVNFN.js";
import {
  BaseStyle
} from "./chunk-7JRSUUYR.js";
import {
  Transition,
  createBaseVNode,
  createBlock,
  createCommentVNode,
  createElementBlock,
  mergeProps,
  normalizeClass,
  openBlock,
  renderSlot,
  resolveComponent,
  resolveDirective,
  resolveDynamicComponent,
  vShow,
  withCtx,
  withDirectives
} from "./chunk-Y7TKRIWE.js";
import {
  f
} from "./chunk-HCE7UK4C.js";
import "./chunk-GFKAIPHP.js";

// node_modules/@primeuix/styles/dist/message/index.mjs
var style = "\n    .p-message {\n        border-radius: dt('message.border.radius');\n        outline-width: dt('message.border.width');\n        outline-style: solid;\n    }\n\n    .p-message-content {\n        display: flex;\n        align-items: center;\n        padding: dt('message.content.padding');\n        gap: dt('message.content.gap');\n        height: 100%;\n    }\n\n    .p-message-icon {\n        flex-shrink: 0;\n    }\n\n    .p-message-close-button {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-shrink: 0;\n        margin-inline-start: auto;\n        overflow: hidden;\n        position: relative;\n        width: dt('message.close.button.width');\n        height: dt('message.close.button.height');\n        border-radius: dt('message.close.button.border.radius');\n        background: transparent;\n        transition:\n            background dt('message.transition.duration'),\n            color dt('message.transition.duration'),\n            outline-color dt('message.transition.duration'),\n            box-shadow dt('message.transition.duration'),\n            opacity 0.3s;\n        outline-color: transparent;\n        color: inherit;\n        padding: 0;\n        border: none;\n        cursor: pointer;\n        user-select: none;\n    }\n\n    .p-message-close-icon {\n        font-size: dt('message.close.icon.size');\n        width: dt('message.close.icon.size');\n        height: dt('message.close.icon.size');\n    }\n\n    .p-message-close-button:focus-visible {\n        outline-width: dt('message.close.button.focus.ring.width');\n        outline-style: dt('message.close.button.focus.ring.style');\n        outline-offset: dt('message.close.button.focus.ring.offset');\n    }\n\n    .p-message-info {\n        background: dt('message.info.background');\n        outline-color: dt('message.info.border.color');\n        color: dt('message.info.color');\n        box-shadow: dt('message.info.shadow');\n    }\n\n    .p-message-info .p-message-close-button:focus-visible {\n        outline-color: dt('message.info.close.button.focus.ring.color');\n        box-shadow: dt('message.info.close.button.focus.ring.shadow');\n    }\n\n    .p-message-info .p-message-close-button:hover {\n        background: dt('message.info.close.button.hover.background');\n    }\n\n    .p-message-info.p-message-outlined {\n        color: dt('message.info.outlined.color');\n        outline-color: dt('message.info.outlined.border.color');\n    }\n\n    .p-message-info.p-message-simple {\n        color: dt('message.info.simple.color');\n    }\n\n    .p-message-success {\n        background: dt('message.success.background');\n        outline-color: dt('message.success.border.color');\n        color: dt('message.success.color');\n        box-shadow: dt('message.success.shadow');\n    }\n\n    .p-message-success .p-message-close-button:focus-visible {\n        outline-color: dt('message.success.close.button.focus.ring.color');\n        box-shadow: dt('message.success.close.button.focus.ring.shadow');\n    }\n\n    .p-message-success .p-message-close-button:hover {\n        background: dt('message.success.close.button.hover.background');\n    }\n\n    .p-message-success.p-message-outlined {\n        color: dt('message.success.outlined.color');\n        outline-color: dt('message.success.outlined.border.color');\n    }\n\n    .p-message-success.p-message-simple {\n        color: dt('message.success.simple.color');\n    }\n\n    .p-message-warn {\n        background: dt('message.warn.background');\n        outline-color: dt('message.warn.border.color');\n        color: dt('message.warn.color');\n        box-shadow: dt('message.warn.shadow');\n    }\n\n    .p-message-warn .p-message-close-button:focus-visible {\n        outline-color: dt('message.warn.close.button.focus.ring.color');\n        box-shadow: dt('message.warn.close.button.focus.ring.shadow');\n    }\n\n    .p-message-warn .p-message-close-button:hover {\n        background: dt('message.warn.close.button.hover.background');\n    }\n\n    .p-message-warn.p-message-outlined {\n        color: dt('message.warn.outlined.color');\n        outline-color: dt('message.warn.outlined.border.color');\n    }\n\n    .p-message-warn.p-message-simple {\n        color: dt('message.warn.simple.color');\n    }\n\n    .p-message-error {\n        background: dt('message.error.background');\n        outline-color: dt('message.error.border.color');\n        color: dt('message.error.color');\n        box-shadow: dt('message.error.shadow');\n    }\n\n    .p-message-error .p-message-close-button:focus-visible {\n        outline-color: dt('message.error.close.button.focus.ring.color');\n        box-shadow: dt('message.error.close.button.focus.ring.shadow');\n    }\n\n    .p-message-error .p-message-close-button:hover {\n        background: dt('message.error.close.button.hover.background');\n    }\n\n    .p-message-error.p-message-outlined {\n        color: dt('message.error.outlined.color');\n        outline-color: dt('message.error.outlined.border.color');\n    }\n\n    .p-message-error.p-message-simple {\n        color: dt('message.error.simple.color');\n    }\n\n    .p-message-secondary {\n        background: dt('message.secondary.background');\n        outline-color: dt('message.secondary.border.color');\n        color: dt('message.secondary.color');\n        box-shadow: dt('message.secondary.shadow');\n    }\n\n    .p-message-secondary .p-message-close-button:focus-visible {\n        outline-color: dt('message.secondary.close.button.focus.ring.color');\n        box-shadow: dt('message.secondary.close.button.focus.ring.shadow');\n    }\n\n    .p-message-secondary .p-message-close-button:hover {\n        background: dt('message.secondary.close.button.hover.background');\n    }\n\n    .p-message-secondary.p-message-outlined {\n        color: dt('message.secondary.outlined.color');\n        outline-color: dt('message.secondary.outlined.border.color');\n    }\n\n    .p-message-secondary.p-message-simple {\n        color: dt('message.secondary.simple.color');\n    }\n\n    .p-message-contrast {\n        background: dt('message.contrast.background');\n        outline-color: dt('message.contrast.border.color');\n        color: dt('message.contrast.color');\n        box-shadow: dt('message.contrast.shadow');\n    }\n\n    .p-message-contrast .p-message-close-button:focus-visible {\n        outline-color: dt('message.contrast.close.button.focus.ring.color');\n        box-shadow: dt('message.contrast.close.button.focus.ring.shadow');\n    }\n\n    .p-message-contrast .p-message-close-button:hover {\n        background: dt('message.contrast.close.button.hover.background');\n    }\n\n    .p-message-contrast.p-message-outlined {\n        color: dt('message.contrast.outlined.color');\n        outline-color: dt('message.contrast.outlined.border.color');\n    }\n\n    .p-message-contrast.p-message-simple {\n        color: dt('message.contrast.simple.color');\n    }\n\n    .p-message-text {\n        font-size: dt('message.text.font.size');\n        font-weight: dt('message.text.font.weight');\n    }\n\n    .p-message-icon {\n        font-size: dt('message.icon.size');\n        width: dt('message.icon.size');\n        height: dt('message.icon.size');\n    }\n\n    .p-message-enter-from {\n        opacity: 0;\n    }\n\n    .p-message-enter-active {\n        transition: opacity 0.3s;\n    }\n\n    .p-message.p-message-leave-from {\n        max-height: 1000px;\n    }\n\n    .p-message.p-message-leave-to {\n        max-height: 0;\n        opacity: 0;\n        margin: 0;\n    }\n\n    .p-message-leave-active {\n        overflow: hidden;\n        transition:\n            max-height 0.45s cubic-bezier(0, 1, 0, 1),\n            opacity 0.3s,\n            margin 0.3s;\n    }\n\n    .p-message-leave-active .p-message-close-button {\n        opacity: 0;\n    }\n\n    .p-message-sm .p-message-content {\n        padding: dt('message.content.sm.padding');\n    }\n\n    .p-message-sm .p-message-text {\n        font-size: dt('message.text.sm.font.size');\n    }\n\n    .p-message-sm .p-message-icon {\n        font-size: dt('message.icon.sm.size');\n        width: dt('message.icon.sm.size');\n        height: dt('message.icon.sm.size');\n    }\n\n    .p-message-sm .p-message-close-icon {\n        font-size: dt('message.close.icon.sm.size');\n        width: dt('message.close.icon.sm.size');\n        height: dt('message.close.icon.sm.size');\n    }\n\n    .p-message-lg .p-message-content {\n        padding: dt('message.content.lg.padding');\n    }\n\n    .p-message-lg .p-message-text {\n        font-size: dt('message.text.lg.font.size');\n    }\n\n    .p-message-lg .p-message-icon {\n        font-size: dt('message.icon.lg.size');\n        width: dt('message.icon.lg.size');\n        height: dt('message.icon.lg.size');\n    }\n\n    .p-message-lg .p-message-close-icon {\n        font-size: dt('message.close.icon.lg.size');\n        width: dt('message.close.icon.lg.size');\n        height: dt('message.close.icon.lg.size');\n    }\n\n    .p-message-outlined {\n        background: transparent;\n        outline-width: dt('message.outlined.border.width');\n    }\n\n    .p-message-simple {\n        background: transparent;\n        outline-color: transparent;\n        box-shadow: none;\n    }\n\n    .p-message-simple .p-message-content {\n        padding: dt('message.simple.content.padding');\n    }\n\n    .p-message-outlined .p-message-close-button:hover,\n    .p-message-simple .p-message-close-button:hover {\n        background: transparent;\n    }\n";

// node_modules/primevue/message/style/index.mjs
var classes = {
  root: function root(_ref) {
    var props = _ref.props;
    return ["p-message p-component p-message-" + props.severity, {
      "p-message-outlined": props.variant === "outlined",
      "p-message-simple": props.variant === "simple",
      "p-message-sm": props.size === "small",
      "p-message-lg": props.size === "large"
    }];
  },
  content: "p-message-content",
  icon: "p-message-icon",
  text: "p-message-text",
  closeButton: "p-message-close-button",
  closeIcon: "p-message-close-icon"
};
var MessageStyle = BaseStyle.extend({
  name: "message",
  style,
  classes
});

// node_modules/primevue/message/index.mjs
var script$1 = {
  name: "BaseMessage",
  "extends": script,
  props: {
    severity: {
      type: String,
      "default": "info"
    },
    closable: {
      type: Boolean,
      "default": false
    },
    life: {
      type: Number,
      "default": null
    },
    icon: {
      type: String,
      "default": void 0
    },
    closeIcon: {
      type: String,
      "default": void 0
    },
    closeButtonProps: {
      type: null,
      "default": null
    },
    size: {
      type: String,
      "default": null
    },
    variant: {
      type: String,
      "default": null
    }
  },
  style: MessageStyle,
  provide: function provide() {
    return {
      $pcMessage: this,
      $parentInstance: this
    };
  }
};
function _typeof$1(o) {
  "@babel/helpers - typeof";
  return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$1(o);
}
function _defineProperty$1(e, r, t) {
  return (r = _toPropertyKey$1(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$1(t) {
  var i = _toPrimitive$1(t, "string");
  return "symbol" == _typeof$1(i) ? i : i + "";
}
function _toPrimitive$1(t, r) {
  if ("object" != _typeof$1(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != _typeof$1(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var script3 = {
  name: "Message",
  "extends": script$1,
  inheritAttrs: false,
  emits: ["close", "life-end"],
  timeout: null,
  data: function data() {
    return {
      visible: true
    };
  },
  mounted: function mounted() {
    var _this = this;
    if (this.life) {
      setTimeout(function() {
        _this.visible = false;
        _this.$emit("life-end");
      }, this.life);
    }
  },
  methods: {
    close: function close(event) {
      this.visible = false;
      this.$emit("close", event);
    }
  },
  computed: {
    closeAriaLabel: function closeAriaLabel() {
      return this.$primevue.config.locale.aria ? this.$primevue.config.locale.aria.close : void 0;
    },
    dataP: function dataP() {
      return f(_defineProperty$1(_defineProperty$1({
        outlined: this.variant === "outlined",
        simple: this.variant === "simple"
      }, this.severity, this.severity), this.size, this.size));
    }
  },
  directives: {
    ripple: Ripple
  },
  components: {
    TimesIcon: script2
  }
};
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var _hoisted_1 = ["data-p"];
var _hoisted_2 = ["data-p"];
var _hoisted_3 = ["data-p"];
var _hoisted_4 = ["aria-label", "data-p"];
var _hoisted_5 = ["data-p"];
function render(_ctx, _cache, $props, $setup, $data, $options) {
  var _component_TimesIcon = resolveComponent("TimesIcon");
  var _directive_ripple = resolveDirective("ripple");
  return openBlock(), createBlock(Transition, mergeProps({
    name: "p-message",
    appear: ""
  }, _ctx.ptmi("transition")), {
    "default": withCtx(function() {
      return [withDirectives(createBaseVNode("div", mergeProps({
        "class": _ctx.cx("root"),
        role: "alert",
        "aria-live": "assertive",
        "aria-atomic": "true",
        "data-p": $options.dataP
      }, _ctx.ptm("root")), [_ctx.$slots.container ? renderSlot(_ctx.$slots, "container", {
        key: 0,
        closeCallback: $options.close
      }) : (openBlock(), createElementBlock("div", mergeProps({
        key: 1,
        "class": _ctx.cx("content"),
        "data-p": $options.dataP
      }, _ctx.ptm("content")), [renderSlot(_ctx.$slots, "icon", {
        "class": normalizeClass(_ctx.cx("icon"))
      }, function() {
        return [(openBlock(), createBlock(resolveDynamicComponent(_ctx.icon ? "span" : null), mergeProps({
          "class": [_ctx.cx("icon"), _ctx.icon],
          "data-p": $options.dataP
        }, _ctx.ptm("icon")), null, 16, ["class", "data-p"]))];
      }), _ctx.$slots["default"] ? (openBlock(), createElementBlock("div", mergeProps({
        key: 0,
        "class": _ctx.cx("text"),
        "data-p": $options.dataP
      }, _ctx.ptm("text")), [renderSlot(_ctx.$slots, "default")], 16, _hoisted_3)) : createCommentVNode("", true), _ctx.closable ? withDirectives((openBlock(), createElementBlock("button", mergeProps({
        key: 1,
        "class": _ctx.cx("closeButton"),
        "aria-label": $options.closeAriaLabel,
        type: "button",
        onClick: _cache[0] || (_cache[0] = function($event) {
          return $options.close($event);
        }),
        "data-p": $options.dataP
      }, _objectSpread(_objectSpread({}, _ctx.closeButtonProps), _ctx.ptm("closeButton"))), [renderSlot(_ctx.$slots, "closeicon", {}, function() {
        return [_ctx.closeIcon ? (openBlock(), createElementBlock("i", mergeProps({
          key: 0,
          "class": [_ctx.cx("closeIcon"), _ctx.closeIcon],
          "data-p": $options.dataP
        }, _ctx.ptm("closeIcon")), null, 16, _hoisted_5)) : (openBlock(), createBlock(_component_TimesIcon, mergeProps({
          key: 1,
          "class": [_ctx.cx("closeIcon"), _ctx.closeIcon],
          "data-p": $options.dataP
        }, _ctx.ptm("closeIcon")), null, 16, ["class", "data-p"]))];
      })], 16, _hoisted_4)), [[_directive_ripple]]) : createCommentVNode("", true)], 16, _hoisted_2))], 16, _hoisted_1), [[vShow, $data.visible]])];
    }),
    _: 3
  }, 16);
}
script3.render = render;
export {
  script3 as default
};
//# sourceMappingURL=primevue_message.js.map
