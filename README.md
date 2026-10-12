# AI Smart Elderly Health Monitoring & Emergency Assistance System

An educational assistive health telemetry and continuous monitoring web application designed for elderly care, wearable sensor telemetry, real-time risk scoring, explainable anomaly detection, and emergency caregiver escalation.

---

## 1. Machine Learning Risk Classification Pipeline

The application features a reproducible Machine Learning training pipeline built with Python and Scikit-Learn to classify physiological health risk levels into four categories: **Low**, **Moderate**, **High**, and **Critical**.

### Dataset Placement
The model is trained on the synthetic physiological dataset located at:
```
data/elderly_health_monitoring_synthetic_demo_dataset.csv
```
- **Records**: 600 synthetic patient telemetry rows
- **Columns**: 18 attributes (vitals, changes, posture, risk annotations)
- **Features Used**:
  - `heart_rate_bpm`
  - `spo2_percent`
  - `temperature_c`
  - `systolic_bp_mmhg`
  - `diastolic_bp_mmhg`
  - `inactivity_minutes`
  - `possible_fall_event`
  - `heart_rate_change`
  - `spo2_change`
  - `temperature_change`
  - `motion_status` (one-hot encoded: Active, Normal, Possible Fall, Resting)
- **Excluded Columns (Leakage Prevention)**:
  `record_id`, `timestamp`, `demo_explanation`, `data_source`, `is_clinically_validated`, `demo_risk_score`

### Training Script
To train the model and export inference artifacts:
```bash
python ml/train.py
```
*(On Windows with Python Launcher: `py ml/train.py` or specify the Python binary path)*

### Evaluation Results (Held-Out Test Set)
- **Train/Test Split**: 80% Train (480 samples), 20% Held-Out Test (120 samples, stratified)
- **Model Algorithm**: Random Forest Classifier (100 estimators, max depth 12, balanced class weights)
- **Test Set Accuracy**: **88.33%**
- **Weighted Precision**: **87.77%**
- **Weighted Recall**: **88.33%**
- **Weighted F1-Score**: **87.98%**
- **5-Fold Stratified Cross-Validation F1**: **90.89% ± 3.09%**

#### Confusion Matrix:
| Class | Critical | High | Low | Moderate |
| :--- | :---: | :---: | :---: | :---: |
| **Critical** | 2 | 1 | 0 | 0 |
| **High** | 1 | 3 | 0 | 2 |
| **Low** | 0 | 0 | 85 | 3 |
| **Moderate** | 0 | 1 | 6 | 16 |

#### Top Feature Importances:
1. `spo2_percent` (22.56%)
2. `heart_rate_bpm` (18.06%)
3. `spo2_change` (13.59%)
4. `heart_rate_change` (11.37%)
5. `inactivity_minutes` (8.09%)
6. `temperature_c` (7.58%)
7. `temperature_change` (5.40%)
8. `diastolic_bp_mmhg` (4.53%)

### ML Artifacts Generated
- `ml/model.joblib`: Serialized Scikit-Learn Random Forest pipeline
- `ml/metrics.json`: Accuracy, precision, recall, F1, and confusion matrix
- `ml/feature_importance.json`: Ranked feature weight table
- `ml/model_export.json`: Client inference configuration (risk zones, weights, decision bounds)

### Client-Side Browser Inference
To maintain zero-latency predictions without requiring a separate Python server during Vercel deployment:
- `src/lib/mlInference.ts` implements a zero-dependency TypeScript inference engine directly derived from the trained Random Forest model.
- Automatically scores streaming vital signs and outputs `riskLevel`, `riskScore` (0–100), `confidence`, and explainable contributing factors.

---

## 2. Real Account vs. Demo Mode Isolation

The system strictly isolates real patient accounts from demonstration simulation:
1. **Real User Account**:
   - Authenticated through Supabase Auth (email/password).
   - Only reads and writes records scoped to `auth.uid() = user_id`.
   - Never injects synthetic training dataset records into user histories.
   - If the patient monitoring device is disconnected or offline, displays an honest **"Device Standby / Awaiting Telemetry"** state rather than fabricating readings.
   - Allows logging manual vitals check-ins and saving parsed laboratory reports directly to Supabase with PostgreSQL Row Level Security (RLS).
2. **Demo Mode**:
   - Features simulated patient profile **Margaret Vance (76)**.
   - Provides live streaming sensor telemetry across 6 interactive test scenarios (Normal, Tachycardia, Hypoxia, Pyrexia, Multi-parameter Distress, Fall Emergency).
   - All records and predictions are clearly labeled with `DEMO` badges.

---

## 3. Database Schema & Row Level Security

The application utilizes Supabase PostgreSQL with RLS enabled on all tables:
- `public.profiles`: Patient demographics, caregiver emergency escalation contacts
- `public.devices`: Registered IoT hardware monitors (ESP32, Raspberry Pi)
- `public.sensor_readings`: Vital signs telemetry (`heart_rate`, `spo2`, `temperature`, `systolic_bp`, `diastolic_bp`, `motion_status`, `source`, `timestamp`)
- `public.health_alerts`: Threshold violations and fall events
- `public.patient_reports`: Diagnostic laboratory panels and documents
- `public.report_parameters`: OCR-extracted clinical biomarkers with reference ranges

---

## 4. Running Locally & Production Build

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 5. Educational Assistive Notice & Disclaimer

> **IMPORTANT NOTICE:** This application is developed as an educational assistive monitoring and research project. All algorithms, machine learning predictions, and physiological thresholds are demonstration approximations. This system is **NOT** clinically validated and must never be used as a medical diagnostic device or as a substitute for professional medical care, diagnosis, or clinical evaluation.
