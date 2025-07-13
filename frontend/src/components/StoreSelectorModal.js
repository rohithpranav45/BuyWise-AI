import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { fetchStores } from '../api/client';
import './StoreSelectorModal.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const StoreSelectorModal = ({ onStoreSelect }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredStore, setHoveredStore] = useState(null);

  useEffect(() => {
    const getStores = async () => {
      try {
        const response = await fetchStores();
        setStores(response.data);
      } catch (error) {
        console.error("Could not fetch stores", error);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    getStores();
  }, []);

  return (
    <div className="modal-overlay">
      <div className={`modal-container ${loading ? 'loading' : 'loaded'}`}>
        <div className="modal-header">
          <h1>Store<span className="spark">IQ</span> Command Center</h1>
          <p>Select Your Operational Area to Continue</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <h3>Syncing with Walmart Global Network...</h3>
          </div>
        ) : (
          <div className="modal-body">
            <div className="map-panel">
              {/* --- vvvvvv THESE ARE THE FIXES FOR ALIGNMENT vvvvvv --- */}
              <ComposableMap
                projection="geoAlbersUsa"
                projectionConfig={{ scale: 1000 }} // Adjusted scale for a better fit
                style={{ width: "100%", height: "auto" }} // Forces responsive behavior
              >
              {/* --- ^^^^^^ END OF ALIGNMENT FIXES ^^^^^^ --- */}
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography key={geo.rsmKey} geography={geo} className="geography-style" />
                    ))
                  }
                </Geographies>
                {stores.map(store => (
                  <Marker key={store.id} coordinates={[store.lon, store.lat]}>
                    <g
                      className="store-marker"
                      onClick={() => onStoreSelect(store)}
                      onMouseEnter={() => setHoveredStore(store.id)}
                      onMouseLeave={() => setHoveredStore(null)}
                    >
                      {/* --- The halo is now first, so it's "underneath" the main dot --- */}
                      <circle r={15} className={`marker-halo ${hoveredStore === store.id ? 'active' : ''}`} />
                      <circle r={6} className="marker-circle" />
                    </g>
                  </Marker>
                ))}
              </ComposableMap>
            </div>
            <div className="list-panel">
              <h4>Available Stores ({stores.length})</h4>
              <div className="store-list">
                {stores.map(store => (
                  <button 
                    key={store.id} 
                    onClick={() => onStoreSelect(store)} 
                    className={`store-list-item ${hoveredStore === store.id ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredStore(store.id)}
                    onMouseLeave={() => setHoveredStore(null)}
                  >
                    <strong>{store.name}</strong>
                    <span>{store.city}, {store.state}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreSelectorModal;