"""
ML Training Pipeline for Elderly Health Monitoring Risk Classification
======================================================================
Trains a Random Forest Classifier on the synthetic demo dataset to predict
demo_risk_level (Low, Moderate, High, Critical) from sensor features.

Outputs:
  - ml/model.joblib               : trained sklearn pipeline
  - ml/metrics.json               : accuracy, precision, recall, f1, confusion matrix
  - ml/model_export.json          : feature config + per-class thresholds for browser inference
  - ml/feature_importance.json    : ranked feature importances
"""

import os
import sys
import json
import warnings
from pathlib import Path

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)
import joblib

warnings.filterwarnings("ignore")

# -- Paths -------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "elderly_health_monitoring_synthetic_demo_dataset.csv"
OUTPUT_DIR = Path(__file__).resolve().parent

# -- Configuration -----------------------------------------------------------
FEATURE_COLS = [
    "heart_rate_bpm",
    "spo2_percent",
    "temperature_c",
    "systolic_bp_mmhg",
    "diastolic_bp_mmhg",
    "inactivity_minutes",
    "possible_fall_event",
    "heart_rate_change",
    "spo2_change",
    "temperature_change",
]

CATEGORICAL_COLS = ["motion_status"]

TARGET_COL = "demo_risk_level"
RISK_CLASSES = ["Low", "Moderate", "High", "Critical"]


def load_and_validate_data():
    print("=" * 70)
    print("STEP 1: Loading and Validating Dataset")
    print("=" * 70)

    if not DATA_PATH.exists():
        print(f"ERROR: Dataset not found at {DATA_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"  Loaded {len(df)} records with {len(df.columns)} columns")

    all_needed = FEATURE_COLS + CATEGORICAL_COLS + [TARGET_COL]
    missing = [c for c in all_needed if c not in df.columns]
    if missing:
        print(f"  ERROR: Missing columns: {missing}")
        sys.exit(1)
    print("  [OK] All required columns present")

    for col in FEATURE_COLS:
        print(f"    {col}: {df[col].dtype}")

    missing_counts = df[FEATURE_COLS + CATEGORICAL_COLS + [TARGET_COL]].isnull().sum()
    total_missing = missing_counts.sum()
    print(f"\n  Missing values: {total_missing}")

    dupes = df.duplicated(subset=FEATURE_COLS).sum()
    print(f"  Duplicate feature rows: {dupes}")

    print(f"\n  Target class distribution:")
    class_counts = df[TARGET_COL].value_counts()
    for cls, count in class_counts.items():
        pct = count / len(df) * 100
        print(f"    {cls}: {count} ({pct:.1f}%)")

    print(f"\n  Feature statistics:")
    print(df[FEATURE_COLS].describe().round(2).to_string())

    return df


def prepare_features(df):
    print("\n" + "=" * 70)
    print("STEP 2: Feature Engineering")
    print("=" * 70)

    motion_dummies = pd.get_dummies(df["motion_status"], prefix="motion")
    print(f"  One-hot encoded motion_status -> {list(motion_dummies.columns)}")

    X = pd.concat([df[FEATURE_COLS], motion_dummies], axis=1)

    nan_before = X.isnull().sum().sum()
    if nan_before > 0:
        X = X.fillna(X.median())
        print(f"  Filled {nan_before} NaN values with column medians")

    le = LabelEncoder()
    le.fit(RISK_CLASSES)
    y = le.transform(df[TARGET_COL])

    feature_names = list(X.columns)
    print(f"  Final feature count: {len(feature_names)}")
    print(f"  Features: {feature_names}")

    return X, y, feature_names, le, list(motion_dummies.columns)


def train_model(X, y, feature_names, label_encoder):
    print("\n" + "=" * 70)
    print("STEP 3: Training Random Forest Classifier")
    print("=" * 70)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  Train set: {len(X_train)} samples")
    print(f"  Test set:  {len(X_test)} samples")

    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    rf.fit(X_train_scaled, y_train)
    y_pred = rf.predict(X_test_scaled)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\n  Accuracy:  {accuracy:.4f}")
    print(f"  Precision: {precision:.4f} (weighted)")
    print(f"  Recall:    {recall:.4f} (weighted)")
    print(f"  F1 Score:  {f1:.4f} (weighted)")

    classes = label_encoder.classes_
    print(f"\n  Confusion Matrix:")
    print(f"  {'':>12} | " + " | ".join(f"{c:>8}" for c in classes) + " |")
    print(f"  {'-' * 12}-+-" + "-+-".join("-" * 8 for _ in classes) + "-+")
    for i, cls in enumerate(classes):
        row_vals = " | ".join(f"{cm[i][j]:>8}" for j in range(len(classes)))
        print(f"  {cls:>12} | {row_vals} |")

    print(f"\n  Classification Report:")
    report = classification_report(y_test, y_pred, target_names=classes, zero_division=0)
    for line in report.split("\n"):
        print(f"    {line}")

    cv_scores = cross_val_score(rf, scaler.transform(X), y, cv=5, scoring="f1_weighted")
    print(f"\n  5-Fold Cross-Validation:")
    print(f"    Mean F1: {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

    importances = rf.feature_importances_
    importance_pairs = sorted(
        zip(feature_names, importances), key=lambda x: x[1], reverse=True
    )
    print(f"\n  Feature Importances (Top 10):")
    for name, imp in importance_pairs[:10]:
        bar = "#" * int(imp * 50)
        print(f"    {name:>25}: {imp:.4f} {bar}")

    return rf, scaler, accuracy, precision, recall, f1, cm, importance_pairs, cv_scores


def build_client_inference_export(rf, scaler, feature_names, label_encoder, motion_cols):
    scaler_params = {
        "mean": {name: round(float(m), 6) for name, m in zip(feature_names, scaler.mean_)},
        "std": {name: round(float(s), 6) for name, s in zip(feature_names, scaler.scale_)},
    }

    importances = {
        name: round(float(imp), 6)
        for name, imp in zip(feature_names, rf.feature_importances_)
    }

    risk_zones = {
        "heart_rate_bpm": {
            "low_risk": {"min": 55, "max": 95},
            "moderate_risk": {"min_low": 45, "max_low": 55, "min_high": 95, "max_high": 115},
            "high_risk": {"min_low": 35, "max_low": 45, "min_high": 115, "max_high": 130},
            "critical": {"below": 35, "above": 130},
        },
        "spo2_percent": {
            "low_risk": {"min": 95, "max": 100},
            "moderate_risk": {"min": 92, "max": 95},
            "high_risk": {"min": 88, "max": 92},
            "critical": {"below": 88},
        },
        "temperature_c": {
            "low_risk": {"min": 36.1, "max": 37.5},
            "moderate_risk": {"min_low": 35.5, "max_low": 36.1, "min_high": 37.5, "max_high": 38.2},
            "high_risk": {"min_low": 34.5, "max_low": 35.5, "min_high": 38.2, "max_high": 39.5},
            "critical": {"below": 34.5, "above": 39.5},
        },
        "systolic_bp_mmhg": {
            "low_risk": {"min": 100, "max": 135},
            "moderate_risk": {"min_low": 85, "max_low": 100, "min_high": 135, "max_high": 155},
            "high_risk": {"min_low": 70, "max_low": 85, "min_high": 155, "max_high": 180},
            "critical": {"below": 70, "above": 180},
        },
        "diastolic_bp_mmhg": {
            "low_risk": {"min": 60, "max": 85},
            "moderate_risk": {"min_low": 50, "max_low": 60, "min_high": 85, "max_high": 95},
            "high_risk": {"min_low": 40, "max_low": 50, "min_high": 95, "max_high": 110},
            "critical": {"below": 40, "above": 110},
        },
    }

    weights = {
        "heart_rate": round(float(importances.get("heart_rate_bpm", 0) + importances.get("heart_rate_change", 0)), 4),
        "spo2": round(float(importances.get("spo2_percent", 0) + importances.get("spo2_change", 0)), 4),
        "temperature": round(float(importances.get("temperature_c", 0) + importances.get("temperature_change", 0)), 4),
        "blood_pressure": round(float(importances.get("systolic_bp_mmhg", 0) + importances.get("diastolic_bp_mmhg", 0)), 4),
        "inactivity": round(float(importances.get("inactivity_minutes", 0)), 4),
        "fall_event": round(float(importances.get("possible_fall_event", 0)), 4),
    }

    change_thresholds = {
        "heart_rate_change": {"warning": 8.0, "high": 15.0, "critical": 25.0},
        "spo2_change": {"warning": -2.0, "high": -4.0, "critical": -6.0},
        "temperature_change": {"warning": 0.5, "high": 1.0, "critical": 1.5},
    }

    return {
        "version": "1.0.0",
        "model_type": "random_forest_derived",
        "n_classes": len(label_encoder.classes_),
        "class_labels": list(label_encoder.classes_),
        "feature_names": feature_names,
        "motion_columns": motion_cols,
        "scaler": scaler_params,
        "feature_importances": importances,
        "risk_zones": risk_zones,
        "category_weights": weights,
        "change_thresholds": change_thresholds,
        "inactivity_thresholds": {"warning": 30, "high": 60, "critical": 120},
        "fall_event_score": 30,
        "multi_param_bonus": {"two_params": 10, "three_or_more": 25},
        "score_to_class": {
            "Low": {"min": 0, "max": 25},
            "Moderate": {"min": 26, "max": 55},
            "High": {"min": 56, "max": 80},
            "Critical": {"min": 81, "max": 100},
        },
    }


def export_model_artifacts(
    rf, scaler, feature_names, label_encoder, motion_cols,
    accuracy, precision, recall, f1, cm, importance_pairs, cv_scores
):
    print("\n" + "=" * 70)
    print("STEP 4: Exporting Model Artifacts")
    print("=" * 70)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    model_path = OUTPUT_DIR / "model.joblib"
    joblib.dump({"model": rf, "scaler": scaler, "label_encoder": label_encoder}, model_path)
    print(f"  [OK] Saved model pipeline -> {model_path}")

    metrics = {
        "accuracy": round(accuracy, 4),
        "precision_weighted": round(precision, 4),
        "recall_weighted": round(recall, 4),
        "f1_weighted": round(f1, 4),
        "cross_validation": {
            "mean_f1": round(float(cv_scores.mean()), 4),
            "std_f1": round(float(cv_scores.std()), 4),
            "folds": [round(float(s), 4) for s in cv_scores],
        },
        "confusion_matrix": cm.tolist(),
        "class_labels": list(label_encoder.classes_),
        "n_features": int(rf.n_features_in_),
        "n_estimators": rf.n_estimators,
        "max_depth": rf.max_depth,
    }
    metrics_path = OUTPUT_DIR / "metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  [OK] Saved metrics -> {metrics_path}")

    fi_data = [
        {"feature": name, "importance": round(float(imp), 6)}
        for name, imp in importance_pairs
    ]
    fi_path = OUTPUT_DIR / "feature_importance.json"
    with open(fi_path, "w") as f:
        json.dump(fi_data, f, indent=2)
    print(f"  [OK] Saved feature importances -> {fi_path}")

    export = build_client_inference_export(rf, scaler, feature_names, label_encoder, motion_cols)
    export_path = OUTPUT_DIR / "model_export.json"
    with open(export_path, "w") as f:
        json.dump(export, f, indent=2)
    print(f"  [OK] Saved client inference export -> {export_path}")


def main():
    print("=" * 70)
    print("  Elderly Health Monitoring -- ML Training Pipeline")
    print("  Random Forest Risk Classification")
    print("=" * 70)
    print()

    df = load_and_validate_data()
    X, y, feature_names, label_encoder, motion_cols = prepare_features(df)
    rf, scaler, accuracy, precision, recall, f1, cm, importance_pairs, cv_scores = train_model(
        X, y, feature_names, label_encoder
    )
    export_model_artifacts(
        rf, scaler, feature_names, label_encoder, motion_cols,
        accuracy, precision, recall, f1, cm, importance_pairs, cv_scores
    )

    print("\n" + "=" * 70)
    print("TRAINING COMPLETE")
    print("=" * 70)
    print(f"  Accuracy:     {accuracy:.4f}")
    print(f"  F1 Score:     {f1:.4f}")
    print(f"  Cross-Val F1: {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")
    print(f"\n  Artifacts saved to: {OUTPUT_DIR}")
    print(f"    - model.joblib")
    print(f"    - metrics.json")
    print(f"    - feature_importance.json")
    print(f"    - model_export.json")
    print()


if __name__ == "__main__":
    main()
