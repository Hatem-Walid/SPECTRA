# 🌌 Spectra — Multi-Model AI & Inference Console

[![React](https://img.shields.io/badge/React-18.x-blue?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Gemini%20AI-1.5%20Flash-orange?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-purple)](#)

**Spectra** is a state-of-the-art, multi-task AI workspace engineered with a hybrid architecture. It unifies Computer Vision, Network Intrusion Detection, and Predictive Healthcare Analytics into a single, conversation-driven interface powered by **Google Gemini** with resilient **Zero-Downtime Local Fallback**.

---

## ⚡ Core Capabilities

1. **💰 Healthcare Insurance Cost Estimation (Regression):**
   - Predicts individual annual medical charges using demographics, BMI, smoking habits, and children metrics.
2. **🛡️ Network Intrusion Detection (Classification):**
   - Evaluates network packets against all 41 features of the **NSL-KDD** benchmark to flag malicious cyberattacks (SYN Floods, Port Scans, DoS) in real-time.
3. **🥬 Plant Leaf Disease Diagnosis (Computer Vision):**
   - Classifies lettuce leaf pathologies using Deep Convolutional Neural Networks with instant top-3 confidence ranking.
4. **🧠 Adaptive Conversational Agent (Gemini + Local Memory):**
   - Conversational parameters extraction that persists memory across turns, gracefully falling back to a deterministic regex parser during network outages.

---

## 🏗️ Architecture
[ User Prompt / Image / CSV ]
│
▼
[ React (Vite) Frontend ] ──(Gemini 1.5 Flash API / Local Fallback Engine)
│
▼ REST (Port 8000)
[ FastAPI Backend ]
├── /health --> System Health Check
├── /predict/regression --> Healthcare Pipeline
├── /predict/classification--> Random Forest (41-feature NSL-KDD)
└── /predict/image --> Deep CNN Image Classifier
---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd Backend
python -m venv .venv
# Activate venv (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

2. Frontend Setup
code
Bash
npm install
npm run dev