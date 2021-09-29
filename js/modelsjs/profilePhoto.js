// eslint-disable-next-line no-undef
import { test1 as UnrealBloomPass } from "../library/TransparentBackgroundFixedUnrealBloomPass.js";
//import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/postprocessing/EffectComposer.js";
console.log(UnrealBloomPass);

//Start Imp To Bloom
const canvReference = document.getElementById("camerafeed");
const renderer = new THREE.WebGLRenderer({
  canvas: canvReference,
  alpha: true,
});
renderer.setClearColor(0xff0000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  4,
  1,
  0.1
);
const composer = new EffectComposer(renderer);

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

export const profilePhotoModule = (group, rendererOld, camera, scene) => {
  //Start Bloom Effect
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

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
