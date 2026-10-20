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
