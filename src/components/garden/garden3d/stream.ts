/**
 * Con suối nhỏ của Vườn tri thức: dải nước uốn theo STREAM_CURVE, bám mặt đất (lòng suối đã khoét trong terrain.ts).
 * Nước là MeshStandardMaterial (phản chiếu bầu trời qua env map, có sương) + một đoạn shader nhỏ: vệt sáng gợn chạy
 * xuôi dòng, mép nước sáng / đục hơn giữa dòng. Không texture, không render target → nhẹ trên điện thoại / iPad.
 */
import * as THREE from 'three';
import { GARDEN_LANDMARKS } from '@/features/garden/garden-layout';
import { STREAM_CURVE, streamBankHeight, streamWidth } from './terrain';

const { pond } = GARDEN_LANDMARKS;
/** Đoạn suối nằm trong hồ: không vẽ mặt nước suối (mặt hồ đã có) — tránh hai lớp nước chồng nhau nhấp nháy. */
const insidePond = (x: number, z: number) => Math.hypot((x - pond.x) / pond.radiusX, (z - pond.z) / pond.radiusZ) < 0.82;

export interface StreamHandle {
  mesh: THREE.Mesh;
  /** Gọi mỗi khung hình với thời gian (giây) — chỉ đổi một uniform. */
  update: (time: number) => void;
  dispose: () => void;
}

/** Mặt nước thấp hơn mặt bờ 8 cm (lòng suối khoét sâu 42 cm) → nước luôn lộ ra, vẫn có thành bờ. */
function waterLevel(x: number, z: number): number {
  return streamBankHeight(x, z) - 0.08;
}

export function buildStream(): StreamHandle {
  const segments = 200;
  const length = STREAM_CURVE.getLength();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const across = 4; // vài đỉnh ngang dòng để mặt nước bám theo lòng suối cong
  const rowInPond: boolean[] = [];
  for (let step = 0; step <= segments; step += 1) {
    const t = step / segments;
    STREAM_CURVE.getPointAt(t, point);
    STREAM_CURVE.getTangentAt(t, tangent);
    side.set(-tangent.z, 0, tangent.x).normalize();
    rowInPond.push(insidePond(point.x, point.z));
    const half = streamWidth(t) / 2 + 0.12;
    for (let column = 0; column <= across; column += 1) {
      const v = column / across;
      const offset = (v - 0.5) * 2 * half;
      const x = point.x + side.x * offset;
      const z = point.z + side.z * offset;
      // Mặt nước phẳng ngang dòng (lấy độ cao giữa dòng) — nước không "leo" lên bờ.
      positions.push(x, waterLevel(point.x, point.z), z);
      uvs.push(t, v);
    }
  }
  for (let step = 0; step < segments; step += 1) {
    if (rowInPond[step] && rowInPond[step + 1]) continue;
    for (let column = 0; column < across; column += 1) {
      const a = step * (across + 1) + column;
      const b = a + across + 1;
      // Chiều tam giác cho pháp tuyến hướng LÊN (mặt nước nhìn từ trên xuống không bị loại bỏ mặt sau).
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const time = { value: 0 };
  const material = new THREE.MeshStandardMaterial({
    color: '#3DB5BC', roughness: 0.1, metalness: 0.04, transparent: true, opacity: 1, envMapIntensity: 1.0,
  });
  material.defines = { USE_UV: '' };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.uniforms.uLength = { value: length };
    const noise = `
      float gardenHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float gardenNoise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(gardenHash(i), gardenHash(i + vec2(1.0, 0.0)), u.x), mix(gardenHash(i + vec2(0.0, 1.0)), gardenHash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      // Toạ độ chảy: kéo dài dọc dòng (gợn dài, hẹp) và trôi xuôi dòng theo thời gian.
      float gardenFlow(vec2 uv, float len, float t) {
        vec2 p = vec2(uv.x * len * 1.3 - t * 2.1, uv.y * 3.2);
        float a = gardenNoise(p + vec2(0.0, sin(uv.x * len * 0.6) * 0.6));
        float b = gardenNoise(p * vec2(1.9, 1.6) - vec2(t * 1.1, 0.0) + 7.3);
        return a * 0.62 + b * 0.38;
      }
    `;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uLength;\n' + noise)
      .replace('#include <map_fragment>', `#include <map_fragment>
        float flowA = gardenFlow(vUv, uLength, uTime);
        float flowB = gardenFlow(vUv + vec2(0.0, 0.37), uLength, uTime * 1.35 + 3.0);
        float ripple = flowA * 0.6 + flowB * 0.4;
        float sideDistance = min(vUv.y, 1.0 - vUv.y);
        float shallow = 1.0 - smoothstep(0.02, 0.3, sideDistance);
        float deep = smoothstep(0.18, 0.5, sideDistance);
        // Nước nông ở mép: trong, ngả màu đáy (cát / rêu); giữa dòng: sâu, xanh lam đậm.
        vec3 bedColor = vec3(0.5, 0.74, 0.6);
        vec3 deepColor = vec3(0.06, 0.48, 0.55);
        diffuseColor.rgb = mix(diffuseColor.rgb, bedColor, shallow * 0.55);
        diffuseColor.rgb = mix(diffuseColor.rgb, deepColor, deep * 0.55);
        // Vệt sáng như nắng lọt xuống đáy, trôi chậm theo dòng.
        float caustic = smoothstep(0.55, 0.75, gardenFlow(vUv * vec2(0.6, 1.4), uLength, uTime * 0.6 + 11.0));
        diffuseColor.rgb += caustic * 0.06 * (1.0 - deep * 0.5);
        // Gợn sáng mảnh trôi xuôi dòng + chút bọt ở mép — tiết chế, không thành "thác trắng".
        float streak = smoothstep(0.72, 0.9, ripple);
        float foam = (1.0 - smoothstep(0.0, 0.1, sideDistance)) * smoothstep(0.55, 0.8, flowB);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 0.98, 1.0), clamp(streak * 0.28 + foam * 0.4, 0.0, 0.6));
        diffuseColor.a = mix(0.62, 0.92, deep) + streak * 0.08 + foam * 0.2;`)
      // Gợn làm mặt nước nghiêng nhẹ → ánh trời phản chiếu chạy theo dòng (lấp lánh), không cần texture normal.
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float rippleX = gardenFlow(vUv + vec2(0.004, 0.0), uLength, uTime) - flowA;
        float rippleY = gardenFlow(vUv + vec2(0.0, 0.03), uLength, uTime) - flowA;
        normal = normalize(normal + vec3(rippleX * 6.0, rippleY * 2.0, 0.0));`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.04, streak);`);
  };
  material.customProgramCacheKey = () => 'garden-stream';

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.renderOrder = 2;
  return {
    mesh,
    update: (seconds) => { time.value = seconds; },
    dispose: () => { geometry.dispose(); material.dispose(); },
  };
}

/** Điểm dọc hai bờ suối (để đặt đá cuội, cỏ, rêu, hoa) — `offset` > 0 là bờ phải theo chiều dòng chảy. */
export function streamBankPoint(t: number, offset: number): { x: number; z: number } {
  const point = STREAM_CURVE.getPointAt(t);
  const tangent = STREAM_CURVE.getTangentAt(t);
  const half = streamWidth(t) / 2;
  const distance = Math.sign(offset) * (half + Math.abs(offset));
  return { x: point.x - tangent.z * distance, z: point.z + tangent.x * distance };
}

/** Điểm cách tim suối `offset` mét theo phương ngang dòng (0 = giữa dòng). */
export function streamCrossPoint(t: number, offset: number): { x: number; z: number } {
  const point = STREAM_CURVE.getPointAt(t);
  const tangent = STREAM_CURVE.getTangentAt(t);
  return { x: point.x - tangent.z * offset, z: point.z + tangent.x * offset };
}
