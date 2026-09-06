// 랜딩 배경의 단백질 구조. 백본은 옅은 관으로, 리간드는 원자와 결합으로 그린다.
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.164.1/three.module.min.js";

const stage = document.querySelector("[data-landing-stage]");
if (stage && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const dataUrl = stage.dataset.structure;
  if (dataUrl) init(dataUrl).catch(() => stage.classList.add("is-failed"));
}

// 원소별 색은 화학 관례를 따른다
const ELEMENT_COLORS = { C: "#16181c", N: "#2f6fd0", O: "#d0402f", F: "#3fae7a", S: "#d8a92b" };

async function init(dataUrl) {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`구조 데이터를 불러오지 못했습니다: ${response.status}`);
  const data = await response.json();

  const canvas = document.createElement("canvas");
  canvas.className = "landing-canvas";
  stage.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 2000);
  const model = new THREE.Group();
  scene.add(model);

  buildBackbone(model, data.segments);
  buildPocket(model, data.segments);
  buildLigand(model, data.ligand, data.bonds);

  // 막관통 나선 다발이 옆에서 보이도록 세운다
  model.rotation.x = -Math.PI / 2 + 0.15;
  model.rotation.z = -0.4;

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = stage;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(0, 0, 130);
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  let spin = 0;
  const tick = () => {
    spin += 0.0016;
    model.rotation.y = spin;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();

  stage.classList.add("is-ready");
}

function buildBackbone(model, segments) {
  const material = new THREE.MeshBasicMaterial({ color: 0xc2c5c9, transparent: true, opacity: 0.6 });
  segments.forEach((segment) => {
    const curve = new THREE.CatmullRomCurve3(segment.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    model.add(new THREE.Mesh(new THREE.TubeGeometry(curve, segment.length * 6, 0.5, 6, false), material));
  });
}

function buildPocket(model, segments) {
  const material = new THREE.MeshBasicMaterial({ color: 0x09ad94, transparent: true, opacity: 0.85 });
  const geometry = new THREE.SphereGeometry(0.55, 10, 10);
  segments.flat().forEach(([x, y, z, inPocket]) => {
    if (!inPocket) return;
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(x, y, z);
    model.add(marker);
  });
}

function buildLigand(model, atoms, bonds) {
  const sphere = new THREE.SphereGeometry(0.45, 14, 14);
  atoms.forEach(([x, y, z, element]) => {
    const color = new THREE.Color(ELEMENT_COLORS[element] || ELEMENT_COLORS.C);
    const atom = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color }));
    atom.position.set(x, y, z);
    model.add(atom);
  });

  const bondMaterial = new THREE.MeshBasicMaterial({ color: 0x16181c });
  const up = new THREE.Vector3(0, 1, 0);
  bonds.forEach(([i, j]) => {
    const start = new THREE.Vector3(...atoms[i].slice(0, 3));
    const end = new THREE.Vector3(...atoms[j].slice(0, 3));
    const bond = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, start.distanceTo(end), 6), bondMaterial);
    bond.position.copy(start).add(end).multiplyScalar(0.5);
    bond.quaternion.setFromUnitVectors(up, end.clone().sub(start).normalize());
    model.add(bond);
  });
}
