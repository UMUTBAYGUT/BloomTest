import { profilePhotoModule } from "./modelsjs/profilePhoto.js";
import { makeRenderer } from "./helper.js";
import { test1 as UnrealBloomPass } from "./library/TransparentBackgroundFixedUnrealBloomPass.js";
console.log(UnrealBloomPass);
let group;
let bloomComposer, finalComposer;
let combinePass;
let scene3;
let cameraTexture;
const cameraTextureCopyPosition = new THREE.Vector2(0, 0);
const params = {
  exposure: 1,
  bloomStrength: 5,
  bloomThreshold: 0,
  bloomRadius: 0,
};
const xrScene = () => {
  return scene3;
};
const testPipelineModule = () => {
  const initXrScene = ({ scene, camera }) => {
    scene.add(new THREE.AmbientLight(0x404040, 5));
    camera.position.set(0, 3, 0);
    scene.add(camera);
    group.visible = true;
    camera.add(group);
  };
  const onStart = ({ canvas, canvasWidth, canvasHeight, GLctx }) => {
    const scene = new window.THREE.Scene();
    const camera = new window.THREE.PerspectiveCamera(
      60.0 /* initial field of view; will get set based on device info later. */,
      canvasWidth / canvasHeight,
      0.01,
      1000.0
    );
    const renderer = makeRenderer(canvas, canvasWidth, canvasHeight, GLctx);
    bloomComposer = new THREE.EffectComposer(renderer);
    finalComposer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    renderPass.clear = true;
    renderPass.clearDepth = true;

    const smaaPass = new THREE.SMAAPass(canvasWidth, canvasHeight);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );

    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    combinePass = new THREE.ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: document.getElementById("vertexshader").textContent,
        fragmentShader: document.getElementById("fragmentshader").textContent,
        defines: {},
      }),
      "baseTexture"
    );
    //finalPass.needsSwap = true;
    combinePass.clear = false;
    combinePass.renderToScreen = true;

    finalComposer.addPass(renderPass);
    finalComposer.addPass(smaaPass);
    finalComposer.addPass(combinePass);

    bloomComposer.addPass(renderPass);
    bloomComposer.addPass(bloomPass);

    scene3 = { scene, camera, renderer, finalComposer, bloomComposer };
    window.XR8.Threejs.xrScene = xrScene;

    group = new THREE.Object3D();
    profilePhotoModule(group, bloomComposer, finalComposer);

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
    onAttach: ({ video }) => {
      const videoTexture = new THREE.VideoTexture(video);
      if (combinePass) {
        combinePass.uniforms.cameraTexture = { value: videoTexture };
      }
    },
    onRender: () => {
      if (cameraTexture) {
        scene3.renderer.copyFramebufferToTexture(
          cameraTextureCopyPosition,
          cameraTexture
        );
      }
      scene3.composer.render();
    },
    xrScene,
    onUpdate: ({ canvas, processGpuResult, processCpuResult, GLctx }) => {
      const realitySource =
        processCpuResult.reality || processCpuResult.facecontroller;

      if (!realitySource) {
        return;
      }

      const { rotation, position, intrinsics } = realitySource;
      const { camera } = scene3;

      for (let i = 0; i < 16; i++) {
        camera.projectionMatrix.elements[i] = intrinsics[i];
      }

      // Fix for broken raycasting in r103 and higher. Related to:
      //   https://github.com/mrdoob/three.js/pull/15996
      // Note: camera.projectionMatrixInverse wasn't introduced until r96 so check before setting
      // the inverse
      if (camera.projectionMatrixInverse) {
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      }

      if (rotation) {
        camera.setRotationFromQuaternion(rotation);
      }
      if (position) {
        camera.position.set(position.x, position.y, position.z);
      }
    },
    onCanvasSizeChange: ({
      canvasWidth,
      canvasHeight,
      videoWidth,
      videoHeight,
    }) => {
      cameraTexture = new THREE.DataTexture(
        new Uint8Array(canvasWidth * canvasHeight * 3),
        canvasWidth,
        canvasHeight,
        RGBFormat
      );
      if (combinePass) {
        combinePass.uniforms["cameraTexture"] = { value: cameraTexture };
      }

      const { renderer } = scene3;
      renderer.setSize(canvasWidth, canvasHeight);
      // Limit high DPI screens to max of 2
      const pixelRatio = MathUtils.clamp(window.devicePixelRatio, 1, 2);
      renderer.pixelRatio = pixelRatio;
      // Update render pass sizes
      scene3.composer.setSize(
        canvasWidth * pixelRatio,
        canvasHeight * pixelRatio
      );
      scene3.composer.passes.forEach((pass) => {
        if (pass.setSize) {
          pass.setSize(canvasWidth * pixelRatio, canvasHeight * pixelRatio);
        }
      });
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
