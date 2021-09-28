import testPipelineModule from "./testpipeline.js";

const onxrloaded = () => {
  // If your app only interacts with image targets and not the world, disabling world tracking can
  // improve speed.
  XR8.XrController.configure({ disableWorldTracking: true });
  XR8.addCameraPipelineModules([
    // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.GlTextureRenderer.pipelineModule(), // Draws the camera feed.
    XR8.Threejs.pipelineModule(), // Creates a ThreeJS AR Scene.
    XR8.XrController.pipelineModule(), // Enables SLAM tracking.
    XRExtras.AlmostThere.pipelineModule(), // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(), // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(), // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(), // Shows an error image on runtime error.
    // Custom pipeline modules.
    testPipelineModule(), // Places 3d model and video content over detected image targets.
  ]);

  // Open the camera and start running the camera run loop.
  XR8.run({
    canvas: document.getElementById("camerafeed"),
    allowedDevices: XR8.XrConfig.device().ANY,
  });
};

// Show loading screen before the full XR library has been loaded.
const load = () => {
  XRExtras.Loading.showLoading({ onxrloaded });
};
window.onload = () => {
  window.XRExtras ? load() : window.addEventListener("xrextrasloaded", load);
};
