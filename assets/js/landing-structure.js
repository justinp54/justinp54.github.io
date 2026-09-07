// 랜딩 배경의 단백질 구조. 표면은 점구름으로, 리간드는 원자와 결합으로 그린다.
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.164.1/three.module.min.js";

const stage = document.querySelector("[data-landing-stage]");
if (stage && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const dataUrl = stage.dataset.structure;
  if (dataUrl) init(dataUrl).catch(() => stage.classList.add("is-failed"));
}

// 좁은 화면이나 정밀하지 않은 포인터를 쓰는 기기는 가벼운 설정으로 그린다
const IS_COMPACT = window.matchMedia("(max-width: 1024px)").matches || window.matchMedia("(pointer: coarse)").matches;

const QUALITY = IS_COMPACT
  ? { surfacePoints: 9000, dotSize: 1.4, pocketSize: 1.8, pixelRatio: 1.2, fitMargin: 0.78 }
  : { surfacePoints: Infinity, dotSize: 0.9, pocketSize: 1.25, pixelRatio: 1.5, fitMargin: 1.18 };

// 원소별 색은 화학 관례를 따르되, 탄소만 배경에 맞춰 밝기를 뒤집는다
const ELEMENT_COLORS = { N: "#4a86e8", O: "#e05a48", F: "#3fae7a", S: "#d8a92b" };
const PALETTES = {
  light: { carbon: 0x16181c, surface: 0x6b7280, surfaceOpacity: 0.72, pocket: 0x09ad94 },
  lightCompact: { carbon: 0x16181c, surface: 0x4b525c, surfaceOpacity: 0.9, pocket: 0x00806c },
  dark: { carbon: 0xf2f4f6, surface: 0xdfe3e8, surfaceOpacity: 0.9, pocket: 0x3fdcc0 },
  darkCompact: { carbon: 0xffffff, surface: 0xffffff, surfaceOpacity: 1, pocket: 0x5cf0d4 },
};

function currentPalette() {
  const dark = document.documentElement.dataset.theme === "dark";
  if (IS_COMPACT) return dark ? PALETTES.darkCompact : PALETTES.lightCompact;
  return dark ? PALETTES.dark : PALETTES.light;
}

async function init(dataUrl) {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`구조 데이터를 불러오지 못했습니다: ${response.status}`);
  const data = await response.json();

  const canvas = document.createElement("canvas");
  canvas.className = "landing-canvas";
  stage.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY.pixelRatio));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 2000);
  const model = new THREE.Group();
  scene.add(model);

  const surface = dotCloud(thin(data.surface, QUALITY.surfacePoints), {
    color: PALETTES.light.surface,
    size: QUALITY.dotSize,
    opacity: 0.72,
  });
  model.add(surface);
  // 포켓과 리간드는 이야기의 핵심이므로 줄이지 않는다
  const pocket = dotCloud(data.pocket, { color: PALETTES.light.pocket, size: QUALITY.pocketSize, opacity: 1 });
  model.add(pocket);
  const carbonMaterials = buildLigand(model, data.ligand, data.bonds);

  // 사용자가 테마를 바꾸면 탄소와 표면 색을 함께 뒤집는다
  const applyTheme = () => {
    const palette = currentPalette();
    surface.material.color.setHex(palette.surface);
    surface.material.opacity = palette.surfaceOpacity;
    pocket.material.color.setHex(palette.pocket);
    carbonMaterials.forEach((entry) => {
      if (entry.mesh) {
        const color = new THREE.Color(palette.carbon);
        entry.indices.forEach((index) => entry.mesh.setColorAt(index, color));
        entry.mesh.instanceColor.needsUpdate = true;
      } else {
        entry.color.setHex(palette.carbon);
      }
    });
  };
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // 카메라가 향할 지점은 리간드 무게중심, 즉 결합 포켓이다
  const pocketCenter = centroid(data.ligand);
  const radius = boundingRadius(data.surface);

  // 막관통 나선 다발이 옆에서 보이도록 세운다
  model.rotation.x = -Math.PI / 2 + 0.15;
  model.rotation.z = -0.4;

  // 화면이 세로로 길수록 구조가 잘리므로 비율에 맞춰 거리를 다시 잡는다
  let farDistance = 200;
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = stage;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    farDistance = fitDistance(radius, camera) * QUALITY.fitMargin;
  };
  resize();
  window.addEventListener("resize", resize);

  // 스크롤 진행도는 landing.js가 무대에 실어 보낸다
  let progress = 0;
  let target = 0;
  stage.addEventListener("stagemorph", (event) => {
    target = Math.min(Math.max(event.detail.morph, 0), 1);
  });

  const origin = new THREE.Vector3(0, 0, 0);
  const look = new THREE.Vector3();
  let spin = 0;

  const tick = () => {
    requestAnimationFrame(tick);
    // 다른 탭을 보고 있을 때는 그리지 않아 배터리를 아낀다
    if (document.hidden) return;

    // 스크롤이 멈춰도 부드럽게 따라가도록 목표값에 서서히 다가간다
    progress += (target - progress) * 0.06;
    const eased = progress * progress * (3 - 2 * progress);

    spin += 0.0016 * (1 - eased * 0.7);
    model.rotation.y = spin;

    camera.position.set(0, 0, farDistance * (1 - eased * 0.42));
    look.lerpVectors(origin, pocketCenter.clone().applyEuler(model.rotation), eased);
    camera.lookAt(look);

    renderer.render(scene, camera);
  };
  tick();

  addCaption(data);
  stage.classList.add("is-ready");
}

function addCaption(data) {
  const caption = document.querySelector("[data-stage-caption]");
  if (!caption) return;
  caption.innerHTML = `<span>RCSB PDB &middot; ${data.entry}</span><span>D2 dopamine receptor + risperidone</span>`;
  caption.hidden = false;
}

// 점이 목표치보다 많으면 고르게 솎아 낸다
function thin(points, limit) {
  if (points.length <= limit) return points;
  const step = points.length / limit;
  const kept = [];
  for (let index = 0; index < limit; index++) kept.push(points[Math.floor(index * step)]);
  return kept;
}

// 구조가 화면 안에 들어오는 최소 거리를 가로와 세로 양쪽으로 구한다
function fitDistance(radius, camera) {
  const half = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  return Math.max(radius / half, radius / (half * camera.aspect));
}

function boundingRadius(points) {
  return Math.sqrt(points.reduce((max, [x, y, z]) => Math.max(max, x * x + y * y + z * z), 0));
}

function centroid(atoms) {
  const sum = atoms.reduce((acc, [x, y, z]) => [acc[0] + x, acc[1] + y, acc[2] + z], [0, 0, 0]);
  return new THREE.Vector3(...sum.map((value) => value / atoms.length));
}

function dotCloud(points, { color, size, opacity }) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      map: dotTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
      fog: false,
    })
  );
}

// 사각형 기본 스프라이트 대신 부드러운 원형 점을 쓴다
function dotTexture() {
  if (dotTexture.cached) return dotTexture.cached;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.85)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  dotTexture.cached = new THREE.CanvasTexture(canvas);
  return dotTexture.cached;
}

function buildLigand(model, atoms, bonds) {
  // 원자와 결합을 각각 인스턴스 하나로 묶어 그리기 호출을 줄인다
  const carbonMaterials = [];
  const atomMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const atomMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 12, 12), atomMaterial, atoms.length);
  const matrix = new THREE.Matrix4();
  const carbonIndices = [];

  atoms.forEach(([x, y, z, element], index) => {
    matrix.makeTranslation(x, y, z);
    atomMesh.setMatrixAt(index, matrix);
    const known = ELEMENT_COLORS[element];
    atomMesh.setColorAt(index, new THREE.Color(known || PALETTES.light.carbon));
    if (!known) carbonIndices.push(index);
  });
  atomMesh.instanceColor.needsUpdate = true;
  model.add(atomMesh);

  const bondMaterial = new THREE.MeshBasicMaterial({ color: PALETTES.light.carbon });
  const bondMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 6), bondMaterial, bonds.length);
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const middle = new THREE.Vector3();

  bonds.forEach(([i, j], index) => {
    const start = new THREE.Vector3(...atoms[i].slice(0, 3));
    const end = new THREE.Vector3(...atoms[j].slice(0, 3));
    middle.copy(start).add(end).multiplyScalar(0.5);
    quaternion.setFromUnitVectors(up, end.clone().sub(start).normalize());
    scale.set(1, start.distanceTo(end), 1);
    bondMesh.setMatrixAt(index, matrix.compose(middle, quaternion, scale));
  });
  model.add(bondMesh);

  // 탄소만 테마에 따라 색이 바뀌므로 갱신에 필요한 정보를 넘긴다
  carbonMaterials.push({ mesh: atomMesh, indices: carbonIndices }, bondMaterial);
  return carbonMaterials;
}
