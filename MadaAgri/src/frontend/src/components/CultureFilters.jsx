import { useState } from 'react';
import clsx from 'clsx';
import { FiFilter, FiX } from 'react-icons/fi';
import styles from '../styles/ui/CultureFilters.module.css';

const CATEGORIES = [
  { id: 'all', label: 'Toutes', icon: '🌱' },
  { id: 'Céréales', label: 'Céréales', icon: '🌾' },
  { id: 'Légumes', label: 'Légumes', icon: '🥬' },
  { id: 'Fruits', label: 'Fruits', icon: '🍎' },
  { id: 'Légumineuses', label: 'Légumineuses', icon: '🫘' },
  { id: 'Autre', label: 'Autre', icon: '🌿' },
];

const SORT_OPTIONS = [
  { id: 'score', label: 'Score de compatibilité', order: 'desc' },
  { id: 'name', label: 'Nom (A-Z)', order: 'asc' },
  { id: 'name_desc', label: 'Nom (Z-A)', order: 'desc' },
  { id: 'yield', label: 'Rendement', order: 'desc' },
  { id: 'growth', label: 'Période de croissance', order: 'asc' },
];

export default function CultureFilters({ 
  selectedCategory, 
  onCategoryChange,
  sortBy,
  onSortChange,
  culturesCount 
}) {
  const [showFilters, setShowFilters] = useState(false);

  const handleCategoryClick = (categoryId) => {
    onCategoryChange(categoryId);
  };

  const handleSortChange = (sortOption) => {
    let field = sortOption.id;
    let order = sortOption.order;
    
    // Gérer tous les cas avec _desc de manière cohérente
    if (field.includes('_desc')) {
      field = field.replace('_desc', '');
      order = 'desc';
    }
    
    onSortChange(field, order);
  };

  return (
    <div className={clsx(styles.filtersContainer)}>
      {/* Mobile Filter Toggle */}
      <button 
        className={clsx(styles.filterToggle)}
        onClick={() => setShowFilters(!showFilters)}
        aria-label="Afficher les filtres"
      >
        <FiFilter />
        <span>Filtres</span>
        {selectedCategory !== 'all' && (
          <span className={clsx(styles.filterBadge)}>1</span>
        )}
      </button>

      {/* Filters Panel */}
      <div className={clsx(styles.filtersPanel, { [styles.show]: showFilters })}>
        {/* Categories */}
        <div className={clsx(styles.filterSection)}>
          <h4 className={clsx(styles.filterTitle)}>Catégories</h4>
          <div className={clsx(styles.categoryChips)}>
            {CATEGORIES.map((category) => {
              const count = category.id === 'all' ? culturesCount : 0;
              return (
                <button
                  key={category.id}
                  className={clsx(styles.categoryChip, {
                    [styles.active]: selectedCategory === category.id
                  })}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <span className={clsx(styles.categoryIcon)}>{category.icon}</span>
                  <span className={clsx(styles.categoryLabel)}>{category.label}</span>
                  {category.id === 'all' && count > 0 && (
                    <span className={clsx(styles.categoryCount)}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort */}
        <div className={clsx(styles.filterSection)}>
          <h4 className={clsx(styles.filterTitle)}>Trier par</h4>
          <div className={clsx(styles.sortOptions)}>
            {SORT_OPTIONS.map((option) => {
              const isActive = sortBy === option.id || 
                (sortBy === 'name' && option.id === 'name_desc');
              return (
                <button
                  key={option.id}
                  className={clsx(styles.sortOption, {
                    [styles.active]: isActive
                  })}
                  onClick={() => handleSortChange(option)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        {selectedCategory !== 'all' && (
          <button 
            className={clsx(styles.resetButton)}
            onClick={() => {
              onCategoryChange('all');
              onSortChange('score', 'desc');
            }}
          >
            <FiX />
            Réinitialiser les filtres
          </button>
        )}
      </div>
    </div>
  );
}
