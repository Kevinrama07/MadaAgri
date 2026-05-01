import { useEffect, useState, useRef } from 'react';
import { FiX, FiUpload, FiImage, FiAlertCircle, FiAlignLeft, FiDollarSign, FiInfo, FiCheck, FiBox } from 'react-icons/fi';
import { MdTitle } from 'react-icons/md';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Produits/ModalModificationProduit.module.css';
import clsx from 'clsx';

export default function ModalModificationProduit({ product, regions, cultures, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: product.title || '',
    description: product.description || '',
    price: product.price || '',
    quantity: product.quantity || '',
    unit: product.unit || 'kg',
    culture_id: product.culture_id || '',
    region_id: product.region_id || '',
    image_url: product.image_url || ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageError('');

    try {
      const imageUrl = await dataApi.uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        image_url: imageUrl
      }));
    } catch (err) {
      console.error('Erreur upload image:', err);
      setImageError(err.message || 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' ? parseFloat(value) || '' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.title.trim()) {
      setFormError('Le titre est obligatoire');
      return;
    }
    if (formData.price <= 0) {
      setFormError('Le prix doit être supérieur à 0');
      return;
    }
    if (formData.quantity < 0) {
      setFormError('La quantité ne peut pas être négative');
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={clsx(styles['modal-overlay'])} onClick={onClose}>
      <div className={clsx(styles['modal-details'])} onClick={(e) => e.stopPropagation()}>
        <p className={clsx(styles['modal-close-btn'])} onClick={onClose}>
          <img src="/src/images/quitter.gif" alt="" />
        </p>

        <div className={clsx(styles['modal-body'])}>
          {/* LEFT SIDE - Image et Infos */}
          <div className={clsx(styles['left'])}>
            <div className={clsx(styles['details-image-section'])}>
              {formData.image_url ? (
                <img src={formData.image_url} alt={formData.title} className={clsx(styles['details-image'])} />
              ) : (
                <div className={clsx(styles['details-image-placeholder'])}>
                  <FiImage />
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className={clsx(styles['edit-image-section'])}>
              <button
                type="button"
                className={clsx(styles['btn-upload-image'])}
                onClick={handleImageSelectClick}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <div className={clsx(styles['mini-spinner'])}></div>
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <FiUpload />
                    {formData.image_url ? 'Changer l\'image' : 'Ajouter une image'}
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              {imageError && (
                <div className={clsx(styles['edit-image-error'])}>
                  <FiAlertCircle />
                  {imageError}
                </div>
              )}
            </div>

            {/* Description */}
            <div className={clsx(styles['edit-description-section'])}>
              <label className={clsx(styles['edit-label'])}>
                <FiAlignLeft />
                Description
              </label>
              <textarea
                name="description"
                className={clsx(styles['edit-textarea'])}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Décrivez votre produit..."
              />
            </div>
          </div>

          {/* RIGHT SIDE - Form Fields */}
          <div className={clsx(styles['right'])}>
            {/* Errors */}
            {formError && (
              <div className={clsx(styles['form-error'])}>
                <FiAlertCircle />
                {formError}
              </div>
            )}

            {/* Titre */}
            <div className={clsx(styles['edit-field-group'])}>
              <label className={clsx(styles['edit-label'])}>
                <MdTitle />
                Titre <span className={clsx(styles['required'])}>*</span>
              </label>
              <input
                type="text"
                name="title"
                className={clsx(styles['edit-input'])}
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Nom du produit"
              />
            </div>

            {/* Section: Tarification & Stock */}
            <div className={clsx(styles['edit-section-title'])}>
              <FiDollarSign />
              Tarification & Stock
            </div>

            <div className={clsx(styles['edit-grid-3'])}>
              <div className={clsx(styles['edit-field-group'])}>
                <label className={clsx(styles['edit-label'])}>
                  Prix (Ar) <span className={clsx(styles['required'])}>*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  className={clsx(styles['edit-input'])}
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
              <div className={clsx(styles['edit-field-group'])}>
                <label className={clsx(styles['edit-label'])}>
                  Quantité <span className={clsx(styles['required'])}>*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  className={clsx(styles['edit-input'])}
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className={clsx(styles['edit-field-group'])}>
                <label className={clsx(styles['edit-label'])}>
                  Unité
                </label>
                <select
                  name="unit"
                  className={clsx(styles['edit-select'])}
                  value={formData.unit}
                  onChange={handleInputChange}
                >
                  <option value="kg">Kilogramme (kg)</option>
                  <option value="g">Gramme (g)</option>
                  <option value="l">Litre (l)</option>
                  <option value="ml">Millilitre (ml)</option>
                  <option value="piece">Pièce</option>
                  <option value="box">Boîte</option>
                  <option value="bag">Sac</option>
                </select>
              </div>
            </div>

            {/* Section: Information Agricole */}
            <div className={clsx(styles['edit-section-title'])}>
              <FiBox />
              Information Agricole
            </div>

            <div className={clsx(styles['edit-grid-2'])}>
              <div className={clsx(styles['edit-field-group'])}>
                <label className={clsx(styles['edit-label'])}>
                  Culture
                </label>
                <select
                  name="culture_id"
                  className={clsx(styles['edit-select'])}
                  value={formData.culture_id}
                  onChange={handleInputChange}
                >
                  <option value="">-- Sélectionner --</option>
                  {Object.entries(cultures).map(([id, culture]) => (
                    <option key={id} value={id}>
                      {culture.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={clsx(styles['edit-field-group'])}>
                <label className={clsx(styles['edit-label'])}>
                  Région
                </label>
                <select
                  name="region_id"
                  className={clsx(styles['edit-select'])}
                  value={formData.region_id}
                  onChange={handleInputChange}
                >
                  <option value="">-- Sélectionner --</option>
                  {Object.entries(regions).map(([id, region]) => (
                    <option key={id} value={id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Info */}
            <div className={clsx(styles['edit-info-box'])}>
              <FiInfo />
              <p>
                Si la quantité = 0, le produit sera automatiquement désactivé sur la marketplace.
              </p>
            </div>

            {/* Actions */}
            <div className={clsx(styles['edit-actions'])}>
              <button type="button" className={clsx(styles['btn-cancel-edit'])} onClick={onClose}>
                <FiX />
                Annuler
              </button>
              <button type="submit" className={clsx(styles['btn-save-edit'])} disabled={saving} onClick={handleSubmit}>
                {saving ? (
                  <>
                    <div className={clsx(styles['mini-spinner'])}></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FiCheck />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
