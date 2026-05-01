import { useEffect, useState } from 'react';
import {
  FiCloud,
  FiCloudRain,
  FiSun,
  FiWind,
  FiEye,
  FiCloudSnow,
  FiCloudLightning,
  FiDroplet,
  FiBarChart2,
  FiMapPin,
  FiActivity,
} from 'react-icons/fi';
import clsx from 'clsx';
import { SkeletonBox } from '../../components/Skeleton';
import { useSlideInUp } from '../../lib/animations';
import styles from '../../styles/Meteo/MeteoWeather.module.css';

export default function MeteoWeather() {
  const containerRef = useSlideInUp(0.8, 0.2);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation] = useState('Madagascar');

  // Icones météo par condition
  const getWeatherIcon = (condition) => {
    const iconProps = { size: 56, className: 'weather-icon' };
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
      case 'ensoleillé':
        return <FiSun {...iconProps} />;
      case 'cloudy':
      case 'partly cloudy':
      case 'partiellement nuageux':
      case 'nuageux':
        return <FiCloud {...iconProps} />;
      case 'rainy':
      case 'rain':
      case 'heavy rain':
      case 'pluie':
      case 'pluie intense':
        return <FiCloudRain {...iconProps} />;
      case 'stormy':
      case 'thunderstorm':
      case 'orage':
        return <FiCloudLightning {...iconProps} />;
      case 'snowy':
      case 'snow':
        return <FiCloudSnow {...iconProps} />;
      default:
        return <FiCloud {...iconProps} />;
    }
  };

  // Générer des données météo réalistes pour Madagascar
  useEffect(() => {
    const generateWeatherData = () => {
      const conditions = ['Ensoleillé', 'Partiellement nuageux', 'Nuageux', 'Pluie', 'Pluie intense', 'Orage'];
      const today = new Date();
      const forecast = [];
      
      // Température de base pour Madagascar (tropical)
      let baseTemp = 26; // Température de base moyenne
      let tempTrend = Math.random() > 0.5 ? 0.5 : -0.5; // Trend de température jour à jour

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        // Température avec progression logique
        baseTemp += tempTrend + (Math.random() - 0.5) * 1.5;
        baseTemp = Math.max(18, Math.min(32, baseTemp)); // Entre 18-32°C
        
        const tempMin = Math.round(baseTemp - 3 - Math.random() * 2);
        const tempMax = Math.round(baseTemp + Math.random() * 3);
        
        // Générer condition et autres paramètres cohérents
        const randomCondition = Math.random();
        let condition, humidity, windSpeed, chanceOfRain, uvIndex;
        
        if (randomCondition < 0.3) {
          // Ensoleillé
          condition = 'Ensoleillé';
          humidity = Math.floor(Math.random() * 20) + 40; // 40-60%
          windSpeed = Math.floor(Math.random() * 8) + 3; // 3-11 km/h
          chanceOfRain = Math.floor(Math.random() * 10); // 0-10%
          uvIndex = Math.floor(Math.random() * 4) + 7; // 7-11 (élevé)
        } else if (randomCondition < 0.55) {
          // Partiellement nuageux
          condition = 'Partiellement nuageux';
          humidity = Math.floor(Math.random() * 20) + 50; // 50-70%
          windSpeed = Math.floor(Math.random() * 10) + 5; // 5-15 km/h
          chanceOfRain = Math.floor(Math.random() * 20) + 10; // 10-30%
          uvIndex = Math.floor(Math.random() * 3) + 4; // 4-7 (modéré)
        } else if (randomCondition < 0.75) {
          // Nuageux
          condition = 'Nuageux';
          humidity = Math.floor(Math.random() * 15) + 65; // 65-80%
          windSpeed = Math.floor(Math.random() * 12) + 7; // 7-19 km/h
          chanceOfRain = Math.floor(Math.random() * 30) + 20; // 20-50%
          uvIndex = Math.floor(Math.random() * 2) + 2; // 2-4 (faible)
        } else if (randomCondition < 0.88) {
          // Pluie
          condition = 'Pluie';
          humidity = Math.floor(Math.random() * 15) + 75; // 75-90%
          windSpeed = Math.floor(Math.random() * 15) + 10; // 10-25 km/h
          chanceOfRain = Math.floor(Math.random() * 30) + 60; // 60-90%
          uvIndex = Math.floor(Math.random() * 2) + 1; // 1-3 (très faible)
        } else {
          // Orage
          condition = 'Orage';
          humidity = Math.floor(Math.random() * 10) + 85; // 85-95%
          windSpeed = Math.floor(Math.random() * 15) + 20; // 20-35 km/h
          chanceOfRain = Math.floor(Math.random() * 15) + 85; // 85-100%
          uvIndex = 0; // Très faible
        }
        
        const visibility = Math.max(2, Math.round(10 - (humidity - 40) * 0.08 * (Math.random() + 0.5)));
        const pressure = 1010 + Math.floor(Math.random() * 20) - 10; // 1000-1030 hPa

        forecast.push({
          day: i === 0 ? 'Aujourd\'hui' : date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          fullDay: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
          date: date.toLocaleDateString('fr-FR'),
          tempMin,
          tempMax,
          condition,
          humidity,
          windSpeed,
          uvIndex,
          visibility,
          pressure,
          chanceOfRain,
        });
      }

      setWeatherData({
        location: currentLocation,
        forecast,
        lastUpdate: new Date().toLocaleTimeString('fr-FR'),
        currentTemp: forecast[0].tempMax,
        currentCondition: forecast[0].condition,
      });
      setLoading(false);
    };

    const timer = setTimeout(() => {
      generateWeatherData();
    }, 500);

    return () => clearTimeout(timer);
  }, [currentLocation]);

  if (loading) {
    return (
      <div className={clsx(styles['weather-page'])} ref={containerRef}>
        <div className={clsx(styles['weather-header'])}>
          <h1 className={clsx(styles['page-title'])}>Prévisions Météo</h1>
          <p className={clsx(styles['page-subtitle'])}>Découvrez la météo pour les 7 jours à venir</p>
        </div>
        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBox key={i} width="100%" height="180px" />
          ))}
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className={clsx(styles['weather-page'])} ref={containerRef}>
        <div className={clsx(styles['weather-header'])}>
          <h1 className={clsx(styles['page-title'])}>Prévisions Météo</h1>
        </div>
        <div className={clsx(styles['error-container'])}>
          <p>Impossible de charger les données météo</p>
        </div>
      </div>
    );
  }

  const todayWeather = weatherData.forecast[0];
  const nextWeather = weatherData.forecast.slice(1);

  return (
    <div className={clsx(styles['weather-page'])} ref={containerRef}>
      {/* Header */}
      <div className={clsx(styles['weather-header'])}>
        <h1 className={clsx(styles['page-title'])}>Météo</h1>
      </div>

      <div className={clsx(styles['weather-content'])}>
        {/* Today Card - Large */}
        <div className={clsx(styles['weather-today-card'])} style={{ background: 'linear-gradient(135deg, var(--mg-glass-bg) 0%, rgba(29, 151, 108, 0.15) 100%)', backdropFilter: 'blur(8px)', border: '1px solid var(--mg-glass-border)' }}>
          <div className={clsx(styles['today-location'])}>
            <FiMapPin />
            <span>{weatherData.location}</span>
          </div>

          <div className={clsx(styles['today-main'])}>
            <div className={clsx(styles['today-icon'])}>
              {getWeatherIcon(todayWeather.condition)}
            </div>
            <div className={clsx(styles['today-temps'])}>
              <div className={clsx(styles['temp-display'])}>
                <span className={clsx(styles['temp-large'])}>{todayWeather.tempMax}°</span>
                <span className={clsx(styles['temp-small'])}>{todayWeather.tempMin}°</span>
              </div>
              <p className={clsx(styles['condition-text'])}>{todayWeather.condition}</p>
            </div>
          </div>

          <div className={clsx(styles['today-details-grid'])}>
            <div className={clsx(styles['detail-item'])}>
              <div className={clsx(styles['detail-icon'])}><FiDroplet size={20} /></div>
              <div className={clsx(styles['detail-info'])}>
                <span className={clsx(styles['detail-label'])}>Humidité</span>
                <span className={clsx(styles['detail-value'])}>{todayWeather.humidity}%</span>
              </div>
            </div>
            <div className={clsx(styles['detail-item'])}>
              <div className={clsx(styles['detail-icon'])}><FiWind size={20} /></div>
              <div className={clsx(styles['detail-info'])}>
                <span className={clsx(styles['detail-label'])}>Vent</span>
                <span className={clsx(styles['detail-value'])}>{todayWeather.windSpeed} km/h</span>
              </div>
            </div>
            <div className={clsx(styles['detail-item'])}>
              <div className={clsx(styles['detail-icon'])}><FiEye size={20} /></div>
              <div className={clsx(styles['detail-info'])}>
                <span className={clsx(styles['detail-label'])}>Visibilité</span>
                <span className={clsx(styles['detail-value'])}>{todayWeather.visibility} km</span>
              </div>
            </div>
            <div className={clsx(styles['detail-item'])}>
              <div className={clsx(styles['detail-icon'])}><FiBarChart2 size={20} /></div>
              <div className={clsx(styles['detail-info'])}>
                <span className={clsx(styles['detail-label'])}>Pression</span>
                <span className={clsx(styles['detail-value'])}>{todayWeather.pressure} hPa</span>
              </div>
            </div>
          </div>

          <div className={clsx(styles['rain-chance'])}>
            <span>Chance de pluie: <strong>{todayWeather.chanceOfRain}%</strong></span>
            <div className={clsx(styles['rain-bar'])}>
              <div className={clsx(styles['rain-fill'])} style={{ width: `${todayWeather.chanceOfRain}%` }}></div>
            </div>
          </div>
        </div>

        {/* 7-Day Forecast */}
        <div className={clsx(styles['weather-section'])}>
          <h2 className={clsx(styles['section-title'])}>Prévisions 7 jours</h2>
          <div className={clsx(styles['forecast-grid'])}>
            {nextWeather.map((day, index) => (
              <div key={index} className={clsx(styles['forecast-card'])}>
                <div className={clsx(styles['forecast-day'])}>
                  <div className={clsx(styles['day-name'])}>{day.day}</div>
                  <div className={clsx(styles['day-date'])}>{day.date}</div>
                </div>

                <div className={clsx(styles['forecast-icon'])}>
                  {getWeatherIcon(day.condition)}
                </div>

                <div className={clsx(styles['forecast-temps'])}>
                  <span className={clsx(styles['temp-max'])}>{day.tempMax}°</span>
                  <span className={clsx(styles['temp-min'])}>{day.tempMin}°</span>
                </div>

                <p className={clsx(styles['forecast-condition'])}>{day.condition}</p>

                <div className={clsx(styles['forecast-details'])}>
                  <div className={clsx(styles['detail'])}>
                    <FiDroplet size={16} />
                    <span>{day.humidity}%</span>
                  </div>
                  <div className={clsx(styles['detail'])}>
                    <FiWind size={16} />
                    <span>{day.windSpeed} km/h</span>
                  </div>
                </div>

                <div className={clsx(styles['forecast-rain'])}>
                  <span className={clsx(styles['rain-label'])}>Pluie</span>
                  <span className={clsx(styles['rain-percent'])}>{day.chanceOfRain}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className={clsx(styles['weather-section'])}>
          <h2 className={clsx(styles['section-title'])}>Détails Supplémentaires</h2>
          <div className={clsx(styles['details-grid'])}>
            <div className={clsx(styles['info-card'])}>
              <div className={clsx(styles['info-icon'])}>
                <FiSun />
              </div>
              <h3>Indice UV</h3>
              <p className={clsx(styles['info-value'])}>{todayWeather.uvIndex}</p>
              <p className={clsx(styles['info-label'])}>
                {todayWeather.uvIndex < 3 ? 'Faible' : todayWeather.uvIndex < 6 ? 'Modéré' : todayWeather.uvIndex < 8 ? 'Élevé' : 'Très élevé'}
              </p>
            </div>

            <div className={clsx(styles['info-card'])}>
              <div className={clsx(styles['info-icon'])}>
                <FiEye />
              </div>
              <h3>Visibilité</h3>
              <p className={clsx(styles['info-value'])}>{todayWeather.visibility} km</p>
              <p className={clsx(styles['info-label'])}>Excellente</p>
            </div>

            <div className={clsx(styles['info-card'])}>
              <div className={clsx(styles['info-icon'])}>
                <FiActivity />
              </div>
              <h3>Pression</h3>
              <p className={clsx(styles['info-value'])}>{todayWeather.pressure}</p>
              <p className={clsx(styles['info-label'])}>hPa</p>
            </div>

            <div className={clsx(styles['info-card'])}>
              <div className={clsx(styles['info-icon'])}>
                <FiWind />
              </div>
              <h3>Vent</h3>
              <p className={clsx(styles['info-value'])}>{todayWeather.windSpeed}</p>
              <p className={clsx(styles['info-label'])}>km/h</p>
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className={clsx(styles['weather-footer'])}>
          <small>Dernière mise à jour: {weatherData.lastUpdate}</small>
        </div>
      </div>
    </div>
  );
}
