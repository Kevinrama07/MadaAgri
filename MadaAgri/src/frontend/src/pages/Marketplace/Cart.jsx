import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { FiX, FiMinus, FiPlus, FiTrash2, FiCheckCircle, FiShoppingBag, FiAlertCircle, FiShoppingCart, FiImage, FiUser, FiArrowLeft } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Marketplace/Cart.module.css';

export default function Cart({ items, onRemove, onUpdateQuantity, onClose, onClear }) {
  const { isLoading, startLoading, stopLoading } = usePageLoading();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Auto-fermer le message de succès après 3 secondes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
        onClear();
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, onClear, onClose]);

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      setError('Votre panier est vide');
      return;
    }

    startLoading();
    setError('');

    try {
      await dataApi.createReservation(items);

      setSuccess('Réservation envoyée ! En attente de confirmation de l\'agriculteur...');
    } catch (err) {
      console.error('Erreur lors de la commande:', err);
      setError(err.message || 'Erreur lors de la confirmation de la commande');
    } finally {
      stopLoading();
    }
  };

  return (
    <div className={clsx(styles['cart-sidebar'])}>
      {/* Message de succès */}
      {success && (
        <div className={clsx(styles['cart-success-overlay'])}>
          <div className={clsx(styles['cart-success-container'])}>
            <div className={clsx(styles['success-icon'])}>
              <FiCheckCircle />
            </div>
            <h3 className={clsx(styles['success-title'])}>Succès !</h3>
            <p className={clsx(styles['success-message'])}>{success}</p>
            <div className={clsx(styles['success-progress'])}></div>
          </div>
        </div>
      )}

      <div className={clsx(styles['cart-header'])}>
        <div className={clsx(styles['cart-header-left'])}>
          <FiShoppingBag />
          <h2 className={clsx(styles['cart-title'])}>Panier</h2>
        </div>
        <p className={clsx(styles['cart-close-btn'])} onClick={onClose}>
          <img src="/src/images/quitter.gif" alt="Quitter" />
        </p>
      </div>

      {error && (
        <div className={clsx(styles['cart-error'])}>
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      <div className={clsx(styles['cart-items-container'])}>
        {items.length === 0 ? (
          <div className={clsx(styles['cart-empty'])}>
            <div className={clsx(styles['cart-empty-icon'])}>
              <FiShoppingCart />
            </div>
            <p className={clsx(styles['cart-empty-title'])}>Votre panier est vide</p>
            <p className={clsx(styles['cart-empty-subtitle'])}>Ajoutez des produits pour commencer</p>
          </div>
        ) : (
          <div className={clsx(styles['cart-items-list'])}>
            {items.map((item, index) => (
              <div key={item.id} className={clsx(styles['cart-item'])} style={{'--item-index': index}}>
                <div className={clsx(styles['cart-item-image-wrapper'])}>
                  <div className={clsx(styles['cart-item-image'])}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} />
                    ) : (
                      <div className={clsx(styles['cart-item-image-placeholder'])}>
                        <FiImage />
                      </div>
                    )}
                  </div>
                </div>

                <div className={clsx(styles['cart-item-info'])}>
                  <div className={clsx(styles['cart-item-header'])}>
                    <h3 className={clsx(styles['cart-item-title'])} title={item.title}>{item.title}</h3>
                    <button
                      className={clsx(styles['cart-item-remove-btn'])}
                      onClick={() => onRemove(item.id)}
                      title="Supprimer du panier"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                  
                  <p className={clsx(styles['cart-item-farmer'])}>
                    <FiUser />
                    {item.farmer_name}
                  </p>
                  
                  <div className={clsx(styles['cart-item-footer'])}>
                    <div className={clsx(styles['cart-item-price-section'])}>
                      <span className={clsx(styles['cart-item-unit-price'])}>{Number(item.price).toLocaleString('fr-FR')} Ar</span>
                      <span className={clsx(styles['cart-item-separator'])}>×</span>
                      <div className={clsx(styles['cart-item-quantity-group'])}>
                        <button
                          className={clsx(styles['qty-btn'], 'qty-minus')}
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          title="Réduire la quantité"
                        >
                          -
                        </button>
                        <span className={clsx(styles['qty-value'])}>{item.quantity}</span>
                        <button
                          className={clsx(styles['qty-btn'], 'qty-plus')}
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          title="Augmenter la quantité"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className={clsx(styles['cart-footer'])}>
          <div className={clsx(styles['cart-summary'])}>
            <div className={clsx(styles['summary-row'])}>
              <span className={clsx(styles['summary-label'])}>Sous-total</span>
              <span className={clsx(styles['summary-value'])}>{Number(total).toLocaleString('fr-FR')} Ar</span>
            </div>
            <div className={clsx(styles['summary-row'], styles['summary-total'])}>
              <span className={clsx(styles['summary-label-total'])}>Total</span>
              <span className={clsx(styles['summary-value-total'])}>{Number(total).toLocaleString('fr-FR')} Ar</span>
            </div>
          </div>

          <button
            className={clsx(styles['btn-confirm-order'])}
            onClick={handleSubmitOrder}
            disabled={isLoading || items.length === 0}
          >
            {isLoading ? (
              <>
                <div className={clsx(styles['mini-spinner'])}></div>
                <span>Confirmation en cours...</span>
              </>
            ) : (
              <>
                <FiCheckCircle />
                <span>Confirmer la commande</span>
              </>
            )}
          </button>

          <button className={clsx(styles['btn-continue-shopping'])} onClick={onClose}>
            <FiArrowLeft />
            <span>Continuer l'achat</span>
          </button>
        </div>
      )}
    </div>
  );
}
