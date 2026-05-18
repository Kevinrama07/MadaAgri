import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { FiMapPin, FiStar, FiHeart, FiShare2, FiShield, FiTruck, FiRefreshCw, FiChevronLeft, FiChevronRight, FiMessageCircle } from 'react-icons/fi';
import styles from './ProductDetail.module.css';

const productData = {
  1: {
    id: 1,
    name: 'Premium Rice (Variety Betsileo)',
    category: 'Cereals',
    price: 2450,
    unit: 'kg',
    minOrder: 25,
    description: 'High-quality Betsileo rice grown in the fertile highlands of Antsirabe. This premium variety is known for its exceptional taste, aroma, and nutritional value. Perfect for restaurants, retailers, and families who demand the best.',
    features: [
      'Hand-harvested from terraced paddies',
      'No chemical pesticides used',
      'Traditional sun-drying process',
      'Grade A quality certification',
    ],
    seller: {
      name: 'Coop Antsirabe',
      location: 'Antsirabe, Vakinankaratra',
      rating: 4.8,
      reviews: 124,
      verified: true,
      memberSince: '2023',
      responseRate: '95%',
      avatar: 'CA',
    },
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1536304993881-460e32f50069?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop',
    ],
    rating: 4.8,
    reviews: 124,
    badge: 'Best seller',
  },
};

export default function ProductDetail() {
  const { id } = useParams();
  const product = productData[id] || productData[1];
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(product.minOrder);
  const [isFavorite, setIsFavorite] = useState(false);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.container}>
        <Link to="/marketplace" className={styles.backLink}>
          <FiChevronLeft size={16} />
          Back to marketplace
        </Link>

        <div className={styles.grid}>
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              <img src={product.images[selectedImage]} alt={product.name} />
              <div className={styles.imageNav}>
                <button className={styles.imageNavBtn} onClick={prevImage}>
                  <FiChevronLeft size={18} />
                </button>
                <button className={styles.imageNavBtn} onClick={nextImage}>
                  <FiChevronRight size={18} />
                </button>
              </div>
              {product.badge && (
                <Badge variant="primary" className={styles.imageBadge}>
                  {product.badge}
                </Badge>
              )}
            </div>
            <div className={styles.thumbnails}>
              {product.images.map((img, index) => (
                <button
                  key={index}
                  className={`${styles.thumb} ${selectedImage === index ? styles.active : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img} alt={`View ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoHeader}>
              <Badge variant="default" size="sm">{product.category}</Badge>
              <div className={styles.infoActions}>
                <button
                  className={`${styles.actionIcon} ${isFavorite ? styles.active : ''}`}
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <FiHeart size={18} />
                </button>
                <button className={styles.actionIcon}>
                  <FiShare2 size={18} />
                </button>
              </div>
            </div>

            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    size={14}
                    className={i < Math.floor(product.rating) ? styles.filled : ''}
                  />
                ))}
              </div>
              <span className={styles.ratingText}>
                {product.rating} ({product.reviews} reviews)
              </span>
              {product.seller.verified && (
                <Badge variant="success" size="xs" dot>Verified seller</Badge>
              )}
            </div>

            <div className={styles.priceBlock}>
              <span className={styles.price}>{product.price.toLocaleString()} Ar</span>
              <span className={styles.unit}>per {product.unit}</span>
            </div>

            <div className={styles.quantityBlock}>
              <label className={styles.quantityLabel}>Quantity (minimum {product.minOrder} {product.unit})</label>
              <div className={styles.quantityControl}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(Math.max(product.minOrder, quantity - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.minOrder, parseInt(e.target.value) || product.minOrder))}
                  className={styles.qtyInput}
                />
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
              <div className={styles.totalPrice}>
                Total: <span>{(product.price * quantity).toLocaleString()} Ar</span>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <Button variant="primary" size="lg" fullWidth>
                Place order
              </Button>
              <Button variant="outline" size="lg" fullWidth icon={<FiMessageCircle size={16} />}>
                Contact seller
              </Button>
            </div>

            <div className={styles.guarantees}>
              <div className={styles.guarantee}>
                <FiShield size={16} />
                <span>Secure payment</span>
              </div>
              <div className={styles.guarantee}>
                <FiTruck size={16} />
                <span>Delivery available</span>
              </div>
              <div className={styles.guarantee}>
                <FiRefreshCw size={16} />
                <span>Quality guarantee</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <Card className={styles.detailsCard}>
            <h2 className={styles.detailsTitle}>Description</h2>
            <p className={styles.description}>{product.description}</p>
            <h3 className={styles.featuresTitle}>Key features</h3>
            <ul className={styles.featuresList}>
              {product.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </Card>

          <Card className={styles.sellerCard}>
            <h2 className={styles.detailsTitle}>Seller information</h2>
            <div className={styles.sellerProfile}>
              <div className={styles.sellerAvatar}>{product.seller.avatar}</div>
              <div className={styles.sellerInfo}>
                <div className={styles.sellerName}>
                  {product.seller.name}
                  {product.seller.verified && (
                    <Badge variant="success" size="xs" dot>Verified</Badge>
                  )}
                </div>
                <div className={styles.sellerLocation}>
                  <FiMapPin size={12} />
                  {product.seller.location}
                </div>
              </div>
            </div>
            <div className={styles.sellerStats}>
              <div className={styles.sellerStat}>
                <div className={styles.sellerStatValue}>{product.seller.rating}</div>
                <div className={styles.sellerStatLabel}>Rating</div>
              </div>
              <div className={styles.sellerStat}>
                <div className={styles.sellerStatValue}>{product.seller.reviews}</div>
                <div className={styles.sellerStatLabel}>Reviews</div>
              </div>
              <div className={styles.sellerStat}>
                <div className={styles.sellerStatValue}>{product.seller.responseRate}</div>
                <div className={styles.sellerStatLabel}>Response</div>
              </div>
            </div>
            <Button variant="outline" size="md" fullWidth icon={<FiMessageCircle size={16} />}>
              Message seller
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
