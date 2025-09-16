import {
  s
} from "./chunk-GFKAIPHP.js";

// node_modules/@primeuix/utils/dist/object/index.mjs
var oe = Object.defineProperty;
var K = Object.getOwnPropertySymbols;
var ue = Object.prototype.hasOwnProperty;
var fe = Object.prototype.propertyIsEnumerable;
var N = (e, t2, n) => t2 in e ? oe(e, t2, { enumerable: true, configurable: true, writable: true, value: n }) : e[t2] = n;
var d = (e, t2) => {
  for (var n in t2 || (t2 = {})) ue.call(t2, n) && N(e, n, t2[n]);
  if (K) for (var n of K(t2)) fe.call(t2, n) && N(e, n, t2[n]);
  return e;
};
function a(e) {
  return e == null || e === "" || Array.isArray(e) && e.length === 0 || !(e instanceof Date) && typeof e == "object" && Object.keys(e).length === 0;
}
function R(e, t2, n = /* @__PURE__ */ new WeakSet()) {
  if (e === t2) return true;
  if (!e || !t2 || typeof e != "object" || typeof t2 != "object" || n.has(e) || n.has(t2)) return false;
  n.add(e).add(t2);
  let r = Array.isArray(e), o = Array.isArray(t2), u, f2, h2;
  if (r && o) {
    if (f2 = e.length, f2 != t2.length) return false;
    for (u = f2; u-- !== 0; ) if (!R(e[u], t2[u], n)) return false;
    return true;
  }
  if (r != o) return false;
  let A2 = e instanceof Date, S2 = t2 instanceof Date;
  if (A2 != S2) return false;
  if (A2 && S2) return e.getTime() == t2.getTime();
  let I = e instanceof RegExp, L = t2 instanceof RegExp;
  if (I != L) return false;
  if (I && L) return e.toString() == t2.toString();
  let O2 = Object.keys(e);
  if (f2 = O2.length, f2 !== Object.keys(t2).length) return false;
  for (u = f2; u-- !== 0; ) if (!Object.prototype.hasOwnProperty.call(t2, O2[u])) return false;
  for (u = f2; u-- !== 0; ) if (h2 = O2[u], !R(e[h2], t2[h2], n)) return false;
  return true;
}
function y(e, t2) {
  return R(e, t2);
}
function l(e) {
  return typeof e == "function" && "call" in e && "apply" in e;
}
function s2(e) {
  return !a(e);
}
function c(e, t2) {
  if (!e || !t2) return null;
  try {
    let n = e[t2];
    if (s2(n)) return n;
  } catch (n) {
  }
  if (Object.keys(e).length) {
    if (l(t2)) return t2(e);
    if (t2.indexOf(".") === -1) return e[t2];
    {
      let n = t2.split("."), r = e;
      for (let o = 0, u = n.length; o < u; ++o) {
        if (r == null) return null;
        r = r[n[o]];
      }
      return r;
    }
  }
  return null;
}
function k(e, t2, n) {
  return n ? c(e, n) === c(t2, n) : y(e, t2);
}
function i(e, t2 = true) {
  return e instanceof Object && e.constructor === Object && (t2 || Object.keys(e).length !== 0);
}
function $(e = {}, t2 = {}) {
  let n = d({}, e);
  return Object.keys(t2).forEach((r) => {
    let o = r;
    i(t2[o]) && o in e && i(e[o]) ? n[o] = $(e[o], t2[o]) : n[o] = t2[o];
  }), n;
}
function w(...e) {
  return e.reduce((t2, n, r) => r === 0 ? n : $(t2, n), {});
}
function m(e, ...t2) {
  return l(e) ? e(...t2) : e;
}
function p(e, t2 = true) {
  return typeof e == "string" && (t2 || e !== "");
}
function g(e) {
  return p(e) ? e.replace(/(-|_)/g, "").toLowerCase() : e;
}
function F(e, t2 = "", n = {}) {
  let r = g(t2).split("."), o = r.shift();
  if (o) {
    if (i(e)) {
      let u = Object.keys(e).find((f2) => g(f2) === o) || "";
      return F(m(e[u], n), r.join("."), n);
    }
    return;
  }
  return m(e, n);
}
function b(e, t2 = true) {
  return Array.isArray(e) && (t2 || e.length !== 0);
}
function _(e) {
  return s2(e) && !isNaN(e);
}
function z(e, t2) {
  if (t2) {
    let n = t2.test(e);
    return t2.lastIndex = 0, n;
  }
  return false;
}
function U(...e) {
  return w(...e);
}
function G(e) {
  return e && e.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, "").replace(/ {2,}/g, " ").replace(/ ([{:}]) /g, "$1").replace(/([;,]) /g, "$1").replace(/ !/g, "!").replace(/: /g, ":").trim();
}
function v(e) {
  return p(e, false) ? e[0].toUpperCase() + e.slice(1) : e;
}
function ee(e) {
  return p(e) ? e.replace(/(_)/g, "-").replace(/[A-Z]/g, (t2, n) => n === 0 ? t2 : "-" + t2.toLowerCase()).toLowerCase() : e;
}

// node_modules/@primeuix/utils/dist/classnames/index.mjs
function f(...e) {
  if (e) {
    let t2 = [];
    for (let i2 = 0; i2 < e.length; i2++) {
      let n = e[i2];
      if (!n) continue;
      let s4 = typeof n;
      if (s4 === "string" || s4 === "number") t2.push(n);
      else if (s4 === "object") {
        let c2 = Array.isArray(n) ? [f(...n)] : Object.entries(n).map(([r, o]) => o ? r : void 0);
        t2 = c2.length ? t2.concat(c2.filter((r) => !!r)) : t2;
      }
    }
    return t2.join(" ").trim();
  }
}

// node_modules/@primeuix/utils/dist/dom/index.mjs
function R2(t2, e) {
  return t2 ? t2.classList ? t2.classList.contains(e) : new RegExp("(^| )" + e + "( |$)", "gi").test(t2.className) : false;
}
function W(t2, e) {
  if (t2 && e) {
    let o = (n) => {
      R2(t2, n) || (t2.classList ? t2.classList.add(n) : t2.className += " " + n);
    };
    [e].flat().filter(Boolean).forEach((n) => n.split(" ").forEach(o));
  }
}
function O(t2, e) {
  if (t2 && e) {
    let o = (n) => {
      t2.classList ? t2.classList.remove(n) : t2.className = t2.className.replace(new RegExp("(^|\\b)" + n.split(" ").join("|") + "(\\b|$)", "gi"), " ");
    };
    [e].flat().filter(Boolean).forEach((n) => n.split(" ").forEach(o));
  }
}
function h() {
  let t2 = window, e = document, o = e.documentElement, n = e.getElementsByTagName("body")[0], r = t2.innerWidth || o.clientWidth || n.clientWidth, i2 = t2.innerHeight || o.clientHeight || n.clientHeight;
  return { width: r, height: i2 };
}
function E(t2) {
  return t2 ? Math.abs(t2.scrollLeft) : 0;
}
function k2() {
  let t2 = document.documentElement;
  return (window.pageXOffset || E(t2)) - (t2.clientLeft || 0);
}
function $2() {
  let t2 = document.documentElement;
  return (window.pageYOffset || t2.scrollTop) - (t2.clientTop || 0);
}
function v2(t2, e) {
  if (t2 instanceof HTMLElement) {
    let o = t2.offsetWidth;
    if (e) {
      let n = getComputedStyle(t2);
      o += parseFloat(n.marginLeft) + parseFloat(n.marginRight);
    }
    return o;
  }
  return 0;
}
function y2(t2) {
  if (t2) {
    let e = t2.parentNode;
    return e && e instanceof ShadowRoot && e.host && (e = e.host), e;
  }
  return null;
}
function T(t2) {
  return !!(t2 !== null && typeof t2 != "undefined" && t2.nodeName && y2(t2));
}
function p2(t2) {
  return typeof Element != "undefined" ? t2 instanceof Element : t2 !== null && typeof t2 == "object" && t2.nodeType === 1 && typeof t2.nodeName == "string";
}
function A(t2, e = {}) {
  if (p2(t2)) {
    let o = (n, r) => {
      var l2, d2;
      let i2 = (l2 = t2 == null ? void 0 : t2.$attrs) != null && l2[n] ? [(d2 = t2 == null ? void 0 : t2.$attrs) == null ? void 0 : d2[n]] : [];
      return [r].flat().reduce((s4, a2) => {
        if (a2 != null) {
          let u = typeof a2;
          if (u === "string" || u === "number") s4.push(a2);
          else if (u === "object") {
            let c2 = Array.isArray(a2) ? o(n, a2) : Object.entries(a2).map(([f2, g4]) => n === "style" && (g4 || g4 === 0) ? `${f2.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}:${g4}` : g4 ? f2 : void 0);
            s4 = c2.length ? s4.concat(c2.filter((f2) => !!f2)) : s4;
          }
        }
        return s4;
      }, i2);
    };
    Object.entries(e).forEach(([n, r]) => {
      if (r != null) {
        let i2 = n.match(/^on(.+)/);
        i2 ? t2.addEventListener(i2[1].toLowerCase(), r) : n === "p-bind" || n === "pBind" ? A(t2, r) : (r = n === "class" ? [...new Set(o("class", r))].join(" ").trim() : n === "style" ? o("style", r).join(";").trim() : r, (t2.$attrs = t2.$attrs || {}) && (t2.$attrs[n] = r), t2.setAttribute(n, r));
      }
    });
  }
}
function U2(t2, e = {}, ...o) {
  if (t2) {
    let n = document.createElement(t2);
    return A(n, e), n.append(...o), n;
  }
}
function q(t2, e = {}) {
  return t2 ? `<style${Object.entries(e).reduce((o, [n, r]) => o + ` ${n}="${r}"`, "")}>${t2}</style>` : "";
}
function ht(t2, e) {
  if (t2) {
    t2.style.opacity = "0";
    let o = +/* @__PURE__ */ new Date(), n = "0", r = function() {
      n = `${+t2.style.opacity + ((/* @__PURE__ */ new Date()).getTime() - o) / e}`, t2.style.opacity = n, o = +/* @__PURE__ */ new Date(), +n < 1 && ("requestAnimationFrame" in window ? requestAnimationFrame(r) : setTimeout(r, 16));
    };
    r();
  }
}
function z2(t2, e) {
  return p2(t2) ? t2.matches(e) ? t2 : t2.querySelector(e) : null;
}
function bt(t2, e) {
  t2 && document.activeElement !== t2 && t2.focus(e);
}
function Q(t2, e) {
  if (p2(t2)) {
    let o = t2.getAttribute(e);
    return isNaN(o) ? o === "true" || o === "false" ? o === "true" : o : +o;
  }
}
function Tt(t2) {
  if (t2) {
    let e = t2.offsetHeight, o = getComputedStyle(t2);
    return e -= parseFloat(o.paddingTop) + parseFloat(o.paddingBottom) + parseFloat(o.borderTopWidth) + parseFloat(o.borderBottomWidth), e;
  }
  return 0;
}
function K2(t2) {
  if (t2) {
    let e = t2.getBoundingClientRect();
    return { top: e.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0), left: e.left + (window.pageXOffset || E(document.documentElement) || E(document.body) || 0) };
  }
  return { top: "auto", left: "auto" };
}
function C(t2, e) {
  if (t2) {
    let o = t2.offsetHeight;
    if (e) {
      let n = getComputedStyle(t2);
      o += parseFloat(n.marginTop) + parseFloat(n.marginBottom);
    }
    return o;
  }
  return 0;
}
function M(t2, e = []) {
  let o = y2(t2);
  return o === null ? e : M(o, e.concat([o]));
}
function At(t2) {
  let e = [];
  if (t2) {
    let o = M(t2), n = /(auto|scroll)/, r = (i2) => {
      try {
        let l2 = window.getComputedStyle(i2, null);
        return n.test(l2.getPropertyValue("overflow")) || n.test(l2.getPropertyValue("overflowX")) || n.test(l2.getPropertyValue("overflowY"));
      } catch (l2) {
        return false;
      }
    };
    for (let i2 of o) {
      let l2 = i2.nodeType === 1 && i2.dataset.scrollselectors;
      if (l2) {
        let d2 = l2.split(",");
        for (let s4 of d2) {
          let a2 = z2(i2, s4);
          a2 && r(a2) && e.push(a2);
        }
      }
      i2.nodeType !== 9 && r(i2) && e.push(i2);
    }
  }
  return e;
}
function Rt(t2) {
  if (t2) {
    let e = t2.offsetWidth, o = getComputedStyle(t2);
    return e -= parseFloat(o.paddingLeft) + parseFloat(o.paddingRight) + parseFloat(o.borderLeftWidth) + parseFloat(o.borderRightWidth), e;
  }
  return 0;
}
function tt() {
  return !!(typeof window != "undefined" && window.document && window.document.createElement);
}
function Yt() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}
function Kt(t2, e = "", o) {
  p2(t2) && o !== null && o !== void 0 && t2.setAttribute(e, o);
}

// node_modules/@primeuix/utils/dist/uuid/index.mjs
var t = {};
function s3(n = "pui_id_") {
  return Object.hasOwn(t, n) || (t[n] = 0), t[n]++, `${n}${t[n]}`;
}

// node_modules/@primeuix/utils/dist/zindex/index.mjs
function g2() {
  let r = [], i2 = (e, n, t2 = 999) => {
    let s4 = u(e, n, t2), o = s4.value + (s4.key === e ? 0 : t2) + 1;
    return r.push({ key: e, value: o }), o;
  }, d2 = (e) => {
    r = r.filter((n) => n.value !== e);
  }, a2 = (e, n) => u(e, n).value, u = (e, n, t2 = 0) => [...r].reverse().find((s4) => n ? true : s4.key === e) || { key: e, value: t2 }, l2 = (e) => e && parseInt(e.style.zIndex, 10) || 0;
  return { get: l2, set: (e, n, t2) => {
    n && (n.style.zIndex = String(i2(e, true, t2)));
  }, clear: (e) => {
    e && (d2(l2(e)), e.style.zIndex = "");
  }, getCurrent: (e) => a2(e, true) };
}
var x = g2();

// node_modules/@primeuix/styled/dist/index.mjs
var rt = Object.defineProperty;
var st = Object.defineProperties;
var nt = Object.getOwnPropertyDescriptors;
var F2 = Object.getOwnPropertySymbols;
var xe = Object.prototype.hasOwnProperty;
var be = Object.prototype.propertyIsEnumerable;
var _e = (e, t2, r) => t2 in e ? rt(e, t2, { enumerable: true, configurable: true, writable: true, value: r }) : e[t2] = r;
var g3 = (e, t2) => {
  for (var r in t2 || (t2 = {})) xe.call(t2, r) && _e(e, r, t2[r]);
  if (F2) for (var r of F2(t2)) be.call(t2, r) && _e(e, r, t2[r]);
  return e;
};
var $3 = (e, t2) => st(e, nt(t2));
var v3 = (e, t2) => {
  var r = {};
  for (var s4 in e) xe.call(e, s4) && t2.indexOf(s4) < 0 && (r[s4] = e[s4]);
  if (e != null && F2) for (var s4 of F2(e)) t2.indexOf(s4) < 0 && be.call(e, s4) && (r[s4] = e[s4]);
  return r;
};
function ke(...e) {
  return w(...e);
}
var at = s();
var N2 = at;
var k3 = /{([^}]*)}/g;
var ne = /(\d+\s+[\+\-\*\/]\s+\d+)/g;
var ie = /var\([^)]+\)/g;
function oe2(e) {
  return p(e) ? e.replace(/[A-Z]/g, (t2, r) => r === 0 ? t2 : "." + t2.toLowerCase()).toLowerCase() : e;
}
function Lt(e, t2) {
  b(e) ? e.push(...t2 || []) : i(e) && Object.assign(e, t2);
}
function ve(e) {
  return i(e) && e.hasOwnProperty("$value") && e.hasOwnProperty("$type") ? e.$value : e;
}
function At2(e, t2 = "") {
  return ["opacity", "z-index", "line-height", "font-weight", "flex", "flex-grow", "flex-shrink", "order"].some((s4) => t2.endsWith(s4)) ? e : `${e}`.trim().split(" ").map((a2) => _(a2) ? `${a2}px` : a2).join(" ");
}
function dt(e) {
  return e.replaceAll(/ /g, "").replace(/[^\w]/g, "-");
}
function Q2(e = "", t2 = "") {
  return dt(`${p(e, false) && p(t2, false) ? `${e}-` : e}${t2}`);
}
function ae(e = "", t2 = "") {
  return `--${Q2(e, t2)}`;
}
function gt(e = "") {
  let t2 = (e.match(/{/g) || []).length, r = (e.match(/}/g) || []).length;
  return (t2 + r) % 2 !== 0;
}
function Y(e, t2 = "", r = "", s4 = [], i2) {
  if (p(e)) {
    let a2 = e.trim();
    if (gt(a2)) return;
    if (z(a2, k3)) {
      let n = a2.replaceAll(k3, (l2) => {
        let c2 = l2.replace(/{|}/g, "").split(".").filter((m2) => !s4.some((d2) => z(m2, d2)));
        return `var(${ae(r, ee(c2.join("-")))}${s2(i2) ? `, ${i2}` : ""})`;
      });
      return z(n.replace(ie, "0"), ne) ? `calc(${n})` : n;
    }
    return a2;
  } else if (_(e)) return e;
}
function Dt(e = {}, t2) {
  if (p(t2)) {
    let r = t2.trim();
    return z(r, k3) ? r.replaceAll(k3, (s4) => F(e, s4.replace(/{|}/g, ""))) : r;
  } else if (_(t2)) return t2;
}
function Re(e, t2, r) {
  p(t2, false) && e.push(`${t2}:${r};`);
}
function C2(e, t2) {
  return e ? `${e}{${t2}}` : "";
}
function le(e, t2) {
  if (e.indexOf("dt(") === -1) return e;
  function r(n, l2) {
    let o = [], c2 = 0, m2 = "", d2 = null, u = 0;
    for (; c2 <= n.length; ) {
      let h2 = n[c2];
      if ((h2 === '"' || h2 === "'" || h2 === "`") && n[c2 - 1] !== "\\" && (d2 = d2 === h2 ? null : h2), !d2 && (h2 === "(" && u++, h2 === ")" && u--, (h2 === "," || c2 === n.length) && u === 0)) {
        let f2 = m2.trim();
        f2.startsWith("dt(") ? o.push(le(f2, l2)) : o.push(s4(f2)), m2 = "", c2++;
        continue;
      }
      h2 !== void 0 && (m2 += h2), c2++;
    }
    return o;
  }
  function s4(n) {
    let l2 = n[0];
    if ((l2 === '"' || l2 === "'" || l2 === "`") && n[n.length - 1] === l2) return n.slice(1, -1);
    let o = Number(n);
    return isNaN(o) ? n : o;
  }
  let i2 = [], a2 = [];
  for (let n = 0; n < e.length; n++) if (e[n] === "d" && e.slice(n, n + 3) === "dt(") a2.push(n), n += 2;
  else if (e[n] === ")" && a2.length > 0) {
    let l2 = a2.pop();
    a2.length === 0 && i2.push([l2, n]);
  }
  if (!i2.length) return e;
  for (let n = i2.length - 1; n >= 0; n--) {
    let [l2, o] = i2[n], c2 = e.slice(l2 + 3, o), m2 = r(c2, t2), d2 = t2(...m2);
    e = e.slice(0, l2) + d2 + e.slice(o + 1);
  }
  return e;
}
function Te(e) {
  return e.length === 4 ? `#${e[1]}${e[1]}${e[2]}${e[2]}${e[3]}${e[3]}` : e;
}
function Ne(e) {
  let t2 = parseInt(e.substring(1), 16), r = t2 >> 16 & 255, s4 = t2 >> 8 & 255, i2 = t2 & 255;
  return { r, g: s4, b: i2 };
}
function ht2(e, t2, r) {
  return `#${e.toString(16).padStart(2, "0")}${t2.toString(16).padStart(2, "0")}${r.toString(16).padStart(2, "0")}`;
}
var D = (e, t2, r) => {
  e = Te(e), t2 = Te(t2);
  let a2 = (r / 100 * 2 - 1 + 1) / 2, n = 1 - a2, l2 = Ne(e), o = Ne(t2), c2 = Math.round(l2.r * a2 + o.r * n), m2 = Math.round(l2.g * a2 + o.g * n), d2 = Math.round(l2.b * a2 + o.b * n);
  return ht2(c2, m2, d2);
};
var ce = (e, t2) => D("#000000", e, t2);
var me = (e, t2) => D("#ffffff", e, t2);
var Ce = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
var ft = (e) => {
  if (z(e, k3)) {
    let t2 = e.replace(/{|}/g, "");
    return Ce.reduce((r, s4) => (r[s4] = `{${t2}.${s4}}`, r), {});
  }
  return typeof e == "string" ? Ce.reduce((t2, r, s4) => (t2[r] = s4 <= 5 ? me(e, (5 - s4) * 19) : ce(e, (s4 - 5) * 15), t2), {}) : e;
};
var rr = (e) => {
  var a2;
  let t2 = S.getTheme(), r = ue2(t2, e, void 0, "variable"), s4 = (a2 = r == null ? void 0 : r.match(/--[\w-]+/g)) == null ? void 0 : a2[0], i2 = ue2(t2, e, void 0, "value");
  return { name: s4, variable: r, value: i2 };
};
var E2 = (...e) => ue2(S.getTheme(), ...e);
var ue2 = (e = {}, t2, r, s4) => {
  if (t2) {
    let { variable: i2, options: a2 } = S.defaults || {}, { prefix: n, transform: l2 } = (e == null ? void 0 : e.options) || a2 || {}, o = z(t2, k3) ? t2 : `{${t2}}`;
    return s4 === "value" || a(s4) && l2 === "strict" ? S.getTokenValue(t2) : Y(o, void 0, n, [i2.excludedKeyRegex], r);
  }
  return "";
};
function ar(e, ...t2) {
  if (e instanceof Array) {
    let r = e.reduce((s4, i2, a2) => {
      var n;
      return s4 + i2 + ((n = m(t2[a2], { dt: E2 })) != null ? n : "");
    }, "");
    return le(r, E2);
  }
  return m(e, { dt: E2 });
}
var w2 = (e = {}) => {
  let { preset: t2, options: r } = e;
  return { preset(s4) {
    return t2 = t2 ? U(t2, s4) : s4, this;
  }, options(s4) {
    return r = r ? g3(g3({}, r), s4) : s4, this;
  }, primaryPalette(s4) {
    let { semantic: i2 } = t2 || {};
    return t2 = $3(g3({}, t2), { semantic: $3(g3({}, i2), { primary: s4 }) }), this;
  }, surfacePalette(s4) {
    var o, c2;
    let { semantic: i2 } = t2 || {}, a2 = s4 && Object.hasOwn(s4, "light") ? s4.light : s4, n = s4 && Object.hasOwn(s4, "dark") ? s4.dark : s4, l2 = { colorScheme: { light: g3(g3({}, (o = i2 == null ? void 0 : i2.colorScheme) == null ? void 0 : o.light), !!a2 && { surface: a2 }), dark: g3(g3({}, (c2 = i2 == null ? void 0 : i2.colorScheme) == null ? void 0 : c2.dark), !!n && { surface: n }) } };
    return t2 = $3(g3({}, t2), { semantic: g3(g3({}, i2), l2) }), this;
  }, define({ useDefaultPreset: s4 = false, useDefaultOptions: i2 = false } = {}) {
    return { preset: s4 ? S.getPreset() : t2, options: i2 ? S.getOptions() : r };
  }, update({ mergePresets: s4 = true, mergeOptions: i2 = true } = {}) {
    let a2 = { preset: s4 ? U(S.getPreset(), t2) : t2, options: i2 ? g3(g3({}, S.getOptions()), r) : r };
    return S.setTheme(a2), a2;
  }, use(s4) {
    let i2 = this.define(s4);
    return S.setTheme(i2), i2;
  } };
};
function de(e, t2 = {}) {
  let r = S.defaults.variable, { prefix: s4 = r.prefix, selector: i2 = r.selector, excludedKeyRegex: a2 = r.excludedKeyRegex } = t2, n = [], l2 = [], o = [{ node: e, path: s4 }];
  for (; o.length; ) {
    let { node: m2, path: d2 } = o.pop();
    for (let u in m2) {
      let h2 = m2[u], f2 = ve(h2), p3 = z(u, a2) ? Q2(d2) : Q2(d2, ee(u));
      if (i(f2)) o.push({ node: f2, path: p3 });
      else {
        let y3 = ae(p3), R3 = Y(f2, p3, s4, [a2]);
        Re(l2, y3, R3);
        let T2 = p3;
        s4 && T2.startsWith(s4 + "-") && (T2 = T2.slice(s4.length + 1)), n.push(T2.replace(/-/g, "."));
      }
    }
  }
  let c2 = l2.join("");
  return { value: l2, tokens: n, declarations: c2, css: C2(i2, c2) };
}
var b2 = { regex: { rules: { class: { pattern: /^\.([a-zA-Z][\w-]*)$/, resolve(e) {
  return { type: "class", selector: e, matched: this.pattern.test(e.trim()) };
} }, attr: { pattern: /^\[(.*)\]$/, resolve(e) {
  return { type: "attr", selector: `:root${e}`, matched: this.pattern.test(e.trim()) };
} }, media: { pattern: /^@media (.*)$/, resolve(e) {
  return { type: "media", selector: e, matched: this.pattern.test(e.trim()) };
} }, system: { pattern: /^system$/, resolve(e) {
  return { type: "system", selector: "@media (prefers-color-scheme: dark)", matched: this.pattern.test(e.trim()) };
} }, custom: { resolve(e) {
  return { type: "custom", selector: e, matched: true };
} } }, resolve(e) {
  let t2 = Object.keys(this.rules).filter((r) => r !== "custom").map((r) => this.rules[r]);
  return [e].flat().map((r) => {
    var s4;
    return (s4 = t2.map((i2) => i2.resolve(r)).find((i2) => i2.matched)) != null ? s4 : this.rules.custom.resolve(r);
  });
} }, _toVariables(e, t2) {
  return de(e, { prefix: t2 == null ? void 0 : t2.prefix });
}, getCommon({ name: e = "", theme: t2 = {}, params: r, set: s4, defaults: i2 }) {
  var R3, T2, j, O2, M2, z3, V;
  let { preset: a2, options: n } = t2, l2, o, c2, m2, d2, u, h2;
  if (s2(a2) && n.transform !== "strict") {
    let { primitive: L, semantic: te, extend: re } = a2, f2 = te || {}, { colorScheme: K3 } = f2, A2 = v3(f2, ["colorScheme"]), x2 = re || {}, { colorScheme: X } = x2, G2 = v3(x2, ["colorScheme"]), p3 = K3 || {}, { dark: U3 } = p3, B = v3(p3, ["dark"]), y3 = X || {}, { dark: I } = y3, H = v3(y3, ["dark"]), W2 = s2(L) ? this._toVariables({ primitive: L }, n) : {}, q2 = s2(A2) ? this._toVariables({ semantic: A2 }, n) : {}, Z = s2(B) ? this._toVariables({ light: B }, n) : {}, pe = s2(U3) ? this._toVariables({ dark: U3 }, n) : {}, fe2 = s2(G2) ? this._toVariables({ semantic: G2 }, n) : {}, ye = s2(H) ? this._toVariables({ light: H }, n) : {}, Se = s2(I) ? this._toVariables({ dark: I }, n) : {}, [Me, ze] = [(R3 = W2.declarations) != null ? R3 : "", W2.tokens], [Ke, Xe] = [(T2 = q2.declarations) != null ? T2 : "", q2.tokens || []], [Ge, Ue] = [(j = Z.declarations) != null ? j : "", Z.tokens || []], [Be, Ie] = [(O2 = pe.declarations) != null ? O2 : "", pe.tokens || []], [He, We] = [(M2 = fe2.declarations) != null ? M2 : "", fe2.tokens || []], [qe, Ze] = [(z3 = ye.declarations) != null ? z3 : "", ye.tokens || []], [Fe, Je] = [(V = Se.declarations) != null ? V : "", Se.tokens || []];
    l2 = this.transformCSS(e, Me, "light", "variable", n, s4, i2), o = ze;
    let Qe = this.transformCSS(e, `${Ke}${Ge}`, "light", "variable", n, s4, i2), Ye = this.transformCSS(e, `${Be}`, "dark", "variable", n, s4, i2);
    c2 = `${Qe}${Ye}`, m2 = [.../* @__PURE__ */ new Set([...Xe, ...Ue, ...Ie])];
    let et = this.transformCSS(e, `${He}${qe}color-scheme:light`, "light", "variable", n, s4, i2), tt2 = this.transformCSS(e, `${Fe}color-scheme:dark`, "dark", "variable", n, s4, i2);
    d2 = `${et}${tt2}`, u = [.../* @__PURE__ */ new Set([...We, ...Ze, ...Je])], h2 = m(a2.css, { dt: E2 });
  }
  return { primitive: { css: l2, tokens: o }, semantic: { css: c2, tokens: m2 }, global: { css: d2, tokens: u }, style: h2 };
}, getPreset({ name: e = "", preset: t2 = {}, options: r, params: s4, set: i2, defaults: a2, selector: n }) {
  var f2, x2, p3;
  let l2, o, c2;
  if (s2(t2) && r.transform !== "strict") {
    let y3 = e.replace("-directive", ""), m2 = t2, { colorScheme: R3, extend: T2, css: j } = m2, O2 = v3(m2, ["colorScheme", "extend", "css"]), d2 = T2 || {}, { colorScheme: M2 } = d2, z3 = v3(d2, ["colorScheme"]), u = R3 || {}, { dark: V } = u, L = v3(u, ["dark"]), h2 = M2 || {}, { dark: te } = h2, re = v3(h2, ["dark"]), K3 = s2(O2) ? this._toVariables({ [y3]: g3(g3({}, O2), z3) }, r) : {}, A2 = s2(L) ? this._toVariables({ [y3]: g3(g3({}, L), re) }, r) : {}, X = s2(V) ? this._toVariables({ [y3]: g3(g3({}, V), te) }, r) : {}, [G2, U3] = [(f2 = K3.declarations) != null ? f2 : "", K3.tokens || []], [B, I] = [(x2 = A2.declarations) != null ? x2 : "", A2.tokens || []], [H, W2] = [(p3 = X.declarations) != null ? p3 : "", X.tokens || []], q2 = this.transformCSS(y3, `${G2}${B}`, "light", "variable", r, i2, a2, n), Z = this.transformCSS(y3, H, "dark", "variable", r, i2, a2, n);
    l2 = `${q2}${Z}`, o = [.../* @__PURE__ */ new Set([...U3, ...I, ...W2])], c2 = m(j, { dt: E2 });
  }
  return { css: l2, tokens: o, style: c2 };
}, getPresetC({ name: e = "", theme: t2 = {}, params: r, set: s4, defaults: i2 }) {
  var o;
  let { preset: a2, options: n } = t2, l2 = (o = a2 == null ? void 0 : a2.components) == null ? void 0 : o[e];
  return this.getPreset({ name: e, preset: l2, options: n, params: r, set: s4, defaults: i2 });
}, getPresetD({ name: e = "", theme: t2 = {}, params: r, set: s4, defaults: i2 }) {
  var c2, m2;
  let a2 = e.replace("-directive", ""), { preset: n, options: l2 } = t2, o = ((c2 = n == null ? void 0 : n.components) == null ? void 0 : c2[a2]) || ((m2 = n == null ? void 0 : n.directives) == null ? void 0 : m2[a2]);
  return this.getPreset({ name: a2, preset: o, options: l2, params: r, set: s4, defaults: i2 });
}, applyDarkColorScheme(e) {
  return !(e.darkModeSelector === "none" || e.darkModeSelector === false);
}, getColorSchemeOption(e, t2) {
  var r;
  return this.applyDarkColorScheme(e) ? this.regex.resolve(e.darkModeSelector === true ? t2.options.darkModeSelector : (r = e.darkModeSelector) != null ? r : t2.options.darkModeSelector) : [];
}, getLayerOrder(e, t2 = {}, r, s4) {
  let { cssLayer: i2 } = t2;
  return i2 ? `@layer ${m(i2.order || i2.name || "primeui", r)}` : "";
}, getCommonStyleSheet({ name: e = "", theme: t2 = {}, params: r, props: s4 = {}, set: i2, defaults: a2 }) {
  let n = this.getCommon({ name: e, theme: t2, params: r, set: i2, defaults: a2 }), l2 = Object.entries(s4).reduce((o, [c2, m2]) => o.push(`${c2}="${m2}"`) && o, []).join(" ");
  return Object.entries(n || {}).reduce((o, [c2, m2]) => {
    if (i(m2) && Object.hasOwn(m2, "css")) {
      let d2 = G(m2.css), u = `${c2}-variables`;
      o.push(`<style type="text/css" data-primevue-style-id="${u}" ${l2}>${d2}</style>`);
    }
    return o;
  }, []).join("");
}, getStyleSheet({ name: e = "", theme: t2 = {}, params: r, props: s4 = {}, set: i2, defaults: a2 }) {
  var c2;
  let n = { name: e, theme: t2, params: r, set: i2, defaults: a2 }, l2 = (c2 = e.includes("-directive") ? this.getPresetD(n) : this.getPresetC(n)) == null ? void 0 : c2.css, o = Object.entries(s4).reduce((m2, [d2, u]) => m2.push(`${d2}="${u}"`) && m2, []).join(" ");
  return l2 ? `<style type="text/css" data-primevue-style-id="${e}-variables" ${o}>${G(l2)}</style>` : "";
}, createTokens(e = {}, t2, r = "", s4 = "", i2 = {}) {
  let a2 = function(l2, o = {}, c2 = []) {
    if (c2.includes(this.path)) return console.warn(`Circular reference detected at ${this.path}`), { colorScheme: l2, path: this.path, paths: o, value: void 0 };
    c2.push(this.path), o.name = this.path, o.binding || (o.binding = {});
    let m2 = this.value;
    if (typeof this.value == "string" && k3.test(this.value)) {
      let u = this.value.trim().replace(k3, (h2) => {
        var y3;
        let f2 = h2.slice(1, -1), x2 = this.tokens[f2];
        if (!x2) return console.warn(`Token not found for path: ${f2}`), "__UNRESOLVED__";
        let p3 = x2.computed(l2, o, c2);
        return Array.isArray(p3) && p3.length === 2 ? `light-dark(${p3[0].value},${p3[1].value})` : (y3 = p3 == null ? void 0 : p3.value) != null ? y3 : "__UNRESOLVED__";
      });
      m2 = ne.test(u.replace(ie, "0")) ? `calc(${u})` : u;
    }
    return a(o.binding) && delete o.binding, c2.pop(), { colorScheme: l2, path: this.path, paths: o, value: m2.includes("__UNRESOLVED__") ? void 0 : m2 };
  }, n = (l2, o, c2) => {
    Object.entries(l2).forEach(([m2, d2]) => {
      let u = z(m2, t2.variable.excludedKeyRegex) ? o : o ? `${o}.${oe2(m2)}` : oe2(m2), h2 = c2 ? `${c2}.${m2}` : m2;
      i(d2) ? n(d2, u, h2) : (i2[u] || (i2[u] = { paths: [], computed: (f2, x2 = {}, p3 = []) => {
        if (i2[u].paths.length === 1) return i2[u].paths[0].computed(i2[u].paths[0].scheme, x2.binding, p3);
        if (f2 && f2 !== "none") for (let y3 = 0; y3 < i2[u].paths.length; y3++) {
          let R3 = i2[u].paths[y3];
          if (R3.scheme === f2) return R3.computed(f2, x2.binding, p3);
        }
        return i2[u].paths.map((y3) => y3.computed(y3.scheme, x2[y3.scheme], p3));
      } }), i2[u].paths.push({ path: h2, value: d2, scheme: h2.includes("colorScheme.light") ? "light" : h2.includes("colorScheme.dark") ? "dark" : "none", computed: a2, tokens: i2 }));
    });
  };
  return n(e, r, s4), i2;
}, getTokenValue(e, t2, r) {
  var l2;
  let i2 = ((o) => o.split(".").filter((m2) => !z(m2.toLowerCase(), r.variable.excludedKeyRegex)).join("."))(t2), a2 = t2.includes("colorScheme.light") ? "light" : t2.includes("colorScheme.dark") ? "dark" : void 0, n = [(l2 = e[i2]) == null ? void 0 : l2.computed(a2)].flat().filter((o) => o);
  return n.length === 1 ? n[0].value : n.reduce((o = {}, c2) => {
    let u = c2, { colorScheme: m2 } = u, d2 = v3(u, ["colorScheme"]);
    return o[m2] = d2, o;
  }, void 0);
}, getSelectorRule(e, t2, r, s4) {
  return r === "class" || r === "attr" ? C2(s2(t2) ? `${e}${t2},${e} ${t2}` : e, s4) : C2(e, C2(t2 != null ? t2 : ":root", s4));
}, transformCSS(e, t2, r, s4, i2 = {}, a2, n, l2) {
  if (s2(t2)) {
    let { cssLayer: o } = i2;
    if (s4 !== "style") {
      let c2 = this.getColorSchemeOption(i2, n);
      t2 = r === "dark" ? c2.reduce((m2, { type: d2, selector: u }) => (s2(u) && (m2 += u.includes("[CSS]") ? u.replace("[CSS]", t2) : this.getSelectorRule(u, l2, d2, t2)), m2), "") : C2(l2 != null ? l2 : ":root", t2);
    }
    if (o) {
      let c2 = { name: "primeui", order: "primeui" };
      i(o) && (c2.name = m(o.name, { name: e, type: s4 })), s2(c2.name) && (t2 = C2(`@layer ${c2.name}`, t2), a2 == null || a2.layerNames(c2.name));
    }
    return t2;
  }
  return "";
} };
var S = { defaults: { variable: { prefix: "p", selector: ":root", excludedKeyRegex: /^(primitive|semantic|components|directives|variables|colorscheme|light|dark|common|root|states|extend|css)$/gi }, options: { prefix: "p", darkModeSelector: "system", cssLayer: false } }, _theme: void 0, _layerNames: /* @__PURE__ */ new Set(), _loadedStyleNames: /* @__PURE__ */ new Set(), _loadingStyles: /* @__PURE__ */ new Set(), _tokens: {}, update(e = {}) {
  let { theme: t2 } = e;
  t2 && (this._theme = $3(g3({}, t2), { options: g3(g3({}, this.defaults.options), t2.options) }), this._tokens = b2.createTokens(this.preset, this.defaults), this.clearLoadedStyleNames());
}, get theme() {
  return this._theme;
}, get preset() {
  var e;
  return ((e = this.theme) == null ? void 0 : e.preset) || {};
}, get options() {
  var e;
  return ((e = this.theme) == null ? void 0 : e.options) || {};
}, get tokens() {
  return this._tokens;
}, getTheme() {
  return this.theme;
}, setTheme(e) {
  this.update({ theme: e }), N2.emit("theme:change", e);
}, getPreset() {
  return this.preset;
}, setPreset(e) {
  this._theme = $3(g3({}, this.theme), { preset: e }), this._tokens = b2.createTokens(e, this.defaults), this.clearLoadedStyleNames(), N2.emit("preset:change", e), N2.emit("theme:change", this.theme);
}, getOptions() {
  return this.options;
}, setOptions(e) {
  this._theme = $3(g3({}, this.theme), { options: e }), this.clearLoadedStyleNames(), N2.emit("options:change", e), N2.emit("theme:change", this.theme);
}, getLayerNames() {
  return [...this._layerNames];
}, setLayerNames(e) {
  this._layerNames.add(e);
}, getLoadedStyleNames() {
  return this._loadedStyleNames;
}, isStyleNameLoaded(e) {
  return this._loadedStyleNames.has(e);
}, setLoadedStyleName(e) {
  this._loadedStyleNames.add(e);
}, deleteLoadedStyleName(e) {
  this._loadedStyleNames.delete(e);
}, clearLoadedStyleNames() {
  this._loadedStyleNames.clear();
}, getTokenValue(e) {
  return b2.getTokenValue(this.tokens, e, this.defaults);
}, getCommon(e = "", t2) {
  return b2.getCommon({ name: e, theme: this.theme, params: t2, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } });
}, getComponent(e = "", t2) {
  let r = { name: e, theme: this.theme, params: t2, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } };
  return b2.getPresetC(r);
}, getDirective(e = "", t2) {
  let r = { name: e, theme: this.theme, params: t2, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } };
  return b2.getPresetD(r);
}, getCustomPreset(e = "", t2, r, s4) {
  let i2 = { name: e, preset: t2, options: this.options, selector: r, params: s4, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } };
  return b2.getPreset(i2);
}, getLayerOrderCSS(e = "") {
  return b2.getLayerOrder(e, this.options, { names: this.getLayerNames() }, this.defaults);
}, transformCSS(e = "", t2, r = "style", s4) {
  return b2.transformCSS(e, t2, s4, r, this.options, { layerNames: this.setLayerNames.bind(this) }, this.defaults);
}, getCommonStyleSheet(e = "", t2, r = {}) {
  return b2.getCommonStyleSheet({ name: e, theme: this.theme, params: t2, props: r, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } });
}, getStyleSheet(e, t2, r = {}) {
  return b2.getStyleSheet({ name: e, theme: this.theme, params: t2, props: r, defaults: this.defaults, set: { layerNames: this.setLayerNames.bind(this) } });
}, onStyleMounted(e) {
  this._loadingStyles.add(e);
}, onStyleUpdated(e) {
  this._loadingStyles.add(e);
}, onStyleLoaded(e, { name: t2 }) {
  this._loadingStyles.size && (this._loadingStyles.delete(t2), N2.emit(`theme:${t2}:load`, e), !this._loadingStyles.size && N2.emit("theme:load"));
} };
function Ve(...e) {
  let t2 = w(S.getPreset(), ...e);
  return S.setPreset(t2), t2;
}
function Le(e) {
  return w2().primaryPalette(e).update().preset;
}
function Ae(e) {
  return w2().surfacePalette(e).update().preset;
}
function De(...e) {
  let t2 = w(...e);
  return S.setPreset(t2), t2;
}
function je(e) {
  return w2(e).update({ mergePresets: false });
}
var he = class {
  constructor({ attrs: t2 } = {}) {
    this._styles = /* @__PURE__ */ new Map(), this._attrs = t2 || {};
  }
  get(t2) {
    return this._styles.get(t2);
  }
  has(t2) {
    return this._styles.has(t2);
  }
  delete(t2) {
    this._styles.delete(t2);
  }
  clear() {
    this._styles.clear();
  }
  add(t2, r) {
    if (s2(r)) {
      let s4 = { name: t2, css: r, attrs: this._attrs, markup: q(r, this._attrs) };
      this._styles.set(t2, $3(g3({}, s4), { element: this.createStyleElement(s4) }));
    }
  }
  update() {
  }
  getStyles() {
    return this._styles;
  }
  getAllCSS() {
    return [...this._styles.values()].map((t2) => t2.css).filter(String);
  }
  getAllMarkup() {
    return [...this._styles.values()].map((t2) => t2.markup).filter(String);
  }
  getAllElements() {
    return [...this._styles.values()].map((t2) => t2.element);
  }
  createStyleElement(t2 = {}) {
  }
};
var Nt = he;

export {
  a,
  l,
  s2 as s,
  k,
  i,
  m,
  p,
  g,
  F,
  b,
  U,
  G,
  v,
  f,
  R2 as R,
  W,
  O,
  h,
  k2,
  $2 as $,
  v2,
  T,
  p2,
  A,
  U2,
  ht,
  z2 as z,
  bt,
  Q,
  Tt,
  K2 as K,
  C,
  At,
  Rt,
  tt,
  Yt,
  Kt,
  s3 as s2,
  x,
  ke,
  N2 as N,
  k3,
  ne,
  ie,
  oe2 as oe,
  Lt,
  ve,
  At2,
  dt,
  Q2,
  ae,
  gt,
  Y,
  Dt,
  Re,
  C2,
  le,
  D,
  ce,
  me,
  ft,
  rr,
  E2 as E,
  ue2 as ue,
  ar,
  w2 as w,
  de,
  b2,
  S,
  Ve,
  Le,
  Ae,
  De,
  je,
  Nt
};
//# sourceMappingURL=chunk-HCE7UK4C.js.map
