import React from 'react';
import './CategorySelector.css';
import { CATEGORY_DATA } from '../data/categories';

const URGENT_STATUSES = ['Bulk Order', 'Use Substitute'];

const CategorySelector = ({ products, statuses, onCategorySelect, onBackToStoreSelect }) => {
  const categoriesWithCounts = CATEGORY_DATA.map(category => {
    const urgentCount = products.filter(p => 
      p.category === category.id && URGENT_STATUSES.includes(statuses[p.id])
    ).length;
    return { ...category, urgentCount };
  });

  return (
    <div className="category-selector-container">
      <header className="category-header">
        <h1>Select Your Department</h1>
        <p>Choose a department to view its detailed procurement status.</p>
        <button onClick={onBackToStoreSelect} className="back-to-stores-btn">Change Store Location</button>
      </header>
      <div className="category-grid">
        {categoriesWithCounts.map(cat => (
          <div 
            key={cat.id} 
            className="category-card" 
            onClick={() => onCategorySelect(cat.id)}
            style={{ backgroundImage: `url(${process.env.PUBLIC_URL + cat.imageUrl})` }}
          >
            <div className="card-overlay"></div>
            {cat.urgentCount > 0 && (
              <div className="urgent-badge">{cat.urgentCount} Action(s) Required</div>
            )}
            <div className="card-content">
              <span className="card-icon">{cat.icon}</span>
              <h2 className="card-title">{cat.name}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;