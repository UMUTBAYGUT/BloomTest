const profilePhotoModelFile = "./assets/models/Buttoncenterup.glb";

const appPipelineModule = () => {
  let scene, camera, renderer, clock, mixer;
  const loader = new THREE.GLTFLoader();
  return {
    // Camera pipeline modules need a name. It can be whatever you want but must be
    // unique within your app.
    name: "app",

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart: (args) => {
      const {
        scene: _scene,
        camera: _camera,
        renderer: _renderer,
      } = window.XR8.Threejs.xrScene();
      scene = _scene;
      camera = _camera;
      renderer = _renderer;
      clock = new THREE.Clock();

      const axes = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          color: 0xff0000,
        })
      );
      // camera.add(axes);
      axes.position.set(0, 0, -2);

      loader.load(profilePhotoModelFile, (gltf) => {
        const model = gltf.scene;
        model.traverse((object) => {
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
        mixer = new THREE.AnimationMixer(model);
        const animation = gltf.animations[0];
        const action = mixer.clipAction(animation);

        action.play();

        model.position.set(0, 0, -5);
        model.rotation.copy({ _x: 0, _y: 0, _z: 0, _order: "XYZ" });
        model.visible = true;
        window.GltfModel = model;
        camera.add(model);
      });
    },
    onDetach: () => {},
    onUpdate: ({ processCpuResult }) => {
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
    },
    // Get a handle to the xr scene, camera and renderer. Returns:
    // {
    //   scene: The Threejs scene.
    //   camera: The Threejs main camera.
    //   renderer: The Threejs renderer.
    // }
    // Listeners are called right after the processing stage that fired them. This guarantees that
    // updates can be applied at an appropriate synchronized point in the rendering cycle.
    listeners: [
      //  {event: 'reality.imagefound', process: showTarget},
      // {event: 'reality.imageupdated', process: showTarget},
      // {event: 'reality.imagelost', process: hideTarget},
    ],
  };
};

export default appPipelineModule;
