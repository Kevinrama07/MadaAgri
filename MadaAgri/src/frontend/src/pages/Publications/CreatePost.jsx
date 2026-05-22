import { useState } from 'react';
import { FiImage, FiVideo, FiSmile, FiMapPin, FiSend, FiTrash2 } from 'react-icons/fi';
import clsx from 'clsx';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi } from '../../lib/api';
import VideoUploader from './VideoUploader';
import styles from './CreatePost.module.css';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);

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

  const handleVideoSelected = (video) => {
    setSelectedVideo(video);
    setImage(null);
    setImagePreview(null);
  };

  const handleVideoUploaded = (result) => {
    if (result.uploadProgress === 100) {
      setUploadedVideo(result);
      setVideoUploading(false);
    } else {
      setVideoUploadProgress(result.uploadProgress);
      setVideoUploading(true);
    }
  };

  const handleVideoRemoved = () => {
    setSelectedVideo(null);
    setUploadedVideo(null);
    setVideoUploadProgress(0);
    setVideoUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image && !selectedVideo) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      let videoUrl = uploadedVideo?.videoUrl || null;
      let videoThumbnail = uploadedVideo?.thumbnailUrl || null;
      let videoDuration = uploadedVideo?.duration || selectedVideo?.duration || null;

      if (image) {
        imageUrl = await dataApi.uploadImage(image);
      }

      if (selectedVideo && !uploadedVideo) {
        const token = localStorage.getItem('madaagri_token');
        const form = new FormData();
        form.append('video', selectedVideo.file);

        const uploadResp = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/upload/video`,
          {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: form,
          }
        );
        const uploadData = await uploadResp.json();
        if (!uploadResp.ok) throw new Error(uploadData.error || 'Erreur upload vidéo');
        videoUrl = uploadData.videoUrl;
        videoThumbnail = uploadData.thumbnailUrl;
        videoDuration = uploadData.duration;
      }

      await dataApi.createPost({
        content: content.trim(),
        image: image,
        image_url: imageUrl,
        video_url: videoUrl,
        video_thumbnail: videoThumbnail,
        video_duration: videoDuration,
      });
      
      setContent('');
      setImage(null);
      setImagePreview(null);
      setSelectedVideo(null);
      setUploadedVideo(null);
      setVideoUploadProgress(0);
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

          <VideoUploader
            onVideoSelected={handleVideoSelected}
            onVideoUploaded={handleVideoUploaded}
            onRemove={handleVideoRemoved}
            selectedVideo={selectedVideo}
            uploadedVideo={uploadedVideo}
            uploadProgress={videoUploadProgress}
            isUploading={videoUploading}
          />

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
              <label className={clsx(styles['action-btn'])}>
                <FiVideo />
                <span>Vidéo</span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/3gpp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const video = document.createElement('video');
                      video.preload = 'metadata';
                      video.onloadedmetadata = () => {
                        handleVideoSelected({ file, uri: URL.createObjectURL(file), duration: video.duration, fileSize: file.size, type: file.type });
                      };
                      video.src = URL.createObjectURL(file);
                    }
                  }}
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
                  setSelectedVideo(null);
                  setUploadedVideo(null);
                  setVideoUploadProgress(0);
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className={clsx(styles['submit-btn'])}
                disabled={(!content.trim() && !image && !selectedVideo) || isSubmitting || videoUploading}
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
