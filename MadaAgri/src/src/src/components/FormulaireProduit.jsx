import { useEffect, useRef, useState } from 'react';
import { dataApi } from '../lib/api';
import { useAuth } from '../contexts/ContextAuthentification';

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
    <form onSubmit={handleSubmit} className="product-form space-y-6 max-w-2xl mg-card">
      <div className="product-modal-header">
        <h2 className="text-2xl font-bold product-form-title" style={{ margin: 0 }}>
          Ajouter un produit
        </h2>
      </div>

      <div className="product-form-body">
        {error && (
          <div className="mg-alert" style={{ background: 'rgba(255, 92, 92, 0.1)', border: '1px solid rgba(255, 100, 100,0.2)', color: '#ffb3b3' }}>
            {error}
          </div>
        )}

        <div className="product-image-field" style={{ marginBottom: '1rem' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          style={{ display: 'none' }}
          onChange={handleProductImageChange}
          disabled={uploadingImage}
        />
        {productImageUrl ? (
          <div className="product-image-preview" style={{ position: 'relative', marginBottom: '0.65rem' }}>
            <img src={productImageUrl} alt="Produit" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 12 }} />
          </div>
        ) : (
          <div className="product-image-placeholder" style={{ color: 'var(--mg-text)', marginBottom: '0.35rem' }}>
            Aucune image choisie.
          </div>
        )}
        <button type="button" className="mg-tab-btn" style={{ width: 'auto', padding: '0.6rem 1rem' }} onClick={handleImageSelectClick}>
          {uploadingImage ? 'Upload en cours...' : 'Ajouter une photo du produit'}
        </button>
        {imageError && <p className="text-error" style={{ color: '#ffb3b3', marginTop: '0.3rem' }}>{imageError}</p>}
      </div>

      <div className="product-form-row">
        <div>
          <div className={`floating-input ${focusField.title || formData.title ? 'active' : ''}`}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, title: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, title: !!formData.title }))}
              required
              className="mg-input"
              placeholder=" "
            />
            <span>Nom du produit</span>
          </div>
        </div>

        <div>
          <div className={`floating-input ${focusField.culture || formData.culture_id ? 'active' : ''}`}>
            <select
              aria-label="Culture"
              value={formData.culture_id}
              onChange={(e) => setFormData({ ...formData, culture_id: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, culture: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, culture: !!formData.culture_id }))}
              className="mg-input"
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
          <div className={`floating-input ${focusField.region || formData.region_id ? 'active' : ''}`}>
            <select
              aria-label="Région"
              value={formData.region_id}
              onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, region: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, region: !!formData.region_id }))}
              className="mg-input"
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
          <div className={`floating-input ${focusField.price || formData.price ? 'active' : ''}`}>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, price: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, price: !!formData.price }))}
              required
              className="mg-input"
              placeholder=" "
            />
            <span>Prix (Ariary)</span>
          </div>
        </div>

        <div>
          <div className={`floating-input ${focusField.quantity || formData.quantity ? 'active' : ''}`}>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, quantity: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, quantity: !!formData.quantity }))}
              required
              className="mg-input"
              placeholder=" "
            />
            <span>Quantité</span>
          </div>
        </div>

        <div>
          <div className={`floating-input ${focusField.unit || formData.unit ? 'active' : ''}`}>
            <select
              aria-label="Unité"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              onFocus={() => setFocusField((f) => ({ ...f, unit: true }))}
              onBlur={() => setFocusField((f) => ({ ...f, unit: !!formData.unit }))}
              className="mg-input"
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

      <div className="description-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className={`floating-input ${focusField.description || formData.description ? 'active' : ''}`} style={{ flex: 1 }}>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onFocus={() => setFocusField((f) => ({ ...f, description: true }))}
            onBlur={() => setFocusField((f) => ({ ...f, description: !!formData.description }))}
            className="mg-input"
            placeholder=" "
            style={{  minHeight: 100, resize: 'vertical' , borderRadius: 12, padding: '1rem' }}
            required
          />
          <span>Description</span>
        </div>
      </div>

      </div>

      <div className="product-modal-footer">
        <button
          type="submit"
          disabled={loading}
          className="mg-tab-btn"
          style={{ background: 'rgba(0, 255, 136, 0.2)', color: '#fff', width: '100%', padding: '0.75rem 1rem', borderRadius: '10px' }}
        >
          {loading ? 'Création en cours...' : 'Créer le produit'}
        </button>
      </div>
    </form>
  );
}

