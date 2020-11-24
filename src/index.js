import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import * as Tone from "tone";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./styles.css";

let scene, camera, renderer;
let colour, intensity, light;
let ambientLight;
let gridHelper;

let orbit;

let sceneHeight, sceneWidth;

let clock, delta, interval;
let player, meter;
let modelLoaded;
let robot, flamingo;

let loader;
let mixers;

let startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
  // remove overlay
  let overlay = document.getElementById("overlay");
  overlay.remove();
  Tone.start();
  modelLoaded = false;
  //create our clock and set interval at 30 fpx
  clock = new THREE.Clock();
  delta = 0;
  interval = 1 / 25;

  //create our scene
  sceneWidth = window.innerWidth;
  sceneHeight = window.innerHeight;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdedede);

  //create camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 10;
  //specify our renderer and add it to our document
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //create the orbit controls instance so we can use the mouse move around our scene
  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableZoom = true;

  // lighting
  colour = 0xffffff;
  intensity = 1;
  light = new THREE.DirectionalLight(colour, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  gridHelper = new THREE.GridHelper(1000, 100);
  scene.add(gridHelper);

  player = new Tone.Player("./sounds/Warrpy_Beat.mp3", () => {
    player.loop = true;
    player.autostart = true;
  }).toDestination();

  meter = new Tone.Meter();
  meter.smoothing = 0.8;

  player.connect(meter);

  mixers = [];
  loadModels();

  window.addEventListener("resize", onWindowResize, false); //resize callback
  play();
}

// stop animating (not currently used)
function stop() {
  renderer.setAnimationLoop(null);
}

// simple render function

function render() {
  renderer.render(scene, camera);
}

// start animating

function play() {
  //using the new setAnimationLoop method which means we are WebXR ready if need be
  renderer.setAnimationLoop(() => {
    update();
    render();
  });
}

//our update function

function update() {
  orbit.update();
  //update stuff in here
  delta += clock.getDelta();

  if (delta > interval) {
    // The draw or time dependent code are here
    //iterate through animation mixers
    for (let i = 0; i < mixers.length; i++) {
      mixers[i].update(delta);
    }

    if (modelLoaded) {
      robot.position.z = THREE.MathUtils.mapLinear(
        // linearly mapping one value range to another value range
        meter.getValue(), //input value is the RMS level of the audio signal coming from the player
        -60, // lower input value limit
        -12, // upper input value limit
        0.0, // lower output value limit
        4.0 // upper output value limit
      );
    }
    delta = delta % interval;
  }
}

function onWindowResize() {
  //resize & align
  sceneHeight = window.innerHeight;
  sceneWidth = window.innerWidth;
  renderer.setSize(sceneWidth, sceneHeight);
  camera.aspect = sceneWidth / sceneHeight;
  camera.updateProjectionMatrix();
}

function loadModels() {
  loader = new GLTFLoader();

  // A reusable function to set up the models. We're passing in a position parameter
  // so that they can be individually placed around the scene
  const onLoadAnimation = function (gltf, position) {
    flamingo = gltf.scene.children[0]; // assign the first child of the scene contained in the gltf file to a variable called flamingo
    flamingo.scale.multiplyScalar(0.125); // scale our model to make it smaller
    flamingo.position.copy(position); //copy the position passed from the load function call

    const animation = gltf.animations[0]; // get the animation

    const mixer = new THREE.AnimationMixer(flamingo); //create a new animation mixer and assign pass our new model to it

    mixers.push(mixer); // add our animation mixer to our mixers array

    const action = mixer.clipAction(animation); // pass the animation to the animation scheduler in the animation mixer
    action.play(); // start the animation scheduling

    scene.add(flamingo); // add our model to our scene
  };

  const onLoadStatic = function (gltf, position) {
    robot = gltf.scene.children[0]; // assign the first child of the scene contained in the gltf file to a variable called robot
    robot.scale.multiplyScalar(1.125);
    robot.position.copy(position); //copy the position passed from the load function call

    modelLoaded = true; // once our model has loaded, set our modelLoaded boolean flag to true
    scene.add(robot); // add our model to the scene
  };

  // the loader will report the loading progress to this function
  const onProgress = function () {
    console.log("progress");
  };

  // the loader will send any error messages to this function, and we'll log
  // them to to console
  const onError = function (errorMessage) {
    console.log(errorMessage);
  };

  const flamingoPosition = new THREE.Vector3(-10.5, 0, -10); // create new vector for the position of our flamingo
  loader.load(
    // call the loader's load function
    "models/Flamingo.glb", // specify our file path
    function (gltf) {
      // specify the callback function to call once the model has loaded
      onLoadAnimation(gltf, flamingoPosition);
    },
    onProgress, // specify progress callback
    onError // specify error callback
  );

  const flamingoPosition2 = new THREE.Vector3(10.5, 0, -10); // create new vector for the position of our flamingo
  loader.load(
    // call the loader's load function
    "models/Flamingo.glb", // specify our file path
    function (gltf) {
      // specify the callback function to call once the model has loaded
      onLoadAnimation(gltf, flamingoPosition2);
    },
    onProgress, // specify progress callback
    onError // specify error callback
  );

  const robotPos = new THREE.Vector3(0, 0, 0);
  loader.load(
    // call the loader's load function
    "models/robot.gltf", // specify our file path
    function (gltf) {
      // specify the callback function to call once the model has loaded
      onLoadStatic(gltf, robotPos);
    },
    onProgress, // specify progress callback
    onError // specify error callback
  );
}
