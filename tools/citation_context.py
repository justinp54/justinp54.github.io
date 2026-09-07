#!/usr/bin/env python3
"""Collect what later papers actually said when they cited a given paper.

Usage:
    python tools/citation_context.py arXiv:2210.01776
    python tools/citation_context.py DOI:10.1038/s41586-021-03819-2 --all
    python tools/citation_context.py "GalaxyDock-DL" --out notes.md

A paper never states its own limitations. Its descendants do, in the sentence where
they cite it. This pulls those sentences from the Semantic Scholar Graph API and
sorts them into the themes that matter when asking what a model failed to learn.

Set S2_API_KEY to raise the rate limit; the script works without it.
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.semanticscholar.org/graph/v1"
CITATION_FIELDS = "contexts,isInfluential,title,year,venue,citationCount,externalIds"
PAGE_SIZE = 1000
MAX_CITATIONS = 4000

# 6번과 7번 질문("벤치마크 성능이 곧 이해인가", "무엇을 못 배웠나")에 걸리는 주제들
THEMES = {
    "데이터 누출과 암기": [
        "leak",
        "memoriz",
        "overfit",
        "redundan",
        "train-test",
        "training set overlap",
        "similarity between",
        "seen during training",
    ],
    "물리적 타당성": [
        "steric",
        "clash",
        "physically",
        "physical valid",
        "implausib",
        "unrealistic",
        "stereochem",
        "bond length",
        "bond angle",
    ],
    "일반화 실패": [
        "generaliz",
        "out-of-distribution",
        "unseen",
        "novel sequence",
        "novel protein",
        "held-out",
        "scaffold split",
        "temporal split",
        "time-based split",
    ],
    "벤치마크와 평가 기준": [
        "benchmark",
        "PoseBusters",
        "PDBbind",
        "DUD-E",
        "CASP",
        "evaluation protocol",
        "split",
        "metric",
    ],
    "성능 한계와 반례": [
        "fails to",
        "failed to",
        "does not",
        "cannot",
        "unable to",
        "limitation",
        "underperform",
        "worse than",
        "degrade",
        "struggle",
    ],
}


def request(path, params):
    """Retry on the shared rate limit instead of giving up mid-collection."""
    url = f"{API}/{path}?{urllib.parse.urlencode(params)}"
    headers = {"User-Agent": "citation-context/1.0"}
    if os.environ.get("S2_API_KEY"):
        headers["x-api-key"] = os.environ["S2_API_KEY"]

    # 키 없이 쓰는 공용 한도는 모든 사용자가 나눠 쓰므로 429가 자주 난다
    waits = [5, 10, 20, 30, 45, 60, 90]
    for attempt, wait in enumerate(waits):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code != 429:
                raise
            print(f"  요청 한도에 걸려 {wait}초 기다립니다 ({attempt + 1}/{len(waits)})", file=sys.stderr)
            time.sleep(wait)
    raise SystemExit("요청 한도를 넘어 계속하지 못했습니다. S2_API_KEY를 설정하면 안정적입니다")


def resolve(query):
    """Accept an arXiv ID, a DOI, or a plain title and return one paper."""
    if re.match(r"^(arxiv|doi|corpusid|pmid|pmcid|url|mag|acl):", query, re.I):
        return request(f"paper/{query}", {"fields": "title,year,venue,citationCount,externalIds"})

    found = request("paper/search", {"query": query, "limit": 5, "fields": "title,year,venue,citationCount"})
    hits = found.get("data") or []
    if not hits:
        raise SystemExit(f"'{query}'에 해당하는 논문을 찾지 못했습니다")

    # 인용 수로 고르면 제목이 정확히 맞는 논문을 놓치므로 제목이 얼마나 겹치는지를 먼저 본다
    asked = set(re.findall(r"[a-z0-9]+", query.lower()))
    def overlap(hit):
        words = set(re.findall(r"[a-z0-9]+", (hit.get("title") or "").lower()))
        return len(asked & words) / max(1, len(asked))

    ranked = sorted(enumerate(hits), key=lambda pair: (-overlap(pair[1]), pair[0]))
    best = ranked[0][1]
    if len(hits) > 1:
        print("검색 결과가 여럿이라 제목이 가장 많이 겹치는 것을 골랐습니다:", file=sys.stderr)
        for _, hit in ranked:
            mark = "→" if hit is best else " "
            print(f"  {mark} {hit['title']} ({hit.get('year')}, 일치 {overlap(hit):.0%})", file=sys.stderr)
    return best


def citations(paper_id):
    collected = []
    offset = 0
    while offset < MAX_CITATIONS:
        page = request(f"paper/{paper_id}/citations", {"fields": CITATION_FIELDS, "limit": PAGE_SIZE, "offset": offset})
        batch = page.get("data") or []
        if not batch:
            break
        collected.extend(batch)
        print(f"  {len(collected)}건 수집", file=sys.stderr)
        if "next" not in page:
            break
        offset = page["next"]
        time.sleep(1)
    return collected


def classify(sentence):
    lowered = sentence.lower()
    return [name for name, words in THEMES.items() if any(word.lower() in lowered for word in words)]


def collect(entries, keep_all):
    """One row per quoted sentence, deduplicated and newest first."""
    rows = []
    seen = set()
    for entry in entries:
        citing = entry.get("citingPaper") or {}
        for sentence in entry.get("contexts") or []:
            text = re.sub(r"\s+", " ", sentence).strip()
            if len(text) < 40 or text in seen:
                continue
            seen.add(text)
            themes = classify(text)
            if not themes and not keep_all:
                continue
            rows.append(
                {
                    "themes": themes or ["기타"],
                    "text": text,
                    "title": citing.get("title") or "(제목 없음)",
                    "year": citing.get("year"),
                    "venue": citing.get("venue") or "",
                    "influential": entry.get("isInfluential", False),
                    "arxiv": (citing.get("externalIds") or {}).get("ArXiv"),
                    "doi": (citing.get("externalIds") or {}).get("DOI"),
                }
            )
    rows.sort(key=lambda row: (row["year"] or 0, row["influential"]), reverse=True)
    return rows


def render(paper, entries, rows, keep_all):
    out = []
    out.append(f"# {paper['title']}")
    out.append("")
    out.append(f"{paper.get('venue') or ''} {paper.get('year') or ''} · 인용 {paper.get('citationCount')}건".strip())
    with_context = sum(1 for entry in entries if entry.get("contexts"))
    out.append(f"인용 {len(entries)}건을 가져왔고 그중 {with_context}건에 인용 문장이 있었습니다.")
    out.append(f"주제에 걸린 문장 {len(rows)}개를 아래에 옮깁니다." if not keep_all else f"문장 {len(rows)}개를 아래에 옮깁니다.")
    out.append("")

    order = list(THEMES) + ["기타"]
    for theme in order:
        picked = [row for row in rows if theme in row["themes"]]
        if not picked:
            continue
        out.append(f"## {theme} ({len(picked)}건)")
        out.append("")
        for row in picked:
            link = ""
            if row["arxiv"]:
                link = f" · https://arxiv.org/abs/{row['arxiv']}"
            elif row["doi"]:
                link = f" · https://doi.org/{row['doi']}"
            mark = " ★" if row["influential"] else ""
            out.append(f"> {row['text']}")
            out.append("")
            out.append(f"— {row['title']} ({row['year']}){mark}{link}")
            out.append("")
    return "\n".join(out)


def main():
    parser = argparse.ArgumentParser(description="후속 논문이 이 논문을 인용하며 뭐라고 했는지 모읍니다")
    parser.add_argument("paper", help="arXiv:2210.01776, DOI:..., 또는 논문 제목")
    parser.add_argument("--all", action="store_true", help="주제로 거르지 않고 모든 인용 문장을 봅니다")
    parser.add_argument("--out", help="결과를 마크다운 파일로 저장합니다")
    args = parser.parse_args()

    paper = resolve(args.paper)
    print(f"{paper['title']} ({paper.get('year')})", file=sys.stderr)
    entries = citations(paper["paperId"])
    rows = collect(entries, args.all)
    text = render(paper, entries, rows, args.all)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as handle:
            handle.write(text)
        print(f"{args.out}에 저장했습니다", file=sys.stderr)
    else:
        print(text)


if __name__ == "__main__":
    main()
