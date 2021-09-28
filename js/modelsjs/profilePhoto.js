import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from "../../node_modules/postprocessing";

console.log(EffectPass);

let composer;
const loader = new THREE.GLTFLoader(); // This comes from GLTFLoader.js.

const clock = new THREE.Clock();
const profilePhotoModelFile = "../assets/models/Buttoncenterup.glb";
let profilePhotoModel;
let globalMixer;
let profilePhotoAction;
let profilePhotoAnimation;

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  globalMixer.update(delta);
  composer.render();
}

//requestAnimationFrame(function render() {
// requestAnimationFrame(render);
// composer.render();
//});

export const profilePhotoModule = (group, renderer, camera, scene, canvas) => {
  /* const renderer = new window.THREE.WebGLRenderer({
    canvas,
    alpha: true,
    powerPreference: "high-performance",
    antialias: false,
    stencil: false,
    depth: false,
  });*/
  renderer.autoClear = false;
  renderer.setSize(canvas.width, canvas.height);
  renderer.setClearColor(0xffffff, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.physicallyCorrectLights = true;

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomEffect = new BloomEffect({
    intensity: 1.4,
    luminanceThreshold: 0.6,
    luminanceSmoothing: 0.1,
  });

  composer.addPass(new EffectPass(camera, bloomEffect));

  loader.load(
    profilePhotoModelFile,

    (gltf) => {
      profilePhotoModel = gltf.scene;
      profilePhotoModel.traverse((object) => {
        if (object.isMesh) {
          if (object.name === "buttonUP_pic_main") {
            object.material.map = new THREE.TextureLoader().load(
              "/assets/images2.jpg"
            );
            object.rotation.copy({
              _x: 0,
              _y: 0,
              _z: 210.5,
              _order: "XYZ",
            });
          }
        }
      });
      globalMixer = new THREE.AnimationMixer(profilePhotoModel);
      profilePhotoAnimation = gltf.animations[0];
      profilePhotoAction = globalMixer.clipAction(profilePhotoAnimation);

      profilePhotoModel.scale.set(0.009, 0.009, 0.009);

      profilePhotoAction.play();

      profilePhotoModel.position.set(0, 0, -0.05);
      profilePhotoModel.rotation.copy({ _x: 0, _y: 0, _z: 0, _order: "XYZ" });
      profilePhotoModel.visible = true;
      animate();
      group.add(profilePhotoModel);
    }
  );
};
