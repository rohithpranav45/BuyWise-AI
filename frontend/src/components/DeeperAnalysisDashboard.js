import React from 'react';
import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';
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

// Chart.js components are registered once
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DeeperAnalysisDashboard = ({ analysisData }) => {
  // Safe fallback if the entire analysis object is missing
  if (!analysisData) {
    return (
      <div className="deeper-analysis-dashboard">
        <h3>Deeper Analysis</h3>
        <p className="loading-message">Awaiting analysis data...</p>
      </div>
    );
  }

  // Destructure with safe defaults for each property
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
        // Using the new primary blue from our design system
        backgroundColor: 'rgba(0, 76, 145, 0.7)', 
        borderColor: 'rgba(0, 76, 145, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bar chart is often easier to read for labels
    plugins: {
      legend: { display: false },
      title: {
        display: false, // Title is handled by the <h4> tag now
      },
    },
    scales: {
      x: {
        beginAtZero: false,
        min: -1,
        max: 1,
        grid: {
          color: '#e0e6ed', // Use a theme color for grid lines
        },
        ticks: {
          color: '#5a6a7b', // Use a theme color for labels
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#5a6a7b',
        },
      },
    },
  };

  return (
    <div className="deeper-analysis-dashboard">
      <h3>Deeper Analysis</h3>
      <div className="dashboard-grid">
        <div className="dashboard-card chart-container">
          <h4>Factor Scores</h4>
          <div className="chart-wrapper">
            <Bar options={chartOptions} data={chartData} />
          </div>
        </div>

        <div className="dashboard-card json-container">
          <h4>Engine Inputs</h4>
          <div className="json-view-wrapper">
            <ReactJson 
              value={inputs || { status: "No data available." }}
              theme="vscode" /* Changed from "monokai" to a light theme */
              collapsed={1}
              displayDataTypes={false}
              displayObjectSize={false}
              name={false}
              style={{
                fontFamily: "var(--font-family-base)", // Use our app's font
                fontSize: "0.9rem",
              }}
            />
          </div>
        </div>

        <div className="dashboard-card rules-container">
          <h4>Engine Log ({rulesTriggered.length})</h4>
          <ul>
            {rulesTriggered.map((rule, index) => (
              <li 
                key={index} 
                className={rule.startsWith('RULE:') ? 'rule-highlight' : ''}
              >
                {rule}
              </li>
            ))}
          </ul>
        </div>
        
        {substitutes && substitutes.length > 0 && (
          <div className="dashboard-card substitute-section">
            <h4>🛍️ Suggested Substitutes</h4>
            <ul className="substitute-list">
              {substitutes.map((item) => (
                <li key={item.id} className="substitute-item">
                  <strong>{item.name}</strong> (SKU: {item.sku})
                  <span>Similarity: <strong>{(item.similarity * 100).toFixed(0)}%</strong></span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

DeeperAnalysisDashboard.propTypes = {
  analysisData: PropTypes.object,
};

export default DeeperAnalysisDashboard;