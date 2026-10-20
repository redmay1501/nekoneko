/**
 * Mặt đất Vườn tri thức 3D: địa hình cong nhẹ (gò dưới cây lớn, lòng hồ trũng, mép xa dâng thành đồi thấp),
 * màu theo đỉnh (cỏ loang, rêu quanh gốc / đá, đất ẩm mép hồ, cỏ khô dọc lối đá) + texture lốm đốm lặp lại cho cận cảnh.
 */
import * as THREE from 'three';
import { GARDEN_LANDMARKS, hashUnit } from '@/features/garden/garden-layout';

const { bigTree, pond, path, stream } = GARDEN_LANDMARKS;

/** Đường giữa dòng suối (mịn, Catmull-Rom) — lấy mẫu dày một lần, dùng cho lòng suối, mặt nước và bờ đá. */
export const STREAM_CURVE = new THREE.CatmullRomCurve3(stream.map((point) => new THREE.Vector3(point.x, 0, point.z)), false, 'centripetal');
const STREAM_SAMPLES = STREAM_CURVE.getSpacedPoints(220);
/** Khung bao của suối (nới 4 m): điểm ngoài khung này chắc chắn xa suối → khỏi duyệt 221 điểm (dựng đất nhanh hơn nhiều). */
const STREAM_BOUNDS = STREAM_SAMPLES.reduce((box, point) => ({
  minX: Math.min(box.minX, point.x - 4), maxX: Math.max(box.maxX, point.x + 4),
  minZ: Math.min(box.minZ, point.z - 4), maxZ: Math.max(box.maxZ, point.z + 4),
}), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });
const FAR_FROM_STREAM = { distance: 99, t: 0 };

/** Bề rộng mặt nước theo vị trí dọc suối (t: 0 thượng nguồn → 1 hạ nguồn) — hẹp / rộng nhẹ cho tự nhiên. */
export function streamWidth(t: number): number {
  return 1.35 + Math.sin(t * 17) * 0.2 + Math.sin(t * 7.3 + 1) * 0.15;
}

/** Khoảng cách tới tim suối + vị trí t gần nhất. */
export function streamDistance(x: number, z: number): { distance: number; t: number } {
  if (x < STREAM_BOUNDS.minX || x > STREAM_BOUNDS.maxX || z < STREAM_BOUNDS.minZ || z > STREAM_BOUNDS.maxZ) return FAR_FROM_STREAM;
  let best = Infinity;
  let bestIndex = 0;
  for (let index = 0; index < STREAM_SAMPLES.length; index += 1) {
    const point = STREAM_SAMPLES[index];
    const distance = (x - point.x) ** 2 + (z - point.z) ** 2;
    if (distance < best) { best = distance; bestIndex = index; }
  }
  return { distance: Math.sqrt(best), t: bestIndex / (STREAM_SAMPLES.length - 1) };
}

/** 1 trong lòng suối → 0 ngoài bờ. */
function streamFactor(x: number, z: number): number {
  const { distance, t } = streamDistance(x, z);
  const half = streamWidth(t) / 2;
  return 1 - THREE.MathUtils.smoothstep(distance, half * 0.7, half + 1.3);
}

/** Nhiễu giá trị 2D mượt (nội suy lưới băm) — đủ cho đất / màu cỏ, không cần thư viện. */
function valueNoise(x: number, z: number): number {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const fx = x - xi;
  const fz = z - zi;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const corner = (cx: number, cz: number) => hashUnit(`n:${cx}:${cz}`);
  const top = THREE.MathUtils.lerp(corner(xi, zi), corner(xi + 1, zi), smooth(fx));
  const bottom = THREE.MathUtils.lerp(corner(xi, zi + 1), corner(xi + 1, zi + 1), smooth(fx));
  return THREE.MathUtils.lerp(top, bottom, smooth(fz));
}

export function fbm(x: number, z: number): number {
  return valueNoise(x, z) * 0.55 + valueNoise(x * 2.1 + 17, z * 2.1 - 9) * 0.3 + valueNoise(x * 4.3 - 5, z * 4.3 + 3) * 0.15;
}

function pondFactor(x: number, z: number): number {
  const distance = Math.hypot((x - pond.x) / pond.radiusX, (z - pond.z) / pond.radiusZ);
  return 1 - THREE.MathUtils.smoothstep(distance, 0.75, 1.25); // 1 trong lòng hồ → 0 ngoài bờ
}

function distanceToPath(x: number, z: number): number {
  let best = Infinity;
  for (let index = 1; index < path.length; index += 1) {
    const a = path[index - 1];
    const b = path[index];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz)));
  }
  return best;
}

/** Độ cao mặt đất tại (x, z) — dùng chung để đặt cây, đá, đèn, nhân vật đúng trên mặt đất. */
export function terrainHeight(x: number, z: number): number {
  return groundHeight(x, z, true);
}

/**
 * Mặt bờ suối (đất chưa khoét lòng suối) — mặt nước suối đặt thấp hơn mức này một chút: lưới đất thưa hơn lòng suối nên
 * nếu đặt nước theo đáy khoét, đất nội suy giữa các đỉnh sẽ trồi lên che mất nước.
 */
export function streamBankHeight(x: number, z: number): number {
  return groundHeight(x, z, false);
}

function groundHeight(x: number, z: number, carveStream: boolean): number {
  const rolling = (fbm(x * 0.09 + 3, z * 0.09 - 1) - 0.5) * 0.7;
  const mound = 0.42 * Math.exp(-((x - bigTree.x) ** 2 + (z - bigTree.z) ** 2) / (2 * 3.2 ** 2));
  const basin = -0.42 * pondFactor(x, z);
  const channelShape = carveStream ? streamFactor(x, z) : 0;
  const channel = -0.42 * channelShape;
  const radius = Math.hypot(x, z + 2);
  // Mép xa dâng thành gò thấp (≤ 2.2 m) — vườn có giới hạn mềm nhưng vẫn thấy trời, đồi và núi phía sau.
  const rim = Math.min((Math.max(radius - 16, 0) * 0.16) ** 1.3, 2.2);
  const pathFlatten = 1 - THREE.MathUtils.smoothstep(distanceToPath(x, z), 0.4, 1.4);
  const wet = Math.max(pondFactor(x, z), channelShape);
  return (rolling * (1 - pathFlatten * 0.6) + mound) * (1 - wet) + Math.min(basin, channel) + rim;
}

/** Họa tiết cỏ lốm đốm (đốm sáng / tối nhỏ) — lặp lại trên mặt đất, nhân với màu theo đỉnh. */
function grassDetailTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#e9efe2';
  context.fillRect(0, 0, size, size);
  for (let index = 0; index < 2600; index += 1) {
    const x = hashUnit(`gx:${index}`) * size;
    const y = hashUnit(`gy:${index}`) * size;
    const light = hashUnit(`gl:${index}`);
    const length = 2 + hashUnit(`glen:${index}`) * 5;
    context.strokeStyle = light > 0.55 ? `rgba(255,255,240,${0.25 + light * 0.3})` : `rgba(70,95,50,${0.12 + light * 0.25})`;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + (hashUnit(`gdx:${index}`) - 0.5) * 2, y - length);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(26, 26);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const COLORS = {
  grass: new THREE.Color('#86C760'),
  grassWarm: new THREE.Color('#A6D466'),
  grassCool: new THREE.Color('#62AE55'),
  moss: new THREE.Color('#4E8E45'),
  dry: new THREE.Color('#B9C878'),
  wet: new THREE.Color('#4F8650'),
  basin: new THREE.Color('#5E9C8C'),
  far: new THREE.Color('#98C47A'),
};

/**
 * Mặt đất 90×90 m, lưới dày ở giữa vườn. `aoSpots`: vị trí gốc cây / đá — đất quanh đó tối nhẹ (ambient occlusion nướng sẵn).
 */
export function buildTerrain(aoSpots: ReadonlyArray<{ x: number; z: number; radius: number; strength: number }>, segments: number): THREE.Mesh {
  const size = 90;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    position.setY(index, terrainHeight(x, z));
    const patch = fbm(x * 0.16, z * 0.16);
    color.copy(COLORS.grassCool).lerp(COLORS.grassWarm, THREE.MathUtils.smoothstep(patch, 0.3, 0.75));
    const pathDistance = distanceToPath(x, z);
    color.lerp(COLORS.dry, (1 - THREE.MathUtils.smoothstep(pathDistance, 0.3, 1.5)) * 0.45);
    const streamNear = streamDistance(x, z);
    const bank = 1 - THREE.MathUtils.smoothstep(streamNear.distance, streamWidth(streamNear.t) / 2, streamWidth(streamNear.t) / 2 + 1.3);
    color.lerp(COLORS.moss, bank * 0.5).lerp(COLORS.basin, streamFactor(x, z) * 0.8);
    const pondEdge = pondFactor(x, z);
    color.lerp(COLORS.wet, Math.min(1, pondEdge * 1.6) * 0.6).lerp(COLORS.basin, Math.max(0, pondEdge - 0.6) * 1.5);
    const treeDistance = Math.hypot(x - bigTree.x, z - bigTree.z);
    color.lerp(COLORS.moss, (1 - THREE.MathUtils.smoothstep(treeDistance, 0.8, 3.4)) * 0.55);
    let ao = 1;
    for (const spot of aoSpots) {
      const distance = Math.hypot(x - spot.x, z - spot.z);
      if (distance < spot.radius) ao -= (1 - distance / spot.radius) ** 2 * spot.strength;
    }
    const farFade = THREE.MathUtils.smoothstep(Math.hypot(x, z + 2), 16, 34);
    color.lerp(COLORS.far, farFade * 0.7);
    color.multiplyScalar(Math.max(0.55, ao));
    colors.set([color.r, color.g, color.b], index * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, map: grassDetailTexture(), roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}
