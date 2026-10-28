/**
 * Bộ model thiên nhiên của Vườn tri thức: "Stylized Nature MegaKit" (Standard) của Quaternius — giấy phép CC0 1.0.
 * Gộp các model cần dùng vào public/models/garden/garden-kit.glb (mỗi model là một Scene đặt tên theo file gốc,
 * texture WebP ≤ 1024px, nén meshopt).
 *
 * Lá cây: tấm lá cắt alpha (alphaTest, hai mặt) — pháp tuyến hướng tâm tán (tán sáng mềm như tranh, không lổn nhổn mặt
 * phẳng), AO nướng theo đỉnh (lá trong tán tối hơn → có chiều sâu), đổi màu theo bảng màu (anh đào, thu, xanh non, hoa hồng) bằng
 * shader, gió nhẹ ở đỉnh. Một texture lá dùng cho mọi biến thể màu → không tải thêm ảnh.
 */
import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const KIT_URL = '/models/garden/garden-kit.glb';

export type KitModel =
  | 'TwistedTree_2' | 'CommonTree_1' | 'CommonTree_2' | 'CommonTree_3' | 'CommonTree_4' | 'Plant_1' | 'Fern_1' | 'Clover_1'
  | 'Grass_Common_Short' | 'Grass_Wispy_Short' | 'Mushroom_Common' | 'Rock_Medium_1' | 'Rock_Medium_2'
  | 'RockPath_Round_Small_1' | 'RockPath_Round_Small_2' | 'RockPath_Round_Wide' | 'Pebble_Round_2' | 'Pebble_Round_3'
  | 'Flower_3_Group' | 'Flower_4_Group' | 'Bush_Common' | 'Bush_Common_Flowers';

/** Bảng màu lá (tối → sáng). Màu dịu, ít bão hoà — hợp tông kem / xanh lá / hồng của NekoNeko. */
export const FOLIAGE_TINTS = {
  fresh: ['#6FA352', '#C4E08A'], // cây non: xanh non sáng
  green: ['#4E8A47', '#A9D27A'], // cây khoẻ
  sakura: ['#F26A9E', '#FFD2E2'], // nở hoa — anh đào (hồng tươi)
  sakuraDeep: ['#EE5A93', '#FFC9DD'], // cây đào trung tâm — hồng đậm tươi
  blush: ['#FA8DB4', '#FFE6EF'], // hồng phấn sáng — sắc độ thứ ba của tán đào
  autumn: ['#B66A32', '#F0C773'], // sắp quên — lá ngả vàng
  rose: ['#8E0E2C', '#E3365A'], // cánh hoa hồng (đỏ thẫm → đỏ hồng thắm; texture hoa sáng nên phần lớn cánh ra màu sáng) — bụi hồng "đã thành thạo"
  roseLeaf: ['#2E6636', '#86BD6C'], // lá bụi hồng: xanh đậm hơn cây thường để hoa nổi bật
  bush: ['#557F45', '#A3C978'],
  far: ['#7FA86A', '#C9DDA8'], // rặng cây xa: nhạt dần vào sương
} as const;
export type FoliageTint = keyof typeof FOLIAGE_TINTS;

export interface KitPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export interface KitModelInfo {
  /** Phần hình (thân / lá / hoa…) đã gộp ma trận node, gốc model ở (0,0,0). */
  parts: Array<{ geometry: THREE.BufferGeometry; source: THREE.MeshStandardMaterial }>;
  size: THREE.Vector3;
}

/**
 * File kit nén toạ độ dạng số nguyên chuẩn hoá (KHR_mesh_quantization, xen kẽ trong một buffer). Muốn gộp ma trận node
 * vào hình thì phải đổi sang Float32 trước — nếu không, toạ độ bị kẹp trong [-1, 1] và cây thành khối vuông.
 */
function toFloatGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(source.attributes)) {
    const { count, itemSize } = attribute;
    const array = new Float32Array(count * itemSize);
    for (let index = 0; index < count; index += 1) {
      array[index * itemSize] = attribute.getX(index);
      if (itemSize > 1) array[index * itemSize + 1] = attribute.getY(index);
      if (itemSize > 2) array[index * itemSize + 2] = attribute.getZ(index);
      if (itemSize > 3) array[index * itemSize + 3] = attribute.getW(index);
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
  }
  if (source.index) geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(source.index.array), 1));
  return geometry;
}

const isCanopy = (name: string) => /Leaves_(NormalTree|TwistedTree)/.test(name);
const isPetal = (name: string) => name === 'Flowers';
const isFoliage = (name: string) => /Leaves|Grass|Flowers/.test(name);
const isGrass = (name: string) => /Grass/.test(name);

/** Pháp tuyến + AO cho tán lá: hướng tâm tán (pha 75%), lá sâu trong tán / phía dưới tối hơn. */
function shapeCanopy(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const colors = new Float32Array(position.count * 3);
  const offset = new THREE.Vector3();
  const original = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    offset.fromBufferAttribute(position, index).sub(center);
    const depth = Math.min(1, Math.hypot(offset.x / radius.x, offset.y / radius.y, offset.z / radius.z));
    const height = (offset.y / radius.y + 1) / 2;
    const ao = 0.5 + 0.5 * THREE.MathUtils.smoothstep(depth, 0.15, 0.95) * (0.75 + 0.25 * height);
    colors.set([ao, ao, ao], index * 3);
    if (normal) {
      original.fromBufferAttribute(normal, index);
      offset.normalize().lerp(original, 0.25).normalize();
      normal.setXYZ(index, offset.x, offset.y, offset.z);
    }
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/** Cỏ / hoa / cây bụi thấp: pháp tuyến hướng lên (ăn màu như mặt đất), gốc tối hơn ngọn. */
function shapeLowFoliage(geometry: THREE.BufferGeometry, upNormals: boolean) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const span = Math.max(box.max.y - box.min.y, 1e-4);
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index += 1) {
    const t = (position.getY(index) - box.min.y) / span;
    const ao = 0.62 + 0.38 * THREE.MathUtils.smoothstep(t, 0, 0.8);
    colors.set([ao, ao, ao], index * 3);
    if (upNormals && normal) normal.setXYZ(index, 0, 1, 0);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

export class GardenKit {
  readonly models = new Map<KitModel, KitModelInfo>();
  private readonly materials = new Map<string, THREE.Material>();
  readonly time = { value: 0 };
  private readonly disposables: Array<{ dispose: () => void }> = [];

  constructor(gltf: GLTF, private readonly windScale: number) {
    for (const scene of gltf.scenes) {
      scene.updateMatrixWorld(true);
      const parts: KitModelInfo['parts'] = [];
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        const geometry = toFloatGeometry(mesh.geometry);
        geometry.applyMatrix4(mesh.matrixWorld);
        const source = mesh.material as THREE.MeshStandardMaterial;
        if (isCanopy(source.name)) shapeCanopy(geometry);
        else if (isFoliage(source.name)) shapeLowFoliage(geometry, isGrass(source.name));
        parts.push({ geometry, source });
        this.disposables.push(geometry);
      });
      const box = new THREE.Box3().setFromObject(scene);
      // Sau khi gộp, Scene mang tên "Scene_n"; tên model gốc nằm ở node gốc của scene.
      const name = (scene.children[0]?.name || scene.name) as KitModel;
      this.models.set(name, { parts, size: box.getSize(new THREE.Vector3()) });
    }
    // Ảnh gốc của kit được giữ trong vật liệu nguồn — giải phóng cùng kit.
    gltf.scenes.forEach((scene) => scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      (mesh.geometry as THREE.BufferGeometry).dispose();
      this.disposables.push(mesh.material as THREE.Material);
      for (const value of Object.values(mesh.material as THREE.MeshStandardMaterial)) if (value instanceof THREE.Texture) this.disposables.push(value);
    }));
  }

  has(model: KitModel): boolean {
    return this.models.has(model);
  }

  /** Vật liệu cho một phần hình — dùng chung giữa mọi instance cùng (vật liệu nguồn, bảng màu, gió). */
  material(source: THREE.MeshStandardMaterial, tint: FoliageTint | null, wind: number, petalTint: FoliageTint | null = null): THREE.Material {
    const foliage = isFoliage(source.name);
    const canopy = isCanopy(source.name);
    // Tán lá theo `tint`; cánh hoa (vật liệu "Flowers") theo `petalTint` — ví dụ bụi hồng: lá xanh đậm, hoa đỏ hồng.
    const appliedTint = canopy ? tint : isPetal(source.name) ? petalTint : null;
    const key = `${source.uuid}:${appliedTint ?? '-'}:${wind}`;
    const cached = this.materials.get(key);
    if (cached) return cached;
    const material = source.clone();
    material.metalness = 0;
    material.envMapIntensity = 0.6;
    if (!foliage) {
      material.roughness = 0.94; // vỏ cây / đá: nhám, không bóng nhựa
      this.materials.set(key, material);
      this.disposables.push(material);
      return material;
    }
    material.side = THREE.DoubleSide;
    material.alphaTest = 0.45;
    material.transparent = false;
    material.roughness = 0.82;
    material.vertexColors = true;
    const [dark, light] = appliedTint ? FOLIAGE_TINTS[appliedTint] : ['#000000', '#ffffff'];
    const uniforms = {
      uDark: { value: new THREE.Color(dark) },
      uLight: { value: new THREE.Color(light) },
      uWind: { value: wind * this.windScale },
      uTime: this.time,
    };
    const tinted = Boolean(appliedTint);
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWind;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 windOrigin = vec3(0.0);
          #ifdef USE_INSTANCING
            windOrigin = instanceMatrix[3].xyz;
          #endif
          float windHeight = max(position.y, 0.0);
          float windPhase = uTime * 1.3 + windOrigin.x * 0.55 + windOrigin.z * 0.4;
          transformed.x += sin(windPhase + position.y * 0.35) * uWind * windHeight;
          transformed.z += cos(windPhase * 0.83 + position.x * 0.3) * uWind * 0.6 * windHeight;`);
      let fragment = shader.fragmentShader;
      if (tinted) {
        fragment = fragment
          .replace('#include <common>', '#include <common>\nuniform vec3 uDark;\nuniform vec3 uLight;')
          .replace('#include <map_fragment>', `#include <map_fragment>
            float leafLuma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
            diffuseColor.rgb = mix(uDark, uLight, smoothstep(0.0, 0.34, leafLuma));`);
      }
      // Ánh sáng xuyên lá (giả tán xạ): mặt khuất nắng không tối đen, lá vẫn "trong" và mềm.
      shader.fragmentShader = fragment.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.indirectDiffuse += diffuseColor.rgb * ${tinted ? '0.16' : '0.1'};`);
    };
    material.customProgramCacheKey = () => `garden-foliage:${tinted ? 'tint' : 'plain'}`;
    this.materials.set(key, material);
    this.disposables.push(material);
    return material;
  }

  /**
   * Một InstancedMesh cho mỗi phần hình của model. `matrices` đặt sẵn vị trí / xoay / cỡ; `colors` (tuỳ chọn) nhân màu
   * từng instance để các cây cùng loại không giống hệt nhau.
   */
  instanced(model: KitModel, matrices: readonly THREE.Matrix4[], options: { tint?: FoliageTint | null; petalTint?: FoliageTint | null; wind?: number; castShadow?: boolean; colors?: readonly THREE.Color[] } = {}): THREE.InstancedMesh[] {
    const info = this.models.get(model);
    if (!info || !matrices.length) return [];
    return info.parts.map(({ geometry, source }) => {
      const mesh = new THREE.InstancedMesh(geometry, this.material(source, options.tint ?? null, options.wind ?? 0, options.petalTint ?? null), matrices.length);
      matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
      if (options.colors) options.colors.forEach((color, index) => mesh.setColorAt(index, color));
      mesh.castShadow = options.castShadow ?? true;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      return mesh;
    });
  }

  dispose() {
    for (const item of this.disposables) item.dispose();
    this.disposables.length = 0;
    this.materials.clear();
  }
}
