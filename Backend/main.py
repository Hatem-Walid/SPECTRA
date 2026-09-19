"""
FastAPI app — 3 model endpoints + CSV upload + health check + Gemini chat extraction.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# تحديد المسار الدقيق لملف .env بجانب ملف main.py مباشرة
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from gemini_client import run_extraction
from schemas import (
    ExtractRequest,
    ExtractResponse,
    InsuranceInput,
    InsuranceOutput,
    IntrusionInput,
    IntrusionOutput,
    LeafDiseaseOutput,
)

from models import (
    predict_insurance,
    predict_intrusion,
    predict_intrusion_from_csv,
    predict_leaf,
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# تصريح المرور الشامل لجميع الروابط ورابط فيرسل
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://spectra-eta-ashy.vercel.app",
        "http://localhost:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict/regression", response_model=InsuranceOutput)
def predict_regression(payload: InsuranceInput):
    try:
        charges = predict_insurance(payload)
        return InsuranceOutput(predicted_charges=charges)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/classification", response_model=IntrusionOutput)
def predict_classification(payload: IntrusionInput):
    try:
        label, confidence = predict_intrusion(payload)
        return IntrusionOutput(prediction=label, confidence=confidence)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/classification/file")
async def predict_classification_file(file: UploadFile = File(...)):
    """نقطة نهاية لرفع ملف CSV بالكامل وفحص الأعمدة"""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="يرجى رفع ملف بصيغة CSV فقط.")

    file_bytes = await file.read()
    try:
        results = predict_intrusion_from_csv(file_bytes)
        return results
    except ValueError as val_err:
        # هنا يتم إرجاع تفاصيل الأعمدة الناقصة للمستخدم كخطأ 400 مفهوم
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء معالجة الملف: {exc}")


@app.post("/predict/image", response_model=LeafDiseaseOutput)
async def predict_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        label, confidence, top_3 = predict_leaf(image_bytes)
        return LeafDiseaseOutput(prediction=label, confidence=confidence, top_3=top_3)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest):
    try:
        result = run_extraction(
            req.model_type,
            [turn.model_dump() for turn in req.conversation],
            req.memory,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {exc}")

    return ExtractResponse(**result)