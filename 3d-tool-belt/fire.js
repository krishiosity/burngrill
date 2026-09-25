import * as THREE from 'three';

const cube = new THREE.BoxGeometry(1, 1, 1);
const fireMaterial = new THREE.MeshBasicMaterial({ vertexColors: false, toneMapped: false });
fireMaterial.name = 'voxel-fire-material';
const sparkMaterial = new THREE.MeshBasicMaterial({ color: 0xffb43f, toneMapped: false });
sparkMaterial.name = 'voxel-spark-material';

const colors = [0xbd3910, 0xee5711, 0xff8d15, 0xffbc36, 0xffe47a, 0xfff0ae].map(c => new THREE.Color(c));
const temp = new THREE.Object3D();
temp.name = 'fire-instance-transform';
const hash = x => {
  const value = Math.sin(x * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

export class VoxelFire {
  constructor(name, source, options) {
    this.group = new THREE.Group();
    this.group.name = `${name}-fire`;
    this.group.position.set(...source);
    this.height = options.height;
    this.width = options.width;
    this.count = options.count;
    this.amount = 1;
    this.active = true;
    this.seed = hash(name.length * 1.314 + source[0] * 18) * 100;
    this.mesh = new THREE.InstancedMesh(cube, fireMaterial, this.count);
    this.mesh.name = `${name}-flame-voxels`;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.sparks = new THREE.InstancedMesh(cube, sparkMaterial, 12);
    this.sparks.name = `${name}-embers`;
    this.sparks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.sparks.frustumCulled = false;
    this.group.add(this.mesh, this.sparks);
    this.particles = Array.from({ length: this.count }, (_, i) => ({
      a: hash(i * 6.21 + this.seed),
      b: hash(i * 3.11 + 90 + this.seed),
      c: hash(i * 7.17 + 123 + this.seed)
    }));
    this.update(0, 1);
  }

  update(time, dt, reducedMotion = false) {
    const target = this.active ? 1 : 0;
    this.amount = THREE.MathUtils.damp(this.amount, target, 9, dt);
    this.group.visible = this.amount > .015;
    if (!this.group.visible) return;
    const t = reducedMotion ? 4 : time;
    const steppedTime = Math.floor(t * 16) / 16;
    const pulse = 1 + Math.sin(steppedTime * 13 + this.seed) * .09;
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      const progress = (p.a + steppedTime * (.59 + p.c * .42)) % 1;
      const radius = this.width * Math.pow(1 - progress, .8);
      const angle = p.b * Math.PI * 2;
      const edge = Math.sqrt(p.c);
      const drift = Math.sin(progress * 8 - steppedTime * 7 + this.seed) * progress * .09;
      let x = Math.cos(angle) * radius * edge + drift;
      let z = Math.sin(angle) * radius * edge * .63;
      const step = .075;
      x = Math.round(x / step) * step;
      z = Math.round(z / step) * step;
      const y = Math.round(progress * this.height * pulse / step) * step;
      const size = (.085 + (1 - progress) * .10) * this.amount;
      temp.position.set(x, y * this.amount, z);
      temp.rotation.set(0, 0, 0);
      temp.scale.set(size, size * (1.0 + p.c * .4), size);
      temp.updateMatrix();
      this.mesh.setMatrixAt(i, temp.matrix);
      const heat = THREE.MathUtils.clamp((1 - edge * .55 - progress * .42) * 6, 0, 5);
      this.mesh.setColorAt(i, colors[Math.floor(heat)]);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    for (let i = 0; i < 12; i++) {
      const a = hash(i * 15.9 + this.seed);
      const life = (a + t * (.25 + a * .13)) % 1;
      temp.position.set(
        (hash(i * 8.1) - .5) * (.18 + life * .7) + Math.sin(t * 2 + i) * .055,
        this.height * .48 + life * .95,
        (hash(i * 12.3) - .5) * .45
      );
      temp.rotation.set(0, 0, Math.floor(t * 5 + i) * Math.PI / 4);
      const size = .035 * (1 - life) * this.amount;
      temp.scale.set(size, size * 1.5, size);
      temp.updateMatrix();
      this.sparks.setMatrixAt(i, temp.matrix);
    }
    this.sparks.instanceMatrix.needsUpdate = true;
  }
}