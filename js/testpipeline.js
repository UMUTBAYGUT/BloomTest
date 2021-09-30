import { profilePhotoModule } from "./modelsjs/profilePhoto.js";
//import { test1 as UnrealBloomPass } from "./library/TransparentNew.js";
import { test1 as UnrealBloomPass } from "./library/TransparentBackgroundFixedUnrealBloomPass.js";

console.log(UnrealBloomPass);
let group;
const materials = {};

const combineShader = {
  uniforms: {
    cameraTexture: { value: undefined },
    tDiffuse: { value: null },
    useAdditiveBlend: { value: false },
  },
  fragmentShader: document.getElementById("fragmentshader").textContent,
  vertexShader: document.getElementById("vertexshader").textContent,
};

export const BLOOM_SCENE = 1;
export const ALL_SCENE = 0;
export const bloomLayer = new THREE.Layers();
bloomLayer.enable(1);
const defaultThreeSettings = {
  useBloom: true,
};

const testPipelineModule = () => {
  //const settings = Object.assign({}, defaultThreeSettings, _settings);
  let scene3;
  let isSetup = false;
  let combinePass;
  let bloomPass;
  const cameraTextureCopyPosition = new THREE.Vector2(0, 0);
  let cameraTexture;
  let sceneTarget;
  let copyPass;
  const xrScene = () => {
    return scene3;
  };

  const trySetup = ({ canvas, canvasWidth, canvasHeight, GLctx }) => {
    if (isSetup) {
      return;
    }
    isSetup = true;
    const scene = new THREE.Scene();
    scene.name = "Root Scene";
    const camera = new THREE.PerspectiveCamera(
      60.0,
      /* initial field of view; will get set based on device info later. */ canvasWidth /
        canvasHeight,
      0.01,
      1000
    );
    scene.add(camera);
    scene.add(new THREE.AmbientLight(0x404040, 5));
    const renderer = new THREE.WebGLRenderer({
      canvas,
      context: GLctx,
      alpha: true,
      antialias: true,
    });
    renderer.debug.checkShaderErrors = true;
    renderer.autoClear = false;
    renderer.autoClearDepth = false;
    renderer.setClearColor(0xffffff, 0);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.3;
    renderer.setSize(canvasWidth, canvasHeight);
    sceneTarget = new THREE.WebGLRenderTarget(canvasWidth, canvasHeight, {
      generateMipmaps: false,
    });
    // Bloom Composer
    const bloomComposer = new THREE.EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    // Copy scene into bloom
    copyPass = new THREE.TexturePass(sceneTarget.texture);
    bloomComposer.addPass(copyPass);
    // Bloom Pass
    if (/*settings.useBloom*/ true) {
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(canvasWidth, canvasHeight),
        2.2,
        0.7,
        0.0
      );
      bloomPass.clearColor = new THREE.Color(0xffffff);
      bloomPass.threshold = 0.77;
      bloomComposer.addPass(bloomPass);
      const gui = new dat.GUI({ autoPlace: true });
      gui.add(bloomPass, "threshold", 0, 1, 0.01);
      gui.add(bloomPass, "strength", 0, 3, 0.01);
      gui.add(bloomPass, "radius", 0, 3, 0.01);
      gui.add(renderer, "toneMappingExposure", 0, 5, 0.01);
      gui.domElement.style.zIndex = "9999";
    }
    // Final composer
    const composer = new THREE.EffectComposer(renderer);
    composer.addPass(copyPass);
    // Combine scene and camerafeed pass
    combinePass = new THREE.ShaderPass(combineShader);
    combinePass.clear = false;
    combinePass.renderToScreen = true;
    composer.addPass(combinePass);
    scene3 = { scene, camera, renderer, bloomComposer, composer };
    // @ts-expect-error no type definition
    window.scene3 = scene3;
    // Overwrite the default threejs getter in 8thwall so that you can get the bloomComposer component as well
    window.XR8.Threejs.xrScene = xrScene;

    group = new THREE.Object3D();

    profilePhotoModule(group, scene3.bloomComposer, scene3.composer);
    group.visible = true;
    camera.add(group);
  };

  const initXrScene = ({ scene, camera }) => {
    camera.position.set(0, 3, 0);
  };

  return {
    // Camera pipeline modules need a name. It can be whatever you want but must be
    // unique within your app.
    name: "bloom-test",

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart: (args) => trySetup(args),
    onDetach: () => {
      isSetup = false;
    },
    onUpdate: ({ processCpuResult }) => {
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
      if (!isSetup) {
        return;
      }
      cameraTexture = new THREE.DataTexture(
        new Uint8Array(canvasWidth * canvasHeight * 3),
        canvasWidth,
        canvasHeight,
        THREE.RGBFormat
      );
      const { renderer } = scene3;
      renderer.setSize(canvasWidth, canvasHeight);
      const pixelRatio = THREE.MathUtils.clamp(window.devicePixelRatio, 1, 2);
      renderer.pixelRatio = pixelRatio;
      //
      // Update render pass sizes
      scene3.bloomComposer.setSize(
        canvasWidth * pixelRatio,
        canvasHeight * pixelRatio
      );
      scene3.bloomComposer.passes.forEach((pass) => {
        if (pass.setSize) {
          pass.setSize(canvasWidth * pixelRatio, canvasHeight * pixelRatio);
        }
      });
      scene3.composer.setSize(
        canvasWidth * pixelRatio,
        canvasHeight * pixelRatio
      );
      scene3.composer.passes.forEach((pass) => {
        if (pass.setSize) {
          pass.setSize(canvasWidth * pixelRatio, canvasHeight * pixelRatio);
        }
      });
      if (bloomPass && combinePass && sceneTarget && copyPass) {
        combinePass.uniforms["cameraTexture"] = { value: cameraTexture };
        combinePass.uniforms.bloomTexture = {
          value: bloomPass.renderTargetsHorizontal[0],
        };
        combinePass.uniforms.isLocal = { value: window.isLocal ? true : false };
        sceneTarget.setSize(
          canvasWidth * pixelRatio,
          canvasHeight * pixelRatio
        );
        copyPass.uniforms["tDiffuse"] = { value: sceneTarget.texture };
      }
    },
    onRender: () => {
      // renderer.render(scene, camera)
      if (cameraTexture) {
        scene3.renderer.copyFramebufferToTexture(
          cameraTextureCopyPosition,
          cameraTexture
        );
      }
      if (sceneTarget) {
        scene3.renderer.setRenderTarget(sceneTarget);
      }
      scene3.renderer.clear();
      scene3.renderer.clearDepth();
      scene3.renderer.render(scene3.scene, scene3.camera);
      scene3.renderer.setRenderTarget(null);
      //scene3.bloomComposer.render();
      if (scene3.camera.children[0].children[0]) {
        //console.log(scene3.camera.children[0].children[0]);
        // alert("bekle");

        const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
        let count = 1;

        scene3.camera.children[0].children[0].traverse((obj) => {
          if (obj.isMesh && obj.name !== "buttonUP_rotating") {
            materials[obj.uuid] = obj.material;
            obj.material = darkMaterial;
          }
          count++;
        });

        scene3.bloomComposer.render();

        scene3.camera.children[0].children[0].traverse((obj) => {
          if (obj.isMesh) {
            if (materials[obj.uuid]) {
              obj.material = materials[obj.uuid];
              delete materials[obj.uuid];
            }
          }
        });

        scene3.composer.render();
      }

      //scene3.composer.render();
    },
    // Get a handle to the xr scene, camera and renderer. Returns:
    // {
    //   scene: The Threejs scene.
    //   camera: The Threejs main camera.
    //   renderer: The Threejs renderer.
    // }
    xrScene,
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
