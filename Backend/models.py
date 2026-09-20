"""
Model loading + prediction functions, isolated from the API layer.
Strict Error Handling — No Dummy/Static Fallbacks.
"""

import io
import os
import joblib
import numpy as np
import pandas as pd
from PIL import Image
from fastapi import HTTPException

SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")

INSURANCE_PREPROCESSOR_PATH = os.path.join(SAVED_MODELS_DIR, "insurance_preprocessor.joblib")
INSURANCE_MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "insurance_nn.keras")
INSURANCE_FALLBACK_JOBLIB = os.path.join(SAVED_MODELS_DIR, "insurance_model.joblib")

INTRUSION_MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "best_rf_pipeline.joblib")
LEAF_MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "leaf_model.keras")

_LEAF_CLASSES = [
    "Bacterial Spot",
    "Downy Mildew",
    "Healthy",
    "Powdery Mildew",
    "Septoria Leaf Spot",
]

_INSURANCE_FEATURE_ORDER = ["age", "sex", "bmi", "children", "smoker", "region"]

_ALL_INTRUSION_COLUMNS = [
    "duration", "protocol_type", "service", "flag", "src_bytes",
    "dst_bytes", "land", "wrong_fragment", "urgent", "hot",
    "num_failed_logins", "logged_in", "num_compromised", "root_shell",
    "su_attempted", "num_root", "num_file_creations", "num_shells",
    "num_access_files", "num_outbound_cmds", "is_host_login",
    "is_guest_login", "count", "srv_count", "serror_rate",
    "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate",
    "diff_srv_rate", "srv_diff_host_rate", "dst_host_count",
    "dst_host_srv_count", "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate", "dst_host_srv_serror_rate",
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate"
]

_INTRUSION_DEFAULTS = {
    "protocol_type": "tcp",
    "service": "http",
    "flag": "SF",
    "same_srv_rate": 1.0,
    "dst_host_same_srv_rate": 1.0,
}

_insurance_preprocessor = None
_insurance_model = None
_intrusion_model = None
_leaf_model = None


# ---------------------------------------------------------------------------
# Load functions (Strict Check)
# ---------------------------------------------------------------------------

def load_insurance_model():
    global _insurance_preprocessor, _insurance_model
    if _insurance_model is None:
        if os.path.exists(INSURANCE_MODEL_PATH):
            try:
                from tensorflow import keras
                _insurance_model = keras.models.load_model(INSURANCE_MODEL_PATH)
                if os.path.exists(INSURANCE_PREPROCESSOR_PATH):
                    _insurance_preprocessor = joblib.load(INSURANCE_PREPROCESSOR_PATH)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to load Keras insurance model: {str(e)}")

        elif os.path.exists(INSURANCE_FALLBACK_JOBLIB):
            try:
                _insurance_model = joblib.load(INSURANCE_FALLBACK_JOBLIB)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to load joblib insurance model: {str(e)}")
        else:
            raise HTTPException(
                status_code=503,
                detail="Insurance model file not found. Please place 'insurance_nn.keras' or 'insurance_model.joblib' in saved_models/"
            )

    return _insurance_preprocessor, _insurance_model


def load_intrusion_model():
    global _intrusion_model
    if _intrusion_model is None:
        if not os.path.exists(INTRUSION_MODEL_PATH):
            raise HTTPException(
                status_code=503,
                detail=f"Intrusion model missing! Please place 'best_rf_pipeline.joblib' inside 'saved_models/' folder."
            )
        try:
            _intrusion_model = joblib.load(INTRUSION_MODEL_PATH)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading intrusion model file: {str(e)}")

    return _intrusion_model


def load_leaf_model():
    global _leaf_model
    if _leaf_model is None:
        if not os.path.exists(LEAF_MODEL_PATH):
            # إيقاف التلييس: رمي خطأ صريح لو الموديل مش موجود
            raise HTTPException(
                status_code=503,
                detail="Leaf disease model is not available! File 'leaf_model.h5' was not found in 'saved_models/' directory."
            )
        try:
            from tensorflow import keras
            _leaf_model = keras.models.load_model(LEAF_MODEL_PATH)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load leaf model with TensorFlow: {str(e)}")

    return _leaf_model


# ---------------------------------------------------------------------------
# Predict functions
# ---------------------------------------------------------------------------

def predict_insurance(payload) -> float:
    preprocessor, model = load_insurance_model()

    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict() if hasattr(payload, "dict") else dict(payload)

    row = pd.DataFrame([{
        "age": data.get("age"),
        "sex": str(data.get("sex", "")).lower(),
        "bmi": float(data.get("bmi", 0)),
        "children": int(data.get("children", 0)),
        "smoker": str(data.get("smoker", "")).lower(),
        "region": str(data.get("region", "")).lower(),
    }])[_INSURANCE_FEATURE_ORDER]

    try:
        if preprocessor is not None:
            X = preprocessor.transform(row)
            prediction = model.predict(X, verbose=0)
        else:
            prediction = model.predict(row)
        return float(np.ravel(prediction)[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Insurance calculation error: {str(e)}")


def predict_intrusion(payload) -> tuple[str, float]:
    model = load_intrusion_model()

    if hasattr(payload, "model_dump"):
        data = payload.model_dump()
    elif hasattr(payload, "dict"):
        data = payload.dict()
    elif isinstance(payload, dict):
        data = payload
    else:
        data = getattr(payload, "__dict__", {})

    row_dict = {}
    for col in _ALL_INTRUSION_COLUMNS:
        default_val = _INTRUSION_DEFAULTS.get(col, 0)
        row_dict[col] = data.get(col, default_val)

    row = pd.DataFrame([row_dict])[_ALL_INTRUSION_COLUMNS]

    try:
        preds = model.predict(row)
        pred_class = int(preds[0])

        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(row)[0]
            confidence = float(probs[pred_class])
        else:
            confidence = 1.0

        label = "normal" if pred_class == 0 else "anomaly"
        return label, confidence
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model prediction error: {str(e)}")


def predict_intrusion_from_csv(file_bytes: bytes) -> dict:
    model = load_intrusion_model()

    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid CSV format.")

    missing_cols = [col for col in _ALL_INTRUSION_COLUMNS if col not in df.columns]
    if missing_cols:
        cols_preview = ", ".join(missing_cols[:4])
        raise HTTPException(
            status_code=422,
            detail=f"CSV file is missing required columns: {cols_preview} (and {len(missing_cols)-4} more)."
        )

    df_ordered = df[_ALL_INTRUSION_COLUMNS]

    try:
        predictions = model.predict(df_ordered)
        results = ["normal" if str(p) in ["0", "normal", "Normal"] else "anomaly" for p in predictions]
        confidences = []
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(df_ordered)
            confidences = [float(p[int(pred)]) for p, pred in zip(probs, predictions)]

        return {
            "total_records": len(results),
            "predictions": results,
            "confidences": confidences if confidences else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV prediction failed: {str(e)}")


def predict_leaf(image_bytes: bytes) -> tuple[str, float, list[dict]]:
    """فحص أمراض أوراق النبات — لا تلييس: يرمي خطأ صريح لو الموديل غير موجود"""
    model = load_leaf_model()

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Corrupted or invalid image file. Please upload a valid image.")

    try:
        target_size = model.input_shape[1:3] if hasattr(model, "input_shape") and model.input_shape[1] else (224, 224)
        image = image.resize(target_size)
        array = np.asarray(image, dtype=np.float32) / 255.0
        batch = np.expand_dims(array, axis=0)

        probs = model.predict(batch, verbose=0)[0]
        ranked = sorted(zip(_LEAF_CLASSES, probs), key=lambda pair: pair[1], reverse=True)

        top_label, top_confidence = ranked[0]
        top_3 = [{"label": label, "confidence": float(conf)} for label, conf in ranked[:3]]

        return str(top_label), float(top_confidence), top_3
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neural network prediction failed: {str(e)}")