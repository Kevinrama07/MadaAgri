const https = require('https');

class ReverseGeolocationService {
  static async getLocationFromCoordinates(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=10`;

      return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'MadaAgri/1.0' } }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const { address } = parsed;
              resolve({
                country: address?.country || 'Madagascar',
                region: address?.state || address?.province || address?.region || '',
                district: address?.county || address?.district || '',
                commune: address?.city || address?.town || address?.village || address?.municipality || '',
                raw: parsed,
              });
            } catch (e) {
              resolve({
                country: 'Madagascar',
                region: '',
                district: '',
                commune: '',
                raw: null,
              });
            }
          });
        }).on('error', () => {
          resolve({
            country: 'Madagascar',
            region: '',
            district: '',
            commune: '',
            raw: null,
          });
        });
      });
    } catch (error) {
      console.error('[ReverseGeolocation] Error:', error.message);
      return {
        country: 'Madagascar',
        region: '',
        district: '',
        commune: '',
        raw: null,
      };
    }
  }

  static async batchGetLocations(coordinates) {
    const results = [];
    for (const { lat, lng } of coordinates) {
      const location = await this.getLocationFromCoordinates(lat, lng);
      results.push({ lat, lng, ...location });
    }
    return results;
  }
}

module.exports = ReverseGeolocationService;
