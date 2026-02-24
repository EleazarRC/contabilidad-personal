import { useState } from 'react';
import MonthlyForecasts from './MonthlyForecasts';
import AnnualForecasts from './AnnualForecasts';

function Forecasts() {
  const [activeTab, setActiveTab] = useState('monthly');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#667eea' }}>📅 Previsiones</h2>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          📆 Mensuales
        </button>
        <button
          className={`tab ${activeTab === 'annual' ? 'active' : ''}`}
          onClick={() => setActiveTab('annual')}
        >
          📅 Anuales
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'monthly' ? <MonthlyForecasts /> : <AnnualForecasts />}
      </div>
    </div>
  );
}

export default Forecasts;
