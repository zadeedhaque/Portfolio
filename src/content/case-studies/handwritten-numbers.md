---
title: "Handwritten Number Recognition System"
---

*University group project · COS30018 Intelligent Systems · Swinburne University of Technology · 2026*

I built a machine learning pipeline that recognises handwritten numbers, from single digits to multi-digit numbers like “120”, in real handwriting images.

- **98.9%** CNN on MNIST  
    (SVM: 95.9%)
- **64.6% → 89.35%** Exact-match accuracy on held-out real handwriting
- **2,000** Test images

## How it works

1.  **Segmentation**OpenCV thresholding and connected-component analysis split each image into single digits.
2.  **Classification**A CNN I designed and trained from scratch recognises each digit.
3.  **Joining**The digit predictions are combined from left to right into the final number.

## What I did

- Built and compared a CNN and an SVM on MNIST: 98.9% vs 95.9% accuracy.
- Found that the model dropped to 64.6% on real handwriting, and traced it to domain shift (the real handwriting looks different from the training data) and segmentation errors.
- Fine-tuned the CNN on the target dataset and tuned the segmentation settings with a 24-combination grid search.
- Found that the labels had lost their leading zeros, and corrected the evaluation method to match.
- Improved accuracy step by step, from 64.6% to 89.35%, on held-out test images.
- Built and deployed a <a href="https://huggingface.co/spaces/Zadeed/handwritten-number-recogniser" target="_blank" rel="noopener noreferrer">Gradio web app on Hugging Face Spaces</a> where users draw or upload a number and see each digit's prediction and confidence.

## Try it live

## Key skills

Deep learning · Computer vision · Error analysis · Model evaluation · Data cleaning · Experiment design

## Tech stack

Python · TensorFlow/Keras · OpenCV · scikit-learn · NumPy · pandas · Matplotlib · Gradio · Google Colab · GitHub
