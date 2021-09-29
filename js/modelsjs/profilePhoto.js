// eslint-disable-next-line no-undef
import { test1 as UnrealBloomPass } from "../library/TransparentBackgroundFixedUnrealBloomPass.js";
//import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/postprocessing/EffectComposer.js";
console.log(UnrealBloomPass);

//Start Imp To Bloom
let bloomComposer, finalComposer;
const materials = {};

const params = {
  exposure: 1,
  bloomStrength: 5,
  bloomThreshold: 0,
  bloomRadius: 0,
};
const canvReference = document.getElementById("camerafeed");
const renderer = new THREE.WebGLRenderer({
  canvas: canvReference,
  alpha: true,
});
renderer.setClearColor(0xff0000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);

bloomPass.threshold = params.bloomThreshold;
bloomPass.strength = params.bloomStrength;
bloomPass.radius = params.bloomRadius;
const composer = new THREE.EffectComposer(renderer);

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
  const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
  let count = 1;
  profilePhotoModel.traverse((obj) => {
    if (obj.isMesh && obj.name !== "buttonUP_rotating") {
      materials[obj.uuid] = obj.material;
      obj.material = darkMaterial;
    }
    count++;
  });

  bloomComposer.render();

  profilePhotoModel.traverse((obj) => {
    if (obj.isMesh) {
      if (materials[obj.uuid]) {
        obj.material = materials[obj.uuid];
        delete materials[obj.uuid];
      }
    }
  });

  finalComposer.render();
}

export const profilePhotoModule = (group, rendererOld, camera, scene) => {
  //Start Bloom Effect
  const renderPass = new THREE.RenderPass(scene, camera);

  bloomComposer = new THREE.EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(bloomPass);

  const finalPass = new THREE.ShaderPass(
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
  finalPass.needsSwap = true;

  finalComposer = new THREE.EffectComposer(renderer);
  finalComposer.addPass(renderPass);
  finalComposer.addPass(finalPass);

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
