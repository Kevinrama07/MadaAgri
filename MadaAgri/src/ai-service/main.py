"""
MadaAgri Offline AI Microservice
Production-grade crop detection using computer vision.
Runs locally without API limits.
"""

import os
import io
import json
import hashlib
import logging
from pathlib import Path
from typing import Optional, List
from enum import Enum

import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("madaagri-ai")

app = FastAPI(title="MadaAgri Offline AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_CROPS = [
    "Riz", "Vanille", "Cafe", "Manioc", "Mais", "Tomate", "Banane",
    "Cacao", "Poivre", "Girofle", "Litchi", "Pomme de terre",
    "Canne a sucre", "Arachide", "Legumes", "Agrumes",
]

CROP_COLOR_PROFILES = {
    "Riz": {"green_range": (60, 160), "brightness": (0.35, 0.65), "texture": "dense"},
    "Vanille": {"green_range": (40, 120), "brightness": (0.20, 0.45), "texture": "vine"},
    "Cafe": {"green_range": (50, 140), "brightness": (0.25, 0.50), "texture": "shrub"},
    "Manioc": {"green_range": (55, 150), "brightness": (0.30, 0.60), "texture": "broad"},
    "Mais": {"green_range": (80, 180), "brightness": (0.40, 0.70), "texture": "linear"},
    "Tomate": {"green_range": (45, 130), "brightness": (0.30, 0.55), "texture": "bush"},
    "Banane": {"green_range": (55, 160), "brightness": (0.30, 0.60), "texture": "palm"},
    "Cacao": {"green_range": (40, 110), "brightness": (0.20, 0.45), "texture": "tree"},
    "Legumes": {"green_range": (50, 150), "brightness": (0.30, 0.65), "texture": "mixed"},
}


class AnalysisRequest(BaseModel):
    image_url: Optional[str] = None
    parcel_context: Optional[dict] = None


class AnalysisResponse(BaseModel):
    detected_crop: str
    confidence_score: int
    health_score: int
    disease_detected: Optional[str]
    disease_risk: int
    nutrient_deficiencies: List[str]
    growth_stage: str
    recommendations: List[str]
    is_plant: bool
    image_quality: str
    ai_source: str = "offline-model"


def extract_color_stats(image: Image.Image) -> dict:
    """Extract dominant color and distribution statistics."""
    img_array = np.array(image.convert("RGB"))
    pixels = img_array.reshape(-1, 3).astype(float)

    r_mean, g_mean, b_mean = pixels.mean(axis=0)
    r_std, g_std, b_std = pixels.std(axis=0)

    greenness = g_mean - max(r_mean, b_mean)
    brightness = (r_mean * 0.299 + g_mean * 0.587 + b_mean * 0.114) / 255.0

    green_ratio = (pixels[:, 1] > pixels[:, 0]) & (pixels[:, 1] > pixels[:, 2])
    green_pixel_ratio = green_ratio.sum() / len(green_ratio)

    return {
        "r_mean": r_mean,
        "g_mean": g_mean,
        "b_mean": b_mean,
        "r_std": r_std,
        "g_std": g_std,
        "b_std": b_std,
        "greenness": greenness,
        "brightness": brightness,
        "green_pixel_ratio": green_pixel_ratio,
    }


def detect_crop(stats: dict, parcel_region: Optional[str] = None) -> tuple:
    """Match crop based on color statistics."""
    greenness = stats["greenness"]
    brightness = stats["brightness"]
    green_ratio = stats["green_pixel_ratio"]

    best_crop = "Inconnu"
    best_score = 0

    for crop, profile in CROP_COLOR_PROFILES.items():
        score = 0
        g_range = profile["green_range"]
        b_range = profile["brightness"]

        if g_range[0] <= greenness <= g_range[1]:
            score += 40
        elif abs(greenness - g_range[0]) < 20 or abs(greenness - g_range[1]) < 20:
            score += 20

        if b_range[0] <= brightness <= b_range[1]:
            score += 30
        elif abs(brightness - b_range[0]) < 0.1 or abs(brightness - b_range[1]) < 0.1:
            score += 15

        if green_ratio > 0.4:
            score += 20
        elif green_ratio > 0.25:
            score += 10

        if score > best_score:
            best_score = score
            best_crop = crop

    if best_crop == "Inconnu" and green_ratio > 0.3:
        best_crop = "Legumes"
        best_score = 25

    confidence = min(best_score, 75) if best_crop != "Inconnu" else 15

    if parcel_region:
        region_crops = get_region_crops(parcel_region)
        if best_crop in region_crops:
            confidence = min(confidence + 10, 85)

    return best_crop, confidence


def estimate_health(stats: dict) -> int:
    """Estimate plant health from color statistics."""
    score = 50

    if stats["greenness"] > 40:
        score += 20
    elif stats["greenness"] > 20:
        score += 10
    else:
        score -= 15

    if 0.3 <= stats["brightness"] <= 0.7:
        score += 10
    elif stats["brightness"] < 0.2 or stats["brightness"] > 0.85:
        score -= 10

    if stats["green_pixel_ratio"] > 0.5:
        score += 10
    elif stats["green_pixel_ratio"] < 0.2:
        score -= 10

    if stats["g_std"] < 30:
        score += 5

    return max(10, min(95, score))


def estimate_disease_risk(stats: dict) -> int:
    """Estimate disease risk."""
    risk = 15

    if stats["greenness"] < 20:
        risk += 30
    elif stats["greenness"] < 35:
        risk += 15

    if stats["brightness"] > 0.75:
        risk += 10
    if stats["brightness"] < 0.2:
        risk += 15

    if stats["green_pixel_ratio"] < 0.25:
        risk += 10

    return max(0, min(85, risk))


def detect_deficiencies(stats: dict) -> List[str]:
    """Detect possible nutrient deficiencies."""
    deficiencies = []

    if stats["r_mean"] > stats["g_mean"] * 1.3:
        deficiencies.append("Possible carence en azote (feuillage jaunatre)")

    if stats["b_mean"] > 60 and stats["g_mean"] < 100:
        deficiencies.append("Possible carence en phosphore")

    if stats["g_mean"] < 80:
        deficiencies.append("Chlorophylle faible - carence potentielle en magnesium")

    if stats["r_std"] > 50:
        deficiencies.append("Variation de couleur - stress possible")

    return deficiencies[:3]


def estimate_growth_stage(stats: dict) -> str:
    """Estimate growth stage."""
    greenness = stats["greenness"]
    if greenness < 15:
        return "Unknown"
    if greenness < 30:
        return "Seedling"
    if greenness < 50:
        return "Vegetative"
    if greenness < 70:
        return "Flowering"
    return "Mature"


def assess_image_quality(image: Image.Image) -> str:
    """Assess image quality."""
    w, h = image.size
    if w >= 1024 and h >= 768:
        return "Good"
    if w >= 640 and h >= 480:
        return "Acceptable"
    return "Poor"


def generate_recommendations(crop: str, health: int, disease_risk: int,
                             deficiencies: List[str], parcel_context: Optional[dict] = None) -> List[dict]:
    """Generate contextual recommendations."""
    recs = []

    if disease_risk > 50:
        recs.append({
            "category": "ALERTE MALADIE",
            "priority": "high",
            "text": "Risque de maladie detecte. Inspection visuelle recommandee"
        })

    if crop != "Inconnu":
        recs.append({
            "category": "Culture",
            "priority": "medium",
            "text": f"Culture detectee: {crop}. Verifier sur le terrain"
        })

    if deficiencies:
        recs.append({
            "category": "Nutriments",
            "priority": "medium",
            "text": f"Carences possibles: {', '.join(deficiencies)}"
        })

    if health < 40:
        recs.append({
            "category": "Sante",
            "priority": "high",
            "text": "Sante de la culture faible. Intervention recommandee"
        })

    if parcel_context and parcel_context.get("soil_type"):
        recs.append({
            "category": "Sol",
            "priority": "low",
            "text": f"Type de sol: {parcel_context['soil_type']}. Adapter les pratiques"
        })

    recs.append({
        "category": "Information",
        "priority": "low",
        "text": "Analyse par modele offline. Pour une analyse plus precise, utilisez Gemini AI"
    })

    return recs


def get_region_crops(region: str) -> List[str]:
    """Get crops common to a region."""
    region_map = {
        "Analamanga": ["Riz", "Legumes", "Tomate"],
        "Vakinankaratra": ["Pomme de terre", "Legumes", "Tomate"],
        "Haute Matsiatra": ["Riz", "Manioc", "Mais"],
        "Atsimo-Atsinanana": ["Vanille", "Cacao", "Poivre", "Girofle", "Litchi"],
        "Boeny": ["Mais", "Manioc"],
        "Diana": ["Cacao", "Vanille", "Cafe"],
        "Sava": ["Vanille", "Cafe", "Cacao", "Poivre"],
        "Alaotra-Mangoro": ["Riz", "Legumes", "Cafe"],
    }
    return region_map.get(region, ["Riz", "Manioc", "Mais"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "madaagri-offline-ai", "version": "2.0.0"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    image_url: Optional[str] = Form(None),
    parcel_context: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """Analyze a crop image using offline computer vision."""
    try:
        if file:
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
        elif image_url:
            import urllib.request
            with urllib.request.urlopen(image_url, timeout=10) as response:
                image_data = response.read()
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
        else:
            raise HTTPException(status_code=400, detail="image_url or file required")

        image_hash = hashlib.sha256(image_data).hexdigest()
        stats = extract_color_stats(image)
        parcel_ctx = json.loads(parcel_context) if parcel_context else None
        region = parcel_ctx.get("region") if parcel_ctx else None

        crop, confidence = detect_crop(stats, region)
        health = estimate_health(stats)
        disease_risk = estimate_disease_risk(stats)
        deficiencies = detect_deficiencies(stats)
        growth_stage = estimate_growth_stage(stats)
        image_quality = assess_image_quality(image)
        recommendations = generate_recommendations(crop, health, disease_risk, deficiencies, parcel_ctx)

        return AnalysisResponse(
            detected_crop=crop,
            confidence_score=confidence,
            health_score=health,
            disease_detected="Stress vegetal" if disease_risk > 40 else None,
            disease_risk=disease_risk,
            nutrient_deficiencies=deficiencies,
            growth_stage=growth_stage,
            recommendations=[r["text"] for r in recommendations],
            is_plant=stats["green_pixel_ratio"] > 0.15,
            image_quality=image_quality,
            ai_source="offline-model",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-url")
async def analyze_image_url(request: AnalysisRequest):
    """Analyze image from URL (JSON body)."""
    if not request.image_url:
        raise HTTPException(status_code=400, detail="image_url required")

    try:
        import urllib.request
        with urllib.request.urlopen(request.image_url, timeout=10) as response:
            image_data = response.read()

        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        stats = extract_color_stats(image)

        parcel_ctx = request.parcel_context or {}
        region = parcel_ctx.get("region")

        crop, confidence = detect_crop(stats, region)
        health = estimate_health(stats)
        disease_risk = estimate_disease_risk(stats)
        deficiencies = detect_deficiencies(stats)
        growth_stage = estimate_growth_stage(stats)
        image_quality = assess_image_quality(image)
        recommendations = generate_recommendations(crop, health, disease_risk, deficiencies, parcel_ctx)

        return {
            "detected_crop": crop,
            "confidence_score": confidence,
            "health_score": health,
            "disease_detected": "Stress vegetal" if disease_risk > 40 else None,
            "disease_risk": disease_risk,
            "nutrient_deficiencies": deficiencies,
            "growth_stage": growth_stage,
            "recommendations": [r["text"] for r in recommendations],
            "is_plant": stats["green_pixel_ratio"] > 0.15,
            "image_quality": image_quality,
            "ai_source": "offline-model",
        }

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("AI_SERVICE_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
