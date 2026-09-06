#!/usr/bin/env python3
"""Extract a lightweight backbone and ligand representation from a PDB entry.

Usage:
    python tools/extract_structure.py 6CM4 8NU assets/json/structure_6cm4.json

The output keeps only what the landing visual needs: alpha-carbon segments for the
backbone, every ligand atom with inferred bonds, and the residues lining the pocket.
"""

import json
import math
import sys
import urllib.request

# 결정화용 융합 단백질은 보통 1000번대 잔기 번호를 쓴다
FUSION_RESIDUE_START = 1000
POCKET_RADIUS = 5.0
BOND_CUTOFF = 1.9


def fetch_pdb(entry_id):
    url = f"https://files.rcsb.org/download/{entry_id.upper()}.pdb"
    with urllib.request.urlopen(url, timeout=60) as response:
        return response.read().decode("utf-8").splitlines()


def parse(lines, ligand_code):
    alpha_carbons, ligand, protein = [], [], []
    for line in lines:
        record = line[:6]
        if record == "ATOM  ":
            residue = int(line[22:26])
            if residue >= FUSION_RESIDUE_START:
                continue
            point = (float(line[30:38]), float(line[38:46]), float(line[46:54]))
            protein.append((residue, point))
            if line[12:16].strip() == "CA":
                alpha_carbons.append((residue, point))
        elif record == "HETATM" and line[17:20].strip() == ligand_code:
            element = line[76:78].strip() or line[12:16].strip()[0]
            ligand.append((element, (float(line[30:38]), float(line[38:46]), float(line[46:54]))))
    return alpha_carbons, ligand, protein


def find_pocket(protein, ligand):
    pocket = set()
    for residue, point in protein:
        if any(math.dist(point, atom) < POCKET_RADIUS for _, atom in ligand):
            pocket.add(residue)
    return pocket


def infer_bonds(ligand):
    return [
        [i, j]
        for i in range(len(ligand))
        for j in range(i + 1, len(ligand))
        if math.dist(ligand[i][1], ligand[j][1]) < BOND_CUTOFF
    ]


def split_segments(alpha_carbons, pocket, center):
    segments, current, previous = [], [], None
    for residue, point in alpha_carbons:
        # 잔기 번호가 끊기면 백본 선도 끊어야 없는 결합이 그려지지 않는다
        if previous is not None and residue - previous > 1:
            segments.append(current)
            current = []
        current.append([*shift(point, center), 1 if residue in pocket else 0])
        previous = residue
    segments.append(current)
    return [segment for segment in segments if len(segment) >= 4]


def shift(point, center):
    return [round(value - origin, 2) for value, origin in zip(point, center)]


def main():
    entry_id, ligand_code, output_path = sys.argv[1], sys.argv[2], sys.argv[3]
    alpha_carbons, ligand, protein = parse(fetch_pdb(entry_id), ligand_code)
    if not alpha_carbons or not ligand:
        raise SystemExit(f"{entry_id}에서 백본 또는 리간드 {ligand_code}를 찾지 못했습니다")

    center = [sum(point[axis] for _, point in alpha_carbons) / len(alpha_carbons) for axis in range(3)]
    pocket = find_pocket(protein, ligand)
    data = {
        "entry": entry_id.upper(),
        "ligand_code": ligand_code,
        "segments": split_segments(alpha_carbons, pocket, center),
        "ligand": [[*shift(point, center), element] for element, point in ligand],
        "bonds": infer_bonds(ligand),
    }
    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, separators=(",", ":"))

    points = sum(len(segment) for segment in data["segments"])
    print(f"{entry_id.upper()}: 백본 {points}점 / 포켓 {len(pocket)}잔기 / 리간드 {len(ligand)}원자 / 결합 {len(data['bonds'])}개")


if __name__ == "__main__":
    main()
