import { useState } from 'react';
import clsx from 'clsx';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Composants/ImageUploader.module.css';

export default function ImageUploader({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onFileChange = (event) => {
    setError('');
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(selectedFile.type)) {
      setError('Format invalide, seulement jpg/jpeg/png.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Taille max 5MB.');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const upload = async () => {
    if (!file) {
      setError('Choisissez une image.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const imageUrl = await dataApi.uploadImage(file);
      if (onUploadComplete) onUploadComplete(imageUrl);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.message || 'Erreur lors de l’upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={clsx(styles['image-uploader'])} style={{ marginBottom: '1rem' }}>
      <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={onFileChange} />
      {preview && (
        <div style={{ margin: '0.5rem 0' }}>
          <p>Preview:</p>
          <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10 }} />
        </div>
      )}
      <button type="button" onClick={upload} disabled={uploading || !file} className={clsx(styles['mg-tab-btn'])}>
        {uploading ? 'Upload en cours...' : 'Uploader l’image'}
      </button>
      {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
    </div>
  );
}
