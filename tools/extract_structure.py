#!/usr/bin/env python3
"""Extract a molecular surface point cloud and a ligand model from a PDB entry.

Usage:
    python tools/extract_structure.py 6CM4 8NU assets/json/structure_6cm4.json

The surface is a solvent-accessible dot surface: points are sampled on a sphere around
every heavy atom and kept only when they fall outside every other atom, which is the
same construction PyMOL and Chimera use for their dot representations.
"""

import json
import math
import random
import sys
import urllib.request

# 결정화용 융합 단백질은 보통 1000번대 잔기 번호를 쓴다
FUSION_RESIDUE_START = 1000
POCKET_RADIUS = 6.0
BOND_CUTOFF = 1.9
PROBE_RADIUS = 1.4
SAMPLES_PER_ATOM = 260
# 결합 포켓 주변은 더 촘촘히 뽑아 리간드가 앉은 자리를 도드라지게 한다
POCKET_SAMPLE_FACTOR = 3
POCKET_ATOM_RADIUS = 9.0
TARGET_SURFACE_POINTS = 30000

VDW_RADII = {"C": 1.70, "N": 1.55, "O": 1.52, "S": 1.80, "F": 1.47, "P": 1.80, "CL": 1.75}
DEFAULT_RADIUS = 1.70


def fetch_pdb(entry_id):
    url = f"https://files.rcsb.org/download/{entry_id.upper()}.pdb"
    with urllib.request.urlopen(url, timeout=60) as response:
        return response.read().decode("utf-8").splitlines()


def parse(lines, ligand_code):
    protein, ligand = [], []
    for line in lines:
        record = line[:6]
        if record not in ("ATOM  ", "HETATM"):
            continue
        element = (line[76:78].strip() or line[12:16].strip()[0]).upper()
        if element == "H":
            continue
        point = (float(line[30:38]), float(line[38:46]), float(line[46:54]))
        if record == "ATOM  ":
            if int(line[22:26]) >= FUSION_RESIDUE_START:
                continue
            protein.append((element, point))
        elif record == "HETATM" and line[17:20].strip() == ligand_code:
            ligand.append((element, point))
    return protein, ligand


def fibonacci_sphere(count):
    """Spread points evenly over a unit sphere so the dots do not clump at the poles."""
    golden_angle = math.pi * (3 - math.sqrt(5))
    points = []
    for index in range(count):
        y = 1 - (index / (count - 1)) * 2
        radius = math.sqrt(max(0.0, 1 - y * y))
        angle = golden_angle * index
        points.append((math.cos(angle) * radius, y, math.sin(angle) * radius))
    return points


def build_grid(atoms, cell_size):
    grid = {}
    for index, (_, point) in enumerate(atoms):
        key = tuple(int(math.floor(value / cell_size)) for value in point)
        grid.setdefault(key, []).append(index)
    return grid


def neighbours(grid, point, cell_size):
    base = [int(math.floor(value / cell_size)) for value in point]
    found = []
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for dz in (-1, 0, 1):
                found.extend(grid.get((base[0] + dx, base[1] + dy, base[2] + dz), []))
    return found


def surface_points(atoms, ligand):
    """Keep sampled sphere points that no other atom buries."""
    radii = [VDW_RADII.get(element, DEFAULT_RADIUS) + PROBE_RADIUS for element, _ in atoms]
    cell_size = max(radii) * 2
    grid = build_grid(atoms, cell_size)
    sparse_sphere = fibonacci_sphere(SAMPLES_PER_ATOM)
    dense_sphere = fibonacci_sphere(SAMPLES_PER_ATOM * POCKET_SAMPLE_FACTOR)

    points = []
    for index, (_, centre) in enumerate(atoms):
        radius = radii[index]
        candidates = neighbours(grid, centre, cell_size)
        near_ligand = any(math.dist(centre, atom) < POCKET_ATOM_RADIUS for _, atom in ligand)
        unit_sphere = dense_sphere if near_ligand else sparse_sphere
        for direction in unit_sphere:
            probe = tuple(centre[axis] + direction[axis] * radius for axis in range(3))
            buried = False
            for other in candidates:
                if other == index:
                    continue
                if math.dist(probe, atoms[other][1]) < radii[other] - 1e-6:
                    buried = True
                    break
            if not buried:
                points.append(probe)
    return points


def find_pocket_points(points, ligand):
    return [any(math.dist(point, atom) < POCKET_RADIUS for _, atom in ligand) for point in points]


def infer_bonds(ligand):
    return [
        [i, j]
        for i in range(len(ligand))
        for j in range(i + 1, len(ligand))
        if math.dist(ligand[i][1], ligand[j][1]) < BOND_CUTOFF
    ]


def main():
    entry_id, ligand_code, output_path = sys.argv[1], sys.argv[2], sys.argv[3]
    protein, ligand = parse(fetch_pdb(entry_id), ligand_code)
    if not protein or not ligand:
        raise SystemExit(f"{entry_id}에서 단백질 또는 리간드 {ligand_code}를 찾지 못했습니다")

    centre = [sum(point[axis] for _, point in protein) / len(protein) for axis in range(3)]
    points = surface_points(protein, ligand)
    in_pocket = find_pocket_points(points, ligand)

    # 표면 점이 목표치를 넘으면 포켓 밖 점만 솎아 내어 포켓 밀도를 지킨다
    surface, pocket = [], []
    outside = [i for i, flag in enumerate(in_pocket) if not flag]
    keep_ratio = min(1.0, TARGET_SURFACE_POINTS / max(1, len(outside)))
    random.seed(0)
    for index, point in enumerate(points):
        shifted = [round(point[axis] - centre[axis], 1) for axis in range(3)]
        if in_pocket[index]:
            pocket.append(shifted)
        elif random.random() < keep_ratio:
            surface.append(shifted)

    data = {
        "entry": entry_id.upper(),
        "ligand_code": ligand_code,
        "surface": surface,
        "pocket": pocket,
        "ligand": [[*[round(point[axis] - centre[axis], 2) for axis in range(3)], element] for element, point in ligand],
        "bonds": infer_bonds(ligand),
    }
    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, separators=(",", ":"))

    print(f"{entry_id.upper()}: 표면 {len(surface)}점 / 포켓 {len(pocket)}점 / 리간드 {len(ligand)}원자 / 결합 {len(data['bonds'])}개")


if __name__ == "__main__":
    main()
