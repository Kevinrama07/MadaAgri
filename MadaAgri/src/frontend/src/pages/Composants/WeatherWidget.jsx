import { FiSun, FiCloud, FiCloudRain, FiWind, FiDroplet } from 'react-icons/fi';
import clsx from 'clsx';
import styles from '../../styles/Composants/WeatherWidget.module.css';

export default function WeatherWidget() {
  // Mock data - à remplacer par une vraie API météo
  const weatherData = {
    location: 'Antananarivo',
    temperature: 24,
    condition: 'Ensoleillé',
    humidity: 65,
    wind: 12,
    forecast: [
      { day: 'Lun', temp: 25, icon: <FiSun /> },
      { day: 'Mar', temp: 23, icon: <FiCloud /> },
      { day: 'Mer', temp: 22, icon: <FiCloudRain /> },
      { day: 'Jeu', temp: 24, icon: <FiSun /> },
    ]
  };

  return (
    <div className={clsx(styles['weather-widget'])}>
      <div className={clsx(styles['widget-header'])}>
        <h3 className={clsx(styles['widget-title'])}>Météo Agricole</h3>
        <span className={clsx(styles['location'])}>{weatherData.location}</span>
      </div>

      <div className={clsx(styles['current-weather'])}>
        <div className={clsx(styles['weather-icon'])}>
          <FiSun size={48} />
        </div>
        <div className={clsx(styles['weather-info'])}>
          <div className={clsx(styles['temperature'])}>{weatherData.temperature}°C</div>
          <div className={clsx(styles['condition'])}>{weatherData.condition}</div>
        </div>
      </div>

      <div className={clsx(styles['weather-details'])}>
        <div className={clsx(styles['detail-item'])}>
          <FiDroplet />
          <span>Humidité: {weatherData.humidity}%</span>
        </div>
        <div className={clsx(styles['detail-item'])}>
          <FiWind />
          <span>Vent: {weatherData.wind} km/h</span>
        </div>
      </div>

      <div className={clsx(styles['forecast'])}>
        <h4 className={clsx(styles['forecast-title'])}>Prévisions</h4>
        <div className={clsx(styles['forecast-list'])}>
          {weatherData.forecast.map((day, index) => (
            <div key={index} className={clsx(styles['forecast-item'])}>
              <span className={clsx(styles['forecast-day'])}>{day.day}</span>
              <span className={clsx(styles['forecast-icon'])}>{day.icon}</span>
              <span className={clsx(styles['forecast-temp'])}>{day.temp}°</span>
            </div>
          ))}
        </div>
      </div>

      <div className={clsx(styles['farming-tip'])}>
        <p>💡 Conditions idéales pour l'irrigation aujourd'hui</p>
      </div>
    </div>
  );
}
