import { useState, useRef } from 'react';
import { FiVideo, FiTrash2, FiUpload, FiCheckCircle, FiClock, FiHardDrive } from 'react-icons/fi';
import clsx from 'clsx';
import styles from './VideoUploader.module.css';

const MAX_DURATION = 60;
const MAX_SIZE = 100 * 1024 * 1024;

export default function VideoUploader({ onVideoSelected, onVideoUploaded, onRemove, selectedVideo, uploadedVideo, uploadProgress = 0, isUploading = false }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [picking, setPicking] = useState(false);

  const formatDuration = (s) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateVideo = (file) => {
    if (!file.type.startsWith('video/')) {
      setError('Format vidéo invalide');
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError('Vidéo trop volumineuse. Taille max 100MB.');
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!validateVideo(file)) {
      e.target.value = '';
      return;
    }

    setPicking(true);

    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      if (video.duration > MAX_DURATION) {
        setError(`Vidéo trop longue. Durée max ${MAX_DURATION}s.`);
        setPicking(false);
        e.target.value = '';
        return;
      }

      onVideoSelected({
        file,
        uri: URL.createObjectURL(file),
        duration: video.duration,
        fileSize: file.size,
        type: file.type,
      });
      setPicking(false);
    };

    video.onerror = () => {
      setError('Impossible de lire les métadonnées de la vidéo');
      setPicking(false);
    };

    video.src = URL.createObjectURL(file);
  };

  const handleUpload = async () => {
    if (!selectedVideo) return;

    const token = localStorage.getItem('madaagri_token');
    const form = new FormData();
    form.append('video', selectedVideo.file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/upload/video`);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onVideoUploaded) {
          onVideoUploaded({ uploadProgress: Math.round((e.loaded / e.total) * 100) });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const resp = JSON.parse(xhr.responseText);
          onVideoUploaded({
            videoUrl: resp.videoUrl,
            thumbnailUrl: resp.thumbnailUrl,
            duration: resp.duration,
            public_id: resp.public_id,
            uploadProgress: 100,
          });
        } else {
          const resp = JSON.parse(xhr.responseText);
          setError(resp.error || 'Erreur upload');
        }
      };

      xhr.onerror = () => setError('Erreur réseau');
      xhr.send(form);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={clsx(styles['video-uploader'])}>
      {!selectedVideo && !isUploading && (
        <div>
          <button
            type="button"
            className={clsx(styles['picker-btn'])}
            onClick={() => inputRef.current?.click()}
            disabled={picking}
          >
            <FiVideo size={20} />
            <span>{picking ? 'Analyse...' : 'Ajouter une vidéo'}</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/3gpp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {(selectedVideo || isUploading) && (
        <div className={clsx(styles['preview-card'])}>
          <div className={clsx(styles['preview-info'])}>
            {isUploading ? (
              <div className={clsx(styles['uploading-status'])}>
                <div className={clsx(styles['upload-spinner'])}></div>
                <span>Upload... {uploadProgress}%</span>
                <div className={clsx(styles['upload-progress-bar'])}>
                  <div className={clsx(styles['upload-progress-fill'])} style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : uploadedVideo ? (
              <div className={clsx(styles['success-status'])}>
                <FiCheckCircle size={24} className={clsx(styles['success-icon'])} />
                <div>
                  <strong>Vidéo prête</strong>
                  <span className={clsx(styles['file-info'])}>Publiée avec succès</span>
                </div>
              </div>
            ) : (
              <div className={clsx(styles['selected-status'])}>
                <FiVideo size={24} className={clsx(styles['video-icon'])} />
                <div>
                  <strong>Vidéo sélectionnée</strong>
                  <div className={clsx(styles['file-details'])}>
                    <span><FiClock size={12} /> {formatDuration(selectedVideo.duration)}</span>
                    {selectedVideo.fileSize > 0 && (
                      <span><FiHardDrive size={12} /> {formatFileSize(selectedVideo.fileSize)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button type="button" className={clsx(styles['remove-btn'])} onClick={onRemove} title="Supprimer">
            <FiTrash2 size={16} />
          </button>
        </div>
      )}

      {selectedVideo && !uploadedVideo && !isUploading && (
        <button type="button" className={clsx(styles['upload-btn'])} onClick={handleUpload}>
          <FiUpload size={16} />
          Uploader la vidéo
        </button>
      )}

      {error && <p className={clsx(styles['error-text'])}>{error}</p>}
    </div>
  );
}
