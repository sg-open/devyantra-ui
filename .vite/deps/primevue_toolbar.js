import {
  script
} from "./chunk-NGZOCDJP.js";
import "./chunk-EOSUVNFN.js";
import {
  BaseStyle
} from "./chunk-7JRSUUYR.js";
import {
  createBaseVNode,
  createElementBlock,
  mergeProps,
  openBlock,
  renderSlot
} from "./chunk-Y7TKRIWE.js";
import "./chunk-HCE7UK4C.js";
import "./chunk-GFKAIPHP.js";

// node_modules/@primeuix/styles/dist/toolbar/index.mjs
var style = "\n    .p-toolbar {\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n        flex-wrap: wrap;\n        padding: dt('toolbar.padding');\n        background: dt('toolbar.background');\n        border: 1px solid dt('toolbar.border.color');\n        color: dt('toolbar.color');\n        border-radius: dt('toolbar.border.radius');\n        gap: dt('toolbar.gap');\n    }\n\n    .p-toolbar-start,\n    .p-toolbar-center,\n    .p-toolbar-end {\n        display: flex;\n        align-items: center;\n    }\n";

// node_modules/primevue/toolbar/style/index.mjs
var classes = {
  root: "p-toolbar p-component",
  start: "p-toolbar-start",
  center: "p-toolbar-center",
  end: "p-toolbar-end"
};
var ToolbarStyle = BaseStyle.extend({
  name: "toolbar",
  style,
  classes
});

// node_modules/primevue/toolbar/index.mjs
var script$1 = {
  name: "BaseToolbar",
  "extends": script,
  props: {
    ariaLabelledby: {
      type: String,
      "default": null
    }
  },
  style: ToolbarStyle,
  provide: function provide() {
    return {
      $pcToolbar: this,
      $parentInstance: this
    };
  }
};
var script2 = {
  name: "Toolbar",
  "extends": script$1,
  inheritAttrs: false
};
var _hoisted_1 = ["aria-labelledby"];
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", mergeProps({
    "class": _ctx.cx("root"),
    role: "toolbar",
    "aria-labelledby": _ctx.ariaLabelledby
  }, _ctx.ptmi("root")), [createBaseVNode("div", mergeProps({
    "class": _ctx.cx("start")
  }, _ctx.ptm("start")), [renderSlot(_ctx.$slots, "start")], 16), createBaseVNode("div", mergeProps({
    "class": _ctx.cx("center")
  }, _ctx.ptm("center")), [renderSlot(_ctx.$slots, "center")], 16), createBaseVNode("div", mergeProps({
    "class": _ctx.cx("end")
  }, _ctx.ptm("end")), [renderSlot(_ctx.$slots, "end")], 16)], 16, _hoisted_1);
}
script2.render = render;
export {
  script2 as default
};
//# sourceMappingURL=primevue_toolbar.js.map
