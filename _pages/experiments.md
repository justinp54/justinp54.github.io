---
layout: page
permalink: /experiments/
title: Experiments
description: Small things I built over a weekend. Each one runs in the browser, right on its page.
nav: true
nav_order: 3
---

{% assign experiments = site.experiments | sort: "date" | reverse %}

{% if experiments.size == 0 %}

Nothing here yet.

{% else %}

<ul class="experiment-list">
  {% for experiment in experiments %}
  <li>
    <a href="{{ experiment.url | relative_url }}">
      <span class="name">{{ experiment.title }}</span>
      <span class="summary">{{ experiment.description }}</span>
      <span class="meta mono">
        {{ experiment.date | date: "%Y.%m" }}
        {% if experiment.built_with %}&middot; {{ experiment.built_with }}{% endif %}
      </span>
    </a>
  </li>
  {% endfor %}
</ul>

{% endif %}
