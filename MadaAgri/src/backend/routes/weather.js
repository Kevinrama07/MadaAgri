const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

const CONDITIONS = [
  { key: 'sunny', fr: 'Ensoleillé', icon: 'weather-sunny', humidityBase: 45, windBase: 8, visBase: 10, uvBase: 8, rainBase: 5 },
  { key: 'partly-cloudy', fr: 'Partiellement nuageux', icon: 'weather-partly-cloudy', humidityBase: 55, windBase: 12, visBase: 8, uvBase: 5, rainBase: 15 },
  { key: 'cloudy', fr: 'Nuageux', icon: 'weather-cloudy', humidityBase: 68, windBase: 15, visBase: 6, uvBase: 3, rainBase: 30 },
  { key: 'rainy', fr: 'Pluie', icon: 'weather-rainy', humidityBase: 78, windBase: 18, visBase: 4, uvBase: 2, rainBase: 65 },
  { key: 'heavy-rain', fr: 'Pluie intense', icon: 'weather-pouring', humidityBase: 88, windBase: 25, visBase: 2, uvBase: 1, rainBase: 90 },
  { key: 'thunderstorm', fr: 'Orage', icon: 'weather-lightning', humidityBase: 92, windBase: 30, visBase: 2, uvBase: 0, rainBase: 95 },
];

const DAYS_FR = ['Aujourd\'hui', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

function rand(min, max) { return Math.round(min + Math.random() * (max - min)); }

function generateMadagascarForecast() {
  const today = new Date();
  const forecast = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayOfWeek = date.getDay();
    const dayLabel = i === 0 ? DAYS_FR[0] : DAYS_FR[dayOfWeek] || DAYS_FR[7];

    const condIdx = rand(0, 5);
    const cond = CONDITIONS[condIdx];

    const baseTemp = 26 + (condIdx <= 1 ? rand(1, 4) : condIdx <= 3 ? rand(-2, 2) : rand(-4, 0));
    const tempMax = Math.min(35, baseTemp + rand(2, 5));
    const tempMin = Math.max(16, baseTemp - rand(3, 6));

    const humidity = Math.min(100, cond.humidityBase + rand(-10, 10));
    const wind = Math.min(60, cond.windBase + rand(-4, 8));
    const visibility = Math.max(1, Math.min(10, cond.visBase + rand(-2, 2)));
    const pressure = rand(1005, 1025);
    const uvIndex = Math.min(12, Math.max(0, cond.uvBase + rand(-2, 2)));
    const rainChance = Math.min(100, Math.max(0, cond.rainBase + rand(-15, 15)));

    const sunriseHour = rand(5, 6);
    const sunsetHour = rand(17, 18);

    forecast.push({
      day: dayLabel,
      date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      condition: cond.fr,
      conditionKey: cond.key,
      tempMax,
      tempMin,
      humidity,
      wind,
      visibility,
      pressure,
      uvIndex,
      rainChance,
      sunrise: `${sunriseHour}:${rand(0, 59).toString().padStart(2, '0')}`,
      sunset: `${sunsetHour}:${rand(0, 59).toString().padStart(2, '0')}`,
    });
  }

  return {
    location: 'Madagascar',
    forecast,
    lastUpdate: new Date().toISOString(),
    source: 'generated',
  };
}

async function fetchOpenWeatherMapForecast(lat, lon) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const https = require('https');
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`;

    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.cod !== '200') return resolve(null);
            resolve(parsed);
          } catch { resolve(null); }
        });
      }).on('error', () => resolve(null));
    });
  } catch { return null; }
}

function transformOpenWeatherData(apiData) {
  if (!apiData?.list) return null;

  const today = new Date();
  const dailyMap = {};

  for (const item of apiData.list) {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split('T')[0];
    if (!dailyMap[dateKey]) dailyMap[dateKey] = [];
    dailyMap[dateKey].push(item);
  }

  const entries = Object.entries(dailyMap).slice(0, 7);
  const forecast = entries.map(([dateKey, items], i) => {
    const temps = items.map((t) => t.main.temp);
    const tempMax = Math.round(Math.max(...temps));
    const tempMin = Math.round(Math.min(...temps));
    const midday = items.find((t) => {
      const h = new Date(t.dt * 1000).getHours();
      return h >= 11 && h <= 14;
    }) || items[Math.floor(items.length / 2)];

    const date = new Date(dateKey);
    const dayOfWeek = date.getDay();
    const dayLabel = i === 0 ? DAYS_FR[0] : DAYS_FR[dayOfWeek] || DAYS_FR[7];

    const conditionMap = {
      'Clear': { key: 'sunny', fr: 'Ensoleillé' },
      'Clouds': { key: 'cloudy', fr: 'Nuageux' },
      'Rain': { key: 'rainy', fr: 'Pluie' },
      'Drizzle': { key: 'rainy', fr: 'Pluie fine' },
      'Thunderstorm': { key: 'thunderstorm', fr: 'Orage' },
      'Snow': { key: 'rainy', fr: 'Neige' },
      'Mist': { key: 'cloudy', fr: 'Brumeux' },
      'Fog': { key: 'cloudy', fr: 'Brouillard' },
    };
    const owmCond = midday?.weather?.[0]?.main || 'Clouds';
    const cond = conditionMap[owmCond] || { key: 'partly-cloudy', fr: 'Partiellement nuageux' };

    return {
      day: dayLabel,
      date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      condition: cond.fr,
      conditionKey: cond.key,
      tempMax,
      tempMin,
      humidity: midday?.main?.humidity || rand(50, 80),
      wind: Math.round((midday?.wind?.speed || rand(2, 15)) * 3.6),
      visibility: Math.round((midday?.visibility || 5000) / 1000),
      pressure: midday?.main?.pressure || rand(1005, 1025),
      uvIndex: rand(0, 10),
      rainChance: Math.round((midday?.pop || 0) * 100),
      sunrise: new Date(apiData.city?.sunrise * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      sunset: new Date(apiData.city?.sunset * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
  });

  return {
    location: apiData.city?.name || 'Madagascar',
    forecast,
    lastUpdate: new Date().toISOString(),
    source: 'openweathermap',
  };
}

function getTips(forecast) {
  const today = forecast?.[0];
  if (!today) return [];

  const tips = [];
  if (today.rainChance < 30) {
    tips.push({ icon: 'water', title: 'Arrosage recommandé', text: 'Peu de précipitations prévues. Prévoyez un arrosage matinal ou en soirée pour vos cultures.' });
  } else if (today.rainChance < 60) {
    tips.push({ icon: 'water', title: 'Arrosage modéré', text: 'Des précipitations modérées sont attendues. Ajustez l\'irrigation en conséquence.' });
  } else {
    tips.push({ icon: 'weather-rainy', title: 'Pluies attendues', text: 'Fortes chances de pluie. Évitez l\'irrigation et vérifiez le drainage des parcelles.' });
  }

  if (today.uvIndex >= 8) {
    tips.push({ icon: 'weather-sunny', title: 'Protection UV', text: 'Indice UV très élevé. Protégez-vous et vos cultures sensibles avec de l\'ombrage.' });
  } else if (today.uvIndex >= 5) {
    tips.push({ icon: 'weather-sunny', title: 'UV modéré', text: 'Indice UV modéré. Une protection légère est recommandée pour les travailleurs.' });
  }

  if (today.wind > 25) {
    tips.push({ icon: 'weather-windy', title: 'Vents forts', text: 'Vents violents attendus. Sécurisez les serres et structures légères.' });
  } else if (today.wind > 15) {
    tips.push({ icon: 'weather-windy', title: 'Vent modéré', text: 'Conditions venteuses. Évitez l\'épandage de produits phytosanitaires.' });
  }

  if (today.conditionKey === 'thunderstorm' || today.conditionKey === 'heavy-rain') {
    tips.push({ icon: 'flash', title: 'Drainage', text: 'Risque d\'orage ou pluie intense. Vérifiez le drainage des champs pour éviter l\'engorgement.' });
  }

  if (today.tempMax > 32) {
    tips.push({ icon: 'thermometer', title: 'Fortes chaleurs', text: 'Températures élevées. Arrosez tôt le matin et surveillez le stress hydrique.' });
  }

  if (today.humidity > 85) {
    tips.push({ icon: 'water', title: 'Humidité élevée', text: 'Risque de maladies fongiques. Surveillez l\'apparition de mildiou ou oïdium.' });
  }

  return tips.slice(0, 4);
}

router.get('/forecast', async (req, res) => {
  try {
    const lat = req.query.lat || -18.8792;
    const lon = req.query.lon || 47.5079;

    let weatherData = null;

    if (process.env.WEATHER_API_KEY) {
      const owmData = await fetchOpenWeatherMapForecast(lat, lon);
      if (owmData) {
        weatherData = transformOpenWeatherData(owmData);
      }
    }

    if (!weatherData) {
      weatherData = generateMadagascarForecast();
    }

    weatherData.tips = getTips(weatherData.forecast);
    weatherData.coordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };

    res.json({ success: true, data: weatherData, timestamp: new Date() });
  } catch (err) {
    logger.error({ message: 'Weather forecast error', error: err.message });
    const fallback = generateMadagascarForecast();
    fallback.tips = getTips(fallback.forecast);
    fallback.coordinates = { lat: -18.8792, lon: 47.5079 };
    res.json({ success: true, data: fallback, timestamp: new Date(), fallback: true });
  }
});

module.exports = router;
