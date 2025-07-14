import React from 'react';
import PropTypes from 'prop-types';
import './TariffImpactAnalysis.css';

// Helper to get a country's flag emoji from its name (simplified)
const getCountryFlag = (countryName) => {
  const flags = {
    'Vietnam': '🇻🇳', 'Mexico': '🇲🇽', 'China': '🇨🇳', 'USA': '🇺🇸', 
    'India': '🇮🇳', 'Bangladesh': '🇧🇩'
  };
  return flags[countryName] || '🏳️';
};

const TariffImpactAnalysis = ({ primaryProduct, allProducts, allTariffs, substitutes }) => {
  // --- 1. FIND THE BEST SUBSTITUTE ---
  if (!substitutes || substitutes.length === 0 || !allProducts.length || !Object.keys(allTariffs).length) {
    return null; // Don't render if required data is missing
  }
  const bestSub = substitutes[0];
  const substituteProduct = allProducts.find(p => p.id === bestSub.id);

  if (!substituteProduct) {
    return null; // Don't render if we can't find the substitute details
  }

  // --- 2. GET TARIFFS ---
  const primaryTariff = allTariffs[primaryProduct.countryOfOrigin]?.[primaryProduct.category] || 0;
  const substituteTariff = allTariffs[substituteProduct.countryOfOrigin]?.[substituteProduct.category] || 0;

  // Only show analysis if the substitute offers a tariff advantage
  if (substituteTariff >= primaryTariff) {
    return null;
  }
  
  // --- 3. CALCULATE ROI ---
  const { baseCost, price } = primaryProduct;
  const stockLevel = primaryProduct.inventory.stock;

  const costPerUnitPrimary = baseCost + (baseCost * primaryTariff);
  const costPerUnitSub = baseCost + (baseCost * substituteTariff);
  
  const profitPerUnitPrimary = price - costPerUnitPrimary;
  const profitPerUnitSub = price - costPerUnitSub;
  
  const savingsPerUnit = profitPerUnitSub - profitPerUnitPrimary;
  const totalPotentialSavings = savingsPerUnit * stockLevel;

  // Don't render if there are no savings
  if (totalPotentialSavings <= 0) {
    return null;
  }

  return (
    <div className="impact-analysis-card">
      <div className="analysis-panel">
        <h6 className="panel-title current">Current Sourcing</h6>
        <div className="country-info">
          <span className="flag-icon">{getCountryFlag(primaryProduct.countryOfOrigin)}</span>
          <span className="country-name">{primaryProduct.countryOfOrigin}</span>
        </div>
        <div className="tariff-info tariff-high">
          <span className="tariff-value">{(primaryTariff * 100).toFixed(1)}%</span>
          <span className="tariff-label">Tariff Rate</span>
        </div>
        <div className="cost-breakdown">
          Profit/Unit: <strong>${profitPerUnitPrimary.toFixed(2)}</strong>
        </div>
      </div>

      <div className="connector">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M17 8l4 4-4 4M3 12h18"/>
        </svg>
      </div>

      <div className="analysis-panel">
        <h6 className="panel-title proposed">Proposed Alternative</h6>
        <div className="country-info">
          <span className="flag-icon">{getCountryFlag(substituteProduct.countryOfOrigin)}</span>
          <span className="country-name">{substituteProduct.countryOfOrigin}</span>
        </div>
        <div className="tariff-info tariff-low">
          <span className="tariff-value">{(substituteTariff * 100).toFixed(1)}%</span>
          <span className="tariff-label">Tariff Rate</span>
        </div>
        <div className="cost-breakdown">
          Profit/Unit: <strong>${profitPerUnitSub.toFixed(2)}</strong>
        </div>
      </div>

      <div className="roi-footer">
        <div className="roi-label">Potential Profit Increase</div>
        <div className="roi-value">
          +${totalPotentialSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="roi-context">
          (Based on current stock of {stockLevel} units)
        </div>
      </div>
    </div>
  );
};

TariffImpactAnalysis.propTypes = {
  primaryProduct: PropTypes.object.isRequired,
  allProducts: PropTypes.array.isRequired,
  allTariffs: PropTypes.object.isRequired,
  substitutes: PropTypes.array.isRequired,
};

export default TariffImpactAnalysis;