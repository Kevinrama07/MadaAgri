import * as Location from 'expo-location';
import * as Geolocation from 'expo-location';
import { calculateDistance } from '../utils/helpers';
import logger from '../utils/logger';

export const geolocationService = {
  // Request location permissions
  requestLocationPermissions: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Location permission denied');
        return false;
      }
      logger.log('Location permission granted');
      return true;
    } catch (error) {
      logger.error('Error requesting location permissions:', error);
      return false;
    }
  },

  // Get current location
  getCurrentLocation: async () => {
    try {
      const hasPermission = await geolocationService.requestLocationPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      logger.log('Current location:', location);
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      logger.error('Error getting current location:', error);
      return null;
    }
  },

  // Watch location changes
  watchLocation: async (callback, options = {}) => {
    try {
      const hasPermission = await geolocationService.requestLocationPermissions();
      if (!hasPermission) return null;

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: options.timeInterval || 5000, // 5 seconds
          distanceInterval: options.distanceInterval || 10, // 10 meters
        },
        (location) => {
          logger.log('Location updated:', location.coords);
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          });
        }
      );

      return subscription;
    } catch (error) {
      logger.error('Error watching location:', error);
      return null;
    }
  },

  // Stop watching location
  stopWatchingLocation: (subscription) => {
    try {
      if (subscription) {
        subscription.remove();
        logger.log('Stopped watching location');
      }
    } catch (error) {
      logger.error('Error stopping location watch:', error);
    }
  },

  // Reverse geocode (get address from coordinates)
  reverseGeocode: async (latitude, longitude) => {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        logger.log('Reverse geocoded address:', address);
        return address;
      }
      return null;
    } catch (error) {
      logger.error('Error reverse geocoding:', error);
      return null;
    }
  },

  // Forward geocode (get coordinates from address)
  forwardGeocode: async (address) => {
    try {
      const result = await Location.geocodeAsync(address);

      if (result.length > 0) {
        logger.log('Forward geocoded result:', result[0]);
        return {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        };
      }
      return null;
    } catch (error) {
      logger.error('Error forward geocoding:', error);
      return null;
    }
  },

  // Calculate distance between two points
  calculateDistanceBetweenPoints: (lat1, lon1, lat2, lon2) => {
    return calculateDistance(lat1, lon1, lat2, lon2);
  },

  // Get region from locations
  getRegionFromLocations: (locations) => {
    if (locations.length === 0) return null;

    const latitudes = locations.map((loc) => loc.latitude);
    const longitudes = locations.map((loc) => loc.longitude);

    return {
      latitude: (Math.max(...latitudes) + Math.min(...latitudes)) / 2,
      longitude: (Math.max(...longitudes) + Math.min(...longitudes)) / 2,
      latitudeDelta: Math.max(...latitudes) - Math.min(...latitudes) + 0.1,
      longitudeDelta: Math.max(...longitudes) - Math.min(...longitudes) + 0.1,
    };
  },
};

export default geolocationService;
