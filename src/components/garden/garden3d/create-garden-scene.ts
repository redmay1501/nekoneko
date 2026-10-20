/**
 * Vườn tri thức 3D — toàn bộ phần three.js. Chỉ được import động ở trình duyệt (Garden3D.tsx), không chạy khi SSR.
 *
 * Cảnh: thung lũng cỏ cong nhẹ, lối đá, hồ nhỏ, đèn đá; cây anh đào lớn trung tâm (model TwistedTree của bộ Quaternius)
 * có xích đu dây thừng, hai nhân vật kimono (GLB có animation ngồi "HumanSitting2") ngồi cạnh nhau trên xích đu.
 * Mỗi kiến thức đã học là một cây (model theo giai đoạn ghi nhớ, InstancedMesh) — vị trí / giai đoạn lấy từ
 * garden-layout.ts, bấm vào cây → onSelect(contentKey). Không tải được bộ model cây → dùng cây dựng bằng code (procedural.ts).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GARDEN_LANDMARKS, type PlantPlacement, type PlantStage, hashUnit } from '@/features/garden/garden-layout';
import { type FoliageTint, GardenKit, KIT_URL, type KitModel } from './kit';
import { PALETTE, type Part, m4, merge, part, plantGeometry, proceduralBigTree } from './procedural';
import { buildSky } from './sky';
import { buildStream, streamBankPoint, streamCrossPoint } from './stream';
import { type LanternHandle, SIGN_FACE, buildBridge, buildButterflies, buildFence, buildHangingLanterns, buildHouse, buildKoi, buildSignboard, buildTorii } from './decor';
import { STREAM_CURVE, buildTerrain, streamBankHeight, streamWidth, terrainHeight } from './terrain';

export interface GardenSceneOptions {
  canvas: HTMLCanvasElement;
  plants: readonly PlantPlacement[];
  /** Thiết bị yếu / màn nhỏ: bỏ bóng đổ, ít cỏ hoa hơn, độ phân giải thấp hơn. */
  lowPower: boolean;
  reducedMotion: boolean;
  onSelect: (contentKey: string | null) => void;
  /** Cảnh đã có cây (bộ model đã tải, hoặc đã chuyển sang cây dự phòng). */
  onSceneReady: (usedKit: boolean) => void;
  onCharactersReady: (ok: boolean) => void;
  /**
   * Mỗi khung hình (chỉ khi đổi): vị trí trên màn hình (px, so với canvas) của mặt các biển nhóm kiến thức và đầu hai nhân vật
   * — Garden3D đặt lớp chữ HTML đúng lên đó bằng cách ghi thẳng style (không setState mỗi khung hình).
   */
  onAnchors?: (anchors: SceneAnchors) => void;
  /** Chạm vào một trong hai nhân vật mèo (−1 trái, 1 phải). */
  onCatTap?: (side: -1 | 1) => void;
  /** Nội dung chữ trên các biển gỗ (số liệu thật) — vẽ thẳng lên mặt biển 3D. */
  signLabels: readonly SignLabel[];
  /** Chạm vào một biển nhóm kiến thức. */
  onSignTap?: (id: SignId) => void;
}

export interface SignLabel { id: SignId; label: string; glyph: string; learned: number; total: number; color: [string, string] }

export type SignId = 'vocabulary' | 'kana' | 'grammar' | 'kanji' | 'radical';
export interface ScreenAnchor { x: number; y: number; width: number; visible: boolean }
export interface SceneAnchors {
  signs: Record<SignId, ScreenAnchor>;
  cats: Record<'-1' | '1', ScreenAnchor>;
}

export interface GardenSceneHandle {
  setPlants: (plants: readonly PlantPlacement[]) => void;
  /** Lọc theo giai đoạn cây (null = tất cả): cây khác giai đoạn thu nhỏ biến mất và không chọn được. */
  setFilter: (stage: PlantStage | null) => void;
  setSelected: (contentKey: string | null) => void;
  resetCamera: () => void;
  dispose: () => void;
}

const MODELS = {
  // Nữ kimono (thư mục gốc "kimono_ngoi") ngồi bên trái, nam ("nam_lac_chan") bên phải — nhìn từ phía camera.
  left: '/models/garden/kimono_ngoi.glb',
  right: '/models/garden/nam_lac_chan.glb',
};

/**
 * Cây kiến thức theo giai đoạn: model + chiều cao đích (m) + bảng màu lá. Silhouette khác nhau rõ:
 * mầm (cây lá thấp / dương xỉ) → cây non thân mảnh → cây xanh tán dày → cây nở hoa anh đào; sắp quên: cây thưa lá vàng.
 */
const PLANT_VARIANTS: Record<PlantStage, ReadonlyArray<{ model: KitModel; height: number; maxWidth: number; tint: FoliageTint | null }>> = {
  sprout: [
    { model: 'Plant_1', height: 0.42, maxWidth: 0.62, tint: null },
    { model: 'Fern_1', height: 0.42, maxWidth: 0.75, tint: null },
  ],
  sapling: [{ model: 'CommonTree_4', height: 1.0, maxWidth: 0.6, tint: 'fresh' }],
  tree: [
    { model: 'CommonTree_1', height: 1.45, maxWidth: 1.05, tint: 'green' },
    { model: 'CommonTree_2', height: 1.5, maxWidth: 1.05, tint: 'green' },
  ],
  blossom: [
    { model: 'CommonTree_1', height: 1.7, maxWidth: 1.2, tint: 'sakura' },
    { model: 'CommonTree_2', height: 1.75, maxWidth: 1.2, tint: 'sakura' },
  ],
  wilting: [{ model: 'CommonTree_3', height: 1.4, maxWidth: 0.85, tint: 'autumn' }],
};

// Góc nhìn diorama từ trên cao (~34°) như concept: thấy trọn cây đào, xích đu, suối, cầu và 5 biển nhóm kiến thức.
const DEFAULT_TARGET = new THREE.Vector3(0.6, 4.0, -2.4);
const DEFAULT_OFFSET = new THREE.Vector3(1.2, 6.0, 25.4);
const BIG_TREE_HEIGHT = 12.8;
const BRANCH_Y = 4.15; // độ cao cành treo so với mặt đất dưới xích đu
const SEAT_HEIGHT = 0.95;
const SEAT_WIDTH = 2.2;
const SWING_PERIOD = 4.2;

/**
 * Bầu trời (equirect 1024×512): xanh trong ở đỉnh → xanh nhạt → vàng kem ấm sát chân trời, mây bông mềm quanh chân trời.
 * Dùng cho vòm trời 3D (xoay theo camera) và để dựng env map (ánh sáng trời cho mọi vật liệu PBR).
 */
function skyTexture(): THREE.Texture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#4FA4E6');
  gradient.addColorStop(0.3, '#7DC2EE');
  gradient.addColorStop(0.44, '#A9DAF2');
  gradient.addColorStop(0.49, '#DDF0F2');
  gradient.addColorStop(0.505, '#FFEFD6');
  gradient.addColorStop(0.56, '#E8F0DA');
  gradient.addColorStop(1, '#A9C98D');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  // Mây: nhiều đốm tròn mờ chồng nhau, dải ngay trên chân trời; lặp liền mép trái/phải.
  for (let cloud = 0; cloud < 18; cloud += 1) {
    const cx = hashUnit(`cloud:${cloud}`) * width;
    const cy = height * (0.3 + hashUnit(`cloud-y:${cloud}`) * 0.14);
    const size = 26 + hashUnit(`cloud-s:${cloud}`) * 34;
    for (let puff = 0; puff < 9; puff += 1) {
      const px = cx + (hashUnit(`p:${cloud}:${puff}`) - 0.5) * size * 3.2;
      const py = cy + (hashUnit(`py:${cloud}:${puff}`) - 0.5) * size * 0.6;
      const radius = size * (0.45 + hashUnit(`pr:${cloud}:${puff}`) * 0.55);
      for (const offset of [0, -width, width]) {
        const glow = context.createRadialGradient(px + offset, py, 0, px + offset, py, radius);
        glow.addColorStop(0, 'rgba(255,255,255,0.85)');
        glow.addColorStop(0.6, 'rgba(255,252,246,0.45)');
        glow.addColorStop(1, 'rgba(255,250,240,0)');
        context.fillStyle = glow;
        context.beginPath();
        context.ellipse(px + offset, py, radius * 1.5, radius * 0.75, 0, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

/** Núi tuyết xa (dáng Phú Sĩ) — lớp hậu cảnh cuối cùng, sương xa làm nó nhạt xanh tự nhiên. */
function distantMountains(): THREE.Mesh {
  const parts: Part[] = [];
  const cone = new THREE.ConeGeometry(34, 24, 96, 12, true);
  const position = cone.getAttribute('position');
  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index);
    if (y > 11.5) continue;
    const angle = Math.atan2(position.getZ(index), position.getX(index));
    const wobble = 1 + Math.sin(angle * 7) * 0.03 + Math.sin(angle * 13 + 1) * 0.02;
    position.setX(index, position.getX(index) * wobble);
    position.setZ(index, position.getZ(index) * wobble);
  }
  // Tách đỉnh tuyết bằng màu theo độ cao (viền răng cưa nhẹ).
  const shaped = cone.toNonIndexed();
  cone.dispose();
  const positions = shaped.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  const rock = new THREE.Color('#8FB2CC');
  const snow = new THREE.Color('#F4F8FC');
  const color = new THREE.Color();
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index);
    const angle = Math.atan2(positions.getZ(index), positions.getX(index));
    const snowLine = 4.5 + Math.sin(angle * 9) * 1.4 + Math.sin(angle * 4 + 2) * 0.8;
    color.copy(y > snowLine ? snow : rock).lerp(snow, THREE.MathUtils.smoothstep(y, snowLine - 3, snowLine) * 0.25);
    colors.set([color.r, color.g, color.b], index * 3);
  }
  shaped.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  shaped.deleteAttribute('uv'); // gộp được với các khối khác (cùng bộ thuộc tính position / normal / color)
  shaped.computeVertexNormals();
  shaped.translate(-38, 9.5, -118);
  parts.push(shaped);
  const ridge = new THREE.SphereGeometry(30, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  parts.push(part(ridge, new THREE.Color('#8FB0C4'), m4(30, -2, -112, [2.2, 0.32, 0.6]), 600, 0.03));
  // Núi xa: không chịu sương chung (sương phủ trắng nhợt, lộ mặt tam giác) — màu đã pha xanh khí quyển sẵn.
  return new THREE.Mesh(merge(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, fog: false, flatShading: false }));
}

/** Vẽ mặt chữ biển gỗ (kem, ô biểu tượng màu nhóm, tên nhóm, chấm + tiến độ) lên canvas — sắc nét ở 1024 px. */
function drawSignTexture(label: SignLabel, anisotropy: number): THREE.CanvasTexture {
  const width = 1024;
  const height = Math.round(width * (SIGN_FACE.height - 0.06) / (SIGN_FACE.width - 0.06));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#FFFBF2');
  background.addColorStop(1, '#F6EAD3');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  // Ô biểu tượng bo góc
  const box = height * 0.62;
  const boxX = height * 0.2;
  const boxY = (height - box) / 2;
  const iconGradient = context.createLinearGradient(0, boxY, 0, boxY + box);
  iconGradient.addColorStop(0, label.color[0]);
  iconGradient.addColorStop(1, label.color[1]);
  context.fillStyle = iconGradient;
  context.beginPath();
  context.roundRect(boxX, boxY, box, box, box * 0.22);
  context.fill();
  context.fillStyle = '#FFFFFF';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `800 ${Math.round(box * 0.6)}px "Zen Maru Gothic", "Hiragino Sans", "Noto Sans JP", sans-serif`;
  context.fillText(label.glyph, boxX + box / 2, boxY + box / 2 + box * 0.03);
  // Tên nhóm + tiến độ
  const textX = boxX + box + height * 0.16;
  context.textAlign = 'left';
  context.fillStyle = '#5A3A24';
  context.font = `900 ${Math.round(height * 0.3)}px Nunito, "Segoe UI", sans-serif`;
  context.fillText(label.label, textX, height * 0.38);
  const dotY = height * 0.7;
  context.fillStyle = label.learned > 0 ? '#6DBB6F' : '#CFC6BA';
  context.beginPath();
  context.arc(textX + height * 0.06, dotY, height * 0.055, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#7C6250';
  context.font = `800 ${Math.round(height * 0.2)}px Nunito, "Segoe UI", sans-serif`;
  context.fillText(`${label.learned}/${label.total}`, textX + height * 0.17, dotY + height * 0.01);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, anisotropy);
  return texture;
}

/** Bản đồ môi trường từ chính bầu trời → nhân vật PBR, nước, vỏ cây nhận ánh sáng trời giống nhau. */
function skyEnvironment(renderer: THREE.WebGLRenderer, sky: THREE.Texture): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(sky);
  pmrem.dispose();
  return target.texture;
}

/** Bóng mềm tròn: AO tiếp xúc dưới gốc cây / đá / nhân vật (rẻ hơn SSAO, ổn định trên điện thoại). */
function contactShadowTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(40,58,28,0.55)');
  gradient.addColorStop(0.55, 'rgba(40,58,28,0.22)');
  gradient.addColorStop(1, 'rgba(40,58,28,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

const matrixAt = (x: number, z: number, scale: number, rotation: number, yOffset = 0) => {
  const object = new THREE.Object3D();
  object.position.set(x, terrainHeight(x, z) + yOffset, z);
  object.rotation.y = rotation;
  object.scale.setScalar(scale);
  object.updateMatrix();
  return object.matrix.clone();
};

export function createGardenScene(options: GardenSceneOptions): GardenSceneHandle {
  const { canvas, lowPower, reducedMotion } = options;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: lowPower ? 'low-power' : 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T) => { disposables.push(item); return item; };

  const scene = new THREE.Scene();
  const sky = track(skyTexture());
  scene.background = new THREE.Color('#9BD0F0');
  scene.environment = track(skyEnvironment(renderer, sky));
  scene.environmentIntensity = 0.6;
  // Sương xa thật nhẹ, bắt đầu sau toàn bộ vườn (≥ 34 m) — chỉ làm nhạt đồi / núi tạo chiều sâu, không phủ cây hay nhân vật.
  scene.fog = new THREE.Fog('#CFE7EF', 45, 180);
  // Trời: vòm gradient shader + mây trôi + cầu vồng (sky.ts) — không chịu sương, không vệt / đường nối.
  const skyLayer = buildSky(lowPower, reducedMotion);
  for (const object of skyLayer.objects) scene.add(object);
  disposables.push(skyLayer);
  {
    const mountains = distantMountains();
    track(mountains.geometry);
    track(mountains.material as THREE.Material);
    scene.add(mountains);
  }

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.7;
  controls.minDistance = 8;
  controls.maxDistance = 30;
  controls.minPolarAngle = 0.62;
  controls.maxPolarAngle = 1.4; // không chui xuống dưới mặt cỏ
  // Chỉ xoay quanh mặt trước, lệch về phía xích đu: xoay sang trái quá xa thì thân cây lớn che mất hai nhân vật.
  controls.minAzimuthAngle = -0.42;
  controls.maxAzimuthAngle = 1.25;

  /* Ánh sáng: trời (hemisphere + env map) + nắng chiều ấm, bóng mềm. */
  // Vùng khuất nắng ngả xanh trời dịu (không xám đen); nắng vàng ấm chiếu xiên.
  scene.add(new THREE.HemisphereLight('#DCEBFF', '#7AAE5E', 0.85));
  const sun = new THREE.DirectionalLight('#FFDCA6', 2.9);
  sun.position.set(12, 14, 7);
  sun.target.position.set(0, 0, -1);
  scene.add(sun, sun.target);
  if (!lowPower) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 2, far: 50 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 4;
  }

  const flatMaterial = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 }));
  const addStatic = (geometry: THREE.BufferGeometry, material: THREE.Material = flatMaterial, shadows: 'cast' | 'receive' | 'both' | 'none' = 'both') => {
    const mesh = new THREE.Mesh(track(geometry), material);
    mesh.castShadow = shadows === 'cast' || shadows === 'both';
    mesh.receiveShadow = shadows === 'receive' || shadows === 'both';
    scene.add(mesh);
    return mesh;
  };

  const { bigTree, swing: swingSpot, pond, lanterns, path } = GARDEN_LANDMARKS;
  const pathCurve = new THREE.CatmullRomCurve3(path.map((point) => new THREE.Vector3(point.x, 0, point.z)));

  /* Mặt đất + AO nướng quanh gốc cây lớn, đèn đá, bờ hồ. */
  const terrain = buildTerrain([
    { x: bigTree.x, z: bigTree.z, radius: 3.2, strength: 0.32 },
    ...lanterns.map((lantern) => ({ x: lantern.x, z: lantern.z, radius: 0.9, strength: 0.25 })),
  ], lowPower ? 120 : 200);
  track(terrain.geometry);
  track(terrain.material as THREE.Material);
  track((terrain.material as THREE.MeshStandardMaterial).map!);
  scene.add(terrain);

  /* Suối nhỏ uốn qua bên trái vườn, đổ vào hồ. */
  const stream = buildStream();
  disposables.push(stream);
  scene.add(stream.mesh);

  /* Đồi xa mềm (sau vườn), nhạt dần vào sương. */
  {
    const hills: Part[] = [];
    const hillColors = ['#AFCF95', '#A5C98E', '#BDD8A6', '#9CC487'];
    for (let index = 0; index < 9; index += 1) {
      const angle = Math.PI * (0.92 + index * 0.13);
      const radius = 42 + hashUnit(`hill:${index}`) * 14;
      const size = 10 + hashUnit(`hill-s:${index}`) * 9;
      hills.push(part(new THREE.SphereGeometry(size, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.Color(hillColors[index % 4]),
        m4(Math.cos(angle) * radius * 1.3, -0.5, Math.sin(angle) * radius - 6, [1.6, 0.4, 1]), 40 + index, 0.02));
    }
    addStatic(merge(hills), flatMaterial, 'none');
  }

  let pondWaterY = 0;
  /* Hồ: mặt nước phản chiếu trời (env map), lá súng. Đá bờ hồ đặt sau khi có bộ model. */
  {
    const water = new THREE.CircleGeometry(1, 48);
    water.rotateX(-Math.PI / 2);
    const waterMaterial = track(new THREE.MeshStandardMaterial({ color: '#4CC0C4', roughness: 0.06, metalness: 0.08, transparent: true, opacity: 0.84, envMapIntensity: 1.05 }));
    const waterMesh = new THREE.Mesh(track(water), waterMaterial);
    waterMesh.scale.set(pond.radiusX * 0.98, 1, pond.radiusZ * 0.98);
    waterMesh.position.set(pond.x, terrainHeight(pond.x, pond.z) + 0.24, pond.z);
    pondWaterY = waterMesh.position.y;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    const pads: Part[] = [];
    for (const [dx, dz, size] of [[-0.6, 0.2, 0.24], [0.7, -0.4, 0.19], [0.1, 0.55, 0.16], [-0.2, -0.5, 0.13]] as const) {
      pads.push(part(new THREE.CircleGeometry(size, 12, 0.3, Math.PI * 1.8), PALETTE.leaf, m4(pond.x + dx, waterMesh.position.y + 0.01, pond.z + dz, 1, [-Math.PI / 2, 0, dx]), 130, 0.04));
    }
    pads.push(part(new THREE.SphereGeometry(0.06, 8, 6), PALETTE.sakura, m4(pond.x - 0.55, waterMesh.position.y + 0.05, pond.z + 0.2), 131));
    addStatic(merge(pads), flatMaterial, 'receive');
  }

  /* Cầu gỗ đỏ bắc qua suối (đoạn giữa bìa rừng và hồ — nhìn thấy từ góc mặc định). */
  {
    const t = 0.33;
    const center = STREAM_CURVE.getPointAt(t);
    const tangent = STREAM_CURVE.getTangentAt(t);
    const span = streamWidth(t) + 2.7;
    const across = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const endA = center.clone().addScaledVector(across, span / 2);
    const endB = center.clone().addScaledVector(across, -span / 2);
    const baseY = Math.min(streamBankHeight(endA.x, endA.z), streamBankHeight(endB.x, endB.z)) - 0.03;
    const bridge = new THREE.Mesh(track(buildBridge(span)), track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0 })));
    bridge.position.set(center.x, baseY, center.z);
    bridge.rotation.y = -Math.atan2(across.z, across.x);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);
  }

  /* Đèn đá (tōrō), ô cửa sổ phát sáng ấm. */
  {
    const stone: Part[] = [];
    const glow: Part[] = [];
    for (const [index, lantern] of lanterns.entries()) {
      const { x, z } = lantern;
      const y = terrainHeight(x, z) - 0.02;
      stone.push(part(new THREE.CylinderGeometry(0.34, 0.42, 0.18, 8), PALETTE.stoneDark, m4(x, y + 0.08, z), 140 + index));
      stone.push(part(new THREE.CylinderGeometry(0.11, 0.14, 0.62, 8), PALETTE.stone, m4(x, y + 0.47, z), 141 + index));
      stone.push(part(new THREE.CylinderGeometry(0.3, 0.26, 0.1, 8), PALETTE.stoneDark, m4(x, y + 0.83, z), 142 + index));
      stone.push(part(new THREE.CylinderGeometry(0.47, 0.18, 0.26, 6), PALETTE.stone, m4(x, y + 1.32, z), 143 + index));
      stone.push(part(new THREE.SphereGeometry(0.1, 8, 6), PALETTE.stoneDark, m4(x, y + 1.5, z), 144 + index));
      for (let corner = 0; corner < 4; corner += 1) {
        stone.push(part(new THREE.BoxGeometry(0.06, 0.3, 0.06), PALETTE.stone, m4(x + (corner % 2 ? 0.16 : -0.16), y + 1.03, z + (corner < 2 ? 0.16 : -0.16)), 145));
      }
      glow.push(part(new THREE.BoxGeometry(0.28, 0.26, 0.28), new THREE.Color('#FFD889'), m4(x, y + 1.03, z), 146, 0));
    }
    addStatic(merge(stone), track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })), 'both');
    addStatic(merge(glow), track(new THREE.MeshStandardMaterial({ vertexColors: true, emissive: '#FFC56B', emissiveIntensity: 0.8, roughness: 1 })), 'none');
    if (!lowPower) {
      // Ánh đèn ấm hắt nhẹ xuống cỏ quanh đèn đá cạnh lối đi.
      const torch = new THREE.PointLight('#FFB868', 2.2, 4.5, 2);
      torch.position.set(lanterns[0].x, terrainHeight(lanterns[0].x, lanterns[0].z) + 1.05, lanterns[0].z);
      scene.add(torch);
    }
  }

  /* Cá koi bơi chậm trong hồ; bướm lượn quanh các khóm hoa. */
  const koi = buildKoi(pond.x, pond.z, pond.radiusX * 0.85, pond.radiusZ * 0.85, pondWaterY, reducedMotion);
  for (const mesh of koi.meshes) scene.add(mesh);
  disposables.push(koi);
  const butterflySpots = [
    { x: lanterns[0].x - 0.7, z: lanterns[0].z + 0.3 }, { x: pond.x + 1.9, z: pond.z + 1.5 }, { x: -2.0, z: 6.0 }, { x: 3.6, z: 8.9 },
    { x: bigTree.x + 2.6, z: bigTree.z + 2.2 }, { x: bigTree.x - 2.8, z: bigTree.z + 1.4 }, { x: 8.6, z: -0.8 },
  ].slice(0, lowPower ? 4 : 7).map((spot) => ({ ...spot, y: terrainHeight(spot.x, spot.z) + 0.9 }));
  const butterflies = buildButterflies(butterflySpots, reducedMotion);
  scene.add(butterflies.mesh);
  disposables.push(butterflies);
  let hangingLanterns: LanternHandle | null = null;

  /* Bóng tiếp xúc (AO) dưới mọi vật đứng trên đất — một InstancedMesh. */
  const contactTexture = track(contactShadowTexture());
  const contactMaterial = track(new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  const contactGeometry = track(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  let contactMesh: THREE.InstancedMesh | null = null;
  const staticContacts: Array<{ x: number; z: number; size: number }> = [
    { x: bigTree.x, z: bigTree.z, size: 5.2 },
    ...lanterns.map((lantern) => ({ x: lantern.x, z: lantern.z, size: 1.3 })),
    { x: swingSpot.x, z: swingSpot.z, size: 2.4 },
  ];
  let plantContacts: Array<{ x: number; z: number; size: number }> = [];
  function rebuildContacts() {
    if (contactMesh) { scene.remove(contactMesh); contactMesh.dispose(); }
    const all = [...staticContacts, ...plantContacts];
    contactMesh = new THREE.InstancedMesh(contactGeometry, contactMaterial, Math.max(1, all.length));
    contactMesh.count = all.length;
    all.forEach((spot, index) => contactMesh!.setMatrixAt(index, m4(spot.x, terrainHeight(spot.x, spot.z) + 0.03, spot.z, [spot.size, 1, spot.size])));
    contactMesh.renderOrder = 1;
    scene.add(contactMesh);
  }
  rebuildContacts();

  /* Biển gỗ các nhóm kiến thức + cổng torii + nhà gỗ + hàng rào (tĩnh, dựng ngay — không phụ thuộc bộ model cây). */
  const SIGN_IDS: SignId[] = ['vocabulary', 'kana', 'grammar', 'kanji', 'radical'];
  const signFaces: THREE.Mesh[] = [];
  const SIGN_SCALE = 1.35;
  const signFrames = new Map<SignId, { center: THREE.Vector3; right: THREE.Vector3 }>();
  {
    const signGeometry = track(buildSignboard(RoundedBoxGeometry));
    const signMaterial = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0 }));
    const signs = new THREE.InstancedMesh(signGeometry, signMaterial, SIGN_IDS.length);
    const viewFrom = DEFAULT_TARGET.clone().add(DEFAULT_OFFSET);
    SIGN_IDS.forEach((id, index) => {
      const spot = GARDEN_LANDMARKS.signs[id];
      const ground = terrainHeight(spot.x, spot.z) - 0.04;
      // Mặt biển quay về phía camera mặc định (đọc được ngay, không cần xoay).
      const yaw = Math.atan2(viewFrom.x - spot.x, viewFrom.z - spot.z);
      const object = new THREE.Object3D();
      object.position.set(spot.x, ground, spot.z);
      object.rotation.y = yaw;
      object.scale.setScalar(SIGN_SCALE); // biển to hơn cỡ thật để chữ đọc rõ từ góc nhìn cả vườn
      object.updateMatrix();
      signs.setMatrixAt(index, object.matrix);
      const center = new THREE.Vector3(0, SIGN_FACE.centerY, 0.09).applyMatrix4(object.matrix);
      const right = new THREE.Vector3(SIGN_FACE.width / 2, SIGN_FACE.centerY, 0.09).applyMatrix4(object.matrix);
      signFrames.set(id, { center, right });
      staticContacts.push({ x: spot.x, z: spot.z, size: 2.6 });
    });
    // Mặt chữ: mỗi biển một tấm phẳng mang texture vẽ từ dữ liệu thật — luôn khớp đúng mặt biển ở mọi góc nhìn.
    const faceGeometry = track(new THREE.PlaneGeometry(SIGN_FACE.width - 0.06, SIGN_FACE.height - 0.06));
    SIGN_IDS.forEach((id, index) => {
      const label = options.signLabels.find((item) => item.id === id);
      if (!label) return;
      const texture = track(drawSignTexture(label, renderer.capabilities.getMaxAnisotropy()));
      // Không chịu ánh sáng / tone mapping: chữ luôn rõ, đúng màu như UI (biển là "biển hiệu" — không cần đổ bóng lên chữ).
      const material = track(new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, color: '#F7F2EA', polygonOffset: true, polygonOffsetFactor: -1 }));
      const face = new THREE.Mesh(faceGeometry, material);
      const matrix = new THREE.Matrix4();
      signs.getMatrixAt(index, matrix);
      face.applyMatrix4(matrix);
      face.position.add(new THREE.Vector3(0, SIGN_FACE.centerY, 0.085).applyMatrix4(new THREE.Matrix4().extractRotation(matrix)).multiplyScalar(SIGN_SCALE));
      face.userData.signId = id;
      face.receiveShadow = true;
      scene.add(face);
      signFaces.push(face);
    });
    signs.castShadow = true;
    signs.receiveShadow = true;
    scene.add(signs);

    const torii = new THREE.Mesh(track(buildTorii()), track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0 })));
    const toriiSpot = GARDEN_LANDMARKS.torii;
    torii.position.set(toriiSpot.x, terrainHeight(toriiSpot.x, toriiSpot.z) - 0.05, toriiSpot.z);
    torii.rotation.y = Math.atan2(viewFrom.x - toriiSpot.x, viewFrom.z - toriiSpot.z) * 0.6;
    torii.castShadow = true;
    torii.receiveShadow = true;
    scene.add(torii);
    staticContacts.push({ x: toriiSpot.x, z: toriiSpot.z, size: 3.4 });

    const house = new THREE.Mesh(track(buildHouse()), track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, emissive: '#000000' })));
    const houseSpot = { x: -8.2, z: -11.2 };
    house.position.set(houseSpot.x, terrainHeight(houseSpot.x, houseSpot.z) - 0.1, houseSpot.z);
    house.rotation.y = 0.45;
    house.castShadow = true;
    house.receiveShadow = true;
    scene.add(house);

    // Hàng rào gỗ thấp dọc mép trước vườn, chừa lối đá và chỗ suối chảy qua.
    const fencePoints: Array<{ x: number; y: number; z: number }> = [];
    for (let step = 0; step <= 46; step += 1) {
      const angle = Math.PI * (0.06 + (step / 46) * 0.88);
      const x = Math.cos(angle) * 14.6;
      const z = Math.sin(angle) * 14.6 - 0.6;
      const nearPath = path.some((point) => Math.hypot(point.x - x, point.z - z) < 2.0);
      const nearStream = GARDEN_LANDMARKS.stream.some((point) => Math.hypot(point.x - x, point.z - z) < 2.6);
      if (nearPath || nearStream) { fencePoints.push({ x: NaN, y: 0, z: NaN }); continue; }
      fencePoints.push({ x, y: terrainHeight(x, z) - 0.03, z });
    }
    const runs: Array<Array<{ x: number; y: number; z: number }>> = [[]];
    for (const point of fencePoints) { if (Number.isNaN(point.x)) runs.push([]); else runs[runs.length - 1].push(point); }
    const fenceParts = runs.filter((run) => run.length > 1).map((run) => buildFence(run));
    if (fenceParts.length) {
      const fence = new THREE.Mesh(track(merge(fenceParts)), track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 })));
      fence.castShadow = true;
      fence.receiveShadow = true;
      scene.add(fence);
    }

    // Hồ lớn phía xa (hậu cảnh), nhạt dần trong sương.
    const lake = new THREE.Mesh(track(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2)),
      track(new THREE.MeshStandardMaterial({ color: '#7FC7D2', roughness: 0.08, metalness: 0.05, envMapIntensity: 1.1 })));
    lake.scale.set(18, 1, 6);
    lake.position.set(14, terrainHeight(14, -30) + 0.4, -30);
    scene.add(lake);
    rebuildContacts();
  }

  /*
   * Xích đu — một hệ thống nhất:
   *   cành treo (đường cong cố định, đoạn trên ghế gần như nằm ngang) → điểm treo = mặt dưới cành tại 2 vị trí dây
   *   → swingPivot đặt tại điểm treo, trục xoay chạy DỌC cành (trục X) → dây trái / phải + ghế + hai nhân vật là con của pivot.
   * Đung đưa = xoay pivot quanh trục đó (con lắc), nên dây luôn dính cành, ghế và người đi cùng nhau.
   */
  const swingGround = terrainHeight(swingSpot.x, swingSpot.z);
  const branchHeight = swingGround + BRANCH_Y;
  const ropeX = SEAT_WIDTH / 2 - 0.13;
  const trunkBase = new THREE.Vector3(bigTree.x, 0, bigTree.z);
  const branchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(trunkBase.x + 0.05, branchHeight - 1.05, trunkBase.z),
    new THREE.Vector3(trunkBase.x + 0.95, branchHeight - 0.3, (trunkBase.z + swingSpot.z) / 2),
    new THREE.Vector3(swingSpot.x - ropeX - 0.35, branchHeight, swingSpot.z),
    new THREE.Vector3(swingSpot.x + ropeX + 0.35, branchHeight + 0.03, swingSpot.z),
    new THREE.Vector3(swingSpot.x + ropeX + 1.4, branchHeight + 0.42, swingSpot.z + 0.12),
  ], false, 'centripetal');
  const branchRadius = (t: number) => THREE.MathUtils.lerp(0.36, 0.1, Math.pow(t, 0.85));
  /** t trên cành có x gần nhất với x cho trước (cành chạy theo trục X ở đoạn treo). */
  const branchTAtX = (x: number) => {
    let best = 0;
    let bestDistance = Infinity;
    for (let step = 0; step <= 400; step += 1) {
      const distance = Math.abs(branchCurve.getPointAt(step / 400).x - x);
      if (distance < bestDistance) { bestDistance = distance; best = step / 400; }
    }
    return best;
  };
  const ropeAnchors = [-1, 1].map((side) => {
    const t = branchTAtX(swingSpot.x + side * ropeX);
    const point = branchCurve.getPointAt(t);
    return { side, t, point, underside: point.y - branchRadius(t) * 0.9 };
  });
  const swingPivot = new THREE.Group();
  swingPivot.position.set(swingSpot.x, (ropeAnchors[0].underside + ropeAnchors[1].underside) / 2, swingSpot.z);
  scene.add(swingPivot);
  const seatGroup = new THREE.Group();
  seatGroup.position.y = swingGround + SEAT_HEIGHT - swingPivot.position.y;
  swingPivot.add(seatGroup);
  {
    const swingMaterial = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }));
    const seatTop = seatGroup.position.y; // toạ độ trong pivot
    const SEAT_THICKNESS = 0.09;
    const SEAT_DEPTH = 0.48;
    const pieces: Part[] = [];
    // Ghế: tấm ván dày bo cạnh + 2 thanh đỡ ngang bên dưới; lỗ dây ở hai đầu.
    pieces.push(part(new RoundedBoxGeometry(SEAT_WIDTH, SEAT_THICKNESS, SEAT_DEPTH, 3, 0.03), PALETTE.wood, m4(0, seatTop - SEAT_THICKNESS / 2, 0), 402, 0.04));
    for (const z of [-0.15, 0.15]) {
      pieces.push(part(new RoundedBoxGeometry(SEAT_WIDTH - 0.5, 0.06, 0.07, 2, 0.02), new THREE.Color('#9A6A3E'), m4(0, seatTop - SEAT_THICKNESS - 0.03, z), 404, 0.04));
    }
    // Hai dây: thẳng theo trọng lực từ điểm treo xuống, xuyên lỗ hai đầu ghế, nút thắt dưới ghế.
    for (const anchor of ropeAnchors) {
      const x = anchor.side * ropeX;
      const top = anchor.underside - swingPivot.position.y + 0.02;
      const bottom = seatTop - SEAT_THICKNESS - 0.02;
      const length = top - bottom;
      pieces.push(part(new THREE.CylinderGeometry(0.03, 0.03, length, 8, 6), PALETTE.rope, m4(x, bottom + length / 2, 0), 400, 0.05));
      pieces.push(part(new THREE.SphereGeometry(0.06, 10, 8), new THREE.Color('#CDAE7E'), m4(x, bottom - 0.03, 0, [1, 0.8, 1]), 401, 0.04));
      // Vòng dây ôm sát mép ghế (nhìn rõ chỗ dây đi qua ghế).
      pieces.push(part(new THREE.TorusGeometry(0.05, 0.016, 6, 14), PALETTE.rope, m4(x, seatTop + 0.005, 0, 1, [Math.PI / 2, 0, 0]), 403, 0.04));
    }
    const swingMesh = new THREE.Mesh(track(merge(pieces)), swingMaterial);
    swingMesh.castShadow = true;
    swingMesh.receiveShadow = true;
    swingPivot.add(swingMesh);
    // Vòng dây quấn quanh cành tại điểm treo (đứng yên cùng cành — trục xoay nằm trong vòng quấn).
    const wraps: Part[] = [];
    for (const anchor of ropeAnchors) {
      const tangent = branchCurve.getTangentAt(anchor.t);
      const radius = branchRadius(anchor.t);
      for (const offset of [-0.045, 0, 0.045]) {
        const matrix = new THREE.Matrix4().compose(
          anchor.point.clone().addScaledVector(tangent, offset),
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent),
          new THREE.Vector3(1, 1, 1),
        );
        wraps.push(part(new THREE.TorusGeometry(radius + 0.025, 0.024, 6, 18), PALETTE.rope, matrix, 405, 0.05));
      }
    }
    addStatic(merge(wraps), swingMaterial, 'both');
  }

  /*
   * Vùng chạm (vô hình) cho các vật CHẶN tia chuột: hai nhân vật, xích đu (ghế + dây), thân cây đào.
   * Trước đây tia chỉ thử trên hitbox cây kiến thức → bấm vào mèo / xích đu xuyên qua và mở một cây ở PHÍA SAU.
   * Giờ mọi thứ cùng so khoảng cách dọc tia: vật ở trước nhận click.
   */
  const proxyMaterial = track(new THREE.MeshBasicMaterial({ visible: false }));
  const catGroups: Record<'-1' | '1', THREE.Group> = { '-1': new THREE.Group(), '1': new THREE.Group() };
  const catProxies: THREE.Mesh[] = [];
  for (const side of [-1, 1] as const) {
    const group = catGroups[String(side) as '-1' | '1'];
    seatGroup.add(group);
    const proxy = new THREE.Mesh(track(new THREE.BoxGeometry(0.62, 1.32, 0.7)), proxyMaterial);
    proxy.position.set(side * 0.5, 0.62, 0.08);
    proxy.userData.catSide = side;
    proxy.name = `cat${side}`;
    seatGroup.add(proxy);
    catProxies.push(proxy);
  }
  const swingProxies: THREE.Mesh[] = [];
  {
    const seatTop = seatGroup.position.y;
    const seat = new THREE.Mesh(track(new THREE.BoxGeometry(SEAT_WIDTH + 0.1, 0.3, 0.6)), proxyMaterial);
    seat.position.set(0, seatTop - 0.08, 0);
    seat.name = 'seat';
    swingPivot.add(seat);
    swingProxies.push(seat);
    for (const side of [-1, 1]) {
      // Dây thật ~6 cm: vùng chạm 12 cm — không che cây đang nhìn thấy phía sau (ghế mới là vùng bấm chính).
      const rope = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, Math.abs(seatTop), 0.12)), proxyMaterial);
      rope.position.set(side * ropeX, seatTop / 2, 0);
      rope.name = `rope${side}`;
      swingPivot.add(rope);
      swingProxies.push(rope);
    }
  }
  // Khớp thân thật (bán kính ~0.55 m, loe ~0.8 m ở gốc) — hộp to hơn sẽ che nhầm cây đang nhìn thấy cạnh thân.
  const trunkProxy = new THREE.Mesh(track(new THREE.CylinderGeometry(0.5, 0.78, 4.4, 12)), proxyMaterial);
  trunkProxy.position.set(bigTree.x, terrainHeight(bigTree.x, bigTree.z) + 2.2, bigTree.z);
  trunkProxy.name = 'trunk';
  scene.add(trunkProxy);

  /* Xích đu: con lắc có quán tính — biên độ đổi mượt (không bật/tắt đột ngột). Chạm → đẩy mạnh hơn; chạm khi đã cao → dịu lại. */
  const SWING_BASE = reducedMotion ? 0 : THREE.MathUtils.degToRad(3.5);
  const SWING_MAX = THREE.MathUtils.degToRad(14);
  const swingState = { amplitude: SWING_BASE, target: SWING_BASE, phase: 0 };
  function pushSwing(strength = 1) {
    if (reducedMotion) return;
    swingState.target = swingState.target >= SWING_MAX * 0.85
      ? THREE.MathUtils.degToRad(1.5) // đã đung đưa cao → chạm lần nữa: dịu dần lại
      : Math.min(SWING_MAX, Math.max(swingState.target, swingState.amplitude) + THREE.MathUtils.degToRad(5) * strength);
  }
  const catHop: Record<'-1' | '1', number> = { '-1': 0, '1': 0 };

  /* ─────────── Bộ model thiên nhiên (cây, cỏ, hoa, đá) ─────────── */
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  let kit: GardenKit | null = null;
  let kitSettled = false;
  let disposed = false;
  const kitGroup = new THREE.Group();
  scene.add(kitGroup);
  const addAll = (meshes: THREE.Object3D[]) => { for (const mesh of meshes) kitGroup.add(mesh); };

  /** Ống vỏ cây thon dần theo đường cong (cành treo xích đu, rễ nổi) — có màu theo đỉnh vì vật liệu vỏ của kit dùng AO theo đỉnh. */
  function barkTube(curve: THREE.Curve<THREE.Vector3>, radiusAt: (t: number) => number, tubular: number, radial: number, uvRepeat: number) {
    const geometry = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
    const position = geometry.getAttribute('position');
    const point = new THREE.Vector3();
    for (let ring = 0; ring <= tubular; ring += 1) {
      const t = ring / tubular;
      curve.getPointAt(t, point);
      const radius = radiusAt(t);
      for (let side = 0; side <= radial; side += 1) {
        const index = ring * (radial + 1) + side;
        position.setXYZ(index, point.x + (position.getX(index) - point.x) * radius, point.y + (position.getY(index) - point.y) * radius, point.z + (position.getZ(index) - point.z) * radius);
      }
    }
    geometry.computeVertexNormals();
    const uv = geometry.getAttribute('uv');
    for (let index = 0; index < uv.count; index += 1) uv.setXY(index, uv.getX(index) * uvRepeat, uv.getY(index));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(position.count * 3).fill(0.92), 3));
    return geometry;
  }

  /** Cành ngang treo xích đu: đúng đường cong `branchCurve` mà dây đã gắn vào, bọc vỏ cây của cây đào. */
  function buildSwingBranch(barkMaterial: THREE.Material | null) {
    const material = barkMaterial ?? track(new THREE.MeshStandardMaterial({ color: PALETTE.bark, roughness: 0.95, vertexColors: true }));
    const mesh = new THREE.Mesh(track(barkTube(branchCurve, branchRadius, 48, 14, 4)), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return branchCurve.getPointAt(1);
  }

  function buildKitScenery(activeKit: GardenKit) {
    /* Cây đào lớn trung tâm: model TwistedTree_2, thân làm dày + loe gốc, rễ nổi, tán bổ sung nhiều cụm hoa. */
    const treeInfo = activeKit.models.get('TwistedTree_2')!;
    const scale = BIG_TREE_HEIGHT / treeInfo.size.y;
    // Tâm thân TwistedTree_2 ở độ cao 2–5 (toạ độ model) ≈ (-0.45, 0.05) — đặt sao cho thân đứng đúng mốc cây lớn.
    const TRUNK_AXIS = new THREE.Vector2(-0.45, 0.05);
    const trunkOffset = new THREE.Vector3(TRUNK_AXIS.x, 0, TRUNK_AXIS.y).multiplyScalar(scale);
    const treeRoot = new THREE.Group();
    treeRoot.position.set(bigTree.x - trunkOffset.x, terrainHeight(bigTree.x, bigTree.z) - 0.1, bigTree.z - trunkOffset.z);
    treeRoot.scale.setScalar(scale);
    let barkMaterial: THREE.Material | null = null;
    let leafGeometry: THREE.BufferGeometry | null = null;
    for (const { geometry, source } of treeInfo.parts) {
      const isLeaves = /Leaves/.test(source.name);
      const material = activeKit.material(source, 'sakuraDeep', 0.0032);
      let shaped = geometry;
      if (!isLeaves) {
        (material as THREE.MeshStandardMaterial).color.set('#F0CDB2'); // vỏ xám của model → nâu ấm hợp cảnh
        barkMaterial = material;
        // Thân to + loe gốc (chỉ phần thân chính quanh trục, không phóng cả cây): cây vững chãi, không mảnh khảnh.
        shaped = track(geometry.clone());
        const position = shaped.getAttribute('position');
        for (let index = 0; index < position.count; index += 1) {
          const y = position.getY(index);
          if (y > 7.2) continue;
          const dx = position.getX(index) - TRUNK_AXIS.x;
          const dz = position.getZ(index) - TRUNK_AXIS.y;
          const near = 1 - THREE.MathUtils.smoothstep(Math.hypot(dx, dz), 1.0, 1.9);
          const grow = 1 + (0.5 * (1 - THREE.MathUtils.smoothstep(y, 0.8, 7.2)) + 0.7 * Math.exp(-Math.max(y, 0) * 1.5)) * near;
          position.setX(index, TRUNK_AXIS.x + dx * grow);
          position.setZ(index, TRUNK_AXIS.y + dz * grow);
        }
        shaped.computeVertexNormals();
      } else {
        leafGeometry = geometry;
      }
      const mesh = new THREE.Mesh(shaped, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      treeRoot.add(mesh);
    }
    kitGroup.add(treeRoot);
    treeRoot.updateMatrixWorld(true);

    // Rễ nổi: ống vỏ cây toả ra từ gốc, cong xuống và chìm dần vào đất.
    const groundAtTree = terrainHeight(bigTree.x, bigTree.z);
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2 + 0.35 + (hashUnit(`root:${index}`) - 0.5) * 0.5;
      const reach = 1.6 + hashUnit(`root-r:${index}`) * 1.0;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const along = (distance: number, lift: number) => {
        const x = bigTree.x + direction.x * distance;
        const z = bigTree.z + direction.z * distance;
        return new THREE.Vector3(x, Math.max(terrainHeight(x, z), groundAtTree - 0.4) + lift, z);
      };
      const curve = new THREE.CatmullRomCurve3([along(0.25, 0.95), along(0.85, 0.42), along(reach * 0.55, 0.12), along(reach, -0.18)]);
      const root = new THREE.Mesh(track(barkTube(curve, (t) => THREE.MathUtils.lerp(0.4, 0.04, Math.pow(t, 0.6)), 20, 10, 2)), barkMaterial!);
      root.castShadow = true;
      root.receiveShadow = true;
      kitGroup.add(root);
    }

    // Tán đầy hơn: thêm cụm hoa (Bush_Common — cùng texture lá với cây đào) bám theo chỗ có lá sẵn, nhiều sắc hồng.
    if (leafGeometry) {
      const leafPositions = (leafGeometry as THREE.BufferGeometry).getAttribute('position');
      const world = new THREE.Vector3();
      const picked: THREE.Vector3[] = [];
      const canopyBottom = groundAtTree + BRANCH_Y + 1.6; // không thả hoa xuống vùng dây xích đu / đầu hai nhân vật
      for (let step = 0; step < leafPositions.count && picked.length < 36; step += 23) {
        const index = Math.floor(hashUnit(`leaf:${step}`) * leafPositions.count);
        world.fromBufferAttribute(leafPositions, index).applyMatrix4(treeRoot.matrixWorld);
        if (world.y < canopyBottom) continue;
        if (picked.some((other) => other.distanceTo(world) < 1.45)) continue;
        picked.push(world.clone());
      }
      const tones: Record<'sakura' | 'sakuraDeep' | 'blush', THREE.Matrix4[]> = { sakura: [], sakuraDeep: [], blush: [] };
      const toneColors: Record<keyof typeof tones, THREE.Color[]> = { sakura: [], sakuraDeep: [], blush: [] };
      picked.forEach((point, index) => {
        const tone = (['sakura', 'sakuraDeep', 'blush'] as const)[index % 3];
        const size = 0.95 + hashUnit(`cl:${index}`) * 0.6;
        const object = new THREE.Object3D();
        object.position.copy(point).add(new THREE.Vector3(0, -0.55 * size, 0));
        object.rotation.set((hashUnit(`clx:${index}`) - 0.5) * 0.5, hashUnit(`cly:${index}`) * Math.PI * 2, (hashUnit(`clz:${index}`) - 0.5) * 0.5);
        object.scale.setScalar(size);
        object.updateMatrix();
        tones[tone].push(object.matrix.clone());
        const shade = 0.94 + hashUnit(`cls:${index}`) * 0.1;
        toneColors[tone].push(new THREE.Color(shade, shade, shade));
      });
      addAll(activeKit.instanced('Bush_Common', tones.sakura, { tint: 'sakura', wind: 0.004, colors: toneColors.sakura }));
      addAll(activeKit.instanced('Bush_Common', tones.sakuraDeep, { tint: 'sakuraDeep', wind: 0.004, colors: toneColors.sakuraDeep }));
      addAll(activeKit.instanced('Bush_Common', tones.blush, { tint: 'blush', wind: 0.004, colors: toneColors.blush }));

      // Đèn lồng giấy treo ở các cụm hoa thấp, phía ngoài tán (tránh dây xích đu), ánh ấm.
      const lanternAnchors = picked
        .filter((point) => point.y < canopyBottom + 4.2 && Math.hypot(point.x - bigTree.x, point.z - bigTree.z) > 1.4)
        .filter((point) => !(Math.abs(point.x - swingSpot.x) < SEAT_WIDTH / 2 + 0.6 && Math.abs(point.z - swingSpot.z) < 1.2))
        .sort((a, b) => a.y - b.y)
        .slice(0, 7)
        .map((point) => point.clone().add(new THREE.Vector3(0, -0.35, 0)));
      hangingLanterns = buildHangingLanterns(lanternAnchors, reducedMotion);
      for (const mesh of hangingLanterns.meshes) kitGroup.add(mesh);
      disposables.push(hangingLanterns);
      if (!lowPower && lanternAnchors.length) {
        const glow = new THREE.PointLight('#FFB066', 5, 7, 2);
        const middle = lanternAnchors.reduce((sum, point) => sum.add(point), new THREE.Vector3()).divideScalar(lanternAnchors.length);
        glow.position.copy(middle).add(new THREE.Vector3(0, -1.3, 0));
        kitGroup.add(glow);
      }
    }
    // Dưới gốc: thảm cánh hoa rụng trên cỏ (một InstancedMesh) + vài khóm hoa nhỏ quanh gốc (tránh chỗ xích đu).
    {
      const petalGround = track(new THREE.CircleGeometry(0.095, 6));
      petalGround.scale(1, 0.62, 1);
      petalGround.rotateX(-Math.PI / 2);
      const petalGroundMaterial = track(new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.75, side: THREE.DoubleSide }));
      const count = lowPower ? 180 : 420;
      const carpet = new THREE.InstancedMesh(petalGround, petalGroundMaterial, count);
      const tones = ['#F78FB4', '#FBB7CE', '#F06FA0', '#FFD3E2'].map((hex) => new THREE.Color(hex));
      const object = new THREE.Object3D();
      let used = 0;
      for (let index = 0; index < count * 2 && used < count; index += 1) {
        const angle = hashUnit(`gp:${index}`) * Math.PI * 2;
        const radius = 1.0 + Math.pow(hashUnit(`gpr:${index}`), 0.7) * 5.2; // dày gần gốc, thưa dần ra mép tán
        const x = bigTree.x + Math.cos(angle) * radius;
        const z = bigTree.z + Math.sin(angle) * radius;
        object.position.set(x, terrainHeight(x, z) + 0.035, z);
        object.rotation.set((hashUnit(`gpx:${index}`) - 0.5) * 0.5, hashUnit(`gpy:${index}`) * Math.PI * 2, (hashUnit(`gpz:${index}`) - 0.5) * 0.5);
        object.scale.setScalar(0.8 + hashUnit(`gps:${index}`) * 0.6);
        object.updateMatrix();
        carpet.setMatrixAt(used, object.matrix);
        carpet.setColorAt(used, tones[index % tones.length]);
        used += 1;
      }
      carpet.count = used;
      carpet.receiveShadow = true;
      kitGroup.add(carpet);

      const underA: THREE.Matrix4[] = [];
      const underB: THREE.Matrix4[] = [];
      for (let index = 0; index < 12; index += 1) {
        const angle = (index / 12) * Math.PI * 2 + hashUnit(`uf:${index}`) * 0.4;
        const radius = 2.4 + hashUnit(`ufr:${index}`) * 2.2;
        const x = bigTree.x + Math.cos(angle) * radius;
        const z = bigTree.z + Math.sin(angle) * radius;
        if (x > swingSpot.x - 1.6 && x < swingSpot.x + 1.6 && Math.abs(z - swingSpot.z) < 1.6) continue; // chừa chỗ xích đu
        (index % 2 ? underA : underB).push(matrixAt(x, z, 0.26 + hashUnit(`ufs:${index}`) * 0.1, angle * 3));
      }
      addAll(activeKit.instanced('Flower_3_Group', underA, { wind: 0.03, castShadow: false }));
      addAll(activeKit.instanced('Flower_4_Group', underB, { wind: 0.03, castShadow: false }));
    }
    const tip = buildSwingBranch(barkMaterial);
    addAll(activeKit.instanced('Bush_Common', [matrixAt(tip.x + 0.15, tip.z, 0.7, 0.4, tip.y - terrainHeight(tip.x, tip.z) - 0.35)], { tint: 'sakura', wind: 0.004 }));

    /* Lối đá: phiến đá thật dọc đường cong, sỏi hai bên. */
    const stones: THREE.Matrix4[] = [];
    const stonesSmall: THREE.Matrix4[] = [];
    const pebbles: THREE.Matrix4[] = [];
    const stoneCount = 17;
    for (let index = 0; index < stoneCount; index += 1) {
      const point = pathCurve.getPoint(index / (stoneCount - 1));
      const jitter = (hashUnit(`ps:${index}`) - 0.5) * 0.35;
      const target = index % 3 === 1 ? stonesSmall : stones;
      target.push(matrixAt(point.x + jitter, point.z, index % 3 === 1 ? 0.62 : 0.5 + hashUnit(`pss:${index}`) * 0.08, hashUnit(`psr:${index}`) * Math.PI * 2, -0.02));
      for (const side of [-1, 1]) {
        if (hashUnit(`pp:${index}:${side}`) > 0.55) continue;
        pebbles.push(matrixAt(point.x + side * (0.75 + hashUnit(`ppd:${index}:${side}`) * 0.4), point.z + (hashUnit(`ppz:${index}`) - 0.5) * 0.5,
          0.45 + hashUnit(`ppsz:${index}:${side}`) * 0.5, hashUnit(`ppr:${index}:${side}`) * 6));
      }
    }
    addAll(activeKit.instanced('RockPath_Round_Wide', stones, { castShadow: false }));
    addAll(activeKit.instanced('RockPath_Round_Small_1', stonesSmall, { castShadow: false }));
    addAll(activeKit.instanced('Pebble_Round_2', pebbles, { castShadow: false }));

    /* Đá bờ hồ + đá điểm xuyết cạnh đèn và rìa vườn. */
    const rocks1: THREE.Matrix4[] = [];
    const rocks2: THREE.Matrix4[] = [];
    for (let index = 0; index < 9; index += 1) {
      const angle = (index / 9) * Math.PI * 2 + 0.3;
      const x = pond.x + Math.cos(angle) * (pond.radiusX + 0.05);
      const z = pond.z + Math.sin(angle) * (pond.radiusZ + 0.05);
      (index % 2 ? rocks1 : rocks2).push(matrixAt(x, z, 0.14 + hashUnit(`pr:${index}`) * 0.12, angle * 2, -0.08));
    }
    rocks1.push(matrixAt(-4.2, -5.6, 0.42, 1.2, -0.12), matrixAt(6.6, -3.4, 0.3, 2.4, -0.1));
    rocks2.push(matrixAt(lanterns[1].x + 0.9, lanterns[1].z - 0.3, 0.18, 0.7, -0.06), matrixAt(-8.8, -1.2, 0.36, 0.2, -0.1));
    addAll(activeKit.instanced('Rock_Medium_1', rocks1));
    addAll(activeKit.instanced('Rock_Medium_2', rocks2));
    for (const spot of [...rocks1, ...rocks2]) {
      const position = new THREE.Vector3().setFromMatrixPosition(spot);
      staticContacts.push({ x: position.x, z: position.z, size: 1.2 });
    }

    /* Cỏ, cỏ ba lá, hoa, nấm, bụi — đặt THEO CỤM có chủ đích (gốc cây, mép lối đá, bờ hồ, quanh đá), không rải kín mặt đất. */
    const clusters: Array<{ x: number; z: number; radius: number; count: number }> = [
      { x: bigTree.x - 1.4, z: bigTree.z + 1.1, radius: 1.1, count: 7 }, { x: bigTree.x + 0.4, z: bigTree.z - 1.5, radius: 1.0, count: 6 },
      { x: pond.x + 2.3, z: pond.z - 0.6, radius: 0.9, count: 6 }, { x: pond.x - 1.4, z: pond.z + 1.9, radius: 1.0, count: 6 },
      { x: lanterns[0].x + 0.6, z: lanterns[0].z + 0.5, radius: 0.8, count: 5 }, { x: lanterns[1].x - 0.5, z: lanterns[1].z + 0.6, radius: 0.8, count: 5 },
      { x: -4.2, z: -5.0, radius: 1.2, count: 7 }, { x: 6.6, z: -2.8, radius: 1.0, count: 6 },
    ];
    for (let index = 0; index < 18; index += 1) {
      const point = pathCurve.getPoint(hashUnit(`pc:${index}`));
      const side = index % 2 ? 1 : -1;
      clusters.push({ x: point.x + side * 1.05, z: point.z, radius: 0.45, count: 3 });
    }
    for (let index = 0; index < (lowPower ? 10 : 22); index += 1) {
      const angle = hashUnit(`gc:${index}`) * Math.PI * 2;
      const radius = 6 + hashUnit(`gcr:${index}`) * 9;
      clusters.push({ x: Math.cos(angle) * radius, z: Math.sin(angle) * radius - 1, radius: 0.7, count: 4 });
    }
    const grassShort: THREE.Matrix4[] = [];
    const grassWispy: THREE.Matrix4[] = [];
    const grassColors: THREE.Color[] = [];
    const wispyColors: THREE.Color[] = [];
    clusters.forEach((cluster, clusterIndex) => {
      for (let blade = 0; blade < cluster.count; blade += 1) {
        const angle = hashUnit(`cl:${clusterIndex}:${blade}`) * Math.PI * 2;
        const distance = Math.sqrt(hashUnit(`cd:${clusterIndex}:${blade}`)) * cluster.radius;
        const x = cluster.x + Math.cos(angle) * distance;
        const z = cluster.z + Math.sin(angle) * distance;
        if (Math.hypot((x - pond.x) / pond.radiusX, (z - pond.z) / pond.radiusZ) < 0.95) continue;
        const wispy = hashUnit(`cw:${clusterIndex}:${blade}`) > 0.6;
        const shade = new THREE.Color().setHSL(0.24 + hashUnit(`ch:${clusterIndex}:${blade}`) * 0.04, 0.35, 0.62 + hashUnit(`cv:${clusterIndex}:${blade}`) * 0.12);
        (wispy ? grassWispy : grassShort).push(matrixAt(x, z, wispy ? 0.38 : 0.42 + hashUnit(`cs:${clusterIndex}:${blade}`) * 0.2, angle * 3));
        (wispy ? wispyColors : grassColors).push(shade);
      }
    });
    addAll(activeKit.instanced('Grass_Common_Short', grassShort, { wind: 0.05, castShadow: false, colors: grassColors }));
    addAll(activeKit.instanced('Grass_Wispy_Short', grassWispy, { wind: 0.05, castShadow: false, colors: wispyColors }));

    const clover: THREE.Matrix4[] = [];
    for (const [cx, cz] of [[-2.2, 1.4], [4.2, 5.6], [-5.6, -3.2], [3.8, -4.6], [-1.6, 8.8], [7.8, 1.2]] as const) {
      for (let leaf = 0; leaf < 6; leaf += 1) {
        clover.push(matrixAt(cx + (hashUnit(`cvx:${cx}:${leaf}`) - 0.5) * 1.1, cz + (hashUnit(`cvz:${cz}:${leaf}`) - 0.5) * 1.1, 0.28 + hashUnit(`cvs:${leaf}`) * 0.12, leaf * 1.3));
      }
    }
    addAll(activeKit.instanced('Clover_1', clover, { wind: 0.04, castShadow: false }));

    const flowers3: THREE.Matrix4[] = [];
    const flowers4: THREE.Matrix4[] = [];
    const flowerSpots = [
      [lanterns[0].x - 0.7, lanterns[0].z + 0.3], [lanterns[1].x + 0.5, lanterns[1].z + 0.7], [pond.x + 1.9, pond.z + 1.5], [pond.x - 2.2, pond.z - 1.3],
      [2.6, 12.2], [-0.9, 11.6], [3.6, 8.9], [-2.0, 6.0], [-7.4, 6.6], [8.6, -0.8], [-6.0, -6.6], [5.0, -6.8],
    ] as const;
    flowerSpots.forEach(([x, z], index) => (index % 2 ? flowers3 : flowers4).push(matrixAt(x, z, 0.3 + hashUnit(`fs:${index}`) * 0.1, index * 1.7)));
    addAll(activeKit.instanced('Flower_3_Group', flowers3, { wind: 0.03, castShadow: false }));
    addAll(activeKit.instanced('Flower_4_Group', flowers4, { wind: 0.03, castShadow: false }));

    const mushrooms: THREE.Matrix4[] = [];
    for (let index = 0; index < 5; index += 1) {
      const angle = 1.4 + index * 0.55;
      mushrooms.push(matrixAt(bigTree.x + Math.cos(angle) * 1.35, bigTree.z + Math.sin(angle) * 1.35, 0.32 + hashUnit(`mu:${index}`) * 0.12, angle));
    }
    addAll(activeKit.instanced('Mushroom_Common', mushrooms, { castShadow: false }));

    /* Bờ suối: đá cuội nhiều cỡ sát mép nước, vài tảng đá, cụm cỏ + cỏ ba lá (rêu), khóm hoa; ba phiến đá bước qua suối. */
    const pebbleA: THREE.Matrix4[] = [];
    const pebbleB: THREE.Matrix4[] = [];
    const bankRocks: THREE.Matrix4[] = [];
    const bankGrass: THREE.Matrix4[] = [];
    const bankGrassColors: THREE.Color[] = [];
    const bankClover: THREE.Matrix4[] = [];
    const bankFlowers: THREE.Matrix4[] = [];
    const bankFlowerA: THREE.Matrix4[] = [];
    const bankFlowerB: THREE.Matrix4[] = [];
    const insidePond = (x: number, z: number) => Math.hypot((x - pond.x) / pond.radiusX, (z - pond.z) / pond.radiusZ) < 1.15;
    const bankSteps = lowPower ? 70 : 120;
    for (let step = 0; step < bankSteps; step += 1) {
      const t = step / bankSteps;
      for (const side of [-1, 1]) {
        const key = `${step}:${side}`;
        const spot = streamBankPoint(t + (hashUnit(`bkt:${key}`) - 0.5) * 0.006, side * (-0.05 + hashUnit(`bk:${key}`) * 0.4));
        if (insidePond(spot.x, spot.z)) continue;
        const roll = hashUnit(`bkr:${key}`);
        if (roll < 0.3) continue; // thưa, không xếp thành viền đều
        const pebble = matrixAt(spot.x, spot.z, 0.5 + hashUnit(`bks:${key}`) * 0.9, hashUnit(`bka:${key}`) * 6, -0.04);
        (roll > 0.65 ? pebbleA : pebbleB).push(pebble);
        if (step % 9 === 0 && side === (step % 18 === 0 ? 1 : -1)) {
          const rock = streamBankPoint(t, side * 0.45);
          bankRocks.push(matrixAt(rock.x, rock.z, 0.12 + hashUnit(`bkk:${key}`) * 0.1, step, -0.1));
        }
        if (step % 4 === 0) {
          const grass = streamBankPoint(t, side * (0.55 + hashUnit(`bkg:${key}`) * 0.6));
          if (!insidePond(grass.x, grass.z)) {
            bankGrass.push(matrixAt(grass.x, grass.z, 0.36 + hashUnit(`bkgs:${key}`) * 0.18, step * 2.1));
            bankGrassColors.push(new THREE.Color().setHSL(0.25, 0.32, 0.6 + hashUnit(`bkgc:${key}`) * 0.1));
          }
        }
        if (step % 7 === 3) {
          const moss = streamBankPoint(t, side * (0.35 + hashUnit(`bkm:${key}`) * 0.4));
          if (!insidePond(moss.x, moss.z)) bankClover.push(matrixAt(moss.x, moss.z, 0.24 + hashUnit(`bkms:${key}`) * 0.1, step));
        }
        if (step % 6 === (side === 1 ? 2 : 5)) {
          const flower = streamBankPoint(t, side * (0.55 + hashUnit(`bkf:${key}`) * 0.7));
          if (!insidePond(flower.x, flower.z)) {
            const roll = hashUnit(`bkft:${key}`);
            (roll < 0.4 ? bankFlowerA : roll < 0.75 ? bankFlowerB : bankFlowers).push(matrixAt(flower.x, flower.z, roll < 0.75 ? 0.26 + hashUnit(`bkfs:${key}`) * 0.1 : 0.3, step * 1.9));
          }
        }
      }
    }
    // Ba phiến đá bước qua suối (đoạn hạ nguồn, gần lối đi phía trước).
    const crossing = 0.78;
    const steppingStones: THREE.Matrix4[] = [];
    for (const [index, offset] of [-0.4, 0, 0.4].entries()) {
      const spot = streamCrossPoint(crossing + (index - 1) * 0.004, offset);
      steppingStones.push(matrixAt(spot.x, spot.z, 0.42, index * 1.3, offset === 0 ? 0.1 : 0.04));
    }
    addAll(activeKit.instanced('Pebble_Round_2', pebbleA, { castShadow: false }));
    addAll(activeKit.instanced('Pebble_Round_3', pebbleB, { castShadow: false }));
    addAll(activeKit.instanced('Rock_Medium_2', bankRocks));
    addAll(activeKit.instanced('RockPath_Round_Small_2', steppingStones, { castShadow: true }));
    addAll(activeKit.instanced('Grass_Wispy_Short', bankGrass, { wind: 0.05, castShadow: false, colors: bankGrassColors }));
    addAll(activeKit.instanced('Clover_1', bankClover, { wind: 0.04, castShadow: false }));
    addAll(activeKit.instanced('Bush_Common_Flowers', bankFlowers.map((matrix) => matrix.clone().scale(new THREE.Vector3(1.5, 1.5, 1.5))), { tint: 'bush', wind: 0.006 }));
    addAll(activeKit.instanced('Flower_3_Group', bankFlowerA, { wind: 0.03, castShadow: false }));
    addAll(activeKit.instanced('Flower_4_Group', bankFlowerB, { wind: 0.03, castShadow: false }));
    // Vài viên sỏi nhô lên giữa dòng (nước chảy vòng qua) — suối trông thật hơn.
    const streamStones: THREE.Matrix4[] = [];
    for (let index = 0; index < 14; index += 1) {
      const t = 0.08 + index * 0.065 + (hashUnit(`ss:${index}`) - 0.5) * 0.03;
      const spot = streamCrossPoint(t, (hashUnit(`sso:${index}`) - 0.5) * 0.9);
      if (insidePond(spot.x, spot.z)) continue;
      streamStones.push(matrixAt(spot.x, spot.z, 0.7 + hashUnit(`sss:${index}`) * 0.7, index * 2.3, 0.02));
    }
    addAll(activeKit.instanced('Pebble_Round_3', streamStones, { castShadow: false }));
    // Đầu nguồn: suối chảy ra từ dưới dải bụi bìa rừng — vài tảng đá + bụi che chỗ nước bắt đầu.
    const sourceRocks: THREE.Matrix4[] = [];
    const sourceBushes: THREE.Matrix4[] = [];
    for (const [index, offset] of [-1.4, 1.5, -0.6].entries()) {
      const rock = streamCrossPoint(0.015 + index * 0.012, offset);
      sourceRocks.push(matrixAt(rock.x, rock.z, 0.32 + index * 0.06, index * 1.7, -0.15));
    }
    for (const [index, offset] of [-2.6, 2.7, 0].entries()) {
      const bush = streamCrossPoint(index === 2 ? 0.0 : 0.03, offset);
      sourceBushes.push(matrixAt(bush.x, bush.z, 1.6 + index * 0.3, index * 2.1, -0.4));
    }
    addAll(activeKit.instanced('Rock_Medium_1', sourceRocks));
    addAll(activeKit.instanced('Bush_Common', sourceBushes, { tint: 'bush', wind: 0.004 }));

    /* Hàng bụi viền sau vườn + rặng cây xa (nhạt vào sương). */
    const bushes: THREE.Matrix4[] = [];
    const flowerBushes: THREE.Matrix4[] = [];
    for (let index = 0; index < 16; index += 1) {
      const angle = Math.PI * (0.96 + (index / 15) * 1.08) + (hashUnit(`ba:${index}`) - 0.5) * 0.1;
      const radius = 12.8 + hashUnit(`br:${index}`) * 1.4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius - 1;
      (index % 3 === 0 ? flowerBushes : bushes).push(matrixAt(x, z, 0.75 + hashUnit(`bs:${index}`) * 0.4, angle * 2));
      staticContacts.push({ x, z, size: 2.0 });
    }
    addAll(activeKit.instanced('Bush_Common', bushes, { tint: 'bush', wind: 0.006 }));
    addAll(activeKit.instanced('Bush_Common_Flowers', flowerBushes, { tint: 'bush', wind: 0.006 }));
    // Bìa rừng: dải bụi lớn sau vườn, nhạt dần vào sương → đường chân trời mềm.
    const edge: THREE.Matrix4[] = [];
    for (let index = 0; index < (lowPower ? 14 : 24); index += 1) {
      const angle = Math.PI * (0.98 + (index / 23) * 1.04) + (hashUnit(`ea:${index}`) - 0.5) * 0.08;
      const radius = 24 + hashUnit(`er:${index}`) * 5;
      edge.push(matrixAt(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.9 - 2, 2.4 + hashUnit(`es:${index}`) * 1.6, angle * 3, -0.9));
    }
    addAll(activeKit.instanced('Bush_Common', edge, { tint: 'bush', castShadow: false }));
    rebuildContacts();
  }

  function buildFallbackScenery() {
    const [trunk, canopy] = proceduralBigTree(bigTree, swingSpot, branchHeight);
    addStatic(trunk);
    addStatic(canopy);
  }

  /* ─────────── Cây kiến thức ─────────── */
  const plantGroup = new THREE.Group();
  scene.add(plantGroup);
  const hitGeometry = track(new THREE.CylinderGeometry(0.6, 0.6, 1, 10));
  hitGeometry.translate(0, 0.5, 0);
  const hitMaterial = track(new THREE.MeshBasicMaterial({ visible: false }));
  let hitMesh: THREE.InstancedMesh | null = null;
  let hitMatrices: THREE.Matrix4[] = [];
  let placements: PlantPlacement[] = [];
  /** Theo thứ tự `placements`: các InstancedMesh (mỗi phần hình một mesh) + chỉ số instance + ma trận gốc. */
  let plantSlots: Array<{ meshes: THREE.InstancedMesh[]; index: number; base: THREE.Matrix4; color: THREE.Color | null }> = [];
  /** Chiều cao thật của từng cây (m) — để chọn cây theo khoảng cách trên màn hình. */
  let plantHeights: number[] = [];
  const fallbackGeometry = new Map<PlantStage, { geometry: THREE.BufferGeometry; height: number }>();

  const selectionRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.62, 0.045, 8, 40)),
    track(new THREE.MeshStandardMaterial({ color: '#FF9DB1', emissive: '#FF7F9A', emissiveIntensity: 0.55, roughness: 0.6 })));
  selectionRing.rotation.x = -Math.PI / 2;
  selectionRing.visible = false;
  scene.add(selectionRing);
  let selectedIndex = -1;
  let selectedPop = 0;
  let hoveredIndex = -1;

  function variantOf(placement: PlantPlacement) {
    const variants = PLANT_VARIANTS[placement.stage];
    return variants[Math.floor(hashUnit(`${placement.contentKey}:v`) * variants.length)];
  }

  function buildPlants() {
    for (const child of [...plantGroup.children]) { plantGroup.remove(child); (child as THREE.InstancedMesh).dispose?.(); }
    plantSlots = placements.map(() => ({ meshes: [], index: 0, base: new THREE.Matrix4(), color: null }));
    const heights: number[] = [];
    plantHeights = heights;
    plantContacts = [];
    if (!kitSettled) return;
    // Gom cây cùng (model, bảng màu) → một nhóm InstancedMesh.
    const groups = new Map<string, number[]>();
    placements.forEach((placement, index) => {
      const variant = variantOf(placement);
      const key = kit ? `${variant.model}|${variant.tint}|${placement.stage}` : placement.stage;
      groups.set(key, [...(groups.get(key) ?? []), index]);
    });
    for (const [key, indices] of groups) {
      const matrices: THREE.Matrix4[] = [];
      const colors: THREE.Color[] = [];
      let meshes: THREE.InstancedMesh[];
      if (kit) {
        const variant = variantOf(placements[indices[0]]);
        const size = kit.models.get(variant.model)!.size;
        const fit = Math.min(variant.height / size.y, variant.maxWidth / Math.max(size.x, size.z));
        for (const index of indices) {
          const placement = placements[index];
          const scale = fit * placement.scale;
          matrices.push(matrixAt(placement.x, placement.z, scale, placement.rotation, -0.03));
          const tone = 0.92 + hashUnit(`${placement.contentKey}:c`) * 0.14;
          colors.push(new THREE.Color(tone, tone, tone * 0.98));
          heights[index] = size.y * scale;
        }
        meshes = kit.instanced(variant.model, matrices, { tint: variant.tint, wind: variant.height > 1 ? 0.012 / variant.height : 0.03, colors });
      } else {
        const stage = key as PlantStage;
        if (!fallbackGeometry.has(stage)) fallbackGeometry.set(stage, plantGeometry(stage));
        const { geometry, height } = fallbackGeometry.get(stage)!;
        const scale = 0.66;
        for (const index of indices) {
          const placement = placements[index];
          matrices.push(matrixAt(placement.x, placement.z, placement.scale * scale, placement.rotation));
          heights[index] = height * placement.scale * scale;
        }
        const mesh = new THREE.InstancedMesh(geometry, flatMaterial, matrices.length);
        matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshes = [mesh];
      }
      for (const mesh of meshes) { mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); plantGroup.add(mesh); }
      indices.forEach((plantIndex, instanceIndex) => { plantSlots[plantIndex] = { meshes, index: instanceIndex, base: matrices[instanceIndex], color: colors[instanceIndex] ?? null }; });
    }
    hitMesh = new THREE.InstancedMesh(hitGeometry, hitMaterial, Math.max(1, placements.length));
    hitMesh.count = placements.length;
    hitMatrices = [];
    placements.forEach((placement, index) => {
      hitMatrices[index] = m4(placement.x, terrainHeight(placement.x, placement.z) - 0.1, placement.z, [1, Math.max(1.2, (heights[index] ?? 1) + 0.35), 1]);
      hitMesh!.setMatrixAt(index, hitMatrices[index]);
      plantContacts.push({ x: placement.x, z: placement.z, size: placement.stage === 'sprout' ? 0.9 : 1.5 });
    });
    hitMesh.instanceMatrix.needsUpdate = true;
    hitMesh.computeBoundingSphere();
    plantGroup.add(hitMesh);
    rebuildContacts();
    if (stageFilter !== null) applyFilter();
  }

  let stageFilter: PlantStage | null = null;
  const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  /** Lọc theo giai đoạn: cây không khớp thu về 0 (ẩn, không vẽ bóng), hitbox cũng thu về 0 → không chọn được. */
  function applyFilter() {
    placements.forEach((placement, index) => {
      const slot = plantSlots[index];
      const isShown = stageFilter === null || placement.stage === stageFilter;
      if (slot?.meshes.length) for (const mesh of slot.meshes) { mesh.setMatrixAt(slot.index, isShown ? slot.base : hiddenMatrix); mesh.instanceMatrix.needsUpdate = true; }
      if (hitMesh) {
        hitMesh.setMatrixAt(index, isShown ? hitMatrices[index] : hiddenMatrix);
        hitMesh.instanceMatrix.needsUpdate = true;
      }
    });
    hitMesh?.computeBoundingSphere();
  }
  function setFilter(stage: PlantStage | null) {
    stageFilter = stage;
    if (selectedIndex >= 0 && stage !== null && placements[selectedIndex]?.stage !== stage) options.onSelect(null);
    applyFilter();
  }
  const isPlantShown = (index: number) => stageFilter === null || placements[index]?.stage === stageFilter;

  function setPlants(next: readonly PlantPlacement[]) {
    placements = [...next];
    hoveredIndex = -1;
    selectedIndex = -1;
    selectionRing.visible = false;
    hitMesh = null;
    buildPlants();
  }
  setPlants(options.plants);

  // Nhường luồng chính giữa các bước dựng nặng → trang không bị "đơ" một nhịp dài (nhất là trên điện thoại).
  const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  // Từ lúc kit về tới khi shader biên dịch xong: KHÔNG render (màn "Đang trồng khu vườn" đang che) — nếu render giữa chừng,
  // trình duyệt biên dịch đồng bộ mọi shader mới trong một khung hình → khựng ~300 ms.
  let isPreparing = false;
  loader.loadAsync(KIT_URL)
    .then(async (gltf) => {
      if (disposed) return;
      isPreparing = true;
      await yieldToBrowser();
      const loaded = new GardenKit(gltf, reducedMotion ? 0 : 1);
      await yieldToBrowser();
      if (disposed) { loaded.dispose(); return; }
      try {
        buildKitScenery(loaded);
        kit = loaded;
      } catch (error) {
        loaded.dispose();
        throw error;
      }
      await yieldToBrowser();
    })
    .catch((error) => {
      if (disposed) return;
      console.warn('[garden] Không dựng được bộ model cây — dùng cây dự phòng.', error);
      for (const child of [...kitGroup.children]) kitGroup.remove(child);
      buildFallbackScenery();
    })
    .finally(() => {
      if (disposed) return;
      kitSettled = true;
      if (!kit) buildSwingBranch(null);
      try {
        buildPlants();
        setSelected(selectedKeyPending);
      } catch (error) {
        console.warn('[garden] Không trồng được cây kiến thức.', error);
      }
      // Biên dịch shader song song (KHR_parallel_shader_compile) trước khi hiện cảnh — tránh khựng ở khung hình đầu.
      renderer.compileAsync(scene, camera)
        .catch(() => undefined)
        .finally(() => {
          isPreparing = false;
          if (!disposed) options.onSceneReady(Boolean(kit));
        });
    });

  /* ─────────── Hai nhân vật ─────────── */
  const mixers: THREE.AnimationMixer[] = [];
  const characterRoots: THREE.Object3D[] = [];

  async function loadCharacter(url: string, side: -1 | 1) {
    const gltf = await loader.loadAsync(url);
    if (disposed) { disposeObject(gltf.scene); return; }
    const model = gltf.scene;
    model.traverse((object) => {
      const mesh = object as THREE.SkinnedMesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false; // khung bao của mesh skin không theo animation → tránh nhân vật biến mất ở mép khung
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.metalness = 0;
      material.roughness = 0.8;
      material.envMapIntensity = 0.7;
      material.side = THREE.FrontSide;
    });
    const clip = gltf.animations.find((animation) => /sit/i.test(animation.name)) ?? gltf.animations[0];
    const mixer = new THREE.AnimationMixer(model);
    if (clip) {
      const action = mixer.clipAction(clip);
      action.play();
      // Lệch pha giữa hai người để không lắc chân đồng loạt; giảm chuyển động → đứng yên ở giữa clip.
      mixer.setTime(side === 1 ? clip.duration * 0.5 : 0);
      if (reducedMotion) action.paused = true;
      else action.timeScale = 0.8;
    }
    mixers.push(mixer);
    // Đặt người ngồi đúng mặt ghế: đo xương hông (Hips) sau khi áp tư thế ngồi, hạ sao cho hông cao hơn mặt ghế một chút.
    model.updateMatrixWorld(true);
    const hips = model.getObjectByName('Hips');
    const hipsY = hips ? hips.getWorldPosition(new THREE.Vector3()).y : 0.9;
    const scale = 0.95;
    model.scale.setScalar(scale);
    model.position.set(side * 0.5, 0.08 - hipsY * scale, 0.02);
    model.rotation.y = -side * 0.16; // hơi quay về phía nhau
    catGroups[String(side) as '-1' | '1'].add(model);
    characterRoots.push(model);
  }
  Promise.allSettled([loadCharacter(MODELS.left, -1), loadCharacter(MODELS.right, 1)]).then((results) => {
    if (!disposed) options.onCharactersReady(results.every((result) => result.status === 'fulfilled'));
  });

  /* ─────────── Vài cánh hoa rơi nhẹ quanh cây lớn ─────────── */
  const petalCount = reducedMotion ? 0 : lowPower ? 18 : 40;
  const petalGeometry = track(new THREE.CircleGeometry(0.045, 6));
  petalGeometry.scale(1, 0.6, 1);
  const petalMaterial = track(new THREE.MeshStandardMaterial({ color: '#F9CBD8', side: THREE.DoubleSide, roughness: 0.7 }));
  const petals = new THREE.InstancedMesh(petalGeometry, petalMaterial, Math.max(1, petalCount));
  petals.count = petalCount;
  scene.add(petals);
  const dummy = new THREE.Object3D();
  // Tham số ngẫu nhiên của từng cánh hoa tính MỘT lần (không băm chuỗi / tính độ cao đất mỗi khung hình).
  const petalParams = Array.from({ length: petalCount }, (_, index) => {
    const radius = 1.4 + hashUnit(`pr:${index}`) * 3.4;
    const angle0 = hashUnit(`pa:${index}`) * Math.PI * 2;
    const groundX = bigTree.x + Math.cos(angle0) * radius;
    const groundZ = bigTree.z + Math.sin(angle0) * radius * 0.7;
    return { cycle: 10 + hashUnit(`pc:${index}`) * 6, offset: hashUnit(`po:${index}`), angle0, radius, ground: terrainHeight(groundX, groundZ) };
  });

  /* ─────────── Camera, kích thước, chọn cây ─────────── */
  const cameraGoal = { position: new THREE.Vector3(), target: DEFAULT_TARGET.clone(), active: false };
  const defaultPosition = () => {
    const aspect = camera.aspect || 1;
    const distanceScale = aspect < 0.6 ? 1.9 : aspect < 0.8 ? 1.6 : aspect < 1.2 ? 1.25 : 1; // màn dọc: lùi xa để thấy trọn vườn + các biển
    return DEFAULT_TARGET.clone().add(DEFAULT_OFFSET.clone().multiplyScalar(distanceScale));
  };
  function resize() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controls.maxDistance = camera.aspect < 0.8 ? 40 : 30;
  }
  resize();
  camera.position.copy(defaultPosition());
  controls.target.copy(DEFAULT_TARGET);
  controls.update();

  function resetCamera() {
    cameraGoal.position.copy(defaultPosition());
    cameraGoal.target.copy(DEFAULT_TARGET);
    cameraGoal.active = true;
  }
  controls.addEventListener('start', () => { cameraGoal.active = false; });

  /*
   * Chọn cây: tia chuột chỉ thử trên hitbox vô hình của cây (mặt đất, suối, cỏ, đá không bao giờ chặn), rồi trong các cây
   * trúng tia + các cây có thân nằm gần con trỏ trên màn hình (chuột 22px, chạm 40px), lấy cây có THÂN gần con trỏ nhất —
   * không phải cây đứng trước nhất → hai cây sát nhau vẫn chọn riêng được, mầm nhỏ không cần chạm trúng lá.
   */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const projectedBase = new THREE.Vector3();
  const projectedTop = new THREE.Vector3();
  const toScreen = (vector: THREE.Vector3, rect: DOMRect) => ({ x: (vector.x + 1) / 2 * rect.width, y: (1 - vector.y) / 2 * rect.height, behind: vector.z > 1 });
  let lastBlocker: string | null = null;
  type Pick = { kind: 'plant'; index: number } | { kind: 'cat'; side: -1 | 1 } | { kind: 'swing' } | { kind: 'sign'; id: SignId } | { kind: 'none' };
  const pick = (event: PointerEvent): Pick => {
    const rect = canvas.getBoundingClientRect(); // toạ độ TƯƠNG ĐỐI canvas (canvas không nằm ở góc viewport)
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    pointer.set((px / rect.width) * 2 - 1, -(py / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera); // đúng camera đang render
    // 1) Vật chặn cứng: nhân vật, ghế xích đu, thân cây — lấy giao điểm gần nhất. Dây xích đu (mảnh) là vật "mềm":
    //    chỉ nhận click khi không có cây nào ở điểm đó (dây chồng lên thân cây phía sau → người dùng muốn bấm cây).
    const blockers = raycaster.intersectObjects([...catProxies, swingProxies[0], trunkProxy, ...signFaces], false);
    const ropeHit = raycaster.intersectObjects(swingProxies.slice(1), false)[0];
    const nearestBlocker = blockers[0];
    lastBlocker = nearestBlocker ? String(nearestBlocker.object.name || 'unnamed') : null;
    // 2) Cây kiến thức: giao điểm thật với hitbox (khoảng cách dọc tia) + gần thân trên màn hình.
    const plantHitDistance = new Map<number, number>();
    if (hitMesh) {
      for (const hit of raycaster.intersectObject(hitMesh, false)) {
        const id = hit.instanceId ?? -1;
        if (id >= 0 && !plantHitDistance.has(id)) plantHitDistance.set(id, hit.distance);
      }
    }
    const reach = event.pointerType === 'mouse' ? 18 : 34;
    let best = -1;
    let bestScore = Infinity;
    placements.forEach((placement, index) => {
      if (!isPlantShown(index)) return;
      const rayDistance = plantHitDistance.get(index);
      // Cây nằm SAU vật chặn trên cùng tia → không được chọn (đây là lỗi "bấm mèo lại mở cây phía sau").
      if (nearestBlocker && (rayDistance === undefined || rayDistance > nearestBlocker.distance)) return;
      const ground = terrainHeight(placement.x, placement.z);
      projectedBase.set(placement.x, ground, placement.z).project(camera);
      projectedTop.set(placement.x, ground + Math.max(0.6, plantHeights[index] ?? 1), placement.z).project(camera);
      const base = toScreen(projectedBase, rect);
      const top = toScreen(projectedTop, rect);
      if (base.behind) return;
      const dx = top.x - base.x;
      const dy = top.y - base.y;
      const t = Math.max(0, Math.min(1, ((px - base.x) * dx + (py - base.y) * dy) / Math.max(dx * dx + dy * dy, 1)));
      const distance = Math.hypot(px - (base.x + dx * t), py - (base.y + dy * t));
      if (rayDistance === undefined && distance > reach) return;
      const score = distance - (rayDistance !== undefined ? 8 : 0);
      if (score < bestScore) { bestScore = score; best = index; }
    });
    if (nearestBlocker?.object.userData.signId && best < 0) return { kind: 'sign', id: nearestBlocker.object.userData.signId as SignId };
    if (best >= 0) return { kind: 'plant', index: best };
    if (ropeHit && (!nearestBlocker || ropeHit.distance < nearestBlocker.distance)) return { kind: 'swing' };
    if (nearestBlocker) {
      const side = nearestBlocker.object.userData.catSide as -1 | 1 | undefined;
      if (side) return { kind: 'cat', side };
      if (swingProxies.includes(nearestBlocker.object as THREE.Mesh)) return { kind: 'swing' };
    }
    return { kind: 'none' };
  };
  let downAt: { x: number; y: number; time: number } | null = null;
  const onPointerDown = (event: PointerEvent) => { downAt = { x: event.clientX, y: event.clientY, time: performance.now() }; };
  const onPointerUp = (event: PointerEvent) => {
    if (!downAt) return;
    const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y);
    const quick = performance.now() - downAt.time < 600;
    downAt = null;
    if (moved > 8 || !quick) return; // kéo để xoay — không phải chạm chọn
    const result = pick(event);
    if (result.kind === 'plant') { options.onSelect(placements[result.index].contentKey); return; }
    if (result.kind === 'swing') { pushSwing(1); return; }
    if (result.kind === 'sign') { options.onSignTap?.(result.id); return; }
    if (result.kind === 'cat') {
      catHop[String(result.side) as '-1' | '1'] = 1;
      pushSwing(0.6);
      options.onCatTap?.(result.side);
      return;
    }
    options.onSelect(null);
  };

  /* Hover (chỉ chuột): con trỏ tay, vòng sáng nhẹ dưới gốc, cây sáng lên một chút. Chạm trên mobile không phụ thuộc hover. */
  const hoverRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.6, 0.03, 8, 40)),
    track(new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.75, depthWrite: false })));
  hoverRing.rotation.x = -Math.PI / 2;
  hoverRing.visible = false;
  scene.add(hoverRing);
  const brightened = new THREE.Color();
  function paintPlant(index: number, factor: number) {
    const slot = plantSlots[index];
    if (!slot?.color) return;
    brightened.copy(slot.color).multiplyScalar(factor);
    for (const mesh of slot.meshes) { mesh.setColorAt(slot.index, brightened); if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; }
  }
  function setHovered(index: number) {
    if (index === hoveredIndex) return;
    if (hoveredIndex >= 0) paintPlant(hoveredIndex, 1);
    hoveredIndex = index;
    canvas.style.cursor = index >= 0 ? 'pointer' : 'grab';
    hoverRing.visible = index >= 0 && index !== selectedIndex;
    if (index < 0) return;
    paintPlant(index, 1.18);
    const placement = placements[index];
    hoverRing.position.set(placement.x, terrainHeight(placement.x, placement.z) + 0.05, placement.z);
    hoverRing.scale.setScalar(placement.stage === 'sprout' ? 0.75 : 1);
  }
  let hoverFrame = 0;
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || hoverFrame || downAt) return;
    hoverFrame = requestAnimationFrame(() => {
      hoverFrame = 0;
      const result = pick(event);
      setHovered(result.kind === 'plant' ? result.index : -1);
      if (result.kind === 'cat' || result.kind === 'swing' || result.kind === 'sign') canvas.style.cursor = 'pointer';
    });
  };
  const onPointerLeave = () => setHovered(-1);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);

  let selectedKeyPending: string | null = null;
  let poppedIndex = -1;
  function restorePlant(index: number) {
    const slot = plantSlots[index];
    if (!slot?.meshes.length) return;
    for (const mesh of slot.meshes) { mesh.setMatrixAt(slot.index, slot.base); mesh.instanceMatrix.needsUpdate = true; }
  }
  function setSelected(contentKey: string | null) {
    selectedKeyPending = contentKey;
    const previous = selectedIndex;
    selectedIndex = contentKey ? placements.findIndex((placement) => placement.contentKey === contentKey) : -1;
    if (previous !== selectedIndex) {
      selectedPop = 0;
      if (poppedIndex >= 0) restorePlant(poppedIndex);
      poppedIndex = -1;
    }
    selectionRing.visible = selectedIndex >= 0 && kitSettled;
    if (hoveredIndex === selectedIndex) hoverRing.visible = false;
    if (selectionRing.visible) {
      const placement = placements[selectedIndex];
      selectionRing.position.set(placement.x, terrainHeight(placement.x, placement.z) + 0.05, placement.z);
    }
  }

  /* Vị trí màn hình của mặt biển + đầu nhân vật → lớp HTML (chỉ gọi khi đổi > 0.5px). */
  const anchorVector = new THREE.Vector3();
  const anchorRight = new THREE.Vector3();
  let lastAnchorKey = '';
  const headBones: Record<'-1' | '1', THREE.Object3D | null> = { '-1': null, '1': null };
  function project(world: THREE.Vector3, rightWorld: THREE.Vector3 | null, width: number, height: number): ScreenAnchor {
    anchorVector.copy(world).project(camera);
    const visible = anchorVector.z < 1 && Math.abs(anchorVector.x) < 1.2 && Math.abs(anchorVector.y) < 1.2;
    const x = (anchorVector.x + 1) / 2 * width;
    const y = (1 - anchorVector.y) / 2 * height;
    let screenWidth = 0;
    if (rightWorld) {
      anchorRight.copy(rightWorld).project(camera);
      screenWidth = Math.abs(((anchorRight.x + 1) / 2 * width) - x) * 2;
    }
    return { x, y, width: screenWidth, visible };
  }
  function publishAnchors() {
    if (!options.onAnchors) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const signs = {} as Record<SignId, ScreenAnchor>;
    for (const id of SIGN_IDS) {
      const frame = signFrames.get(id)!;
      signs[id] = project(frame.center, frame.right, width, height);
    }
    const cats = {} as Record<'-1' | '1', ScreenAnchor>;
    for (const key of ['-1', '1'] as const) {
      const head = headBones[key] ?? (headBones[key] = catGroups[key].getObjectByName('Head') ?? null);
      if (head) head.getWorldPosition(anchorVector);
      else catGroups[key].getWorldPosition(anchorVector).add(new THREE.Vector3(Number(key) * 0.5, 1.2, 0));
      cats[key] = project(anchorVector.clone(), null, width, height);
    }
    const key = [...SIGN_IDS.map((id) => `${signs[id].x.toFixed(1)},${signs[id].y.toFixed(1)},${signs[id].width.toFixed(1)},${signs[id].visible}`),
      cats['-1'].x.toFixed(0), cats['-1'].y.toFixed(0), cats['1'].x.toFixed(0), cats['1'].y.toFixed(0)].join('|');
    if (key === lastAnchorKey) return;
    lastAnchorKey = key;
    options.onAnchors({ signs, cats });
  }

  /* Gỡ lỗi chọn cây (?garden-debug=1): toạ độ màn hình của gốc / ngọn từng cây + nhân vật + ghế — để kiểm thử click chính xác. */
  const isDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('garden-debug');
  let debugTimer = 0;
  function writeDebug() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const plants = placements.map((placement, index) => {
      const ground = terrainHeight(placement.x, placement.z);
      const base = project(new THREE.Vector3(placement.x, ground, placement.z), null, width, height);
      const top = project(new THREE.Vector3(placement.x, ground + (plantHeights[index] ?? 1), placement.z), null, width, height);
      return { key: placement.contentKey, shown: isPlantShown(index), base: [Math.round(base.x), Math.round(base.y)], top: [Math.round(top.x), Math.round(top.y)] };
    });
    const centerOf = (object: THREE.Object3D) => { const p = project(object.getWorldPosition(new THREE.Vector3()), null, width, height); return [Math.round(p.x), Math.round(p.y)]; };
    const cloudMesh = scene.getObjectByName('sky-clouds') as THREE.InstancedMesh | undefined;
    const clouds: number[][] = [];
    if (cloudMesh) for (let index = 0; index < cloudMesh.count; index += 1) {
      const matrix = new THREE.Matrix4();
      cloudMesh.getMatrixAt(index, matrix);
      const p = project(new THREE.Vector3().setFromMatrixPosition(matrix), null, width, height);
      clouds.push([Math.round(p.x), Math.round(p.y), p.visible ? 1 : 0]);
    }
    canvas.dataset.debug = JSON.stringify({ clouds, plants, cats: catProxies.map(centerOf), trunk: centerOf(trunkProxy), seat: centerOf(swingProxies[0]), swing: +THREE.MathUtils.radToDeg(swingState.amplitude).toFixed(2), swingTarget: +THREE.MathUtils.radToDeg(swingState.target).toFixed(2), selected: selectedIndex >= 0 ? placements[selectedIndex]?.contentKey ?? null : null, lastBlocker });
  }

  /* ─────────── Vòng lặp: chỉ chạy khi khung đang hiện trên màn hình và tab đang mở ─────────── */
  const clock = new THREE.Clock();
  const popMatrix = new THREE.Matrix4();
  const popScale = new THREE.Matrix4();
  const popPosition = new THREE.Vector3();
  let elapsed = 0;
  function frame() {
    const delta = Math.min(clock.getDelta(), 0.05);
    elapsed += delta;
    if (kit) kit.time.value = elapsed;
    if (!reducedMotion) {
      // Con lắc quanh trục treo (dọc cành): ±8°, chu kỳ 4.2 s — êm, chậm; ghế, dây, hai nhân vật quay cùng pivot.
      // Biên độ tiến dần tới đích (quán tính), đích tự dịu về mức nền sau vài chu kỳ; pha liên tục → không giật.
      swingState.amplitude += (swingState.target - swingState.amplitude) * (1 - Math.exp(-delta * 0.9));
      swingState.target += (SWING_BASE - swingState.target) * (1 - Math.exp(-delta * 0.08));
      swingState.phase += delta * (Math.PI * 2 / SWING_PERIOD);
      swingPivot.rotation.x = Math.sin(swingState.phase) * swingState.amplitude;
      for (const key of ['-1', '1'] as const) {
        if (catHop[key] <= 0) continue;
        catHop[key] = Math.max(0, catHop[key] - delta * 1.8);
        catGroups[key].position.y = Math.sin((1 - catHop[key]) * Math.PI) * 0.09; // nhún nhẹ một nhịp, vẫn ngồi trên ghế
      }
      stream.update(elapsed);
      koi.update(elapsed);
      butterflies.update(elapsed);
      hangingLanterns?.update(elapsed);
      for (const mixer of mixers) mixer.update(delta);
    }
    if (cameraGoal.active) {
      const ease = 1 - Math.pow(0.0015, delta);
      camera.position.lerp(cameraGoal.position, ease);
      controls.target.lerp(cameraGoal.target, ease);
      if (camera.position.distanceTo(cameraGoal.position) < 0.02) cameraGoal.active = false;
    }
    controls.update();

    // Cây đang chọn nảy nhẹ lên (chỉ cập nhật đúng instance đó).
    if (selectedIndex >= 0 && plantSlots[selectedIndex]?.meshes.length && selectedPop < 1) {
      selectedPop = Math.min(1, selectedPop + delta * 5);
      const slot = plantSlots[selectedIndex];
      const grow = 1 + Math.sin(selectedPop * Math.PI) * 0.08 + selectedPop * 0.06;
      popPosition.setFromMatrixPosition(slot.base);
      popMatrix.copy(slot.base).setPosition(0, 0, 0);
      popScale.makeScale(grow, grow, grow);
      popMatrix.premultiply(popScale).setPosition(popPosition);
      for (const mesh of slot.meshes) { mesh.setMatrixAt(slot.index, popMatrix); mesh.instanceMatrix.needsUpdate = true; }
      poppedIndex = selectedIndex;
    }
    if (selectionRing.visible) {
      const placement = placements[selectedIndex];
      selectionRing.scale.setScalar((placement?.scale ?? 1) * (placement?.stage === 'sprout' ? 0.8 : 1.05) * (1 + Math.sin(elapsed * 3) * 0.05));
    }

    for (let index = 0; index < petalCount; index += 1) {
      const { cycle, offset, angle0, radius, ground } = petalParams[index];
      const t = ((elapsed + offset * cycle) % cycle) / cycle;
      const angle = angle0 + t * 1.5;
      const x = bigTree.x + Math.cos(angle) * radius + t * 1.2;
      const z = bigTree.z + Math.sin(angle) * radius * 0.7;
      dummy.position.set(x, ground + 0.05 + (1 - t) * 7.5, z);
      dummy.rotation.set(elapsed * 1.7 + index, elapsed * 1.1 + index, 0);
      dummy.scale.setScalar(t > 0.94 ? (1 - t) / 0.06 : 1);
      dummy.updateMatrix();
      petals.setMatrixAt(index, dummy.matrix);
    }
    if (petalCount) petals.instanceMatrix.needsUpdate = true;

    skyLayer.update(elapsed, camera);
    if (!isPreparing) {
      renderer.render(scene, camera);
      publishAnchors();
      if (isDebug && (debugTimer += delta) > 0.4) { debugTimer = 0; writeDebug(); }
    }
  }

  let isOnScreen = true;
  let isTabVisible = !document.hidden;
  const syncLoop = () => {
    const shouldRun = isOnScreen && isTabVisible && !disposed;
    renderer.setAnimationLoop(shouldRun ? frame : null);
    if (shouldRun) clock.getDelta(); // bỏ khoảng thời gian tạm dừng
  };
  const intersection = new IntersectionObserver(([entry]) => { isOnScreen = entry.isIntersecting; syncLoop(); });
  intersection.observe(canvas);
  const onVisibility = () => { isTabVisible = !document.hidden; syncLoop(); };
  document.addEventListener('visibilitychange', onVisibility);
  const resizeObserver = new ResizeObserver(() => { resize(); if (!renderer.getContext().isContextLost() && !isPreparing) frame(); });
  resizeObserver.observe(canvas);
  syncLoop();

  function disposeObject(root: THREE.Object3D) {
    root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
        material.dispose();
      }
    });
  }

  return {
    setPlants,
    setFilter,
    setSelected,
    resetCamera,
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      if (hoverFrame) cancelAnimationFrame(hoverFrame);
      controls.dispose();
      for (const mixer of mixers) { mixer.stopAllAction(); mixer.uncacheRoot(mixer.getRoot()); }
      for (const root of characterRoots) disposeObject(root);
      scene.traverse((object) => { if ((object as THREE.InstancedMesh).isInstancedMesh) (object as THREE.InstancedMesh).dispose(); });
      for (const { geometry } of fallbackGeometry.values()) geometry.dispose();
      kit?.dispose();
      for (const item of disposables) item.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

