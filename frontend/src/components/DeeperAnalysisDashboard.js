import React from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DeeperAnalysisDashboard = ({ analysisData }) => {
  if (!analysisData) {
    return <p>No analysis data available.</p>;
  }

  const { scores, inputs, rulesTriggered } = analysisData;

  const factors = Object.keys(scores);
  const values = Object.values(scores);

  const chartData = {
    labels: factors,
    datasets: [
      {
        label: 'Score',
        data: values,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Decision Factor Scores',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: -1,
        max: 1,
        ticks: {
          stepSize: 0.5,
        },
      },
    },
  };

  return (
    <div className="deeper-analysis-dashboard">
      <h3>Deeper Analysis</h3>
      <div className="dashboard-grid">
        <div className="chart-container">
          <h4>Factor Scores</h4>
          <div className="chart-wrapper">
            <Bar options={chartOptions} data={chartData} />
          </div>
        </div>

        <div className="json-container">
          {inputs && (
            <div className="inputs-section">
              <h4>📥 Input Factors</h4>
              <ul>
                <li><strong>Tariff Rate:</strong> {(inputs?.tariffRate * 100).toFixed(1)}%</li>
                <li><strong>Demand Signal:</strong> {inputs?.demandSignal?.toFixed(2)}</li>
                <li><strong>Inventory Level:</strong> {inputs?.inventoryLevel}</li>
                <li><strong>Sales Velocity:</strong> {inputs?.salesVelocity}</li>
                <li><strong>Days of Stock:</strong> {inputs?.daysOfStock?.toFixed(1)}</li>
                <li>
                  <strong>Weather Factor:</strong> {inputs?.weatherFactor}{' '}
                  {inputs?.weatherFactor > 0 ? '⚠️ Bad Weather' : '✔️ Normal'}
                </li>
              </ul>
            </div>
          )}
          <h4>Engine Inputs</h4>
          <ReactJson 
            src={inputs} 
            name={false}
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
              <li key={index} className="rule-item">
                <span className="rule-bullet">•</span> {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {analysisData.substitutes && analysisData.substitutes.length > 0 && (
        <div className="substitute-section">
          <h3>🛍️ Suggested Substitutes</h3>
          <ul className="substitute-list">
            {analysisData.substitutes.map((item, index) => (
              <li key={item.id} className="substitute-item">
                <strong>{item.name}</strong> (SKU: {item.sku}) – Similarity: {item.similarity}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DeeperAnalysisDashboard;
