/**
 * Thú cưng chạy quanh sân: một chú chó Shiba và một chú mèo tam thể — dựng bằng khối low-poly (cùng kiểu procedural.ts,
 * màu theo đỉnh, một vật liệu), không tải thêm model. Đi vòng elip trong khoảng trống quanh gốc cây đào (vùng không
 * trồng cây kiến thức — garden-layout CENTER_CLEARANCE) nên không đi xuyên qua cây; chó vòng ngoài, mèo vòng trong.
 * Chân bước so le, thân nhún, đuôi vẫy; mắt chớp (có khi chớp đôi); thỉnh thoảng dừng lại ngồi nghỉ. Bấm vào → nhảy lên một cái.
 * Giảm chuyển động: đứng yên tại chỗ.
 */
import * as THREE from 'three';
import { hashUnit } from '@/features/garden/garden-layout';
import { m4, merge, part } from './procedural';
import { terrainHeight } from './terrain';

type PetKind = 'dog' | 'cat';

interface PetLook {
  coat: THREE.Color;
  light: THREE.Color;
  dark: THREE.Color;
  patch: THREE.Color;
}

const LOOKS: Record<PetKind, PetLook> = {
  dog: { coat: new THREE.Color('#E39A55'), light: new THREE.Color('#FFF3E2'), dark: new THREE.Color('#3A2A24'), patch: new THREE.Color('#C97B3C') },
  cat: { coat: new THREE.Color('#FBF4EA'), light: new THREE.Color('#FFFFFF'), dark: new THREE.Color('#3A2A24'), patch: new THREE.Color('#E8A060') },
};

/** Vòng đi (elip quanh tâm cây đào + xích đu): bán kính dọc theo Z, theo X nhân 1.25 như vùng trống của vườn. */
const ROUTES: Record<PetKind, { radius: number; speed: number; direction: 1 | -1 }> = {
  dog: { radius: 3.9, speed: 1.35, direction: 1 },
  cat: { radius: 3.3, speed: 0.55, direction: -1 },
};

export interface GardenPet {
  kind: PetKind;
  /** Hộp vô hình bám theo con vật — để bấm chọn (raycast). */
  proxy: THREE.Mesh;
}

export interface GardenPets {
  group: THREE.Group;
  pets: GardenPet[];
  update: (delta: number, elapsed: number) => void;
  hop: (kind: PetKind) => void;
  dispose: () => void;
}

const sphere = (radius: number, w = 12, h = 9) => new THREE.SphereGeometry(radius, w, h);
const BLINK_SECONDS = 0.16;
const cone = (radius: number, height: number, segments = 4) => new THREE.ConeGeometry(radius, height, segments);

/** Thân + đầu (một geometry); con vật nhìn theo +X, chân và đuôi là mesh riêng để cử động. */
function bodyGeometry(kind: PetKind, look: PetLook): THREE.BufferGeometry {
  const isDog = kind === 'dog';
  const parts = [
    part(sphere(0.2), look.coat, m4(0, 0.33, 0, [1.45, 0.82, 0.85]), 1, 0.03),
    part(sphere(0.15), look.light, m4(0.05, 0.27, 0, [1.35, 0.6, 0.72]), 2, 0.02), // bụng sáng
    part(sphere(0.155), look.coat, m4(0.33, 0.5, 0, [1, 0.95, 1]), 3, 0.03), // đầu
    part(sphere(0.085), look.light, m4(0.45, 0.46, 0, isDog ? [1.25, 0.8, 0.95] : [0.9, 0.7, 0.9]), 4, 0.02), // mõm
    part(sphere(0.022, 8, 6), look.dark, m4(isDog ? 0.555 : 0.52, 0.48, 0), 5, 0), // mũi
    part(cone(0.06, 0.13), isDog ? look.coat : look.coat, m4(0.3, 0.68, 0.085, 1, [0.25, 0, -0.15]), 8, 0.02), // tai
    part(cone(0.06, 0.13), isDog ? look.coat : look.coat, m4(0.3, 0.68, -0.085, 1, [-0.25, 0, -0.15]), 9, 0.02),
    part(cone(0.032, 0.07), look.light, m4(0.315, 0.67, 0.085, 1, [0.25, 0, -0.15]), 10, 0), // lòng tai
    part(cone(0.032, 0.07), look.light, m4(0.315, 0.67, -0.085, 1, [-0.25, 0, -0.15]), 11, 0),
  ];
  if (!isDog) {
    // Mèo tam thể: vài mảng cam trên lưng + đầu.
    parts.push(part(sphere(0.11), look.patch, m4(-0.08, 0.43, 0.06, [1.2, 0.5, 0.8]), 12, 0.03));
    parts.push(part(sphere(0.08), look.patch, m4(0.3, 0.6, -0.05, [1, 0.55, 0.9]), 13, 0.03));
  } else {
    // Shiba: vệt sáng hai má.
    parts.push(part(sphere(0.07), look.light, m4(0.4, 0.47, 0.08, [0.8, 0.8, 0.6]), 12, 0.02));
    parts.push(part(sphere(0.07), look.light, m4(0.4, 0.47, -0.08, [0.8, 0.8, 0.6]), 13, 0.02));
  }
  return merge(parts);
}

/** Mắt (mesh riêng để chớp — co theo trục Y): tròng đen to, chấm sáng long lanh phía trên. Tâm ở (0,0,0). */
function eyeGeometry(look: PetLook): THREE.BufferGeometry {
  return merge([
    part(sphere(0.036, 10, 8), look.dark, m4(0, 0, 0, [0.55, 1.05, 0.95]), 6, 0),
    part(sphere(0.012, 6, 5), new THREE.Color('#FFFFFF'), m4(0.016, 0.012, 0.008), 7, 0),
  ]);
}

/** Chân: gốc (hông) ở y = 0, chân thả xuống — xoay quanh Z để bước. */
function legGeometry(look: PetLook): THREE.BufferGeometry {
  return merge([
    part(new THREE.CylinderGeometry(0.042, 0.036, 0.22, 7), look.coat, m4(0, -0.11, 0), 20, 0.02),
    part(sphere(0.045, 8, 6), look.light, m4(0.012, -0.22, 0, [1.2, 0.6, 1]), 21, 0.02),
  ]);
}

/** Đuôi: gốc ở (0,0,0), Shiba cuộn tròn trên lưng, mèo dựng cong. */
function tailGeometry(kind: PetKind, look: PetLook): THREE.BufferGeometry {
  if (kind === 'dog') {
    return merge([
      part(new THREE.TorusGeometry(0.07, 0.04, 6, 10, Math.PI * 1.5), look.coat, m4(-0.02, 0.06, 0, 1, [0, 0, 0.6]), 30, 0.03),
      part(sphere(0.042, 8, 6), look.light, m4(0.04, 0.12, 0), 31, 0.02),
    ]);
  }
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.1, 0.1, 0), new THREE.Vector3(-0.12, 0.25, 0), new THREE.Vector3(-0.05, 0.33, 0),
  ]);
  return merge([
    part(new THREE.TubeGeometry(curve, 10, 0.03, 6, false), look.patch, m4(), 30, 0.03),
    part(sphere(0.032, 8, 6), look.patch, m4(-0.05, 0.33, 0), 31, 0.02),
  ]);
}

export function buildPets(center: { x: number; z: number }, reducedMotion: boolean): GardenPets {
  const group = new THREE.Group();
  group.name = 'garden-pets';
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  const proxyMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const geometries: THREE.BufferGeometry[] = [];
  const keep = <T extends THREE.BufferGeometry>(geometry: T) => { geometries.push(geometry); return geometry; };

  const states = (['dog', 'cat'] as PetKind[]).map((kind) => {
    const look = LOOKS[kind];
    const root = new THREE.Group();
    const bodyPivot = new THREE.Group();
    const body = new THREE.Mesh(keep(bodyGeometry(kind, look)), material);
    body.castShadow = true;
    bodyPivot.add(body);
    const legGeom = keep(legGeometry(look));
    const legs = ([[0.16, 0.09], [0.16, -0.09], [-0.16, 0.09], [-0.16, -0.09]] as const).map(([x, z]) => {
      const leg = new THREE.Mesh(legGeom, material);
      leg.position.set(x, 0.24, z);
      leg.castShadow = true;
      bodyPivot.add(leg);
      return leg;
    });
    const eyeGeom = keep(eyeGeometry(look));
    const eyes = [0.075, -0.075].map((z) => {
      const eye = new THREE.Mesh(eyeGeom, material);
      eye.position.set(0.455, 0.555, z);
      bodyPivot.add(eye);
      return eye;
    });
    const tail = new THREE.Mesh(keep(tailGeometry(kind, look)), material);
    tail.position.set(-0.27, kind === 'dog' ? 0.42 : 0.36, 0);
    tail.castShadow = true;
    bodyPivot.add(tail);
    root.add(bodyPivot);
    const scale = kind === 'dog' ? 1.45 : 1.25;
    root.scale.setScalar(scale);
    const proxy = new THREE.Mesh(keep(new THREE.BoxGeometry(0.9, 0.85, 0.5)), proxyMaterial);
    proxy.position.set(0.05, 0.38, 0);
    proxy.name = `pet-${kind}`;
    proxy.userData.petKind = kind;
    root.add(proxy);
    group.add(root);
    const route = ROUTES[kind];
    return {
      kind, root, bodyPivot, legs, tail, eyes, proxy, route,
      angle: hashUnit(`pet:${kind}`) * Math.PI * 2,
      gait: 0,
      /** 0 = đang đi, > 0 = còn bao lâu ngồi nghỉ (giây). */
      rest: 0,
      nextRest: 6 + hashUnit(`pet-rest:${kind}`) * 8,
      walk: 1,
      hop: 0,
      spin: 0,
      /** Chớp mắt: còn bao lâu tới lần chớp kế tiếp; blink > 0 = đang khép mắt (giây còn lại); blinksLeft = chớp đôi. */
      nextBlink: 1 + hashUnit(`pet-blink:${kind}`) * 3,
      blink: 0,
      blinksLeft: 0,
    };
  });

  const place = (state: (typeof states)[number]) => {
    const { radius, direction } = state.route;
    const a = radius * 1.25;
    const x = center.x + Math.cos(state.angle) * a;
    const z = center.z + Math.sin(state.angle) * radius;
    // Hướng đi = tiếp tuyến của elip theo chiều chạy; con vật nhìn theo +X → yaw = atan2(-dz, dx).
    const dx = -Math.sin(state.angle) * a * direction;
    const dz = Math.cos(state.angle) * radius * direction;
    state.root.position.set(x, terrainHeight(x, z) - 0.02, z);
    state.root.rotation.y = Math.atan2(-dz, dx) + state.spin;
  };
  states.forEach(place);

  function update(delta: number, elapsed: number) {
    if (reducedMotion) return;
    for (const state of states) {
      // Đi ↔ ngồi nghỉ: giảm / tăng tốc mềm (walk 0..1), không khựng.
      if (state.rest > 0) {
        state.rest -= delta;
        if (state.rest <= 0) state.nextRest = 7 + hashUnit(`pet-rest:${state.kind}:${Math.floor(elapsed)}`) * 9;
      } else {
        state.nextRest -= delta;
        if (state.nextRest <= 0) state.rest = 2 + hashUnit(`pet-sit:${state.kind}:${Math.floor(elapsed)}`) * 2.5;
      }
      const targetWalk = state.rest > 0 ? 0 : 1;
      state.walk += (targetWalk - state.walk) * (1 - Math.exp(-delta * 4));
      const { radius, speed, direction } = state.route;
      const arc = Math.hypot(radius * 1.25 * Math.sin(state.angle), radius * Math.cos(state.angle)) || radius;
      state.angle += (speed * state.walk * delta / arc) * direction;
      state.gait += delta * speed * state.walk * (state.kind === 'dog' ? 11 : 13);
      const swing = Math.sin(state.gait) * 0.65 * state.walk;
      // Chân chéo cùng pha (trước-trái với sau-phải) như dáng đi thật.
      // Chớp mắt ~mỗi 2–5 giây (đôi khi chớp đôi), mỗi lần ~0.16 s — mắt khép theo trục dọc rồi mở lại.
      if (state.blink > 0) {
        state.blink = Math.max(0, state.blink - delta);
        if (state.blink === 0 && state.blinksLeft > 0) { state.blinksLeft -= 1; state.nextBlink = 0.12; }
      } else {
        state.nextBlink -= delta;
        if (state.nextBlink <= 0) {
          state.blink = BLINK_SECONDS;
          const roll = hashUnit(`pet-blink:${state.kind}:${elapsed.toFixed(1)}`);
          state.blinksLeft = roll < 0.25 ? 1 : 0;
          state.nextBlink = 2 + roll * 3;
        }
      }
      const closed = state.blink > 0 ? Math.sin((1 - state.blink / BLINK_SECONDS) * Math.PI) : 0;
      for (const eye of state.eyes) eye.scale.y = 1 - closed * 0.88;
      state.legs[0].rotation.z = swing;
      state.legs[3].rotation.z = swing;
      state.legs[1].rotation.z = -swing;
      state.legs[2].rotation.z = -swing;
      if (state.hop > 0) state.hop = Math.max(0, state.hop - delta * 2.2);
      if (state.spin > 0) state.spin = Math.max(0, state.spin - delta * 7);
      const hopHeight = Math.sin((1 - state.hop) * Math.PI) * 0.32 * (state.hop > 0 ? 1 : 0);
      state.bodyPivot.position.y = Math.abs(Math.sin(state.gait)) * 0.03 * state.walk + hopHeight;
      // Ngồi nghỉ: hạ hông xuống một chút.
      state.bodyPivot.rotation.z = (1 - state.walk) * 0.22;
      state.tail.rotation.x = state.kind === 'dog'
        ? Math.sin(elapsed * (state.rest > 0 ? 9 : 6)) * 0.45
        : Math.sin(elapsed * 1.6) * 0.25;
      place(state);
    }
  }

  function hop(kind: PetKind) {
    const state = states.find((entry) => entry.kind === kind);
    if (!state || state.hop > 0) return;
    state.hop = 1;
    state.spin = Math.PI * 2;
  }

  return {
    group,
    pets: states.map(({ kind, proxy }) => ({ kind, proxy })),
    update,
    hop,
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      material.dispose();
      proxyMaterial.dispose();
    },
  };
}
