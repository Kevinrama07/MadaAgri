import { useState, useEffect, useRef } from 'react';
import { dataApi } from '../../lib/api';
import styles from './EditProductModal.module.css';

export default function EditProductModal({ product, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: product.title || '',
    description: product.description || '',
    price: product.price?.toString() || '',
    quantity: product.quantity?.toString() || '',
    unit: product.unit || 'kg',
    culture_id: product.culture_id || '',
    region_id: product.region_id || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product.image_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [cultures, setCultures] = useState([]);
  const [regions, setRegions] = useState([]);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [culturesData, regionsData] = await Promise.all([
          dataApi.fetchCultures().catch(() => []),
          dataApi.fetchRegions().catch(() => []),
        ]);
        setCultures(culturesData);
        setRegions(regionsData);
      } catch {
        // ignore
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5 Mo');
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadedImageUrl(null);
  };

  const handleUploadImage = async () => {
    if (!imageFile) return;
    setUploadingImage(true);
    setError(null);
    try {
      const url = await dataApi.uploadImage(imageFile);
      setUploadedImageUrl(url);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.price || !form.quantity) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSaving(true);
    try {
      let imageUrl = uploadedImageUrl || product.image_url;
      if (imageFile && !uploadedImageUrl) {
        imageUrl = await dataApi.uploadImage(imageFile);
      }
      await onSave({
        title: form.title,
        description: form.description || null,
        price: parseFloat(form.price),
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        culture_id: form.culture_id || null,
        region_id: form.region_id || null,
        image_url: imageUrl || null,
      });
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel} ref={modalRef}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Modifier le produit</h2>
          <button className={styles.closeBtn} onClick={onCancel}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.imageSection}>
            {imagePreview ? (
              <div className={styles.imagePreviewContainer}>
                <img src={imagePreview} alt="Aperçu" className={styles.imagePreview} />
                {uploadedImageUrl && <span className={styles.uploadedBadge}>Uploadé</span>}
                <button type="button" className={styles.removeImageBtn} onClick={handleRemoveImage}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className={styles.imagePlaceholder}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>Sélectionner une image</span>
                <span className={styles.imageHint}>JPG, PNG • Max 5 Mo</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className={styles.fileInput}
                />
              </label>
            )}
            {imageFile && !uploadedImageUrl && (
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={handleUploadImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Upload en cours...' : 'Uploader l\'image'}
              </button>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nom du produit *</label>
              <input
                className={styles.input}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex: Riz Basmati Premium"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Catégorie</label>
              <select className={styles.input} name="culture_id" value={form.culture_id} onChange={handleChange}>
                <option value="">Sélectionner une catégorie</option>
                {cultures.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Région</label>
              <select className={styles.input} name="region_id" value={form.region_id} onChange={handleChange}>
                <option value="">Sélectionner une région</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Prix (Ar) *</label>
              <input
                className={styles.input}
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="45000"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Quantité *</label>
              <input
                className={styles.input}
                name="quantity"
                type="number"
                min="0"
                step="0.01"
                value={form.quantity}
                onChange={handleChange}
                placeholder="100"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Unité</label>
              <select className={styles.input} name="unit" value={form.unit} onChange={handleChange}>
                <option value="kg">Kilogramme (kg)</option>
                <option value="g">Gramme (g)</option>
                <option value="tonne">Tonne</option>
                <option value="litre">Litre (L)</option>
                <option value="unite">Unité</option>
                <option value="sac">Sac</option>
              </select>
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Décrivez votre produit..."
                rows={3}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>
              Annuler
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
