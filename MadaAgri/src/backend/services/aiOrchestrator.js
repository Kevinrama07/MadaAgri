const GeminiVisionService = require('./geminiVisionService');
const HeuristicAnalysisService = require('./heuristicAnalysisService');
const AnalysisValidationService = require('./analysisValidationService');
const AgronomicIntelligenceService = require('./agronomicIntelligenceService');
const ImageProcessor = require('./imageProcessor');
const CacheService = require('./cacheService');
const logger = require('../utils/logger');

const AI_SOURCE_GEMINI = 'gemini-2.0-flash';
const AI_SOURCE_HEURISTIC = 'heuristic';
const AI_SOURCE_OFFLINE = 'offline-model';
const OFFLINE_AI_URL = process.env.OFFLINE_AI_URL || 'http://localhost:8000';

class AIOrchestrator {
  constructor() {
    this.initialized = false;
    this.geminiAvailable = null;
    this.offlineAiAvailable = null;
    this.lastCheck = 0;
    this.checkInterval = 300000;
  }

  async init() {
    if (this.initialized) return;
    await CacheService.init();
    this.initialized = true;
    logger.info('[AIOrchestrator] Initialized');
  }

  async analyze(imageUrl, options = {}) {
    if (!this.initialized) await this.init();

    const { userId, parcelId, parcelContext } = options;

    const urlHash = require('crypto').createHash('sha256').update(imageUrl).digest('hex');
    const cached = await CacheService.get(urlHash);
    if (cached) {
      logger.info('[AIOrchestrator] Cache hit (URL)', { hash: urlHash.substring(0, 12) });
      return { ...cached, cached: true };
    }

    const image = await ImageProcessor.processImage(imageUrl);
    logger.info('[AIOrchestrator] Image processed', {
      hash: image.hash.substring(0, 12),
      originalSize: image.originalSize,
      compressedSize: image.compressedSize,
    });

    const contentCached = await CacheService.get(image.hash);
    if (contentCached) {
      logger.info('[AIOrchestrator] Cache hit (content)', { hash: image.hash.substring(0, 12) });
      await CacheService.set(urlHash, contentCached);
      return { ...contentCached, cached: true };
    }

    let result = null;
    let aiSource = AI_SOURCE_HEURISTIC;

    const geminiReady = await this.isGeminiAvailable();
    if (geminiReady) {
      try {
        result = await GeminiVisionService.analyzeImage(imageUrl, userId);
        aiSource = AI_SOURCE_GEMINI;
        logger.info('[AIOrchestrator] Gemini analysis successful');
      } catch (geminiError) {
        logger.warn('[AIOrchestrator] Gemini failed, using heuristic fallback', { error: geminiError.message });
      }
    }

    if (!result) {
      result = await HeuristicAnalysisService.analyzeFromBuffer(image.compressedBuffer, image.mimeType, parcelContext);
      aiSource = AI_SOURCE_HEURISTIC;
    }

    const validation = AnalysisValidationService.validateAnalysisResult(result);
    if (!validation.valid) {
      logger.error('[AIOrchestrator] Validation failed, using safe fallback');
      result = this.safeFallback(parcelContext);
      aiSource = AI_SOURCE_HEURISTIC;
    }

    const sanitized = AnalysisValidationService.sanitizeForStorage(result);
    const anomalies = AnalysisValidationService.detectAnomalies(sanitized);

    const recommendations = AgronomicIntelligenceService.generateRecommendations(sanitized, parcelContext);
    const economicEstimate = AgronomicIntelligenceService.getEconomicEstimate(
      sanitized.detected_crop,
      sanitized.health_score,
      parcelContext?.region
    );

    const finalResult = {
      ...sanitized,
      recommendations,
      economic_estimate: economicEstimate,
      growth_stage_label: AgronomicIntelligenceService.getGrowthStageLabel(sanitized.growth_stage),
      health_label: AgronomicIntelligenceService.getHealthLabel(sanitized.health_score),
      disease_risk_level: sanitized.disease_detected
        ? AgronomicIntelligenceService.getDiseaseRiskLevel(sanitized.disease_risk)
        : null,
      anomalies,
      warnings: validation.warnings,
      ai_source: aiSource,
      analysis_precision: aiSource === AI_SOURCE_GEMINI ? 'high' : 'low',
      image_hash: image.hash,
      fallback: aiSource === AI_SOURCE_HEURISTIC && sanitized.confidence_score < 30,
    };

    await CacheService.set(image.hash, finalResult);
    await CacheService.set(urlHash, finalResult);

    logger.info('[AIOrchestrator] Analysis complete', {
      crop: sanitized.detected_crop,
      confidence: sanitized.confidence_score,
      aiSource,
      cached: false,
    });

    return finalResult;
  }

  async callOfflineAi(imageUrl, parcelContext) {
    const https = require('https');
    const http = require('http');

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        image_url: imageUrl,
        parcel_context: parcelContext,
      });

      const urlObj = new URL(OFFLINE_AI_URL + '/analyze-url');
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.request(OFFLINE_AI_URL + '/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 15000,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode !== 200) {
            return reject(new Error(`Offline AI returned ${res.statusCode}`));
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse offline AI response'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Offline AI timeout')); });
      req.write(postData);
      req.end();
    });
  }

  async isGeminiAvailable() {
    if (this.lastCheck > Date.now() - this.checkInterval && this.geminiAvailable !== null) {
      return this.geminiAvailable;
    }

    if (!process.env.GEMINI_API_KEY) {
      this.geminiAvailable = false;
      this.lastCheck = Date.now();
      return false;
    }

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'test' }] }] });
      this.geminiAvailable = true;
    } catch (error) {
      const isQuota = error.message.includes('429') || error.message.includes('quota') || error.message.includes('Quota exceeded') || error.message.includes('Too Many Requests');
      this.geminiAvailable = !isQuota;
      if (isQuota) {
        logger.warn('[AIOrchestrator] Gemini quota exceeded, will use heuristic fallback');
      }
    }

    this.lastCheck = Date.now();
    return this.geminiAvailable;
  }

  async isOfflineAiAvailable() {
    if (this.lastCheck > Date.now() - this.checkInterval && this.offlineAiAvailable !== null) {
      return this.offlineAiAvailable;
    }

    try {
      const https = require('https');
      const http = require('http');
      const urlObj = new URL(OFFLINE_AI_URL + '/health');
      const client = urlObj.protocol === 'https:' ? https : http;

      return new Promise((resolve) => {
        const req = client.get(OFFLINE_AI_URL + '/health', { timeout: 3000 }, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            this.offlineAiAvailable = res.statusCode === 200;
            resolve(this.offlineAiAvailable);
          });
        });
        req.on('error', () => { this.offlineAiAvailable = false; resolve(false); });
        req.on('timeout', () => { req.destroy(); this.offlineAiAvailable = false; resolve(false); });
      });
    } catch {
      this.offlineAiAvailable = false;
      return false;
    }
  }

  safeFallback(parcelContext) {
    const recs = ['Service IA temporairement indisponible. Veuillez reessayer plus tard.'];
    if (parcelContext?.region) {
      recs.push(`Region: ${parcelContext.region}. Consulter un agronome local.`);
    }

    return {
      detected_crop: 'Inconnu',
      confidence_score: 0,
      health_score: 50,
      disease_detected: null,
      disease_risk: 0,
      nutrient_deficiencies: [],
      growth_stage: 'Unknown',
      recommendations: recs,
      is_plant: true,
      image_quality: 'Acceptable',
    };
  }

  getSystemStatus() {
    return {
      geminiAvailable: this.geminiAvailable,
      offlineAiAvailable: this.offlineAiAvailable,
      offlineAiUrl: OFFLINE_AI_URL,
      cacheStats: CacheService.getStats(),
      initialized: this.initialized,
    };
  }
}

module.exports = new AIOrchestrator();
