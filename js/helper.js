export const makeRenderer = (canvas, canvasWidth, canvasHeight, GLctx) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: GLctx,
    alpha: true,
    antialias: true,
  });
  renderer.autoClear = false;
  renderer.setSize(canvasWidth, canvasHeight);

  return renderer;
};
