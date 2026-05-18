import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card/Card';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import styles from './CreateProductPage.module.css';

export default function CreateProductPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    quantity: '',
    unit: 'kg',
    culture_id: '',
    region_id: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const [cultures, setCultures] = useState([]);
  const [regions, setRegions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [culturesData, regionsData] = await Promise.all([
          dataApi.fetchCultures().catch(() => []),
          dataApi.fetchRegions().catch(() => []),
        ]);
        if (!cancelled) {
          setCultures(culturesData);
          setRegions(regionsData);
        }
      } catch {
        // ignore
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

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
    setSuccess(false);

    if (!form.title || !form.price || !form.quantity) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = uploadedImageUrl;

      if (imageFile && !uploadedImageUrl) {
        imageUrl = await dataApi.uploadImage(imageFile);
      }

      await dataApi.createProduct({
        title: form.title,
        description: form.description || null,
        price: parseFloat(form.price),
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        culture_id: form.culture_id || null,
        region_id: form.region_id || null,
        image_url: imageUrl || null,
      });
      setSuccess(true);
      setForm({ title: '', description: '', price: '', quantity: '', unit: 'kg', culture_id: '', region_id: '' });
      handleRemoveImage();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du produit');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'farmer') {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.container}>
            <Card className={styles.accessCard}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h2>Accès réservé aux agriculteurs</h2>
              <p>Vous devez avoir un compte agriculteur pour ajouter des produits.</p>
              <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
                Retour au tableau de bord
              </button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Ajouter un produit</h1>

          {error && (
            <div className={`${styles.notification} ${styles.notificationError}`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`${styles.notification} ${styles.notificationSuccess}`}>
              Produit créé avec succès !
            </div>
          )}

          <Card className={styles.formCard}>
            <form onSubmit={handleSubmit}>
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
                  <label className={styles.label}>Image du produit</label>
                  <div className={styles.imageUploadArea}>
                    {imagePreview ? (
                      <div className={styles.imagePreviewContainer}>
                        <img src={imagePreview} alt="Aperçu" className={styles.imagePreview} />
                        {uploadedImageUrl && (
                          <span className={styles.uploadedBadge}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Uploadé
                          </span>
                        )}
                        <button type="button" className={styles.removeImageBtn} onClick={handleRemoveImage}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className={styles.imageUploadPlaceholder}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>Cliquer pour sélectionner une image</span>
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
                  </div>
                  {imageFile && !uploadedImageUrl && (
                    <button
                      type="button"
                      className={styles.uploadBtn}
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <span className={styles.spinner} />
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          Uploader sur Cloudinary
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Décrivez votre produit..."
                    rows={4}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => navigate('/dashboard/products')}>
                  Annuler
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Création...' : 'Créer le produit'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
