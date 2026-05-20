const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
const logger = require('../utils/logger');
const BudgetManagementService = require('./budgetManagementService');
const AuditLogService = require('./auditLogService');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 20000;  // 20 second timeout
const IMAGE_FETCH_TIMEOUT_MS = 10000; // 10 second timeout for image fetch

if (!GEMINI_API_KEY) {
  logger.warn('[GeminiVision] GEMINI_API_KEY not set. AI analysis will use fallback mode.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const ANALYSIS_PROMPT = `You are an expert agricultural vision AI. Analyze the image carefully and identify the exact plant or crop shown.

You must:
- Detect ANY type of plant or crop (not only common crops like maize or rice)
- Be precise and avoid defaulting to common crops
- If multiple plants exist, list the most prominent one as primary
- If the image does not clearly show a plant, set is_plant to false
- Base your answer ONLY on visible visual features (leaf shape, color, structure, growth pattern)

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, just raw JSON):

{
  "detected_crop": "Name of the detected plant/crop in French. Use the most specific name possible. If it is a known crop, use its common French name. If unknown or unclear, use 'Plante inconnue'.",
  "confidence_score": 0-100 integer representing how confident you are in the identification based on visible features",
  "plant_type": "crop | tree | herb | vine | weed | unknown",
  "health_score": 0-100 integer representing overall plant health (leaf color, wilting, damage)",
  "disease_detected": "Name of detected disease in French or null if none visible",
  "disease_risk": 0-100 integer representing disease severity (0 if no disease)",
  "nutrient_deficiencies": ["List of visible nutrient deficiency signs in French, or empty array if none"],
  "growth_stage": "Seedling|Vegetative|Flowering|Fruiting|Mature|Unknown",
  "recommendations": ["Array of 3-5 specific agronomic recommendations in French based on what you see"],
  "is_plant": true or false,
  "image_quality": "Good|Acceptable|Poor"
}

Important rules:
- detected_crop should be the SPECIFIC plant name you observe. Do NOT force it into a predefined list. Examples: "Riz", "Vanille", "Cafe", "Manioc", "Mais", "Tomate", "Banane", "Cacao", "Poivre", "Girofle", "Litchi", "Pomme de terre", "Canne a sucre", "Arachide", "Patate douce", "Gingembre", "Curcuma", "Ananas", "Mangue", "Agrumes", "Eucalyptus", "Acacia", "Herbe", "Fougere", "Plante inconnue", etc.
- confidence_score must reflect your actual certainty. Low confidence if features are unclear.
- If the image shows no plant at all (building, sky, ground only), set is_plant to false and detected_crop to "Plante inconnue"
- Recommendations must be specific, actionable agricultural advice based on what you actually see
- Return ONLY the JSON object, nothing else`;

class GeminiVisionService {
  static async analyzeImage(imageUrl, userId = null) {
    const startTime = Date.now();

    if (!genAI) {
      logger.warn('[GeminiVision] No API key, using fallback analysis');
      const result = this.fallbackAnalysis(imageUrl);
      
      if (userId) {
        await AuditLogService.logAnalysisAttempt({
          userId,
          imageUrl,
          status: 'fallback',
          modelUsed: 'fallback',
          responseTimeMs: Date.now() - startTime,
        });
      }
      
      return result;
    }

    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = this.calculateRetryDelay(lastError, attempt);
        logger.info('[GeminiVision] Retry attempt', { attempt, delayMs: delay });
        await this.sleep(delay);
      }

      try {
        // Timeout wrapper
        const analysisPromise = this.performAnalysis(imageUrl);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Analysis timeout after 20 seconds')), REQUEST_TIMEOUT_MS)
        );

        const result = await Promise.race([analysisPromise, timeoutPromise]);
        const responseTimeMs = Date.now() - startTime;

        logger.info('[GeminiVision] Analysis complete', {
          crop: result.detected_crop,
          confidence: result.confidence_score,
          responseTimeMs,
        });

        if (userId) {
          await AuditLogService.logAnalysisAttempt({
            userId,
            imageUrl,
            status: 'completed',
            aiResult: result,
            modelUsed: 'gemini-2.0-flash',
            responseTimeMs,
            costUsd: 0.05,
          });
          await BudgetManagementService.recordCost(userId, 0.05);
        }

        return result;
      } catch (error) {
        lastError = error;

        logger.error('[GeminiVision] Analysis failed', {
          attempt: attempt + 1,
          message: error.message,
          code: error.code,
        });

        if (error.message.includes('API_KEY') || error.message.includes('API key')) {
          logger.error('[GeminiVision] Invalid API key, not retrying');
          const result = this.fallbackAnalysis(imageUrl);
          if (userId) {
            await AuditLogService.logAnalysisAttempt({
              userId,
              imageUrl,
              status: 'fallback',
              modelUsed: 'fallback',
              responseTimeMs: Date.now() - startTime,
            });
          }
          return result;
        }

        if (error.message.includes('403') || error.message.includes('PERMISSION_DENIED')) {
          logger.error('[GeminiVision] Permission denied, not retrying');
          const result = this.fallbackAnalysis(imageUrl);
          if (userId) {
            await AuditLogService.logAnalysisAttempt({
              userId,
              imageUrl,
              status: 'fallback',
              error: 'Permission denied',
              modelUsed: 'fallback',
              responseTimeMs: Date.now() - startTime,
            });
          }
          return result;
        }

        const isRateLimit = error.message.includes('429') ||
          error.message.includes('quota') ||
          error.message.includes('Quota exceeded') ||
          error.message.includes('Too Many Requests');

        if (!isRateLimit && attempt < MAX_RETRIES) {
          logger.warn('[GeminiVision] Non-retryable error, falling back');
          const result = this.fallbackAnalysis(imageUrl);
          if (userId) {
            await AuditLogService.logAnalysisAttempt({
              userId,
              imageUrl,
              status: 'fallback',
              error: error.message,
              modelUsed: 'fallback',
              responseTimeMs: Date.now() - startTime,
            });
          }
          return result;
        }

        if (isRateLimit && attempt === MAX_RETRIES) {
          logger.error('[GeminiVision] Rate limit exceeded after retries');
          const result = this.fallbackAnalysis(imageUrl);
          if (userId) {
            await AuditLogService.logAnalysisAttempt({
              userId,
              imageUrl,
              status: 'fallback',
              error: 'Rate limit exceeded',
              modelUsed: 'fallback',
              responseTimeMs: Date.now() - startTime,
            });
          }
          return result;
        }
      }
    }

    logger.error('[GeminiVision] All retries exhausted, using fallback');
    const result = this.fallbackAnalysis(imageUrl);
    if (userId) {
      await AuditLogService.logAnalysisAttempt({
        userId,
        imageUrl,
        status: 'fallback',
        error: 'Max retries exceeded',
        modelUsed: 'fallback',
        responseTimeMs: Date.now() - startTime,
      });
    }
    return result;
  }

  /**
   * Perform the actual analysis
   */
  static async performAnalysis(imageUrl) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Fetch image with timeout
    const imageFetchPromise = this.fetchImageAsBase64(imageUrl);
    const imageFetchTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Image fetch timeout')), IMAGE_FETCH_TIMEOUT_MS)
    );
    
    const imageBuffer = await Promise.race([imageFetchPromise, imageFetchTimeout]);

    const result = await model.generateContent([
      ANALYSIS_PROMPT,
      {
        inlineData: {
          data: imageBuffer.base64,
          mimeType: imageBuffer.mimeType,
        },
      },
    ]);

    const responseText = result.response.text().trim();

    logger.info('[GeminiVision] Raw AI response received', {
      responseLength: responseText.length,
      first200: responseText.substring(0, 200),
    });

    const parsed = this.parseAIResponse(responseText);

    if (!parsed) {
      logger.error('[GeminiVision] Failed to parse AI response');
      throw new Error('Failed to parse AI response');
    }

    return parsed;
  }

  static calculateRetryDelay(error, attempt) {
    const retryMatch = error?.message?.match(/retry in (\d+(?:\.\d+)?)s/i);

    if (retryMatch) {
      const serverDelay = parseFloat(retryMatch[1]) * 1000;
      return Math.min(serverDelay + 1000, 60000);
    }

    return Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1), 30000);
  }

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async fetchImageAsBase64(imageUrl) {
    return new Promise((resolve, reject) => {
      const makeRequest = (url, redirects = 0) => {
        if (redirects > 5) {
          return reject(new Error('Too many redirects'));
        }

        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : require('http');

        client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return makeRequest(response.headers.location, redirects + 1);
          }

          if (response.statusCode !== 200) {
            return reject(new Error(`Failed to fetch image: HTTP ${response.statusCode}`));
          }

          const contentType = response.headers['content-type'] || 'image/jpeg';
          const chunks = [];

          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            if (buffer.length === 0) {
              return reject(new Error('Empty image response'));
            }
            if (buffer.length > 10 * 1024 * 1024) {
              return reject(new Error('Image too large (max 10MB)'));
            }
            const base64 = buffer.toString('base64');
            resolve({ base64, mimeType: contentType.split(';')[0].trim() });
          });
        }).on('error', reject);
      };

      makeRequest(imageUrl);
    });
  }

  static parseAIResponse(text) {
    try {
      let jsonStr = text;

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      const parsed = JSON.parse(jsonStr);

      return this.normalizeResponse(parsed);
    } catch (error) {
      logger.error('[GeminiVision] JSON parse error', {
        message: error.message,
        textSnippet: text.substring(0, 500),
      });
      return null;
    }
  }

  static normalizeResponse(raw) {
    const KNOWN_CROPS = [
      'Riz', 'Vanille', 'Cafe', 'Manioc', 'Mais', 'Tomate', 'Banane',
      'Cacao', 'Poivre', 'Girofle', 'Litchi', 'Pomme de terre',
      'Canne a sucre', 'Arachide', 'Legumes', 'Agrumes',
      'Patate douce', 'Gingembre', 'Curcuma', 'Ananas', 'Mangue',
      'Eucalyptus', 'Acacia', 'Coton', 'Tabac', 'Tournesol',
      'Soja', 'Haricot', 'Pois', 'Citron', 'Orange', 'Mandarine',
      'Plante inconnue', 'Herbe', 'Fougere', 'Inconnu',
    ];

    let detectedCrop = raw.detected_crop || 'Plante inconnue';
    detectedCrop = detectedCrop.trim();

    if (detectedCrop.toLowerCase() === 'unknown' || detectedCrop.toLowerCase() === 'unknown plant') {
      detectedCrop = 'Plante inconnue';
    }

    const fuzzyMatch = KNOWN_CROPS.find((c) => {
      const lower = c.toLowerCase();
      const input = detectedCrop.toLowerCase();
      return lower === input || lower.includes(input) || input.includes(lower);
    });
    if (fuzzyMatch) {
      detectedCrop = fuzzyMatch;
    }

    const confidence = Math.max(0, Math.min(100, parseInt(raw.confidence_score) || 0));
    const health = Math.max(0, Math.min(100, parseInt(raw.health_score) || 0));
    const diseaseRisk = Math.max(0, Math.min(100, parseInt(raw.disease_risk) || 0));

    const disease = raw.disease_detected && raw.disease_detected !== 'null' && raw.disease_detected !== 'None'
      ? raw.disease_detected.trim()
      : null;

    const deficiencies = Array.isArray(raw.nutrient_deficiencies)
      ? raw.nutrient_deficiencies.filter((d) => d && d.trim()).map((d) => d.trim())
      : [];

    const recommendations = Array.isArray(raw.recommendations)
      ? raw.recommendations.filter((r) => r && r.trim()).slice(0, 5).map((r) => r.trim())
      : [];

    if (recommendations.length === 0) {
      recommendations.push('Consulter un agronome local pour des recommandations specifiques');
    }

    const growthStage = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Mature', 'Unknown'].includes(raw.growth_stage)
      ? raw.growth_stage
      : 'Unknown';

    const imageQuality = ['Good', 'Acceptable', 'Poor'].includes(raw.image_quality)
      ? raw.image_quality
      : 'Acceptable';

    const validPlantTypes = ['crop', 'tree', 'herb', 'vine', 'weed', 'unknown'];
    const plantType = validPlantTypes.includes(raw.plant_type) ? raw.plant_type : 'unknown';

    return {
      detected_crop: detectedCrop,
      confidence_score: confidence,
      health_score: health,
      disease_detected: disease,
      disease_risk: disease === null ? 0 : diseaseRisk,
      nutrient_deficiencies: deficiencies,
      growth_stage: growthStage,
      recommendations,
      is_plant: raw.is_plant !== false,
      image_quality: imageQuality,
      plant_type: plantType,
    };
  }

  static fallbackAnalysis(imageUrl) {
    logger.info('[GeminiVision] Using fallback analysis', { imageUrl });

    return {
      detected_crop: 'Plante inconnue',
      confidence_score: 0,
      health_score: 50,
      disease_detected: null,
      disease_risk: 0,
      nutrient_deficiencies: [],
      growth_stage: 'Unknown',
      recommendations: [
        'Service d\'analyse IA temporairement indisponible',
        'Veuillez reessayer plus tard ou consulter un agronome local',
      ],
      is_plant: true,
      image_quality: 'Acceptable',
      fallback: true,
    };
  }
}

module.exports = GeminiVisionService;
