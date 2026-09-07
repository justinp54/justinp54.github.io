---
layout: page
title: Photo Booth
description: A four-cut photo booth where the effect is a shader, not a filter API.
date: 2026-09-08
built_with: WebGL
---

<div class="experiment" markdown="1">

네 컷을 찍어 한 장으로 이어 붙입니다. 필름, 그림판, 비디오 같은 효과는 조각 셰이더로 직접 쓴 것이라 미리보기에 실시간으로 걸립니다.

**영상은 이 페이지 밖으로 나가지 않습니다.** 카메라 화면을 받아 그리는 일부터 사진을 이어 붙이는 일까지 전부 브라우저 안에서 끝나고, 서버로 아무것도 보내지 않습니다. 그래서 인터넷이 끊겨도 동작합니다.

<div class="booth" data-booth>
  <div class="booth-stage" data-booth-stage>
    <video data-booth-video playsinline muted></video>
    <canvas data-booth-canvas></canvas>
    <div class="booth-count" data-booth-count aria-hidden="true"></div>
    <div class="booth-flash" data-booth-flash aria-hidden="true"></div>
  </div>

  <div class="booth-controls">
    <div class="booth-effects" data-booth-effects role="group" aria-label="효과 고르기"></div>
  </div>

  <div class="booth-controls">
    <button type="button" class="booth-action" data-booth-start>카메라 켜기</button>
    <button type="button" class="booth-action" data-booth-shoot hidden>촬영</button>
  </div>

  <p class="booth-status" data-booth-status role="status">카메라를 켜면 미리보기가 나옵니다.</p>
  <div class="booth-result" data-booth-result></div>
</div>

## 어떻게 만들었나

효과를 생성 모델로 만들지 않았습니다. 이유가 셋입니다.

**부스는 즉시 반응해야 합니다.** 사진을 보내고 몇 초를 기다리면 표정을 잡는 재미가 사라집니다. 셰이더는 한 장에 몇 밀리초라 미리보기에 그대로 걸립니다.

**남의 얼굴을 밖으로 보내지 않아야 합니다.** 행사에서 여러 사람이 쓰는 물건인데 얼굴이 외부 서버로 나가면 곤란합니다.

**옛날 감성은 원래 고전적인 방법으로 만들어집니다.** 필름 느낌은 밝은 부분을 따뜻하게 밀고 입자를 얹고 가장자리를 눌러서 나오고, 그림판 느낌은 색 수를 줄이고 디더링을 걸어서 나옵니다. 생성 모델이 필요한 일이 아닙니다.

효과를 더 넣으려면 `assets/js/photo-booth.js`의 `EFFECTS` 배열에 조각 셰이더를 하나 추가하면 됩니다. 버튼은 배열을 보고 자동으로 만들어집니다.

</div>

<script src="{{ '/assets/js/photo-booth.js' | relative_url | bust_file_cache }}"></script>
