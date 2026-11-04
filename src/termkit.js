/* termkit.js: pixel objects, long shadow, LED text. Shared by graphics.html and the site. */
const TK = (() => {
  const THEMES = {
    paper: { bg:"#f0e7d8", shadow:"#dcd2bf", ink:"#2b2a26", muted:"#8b8474", accent:"#2f9e4f", red:"#c9452e", card:"#f8f3ea", line:"#3a372f",
      outline:"#2e2a23", body:"#ece2c9", hi:"#faf5e8", shade:"#cdbf9f", dark:"#a39372", screen:"#16211a", glare:"#24372b", glow:"#45e07f", led:"#45e07f", slot:"#4a4337", glowBlur:0 },
    phosphor: { bg:"#050806", shadow:"#020302", ink:"#d6ffe2", muted:"#5d8a6b", accent:"#4cf28d", red:"#ff3b30", card:"#0b120d", line:"#1f3b29",
      outline:"#0d0f0c", body:"#e6dcc0", hi:"#f6f0de", shade:"#c4b693", dark:"#9a8a68", screen:"#0b1a10", glare:"#173323", glow:"#5cff9a", led:"#5cff9a", slot:"#3b352a", glowBlur:.9 },
    graphite: { bg:"#131210", shadow:"#0a0908", ink:"#efe7d8", muted:"#6f6a60", accent:"#efe7d8", red:"#e0533d", card:"#1a1916", line:"#33302a",
      outline:"#0a0908", body:"#ece4d3", hi:"#faf6ec", shade:"#c9bfa9", dark:"#9d927b", screen:"#1b1a17", glare:"#2b2925", glow:"#efe7d8", led:"#7fe0a0", slot:"#3d3a33", glowBlur:.5 },
  };

  // 3x5 pixel font (M, N, W wider). Rows top to bottom.
  const FONT = {
    A:["010","101","111","101","101"],B:["110","101","110","101","110"],C:["011","100","100","100","011"],D:["110","101","101","101","110"],
    E:["111","100","110","100","111"],F:["111","100","110","100","100"],G:["011","100","101","101","011"],H:["101","101","111","101","101"],
    I:["111","010","010","010","111"],J:["001","001","001","101","010"],K:["101","101","110","101","101"],L:["100","100","100","100","111"],
    M:["10001","11011","10101","10001","10001"],N:["1001","1101","1011","1001","1001"],O:["010","101","101","101","010"],P:["110","101","110","100","100"],
    Q:["010","101","101","110","011"],R:["110","101","110","101","101"],S:["011","100","010","001","110"],T:["111","010","010","010","010"],
    U:["101","101","101","101","111"],V:["101","101","101","101","010"],W:["10001","10001","10101","11011","10001"],X:["101","101","010","101","101"],
    Y:["101","101","010","010","010"],Z:["111","001","010","100","111"],
    0:["111","101","101","101","111"],1:["010","110","010","010","111"],2:["110","001","010","100","111"],3:["110","001","010","001","110"],
    4:["101","101","111","001","001"],5:["111","100","110","001","110"],6:["011","100","111","101","111"],7:["111","001","010","010","010"],
    8:["111","101","111","101","111"],9:["111","101","111","001","110"]," ":["0","0","0","0","0"],"-":["000","000","111","000","000"],
    ".":["0","0","0","0","1"],"+":["000","010","111","010","000"],"%":["101","001","010","100","101"],">":["100","010","001","010","100"],"_":["000","000","000","000","111"],
  };
  const glyph = ch => FONT[ch.toUpperCase()] || FONT[" "];
  const textWidth = (s, k = 1) => [...s].reduce((w, ch, i) => w + glyph(ch)[0].length * k + (i ? k : 0), 0);

  function Grid(w, h) {
    const c = new Array(w * h).fill(null);
    return {
      w, h, c,
      get(x, y) { return x < 0 || y < 0 || x >= w || y >= h ? null : c[y * w + x]; },
      set(x, y, v) { if (x >= 0 && y >= 0 && x < w && y < h) c[y * w + x] = v; },
      rect(x, y, rw, rh, v) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) this.set(x + i, y + j, v); },
      text(s, x, y, v, k = 1) {
        let cx = x;
        for (const ch of s) { const g = glyph(ch);
          g.forEach((row, j) => [...row].forEach((b, i) => { if (b === "1") this.rect(cx + i * k, y + j * k, k, k, v); }));
          cx += g[0].length * k + k; }
      },
      outline(v = "outline") { // 1-cell outline around everything that is filled
        const add = [];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
          if (!this.get(x, y) && (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1))) add.push([x, y]);
        add.forEach(([x, y]) => this.set(x, y, v));
      },
    };
  }

  // ---------- Objects. Each returns a Grid of palette keys. Build inside a 1-cell margin, then outline. ----------
  const OBJECTS = {
    computer({ ticker = "" } = {}) {
      const t = ticker.replace(/^\$/, "").toUpperCase();
      const k = t.length <= 4 ? 2 : 1;
      const tw = textWidth(t, k);
      const sw = Math.max(24, tw + 8);                    // screen width grows with the ticker
      const sh = Math.max(16, Math.round(sw * .52));      // and keeps a CRT-ish ratio
      const mw = sw + 10, mh = sh + 13;                   // monitor housing
      const W = mw + 6, H = mh + 18, g = Grid(W, H);
      const mx = 3, my = 1, sx = mx + 4, sy = my + 3;
      // monitor housing
      g.rect(mx, my, mw, mh, "body"); g.set(mx, my, null); g.set(mx + mw - 1, my, null);
      g.rect(mx + 1, my + 1, mw - 2, 1, "hi"); g.rect(mx + 1, my + 1, 1, mh - 3, "hi");
      g.rect(mx + mw - 2, my + 1, 1, mh - 2, "shade"); g.rect(mx + 1, my + mh - 2, mw - 2, 1, "shade");
      // bezel + screen
      g.rect(sx - 1, sy - 1, sw + 2, sh + 2, "shade"); g.rect(sx - 1, sy - 1, sw + 2, 1, "dark"); g.rect(sx - 1, sy - 1, 1, sh + 2, "dark");
      g.rect(sx, sy, sw, sh, "screen");
      [[sx, sy], [sx + sw - 1, sy], [sx, sy + sh - 1], [sx + sw - 1, sy + sh - 1]].forEach(([x, y]) => g.set(x, y, "shade"));
      // screen content: ticker, then a prompt (big ticker) or a little bar chart (long ticker)
      const th = 5 * k, ty = sy + Math.max(2, Math.floor((sh - th - 5) / 2));
      g.text(t, sx + Math.floor((sw - tw) / 2), ty, "glow", k);
      const by = sy + sh - 3;
      if (k === 2) { g.set(sx + 3, by - 1, "glow"); g.set(sx + 4, by, "glow"); g.set(sx + 3, by + 1, "glow"); g.rect(sx + 6, by + 1, 3, 1, "glow"); }
      else { [1, 2, 1, 3, 2, 3, 2, 4, 3, 4].forEach((b, i) => g.rect(sx + Math.floor((sw - 19) / 2) + i * 2, by + 2 - b, 1, b, i === 4 ? "red" : "glow")); }
      // front panel
      const py = my + mh - 5;
      g.rect(mx + 4, py, 2, 1, "led"); g.set(mx + 7, py, "red");
      const fw = Math.min(12, mw - 16); g.rect(mx + mw - 4 - fw, py, fw, 1, "slot"); g.rect(mx + mw - 4 - fw, py + 1, fw, 1, "hi");
      // neck (3 rows so the outlines of monitor and keyboard stay separate)
      const ny = my + mh, nx = mx + Math.floor(mw / 2) - 6;
      g.rect(nx, ny, 12, 3, "shade"); g.rect(nx, ny, 12, 1, "dark");
      // keyboard slab
      const kx = 1, kw = W - 2, ky = ny + 3, kh = 10;
      g.rect(kx, ky, kw, kh, "body"); g.set(kx, ky, null); g.set(kx + kw - 1, ky, null);
      g.rect(kx + 1, ky + 1, kw - 2, 1, "hi"); g.rect(kx + 1, ky + kh - 1, kw - 2, 1, "shade");
      const k0 = kx + 3 + ((kw - 6) % 2 ? 1 : 0), k1 = kx + kw - 3;
      for (let x = k0; x < k1; x += 2) { g.set(x, ky + 3, "dark"); g.set(x, ky + 5, "dark"); }
      const mid = kx + Math.floor(kw / 2);
      for (let x = k0; x < k1; x += 2) if (x < mid - 9 || x > mid + 8) g.set(x, ky + 7, "dark");
      g.rect(mid - 8, ky + 7, 16, 1, "dark");
      g.outline();
      return g;
    },
    // Example of a custom object: a framed token with a halo. Copy this pattern for new narratives.
    frame({ ticker = "" } = {}) {
      const g = Grid(30, 38), t = ticker.replace(/^\$/, "").toUpperCase().slice(0, 1);
      g.rect(2, 8, 26, 28, "body"); g.rect(3, 9, 24, 1, "hi"); g.rect(3, 9, 1, 26, "hi"); g.rect(26, 9, 1, 26, "shade"); g.rect(3, 34, 24, 1, "shade");
      g.rect(6, 12, 18, 20, "screen");
      g.rect(10, 16, 10, 12, "shade"); g.rect(9, 17, 12, 10, "shade"); g.rect(11, 17, 8, 10, "body"); g.rect(10, 18, 10, 8, "body");
      g.text(t, 14, 20, "dark");
      g.outline();
      // details drawn after the outline stay thin: a halo ring floating above
      g.rect(11, 1, 8, 1, "hi"); g.rect(8, 2, 3, 1, "hi"); g.rect(19, 2, 3, 1, "hi"); g.set(7, 3, "hi"); g.set(22, 3, "shade");
      g.rect(8, 4, 3, 1, "shade"); g.rect(19, 4, 3, 1, "shade"); g.rect(11, 5, 8, 1, "shade");
      return g;
    },
    // ENTRY A: the OCT computer, screen shows a flat chart, the pump, and the entry marked at the bottom.
    chartpc() {
      const sw = 30, sh = 20, mw = sw + 10, mh = sh + 13, W = mw + 6, H = mh + 18, g = Grid(W, H);
      const mx = 3, my = 1, sx = mx + 4, sy = my + 3;
      g.rect(mx, my, mw, mh, "body"); g.set(mx, my, null); g.set(mx + mw - 1, my, null);
      g.rect(mx + 1, my + 1, mw - 2, 1, "hi"); g.rect(mx + 1, my + 1, 1, mh - 3, "hi");
      g.rect(mx + mw - 2, my + 1, 1, mh - 2, "shade"); g.rect(mx + 1, my + mh - 2, mw - 2, 1, "shade");
      g.rect(sx - 1, sy - 1, sw + 2, sh + 2, "shade"); g.rect(sx - 1, sy - 1, sw + 2, 1, "dark"); g.rect(sx - 1, sy - 1, 1, sh + 2, "dark");
      g.rect(sx, sy, sw, sh, "screen");
      [[sx, sy], [sx + sw - 1, sy], [sx, sy + sh - 1], [sx + sw - 1, sy + sh - 1]].forEach(([x, y]) => g.set(x, y, "shade"));
      g.text("ENTRY", sx + 2, sy + 2, "glow");
      // price: flat and quiet, then the pump
      const base = sy + sh - 6, top = sy + 6, flat = [0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 0, 0, 0];
      let px = sx + 2, prev = null; const pts = [];
      flat.forEach(o => pts.push([px++, base + o]));
      const ex = px - 1, n = sx + sw - 3 - px;
      for (let i = 1; i <= n; i++) pts.push([px + i - 1, Math.round(base - (base - top) * Math.pow(i / n, 1.7))]);
      pts.forEach(([x, y]) => { if (prev) for (let yy = Math.min(prev, y); yy <= Math.max(prev, y); yy++) g.set(x, yy, "glow"); g.set(x, y, "glow"); prev = y; });
      // their entry: a marker under the bottom of the move
      g.set(ex, base + 2, "led"); g.rect(ex - 1, base + 3, 3, 1, "led"); g.rect(ex - 2, base + 4, 5, 1, "led");
      // where the timeline buys: red at the top
      const [tx, ty] = pts[pts.length - 1]; g.rect(tx - 1, ty - 1, 2, 2, "red");
      const py = my + mh - 5;
      g.rect(mx + 4, py, 2, 1, "led"); g.set(mx + 7, py, "red");
      const fw = Math.min(12, mw - 16); g.rect(mx + mw - 4 - fw, py, fw, 1, "slot"); g.rect(mx + mw - 4 - fw, py + 1, fw, 1, "hi");
      const ny = my + mh, nx = mx + Math.floor(mw / 2) - 6;
      g.rect(nx, ny, 12, 3, "shade"); g.rect(nx, ny, 12, 1, "dark");
      const kx = 1, kw = W - 2, ky = ny + 3, kh = 10;
      g.rect(kx, ky, kw, kh, "body"); g.set(kx, ky, null); g.set(kx + kw - 1, ky, null);
      g.rect(kx + 1, ky + 1, kw - 2, 1, "hi"); g.rect(kx + 1, ky + kh - 1, kw - 2, 1, "shade");
      const k0 = kx + 3 + ((kw - 6) % 2 ? 1 : 0), k1 = kx + kw - 3;
      for (let x = k0; x < k1; x += 2) { g.set(x, ky + 3, "dark"); g.set(x, ky + 5, "dark"); }
      const mid = kx + Math.floor(kw / 2);
      for (let x = k0; x < k1; x += 2) if (x < mid - 9 || x > mid + 8) g.set(x, ky + 7, "dark");
      g.rect(mid - 8, ky + 7, 16, 1, "dark");
      g.outline();
      return g;
    },
    // ENTRY B: a door left ajar, light coming through, ENTRY over the frame.
    door() {
      const W = 34, H = 46, g = Grid(W, H);
      const fx = 2, fy = 1, fw = 30, fh = 42;                       // frame
      g.rect(fx, fy, fw, fh, "body"); g.rect(fx + 1, fy + 1, fw - 2, 1, "hi"); g.rect(fx + 1, fy + 1, 1, fh - 1, "hi");
      g.rect(fx + fw - 2, fy + 1, 1, fh - 1, "shade");
      // lintel plate with the name
      const lx = fx + 4, ly = fy + 3, lw = fw - 8, lh = 9;
      g.rect(lx - 1, ly - 1, lw + 2, lh + 2, "dark"); g.rect(lx, ly, lw, lh, "screen");
      g.text("ENTRY", lx + Math.floor((lw - textWidth("ENTRY")) / 2), ly + 2, "glow");
      // doorway: light inside
      const ox = fx + 4, oy = ly + lh + 3, ow = fw - 8, oh = fy + fh - oy;
      g.rect(ox - 1, oy - 1, ow + 2, oh + 1, "dark"); g.rect(ox, oy, ow, oh, "glow");
      // the door, swung in: a narrow slab on the hinge side, its edge catching light
      const dw = 13; g.rect(ox, oy, dw, oh, "shade"); g.rect(ox, oy, dw, 1, "dark");
      g.rect(ox + 2, oy + 3, dw - 5, 11, "dark"); g.rect(ox + 3, oy + 4, dw - 7, 9, "shade");
      g.rect(ox + 2, oy + 17, dw - 5, oh - 21, "dark"); g.rect(ox + 3, oy + 18, dw - 7, oh - 23, "shade");
      g.rect(ox + dw - 1, oy, 1, oh, "hi"); g.rect(ox + dw - 3, oy + 15, 2, 2, "slot");
      // floor step, with the light spilling out over it
      g.rect(0, fy + fh, W, 2, "shade"); g.rect(0, fy + fh, W, 1, "hi");
      g.rect(ox + dw, fy + fh, ow - dw + 1, 1, "glow"); g.rect(ox + dw + 1, fy + fh + 1, ow - dw + 3, 1, "glow");
      g.outline();
      return g;
    },
    // ENTRY C: a stopwatch. The gap between their buy and the call.
    watch() {
      const W = 38, H = 44, g = Grid(W, H), cx = 19, cy = 25, r = 16.4;
      // crown + side button
      g.rect(15, 1, 8, 3, "body"); g.rect(15, 1, 8, 1, "hi"); g.rect(17, 4, 4, 5, "shade");
      g.rect(30, 9, 3, 3, "body"); g.set(32, 11, "shade"); g.rect(29, 11, 2, 2, "shade");
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = x + .5 - cx, dy = y + .5 - cy, d = Math.hypot(dx, dy);
        if (d <= r) g.set(x, y, d > r - 2.2 ? (dx + dy < -4 ? "hi" : dx + dy > 4 ? "shade" : "body") : d > r - 3.4 ? "dark" : "screen");
      }
      // ticks: 12 around the face, long at the quarters
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, long = i % 3 === 0;
        for (let k = 0; k < (long ? 2 : 1); k++) { const rr = r - 4.6 - k; g.set(Math.floor(cx + Math.sin(a) * rr), Math.floor(cy - Math.cos(a) * rr), i === 0 ? "red" : "shade"); } }
      // readout: +14M
      const t = "+14M", tw = textWidth(t); g.text(t, Math.round(cx - tw / 2), cy - 7, "glow");
      // hand from the centre to the buy, well before 12
      const hx = 18, hy = cy + 3; g.rect(hx, hy, 2, 2, "glow");
      for (let k = 1; k <= 4; k++) g.rect(hx - 2 * k, hy - k + 1, 2, 1, "glow");
      g.outline();
      return g;
    },
    // ENTRY: a lit emergency-exit style sign that says ENTRY. Hangs from two thin rods.
    sign() {
      const W = 46, H = 28, g = Grid(W, H);
      const hx = 1, hy = 5, hw = 44, hh = 22;              // housing
      g.rect(hx, hy, hw, hh, "body"); g.set(hx, hy, null); g.set(hx + hw - 1, hy, null);
      g.rect(hx + 1, hy + 1, hw - 2, 1, "hi"); g.rect(hx + 1, hy + 1, 1, hh - 3, "hi");
      g.rect(hx + hw - 2, hy + 1, 1, hh - 2, "shade"); g.rect(hx + 1, hy + hh - 2, hw - 2, 1, "shade");
      // face
      const fx = hx + 3, fy = hy + 3, fw = hw - 6, fh = 13;
      g.rect(fx - 1, fy - 1, fw + 2, fh + 2, "dark"); g.rect(fx, fy, fw, fh, "screen");
      // pictogram: a lit doorway with a figure walking in (dark silhouette), then ENTRY with an arrow pointing in
      const dw = 7, dh = 11, gap = 5, tw = textWidth("ENTRY"), m = Math.floor((fw - dw - gap - tw) / 2);
      const dx = fx + m, dy = fy + 1, tx = dx + dw + gap;
      g.rect(dx, dy, dw, dh, "glow");
      const man = ["00110", "00110", "00000", "01110", "10111", "00110", "01110", "01001", "10001"];
      man.forEach((row, j) => [...row].forEach((b, i) => { if (b === "1") g.set(dx + 1 + i, dy + 2 + j, "screen"); }));
      g.text("ENTRY", tx, dy, "glow");
      const ay = dy + 8, ae = tx + tw - 1; g.rect(tx, ay, tw, 1, "glow");
      g.rect(ae - 2, ay - 2, 1, 5, "glow"); g.rect(ae - 1, ay - 1, 1, 3, "glow");
      // underside: test button + battery led
      const by = hy + hh - 4; g.rect(hx + 5, by, 4, 1, "slot"); g.set(hx + hw - 7, by, "red");
      g.outline();
      // rods drawn after the outline stay thin
      for (let y = 0; y < hy; y++) { g.set(hx + 7, y, "outline"); g.set(hx + hw - 8, y, "outline"); }
      g.rect(hx + 5, 0, 5, 1, "outline"); g.rect(hx + hw - 10, 0, 5, 1, "outline");
      return g;
    },
  };

  // ---------- Rendering ----------
  function draw(ctx, grid, o) {
    const th = typeof o.theme === "string" ? THEMES[o.theme] : o.theme;
    const cell = o.cell, ox = Math.round(o.x), oy = Math.round(o.y);
    if (o.shadow !== false) {
      const len = o.shadowLen ?? 2000, dir = o.shadowDir ?? [1, 1];
      const sil = document.createElement("canvas"); sil.width = grid.w * cell; sil.height = grid.h * cell;
      const s = sil.getContext("2d"); s.fillStyle = o.shadowColor || th.shadow;
      for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) if (grid.get(x, y)) s.fillRect(x * cell, y * cell, cell, cell);
      for (let i = 1; i <= len; i++) ctx.drawImage(sil, ox + dir[0] * i, oy + dir[1] * i);
    }
    for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) {
      const v = grid.get(x, y); if (!v) continue;
      ctx.fillStyle = th[v] || v;
      const glowing = (v === "glow" || v === "led") && th.glowBlur;
      if (glowing) { ctx.shadowColor = th[v]; ctx.shadowBlur = cell * 2.2 * th.glowBlur; } else ctx.shadowBlur = 0;
      ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
    ctx.shadowBlur = 0;
    return { w: grid.w * cell, h: grid.h * cell };
  }

  // Big LED-matrix text (WIM-style). Square dots with a gap, optional glow.
  function led(ctx, s, o) {
    const k = o.cell, gap = o.gap ?? Math.max(1, Math.round(k * .18));
    let cx = o.x;
    ctx.fillStyle = o.color; ctx.shadowColor = o.color; ctx.shadowBlur = o.glow ? k * 1.4 : 0;
    for (const ch of s.toUpperCase()) { const g = glyph(ch);
      g.forEach((row, j) => [...row].forEach((b, i) => {
        const sub = o.sub ?? 2; // each font pixel is drawn as sub×sub dots
        if (b === "1") for (let a = 0; a < sub; a++) for (let c = 0; c < sub; c++)
          ctx.fillRect(cx + (i * sub + c) * k, o.y + (j * sub + a) * k, k - gap, k - gap);
        else if (o.dim) { ctx.save(); ctx.globalAlpha = .07; ctx.shadowBlur = 0;
          for (let a = 0; a < sub; a++) for (let c = 0; c < sub; c++) ctx.fillRect(cx + (i * sub + c) * k, o.y + (j * sub + a) * k, k - gap, k - gap); ctx.restore(); }
      }));
      cx += (g[0].length + 1) * (o.sub ?? 2) * k; }
    ctx.shadowBlur = 0;
    return cx - o.x;
  }

  // Fit a canvas to an element at device pixel ratio and return a ctx in CSS pixels.
  function canvasFor(el) {
    const c = document.createElement("canvas"), r = el.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
    c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated";
    el.prepend(c); const ctx = c.getContext("2d"); ctx.scale(d, d); ctx.imageSmoothingEnabled = false; return ctx;
  }

  return { THEMES, FONT, OBJECTS, Grid, draw, led, canvasFor, textWidth };
})();
if (typeof module !== "undefined") module.exports = TK;
