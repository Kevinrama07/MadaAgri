import { useEffect } from 'react';
import clsx from 'clsx';
import { FiX, FiGlobe, FiSun, FiCalendar, FiBarChart2, FiInfo, FiTrendingUp } from 'react-icons/fi';
import { GiSeedling } from 'react-icons/gi';
import { getSuitabilityColor, getSuitabilityLabel, formatGrowingPeriod, getCultureCategory } from '../utils/cultureUtils';
import styles from '../styles/ui/CultureDetailModal.module.css';

export default function CultureDetailModal({ culture, onClose }) {
  useEffect(() => {
    // Bloquer le scroll du body quand le modal est ouvert
    document.body.style.overflow = 'hidden';
    
    // Gérer la touche Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Validation des données
  if (!culture || !culture.culture) {
    return null;
  }

  const score = culture.suitability_score || culture.score || 0;
  const cultureName = culture.culture?.name || culture.culture_name || 'Culture inconnue';
  const description = culture.culture?.description || '';
  const idealSoil = culture.culture?.ideal_soil || '';
  const idealClimate = culture.culture?.ideal_climate || '';
  const growingPeriod = culture.culture?.growing_period_days || 0;
  const yieldPotential = culture.culture?.yield_potential || '';
  
  const category = getCultureCategory(cultureName);
  const scoreColor = getSuitabilityColor(score);
  const scoreLabel = getSuitabilityLabel(score);

  // Vérifier qu'il y a au moins des données minimales à afficher
  const hasMinimalData = cultureName !== 'Culture inconnue' || description || idealSoil || idealClimate;
  
  if (!hasMinimalData) {
    return null;
  }

  return (
    <div className={clsx(styles.overlay)} onClick={onClose}>
      <div 
        className={clsx(styles.modal)} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className={clsx(styles.header)}>
          <div className={clsx(styles.titleContainer)}>
            <h2 id="modal-title" className={clsx(styles.title)}>{cultureName}</h2>
            <span className={clsx(styles.category)}>{category}</span>
          </div>
          <button 
            className={clsx(styles.closeButton)} 
            onClick={onClose}
            aria-label="Fermer"
          >
            <FiX />
          </button>
        </div>

        {/* Score Badge */}
        <div className={clsx(styles.scoreSection)}>
          <div className={clsx(styles.scoreBadge)} style={{ backgroundColor: scoreColor }}>
            <span className={clsx(styles.scoreValue)}>{score}%</span>
            <span className={clsx(styles.scoreLabel)}>{scoreLabel}</span>
          </div>
          <div className={clsx(styles.progressBar)}>
            <div 
              className={clsx(styles.progressFill)} 
              style={{ width: `${score}%`, backgroundColor: scoreColor }}
            />
          </div>
        </div>

        {/* Content */}
        <div className={clsx(styles.content)}>
          {/* Description */}
          {description && (
            <div className={clsx(styles.section)}>
              <div className={clsx(styles.sectionHeader)}>
                <FiInfo />
                <h3>Description</h3>
              </div>
              <p className={clsx(styles.description)}>{description}</p>
            </div>
          )}

          {/* Caractéristiques */}
          <div className={clsx(styles.section)}>
            <div className={clsx(styles.sectionHeader)}>
              <GiSeedling />
              <h3>Caractéristiques</h3>
            </div>
            <div className={clsx(styles.characteristics)}>
              {idealSoil && (
                <div className={clsx(styles.characteristic)}>
                  <div className={clsx(styles.characteristicIcon)}>
                    <FiGlobe />
                  </div>
                  <div className={clsx(styles.characteristicContent)}>
                    <span className={clsx(styles.characteristicLabel)}>Sol Idéal</span>
                    <span className={clsx(styles.characteristicValue)}>{idealSoil}</span>
                  </div>
                </div>
              )}
              
              {idealClimate && (
                <div className={clsx(styles.characteristic)}>
                  <div className={clsx(styles.characteristicIcon)}>
                    <FiSun />
                  </div>
                  <div className={clsx(styles.characteristicContent)}>
                    <span className={clsx(styles.characteristicLabel)}>Climat Idéal</span>
                    <span className={clsx(styles.characteristicValue)}>{idealClimate}</span>
                  </div>
                </div>
              )}
              
              {growingPeriod > 0 && (
                <div className={clsx(styles.characteristic)}>
                  <div className={clsx(styles.characteristicIcon)}>
                    <FiCalendar />
                  </div>
                  <div className={clsx(styles.characteristicContent)}>
                    <span className={clsx(styles.characteristicLabel)}>Période de Croissance</span>
                    <span className={clsx(styles.characteristicValue)}>
                      {formatGrowingPeriod(growingPeriod)}
                    </span>
                  </div>
                </div>
              )}
              
              {yieldPotential && (
                <div className={clsx(styles.characteristic)}>
                  <div className={clsx(styles.characteristicIcon)}>
                    <FiBarChart2 />
                  </div>
                  <div className={clsx(styles.characteristicContent)}>
                    <span className={clsx(styles.characteristicLabel)}>Rendement Potentiel</span>
                    <span className={clsx(styles.characteristicValue)}>{yieldPotential}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conseils */}
          <div className={clsx(styles.section)}>
            <div className={clsx(styles.sectionHeader)}>
              <FiTrendingUp />
              <h3>Conseils de Culture</h3>
            </div>
            <div className={clsx(styles.tips)}>
              <div className={clsx(styles.tip)}>
                <span className={clsx(styles.tipIcon)}>💧</span>
                <p>Assurez un arrosage régulier adapté au climat de votre région</p>
              </div>
              <div className={clsx(styles.tip)}>
                <span className={clsx(styles.tipIcon)}>🌱</span>
                <p>Préparez le sol selon les caractéristiques recommandées</p>
              </div>
              <div className={clsx(styles.tip)}>
                <span className={clsx(styles.tipIcon)}>☀️</span>
                <p>Respectez la période de plantation optimale pour votre région</p>
              </div>
              <div className={clsx(styles.tip)}>
                <span className={clsx(styles.tipIcon)}>🔬</span>
                <p>Surveillez régulièrement l'état de santé de vos plants</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
