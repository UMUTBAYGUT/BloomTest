const {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Vector2,
  MathUtils,
  DataTexture,
  RGBFormat,
  Color,
  WebGLRenderTarget,
  ReinhardToneMapping,
  ShaderPass,
  TexturePass,
  EffectComposer,
} = THREE;
import { UnrealBloomPass } from "./AlphaUnrealBloomPass.js";
const materials = {};
let camera;
let isUploadModal = false;

const bloomPipelineModule = () => {
  let scene3;
  let isSetup = false;
  let combinePass;
  let bloomPass;
  const cameraTextureCopyPosition = new Vector2(0, 0);
  let cameraTexture;
  let sceneTarget;
  let copyPass;

  let width, height;

  console.log(document.getElementById);
  const combineShaderFrag =
    document.getElementById("fragmentshader").textContent;
  const combineShaderVert = document.getElementById("vertexshader").textContent;
  const combineShader = {
    uniforms: {
      cameraTexture: { value: undefined },
      tDiffuse: { value: null },
      useAdditiveBlend: { value: false },
    },
    fragmentShader: combineShaderFrag,
    vertexShader: combineShaderVert,
  };

  const xrScene = () => {
    return scene3;
  };

  const trySetup = ({ canvas, canvasWidth, canvasHeight, GLctx }) => {
    if (isSetup) {
      return;
    }
    isSetup = true;

    width = canvasWidth;
    height = canvasHeight;

    const scene = new Scene();
    scene.name = "Root Scene";
    camera = new PerspectiveCamera(
      60.0 /* initial field of view; will get set based on device info later. */,
      canvasWidth / canvasHeight,
      0.01,
      1000
    );
    scene.add(camera);

    const renderer = new WebGLRenderer({
      canvas,
      context: GLctx,
      alpha: true,
      antialias: true,
    });
    renderer.debug.checkShaderErrors = true;
    renderer.setScissorTest(true);
    renderer.autoClear = false;
    renderer.autoClearDepth = false;
    renderer.setClearColor(0xffffff, 0);
    renderer.setSize(canvasWidth, canvasHeight);

    sceneTarget = new WebGLRenderTarget(canvasWidth, canvasHeight, {
      generateMipmaps: false,
    });

    // Bloom Composer
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;

    // Copy scene into bloom
    copyPass = new TexturePass(sceneTarget.texture);
    bloomComposer.addPass(copyPass);

    // Bloom Pass
    bloomPass = new UnrealBloomPass(
      new Vector2(canvasWidth, canvasHeight),
      2.2,
      0,
      0
    );
    bloomPass.clearColor = new Color(0xffffff);
    bloomPass.threshold = 0.92;
    bloomComposer.addPass(bloomPass);

    const gui = new dat.GUI({ autoPlace: true });
    gui.add(bloomPass, "threshold", 0, 1, 0.01);
    gui.add(bloomPass, "strength", 0, 10, 0.01);
    gui.add(bloomPass, "radius", 0, 3, 0.01);
    gui.add(renderer, "toneMappingExposure", 0, 15, 0.01);
    gui.domElement.style.zIndex = "9999";
    gui.domElement.id = "gui";
    console.log(gui);

    // Final composer
    const composer = new EffectComposer(renderer);
    composer.addPass(copyPass);

    // Combine scene and camerafeed pass
    combinePass = new ShaderPass(combineShader);
    combinePass.clear = false;
    combinePass.renderToScreen = true;
    composer.addPass(combinePass);
    scene.add(new THREE.AmbientLight(0x404040, 3));
    scene3 = { scene, camera, renderer, bloomComposer, composer };
    // @ts-expect-error no type definition
    window.scene3 = scene3;
    // Overwrite the default threejs getter in 8thwall so that you can get the bloomComposer component as well
    window.XR8.Threejs.xrScene = xrScene;
  };

  // WARN: REMOVE ME
  var mx = 0;
  var my = 0;

  document.addEventListener("mousemove", onMouseUpdate, false);
  document.addEventListener("mouseenter", onMouseUpdate, false);

  function onMouseUpdate(e) {
    mx = e.pageX;
    my = e.pageY;
  }
  // END WARN: REMOVE ME

  return {
    name: "customthreejs",
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
      cameraTexture = new DataTexture(
        new Uint8Array(canvasWidth * canvasHeight * 3),
        canvasWidth,
        canvasHeight,
        RGBFormat
      );

      const { renderer } = scene3;
      renderer.setSize(canvasWidth, canvasHeight);
      const pixelRatio = MathUtils.clamp(window.devicePixelRatio, 1, 2);
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
      //  scene3.bloomComposer.render();
      var model = window.GltfModel;
      if (model) {
        if (!isUploadModal) {
          camera.add(model);
          isUploadModal = true;
        }
        const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
        let count = 1;

        model.traverse((obj) => {
          if (obj.isMesh && obj.name !== "buttonUP_rotating") {
            materials[obj.uuid] = obj.material;
            obj.material = darkMaterial;
          }
          count++;
        });

        scene3.bloomComposer.render();

        model.traverse((obj) => {
          if (obj.isMesh) {
            if (materials[obj.uuid]) {
              obj.material = materials[obj.uuid];
              delete materials[obj.uuid];
            }
          }
        });
        scene3.composer.render();
      } else {
        console.log("yok");
      }
      // scene3.composer.render();

      // WARN: Delete me
      const { x, y } = scene3.renderer.getSize();
      scene3.renderer.setScissor(0, 0, mx, y);
      scene3.renderer.clear();
      scene3.renderer.render(scene3.scene, scene3.camera);
      scene3.renderer.setScissor(0, 0, x, y);
      // END WARN: Delte me
    },
    // Get a handle to the xr scene, camera and renderer. Returns:
    // {
    //   scene: The Threejs scene.
    //   camera: The Threejs main camera.
    //   renderer: The Threejs renderer.
    // }
    xrScene,
  };
};

export default bloomPipelineModule;
