-- MySQL schema for MadaAgri 2035

CREATE DATABASE IF NOT EXISTS madaagri;
USE madaagri;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  role ENUM('farmer','client','admin') DEFAULT 'client',
  profile_image_url VARCHAR(1024),
  bio TEXT,
  region_id VARCHAR(36),
  phone VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(191) UNIQUE NOT NULL,
  description TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  soil_type VARCHAR(255),
  climate VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cultures (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(191) UNIQUE NOT NULL,
  description TEXT,
  ideal_soil VARCHAR(255),
  ideal_climate VARCHAR(255),
  growing_period_days INT,
  yield_potential VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS region_cultures (
  region_id VARCHAR(36) NOT NULL,
  culture_id VARCHAR(36) NOT NULL,
  suitability_score INT NOT NULL DEFAULT 50,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (region_id, culture_id),
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
  FOREIGN KEY (culture_id) REFERENCES cultures(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  farmer_id VARCHAR(36) NOT NULL,
  culture_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  unit VARCHAR(50) DEFAULT 'kg',
  image_url VARCHAR(1024),
  region_id VARCHAR(36),
  is_available BOOLEAN DEFAULT TRUE,
  visibility ENUM('public','private') DEFAULT 'public',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (culture_id) REFERENCES cultures(id) ON DELETE SET NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL
);

-- Mini réseau social: publications + interactions
CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(36) PRIMARY KEY,
  author_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(1024),
  visibility ENUM('public','followers','private') DEFAULT 'public',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_comments (
  id VARCHAR(36) PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id VARCHAR(36) NOT NULL,
  followee_id VARCHAR(36) NOT NULL,
  status ENUM('following','friends') DEFAULT 'following',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followee_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  payload_json JSON,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  sender_id VARCHAR(36) NOT NULL,
  recipient_id VARCHAR(36) NOT NULL,
  conversation_id VARCHAR(72) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deliveries (
  id VARCHAR(36) PRIMARY KEY,
  farmer_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36),
  destination_region_id VARCHAR(36),
  start_latitude DECIMAL(10,8) NOT NULL,
  start_longitude DECIMAL(11,8) NOT NULL,
  end_latitude DECIMAL(10,8) NOT NULL,
  end_longitude DECIMAL(11,8) NOT NULL,
  distance_km DECIMAL(10,2),
  estimated_duration_hours DECIMAL(8,2),
  route_json JSON,
  status ENUM('planned','in_progress','completed') DEFAULT 'planned',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (destination_region_id) REFERENCES regions(id) ON DELETE SET NULL
);

-- Seed sample data
INSERT IGNORE INTO regions (id, name, description, latitude, longitude, soil_type, climate) VALUES
  ('r-1','Haute Matsiatra','Region montagneuse, sols riches','-21.2167','47.0833','argile','montagne'),
  ('r-2','Itasy','Région lacustre','-19.0833','46.6333','limon','tropical');

INSERT IGNORE INTO cultures (id, name, description, ideal_soil, ideal_climate, growing_period_days, yield_potential) VALUES
  ('c-1','Riz','Culture de riz traditionnelle','argile','tropical',120,'élevé'),
  ('c-2','Maïs','Céréale pour alimentation','sableux','tropical',90,'moyen');

INSERT IGNORE INTO region_cultures (region_id, culture_id, suitability_score) VALUES
  ('r-1','c-1',92),
  ('r-1','c-2',70),
  ('r-2','c-1',88),
  ('r-2','c-2',85);

