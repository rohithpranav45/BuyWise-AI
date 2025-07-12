import React from 'react';
import { Bar } from 'react-chartjs-2';
// Correctly import from the library we installed
import ReactJson from '@uiw/react-json-view';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './DeeperAnalysisDashboard.css';

// Register Chart.js components - this is correct
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DeeperAnalysisDashboard = ({ analysisData }) => {
  // A safe fallback if no data is available yet
  if (!analysisData) {
    return (
      <div className="deeper-analysis-dashboard">
        <h3>Deeper Analysis</h3>
        <p>Awaiting analysis data...</p>
      </div>
    );
  }

  // Destructure with safe fallbacks
  const { 
    scores = {}, 
    inputs = {}, 
    rulesTriggered = [],
    substitutes = []
  } = analysisData;

  const chartData = {
    labels: Object.keys(scores),
    datasets: [
      {
        label: 'Score',
        data: Object.values(scores),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Decision Factor Scores' },
    },
    scales: { y: { beginAtZero: false, min: -1, max: 1 } },
  };

  return (
    <div className="deeper-analysis-dashboard">
      <h3>Deeper Analysis</h3>
      <div className="dashboard-grid">
        <div className="chart-container">
          <h4>Factor Scores</h4>
          <Bar options={chartOptions} data={chartData} />
        </div>
        <div className="json-container">
          <h4>Engine Inputs</h4>
          {/* 
            --- THE CRITICAL FIX ---
            The @uiw/react-json-view library uses the 'value' prop, not 'src'.
            We also provide a fallback object to prevent any possible crash.
          */}
          <ReactJson 
            value={inputs || { status: "No data" }}
            theme="monokai"
            collapsed={1}
            displayDataTypes={false}
            displayObjectSize={false}
            style={{ padding: '12px', borderRadius: '4px' }}
          />
        </div>
        <div className="rules-container">
          <h4>Rules Triggered ({rulesTriggered.length})</h4>
          <ul>
            {rulesTriggered.map((rule, index) => (
              <li key={index} className={rule.startsWith('RULE:') ? 'rule-item rule-highlight' : 'rule-item'}>
                {rule}
              </li>
            ))}
          </ul>
        </div>
        {/* Adds the substitutes display back in */}
        {substitutes && substitutes.length > 0 && (
          <div className="substitute-section">
            <h4>🛍️ Suggested Substitutes</h4>
            <ul className="substitute-list">
              {substitutes.map(item => <li key={item.id} className="substitute-item"><strong>{item.name}</strong> (Similarity: {(item.similarity * 100).toFixed(0)}%)</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeeperAnalysisDashboard;