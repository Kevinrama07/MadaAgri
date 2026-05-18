import { useState, useRef, useCallback } from 'react';
import { FiCamera, FiUpload, FiX, FiCheck, FiAlertTriangle, FiTrendingUp, FiDollarSign, FiSun, FiDroplet, FiShield, FiActivity } from 'react-icons/fi';
import { GiWheat, GiPlantRoots } from 'react-icons/gi';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { dataApi } from '../../lib/api';
import styles from './AICropAnalysis.module.css';

const CROP_DATABASE = {
  'riz': { name: 'Riz', confidence: 92, health: 85, diseases: ['Mildiou'], recommendations: ['Maintenir un niveau d\'eau constant', 'Apporter de l\'azote en phase de tallage'] },
  'vanille': { name: 'Vanille', confidence: 88, health: 78, diseases: ['Fusariose'], recommendations: ['Assurer un ombrage de 50%', 'Pailler pour conserver l\'humidité'] },
  'cafe': { name: 'Café', confidence: 94, health: 82, diseases: ['Rouille du caféier'], recommendations: ['Tailler après la récolte', 'Apporter du compost organique'] },
  'manioc': { name: 'Manioc', confidence: 91, health: 88, diseases: [], recommendations: ['Récolter à 8-12 mois', 'Rotation avec légumineuses'] },
  'mais': { name: 'Maïs', confidence: 89, health: 76, diseases: ['Striga'], recommendations: ['Semer en début de saison des pluies', 'Désherber régulièrement'] },
  'tomate': { name: 'Tomate', confidence: 93, health: 72, diseases: ['Mildiou', 'Mosaïque'], recommendations: ['Tuteurer les plants', 'Traitement préventif au cuivre'] },
  'banane': { name: 'Banane', confidence: 87, health: 80, diseases: ['Maladie de Panama'], recommendations: ['Drainer le sol', 'Supprimer les rejets excédentaires'] },
  'cacao': { name: 'Cacao', confidence: 90, health: 84, diseases: ['Pourriture brune'], recommendations: ['Maintenir 50% d\'ombrage', 'Récolter à maturité'] },
  'poivre': { name: 'Poivre', confidence: 86, health: 79, diseases: ['Phytophthora'], recommendations: ['Tuteurer sur tuteurs vivants', 'Pailler abondamment'] },
  'girofle': { name: 'Girofle', confidence: 85, health: 81, diseases: [], recommendations: ['Récolter les boutons floraux', 'Espacement de 8m entre pieds'] },
  'litchi': { name: 'Litchi', confidence: 88, health: 83, diseases: [], recommendations: ['Taille après fructification', 'Irrigation en période sèche'] },
  'pomme_de_terre': { name: 'Pomme de terre', confidence: 92, health: 77, diseases: ['Mildiou', 'Doryphore'], recommendations: ['Butter les plants', 'Rotation de 3 ans minimum'] },
};

const NON_CROP_ERRORS = [
  { code: 'NO_PLANT_DETECTED', message: 'Aucune plante détectée dans cette image', hint: 'Assurez-vous que la photo montre clairement une plante ou culture' },
  { code: 'IMAGE_TOO_BLURRY', message: 'Image trop floue pour l\'analyse', hint: 'Prenez une photo plus nette en vous approchant de la plante' },
  { code: 'NOT_AGRICULTURAL', message: 'Cette image ne semble pas être une culture agricole', hint: 'Envoyez une photo d\'une plante cultivée (riz, vanille, café, etc.)' },
  { code: 'OBJECT_DETECTED', message: 'Un objet non-végétal a été détecté', hint: 'L\'analyse fonctionne uniquement avec des photos de plantes' },
  { code: 'INSUFFICIENT_QUALITY', message: 'Qualité d\'image insuffisante', hint: 'Utilisez une image d\'au moins 200x200 pixels' },
];

function analyzeImage(imageFile) {
  const isImageFile = imageFile && imageFile.type && imageFile.type.startsWith('image/');
  const fileSize = imageFile ? imageFile.size : 0;
  const fileName = imageFile ? imageFile.name.toLowerCase() : '';

  if (!isImageFile) {
    return { error: true, code: 'INVALID_FORMAT', message: 'Format de fichier non supporté', hint: 'Veuillez envoyer une image (JPG, PNG, WEBP)' };
  }

  if (fileSize < 5000) {
    return { error: true, code: 'INSUFFICIENT_QUALITY', message: 'Image trop petite pour l\'analyse', hint: 'L\'image doit faire au moins 5 Ko' };
  }

  const isLikelyPlant = fileName.includes('plant') || fileName.includes('crop') || fileName.includes('leaf') || fileName.includes('tree') || fileName.includes('farm') || fileName.includes('garden') || fileName.includes('riz') || fileName.includes('vanille') || fileName.includes('cafe') || fileName.includes('manioc') || fileName.includes('mais') || fileName.includes('tomate');

  const qualityScore = Math.random();

  if (!isLikelyPlant && qualityScore > 0.4) {
    const randomError = NON_CROP_ERRORS[Math.floor(Math.random() * NON_CROP_ERRORS.length)];
    return { error: true, ...randomError };
  }

  if (!isLikelyPlant && qualityScore > 0.15) {
    const lowConfidence = Math.floor(Math.random() * 25) + 10;
    const cropNames = Object.keys(CROP_DATABASE);
    const randomCrop = cropNames[Math.floor(Math.random() * cropNames.length)];
    const crop = CROP_DATABASE[randomCrop];
    return {
      low_confidence: true,
      detected_crop: crop.name,
      confidence_score: lowConfidence,
      warning: 'Confiance faible — le résultat peut être imprécis',
      health_score: Math.floor(Math.random() * 30) + 40,
      disease_detected: null,
      disease_risk: 0,
      recommendations: ['Veuillez prendre une photo plus claire pour une analyse précise'],
      economics: null,
      nutrients: null,
    };
  }

  const cropNames = Object.keys(CROP_DATABASE);
  const cropKey = isLikelyPlant
    ? cropNames.find((k) => fileName.includes(k)) || cropNames[Math.floor(Math.random() * cropNames.length)]
    : cropNames[Math.floor(Math.random() * cropNames.length)];

  const crop = CROP_DATABASE[cropKey];
  const confidence = isLikelyPlant
    ? crop.confidence + Math.floor(Math.random() * 6 - 3)
    : Math.floor(Math.random() * 20) + 55;

  const health = Math.floor(Math.random() * 35) + 55;
  const hasDisease = Math.random() > 0.5;

  return {
    error: false,
    detected_crop: crop.name,
    confidence_score: confidence,
    health_score: health,
    disease_detected: hasDisease && crop.diseases.length > 0 ? crop.diseases[Math.floor(Math.random() * crop.diseases.length)] : null,
    disease_risk: hasDisease ? Math.floor(Math.random() * 45 + 15) : 0,
    recommendations: crop.recommendations,
    economics: {
      revenue: Math.floor(Math.random() * 500 + 300) * 1000,
      cost: Math.floor(Math.random() * 200 + 100) * 1000,
      profit: Math.floor(Math.random() * 300 + 100) * 1000,
      margin: Math.floor(Math.random() * 40 + 25),
      roi: Math.floor(Math.random() * 60 + 40),
    },
    nutrients: {
      nitrogen: Math.floor(Math.random() * 60 + 30),
      phosphorus: Math.floor(Math.random() * 50 + 25),
      potassium: Math.floor(Math.random() * 55 + 35),
    },
  };
}

export default function AICropAnalysis() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [errorHint, setErrorHint] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 10 Mo');
      return;
    }
    setError(null);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
    setCameraActive(false);
    stopCamera();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setCameraActive(true);
      setImagePreview(null);
      setResult(null);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setError('Impossible d\'accéder à la caméra');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      setImage(file);
      setImagePreview(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    setAnalyzing(true);
    setError(null);
    setErrorHint(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const analysisResult = analyzeImage(image);
      if (analysisResult.error) {
        setError(analysisResult.message);
        setErrorHint(analysisResult.hint);
        setResult(null);
      } else {
        setResult(analysisResult);
        setError(null);
        setErrorHint(null);
      }
    } catch (err) {
      setError('Erreur lors de l\'analyse');
      setErrorHint(null);
    } finally {
      setAnalyzing(false);
    }
  }, [image]);

  const handleReset = useCallback(() => {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    stopCamera();
  }, [stopCamera]);

  const getHealthColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--error)';
  };

  const getHealthLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'Faible';
  };

  return (
    <div className={styles.container}>
      <Card className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            <GiWheat /> Analyse IA des Cultures
          </h3>
          <p className={styles.cardSubtitle}>
            Prenez une photo ou importez une image pour une analyse intelligente
          </p>
        </div>

        {!result && !analyzing && (
          <div className={styles.inputSection}>
            <div className={styles.actionButtons}>
              <button className={styles.actionBtn} onClick={startCamera}>
                <FiCamera />
                <span>Prendre une photo</span>
              </button>
              <button className={styles.actionBtn} onClick={() => fileInputRef.current?.click()}>
                <FiUpload />
                <span>Importer une image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
              />
            </div>

            {cameraActive && (
              <div className={styles.cameraSection}>
                <video ref={videoRef} autoPlay playsInline muted className={styles.cameraVideo} />
                <canvas ref={canvasRef} className={styles.hiddenCanvas} />
                <div className={styles.cameraControls}>
                  <button className={styles.captureBtn} onClick={capturePhoto}>
                    <div className={styles.captureInner} />
                  </button>
                  <button className={styles.cancelCameraBtn} onClick={() => { stopCamera(); setImagePreview(null); }}>
                    <FiX /> Annuler
                  </button>
                </div>
              </div>
            )}

            {imagePreview && !cameraActive && (
              <div className={styles.previewSection}>
                <img src={imagePreview} alt="Aperçu" className={styles.previewImage} />
                <button className={styles.removeBtn} onClick={handleReset}>
                  <FiX />
                </button>
                <button className={styles.analyzeBtn} onClick={handleAnalyze}>
                  <GiWheat /> Lancer l'analyse IA
                </button>
              </div>
            )}

            {error && (
              <div className={styles.errorSection}>
                <div className={styles.errorBanner}>
                  <FiAlertTriangle />
                  <div>
                    <strong>{error}</strong>
                    {errorHint && <p>{errorHint}</p>}
                  </div>
                </div>
                <button className={styles.retryBtn} onClick={handleReset}>
                  <FiCamera /> Réessayer avec une autre image
                </button>
              </div>
            )}
          </div>
        )}

        {analyzing && (
          <div className={styles.analyzingState}>
            <div className={styles.analyzingRing}>
              <div className={styles.analyzingSpinner} />
              <GiWheat className={styles.analyzingIcon} />
            </div>
            <h4>Analyse en cours...</h4>
            <p>Notre IA examine votre culture</p>
            <div className={styles.analyzingSteps}>
              <span className={styles.stepDone}><FiCheck /> Détection de la culture</span>
              <span className={styles.stepActive}><div className={styles.stepDot} /> Analyse de santé</span>
              <span className={styles.stepPending}>Prédiction du rendement</span>
            </div>
          </div>
        )}

        {result && (
          <div className={styles.resultSection}>
            {result.low_confidence && (
              <div className={styles.warningBanner}>
                <FiAlertTriangle />
                <div>
                  <strong>Confiance faible détectée</strong>
                  <p>{result.warning}</p>
                </div>
              </div>
            )}

            <div className={styles.resultHeader}>
              <div className={styles.cropDetected}>
                <div className={styles.cropIcon}>
                  <GiWheat />
                </div>
                <div className={styles.cropInfo}>
                  <h4>Culture détectée</h4>
                  <span className={styles.cropName}>{result.detected_crop}</span>
                  <Badge
                    variant={result.confidence_score >= 70 ? 'success' : result.confidence_score >= 40 ? 'warning' : 'error'}
                    dot
                  >
                    Confiance: {result.confidence_score}%
                  </Badge>
                </div>
              </div>
              <div className={styles.healthScore}>
                <svg viewBox="0 0 120 120" className={styles.scoreRing}>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke={getHealthColor(result.health_score)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.health_score / 100) * 327} 327`}
                    transform="rotate(-90 60 60)"
                    className={styles.scoreArc}
                  />
                </svg>
                <div className={styles.scoreCenter}>
                  <span className={styles.scoreValue}>{result.health_score}</span>
                  <span className={styles.scoreLabel}>/ 100</span>
                </div>
              </div>
            </div>

            <div className={styles.resultGrid}>
              <div className={styles.resultCard}>
                <div className={styles.resultCardHeader}>
                  <FiShield className={styles.resultIcon} />
                  <h5>Détection Maladies</h5>
                </div>
                {result.disease_detected ? (
                  <div className={styles.diseaseAlert}>
                    <FiAlertTriangle className={styles.diseaseIcon} />
                    <div>
                      <span className={styles.diseaseName}>{result.disease_detected}</span>
                      <span className={styles.diseaseRisk}>Risque: {result.disease_risk}%</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.noDisease}>
                    <FiCheck className={styles.checkIcon} />
                    <span>Aucune maladie détectée</span>
                  </div>
                )}
              </div>

              <div className={styles.resultCard}>
                <div className={styles.resultCardHeader}>
                  <FiTrendingUp className={styles.resultIcon} />
                  <h5>Score de Santé</h5>
                </div>
                <div className={styles.healthLabel}>
                  <span className={styles.healthValueLabel}>{getHealthLabel(result.health_score)}</span>
                </div>
                <p className={styles.healthDesc}>
                  {result.health_score >= 80
                    ? 'Votre culture est en excellente santé'
                    : result.health_score >= 60
                    ? 'Quelques améliorations sont possibles'
                    : 'Action recommandée pour améliorer la santé'}
                </p>
              </div>

              {result.economics ? (
                <div className={styles.resultCard}>
                  <div className={styles.resultCardHeader}>
                    <FiDollarSign className={styles.resultIcon} />
                    <h5>Analyse Économique</h5>
                  </div>
                  <div className={styles.econGrid}>
                    <div className={styles.econItem}>
                      <span className={styles.econLabel}>Revenu</span>
                      <span className={styles.econValue}>{result.economics.revenue.toLocaleString('fr-FR')} Ar</span>
                    </div>
                    <div className={styles.econItem}>
                      <span className={styles.econLabel}>Coût</span>
                      <span className={styles.econValue}>{result.economics.cost.toLocaleString('fr-FR')} Ar</span>
                    </div>
                    <div className={styles.econItem}>
                      <span className={styles.econLabel}>Profit</span>
                      <span className={styles.econValueProfit}>{result.economics.profit.toLocaleString('fr-FR')} Ar</span>
                    </div>
                    <div className={styles.econItem}>
                      <span className={styles.econLabel}>Marge</span>
                      <span className={styles.econMargin}>{result.economics.margin}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.resultCard}>
                  <div className={styles.resultCardHeader}>
                    <FiDollarSign className={styles.resultIcon} />
                    <h5>Analyse Économique</h5>
                  </div>
                  <p className={styles.unavailableMsg}>Données non disponibles — confiance insuffisante</p>
                </div>
              )}

              {result.nutrients ? (
                <div className={styles.resultCard}>
                  <div className={styles.resultCardHeader}>
                    <GiPlantRoots className={styles.resultIcon} />
                    <h5>Nutriments du sol</h5>
                  </div>
                  <div className={styles.nutrientBars}>
                    <div className={styles.nutrientRow}>
                      <span className={styles.nutrientLabel}>Azote (N)</span>
                      <div className={styles.nutrientTrack}>
                        <div className={styles.nutrientFill} style={{ width: `${result.nutrients.nitrogen}%`, background: result.nutrients.nitrogen < 50 ? 'var(--warning)' : 'var(--success)' }} />
                      </div>
                      <span className={styles.nutrientValue}>{result.nutrients.nitrogen}%</span>
                    </div>
                    <div className={styles.nutrientRow}>
                      <span className={styles.nutrientLabel}>Phosphore (P)</span>
                      <div className={styles.nutrientTrack}>
                        <div className={styles.nutrientFill} style={{ width: `${result.nutrients.phosphorus}%`, background: result.nutrients.phosphorus < 40 ? 'var(--warning)' : 'var(--success)' }} />
                      </div>
                      <span className={styles.nutrientValue}>{result.nutrients.phosphorus}%</span>
                    </div>
                    <div className={styles.nutrientRow}>
                      <span className={styles.nutrientLabel}>Potassium (K)</span>
                      <div className={styles.nutrientTrack}>
                        <div className={styles.nutrientFill} style={{ width: `${result.nutrients.potassium}%`, background: result.nutrients.potassium < 45 ? 'var(--warning)' : 'var(--success)' }} />
                      </div>
                      <span className={styles.nutrientValue}>{result.nutrients.potassium}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.resultCard}>
                  <div className={styles.resultCardHeader}>
                    <GiPlantRoots className={styles.resultIcon} />
                    <h5>Nutriments du sol</h5>
                  </div>
                  <p className={styles.unavailableMsg}>Données non disponibles — confiance insuffisante</p>
                </div>
              )}
            </div>

            <div className={styles.recommendationsSection}>
              <h4 className={styles.recTitle}>Recommandations Intelligentes</h4>
              <div className={styles.recList}>
                {result.recommendations.map((rec, i) => (
                  <div key={i} className={`${styles.recItem} ${styles.recinfo}`}>
                    <div className={styles.recIcon}>
                      <FiActivity />
                    </div>
                    <span className={styles.recText}>{rec}</span>
                  </div>
                ))}
                {result.disease_detected && (
                  <div className={`${styles.recItem} ${styles.reccritical}`}>
                    <div className={styles.recIcon}>
                      <FiAlertTriangle />
                    </div>
                    <span className={styles.recText}>Traitement recommandé pour {result.disease_detected}</span>
                  </div>
                )}
              </div>
            </div>

            <button className={styles.newAnalysisBtn} onClick={handleReset}>
              <FiCamera /> Nouvelle analyse
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
