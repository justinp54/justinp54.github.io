---
layout: default
permalink: /reviews/
title: Paper Reviews
nav: true
nav_order: 1
pagination:
  enabled: false
---

<style>
.post-list h3 {
  font-size: 1.25rem !important;
  font-weight: 500 !important;
  margin-bottom: 0.5rem;
}

.post-list h3 .post-title {
  font-size: 1.25rem !important;
  font-weight: 500 !important;
}
</style>

<div class="post">

{% comment %} reviews collection과 _posts에서 paper-review 모두 수집 {% endcomment %}
{% assign paper_review_posts = "" | split: "," %}

{% comment %} reviews collection에서 가져오기 {% endcomment %}
{% if site.reviews %}
  {% for review in site.reviews %}
    {% assign paper_review_posts = paper_review_posts | push: review %}
  {% endfor %}
{% elsif site.collections.reviews and site.collections.reviews.docs %}
  {% for review in site.collections.reviews.docs %}
    {% assign paper_review_posts = paper_review_posts | push: review %}
  {% endfor %}
{% endif %}

{% comment %} _posts에서 paper-review 카테고리 가져오기 {% endcomment %}
{% assign reviews_from_posts = site.posts | where_exp: "post", "post.categories contains 'paper-review'" %}
{% for post in reviews_from_posts %}
  {% assign paper_review_posts = paper_review_posts | push: post %}
{% endfor %}

{% assign total_posts = site.posts | size %}
{% assign review_posts_count = paper_review_posts | size %}

<!-- Statistics Section -->
<div class="post-stats" style="margin-bottom: 2rem; padding: 1rem; background-color: #f8f9fa; border-radius: 8px;">
  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <i class="fa-solid fa-folder" style="color: #ffc107;"></i>
      <span><strong>전체 게시글</strong> ({{ total_posts }})</span>
    </div>
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <i class="fa-solid fa-file-pen" style="color: #09ad94;"></i>
      <span><strong>논문리뷰</strong> ({{ review_posts_count }})</span>
    </div>
    
    {% comment %} Collect all tags from paper-review posts {% endcomment %}
    {% assign all_tags = "" | split: "," %}
    {% for post in paper_review_posts %}
      {% for tag in post.tags %}
        {% unless all_tags contains tag %}
          {% assign all_tags = all_tags | push: tag %}
        {% endunless %}
      {% endfor %}
    {% endfor %}
    
    {% if all_tags.size > 0 %}
    <div style="margin-left: 1.5rem; margin-top: 0.5rem;">
      {% for tag in all_tags %}
        {% assign tag_posts = paper_review_posts | where_exp: "post", "post.tags contains tag" %}
        {% assign tag_count = tag_posts | size %}
        <div style="margin-bottom: 0.25rem;">
          <span>{{ tag }} ({{ tag_count }})</span>
        </div>
      {% endfor %}
    </div>
    {% endif %}
  </div>
</div>
{% assign featured_posts = paper_review_posts | where: "featured", "true" %}
{% if featured_posts.size > 0 %}
<br>

<div class="container featured-posts">
{% assign is_even = featured_posts.size | modulo: 2 %}
<div class="row row-cols-{% if featured_posts.size <= 2 or is_even == 0 %}2{% else %}3{% endif %}">
{% for post in featured_posts %}
<div class="col mb-4">
<a href="{{ post.url | relative_url }}">
<div class="card hoverable">
<div class="row g-0">
<div class="col-md-12">
<div class="card-body">
<div class="float-right">
<i class="fa-solid fa-thumbtack fa-xs"></i>
</div>
<h3 class="card-title text-lowercase">{{ post.title }}</h3>
<p class="card-text">{{ post.description }}</p>

                    {% if post.external_source == blank %}
                      {% assign read_time = post.content | number_of_words | divided_by: 180 | plus: 1 %}
                    {% else %}
                      {% assign read_time = post.feed_content | strip_html | number_of_words | divided_by: 180 | plus: 1 %}
                    {% endif %}
                    {% assign year = post.date | date: "%Y" %}

                    <p class="post-meta">
                      {{ read_time }} min read &nbsp; &middot; &nbsp;
                      <a href="{{ year | prepend: '/reviews/' | relative_url }}">
                        <i class="fa-solid fa-calendar fa-sm"></i> {{ year }} </a>
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

    {% assign postlist = paper_review_posts %}

    {% for post in postlist %}

    {% if post.external_source == blank %}
      {% assign read_time = post.content | number_of_words | divided_by: 180 | plus: 1 %}
    {% else %}
      {% assign read_time = post.feed_content | strip_html | number_of_words | divided_by: 180 | plus: 1 %}
    {% endif %}
    {% assign year = post.date | date: "%Y" %}
    {% assign tags = post.tags | join: "" %}
    {% assign categories = post.categories | join: "" %}

    <li>

{% if post.thumbnail %}

<div class="row">
          <div class="col-sm-9">
{% endif %}
        <h3>
        {% if post.redirect == blank %}
          <a class="post-title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
        {% elsif post.redirect contains '://' %}
          <a class="post-title" href="{{ post.redirect }}" target="_blank">{{ post.title }}</a>
          <svg width="2rem" height="2rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        {% else %}
          <a class="post-title" href="{{ post.redirect | relative_url }}">{{ post.title }}</a>
        {% endif %}
      </h3>
      <p>{{ post.description }}</p>
      <p class="post-meta">
        {{ read_time }} min read &nbsp; &middot; &nbsp;
        {{ post.date | date: '%B %d, %Y' }}
        {% if post.external_source %}
        &nbsp; &middot; &nbsp; {{ post.external_source }}
        {% endif %}
      </p>
      <p class="post-tags">
        <a href="{{ year | prepend: '/reviews/' | relative_url }}">
          <i class="fa-solid fa-calendar fa-sm"></i> {{ year }} </a>

          {% if tags != "" %}
          &nbsp; &middot; &nbsp;
            {% for tag in post.tags %}
            <a href="{{ tag | slugify | prepend: '/reviews/tag/' | relative_url }}">
              <i class="fa-solid fa-hashtag fa-sm"></i> {{ tag }}</a>
              {% unless forloop.last %}
                &nbsp;
              {% endunless %}
              {% endfor %}
          {% endif %}

          {% if categories != "" %}
          &nbsp; &middot; &nbsp;
            {% for category in post.categories %}
            <a href="{{ category | slugify | prepend: '/reviews/category/' | relative_url }}">
              <i class="fa-solid fa-tag fa-sm"></i> {{ category }}</a>
              {% unless forloop.last %}
                &nbsp;
              {% endunless %}
              {% endfor %}
          {% endif %}
    </p>

{% if post.thumbnail %}

</div>

  <div class="col-sm-3">
    <img class="card-img" src="{{ post.thumbnail | relative_url }}" style="object-fit: cover; height: 90%" alt="image">
  </div>
</div>
{% endif %}
    </li>

    {% endfor %}

  </ul>


</div>

