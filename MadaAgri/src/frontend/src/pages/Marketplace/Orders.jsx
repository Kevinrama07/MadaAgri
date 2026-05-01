import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FiCheckCircle, FiClock, FiX, FiShoppingBag, FiAlertCircle, FiInbox } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonTableRow, SkeletonTitle } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useSlideInUp } from '../../lib/animations';
import styles from '../../styles/Marketplace/Orders.module.css';

export default function Orders() {
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  
  useEffect(() => {
    if (isLoading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const containerRef = useSlideInUp(0.8, 0.2);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      startLoading();
      const data = await dataApi.getMyOrders();
      setOrders(data || []);
      setError('');
    } catch (err) {
      console.error('Erreur fetch commandes:', err);
      setError(err.message || 'Erreur lors du chargement des commandes');
    } finally {
      stopLoading();
    }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((order) => {
        if (filterStatus === 'pending') return order.status === 'pending';
        if (filterStatus === 'confirmed') return order.status === 'confirmed';
        if (filterStatus === 'completed') return order.status === 'completed';
        return true;
      });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { icon: FiClock, label: 'En attente', color: 'pending' };
      case 'confirmed':
        return { icon: FiCheckCircle, label: 'Confirmée', color: 'confirmed' };
      case 'completed':
        return { icon: FiCheckCircle, label: 'Livrée', color: 'completed' };
      default:
        return { icon: FiX, label: 'Annulée', color: 'cancelled' };
    }
  };

  return (
    <div className={clsx(styles['orders-page'])} ref={containerRef}>
      <div className={clsx(styles['page-header'])}>
        <h1 className={clsx(styles['page-title'])}>
          <FiShoppingBag style={{ marginRight: '12px' }} />
          Mes Commandes
        </h1>
        <p className={clsx(styles['page-subtitle'])}>{filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}</p>
      </div>

      {error && (
        <div className={clsx(styles['error-banner'])}>
          <FiAlertCircle />
          {error}
        </div>
      )}

      {/* Filtres */}
      <div className={clsx(styles['orders-controls'])}>
        <button
          className={clsx(styles['filter-btn'], { [styles['active']]: filterStatus === 'all' })}
          onClick={() => setFilterStatus('all')}
        >
          Toutes ({orders.length})
        </button>
        <button
          className={clsx(styles['filter-btn'], { [styles['active']]: filterStatus === 'pending' })}
          onClick={() => setFilterStatus('pending')}
        >
          <FiClock size={16} /> En attente
        </button>
        <button
          className={clsx(styles['filter-btn'], { [styles['active']]: filterStatus === 'confirmed' })}
          onClick={() => setFilterStatus('confirmed')}
        >
          <FiCheckCircle size={16} /> Confirmées
        </button>
        <button
          className={clsx(styles['filter-btn'], { [styles['active']]: filterStatus === 'completed' })}
          onClick={() => setFilterStatus('completed')}
        >
          <FiCheckCircle size={16} /> Livrées
        </button>
      </div>

      {isLoading ? (
        <div className={clsx(styles['loading-wrapper'])}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={clsx(styles['empty-state-wrapper'])}>
          <div className={clsx(styles['empty-state'])}>
            <FiInbox style={{ fontSize: '3rem', marginBottom: '1rem' }} />
            <p>Vous n'avez pas encore de commandes</p>
          </div>
        </div>
      ) : (
        <div className={clsx(styles['orders-list'])}>
          {filteredOrders.map((order) => {
            const statusBadge = getStatusBadge(order.status);
            const StatusIcon = statusBadge.icon;
            
            return (
              <div key={order.id} className={clsx(styles['order-card'])}>
                <div className={clsx(styles['order-header'])}>
                  <div className={clsx(styles['order-info'])}>
                    <h3 className={clsx(styles['order-id'])}>Commande #{order.id.substring(0, 8).toUpperCase()}</h3>
                    <p className={clsx(styles['order-date'])}>{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  
                  <div className={`order-status ${statusBadge.color}`}>
                    <StatusIcon size={16} />
                    {statusBadge.label}
                  </div>
                </div>

                <div className={clsx(styles['order-items'])}>
                  <h4 className={clsx(styles['items-title'])}>Articles</h4>
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className={clsx(styles['order-item'])}>
                      <span className={clsx(styles['item-name'])}>{item.product_title || item.product_id}</span>
                      <span className={clsx(styles['item-qty'])}>x{item.quantity}</span>
                      <span className={clsx(styles['item-price'])}>{Number(item.price * item.quantity).toLocaleString('fr-FR')} Ar</span>
                    </div>
                  ))}
                </div>

                <div className={clsx(styles['order-footer'])}>
                  <div className={clsx(styles['order-details'])}>
                    <p className={clsx(styles['details-label'])}>Agriculteur:</p>
                    <p className={clsx(styles['details-value'])}>{order.farmer_name}</p>
                  </div>
                  
                  <div className={clsx(styles['order-total'])}>
                    <span className={clsx(styles['total-label'])}>Total:</span>
                    <span className={clsx(styles['total-amount'])}>{Number(order.total_price).toLocaleString('fr-FR')} Ar</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
