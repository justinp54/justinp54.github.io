# 포스트 작성 가이드

## 포스트 구분 방법 (파일 분리 방식)

### 1. Paper Review 포스트 (논문 리뷰)

**`_reviews/` 디렉토리에 저장합니다.**

**Frontmatter 예시:**
```yaml
---
layout: post
title: "[논문리뷰] 논문 제목"
date: 2024-12-20
description: "논문에 대한 설명"
tags: [machine-learning, deep-learning]
---
```

**특징:**
- `_reviews/` 디렉토리에 파일을 저장하면 자동으로 Paper Review로 인식됩니다
- 플러그인이 자동으로 `/reviews/2024/12/20/...` 형식의 URL을 생성합니다
- `categories`를 설정할 필요가 없습니다 (자동으로 reviews collection에 속함)
- `permalink`를 수동으로 작성할 필요가 없습니다
- Paper Reviews 페이지에 자동으로 표시됩니다
- 논문 정보 블록(`<div class="paper-info-block">`)을 사용할 수 있습니다

**파일 위치:** `_reviews/2024-12-20-paper-title.md`

---

### 2. 일반 Journal 포스트 (개인 블로그)

**`_posts/` 디렉토리에 저장합니다.**

**Frontmatter 예시:**
```yaml
---
layout: post
title: "일반 블로그 포스트 제목"
date: 2024-12-20
description: "포스트에 대한 설명"
categories: []  # 선택사항
tags: [hobby, personal]
---
```

**특징:**
- `_posts/` 디렉토리에 파일을 저장하면 자동으로 일반 포스트로 처리됩니다
- `_config.yml`의 기본 permalink 설정(`/blog/:year/:title/`)이 적용됩니다
- Journal 페이지에 자동으로 표시됩니다
- 일반 블로그 스타일이 적용됩니다

**파일 위치:** `_posts/2024-12-20-blog-title.md`

---

## 요약

| 포스트 타입 | 디렉토리 | URL 경로 | 표시 위치 |
|------------|---------|----------|----------|
| **Paper Review** | `_reviews/` | `/reviews/...` | Paper Reviews 페이지 |
| **일반 Journal** | `_posts/` | `/blog/...` | Journal 페이지 |

## 작성 팁

1. **논문 리뷰를 작성할 때:**
   - `_reviews/` 디렉토리에 파일 생성
   - 파일명 형식: `YYYY-MM-DD-paper-title.md`
   - 나머지는 자동으로 처리됨

2. **일반 블로그를 작성할 때:**
   - `_posts/` 디렉토리에 파일 생성
   - 파일명 형식: `YYYY-MM-DD-blog-title.md`
   - 기본 permalink가 자동 적용됨

3. **확인 방법:**
   - Jekyll 서버를 재시작하면 빌드 로그에 permalink 정보가 표시됩니다
   - Paper Review 포스트: `Reviews Permalink: Set permalink for ...`
   - 일반 포스트: 로그에 표시되지 않음 (기본 permalink 사용)

## 파일 구조 예시

```
justinp54.github.io/
├── _posts/                    # 일반 블로그 포스트
│   ├── 2024-12-20-hobby.md
│   └── 2024-12-21-personal.md
└── _reviews/                  # 논문 리뷰 포스트
    ├── 2024-12-20-ddpm.md
    └── 2024-12-25-transformer.md
```

## 주의사항

- **파일 위치가 중요합니다**: `_reviews/`에 저장하면 자동으로 Paper Review로 처리됩니다
- `_reviews/`의 포스트는 `categories`를 설정할 필요가 없습니다
- 한 포스트는 하나의 디렉토리에만 속해야 합니다 (`_posts/` 또는 `_reviews/`)
- `permalink`를 수동으로 설정하면 플러그인의 자동 설정이 무시됩니다
