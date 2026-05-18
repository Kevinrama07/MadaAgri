-- Smart Agricultural Land Parcel Management
-- Table for storing user land parcels

CREATE TABLE IF NOT EXISTS land_parcels (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  size_ha DECIMAL(10, 2),
  country VARCHAR(100),
  region VARCHAR(100),
  district VARCHAR(100),
  commune VARCHAR(100),
  soil_type VARCHAR(100),
  soil_ph DECIMAL(3, 1),
  soil_organic_matter DECIMAL(5, 2),
  climate_type VARCHAR(100),
  annual_rainfall_mm INT,
  avg_temperature DECIMAL(4, 1),
  suitability_score DECIMAL(5, 2),
  recommended_crops JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_location (latitude, longitude),
  INDEX idx_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Crop Analysis Results
CREATE TABLE IF NOT EXISTS crop_analysis_results (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  parcel_id VARCHAR(36),
  image_url VARCHAR(500),
  detected_crop VARCHAR(100),
  confidence_score DECIMAL(5, 2),
  health_score DECIMAL(5, 2),
  disease_detected VARCHAR(100),
  disease_risk DECIMAL(5, 2),
  recommendations JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_parcel_id (parcel_id),
  INDEX idx_crop (detected_crop)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
