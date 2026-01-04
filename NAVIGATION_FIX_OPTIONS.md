# 네비게이션 활성화 문제 해결 대안

## 문제 원인

1. **포스트 URL 구조**: `_config.yml`에서 `permalink: /blog/:year/:title/`로 설정되어 모든 포스트의 URL이 `/blog/2024/12/20/...` 형식
2. **Journal 활성화 로직**: `page.url contains '/blog/'` 조건으로 인해 paper-review 포스트도 Journal이 활성화됨
3. **현재 로직의 한계**: Liquid 템플릿에서 조건문 순서와 로직이 복잡하여 예상치 못한 동작 발생

## 대안 1: paper-review 포스트의 permalink를 `/reviews/...`로 변경 (권장)

### 장점
- 가장 깔끔하고 근본적인 해결책
- URL 구조가 논리적으로 분리됨
- 네비게이션 로직이 단순해짐

### 방법
각 paper-review 포스트의 frontmatter에 `permalink` 추가:

```yaml
---
layout: post
title: "[논문리뷰] Denoising Diffusion Probabilistic Models (DDPM)"
date: 2024-12-20
permalink: /reviews/2024/12/20/ddpm/
categories: [paper-review]
tags: [machine-learning, deep-learning, generative-models, diffusion-models, review]
---
```

### 단점
- 기존 포스트의 URL이 변경되어 링크가 깨질 수 있음
- 새 포스트마다 permalink를 수동으로 설정해야 함

---

## 대안 2: CSS로 강제 비활성화

### 장점
- 기존 URL 구조 유지
- 간단한 구현

### 방법
`_sass/_paper_review.scss`에 추가:

```scss
// paper-review 포스트일 때 Journal 네비게이션 비활성화
body:has(.paper-review) {
  .navbar-nav .nav-item:has(a[href*="/blog/"]) {
    &.active {
      .nav-link {
        color: var(--global-text-color) !important;
        font-weight: normal !important;
      }
    }
  }
}
```

또는 JavaScript로:

```javascript
if (document.querySelector('.paper-review')) {
  const journalLink = document.querySelector('.navbar-nav a[href*="/blog/"]');
  if (journalLink) {
    journalLink.closest('.nav-item').classList.remove('active');
  }
}
```

### 단점
- CSS/JS로 강제하는 방식이라 근본적 해결책이 아님
- 브라우저 호환성 문제 가능

---

## 대안 3: Jekyll Plugin으로 자동 permalink 설정

### 장점
- 자동화 가능
- 기존 로직 유지

### 방법
`_plugins/paper_review_permalink.rb` 생성:

```ruby
module Jekyll
  class PaperReviewPermalinkGenerator < Generator
    safe true
    priority :high

    def generate(site)
      site.posts.docs.each do |post|
        if post.data['categories']&.include?('paper-review')
          date = post.date
          slug = post.data['slug'] || post.data['title'].downcase.gsub(/[^\w]+/, '-')
          post.data['permalink'] = "/reviews/#{date.year}/#{date.month.to_s.rjust(2, '0')}/#{date.day.to_s.rjust(2, '0')}/#{slug}/"
        end
      end
    end
  end
end
```

### 단점
- Jekyll 플러그인 필요
- GitHub Pages에서는 플러그인 제한

---

## 대안 4: 네비게이션 로직 완전 재작성

### 방법
`_includes/header.liquid`에서 Journal 활성화 조건을 더 엄격하게:

```liquid
{% elsif is_blog_page %}
  {% comment %} Journal은 오직 Journal 페이지일 때만 활성화 {% endcomment %}
  {% if page.permalink == '/blog/' %}
    {% assign should_be_active = true %}
  {% else %}
    {% assign should_be_active = false %}
  {% endif %}
```

그리고 "다른 페이지" 로직에서 Journal을 제외:

```liquid
{% else %}
  {% comment %} Journal이 아닐 때만 기본 로직 사용 {% endcomment %}
  {% unless p.permalink == '/blog/' %}
    {% if page.url contains parent_link %}
      {% assign should_be_active = true %}
    {% endif %}
  {% endunless %}
{% endif %}
```

---

## 추천 순서

1. **대안 1 (권장)**: 가장 깔끔하고 근본적인 해결책
2. **대안 4**: 로직 수정으로 해결 (현재 시도 중인 방법 개선)
3. **대안 2**: 빠른 임시 해결책
4. **대안 3**: 자동화가 필요한 경우

