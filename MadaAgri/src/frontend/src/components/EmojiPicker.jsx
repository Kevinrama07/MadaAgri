import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import styles from '../styles/ui/EmojiPicker.module.css';

const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
  gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤'],
  food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🎯'],
  symbols: ['✅', '❌', '⭐', '🌟', '💫', '✨', '🔥', '💯', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '💰', '💎']
};

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEmojiClick = (emoji) => {
    onSelect(emoji);
    onClose?.();
  };

  return (
    <div ref={pickerRef} className={clsx(styles.picker)}>
      <div className={clsx(styles.categories)}>
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={clsx(styles.categoryBtn, {
              [styles.active]: activeCategory === cat
            })}
            title={cat}
          >
            {EMOJI_CATEGORIES[cat][0]}
          </button>
        ))}
      </div>
      
      <div className={clsx(styles.emojiGrid)}>
        {EMOJI_CATEGORIES[activeCategory].map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => handleEmojiClick(emoji)}
            className={clsx(styles.emojiBtn)}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
