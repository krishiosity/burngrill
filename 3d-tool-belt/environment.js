import * as THREE from 'three';

export function createEnvironment(scene) {
  const tray = new THREE.Group();
  tray.name = 'tool-belt-tray';
  scene.add(tray);
  const materials = {
    leather: new THREE.MeshStandardMaterial({ color: 0x74310e, roughness: .96 }),
    inset: new THREE.MeshStandardMaterial({ color: 0x622407, roughness: .92 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x211813, roughness: .7, metalness: .2 }),
    brass: new THREE.MeshStandardMaterial({ color: 0x996332, roughness: .48, metalness: .4 }),
    edge: new THREE.MeshStandardMaterial({ color: 0xb4763a, roughness: .42, metalness: .38 }),
    groove: new THREE.MeshStandardMaterial({ color: 0x421d0c, roughness: 1 }),
    select: new THREE.MeshBasicMaterial({ color: 0xd59547 })
  };
  Object.entries(materials).forEach(([name, mat]) => mat.name = `tray-${name}-material`);
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  function box(name, size, pos, material, parent = tray) {
    const mesh = new THREE.Mesh(unitBox, materials[material]);
    mesh.name = name;
    mesh.scale.set(...size);
    mesh.position.set(...pos);
    mesh.receiveShadow = material === 'leather' || material === 'inset';
    parent.add(mesh);
    return mesh;
  }

  box('belt-dark-backing', [17.35,5.5,.29], [0,0,-.35], 'dark');
  box('belt-leather-bed', [16.98,5.1,.14], [0,0,-.14], 'leather');
  box('belt-top-outer-rail', [17.34,.12,.23], [0,2.67,-.17], 'dark');
  box('belt-bottom-outer-rail', [17.34,.14,.23], [0,-2.67,-.17], 'dark');
  for (const sign of [-1,1]) {
    const side = sign < 0 ? 'left' : 'right';
    box(`${side}-vertical-brass-rail`, [.10,5.32,.2], [sign*8.42,0,-.03], 'brass');
    box(`${side}-outer-rail`, [.11,5.5,.28], [sign*8.65,0,-.1], 'dark');
    box(`${side}-inner-edge`, [.035,5.15,.035], [sign*8.28,0,-.015], 'edge');
    box(`${side}-belt-end`, [.22,1.08,.26], [sign*8.82,0,-.22], 'brass');
    box(`${side}-belt-end-inset`, [.12,.79,.29], [sign*8.83,0,-.23], 'dark');
  }
  for(const [label,y] of [['top',2.52],['bottom',-2.52]]) {
    box(`${label}-brass-piping`, [16.75,.06,.075], [0,y,-.025], 'brass');
    box(`${label}-inner-seam`, [16.5,.027,.03], [0,y*.94,-.052], 'groove');
  }

  for(let i=0;i<5;i++) {
    const x=(i-2)*3.25;
    box(`slot-${i}-leather-inlay`, [3.06,4.62,.022], [x,0,-.052], 'inset');
    box(`slot-${i}-bottom-seam`, [2.7,.025,.025], [x,-2.18,-.027], 'brass');
  }
  for(let i=0;i<4;i++) box(`slot-divider-${i}`, [.022,4.62,.015], [(i-1.5)*3.25,0,-.027], 'groove');

  const screwGeometry = new THREE.CylinderGeometry(.054,.054,.035,8);
  screwGeometry.rotateX(Math.PI/2);
  const rivets = new THREE.InstancedMesh(screwGeometry,materials.edge,20);
  rivets.name = 'belt-brass-rivets';
  const dummy = new THREE.Object3D();
  dummy.name = 'rivet-placement-helper';
  let n=0;
  for(let i=0;i<10;i++) for(const y of [-2.52,2.52]) {
    dummy.position.set(-7.9+i*(15.8/9),y,.02);
    dummy.updateMatrix();
    rivets.setMatrixAt(n++,dummy.matrix);
  }
  tray.add(rivets);

  const selection = new THREE.Group();
  selection.name = 'active-slot-brackets';
  tray.add(selection);
  for(const x of [-1.42,1.42]) for(const y of [-2.23,2.23]) {
    const tag = `${x}-${y}`;
    box(`selection-horizontal-${tag}`, [.28,.035,.025], [x-Math.sign(x)*.12,y,.008], 'select', selection);
    box(`selection-vertical-${tag}`, [.035,.23,.025], [x,y-Math.sign(y)*.10,.008], 'select', selection);
  }
  selection.position.x=-6.5;

  const inspection = new THREE.Group();
  inspection.name = 'inspection-platform';
  inspection.visible = false;
  scene.add(inspection);
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(2.65,2.7,.17,64),materials.inset);
  disk.name = 'inspection-leather-disk';
  disk.rotation.x=Math.PI/2;
  disk.position.z=-.23;
  disk.receiveShadow=true;
  inspection.add(disk);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.63,.022,6,96),materials.brass);
  ring.name = 'inspection-brass-ring';
  ring.position.z=-.13;
  inspection.add(ring);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(2.70,.035,6,96),materials.dark);
  baseRing.name = 'inspection-dark-ring';
  baseRing.position.z=-.2;
  inspection.add(baseRing);

  const ambient = new THREE.AmbientLight(0xe4c5a3,.82);
  ambient.name = 'warm-workshop-ambient';
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffd6a0,2.7);
  key.name = 'upper-left-workshop-light';
  key.position.set(-5,8,13);
  key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-11,right:11,top:7,bottom:-7,near:.5,far:35});
  key.shadow.bias=-.001;
  key.shadow.normalBias=.02;
  key.shadow.radius=3;
  key.target.name='workshop-light-target';
  scene.add(key,key.target);
  const fill = new THREE.DirectionalLight(0xec9a54,.75);
  fill.name='right-hand-fill';
  fill.position.set(7,-1,5);
  scene.add(fill);
  const top = new THREE.DirectionalLight(0xffe6b8,.7);
  top.name='top-edge-fill';
  top.position.set(0,8,3);
  scene.add(top);

  return { tray, selection, inspection };
}