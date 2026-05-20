const sharp = require('sharp');
const logger = require('../utils/logger');

const VALID_CROPS = [
  'Riz', 'Vanille', 'Cafe', 'Manioc', 'Mais', 'Tomate', 'Banane',
  'Cacao', 'Poivre', 'Girofle', 'Litchi', 'Pomme de terre',
  'Canne a sucre', 'Arachide', 'Legumes', 'Agrumes',
];

const CROP_PROFILES = {
  'Tomate': {
    greenRatio: { min: 0.25, max: 0.55, weight: 20 },
    redRatio: { min: 0.03, max: 0.25, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.08, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.10, weight: 5 },
    brownRatio: { min: 0.0, max: 0.08, weight: 3 },
    colorVariance: { min: 30, max: 65, weight: 15 },
    edgeDensity: { min: 15, max: 35, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 10,
    fruitPresent: true,
    brightness: { min: 0.25, max: 0.55, weight: 5 },
    zoneColorVariance: { min: 0.05, max: 0.25, weight: 5 },
    dominantHue: 'green-red',
    hueWeight: 5,
    texturePattern: 'compound-leaf',
    colorSignature: 'green-leaves-with-red-fruits',
  },
  'Arachide': {
    greenRatio: { min: 0.35, max: 0.65, weight: 20 },
    redRatio: { min: 0.0, max: 0.02, weight: 25 },
    yellowRatio: { min: 0.02, max: 0.12, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.03, weight: 5 },
    brownRatio: { min: 0.02, max: 0.12, weight: 3 },
    colorVariance: { min: 12, max: 30, weight: 15 },
    edgeDensity: { min: 28, max: 50, weight: 12 },
    leafType: 'compound',
    leafTypeWeight: 12,
    fruitPresent: false,
    brightness: { min: 0.30, max: 0.55, weight: 5 },
    zoneColorVariance: { min: 0.0, max: 0.10, weight: 5 },
    dominantHue: 'green-yellow',
    hueWeight: 5,
    texturePattern: 'small-oval-leaves',
    colorSignature: 'uniform-green-with-yellow-flowers',
  },
  'Riz': {
    greenRatio: { min: 0.40, max: 0.75, weight: 20 },
    redRatio: { min: 0.0, max: 0.02, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.08, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.02, weight: 5 },
    brownRatio: { min: 0.0, max: 0.05, weight: 3 },
    colorVariance: { min: 8, max: 25, weight: 15 },
    edgeDensity: { min: 45, max: 75, weight: 15 },
    leafType: 'narrow',
    leafTypeWeight: 15,
    fruitPresent: false,
    brightness: { min: 0.30, max: 0.60, weight: 5 },
    zoneColorVariance: { min: 0.0, max: 0.08, weight: 5 },
    dominantHue: 'green',
    hueWeight: 8,
    waterReflection: true,
    waterWeight: 8,
    texturePattern: 'dense-parallel-blades',
    colorSignature: 'uniform-green-dense-narrow-leaves',
  },
  'Mais': {
    greenRatio: { min: 0.30, max: 0.60, weight: 20 },
    redRatio: { min: 0.0, max: 0.02, weight: 25 },
    yellowRatio: { min: 0.05, max: 0.25, weight: 10 },
    orangeRatio: { min: 0.0, max: 0.05, weight: 5 },
    brownRatio: { min: 0.02, max: 0.10, weight: 3 },
    colorVariance: { min: 20, max: 45, weight: 12 },
    edgeDensity: { min: 30, max: 55, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 8,
    fruitPresent: false,
    brightness: { min: 0.35, max: 0.65, weight: 5 },
    zoneColorVariance: { min: 0.05, max: 0.20, weight: 5 },
    dominantHue: 'green-yellow',
    hueWeight: 8,
    texturePattern: 'tall-stalk-broad-leaves',
    colorSignature: 'green-top-yellow-gradient',
  },
  'Banane': {
    greenRatio: { min: 0.25, max: 0.55, weight: 20 },
    redRatio: { min: 0.0, max: 0.03, weight: 25 },
    yellowRatio: { min: 0.03, max: 0.20, weight: 10 },
    orangeRatio: { min: 0.0, max: 0.05, weight: 5 },
    brownRatio: { min: 0.02, max: 0.10, weight: 3 },
    colorVariance: { min: 20, max: 50, weight: 12 },
    edgeDensity: { min: 12, max: 30, weight: 12 },
    leafType: 'palm',
    leafTypeWeight: 15,
    fruitPresent: true,
    brightness: { min: 0.25, max: 0.55, weight: 5 },
    zoneColorVariance: { min: 0.05, max: 0.20, weight: 5 },
    dominantHue: 'green-yellow',
    hueWeight: 8,
    texturePattern: 'large-palm-leaves',
    colorSignature: 'large-green-leaves-yellow-fruit',
  },
  'Manioc': {
    greenRatio: { min: 0.30, max: 0.60, weight: 20 },
    redRatio: { min: 0.0, max: 0.03, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.06, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.03, weight: 5 },
    brownRatio: { min: 0.02, max: 0.10, weight: 3 },
    colorVariance: { min: 15, max: 35, weight: 12 },
    edgeDensity: { min: 20, max: 40, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 10,
    fruitPresent: false,
    brightness: { min: 0.25, max: 0.55, weight: 5 },
    zoneColorVariance: { min: 0.0, max: 0.12, weight: 5 },
    dominantHue: 'green',
    hueWeight: 8,
    texturePattern: 'palmate-leaves',
    colorSignature: 'palmate-green-leaves',
  },
  'Vanille': {
    greenRatio: { min: 0.25, max: 0.55, weight: 20 },
    redRatio: { min: 0.0, max: 0.02, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.05, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.02, weight: 5 },
    brownRatio: { min: 0.02, max: 0.08, weight: 3 },
    colorVariance: { min: 12, max: 30, weight: 12 },
    edgeDensity: { min: 12, max: 30, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 8,
    fruitPresent: false,
    brightness: { min: 0.15, max: 0.40, weight: 8 },
    zoneColorVariance: { min: 0.0, max: 0.10, weight: 5 },
    dominantHue: 'dark-green',
    hueWeight: 8,
    texturePattern: 'vine-orchid-leaves',
    colorSignature: 'dark-green-vine-leaves',
  },
  'Cafe': {
    greenRatio: { min: 0.25, max: 0.55, weight: 20 },
    redRatio: { min: 0.0, max: 0.06, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.05, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.03, weight: 5 },
    brownRatio: { min: 0.02, max: 0.10, weight: 3 },
    colorVariance: { min: 15, max: 35, weight: 12 },
    edgeDensity: { min: 18, max: 38, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 8,
    fruitPresent: false,
    brightness: { min: 0.18, max: 0.45, weight: 5 },
    zoneColorVariance: { min: 0.0, max: 0.12, weight: 5 },
    dominantHue: 'dark-green',
    hueWeight: 8,
    texturePattern: 'glossy-oval-leaves',
    colorSignature: 'dark-green-glossy-leaves',
  },
  'Cacao': {
    greenRatio: { min: 0.20, max: 0.50, weight: 20 },
    redRatio: { min: 0.0, max: 0.04, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.05, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.03, weight: 5 },
    brownRatio: { min: 0.03, max: 0.12, weight: 5 },
    colorVariance: { min: 12, max: 28, weight: 12 },
    edgeDensity: { min: 12, max: 30, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 8,
    fruitPresent: false,
    brightness: { min: 0.12, max: 0.38, weight: 8 },
    zoneColorVariance: { min: 0.0, max: 0.10, weight: 5 },
    dominantHue: 'dark-green',
    hueWeight: 8,
    texturePattern: 'large-elliptical-leaves',
    colorSignature: 'dark-green-large-leaves-understory',
  },
  'Poivre': {
    greenRatio: { min: 0.25, max: 0.55, weight: 20 },
    redRatio: { min: 0.0, max: 0.06, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.05, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.03, weight: 5 },
    brownRatio: { min: 0.02, max: 0.08, weight: 3 },
    colorVariance: { min: 15, max: 35, weight: 12 },
    edgeDensity: { min: 18, max: 38, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 8,
    fruitPresent: false,
    brightness: { min: 0.18, max: 0.45, weight: 5 },
    zoneColorVariance: { min: 0.0, max: 0.12, weight: 5 },
    dominantHue: 'green',
    hueWeight: 8,
    texturePattern: 'vine-heart-leaves',
    colorSignature: 'green-vine-heart-shaped-leaves',
  },
  'Girofle': {
    greenRatio: { min: 0.20, max: 0.50, weight: 20 },
    redRatio: { min: 0.0, max: 0.03, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.05, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.03, weight: 5 },
    brownRatio: { min: 0.02, max: 0.10, weight: 3 },
    colorVariance: { min: 12, max: 28, weight: 12 },
    edgeDensity: { min: 15, max: 35, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 8,
    fruitPresent: false,
    brightness: { min: 0.18, max: 0.45, weight: 5 },
    zoneColorVariance: { min: 0.0, max: 0.10, weight: 5 },
    dominantHue: 'dark-green',
    hueWeight: 8,
    texturePattern: 'tree-evergreen-leaves',
    colorSignature: 'dark-green-tree-leaves',
  },
  'Litchi': {
    greenRatio: { min: 0.25, max: 0.55, weight: 20 },
    redRatio: { min: 0.0, max: 0.06, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.05, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.03, weight: 5 },
    brownRatio: { min: 0.02, max: 0.08, weight: 3 },
    colorVariance: { min: 15, max: 35, weight: 12 },
    edgeDensity: { min: 18, max: 38, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 8,
    fruitPresent: false,
    brightness: { min: 0.22, max: 0.50, weight: 5 },
    zoneColorVariance: { min: 0.0, max: 0.12, weight: 5 },
    dominantHue: 'green',
    hueWeight: 8,
    texturePattern: 'tree-lanceolate-leaves',
    colorSignature: 'green-tree-lanceolate-leaves',
  },
  'Pomme de terre': {
    greenRatio: { min: 0.30, max: 0.60, weight: 20 },
    redRatio: { min: 0.0, max: 0.03, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.08, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.03, weight: 5 },
    brownRatio: { min: 0.02, max: 0.10, weight: 3 },
    colorVariance: { min: 15, max: 35, weight: 12 },
    edgeDensity: { min: 22, max: 42, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 8,
    fruitPresent: false,
    brightness: { min: 0.28, max: 0.55, weight: 5 },
    zoneColorVariance: { min: 0.0, max: 0.12, weight: 5 },
    dominantHue: 'green',
    hueWeight: 8,
    texturePattern: 'compound-leaf-herbaceous',
    colorSignature: 'medium-green-compound-leaves',
  },
  'Canne a sucre': {
    greenRatio: { min: 0.35, max: 0.70, weight: 20 },
    redRatio: { min: 0.0, max: 0.02, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.06, weight: 5 },
    orangeRatio: { min: 0.0, max: 0.02, weight: 5 },
    brownRatio: { min: 0.03, max: 0.12, weight: 5 },
    colorVariance: { min: 12, max: 30, weight: 12 },
    edgeDensity: { min: 38, max: 65, weight: 15 },
    leafType: 'narrow',
    leafTypeWeight: 15,
    fruitPresent: false,
    brightness: { min: 0.32, max: 0.60, weight: 5 },
    zoneColorVariance: { min: 0.0, max: 0.10, weight: 5 },
    dominantHue: 'green',
    hueWeight: 8,
    texturePattern: 'tall-stalk-narrow-leaves',
    colorSignature: 'tall-green-stalks-narrow-leaves',
  },
  'Legumes': {
    greenRatio: { min: 0.25, max: 0.65, weight: 18 },
    redRatio: { min: 0.0, max: 0.12, weight: 15 },
    yellowRatio: { min: 0.0, max: 0.12, weight: 8 },
    orangeRatio: { min: 0.0, max: 0.08, weight: 5 },
    brownRatio: { min: 0.0, max: 0.10, weight: 3 },
    colorVariance: { min: 15, max: 55, weight: 10 },
    edgeDensity: { min: 15, max: 55, weight: 10 },
    leafType: 'broad',
    leafTypeWeight: 5,
    fruitPresent: false,
    brightness: { min: 0.22, max: 0.60, weight: 5 },
    zoneColorVariance: { min: 0.0, max: 0.20, weight: 5 },
    dominantHue: 'varied',
    hueWeight: 3,
    texturePattern: 'varied',
    colorSignature: 'varied-garden-crops',
  },
  'Agrumes': {
    greenRatio: { min: 0.22, max: 0.50, weight: 20 },
    redRatio: { min: 0.0, max: 0.04, weight: 25 },
    yellowRatio: { min: 0.0, max: 0.06, weight: 5 },
    orangeRatio: { min: 0.03, max: 0.20, weight: 12 },
    brownRatio: { min: 0.02, max: 0.08, weight: 3 },
    colorVariance: { min: 20, max: 45, weight: 12 },
    edgeDensity: { min: 18, max: 38, weight: 12 },
    leafType: 'broad',
    leafTypeWeight: 8,
    fruitPresent: true,
    brightness: { min: 0.28, max: 0.55, weight: 5 },
    zoneColorVariance: { min: 0.05, max: 0.20, weight: 5 },
    dominantHue: 'green-orange',
    hueWeight: 10,
    texturePattern: 'tree-oval-glossy-leaves',
    colorSignature: 'green-leaves-orange-fruit',
  },
};

class HeuristicAnalysisService {
  static async analyzeFromBuffer(buffer, mimeType, parcelContext = null) {
    logger.info('[HeuristicAnalysis] Analyzing from buffer', { size: buffer.length, mimeType });

    const features = await this.extractFeatures(buffer);
    logger.info('[HeuristicAnalysis] Image features', {
      greenRatio: features.greenRatio.toFixed(3),
      redRatio: features.redRatio.toFixed(3),
      yellowRatio: features.yellowRatio.toFixed(3),
      orangeRatio: features.orangeRatio.toFixed(3),
      brownRatio: features.brownRatio.toFixed(3),
      waterRatio: features.waterRatio.toFixed(3),
      brightness: features.brightness.toFixed(3),
      edgeDensity: features.edgeDensity.toFixed(1),
      colorVariance: features.colorVariance.toFixed(1),
      leafType: features.leafType,
      dominantHue: features.dominantHue,
      hueDistribution: features.hueDistribution,
    });

    const cropMatch = this.matchCrop(features, parcelContext);
    const healthScore = this.estimateHealth(features);
    const diseaseRisk = this.estimateDiseaseRisk(features);
    const deficiencies = this.detectDeficiencies(features);
    const growthStage = this.estimateGrowthStage(features);
    const imageQuality = this.assessImageQuality(features);

    const recommendations = this.generateRecommendations(
      cropMatch, healthScore, diseaseRisk, deficiencies, parcelContext
    );

    return {
      detected_crop: cropMatch.crop,
      confidence_score: cropMatch.confidence,
      health_score: healthScore,
      disease_detected: diseaseRisk > 40 ? this.suggestDisease(diseaseRisk, features) : null,
      disease_risk: diseaseRisk,
      nutrient_deficiencies: deficiencies,
      growth_stage: growthStage,
      recommendations,
      is_plant: features.greenRatio > 0.15,
      image_quality: imageQuality,
      ai_source: 'heuristic',
    };
  }

  static async extractFeatures(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      const resizeW = Math.min(metadata.width || 300, 300);

      const [colorResult, edgeResult] = await Promise.all([
        sharp(buffer).resize({ width: resizeW, fit: 'inside' }).raw().toBuffer({ resolveWithObject: true }),
        sharp(buffer).resize({ width: Math.min(resizeW, 150), fit: 'inside' }).grayscale().raw().toBuffer({ resolveWithObject: true }),
      ]);

      const features = this.computeColorFeatures(colorResult);
      features.edgeDensity = this.computeEdgeDensity(edgeResult);
      features.leafType = this.classifyLeafType(features);
      features.dominantHue = this.computeDominantHue(features);
      features.width = metadata.width || 0;
      features.height = metadata.height || 0;
      features.aspectRatio = metadata.width && metadata.height ? metadata.width / metadata.height : 1;

      return features;
    } catch (error) {
      logger.warn('[HeuristicAnalysis] Feature extraction failed', { error: error.message });
      return {
        rMean: 80, gMean: 130, bMean: 50,
        rVar: 30, gVar: 40, bVar: 20,
        greenRatio: 0.5,
        redRatio: 0.0,
        yellowRatio: 0.0,
        orangeRatio: 0.0,
        brownRatio: 0.0,
        waterRatio: 0.0,
        brightness: 0.45,
        colorVariance: 30,
        edgeDensity: 35,
        leafType: 'broad',
        dominantHue: 'green',
        hueDistribution: {},
        width: 0, height: 0, aspectRatio: 1,
      };
    }
  }

  static computeColorFeatures({ data, info }) {
    const channels = info.channels;
    const totalPixels = data.length / channels;
    const width = info.width;
    const height = info.height;

    let rSum = 0, gSum = 0, bSum = 0;
    let greenPixels = 0, redPixels = 0, yellowPixels = 0, orangePixels = 0, brownPixels = 0, waterPixels = 0;
    let r2Sum = 0, g2Sum = 0, b2Sum = 0;

    const topGreen = { sum: 0, count: 0 };
    const bottomGreen = { sum: 0, count: 0 };
    const leftGreen = { sum: 0, count: 0 };
    const rightGreen = { sum: 0, count: 0 };
    const centerGreen = { sum: 0, count: 0 };
    const midY = Math.floor(height / 2);
    const midX = Math.floor(width / 2);
    const quarterY = Math.floor(height / 4);
    const quarterX = Math.floor(width / 4);

    const hueBins = { red: 0, orange: 0, yellow: 0, green: 0, cyan: 0, blue: 0, magenta: 0 };

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1] || 0;
      const b = data[i + 2] || 0;

      rSum += r; gSum += g; bSum += b;
      r2Sum += r * r; g2Sum += g * g; b2Sum += b * b;

      const isGreen = g > r && g > b;
      if (isGreen) greenPixels++;

      const pixelIdx = i / channels;
      const y = Math.floor(pixelIdx / width);
      const x = pixelIdx % width;

      if (y < midY) { topGreen.sum += isGreen ? 1 : 0; topGreen.count++; }
      else { bottomGreen.sum += isGreen ? 1 : 0; bottomGreen.count++; }
      if (x < midX) { leftGreen.sum += isGreen ? 1 : 0; leftGreen.count++; }
      else { rightGreen.sum += isGreen ? 1 : 0; rightGreen.count++; }
      if (x > quarterX && x < quarterX * 3 && y > quarterY && y < quarterY * 3) {
        centerGreen.sum += isGreen ? 1 : 0; centerGreen.count++;
      }

      if (r > 150 && g < 100 && b < 100) redPixels++;
      if (r > 180 && g > 150 && b < 100) yellowPixels++;
      if (r > 180 && g > 100 && b < 50) orangePixels++;
      if (r > 120 && g < 100 && b < 60) brownPixels++;
      if (b > 120 && g > b * 0.7 && r < b * 0.8) waterPixels++;

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const delta = maxC - minC;
      if (delta > 30 && maxC > 80) {
        let hue;
        if (maxC === r) hue = ((g - b) / delta + 6) % 6;
        else if (maxC === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
        hue = hue * 60;

        if (hue < 15 || hue >= 345) hueBins.red++;
        else if (hue < 40) hueBins.orange++;
        else if (hue < 70) hueBins.yellow++;
        else if (hue < 160) hueBins.green++;
        else if (hue < 200) hueBins.cyan++;
        else if (hue < 270) hueBins.blue++;
        else hueBins.magenta++;
      }
    }

    const rMean = rSum / totalPixels;
    const gMean = gSum / totalPixels;
    const bMean = bSum / totalPixels;

    const rVar = Math.sqrt(Math.max(0, r2Sum / totalPixels - rMean * rMean));
    const gVar = Math.sqrt(Math.max(0, g2Sum / totalPixels - gMean * gMean));
    const bVar = Math.sqrt(Math.max(0, b2Sum / totalPixels - bMean * bMean));

    const greenRatio = greenPixels / totalPixels;
    const redRatio = redPixels / totalPixels;
    const yellowRatio = yellowPixels / totalPixels;
    const orangeRatio = orangePixels / totalPixels;
    const brownRatio = brownPixels / totalPixels;
    const waterRatio = waterPixels / totalPixels;
    const brightness = (rMean * 0.299 + gMean * 0.587 + bMean * 0.114) / 255;
    const colorVariance = (rVar + gVar + bVar) / 3;

    const topGreenRatio = topGreen.count > 0 ? topGreen.sum / topGreen.count : 0;
    const bottomGreenRatio = bottomGreen.count > 0 ? bottomGreen.sum / bottomGreen.count : 0;
    const leftGreenRatio = leftGreen.count > 0 ? leftGreen.sum / leftGreen.count : 0;
    const rightGreenRatio = rightGreen.count > 0 ? rightGreen.sum / rightGreen.count : 0;
    const centerGreenRatio = centerGreen.count > 0 ? centerGreen.sum / centerGreen.count : 0;

    const zoneColorVariance = Math.abs(topGreenRatio - bottomGreenRatio) + Math.abs(leftGreenRatio - rightGreenRatio);
    const centerSurroundRatio = centerGreenRatio > 0 ? Math.abs(centerGreenRatio - (topGreenRatio + bottomGreenRatio) / 2) : 0;

    const totalHuePixels = Object.values(hueBins).reduce((a, b) => a + b, 0);
    const hueDistribution = {};
    for (const [hue, count] of Object.entries(hueBins)) {
      hueDistribution[hue] = totalHuePixels > 0 ? count / totalHuePixels : 0;
    }

    const greenRedRatio = greenRatio > 0 ? redRatio / greenRatio : 0;
    const greenYellowRatio = greenRatio > 0 ? yellowRatio / greenRatio : 0;
    const greenOrangeRatio = greenRatio > 0 ? orangeRatio / greenRatio : 0;
    const redGreenDiff = Math.abs(rMean - gMean);
    const greenBlueDiff = Math.abs(gMean - bMean);

    return {
      rMean, gMean, bMean,
      rVar, gVar, bVar,
      greenRatio,
      redRatio,
      yellowRatio,
      orangeRatio,
      brownRatio,
      waterRatio,
      brightness,
      colorVariance,
      topGreenRatio,
      bottomGreenRatio,
      leftGreenRatio,
      rightGreenRatio,
      centerGreenRatio,
      zoneColorVariance,
      centerSurroundRatio,
      hueDistribution,
      greenRedRatio,
      greenYellowRatio,
      greenOrangeRatio,
      redGreenDiff,
      greenBlueDiff,
      edgeDensity: 0,
      leafType: 'broad',
      dominantHue: 'green',
    };
  }

  static computeEdgeDensity({ data, info }) {
    const w = info.width;
    const h = info.height;
    let edgeSum = 0;
    let edgeCount = 0;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const center = data[idx];
        const left = data[idx - 1];
        const right = data[idx + 1];
        const top = data[idx - w];
        const bottom = data[idx + w];

        const gx = Math.abs(right - left);
        const gy = Math.abs(bottom - top);
        edgeSum += Math.sqrt(gx * gx + gy * gy);
        edgeCount++;
      }
    }

    return edgeCount > 0 ? Math.min(100, (edgeSum / edgeCount) * 2) : 30;
  }

  static classifyLeafType(features) {
    const { edgeDensity, greenRatio, colorVariance, zoneColorVariance } = features;

    if (edgeDensity > 50 && greenRatio > 0.40) return 'narrow';
    if (edgeDensity > 30 && edgeDensity <= 50 && colorVariance < 30) return 'compound';
    if (edgeDensity < 18) return 'palm';
    return 'broad';
  }

  static computeDominantHue(features) {
    const { hueDistribution } = features;
    let maxHue = 'green';
    let maxCount = 0;
    for (const [hue, count] of Object.entries(hueDistribution)) {
      if (count > maxCount) { maxCount = count; maxHue = hue; }
    }
    return maxHue;
  }

  static matchCrop(features, parcelContext) {
    const {
      greenRatio, redRatio, yellowRatio, orangeRatio, brownRatio,
      brightness, edgeDensity, colorVariance, leafType, waterRatio,
      zoneColorVariance, centerSurroundRatio, hueDistribution,
      greenRedRatio, greenYellowRatio, greenOrangeRatio,
      redGreenDiff, greenBlueDiff, dominantHue,
    } = features;

    if (greenRatio < 0.10) {
      return { crop: 'Plante inconnue', confidence: 10 };
    }

    let bestMatch = { crop: 'Legumes', confidence: 25 };
    let bestScore = 0;

    for (const [crop, profile] of Object.entries(CROP_PROFILES)) {
      let score = 0;
      let totalWeight = 0;

      const greenMid = (profile.greenRatio.min + profile.greenRatio.max) / 2;
      const greenRange = (profile.greenRatio.max - profile.greenRatio.min) / 2;
      const greenMatch = 1 - Math.min(1, Math.abs(greenRatio - greenMid) / (greenRange || 0.15));
      score += greenMatch * profile.greenRatio.weight;
      totalWeight += profile.greenRatio.weight;

      if (profile.redRatio) {
        const redMid = (profile.redRatio.min + profile.redRatio.max) / 2;
        const redRange = (profile.redRatio.max - profile.redRatio.min) / 2 || 0.03;
        const redMatch = 1 - Math.min(1, Math.abs(redRatio - redMid) / redRange);
        score += redMatch * profile.redRatio.weight;
        totalWeight += profile.redRatio.weight;
      }

      if (profile.yellowRatio) {
        const yellowMid = (profile.yellowRatio.min + profile.yellowRatio.max) / 2;
        const yellowRange = (profile.yellowRatio.max - profile.yellowRatio.min) / 2 || 0.03;
        const yellowMatch = 1 - Math.min(1, Math.abs(yellowRatio - yellowMid) / yellowRange);
        score += yellowMatch * profile.yellowRatio.weight;
        totalWeight += profile.yellowRatio.weight;
      }

      if (profile.orangeRatio) {
        const orangeMid = (profile.orangeRatio.min + profile.orangeRatio.max) / 2;
        const orangeRange = (profile.orangeRatio.max - profile.orangeRatio.min) / 2 || 0.03;
        const orangeMatch = 1 - Math.min(1, Math.abs(orangeRatio - orangeMid) / orangeRange);
        score += orangeMatch * profile.orangeRatio.weight;
        totalWeight += profile.orangeRatio.weight;
      }

      if (profile.brownRatio) {
        const brownMid = (profile.brownRatio.min + profile.brownRatio.max) / 2;
        const brownRange = (profile.brownRatio.max - profile.brownRatio.min) / 2 || 0.03;
        const brownMatch = 1 - Math.min(1, Math.abs(brownRatio - brownMid) / brownRange);
        score += brownMatch * profile.brownRatio.weight;
        totalWeight += profile.brownRatio.weight;
      }

      const varMid = (profile.colorVariance.min + profile.colorVariance.max) / 2;
      const varRange = (profile.colorVariance.max - profile.colorVariance.min) / 2;
      const varMatch = 1 - Math.min(1, Math.abs(colorVariance - varMid) / (varRange || 15));
      score += varMatch * profile.colorVariance.weight;
      totalWeight += profile.colorVariance.weight;

      const edgeMid = (profile.edgeDensity.min + profile.edgeDensity.max) / 2;
      const edgeRange = (profile.edgeDensity.max - profile.edgeDensity.min) / 2;
      const edgeMatch = 1 - Math.min(1, Math.abs(edgeDensity - edgeMid) / (edgeRange || 15));
      score += edgeMatch * profile.edgeDensity.weight;
      totalWeight += profile.edgeDensity.weight;

      if (profile.leafType && profile.leafTypeWeight) {
        const leafMatch = profile.leafType === leafType ? 1 : 0;
        score += leafMatch * profile.leafTypeWeight;
        totalWeight += profile.leafTypeWeight;
      }

      if (profile.brightness) {
        const brightMid = (profile.brightness.min + profile.brightness.max) / 2;
        const brightRange = (profile.brightness.max - profile.brightness.min) / 2;
        const brightMatch = 1 - Math.min(1, Math.abs(brightness - brightMid) / (brightRange || 0.15));
        score += brightMatch * profile.brightness.weight;
        totalWeight += profile.brightness.weight;
      }

      if (profile.zoneColorVariance) {
        const zcvMid = (profile.zoneColorVariance.min + profile.zoneColorVariance.max) / 2;
        const zcvRange = (profile.zoneColorVariance.max - profile.zoneColorVariance.min) / 2 || 0.05;
        const zcvMatch = 1 - Math.min(1, Math.abs(zoneColorVariance - zcvMid) / zcvRange);
        score += zcvMatch * profile.zoneColorVariance.weight;
        totalWeight += profile.zoneColorVariance.weight;
      }

      if (profile.waterReflection && profile.waterWeight) {
        const waterMatch = waterRatio > 0.03 ? 1 : 0;
        score += waterMatch * profile.waterWeight;
        totalWeight += profile.waterWeight;
      }

      if (profile.hueWeight && profile.dominantHue) {
        let hueMatch = 0;
        if (profile.dominantHue === 'green' && hueDistribution.green > 0.40) hueMatch = 1;
        else if (profile.dominantHue === 'dark-green' && hueDistribution.green > 0.30 && brightness < 0.40) hueMatch = 1;
        else if (profile.dominantHue === 'green-red' && hueDistribution.green > 0.25 && hueDistribution.red > 0.05) hueMatch = 1;
        else if (profile.dominantHue === 'green-yellow' && hueDistribution.green > 0.25 && hueDistribution.yellow > 0.05) hueMatch = 1;
        else if (profile.dominantHue === 'green-orange' && hueDistribution.green > 0.20 && hueDistribution.orange > 0.05) hueMatch = 1;
        else if (profile.dominantHue === 'varied') hueMatch = 0.5;
        score += hueMatch * profile.hueWeight;
        totalWeight += profile.hueWeight;
      }

      if (profile.fruitPresent && (redRatio > 0.03 || yellowRatio > 0.03 || orangeRatio > 0.03)) {
        score += 5;
        totalWeight += 5;
      }
      if (!profile.fruitPresent && redRatio < 0.02 && orangeRatio < 0.02) {
        score += 3;
        totalWeight += 3;
      }

      const normalizedScore = totalWeight > 0 ? (score / totalWeight) * 100 : 0;

      if (normalizedScore > bestScore) {
        bestScore = normalizedScore;
        bestMatch = { crop, confidence: Math.min(Math.round(normalizedScore), 75) };
      }
    }

    if (parcelContext?.region) {
      const regionCrops = this.getRegionCrops(parcelContext.region);
      if (regionCrops.includes(bestMatch.crop)) {
        bestMatch.confidence = Math.min(bestMatch.confidence + 10, 85);
      }
    }

    if (bestMatch.confidence < 20) {
      bestMatch = { crop: 'Plante inconnue', confidence: Math.max(bestMatch.confidence, 15) };
    }

    return bestMatch;
  }

  static estimateHealth(features) {
    let score = 50;

    if (features.greenRatio > 0.50) score += 25;
    else if (features.greenRatio > 0.35) score += 15;
    else if (features.greenRatio > 0.20) score += 5;
    else score -= 15;

    if (features.brightness > 0.25 && features.brightness < 0.70) score += 10;
    else if (features.brightness < 0.15 || features.brightness > 0.85) score -= 10;

    if (features.gVar > 20 && features.gVar < 60) score += 5;

    if (features.edgeDensity > 15 && features.edgeDensity < 70) score += 5;

    if (features.brownRatio > 0.15) score -= 10;
    if (features.redRatio > 0.10 && features.greenRatio < 0.30) score -= 5;

    return Math.max(15, Math.min(95, score));
  }

  static estimateDiseaseRisk(features) {
    let risk = 10;

    if (features.greenRatio < 0.20) risk += 30;
    else if (features.greenRatio < 0.35) risk += 15;

    if (features.brightness > 0.75) risk += 10;
    if (features.brightness < 0.20) risk += 10;

    if (features.rMean > features.gMean * 1.2) risk += 15;

    if (features.colorVariance > 60) risk += 10;

    if (features.brownRatio > 0.15) risk += 10;

    if (features.redRatio > 0.08 && features.greenRatio < 0.30) risk += 10;

    if (features.waterRatio > 0.15) risk += 5;

    return Math.max(0, Math.min(80, risk));
  }

  static detectDeficiencies(features) {
    const deficiencies = [];

    if (features.rMean > features.gMean * 1.2) {
      deficiencies.push('Possible carence en azote (feuillage jaunatre)');
    }

    if (features.bMean > 50 && features.gMean < 90) {
      deficiencies.push('Possible carence en phosphore');
    }

    if (features.gMean < 70) {
      deficiencies.push('Chlorophylle faible - carence potentielle en magnesium');
    }

    if (features.greenRatio < 0.25) {
      deficiencies.push('Couverture vegetale faible - stress hydrique possible');
    }

    if (features.brownRatio > 0.10) {
      deficiencies.push('Feuilles brunes detectees - possible stress ou maturite avancee');
    }

    if (features.redRatio > 0.05 && features.greenRatio < 0.30) {
      deficiencies.push('Rougissement anormal - possible carence en potassium');
    }

    return deficiencies.slice(0, 3);
  }

  static estimateGrowthStage(features) {
    if (features.greenRatio < 0.15) return 'Unknown';
    if (features.greenRatio < 0.30) return 'Seedling';
    if (features.greenRatio < 0.50) return 'Vegetative';
    if (features.redRatio > 0.05 || features.yellowRatio > 0.05 || features.orangeRatio > 0.03) return 'Flowering';
    if (features.greenRatio < 0.65) return 'Flowering';
    return 'Mature';
  }

  static assessImageQuality(features) {
    if (features.width >= 1024 && features.height >= 768) return 'Good';
    if (features.width >= 640 && features.height >= 480) return 'Acceptable';
    return 'Poor';
  }

  static suggestDisease(risk, features) {
    if (risk > 60) return 'Mildiou possible';
    if (features.rMean > features.gMean * 1.2) return 'Chlorose (jaunissement)';
    if (features.greenRatio < 0.25) return 'Stress vegetal detecte';
    if (features.brownRatio > 0.10) return 'Necrose foliaire possible';
    if (features.redRatio > 0.08 && features.greenRatio < 0.30) return 'Anthracnose possible';
    return 'Stress vegetal detecte';
  }

  static generateRecommendations(crop, health, diseaseRisk, deficiencies, parcelContext) {
    const recs = [];

    if (diseaseRisk > 50) {
      recs.push({ category: 'ALERTE MALADIE', priority: 'high', text: 'Risque de maladie detecte. Inspection visuelle recommandee' });
    }

    if (crop.crop !== 'Plante inconnue') {
      recs.push({ category: 'Culture', priority: 'medium', text: `Culture detectee: ${crop.crop}. Verifier sur le terrain` });
    }

    if (deficiencies.length > 0) {
      recs.push({ category: 'Nutriments', priority: 'medium', text: `Carences possibles: ${deficiencies.join(', ')}` });
    }

    if (health < 40) {
      recs.push({ category: 'Sante', priority: 'high', text: 'Sante de la culture faible. Intervention recommandee' });
    }

    if (parcelContext?.soil_type) {
      recs.push({ category: 'Sol', priority: 'low', text: `Type de sol: ${parcelContext.soil_type}. Adapter les pratiques` });
    }

    recs.push({ category: 'Information', priority: 'low', text: 'Analyse heuristique par vision par ordinateur. Pour une analyse plus precise, activez Gemini AI' });

    return recs;
  }

  static getRegionCrops(region) {
    const regionMap = {
      'Analamanga': ['Riz', 'Legumes', 'Tomate'],
      'Vakinankaratra': ['Pomme de terre', 'Legumes', 'Tomate'],
      'Haute Matsiatra': ['Riz', 'Manioc', 'Mais'],
      'Atsimo-Atsinanana': ['Vanille', 'Cacao', 'Poivre', 'Girofle', 'Litchi'],
      'Boeny': ['Mais', 'Manioc'],
      'Diana': ['Cacao', 'Vanille', 'Cafe'],
      'Sava': ['Vanille', 'Cafe', 'Cacao', 'Poivre'],
      'Alaotra-Mangoro': ['Riz', 'Legumes', 'Cafe'],
    };
    return regionMap[region] || ['Riz', 'Manioc', 'Mais'];
  }
}

module.exports = HeuristicAnalysisService;
