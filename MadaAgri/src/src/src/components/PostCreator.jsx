import { useCallback, useMemo, useState } from 'react';
import './PostCreator.css';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Amis' }
];

const EMOJI_LIST = ['😀', '❤️', '😎', '🎉', '🔥', '👍', '🌱'];

export default function PostCreator({ user, onCreatePost }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const canPublish = useMemo(() => {
    return (content.trim().length > 0 || previewUrl) && !uploading;
  }, [content, previewUrl, uploading]);

  const charCount = content.length;

  const dumpFile = useCallback((file) => {
    if (!file) return;
    const type = file.type.toLowerCase();
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(type)) {
      setError('Format invalide. jpg/jpeg/png uniquement.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Taille max 5MB.');
      return;
    }

    setError('');
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    dumpFile(file);
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    dumpFile(file);
  };

  const onRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const onEmojiSelect = (emoji) => {
    setContent((prev) => `${prev}${emoji}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canPublish) return;

    setUploading(true);
    setError('');

    try {
      const newPost = {
        content: content.trim(),
        visibility,
        image_url: previewUrl || null
      };

      if (onCreatePost) await onCreatePost(newPost, selectedFile);

      setContent('');
      setVisibility('public');
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (err) {
      setError(err?.message || 'Erreur lors de la publication.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <article className="post-creator-card" aria-label="Créer une publication">
      <div className="post-creator-header">
        <img
          className="post-creator-avatar"
          src={user?.profile_image_url || '/src/assets/avatar.gif'}
          alt="Avatar"
        />
        <textarea
          className="post-creator-textarea"
          placeholder="Quoi de neuf ?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={280}
          rows={3}
        />
      </div>

      <div
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
        onDrop={onDrop}
      >
        <input
          type="file"
          id="post-image-input"
          accept="image/png,image/jpeg,image/jpg"
          onChange={onFileInputChange}
          className="hidden-file-input"
        />
        <label htmlFor="post-image-input" className="file-button">
          <span>📷 Ajouter une image</span> (ou déposer ici)
        </label>
      </div>

      {previewUrl && (
        <div className="preview-wrapper">
          <img src={previewUrl} alt="Preview" className="preview-image" />
          <button type="button" className="btn-remove-image" onClick={onRemoveImage}>
            Supprimer
          </button>
        </div>
      )}

      <div className="quick-actions">
        <div className="emoji-picker">
          {EMOJI_LIST.map((emoji) => (
            <button key={emoji} type="button" className="emoji-button" onClick={() => onEmojiSelect(emoji)}>
              {emoji}
            </button>
          ))}
        </div>

        <div className="counter">{charCount}/280</div>
      </div>

      <div className="post-creator-footer">
        <select className="styled-select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          {VISIBILITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <button
          type="button"
          className="publish-button"
          onClick={handleSubmit}
          disabled={!canPublish}
        >
          {uploading ? 'Publication…' : 'Publier'}
        </button>
      </div>

      {error && <p className="post-creator-error">{error}</p>}
    </article>
  );
}
