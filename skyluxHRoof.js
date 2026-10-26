//Skylux Calista — refactor
// Flow: scope → getParameters() → sceneParameters → StructureSection (roof) + SideOpening (one per side).
// The configurator calls PL.init again on every change; caches that must survive live outside PL.init.

// Dev: while the live configurator doesn't send _3d_StructureSections / _3d_SideOpenings yet, use one of the
// bundled example scopes (DEV_SCOPES, bottom of the file). null to switch off.
const DEV_SCOPE = 'freestanding'; // null | 'freestanding' | 'wallRear' | 'wallRearRight'

// The configurator's side steps and fields, and the camera view each one turns to (as legacy; check these ids and
// labels when the configurator changes)
const STEP_VIEWS = {
    '0b6319e5cf034ee3b60df7fc13b27412': 'left', '49d117e0f820471da9864895f81fca81': 'right',
    'eff99be6146d44e4ac4efba7dc0c0646': 'front', 'bb7c1e530ea2474692f4dd5affec1ff6': 'rear',
};
const FOCUS_VIEWS = { left: 'left', opti_2: 'right', opti_1: 'front', opti_3: 'rear', roof: 'top' };

// Convert from mm to m
function mm(value) {
    return value / 1000;
}

function createPL(v3d = window.v3d) {
    var LIST_NONE = '<none>';

    var _pGlob = {};

    _pGlob.objCache = new Map();
    _pGlob.fadeAnnotations = true;
    _pGlob.objClickInfo = [];
    _pGlob.pickedObject = '';
    _pGlob.objHoverInfo = [];
    _pGlob.hoveredObject = '';
    _pGlob.objMovementInfos = {};
    _pGlob.objDragOverCallbacks = [];
    _pGlob.objDragOverInfoByBlock = {};
    _pGlob.objDragOverInfoGlobal = [];
    _pGlob.dragMoveOrigins = {};
    _pGlob.dragScaleOrigins = {};
    _pGlob.mediaElements = {};
    _pGlob.loadedFiles = {};
    _pGlob.loadedFile = '';
    _pGlob.promiseValue = '';
    _pGlob.animMixerCallbacks = [];
    _pGlob.arHitPoint = new v3d.Vector3(0, 0, 0);
    _pGlob.states = [];
    _pGlob.percentage = 0;
    _pGlob.animateParamUpdate = null;
    _pGlob.openedFile = '';
    _pGlob.xrSessionAcquired = false;
    _pGlob.xrSessionCallbacks = [];
    _pGlob.screenCoords = new v3d.Vector2();
    _pGlob.gamepadIndex = 0;

    _pGlob.AXIS_X = new v3d.Vector3(1, 0, 0);
    _pGlob.AXIS_Y = new v3d.Vector3(0, 1, 0);
    _pGlob.AXIS_Z = new v3d.Vector3(0, 0, 1);
    _pGlob.MIN_DRAG_SCALE = 10e-4;
    _pGlob.SET_OBJ_ROT_EPS = 1e-8;

    _pGlob.vec2Tmp = new v3d.Vector2();
    _pGlob.vec2Tmp2 = new v3d.Vector2();
    _pGlob.vec3Tmp = new v3d.Vector3();
    _pGlob.vec3Tmp2 = new v3d.Vector3();
    _pGlob.vec3Tmp3 = new v3d.Vector3();
    _pGlob.vec3Tmp4 = new v3d.Vector3();
    _pGlob.eulerTmp = new v3d.Euler();
    _pGlob.eulerTmp2 = new v3d.Euler();
    _pGlob.quatTmp = new v3d.Quaternion();
    _pGlob.quatTmp2 = new v3d.Quaternion();
    _pGlob.colorTmp = new v3d.Color();
    _pGlob.mat4Tmp = new v3d.Matrix4();
    _pGlob.planeTmp = new v3d.Plane();
    _pGlob.raycasterTmp = new v3d.Raycaster();
    _pGlob.intervals = {};
    _pGlob.eventListeners = [];
    _pGlob.materialsCache = new Map();

    // three-bvh-csg, as the Verge3D 4.13 makeObjectCSG puzzle ships it (used to cut the last wood board)
    var CSG = function (t, e) { "use strict"; const r = 1e-6, n = Math.pow(10, -Math.log10(r)), i = 5e-7 * n; function s(t) { return ~~(t * n + i) } function o(t) { return `${s(t.x)},${s(t.y)},${s(t.z)}` } function a(t) { return `${s(t.x)},${s(t.y)},${s(t.z)},${s(t.w)}` } function l(t, e, r) { r.direction.subVectors(e, t).normalize(); const n = t.dot(r.direction); return r.origin.copy(t).addScaledVector(r.direction, -n), r } function c() { return "undefined" != typeof SharedArrayBuffer } function u(t) { if (t.buffer instanceof SharedArrayBuffer) return t; const e = t.constructor, r = t.buffer, n = new SharedArrayBuffer(r.byteLength), i = new Uint8Array(r); return new Uint8Array(n).set(i, 0), new e(n) } function d(t, r) { if (!t.index) { const n = t.attributes.position.count, i = function (t, e = ArrayBuffer) { return t > 65535 ? new Uint32Array(new e(4 * t)) : new Uint16Array(new e(2 * t)) }(n, r.useSharedArrayBuffer ? SharedArrayBuffer : ArrayBuffer); t.setIndex(new e.BufferAttribute(i, 1)); for (let t = 0; t < n; t++)i[t] = t } } function h(t) { return function (t) { return t.index ? t.index.count : t.attributes.position.count }(t) / 3 } const f = 1e-8, g = new e.Vector3; function p(t) { return t % 3 } function m(t, e) { return t.start - e.start } function y(t, e) { return g.subVectors(e, t.origin).dot(t.direction) } const b = 1e-5, x = 1e-4; class w { constructor() { this._rays = [] } addRay(t) { this._rays.push(t) } findClosestRay(t) { const e = this._rays, r = t.clone(); r.direction.multiplyScalar(-1); let n = 1 / 0, i = null; for (let a = 0, l = e.length; a < l; a++) { const l = e[a]; if (s(l, t) && s(l, r)) continue; const c = o(l, t), u = o(l, r), d = Math.min(c, u); d < n && (n = d, i = l) } return i; function s(t, e) { const r = t.origin.distanceTo(e.origin) > b; return t.direction.angleTo(e.direction) > x || r } function o(t, e) { const r = t.origin.distanceTo(e.origin), n = t.direction.angleTo(e.direction); return r / b + n / x } } } const A = new e.Vector3, T = new e.Vector3, S = new e.Ray; function M(t, e, r) { const n = t.attributes, i = t.index, s = n.position, o = new Map, a = new Map, c = Array.from(e), u = new w; for (let t = 0, e = c.length; t < e; t++) { const e = c[t], r = ~~(e / 3), n = p(e); let o, d = 3 * r + n, h = 3 * r + (n + 1) % 3; i && (d = i.getX(d), h = i.getX(h)), A.fromBufferAttribute(s, d), T.fromBufferAttribute(s, h), l(A, T, S); let f = u.findClosestRay(S); null === f && (f = S.clone(), u.addRay(f)), a.has(f) || a.set(f, { forward: [], reverse: [], ray: f }), o = a.get(f); let g = y(f, A), m = y(f, T); g > m && ([g, m] = [m, g]), S.direction.dot(f.direction) < 0 ? o.reverse.push({ start: g, end: m, index: e }) : o.forward.push({ start: g, end: m, index: e }) } return a.forEach((({ forward: t, reverse: e }, n) => { !function (t, e, r, n = f) { t.sort(m), e.sort(m); for (let n = 0; n < t.length; n++) { const i = t[n]; for (let a = 0; a < e.length; a++) { const l = e[a]; if (l.start > i.end); else { if (i.end < l.start || l.end < i.start) continue; if (i.start <= l.start && i.end >= l.end) s(l.end, i.end) || t.splice(n + 1, 0, { start: l.end, end: i.end, index: i.index }), i.end = l.start, l.start = 0, l.end = 0; else if (i.start >= l.start && i.end <= l.end) s(i.end, l.end) || e.splice(a + 1, 0, { start: i.end, end: l.end, index: l.index }), l.end = i.start, i.start = 0, i.end = 0; else if (i.start <= l.start && i.end <= l.end) { const t = i.end; i.end = l.start, l.start = t } else { if (!(i.start >= l.start && i.end >= l.end)) throw new Error; { const t = l.end; l.end = i.start, i.start = t } } } if (r.has(i.index) || r.set(i.index, []), r.has(l.index) || r.set(l.index, []), r.get(i.index).push(l.index), r.get(l.index).push(i.index), o(l) && (e.splice(a, 1), a--), o(i)) { t.splice(n, 1), n--; break } } } function i(t) { for (let e = 0; e < t.length; e++)o(t[e]) && (t.splice(e, 1), e--) } function s(t, e) { return Math.abs(e - t) < n } function o(t) { return Math.abs(t.end - t.start) < n } i(t), i(e) }(t, e, o, r), 0 === t.length && 0 === e.length && a.delete(n) })), { disjointConnectivityMap: o, fragmentMap: a } } const B = new e.Vector2, I = new e.Vector3, E = new e.Vector4, z = ["", "", ""]; class V { constructor(t = null) { this.data = null, this.disjointConnections = null, this.unmatchedDisjointEdges = null, this.unmatchedEdges = -1, this.matchedEdges = -1, this.useDrawRange = !0, this.useAllAttributes = !1, this.matchDisjointEdges = !1, this.degenerateEpsilon = 1e-8, t && this.updateFrom(t) } getSiblingTriangleIndex(t, e) { const r = this.data[3 * t + e]; return -1 === r ? -1 : ~~(r / 3) } getSiblingEdgeIndex(t, e) { const r = this.data[3 * t + e]; return -1 === r ? -1 : r % 3 } getDisjointSiblingTriangleIndices(t, e) { const r = 3 * t + e, n = this.disjointConnections.get(r); return n ? n.map((t => ~~(t / 3))) : [] } getDisjointSiblingEdgeIndices(t, e) { const r = 3 * t + e, n = this.disjointConnections.get(r); return n ? n.map((t => t % 3)) : [] } isFullyConnected() { return 0 === this.unmatchedEdges } updateFrom(t) { const { useAllAttributes: e, useDrawRange: r, matchDisjointEdges: n, degenerateEpsilon: i } = this, l = e ? function (t) { let e = ""; for (let n = 0, i = d.length; n < i; n++) { const i = u[d[n]]; let l; switch (i.itemSize) { case 1: l = s(i.getX(t)); break; case 2: l = `${s((r = B.fromBufferAttribute(i, t)).x)},${s(r.y)}`; break; case 3: l = o(I.fromBufferAttribute(i, t)); break; case 4: l = a(E.fromBufferAttribute(i, t)) }"" !== e && (e += "|"), e += l } var r; return e } : function (t) { return I.fromBufferAttribute(g, t), o(I) }, c = new Map, { attributes: u } = t, d = e ? Object.keys(u) : null, f = t.index, g = u.position; let p = h(t); const m = p; let y = 0; r && (y = t.drawRange.start, t.drawRange.count !== 1 / 0 && (p = ~~(t.drawRange.count / 3))); let b = this.data; (!b || b.length < 3 * m) && (b = new Int32Array(3 * m)), b.fill(-1); let x = 0, w = new Set; for (let t = y, e = 3 * p + y; t < e; t += 3) { const e = t; for (let t = 0; t < 3; t++) { let r = e + t; f && (r = f.getX(r)), z[t] = l(r) } for (let t = 0; t < 3; t++) { const r = (t + 1) % 3, n = z[t], i = z[r], s = `${i}_${n}`; if (c.has(s)) { const r = e + t, n = c.get(s); b[r] = n, b[n] = r, c.delete(s), x += 2, w.delete(n) } else { const r = `${n}_${i}`, s = e + t; c.set(r, s), w.add(s) } } } if (n) { const { fragmentMap: e, disjointConnectivityMap: r } = M(t, w, i); w.clear(), e.forEach((({ forward: t, reverse: e }) => { t.forEach((({ index: t }) => w.add(t))), e.forEach((({ index: t }) => w.add(t))) })), this.unmatchedDisjointEdges = e, this.disjointConnections = r, x = 3 * p - w.size } this.matchedEdges = x, this.unmatchedEdges = w.size, this.data = b } } class C extends e.Mesh { constructor(...t) { super(...t), this.isBrush = !0, this._previousMatrix = new e.Matrix4, this._previousMatrix.elements.fill(0) } markUpdated() { this._previousMatrix.copy(this.matrix) } isDirty() { const { matrix: t, _previousMatrix: e } = this, r = t.elements, n = e.elements; for (let t = 0; t < 16; t++)if (r[t] !== n[t]) return !0; return !1 } prepareGeometry() { const t = this.geometry, r = t.attributes, n = c(); if (n) for (const t in r) { const e = r[t]; if (e.isInterleavedBufferAttribute) throw new Error("Brush: InterleavedBufferAttributes are not supported."); e.array = u(e.array) } if (t.boundsTree || (d(t, { useSharedArrayBuffer: n }), t.boundsTree = new e.MeshBVH(t, { maxLeafTris: 3, indirect: !0, useSharedArrayBuffer: n })), t.halfEdges || (t.halfEdges = new V(t)), !t.groupIndices) { const e = h(t), r = new Uint16Array(e), n = t.groups; for (let t = 0, e = n.length; t < e; t++) { const { start: e, count: i } = n[t]; for (let n = e / 3, s = (e + i) / 3; n < s; n++)r[n] = t } t.groupIndices = r } } disposeCacheData() { const { geometry: t } = this; t.halfEdges = null, t.boundsTree = null, t.groupIndices = null } } const v = 1e-14, _ = new e.Vector3, G = new e.Vector3, R = new e.Vector3; function O(t, e = v) { _.subVectors(t.b, t.a), G.subVectors(t.c, t.a), R.subVectors(t.b, t.c); const r = _.angleTo(G), n = _.angleTo(R), i = Math.PI - r - n; return Math.abs(r) < e || Math.abs(n) < e || Math.abs(i) < e || t.a.distanceToSquared(t.b) < e || t.a.distanceToSquared(t.c) < e || t.b.distanceToSquared(t.c) < e } const N = 1e-10, D = 1e-10, X = new e.Line3, $ = new e.Line3, k = new e.Vector3, U = new e.Vector3, W = new e.Vector3, j = new e.Plane, L = new e.ExtendedTriangle; class P { constructor() { this._pool = [], this._index = 0 } getTriangle() { return this._index >= this._pool.length && this._pool.push(new e.Triangle), this._pool[this._index++] } clear() { this._index = 0 } reset() { this._pool.length = 0, this._index = 0 } } class F { constructor() { this.trianglePool = new P, this.triangles = [], this.normal = new e.Vector3, this.coplanarTriangleUsed = !1 } initialize(t) { this.reset(); const { triangles: e, trianglePool: r, normal: n } = this; if (Array.isArray(t)) for (let i = 0, s = t.length; i < s; i++) { const s = t[i]; if (0 === i) s.getNormal(n); else if (Math.abs(1 - s.getNormal(k).dot(n)) > N) throw new Error("Triangle Splitter: Cannot initialize with triangles that have different normals."); const o = r.getTriangle(); o.copy(s), e.push(o) } else { t.getNormal(n); const i = r.getTriangle(); i.copy(t), e.push(i) } } splitByTriangle(t) { const { normal: e, triangles: r } = this; if (t.getNormal(U).normalize(), Math.abs(1 - Math.abs(U.dot(e))) < 1e-10) { this.coplanarTriangleUsed = !0; for (let t = 0, e = r.length; t < e; t++) { r[t].coplanarCount = 0 } const e = [t.a, t.b, t.c]; for (let r = 0; r < 3; r++) { const n = (r + 1) % 3, i = e[r], s = e[n]; k.subVectors(s, i).normalize(), W.crossVectors(U, k), j.setFromNormalAndCoplanarPoint(W, i), this.splitByPlane(j, t) } } else t.getPlane(j), this.splitByPlane(j, t) } splitByPlane(t, e) { const { triangles: r, trianglePool: n } = this; L.copy(e), L.needsUpdate = !0; for (let e = 0, i = r.length; e < i; e++) { const s = r[e]; if (!L.intersectsTriangle(s, X, !0)) continue; const { a: o, b: a, c: l } = s; let c = 0, u = -1, d = !1, h = [], f = []; const g = [o, a, l]; for (let e = 0; e < 3; e++) { const r = (e + 1) % 3; X.start.copy(g[e]), X.end.copy(g[r]); const n = t.distanceToPoint(X.start), i = t.distanceToPoint(X.end); if (Math.abs(n) < D && Math.abs(i) < D) { d = !0; break } if (n > 0 ? h.push(e) : f.push(e), Math.abs(n) < D) continue; let s = !!t.intersectLine(X, k); !s && Math.abs(i) < D && (k.copy(X.end), s = !0), !s || k.distanceTo(X.start) < N || (k.distanceTo(X.end) < N && (u = e), 0 === c ? $.start.copy(k) : $.end.copy(k), c++) } if (!d && 2 === c && $.distance() > D) if (-1 !== u) { u = (u + 1) % 3; let t = 0; t === u && (t = (t + 1) % 3); let o = t + 1; o === u && (o = (o + 1) % 3); const a = n.getTriangle(); a.a.copy(g[o]), a.b.copy($.end), a.c.copy($.start), O(a) || r.push(a), s.a.copy(g[t]), s.b.copy($.start), s.c.copy($.end), O(s) && (r.splice(e, 1), e--, i--) } else { const t = h.length >= 2 ? f[0] : h[0]; if (0 === t) { let t = $.start; $.start = $.end, $.end = t } const o = (t + 1) % 3, a = (t + 2) % 3, l = n.getTriangle(), c = n.getTriangle(); g[o].distanceToSquared($.start) < g[a].distanceToSquared($.end) ? (l.a.copy(g[o]), l.b.copy($.start), l.c.copy($.end), c.a.copy(g[o]), c.b.copy(g[a]), c.c.copy($.start)) : (l.a.copy(g[a]), l.b.copy($.start), l.c.copy($.end), c.a.copy(g[o]), c.b.copy(g[a]), c.c.copy($.end)), s.a.copy(g[t]), s.b.copy($.end), s.c.copy($.start), O(l) || r.push(l), O(c) || r.push(c), O(s) && (r.splice(e, 1), e--, i--) } else 3 === c && console.warn("TriangleClipper: Coplanar clip not handled") } } reset() { this.triangles.length = 0, this.trianglePool.clear(), this.coplanarTriangleUsed = !1 } } class H { constructor(t, e = 500) { this.expansionFactor = 1.5, this.type = t, this.length = 0, this.array = null, this.setSize(e) } setType(t) { if (0 !== this.length) throw new Error("TypeBackedArray: Cannot change the type while there is used data in the buffer."); const e = this.array.buffer; this.array = new t(e), this.type = t } setSize(t) { if (this.array && t === this.array.length) return; const e = this.type, r = new e(new (c() ? SharedArrayBuffer : ArrayBuffer)(4 + (n = ~~(n = t * e.BYTES_PER_ELEMENT)) - n % 4)); var n; this.array && r.set(this.array, 0), this.array = r } expand() { const { array: t, expansionFactor: e } = this; this.setSize(t.length * e) } push(...t) { let { array: e, length: r } = this; r + t.length > e.length && (this.expand(), e = this.array); for (let n = 0, i = t.length; n < i; n++)e[r + n] = t[n]; this.length += t.length } clear() { this.length = 0 } } class q { constructor() { this.groupAttributes = [{}], this.groupCount = 0 } getType(t) { return this.groupAttributes[0][t].type } getItemSize(t) { return this.groupAttributes[0][t].itemSize } getNormalized(t) { return this.groupAttributes[0][t].normalized } getCount(t) { if (this.groupCount <= t) return 0; const e = this.getGroupAttrArray("position", t); return e.length / e.itemSize } getTotalLength(t) { const { groupCount: e, groupAttributes: r } = this; let n = 0; for (let i = 0; i < e; i++) { n += r[i][t].length } return n } getGroupAttrSet(t = 0) { const { groupAttributes: e } = this; if (e[t]) return this.groupCount = Math.max(this.groupCount, t + 1), e[t]; const r = e[0]; for (this.groupCount = Math.max(this.groupCount, t + 1); t >= e.length;) { const t = {}; e.push(t); for (const e in r) { const n = r[e], i = new H(n.type); i.itemSize = n.itemSize, i.normalized = n.normalized, t[e] = i } } return e[t] } getGroupAttrArray(t, e = 0) { const { groupAttributes: r } = this; if (!r[0][t]) throw new Error(`TypedAttributeData: Attribute with "${t}" has not been initialized`); return this.getGroupAttrSet(e)[t] } initializeArray(t, e, r, n) { const { groupAttributes: i } = this, s = i[0][t]; if (s) { if (s.type !== e) for (let s = 0, o = i.length; s < o; s++) { const o = i[s][t]; o.setType(e), o.itemSize = r, o.normalized = n } } else for (let s = 0, o = i.length; s < o; s++) { const o = new H(e); o.itemSize = r, o.normalized = n, i[s][t] = o } } clear() { this.groupCount = 0; const { groupAttributes: t } = this; t.forEach((t => { for (const e in t) t[e].clear() })) } delete(t) { this.groupAttributes.forEach((e => { delete e[t] })) } reset() { this.groupAttributes = [], this.groupCount = 0 } } class Y { constructor() { this.intersectionSet = {}, this.ids = [] } add(t, e) { const { intersectionSet: r, ids: n } = this; r[t] || (r[t] = [], n.push(t)), r[t].push(e) } } const Z = 0, J = 1, K = 2, Q = 3, tt = 4, et = 5, rt = 6, nt = new e.Ray, it = new e.Matrix4, st = new e.Triangle, ot = new e.Vector3, at = new e.Vector4, lt = new e.Vector4, ct = new e.Vector4, ut = new e.Vector4, dt = new e.Vector4, ht = new e.Vector4, ft = new e.Line3, gt = new e.Vector3, pt = 1e-8, mt = 1e-15, yt = -1, bt = 1, xt = -2, wt = 2, At = 0, Tt = 1, St = 2, Mt = 1e-14; let Bt = null; function It(t) { Bt = t } function Et(t, r) { t.getMidpoint(nt.origin), t.getNormal(nt.direction); const n = r.raycastFirst(nt, e.DoubleSide); return Boolean(n && nt.direction.dot(n.face.normal) > 0) ? yt : bt } function zt(t, r) { function n() { return Math.random() - .5 } t.getNormal(gt), nt.direction.copy(gt), t.getMidpoint(nt.origin); let i = 0, s = 1 / 0; for (let t = 0; t < 3; t++) { nt.direction.x += n() * pt, nt.direction.y += n() * pt, nt.direction.z += n() * pt, nt.direction.multiplyScalar(-1); const o = r.raycastFirst(nt, e.DoubleSide); if (Boolean(o && nt.direction.dot(o.face.normal) > 0) && i++, null !== o && (s = Math.min(s, o.distance)), s <= mt) return o.face.normal.dot(gt) > 0 ? wt : xt; if (i / 3 > .5 || (t - i + 1) / 3 > .5) break } return i / 3 > .5 ? yt : bt } function Vt(t, e, r, n, i, s, o = !1) { const a = r.attributes, l = r.index, c = 3 * t, u = l.getX(c + 0), d = l.getX(c + 1), h = l.getX(c + 2); for (const t in s) { const r = a[t], l = s[t]; if (!(t in a)) throw new Error(`CSG Operations: Attribute ${t} not available on geometry.`); const c = r.itemSize; "position" === t ? (st.a.fromBufferAttribute(r, u).applyMatrix4(n), st.b.fromBufferAttribute(r, d).applyMatrix4(n), st.c.fromBufferAttribute(r, h).applyMatrix4(n), _t(st.a, st.b, st.c, e, 3, l, o)) : "normal" === t ? (st.a.fromBufferAttribute(r, u).applyNormalMatrix(i), st.b.fromBufferAttribute(r, d).applyNormalMatrix(i), st.c.fromBufferAttribute(r, h).applyNormalMatrix(i), o && (st.a.multiplyScalar(-1), st.b.multiplyScalar(-1), st.c.multiplyScalar(-1)), _t(st.a, st.b, st.c, e, 3, l, o, !0)) : (at.fromBufferAttribute(r, u), lt.fromBufferAttribute(r, d), ct.fromBufferAttribute(r, h), _t(at, lt, ct, e, c, l, o)) } } function Ct(t, e, r, n, i, s, o, a = !1) { Gt(t, n, i, s, o, a), Gt(a ? r : e, n, i, s, o, a), Gt(a ? e : r, n, i, s, o, a) } function vt(t, e, r = !1) { switch (t) { case Z: if (e === bt || e === wt && !r) return Tt; break; case J: if (r) { if (e === yt) return At } else if (e === bt || e === xt) return Tt; break; case K: if (r) { if (e === bt || e === xt) return Tt } else if (e === yt) return At; break; case tt: if (e === yt) return At; if (e === bt) return Tt; break; case Q: if (e === yt || e === wt && !r) return Tt; break; case et: if (!r && (e === bt || e === xt)) return Tt; break; case rt: if (!r && (e === yt || e === wt)) return Tt; break; default: throw new Error(`Unrecognized CSG operation enum "${t}".`) }return St } function _t(t, e, r, n, i, s, o = !1, a = !1) { const l = t => { s.push(t.x), i > 1 && s.push(t.y), i > 2 && s.push(t.z), i > 3 && s.push(t.w) }; ut.set(0, 0, 0, 0).addScaledVector(t, n.a.x).addScaledVector(e, n.a.y).addScaledVector(r, n.a.z), dt.set(0, 0, 0, 0).addScaledVector(t, n.b.x).addScaledVector(e, n.b.y).addScaledVector(r, n.b.z), ht.set(0, 0, 0, 0).addScaledVector(t, n.c.x).addScaledVector(e, n.c.y).addScaledVector(r, n.c.z), a && (ut.normalize(), dt.normalize(), ht.normalize()), l(ut), o ? (l(ht), l(dt)) : (l(dt), l(ht)) } function Gt(t, e, r, n, i, s = !1) { for (const o in i) { const a = e[o], l = i[o]; if (!(o in e)) throw new Error(`CSG Operations: Attribute ${o} no available on geometry.`); const c = a.itemSize; "position" === o ? (ot.fromBufferAttribute(a, t).applyMatrix4(r), l.push(ot.x, ot.y, ot.z)) : "normal" === o ? (ot.fromBufferAttribute(a, t).applyNormalMatrix(n), s && ot.multiplyScalar(-1), l.push(ot.x, ot.y, ot.z)) : (l.push(a.getX(t)), c > 1 && l.push(a.getY(t)), c > 2 && l.push(a.getZ(t)), c > 3 && l.push(a.getW(t))) } } class Rt { constructor(t) { this.triangle = (new e.Triangle).copy(t), this.intersects = {} } addTriangle(t, r) { this.intersects[t] = (new e.Triangle).copy(r) } getIntersectArray() { const t = [], { intersects: e } = this; for (const r in e) t.push(e[r]); return t } } class Ot { constructor() { this.data = {} } addTriangleIntersection(t, e, r, n) { const { data: i } = this; i[t] || (i[t] = new Rt(e)), i[t].addTriangle(r, n) } getTrianglesAsArray(t = null) { const { data: e } = this, r = []; if (null !== t) t in e && r.push(e[t].triangle); else for (const t in e) r.push(e[t].triangle); return r } getTriangleIndices() { return Object.keys(this.data).map((t => parseInt(t))) } getIntersectionIndices(t) { const { data: e } = this; return e[t] ? Object.keys(e[t].intersects).map((t => parseInt(t))) : [] } getIntersectionsAsArray(t = null, e = null) { const { data: r } = this, n = new Set, i = [], s = t => { if (r[t]) if (null !== e) r[t].intersects[e] && i.push(r[t].intersects[e]); else { const e = r[t].intersects; for (const t in e) n.has(t) || (n.add(t), i.push(e[t])) } }; if (null !== t) s(t); else for (const t in r) s(t); return i } reset() { this.data = {} } } class Nt { constructor() { this.enabled = !1, this.triangleIntersectsA = new Ot, this.triangleIntersectsB = new Ot, this.intersectionEdges = [] } addIntersectingTriangles(t, e, r, n) { const { triangleIntersectsA: i, triangleIntersectsB: s } = this; i.addTriangleIntersection(t, e, r, n), s.addTriangleIntersection(r, n, t, e) } addEdge(t) { this.intersectionEdges.push(t.clone()) } reset() { this.triangleIntersectsA.reset(), this.triangleIntersectsB.reset(), this.intersectionEdges = [] } init() { this.enabled && (this.reset(), It(this)) } complete() { this.enabled && It(null) } } const Dt = new e.Matrix4, Xt = new e.Matrix3, $t = new e.Triangle, kt = new e.Triangle, Ut = new e.Triangle, Wt = new e.Triangle, jt = [], Lt = []; function Pt(t) { for (const e of t) return e } function Ft(t, e, r, n, i, s = {}) { const { useGroups: o = !0 } = s, { aIntersections: a, bIntersections: l } = function (t, e) { const r = new Y, n = new Y; return it.copy(t.matrixWorld).invert().multiply(e.matrixWorld), t.geometry.boundsTree.bvhcast(e.geometry.boundsTree, it, { intersectsTriangles(i, s, o, a) { if (!O(i) && !O(s)) { let l = i.intersectsTriangle(s, ft, !0); if (!l) { const t = i.plane, e = s.plane, r = t.normal, n = e.normal; 1 === r.dot(n) && Math.abs(t.constant - e.constant) < Mt && (l = !0) } if (l) { let l = t.geometry.boundsTree.resolveTriangleIndex(o), c = e.geometry.boundsTree.resolveTriangleIndex(a); r.add(l, c), n.add(c, l), Bt && (Bt.addEdge(ft), Bt.addIntersectingTriangles(o, i, a, s)) } } return !1 } }), { aIntersections: r, bIntersections: n } }(t, e); let c; c = o ? 0 : -1, Ht(t, e, a, r, !1, n, i, c), qt(t, e, a, r, !1, i, c); return -1 !== r.findIndex((t => t !== rt && t !== et)) && (c = o ? t.geometry.groups.length || 1 : -1, Ht(e, t, l, r, !0, n, i, c), qt(e, t, l, r, !0, i, c)), jt.length = 0, Lt.length = 0, { groups: [], materials: null } } function Ht(t, e, r, n, i, s, o, a = 0) { const l = t.matrixWorld.determinant() < 0; Dt.copy(e.matrixWorld).invert().multiply(t.matrixWorld), Xt.getNormalMatrix(t.matrixWorld).multiplyScalar(l ? -1 : 1); const c = t.geometry.groupIndices, u = t.geometry.index, d = t.geometry.attributes.position, h = e.geometry.boundsTree, f = e.geometry.index, g = e.geometry.attributes.position, p = r.ids, m = r.intersectionSet; for (let e = 0, r = p.length; e < r; e++) { const r = p[e], y = -1 === a ? 0 : c[r] + a, b = 3 * r, x = u.getX(b + 0), w = u.getX(b + 1), A = u.getX(b + 2); $t.a.fromBufferAttribute(d, x).applyMatrix4(Dt), $t.b.fromBufferAttribute(d, w).applyMatrix4(Dt), $t.c.fromBufferAttribute(d, A).applyMatrix4(Dt), s.reset(), s.initialize($t); const T = m[r]; for (let t = 0, e = T.length; t < e; t++) { const e = 3 * T[t], r = f.getX(e + 0), n = f.getX(e + 1), i = f.getX(e + 2); kt.a.fromBufferAttribute(g, r), kt.b.fromBufferAttribute(g, n), kt.c.fromBufferAttribute(g, i), s.splitByTriangle(kt) } const S = s.triangles; for (let e = 0, a = S.length; e < a; e++) { const a = S[e], c = s.coplanarTriangleUsed ? zt(a, h) : Et(a, h); jt.length = 0, Lt.length = 0; for (let t = 0, e = n.length; t < e; t++) { const e = vt(n[t], c, i); e !== St && (Lt.push(e), jt.push(o[t].getGroupAttrSet(y))) } if (0 !== jt.length) { $t.getBarycoord(a.a, Wt.a), $t.getBarycoord(a.b, Wt.b), $t.getBarycoord(a.c, Wt.c); for (let e = 0, n = jt.length; e < n; e++) { const n = jt[e], i = Lt[e] === At; Vt(r, Wt, t.geometry, t.matrixWorld, Xt, n, l !== i) } } } } return p.length } function qt(t, e, r, n, i, s, o = 0) { const a = t.matrixWorld.determinant() < 0; Dt.copy(e.matrixWorld).invert().multiply(t.matrixWorld), Xt.getNormalMatrix(t.matrixWorld).multiplyScalar(a ? -1 : 1); const l = e.geometry.boundsTree, c = t.geometry.groupIndices, u = t.geometry.index, d = t.geometry.attributes, f = d.position, g = [], p = t.geometry.halfEdges, m = new Set; for (let e = 0, n = h(t.geometry); e < n; e++)e in r.intersectionSet || m.add(e); for (; m.size > 0;) { const e = Pt(m); m.delete(e), g.push(e); const r = 3 * e, h = u.getX(r + 0), y = u.getX(r + 1), b = u.getX(r + 2); Ut.a.fromBufferAttribute(f, h).applyMatrix4(Dt), Ut.b.fromBufferAttribute(f, y).applyMatrix4(Dt), Ut.c.fromBufferAttribute(f, b).applyMatrix4(Dt); const x = Et(Ut, l); Lt.length = 0, jt.length = 0; for (let t = 0, e = n.length; t < e; t++) { const e = vt(n[t], x, i); e !== St && (Lt.push(e), jt.push(s[t])) } for (; g.length > 0;) { const e = g.pop(); for (let t = 0; t < 3; t++) { const r = p.getSiblingTriangleIndex(e, t); -1 !== r && m.has(r) && (g.push(r), m.delete(r)) } if (0 !== jt.length) { const r = 3 * e, n = u.getX(r + 0), i = u.getX(r + 1), s = u.getX(r + 2), l = -1 === o ? 0 : c[e] + o; if (Ut.a.fromBufferAttribute(f, n), Ut.b.fromBufferAttribute(f, i), Ut.c.fromBufferAttribute(f, s), !O(Ut)) for (let e = 0, r = jt.length; e < r; e++) { const r = Lt[e], o = jt[e].getGroupAttrSet(l), c = r === At; Ct(n, i, s, d, t.matrixWorld, Xt, o, c !== a) } } } } } function Yt(t, e) { let r = e; return Array.isArray(e) || (r = [], t.forEach((t => { r[t.materialIndex] = e }))), r } class Zt extends e.Group { constructor() { super(), this.isOperationGroup = !0, this._previousMatrix = new e.Matrix4 } markUpdated() { this._previousMatrix.copy(this.matrix) } isDirty() { const { matrix: t, _previousMatrix: e } = this, r = t.elements, n = e.elements; for (let t = 0; t < 16; t++)if (r[t] !== n[t]) return !0; return !1 } } function Jt(...t) { function e(t) { return `new THREE.Vector3( ${t.x}, ${t.y}, ${t.z} )` } return t.map((t => `\nnew THREE.Triangle(\n\t${e(t.a)},\n\t${e(t.b)},\n\t${e(t.c)},\n)\n\t\t`.trim())) } const Kt = new e.Triangle, Qt = new e.Vector3, te = new e.Vector3; function ee(t, e, r) { return 1 / 6 * (-(r.x * e.y * t.z) + e.x * r.y * t.z + r.x * t.y * e.z - t.x * r.y * e.z - e.x * t.y * r.z + t.x * e.y * r.z) } function re(t, e) { t.a.sub(e), t.b.sub(e), t.c.sub(e) } function ne(t, e = null) { null !== e && (t.a.applyMatrix4(e), t.b.applyMatrix4(e), t.c.applyMatrix4(e)) } return t.ADDITION = Z, t.Brush = C, t.DIFFERENCE = tt, t.Evaluator = class { constructor() { this.triangleSplitter = new F, this.attributeData = [], this.attributes = ["position", "uv", "normal"], this.useGroups = !0, this.consolidateGroups = !0, this.debug = new Nt } getGroupRanges(t) { return this.useGroups && 0 !== t.groups.length ? t.groups.map((t => ({ ...t }))) : [{ start: 0, count: 1 / 0, materialIndex: 0 }] } evaluate(t, r, n, i = new C) { let s = !0; if (Array.isArray(n) || (n = [n]), Array.isArray(i) || (i = [i], s = !1), i.length !== n.length) throw new Error("Evaluator: operations and target array passed as different sizes."); t.prepareGeometry(), r.prepareGeometry(); const { triangleSplitter: o, attributeData: a, attributes: l, useGroups: c, consolidateGroups: u, debug: d } = this; for (; a.length < i.length;)a.push(new q); i.forEach(((e, r) => { !function (t, e, r, n) { r.clear(); const i = t.attributes; for (let t = 0, e = n.length; t < e; t++) { const e = n[t], s = i[e]; r.initializeArray(e, s.array.constructor, s.itemSize, s.normalized) } for (const t in r.attributes) n.includes(t) || r.delete(t); for (const t in e.attributes) n.includes(t) || (e.deleteAttribute(t), e.dispose()) }(t.geometry, e.geometry, a[r], l) })), d.init(), Ft(t, r, n, o, a, { useGroups: c }), d.complete(); const h = this.getGroupRanges(t.geometry), f = Yt(h, t.material), g = this.getGroupRanges(r.geometry), p = Yt(g, r.material); g.forEach((t => t.materialIndex += f.length)); let m = [...h, ...g].map(((t, e) => ({ ...t, index: e }))); if (c) { const t = [...f, ...p]; u && (m = m.map((e => { const r = t[e.materialIndex]; return e.materialIndex = t.indexOf(r), e })).sort(((t, e) => t.materialIndex - e.materialIndex))); const e = []; for (let r = 0, n = t.length; r < n; r++) { let n = !1; for (let t = 0, i = m.length; t < i; t++) { const i = m[t]; i.materialIndex === r && (n = !0, i.materialIndex = e.length) } n && e.push(t[r]) } i.forEach((t => { t.material = e })) } else m = [{ start: 0, count: 1 / 0, index: 0, materialIndex: 0 }], i.forEach((t => { t.material = f[0] })); return i.forEach(((t, r) => { const n = t.geometry; !function (t, r, n) { let i = !1, s = -1; const o = t.attributes, a = r.groupAttributes[0]; for (const l in a) { const a = r.getTotalLength(l), c = r.getType(l), u = r.getItemSize(l), d = r.getNormalized(l); let h = o[l]; (!h || h.array.length < a) && (h = new e.BufferAttribute(new c(a), u, d), t.setAttribute(l, h), i = !0); let f = 0; for (let t = 0, e = Math.min(n.length, r.groupCount); t < e; t++) { const e = n[t].index, { array: i, type: s, length: o } = r.groupAttributes[e][l], a = new s(i.buffer, 0, o); h.array.set(a, f), f += a.length } h.needsUpdate = !0, s = a / h.itemSize } if (t.index) { const e = t.index.array; if (e.length < s) t.index = null, i = !0; else for (let t = 0, r = e.length; t < r; t++)e[t] = t } let l = 0; t.clearGroups(); for (let e = 0, i = Math.min(n.length, r.groupCount); e < i; e++) { const { index: i, materialIndex: s } = n[e], o = r.getCount(i); 0 !== o && (t.addGroup(l, o, s), l += o) } t.setDrawRange(0, s), t.boundsTree = null, i && t.dispose() }(n, a[r], m), u && function (t) { for (let e = 0; e < t.length - 1; e++) { const r = t[e], n = t[e + 1]; if (r.materialIndex === n.materialIndex) { const i = r.start, s = n.start + n.count; n.start = i, n.count = s - i, t.splice(e, 1), e-- } } }(n.groups) })), s ? i : i[0] } evaluateHierarchy(t, e = new C) { t.updateMatrixWorld(!0); const r = (t, e) => { const n = t.children; for (let t = 0, i = n.length; t < i; t++) { const i = n[t]; i.isOperationGroup ? r(i, e) : e(i) } }, n = t => { const e = t.children; let i = !1; for (let t = 0, r = e.length; t < r; t++) { const r = e[t]; i = n(r) || i } const s = t.isDirty(); if (s && t.markUpdated(), i && !t.isOperationGroup) { let e; return r(t, (r => { e = e ? this.evaluate(e, r, r.operation) : this.evaluate(t, r, r.operation) })), t._cachedGeometry = e.geometry, t._cachedMaterials = e.material, !0 } return i || s }; return n(t), e.geometry = t._cachedGeometry, e.material = t._cachedMaterials, e } reset() { this.triangleSplitter.reset() } }, t.HOLLOW_INTERSECTION = rt, t.HOLLOW_SUBTRACTION = et, t.HalfEdgeMap = V, t.INTERSECTION = Q, t.Operation = class extends C { constructor(...t) { super(...t), this.isOperation = !0, this.operation = Z, this._cachedGeometry = new e.BufferGeometry, this._cachedMaterials = null, this._previousOperation = null } markUpdated() { super.markUpdated(), this._previousOperation = this.operation } isDirty() { return this.operation !== this._previousOperation || super.isDirty() } insertBefore(t) { const e = this.parent, r = e.children.indexOf(this); e.children.splice(r, 0, t) } insertAfter(t) { const e = this.parent, r = e.children.indexOf(this); e.children.splice(r + 1, 0, t) } }, t.OperationGroup = Zt, t.REVERSE_SUBTRACTION = K, t.SUBTRACTION = J, t.TriangleSplitter = F, t.computeMeshVolume = function (t) { let e, r; t.isBufferGeometry ? (e = t, r = null) : (e = t.geometry, r = Math.abs(t.matrixWorld.determinant() - 1) < 1e-15 ? null : t.matrixWorld); const n = e.index, i = e.attributes.position, s = e.drawRange, o = Math.min(h(e), s.count / 3); Kt.setFromAttributeAndIndices(i, 0, 1, 2), ne(Kt, r), Kt.getNormal(Qt), Kt.getMidpoint(te).add(Qt); let a = 0; const l = s.start / 3; for (let t = l, e = l + o; t < e; t++) { let e = 3 * t + 0, s = 3 * t + 1, o = 3 * t + 2; n && (e = n.getX(e), s = n.getX(s), o = n.getX(o)), Kt.setFromAttributeAndIndices(i, e, s, o), ne(Kt, r), re(Kt, te), a += ee(Kt.a, Kt.b, Kt.c) } return Math.abs(a) }, t.generateRandomTriangleColors = function (t) { const r = t.attributes.position, n = new Float32Array(3 * r.count), i = new e.Color; for (let t = 0, r = n.length; t < r; t += 9)i.setHSL(Math.random(), e.MathUtils.lerp(.5, 1, Math.random()), e.MathUtils.lerp(.5, .75, Math.random())), n[t + 0] = i.r, n[t + 1] = i.g, n[t + 2] = i.b, n[t + 3] = i.r, n[t + 4] = i.g, n[t + 5] = i.b, n[t + 6] = i.r, n[t + 7] = i.g, n[t + 8] = i.b; t.setAttribute("color", new e.BufferAttribute(n, 3)) }, t.getTriangleDefinitions = Jt, t.logTriangleDefinitions = function (...t) { console.log(Jt(...t).join(",\n")) }, t }({}, v3d);

    var PL = v3d.PL = v3d.PL || {};

    v3d.puzzles = PL;
    PL.procedures = PL.procedures || {};

    PL.execInitPuzzles = function (options) {
        var appInstance = null;
        var app = null;

        var _initGlob = {};
        _initGlob.percentage = 0;
        _initGlob.output = {
            initOptions: {
                fadeAnnotations: true,
                useBkgTransp: true,
                preserveDrawBuf: true,
                useCompAssets: true,
                useGlb: true,
                useFullscreen: true,
                useCustomPreloader: false,
                preloaderStartCb: function () { },
                preloaderProgressCb: function () { },
                preloaderEndCb: function () { },
            }
        }
        _initGlob.container = options !== undefined && 'container' in options
            ? options.container : "";

        return _initGlob.output;
    }

    // Kept between PL.init calls (every configurator change).
    let sceneIsInitialized = false;
    let sceneParameters = {};
    const structureSectionCache = [];   // one StructureSection per _3d_StructureSections[] entry, reused
    const sideOpeningCache = [];        // one SideOpening per _3d_SideOpenings[] entry, reused
    const clickables = {};              // object name -> what a click on it does (registerClickable)
    let clickElement = null;            // the element the click listener is on
    // measurements: shown by the toolbar button or while the dimensions step is open; the focused field
    let measurementsShown = false;
    let measurementsInStep = false;
    let measurementField = '';
    let stepView = null;                // the camera view of the open configurator step (cameraPosition), null: the main view

    PL.init = function (appInstance, scope, snapshot) {
        this.procedures["handleButtons"] = handleButtons;
        this.procedures["handleEvents"] = handleEvents;
        this.procedures["handleFocus"] = handleFocus;
        this.procedures["handleValue"] = handleValue;

        // For the Node tests and the browser console (v3d.PL.debug); nothing in the configurator uses it.
        PL.debug = { getCachedClone, hideCachedClones, getObjectByName, getObjTransform, sceneParameters: () => sceneParameters, structureSectionCache, sideOpeningCache, clickables };

        

        // #region Custom functions
        function keepTextFront(objName) {
            const obj = getObjectByName(objName);
            const text = obj && obj.geometry;
            if (!text || !text.cloneWithText || !text.groups.length || text.isFrontOnly)
                return;
            const lids = text.groups.filter(group => group.materialIndex == 0);
            const front = new v3d.BufferGeometry();
            for (const name in text.attributes) {
                const attribute = text.attributes[name], size = attribute.itemSize, parts = [];
                for (const lid of lids)
                    parts.push(attribute.array.slice((lid.start + lid.count / 2) * size, (lid.start + lid.count) * size));
                const array = new attribute.array.constructor(parts.reduce((sum, part) => sum + part.length, 0));
                parts.reduce((offset, part) => (array.set(part, offset), offset + part.length), 0);
                front.setAttribute(name, new v3d.BufferAttribute(array, size));
            }
            front.isFrontOnly = true;
            front.parameters = text.parameters;
            front.cloneWithText = value => text.cloneWithText(value);   // so updateTextObj keeps working
            obj.geometry = front;
            text.dispose();
        }

        //#region Verge3D 4.13 helpers
        
        function getObjectByName(objName) {
            let objFound = null;
            const isID = v3d.MathUtils.checkUUID ? v3d.MathUtils.checkUUID(objName) : false;
            const pGlobAvailable = _pGlob !== undefined;

            if (pGlobAvailable)
                objFound = _pGlob.objCache.get(objName);

            if (objFound && (isID ? objFound.uuid === objName : objFound.name === objName))
                return objFound;

            function findValidByName(obj, objName) {
                if ((isID ? obj.uuid === objName : obj.name === objName) && isObjectWorthProcessing(obj))
                    return obj;
                for (let i = 0; i < obj.children.length; i++) {
                    const child = obj.children[i];
                    const object = findValidByName(child, objName);
                    if (object !== null)
                        return object;
                }
                return null;
            }
            if (appInstance.scene) {
                objFound = findValidByName(appInstance.scene, objName);
                if (objFound && pGlobAvailable)
                    _pGlob.objCache.set(objName, objFound);
            }
            return objFound;
        }

        function isObjectWorthProcessing(obj) {
            return obj.name !== '' &&
                !(obj.isMesh && obj.isMaterialGeneratedMesh) &&
                !obj.isAuxClippingMesh;
        }

        function getObjectNamesByGroupName(groupName) {
            const objNameList = [];
            appInstance.scene.traverse(obj => {
                if (isObjectWorthProcessing(obj)) {
                    const objGroupNames = obj.groupNames;
                    if (!objGroupNames)
                        return;
                    for (let i = 0; i < objGroupNames.length; i++) {
                        const objGroupName = objGroupNames[i];
                        if (objGroupName === groupName)
                            objNameList.push(obj.name);
                    }
                }
            });
            return objNameList;
        }

        function getAllObjectNames() {
            const objNameList = [];
            appInstance.scene.traverse(obj => {
                if (isObjectWorthProcessing(obj))
                    objNameList.push(obj.name);
            });
            return objNameList;
        }

        function retrieveObjectNamesAccum(currObjNames, namesAccum) {
            if (typeof currObjNames === 'string') {
                namesAccum.push(currObjNames);
            } else if (Array.isArray(currObjNames) && currObjNames[0] === 'GROUP') {
                const newObjNames = getObjectNamesByGroupName(currObjNames[1]);
                for (let i = 0; i < newObjNames.length; i++) {
                    namesAccum.push(newObjNames[i]);
                }
            } else if (Array.isArray(currObjNames) && currObjNames[0] === 'ALL_OBJECTS') {
                const newObjNames = getAllObjectNames();
                for (let i = 0; i < newObjNames.length; i++)
                    namesAccum.push(newObjNames[i]);
            } else if (Array.isArray(currObjNames)) {
                for (let i = 0; i < currObjNames.length; i++)
                    retrieveObjectNamesAccum(currObjNames[i], namesAccum);
            }
        }

        function retrieveObjectNames(objNames) {
            const accum = [];
            retrieveObjectNamesAccum(objNames, accum);
            return accum.filter(name => name !== '');
        }



        function changeVis(objSelector, bool) {
            var objNames = retrieveObjectNames(objSelector);

            for (var i = 0; i < objNames.length; i++) {
                var objName = objNames[i]
                if (!objName)
                    continue;
                var obj = getObjectByName(objName);
                if (!obj)
                    continue;
                obj.visible = bool;
                obj.resolveMultiMaterial().forEach(function (objR) {
                    objR.visible = bool;
                });
            }
        }

        function registerSetTimeout(timeout, callback) {
            window.setTimeout(callback, 1000 * timeout);
        }

        function getJSFunction(funcName) {
            var jsFunc = appInstance.ExternalInterface[funcName];
            if (typeof jsFunc == "function")
                return jsFunc;
            else
                return function () { };
        }

        function getSceneCoordSystem() {
            const scene = appInstance.scene;
            if (scene && 'coordSystem' in scene.userData) {
                return scene.userData.coordSystem;
            }
            return 'Y_UP_RIGHT';
        }

        // warning (optional, as in the legacy file): log when the clone number goes over it.
        function generateUniqueName(name, isUniqueCb, warning) {
            let uniqueName = name;

            if (isUniqueCb !== undefined) {
                while (!isUniqueCb(uniqueName)) {
                    const r = uniqueName.match(/^(.*?)(\d+)$/);
                    if (!r) {
                        uniqueName += '2';
                    } else {
                        uniqueName = r[1] + (Number.parseInt(r[2], 10) + 1);
                    }
                }
            }

            const number = uniqueName.match(/(\d+)$/);
            if (warning !== undefined && number && Number(number[1]) > warning)
                console.log("Object clone count over warning for " + name + " value:" + warning + "(Current clone amount:" + number[1] + ")");

            return uniqueName;
        }

        function generateUniqueObjectName(name, warning) {
            return generateUniqueName(name, name => !Boolean(getObjectByName(name)), warning);
        }

        // warning (optional): see generateUniqueName
        function cloneObject(objName, warning, cloneMaterials, preserveGroups) {
            if (!objName)
                return;
            const obj = getObjectByName(objName);
            if (!obj)
                return;

            const objNew = obj.clone(); // recursive
            objNew.name = generateUniqueObjectName(obj.name, warning);

            // assign unique names for multi-material object meshes
            const objsM = objNew.resolveMultiMaterial();
            if (objNew != objsM[0])
                for (let i = 0; i < objsM.length; i++)
                    objsM[i].name = objNew.name + 'MatMesh' + i;

            if (cloneMaterials) {
                objNew.traverse(o => {
                    if (o.material) {
                        o.material = o.material.clone();
                    }
                });
            }

            if (preserveGroups) {
                const oldGroups = [];
                obj.traverse(o => {
                    oldGroups.push(o.groupNames);
                });

                let i = 0;
                objNew.traverse(o => {
                    o.groupNames.push(...oldGroups[i]);
                    i++;
                });
            }

            appInstance.scene.add(objNew);

            // fix free light targets by appending them alongside the lights
            // TODO: find a way to handle old targets which was cloned but no longer needed
            objNew.traverse(o => {
                if (o.isFreeLight)
                    o.parent.add(o.target);
            });

            // add object to cache now to increase performance
            _pGlob.objCache.set(objNew.name, objNew);

            return objNew.name;
        }

        function makeParent(objName, targetObjName) {
            if (!objName)
                return;
            var obj = getObjectByName(objName);
            if (!obj)
                return;
            if (targetObjName && targetObjName !== LIST_NONE) {
                var targetObj = getObjectByName(targetObjName);
                if (!targetObj)
                    return;
            } else {
                obj.traverseAncestors(function (ancObj) {
                    if (ancObj.type == "Scene")
                        targetObj = ancObj;
                });
            }
            var matOffset = new v3d.Matrix4();
            matOffset.copy(targetObj.matrixWorld).invert();
            matOffset.multiply(obj.matrixWorld);
            matOffset.decompose(obj.position, obj.quaternion, obj.scale);
            targetObj.add(obj);

            obj.updateWorldMatrix(false, true);
        }

        function setObjTransform(objSelector, isWorldSpace, mode, vector, offset) {
            const x = vector[0];
            const y = vector[1];
            const z = vector[2];

            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.error('set transform puzzle: Invalid transform');
                return;
            }

            const objNames = retrieveObjectNames(objSelector);
            function setObjProp(obj, prop, val) {
                if (!offset) {
                    obj[mode][prop] = val;
                } else {
                    if (mode != "scale")
                        obj[mode][prop] += val;
                    else
                        obj[mode][prop] *= val;
                }
            }

            const inputsUsed = _pGlob.vec3Tmp.set(Number(x !== ''), Number(y !== ''), Number(z !== ''));
            const coords = _pGlob.vec3Tmp2.set(x || 0, y || 0, z || 0);

            if (mode === 'rotation')
                coords.multiplyScalar(v3d.MathUtils.DEG2RAD);

            const coordSystem = getSceneCoordSystem();

            transformCoordsSpace(inputsUsed, coordSystem, 'Y_UP_RIGHT', true);
            transformCoordsSpace(coords, coordSystem, 'Y_UP_RIGHT', mode === 'scale');

            for (let i = 0; i < objNames.length; i++) {
                const objName = objNames[i];
                if (!objName) continue;

                const obj = getObjectByName(objName);
                if (!obj) continue;

                if (isWorldSpace && obj.parent) {
                    obj.matrixWorld.decomposeE(obj.position, obj.rotation, obj.scale);

                    if (inputsUsed.x) setObjProp(obj, "x", coords.x);
                    if (inputsUsed.y) setObjProp(obj, "y", coords.y);
                    if (inputsUsed.z) setObjProp(obj, "z", coords.z);

                    obj.matrixWorld.composeE(obj.position, obj.rotation, obj.scale);
                    obj.matrix.multiplyMatrices(_pGlob.mat4Tmp.copy(obj.parent.matrixWorld).invert(), obj.matrixWorld);
                    obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);

                } else if (mode === 'rotation' && coordSystem == 'Z_UP_RIGHT') {
                    const euler = transformEulerV3dToBlenderShortest(obj.rotation,
                        _pGlob.eulerTmp);
                    transformCoordsSpace(euler, coordSystem, 'Y_UP_RIGHT');

                    if (inputsUsed.x) euler.x = offset ? euler.x + coords.x : coords.x;
                    if (inputsUsed.y) euler.y = offset ? euler.y + coords.y : coords.y;
                    if (inputsUsed.z) euler.z = offset ? euler.z + coords.z : coords.z;

                    euler.order = "YZX";
                    euler.reorder(obj.rotation.order);
                    obj.rotation.copy(euler);

                } else if (mode === 'rotation' && coordSystem == 'Y_UP_RIGHT') {
                    const rotUI = RotationInterface.initObject(obj);
                    const euler = rotUI.getUserRotation(_pGlob.eulerTmp);

                    if (inputsUsed.x) euler.x = offset ? euler.x + coords.x : coords.x;
                    if (inputsUsed.y) euler.y = offset ? euler.y + coords.y : coords.y;
                    if (inputsUsed.z) euler.z = offset ? euler.z + coords.z : coords.z;

                    rotUI.setUserRotation(euler);
                    rotUI.getActualRotation(obj.rotation);
                } else {
                    if (inputsUsed.x) setObjProp(obj, "x", coords.x);
                    if (inputsUsed.y) setObjProp(obj, "y", coords.y);
                    if (inputsUsed.z) setObjProp(obj, "z", coords.z);
                }
                obj.updateWorldMatrix(false, true);
            }
        }

        function getObjTransform(objName, isWorldSpace, mode, coord) {
            if (!objName)
                return;
            var obj = getObjectByName(objName);
            if (!obj)
                return;

            var coordSystem = getSceneCoordSystem();
            var transformVal;

            if (isWorldSpace && obj.parent) {
                if (mode === 'position') {
                    transformVal = transformCoordsSpace(
                        obj.getWorldPosition(_pGlob.vec3Tmp), 'Y_UP_RIGHT',
                        coordSystem, mode === 'scale');
                } else if (mode === 'rotation') {
                    transformVal = transformCoordsSpace(
                        obj.getWorldEuler(_pGlob.eulerTmp, 'XYZ'), 'Y_UP_RIGHT',
                        coordSystem, mode === 'scale');
                } else if (mode === 'scale') {
                    transformVal = transformCoordsSpace(
                        obj.getWorldScale(_pGlob.vec3Tmp), 'Y_UP_RIGHT',
                        coordSystem, mode === 'scale');
                }

            } else if (mode === 'rotation' && coordSystem == 'Z_UP_RIGHT') {
                transformVal = transformEulerV3dToBlenderShortest(obj.rotation,
                    _pGlob.eulerTmp);

            } else if (mode === 'rotation' && coordSystem == 'Y_UP_RIGHT') {
                var rotUI = RotationInterface.initObject(obj);
                transformVal = rotUI.getUserRotation(_pGlob.eulerTmp);

            } else {
                transformVal = transformCoordsSpace(obj[mode].clone(),
                    'Y_UP_RIGHT', coordSystem, mode === 'scale');
            }
            if (mode === 'rotation') {
                transformVal.x = v3d.MathUtils.radToDeg(transformVal.x);
                transformVal.y = v3d.MathUtils.radToDeg(transformVal.y);
                transformVal.z = v3d.MathUtils.radToDeg(transformVal.z);
            }
            if (coord == 'xyz')
                return transformVal.toArray().slice(0, 3);
            else
                return transformVal[coord];
        }

        function transformCoordsSpace(coords, spaceFrom, spaceTo, noSignChange = false) {
            if (spaceFrom === spaceTo) {
                return coords;
            }

            const y = coords.y;
            const z = coords.z;

            if (spaceFrom === 'Z_UP_RIGHT' && spaceTo === 'Y_UP_RIGHT') {
                coords.y = z;
                coords.z = noSignChange ? y : -y;
            } else if (spaceFrom === 'Y_UP_RIGHT' && spaceTo === 'Z_UP_RIGHT') {
                coords.y = noSignChange ? z : -z;
                coords.z = y;
            } else
                console.error('transformCoordsSpace: Unsupported coordinate space');
            return coords;
        }

        const transformEulerV3dToBlenderShortest = function () {
            const eulerTmp = new v3d.Euler();
            const eulerTmp2 = new v3d.Euler();
            const vec3Tmp = new v3d.Vector3();

            return function (euler, dest) {
                const eulerBlender = eulerTmp.copy(euler).reorder('YZX');
                const eulerBlenderAlt = eulerTmp2.copy(eulerBlender).makeAlternative();

                const len = vec3Tmp.setFromEuler(eulerBlender).lengthSq();
                const lenAlt = vec3Tmp.setFromEuler(eulerBlenderAlt).lengthSq();

                dest.copy(len < lenAlt ? eulerBlender : eulerBlenderAlt);
                return transformCoordsSpace(dest, 'Y_UP_RIGHT', 'Z_UP_RIGHT');
            }
        }();

        function RotationInterface() {
            this._userRotation = new v3d.Euler(0, 0, 0, 'ZYX');
            this._actualRotation = new v3d.Euler();
        }

        Object.assign(RotationInterface, {
            initObject: function (obj) {
                if (obj.userData.puzzles === undefined) {
                    obj.userData.puzzles = {}
                }
                if (obj.userData.puzzles.rotationInterface === undefined) {
                    obj.userData.puzzles.rotationInterface = new RotationInterface();
                }

                const rotUI = obj.userData.puzzles.rotationInterface;
                rotUI.updateFromObject(obj);
                return rotUI;
            },
        });

        Object.assign(RotationInterface.prototype, {
            updateFromObject: function (obj) {
                const SYNC_ROT_EPS = 1e-8;

                if (!this._actualRotation.equalsEps(obj.rotation, SYNC_ROT_EPS)) {
                    this._actualRotation.copy(obj.rotation);
                    this._updateUserRotFromActualRot();
                }
            },
            getActualRotation: function (euler) {
                return euler.copy(this._actualRotation);
            },
            setUserRotation: function (euler) {
                this._userRotation.set(euler.x, euler.y, euler.z);
                this._updateActualRotFromUserRot();
            },
            getUserRotation: function (euler) {
                return euler.copy(this._userRotation);
            },
            _updateUserRotFromActualRot: function () {
                const order = this._userRotation.order;
                this._userRotation.copy(this._actualRotation).reorder(order);
            },
            _updateActualRotFromUserRot: function () {
                const order = this._actualRotation.order;
                this._actualRotation.copy(this._userRotation).reorder(order);
            },
        });

        function setMorphFactor(objSelector, targetName, factor) {
            if (!targetName)
                return;

            const objNames = retrieveObjectNames(objSelector);

            for (let i = 0; i < objNames.length; i++) {
                const objName = objNames[i]
                if (!objName)
                    continue;
                let obj = getObjectByName(objName);
                if (!obj)
                    continue;

                obj.resolveMultiMaterial().forEach(function (objR) {
                    if (objR.morphTargetDictionary && targetName in objR.morphTargetDictionary) {
                        const idx = objR.morphTargetDictionary[targetName];
                        objR.morphTargetInfluences[idx] = Number(factor);
                    }
                });

                obj.resolveMultiMaterial().forEach(function (objR) {
                    objR.getAuxClippingMeshes().forEach(function (objC) {
                        if (objC.morphTargetDictionary && targetName in objC.morphTargetDictionary) {
                            const idx = objC.morphTargetDictionary[targetName];
                            objC.morphTargetInfluences[idx] = Number(factor);
                        }
                    });
                });
            }
        }

        function getObjectMaterial(objSelector, matIndex, useID) {
            const objNames = retrieveObjectNames(objSelector);

            for (let i = 0; i < objNames.length; i++) {
                const objName = objNames[i]
                if (!objName)
                    continue;
                let obj = getObjectByName(objName);
                if (!obj)
                    continue;

                const objsM = obj.resolveMultiMaterial();

                if (Number.isInteger(matIndex)) {
                    if (matIndex >= 1 && matIndex <= objsM.length) {
                        obj = objsM[matIndex-1];
                    } else {
                        console.error('get object material puzzle: invalid material index ' + matIndex);
                        continue;
                    }
                } else {
                    obj = objsM[0];
                }

                if (obj.material) {
                    // COMPAT: <4.9.0, old engine, new puzzles, see getMaterialByName()
                    if (useID && v3d.MathUtils.checkUUID)
                        return obj.material.uuid;
                    else
                        return obj.material.name;
                } else {
                    console.error('get object material puzzle: invalid object ' + obj.name);
                }
            }
            return '';
        }

        function getMaterialEditableColors(matName) {
            const mat = v3d.SceneUtils.getMaterialByName(appInstance, matName);
            if (!mat) {
                return [];
            }

            if (mat.isMeshNodeMaterial) {
                return Object.keys(mat.nodeRGBMap);
            } else if (mat.isMeshStandardMaterial) {
                return ['color', 'emissive'];
            } else if (mat.isMeshLineMaterial) {
                return ['color'];
            } else {
                return [];
            }
        }

        function getMaterialEditableValues(matName) {
            const mat = v3d.SceneUtils.getMaterialByName(appInstance, matName);
            if (!mat) {
                return [];
            }

            if (mat.isMeshNodeMaterial) {
                return Object.keys(mat.nodeValueMap);
            } else if (mat.isMeshStandardMaterial) {
                return ['metalness', 'roughness', 'opacity', 'emissiveIntensity', 'bumpScale', 'envMapIntensity'];
            } else {
                return [];
            }
        }

        function setMaterialColor(matSelector, colName, r, g, b, cssCode) {
            const matNames = Array.isArray(matSelector) ? matSelector : [matSelector];

            matNames.forEach(function(matName) {
                const colors = getMaterialEditableColors(matName);
                if (colors.indexOf(colName) < 0)
                    return;

                if (cssCode) {
                    const color = new v3d.Color(cssCode);
                    r = color.r;
                    g = color.g;
                    b = color.b;
                }

                const mats = v3d.SceneUtils.getMaterialsByName(appInstance, matName);

                for (let i = 0; i < mats.length; i++) {
                    const mat = mats[i];

                    if (mat.isMeshNodeMaterial) {
                        const rgbIdx = mat.nodeRGBMap[colName];
                        mat.nodeRGB[rgbIdx].x = r;
                        mat.nodeRGB[rgbIdx].y = g;
                        mat.nodeRGB[rgbIdx].z = b;
                    } else {
                        mat[colName].r = r;
                        mat[colName].g = g;
                        mat[colName].b = b;
                    }

                    // COMPAT: <4.9.0
                    if (v3d.engineVersionCmp('4.9.0', v3d.REVISION) < 0)
                        mat.needsUpdate = true;

                    if (appInstance.scene !== null) {
                        if (mat === appInstance.scene.worldMaterial) {
                            appInstance.updateEnvironment(mat);
                        }
                    }
                }
            });
        }

        function setMaterialValue(matSelector, valName, value) {
            const matNames = Array.isArray(matSelector) ? matSelector : [matSelector];

            matNames.forEach(function(matName) {
                const values = getMaterialEditableValues(matName);
                if (values.indexOf(valName) < 0)
                    return;

                const mats = v3d.SceneUtils.getMaterialsByName(appInstance, matName);
                for (let i = 0; i < mats.length; i++) {
                    const mat = mats[i];

                    if (mat.isMeshNodeMaterial) {
                        const valIdx = mat.nodeValueMap[valName];
                        mat.nodeValue[valIdx] = Number(value);
                    } else
                        mat[valName] = Number(value);

                    if (appInstance.scene !== null) {
                        if (mat === appInstance.scene.worldMaterial) {
                            appInstance.updateEnvironment(mat);
                        }
                    }
                }
            });
        }

        // assignMaterial puzzle
        function assignMat(objSelector, matName, matIndex) {
            const objNames = retrieveObjectNames(objSelector);
            if (!matName)
                return;

            const isMaterialInScene = (mat) => v3d.SceneUtils.getMaterialsByName(appInstance, mat.name).some(iMat => iMat === mat);
            const materialsCache = _pGlob.materialsCache;
            const mat = materialsCache.get(matName) || v3d.SceneUtils.getMaterialByName(appInstance, matName);
            if (!mat)
                return;
            for (let i = 0; i < objNames.length; i++) {
                const objName = objNames[i];
                if (!objName)
                    continue;
                const obj = getObjectByName(objName);
                if (obj) {
                    const objsM = obj.resolveMultiMaterial();

                    let objM;
                    if (Number.isInteger(matIndex)) {
                        if (matIndex >= 1 && matIndex <= objsM.length) {
                            objM = objsM[matIndex - 1];
                        } else {
                            console.error('assign material puzzle: Invalid material index ' + matIndex);
                            continue;
                        }
                    } else {
                        objM = objsM[0];
                    }

                    const oldMat = objM.material;
                    if (!oldMat)
                        continue; // pass silently

                    objM.material = mat;

                    if (!isMaterialInScene(oldMat)) {
                        materialsCache.set(oldMat.name, oldMat);
                    }
                }
            }

            if (materialsCache.has(mat.name) && isMaterialInScene(mat)) {
                materialsCache.delete(mat.name);
            }
        }

        function isMeshObject(obj) {
            if (obj.isMesh) {
                return true;
            }

            for (let i = 0; i < obj.children.length; i++) {
                const child = obj.children[i];
                if (child.isMesh && child.isMaterialGeneratedMesh) {
                    return true;
                }
            }

            return false;
        }

        function getMaterialProfile() {
            if (appInstance && appInstance.scene && appInstance.scene.worldMaterial)
                return appInstance.scene.worldMaterial.profile;
            else
                return 'blender';
        }

        function removeObject(obj, objName) {
            if (obj.isClippingPlaneObject)
                // COMPAT: < 4.10, new puzzles, old engine
                if (v3d.SceneUtils.removeClipPlanesFromMats)
                    v3d.SceneUtils.removeClipPlanesFromMats(obj, appInstance.scene);

            obj.parent.remove(obj);

            // remove object and its children from cache
            _pGlob.objCache.delete(objName);

            obj.traverse(child => {
                _pGlob.objCache.delete(child.name);
            });
        }

        function makeObjectCSG(name, operation, objName1, objName2, clean) {

            if (!objName1 || !objName2)
                return;

            const obj1 = getObjectByName(objName1);
            const obj2 = getObjectByName(objName2);
            if (!obj1 || !obj2)
                return;

            function createClippingBox(obj) {
                const geometry = new v3d.BoxGeometry(1000, 1000, 1000);
                geometry.translate(0, obj.negated ? 500 : -500, 0);

                let material;

                const auxMeshes = obj.getAuxClippingMeshes();
                if (auxMeshes.length) {
                    // COMPAT: <4.7
                    if (v3d.MaterialUtils.createStandardPBRMaterial) {
                        material = new v3d.MaterialUtils.createStandardPBRMaterial(getMaterialProfile(), {
                            color: obj.crossSectionColor,
                            opacity: obj.crossSectionOpacity,
                            roughness: 1.0,
                            metalness: 0.0
                        });
                    } else {
                        material = new v3d.MeshStandardMaterial({
                            color: obj.crossSectionColor,
                            opacity: obj.crossSectionOpacity,
                            roughness: 1.0,
                            metalness: 0.0
                        });
                    }
                } else {
                    // fully transparent
                    material = new v3d.MeshBasicMaterial({
                        color: 'white',
                        alphaTest: 1,
                        opacity: 0
                    });
                }
                // same as in ClippingPlaneObject.createCrossSectionPlane()
                material.name = 'ClipCrossSectionColor';

                const mesh = new CSG.Brush(geometry, material);

                mesh.copyTransform(obj);
                mesh.updateWorldMatrix(false, true);

                return mesh;
            }

            // bake when necessary
            function getMeshGeometry(mesh) {
                if (mesh.isSkinnedMesh || (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0)) {
                    const attrs = v3d.BufferGeometryUtils.computeMorphedAttributes(mesh);
                    const geometry = mesh.geometry.clone();
                    geometry.morphAttributes = {};
                    geometry.setAttribute('position', attrs.morphedPositionAttribute);
                    geometry.setAttribute('normal', attrs.morphedNormalAttribute);
                    return geometry;
                } else {
                    return mesh.geometry;
                }
            }

            // if assigned for both objects, obj1 takes priority
            function findSourceMeshByMaterial(material, obj1, obj2) {
                let result = null;

                obj1.resolveMultiMaterial().forEach(function (objR) {
                    if (objR.material == material)
                        result = objR;
                })

                if (!result)
                    obj2.resolveMultiMaterial().forEach(function (objR) {
                        if (objR.material == material)
                            result = objR;
                    })

                return result;
            }

            // see Object3D.copy()
            function inheritMeshProps(srcMesh, dstMesh) {
                dstMesh.hidpiCompositing = srcMesh.hidpiCompositing;
                dstMesh.objectIndex = srcMesh.objectIndex;
                dstMesh.objectColor.copy(srcMesh.objectColor);
                dstMesh.objectAlpha = srcMesh.objectAlpha;
                dstMesh.groupNames = srcMesh.groupNames.slice();
                dstMesh.castShadow = srcMesh.castShadow;
                dstMesh.receiveShadow = srcMesh.receiveShadow;
                dstMesh.frustumCulled = srcMesh.frustumCulled;
                dstMesh.renderOrder = srcMesh.renderOrder;
            }

            if (obj1.isClippingPlaneObject && obj2.isClippingPlaneObject) {
                console.error('make object from puzzle: both objects cannot be clipping planes');
                return;
            }

            let obj1Process, obj2Process;

            if (obj1.isClippingPlaneObject) {
                if (operation == 'INTERSECT') {
                    obj1Process = createClippingBox(obj1);
                    // subtract is faster
                    operation = 'SUBTRACT';
                } else {
                    console.error('make object from puzzle: only "intesection" mode is supported for clipping planes');
                    return;
                }
            } else if (isMeshObject(obj1)) {
                // meshMulti == obj1 in case of single-material mesh object
                const meshMulti = v3d.SceneUtils.createMultiMaterialMesh(obj1);
                obj1Process = new CSG.Brush(getMeshGeometry(meshMulti));
                obj1Process.matrixWorld.copy(meshMulti.matrixWorld);
                obj1Process.material = meshMulti.material;
            } else {
                console.error('make object from puzzle: first object should be mesh or clipping plane');
                return;
            }

            if (obj2.isClippingPlaneObject) {
                if (operation == 'INTERSECT') {
                    obj2Process = createClippingBox(obj2);
                    // subtract is faster
                    operation = 'SUBTRACT';
                } else {
                    console.error('make object from puzzle: only "intesection" mode is supported for clipping planes');
                    return;
                }
            } else if (isMeshObject(obj2)) {
                // meshMulti == obj2 in case of single-material mesh object
                const meshMulti = v3d.SceneUtils.createMultiMaterialMesh(obj2);
                obj2Process = new CSG.Brush(getMeshGeometry(meshMulti));
                obj2Process.matrixWorld.copy(meshMulti.matrixWorld);
                obj2Process.material = meshMulti.material;
            } else {
                console.error('make object from puzzle: second object should be mesh or clipping plane');
                return;
            }

            let objNew;
            const evaluator = new CSG.Evaluator();

            switch (operation) {
                case 'UNION':
                    objNew = evaluator.evaluate(obj1Process, obj2Process, CSG.ADDITION);
                    break;
                case 'SUBTRACT':
                    objNew = evaluator.evaluate(obj1Process, obj2Process, CSG.SUBTRACTION);
                    break;
                case 'INTERSECT':
                    objNew = evaluator.evaluate(obj1Process, obj2Process, CSG.INTERSECTION);
                    break;
            }

            objNew.name = name;

            if (Array.isArray(objNew.material)) {
                objNew = v3d.SceneUtils.createMeshesFromMultiMaterialMesh(objNew);

                // inherit some props from the corresponding meshes
                objNew.resolveMultiMaterial().forEach(function (objR) {
                    if (objR.material) {
                        const srcMesh = findSourceMeshByMaterial(objR.material, obj1, obj2);
                        if (srcMesh)
                            inheritMeshProps(srcMesh, objR);
                    }
                });
            } else {
                inheritMeshProps(obj1, objNew);
            }

            obj1.parent.attach(objNew);

            // clean object cache
            _pGlob.objCache.clear();

            if (clean) {
                removeObject(obj1, objName1);
                removeObject(obj2, objName2);
            }
        }
        //#endregion

        //#region Clones -----------------------------------------------------
        // The clone at cache[index], made the first time it is needed: a clone of templateName, parented to
        // parentName (an anchor), at the anchor's origin with the template's own rotation and scale. Shown.
        // warning, cloneMaterials (optional): passed to cloneObject. cloneMaterials gives the clone its own material
        // copy, e.g. so each LED can have its own colour.
        function getCachedClone(cache, index, templateName, parentName, warning, cloneMaterials) {
            if (!getObjectByName(cache[index])) {
                const name = cloneObject(templateName, warning, cloneMaterials);
                if (!name) {
                    console.warn('[Calista 3D] template object "' + templateName + '" is not in the scene');
                    return null;
                }
                makeParent(name, parentName);
                // The clone's children keep the template's names, so they would exist twice: prefix them.
                getObjectByName(name).traverse(child => {
                    if (child.name !== name && isObjectWorthProcessing(child)) {
                        child.name = name + ' > ' + child.name;
                        _pGlob.objCache.set(child.name, child);
                    }
                });
                // makeParent keeps the world transform; reset it to the anchor's origin instead. The template's
                // rotation is read in LOCAL space: read in world space, templates turned around two axes come
                // out 120° off (e.g. "Led strip.0").
                setObjTransform(name, false, 'position', [0, 0, 0], false);
                setObjTransform(name, false, 'rotation', getObjTransform(templateName, false, 'rotation', 'xyz'), false);
                setObjTransform(name, false, 'scale', getObjTransform(templateName, true, 'scale', 'xyz'), false);
                cache[index] = name;
            }
            changeVis(cache[index], true);
            return cache[index];
        }

        // Hide the clones of a cache from index `from` on (left over from a bigger configuration).
        function hideCachedClones(cache, from) {
            for (let i = from; i < cache.length; i++)
                changeVis(cache[i], false);
        }
        //#endregion ---------------------------------------------------------------

        //#region Parameters ---------------------
        // The only place scope[] is read. Everything the 3D builds comes from sceneParameters.
        // Lists and objects may arrive as real values or as JSON strings; anything missing or broken falls
        // back to a default, so a bad value never stops the build.
        function getParameters() {
            // Dev: the live configurator doesn't send the new contract yet → use a bundled example.
            if (DEV_SCOPE && scope['_3d_StructureSections'] === undefined && scope['_3d_SideOpenings'] === undefined) {
                console.warn('[Calista 3D] no _3d_StructureSections / _3d_SideOpenings in the scope, using DEV scope "' + DEV_SCOPE + '"');
                scope = Object.assign({}, scope, DEV_SCOPES[DEV_SCOPE]);
            }
            sceneParameters = {
                screenshotName: scope['_3d_screenshotName'] || 'Your_Skylux_Configuration',
                isFreeStanding: scope['_3d_conservatoryStructure'] === 'freeStanding',
                widthTotal: num(scope['_3d_widthTotal'], 3000),
                depthTotal: num(scope['_3d_depthTotal'], 3000),
                walls: Object.assign({ front: false, right: false, rear: false, left: false }, toObject(scope['_3d_walls'])),
                colorOutside: scope['_3d_colorOutside'] || '#293133',
                perspective: scope['_perspective'] || 'main',    // camera view for the snapshot / SSR
            };
            // after the general values: sections and sides fall back on them
            sceneParameters.structureSections = toArray(scope['_3d_StructureSections']).map(getSectionParameters);
            sceneParameters.sideOpenings = toArray(scope['_3d_SideOpenings']).map(getSideOpeningParameters);
            console.info('[Calista 3D] sceneParameters', sceneParameters);
        }
        function getSectionParameters(section) {
            const roofOptions = toObject(section.roofOptions);
            const depth = num(section.depth, sceneParameters.depthTotal);
            return {
                width: num(section.width, sceneParameters.widthTotal),
                depth: depth,
                xPos: num(section.xPos, 0),
                yPos: num(section.yPos, depth / 2),     // centre of the footprint, back edge at Y = 0
                heightUnderGutter: num(section.heightUnderGutter, 2500),
                horizontalScreen: toObject(roofOptions.horizontalScreen, null),
                roofFillings: toArray(roofOptions.roofFillings),
                rafters: toArray(roofOptions.rafters),
            };
        }
        function getSideOpeningParameters(sideOpening) {
            const sideSpecs = toObject(sideOpening.sideSpecs);
            const rotation = num(sideSpecs.rotation, 0);
            const side = { 0: 'left', 90: 'rear', 180: 'right', 270: 'front' }[rotation] || null;
            return {
                side: side,                                         // name from the rotation (walls, camera)
                isWall: side ? sceneParameters.walls[side] : false, // a house wall stands on this side
                xPos: num(sideSpecs.xPos, 0),                       // start point of the side
                yPos: num(sideSpecs.yPos, 0),
                rotation: rotation,                                 // front 270 · rear 90 · left 0 · right 180
                length: num(sideSpecs.length, 0),
                height: num(sideSpecs.height, 2500),
                poles: toArray(sideOpening.poles),
                bays: toArray(sideOpening.bays),
            };
        }
        // A list, also from a JSON string; anything else gives []. Entries that aren't objects are dropped.
        function toArray(value) {
            if (typeof value === 'string')
                try { value = JSON.parse(value); } catch (e) { return []; }
            return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
        }
        // An object, also from a JSON string; anything else gives `fallback` ({} unless given).
        function toObject(value, fallback = {}) {
            if (typeof value === 'string')
                try { value = JSON.parse(value); } catch (e) { return fallback; }
            return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
        }
        // A number, also from a numeric string; anything else gives `fallback`.
        function num(value, fallback) {
            const number = Number(value);
            return value !== null && value !== '' && Number.isFinite(number) ? number : fallback;
        }
        //#endregion-------------

        //#region Configurator handlers
        function setCameraOptions() {
            appInstance.controls.panInertia = 0.1;
            appInstance.controls.rotateInertia = 0.1;

            appInstance.controls.minPolarAngle = 0;
            appInstance.controls.maxPolarAngle = 5;
        }

        function handleButtons(data) {
            switch (data.type) {
                case 'FULL_SCREEN':
                    appInstance._resizeCb();
                    break;
                case 'DOWNLOAD_IMAGE':
                    generateScreenshot();
                    break;
                case 'RELOAD_3D':
                    cameraPosition();
                    break;
                case 'SHOW_MEASUREMENTS':
                    measurementsShown = !data.active;   // data.active is the state before the click
                    enableMeasurements();
                    break;
            }
        }

        // A step opens: a side step turns the camera to that side; another step leaves the camera where it is.
        function handleEvents(data) {
            const view = data && data.step ? STEP_VIEWS[data.step.id] : null;
            stepView = view || null;
            if (view)
                cameraPosition();
        }

        // The configurator opened a field (no data: closed it). A roof group label selects that filling / rafter;
        // the labels don't name a section, so they go to the first one.
        function handleFocus(data) {
            const label = data ? String(data.uniqueLabel || '') : '';
            // the dimensions step and its fields show the measurements, the focused field's bar highlighted
            if (data) {
                measurementsInStep = ["dimensions_step", "width_field", "depth_field", "height_field"].includes(label);
                measurementField = label;
                enableMeasurements();
            }

            // a side's (or the roof's) field turns the camera to it
            if (data && FOCUS_VIEWS[label]) {
                stepView = FOCUS_VIEWS[label];
                cameraPosition();
            }

            const section = structureSectionCache[0];
            if (!section)
                return;
            if (!data)
                section.select(null, -1);
            else if (label.startsWith('filling_group~'))
                section.select("filling", parseInt(label.slice(14)));
            else if (label.startsWith('rafter_group~'))
                section.select("rafter", parseInt(label.slice(13)));
        }

        function handleValue(data) {
        }
        //#endregion

        //#region Camera ---------------------------------------------------------------------
        // Frame the structure: ScaleCube (a 1 m cube in the GLB, origin at its bottom) is wrapped around it,
        // Camerapos / Cameratarget give the viewing direction, fitCameraToObjects zooms until it fits.
        // The direction: the open side step's view (stepView), else the perspective the configurator asks for
        // (_perspective, e.g. for the SSR). A side view looks at that side from 8 m out, a bit above (legacy).
        function cameraPosition(onFinish) {
            const section = sceneParameters.structureSections[0];
            const width = mm(sceneParameters.widthTotal);
            const depth = mm(sceneParameters.depthTotal);
            const totalHeight = section ? mm(section.heightUnderGutter) + 0.26 : 2.76;   // + crown beam height
            const size = (width + depth + totalHeight) / 10;
            const views = {
                main: [width + size + 2, width + size + 8, totalHeight + size + 2],
                perspective: [width + size + 5, width + size + 8, totalHeight + size + 2],
                side: [-(width + 8), depth / 2, totalHeight / 2],
                front: [0, depth + 8, totalHeight / 2],
                top: [0, depth / 2, totalHeight + 16],
                left: [width / 2 + 8, depth / 2, totalHeight],
                right: [-(width / 2 + 8), depth / 2, totalHeight],
                rear: [0, -8, totalHeight],
            };

            setObjTransform("Camerapos", false, "position", views[stepView || sceneParameters.perspective] || views.main, false);
            setObjTransform("Cameratarget", false, "position", [0, depth / 2, totalHeight / 2], false);
            setObjTransform("ScaleCube", false, "position", [0, depth / 2, 0], false);
            setObjTransform("ScaleCube", false, "scale", [width, depth, totalHeight], false);

            // onFinish must always run: the snapshot waits for it.
            if (!getObjectByName("ScaleCube")) {
                console.warn('[Calista 3D] "ScaleCube" is not in the scene, the camera is not framed');
                if (onFinish) onFinish();
                return;
            }
            // fitCameraToObjects skips while the camera is still moving: frame again once that tween is over.
            if (appInstance.controls && appInstance.controls.inTween) {
                registerSetTimeout(1, function () { cameraPosition(onFinish); });
                return;
            }

            const animTime = (sceneIsInitialized) ? 1 : 0;
            fitCameraToObjects("ScaleCube", { cameraPos: "Camerapos", cameraTarget: "Cameratarget" }, { duration: animTime, onDone: function () { if (onFinish) onFinish(); } });
        }

        function fitCameraToObjects(targets, direction, options = {}) {
            if (options === null || typeof options !== "object") {
                if (options !== undefined) console.warn("[fitCameraToObjects] 'options' must be an object, got:", options, "— using defaults");
                options = {};
            }
            let { margin = 1, duration = 0, onDone = function () { } } = options;
            if (typeof margin !== "number" || !isFinite(margin) || margin <= 0) { console.warn("[fitCameraToObjects] 'margin' must be a positive number, got:", options.margin, "— using 1"); margin = 1; }
            if (typeof duration !== "number" || !isFinite(duration) || duration < 0) { console.warn("[fitCameraToObjects] 'duration' must be a number ≥ 0, got:", options.duration, "— using 0"); duration = 0; }
            if (typeof onDone !== "function") { console.warn("[fitCameraToObjects] 'onDone' must be a function, got:", options.onDone, "— ignoring (no action)"); onDone = function () { }; }

            if (targets == null) { console.warn("[fitCameraToObjects] 'targets' is missing — nothing to frame"); return; }
            const objects = [];
            (Array.isArray(targets) ? targets : [targets]).forEach(function (entry) {
                if (entry == null) { console.warn("[fitCameraToObjects] skipping a null/undefined target entry"); return; }
                const obj = (typeof entry === "string") ? getObjectByName(entry) : entry;
                if (!obj) { console.warn("[fitCameraToObjects] target not found / invalid:", entry); return; }
                objects.push(obj);
            });
            if (!objects.length) { console.warn("[fitCameraToObjects] nothing to frame — no valid objects resolved from 'targets'"); return; }

            const camera = appInstance.getCamera();
            if (!camera) { console.warn("[fitCameraToObjects] no active camera — appInstance.getCamera() returned nothing"); return; }

            const fitPos = new v3d.Vector3(), center = new v3d.Vector3(), fitZoom = [camera.zoom];
            v3d.CameraUtils.calcCameraZoomToObjectsParams(camera, objects, fitPos, center, fitZoom);
            const fitDistance = fitPos.distanceTo(center) * margin;

            const cameraDirection = new v3d.Vector3();
            if (direction != null) {
                if (direction.cameraPos != null || direction.cameraTarget != null) {
                    if (direction.cameraPos == null || direction.cameraTarget == null) {
                        console.warn("[fitCameraToObjects] direction needs BOTH cameraPos and cameraTarget; got:", direction, "— using current view");
                    } else {
                        const posObj = (typeof direction.cameraPos === "string") ? getObjectByName(direction.cameraPos) : direction.cameraPos;
                        const targetObj = (typeof direction.cameraTarget === "string") ? getObjectByName(direction.cameraTarget) : direction.cameraTarget;
                        if (!posObj) console.warn("[fitCameraToObjects] direction.cameraPos not found:", direction.cameraPos);
                        if (!targetObj) console.warn("[fitCameraToObjects] direction.cameraTarget not found:", direction.cameraTarget);
                        if (posObj && targetObj) {
                            cameraDirection.copy(posObj.getWorldPosition(new v3d.Vector3())).sub(targetObj.getWorldPosition(new v3d.Vector3()));
                            if (cameraDirection.lengthSq() === 0) console.warn("[fitCameraToObjects] cameraPos and cameraTarget share a position — no direction; using current view");
                        }
                    }
                } else {
                    const vec = Array.isArray(direction) ? direction : (direction.vector ?? direction);
                    const x = vec?.[0] ?? vec?.x, y = vec?.[1] ?? vec?.y, z = vec?.[2] ?? vec?.z;
                    if (![x, y, z].every(component => typeof component === "number" && isFinite(component))) {
                        console.warn("[fitCameraToObjects] direction must be [x,y,z] / { vector } / Vector3 (3 finite numbers) or { cameraPos, cameraTarget }; got:", direction, "— using current view");
                    } else {
                        cameraDirection.set(x, y, z);
                        cameraDirection.copy(transformCoordsSpace(cameraDirection, getSceneCoordSystem(), 'Y_UP_RIGHT'));
                    }
                }
            }
            if (cameraDirection.lengthSq() === 0) cameraDirection.copy(fitPos).sub(center);
            cameraDirection.normalize();

            const cameraPos = center.clone().add(cameraDirection.multiplyScalar(fitDistance));
            const orthoZoom = camera.isOrthographicCamera ? fitZoom[0] / margin : null;
            const setOrthoZoom = function () { camera.zoom = orthoZoom; camera.updateProjectionMatrix(); };

            if (appInstance.controls && appInstance.controls.tween) {
                if (!appInstance.controls.inTween) {
                    if (orthoZoom != null) setOrthoZoom();
                    appInstance.controls.tween(cameraPos, center, Math.max(0, duration), onDone);
                }
            } else {
                if (orthoZoom != null) setOrthoZoom();
                if (camera.parent) camera.parent.worldToLocal(cameraPos);
                camera.position.copy(cameraPos);
                camera.lookAt(center);
                onDone();
            }
        }
        //#endregion ---------------------------------------------------------------

        //#region Snapshot + screenshot
        // The configurator waits for this image after every change: frame the structure, then grab the frame
        // 250 ms after the camera settles.
        function takeSnapshot() {
            cameraPosition(function () {
                registerSetTimeout(0.25, function () {
                    snapshot(appInstance.renderer.domElement.toDataURL("image/png"), 0);
                });
            });
        }

        function generateScreenshot() {
            const link = document.createElement('a');
            link.href = appInstance.renderer.domElement.toDataURL('image/png');
            link.download = sceneParameters.screenshotName + '.png';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => document.body.removeChild(link), 100);
        }
        //#endregion

        //#region Clicks ---------------------------------------------------------------
        // One click listener for the whole scene. Each part registers its clickable objects with what a click does.
        function registerClickable(objName, onClick) {
            if (objName)
                clickables[objName] = onClick;
        }

        // Installed once: PL.init runs again on every change, the listeners stay.
        function initClicks() {
            const elem = appInstance.cssRenderer ? appInstance.container : appInstance.renderer.domElement;
            if (clickElement === elem || !elem.addEventListener)
                return;
            clickElement = elem;

            let downX = 0, downY = 0;
            elem.addEventListener('pointerdown', event => { downX = event.clientX; downY = event.clientY; });
            elem.addEventListener('click', event => {
                if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6)
                    return;   // the mouse moved: the camera was turned, not a click
                const name = getClickableAt(elem, event.offsetX, event.offsetY);
                if (name)
                    clickables[name]();
                else
                    clearRoofSelection();
            });

            // hand cursor over clickable objects (one raycast per frame at most, none while turning the camera)
            let hoverEvent = null;
            elem.addEventListener('pointermove', event => {
                if (event.buttons || event.pointerType == 'touch')
                    return;
                if (!hoverEvent)
                    requestAnimationFrame(() => {
                        elem.style.cursor = getClickableAt(elem, hoverEvent.offsetX, hoverEvent.offsetY) ? 'pointer' : '';
                        hoverEvent = null;
                    });
                hoverEvent = event;
            });
        }

        // The nearest shown object under the mouse, walked up its parents to a registered name (the hit can be a child).
        function getClickableAt(elem, offsetX, offsetY) {
            const camera = appInstance.getCamera(true);
            if (!camera || !elem.clientWidth || !elem.clientHeight)
                return null;
            _pGlob.screenCoords.set(offsetX / elem.clientWidth * 2 - 1, -offsetY / elem.clientHeight * 2 + 1);
            _pGlob.raycasterTmp.setFromCamera(_pGlob.screenCoords, camera);
            const objList = [];
            appInstance.scene.traverse(obj => objList.push(obj));
            const hit = _pGlob.raycasterTmp.intersectObjects(objList, false).find(h => isShown(h.object));
            for (let obj = hit ? hit.object : null; obj; obj = obj.parent)
                if (clickables[obj.name])
                    return obj.name;
            return null;
        }

        // Verge3D draws an object when its own visible flag is set; only material sub-meshes follow their parent.
        function isShown(obj) {
            if (obj.isMaterialGeneratedMesh && obj.parent)
                return obj.parent.visible;
            return obj.visible;
        }

        // Click animations: a value from `from` to `to` in `duration` s, onUpdate(value)
        // every frame. The engine has no tween library (the legacy file carried its own copy), so it runs on the
        // browser's animation frames. Returns a function that stops it where it is.
        const ANIMATION_TIME = 2;   // s
        function animateValue(from, to, duration, onUpdate, onDone) {
            let start = null, stopped = false;
            function step(now) {
                if (stopped)
                    return;
                if (start === null)
                    start = now;
                const t = Math.min((now - start) / (duration * 1000), 1);
                onUpdate(from + (to - from) * ease(t));
                if (t < 1)
                    requestAnimationFrame(step);
                else if (onDone)
                    onDone();
            }
            requestAnimationFrame(step);
            return () => stopped = true;
        }

        // Steady speed, with a soft start and stop: it speeds up over the first 15 % of the time and slows down over
        // the last 15 % (t and the result run 0 -> 1).
        function ease(t) {
            const ramp = 0.15, speed = 1 / (1 - ramp);
            if (t < ramp)
                return speed * t * t / (2 * ramp);
            if (t > 1 - ramp)
                return 1 - speed * (1 - t) * (1 - t) / (2 * ramp);
            return speed * (t - ramp / 2);
        }

        // Something a click opens and closes (a screen, a sunblind, a Climaglide): its state is kept on the object that
        // owns it, so it survives configurator changes. opening: 0 shut ... 100 open; target: where it is going (or went).
        function openingState() {
            return { opening: 0, target: 0, stop: null };
        }

        // Clicked: open it or shut it. A click while it moves turns it back from where it is, at the same speed (the time
        // scales with the distance left). apply(opening) draws it at every frame.
        function toggleOpening(state, apply) {
            if (state.stop)
                state.stop();
            state.target = state.target == 100 ? 0 : 100;
            const duration = ANIMATION_TIME * Math.abs(state.target - state.opening) / 100;
            state.stop = animateValue(state.opening, state.target, duration, value => {
                state.opening = value;
                apply(value);
            }, () => state.stop = null);
        }
        //#endregion ---------------------------------------------------------------

        //#region StructureSection ---------------------------------------------------------------
        // One per _3d_StructureSections[] entry: the crown (gutter beams) and the roof.
        // Its anchor (a clone of empty.0) sits at the section centre; everything it builds is parented to it,
        // so positions below are local: x across the width, y across the depth, from the section centre.
        class StructureSection {
            constructor() {
                this.anchor = cloneObject("empty.0");
                if (!this.anchor)
                    console.warn('[Calista 3D] "empty.0" is not in the scene, the section cannot be placed');
                this.crownBeamCache = [];   // [front, rear, left, right]
                this.rafterCache = [];      // per rafter: the rafter itself…
                this.ledStripCache = [];    // …and one of these three profiles under it
                this.ledSpotProfileCache = [];
                this.noLedStripCache = [];
                this.ledSpotCache = [];     // all LED spots of the section, rafter after rafter
                this.glassCache = [];       // per roof filling, one of these four
                this.plasticCache = [];
                this.sandwichWhiteCache = [];
                this.sandwichAnthraciteCache = [];
                this.screenCache = [];               // [zipper, nonZipper, bottomZipper]: one screen type shows
                this.screenSupportCache = [[], [], []];   // the depth supports, per screen type

                // roof selection (clicked in 3D or focused in the configurator), -1: none
                this.selectedRafter = -1;
                this.selectedFilling = -1;
                this.selectedRafterCache = [];      // the selected rafter's "_Selected" meshes: [rafter, strip, spot profile, no strip]
                this.selectedLedSpotCache = [];
                this.selectedFillingCache = [];     // the highlight over the selected filling

                // horizontal screen, opened / closed by a click: 0 shut … 100 open (kept between configurator changes)
                this.screenState = openingState();
                this.activeScreen = null;           // the shown screen clone, null without a screen
            }

            enable(section) {
                this.section = section;   // to rebuild when the selection changes
                this.width = mm(section.width);
                this.depth = mm(section.depth);
                this.totalHeight = mm(section.heightUnderGutter) + 0.26;   // + crown beam height: top of the crown

                this.xPos = mm(section.xPos);
                this.yPos = mm(section.yPos);

                setObjTransform(this.anchor, false, "position", [this.xPos, this.yPos, 0], false);
                this.enableCrown();
                this.enableRafters(section.rafters);
                this.enableRoofFillings(section.roofFillings);
                this.enableHorizontalScreen(section.horizontalScreen);
            }

            // One rafter per entry, spanning the depth between the front and rear beams. Under it one profile
            // shows its lighting: a LED strip, a spot profile with its spots, or none (a strip wins over spots).
            // A rafter's position is measured from the section's left edge (+X), so x = width / 2 - position.
            enableRafters(rafters) {
                const depthMorph = ((this.depth - 2 * 0.15) - 1) / 100;
                this.ledStripCount = 0;     // for the roof light
                this.ledSpotCount = 0;
                let spotIndex = 0, selectedSpotIndex = 0;
                hideCachedClones(this.selectedRafterCache, 0);

                for (let i = 0; i < rafters.length; i++) {
                    const x = this.width / 2 - mm(num(rafters[i].position, 0));
                    const profile = rafters[i].ledStrip ? "ledStrip" : (rafters[i].ledSpot ? "ledSpot" : "none");
                    const isSelected = i == this.selectedRafter;
                    const parts = [
                        { show: true, cache: this.rafterCache, template: "Rafter 190x140 base" },
                        { show: profile == "ledStrip", cache: this.ledStripCache, template: "Led strip", cloneMaterials: true },
                        { show: profile == "ledSpot", cache: this.ledSpotProfileCache, template: "Led spot profile" },
                        { show: profile == "none", cache: this.noLedStripCache, template: "No Led strip" },
                    ];

                    // the selected rafter is built from the "_Selected" meshes instead
                    for (let p = 0; p < parts.length; p++) {
                        if (!parts[p].show || isSelected)
                            changeVis(parts[p].cache[i], false);   // this rafter may have had another profile before
                        if (!parts[p].show)
                            continue;
                        const name = isSelected
                            ? getCachedClone(this.selectedRafterCache, p, parts[p].template + "_Selected.0", this.anchor)
                            : getCachedClone(parts[p].cache, i, parts[p].template + ".0", this.anchor, undefined, parts[p].cloneMaterials);
                        setObjTransform(name, false, "position", [x, 0, this.totalHeight], false);
                        setMorphFactor(name, 'Width', depthMorph);
                        registerClickable(name, () => this.selectRoof("rafter", i));
                    }

                    // colours: getObjectMaterial(…, true) gives the UUID of that clone's own material copy
                    // (cloneMaterials), so setMaterialColor changes only that one LED
                    if (profile == "ledStrip") {
                        if (rafters[i].ledStrip && !isSelected)
                            setMaterialColor(getObjectMaterial(this.ledStripCache[i], 1, true), 'Color', 0, 0, 0, rafters[i].ledStrip);
                        this.ledStripCount++;
                    }

                    // LED spots: positions measured from the rear edge (y = -depth / 2)
                    if (profile == "ledSpot") {
                        const positions = Array.isArray(rafters[i].ledSpot.positions) ? rafters[i].ledSpot.positions : [];
                        for (const position of positions) {
                            const spot = isSelected
                                ? getCachedClone(this.selectedLedSpotCache, selectedSpotIndex++, "Horizontal_Ledspot_Selected.0", this.anchor)
                                : getCachedClone(this.ledSpotCache, spotIndex++, "Horizontal_Ledspot.0", this.anchor, undefined, true);
                            setObjTransform(spot, false, "position", [x, -this.depth / 2 + mm(num(position, 0)), this.totalHeight], false);
                            registerClickable(spot, () => this.selectRoof("rafter", i));
                            if (rafters[i].ledSpot.color && !isSelected)   // the spot's 2nd material is Light_emit (1st: Rubber)
                                setMaterialColor(getObjectMaterial(spot, 2, true), 'Color', 0, 0, 0, rafters[i].ledSpot.color);
                            this.ledSpotCount++;
                        }
                    }
                }

                hideCachedClones(this.rafterCache, rafters.length);
                hideCachedClones(this.ledStripCache, rafters.length);
                hideCachedClones(this.ledSpotProfileCache, rafters.length);
                hideCachedClones(this.noLedStripCache, rafters.length);
                hideCachedClones(this.ledSpotCache, spotIndex);
                hideCachedClones(this.selectedLedSpotCache, selectedSpotIndex);
            }

            // One panel per roof filling, between the rafters. A filling's position is its centre, measured from the
            // section's left edge like the rafters. Until the configurator sends the real panel widths (Team questions),
            // the outer panels are trimmed to the side beams' inner face (0.19 m in, as legacy). Glass panels get their own material copy, so clear
            // and opal panels can sit side by side. sandwichPanelTile has no mesh yet and uses the anthracite panel.
            enableRoofFillings(fillings) {
                const depthMorph = ((this.depth - 2 * 0.15) - 1) / 100;
                const meshes = [
                    { types: ["glassClear", "glassOpal"], cache: this.glassCache, template: "Horizontal_Roof_Glass_Front.0", cloneMaterials: true },
                    { types: ["plastic", "plasticOpal", "plasticSunBlocking"], cache: this.plasticCache, template: "Horizontal_Roof_Plastic_Front.0" },
                    { types: ["sandwichPanelWhite"], cache: this.sandwichWhiteCache, template: "Horizontal_Roof_Sandwich_Panel_White_Front.0" },
                    { types: ["sandwichPanelAnthracite", "sandwichPanelTile"], cache: this.sandwichAnthraciteCache, template: "Horizontal_Roof_Sandwich_Panel_Anthracite_Front.0" },
                ];

                hideCachedClones(this.selectedFillingCache, 0);
                for (let i = 0; i < fillings.length; i++) {
                    const centre = this.width / 2 - mm(num(fillings[i].position, 0));
                    const halfWidth = mm(num(fillings[i].width, 1000)) / 2;
                    const inside = this.width / 2 - 0.19;
                    const left = Math.min(centre + halfWidth, inside);    // +X edge
                    const right = Math.max(centre - halfWidth, -inside);
                    const x = (left + right) / 2;
                    const widthMorph = (Math.max(left - right, 0) - 1) / 100;

                    for (const m of meshes) {
                        if (!m.types.includes(fillings[i].type)) {
                            changeVis(m.cache[i], false);   // this filling may have had another type before
                            continue;
                        }
                        const panel = getCachedClone(m.cache, i, m.template, this.anchor, undefined, m.cloneMaterials);
                        setObjTransform(panel, false, "position", [x, 0, this.totalHeight], false);
                        setMorphFactor(panel, 'Depth', depthMorph);
                        setMorphFactor(panel, 'Width', widthMorph);
                        registerClickable(panel, () => this.selectRoof("filling", i));
                    }

                    // the selected filling: the highlight panel over it
                    if (i == this.selectedFilling) {
                        const highlight = getCachedClone(this.selectedFillingCache, 0, "Horizontal_Roof_Selected_Front.0", this.anchor);
                        setObjTransform(highlight, false, "position", [x, 0, this.totalHeight], false);
                        setMorphFactor(highlight, 'Depth', depthMorph);
                        setMorphFactor(highlight, 'Width', widthMorph);
                        registerClickable(highlight, () => this.selectRoof("filling", i));
                    }

                    // glass look: clear or opal, on this panel's own material copy (by UUID, see the LEDs)
                    if (fillings[i].type == "glassClear") {
                        setMaterialValue(getObjectMaterial(this.glassCache[i], 1, true), 'NoGlass', 0);
                        setMaterialValue(getObjectMaterial(this.glassCache[i], 1, true), 'Tint', 0);
                    } else if (fillings[i].type == "glassOpal") {
                        setMaterialValue(getObjectMaterial(this.glassCache[i], 1, true), 'NoGlass', 0);
                        setMaterialValue(getObjectMaterial(this.glassCache[i], 1, true), 'Tint', 0.6);
                    }
                }

                for (const m of meshes)
                    hideCachedClones(m.cache, fillings.length);
            }

            // One horizontal screen over the section ("its width IS the section width"), centred, with its depth
            // supports spread between the front and rear beams. A click opens / closes it (toggleHorizontalScreen).
            enableHorizontalScreen(screen) {
                const types = [
                    { type: "zipper", screen: "Horizontal screen zipper top.0", supports: "Horizontal screen zipper top depth supports.0" },
                    { type: "nonZipper", screen: "Horizontal screen non zipper top.0", supports: "Horizontal screen non zipper top depth supports.0" },
                    { type: "bottomZipper", screen: "Horizontal screen bottom.0", supports: "Horizontal screen bottom depth supports.0" },
                ];
                const widthMorph = (this.width - 1) / 100;
                // about one support per metre of depth, plus the two end ones, kept 0.2 m clear of the beams
                const supportAmount = Math.round(this.depth - 0.001) + 2;
                this.activeScreen = null;

                for (let t = 0; t < types.length; t++) {
                    if (!screen || screen.type != types[t].type) {
                        changeVis(this.screenCache[t], false);
                        hideCachedClones(this.screenSupportCache[t], 0);
                        continue;
                    }

                    const name = getCachedClone(this.screenCache, t, types[t].screen, this.anchor);
                    setObjTransform(name, false, "position", [0, 0, this.totalHeight], false);
                    setMorphFactor(name, 'Width', widthMorph);
                    setMorphFactor(name, 'Depth', (this.depth - 1) / 100);
                    // the fabric rolls up over the depth minus 0.25 m (the bottom screen also minus the corner posts), as legacy
                    this.screenOpeningMorph = ((this.depth - 0.25 - (types[t].type == "bottomZipper" ? 2 * 0.15 : 0)) / 99) / 100;
                    this.activeScreen = name;
                    this.setHorizontalScreenOpening();
                    registerClickable(name, () => this.toggleHorizontalScreen());

                    for (let i = 0; i < supportAmount; i++) {
                        const y = 0.2 + 0.15 + ((this.depth - 2 * 0.15 - 0.4) / (supportAmount - 1) * i);   // from the rear edge
                        const support = getCachedClone(this.screenSupportCache[t], i, types[t].supports, this.anchor);
                        setObjTransform(support, false, "position", [0, y - this.depth / 2, this.totalHeight], false);
                        setMorphFactor(support, 'Width', widthMorph);
                    }
                    hideCachedClones(this.screenSupportCache[t], supportAmount);
                }

                // fabric colours (one shared material: there is one screen)
                if (screen && Array.isArray(screen.screenColor)) {
                    const colors = screen.screenColor;
                    setMaterialColor('ScreenFabricHorizontal', 'Color 1', 0, 0, 0, colors[0]);
                    setMaterialColor('ScreenFabricHorizontal', 'Color 2', 0, 0, 0, colors[1] || colors[0]);
                    setMaterialColor('ScreenFabricHorizontal', 'Color 3', 0, 0, 0, colors[2] || colors[0]);
                }
            }

            // Clicked in 3D: roll the horizontal screen open or shut (toggleOpening).
            toggleHorizontalScreen() {
                if (this.activeScreen)
                    toggleOpening(this.screenState, () => this.setHorizontalScreenOpening());
            }

            setHorizontalScreenOpening() {
                if (this.activeScreen)
                    setMorphFactor(this.activeScreen, 'Opening', this.screenOpeningMorph * this.screenState.opening);
            }

            // Select a filling or rafter (type "filling" | "rafter", or null for none) and rebuild to show it.
            // Nothing goes to the configurator here: its own focus comes in through this too.
            select(type, index) {
                const rafter = type == "rafter" ? index : -1;
                const filling = type == "filling" ? index : -1;
                if (rafter == this.selectedRafter && filling == this.selectedFilling)
                    return;
                this.selectedRafter = rafter;
                this.selectedFilling = filling;
                if (this.section)
                    this.enable(this.section);
            }

            // Clicked in 3D: select it (only here) and open its group in the configurator ("filling_group~2").
            selectRoof(type, index) {
                for (let i = 0; i < sceneParameters.structureSections.length; i++)
                    if (structureSectionCache[i] !== this)
                        structureSectionCache[i].select(null, -1);
                this.select(type, index);
                getJSFunction('focus')({ uniqueLabel: type + '_group~' + index });
            }

            // The four gutter beams on top of the poles. They span between the corner poles (0.15 m each).
            enableCrown() {
                const beams = [
                    { template: "Horizontal_Gutter_Front.0", position: [0, this.depth / 2, this.totalHeight], length: this.width },
                    { template: "Horizontal_Gutter_Rear.0", position: [0, -this.depth / 2, this.totalHeight], length: this.width },
                    { template: "Horizontal_Gutter_Left.0", position: [this.width / 2, 0, this.totalHeight], length: this.depth },
                    { template: "Horizontal_Gutter_Right.0", position: [-this.width / 2, 0, this.totalHeight], length: this.depth },
                ];

                for (let i = 0; i < beams.length; i++) {
                    const beam = getCachedClone(this.crownBeamCache, i, beams[i].template, this.anchor);
                    if (!beam)
                        continue;
                    const widthMorph = ((beams[i].length - 2 * 0.15) - 1) / 100;
                    setObjTransform(beam, false, "position", beams[i].position, false);
                    setMorphFactor(beam, 'Width', widthMorph);

                }
            }
        }
        //#endregion ---------------------------------------------------------------

        //#region SideOpening ---------------------------------------------------------------
        // One per _3d_SideOpenings[] entry: the poles of that side and, per bay, what it holds.
        // Its anchor (a clone of empty.0) sits on the side's start point, turned so local X runs along the side
        // (left -> right seen from outside) and local Y points inward. Positions below are local.

        // A bay option on the builtIn (integrated) layer.
        function isBuiltIn(option) {
            return Boolean(option) && option.mounting == "builtIn";
        }

        // A bay's centre along its side, in mm.
        function bayPosition(bay) {
            return num(toObject(bay.generalSpecs).position, 0);
        }

        // The point `distance` mm along a side from its start (in mm, world X / Y).
        function sidePoint(side, distance) {
            const angle = side.rotation * Math.PI / 180;   // left 0: along +Y, front 270: along -X
            return [side.xPos + Math.sin(angle) * distance, side.yPos + Math.cos(angle) * distance];
        }

        class SideOpening {
            constructor() {
                this.anchor = cloneObject("empty.0");
                if (!this.anchor)
                    console.warn('[Calista 3D] "empty.0" is not in the scene, the side cannot be placed');
                this.cornerPoleCache = [];        // per pole, one of these two posts
                this.intermediatePoleCache = [];
                this.bracketCache = [];     // per pole, its support: a bracket or a foundation
                this.foundationCache = [];

                // the crown frame: on top of the side, turned like the front beam the crown accessories are modelled on
                this.crownAnchor = cloneObject("empty.0");
                makeParent(this.crownAnchor, this.anchor);
                this.railPlugCache = [];    // per bay, in the crown above it
                this.ledStripCache = [];
                this.ledPlugCache = [];
                this.verticalSunblindCache = [];   // per bay, a builtIn vertical sunblind
                this.wallCrownCache = [];          // per bay, the fixed wall's top piece in the crown
                // the fixed walls' parts, all bays of the side together (see enableFixedWalls)
                this.wallCaches = { glass: [], white: [], anthracite: [], top: [], bottom: [], start: [], mid: [], end: [], doorway: [],
                    exterior: [], interior: [], frame: [], woodEnd: [] };
                this.woodCuts = [];          // the cut last boards: { name, key } (see cutBoard)
                this.woodCutSourceCache = [];   // the uncut board and the cutter a cut is made from
                this.woodCutterCache = [];
                this.climaglidePanelCache = [];        // all bays of the side together
                this.climaglideBottomRailCache = [];   // per track
                this.climaglideTopRailCache = [];
                this.climaglideMainRailCache = [];     // per bay
                this.climaglideFoundationCache = [];   // per bay
                // per panel: its side profile (outer panels), brush profiles and handle
                this.climaglidePartCaches = { sideLeft: [], sideRight: [], aluLeft: [], aluRight: [], pvcLeft: [], pvcRight: [], handle: [] };

                // per bay, opened / closed by a click (toggleOpening): kept between configurator changes
                this.sunblindStates = [];
                this.sunblindOpeningMorphs = [];
                this.climaglideStates = [];
                this.climaglideLayouts = [];   // per bay, per panel: { panel, closed, open, y } (setClimaglideOpening)
            }

            enable(side) {
                this.side = side;   // to find the neighbouring sides (poleRails)
                this.length = mm(side.length);
                setObjTransform(this.anchor, false, "position", [mm(side.xPos), mm(side.yPos), 0], false);
                setObjTransform(this.anchor, false, "rotation", [0, 0, 90 - side.rotation], false);   // left 0 -> X along +Y
                setObjTransform(this.crownAnchor, false, "position", [0, 0, mm(side.height) + 0.26], false);   // top of the crown, like the beams
                setObjTransform(this.crownAnchor, false, "rotation", [0, 0, 180], false);
                this.enablePoles(side.poles);
                this.enableCrownAccessories(side.bays);
                this.enableVerticalSunblinds(side.bays);
                this.enableFixedWalls(side.bays);
                this.enableClimaglides(side.bays);
            }

            // Climaglide (sliding glass doors, surface mounted): per bay `panelAmount` panels side by side over the clear
            // span, closed for now. Each panel runs in a track: the first 58 mm inside the side line, every next one 20 mm
            // further in (legacy). Panels open to the left (the bay's start), the right, or both ways from the middle; the
            // panels that stay put run in the outer track. Per track a bottom and a top rail, and one top main rail over
            // them all. The parts are modelled along X like the front beam, so they are turned 180° (the main rail 0°).
            // All panels are the same width: neighbours overlap 30 mm (the halves of a middle door meet without overlap)
            // and the outer panels end at the bay's ends, so open panels stack exactly. Per panel: a side profile on the
            // outer panels (sideProfile), a brush profile (draftProfile alu / pvc) on each edge that slides past another
            // panel, and a handle 0.1 m from the leading edge of the panels that open. Brushes and handles hang under
            // their panel, so they move with it. The template's Left is the side's +X (towards the bay's end).
            enableClimaglides(bays) {
                const partTemplates = {
                    sideLeft: "Climaglide side profile Left.0", sideRight: "Climaglide side profile Right.0",
                    aluLeft: "Climaglide brush profile Alu Left.0", aluRight: "Climaglide brush profile Alu Right.0",
                    pvcLeft: "Climaglide brush profile PVC Left.0", pvcRight: "Climaglide brush profile PVC Right.0",
                    handle: "Climaglide_Manipulator.0",
                };
                let panelCount = 0, railCount = 0;
                for (let i = 0; i < bays.length; i++) {
                    const glide = bays[i].climaglide;
                    if (!glide) {
                        changeVis(this.climaglideMainRailCache[i], false);
                        changeVis(this.climaglideFoundationCache[i], false);
                        continue;
                    }
                    const bay = toObject(bays[i].generalSpecs);
                    const span = mm(num(bay.length, 1000));
                    const centre = mm(num(bay.position, 0));
                    const height = mm(num(bay.height, 2500)) + 0.01;   // up into the crown, as legacy
                    const amount = Math.max(1, Math.round(num(glide.panelAmount, 2)));
                    const direction = ["left", "right", "middle"].includes(glide.openingDirection) ? glide.openingDirection : "left";
                    const tracks = direction == "middle" ? Math.ceil(amount / 2) : amount;
                    const trackY = t => 0.058 + t * 0.02;

                    for (let t = 0; t < tracks; t++) {
                        const bottom = getCachedClone(this.climaglideBottomRailCache, railCount, "Climaglide_Rails_Bottom.0", this.anchor);
                        const top = getCachedClone(this.climaglideTopRailCache, railCount++, "Climaglide_Rails_Top.0", this.anchor);
                        setObjTransform(bottom, false, "position", [centre, trackY(t), 0], false);
                        setObjTransform(top, false, "position", [centre, trackY(t), height], false);
                        for (const rail of [bottom, top]) {
                            setObjTransform(rail, false, "rotation", [0, 0, 180], false);
                            setMorphFactor(rail, 'Width', (span - 1) / 99);
                        }
                    }
                    const main = getCachedClone(this.climaglideMainRailCache, i, "Climaglide_Rails_Top_Main.0", this.anchor);
                    setObjTransform(main, false, "position", [centre, trackY(0), height], false);
                    setObjTransform(main, false, "rotation", [0, 0, 0], false);
                    setMorphFactor(main, 'Width', (span - 1) / 99);
                    setMorphFactor(main, 'panelAmount', tracks - 1);
                    if (glide.foundationProfile) {
                        const foundation = getCachedClone(this.climaglideFoundationCache, i, "Climaglide foundation profile.0", this.anchor);
                        setObjTransform(foundation, false, "position", [centre, trackY(0), 0], false);
                        setObjTransform(foundation, false, "rotation", [0, 0, 0], false);
                        setMorphFactor(foundation, 'Width', (span - 1) / 99);
                        setMorphFactor(foundation, 'panelAmount', tracks - 1);
                    }
                    else
                        changeVis(this.climaglideFoundationCache[i], false);
                    const overlaps = direction == "middle" ? amount - 2 : amount - 1;
                    const panelWidth = (span + overlaps * 0.03) / amount;
                    const pitch = panelWidth - 0.03;   // from one panel to the next
                    // panel k's centre, closed: from the bay's start (a middle door's 2nd half from its end)
                    const closedX = k => direction == "middle" && k >= amount / 2
                        ? centre + span / 2 - panelWidth / 2 - (amount - 1 - k) * pitch
                        : centre - span / 2 + panelWidth / 2 + k * pitch;
                    const draft = glide.draftProfile == "pvc" ? "pvc" : glide.draftProfile == "alu" ? "alu" : null;
                    // a click slides it open or closed: each panel between its closed place and where it parks when open
                    const state = this.climaglideStates[i] = this.climaglideStates[i] || openingState();
                    const layout = this.climaglideLayouts[i] = [];

                    for (let k = 0; k < amount; k++) {
                        const p = panelCount++;
                        const track = direction == "left" ? k : direction == "right" ? amount - 1 - k : Math.min(k, amount - 1 - k);
                        const x = closedX(k);
                        const firstHalf = k < amount / 2;
                        const panel = getCachedClone(this.climaglidePanelCache, p, "Climaglide_Panel.0", this.anchor, undefined, true);
                        // open, the panels stack at the side they open to (middle: each half at its own end)
                        const parkedAt = direction == "left" ? 0 : direction == "right" ? amount - 1 : firstHalf ? 0 : amount - 1;
                        layout.push({ panel: panel, closed: x, open: closedX(parkedAt), y: trackY(track) });
                        registerClickable(panel, () => toggleOpening(state, value => this.setClimaglideOpening(i, value)));
                        setObjTransform(panel, false, "rotation", [0, 0, 180], false);
                        setMorphFactor(panel, 'Width', (panelWidth - 0.1) / 100);
                        setMorphFactor(panel, 'Height', (height - 1) / 99);

                        // which of its parts this panel shows
                        const shows = {
                            sideRight: Boolean(glide.sideProfile) && k == 0,
                            sideLeft: Boolean(glide.sideProfile) && k == amount - 1,
                            // brush on the edge that slides past the next panel
                            Left: direction == "right" ? k != amount - 1 : direction == "middle" ? !firstHalf && k != amount - 1 : false,
                            Right: direction == "left" ? k != 0 : direction == "middle" ? firstHalf && k != 0 : false,
                        };
                        for (const part in this.climaglidePartCaches) {
                            const cache = this.climaglidePartCaches[part];
                            const brushSide = part.startsWith(draft) ? part.slice(draft.length) : null;
                            const handleX = this.climaglideHandleX(direction, k, amount, panelWidth);
                            const show = part == "handle" ? Boolean(glide.handle) && handleX !== null
                                : part.startsWith("side") ? shows[part] : Boolean(draft) && Boolean(brushSide) && shows[brushSide];
                            if (!show) {
                                changeVis(cache[p], false);
                                continue;
                            }
                            if (part.startsWith("side")) {   // fixed against the pole: not under the (sliding) panel
                                const profile = getCachedClone(cache, p, partTemplates[part], this.anchor);
                                setObjTransform(profile, false, "position", [x, trackY(track), 0], false);
                                setObjTransform(profile, false, "rotation", [0, 0, 180], false);
                                setMorphFactor(profile, 'Width', (panelWidth - 0.1) / 100);
                                setMorphFactor(profile, 'Height', (height - 1 - 0.052) / 99);
                                continue;
                            }
                            const child = getCachedClone(cache, p, partTemplates[part], panel);   // under the panel, in its frame
                            if (part == "handle") {
                                setObjTransform(child, false, "position", [handleX, 0, 0], false);
                                continue;
                            }
                            setMorphFactor(child, 'Width', (panelWidth - 0.1) / 100);
                            setMorphFactor(child, 'Height', (height - 1 - 0.052) / 99);
                        }
                        // glass: its 2nd material, on this panel's own copy (by UUID), opal as legacy
                        setMaterialValue(getObjectMaterial(panel, 2, true), 'NoGlass', 0);
                        setMaterialValue(getObjectMaterial(panel, 2, true), 'Tint', glide.glass == "glassOpal" ? 0.8 : 0);
                    }
                }
                hideCachedClones(this.climaglidePanelCache, panelCount);
                hideCachedClones(this.climaglideBottomRailCache, railCount);
                hideCachedClones(this.climaglideTopRailCache, railCount);
                hideCachedClones(this.climaglideMainRailCache, bays.length);
                hideCachedClones(this.climaglideFoundationCache, bays.length);
                for (const part in this.climaglidePartCaches)
                    hideCachedClones(this.climaglidePartCaches[part], panelCount);
                for (let i = 0; i < bays.length; i++)
                    if (bays[i].climaglide)
                        this.setClimaglideOpening(i, this.climaglideStates[i].opening);
            }

            // The Climaglide panels of bay i at `opening` (0 closed ... 100 open); their brushes and handles move with them.
            setClimaglideOpening(i, opening) {
                for (const l of this.climaglideLayouts[i] || [])
                    setObjTransform(l.panel, false, "position", [l.closed + (l.open - l.closed) * opening / 100, l.y, 0], false);
            }

            // Where panel k's handle sits, in the panel's own frame (turned 180°: its x runs back along the side), or null
            // when it has none: 0.1 m from the edge it is pulled by. Left: the last panel, at its end; right: the first,
            // at its start; middle: the two middle panels, where they meet (as legacy).
            climaglideHandleX(direction, k, amount, panelWidth) {
                const fromEdge = panelWidth / 2 - 0.1;
                if (direction == "left")
                    return k == amount - 1 ? -fromEdge : null;
                if (direction == "right")
                    return k == 0 ? fromEdge : null;
                if (k == amount / 2 - 1)
                    return -fromEdge;
                return k == amount / 2 ? fromEdge : null;
            }

            // BuiltIn fixed walls: each bay's partitions side by side, 26 mm inside the side line (legacy). The parts are
            // modelled for the left side (running along Y), so they are turned -90° into the side frame. A partition is
            // glass (clear / opal) or a sandwich panel between a top and a bottom profile, or an opening ("none") between
            // two doorway posts; where two partitions meet, a vertical profile (mid between two panels, else the panel's
            // start / end profile). The bay's ends need none: the pole rails hold the wall there.
            // Wood: an aluminium frame (in 0.675 m sections, as legacy) with 135 mm boards outside and / or inside, from the
            // partition's start; the last board is cut to end exactly at the partition's end (cutBoard), and a wood end
            // profile closes the wood where it meets something else.
            enableFixedWalls(bays) {
                const templates = {
                    glass: "Integrated wall_glass.0", white: "Integrated wall_sandwich panelWW.0", anthracite: "Integrated wall_sandwich panelAA.0",
                    top: "Integrated wall_top profile.0", bottom: "Integrated wall_bottom profile.0",
                    start: "Integrated wall_panel_start_profile.0", mid: "Integrated wall_panel_mid_profile.0", end: "Integrated wall_panel_end_profile.0",
                    doorway: "Integrated wall_doorway post.0",
                    exterior: "Integrated wall_wood_exterior.0", interior: "Integrated wall_wood_interior.0",
                    frame: "Integrated wall_wood_frame.0", woodEnd: "Integrated wall_wood_end_profile.0",
                };
                const woods = { woodOutside: ["exterior"], woodInside: ["interior"], woodBothSides: ["exterior", "interior"] };
                const board = 0.135, frameSection = 0.675;
                // the wood texture is in world space: boards along X (front, rear) need the grain turned
                const woodMaterial = this.side.rotation % 180 == 90 ? "Integrated wall wood 90" : "Integrated wall wood";
                this.woodCutCount = 0;
                const panels = { glassClear: "glass", glassOpal: "glass", sandwichPanelWhite: "white", sandwichPanelAnthracite: "anthracite" };
                const counts = {};
                for (const part in this.wallCaches)
                    counts[part] = 0;
                // the next clone of a part, placed at x along the side
                const place = (part, x) => {
                    const name = getCachedClone(this.wallCaches[part], counts[part]++, templates[part], this.anchor, undefined, part == "glass");
                    setObjTransform(name, false, "position", [x, 0.026, 0], false);
                    setObjTransform(name, false, "rotation", [0, 0, -90], false);
                    return name;
                };

                for (const bay of bays) {
                    if (!isBuiltIn(bay.fixedWall))
                        continue;
                    const heightMorph = (mm(num(toObject(bay.generalSpecs).height, 2500)) - 1) / 99;
                    const partitions = toArray(bay.fixedWall.partitions);

                    for (let k = 0; k < partitions.length; k++) {
                        const x = mm(num(partitions[k].position, 0));
                        const width = mm(num(partitions[k].width, 1000));
                        const lengthMorph = (width - 1) / 100;
                        const panel = panels[partitions[k].fillType];

                        if (panel) {
                            const name = place(panel, x);
                            setMorphFactor(name, 'Length', lengthMorph);
                            setMorphFactor(name, 'Height', heightMorph);
                            if (panel == "glass") {   // on this panel's own material copy (by UUID), opal as legacy
                                setMaterialValue(getObjectMaterial(name, 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(name, 1, true), 'Tint', partitions[k].fillType == "glassOpal" ? 0.8 : 0);
                            }
                            setMorphFactor(place("bottom", x), 'Length', lengthMorph);
                            const top = place("top", x);
                            setMorphFactor(top, 'Length', lengthMorph);
                            setMorphFactor(top, 'Height', heightMorph);
                        }
                        else if (woods[partitions[k].fillType]) {
                            const start = x - width / 2;
                            const full = Math.floor(width / board + 1e-6);
                            for (const face of woods[partitions[k].fillType]) {
                                for (let b = 0; b < full; b++) {
                                    const name = place(face, start + board / 2 + b * board);
                                    setMorphFactor(name, 'Height', heightMorph);
                                    assignMat(name, woodMaterial);
                                }
                                if (width - full * board > 0.001)
                                    this.cutBoard(templates[face], start + board / 2 + full * board, start + width, heightMorph, woodMaterial);
                            }
                            for (let f = 0; f * frameSection < width - 0.001; f++) {
                                const sectionWidth = Math.min(frameSection, width - f * frameSection);
                                const frame = place("frame", start + f * frameSection + sectionWidth / 2);
                                setMorphFactor(frame, 'Width', (sectionWidth - 1) / 99);
                                setMorphFactor(frame, 'Height', heightMorph);
                            }
                            setMorphFactor(place("bottom", x), 'Length', lengthMorph);
                            const top = place("top", x);
                            setMorphFactor(top, 'Length', lengthMorph);
                            setMorphFactor(top, 'Height', heightMorph);
                            // a wood end profile where the wood meets something else (or the bay's end)
                            if (!(k > 0 && woods[partitions[k - 1].fillType]))
                                setMorphFactor(place("woodEnd", start), 'Height', heightMorph);
                            if (!(k < partitions.length - 1 && woods[partitions[k + 1].fillType]))
                                setMorphFactor(place("woodEnd", start + width), 'Height', heightMorph);
                        }
                        else if (partitions[k].fillType == "none") {   // an opening: a doorway post on each inner edge
                            if (k > 0)
                                setMorphFactor(place("doorway", x - width / 2 + 0.01), 'Height', heightMorph);
                            if (k < partitions.length - 1)
                                setMorphFactor(place("doorway", x + width / 2 - 0.01), 'Height', heightMorph);
                        }

                        // where this partition meets the next one
                        if (k < partitions.length - 1) {
                            const before = Boolean(panel), after = Boolean(panels[partitions[k + 1].fillType]);
                            if (before || after)
                                setMorphFactor(place(before && after ? "mid" : before ? "end" : "start", x + width / 2), 'Height', heightMorph);
                        }
                    }
                }

                for (const part in this.wallCaches)
                    hideCachedClones(this.wallCaches[part], counts[part]);
                for (let c = this.woodCutCount; c < this.woodCuts.length; c++)
                    changeVis(this.woodCuts[c].name, false);
            }

            // The last board of a wood partition: a board at x, cut where the partition ends (makeObjectCSG, subtracting
            // Wood cut box.0, whose body lies behind its +X face: turned 180° it covers everything past the end). The cut
            // piece is a new object under the anchor; it is only made again when the cut changes, the old one removed.
            cutBoard(template, x, end, heightMorph, material) {
                const index = this.woodCutCount++;
                const key = [template, x, end, heightMorph, material].join('|');
                const cut = this.woodCuts[index];
                if (cut && cut.key == key && getObjectByName(cut.name)) {
                    changeVis(cut.name, true);
                    return;
                }
                if (cut && getObjectByName(cut.name)) {
                    const old = getObjectByName(cut.name);
                    old.traverse(obj => { if (obj.geometry) obj.geometry.dispose(); });
                    removeObject(old, cut.name);
                }

                const source = getCachedClone(this.woodCutSourceCache, 0, template, this.anchor);
                const cutter = getCachedClone(this.woodCutterCache, 0, "Wood cut box.0", this.anchor);
                if (!source || !cutter || !getObjectByName(this.anchor))
                    return;
                setObjTransform(source, false, "position", [x, 0.026, 0], false);
                setObjTransform(source, false, "rotation", [0, 0, -90], false);
                setMorphFactor(source, 'Height', heightMorph);
                assignMat(source, material);
                setObjTransform(cutter, false, "position", [end, 0.026, 0], false);
                setObjTransform(cutter, false, "rotation", [0, 0, 180], false);
                assignMat(cutter, material);   // the cut face takes the cutter's material
                getObjectByName(this.anchor).updateMatrixWorld(true);

                const name = this.anchor + ' wood cut ' + index;
                makeObjectCSG(name, 'SUBTRACT', source, cutter, false);
                changeVis([source, cutter], false);
                changeVis(name, true);
                this.woodCuts[index] = { name: name, key: key };
            }

            // A builtIn vertical sunblind hangs from the crown over its bay (in the rail groove) down to the ground; a click
            // rolls it up or down. Each one has its own material copies, so every bay can have its own fabric.
            enableVerticalSunblinds(bays) {
                for (let i = 0; i < bays.length; i++) {
                    const sunblind = bays[i].verticalSunblind;
                    if (!isBuiltIn(sunblind)) {
                        changeVis(this.verticalSunblindCache[i], false);
                        continue;
                    }
                    const bay = toObject(bays[i].generalSpecs);
                    const name = getCachedClone(this.verticalSunblindCache, i, "Horizontal_Gutter_Vertical sunblind.0", this.crownAnchor, undefined, true);
                    setObjTransform(name, false, "position", [-mm(num(bay.position, 0)), 0, 0], false);   // the crown frame is turned 180°
                    setMorphFactor(name, 'Width', (mm(num(bay.length, 1000)) - 1) / 100);
                    setMorphFactor(name, 'Height', mm(num(bay.height, 2500)) / 100);   // legacy: height under the gutter / 100
                    // a click rolls it up (100) or down (0). Height drops the bottom bar and Opening lifts it, both 100 m per
                    // unit; fully up, the bar stops just under the crown (50 mm short of its rest place in the beam), so it
                    // stays in sight and can be clicked to roll the sunblind down again
                    const state = this.sunblindStates[i] = this.sunblindStates[i] || openingState();
                    this.sunblindOpeningMorphs[i] = ((mm(num(bay.height, 2500)) - 0.05) / 100) / 100;
                    setMorphFactor(name, 'Opening', this.sunblindOpeningMorphs[i] * state.opening);
                    registerClickable(name, () => toggleOpening(state, value =>
                        setMorphFactor(this.verticalSunblindCache[i], 'Opening', this.sunblindOpeningMorphs[i] * value)));

                    // fabric: its 3rd material (1 Powdercoat, 2 Rubber), on this sunblind's own copy (by UUID)
                    const colors = Array.isArray(sunblind.screenColor) ? sunblind.screenColor : [];
                    if (colors[0])
                        for (let k = 0; k < 3; k++)
                            setMaterialColor(getObjectMaterial(name, 3, true), 'Color ' + (k + 1), 0, 0, 0, colors[k] || colors[0]);
                }
                hideCachedClones(this.verticalSunblindCache, bays.length);
            }

            // Per bay, in the crown beam's grooves over its span: the LED strip (builtIn, in its colour) or its plug, and the rail plug
            // unless a builtIn sunblind or fixed wall hangs there (a fixed wall has its own top piece in the groove). The crown frame is turned
            // 180°, so its x runs back along the side: x = -bay position.
            enableCrownAccessories(bays) {
                const accessories = [
                    { cache: this.ledStripCache, template: "Horizontal_Gutter_LED strip integrated.0", show: bay => isBuiltIn(bay.ledStrip), cloneMaterials: true },
                    { cache: this.ledPlugCache, template: "Horizontal_Gutter_LED strip integrated plug.0", show: bay => !isBuiltIn(bay.ledStrip) },
                    { cache: this.railPlugCache, template: "Horizontal_Gutter_Rail plug.0", show: bay => !isBuiltIn(bay.verticalSunblind) && !isBuiltIn(bay.fixedWall) },
                    { cache: this.wallCrownCache, template: "Horizontal_Gutter_Integrated wall.0", show: bay => isBuiltIn(bay.fixedWall) },
                ];

                this.ledStripCount = 0;   // for the roof light
                for (let i = 0; i < bays.length; i++) {
                    const bay = toObject(bays[i].generalSpecs);
                    const x = mm(num(bay.position, 0));
                    const widthMorph = (mm(num(bay.length, 1000)) - 1) / 100;
                    for (const a of accessories) {
                        if (!a.show(bays[i])) {
                            changeVis(a.cache[i], false);
                            continue;
                        }
                        const name = getCachedClone(a.cache, i, a.template, this.crownAnchor, undefined, a.cloneMaterials);
                        setObjTransform(name, false, "position", [-x, 0, 0], false);
                        setMorphFactor(name, 'Width', widthMorph);
                    }

                    // the LED strip's colour, on its own material copy (by UUID), like the rafter strips
                    if (isBuiltIn(bays[i].ledStrip)) {
                        if (bays[i].ledStrip.color)
                            setMaterialColor(getObjectMaterial(this.ledStripCache[i], 1, true), 'Color', 0, 0, 0, bays[i].ledStrip.color);
                        this.ledStripCount++;
                    }
                }

                for (const a of accessories)
                    hideCachedClones(a.cache, bays.length);
            }

            // Two posts: Pole_Corner.0 (corners; wallAdjacent too for now) and Pole_Intermediate.0. Both have their origin on
            // the outer face's corner and run along the side and inward from it; a corner at the end of a side is turned a
            // quarter to run back along the side. Each post is scaled from its modelled size to the pole's width x depth.
            // Rails: a corner's Along face looks into the side's bay, Inward into the neighbouring side's; an intermediate's
            // End face looks back at the bay before it, Start at the bay after it.
            enablePoles(poles) {
                const types = {
                    corner: { cache: this.cornerPoleCache, template: "Pole_Corner", size: [0.15, 0.15], faces: ["Along", "Inward"] },
                    intermediate: { cache: this.intermediatePoleCache, template: "Pole_Intermediate", size: [0.1, 0.13], faces: ["Start", "End"] },
                };
                const accessories = ["Integrated screen rail", "Integrated wall rail", "Rail plug"];

                for (let i = 0; i < poles.length; i++) {
                    const position = mm(num(poles[i].position, 0));
                    const width = mm(num(poles[i].width, 150));
                    const depth = mm(num(poles[i].depth, 150));
                    const kind = poles[i].type == "intermediate" ? "intermediate" : "corner";
                    const isEnd = kind == "corner" && position > this.length / 2;
                    // a corner post runs up through the crown (+ 0.26), an intermediate one clicks in under it
                    const height = mm(num(poles[i].length, 2500)) + (kind == "corner" ? 0.26 : 0);
                    const heightMorph = (height - 1) / 99;

                    const rails = this.poleRails(kind, isEnd, position);
                    for (const [type, t] of Object.entries(types)) {
                        if (type != kind) {
                            changeVis(t.cache[i], false);   // this pole may have been of the other type before
                            continue;
                        }
                        const pole = getCachedClone(t.cache, i, t.template + ".0", this.anchor);
                        if (!pole)
                            continue;
                        const scale = [width / t.size[0], depth / t.size[1], 1];
                        setObjTransform(pole, false, "position", [isEnd ? position + width / 2 : position - width / 2, 0, 0], false);
                        setObjTransform(pole, false, "rotation", [0, 0, isEnd ? 270 : 180], false);
                        setObjTransform(pole, false, "scale", isEnd ? [scale[1], scale[0], 1] : scale, false);
                        setMorphFactor(pole, 'Height', heightMorph);

                        // the rails on its faces: one per face, from the bay it looks into
                        for (const face of t.faces)
                            for (const accessory of accessories) {
                                const child = pole + ' > ' + t.template + '_' + face + '_' + accessory + '.0';
                                setMorphFactor(child, 'Height', heightMorph);
                                changeVis(child, accessory == rails[face]);
                            }
                    }
                    this.enablePoleSupport(i, poles[i].support, position, width, depth, isEnd);
                }

                hideCachedClones(this.cornerPoleCache, poles.length);
                hideCachedClones(this.intermediatePoleCache, poles.length);
                hideCachedClones(this.bracketCache, poles.length);
                hideCachedClones(this.foundationCache, poles.length);
            }

            // The rail each face of a pole shows: an integrated screen rail next to a builtIn vertical sunblind, a wall rail
            // next to a builtIn fixed wall, else the plug. An intermediate looks at the bays before (End) and after (Start) it; a corner looks into its side's
            // first / last bay and, with its other face, into the neighbouring side's bay at that corner.
            poleRails(kind, isEnd, position) {
                const bays = this.side.bays;
                const faces = kind == "intermediate" ? { End: this.bayNextTo(bays, position, -1), Start: this.bayNextTo(bays, position, 1) }
                    : isEnd ? { Inward: this.bayNextTo(bays, position, -1), Along: this.neighbourBay(true) }
                    : { Along: this.bayNextTo(bays, position, 1), Inward: this.neighbourBay(false) };
                const rails = {};
                for (const face in faces) {
                    const bay = faces[face];
                    rails[face] = bay && isBuiltIn(bay.verticalSunblind) ? "Integrated screen rail"
                        : bay && isBuiltIn(bay.fixedWall) ? "Integrated wall rail" : "Rail plug";
                }
                return rails;
            }

            // The nearest bay before (dir -1) or after (dir 1) a position on this side (m), or null.
            bayNextTo(bays, position, dir) {
                let nearest = null;
                for (const bay of bays) {
                    const distance = (mm(bayPosition(bay)) - position) * dir;
                    if (distance > 0 && (!nearest || distance < nearest.distance))
                        nearest = { bay: bay, distance: distance };
                }
                return nearest ? nearest.bay : null;
            }

            // The bay of the neighbouring side at this side's start (its last bay) or end (its first bay): the side
            // that ends where this one starts, or starts where this one ends.
            neighbourBay(atEnd) {
                const corner = sidePoint(this.side, atEnd ? this.side.length : 0);
                for (const other of sceneParameters.sideOpenings) {
                    const touch = sidePoint(other, atEnd ? 0 : other.length);
                    if (other === this.side || Math.hypot(touch[0] - corner[0], touch[1] - corner[1]) > 1 || !other.bays.length)
                        continue;
                    const sorted = other.bays.slice().sort((a, b) => bayPosition(a) - bayPosition(b));
                    return atEnd ? sorted[0] : sorted[sorted.length - 1];
                }
                return null;
            }

            // The footing under pole i: a bracket (bracketUnder: 0.1 m lower, as legacy), a foundation, or none.
            // Both are modelled like a corner post at its origin, running along +X and inward (+Y), so the
            // support of an end pole is turned a quarter to run back along the side (legacy: one rotation per corner).
            enablePoleSupport(i, type, position, width, depth, isEnd) {
                const supports = [
                    { types: ["bracket", "bracketUnder"], cache: this.bracketCache, template: "Post bracket.0" },
                    { types: ["foundation"], cache: this.foundationCache, template: "Post foundation.0" },
                ];
                for (const sp of supports) {
                    if (!sp.types.includes(type)) {
                        changeVis(sp.cache[i], false);
                        continue;
                    }
                    const support = getCachedClone(sp.cache, i, sp.template, this.anchor);
                    if (!support)
                        continue;
                    setObjTransform(support, false, "position", [isEnd ? position + width / 2 : position - width / 2, 0, type == "bracketUnder" ? -0.1 : 0], false);
                    setObjTransform(support, false, "rotation", [0, 0, isEnd ? 90 : 0], false);
                    setObjTransform(support, false, "scale", isEnd ? [depth / 0.15, width / 0.15, 1] : [width / 0.15, depth / 0.15, 1], false);
                }
            }
        }
        //#endregion ---------------------------------------------------------------

        //#region Measurements ---------------------------------------------------------------
        // As legacy, on the GLB's own measurement objects: width and depth on the ground, the highest point and the
        // walk-through height at the front corners, and with a horizontal screen its height at the front and the back.
        // Each label exists twice (Text / TextFlipped), back to back; both are shown and, with only their front face kept
        // (keepTextFront), their material's backface culling leaves the one facing the camera.
        function enableMeasurements() {
            const shown = measurementsShown || measurementsInStep;
            const W = mm(sceneParameters.widthTotal), D = mm(sceneParameters.depthTotal);
            const sections = sceneParameters.structureSections;
            const H = Math.max(0, ...sections.map(section => mm(section.heightUnderGutter))) + 0.26;   // top of the crown
            const screen = sections.length && sections[0].horizontalScreen ? sections[0].horizontalScreen.type : null;
            const screenHeight = { zipper: { front: H + 0.07, back: H + 0.145 }, nonZipper: { front: H + 0.138, back: H + 0.138 },
                bottomZipper: { front: H - 0.075, back: H - 0.16 } }[screen];
            const bars = [
                { name: "widthMeasurement" }, { name: "depthMeasurement" }, { name: "highestPointMeasurement" }, { name: "WalkThroughHeightMeasurement" },
                { name: "HorizontalScreenHeightMeasurement", screen: true }, { name: "HorizontalScreenFrontMeasurement", screen: true },
            ];
            for (const bar of bars)
                changeVis([bar.name, bar.name + "Text", bar.name + "TextFlipped"], shown && (!bar.screen || Boolean(screenHeight)));
            if (!shown)
                return;

            const label = (name, metres) => {
                updateTextObj([name + "Text", name + "TextFlipped"], Math.round(metres * 1000) + "mm");
                keepTextFront(name + "Text");
                keepTextFront(name + "TextFlipped");
            };
            setMorphFactor("widthMeasurement", 'Width', (W - 1) / 99);
            setObjTransform("widthMeasurement", false, "position", ['', D, ''], false);
            setObjTransform(["widthMeasurementText", "widthMeasurementTextFlipped"], false, "position", ['', '', -0.15], false);
            label("widthMeasurement", W);

            setMorphFactor("depthMeasurement", 'Depth', (D - 1) / 99);
            setObjTransform("depthMeasurement", false, "position", [W / 2, 0, ''], false);
            setObjTransform(["depthMeasurementText", "depthMeasurementTextFlipped"], false, "position", [W / 2, D / 2, -0.15], false);
            label("depthMeasurement", D);

            setMorphFactor("highestPointMeasurement", 'Height', (H - 1) / 99);
            setObjTransform("highestPointMeasurement", false, "position", [W / 2, D, ''], false);
            setObjTransform(["highestPointMeasurementText", "highestPointMeasurementTextFlipped"], false, "position", [W / 2 + 0.57, D, H / 2], false);
            label("highestPointMeasurement", H);

            setMorphFactor("WalkThroughHeightMeasurement", 'Height', (H - 0.26 - 1) / 99);
            setObjTransform("WalkThroughHeightMeasurement", false, "position", [-W / 2 + 0.15, D, ''], false);
            setObjTransform(["WalkThroughHeightMeasurementText", "WalkThroughHeightMeasurementTextFlipped"], false, "position", ['', '', H / 2], false);
            label("WalkThroughHeightMeasurement", H - 0.26);

            if (screenHeight) {
                setMorphFactor("HorizontalScreenHeightMeasurement", 'Height', (screenHeight.back - 1) / 99);
                setObjTransform("HorizontalScreenHeightMeasurement", false, "position", [W / 2, '', ''], false);
                setObjTransform("HorizontalScreenHeightMeasurementText", false, "position", ['', '', H / 2], false);
                setObjTransform("HorizontalScreenHeightMeasurementTextFlipped", false, "position", ['', '', (H + 0.15) / 2], false);
                label("HorizontalScreenHeightMeasurement", screenHeight.back);

                setMorphFactor("HorizontalScreenFrontMeasurement", 'Height', (screenHeight.front - 1) / 99);
                setObjTransform("HorizontalScreenFrontMeasurement", false, "position", [W / 2, D, ''], false);
                setObjTransform(["HorizontalScreenFrontMeasurementText", "HorizontalScreenFrontMeasurementTextFlipped"], false, "position", ['', '', screenHeight.front / 2], false);
                label("HorizontalScreenFrontMeasurement", screenHeight.front);
            }

            // the focused dimension field's bar lights up
            setMaterialValue("Measurements_Width", "Value", measurementField == "width_field" ? 1 : 0);
            setMaterialValue("Measurements_Depth", "Value", measurementField == "depth_field" ? 1 : 0);
            setMaterialValue("Measurements_Height", "Value", measurementField == "height_field" ? 1 : 0);
        }

        // updateTextObject puzzle
        function updateTextObj(objSelector, text) {
            const objNames = retrieveObjectNames(objSelector);

            for (let i = 0; i < objNames.length; i++) {
                const objName = objNames[i];
                if (!objName) continue;
                const obj = getObjectByName(objName);
                if (!obj || !obj.geometry || !obj.geometry.cloneWithText)
                    continue;
                const textGeom = obj.geometry;
                obj.geometry = textGeom.cloneWithText(String(text));
                textGeom.dispose();
            }
        }
        //#endregion ---------------------------------------------------------------

        //#region Scene
        function enableScene() {
            clearScene();
            changeVis("Gizmo", true);        // marks the scene origin
            changeVis("Sun_modern", true);   // clearScene hides the lights too

            const sections = sceneParameters.structureSections;
            for (let i = 0; i < sections.length; i++) {
                if (!structureSectionCache[i])
                    structureSectionCache[i] = new StructureSection();
                structureSectionCache[i].enable(sections[i]);
            }

            const sides = sceneParameters.sideOpenings;
            for (let i = 0; i < sides.length; i++) {
                if (!sideOpeningCache[i])
                    sideOpeningCache[i] = new SideOpening();
                sideOpeningCache[i].enable(sides[i]);
            }
            enableLighting();
            enableMeasurements();
            // outside frame colour: every profile shares the Powdercoat material
            setMaterialColor("Powdercoat", "RGB", 0, 0, 0, sceneParameters.colorOutside);
        }

        // LEDs in the roof or in the crown turn on the Spot light under the roof and dim the sun (as legacy changeWorldLightForLED).
        function enableLighting() {
            const section = sceneParameters.structureSections.length ? structureSectionCache[0] : null;
            let strips = section ? section.ledStripCount : 0;
            const spots = section ? section.ledSpotCount : 0;
            for (let i = 0; i < sceneParameters.sideOpenings.length; i++)   // + the LED strips in the crown, per bay
                strips += sideOpeningCache[i].ledStripCount;
            const anyLed = strips + spots > 0;

            if (section)
                setObjTransform("Spot", false, "position", [section.xPos, section.yPos, section.totalHeight - 0.2], false);
            lightIntensity("Spot", anyLed ? 6 + strips * 2.5 + spots * 0.5 : 0);
            changeVis("Spot", anyLed);
            lightIntensity("Sun_modern", anyLed ? 0 : 4);
        }
        function lightIntensity(lightName, intensity) {
            var areaLight = getObjectByName(lightName);
            if (!areaLight) {
                console.warn('light intensity: object not found:=>', lightName);
                return;
            }
            areaLight.intensity = intensity;
        }

        // Hide every object. The scene root is skipped by identity: in the GLB it is called "glid", not "Scene".
        // (In Verge3D a hidden parent does NOT hide its children, so every object is hidden one by one.)
        // A click on nothing clickable closes the open roof group ("filling_group~-1").
        function clearRoofSelection() {
            for (let i = 0; i < sceneParameters.structureSections.length; i++) {
                const section = structureSectionCache[i];
                if (section.selectedFilling != -1)
                    getJSFunction('focus')({ uniqueLabel: 'filling_group~-1' });
                if (section.selectedRafter != -1)
                    getJSFunction('focus')({ uniqueLabel: 'rafter_group~-1' });
                section.select(null, -1);
            }
        }

        function clearScene() {
            const objList = getAllObjectNames();
            for (let i = 0; i < objList.length; i++)
                if (getObjectByName(objList[i]) !== appInstance.scene)
                    changeVis(objList[i], false);
        }
        //#endregion

        //#region Entry
        setCameraOptions();
        getParameters();
        enableScene();
        initClicks();
        takeSnapshot();

        if (!sceneIsInitialized) {
            // the configurator's loader bar
            for (let i = 0; i <= 100; i++) {
                setTimeout(() => {
                    getJSFunction('getLoadPercentageFrom3D')(i);
                }, i);
            }
            sceneIsInitialized = true;
        }
        else
            getJSFunction('getLoadPercentageFrom3D')(100);
        //#endregion
    }
}

//#region DEV_SCOPES
// Bundled example scopes for DEV_SCOPE, copied from examples_source_files/input_example_*_h_roof.js
// (the tests check they still match). Remove together with DEV_SCOPE once the configurator sends the contract.
const DEV_SCOPES = {
    freestanding: {
        "_3d_screenshotName": "Calista_freestanding",
        "_3d_conservatoryStructure": "freeStanding",
        "_3d_widthTotal": 6000,
        "_3d_depthTotal": 4000,
        "_3d_walls": { "front": false, "right": false, "rear": false, "left": false },
        "_3d_colorOutside": "#293133",
        "_3d_StructureSections": [
            {
                "width": 6000,
                "depth": 4000,
                "xPos": 0,
                "yPos": 2000,
                "heightUnderGutter": 2500,
                "sectionName": "Section_1",
                "adjacentSections": { "left": null, "right": null },
                "roofOptions": {
                    "horizontalScreen": { "type": "zipper", "screenColor": ["#D9D4C7", "#D9D4C7", "#D9D4C7"], "motorSide": "right" },
                    "roofFillings": [
                        { "position": 500, "width": 1000, "type": "glassClear" },
                        { "position": 1500, "width": 1000, "type": "glassClear" },
                        { "position": 2500, "width": 1000, "type": "glassOpal" },
                        { "position": 3500, "width": 1000, "type": "glassOpal" },
                        { "position": 4500, "width": 1000, "type": "glassClear" },
                        { "position": 5500, "width": 1000, "type": "glassClear" }
                    ],
                    "rafters": [
                        {
                            "position": 1000,
                            "ledSpot": { "positions": [1000, 2000, 3000], "color": "#02b973" },
                            "ledStrip": null
                        },
                        { "position": 2000, "ledSpot": null, "ledStrip": null },
                        { "position": 3000, "ledSpot": null, "ledStrip": "#c0159b" },
                        { "position": 4000, "ledSpot": null, "ledStrip": null },
                        {
                            "position": 5000,
                            "ledSpot": { "positions": [1000, 2000, 3000], "color": "#ece10a" },
                            "ledStrip": null
                        }
                    ]
                }
            }
        ],
        "_3d_SideOpenings": [
            {
                "sideSpecs": {
                    "xPos": 3000,
                    "yPos": 4000,
                    "rotation": 270,
                    "length": 6000,
                    "height": 2500,
                    "poleAmount": 3,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "corner",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 0
                    },
                    {
                        "type": "intermediate",
                        "position": 3000,
                        "width": 100,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 1
                    },
                    {
                        "type": "corner",
                        "position": 5925,
                        "width": 150,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 2
                    }
                ],
                "bays": [
                    {
                        "generalSpecs": { "position": 1550, "length": 2800, "height": 2500 },
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 4,
                            "openingDirection": "middle",
                            "handle": true,
                            "sideProfile": true,
                            "foundationProfile": true,
                            "draftProfile": "alu",
                            "glass": "glassClear"
                        },
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom100",
                            "screenColor": ["#7A7A7A", "#7A7A7A", "#7A7A7A"],
                            "solar": false,
                            "window": null
                        },
                        "fixedWall": null,
                        "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" }
                    },
                    {
                        "generalSpecs": { "position": 4450, "length": 2800, "height": 2500 },
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 3,
                            "openingDirection": "right",
                            "handle": true,
                            "sideProfile": false,
                            "foundationProfile": true,
                            "draftProfile": "alu",
                            "glass": "glassClear"
                        },
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom100",
                            "screenColor": ["#7A7A7A", "#7A7A7A", "#7A7A7A"],
                            "solar": false,
                            "window": null
                        },
                        "fixedWall": null,
                        "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" }
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -3000,
                    "yPos": 0,
                    "rotation": 90,
                    "length": 6000,
                    "height": 2500,
                    "poleAmount": 3,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "corner",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 0
                    },
                    {
                        "type": "intermediate",
                        "position": 3000,
                        "width": 100,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 1
                    },
                    {
                        "type": "corner",
                        "position": 5925,
                        "width": 150,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 2
                    }
                ],
                "bays": [
                    {
                        "generalSpecs": { "position": 1550, "length": 2800, "height": 2500 },
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [
                                { "position": 850, "width": 1400, "height": 2500, "fillType": "glassClear" },
                                { "position": 2250, "width": 1400, "height": 2500, "fillType": "glassClear" }
                            ]
                        },
                        "ledStrip": null
                    },
                    {
                        "generalSpecs": { "position": 4450, "length": 2800, "height": 2500 },
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [{ "position": 4450, "width": 2800, "height": 2500, "fillType": "glassOpal" }]
                        },
                        "ledStrip": null
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": 3000,
                    "yPos": 0,
                    "rotation": 0,
                    "length": 4000,
                    "height": 2500,
                    "poleAmount": 1,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "intermediate",
                        "position": 2000,
                        "width": 100,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 0
                    }
                ],
                "bays": [
                    {
                        "generalSpecs": { "position": 1050, "length": 1800, "height": 2500 },
                        "climaglide": null,
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom130",
                            "screenColor": ["#4D504D", "#4D504D", "#4D504D"],
                            "solar": true,
                            "window": {
                                "type": "partialWidth",
                                "position": 1050,
                                "width": 800,
                                "height": 800,
                                "groundHeight": 900
                            }
                        },
                        "fixedWall": null,
                        "ledStrip": null
                    },
                    {
                        "generalSpecs": { "position": 2950, "length": 1800, "height": 2500 },
                        "climaglide": null,
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom130",
                            "screenColor": ["#4D504D", "#4D504D", "#4D504D"],
                            "solar": true,
                            "window": { "type": "fullWidth", "position": 2950, "width": 1800, "height": 600, "groundHeight": 1000 }
                        },
                        "fixedWall": null,
                        "ledStrip": null
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -3000,
                    "yPos": 4000,
                    "rotation": 180,
                    "length": 4000,
                    "height": 2500,
                    "poleAmount": 0,
                    "sections": ["Section_1"]
                },
                "poles": [],
                "bays": [
                    {
                        "generalSpecs": { "position": 2000, "length": 3700, "height": 2500 },
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 6,
                            "openingDirection": "middle",
                            "handle": true,
                            "sideProfile": false,
                            "foundationProfile": true,
                            "draftProfile": "pvc",
                            "glass": "glassOpal"
                        },
                        "verticalSunblind": null,
                        "fixedWall": null,
                        "ledStrip": null
                    }
                ]
            }
        ]
    },
    wallRear: {
        "_3d_screenshotName": "Calista_wall_rear",
        "_3d_conservatoryStructure": "wallAdjacent",
        "_3d_widthTotal": 5000,
        "_3d_depthTotal": 3500,
        "_3d_walls": { "front": false, "right": false, "rear": true, "left": false },
        "_3d_colorOutside": "#F1F0EA",
        "_3d_StructureSections": [
            {
                "width": 5000,
                "depth": 3500,
                "xPos": 0,
                "yPos": 1750,
                "heightUnderGutter": 2400,
                "sectionName": "Section_1",
                "adjacentSections": { "left": null, "right": null },
                "roofOptions": {
                    "horizontalScreen": { "type": "bottomZipper", "screenColor": ["#8C8C8C", "#8C8C8C", "#5A5A5A"], "motorSide": "left" },
                    "roofFillings": [
                        { "position": 500, "width": 1000, "type": "plastic" },
                        { "position": 1500, "width": 1000, "type": "plasticOpal" },
                        { "position": 2500, "width": 1000, "type": "plasticSunBlocking" },
                        { "position": 3500, "width": 1000, "type": "plasticOpal" },
                        { "position": 4500, "width": 1000, "type": "plastic" }
                    ],
                    "rafters": [
                        {
                            "position": 1000,
                            "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" },
                            "ledStrip": null
                        },
                        {
                            "position": 2000,
                            "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" },
                            "ledStrip": null
                        },
                        {
                            "position": 3000,
                            "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" },
                            "ledStrip": null
                        },
                        {
                            "position": 4000,
                            "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" },
                            "ledStrip": null
                        }
                    ]
                }
            }
        ],
        "_3d_SideOpenings": [
            {
                "sideSpecs": {
                    "xPos": 2500,
                    "yPos": 3500,
                    "rotation": 270,
                    "length": 5000,
                    "height": 2400,
                    "poleAmount": 3,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "corner",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2400,
                        "support": "bracketUnder",
                        "index": 0
                    },
                    {
                        "type": "intermediate",
                        "position": 2500,
                        "width": 100,
                        "depth": 150,
                        "length": 2400,
                        "support": "bracketUnder",
                        "index": 1
                    },
                    {
                        "type": "corner",
                        "position": 4925,
                        "width": 150,
                        "depth": 150,
                        "length": 2400,
                        "support": "bracketUnder",
                        "index": 2
                    }
                ],
                "bays": [
                    {
                        "generalSpecs": { "position": 1300, "length": 2300, "height": 2400 },
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 3,
                            "openingDirection": "left",
                            "handle": true,
                            "sideProfile": true,
                            "foundationProfile": false,
                            "draftProfile": null,
                            "glass": "glassClear"
                        },
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "element",
                            "screenColor": ["#3C3C3C", "#3C3C3C", "#3C3C3C"],
                            "solar": true,
                            "window": {
                                "type": "partialWidth",
                                "position": 1300,
                                "width": 1000,
                                "height": 700,
                                "groundHeight": 800
                            }
                        },
                        "fixedWall": null,
                        "ledStrip": null
                    },
                    {
                        "generalSpecs": { "position": 3700, "length": 2300, "height": 2400 },
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "surface",
                            "partitions": [
                                { "position": 3125, "width": 1150, "height": 2400, "fillType": "woodOutside" },
                                { "position": 4275, "width": 1150, "height": 2400, "fillType": "sandwichPanelWhite" }
                            ]
                        },
                        "ledStrip": null
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -2500,
                    "yPos": 0,
                    "rotation": 90,
                    "length": 5000,
                    "height": 2400,
                    "poleAmount": 2,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "wallAdjacent",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2400,
                        "support": "foundation",
                        "index": 0
                    },
                    {
                        "type": "wallAdjacent",
                        "position": 4925,
                        "width": 150,
                        "depth": 150,
                        "length": 2400,
                        "support": "foundation",
                        "index": 1
                    }
                ],
                "bays": []
            },
            {
                "sideSpecs": {
                    "xPos": 2500,
                    "yPos": 0,
                    "rotation": 0,
                    "length": 3500,
                    "height": 2400,
                    "poleAmount": 0,
                    "sections": ["Section_1"]
                },
                "poles": [],
                "bays": [
                    {
                        "generalSpecs": { "position": 1750, "length": 3200, "height": 2400 },
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [
                                { "position": 925, "width": 1550, "height": 2400, "fillType": "glassClear" },
                                { "position": 2525, "width": 1650, "height": 2400, "fillType": "woodInside" }
                            ]
                        },
                        "ledStrip": { "mounting": "builtIn", "color": "#FFFFFF" }
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -2500,
                    "yPos": 3500,
                    "rotation": 180,
                    "length": 3500,
                    "height": 2400,
                    "poleAmount": 0,
                    "sections": ["Section_1"]
                },
                "poles": [],
                "bays": [
                    {
                        "generalSpecs": { "position": 1750, "length": 3200, "height": 2400 },
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 4,
                            "openingDirection": "right",
                            "handle": true,
                            "sideProfile": false,
                            "foundationProfile": true,
                            "draftProfile": "alu",
                            "glass": "glassOpal"
                        },
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom130",
                            "screenColor": ["#8C8C8C", "#8C8C8C", "#5A5A5A"],
                            "solar": false,
                            "window": { "type": "fullWidth", "position": 1750, "width": 3200, "height": 800, "groundHeight": 1200 }
                        },
                        "fixedWall": null,
                        "ledStrip": { "mounting": "builtIn", "color": "#FFFFFF" }
                    }
                ]
            }
        ]
    },
    wallRearRight: {
        "_3d_screenshotName": "Calista_wall_rear_right",
        "_3d_conservatoryStructure": "wallAdjacent",
        "_3d_widthTotal": 4500,
        "_3d_depthTotal": 3000,
        "_3d_walls": { "front": false, "right": true, "rear": true, "left": false },
        "_3d_colorOutside": "#1E1E1E",
        "_3d_StructureSections": [
            {
                "width": 4500,
                "depth": 3000,
                "xPos": 0,
                "yPos": 1500,
                "heightUnderGutter": 2600,
                "sectionName": "Section_1",
                "adjacentSections": { "left": null, "right": null },
                "roofOptions": {
                    "horizontalScreen": null,
                    "roofFillings": [
                        { "position": 375, "width": 750, "type": "sandwichPanelAnthracite" },
                        { "position": 1125, "width": 750, "type": "sandwichPanelWhite" },
                        { "position": 1875, "width": 750, "type": "sandwichPanelTile" },
                        { "position": 2625, "width": 750, "type": "sandwichPanelTile" },
                        { "position": 3375, "width": 750, "type": "sandwichPanelWhite" },
                        { "position": 4125, "width": 750, "type": "sandwichPanelAnthracite" }
                    ],
                    "rafters": [
                        { "position": 750, "ledSpot": null, "ledStrip": "#FFD1A3" },
                        { "position": 1500, "ledSpot": null, "ledStrip": null },
                        { "position": 2250, "ledSpot": null, "ledStrip": "#FFD1A3" },
                        { "position": 3000, "ledSpot": null, "ledStrip": null },
                        { "position": 3750, "ledSpot": null, "ledStrip": "#FFD1A3" }
                    ]
                }
            }
        ],
        "_3d_SideOpenings": [
            {
                "sideSpecs": {
                    "xPos": 2250,
                    "yPos": 3000,
                    "rotation": 270,
                    "length": 4500,
                    "height": 2600,
                    "poleAmount": 2,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "corner",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2600,
                        "support": "bracket",
                        "index": 0
                    },
                    {
                        "type": "intermediate",
                        "position": 2250,
                        "width": 100,
                        "depth": 150,
                        "length": 2600,
                        "support": "bracket",
                        "index": 1
                    }
                ],
                "bays": [
                    {
                        "generalSpecs": { "position": 1175, "length": 2050, "height": 2600 },
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [
                                {
                                    "position": 500,
                                    "width": 700,
                                    "height": 2600,
                                    "fillType": "sandwichPanelAnthracite"
                                },
                                { "position": 1175, "width": 650, "height": 2600, "fillType": "woodBothSides" },
                                { "position": 1850, "width": 700, "height": 2600, "fillType": "none" }
                            ]
                        },
                        "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" }
                    },
                    {
                        "generalSpecs": { "position": 3325, "length": 2050, "height": 2600 },
                        "climaglide": null,
                        "verticalSunblind": {
                            "mounting": "surface",
                            "type": "axiom130",
                            "screenColor": ["#E5E1D8", "#C9C3B6", "#E5E1D8"],
                            "solar": false,
                            "window": { "type": "fullWidth", "position": 3325, "width": 2050, "height": 700, "groundHeight": 1100 }
                        },
                        "fixedWall": null,
                        "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" }
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -2250,
                    "yPos": 0,
                    "rotation": 90,
                    "length": 4500,
                    "height": 2600,
                    "poleAmount": 1,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "wallAdjacent",
                        "position": 4425,
                        "width": 150,
                        "depth": 150,
                        "length": 2600,
                        "support": "bracket",
                        "index": 0
                    }
                ],
                "bays": []
            },
            {
                "sideSpecs": {
                    "xPos": 2250,
                    "yPos": 0,
                    "rotation": 0,
                    "length": 3000,
                    "height": 2600,
                    "poleAmount": 0,
                    "sections": ["Section_1"]
                },
                "poles": [],
                "bays": [
                    {
                        "generalSpecs": { "position": 1500, "length": 2700, "height": 2600 },
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 6,
                            "openingDirection": "middle",
                            "handle": false,
                            "sideProfile": true,
                            "foundationProfile": true,
                            "draftProfile": "pvc",
                            "glass": "glassClear"
                        },
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom100",
                            "screenColor": ["#4D504D", "#4D504D", "#4D504D"],
                            "solar": true,
                            "window": {
                                "type": "partialWidth",
                                "position": 1500,
                                "width": 1200,
                                "height": 900,
                                "groundHeight": 700
                            }
                        },
                        "fixedWall": null,
                        "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" }
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -2250,
                    "yPos": 3000,
                    "rotation": 180,
                    "length": 3000,
                    "height": 2600,
                    "poleAmount": 1,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "wallAdjacent",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2600,
                        "support": "bracket",
                        "index": 0
                    }
                ],
                "bays": []
            }
        ]
    }
};
//#endregion

export { createPL, mm, DEV_SCOPE, DEV_SCOPES };
