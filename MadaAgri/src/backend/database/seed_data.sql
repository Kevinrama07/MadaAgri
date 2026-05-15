USE madaagri;
INSERT IGNORE INTO users (id, email, password_hash, display_name, role, profile_image_url, bio, region_id, phone) VALUES
  -- Agriculteurs
  ('u-1', 'randria.jean@email.mg', '$2b$10$xxx1', 'Jean Randria', 'farmer', 'https://randomuser.me/api/portraits/men/32.jpg', 'Agriculteur passionné depuis 20 ans. Spécialiste en riziculture biologique.', 'r-1', '+261 34 12 345 67'),
  ('u-2', 'rasoa.marie@email.mg', '$2b$10$xxx2', 'Marie Rasoa', 'farmer', 'https://randomuser.me/api/portraits/women/44.jpg', 'Productrice de légumes et fruits. Agriculture durable.', 'r-2', '+261 33 98 765 43'),
  ('u-3', 'rakoto.faly@email.mg', '$2b$10$xxx3', 'Faly Rakoto', 'farmer', 'https://randomuser.me/api/portraits/men/67.jpg', 'Expert en cultures maraicheres. Vendeur sur le marche d Antsirabe.', 'r-3', '+261 32 11 222 33'),
  ('u-4', 'razafy.noro@email.mg', '$2b$10$xxx4', 'Noro Razafy', 'farmer', 'https://randomuser.me/api/portraits/women/28.jpg', 'Cultivatrice de manioc et patate douce. Bio certifié.', 'r-4', '+261 34 55 666 77'),
  ('u-5', 'andria.hery@email.mg', '$2b$10$xxx5', 'Hery Andria', 'farmer', 'https://randomuser.me/api/portraits/men/15.jpg', 'Producteur de maïs et arachide. Techniques modernes.', 'r-1', '+261 33 44 555 66'),
  
  -- Clients
  ('u-6', 'razaf.miora@email.mg', '$2b$10$xxx6', 'Miora Razaf', 'client', 'https://randomuser.me/api/portraits/women/65.jpg', 'Restauratrice à Antananarivo. À la recherche de produits frais.', 'r-2', '+261 32 77 888 99'),
  ('u-7', 'rabe.tiana@email.mg', '$2b$10$xxx7', 'Tiana Rabe', 'client', 'https://randomuser.me/api/portraits/men/22.jpg', 'Épicier. Grossiste en produits agricoles.', 'r-3', '+261 34 22 333 44'),
  ('u-8', 'rasolofoniaina.cli@email.mg', '$2b$10$xxx8', 'Nomena Rasolofoniaina', 'client', 'https://randomuser.me/api/portraits/women/33.jpg', 'Mère de famille. Consommatrice locale.', 'r-1', '+261 33 11 000 22'),
  ('u-9', 'rakotomalala.solo@email.mg', '$2b$10$xxx9', 'Solo Rakotomalala', 'client', 'https://randomuser.me/api/portraits/men/45.jpg', 'Chef cuisinier. Produits de qualité requis.', 'r-4', '+261 32 88 999 00'),
  ('u-10', 'andriamanana.lina@email.mg', '$2b$10$xxx10', 'Lina Andriamanana', 'client', 'https://randomuser.me/api/portraits/women/19.jpg', 'Marchande de légumes au marché.', 'r-2', '+261 34 66 777 88');

INSERT IGNORE INTO products (id, farmer_id, culture_id, title, description, price, quantity, unit, region_id, is_available) VALUES
  -- Jean Randria
  ('p-1', 'u-1', 'c-1', 'Riz Premium Bio', 'Riz blanc de qualité supérieure, cultivé sans pesticides. Récolte 2024.', 3500, 500, 'kg', 'r-1', TRUE),
  ('p-2', 'u-1', 'c-5', 'Haricots verts frais', 'Haricots verts tendres, parfaits pour salades et plats sautés.', 2500, 100, 'kg', 'r-1', TRUE),
  
  -- Marie Rasoa
  ('p-3', 'u-2', 'c-1', 'Riz rouge traditionnel', 'Riz rouge authentique de Madagascar. Goût unique.', 4000, 300, 'kg', 'r-2', TRUE),
  ('p-4', 'u-2', 'c-3', 'Manioc frais', 'Manioc de première qualité, récolté le jour même.', 1500, 200, 'kg', 'r-2', TRUE),
  ('p-5', 'u-2', 'c-6', 'Patates douces oranges', 'Patates douces riches en vitamines A. Douces et fondantes.', 2000, 150, 'kg', 'r-2', TRUE),
  
  -- Faly Rakoto
  ('p-6', 'u-3', 'c-2', 'Maïs jaune en épis', 'Maïs sucré frais, idéal pour grillades et cuissons vapeur.', 1800, 180, 'kg', 'r-3', TRUE),
  ('p-7', 'u-3', 'c-5', 'Haricots rouges secs', 'Haricots rouges de qualité supérieure pour le vary amin-anana.', 3200, 120, 'kg', 'r-3', TRUE),
  
  -- Noro Razafy
  ('p-8', 'u-4', 'c-3', 'Manioc bio certifié', 'Manioc cultivé biologiquement. Certifié par EcoCert Madagascar.', 1800, 250, 'kg', 'r-4', TRUE),
  ('p-9', 'u-4', 'c-6', 'Patates douces bio', 'Patates douces biologiques. Parfaites pour le petitesse et desserts.', 2500, 100, 'kg', 'r-4', TRUE),
  
  -- Hery Andria
  ('p-10', 'u-5', 'c-2', 'Maïs blanc séché', 'Maïs blanc séché pour farine et consommation animale.', 1200, 400, 'kg', 'r-1', TRUE),
  ('p-11', 'u-5', 'c-4', 'Arachides décortiquées', 'Cacahuètes fraîches, riches en protéines. Idéales pour snacks.', 6000, 80, 'kg', 'r-1', TRUE);

INSERT IGNORE INTO posts (id, author_id, content, image_url, visibility) VALUES
  ('post-1', 'u-1', 'Bonne nouvelle ! La récolte de riz 2025 est exceptionnelle. Les pluies ont été parfaites. Venez découvrir mon riz premium bio ! 🌾', 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600', 'public'),
  ('post-2', 'u-2', 'Nouveau : manioc frais disponible des demain matin. Recolte aujourd hui meme. Reservez vite !', 'https://images.unsplash.com/photo-1596097635121-14b63b7bbfc2?w=600', 'public'),
  ('post-3', 'u-3', 'Le maïs est arrivé ! 🌽 Épis frais et sucrés, parfaits pour vos grillades. Livraison possible sur Antsirabe.', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600', 'public'),
  ('post-4', 'u-1', 'Conseil du jour : pour conserver le riz plus longtemps, stockez-le dans un endroit sec et frais. Evitez l humidite !', NULL, 'public'),
  ('post-5', 'u-4', 'Fiere d annoncer que notre manioc est maintenant certifie bio ! Merci a tous pour votre confiance.', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600', 'public'),
  ('post-6', 'u-5', 'L arachide malgache est reconnue mondialement pour sa qualite. Decouvrez pourquoi !', 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=600', 'public'),
  ('post-7', 'u-2', 'Petit-dejeuner malgache ideal : riz avec du varying sy ranonango. Qui connait ?', NULL, 'public'),
  ('post-8', 'u-3', 'Les haricots rouges sont parfaits pour le vary amin-anana. Recette en story !', NULL, 'public'),
  ('post-9', 'u-6', 'En tant que restauratrice, je recommande le riz de Jean Randria. Qualité incomparable ! ⭐', NULL, 'public'),
  ('post-10', 'u-1', 'Saison des pluies : tout ce qu il faut savoir pour vos cultures. Thread (1/3)', NULL, 'public');

INSERT IGNORE INTO post_likes (post_id, user_id) VALUES
  ('post-1', 'u-6'), ('post-1', 'u-7'), ('post-1', 'u-8'),
  ('post-2', 'u-1'), ('post-2', 'u-3'), ('post-2', 'u-6'),
  ('post-3', 'u-2'), ('post-3', 'u-4'), ('post-3', 'u-9'), ('post-3', 'u-10'),
  ('post-5', 'u-1'), ('post-5', 'u-2'), ('post-5', 'u-3'), ('post-5', 'u-6'),
  ('post-6', 'u-7'), ('post-6', 'u-9'),
  ('post-9', 'u-1'), ('post-9', 'u-3'), ('post-9', 'u-4');

INSERT IGNORE INTO post_comments (id, post_id, user_id, parent_id, content) VALUES
  ('com-1', 'post-1', 'u-6', NULL, 'Super nouvelle ! Je vais commander 50kg pour mon restaurant.'),
  ('com-2', 'post-1', 'u-1', 'com-1', 'Parfait Miora ! Je te livre demain matin.'),
  ('com-3', 'post-2', 'u-8', NULL, 'Quel est le prix du manioc ?'),
  ('com-4', 'post-2', 'u-2', 'com-3', '1500 Ar/kg. Je peux te réserver si tu veux.'),
  ('com-5', 'post-3', 'u-9', NULL, 'Excellent ! Tu fais livraison sur Antananarivo ?'),
  ('com-6', 'post-5', 'u-1', NULL, 'Felicitations Noro ! Le bio c est l avenir'),
  ('com-7', 'post-6', 'u-7', NULL, 'J aimerais acheter en gros pour ma boutique. Possible ?'),
  ('com-8', 'post-6', 'u-5', 'com-7', 'Bien sûr Tiana ! Envoie-moi un message pour les tarifs gros.');

INSERT IGNORE INTO follows (follower_id, followee_id, status) VALUES
  ('u-6', 'u-1', 'following'),
  ('u-6', 'u-2', 'following'),
  ('u-7', 'u-3', 'following'),
  ('u-7', 'u-5', 'following'),
  ('u-8', 'u-1', 'following'),
  ('u-8', 'u-4', 'following'),
  ('u-9', 'u-2', 'following'),
  ('u-9', 'u-3', 'following'),
  ('u-10', 'u-2', 'following'),
  ('u-10', 'u-4', 'following'),
  
  ('u-1', 'u-2', 'friends'),
  ('u-2', 'u-1', 'friends'),
  ('u-1', 'u-3', 'following'),
  ('u-2', 'u-4', 'following'),
  ('u-3', 'u-5', 'friends'),
  ('u-5', 'u-3', 'friends'),
  ('u-4', 'u-1', 'following');

INSERT IGNORE INTO messages (id, sender_id, recipient_id, conversation_id, content, is_read) VALUES
  ('msg-1', 'u-6', 'u-1', 'u-1-u-6', 'Bonjour Jean, avez-vous du riz disponible ?', TRUE),
  ('msg-2', 'u-1', 'u-6', 'u-1-u-6', 'Bonjour Miora ! Oui, j ai 500kg de riz premium.', TRUE),
  ('msg-3', 'u-6', 'u-1', 'u-1-u-6', 'Parfait ! Je voudrais en commander 100kg.', TRUE),
  ('msg-4', 'u-1', 'u-6', 'u-1-u-6', 'Très bien. Je peux livrer demain matin. 3500 Ar/kg.', TRUE),
  ('msg-5', 'u-7', 'u-3', 'u-3-u-7', 'Faly, je cherche du maïs en grande quantité.', FALSE),
  ('msg-6', 'u-3', 'u-7', 'u-3-u-7', 'Je peux vous fournir 200kg. Appelez-moi au 032 11 222 33.', FALSE),
  ('msg-7', 'u-9', 'u-2', 'u-2-u-9', 'Bonjour Marie, patates douces disponibles ?', TRUE),
  ('msg-8', 'u-2', 'u-9', 'u-2-u-9', 'Oui ! 150kg disponibles. 2000 Ar/kg.', FALSE);

INSERT IGNORE INTO notifications (id, user_id, type, payload_json, is_read) VALUES
  ('notif-1', 'u-1', 'new_follower', '{"follower_name": "Miora Razaf", "follower_id": "u-6"}', FALSE),
  ('notif-2', 'u-1', 'new_order', '{"product": "Riz Premium Bio", "quantity": 100}', FALSE),
  ('notif-3', 'u-2', 'post_like', '{"post_id": "post-2", "liker_name": "Jean Randria"}', TRUE),
  ('notif-4', 'u-3', 'new_follower', '{"follower_name": "Tiana Rabe", "follower_id": "u-7"}', FALSE),
  ('notif-5', 'u-6', 'order_confirmed', '{"product": "Riz Premium Bio", "quantity": 100, "farmer": "Jean Randria"}', TRUE),
  ('notif-6', 'u-4', 'certification_obtained', '{"type": "Bio", "product": "Manioc"}', TRUE);

INSERT IGNORE INTO reservations (id, product_id, client_id, farmer_id, quantity, unit_price, status) VALUES
  ('res-1', 'p-1', 'u-6', 'u-1', 100, 3500, 'confirmed'),
  ('res-2', 'p-4', 'u-8', 'u-2', 20, 1500, 'pending'),
  ('res-3', 'p-6', 'u-7', 'u-3', 50, 1800, 'confirmed'),
  ('res-4', 'p-11', 'u-10', 'u-5', 15, 6000, 'pending'),
  ('res-5', 'p-3', 'u-9', 'u-2', 30, 4000, 'completed');

INSERT IGNORE INTO cart_items (id, user_id, product_id, quantity) VALUES
  ('cart-1', 'u-8', 'p-5', 10),
  ('cart-2', 'u-9', 'p-7', 25),
  ('cart-3', 'u-10', 'p-1', 50);

INSERT IGNORE INTO deliveries (id, farmer_id, product_id, destination_region_id, start_latitude, start_longitude, end_latitude, end_longitude, distance_km, estimated_duration_hours, status) VALUES
  ('del-1', 'u-1', 'p-1', 'r-2', -21.2167, 47.0833, -19.0833, 46.6333, 245.5, 4.5, 'in_progress'),
  ('del-2', 'u-3', 'p-6', 'r-1', -19.9333, 47.5167, -21.2167, 47.0833, 178.2, 3.2, 'completed');

INSERT IGNORE INTO collaboration_invitations (id, sender_id, recipient_id, message, status) VALUES
  ('inv-1', 'u-1', 'u-2', 'Marie, serait-ce possible de créer une offre combinée riz + légumes pour les restaurants ?', 'accepted'),
  ('inv-2', 'u-6', 'u-3', 'Je voudrais m associer avec vous pour les livraisons sur Tana.', 'pending'),
  ('inv-3', 'u-9', 'u-4', 'Partenariat possible pour les légumes bio pour mon restaurant ?', 'pending');
