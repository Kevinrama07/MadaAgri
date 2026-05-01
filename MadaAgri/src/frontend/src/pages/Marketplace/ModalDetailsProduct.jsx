import { useState } from 'react';
import clsx from 'clsx';
import { FiX, FiMinus, FiPlus, FiImage, FiUser, FiMapPin, FiBox, FiShoppingCart } from 'react-icons/fi';
import { GiWeight } from 'react-icons/gi';
import styles from '../../styles/Marketplace/ModalDetailsProduct.module.css';

export default function ModalDetailsProduct({ product, regions, cultures, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  const region = regions.find((r) => r.id === product.region_id);
  const culture = cultures.find((c) => c.id === product.culture_id);

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty > 0 && newQty <= product.quantity) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
  };

  return (
    <div className={clsx(styles['modal-overlay'])} onClick={onClose}>
      <div className={clsx(styles['modal-details'])} onClick={(e) => e.stopPropagation()}>
        <p className={clsx(styles['modal-close-btn'])} onClick={onClose}>
          <img src="/src/images/quitter.gif" alt="" />
        </p>

        <div className={clsx(styles['modal-body'])}>
          {/* Image Section */}
          <div className={clsx(styles['left'])}>
            <div className={clsx(styles['details-image-section'])}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className={clsx(styles['details-image'])} />
              ) : (
                <div className={clsx(styles['details-image-placeholder'])}>
                  <FiImage />
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className={clsx(styles['details-content-section'])}>
              {/* Farmer Card */}
              <div className={clsx(styles['details-farmer-section'])}>
                <div className={clsx(styles['farmer-avatar-wrapper'])}>
                  {product.farmer_image ? (
                    <img src={product.farmer_image} alt={product.farmer_name} className={clsx(styles['farmer-avatar'])} />
                  ) : (
                    <div className={clsx(styles['farmer-avatar-placeholder'])}>
                      <FiUser />
                    </div>
                  )}
                </div>
                <div className={clsx(styles['farmer-info'])}>
                  <h3 className={clsx(styles['farmer-name'])}>{product.farmer_name}</h3>
                  {region && <p className={clsx(styles['farmer-region'])}><FiMapPin />{region.name}</p>}
                </div>
              </div>

              {/* Title */}
              <h2 className={clsx(styles['details-title'])}>{product.title}</h2>

              {/* Description */}
              {product.description && (
                <p className={clsx(styles['details-description'])}>{product.description}</p>
              )}
            </div>
          </div>
          <div className={clsx(styles['right'])}>
            {/* Info Grid */}
            <div className={clsx(styles['details-info-grid'])}>
            {culture && (
              <div className={clsx(styles['info-item'])}>
                <span className={clsx(styles['info-icon'])}><FiBox /></span>
                <span className={clsx(styles['info-label'])}>Culture</span>
                <span className={clsx(styles['info-value'])}>{culture.name}</span>
              </div>
              )}

              <div className={clsx(styles['info-item'])}>
                <span className={clsx(styles['info-icon'])}><GiWeight /></span>
                <span className={clsx(styles['info-label'])}>Unité</span>
                <span className={clsx(styles['info-value'])}>{product.unit}</span>
              </div>

              <div className={clsx(styles['info-item'])}>
                <span className={clsx(styles['info-icon'])}><FiBox /></span>
                <span className={clsx(styles['info-label'])}>Stock</span>
                <span className={clsx(styles['info-value'])}>{product.quantity}</span>
              </div>

              {region && (
              <div className={clsx(styles['info-item'])}>
                <span className={clsx(styles['info-icon'])}><FiMapPin /></span>
                <span className={clsx(styles['info-label'])}>Région</span>
                <span className={clsx(styles['info-value'])}>{region.name}</span>
              </div>
              )}
            </div>

            {/* Price and Quantity Section */}
            <div className={clsx(styles['details-purchase-section'])}>
              {/* Price Block */}
              <div className={clsx(styles['purchase-price-block'])}>
                <span className={clsx(styles['purchase-price-label'])}>Prix unitaire</span>
                <span className={clsx(styles['purchase-price'])}>{Number(product.price).toLocaleString('fr-FR')} Ar</span>
              </div>

              {/* Quantity Block */}
              <div className={clsx(styles['purchase-quantity-block'])}>
                <span className={clsx(styles['purchase-quantity-label'])}>Quantité</span>
                <div className={clsx(styles['quantity-selector'])}>
                  <button
                      className={clsx(styles['qty-btn'])}
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      title="Diminuer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (val > 0 && val <= product.quantity) {
                        setQuantity(val);
                      }
                    }}
                    className={clsx(styles['qty-input'])}
                    min="1"
                    max={product.quantity}
                  />
                  <button
                    className={clsx(styles['qty-btn'])}
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.quantity}
                    title="Augmenter"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className={clsx(styles['details-total-section'])}>
              <div className={clsx(styles['total-row'])}>
                <span className={clsx(styles['total-label'])}>Sous-total</span>
                <span className={clsx(styles['total-price'])}>{Number(product.price * quantity).toLocaleString('fr-FR')} Ar</span>
              </div>
            </div>

            <button className={clsx(styles['btn-add-to-cart'])} onClick={handleAddToCart}>
              <FiShoppingCart />
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
