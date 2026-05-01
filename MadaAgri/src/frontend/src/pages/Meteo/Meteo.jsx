import { useEffect, useState } from 'react';
import {
  FiCloud,
  FiCloudRain,
  FiSun,
  FiWind,
  FiEye,
  FiCloudSnow,
  FiCloudLightning,
} from 'react-icons/fi';
import clsx from 'clsx';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonBox, SkeletonCard } from '../../components/Skeleton';
import { MdOpacity, MdAir } from 'react-icons/md';
import { useSlideInUp } from '../../lib/animations';
import styles from '../../styles/Meteo/Meteo.module.css';

export default function Meteo() {
  const { isLoading, startLoading, stopLoading } = usePageLoading();
  const containerRef = useSlideInUp(0.8, 0.2);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('Madagascar');

  // Icones météo par condition
  const getWeatherIcon = (condition) => {
    const iconProps = { size: 48, className: 'weather-icon' };
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <FiSun {...iconProps} />;
      case 'cloudy':
      case 'partly cloudy':
        return <FiCloud {...iconProps} />;
      case 'rainy':
      case 'rain':
      case 'heavy rain':
        return <FiCloudRain {...iconProps} />;
      case 'stormy':
      case 'thunderstorm':
        return <FiCloudLightning {...iconProps} />;
      case 'snowy':
      case 'snow':
        return <FiCloudSnow {...iconProps} />;
      default:
        return <FiCloud {...iconProps} />;
    }
  };

  // Générer des données météo fictives réalistes pour Madagascar
  useEffect(() => {
    const generateWeatherData = () => {
      const conditions = [
        'Sunny',
        'Partly Cloudy',
        'Cloudy',
        'Rainy',
        'Heavy Rain',
        'Thunderstorm',
      ];
      const today = new Date();
      const forecast = [];

      // Température moyenne à Madagascar (25-30°C)
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const tempMin = Math.floor(Math.random() * 8) + 18; // 18-26°C
        const tempMax = tempMin + Math.floor(Math.random() * 12) + 5; // +5 à +17°C
        const humidity = Math.floor(Math.random() * 30) + 60; // 60-90%
        const windSpeed = Math.floor(Math.random() * 20) + 5; // 5-25 km/h
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const uvIndex = Math.floor(Math.random() * 11) + 3; // 3-13
        const visibility = Math.floor(Math.random() * 10) + 5; // 5-15 km
        const pressure = Math.floor(Math.random() * 20) + 1010; // 1010-1030 hPa

        forecast.push({
          day: i === 0 ? 'Aujourd\'hui' : date.toLocaleDateString('fr-FR', { weekday: 'long' }),
          date: date.toLocaleDateString('fr-FR'),
          tempMin,
          tempMax,
          condition,
          humidity,
          windSpeed,
          uvIndex,
          visibility,
          pressure,
          chanceOfRain: Math.floor(Math.random() * 100),
        });
      }

      setWeatherData({
        location: currentLocation,
        forecast,
        lastUpdate: new Date().toLocaleTimeString('fr-FR'),
      });
      stopLoading();
    };

    // Simuler un délai de chargement
    startLoading();
    const timer = setTimeout(() => {
      generateWeatherData();
    }, 500);

    return () => clearTimeout(timer);
  }, [currentLocation]);

  if (isLoading) {
    return (
      <div className={clsx(styles['meteo-page'])} ref={containerRef}>
        <div className={clsx(styles['loading-container'])}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} width="100%" height="120px" style={{ marginBottom: '1rem' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx(styles['meteo-page'])} ref={containerRef}>
        <div className={clsx(styles['error-container'])}>
          <p style={{ color: 'var(--mg-error)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles['meteo-page'])} ref={containerRef}>
      {/* En-tête */}
      <div className={clsx(styles['meteo-header'])}>
        <div className={clsx(styles['page-header'])}>
          <h1 className={clsx(styles['page-title'])}>
            <FiSun style={{ marginRight: '12px' }} />
            Prévisions Météorologiques
          </h1>
          <p className={clsx(styles['page-subtitle'])}>Consultez la météo pour les 7 prochains jours</p>
        </div>
      </div>

      {/* Conteneur principal */}
      <div className={clsx(styles['meteo-container'])}>
        {/* Informations générales */}
        <div className={clsx(styles['meteo-info-section'])}>
          <div className={clsx(styles['info-header'])}>
            <h2 style={{ color: 'var(--mg-text)', fontSize: '1.3rem', fontWeight: '700', margin: 0 }}>
              {weatherData.location}
            </h2>
            <p style={{ color: 'var(--mg-text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              Mise à jour: {weatherData.lastUpdate}
            </p>
          </div>
        </div>

        {/* Grille des jours */}
        <div className={clsx(styles['weather-grid'])}>
          {weatherData.forecast.map((day, index) => (
            <div key={index} className={clsx(styles['weather-card'], { [styles['today']]: index === 0 })}>
              {/* En-tête du jour */}
              <div className={clsx(styles['card-header'])}>
                <h3 className={clsx(styles['day-name'])}>{day.day}</h3>
                <p className={clsx(styles['day-date'])}>{day.date}</p>
              </div>

              {/* Icône et condition */}
              <div className={clsx(styles['card-condition'])}>
                <div className={clsx(styles['condition-icon'])}>{getWeatherIcon(day.condition)}</div>
                <p className={clsx(styles['condition-text'])}>{day.condition}</p>
              </div>

              {/* Températures */}
              <div className={clsx(styles['temps-section'])}>
                <div className={clsx(styles['temp-item'])}>
                  <span className={clsx(styles['temp-label'])}>Max</span>
                  <span className={clsx(styles['temp-value'], styles['max'])}>{day.tempMax}°</span>
                </div>
                <div className={clsx(styles['temp-item'])}>
                  <span className={clsx(styles['temp-label'])}>Min</span>
                  <span className={clsx(styles['temp-value'], styles['min'])}>{day.tempMin}°</span>
                </div>
              </div>

              {/* Détails météo */}
              <div className={clsx(styles['details-grid'])}>
                <div className={clsx(styles['detail-item'])}>
                  <MdOpacity className={clsx(styles['detail-icon'], styles['humidity'])} />
                  <div className={clsx(styles['detail-text'])}>
                    <span className={clsx(styles['detail-label'])}>Humidité</span>
                    <span className={clsx(styles['detail-value'])}>{day.humidity}%</span>
                  </div>
                </div>

                <div className={clsx(styles['detail-item'])}>
                  <FiWind className={clsx(styles['detail-icon'], styles['wind'])} />
                  <div className={clsx(styles['detail-text'])}>
                    <span className={clsx(styles['detail-label'])}>Vent</span>
                    <span className={clsx(styles['detail-value'])}>{day.windSpeed} km/h</span>
                  </div>
                </div>

                <div className={clsx(styles['detail-item'])}>
                  <FiEye className={clsx(styles['detail-icon'], styles['visibility'])} />
                  <div className={clsx(styles['detail-text'])}>
                    <span className={clsx(styles['detail-label'])}>Visibilité</span>
                    <span className={clsx(styles['detail-value'])}>{day.visibility} km</span>
                  </div>
                </div>

                <div className={clsx(styles['detail-item'])}>
                  <MdAir className={clsx(styles['detail-icon'], styles['pressure'])} />
                  <div className={clsx(styles['detail-text'])}>
                    <span className={clsx(styles['detail-label'])}>Pression</span>
                    <span className={clsx(styles['detail-value'])}>{day.pressure} hPa</span>
                  </div>
                </div>

                <div className={clsx(styles['detail-item'])}>
                  <FiCloud className={clsx(styles['detail-icon'], styles['rain'])} />
                  <div className={clsx(styles['detail-text'])}>
                    <span className={clsx(styles['detail-label'])}>Pluie</span>
                    <span className={clsx(styles['detail-value'])}>{day.chanceOfRain}%</span>
                  </div>
                </div>

                <div className={clsx(styles['detail-item'])}>
                  <FiSun className={clsx(styles['detail-icon'], styles['uv'])} />
                  <div className={clsx(styles['detail-text'])}>
                    <span className={clsx(styles['detail-label'])}>UV</span>
                    <span className={clsx(styles['detail-value'])}>{day.uvIndex}/12</span>
                  </div>
                </div>
              </div>

              {/* Barre de pluie */}
              <div className={clsx(styles['rain-bar-section'])}>
                <span className={clsx(styles['rain-label'])}>Probabilité de pluie</span>
                <div className={clsx(styles['rain-bar'])}>
                  <div
                    className={clsx(styles['rain-fill'])}
                    style={{ width: `${day.chanceOfRain}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conseils agricoles */}
        <div className={clsx(styles['advice-section'])}>
          <div className={clsx(styles['advice-header'])}>
            <h3 style={{ color: 'var(--mg-text)', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
              💡 Conseils Agricoles
            </h3>
          </div>
          <div className={clsx(styles['advice-grid'])}>
            <div className={clsx(styles['advice-card'])}>
              <div className={clsx(styles['advice-icon'])}>🌾</div>
              <h4>Arrosage</h4>
              <p>Privilégiez l'arrosage en début de matinée ou en fin de journée pour minimiser l'évaporation.</p>
            </div>
            <div className={clsx(styles['advice-card'])}>
              <div className={clsx(styles['advice-icon'])}>☀️</div>
              <h4>Protection UV</h4>
              <p>Avec un indice UV élevé, appliquez de la crème solaire sur vos cultures sensibles.</p>
            </div>
            <div className={clsx(styles['advice-card'])}>
              <div className={clsx(styles['advice-icon'])}>🌧️</div>
              <h4>Drainage</h4>
              <p>En cas de pluies importantes, assurez-vous que vos champs ont un bon système de drainage.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
