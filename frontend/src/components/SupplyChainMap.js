import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import PropTypes from 'prop-types';
import './SupplyChainMap.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- HELPER FUNCTIONS FOR DYNAMIC STYLING ---
const getRiskClass = (riskLevel) => `risk-${riskLevel.toLowerCase()}`;

const getMarkerRadius = (isPrimary) => (isPrimary ? 10 : 7);

const SupplyChainMap = ({ mapData }) => {
  const [tooltipContent, setTooltipContent] = useState('');

  return (
    <div className="map-card-container">
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 100, center: [0, 20] }}
        className="composable-map"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => <Geography key={geo.rsmKey} geography={geo} className="geography-style" />)
          }
        </Geographies>

        {/* --- vvvvvv THE CORRECTED DESTRUCTURING IS HERE vvvvvv --- */}
        {mapData.map(({ country, coordinates, level, isPrimary }, index) => (
          <Marker
            key={index}
            coordinates={coordinates}
            onMouseEnter={() => setTooltipContent(`${country}: ${level} Risk`)}
            onMouseLeave={() => setTooltipContent('')}
          >
            {/* The main marker group now uses 'level' directly */}
            <g className={`map-marker ${getRiskClass(level)}`} style={{ animationDelay: `${index * 150}ms` }}>
              <circle
                r={getMarkerRadius(isPrimary)}
                className="marker-circle"
              />
              <circle
                r={getMarkerRadius(isPrimary)}
                className="marker-ping"
              />
            </g>
          </Marker>
        ))}
        {/* --- ^^^^^^ END OF THE CORRECTION ^^^^^^ --- */}

      </ComposableMap>
      {tooltipContent && <div className="map-tooltip">{tooltipContent}</div>}
    </div>
  );
};

SupplyChainMap.propTypes = {
  mapData: PropTypes.array.isRequired,
};

export default SupplyChainMap;