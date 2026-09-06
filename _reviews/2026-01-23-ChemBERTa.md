---
layout: post
title: "[논문리뷰] ChemBERTa: Large-Scale Self-Supervised Pretraining for Molecular Property Prediction"
date: 2026-01-23
description: "ChemBERTa; molecular property prediction을 위한 scalable한 self-supervised pretraining 방법론 제안"
tags: [molecular-property-prediction, transformer, self-supervised-learning]
toc:
  sidebar: left
---

{% include paper-info.liquid
  conference="arXiv 2020 | Submitted to NeurIPS 2020 ML for Molecules Workshop"
  authors="Seyone Chithrananda, Gabriel Grand, Bharath Ramsundar"
  institution="University of Toronto | Reverie Labs | DeepChem"
  paper_url="https://arxiv.org/abs/2010.09885"
  date="23 Oct 2020"
%}

# Introduction

본 논문에서는 BERT-style 구조에 기반한 **ChemBERTa**라는 대규모 self-supervised pretraining 방법론을 제안한다.

화학적 분자 물성 예측(molecular property prediction) 분야에서는 접근 방법으로써 GNN, chemical fingerprints가 가장 널리 사용되었다.해당 방법들은 **강력한 inductive bias**에 기반해 벤치마크에서 높은 성능을 보여주어 왔으나 이러한 접근법들은 대규모 unsupervised 데이터를 활용하는 데 한계를 지닌다. 이로 인해 **data scarcity**는 molecular property prediction 분야에서 지속적인 문제로 남아있으며, 높은 scalability를 지니는 접근 방법의 필요성을 시사한다.

최근 transformer 모델이 NLP, CV 분야에서 뛰어난 성능을 보여주고 있으며, de-facto 접근 법으로 자리잡았다. 이런 NLP에서의 성공 사례를 바탕으로 transformer 모델을 화학 domain으로 확장하는 것을 떠올려볼 수 있다. 따라서 대규모 SMILES corpus에 기반해 BERT-style로 사전학습된 ChemBERTa 모델을 제안하며, 이를 통해 molecular property prediction task에서 **transformer 모델의 역할**에 관해 고찰해보고자 한다.

# Related Work

화학 분야에서는 SMILES 표현법이 오랜 기간 사용되어 왔고, 최근 transformer 모델을 SMILES에 적용하고자 하는 연구가 활발히 진행되고 있다. 그러나 기존 연구들은 pretraining 데이터 셋이 상대적으로 작았거나, pretraining dataset및 task에 대한 체계적인 분석이 부족했다.
따라서 본 논문에서는 ChemBERTa를 대규모 SMILES 데이터셋 하에서 학습시키고, property prediction task에서의 성능을 체계적으로 분석한다.

# Methodology

ChemBERTa모델은 RoBERTa 아키텍처를
