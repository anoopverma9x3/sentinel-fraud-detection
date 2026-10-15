# Credit Card Fraud Detection — React + FastAPI

This is a starter project for your trained Random Forest model. It does **not** contain a fake model or hardcoded predictions. You must export your actual model and held-out test samples from Colab, then place them in `backend/artifacts/`.

## Architecture
- React + Vite + Tailwind CSS frontend
- FastAPI backend
- Joblib model loaded from Colab
- Real sample transactions selected from your held-out test set
- Decision threshold: `0.4`

## 1. Export your artifacts from Google Colab

Run this after the cells that define `rf_tune`, `X_test`, and `y_test` have run. `rf_tune` is the Random Forest you trained on `X_fit, y_fit`; the test set remains held out.

```python
import os, json, joblib
import pandas as pd
from google.colab import drive

drive.mount("/content/drive")

artifact_dir = "/content/drive/MyDrive/CreditCardFraud/react_artifacts"
os.makedirs(artifact_dir, exist_ok=True)

joblib.dump(rf_tune, f"{artifact_dir}/fraud_model.joblib")

with open(f"{artifact_dir}/threshold.json", "w") as f:
    json.dump({"threshold": 0.4}, f)

# Select genuine records from the untouched test set.
test_df = X_test.copy()
test_df["Class"] = y_test.values
fraud_samples = test_df[test_df["Class"] == 1].sample(
    n=min(15, int((test_df["Class"] == 1).sum())),
    random_state=42
)
normal_samples = test_df[test_df["Class"] == 0].sample(
    n=15, random_state=42
)
sample_df = pd.concat([fraud_samples, normal_samples]).sample(
    frac=1, random_state=42
).reset_index(drop=True)
sample_df.insert(0, "sample_id", [f"TX-{i+1:03d}" for i in range(len(sample_df))])
sample_df.to_csv(f"{artifact_dir}/test_samples.csv", index=False)

print("Saved artifacts to:", artifact_dir)
print("Sample counts:", sample_df["Class"].value_counts().to_dict())
```

Download these three files from Drive to your computer:
- `fraud_model.joblib`
- `threshold.json`
- `test_samples.csv`

Put them in `backend/artifacts/`. Keep these files private if you use any non-public data. The provided public dataset is anonymized.

## 2. Start the backend

Use Python 3.10–3.12 recommended for broad package compatibility.

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

macOS/Linux:
```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend: http://127.0.0.1:8000  
Interactive API docs: http://127.0.0.1:8000/docs

## 3. Start the React frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173.

## Important notes
- Sample mode uses genuine rows from your held-out test set. The sample list only exposes ID, amount, and time before prediction. The true label is returned only after the prediction request.
- The manual mode requires all 30 features (`Time`, `V1`–`V28`, `Amount`). The `V` fields are anonymized PCA components and are not human-readable purchase details.
- A model score is not a guaranteed calibrated real-world fraud probability.
- This is an educational demo, not a real payment authorization system.
- The backend checks feature names and count before prediction.
