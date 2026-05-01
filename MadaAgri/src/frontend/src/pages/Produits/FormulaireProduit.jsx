import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/ContextAuthentification';
import styles from '../../styles/Produits/FormulaireProduit.module.css';

export default function FormulaireProduit({ onSuccess }) {
  const { user } = useAuth();
  const [regions, setRegions] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    quantity: '',
    unit: '',
    region_id: '',
    culture_id: '',
    image_url: ''
  });
  const [focusField, setFocusField] = useState({});
  const [productImageUrl, setProductImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const regionsData = await dataApi.fetchRegions();
        const culturesData = await dataApi.fetchCultures();
        setRegions(regionsData);
        setCultures(culturesData);
      } catch (err) {
        console.error('Erreur fetch metadata', err);
      }
    }
    fetchMetadata();
  }, []);

  const handleImageSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProductImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setImageError('Format invalide (jpeg/jpg/png uniquement).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setImageError('Taille max 8Mo.');
      return;
    }

    setUploadingImage(true);
    setImageError('');

    try {
      const uploadedUrl = await dataApi.uploadImage(file);
      setProductImageUrl(uploadedUrl);
      setFormData((prev) => ({ ...prev, image_url: uploadedUrl }));
    } catch (err) {
      setImageError(err?.message || 'Erreur upload image.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setProductImageUrl('');
    setFormData((prev) => ({ ...prev, image_url: '' }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      await dataApi.createProduct({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10),
        unit: formData.unit,
        region_id: formData.region_id || undefined,
        culture_id: formData.culture_id || undefined,
        image_url: formData.image_url || undefined
      });

      setFormData({
        title: '',
        description: '',
        price: '',
        quantity: '',
        unit: '',
        region_id: '',
        culture_id: '',
        image_url: ''
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={clsx(styles['product-form'], styles['space-y-6'], styles['max-w-2xl'])}>
      <div className={clsx(styles['product-modal-header'])}>
        <h2 className={clsx(styles['product-form-title'])}>
          Ajouter un produit
        </h2>
      </div>

      <div className={clsx(styles['product-form-body'])}>
        {error && (
          <div className={clsx(styles['product-error-alert'])}>
            {error}
          </div>
        )}

        <div className={clsx(styles['product-image-field'])}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className={clsx(styles['product-file-input'])}
          onChange={handleProductImageChange}
          disabled={uploadingImage}
        />
        {productImageUrl ? (
          <div className={clsx(styles['product-image-preview'])}>
            <button
              type="button"
              className={clsx(styles['product-image-close'])}
              onClick={handleRemoveImage}
              title="Supprimer l'image"
            >
              ×
            </button>
            <img src={productImageUrl} alt="Produit" />
          </div>
        ) : (
          <div className={clsx(styles['product-image-placeholder'])}>
            Aucune image choisie.
          </div>
        )}
        <button type="button" className={clsx(styles['product-image-btn'])} onClick={handleImageSelectClick}>
          {uploadingImage ? 'Upload en cours...' : 'Ajouter une photo du produit'}
        </button>
        {imageError && <p className={clsx(styles['product-image-error'])}>{imageError}</p>}
      </div>

      <div className={clsx(styles['product-form-row'])}>
        <div>
          <div className={clsx(styles['floating-input'], { [styles['active']]: focusField.title || formData.title })}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, title: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, title: !!formData.title }))}
              required
              className={clsx(styles['mg-input'])}
              placeholder=" "
            />
            <span>Nom du produit</span>
          </div>
        </div>

        <div>
          <div className={clsx(styles['floating-input'], { [styles['active']]: focusField.culture || formData.culture_id })}>
            <select
              aria-label="Culture"
              value={formData.culture_id}
              onChange={(e) => setFormData({ ...formData, culture_id: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, culture: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, culture: !!formData.culture_id }))}
              className={clsx(styles['mg-input'])}
              placeholder=" "
            >
              <option value=""></option>
              {cultures.map((culture) => (
                <option key={culture.id} value={culture.id}>
                  {culture.name}
                </option>
              ))}
            </select>
            <span>Culture</span>
          </div>
        </div>

        <div>
          <div className={clsx(styles['floating-input'], { [styles['active']]: focusField.price || formData.price })}>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, price: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, price: !!formData.price }))}
              required
              className={clsx(styles['mg-input'])}
              placeholder=" "
            />
            <span>Prix (Ariary)</span>
          </div>
        </div>

        <div>
          <div className={clsx(styles['floating-input'], { [styles['active']]: focusField.region || formData.region_id })}>
            <select
              aria-label="Région"
              value={formData.region_id}
              onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, region: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, region: !!formData.region_id }))}
              className={clsx(styles['mg-input'])}
              placeholder=" "
            >
              <option value=""></option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <span>Région</span>
          </div>
        </div>

        <div>
          <div className={clsx(styles['floating-input'], { [styles['active']]: focusField.quantity || formData.quantity })}>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, quantity: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, quantity: !!formData.quantity }))}
              required
              className={clsx(styles['mg-input'])}
              placeholder=" "
            />
            <span>Quantité</span>
          </div>
        </div>

        <div>
          <div className={clsx(styles['floating-input'], { [styles['active']]: focusField.unit || formData.unit })}>
            <select
              aria-label="Unité"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, unit: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, unit: !!formData.unit }))}
              className={clsx(styles['mg-input'])}
              required
            >
              <option value=""></option>
              <option value="kg">Kilogramme (kg)</option>
              <option value="g">Gramme (g)</option>
              <option value="L">Litre (L)</option>
              <option value="sac">Sac</option>
            </select>
            <span>Unité</span>
          </div>
        </div>
      </div>

      <div className={clsx(styles['description-wrapper'])}>
        <div className={clsx(styles['floating-input-text'], { [styles['active']]: focusField.description || formData.description })}>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onFocus={() => setFocusField((f) => ({ ...f, description: true }))}
            onBlur={() => setFocusField((f) => ({ ...f, description: !!formData.description }))}
            className={clsx(styles['mg-input'])}
            placeholder=" "
            required
          />
          <span>Description</span>
        </div>
      </div>

      </div>

      <div className={clsx(styles['product-modal-footer'])}>
        <button
          type="submit"
          disabled={loading}
          className={clsx(styles['product-submit-btn'])}
        >
          {loading ? 'Création en cours...' : 'Créer le produit'}
        </button>
      </div>
    </form>
  );
}

