import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Annotation } from 'react-simple-maps';
import './SupplyChainMap.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const riskStyles = {
  high: { fill: "var(--color-danger)", stroke: "#ffcdd2" },
  medium: { fill: "var(--color-warning)", stroke: "#fff3cd" },
  low: { fill: "var(--color-success)", stroke: "#c8e6c9" }
};

const SupplyChainMap = ({ mapData }) => {
  const [tooltip, setTooltip] = useState('');

  return (
    <div className="map-container">
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => <Geography key={geo.rsmKey} geography={geo} className="geography-style" />)
          }
        </Geographies>
        {mapData.map(({ country, coordinates, risk, isPrimary }) => (
          <Marker
            key={country}
            coordinates={coordinates}
            onMouseEnter={() => setTooltip(`${country} - ${risk.toUpperCase()} RISK`)}
            onMouseLeave={() => setTooltip('')}
          >
            <g className={`map-marker ${isPrimary ? 'primary' : 'secondary'}`}>
              <circle r={isPrimary ? 8 : 6} style={riskStyles[risk]} />
              {isPrimary && <circle r={15} className="marker-halo" />}
            </g>
          </Marker>
        ))}
      </ComposableMap>
      {tooltip && <div className="map-tooltip">{tooltip}</div>}
    </div>
  );
};

export default SupplyChainMap;