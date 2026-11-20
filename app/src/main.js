// NEON COAST boot: cover stage for the cover shots, editor for the editor shot.

import {
  FORMATS,
  GRADES,
  LAYOUTS,
  createCoverElement,
  defaultState,
  drawCover,
  fitBandTitle,
  previewCaption,
} from "./cover.js";
import { applyShot, readShot } from "./shots.js";

const state = applyShot(defaultState(), readShot());
const shot = readShot();

function fitPoster(poster, boxWidth, designWidth, designHeight) {
  const scale = Math.min(1, boxWidth / designWidth);
  const wrap = document.createElement("div");
  wrap.className = "poster-scale";
  wrap.style.width = designWidth * scale + "px";
  wrap.style.height = designHeight * scale + "px";
  wrap.style.transform = "scale(" + scale + ")";
  wrap.appendChild(poster);
  return wrap;
}

function renderCoverStage() {
  document.body.style.background = "#120a2e";
  const app = document.getElementById("app");
  app.innerHTML = "";
  const format = FORMATS[shot.format];
  const stage = document.createElement("div");
  stage.className = "cover-stage";
  const poster = createCoverElement(state, format, false, null);
  const scale = Math.min(window.innerWidth / format.width, window.innerHeight / format.height);
  const wrap = document.createElement("div");
  wrap.className = "poster-scale";
  wrap.style.width = format.width * scale + "px";
  wrap.style.height = format.height * scale + "px";
  wrap.style.transform = "scale(" + scale + ")";
  wrap.style.transformOrigin = "center center";
  wrap.appendChild(poster);
  stage.appendChild(wrap);
  app.appendChild(stage);
  fitBandTitle(poster, format.width);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => fitBandTitle(poster, format.width));
  }
}

function renderEditor() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  const format = FORMATS[shot.format];
  const editor = document.createElement("div");
  editor.className = "editor";

  const topbar = document.createElement("div");
  topbar.className = "topbar";
  const brand = document.createElement("div");
  brand.className = "brand";
  const star = document.createElement("span");
  star.className = "star";
  star.textContent = "★";
  brand.appendChild(star);
  brand.appendChild(document.createTextNode("GTA VI · COVER MAKER"));
  const live = document.createElement("div");
  live.className = "live";
  live.textContent = "LIVE PREVIEW";
  const size = document.createElement("div");
  size.className = "size";
  size.textContent = "1280 × 720 · PNG";
  topbar.appendChild(brand);
  topbar.appendChild(live);
  topbar.appendChild(size);
  editor.appendChild(topbar);

  const body = document.createElement("div");
  body.className = "editor-body";
  const controls = document.createElement("div");
  controls.className = "controls";
  const previewCol = document.createElement("div");
  previewCol.className = "preview-col";

  // Card 1: photos
  const cardPhotos = document.createElement("div");
  cardPhotos.className = "card";
  const photosTitle = document.createElement("h2");
  photosTitle.textContent = "1 · YOUR PHOTOS";
  cardPhotos.appendChild(photosTitle);
  const photosNote = document.createElement("p");
  photosNote.className = "note";
  photosNote.textContent = "Photos stay on your machine — nothing is uploaded.";
  cardPhotos.appendChild(photosNote);
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  cardPhotos.appendChild(fileInput);
  const addButton = document.createElement("button");
  addButton.className = "btn btn-pink";
  addButton.textContent = "Add photos...";
  addButton.addEventListener("click", () => fileInput.click());
  cardPhotos.appendChild(addButton);
  const thumbs = document.createElement("div");
  thumbs.className = "thumbs";
  cardPhotos.appendChild(thumbs);
  const fillRow = document.createElement("div");
  fillRow.className = "btn-row";
  const fillButton = document.createElement("button");
  fillButton.className = "btn btn-ghost";
  fillButton.textContent = "Fill every panel with photo 1";
  fillButton.addEventListener("click", () => {
    state.panels.forEach((panel) => { panel.photo = 0; });
    refresh();
  });
  const dealButton = document.createElement("button");
  dealButton.className = "btn btn-ghost";
  dealButton.textContent = "Deal photos across panels";
  dealButton.addEventListener("click", () => {
    state.panels.forEach((panel, i) => { panel.photo = i % state.photos.length; });
    refresh();
  });
  fillRow.appendChild(fillButton);
  fillRow.appendChild(dealButton);
  cardPhotos.appendChild(fillRow);
  controls.appendChild(cardPhotos);

  // Card 2: the cover
  const cardCover = document.createElement("div");
  cardCover.className = "card";
  const coverTitle = document.createElement("h2");
  coverTitle.textContent = "2 · THE COVER";
  cardCover.appendChild(coverTitle);

  const titleField = document.createElement("div");
  titleField.className = "field";
  const titleLabel = document.createElement("label");
  titleLabel.textContent = "Title";
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.value = state.title;
  titleInput.addEventListener("input", () => {
    state.title = titleInput.value;
    refresh();
  });
  titleField.appendChild(titleLabel);
  titleField.appendChild(titleInput);
  cardCover.appendChild(titleField);

  const subtitleField = document.createElement("div");
  subtitleField.className = "field";
  const subtitleLabel = document.createElement("label");
  subtitleLabel.textContent = "Subtitle";
  const subtitleInput = document.createElement("input");
  subtitleInput.type = "text";
  subtitleInput.value = state.subtitle;
  subtitleInput.addEventListener("input", () => {
    state.subtitle = subtitleInput.value;
    refresh();
  });
  subtitleField.appendChild(subtitleLabel);
  subtitleField.appendChild(subtitleInput);
  cardCover.appendChild(subtitleField);

  const badgeField = document.createElement("div");
  badgeField.className = "field";
  const badgeLabel = document.createElement("label");
  badgeLabel.textContent = "Badge";
  const badgeInput = document.createElement("input");
  badgeInput.type = "text";
  badgeInput.value = state.badge;
  badgeInput.addEventListener("input", () => {
    state.badge = badgeInput.value;
    refresh();
  });
  badgeField.appendChild(badgeLabel);
  badgeField.appendChild(badgeInput);
  cardCover.appendChild(badgeField);

  const layoutField = document.createElement("div");
  layoutField.className = "field";
  const layoutLabel = document.createElement("label");
  layoutLabel.textContent = "Layout";
  const layoutSelect = document.createElement("select");
  for (const [value, label] of Object.entries(LAYOUTS)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    layoutSelect.appendChild(option);
  }
  layoutSelect.value = state.layout;
  layoutSelect.addEventListener("change", () => {
    state.layout = layoutSelect.value;
    refresh();
  });
  layoutField.appendChild(layoutLabel);
  layoutField.appendChild(layoutSelect);
  cardCover.appendChild(layoutField);

  const gradeField = document.createElement("div");
  gradeField.className = "field";
  const gradeLabel = document.createElement("label");
  gradeLabel.textContent = "Colour grade";
  const gradeSelect = document.createElement("select");
  for (const [value, label] of Object.entries(GRADES)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    gradeSelect.appendChild(option);
  }
  gradeSelect.value = state.grade;
  gradeSelect.addEventListener("change", () => {
    state.grade = gradeSelect.value;
    refresh();
  });
  gradeField.appendChild(gradeLabel);
  gradeField.appendChild(gradeSelect);
  cardCover.appendChild(gradeField);

  function sliderRow(labelText, min, max, getValue, setValue) {
    const row = document.createElement("div");
    row.className = "slider-row";
    const label = document.createElement("label");
    const name = document.createElement("span");
    name.textContent = labelText;
    const output = document.createElement("output");
    output.textContent = getValue() + " %";
    label.appendChild(name);
    label.appendChild(output);
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.value = String(getValue());
    input.addEventListener("input", () => {
      setValue(Number(input.value));
      output.textContent = input.value + " %";
      refresh();
    });
    row.appendChild(label);
    row.appendChild(input);
    return row;
  }
  cardCover.appendChild(sliderRow("Grade strength", 0, 100, () => state.gradeStrength, (v) => { state.gradeStrength = v; }));
  cardCover.appendChild(sliderRow("Grain", 0, 100, () => state.grain, (v) => { state.grain = v; }));
  cardCover.appendChild(sliderRow("Title size", 50, 150, () => state.titleSize, (v) => { state.titleSize = v; }));
  cardCover.appendChild(sliderRow("Duotone", 0, 100, () => state.duotone, (v) => { state.duotone = v; }));

  const exportButton = document.createElement("button");
  exportButton.className = "btn btn-orange";
  exportButton.textContent = "Export cover · 1280 × 720 PNG";
  exportButton.addEventListener("click", async () => {
    exportButton.textContent = "Drawing cover...";
    try {
      const canvas = await drawCover(state, FORMATS.landscape);
      const link = document.createElement("a");
      link.download = "neon-coast-cover.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      exportButton.textContent = "Export cover · 1280 × 720 PNG";
    } catch (err) {
      exportButton.textContent = "Export failed — try again";
    }
  });
  cardCover.appendChild(exportButton);
  controls.appendChild(cardCover);

  // Preview column
  const previewWrap = document.createElement("div");
  previewWrap.className = "preview-wrap";
  previewCol.appendChild(previewWrap);
  const caption = document.createElement("p");
  caption.className = "preview-caption";
  previewCol.appendChild(caption);
  const hint = document.createElement("div");
  hint.className = "panel-hint";
  const hintText = document.createElement("div");
  hint.appendChild(hintText);
  const hintRow = document.createElement("div");
  hintRow.className = "row";
  const usePhoto1 = document.createElement("button");
  usePhoto1.className = "btn btn-ghost";
  usePhoto1.textContent = "Use photo 1";
  usePhoto1.addEventListener("click", () => {
    state.panels[state.selectedPanel].photo = 0;
    refresh();
  });
  const usePhoto2 = document.createElement("button");
  usePhoto2.className = "btn btn-ghost";
  usePhoto2.textContent = "Use photo 2";
  usePhoto2.addEventListener("click", () => {
    state.panels[state.selectedPanel].photo = 1;
    refresh();
  });
  const zoomRange = document.createElement("input");
  zoomRange.type = "range";
  zoomRange.min = "100";
  zoomRange.max = "300";
  zoomRange.value = "100";
  zoomRange.addEventListener("input", () => {
    state.panels[state.selectedPanel].zoom = Number(zoomRange.value) / 100;
    refresh();
  });
  const resetButton = document.createElement("button");
  resetButton.className = "btn btn-ghost";
  resetButton.textContent = "Reset crop";
  resetButton.addEventListener("click", () => {
    const defaults = defaultState().panels[state.selectedPanel];
    state.panels[state.selectedPanel].zoom = defaults.zoom;
    state.panels[state.selectedPanel].fx = defaults.fx;
    state.panels[state.selectedPanel].fy = defaults.fy;
    refresh();
  });
  hintRow.appendChild(usePhoto1);
  hintRow.appendChild(usePhoto2);
  hintRow.appendChild(zoomRange);
  hintRow.appendChild(resetButton);
  hint.appendChild(hintRow);
  previewCol.appendChild(hint);

  function refresh() {
    previewWrap.innerHTML = "";
    const poster = createCoverElement(state, format, true, {
      onSelect: (index) => {
        state.selectedPanel = index;
        refresh();
      },
      onPan: () => {},
    });
    const boxWidth = previewWrap.clientWidth || previewCol.clientWidth || 800;
    previewWrap.appendChild(fitPoster(poster, boxWidth, format.width, format.height));
    fitBandTitle(poster, format.width);
    caption.textContent = previewCaption(state);
    if (titleInput.value !== state.title) titleInput.value = state.title;
    hintText.textContent =
      "Selected panel " + (state.selectedPanel + 1) + " of 4 — click a panel to select it, drag inside it to crop, or zoom it here.";
    zoomRange.value = String(Math.round(state.panels[state.selectedPanel].zoom * 100));
    thumbs.innerHTML = "";
    state.photos.forEach((photo, i) => {
      const button = document.createElement("button");
      button.className = "thumb" + (state.activePhoto === i ? " active" : "");
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.label;
      const label = document.createElement("span");
      label.textContent = photo.label;
      button.appendChild(img);
      button.appendChild(label);
      button.addEventListener("click", () => {
        state.activePhoto = i;
        state.panels[state.selectedPanel].photo = i;
        refresh();
      });
      thumbs.appendChild(button);
    });
  }

  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;
    let loaded = 0;
    files.forEach((file, n) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base = file.name.replace(/\.[^.]+$/, "");
        state.photos.push({
          id: "user-" + Date.now() + "-" + n,
          label: "Photo " + (state.photos.length + 1) + " · " + base,
          src: reader.result,
        });
        loaded += 1;
        if (loaded === files.length) refresh();
      };
      reader.readAsDataURL(file);
    });
    fileInput.value = "";
  });

  body.appendChild(controls);
  body.appendChild(previewCol);
  editor.appendChild(body);
  app.appendChild(editor);
  refresh();
  window.addEventListener("resize", refresh);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refresh);
  }
}

if (shot.editor) {
  renderEditor();
} else {
  renderCoverStage();
}
