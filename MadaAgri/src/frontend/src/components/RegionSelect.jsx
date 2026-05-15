import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { FiMapPin, FiChevronDown, FiSearch, FiCheck } from 'react-icons/fi';
import styles from '../styles/Composants/RegionSelect.module.css';

export default function RegionSelect({ regions, selectedRegion, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectRef = useRef(null);

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (region) => {
    onChange(region);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredRegions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && filteredRegions[focusedIndex]) {
          handleSelect(filteredRegions[focusedIndex]);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className={clsx(styles['region-select-wrapper'])} ref={selectRef}>
      <div 
        className={clsx(styles['region-select-header'])}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Région sélectionnée: ${selectedRegion?.name || 'Aucune'}`}
      >
        <div className={clsx(styles['region-select-content'])}>
          {selectedRegion && (
            <>
              <FiMapPin />
              <span>{selectedRegion.name}</span>
            </>
          )}
        </div>
        <div className={clsx('region-select-icon', { 'open': isOpen })}>
          <FiChevronDown />
        </div>
      </div>

      {isOpen && (
        <div 
          className={clsx(styles['region-select-dropdown'])} 
          onClick={(e) => e.stopPropagation()}
          role="listbox"
          aria-label="Liste des régions"
        >
          <div className={clsx(styles['region-select-search'])}>
            <input
              type="text"
              placeholder="Rechercher une région..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className={clsx(styles['region-search-input'])}
            />
            <FiSearch />
          </div>

          <div className={clsx(styles['region-options'])}>
            {filteredRegions.length > 0 ? (
              filteredRegions.map((region, index) => (
                <div
                  key={region.id}
                  className={clsx('region-option', { 
                    'selected': selectedRegion?.id === region.id,
                    'focused': index === focusedIndex
                  })}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(region);
                  }}
                  role="option"
                  aria-selected={selectedRegion?.id === region.id}
                  tabIndex={-1}
                >
                  <span className="option-name">{region.name}</span>
                  {selectedRegion?.id === region.id && (
                    <FiCheck aria-hidden="true" />
                  )}
                </div>
              ))
            ) : (
              <div className={clsx(styles['region-option-empty'])}>
                Aucune région trouvée
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
