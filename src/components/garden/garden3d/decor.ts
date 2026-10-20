/**
 * Chi tiết tạo sức sống cho Vườn tri thức 3D — dựng bằng code, ít đa giác, gom draw call:
 *   cầu gỗ đỏ Nhật (một mesh), đèn lồng giấy treo dưới tán đào (instanced, phát sáng ấm, đung đưa),
 *   cá koi bơi chậm trong hồ (instanced), bướm bay quanh hoa (instanced, vỗ cánh bằng shader).
 * Mọi chuyển động chỉ cập nhật ma trận / uniform mỗi khung hình — không tạo lại geometry.
 */
import * as THREE from 'three';
import { hashUnit } from '@/features/garden/garden-layout';
import { type Part, merge, part, m4 } from './procedural';

const RED = new THREE.Color('#C8372D');
const RED_DARK = new THREE.Color('#9E2A24');
const DECK = new THREE.Color('#9B6A42');
const CAP = new THREE.Color('#3A3330');

/**
 * Cầu vòm Nhật (taiko-bashi) dài `span` m: mặt cầu ván gỗ cong vồng, hai lan can son đỏ có cột + đầu cột giboshi.
 * Toạ độ cục bộ: trục X dọc cầu, gốc ở giữa cầu, y = 0 là chân cầu ở hai đầu.
 */
export function buildBridge(span = 4.2, width = 1.15, rise = 0.55): THREE.BufferGeometry {
  const parts: Part[] = [];
  const archY = (x: number) => rise * Math.cos((x / span) * Math.PI) ** 1.0 * (1 - (2 * x / span) ** 2 * 0.15);
  const planks = 20;
  for (let index = 0; index < planks; index += 1) {
    const x = -span / 2 + (index + 0.5) * (span / planks);
    const slope = Math.atan2(archY(x + 0.01) - archY(x - 0.01), 0.02);
    parts.push(part(new THREE.BoxGeometry(span / planks - 0.015, 0.06, width), index % 2 ? DECK : DECK.clone().multiplyScalar(0.92),
      m4(x, archY(x) + 0.05, 0, 1, [0, 0, slope]), 700 + index, 0.04));
  }
  // Dầm đỡ hai bên (đỏ đậm) bám theo vòm.
  for (const side of [-1, 1]) {
    const beam = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, index) => {
      const x = -span / 2 + (index / 8) * span;
      return new THREE.Vector3(x, archY(x) - 0.02, side * (width / 2 + 0.02));
    }));
    parts.push(part(new THREE.TubeGeometry(beam, 24, 0.06, 6, false), RED_DARK, m4(), 720, 0.03));
    // Lan can: cột + tay vịn cong.
    const posts = 7;
    for (let index = 0; index < posts; index += 1) {
      const x = -span / 2 + 0.15 + (index / (posts - 1)) * (span - 0.3);
      const base = archY(x);
      parts.push(part(new THREE.BoxGeometry(0.07, 0.62, 0.07), RED, m4(x, base + 0.36, side * (width / 2 - 0.02)), 730 + index, 0.03));
      if (index === 0 || index === posts - 1) {
        // Đầu cột giboshi (núm hình búp hoa) ở hai đầu cầu.
        parts.push(part(new THREE.SphereGeometry(0.07, 10, 8), CAP, m4(x, base + 0.72, side * (width / 2 - 0.02), [1, 1.1, 1]), 740, 0.02));
        parts.push(part(new THREE.ConeGeometry(0.045, 0.1, 10), CAP, m4(x, base + 0.82, side * (width / 2 - 0.02)), 741, 0.02));
      }
    }
    const rail = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, index) => {
      const x = -span / 2 + 0.15 + (index / 8) * (span - 0.3);
      return new THREE.Vector3(x, archY(x) + 0.66, side * (width / 2 - 0.02));
    }));
    parts.push(part(new THREE.TubeGeometry(rail, 32, 0.045, 8, false), RED, m4(), 750, 0.03));
    const midRail = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, index) => {
      const x = -span / 2 + 0.15 + (index / 8) * (span - 0.3);
      return new THREE.Vector3(x, archY(x) + 0.36, side * (width / 2 - 0.02));
    }));
    parts.push(part(new THREE.TubeGeometry(midRail, 32, 0.03, 6, false), RED, m4(), 751, 0.03));
  }
  // Chân cầu: hai cặp cột trụ cắm xuống bờ.
  for (const end of [-1, 1]) for (const side of [-1, 1]) {
    parts.push(part(new THREE.CylinderGeometry(0.07, 0.08, 0.7, 8), RED_DARK, m4(end * (span / 2 - 0.35), archY(end * (span / 2 - 0.35)) - 0.32, side * (width / 2 - 0.08)), 760, 0.03));
  }
  return merge(parts);
}

/* ───────── Đèn lồng giấy (chōchin) ───────── */

export interface LanternHandle {
  meshes: THREE.Object3D[];
  update: (time: number) => void;
  dispose: () => void;
}

/** Đèn lồng treo ở các điểm `anchors` (điểm treo trên cành), dây dài `drop` m; đung đưa nhẹ, ánh giấy ấm phát sáng. */
export function buildHangingLanterns(anchors: readonly THREE.Vector3[], reducedMotion: boolean): LanternHandle {
  const paperGeometry = new THREE.SphereGeometry(0.2, 16, 12);
  paperGeometry.scale(1, 1.3, 1);
  const ribs: Part[] = [];
  for (const y of [-0.14, 0, 0.14]) ribs.push(part(new THREE.TorusGeometry(0.2 * Math.sqrt(1 - (y / 0.26) ** 2) + 0.004, 0.006, 4, 24), RED_DARK, m4(0, y, 0, 1, [Math.PI / 2, 0, 0]), 800, 0));
  ribs.push(part(new THREE.CylinderGeometry(0.1, 0.11, 0.05, 12), CAP, m4(0, 0.27, 0), 801, 0));
  ribs.push(part(new THREE.CylinderGeometry(0.11, 0.1, 0.05, 12), CAP, m4(0, -0.27, 0), 802, 0));
  ribs.push(part(new THREE.CylinderGeometry(0.006, 0.006, 1, 4), new THREE.Color('#5A4632'), m4(0, 0.79, 0), 803, 0)); // dây treo
  const frameGeometry = merge(ribs);
  const paperMaterial = new THREE.MeshStandardMaterial({ color: '#E0412A', emissive: '#FF5A22', emissiveIntensity: 0.45, roughness: 0.75 });
  const frameMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
  const paper = new THREE.InstancedMesh(paperGeometry, paperMaterial, Math.max(1, anchors.length));
  const frame = new THREE.InstancedMesh(frameGeometry, frameMaterial, Math.max(1, anchors.length));
  paper.count = frame.count = anchors.length;
  paper.castShadow = false;
  frame.castShadow = false;
  const pivot = new THREE.Object3D();
  const matrix = new THREE.Matrix4();
  const hang = new THREE.Matrix4().makeTranslation(0, -1.3, 0); // tâm đèn cách điểm treo 1.3 m
  const place = (time: number) => {
    anchors.forEach((anchor, index) => {
      const sway = reducedMotion ? 0 : Math.sin(time * 0.9 + index * 1.7) * 0.06;
      pivot.position.copy(anchor);
      pivot.rotation.set(sway * 0.6, index * 0.8, sway);
      pivot.updateMatrix();
      matrix.multiplyMatrices(pivot.matrix, hang);
      paper.setMatrixAt(index, matrix);
      frame.setMatrixAt(index, matrix);
    });
    paper.instanceMatrix.needsUpdate = true;
    frame.instanceMatrix.needsUpdate = true;
  };
  place(0);
  return {
    meshes: [paper, frame],
    update: place,
    dispose: () => { paperGeometry.dispose(); frameGeometry.dispose(); paperMaterial.dispose(); frameMaterial.dispose(); paper.dispose(); frame.dispose(); },
  };
}

/* ───────── Cá koi ───────── */

function koiGeometry(pattern: 'kohaku' | 'orange'): THREE.BufferGeometry {
  const white = new THREE.Color('#FFF6EE');
  const red = new THREE.Color(pattern === 'kohaku' ? '#E2412F' : '#F2932E');
  const body = new THREE.SphereGeometry(0.12, 14, 10);
  body.scale(2.6, 0.75, 1);
  const shaped = body.toNonIndexed();
  body.dispose();
  shaped.deleteAttribute('uv');
  const position = shaped.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    // Đốm màu loang trên lưng (kohaku: đỏ trên nền trắng; ogon: cam gần kín).
    const spot = Math.sin(x * 22 + 1) * Math.cos(z * 18) + (pattern === 'orange' ? 0.7 : 0);
    const color = spot > 0.1 && position.getY(index) > -0.02 ? red : white;
    colors.set([color.r, color.g, color.b], index * 3);
  }
  shaped.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const tail = part(new THREE.ConeGeometry(0.1, 0.22, 4, 1), white, m4(-0.38, 0, 0, [1, 1, 0.25], [0, 0, Math.PI / 2]), 820, 0);
  const finLeft = part(new THREE.CircleGeometry(0.06, 6), red, m4(0.08, -0.04, 0.1, 1, [-Math.PI / 2.4, 0, 0]), 821, 0);
  const finRight = part(new THREE.CircleGeometry(0.06, 6), red, m4(0.08, -0.04, -0.1, 1, [Math.PI / 2.4, 0, 0]), 822, 0);
  return merge([shaped, tail, finLeft, finRight]);
}

export interface KoiHandle {
  meshes: THREE.Object3D[];
  update: (time: number) => void;
  dispose: () => void;
}

/** Cá koi bơi vòng chậm quanh hồ hình elip (tâm cx, cz; bán kính rx, rz), dưới mặt nước `waterY`. */
export function buildKoi(cx: number, cz: number, rx: number, rz: number, waterY: number, reducedMotion: boolean): KoiHandle {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, side: THREE.DoubleSide });
  const fish = (['kohaku', 'orange', 'kohaku', 'kohaku', 'orange'] as const).map((pattern) => pattern);
  const geometries = { kohaku: koiGeometry('kohaku'), orange: koiGeometry('orange') };
  const groups = {
    kohaku: new THREE.InstancedMesh(geometries.kohaku, material, fish.filter((p) => p === 'kohaku').length),
    orange: new THREE.InstancedMesh(geometries.orange, material, fish.filter((p) => p === 'orange').length),
  };
  const dummy = new THREE.Object3D();
  const update = (time: number) => {
    const counters = { kohaku: 0, orange: 0 };
    fish.forEach((pattern, index) => {
      const speed = 0.12 + hashUnit(`koi:${index}`) * 0.06;
      const lane = 0.35 + hashUnit(`koi-l:${index}`) * 0.4;
      const direction = index % 2 ? 1 : -1;
      const angle = (reducedMotion ? 0 : time) * speed * direction + index * 1.3;
      const x = cx + Math.cos(angle) * rx * lane;
      const z = cz + Math.sin(angle) * rz * lane;
      dummy.position.set(x, waterY - 0.14 - hashUnit(`koi-d:${index}`) * 0.06, z);
      // Hướng đầu theo tiếp tuyến quỹ đạo + lắc thân nhẹ khi bơi.
      const heading = Math.atan2(Math.cos(angle) * rz * direction, -Math.sin(angle) * rx * direction);
      dummy.rotation.set(0, -heading + Math.PI / 2 + Math.sin(time * 3 + index) * 0.12 * (reducedMotion ? 0 : 1), 0);
      dummy.scale.setScalar(0.9 + hashUnit(`koi-s:${index}`) * 0.4);
      dummy.updateMatrix();
      groups[pattern].setMatrixAt(counters[pattern]++, dummy.matrix);
    });
    groups.kohaku.instanceMatrix.needsUpdate = true;
    groups.orange.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return {
    meshes: [groups.kohaku, groups.orange],
    update,
    dispose: () => { geometries.kohaku.dispose(); geometries.orange.dispose(); material.dispose(); groups.kohaku.dispose(); groups.orange.dispose(); },
  };
}

/* ───────── Bướm ───────── */

export interface ButterflyHandle {
  mesh: THREE.InstancedMesh;
  update: (time: number) => void;
  dispose: () => void;
}

/** Bướm bay lượn chậm quanh các điểm hoa `spots`; vỗ cánh trong vertex shader (một InstancedMesh). */
export function buildButterflies(spots: ReadonlyArray<{ x: number; y: number; z: number }>, reducedMotion: boolean): ButterflyHandle {
  // Hai cánh: mỗi cánh một tam giác đôi, gốc cánh nằm trên trục X (thân bướm).
  const wing = new THREE.BufferGeometry();
  const w = 0.09;
  wing.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, 0.05, 0, w, -0.05, 0, w * 0.9, // cánh phải
    0, 0, 0, -0.05, 0, -w * 0.9, 0.05, 0, -w, // cánh trái
  ], 3));
  wing.setAttribute('side', new THREE.Float32BufferAttribute([0, 1, 1, 0, -1, -1], 1));
  wing.computeVertexNormals();
  const time = { value: 0 };
  const material = new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float side;\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float flap = sin(uTime * 14.0 + float(gl_InstanceID) * 1.7) * 0.9 + 0.3;
        float lift = abs(transformed.z) * sin(flap) * side * side;
        transformed.y += lift;
        transformed.z *= cos(flap) * 0.9 + 0.1;`);
  };
  material.customProgramCacheKey = () => 'garden-butterfly';
  const mesh = new THREE.InstancedMesh(wing, material, Math.max(1, spots.length));
  mesh.count = spots.length;
  const palette = ['#FFF4C7', '#FFFFFF', '#FFC7DA', '#CFE8FF', '#FFD58A'].map((hex) => new THREE.Color(hex));
  spots.forEach((_, index) => mesh.setColorAt(index, palette[index % palette.length]));
  const dummy = new THREE.Object3D();
  const update = (seconds: number) => {
    time.value = reducedMotion ? 0 : seconds;
    spots.forEach((spot, index) => {
      const t = (reducedMotion ? 0 : seconds) * (0.35 + hashUnit(`bf:${index}`) * 0.2) + index * 2.1;
      const x = spot.x + Math.sin(t) * 0.9 + Math.sin(t * 2.3) * 0.25;
      const z = spot.z + Math.cos(t * 0.8) * 0.8;
      const y = spot.y + Math.sin(t * 1.7) * 0.25;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, Math.atan2(Math.cos(t), -Math.sin(t * 0.8)) , 0);
      dummy.scale.setScalar(1.3);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return { mesh, update, dispose: () => { wing.dispose(); material.dispose(); mesh.dispose(); } };
}

/* ───────── Biển gỗ nhóm kiến thức ───────── */

/** Kích thước mặt biển (m) — lớp chữ HTML phủ đúng lên mặt này (chữ sắc nét, số liệu thật). */
export const SIGN_FACE = { width: 2.0, height: 0.86, centerY: 1.42 };

/**
 * Biển gỗ đứng trong vườn: hai cọc gỗ, khung gỗ dày bo cạnh, mặt kem, khóm hoa nhỏ trên mép, chân đá + cỏ.
 * Toạ độ cục bộ: mặt biển hướng +Z, chân ở y = 0. Chữ / tiến độ do HTML phủ lên (cập nhật theo dữ liệu thật).
 */
export function buildSignboard(RoundedBox: new (w: number, h: number, d: number, segments: number, radius: number) => THREE.BufferGeometry): THREE.BufferGeometry {
  const wood = new THREE.Color('#9C6B40');
  const woodDark = new THREE.Color('#7D5332');
  const cream = new THREE.Color('#FBF3E3');
  const parts: Part[] = [];
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.CylinderGeometry(0.075, 0.09, 1.55, 10), woodDark, m4(side * 0.86, 0.775, -0.02), 900, 0.05));
    parts.push(part(new THREE.SphereGeometry(0.1, 10, 8), woodDark, m4(side * 0.86, 1.94, -0.02, [1, 0.6, 1]), 901, 0.04));
    // đá chân cọc
    parts.push(part(new THREE.DodecahedronGeometry(0.16, 0), new THREE.Color('#B8B0A2'), m4(side * 0.86, 0.05, 0.02, [1.2, 0.6, 1]), 902, 0.08));
  }
  parts.push(part(new RoundedBox(SIGN_FACE.width + 0.24, SIGN_FACE.height + 0.22, 0.14, 3, 0.07), wood, m4(0, SIGN_FACE.centerY, 0), 903, 0.05));
  parts.push(part(new RoundedBox(SIGN_FACE.width, SIGN_FACE.height, 0.04, 2, 0.05), cream, m4(0, SIGN_FACE.centerY, 0.06), 904, 0.02));
  // khóm hoa nhỏ ở hai góc trên
  const pink = new THREE.Color('#F7A9C0');
  const leaf = new THREE.Color('#6FAE5E');
  for (const [x, scale] of [[-0.92, 1], [0.78, 0.8]] as const) {
    parts.push(part(new THREE.SphereGeometry(0.13 * scale, 10, 8), leaf, m4(x, SIGN_FACE.centerY + 0.52, 0.05, [1.4, 0.8, 1]), 905, 0.06));
    for (let petal = 0; petal < 4; petal += 1) {
      parts.push(part(new THREE.SphereGeometry(0.055 * scale, 8, 6), petal % 2 ? pink : new THREE.Color('#FFFFFF'),
        m4(x + (petal - 1.5) * 0.07 * scale, SIGN_FACE.centerY + 0.6 + (petal % 2) * 0.03, 0.1), 906 + petal, 0.03));
    }
  }
  return merge(parts);
}

/** Cổng torii son đỏ (kasagi cong, nuki, hai trụ đen chân). Gốc ở giữa hai trụ, y = 0. */
export function buildTorii(): THREE.BufferGeometry {
  const red = new THREE.Color('#D2402F');
  const black = new THREE.Color('#2E2724');
  const parts: Part[] = [];
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.CylinderGeometry(0.17, 0.2, 3.6, 14), red, m4(side * 1.35, 1.8, 0, 1, [0, 0, side * 0.03]), 920, 0.03));
    parts.push(part(new THREE.CylinderGeometry(0.23, 0.25, 0.35, 14), black, m4(side * 1.37, 0.17, 0), 921, 0.03));
  }
  parts.push(part(new THREE.BoxGeometry(3.4, 0.2, 0.3), red, m4(0, 2.85, 0), 922, 0.03)); // nuki
  // kasagi: dầm trên cong vểnh hai đầu
  const curve = new THREE.CatmullRomCurve3([-2.2, -1.1, 0, 1.1, 2.2].map((x) => new THREE.Vector3(x, 3.55 + (Math.abs(x) / 2.2) ** 2 * 0.28, 0)));
  parts.push(part(new THREE.TubeGeometry(curve, 24, 0.17, 8, false), black, m4(0, 0.05, 0, [1, 1, 1.5]), 923, 0.03));
  parts.push(part(new THREE.TubeGeometry(curve, 24, 0.15, 8, false), red, m4(0, -0.22, 0, [0.97, 1, 1.3]), 924, 0.03));
  parts.push(part(new THREE.BoxGeometry(0.22, 0.6, 0.22), red, m4(0, 3.15, 0), 925, 0.03)); // gakuzuka
  return merge(parts);
}

/** Nhà gỗ Nhật nhỏ: nền đá, tường kem khung gỗ, cửa giấy sáng ấm, mái ngói xám-lục vểnh nhẹ. */
export function buildHouse(): THREE.BufferGeometry {
  const parts: Part[] = [];
  const wood = new THREE.Color('#8A5C36');
  parts.push(part(new THREE.BoxGeometry(4.6, 0.4, 3.6), new THREE.Color('#BDB4A4'), m4(0, 0.2, 0), 940, 0.06));
  parts.push(part(new THREE.BoxGeometry(4.0, 2.1, 3.0), new THREE.Color('#F4EAD6'), m4(0, 1.45, 0), 941, 0.03));
  for (const x of [-2, -0.67, 0.67, 2]) parts.push(part(new THREE.BoxGeometry(0.14, 2.15, 3.06), wood, m4(x, 1.45, 0), 942, 0.04));
  parts.push(part(new THREE.BoxGeometry(4.1, 0.14, 3.08), wood, m4(0, 2.45, 0), 943, 0.04));
  // cửa giấy (shoji) phát sáng ấm phía trước
  parts.push(part(new THREE.BoxGeometry(1.2, 1.5, 0.04), new THREE.Color('#FFE6B5'), m4(0, 1.2, 1.52), 944, 0.02));
  // mái: hai mặt dốc, vểnh nhẹ ở đầu hồi
  const roof = new THREE.Color('#4F6E6A');
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.BoxGeometry(5.2, 0.16, 2.5), roof, m4(0, 3.05, side * 1.0, 1, [side * 0.52, 0, 0]), 945, 0.04));
  }
  parts.push(part(new THREE.BoxGeometry(5.3, 0.22, 0.3), new THREE.Color('#3E5754'), m4(0, 3.62, 0), 946, 0.03));
  for (const side of [-1, 1]) parts.push(part(new THREE.ConeGeometry(0.18, 0.4, 6), new THREE.Color('#3E5754'), m4(side * 2.6, 3.7, 0, 1, [0, 0, side * -0.9]), 947, 0.03));
  return merge(parts);
}

/** Hàng rào gỗ dọc các điểm cho trước (cọc + 2 thanh ngang), gộp một geometry. */
export function buildFence(points: ReadonlyArray<{ x: number; y: number; z: number }>): THREE.BufferGeometry {
  const parts: Part[] = [];
  const post = new THREE.Color('#8E6440');
  const rail = new THREE.Color('#A87A50');
  points.forEach((point, index) => {
    parts.push(part(new THREE.BoxGeometry(0.12, 0.8, 0.12), post, m4(point.x, point.y + 0.38, point.z), 960 + (index % 5), 0.06));
    parts.push(part(new THREE.ConeGeometry(0.09, 0.12, 4), post, m4(point.x, point.y + 0.84, point.z, 1, [0, Math.PI / 4, 0]), 966, 0.04));
    const next = points[index + 1];
    if (!next) return;
    const dx = next.x - point.x;
    const dz = next.z - point.z;
    const length = Math.hypot(dx, dz);
    if (length > 2.2) return; // khoảng hở (lối đi / suối)
    const angle = Math.atan2(-dz, dx);
    for (const height of [0.32, 0.62]) {
      parts.push(part(new THREE.BoxGeometry(length, 0.08, 0.06), rail, m4((point.x + next.x) / 2, (point.y + next.y) / 2 + height, (point.z + next.z) / 2, 1, [0, angle, Math.atan2(next.y - point.y, length)]), 970, 0.05));
    }
  });
  return merge(parts);
}
