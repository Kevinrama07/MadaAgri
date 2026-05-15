// Date helpers
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year);
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) return Math.floor(interval) + ' ans';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' mois';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' jours';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' heures';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes';
  return Math.floor(seconds) + ' secondes';
};

// String helpers
export const truncateString = (str, length = 100) => {
  return str && str.length > length ? str.substring(0, length) + '...' : str;
};

export const capitalize = (str) => {
  return str && str.charAt(0).toUpperCase() + str.slice(1);
};

export const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Validation helpers
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return re.test(phone);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Number helpers
export const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-MG', {
    style: 'currency',
    currency: 'MGA',
  }).format(price);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-MG').format(num);
};

// Array helpers
export const removeDuplicates = (arr, key) => {
  if (!key) return [...new Set(arr)];
  const seen = new Set();
  return arr.filter((item) => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export const groupBy = (arr, key) => {
  return arr.reduce((acc, item) => {
    const group = item[key];
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
};

export const sortBy = (arr, key, order = 'asc') => {
  return [...arr].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};

// Object helpers
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Calculation helpers
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateAverageLat = (locations) => {
  if (locations.length === 0) return 0;
  return locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
};

export const calculateAverageLon = (locations) => {
  if (locations.length === 0) return 0;
  return locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;
};

export default {
  formatDate,
  timeAgo,
  truncateString,
  capitalize,
  slugify,
  validateEmail,
  validatePhone,
  validatePassword,
  formatPrice,
  formatNumber,
  removeDuplicates,
  groupBy,
  sortBy,
  deepClone,
  calculateDistance,
  calculateAverageLat,
  calculateAverageLon,
};
