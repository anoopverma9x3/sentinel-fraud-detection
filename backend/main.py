from pathlib import Path
import json
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "fraud_model.joblib"
THRESHOLD_PATH = ARTIFACT_DIR / "threshold.json"
SAMPLES_PATH = ARTIFACT_DIR / "test_samples.csv"

FEATURES = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"]

app = FastAPI(
    title="Credit Card Fraud Detection API",
    description="Educational API for a Random Forest trained on an anonymized public dataset.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://sentinel-tau-smoky.vercel.app"],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None
_threshold = 0.4
_samples = None


def load_artifacts():
    global _model, _threshold, _samples
    missing = [str(p) for p in (MODEL_PATH, THRESHOLD_PATH, SAMPLES_PATH) if not p.exists()]
    if missing:
        raise RuntimeError(
            "Missing model artifacts: " + ", ".join(missing) +
            ". Follow the README to export them from Colab into backend/artifacts/."
        )
    _model = joblib.load(MODEL_PATH)
    with open(THRESHOLD_PATH, "r", encoding="utf-8") as f:
        _threshold = float(json.load(f).get("threshold", 0.4))
    _samples = pd.read_csv(SAMPLES_PATH)

    required = set(FEATURES + ["Class", "sample_id"])
    absent = required - set(_samples.columns)
    if absent:
        raise RuntimeError(f"test_samples.csv is missing columns: {sorted(absent)}")
    if not set(FEATURES).issubset(set(_samples.columns)):
        raise RuntimeError("Sample file feature columns do not match the expected schema.")


@app.on_event("startup")
def startup_event():
    try:
        load_artifacts()
    except Exception as exc:
        # App starts so /health can explain the missing files; prediction endpoints return a useful error.
        print(f"[artifact startup warning] {exc}")


def ensure_ready():
    if _model is None or _samples is None:
        raise HTTPException(
            status_code=503,
            detail="Model artifacts are not loaded. Put fraud_model.joblib, threshold.json, and test_samples.csv in backend/artifacts/ and restart the API.",
        )


class ManualTransaction(BaseModel):
    Time: float = Field(ge=0, description="Seconds elapsed since the first transaction in the dataset")
    V1: float
    V2: float
    V3: float
    V4: float
    V5: float
    V6: float
    V7: float
    V8: float
    V9: float
    V10: float
    V11: float
    V12: float
    V13: float
    V14: float
    V15: float
    V16: float
    V17: float
    V18: float
    V19: float
    V20: float
    V21: float
    V22: float
    V23: float
    V24: float
    V25: float
    V26: float
    V27: float
    V28: float
    Amount: float = Field(ge=0)


def predict_row(row: pd.DataFrame):
    ensure_ready()
    row = row[FEATURES].astype(float)
    score = float(_model.predict_proba(row)[0, 1])
    predicted_class = int(score >= _threshold)
    return {
        "predicted_class": predicted_class,
        "label": "Potential fraud" if predicted_class == 1 else "Likely legitimate",
        "score": round(score, 6),
        "threshold": _threshold,
        "note": "Model score, not a guaranteed calibrated real-world probability.",
    }


@app.get("/")
def root():
    return {"message": "Credit Card Fraud Detection API", "docs": "/docs"}


@app.get("/health")
def health():
    ready = _model is not None and _samples is not None
    return {
        "status": "ready" if ready else "artifacts_missing",
        "model_loaded": _model is not None,
        "samples_loaded": _samples is not None,
        "threshold": _threshold,
    }


@app.get("/api/summary")
def summary():
    ensure_ready()
    return {
        "sample_count": int(len(_samples)),
        "threshold": _threshold,
        "test_sample_fraud_count": int((_samples["Class"] == 1).sum()),
        "test_sample_legitimate_count": int((_samples["Class"] == 0).sum()),
        "features": FEATURES,
    }


@app.get("/api/samples")
def list_samples():
    ensure_ready()
    # Do not reveal Class/actual label until the user requests a prediction.
    rows = []
    for _, r in _samples.iterrows():
        rows.append({
            "sample_id": str(r["sample_id"]),
            "amount": float(r["Amount"]),
            "time": float(r["Time"]),
        })
    return {"samples": rows}


@app.post("/api/predict/sample/{sample_id}")
def predict_sample(sample_id: str):
    ensure_ready()
    match = _samples[_samples["sample_id"].astype(str) == sample_id]
    if match.empty:
        raise HTTPException(status_code=404, detail="Sample transaction not found.")
    row = match.iloc[[0]]
    result = predict_row(row)
    result["sample_id"] = sample_id
    result["actual_class"] = int(row.iloc[0]["Class"])
    result["actual_label"] = (
        "Fraud" if result["actual_class"] == 1 else "Legitimate"
    )
    result["correct"] = result["predicted_class"] == result["actual_class"]
    return result


@app.post("/api/predict/manual")
def predict_manual(payload: ManualTransaction):
    ensure_ready()
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    row = pd.DataFrame([{feature: data[feature] for feature in FEATURES}])
    return predict_row(row)
