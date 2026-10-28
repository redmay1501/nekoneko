/**
 * Hình khối dựng bằng code (low-poly, màu theo đỉnh) cho Vườn tri thức 3D: đèn đá, xích đu, đồi xa —
 * và bộ cây DỰ PHÒNG khi không tải được bộ model cây (garden-kit.glb).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { type PlantStage, hashUnit } from '@/features/garden/garden-layout';

export const PALETTE = {
  grass: new THREE.Color('#A6CF7E'),
  grassDark: new THREE.Color('#8FBF6A'),
  grassLight: new THREE.Color('#BCDC92'),
  bark: new THREE.Color('#8A5E3C'),
  barkDark: new THREE.Color('#6E4A2F'),
  wood: new THREE.Color('#B7834F'),
  rope: new THREE.Color('#D9BC8C'),
  leaf: new THREE.Color('#79B465'),
  leafDeep: new THREE.Color('#5E9E55'),
  leafLight: new THREE.Color('#9CCB72'),
  sakura: new THREE.Color('#F6B3C6'),
  sakuraLight: new THREE.Color('#FCD6E1'),
  rose: new THREE.Color('#D2304F'),
  roseLight: new THREE.Color('#FF8FA3'),
  roseLeaf: new THREE.Color('#4E8B47'),
  autumn: new THREE.Color('#E5A04B'),
  autumnDeep: new THREE.Color('#D27F3A'),
  stone: new THREE.Color('#D6CEC1'),
  stoneDark: new THREE.Color('#BDB3A4'),
  soil: new THREE.Color('#9C7353'),
  water: new THREE.Color('#9DD3DF'),
};

/* ───────────────────────── Hình khối low-poly (gộp thành 1 geometry có màu theo đỉnh) ───────────────────────── */

export type Part = THREE.BufferGeometry;

/**
 * Chuẩn hoá một khối: bỏ index + uv, áp ma trận, tô màu theo đỉnh. Giữ pháp tuyến mịn của hình gốc (không "mặt cắt kim cương");
 * sắc độ lệch nhẹ theo vị trí đỉnh (đỉnh trùng → cùng màu) và sáng dần lên phía trên — mềm như tranh màu nước.
 */
export function part(geometry: THREE.BufferGeometry, color: THREE.Color, matrix: THREE.Matrix4, seed = 0, variance = 0.06): Part {
  const shaped = geometry.index ? geometry.toNonIndexed() : geometry;
  if (shaped !== geometry) geometry.dispose();
  shaped.deleteAttribute('uv');
  const local = shaped.getAttribute('position');
  shaped.computeBoundingBox();
  const { min, max } = shaped.boundingBox!;
  const span = Math.max(max.y - min.y, 1e-6);
  const count = local.count;
  const colors = new Float32Array(count * 3);
  const tint = new THREE.Color();
  for (let index = 0; index < count; index += 1) {
    const x = local.getX(index);
    const y = local.getY(index);
    const z = local.getZ(index);
    const noise = (hashUnit(`${seed}:${x.toFixed(2)}:${y.toFixed(2)}:${z.toFixed(2)}`) - 0.5) * variance * 2;
    const lift = ((y - min.y) / span - 0.5) * 0.14;
    tint.copy(color).multiplyScalar(1 + noise + lift);
    colors.set([tint.r, tint.g, tint.b], index * 3);
  }
  shaped.applyMatrix4(matrix);
  shaped.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return shaped;
}

export const m4 = (x = 0, y = 0, z = 0, scale: number | [number, number, number] = 1, rotation: [number, number, number] = [0, 0, 0]) => {
  const s = Array.isArray(scale) ? scale : [scale, scale, scale];
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...s));
};

/** Khối tán lá tròn, đỉnh lệch nhẹ có kiểm soát (theo seed) → mềm, "vẽ tay", không lổn nhổn. */
export function blob(radius: number, seed: number, detail = 2): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const position = geometry.getAttribute('position');
  const vertex = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    const key = `${seed}:${vertex.x.toFixed(3)}:${vertex.y.toFixed(3)}:${vertex.z.toFixed(3)}`; // đỉnh trùng → cùng độ lệch, không hở mặt
    vertex.multiplyScalar(1 + (hashUnit(key) - 0.5) * 0.12);
    position.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  // Pháp tuyến hướng tâm → tán lá tròn mịn khi chiếu sáng, dù khối vẫn ít đa giác.
  const normal = geometry.getAttribute('position').clone();
  for (let index = 0; index < normal.count; index += 1) {
    vertex.fromBufferAttribute(normal, index).normalize();
    normal.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  geometry.setAttribute('normal', normal);
  return geometry;
}

export function merge(parts: Part[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false)!;
  for (const piece of parts) piece.dispose();
  merged.computeBoundingSphere();
  return merged;
}

/** Màu hoa tulip (cánh ngoài / cánh trong sáng hơn). */
export const TULIP_COLORS = {
  red: [new THREE.Color('#E0354C'), new THREE.Color('#FF7486')],
  yellow: [new THREE.Color('#F6C02E'), new THREE.Color('#FFE27A')],
  pink: [new THREE.Color('#EE7FA6'), new THREE.Color('#FFC2D6')],
} as const;
export type TulipColor = keyof typeof TULIP_COLORS;

/**
 * Khóm hoa tulip (gốc y = 0, cao ~0.95): ba bông cao thấp so le — cuống cong nhẹ, hai lá dài ôm gốc, bông hình chén
 * (LatheGeometry 6 múi → sáu cánh) có mép cánh nhọn. `colors`: màu từng bông (cánh ngoài, cánh trong).
 */
export function tulipGeometry(colors: ReadonlyArray<readonly [THREE.Color, THREE.Color]>): THREE.BufferGeometry {
  const parts: Part[] = [];
  const stems: Array<[number, number, number, number]> = [[0, 0, 0.86, 0], [0.16, 0.07, 0.68, 0.18], [-0.13, -0.1, 0.74, -0.2]];
  const cup = [
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.05, 0.015), new THREE.Vector2(0.085, 0.06), new THREE.Vector2(0.1, 0.12),
    new THREE.Vector2(0.092, 0.18), new THREE.Vector2(0.07, 0.225), new THREE.Vector2(0.078, 0.25),
  ];
  stems.forEach(([x, z, height, lean], index) => {
    const [outer, inner] = colors[index % colors.length];
    parts.push(part(new THREE.CylinderGeometry(0.014, 0.02, height, 5), PALETTE.leafDeep, m4(x, height / 2, z, 1, [0, 0, lean * 0.3]), 40 + index, 0.03));
    const topX = x - Math.sin(lean * 0.3) * height * 0.5;
    parts.push(part(new THREE.LatheGeometry(cup, 6), outer, m4(topX, height - 0.02, z, [1, 1, 1], [0, index * 0.5, lean * 0.3]), 44 + index, 0.04));
    // lòng bông sáng hơn (nhìn từ trên xuống thấy cánh trong)
    parts.push(part(new THREE.SphereGeometry(0.06, 6, 4), inner, m4(topX, height + 0.14, z, [1, 0.6, 1]), 48 + index, 0.03));
    // hai lá dài ôm gốc mỗi cuống
    for (const side of [-1, 1]) {
      parts.push(part(new THREE.SphereGeometry(0.08, 6, 5), PALETTE.leaf, m4(x + side * 0.05, 0.2, z, [0.45, 2.4, 0.16], [0, index + side * 0.6, side * 0.35]), 52 + index, 0.05));
    }
  });
  parts.push(part(new THREE.SphereGeometry(0.24, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), PALETTE.soil, m4(0, -0.02, 0, [1, 0.22, 1]), 60));
  return merge(parts);
}

/** Cây kiến thức theo giai đoạn — gốc ở y = 0, cao ~0.5 (mầm) → ~1.3 (bụi hoa hồng), tulip ~0.95. */
export function plantGeometry(stage: PlantStage): { geometry: THREE.BufferGeometry; height: number } {
  const mound = part(new THREE.SphereGeometry(0.3, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), PALETTE.soil, m4(0, -0.02, 0, [1, 0.28, 1]), 1);
  switch (stage) {
    case 'sprout':
      return {
        height: 0.6,
        geometry: merge([
          mound,
          part(new THREE.CylinderGeometry(0.022, 0.03, 0.34, 5), PALETTE.leafDeep, m4(0, 0.17, 0), 2),
          part(new THREE.SphereGeometry(0.15, 7, 5), PALETTE.leafLight, m4(0.1, 0.36, 0, [1, 0.32, 0.6], [0, 0, 0.5]), 3),
          part(new THREE.SphereGeometry(0.13, 7, 5), PALETTE.leaf, m4(-0.09, 0.32, 0.02, [1, 0.32, 0.6], [0, 0.4, -0.55]), 4),
        ]),
      };
    case 'sapling':
      return {
        height: 1.2,
        geometry: merge([
          mound,
          part(new THREE.CylinderGeometry(0.035, 0.06, 0.7, 6), PALETTE.bark, m4(0, 0.35, 0), 5),
          part(blob(0.34, 6), PALETTE.leafLight, m4(0, 0.86, 0, [1, 0.92, 1]), 6),
          part(blob(0.22, 7), PALETTE.leaf, m4(0.2, 0.7, 0.08), 7),
        ]),
      };
    case 'tree':
      // Đã nhớ tốt: khóm hoa tulip ba màu (khớp biến thể kit — xem tulipGeometry).
      return { height: 0.95, geometry: tulipGeometry([TULIP_COLORS.red, TULIP_COLORS.yellow, TULIP_COLORS.pink]) };
    case 'blossom':
      // Đã thành thạo: bụi hoa hồng — tán lá tròn thấp, điểm những bông hồng đỏ / hồng sáng (khớp model kit Bush_Common_Flowers).
      return {
        height: 1.3,
        geometry: merge([
          mound,
          part(blob(0.5, 15), PALETTE.roseLeaf, m4(0, 0.55, 0, [1.2, 0.85, 1.2]), 15),
          part(blob(0.36, 16), PALETTE.leafDeep, m4(0.42, 0.5, 0.1), 16),
          part(blob(0.34, 17), PALETTE.roseLeaf, m4(-0.4, 0.48, -0.12), 17),
          part(blob(0.3, 18), PALETTE.leaf, m4(0.04, 0.92, 0.04), 18),
          ...[[0.28, 0.95, 0.22], [-0.3, 0.82, 0.3], [0.48, 0.7, -0.2], [-0.42, 0.72, -0.32], [0.05, 1.12, -0.12], [-0.05, 0.62, 0.52]]
            .map(([x, y, z], index) => part(blob(0.13, 20 + index), index % 2 ? PALETTE.roseLight : PALETTE.rose, m4(x, y, z), 20 + index)),
        ]),
      };
    case 'wilting':
      return {
        height: 1.6,
        geometry: merge([
          mound,
          part(new THREE.CylinderGeometry(0.06, 0.1, 0.95, 6), PALETTE.barkDark, m4(0, 0.47, 0, 1, [0, 0, 0.06]), 20),
          part(blob(0.44, 21), PALETTE.autumn, m4(0.04, 1.14, 0, [1, 0.82, 1]), 21),
          part(blob(0.3, 22), PALETTE.autumnDeep, m4(0.32, 0.98, 0.06), 22),
          part(blob(0.26, 23), PALETTE.autumn, m4(-0.28, 1.02, -0.08), 23),
          // vài lá rụng dưới gốc
          part(new THREE.CircleGeometry(0.07, 5), PALETTE.autumnDeep, m4(0.42, 0.015, 0.2, 1, [-Math.PI / 2, 0, 0.4]), 24),
          part(new THREE.CircleGeometry(0.06, 5), PALETTE.autumn, m4(-0.36, 0.015, 0.3, 1, [-Math.PI / 2, 0, 1.2]), 25),
        ]),
      };
  }
}


/** Cây lớn trung tâm dựng bằng code — chỉ dùng khi không tải được bộ model cây. Trả về [thân + cành, tán]. */
export function proceduralBigTree(bigTree: { x: number; z: number }, swingSpot: { x: number; z: number }, BRANCH_Y: number): [THREE.BufferGeometry, THREE.BufferGeometry] {
    const trunk: Part[] = [];
    // Thân liền một khối: hình trụ nhiều đốt, thu nhỏ dần lên ngọn, loe ra ở gốc, uốn cong nhẹ — không lộ khúc nối.
    const TRUNK_HEIGHT = 6.8;
    const trunkGeometry = new THREE.CylinderGeometry(1, 1, TRUNK_HEIGHT, 16, 14);
    trunkGeometry.translate(0, TRUNK_HEIGHT / 2, 0);
    {
      const position = trunkGeometry.getAttribute('position');
      for (let index = 0; index < position.count; index += 1) {
        const y = position.getY(index);
        const t = y / TRUNK_HEIGHT;
        const radius = 0.4 + 0.2 * (1 - t) + 0.5 * Math.exp(-y * 2.2); // loe gốc
        const angle = Math.atan2(position.getZ(index), position.getX(index));
        const bark = 1 + Math.sin(angle * 5 + y * 1.3) * 0.035; // gờ vỏ cây
        position.setX(index, position.getX(index) * radius * bark + Math.sin(t * 2.6) * 0.28);
        position.setZ(index, position.getZ(index) * radius * bark);
      }
      trunkGeometry.computeVertexNormals();
    }
    trunk.push(part(trunkGeometry, PALETTE.bark, m4(bigTree.x, 0, bigTree.z), 200, 0.05));
    // Rễ: khối tròn dẹt bò ra mặt đất (không nhọn).
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2 + 0.4;
      trunk.push(part(new THREE.SphereGeometry(0.5, 10, 6), PALETTE.barkDark,
        m4(bigTree.x + Math.cos(angle) * 0.75, 0.08, bigTree.z + Math.sin(angle) * 0.75, [1.25, 0.32, 0.38], [0, -angle, -0.12]), 210 + index, 0.04));
    }
    // Cành ngang chắc chắn treo xích đu (về phía +X: gốc cành to, đầu cành nhỏ), đầu cành có chùm lá.
    const branchLength = swingSpot.x - bigTree.x + 1.5;
    trunk.push(part(new THREE.CylinderGeometry(0.17, 0.34, branchLength, 10), PALETTE.bark,
      m4(bigTree.x + 0.3 + branchLength / 2, BRANCH_Y, swingSpot.z, 1, [0, 0, -Math.PI / 2 + 0.05]), 220, 0.04));
    trunk.push(part(blob(0.62, 223), PALETTE.leaf, m4(bigTree.x + 0.3 + branchLength + 0.15, BRANCH_Y + 0.2, swingSpot.z, [1.1, 0.8, 1]), 223));
    trunk.push(part(blob(0.42, 224), PALETTE.leafLight, m4(bigTree.x + 0.3 + branchLength - 0.3, BRANCH_Y + 0.45, swingSpot.z + 0.3), 224));
    trunk.push(part(new THREE.CylinderGeometry(0.14, 0.26, 2.8, 8), PALETTE.bark, m4(bigTree.x - 0.9, 6.6, bigTree.z + 0.2, 1, [0.1, 0, 0.75]), 221));
    trunk.push(part(new THREE.CylinderGeometry(0.13, 0.24, 2.6, 8), PALETTE.bark, m4(bigTree.x + 0.9, 6.9, bigTree.z - 0.5, 1, [-0.3, 0, -0.6]), 222));

    const canopy: Part[] = [];
    const blobs: Array<[number, number, number, number, THREE.Color]> = [
      [0, 8.2, 0, 2.5, PALETTE.leaf], [-2.1, 7.5, 0.4, 1.9, PALETTE.leafDeep], [2.2, 7.6, -0.2, 2.0, PALETTE.leaf],
      [0.6, 7.3, 1.6, 1.7, PALETTE.leafLight], [-0.9, 7.4, -1.6, 1.9, PALETTE.leafDeep], [3.4, 6.85, 0.3, 1.45, PALETTE.leafLight],
      [-3.1, 6.9, -0.4, 1.4, PALETTE.leaf], [1.2, 9.3, -0.4, 1.6, PALETTE.leafLight], [-1.4, 9.0, 0.5, 1.5, PALETTE.leaf],
      // điểm hoa anh đào
      [1.6, 8.3, 1.2, 1.1, PALETTE.sakura], [-2.4, 8.4, 1.0, 0.95, PALETTE.sakuraLight], [3.3, 7.5, 1.0, 0.85, PALETTE.sakura],
      [-0.3, 9.6, 1.2, 0.8, PALETTE.sakuraLight], [-3.4, 7.3, 0.9, 0.7, PALETTE.sakura],
    ];
    for (const [index, [x, y, z, radius, color]] of blobs.entries()) {
      canopy.push(part(blob(radius, 300 + index, 3), color, m4(bigTree.x + x, y, bigTree.z + z, [1, 0.86, 1]), 300 + index, 0.07));
    }
    return [merge(trunk), merge(canopy)];
}
