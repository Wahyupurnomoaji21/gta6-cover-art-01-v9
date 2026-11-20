// NEON COAST cover engine: one layout model drives the DOM preview and the
// canvas export, so preview and export always agree.

export const FORMATS = {
  landscape: { width: 1280, height: 720, kind: "landscape" },
  portrait: { width: 720, height: 1280, kind: "portrait" },
  square: { width: 1080, height: 1080, kind: "square" },
};

export const GRADES = {
  neon: "Neon Night — teal / magenta",
  golden: "Golden Hour — warm amber",
  pastel: "Vice Pastel — soft pink",
  noir: "Noir — high contrast",
};

export const LAYOUTS = {
  grid: "Four-panel grid",
  top: "Hero on top",
  duo: "Two by two",
};

const GRADE_STOPS = {
  neon: ["rgba(0,255,214,0.30)", "rgba(255,0,120,0.24)"],
  golden: ["rgba(255,170,40,0.30)", "rgba(255,80,20,0.18)"],
  pastel: ["rgba(255,150,200,0.22)", "rgba(120,180,255,0.20)"],
  noir: ["rgba(10,10,30,0.25)", "rgba(255,255,255,0.08)"],
};

export function defaultPhotos() {
  return [
    { id: "boulevard", label: "Photo 1 · Boulevard", src: "samples/boulevard.jpg" },
    { id: "pier", label: "Photo 2 · Pier", src: "samples/pier.jpg" },
  ];
}

export function defaultState() {
  return {
    title: "NEON COAST",
    subtitle: "vice nights, endless summer",
    badge: "VI",
    layout: "grid",
    grade: "neon",
    gradeStrength: 60,
    grain: 35,
    titleSize: 100,
    duotone: 0,
    photos: defaultPhotos(),
    panels: [
      { photo: 0, zoom: 1.45, fx: 0.5, fy: 0.62 },
      { photo: 1, zoom: 1.6, fx: 0.62, fy: 0.72 },
      { photo: 0, zoom: 2.0, fx: 0.45, fy: 0.62 },
      { photo: 1, zoom: 1.35, fx: 0.42, fy: 0.3 },
    ],
    selectedPanel: 0,
    activePhoto: 0,
  };
}

export function fitRect(imgW, imgH, panelW, panelH, zoom, fx, fy) {
  const base = Math.max(panelW / imgW, panelH / imgH);
  const scale = base * zoom;
  const dw = imgW * scale;
  const dh = imgH * scale;
  const dx = Math.min(0, Math.max(panelW - dw, panelW / 2 - fx * dw));
  const dy = Math.min(0, Math.max(panelH - dh, panelH / 2 - fy * dh));
  return { x: dx, y: dy, w: dw, h: dh };
}

export function layoutRects(format, layoutName) {
  const gap = 5;
  const W = format.width;
  const H = format.height;
  const bandH = Math.round(H * 0.12);
  const gridH = H - bandH;
  const gridW = W;
  const band = { x: 0, y: gridH, w: gridW, h: bandH };
  let hero;
  let strips;
  if (layoutName === "duo") {
    const halfW = (gridW - gap) / 2;
    const halfH = (gridH - gap) / 2;
    hero = { x: 0, y: 0, w: halfW, h: halfH };
    strips = [
      { x: halfW + gap, y: 0, w: halfW, h: halfH },
      { x: 0, y: halfH + gap, w: halfW, h: halfH },
      { x: halfW + gap, y: halfH + gap, w: halfW, h: halfH },
    ];
  } else if (layoutName === "top") {
    const heroH = Math.round(gridH * 0.58);
    const rowH = gridH - heroH - gap;
    const cellW = (gridW - 2 * gap) / 3;
    hero = { x: 0, y: 0, w: gridW, h: heroH };
    strips = [0, 1, 2].map((i) => ({
      x: i * (cellW + gap), y: heroH + gap, w: cellW, h: rowH,
    }));
  } else if (format.kind === "portrait") {
    const heroH = Math.round(gridH * 0.52);
    const stripH = (gridH - heroH - gap - 2 * gap) / 3;
    hero = { x: 0, y: 0, w: gridW, h: heroH };
    strips = [0, 1, 2].map((i) => ({
      x: 0, y: heroH + gap + i * (stripH + gap), w: gridW, h: stripH,
    }));
  } else if (format.kind === "square") {
    const heroH = Math.round(gridH * 0.58);
    const rowH = gridH - heroH - gap;
    const cellW = (gridW - 2 * gap) / 3;
    hero = { x: 0, y: 0, w: gridW, h: heroH };
    strips = [0, 1, 2].map((i) => ({
      x: i * (cellW + gap), y: heroH + gap, w: cellW, h: rowH,
    }));
  } else {
    const heroW = Math.round(gridW * 0.6);
    const sideW = gridW - heroW - gap;
    const stripH = (gridH - 2 * gap) / 3;
    hero = { x: 0, y: 0, w: heroW, h: gridH };
    strips = [0, 1, 2].map((i) => ({
      x: heroW + gap, y: i * (stripH + gap), w: sideW, h: stripH,
    }));
  }
  return { hero, strips, band, bandHeight: bandH };
}

// One palm silhouette, shared by the DOM and the canvas: five strokes from
// a trunk point. Each stroke is [x0, y0, x1, y1, x2, y2, x3, y3].
const PALM_STROKES = [
  [60, 118, 58, 84, 56, 60, 48, 34],
  [48, 34, 30, 22, 14, 20, 4, 26],
  [48, 34, 62, 16, 82, 10, 98, 14],
  [48, 34, 40, 12, 46, 2, 58, 2],
  [48, 34, 52, 14, 66, 4, 82, 8],
  [48, 34, 34, 12, 22, 10, 10, 16],
];

function palmSvgElement() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 120 120");
  svg.setAttribute("width", "120");
  svg.setAttribute("height", "120");
  for (const s of PALM_STROKES) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M" + s[0] + " " + s[1] + " C" + s[2] + " " + s[3] + " " + s[4] + " " + s[5] + " " + s[6] + " " + s[7]
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "6");
    path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);
  }
  return svg;
}

function drawPalmOnCanvas(ctx, x, y, flipped) {
  ctx.save();
  ctx.translate(x, y);
  if (flipped) {
    ctx.translate(120, 0);
    ctx.scale(-1, 1);
  }
  ctx.strokeStyle = "#0a0a12";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  for (const s of PALM_STROKES) {
    ctx.beginPath();
    ctx.moveTo(s[0], s[1]);
    ctx.bezierCurveTo(s[2], s[3], s[4], s[5], s[6], s[7]);
    ctx.stroke();
  }
  ctx.restore();
}

function placeImage(img, panel, rect) {
  if (!img.naturalWidth || !img.naturalHeight) return;
  const r = fitRect(img.naturalWidth, img.naturalHeight, rect.w, rect.h, panel.zoom, panel.fx, panel.fy);
  img.style.left = r.x + "px";
  img.style.top = r.y + "px";
  img.style.width = r.w + "px";
  img.style.height = r.h + "px";
}

function buildPanel(state, index, rect, interactive, handlers) {
  const panel = state.panels[index];
  const div = document.createElement("div");
  div.className = "panel" + (state.selectedPanel === index ? " selected" : "");
  div.dataset.panel = String(index);
  div.style.left = rect.x + "px";
  div.style.top = rect.y + "px";
  div.style.width = rect.w + "px";
  div.style.height = rect.h + "px";
  const photo = state.photos[panel.photo];
  const img = document.createElement("img");
  if (photo) {
    img.src = photo.src;
    img.alt = photo.label;
  }
  img.draggable = false;
  const place = () => placeImage(img, panel, rect);
  if (img.complete) place();
  else img.addEventListener("load", place);
  div.appendChild(img);
  const gradeVeil = document.createElement("div");
  gradeVeil.className = "grade-veil";
  gradeVeil.style.opacity = String(state.gradeStrength / 100);
  div.appendChild(gradeVeil);
  const duotoneVeil = document.createElement("div");
  duotoneVeil.className = "duotone-veil";
  duotoneVeil.style.opacity = String(state.duotone / 100);
  div.appendChild(duotoneVeil);
  const grainVeil = document.createElement("div");
  grainVeil.className = "grain-veil";
  grainVeil.style.opacity = String(state.grain / 100);
  div.appendChild(grainVeil);
  if (interactive) {
    div.style.cursor = "grab";
    div.addEventListener("click", () => {
      if (handlers && handlers.onSelect) handlers.onSelect(index);
    });
    let drag = null;
    div.addEventListener("pointerdown", (event) => {
      drag = {
        startX: event.clientX,
        startY: event.clientY,
        fx: panel.fx,
        fy: panel.fy,
        scale: div.getBoundingClientRect().width / rect.w,
      };
      div.setPointerCapture(event.pointerId);
      div.style.cursor = "grabbing";
    });
    div.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const dx = (event.clientX - drag.startX) / drag.scale;
      const dy = (event.clientY - drag.startY) / drag.scale;
      const fx = Math.min(1, Math.max(0, drag.fx - dx / rect.w));
      const fy = Math.min(1, Math.max(0, drag.fy - dy / rect.h));
      panel.fx = fx;
      panel.fy = fy;
      placeImage(img, panel, rect);
      if (handlers && handlers.onPan) handlers.onPan(index, fx, fy);
    });
    const endDrag = () => {
      drag = null;
      div.style.cursor = "grab";
    };
    div.addEventListener("pointerup", endDrag);
    div.addEventListener("pointercancel", endDrag);
  }
  return div;
}

export function createCoverElement(state, format, interactive, handlers) {
  const W = format.width;
  const H = format.height;
  const rects = layoutRects(format, state.layout);
  const bandH = rects.bandHeight;
  const poster = document.createElement("div");
  poster.className = "poster grade-" + state.grade;
  poster.style.width = W + "px";
  poster.style.height = H + "px";
  const grid = document.createElement("div");
  grid.className = "poster-grid";
  if (state.layout === "top" || (state.layout === "grid" && format.kind === "square")) {
    grid.classList.add("stacked-row");
  }
  if (state.layout === "grid" && format.kind === "portrait") {
    grid.classList.add("stacked");
  }
  grid.style.width = W + "px";
  grid.style.height = (H - bandH) + "px";
  grid.appendChild(buildPanel(state, 0, rects.hero, interactive, handlers));
  rects.strips.forEach((rect, i) => {
    grid.appendChild(buildPanel(state, i + 1, rect, interactive, handlers));
  });
  poster.appendChild(grid);
  const band = document.createElement("div");
  band.className = "poster-band";
  band.style.height = bandH + "px";
  const halftone = document.createElement("div");
  halftone.className = "halftone";
  band.appendChild(halftone);
  const title = document.createElement("h1");
  title.className = "band-title";
  title.textContent = state.title;
  title.style.fontSize = Math.round(bandH * 0.58 * (state.titleSize / 100)) + "px";
  title.style.bottom = Math.round(bandH * 0.3) + "px";
  band.appendChild(title);
  const subtitle = document.createElement("p");
  subtitle.className = "band-subtitle";
  subtitle.textContent = state.subtitle;
  subtitle.style.fontSize = Math.round(bandH * 0.26) + "px";
  band.appendChild(subtitle);
  const badgeSize = Math.round(bandH * 0.62);
  const badge = document.createElement("div");
  badge.className = "badge";
  badge.textContent = state.badge;
  badge.style.width = badgeSize + "px";
  badge.style.height = badgeSize + "px";
  badge.style.fontSize = Math.round(badgeSize * 0.42) + "px";
  badge.style.right = Math.round(W * 0.09) + "px";
  band.appendChild(badge);
  const palmLeft = document.createElement("div");
  palmLeft.className = "palm left";
  palmLeft.appendChild(palmSvgElement());
  band.appendChild(palmLeft);
  const palmRight = document.createElement("div");
  palmRight.className = "palm right";
  palmRight.appendChild(palmSvgElement());
  band.appendChild(palmRight);
  poster.appendChild(band);
  return poster;
}

export function fitBandTitle(poster, formatWidth) {
  const title = poster.querySelector(".band-title");
  const badge = poster.querySelector(".badge");
  if (!title || !badge) return;
  const badgeWidth = badge.offsetWidth || 0;
  const badgeRight = Math.round(formatWidth * 0.09);
  const available = formatWidth - 42 - badgeWidth - badgeRight - 40;
  let size = parseFloat(title.style.fontSize) || 50;
  let rounds = 0;
  while (title.offsetWidth > available && size > 10 && rounds < 10) {
    size = Math.max(10, size - 2);
    title.style.fontSize = size + "px";
    rounds += 1;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("failed to load image: " + src));
    img.src = src;
  });
}

function noisePattern(ctx) {
  const tile = document.createElement("canvas");
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext("2d");
  const data = tctx.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  return ctx.createPattern(tile, "repeat");
}

export async function drawCover(state, format) {
  if (document.fonts) {
    try {
      await document.fonts.load("64px Anton");
      await document.fonts.load("30px Pacifico");
    } catch (err) {
      // fall back to whatever fonts are available
    }
  }
  const W = format.width;
  const H = format.height;
  const rects = layoutRects(format, state.layout);
  const band = rects.band;
  const bandH = rects.bandHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a1e3a";
  ctx.fillRect(0, 0, W, H);
  const loaded = [];
  for (const photo of state.photos) {
    loaded.push(await loadImage(photo.src));
  }
  const stops = GRADE_STOPS[state.grade] || GRADE_STOPS.neon;
  const drawPanel = (index, rect) => {
    const panel = state.panels[index];
    const img = loaded[panel.photo];
    if (!img) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const r = fitRect(img.naturalWidth, img.naturalHeight, rect.w, rect.h, panel.zoom, panel.fx, panel.fy);
    ctx.drawImage(img, rect.x + r.x, rect.y + r.y, r.w, r.h);
    const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    wash.addColorStop(0, stops[0]);
    wash.addColorStop(1, stops[1]);
    ctx.save();
    ctx.globalAlpha = state.gradeStrength / 100;
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    if (state.duotone > 0) {
      const duo = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      duo.addColorStop(0, "#ff2e7e");
      duo.addColorStop(1, "#00e5c7");
      ctx.save();
      ctx.globalCompositeOperation = "color";
      ctx.globalAlpha = state.duotone / 100;
      ctx.fillStyle = duo;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
    if (state.grain > 0) {
      ctx.save();
      ctx.globalAlpha = (state.grain / 100) * 0.5;
      ctx.fillStyle = noisePattern(ctx);
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
    ctx.restore();
  };
  drawPanel(0, rects.hero);
  rects.strips.forEach((rect, i) => drawPanel(i + 1, rect));
  const bandGrad = ctx.createLinearGradient(band.x, band.y, band.x + band.w, band.y);
  bandGrad.addColorStop(0, "#ff7a00");
  bandGrad.addColorStop(0.38, "#ff4d2e");
  bandGrad.addColorStop(0.68, "#ff2e7e");
  bandGrad.addColorStop(1, "#e91e9c");
  ctx.fillStyle = bandGrad;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  for (let y = band.y + 5; y < band.y + band.h; y += 11) {
    for (let x = band.x + 5; x < band.x + band.w; x += 11) {
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const badgeSize = Math.round(bandH * 0.62);
  const badgeRight = Math.round(W * 0.09);
  const maxTitleWidth = W - 42 - badgeSize - badgeRight - 40;
  let titleSize = Math.round(bandH * 0.58 * (state.titleSize / 100));
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  const titleText = state.title.toUpperCase();
  while (titleSize > 10) {
    ctx.font = "400 " + titleSize + "px Anton, sans-serif";
    if (ctx.measureText(titleText).width <= maxTitleWidth) break;
    titleSize -= 2;
  }
  ctx.font = "400 " + titleSize + "px Anton, sans-serif";
  ctx.fillText(titleText, 42, band.y + Math.round(bandH * 0.7));
  const subtitleSize = Math.round(bandH * 0.26);
  ctx.font = "400 " + subtitleSize + "px Pacifico, cursive";
  ctx.fillText(state.subtitle, 48, band.y + bandH - 2);
  const badgeCx = band.w - badgeRight - badgeSize / 2;
  const badgeCy = band.y + bandH / 2;
  ctx.beginPath();
  ctx.ellipse(badgeCx, badgeCy, badgeSize / 2, badgeSize / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#0b1e3a";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#f5b942";
  ctx.stroke();
  ctx.fillStyle = "#f5b942";
  ctx.font = "400 " + Math.round(badgeSize * 0.42) + "px Anton, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(state.badge, badgeCx, badgeCy + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  drawPalmOnCanvas(ctx, -14, band.y + bandH - 114, false);
  drawPalmOnCanvas(ctx, band.w - 106, band.y + bandH - 114, true);
  return canvas;
}

function shortLabel(state, index) {
  const panel = state.panels[index];
  if (!panel) return "empty";
  const photo = state.photos[panel.photo];
  if (!photo) return "empty";
  return photo.label.replace(/^Photo \d+ · /, "");
}

export function previewCaption(state) {
  const heroLabel = shortLabel(state, 0);
  const stripLabels = [1, 2, 3].map((i) => shortLabel(state, i));
  return (
    "Hero panel: the " + heroLabel + " photo, cropped to the leaning arm and the red door. " +
    "Strips: " + stripLabels.join(", ") + "."
  );
}
