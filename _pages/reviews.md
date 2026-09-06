---
layout: default
permalink: /reviews/
title: Paper Reviews
nav: true
nav_order: 1
pagination:
  enabled: false
---

<div class="post">

{% assign paper_reviews = site.reviews | sort: "date" | reverse %}

<div class="p-3 mb-4 rounded border">
  <div class="d-flex align-items-center mb-2">
    <i class="fa-solid fa-file-pen mr-2" style="color: var(--global-theme-color);"></i>
    <strong>논문리뷰</strong> ({{ paper_reviews | size }})
  </div>
  {% assign all_tags = "" | split: "," %}
  {% for review in paper_reviews %}
    {% for tag in review.tags %}
      {% unless all_tags contains tag %}
        {% assign all_tags = all_tags | push: tag %}
      {% endunless %}
    {% endfor %}
  {% endfor %}
  {% if all_tags.size > 0 %}
  <div class="ml-3 d-flex flex-wrap">
    {% for tag in all_tags %}
      {% assign tag_count = paper_reviews | where_exp: "r", "r.tags contains tag" | size %}
      <a class="mr-3 mb-1" href="{{ tag | slugify | prepend: '/reviews/tag/' | append: '/' | relative_url }}">
        <i class="fa-solid fa-hashtag fa-sm"></i> {{ tag }} ({{ tag_count }})
      </a>
    {% endfor %}
  </div>
  {% endif %}
</div>

{% assign featured_reviews = paper_reviews | where: "featured", "true" %}
{% if featured_reviews.size > 0 %}

<div class="container featured-posts">
  {% assign is_even = featured_reviews.size | modulo: 2 %}
  <div class="row row-cols-{% if featured_reviews.size <= 2 or is_even == 0 %}2{% else %}3{% endif %}">
    {% for review in featured_reviews %}
    <div class="col mb-4">
      <a href="{{ review.url | relative_url }}">
        <div class="card hoverable">
          <div class="row g-0">
            <div class="col-md-12">
              <div class="card-body">
                <div class="float-right"><i class="fa-solid fa-thumbtack fa-xs"></i></div>
                <h3 class="card-title text-lowercase">{{ review.title }}</h3>
                <p class="card-text">{{ review.description }}</p>
                {% assign read_time = review.content | number_of_words | divided_by: 180 | plus: 1 %}
                {% assign year = review.date | date: "%Y" %}
                <p class="post-meta">
                  {{ read_time }} min read &nbsp;&middot;&nbsp;
                  <a href="{{ year | prepend: '/reviews/' | relative_url }}">
                    <i class="fa-solid fa-calendar fa-sm"></i> {{ year }}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
    {% endfor %}
  </div>
</div>
<hr>
{% endif %}

<ul class="post-list">
  {% for review in paper_reviews %}
  {% assign read_time = review.content | number_of_words | divided_by: 180 | plus: 1 %}
  {% assign year = review.date | date: "%Y" %}
  {% assign tags = review.tags | join: "" %}
  {% assign categories = review.categories | join: "" %}

  <li>
    {% if review.thumbnail %}<div class="row"><div class="col-sm-9">{% endif %}

    <h3>
      {% if review.depth %}<span class="review-depth review-depth-{{ review.depth }}">{{ review.depth }}</span>{% endif %}
      {% if review.redirect == blank %}
        <a class="post-title" href="{{ review.url | relative_url }}">{{ review.title }}</a>
      {% elsif review.redirect contains '://' %}
        <a class="post-title" href="{{ review.redirect }}" target="_blank">{{ review.title }}</a>
        <svg width="2rem" height="2rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      {% else %}
        <a class="post-title" href="{{ review.redirect | relative_url }}">{{ review.title }}</a>
      {% endif %}
    </h3>

    <p>{{ review.description }}</p>

    <p class="post-meta">
      {{ read_time }} min read &nbsp;&middot;&nbsp;
      {{ review.date | date: '%B %d, %Y' }}
    </p>

    <p class="post-tags">
      <a href="{{ year | prepend: '/reviews/' | relative_url }}">
        <i class="fa-solid fa-calendar fa-sm"></i> {{ year }}
      </a>
      {% if tags != "" %}
        &nbsp;&middot;&nbsp;
        {% for tag in review.tags %}
          <a class="mr-3 mb-1" href="{{ tag | slugify | prepend: '/reviews/tag/' | append: '/' | relative_url }}">
            <i class="fa-solid fa-hashtag fa-sm"></i> {{ tag }}</a>{% unless forloop.last %}&nbsp;{% endunless %}
        {% endfor %}
      {% endif %}
      {% if categories != "" %}
        &nbsp;&middot;&nbsp;
        {% for category in review.categories %}
          <a href="{{ category | slugify | prepend: '/reviews/category/' | append: '/' | relative_url }}">
            <i class="fa-solid fa-tag fa-sm"></i> {{ category }}</a>{% unless forloop.last %}&nbsp;{% endunless %}
        {% endfor %}
      {% endif %}
    </p>

    {% if review.thumbnail %}
      </div>
      <div class="col-sm-3">
        <img class="card-img" src="{{ review.thumbnail | relative_url }}" style="object-fit: cover; height: 90%" alt="image">
      </div>
    </div>
    {% endif %}

  </li>
  {% endfor %}
</ul>

</div>
