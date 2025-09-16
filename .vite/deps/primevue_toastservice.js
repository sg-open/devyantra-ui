import {
  ToastEventBus
} from "./chunk-7W3SA6Z3.js";
import "./chunk-Y7TKRIWE.js";
import "./chunk-GFKAIPHP.js";

// node_modules/primevue/usetoast/index.mjs
var PrimeVueToastSymbol = Symbol();

// node_modules/primevue/toastservice/index.mjs
var ToastService = {
  install: function install(app) {
    var ToastService2 = {
      add: function add(message) {
        ToastEventBus.emit("add", message);
      },
      remove: function remove(message) {
        ToastEventBus.emit("remove", message);
      },
      removeGroup: function removeGroup(group) {
        ToastEventBus.emit("remove-group", group);
      },
      removeAllGroups: function removeAllGroups() {
        ToastEventBus.emit("remove-all-groups");
      }
    };
    app.config.globalProperties.$toast = ToastService2;
    app.provide(PrimeVueToastSymbol, ToastService2);
  }
};
export {
  ToastService as default
};
//# sourceMappingURL=primevue_toastservice.js.map
