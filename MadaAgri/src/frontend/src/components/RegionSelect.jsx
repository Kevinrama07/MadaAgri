import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { FiMapPin, FiChevronDown, FiSearch, FiCheck } from 'react-icons/fi';
import styles from '../styles/Composants/RegionSelect.module.css';

export default function RegionSelect({ regions, selectedRegion, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (region) => {
    onChange(region);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={clsx(styles['region-select-wrapper'])} ref={selectRef}>
      <div 
        className={clsx(styles['region-select-header'])}
        onClick={() => setIsOpen(!isOpen)}
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
        <div className={clsx(styles['region-select-dropdown'])} onClick={(e) => e.stopPropagation()}>
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
              filteredRegions.map((region) => (
                <div
                  key={region.id}
                  className={clsx('region-option', { 'selected': selectedRegion?.id === region.id })}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(region);
                  }}
                >
                  <span className="option-name">{region.name}</span>
                  {selectedRegion?.id === region.id && (
                    <FiCheck />
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
