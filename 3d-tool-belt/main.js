import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createTools } from './tools.js';
import { VoxelFire } from './fire.js';
import { createEnvironment } from './environment.js';

const stage = document.getElementById('stage');
const scene = new THREE.Scene();
scene.name = 'emberworks-workshop';
scene.background = new THREE.Color(0x1c110c);

const camera = new THREE.OrthographicCamera(-10,10,4,-4,.1,100);
camera.name = 'tool-belt-orthographic-camera';
camera.position.set(0,-7.6,22);
camera.lookAt(0,0,0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera,renderer.domElement);
controls.target.set(0,0,0);
controls.enableDamping = true;
controls.dampingFactor = .065;
controls.rotateSpeed = .65;
controls.panSpeed = .65;
controls.minZoom = .55;
controls.maxZoom = 4;
controls.minPolarAngle = .1;
controls.maxPolarAngle = Math.PI-.1;

const environment = createEnvironment(scene);
const tools = createTools();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const angles = [-.55,-.49,-.55,-.56,-.47];
let selected = 0;
let hovered = -1;
let inspecting = false;
let elapsed = 0;
let lastTime = performance.now();

tools.forEach((tool,index) => {
  tool.root.userData.toolIndex = index;
  tool.root.position.set((index-2)*3.25,-.05,.30);
  tool.root.rotation.set(.055,-.08,angles[index]);
  tool.root.scale.setScalar(index===1 ? .89 : 1);
  tool.homeScale = index===1 ? .89 : 1;
  tool.lit = true;
  tool.fireEffect = new VoxelFire(tool.root.name,tool.source,tool.fire);
  tool.root.add(tool.fireEffect.group);
  scene.add(tool.root);
});

function select(index) {
  selected=index;
}
function ignite() {
  const tool=tools[selected];
  tool.lit=!tool.lit;
  tool.fireEffect.active=tool.lit;
}
function fitCamera() {
  const width=stage.clientWidth;
  const height=stage.clientHeight;
  if(!width || !height) return;
  const aspect=width/height;
  const worldWidth=inspecting ? 7.8 : 18.9;
  const worldHeight=inspecting ? 6.8 : 6.75;
  const h=Math.max(worldHeight,worldWidth/aspect);
  camera.left=-h*aspect/2;
  camera.right=h*aspect/2;
  camera.top=h/2;
  camera.bottom=-h/2;
  camera.updateProjectionMatrix();
  renderer.setSize(width,height,false);
}
function resetView() {
  controls.reset();
  controls.target.set(0,0,0);
  camera.position.set(0,-7.6,22);
  camera.zoom=1;
  camera.lookAt(controls.target);
  camera.updateProjectionMatrix();
  controls.update();
}
function inspect() {
  inspecting=!inspecting;
  hovered=-1;
  environment.tray.visible=!inspecting;
  environment.inspection.visible=inspecting;
  fitCamera();
  resetView();
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPosition=null;
let pointerIsDown=false;
function hitTool(event) {
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const meshes=[];
  tools.forEach((tool,index) => {
    if (inspecting && index!==selected) return;
    tool.root.traverse(child => {
      if(child.isMesh && !child.isInstancedMesh) meshes.push(child);
    });
  });
  const hits=raycaster.intersectObjects(meshes,false);
  if(!hits.length) return -1;
  let object=hits[0].object;
  while(object && object.userData.toolIndex===undefined) object=object.parent;
  return object?.userData.toolIndex ?? -1;
}
renderer.domElement.addEventListener('pointerdown',event => {
  downPosition={ x:event.clientX,y:event.clientY };
  pointerIsDown=true;
});
renderer.domElement.addEventListener('pointermove',event => {
  if(!pointerIsDown) {
    hovered=hitTool(event);
    renderer.domElement.style.cursor=hovered>=0 ? 'pointer' : 'grab';
  }
});
window.addEventListener('pointerup',event => {
  if(!pointerIsDown) return;
  pointerIsDown=false;
  if(downPosition && Math.hypot(event.clientX-downPosition.x,event.clientY-downPosition.y)<6
      && event.target===renderer.domElement) {
    const index=hitTool(event);
    if(index>=0) select(index);
  }
  downPosition=null;
});
renderer.domElement.addEventListener('pointerleave',() => hovered=-1);
renderer.domElement.addEventListener('pointercancel',() => {
  pointerIsDown=false;
  downPosition=null;
});
renderer.domElement.addEventListener('dblclick',event => {
  const index=hitTool(event);
  if(index>=0) {
    select(index);
    if(!inspecting) inspect();
  }
});
window.addEventListener('keydown',event => {
  if(event.target.matches('input,textarea,select') || event.metaKey || event.ctrlKey || event.altKey) return;
  if(event.repeat) return;
  const key=event.key.toLowerCase();
  if(/^[1-5]$/.test(key)) select(Number(key)-1);
  if(key==='i') { event.preventDefault(); inspect(); }
  if(key==='r') resetView();
  if(key==='escape' && inspecting) inspect();
  if((key==='enter' || key===' ') && !event.target.closest('button,a')) {
    event.preventDefault();
    ignite();
  }
});
window.addEventListener('blur',() => {
  pointerIsDown=false;
  downPosition=null;
});

const targetPosition = new THREE.Vector3();
function animate(now) {
  const dt=Math.min((now-lastTime)/1000,.045);
  lastTime=now;
  elapsed+=dt;
  const ease=1-Math.exp(-dt*9);
  for(let i=0;i<tools.length;i++) {
    const tool=tools[i];
    const active=i===selected;
    const float=reducedMotion ? 0 : Math.sin(elapsed*1.6+i*1.7)*.018;
    const lift=active?.15:0;
    targetPosition.set(
      inspecting ? 0 : (i-2)*3.25,
      inspecting ? -.12 : -.12+float,
      inspecting ? .42 : .29+lift+(hovered===i?.1:0)
    );
    tool.root.position.lerp(targetPosition,ease);
    const targetScale=inspecting ? (active?1.37*tool.homeScale:.001) : tool.homeScale;
    const scale=THREE.MathUtils.damp(tool.root.scale.x,targetScale,10,dt);
    tool.root.scale.setScalar(scale);
    tool.root.visible=!inspecting || active || scale>.02;
    tool.root.rotation.z=THREE.MathUtils.damp(tool.root.rotation.z,inspecting?-.28:angles[i],9,dt);
    tool.root.rotation.y=THREE.MathUtils.damp(tool.root.rotation.y,inspecting?-.17:-.08,8,dt);
    if(tool.lid) tool.lid.rotation.z=THREE.MathUtils.damp(tool.lid.rotation.z,tool.lit?1.95:0,10,dt);
    if(tool.root.visible) tool.fireEffect.update(elapsed,dt,reducedMotion);
  }
  environment.selection.position.x=THREE.MathUtils.damp(environment.selection.position.x,(selected-2)*3.25,12,dt);
  controls.update();
  renderer.render(scene,camera);
}
new ResizeObserver(fitCamera).observe(stage);
fitCamera();
renderer.setAnimationLoop(animate);