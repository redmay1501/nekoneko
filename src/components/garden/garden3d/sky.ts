/**
 * Bầu trời Vườn tri thức: vòm gradient bằng shader (không texture → không đường nối, không vệt), mây bông trôi chậm
 * (billboard, texture canvas mềm, một InstancedMesh), cầu vồng mờ sau vườn. Mọi thứ fog: false — sương không làm bẩn trời.
 */
import * as THREE from 'three';
import { hashUnit } from '@/features/garden/garden-layout';

export interface SkyHandle {
  objects: THREE.Object3D[];
  update: (time: number, camera: THREE.Camera) => void;
  dispose: () => void;
}

function cloudTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const context = canvas.getContext('2d')!;
  // Nhiều đốm tròn mềm chồng nhau, đáy phẳng hơn đỉnh — dáng mây cumulus.
  const puffs = [[0.5, 0.58, 0.26], [0.32, 0.64, 0.19], [0.68, 0.62, 0.2], [0.42, 0.46, 0.2], [0.6, 0.44, 0.17], [0.2, 0.7, 0.13], [0.8, 0.7, 0.13]];
  for (const [x, y, r] of puffs) {
    const gradient = context.createRadialGradient(x * size, y * size / 2, 0, x * size, y * size / 2, r * size);
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.55, 'rgba(255,255,255,0.75)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x * size, y * size / 2, r * size, 0, Math.PI * 2);
    context.fill();
  }
  // Bóng nhẹ dưới đáy mây.
  const shade = context.createLinearGradient(0, size * 0.25, 0, size / 2);
  shade.addColorStop(0, 'rgba(210,225,240,0)');
  shade.addColorStop(1, 'rgba(200,215,235,0.35)');
  context.globalCompositeOperation = 'source-atop';
  context.fillStyle = shade;
  context.fillRect(0, 0, size, size / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildSky(lowPower: boolean, reducedMotion: boolean): SkyHandle {
  const disposables: Array<{ dispose: () => void }> = [];
  const objects: THREE.Object3D[] = [];

  /* Vòm trời: xanh đậm ở đỉnh → xanh nhạt → kem ấm ở chân trời; mặt đất phía dưới cùng màu đồi xa. */
  const domeGeometry = new THREE.SphereGeometry(180, 48, 24);
  const domeMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color('#3F94DC') },
      middle: { value: new THREE.Color('#7EC1EC') },
      horizon: { value: new THREE.Color('#D9EEF3') },
      ground: { value: new THREE.Color('#A9CF8C') },
    },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform vec3 top; uniform vec3 middle; uniform vec3 horizon; uniform vec3 ground; varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 color = mix(horizon, middle, smoothstep(-0.005, 0.035, h));
        color = mix(color, top, smoothstep(0.035, 0.35, h));
        color = mix(ground, color, smoothstep(-0.06, 0.01, h));
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(domeGeometry, domeMaterial);
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  objects.push(dome);
  disposables.push(domeGeometry, domeMaterial);

  /* Cầu vồng: dải bán nguyệt mờ phía sau vườn (shader: 7 dải màu mềm, mờ dần ở hai chân). */
  const rainbowGeometry = new THREE.RingGeometry(30, 36, 96, 1, 0, Math.PI);
  const rainbowMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide,
    uniforms: { inner: { value: 30 }, outer: { value: 36 }, opacity: { value: 0.5 } },
    vertexShader: 'varying vec2 vPos; void main(){ vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform float inner; uniform float outer; uniform float opacity; varying vec2 vPos;
      vec3 band(float t){
        vec3 c = mix(vec3(0.62,0.42,0.86), vec3(0.42,0.62,0.95), smoothstep(0.0,0.2,t));
        c = mix(c, vec3(0.45,0.82,0.62), smoothstep(0.2,0.4,t));
        c = mix(c, vec3(1.0,0.9,0.45), smoothstep(0.4,0.6,t));
        c = mix(c, vec3(1.0,0.66,0.4), smoothstep(0.6,0.8,t));
        return mix(c, vec3(0.98,0.45,0.5), smoothstep(0.8,1.0,t));
      }
      void main(){
        float r = length(vPos);
        float t = clamp((r - inner) / (outer - inner), 0.0, 1.0);
        float edge = smoothstep(0.0, 0.18, t) * smoothstep(1.0, 0.82, t);
        float feet = smoothstep(0.0, 0.35, vPos.y / outer);
        gl_FragColor = vec4(band(t), opacity * edge * feet);
        #include <colorspace_fragment>
      }`,
  });
  const rainbow = new THREE.Mesh(rainbowGeometry, rainbowMaterial);
  // Chân cầu vồng chìm sau đồi, đỉnh vừa lộ trên dãy núi ở góc nhìn mặc định.
  rainbow.position.set(30, -4, -122);
  rainbow.rotation.y = -0.15;
  rainbow.renderOrder = -8;
  objects.push(rainbow);
  disposables.push(rainbowGeometry, rainbowMaterial);

  /* Mây bông trôi chậm (billboard quay về camera). */
  const count = lowPower ? 9 : 16;
  const texture = cloudTexture();
  const cloudGeometry = new THREE.PlaneGeometry(1, 0.5);
  const cloudMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.01, depthWrite: false, fog: false });
  const clouds = new THREE.InstancedMesh(cloudGeometry, cloudMaterial, count);
  clouds.renderOrder = 10;
  clouds.name = 'sky-clouds';
  clouds.frustumCulled = false;
  objects.push(clouds);
  disposables.push(texture, cloudGeometry, cloudMaterial, clouds);
  const params = Array.from({ length: count }, (_, index) => ({
    // Phần lớn mây trong cung trời phía sau vườn (góc nhìn mặc định hướng về -Z), vài đám rải xa hai bên.
    angle: Math.PI * (index % 4 === 3 ? 1.0 + hashUnit(`cl-a:${index}`) * 1.0 : 1.28 + (index / count) * 0.5 + (hashUnit(`cl-a:${index}`) - 0.5) * 0.08),
    radius: 120 + hashUnit(`cl-r:${index}`) * 35,
    // Mây sát trên dãy núi (vùng trời thấy được ở góc nhìn vườn) — vài đám cao hơn cho màn dọc.
    height: 13 + hashUnit(`cl-h:${index}`) * (index % 3 === 0 ? 30 : 12),
    width: 22 + hashUnit(`cl-w:${index}`) * 22,
    speed: 0.006 + hashUnit(`cl-s:${index}`) * 0.006,
  }));
  const dummy = new THREE.Object3D();
  const update = (time: number, camera: THREE.Camera) => {
    const t = reducedMotion ? 0 : time;
    params.forEach((cloud, index) => {
      const angle = cloud.angle + t * cloud.speed;
      dummy.position.set(Math.cos(angle) * cloud.radius, cloud.height, Math.sin(angle) * cloud.radius);
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.set(cloud.width, cloud.width, 1);
      dummy.updateMatrix();
      clouds.setMatrixAt(index, dummy.matrix);
    });
    clouds.instanceMatrix.needsUpdate = true;
    dome.position.copy(camera.position); // vòm luôn bao quanh camera (không bao giờ thấy mép vòm)
  };
  return { objects, update, dispose: () => { for (const item of disposables) item.dispose(); } };
}
