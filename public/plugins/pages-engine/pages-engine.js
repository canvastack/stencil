var ip = Object.defineProperty;
var cp = (e, t, n) => t in e ? ip(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var pe = (e, t, n) => cp(e, typeof t != "symbol" ? t + "" : t, n);
import { jsxs as h, jsx as o, Fragment as Dt } from "react/jsx-runtime";
import * as m from "react";
import Ot, { createContext as As, useContext as sc, useState as W, useEffect as Xr, useLayoutEffect as lp, useRef as dp, lazy as vn, Suspense as Pt } from "react";
import { Plus as Pn, Search as Mn, List as ac, Grid as up, FileText as Jr, MoreVertical as Fr, Edit as Lr, EyeOff as Ma, Eye as Ft, Trash2 as $r, ArrowLeft as ic, Save as cc, Archive as fp, X as lc, ChevronDown as Ps, ChevronUp as pp, Check as Ms, Palette as ss, ChevronRight as dc, Circle as mp, Minimize as hp, Printer as gp, Undo as ka, Redo as Ia, Scissors as yp, Copy as vp, Clipboard as Oa, Code as as, Maximize as wp, Image as bp, Link as Cp, Video as Sp, Table as xp, Minus as Np, Calendar as Ep, Bold as Da, Italic as Fa, Underline as La, Strikethrough as Tp, Superscript as _p, Subscript as Rp, Type as $a, RemoveFormatting as Ua, HelpCircle as Ba, AlignLeft as Ap, AlignCenter as Pp, AlignRight as Mp, AlignJustify as kp, ListOrdered as Ip, Outdent as Op, Indent as Dp, Send as uc, FolderTree as fc, GripVertical as Fp, Maximize2 as Lp, Minimize2 as $p, AlertTriangle as Up, History as Bp, User as zp, Clock as qp, RotateCcw as Hp, MessageSquare as za, Reply as jp, ThumbsUp as Wp } from "lucide-react";
import { Skeleton as _e, Button as oe, Card as Me, CardHeader as Le, CardTitle as Ke, Input as De, CardContent as ke, Table as Zr, TableHeader as eo, TableRow as Gt, TableHead as Ce, TableBody as to, TableCell as Se, Badge as un, DropdownMenu as Ur, DropdownMenuTrigger as Br, DropdownMenuContent as zr, DropdownMenuItem as Be, CardDescription as qa, Textarea as kn, Select as no, SelectTrigger as ro, SelectValue as oo, SelectContent as so, SelectItem as vt, cn as ks, Tabs as pc, TabsList as mc, TabsTrigger as cn, Separator as Ha, DropdownMenuSeparator as Kp, Dialog as hc, DialogContent as gc, DialogHeader as yc, DialogTitle as vc, DialogDescription as wc, DialogFooter as Vp } from "@canvastencil/ui-components";
import { QueryClient as Gp, useQuery as Ae, useQueryClient as ue, useMutation as fe } from "@tanstack/react-query";
import * as Qp from "@sentry/react";
import { toast as L } from "sonner";
import { create as ao } from "zustand";
import { devtools as io, persist as co } from "zustand/middleware";
import { useNavigate as nr, useParams as Is } from "react-router-dom";
import { useFormContext as Yp, FormProvider as Xp, Controller as Jp, useForm as Os } from "react-hook-form";
import { zodResolver as Ds } from "@hookform/resolvers/zod";
import * as j from "zod";
import { Slot as bc, createSlot as Lt } from "@radix-ui/react-slot";
import * as Cc from "@radix-ui/react-label";
import * as lo from "react-dom";
import Zp from "react-dom";
import { formatDistanceToNow as Xn, parseISO as ja } from "date-fns";
import em from "@monaco-editor/react";
import { useTheme as tm } from "next-themes";
function Sc(e, t) {
  return function() {
    return e.apply(t, arguments);
  };
}
const { toString: nm } = Object.prototype, { getPrototypeOf: Fs } = Object, { iterator: uo, toStringTag: xc } = Symbol, fo = /* @__PURE__ */ ((e) => (t) => {
  const n = nm.call(t);
  return e[n] || (e[n] = n.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null)), ft = (e) => (e = e.toLowerCase(), (t) => fo(t) === e), po = (e) => (t) => typeof t === e, { isArray: Fn } = Array, In = po("undefined");
function rr(e) {
  return e !== null && !In(e) && e.constructor !== null && !In(e.constructor) && Ge(e.constructor.isBuffer) && e.constructor.isBuffer(e);
}
const Nc = ft("ArrayBuffer");
function rm(e) {
  let t;
  return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? t = ArrayBuffer.isView(e) : t = e && e.buffer && Nc(e.buffer), t;
}
const om = po("string"), Ge = po("function"), Ec = po("number"), or = (e) => e !== null && typeof e == "object", sm = (e) => e === !0 || e === !1, Pr = (e) => {
  if (fo(e) !== "object")
    return !1;
  const t = Fs(e);
  return (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) && !(xc in e) && !(uo in e);
}, am = (e) => {
  if (!or(e) || rr(e))
    return !1;
  try {
    return Object.keys(e).length === 0 && Object.getPrototypeOf(e) === Object.prototype;
  } catch {
    return !1;
  }
}, im = ft("Date"), cm = ft("File"), lm = ft("Blob"), dm = ft("FileList"), um = (e) => or(e) && Ge(e.pipe), fm = (e) => {
  let t;
  return e && (typeof FormData == "function" && e instanceof FormData || Ge(e.append) && ((t = fo(e)) === "formdata" || // detect form-data instance
  t === "object" && Ge(e.toString) && e.toString() === "[object FormData]"));
}, pm = ft("URLSearchParams"), [mm, hm, gm, ym] = ["ReadableStream", "Request", "Response", "Headers"].map(ft), vm = (e) => e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function sr(e, t, { allOwnKeys: n = !1 } = {}) {
  if (e === null || typeof e > "u")
    return;
  let r, s;
  if (typeof e != "object" && (e = [e]), Fn(e))
    for (r = 0, s = e.length; r < s; r++)
      t.call(null, e[r], r, e);
  else {
    if (rr(e))
      return;
    const a = n ? Object.getOwnPropertyNames(e) : Object.keys(e), i = a.length;
    let c;
    for (r = 0; r < i; r++)
      c = a[r], t.call(null, e[c], c, e);
  }
}
function Tc(e, t) {
  if (rr(e))
    return null;
  t = t.toLowerCase();
  const n = Object.keys(e);
  let r = n.length, s;
  for (; r-- > 0; )
    if (s = n[r], t === s.toLowerCase())
      return s;
  return null;
}
const ln = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : global, _c = (e) => !In(e) && e !== ln;
function is() {
  const { caseless: e, skipUndefined: t } = _c(this) && this || {}, n = {}, r = (s, a) => {
    const i = e && Tc(n, a) || a;
    Pr(n[i]) && Pr(s) ? n[i] = is(n[i], s) : Pr(s) ? n[i] = is({}, s) : Fn(s) ? n[i] = s.slice() : (!t || !In(s)) && (n[i] = s);
  };
  for (let s = 0, a = arguments.length; s < a; s++)
    arguments[s] && sr(arguments[s], r);
  return n;
}
const wm = (e, t, n, { allOwnKeys: r } = {}) => (sr(t, (s, a) => {
  n && Ge(s) ? e[a] = Sc(s, n) : e[a] = s;
}, { allOwnKeys: r }), e), bm = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e), Cm = (e, t, n, r) => {
  e.prototype = Object.create(t.prototype, r), e.prototype.constructor = e, Object.defineProperty(e, "super", {
    value: t.prototype
  }), n && Object.assign(e.prototype, n);
}, Sm = (e, t, n, r) => {
  let s, a, i;
  const c = {};
  if (t = t || {}, e == null) return t;
  do {
    for (s = Object.getOwnPropertyNames(e), a = s.length; a-- > 0; )
      i = s[a], (!r || r(i, e, t)) && !c[i] && (t[i] = e[i], c[i] = !0);
    e = n !== !1 && Fs(e);
  } while (e && (!n || n(e, t)) && e !== Object.prototype);
  return t;
}, xm = (e, t, n) => {
  e = String(e), (n === void 0 || n > e.length) && (n = e.length), n -= t.length;
  const r = e.indexOf(t, n);
  return r !== -1 && r === n;
}, Nm = (e) => {
  if (!e) return null;
  if (Fn(e)) return e;
  let t = e.length;
  if (!Ec(t)) return null;
  const n = new Array(t);
  for (; t-- > 0; )
    n[t] = e[t];
  return n;
}, Em = /* @__PURE__ */ ((e) => (t) => e && t instanceof e)(typeof Uint8Array < "u" && Fs(Uint8Array)), Tm = (e, t) => {
  const r = (e && e[uo]).call(e);
  let s;
  for (; (s = r.next()) && !s.done; ) {
    const a = s.value;
    t.call(e, a[0], a[1]);
  }
}, _m = (e, t) => {
  let n;
  const r = [];
  for (; (n = e.exec(t)) !== null; )
    r.push(n);
  return r;
}, Rm = ft("HTMLFormElement"), Am = (e) => e.toLowerCase().replace(
  /[-_\s]([a-z\d])(\w*)/g,
  function(n, r, s) {
    return r.toUpperCase() + s;
  }
), Wa = (({ hasOwnProperty: e }) => (t, n) => e.call(t, n))(Object.prototype), Pm = ft("RegExp"), Rc = (e, t) => {
  const n = Object.getOwnPropertyDescriptors(e), r = {};
  sr(n, (s, a) => {
    let i;
    (i = t(s, a, e)) !== !1 && (r[a] = i || s);
  }), Object.defineProperties(e, r);
}, Mm = (e) => {
  Rc(e, (t, n) => {
    if (Ge(e) && ["arguments", "caller", "callee"].indexOf(n) !== -1)
      return !1;
    const r = e[n];
    if (Ge(r)) {
      if (t.enumerable = !1, "writable" in t) {
        t.writable = !1;
        return;
      }
      t.set || (t.set = () => {
        throw Error("Can not rewrite read-only method '" + n + "'");
      });
    }
  });
}, km = (e, t) => {
  const n = {}, r = (s) => {
    s.forEach((a) => {
      n[a] = !0;
    });
  };
  return Fn(e) ? r(e) : r(String(e).split(t)), n;
}, Im = () => {
}, Om = (e, t) => e != null && Number.isFinite(e = +e) ? e : t;
function Dm(e) {
  return !!(e && Ge(e.append) && e[xc] === "FormData" && e[uo]);
}
const Fm = (e) => {
  const t = new Array(10), n = (r, s) => {
    if (or(r)) {
      if (t.indexOf(r) >= 0)
        return;
      if (rr(r))
        return r;
      if (!("toJSON" in r)) {
        t[s] = r;
        const a = Fn(r) ? [] : {};
        return sr(r, (i, c) => {
          const d = n(i, s + 1);
          !In(d) && (a[c] = d);
        }), t[s] = void 0, a;
      }
    }
    return r;
  };
  return n(e, 0);
}, Lm = ft("AsyncFunction"), $m = (e) => e && (or(e) || Ge(e)) && Ge(e.then) && Ge(e.catch), Ac = ((e, t) => e ? setImmediate : t ? ((n, r) => (ln.addEventListener("message", ({ source: s, data: a }) => {
  s === ln && a === n && r.length && r.shift()();
}, !1), (s) => {
  r.push(s), ln.postMessage(n, "*");
}))(`axios@${Math.random()}`, []) : (n) => setTimeout(n))(
  typeof setImmediate == "function",
  Ge(ln.postMessage)
), Um = typeof queueMicrotask < "u" ? queueMicrotask.bind(ln) : typeof process < "u" && process.nextTick || Ac, Bm = (e) => e != null && Ge(e[uo]), N = {
  isArray: Fn,
  isArrayBuffer: Nc,
  isBuffer: rr,
  isFormData: fm,
  isArrayBufferView: rm,
  isString: om,
  isNumber: Ec,
  isBoolean: sm,
  isObject: or,
  isPlainObject: Pr,
  isEmptyObject: am,
  isReadableStream: mm,
  isRequest: hm,
  isResponse: gm,
  isHeaders: ym,
  isUndefined: In,
  isDate: im,
  isFile: cm,
  isBlob: lm,
  isRegExp: Pm,
  isFunction: Ge,
  isStream: um,
  isURLSearchParams: pm,
  isTypedArray: Em,
  isFileList: dm,
  forEach: sr,
  merge: is,
  extend: wm,
  trim: vm,
  stripBOM: bm,
  inherits: Cm,
  toFlatObject: Sm,
  kindOf: fo,
  kindOfTest: ft,
  endsWith: xm,
  toArray: Nm,
  forEachEntry: Tm,
  matchAll: _m,
  isHTMLForm: Rm,
  hasOwnProperty: Wa,
  hasOwnProp: Wa,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors: Rc,
  freezeMethods: Mm,
  toObjectSet: km,
  toCamelCase: Am,
  noop: Im,
  toFiniteNumber: Om,
  findKey: Tc,
  global: ln,
  isContextDefined: _c,
  isSpecCompliantForm: Dm,
  toJSONObject: Fm,
  isAsyncFn: Lm,
  isThenable: $m,
  setImmediate: Ac,
  asap: Um,
  isIterable: Bm
};
function V(e, t, n, r, s) {
  Error.call(this), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack, this.message = e, this.name = "AxiosError", t && (this.code = t), n && (this.config = n), r && (this.request = r), s && (this.response = s, this.status = s.status ? s.status : null);
}
N.inherits(V, Error, {
  toJSON: function() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: N.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
});
const Pc = V.prototype, Mc = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL"
  // eslint-disable-next-line func-names
].forEach((e) => {
  Mc[e] = { value: e };
});
Object.defineProperties(V, Mc);
Object.defineProperty(Pc, "isAxiosError", { value: !0 });
V.from = (e, t, n, r, s, a) => {
  const i = Object.create(Pc);
  N.toFlatObject(e, i, function(u) {
    return u !== Error.prototype;
  }, (l) => l !== "isAxiosError");
  const c = e && e.message ? e.message : "Error", d = t == null && e ? e.code : t;
  return V.call(i, c, d, n, r, s), e && i.cause == null && Object.defineProperty(i, "cause", { value: e, configurable: !0 }), i.name = e && e.name || "Error", a && Object.assign(i, a), i;
};
const zm = null;
function cs(e) {
  return N.isPlainObject(e) || N.isArray(e);
}
function kc(e) {
  return N.endsWith(e, "[]") ? e.slice(0, -2) : e;
}
function Ka(e, t, n) {
  return e ? e.concat(t).map(function(s, a) {
    return s = kc(s), !n && a ? "[" + s + "]" : s;
  }).join(n ? "." : "") : t;
}
function qm(e) {
  return N.isArray(e) && !e.some(cs);
}
const Hm = N.toFlatObject(N, {}, null, function(t) {
  return /^is[A-Z]/.test(t);
});
function mo(e, t, n) {
  if (!N.isObject(e))
    throw new TypeError("target must be an object");
  t = t || new FormData(), n = N.toFlatObject(n, {
    metaTokens: !0,
    dots: !1,
    indexes: !1
  }, !1, function(p, y) {
    return !N.isUndefined(y[p]);
  });
  const r = n.metaTokens, s = n.visitor || u, a = n.dots, i = n.indexes, d = (n.Blob || typeof Blob < "u" && Blob) && N.isSpecCompliantForm(t);
  if (!N.isFunction(s))
    throw new TypeError("visitor must be a function");
  function l(g) {
    if (g === null) return "";
    if (N.isDate(g))
      return g.toISOString();
    if (N.isBoolean(g))
      return g.toString();
    if (!d && N.isBlob(g))
      throw new V("Blob is not supported. Use a Buffer instead.");
    return N.isArrayBuffer(g) || N.isTypedArray(g) ? d && typeof Blob == "function" ? new Blob([g]) : Buffer.from(g) : g;
  }
  function u(g, p, y) {
    let C = g;
    if (g && !y && typeof g == "object") {
      if (N.endsWith(p, "{}"))
        p = r ? p : p.slice(0, -2), g = JSON.stringify(g);
      else if (N.isArray(g) && qm(g) || (N.isFileList(g) || N.endsWith(p, "[]")) && (C = N.toArray(g)))
        return p = kc(p), C.forEach(function(b, x) {
          !(N.isUndefined(b) || b === null) && t.append(
            // eslint-disable-next-line no-nested-ternary
            i === !0 ? Ka([p], x, a) : i === null ? p : p + "[]",
            l(b)
          );
        }), !1;
    }
    return cs(g) ? !0 : (t.append(Ka(y, p, a), l(g)), !1);
  }
  const f = [], v = Object.assign(Hm, {
    defaultVisitor: u,
    convertValue: l,
    isVisitable: cs
  });
  function w(g, p) {
    if (!N.isUndefined(g)) {
      if (f.indexOf(g) !== -1)
        throw Error("Circular reference detected in " + p.join("."));
      f.push(g), N.forEach(g, function(C, S) {
        (!(N.isUndefined(C) || C === null) && s.call(
          t,
          C,
          N.isString(S) ? S.trim() : S,
          p,
          v
        )) === !0 && w(C, p ? p.concat(S) : [S]);
      }), f.pop();
    }
  }
  if (!N.isObject(e))
    throw new TypeError("data must be an object");
  return w(e), t;
}
function Va(e) {
  const t = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function(r) {
    return t[r];
  });
}
function Ls(e, t) {
  this._pairs = [], e && mo(e, this, t);
}
const Ic = Ls.prototype;
Ic.append = function(t, n) {
  this._pairs.push([t, n]);
};
Ic.toString = function(t) {
  const n = t ? function(r) {
    return t.call(this, r, Va);
  } : Va;
  return this._pairs.map(function(s) {
    return n(s[0]) + "=" + n(s[1]);
  }, "").join("&");
};
function jm(e) {
  return encodeURIComponent(e).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
}
function Oc(e, t, n) {
  if (!t)
    return e;
  const r = n && n.encode || jm;
  N.isFunction(n) && (n = {
    serialize: n
  });
  const s = n && n.serialize;
  let a;
  if (s ? a = s(t, n) : a = N.isURLSearchParams(t) ? t.toString() : new Ls(t, n).toString(r), a) {
    const i = e.indexOf("#");
    i !== -1 && (e = e.slice(0, i)), e += (e.indexOf("?") === -1 ? "?" : "&") + a;
  }
  return e;
}
class Ga {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(t, n, r) {
    return this.handlers.push({
      fulfilled: t,
      rejected: n,
      synchronous: r ? r.synchronous : !1,
      runWhen: r ? r.runWhen : null
    }), this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(t) {
    this.handlers[t] && (this.handlers[t] = null);
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    this.handlers && (this.handlers = []);
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(t) {
    N.forEach(this.handlers, function(r) {
      r !== null && t(r);
    });
  }
}
const Dc = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1
}, Wm = typeof URLSearchParams < "u" ? URLSearchParams : Ls, Km = typeof FormData < "u" ? FormData : null, Vm = typeof Blob < "u" ? Blob : null, Gm = {
  isBrowser: !0,
  classes: {
    URLSearchParams: Wm,
    FormData: Km,
    Blob: Vm
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
}, $s = typeof window < "u" && typeof document < "u", ls = typeof navigator == "object" && navigator || void 0, Qm = $s && (!ls || ["ReactNative", "NativeScript", "NS"].indexOf(ls.product) < 0), Ym = typeof WorkerGlobalScope < "u" && // eslint-disable-next-line no-undef
self instanceof WorkerGlobalScope && typeof self.importScripts == "function", Xm = $s && window.location.href || "http://localhost", Jm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv: $s,
  hasStandardBrowserEnv: Qm,
  hasStandardBrowserWebWorkerEnv: Ym,
  navigator: ls,
  origin: Xm
}, Symbol.toStringTag, { value: "Module" })), ze = {
  ...Jm,
  ...Gm
};
function Zm(e, t) {
  return mo(e, new ze.classes.URLSearchParams(), {
    visitor: function(n, r, s, a) {
      return ze.isNode && N.isBuffer(n) ? (this.append(r, n.toString("base64")), !1) : a.defaultVisitor.apply(this, arguments);
    },
    ...t
  });
}
function eh(e) {
  return N.matchAll(/\w+|\[(\w*)]/g, e).map((t) => t[0] === "[]" ? "" : t[1] || t[0]);
}
function th(e) {
  const t = {}, n = Object.keys(e);
  let r;
  const s = n.length;
  let a;
  for (r = 0; r < s; r++)
    a = n[r], t[a] = e[a];
  return t;
}
function Fc(e) {
  function t(n, r, s, a) {
    let i = n[a++];
    if (i === "__proto__") return !0;
    const c = Number.isFinite(+i), d = a >= n.length;
    return i = !i && N.isArray(s) ? s.length : i, d ? (N.hasOwnProp(s, i) ? s[i] = [s[i], r] : s[i] = r, !c) : ((!s[i] || !N.isObject(s[i])) && (s[i] = []), t(n, r, s[i], a) && N.isArray(s[i]) && (s[i] = th(s[i])), !c);
  }
  if (N.isFormData(e) && N.isFunction(e.entries)) {
    const n = {};
    return N.forEachEntry(e, (r, s) => {
      t(eh(r), s, n, 0);
    }), n;
  }
  return null;
}
function nh(e, t, n) {
  if (N.isString(e))
    try {
      return (t || JSON.parse)(e), N.trim(e);
    } catch (r) {
      if (r.name !== "SyntaxError")
        throw r;
    }
  return (n || JSON.stringify)(e);
}
const ar = {
  transitional: Dc,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [function(t, n) {
    const r = n.getContentType() || "", s = r.indexOf("application/json") > -1, a = N.isObject(t);
    if (a && N.isHTMLForm(t) && (t = new FormData(t)), N.isFormData(t))
      return s ? JSON.stringify(Fc(t)) : t;
    if (N.isArrayBuffer(t) || N.isBuffer(t) || N.isStream(t) || N.isFile(t) || N.isBlob(t) || N.isReadableStream(t))
      return t;
    if (N.isArrayBufferView(t))
      return t.buffer;
    if (N.isURLSearchParams(t))
      return n.setContentType("application/x-www-form-urlencoded;charset=utf-8", !1), t.toString();
    let c;
    if (a) {
      if (r.indexOf("application/x-www-form-urlencoded") > -1)
        return Zm(t, this.formSerializer).toString();
      if ((c = N.isFileList(t)) || r.indexOf("multipart/form-data") > -1) {
        const d = this.env && this.env.FormData;
        return mo(
          c ? { "files[]": t } : t,
          d && new d(),
          this.formSerializer
        );
      }
    }
    return a || s ? (n.setContentType("application/json", !1), nh(t)) : t;
  }],
  transformResponse: [function(t) {
    const n = this.transitional || ar.transitional, r = n && n.forcedJSONParsing, s = this.responseType === "json";
    if (N.isResponse(t) || N.isReadableStream(t))
      return t;
    if (t && N.isString(t) && (r && !this.responseType || s)) {
      const i = !(n && n.silentJSONParsing) && s;
      try {
        return JSON.parse(t, this.parseReviver);
      } catch (c) {
        if (i)
          throw c.name === "SyntaxError" ? V.from(c, V.ERR_BAD_RESPONSE, this, null, this.response) : c;
      }
    }
    return t;
  }],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: ze.classes.FormData,
    Blob: ze.classes.Blob
  },
  validateStatus: function(t) {
    return t >= 200 && t < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
N.forEach(["delete", "get", "head", "post", "put", "patch"], (e) => {
  ar.headers[e] = {};
});
const rh = N.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]), oh = (e) => {
  const t = {};
  let n, r, s;
  return e && e.split(`
`).forEach(function(i) {
    s = i.indexOf(":"), n = i.substring(0, s).trim().toLowerCase(), r = i.substring(s + 1).trim(), !(!n || t[n] && rh[n]) && (n === "set-cookie" ? t[n] ? t[n].push(r) : t[n] = [r] : t[n] = t[n] ? t[n] + ", " + r : r);
  }), t;
}, Qa = Symbol("internals");
function Kn(e) {
  return e && String(e).trim().toLowerCase();
}
function Mr(e) {
  return e === !1 || e == null ? e : N.isArray(e) ? e.map(Mr) : String(e);
}
function sh(e) {
  const t = /* @__PURE__ */ Object.create(null), n = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let r;
  for (; r = n.exec(e); )
    t[r[1]] = r[2];
  return t;
}
const ah = (e) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim());
function Uo(e, t, n, r, s) {
  if (N.isFunction(r))
    return r.call(this, t, n);
  if (s && (t = n), !!N.isString(t)) {
    if (N.isString(r))
      return t.indexOf(r) !== -1;
    if (N.isRegExp(r))
      return r.test(t);
  }
}
function ih(e) {
  return e.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (t, n, r) => n.toUpperCase() + r);
}
function ch(e, t) {
  const n = N.toCamelCase(" " + t);
  ["get", "set", "has"].forEach((r) => {
    Object.defineProperty(e, r + n, {
      value: function(s, a, i) {
        return this[r].call(this, t, s, a, i);
      },
      configurable: !0
    });
  });
}
let Qe = class {
  constructor(t) {
    t && this.set(t);
  }
  set(t, n, r) {
    const s = this;
    function a(c, d, l) {
      const u = Kn(d);
      if (!u)
        throw new Error("header name must be a non-empty string");
      const f = N.findKey(s, u);
      (!f || s[f] === void 0 || l === !0 || l === void 0 && s[f] !== !1) && (s[f || d] = Mr(c));
    }
    const i = (c, d) => N.forEach(c, (l, u) => a(l, u, d));
    if (N.isPlainObject(t) || t instanceof this.constructor)
      i(t, n);
    else if (N.isString(t) && (t = t.trim()) && !ah(t))
      i(oh(t), n);
    else if (N.isObject(t) && N.isIterable(t)) {
      let c = {}, d, l;
      for (const u of t) {
        if (!N.isArray(u))
          throw TypeError("Object iterator must return a key-value pair");
        c[l = u[0]] = (d = c[l]) ? N.isArray(d) ? [...d, u[1]] : [d, u[1]] : u[1];
      }
      i(c, n);
    } else
      t != null && a(n, t, r);
    return this;
  }
  get(t, n) {
    if (t = Kn(t), t) {
      const r = N.findKey(this, t);
      if (r) {
        const s = this[r];
        if (!n)
          return s;
        if (n === !0)
          return sh(s);
        if (N.isFunction(n))
          return n.call(this, s, r);
        if (N.isRegExp(n))
          return n.exec(s);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(t, n) {
    if (t = Kn(t), t) {
      const r = N.findKey(this, t);
      return !!(r && this[r] !== void 0 && (!n || Uo(this, this[r], r, n)));
    }
    return !1;
  }
  delete(t, n) {
    const r = this;
    let s = !1;
    function a(i) {
      if (i = Kn(i), i) {
        const c = N.findKey(r, i);
        c && (!n || Uo(r, r[c], c, n)) && (delete r[c], s = !0);
      }
    }
    return N.isArray(t) ? t.forEach(a) : a(t), s;
  }
  clear(t) {
    const n = Object.keys(this);
    let r = n.length, s = !1;
    for (; r--; ) {
      const a = n[r];
      (!t || Uo(this, this[a], a, t, !0)) && (delete this[a], s = !0);
    }
    return s;
  }
  normalize(t) {
    const n = this, r = {};
    return N.forEach(this, (s, a) => {
      const i = N.findKey(r, a);
      if (i) {
        n[i] = Mr(s), delete n[a];
        return;
      }
      const c = t ? ih(a) : String(a).trim();
      c !== a && delete n[a], n[c] = Mr(s), r[c] = !0;
    }), this;
  }
  concat(...t) {
    return this.constructor.concat(this, ...t);
  }
  toJSON(t) {
    const n = /* @__PURE__ */ Object.create(null);
    return N.forEach(this, (r, s) => {
      r != null && r !== !1 && (n[s] = t && N.isArray(r) ? r.join(", ") : r);
    }), n;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([t, n]) => t + ": " + n).join(`
`);
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(t) {
    return t instanceof this ? t : new this(t);
  }
  static concat(t, ...n) {
    const r = new this(t);
    return n.forEach((s) => r.set(s)), r;
  }
  static accessor(t) {
    const r = (this[Qa] = this[Qa] = {
      accessors: {}
    }).accessors, s = this.prototype;
    function a(i) {
      const c = Kn(i);
      r[c] || (ch(s, i), r[c] = !0);
    }
    return N.isArray(t) ? t.forEach(a) : a(t), this;
  }
};
Qe.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
N.reduceDescriptors(Qe.prototype, ({ value: e }, t) => {
  let n = t[0].toUpperCase() + t.slice(1);
  return {
    get: () => e,
    set(r) {
      this[n] = r;
    }
  };
});
N.freezeMethods(Qe);
function Bo(e, t) {
  const n = this || ar, r = t || n, s = Qe.from(r.headers);
  let a = r.data;
  return N.forEach(e, function(c) {
    a = c.call(n, a, s.normalize(), t ? t.status : void 0);
  }), s.normalize(), a;
}
function Lc(e) {
  return !!(e && e.__CANCEL__);
}
function Ln(e, t, n) {
  V.call(this, e ?? "canceled", V.ERR_CANCELED, t, n), this.name = "CanceledError";
}
N.inherits(Ln, V, {
  __CANCEL__: !0
});
function $c(e, t, n) {
  const r = n.config.validateStatus;
  !n.status || !r || r(n.status) ? e(n) : t(new V(
    "Request failed with status code " + n.status,
    [V.ERR_BAD_REQUEST, V.ERR_BAD_RESPONSE][Math.floor(n.status / 100) - 4],
    n.config,
    n.request,
    n
  ));
}
function lh(e) {
  const t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return t && t[1] || "";
}
function dh(e, t) {
  e = e || 10;
  const n = new Array(e), r = new Array(e);
  let s = 0, a = 0, i;
  return t = t !== void 0 ? t : 1e3, function(d) {
    const l = Date.now(), u = r[a];
    i || (i = l), n[s] = d, r[s] = l;
    let f = a, v = 0;
    for (; f !== s; )
      v += n[f++], f = f % e;
    if (s = (s + 1) % e, s === a && (a = (a + 1) % e), l - i < t)
      return;
    const w = u && l - u;
    return w ? Math.round(v * 1e3 / w) : void 0;
  };
}
function uh(e, t) {
  let n = 0, r = 1e3 / t, s, a;
  const i = (l, u = Date.now()) => {
    n = u, s = null, a && (clearTimeout(a), a = null), e(...l);
  };
  return [(...l) => {
    const u = Date.now(), f = u - n;
    f >= r ? i(l, u) : (s = l, a || (a = setTimeout(() => {
      a = null, i(s);
    }, r - f)));
  }, () => s && i(s)];
}
const qr = (e, t, n = 3) => {
  let r = 0;
  const s = dh(50, 250);
  return uh((a) => {
    const i = a.loaded, c = a.lengthComputable ? a.total : void 0, d = i - r, l = s(d), u = i <= c;
    r = i;
    const f = {
      loaded: i,
      total: c,
      progress: c ? i / c : void 0,
      bytes: d,
      rate: l || void 0,
      estimated: l && c && u ? (c - i) / l : void 0,
      event: a,
      lengthComputable: c != null,
      [t ? "download" : "upload"]: !0
    };
    e(f);
  }, n);
}, Ya = (e, t) => {
  const n = e != null;
  return [(r) => t[0]({
    lengthComputable: n,
    total: e,
    loaded: r
  }), t[1]];
}, Xa = (e) => (...t) => N.asap(() => e(...t)), fh = ze.hasStandardBrowserEnv ? /* @__PURE__ */ ((e, t) => (n) => (n = new URL(n, ze.origin), e.protocol === n.protocol && e.host === n.host && (t || e.port === n.port)))(
  new URL(ze.origin),
  ze.navigator && /(msie|trident)/i.test(ze.navigator.userAgent)
) : () => !0, ph = ze.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(e, t, n, r, s, a, i) {
      if (typeof document > "u") return;
      const c = [`${e}=${encodeURIComponent(t)}`];
      N.isNumber(n) && c.push(`expires=${new Date(n).toUTCString()}`), N.isString(r) && c.push(`path=${r}`), N.isString(s) && c.push(`domain=${s}`), a === !0 && c.push("secure"), N.isString(i) && c.push(`SameSite=${i}`), document.cookie = c.join("; ");
    },
    read(e) {
      if (typeof document > "u") return null;
      const t = document.cookie.match(new RegExp("(?:^|; )" + e + "=([^;]*)"));
      return t ? decodeURIComponent(t[1]) : null;
    },
    remove(e) {
      this.write(e, "", Date.now() - 864e5, "/");
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);
function mh(e) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
}
function hh(e, t) {
  return t ? e.replace(/\/?\/$/, "") + "/" + t.replace(/^\/+/, "") : e;
}
function Uc(e, t, n) {
  let r = !mh(t);
  return e && (r || n == !1) ? hh(e, t) : t;
}
const Ja = (e) => e instanceof Qe ? { ...e } : e;
function fn(e, t) {
  t = t || {};
  const n = {};
  function r(l, u, f, v) {
    return N.isPlainObject(l) && N.isPlainObject(u) ? N.merge.call({ caseless: v }, l, u) : N.isPlainObject(u) ? N.merge({}, u) : N.isArray(u) ? u.slice() : u;
  }
  function s(l, u, f, v) {
    if (N.isUndefined(u)) {
      if (!N.isUndefined(l))
        return r(void 0, l, f, v);
    } else return r(l, u, f, v);
  }
  function a(l, u) {
    if (!N.isUndefined(u))
      return r(void 0, u);
  }
  function i(l, u) {
    if (N.isUndefined(u)) {
      if (!N.isUndefined(l))
        return r(void 0, l);
    } else return r(void 0, u);
  }
  function c(l, u, f) {
    if (f in t)
      return r(l, u);
    if (f in e)
      return r(void 0, l);
  }
  const d = {
    url: a,
    method: a,
    data: a,
    baseURL: i,
    transformRequest: i,
    transformResponse: i,
    paramsSerializer: i,
    timeout: i,
    timeoutMessage: i,
    withCredentials: i,
    withXSRFToken: i,
    adapter: i,
    responseType: i,
    xsrfCookieName: i,
    xsrfHeaderName: i,
    onUploadProgress: i,
    onDownloadProgress: i,
    decompress: i,
    maxContentLength: i,
    maxBodyLength: i,
    beforeRedirect: i,
    transport: i,
    httpAgent: i,
    httpsAgent: i,
    cancelToken: i,
    socketPath: i,
    responseEncoding: i,
    validateStatus: c,
    headers: (l, u, f) => s(Ja(l), Ja(u), f, !0)
  };
  return N.forEach(Object.keys({ ...e, ...t }), function(u) {
    const f = d[u] || s, v = f(e[u], t[u], u);
    N.isUndefined(v) && f !== c || (n[u] = v);
  }), n;
}
const Bc = (e) => {
  const t = fn({}, e);
  let { data: n, withXSRFToken: r, xsrfHeaderName: s, xsrfCookieName: a, headers: i, auth: c } = t;
  if (t.headers = i = Qe.from(i), t.url = Oc(Uc(t.baseURL, t.url, t.allowAbsoluteUrls), e.params, e.paramsSerializer), c && i.set(
    "Authorization",
    "Basic " + btoa((c.username || "") + ":" + (c.password ? unescape(encodeURIComponent(c.password)) : ""))
  ), N.isFormData(n)) {
    if (ze.hasStandardBrowserEnv || ze.hasStandardBrowserWebWorkerEnv)
      i.setContentType(void 0);
    else if (N.isFunction(n.getHeaders)) {
      const d = n.getHeaders(), l = ["content-type", "content-length"];
      Object.entries(d).forEach(([u, f]) => {
        l.includes(u.toLowerCase()) && i.set(u, f);
      });
    }
  }
  if (ze.hasStandardBrowserEnv && (r && N.isFunction(r) && (r = r(t)), r || r !== !1 && fh(t.url))) {
    const d = s && a && ph.read(a);
    d && i.set(s, d);
  }
  return t;
}, gh = typeof XMLHttpRequest < "u", yh = gh && function(e) {
  return new Promise(function(n, r) {
    const s = Bc(e);
    let a = s.data;
    const i = Qe.from(s.headers).normalize();
    let { responseType: c, onUploadProgress: d, onDownloadProgress: l } = s, u, f, v, w, g;
    function p() {
      w && w(), g && g(), s.cancelToken && s.cancelToken.unsubscribe(u), s.signal && s.signal.removeEventListener("abort", u);
    }
    let y = new XMLHttpRequest();
    y.open(s.method.toUpperCase(), s.url, !0), y.timeout = s.timeout;
    function C() {
      if (!y)
        return;
      const b = Qe.from(
        "getAllResponseHeaders" in y && y.getAllResponseHeaders()
      ), E = {
        data: !c || c === "text" || c === "json" ? y.responseText : y.response,
        status: y.status,
        statusText: y.statusText,
        headers: b,
        config: e,
        request: y
      };
      $c(function(T) {
        n(T), p();
      }, function(T) {
        r(T), p();
      }, E), y = null;
    }
    "onloadend" in y ? y.onloadend = C : y.onreadystatechange = function() {
      !y || y.readyState !== 4 || y.status === 0 && !(y.responseURL && y.responseURL.indexOf("file:") === 0) || setTimeout(C);
    }, y.onabort = function() {
      y && (r(new V("Request aborted", V.ECONNABORTED, e, y)), y = null);
    }, y.onerror = function(x) {
      const E = x && x.message ? x.message : "Network Error", k = new V(E, V.ERR_NETWORK, e, y);
      k.event = x || null, r(k), y = null;
    }, y.ontimeout = function() {
      let x = s.timeout ? "timeout of " + s.timeout + "ms exceeded" : "timeout exceeded";
      const E = s.transitional || Dc;
      s.timeoutErrorMessage && (x = s.timeoutErrorMessage), r(new V(
        x,
        E.clarifyTimeoutError ? V.ETIMEDOUT : V.ECONNABORTED,
        e,
        y
      )), y = null;
    }, a === void 0 && i.setContentType(null), "setRequestHeader" in y && N.forEach(i.toJSON(), function(x, E) {
      y.setRequestHeader(E, x);
    }), N.isUndefined(s.withCredentials) || (y.withCredentials = !!s.withCredentials), c && c !== "json" && (y.responseType = s.responseType), l && ([v, g] = qr(l, !0), y.addEventListener("progress", v)), d && y.upload && ([f, w] = qr(d), y.upload.addEventListener("progress", f), y.upload.addEventListener("loadend", w)), (s.cancelToken || s.signal) && (u = (b) => {
      y && (r(!b || b.type ? new Ln(null, e, y) : b), y.abort(), y = null);
    }, s.cancelToken && s.cancelToken.subscribe(u), s.signal && (s.signal.aborted ? u() : s.signal.addEventListener("abort", u)));
    const S = lh(s.url);
    if (S && ze.protocols.indexOf(S) === -1) {
      r(new V("Unsupported protocol " + S + ":", V.ERR_BAD_REQUEST, e));
      return;
    }
    y.send(a || null);
  });
}, vh = (e, t) => {
  const { length: n } = e = e ? e.filter(Boolean) : [];
  if (t || n) {
    let r = new AbortController(), s;
    const a = function(l) {
      if (!s) {
        s = !0, c();
        const u = l instanceof Error ? l : this.reason;
        r.abort(u instanceof V ? u : new Ln(u instanceof Error ? u.message : u));
      }
    };
    let i = t && setTimeout(() => {
      i = null, a(new V(`timeout ${t} of ms exceeded`, V.ETIMEDOUT));
    }, t);
    const c = () => {
      e && (i && clearTimeout(i), i = null, e.forEach((l) => {
        l.unsubscribe ? l.unsubscribe(a) : l.removeEventListener("abort", a);
      }), e = null);
    };
    e.forEach((l) => l.addEventListener("abort", a));
    const { signal: d } = r;
    return d.unsubscribe = () => N.asap(c), d;
  }
}, wh = function* (e, t) {
  let n = e.byteLength;
  if (n < t) {
    yield e;
    return;
  }
  let r = 0, s;
  for (; r < n; )
    s = r + t, yield e.slice(r, s), r = s;
}, bh = async function* (e, t) {
  for await (const n of Ch(e))
    yield* wh(n, t);
}, Ch = async function* (e) {
  if (e[Symbol.asyncIterator]) {
    yield* e;
    return;
  }
  const t = e.getReader();
  try {
    for (; ; ) {
      const { done: n, value: r } = await t.read();
      if (n)
        break;
      yield r;
    }
  } finally {
    await t.cancel();
  }
}, Za = (e, t, n, r) => {
  const s = bh(e, t);
  let a = 0, i, c = (d) => {
    i || (i = !0, r && r(d));
  };
  return new ReadableStream({
    async pull(d) {
      try {
        const { done: l, value: u } = await s.next();
        if (l) {
          c(), d.close();
          return;
        }
        let f = u.byteLength;
        if (n) {
          let v = a += f;
          n(v);
        }
        d.enqueue(new Uint8Array(u));
      } catch (l) {
        throw c(l), l;
      }
    },
    cancel(d) {
      return c(d), s.return();
    }
  }, {
    highWaterMark: 2
  });
}, ei = 64 * 1024, { isFunction: Sr } = N, Sh = (({ Request: e, Response: t }) => ({
  Request: e,
  Response: t
}))(N.global), {
  ReadableStream: ti,
  TextEncoder: ni
} = N.global, ri = (e, ...t) => {
  try {
    return !!e(...t);
  } catch {
    return !1;
  }
}, xh = (e) => {
  e = N.merge.call({
    skipUndefined: !0
  }, Sh, e);
  const { fetch: t, Request: n, Response: r } = e, s = t ? Sr(t) : typeof fetch == "function", a = Sr(n), i = Sr(r);
  if (!s)
    return !1;
  const c = s && Sr(ti), d = s && (typeof ni == "function" ? /* @__PURE__ */ ((g) => (p) => g.encode(p))(new ni()) : async (g) => new Uint8Array(await new n(g).arrayBuffer())), l = a && c && ri(() => {
    let g = !1;
    const p = new n(ze.origin, {
      body: new ti(),
      method: "POST",
      get duplex() {
        return g = !0, "half";
      }
    }).headers.has("Content-Type");
    return g && !p;
  }), u = i && c && ri(() => N.isReadableStream(new r("").body)), f = {
    stream: u && ((g) => g.body)
  };
  s && ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((g) => {
    !f[g] && (f[g] = (p, y) => {
      let C = p && p[g];
      if (C)
        return C.call(p);
      throw new V(`Response type '${g}' is not supported`, V.ERR_NOT_SUPPORT, y);
    });
  });
  const v = async (g) => {
    if (g == null)
      return 0;
    if (N.isBlob(g))
      return g.size;
    if (N.isSpecCompliantForm(g))
      return (await new n(ze.origin, {
        method: "POST",
        body: g
      }).arrayBuffer()).byteLength;
    if (N.isArrayBufferView(g) || N.isArrayBuffer(g))
      return g.byteLength;
    if (N.isURLSearchParams(g) && (g = g + ""), N.isString(g))
      return (await d(g)).byteLength;
  }, w = async (g, p) => {
    const y = N.toFiniteNumber(g.getContentLength());
    return y ?? v(p);
  };
  return async (g) => {
    let {
      url: p,
      method: y,
      data: C,
      signal: S,
      cancelToken: b,
      timeout: x,
      onDownloadProgress: E,
      onUploadProgress: k,
      responseType: T,
      headers: P,
      withCredentials: B = "same-origin",
      fetchOptions: z
    } = Bc(g), H = t || fetch;
    T = T ? (T + "").toLowerCase() : "text";
    let I = vh([S, b && b.toAbortSignal()], x), K = null;
    const q = I && I.unsubscribe && (() => {
      I.unsubscribe();
    });
    let ee;
    try {
      if (k && l && y !== "get" && y !== "head" && (ee = await w(P, C)) !== 0) {
        let X = new n(p, {
          method: "POST",
          body: C,
          duplex: "half"
        }), xe;
        if (N.isFormData(C) && (xe = X.headers.get("content-type")) && P.setContentType(xe), X.body) {
          const [qe, Ne] = Ya(
            ee,
            qr(Xa(k))
          );
          C = Za(X.body, ei, qe, Ne);
        }
      }
      N.isString(B) || (B = B ? "include" : "omit");
      const $ = a && "credentials" in n.prototype, G = {
        ...z,
        signal: I,
        method: y.toUpperCase(),
        headers: P.normalize().toJSON(),
        body: C,
        duplex: "half",
        credentials: $ ? B : void 0
      };
      K = a && new n(p, G);
      let O = await (a ? H(K, z) : H(p, G));
      const M = u && (T === "stream" || T === "response");
      if (u && (E || M && q)) {
        const X = {};
        ["status", "statusText", "headers"].forEach((He) => {
          X[He] = O[He];
        });
        const xe = N.toFiniteNumber(O.headers.get("content-length")), [qe, Ne] = E && Ya(
          xe,
          qr(Xa(E), !0)
        ) || [];
        O = new r(
          Za(O.body, ei, qe, () => {
            Ne && Ne(), q && q();
          }),
          X
        );
      }
      T = T || "text";
      let ae = await f[N.findKey(f, T) || "text"](O, g);
      return !M && q && q(), await new Promise((X, xe) => {
        $c(X, xe, {
          data: ae,
          headers: Qe.from(O.headers),
          status: O.status,
          statusText: O.statusText,
          config: g,
          request: K
        });
      });
    } catch ($) {
      throw q && q(), $ && $.name === "TypeError" && /Load failed|fetch/i.test($.message) ? Object.assign(
        new V("Network Error", V.ERR_NETWORK, g, K),
        {
          cause: $.cause || $
        }
      ) : V.from($, $ && $.code, g, K);
    }
  };
}, Nh = /* @__PURE__ */ new Map(), zc = (e) => {
  let t = e && e.env || {};
  const { fetch: n, Request: r, Response: s } = t, a = [
    r,
    s,
    n
  ];
  let i = a.length, c = i, d, l, u = Nh;
  for (; c--; )
    d = a[c], l = u.get(d), l === void 0 && u.set(d, l = c ? /* @__PURE__ */ new Map() : xh(t)), u = l;
  return l;
};
zc();
const Us = {
  http: zm,
  xhr: yh,
  fetch: {
    get: zc
  }
};
N.forEach(Us, (e, t) => {
  if (e) {
    try {
      Object.defineProperty(e, "name", { value: t });
    } catch {
    }
    Object.defineProperty(e, "adapterName", { value: t });
  }
});
const oi = (e) => `- ${e}`, Eh = (e) => N.isFunction(e) || e === null || e === !1;
function Th(e, t) {
  e = N.isArray(e) ? e : [e];
  const { length: n } = e;
  let r, s;
  const a = {};
  for (let i = 0; i < n; i++) {
    r = e[i];
    let c;
    if (s = r, !Eh(r) && (s = Us[(c = String(r)).toLowerCase()], s === void 0))
      throw new V(`Unknown adapter '${c}'`);
    if (s && (N.isFunction(s) || (s = s.get(t))))
      break;
    a[c || "#" + i] = s;
  }
  if (!s) {
    const i = Object.entries(a).map(
      ([d, l]) => `adapter ${d} ` + (l === !1 ? "is not supported by the environment" : "is not available in the build")
    );
    let c = n ? i.length > 1 ? `since :
` + i.map(oi).join(`
`) : " " + oi(i[0]) : "as no adapter specified";
    throw new V(
      "There is no suitable adapter to dispatch the request " + c,
      "ERR_NOT_SUPPORT"
    );
  }
  return s;
}
const qc = {
  /**
   * Resolve an adapter from a list of adapter names or functions.
   * @type {Function}
   */
  getAdapter: Th,
  /**
   * Exposes all known adapters
   * @type {Object<string, Function|Object>}
   */
  adapters: Us
};
function zo(e) {
  if (e.cancelToken && e.cancelToken.throwIfRequested(), e.signal && e.signal.aborted)
    throw new Ln(null, e);
}
function si(e) {
  return zo(e), e.headers = Qe.from(e.headers), e.data = Bo.call(
    e,
    e.transformRequest
  ), ["post", "put", "patch"].indexOf(e.method) !== -1 && e.headers.setContentType("application/x-www-form-urlencoded", !1), qc.getAdapter(e.adapter || ar.adapter, e)(e).then(function(r) {
    return zo(e), r.data = Bo.call(
      e,
      e.transformResponse,
      r
    ), r.headers = Qe.from(r.headers), r;
  }, function(r) {
    return Lc(r) || (zo(e), r && r.response && (r.response.data = Bo.call(
      e,
      e.transformResponse,
      r.response
    ), r.response.headers = Qe.from(r.response.headers))), Promise.reject(r);
  });
}
const Hc = "1.13.2", ho = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((e, t) => {
  ho[e] = function(r) {
    return typeof r === e || "a" + (t < 1 ? "n " : " ") + e;
  };
});
const ai = {};
ho.transitional = function(t, n, r) {
  function s(a, i) {
    return "[Axios v" + Hc + "] Transitional option '" + a + "'" + i + (r ? ". " + r : "");
  }
  return (a, i, c) => {
    if (t === !1)
      throw new V(
        s(i, " has been removed" + (n ? " in " + n : "")),
        V.ERR_DEPRECATED
      );
    return n && !ai[i] && (ai[i] = !0, console.warn(
      s(
        i,
        " has been deprecated since v" + n + " and will be removed in the near future"
      )
    )), t ? t(a, i, c) : !0;
  };
};
ho.spelling = function(t) {
  return (n, r) => (console.warn(`${r} is likely a misspelling of ${t}`), !0);
};
function _h(e, t, n) {
  if (typeof e != "object")
    throw new V("options must be an object", V.ERR_BAD_OPTION_VALUE);
  const r = Object.keys(e);
  let s = r.length;
  for (; s-- > 0; ) {
    const a = r[s], i = t[a];
    if (i) {
      const c = e[a], d = c === void 0 || i(c, a, e);
      if (d !== !0)
        throw new V("option " + a + " must be " + d, V.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (n !== !0)
      throw new V("Unknown option " + a, V.ERR_BAD_OPTION);
  }
}
const kr = {
  assertOptions: _h,
  validators: ho
}, gt = kr.validators;
let dn = class {
  constructor(t) {
    this.defaults = t || {}, this.interceptors = {
      request: new Ga(),
      response: new Ga()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(t, n) {
    try {
      return await this._request(t, n);
    } catch (r) {
      if (r instanceof Error) {
        let s = {};
        Error.captureStackTrace ? Error.captureStackTrace(s) : s = new Error();
        const a = s.stack ? s.stack.replace(/^.+\n/, "") : "";
        try {
          r.stack ? a && !String(r.stack).endsWith(a.replace(/^.+\n.+\n/, "")) && (r.stack += `
` + a) : r.stack = a;
        } catch {
        }
      }
      throw r;
    }
  }
  _request(t, n) {
    typeof t == "string" ? (n = n || {}, n.url = t) : n = t || {}, n = fn(this.defaults, n);
    const { transitional: r, paramsSerializer: s, headers: a } = n;
    r !== void 0 && kr.assertOptions(r, {
      silentJSONParsing: gt.transitional(gt.boolean),
      forcedJSONParsing: gt.transitional(gt.boolean),
      clarifyTimeoutError: gt.transitional(gt.boolean)
    }, !1), s != null && (N.isFunction(s) ? n.paramsSerializer = {
      serialize: s
    } : kr.assertOptions(s, {
      encode: gt.function,
      serialize: gt.function
    }, !0)), n.allowAbsoluteUrls !== void 0 || (this.defaults.allowAbsoluteUrls !== void 0 ? n.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls : n.allowAbsoluteUrls = !0), kr.assertOptions(n, {
      baseUrl: gt.spelling("baseURL"),
      withXsrfToken: gt.spelling("withXSRFToken")
    }, !0), n.method = (n.method || this.defaults.method || "get").toLowerCase();
    let i = a && N.merge(
      a.common,
      a[n.method]
    );
    a && N.forEach(
      ["delete", "get", "head", "post", "put", "patch", "common"],
      (g) => {
        delete a[g];
      }
    ), n.headers = Qe.concat(i, a);
    const c = [];
    let d = !0;
    this.interceptors.request.forEach(function(p) {
      typeof p.runWhen == "function" && p.runWhen(n) === !1 || (d = d && p.synchronous, c.unshift(p.fulfilled, p.rejected));
    });
    const l = [];
    this.interceptors.response.forEach(function(p) {
      l.push(p.fulfilled, p.rejected);
    });
    let u, f = 0, v;
    if (!d) {
      const g = [si.bind(this), void 0];
      for (g.unshift(...c), g.push(...l), v = g.length, u = Promise.resolve(n); f < v; )
        u = u.then(g[f++], g[f++]);
      return u;
    }
    v = c.length;
    let w = n;
    for (; f < v; ) {
      const g = c[f++], p = c[f++];
      try {
        w = g(w);
      } catch (y) {
        p.call(this, y);
        break;
      }
    }
    try {
      u = si.call(this, w);
    } catch (g) {
      return Promise.reject(g);
    }
    for (f = 0, v = l.length; f < v; )
      u = u.then(l[f++], l[f++]);
    return u;
  }
  getUri(t) {
    t = fn(this.defaults, t);
    const n = Uc(t.baseURL, t.url, t.allowAbsoluteUrls);
    return Oc(n, t.params, t.paramsSerializer);
  }
};
N.forEach(["delete", "get", "head", "options"], function(t) {
  dn.prototype[t] = function(n, r) {
    return this.request(fn(r || {}, {
      method: t,
      url: n,
      data: (r || {}).data
    }));
  };
});
N.forEach(["post", "put", "patch"], function(t) {
  function n(r) {
    return function(a, i, c) {
      return this.request(fn(c || {}, {
        method: t,
        headers: r ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url: a,
        data: i
      }));
    };
  }
  dn.prototype[t] = n(), dn.prototype[t + "Form"] = n(!0);
});
let Rh = class jc {
  constructor(t) {
    if (typeof t != "function")
      throw new TypeError("executor must be a function.");
    let n;
    this.promise = new Promise(function(a) {
      n = a;
    });
    const r = this;
    this.promise.then((s) => {
      if (!r._listeners) return;
      let a = r._listeners.length;
      for (; a-- > 0; )
        r._listeners[a](s);
      r._listeners = null;
    }), this.promise.then = (s) => {
      let a;
      const i = new Promise((c) => {
        r.subscribe(c), a = c;
      }).then(s);
      return i.cancel = function() {
        r.unsubscribe(a);
      }, i;
    }, t(function(a, i, c) {
      r.reason || (r.reason = new Ln(a, i, c), n(r.reason));
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason)
      throw this.reason;
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(t) {
    if (this.reason) {
      t(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(t) : this._listeners = [t];
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(t) {
    if (!this._listeners)
      return;
    const n = this._listeners.indexOf(t);
    n !== -1 && this._listeners.splice(n, 1);
  }
  toAbortSignal() {
    const t = new AbortController(), n = (r) => {
      t.abort(r);
    };
    return this.subscribe(n), t.signal.unsubscribe = () => this.unsubscribe(n), t.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let t;
    return {
      token: new jc(function(s) {
        t = s;
      }),
      cancel: t
    };
  }
};
function Ah(e) {
  return function(n) {
    return e.apply(null, n);
  };
}
function Ph(e) {
  return N.isObject(e) && e.isAxiosError === !0;
}
const ds = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526
};
Object.entries(ds).forEach(([e, t]) => {
  ds[t] = e;
});
function Wc(e) {
  const t = new dn(e), n = Sc(dn.prototype.request, t);
  return N.extend(n, dn.prototype, t, { allOwnKeys: !0 }), N.extend(n, t, null, { allOwnKeys: !0 }), n.create = function(s) {
    return Wc(fn(e, s));
  }, n;
}
const Re = Wc(ar);
Re.Axios = dn;
Re.CanceledError = Ln;
Re.CancelToken = Rh;
Re.isCancel = Lc;
Re.VERSION = Hc;
Re.toFormData = mo;
Re.AxiosError = V;
Re.Cancel = Re.CanceledError;
Re.all = function(t) {
  return Promise.all(t);
};
Re.spread = Ah;
Re.isAxiosError = Ph;
Re.mergeConfig = fn;
Re.AxiosHeaders = Qe;
Re.formToJSON = (e) => Fc(N.isHTMLForm(e) ? new FormData(e) : e);
Re.getAdapter = qc.getAdapter;
Re.HttpStatusCode = ds;
Re.default = Re;
const {
  Axios: $x,
  AxiosError: Ux,
  CanceledError: Bx,
  isCancel: zx,
  CancelToken: qx,
  VERSION: Hx,
  all: jx,
  Cancel: Wx,
  isAxiosError: Kx,
  spread: Vx,
  toFormData: Gx,
  AxiosHeaders: Qx,
  HttpStatusCode: Yx,
  formToJSON: Xx,
  getAdapter: Jx,
  mergeConfig: Zx
} = Re, Mh = "http://localhost:8000/api/v1", kh = "error";
class Ih {
  constructor(t = {}) {
    pe(this, "instance");
    pe(this, "refreshPromise", null);
    pe(this, "isRefreshing", !1);
    pe(this, "logLevel", kh);
    this.instance = Re.create({
      baseURL: t.baseURL || Mh,
      timeout: t.timeout || 1e4,
      withCredentials: t.withCredentials !== !1,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    }), this.setupRequestInterceptor(), this.setupResponseInterceptor();
  }
  log(t, n, r) {
    const s = { debug: 0, info: 1, warn: 2, error: 3 }, a = s[this.logLevel];
    if (s[t] >= a) {
      const d = `[${(/* @__PURE__ */ new Date()).toISOString()}] [API Client] [${t.toUpperCase()}]`;
      r ? console.log(`${d} ${n}`, r) : console.log(`${d} ${n}`);
    }
  }
  setupRequestInterceptor() {
    this.instance.interceptors.request.use(
      (t) => {
        const n = this.getAuthToken(), r = this.getTenantId();
        return n && t.headers && (t.headers.Authorization = `Bearer ${n}`), r && t.headers && (t.headers["X-Tenant-ID"] = r), this.log("debug", `${t.method?.toUpperCase()} ${t.url}`, {
          headers: t.headers,
          data: t.data
        }), t;
      },
      (t) => (this.log("error", "Request interceptor error", t.message), Promise.reject(t))
    );
  }
  setupResponseInterceptor() {
    this.instance.interceptors.response.use(
      (t) => (this.log("debug", `Response received: ${t.status}`, {
        url: t.config.url,
        data: t.data
      }), t.data),
      async (t) => {
        const n = t.config;
        return t.response?.status === 401 ? this.handleUnauthorized(n, t) : (t.response?.status === 403 && this.log("warn", "Access forbidden (403)", {
          url: t.config?.url,
          data: t.response?.data
        }), t.response?.status === 400 && this.log("warn", "Bad request (400)", t.response?.data), t.response?.status === 500 && this.log("error", "Server error (500)", t.response?.data), (t.code === "ECONNABORTED" || t.code === "ERR_NETWORK") && this.log("warn", "Network error", t.message), Promise.reject(this.formatError(t)));
      }
    );
  }
  async handleUnauthorized(t, n) {
    const r = localStorage.getItem("login_timestamp");
    if (r) {
      const i = Date.now() - parseInt(r, 10);
      if (i < 1e4)
        return this.log("warn", "401 error within 10s of login - not logging out (grace period)", {
          timeSinceLogin: i,
          url: t.url
        }), Promise.reject(n);
    }
    const s = t.headers?.["X-Retry-Count"], a = parseInt(s || "0", 10);
    if (!t || this.isRefreshing || a >= 1)
      return this.log("warn", "Max retry attempts reached or already refreshing, logging out"), this.logout(), Promise.reject(n);
    this.isRefreshing = !0;
    try {
      this.refreshPromise || (this.refreshPromise = this.refreshToken());
      const i = await this.refreshPromise;
      return this.refreshPromise = null, this.isRefreshing = !1, t.headers && (t.headers.Authorization = `Bearer ${i}`, t.headers["X-Retry-Count"] = "1"), this.log("info", "Token refreshed, retrying request", { url: t.url }), this.instance(t);
    } catch (i) {
      return this.refreshPromise = null, this.isRefreshing = !1, this.log("error", "Token refresh failed, logging out"), this.logout(), Promise.reject(i);
    }
  }
  async refreshToken() {
    try {
      const t = await this.instance.post("/auth/refresh", {}), n = t.token || t.access_token;
      if (n)
        return localStorage.setItem("auth_token", n), this.log("info", "Token refreshed successfully"), n;
      throw new Error("No token in refresh response");
    } catch (t) {
      throw this.log("error", "Token refresh failed", t), t;
    }
  }
  formatError(t) {
    const n = t.response?.status || 0, r = t.response?.data;
    let s = t.message, a = null;
    return r?.message && (s = r.message), r?.details && (a = r.details), r?.error?.message && (s = r.error.message, a = r.error.details), {
      message: s,
      status: n,
      details: a,
      originalError: t
    };
  }
  getAuthToken() {
    return localStorage.getItem("auth_token");
  }
  getTenantId() {
    return localStorage.getItem("tenant_id");
  }
  logout() {
    localStorage.removeItem("auth_token"), localStorage.removeItem("user_id"), localStorage.removeItem("tenant_id"), localStorage.removeItem("login_timestamp"), this.log("info", "User logged out due to authentication error"), window.location.pathname !== "/login" && (window.location.href = "/login");
  }
  getClient() {
    return this.instance;
  }
  clearCache() {
    this.refreshPromise = null, this.isRefreshing = !1;
  }
}
const Kc = new Ih(), D = Kc.getClient(), zt = "/cms/admin/content-types", ii = "/cms/public/content-types", Xt = {
  admin: {
    async list(e) {
      const t = new URLSearchParams();
      return e?.scope && t.append("scope", e.scope), e?.is_active !== void 0 && t.append("is_active", String(e.is_active)), e?.search && t.append("search", e.search), e?.page && t.append("page", String(e.page)), e?.per_page && t.append("per_page", String(e.per_page)), D.get(`${zt}${t.toString() ? `?${t}` : ""}`);
    },
    async getById(e) {
      return D.get(`${zt}/${e}`);
    },
    async create(e) {
      return D.post(zt, e);
    },
    async update(e, t) {
      return D.put(`${zt}/${e}`, t);
    },
    async delete(e) {
      return D.delete(`${zt}/${e}`);
    },
    async activate(e) {
      return D.post(`${zt}/${e}/activate`, {});
    },
    async deactivate(e) {
      return D.post(`${zt}/${e}/deactivate`, {});
    },
    async getContentsCount(e) {
      return D.get(`${zt}/${e}/contents/count`);
    }
  },
  public: {
    async list(e) {
      const t = new URLSearchParams();
      return e?.is_active !== void 0 && t.append("is_active", String(e.is_active)), e?.search && t.append("search", e.search), e?.page && t.append("page", String(e.page)), e?.per_page && t.append("per_page", String(e.per_page)), D.get(`${ii}${t.toString() ? `?${t}` : ""}`);
    },
    async getBySlug(e) {
      return D.get(`${ii}/${e}`);
    }
  }
};
class Oh {
  async login(t) {
    console.log("AuthService.login called with:", { email: t.email, tenant_slug: t.tenant_slug, accountType: t.accountType });
    const n = t.accountType || "tenant";
    try {
      const r = await this.callRealAuthAPI(t);
      return this.processLoginResponse(r, n);
    } catch (r) {
      throw console.error("AuthService.login error:", r.message), r;
    }
  }
  async callRealAuthAPI(t) {
    try {
      const n = await D.post("/auth/login", {
        email: t.email,
        password: t.password,
        tenant_slug: t.tenant_slug,
        account_type: t.accountType || "tenant"
      });
      if (n.success) {
        const r = n.data;
        return {
          access_token: r.access_token,
          token_type: r.token_type,
          expires_in: 3600,
          user: r.user,
          account: r.account,
          tenant: r.tenant,
          permissions: r.permissions || [],
          roles: r.roles || []
        };
      } else
        throw new Error(n.message || "Login failed");
    } catch (n) {
      throw n.response?.data?.message ? new Error(n.response.data.message) : new Error("Login failed. Please check your credentials.");
    }
  }
  processLoginResponse(t, n) {
    const r = t.access_token || t.token;
    return console.log("AuthService: Processing login response", {
      hasToken: !!r,
      tokenType: r?.substring(0, 20) + "...",
      accountType: n,
      hasUser: !!t.user,
      hasTenant: !!t.tenant,
      hasAccount: !!t.account
    }), r && (this.setAuthToken(r), this.setAccountType(n), n === "platform" && t.account ? this.setPlatformAccount(t.account) : n === "tenant" && (t.user && this.setCurrentUser(t.user), t.tenant && this.setCurrentTenant(t.tenant)), t.permissions && this.setPermissions(t.permissions), t.roles && this.setRoles(t.roles)), t;
  }
  async register(t) {
    const n = t.accountType || "tenant";
    let r;
    const s = {
      name: t.name,
      email: t.email,
      password: t.password,
      password_confirmation: t.password_confirmation
    };
    n === "platform" ? r = "/platform/register" : (r = `/tenant/${t.tenant_id || "6ba7b810-9dad-11d1-80b4-00c04fd430c8"}/register`, t.role && (s.role = t.role));
    try {
      const a = await D.post(r, s), i = a.data;
      return i?.success && i?.data ? i.data : a.data;
    } catch (a) {
      throw a.response?.data?.error ? new Error(a.response.data.error.message || "Registration failed") : new Error(a.message || "Network error during registration");
    }
  }
  async forgotPassword(t) {
    return (await D.post("/auth/forgot-password", t)).data;
  }
  async resetPassword(t) {
    return (await D.post("/auth/reset-password", t)).data;
  }
  async verifyEmail(t) {
    return (await D.post("/auth/verify-email", t)).data;
  }
  async resendVerification(t) {
    return (await D.post("/auth/resend-verification", t)).data;
  }
  async logout() {
    try {
      const n = this.getAccountType() === "platform" ? "/platform/logout" : "/tenant/logout";
      await D.post(n, {});
    } catch {
      console.warn("Logout API call failed, clearing local auth data anyway");
    } finally {
      this.clearAuth();
    }
  }
  async refreshToken(t) {
    try {
      const n = await D.post("/auth/refresh", {
        refresh_token: t
      }), r = n.data;
      if (r?.success && r?.data) {
        const s = r.data;
        return s.access_token && this.setAuthToken(s.access_token), s;
      }
      return n.data;
    } catch (n) {
      throw this.clearAuth(), new Error(n.response?.data?.error?.message || "Token refresh failed");
    }
  }
  async getCurrentUser() {
    try {
      const t = await D.get("/auth/me"), n = t.data;
      if (n?.success && n?.data) {
        const r = n.data;
        return r.user && this.setCurrentUser(r.user), r.account && this.setPlatformAccount(r.account), r.tenant && this.setCurrentTenant(r.tenant), r;
      }
      return t.data;
    } catch (t) {
      throw t.response?.status === 401 && this.clearAuth(), new Error(t.response?.data?.error?.message || "Failed to get user data");
    }
  }
  async updateProfile(t) {
    const n = await D.put("/auth/profile", t), r = n.data;
    return r.user && this.setCurrentUser(r.user), n.data;
  }
  async changePassword(t) {
    return (await D.post("/auth/change-password", t)).data;
  }
  setAuthToken(t) {
    console.log("AuthService: Setting auth token", { tokenSnippet: t.substring(0, 20) + "..." }), localStorage.setItem("auth_token", t);
  }
  setAccountType(t) {
    localStorage.setItem("account_type", t);
  }
  setCurrentUser(t) {
    localStorage.setItem("user_id", t.id), localStorage.setItem("user", JSON.stringify(t));
  }
  setPlatformAccount(t) {
    localStorage.setItem("account_id", t.id), localStorage.setItem("account", JSON.stringify(t));
  }
  setCurrentTenant(t) {
    localStorage.setItem("tenant_id", t.id), localStorage.setItem("tenant", JSON.stringify(t));
  }
  setPermissions(t) {
    localStorage.setItem("permissions", JSON.stringify(t));
  }
  setRoles(t) {
    localStorage.setItem("roles", JSON.stringify(t));
  }
  clearAuth(t = !1) {
    const n = this.getAuthToken();
    if (console.log("AuthService: Clearing all authentication data", {
      hadToken: !!n,
      tokenSnippet: n?.substring(0, 20) + "...",
      forceClear: t,
      stackTrace: new Error().stack
    }), !t && this.shouldPreserveToken()) {
      console.log("AuthService: Skipping clearAuth for preserved token (demo mode)");
      return;
    }
    localStorage.removeItem("auth_token"), localStorage.removeItem("account_type"), localStorage.removeItem("user_id"), localStorage.removeItem("user"), localStorage.removeItem("account_id"), localStorage.removeItem("account"), localStorage.removeItem("tenant_id"), localStorage.removeItem("tenant"), localStorage.removeItem("permissions"), localStorage.removeItem("roles"), Kc.clearCache();
  }
  /**
   * Force complete authentication reset - clears everything and reloads page
   */
  forceAuthReset() {
    console.log("AuthService: Force resetting all authentication data"), this.clearAuth(!0), localStorage.clear(), window.location.reload();
  }
  /**
   * Debug method to check current auth state
   */
  debugAuthState() {
    const t = this.getToken();
    return {
      hasToken: !!t,
      tokenType: t?.substring(0, 20) + "...",
      isAuthenticated: this.isAuthenticated(),
      accountType: this.getAccountType(),
      user: this.getCurrentUserFromStorage(),
      tenant: this.getCurrentTenantFromStorage()
    };
  }
  /**
   * Force logout and redirect to login page
   */
  forceLogout() {
    console.log("AuthService: Force logout initiated"), this.clearAuth(!0), window.location.href = "/login";
  }
  /**
   * Check if the current token should be preserved
   */
  shouldPreserveToken() {
    return !1;
  }
  getAuthToken() {
    return localStorage.getItem("auth_token");
  }
  getAccountType() {
    return localStorage.getItem("account_type");
  }
  getCurrentUserFromStorage() {
    const t = localStorage.getItem("user");
    if (!t) return null;
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }
  getPlatformAccountFromStorage() {
    const t = localStorage.getItem("account");
    if (!t) return null;
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }
  getCurrentTenantFromStorage() {
    const t = localStorage.getItem("tenant");
    if (!t) return null;
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }
  getPermissionsFromStorage() {
    const t = localStorage.getItem("permissions");
    if (!t) return [];
    try {
      return JSON.parse(t);
    } catch {
      return [];
    }
  }
  getRolesFromStorage() {
    const t = localStorage.getItem("roles");
    if (!t) return [];
    try {
      return JSON.parse(t);
    } catch {
      return [];
    }
  }
  isAuthenticated() {
    return !!this.getAuthToken();
  }
  getToken() {
    return this.getAuthToken();
  }
  getUserIdFromStorage() {
    return localStorage.getItem("user_id");
  }
  getTenantIdFromStorage() {
    return this.getCurrentTenantFromStorage()?.uuid || null;
  }
}
const Dh = new Oh();
typeof window < "u" && (window.authService = Dh);
const Fh = (e, t) => {
  Qp.captureException(e, {
    contexts: t ? { custom: t } : void 0
  });
};
class Lh {
  constructor() {
    pe(this, "sessionId");
    pe(this, "logQueue", []);
    pe(this, "flushInterval", null);
    pe(this, "BATCH_SIZE", 10);
    pe(this, "FLUSH_INTERVAL", 5e3);
    pe(this, "MAX_QUEUE_SIZE", 100);
    this.sessionId = this.generateSessionId(), this.startAutoFlush(), typeof window < "u" && window.addEventListener("beforeunload", () => this.flush());
  }
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  startAutoFlush() {
    this.flushInterval = setInterval(() => {
      this.logQueue.length > 0 && this.flush();
    }, this.FLUSH_INTERVAL);
  }
  createLogEvent(t, n, r) {
    return {
      level: t,
      message: n,
      context: r,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      tenantId: localStorage.getItem("tenant_id") || void 0,
      userId: localStorage.getItem("user_id") || void 0,
      accountType: localStorage.getItem("account_type") || void 0,
      sessionId: this.sessionId
    };
  }
  async sendToBackend(t) {
    if (t.length === 0) return;
    const n = localStorage.getItem("token");
    if (!n)
      return;
    const r = localStorage.getItem("account_type"), s = r === "platform" ? "/api/v1/platform/logs" : "/api/v1/tenant/logs";
    try {
      await fetch(s, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${n}`,
          ...r === "tenant" && {
            "X-Tenant-ID": localStorage.getItem("tenant_id") || ""
          }
        },
        body: JSON.stringify({ logs: t })
      });
    } catch {
    }
  }
  queueLog(t) {
    this.logQueue.push(t), this.logQueue.length > this.MAX_QUEUE_SIZE && this.logQueue.shift(), this.logQueue.length >= this.BATCH_SIZE && this.flush();
  }
  flush() {
    if (this.logQueue.length === 0) return;
    const t = [...this.logQueue];
    this.logQueue = [], this.sendToBackend(t);
  }
  info(t, n) {
    const r = this.createLogEvent("info", t, n);
    this.queueLog(r);
  }
  warn(t, n) {
    const r = this.createLogEvent("warn", t, n);
    console.warn(`[WARN] ${t}`, n), this.queueLog(r);
  }
  error(t, n, r) {
    const s = n instanceof Error ? n : new Error(String(n)), a = this.createLogEvent("error", t, {
      ...r,
      error: {
        name: s.name,
        message: s.message,
        stack: s.stack
      }
    });
    console.error(`[ERROR] ${t}`, s, r), this.queueLog(a), Fh(s, r);
  }
  debug(t, n) {
  }
  destroy() {
    this.flushInterval && (clearInterval(this.flushInterval), this.flushInterval = null), this.flush();
  }
}
const $h = new Lh();
typeof window < "u" && (window.__logger = $h);
let Vc = -1;
const $n = (e) => {
  addEventListener("pageshow", (t) => {
    t.persisted && (Vc = t.timeStamp, e(t));
  }, !0);
}, xt = (e, t, n, r) => {
  let s, a;
  return (i) => {
    t.value >= 0 && (i || r) && (a = t.value - (s ?? 0), (a || s === void 0) && (s = t.value, t.delta = a, t.rating = ((c, d) => c > d[1] ? "poor" : c > d[0] ? "needs-improvement" : "good")(t.value, n), e(t)));
  };
}, Bs = (e) => {
  requestAnimationFrame(() => requestAnimationFrame(() => e()));
}, zs = () => {
  const e = performance.getEntriesByType("navigation")[0];
  if (e && e.responseStart > 0 && e.responseStart < performance.now()) return e;
}, ir = () => zs()?.activationStart ?? 0, Nt = (e, t = -1) => {
  const n = zs();
  let r = "navigate";
  return Vc >= 0 ? r = "back-forward-cache" : n && (document.prerendering || ir() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : n.type && (r = n.type.replace(/_/g, "-"))), { name: e, value: t, rating: "good", delta: 0, entries: [], id: `v5-${Date.now()}-${Math.floor(8999999999999 * Math.random()) + 1e12}`, navigationType: r };
}, qo = /* @__PURE__ */ new WeakMap();
function qs(e, t) {
  return qo.get(e) || qo.set(e, new t()), qo.get(e);
}
class Uh {
  constructor() {
    pe(this, "t");
    pe(this, "i", 0);
    pe(this, "o", []);
  }
  h(t) {
    if (t.hadRecentInput) return;
    const n = this.o[0], r = this.o.at(-1);
    this.i && n && r && t.startTime - r.startTime < 1e3 && t.startTime - n.startTime < 5e3 ? (this.i += t.value, this.o.push(t)) : (this.i = t.value, this.o = [t]), this.t?.(t);
  }
}
const cr = (e, t, n = {}) => {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(e)) {
      const r = new PerformanceObserver((s) => {
        Promise.resolve().then(() => {
          t(s.getEntries());
        });
      });
      return r.observe({ type: e, buffered: !0, ...n }), r;
    }
  } catch {
  }
}, Hs = (e) => {
  let t = !1;
  return () => {
    t || (e(), t = !0);
  };
};
let Tn = -1;
const Gc = /* @__PURE__ */ new Set(), ci = () => document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0, us = (e) => {
  if (document.visibilityState === "hidden") {
    if (e.type === "visibilitychange") for (const t of Gc) t();
    isFinite(Tn) || (Tn = e.type === "visibilitychange" ? e.timeStamp : 0, removeEventListener("prerenderingchange", us, !0));
  }
}, go = () => {
  if (Tn < 0) {
    const e = ir();
    Tn = (document.prerendering ? void 0 : globalThis.performance.getEntriesByType("visibility-state").filter((n) => n.name === "hidden" && n.startTime > e)[0]?.startTime) ?? ci(), addEventListener("visibilitychange", us, !0), addEventListener("prerenderingchange", us, !0), $n(() => {
      setTimeout(() => {
        Tn = ci();
      });
    });
  }
  return { get firstHiddenTime() {
    return Tn;
  }, onHidden(e) {
    Gc.add(e);
  } };
}, yo = (e) => {
  document.prerendering ? addEventListener("prerenderingchange", () => e(), !0) : e();
}, li = [1800, 3e3], Qc = (e, t = {}) => {
  yo(() => {
    const n = go();
    let r, s = Nt("FCP");
    const a = cr("paint", (i) => {
      for (const c of i) c.name === "first-contentful-paint" && (a.disconnect(), c.startTime < n.firstHiddenTime && (s.value = Math.max(c.startTime - ir(), 0), s.entries.push(c), r(!0)));
    });
    a && (r = xt(e, s, li, t.reportAllChanges), $n((i) => {
      s = Nt("FCP"), r = xt(e, s, li, t.reportAllChanges), Bs(() => {
        s.value = performance.now() - i.timeStamp, r(!0);
      });
    }));
  });
}, di = [0.1, 0.25], Bh = (e, t = {}) => {
  const n = go();
  Qc(Hs(() => {
    let r, s = Nt("CLS", 0);
    const a = qs(t, Uh), i = (d) => {
      for (const l of d) a.h(l);
      a.i > s.value && (s.value = a.i, s.entries = a.o, r());
    }, c = cr("layout-shift", i);
    c && (r = xt(e, s, di, t.reportAllChanges), n.onHidden(() => {
      i(c.takeRecords()), r(!0);
    }), $n(() => {
      a.i = 0, s = Nt("CLS", 0), r = xt(e, s, di, t.reportAllChanges), Bs(() => r());
    }), setTimeout(r));
  }));
};
let Yc = 0, Ho = 1 / 0, xr = 0;
const zh = (e) => {
  for (const t of e) t.interactionId && (Ho = Math.min(Ho, t.interactionId), xr = Math.max(xr, t.interactionId), Yc = xr ? (xr - Ho) / 7 + 1 : 0);
};
let fs;
const ui = () => fs ? Yc : performance.interactionCount ?? 0, qh = () => {
  "interactionCount" in performance || fs || (fs = cr("event", zh, { type: "event", buffered: !0, durationThreshold: 0 }));
};
let fi = 0;
class Hh {
  constructor() {
    pe(this, "u", []);
    pe(this, "l", /* @__PURE__ */ new Map());
    pe(this, "m");
    pe(this, "p");
  }
  v() {
    fi = ui(), this.u.length = 0, this.l.clear();
  }
  L() {
    const t = Math.min(this.u.length - 1, Math.floor((ui() - fi) / 50));
    return this.u[t];
  }
  h(t) {
    if (this.m?.(t), !t.interactionId && t.entryType !== "first-input") return;
    const n = this.u.at(-1);
    let r = this.l.get(t.interactionId);
    if (r || this.u.length < 10 || t.duration > n.P) {
      if (r ? t.duration > r.P ? (r.entries = [t], r.P = t.duration) : t.duration === r.P && t.startTime === r.entries[0].startTime && r.entries.push(t) : (r = { id: t.interactionId, entries: [t], P: t.duration }, this.l.set(r.id, r), this.u.push(r)), this.u.sort((s, a) => a.P - s.P), this.u.length > 10) {
        const s = this.u.splice(10);
        for (const a of s) this.l.delete(a.id);
      }
      this.p?.(r);
    }
  }
}
const Xc = (e) => {
  const t = globalThis.requestIdleCallback || setTimeout;
  document.visibilityState === "hidden" ? e() : (e = Hs(e), addEventListener("visibilitychange", e, { once: !0, capture: !0 }), t(() => {
    e(), removeEventListener("visibilitychange", e, { capture: !0 });
  }));
}, pi = [200, 500], jh = (e, t = {}) => {
  if (!globalThis.PerformanceEventTiming || !("interactionId" in PerformanceEventTiming.prototype)) return;
  const n = go();
  yo(() => {
    qh();
    let r, s = Nt("INP");
    const a = qs(t, Hh), i = (d) => {
      Xc(() => {
        for (const u of d) a.h(u);
        const l = a.L();
        l && l.P !== s.value && (s.value = l.P, s.entries = l.entries, r());
      });
    }, c = cr("event", i, { durationThreshold: t.durationThreshold ?? 40 });
    r = xt(e, s, pi, t.reportAllChanges), c && (c.observe({ type: "first-input", buffered: !0 }), n.onHidden(() => {
      i(c.takeRecords()), r(!0);
    }), $n(() => {
      a.v(), s = Nt("INP"), r = xt(e, s, pi, t.reportAllChanges);
    }));
  });
};
class Wh {
  constructor() {
    pe(this, "m");
  }
  h(t) {
    this.m?.(t);
  }
}
const mi = [2500, 4e3], Kh = (e, t = {}) => {
  yo(() => {
    const n = go();
    let r, s = Nt("LCP");
    const a = qs(t, Wh), i = (d) => {
      t.reportAllChanges || (d = d.slice(-1));
      for (const l of d) a.h(l), l.startTime < n.firstHiddenTime && (s.value = Math.max(l.startTime - ir(), 0), s.entries = [l], r());
    }, c = cr("largest-contentful-paint", i);
    if (c) {
      r = xt(e, s, mi, t.reportAllChanges);
      const d = Hs(() => {
        i(c.takeRecords()), c.disconnect(), r(!0);
      }), l = (u) => {
        u.isTrusted && (Xc(d), removeEventListener(u.type, l, { capture: !0 }));
      };
      for (const u of ["keydown", "click", "visibilitychange"]) addEventListener(u, l, { capture: !0 });
      $n((u) => {
        s = Nt("LCP"), r = xt(e, s, mi, t.reportAllChanges), Bs(() => {
          s.value = performance.now() - u.timeStamp, r(!0);
        });
      });
    }
  });
}, hi = [800, 1800], ps = (e) => {
  document.prerendering ? yo(() => ps(e)) : document.readyState !== "complete" ? addEventListener("load", () => ps(e), !0) : setTimeout(e);
}, Vh = (e, t = {}) => {
  let n = Nt("TTFB"), r = xt(e, n, hi, t.reportAllChanges);
  ps(() => {
    const s = zs();
    s && (n.value = Math.max(s.responseStart - ir(), 0), n.entries = [s], r(!0), $n(() => {
      n = Nt("TTFB", 0), r = xt(e, n, hi, t.reportAllChanges), r(!0);
    }));
  });
};
class Gh {
  constructor() {
    pe(this, "metrics", []);
    pe(this, "initialized", !1);
    pe(this, "sendToAnalytics", (t) => {
      const n = localStorage.getItem("tenant_id") || void 0, r = localStorage.getItem("account_type") || void 0, s = {
        name: t.name,
        value: t.value,
        rating: t.rating,
        delta: t.delta,
        id: t.id,
        timestamp: Date.now(),
        tenantId: n,
        accountType: r,
        navigationType: t.navigationType
      };
      this.metrics.push(s);
      const a = r === "platform" ? "/api/v1/platform/analytics/performance" : "/api/v1/tenant/analytics/performance", i = localStorage.getItem("token");
      i && fetch(a, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${i}`,
          ...r === "tenant" && {
            "X-Tenant-ID": n || ""
          }
        },
        body: JSON.stringify(s),
        keepalive: !0
      }).catch((c) => {
      });
    });
  }
  init() {
    if (this.initialized) {
      console.warn("[PerformanceMonitor] Already initialized");
      return;
    }
    this.initialized = !0, Bh(this.sendToAnalytics), Qc(this.sendToAnalytics), jh(this.sendToAnalytics), Kh(this.sendToAnalytics), Vh(this.sendToAnalytics), this.trackAPICallDuration(), this.trackNavigationTiming();
  }
  trackComponentRenderTime() {
    if (!(typeof PerformanceObserver > "u"))
      try {
        new PerformanceObserver((n) => {
          for (const r of n.getEntries())
            r.entryType === "measure" && this.sendToAnalytics({
              name: `component-render-${r.name}`,
              value: r.duration,
              rating: r.duration < 100 ? "good" : r.duration < 300 ? "needs-improvement" : "poor",
              delta: r.duration,
              id: `render-${Date.now()}`,
              navigationType: "navigate",
              entries: []
            });
        }).observe({ entryTypes: ["measure"] });
      } catch {
      }
  }
  trackAPICallDuration() {
    const t = window.fetch;
    window.fetch = async (...n) => {
      const r = performance.now(), [s] = n, a = typeof s == "string" ? s : s.toString();
      try {
        const i = await t(...n), c = performance.now() - r;
        if (a.includes("/api/")) {
          const d = a.split("/api/")[1]?.split("?")[0] || "unknown";
          this.sendToAnalytics({
            name: `api-${i.ok ? "success" : "error"}-${d}`,
            value: c,
            rating: c < 500 ? "good" : c < 1e3 ? "needs-improvement" : "poor",
            delta: c,
            id: `api-${Date.now()}`,
            navigationType: "navigate",
            entries: []
          });
        }
        return i;
      } catch (i) {
        const c = performance.now() - r;
        if (a.includes("/api/")) {
          const d = a.split("/api/")[1]?.split("?")[0] || "unknown";
          this.sendToAnalytics({
            name: `api-failure-${d}`,
            value: c,
            rating: "poor",
            delta: c,
            id: `api-error-${Date.now()}`,
            navigationType: "navigate",
            entries: []
          });
        }
        throw i;
      }
    };
  }
  trackNavigationTiming() {
    if (!(typeof PerformanceObserver > "u"))
      try {
        new PerformanceObserver((n) => {
          for (const r of n.getEntries())
            if (r.entryType === "navigation") {
              const s = r, a = {
                dnsLookup: s.domainLookupEnd - s.domainLookupStart,
                tcpConnection: s.connectEnd - s.connectStart,
                serverResponse: s.responseStart - s.requestStart,
                domContentLoaded: s.domContentLoadedEventEnd - s.domContentLoadedEventStart,
                windowLoad: s.loadEventEnd - s.loadEventStart
              };
              Object.entries(a).forEach(([i, c]) => {
                c > 0 && this.sendToAnalytics({
                  name: `navigation-${i}`,
                  value: c,
                  rating: c < 100 ? "good" : c < 300 ? "needs-improvement" : "poor",
                  delta: c,
                  id: `nav-${i}-${Date.now()}`,
                  navigationType: s.type,
                  entries: []
                });
              });
            }
        }).observe({ entryTypes: ["navigation"] });
      } catch {
      }
  }
  getMetrics() {
    return this.metrics;
  }
  markStart(t) {
    performance.mark(`${t}-start`);
  }
  markEnd(t) {
    performance.mark(`${t}-end`);
    try {
      performance.measure(t, `${t}-start`, `${t}-end`);
    } catch {
    }
  }
}
const Qh = new Gh();
typeof window < "u" && (window.__performanceMonitor = Qh);
const Yh = As(void 0), Y = () => {
  const e = sc(Yh);
  if (e === void 0)
    throw new Error("useTenantAuth must be used within a TenantAuthProvider");
  return e;
};
As(void 0);
const Xh = As(void 0), ot = () => {
  const e = sc(Xh);
  if (e === void 0)
    throw new Error("useGlobalContext must be used within a GlobalContextProvider");
  return e;
};
class Jh {
  formatMessage(t, n, r) {
    const s = (/* @__PURE__ */ new Date()).toISOString(), a = r ? ` | Context: ${JSON.stringify(r)}` : "";
    return `[${s}] [${t.toUpperCase()}]: ${n}${a}`;
  }
  shouldLog(t) {
    return t === "error" || t === "warn";
  }
  sendToErrorTracking(t, n) {
    window.Sentry && window.Sentry.captureException(new Error(t), {
      extra: n
    });
  }
  debug(t, n) {
    this.shouldLog("debug") && console.log(this.formatMessage("debug", t, n));
  }
  info(t, n) {
    this.shouldLog("info") && console.info(this.formatMessage("info", t, n));
  }
  warn(t, n) {
    this.shouldLog("warn") && (console.warn(this.formatMessage("warn", t, n)), this.sendToErrorTracking(t, n));
  }
  error(t, n) {
    this.shouldLog("error") && (console.error(this.formatMessage("error", t, n)), this.sendToErrorTracking(t, n));
  }
}
const _ = new Jh();
class Zh {
  constructor() {
    pe(this, "errorReportQueue", []);
    pe(this, "isOnline", navigator.onLine);
    window.addEventListener("online", () => {
      this.isOnline = !0, this.flushErrorQueue();
    }), window.addEventListener("offline", () => {
      this.isOnline = !1;
    });
  }
  /**
   * Enhanced retry logic with exponential backoff
   */
  async withRetry(t, n = {}) {
    const {
      maxRetries: r = 3,
      baseDelay: s = 1e3,
      maxDelay: a = 3e4,
      backoffFactor: i = 2,
      retryCondition: c = this.defaultRetryCondition
    } = n;
    let d, l = s;
    for (let u = 0; u <= r; u++)
      try {
        return await t();
      } catch (f) {
        if (d = f, !c(f) || u === r)
          throw f;
        this.isNetworkError(f) && u > 0 && L.warning(`Connection issue. Retrying... (${u}/${r})`), await this.sleep(Math.min(l, a)), l *= i;
      }
    throw d;
  }
  /**
   * Default retry condition - retry on network errors and 5xx responses
   */
  defaultRetryCondition(t) {
    return !t.response || t.response?.status >= 500 || t.response?.status === 429 || t.response?.status === 408;
  }
  /**
   * Check if error is network-related
   */
  isNetworkError(t) {
    return !t.response || t.code === "NETWORK_ERROR" || t.message?.includes("Network Error");
  }
  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(t, n) {
    if (this.isNetworkError(t))
      return "Connection problem. Please check your internet connection and try again.";
    if (t.response?.status)
      switch (t.response.status) {
        case 400:
          return "Invalid request. Please check your input and try again.";
        case 401:
          return "Session expired. Please log in again.";
        case 403:
          return "Access denied. You don't have permission to perform this action.";
        case 404:
          return n ? `${n} not found. It may have been deleted or moved.` : "The requested resource was not found.";
        case 409:
          return "This action conflicts with existing data. Please refresh and try again.";
        case 422:
          return "Invalid data provided. Please check your input.";
        case 429:
          return "Too many requests. Please wait a moment before trying again.";
        case 500:
          return "Server error. Our team has been notified. Please try again later.";
        case 502:
        case 503:
        case 504:
          return "Service temporarily unavailable. Please try again in a few minutes.";
        default:
          return "An unexpected error occurred. Please try again.";
      }
    return "Something went wrong. Please try again or contact support if the problem persists.";
  }
  /**
   * Report error to backend (with offline queueing)
   */
  async reportError(t, n, r) {
    const s = {
      error: t,
      context: n,
      userId: r,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stackTrace: t.stack
    };
    if (this.isOnline)
      try {
        await this.sendErrorReport(s);
      } catch (a) {
        this.errorReportQueue.push(s), console.warn("Failed to report error, queued for later:", a);
      }
    else
      this.errorReportQueue.push(s);
  }
  /**
   * Send error report to backend
   */
  async sendErrorReport(t) {
    const n = {
      message: t.error.message,
      stack: t.stackTrace,
      context: t.context,
      userId: t.userId,
      timestamp: t.timestamp,
      url: t.url,
      userAgent: t.userAgent
    };
    await fetch("/api/errors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(n)
    });
  }
  /**
   * Flush queued error reports when online
   */
  async flushErrorQueue() {
    if (this.errorReportQueue.length === 0) return;
    const t = [...this.errorReportQueue];
    this.errorReportQueue = [];
    for (const n of t)
      try {
        await this.sendErrorReport(n);
      } catch (r) {
        this.errorReportQueue.push(n), console.warn("Failed to flush error report:", r);
      }
  }
  /**
   * Handle error with user notification and reporting
   */
  async handleError(t, n = {}) {
    const {
      context: r,
      showToast: s = !0,
      reportError: a = !0,
      userId: i,
      customMessage: c
    } = n, d = c || this.getUserFriendlyMessage(t, r);
    s && (t.response?.status >= 500 || this.isNetworkError(t) ? L.error(d) : t.response?.status === 401 ? L.warning(d) : L.error(d)), a && t instanceof Error && await this.reportError(t, { context: r, ...n }, i), process.env.NODE_ENV === "development" && console.error("Error handled:", {
      error: t,
      context: r,
      message: d
    });
  }
  /**
   * Sleep utility for retry delays
   */
  sleep(t) {
    return new Promise((n) => setTimeout(n, t));
  }
  /**
   * Create a circuit breaker for repeated failures
   */
  createCircuitBreaker(t, n = {}) {
    const {
      failureThreshold: r = 5,
      resetTimeout: s = 6e4,
      // 1 minute
      monitoringPeriod: a = 1e4
      // 10 seconds
    } = n;
    let i = "CLOSED", c = 0, d = 0, l = 0;
    return async () => {
      const u = Date.now();
      if (u - d > a && (c = 0), i === "OPEN" && u - d > s && (i = "HALF_OPEN", l = 0), i === "OPEN")
        throw new Error("Circuit breaker is OPEN - too many recent failures");
      try {
        const f = await t();
        return i === "HALF_OPEN" ? (l++, l >= 3 && (i = "CLOSED", c = 0)) : c = 0, f;
      } catch (f) {
        throw c++, d = u, c >= r && (i = "OPEN", L.error("Service temporarily unavailable. Please try again later.")), f;
      }
    };
  }
}
const gi = new Zh();
new Gp({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1e3,
      // Cache time: How long inactive data stays in cache (30 minutes)
      gcTime: 30 * 60 * 1e3,
      // Enhanced retry logic using error handling service
      retry: (e, t) => t?.response?.status >= 400 && t?.response?.status < 500 ? [408, 429].includes(t.response.status) ? e < 2 : !1 : e < 2,
      // Exponential backoff with jitter
      retryDelay: (e, t) => {
        const s = Math.min(1e3 * 2 ** e, 3e4), a = Math.random() * 0.1 * s;
        return s + a;
      },
      // Refetch on window focus (but not too frequently)
      refetchOnWindowFocus: "always",
      // Automatically refetch when network comes back online
      refetchOnReconnect: "always",
      // Don't refetch on mount if data is still fresh
      refetchOnMount: !0,
      // Global error handler
      onError: (e) => {
        gi.handleError(e, {
          context: "Query Error",
          showToast: !0,
          reportError: !0
        });
      }
    },
    mutations: {
      // Retry mutations with enhanced logic
      retry: (e, t) => t?.response?.status >= 400 && t?.response?.status < 500 ? [408, 409, 429].includes(t.response.status) ? e < 2 : !1 : e < 2,
      // Exponential backoff with jitter for mutations
      retryDelay: (e) => {
        const r = Math.min(1e3 * 2 ** e, 1e4), s = Math.random() * 0.1 * r;
        return r + s;
      },
      // Global mutation error handler
      onError: (e, t, n) => {
        gi.handleError(e, {
          context: "Mutation Error",
          showToast: !0,
          reportError: !0
        });
      }
    }
  }
});
const A = {
  // CMS - Content Types
  contentTypes: {
    all: ["cms", "content-types"],
    lists: () => [...A.contentTypes.all, "list"],
    list: (e) => [...A.contentTypes.lists(), e],
    details: () => [...A.contentTypes.all, "detail"],
    detail: (e) => [...A.contentTypes.details(), e],
    contentsCount: (e) => [...A.contentTypes.detail(e), "contents-count"]
  },
  // CMS - Contents
  contents: {
    all: ["cms", "contents"],
    lists: () => [...A.contents.all, "list"],
    list: (e) => [...A.contents.lists(), e],
    details: () => [...A.contents.all, "detail"],
    detail: (e) => [...A.contents.details(), e],
    bySlug: (e) => [...A.contents.all, "slug", e],
    byType: (e, t) => [...A.contents.all, "by-type", e, t],
    byCategory: (e, t) => [...A.contents.all, "by-category", e, t],
    byStatus: (e, t) => [...A.contents.all, "by-status", e, t],
    byAuthor: (e, t) => [...A.contents.all, "by-author", e, t]
  },
  // CMS - Categories
  categories: {
    all: ["cms", "categories"],
    lists: () => [...A.categories.all, "list"],
    list: (e) => [...A.categories.lists(), e],
    tree: () => [...A.categories.all, "tree"],
    details: () => [...A.categories.all, "detail"],
    detail: (e) => [...A.categories.details(), e],
    bySlug: (e) => [...A.categories.all, "slug", e]
  },
  // CMS - Comments
  comments: {
    all: ["cms", "comments"],
    lists: () => [...A.comments.all, "list"],
    list: (e) => [...A.comments.lists(), e],
    forContent: (e) => [...A.comments.all, "content", e],
    details: () => [...A.comments.all, "detail"],
    detail: (e) => [...A.comments.details(), e]
  },
  // CMS - Revisions
  revisions: {
    all: ["cms", "revisions"],
    forContent: (e) => [...A.revisions.all, "content", e],
    detail: (e) => [...A.revisions.all, "detail", e]
  },
  // CMS - Tags
  tags: {
    all: ["cms", "tags"],
    lists: () => [...A.tags.all, "list"],
    list: (e) => [...A.tags.lists(), e]
  }
};
class vo extends Error {
  constructor(n, r) {
    super(n);
    pe(this, "originalError");
    this.name = "ApiError", this.originalError = r, Error.captureStackTrace && Error.captureStackTrace(this, vo);
  }
}
class Ye extends vo {
  constructor(t, n) {
    super(t, n), this.name = "AuthError", Error.captureStackTrace && Error.captureStackTrace(this, Ye);
  }
}
class $e extends vo {
  constructor(t, n) {
    super(t, n), this.name = "TenantContextError", Error.captureStackTrace && Error.captureStackTrace(this, $e);
  }
}
const js = (e) => {
  const { userType: t } = ot(), { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.contentTypes.list(e),
    queryFn: async () => {
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      if (!r?.id)
        throw new Ye("User not authenticated");
      _.debug("[CMS] Fetching content types", { filters: e, tenantId: n.uuid });
      try {
        return await Xt.admin.list();
      } catch (s) {
        throw _.error("[CMS] Failed to fetch content types", { error: s.message }), s;
      }
    },
    enabled: !!n?.uuid && !!r?.id && t === "tenant",
    staleTime: 10 * 60 * 1e3,
    gcTime: 15 * 60 * 1e3
  });
}, eg = (e) => {
  const { userType: t } = ot(), { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.contentTypes.detail(e || ""),
    queryFn: async () => {
      if (!e)
        throw new Error("Content type UUID is required");
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      if (!r?.id)
        throw new Ye("User not authenticated");
      return _.debug("[CMS] Fetching content type", { uuid: e, tenantId: n.uuid }), await Xt.admin.getById(e);
    },
    enabled: !!e && !!n?.uuid && !!r?.id && t === "tenant",
    staleTime: 10 * 60 * 1e3,
    gcTime: 15 * 60 * 1e3
  });
}, tg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Creating content type", { input: n, tenantId: t?.uuid }), await Xt.admin.create(n)),
    onSuccess: (n) => {
      e.invalidateQueries({ queryKey: A.contentTypes.all }), L.success("Content type created successfully", {
        description: `Content type "${n.data.name}" has been created.`
      }), _.info("[CMS] Content type created", { uuid: n.data.uuid });
    },
    onError: (n) => {
      L.error("Failed to create content type", {
        description: n?.message || "An error occurred while creating the content type."
      }), _.error("[CMS] Failed to create content type", { error: n.message });
    }
  });
}, ng = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async ({ uuid: n, input: r }) => (_.debug("[CMS] Updating content type", { uuid: n, input: r, tenantId: t?.uuid }), await Xt.admin.update(n, r)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.contentTypes.all }), e.invalidateQueries({ queryKey: A.contentTypes.detail(r.uuid) }), L.success("Content type updated successfully", {
        description: "Content type has been updated."
      }), _.info("[CMS] Content type updated", { uuid: r.uuid });
    },
    onError: (n) => {
      L.error("Failed to update content type", {
        description: n?.message || "An error occurred while updating the content type."
      }), _.error("[CMS] Failed to update content type", { error: n.message });
    }
  });
}, rg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Deleting content type", { uuid: n, tenantId: t?.uuid }), await Xt.admin.delete(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.contentTypes.all }), e.removeQueries({ queryKey: A.contentTypes.detail(r) }), L.success("Content type deleted successfully", {
        description: "The content type has been permanently deleted."
      }), _.info("[CMS] Content type deleted", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to delete content type", {
        description: n?.message || "An error occurred while deleting the content type."
      }), _.error("[CMS] Failed to delete content type", { error: n.message });
    }
  });
}, og = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Activating content type", { uuid: n, tenantId: t?.uuid }), await Xt.admin.activate(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.contentTypes.all }), e.invalidateQueries({ queryKey: A.contentTypes.detail(r) }), L.success("Content type activated", {
        description: "The content type is now active and visible."
      }), _.info("[CMS] Content type activated", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to activate content type", {
        description: n?.message || "An error occurred while activating the content type."
      }), _.error("[CMS] Failed to activate content type", { error: n.message });
    }
  });
}, sg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Deactivating content type", { uuid: n, tenantId: t?.uuid }), await Xt.admin.deactivate(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.contentTypes.all }), e.invalidateQueries({ queryKey: A.contentTypes.detail(r) }), L.success("Content type deactivated", {
        description: "The content type is now hidden from the public."
      }), _.info("[CMS] Content type deactivated", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to deactivate content type", {
        description: n?.message || "An error occurred while deactivating the content type."
      }), _.error("[CMS] Failed to deactivate content type", { error: n.message });
    }
  });
}, eN = (e) => {
  const { tenant: t, user: n } = Y();
  return Ae({
    queryKey: A.contentTypes.contentsCount(e || ""),
    queryFn: async () => {
      if (!e)
        throw new Error("Content type UUID is required");
      if (!t?.uuid)
        throw new $e("Tenant context not available");
      if (!n?.id)
        throw new Ye("User not authenticated");
      return (await Xt.admin.getContentsCount(e)).data;
    },
    enabled: !!e && !!t?.uuid && !!n?.id,
    staleTime: 5 * 60 * 1e3,
    gcTime: 10 * 60 * 1e3
  });
}, Je = "/cms/admin/contents", Cn = "/cms/public/contents", Xe = {
  admin: {
    async list(e) {
      const t = new URLSearchParams();
      return e?.content_type && t.append("content_type", e.content_type), e?.category && t.append("category", e.category), e?.status && t.append("status", e.status), e?.author && t.append("author", e.author), e?.search && t.append("search", e.search), e?.date_from && t.append("date_from", e.date_from), e?.date_to && t.append("date_to", e.date_to), e?.sort_by && t.append("sort_by", e.sort_by), e?.sort_order && t.append("sort_order", e.sort_order), e?.page && t.append("page", String(e.page)), e?.per_page && t.append("per_page", String(e.per_page)), D.get(`${Je}${t.toString() ? `?${t}` : ""}`);
    },
    async getById(e) {
      return D.get(`${Je}/${e}`);
    },
    async create(e) {
      return D.post(Je, e);
    },
    async update(e, t) {
      return D.put(`${Je}/${e}`, t);
    },
    async delete(e) {
      return D.delete(`${Je}/${e}`);
    },
    async publish(e, t) {
      return D.post(`${Je}/${e}/publish`, t || {});
    },
    async unpublish(e) {
      return D.post(`${Je}/${e}/unpublish`, {});
    },
    async schedule(e, t) {
      return D.post(`${Je}/${e}/schedule`, t);
    },
    async archive(e) {
      return D.post(`${Je}/${e}/archive`, {});
    },
    async byType(e, t = 1, n = 15) {
      return D.get(`${Je}/by-type/${e}?page=${t}&per_page=${n}`);
    },
    async byCategory(e, t = 1, n = 15) {
      return D.get(`${Je}/by-category/${e}?page=${t}&per_page=${n}`);
    },
    async byStatus(e, t = 1, n = 15) {
      return D.get(`${Je}/by-status/${e}?page=${t}&per_page=${n}`);
    },
    async byAuthor(e, t = 1, n = 15) {
      return D.get(`${Je}/by-author/${e}?page=${t}&per_page=${n}`);
    }
  },
  public: {
    async list(e) {
      const t = new URLSearchParams();
      return e?.content_type && t.append("content_type", e.content_type), e?.category && t.append("category", e.category), e?.search && t.append("search", e.search), e?.sort_by && t.append("sort_by", e.sort_by), e?.sort_order && t.append("sort_order", e.sort_order), e?.page && t.append("page", String(e.page)), e?.per_page && t.append("per_page", String(e.per_page)), D.get(`${Cn}${t.toString() ? `?${t}` : ""}`);
    },
    async getBySlug(e) {
      return D.get(`${Cn}/${e}`);
    },
    async search(e, t) {
      const n = new URLSearchParams({ q: e });
      return t?.content_type && n.append("content_type", t.content_type), t?.category && n.append("category", t.category), t?.page && n.append("page", String(t.page)), t?.per_page && n.append("per_page", String(t.per_page)), D.get(`${Cn}/search?${n}`);
    },
    async byCategory(e, t) {
      const n = new URLSearchParams();
      return t?.content_type && n.append("content_type", t.content_type), t?.sort_by && n.append("sort_by", t.sort_by), t?.sort_order && n.append("sort_order", t.sort_order), t?.page && n.append("page", String(t.page)), t?.per_page && n.append("per_page", String(t.per_page)), D.get(`${Cn}/category/${e}${n.toString() ? `?${n}` : ""}`);
    },
    async byTag(e, t) {
      const n = new URLSearchParams();
      return t?.content_type && n.append("content_type", t.content_type), t?.sort_by && n.append("sort_by", t.sort_by), t?.sort_order && n.append("sort_order", t.sort_order), t?.page && n.append("page", String(t.page)), t?.per_page && n.append("per_page", String(t.per_page)), D.get(`${Cn}/tag/${e}${n.toString() ? `?${n}` : ""}`);
    },
    async byType(e, t) {
      const n = new URLSearchParams();
      return t?.sort_by && n.append("sort_by", t.sort_by), t?.sort_order && n.append("sort_order", t.sort_order), t?.page && n.append("page", String(t.page)), t?.per_page && n.append("per_page", String(t.per_page)), D.get(`${Cn}/type/${e}${n.toString() ? `?${n}` : ""}`);
    }
  }
}, ag = (e) => {
  const { userType: t } = ot(), { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.contents.list(e),
    queryFn: async () => {
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      if (!r?.id)
        throw new Ye("User not authenticated");
      return _.debug("[CMS] Fetching contents", { filters: e, tenantId: n.uuid }), await Xe.admin.list(e);
    },
    enabled: !!n?.uuid && !!r?.id && t === "tenant",
    staleTime: 2 * 60 * 1e3,
    gcTime: 5 * 60 * 1e3
  });
}, tN = (e) => {
  const { userType: t } = ot();
  return Ae({
    queryKey: [...A.contents.lists(), "public", e],
    queryFn: async () => (_.debug("[CMS] Fetching public contents", { filters: e }), await Xe.public.list(e)),
    enabled: !0,
    staleTime: 5 * 60 * 1e3,
    gcTime: 10 * 60 * 1e3
  });
}, ig = (e) => {
  const { userType: t } = ot(), { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.contents.detail(e || ""),
    queryFn: async () => {
      if (!e)
        throw new Error("Content UUID is required");
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      if (!r?.id)
        throw new Ye("User not authenticated");
      return _.debug("[CMS] Fetching content", { uuid: e, tenantId: n.uuid }), await Xe.admin.getById(e);
    },
    enabled: !!e && !!n?.uuid && !!r?.id && t === "tenant",
    staleTime: 5 * 60 * 1e3,
    gcTime: 10 * 60 * 1e3
  });
}, nN = (e) => Ae({
  queryKey: A.contents.bySlug(e || ""),
  queryFn: async () => {
    if (!e)
      throw new Error("Content slug is required");
    return _.debug("[CMS] Fetching public content by slug", { slug: e }), await Xe.public.getBySlug(e);
  },
  enabled: !!e,
  staleTime: 5 * 60 * 1e3,
  gcTime: 10 * 60 * 1e3
}), rN = (e, t) => {
  const { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.contents.byType(e || "", t),
    queryFn: async () => {
      if (!e)
        throw new Error("Content type UUID is required");
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      return await Xe.admin.byType(
        e,
        t?.page,
        t?.per_page
      );
    },
    enabled: !!e && !!n?.uuid && !!r?.id,
    staleTime: 2 * 60 * 1e3,
    gcTime: 5 * 60 * 1e3
  });
}, oN = (e, t) => {
  const { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.contents.byCategory(e || "", t),
    queryFn: async () => {
      if (!e)
        throw new Error("Category UUID is required");
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      return await Xe.admin.byCategory(
        e,
        t?.page,
        t?.per_page
      );
    },
    enabled: !!e && !!n?.uuid && !!r?.id,
    staleTime: 2 * 60 * 1e3,
    gcTime: 5 * 60 * 1e3
  });
}, sN = (e, t) => {
  const { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.contents.byStatus(e || "", t),
    queryFn: async () => {
      if (!e)
        throw new Error("Status is required");
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      return await Xe.admin.byStatus(
        e,
        t?.page,
        t?.per_page
      );
    },
    enabled: !!e && !!n?.uuid && !!r?.id,
    staleTime: 2 * 60 * 1e3,
    gcTime: 5 * 60 * 1e3
  });
}, cg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Creating content", { input: n, tenantId: t?.uuid }), await Xe.admin.create(n)),
    onSuccess: (n) => {
      e.invalidateQueries({ queryKey: A.contents.all }), L.success("Content created successfully", {
        description: `Content "${n.data.title}" has been created as draft.`
      }), _.info("[CMS] Content created", { uuid: n.data.uuid });
    },
    onError: (n) => {
      L.error("Failed to create content", {
        description: n?.message || "An error occurred while creating the content."
      }), _.error("[CMS] Failed to create content", { error: n.message });
    }
  });
}, lg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async ({ uuid: n, input: r }) => (_.debug("[CMS] Updating content", { uuid: n, input: r, tenantId: t?.uuid }), await Xe.admin.update(n, r)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.contents.all }), e.invalidateQueries({ queryKey: A.contents.detail(r.uuid) }), L.success("Content updated successfully", {
        description: "Your changes have been saved."
      }), _.info("[CMS] Content updated", { uuid: r.uuid });
    },
    onError: (n) => {
      L.error("Failed to update content", {
        description: n?.message || "An error occurred while updating the content."
      }), _.error("[CMS] Failed to update content", { error: n.message });
    }
  });
}, dg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Deleting content", { uuid: n, tenantId: t?.uuid }), await Xe.admin.delete(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.contents.all }), e.removeQueries({ queryKey: A.contents.detail(r) }), L.success("Content deleted successfully", {
        description: "The content has been permanently deleted."
      }), _.info("[CMS] Content deleted", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to delete content", {
        description: n?.message || "An error occurred while deleting the content."
      }), _.error("[CMS] Failed to delete content", { error: n.message });
    }
  });
}, Jc = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async ({ uuid: n, input: r }) => (_.debug("[CMS] Publishing content", { uuid: n, input: r, tenantId: t?.uuid }), await Xe.admin.publish(n, r)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.contents.all }), e.invalidateQueries({ queryKey: A.contents.detail(r.uuid) }), L.success("Content published successfully", {
        description: "The content is now live and visible to the public."
      }), _.info("[CMS] Content published", { uuid: r.uuid });
    },
    onError: (n) => {
      L.error("Failed to publish content", {
        description: n?.message || "An error occurred while publishing the content."
      }), _.error("[CMS] Failed to publish content", { error: n.message });
    }
  });
}, ug = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Unpublishing content", { uuid: n, tenantId: t?.uuid }), await Xe.admin.unpublish(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.contents.all }), e.invalidateQueries({ queryKey: A.contents.detail(r) }), L.success("Content unpublished", {
        description: "The content is now hidden from the public."
      }), _.info("[CMS] Content unpublished", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to unpublish content", {
        description: n?.message || "An error occurred while unpublishing the content."
      }), _.error("[CMS] Failed to unpublish content", { error: n.message });
    }
  });
}, aN = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async ({ uuid: n, input: r }) => (_.debug("[CMS] Scheduling content", { uuid: n, input: r, tenantId: t?.uuid }), await Xe.admin.schedule(n, r)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.contents.all }), e.invalidateQueries({ queryKey: A.contents.detail(r.uuid) }), L.success("Content scheduled successfully", {
        description: `The content will be published on ${r.input.scheduled_at}.`
      }), _.info("[CMS] Content scheduled", { uuid: r.uuid, scheduledAt: r.input.scheduled_at });
    },
    onError: (n) => {
      L.error("Failed to schedule content", {
        description: n?.message || "An error occurred while scheduling the content."
      }), _.error("[CMS] Failed to schedule content", { error: n.message });
    }
  });
}, fg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Archiving content", { uuid: n, tenantId: t?.uuid }), await Xe.admin.archive(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.contents.all }), e.invalidateQueries({ queryKey: A.contents.detail(r) }), L.success("Content archived", {
        description: "The content has been moved to the archive."
      }), _.info("[CMS] Content archived", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to archive content", {
        description: n?.message || "An error occurred while archiving the content."
      }), _.error("[CMS] Failed to archive content", { error: n.message });
    }
  });
}, Mt = "/cms/admin/categories", jo = "/cms/public/categories", pt = {
  admin: {
    async list(e) {
      const t = new URLSearchParams();
      return e?.content_type && t.append("content_type", e.content_type), e?.parent && t.append("parent", e.parent), e?.search && t.append("search", e.search), e?.page && t.append("page", String(e.page)), e?.per_page && t.append("per_page", String(e.per_page)), D.get(`${Mt}${t.toString() ? `?${t}` : ""}`);
    },
    async getTree(e) {
      const t = e ? `${Mt}/tree/${e}` : `${Mt}/tree`;
      return D.get(t);
    },
    async getById(e) {
      return D.get(`${Mt}/${e}`);
    },
    async create(e) {
      return D.post(Mt, e);
    },
    async update(e, t) {
      return D.put(`${Mt}/${e}`, t);
    },
    async delete(e) {
      return D.delete(`${Mt}/${e}`);
    },
    async move(e, t) {
      return D.post(`${Mt}/${e}/move`, t);
    },
    async reorder(e, t) {
      return D.post(`${Mt}/${e}/reorder`, t);
    }
  },
  public: {
    async list(e) {
      const t = new URLSearchParams();
      return e?.content_type && t.append("content_type", e.content_type), e?.page && t.append("page", String(e.page)), e?.per_page && t.append("per_page", String(e.per_page)), D.get(`${jo}${t.toString() ? `?${t}` : ""}`);
    },
    async getTree(e) {
      const t = new URLSearchParams();
      return e && t.append("content_type", e), D.get(`${jo}/tree${t.toString() ? `?${t}` : ""}`);
    },
    async getBySlug(e) {
      return D.get(`${jo}/${e}`);
    }
  }
}, pg = (e) => {
  const { userType: t } = ot(), { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.categories.list(e),
    queryFn: async () => {
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      if (!r?.id)
        throw new Ye("User not authenticated");
      return _.debug("[CMS] Fetching categories", { filters: e, tenantId: n.uuid }), await pt.admin.list();
    },
    enabled: !!n?.uuid && !!r?.id && t === "tenant",
    staleTime: 5 * 60 * 1e3,
    gcTime: 10 * 60 * 1e3
  });
}, mg = () => {
  const { userType: e } = ot(), { tenant: t, user: n } = Y();
  return Ae({
    queryKey: A.categories.tree(),
    queryFn: async () => {
      if (!t?.uuid)
        throw new $e("Tenant context not available");
      if (!n?.id)
        throw new Ye("User not authenticated");
      return _.debug("[CMS] Fetching category tree", { tenantId: t.uuid }), await pt.admin.tree();
    },
    enabled: !!t?.uuid && !!n?.id && e === "tenant",
    staleTime: 5 * 60 * 1e3,
    gcTime: 10 * 60 * 1e3
  });
}, iN = () => Ae({
  queryKey: [...A.categories.lists(), "public"],
  queryFn: async () => (_.debug("[CMS] Fetching public categories"), await pt.public.list()),
  enabled: !0,
  staleTime: 10 * 60 * 1e3,
  gcTime: 15 * 60 * 1e3
}), cN = () => Ae({
  queryKey: [...A.categories.tree(), "public"],
  queryFn: async () => (_.debug("[CMS] Fetching public category tree"), await pt.public.tree()),
  enabled: !0,
  staleTime: 10 * 60 * 1e3,
  gcTime: 15 * 60 * 1e3
}), lN = (e) => {
  const { userType: t } = ot(), { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.categories.detail(e || ""),
    queryFn: async () => {
      if (!e)
        throw new Error("Category UUID is required");
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      if (!r?.id)
        throw new Ye("User not authenticated");
      return _.debug("[CMS] Fetching category", { uuid: e, tenantId: n.uuid }), await pt.admin.getById(e);
    },
    enabled: !!e && !!n?.uuid && !!r?.id && t === "tenant",
    staleTime: 5 * 60 * 1e3,
    gcTime: 10 * 60 * 1e3
  });
}, dN = (e) => Ae({
  queryKey: A.categories.bySlug(e || ""),
  queryFn: async () => {
    if (!e)
      throw new Error("Category slug is required");
    return _.debug("[CMS] Fetching public category by slug", { slug: e }), await pt.public.getBySlug(e);
  },
  enabled: !!e,
  staleTime: 10 * 60 * 1e3,
  gcTime: 15 * 60 * 1e3
}), hg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Creating category", { input: n, tenantId: t?.uuid }), await pt.admin.create(n)),
    onSuccess: (n) => {
      e.invalidateQueries({ queryKey: A.categories.all }), L.success("Category created successfully", {
        description: `Category "${n.data.name}" has been created.`
      }), _.info("[CMS] Category created", { uuid: n.data.uuid });
    },
    onError: (n) => {
      L.error("Failed to create category", {
        description: n?.message || "An error occurred while creating the category."
      }), _.error("[CMS] Failed to create category", { error: n.message });
    }
  });
}, gg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async ({ uuid: n, input: r }) => (_.debug("[CMS] Updating category", { uuid: n, input: r, tenantId: t?.uuid }), await pt.admin.update(n, r)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.categories.all }), e.invalidateQueries({ queryKey: A.categories.detail(r.uuid) }), L.success("Category updated successfully", {
        description: "Your changes have been saved."
      }), _.info("[CMS] Category updated", { uuid: r.uuid });
    },
    onError: (n) => {
      L.error("Failed to update category", {
        description: n?.message || "An error occurred while updating the category."
      }), _.error("[CMS] Failed to update category", { error: n.message });
    }
  });
}, yg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Deleting category", { uuid: n, tenantId: t?.uuid }), await pt.admin.delete(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.categories.all }), e.removeQueries({ queryKey: A.categories.detail(r) }), L.success("Category deleted successfully", {
        description: "The category has been permanently deleted."
      }), _.info("[CMS] Category deleted", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to delete category", {
        description: n?.message || "An error occurred while deleting the category."
      }), _.error("[CMS] Failed to delete category", { error: n.message });
    }
  });
}, uN = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async ({ uuid: n, input: r }) => (_.debug("[CMS] Moving category", { uuid: n, input: r, tenantId: t?.uuid }), await pt.admin.move(n, r)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.categories.all }), L.success("Category moved successfully", {
        description: "The category hierarchy has been updated."
      }), _.info("[CMS] Category moved", { uuid: r.uuid, newParent: r.input.new_parent_id });
    },
    onError: (n) => {
      L.error("Failed to move category", {
        description: n?.message || "An error occurred while moving the category."
      }), _.error("[CMS] Failed to move category", { error: n.message });
    }
  });
}, fN = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async ({ uuid: n, newOrder: r }) => (_.debug("[CMS] Reordering category", { uuid: n, newOrder: r, tenantId: t?.uuid }), await pt.admin.reorder(n, r)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.categories.all }), L.success("Category reordered successfully", {
        description: "The category order has been updated."
      }), _.info("[CMS] Category reordered", { uuid: r.uuid, newOrder: r.newOrder });
    },
    onError: (n) => {
      L.error("Failed to reorder category", {
        description: n?.message || "An error occurred while reordering the category."
      }), _.error("[CMS] Failed to reorder category", { error: n.message });
    }
  });
}, rn = "/cms/admin/comments", yi = "/cms/public/comments", Tt = {
  admin: {
    async list(e) {
      const t = new URLSearchParams();
      return e?.content && t.append("content", e.content), e?.status && t.append("status", e.status), e?.search && t.append("search", e.search), e?.page && t.append("page", String(e.page)), e?.per_page && t.append("per_page", String(e.per_page)), D.get(`${rn}${t.toString() ? `?${t}` : ""}`);
    },
    async approve(e) {
      return D.post(`${rn}/${e}/approve`, {});
    },
    async reject(e) {
      return D.post(`${rn}/${e}/reject`, {});
    },
    async markAsSpam(e) {
      return D.post(`${rn}/${e}/spam`, {});
    },
    async delete(e) {
      return D.delete(`${rn}/${e}`);
    },
    async bulkApprove(e) {
      return D.post(`${rn}/bulk-approve`, e);
    },
    async bulkDelete(e) {
      return D.post(`${rn}/bulk-delete`, e);
    }
  },
  public: {
    async listForContent(e, t = 1, n = 20) {
      return D.get(`/cms/public/contents/${e}/comments?page=${t}&per_page=${n}`);
    },
    async submit(e) {
      return D.post(yi, e);
    },
    async reply(e, t) {
      return D.post(`${yi}/${e}/reply`, t);
    }
  }
}, vg = (e) => {
  const { userType: t } = ot(), { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.comments.list(e),
    queryFn: async () => {
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      if (!r?.id)
        throw new Ye("User not authenticated");
      return _.debug("[CMS] Fetching comments", { filters: e, tenantId: n.uuid }), await Tt.admin.list(e);
    },
    enabled: !!n?.uuid && !!r?.id && t === "tenant",
    staleTime: 1 * 60 * 1e3,
    gcTime: 3 * 60 * 1e3
  });
}, wg = (e) => Ae({
  queryKey: A.comments.forContent(e || ""),
  queryFn: async () => {
    if (!e)
      throw new Error("Content UUID is required");
    return _.debug("[CMS] Fetching comments for content", { contentUuid: e }), await Tt.public.listForContent(e);
  },
  enabled: !!e,
  staleTime: 2 * 60 * 1e3,
  gcTime: 5 * 60 * 1e3
}), bg = wg, Cg = () => {
  const e = ue();
  return fe({
    mutationFn: async (t) => (_.debug("[CMS] Submitting comment", { input: t }), await Tt.public.submit(t)),
    onSuccess: (t, n) => {
      e.invalidateQueries({ queryKey: A.comments.all }), e.invalidateQueries({
        queryKey: A.comments.forContent(n.content_id)
      }), L.success("Comment submitted successfully", {
        description: "Your comment is pending moderation."
      }), _.info("[CMS] Comment submitted", { uuid: t.data.uuid });
    },
    onError: (t) => {
      L.error("Failed to submit comment", {
        description: t?.message || "An error occurred while submitting your comment."
      }), _.error("[CMS] Failed to submit comment", { error: t.message });
    }
  });
}, Sg = () => {
  const e = ue();
  return fe({
    mutationFn: async ({ parentUuid: t, input: n }) => (_.debug("[CMS] Replying to comment", { parentUuid: t, input: n }), await Tt.public.reply(t, n)),
    onSuccess: (t, n) => {
      e.invalidateQueries({ queryKey: A.comments.all }), e.invalidateQueries({
        queryKey: A.comments.forContent(n.input.content_id)
      }), L.success("Reply submitted successfully", {
        description: "Your reply is pending moderation."
      }), _.info("[CMS] Comment reply submitted", { uuid: t.data.uuid });
    },
    onError: (t) => {
      L.error("Failed to submit reply", {
        description: t?.message || "An error occurred while submitting your reply."
      }), _.error("[CMS] Failed to submit reply", { error: t.message });
    }
  });
}, xg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Approving comment", { uuid: n, tenantId: t?.uuid }), await Tt.admin.approve(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.comments.all }), L.success("Comment approved", {
        description: "The comment is now visible to the public."
      }), _.info("[CMS] Comment approved", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to approve comment", {
        description: n?.message || "An error occurred while approving the comment."
      }), _.error("[CMS] Failed to approve comment", { error: n.message });
    }
  });
}, Ng = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async ({ uuid: n, reason: r }) => (_.debug("[CMS] Rejecting comment", { uuid: n, reason: r, tenantId: t?.uuid }), await Tt.admin.reject(n, r)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.comments.all }), L.success("Comment rejected", {
        description: "The comment has been rejected."
      }), _.info("[CMS] Comment rejected", { uuid: r.uuid });
    },
    onError: (n) => {
      L.error("Failed to reject comment", {
        description: n?.message || "An error occurred while rejecting the comment."
      }), _.error("[CMS] Failed to reject comment", { error: n.message });
    }
  });
}, Eg = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Marking comment as spam", { uuid: n, tenantId: t?.uuid }), await Tt.admin.markAsSpam(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.comments.all }), L.success("Comment marked as spam", {
        description: "The comment has been marked as spam and hidden."
      }), _.info("[CMS] Comment marked as spam", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to mark comment as spam", {
        description: n?.message || "An error occurred while marking the comment as spam."
      }), _.error("[CMS] Failed to mark comment as spam", { error: n.message });
    }
  });
}, pN = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Deleting comment", { uuid: n, tenantId: t?.uuid }), await Tt.admin.delete(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.comments.all }), e.removeQueries({ queryKey: A.comments.detail(r) }), L.success("Comment deleted successfully", {
        description: "The comment has been permanently deleted."
      }), _.info("[CMS] Comment deleted", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to delete comment", {
        description: n?.message || "An error occurred while deleting the comment."
      }), _.error("[CMS] Failed to delete comment", { error: n.message });
    }
  });
}, mN = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Bulk approving comments", { uuids: n, tenantId: t?.uuid }), await Tt.admin.bulkApprove(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.comments.all }), L.success("Comments approved", {
        description: `${r.length} comments have been approved.`
      }), _.info("[CMS] Bulk comments approved", { count: r.length });
    },
    onError: (n) => {
      L.error("Failed to approve comments", {
        description: n?.message || "An error occurred while approving the comments."
      }), _.error("[CMS] Failed to bulk approve comments", { error: n.message });
    }
  });
}, hN = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Bulk deleting comments", { uuids: n, tenantId: t?.uuid }), await Tt.admin.bulkDelete(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.comments.all }), L.success("Comments deleted", {
        description: `${r.length} comments have been deleted.`
      }), _.info("[CMS] Bulk comments deleted", { count: r.length });
    },
    onError: (n) => {
      L.error("Failed to delete comments", {
        description: n?.message || "An error occurred while deleting the comments."
      }), _.error("[CMS] Failed to bulk delete comments", { error: n.message });
    }
  });
}, Wo = "/cms/admin/revisions", Ws = {
  async listForContent(e, t) {
    const n = new URLSearchParams();
    return t?.page && n.append("page", String(t.page)), t?.per_page && n.append("per_page", String(t.per_page)), D.get(`${Wo}/content/${e}${n.toString() ? `?${n}` : ""}`);
  },
  async getById(e) {
    return D.get(`${Wo}/${e}`);
  },
  async revert(e) {
    return D.post(`${Wo}/${e}/revert`, {});
  }
}, Tg = (e) => {
  const { userType: t } = ot(), { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.revisions.forContent(e || ""),
    queryFn: async () => {
      if (!e)
        throw new Error("Content UUID is required");
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      if (!r?.id)
        throw new Ye("User not authenticated");
      return _.debug("[CMS] Fetching revisions for content", { contentUuid: e, tenantId: n.uuid }), await Ws.list(e);
    },
    enabled: !!e && !!n?.uuid && !!r?.id && t === "tenant",
    staleTime: 5 * 60 * 1e3,
    gcTime: 10 * 60 * 1e3
  });
}, gN = (e) => {
  const { userType: t } = ot(), { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.revisions.detail(e || ""),
    queryFn: async () => {
      if (!e)
        throw new Error("Revision UUID is required");
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      if (!r?.id)
        throw new Ye("User not authenticated");
      return _.debug("[CMS] Fetching revision", { uuid: e, tenantId: n.uuid }), await Ws.getById(e);
    },
    enabled: !!e && !!n?.uuid && !!r?.id && t === "tenant",
    staleTime: 5 * 60 * 1e3,
    gcTime: 10 * 60 * 1e3
  });
}, _g = () => {
  const e = ue(), { tenant: t } = Y();
  return fe({
    mutationFn: async (n) => (_.debug("[CMS] Reverting to revision", { uuid: n, tenantId: t?.uuid }), await Ws.revert(n)),
    onSuccess: (n, r) => {
      e.invalidateQueries({ queryKey: A.revisions.all }), e.invalidateQueries({ queryKey: A.contents.all }), L.success("Revision restored successfully", {
        description: "The content has been restored to this revision."
      }), _.info("[CMS] Revision reverted", { uuid: r });
    },
    onError: (n) => {
      L.error("Failed to restore revision", {
        description: n?.message || "An error occurred while restoring the revision."
      }), _.error("[CMS] Failed to revert revision", { error: n.message });
    }
  });
}, Rg = "/cms/public/tags", Ag = {
  async list() {
    return D.get(Rg);
  }
}, yN = (e) => {
  const { userType: t } = ot(), { tenant: n, user: r } = Y();
  return Ae({
    queryKey: A.tags.list(e),
    queryFn: async () => {
      if (!n?.uuid)
        throw new $e("Tenant context not available");
      if (!r?.id)
        throw new Ye("User not authenticated");
      return _.debug("[CMS] Fetching tags", { filters: e, tenantId: n.uuid }), await Ag.list();
    },
    enabled: !!n?.uuid && !!r?.id && t === "tenant",
    staleTime: 10 * 60 * 1e3,
    gcTime: 15 * 60 * 1e3
  });
}, vi = {
  contentTypes: [],
  currentContentType: null,
  filters: {},
  isLoading: !1,
  error: null
}, Pg = ao()(
  io(
    co(
      (e) => ({
        ...vi,
        setContentTypes: (t) => e({ contentTypes: t }),
        setCurrentContentType: (t) => e({ currentContentType: t }),
        setFilters: (t) => e((n) => ({
          filters: { ...n.filters, ...t }
        })),
        setIsLoading: (t) => e({ isLoading: t }),
        setError: (t) => e({ error: t }),
        clearFilters: () => e({ filters: {} }),
        reset: () => e(vi)
      }),
      {
        name: "cms-content-type-storage",
        partialize: (e) => ({
          filters: e.filters
        })
      }
    ),
    { name: "ContentTypeStore" }
  )
), wi = {
  contents: [],
  currentContent: null,
  filters: {},
  editorMode: "wysiwyg",
  isLoading: !1,
  isSaving: !1,
  error: null,
  selectedContentIds: []
}, Zc = ao()(
  io(
    co(
      (e, t) => ({
        ...wi,
        setContents: (n) => e({ contents: n }),
        setCurrentContent: (n) => e({ currentContent: n }),
        setFilters: (n) => e((r) => ({
          filters: { ...r.filters, ...n }
        })),
        setEditorMode: (n) => e({ editorMode: n }),
        setIsLoading: (n) => e({ isLoading: n }),
        setIsSaving: (n) => e({ isSaving: n }),
        setError: (n) => e({ error: n }),
        setSelectedContentIds: (n) => e({ selectedContentIds: n }),
        toggleContentSelection: (n) => e((r) => ({
          selectedContentIds: r.selectedContentIds.includes(n) ? r.selectedContentIds.filter((s) => s !== n) : [...r.selectedContentIds, n]
        })),
        selectAllContents: () => e((n) => ({
          selectedContentIds: n.contents.map((r) => r.uuid)
        })),
        clearSelection: () => e({ selectedContentIds: [] }),
        clearFilters: () => e({ filters: {} }),
        reset: () => e(wi)
      }),
      {
        name: "cms-content-storage",
        partialize: (e) => ({
          filters: e.filters,
          editorMode: e.editorMode
        })
      }
    ),
    { name: "ContentStore" }
  )
), bi = {
  categories: [],
  categoryTree: [],
  currentCategory: null,
  filters: {},
  expandedNodes: /* @__PURE__ */ new Set(),
  selectedCategoryId: null,
  isLoading: !1,
  error: null
}, el = ao()(
  io(
    co(
      (e, t) => ({
        ...bi,
        setCategories: (n) => e({ categories: n }),
        setCategoryTree: (n) => e({ categoryTree: n }),
        setCurrentCategory: (n) => e({ currentCategory: n }),
        setFilters: (n) => e((r) => ({
          filters: { ...r.filters, ...n }
        })),
        setIsLoading: (n) => e({ isLoading: n }),
        setError: (n) => e({ error: n }),
        setSelectedCategoryId: (n) => e({ selectedCategoryId: n }),
        toggleNode: (n) => e((r) => {
          const s = new Set(r.expandedNodes);
          return s.has(n) ? s.delete(n) : s.add(n), { expandedNodes: s };
        }),
        expandNode: (n) => e((r) => {
          const s = new Set(r.expandedNodes);
          return s.add(n), { expandedNodes: s };
        }),
        collapseNode: (n) => e((r) => {
          const s = new Set(r.expandedNodes);
          return s.delete(n), { expandedNodes: s };
        }),
        expandAll: () => {
          const n = /* @__PURE__ */ new Set(), r = (s) => {
            s.forEach((a) => {
              n.add(a.uuid), a.children && a.children.length > 0 && r(a.children);
            });
          };
          r(t().categoryTree), e({ expandedNodes: n });
        },
        collapseAll: () => e({ expandedNodes: /* @__PURE__ */ new Set() }),
        clearFilters: () => e({ filters: {} }),
        reset: () => e(bi)
      }),
      {
        name: "cms-category-storage",
        partialize: (e) => ({
          filters: e.filters,
          expandedNodes: Array.from(e.expandedNodes)
        }),
        merge: (e, t) => ({
          ...t,
          ...e,
          expandedNodes: new Set(e?.expandedNodes || [])
        })
      }
    ),
    { name: "CategoryStore" }
  )
), Ci = {
  comments: [],
  currentComment: null,
  filters: {},
  activeTab: "pending",
  selectedCommentIds: [],
  isLoading: !1,
  error: null
}, Mg = ao()(
  io(
    co(
      (e, t) => ({
        ...Ci,
        setComments: (n) => e({ comments: n }),
        setCurrentComment: (n) => e({ currentComment: n }),
        setFilters: (n) => e((r) => ({
          filters: { ...r.filters, ...n }
        })),
        setActiveTab: (n) => e({ activeTab: n, selectedCommentIds: [] }),
        setIsLoading: (n) => e({ isLoading: n }),
        setError: (n) => e({ error: n }),
        setSelectedCommentIds: (n) => e({ selectedCommentIds: n }),
        toggleCommentSelection: (n) => e((r) => ({
          selectedCommentIds: r.selectedCommentIds.includes(n) ? r.selectedCommentIds.filter((s) => s !== n) : [...r.selectedCommentIds, n]
        })),
        selectAllComments: () => e((n) => ({
          selectedCommentIds: n.comments.map((r) => r.uuid)
        })),
        clearSelection: () => e({ selectedCommentIds: [] }),
        clearFilters: () => e({ filters: {} }),
        reset: () => e(Ci)
      }),
      {
        name: "cms-comment-storage",
        partialize: (e) => ({
          filters: e.filters,
          activeTab: e.activeTab
        })
      }
    ),
    { name: "CommentStore" }
  )
);
function kg() {
  const e = nr(), [t, n] = W("list"), { filters: r, setFilters: s } = Pg(), { data: a, isLoading: i } = js(r), c = rg(), d = og(), l = sg(), u = a?.data || [], f = (p) => {
    s({ search: p });
  }, v = (p) => {
    d.mutate(p);
  }, w = (p) => {
    l.mutate(p);
  }, g = (p) => {
    confirm("Are you sure you want to delete this content type? This action cannot be undone.") && c.mutate(p);
  };
  return i ? /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ o(_e, { className: "h-8 w-48" }),
      /* @__PURE__ */ o(_e, { className: "h-10 w-32" })
    ] }),
    /* @__PURE__ */ o("div", { className: "space-y-3", children: [...Array(5)].map((p, y) => /* @__PURE__ */ o(_e, { className: "h-16 w-full" }, y)) })
  ] }) : /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ h("div", { children: [
        /* @__PURE__ */ o("h1", { className: "text-3xl font-bold tracking-tight", children: "Content Types" }),
        /* @__PURE__ */ o("p", { className: "text-muted-foreground mt-1", children: "Manage different types of content for your CMS" })
      ] }),
      /* @__PURE__ */ h(oe, { onClick: () => e("/admin/cms/content-types/new"), children: [
        /* @__PURE__ */ o(Pn, { className: "h-4 w-4 mr-2" }),
        "New Content Type"
      ] })
    ] }),
    /* @__PURE__ */ h(Me, { children: [
      /* @__PURE__ */ o(Le, { className: "border-b", children: /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ h(Ke, { children: [
          "All Content Types (",
          u.length,
          ")"
        ] }),
        /* @__PURE__ */ h("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ h("div", { className: "relative w-64", children: [
            /* @__PURE__ */ o(Mn, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ o(
              De,
              {
                placeholder: "Search content types...",
                className: "pl-9",
                value: r.search || "",
                onChange: (p) => f(p.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ h("div", { className: "flex border rounded-md", children: [
            /* @__PURE__ */ o(
              oe,
              {
                variant: t === "list" ? "default" : "ghost",
                size: "sm",
                onClick: () => n("list"),
                className: "rounded-r-none",
                children: /* @__PURE__ */ o(ac, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ o(
              oe,
              {
                variant: t === "grid" ? "default" : "ghost",
                size: "sm",
                onClick: () => n("grid"),
                className: "rounded-l-none",
                children: /* @__PURE__ */ o(up, { className: "h-4 w-4" })
              }
            )
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ o(ke, { className: "p-0", children: u.length === 0 ? /* @__PURE__ */ h("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ h("div", { className: "text-muted-foreground mb-4", children: [
          /* @__PURE__ */ o(Jr, { className: "h-12 w-12 mx-auto mb-3 opacity-30" }),
          /* @__PURE__ */ o("p", { className: "text-lg font-medium", children: "No content types found" }),
          /* @__PURE__ */ o("p", { className: "text-sm", children: "Create your first content type to get started" })
        ] }),
        /* @__PURE__ */ h(oe, { onClick: () => e("/admin/cms/content-types/new"), children: [
          /* @__PURE__ */ o(Pn, { className: "h-4 w-4 mr-2" }),
          "Create Content Type"
        ] })
      ] }) : t === "list" ? /* @__PURE__ */ h(Zr, { children: [
        /* @__PURE__ */ o(eo, { children: /* @__PURE__ */ h(Gt, { children: [
          /* @__PURE__ */ o(Ce, { children: "Name" }),
          /* @__PURE__ */ o(Ce, { children: "System Name" }),
          /* @__PURE__ */ o(Ce, { children: "Icon" }),
          /* @__PURE__ */ o(Ce, { children: "Contents" }),
          /* @__PURE__ */ o(Ce, { children: "Status" }),
          /* @__PURE__ */ o(Ce, { className: "text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ o(to, { children: u.map((p) => /* @__PURE__ */ h(Gt, { children: [
          /* @__PURE__ */ o(Se, { className: "font-medium", children: p.name }),
          /* @__PURE__ */ o(Se, { className: "font-mono text-sm text-muted-foreground", children: p.slug }),
          /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ o("div", { className: "flex items-center", children: /* @__PURE__ */ o("span", { className: "text-xl", children: p.icon || "📄" }) }) }),
          /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ o("span", { className: "text-sm text-muted-foreground", children: "0 contents" }) }),
          /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ o(un, { variant: p.is_active ? "default" : "secondary", children: p.is_active ? "Active" : "Inactive" }) }),
          /* @__PURE__ */ o(Se, { className: "text-right", children: /* @__PURE__ */ h(Ur, { children: [
            /* @__PURE__ */ o(Br, { asChild: !0, children: /* @__PURE__ */ o(oe, { variant: "ghost", size: "sm", children: /* @__PURE__ */ o(Fr, { className: "h-4 w-4" }) }) }),
            /* @__PURE__ */ h(zr, { align: "end", children: [
              /* @__PURE__ */ h(Be, { onClick: () => e(`/admin/cms/content-types/${p.uuid}/edit`), children: [
                /* @__PURE__ */ o(Lr, { className: "h-4 w-4 mr-2" }),
                "Edit"
              ] }),
              p.is_active ? /* @__PURE__ */ h(Be, { onClick: () => w(p.uuid), children: [
                /* @__PURE__ */ o(Ma, { className: "h-4 w-4 mr-2" }),
                "Deactivate"
              ] }) : /* @__PURE__ */ h(Be, { onClick: () => v(p.uuid), children: [
                /* @__PURE__ */ o(Ft, { className: "h-4 w-4 mr-2" }),
                "Activate"
              ] }),
              /* @__PURE__ */ h(
                Be,
                {
                  onClick: () => g(p.uuid),
                  className: "text-destructive",
                  children: [
                    /* @__PURE__ */ o($r, { className: "h-4 w-4 mr-2" }),
                    "Delete"
                  ]
                }
              )
            ] })
          ] }) })
        ] }, p.uuid)) })
      ] }) : /* @__PURE__ */ o("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6", children: u.map((p) => /* @__PURE__ */ h(Me, { className: "hover:shadow-md transition-shadow", children: [
        /* @__PURE__ */ o(Le, { children: /* @__PURE__ */ h("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ h("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ o("span", { className: "text-3xl", children: p.icon || "📄" }),
            /* @__PURE__ */ h("div", { children: [
              /* @__PURE__ */ o(Ke, { className: "text-lg", children: p.name }),
              /* @__PURE__ */ o("p", { className: "text-sm text-muted-foreground font-mono", children: p.slug })
            ] })
          ] }),
          /* @__PURE__ */ h(Ur, { children: [
            /* @__PURE__ */ o(Br, { asChild: !0, children: /* @__PURE__ */ o(oe, { variant: "ghost", size: "sm", children: /* @__PURE__ */ o(Fr, { className: "h-4 w-4" }) }) }),
            /* @__PURE__ */ h(zr, { align: "end", children: [
              /* @__PURE__ */ h(Be, { onClick: () => e(`/admin/cms/content-types/${p.uuid}/edit`), children: [
                /* @__PURE__ */ o(Lr, { className: "h-4 w-4 mr-2" }),
                "Edit"
              ] }),
              p.is_active ? /* @__PURE__ */ h(Be, { onClick: () => w(p.uuid), children: [
                /* @__PURE__ */ o(Ma, { className: "h-4 w-4 mr-2" }),
                "Deactivate"
              ] }) : /* @__PURE__ */ h(Be, { onClick: () => v(p.uuid), children: [
                /* @__PURE__ */ o(Ft, { className: "h-4 w-4 mr-2" }),
                "Activate"
              ] }),
              /* @__PURE__ */ h(
                Be,
                {
                  onClick: () => g(p.uuid),
                  className: "text-destructive",
                  children: [
                    /* @__PURE__ */ o($r, { className: "h-4 w-4 mr-2" }),
                    "Delete"
                  ]
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ o(ke, { children: /* @__PURE__ */ h("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ o("span", { className: "text-muted-foreground", children: "0 contents" }),
          /* @__PURE__ */ o(un, { variant: p.is_active ? "default" : "secondary", children: p.is_active ? "Active" : "Inactive" })
        ] }) })
      ] }, p.uuid)) }) })
    ] })
  ] });
}
const Ig = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: kg
}, Symbol.toStringTag, { value: "Module" }));
function tl(e) {
  var t, n, r = "";
  if (typeof e == "string" || typeof e == "number") r += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var s = e.length;
    for (t = 0; t < s; t++) e[t] && (n = tl(e[t])) && (r && (r += " "), r += n);
  } else for (n in e) e[n] && (r && (r += " "), r += n);
  return r;
}
function nl() {
  for (var e, t, n = 0, r = "", s = arguments.length; n < s; n++) (e = arguments[n]) && (t = tl(e)) && (r && (r += " "), r += t);
  return r;
}
const Ks = "-", Og = (e) => {
  const t = Fg(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (i) => {
      const c = i.split(Ks);
      return c[0] === "" && c.length !== 1 && c.shift(), rl(c, t) || Dg(i);
    },
    getConflictingClassGroupIds: (i, c) => {
      const d = n[i] || [];
      return c && r[i] ? [...d, ...r[i]] : d;
    }
  };
}, rl = (e, t) => {
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), s = r ? rl(e.slice(1), r) : void 0;
  if (s)
    return s;
  if (t.validators.length === 0)
    return;
  const a = e.join(Ks);
  return t.validators.find(({
    validator: i
  }) => i(a))?.classGroupId;
}, Si = /^\[(.+)\]$/, Dg = (e) => {
  if (Si.test(e)) {
    const t = Si.exec(e)[1], n = t?.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, Fg = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return $g(Object.entries(e.classGroups), n).forEach(([a, i]) => {
    ms(i, r, a, t);
  }), r;
}, ms = (e, t, n, r) => {
  e.forEach((s) => {
    if (typeof s == "string") {
      const a = s === "" ? t : xi(t, s);
      a.classGroupId = n;
      return;
    }
    if (typeof s == "function") {
      if (Lg(s)) {
        ms(s(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: s,
        classGroupId: n
      });
      return;
    }
    Object.entries(s).forEach(([a, i]) => {
      ms(i, xi(t, a), n, r);
    });
  });
}, xi = (e, t) => {
  let n = e;
  return t.split(Ks).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, Lg = (e) => e.isThemeGetter, $g = (e, t) => t ? e.map(([n, r]) => {
  const s = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, c]) => [t + i, c])) : a);
  return [n, s];
}) : e, Ug = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const s = (a, i) => {
    n.set(a, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = n.get(a);
      if (i !== void 0)
        return i;
      if ((i = r.get(a)) !== void 0)
        return s(a, i), i;
    },
    set(a, i) {
      n.has(a) ? n.set(a, i) : s(a, i);
    }
  };
}, ol = "!", Bg = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, s = t[0], a = t.length, i = (c) => {
    const d = [];
    let l = 0, u = 0, f;
    for (let y = 0; y < c.length; y++) {
      let C = c[y];
      if (l === 0) {
        if (C === s && (r || c.slice(y, y + a) === t)) {
          d.push(c.slice(u, y)), u = y + a;
          continue;
        }
        if (C === "/") {
          f = y;
          continue;
        }
      }
      C === "[" ? l++ : C === "]" && l--;
    }
    const v = d.length === 0 ? c : c.substring(u), w = v.startsWith(ol), g = w ? v.substring(1) : v, p = f && f > u ? f - u : void 0;
    return {
      modifiers: d,
      hasImportantModifier: w,
      baseClassName: g,
      maybePostfixModifierPosition: p
    };
  };
  return n ? (c) => n({
    className: c,
    parseClassName: i
  }) : i;
}, zg = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, qg = (e) => ({
  cache: Ug(e.cacheSize),
  parseClassName: Bg(e),
  ...Og(e)
}), Hg = /\s+/, jg = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: s
  } = t, a = [], i = e.trim().split(Hg);
  let c = "";
  for (let d = i.length - 1; d >= 0; d -= 1) {
    const l = i[d], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: v,
      maybePostfixModifierPosition: w
    } = n(l);
    let g = !!w, p = r(g ? v.substring(0, w) : v);
    if (!p) {
      if (!g) {
        c = l + (c.length > 0 ? " " + c : c);
        continue;
      }
      if (p = r(v), !p) {
        c = l + (c.length > 0 ? " " + c : c);
        continue;
      }
      g = !1;
    }
    const y = zg(u).join(":"), C = f ? y + ol : y, S = C + p;
    if (a.includes(S))
      continue;
    a.push(S);
    const b = s(p, g);
    for (let x = 0; x < b.length; ++x) {
      const E = b[x];
      a.push(C + E);
    }
    c = l + (c.length > 0 ? " " + c : c);
  }
  return c;
};
function Wg() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = sl(t)) && (r && (r += " "), r += n);
  return r;
}
const sl = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = sl(e[r])) && (n && (n += " "), n += t);
  return n;
};
function Kg(e, ...t) {
  let n, r, s, a = i;
  function i(d) {
    const l = t.reduce((u, f) => f(u), e());
    return n = qg(l), r = n.cache.get, s = n.cache.set, a = c, c(d);
  }
  function c(d) {
    const l = r(d);
    if (l)
      return l;
    const u = jg(d, n);
    return s(d, u), u;
  }
  return function() {
    return a(Wg.apply(null, arguments));
  };
}
const me = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, al = /^\[(?:([a-z-]+):)?(.+)\]$/i, Vg = /^\d+\/\d+$/, Gg = /* @__PURE__ */ new Set(["px", "full", "screen"]), Qg = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Yg = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Xg = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Jg = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Zg = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, kt = (e) => _n(e) || Gg.has(e) || Vg.test(e), qt = (e) => Un(e, "length", iy), _n = (e) => !!e && !Number.isNaN(Number(e)), Ko = (e) => Un(e, "number", _n), Vn = (e) => !!e && Number.isInteger(Number(e)), ey = (e) => e.endsWith("%") && _n(e.slice(0, -1)), Q = (e) => al.test(e), Ht = (e) => Qg.test(e), ty = /* @__PURE__ */ new Set(["length", "size", "percentage"]), ny = (e) => Un(e, ty, il), ry = (e) => Un(e, "position", il), oy = /* @__PURE__ */ new Set(["image", "url"]), sy = (e) => Un(e, oy, ly), ay = (e) => Un(e, "", cy), Gn = () => !0, Un = (e, t, n) => {
  const r = al.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, iy = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Yg.test(e) && !Xg.test(e)
), il = () => !1, cy = (e) => Jg.test(e), ly = (e) => Zg.test(e), dy = () => {
  const e = me("colors"), t = me("spacing"), n = me("blur"), r = me("brightness"), s = me("borderColor"), a = me("borderRadius"), i = me("borderSpacing"), c = me("borderWidth"), d = me("contrast"), l = me("grayscale"), u = me("hueRotate"), f = me("invert"), v = me("gap"), w = me("gradientColorStops"), g = me("gradientColorStopPositions"), p = me("inset"), y = me("margin"), C = me("opacity"), S = me("padding"), b = me("saturate"), x = me("scale"), E = me("sepia"), k = me("skew"), T = me("space"), P = me("translate"), B = () => ["auto", "contain", "none"], z = () => ["auto", "hidden", "clip", "visible", "scroll"], H = () => ["auto", Q, t], I = () => [Q, t], K = () => ["", kt, qt], q = () => ["auto", _n, Q], ee = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], $ = () => ["solid", "dashed", "dotted", "double", "none"], G = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], O = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], M = () => ["", "0", Q], ae = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], X = () => [_n, Q];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Gn],
      spacing: [kt, qt],
      blur: ["none", "", Ht, Q],
      brightness: X(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Ht, Q],
      borderSpacing: I(),
      borderWidth: K(),
      contrast: X(),
      grayscale: M(),
      hueRotate: X(),
      invert: M(),
      gap: I(),
      gradientColorStops: [e],
      gradientColorStopPositions: [ey, qt],
      inset: H(),
      margin: H(),
      opacity: X(),
      padding: I(),
      saturate: X(),
      scale: X(),
      sepia: M(),
      skew: X(),
      space: I(),
      translate: I()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", Q]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [Ht]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": ae()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": ae()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...ee(), Q]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: z()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": z()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": z()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: B()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": B()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": B()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", Vn, Q]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: H()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", Q]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: M()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: M()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Vn, Q]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Gn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Vn, Q]
        }, Q]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": q()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": q()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Gn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Vn, Q]
        }, Q]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": q()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": q()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", Q]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", Q]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [v]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [v]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [v]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...O()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...O(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...O(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [S]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [S]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [S]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [S]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [S]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [S]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [S]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [S]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [S]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [y]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [y]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [y]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [y]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [y]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [y]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [y]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [y]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [y]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [T]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [T]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", Q, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [Q, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [Q, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Ht]
        }, Ht]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [Q, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [Q, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [Q, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [Q, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Ht, qt]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Ko]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Gn]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", Q]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", _n, Ko]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", kt, Q]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", Q]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", Q]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [C]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [C]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...$(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", kt, qt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", kt, Q]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: I()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", Q]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", Q]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [C]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...ee(), ry]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", ny]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, sy]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [g]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [g]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [g]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [w]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [w]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [w]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [a]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [a]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [a]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [a]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [a]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [a]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [a]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [a]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [a]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [a]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [a]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [a]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [a]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [a]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [a]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [c]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [c]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [c]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [c]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [c]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [c]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [c]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [c]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [c]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [C]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...$(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [c]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [c]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [C]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: $()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [s]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [s]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [s]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [s]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [s]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [s]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [s]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [s]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [s]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [s]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...$()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [kt, Q]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [kt, qt]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: K()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [C]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [kt, qt]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", Ht, ay]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Gn]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [C]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...G(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": G()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [n]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [r]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [d]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Ht, Q]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [l]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [u]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [f]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [b]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [E]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [n]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [r]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [d]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [l]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [u]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [f]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [C]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [b]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [E]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [i]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [i]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [i]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", Q]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: X()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", Q]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: X()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", Q]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [x]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [x]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [x]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Vn, Q]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [P]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [P]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [k]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [k]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", Q]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", Q]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": I()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": I()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": I()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": I()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": I()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": I()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": I()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": I()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": I()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": I()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": I()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": I()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": I()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": I()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": I()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": I()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": I()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": I()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", Q]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [kt, qt, Ko]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, uy = /* @__PURE__ */ Kg(dy);
function te(...e) {
  return uy(nl(e));
}
const Ni = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, Ei = nl, cl = (e, t) => (n) => {
  var r;
  if (t?.variants == null) return Ei(e, n?.class, n?.className);
  const { variants: s, defaultVariants: a } = t, i = Object.keys(s).map((l) => {
    const u = n?.[l], f = a?.[l];
    if (u === null) return null;
    const v = Ni(u) || Ni(f);
    return s[l][v];
  }), c = n && Object.entries(n).reduce((l, u) => {
    let [f, v] = u;
    return v === void 0 || (l[f] = v), l;
  }, {}), d = t == null || (r = t.compoundVariants) === null || r === void 0 ? void 0 : r.reduce((l, u) => {
    let { class: f, className: v, ...w } = u;
    return Object.entries(w).every((g) => {
      let [p, y] = g;
      return Array.isArray(y) ? y.includes({
        ...a,
        ...c
      }[p]) : {
        ...a,
        ...c
      }[p] === y;
    }) ? [
      ...l,
      f,
      v
    ] : l;
  }, []);
  return Ei(e, i, d, n?.class, n?.className);
}, fy = cl("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"), Pe = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(Cc.Root, { ref: n, className: te(fy(), e), ...t }));
Pe.displayName = Cc.Root.displayName;
const Vs = Xp, ll = m.createContext({}), he = ({
  ...e
}) => /* @__PURE__ */ o(ll.Provider, { value: { name: e.name }, children: /* @__PURE__ */ o(Jp, { ...e }) }), wo = () => {
  const e = m.useContext(ll), t = m.useContext(dl), { getFieldState: n, formState: r } = Yp(), s = n(e.name, r);
  if (!e)
    throw new Error("useFormField should be used within <FormField>");
  const { id: a } = t;
  return {
    id: a,
    name: e.name,
    formItemId: `${a}-form-item`,
    formDescriptionId: `${a}-form-item-description`,
    formMessageId: `${a}-form-item-message`,
    ...s
  };
}, dl = m.createContext({}), de = m.forwardRef(
  ({ className: e, ...t }, n) => {
    const r = m.useId();
    return /* @__PURE__ */ o(dl.Provider, { value: { id: r }, children: /* @__PURE__ */ o("div", { ref: n, className: te("space-y-2", e), ...t }) });
  }
);
de.displayName = "FormItem";
const ve = m.forwardRef(({ className: e, ...t }, n) => {
  const { error: r, formItemId: s } = wo();
  return /* @__PURE__ */ o(Pe, { ref: n, className: te(r && "text-destructive", e), htmlFor: s, ...t });
});
ve.displayName = "FormLabel";
const ge = m.forwardRef(
  ({ ...e }, t) => {
    const { error: n, formItemId: r, formDescriptionId: s, formMessageId: a } = wo();
    return /* @__PURE__ */ o(
      bc,
      {
        ref: t,
        id: r,
        "aria-describedby": n ? `${s} ${a}` : `${s}`,
        "aria-invalid": !!n,
        ...e
      }
    );
  }
);
ge.displayName = "FormControl";
const Te = m.forwardRef(
  ({ className: e, ...t }, n) => {
    const { formDescriptionId: r } = wo();
    return /* @__PURE__ */ o("p", { ref: n, id: r, className: te("text-sm text-muted-foreground", e), ...t });
  }
);
Te.displayName = "FormDescription";
const Oe = m.forwardRef(
  ({ className: e, children: t, ...n }, r) => {
    const { error: s, formMessageId: a } = wo(), i = s ? String(s?.message) : t;
    return i ? /* @__PURE__ */ o("p", { ref: r, id: a, className: te("text-sm font-medium text-destructive", e), ...n, children: i }) : null;
  }
);
Oe.displayName = "FormMessage";
function U(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function(s) {
    if (e?.(s), n === !1 || !s.defaultPrevented)
      return t?.(s);
  };
}
function Ti(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function Gs(...e) {
  return (t) => {
    let n = !1;
    const r = e.map((s) => {
      const a = Ti(s, t);
      return !n && typeof a == "function" && (n = !0), a;
    });
    if (n)
      return () => {
        for (let s = 0; s < r.length; s++) {
          const a = r[s];
          typeof a == "function" ? a() : Ti(e[s], null);
        }
      };
  };
}
function se(...e) {
  return m.useCallback(Gs(...e), e);
}
function py(e, t) {
  const n = m.createContext(t), r = (a) => {
    const { children: i, ...c } = a, d = m.useMemo(() => c, Object.values(c));
    return /* @__PURE__ */ o(n.Provider, { value: d, children: i });
  };
  r.displayName = e + "Provider";
  function s(a) {
    const i = m.useContext(n);
    if (i) return i;
    if (t !== void 0) return t;
    throw new Error(`\`${a}\` must be used within \`${e}\``);
  }
  return [r, s];
}
function Bt(e, t = []) {
  let n = [];
  function r(a, i) {
    const c = m.createContext(i), d = n.length;
    n = [...n, i];
    const l = (f) => {
      const { scope: v, children: w, ...g } = f, p = v?.[e]?.[d] || c, y = m.useMemo(() => g, Object.values(g));
      return /* @__PURE__ */ o(p.Provider, { value: y, children: w });
    };
    l.displayName = a + "Provider";
    function u(f, v) {
      const w = v?.[e]?.[d] || c, g = m.useContext(w);
      if (g) return g;
      if (i !== void 0) return i;
      throw new Error(`\`${f}\` must be used within \`${a}\``);
    }
    return [l, u];
  }
  const s = () => {
    const a = n.map((i) => m.createContext(i));
    return function(c) {
      const d = c?.[e] || a;
      return m.useMemo(
        () => ({ [`__scope${e}`]: { ...c, [e]: d } }),
        [c, d]
      );
    };
  };
  return s.scopeName = e, [r, my(s, ...t)];
}
function my(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const n = () => {
    const r = e.map((s) => ({
      useScope: s(),
      scopeName: s.scopeName
    }));
    return function(a) {
      const i = r.reduce((c, { useScope: d, scopeName: l }) => {
        const f = d(a)[`__scope${l}`];
        return { ...c, ...f };
      }, {});
      return m.useMemo(() => ({ [`__scope${t.scopeName}`]: i }), [i]);
    };
  };
  return n.scopeName = t.scopeName, n;
}
var Ie = globalThis?.document ? m.useLayoutEffect : () => {
}, hy = m[" useInsertionEffect ".trim().toString()] || Ie;
function pn({
  prop: e,
  defaultProp: t,
  onChange: n = () => {
  },
  caller: r
}) {
  const [s, a, i] = gy({
    defaultProp: t,
    onChange: n
  }), c = e !== void 0, d = c ? e : s;
  {
    const u = m.useRef(e !== void 0);
    m.useEffect(() => {
      const f = u.current;
      f !== c && console.warn(
        `${r} is changing from ${f ? "controlled" : "uncontrolled"} to ${c ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), u.current = c;
    }, [c, r]);
  }
  const l = m.useCallback(
    (u) => {
      if (c) {
        const f = yy(u) ? u(e) : u;
        f !== e && i.current?.(f);
      } else
        a(u);
    },
    [c, e, a, i]
  );
  return [d, l];
}
function gy({
  defaultProp: e,
  onChange: t
}) {
  const [n, r] = m.useState(e), s = m.useRef(n), a = m.useRef(t);
  return hy(() => {
    a.current = t;
  }, [t]), m.useEffect(() => {
    s.current !== n && (a.current?.(n), s.current = n);
  }, [n, s]), [n, r, a];
}
function yy(e) {
  return typeof e == "function";
}
function ul(e) {
  const t = m.useRef({ value: e, previous: e });
  return m.useMemo(() => (t.current.value !== e && (t.current.previous = t.current.value, t.current.value = e), t.current.previous), [e]);
}
function fl(e) {
  const [t, n] = m.useState(void 0);
  return Ie(() => {
    if (e) {
      n({ width: e.offsetWidth, height: e.offsetHeight });
      const r = new ResizeObserver((s) => {
        if (!Array.isArray(s) || !s.length)
          return;
        const a = s[0];
        let i, c;
        if ("borderBoxSize" in a) {
          const d = a.borderBoxSize, l = Array.isArray(d) ? d[0] : d;
          i = l.inlineSize, c = l.blockSize;
        } else
          i = e.offsetWidth, c = e.offsetHeight;
        n({ width: i, height: c });
      });
      return r.observe(e, { box: "border-box" }), () => r.unobserve(e);
    } else
      n(void 0);
  }, [e]), t;
}
var vy = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
], Z = vy.reduce((e, t) => {
  const n = Lt(`Primitive.${t}`), r = m.forwardRef((s, a) => {
    const { asChild: i, ...c } = s, d = i ? n : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ o(d, { ...c, ref: a });
  });
  return r.displayName = `Primitive.${t}`, { ...e, [t]: r };
}, {});
function pl(e, t) {
  e && lo.flushSync(() => e.dispatchEvent(t));
}
var bo = "Switch", [wy] = Bt(bo), [by, Cy] = wy(bo), ml = m.forwardRef(
  (e, t) => {
    const {
      __scopeSwitch: n,
      name: r,
      checked: s,
      defaultChecked: a,
      required: i,
      disabled: c,
      value: d = "on",
      onCheckedChange: l,
      form: u,
      ...f
    } = e, [v, w] = m.useState(null), g = se(t, (b) => w(b)), p = m.useRef(!1), y = v ? u || !!v.closest("form") : !0, [C, S] = pn({
      prop: s,
      defaultProp: a ?? !1,
      onChange: l,
      caller: bo
    });
    return /* @__PURE__ */ h(by, { scope: n, checked: C, disabled: c, children: [
      /* @__PURE__ */ o(
        Z.button,
        {
          type: "button",
          role: "switch",
          "aria-checked": C,
          "aria-required": i,
          "data-state": vl(C),
          "data-disabled": c ? "" : void 0,
          disabled: c,
          value: d,
          ...f,
          ref: g,
          onClick: U(e.onClick, (b) => {
            S((x) => !x), y && (p.current = b.isPropagationStopped(), p.current || b.stopPropagation());
          })
        }
      ),
      y && /* @__PURE__ */ o(
        yl,
        {
          control: v,
          bubbles: !p.current,
          name: r,
          value: d,
          checked: C,
          required: i,
          disabled: c,
          form: u,
          style: { transform: "translateX(-100%)" }
        }
      )
    ] });
  }
);
ml.displayName = bo;
var hl = "SwitchThumb", gl = m.forwardRef(
  (e, t) => {
    const { __scopeSwitch: n, ...r } = e, s = Cy(hl, n);
    return /* @__PURE__ */ o(
      Z.span,
      {
        "data-state": vl(s.checked),
        "data-disabled": s.disabled ? "" : void 0,
        ...r,
        ref: t
      }
    );
  }
);
gl.displayName = hl;
var Sy = "SwitchBubbleInput", yl = m.forwardRef(
  ({
    __scopeSwitch: e,
    control: t,
    checked: n,
    bubbles: r = !0,
    ...s
  }, a) => {
    const i = m.useRef(null), c = se(i, a), d = ul(n), l = fl(t);
    return m.useEffect(() => {
      const u = i.current;
      if (!u) return;
      const f = window.HTMLInputElement.prototype, w = Object.getOwnPropertyDescriptor(
        f,
        "checked"
      ).set;
      if (d !== n && w) {
        const g = new Event("click", { bubbles: r });
        w.call(u, n), u.dispatchEvent(g);
      }
    }, [d, n, r]), /* @__PURE__ */ o(
      "input",
      {
        type: "checkbox",
        "aria-hidden": !0,
        defaultChecked: n,
        ...s,
        tabIndex: -1,
        ref: c,
        style: {
          ...s.style,
          ...l,
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0
        }
      }
    );
  }
);
yl.displayName = Sy;
function vl(e) {
  return e ? "checked" : "unchecked";
}
var wl = ml, xy = gl;
const Vt = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(
  wl,
  {
    className: te(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      e
    ),
    ...t,
    ref: n,
    children: /* @__PURE__ */ o(
      xy,
      {
        className: te(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Vt.displayName = wl.displayName;
const Ny = j.object({
  name: j.string().min(1, "Name is required").max(100),
  slug: j.string().min(1, "Slug is required").max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: j.string().max(500).optional(),
  icon: j.string().max(50).optional(),
  default_url_pattern: j.string().max(255).optional(),
  is_commentable: j.boolean().optional(),
  is_categorizable: j.boolean().optional(),
  is_taggable: j.boolean().optional(),
  is_revisioned: j.boolean().optional()
});
function Ey() {
  const { uuid: e } = Is(), t = nr(), n = !!e, { data: r, isLoading: s } = eg(e), a = tg(), i = ng(), c = Os({
    resolver: Ds(Ny),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "FileText",
      default_url_pattern: "/{slug}",
      is_commentable: !1,
      is_categorizable: !1,
      is_taggable: !1,
      is_revisioned: !0
    }
  });
  Xr(() => {
    if (r?.data && n) {
      const f = r.data;
      c.reset({
        name: f.name || "",
        slug: f.slug || "",
        description: f.description || "",
        icon: f.icon || "FileText",
        default_url_pattern: f.default_url_pattern || "/{slug}",
        is_commentable: f.is_commentable || !1,
        is_categorizable: f.is_categorizable || !1,
        is_taggable: f.is_taggable || !1,
        is_revisioned: f.is_revisioned || !0
      });
    }
  }, [r, n, c]);
  const d = async (f) => {
    try {
      n && e ? await i.mutateAsync({
        uuid: e,
        input: f
      }) : await a.mutateAsync(f), t("/admin/cms/content-types");
    } catch (v) {
      console.error("Form submission error:", v);
    }
  }, l = (f) => f.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""), u = (f) => {
    c.setValue("name", f), n || c.setValue("slug", l(f));
  };
  return s && n ? /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ o(_e, { className: "h-8 w-48" }),
    /* @__PURE__ */ h(Me, { children: [
      /* @__PURE__ */ o(Le, { children: /* @__PURE__ */ o(_e, { className: "h-6 w-32" }) }),
      /* @__PURE__ */ o(ke, { className: "space-y-4", children: [...Array(8)].map((f, v) => /* @__PURE__ */ o(_e, { className: "h-10 w-full" }, v)) })
    ] })
  ] }) : /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ h("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ o(
        oe,
        {
          variant: "ghost",
          size: "icon",
          onClick: () => t("/admin/cms/content-types"),
          children: /* @__PURE__ */ o(ic, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ h("div", { children: [
        /* @__PURE__ */ o("h1", { className: "text-3xl font-bold tracking-tight", children: n ? "Edit Content Type" : "New Content Type" }),
        /* @__PURE__ */ o("p", { className: "text-muted-foreground mt-1", children: n ? "Update the content type configuration" : "Create a new content type for your CMS" })
      ] })
    ] }),
    /* @__PURE__ */ o(Vs, { ...c, children: /* @__PURE__ */ h("form", { onSubmit: c.handleSubmit(d), className: "space-y-6", children: [
      /* @__PURE__ */ h(Me, { children: [
        /* @__PURE__ */ h(Le, { children: [
          /* @__PURE__ */ o(Ke, { children: "Basic Information" }),
          /* @__PURE__ */ o(qa, { children: "Configure the basic settings for this content type" })
        ] }),
        /* @__PURE__ */ h(ke, { className: "space-y-4", children: [
          /* @__PURE__ */ o(
            he,
            {
              control: c.control,
              name: "name",
              render: ({ field: f }) => /* @__PURE__ */ h(de, { children: [
                /* @__PURE__ */ o(ve, { children: "Name *" }),
                /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                  De,
                  {
                    placeholder: "e.g., Blog Post, News Article",
                    ...f,
                    onChange: (v) => u(v.target.value)
                  }
                ) }),
                /* @__PURE__ */ o(Te, { children: "Display name for this content type" }),
                /* @__PURE__ */ o(Oe, {})
              ] })
            }
          ),
          /* @__PURE__ */ o(
            he,
            {
              control: c.control,
              name: "slug",
              render: ({ field: f }) => /* @__PURE__ */ h(de, { children: [
                /* @__PURE__ */ o(ve, { children: "Slug *" }),
                /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                  De,
                  {
                    placeholder: "blog-post",
                    ...f,
                    disabled: n
                  }
                ) }),
                /* @__PURE__ */ o(Te, { children: "URL-friendly identifier (cannot be changed after creation)" }),
                /* @__PURE__ */ o(Oe, {})
              ] })
            }
          ),
          /* @__PURE__ */ o(
            he,
            {
              control: c.control,
              name: "description",
              render: ({ field: f }) => /* @__PURE__ */ h(de, { children: [
                /* @__PURE__ */ o(ve, { children: "Description" }),
                /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                  kn,
                  {
                    placeholder: "Brief description of this content type",
                    ...f,
                    rows: 3
                  }
                ) }),
                /* @__PURE__ */ o(Te, { children: "Optional description to help identify this content type" }),
                /* @__PURE__ */ o(Oe, {})
              ] })
            }
          ),
          /* @__PURE__ */ o(
            he,
            {
              control: c.control,
              name: "icon",
              render: ({ field: f }) => /* @__PURE__ */ h(de, { children: [
                /* @__PURE__ */ o(ve, { children: "Icon" }),
                /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(De, { placeholder: "FileText", ...f }) }),
                /* @__PURE__ */ o(Te, { children: "Lucide icon name for visual identification" }),
                /* @__PURE__ */ o(Oe, {})
              ] })
            }
          ),
          /* @__PURE__ */ o(
            he,
            {
              control: c.control,
              name: "default_url_pattern",
              render: ({ field: f }) => /* @__PURE__ */ h(de, { children: [
                /* @__PURE__ */ o(ve, { children: "Default URL Pattern" }),
                /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(De, { placeholder: "/{slug}", ...f }) }),
                /* @__PURE__ */ h(Te, { children: [
                  "Default URL pattern for content of this type. Use ",
                  "{slug}",
                  " as placeholder"
                ] }),
                /* @__PURE__ */ o(Oe, {})
              ] })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ h(Me, { children: [
        /* @__PURE__ */ h(Le, { children: [
          /* @__PURE__ */ o(Ke, { children: "Features" }),
          /* @__PURE__ */ o(qa, { children: "Enable or disable features for this content type" })
        ] }),
        /* @__PURE__ */ h(ke, { className: "space-y-4", children: [
          /* @__PURE__ */ o(
            he,
            {
              control: c.control,
              name: "is_commentable",
              render: ({ field: f }) => /* @__PURE__ */ h(de, { className: "flex items-center justify-between rounded-lg border p-4", children: [
                /* @__PURE__ */ h("div", { className: "space-y-0.5", children: [
                  /* @__PURE__ */ o(ve, { className: "text-base", children: "Comments" }),
                  /* @__PURE__ */ o(Te, { children: "Allow users to comment on content" })
                ] }),
                /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                  Vt,
                  {
                    checked: f.value,
                    onCheckedChange: f.onChange
                  }
                ) })
              ] })
            }
          ),
          /* @__PURE__ */ o(
            he,
            {
              control: c.control,
              name: "is_categorizable",
              render: ({ field: f }) => /* @__PURE__ */ h(de, { className: "flex items-center justify-between rounded-lg border p-4", children: [
                /* @__PURE__ */ h("div", { className: "space-y-0.5", children: [
                  /* @__PURE__ */ o(ve, { className: "text-base", children: "Categories" }),
                  /* @__PURE__ */ o(Te, { children: "Organize content with categories" })
                ] }),
                /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                  Vt,
                  {
                    checked: f.value,
                    onCheckedChange: f.onChange
                  }
                ) })
              ] })
            }
          ),
          /* @__PURE__ */ o(
            he,
            {
              control: c.control,
              name: "is_taggable",
              render: ({ field: f }) => /* @__PURE__ */ h(de, { className: "flex items-center justify-between rounded-lg border p-4", children: [
                /* @__PURE__ */ h("div", { className: "space-y-0.5", children: [
                  /* @__PURE__ */ o(ve, { className: "text-base", children: "Tags" }),
                  /* @__PURE__ */ o(Te, { children: "Add tags to content for better organization" })
                ] }),
                /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                  Vt,
                  {
                    checked: f.value,
                    onCheckedChange: f.onChange
                  }
                ) })
              ] })
            }
          ),
          /* @__PURE__ */ o(
            he,
            {
              control: c.control,
              name: "is_revisioned",
              render: ({ field: f }) => /* @__PURE__ */ h(de, { className: "flex items-center justify-between rounded-lg border p-4", children: [
                /* @__PURE__ */ h("div", { className: "space-y-0.5", children: [
                  /* @__PURE__ */ o(ve, { className: "text-base", children: "Revisions" }),
                  /* @__PURE__ */ o(Te, { children: "Keep track of content changes with version history" })
                ] }),
                /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                  Vt,
                  {
                    checked: f.value,
                    onCheckedChange: f.onChange
                  }
                ) })
              ] })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ h("div", { className: "flex items-center justify-end gap-4", children: [
        /* @__PURE__ */ o(
          oe,
          {
            type: "button",
            variant: "outline",
            onClick: () => t("/admin/cms/content-types"),
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ h(
          oe,
          {
            type: "submit",
            disabled: a.isPending || i.isPending,
            children: [
              /* @__PURE__ */ o(cc, { className: "h-4 w-4 mr-2" }),
              n ? "Update" : "Create",
              " Content Type"
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
const Ty = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Ey
}, Symbol.toStringTag, { value: "Module" }));
function _y() {
  const e = nr(), { filters: t, setFilters: n } = Zc(), { data: r, isLoading: s } = ag(t), a = dg(), i = Jc(), c = ug(), d = fg(), l = r?.data || [], u = (C) => {
    n({ search: C });
  }, f = (C) => {
    n({ status: C === "all" ? void 0 : C });
  }, v = (C) => {
    i.mutate({ uuid: C });
  }, w = (C) => {
    c.mutate(C);
  }, g = (C) => {
    d.mutate(C);
  }, p = (C) => {
    confirm("Are you sure you want to delete this content? This action cannot be undone.") && a.mutate(C);
  }, y = (C) => {
    const S = {
      published: { variant: "default", label: "Published" },
      draft: { variant: "secondary", label: "Draft" },
      scheduled: { variant: "outline", label: "Scheduled" },
      archived: { variant: "destructive", label: "Archived" }
    };
    return S[C] || S.draft;
  };
  return s ? /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ o(_e, { className: "h-8 w-48" }),
      /* @__PURE__ */ o(_e, { className: "h-10 w-32" })
    ] }),
    /* @__PURE__ */ o("div", { className: "space-y-3", children: [...Array(8)].map((C, S) => /* @__PURE__ */ o(_e, { className: "h-20 w-full" }, S)) })
  ] }) : /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ h("div", { children: [
        /* @__PURE__ */ o("h1", { className: "text-3xl font-bold tracking-tight", children: "Contents" }),
        /* @__PURE__ */ o("p", { className: "text-muted-foreground mt-1", children: "Manage all your CMS contents in one place" })
      ] }),
      /* @__PURE__ */ h(oe, { onClick: () => e("/admin/cms/contents/create"), children: [
        /* @__PURE__ */ o(Pn, { className: "h-4 w-4 mr-2" }),
        "New Content"
      ] })
    ] }),
    /* @__PURE__ */ h(Me, { children: [
      /* @__PURE__ */ o(Le, { className: "border-b", children: /* @__PURE__ */ h("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [
        /* @__PURE__ */ h(Ke, { children: [
          "All Contents (",
          l.length,
          ")"
        ] }),
        /* @__PURE__ */ h("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto", children: [
          /* @__PURE__ */ h("div", { className: "relative flex-1 sm:w-64", children: [
            /* @__PURE__ */ o(Mn, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ o(
              De,
              {
                placeholder: "Search contents...",
                className: "pl-9",
                value: t.search || "",
                onChange: (C) => u(C.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ h(no, { value: t.status || "all", onValueChange: f, children: [
            /* @__PURE__ */ o(ro, { className: "w-full sm:w-[140px]", children: /* @__PURE__ */ o(oo, { placeholder: "Status" }) }),
            /* @__PURE__ */ h(so, { children: [
              /* @__PURE__ */ o(vt, { value: "all", children: "All Status" }),
              /* @__PURE__ */ o(vt, { value: "draft", children: "Draft" }),
              /* @__PURE__ */ o(vt, { value: "published", children: "Published" }),
              /* @__PURE__ */ o(vt, { value: "scheduled", children: "Scheduled" }),
              /* @__PURE__ */ o(vt, { value: "archived", children: "Archived" })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ o(ke, { className: "p-0", children: l.length === 0 ? /* @__PURE__ */ h("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ h("div", { className: "text-muted-foreground mb-4", children: [
          /* @__PURE__ */ o(Jr, { className: "h-12 w-12 mx-auto mb-3 opacity-30" }),
          /* @__PURE__ */ o("p", { className: "text-lg font-medium", children: "No contents found" }),
          /* @__PURE__ */ o("p", { className: "text-sm", children: "Create your first content to get started" })
        ] }),
        /* @__PURE__ */ h(oe, { onClick: () => e("/admin/cms/contents/create"), children: [
          /* @__PURE__ */ o(Pn, { className: "h-4 w-4 mr-2" }),
          "Create Content"
        ] })
      ] }) : /* @__PURE__ */ o("div", { className: "overflow-x-auto", children: /* @__PURE__ */ h(Zr, { children: [
        /* @__PURE__ */ o(eo, { children: /* @__PURE__ */ h(Gt, { children: [
          /* @__PURE__ */ o(Ce, { className: "w-[40%]", children: "Title" }),
          /* @__PURE__ */ o(Ce, { children: "Type" }),
          /* @__PURE__ */ o(Ce, { children: "Author" }),
          /* @__PURE__ */ o(Ce, { children: "Status" }),
          /* @__PURE__ */ o(Ce, { children: "Date" }),
          /* @__PURE__ */ o(Ce, { className: "text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ o(to, { children: l.map((C) => {
          const S = y(C.status);
          return /* @__PURE__ */ h(Gt, { children: [
            /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ h("div", { children: [
              /* @__PURE__ */ o("p", { className: "font-medium", children: C.title }),
              C.excerpt && /* @__PURE__ */ o("p", { className: "text-sm text-muted-foreground line-clamp-1", children: C.excerpt })
            ] }) }),
            /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ o("span", { className: "text-sm text-muted-foreground", children: C.content_type?.display_name || "Unknown" }) }),
            /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ o("span", { className: "text-sm text-muted-foreground", children: C.author?.name || "Unknown" }) }),
            /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ o(un, { variant: S.variant, children: S.label }) }),
            /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ o("span", { className: "text-sm text-muted-foreground", children: C.published_at ? Xn(ja(C.published_at), { addSuffix: !0 }) : Xn(ja(C.created_at), { addSuffix: !0 }) }) }),
            /* @__PURE__ */ o(Se, { className: "text-right", children: /* @__PURE__ */ h(Ur, { children: [
              /* @__PURE__ */ o(Br, { asChild: !0, children: /* @__PURE__ */ o(oe, { variant: "ghost", size: "sm", children: /* @__PURE__ */ o(Fr, { className: "h-4 w-4" }) }) }),
              /* @__PURE__ */ h(zr, { align: "end", children: [
                /* @__PURE__ */ h(Be, { onClick: () => e(`/admin/cms/contents/${C.uuid}/edit`), children: [
                  /* @__PURE__ */ o(Lr, { className: "h-4 w-4 mr-2" }),
                  "Edit"
                ] }),
                C.status === "published" ? /* @__PURE__ */ h(Be, { onClick: () => w(C.uuid), children: [
                  /* @__PURE__ */ o(Ft, { className: "h-4 w-4 mr-2" }),
                  "Unpublish"
                ] }) : /* @__PURE__ */ h(Be, { onClick: () => v(C.uuid), children: [
                  /* @__PURE__ */ o(Ft, { className: "h-4 w-4 mr-2" }),
                  "Publish"
                ] }),
                C.status !== "archived" && /* @__PURE__ */ h(Be, { onClick: () => g(C.uuid), children: [
                  /* @__PURE__ */ o(fp, { className: "h-4 w-4 mr-2" }),
                  "Archive"
                ] }),
                /* @__PURE__ */ h(
                  Be,
                  {
                    onClick: () => p(C.uuid),
                    className: "text-destructive",
                    children: [
                      /* @__PURE__ */ o($r, { className: "h-4 w-4 mr-2" }),
                      "Delete"
                    ]
                  }
                )
              ] })
            ] }) })
          ] }, C.uuid);
        }) })
      ] }) }) })
    ] })
  ] });
}
const Ry = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _y
}, Symbol.toStringTag, { value: "Module" })), Ay = cl(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:animate-shine",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
), J = m.forwardRef(
  ({ className: e, variant: t, size: n, asChild: r = !1, ...s }, a) => /* @__PURE__ */ o(r ? bc : "button", { className: te(Ay({ variant: t, size: n, className: e })), ref: a, ...s })
);
J.displayName = "Button";
var Py = m[" useId ".trim().toString()] || (() => {
}), My = 0;
function Ct(e) {
  const [t, n] = m.useState(Py());
  return Ie(() => {
    n((r) => r ?? String(My++));
  }, [e]), t ? `radix-${t}` : "";
}
function lt(e) {
  const t = m.useRef(e);
  return m.useEffect(() => {
    t.current = e;
  }), m.useMemo(() => (...n) => t.current?.(...n), []);
}
function ky(e, t = globalThis?.document) {
  const n = lt(e);
  m.useEffect(() => {
    const r = (s) => {
      s.key === "Escape" && n(s);
    };
    return t.addEventListener("keydown", r, { capture: !0 }), () => t.removeEventListener("keydown", r, { capture: !0 });
  }, [n, t]);
}
var Iy = "DismissableLayer", hs = "dismissableLayer.update", Oy = "dismissableLayer.pointerDownOutside", Dy = "dismissableLayer.focusOutside", _i, bl = m.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), lr = m.forwardRef(
  (e, t) => {
    const {
      disableOutsidePointerEvents: n = !1,
      onEscapeKeyDown: r,
      onPointerDownOutside: s,
      onFocusOutside: a,
      onInteractOutside: i,
      onDismiss: c,
      ...d
    } = e, l = m.useContext(bl), [u, f] = m.useState(null), v = u?.ownerDocument ?? globalThis?.document, [, w] = m.useState({}), g = se(t, (T) => f(T)), p = Array.from(l.layers), [y] = [...l.layersWithOutsidePointerEventsDisabled].slice(-1), C = p.indexOf(y), S = u ? p.indexOf(u) : -1, b = l.layersWithOutsidePointerEventsDisabled.size > 0, x = S >= C, E = $y((T) => {
      const P = T.target, B = [...l.branches].some((z) => z.contains(P));
      !x || B || (s?.(T), i?.(T), T.defaultPrevented || c?.());
    }, v), k = Uy((T) => {
      const P = T.target;
      [...l.branches].some((z) => z.contains(P)) || (a?.(T), i?.(T), T.defaultPrevented || c?.());
    }, v);
    return ky((T) => {
      S === l.layers.size - 1 && (r?.(T), !T.defaultPrevented && c && (T.preventDefault(), c()));
    }, v), m.useEffect(() => {
      if (u)
        return n && (l.layersWithOutsidePointerEventsDisabled.size === 0 && (_i = v.body.style.pointerEvents, v.body.style.pointerEvents = "none"), l.layersWithOutsidePointerEventsDisabled.add(u)), l.layers.add(u), Ri(), () => {
          n && l.layersWithOutsidePointerEventsDisabled.size === 1 && (v.body.style.pointerEvents = _i);
        };
    }, [u, v, n, l]), m.useEffect(() => () => {
      u && (l.layers.delete(u), l.layersWithOutsidePointerEventsDisabled.delete(u), Ri());
    }, [u, l]), m.useEffect(() => {
      const T = () => w({});
      return document.addEventListener(hs, T), () => document.removeEventListener(hs, T);
    }, []), /* @__PURE__ */ o(
      Z.div,
      {
        ...d,
        ref: g,
        style: {
          pointerEvents: b ? x ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: U(e.onFocusCapture, k.onFocusCapture),
        onBlurCapture: U(e.onBlurCapture, k.onBlurCapture),
        onPointerDownCapture: U(
          e.onPointerDownCapture,
          E.onPointerDownCapture
        )
      }
    );
  }
);
lr.displayName = Iy;
var Fy = "DismissableLayerBranch", Ly = m.forwardRef((e, t) => {
  const n = m.useContext(bl), r = m.useRef(null), s = se(t, r);
  return m.useEffect(() => {
    const a = r.current;
    if (a)
      return n.branches.add(a), () => {
        n.branches.delete(a);
      };
  }, [n.branches]), /* @__PURE__ */ o(Z.div, { ...e, ref: s });
});
Ly.displayName = Fy;
function $y(e, t = globalThis?.document) {
  const n = lt(e), r = m.useRef(!1), s = m.useRef(() => {
  });
  return m.useEffect(() => {
    const a = (c) => {
      if (c.target && !r.current) {
        let d = function() {
          Cl(
            Oy,
            n,
            l,
            { discrete: !0 }
          );
        };
        const l = { originalEvent: c };
        c.pointerType === "touch" ? (t.removeEventListener("click", s.current), s.current = d, t.addEventListener("click", s.current, { once: !0 })) : d();
      } else
        t.removeEventListener("click", s.current);
      r.current = !1;
    }, i = window.setTimeout(() => {
      t.addEventListener("pointerdown", a);
    }, 0);
    return () => {
      window.clearTimeout(i), t.removeEventListener("pointerdown", a), t.removeEventListener("click", s.current);
    };
  }, [t, n]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => r.current = !0
  };
}
function Uy(e, t = globalThis?.document) {
  const n = lt(e), r = m.useRef(!1);
  return m.useEffect(() => {
    const s = (a) => {
      a.target && !r.current && Cl(Dy, n, { originalEvent: a }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", s), () => t.removeEventListener("focusin", s);
  }, [t, n]), {
    onFocusCapture: () => r.current = !0,
    onBlurCapture: () => r.current = !1
  };
}
function Ri() {
  const e = new CustomEvent(hs);
  document.dispatchEvent(e);
}
function Cl(e, t, n, { discrete: r }) {
  const s = n.originalEvent.target, a = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  t && s.addEventListener(e, t, { once: !0 }), r ? pl(s, a) : s.dispatchEvent(a);
}
var Vo = "focusScope.autoFocusOnMount", Go = "focusScope.autoFocusOnUnmount", Ai = { bubbles: !1, cancelable: !0 }, By = "FocusScope", dr = m.forwardRef((e, t) => {
  const {
    loop: n = !1,
    trapped: r = !1,
    onMountAutoFocus: s,
    onUnmountAutoFocus: a,
    ...i
  } = e, [c, d] = m.useState(null), l = lt(s), u = lt(a), f = m.useRef(null), v = se(t, (p) => d(p)), w = m.useRef({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  m.useEffect(() => {
    if (r) {
      let p = function(b) {
        if (w.paused || !c) return;
        const x = b.target;
        c.contains(x) ? f.current = x : jt(f.current, { select: !0 });
      }, y = function(b) {
        if (w.paused || !c) return;
        const x = b.relatedTarget;
        x !== null && (c.contains(x) || jt(f.current, { select: !0 }));
      }, C = function(b) {
        if (document.activeElement === document.body)
          for (const E of b)
            E.removedNodes.length > 0 && jt(c);
      };
      document.addEventListener("focusin", p), document.addEventListener("focusout", y);
      const S = new MutationObserver(C);
      return c && S.observe(c, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", p), document.removeEventListener("focusout", y), S.disconnect();
      };
    }
  }, [r, c, w.paused]), m.useEffect(() => {
    if (c) {
      Mi.add(w);
      const p = document.activeElement;
      if (!c.contains(p)) {
        const C = new CustomEvent(Vo, Ai);
        c.addEventListener(Vo, l), c.dispatchEvent(C), C.defaultPrevented || (zy(Ky(Sl(c)), { select: !0 }), document.activeElement === p && jt(c));
      }
      return () => {
        c.removeEventListener(Vo, l), setTimeout(() => {
          const C = new CustomEvent(Go, Ai);
          c.addEventListener(Go, u), c.dispatchEvent(C), C.defaultPrevented || jt(p ?? document.body, { select: !0 }), c.removeEventListener(Go, u), Mi.remove(w);
        }, 0);
      };
    }
  }, [c, l, u, w]);
  const g = m.useCallback(
    (p) => {
      if (!n && !r || w.paused) return;
      const y = p.key === "Tab" && !p.altKey && !p.ctrlKey && !p.metaKey, C = document.activeElement;
      if (y && C) {
        const S = p.currentTarget, [b, x] = qy(S);
        b && x ? !p.shiftKey && C === x ? (p.preventDefault(), n && jt(b, { select: !0 })) : p.shiftKey && C === b && (p.preventDefault(), n && jt(x, { select: !0 })) : C === S && p.preventDefault();
      }
    },
    [n, r, w.paused]
  );
  return /* @__PURE__ */ o(Z.div, { tabIndex: -1, ...i, ref: v, onKeyDown: g });
});
dr.displayName = By;
function zy(e, { select: t = !1 } = {}) {
  const n = document.activeElement;
  for (const r of e)
    if (jt(r, { select: t }), document.activeElement !== n) return;
}
function qy(e) {
  const t = Sl(e), n = Pi(t, e), r = Pi(t.reverse(), e);
  return [n, r];
}
function Sl(e) {
  const t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (r) => {
      const s = r.tagName === "INPUT" && r.type === "hidden";
      return r.disabled || r.hidden || s ? NodeFilter.FILTER_SKIP : r.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function Pi(e, t) {
  for (const n of e)
    if (!Hy(n, { upTo: t })) return n;
}
function Hy(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function jy(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function jt(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const n = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== n && jy(e) && t && e.select();
  }
}
var Mi = Wy();
function Wy() {
  let e = [];
  return {
    add(t) {
      const n = e[0];
      t !== n && n?.pause(), e = ki(e, t), e.unshift(t);
    },
    remove(t) {
      e = ki(e, t), e[0]?.resume();
    }
  };
}
function ki(e, t) {
  const n = [...e], r = n.indexOf(t);
  return r !== -1 && n.splice(r, 1), n;
}
function Ky(e) {
  return e.filter((t) => t.tagName !== "A");
}
var Vy = "Portal", ur = m.forwardRef((e, t) => {
  const { container: n, ...r } = e, [s, a] = m.useState(!1);
  Ie(() => a(!0), []);
  const i = n || s && globalThis?.document?.body;
  return i ? Zp.createPortal(/* @__PURE__ */ o(Z.div, { ...r, ref: t }), i) : null;
});
ur.displayName = Vy;
function Gy(e, t) {
  return m.useReducer((n, r) => t[n][r] ?? n, e);
}
var _t = (e) => {
  const { present: t, children: n } = e, r = Qy(t), s = typeof n == "function" ? n({ present: r.isPresent }) : m.Children.only(n), a = se(r.ref, Yy(s));
  return typeof n == "function" || r.isPresent ? m.cloneElement(s, { ref: a }) : null;
};
_t.displayName = "Presence";
function Qy(e) {
  const [t, n] = m.useState(), r = m.useRef(null), s = m.useRef(e), a = m.useRef("none"), i = e ? "mounted" : "unmounted", [c, d] = Gy(i, {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  return m.useEffect(() => {
    const l = Nr(r.current);
    a.current = c === "mounted" ? l : "none";
  }, [c]), Ie(() => {
    const l = r.current, u = s.current;
    if (u !== e) {
      const v = a.current, w = Nr(l);
      e ? d("MOUNT") : w === "none" || l?.display === "none" ? d("UNMOUNT") : d(u && v !== w ? "ANIMATION_OUT" : "UNMOUNT"), s.current = e;
    }
  }, [e, d]), Ie(() => {
    if (t) {
      let l;
      const u = t.ownerDocument.defaultView ?? window, f = (w) => {
        const p = Nr(r.current).includes(CSS.escape(w.animationName));
        if (w.target === t && p && (d("ANIMATION_END"), !s.current)) {
          const y = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", l = u.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = y);
          });
        }
      }, v = (w) => {
        w.target === t && (a.current = Nr(r.current));
      };
      return t.addEventListener("animationstart", v), t.addEventListener("animationcancel", f), t.addEventListener("animationend", f), () => {
        u.clearTimeout(l), t.removeEventListener("animationstart", v), t.removeEventListener("animationcancel", f), t.removeEventListener("animationend", f);
      };
    } else
      d("ANIMATION_END");
  }, [t, d]), {
    isPresent: ["mounted", "unmountSuspended"].includes(c),
    ref: m.useCallback((l) => {
      r.current = l ? getComputedStyle(l) : null, n(l);
    }, [])
  };
}
function Nr(e) {
  return e?.animationName || "none";
}
function Yy(e) {
  let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
var Qo = 0;
function Co() {
  m.useEffect(() => {
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? Ii()), document.body.insertAdjacentElement("beforeend", e[1] ?? Ii()), Qo++, () => {
      Qo === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), Qo--;
    };
  }, []);
}
function Ii() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var wt = function() {
  return wt = Object.assign || function(t) {
    for (var n, r = 1, s = arguments.length; r < s; r++) {
      n = arguments[r];
      for (var a in n) Object.prototype.hasOwnProperty.call(n, a) && (t[a] = n[a]);
    }
    return t;
  }, wt.apply(this, arguments);
};
function xl(e, t) {
  var n = {};
  for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var s = 0, r = Object.getOwnPropertySymbols(e); s < r.length; s++)
      t.indexOf(r[s]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[s]) && (n[r[s]] = e[r[s]]);
  return n;
}
function Xy(e, t, n) {
  if (n || arguments.length === 2) for (var r = 0, s = t.length, a; r < s; r++)
    (a || !(r in t)) && (a || (a = Array.prototype.slice.call(t, 0, r)), a[r] = t[r]);
  return e.concat(a || Array.prototype.slice.call(t));
}
var Ir = "right-scroll-bar-position", Or = "width-before-scroll-bar", Jy = "with-scroll-bars-hidden", Zy = "--removed-body-scroll-bar-size";
function Yo(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function ev(e, t) {
  var n = W(function() {
    return {
      // value
      value: e,
      // last callback
      callback: t,
      // "memoized" public interface
      facade: {
        get current() {
          return n.value;
        },
        set current(r) {
          var s = n.value;
          s !== r && (n.value = r, n.callback(r, s));
        }
      }
    };
  })[0];
  return n.callback = t, n.facade;
}
var tv = typeof window < "u" ? m.useLayoutEffect : m.useEffect, Oi = /* @__PURE__ */ new WeakMap();
function nv(e, t) {
  var n = ev(null, function(r) {
    return e.forEach(function(s) {
      return Yo(s, r);
    });
  });
  return tv(function() {
    var r = Oi.get(n);
    if (r) {
      var s = new Set(r), a = new Set(e), i = n.current;
      s.forEach(function(c) {
        a.has(c) || Yo(c, null);
      }), a.forEach(function(c) {
        s.has(c) || Yo(c, i);
      });
    }
    Oi.set(n, e);
  }, [e]), n;
}
function rv(e) {
  return e;
}
function ov(e, t) {
  t === void 0 && (t = rv);
  var n = [], r = !1, s = {
    read: function() {
      if (r)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return n.length ? n[n.length - 1] : e;
    },
    useMedium: function(a) {
      var i = t(a, r);
      return n.push(i), function() {
        n = n.filter(function(c) {
          return c !== i;
        });
      };
    },
    assignSyncMedium: function(a) {
      for (r = !0; n.length; ) {
        var i = n;
        n = [], i.forEach(a);
      }
      n = {
        push: function(c) {
          return a(c);
        },
        filter: function() {
          return n;
        }
      };
    },
    assignMedium: function(a) {
      r = !0;
      var i = [];
      if (n.length) {
        var c = n;
        n = [], c.forEach(a), i = n;
      }
      var d = function() {
        var u = i;
        i = [], u.forEach(a);
      }, l = function() {
        return Promise.resolve().then(d);
      };
      l(), n = {
        push: function(u) {
          i.push(u), l();
        },
        filter: function(u) {
          return i = i.filter(u), n;
        }
      };
    }
  };
  return s;
}
function sv(e) {
  e === void 0 && (e = {});
  var t = ov(null);
  return t.options = wt({ async: !0, ssr: !1 }, e), t;
}
var Nl = function(e) {
  var t = e.sideCar, n = xl(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var r = t.read();
  if (!r)
    throw new Error("Sidecar medium not found");
  return m.createElement(r, wt({}, n));
};
Nl.isSideCarExport = !0;
function av(e, t) {
  return e.useMedium(t), Nl;
}
var El = sv(), Xo = function() {
}, So = m.forwardRef(function(e, t) {
  var n = m.useRef(null), r = m.useState({
    onScrollCapture: Xo,
    onWheelCapture: Xo,
    onTouchMoveCapture: Xo
  }), s = r[0], a = r[1], i = e.forwardProps, c = e.children, d = e.className, l = e.removeScrollBar, u = e.enabled, f = e.shards, v = e.sideCar, w = e.noRelative, g = e.noIsolation, p = e.inert, y = e.allowPinchZoom, C = e.as, S = C === void 0 ? "div" : C, b = e.gapMode, x = xl(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), E = v, k = nv([n, t]), T = wt(wt({}, x), s);
  return m.createElement(
    m.Fragment,
    null,
    u && m.createElement(E, { sideCar: El, removeScrollBar: l, shards: f, noRelative: w, noIsolation: g, inert: p, setCallbacks: a, allowPinchZoom: !!y, lockRef: n, gapMode: b }),
    i ? m.cloneElement(m.Children.only(c), wt(wt({}, T), { ref: k })) : m.createElement(S, wt({}, T, { className: d, ref: k }), c)
  );
});
So.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
So.classNames = {
  fullWidth: Or,
  zeroRight: Ir
};
var iv = function() {
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function cv() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = iv();
  return t && e.setAttribute("nonce", t), e;
}
function lv(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function dv(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var uv = function() {
  var e = 0, t = null;
  return {
    add: function(n) {
      e == 0 && (t = cv()) && (lv(t, n), dv(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, fv = function() {
  var e = uv();
  return function(t, n) {
    m.useEffect(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && n]);
  };
}, Tl = function() {
  var e = fv(), t = function(n) {
    var r = n.styles, s = n.dynamic;
    return e(r, s), null;
  };
  return t;
}, pv = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, Jo = function(e) {
  return parseInt(e || "", 10) || 0;
}, mv = function(e) {
  var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], s = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [Jo(n), Jo(r), Jo(s)];
}, hv = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return pv;
  var t = mv(e), n = document.documentElement.clientWidth, r = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, r - n + t[2] - t[0])
  };
}, gv = Tl(), Rn = "data-scroll-locked", yv = function(e, t, n, r) {
  var s = e.left, a = e.top, i = e.right, c = e.gap;
  return n === void 0 && (n = "margin"), `
  .`.concat(Jy, ` {
   overflow: hidden `).concat(r, `;
   padding-right: `).concat(c, "px ").concat(r, `;
  }
  body[`).concat(Rn, `] {
    overflow: hidden `).concat(r, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(r, ";"),
    n === "margin" && `
    padding-left: `.concat(s, `px;
    padding-top: `).concat(a, `px;
    padding-right: `).concat(i, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(c, "px ").concat(r, `;
    `),
    n === "padding" && "padding-right: ".concat(c, "px ").concat(r, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(Ir, ` {
    right: `).concat(c, "px ").concat(r, `;
  }
  
  .`).concat(Or, ` {
    margin-right: `).concat(c, "px ").concat(r, `;
  }
  
  .`).concat(Ir, " .").concat(Ir, ` {
    right: 0 `).concat(r, `;
  }
  
  .`).concat(Or, " .").concat(Or, ` {
    margin-right: 0 `).concat(r, `;
  }
  
  body[`).concat(Rn, `] {
    `).concat(Zy, ": ").concat(c, `px;
  }
`);
}, Di = function() {
  var e = parseInt(document.body.getAttribute(Rn) || "0", 10);
  return isFinite(e) ? e : 0;
}, vv = function() {
  m.useEffect(function() {
    return document.body.setAttribute(Rn, (Di() + 1).toString()), function() {
      var e = Di() - 1;
      e <= 0 ? document.body.removeAttribute(Rn) : document.body.setAttribute(Rn, e.toString());
    };
  }, []);
}, wv = function(e) {
  var t = e.noRelative, n = e.noImportant, r = e.gapMode, s = r === void 0 ? "margin" : r;
  vv();
  var a = m.useMemo(function() {
    return hv(s);
  }, [s]);
  return m.createElement(gv, { styles: yv(a, !t, s, n ? "" : "!important") });
}, gs = !1;
if (typeof window < "u")
  try {
    var Er = Object.defineProperty({}, "passive", {
      get: function() {
        return gs = !0, !0;
      }
    });
    window.addEventListener("test", Er, Er), window.removeEventListener("test", Er, Er);
  } catch {
    gs = !1;
  }
var Sn = gs ? { passive: !1 } : !1, bv = function(e) {
  return e.tagName === "TEXTAREA";
}, _l = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var n = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    n[t] !== "hidden" && // contains scroll inside self
    !(n.overflowY === n.overflowX && !bv(e) && n[t] === "visible")
  );
}, Cv = function(e) {
  return _l(e, "overflowY");
}, Sv = function(e) {
  return _l(e, "overflowX");
}, Fi = function(e, t) {
  var n = t.ownerDocument, r = t;
  do {
    typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host);
    var s = Rl(e, r);
    if (s) {
      var a = Al(e, r), i = a[1], c = a[2];
      if (i > c)
        return !0;
    }
    r = r.parentNode;
  } while (r && r !== n.body);
  return !1;
}, xv = function(e) {
  var t = e.scrollTop, n = e.scrollHeight, r = e.clientHeight;
  return [
    t,
    n,
    r
  ];
}, Nv = function(e) {
  var t = e.scrollLeft, n = e.scrollWidth, r = e.clientWidth;
  return [
    t,
    n,
    r
  ];
}, Rl = function(e, t) {
  return e === "v" ? Cv(t) : Sv(t);
}, Al = function(e, t) {
  return e === "v" ? xv(t) : Nv(t);
}, Ev = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, Tv = function(e, t, n, r, s) {
  var a = Ev(e, window.getComputedStyle(t).direction), i = a * r, c = n.target, d = t.contains(c), l = !1, u = i > 0, f = 0, v = 0;
  do {
    if (!c)
      break;
    var w = Al(e, c), g = w[0], p = w[1], y = w[2], C = p - y - a * g;
    (g || C) && Rl(e, c) && (f += C, v += g);
    var S = c.parentNode;
    c = S && S.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? S.host : S;
  } while (
    // portaled content
    !d && c !== document.body || // self content
    d && (t.contains(c) || t === c)
  );
  return (u && Math.abs(f) < 1 || !u && Math.abs(v) < 1) && (l = !0), l;
}, Tr = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, Li = function(e) {
  return [e.deltaX, e.deltaY];
}, $i = function(e) {
  return e && "current" in e ? e.current : e;
}, _v = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, Rv = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, Av = 0, xn = [];
function Pv(e) {
  var t = m.useRef([]), n = m.useRef([0, 0]), r = m.useRef(), s = m.useState(Av++)[0], a = m.useState(Tl)[0], i = m.useRef(e);
  m.useEffect(function() {
    i.current = e;
  }, [e]), m.useEffect(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(s));
      var p = Xy([e.lockRef.current], (e.shards || []).map($i), !0).filter(Boolean);
      return p.forEach(function(y) {
        return y.classList.add("allow-interactivity-".concat(s));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(s)), p.forEach(function(y) {
          return y.classList.remove("allow-interactivity-".concat(s));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var c = m.useCallback(function(p, y) {
    if ("touches" in p && p.touches.length === 2 || p.type === "wheel" && p.ctrlKey)
      return !i.current.allowPinchZoom;
    var C = Tr(p), S = n.current, b = "deltaX" in p ? p.deltaX : S[0] - C[0], x = "deltaY" in p ? p.deltaY : S[1] - C[1], E, k = p.target, T = Math.abs(b) > Math.abs(x) ? "h" : "v";
    if ("touches" in p && T === "h" && k.type === "range")
      return !1;
    var P = window.getSelection(), B = P && P.anchorNode, z = B ? B === k || B.contains(k) : !1;
    if (z)
      return !1;
    var H = Fi(T, k);
    if (!H)
      return !0;
    if (H ? E = T : (E = T === "v" ? "h" : "v", H = Fi(T, k)), !H)
      return !1;
    if (!r.current && "changedTouches" in p && (b || x) && (r.current = E), !E)
      return !0;
    var I = r.current || E;
    return Tv(I, y, p, I === "h" ? b : x);
  }, []), d = m.useCallback(function(p) {
    var y = p;
    if (!(!xn.length || xn[xn.length - 1] !== a)) {
      var C = "deltaY" in y ? Li(y) : Tr(y), S = t.current.filter(function(E) {
        return E.name === y.type && (E.target === y.target || y.target === E.shadowParent) && _v(E.delta, C);
      })[0];
      if (S && S.should) {
        y.cancelable && y.preventDefault();
        return;
      }
      if (!S) {
        var b = (i.current.shards || []).map($i).filter(Boolean).filter(function(E) {
          return E.contains(y.target);
        }), x = b.length > 0 ? c(y, b[0]) : !i.current.noIsolation;
        x && y.cancelable && y.preventDefault();
      }
    }
  }, []), l = m.useCallback(function(p, y, C, S) {
    var b = { name: p, delta: y, target: C, should: S, shadowParent: Mv(C) };
    t.current.push(b), setTimeout(function() {
      t.current = t.current.filter(function(x) {
        return x !== b;
      });
    }, 1);
  }, []), u = m.useCallback(function(p) {
    n.current = Tr(p), r.current = void 0;
  }, []), f = m.useCallback(function(p) {
    l(p.type, Li(p), p.target, c(p, e.lockRef.current));
  }, []), v = m.useCallback(function(p) {
    l(p.type, Tr(p), p.target, c(p, e.lockRef.current));
  }, []);
  m.useEffect(function() {
    return xn.push(a), e.setCallbacks({
      onScrollCapture: f,
      onWheelCapture: f,
      onTouchMoveCapture: v
    }), document.addEventListener("wheel", d, Sn), document.addEventListener("touchmove", d, Sn), document.addEventListener("touchstart", u, Sn), function() {
      xn = xn.filter(function(p) {
        return p !== a;
      }), document.removeEventListener("wheel", d, Sn), document.removeEventListener("touchmove", d, Sn), document.removeEventListener("touchstart", u, Sn);
    };
  }, []);
  var w = e.removeScrollBar, g = e.inert;
  return m.createElement(
    m.Fragment,
    null,
    g ? m.createElement(a, { styles: Rv(s) }) : null,
    w ? m.createElement(wv, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function Mv(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const kv = av(El, Pv);
var fr = m.forwardRef(function(e, t) {
  return m.createElement(So, wt({}, e, { ref: t, sideCar: kv }));
});
fr.classNames = So.classNames;
var Iv = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, Nn = /* @__PURE__ */ new WeakMap(), _r = /* @__PURE__ */ new WeakMap(), Rr = {}, Zo = 0, Pl = function(e) {
  return e && (e.host || Pl(e.parentNode));
}, Ov = function(e, t) {
  return t.map(function(n) {
    if (e.contains(n))
      return n;
    var r = Pl(n);
    return r && e.contains(r) ? r : (console.error("aria-hidden", n, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(n) {
    return !!n;
  });
}, Dv = function(e, t, n, r) {
  var s = Ov(t, Array.isArray(e) ? e : [e]);
  Rr[n] || (Rr[n] = /* @__PURE__ */ new WeakMap());
  var a = Rr[n], i = [], c = /* @__PURE__ */ new Set(), d = new Set(s), l = function(f) {
    !f || c.has(f) || (c.add(f), l(f.parentNode));
  };
  s.forEach(l);
  var u = function(f) {
    !f || d.has(f) || Array.prototype.forEach.call(f.children, function(v) {
      if (c.has(v))
        u(v);
      else
        try {
          var w = v.getAttribute(r), g = w !== null && w !== "false", p = (Nn.get(v) || 0) + 1, y = (a.get(v) || 0) + 1;
          Nn.set(v, p), a.set(v, y), i.push(v), p === 1 && g && _r.set(v, !0), y === 1 && v.setAttribute(n, "true"), g || v.setAttribute(r, "true");
        } catch (C) {
          console.error("aria-hidden: cannot operate on ", v, C);
        }
    });
  };
  return u(t), c.clear(), Zo++, function() {
    i.forEach(function(f) {
      var v = Nn.get(f) - 1, w = a.get(f) - 1;
      Nn.set(f, v), a.set(f, w), v || (_r.has(f) || f.removeAttribute(r), _r.delete(f)), w || f.removeAttribute(n);
    }), Zo--, Zo || (Nn = /* @__PURE__ */ new WeakMap(), Nn = /* @__PURE__ */ new WeakMap(), _r = /* @__PURE__ */ new WeakMap(), Rr = {});
  };
}, xo = function(e, t, n) {
  n === void 0 && (n = "data-aria-hidden");
  var r = Array.from(Array.isArray(e) ? e : [e]), s = Iv(e);
  return s ? (r.push.apply(r, Array.from(s.querySelectorAll("[aria-live], script"))), Dv(r, s, n, "aria-hidden")) : function() {
    return null;
  };
}, No = "Dialog", [Ml] = Bt(No), [Fv, mt] = Ml(No), kl = (e) => {
  const {
    __scopeDialog: t,
    children: n,
    open: r,
    defaultOpen: s,
    onOpenChange: a,
    modal: i = !0
  } = e, c = m.useRef(null), d = m.useRef(null), [l, u] = pn({
    prop: r,
    defaultProp: s ?? !1,
    onChange: a,
    caller: No
  });
  return /* @__PURE__ */ o(
    Fv,
    {
      scope: t,
      triggerRef: c,
      contentRef: d,
      contentId: Ct(),
      titleId: Ct(),
      descriptionId: Ct(),
      open: l,
      onOpenChange: u,
      onOpenToggle: m.useCallback(() => u((f) => !f), [u]),
      modal: i,
      children: n
    }
  );
};
kl.displayName = No;
var Il = "DialogTrigger", Lv = m.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, s = mt(Il, n), a = se(t, s.triggerRef);
    return /* @__PURE__ */ o(
      Z.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": s.open,
        "aria-controls": s.contentId,
        "data-state": Xs(s.open),
        ...r,
        ref: a,
        onClick: U(e.onClick, s.onOpenToggle)
      }
    );
  }
);
Lv.displayName = Il;
var Qs = "DialogPortal", [$v, Ol] = Ml(Qs, {
  forceMount: void 0
}), Dl = (e) => {
  const { __scopeDialog: t, forceMount: n, children: r, container: s } = e, a = mt(Qs, t);
  return /* @__PURE__ */ o($v, { scope: t, forceMount: n, children: m.Children.map(r, (i) => /* @__PURE__ */ o(_t, { present: n || a.open, children: /* @__PURE__ */ o(ur, { asChild: !0, container: s, children: i }) })) });
};
Dl.displayName = Qs;
var Hr = "DialogOverlay", Fl = m.forwardRef(
  (e, t) => {
    const n = Ol(Hr, e.__scopeDialog), { forceMount: r = n.forceMount, ...s } = e, a = mt(Hr, e.__scopeDialog);
    return a.modal ? /* @__PURE__ */ o(_t, { present: r || a.open, children: /* @__PURE__ */ o(Bv, { ...s, ref: t }) }) : null;
  }
);
Fl.displayName = Hr;
var Uv = Lt("DialogOverlay.RemoveScroll"), Bv = m.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, s = mt(Hr, n);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ o(fr, { as: Uv, allowPinchZoom: !0, shards: [s.contentRef], children: /* @__PURE__ */ o(
        Z.div,
        {
          "data-state": Xs(s.open),
          ...r,
          ref: t,
          style: { pointerEvents: "auto", ...r.style }
        }
      ) })
    );
  }
), mn = "DialogContent", Ll = m.forwardRef(
  (e, t) => {
    const n = Ol(mn, e.__scopeDialog), { forceMount: r = n.forceMount, ...s } = e, a = mt(mn, e.__scopeDialog);
    return /* @__PURE__ */ o(_t, { present: r || a.open, children: a.modal ? /* @__PURE__ */ o(zv, { ...s, ref: t }) : /* @__PURE__ */ o(qv, { ...s, ref: t }) });
  }
);
Ll.displayName = mn;
var zv = m.forwardRef(
  (e, t) => {
    const n = mt(mn, e.__scopeDialog), r = m.useRef(null), s = se(t, n.contentRef, r);
    return m.useEffect(() => {
      const a = r.current;
      if (a) return xo(a);
    }, []), /* @__PURE__ */ o(
      $l,
      {
        ...e,
        ref: s,
        trapFocus: n.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: U(e.onCloseAutoFocus, (a) => {
          a.preventDefault(), n.triggerRef.current?.focus();
        }),
        onPointerDownOutside: U(e.onPointerDownOutside, (a) => {
          const i = a.detail.originalEvent, c = i.button === 0 && i.ctrlKey === !0;
          (i.button === 2 || c) && a.preventDefault();
        }),
        onFocusOutside: U(
          e.onFocusOutside,
          (a) => a.preventDefault()
        )
      }
    );
  }
), qv = m.forwardRef(
  (e, t) => {
    const n = mt(mn, e.__scopeDialog), r = m.useRef(!1), s = m.useRef(!1);
    return /* @__PURE__ */ o(
      $l,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (a) => {
          e.onCloseAutoFocus?.(a), a.defaultPrevented || (r.current || n.triggerRef.current?.focus(), a.preventDefault()), r.current = !1, s.current = !1;
        },
        onInteractOutside: (a) => {
          e.onInteractOutside?.(a), a.defaultPrevented || (r.current = !0, a.detail.originalEvent.type === "pointerdown" && (s.current = !0));
          const i = a.target;
          n.triggerRef.current?.contains(i) && a.preventDefault(), a.detail.originalEvent.type === "focusin" && s.current && a.preventDefault();
        }
      }
    );
  }
), $l = m.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: s, onCloseAutoFocus: a, ...i } = e, c = mt(mn, n), d = m.useRef(null), l = se(t, d);
    return Co(), /* @__PURE__ */ h(Dt, { children: [
      /* @__PURE__ */ o(
        dr,
        {
          asChild: !0,
          loop: !0,
          trapped: r,
          onMountAutoFocus: s,
          onUnmountAutoFocus: a,
          children: /* @__PURE__ */ o(
            lr,
            {
              role: "dialog",
              id: c.contentId,
              "aria-describedby": c.descriptionId,
              "aria-labelledby": c.titleId,
              "data-state": Xs(c.open),
              ...i,
              ref: l,
              onDismiss: () => c.onOpenChange(!1)
            }
          )
        }
      ),
      /* @__PURE__ */ h(Dt, { children: [
        /* @__PURE__ */ o(Hv, { titleId: c.titleId }),
        /* @__PURE__ */ o(Wv, { contentRef: d, descriptionId: c.descriptionId })
      ] })
    ] });
  }
), Ys = "DialogTitle", Ul = m.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, s = mt(Ys, n);
    return /* @__PURE__ */ o(Z.h2, { id: s.titleId, ...r, ref: t });
  }
);
Ul.displayName = Ys;
var Bl = "DialogDescription", zl = m.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, s = mt(Bl, n);
    return /* @__PURE__ */ o(Z.p, { id: s.descriptionId, ...r, ref: t });
  }
);
zl.displayName = Bl;
var ql = "DialogClose", Hl = m.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, s = mt(ql, n);
    return /* @__PURE__ */ o(
      Z.button,
      {
        type: "button",
        ...r,
        ref: t,
        onClick: U(e.onClick, () => s.onOpenChange(!1))
      }
    );
  }
);
Hl.displayName = ql;
function Xs(e) {
  return e ? "open" : "closed";
}
var jl = "DialogTitleWarning", [vN, Wl] = py(jl, {
  contentName: mn,
  titleName: Ys,
  docsSlug: "dialog"
}), Hv = ({ titleId: e }) => {
  const t = Wl(jl), n = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
  return m.useEffect(() => {
    e && (document.getElementById(e) || console.error(n));
  }, [n, e]), null;
}, jv = "DialogDescriptionWarning", Wv = ({ contentRef: e, descriptionId: t }) => {
  const r = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${Wl(jv).contentName}}.`;
  return m.useEffect(() => {
    const s = e.current?.getAttribute("aria-describedby");
    t && s && (document.getElementById(t) || console.warn(r));
  }, [r, e, t]), null;
}, Kv = kl, Vv = Dl, Kl = Fl, Vl = Ll, Gl = Ul, Ql = zl, Gv = Hl;
const yt = Kv, Qv = Vv, Yl = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(
  Kl,
  {
    ref: n,
    className: te(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      e
    ),
    ...t
  }
));
Yl.displayName = Kl.displayName;
const st = m.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ h(Qv, { children: [
  /* @__PURE__ */ o(Yl, {}),
  /* @__PURE__ */ h(
    Vl,
    {
      ref: r,
      className: te(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        e
      ),
      ...n,
      children: [
        t,
        /* @__PURE__ */ h(Gv, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none", children: [
          /* @__PURE__ */ o(lc, { className: "h-4 w-4" }),
          /* @__PURE__ */ o("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
st.displayName = Vl.displayName;
const at = ({ className: e, ...t }) => /* @__PURE__ */ o("div", { className: te("flex flex-col space-y-1.5 text-center sm:text-left", e), ...t });
at.displayName = "DialogHeader";
const it = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(
  Gl,
  {
    ref: n,
    className: te("text-lg font-semibold leading-none tracking-tight", e),
    ...t
  }
));
it.displayName = Gl.displayName;
const Yv = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(Ql, { ref: n, className: te("text-sm text-muted-foreground", e), ...t }));
Yv.displayName = Ql.displayName;
const nt = m.forwardRef(
  ({ className: e, type: t, ...n }, r) => /* @__PURE__ */ o(
    "input",
    {
      type: t,
      className: te(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        e
      ),
      ref: r,
      ...n
    }
  )
);
nt.displayName = "Input";
var Xv = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
], Jv = Xv.reduce((e, t) => {
  const n = Lt(`Primitive.${t}`), r = m.forwardRef((s, a) => {
    const { asChild: i, ...c } = s, d = i ? n : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ o(d, { ...c, ref: a });
  });
  return r.displayName = `Primitive.${t}`, { ...e, [t]: r };
}, {}), Zv = "Separator", Ui = "horizontal", ew = ["horizontal", "vertical"], Xl = m.forwardRef((e, t) => {
  const { decorative: n, orientation: r = Ui, ...s } = e, a = tw(r) ? r : Ui, c = n ? { role: "none" } : { "aria-orientation": a === "vertical" ? a : void 0, role: "separator" };
  return /* @__PURE__ */ o(
    Jv.div,
    {
      "data-orientation": a,
      ...c,
      ...s,
      ref: t
    }
  );
});
Xl.displayName = Zv;
function tw(e) {
  return ew.includes(e);
}
var Jl = Xl;
const an = m.forwardRef(({ className: e, orientation: t = "horizontal", decorative: n = !0, ...r }, s) => /* @__PURE__ */ o(
  Jl,
  {
    ref: s,
    decorative: n,
    orientation: t,
    className: te("shrink-0 bg-border", t === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", e),
    ...r
  }
));
an.displayName = Jl.displayName;
function Bi(e, [t, n]) {
  return Math.min(n, Math.max(t, e));
}
function Js(e) {
  const t = e + "CollectionProvider", [n, r] = Bt(t), [s, a] = n(
    t,
    { collectionRef: { current: null }, itemMap: /* @__PURE__ */ new Map() }
  ), i = (p) => {
    const { scope: y, children: C } = p, S = Ot.useRef(null), b = Ot.useRef(/* @__PURE__ */ new Map()).current;
    return /* @__PURE__ */ o(s, { scope: y, itemMap: b, collectionRef: S, children: C });
  };
  i.displayName = t;
  const c = e + "CollectionSlot", d = Lt(c), l = Ot.forwardRef(
    (p, y) => {
      const { scope: C, children: S } = p, b = a(c, C), x = se(y, b.collectionRef);
      return /* @__PURE__ */ o(d, { ref: x, children: S });
    }
  );
  l.displayName = c;
  const u = e + "CollectionItemSlot", f = "data-radix-collection-item", v = Lt(u), w = Ot.forwardRef(
    (p, y) => {
      const { scope: C, children: S, ...b } = p, x = Ot.useRef(null), E = se(y, x), k = a(u, C);
      return Ot.useEffect(() => (k.itemMap.set(x, { ref: x, ...b }), () => void k.itemMap.delete(x))), /* @__PURE__ */ o(v, { [f]: "", ref: E, children: S });
    }
  );
  w.displayName = u;
  function g(p) {
    const y = a(e + "CollectionConsumer", p);
    return Ot.useCallback(() => {
      const S = y.collectionRef.current;
      if (!S) return [];
      const b = Array.from(S.querySelectorAll(`[${f}]`));
      return Array.from(y.itemMap.values()).sort(
        (k, T) => b.indexOf(k.ref.current) - b.indexOf(T.ref.current)
      );
    }, [y.collectionRef, y.itemMap]);
  }
  return [
    { Provider: i, Slot: l, ItemSlot: w },
    g,
    r
  ];
}
var nw = m.createContext(void 0);
function Zs(e) {
  const t = m.useContext(nw);
  return e || t || "ltr";
}
const rw = ["top", "right", "bottom", "left"], Qt = Math.min, Ze = Math.max, jr = Math.round, Ar = Math.floor, St = (e) => ({
  x: e,
  y: e
}), ow = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, sw = {
  start: "end",
  end: "start"
};
function ys(e, t, n) {
  return Ze(e, Qt(t, n));
}
function $t(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Ut(e) {
  return e.split("-")[0];
}
function Bn(e) {
  return e.split("-")[1];
}
function ea(e) {
  return e === "x" ? "y" : "x";
}
function ta(e) {
  return e === "y" ? "height" : "width";
}
const aw = /* @__PURE__ */ new Set(["top", "bottom"]);
function bt(e) {
  return aw.has(Ut(e)) ? "y" : "x";
}
function na(e) {
  return ea(bt(e));
}
function iw(e, t, n) {
  n === void 0 && (n = !1);
  const r = Bn(e), s = na(e), a = ta(s);
  let i = s === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[a] > t.floating[a] && (i = Wr(i)), [i, Wr(i)];
}
function cw(e) {
  const t = Wr(e);
  return [vs(e), t, vs(t)];
}
function vs(e) {
  return e.replace(/start|end/g, (t) => sw[t]);
}
const zi = ["left", "right"], qi = ["right", "left"], lw = ["top", "bottom"], dw = ["bottom", "top"];
function uw(e, t, n) {
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? qi : zi : t ? zi : qi;
    case "left":
    case "right":
      return t ? lw : dw;
    default:
      return [];
  }
}
function fw(e, t, n, r) {
  const s = Bn(e);
  let a = uw(Ut(e), n === "start", r);
  return s && (a = a.map((i) => i + "-" + s), t && (a = a.concat(a.map(vs)))), a;
}
function Wr(e) {
  return e.replace(/left|right|bottom|top/g, (t) => ow[t]);
}
function pw(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function Zl(e) {
  return typeof e != "number" ? pw(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function Kr(e) {
  const {
    x: t,
    y: n,
    width: r,
    height: s
  } = e;
  return {
    width: r,
    height: s,
    top: n,
    left: t,
    right: t + r,
    bottom: n + s,
    x: t,
    y: n
  };
}
function Hi(e, t, n) {
  let {
    reference: r,
    floating: s
  } = e;
  const a = bt(t), i = na(t), c = ta(i), d = Ut(t), l = a === "y", u = r.x + r.width / 2 - s.width / 2, f = r.y + r.height / 2 - s.height / 2, v = r[c] / 2 - s[c] / 2;
  let w;
  switch (d) {
    case "top":
      w = {
        x: u,
        y: r.y - s.height
      };
      break;
    case "bottom":
      w = {
        x: u,
        y: r.y + r.height
      };
      break;
    case "right":
      w = {
        x: r.x + r.width,
        y: f
      };
      break;
    case "left":
      w = {
        x: r.x - s.width,
        y: f
      };
      break;
    default:
      w = {
        x: r.x,
        y: r.y
      };
  }
  switch (Bn(t)) {
    case "start":
      w[i] -= v * (n && l ? -1 : 1);
      break;
    case "end":
      w[i] += v * (n && l ? -1 : 1);
      break;
  }
  return w;
}
const mw = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: s = "absolute",
    middleware: a = [],
    platform: i
  } = n, c = a.filter(Boolean), d = await (i.isRTL == null ? void 0 : i.isRTL(t));
  let l = await i.getElementRects({
    reference: e,
    floating: t,
    strategy: s
  }), {
    x: u,
    y: f
  } = Hi(l, r, d), v = r, w = {}, g = 0;
  for (let p = 0; p < c.length; p++) {
    const {
      name: y,
      fn: C
    } = c[p], {
      x: S,
      y: b,
      data: x,
      reset: E
    } = await C({
      x: u,
      y: f,
      initialPlacement: r,
      placement: v,
      strategy: s,
      middlewareData: w,
      rects: l,
      platform: i,
      elements: {
        reference: e,
        floating: t
      }
    });
    u = S ?? u, f = b ?? f, w = {
      ...w,
      [y]: {
        ...w[y],
        ...x
      }
    }, E && g <= 50 && (g++, typeof E == "object" && (E.placement && (v = E.placement), E.rects && (l = E.rects === !0 ? await i.getElementRects({
      reference: e,
      floating: t,
      strategy: s
    }) : E.rects), {
      x: u,
      y: f
    } = Hi(l, v, d)), p = -1);
  }
  return {
    x: u,
    y: f,
    placement: v,
    strategy: s,
    middlewareData: w
  };
};
async function Jn(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: r,
    y: s,
    platform: a,
    rects: i,
    elements: c,
    strategy: d
  } = e, {
    boundary: l = "clippingAncestors",
    rootBoundary: u = "viewport",
    elementContext: f = "floating",
    altBoundary: v = !1,
    padding: w = 0
  } = $t(t, e), g = Zl(w), y = c[v ? f === "floating" ? "reference" : "floating" : f], C = Kr(await a.getClippingRect({
    element: (n = await (a.isElement == null ? void 0 : a.isElement(y))) == null || n ? y : y.contextElement || await (a.getDocumentElement == null ? void 0 : a.getDocumentElement(c.floating)),
    boundary: l,
    rootBoundary: u,
    strategy: d
  })), S = f === "floating" ? {
    x: r,
    y: s,
    width: i.floating.width,
    height: i.floating.height
  } : i.reference, b = await (a.getOffsetParent == null ? void 0 : a.getOffsetParent(c.floating)), x = await (a.isElement == null ? void 0 : a.isElement(b)) ? await (a.getScale == null ? void 0 : a.getScale(b)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, E = Kr(a.convertOffsetParentRelativeRectToViewportRelativeRect ? await a.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: c,
    rect: S,
    offsetParent: b,
    strategy: d
  }) : S);
  return {
    top: (C.top - E.top + g.top) / x.y,
    bottom: (E.bottom - C.bottom + g.bottom) / x.y,
    left: (C.left - E.left + g.left) / x.x,
    right: (E.right - C.right + g.right) / x.x
  };
}
const hw = (e) => ({
  name: "arrow",
  options: e,
  async fn(t) {
    const {
      x: n,
      y: r,
      placement: s,
      rects: a,
      platform: i,
      elements: c,
      middlewareData: d
    } = t, {
      element: l,
      padding: u = 0
    } = $t(e, t) || {};
    if (l == null)
      return {};
    const f = Zl(u), v = {
      x: n,
      y: r
    }, w = na(s), g = ta(w), p = await i.getDimensions(l), y = w === "y", C = y ? "top" : "left", S = y ? "bottom" : "right", b = y ? "clientHeight" : "clientWidth", x = a.reference[g] + a.reference[w] - v[w] - a.floating[g], E = v[w] - a.reference[w], k = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(l));
    let T = k ? k[b] : 0;
    (!T || !await (i.isElement == null ? void 0 : i.isElement(k))) && (T = c.floating[b] || a.floating[g]);
    const P = x / 2 - E / 2, B = T / 2 - p[g] / 2 - 1, z = Qt(f[C], B), H = Qt(f[S], B), I = z, K = T - p[g] - H, q = T / 2 - p[g] / 2 + P, ee = ys(I, q, K), $ = !d.arrow && Bn(s) != null && q !== ee && a.reference[g] / 2 - (q < I ? z : H) - p[g] / 2 < 0, G = $ ? q < I ? q - I : q - K : 0;
    return {
      [w]: v[w] + G,
      data: {
        [w]: ee,
        centerOffset: q - ee - G,
        ...$ && {
          alignmentOffset: G
        }
      },
      reset: $
    };
  }
}), gw = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: s,
        middlewareData: a,
        rects: i,
        initialPlacement: c,
        platform: d,
        elements: l
      } = t, {
        mainAxis: u = !0,
        crossAxis: f = !0,
        fallbackPlacements: v,
        fallbackStrategy: w = "bestFit",
        fallbackAxisSideDirection: g = "none",
        flipAlignment: p = !0,
        ...y
      } = $t(e, t);
      if ((n = a.arrow) != null && n.alignmentOffset)
        return {};
      const C = Ut(s), S = bt(c), b = Ut(c) === c, x = await (d.isRTL == null ? void 0 : d.isRTL(l.floating)), E = v || (b || !p ? [Wr(c)] : cw(c)), k = g !== "none";
      !v && k && E.push(...fw(c, p, g, x));
      const T = [c, ...E], P = await Jn(t, y), B = [];
      let z = ((r = a.flip) == null ? void 0 : r.overflows) || [];
      if (u && B.push(P[C]), f) {
        const q = iw(s, i, x);
        B.push(P[q[0]], P[q[1]]);
      }
      if (z = [...z, {
        placement: s,
        overflows: B
      }], !B.every((q) => q <= 0)) {
        var H, I;
        const q = (((H = a.flip) == null ? void 0 : H.index) || 0) + 1, ee = T[q];
        if (ee && (!(f === "alignment" ? S !== bt(ee) : !1) || // We leave the current main axis only if every placement on that axis
        // overflows the main axis.
        z.every((O) => bt(O.placement) === S ? O.overflows[0] > 0 : !0)))
          return {
            data: {
              index: q,
              overflows: z
            },
            reset: {
              placement: ee
            }
          };
        let $ = (I = z.filter((G) => G.overflows[0] <= 0).sort((G, O) => G.overflows[1] - O.overflows[1])[0]) == null ? void 0 : I.placement;
        if (!$)
          switch (w) {
            case "bestFit": {
              var K;
              const G = (K = z.filter((O) => {
                if (k) {
                  const M = bt(O.placement);
                  return M === S || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  M === "y";
                }
                return !0;
              }).map((O) => [O.placement, O.overflows.filter((M) => M > 0).reduce((M, ae) => M + ae, 0)]).sort((O, M) => O[1] - M[1])[0]) == null ? void 0 : K[0];
              G && ($ = G);
              break;
            }
            case "initialPlacement":
              $ = c;
              break;
          }
        if (s !== $)
          return {
            reset: {
              placement: $
            }
          };
      }
      return {};
    }
  };
};
function ji(e, t) {
  return {
    top: e.top - t.height,
    right: e.right - t.width,
    bottom: e.bottom - t.height,
    left: e.left - t.width
  };
}
function Wi(e) {
  return rw.some((t) => e[t] >= 0);
}
const yw = function(e) {
  return e === void 0 && (e = {}), {
    name: "hide",
    options: e,
    async fn(t) {
      const {
        rects: n
      } = t, {
        strategy: r = "referenceHidden",
        ...s
      } = $t(e, t);
      switch (r) {
        case "referenceHidden": {
          const a = await Jn(t, {
            ...s,
            elementContext: "reference"
          }), i = ji(a, n.reference);
          return {
            data: {
              referenceHiddenOffsets: i,
              referenceHidden: Wi(i)
            }
          };
        }
        case "escaped": {
          const a = await Jn(t, {
            ...s,
            altBoundary: !0
          }), i = ji(a, n.floating);
          return {
            data: {
              escapedOffsets: i,
              escaped: Wi(i)
            }
          };
        }
        default:
          return {};
      }
    }
  };
}, ed = /* @__PURE__ */ new Set(["left", "top"]);
async function vw(e, t) {
  const {
    placement: n,
    platform: r,
    elements: s
  } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(s.floating)), i = Ut(n), c = Bn(n), d = bt(n) === "y", l = ed.has(i) ? -1 : 1, u = a && d ? -1 : 1, f = $t(t, e);
  let {
    mainAxis: v,
    crossAxis: w,
    alignmentAxis: g
  } = typeof f == "number" ? {
    mainAxis: f,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: f.mainAxis || 0,
    crossAxis: f.crossAxis || 0,
    alignmentAxis: f.alignmentAxis
  };
  return c && typeof g == "number" && (w = c === "end" ? g * -1 : g), d ? {
    x: w * u,
    y: v * l
  } : {
    x: v * l,
    y: w * u
  };
}
const ww = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, r;
      const {
        x: s,
        y: a,
        placement: i,
        middlewareData: c
      } = t, d = await vw(t, e);
      return i === ((n = c.offset) == null ? void 0 : n.placement) && (r = c.arrow) != null && r.alignmentOffset ? {} : {
        x: s + d.x,
        y: a + d.y,
        data: {
          ...d,
          placement: i
        }
      };
    }
  };
}, bw = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: n,
        y: r,
        placement: s
      } = t, {
        mainAxis: a = !0,
        crossAxis: i = !1,
        limiter: c = {
          fn: (y) => {
            let {
              x: C,
              y: S
            } = y;
            return {
              x: C,
              y: S
            };
          }
        },
        ...d
      } = $t(e, t), l = {
        x: n,
        y: r
      }, u = await Jn(t, d), f = bt(Ut(s)), v = ea(f);
      let w = l[v], g = l[f];
      if (a) {
        const y = v === "y" ? "top" : "left", C = v === "y" ? "bottom" : "right", S = w + u[y], b = w - u[C];
        w = ys(S, w, b);
      }
      if (i) {
        const y = f === "y" ? "top" : "left", C = f === "y" ? "bottom" : "right", S = g + u[y], b = g - u[C];
        g = ys(S, g, b);
      }
      const p = c.fn({
        ...t,
        [v]: w,
        [f]: g
      });
      return {
        ...p,
        data: {
          x: p.x - n,
          y: p.y - r,
          enabled: {
            [v]: a,
            [f]: i
          }
        }
      };
    }
  };
}, Cw = function(e) {
  return e === void 0 && (e = {}), {
    options: e,
    fn(t) {
      const {
        x: n,
        y: r,
        placement: s,
        rects: a,
        middlewareData: i
      } = t, {
        offset: c = 0,
        mainAxis: d = !0,
        crossAxis: l = !0
      } = $t(e, t), u = {
        x: n,
        y: r
      }, f = bt(s), v = ea(f);
      let w = u[v], g = u[f];
      const p = $t(c, t), y = typeof p == "number" ? {
        mainAxis: p,
        crossAxis: 0
      } : {
        mainAxis: 0,
        crossAxis: 0,
        ...p
      };
      if (d) {
        const b = v === "y" ? "height" : "width", x = a.reference[v] - a.floating[b] + y.mainAxis, E = a.reference[v] + a.reference[b] - y.mainAxis;
        w < x ? w = x : w > E && (w = E);
      }
      if (l) {
        var C, S;
        const b = v === "y" ? "width" : "height", x = ed.has(Ut(s)), E = a.reference[f] - a.floating[b] + (x && ((C = i.offset) == null ? void 0 : C[f]) || 0) + (x ? 0 : y.crossAxis), k = a.reference[f] + a.reference[b] + (x ? 0 : ((S = i.offset) == null ? void 0 : S[f]) || 0) - (x ? y.crossAxis : 0);
        g < E ? g = E : g > k && (g = k);
      }
      return {
        [v]: w,
        [f]: g
      };
    }
  };
}, Sw = function(e) {
  return e === void 0 && (e = {}), {
    name: "size",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: s,
        rects: a,
        platform: i,
        elements: c
      } = t, {
        apply: d = () => {
        },
        ...l
      } = $t(e, t), u = await Jn(t, l), f = Ut(s), v = Bn(s), w = bt(s) === "y", {
        width: g,
        height: p
      } = a.floating;
      let y, C;
      f === "top" || f === "bottom" ? (y = f, C = v === (await (i.isRTL == null ? void 0 : i.isRTL(c.floating)) ? "start" : "end") ? "left" : "right") : (C = f, y = v === "end" ? "top" : "bottom");
      const S = p - u.top - u.bottom, b = g - u.left - u.right, x = Qt(p - u[y], S), E = Qt(g - u[C], b), k = !t.middlewareData.shift;
      let T = x, P = E;
      if ((n = t.middlewareData.shift) != null && n.enabled.x && (P = b), (r = t.middlewareData.shift) != null && r.enabled.y && (T = S), k && !v) {
        const z = Ze(u.left, 0), H = Ze(u.right, 0), I = Ze(u.top, 0), K = Ze(u.bottom, 0);
        w ? P = g - 2 * (z !== 0 || H !== 0 ? z + H : Ze(u.left, u.right)) : T = p - 2 * (I !== 0 || K !== 0 ? I + K : Ze(u.top, u.bottom));
      }
      await d({
        ...t,
        availableWidth: P,
        availableHeight: T
      });
      const B = await i.getDimensions(c.floating);
      return g !== B.width || p !== B.height ? {
        reset: {
          rects: !0
        }
      } : {};
    }
  };
};
function Eo() {
  return typeof window < "u";
}
function zn(e) {
  return td(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function et(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function Rt(e) {
  var t;
  return (t = (td(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function td(e) {
  return Eo() ? e instanceof Node || e instanceof et(e).Node : !1;
}
function dt(e) {
  return Eo() ? e instanceof Element || e instanceof et(e).Element : !1;
}
function Et(e) {
  return Eo() ? e instanceof HTMLElement || e instanceof et(e).HTMLElement : !1;
}
function Ki(e) {
  return !Eo() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof et(e).ShadowRoot;
}
const xw = /* @__PURE__ */ new Set(["inline", "contents"]);
function pr(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: s
  } = ut(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !xw.has(s);
}
const Nw = /* @__PURE__ */ new Set(["table", "td", "th"]);
function Ew(e) {
  return Nw.has(zn(e));
}
const Tw = [":popover-open", ":modal"];
function To(e) {
  return Tw.some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
const _w = ["transform", "translate", "scale", "rotate", "perspective"], Rw = ["transform", "translate", "scale", "rotate", "perspective", "filter"], Aw = ["paint", "layout", "strict", "content"];
function ra(e) {
  const t = oa(), n = dt(e) ? ut(e) : e;
  return _w.some((r) => n[r] ? n[r] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || Rw.some((r) => (n.willChange || "").includes(r)) || Aw.some((r) => (n.contain || "").includes(r));
}
function Pw(e) {
  let t = Yt(e);
  for (; Et(t) && !On(t); ) {
    if (ra(t))
      return t;
    if (To(t))
      return null;
    t = Yt(t);
  }
  return null;
}
function oa() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
const Mw = /* @__PURE__ */ new Set(["html", "body", "#document"]);
function On(e) {
  return Mw.has(zn(e));
}
function ut(e) {
  return et(e).getComputedStyle(e);
}
function _o(e) {
  return dt(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function Yt(e) {
  if (zn(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Ki(e) && e.host || // Fallback.
    Rt(e)
  );
  return Ki(t) ? t.host : t;
}
function nd(e) {
  const t = Yt(e);
  return On(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : Et(t) && pr(t) ? t : nd(t);
}
function Zn(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const s = nd(e), a = s === ((r = e.ownerDocument) == null ? void 0 : r.body), i = et(s);
  if (a) {
    const c = ws(i);
    return t.concat(i, i.visualViewport || [], pr(s) ? s : [], c && n ? Zn(c) : []);
  }
  return t.concat(s, Zn(s, [], n));
}
function ws(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function rd(e) {
  const t = ut(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const s = Et(e), a = s ? e.offsetWidth : n, i = s ? e.offsetHeight : r, c = jr(n) !== a || jr(r) !== i;
  return c && (n = a, r = i), {
    width: n,
    height: r,
    $: c
  };
}
function sa(e) {
  return dt(e) ? e : e.contextElement;
}
function An(e) {
  const t = sa(e);
  if (!Et(t))
    return St(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: s,
    $: a
  } = rd(t);
  let i = (a ? jr(n.width) : n.width) / r, c = (a ? jr(n.height) : n.height) / s;
  return (!i || !Number.isFinite(i)) && (i = 1), (!c || !Number.isFinite(c)) && (c = 1), {
    x: i,
    y: c
  };
}
const kw = /* @__PURE__ */ St(0);
function od(e) {
  const t = et(e);
  return !oa() || !t.visualViewport ? kw : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function Iw(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== et(e) ? !1 : t;
}
function hn(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const s = e.getBoundingClientRect(), a = sa(e);
  let i = St(1);
  t && (r ? dt(r) && (i = An(r)) : i = An(e));
  const c = Iw(a, n, r) ? od(a) : St(0);
  let d = (s.left + c.x) / i.x, l = (s.top + c.y) / i.y, u = s.width / i.x, f = s.height / i.y;
  if (a) {
    const v = et(a), w = r && dt(r) ? et(r) : r;
    let g = v, p = ws(g);
    for (; p && r && w !== g; ) {
      const y = An(p), C = p.getBoundingClientRect(), S = ut(p), b = C.left + (p.clientLeft + parseFloat(S.paddingLeft)) * y.x, x = C.top + (p.clientTop + parseFloat(S.paddingTop)) * y.y;
      d *= y.x, l *= y.y, u *= y.x, f *= y.y, d += b, l += x, g = et(p), p = ws(g);
    }
  }
  return Kr({
    width: u,
    height: f,
    x: d,
    y: l
  });
}
function Ro(e, t) {
  const n = _o(e).scrollLeft;
  return t ? t.left + n : hn(Rt(e)).left + n;
}
function sd(e, t) {
  const n = e.getBoundingClientRect(), r = n.left + t.scrollLeft - Ro(e, n), s = n.top + t.scrollTop;
  return {
    x: r,
    y: s
  };
}
function Ow(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: r,
    strategy: s
  } = e;
  const a = s === "fixed", i = Rt(r), c = t ? To(t.floating) : !1;
  if (r === i || c && a)
    return n;
  let d = {
    scrollLeft: 0,
    scrollTop: 0
  }, l = St(1);
  const u = St(0), f = Et(r);
  if ((f || !f && !a) && ((zn(r) !== "body" || pr(i)) && (d = _o(r)), Et(r))) {
    const w = hn(r);
    l = An(r), u.x = w.x + r.clientLeft, u.y = w.y + r.clientTop;
  }
  const v = i && !f && !a ? sd(i, d) : St(0);
  return {
    width: n.width * l.x,
    height: n.height * l.y,
    x: n.x * l.x - d.scrollLeft * l.x + u.x + v.x,
    y: n.y * l.y - d.scrollTop * l.y + u.y + v.y
  };
}
function Dw(e) {
  return Array.from(e.getClientRects());
}
function Fw(e) {
  const t = Rt(e), n = _o(e), r = e.ownerDocument.body, s = Ze(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), a = Ze(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + Ro(e);
  const c = -n.scrollTop;
  return ut(r).direction === "rtl" && (i += Ze(t.clientWidth, r.clientWidth) - s), {
    width: s,
    height: a,
    x: i,
    y: c
  };
}
const Vi = 25;
function Lw(e, t) {
  const n = et(e), r = Rt(e), s = n.visualViewport;
  let a = r.clientWidth, i = r.clientHeight, c = 0, d = 0;
  if (s) {
    a = s.width, i = s.height;
    const u = oa();
    (!u || u && t === "fixed") && (c = s.offsetLeft, d = s.offsetTop);
  }
  const l = Ro(r);
  if (l <= 0) {
    const u = r.ownerDocument, f = u.body, v = getComputedStyle(f), w = u.compatMode === "CSS1Compat" && parseFloat(v.marginLeft) + parseFloat(v.marginRight) || 0, g = Math.abs(r.clientWidth - f.clientWidth - w);
    g <= Vi && (a -= g);
  } else l <= Vi && (a += l);
  return {
    width: a,
    height: i,
    x: c,
    y: d
  };
}
const $w = /* @__PURE__ */ new Set(["absolute", "fixed"]);
function Uw(e, t) {
  const n = hn(e, !0, t === "fixed"), r = n.top + e.clientTop, s = n.left + e.clientLeft, a = Et(e) ? An(e) : St(1), i = e.clientWidth * a.x, c = e.clientHeight * a.y, d = s * a.x, l = r * a.y;
  return {
    width: i,
    height: c,
    x: d,
    y: l
  };
}
function Gi(e, t, n) {
  let r;
  if (t === "viewport")
    r = Lw(e, n);
  else if (t === "document")
    r = Fw(Rt(e));
  else if (dt(t))
    r = Uw(t, n);
  else {
    const s = od(e);
    r = {
      x: t.x - s.x,
      y: t.y - s.y,
      width: t.width,
      height: t.height
    };
  }
  return Kr(r);
}
function ad(e, t) {
  const n = Yt(e);
  return n === t || !dt(n) || On(n) ? !1 : ut(n).position === "fixed" || ad(n, t);
}
function Bw(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = Zn(e, [], !1).filter((c) => dt(c) && zn(c) !== "body"), s = null;
  const a = ut(e).position === "fixed";
  let i = a ? Yt(e) : e;
  for (; dt(i) && !On(i); ) {
    const c = ut(i), d = ra(i);
    !d && c.position === "fixed" && (s = null), (a ? !d && !s : !d && c.position === "static" && !!s && $w.has(s.position) || pr(i) && !d && ad(e, i)) ? r = r.filter((u) => u !== i) : s = c, i = Yt(i);
  }
  return t.set(e, r), r;
}
function zw(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: s
  } = e;
  const i = [...n === "clippingAncestors" ? To(t) ? [] : Bw(t, this._c) : [].concat(n), r], c = i[0], d = i.reduce((l, u) => {
    const f = Gi(t, u, s);
    return l.top = Ze(f.top, l.top), l.right = Qt(f.right, l.right), l.bottom = Qt(f.bottom, l.bottom), l.left = Ze(f.left, l.left), l;
  }, Gi(t, c, s));
  return {
    width: d.right - d.left,
    height: d.bottom - d.top,
    x: d.left,
    y: d.top
  };
}
function qw(e) {
  const {
    width: t,
    height: n
  } = rd(e);
  return {
    width: t,
    height: n
  };
}
function Hw(e, t, n) {
  const r = Et(t), s = Rt(t), a = n === "fixed", i = hn(e, !0, a, t);
  let c = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const d = St(0);
  function l() {
    d.x = Ro(s);
  }
  if (r || !r && !a)
    if ((zn(t) !== "body" || pr(s)) && (c = _o(t)), r) {
      const w = hn(t, !0, a, t);
      d.x = w.x + t.clientLeft, d.y = w.y + t.clientTop;
    } else s && l();
  a && !r && s && l();
  const u = s && !r && !a ? sd(s, c) : St(0), f = i.left + c.scrollLeft - d.x - u.x, v = i.top + c.scrollTop - d.y - u.y;
  return {
    x: f,
    y: v,
    width: i.width,
    height: i.height
  };
}
function es(e) {
  return ut(e).position === "static";
}
function Qi(e, t) {
  if (!Et(e) || ut(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return Rt(e) === n && (n = n.ownerDocument.body), n;
}
function id(e, t) {
  const n = et(e);
  if (To(e))
    return n;
  if (!Et(e)) {
    let s = Yt(e);
    for (; s && !On(s); ) {
      if (dt(s) && !es(s))
        return s;
      s = Yt(s);
    }
    return n;
  }
  let r = Qi(e, t);
  for (; r && Ew(r) && es(r); )
    r = Qi(r, t);
  return r && On(r) && es(r) && !ra(r) ? n : r || Pw(e) || n;
}
const jw = async function(e) {
  const t = this.getOffsetParent || id, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: Hw(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function Ww(e) {
  return ut(e).direction === "rtl";
}
const Kw = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Ow,
  getDocumentElement: Rt,
  getClippingRect: zw,
  getOffsetParent: id,
  getElementRects: jw,
  getClientRects: Dw,
  getDimensions: qw,
  getScale: An,
  isElement: dt,
  isRTL: Ww
};
function cd(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Vw(e, t) {
  let n = null, r;
  const s = Rt(e);
  function a() {
    var c;
    clearTimeout(r), (c = n) == null || c.disconnect(), n = null;
  }
  function i(c, d) {
    c === void 0 && (c = !1), d === void 0 && (d = 1), a();
    const l = e.getBoundingClientRect(), {
      left: u,
      top: f,
      width: v,
      height: w
    } = l;
    if (c || t(), !v || !w)
      return;
    const g = Ar(f), p = Ar(s.clientWidth - (u + v)), y = Ar(s.clientHeight - (f + w)), C = Ar(u), b = {
      rootMargin: -g + "px " + -p + "px " + -y + "px " + -C + "px",
      threshold: Ze(0, Qt(1, d)) || 1
    };
    let x = !0;
    function E(k) {
      const T = k[0].intersectionRatio;
      if (T !== d) {
        if (!x)
          return i();
        T ? i(!1, T) : r = setTimeout(() => {
          i(!1, 1e-7);
        }, 1e3);
      }
      T === 1 && !cd(l, e.getBoundingClientRect()) && i(), x = !1;
    }
    try {
      n = new IntersectionObserver(E, {
        ...b,
        // Handle <iframe>s
        root: s.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(E, b);
    }
    n.observe(e);
  }
  return i(!0), a;
}
function Gw(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: s = !0,
    ancestorResize: a = !0,
    elementResize: i = typeof ResizeObserver == "function",
    layoutShift: c = typeof IntersectionObserver == "function",
    animationFrame: d = !1
  } = r, l = sa(e), u = s || a ? [...l ? Zn(l) : [], ...Zn(t)] : [];
  u.forEach((C) => {
    s && C.addEventListener("scroll", n, {
      passive: !0
    }), a && C.addEventListener("resize", n);
  });
  const f = l && c ? Vw(l, n) : null;
  let v = -1, w = null;
  i && (w = new ResizeObserver((C) => {
    let [S] = C;
    S && S.target === l && w && (w.unobserve(t), cancelAnimationFrame(v), v = requestAnimationFrame(() => {
      var b;
      (b = w) == null || b.observe(t);
    })), n();
  }), l && !d && w.observe(l), w.observe(t));
  let g, p = d ? hn(e) : null;
  d && y();
  function y() {
    const C = hn(e);
    p && !cd(p, C) && n(), p = C, g = requestAnimationFrame(y);
  }
  return n(), () => {
    var C;
    u.forEach((S) => {
      s && S.removeEventListener("scroll", n), a && S.removeEventListener("resize", n);
    }), f?.(), (C = w) == null || C.disconnect(), w = null, d && cancelAnimationFrame(g);
  };
}
const Qw = ww, Yw = bw, Xw = gw, Jw = Sw, Zw = yw, Yi = hw, eb = Cw, tb = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), s = {
    platform: Kw,
    ...n
  }, a = {
    ...s.platform,
    _c: r
  };
  return mw(e, t, {
    ...s,
    platform: a
  });
};
var nb = typeof document < "u", rb = function() {
}, Dr = nb ? lp : rb;
function Vr(e, t) {
  if (e === t)
    return !0;
  if (typeof e != typeof t)
    return !1;
  if (typeof e == "function" && e.toString() === t.toString())
    return !0;
  let n, r, s;
  if (e && t && typeof e == "object") {
    if (Array.isArray(e)) {
      if (n = e.length, n !== t.length) return !1;
      for (r = n; r-- !== 0; )
        if (!Vr(e[r], t[r]))
          return !1;
      return !0;
    }
    if (s = Object.keys(e), n = s.length, n !== Object.keys(t).length)
      return !1;
    for (r = n; r-- !== 0; )
      if (!{}.hasOwnProperty.call(t, s[r]))
        return !1;
    for (r = n; r-- !== 0; ) {
      const a = s[r];
      if (!(a === "_owner" && e.$$typeof) && !Vr(e[a], t[a]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function ld(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Xi(e, t) {
  const n = ld(e);
  return Math.round(t * n) / n;
}
function ts(e) {
  const t = m.useRef(e);
  return Dr(() => {
    t.current = e;
  }), t;
}
function ob(e) {
  e === void 0 && (e = {});
  const {
    placement: t = "bottom",
    strategy: n = "absolute",
    middleware: r = [],
    platform: s,
    elements: {
      reference: a,
      floating: i
    } = {},
    transform: c = !0,
    whileElementsMounted: d,
    open: l
  } = e, [u, f] = m.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [v, w] = m.useState(r);
  Vr(v, r) || w(r);
  const [g, p] = m.useState(null), [y, C] = m.useState(null), S = m.useCallback((O) => {
    O !== k.current && (k.current = O, p(O));
  }, []), b = m.useCallback((O) => {
    O !== T.current && (T.current = O, C(O));
  }, []), x = a || g, E = i || y, k = m.useRef(null), T = m.useRef(null), P = m.useRef(u), B = d != null, z = ts(d), H = ts(s), I = ts(l), K = m.useCallback(() => {
    if (!k.current || !T.current)
      return;
    const O = {
      placement: t,
      strategy: n,
      middleware: v
    };
    H.current && (O.platform = H.current), tb(k.current, T.current, O).then((M) => {
      const ae = {
        ...M,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: I.current !== !1
      };
      q.current && !Vr(P.current, ae) && (P.current = ae, lo.flushSync(() => {
        f(ae);
      }));
    });
  }, [v, t, n, H, I]);
  Dr(() => {
    l === !1 && P.current.isPositioned && (P.current.isPositioned = !1, f((O) => ({
      ...O,
      isPositioned: !1
    })));
  }, [l]);
  const q = m.useRef(!1);
  Dr(() => (q.current = !0, () => {
    q.current = !1;
  }), []), Dr(() => {
    if (x && (k.current = x), E && (T.current = E), x && E) {
      if (z.current)
        return z.current(x, E, K);
      K();
    }
  }, [x, E, K, z, B]);
  const ee = m.useMemo(() => ({
    reference: k,
    floating: T,
    setReference: S,
    setFloating: b
  }), [S, b]), $ = m.useMemo(() => ({
    reference: x,
    floating: E
  }), [x, E]), G = m.useMemo(() => {
    const O = {
      position: n,
      left: 0,
      top: 0
    };
    if (!$.floating)
      return O;
    const M = Xi($.floating, u.x), ae = Xi($.floating, u.y);
    return c ? {
      ...O,
      transform: "translate(" + M + "px, " + ae + "px)",
      ...ld($.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: M,
      top: ae
    };
  }, [n, c, $.floating, u.x, u.y]);
  return m.useMemo(() => ({
    ...u,
    update: K,
    refs: ee,
    elements: $,
    floatingStyles: G
  }), [u, K, ee, $, G]);
}
const sb = (e) => {
  function t(n) {
    return {}.hasOwnProperty.call(n, "current");
  }
  return {
    name: "arrow",
    options: e,
    fn(n) {
      const {
        element: r,
        padding: s
      } = typeof e == "function" ? e(n) : e;
      return r && t(r) ? r.current != null ? Yi({
        element: r.current,
        padding: s
      }).fn(n) : {} : r ? Yi({
        element: r,
        padding: s
      }).fn(n) : {};
    }
  };
}, ab = (e, t) => ({
  ...Qw(e),
  options: [e, t]
}), ib = (e, t) => ({
  ...Yw(e),
  options: [e, t]
}), cb = (e, t) => ({
  ...eb(e),
  options: [e, t]
}), lb = (e, t) => ({
  ...Xw(e),
  options: [e, t]
}), db = (e, t) => ({
  ...Jw(e),
  options: [e, t]
}), ub = (e, t) => ({
  ...Zw(e),
  options: [e, t]
}), fb = (e, t) => ({
  ...sb(e),
  options: [e, t]
});
var pb = "Arrow", dd = m.forwardRef((e, t) => {
  const { children: n, width: r = 10, height: s = 5, ...a } = e;
  return /* @__PURE__ */ o(
    Z.svg,
    {
      ...a,
      ref: t,
      width: r,
      height: s,
      viewBox: "0 0 30 10",
      preserveAspectRatio: "none",
      children: e.asChild ? n : /* @__PURE__ */ o("polygon", { points: "0,0 30,0 15,10" })
    }
  );
});
dd.displayName = pb;
var mb = dd, aa = "Popper", [ud, qn] = Bt(aa), [hb, fd] = ud(aa), pd = (e) => {
  const { __scopePopper: t, children: n } = e, [r, s] = m.useState(null);
  return /* @__PURE__ */ o(hb, { scope: t, anchor: r, onAnchorChange: s, children: n });
};
pd.displayName = aa;
var md = "PopperAnchor", hd = m.forwardRef(
  (e, t) => {
    const { __scopePopper: n, virtualRef: r, ...s } = e, a = fd(md, n), i = m.useRef(null), c = se(t, i), d = m.useRef(null);
    return m.useEffect(() => {
      const l = d.current;
      d.current = r?.current || i.current, l !== d.current && a.onAnchorChange(d.current);
    }), r ? null : /* @__PURE__ */ o(Z.div, { ...s, ref: c });
  }
);
hd.displayName = md;
var ia = "PopperContent", [gb, yb] = ud(ia), gd = m.forwardRef(
  (e, t) => {
    const {
      __scopePopper: n,
      side: r = "bottom",
      sideOffset: s = 0,
      align: a = "center",
      alignOffset: i = 0,
      arrowPadding: c = 0,
      avoidCollisions: d = !0,
      collisionBoundary: l = [],
      collisionPadding: u = 0,
      sticky: f = "partial",
      hideWhenDetached: v = !1,
      updatePositionStrategy: w = "optimized",
      onPlaced: g,
      ...p
    } = e, y = fd(ia, n), [C, S] = m.useState(null), b = se(t, (F) => S(F)), [x, E] = m.useState(null), k = fl(x), T = k?.width ?? 0, P = k?.height ?? 0, B = r + (a !== "center" ? "-" + a : ""), z = typeof u == "number" ? u : { top: 0, right: 0, bottom: 0, left: 0, ...u }, H = Array.isArray(l) ? l : [l], I = H.length > 0, K = {
      padding: z,
      boundary: H.filter(wb),
      // with `strategy: 'fixed'`, this is the only way to get it to respect boundaries
      altBoundary: I
    }, { refs: q, floatingStyles: ee, placement: $, isPositioned: G, middlewareData: O } = ob({
      // default to `fixed` strategy so users don't have to pick and we also avoid focus scroll issues
      strategy: "fixed",
      placement: B,
      whileElementsMounted: (...F) => Gw(...F, {
        animationFrame: w === "always"
      }),
      elements: {
        reference: y.anchor
      },
      middleware: [
        ab({ mainAxis: s + P, alignmentAxis: i }),
        d && ib({
          mainAxis: !0,
          crossAxis: !1,
          limiter: f === "partial" ? cb() : void 0,
          ...K
        }),
        d && lb({ ...K }),
        db({
          ...K,
          apply: ({ elements: F, rects: le, availableWidth: Fe, availableHeight: ie }) => {
            const { width: ce, height: we } = le.reference, We = F.floating.style;
            We.setProperty("--radix-popper-available-width", `${Fe}px`), We.setProperty("--radix-popper-available-height", `${ie}px`), We.setProperty("--radix-popper-anchor-width", `${ce}px`), We.setProperty("--radix-popper-anchor-height", `${we}px`);
          }
        }),
        x && fb({ element: x, padding: c }),
        bb({ arrowWidth: T, arrowHeight: P }),
        v && ub({ strategy: "referenceHidden", ...K })
      ]
    }), [M, ae] = wd($), X = lt(g);
    Ie(() => {
      G && X?.();
    }, [G, X]);
    const xe = O.arrow?.x, qe = O.arrow?.y, Ne = O.arrow?.centerOffset !== 0, [He, je] = m.useState();
    return Ie(() => {
      C && je(window.getComputedStyle(C).zIndex);
    }, [C]), /* @__PURE__ */ o(
      "div",
      {
        ref: q.setFloating,
        "data-radix-popper-content-wrapper": "",
        style: {
          ...ee,
          transform: G ? ee.transform : "translate(0, -200%)",
          // keep off the page when measuring
          minWidth: "max-content",
          zIndex: He,
          "--radix-popper-transform-origin": [
            O.transformOrigin?.x,
            O.transformOrigin?.y
          ].join(" "),
          // hide the content if using the hide middleware and should be hidden
          // set visibility to hidden and disable pointer events so the UI behaves
          // as if the PopperContent isn't there at all
          ...O.hide?.referenceHidden && {
            visibility: "hidden",
            pointerEvents: "none"
          }
        },
        dir: e.dir,
        children: /* @__PURE__ */ o(
          gb,
          {
            scope: n,
            placedSide: M,
            onArrowChange: E,
            arrowX: xe,
            arrowY: qe,
            shouldHideArrow: Ne,
            children: /* @__PURE__ */ o(
              Z.div,
              {
                "data-side": M,
                "data-align": ae,
                ...p,
                ref: b,
                style: {
                  ...p.style,
                  // if the PopperContent hasn't been placed yet (not all measurements done)
                  // we prevent animations so that users's animation don't kick in too early referring wrong sides
                  animation: G ? void 0 : "none"
                }
              }
            )
          }
        )
      }
    );
  }
);
gd.displayName = ia;
var yd = "PopperArrow", vb = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right"
}, vd = m.forwardRef(function(t, n) {
  const { __scopePopper: r, ...s } = t, a = yb(yd, r), i = vb[a.placedSide];
  return (
    // we have to use an extra wrapper because `ResizeObserver` (used by `useSize`)
    // doesn't report size as we'd expect on SVG elements.
    // it reports their bounding box which is effectively the largest path inside the SVG.
    /* @__PURE__ */ o(
      "span",
      {
        ref: a.onArrowChange,
        style: {
          position: "absolute",
          left: a.arrowX,
          top: a.arrowY,
          [i]: 0,
          transformOrigin: {
            top: "",
            right: "0 0",
            bottom: "center 0",
            left: "100% 0"
          }[a.placedSide],
          transform: {
            top: "translateY(100%)",
            right: "translateY(50%) rotate(90deg) translateX(-50%)",
            bottom: "rotate(180deg)",
            left: "translateY(50%) rotate(-90deg) translateX(50%)"
          }[a.placedSide],
          visibility: a.shouldHideArrow ? "hidden" : void 0
        },
        children: /* @__PURE__ */ o(
          mb,
          {
            ...s,
            ref: n,
            style: {
              ...s.style,
              // ensures the element can be measured correctly (mostly for if SVG)
              display: "block"
            }
          }
        )
      }
    )
  );
});
vd.displayName = yd;
function wb(e) {
  return e !== null;
}
var bb = (e) => ({
  name: "transformOrigin",
  options: e,
  fn(t) {
    const { placement: n, rects: r, middlewareData: s } = t, i = s.arrow?.centerOffset !== 0, c = i ? 0 : e.arrowWidth, d = i ? 0 : e.arrowHeight, [l, u] = wd(n), f = { start: "0%", center: "50%", end: "100%" }[u], v = (s.arrow?.x ?? 0) + c / 2, w = (s.arrow?.y ?? 0) + d / 2;
    let g = "", p = "";
    return l === "bottom" ? (g = i ? f : `${v}px`, p = `${-d}px`) : l === "top" ? (g = i ? f : `${v}px`, p = `${r.floating.height + d}px`) : l === "right" ? (g = `${-d}px`, p = i ? f : `${w}px`) : l === "left" && (g = `${r.floating.width + d}px`, p = i ? f : `${w}px`), { data: { x: g, y: p } };
  }
});
function wd(e) {
  const [t, n = "center"] = e.split("-");
  return [t, n];
}
var ca = pd, Ao = hd, la = gd, da = vd, bd = Object.freeze({
  // See: https://github.com/twbs/bootstrap/blob/main/scss/mixins/_visually-hidden.scss
  position: "absolute",
  border: 0,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  wordWrap: "normal"
}), Cb = "VisuallyHidden", Sb = m.forwardRef(
  (e, t) => /* @__PURE__ */ o(
    Z.span,
    {
      ...e,
      ref: t,
      style: { ...bd, ...e.style }
    }
  )
);
Sb.displayName = Cb;
var xb = [" ", "Enter", "ArrowUp", "ArrowDown"], Nb = [" ", "Enter"], gn = "Select", [Po, Mo, Eb] = Js(gn), [Hn] = Bt(gn, [
  Eb,
  qn
]), ko = qn(), [Tb, Jt] = Hn(gn), [_b, Rb] = Hn(gn), Cd = (e) => {
  const {
    __scopeSelect: t,
    children: n,
    open: r,
    defaultOpen: s,
    onOpenChange: a,
    value: i,
    defaultValue: c,
    onValueChange: d,
    dir: l,
    name: u,
    autoComplete: f,
    disabled: v,
    required: w,
    form: g
  } = e, p = ko(t), [y, C] = m.useState(null), [S, b] = m.useState(null), [x, E] = m.useState(!1), k = Zs(l), [T, P] = pn({
    prop: r,
    defaultProp: s ?? !1,
    onChange: a,
    caller: gn
  }), [B, z] = pn({
    prop: i,
    defaultProp: c,
    onChange: d,
    caller: gn
  }), H = m.useRef(null), I = y ? g || !!y.closest("form") : !0, [K, q] = m.useState(/* @__PURE__ */ new Set()), ee = Array.from(K).map(($) => $.props.value).join(";");
  return /* @__PURE__ */ o(ca, { ...p, children: /* @__PURE__ */ h(
    Tb,
    {
      required: w,
      scope: t,
      trigger: y,
      onTriggerChange: C,
      valueNode: S,
      onValueNodeChange: b,
      valueNodeHasChildren: x,
      onValueNodeHasChildrenChange: E,
      contentId: Ct(),
      value: B,
      onValueChange: z,
      open: T,
      onOpenChange: P,
      dir: k,
      triggerPointerDownPosRef: H,
      disabled: v,
      children: [
        /* @__PURE__ */ o(Po.Provider, { scope: t, children: /* @__PURE__ */ o(
          _b,
          {
            scope: e.__scopeSelect,
            onNativeOptionAdd: m.useCallback(($) => {
              q((G) => new Set(G).add($));
            }, []),
            onNativeOptionRemove: m.useCallback(($) => {
              q((G) => {
                const O = new Set(G);
                return O.delete($), O;
              });
            }, []),
            children: n
          }
        ) }),
        I ? /* @__PURE__ */ h(
          Wd,
          {
            "aria-hidden": !0,
            required: w,
            tabIndex: -1,
            name: u,
            autoComplete: f,
            value: B,
            onChange: ($) => z($.target.value),
            disabled: v,
            form: g,
            children: [
              B === void 0 ? /* @__PURE__ */ o("option", { value: "" }) : null,
              Array.from(K)
            ]
          },
          ee
        ) : null
      ]
    }
  ) });
};
Cd.displayName = gn;
var Sd = "SelectTrigger", xd = m.forwardRef(
  (e, t) => {
    const { __scopeSelect: n, disabled: r = !1, ...s } = e, a = ko(n), i = Jt(Sd, n), c = i.disabled || r, d = se(t, i.onTriggerChange), l = Mo(n), u = m.useRef("touch"), [f, v, w] = Vd((p) => {
      const y = l().filter((b) => !b.disabled), C = y.find((b) => b.value === i.value), S = Gd(y, p, C);
      S !== void 0 && i.onValueChange(S.value);
    }), g = (p) => {
      c || (i.onOpenChange(!0), w()), p && (i.triggerPointerDownPosRef.current = {
        x: Math.round(p.pageX),
        y: Math.round(p.pageY)
      });
    };
    return /* @__PURE__ */ o(Ao, { asChild: !0, ...a, children: /* @__PURE__ */ o(
      Z.button,
      {
        type: "button",
        role: "combobox",
        "aria-controls": i.contentId,
        "aria-expanded": i.open,
        "aria-required": i.required,
        "aria-autocomplete": "none",
        dir: i.dir,
        "data-state": i.open ? "open" : "closed",
        disabled: c,
        "data-disabled": c ? "" : void 0,
        "data-placeholder": Kd(i.value) ? "" : void 0,
        ...s,
        ref: d,
        onClick: U(s.onClick, (p) => {
          p.currentTarget.focus(), u.current !== "mouse" && g(p);
        }),
        onPointerDown: U(s.onPointerDown, (p) => {
          u.current = p.pointerType;
          const y = p.target;
          y.hasPointerCapture(p.pointerId) && y.releasePointerCapture(p.pointerId), p.button === 0 && p.ctrlKey === !1 && p.pointerType === "mouse" && (g(p), p.preventDefault());
        }),
        onKeyDown: U(s.onKeyDown, (p) => {
          const y = f.current !== "";
          !(p.ctrlKey || p.altKey || p.metaKey) && p.key.length === 1 && v(p.key), !(y && p.key === " ") && xb.includes(p.key) && (g(), p.preventDefault());
        })
      }
    ) });
  }
);
xd.displayName = Sd;
var Nd = "SelectValue", Ed = m.forwardRef(
  (e, t) => {
    const { __scopeSelect: n, className: r, style: s, children: a, placeholder: i = "", ...c } = e, d = Jt(Nd, n), { onValueNodeHasChildrenChange: l } = d, u = a !== void 0, f = se(t, d.onValueNodeChange);
    return Ie(() => {
      l(u);
    }, [l, u]), /* @__PURE__ */ o(
      Z.span,
      {
        ...c,
        ref: f,
        style: { pointerEvents: "none" },
        children: Kd(d.value) ? /* @__PURE__ */ o(Dt, { children: i }) : a
      }
    );
  }
);
Ed.displayName = Nd;
var Ab = "SelectIcon", Td = m.forwardRef(
  (e, t) => {
    const { __scopeSelect: n, children: r, ...s } = e;
    return /* @__PURE__ */ o(Z.span, { "aria-hidden": !0, ...s, ref: t, children: r || "▼" });
  }
);
Td.displayName = Ab;
var Pb = "SelectPortal", _d = (e) => /* @__PURE__ */ o(ur, { asChild: !0, ...e });
_d.displayName = Pb;
var yn = "SelectContent", Rd = m.forwardRef(
  (e, t) => {
    const n = Jt(yn, e.__scopeSelect), [r, s] = m.useState();
    if (Ie(() => {
      s(new DocumentFragment());
    }, []), !n.open) {
      const a = r;
      return a ? lo.createPortal(
        /* @__PURE__ */ o(Ad, { scope: e.__scopeSelect, children: /* @__PURE__ */ o(Po.Slot, { scope: e.__scopeSelect, children: /* @__PURE__ */ o("div", { children: e.children }) }) }),
        a
      ) : null;
    }
    return /* @__PURE__ */ o(Pd, { ...e, ref: t });
  }
);
Rd.displayName = yn;
var ct = 10, [Ad, Zt] = Hn(yn), Mb = "SelectContentImpl", kb = Lt("SelectContent.RemoveScroll"), Pd = m.forwardRef(
  (e, t) => {
    const {
      __scopeSelect: n,
      position: r = "item-aligned",
      onCloseAutoFocus: s,
      onEscapeKeyDown: a,
      onPointerDownOutside: i,
      //
      // PopperContent props
      side: c,
      sideOffset: d,
      align: l,
      alignOffset: u,
      arrowPadding: f,
      collisionBoundary: v,
      collisionPadding: w,
      sticky: g,
      hideWhenDetached: p,
      avoidCollisions: y,
      //
      ...C
    } = e, S = Jt(yn, n), [b, x] = m.useState(null), [E, k] = m.useState(null), T = se(t, (F) => x(F)), [P, B] = m.useState(null), [z, H] = m.useState(
      null
    ), I = Mo(n), [K, q] = m.useState(!1), ee = m.useRef(!1);
    m.useEffect(() => {
      if (b) return xo(b);
    }, [b]), Co();
    const $ = m.useCallback(
      (F) => {
        const [le, ...Fe] = I().map((we) => we.ref.current), [ie] = Fe.slice(-1), ce = document.activeElement;
        for (const we of F)
          if (we === ce || (we?.scrollIntoView({ block: "nearest" }), we === le && E && (E.scrollTop = 0), we === ie && E && (E.scrollTop = E.scrollHeight), we?.focus(), document.activeElement !== ce)) return;
      },
      [I, E]
    ), G = m.useCallback(
      () => $([P, b]),
      [$, P, b]
    );
    m.useEffect(() => {
      K && G();
    }, [K, G]);
    const { onOpenChange: O, triggerPointerDownPosRef: M } = S;
    m.useEffect(() => {
      if (b) {
        let F = { x: 0, y: 0 };
        const le = (ie) => {
          F = {
            x: Math.abs(Math.round(ie.pageX) - (M.current?.x ?? 0)),
            y: Math.abs(Math.round(ie.pageY) - (M.current?.y ?? 0))
          };
        }, Fe = (ie) => {
          F.x <= 10 && F.y <= 10 ? ie.preventDefault() : b.contains(ie.target) || O(!1), document.removeEventListener("pointermove", le), M.current = null;
        };
        return M.current !== null && (document.addEventListener("pointermove", le), document.addEventListener("pointerup", Fe, { capture: !0, once: !0 })), () => {
          document.removeEventListener("pointermove", le), document.removeEventListener("pointerup", Fe, { capture: !0 });
        };
      }
    }, [b, O, M]), m.useEffect(() => {
      const F = () => O(!1);
      return window.addEventListener("blur", F), window.addEventListener("resize", F), () => {
        window.removeEventListener("blur", F), window.removeEventListener("resize", F);
      };
    }, [O]);
    const [ae, X] = Vd((F) => {
      const le = I().filter((ce) => !ce.disabled), Fe = le.find((ce) => ce.ref.current === document.activeElement), ie = Gd(le, F, Fe);
      ie && setTimeout(() => ie.ref.current.focus());
    }), xe = m.useCallback(
      (F, le, Fe) => {
        const ie = !ee.current && !Fe;
        (S.value !== void 0 && S.value === le || ie) && (B(F), ie && (ee.current = !0));
      },
      [S.value]
    ), qe = m.useCallback(() => b?.focus(), [b]), Ne = m.useCallback(
      (F, le, Fe) => {
        const ie = !ee.current && !Fe;
        (S.value !== void 0 && S.value === le || ie) && H(F);
      },
      [S.value]
    ), He = r === "popper" ? bs : Md, je = He === bs ? {
      side: c,
      sideOffset: d,
      align: l,
      alignOffset: u,
      arrowPadding: f,
      collisionBoundary: v,
      collisionPadding: w,
      sticky: g,
      hideWhenDetached: p,
      avoidCollisions: y
    } : {};
    return /* @__PURE__ */ o(
      Ad,
      {
        scope: n,
        content: b,
        viewport: E,
        onViewportChange: k,
        itemRefCallback: xe,
        selectedItem: P,
        onItemLeave: qe,
        itemTextRefCallback: Ne,
        focusSelectedItem: G,
        selectedItemText: z,
        position: r,
        isPositioned: K,
        searchRef: ae,
        children: /* @__PURE__ */ o(fr, { as: kb, allowPinchZoom: !0, children: /* @__PURE__ */ o(
          dr,
          {
            asChild: !0,
            trapped: S.open,
            onMountAutoFocus: (F) => {
              F.preventDefault();
            },
            onUnmountAutoFocus: U(s, (F) => {
              S.trigger?.focus({ preventScroll: !0 }), F.preventDefault();
            }),
            children: /* @__PURE__ */ o(
              lr,
              {
                asChild: !0,
                disableOutsidePointerEvents: !0,
                onEscapeKeyDown: a,
                onPointerDownOutside: i,
                onFocusOutside: (F) => F.preventDefault(),
                onDismiss: () => S.onOpenChange(!1),
                children: /* @__PURE__ */ o(
                  He,
                  {
                    role: "listbox",
                    id: S.contentId,
                    "data-state": S.open ? "open" : "closed",
                    dir: S.dir,
                    onContextMenu: (F) => F.preventDefault(),
                    ...C,
                    ...je,
                    onPlaced: () => q(!0),
                    ref: T,
                    style: {
                      // flex layout so we can place the scroll buttons properly
                      display: "flex",
                      flexDirection: "column",
                      // reset the outline by default as the content MAY get focused
                      outline: "none",
                      ...C.style
                    },
                    onKeyDown: U(C.onKeyDown, (F) => {
                      const le = F.ctrlKey || F.altKey || F.metaKey;
                      if (F.key === "Tab" && F.preventDefault(), !le && F.key.length === 1 && X(F.key), ["ArrowUp", "ArrowDown", "Home", "End"].includes(F.key)) {
                        let ie = I().filter((ce) => !ce.disabled).map((ce) => ce.ref.current);
                        if (["ArrowUp", "End"].includes(F.key) && (ie = ie.slice().reverse()), ["ArrowUp", "ArrowDown"].includes(F.key)) {
                          const ce = F.target, we = ie.indexOf(ce);
                          ie = ie.slice(we + 1);
                        }
                        setTimeout(() => $(ie)), F.preventDefault();
                      }
                    })
                  }
                )
              }
            )
          }
        ) })
      }
    );
  }
);
Pd.displayName = Mb;
var Ib = "SelectItemAlignedPosition", Md = m.forwardRef((e, t) => {
  const { __scopeSelect: n, onPlaced: r, ...s } = e, a = Jt(yn, n), i = Zt(yn, n), [c, d] = m.useState(null), [l, u] = m.useState(null), f = se(t, (T) => u(T)), v = Mo(n), w = m.useRef(!1), g = m.useRef(!0), { viewport: p, selectedItem: y, selectedItemText: C, focusSelectedItem: S } = i, b = m.useCallback(() => {
    if (a.trigger && a.valueNode && c && l && p && y && C) {
      const T = a.trigger.getBoundingClientRect(), P = l.getBoundingClientRect(), B = a.valueNode.getBoundingClientRect(), z = C.getBoundingClientRect();
      if (a.dir !== "rtl") {
        const ce = z.left - P.left, we = B.left - ce, We = T.left - we, ht = T.width + We, jn = Math.max(ht, P.width), tn = window.innerWidth - ct, tt = Bi(we, [
          ct,
          // Prevents the content from going off the starting edge of the
          // viewport. It may still go off the ending edge, but this can be
          // controlled by the user since they may want to manage overflow in a
          // specific way.
          // https://github.com/radix-ui/primitives/issues/2049
          Math.max(ct, tn - jn)
        ]);
        c.style.minWidth = ht + "px", c.style.left = tt + "px";
      } else {
        const ce = P.right - z.right, we = window.innerWidth - B.right - ce, We = window.innerWidth - T.right - we, ht = T.width + We, jn = Math.max(ht, P.width), tn = window.innerWidth - ct, tt = Bi(we, [
          ct,
          Math.max(ct, tn - jn)
        ]);
        c.style.minWidth = ht + "px", c.style.right = tt + "px";
      }
      const H = v(), I = window.innerHeight - ct * 2, K = p.scrollHeight, q = window.getComputedStyle(l), ee = parseInt(q.borderTopWidth, 10), $ = parseInt(q.paddingTop, 10), G = parseInt(q.borderBottomWidth, 10), O = parseInt(q.paddingBottom, 10), M = ee + $ + K + O + G, ae = Math.min(y.offsetHeight * 5, M), X = window.getComputedStyle(p), xe = parseInt(X.paddingTop, 10), qe = parseInt(X.paddingBottom, 10), Ne = T.top + T.height / 2 - ct, He = I - Ne, je = y.offsetHeight / 2, F = y.offsetTop + je, le = ee + $ + F, Fe = M - le;
      if (le <= Ne) {
        const ce = H.length > 0 && y === H[H.length - 1].ref.current;
        c.style.bottom = "0px";
        const we = l.clientHeight - p.offsetTop - p.offsetHeight, We = Math.max(
          He,
          je + // viewport might have padding bottom, include it to avoid a scrollable viewport
          (ce ? qe : 0) + we + G
        ), ht = le + We;
        c.style.height = ht + "px";
      } else {
        const ce = H.length > 0 && y === H[0].ref.current;
        c.style.top = "0px";
        const We = Math.max(
          Ne,
          ee + p.offsetTop + // viewport might have padding top, include it to avoid a scrollable viewport
          (ce ? xe : 0) + je
        ) + Fe;
        c.style.height = We + "px", p.scrollTop = le - Ne + p.offsetTop;
      }
      c.style.margin = `${ct}px 0`, c.style.minHeight = ae + "px", c.style.maxHeight = I + "px", r?.(), requestAnimationFrame(() => w.current = !0);
    }
  }, [
    v,
    a.trigger,
    a.valueNode,
    c,
    l,
    p,
    y,
    C,
    a.dir,
    r
  ]);
  Ie(() => b(), [b]);
  const [x, E] = m.useState();
  Ie(() => {
    l && E(window.getComputedStyle(l).zIndex);
  }, [l]);
  const k = m.useCallback(
    (T) => {
      T && g.current === !0 && (b(), S?.(), g.current = !1);
    },
    [b, S]
  );
  return /* @__PURE__ */ o(
    Db,
    {
      scope: n,
      contentWrapper: c,
      shouldExpandOnScrollRef: w,
      onScrollButtonChange: k,
      children: /* @__PURE__ */ o(
        "div",
        {
          ref: d,
          style: {
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            zIndex: x
          },
          children: /* @__PURE__ */ o(
            Z.div,
            {
              ...s,
              ref: f,
              style: {
                // When we get the height of the content, it includes borders. If we were to set
                // the height without having `boxSizing: 'border-box'` it would be too big.
                boxSizing: "border-box",
                // We need to ensure the content doesn't get taller than the wrapper
                maxHeight: "100%",
                ...s.style
              }
            }
          )
        }
      )
    }
  );
});
Md.displayName = Ib;
var Ob = "SelectPopperPosition", bs = m.forwardRef((e, t) => {
  const {
    __scopeSelect: n,
    align: r = "start",
    collisionPadding: s = ct,
    ...a
  } = e, i = ko(n);
  return /* @__PURE__ */ o(
    la,
    {
      ...i,
      ...a,
      ref: t,
      align: r,
      collisionPadding: s,
      style: {
        // Ensure border-box for floating-ui calculations
        boxSizing: "border-box",
        ...a.style,
        "--radix-select-content-transform-origin": "var(--radix-popper-transform-origin)",
        "--radix-select-content-available-width": "var(--radix-popper-available-width)",
        "--radix-select-content-available-height": "var(--radix-popper-available-height)",
        "--radix-select-trigger-width": "var(--radix-popper-anchor-width)",
        "--radix-select-trigger-height": "var(--radix-popper-anchor-height)"
      }
    }
  );
});
bs.displayName = Ob;
var [Db, ua] = Hn(yn, {}), Cs = "SelectViewport", kd = m.forwardRef(
  (e, t) => {
    const { __scopeSelect: n, nonce: r, ...s } = e, a = Zt(Cs, n), i = ua(Cs, n), c = se(t, a.onViewportChange), d = m.useRef(0);
    return /* @__PURE__ */ h(Dt, { children: [
      /* @__PURE__ */ o(
        "style",
        {
          dangerouslySetInnerHTML: {
            __html: "[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}"
          },
          nonce: r
        }
      ),
      /* @__PURE__ */ o(Po.Slot, { scope: n, children: /* @__PURE__ */ o(
        Z.div,
        {
          "data-radix-select-viewport": "",
          role: "presentation",
          ...s,
          ref: c,
          style: {
            // we use position: 'relative' here on the `viewport` so that when we call
            // `selectedItem.offsetTop` in calculations, the offset is relative to the viewport
            // (independent of the scrollUpButton).
            position: "relative",
            flex: 1,
            // Viewport should only be scrollable in the vertical direction.
            // This won't work in vertical writing modes, so we'll need to
            // revisit this if/when that is supported
            // https://developer.chrome.com/blog/vertical-form-controls
            overflow: "hidden auto",
            ...s.style
          },
          onScroll: U(s.onScroll, (l) => {
            const u = l.currentTarget, { contentWrapper: f, shouldExpandOnScrollRef: v } = i;
            if (v?.current && f) {
              const w = Math.abs(d.current - u.scrollTop);
              if (w > 0) {
                const g = window.innerHeight - ct * 2, p = parseFloat(f.style.minHeight), y = parseFloat(f.style.height), C = Math.max(p, y);
                if (C < g) {
                  const S = C + w, b = Math.min(g, S), x = S - b;
                  f.style.height = b + "px", f.style.bottom === "0px" && (u.scrollTop = x > 0 ? x : 0, f.style.justifyContent = "flex-end");
                }
              }
            }
            d.current = u.scrollTop;
          })
        }
      ) })
    ] });
  }
);
kd.displayName = Cs;
var Id = "SelectGroup", [Fb, Lb] = Hn(Id), $b = m.forwardRef(
  (e, t) => {
    const { __scopeSelect: n, ...r } = e, s = Ct();
    return /* @__PURE__ */ o(Fb, { scope: n, id: s, children: /* @__PURE__ */ o(Z.div, { role: "group", "aria-labelledby": s, ...r, ref: t }) });
  }
);
$b.displayName = Id;
var Od = "SelectLabel", Dd = m.forwardRef(
  (e, t) => {
    const { __scopeSelect: n, ...r } = e, s = Lb(Od, n);
    return /* @__PURE__ */ o(Z.div, { id: s.id, ...r, ref: t });
  }
);
Dd.displayName = Od;
var Gr = "SelectItem", [Ub, Fd] = Hn(Gr), Ld = m.forwardRef(
  (e, t) => {
    const {
      __scopeSelect: n,
      value: r,
      disabled: s = !1,
      textValue: a,
      ...i
    } = e, c = Jt(Gr, n), d = Zt(Gr, n), l = c.value === r, [u, f] = m.useState(a ?? ""), [v, w] = m.useState(!1), g = se(
      t,
      (S) => d.itemRefCallback?.(S, r, s)
    ), p = Ct(), y = m.useRef("touch"), C = () => {
      s || (c.onValueChange(r), c.onOpenChange(!1));
    };
    if (r === "")
      throw new Error(
        "A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder."
      );
    return /* @__PURE__ */ o(
      Ub,
      {
        scope: n,
        value: r,
        disabled: s,
        textId: p,
        isSelected: l,
        onItemTextChange: m.useCallback((S) => {
          f((b) => b || (S?.textContent ?? "").trim());
        }, []),
        children: /* @__PURE__ */ o(
          Po.ItemSlot,
          {
            scope: n,
            value: r,
            disabled: s,
            textValue: u,
            children: /* @__PURE__ */ o(
              Z.div,
              {
                role: "option",
                "aria-labelledby": p,
                "data-highlighted": v ? "" : void 0,
                "aria-selected": l && v,
                "data-state": l ? "checked" : "unchecked",
                "aria-disabled": s || void 0,
                "data-disabled": s ? "" : void 0,
                tabIndex: s ? void 0 : -1,
                ...i,
                ref: g,
                onFocus: U(i.onFocus, () => w(!0)),
                onBlur: U(i.onBlur, () => w(!1)),
                onClick: U(i.onClick, () => {
                  y.current !== "mouse" && C();
                }),
                onPointerUp: U(i.onPointerUp, () => {
                  y.current === "mouse" && C();
                }),
                onPointerDown: U(i.onPointerDown, (S) => {
                  y.current = S.pointerType;
                }),
                onPointerMove: U(i.onPointerMove, (S) => {
                  y.current = S.pointerType, s ? d.onItemLeave?.() : y.current === "mouse" && S.currentTarget.focus({ preventScroll: !0 });
                }),
                onPointerLeave: U(i.onPointerLeave, (S) => {
                  S.currentTarget === document.activeElement && d.onItemLeave?.();
                }),
                onKeyDown: U(i.onKeyDown, (S) => {
                  d.searchRef?.current !== "" && S.key === " " || (Nb.includes(S.key) && C(), S.key === " " && S.preventDefault());
                })
              }
            )
          }
        )
      }
    );
  }
);
Ld.displayName = Gr;
var Qn = "SelectItemText", $d = m.forwardRef(
  (e, t) => {
    const { __scopeSelect: n, className: r, style: s, ...a } = e, i = Jt(Qn, n), c = Zt(Qn, n), d = Fd(Qn, n), l = Rb(Qn, n), [u, f] = m.useState(null), v = se(
      t,
      (C) => f(C),
      d.onItemTextChange,
      (C) => c.itemTextRefCallback?.(C, d.value, d.disabled)
    ), w = u?.textContent, g = m.useMemo(
      () => /* @__PURE__ */ o("option", { value: d.value, disabled: d.disabled, children: w }, d.value),
      [d.disabled, d.value, w]
    ), { onNativeOptionAdd: p, onNativeOptionRemove: y } = l;
    return Ie(() => (p(g), () => y(g)), [p, y, g]), /* @__PURE__ */ h(Dt, { children: [
      /* @__PURE__ */ o(Z.span, { id: d.textId, ...a, ref: v }),
      d.isSelected && i.valueNode && !i.valueNodeHasChildren ? lo.createPortal(a.children, i.valueNode) : null
    ] });
  }
);
$d.displayName = Qn;
var Ud = "SelectItemIndicator", Bd = m.forwardRef(
  (e, t) => {
    const { __scopeSelect: n, ...r } = e;
    return Fd(Ud, n).isSelected ? /* @__PURE__ */ o(Z.span, { "aria-hidden": !0, ...r, ref: t }) : null;
  }
);
Bd.displayName = Ud;
var Ss = "SelectScrollUpButton", zd = m.forwardRef((e, t) => {
  const n = Zt(Ss, e.__scopeSelect), r = ua(Ss, e.__scopeSelect), [s, a] = m.useState(!1), i = se(t, r.onScrollButtonChange);
  return Ie(() => {
    if (n.viewport && n.isPositioned) {
      let c = function() {
        const l = d.scrollTop > 0;
        a(l);
      };
      const d = n.viewport;
      return c(), d.addEventListener("scroll", c), () => d.removeEventListener("scroll", c);
    }
  }, [n.viewport, n.isPositioned]), s ? /* @__PURE__ */ o(
    Hd,
    {
      ...e,
      ref: i,
      onAutoScroll: () => {
        const { viewport: c, selectedItem: d } = n;
        c && d && (c.scrollTop = c.scrollTop - d.offsetHeight);
      }
    }
  ) : null;
});
zd.displayName = Ss;
var xs = "SelectScrollDownButton", qd = m.forwardRef((e, t) => {
  const n = Zt(xs, e.__scopeSelect), r = ua(xs, e.__scopeSelect), [s, a] = m.useState(!1), i = se(t, r.onScrollButtonChange);
  return Ie(() => {
    if (n.viewport && n.isPositioned) {
      let c = function() {
        const l = d.scrollHeight - d.clientHeight, u = Math.ceil(d.scrollTop) < l;
        a(u);
      };
      const d = n.viewport;
      return c(), d.addEventListener("scroll", c), () => d.removeEventListener("scroll", c);
    }
  }, [n.viewport, n.isPositioned]), s ? /* @__PURE__ */ o(
    Hd,
    {
      ...e,
      ref: i,
      onAutoScroll: () => {
        const { viewport: c, selectedItem: d } = n;
        c && d && (c.scrollTop = c.scrollTop + d.offsetHeight);
      }
    }
  ) : null;
});
qd.displayName = xs;
var Hd = m.forwardRef((e, t) => {
  const { __scopeSelect: n, onAutoScroll: r, ...s } = e, a = Zt("SelectScrollButton", n), i = m.useRef(null), c = Mo(n), d = m.useCallback(() => {
    i.current !== null && (window.clearInterval(i.current), i.current = null);
  }, []);
  return m.useEffect(() => () => d(), [d]), Ie(() => {
    c().find((u) => u.ref.current === document.activeElement)?.ref.current?.scrollIntoView({ block: "nearest" });
  }, [c]), /* @__PURE__ */ o(
    Z.div,
    {
      "aria-hidden": !0,
      ...s,
      ref: t,
      style: { flexShrink: 0, ...s.style },
      onPointerDown: U(s.onPointerDown, () => {
        i.current === null && (i.current = window.setInterval(r, 50));
      }),
      onPointerMove: U(s.onPointerMove, () => {
        a.onItemLeave?.(), i.current === null && (i.current = window.setInterval(r, 50));
      }),
      onPointerLeave: U(s.onPointerLeave, () => {
        d();
      })
    }
  );
}), Bb = "SelectSeparator", jd = m.forwardRef(
  (e, t) => {
    const { __scopeSelect: n, ...r } = e;
    return /* @__PURE__ */ o(Z.div, { "aria-hidden": !0, ...r, ref: t });
  }
);
jd.displayName = Bb;
var Ns = "SelectArrow", zb = m.forwardRef(
  (e, t) => {
    const { __scopeSelect: n, ...r } = e, s = ko(n), a = Jt(Ns, n), i = Zt(Ns, n);
    return a.open && i.position === "popper" ? /* @__PURE__ */ o(da, { ...s, ...r, ref: t }) : null;
  }
);
zb.displayName = Ns;
var qb = "SelectBubbleInput", Wd = m.forwardRef(
  ({ __scopeSelect: e, value: t, ...n }, r) => {
    const s = m.useRef(null), a = se(r, s), i = ul(t);
    return m.useEffect(() => {
      const c = s.current;
      if (!c) return;
      const d = window.HTMLSelectElement.prototype, u = Object.getOwnPropertyDescriptor(
        d,
        "value"
      ).set;
      if (i !== t && u) {
        const f = new Event("change", { bubbles: !0 });
        u.call(c, t), c.dispatchEvent(f);
      }
    }, [i, t]), /* @__PURE__ */ o(
      Z.select,
      {
        ...n,
        style: { ...bd, ...n.style },
        ref: a,
        defaultValue: t
      }
    );
  }
);
Wd.displayName = qb;
function Kd(e) {
  return e === "" || e === void 0;
}
function Vd(e) {
  const t = lt(e), n = m.useRef(""), r = m.useRef(0), s = m.useCallback(
    (i) => {
      const c = n.current + i;
      t(c), function d(l) {
        n.current = l, window.clearTimeout(r.current), l !== "" && (r.current = window.setTimeout(() => d(""), 1e3));
      }(c);
    },
    [t]
  ), a = m.useCallback(() => {
    n.current = "", window.clearTimeout(r.current);
  }, []);
  return m.useEffect(() => () => window.clearTimeout(r.current), []), [n, s, a];
}
function Gd(e, t, n) {
  const s = t.length > 1 && Array.from(t).every((l) => l === t[0]) ? t[0] : t, a = n ? e.indexOf(n) : -1;
  let i = Hb(e, Math.max(a, 0));
  s.length === 1 && (i = i.filter((l) => l !== n));
  const d = i.find(
    (l) => l.textValue.toLowerCase().startsWith(s.toLowerCase())
  );
  return d !== n ? d : void 0;
}
function Hb(e, t) {
  return e.map((n, r) => e[(t + r) % e.length]);
}
var jb = Cd, Qd = xd, Wb = Ed, Kb = Td, Vb = _d, Yd = Rd, Gb = kd, Xd = Dd, Jd = Ld, Qb = $d, Yb = Bd, Zd = zd, eu = qd, tu = jd;
const Xb = jb, Jb = Wb, nu = m.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ h(
  Qd,
  {
    ref: r,
    className: te(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      e
    ),
    ...n,
    children: [
      t,
      /* @__PURE__ */ o(Kb, { asChild: !0, children: /* @__PURE__ */ o(Ps, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
nu.displayName = Qd.displayName;
const ru = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(
  Zd,
  {
    ref: n,
    className: te("flex cursor-default items-center justify-center py-1", e),
    ...t,
    children: /* @__PURE__ */ o(pp, { className: "h-4 w-4" })
  }
));
ru.displayName = Zd.displayName;
const ou = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(
  eu,
  {
    ref: n,
    className: te("flex cursor-default items-center justify-center py-1", e),
    ...t,
    children: /* @__PURE__ */ o(Ps, { className: "h-4 w-4" })
  }
));
ou.displayName = eu.displayName;
const su = m.forwardRef(({ className: e, children: t, position: n = "popper", ...r }, s) => /* @__PURE__ */ o(Vb, { children: /* @__PURE__ */ h(
  Yd,
  {
    ref: s,
    className: te(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      n === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      e
    ),
    position: n,
    ...r,
    children: [
      /* @__PURE__ */ o(ru, {}),
      /* @__PURE__ */ o(
        Gb,
        {
          className: te(
            "p-1",
            n === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children: t
        }
      ),
      /* @__PURE__ */ o(ou, {})
    ]
  }
) }));
su.displayName = Yd.displayName;
const Zb = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(Xd, { ref: n, className: te("py-1.5 pl-8 pr-2 text-sm font-semibold", e), ...t }));
Zb.displayName = Xd.displayName;
const Wt = m.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ h(
  Jd,
  {
    ref: r,
    className: te(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      e
    ),
    ...n,
    children: [
      /* @__PURE__ */ o("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ o(Yb, { children: /* @__PURE__ */ o(Ms, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ o(Qb, { children: t })
    ]
  }
));
Wt.displayName = Jd.displayName;
const eC = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(tu, { ref: n, className: te("-mx-1 my-1 h-px bg-muted", e), ...t }));
eC.displayName = tu.displayName;
var Io = "Popover", [au] = Bt(Io, [
  qn
]), mr = qn(), [tC, en] = au(Io), iu = (e) => {
  const {
    __scopePopover: t,
    children: n,
    open: r,
    defaultOpen: s,
    onOpenChange: a,
    modal: i = !1
  } = e, c = mr(t), d = m.useRef(null), [l, u] = m.useState(!1), [f, v] = pn({
    prop: r,
    defaultProp: s ?? !1,
    onChange: a,
    caller: Io
  });
  return /* @__PURE__ */ o(ca, { ...c, children: /* @__PURE__ */ o(
    tC,
    {
      scope: t,
      contentId: Ct(),
      triggerRef: d,
      open: f,
      onOpenChange: v,
      onOpenToggle: m.useCallback(() => v((w) => !w), [v]),
      hasCustomAnchor: l,
      onCustomAnchorAdd: m.useCallback(() => u(!0), []),
      onCustomAnchorRemove: m.useCallback(() => u(!1), []),
      modal: i,
      children: n
    }
  ) });
};
iu.displayName = Io;
var cu = "PopoverAnchor", nC = m.forwardRef(
  (e, t) => {
    const { __scopePopover: n, ...r } = e, s = en(cu, n), a = mr(n), { onCustomAnchorAdd: i, onCustomAnchorRemove: c } = s;
    return m.useEffect(() => (i(), () => c()), [i, c]), /* @__PURE__ */ o(Ao, { ...a, ...r, ref: t });
  }
);
nC.displayName = cu;
var lu = "PopoverTrigger", du = m.forwardRef(
  (e, t) => {
    const { __scopePopover: n, ...r } = e, s = en(lu, n), a = mr(n), i = se(t, s.triggerRef), c = /* @__PURE__ */ o(
      Z.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": s.open,
        "aria-controls": s.contentId,
        "data-state": hu(s.open),
        ...r,
        ref: i,
        onClick: U(e.onClick, s.onOpenToggle)
      }
    );
    return s.hasCustomAnchor ? c : /* @__PURE__ */ o(Ao, { asChild: !0, ...a, children: c });
  }
);
du.displayName = lu;
var fa = "PopoverPortal", [rC, oC] = au(fa, {
  forceMount: void 0
}), uu = (e) => {
  const { __scopePopover: t, forceMount: n, children: r, container: s } = e, a = en(fa, t);
  return /* @__PURE__ */ o(rC, { scope: t, forceMount: n, children: /* @__PURE__ */ o(_t, { present: n || a.open, children: /* @__PURE__ */ o(ur, { asChild: !0, container: s, children: r }) }) });
};
uu.displayName = fa;
var Dn = "PopoverContent", fu = m.forwardRef(
  (e, t) => {
    const n = oC(Dn, e.__scopePopover), { forceMount: r = n.forceMount, ...s } = e, a = en(Dn, e.__scopePopover);
    return /* @__PURE__ */ o(_t, { present: r || a.open, children: a.modal ? /* @__PURE__ */ o(aC, { ...s, ref: t }) : /* @__PURE__ */ o(iC, { ...s, ref: t }) });
  }
);
fu.displayName = Dn;
var sC = Lt("PopoverContent.RemoveScroll"), aC = m.forwardRef(
  (e, t) => {
    const n = en(Dn, e.__scopePopover), r = m.useRef(null), s = se(t, r), a = m.useRef(!1);
    return m.useEffect(() => {
      const i = r.current;
      if (i) return xo(i);
    }, []), /* @__PURE__ */ o(fr, { as: sC, allowPinchZoom: !0, children: /* @__PURE__ */ o(
      pu,
      {
        ...e,
        ref: s,
        trapFocus: n.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: U(e.onCloseAutoFocus, (i) => {
          i.preventDefault(), a.current || n.triggerRef.current?.focus();
        }),
        onPointerDownOutside: U(
          e.onPointerDownOutside,
          (i) => {
            const c = i.detail.originalEvent, d = c.button === 0 && c.ctrlKey === !0, l = c.button === 2 || d;
            a.current = l;
          },
          { checkForDefaultPrevented: !1 }
        ),
        onFocusOutside: U(
          e.onFocusOutside,
          (i) => i.preventDefault(),
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
), iC = m.forwardRef(
  (e, t) => {
    const n = en(Dn, e.__scopePopover), r = m.useRef(!1), s = m.useRef(!1);
    return /* @__PURE__ */ o(
      pu,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (a) => {
          e.onCloseAutoFocus?.(a), a.defaultPrevented || (r.current || n.triggerRef.current?.focus(), a.preventDefault()), r.current = !1, s.current = !1;
        },
        onInteractOutside: (a) => {
          e.onInteractOutside?.(a), a.defaultPrevented || (r.current = !0, a.detail.originalEvent.type === "pointerdown" && (s.current = !0));
          const i = a.target;
          n.triggerRef.current?.contains(i) && a.preventDefault(), a.detail.originalEvent.type === "focusin" && s.current && a.preventDefault();
        }
      }
    );
  }
), pu = m.forwardRef(
  (e, t) => {
    const {
      __scopePopover: n,
      trapFocus: r,
      onOpenAutoFocus: s,
      onCloseAutoFocus: a,
      disableOutsidePointerEvents: i,
      onEscapeKeyDown: c,
      onPointerDownOutside: d,
      onFocusOutside: l,
      onInteractOutside: u,
      ...f
    } = e, v = en(Dn, n), w = mr(n);
    return Co(), /* @__PURE__ */ o(
      dr,
      {
        asChild: !0,
        loop: !0,
        trapped: r,
        onMountAutoFocus: s,
        onUnmountAutoFocus: a,
        children: /* @__PURE__ */ o(
          lr,
          {
            asChild: !0,
            disableOutsidePointerEvents: i,
            onInteractOutside: u,
            onEscapeKeyDown: c,
            onPointerDownOutside: d,
            onFocusOutside: l,
            onDismiss: () => v.onOpenChange(!1),
            children: /* @__PURE__ */ o(
              la,
              {
                "data-state": hu(v.open),
                role: "dialog",
                id: v.contentId,
                ...w,
                ...f,
                ref: t,
                style: {
                  ...f.style,
                  "--radix-popover-content-transform-origin": "var(--radix-popper-transform-origin)",
                  "--radix-popover-content-available-width": "var(--radix-popper-available-width)",
                  "--radix-popover-content-available-height": "var(--radix-popper-available-height)",
                  "--radix-popover-trigger-width": "var(--radix-popper-anchor-width)",
                  "--radix-popover-trigger-height": "var(--radix-popper-anchor-height)"
                }
              }
            )
          }
        )
      }
    );
  }
), mu = "PopoverClose", cC = m.forwardRef(
  (e, t) => {
    const { __scopePopover: n, ...r } = e, s = en(mu, n);
    return /* @__PURE__ */ o(
      Z.button,
      {
        type: "button",
        ...r,
        ref: t,
        onClick: U(e.onClick, () => s.onOpenChange(!1))
      }
    );
  }
);
cC.displayName = mu;
var lC = "PopoverArrow", dC = m.forwardRef(
  (e, t) => {
    const { __scopePopover: n, ...r } = e, s = mr(n);
    return /* @__PURE__ */ o(da, { ...s, ...r, ref: t });
  }
);
dC.displayName = lC;
function hu(e) {
  return e ? "open" : "closed";
}
var uC = iu, fC = du, pC = uu, gu = fu;
const mC = uC, hC = fC, yu = m.forwardRef(({ className: e, align: t = "center", sideOffset: n = 4, ...r }, s) => /* @__PURE__ */ o(pC, { children: /* @__PURE__ */ o(
  gu,
  {
    ref: s,
    align: t,
    sideOffset: n,
    className: te(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      e
    ),
    ...r
  }
) }));
yu.displayName = gu.displayName;
const gC = [
  { name: "Hitam", value: "#000000" },
  { name: "Putih", value: "#FFFFFF" },
  { name: "Merah", value: "#EF4444" },
  { name: "Biru", value: "#3B82F6" },
  { name: "Hijau", value: "#10B981" },
  { name: "Kuning", value: "#F59E0B" },
  { name: "Ungu", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Abu-abu", value: "#6B7280" },
  { name: "Coklat", value: "#92400E" },
  { name: "Emas", value: "#FFD700" },
  { name: "Perak", value: "#C0C0C0" }
], Es = m.forwardRef(
  ({ value: e, onChange: t, label: n = "Pilih Warna", showPresets: r = !0, required: s = !1 }, a) => {
    const [i, c] = m.useState(!1), [d, l] = m.useState("#000000"), [u, f] = m.useState("#FFFFFF"), [v, w] = m.useState(!1), g = (S) => {
      t(S), c(!1);
    }, p = () => {
      const S = `linear-gradient(to right, ${d}, ${u})`;
      t(S), c(!1);
    }, y = e.startsWith("linear-gradient"), C = y ? d : e.startsWith("#") ? e : "#000000";
    return /* @__PURE__ */ h("div", { className: "space-y-2", children: [
      n && /* @__PURE__ */ h(Pe, { className: "text-sm font-medium text-foreground", children: [
        n,
        " ",
        s && /* @__PURE__ */ o("span", { className: "text-destructive", children: "*" })
      ] }),
      /* @__PURE__ */ h("div", { className: "space-y-3", children: [
        /* @__PURE__ */ o(
          nt,
          {
            ref: a,
            type: "text",
            value: e,
            onChange: (S) => t(S.target.value),
            placeholder: "Contoh: Hitam, Putih, atau #FF0000",
            className: "w-full",
            required: s
          }
        ),
        /* @__PURE__ */ h(mC, { open: i, onOpenChange: c, children: [
          /* @__PURE__ */ o(hC, { asChild: !0, children: /* @__PURE__ */ h(
            J,
            {
              type: "button",
              variant: "outline",
              className: "w-full justify-start gap-2",
              children: [
                /* @__PURE__ */ o(ss, { className: "h-4 w-4" }),
                /* @__PURE__ */ o("span", { children: "Pilih dari Color Picker" }),
                /* @__PURE__ */ o(
                  "div",
                  {
                    className: "ml-auto w-6 h-6 rounded border-2 border-border",
                    style: {
                      background: y ? e : C
                    }
                  }
                )
              ]
            }
          ) }),
          /* @__PURE__ */ o(yu, { className: "w-80 p-4", align: "start", children: /* @__PURE__ */ h("div", { className: "space-y-4", children: [
            /* @__PURE__ */ h("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ o(
                J,
                {
                  type: "button",
                  variant: v ? "outline" : "default",
                  size: "sm",
                  onClick: () => w(!1),
                  className: "flex-1",
                  children: "Solid Color"
                }
              ),
              /* @__PURE__ */ o(
                J,
                {
                  type: "button",
                  variant: v ? "default" : "outline",
                  size: "sm",
                  onClick: () => w(!0),
                  className: "flex-1",
                  children: "Gradient"
                }
              )
            ] }),
            v ? /* @__PURE__ */ o(Dt, { children: /* @__PURE__ */ h("div", { className: "space-y-3", children: [
              /* @__PURE__ */ o(Pe, { className: "text-sm font-semibold text-foreground", children: "Buat Gradasi Warna:" }),
              /* @__PURE__ */ h("div", { className: "space-y-2", children: [
                /* @__PURE__ */ o(Pe, { className: "text-xs text-muted-foreground", children: "Warna Awal:" }),
                /* @__PURE__ */ h("div", { className: "flex gap-2 items-center", children: [
                  /* @__PURE__ */ o(
                    "input",
                    {
                      type: "color",
                      value: d,
                      onChange: (S) => l(S.target.value),
                      className: "w-full h-10 rounded border-2 border-border cursor-pointer"
                    }
                  ),
                  /* @__PURE__ */ o(
                    "div",
                    {
                      className: "w-10 h-10 rounded border-2 border-border flex-shrink-0",
                      style: { backgroundColor: d }
                    }
                  ),
                  /* @__PURE__ */ o("span", { className: "text-xs text-muted-foreground font-mono", children: d.toUpperCase() })
                ] })
              ] }),
              /* @__PURE__ */ h("div", { className: "space-y-2", children: [
                /* @__PURE__ */ o(Pe, { className: "text-xs text-muted-foreground", children: "Warna Akhir:" }),
                /* @__PURE__ */ h("div", { className: "flex gap-2 items-center", children: [
                  /* @__PURE__ */ o(
                    "input",
                    {
                      type: "color",
                      value: u,
                      onChange: (S) => f(S.target.value),
                      className: "w-full h-10 rounded border-2 border-border cursor-pointer"
                    }
                  ),
                  /* @__PURE__ */ o(
                    "div",
                    {
                      className: "w-10 h-10 rounded border-2 border-border flex-shrink-0",
                      style: { backgroundColor: u }
                    }
                  ),
                  /* @__PURE__ */ o("span", { className: "text-xs text-muted-foreground font-mono", children: u.toUpperCase() })
                ] })
              ] }),
              /* @__PURE__ */ h("div", { className: "p-3 bg-muted/50 rounded-lg border border-border", children: [
                /* @__PURE__ */ o(Pe, { className: "text-xs text-muted-foreground mb-2 block", children: "Preview Gradasi:" }),
                /* @__PURE__ */ o(
                  "div",
                  {
                    className: "w-full h-16 rounded border-2 border-border",
                    style: {
                      background: `linear-gradient(to right, ${d}, ${u})`
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ o(
                J,
                {
                  type: "button",
                  onClick: p,
                  className: "w-full",
                  children: "Terapkan Gradasi"
                }
              )
            ] }) }) : /* @__PURE__ */ h(Dt, { children: [
              /* @__PURE__ */ h("div", { className: "space-y-2", children: [
                /* @__PURE__ */ o(Pe, { className: "text-sm font-semibold text-foreground", children: "Pilih Warna Dinamis:" }),
                /* @__PURE__ */ h("div", { className: "flex gap-3 items-center p-3 bg-muted/50 rounded-lg border border-border", children: [
                  /* @__PURE__ */ o("div", { className: "flex-1", children: /* @__PURE__ */ o(
                    "input",
                    {
                      type: "color",
                      value: C,
                      onChange: (S) => t(S.target.value),
                      className: "w-full h-12 rounded border-2 border-border cursor-pointer bg-background",
                      style: { minHeight: "48px" }
                    }
                  ) }),
                  /* @__PURE__ */ h("div", { className: "flex flex-col gap-1", children: [
                    /* @__PURE__ */ o(
                      "div",
                      {
                        className: "w-16 h-12 rounded border-2 border-border shadow-sm",
                        style: { backgroundColor: C }
                      }
                    ),
                    /* @__PURE__ */ o("span", { className: "text-xs text-center text-muted-foreground font-mono", children: C.toUpperCase() })
                  ] })
                ] }),
                /* @__PURE__ */ o("p", { className: "text-xs text-muted-foreground italic", children: "💡 Klik pada kotak warna untuk membuka color picker" })
              ] }),
              r && /* @__PURE__ */ h("div", { className: "border-t border-border pt-3", children: [
                /* @__PURE__ */ o(Pe, { className: "text-sm font-medium text-foreground mb-2 block", children: "Atau Pilih Warna Template:" }),
                /* @__PURE__ */ o("div", { className: "grid grid-cols-4 gap-2", children: gC.map((S) => /* @__PURE__ */ h(
                  "button",
                  {
                    type: "button",
                    onClick: () => g(S.value),
                    className: "flex flex-col items-center gap-1 p-2 rounded hover:bg-muted transition-colors",
                    title: S.name,
                    children: [
                      /* @__PURE__ */ o(
                        "div",
                        {
                          className: "w-8 h-8 rounded border-2 border-border shadow-sm",
                          style: { backgroundColor: S.value }
                        }
                      ),
                      /* @__PURE__ */ o("span", { className: "text-xs text-muted-foreground", children: S.name })
                    ]
                  },
                  S.value
                )) })
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ h("div", { className: "flex items-center gap-2 p-2 bg-muted/30 rounded border border-border", children: [
          /* @__PURE__ */ o(
            "div",
            {
              className: "w-8 h-8 rounded border-2 border-border shadow-sm flex-shrink-0",
              style: {
                background: y ? e : C
              }
            }
          ),
          /* @__PURE__ */ h("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ o("p", { className: "text-xs text-muted-foreground", children: "Preview Warna:" }),
            /* @__PURE__ */ o("p", { className: "text-xs font-mono text-foreground truncate", children: e || "Belum dipilih" })
          ] })
        ] })
      ] })
    ] });
  }
);
Es.displayName = "ColorPicker";
var ns = "rovingFocusGroup.onEntryFocus", yC = { bubbles: !1, cancelable: !0 }, hr = "RovingFocusGroup", [Ts, vu, vC] = Js(hr), [wC, wu] = Bt(
  hr,
  [vC]
), [bC, CC] = wC(hr), bu = m.forwardRef(
  (e, t) => /* @__PURE__ */ o(Ts.Provider, { scope: e.__scopeRovingFocusGroup, children: /* @__PURE__ */ o(Ts.Slot, { scope: e.__scopeRovingFocusGroup, children: /* @__PURE__ */ o(SC, { ...e, ref: t }) }) })
);
bu.displayName = hr;
var SC = m.forwardRef((e, t) => {
  const {
    __scopeRovingFocusGroup: n,
    orientation: r,
    loop: s = !1,
    dir: a,
    currentTabStopId: i,
    defaultCurrentTabStopId: c,
    onCurrentTabStopIdChange: d,
    onEntryFocus: l,
    preventScrollOnEntryFocus: u = !1,
    ...f
  } = e, v = m.useRef(null), w = se(t, v), g = Zs(a), [p, y] = pn({
    prop: i,
    defaultProp: c ?? null,
    onChange: d,
    caller: hr
  }), [C, S] = m.useState(!1), b = lt(l), x = vu(n), E = m.useRef(!1), [k, T] = m.useState(0);
  return m.useEffect(() => {
    const P = v.current;
    if (P)
      return P.addEventListener(ns, b), () => P.removeEventListener(ns, b);
  }, [b]), /* @__PURE__ */ o(
    bC,
    {
      scope: n,
      orientation: r,
      dir: g,
      loop: s,
      currentTabStopId: p,
      onItemFocus: m.useCallback(
        (P) => y(P),
        [y]
      ),
      onItemShiftTab: m.useCallback(() => S(!0), []),
      onFocusableItemAdd: m.useCallback(
        () => T((P) => P + 1),
        []
      ),
      onFocusableItemRemove: m.useCallback(
        () => T((P) => P - 1),
        []
      ),
      children: /* @__PURE__ */ o(
        Z.div,
        {
          tabIndex: C || k === 0 ? -1 : 0,
          "data-orientation": r,
          ...f,
          ref: w,
          style: { outline: "none", ...e.style },
          onMouseDown: U(e.onMouseDown, () => {
            E.current = !0;
          }),
          onFocus: U(e.onFocus, (P) => {
            const B = !E.current;
            if (P.target === P.currentTarget && B && !C) {
              const z = new CustomEvent(ns, yC);
              if (P.currentTarget.dispatchEvent(z), !z.defaultPrevented) {
                const H = x().filter(($) => $.focusable), I = H.find(($) => $.active), K = H.find(($) => $.id === p), ee = [I, K, ...H].filter(
                  Boolean
                ).map(($) => $.ref.current);
                xu(ee, u);
              }
            }
            E.current = !1;
          }),
          onBlur: U(e.onBlur, () => S(!1))
        }
      )
    }
  );
}), Cu = "RovingFocusGroupItem", Su = m.forwardRef(
  (e, t) => {
    const {
      __scopeRovingFocusGroup: n,
      focusable: r = !0,
      active: s = !1,
      tabStopId: a,
      children: i,
      ...c
    } = e, d = Ct(), l = a || d, u = CC(Cu, n), f = u.currentTabStopId === l, v = vu(n), { onFocusableItemAdd: w, onFocusableItemRemove: g, currentTabStopId: p } = u;
    return m.useEffect(() => {
      if (r)
        return w(), () => g();
    }, [r, w, g]), /* @__PURE__ */ o(
      Ts.ItemSlot,
      {
        scope: n,
        id: l,
        focusable: r,
        active: s,
        children: /* @__PURE__ */ o(
          Z.span,
          {
            tabIndex: f ? 0 : -1,
            "data-orientation": u.orientation,
            ...c,
            ref: t,
            onMouseDown: U(e.onMouseDown, (y) => {
              r ? u.onItemFocus(l) : y.preventDefault();
            }),
            onFocus: U(e.onFocus, () => u.onItemFocus(l)),
            onKeyDown: U(e.onKeyDown, (y) => {
              if (y.key === "Tab" && y.shiftKey) {
                u.onItemShiftTab();
                return;
              }
              if (y.target !== y.currentTarget) return;
              const C = EC(y, u.orientation, u.dir);
              if (C !== void 0) {
                if (y.metaKey || y.ctrlKey || y.altKey || y.shiftKey) return;
                y.preventDefault();
                let b = v().filter((x) => x.focusable).map((x) => x.ref.current);
                if (C === "last") b.reverse();
                else if (C === "prev" || C === "next") {
                  C === "prev" && b.reverse();
                  const x = b.indexOf(y.currentTarget);
                  b = u.loop ? TC(b, x + 1) : b.slice(x + 1);
                }
                setTimeout(() => xu(b));
              }
            }),
            children: typeof i == "function" ? i({ isCurrentTabStop: f, hasTabStop: p != null }) : i
          }
        )
      }
    );
  }
);
Su.displayName = Cu;
var xC = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function NC(e, t) {
  return t !== "rtl" ? e : e === "ArrowLeft" ? "ArrowRight" : e === "ArrowRight" ? "ArrowLeft" : e;
}
function EC(e, t, n) {
  const r = NC(e.key, n);
  if (!(t === "vertical" && ["ArrowLeft", "ArrowRight"].includes(r)) && !(t === "horizontal" && ["ArrowUp", "ArrowDown"].includes(r)))
    return xC[r];
}
function xu(e, t = !1) {
  const n = document.activeElement;
  for (const r of e)
    if (r === n || (r.focus({ preventScroll: t }), document.activeElement !== n)) return;
}
function TC(e, t) {
  return e.map((n, r) => e[(t + r) % e.length]);
}
var _C = bu, RC = Su, _s = ["Enter", " "], AC = ["ArrowDown", "PageUp", "Home"], Nu = ["ArrowUp", "PageDown", "End"], PC = [...AC, ...Nu], MC = {
  ltr: [..._s, "ArrowRight"],
  rtl: [..._s, "ArrowLeft"]
}, kC = {
  ltr: ["ArrowLeft"],
  rtl: ["ArrowRight"]
}, gr = "Menu", [er, IC, OC] = Js(gr), [wn, Eu] = Bt(gr, [
  OC,
  qn,
  wu
]), Oo = qn(), Tu = wu(), [DC, bn] = wn(gr), [FC, yr] = wn(gr), _u = (e) => {
  const { __scopeMenu: t, open: n = !1, children: r, dir: s, onOpenChange: a, modal: i = !0 } = e, c = Oo(t), [d, l] = m.useState(null), u = m.useRef(!1), f = lt(a), v = Zs(s);
  return m.useEffect(() => {
    const w = () => {
      u.current = !0, document.addEventListener("pointerdown", g, { capture: !0, once: !0 }), document.addEventListener("pointermove", g, { capture: !0, once: !0 });
    }, g = () => u.current = !1;
    return document.addEventListener("keydown", w, { capture: !0 }), () => {
      document.removeEventListener("keydown", w, { capture: !0 }), document.removeEventListener("pointerdown", g, { capture: !0 }), document.removeEventListener("pointermove", g, { capture: !0 });
    };
  }, []), /* @__PURE__ */ o(ca, { ...c, children: /* @__PURE__ */ o(
    DC,
    {
      scope: t,
      open: n,
      onOpenChange: f,
      content: d,
      onContentChange: l,
      children: /* @__PURE__ */ o(
        FC,
        {
          scope: t,
          onClose: m.useCallback(() => f(!1), [f]),
          isUsingKeyboardRef: u,
          dir: v,
          modal: i,
          children: r
        }
      )
    }
  ) });
};
_u.displayName = gr;
var LC = "MenuAnchor", pa = m.forwardRef(
  (e, t) => {
    const { __scopeMenu: n, ...r } = e, s = Oo(n);
    return /* @__PURE__ */ o(Ao, { ...s, ...r, ref: t });
  }
);
pa.displayName = LC;
var ma = "MenuPortal", [$C, Ru] = wn(ma, {
  forceMount: void 0
}), Au = (e) => {
  const { __scopeMenu: t, forceMount: n, children: r, container: s } = e, a = bn(ma, t);
  return /* @__PURE__ */ o($C, { scope: t, forceMount: n, children: /* @__PURE__ */ o(_t, { present: n || a.open, children: /* @__PURE__ */ o(ur, { asChild: !0, container: s, children: r }) }) });
};
Au.displayName = ma;
var rt = "MenuContent", [UC, ha] = wn(rt), Pu = m.forwardRef(
  (e, t) => {
    const n = Ru(rt, e.__scopeMenu), { forceMount: r = n.forceMount, ...s } = e, a = bn(rt, e.__scopeMenu), i = yr(rt, e.__scopeMenu);
    return /* @__PURE__ */ o(er.Provider, { scope: e.__scopeMenu, children: /* @__PURE__ */ o(_t, { present: r || a.open, children: /* @__PURE__ */ o(er.Slot, { scope: e.__scopeMenu, children: i.modal ? /* @__PURE__ */ o(BC, { ...s, ref: t }) : /* @__PURE__ */ o(zC, { ...s, ref: t }) }) }) });
  }
), BC = m.forwardRef(
  (e, t) => {
    const n = bn(rt, e.__scopeMenu), r = m.useRef(null), s = se(t, r);
    return m.useEffect(() => {
      const a = r.current;
      if (a) return xo(a);
    }, []), /* @__PURE__ */ o(
      ga,
      {
        ...e,
        ref: s,
        trapFocus: n.open,
        disableOutsidePointerEvents: n.open,
        disableOutsideScroll: !0,
        onFocusOutside: U(
          e.onFocusOutside,
          (a) => a.preventDefault(),
          { checkForDefaultPrevented: !1 }
        ),
        onDismiss: () => n.onOpenChange(!1)
      }
    );
  }
), zC = m.forwardRef((e, t) => {
  const n = bn(rt, e.__scopeMenu);
  return /* @__PURE__ */ o(
    ga,
    {
      ...e,
      ref: t,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      disableOutsideScroll: !1,
      onDismiss: () => n.onOpenChange(!1)
    }
  );
}), qC = Lt("MenuContent.ScrollLock"), ga = m.forwardRef(
  (e, t) => {
    const {
      __scopeMenu: n,
      loop: r = !1,
      trapFocus: s,
      onOpenAutoFocus: a,
      onCloseAutoFocus: i,
      disableOutsidePointerEvents: c,
      onEntryFocus: d,
      onEscapeKeyDown: l,
      onPointerDownOutside: u,
      onFocusOutside: f,
      onInteractOutside: v,
      onDismiss: w,
      disableOutsideScroll: g,
      ...p
    } = e, y = bn(rt, n), C = yr(rt, n), S = Oo(n), b = Tu(n), x = IC(n), [E, k] = m.useState(null), T = m.useRef(null), P = se(t, T, y.onContentChange), B = m.useRef(0), z = m.useRef(""), H = m.useRef(0), I = m.useRef(null), K = m.useRef("right"), q = m.useRef(0), ee = g ? fr : m.Fragment, $ = g ? { as: qC, allowPinchZoom: !0 } : void 0, G = (M) => {
      const ae = z.current + M, X = x().filter((F) => !F.disabled), xe = document.activeElement, qe = X.find((F) => F.ref.current === xe)?.textValue, Ne = X.map((F) => F.textValue), He = eS(Ne, ae, qe), je = X.find((F) => F.textValue === He)?.ref.current;
      (function F(le) {
        z.current = le, window.clearTimeout(B.current), le !== "" && (B.current = window.setTimeout(() => F(""), 1e3));
      })(ae), je && setTimeout(() => je.focus());
    };
    m.useEffect(() => () => window.clearTimeout(B.current), []), Co();
    const O = m.useCallback((M) => K.current === I.current?.side && nS(M, I.current?.area), []);
    return /* @__PURE__ */ o(
      UC,
      {
        scope: n,
        searchRef: z,
        onItemEnter: m.useCallback(
          (M) => {
            O(M) && M.preventDefault();
          },
          [O]
        ),
        onItemLeave: m.useCallback(
          (M) => {
            O(M) || (T.current?.focus(), k(null));
          },
          [O]
        ),
        onTriggerLeave: m.useCallback(
          (M) => {
            O(M) && M.preventDefault();
          },
          [O]
        ),
        pointerGraceTimerRef: H,
        onPointerGraceIntentChange: m.useCallback((M) => {
          I.current = M;
        }, []),
        children: /* @__PURE__ */ o(ee, { ...$, children: /* @__PURE__ */ o(
          dr,
          {
            asChild: !0,
            trapped: s,
            onMountAutoFocus: U(a, (M) => {
              M.preventDefault(), T.current?.focus({ preventScroll: !0 });
            }),
            onUnmountAutoFocus: i,
            children: /* @__PURE__ */ o(
              lr,
              {
                asChild: !0,
                disableOutsidePointerEvents: c,
                onEscapeKeyDown: l,
                onPointerDownOutside: u,
                onFocusOutside: f,
                onInteractOutside: v,
                onDismiss: w,
                children: /* @__PURE__ */ o(
                  _C,
                  {
                    asChild: !0,
                    ...b,
                    dir: C.dir,
                    orientation: "vertical",
                    loop: r,
                    currentTabStopId: E,
                    onCurrentTabStopIdChange: k,
                    onEntryFocus: U(d, (M) => {
                      C.isUsingKeyboardRef.current || M.preventDefault();
                    }),
                    preventScrollOnEntryFocus: !0,
                    children: /* @__PURE__ */ o(
                      la,
                      {
                        role: "menu",
                        "aria-orientation": "vertical",
                        "data-state": Ku(y.open),
                        "data-radix-menu-content": "",
                        dir: C.dir,
                        ...S,
                        ...p,
                        ref: P,
                        style: { outline: "none", ...p.style },
                        onKeyDown: U(p.onKeyDown, (M) => {
                          const X = M.target.closest("[data-radix-menu-content]") === M.currentTarget, xe = M.ctrlKey || M.altKey || M.metaKey, qe = M.key.length === 1;
                          X && (M.key === "Tab" && M.preventDefault(), !xe && qe && G(M.key));
                          const Ne = T.current;
                          if (M.target !== Ne || !PC.includes(M.key)) return;
                          M.preventDefault();
                          const je = x().filter((F) => !F.disabled).map((F) => F.ref.current);
                          Nu.includes(M.key) && je.reverse(), JC(je);
                        }),
                        onBlur: U(e.onBlur, (M) => {
                          M.currentTarget.contains(M.target) || (window.clearTimeout(B.current), z.current = "");
                        }),
                        onPointerMove: U(
                          e.onPointerMove,
                          tr((M) => {
                            const ae = M.target, X = q.current !== M.clientX;
                            if (M.currentTarget.contains(ae) && X) {
                              const xe = M.clientX > q.current ? "right" : "left";
                              K.current = xe, q.current = M.clientX;
                            }
                          })
                        )
                      }
                    )
                  }
                )
              }
            )
          }
        ) })
      }
    );
  }
);
Pu.displayName = rt;
var HC = "MenuGroup", ya = m.forwardRef(
  (e, t) => {
    const { __scopeMenu: n, ...r } = e;
    return /* @__PURE__ */ o(Z.div, { role: "group", ...r, ref: t });
  }
);
ya.displayName = HC;
var jC = "MenuLabel", Mu = m.forwardRef(
  (e, t) => {
    const { __scopeMenu: n, ...r } = e;
    return /* @__PURE__ */ o(Z.div, { ...r, ref: t });
  }
);
Mu.displayName = jC;
var Qr = "MenuItem", Ji = "menu.itemSelect", Do = m.forwardRef(
  (e, t) => {
    const { disabled: n = !1, onSelect: r, ...s } = e, a = m.useRef(null), i = yr(Qr, e.__scopeMenu), c = ha(Qr, e.__scopeMenu), d = se(t, a), l = m.useRef(!1), u = () => {
      const f = a.current;
      if (!n && f) {
        const v = new CustomEvent(Ji, { bubbles: !0, cancelable: !0 });
        f.addEventListener(Ji, (w) => r?.(w), { once: !0 }), pl(f, v), v.defaultPrevented ? l.current = !1 : i.onClose();
      }
    };
    return /* @__PURE__ */ o(
      ku,
      {
        ...s,
        ref: d,
        disabled: n,
        onClick: U(e.onClick, u),
        onPointerDown: (f) => {
          e.onPointerDown?.(f), l.current = !0;
        },
        onPointerUp: U(e.onPointerUp, (f) => {
          l.current || f.currentTarget?.click();
        }),
        onKeyDown: U(e.onKeyDown, (f) => {
          const v = c.searchRef.current !== "";
          n || v && f.key === " " || _s.includes(f.key) && (f.currentTarget.click(), f.preventDefault());
        })
      }
    );
  }
);
Do.displayName = Qr;
var ku = m.forwardRef(
  (e, t) => {
    const { __scopeMenu: n, disabled: r = !1, textValue: s, ...a } = e, i = ha(Qr, n), c = Tu(n), d = m.useRef(null), l = se(t, d), [u, f] = m.useState(!1), [v, w] = m.useState("");
    return m.useEffect(() => {
      const g = d.current;
      g && w((g.textContent ?? "").trim());
    }, [a.children]), /* @__PURE__ */ o(
      er.ItemSlot,
      {
        scope: n,
        disabled: r,
        textValue: s ?? v,
        children: /* @__PURE__ */ o(RC, { asChild: !0, ...c, focusable: !r, children: /* @__PURE__ */ o(
          Z.div,
          {
            role: "menuitem",
            "data-highlighted": u ? "" : void 0,
            "aria-disabled": r || void 0,
            "data-disabled": r ? "" : void 0,
            ...a,
            ref: l,
            onPointerMove: U(
              e.onPointerMove,
              tr((g) => {
                r ? i.onItemLeave(g) : (i.onItemEnter(g), g.defaultPrevented || g.currentTarget.focus({ preventScroll: !0 }));
              })
            ),
            onPointerLeave: U(
              e.onPointerLeave,
              tr((g) => i.onItemLeave(g))
            ),
            onFocus: U(e.onFocus, () => f(!0)),
            onBlur: U(e.onBlur, () => f(!1))
          }
        ) })
      }
    );
  }
), WC = "MenuCheckboxItem", Iu = m.forwardRef(
  (e, t) => {
    const { checked: n = !1, onCheckedChange: r, ...s } = e;
    return /* @__PURE__ */ o($u, { scope: e.__scopeMenu, checked: n, children: /* @__PURE__ */ o(
      Do,
      {
        role: "menuitemcheckbox",
        "aria-checked": Yr(n) ? "mixed" : n,
        ...s,
        ref: t,
        "data-state": wa(n),
        onSelect: U(
          s.onSelect,
          () => r?.(Yr(n) ? !0 : !n),
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
);
Iu.displayName = WC;
var Ou = "MenuRadioGroup", [KC, VC] = wn(
  Ou,
  { value: void 0, onValueChange: () => {
  } }
), Du = m.forwardRef(
  (e, t) => {
    const { value: n, onValueChange: r, ...s } = e, a = lt(r);
    return /* @__PURE__ */ o(KC, { scope: e.__scopeMenu, value: n, onValueChange: a, children: /* @__PURE__ */ o(ya, { ...s, ref: t }) });
  }
);
Du.displayName = Ou;
var Fu = "MenuRadioItem", Lu = m.forwardRef(
  (e, t) => {
    const { value: n, ...r } = e, s = VC(Fu, e.__scopeMenu), a = n === s.value;
    return /* @__PURE__ */ o($u, { scope: e.__scopeMenu, checked: a, children: /* @__PURE__ */ o(
      Do,
      {
        role: "menuitemradio",
        "aria-checked": a,
        ...r,
        ref: t,
        "data-state": wa(a),
        onSelect: U(
          r.onSelect,
          () => s.onValueChange?.(n),
          { checkForDefaultPrevented: !1 }
        )
      }
    ) });
  }
);
Lu.displayName = Fu;
var va = "MenuItemIndicator", [$u, GC] = wn(
  va,
  { checked: !1 }
), Uu = m.forwardRef(
  (e, t) => {
    const { __scopeMenu: n, forceMount: r, ...s } = e, a = GC(va, n);
    return /* @__PURE__ */ o(
      _t,
      {
        present: r || Yr(a.checked) || a.checked === !0,
        children: /* @__PURE__ */ o(
          Z.span,
          {
            ...s,
            ref: t,
            "data-state": wa(a.checked)
          }
        )
      }
    );
  }
);
Uu.displayName = va;
var QC = "MenuSeparator", Bu = m.forwardRef(
  (e, t) => {
    const { __scopeMenu: n, ...r } = e;
    return /* @__PURE__ */ o(
      Z.div,
      {
        role: "separator",
        "aria-orientation": "horizontal",
        ...r,
        ref: t
      }
    );
  }
);
Bu.displayName = QC;
var YC = "MenuArrow", zu = m.forwardRef(
  (e, t) => {
    const { __scopeMenu: n, ...r } = e, s = Oo(n);
    return /* @__PURE__ */ o(da, { ...s, ...r, ref: t });
  }
);
zu.displayName = YC;
var XC = "MenuSub", [wN, qu] = wn(XC), Yn = "MenuSubTrigger", Hu = m.forwardRef(
  (e, t) => {
    const n = bn(Yn, e.__scopeMenu), r = yr(Yn, e.__scopeMenu), s = qu(Yn, e.__scopeMenu), a = ha(Yn, e.__scopeMenu), i = m.useRef(null), { pointerGraceTimerRef: c, onPointerGraceIntentChange: d } = a, l = { __scopeMenu: e.__scopeMenu }, u = m.useCallback(() => {
      i.current && window.clearTimeout(i.current), i.current = null;
    }, []);
    return m.useEffect(() => u, [u]), m.useEffect(() => {
      const f = c.current;
      return () => {
        window.clearTimeout(f), d(null);
      };
    }, [c, d]), /* @__PURE__ */ o(pa, { asChild: !0, ...l, children: /* @__PURE__ */ o(
      ku,
      {
        id: s.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": n.open,
        "aria-controls": s.contentId,
        "data-state": Ku(n.open),
        ...e,
        ref: Gs(t, s.onTriggerChange),
        onClick: (f) => {
          e.onClick?.(f), !(e.disabled || f.defaultPrevented) && (f.currentTarget.focus(), n.open || n.onOpenChange(!0));
        },
        onPointerMove: U(
          e.onPointerMove,
          tr((f) => {
            a.onItemEnter(f), !f.defaultPrevented && !e.disabled && !n.open && !i.current && (a.onPointerGraceIntentChange(null), i.current = window.setTimeout(() => {
              n.onOpenChange(!0), u();
            }, 100));
          })
        ),
        onPointerLeave: U(
          e.onPointerLeave,
          tr((f) => {
            u();
            const v = n.content?.getBoundingClientRect();
            if (v) {
              const w = n.content?.dataset.side, g = w === "right", p = g ? -5 : 5, y = v[g ? "left" : "right"], C = v[g ? "right" : "left"];
              a.onPointerGraceIntentChange({
                area: [
                  // Apply a bleed on clientX to ensure that our exit point is
                  // consistently within polygon bounds
                  { x: f.clientX + p, y: f.clientY },
                  { x: y, y: v.top },
                  { x: C, y: v.top },
                  { x: C, y: v.bottom },
                  { x: y, y: v.bottom }
                ],
                side: w
              }), window.clearTimeout(c.current), c.current = window.setTimeout(
                () => a.onPointerGraceIntentChange(null),
                300
              );
            } else {
              if (a.onTriggerLeave(f), f.defaultPrevented) return;
              a.onPointerGraceIntentChange(null);
            }
          })
        ),
        onKeyDown: U(e.onKeyDown, (f) => {
          const v = a.searchRef.current !== "";
          e.disabled || v && f.key === " " || MC[r.dir].includes(f.key) && (n.onOpenChange(!0), n.content?.focus(), f.preventDefault());
        })
      }
    ) });
  }
);
Hu.displayName = Yn;
var ju = "MenuSubContent", Wu = m.forwardRef(
  (e, t) => {
    const n = Ru(rt, e.__scopeMenu), { forceMount: r = n.forceMount, ...s } = e, a = bn(rt, e.__scopeMenu), i = yr(rt, e.__scopeMenu), c = qu(ju, e.__scopeMenu), d = m.useRef(null), l = se(t, d);
    return /* @__PURE__ */ o(er.Provider, { scope: e.__scopeMenu, children: /* @__PURE__ */ o(_t, { present: r || a.open, children: /* @__PURE__ */ o(er.Slot, { scope: e.__scopeMenu, children: /* @__PURE__ */ o(
      ga,
      {
        id: c.contentId,
        "aria-labelledby": c.triggerId,
        ...s,
        ref: l,
        align: "start",
        side: i.dir === "rtl" ? "left" : "right",
        disableOutsidePointerEvents: !1,
        disableOutsideScroll: !1,
        trapFocus: !1,
        onOpenAutoFocus: (u) => {
          i.isUsingKeyboardRef.current && d.current?.focus(), u.preventDefault();
        },
        onCloseAutoFocus: (u) => u.preventDefault(),
        onFocusOutside: U(e.onFocusOutside, (u) => {
          u.target !== c.trigger && a.onOpenChange(!1);
        }),
        onEscapeKeyDown: U(e.onEscapeKeyDown, (u) => {
          i.onClose(), u.preventDefault();
        }),
        onKeyDown: U(e.onKeyDown, (u) => {
          const f = u.currentTarget.contains(u.target), v = kC[i.dir].includes(u.key);
          f && v && (a.onOpenChange(!1), c.trigger?.focus(), u.preventDefault());
        })
      }
    ) }) }) });
  }
);
Wu.displayName = ju;
function Ku(e) {
  return e ? "open" : "closed";
}
function Yr(e) {
  return e === "indeterminate";
}
function wa(e) {
  return Yr(e) ? "indeterminate" : e ? "checked" : "unchecked";
}
function JC(e) {
  const t = document.activeElement;
  for (const n of e)
    if (n === t || (n.focus(), document.activeElement !== t)) return;
}
function ZC(e, t) {
  return e.map((n, r) => e[(t + r) % e.length]);
}
function eS(e, t, n) {
  const s = t.length > 1 && Array.from(t).every((l) => l === t[0]) ? t[0] : t, a = n ? e.indexOf(n) : -1;
  let i = ZC(e, Math.max(a, 0));
  s.length === 1 && (i = i.filter((l) => l !== n));
  const d = i.find(
    (l) => l.toLowerCase().startsWith(s.toLowerCase())
  );
  return d !== n ? d : void 0;
}
function tS(e, t) {
  const { x: n, y: r } = e;
  let s = !1;
  for (let a = 0, i = t.length - 1; a < t.length; i = a++) {
    const c = t[a], d = t[i], l = c.x, u = c.y, f = d.x, v = d.y;
    u > r != v > r && n < (f - l) * (r - u) / (v - u) + l && (s = !s);
  }
  return s;
}
function nS(e, t) {
  if (!t) return !1;
  const n = { x: e.clientX, y: e.clientY };
  return tS(n, t);
}
function tr(e) {
  return (t) => t.pointerType === "mouse" ? e(t) : void 0;
}
var rS = _u, oS = pa, sS = Au, aS = Pu, iS = ya, cS = Mu, lS = Do, dS = Iu, uS = Du, fS = Lu, pS = Uu, mS = Bu, hS = zu, gS = Hu, yS = Wu, Fo = "DropdownMenu", [vS] = Bt(
  Fo,
  [Eu]
), Ve = Eu(), [wS, Vu] = vS(Fo), Gu = (e) => {
  const {
    __scopeDropdownMenu: t,
    children: n,
    dir: r,
    open: s,
    defaultOpen: a,
    onOpenChange: i,
    modal: c = !0
  } = e, d = Ve(t), l = m.useRef(null), [u, f] = pn({
    prop: s,
    defaultProp: a ?? !1,
    onChange: i,
    caller: Fo
  });
  return /* @__PURE__ */ o(
    wS,
    {
      scope: t,
      triggerId: Ct(),
      triggerRef: l,
      contentId: Ct(),
      open: u,
      onOpenChange: f,
      onOpenToggle: m.useCallback(() => f((v) => !v), [f]),
      modal: c,
      children: /* @__PURE__ */ o(rS, { ...d, open: u, onOpenChange: f, dir: r, modal: c, children: n })
    }
  );
};
Gu.displayName = Fo;
var Qu = "DropdownMenuTrigger", Yu = m.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: n, disabled: r = !1, ...s } = e, a = Vu(Qu, n), i = Ve(n);
    return /* @__PURE__ */ o(oS, { asChild: !0, ...i, children: /* @__PURE__ */ o(
      Z.button,
      {
        type: "button",
        id: a.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": a.open,
        "aria-controls": a.open ? a.contentId : void 0,
        "data-state": a.open ? "open" : "closed",
        "data-disabled": r ? "" : void 0,
        disabled: r,
        ...s,
        ref: Gs(t, a.triggerRef),
        onPointerDown: U(e.onPointerDown, (c) => {
          !r && c.button === 0 && c.ctrlKey === !1 && (a.onOpenToggle(), a.open || c.preventDefault());
        }),
        onKeyDown: U(e.onKeyDown, (c) => {
          r || (["Enter", " "].includes(c.key) && a.onOpenToggle(), c.key === "ArrowDown" && a.onOpenChange(!0), ["Enter", " ", "ArrowDown"].includes(c.key) && c.preventDefault());
        })
      }
    ) });
  }
);
Yu.displayName = Qu;
var bS = "DropdownMenuPortal", Xu = (e) => {
  const { __scopeDropdownMenu: t, ...n } = e, r = Ve(t);
  return /* @__PURE__ */ o(sS, { ...r, ...n });
};
Xu.displayName = bS;
var Ju = "DropdownMenuContent", Zu = m.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e, s = Vu(Ju, n), a = Ve(n), i = m.useRef(!1);
    return /* @__PURE__ */ o(
      aS,
      {
        id: s.contentId,
        "aria-labelledby": s.triggerId,
        ...a,
        ...r,
        ref: t,
        onCloseAutoFocus: U(e.onCloseAutoFocus, (c) => {
          i.current || s.triggerRef.current?.focus(), i.current = !1, c.preventDefault();
        }),
        onInteractOutside: U(e.onInteractOutside, (c) => {
          const d = c.detail.originalEvent, l = d.button === 0 && d.ctrlKey === !0, u = d.button === 2 || l;
          (!s.modal || u) && (i.current = !0);
        }),
        style: {
          ...e.style,
          "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
          "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
          "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
          "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
          "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
        }
      }
    );
  }
);
Zu.displayName = Ju;
var CS = "DropdownMenuGroup", SS = m.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
    return /* @__PURE__ */ o(iS, { ...s, ...r, ref: t });
  }
);
SS.displayName = CS;
var xS = "DropdownMenuLabel", ef = m.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
    return /* @__PURE__ */ o(cS, { ...s, ...r, ref: t });
  }
);
ef.displayName = xS;
var NS = "DropdownMenuItem", tf = m.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
    return /* @__PURE__ */ o(lS, { ...s, ...r, ref: t });
  }
);
tf.displayName = NS;
var ES = "DropdownMenuCheckboxItem", nf = m.forwardRef((e, t) => {
  const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
  return /* @__PURE__ */ o(dS, { ...s, ...r, ref: t });
});
nf.displayName = ES;
var TS = "DropdownMenuRadioGroup", _S = m.forwardRef((e, t) => {
  const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
  return /* @__PURE__ */ o(uS, { ...s, ...r, ref: t });
});
_S.displayName = TS;
var RS = "DropdownMenuRadioItem", rf = m.forwardRef((e, t) => {
  const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
  return /* @__PURE__ */ o(fS, { ...s, ...r, ref: t });
});
rf.displayName = RS;
var AS = "DropdownMenuItemIndicator", of = m.forwardRef((e, t) => {
  const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
  return /* @__PURE__ */ o(pS, { ...s, ...r, ref: t });
});
of.displayName = AS;
var PS = "DropdownMenuSeparator", sf = m.forwardRef((e, t) => {
  const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
  return /* @__PURE__ */ o(mS, { ...s, ...r, ref: t });
});
sf.displayName = PS;
var MS = "DropdownMenuArrow", kS = m.forwardRef(
  (e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
    return /* @__PURE__ */ o(hS, { ...s, ...r, ref: t });
  }
);
kS.displayName = MS;
var IS = "DropdownMenuSubTrigger", af = m.forwardRef((e, t) => {
  const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
  return /* @__PURE__ */ o(gS, { ...s, ...r, ref: t });
});
af.displayName = IS;
var OS = "DropdownMenuSubContent", cf = m.forwardRef((e, t) => {
  const { __scopeDropdownMenu: n, ...r } = e, s = Ve(n);
  return /* @__PURE__ */ o(
    yS,
    {
      ...s,
      ...r,
      ref: t,
      style: {
        ...e.style,
        "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
        "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
        "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
        "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
        "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
      }
    }
  );
});
cf.displayName = OS;
var DS = Gu, FS = Yu, LS = Xu, lf = Zu, df = ef, uf = tf, ff = nf, pf = rf, mf = of, hf = sf, gf = af, yf = cf;
const on = DS, sn = FS, $S = m.forwardRef(({ className: e, inset: t, children: n, ...r }, s) => /* @__PURE__ */ h(
  gf,
  {
    ref: s,
    className: te(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent focus:bg-accent",
      t && "pl-8",
      e
    ),
    ...r,
    children: [
      n,
      /* @__PURE__ */ o(dc, { className: "ml-auto h-4 w-4" })
    ]
  }
));
$S.displayName = gf.displayName;
const US = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(
  yf,
  {
    ref: n,
    className: te(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      e
    ),
    ...t
  }
));
US.displayName = yf.displayName;
const Kt = m.forwardRef(({ className: e, sideOffset: t = 4, ...n }, r) => /* @__PURE__ */ o(LS, { children: /* @__PURE__ */ o(
  lf,
  {
    ref: r,
    sideOffset: t,
    className: te(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      e
    ),
    ...n
  }
) }));
Kt.displayName = lf.displayName;
const re = m.forwardRef(({ className: e, inset: t, ...n }, r) => /* @__PURE__ */ o(
  uf,
  {
    ref: r,
    className: te(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      t && "pl-8",
      e
    ),
    ...n
  }
));
re.displayName = uf.displayName;
const BS = m.forwardRef(({ className: e, children: t, checked: n, ...r }, s) => /* @__PURE__ */ h(
  ff,
  {
    ref: s,
    className: te(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      e
    ),
    checked: n,
    ...r,
    children: [
      /* @__PURE__ */ o("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ o(mf, { children: /* @__PURE__ */ o(Ms, { className: "h-4 w-4" }) }) }),
      t
    ]
  }
));
BS.displayName = ff.displayName;
const zS = m.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ h(
  pf,
  {
    ref: r,
    className: te(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      e
    ),
    ...n,
    children: [
      /* @__PURE__ */ o("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ o(mf, { children: /* @__PURE__ */ o(mp, { className: "h-2 w-2 fill-current" }) }) }),
      t
    ]
  }
));
zS.displayName = pf.displayName;
const qS = m.forwardRef(({ className: e, inset: t, ...n }, r) => /* @__PURE__ */ o(
  df,
  {
    ref: r,
    className: te("px-2 py-1.5 text-sm font-semibold", t && "pl-8", e),
    ...n
  }
));
qS.displayName = df.displayName;
const En = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(hf, { ref: n, className: te("-mx-1 my-1 h-px bg-muted", e), ...t }));
En.displayName = hf.displayName;
const HS = ({
  value: e,
  onChange: t,
  label: n = "Editor",
  placeholder: r = "Masukkan teks di sini...",
  height: s = 400,
  required: a = !1
}) => {
  const i = dp(null), [c, d] = W(!1), [l, u] = W(e), [f, v] = W(!1), [w, g] = W("3"), [p, y] = W("p"), [C, S] = W("#000000"), [b, x] = W("#ffffff"), [E, k] = W(0), [T, P] = W([e]), [B, z] = W(0), [H, I] = W(!1), [K, q] = W(!1), [ee, $] = W(""), [G, O] = W(null), [M, ae] = W(!1), [X, xe] = W(""), [qe, Ne] = W(!1), [He, je] = W(3), [F, le] = W(3), [Fe, ie] = W(!1), [ce, we] = W(""), [We, ht] = W(null), [jn, tn] = W(!1), [tt, Lo] = W(""), [Sa, xa] = W(""), [kf, Na] = W(!1), [If, Ea] = W(!1), [Of, $o] = W(!1), [Df, vr] = W(!1), [Ff, wr] = W(!1);
  Xr(() => {
    i.current && e && !H && (i.current.innerHTML = e, I(!0), P([e]), z(0), br());
  }, [e, H]);
  const br = () => {
    if (i.current) {
      const ne = (i.current.innerText || "").trim().split(/\s+/).filter((ye) => ye.length > 0);
      k(ne.length);
    }
  }, Cr = (R) => {
    const ne = T.slice(0, B + 1);
    ne.push(R), P(ne), z(ne.length - 1);
  }, Ue = () => {
    if (i.current) {
      const R = i.current.innerHTML;
      t(R), Cr(R), br();
    }
  }, be = (R, ne = void 0) => {
    document.execCommand(R, !1, ne), i.current?.focus(), Ue();
  }, Ta = () => {
    if (B > 0) {
      const R = B - 1;
      z(R), i.current && (i.current.innerHTML = T[R], t(T[R]), br());
    }
  }, _a = () => {
    if (B < T.length - 1) {
      const R = B + 1;
      z(R), i.current && (i.current.innerHTML = T[R], t(T[R]), br());
    }
  }, Lf = () => {
    confirm("Buat dokumen baru? Semua perubahan yang belum disimpan akan hilang.") && i.current && (i.current.innerHTML = "", t(""), Cr(""));
  }, Ra = () => {
    Ea(!0);
  }, $f = () => {
    const R = window.open("", "_blank");
    R && i.current && (R.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { border-collapse: collapse; width: 100%; }
              td, th { border: 1px solid #000; padding: 8px; }
            </style>
          </head>
          <body>${i.current.innerHTML}</body>
        </html>
      `), R.document.close(), R.print());
  }, Uf = () => {
    document.execCommand("cut"), Ue();
  }, Bf = () => {
    document.execCommand("copy");
  }, zf = async () => {
    try {
      const R = await navigator.clipboard.readText();
      document.execCommand("insertHTML", !1, R), Ue();
    } catch {
      document.execCommand("paste"), Ue();
    }
  }, qf = async () => {
    try {
      const R = await navigator.clipboard.readText();
      document.execCommand("insertText", !1, R), Ue();
    } catch {
      const ne = prompt("Paste teks di sini:");
      ne && (document.execCommand("insertText", !1, ne), Ue());
    }
  }, Hf = () => {
    document.execCommand("selectAll");
  }, jf = () => {
    Na(!0);
  }, Wf = () => {
    tn(!0);
  }, Kf = () => {
    if (i.current && tt)
      try {
        if ("find" in window)
          window.find(tt, !1, !1, !0, !1, !0, !1);
        else {
          const ne = i.current.innerHTML.split(tt).join(`<mark>${tt}</mark>`);
          i.current.innerHTML = ne;
        }
      } catch (R) {
        console.error("Find error:", R);
      }
  }, Vf = () => {
    if (i.current && tt) {
      const ne = i.current.innerHTML.split(tt).join(Sa);
      i.current.innerHTML = ne, t(ne), Cr(ne), tn(!1), Lo(""), xa("");
    }
  }, Aa = () => {
    c ? i.current && (i.current.innerHTML = l, t(l), Cr(l)) : i.current && u(i.current.innerHTML), d(!c);
  }, Pa = () => {
    v(!f);
  }, Gf = () => {
    q(!0);
  }, Qf = () => {
    if (G) {
      const R = new FileReader();
      R.onload = (ne) => {
        if (ne.target?.result && i.current) {
          const Ee = window.getSelection()?.getRangeAt(0), At = document.createElement("img");
          At.src = ne.target.result, At.style.maxWidth = "100%", At.style.height = "auto", At.alt = "Uploaded image", Ee ? (Ee.insertNode(At), Ee.collapse(!1)) : i.current.appendChild(At), Ue();
        }
      }, R.readAsDataURL(G);
    } else if (ee && i.current) {
      const ne = window.getSelection()?.getRangeAt(0), ye = document.createElement("img");
      ye.src = ee, ye.style.maxWidth = "100%", ye.style.height = "auto", ye.alt = "Image", ne ? (ne.insertNode(ye), ne.collapse(!1)) : i.current.appendChild(ye), Ue();
    }
    q(!1), $(""), O(null);
  }, Yf = () => {
    const R = window.getSelection();
    R && R.toString() ? ae(!0) : alert("Pilih teks terlebih dahulu untuk membuat link");
  }, Xf = () => {
    if (X && i.current) {
      const R = window.getSelection();
      if (R && R.rangeCount > 0) {
        const ne = R.getRangeAt(0), ye = ne.toString(), Ee = document.createElement("a");
        Ee.href = X, Ee.textContent = ye, Ee.target = "_blank", ne.deleteContents(), ne.insertNode(Ee), ne.collapse(!1), Ue();
      }
    }
    ae(!1), xe("");
  }, Jf = () => {
    Ne(!0);
  }, Zf = () => {
    if (i.current) {
      const R = document.createElement("table");
      R.style.borderCollapse = "collapse", R.style.width = "100%", R.style.margin = "10px 0", R.setAttribute("border", "1");
      for (let Ee = 0; Ee < He; Ee++) {
        const At = R.insertRow();
        for (let nn = 0; nn < F; nn++) {
          const Wn = At.insertCell();
          Wn.style.padding = "8px", Wn.style.border = "1px solid #ccc", Wn.style.minWidth = "100px", Wn.contentEditable = "true", Wn.textContent = Ee === 0 ? `Header ${nn + 1}` : "Cell";
        }
      }
      const ye = window.getSelection()?.getRangeAt(0);
      if (ye) {
        ye.insertNode(R);
        const Ee = document.createElement("br");
        ye.collapse(!1), ye.insertNode(Ee);
      } else
        i.current.appendChild(R), i.current.appendChild(document.createElement("br"));
      Ue();
    }
    Ne(!1);
  }, ep = () => {
    ie(!0);
  }, tp = () => {
    if (We) {
      const R = new FileReader();
      R.onload = (ne) => {
        if (ne.target?.result && i.current) {
          const ye = document.createElement("video");
          ye.controls = !0, ye.style.maxWidth = "100%", ye.style.height = "auto";
          const Ee = document.createElement("source");
          Ee.src = ne.target.result, ye.appendChild(Ee);
          const nn = window.getSelection()?.getRangeAt(0);
          nn ? (nn.insertNode(ye), nn.collapse(!1)) : i.current.appendChild(ye), Ue();
        }
      }, R.readAsDataURL(We);
    } else if (ce && i.current) {
      const R = document.createElement("video");
      R.controls = !0, R.style.maxWidth = "100%", R.style.height = "auto";
      const ne = document.createElement("source");
      ne.src = ce, R.appendChild(ne);
      const Ee = window.getSelection()?.getRangeAt(0);
      Ee ? (Ee.insertNode(R), Ee.collapse(!1)) : i.current.appendChild(R), Ue();
    }
    ie(!1), we(""), ht(null);
  }, np = () => {
    be("insertHorizontalRule");
  }, rp = () => {
    const R = (/* @__PURE__ */ new Date()).toLocaleString("id-ID");
    be("insertText", R);
  }, op = (R) => {
    be("formatBlock", `<${R}>`), y(R);
  }, sp = () => {
    if (i.current) {
      i.current.focus();
      const R = window.getSelection();
      R && R.rangeCount > 0 && (document.execCommand("styleWithCSS", !1, "true"), document.execCommand("foreColor", !1, C), Ue());
    }
    vr(!1);
  }, ap = () => {
    if (i.current) {
      i.current.focus();
      const R = window.getSelection();
      R && R.rangeCount > 0 && (document.execCommand("styleWithCSS", !1, "true"), document.execCommand("backColor", !1, b), Ue());
    }
    wr(!1);
  };
  return /* @__PURE__ */ h("div", { className: te(
    "space-y-2",
    f && "fixed inset-0 z-50 bg-background p-4 overflow-auto"
  ), children: [
    n && !f && /* @__PURE__ */ h(Pe, { className: "text-sm font-medium text-foreground", children: [
      n,
      " ",
      a && /* @__PURE__ */ o("span", { className: "text-destructive", children: "*" })
    ] }),
    /* @__PURE__ */ h("div", { className: "border border-border rounded-md overflow-hidden bg-background", children: [
      /* @__PURE__ */ o("div", { className: "bg-muted/50 border-b border-border p-2", children: /* @__PURE__ */ h("div", { className: "flex flex-wrap gap-1 items-center text-sm", children: [
        f && /* @__PURE__ */ h(
          J,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            onClick: Pa,
            className: "mr-2",
            children: [
              /* @__PURE__ */ o(hp, { className: "w-4 h-4 mr-1" }),
              "Close Fullscreen"
            ]
          }
        ),
        /* @__PURE__ */ h(on, { children: [
          /* @__PURE__ */ o(sn, { asChild: !0, children: /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "sm", children: "File" }) }),
          /* @__PURE__ */ h(Kt, { children: [
            /* @__PURE__ */ h(re, { onClick: Lf, children: [
              /* @__PURE__ */ o(Jr, { className: "w-4 h-4 mr-2" }),
              "New Document"
            ] }),
            /* @__PURE__ */ h(re, { onClick: Ra, children: [
              /* @__PURE__ */ o(Ft, { className: "w-4 h-4 mr-2" }),
              "Preview"
            ] }),
            /* @__PURE__ */ h(re, { onClick: $f, children: [
              /* @__PURE__ */ o(gp, { className: "w-4 h-4 mr-2" }),
              "Print"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ h(on, { children: [
          /* @__PURE__ */ o(sn, { asChild: !0, children: /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "sm", children: "Edit" }) }),
          /* @__PURE__ */ h(Kt, { children: [
            /* @__PURE__ */ h(re, { onClick: Ta, disabled: B <= 0, children: [
              /* @__PURE__ */ o(ka, { className: "w-4 h-4 mr-2" }),
              "Undo"
            ] }),
            /* @__PURE__ */ h(re, { onClick: _a, disabled: B >= T.length - 1, children: [
              /* @__PURE__ */ o(Ia, { className: "w-4 h-4 mr-2" }),
              "Redo"
            ] }),
            /* @__PURE__ */ o(En, {}),
            /* @__PURE__ */ h(re, { onClick: Uf, children: [
              /* @__PURE__ */ o(yp, { className: "w-4 h-4 mr-2" }),
              "Cut"
            ] }),
            /* @__PURE__ */ h(re, { onClick: Bf, children: [
              /* @__PURE__ */ o(vp, { className: "w-4 h-4 mr-2" }),
              "Copy"
            ] }),
            /* @__PURE__ */ h(re, { onClick: zf, children: [
              /* @__PURE__ */ o(Oa, { className: "w-4 h-4 mr-2" }),
              "Paste"
            ] }),
            /* @__PURE__ */ h(re, { onClick: qf, children: [
              /* @__PURE__ */ o(Oa, { className: "w-4 h-4 mr-2" }),
              "Paste as Text"
            ] }),
            /* @__PURE__ */ o(re, { onClick: Hf, children: "Select All" }),
            /* @__PURE__ */ o(En, {}),
            /* @__PURE__ */ h(re, { onClick: jf, children: [
              /* @__PURE__ */ o(Mn, { className: "w-4 h-4 mr-2" }),
              "Find"
            ] }),
            /* @__PURE__ */ h(re, { onClick: Wf, children: [
              /* @__PURE__ */ o(Mn, { className: "w-4 h-4 mr-2" }),
              "Find & Replace"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ h(on, { children: [
          /* @__PURE__ */ o(sn, { asChild: !0, children: /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "sm", children: "View" }) }),
          /* @__PURE__ */ h(Kt, { children: [
            /* @__PURE__ */ h(re, { onClick: Aa, children: [
              /* @__PURE__ */ o(as, { className: "w-4 h-4 mr-2" }),
              c ? "Visual Mode" : "Source Code"
            ] }),
            /* @__PURE__ */ h(re, { onClick: Ra, children: [
              /* @__PURE__ */ o(Ft, { className: "w-4 h-4 mr-2" }),
              "Preview"
            ] }),
            /* @__PURE__ */ h(re, { onClick: Pa, children: [
              /* @__PURE__ */ o(wp, { className: "w-4 h-4 mr-2" }),
              "Fullscreen"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ h(on, { children: [
          /* @__PURE__ */ o(sn, { asChild: !0, children: /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "sm", children: "Insert" }) }),
          /* @__PURE__ */ h(Kt, { children: [
            /* @__PURE__ */ h(re, { onClick: Gf, children: [
              /* @__PURE__ */ o(bp, { className: "w-4 h-4 mr-2" }),
              "Image"
            ] }),
            /* @__PURE__ */ h(re, { onClick: Yf, children: [
              /* @__PURE__ */ o(Cp, { className: "w-4 h-4 mr-2" }),
              "Link"
            ] }),
            /* @__PURE__ */ h(re, { onClick: ep, children: [
              /* @__PURE__ */ o(Sp, { className: "w-4 h-4 mr-2" }),
              "Media"
            ] }),
            /* @__PURE__ */ h(re, { onClick: Jf, children: [
              /* @__PURE__ */ o(xp, { className: "w-4 h-4 mr-2" }),
              "Table"
            ] }),
            /* @__PURE__ */ o(En, {}),
            /* @__PURE__ */ h(re, { onClick: np, children: [
              /* @__PURE__ */ o(Np, { className: "w-4 h-4 mr-2" }),
              "Horizontal Line"
            ] }),
            /* @__PURE__ */ h(re, { onClick: rp, children: [
              /* @__PURE__ */ o(Ep, { className: "w-4 h-4 mr-2" }),
              "Date/Time"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ h(on, { children: [
          /* @__PURE__ */ o(sn, { asChild: !0, children: /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "sm", children: "Format" }) }),
          /* @__PURE__ */ h(Kt, { children: [
            /* @__PURE__ */ h(re, { onClick: () => be("bold"), children: [
              /* @__PURE__ */ o(Da, { className: "w-4 h-4 mr-2" }),
              "Bold"
            ] }),
            /* @__PURE__ */ h(re, { onClick: () => be("italic"), children: [
              /* @__PURE__ */ o(Fa, { className: "w-4 h-4 mr-2" }),
              "Italic"
            ] }),
            /* @__PURE__ */ h(re, { onClick: () => be("underline"), children: [
              /* @__PURE__ */ o(La, { className: "w-4 h-4 mr-2" }),
              "Underline"
            ] }),
            /* @__PURE__ */ h(re, { onClick: () => be("strikeThrough"), children: [
              /* @__PURE__ */ o(Tp, { className: "w-4 h-4 mr-2" }),
              "Strikethrough"
            ] }),
            /* @__PURE__ */ h(re, { onClick: () => be("superscript"), children: [
              /* @__PURE__ */ o(_p, { className: "w-4 h-4 mr-2" }),
              "Superscript"
            ] }),
            /* @__PURE__ */ h(re, { onClick: () => be("subscript"), children: [
              /* @__PURE__ */ o(Rp, { className: "w-4 h-4 mr-2" }),
              "Subscript"
            ] }),
            /* @__PURE__ */ o(En, {}),
            /* @__PURE__ */ h(re, { onClick: () => vr(!0), children: [
              /* @__PURE__ */ o($a, { className: "w-4 h-4 mr-2" }),
              "Text Color"
            ] }),
            /* @__PURE__ */ h(re, { onClick: () => wr(!0), children: [
              /* @__PURE__ */ o(ss, { className: "w-4 h-4 mr-2" }),
              "Background Color"
            ] }),
            /* @__PURE__ */ o(En, {}),
            /* @__PURE__ */ h(re, { onClick: () => be("removeFormat"), children: [
              /* @__PURE__ */ o(Ua, { className: "w-4 h-4 mr-2" }),
              "Clear Formatting"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ h(on, { children: [
          /* @__PURE__ */ o(sn, { asChild: !0, children: /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "sm", children: "Tools" }) }),
          /* @__PURE__ */ h(Kt, { children: [
            /* @__PURE__ */ h(re, { onClick: Aa, children: [
              /* @__PURE__ */ o(as, { className: "w-4 h-4 mr-2" }),
              "Source Code"
            ] }),
            /* @__PURE__ */ o(re, { children: /* @__PURE__ */ h("span", { className: "text-muted-foreground", children: [
              "Word Count: ",
              E
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ h(on, { children: [
          /* @__PURE__ */ o(sn, { asChild: !0, children: /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "sm", children: "Help" }) }),
          /* @__PURE__ */ o(Kt, { children: /* @__PURE__ */ h(re, { onClick: () => $o(!0), children: [
            /* @__PURE__ */ o(Ba, { className: "w-4 h-4 mr-2" }),
            "Help & Shortcuts"
          ] }) })
        ] })
      ] }) }),
      /* @__PURE__ */ o("div", { className: "bg-muted/30 border-b border-border p-2", children: /* @__PURE__ */ h("div", { className: "flex gap-1 flex-wrap items-center", children: [
        /* @__PURE__ */ o(
          J,
          {
            type: "button",
            variant: "ghost",
            size: "icon",
            onClick: Ta,
            title: "Undo",
            disabled: B <= 0,
            children: /* @__PURE__ */ o(ka, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ o(
          J,
          {
            type: "button",
            variant: "ghost",
            size: "icon",
            onClick: _a,
            title: "Redo",
            disabled: B >= T.length - 1,
            children: /* @__PURE__ */ o(Ia, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ o(an, { orientation: "vertical", className: "h-6 mx-1" }),
        /* @__PURE__ */ h(Xb, { value: p, onValueChange: op, children: [
          /* @__PURE__ */ o(nu, { className: "w-32 h-8", children: /* @__PURE__ */ o(Jb, {}) }),
          /* @__PURE__ */ h(su, { children: [
            /* @__PURE__ */ o(Wt, { value: "p", children: "Paragraph" }),
            /* @__PURE__ */ o(Wt, { value: "h1", children: "Heading 1" }),
            /* @__PURE__ */ o(Wt, { value: "h2", children: "Heading 2" }),
            /* @__PURE__ */ o(Wt, { value: "h3", children: "Heading 3" }),
            /* @__PURE__ */ o(Wt, { value: "h4", children: "Heading 4" }),
            /* @__PURE__ */ o(Wt, { value: "h5", children: "Heading 5" }),
            /* @__PURE__ */ o(Wt, { value: "h6", children: "Heading 6" })
          ] })
        ] }),
        /* @__PURE__ */ o(an, { orientation: "vertical", className: "h-6 mx-1" }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("bold"), title: "Bold", children: /* @__PURE__ */ o(Da, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("italic"), title: "Italic", children: /* @__PURE__ */ o(Fa, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("underline"), title: "Underline", children: /* @__PURE__ */ o(La, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(an, { orientation: "vertical", className: "h-6 mx-1" }),
        /* @__PURE__ */ o(
          J,
          {
            type: "button",
            variant: "ghost",
            size: "icon",
            title: "Text Color",
            onClick: () => vr(!0),
            children: /* @__PURE__ */ o($a, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ o(
          J,
          {
            type: "button",
            variant: "ghost",
            size: "icon",
            title: "Background Color",
            onClick: () => wr(!0),
            children: /* @__PURE__ */ o(ss, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ o(an, { orientation: "vertical", className: "h-6 mx-1" }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("justifyLeft"), title: "Align Left", children: /* @__PURE__ */ o(Ap, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("justifyCenter"), title: "Align Center", children: /* @__PURE__ */ o(Pp, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("justifyRight"), title: "Align Right", children: /* @__PURE__ */ o(Mp, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("justifyFull"), title: "Justify", children: /* @__PURE__ */ o(kp, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(an, { orientation: "vertical", className: "h-6 mx-1" }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("insertUnorderedList"), title: "Bullet List", children: /* @__PURE__ */ o(ac, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("insertOrderedList"), title: "Numbered List", children: /* @__PURE__ */ o(Ip, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("outdent"), title: "Decrease Indent", children: /* @__PURE__ */ o(Op, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("indent"), title: "Increase Indent", children: /* @__PURE__ */ o(Dp, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(an, { orientation: "vertical", className: "h-6 mx-1" }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => be("removeFormat"), title: "Clear Formatting", children: /* @__PURE__ */ o(Ua, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ o(J, { type: "button", variant: "ghost", size: "icon", onClick: () => $o(!0), title: "Help", children: /* @__PURE__ */ o(Ba, { className: "w-4 h-4" }) })
      ] }) }),
      c ? /* @__PURE__ */ o(
        "textarea",
        {
          value: l,
          onChange: (R) => u(R.target.value),
          className: "w-full p-4 font-mono text-sm bg-background text-foreground border-0 focus:outline-none resize-none",
          style: { height: `${s}px` }
        }
      ) : /* @__PURE__ */ o(
        "div",
        {
          ref: i,
          contentEditable: !0,
          onInput: Ue,
          onBlur: Ue,
          className: "w-full p-4 bg-background text-foreground border-0 focus:outline-none overflow-auto prose max-w-none",
          style: { minHeight: `${s}px` },
          suppressContentEditableWarning: !0
        }
      ),
      /* @__PURE__ */ h("div", { className: "bg-muted/30 border-t border-border p-2 flex justify-between items-center text-xs text-muted-foreground", children: [
        /* @__PURE__ */ h("div", { children: [
          "Words: ",
          E
        ] }),
        /* @__PURE__ */ h("div", { children: [
          "Characters: ",
          i.current?.innerText?.length || 0
        ] })
      ] })
    ] }),
    /* @__PURE__ */ o(yt, { open: Df, onOpenChange: vr, children: /* @__PURE__ */ h(st, { children: [
      /* @__PURE__ */ o(at, { children: /* @__PURE__ */ o(it, { children: "Pilih Warna Teks" }) }),
      /* @__PURE__ */ o(
        Es,
        {
          value: C,
          onChange: S,
          label: "Warna Teks"
        }
      ),
      /* @__PURE__ */ o(J, { type: "button", onClick: sp, className: "w-full", children: "Terapkan Warna" })
    ] }) }),
    /* @__PURE__ */ o(yt, { open: Ff, onOpenChange: wr, children: /* @__PURE__ */ h(st, { children: [
      /* @__PURE__ */ o(at, { children: /* @__PURE__ */ o(it, { children: "Pilih Warna Background" }) }),
      /* @__PURE__ */ o(
        Es,
        {
          value: b,
          onChange: x,
          label: "Warna Background"
        }
      ),
      /* @__PURE__ */ o(J, { type: "button", onClick: ap, className: "w-full", children: "Terapkan Warna" })
    ] }) }),
    /* @__PURE__ */ o(yt, { open: K, onOpenChange: q, children: /* @__PURE__ */ h(st, { children: [
      /* @__PURE__ */ o(at, { children: /* @__PURE__ */ o(it, { children: "Insert Image" }) }),
      /* @__PURE__ */ h("div", { className: "space-y-4", children: [
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o(Pe, { children: "URL Gambar" }),
          /* @__PURE__ */ o(
            nt,
            {
              value: ee,
              onChange: (R) => $(R.target.value),
              placeholder: "https://example.com/image.jpg"
            }
          )
        ] }),
        /* @__PURE__ */ o("div", { className: "text-center text-sm text-muted-foreground", children: "atau" }),
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o(Pe, { children: "Upload Gambar" }),
          /* @__PURE__ */ o(
            nt,
            {
              type: "file",
              accept: "image/*",
              onChange: (R) => O(R.target.files?.[0] || null)
            }
          )
        ] }),
        /* @__PURE__ */ o(J, { type: "button", onClick: Qf, className: "w-full", children: "Insert Image" })
      ] })
    ] }) }),
    /* @__PURE__ */ o(yt, { open: M, onOpenChange: ae, children: /* @__PURE__ */ h(st, { children: [
      /* @__PURE__ */ o(at, { children: /* @__PURE__ */ o(it, { children: "Insert Link" }) }),
      /* @__PURE__ */ h("div", { className: "space-y-4", children: [
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o(Pe, { children: "URL" }),
          /* @__PURE__ */ o(
            nt,
            {
              value: X,
              onChange: (R) => xe(R.target.value),
              placeholder: "https://example.com"
            }
          )
        ] }),
        /* @__PURE__ */ o(J, { type: "button", onClick: Xf, className: "w-full", children: "Insert Link" })
      ] })
    ] }) }),
    /* @__PURE__ */ o(yt, { open: qe, onOpenChange: Ne, children: /* @__PURE__ */ h(st, { children: [
      /* @__PURE__ */ o(at, { children: /* @__PURE__ */ o(it, { children: "Insert Table" }) }),
      /* @__PURE__ */ h("div", { className: "space-y-4", children: [
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o(Pe, { children: "Jumlah Baris" }),
          /* @__PURE__ */ o(
            nt,
            {
              type: "number",
              value: He,
              onChange: (R) => je(parseInt(R.target.value) || 3),
              min: "1",
              max: "20"
            }
          )
        ] }),
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o(Pe, { children: "Jumlah Kolom" }),
          /* @__PURE__ */ o(
            nt,
            {
              type: "number",
              value: F,
              onChange: (R) => le(parseInt(R.target.value) || 3),
              min: "1",
              max: "20"
            }
          )
        ] }),
        /* @__PURE__ */ o(J, { type: "button", onClick: Zf, className: "w-full", children: "Insert Table" })
      ] })
    ] }) }),
    /* @__PURE__ */ o(yt, { open: Fe, onOpenChange: ie, children: /* @__PURE__ */ h(st, { children: [
      /* @__PURE__ */ o(at, { children: /* @__PURE__ */ o(it, { children: "Insert Media" }) }),
      /* @__PURE__ */ h("div", { className: "space-y-4", children: [
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o(Pe, { children: "URL Media" }),
          /* @__PURE__ */ o(
            nt,
            {
              value: ce,
              onChange: (R) => we(R.target.value),
              placeholder: "https://example.com/video.mp4"
            }
          )
        ] }),
        /* @__PURE__ */ o("div", { className: "text-center text-sm text-muted-foreground", children: "atau" }),
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o(Pe, { children: "Upload Media" }),
          /* @__PURE__ */ o(
            nt,
            {
              type: "file",
              accept: "video/*,audio/*",
              onChange: (R) => ht(R.target.files?.[0] || null)
            }
          )
        ] }),
        /* @__PURE__ */ o(J, { type: "button", onClick: tp, className: "w-full", children: "Insert Media" })
      ] })
    ] }) }),
    /* @__PURE__ */ o(yt, { open: kf, onOpenChange: Na, children: /* @__PURE__ */ h(st, { children: [
      /* @__PURE__ */ o(at, { children: /* @__PURE__ */ o(it, { children: "Find" }) }),
      /* @__PURE__ */ h("div", { className: "space-y-4", children: [
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o(Pe, { children: "Find Text" }),
          /* @__PURE__ */ o(
            nt,
            {
              value: tt,
              onChange: (R) => Lo(R.target.value),
              placeholder: "Cari teks..."
            }
          )
        ] }),
        /* @__PURE__ */ o(J, { type: "button", onClick: Kf, className: "w-full", children: "Find Next" })
      ] })
    ] }) }),
    /* @__PURE__ */ o(yt, { open: jn, onOpenChange: tn, children: /* @__PURE__ */ h(st, { children: [
      /* @__PURE__ */ o(at, { children: /* @__PURE__ */ o(it, { children: "Find & Replace" }) }),
      /* @__PURE__ */ h("div", { className: "space-y-4", children: [
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o(Pe, { children: "Find" }),
          /* @__PURE__ */ o(
            nt,
            {
              value: tt,
              onChange: (R) => Lo(R.target.value),
              placeholder: "Cari teks..."
            }
          )
        ] }),
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o(Pe, { children: "Replace With" }),
          /* @__PURE__ */ o(
            nt,
            {
              value: Sa,
              onChange: (R) => xa(R.target.value),
              placeholder: "Ganti dengan..."
            }
          )
        ] }),
        /* @__PURE__ */ o(J, { type: "button", onClick: Vf, className: "w-full", children: "Replace All" })
      ] })
    ] }) }),
    /* @__PURE__ */ o(yt, { open: If, onOpenChange: Ea, children: /* @__PURE__ */ h(st, { className: "max-w-4xl max-h-[80vh] overflow-auto", children: [
      /* @__PURE__ */ o(at, { children: /* @__PURE__ */ o(it, { children: "Preview" }) }),
      /* @__PURE__ */ o(
        "div",
        {
          className: "prose max-w-none p-4 border border-border rounded-md bg-background",
          dangerouslySetInnerHTML: { __html: i.current?.innerHTML || "" }
        }
      )
    ] }) }),
    /* @__PURE__ */ o(yt, { open: Of, onOpenChange: $o, children: /* @__PURE__ */ h(st, { className: "max-w-2xl max-h-[80vh] overflow-auto", children: [
      /* @__PURE__ */ o(at, { children: /* @__PURE__ */ o(it, { children: "Help & Keyboard Shortcuts" }) }),
      /* @__PURE__ */ h("div", { className: "space-y-4 text-sm", children: [
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o("h3", { className: "font-semibold mb-2", children: "Formatting Shortcuts" }),
          /* @__PURE__ */ h("ul", { className: "space-y-1 text-muted-foreground", children: [
            /* @__PURE__ */ h("li", { children: [
              /* @__PURE__ */ o("kbd", { children: "Ctrl + B" }),
              " - Bold"
            ] }),
            /* @__PURE__ */ h("li", { children: [
              /* @__PURE__ */ o("kbd", { children: "Ctrl + I" }),
              " - Italic"
            ] }),
            /* @__PURE__ */ h("li", { children: [
              /* @__PURE__ */ o("kbd", { children: "Ctrl + U" }),
              " - Underline"
            ] }),
            /* @__PURE__ */ h("li", { children: [
              /* @__PURE__ */ o("kbd", { children: "Ctrl + Z" }),
              " - Undo"
            ] }),
            /* @__PURE__ */ h("li", { children: [
              /* @__PURE__ */ o("kbd", { children: "Ctrl + Y" }),
              " - Redo"
            ] }),
            /* @__PURE__ */ h("li", { children: [
              /* @__PURE__ */ o("kbd", { children: "Ctrl + A" }),
              " - Select All"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o("h3", { className: "font-semibold mb-2", children: "Features" }),
          /* @__PURE__ */ h("ul", { className: "space-y-1 text-muted-foreground", children: [
            /* @__PURE__ */ o("li", { children: "• Rich text formatting with bold, italic, underline" }),
            /* @__PURE__ */ o("li", { children: "• Text alignment and list formatting" }),
            /* @__PURE__ */ o("li", { children: "• Insert images, links, tables, and media" }),
            /* @__PURE__ */ o("li", { children: "• Find and replace text" }),
            /* @__PURE__ */ o("li", { children: "• Source code view" }),
            /* @__PURE__ */ o("li", { children: "• Fullscreen editing mode" }),
            /* @__PURE__ */ o("li", { children: "• Word count tracking" })
          ] })
        ] }),
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o("h3", { className: "font-semibold mb-2", children: "Tips" }),
          /* @__PURE__ */ h("ul", { className: "space-y-1 text-muted-foreground", children: [
            /* @__PURE__ */ o("li", { children: "• Use the toolbar for quick access to common formatting options" }),
            /* @__PURE__ */ o("li", { children: "• Select text before creating links" }),
            /* @__PURE__ */ o("li", { children: "• Tables can be edited after insertion by clicking on cells" }),
            /* @__PURE__ */ o("li", { children: "• Switch to Source Code view to see and edit HTML directly" })
          ] })
        ] })
      ] })
    ] }) })
  ] });
};
function jS({
  value: e,
  onChange: t,
  height: n = 500,
  label: r = "Content",
  className: s
}) {
  const { editorMode: a, setEditorMode: i } = Zc(), { theme: c } = tm(), [d, l] = W(!1), u = (g) => {
    t({
      wysiwyg: g,
      markdown: e.markdown
    });
  }, f = (g) => {
    t({
      wysiwyg: e.wysiwyg,
      markdown: g || ""
    });
  }, v = (g) => {
    let p = g;
    return p = p.replace(/^### (.*$)/gim, "<h3>$1</h3>"), p = p.replace(/^## (.*$)/gim, "<h2>$1</h2>"), p = p.replace(/^# (.*$)/gim, "<h1>$1</h1>"), p = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"), p = p.replace(/\*(.*?)\*/g, "<em>$1</em>"), p = p.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>'), p = p.replace(/^\* (.*$)/gim, "<li>$1</li>"), p = p.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>"), p = p.replace(/^\d+\. (.*$)/gim, "<li>$1</li>"), p = p.replace(/(<li>.*<\/li>)/s, "<ol>$1</ol>"), p = p.replace(/`(.*?)`/g, "<code>$1</code>"), p = p.replace(/\n\n/g, "</p><p>"), p = `<p>${p}</p>`, p;
  }, w = () => a === "wysiwyg" ? e.wysiwyg || "" : v(e.markdown || "");
  return /* @__PURE__ */ h("div", { className: ks("space-y-4", s), children: [
    /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ o("label", { className: "text-sm font-medium", children: r }),
      /* @__PURE__ */ h("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ o(pc, { value: a, onValueChange: (g) => i(g), children: /* @__PURE__ */ h(mc, { children: [
          /* @__PURE__ */ h(cn, { value: "wysiwyg", className: "text-xs", children: [
            /* @__PURE__ */ o(Jr, { className: "h-3 w-3 mr-1" }),
            "WYSIWYG"
          ] }),
          /* @__PURE__ */ h(cn, { value: "markdown", className: "text-xs", children: [
            /* @__PURE__ */ o(as, { className: "h-3 w-3 mr-1" }),
            "Markdown"
          ] })
        ] }) }),
        /* @__PURE__ */ h(
          oe,
          {
            type: "button",
            variant: d ? "default" : "outline",
            size: "sm",
            onClick: () => l(!d),
            children: [
              /* @__PURE__ */ o(Ft, { className: "h-4 w-4 mr-1" }),
              d ? "Hide" : "Preview"
            ]
          }
        )
      ] })
    ] }),
    d ? /* @__PURE__ */ o(Me, { children: /* @__PURE__ */ o(ke, { className: "p-6", children: /* @__PURE__ */ o(
      "div",
      {
        className: "prose dark:prose-invert max-w-none",
        dangerouslySetInnerHTML: { __html: w() }
      }
    ) }) }) : /* @__PURE__ */ o(Dt, { children: a === "wysiwyg" ? /* @__PURE__ */ o(
      HS,
      {
        value: e.wysiwyg || "",
        onChange: u,
        height: n,
        placeholder: "Start writing your content..."
      }
    ) : /* @__PURE__ */ o("div", { className: "border rounded-md overflow-hidden", children: /* @__PURE__ */ o(
      em,
      {
        height: n,
        defaultLanguage: "markdown",
        value: e.markdown || "",
        onChange: f,
        theme: c === "dark" ? "vs-dark" : "light",
        options: {
          minimap: { enabled: !1 },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: !1,
          wordWrap: "on",
          wrappingIndent: "same",
          padding: { top: 16, bottom: 16 },
          suggest: {
            showKeywords: !0,
            showSnippets: !0
          }
        }
      }
    ) }) }),
    a === "markdown" && !d && /* @__PURE__ */ h("div", { className: "text-xs text-muted-foreground space-y-1", children: [
      /* @__PURE__ */ o("p", { children: "Markdown Quick Reference:" }),
      /* @__PURE__ */ h("div", { className: "grid grid-cols-2 gap-2 mt-2", children: [
        /* @__PURE__ */ o("code", { className: "px-2 py-1 bg-muted rounded text-xs", children: "# Heading 1" }),
        /* @__PURE__ */ o("code", { className: "px-2 py-1 bg-muted rounded text-xs", children: "**Bold**" }),
        /* @__PURE__ */ o("code", { className: "px-2 py-1 bg-muted rounded text-xs", children: "## Heading 2" }),
        /* @__PURE__ */ o("code", { className: "px-2 py-1 bg-muted rounded text-xs", children: "*Italic*" }),
        /* @__PURE__ */ o("code", { className: "px-2 py-1 bg-muted rounded text-xs", children: "[Link](url)" }),
        /* @__PURE__ */ o("code", { className: "px-2 py-1 bg-muted rounded text-xs", children: "- List item" })
      ] })
    ] })
  ] });
}
const WS = j.object({
  content_type_uuid: j.string().min(1, "Content type is required"),
  title: j.string().min(1, "Title is required").max(500),
  slug: j.string().min(1, "Slug is required").max(500).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  content: j.union([
    j.object({
      wysiwyg: j.string().optional(),
      markdown: j.string().optional()
    }),
    j.any()
  ]).optional().default({ wysiwyg: "", markdown: "" }),
  excerpt: j.string().max(1e3).optional().or(j.literal("")),
  featured_image: j.string().url().optional().or(j.literal("")),
  categories: j.array(j.string()).optional().default([]),
  tags: j.array(j.string()).optional().default([]),
  metadata: j.any().optional().default({}),
  editor_format: j.enum(["wysiwyg", "markdown", "html"]).optional(),
  seo_title: j.string().max(255).optional().or(j.literal("")),
  seo_description: j.string().optional().or(j.literal("")),
  seo_keywords: j.array(j.string()).optional().default([]),
  canonical_url: j.string().url().optional().or(j.literal("")),
  is_featured: j.boolean().optional(),
  is_pinned: j.boolean().optional(),
  is_commentable: j.boolean().optional(),
  custom_url: j.string().max(500).optional().or(j.literal(""))
});
function KS() {
  const { uuid: e } = Is(), t = nr(), n = !!e, { data: r, isLoading: s } = ig(e), { data: a } = js(), { data: i } = pg(), c = cg(), d = lg(), l = Jc(), [u, f] = W([]), v = Os({
    resolver: Ds(WS),
    defaultValues: {
      content_type_uuid: "",
      title: "",
      slug: "",
      content: {
        wysiwyg: "",
        markdown: ""
      },
      excerpt: "",
      featured_image: "",
      categories: [],
      tags: [],
      metadata: {},
      editor_format: "wysiwyg",
      seo_title: "",
      seo_description: "",
      seo_keywords: [],
      canonical_url: "",
      is_featured: !1,
      is_pinned: !1,
      is_commentable: !0,
      custom_url: ""
    }
  });
  Xr(() => {
    if (r?.data) {
      const b = r.data, x = typeof b.content == "object" ? b.content : { wysiwyg: "", markdown: "" };
      v.reset({
        content_type_uuid: b.content_type.uuid,
        title: b.title,
        slug: b.slug,
        content: x,
        excerpt: b.excerpt || "",
        featured_image: b.featured_image || "",
        categories: b.categories?.map((E) => E.uuid) || [],
        tags: b.tags?.map((E) => E.uuid) || [],
        metadata: b.metadata || {},
        editor_format: b.editor_format || "wysiwyg",
        seo_title: b.seo_title || "",
        seo_description: b.seo_description || "",
        seo_keywords: b.seo_keywords || [],
        canonical_url: b.canonical_url || "",
        is_featured: b.is_featured || !1,
        is_pinned: b.is_pinned || !1,
        is_commentable: b.is_commentable ?? !0,
        custom_url: b.custom_url || ""
      }), f(b.categories?.map((E) => E.uuid) || []);
    }
  }, [r, v]);
  const w = (b) => b.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""), g = (b) => {
    if (v.setValue("title", b), !n) {
      const x = w(b);
      v.setValue("slug", x);
    }
  }, p = async (b) => {
    console.log("[ContentForm] onSubmit called with data:", b);
    try {
      if (n && e) {
        const x = {
          title: b.title,
          slug: b.slug,
          content: b.content,
          excerpt: b.excerpt || void 0,
          featured_image: b.featured_image || void 0,
          categories: b.categories,
          tags: b.tags,
          metadata: b.metadata,
          editor_format: b.editor_format,
          seo_title: b.seo_title || void 0,
          seo_description: b.seo_description || void 0,
          seo_keywords: b.seo_keywords,
          canonical_url: b.canonical_url || void 0,
          is_featured: b.is_featured,
          is_pinned: b.is_pinned,
          is_commentable: b.is_commentable,
          custom_url: b.custom_url || void 0
        };
        console.log("[ContentForm] Calling updateMutation with:", { uuid: e, input: x }), await d.mutateAsync({ uuid: e, input: x });
      } else {
        const x = {
          content_type_uuid: b.content_type_uuid,
          title: b.title,
          slug: b.slug,
          content: b.content,
          excerpt: b.excerpt || void 0,
          featured_image: b.featured_image || void 0,
          categories: b.categories,
          tags: b.tags,
          metadata: b.metadata,
          editor_format: b.editor_format || "wysiwyg",
          seo_title: b.seo_title || void 0,
          seo_description: b.seo_description || void 0,
          seo_keywords: b.seo_keywords,
          canonical_url: b.canonical_url || void 0,
          is_featured: b.is_featured,
          is_pinned: b.is_pinned,
          is_commentable: b.is_commentable,
          custom_url: b.custom_url || void 0
        };
        console.log("[ContentForm] Calling createMutation with:", x), await c.mutateAsync(x), t("/admin/cms/contents");
      }
    } catch (x) {
      console.error("[ContentForm] Failed to save content:", x), L.error("Gagal menyimpan content", {
        description: x instanceof Error ? x.message : "Terjadi kesalahan saat menyimpan"
      });
    }
  }, y = async () => {
    try {
      if (!e) {
        L.error("Cannot publish", {
          description: "Please save the content first before publishing."
        });
        return;
      }
      await l.mutateAsync({ uuid: e });
    } catch (b) {
      console.error("Failed to publish content:", b);
    }
  };
  if (n && s)
    return /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
      /* @__PURE__ */ o(_e, { className: "h-8 w-64" }),
      /* @__PURE__ */ o(_e, { className: "h-[800px] w-full" })
    ] });
  const C = a?.data || [], S = i?.data || [];
  return /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ o("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ h("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ h(oe, { type: "button", variant: "ghost", size: "sm", onClick: () => t("/admin/cms/contents"), children: [
        /* @__PURE__ */ o(ic, { className: "h-4 w-4 mr-2" }),
        "Back"
      ] }),
      /* @__PURE__ */ h("div", { children: [
        /* @__PURE__ */ o("h1", { className: "text-3xl font-bold tracking-tight", children: n ? "Edit Content" : "Create Content" }),
        /* @__PURE__ */ o("p", { className: "text-muted-foreground mt-1", children: n ? "Update your content" : "Create new content for your site" })
      ] })
    ] }) }),
    /* @__PURE__ */ o(Vs, { ...v, children: /* @__PURE__ */ o(
      "form",
      {
        onSubmit: (b) => {
          console.log("[ContentForm] Form submit event triggered"), console.log("[ContentForm] Form errors:", v.formState.errors), console.log("[ContentForm] Form values:", v.getValues()), v.handleSubmit(p, (x) => {
            console.error("[ContentForm] Validation errors:", x), L.error("Validasi gagal", {
              description: "Mohon periksa kembali data yang diisi"
            });
          })(b);
        },
        className: "space-y-6",
        children: /* @__PURE__ */ h("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ h("div", { className: "lg:col-span-2 space-y-6", children: [
            /* @__PURE__ */ h(Me, { children: [
              /* @__PURE__ */ o(Le, { children: /* @__PURE__ */ o(Ke, { children: "Content Details" }) }),
              /* @__PURE__ */ h(ke, { className: "space-y-4", children: [
                /* @__PURE__ */ o(
                  he,
                  {
                    control: v.control,
                    name: "content_type_uuid",
                    render: ({ field: b }) => /* @__PURE__ */ h(de, { children: [
                      /* @__PURE__ */ o(ve, { children: "Content Type" }),
                      /* @__PURE__ */ h(no, { onValueChange: b.onChange, value: b.value, children: [
                        /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(ro, { children: /* @__PURE__ */ o(oo, { placeholder: "Select content type" }) }) }),
                        /* @__PURE__ */ o(so, { children: C.map((x) => /* @__PURE__ */ o(vt, { value: x.uuid, children: x.name }, x.uuid)) })
                      ] }),
                      /* @__PURE__ */ o(Oe, {})
                    ] })
                  }
                ),
                /* @__PURE__ */ o(
                  he,
                  {
                    control: v.control,
                    name: "title",
                    render: ({ field: b }) => /* @__PURE__ */ h(de, { children: [
                      /* @__PURE__ */ o(ve, { children: "Title" }),
                      /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                        De,
                        {
                          ...b,
                          onChange: (x) => g(x.target.value),
                          placeholder: "Enter content title"
                        }
                      ) }),
                      /* @__PURE__ */ o(Oe, {})
                    ] })
                  }
                ),
                /* @__PURE__ */ o(
                  he,
                  {
                    control: v.control,
                    name: "slug",
                    render: ({ field: b }) => /* @__PURE__ */ h(de, { children: [
                      /* @__PURE__ */ o(ve, { children: "Slug" }),
                      /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(De, { ...b, placeholder: "content-slug" }) }),
                      /* @__PURE__ */ o(Te, { children: "URL-friendly identifier (lowercase, hyphens only)" }),
                      /* @__PURE__ */ o(Oe, {})
                    ] })
                  }
                ),
                /* @__PURE__ */ o(
                  he,
                  {
                    control: v.control,
                    name: "excerpt",
                    render: ({ field: b }) => /* @__PURE__ */ h(de, { children: [
                      /* @__PURE__ */ o(ve, { children: "Excerpt (Optional)" }),
                      /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                        kn,
                        {
                          ...b,
                          placeholder: "Brief summary of the content",
                          rows: 3
                        }
                      ) }),
                      /* @__PURE__ */ o(Te, { children: "Short description shown in listings (max 1000 characters)" }),
                      /* @__PURE__ */ o(Oe, {})
                    ] })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ h(Me, { children: [
              /* @__PURE__ */ o(Le, { children: /* @__PURE__ */ o(Ke, { children: "Content Body" }) }),
              /* @__PURE__ */ o(ke, { children: /* @__PURE__ */ o(
                he,
                {
                  control: v.control,
                  name: "content",
                  render: ({ field: b }) => /* @__PURE__ */ h(de, { children: [
                    /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                      jS,
                      {
                        value: b.value,
                        onChange: b.onChange,
                        height: 500
                      }
                    ) }),
                    /* @__PURE__ */ o(Te, { children: "💡 Gunakan toolbar untuk memformat teks, menambahkan gambar, tabel, dan lainnya." })
                  ] })
                }
              ) })
            ] }),
            /* @__PURE__ */ h(Me, { children: [
              /* @__PURE__ */ o(Le, { children: /* @__PURE__ */ o(Ke, { children: "SEO Settings" }) }),
              /* @__PURE__ */ h(ke, { className: "space-y-4", children: [
                /* @__PURE__ */ o(
                  he,
                  {
                    control: v.control,
                    name: "seo_title",
                    render: ({ field: b }) => /* @__PURE__ */ h(de, { children: [
                      /* @__PURE__ */ o(ve, { children: "SEO Title (Optional)" }),
                      /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(De, { ...b, placeholder: "SEO optimized title", maxLength: 255 }) }),
                      /* @__PURE__ */ o(Te, { children: "Custom title for search engines (max 255 characters)" }),
                      /* @__PURE__ */ o(Oe, {})
                    ] })
                  }
                ),
                /* @__PURE__ */ o(
                  he,
                  {
                    control: v.control,
                    name: "seo_description",
                    render: ({ field: b }) => /* @__PURE__ */ h(de, { children: [
                      /* @__PURE__ */ o(ve, { children: "SEO Description (Optional)" }),
                      /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                        kn,
                        {
                          ...b,
                          placeholder: "SEO meta description",
                          rows: 3
                        }
                      ) }),
                      /* @__PURE__ */ o(Te, { children: "Meta description for search results" }),
                      /* @__PURE__ */ o(Oe, {})
                    ] })
                  }
                ),
                /* @__PURE__ */ o(
                  he,
                  {
                    control: v.control,
                    name: "canonical_url",
                    render: ({ field: b }) => /* @__PURE__ */ h(de, { children: [
                      /* @__PURE__ */ o(ve, { children: "Canonical URL (Optional)" }),
                      /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(De, { ...b, placeholder: "https://example.com/canonical-url", type: "url" }) }),
                      /* @__PURE__ */ o(Te, { children: "Canonical URL to prevent duplicate content issues" }),
                      /* @__PURE__ */ o(Oe, {})
                    ] })
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ h("div", { className: "space-y-6", children: [
            /* @__PURE__ */ h(Me, { children: [
              /* @__PURE__ */ o(Le, { children: /* @__PURE__ */ o(Ke, { children: "Publish" }) }),
              /* @__PURE__ */ o(ke, { className: "space-y-4", children: /* @__PURE__ */ h("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ h(
                  oe,
                  {
                    type: "submit",
                    className: "w-full",
                    disabled: c.isPending || d.isPending,
                    children: [
                      /* @__PURE__ */ o(cc, { className: "h-4 w-4 mr-2" }),
                      c.isPending || d.isPending ? "Menyimpan..." : "Simpan Draft"
                    ]
                  }
                ),
                n && /* @__PURE__ */ h(
                  oe,
                  {
                    type: "button",
                    variant: "default",
                    className: "w-full bg-green-600 hover:bg-green-700 text-white",
                    onClick: y,
                    disabled: l.isPending,
                    children: [
                      /* @__PURE__ */ o(uc, { className: "h-4 w-4 mr-2" }),
                      l.isPending ? "Publishing..." : "Publish"
                    ]
                  }
                ),
                /* @__PURE__ */ h(oe, { type: "button", variant: "outline", className: "w-full", children: [
                  /* @__PURE__ */ o(Ft, { className: "h-4 w-4 mr-2" }),
                  "Preview"
                ] })
              ] }) })
            ] }),
            /* @__PURE__ */ h(Me, { children: [
              /* @__PURE__ */ o(Le, { children: /* @__PURE__ */ o(Ke, { children: "Content Options" }) }),
              /* @__PURE__ */ h(ke, { className: "space-y-4", children: [
                /* @__PURE__ */ o(
                  he,
                  {
                    control: v.control,
                    name: "is_featured",
                    render: ({ field: b }) => /* @__PURE__ */ h(de, { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ h("div", { children: [
                        /* @__PURE__ */ o(ve, { children: "Featured Content" }),
                        /* @__PURE__ */ o(Te, { children: "Mark as featured content" })
                      ] }),
                      /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                        Vt,
                        {
                          checked: b.value,
                          onCheckedChange: b.onChange
                        }
                      ) })
                    ] })
                  }
                ),
                /* @__PURE__ */ o(Ha, {}),
                /* @__PURE__ */ o(
                  he,
                  {
                    control: v.control,
                    name: "is_pinned",
                    render: ({ field: b }) => /* @__PURE__ */ h(de, { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ h("div", { children: [
                        /* @__PURE__ */ o(ve, { children: "Pinned" }),
                        /* @__PURE__ */ o(Te, { children: "Pin to top of list" })
                      ] }),
                      /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                        Vt,
                        {
                          checked: b.value,
                          onCheckedChange: b.onChange
                        }
                      ) })
                    ] })
                  }
                ),
                /* @__PURE__ */ o(Ha, {}),
                /* @__PURE__ */ o(
                  he,
                  {
                    control: v.control,
                    name: "is_commentable",
                    render: ({ field: b }) => /* @__PURE__ */ h(de, { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ h("div", { children: [
                        /* @__PURE__ */ o(ve, { children: "Allow Comments" }),
                        /* @__PURE__ */ o(Te, { children: "Enable comments for this content" })
                      ] }),
                      /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
                        Vt,
                        {
                          checked: b.value,
                          onCheckedChange: b.onChange
                        }
                      ) })
                    ] })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ h(Me, { children: [
              /* @__PURE__ */ o(Le, { children: /* @__PURE__ */ o(Ke, { children: "Categories" }) }),
              /* @__PURE__ */ o(ke, { children: /* @__PURE__ */ o(
                he,
                {
                  control: v.control,
                  name: "categories",
                  render: ({ field: b }) => /* @__PURE__ */ h(de, { children: [
                    /* @__PURE__ */ o("div", { className: "space-y-2 max-h-[300px] overflow-y-auto", children: S.length === 0 ? /* @__PURE__ */ o("p", { className: "text-sm text-muted-foreground", children: "No categories available" }) : S.map((x) => /* @__PURE__ */ h("div", { className: "flex items-center space-x-2", children: [
                      /* @__PURE__ */ o(
                        "input",
                        {
                          type: "checkbox",
                          id: `category-${x.uuid}`,
                          checked: u.includes(x.uuid),
                          onChange: (E) => {
                            const k = E.target.checked ? [...u, x.uuid] : u.filter((T) => T !== x.uuid);
                            f(k), b.onChange(k);
                          },
                          className: "h-4 w-4 rounded border-gray-300"
                        }
                      ),
                      /* @__PURE__ */ o(
                        "label",
                        {
                          htmlFor: `category-${x.uuid}`,
                          className: "text-sm font-medium leading-none cursor-pointer",
                          children: x.name
                        }
                      )
                    ] }, x.uuid)) }),
                    /* @__PURE__ */ o(Oe, {})
                  ] })
                }
              ) })
            ] })
          ] })
        ] })
      }
    ) })
  ] });
}
const VS = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: KS
}, Symbol.toStringTag, { value: "Module" }));
function GS({ nodes: e, onEdit: t, onAdd: n, onDelete: r, className: s }) {
  return !e || e.length === 0 ? /* @__PURE__ */ h("div", { className: "text-center py-12 text-muted-foreground", children: [
    /* @__PURE__ */ o(fc, { className: "h-12 w-12 mx-auto mb-3 opacity-30" }),
    /* @__PURE__ */ o("p", { className: "text-lg font-medium", children: "No categories found" }),
    /* @__PURE__ */ o("p", { className: "text-sm mt-1", children: "Create your first category to organize content" })
  ] }) : /* @__PURE__ */ o("div", { className: ks("space-y-1", s), children: e.map((a) => /* @__PURE__ */ o(
    vf,
    {
      node: a,
      onEdit: t,
      onAdd: n,
      onDelete: r
    },
    a.uuid
  )) });
}
function vf({ node: e, onEdit: t, onAdd: n, onDelete: r }) {
  const { expandedNodes: s, toggleNode: a, selectedCategoryId: i, setSelectedCategoryId: c } = el(), d = yg(), l = s.has(e.uuid), u = e.children && e.children.length > 0, f = i === e.uuid, v = () => {
    u && a(e.uuid);
  }, w = () => {
    c(e.uuid);
  }, g = () => {
    t?.(e);
  }, p = () => {
    n?.(e.uuid);
  }, y = () => {
    window.confirm(`Are you sure you want to delete "${e.name}"? This will also delete all subcategories.`) && (d.mutate(e.uuid), r?.(e.uuid));
  };
  return /* @__PURE__ */ h("div", { className: "select-none", children: [
    /* @__PURE__ */ h(
      "div",
      {
        className: ks(
          "flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent/50 transition-colors group",
          f && "bg-accent"
        ),
        style: { paddingLeft: `${e.depth * 20 + 12}px` },
        children: [
          /* @__PURE__ */ o(
            "button",
            {
              onClick: v,
              className: "flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-accent rounded-sm transition-colors",
              children: u ? l ? /* @__PURE__ */ o(Ps, { className: "h-4 w-4 text-muted-foreground" }) : /* @__PURE__ */ o(dc, { className: "h-4 w-4 text-muted-foreground" }) : /* @__PURE__ */ o("div", { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ o(Fp, { className: "h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" }),
          /* @__PURE__ */ h(
            "div",
            {
              className: "flex-1 flex items-center gap-2 cursor-pointer min-w-0",
              onClick: w,
              children: [
                /* @__PURE__ */ o(fc, { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }),
                /* @__PURE__ */ o("span", { className: "font-medium truncate", children: e.name }),
                e.content_count !== void 0 && e.content_count > 0 && /* @__PURE__ */ o(un, { variant: "secondary", className: "ml-auto flex-shrink-0", children: e.content_count })
              ]
            }
          ),
          /* @__PURE__ */ o("div", { className: "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ h(Ur, { children: [
            /* @__PURE__ */ o(Br, { asChild: !0, children: /* @__PURE__ */ h(oe, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: [
              /* @__PURE__ */ o(Fr, { className: "h-4 w-4" }),
              /* @__PURE__ */ o("span", { className: "sr-only", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ h(zr, { align: "end", children: [
              /* @__PURE__ */ h(Be, { onClick: g, children: [
                /* @__PURE__ */ o(Lr, { className: "h-4 w-4 mr-2" }),
                "Edit"
              ] }),
              /* @__PURE__ */ h(Be, { onClick: p, children: [
                /* @__PURE__ */ o(Pn, { className: "h-4 w-4 mr-2" }),
                "Add Subcategory"
              ] }),
              /* @__PURE__ */ o(Kp, {}),
              /* @__PURE__ */ h(
                Be,
                {
                  onClick: y,
                  className: "text-destructive focus:text-destructive",
                  children: [
                    /* @__PURE__ */ o($r, { className: "h-4 w-4 mr-2" }),
                    "Delete"
                  ]
                }
              )
            ] })
          ] }) })
        ]
      }
    ),
    u && l && /* @__PURE__ */ o("div", { children: e.children.map((C) => /* @__PURE__ */ o(
      vf,
      {
        node: C,
        onEdit: t,
        onAdd: n,
        onDelete: r
      },
      C.uuid
    )) })
  ] });
}
const QS = j.object({
  name: j.string().min(1, "Name is required").max(255, "Name is too long"),
  slug: j.string().min(1, "Slug is required").max(255, "Slug is too long").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: j.string().optional(),
  parent_uuid: j.string().optional().nullable(),
  sort_order: j.number().min(0).optional()
});
function YS({
  open: e,
  onOpenChange: t,
  category: n,
  parentUuid: r,
  contentTypeUuid: s,
  categories: a
}) {
  const i = hg(), c = gg(), d = !!n, l = Os({
    resolver: Ds(QS),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parent_uuid: r || null,
      sort_order: 0
    }
  });
  Xr(() => {
    n ? l.reset({
      name: n.name,
      slug: n.slug,
      description: n.description || "",
      parent_uuid: n.parent_uuid,
      sort_order: n.sort_order
    }) : l.reset({
      name: "",
      slug: "",
      description: "",
      parent_uuid: r || null,
      sort_order: 0
    });
  }, [n, r, l]);
  const u = (p) => p.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""), f = (p) => {
    if (l.setValue("name", p), !d) {
      const y = u(p);
      l.setValue("slug", y);
    }
  }, v = async (p) => {
    try {
      if (d && n) {
        const y = {
          name: p.name,
          slug: p.slug,
          description: p.description || void 0
        };
        await c.mutateAsync({
          uuid: n.uuid,
          input: y
        });
      } else {
        const y = {
          content_type_uuid: s,
          name: p.name,
          slug: p.slug,
          description: p.description || void 0,
          parent_uuid: p.parent_uuid || void 0,
          sort_order: p.sort_order || 0
        };
        await i.mutateAsync(y);
      }
      t(!1), l.reset();
    } catch (y) {
      console.error("Failed to save category:", y);
    }
  }, w = (p, y = "") => {
    const C = [];
    return p.forEach((S) => {
      (!n || S.uuid !== n.uuid) && (C.push({
        uuid: S.uuid,
        label: y + S.name
      }), S.children && S.children.length > 0 && C.push(...w(S.children, y + S.name + " / ")));
    }), C;
  }, g = w(a);
  return /* @__PURE__ */ o(hc, { open: e, onOpenChange: t, children: /* @__PURE__ */ h(gc, { className: "sm:max-w-[500px]", children: [
    /* @__PURE__ */ h(yc, { children: [
      /* @__PURE__ */ o(vc, { children: d ? "Edit Category" : "Create Category" }),
      /* @__PURE__ */ o(wc, { children: d ? "Update the category information below." : "Create a new category to organize your content." })
    ] }),
    /* @__PURE__ */ o(Vs, { ...l, children: /* @__PURE__ */ h("form", { onSubmit: l.handleSubmit(v), className: "space-y-4", children: [
      /* @__PURE__ */ o(
        he,
        {
          control: l.control,
          name: "name",
          render: ({ field: p }) => /* @__PURE__ */ h(de, { children: [
            /* @__PURE__ */ o(ve, { children: "Name" }),
            /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
              De,
              {
                ...p,
                onChange: (y) => f(y.target.value),
                placeholder: "Category name"
              }
            ) }),
            /* @__PURE__ */ o(Oe, {})
          ] })
        }
      ),
      /* @__PURE__ */ o(
        he,
        {
          control: l.control,
          name: "slug",
          render: ({ field: p }) => /* @__PURE__ */ h(de, { children: [
            /* @__PURE__ */ o(ve, { children: "Slug" }),
            /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(De, { ...p, placeholder: "category-slug" }) }),
            /* @__PURE__ */ o(Te, { children: "URL-friendly identifier (lowercase, hyphens only)" }),
            /* @__PURE__ */ o(Oe, {})
          ] })
        }
      ),
      /* @__PURE__ */ o(
        he,
        {
          control: l.control,
          name: "description",
          render: ({ field: p }) => /* @__PURE__ */ h(de, { children: [
            /* @__PURE__ */ o(ve, { children: "Description (Optional)" }),
            /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(
              kn,
              {
                ...p,
                placeholder: "Brief description of this category",
                rows: 3
              }
            ) }),
            /* @__PURE__ */ o(Oe, {})
          ] })
        }
      ),
      /* @__PURE__ */ o(
        he,
        {
          control: l.control,
          name: "parent_uuid",
          render: ({ field: p }) => /* @__PURE__ */ h(de, { children: [
            /* @__PURE__ */ o(ve, { children: "Parent Category (Optional)" }),
            /* @__PURE__ */ h(
              no,
              {
                onValueChange: p.onChange,
                value: p.value || void 0,
                children: [
                  /* @__PURE__ */ o(ge, { children: /* @__PURE__ */ o(ro, { children: /* @__PURE__ */ o(oo, { placeholder: "Select parent category (none for root)" }) }) }),
                  /* @__PURE__ */ h(so, { children: [
                    /* @__PURE__ */ o(vt, { value: "null", children: "None (Root Level)" }),
                    g.map((y) => /* @__PURE__ */ o(vt, { value: y.uuid, children: y.label }, y.uuid))
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ o(Te, { children: "Choose a parent to create a nested category structure" }),
            /* @__PURE__ */ o(Oe, {})
          ] })
        }
      ),
      /* @__PURE__ */ h(Vp, { children: [
        /* @__PURE__ */ o(
          oe,
          {
            type: "button",
            variant: "outline",
            onClick: () => t(!1),
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ o(
          oe,
          {
            type: "submit",
            disabled: i.isPending || c.isPending,
            children: i.isPending || c.isPending ? "Saving..." : d ? "Update" : "Create"
          }
        )
      ] })
    ] }) })
  ] }) });
}
function XS() {
  const { data: e, isLoading: t } = mg(), { data: n } = js(), { expandAll: r, collapseAll: s } = el(), [a, i] = W(!1), [c, d] = W(null), [l, u] = W(null), [f, v] = W(""), [w, g] = W("all"), p = e?.data || [], y = n?.data || [], C = y.find((P) => P.is_active && P.uuid === w), S = (P = null) => {
    d(null), u(P), i(!0);
  }, b = (P) => {
    d(P), u(null), i(!0);
  }, x = (P) => {
    console.log("Category deleted:", P);
  }, E = () => {
    i(!1), d(null), u(null);
  }, k = (P) => {
    if (!f) return P;
    const B = f.toLowerCase();
    return P.map((z) => {
      const H = z.name.toLowerCase().includes(B) || z.slug.toLowerCase().includes(B), I = k(z.children || []);
      return H || I.length > 0 ? {
        ...z,
        children: I
      } : null;
    }).filter(Boolean);
  }, T = k(p);
  return t ? /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ o(_e, { className: "h-8 w-48" }),
      /* @__PURE__ */ o(_e, { className: "h-10 w-32" })
    ] }),
    /* @__PURE__ */ o(_e, { className: "h-[600px] w-full" })
  ] }) : /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ h("div", { children: [
        /* @__PURE__ */ o("h1", { className: "text-3xl font-bold tracking-tight", children: "Categories" }),
        /* @__PURE__ */ o("p", { className: "text-muted-foreground mt-1", children: "Organize your content with hierarchical categories" })
      ] }),
      /* @__PURE__ */ h(oe, { onClick: () => S(), children: [
        /* @__PURE__ */ o(Pn, { className: "h-4 w-4 mr-2" }),
        "New Category"
      ] })
    ] }),
    /* @__PURE__ */ h("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ o("div", { className: "flex-1", children: /* @__PURE__ */ h("div", { className: "relative", children: [
        /* @__PURE__ */ o(Mn, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ o(
          De,
          {
            placeholder: "Search categories...",
            value: f,
            onChange: (P) => v(P.target.value),
            className: "pl-9"
          }
        )
      ] }) }),
      /* @__PURE__ */ h(no, { value: w, onValueChange: g, children: [
        /* @__PURE__ */ o(ro, { className: "w-[200px]", children: /* @__PURE__ */ o(oo, { placeholder: "All Content Types" }) }),
        /* @__PURE__ */ h(so, { children: [
          /* @__PURE__ */ o(vt, { value: "all", children: "All Content Types" }),
          y.map((P) => /* @__PURE__ */ o(vt, { value: P.uuid, children: P.name }, P.uuid))
        ] })
      ] }),
      /* @__PURE__ */ h("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ h(oe, { variant: "outline", size: "sm", onClick: r, children: [
          /* @__PURE__ */ o(Lp, { className: "h-4 w-4 mr-2" }),
          "Expand All"
        ] }),
        /* @__PURE__ */ h(oe, { variant: "outline", size: "sm", onClick: s, children: [
          /* @__PURE__ */ o($p, { className: "h-4 w-4 mr-2" }),
          "Collapse All"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ h(Me, { children: [
      /* @__PURE__ */ o(Le, { className: "border-b", children: /* @__PURE__ */ o(Ke, { children: "Category Tree" }) }),
      /* @__PURE__ */ o(ke, { className: "p-6", children: /* @__PURE__ */ o(
        GS,
        {
          nodes: T,
          onEdit: b,
          onAdd: S,
          onDelete: x
        }
      ) })
    ] }),
    y.length > 0 && /* @__PURE__ */ o(
      YS,
      {
        open: a,
        onOpenChange: E,
        category: c,
        parentUuid: l,
        contentTypeUuid: C?.uuid || y[0]?.uuid || "",
        categories: p
      }
    )
  ] });
}
const JS = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: XS
}, Symbol.toStringTag, { value: "Module" }));
function ZS() {
  const { activeTab: e, setActiveTab: t, filters: n, setFilters: r } = Mg(), { data: s, isLoading: a } = vg({ ...n, status: e === "all" ? void 0 : e }), i = xg(), c = Ng(), d = Eg(), l = s?.data || [], u = (g) => {
    r({ search: g });
  }, f = (g) => {
    i.mutate(g);
  }, v = (g) => {
    c.mutate({ uuid: g });
  }, w = (g) => {
    d.mutate(g);
  };
  return a ? /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ o(_e, { className: "h-8 w-48" }),
    /* @__PURE__ */ o(_e, { className: "h-[600px] w-full" })
  ] }) : /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ h("div", { children: [
      /* @__PURE__ */ o("h1", { className: "text-3xl font-bold tracking-tight", children: "Comment Moderation" }),
      /* @__PURE__ */ o("p", { className: "text-muted-foreground mt-1", children: "Review and moderate user comments" })
    ] }),
    /* @__PURE__ */ h(pc, { value: e, onValueChange: (g) => t(g), className: "space-y-4", children: [
      /* @__PURE__ */ h(mc, { children: [
        /* @__PURE__ */ h(cn, { value: "pending", children: [
          "Pending",
          l.filter((g) => g.status === "pending").length > 0 && /* @__PURE__ */ o(un, { variant: "destructive", className: "ml-2", children: l.filter((g) => g.status === "pending").length })
        ] }),
        /* @__PURE__ */ o(cn, { value: "approved", children: "Approved" }),
        /* @__PURE__ */ o(cn, { value: "rejected", children: "Rejected" }),
        /* @__PURE__ */ o(cn, { value: "spam", children: "Spam" }),
        /* @__PURE__ */ o(cn, { value: "all", children: "All" })
      ] }),
      /* @__PURE__ */ h(Me, { children: [
        /* @__PURE__ */ o(Le, { className: "border-b", children: /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ h(Ke, { children: [
            "Comments (",
            l.length,
            ")"
          ] }),
          /* @__PURE__ */ h("div", { className: "relative w-64", children: [
            /* @__PURE__ */ o(Mn, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ o(
              De,
              {
                placeholder: "Search comments...",
                className: "pl-9",
                value: n.search || "",
                onChange: (g) => u(g.target.value)
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ o(ke, { className: "p-0", children: l.length === 0 ? /* @__PURE__ */ h("div", { className: "text-center py-12 text-muted-foreground", children: [
          /* @__PURE__ */ o("p", { className: "text-lg font-medium", children: "No comments found" }),
          /* @__PURE__ */ o("p", { className: "text-sm", children: "Comments will appear here when users submit them" })
        ] }) : /* @__PURE__ */ o("div", { className: "overflow-x-auto", children: /* @__PURE__ */ h(Zr, { children: [
          /* @__PURE__ */ o(eo, { children: /* @__PURE__ */ h(Gt, { children: [
            /* @__PURE__ */ o(Ce, { className: "w-[30%]", children: "Author" }),
            /* @__PURE__ */ o(Ce, { className: "w-[40%]", children: "Comment" }),
            /* @__PURE__ */ o(Ce, { children: "Content" }),
            /* @__PURE__ */ o(Ce, { children: "Date" }),
            /* @__PURE__ */ o(Ce, { className: "text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ o(to, { children: l.map((g) => /* @__PURE__ */ h(Gt, { children: [
            /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ h("div", { children: [
              /* @__PURE__ */ o("p", { className: "font-medium", children: g.author_name }),
              /* @__PURE__ */ o("p", { className: "text-sm text-muted-foreground", children: g.author_email })
            ] }) }),
            /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ o("p", { className: "text-sm line-clamp-2", children: g.content }) }),
            /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ o("span", { className: "text-sm text-muted-foreground line-clamp-1", children: g.content_title || "Unknown" }) }),
            /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ o("span", { className: "text-sm text-muted-foreground", children: Xn(new Date(g.created_at), { addSuffix: !0 }) }) }),
            /* @__PURE__ */ o(Se, { className: "text-right", children: /* @__PURE__ */ o("div", { className: "flex items-center justify-end gap-1", children: g.status === "pending" && /* @__PURE__ */ h(Dt, { children: [
              /* @__PURE__ */ o(
                oe,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => f(g.uuid),
                  className: "text-green-600 hover:text-green-700",
                  children: /* @__PURE__ */ o(Ms, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ o(
                oe,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => v(g.uuid),
                  className: "text-red-600 hover:text-red-700",
                  children: /* @__PURE__ */ o(lc, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ o(
                oe,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => w(g.uuid),
                  className: "text-orange-600 hover:text-orange-700",
                  children: /* @__PURE__ */ o(Up, { className: "h-4 w-4" })
                }
              )
            ] }) }) })
          ] }, g.uuid)) })
        ] }) }) })
      ] })
    ] })
  ] });
}
const ex = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ZS
}, Symbol.toStringTag, { value: "Module" }));
function tx() {
  const { contentUuid: e } = Is(), t = nr(), [n, r] = W(null), [s, a] = W(!1), { data: i, isLoading: c, refetch: d } = Tg(e), l = _g(), u = i?.data || [], f = async (w) => {
    if (confirm("Are you sure you want to revert to this revision? This action will create a new revision with the content from this version."))
      try {
        await l.mutateAsync(w), d();
      } catch (g) {
        console.error("Failed to revert revision:", g);
      }
  }, v = (w) => {
    r(w), a(!0);
  };
  return c ? /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ o(_e, { className: "h-8 w-48" }),
      /* @__PURE__ */ o(_e, { className: "h-10 w-32" })
    ] }),
    /* @__PURE__ */ o("div", { className: "space-y-3", children: [...Array(5)].map((w, g) => /* @__PURE__ */ o(_e, { className: "h-16 w-full" }, g)) })
  ] }) : e ? /* @__PURE__ */ h("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ h("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ h("div", { children: [
        /* @__PURE__ */ o("h1", { className: "text-3xl font-bold tracking-tight", children: "Revision History" }),
        /* @__PURE__ */ o("p", { className: "text-muted-foreground mt-1", children: "View and restore previous versions of this content" })
      ] }),
      /* @__PURE__ */ o(oe, { variant: "outline", onClick: () => t(-1), children: "Back to Content" })
    ] }),
    u.length === 0 ? /* @__PURE__ */ o(Me, { children: /* @__PURE__ */ h(ke, { className: "pt-6 text-center", children: [
      /* @__PURE__ */ o(Bp, { className: "h-12 w-12 mx-auto text-muted-foreground mb-4" }),
      /* @__PURE__ */ o("h3", { className: "text-lg font-semibold mb-2", children: "No Revisions Yet" }),
      /* @__PURE__ */ o("p", { className: "text-muted-foreground", children: "Revisions will appear here as you edit and save this content." })
    ] }) }) : /* @__PURE__ */ h(Me, { children: [
      /* @__PURE__ */ o(Le, { className: "border-b", children: /* @__PURE__ */ h(Ke, { children: [
        "All Revisions (",
        u.length,
        ")"
      ] }) }),
      /* @__PURE__ */ o(ke, { className: "p-0", children: /* @__PURE__ */ h(Zr, { children: [
        /* @__PURE__ */ o(eo, { children: /* @__PURE__ */ h(Gt, { children: [
          /* @__PURE__ */ o(Ce, { className: "w-[100px]", children: "Version" }),
          /* @__PURE__ */ o(Ce, { children: "Title" }),
          /* @__PURE__ */ o(Ce, { children: "Author" }),
          /* @__PURE__ */ o(Ce, { children: "Date" }),
          /* @__PURE__ */ o(Ce, { className: "text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ o(to, { children: u.map((w, g) => /* @__PURE__ */ h(Gt, { className: "group", children: [
          /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ h("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ h(un, { variant: g === 0 ? "default" : "secondary", children: [
              "v",
              w.version_number
            ] }),
            g === 0 && /* @__PURE__ */ o(un, { variant: "outline", className: "text-xs", children: "Current" })
          ] }) }),
          /* @__PURE__ */ o(Se, { className: "font-medium", children: w.title }),
          /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ h("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ o(zp, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ o("span", { className: "text-sm", children: w.created_by.name })
          ] }) }),
          /* @__PURE__ */ o(Se, { children: /* @__PURE__ */ h("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ o(qp, { className: "h-4 w-4" }),
            Xn(new Date(w.created_at), { addSuffix: !0 })
          ] }) }),
          /* @__PURE__ */ o(Se, { className: "text-right", children: /* @__PURE__ */ h("div", { className: "flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [
            /* @__PURE__ */ h(
              oe,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => v(w),
                children: [
                  /* @__PURE__ */ o(Ft, { className: "h-4 w-4 mr-2" }),
                  "Preview"
                ]
              }
            ),
            g !== 0 && /* @__PURE__ */ h(
              oe,
              {
                variant: "outline",
                size: "sm",
                onClick: () => f(w.uuid),
                disabled: l.isPending,
                children: [
                  /* @__PURE__ */ o(Hp, { className: "h-4 w-4 mr-2" }),
                  "Revert"
                ]
              }
            )
          ] }) })
        ] }, w.uuid)) })
      ] }) })
    ] }),
    /* @__PURE__ */ o(hc, { open: s, onOpenChange: a, children: /* @__PURE__ */ h(gc, { className: "max-w-4xl max-h-[80vh] overflow-y-auto", children: [
      /* @__PURE__ */ h(yc, { children: [
        /* @__PURE__ */ h(vc, { children: [
          "Revision Preview: v",
          n?.version_number
        ] }),
        /* @__PURE__ */ h(wc, { children: [
          "Created by ",
          n?.created_by.name,
          " on ",
          n?.created_at && new Date(n.created_at).toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ h("div", { className: "space-y-4", children: [
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o("h3", { className: "text-lg font-semibold mb-2", children: "Title" }),
          /* @__PURE__ */ o("p", { className: "text-foreground", children: n?.title })
        ] }),
        /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o("h3", { className: "text-lg font-semibold mb-2", children: "Content" }),
          /* @__PURE__ */ o(
            "div",
            {
              className: "prose dark:prose-invert max-w-none p-4 rounded-lg border bg-muted/50",
              dangerouslySetInnerHTML: { __html: n?.body || "" }
            }
          )
        ] }),
        n?.metadata && Object.keys(n.metadata).length > 0 && /* @__PURE__ */ h("div", { children: [
          /* @__PURE__ */ o("h3", { className: "text-lg font-semibold mb-2", children: "Metadata" }),
          /* @__PURE__ */ o("pre", { className: "p-4 rounded-lg border bg-muted/50 text-sm overflow-x-auto", children: JSON.stringify(n.metadata, null, 2) })
        ] })
      ] })
    ] }) })
  ] }) : /* @__PURE__ */ o("div", { className: "p-6", children: /* @__PURE__ */ o(Me, { children: /* @__PURE__ */ o(ke, { className: "pt-6 text-center text-muted-foreground", children: "Invalid content UUID" }) }) });
}
const nx = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: tx
}, Symbol.toStringTag, { value: "Module" })), bN = [
  {
    path: "/admin/cms/content-types",
    component: "ContentTypeList",
    requiresPermission: "pages:content-types:view"
  },
  {
    path: "/admin/cms/content-types/new",
    component: "ContentTypeForm",
    requiresPermission: "pages:content-types:create"
  },
  {
    path: "/admin/cms/content-types/:uuid",
    component: "ContentTypeForm",
    requiresPermission: "pages:content-types:update"
  },
  {
    path: "/admin/cms/contents",
    component: "ContentList",
    requiresPermission: "pages:contents:view"
  },
  {
    path: "/admin/cms/contents/new",
    component: "ContentForm",
    requiresPermission: "pages:contents:create"
  },
  {
    path: "/admin/cms/contents/:uuid",
    component: "ContentForm",
    requiresPermission: "pages:contents:update"
  },
  {
    path: "/admin/cms/categories",
    component: "CategoryManagement",
    requiresPermission: "pages:categories:view"
  },
  {
    path: "/admin/cms/comments",
    component: "CommentModeration",
    requiresPermission: "pages:comments:view"
  }
], CN = [];
function rx(e, t = []) {
  let n = [];
  function r(a, i) {
    const c = m.createContext(i);
    c.displayName = a + "Context";
    const d = n.length;
    n = [...n, i];
    const l = (f) => {
      const { scope: v, children: w, ...g } = f, p = v?.[e]?.[d] || c, y = m.useMemo(() => g, Object.values(g));
      return /* @__PURE__ */ o(p.Provider, { value: y, children: w });
    };
    l.displayName = a + "Provider";
    function u(f, v) {
      const w = v?.[e]?.[d] || c, g = m.useContext(w);
      if (g) return g;
      if (i !== void 0) return i;
      throw new Error(`\`${f}\` must be used within \`${a}\``);
    }
    return [l, u];
  }
  const s = () => {
    const a = n.map((i) => m.createContext(i));
    return function(c) {
      const d = c?.[e] || a;
      return m.useMemo(
        () => ({ [`__scope${e}`]: { ...c, [e]: d } }),
        [c, d]
      );
    };
  };
  return s.scopeName = e, [r, ox(s, ...t)];
}
function ox(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const n = () => {
    const r = e.map((s) => ({
      useScope: s(),
      scopeName: s.scopeName
    }));
    return function(a) {
      const i = r.reduce((c, { useScope: d, scopeName: l }) => {
        const f = d(a)[`__scope${l}`];
        return { ...c, ...f };
      }, {});
      return m.useMemo(() => ({ [`__scope${t.scopeName}`]: i }), [i]);
    };
  };
  return n.scopeName = t.scopeName, n;
}
var sx = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
], ba = sx.reduce((e, t) => {
  const n = Lt(`Primitive.${t}`), r = m.forwardRef((s, a) => {
    const { asChild: i, ...c } = s, d = i ? n : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ o(d, { ...c, ref: a });
  });
  return r.displayName = `Primitive.${t}`, { ...e, [t]: r };
}, {}), Rs = { exports: {} }, rs = {};
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Zi;
function ax() {
  if (Zi) return rs;
  Zi = 1;
  var e = Ot;
  function t(f, v) {
    return f === v && (f !== 0 || 1 / f === 1 / v) || f !== f && v !== v;
  }
  var n = typeof Object.is == "function" ? Object.is : t, r = e.useState, s = e.useEffect, a = e.useLayoutEffect, i = e.useDebugValue;
  function c(f, v) {
    var w = v(), g = r({ inst: { value: w, getSnapshot: v } }), p = g[0].inst, y = g[1];
    return a(
      function() {
        p.value = w, p.getSnapshot = v, d(p) && y({ inst: p });
      },
      [f, w, v]
    ), s(
      function() {
        return d(p) && y({ inst: p }), f(function() {
          d(p) && y({ inst: p });
        });
      },
      [f]
    ), i(w), w;
  }
  function d(f) {
    var v = f.getSnapshot;
    f = f.value;
    try {
      var w = v();
      return !n(f, w);
    } catch {
      return !0;
    }
  }
  function l(f, v) {
    return v();
  }
  var u = typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u" ? l : c;
  return rs.useSyncExternalStore = e.useSyncExternalStore !== void 0 ? e.useSyncExternalStore : u, rs;
}
var os = {};
/**
 * @license React
 * use-sync-external-store-shim.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ec;
function ix() {
  return ec || (ec = 1, process.env.NODE_ENV !== "production" && function() {
    function e(w, g) {
      return w === g && (w !== 0 || 1 / w === 1 / g) || w !== w && g !== g;
    }
    function t(w, g) {
      u || s.startTransition === void 0 || (u = !0, console.error(
        "You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."
      ));
      var p = g();
      if (!f) {
        var y = g();
        a(p, y) || (console.error(
          "The result of getSnapshot should be cached to avoid an infinite loop"
        ), f = !0);
      }
      y = i({
        inst: { value: p, getSnapshot: g }
      });
      var C = y[0].inst, S = y[1];
      return d(
        function() {
          C.value = p, C.getSnapshot = g, n(C) && S({ inst: C });
        },
        [w, p, g]
      ), c(
        function() {
          return n(C) && S({ inst: C }), w(function() {
            n(C) && S({ inst: C });
          });
        },
        [w]
      ), l(p), p;
    }
    function n(w) {
      var g = w.getSnapshot;
      w = w.value;
      try {
        var p = g();
        return !a(w, p);
      } catch {
        return !0;
      }
    }
    function r(w, g) {
      return g();
    }
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var s = Ot, a = typeof Object.is == "function" ? Object.is : e, i = s.useState, c = s.useEffect, d = s.useLayoutEffect, l = s.useDebugValue, u = !1, f = !1, v = typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u" ? r : t;
    os.useSyncExternalStore = s.useSyncExternalStore !== void 0 ? s.useSyncExternalStore : v, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
  }()), os;
}
process.env.NODE_ENV === "production" ? Rs.exports = ax() : Rs.exports = ix();
var cx = Rs.exports;
function lx() {
  return cx.useSyncExternalStore(
    dx,
    () => !0,
    () => !1
  );
}
function dx() {
  return () => {
  };
}
var Ca = "Avatar", [ux] = rx(Ca), [fx, wf] = ux(Ca), bf = m.forwardRef(
  (e, t) => {
    const { __scopeAvatar: n, ...r } = e, [s, a] = m.useState("idle");
    return /* @__PURE__ */ o(
      fx,
      {
        scope: n,
        imageLoadingStatus: s,
        onImageLoadingStatusChange: a,
        children: /* @__PURE__ */ o(ba.span, { ...r, ref: t })
      }
    );
  }
);
bf.displayName = Ca;
var Cf = "AvatarImage", Sf = m.forwardRef(
  (e, t) => {
    const { __scopeAvatar: n, src: r, onLoadingStatusChange: s = () => {
    }, ...a } = e, i = wf(Cf, n), c = px(r, a), d = lt((l) => {
      s(l), i.onImageLoadingStatusChange(l);
    });
    return Ie(() => {
      c !== "idle" && d(c);
    }, [c, d]), c === "loaded" ? /* @__PURE__ */ o(ba.img, { ...a, ref: t, src: r }) : null;
  }
);
Sf.displayName = Cf;
var xf = "AvatarFallback", Nf = m.forwardRef(
  (e, t) => {
    const { __scopeAvatar: n, delayMs: r, ...s } = e, a = wf(xf, n), [i, c] = m.useState(r === void 0);
    return m.useEffect(() => {
      if (r !== void 0) {
        const d = window.setTimeout(() => c(!0), r);
        return () => window.clearTimeout(d);
      }
    }, [r]), i && a.imageLoadingStatus !== "loaded" ? /* @__PURE__ */ o(ba.span, { ...s, ref: t }) : null;
  }
);
Nf.displayName = xf;
function tc(e, t) {
  return e ? t ? (e.src !== t && (e.src = t), e.complete && e.naturalWidth > 0 ? "loaded" : "loading") : "error" : "idle";
}
function px(e, { referrerPolicy: t, crossOrigin: n }) {
  const r = lx(), s = m.useRef(null), a = r ? (s.current || (s.current = new window.Image()), s.current) : null, [i, c] = m.useState(
    () => tc(a, e)
  );
  return Ie(() => {
    c(tc(a, e));
  }, [a, e]), Ie(() => {
    const d = (f) => () => {
      c(f);
    };
    if (!a) return;
    const l = d("loaded"), u = d("error");
    return a.addEventListener("load", l), a.addEventListener("error", u), t && (a.referrerPolicy = t), typeof n == "string" && (a.crossOrigin = n), () => {
      a.removeEventListener("load", l), a.removeEventListener("error", u);
    };
  }, [a, n, t]), i;
}
var Ef = bf, Tf = Sf, _f = Nf;
const Rf = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(
  Ef,
  {
    ref: n,
    className: te("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", e),
    ...t
  }
));
Rf.displayName = Ef.displayName;
const Af = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(Tf, { ref: n, className: te("aspect-square h-full w-full", e), ...t }));
Af.displayName = Tf.displayName;
const Pf = m.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ o(
  _f,
  {
    ref: n,
    className: te("flex h-full w-full items-center justify-center rounded-full bg-muted", e),
    ...t
  }
));
Pf.displayName = _f.displayName;
function SN({ contentUuid: e }) {
  const [t, n] = W(""), [r, s] = W(""), [a, i] = W(""), [c, d] = W(null), [l, u] = W(""), { data: f, isLoading: v } = bg(e), w = Cg(), g = Sg(), p = f?.data || [], y = async () => {
    if (!t.trim() || !r.trim() || !a.trim()) {
      L.error("Please fill in all fields");
      return;
    }
    try {
      await w.mutateAsync({
        content_uuid: e,
        author_name: r,
        author_email: a,
        body: t
      }), n(""), s(""), i(""), L.success("Comment submitted for moderation");
    } catch (S) {
      console.error("Failed to submit comment:", S);
    }
  }, C = async (S) => {
    if (!l.trim() || !r.trim() || !a.trim()) {
      L.error("Please fill in all fields");
      return;
    }
    try {
      await g.mutateAsync({
        parentUuid: S,
        input: {
          content_uuid: e,
          parent_uuid: S,
          author_name: r,
          author_email: a,
          body: l
        }
      }), u(""), d(null), L.success("Reply submitted for moderation");
    } catch (b) {
      console.error("Failed to submit reply:", b);
    }
  };
  return v ? /* @__PURE__ */ h(Me, { children: [
    /* @__PURE__ */ o(Le, { children: /* @__PURE__ */ o(_e, { className: "h-6 w-32" }) }),
    /* @__PURE__ */ o(ke, { className: "space-y-4", children: [...Array(3)].map((S, b) => /* @__PURE__ */ o(_e, { className: "h-24 w-full" }, b)) })
  ] }) : /* @__PURE__ */ h(Me, { children: [
    /* @__PURE__ */ o(Le, { children: /* @__PURE__ */ h(Ke, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ o(za, { className: "h-5 w-5" }),
      "Comments (",
      p.length,
      ")"
    ] }) }),
    /* @__PURE__ */ h(ke, { className: "space-y-6", children: [
      /* @__PURE__ */ h("div", { className: "space-y-4", children: [
        /* @__PURE__ */ o("h3", { className: "font-semibold", children: "Leave a Comment" }),
        /* @__PURE__ */ h("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ o(
            De,
            {
              placeholder: "Your name",
              value: r,
              onChange: (S) => s(S.target.value)
            }
          ),
          /* @__PURE__ */ o(
            De,
            {
              type: "email",
              placeholder: "Your email",
              value: a,
              onChange: (S) => i(S.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ o(
          kn,
          {
            placeholder: "Write your comment...",
            value: t,
            onChange: (S) => n(S.target.value),
            rows: 4
          }
        ),
        /* @__PURE__ */ h(
          oe,
          {
            onClick: y,
            disabled: w.isPending,
            children: [
              /* @__PURE__ */ o(uc, { className: "h-4 w-4 mr-2" }),
              w.isPending ? "Submitting..." : "Submit Comment"
            ]
          }
        )
      ] }),
      p.length === 0 ? /* @__PURE__ */ h("div", { className: "text-center py-8 text-muted-foreground", children: [
        /* @__PURE__ */ o(za, { className: "h-12 w-12 mx-auto mb-3 opacity-30" }),
        /* @__PURE__ */ o("p", { children: "No comments yet. Be the first to comment!" })
      ] }) : /* @__PURE__ */ h("div", { className: "space-y-4", children: [
        /* @__PURE__ */ o("h3", { className: "font-semibold", children: "Comments" }),
        p.map((S) => /* @__PURE__ */ o(
          Mf,
          {
            comment: S,
            onReply: (b) => d(b),
            replyingTo: c,
            replyText: l,
            setReplyText: u,
            handleReply: C,
            authorName: r,
            authorEmail: a,
            setAuthorName: s,
            setAuthorEmail: i
          },
          S.uuid
        ))
      ] })
    ] })
  ] });
}
function Mf({
  comment: e,
  onReply: t,
  replyingTo: n,
  replyText: r,
  setReplyText: s,
  handleReply: a,
  authorName: i,
  authorEmail: c,
  setAuthorName: d,
  setAuthorEmail: l
}) {
  const u = n === e.uuid;
  return /* @__PURE__ */ h("div", { className: "space-y-3 pb-4 border-b last:border-0", children: [
    /* @__PURE__ */ h("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ h(Rf, { children: [
        /* @__PURE__ */ o(Af, { src: e.author_avatar || void 0 }),
        /* @__PURE__ */ o(Pf, { children: e.author_name?.charAt(0).toUpperCase() || "A" })
      ] }),
      /* @__PURE__ */ h("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ h("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ o("span", { className: "font-medium", children: e.author_name || "Anonymous" }),
          /* @__PURE__ */ o("span", { className: "text-xs text-muted-foreground", children: Xn(new Date(e.created_at), { addSuffix: !0 }) })
        ] }),
        /* @__PURE__ */ o("p", { className: "text-sm", children: e.body || e.comment_text }),
        /* @__PURE__ */ h("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ h(
            oe,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => t(e.uuid),
              children: [
                /* @__PURE__ */ o(jp, { className: "h-3 w-3 mr-1" }),
                "Reply"
              ]
            }
          ),
          /* @__PURE__ */ h(oe, { variant: "ghost", size: "sm", children: [
            /* @__PURE__ */ o(Wp, { className: "h-3 w-3 mr-1" }),
            "Like"
          ] })
        ] }),
        u && /* @__PURE__ */ h("div", { className: "space-y-3 pt-3", children: [
          /* @__PURE__ */ h("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
            /* @__PURE__ */ o(
              De,
              {
                placeholder: "Your name",
                value: i,
                onChange: (f) => d(f.target.value),
                size: 1
              }
            ),
            /* @__PURE__ */ o(
              De,
              {
                type: "email",
                placeholder: "Your email",
                value: c,
                onChange: (f) => l(f.target.value),
                size: 1
              }
            )
          ] }),
          /* @__PURE__ */ o(
            kn,
            {
              placeholder: "Write your reply...",
              value: r,
              onChange: (f) => s(f.target.value),
              rows: 3
            }
          ),
          /* @__PURE__ */ h("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ o(
              oe,
              {
                size: "sm",
                onClick: () => a(e.uuid),
                children: "Submit Reply"
              }
            ),
            /* @__PURE__ */ o(
              oe,
              {
                size: "sm",
                variant: "outline",
                onClick: () => t(null),
                children: "Cancel"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    e.replies && e.replies.length > 0 && /* @__PURE__ */ o("div", { className: "ml-12 space-y-3", children: e.replies.map((f) => /* @__PURE__ */ o(
      Mf,
      {
        comment: f,
        onReply: t,
        replyingTo: n,
        replyText: r,
        setReplyText: s,
        handleReply: a,
        authorName: i,
        authorEmail: c,
        setAuthorName: d,
        setAuthorEmail: l
      },
      f.uuid
    )) })
  ] });
}
const nc = "/cms/admin/urls", xN = {
  async build(e) {
    return D.post(`${nc}/build`, e);
  },
  async preview(e) {
    return D.post(`${nc}/preview`, e);
  }
}, mx = vn(() => Promise.resolve().then(() => Ig)), rc = vn(() => Promise.resolve().then(() => Ty)), hx = vn(() => Promise.resolve().then(() => Ry)), oc = vn(() => Promise.resolve().then(() => VS)), gx = vn(() => Promise.resolve().then(() => JS)), yx = vn(() => Promise.resolve().then(() => ex)), vx = vn(() => Promise.resolve().then(() => nx));
function It() {
  return /* @__PURE__ */ o("div", { className: "flex items-center justify-center min-h-screen", children: /* @__PURE__ */ o("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }) });
}
const NN = [
  {
    path: "content-types",
    element: /* @__PURE__ */ o(Pt, { fallback: /* @__PURE__ */ o(It, {}), children: /* @__PURE__ */ o(mx, {}) })
  },
  {
    path: "content-types/new",
    element: /* @__PURE__ */ o(Pt, { fallback: /* @__PURE__ */ o(It, {}), children: /* @__PURE__ */ o(rc, {}) })
  },
  {
    path: "content-types/:uuid/edit",
    element: /* @__PURE__ */ o(Pt, { fallback: /* @__PURE__ */ o(It, {}), children: /* @__PURE__ */ o(rc, {}) })
  },
  {
    path: "contents",
    element: /* @__PURE__ */ o(Pt, { fallback: /* @__PURE__ */ o(It, {}), children: /* @__PURE__ */ o(hx, {}) })
  },
  {
    path: "contents/create",
    element: /* @__PURE__ */ o(Pt, { fallback: /* @__PURE__ */ o(It, {}), children: /* @__PURE__ */ o(oc, {}) })
  },
  {
    path: "contents/:uuid/edit",
    element: /* @__PURE__ */ o(Pt, { fallback: /* @__PURE__ */ o(It, {}), children: /* @__PURE__ */ o(oc, {}) })
  },
  {
    path: "categories",
    element: /* @__PURE__ */ o(Pt, { fallback: /* @__PURE__ */ o(It, {}), children: /* @__PURE__ */ o(gx, {}) })
  },
  {
    path: "comments",
    element: /* @__PURE__ */ o(Pt, { fallback: /* @__PURE__ */ o(It, {}), children: /* @__PURE__ */ o(yx, {}) })
  },
  {
    path: "contents/:contentUuid/revisions",
    element: /* @__PURE__ */ o(Pt, { fallback: /* @__PURE__ */ o(It, {}), children: /* @__PURE__ */ o(vx, {}) })
  }
], EN = [], TN = [
  {
    id: "cms",
    label: "CMS",
    icon: "file-text",
    children: [
      {
        id: "cms-content-types",
        label: "Content Types",
        path: "/admin/cms/content-types",
        permission: "pages:content-types:view"
      },
      {
        id: "cms-contents",
        label: "Contents",
        path: "/admin/cms/contents",
        permission: "pages:contents:view"
      },
      {
        id: "cms-categories",
        label: "Categories",
        path: "/admin/cms/categories",
        permission: "pages:categories:view"
      },
      {
        id: "cms-comments",
        label: "Comments",
        path: "/admin/cms/comments",
        permission: "pages:comments:view"
      }
    ]
  }
], _N = {
  name: "pages-engine",
  version: "1.0.0",
  displayName: "CanvaStencil Pages Engine",
  description: "WordPress-like CMS Pages System untuk blog, news, events, dan custom content types"
};
export {
  NN as AdminRoutes,
  bN as CMS_ADMIN_ROUTES,
  CN as CMS_PUBLIC_ROUTES,
  YS as CategoryFormDialog,
  XS as CategoryManagement,
  GS as CategoryTree,
  ZS as CommentModeration,
  SN as CommentSection,
  jS as ContentEditor,
  KS as ContentForm,
  _y as ContentList,
  tx as ContentRevisionList,
  Ey as ContentTypeForm,
  kg as ContentTypeList,
  TN as MenuItems,
  _N as PLUGIN_METADATA,
  EN as PublicRoutes,
  pt as categoryService,
  Tt as commentService,
  Xe as contentService,
  Xt as contentTypeService,
  Ws as revisionService,
  Ag as tagService,
  xN as urlService,
  og as useActivateContentTypeMutation,
  xg as useApproveCommentMutation,
  fg as useArchiveContentMutation,
  mN as useBulkApproveCommentsMutation,
  hN as useBulkDeleteCommentsMutation,
  pg as useCategoriesQuery,
  lN as useCategoryQuery,
  el as useCategoryStore,
  mg as useCategoryTreeQuery,
  Mg as useCommentStore,
  wg as useCommentsForContentQuery,
  vg as useCommentsQuery,
  ig as useContentQuery,
  Zc as useContentStore,
  eg as useContentTypeQuery,
  Pg as useContentTypeStore,
  js as useContentTypesQuery,
  oN as useContentsByCategoryQuery,
  sN as useContentsByStatusQuery,
  rN as useContentsByTypeQuery,
  eN as useContentsCountQuery,
  ag as useContentsQuery,
  hg as useCreateCategoryMutation,
  cg as useCreateContentMutation,
  tg as useCreateContentTypeMutation,
  sg as useDeactivateContentTypeMutation,
  yg as useDeleteCategoryMutation,
  pN as useDeleteCommentMutation,
  dg as useDeleteContentMutation,
  rg as useDeleteContentTypeMutation,
  Eg as useMarkCommentAsSpamMutation,
  uN as useMoveCategoryMutation,
  iN as usePublicCategoriesQuery,
  dN as usePublicCategoryBySlugQuery,
  cN as usePublicCategoryTreeQuery,
  bg as usePublicCommentsQuery,
  nN as usePublicContentBySlugQuery,
  tN as usePublicContentsQuery,
  Jc as usePublishContentMutation,
  Ng as useRejectCommentMutation,
  fN as useReorderCategoryMutation,
  Sg as useReplyCommentMutation,
  _g as useRevertRevisionMutation,
  gN as useRevisionQuery,
  Tg as useRevisionsForContentQuery,
  aN as useScheduleContentMutation,
  Cg as useSubmitCommentMutation,
  yN as useTagsQuery,
  ug as useUnpublishContentMutation,
  gg as useUpdateCategoryMutation,
  lg as useUpdateContentMutation,
  ng as useUpdateContentTypeMutation
};
