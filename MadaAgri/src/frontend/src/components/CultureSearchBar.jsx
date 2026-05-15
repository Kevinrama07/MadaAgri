import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { FiSearch, FiX } from 'react-icons/fi';
import styles from '../styles/ui/CultureSearchBar.module.css';

export default function CultureSearchBar({ value, onChange, placeholder = "Rechercher une culture..." }) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={clsx(styles.searchContainer, { [styles.focused]: isFocused })}>
      <FiSearch className={clsx(styles.searchIcon)} />
      <input
        ref={inputRef}
        type="text"
        className={clsx(styles.searchInput)}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Rechercher une culture"
      />
      {value && (
        <button
          className={clsx(styles.clearButton)}
          onClick={handleClear}
          aria-label="Effacer la recherche"
          type="button"
        >
          <FiX />
        </button>
      )}
    </div>
  );
}
