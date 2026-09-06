---
layout: post
title: "[논문리뷰] Denoising Diffusion Probabilistic Models (DDPM)"
date: 2024-12-20
description: "Diffusion model의 시작점. Forward/reverse process, training objective 유도까지 정리."
tags: [generative-models, diffusion-models]
toc:
  sidebar: left
---

{% include paper-info.liquid
  conference="NeurIPS 2020"
  authors="Jonathan Ho, Ajay Jain, Pieter Abbeel"
  institution="UC Berkeley"
  paper_url="https://arxiv.org/abs/2006.11239"
  github_url="https://github.com/hojonathanho/diffusion"
  date="19 Jun 2020"
%}

## TL;DR

데이터에 점진적으로 노이즈를 추가하는 forward process를 정의하고, 그 역과정(reverse process)을 신경망으로 학습하여 **순수 노이즈에서 데이터를 생성**한다. 학습 목표는 단순한 noise prediction MSE loss로 귀결되며, GAN 없이도 고품질 이미지 생성이 가능함을 보여준 논문.

---

## Notation

| 기호 | 의미 |
|------|------|
| $$x_0$$ | 원본 데이터 |
| $$x_t$$ | 시간 $$t$$에서의 noisy 데이터 |
| $$T$$ | 총 시간 단계 (논문에서는 1000) |
| $$\beta_t$$ | noise schedule |
| $$\alpha_t$$ | $$1 - \beta_t$$ |
| $$\bar{\alpha}_t$$ | $$\prod_{s=1}^t \alpha_s$$ |
| $$\epsilon$$ | $$\mathcal{N}(0, I)$$에서 샘플링한 노이즈 |
| $$\epsilon_\theta$$ | 신경망이 예측하는 노이즈 |

---

## Forward Process

데이터 $$x_0$$에 매 시간 단계마다 Gaussian noise를 추가하여, 최종적으로 $$x_T \approx \mathcal{N}(0, I)$$를 만든다.

$$q(x_t \mid x_{t-1}) = \mathcal{N}(x_t;\, \sqrt{1-\beta_t}\, x_{t-1},\; \beta_t I)$$

### 핵심: 임의의 $$t$$로 직접 점프

$$t$$번 반복하지 않고, $$x_0$$에서 바로 $$x_t$$를 계산할 수 있다:

$$q(x_t \mid x_0) = \mathcal{N}(x_t;\, \sqrt{\bar{\alpha}_t}\, x_0,\; (1-\bar{\alpha}_t) I)$$

즉, **$$x_t = \sqrt{\bar{\alpha}_t}\, x_0 + \sqrt{1-\bar{\alpha}_t}\, \epsilon$$** 으로 한 번에 계산된다.

<details>
<summary><strong>유도 과정 펼치기</strong></summary>

$$x_1 = \sqrt{\alpha_1}\, x_0 + \sqrt{1-\alpha_1}\, \epsilon_1$$

$$x_2 = \sqrt{\alpha_2}\, x_1 + \sqrt{1-\alpha_2}\, \epsilon_2$$

$$x_2$$에 $$x_1$$을 대입하면:

$$x_2 = \sqrt{\alpha_2}\left(\sqrt{\alpha_1}\, x_0 + \sqrt{1-\alpha_1}\, \epsilon_1\right) + \sqrt{1-\alpha_2}\, \epsilon_2$$

$$= \sqrt{\alpha_1 \alpha_2}\, x_0 + \sqrt{\alpha_2(1-\alpha_1)}\, \epsilon_1 + \sqrt{1-\alpha_2}\, \epsilon_2$$

독립적인 Gaussian의 합이므로 분산을 더할 수 있다:

$$\text{Var} = \alpha_2(1-\alpha_1) + (1-\alpha_2) = 1 - \alpha_1\alpha_2 = 1 - \bar{\alpha}_2$$

이를 일반화하면:

$$q(x_t \mid x_0) = \mathcal{N}(x_t;\, \sqrt{\bar{\alpha}_t}\, x_0,\; (1-\bar{\alpha}_t) I)$$

</details>

---

## Reverse Process

$$x_T \sim \mathcal{N}(0, I)$$에서 출발하여, 학습된 신경망으로 점진적으로 노이즈를 제거한다.

$$p_\theta(x_{t-1} \mid x_t) = \mathcal{N}(x_{t-1};\, \mu_\theta(x_t, t),\; \sigma_t^2 I)$$

Forward process는 분포가 고정되어 있지만, reverse process의 $$\mu_\theta$$는 신경망이 학습해야 하는 대상이다.

### Posterior $$q(x_{t-1} \mid x_t, x_0)$$

$$x_0$$를 알고 있을 때의 reverse 분포는 닫힌 형태로 계산할 수 있다:

$$q(x_{t-1} \mid x_t, x_0) = \mathcal{N}(x_{t-1};\, \tilde{\mu}_t(x_t, x_0),\; \tilde{\beta}_t I)$$

여기서:

$$\tilde{\mu}_t = \frac{\sqrt{\bar{\alpha}_{t-1}}\,\beta_t}{1-\bar{\alpha}_t} x_0 + \frac{\sqrt{\alpha_t}\,(1-\bar{\alpha}_{t-1})}{1-\bar{\alpha}_t} x_t, \quad \tilde{\beta}_t = \frac{1-\bar{\alpha}_{t-1}}{1-\bar{\alpha}_t}\beta_t$$

<details>
<summary><strong>유도 과정 펼치기</strong></summary>

Bayes' rule을 적용한다:

$$q(x_{t-1} \mid x_t, x_0) \propto q(x_t \mid x_{t-1}) \cdot q(x_{t-1} \mid x_0)$$

두 항 모두 Gaussian이므로, 지수 부분만 전개하면:

$$q(x_t \mid x_{t-1}) \propto \exp\left(-\frac{(x_t - \sqrt{\alpha_t}\,x_{t-1})^2}{2\beta_t}\right)$$

$$q(x_{t-1} \mid x_0) \propto \exp\left(-\frac{(x_{t-1} - \sqrt{\bar{\alpha}_{t-1}}\,x_0)^2}{2(1-\bar{\alpha}_{t-1})}\right)$$

지수 부분을 합치고 $$x_{t-1}$$에 대해 completing the square를 하면, 분산과 평균이 각각:

$$\tilde{\beta}_t = \left(\frac{\alpha_t}{\beta_t} + \frac{1}{1-\bar{\alpha}_{t-1}}\right)^{-1} = \frac{1-\bar{\alpha}_{t-1}}{1-\bar{\alpha}_t}\beta_t$$

$$\tilde{\mu}_t = \tilde{\beta}_t\left(\frac{\sqrt{\alpha_t}}{\beta_t}x_t + \frac{\sqrt{\bar{\alpha}_{t-1}}}{1-\bar{\alpha}_{t-1}}x_0\right)$$

정리하면 위의 결과를 얻는다.

</details>

---

## Training Objective

### Noise prediction으로의 단순화

$$x_t = \sqrt{\bar{\alpha}_t}\, x_0 + \sqrt{1-\bar{\alpha}_t}\, \epsilon$$이므로, $$x_0 = \frac{1}{\sqrt{\bar{\alpha}_t}}(x_t - \sqrt{1-\bar{\alpha}_t}\,\epsilon)$$으로 쓸 수 있다.

이를 $$\tilde{\mu}_t$$에 대입하면, 평균이 **노이즈 $$\epsilon$$의 함수**로 바뀐다:

$$\tilde{\mu}_t = \frac{1}{\sqrt{\alpha_t}}\left(x_t - \frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}}\,\epsilon\right)$$

따라서 신경망이 $$\mu$$를 직접 예측하는 대신, **노이즈 $$\epsilon$$을 예측**하도록 파라미터화하면:

$$\mu_\theta(x_t, t) = \frac{1}{\sqrt{\alpha_t}}\left(x_t - \frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}}\,\epsilon_\theta(x_t, t)\right)$$

### 최종 Loss

$$L_{\text{simple}} = \mathbb{E}_{t,\, x_0,\, \epsilon}\left[\lVert \epsilon - \epsilon_\theta(x_t, t) \rVert^2\right]$$

<details>
<summary><strong>ELBO에서 이 loss가 나오는 과정 펼치기</strong></summary>

원래의 학습 목표는 negative log-likelihood의 variational upper bound (ELBO):

$$L = \mathbb{E}_q\left[-\log \frac{p_\theta(x_{0:T})}{q(x_{1:T} \mid x_0)}\right]$$

이를 전개하면 각 시간 단계별 KL divergence의 합으로 분해된다:

$$L = L_T + \sum_{t=2}^{T} L_{t-1} + L_0$$

여기서 $$L_{t-1} = D_{KL}(q(x_{t-1} \mid x_t, x_0) \| p_\theta(x_{t-1} \mid x_t))$$

두 분포 모두 Gaussian이므로 KL divergence는 평균 차이의 제곱에 비례한다:

$$L_{t-1} \propto \lVert \tilde{\mu}_t - \mu_\theta(x_t, t) \rVert^2$$

$$\mu_\theta$$를 noise prediction으로 파라미터화하면:

$$L_{t-1} \propto \lVert \epsilon - \epsilon_\theta(x_t, t) \rVert^2$$

논문에서는 시간 단계별 가중치를 제거한 $$L_{\text{simple}}$$이 실제로 더 좋은 성능을 보임을 확인했다.

</details>

---

## Training & Sampling Algorithms

### Training (Algorithm 1)

1. 데이터셋에서 $$x_0$$ 샘플링
2. $$t \sim \text{Uniform}(\{1, \ldots, T\})$$ 랜덤 선택
3. $$\epsilon \sim \mathcal{N}(0, I)$$ 샘플링
4. $$x_t = \sqrt{\bar{\alpha}_t}\, x_0 + \sqrt{1-\bar{\alpha}_t}\, \epsilon$$ 계산
5. $$\nabla_\theta \lVert \epsilon - \epsilon_\theta(x_t, t) \rVert^2$$로 gradient step

### Sampling (Algorithm 2)

1. $$x_T \sim \mathcal{N}(0, I)$$에서 시작
2. $$t = T, T-1, \ldots, 1$$에 대해 반복:
   - $$z \sim \mathcal{N}(0, I)$$ (단, $$t=1$$이면 $$z=0$$)
   - $$x_{t-1} = \frac{1}{\sqrt{\alpha_t}}\left(x_t - \frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}}\,\epsilon_\theta(x_t, t)\right) + \sigma_t z$$

---

## Experimental Results

<!-- TODO: 논문 Table/Figure 캡처 추가 -->

- **CIFAR-10**: FID 3.17, IS 9.46 — unconditional 생성에서 당시 SOTA
- **LSUN 256×256**: 침실, 교회 등 고해상도 이미지 생성
- **Log-likelihood**: NLL 기준으로는 다른 likelihood-based 모델보다 낮지만, sample quality는 우수

### Architecture

U-Net 기반. Time embedding (sinusoidal)을 각 residual block에 주입하고, 16×16 해상도에서 self-attention 적용.

---

## Discussion

**강점:**
- 학습이 안정적 — GAN처럼 mode collapse나 학습 불안정 문제가 없음
- Loss가 단순한 MSE — 구현과 디버깅이 쉬움
- 이론적 기반(ELBO)이 탄탄하면서도 실용적 단순화가 잘 됨

**한계:**
- Sampling이 느림 — $$T=1000$$ 스텝을 순차적으로 거쳐야 함 (이후 DDIM에서 해결)
- Log-likelihood가 최적이 아님 — $$L_{\text{simple}}$$에서 가중치를 제거했기 때문
- Noise schedule($$\beta_t$$)을 수동으로 설정해야 함 (이후 Improved DDPM에서 cosine schedule 제안)

**후속 연구:**
- **DDIM**: Deterministic sampling으로 스텝 수 대폭 감소
- **Improved DDPM**: Cosine schedule, learned $$\Sigma_\theta$$로 log-likelihood 개선
- **Guided Diffusion**: Classifier guidance로 conditional 생성
