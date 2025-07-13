import React from 'react';
import GaugeChart from 'react-gauge-chart';
import './AnalysisGauge.css';

const AnalysisGauge = ({ title, value }) => {
  return (
    <div className="gauge-card">
      <GaugeChart
        id={`gauge-${title}`}
        nrOfLevels={10}
        colors={['var(--color-success)', 'var(--color-warning)', 'var(--color-danger)']}
        arcWidth={0.3}
        percent={value} // Value should be 0 to 1
        textColor="var(--text-primary)"
        needleColor="#cccccc"
        needleBaseColor="#cccccc"
        formatTextValue={(val) => Math.round(val)} // Display as integer
        hideText={true} // Hide the default text, we'll make our own
      />
      <div className="gauge-label">{title}</div>
    </div>
  );
};

export default AnalysisGauge;