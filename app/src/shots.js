// Shot definitions: which scene the page shows for each screenshot.

export const SHOTS = {
  cover: { format: "landscape", editor: false },
  editor: { format: "landscape", editor: true },
  "cover-portrait": { format: "portrait", editor: false },
  "cover-square": { format: "square", editor: false },
};

export function readShot() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("shot") || "cover";
  return SHOTS[name] || SHOTS.cover;
}

export function applyShot(state, shot) {
  if (shot.editor) {
    state.title = "Boulevard Queen";
  }
  return state;
}
