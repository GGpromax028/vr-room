import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

document.body.style.margin = '0';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.update();

// Room size in meters
const width = 7;
const depth = 6;
const height = 2.7;

function createSurface(w, h, color) {
  const geometry = new THREE.PlaneGeometry(w, h);
  const material = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}

// Floor with wood texture
// Floor with switchable textures
const textureLoader = new THREE.TextureLoader();

function loadFloorTexture(path, repeatX, repeatY) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

const floorTextures = {
  wood: loadFloorTexture('textures/wood.jpg', 3.5, 3),
  tiles: loadFloorTexture('textures/tiles.jpg', 3.5, 3),
};

const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTextures.wood });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Button to switch the floor
let currentFloor = 'wood';
const button = document.createElement('button');
button.textContent = 'Boden: Holz';
Object.assign(button.style, {
  position: 'fixed',
  top: '20px',
  left: '20px',
  padding: '12px 20px',
  fontSize: '16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
});
document.body.appendChild(button);

button.addEventListener('click', () => {
  currentFloor = currentFloor === 'wood' ? 'tiles' : 'wood';
  floorMaterial.map = floorTextures[currentFloor];
  floorMaterial.needsUpdate = true;
  button.textContent = currentFloor === 'wood' ? 'Boden: Holz' : 'Boden: Fliesen';
});
// Ceiling
const ceiling = createSurface(width, depth, 0xf5f5f5);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = height;
scene.add(ceiling);

// Walls
const backWall = createSurface(width, height, 0xe8e2d6);
backWall.position.set(0, height / 2, -depth / 2);
scene.add(backWall);

const frontWall = createSurface(width, height, 0xe8e2d6);
frontWall.position.set(0, height / 2, depth / 2);
scene.add(frontWall);

const leftWall = createSurface(depth, height, 0xd9d2c3);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-width / 2, height / 2, 0);
scene.add(leftWall);

const rightWall = createSurface(depth, height, 0xd9d2c3);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(width / 2, height / 2, 0);
scene.add(rightWall);

// Simple light so we can see the room
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const lamp = new THREE.PointLight(0xffffff, 10);
lamp.position.set(0, height - 0.2, 0);
scene.add(lamp);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => renderer.render(scene, camera));

// Furniture: sofa
const gltfLoader = new GLTFLoader();
gltfLoader.load('models/sofa/Sofa_01_1k.gltf', (gltf) => {
  const sofa = gltf.scene;
  sofa.position.set(0, 0, -depth / 2 + 0.6);
  sofa.scale.setScalar(1.3);
  scene.add(sofa);
});

// Furniture: coffee table
gltfLoader.load('models/table/modern_coffee_table_01_1k.gltf', (gltf) => {
  const table = gltf.scene;
  table.rotation.y = Math.PI / 2;
  table.position.set(0, 0, -depth / 2 + 1.8);
  scene.add(table);
});

// High-end 77" OLED TV, wall-mounted, opposite the sofa
const tvGroup = new THREE.Group();
const wallZ = depth / 2;

//Long floating lowboard
const lowboard = new THREE.Mesh(
new THREE.BoxGeometry(2.6, 0.4, 0.42),
new THREE.MeshStandardMaterial({
map: loadFloorTexture('textures/wood.jpg', 2, 0.35),
color: 0xfff3e0,
roughness: 0.5,
})
);
lowboard.position.set(0, 0.35, wallZ - 0.21);
tvGroup.add(lowboard);


// Ultra-thin TV body
const tvWidth = 1.71;
const tvHeight = 0.98;
const tvY = 1.35;
const tvBody = new THREE.Mesh(
  new THREE.BoxGeometry(tvWidth, tvHeight, 0.025),
  new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2, metalness: 0.6 })
);
tvBody.position.set(0, tvY, wallZ - 0.04);
tvGroup.add(tvBody);

// Glowing screen with a colorful gradient image
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 288;
const ctx = canvas.getContext('2d');
const gradient = ctx.createLinearGradient(0, 0, 512, 288);
gradient.addColorStop(0, '#0b1a4a');
gradient.addColorStop(0.5, '#6a1b9a');
gradient.addColorStop(1, '#ff6f3c');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 512, 288);
const screenTexture = new THREE.CanvasTexture(canvas);
screenTexture.colorSpace = THREE.SRGBColorSpace;

const tvScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(tvWidth - 0.02, tvHeight - 0.02),
  new THREE.MeshBasicMaterial({ map: screenTexture })
);
tvScreen.rotation.y = Math.PI; // face the sofa
tvScreen.position.set(0, tvY, wallZ - 0.054);
tvGroup.add(tvScreen);

// Ambient backlight glowing on the wall behind the TV
const backlight = new THREE.PointLight(0x7c4dff, 3, 2.5);
backlight.position.set(0, tvY, wallZ - 0.1);
tvGroup.add(backlight);

scene.add(tvGroup);

// Walking with arrow keys or WASD
const keys = {};
window.addEventListener('keydown', (e) => (keys[e.code] = true));
window.addEventListener('keyup', (e) => (keys[e.code] = false));

const clock = new THREE.Clock();
const speed = 2; // meters per second
const margin = 0.3; // distance to the walls

function updateMovement(delta) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

  const move = new THREE.Vector3();
  if (keys['KeyW'] || keys['ArrowUp']) move.add(forward);
  if (keys['KeyS'] || keys['ArrowDown']) move.sub(forward);
  if (keys['KeyD'] || keys['ArrowRight']) move.add(right);
  if (keys['KeyA'] || keys['ArrowLeft']) move.sub(right);
  if (move.lengthSq() === 0) return;

  move.normalize().multiplyScalar(speed * delta);

  const next = camera.position.clone().add(move);
  const limitX = width / 2 - margin;
  const limitZ = depth / 2 - margin;
  next.x = THREE.MathUtils.clamp(next.x, -limitX, limitX);
  next.z = THREE.MathUtils.clamp(next.z, -limitZ, limitZ);

  const offset = next.clone().sub(camera.position);
  camera.position.add(offset);
  controls.target.add(offset);
}

renderer.setAnimationLoop(() => {
  updateMovement(clock.getDelta());
  controls.update();
  renderer.render(scene, camera);
});