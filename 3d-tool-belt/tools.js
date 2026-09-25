import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const toolData = [
  { label: 'Hammer', name: 'Forge hammer', category: 'STRIKING TOOL', material: 'Brass & oak', description: 'A brass-bound head, a leather-wrapped grip, and a little extra heat.' },
  { label: 'Flamethrower', name: 'Pocket inferno', category: 'FLAME PROJECTOR', material: 'Copper & iron', description: 'Twin copper chambers. One very persuasive argument. Handle with care.' },
  { label: 'Axe', name: 'Cinder cleaver', category: 'CUTTING TOOL', material: 'Steel & hickory', description: 'A keen, fire-kissed edge set on a weathered hickory handle.' },
  { label: 'Match', name: 'The last match', category: 'FIRE STARTER', material: 'Pine & phosphorus', description: 'Sometimes all you need is a little spark. This one keeps on giving.' },
  { label: 'Lighter', name: 'Old faithful', category: 'POCKET LIGHTER', material: 'Brushed brass', description: 'A reassuring click. A steady flame. A companion for the long night.' }
];

const palette = {
  iron: [0x332d26, .42, .65],
  black: [0x171512, .65, .25],
  steel: [0xada18b, .35, .55],
  edge: [0xf0cf84, .3, .5],
  brass: [0xa96e26, .4, .48],
  gold: [0xd49436, .33, .45],
  copper: [0xb34f1d, .5, .4],
  wood: [0x6c3518, .86, 0],
  woodLight: [0xa96328, .82, 0],
  leather: [0x362118, .92, 0],
  leatherLight: [0x593222, .88, 0],
  match: [0xd1a564, .9, 0],
  red: [0x9c2b13, .85, 0],
  hot: [0xe86416, .6, .1]
};
const materials = Object.fromEntries(Object.entries(palette).map(([name, [color, roughness, metalness]]) => {
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  material.name = `tool-material-${name}`;
  return [name, material];
}));

class Builder {
  constructor(name) { this.name = name; this.parts = {}; }
  add(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(1, 1, 1)
    );
    g.applyMatrix4(matrix);
    (this.parts[material] ??= []).push(g);
    return this;
  }
  box(material, size, position, rotation) {
    return this.add(new THREE.BoxGeometry(...size), material, position, rotation);
  }
  cylinder(material, radius, height, position, rotation = [0, 0, 0], sides = 8) {
    return this.add(new THREE.CylinderGeometry(radius, radius, height, sides, 1, false), material, position, rotation);
  }
  profile(material, points, depth, z = 0, bevel = .025, holes = []) {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath();
    for (const coords of holes) {
      const hole = new THREE.Path();
      coords.forEach(([x, y], i) => i ? hole.lineTo(x, y) : hole.moveTo(x, y));
      hole.closePath();
      shape.holes.push(hole);
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
      bevelSegments: 1, steps: 1, curveSegments: 4
    });
    return this.add(geo, material, [0, 0, z - depth / 2]);
  }
  finish() {
    const root = new THREE.Group();
    root.name = this.name;
    for (const [material, geometries] of Object.entries(this.parts)) {
      const geometry = mergeGeometries(geometries, false);
      geometries.forEach(g => g.dispose());
      const mesh = new THREE.Mesh(geometry, materials[material]);
      mesh.name = `${this.name}-${material}`;
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      root.add(mesh);
    }
    return root;
  }
}

function handle(b, top = 1.08, bottom = -1.4) {
  b.box('wood', [.22, top - bottom, .24], [0, (top + bottom) / 2, 0]);
  b.box('woodLight', [.06, top - bottom - .12, .025], [-.07, (top + bottom) / 2, .132]);
  for (let i = 0; i < 7; i++) {
    b.box(i % 2 ? 'leather' : 'leatherLight', [.29, .11, .3], [0, bottom + .17 + i * .13, 0], [0, 0, -.06]);
    b.box('black', [.05, .07, .015], [.07, bottom + .18 + i * .13, .159]);
  }
  b.box('brass', [.3, .13, .31], [0, bottom + .03, 0]);
  b.box('gold', [.1, .04, .025], [-.06, bottom + .02, .17]);
}

function hammer() {
  const b = new Builder('forge-hammer');
  handle(b);
  b.box('iron', [.32, .37, .32], [0, .79, 0]);
  b.profile('iron', [[-.76,.86],[-.68,.75],[.63,.75],[.74,.87],[.74,1.27],[.61,1.38],[-.65,1.38],[-.76,1.27]], .5);
  b.box('brass', [.26,.53,.56], [-.59,1.06,0]);
  b.box('gold', [.17,.47,.58], [-.76,1.06,0]);
  b.box('brass', [.27,.55,.57], [.59,1.06,0]);
  b.box('edge', [.10,.47,.56], [.77,1.06,0]);
  b.box('gold', [.74,.08,.03], [-.03,1.33,.275]);
  b.box('black', [.12,.31,.028], [-.05,1.05,.27]);
  b.box('brass', [.075,.12,.035], [.19,1.13,.29]);
  for (let i = 0; i < 4; i++) b.box('edge', [.08,.065,.015], [-.76+(i%2)*.11,.92+Math.floor(i/2)*.22,.3]);
  return { root: b.finish(), source: [-.56,1.36,.03], fire: { height: .65, width: .29, count: 64 } };
}

function flamethrower() {
  const b = new Builder('pocket-inferno');
  b.box('leather', [.32,.76,.36], [.12,-1.06,0], [0,0,-.16]);
  for(let i=0;i<5;i++) b.box('black', [.35,.055,.39], [.12-i*.017,-1.34+i*.13,0], [0,0,-.16]);
  b.box('brass', [.36,.13,.4], [.17,-1.45,0]);
  b.cylinder('copper', .28, 1.04, [-.3,-.13,-.02]);
  b.cylinder('brass', .19, .16, [-.3,.46,-.02]);
  b.cylinder('iron', .12, .15, [-.3,.61,-.02]);
  b.cylinder('gold', .295, .11, [-.3,-.54,-.02]);
  b.cylinder('brass', .295, .10, [-.3,.20,-.02]);
  b.box('gold', [.09,.64,.035], [-.43,-.12,.25]);
  b.box('iron', [.40,1.25,.39], [.23,.35,.01]);
  b.box('brass', [.12,.73,.44], [.22,.35,.02]);
  for(let i=0;i<5;i++) b.box('black', [.49,.10,.45], [.23,.3+i*.16,.02]);
  b.box('copper', [.36,.22,.39], [.23,1.14,.02]);
  b.box('gold', [.49,.15,.49], [.23,1.31,.02]);
  b.box('black', [.32,.018,.31], [.23,1.397,.02]);
  b.box('hot', [.12,.025,.13], [.23,1.412,.02]);
  b.profile('brass', [[.22,-.86],[.66,-.8],[.75,-.29],[.3,-.21]], .17, .01, .018,
    [[[.36,-.7],[.42,-.35],[.61,-.37],[.55,-.67]]]);
  b.box('black', [.06,.22,.12], [.47,-.4,.01], [0,0,-.2]);
  const pipe = [[-.4,-.68],[-.61,-.68],[-.7,-.57],[-.7,-.33],[-.65,-.12]];
  pipe.forEach(([x,y],i) => b.box('iron',[i===1?.25:.12,.18,.13],[x,y,.01]));
  b.box('gold', [.21,.14,.19], [-.59,-.12,.01]);
  b.box('iron', [.40,.23,.41], [.03,-.67,0]);
  return { root: b.finish(), source: [.23,1.41,.02], fire: { height: 1.12, width: .25, count: 110 } };
}

function axe() {
  const b = new Builder('cinder-cleaver');
  handle(b,1.2,-1.45);
  b.box('iron', [.38,.51,.37], [.015,1.0,0]);
  const outline = [[-.22,.8],[-.22,1.23],[.17,1.29],[.59,1.57],[.83,1.54],[1.04,1.3],[1.08,.91],[.94,.52],[.71,.59],[.35,.78]];
  b.profile('iron', outline, .26, 0, .025);
  b.profile('brass', [[.05,.9],[.09,1.15],[.54,1.42],[.75,1.43],[.91,1.24],[.95,.94],[.84,.69],[.68,.75],[.31,.89]], .045, .165, .012);
  b.profile('edge', [[.78,1.5],[1.0,1.28],[1.04,.92],[.92,.56],[.8,.65],[.9,.95],[.87,1.23],[.67,1.46]], .3, 0, .01);
  b.box('gold', [.075,.075,.035], [.22,1.04,.205]);
  b.box('black', [.12,.10,.015], [.53,1.12,.20]);
  b.box('brass', [.30,.10,.32], [0,.69,0]);
  return { root: b.finish(), source: [.78,1.5,0], fire: { height: .69, width: .24, count: 66 } };
}

function match() {
  const b = new Builder('last-match');
  b.box('match', [.17,2.2,.17], [0,-.37,0]);
  b.box('woodLight', [.048,2.11,.02], [.064,-.4,.095]);
  for (let i=0;i<7;i++) b.box('woodLight', [.038,.18,.012], [-.05+(i%3)*.04,-1.34+i*.23,.096]);
  b.box('wood', [.19,.4,.19], [0,.69,0]);
  b.box('black', [.20,.24,.20], [0,.85,0]);
  b.box('red', [.34,.42,.32], [0,1.05,0]);
  b.box('red', [.43,.24,.34], [0,1.07,0]);
  b.box('copper', [.23,.12,.31], [0,1.3,0]);
  b.box('hot', [.12,.16,.02], [-.09,1.16,.177]);
  b.box('black', [.10,.1,.02], [.10,.94,.18]);
  b.box('gold', [.09,.085,.025], [-.07,1.27,.165]);
  return { root: b.finish(), source: [0,1.29,0], fire: { height: .93, width: .29, count: 92 } };
}

function lighter() {
  const b = new Builder('old-faithful');
  b.profile('brass', [[-.42,-1.14],[-.49,-1.06],[-.49,.17],[.49,.17],[.49,-1.06],[.42,-1.14]], .47, 0, .04);
  b.box('gold', [.085,1.12,.018], [-.415,-.46,.28]);
  b.box('edge', [.025,1.02,.018], [-.437,-.46,.3]);
  b.box('copper', [.69,.89,.025], [.03,-.48,.281]);
  b.box('brass', [.59,.79,.018], [.03,-.48,.299]);
  b.box('black', [.76,.04,.48], [0,.15,0]);
  b.box('iron', [.54,.54,.31], [-.04,.44,0]);
  b.box('steel', [.50,.05,.34], [-.04,.72,0]);
  for(let y=0;y<3;y++) for(let x=0;x<3;x++) b.box('black',[.069,.076,.018],[-.22+x*.16,.30+y*.14,.169]);
  b.cylinder('steel', .13,.18,[.32,.38,.02],[0,0,Math.PI/2],12);
  for(let i=0;i<5;i++) b.box('iron',[.19,.025,.045],[.32,.29+i*.044,.13]);
  b.box('gold', [.10,.10,.12], [.02,.73,0]);
  b.box('leather', [.07,.12,.07], [.02,.8,0]);
  [[-.13,-.57,.09,.24],[.01,-.48,.09,.40],[.15,-.56,.09,.26]].forEach(([x,y,w,h]) => b.box('gold',[w,h,.02],[x,y,.322]));
  b.box('iron',[.12,.28,.54],[-.49,.13,0]);

  const lidBuilder = new Builder('lighter-lid');
  lidBuilder.box('gold',[.96,.10,.52],[.46,.70,0]);
  lidBuilder.box('brass',[.07,.62,.52],[.02,.35,0]);
  lidBuilder.box('brass',[.07,.62,.52],[.90,.35,0]);
  lidBuilder.box('brass',[.88,.65,.045],[.46,.36,-.245]);
  lidBuilder.box('gold',[.88,.65,.045],[.46,.36,.245]);
  lidBuilder.box('edge',[.67,.045,.02],[.41,.655,.277]);
  lidBuilder.box('copper',[.6,.38,.02],[.46,.36,.28]);
  const root = b.finish();
  const lid = lidBuilder.finish();
  lid.position.set(-.49,.15,0);
  lid.rotation.z = 1.95;
  root.add(lid);
  return { root, lid, source: [.02,.85,0], fire: { height: .69, width: .2, count: 64 } };
}

export function createTools() {
  return [hammer(), flamethrower(), axe(), match(), lighter()];
}