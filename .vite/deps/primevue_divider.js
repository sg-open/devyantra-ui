import {
  script
} from "./chunk-NGZOCDJP.js";
import "./chunk-EOSUVNFN.js";
import {
  BaseStyle
} from "./chunk-7JRSUUYR.js";
import {
  createCommentVNode,
  createElementBlock,
  mergeProps,
  openBlock,
  renderSlot
} from "./chunk-Y7TKRIWE.js";
import {
  f
} from "./chunk-HCE7UK4C.js";
import "./chunk-GFKAIPHP.js";

// node_modules/@primeuix/styles/dist/divider/index.mjs
var style = "\n    .p-divider-horizontal {\n        display: flex;\n        width: 100%;\n        position: relative;\n        align-items: center;\n        margin: dt('divider.horizontal.margin');\n        padding: dt('divider.horizontal.padding');\n    }\n\n    .p-divider-horizontal:before {\n        position: absolute;\n        display: block;\n        inset-block-start: 50%;\n        inset-inline-start: 0;\n        width: 100%;\n        content: '';\n        border-block-start: 1px solid dt('divider.border.color');\n    }\n\n    .p-divider-horizontal .p-divider-content {\n        padding: dt('divider.horizontal.content.padding');\n    }\n\n    .p-divider-vertical {\n        min-height: 100%;\n        display: flex;\n        position: relative;\n        justify-content: center;\n        margin: dt('divider.vertical.margin');\n        padding: dt('divider.vertical.padding');\n    }\n\n    .p-divider-vertical:before {\n        position: absolute;\n        display: block;\n        inset-block-start: 0;\n        inset-inline-start: 50%;\n        height: 100%;\n        content: '';\n        border-inline-start: 1px solid dt('divider.border.color');\n    }\n\n    .p-divider.p-divider-vertical .p-divider-content {\n        padding: dt('divider.vertical.content.padding');\n    }\n\n    .p-divider-content {\n        z-index: 1;\n        background: dt('divider.content.background');\n        color: dt('divider.content.color');\n    }\n\n    .p-divider-solid.p-divider-horizontal:before {\n        border-block-start-style: solid;\n    }\n\n    .p-divider-solid.p-divider-vertical:before {\n        border-inline-start-style: solid;\n    }\n\n    .p-divider-dashed.p-divider-horizontal:before {\n        border-block-start-style: dashed;\n    }\n\n    .p-divider-dashed.p-divider-vertical:before {\n        border-inline-start-style: dashed;\n    }\n\n    .p-divider-dotted.p-divider-horizontal:before {\n        border-block-start-style: dotted;\n    }\n\n    .p-divider-dotted.p-divider-vertical:before {\n        border-inline-start-style: dotted;\n    }\n\n    .p-divider-left:dir(rtl),\n    .p-divider-right:dir(rtl) {\n        flex-direction: row-reverse;\n    }\n";

// node_modules/primevue/divider/style/index.mjs
var inlineStyles = {
  root: function root(_ref) {
    var props = _ref.props;
    return {
      justifyContent: props.layout === "horizontal" ? props.align === "center" || props.align === null ? "center" : props.align === "left" ? "flex-start" : props.align === "right" ? "flex-end" : null : null,
      alignItems: props.layout === "vertical" ? props.align === "center" || props.align === null ? "center" : props.align === "top" ? "flex-start" : props.align === "bottom" ? "flex-end" : null : null
    };
  }
};
var classes = {
  root: function root2(_ref2) {
    var props = _ref2.props;
    return ["p-divider p-component", "p-divider-" + props.layout, "p-divider-" + props.type, {
      "p-divider-left": props.layout === "horizontal" && (!props.align || props.align === "left")
    }, {
      "p-divider-center": props.layout === "horizontal" && props.align === "center"
    }, {
      "p-divider-right": props.layout === "horizontal" && props.align === "right"
    }, {
      "p-divider-top": props.layout === "vertical" && props.align === "top"
    }, {
      "p-divider-center": props.layout === "vertical" && (!props.align || props.align === "center")
    }, {
      "p-divider-bottom": props.layout === "vertical" && props.align === "bottom"
    }];
  },
  content: "p-divider-content"
};
var DividerStyle = BaseStyle.extend({
  name: "divider",
  style,
  classes,
  inlineStyles
});

// node_modules/primevue/divider/index.mjs
var script$1 = {
  name: "BaseDivider",
  "extends": script,
  props: {
    align: {
      type: String,
      "default": null
    },
    layout: {
      type: String,
      "default": "horizontal"
    },
    type: {
      type: String,
      "default": "solid"
    }
  },
  style: DividerStyle,
  provide: function provide() {
    return {
      $pcDivider: this,
      $parentInstance: this
    };
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
var script2 = {
  name: "Divider",
  "extends": script$1,
  inheritAttrs: false,
  computed: {
    dataP: function dataP() {
      return f(_defineProperty(_defineProperty(_defineProperty({}, this.align, this.align), this.layout, this.layout), this.type, this.type));
    }
  }
};
var _hoisted_1 = ["aria-orientation", "data-p"];
var _hoisted_2 = ["data-p"];
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", mergeProps({
    "class": _ctx.cx("root"),
    style: _ctx.sx("root"),
    role: "separator",
    "aria-orientation": _ctx.layout,
    "data-p": $options.dataP
  }, _ctx.ptmi("root")), [_ctx.$slots["default"] ? (openBlock(), createElementBlock("div", mergeProps({
    key: 0,
    "class": _ctx.cx("content"),
    "data-p": $options.dataP
  }, _ctx.ptm("content")), [renderSlot(_ctx.$slots, "default")], 16, _hoisted_2)) : createCommentVNode("", true)], 16, _hoisted_1);
}
script2.render = render;
export {
  script2 as default
};
//# sourceMappingURL=primevue_divider.js.map
