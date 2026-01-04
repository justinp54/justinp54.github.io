---
layout: post
title: "[논문리뷰] Denoising Diffusion Probabilistic Models (DDPM)"
date: 2024-12-20
description: "DDPM 논문을 공부하면서 정리한 annotated reading note입니다."
categories: [paper-review]
tags: [machine-learning, deep-learning, generative-models, diffusion-models, review]
---

<div class="paper-info-block">
<p><strong>NeurIPS 2020.</strong></p>
<p><strong>Jonathan Ho, Ajay Jain, Pieter Abbeel</strong></p>
<p><strong>UC Berkeley</strong></p>
<p><a href="https://arxiv.org/abs/2006.11239">[Paper]</a> <a href="https://github.com/hojonathanho/diffusion">[Github]</a></p>
<p><strong>19 Jun 2020</strong></p>
</div>

# Introduction

Denoising Diffusion Probabilistic Models (DDPM)는 최근 생성 모델 분야에서 혁신적인 성과를 보여준 논문입니다. 이 논문은 **확률적 생성 모델**의 새로운 접근 방식을 제시하며, 고품질 이미지 생성에서 뛰어난 성능을 달성했습니다.

DDPM의 핵심 아이디어는 간단합니다: **순수한 노이즈에서 시작하여 점진적으로 노이즈를 제거하여 데이터를 생성**하는 것입니다. 이는 기존의 GAN이나 VAE와는 완전히 다른 접근 방식입니다.

## Key Contributions

이 논문의 주요 기여는 다음과 같습니다:

# Notation

논문에서 사용하는 주요 기호와 변수:

- $$x_0$$: 원본 데이터 (clean image)
- $$x_t$$: 시간 단계 $$t$$에서의 데이터 ($$t = 1, 2, \ldots, T$$)
- $$T$$: Forward process의 총 시간 단계 수 (일반적으로 1000)
- $$\beta_t$$: 시간 단계 $$t$$에서의 노이즈 스케줄 (noise schedule)
- $$\alpha_t = 1 - \beta_t$$: 노이즈를 제거하는 비율
- $$\bar{\alpha}_t = \prod_{s=1}^t \alpha_s$$: 누적 곱
- $$\epsilon$$: 가우시안 노이즈 $$\epsilon \sim \mathcal{N}(0, I)$$
- $$\epsilon_\theta(x_t, t)$$: 신경망이 예측하는 노이즈
- $$q(\cdot)$$: Forward process의 분포
- $$p_\theta(\cdot)$$: Reverse process의 파라미터화된 분포

## Methodology

---

# Forward Diffusion Process

Forward process는 데이터 $$x_0$$에 점진적으로 가우시안 노이즈를 추가하여, 최종적으로 순수한 노이즈 $$x_T \sim \mathcal{N}(0, I)$$로 만드는 과정입니다.

## 정의

각 시간 단계에서의 전이 분포는 다음과 같이 정의됩니다:

$$q(x_t | x_{t-1}) = \mathcal{N}(x_t; \sqrt{1-\beta_t} x_{t-1}, \beta_t I)$$

여기서 $$\beta_t$$는 각 시간 단계에서 추가되는 노이즈의 양을 결정하는 스케줄입니다.

## 중요한 성질: 임의의 시간 단계로 직접 점프

논문의 핵심은, 이 과정을 반복하지 않고도 임의의 시간 단계 $$t$$에서의 샘플을 직접 계산할 수 있다는 것입니다:

$$q(x_t | x_0) = \mathcal{N}(x_t; \sqrt{\bar{\alpha}_t} x_0, (1-\bar{\alpha}_t) I)$$

여기서 $$\bar{\alpha}_t = \prod_{s=1}^t (1-\beta_s)$$입니다.

### Reverse Denoising Process

**다음 섹션에서의 사용**: 이 수식은 Training objective에서 $$x_t$$를 샘플링할 때 사용됩니다. $$x_t = \sqrt{\bar{\alpha}_t} x_0 + \sqrt{1-\bar{\alpha}_t} \epsilon$$ 형태로 직접 계산됩니다.

---

# Reverse Denoising Process

Reverse process는 노이즈 $$x_T \sim \mathcal{N}(0, I)$$에서 시작하여, 점진적으로 노이즈를 제거하여 원본 데이터 $$x_0$$를 복원하는 과정입니다.

## 정의

Reverse process는 다음의 파라미터화된 분포로 근사됩니다:

$$p_\theta(x_{t-1} | x_t) = \mathcal{N}(x_{t-1}; \mu_\theta(x_t, t), \Sigma_\theta(x_t, t))$$

여기서 $$\mu_\theta$$와 $$\Sigma_\theta$$는 신경망으로 학습되는 파라미터입니다.

**읽기 포인트**: Forward process는 고정된 분포이지만, Reverse process는 학습 가능한 파라미터 $$\theta$$를 가집니다. 신경망은 주어진 $$x_t$$와 시간 단계 $$t$$를 입력받아, 이전 단계의 데이터 $$x_{t-1}$$의 평균과 분산을 예측합니다.

**다음 섹션에서의 사용**: Training objective에서 $$\mu_\theta$$를 직접 학습하는 대신, 노이즈 $$\epsilon$$을 예측하는 방식으로 단순화됩니다.

---

# Training Objective

학습 목표는 각 시간 단계 $$t$$에서 노이즈 $$\epsilon$$을 예측하는 것입니다.

## Loss Function

$$L = \mathbb{E}_{t, x_0, \epsilon} \left[ \| \epsilon - \epsilon_\theta(x_t, t) \|^2 \right]$$

여기서:
- $$t$$는 $$\{1, 2, \ldots, T\}$$에서 균등하게 샘플링
- $$\epsilon \sim \mathcal{N}(0, I)$$는 랜덤 노이즈
- $$x_t = \sqrt{\bar{\alpha}_t} x_0 + \sqrt{1-\bar{\alpha}_t} \epsilon$$는 Forward process 수식을 사용하여 계산

**읽기 포인트**: 이 loss가 등장하는 이유는, 원래의 reverse process 분포 $$p_\theta(x_{t-1} | x_t)$$를 직접 학습하는 것보다 노이즈를 예측하는 것이 더 단순하고 안정적이기 때문입니다. 논문에서는 이 loss가 실제로 reverse process의 log-likelihood를 최대화하는 것과 관련이 있음을 보여줍니다.

## Experimental Results

---

# Training Algorithm

<figure class="paper-figure">
  <img src="/assets/img/papers/ddpm/algorithm1-training.png" alt="DDPM Training Algorithm">
  <figcaption>
    <strong>Algorithm 1: Training</strong>
  </figcaption>
</figure>

## How to Read This Algorithm

다음 표는 다양한 생성 모델과의 성능 비교를 보여줍니다:

- **Line 1**: 데이터셋에서 샘플 $$x_0$$를 선택합니다. 이것이 학습할 원본 이미지입니다.
- **Line 2**: 시간 단계 $$t$$를 $$\{1, 2, \ldots, T\}$$에서 균등하게 랜덤 선택합니다. Forward process의 임의의 단계에서 학습할 수 있게 해줍니다.
- **Line 3**: 노이즈 $$\epsilon \sim \mathcal{N}(0, I)$$를 샘플링합니다. 이 노이즈를 신경망이 예측해야 하는 목표입니다.
- **Line 4**: Forward process 수식 $$q(x_t | x_0)$$를 사용하여 $$x_t$$를 직접 계산합니다. 반복적인 과정 없이 한 번에 계산할 수 있는 것이 핵심입니다.
- **Line 5**: 신경망 $$\epsilon_\theta$$가 $$x_t$$와 $$t$$를 입력받아 노이즈를 예측합니다. 이는 Training objective에서 정의한 loss의 예측 부분입니다.
- **Line 6**: 예측된 노이즈 $$\epsilon_\theta(x_t, t)$$와 실제 노이즈 $$\epsilon$$ 간의 MSE loss를 계산합니다. 이것이 논문의 수식 (14)에 해당합니다.
- **Line 7**: Loss를 역전파하여 신경망 파라미터 $$\theta$$를 업데이트합니다.

**논문에서의 위치**: 논문의 Section 3, Algorithm 1에 해당합니다.

---

# Sampling Algorithm

<figure class="paper-figure">
  <img src="/assets/img/papers/ddpm/algorithm2-sampling.png" alt="DDPM Sampling Algorithm">
  <figcaption>
    <strong>Algorithm 2: Sampling</strong>
  </figcaption>
</figure>

## How to Read This Algorithm

이 알고리즘은 학습된 모델을 사용하여 새로운 샘플을 생성하는 과정입니다. Forward process를 역으로 수행합니다:

- **Line 1**: 순수한 가우시안 노이즈 $$x_T \sim \mathcal{N}(0, I)$$에서 시작합니다. Forward process의 최종 상태입니다.
- **Line 2**: $$T$$부터 1까지 역순으로 반복합니다. Reverse process를 단계적으로 수행합니다.
- **Line 3**: 만약 $$t > 1$$이면 노이즈 $$z \sim \mathcal{N}(0, I)$$를 샘플링하고, $$t = 1$$이면 $$z = 0$$입니다. 마지막 단계에서는 확률적 노이즈를 추가하지 않습니다.
- **Line 4**: 신경망이 예측한 노이즈 $$\epsilon_\theta(x_t, t)$$를 사용합니다. Training algorithm에서 학습한 모델을 사용합니다.
- **Line 5**: Reverse process의 평균 $$\mu_\theta(x_t, t)$$를 계산합니다. 논문의 수식 (11)에 해당하며, 예측된 노이즈를 사용하여 계산됩니다.
- **Line 6**: 다음 단계의 샘플 $$x_{t-1}$$을 계산합니다. 평균 $$\mu_\theta(x_t, t)$$에 노이즈를 추가하여 샘플링합니다. 이것이 Reverse process의 샘플링 단계입니다.

**논문에서의 위치**: 논문의 Section 3.2, Algorithm 2에 해당합니다.

---

# Experimental Setup

논문에서는 다음과 같은 데이터셋에서 실험을 수행했습니다:

- **CIFAR-10**: 32×32 자연 이미지, 10개 클래스
- **CelebA-HQ**: 고해상도 얼굴 이미지 (256×256)
- **LSUN**: 대규모 자연 장면 이미지 (256×256, 512×512)

## Architecture Details

<figure class="paper-figure">
  <img src="/assets/img/papers/ddpm/architecture-table.png" alt="DDPM Architecture Table">
  <figcaption>
    <strong>Table: Model Architecture</strong>
  </figcaption>
</figure>

### What This Shows

이 표는 DDPM에서 사용하는 U-Net 아키텍처의 세부 사항을 보여줍니다. 주요 구성 요소:

- **Time embedding**: 시간 단계 $$t$$를 sinusoidal embedding으로 변환하여 네트워크에 주입합니다. 이는 네트워크가 현재 어느 단계에 있는지 알 수 있게 해줍니다.
- **Attention mechanism**: Self-attention을 사용하여 long-range dependencies를 모델링합니다.
- **Residual connections**: 깊은 네트워크에서의 gradient flow를 개선합니다.

**논문에서의 위치**: 논문의 Appendix B에 상세한 아키텍처 정보가 있습니다.

---

# Experimental Results

## Performance Comparison

<figure class="paper-figure">
  <img src="/assets/img/papers/ddpm/results-table.png" alt="DDPM Experimental Results Table">
  <figcaption>
    <strong>Table: Quantitative Results</strong>
  </figcaption>
</figure>

### What This Shows

이 표는 DDPM과 다른 생성 모델들(GAN, VAE, Flow-based)의 성능을 비교합니다:

- **FID (Fréchet Inception Distance)**: 낮을수록 좋음. 생성된 이미지와 실제 이미지의 분포 간 거리를 측정합니다.
- **IS (Inception Score)**: 높을수록 좋음. 생성된 이미지의 품질과 다양성을 측정합니다.

**논문에서의 위치**: 논문의 Section 4에서 제시되는 주요 실험 결과입니다.

## Generated Samples

<figure class="paper-figure">
  <img src="/assets/img/papers/ddpm/generated-samples.png" alt="DDPM Generated Samples">
  <figcaption>
    <strong>Figure: Generated Samples</strong>
  </figcaption>
</figure>

### What This Shows

이 그림은 DDPM으로 생성된 샘플들을 보여줍니다. 논문에서는 다양한 데이터셋에서 고품질 이미지를 생성할 수 있음을 보여줍니다.

**논문에서의 위치**: 논문의 Section 4에 포함된 생성 샘플들입니다.

---

# Ablation Studies

논문에서는 여러 구성 요소의 중요성을 검증하기 위해 ablation study를 수행했습니다.

## Noise Schedule Comparison

<figure class="paper-figure">
  <img src="/assets/img/papers/ddpm/noise-schedule-comparison.png" alt="Noise Schedule Comparison">
  <figcaption>
    <strong>Figure: Linear vs Cosine Schedule</strong>
  </figcaption>
</figure>

### What This Shows

이 그림은 linear schedule과 cosine schedule의 비교 결과를 보여줍니다:

- **Linear schedule**: $$\beta_t = \beta_1 + \frac{t-1}{T-1}(\beta_T - \beta_1)$$
- **Cosine schedule**: $$\bar{\alpha}_t = \frac{\cos((t/T + s)/(1+s) \cdot \pi/2)}{\cos(s \cdot \pi/2)}$$

논문에서는 cosine schedule이 더 나은 성능을 보인다고 보고합니다.

**논문에서의 위치**: 논문의 Section 4.2에서 noise schedule에 대한 실험 결과입니다.

---

# References

1. **Ho, J., Jain, A., & Abbeel, P.** (2020). Denoising diffusion probabilistic models. *Advances in Neural Information Processing Systems*, 33.

---

**Note**: 이 노트는 논문을 읽으면서 정리한 내용입니다. 더 자세한 내용은 원본 논문을 참고하시기 바랍니다.
