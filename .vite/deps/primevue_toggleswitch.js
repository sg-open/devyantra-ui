import {
  script
} from "./chunk-BJOQP2CR.js";
import "./chunk-NGZOCDJP.js";
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
import {
  f
} from "./chunk-HCE7UK4C.js";
import "./chunk-GFKAIPHP.js";

// node_modules/@primeuix/styles/dist/toggleswitch/index.mjs
var style = "\n    .p-toggleswitch {\n        display: inline-block;\n        width: dt('toggleswitch.width');\n        height: dt('toggleswitch.height');\n    }\n\n    .p-toggleswitch-input {\n        cursor: pointer;\n        appearance: none;\n        position: absolute;\n        top: 0;\n        inset-inline-start: 0;\n        width: 100%;\n        height: 100%;\n        padding: 0;\n        margin: 0;\n        opacity: 0;\n        z-index: 1;\n        outline: 0 none;\n        border-radius: dt('toggleswitch.border.radius');\n    }\n\n    .p-toggleswitch-slider {\n        cursor: pointer;\n        width: 100%;\n        height: 100%;\n        border-width: dt('toggleswitch.border.width');\n        border-style: solid;\n        border-color: dt('toggleswitch.border.color');\n        background: dt('toggleswitch.background');\n        transition:\n            background dt('toggleswitch.transition.duration'),\n            color dt('toggleswitch.transition.duration'),\n            border-color dt('toggleswitch.transition.duration'),\n            outline-color dt('toggleswitch.transition.duration'),\n            box-shadow dt('toggleswitch.transition.duration');\n        border-radius: dt('toggleswitch.border.radius');\n        outline-color: transparent;\n        box-shadow: dt('toggleswitch.shadow');\n    }\n\n    .p-toggleswitch-handle {\n        position: absolute;\n        top: 50%;\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        background: dt('toggleswitch.handle.background');\n        color: dt('toggleswitch.handle.color');\n        width: dt('toggleswitch.handle.size');\n        height: dt('toggleswitch.handle.size');\n        inset-inline-start: dt('toggleswitch.gap');\n        margin-block-start: calc(-1 * calc(dt('toggleswitch.handle.size') / 2));\n        border-radius: dt('toggleswitch.handle.border.radius');\n        transition:\n            background dt('toggleswitch.transition.duration'),\n            color dt('toggleswitch.transition.duration'),\n            inset-inline-start dt('toggleswitch.slide.duration'),\n            box-shadow dt('toggleswitch.slide.duration');\n    }\n\n    .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider {\n        background: dt('toggleswitch.checked.background');\n        border-color: dt('toggleswitch.checked.border.color');\n    }\n\n    .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-handle {\n        background: dt('toggleswitch.handle.checked.background');\n        color: dt('toggleswitch.handle.checked.color');\n        inset-inline-start: calc(dt('toggleswitch.width') - calc(dt('toggleswitch.handle.size') + dt('toggleswitch.gap')));\n    }\n\n    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover) .p-toggleswitch-slider {\n        background: dt('toggleswitch.hover.background');\n        border-color: dt('toggleswitch.hover.border.color');\n    }\n\n    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover) .p-toggleswitch-handle {\n        background: dt('toggleswitch.handle.hover.background');\n        color: dt('toggleswitch.handle.hover.color');\n    }\n\n    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover).p-toggleswitch-checked .p-toggleswitch-slider {\n        background: dt('toggleswitch.checked.hover.background');\n        border-color: dt('toggleswitch.checked.hover.border.color');\n    }\n\n    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover).p-toggleswitch-checked .p-toggleswitch-handle {\n        background: dt('toggleswitch.handle.checked.hover.background');\n        color: dt('toggleswitch.handle.checked.hover.color');\n    }\n\n    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:focus-visible) .p-toggleswitch-slider {\n        box-shadow: dt('toggleswitch.focus.ring.shadow');\n        outline: dt('toggleswitch.focus.ring.width') dt('toggleswitch.focus.ring.style') dt('toggleswitch.focus.ring.color');\n        outline-offset: dt('toggleswitch.focus.ring.offset');\n    }\n\n    .p-toggleswitch.p-invalid > .p-toggleswitch-slider {\n        border-color: dt('toggleswitch.invalid.border.color');\n    }\n\n    .p-toggleswitch.p-disabled {\n        opacity: 1;\n    }\n\n    .p-toggleswitch.p-disabled .p-toggleswitch-slider {\n        background: dt('toggleswitch.disabled.background');\n    }\n\n    .p-toggleswitch.p-disabled .p-toggleswitch-handle {\n        background: dt('toggleswitch.handle.disabled.background');\n    }\n";

// node_modules/primevue/toggleswitch/style/index.mjs
var inlineStyles = {
  root: {
    position: "relative"
  }
};
var classes = {
  root: function root(_ref) {
    var instance = _ref.instance, props = _ref.props;
    return ["p-toggleswitch p-component", {
      "p-toggleswitch-checked": instance.checked,
      "p-disabled": props.disabled,
      "p-invalid": instance.$invalid
    }];
  },
  input: "p-toggleswitch-input",
  slider: "p-toggleswitch-slider",
  handle: "p-toggleswitch-handle"
};
var ToggleSwitchStyle = BaseStyle.extend({
  name: "toggleswitch",
  style,
  classes,
  inlineStyles
});

// node_modules/primevue/toggleswitch/index.mjs
var script$1 = {
  name: "BaseToggleSwitch",
  "extends": script,
  props: {
    trueValue: {
      type: null,
      "default": true
    },
    falseValue: {
      type: null,
      "default": false
    },
    readonly: {
      type: Boolean,
      "default": false
    },
    tabindex: {
      type: Number,
      "default": null
    },
    inputId: {
      type: String,
      "default": null
    },
    inputClass: {
      type: [String, Object],
      "default": null
    },
    inputStyle: {
      type: Object,
      "default": null
    },
    ariaLabelledby: {
      type: String,
      "default": null
    },
    ariaLabel: {
      type: String,
      "default": null
    }
  },
  style: ToggleSwitchStyle,
  provide: function provide() {
    return {
      $pcToggleSwitch: this,
      $parentInstance: this
    };
  }
};
var script2 = {
  name: "ToggleSwitch",
  "extends": script$1,
  inheritAttrs: false,
  emits: ["change", "focus", "blur"],
  methods: {
    getPTOptions: function getPTOptions(key) {
      var _ptm = key === "root" ? this.ptmi : this.ptm;
      return _ptm(key, {
        context: {
          checked: this.checked,
          disabled: this.disabled
        }
      });
    },
    onChange: function onChange(event) {
      if (!this.disabled && !this.readonly) {
        var newValue = this.checked ? this.falseValue : this.trueValue;
        this.writeValue(newValue, event);
        this.$emit("change", event);
      }
    },
    onFocus: function onFocus(event) {
      this.$emit("focus", event);
    },
    onBlur: function onBlur(event) {
      var _this$formField$onBlu, _this$formField;
      this.$emit("blur", event);
      (_this$formField$onBlu = (_this$formField = this.formField).onBlur) === null || _this$formField$onBlu === void 0 || _this$formField$onBlu.call(_this$formField, event);
    }
  },
  computed: {
    checked: function checked() {
      return this.d_value === this.trueValue;
    },
    dataP: function dataP() {
      return f({
        checked: this.checked,
        disabled: this.disabled,
        invalid: this.$invalid
      });
    }
  }
};
var _hoisted_1 = ["data-p-checked", "data-p-disabled", "data-p"];
var _hoisted_2 = ["id", "checked", "tabindex", "disabled", "readonly", "aria-checked", "aria-labelledby", "aria-label", "aria-invalid"];
var _hoisted_3 = ["data-p"];
var _hoisted_4 = ["data-p"];
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", mergeProps({
    "class": _ctx.cx("root"),
    style: _ctx.sx("root")
  }, $options.getPTOptions("root"), {
    "data-p-checked": $options.checked,
    "data-p-disabled": _ctx.disabled,
    "data-p": $options.dataP
  }), [createBaseVNode("input", mergeProps({
    id: _ctx.inputId,
    type: "checkbox",
    role: "switch",
    "class": [_ctx.cx("input"), _ctx.inputClass],
    style: _ctx.inputStyle,
    checked: $options.checked,
    tabindex: _ctx.tabindex,
    disabled: _ctx.disabled,
    readonly: _ctx.readonly,
    "aria-checked": $options.checked,
    "aria-labelledby": _ctx.ariaLabelledby,
    "aria-label": _ctx.ariaLabel,
    "aria-invalid": _ctx.invalid || void 0,
    onFocus: _cache[0] || (_cache[0] = function() {
      return $options.onFocus && $options.onFocus.apply($options, arguments);
    }),
    onBlur: _cache[1] || (_cache[1] = function() {
      return $options.onBlur && $options.onBlur.apply($options, arguments);
    }),
    onChange: _cache[2] || (_cache[2] = function() {
      return $options.onChange && $options.onChange.apply($options, arguments);
    })
  }, $options.getPTOptions("input")), null, 16, _hoisted_2), createBaseVNode("div", mergeProps({
    "class": _ctx.cx("slider")
  }, $options.getPTOptions("slider"), {
    "data-p": $options.dataP
  }), [createBaseVNode("div", mergeProps({
    "class": _ctx.cx("handle")
  }, $options.getPTOptions("handle"), {
    "data-p": $options.dataP
  }), [renderSlot(_ctx.$slots, "handle", {
    checked: $options.checked
  })], 16, _hoisted_4)], 16, _hoisted_3)], 16, _hoisted_1);
}
script2.render = render;
export {
  script2 as default
};
//# sourceMappingURL=primevue_toggleswitch.js.map
