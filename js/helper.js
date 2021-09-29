export const makeRenderer = (canvas, canvasWidth, canvasHeight, GLctx) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: GLctx,
    alpha: false,
  });
  renderer.setClearColor(0xff0000, 0);
  renderer.setSize(canvasWidth, canvasHeight);

  return renderer;
};
