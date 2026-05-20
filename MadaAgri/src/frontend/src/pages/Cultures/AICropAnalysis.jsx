import { useState, useRef, useCallback, useEffect } from 'react';
import { FiCamera, FiUpload, FiX, FiCheck, FiAlertTriangle, FiDollarSign, FiShield, FiActivity, FiClock, FiLayers, FiArrowRight, FiRefreshCw, FiTrendingUp, FiDroplet, FiSun } from 'react-icons/fi';
import { GiWheat, GiPlantRoots } from 'react-icons/gi';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { dataApi } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './AICropAnalysis.module.css';

const GROWTH_STAGE_ICONS = {
  'Seedling': '\u{1F331}',
  'Vegetative': '\u{1F33F}',
  'Flowering': '\u{1F338}',
  'Fruiting': '\u{1F34E}',
  'Mature': '\u{1F33E}',
  'Unknown': '\u{2753}',
};

const REC_ICONS = {
  'ALERTE MALADIE': FiAlertTriangle,
  'Irrigation': FiDroplet,
  'Fertilisation': FiSun,
  'Protection': FiShield,
  'Recolte': GiWheat,
  'Prevention': FiCheck,
  'Nutriments': GiPlantRoots,
  'Sante de la culture': FiActivity,
  'Conseil saisonnier': FiSun,
  'Type de sol': GiPlantRoots,
  'Qualite d\'image': FiCamera,
};

export default function AICropAnalysis() {
  const { theme } = useTheme();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [errorHint, setErrorHint] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [analysisFallback, setAnalysisFallback] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  useEffect(() => { loadParcels(); }, []);
  useEffect(() => { if (result?.id) loadHistory(); }, [result]);

  const loadParcels = useCallback(async () => {
    try { const data = await dataApi.fetchParcels(); setParcels(data || []); } catch { setParcels([]); }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try { const data = await dataApi.fetchAnalysisHistory(selectedParcel?.id || ''); setHistory(data || []); } catch { setHistory([]); } finally { setHistoryLoading(false); }
  }, [selectedParcel]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Veuillez selectionner une image valide'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('L\'image ne doit pas depasser 10 Mo'); return; }
    setError(null); setImage(file); setImagePreview(URL.createObjectURL(file)); setResult(null); setAnalysisFallback(false); setCameraActive(false); stopCamera();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      setCameraStream(stream); setCameraActive(true); setImagePreview(null); setResult(null);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { setError('Impossible d\'acceder a la camera'); }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) { cameraStream.getTracks().forEach((t) => t.stop()); setCameraStream(null); }
    setCameraActive(false);
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current; const video = videoRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      setImage(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
      setImagePreview(canvas.toDataURL('image/jpeg')); stopCamera();
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    setAnalyzing(true); setError(null); setErrorHint(null); setResult(null); setAnalysisFallback(false);
    try {
      setAnalysisStep('Telechargement de l\'image...');
      const imageUrl = await dataApi.uploadImage(image);
      setAnalysisStep('Analyse IA en cours...');
      const endpoint = selectedParcel?.id ? `parcels/${selectedParcel.id}/analyze-crop` : 'parcels/analyze-image';
      const body = { image_url: imageUrl };
      if (selectedParcel?.id) body.parcel_id = selectedParcel.id;
      const token = localStorage.getItem('madaagri_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Erreur lors de l\'analyse'); setErrorHint(data.hint || null); setResult(null); return; }
      setAnalysisFallback(data.analysis.fallback || false); setResult(data.analysis); setError(null); setErrorHint(null);
    } catch (err) { setError(err.message || 'Erreur lors de l\'analyse'); setErrorHint(null); } finally { setAnalyzing(false); setAnalysisStep(''); }
  }, [image, selectedParcel]);

  const handleReset = useCallback(() => {
    setImage(null); setImagePreview(null); setResult(null); setError(null); setErrorHint(null); setAnalysisFallback(false); stopCamera();
  }, [stopCamera]);

  const healthInfo = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'var(--success)', bg: 'var(--successLight)', gradient: theme.gradient };
    if (score >= 60) return { label: 'Bon', color: 'var(--warning)', bg: 'var(--warningLight)' };
    if (score >= 40) return { label: 'Moyen', color: 'var(--warning)', bg: 'var(--warningLight)' };
    return { label: 'Faible', color: 'var(--error)', bg: 'var(--errorLight)' };
  };

  const confidenceInfo = (score) => {
    if (score >= 70) return { color: 'var(--success)', bg: 'var(--successLight)' };
    if (score >= 40) return { color: 'var(--warning)', bg: 'var(--warningLight)' };
    return { color: 'var(--error)', bg: 'var(--errorLight)' };
  };

  const diseaseInfo = (risk) => {
    if (risk >= 70) return { color: 'var(--error)', bg: 'var(--errorLight)', label: 'Critique' };
    if (risk >= 40) return { color: 'var(--warning)', bg: 'var(--warningLight)', label: 'Modere' };
    if (risk > 0) return { color: 'var(--info)', bg: 'var(--infoLight)', label: 'Faible' };
    return { color: 'var(--success)', bg: 'var(--successLight)', label: 'Aucun' };
  };

  const qualityInfo = (q) => {
    if (q === 'Good') return { label: 'Bonne', color: 'var(--success)', bg: 'var(--successLight)' };
    if (q === 'Acceptable') return { label: 'Acceptable', color: 'var(--warning)', bg: 'var(--warningLight)' };
    return { label: 'Faible', color: 'var(--error)', bg: 'var(--errorLight)' };
  };

  const priorityStyle = (p) => {
    switch (p) {
      case 'critical': return { border: 'var(--error)', bg: 'var(--errorLight)', text: 'var(--error)', icon: 'var(--error)' };
      case 'high': return { border: 'var(--warning)', bg: 'var(--warningLight)', text: 'var(--warning)', icon: 'var(--warning)' };
      case 'medium': return { border: 'var(--info)', bg: 'var(--infoLight)', text: 'var(--info)', icon: 'var(--info)' };
      default: return { border: 'var(--border)', bg: 'var(--backgroundSecondary)', text: 'var(--text-muted)', icon: 'var(--text-muted)' };
    }
  };

  const circumference = 2 * Math.PI * 54;
  const healthDash = (result?.health_score / 100) * circumference;
  const health = result ? healthInfo(result.health_score) : null;
  const conf = result ? confidenceInfo(result.confidence_score) : null;
  const dis = result ? diseaseInfo(result.disease_risk || 0) : null;
  const qual = result ? qualityInfo(result.image_quality) : null;

  return (
    <div className={styles.container}>
      <Card className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerContent}>
            <div>
              <h3 className={styles.cardTitle}>
                <span className={styles.titleIcon}><GiWheat /></span>
                Analyse IA des Cultures
              </h3>
              <p className={styles.cardSubtitle}>
                Prenez une photo ou importez une image pour une analyse intelligente
              </p>
            </div>
            {parcels.length > 0 && (
              <div className={styles.parcelSelector}>
                <FiLayers />
                <select value={selectedParcel?.id || ''} onChange={(e) => { const p = parcels.find((x) => x.id === e.target.value); setSelectedParcel(p || null); }} className={styles.parcelSelect}>
                  <option value="">Sans parcelle associee</option>
                  {parcels.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
            )}
          </div>
        </div>

        {!result && !analyzing && (
          <div className={styles.inputSection}>
            <div className={styles.actionButtons}>
              <button className={styles.actionBtn} onClick={startCamera}>
                <span className={styles.actionBtnIcon}><FiCamera /></span>
                <span className={styles.actionBtnLabel}>Prendre une photo</span>
              </button>
              <button className={styles.actionBtn} onClick={() => fileInputRef.current?.click()}>
                <span className={styles.actionBtnIcon}><FiUpload /></span>
                <span className={styles.actionBtnLabel}>Importer une image</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className={styles.hiddenInput} />
            </div>

            {cameraActive && (
              <div className={styles.cameraSection}>
                <video ref={videoRef} autoPlay playsInline muted className={styles.cameraVideo} />
                <canvas ref={canvasRef} className={styles.hiddenCanvas} />
                <div className={styles.cameraControls}>
                  <button className={styles.captureBtn} onClick={capturePhoto}><div className={styles.captureInner} /></button>
                  <button className={styles.cancelCameraBtn} onClick={() => { stopCamera(); setImagePreview(null); }}><FiX /> Annuler</button>
                </div>
              </div>
            )}

            {imagePreview && !cameraActive && (
              <div className={styles.previewSection}>
                <img src={imagePreview} alt="Apercu" className={styles.previewImage} />
                <button className={styles.removeBtn} onClick={handleReset}><FiX /></button>
                <button className={styles.analyzeBtn} onClick={handleAnalyze}><GiWheat /> Lancer l'analyse IA</button>
              </div>
            )}

            {error && (
              <div className={styles.errorSection}>
                <div className={styles.errorBanner}>
                  <FiAlertTriangle />
                  <div><strong>{error}</strong>{errorHint && <p>{errorHint}</p>}</div>
                </div>
                <button className={styles.retryBtn} onClick={handleReset}><FiCamera /> Reessayer avec une autre image</button>
              </div>
            )}
          </div>
        )}

        {analyzing && (
          <div className={styles.analyzingState}>
            <div className={styles.analyzingRing}><div className={styles.analyzingSpinner} /><GiWheat className={styles.analyzingIcon} /></div>
            <h4>Analyse en cours...</h4>
            {analysisStep && <p className={styles.analysisStep}>{analysisStep}</p>}
            <div className={styles.analyzingSteps}>
              <span className={styles.stepDone}><FiCheck /> Telechargement</span>
              <span className={styles.stepActive}><div className={styles.stepDot} /> Analyse IA</span>
              <span className={styles.stepPending}>Recommandations</span>
            </div>
          </div>
        )}

        {result && (
          <div className={styles.resultSection}>
            {analysisFallback && (
              <div className={styles.fallbackBanner}><FiAlertTriangle /><div><strong>Mode degrade actif</strong><p>Le service IA n'est pas configure. Resultats limites.</p></div></div>
            )}
            {result.warnings?.length > 0 && (
              <div className={styles.warningBanner}><FiAlertTriangle /><div><strong>Notes d'analyse</strong>{result.warnings.map((w, i) => (<p key={i}>{w}</p>))}</div></div>
            )}
            {result.anomalies?.length > 0 && (
              <div className={styles.anomalyBanner}><FiAlertTriangle /><div><strong>Anomalies detectees</strong>{result.anomalies.map((a, i) => (<p key={i}>{a}</p>))}</div></div>
            )}

            <div className={styles.heroSection}>
              <div className={styles.heroCrop}>
                <div className={styles.heroCropIcon}>
                  <GiWheat />
                </div>
                <div className={styles.heroCropInfo}>
                  <span className={styles.heroLabel}>Culture detectee</span>
                  <h2 className={styles.heroCropName}>{result.detected_crop}</h2>
                  <div className={styles.heroBadges}>
                    <span className={styles.badge} style={{ color: conf.color, background: conf.bg }}>
                      Confiance: {result.confidence_score}%
                    </span>
                    {result.growth_stage_label && (
                      <span className={styles.badge} style={{ color: 'var(--info)', background: 'var(--infoLight)' }}>
                        {GROWTH_STAGE_ICONS[result.growth_stage] || ''} {result.growth_stage_label}
                      </span>
                    )}
                  </div>
                  {result.analysis_precision && (
                    <div className={`${styles.precisionBadge} ${result.analysis_precision === 'high' ? styles.high : styles.low}`}>
                      {result.analysis_precision === 'high' ? (
                        <>
                          <FiCheck className={styles.precisionBadgeIcon} />
                          Analyse IA Gemini — haute precision
                        </>
                      ) : (
                        <>
                          <FiAlertTriangle className={styles.precisionBadgeIcon} />
                          Analyse heuristique — precision limitee
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.heroHealth}>
                <div className={styles.healthRing}>
                  <svg viewBox="0 0 120 120" className={styles.healthSvg}>
                    <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke={health.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${healthDash} ${circumference}`} transform="rotate(-90 60 60)" className={styles.healthArc} />
                  </svg>
                  <div className={styles.healthCenter}>
                    <span className={styles.healthNumber}>{result.health_score}</span>
                    <span className={styles.healthLabel}>/ 100</span>
                  </div>
                </div>
                <span className={styles.healthStatus} style={{ color: health.color }}>{health.label}</span>
              </div>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricIcon} style={{ background: result.disease_detected ? 'var(--errorLight)' : 'var(--successLight)', color: result.disease_detected ? 'var(--error)' : 'var(--success)' }}>
                    <FiShield />
                  </span>
                  <span className={styles.metricTitle}>Maladies</span>
                </div>
                {result.disease_detected ? (
                  <div className={styles.metricAlert}>
                    <span className={styles.metricAlertName}>{result.disease_detected}</span>
                    <span className={styles.metricAlertRisk} style={{ color: dis.color }}>
                      Risque {result.disease_risk}% - {result.disease_risk_level?.level || dis.label}
                    </span>
                    {result.disease_risk_level?.action && <span className={styles.metricAlertAction}>{result.disease_risk_level.action}</span>}
                  </div>
                ) : (
                  <div className={styles.metricOk}>
                    <FiCheck /> Aucune maladie detectee
                  </div>
                )}
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricIcon} style={{ background: result.nutrient_deficiencies?.length > 0 ? 'var(--warningLight)' : 'var(--successLight)', color: result.nutrient_deficiencies?.length > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    <GiPlantRoots />
                  </span>
                  <span className={styles.metricTitle}>Nutriments</span>
                </div>
                {result.nutrient_deficiencies?.length > 0 ? (
                  <div className={styles.deficiencyList}>
                    {result.nutrient_deficiencies.map((d, i) => (
                      <span key={i} className={styles.deficiencyItem}><FiAlertTriangle /> {d}</span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.metricOk}><FiCheck /> Aucune carence detectee</div>
                )}
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricIcon} style={{ background: qual.bg, color: qual.color }}>
                    <FiActivity />
                  </span>
                  <span className={styles.metricTitle}>Qualite image</span>
                </div>
                <span className={styles.qualityBadge} style={{ color: qual.color, background: qual.bg }}>{qual.label}</span>
              </div>

              {result.economic_estimate && (
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricIcon} style={{ background: 'var(--infoLight)', color: 'var(--info)' }}>
                      <FiDollarSign />
                    </span>
                    <span className={styles.metricTitle}>Estimation economique</span>
                  </div>
                  <div className={styles.econGrid}>
                    <div className={styles.econItem}>
                      <span className={styles.econLabel}>Revenu</span>
                      <span className={styles.econValue}>{result.economic_estimate.estimated_revenue.toLocaleString('fr-FR')} {result.economic_estimate.currency}</span>
                    </div>
                    <div className={styles.econItem}>
                      <span className={styles.econLabel}>Cout</span>
                      <span className={styles.econValue}>{result.economic_estimate.estimated_cost.toLocaleString('fr-FR')} {result.economic_estimate.currency}</span>
                    </div>
                    <div className={styles.econItem}>
                      <span className={styles.econLabel}>Profit</span>
                      <span className={styles.econValueProfit}>{result.economic_estimate.estimated_profit.toLocaleString('fr-FR')} {result.economic_estimate.currency}</span>
                    </div>
                    <div className={styles.econItem}>
                      <span className={styles.econLabel}>Marge</span>
                      <span className={styles.econMargin}>{result.economic_estimate.margin_percent}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {result.recommendations?.length > 0 && (
              <div className={styles.recommendationsSection}>
                <h4 className={styles.recTitle}>Recommandations Agronomiques</h4>
                <div className={styles.recList}>
                  {result.recommendations.map((rec, i) => {
                    const ps = priorityStyle(rec.priority);
                    const Icon = REC_ICONS[rec.category] || FiArrowRight;
                    return (
                      <div key={i} className={styles.recItem} style={{ borderLeft: `4px solid ${ps.border}`, background: ps.bg }}>
                        <span className={styles.recIconWrap} style={{ color: ps.icon }}><Icon /></span>
                        <div className={styles.recContent}>
                          <span className={styles.recCategory} style={{ color: ps.text }}>{rec.category}</span>
                          <span className={styles.recText}>{rec.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.resultActions}>
              <button className={styles.newAnalysisBtn} onClick={handleReset}><FiRefreshCw /> Nouvelle analyse</button>
              <button className={styles.historyBtn} onClick={() => { setShowHistory(!showHistory); if (!showHistory && selectedParcel?.id) loadHistory(); }}><FiClock /> Historique ({history.length})</button>
            </div>

            {showHistory && (
              <div className={styles.historySection}>
                <h4 className={styles.recTitle}>Historique des Analyses</h4>
                {historyLoading ? (
                  <div className={styles.historyLoading}><div className={styles.historySpinner} /><span>Chargement...</span></div>
                ) : history.length === 0 ? (
                  <p className={styles.historyEmpty}>Aucun historique disponible</p>
                ) : (
                  <div className={styles.historyList}>
                    {history.map((item) => (
                      <div key={item.id} className={styles.historyItem}>
                        <div className={styles.historyItemHeader}>
                          <span className={styles.historyCrop}>{item.detected_crop}</span>
                          <span className={styles.historyDate}>
                            {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={styles.historyItemMeta}>
                          <span className={styles.badge} style={{ color: item.confidence_score >= 70 ? 'var(--success)' : 'var(--warning)', background: item.confidence_score >= 70 ? 'var(--successLight)' : 'var(--warningLight)' }}>
                            {item.confidence_score}%
                          </span>
                          <span>Sante: {item.health_score}/100</span>
                          {item.disease_detected && <span className={styles.badge} style={{ color: 'var(--error)', background: 'var(--errorLight)' }}>{item.disease_detected}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
