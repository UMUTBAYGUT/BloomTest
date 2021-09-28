import { profilePhotoModule } from "./modelsjs/profilePhoto.js";

let group;

const testPipelineModule = () => {
  const initXrScene = ({ scene, camera, renderer }) => {
    scene.add(new THREE.AmbientLight(0x404040, 5));
    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.
    camera.position.set(0, 3, 0);

    scene.add(camera);
    group.visible = true;
    camera.add(group);
  };
  const onStart = ({
    canvas,
    canvasWidth,
    canvasHeight,
    processGpuResult,
    processCpuResult,
  }) => {
    const { scene, camera, renderer } = XR8.Threejs.xrScene();

    group = new THREE.Object3D();
    profilePhotoModule(group, renderer, camera, scene);

    initXrScene({ scene, camera, renderer }); // Add content to the scene and set starting camera position.
    renderer.setSize(window.innerWidth, window.innerHeight);

    // prevent scroll/pinch gestures on canvas
    canvas.addEventListener("touchmove", (event) => {
      event.preventDefault();
    });

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    // Sync the xr controller's 6DoF position and camera paremeters with our scene.
    XR8.XrController.updateCameraProjectionMatrix({
      origin: camera.position,
      facing: camera.quaternion,
    });
  };

  return {
    // Camera pipeline modules need a name. It can be whatever you want but must be
    // unique within your app.
    name: "bloom-test",

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart,
    onUpdate: ({ canvas, processGpuResult, processCpuResult, GLctx }) => {},
    onCanvasSizeChange: ({ canvasWidth, canvasHeight }) => {
      const { camera, renderer } = XR8.Threejs.xrScene();
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasWidth, canvasHeight);
    },
    // Listeners are called right after the processing stage that fired them. This guarantees that
    // updates can be applied at an appropriate synchronized point in the rendering cycle.
    listeners: [
      //  {event: 'reality.imagefound', process: showTarget},
      // {event: 'reality.imageupdated', process: showTarget},
      // {event: 'reality.imagelost', process: hideTarget},
    ],
  };
};

export default testPipelineModule;
