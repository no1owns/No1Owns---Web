import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Sets up the scene, camera, renderer and orbit controls for a single
// container element, and exposes just what app.js needs: swap in a new
// object, and reset the camera to a sensible framing of it.
export function createViewer(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101010);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 5000);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(120, -160, 220);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-150, 120, -100);
  scene.add(fill);

  const grid = new THREE.GridHelper(400, 20, 0x333333, 0x1c1c1c);
  grid.rotation.x = Math.PI / 2; // objects are modeled flat in the XY plane
  scene.add(grid);

  let currentObject = null;
  const defaultCamera = { position: new THREE.Vector3(0, -260, 220), target: new THREE.Vector3(0, 0, 0) };

  function setObject(object3D) {
    if (currentObject) {
      scene.remove(currentObject);
      currentObject.traverse(child => child.geometry && child.geometry.dispose());
    }
    currentObject = object3D;
    scene.add(currentObject);
    frameToObject(currentObject);
  }

  // Recomputes the "home" camera position/target from the object's actual
  // bounding sphere, then applies it — used on load, object switch, and
  // whenever geometry is rebuilt so Reset View always frames what's visible.
  function frameToObject(object3D) {
    const box = new THREE.Box3().setFromObject(object3D);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const dist = Math.max(sphere.radius * 2.6, 80);
    defaultCamera.position.set(sphere.center.x, sphere.center.y - dist, sphere.center.z + dist * 0.75);
    defaultCamera.target.copy(sphere.center);
    resetView();
  }

  function resetView() {
    camera.position.copy(defaultCamera.position);
    controls.target.copy(defaultCamera.target);
    controls.update();
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  (function animate() {
    requestAnimationFrame(animate);
    controls.update(); // required each frame when damping is enabled
    renderer.render(scene, camera);
  })();

  return { setObject, resetView };
}
