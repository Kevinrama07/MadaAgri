import { useState } from 'react';
import { FiImage, FiVideo, FiSmile, FiMapPin, FiSend } from 'react-icons/fi';
import clsx from 'clsx';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import styles from '../../styles/Publications/CreatePost.module.css';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    setIsSubmitting(true);
    try {
      await dataApi.createPost({
        content: content.trim(),
        image: image,
      });
      
      setContent('');
      setImage(null);
      setImagePreview(null);
      setIsExpanded(false);
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={clsx(styles['create-post-card'])}>
      <div className={clsx(styles['create-post-header'])}>
        <img
          src={user?.profile_image_url || '/src/images/avatar.gif'}
          alt={user?.display_name}
          className={clsx(styles['user-avatar'])}
        />
        <button
          className={clsx(styles['post-input-trigger'])}
          onClick={() => setIsExpanded(true)}
        >
          Quoi de neuf, {user?.display_name?.split(' ')[0] || 'Agriculteur'} ?
        </button>
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className={clsx(styles['create-post-form'])}>
          <textarea
            className={clsx(styles['post-textarea'])}
            placeholder="Partagez vos expériences agricoles, conseils, ou actualités..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            rows={4}
          />

          {imagePreview && (
            <div className={clsx(styles['image-preview'])}>
              <img src={imagePreview} alt="Preview" />
              <button
                type="button"
                className={clsx(styles['remove-image-btn'])}
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
              >
                ×
              </button>
            </div>
          )}

          <div className={clsx(styles['post-actions'])}>
            <div className={clsx(styles['action-buttons'])}>
              <label className={clsx(styles['action-btn'])}>
                <FiImage />
                <span>Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div className={clsx(styles['submit-actions'])}>
              <button
                type="button"
                className={clsx(styles['cancel-btn'])}
                onClick={() => {
                  setIsExpanded(false);
                  setContent('');
                  setImage(null);
                  setImagePreview(null);
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className={clsx(styles['submit-btn'])}
                disabled={(!content.trim() && !image) || isSubmitting}
              >
                <FiSend />
                {isSubmitting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </form>
      )}

      {!isExpanded && (
        <div className={clsx(styles['quick-actions'])}>
          <label className={clsx(styles['quick-action-btn'])}>
            <FiImage />
            <span>Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setIsExpanded(true);
                handleImageChange(e);
              }}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
