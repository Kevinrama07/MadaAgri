import { useEffect, useState ,useRef} from 'react';
import clsx from 'clsx';
import { FiCheckCircle, FiClock, FiX, FiCheck, FiTrash2, FiInbox, FiAlertCircle } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonTableRow, SkeletonTitle } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useSlideInUp } from '../../lib/animations';
import styles from '../../styles/Marketplace/ReceivedOrders.module.css';

const TABS = {
  FEED: 'feed'
};

export default function ReceivedOrders(user) {
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null); // Track which reservation is being processed
  const containerRef = useSlideInUp(0.8, 0.2);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profile_image_url || '/src/images/avatar.gif');
  const fileInputRef = useRef(null);
  const [selectedUserProfileId, setSelectedUserProfileId] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.FEED);

  useEffect(() => {
    if (isLoading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchOrders = async () => {
    try {
      startLoading();
      const data = await dataApi.getReceivedOrders();
      setOrders(data || []);
      setError('');
    } catch (err) {
      console.error('Erreur fetch commandes:', err);
      setError(err.message || 'Erreur lors du chargement des commandes');
    } finally {
      stopLoading();
    }
  };

  const handleConfirmReservation = async (reservationId) => {
    try {
      setActionLoading(reservationId);
      await dataApi.confirmReservation(reservationId);
      
      // Mettre à jour l'état local
      setOrders(orders.map(order => 
        order.id === reservationId 
          ? { ...order, status: 'confirmed' } 
          : order
      ));
      
      setSuccess('✓ commande confirmée ! Le stock a été décrémenté.');
      setError('');
    } catch (err) {
      console.error('Erreur confirmation:', err);
      setError(err.message || 'Erreur lors de la confirmation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefuseReservation = async (reservationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir refuser cette commande ?')) {
      return;
    }

    try {
      setActionLoading(reservationId);
      await dataApi.cancelReservation(reservationId);
      
      // Mettre à jour l'état local
      setOrders(orders.map(order => 
        order.id === reservationId 
          ? { ...order, status: 'cancelled' } 
          : order
      ));
      
      setSuccess('✓ commande refusée.');
      setError('');
    } catch (err) {
      console.error('Erreur refus:', err);
      setError(err.message || 'Erreur lors du refus');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((order) => order.status === filterStatus);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { icon: FiClock, label: 'En attente', color: 'pending' };
      case 'confirmed':
        return { icon: FiCheckCircle, label: 'Confirmée', color: 'confirmed' };
      case 'completed':
        return { icon: FiCheckCircle, label: 'Livrée', color: 'completed' };
      default:
        return { icon: FiX, label: 'Refusée', color: 'cancelled' };
    }
  };

  const handleUserProfileClick = (userId) => {
    console.log('[TableauDeBord] User profile clicked:', userId);
    if (userId === user?.id) {
      console.log('[TableauDeBord] Own profile, redirecting to PROFILE');
      setActiveTab(TABS.PROFILE);
    } else {
      console.log('[TableauDeBord] Other profile, redirecting to USER_PROFILE with id:', userId);
      setSelectedUserProfileId(userId);
      setActiveTab(TABS.USER_PROFILE);
    }
  };

  return (
    <div className={clsx(styles['received-orders-page'])} ref={containerRef}>
      <div className={clsx(styles['page-header'])}>
        <h1 className={clsx(styles['page-title'])}>
          <FiInbox style={{ marginRight: '12px' }} />
          Commandes Reçues
        </h1>
        <p className={clsx(styles['page-subtitle'])}>{filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}</p>
      </div>

      {error && (
        <div className={clsx(styles['error-banner'])}>
          <FiAlertCircle />
          {error}
        </div>
      )}

      {success && (
        <div className={clsx(styles['success-banner'])}>
          <FiCheckCircle />
          {success}
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
          <FiClock size={16} /> En attente ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button
          className={clsx(styles['filter-btn'], { [styles['active']]: filterStatus === 'confirmed' })}
          onClick={() => setFilterStatus('confirmed')}
        >
          <FiCheckCircle size={16} /> Confirmées ({orders.filter(o => o.status === 'confirmed').length})
        </button>
        <button
          className={clsx(styles['filter-btn'], { [styles['active']]: filterStatus === 'cancelled' })}
          onClick={() => setFilterStatus('cancelled')}
        >
          <FiX size={16} /> Refusées ({orders.filter(o => o.status === 'cancelled').length})
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
            <p>
              {filterStatus === 'pending' 
                ? 'Vous n\'avez pas de commandes en attente'
                : `Vous n'avez pas de commandes ${filterStatus}`}
            </p>
          </div>
        </div>
      ) : (
        <div className={clsx(styles['received-orders-list'])}>
          {filteredOrders.map((order) => {
            const statusBadge = getStatusBadge(order.status);
            const StatusIcon = statusBadge.icon;
            const isPending = order.status === 'pending';
            
            return (
              <div key={order.id} className={clsx(styles['received-order-card'])}>
                <div className={clsx(styles['order-header'])}>
                  <div className={clsx(styles['order-info'])}>
                    <h3 className={clsx(styles['order-id'])}>Commande #{order.id.substring(0, 8).toUpperCase()}</h3>
                    <p className={clsx(styles['order-date'])}>{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  
                  <div className={clsx(
                    styles['order-status'],
                    {
                      [styles['order-status-pending']]: order.status === 'pending',
                      [styles['order-status-confirmed']]: order.status === 'confirmed',
                      [styles['order-status-completed']]: order.status === 'completed',
                      [styles['order-status-cancelled']]: order.status === 'cancelled'
                    }
                  )}>
                    <StatusIcon size={16} />
                    {statusBadge.label}
                  </div>
                </div>

                <div className={clsx(styles['order-content'])}>
                  <div className={clsx(styles['order-details-grid'])}>
                    <div className={clsx(styles['detail-item'])}>
                      <span className={clsx(styles['detail-label'])}>Client</span>
                      <div>
                        <img
                        src={profileImageUrl || '/src/images/avatar.gif'}
                        alt="Profil"
                        className={clsx(styles['profile-avatar-large'])}
                        onClick={handleUserProfileClick }
                        title={order.client_name}
                      />
                      <span className={clsx(styles['detail-value'])}>{order.client_name}</span>
                      </div>
                    </div>
                    <div className={clsx(styles['detail-item'])}>
                      <span className={clsx(styles['detail-label'])}>Produit</span>
                      <span className={clsx(styles['detail-value'])}>{order.title}</span>
                    </div>
                    <div className={clsx(styles['detail-item'])}>
                      <span className={clsx(styles['detail-label'])}>Quantité</span>
                      <span className={clsx(styles['detail-value'])}>{order.quantity} unités</span>
                    </div>
                    <div className={clsx(styles['detail-item'])}>
                      <span className={clsx(styles['detail-label'])}>Prix unitaire</span>
                      <span className={clsx(styles['detail-value'])}>{Number(order.unit_price).toLocaleString('fr-FR')} Ar</span>
                    </div>
                  </div>

                  {order.image_url && (
                    <div className={clsx(styles['order-product-image'])}>
                      <img src={order.image_url} alt={order.title} />
                    </div>
                  )}
                </div>

                <div className={clsx(styles['order-footer'])}>
                  <div className={clsx(styles['order-total'])}>
                    <span className={clsx(styles['total-label'])}>Total</span>
                    <span className={clsx(styles['total-amount'])}>{Number(order.total_price).toLocaleString('fr-FR')} Ar</span>
                  </div>

                  {isPending && (
                    <div className={clsx(styles['order-actions'])}>
                      <button
                        className={clsx(styles['btn-confirm'])}
                        onClick={() => handleConfirmReservation(order.id)}
                        disabled={actionLoading === order.id}
                      >
                        <FiCheck size={18} />
                        {actionLoading === order.id ? 'En cours...' : 'Accepter'}
                      </button>
                      <button
                        className={clsx(styles['btn-refuse'])}
                        onClick={() => handleRefuseReservation(order.id)}
                        disabled={actionLoading === order.id}
                      >
                        <FiTrash2 size={18} />
                        {actionLoading === order.id ? 'En cours...' : 'Refuser'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
