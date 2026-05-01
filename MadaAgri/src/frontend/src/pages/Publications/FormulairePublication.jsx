import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Publications/FormulairePublication.module.css';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Amis' }
];

export default function FormulairePublication({ onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const canPublish = useMemo(() => {
    return (content.trim().length > 0 || previewUrl) && !loading;
  }, [content, previewUrl, loading]);

  const handleFileLoad = useCallback((file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setError('Format invalide (jpg/jpeg/png).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Fichier trop lourd (max 5MB).');
      return;
    }

    setError('');
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const handleChangeFile = (event) => {
    const file = event.target.files?.[0];
    handleFileLoad(file);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addEmoji = (emoji) => setContent((prev) => `${prev}${emoji}`);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canPublish) return;

    setLoading(true);
    setError('');

    try {
      let imageUrl = null;
      if (selectedFile) {
        imageUrl = await dataApi.uploadImage(selectedFile);
      }

      const postPayload = {
        content: content.trim(),
        visibility,
        image_url: imageUrl || null
      };

      await dataApi.createPost(postPayload);

      setContent('');
      setVisibility('public');
      setSelectedFile(null);
      setPreviewUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onCreated) onCreated();
    } catch (err) {
      setError(err?.message || 'Erreur création publication');
    } finally {
      setLoading(false);
    }
  };


  return (
    <section className={clsx(styles['publication-card'])}>
      <div className={clsx(styles['publication-header'])}>
        <img
          className={clsx(styles['publication-avatar'])}
          src={user?.profile_image_url || '/src/images/avatar.gif'}
          alt="Avatar"
        />
        <textarea
          className={clsx(styles['publication-textarea'])}
          placeholder="Quoi de neuf ?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
      </div>

      <div
        className={clsx(styles['publication-dropzone'], { [styles['active']]: dragActive })}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          handleFileLoad(file);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleChangeFile}
          className={clsx(styles['publication-file-input'])}
        />
        <span>Ajouter une image (ou glisser-déposer)</span>
      </div>

      {previewUrl && (
        <div className={clsx(styles['publication-preview'])}>
          <img src={previewUrl} alt="Aperçu" className={clsx(styles['publication-preview-img'])} />
          <button type="button" className={clsx(styles['publication-remove'])} onClick={removeImage}>
            Supprimer
          </button>
        </div>
      )}

      <div className={clsx(styles['publication-footer'])}>
        <div className={clsx(styles['publication-left'])}></div>

        <div className={clsx(styles['publication-right'])}>
          <select
            className={clsx(styles['publication-select'])}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={clsx(styles['publication-btn'])}
            onClick={submit}
            disabled={!canPublish}
          >
            {loading ? 'Publication…' : 'Publier'}
          </button>
        </div>
      </div>

      {error && <p className={clsx(styles['publication-error'])}>{error}</p>}
    </section>
  );
}